import { readFile } from 'node:fs/promises'
import { validateArtifact } from './delivery-lib.mjs'
const manifest = JSON.parse(await readFile('site/_deployment.json', 'utf8'))
validateArtifact(manifest, process.env.EXPECTED_COMMIT, process.env.SOURCE_RUN)
