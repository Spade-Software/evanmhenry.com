// Feedback loop for scratchpad prototypes. Reads the repo; writes only under the prototype dirs.
//
//   node loop.mjs serve --root <scratch>/prototype [--port 4810] [--idle 60]   static server + feedback endpoint
//   node loop.mjs await <scratch>/prototype/<slug> [--idle 120]                 blocks until the next Send, prints it
// Both exit on their own after --idle minutes without a request or a Send, so an abandoned session leaves nothing running.
//   node loop.mjs publish <scratch>/prototype/<slug>                tells open pages the new version is ready
//   node loop.mjs list                                              every running serve/await, any session or repo
//   node loop.mjs stop <path>... | --older <hours>                  stops the ones under <path>, or older than <hours>

import { createDispatcher } from './codex-dispatch.mjs'
import { execFileSync } from 'node:child_process'
import { createServer } from 'node:http'
import { appendFileSync, closeSync, existsSync, openSync, readdirSync, readFileSync, readSync, statSync, unlinkSync, writeFileSync, watch } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ASSETS = path.join(path.dirname(fileURLToPath(import.meta.url)), '../assets')
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }

const [cmd, ...rest] = process.argv.slice(2)
const arg = (name) => {
	const i = rest.indexOf(`--${name}`)
	return i === -1 ? undefined : rest[i + 1]
}
const lines = (file) => (existsSync(file) ? readFileSync(file, 'utf8').split('\n').filter(Boolean) : [])
const consumedCount = (dir) => {
	const file = path.join(dir, '.consumed')
	return existsSync(file) ? Number(readFileSync(file, 'utf8')) : 0
}
const watcherAlive = (dir, filename = '.watcher.pid') => {
	const lock = path.join(dir, filename)
	if (!existsSync(lock)) return false
	try {
		process.kill(Number(readFileSync(lock, 'utf8')), 0)
		return true
	} catch (e) {
		// EPERM means the process exists but belongs to another sandbox: it is still watching.
		return e.code === 'EPERM'
	}
}
// Versions live in v/<n>.js beside index.html; older single-file prototypes keep theirs inline.
const countVersions = (dir) => {
	const vdir = path.join(dir, 'v')
	const files = [path.join(dir, 'index.html'), ...(existsSync(vdir) ? readdirSync(vdir).filter((f) => f.endsWith('.js')).map((f) => path.join(vdir, f)) : [])]
	return files.reduce((n, f) => n + (readFileSync(f, 'utf8').match(/PROTO\.versions\.push\(/g) ?? []).length, 0)
}

if (cmd === 'serve') serve()
else if (cmd === 'await') await wait(path.resolve(rest[0]))
else if (cmd === 'bridge') await (await import('./codex-bridge.mjs')).bridge(path.resolve(rest[0]), { thread: arg('thread') ?? process.env.CODEX_THREAD_ID, cli: arg('cli') ?? 'codex', idle: Number(arg('idle') ?? 120) })
else if (cmd === 'publish') publish(path.resolve(rest[0]))
else if (cmd === 'claim') claim(path.resolve(rest[0]))
else if (cmd === 'list') list()
else if (cmd === 'stop') stop()
else {
	console.error('usage: loop.mjs serve --root <dir> [--port 4810] [--idle 60] | await <slug-dir> [--idle 120] | publish <slug-dir> | claim <slug-dir> [--host claude|codex|generic] [--wake watcher|queue|heartbeat|manual] | bridge <slug-dir> --thread <UUID> [--idle 120] | list | stop <path>... | stop --older <hours>')
	process.exit(1)
}

function runtime(dir) {
 const file = path.join(dir, '.runtime.json')
 const saved = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {}
 const detected = process.env.CODEX_THREAD_ID ? 'codex' : process.env.CLAUDE_CODE_SESSION_ID ? 'claude' : undefined
 const host = arg('host') ?? (['claim', 'publish'].includes(cmd) ? detected : undefined) ?? saved.host ?? detected ?? 'generic'
 if (!['claude', 'codex', 'generic'].includes(host)) throw new Error('Unknown prototype host')
 const wake = arg('wake') ?? (host === saved.host ? saved.wake : undefined) ?? (host === 'claude' ? 'watcher' : 'manual')
 if (!['watcher', 'queue', 'heartbeat', 'manual'].includes(wake)) throw new Error('Unknown prototype wake mode')
 return { host, wake }
}
function claim(dir) {
 writeFileSync(path.join(dir, '.runtime.json'), JSON.stringify(runtime(dir)))
 writeFileSync(path.join(dir, '.building.json'), JSON.stringify({ feedback: lines(path.join(dir, 'feedback.jsonl')).length, at: Date.now() }))
 console.log('Prototype build claimed')
}

function serve() {
	const root = path.resolve(arg('root') ?? '.')
	const port = Number(arg('port') ?? 4810)
	const idleMs = Number(arg('idle') ?? 60) * 60_000
	let lastRequest = Date.now()
	setInterval(() => {
		if (idleMs <= 0 || Date.now() - lastRequest < idleMs) return
		console.log(`No requests for ${idleMs / 60_000} min; server stopped.`)
		process.exit(0)
	}, 60_000).unref()
	const HOSTS = new Set()
 const dispatch = createDispatcher()
 const connection = dir => runtime(dir).host === 'codex' && existsSync(path.join(dir, '.codex-connection.json'))
 const status = dir => {
  const buildFile = path.join(dir, '.building.json')
  const build = existsSync(buildFile) ? JSON.parse(readFileSync(buildFile, 'utf8')) : null
  return {...runtime(dir), building: !!build && build.feedback === lines(path.join(dir, 'feedback.jsonl')).length && Date.now()-build.at < 30*60_000,
   published: existsSync(path.join(dir,'published')) ? Number(readFileSync(path.join(dir,'published'),'utf8')) : 0,
   received: lines(path.join(dir,'feedback.jsonl')).length <= Math.max(consumedCount(dir), Number(existsSync(path.join(dir,'.queued')) ? readFileSync(path.join(dir,'.queued'),'utf8') : 0)),
   watching: connection(dir) || watcherAlive(dir) || watcherAlive(dir,'.queue-bridge.pid'),
   dispatchError: existsSync(path.join(dir,'.queue-error')) ? readFileSync(path.join(dir,'.queue-error'),'utf8') : null,
   context: existsSync(path.join(dir,'context')) ? Number(readFileSync(path.join(dir,'context'),'utf8')) : null}
 }
	const server = createServer((req, res) => {
		lastRequest = Date.now()
		const url = new URL(req.url, 'http://x')
		const pathname = decodeURIComponent(url.pathname)
		const send = (code, body = '', type = 'text/plain') => {
			res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' })
			res.end(body)
		}

		// Only this machine's own origin may talk to the server: a Host check stops DNS rebinding, and
		// the Origin and JSON checks stop other sites posting feedback that would reach Claude as instructions.
		if (!HOSTS.has(req.headers.host)) return send(403)
		const foreign = req.method === 'POST' && (req.headers.origin !== `http://${req.headers.host}` || !req.headers['content-type']?.startsWith('application/json'))
		if (foreign) return send(403)

		if (pathname.startsWith('/__proto/')) {
			const file = path.join(ASSETS, path.basename(pathname))
			return existsSync(file) ? send(200, readFileSync(file), TYPES[path.extname(file)]) : send(404)
		}

		const target = path.join(root, pathname)
		if (target !== root && !target.startsWith(root + path.sep)) return send(403)
		const dir = path.dirname(target)

		if (path.basename(target) === '__feedback' && req.method === 'POST') {
			let body = ''
			req.on('data', (c) => (body += c))
			req.on('end', async () => {
				try {
					appendFileSync(path.join(dir, 'feedback.jsonl'), JSON.stringify({ ...JSON.parse(body), at: new Date().toISOString() }) + '\n')
					if (connection(dir)) await dispatch(dir)
					send(204)
				} catch {
					send(400)
				}
			})
			return
		}
		// A Send nobody has read is withdrawn; one Claude already read cannot be, so the page only stops waiting.
		if (path.basename(target) === '__cancel' && req.method === 'POST') {
			const feedback = path.join(dir, 'feedback.jsonl')
			const read = Math.max(consumedCount(dir), Number(existsSync(path.join(dir,'.queued')) ? readFileSync(path.join(dir,'.queued'),'utf8') : 0))
			const all = lines(feedback)
			if (all.length > read) writeFileSync(feedback, all.slice(0, read).map((l) => l + '\n').join(''))
			return send(200, JSON.stringify({ withdrawn: all.length > read }), 'application/json')
		}
  if (path.basename(target) === '__status') return send(200, JSON.stringify(status(dir)), 'application/json')
  if (path.basename(target) === '__events') {
   res.writeHead(200, {'content-type':'text/event-stream','cache-control':'no-store','connection':'keep-alive'})
   const emit = () => { try {res.write(`data: ${JSON.stringify(status(dir))}\n\n`)} catch {} }
   const observer = watch(dir, (_event,name) => {if (['published','.building.json','.runtime.json','.queued','.queue-error','feedback.jsonl'].includes(String(name))) emit()})
   observer.on('error', () => res.end())
   emit()
   req.on('close', () => observer.close())
   return
  }

		let file = target
		if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, 'index.html')
		if (!existsSync(file)) return send(404)
		if (path.basename(file) === 'index.html' && connection(path.dirname(file))) void dispatch(path.dirname(file))
		send(200, readFileSync(file), TYPES[path.extname(file)] ?? 'application/octet-stream')
	})
	// Each session serves its own scratchpad, so a taken port usually means another session: step up.
	let tryPort = port
	server.on('error', (e) => {
		if (e.code !== 'EADDRINUSE' || tryPort >= port + 10) {
			console.error(e.message)
			process.exit(1)
		}
		server.listen(++tryPort, '127.0.0.1')
	})
	server.on('listening', () => {
		HOSTS.add(`127.0.0.1:${tryPort}`).add(`localhost:${tryPort}`)
		console.log(`serving ${root} at http://127.0.0.1:${tryPort}/`)
	})
	server.listen(tryPort, '127.0.0.1')
}

