import Image from 'next/image'
import { Arrow } from './arrow'

const socials = [
  { title: 'Instagram', handle: '@evanmhenry', description: 'Life beyond the screen.', url: 'https://www.instagram.com/evanmhenry/', image: '/images/instagram.svg' },
  { title: 'X / Twitter', handle: '@evanmhenry1', description: 'Thoughts along the way.', url: 'https://x.com/evanmhenry1', image: '/images/twitter.svg' },
  { title: 'LinkedIn', handle: 'Evan Henry', description: 'Work and connections.', url: 'https://www.linkedin.com/in/evanmhenry/', image: '/images/linkedin.svg' },
  { title: 'GitHub', handle: 'evanmhenry', description: 'What I’m building.', url: 'https://github.com/evanmhenry', image: '/images/github.svg' },
]

export function SocialLinks() {
  return <section className="social-section enter" aria-labelledby="social-title">
    <h2 id="social-title">Elsewhere</h2><p className="section-note">A little more of me, around the internet.</p>
    <ul className="social-links">{socials.map(social => <li key={social.title}><a href={social.url} target="_blank" rel="noopener noreferrer" className="social-link">
      <Image src={social.image} alt="" width={20} height={20} />
      <span className="social-copy"><span className="social-name">{social.title}</span><span className="social-handle">{social.handle}</span></span>
      <span className="social-description">{social.description}</span><Arrow diagonal />
    </a></li>)}</ul>
  </section>
}
