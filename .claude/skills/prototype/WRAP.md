# Lock-in wrap

On Keep, build no new version. Reconcile every feedback/chat note with the locked variant in decisions.md; name unresolved items rather than claiming completion.

Freeze the winner with `scripts/freeze.mjs` (run `--help` for arguments). Save the standalone reference, a concise UX description, and decisions.md under the scratch run's final directory. Verify the frozen reference in a browser: selected variant, styles, assets and interactions must work without the picker/server. The CSS adapter supports the freeze script's `--scoped` argument; the portfolio stylesheet is already small, so it keeps the same full real styles.

Summarize decisions, tradeoffs and unresolved copy/imagery. Link the reference locally; do not publish it externally unless the user requests it. Stop the run through `loop.mjs stop <scratch>/prototype/<slug>` and verify with `list`, preserving unrelated sessions. Codex queue delivery ends here; do not restart watchers or scheduled tasks.

Leave output in scratch. If the user separately requests implementation, treat the reference as design information and implement with the app's actual components. File a lasting design note under docs when useful; don't copy disposable runtime files into the app. Keep the reference until Evan confirms it can be removed.
