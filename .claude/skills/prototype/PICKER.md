# The Picker

The picker is harness chrome, not a design decision. It lives in two files the loop server serves
directly, so a prototype never copies or restyles it:

| File | Served at |
|---|---|
| [assets/picker.js](assets/picker.js) | `/__proto/picker.js` |
| [assets/picker.css](assets/picker.css) | `/__proto/picker.css` |

Do not restyle it with the project's tokens, fonts, or colors, and do not reach for any SpadeUI
component. It is a floating dark stack, always bottom-center: a panel slot, the variant pill, and a detached
version stepper below it. Dark glass works on any page in either theme.
Changing its look or behavior means editing those two files, for every prototype at once.

## Page scaffold

The page declares data; the picker builds its own DOM from it.

```html
<link rel="stylesheet" href="system.css" />
<link rel="stylesheet" href="/__proto/picker.css" />
<script>window.PROTO = { versions: [] }</script>
...
<body class="bg-background text-foreground">
<main id="stage"></main>

<script>/* shared data and helpers */</script>

<script src="v/01.js"></script>
<link rel="stylesheet" href="v/02.css" />
<script src="v/02.js"></script>

<script src="/__proto/picker.js"></script>
</body>
```

```js
// v/01.js
PROTO.versions.push({
  note: 'First pass',
  variants: [
    { name: 'Quiet', render: () => `...`, mount: (stage) => { /* optional wiring */ } },
    { name: 'Dense', render: () => `...` },
  ],
})
```

- One file per version, `v/01.js`, `v/02.js`, in order, each with exactly one literal
  `PROTO.versions.push(` call: `loop.mjs publish` counts them across `index.html` and `v/*.js`.
  CSS a version needs goes in `v/NN.css`, linked just before its script. A new round writes new
  files and adds their tags; it never edits a published version file.
- Version files share the page's global scope. Wrap each in an IIFE, or suffix its names with the
  version, so V5's helpers never collide with V4's.
- `note` is one line on what the version changed. It is the version label's tooltip.
- Variant names are unique within a version. A variant carried forward keeps its name, so stepping
  versions lands on the same direction. A new direction gets a new name.
- `render()` returns the variant's HTML. `mount(root)` runs after it lands, for wiring. Wire inside
  `root`, never by global id: in the all-options view every variant of the version renders at once,
  each in its own column root, so `document.getElementById` finds only the first copy. The picker
  also sets `PROTO.current = { version, variant }` and fires `proto:mount` on `window`, for pages
  whose shared helpers key state by the current variant.
- `picker.js` goes last, after every version block.
- Key any per-variant state and handler scope by version as well as variant (`PROTO.current` has
  both). Wiring keyed by variant index alone collides with the next version's variants, and a frozen
  block cannot be edited to fix it, so the later version has to duplicate its wiring.

## Options

The stack is always bottom-center. There is no position option; never add one or move the picker
to make room for a variant. A variant with bottom-anchored UI (save bar, toast, bottom sheet) keeps
it and lets the picker overlap, the same way it overlaps any other page.

Set on `window.PROTO` before `picker.js` loads:

| Option | Effect |
|---|---|
| `replay: true` | Adds the replay button and the `R` key. Only when at least one variant has an entrance or state animation worth re-triggering |
| `cases: [...]`, `onCase(id)` | The standard Case menu and the theme toggle (`T`), beside the columns button. The menu is fixed: `default`, `long`, `one`, `many`, `empty`, `loading`, `error`, `disabled`, `setup` (not set up or disconnected), `narrow`. List the ids the page renders; the rest show as n/a. `onCase` applies one; `narrow` is the picker's own (stage capped at 320px). Theme toggles `dark` on `<html>` and fires `proto:theme`. Never build page chrome of your own |

## Behavior contract

| Input | Effect |
|---|---|
| `1-9`, `←` `→`, click | Switch variant within the version |
| `[` `]`, `‹` `›` | Step versions. The stepper sits below the pill, only once there are two or more |
| `V`, `V3 of 10` | Open the version grid: every version with one dot per variant, colored by verdict. Click to jump. Its footer shows the session's context size from the last `publish`: amber from 200k, red from 300k with "clear, then resume" |
| `X`, columns button | Show all options: every variant of the version side by side in equal columns, each under a label with its key, name, version, and verdict. Clicking a column, its label, or `1-9` selects that option without re-rendering, so `K` `C` `D` act on it. `[` `]` show another version's options. `Esc` or `X` returns to one at a time. The choice persists per prototype |
| `K`, `✓` | Keep locks this variant in: its siblings become Drop and any other Keep is released (both restore if the Keep is cleared). Review becomes Lock In |
| `D`, `✕` | Drop the current variant. Pressing the active verdict again clears it |
| `C`, `✎` | Change: opens the note card to say what should change. Always opens the editor, even when already Change |
| `N` | Write or edit a note under any verdict (defaults to Change) |
| `Backspace` | Clear the current variant's verdict and note |
| Hover a noted variant | After 300ms a card docked above the pill shows the verdict label and the note. Moving to another noted variant swaps it instantly; the card stays while the pointer is on it. Clicking the text edits it and selects that variant |
| `S`, `Review` / `Lock In` | Open the Send to Claude panel: one row per pending verdict in pill order, a colored bar (a Drop is a red bar and a struck name), and a direction field. Hovering a row shows its ✓ ✎ ✕ to change the verdict; click a note to edit it; a row without a note grows an Add a note field on hover. The button is `Build V<n>`, or `Lock In` with a Keep, which builds nothing and ends the pill on a green `✓ V9 · Inline` |
| Click `✓ V9 · Inline` | Undo the lock-in: the Keep and the drops it forced are cleared and the round is open again |
| `R` | Replay (when `replay: true`) |
| `Esc` | Close the panel or card. A drafted direction is kept |

Note and direction fields are growing textareas: `↵` saves or sends, `⇧↵` adds a line, `Esc`
cancels, and clicking away from a note saves it. No key hints are printed. Note editors read as
text (amber caret, faint lift on focus); the direction box is a hairline field.

Verdict markers on the pill: Keep is a green dot, Change an amber dot, Drop is struck through.

- Keys are ignored in inputs, textareas, selects, contenteditable, and with a modifier held.
- Switching is instant; only the highlight slides. Every switch re-mounts so entrance animations
  re-run.
- `?version=2&variant=1` persists the selection across reloads, except that a version the viewer
  has not seen yet wins: a newly published version always opens on itself.
- Verdicts, notes, and the drafted direction persist in `localStorage` per prototype. After a Send,
  verdicts stay marked (history, and the grid's dots) but leave the pending list; changing a sent
  verdict or note re-queues it.
- A Send moves straight to the version it builds: the stepper reads `V<n> of <n>`, the stage shows
  a muted ring and `Building V<n>…`, and the pill keeps its shape with option placeholders and
  disabled verdicts. `[` goes back to review earlier versions while it builds. The page polls
  `__status`; when `loop.mjs publish` reports that version it reloads onto it and fades it in. If the
  server is unreachable, the panel says so and nothing is lost.
- If no watcher is running and nobody has read the Send, the stage says `Claude isn't listening`
  instead of building. `Cancel Send` withdraws the unread Send from `feedback.jsonl` and reopens the
  panel with its verdicts and direction restored. Once Claude has read it the button is
  `Stop Waiting`: the page leaves the building state, but the version still arrives on a later load.
- The server answers only `127.0.0.1` and `localhost` on its own port, and accepts a POST only with
  its own Origin and a JSON body, so no other site can post feedback.
