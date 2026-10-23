export type AnalyticsConsent = 'granted' | 'denied'
export const consentStorageKey = 'evan-analytics-consent-v1'

const consentChangeEvent = 'analytics-consent-change'
let sessionConsent: AnalyticsConsent | undefined
const configuredMeasurementIds = new Set<string>()
const sdkListeners = new Map<string, Set<() => void>>()

export function analyticsAllowed(measurementId: string, hostname: string, production: boolean) {
  return production && /^G-[A-Z0-9]+$/.test(measurementId) &&
    ['evanmhenry.com', 'www.evanmhenry.com'].includes(hostname)
}

export function readAnalyticsConsent(storage: () => Pick<Storage, 'getItem'>): AnalyticsConsent | null {
  try {
    const value = storage().getItem(consentStorageKey)
    return value === 'granted' || value === 'denied' ? value : null
  } catch { return null }
}

export function subscribeAnalyticsConsent(onChange: () => void, measurementId?: string) {
  const notify = (event: Event) => {
    if (event.type === 'storage') {
      const storageEvent = event as StorageEvent
      if (storageEvent.key !== consentStorageKey && storageEvent.key !== null) return
      sessionConsent = undefined
      if (measurementId) {
        const flags = window as unknown as Record<string, unknown>
        flags[`ga-disable-${measurementId}`] = getAnalyticsConsent() !== 'granted'
      }
    }
    onChange()
  }
  window.addEventListener('storage', notify)
  window.addEventListener(consentChangeEvent, notify)
  return () => {
    window.removeEventListener('storage', notify)
    window.removeEventListener(consentChangeEvent, notify)
  }
}

export function isAnalyticsSdkReady(measurementId: string) {
  return configuredMeasurementIds.has(measurementId)
}

export function subscribeAnalyticsSdk(measurementId: string, onChange: () => void) {
  const listeners = sdkListeners.get(measurementId) ?? new Set<() => void>()
  listeners.add(onChange)
  sdkListeners.set(measurementId, listeners)
  return () => {
    listeners.delete(onChange)
    if (listeners.size === 0) sdkListeners.delete(measurementId)
  }
}

export function markAnalyticsSdkReady(measurementId: string) {
  if (configuredMeasurementIds.has(measurementId)) return
  configuredMeasurementIds.add(measurementId)
  sdkListeners.get(measurementId)?.forEach(listener => listener())
}

export function configureAnalyticsSdk(measurementId: string, gtag: (...args: unknown[]) => void) {
  const deniedAds = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' }
  if (isAnalyticsSdkReady(measurementId)) {
    gtag('consent', 'update', { ...deniedAds, analytics_storage: 'granted' })
    return
  }
  gtag('consent', 'default', { ...deniedAds, analytics_storage: 'denied' })
  gtag('consent', 'update', { ...deniedAds, analytics_storage: 'granted' })
  gtag('js', new Date())
  gtag('config', measurementId, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  })
  markAnalyticsSdkReady(measurementId)
}

export function getAnalyticsConsent(): AnalyticsConsent | null {
  return sessionConsent ?? readAnalyticsConsent(() => window.localStorage)
}

export function publishAnalyticsConsentChange(consent: AnalyticsConsent) {
  sessionConsent = consent
  window.dispatchEvent(new Event(consentChangeEvent))
}

export function startProjectTracking(
  gtag: (...args: unknown[]) => void,
  isConsentGranted: () => boolean,
  doc: Document = document,
  createObserver: typeof IntersectionObserver = IntersectionObserver,
) {
  let active = true
  const viewed = new Set<Element>()
  const timers = new Map<Element, ReturnType<typeof setTimeout>>()
  const clear = (element: Element) => {
    const timer = timers.get(element)
    if (timer !== undefined) clearTimeout(timer)
    timers.delete(element)
  }
  const click = (event: MouseEvent) => {
    if (!active || !isConsentGranted()) return
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[data-analytics-event]') : null
    if (!link) return
    const name = link.dataset.analyticsEvent
    if (name !== 'project_click' && name !== 'social_click') return
    gtag('event', name, {
      link_name: link.dataset.analyticsName,
      placement: link.dataset.analyticsPlacement,
      destination_host: new URL(link.href).hostname,
    })
  }
  const observer = new createObserver(entries => entries.forEach(entry => {
    if (!active || !isConsentGranted() || !entry.isIntersecting || entry.intersectionRatio < .5 || doc.hidden) return clear(entry.target)
    if (viewed.has(entry.target) || timers.has(entry.target)) return
    timers.set(entry.target, setTimeout(() => {
      if (active && isConsentGranted() && !doc.hidden) {
        gtag('event', 'project_view', { project_name: (entry.target as HTMLElement).dataset.project })
        viewed.add(entry.target)
        observer.unobserve(entry.target)
      }
      timers.delete(entry.target)
    }, 1000))
  }), { threshold: [0, .5] })
  const projects = [...doc.querySelectorAll<HTMLElement>('[data-project]')]
  const visibility = () => {
    timers.forEach((_, element) => clear(element))
    projects.forEach(element => { observer.unobserve(element); if (!viewed.has(element)) observer.observe(element) })
  }
  doc.addEventListener('click', click, true)
  projects.forEach(element => observer.observe(element))
  doc.addEventListener('visibilitychange', visibility)
  return () => {
    active = false
    observer.disconnect()
    timers.forEach(timer => clearTimeout(timer))
    timers.clear()
    doc.removeEventListener('click', click, true)
    doc.removeEventListener('visibilitychange', visibility)
  }
}
