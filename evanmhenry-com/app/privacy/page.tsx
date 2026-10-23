import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Analytics privacy', description: 'How optional Google Analytics works on EvanMHenry.com.' }

export default function AnalyticsPrivacy() {
  return <main id="main" tabIndex={-1} className="container main-content">
    <Link className="back-link" href="/">← Back home</Link>
    <header className="article-header"><h1 className="page-title">Analytics privacy</h1><p>Optional analytics on evanmhenry.com.</p></header>
    <div className="prose">
      <p>If you allow analytics, this site uses Google Analytics to understand visits, traffic sources, pages viewed, device and browser categories, approximate location, and interactions with project and social links. Google processes this information to provide analytics reports.</p>
      <h2>Your choice</h2>
      <p>The Google Analytics tag loads only after you choose Accept. Choosing Deny keeps it off. Your preference is stored in your browser’s local storage. You can change it using Analytics settings, shown on the site when analytics is configured for the production domain. Withdrawing consent stops further analytics collection and removes this site’s Google Analytics cookies from your browser; it does not delete information already sent to Google.</p>
      <h2>Cookies and events</h2>
      <p>When allowed, Google Analytics can use cookies such as _ga to distinguish browsers and sessions. The site records page visits, project visibility, project clicks, and social-link clicks. Custom interaction events include the project or platform name, link placement, and destination hostname. This site does not deliberately send names, email addresses, or free-text form contents in those custom events.</p>
      <h2>Advertising</h2>
      <p>This integration disables Google Signals and advertising personalization signals, and keeps advertising-storage and advertising-data consent denied.</p>
      <h2>Google and external sites</h2>
      <p>Read <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">how Google uses information from sites that use its services<span className="visually-hidden"> (opens in a new tab)</span></a> and <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google’s Privacy Policy<span className="visually-hidden"> (opens in a new tab)</span></a>. Links to projects and social platforms take you to other websites with their own privacy practices.</p>
    </div>
  </main>
}
