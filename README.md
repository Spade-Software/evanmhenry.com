# Evan M. Henry

Personal work, writing and projects at [evanmhenry.com](https://evanmhenry.com). Next.js exports a static site hosted on Azure Static Web Apps. There is no application server, database or CMS.

## Local development

Use Node 22 (`nvm use`) and npm:

```sh
cd evanmhenry-com
npm ci
npm run dev
```

Before a PR, run `npm test`, `npm run build`, then `npm run test:export`. The build also checks TypeScript; `npm run preview` serves `out/`. Commit `package-lock.json`, never credentials or local environment files.

## Content

- Introduction: `evanmhenry-com/app/page.tsx`.
- Projects: `content/projects.ts`; local images: `public/images/`.
- Book summaries: `content/books.ts`; keep existing numeric URLs.
- Articles and case studies: add static routes under `app/` with stable URLs, titles and descriptions. Add an index when there is actual writing to publish.
- Appearance: `app/globals.css`, `app/portfolio.css`, and `components/`.

See [AGENTS.md](AGENTS.md) for the concise copy/design conventions.

## Publish and recover

Open a small PR from current main. The single **Validate site** job installs dependencies, checks known vulnerabilities, runs analytics tests, builds the site and checks exported links. Main pushes run the same checks, upload that output to Azure, then check that the homepage responds. PRs do not deploy or load analytics. No build archives or per-edit GitHub Releases are maintained.

Squash-merge a green PR; GitHub deletes its branch. Main requires the passing check and resolved conversations, including for administrators, and blocks force pushes/deletion. A second reviewer and rebasing onto the latest main are not required. Actions tokens default to read. To recover, revert the offending squash commit through a tested PR. To redeploy unchanged source, manually run **Portfolio delivery** from main.

The repo uses the existing `AZURE_STATIC_WEB_APPS_API_TOKEN` Actions secret. Deployment is restricted to main by the workflow's step conditions. The previously configured main-only `production` environment remains available, but this single-job workflow does not attach to it. Routine dependency updates are grouped monthly with one open version-update PR per ecosystem; security alerts and security-update PRs remain enabled.

Track work on the [repo project board](https://github.com/orgs/Spade-Software/projects/9). It uses native GitHub automation, not Actions. The board is private; repository issues are public.

## Google Analytics

GA4 property: **EvanMHenry.com**. Public Measurement ID: `G-PDJXZKXXJM`, stored in Actions variable `GA_MEASUREMENT_ID`. Main builds receive it; a missing/invalid value warns instead of blocking publishing. Tracking also requires an exact production host and visitor consent. Advertising stays disabled. The dashboard is private in Google Analytics. See [analytics verification](docs/analytics.md).

## Prototype skill

The shared prototype skill comes from current BackOps and retains Claude/Codex adapters. Read [.claude/skills/prototype/SKILL.md](.claude/skills/prototype/SKILL.md); invoke `/prototype` in Claude or `$prototype` in Codex. It runs locally only when invoked and writes to external scratch space. Its [portfolio note](.claude/skills/prototype/PORTFOLIO.md) records the CSS adaptation. It does not consume Actions minutes.