async function wait(dir) {
	const lock = path.join(dir, '.watcher.pid')
	if (watcherAlive(dir)) {
		console.log(`Already watching ${dir} (pid ${readFileSync(lock, 'utf8')}).`)
		return
	}
	writeFileSync(lock, String(process.pid))
	const release = () => existsSync(lock) && readFileSync(lock, 'utf8') === String(process.pid) && unlinkSync(lock)
	process.on('exit', release)
	process.on('SIGTERM', () => process.exit(0))
	process.on('SIGINT', () => process.exit(0))

	const feedback = path.join(dir, 'feedback.jsonl')
	const offsetFile = path.join(dir, '.consumed')
	const consumed = consumedCount(dir)
	const deadline = Date.now() + Number(arg('idle') ?? 120) * 60_000
	while (lines(feedback).length <= consumed) {
		if (Date.now() > deadline) {
			console.log(`No Send for ${arg('idle') ?? 120} min; watcher stopped. Restart it if the user is still iterating.`)
			return
		}
		await new Promise((r) => setTimeout(r, 500))
	}

	const all = lines(feedback)
	writeFileSync(offsetFile, String(all.length))
	const indent = (text) => text.replace(/\n/g, '\n         ')
	for (const raw of all.slice(consumed)) {
		const f = JSON.parse(raw)
		console.log(`Prototype feedback (${path.basename(dir)}), sent while viewing ${f.viewing}, latest ${f.latest}`)
		if (f.locked) console.log(`  LOCKED IN ${f.locked.replace('/', ' · ')}. Wrap up; build no new version.`)
		for (const verdict of ['keep', 'change', 'drop'])
			for (const p of (f.picks ?? []).filter((x) => x.verdict === verdict))
				console.log(`  ${verdict.toUpperCase().padEnd(6)} ${p.version} · ${p.variant}${p.note ? `: ${indent(p.note)}` : ''}`)
		if (f.note) console.log(`  ${f.locked ? 'Build notes' : 'Direction'}: ${indent(f.note)}`)
	}
}

