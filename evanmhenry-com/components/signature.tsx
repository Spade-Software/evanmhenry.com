'use client'

import { useEffect, useRef, useState, type PointerEvent } from 'react'

type Point = [number, number]
const storageKey = 'portfolio:signature'

function stroke(points: Point[]) {
  if (points.length < 2) return ''
  let path = `M${points[0][0]} ${points[0][1]}`
  for (let i = 1; i < points.length - 1; i++) path += `Q${points[i][0]} ${points[i][1]} ${(points[i][0] + points[i + 1][0]) / 2} ${(points[i][1] + points[i + 1][1]) / 2}`
  return path + `L${points.at(-1)![0]} ${points.at(-1)![1]}`
}

function play(svg: SVGSVGElement | null) {
  if (!svg || matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const paths = [...svg.querySelectorAll('path')]
  const total = paths.reduce((sum, path) => sum + path.getTotalLength(), 0)
  let delay = 0
  paths.forEach(path => {
    path.getAnimations().forEach(animation => animation.cancel())
    const duration = Math.max(40, 1800 * path.getTotalLength() / Math.max(1, total))
    path.setAttribute('pathLength', '1')
    path.style.strokeDasharray = '1'
    path.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration, delay, easing: 'linear', fill: 'backwards' })
    delay += duration + 60
  })
}

