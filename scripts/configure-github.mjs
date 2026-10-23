// Deliberately not a workflow: repository policy uses an owner's existing gh login.
// Dry-run by default. Run with --apply after Validate site exists on a passing PR.
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const repo = 'Spade-Software/evanmhenry.com'
const config = JSON.parse(readFileSync(new URL('../.github/repository-policy.json', import.meta.url), 'utf8'))
const requests = [
  ['PUT', `repos/${repo}/branches/main/protection`, config.main],
  ['PUT', `repos/${repo}/environments/production`, { deployment_branch_policy: { protected_branches: false, custom_branch_policies: true } }],
  ['PATCH', `repos/${repo}`, config.settings],
  ['PUT', `repos/${repo}/actions/permissions/workflow`, { default_workflow_permissions: 'read', can_approve_pull_request_reviews: false }],
  ['PUT', `repos/${repo}/automated-security-fixes`, null],
]
for (const [method, endpoint, payload] of requests) {
  console.log(`${process.argv.includes('--apply') ? 'Applying' : 'Would apply'} ${method} ${endpoint}`)
  if (!process.argv.includes('--apply')) continue
  const args = ['api', '--method', method, endpoint, '--silent']
  if (payload !== null) args.push('--input', '-')
  execFileSync('gh', args, { input: payload === null ? undefined : JSON.stringify(payload), stdio: ['pipe', 'inherit', 'inherit'] })
}
console.log('Ensure the production environment allows the main branch only')
if (process.argv.includes('--apply')) {
  const endpoint = `repos/${repo}/environments/production/deployment-branch-policies`
  const { branch_policies: policies } = JSON.parse(execFileSync('gh', ['api', endpoint], { encoding: 'utf8' }))
  if (policies.some(policy => policy.name !== 'main' || policy.type !== 'branch')) throw new Error('Unexpected existing production branch policy: inspect it before changing access')
  if (!policies.length) execFileSync('gh', ['api', '--method', 'POST', endpoint, '--input', '-', '--silent'], { input: JSON.stringify({ name: 'main', type: 'branch' }), stdio: ['pipe', 'inherit', 'inherit'] })
}
