import Link from 'next/link'
import { SiteShell } from '@/components/site-shell'
export default function NotFound() {
  return <SiteShell><div className="article-header"><p className="eyebrow">404</p><h1 className="page-title">A little off the path.</h1><p>This page couldn’t be found.</p><Link href="/" className="back-link">← Back home</Link></div></SiteShell>
}