export function Signature() {
  const dialog = useRef<HTMLDialogElement>(null)
  const pad = useRef<SVGSVGElement>(null)
  const signed = useRef<SVGSVGElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const phase = useRef('idle')
  const points = useRef<Point[]>([])
  const completed = useRef<string[]>([])
  const pen = useRef<Point>([240, 90])
  const lastPointer = useRef<Point | null>(null)
  const drawing = useRef(false)
  const [status, setStatus] = useState('Ready. Pointer movement starts at 10% speed.')
  const [recording, setRecording] = useState(false)
  const [counting, setCounting] = useState(false)
  const [paths, setPaths] = useState<string[]>([])
  const [saved, setSaved] = useState<string[]>([])
  const [speed, setSpeed] = useState(.1)
  const [smoothing, setSmoothing] = useState(.35)
  const update = () => setPaths([...completed.current, ...(stroke(points.current) ? [stroke(points.current)] : [])])
  const finish = () => {
    const path = stroke(points.current)
    if (path) completed.current.push(path)
    points.current = []
    drawing.current = false
    update()
  }
  const stop = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    phase.current = 'idle'
    setCounting(false)
    setRecording(false)
    lastPointer.current = null
    finish()
    setStatus('Paused.')
  }
  useEffect(() => {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(storageKey) || '[]')
      if (Array.isArray(value)) {
        const valid = value.filter((item): item is string => typeof item === 'string' && /^[MLQ0-9., \-]+$/.test(item))
        completed.current = valid
        setPaths(valid)
        setSaved(valid)
      }
    } catch { /* Storage can be unavailable in private browsing. */ }
    return () => timers.current.forEach(clearTimeout)
  }, [])
  useEffect(() => {
    if (!saved.length || !trigger.current) return
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return
      observer.disconnect()
      play(signed.current)
    }, { threshold: .5 })
    observer.observe(trigger.current)
    return () => observer.disconnect()
  }, [saved])
  const toggle = () => {
    if (phase.current !== 'idle') { stop(); return }
    finish()
    phase.current = 'countdown'
    setCounting(true)
    setStatus('Recording starts in 2…')
    timers.current.push(setTimeout(() => setStatus('Recording starts in 1…'), 1000))
    timers.current.push(setTimeout(() => {
      if (!dialog.current?.open) return
      phase.current = 'recording'
      setCounting(false)
      setRecording(true)
      lastPointer.current = null
      if (!completed.current.length) pen.current = [240, 90]
      setStatus('Recording. Move to draw; Space pauses.')
    }, 2000))
  }
  const add = (event: PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    let raw: Point
    if (phase.current === 'recording' && event.pointerType === 'mouse') {
      if (!lastPointer.current) {
        lastPointer.current = [event.clientX, event.clientY]
        points.current.push([...pen.current])
        update()
        return
      }
      pen.current = [Math.max(0, Math.min(480, pen.current[0] + (event.clientX - lastPointer.current[0]) * 480 / bounds.width * speed)), Math.max(0, Math.min(180, pen.current[1] + (event.clientY - lastPointer.current[1]) * 180 / bounds.height * speed))]
      lastPointer.current = [event.clientX, event.clientY]
      raw = [...pen.current]
    } else raw = [Math.max(0, Math.min(480, (event.clientX - bounds.left) * 480 / bounds.width)), Math.max(0, Math.min(180, (event.clientY - bounds.top) * 180 / bounds.height))]
    const last = points.current.at(-1)
    points.current.push(last ? [last[0] + (raw[0] - last[0]) * smoothing, last[1] + (raw[1] - last[1]) * smoothing] : raw)
    update()
  }
  const clear = () => {
    stop()
    completed.current = []
    points.current = []
    pen.current = [240, 90]
    setPaths([])
    setStatus('Cleared. Ready to record.')
  }
  return <>
    <button ref={trigger} className="signature-trigger" onClick={() => dialog.current?.showModal()} aria-label="Draw your signature">
      {saved.length ? <svg ref={signed} viewBox="0 0 480 180" aria-hidden="true">{saved.map((path, index) => <path key={index} d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />)}</svg> : 'Draw signature'}
    </button>
    <dialog ref={dialog} className="signature-dialog" aria-labelledby="signature-title" onCancel={stop}>
      <h2 id="signature-title">Your signature</h2><p>Start recording gives you two seconds to position the cursor. Follow the dot as you draw. Space pauses. Saved only in this browser.</p>
      <div className="signature-controls"><button onClick={toggle} aria-pressed={recording}>{counting ? 'Cancel countdown' : recording ? 'Pause recording' : 'Start recording'}</button>
        <label>Pointer speed <select value={speed} onChange={event => setSpeed(Number(event.target.value))}><option value="0.05">5% · finest</option><option value="0.1">10% · precise</option><option value="0.2">20%</option><option value="1">100%</option></select></label>
        <label>Smoothing <select value={smoothing} onChange={event => setSmoothing(Number(event.target.value))}><option value="1">Off</option><option value="0.6">Light</option><option value="0.35">Medium</option></select></label>
      </div>
      <p className="record-status" role="status" aria-live="polite">{status}</p>
      <svg ref={pad} className={`signature-pad${recording ? ' is-recording' : ''}`} viewBox="0 0 480 180" tabIndex={0} role="img" aria-label="Signature drawing area"
        onKeyDown={event => { if (event.code === 'Space') { event.preventDefault(); toggle() } }}
        onPointerDown={event => { event.preventDefault(); if (phase.current === 'idle') { finish(); drawing.current = true; event.currentTarget.setPointerCapture(event.pointerId); add(event) } }}
        onPointerMove={event => { if (phase.current === 'recording' || drawing.current) add(event) }}
        onPointerLeave={() => { if (phase.current === 'recording') { finish(); lastPointer.current = null } }}
        onPointerUp={() => { if (drawing.current) finish() }} onPointerCancel={() => { if (drawing.current) finish() }} onLostPointerCapture={() => { if (drawing.current) finish() }}>
        {paths.map((path, index) => <path key={`${index}-${path}`} d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />)}
        {(recording || counting) && <circle cx={pen.current[0]} cy={pen.current[1]} r="3" fill="currentColor" opacity={recording ? .6 : .3} />}
      </svg>
      <div className="signature-actions"><button onClick={clear}>Clear</button><button disabled={!paths.length} onClick={() => { stop(); requestAnimationFrame(() => play(pad.current)) }}>Preview signing</button><button onClick={() => { stop(); dialog.current?.close() }}>Close</button><button disabled={!paths.length} onClick={() => {
        stop()
        const value = [...completed.current]
        try { localStorage.setItem(storageKey, JSON.stringify(value)) } catch { setStatus('Could not save in this browser.'); return }
        setSaved(value)
        dialog.current?.close()
      }}>Use signature</button></div>
    </dialog>
  </>
}
