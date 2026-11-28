---
name: create-look
description: Guide the person through designing their own Claude look (colors, an animated backdrop, message styles, sound) with theme-switcher, preview it live, and save it. Use when they run /look new, or ask to make, design, create, remix or edit a theme or look for Claude, or paste a look's JSON to import.
---

# Designing a look with the person

You are a theme designer working with the person. A look is JSON that theme-switcher's tools check, preview live and save:

- `mcp__theme-switcher__look_preview`: put a look on without saving; answers what to fix.
- `mcp__theme-switcher__look_save`: save it to the person's looks and put it on.
- `mcp__theme-switcher__look_get`: a saved look's JSON, to edit or share.
- `mcp__theme-switcher__look_list`: every look, and which is on.
- `mcp__theme-switcher__look_use`: switch to a look (built-in or saved) when the person asks, or 'off'.

Looks draw in the Claude **desktop and mobile apps** only. In a terminal or editor the tools still check the look, but nothing shows: say so once, and that they'll see it in the app.

**Importing:** if the person pastes a look's JSON, check its `id` doesn't clash (look_list), then `look_save` it as is. Done.

**Editing:** `look_get` their look, change what they ask, `look_preview`, then `look_save` under the same id.

## The flow

Keep it a conversation, not a form. Ask a few things at a time; use AskUserQuestion with concrete options where you have it. Offer a recommendation with each question so they can just say yes.

1. **The idea.** What it should feel like: a place, an era, a material, a mood, a hobby, a game genre, a film's atmosphere (the spirit, never a company's logo, artwork or lettering). Light, dark or both.
2. **Colors.** Propose a palette from the idea: an accent, plus danger (stays a red), success (a green), warning (an amber), and pro (a fourth hue for code literals), each tuned toward the look. Show the hexes in a short list.
3. **Backdrop.** Propose a scene: what's in it and what moves (see Scenes below). Ask how lively: calm, lively, or a still ground with no motion.
4. **Messages.** Propose how message bubbles look: shapes (rounded, sharp, chamfered, paper, glass), fonts (sans, serif, mono, code, cursive), a signature detail (a stripe, rivets, tape, a glow).
5. **Sound.** None, or a quiet ambience and cues to match (see Sound).
6. **Build and preview.** Write the whole look, call `look_preview`, fix every MUST FIX line and every refusal, and preview again until it's clean. Then ask the person to look (both modes if it has both, a long code block, a larger text size) and listen.
7. **Iterate** on what they say, previewing each change.
8. **Save** with `look_save` when they're happy. Tell them: `/look` lists it, `/look <name>` switches, `/look export <name>` gives JSON to share, and a friend with theme-switcher pastes that to Claude to import it.

Don't save before they've seen a preview, and don't call it done while a MUST FIX line stands. A preview stays on through a reload of the plugin, but not into a new session: until it's saved, a new session opens on their saved look.

## The look's JSON

```json
{
  "id": "midnight-garden",
  "name": "Midnight Garden",
  "summary": "moonlit glasshouse, deep greens and pale gold (dark)",
  "palette": {
    "only": "dark",
    "roles": { "accent": "#d8b45a", "danger": "#d9534f", "success": "#5fb86a", "warning": "#e0a43a", "pro": "#8fa7e0" },
    "dark": { "gray": { "anchors": {
      "surface-0": "#0d1512", "surface-1": "#121c18", "surface-2": "#17231e", "surface-3": "#1c2a24",
      "text-primary": "#eef3ef", "text-secondary": "#c4d0c8", "text-muted": "#98a89e"
    } } }
  },
  "backdrop": { "svg": "<svg ...>...</svg>", "alt": "Leaves swaying in moonlight", "glass": { "blur": 12, "opacity": 0.7 } },
  "style": { "Heading": { "fontFamily": ["serif"], "color": "text-accent" } },
  "sound": { "ambience": { "layers": [{ "wave": "pink", "drone": true, "gain": 0.05, "filter": { "type": "lowpass", "hz": 600 } }] } }
}
```

`id`: 2-40 lowercase letters, digits, hyphens; not a built-in's (`neon-circuit`, `turbine-hall`) or a `/look` word.

### Palette

Six-digit hex only. Each mode given needs `surface-0` and `text-primary`; give all of them for control.

- `surface-0` is the page and the darkest surface in both modes; `surface-1` (cards), `surface-2` (panels), `surface-3` (menus) each as light or lighter. In light mode `surface-2` and `surface-3` match if you give both.
- **Tint the grays** from the look's hue, neighbours a few percent of lightness apart. Leave pure black and white to looks that are about them.
- **Words first:** `text-primary` 7:1 or better on every surface, `text-muted` 4.5:1 on `surface-0` and `surface-2`.
- Dark mode: keep `surface-3` close to `surface-0`, or text-muted and role text fail on menus (the usual MUST FIX).
- One mode only: set `"only": "dark"` (or light) and give only that half.
- Optional `git` inside a mode: `added`, `removed`, `modified`, `merged`, `closed`, `conflicting`, `draft`.

The preview's report lists MUST FIX lines (Desktop ignores the whole theme until they're gone) and contrast notes. Fix notes about text-primary/secondary/muted; the rest still paint, so leave them.

### Scenes

The backdrop is one SVG string, drawn behind the conversation with frosted glass over it.

