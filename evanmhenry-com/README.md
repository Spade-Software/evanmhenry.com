# Evan Henry · Portfolio

A dark, statically rendered Next.js portfolio based on Option One in the Paper file’s Iterations page. React server components, locally hosted Inter, CSS entrance/hover motion, accessible reduced-motion support, and existing book summaries.

## Local development

Use Node 22 or newer.

```sh
npm ci
npm run dev
```

`npm run build` exports the site into `out/`. `npm run preview` serves that export. `npm run typecheck` checks TypeScript.

## Content and components

- `app/page.tsx`: introduction and homepage sections.
- `content/projects.ts`: project links, descriptions, and images.
- `content/books.ts`: original book summaries; numeric slugs preserve existing URLs.
- `components/`: reusable shell, project rows, book rows, and arrows.
- `public/images/`: headshot and original project logos.
- `app/globals.css`: design tokens, responsive layouts, and motion.

The site is intentionally dark by default. Images are local, explicitly sized, and compatible with static hosting. No server runtime or external font request is needed.

## Deploy

The repository’s Azure Static Web Apps action builds once and uploads `out/` using the existing `AZURE_STATIC_WEB_APPS_API_TOKEN` secret.

- Push to `feat/version-2`: deploy the named `version-2` preview.
- Push to `main`: deploy production.
- Pull request targeting `main`: deploy a PR preview; close removes it.
- Actions → Deploy portfolio to Azure Static Web Apps → Run workflow: manually deploy the selected branch.

The action logs provide the deployment URL. Azure serves exported page directories and a real 404 instead of falling back to the homepage.

## Google Analytics 4

The EvanMHenry.com GA4 web stream uses Measurement ID `G-PDJXZKXXJM`. The repository Actions variable `GA_MEASUREMENT_ID` is configured. Collection starts after these changes reach a production deployment and a visitor consents; the private Google reports still need account-side configuration and verification. No analytics database, server runtime, API secret, or service account is needed. The private dashboard lives in Google Analytics.

1. Create/select the GA4 property for `https://evanmhenry.com` and its Web data stream.
2. Copy the stream's `G-...` Measurement ID into the GitHub repository **Actions variable** `GA_MEASUREMENT_ID` (Settings → Secrets and variables → Actions → Variables). It is a public tag identifier, not an API secret.
3. Deploy `main`. The workflow exposes the variable as `NEXT_PUBLIC_GA_MEASUREMENT_ID` at build time only for `main`; preview builds receive an empty value. For manual production exports, set that environment variable before `npm run build`.
4. On the production domain, allow analytics, then check GA Realtime/Tag Assistant. Decline should load no Google tag. Analytics settings lets visitors change their choice; withdrawing consent disables collection and clears this site's GA cookies.
5. Enable Enhanced measurement for page views, including browser-history changes. Page views use Google's automatic measurement; do not add a second manual page-view tag. Default outbound `click` events can coexist with the named events below; use the named events in the project dashboard rather than adding both counts together.
6. Register event-scoped custom dimensions for `project_name`, `link_name`, `placement`, and `destination_host` in Admin → Custom definitions. Do not enable Google Signals or advertising features for this portfolio.

Collection requires all three: a valid ID, a production build, and an exact hostname of `evanmhenry.com` or `www.evanmhenry.com`. Localhost, Azure previews, and other hosts are excluded even if an ID was supplied. Visitors must explicitly allow analytics before the Google script loads. The preference is stored on their device. No historical activity is backfilled after consent.

| Event | Definition | Parameters |
|---|---|---|
| `page_view` | Google's automatic page/load and history-change measurement | Standard GA dimensions |
| `project_view` | At least 50% of a project visible for one continuous second in a visible tab; once per route/analytics activation | `project_name` |
| `project_click` | Click on a project image, title, or inline Spade link | `link_name`, `placement`, `destination_host` |
| `social_click` | Click on one of the four social links | `link_name`, `placement`, `destination_host` |

Project visibility uses viewport intersection, including clipping by the desktop project scroller. Project and social events contain authored labels and destination hosts, not free-text input or full destination query strings. The Google tag handles standard traffic/referrer/campaign metadata. Consent and content blockers can reduce measured traffic; the report describes measured visits, not every request to Azure.

Recommended private overview: last 30 days vs. previous 30 days; active users, sessions, views, traffic source/medium, top pages, device category, country, project views/clicks by project, and social clicks by platform. Mark `project_click` as a key event if project referrals are the desired outcome. Account/property setup, report customization, and end-to-end collection verification require access to the Google Analytics account; adding the ID alone does not create those reports.

Run the production-host/consent guard checks with:

```sh
node --experimental-strip-types --test tests/analytics.test.mjs
```
