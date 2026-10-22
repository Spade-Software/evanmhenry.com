import Image from 'next/image'
import { SiteShell } from '@/components/site-shell'
import { ProjectList } from '@/components/project-list'
import { BookList } from '@/components/book-list'
import { Arrow } from '@/components/arrow'
import { InlineLink } from '@/components/inline-link'
import { SocialLinks } from '@/components/social-links'

export default function Home() {
  return <SiteShell>
    <section className="intro enter" aria-labelledby="name">
      <div className="identity"><Image className="portrait" src="/images/evan-henry-portrait.jpg" alt="Portrait of Evan Henry" width={44} height={44} priority sizes="44px" />
        <div><h1 id="name">Evan Henry</h1><p className="role">Software builder · Spade Software</p></div>
      </div>
      <p>I build thoughtful software at <InlineLink href="https://spadehq.com" image="/images/spade-software-icon.svg">Spade Software</InlineLink>. I care about the details: how a product feels, how quickly it works, and how much simpler it makes someone’s day.</p>
      <p>This is my corner of the internet — a collection of projects I’m building, books I’m reading, and things I’m learning. Find me on <InlineLink href="https://github.com/evanmhenry" image="/images/github.svg">GitHub</InlineLink> or say hello at <InlineLink href="https://www.instagram.com/evanmhenry/" image="/images/instagram.svg">@evanmhenry</InlineLink>.</p>
    </section>
    <section id="projects" className="projects-section enter" aria-labelledby="projects-title"><h2 id="projects-title">Projects</h2><ProjectList /></section>
    <section id="reading" className="reading-section enter" aria-labelledby="reading-title"><h2 id="reading-title">Reading &amp; notes</h2><BookList /></section>
    <SocialLinks />
    <section className="contact-section enter" aria-labelledby="contact-title"><h2 id="contact-title">Let’s make something useful.</h2><p>Have a project in mind, or just want to trade ideas?</p><a className="contact-link" href="https://github.com/evanmhenry">Say hello on GitHub <Arrow diagonal /></a></section>
  </SiteShell>
}
