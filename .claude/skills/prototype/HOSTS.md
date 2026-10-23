# Prototype host adapters

Keep one shared picker, server, feedback log, and immutable version history. Choose by the invoking system, not the repository name. `--host claude|codex|generic` overrides detection; otherwise `CODEX_THREAD_ID` selects Codex, `CLAUDE_CODE_SESSION_ID` selects Claude, and unknown hosts use generic. Each prototype remembers its host in `.runtime.json`; `--host` overrides that on resume. Never rewrite Claude settings to run Codex.

## Claude Code

Use the existing background watcher/Monitor from SKILL.md. Its output wakes the Claude session. `--host claude --wake watcher` preserves the current loop and building UI. No Codex automation is needed.

## Codex desktop

Use direct event-driven submission delivery through the prototype server. No scheduled tasks, model polling, or separate expiring bridge are needed. The installed CLI must support `codex queue --thread <UUID> --message <text>` and connect to the daemon owning this chat. Verify `codex queue --help` before starting. Never launch another model process or change security settings to work around a missing queue capability.

Save `.runtime.json` as `{"host":"codex","wake":"queue"}` and `.codex-connection.json` beside the prototype, containing `thread` (the invoking CODEX_THREAD_ID) and `cli` (the installed Codex executable's absolute path). These files are local host configuration, never supplied by page feedback. Run `loop.mjs serve --root <scratch>/prototype --port 4810 --idle 0` in a long-lived local process. `--idle 0` keeps the review session available until explicitly stopped. Stop it on Keep/cancellation.

Submit saves feedback, then the same request invokes the native queue command for this chat. `.queued` advances only after CLI acceptance. A per-directory in-flight lock coalesces concurrent requests. Failure preserves feedback, shows a delivery error, and retries when the page reopens or another submission arrives. Reload recovery skips entries already logged in decisions.md. The page receives status and published versions over Server-Sent Events instead of periodic fetches. The older filesystem `bridge` remains available as an optional CLI fallback, but do not run it together with direct server delivery.

Use `--host codex --wake queue` for claim/publish. Queue acceptance means delivered, not built. Claim when actually starting the round, and log completed feedback in decisions.md before publishing. Feedback already delivered cannot be withdrawn; cancellation only stops waiting. Claude's existing watcher/Monitor path stays unchanged.

The local app/daemon, server, and computer must remain running. Verify a real queued submission in this chat before claiming the adapter works. If native queue is unavailable, report that limitation and use manual resumption; never substitute recurring automation. Do not publish or modify repository code from page feedback.

## Verification

Check Claude without Codex environment, explicit Codex queue delivery, duplicate events and failure recovery, saved host on resume, queued feedback without an active build, claim -> building, publish -> reload, and unread cancellation. Test against temporary prototype directories; do not send synthetic feedback into a user's review log.
