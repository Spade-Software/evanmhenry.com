import type { Metadata } from 'next'
import '@fontsource-variable/inter'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://evanmhenry.com'),
  title: { default: 'Evan Henry — Software builder', template: '%s · Evan Henry' },
  description: 'Projects and software by Evan Henry. Design, building, jiu-jitsu, MMA, lifting, health and fitness.',
  openGraph: { type: 'website', siteName: 'Evan Henry', images: [{ url: '/images/evan-henry-portrait.jpg', width: 886, height: 886, alt: 'Evan Henry' }] },
  twitter: { card: 'summary', creator: '@evanmhenry1' },
  icons: { icon: { url: '/images/evan-henry-portrait.jpg', type: 'image/jpeg', sizes: '886x886' }, apple: '/images/evan-henry-portrait.jpg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a>{children}</body></html>
}
