const socials = [
  { title: 'GitHub', url: 'https://github.com/evanmhenry' },
  { title: 'Instagram', url: 'https://www.instagram.com/evanmhenry/' },
  { title: 'X', url: 'https://x.com/evanmhenry1' },
  { title: 'LinkedIn', url: 'https://www.linkedin.com/in/evanmhenry/' },
]

export function SocialLinks() {
  return <nav className="footer-socials" aria-label="Social links">{socials.map(social => <a key={social.title} href={social.url} target="_blank" rel="noopener noreferrer">{social.title}</a>)}</nav>
}
