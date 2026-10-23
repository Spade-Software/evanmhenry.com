'use client'

import { useEffect, useRef, type ReactNode } from 'react'

export function PortfolioFrame({ intro, children }: { intro: ReactNode; children: ReactNode }) {
  const root = useRef<HTMLElement>(null)
  const scroller = useRef<HTMLElement>(null)
  useEffect(() => {
    const page = root.current
    const scroll = scroller.current
    if (!page || !scroll) return
    const edges = () => {
      scroll.classList.toggle('has-before', scroll.scrollTop > 3)
      scroll.classList.toggle('has-more', scroll.scrollHeight - scroll.clientHeight - scroll.scrollTop > 3)
    }
    const resize = new ResizeObserver(edges)
    resize.observe(scroll)
    scroll.addEventListener('scroll', edges, { passive: true })
    scroll.addEventListener('load', edges, true)
    edges()
    const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return
      reveal.unobserve(entry.target)
      entry.target.classList.add('is-visible')
    }), { threshold: .12 })
    page.querySelectorAll('[data-project]').forEach(project => reveal.observe(project))
    return () => {
      resize.disconnect()
      reveal.disconnect()
      scroll.removeEventListener('scroll', edges)
      scroll.removeEventListener('load', edges, true)
    }
  }, [])
  return <main id="main" tabIndex={-1} ref={root} className="portfolio-page"><div className="portfolio-layout">
    <aside className="portfolio-intro intro">{intro}</aside>
    <section ref={scroller} className="portfolio-work" aria-label="Selected projects" tabIndex={0}>{children}</section>
  </div></main>
}
