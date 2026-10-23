import { writeFile } from 'node:fs/promises'

const { SITE_COMMIT: commit, SITE_RUN_ID: runId } = process.env
if (!/^[a-f0-9]{40}$/.test(commit ?? '') || !/^\d+$/.test(runId ?? '')) throw new Error('Missing valid commit/run ID')
await writeFile('out/_deployment.json', JSON.stringify({ commit, runId, builtAt: new Date().toISOString() }) + '\n')
