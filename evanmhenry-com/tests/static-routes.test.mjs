import assert from 'node:assert/strict'
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

const outputDirectory = path.resolve('out')

async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(entries.map(async entry => {
    const filename = path.join(directory, entry.name)
    if (entry.isDirectory()) return htmlFiles(filename)
    return entry.isFile() && entry.name.endsWith('.html') ? [filename] : []
  }))
  return files.flat()
}

function exportedFileForPath(pathname) {
  const decodedPath = decodeURIComponent(pathname)
  const relativePath = decodedPath.replace(/^\/+|\/+$/g, '')
  const candidates = relativePath
    ? [path.join(outputDirectory, relativePath, 'index.html'), path.join(outputDirectory, `${relativePath}.html`)]
    : [path.join(outputDirectory, 'index.html')]
  return candidates
}

test('the static export contains the primary routes and not-found page', async () => {
  for (const relative of [
    'index.html',
    'book-summaries/index.html',
    'book-summaries/1/index.html',
    'design-foundations/index.html',
    'privacy/index.html',
    '404.html',
  ]) {
    await stat(path.join(outputDirectory, relative))
  }
})

test('rendered internal page links resolve to exported HTML', async () => {
  const pages = await htmlFiles(outputDirectory)
  assert.ok(pages.length > 0, 'expected HTML files from the static export')

  const missing = []
  for (const page of pages) {
    const html = await readFile(page, 'utf8')
    for (const [, anchor] of html.matchAll(/(<a\b[^>]*>)/g)) {
      const href = anchor.match(/\bhref="([^"]+)"/)?.[1]
      if (!href) continue
      if (!href.startsWith('/') || href.startsWith('//')) continue
      const pathname = href.split(/[?#]/, 1)[0]
      if (!pathname || pathname.startsWith('/_next/')) continue
      const candidates = exportedFileForPath(pathname)
      let found = false
      for (const candidate of candidates) {
        try {
          const metadata = await stat(candidate)
          if (metadata.isFile()) found = true
        } catch {
          // Check the alternate static-export form below.
        }
      }
      if (!found) missing.push(`${path.relative(outputDirectory, page)} -> ${href}`)
    }
  }

  assert.deepEqual(missing, [], `internal links without exported pages:\n${missing.join('\n')}`)
})
