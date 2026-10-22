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
