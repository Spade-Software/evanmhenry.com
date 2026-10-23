import { SocialLinks } from './social-links'

export function SiteShell({ children }: { children: React.ReactNode }) {
  return <div className="surface"><main id="main" className="container main-content">{children}
      <footer><span>© {new Date().getFullYear()} Evan Henry</span><SocialLinks /></footer>
  </main></div>
}
