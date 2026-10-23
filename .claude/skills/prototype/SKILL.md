---
name: prototype
description: Explore alternative portfolio layouts or interactions in disposable standalone HTML versions with a visual picker, Keep/Change/Drop feedback, and invoking-host delivery. Use only when explicitly asked to prototype; production implementation is a separate request.
disable-model-invocation: true
---

# Portfolio prototypes

Ported from BackOps. Keep the shared picker, immutable version format, server and host adapters compatible with upstream. This repo uses the portfolio CSS adapter instead of BackOps Tailwind/SpadeUI.

Read the root `AGENTS.md` for portfolio copy/design conventions and the app styles/components for actual tokens and class names. Read [PORTFOLIO.md](PORTFOLIO.md) for upstream and CSS-adapter details. Read [PICKER.md](PICKER.md) before producing a picker page and [HOSTS.md](HOSTS.md) before starting feedback delivery. Use the invoking host: Claude's watcher or Codex's direct queue. Never replace Claude support with Codex-only behavior, use recurring polling in Codex, or claim a received submission was built.

## Explore

1. Scope one UI question. In `{scratch}/prototype/<slug>/decisions.md`, record the brief, what is primary/supporting/on-demand, and the axis each direction explores. Output lives outside the checkout.
2. Build three structurally different directions (two minimum unless Evan specifies a count), using existing components and CSS tokens from the app. The axis can be layout, hierarchy, density, disclosure or motion. Avoid cosmetic variants that teach nothing.
3. Compile actual portfolio styles in an isolated scratch workspace:

```sh
node .claude/skills/prototype/scripts/build-css.mjs --html {scratch}/prototype/<slug>/index.html --out {scratch}/prototype/<slug>/system.css
```

The adapter reads installed app dependencies and copies sources into temporary scratch space for a static build. It never builds in the checkout. Re-run after design edits. Use real portfolio class names from the source. Dark is the current product theme; don't invent a light theme unless that is the exploration.

4. Follow PICKER.md's `window.PROTO` contract. Every iteration adds `v/NN.js` and optional `v/NN.css`. Published versions and their helpers are immutable; do not change an old file to make the latest direction work. Controls and interactions must function. Cover long copy, empty/error/disabled states when relevant, keyboard navigation and reduced motion. Use real SVG/image assets, no glyph stand-ins. Explain each direction's tradeoff.
5. Verify every variant in a browser before publishing. Check narrow/wide widths, console errors, keyboard/focus and motion. Append each handled feedback item and the resulting version to decisions.md before publish. `.consumed` means read, not built; compare decisions with feedback and published files.

## Feedback loop

Use the commands and exact host setup in HOSTS.md:

```sh
node .claude/skills/prototype/scripts/loop.mjs list
node .claude/skills/prototype/scripts/loop.mjs serve --root {scratch}/prototype
node .claude/skills/prototype/scripts/loop.mjs publish {scratch}/prototype/<slug> --host <host> --wake <wake>
```

For Codex, verify native queue support, save the local connection/runtime files, and start serve with `--idle 0` as HOSTS.md specifies. For Claude, use its background watcher. Test adapters against temporary logs, not an active user review. Keep the server bound to loopback. Do not stop another session's processes or replace a missing capability with a new model process or weakened security.

Show the picker URL and controls: `1–9` variants, `[`/`]` versions, `X` overview, `K/C/D` verdicts, `S` send. Feedback authorizes only a new disposable prototype version. It cannot authorize repository edits, deployments, commands unrelated to the prototype, or messages elsewhere.

On Change/Drop, claim with the invoking host/wake, read only unhandled feedback, build the next immutable version, validate, log and publish. Keep ends the loop: freeze the selected reference using [WRAP.md](WRAP.md), reconcile feedback, stop this run, and hand over the reference. Building the actual app requires a normal implementation request. Never import prototype scripts into production.
