import Link from 'next/link'
import { books } from '@/content/books'
import { Arrow } from './arrow'

export function BookList() {
  return <ul className="book-list">{books.map(book => <li key={book.slug}>
    <Link className="book-row" href={`/book-summaries/${book.slug}/`}>
      <span className="row-copy"><span className="row-title">{book.title}</span><span className="row-description">{book.author} <span aria-hidden="true">·</span> Book summary</span></span>
      <span className="row-arrow"><Arrow /></span>
    </Link>
  </li>)}</ul>
}
