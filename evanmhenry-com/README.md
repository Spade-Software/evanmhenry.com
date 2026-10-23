# Evan M. Henry · web app

The static Next.js application for [evanmhenry.com](https://evanmhenry.com).

```sh
npm ci
npm run dev
```

Use Node 22 (`../.nvmrc`). Before a PR, run `npm test`, `npm run build`, then `npm run test:export`. `npm run preview` serves `out/`; `npm run typecheck` checks TypeScript without building.

See the [repository README](../README.md), [delivery runbook](../docs/delivery.md), [analytics setup](../docs/analytics.md), and [content conventions](../docs/content-and-design.md). Production deploys automatically after tested changes merge to main. Keep lockfiles committed and credentials out of source.