function publish(dir) {
    writeFileSync(path.join(dir, '.runtime.json'), JSON.stringify(runtime(dir)))
    const buildFile = path.join(dir, '.building.json')
    if (existsSync(buildFile)) unlinkSync(buildFile)
	const n = countVersions(dir)
	writeFileSync(path.join(dir, 'published'), String(n))
	const context = sessionContext()
	if (context) writeFileSync(path.join(dir, 'context'), String(context))
	console.log(`published V${n}${context ? ` (context ${Math.round(context / 1000)}k)` : ''}`)
}

// The session's context size is its last assistant turn's input, read from the tail of its transcript.
function sessionContext() {
	const id = process.env.CLAUDE_CODE_SESSION_ID
	const projects = path.join(homedir(), '.claude/projects')
	if (!id || !existsSync(projects)) return null
	const file = readdirSync(projects).map((d) => path.join(projects, d, `${id}.jsonl`)).find(existsSync)
	if (!file) return null
	const size = statSync(file).size
	const length = Math.min(size, 2_000_000)
	const buf = Buffer.alloc(length)
	const fd = openSync(file, 'r')
	readSync(fd, buf, 0, length, size - length)
	closeSync(fd)
	for (const line of buf.toString('utf8').split('\n').reverse()) {
		const usage = line.includes('"usage"') && (() => { try { return JSON.parse(line).message?.usage } catch { return null } })()
		if (usage) return (usage.input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0) + (usage.cache_creation_input_tokens ?? 0)
	}
	return null
}

