# Portfolio working instructions

- This is a small personal portfolio and writing site. Prefer existing tools and components; avoid custom infrastructure, empty content sections, dashboards, or a CMS without a concrete need.
- App: `evanmhenry-com`. Read its `AGENTS.md` and relevant bundled Next docs before framework edits. Use Node 22 and npm. Check `npm test`, `npm run build`, and `npm run test:export`; workflow edits also need `actionlint`.
- Use short-lived branches, small PRs and clear squash titles. Main must pass Validate site. Publishing is automatic after merge; recover through a revert PR.
- Use CLI/API tools for GitHub. Ask before switching to computer use when a CLI/API route is the normal approach.
- Preserve explicit analytics consent, exact production-host gating and disabled advertising. Never add duplicate page-view tracking or put credentials in public builds. See `docs/analytics.md`.
- Keep content in Git and article URLs stable. Articles need titles, descriptions and readable widths. Preserve numeric book-summary URLs. Don't invent writing, personal claims, or accomplishments.
- Use Evan M. Henry or EvanMHenry.com when naming the site/property. Preserve intentionally authored visible names. Copy is short, direct and curious, about building, design and the interests Evan has actually shared. Avoid sentimental taglines and the word “tinkering.” Social links stay quiet.
- Reuse CSS tokens/components. Preserve the dark intro/project rail, white project marks, borderless 18px inline Spade icon, underline-only hover, staggered fade/rise/blur, visible keyboard focus and reduced motion. Don't restore portrait rotation.
- Explicit prototypes use `.claude/skills/prototype/SKILL.md` and `HOSTS.md`; the shared source is BackOps. Select the invoking host's adapter. Output stays in scratch. No scheduled polling, production edits, commits or deployments from page notes.
