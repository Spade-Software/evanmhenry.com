import type { Metadata } from 'next'
import '@fontsource-variable/inter'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://evanmhenry.com'),
  title: { default: 'Evan Henry — Software builder', template: '%s · Evan Henry' },
  description: 'Thoughtful software, independent projects, and notes on what I’m learning. The personal corner of Evan Henry, builder at Spade Software.',
  openGraph: { type: 'website', siteName: 'Evan Henry', images: [{ url: '/images/evan-henry-portrait.jpg', width: 886, height: 886, alt: 'Evan Henry' }] },
  twitter: { card: 'summary', creator: '@evanmhenry1' },
  icons: { icon: '/icon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a>{children}</body></html>
}
