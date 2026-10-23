# Prototype portability

Upstream: BackOps `.claude/skills/prototype`, copied October 23, 2026. Paygrids is not a source. `HOSTS.md`, `PICKER.md`, picker assets and the loop/freeze/Codex adapter scripts are retained from BackOps. The local `SKILL.md`, `WRAP.md` and `scripts/build-css.mjs` replace BackOps-only product references and Tailwind compilation with portfolio conventions and an isolated Next static build.

Invoke `/prototype` in Claude or `$prototype` in Codex and read the shared SKILL.md/host guide. The invoking system chooses the adapter. Claude uses the existing watcher; Codex requires native `codex queue` and direct submission delivery. When that capability isn't installed, resume manually from chat. Never substitute scheduled tasks or claim queue receipt proves a version was built.

Use an external scratch root such as `/private/tmp/evan-portfolio-prototypes/prototype`. The CSS adapter needs the app's installed dependencies (`npm ci` first). It copies app sources into temporary scratch space, runs Next there without an analytics ID, copies compiled CSS/fonts beside the prototype and removes only its own temporary workspace. It never writes build artifacts into this checkout. Keep `_system/` beside `system.css` when moving a live prototype. The freeze helper produces the standalone handoff.

Prototype feedback can modify only disposable prototype versions. Keep ends the loop; implementation, commits and deployments are separate user requests. Host connection files, session IDs, feedback logs and prototypes must never be committed. For upstream updates, compare against BackOps and preserve the three intentional portfolio adaptations; don't overwrite the host behavior with a Codex-only fork.
