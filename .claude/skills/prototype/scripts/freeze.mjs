#!/usr/bin/env node
// Freeze one locked variant into a single self-contained HTML file: system.css, the shared page
// scripts and every version file inlined, the picker removed, the variant rendered on load.
//
//   node freeze.mjs <scratch>/prototype/<slug> --version 10 --variant Folded [--out <file>]
//
// Every version file up to the locked one is inlined, not just the last: later versions reuse
// helpers and icon sets that earlier files registered on the shared global scope.
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const [dir, ...rest] = process.argv.slice(2)
const arg = (name) => {
	const i = rest.indexOf(`--${name}`)
	return i === -1 ? undefined : rest[i + 1]
}
const version = Number(arg('version'))
const variant = arg('variant')
if (!dir || !version || !variant) {
	console.error('usage: freeze.mjs <prototype dir> --version <n> --variant <name> [--out <file>]')
	process.exit(1)
}

const read = (p) => readFileSync(path.join(dir, p), 'utf8')
const slug = path.basename(path.resolve(dir))
const out = arg('out') ?? path.join(dir, 'final', `${slug}-v${String(version).padStart(2, '0')}-${variant.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`)

let html = read('index.html')
// Picker chrome: removed entirely; the frozen page is the design, not the review harness.
html = html.replace(/<link rel="stylesheet" href="\/__proto\/picker\.css"\s*\/?>\n?/g, '')
html = html.replace(/<script src="\/__proto\/picker\.js"><\/script>\n?/g, '')

// Version files up to the locked one, in order; later ones are dropped.
html = html.replace(/<link rel="stylesheet" href="v\/(\d+)\.css"\s*\/?>\n?/g, (m, n) =>
	Number(n) <= version ? `<style>\n${read(`v/${n}.css`)}\n</style>\n` : '',
)
html = html.replace(/<script src="v\/(\d+)\.js"><\/script>\n?/g, (m, n) =>
	Number(n) <= version ? `<script>\n${read(`v/${n}.js`)}\n</script>\n` : '',
)

// Render the locked variant where the picker would have.
const boot = `<script>
(() => {
  const v = PROTO.versions[${version - 1}]
  const pick = v && v.variants.find((x) => x.name === ${JSON.stringify(variant)})
  if (!pick) { document.getElementById('stage').textContent = 'Locked variant not found'; return }
  PROTO.current = { version: ${version - 1}, variant: v.variants.indexOf(pick) }
  const stage = document.getElementById('stage')
  stage.innerHTML = pick.render()
  if (pick.mount) pick.mount(stage)
  window.dispatchEvent(new Event('proto:mount'))
})()
</script>
</body>`
if (!/<\/body>/.test(html)) throw new Error('index.html has no </body>')
html = html.replace(/<\/body>/, boot)
html = html.replace(/<title>([^<]*)<\/title>/, `<title>$1 · V${version} ${variant} (locked)</title>`)

mkdirSync(path.dirname(out), { recursive: true })
writeFileSync(out, html)

// Stylesheet: compiled from this page's classes alone, not the whole product's. Compiled before it is
// inlined, since the full sheet's selectors would read as classes. Falls back to the full sheet.
const scopedCss = `${out}.css`
let css
try {
	execFileSync('node', [path.join(path.dirname(fileURLToPath(import.meta.url)), 'build-css.mjs'), '--html', out, '--out', scopedCss, '--scoped'], { stdio: 'pipe' })
	css = readFileSync(scopedCss, 'utf8')
} catch (e) {
	console.warn(`scoped CSS failed, inlined the full stylesheet: ${e.stderr?.toString().trim() || e.message}`)
	css = read('system.css')
} finally {
	if (existsSync(scopedCss)) unlinkSync(scopedCss)
}
html = html.replace(/<link rel="stylesheet" href="system\.css"\s*\/?>/, () => `<style>\n${css}\n</style>`)
writeFileSync(out, html)
console.log(`${out} (${Math.round(html.length / 1024)}kb)`)
