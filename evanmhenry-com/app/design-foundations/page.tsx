import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Design foundations' }

export default function DesignFoundations() {
  return <main id="main" tabIndex={-1} className="container main-content foundation-page"><Link className="back-link" href="/">← Evan Henry</Link>
    <header className="article-header"><h1 className="page-title">Design foundations</h1><p>The type, spacing, color, and motion behind this site.</p></header>
    <div className="prose"><h2>Type</h2><p>Inter. A simple scale: 14, 16, 20, 32, and 40 pixels.</p>
      <h2>Color</h2><p>Near-black surfaces, white text, muted supporting copy. Color comes from the work.</p>
      <h2>Spacing</h2><p>4, 8, 12, 16, 24, 32, 48, 64, and 96 pixels.</p>
      <h2>Motion</h2><p>A small rise, a soft fade, and a stagger between words. Reduced-motion preferences keep everything still.</p>
      <h2>Details</h2><p>Quiet underlines. Rounded imagery. Enough space to see the work.</p>
    </div>
  </main>
}
