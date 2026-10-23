// Portfolio adapter. Builds only in scratch; picker/host/version contracts stay upstream-compatible.
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const repo = fileURLToPath(new URL('../../../../', import.meta.url))
const app = path.join(repo, 'evanmhenry-com')
const arg = name => { const index = process.argv.indexOf(`--${name}`); return index < 0 ? undefined : process.argv[index + 1] }
const html = arg('html')
const output = arg('out')
if (!html || !output) throw new Error('usage: build-css.mjs --html <scratch/index.html> --out <scratch/system.css> [--scoped]')
const outside = value => { const relative = path.relative(repo, path.resolve(value)); return relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative) }
if (!outside(html) || !outside(output)) throw new Error('Prototype inputs and output must stay outside the repository')
const destination = path.dirname(path.resolve(output))
await mkdir(destination, { recursive: true })
const workspace = await mkdtemp(path.join(destination, '.portfolio-css-'))
try {
  for (const entry of ['app', 'components', 'content', 'lib', 'public', 'next.config.ts', 'tsconfig.json', 'package.json']) {
    await cp(path.join(app, entry), path.join(workspace, entry), { recursive: true })
  }
  await symlink(path.join(app, 'node_modules'), path.join(workspace, 'node_modules'), 'dir')
  // Webpack supports resolving installed dependencies through this scratch-only symlink.
  execFileSync(process.execPath, [path.join(app, 'node_modules/next/dist/bin/next'), 'build', '--webpack'], {
    cwd: workspace, stdio: 'pipe', timeout: 120000,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1', NEXT_PUBLIC_GA_MEASUREMENT_ID: '' },
  })
  const exported = path.join(workspace, 'out')
  const page = await readFile(path.join(exported, 'index.html'), 'utf8')
  const styles = [...new Set([...page.matchAll(/<link\b[^>]*href="([^"]+\.css(?:\?[^"]*)?)"[^>]*>/g)].map(match => match[1].split('?')[0]))]
  if (!styles.length) throw new Error('No compiled styles found in the export')
  const assetDir = path.join(destination, '_system')
  await mkdir(assetDir, { recursive: true })
  const chunks = []
  for (const href of styles) {
    const filename = path.join(exported, href.replace(/^\//, ''))
    let css = await readFile(filename, 'utf8')
    const replacements = new Map()
    for (const match of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
      const url = match[1]
      if (/^(data:|https?:|#)/.test(url)) continue
      const source = url.startsWith('/') ? path.join(exported, url.slice(1)) : path.resolve(path.dirname(filename), url)
      const name = path.basename(source)
      if (process.argv.includes('--scoped')) {
        const bytes = await readFile(source)
        const mime = name.endsWith('.woff2') ? 'font/woff2' : 'application/octet-stream'
        replacements.set(match[0], `url("data:${mime};base64,${bytes.toString('base64')}")`)
      } else {
        await cp(source, path.join(assetDir, name))
        replacements.set(match[0], `url("_system/${name}")`)
      }
    }
    for (const [from, to] of replacements) css = css.replaceAll(from, to)
    chunks.push(css)
  }
  await writeFile(path.resolve(output), chunks.join('\n'))
  console.log(`Portfolio styles: ${path.resolve(output)} (${styles.length} compiled chunks; local assets in _system/)`)
} finally {
  await rm(workspace, { recursive: true, force: true })
}
