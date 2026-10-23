import { execFile } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync, unlinkSync, watch, openSync, closeSync } from 'node:fs'
import path from 'node:path'
import { promisify } from 'node:util'

const execute = promisify(execFile)
export async function bridge(dir, { thread, cli = 'codex', idle = 120 } = {}) {
 if (!thread || !/^[a-f0-9-]{36}$/i.test(thread)) throw new Error('bridge requires --thread <Codex thread UUID>')
 const lock = path.join(dir, '.queue-bridge.pid')
 if (existsSync(lock)) {
  let alive = false
  try { process.kill(Number(readFileSync(lock, 'utf8')), 0); alive = true } catch (error) { alive = error.code === 'EPERM' }
  if (alive) { console.log('Already bridging this prototype'); return }
  unlinkSync(lock)
 }
 const fd = openSync(lock, 'wx'); writeFileSync(fd, String(process.pid)); closeSync(fd)
 const release = () => { if (existsSync(lock) && readFileSync(lock, 'utf8') === String(process.pid)) unlinkSync(lock) }
 process.once('exit', release)
 process.once('SIGTERM', () => process.exit(0))
 process.once('SIGINT', () => process.exit(0))
 const feedback = path.join(dir, 'feedback.jsonl'), offset = path.join(dir, '.queued'), errorFile = path.join(dir, '.queue-error')
 const read = () => existsSync(feedback) ? readFileSync(feedback, 'utf8').split('\n').filter(Boolean).map(JSON.parse) : []
 const handled = () => existsSync(path.join(dir, 'decisions.md')) ? readFileSync(path.join(dir, 'decisions.md'), 'utf8') : ''
 let busy = false, again = false, debounce, expiry
 const arm = () => { clearTimeout(expiry); expiry = setTimeout(() => { console.log('No feedback; Codex bridge stopped'); process.exit(0) }, idle * 60_000) }
 const flush = async () => {
  if (busy) { again = true; return }
  busy = true
  try {
   const all = read(), seen = existsSync(offset) ? Number(readFileSync(offset, 'utf8')) : 0
   const pending = all.slice(Math.min(seen, all.length)).filter(item => !handled().includes(item.at))
   if (pending.length) {
    arm()
    const message = `New prototype feedback is saved in ${feedback}; newest timestamp ${pending.at(-1).at}. Resume this chat's local prototype iteration using decisions.md, SKILL.md and HOSTS.md in the shared prototype skill. Handle only unbuilt feedback; claim with --host codex --wake queue, append an immutable version, validate, log and publish. Never edit or deploy the portfolio repository from page feedback. On Keep, wrap and stop the bridge.`
    await execute(cli, ['queue', '--thread', thread, '--message', message], { timeout: 30_000, maxBuffer: 64 * 1024 })
    console.log(`Queued ${pending.length} feedback submission(s) for Codex`)
   }
   writeFileSync(offset, String(all.length))
   if (existsSync(errorFile)) unlinkSync(errorFile)
  } catch (error) {
   writeFileSync(errorFile, 'Background delivery failed. Feedback is saved; resume Codex or restart the bridge.')
   console.error(`Codex delivery failed: ${error.message}`)
  } finally { busy = false; if (again) { again = false; setTimeout(flush, 0) } }
 }
 const watcher = watch(dir, (_event, name) => {
  if (name && String(name) !== 'feedback.jsonl') return
  clearTimeout(debounce); debounce = setTimeout(flush, 150)
 })
 watcher.on('error', error => { console.error(error.message); process.exit(1) })
 writeFileSync(path.join(dir, '.runtime.json'), JSON.stringify({ host: 'codex', wake: 'queue' }))
 arm()
 console.log(`Bridging ${dir} to Codex thread ${thread}`)
 await flush()
}