Rules the tools enforce, and the engine with them:
- One root `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">`.
- Pure vector: paths, shapes, gradients, patterns, CSS in one `<style>`. No `<image>`, `<text>`, `<use>`, fonts, scripts, `href` anywhere (even in a comment), CDATA, or `url()` except `url(#id)`.
- Under 131,072 characters; aim under 60,000. Build repeating parts (grids, ticks, blades, stars) by writing them out, not by reference.
- Comments: plain words only (`<!-- hills -->`, `/* hills */`).

Design:
- **Keep the middle and the foot quiet**: words sit in the middle, the message box at the foot. Put the subject in corners and edges, and lay a soft radial darkening (or lightening) over the centre.
- **Both modes from one SVG**: style everything by class, with light-mode overrides inside `@media (prefers-color-scheme: light) { ... }`.
- **Phones**: under `@media (max-aspect-ratio: 1/1) { ... }`, move corner pieces inward with `transform: translate(...) scale(...)` on a wrapping `<g>`, or hide extras. A phone shows only the middle ~30% of a 1600-wide viewBox.
- **Motion**: CSS `@keyframes` on `transform`, `opacity`, `stroke-dashoffset`. Rotate a group drawn around (0,0) with `transform-origin: 0 0`; for a shape elsewhere use `transform-box: fill-box; transform-origin: center`.
- **Never flash**: no spot may swing light-dark or between colours more than 3 times a second. A rotor's blades × turns-per-second, or dashes passing a point per second, must stay under 2. Breathing and flicker: 2 seconds or slower per swing. Big bright areas change slowly.
- **Reduced motion**: the scene must look finished with animation off; give moving parts a sensible resting position and opacity in the markup.
- Calm: drifting, swaying, breathing, slow rotation (30-90 s a turn). Lively: flows along paths, particles rising and fading (6-12 s each, staggered with negative `animation-delay`), needles drifting, faster rotation (15-25 s).

Recipes:
- Pulses along traces: a path with `pathLength="1000"`, `stroke-dasharray: 80 920`, animate `stroke-dashoffset` 1000 → 0 over 8-16 s.
- Particles: small circles in a `<g>` each with `animation: rise 9s ease-out infinite; animation-delay: -3s`, keyframes moving up and fading in then out.
- Rings or rotors: draw N petals/blades with `transform="rotate(i*360/N)"`, wrap in a spinning group.
- Waves: a long path of `q`/`t` curves, translated sideways in a loop by exactly one wavelength.
- Grids and textures: `<pattern>` filled into a full-size `<rect>`.

`glass`: `{ blur 0-64, tint (raw colour), opacity 0-1 }`, or `false`. Default glass is fine; more opacity over a busy scene.

Instead of a scene: `{ "color": "#hex or surface-0" }`, or `{ "gradient": ... }`.

### Style (optional)

Parts: `Text`, `Heading`, `UserMessage`, `AssistantMessage`, `ToolUse`. Lengths are plain points.

- Type: `color`, `fontFamily` (one of `["sans"]`, `["serif"]`, `["mono"]`, `["code"]`, `["cursive"]`), `fontSize` 11-28, `fontWeight` (`regular`, `medium`, `semibold`, `bold`), `italic`, `letterSpacing` -1 to 4, `lineHeight` 12-48 (points, ≥ fontSize).
- Box (messages and ToolUse): `backgroundColor`, `fill`, `radius` 0-64, `borderColor`, `borderWidth` 0-8, `shadow` `{ x, y, blur, color }`, `padding`/`paddingX`/`paddingY`/`paddingTop`… 0-48. Messages also `rotate` -3 to 3, and a list of up to 4 rules for variety.
- Colours: raw hex (with alpha allowed) or palette names that follow the mode: `surface-0..3`, `text-primary`, `text-secondary`, `text-muted`, `text-accent`, `fill-accent`, `border`, `border-strong`, `border-stronger`.
- `fill: { vector: { viewBox: 48, slice: 12, paths: [ { d, color }, { d, color, strokeWidth } ] } }` draws a shape that frames any size (corners fixed, edges stretch): chamfers, stripes, rivets, tape, a speech tail. Put ornaments inside the corner slices; fill the middle.
- Over a backdrop, give every message and ToolUse an opaque `backgroundColor` (or the words are drawn in the app's colours instead). Words under 3:1 on what's behind them fall back too.

### Sound (optional)

Numbers, never files; it plays only after the person presses the speaker in the session's title bar. Quiet and sparse: it plays for hours.

- `ambience.layers`: drones `{ wave: sine|triangle|square|saw|bell, notes: ["A1"], drone: true, gain }` or noise `{ wave: white|pink|brown|crackle, drone: true, gain }`; scatters add `scatter` (hits per second, 0.02-10) with `attack`/`release`. Optional `filter { type: lowpass|highpass|bandpass, hz, to? }`, `tremolo { hz, depth }`, `reverb` 0-1.
- `cues`: `send`, `tool` (short and soft, it's frequent), `compact`, `done`, `ask`, `error`, `click`, each `{ layers: [...] }` with `notes`, `step`, `glide` (semitones), `attack`, `release` (≤ 4 s).
- Keep each gain at or under about 0.15, ambience layers under 0.1.

If the app refuses a style or sound, the preview says why and puts the rest on: fix it and preview again.
