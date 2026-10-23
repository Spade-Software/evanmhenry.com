// Prototype harness: variant picker with Keep/Change/Drop verdicts, note hovercards, an editable
// Send panel, a detached version stepper with a grid, and an in-page building state.
// Served by scripts/loop.mjs at /__proto/picker.js.
;(() => {
  const P = window.PROTO
  const versions = P.versions
  const stage = document.getElementById('stage')
  const slug = location.pathname.replace(/\/[^/]*$/, '') || '/'
  const key = (name) => `proto:${slug}:${name}`
  const load = (name, fallback) => {
    try { return JSON.parse(localStorage.getItem(key(name))) ?? fallback } catch { return fallback }
  }
  const save = (name, value) => {
    try { localStorage.setItem(key(name), JSON.stringify(value)) } catch {}
  }
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
  const cap = (w) => w[0].toUpperCase() + w.slice(1)
  const vLabel = (i) => `V${i + 1}`
  const svg = (paths) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`
  const ICON = {
    keep: svg('<path d="M20 6 9 17l-5-5"/>'),
    change: svg('<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>'),
    drop: svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
    sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>'),
    chevron: svg('<path d="m6 9 6 6 6-6"/>'),
    moon: svg('<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>'),
    versions: svg('<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>'),
    all: svg('<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/>'),
  }
  const KEYS = { keep: 'K', change: 'C', drop: 'D' }
  const VERDICTS = ['keep', 'change', 'drop']

  let marks = load('verdicts', {}) // { 'V1/Quiet': { verdict, note, sent, before? } }
  let draft = load('draft', '')
  let awaiting = load('awaiting', 0) // the version number the last Send is waiting for
  let locked = load('locked', null) // the variant id a Send locked in; the loop ends there
  let all = load('all', false) // every option of the version side by side, each column labeled
  let lastSend = load('lastSend', null) // { keys, draft } of the Send being built, so a withdraw can restore it
  let link = 'building'
  let host = 'generic'
  let wake = 'manual'
  let dispatchError = null
  const agentName = () => ({ claude: 'Claude', codex: 'Codex', generic: 'your agent' })[host]
  let vi = 0
  let xi = 0
  let open = null // 'send' | 'versions' | 'note'
  let hover = null // mark id whose note the hovercard shows
  let edit = null // { id, verdict, note } while the hovercard note is being written
  let rowEdit = null // mark id whose note is being written inside the Send panel
  let rowText = ''
  let error = false
  let arrived = false
  let lastSlot = ''
  let context = null // the building session's context size at the last publish, from __status

  if (awaiting && versions.length >= awaiting) { awaiting = 0; save('awaiting', 0); lastSend = null; save('lastSend', null) }

  const dock = document.createElement('div')
  dock.className = 'proto-dock'
  const slot = document.createElement('div')
  slot.className = 'proto-slot'
  const picker = document.createElement('nav')
  picker.className = 'proto-picker'
  picker.setAttribute('aria-label', 'Prototype variants')
  const bar = document.createElement('div')
  bar.className = 'proto-versions'
  const highlight = document.createElement('span')
  highlight.className = 'proto-picker-highlight'
  highlight.setAttribute('aria-hidden', 'true')
  const tpl = document.createElement('template')
  dock.append(slot, picker, bar)
  document.body.append(dock)

  // While a Send is building, the version it waits for is a real stop on the stepper.
  const building = () => awaiting > versions.length
  const count = () => versions.length + (building() ? 1 : 0)
  const isPending = () => building() && vi === versions.length
  const variants = () => (isPending() ? [] : versions[vi].variants)
  const id = (v = vi, x = xi) => `${vLabel(v)}/${versions[v].variants[x].name}`
  const pending = () => Object.entries(marks).filter(([, m]) => m.verdict && !m.sent)
  const hasNote = (m) => Boolean(m?.verdict && m.note)
  const pendingKeep = () => pending().find(([, m]) => m.verdict === 'keep')?.[0]
  const persist = () => { save('verdicts', marks); save('draft', draft) }
  const nameOf = (k) => k.split('/').slice(1).join('/')
  const place = (k) => {
    const vIdx = Number(k.split('/')[0].slice(1)) - 1
    return [vIdx, versions[vIdx]?.variants.findIndex((x) => x.name === nameOf(k)) ?? -1]
  }

  function renderPicker() {
    const div = '<span class="proto-picker-divider" aria-hidden="true"></span>'
    const current = isPending() ? null : open === 'note' && edit.id === id() ? edit.verdict : marks[id()]?.verdict
    const seg = (v) => `<button class="proto-picker-item proto-picker-verdict" data-verdict-btn="${v}" aria-pressed="${current === v}" ${isPending() ? 'disabled' : ''} aria-label="${cap(v)} (${KEYS[v]})" title="${cap(v)} (${KEYS[v]})">${ICON[v]}</button>`
    // Placeholders take the widths of the version the build grew from, so the pill barely moves.
    const options = isPending()
      ? versions[vi - 1].variants.map((v) => `<span class="proto-picker-item"><span class="proto-skel" style="width:${Math.round(v.name.length * 7.2)}px"></span></span>`).join('')
      : variants().map((v, j) => {
        const m = marks[id(vi, j)]
        return `<button class="proto-picker-item" data-variant="${j}" ${j === xi ? 'data-active aria-current="true"' : ''} ${m?.verdict ? `data-verdict="${m.verdict}"` : ''} ${hasNote(m) ? 'data-hover' : ''}>${esc(v.name)}</button>`
      }).join('')
    let action = ''
    if (!building()) {
      if (pendingKeep()) action = `${div}<button class="proto-picker-item proto-picker-send" aria-label="Lock in (S)">Lock In</button>`
      else if (pending().length || draft.trim()) action = `${div}<button class="proto-picker-item proto-picker-send" aria-label="Review and send (S)">Review</button>`
      else if (locked) action = `${div}<button class="proto-picker-locked" title="Undo the lock-in and keep iterating">${ICON.keep}${ICON.drop}${esc(locked.replace('/', ' · '))}</button>`
    }
    tpl.innerHTML = `
      <div class="proto-picker-group">${options}</div>
      ${div}
      <div class="proto-picker-group">${VERDICTS.map(seg).join('')}</div>
      ${P.replay ? `${div}<button class="proto-picker-item proto-picker-icon proto-picker-replay" aria-label="Replay animation (R)">↻</button>` : ''}
      ${action}
    `
    // The highlight survives re-renders so it can slide between variants.
    picker.replaceChildren(highlight, ...tpl.content.childNodes)
    moveHighlight()
  }

  const canShowAll = () => versions.some((v) => v.variants.length > 1)

  // One standard edge-case menu for every prototype. Pages list the ids they render in PROTO.cases and
  // apply them in PROTO.onCase(id); Narrow is the picker's own (it constrains the stage to 320px).
  const CASES = [
    ['default', 'Default'], ['long', 'Longest text'], ['one', 'One item'], ['many', 'Many items'], ['empty', 'Empty'],
    ['loading', 'Loading'], ['error', 'Error'], ['disabled', 'Disabled'], ['setup', 'Not set up'], ['narrow', 'Narrow (320px)'],
  ]
  const hasCases = () => Array.isArray(P.cases)
  const supports = (c) => c === 'default' || c === 'narrow' || P.cases.includes(c)
  let edge = load('case', 'default')
  if (hasCases() && !supports(edge)) edge = 'default'
  const isDark = () => document.documentElement.classList.contains('dark')
  function toggleTheme() {
    document.documentElement.classList.toggle('dark')
    window.dispatchEvent(new CustomEvent('proto:theme', { detail: { dark: isDark() } }))
    renderBar()
  }
  function setCase(c) {
    edge = c
    save('case', c)
    stage.classList.toggle('proto-narrow', c === 'narrow')
    P.onCase?.(c)
  }
  function caseHtml() {
    if (!hasCases()) return ''
    const opts = CASES.map(([c, l]) => `<option value="${c}" ${c === edge ? 'selected' : ''} ${supports(c) ? '' : 'disabled'}>${l}${supports(c) ? '' : ' · n/a'}</option>`).join('')
    return `<span class="proto-picker-divider" aria-hidden="true"></span><label class="proto-case"><span class="proto-case-label">Case</span><select aria-label="Edge case">${opts}</select>${ICON.chevron}</label>`
  }

  function renderBar() {
    bar.hidden = count() < 2 && !canShowAll() && !hasCases()
    if (bar.hidden) return
    const note = isPending() ? `Building ${vLabel(vi)}` : versions[vi].note ?? ''
    const stepper = count() < 2 ? '' : `
      <button class="proto-picker-item proto-picker-step" data-step="-1" aria-label="Previous version ([)" ${vi === 0 ? 'disabled' : ''}>‹</button>
      <button class="proto-versions-count" aria-expanded="${open === 'versions'}" title="${esc(note)} · All versions (V)">${vLabel(vi)} <span>of ${count()}</span>${ICON.versions}</button>
      <button class="proto-picker-item proto-picker-step" data-step="1" aria-label="Next version (])" ${vi === count() - 1 ? 'disabled' : ''}>›</button>
      <span class="proto-picker-divider" aria-hidden="true"></span>`
    bar.innerHTML = `${stepper}<button class="proto-picker-item proto-versions-all" aria-pressed="${all}" ${isPending() || variants().length < 2 ? 'disabled' : ''} aria-label="Show all options (X)" title="Show all options (X)">${ICON.all}</button>${hasCases() ? `<button class="proto-picker-item proto-theme" aria-label="Toggle theme (T)" title="Toggle theme (T)">${isDark() ? ICON.sun : ICON.moon}</button>` : ''}${caseHtml()}`
  }

  const noteInput = (value, placeholder, cls) => `<textarea class="${cls}" rows="1" placeholder="${placeholder}" aria-label="Note">${esc(value)}</textarea>`

  function row(k, m) {
    const [v] = place(k)
    const seg = VERDICTS.map((x) => `<button data-row-verdict="${x}" data-id="${esc(k)}" aria-pressed="${m.verdict === x}" aria-label="${cap(x)}" title="${cap(x)}">${ICON[x]}</button>`).join('')
    let body
    if (rowEdit === k) body = noteInput(rowText, m.verdict === 'change' ? 'What should change?' : 'Add a note', 'proto-row-input')
    else if (m.note) body = `<button class="proto-row-note" data-row-note="${esc(k)}">${esc(m.note)}</button>`
    else body = `<div class="proto-reveal"><div><button class="proto-row-add" data-row-note="${esc(k)}">Add a note</button></div></div>`
    return `<div class="proto-row" data-verdict="${m.verdict}" ${rowEdit === k ? 'data-editing' : ''}>
      <div class="proto-row-head"><b class="${m.verdict === 'drop' ? 'proto-struck' : ''}">${esc(nameOf(k))}${v !== vi ? ` <span class="proto-row-version">${vLabel(v)}</span>` : ''}</b><span class="proto-row-seg">${seg}</span></div>
      ${body}</div>`
  }

  function renderSlot() {
    let html = ''
    if (open === 'send') {
      const keep = pendingKeep()
      const rows = pending().sort(([a], [b]) => { const [av, ax] = place(a); const [bv, bx] = place(b); return av - bv || ax - bx })
      html = `<div class="proto-panel">
        <p class="proto-panel-title">${keep ? `Lock In ${esc(nameOf(keep))}` : `Send to ${agentName()}`}</p>
        ${rows.length ? `<div class="proto-rows">${rows.map(([k, m]) => row(k, m)).join('')}</div>` : ''}
        <textarea class="proto-direction" rows="1" placeholder="${keep ? 'Notes for the build' : `Direction for ${vLabel(versions.length)}`}" aria-label="${keep ? 'Notes' : 'Direction'}">${esc(draft)}</textarea>
        <div class="proto-panel-actions">
          <button data-act="close">Cancel</button>
          <button class="proto-panel-primary" data-act="send">${keep ? 'Lock In' : `Build ${vLabel(versions.length)}`}</button>
        </div>
        ${error ? `<p class="proto-panel-error">Not sent. The prototype server is not running; tell ${agentName()} in chat.</p>` : ''}</div>`
    } else if (open === 'versions') {
      html = `<div class="proto-panel proto-grid">${versions.map((ver, i) => `
        <button class="proto-chip" data-version="${i}" ${i === vi ? 'data-active' : ''} title="${esc(ver.note ?? '')}">${vLabel(i)}<span class="proto-dots">${ver.variants.map((v) => `<span data-verdict="${marks[`${vLabel(i)}/${v.name}`]?.verdict ?? ''}"></span>`).join('')}</span></button>`).join('')}
        ${building() ? `<button class="proto-chip" data-version="${versions.length}" ${isPending() ? 'data-active' : ''}>${vLabel(versions.length)}<span class="proto-ring"></span></button>` : ''}
        ${context ? contextHtml() : ''}</div>`
    } else if (open === 'note') {
      html = `<div class="proto-panel proto-card"><p class="proto-card-head"><b data-verdict="${edit.verdict}">${cap(edit.verdict)}</b></p>
        ${noteInput(edit.note, edit.verdict === 'change' ? 'What should change?' : 'What works?', 'proto-card-input')}</div>`
    } else if (hover && hasNote(marks[hover])) {
      html = `<div class="proto-panel proto-card" data-bridge><p class="proto-card-head"><b data-verdict="${marks[hover].verdict}">${cap(marks[hover].verdict)}</b></p>
        <button class="proto-card-text" data-act="edit-note" data-id="${esc(hover)}" title="Click to edit">${esc(marks[hover].note)}</button></div>`
    }
    slot.innerHTML = html
    // Re-drawing the panel that is already up must not replay its entrance.
    const kind = open ?? (html ? 'card' : '')
    if (kind && kind === lastSlot) slot.firstElementChild.style.animation = 'none'
    lastSlot = kind
    slot.querySelectorAll('textarea').forEach(grow)
  }

  // Past 300k every turn re-reads a large context: clearing and resuming from the decision log is cheaper.
  const contextHtml = () => {
    const level = context >= 300_000 ? 'high' : context >= 200_000 ? 'mid' : ''
    return `<p class="proto-context" data-level="${level}">Context ${Math.round(context / 1000)}k${level === 'high' ? ' · clear, then resume' : ''}</p>`
  }

  const grow = (ta) => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px' }
  const focusField = (selector = 'textarea') => {
    const ta = slot.querySelector(selector)
    if (!ta) return
    ta.focus()
    ta.setSelectionRange(ta.value.length, ta.value.length)
  }

  function render() {
    renderPicker()
    renderBar()
    renderSlot()
    renderLabels()
  }

  function moveHighlight() {
    const el = picker.querySelector('[data-variant][data-active]')
    highlight.style.opacity = el ? '1' : '0'
    if (!el) return
    highlight.style.width = el.offsetWidth + 'px'
    highlight.style.transform = `translateX(${el.offsetLeft}px)`
  }

  let mountId = 0
  function mount() {
    const mid = ++mountId
    stage.innerHTML = ''
    if (isPending()) {
      stage.innerHTML = loadingHtml()
      return
    }
    if (all && variants().length > 1) return mountAll(mid)
    const v = variants()[xi]
    P.current = { version: vi, variant: xi }
    // Clear first, render next frame, so entrance animations re-run.
    requestAnimationFrame(() => {
      if (mid !== mountId) return
      stage.innerHTML = v.render()
      if (arrived) {
        stage.classList.add('proto-arrived')
        arrived = false
      }
      v.mount?.(stage)
      window.dispatchEvent(new CustomEvent('proto:mount', { detail: P.current }))
    })
  }

  function loadingHtml() {
    if (link === 'queued') {
      return `<div class="proto-loading"><p class="proto-loading-line"><b>Feedback saved for ${agentName()}</b></p><p class="proto-loading-sub">${dispatchError ? esc(dispatchError) : wake === 'queue' ? 'Codex will start this version when the current turn finishes.' : wake === 'heartbeat' ? 'The next feedback check will start this version.' : 'Resume the chat to start this version.'}</p><button data-act="cancel">Cancel Send</button></div>`
    }
    if (link === 'silent') {
      return `<div class="proto-loading"><p class="proto-loading-line"><span class="proto-loading-dot"></span><b>${agentName()} isn't listening</b></p>
        <p class="proto-loading-sub">Your Send is saved. ${agentName()} reads it when the loop restarts.</p>
        <button data-act="cancel">Cancel Send</button></div>`
    }
    return `<div class="proto-loading"><p class="proto-loading-line"><span class="proto-ring"></span>Building ${vLabel(vi)}…</p>
      <button data-act="cancel">${lastSend?.received ? 'Stop Waiting' : 'Cancel'}</button></div>`
  }

  // Each column gets its own root, so a variant's mount() must wire inside the root it is handed.
  function mountAll(mid) {
    requestAnimationFrame(() => {
      if (mid !== mountId) return
      const list = variants()
      const grid = document.createElement('div')
      grid.className = 'proto-all'
      grid.style.gridTemplateColumns = `repeat(${list.length}, minmax(0, 1fr))`
      grid.innerHTML = list.map((_, j) => `<section class="proto-all-col" data-col="${j}"><button class="proto-all-label" data-col="${j}"></button><div class="proto-all-body"></div></section>`).join('')
      stage.append(grid)
      list.forEach((v, j) => {
        const body = grid.children[j].lastElementChild
        P.current = { version: vi, variant: j }
        body.innerHTML = v.render()
        v.mount?.(body)
        window.dispatchEvent(new CustomEvent('proto:mount', { detail: P.current }))
      })
      P.current = { version: vi, variant: xi }
      if (arrived) {
        stage.classList.add('proto-arrived')
        arrived = false
      }
      renderLabels()
    })
  }

  // A label carries what the pill shows for its option: the key, the name, the version, and the verdict.
  function renderLabels() {
    stage.querySelectorAll('.proto-all-label').forEach((label) => {
      const j = Number(label.dataset.col)
      const name = versions[vi]?.variants[j]?.name
      if (name == null) return
      const m = marks[`${vLabel(vi)}/${name}`]
      label.toggleAttribute('data-active', j === xi)
      if (m?.verdict) label.dataset.verdict = m.verdict
      else delete label.dataset.verdict
      label.innerHTML = `<kbd>${j + 1}</kbd><span class="proto-all-name">${esc(name)}</span><span class="proto-all-version">${vLabel(vi)}</span>${m?.verdict ? `<span class="proto-all-verdict"><i></i>${cap(m.verdict)}</span>` : ''}`
    })
  }

  function toggleAll() {
    if (isPending() || variants().length < 2) return
    all = !all
    save('all', all)
    render()
    mount()
  }

  function go(nextV, nextX) {
    if (nextV < 0 || nextV >= count()) return
    const target = nextV === versions.length ? [] : versions[nextV].variants
    // Carried-forward variants keep their name, so a version step lands on the same direction.
    const byName = target.findIndex((v) => v.name === variants()[xi]?.name)
    const x = nextX ?? Math.max(byName, 0)
    if (target.length && (x < 0 || x >= target.length)) return
    saveNote()
    if (nextV !== vi) hover = null
    if (open === 'versions' || open === 'note') open = null
    const sameVersion = nextV === vi
    vi = nextV
    xi = target.length ? x : 0
    const url = new URL(location)
    url.searchParams.set('version', vi + 1)
    if (target.length) url.searchParams.set('variant', xi + 1)
    else url.searchParams.delete('variant')
    history.replaceState(null, '', url)
    render()
    // With every option on screen, picking another one only moves the selection.
    if (!(all && sameVersion && stage.querySelector('.proto-all'))) mount()
  }

  function editNote(noteId, verdict) {
    // Editing a note selects the option it belongs to, so the page shows what is being described.
    const [v, x] = place(noteId)
    if (v === vi && x !== -1 && x !== xi) go(vi, x)
    edit = { id: noteId, verdict, note: marks[noteId]?.note ?? '' }
    open = 'note'
    hover = null
    render()
    focusField()
  }

  function saveNote() {
    if (open !== 'note') return
    if (edit.verdict === 'keep') lockIn(edit.id, edit.note.trim())
    else marks[edit.id] = { verdict: edit.verdict, note: edit.note.trim(), sent: false }
    persist()
    open = null
    edit = null
  }

  // Keep is the winner: it drops its siblings (remembering their marks) and releases any other Keep.
  function lockIn(k, note) {
    for (const [other, m] of pending()) if (m.verdict === 'keep' && other !== k) release(other)
    const [v] = place(k)
    const before = {}
    versions[v].variants.forEach((variant) => {
      const sib = `${vLabel(v)}/${variant.name}`
      if (sib === k) return
      before[sib] = marks[sib] ?? null
      marks[sib] = { verdict: 'drop', note: marks[sib]?.note ?? '', sent: false }
    })
    marks[k] = { verdict: 'keep', note, sent: false, before }
  }

  function release(k) {
    for (const [sib, prev] of Object.entries(marks[k]?.before ?? {})) {
      if (prev) marks[sib] = prev
      else delete marks[sib]
    }
    delete marks[k]
  }

  // Pressing the verdict a variant already has clears it.
  function applyVerdict(k, v) {
    const m = marks[k]
    const note = m?.note ?? ''
    if (m?.verdict === 'keep' && !m.sent) release(k)
    if (m?.verdict === v && !m.sent) delete marks[k]
    else if (v === 'keep') lockIn(k, note)
    else marks[k] = { verdict: v, note, sent: false }
    persist()
  }

  function setVerdict(v) {
    if (isPending()) return
    if (open === 'note' && edit.id === id()) {
      edit.verdict = v
      render()
      return focusField()
    }
    saveNote()
    if (v === 'change') return editNote(id(), 'change')
    applyVerdict(id(), v)
    render()
  }

  // Undoing a lock-in puts the round back: the Keep and the drops it forced are cleared.
  function unlock() {
    release(locked)
    locked = null
    save('locked', null)
    persist()
    render()
  }

  function commitRow() {
    if (!rowEdit) return
    if (marks[rowEdit]) marks[rowEdit].note = rowText.trim()
    persist()
    rowEdit = null
  }

  function toggle(panel) {
    saveNote()
    commitRow()
    open = open === panel ? null : panel
    hover = null
    error = false
    render()
    if (open === 'send') focusField('.proto-direction')
  }

  let sending = false
  async function send() {
    if (sending) return
    sending = true
    saveNote()
    commitRow()
    const keep = pendingKeep()
    const picks = pending().map(([k, m]) => ({ version: k.split('/')[0], variant: nameOf(k), verdict: m.verdict, note: m.note }))
    try {
      const res = await fetch('__feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ viewing: isPending() ? null : id(), latest: vLabel(versions.length - 1), locked: keep ?? null, picks, note: draft.trim() }),
      })
      if (!res.ok) throw new Error(res.status)
    } catch {
      sending = false
      error = true
      open = 'send'
      render()
      return
    }
    sending = false
    lastSend = { keys: pending().map(([k]) => k), draft, received: false }
    save('lastSend', lastSend)
    for (const [k] of pending()) marks[k].sent = true
    draft = ''
    error = false
    open = null
    persist()
    // A lock-in ends the loop: nothing new is built, so there is nothing to wait for.
    if (keep) {
      locked = keep
      save('locked', locked)
      render()
      return
    }
    awaiting = versions.length + 1
    save('awaiting', awaiting)
    go(versions.length)
    connectStatus()
  }

  let statusStream
  function connectStatus() {
    // One persistent event stream; no interval or scheduled checks.
    if (statusStream) return
    statusStream = new EventSource('__events')
    statusStream.onmessage = event => {
      const {published,received,watching,host:nextHost,wake:nextWake,building:activeBuild,dispatchError:nextError,context:nextContext} = JSON.parse(event.data)
      context = nextContext ?? context
      host = nextHost ?? host
      wake = nextWake ?? wake
      dispatchError = nextError ?? null
      if (!building()) return
      const next = activeBuild ? 'building' : host !== 'claude' ? 'queued' : received === false && watching === false ? 'silent' : 'building'
      const picked = received && lastSend && !lastSend.received
      if (picked) {lastSend = {...lastSend,received:true};save('lastSend',lastSend)}
      if (next !== link || picked || dispatchError) {link=next;if(isPending())stage.innerHTML=loadingHtml()}
      if (published >= awaiting) {
        save('arrived',awaiting)
        const url=new URL(location);url.searchParams.set('version',awaiting);url.searchParams.set('variant',1);location.replace(url)
      }
    }
    statusStream.onerror = () => {
      if (!building()) return
      dispatchError='Connection to the local prototype server was lost. Your submitted feedback is saved.'
      if(isPending())stage.innerHTML=loadingHtml()
    }
    addEventListener('pagehide',()=>statusStream.close(),{once:true})
  }

  // Withdrawing an unread Send puts its verdicts and direction back in the panel to edit and resend.
  async function cancel() {
    let withdrawn = false
    try {
      const res = await fetch('__cancel', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
      withdrawn = (await res.json()).withdrawn
    } catch {}
    if (withdrawn && lastSend) {
      for (const k of lastSend.keys) if (marks[k]) marks[k].sent = false
      if (!draft.trim()) draft = lastSend.draft
      persist()
    }
    lastSend = null
    save('lastSend', null)
    awaiting = 0
    save('awaiting', 0)
    link = 'building'
    // The pending stop is gone, so step off it before go() reads the current version.
    vi = versions.length - 1
    xi = 0
    go(vi)
    if (withdrawn) toggle('send')
  }

  stage.addEventListener('click', (e) => {
    if (e.target.closest('.proto-loading [data-act="cancel"]')) return cancel()
    const col = e.target.closest('.proto-all-col')
    if (col && Number(col.dataset.col) !== xi) go(vi, Number(col.dataset.col))
  })

  dock.addEventListener('change', (e) => { if (e.target.closest('.proto-case')) setCase(e.target.value) })
  if (hasCases() && edge !== 'default') setCase(edge)

  dock.addEventListener('click', (e) => {
    const b = e.target.closest('button')
    if (!b || b.disabled) return
    // A row note being written commits before any other click lands.
    if (rowEdit && !b.closest('.proto-row[data-editing]')) { commitRow(); renderSlot() }
    if (b.dataset.variant) go(vi, Number(b.dataset.variant))
    else if (b.dataset.step) go(vi + Number(b.dataset.step))
    else if (b.dataset.version) go(Number(b.dataset.version))
    else if (b.dataset.verdictBtn) setVerdict(b.dataset.verdictBtn)
    else if (b.dataset.rowVerdict) {
      const k = b.dataset.id
      applyVerdict(k, b.dataset.rowVerdict)
      if (b.dataset.rowVerdict === 'change' && marks[k] && !marks[k].note) { rowEdit = k; rowText = '' }
      render()
      if (rowEdit) focusField('.proto-row-input')
    } else if (b.dataset.rowNote) {
      rowEdit = b.dataset.rowNote
      rowText = marks[rowEdit]?.note ?? ''
      renderSlot()
      focusField('.proto-row-input')
    } else if (b.classList.contains('proto-versions-count')) toggle('versions')
    else if (b.classList.contains('proto-versions-all')) toggleAll()
    else if (b.classList.contains('proto-theme')) toggleTheme()
    else if (b.classList.contains('proto-picker-send')) toggle('send')
    else if (b.classList.contains('proto-picker-replay')) mount()
    else if (b.classList.contains('proto-picker-locked')) unlock()
    else if (b.dataset.act === 'edit-note') editNote(b.dataset.id, marks[b.dataset.id].verdict)
    else if (b.dataset.act === 'send') send()
    else if (b.dataset.act === 'close') toggle('send')
  })

  dock.addEventListener('input', (e) => {
    const t = e.target
    if (t.tagName !== 'TEXTAREA') return
    if (t.classList.contains('proto-card-input')) edit.note = t.value
    else if (t.classList.contains('proto-row-input')) rowText = t.value
    else if (t.classList.contains('proto-direction')) { draft = t.value; save('draft', draft) }
    grow(t)
  })

  dock.addEventListener('keydown', (e) => {
    const t = e.target
    if (t.tagName !== 'TEXTAREA') return
    e.stopPropagation()
    if (t.classList.contains('proto-row-input')) {
      if (e.key === 'Escape') { rowEdit = null; renderSlot(); focusField('.proto-direction') }
      else if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitRow(); renderSlot(); focusField('.proto-direction') }
      return
    }
    if (e.key === 'Escape') {
      open = null
      edit = null
      render()
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (open === 'send') send()
      else { saveNote(); render() }
    }
  })

  // Clicking away from a note being written saves it, like leaving a field.
  document.addEventListener('mousedown', (e) => {
    if (dock.contains(e.target)) return
    if (open === 'note') { saveNote(); render() }
    else if (rowEdit) { commitRow(); renderSlot() }
  })

  // Hovercard: 300ms to open, instant swap while one is up, 150ms grace to reach the card.
  let openT
  let closeT
  dock.addEventListener('pointerover', (e) => {
    if (open) return
    if (e.target.closest('.proto-card')) return clearTimeout(closeT)
    const trig = e.target.closest('.proto-picker [data-hover]')
    if (!trig) return
    const noteId = id(vi, Number(trig.dataset.variant))
    clearTimeout(closeT)
    clearTimeout(openT)
    if (hover === noteId) return
    openT = setTimeout(() => { hover = noteId; renderSlot() }, hover ? 0 : 300)
  })
  dock.addEventListener('pointerout', (e) => {
    if (open) return
    if (!e.target.closest('.proto-picker [data-hover], .proto-card')) return
    if (e.relatedTarget?.closest?.('.proto-picker [data-hover], .proto-card')) return
    clearTimeout(openT)
    closeT = setTimeout(() => { hover = null; renderSlot() }, 150)
  })

  document.addEventListener('keydown', (e) => {
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable) return
    if (e.metaKey || e.ctrlKey || e.altKey) return
    const n = variants().length
    const num = parseInt(e.key, 10)
    const k = e.key.toLowerCase()
    if (n && num >= 1 && num <= n) go(vi, num - 1)
    else if (n && e.key === 'ArrowRight') go(vi, (xi + 1) % n)
    else if (n && e.key === 'ArrowLeft') go(vi, (xi - 1 + n) % n)
    else if (e.key === '[') go(vi - 1)
    else if (e.key === ']') go(vi + 1)
    else if (k === 'v' && count() > 1) toggle('versions')
    else if (k === 'x' && n > 1) toggleAll()
    else if (k === 't' && hasCases()) toggleTheme()
    else if (n && k === 'k') setVerdict('keep')
    else if (n && k === 'c') setVerdict('change')
    else if (n && k === 'd') setVerdict('drop')
    else if (n && k === 'n') editNote(id(), marks[id()]?.verdict ?? 'change')
    else if (n && e.key === 'Backspace' && marks[id()] && !marks[id()].sent) { applyVerdict(id(), marks[id()].verdict); render() }
    else if (k === 's' && (pending().length || draft.trim()) && !building()) toggle('send')
    else if (k === 'r' && P.replay) mount()
    else if (e.key === 'Escape' && (open || hover)) { open = null; edit = null; hover = null; render() }
    else if (e.key === 'Escape' && all) toggleAll()
    else return
    e.preventDefault()
  })

  window.addEventListener('resize', moveHighlight)

  // A version the viewer has not seen yet wins over the URL, so a published round opens on itself.
  const params = new URLSearchParams(location.search)
  const seen = load('seen', 0)
  const fresh = versions.length > seen
  save('seen', versions.length)
  arrived = fresh && load('arrived', 0) === versions.length
  save('arrived', 0)
  const wanted = (parseInt(params.get('version'), 10) || versions.length) - 1
  vi = fresh ? versions.length - 1 : Math.min(Math.max(wanted, 0), count() - 1)
  const startX = fresh ? 0 : (parseInt(params.get('variant'), 10) || 1) - 1
  go(vi, isPending() ? undefined : Math.min(Math.max(startX, 0), variants().length - 1))
  // Enable the slide only after first paint, so load doesn't animate.
  requestAnimationFrame(() => requestAnimationFrame(() => picker.setAttribute('data-ready', '')))
  if (building()) connectStatus()
  fetch('__status', { cache: 'no-store' }).then((r) => r.json()).then((s) => { context = s.context ?? null; host = s.host ?? host; wake = s.wake ?? wake; if (open === 'versions') renderSlot() }).catch(() => {})
})()
