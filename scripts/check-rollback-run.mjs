import { appendFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { validateRollbackRun } from './delivery-lib.mjs'

const { SOURCE_RUN: runId, GH_REPO: repo, GITHUB_OUTPUT: output } = process.env
if (!/^\d+$/.test(runId ?? '') || !/^[\w.-]+\/[\w.-]+$/.test(repo ?? '')) throw new Error('Invalid source run or repository')
const run = JSON.parse(execFileSync('gh', ['api', `repos/${repo}/actions/runs/${runId}`], { encoding: 'utf8' }))
validateRollbackRun(run, repo)
appendFileSync(output, `commit=${run.head_sha}\n`)
console.log(`Restoring tested commit ${run.head_sha} from run ${runId}`)
