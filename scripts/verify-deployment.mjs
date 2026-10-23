import { appendFile } from 'node:fs/promises'
import { setTimeout } from 'node:timers/promises'
import { verifyDeployment } from './delivery-lib.mjs'

const origin = new URL(process.env.SITE_URL ?? 'https://evanmhenry.com')
const commit = process.env.EXPECTED_COMMIT
if (!/^[a-f0-9]{40}$/.test(commit ?? '')) throw new Error('Expected a full commit SHA')

let failure
for (let attempt = 0; attempt < 12; attempt++) {
  try {
    await verifyDeployment(origin, commit)
    console.log(`Verified ${commit} on ${origin.origin}`)
    if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `Deployed and verified [${commit}](${origin.origin}/_deployment.json) on ${origin.origin}.\n`)
    failure = undefined
    break
  } catch (error) {
    failure = error
    console.log(`Verification attempt ${attempt + 1}: ${error.message}`)
    if (attempt < 11) await setTimeout(5000)
  }
}
if (failure) throw failure
