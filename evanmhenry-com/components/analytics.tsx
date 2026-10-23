'use client'

import Script from 'next/script'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { analyticsAllowed, consentStorageKey, readAnalyticsConsent, type AnalyticsConsent } from '@/lib/analytics'
import './analytics.css'

type GoogleTag = (...args: unknown[]) => void

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: GoogleTag
  }
}

const deniedAds = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' }

export function Analytics({ measurementId }: { measurementId: string }) {
  const [eligible, setEligible] = useState(false)
  const [consent, setConsent] = useState<AnalyticsConsent | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const started = useRef(false)
  const consentHeading = useRef<HTMLHeadingElement>(null)
  const settingsButton = useRef<HTMLButtonElement>(null)
  const focusConsentOnOpen = useRef(false)
  const focusSettingsOnClose = useRef(false)
  const pathname = usePathname()

  useEffect(() => {
    if (!analyticsAllowed(measurementId, location.hostname, process.env.NODE_ENV === 'production')) return
    setEligible(true)
    const saved = readAnalyticsConsent(() => localStorage)
    setConsent(saved)
    setSettingsOpen(saved === null)
    const sync = (event: StorageEvent) => {
      if (event.key !== consentStorageKey && event.key !== null) return
      const next = readAnalyticsConsent(() => localStorage)
      setConsent(next)
      setSettingsOpen(next === null)
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [measurementId])

  useEffect(() => {
    if (!eligible) return
    // Disable automatic Google events immediately when consent is withdrawn.
    const flags = window as unknown as Record<string, unknown>
    flags[`ga-disable-${measurementId}`] = consent !== 'granted'
    if (consent !== 'granted') {
      window.gtag?.('consent', 'update', { ...deniedAds, analytics_storage: 'denied' })
      setInitialized(false)
      for (const cookie of document.cookie.split(';')) {
        const name = cookie.trim().split('=')[0]
        if (!/^_ga(?:_|$)/.test(name)) continue
        for (const domain of ['', '; domain=evanmhenry.com', '; domain=.evanmhenry.com', '; domain=www.evanmhenry.com']) {
          document.cookie = `${name}=; Max-Age=0; path=/${domain}; SameSite=Lax; Secure`
        }
      }
      return
    }
    window.dataLayer ??= []
    window.gtag ??= function () { window.dataLayer!.push(arguments) }
    if (!started.current) {
      window.gtag('consent', 'default', { ...deniedAds, analytics_storage: 'denied' })
      window.gtag('consent', 'update', { ...deniedAds, analytics_storage: 'granted' })
      window.gtag('js', new Date())
      window.gtag('config', measurementId, {
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      })
      started.current = true
    } else {
      window.gtag('consent', 'update', { ...deniedAds, analytics_storage: 'granted' })
    }
    setInitialized(true)
  }, [eligible, consent, measurementId])

  useEffect(() => {
    if (!initialized || consent !== 'granted') return
    const click = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[data-analytics-event]') : null
      if (!link) return
      const name = link.dataset.analyticsEvent
      if (name !== 'project_click' && name !== 'social_click') return
      window.gtag?.('event', name, {
        link_name: link.dataset.analyticsName,
        placement: link.dataset.analyticsPlacement,
        destination_host: new URL(link.href).hostname,
      })
    }
    document.addEventListener('click', click, true)
    const viewed = new Set<Element>()
    const timers = new Map<Element, ReturnType<typeof setTimeout>>()
    const clear = (element: Element) => {
      const timer = timers.get(element)
      if (timer) clearTimeout(timer)
      timers.delete(element)
    }
    // Viewport observation includes clipping by the independently scrolling project rail.
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting || entry.intersectionRatio < .5 || document.hidden) return clear(entry.target)
      if (viewed.has(entry.target) || timers.has(entry.target)) return
      timers.set(entry.target, setTimeout(() => {
        if (!document.hidden) {
          window.gtag?.('event', 'project_view', { project_name: (entry.target as HTMLElement).dataset.project })
          viewed.add(entry.target)
          observer.unobserve(entry.target)
        }
        timers.delete(entry.target)
      }, 1000))
    }), { threshold: [0, .5] })
    const projects = [...document.querySelectorAll<HTMLElement>('[data-project]')]
    const visibility = () => {
      timers.forEach((_, element) => clear(element))
      projects.forEach(element => { observer.unobserve(element); if (!viewed.has(element)) observer.observe(element) })
    }
    projects.forEach(element => observer.observe(element))
    document.addEventListener('visibilitychange', visibility)
    return () => {
      observer.disconnect()
      timers.forEach(clearTimeout)
      document.removeEventListener('click', click, true)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [initialized, consent, pathname])

  useEffect(() => {
    if (settingsOpen && focusConsentOnOpen.current) {
      focusConsentOnOpen.current = false
      consentHeading.current?.focus()
    } else if (!settingsOpen && focusSettingsOnClose.current) {
      focusSettingsOnClose.current = false
      settingsButton.current?.focus()
    }
  }, [settingsOpen])

  function choose(next: AnalyticsConsent) {
    // Block Google's own automatic events synchronously on decline, before the next effect.
    ;(window as unknown as Record<string, unknown>)[`ga-disable-${measurementId}`] = next !== 'granted'
    try { localStorage.setItem(consentStorageKey, next) } catch { /* Keep the choice for this visit. */ }
    setConsent(next)
    focusSettingsOnClose.current = true
    setSettingsOpen(false)
  }

  if (!eligible) return null
  return <>
    {initialized && consent === 'granted' && <Script id="google-analytics" src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />}
    {settingsOpen ? <section className="analytics-consent" aria-labelledby="analytics-title" aria-describedby="analytics-description">
      <h2 id="analytics-title" ref={consentHeading} tabIndex={-1} aria-describedby="analytics-description">Site analytics</h2>
      <p id="analytics-description">Allow Google Analytics to measure page visits and project clicks? Your choice is saved on this device.</p>
      <Link className="analytics-privacy-link" href="/privacy/">Analytics privacy</Link>
      <div><button type="button" onClick={() => choose('denied')}>Decline</button><button type="button" onClick={() => choose('granted')}>Allow analytics</button></div>
    </section> : <button ref={settingsButton} className="analytics-settings" type="button" onClick={() => { focusConsentOnOpen.current = true; setSettingsOpen(true) }}>Analytics settings</button>}
  </>
}
