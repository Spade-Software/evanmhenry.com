import Link from 'next/link'
import { Arrow } from './arrow'

export function SiteShell({ children }: { children: React.ReactNode }) {
  return <>
    <header className="announcement"><div className="container announcement-inner">
      <Link href="/" className="monogram" aria-label="Evan Henry home">eh.</Link>
      <span>Independent work, thoughtful software.</span>
      <Link href="/#projects" className="pill">My Work <Arrow /></Link>
    </div></header>
    <div className="surface"><main id="main" className="container main-content">{children}
      <footer><span>© {new Date().getFullYear()} Evan Henry</span><a href="#main" aria-label="Back to top" className="footer-mark">EH.</a></footer>
    </main></div>
  </>
}
