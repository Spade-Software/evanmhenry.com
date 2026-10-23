import assert from 'node:assert/strict'
import { test } from 'node:test'
import { analyticsAllowed, configureAnalyticsSdk, consentStorageKey, getAnalyticsConsent, isAnalyticsSdkReady, publishAnalyticsConsentChange, readAnalyticsConsent, startProjectTracking, subscribeAnalyticsConsent, subscribeAnalyticsSdk } from '../lib/analytics.ts'

test('only production first-party domains with a valid GA4 ID enable collection', () => {
  const id = 'G-ABC1234567'
  assert.equal(analyticsAllowed(id, 'evanmhenry.com', true), true)
  assert.equal(analyticsAllowed(id, 'www.evanmhenry.com', true), true)
  for (const host of ['localhost', '127.0.0.1', 'nice-sea-version2.azurestaticapps.net', 'evanmhenry.com.attacker.test', 'preview.evanmhenry.com']) {
    assert.equal(analyticsAllowed(id, host, true), false)
  }
  assert.equal(analyticsAllowed(id, 'evanmhenry.com', false), false)
  for (const bad of ['', 'UA-123', 'G-<script>', 'G-ABC&foo=bar']) {
    assert.equal(analyticsAllowed(bad, 'evanmhenry.com', true), false)
  }
})

test('consent is explicit and blocked storage never assumes permission', () => {
  assert.equal(readAnalyticsConsent(() => ({ getItem: () => 'granted' })), 'granted')
  assert.equal(readAnalyticsConsent(() => ({ getItem: () => 'denied' })), 'denied')
  for (const value of [null, 'true', 'false', 'invalid']) {
    assert.equal(readAnalyticsConsent(() => ({ getItem: () => value })), null)
  }
  assert.equal(readAnalyticsConsent(() => { throw new Error('Storage is blocked') }), null)
})

