import Image from 'next/image'

const socials = [
  { title: 'Instagram', url: 'https://www.instagram.com/evanmhenry/', icon: 'instagram.svg' },
  { title: 'X', url: 'https://x.com/evanmhenry1', icon: 'twitter.svg' },
  { title: 'LinkedIn', url: 'https://www.linkedin.com/in/evanmhenry/', icon: 'linkedin.svg' },
  { title: 'GitHub', url: 'https://github.com/evanmhenry', icon: 'github.svg' },
]

export function SocialLinks() {
  return <nav className="footer-socials" aria-label="Social links">{socials.map(social => <a key={social.title} href={social.url} target="_blank" rel="noopener noreferrer" aria-label={social.title}><Image src={`/images/${social.icon}`} alt="" width={20} height={20} /></a>)}</nav>
}
