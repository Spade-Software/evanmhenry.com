# Security review follow-up

The source audit recorded no confirmed vulnerabilities. This follow-up addresses its deferred route-composition review and applies safe repository-side hardening. It does not change the audit's limits: hosted response behavior, Azure settings, and GitHub repository controls require owner-side verification.

## Changes made

- CI now checks the built static export for the home page, book list, a generated book detail page, design foundations, privacy, and the 404 document. It also checks that every rendered same-site page link resolves to exported HTML. The book list and detail route both derive from `content/books.ts`; `generateStaticParams` uses those same slugs and `dynamicParams = false` prevents ungenerated detail paths from being treated as valid Next routes.
- Azure Static Web Apps keeps the existing static export and 404 rewrite. Global headers now deny framing (`X-Frame-Options` and the CSP `frame-ancestors` directive), block plugin content (`object-src 'none'`), and constrain document base URLs (`base-uri 'self'`). The CSP intentionally leaves script and network source behavior unspecified, so it does not block Next's generated bootstrap or the consent-gated analytics integration.
- The deploy job now grants only `contents: read`; it no longer passes the GitHub token for optional deployment comments or requests `pull-requests: write`. Azure deployment remains gated on the repository's Azure deployment secret and the existing same-repository PR condition.
- Checkout, Node setup, and Azure deploy actions are pinned to immutable commit SHAs with release labels. The Azure `v1` SHA was verified through its official GitHub API, including support for `deployment_environment` and `is_static_export`; its optional `repo_token` is only used for PR comments. Azure's action still uses a vendor Docker image, so the action pin does not establish immutable downstream image contents.

## Owner-side checks still needed

- Confirm effective headers on production and preview responses, including error responses, because this repository cannot prove Azure applies the checked-in configuration to every host response.
- Confirm the Azure custom domain and TLS attachment before considering HSTS. No `includeSubDomains` or preload commitment is added without confirming DNS and ownership for every subdomain.
- Review Azure deployment-token authority and hosted workflow approval policy in their control planes. Token scope cannot be established from source inspection.
- Read-only GitHub API checks on October 23, 2026 confirmed secret scanning, validity checks, non-provider patterns, and push protection are enabled. Dependabot security updates are disabled. Main-branch protection exists but has no required status checks and requires zero approving reviews; administrators are not enforced. These existing repository policies were recorded without changing the owner's merge workflow.
- GitHub still lists 69 open Dependabot alerts referring to the previous Vite manifest and removed `yarn.lock`. Current `main` uses Next and `package-lock.json`, has no Vite dependency or tracked Yarn lockfile, and the local npm audit reports zero advisories. The stale alert state was recorded without dismissing alerts; it needs reconciliation with GitHub's dependency graph.
- A restrictive script CSP remains open hardening work. The site uses generated Next inline bootstrap and optional Google Analytics; a policy must be developed against the exported output and verified against analytics behavior before enforcing `script-src` or `connect-src` restrictions.

## Verification limits

The final production build and TypeScript compilation passed; the rebuilt static export passed both route checks. The route test also runs after `next build` in CI. All six analytics regression tests passed, covering SDK initialization order, consent withdrawal, blocked storage, and subscription cleanup. These local checks establish generated output and lifecycle behavior, not live Azure responses. Static review confirmed the shared slug source and fixed route structure.
