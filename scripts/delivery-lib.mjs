export function validateRollbackRun(run, repo) {
  if (run.path !== '.github/workflows/delivery.yml' || run.head_branch !== 'main' || run.conclusion !== 'success' || !['push', 'workflow_dispatch'].includes(run.event) || run.head_repository?.full_name !== repo || !/^[a-f0-9]{40}$/.test(run.head_sha)) {
    throw new Error('Rollback requires a successful main-branch delivery from this repository')
  }
  return run.head_sha
}

export function validateArtifact(manifest, commit, runId) {
  if (!/^[a-f0-9]{40}$/.test(commit ?? '') || !/^\d+$/.test(runId ?? '') || manifest.commit !== commit || manifest.runId !== runId) throw new Error('Artifact provenance does not match the approved run')
}

export async function verifyDeployment(origin, commit) {
  const manifest = await fetch(new URL(`/_deployment.json?commit=${commit}`, origin), { signal: AbortSignal.timeout(10000) })
  if (!manifest.ok || (await manifest.json()).commit !== commit) throw new Error('Deployment manifest has not reached this commit')
  for (const pathname of ['/', '/privacy/', '/_delivery-not-found-check/']) {
    const response = await fetch(new URL(pathname, origin), { signal: AbortSignal.timeout(10000), redirect: 'follow' })
    const expected = pathname === '/_delivery-not-found-check/' ? 404 : 200
    if (response.status !== expected) throw new Error(`${pathname}: expected ${expected}, received ${response.status}`)
    if (response.headers.get('x-content-type-options') !== 'nosniff' || response.headers.get('x-frame-options') !== 'DENY' || !response.headers.get('content-security-policy')?.includes("frame-ancestors 'none'")) throw new Error(`${pathname}: required security headers missing`)
    await response.arrayBuffer()
  }
}
