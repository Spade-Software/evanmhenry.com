export function SiteShell({ children }: { children: React.ReactNode }) {
  return <div className="surface"><main id="main" className="container main-content">{children}
      <footer><span>© {new Date().getFullYear()} Evan Henry</span><a href="#main" aria-label="Back to top" className="footer-mark">EH.</a></footer>
  </main></div>
}
