import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { test } from 'node:test'
import { validateArtifact, validateRollbackRun, verifyDeployment } from '../delivery-lib.mjs'

const commit = 'a'.repeat(40)
const repo = 'Spade-Software/evanmhenry.com'
const validRun = { path: '.github/workflows/delivery.yml', head_branch: 'main', conclusion: 'success', event: 'push', head_repository: { full_name: repo }, head_sha: commit }

test('rollback only accepts successful main deliveries from this repository', () => {
  assert.equal(validateRollbackRun(validRun, repo), commit)
  for (const change of [{ event: 'pull_request' }, { head_branch: 'feature' }, { conclusion: 'failure' }, { path: '.github/workflows/other.yml' }, { head_repository: { full_name: 'attacker/fork' } }, { head_sha: 'invalid' }]) {
    assert.throws(() => validateRollbackRun({ ...validRun, ...change }, repo))
  }
})

test('artifact provenance must match both the commit and trusted run', () => {
  const manifest = { commit, runId: '123' }
  validateArtifact(manifest, commit, '123')
  assert.throws(() => validateArtifact(manifest, 'b'.repeat(40), '123'))
  assert.throws(() => validateArtifact(manifest, commit, '456'))
  assert.throws(() => validateArtifact({}, undefined, undefined))
})

test('deployment smoke check verifies commit, real 404, and security headers', async t => {
  let badHeader = false
  let wrongCommit = false
  let bad404 = false
  const server = createServer((request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff')
    if (!badHeader) response.setHeader('X-Frame-Options', 'DENY')
    response.setHeader('Content-Security-Policy', "frame-ancestors 'none'")
    if (request.url.startsWith('/_deployment.json')) {
      response.end(JSON.stringify({ commit: wrongCommit ? 'b'.repeat(40) : commit }))
    } else {
      response.statusCode = request.url === '/_delivery-not-found-check/' && !bad404 ? 404 : 200
      response.end('fixture')
    }
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise(resolve => server.close(resolve)))
  const origin = `http://127.0.0.1:${server.address().port}`
  await verifyDeployment(origin, commit)
  badHeader = true
  await assert.rejects(verifyDeployment(origin, commit), /headers missing/)
  badHeader = false
  wrongCommit = true
  await assert.rejects(verifyDeployment(origin, commit), /manifest/)
  wrongCommit = false
  bad404 = true
  await assert.rejects(verifyDeployment(origin, commit), /expected 404/)
})