test('SDK readiness is published only after consent and config commands are queued', () => {
  const id = `G-TEST${Date.now()}`
  const calls = []
  let notifiedReady = false
  const unsubscribe = subscribeAnalyticsSdk(id, () => { notifiedReady = isAnalyticsSdkReady(id) })
  configureAnalyticsSdk(id, (...args) => {
    assert.equal(isAnalyticsSdkReady(id), false)
    calls.push(args)
  })
  assert.deepEqual(calls.map(([command]) => command), ['consent', 'consent', 'js', 'config'])
  assert.deepEqual(calls[0][2], { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' })
  assert.deepEqual(calls[1][2], { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' })
  assert.equal(calls[3][1], id)
  assert.equal(isAnalyticsSdkReady(id), true)
  assert.equal(notifiedReady, true)
  configureAnalyticsSdk(id, (...args) => calls.push(args))
  assert.deepEqual(calls.map(([command]) => command), ['consent', 'consent', 'js', 'config', 'consent'])
  unsubscribe()
})

test('in-session consent still works when browser storage is unavailable', () => {
  const originalWindow = globalThis.window
  const fakeWindow = new EventTarget()
  Object.defineProperty(fakeWindow, 'localStorage', { get() { throw new Error('Storage is blocked') } })
  globalThis.window = fakeWindow
  try {
    publishAnalyticsConsentChange('granted')
    assert.equal(getAnalyticsConsent(), 'granted')
    publishAnalyticsConsentChange('denied')
    assert.equal(getAnalyticsConsent(), 'denied')
  } finally {
    globalThis.window = originalWindow
  }
})

test('consent subscriptions cleanly resubscribe through StrictMode-style effect replay', () => {
  const originalWindow = globalThis.window
  const fakeWindow = new EventTarget()
  const registrations = new Map()
  const add = fakeWindow.addEventListener.bind(fakeWindow)
  const remove = fakeWindow.removeEventListener.bind(fakeWindow)
  fakeWindow.addEventListener = (name, callback) => {
    const callbacks = registrations.get(name) ?? new Set()
    callbacks.add(callback)
    registrations.set(name, callbacks)
    add(name, callback)
  }
  fakeWindow.removeEventListener = (name, callback) => {
    registrations.get(name)?.delete(callback)
    remove(name, callback)
  }
  globalThis.window = fakeWindow
  try {
    const replayCleanup = subscribeAnalyticsConsent(() => {})
    replayCleanup()
    const activeCleanup = subscribeAnalyticsConsent(() => {})
    assert.equal(registrations.get('storage').size, 1)
    assert.equal(registrations.get('analytics-consent-change').size, 1)
    activeCleanup()
    assert.equal(registrations.get('storage').size, 0)
    assert.equal(registrations.get('analytics-consent-change').size, 0)
  } finally {
    globalThis.window = originalWindow
  }
})

test('withdrawal blocks queued project views and clicks synchronously', () => {
  const element = { dataset: { project: 'Atlas' } }
  const secondElement = { dataset: { project: 'Beacon' } }
  let observerCallback
  let disconnected = false
  let observed = 0
  const timerCallbacks = []
  const calls = []
  const listeners = new Map()
  const originalWindow = globalThis.window
  const originalElement = globalThis.Element
  const fakeWindow = new EventTarget()
  const values = new Map([[consentStorageKey, 'granted']])
  Object.defineProperty(fakeWindow, 'localStorage', { value: { getItem: key => values.get(key) ?? null } })
  globalThis.window = fakeWindow
  const originalSetTimeout = globalThis.setTimeout
  const originalClearTimeout = globalThis.clearTimeout
  globalThis.setTimeout = callback => { timerCallbacks.push(callback); return timerCallbacks.length }
  globalThis.clearTimeout = () => {}
  const doc = {
    hidden: false,
    querySelectorAll: () => [element, secondElement],
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: name => listeners.delete(name),
  }
  class FakeElement {
    constructor(link) { this.link = link }
    closest() { return this.link }
  }
  class Observer {
    constructor(callback) { observerCallback = callback }
    observe() { observed += 1 }
    unobserve() {}
    disconnect() { disconnected = true }
  }
  try {
    const unsubscribe = subscribeAnalyticsConsent(() => {}, 'G-TESTSTORAGE')
    publishAnalyticsConsentChange('granted')
    const stop = startProjectTracking((...args) => calls.push(args), () => getAnalyticsConsent() === 'granted', doc, Observer)
    observerCallback([
      { isIntersecting: true, intersectionRatio: .75, target: element },
      { isIntersecting: true, intersectionRatio: .75, target: secondElement },
    ])
    assert.equal(observed, 2)
    timerCallbacks[0]()
    const link = { dataset: { analyticsEvent: 'project_click', analyticsName: 'Atlas', analyticsPlacement: 'projects' }, href: 'https://example.test/atlas' }
    globalThis.Element = FakeElement
    listeners.get('click')({ target: new FakeElement(link) })
    globalThis.Element = originalElement
    assert.deepEqual(calls.map(([kind, name]) => [kind, name]), [['event', 'project_view'], ['event', 'project_click']])

    // A cross-tab storage event updates the consent snapshot before React's effect cleanup.
    values.set(consentStorageKey, 'denied')
    const storageEvent = new Event('storage')
    Object.defineProperty(storageEvent, 'key', { value: consentStorageKey })
    fakeWindow.dispatchEvent(storageEvent)
    assert.equal(fakeWindow['ga-disable-G-TESTSTORAGE'], true)
    timerCallbacks[1]()
    listeners.get('click')({ target: new FakeElement(link) })
    assert.equal(calls.length, 2)

    stop()
    unsubscribe()
    assert.equal(disconnected, true)
    assert.equal(listeners.size, 0)
  } finally {
    globalThis.window = originalWindow
    globalThis.Element = originalElement
    globalThis.setTimeout = originalSetTimeout
    globalThis.clearTimeout = originalClearTimeout
  }
})
