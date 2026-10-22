import Image from 'next/image'
import { SiteShell } from '@/components/site-shell'
import { ProjectList } from '@/components/project-list'
import { InlineLink } from '@/components/inline-link'

export default function Home() {
  return <SiteShell>
    <section className="intro enter" aria-labelledby="name">
      <div className="identity"><Image className="portrait" src="/images/evan-henry-portrait.jpg" alt="Portrait of Evan Henry" width={44} height={44} priority sizes="44px" />
        <div><h1 id="name">Evan Henry</h1><p className="role">Software builder · Spade Software</p></div>
      </div>
      <p>I build thoughtful software at <InlineLink href="https://spadehq.com" image="/images/spade-square-light.webp">Spade Software</InlineLink>. I care about the details: how a product feels, how quickly it works, and how much simpler it makes someone’s day.</p>
      <p>This is my corner of the internet — a collection of projects I’m building and things I’m exploring. Find me on <InlineLink href="https://github.com/evanmhenry" image="/images/github.svg">GitHub</InlineLink>.</p>
    </section>
    <section id="projects" className="projects-section enter" aria-labelledby="projects-title"><h2 id="projects-title">Projects</h2><ProjectList /></section>
  </SiteShell>
}
