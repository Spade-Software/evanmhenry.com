import assert from 'node:assert/strict'
import { test } from 'node:test'
import { analyticsAllowed, readAnalyticsConsent } from '../lib/analytics.ts'

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
