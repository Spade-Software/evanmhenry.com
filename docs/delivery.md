# Delivery and recovery

## Normal path

Use short-lived branches off current main; keep changes small. Open a PR, wait for **Validate site**, review the diff, then squash-merge with a descriptive PR title. A second human approval is intentionally not mandatory for a solo personal site, but PRs, passing checks, an up-to-date branch and resolved conversations are required, including for administrators. Main cannot be force-pushed or deleted. Merged branches are automatically removed. Auto-merge is available but is not enabled on a PR unless requested.

`Portfolio delivery` runs on every main-targeted PR, main push, or manual main dispatch:

1. `Validate site`: Node 22/npm ci, high/critical dependency audit, analytics and delivery regression tests, Next production build/TypeScript, exported routes, then an immutable `portfolio-site` artifact. PRs get no GA ID or deployment secret. No path filters: even a docs PR produces the required check.
2. Main only: download that run's tested artifact and deploy it to Azure. Build code never receives the Azure token; the deploy job gets it only on the upload action. Production and rollback jobs share a concurrency lock and aren't cancelled in flight.
3. Verify the public `_deployment.json` commit, homepage/privacy/real 404 and security headers. Retry briefly for propagation. Failure makes the run fail and prevents a release; it does not automatically roll back.
4. Publish a GitHub Release tagged `deploy-<run-id>-<attempt>` targeting the deployed commit, with generated PR notes and the artifact-run link. Only this isolated job has contents-write permission. If release recording fails after a verified deployment, production is still updated: inspect the deploy job, then rerun the failed release job rather than blindly rolling back.

There are no release branches, version bumps, automatic live PR previews, or manually maintained changelogs. PR artifacts can be downloaded and served locally. This avoids Azure staging-slot exhaustion and keeps unreviewed PR code away from deployment credentials. Old `feat/version-2` previews are not used by this pipeline; no existing Azure environment is deleted by this change.

## Setup and reproducibility

Required repository Actions secret: `AZURE_STATIC_WEB_APPS_API_TOKEN`. Required Actions variable: `GA_MEASUREMENT_ID` (`G-PDJXZKXXJM`, public). Neither requires a personal token in Git. The `production` GitHub environment records deployment history and permits only main. No approval gate is necessary for this site's automatic main deployment.

Repository policy is versioned in `.github/repository-policy.json`. `node scripts/configure-github.mjs` prints the intended API operations; `--apply` applies them with the owner's existing GitHub CLI administration access. It also sets Actions tokens to read by default, disables Actions approving PRs, and enables Dependabot security-update PRs. Never add an admin PAT to CI to manage its own protections.

The delivery workflow and policy land in the same infrastructure PR. Wait for its new Validate site check to pass before requiring that check in main's protection. Apply policy once, confirm it through the GitHub API, and then merge this PR. The first main delivery creates the first artifact-based release; earlier deploys do not have this rollback format. Repository setting changes apply immediately; workflow/dependency/skill changes become the default only after merge.

The policy was applied and read back successfully on October 23, 2026 after Validate site passed: head-branch deletion, squash-only merges, required app-bound CI with admin enforcement, main-only production access, read-default Actions permissions and Dependabot security PRs are active. The helper remains available to reconcile future drift; it is not a scheduled admin process.

Actions are pinned and Dependabot checks npm/Actions weekly. Minor/patch npm updates are grouped; major changes need separate review. Dependency PRs use the same CI and merge path. Do not dismiss legacy security alerts solely to make the dashboard green; reconcile them against current lockfiles. The Azure action's vendor Docker image remains upstream-controlled even when the action commit is pinned.

## Recovery

For a bad content/code change, revert the offending squash commit on a new branch, test and merge the revert PR. Main then deploys the correction normally, preserving an auditable source of truth.

For faster recovery, Actions → **Roll back production** → Run workflow from **main**, supplying a previous successful Portfolio delivery run ID. It must be a successful main push/manual run from this repo and retain its `portfolio-site` artifact (90 days, subject to repository retention). The workflow validates run identity and artifact commit/run ID, deploys those exact files without rebuilding, then checks the restored live commit and headers. An expired/mismatched/PR artifact fails before upload. GitHub records the rollback as a production deployment; it does not create a new forward release or rewrite main.

Avoid merging while an incident rollback is in progress. After restoring service, revert/fix main through a PR so a later deployment doesn't reintroduce the problem. If no suitable retained artifact exists, use a tested revert PR. Never reset/force-push main or disable checks as the normal rollback mechanism.

For infrastructure-only recovery, manually run Portfolio delivery from main to rebuild/redeploy current source. Investigate a failed smoke check before assuming upload success means users got the intended site.

## Feedback on delivery

GitHub Actions, environment deployment history, releases and commit provenance provide deploy frequency, commit-to-deploy timing and recovery evidence. Start with these records; don't build a metrics dashboard for one website. Watch failed deliveries and time to restore, and keep checks fast enough that changes stay small.

These choices follow [DORA continuous integration](https://dora.dev/capabilities/continuous-integration/), [trunk-based development](https://dora.dev/capabilities/trunk-based-development/), and [continuous delivery](https://dora.dev/capabilities/continuous-delivery/): small batches, version-controlled configuration, fast feedback, deployment automation and recoverability. They apply the technical practices discussed in Accelerate; they don't claim to implement every organizational finding from the book.
