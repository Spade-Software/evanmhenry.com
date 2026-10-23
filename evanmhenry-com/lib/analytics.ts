export type AnalyticsConsent = 'granted' | 'denied'
export const consentStorageKey = 'evan-analytics-consent-v1'

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
