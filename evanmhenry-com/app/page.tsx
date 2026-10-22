import Image from 'next/image'
import { SiteShell } from '@/components/site-shell'
import { ProjectList } from '@/components/project-list'
import { BookList } from '@/components/book-list'
import { Arrow } from '@/components/arrow'

export default function Home() {
  return <SiteShell>
    <section className="intro enter" aria-labelledby="name">
      <div className="identity"><Image className="portrait" src="/images/evan-henry.jpg" alt="Portrait of Evan Henry" width={44} height={44} priority sizes="44px" />
        <div><h1 id="name">Evan Henry</h1><p className="role">Software builder · Spade Software</p></div>
      </div>
      <p>I build thoughtful software at <a href="https://spadehq.com" target="_blank" rel="noopener noreferrer">Spade Software</a>. I care about the details: how a product feels, how quickly it works, and how much simpler it makes someone’s day.</p>
      <p>This is my corner of the internet — a collection of projects I’m building, books I’m reading, and things I’m learning. Find me on <a href="https://github.com/evanmhenry">GitHub</a> or say hello at <a href="https://www.instagram.com/evanmhenry/">@evanmhenry</a>.</p>
    </section>
    <section id="projects" className="projects-section enter" aria-labelledby="projects-title"><h2 id="projects-title">Projects</h2><ProjectList /></section>
    <section id="reading" className="reading-section enter" aria-labelledby="reading-title"><h2 id="reading-title">Reading &amp; notes</h2><BookList /></section>
    <section className="contact-section enter" aria-labelledby="contact-title"><h2 id="contact-title">Let’s make something useful.</h2><p>Have a project in mind, or just want to trade ideas?</p><a className="contact-link" href="https://github.com/evanmhenry">Say hello on GitHub <Arrow diagonal /></a></section>
  </SiteShell>
}
