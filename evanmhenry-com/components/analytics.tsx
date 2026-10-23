'use client'

import Script from 'next/script'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { analyticsAllowed, configureAnalyticsSdk, consentStorageKey, getAnalyticsConsent, isAnalyticsSdkReady, publishAnalyticsConsentChange, startProjectTracking, subscribeAnalyticsConsent, subscribeAnalyticsSdk, type AnalyticsConsent } from '@/lib/analytics'
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
  return <AnalyticsInstance key={measurementId} measurementId={measurementId} />
}

function AnalyticsInstance({ measurementId }: { measurementId: string }) {
  const pathname = usePathname()
  const isEligible = useCallback(() => analyticsAllowed(measurementId, window.location.hostname, process.env.NODE_ENV === 'production'), [measurementId])
  const eligible = useSyncExternalStore(() => () => {}, isEligible, () => false)
  const subscribeConsent = useCallback((onChange: () => void) => subscribeAnalyticsConsent(onChange, measurementId), [measurementId])
  const consent = useSyncExternalStore(subscribeConsent,
    getAnalyticsConsent, () => null)
  const sdkReady = useSyncExternalStore(
    useCallback((onChange: () => void) => subscribeAnalyticsSdk(measurementId, onChange), [measurementId]),
    useCallback(() => isAnalyticsSdkReady(measurementId), [measurementId]), () => false,
  )
  const [settingsRequested, setSettingsRequested] = useState(false)
  const consentHeading = useRef<HTMLHeadingElement>(null)
  const settingsButton = useRef<HTMLButtonElement>(null)
  const focusConsentOnOpen = useRef(false)
  const focusSettingsOnClose = useRef(false)
  const settingsOpen = consent === null || settingsRequested
  const initialized = eligible && consent === 'granted' && sdkReady

  useEffect(() => {
    if (!eligible) return
    // Disable automatic Google events immediately when consent is withdrawn.
    const flags = window as unknown as Record<string, unknown>
    flags[`ga-disable-${measurementId}`] = consent !== 'granted'
    if (consent !== 'granted') {
      window.gtag?.('consent', 'update', { ...deniedAds, analytics_storage: 'denied' })
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
    configureAnalyticsSdk(measurementId, window.gtag)
  }, [eligible, consent, measurementId])

  useEffect(() => {
    if (!initialized) return
    const stopTracking = startProjectTracking(
      (...args) => window.gtag?.(...args),
      () => getAnalyticsConsent() === 'granted',
    )
    return () => stopTracking()
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
    // Flip Google's disable flag before publishing consent so outstanding callbacks see the new choice.
    ;(window as unknown as Record<string, unknown>)[`ga-disable-${measurementId}`] = next !== 'granted'
    try { localStorage.setItem(consentStorageKey, next) } catch { /* Keep the choice for this visit. */ }
    publishAnalyticsConsentChange(next)
    focusSettingsOnClose.current = true
    setSettingsRequested(false)
  }

  if (!eligible) return null
  return <>
    {initialized && <Script id="google-analytics" src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />}
    {settingsOpen ? <section className="analytics-consent" aria-labelledby="analytics-title" aria-describedby="analytics-description">
      <h2 id="analytics-title" ref={consentHeading} tabIndex={-1} aria-describedby="analytics-description">Site analytics</h2>
      <p id="analytics-description">Allow Google Analytics to measure page visits and project clicks? Your choice is saved on this device.</p>
      <Link className="analytics-privacy-link" href="/privacy/">Analytics privacy</Link>
      <div><button type="button" onClick={() => choose('denied')}>Decline</button><button type="button" onClick={() => choose('granted')}>Allow analytics</button></div>
    </section> : <button ref={settingsButton} className="analytics-settings" type="button" onClick={() => { focusConsentOnOpen.current = true; setSettingsRequested(true) }}>Analytics settings</button>}
  </>
}