// ps etime is [[dd-]hh:]mm:ss.
function etimeHours(etime) {
	const [days, clock] = etime.includes('-') ? etime.split('-') : ['0', etime]
	const parts = clock.split(':').map(Number)
	while (parts.length < 3) parts.unshift(0)
	return Number(days) * 24 + parts[0] + parts[1] / 60 + parts[2] / 3600
}
function loops() {
	const out = execFileSync('ps', ['-Ao', 'pid=,etime=,command='], { encoding: 'utf8' })
	return out.split('\n').flatMap((line) => {
		const m = line.trim().match(/^(\d+)\s+(\S+)\s+node\s+\S*loop\.mjs\s+(serve|await|bridge)\s+(?:--root\s+)?(\S+)/)
		return m && Number(m[1]) !== process.pid ? [{ pid: Number(m[1]), hours: etimeHours(m[2]), kind: m[3], target: path.resolve(m[4]) }] : []
	})
}
function list() {
	const all = loops()
	if (!all.length) return console.log('No prototype servers or watchers running.')
	for (const l of all.sort((a, b) => b.hours - a.hours)) console.log(`${String(l.pid).padEnd(7)} ${l.kind.padEnd(6)} ${`${l.hours.toFixed(1)} h`.padStart(8)}  ${l.target}`)
}
function stop() {
	const older = arg('older')
	const paths = rest.filter((r, i) => r !== '--older' && rest[i - 1] !== '--older').map((r) => path.resolve(r))
	if (!paths.length && older === undefined) {
		console.error('usage: loop.mjs stop <path>... | stop --older <hours>')
		process.exit(1)
	}
	const under = (target) => paths.some((p) => target === p || target.startsWith(p + path.sep) || p.startsWith(target + path.sep))
	const hits = loops().filter((l) => (older !== undefined ? l.hours >= Number(older) : under(l.target)))
	for (const l of hits) {
		try {
			process.kill(l.pid, 'SIGTERM')
			console.log(`stopped ${l.kind} ${l.pid} (${l.hours.toFixed(1)} h) ${l.target}`)
		} catch (e) {
			console.log(`could not stop ${l.pid}: ${e.code}`)
		}
	}
	if (!hits.length) console.log('Nothing to stop.')
}
