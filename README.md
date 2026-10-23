# Evan M. Henry

Personal work, writing, and projects at [evanmhenry.com](https://evanmhenry.com). Next.js exports static HTML; Azure Static Web Apps serves it. There is no application server or database.

## Local work

Use Node 22 (`nvm use`) and npm:

```sh
cd evanmhenry-com
npm ci
npm run dev
```

Before a PR, run `npm test`, `npm run build`, then `npm run test:export` in the app. The build also checks TypeScript. `npm run preview` serves `out/`. Keep `package-lock.json` committed; use `npm ci` for reproducible installs. Never commit environment files or deployment credentials.

## Content

- Introduction: `evanmhenry-com/app/page.tsx`.
- Projects: `evanmhenry-com/content/projects.ts`; images: `public/images/`.
- Book summaries: `content/books.ts`; preserve their numeric URLs.
- Writing: add static routes under `app/`, with a title, description, and stable URL. Keep content in Git. Add an index when there is actual writing to publish; there is currently no notes feed.
- Shared appearance: `app/globals.css`, `app/portfolio.css`, and `components/`.

The site stays dark, uses local fonts/images, and respects reduced motion. See [content and design conventions](docs/content-and-design.md).

## Delivery

Branch from current `main`, make a small change, and open a PR. `Validate site` runs tests, a dependency audit, the production build, and static-route checks. PR builds receive no analytics ID or Azure deployment credentials. Download the `portfolio-site` artifact from Actions to inspect a PR export locally. Automatic Azure PR previews are disabled to avoid limited staging slots and exposing deployment authority to PR code.

Squash-merge a green PR. GitHub deletes its head branch automatically. A `main` push builds once, stores the tested export for 90 days, deploys that artifact, verifies the live commit/routes/security headers, and records a GitHub Release. Production deployments are serialized. No release branch or manually edited version number is needed.

See [delivery and recovery](docs/delivery.md) for manual redeploys, rollback, repository settings, and this infrastructure PR's one-time rollout.

## Google Analytics

GA4 property: **EvanMHenry.com**. Public Measurement ID: `G-PDJXZKXXJM`. The private dashboard lives in [Google Analytics](https://analytics.google.com/).

Actions variable `GA_MEASUREMENT_ID` supplies the production ID. `AZURE_STATIC_WEB_APPS_API_TOKEN` is the deployment secret. A Measurement ID is public and belongs in a variable, not a secret. Local/PR/Azure preview hosts do not collect analytics; visitors must allow it before the tag loads. Advertising features stay disabled. See [analytics verification](docs/analytics.md).

## Prototype skill

The prototype skill comes from the current **BackOps** version, retaining the shared picker and Claude/Codex adapters. Read [.claude/skills/prototype/SKILL.md](.claude/skills/prototype/SKILL.md); invoke `/prototype` in Claude or `$prototype` in Codex. Output stays outside the repository. Codex uses direct queue delivery when supported, with manual resumption otherwise; there is no polling automation fallback. See [prototype portability](docs/prototype.md).
