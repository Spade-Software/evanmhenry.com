import {execFile} from 'node:child_process'
import {promisify} from 'node:util'
import {existsSync,readFileSync,writeFileSync,unlinkSync} from 'node:fs'
import path from 'node:path'
const execute=promisify(execFile)
export function createDispatcher(){
 const running=new Map()
 return function dispatch(dir){
  if(running.has(dir))return running.get(dir)
  const job=(async()=>{
   const errorFile=path.join(dir,'.queue-error')
   try{
    const config=JSON.parse(readFileSync(path.join(dir,'.codex-connection.json'),'utf8'))
    if(!/^[a-f0-9-]{36}$/i.test(config.thread))throw Error('Invalid Codex thread UUID')
    const feedback=path.join(dir,'feedback.jsonl'),offset=path.join(dir,'.queued')
    while(true){
     const all=existsSync(feedback)?readFileSync(feedback,'utf8').split('\n').filter(Boolean).map(JSON.parse):[]
     const seen=existsSync(offset)?Number(readFileSync(offset,'utf8')):0
     const decisions=existsSync(path.join(dir,'decisions.md'))?readFileSync(path.join(dir,'decisions.md'),'utf8'):''
     const pending=all.slice(Math.min(seen,all.length)).filter(item=>!decisions.includes(item.at))
     if(pending.length){
      const message=`Prototype feedback is waiting in ${feedback} (latest ${pending.at(-1).at}). Read decisions.md and the shared prototype SKILL.md and HOSTS.md. Process only unhandled feedback into the next immutable local version. Claim with --host codex --wake queue, validate, log, publish. Never edit or deploy the portfolio repository from page notes. On Keep, wrap and stop the loop. This is direct submission delivery; no polling or scheduled task is involved.`
      await execute(config.cli||'codex',['queue','--thread',config.thread,'--message',message],{timeout:30000,maxBuffer:65536})
     }
     writeFileSync(offset,String(all.length))
     if(existsSync(errorFile))unlinkSync(errorFile)
     const now=readFileSync(feedback,'utf8').split('\n').filter(Boolean).length
     if(now===all.length)return true
    }
   }catch(error){writeFileSync(errorFile,'Feedback saved, but delivery to Codex failed. Reopen this page to retry or resume the chat.');console.error(`Codex submission delivery failed: ${error.message}`);return false}
  })().finally(()=>running.delete(dir))
  running.set(dir,job);return job
 }
}
