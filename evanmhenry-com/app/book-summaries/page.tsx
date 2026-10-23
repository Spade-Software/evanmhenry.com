import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteShell } from '@/components/site-shell'
import { BookList } from '@/components/book-list'
export const metadata: Metadata = { title: 'Book summaries', description: 'Notes and takeaways from books I’m reading.' }
export default function Reading() {
  return <SiteShell><div className="enter"><Link href="/" className="back-link">← Back home</Link><header className="article-header"><p className="eyebrow">Reading &amp; notes</p><h1 className="page-title">A few good books.</h1><p>Ideas I’m keeping, in my own notes.</p></header><BookList /></div></SiteShell>
}
