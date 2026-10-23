import Image from 'next/image'
import type { CSSProperties } from 'react'
import { PortfolioFrame } from '@/components/portfolio-frame'
import { ProjectGallery } from '@/components/project-gallery'
import { InlineLink } from '@/components/inline-link'
import { SocialLinks } from '@/components/social-links'
import './portfolio.css'

const delay = (milliseconds: number) => ({ '--t': `${milliseconds}ms` }) as CSSProperties

export default function Home() {
  return <PortfolioFrame intro={<>
    <div className="identity platform-enter"><Image className="portrait" src="/images/evan-henry-portrait.jpg" alt="Evan Henry" width={44} height={44} priority sizes="44px" />
      <div><h1>Evan Henry</h1><p className="role">Co-founder at Spade</p></div>
    </div>
    <h2 className="portfolio-headline">{'What I’m building.'.split(' ').map((word, index) => <span key={word}>{index > 0 && ' '}<span className="platform-enter platform-word" style={delay(index * 68)}>{word}</span></span>)}</h2>
    <p className="platform-enter" style={delay(340)}>I build software at <InlineLink href="https://spadehq.com" image="/images/spade-square-light.webp">Spade</InlineLink>. I like design, creating things, and figuring out how they work.</p>
    <p className="platform-enter" style={delay(425)}>Outside work: jiu-jitsu, MMA, lifting, health and fitness.</p>
    <div className="intro-socials platform-enter" style={delay(510)}><SocialLinks /></div>
  </>}>
    <ProjectGallery />
  </PortfolioFrame>
}
