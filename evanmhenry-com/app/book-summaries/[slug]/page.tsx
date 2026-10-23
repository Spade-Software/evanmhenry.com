import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Markdown from 'react-markdown'
import { books } from '@/content/books'
import { SiteShell } from '@/components/site-shell'
export const dynamicParams = false
export function generateStaticParams() { return books.map(({ slug }) => ({ slug })) }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const book = books.find(book => book.slug === slug)
  return { title: book?.title ?? 'Book not found', description: book ? `Evan Henry’s notes on ${book.title} by ${book.author}.` : undefined }
}
export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const book = books.find(book => book.slug === slug)
  if (!book) notFound()
  return <SiteShell><article className="enter"><Link href="/book-summaries/" className="back-link">← All book summaries</Link>
    <header className="article-header"><p className="eyebrow">Book summary</p><h1 className="page-title">{book.title}</h1><p>{book.author}</p></header>
    <div className="prose"><Markdown components={{ h1: ({ children }) => <h2>{children}</h2> }}>{book.content}</Markdown></div>
  </article></SiteShell>
}
