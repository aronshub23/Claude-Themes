// The circuit-board backdrop, built once as an SVG string.
// Bundles of parallel traces leave chips near the edges, bend at 45 degrees
// and end in vias; slow pulses of light run along some of them.

export const NEON = {
  purple: '#b44cff',
  green: '#39ff8a',
  blue: '#2f6bff',
  red: '#ff2340',
} as const

type Pt = readonly [number, number]
type Hue = keyof typeof NEON

// A small seeded generator, so the board is the same at every load.
function rng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const r1 = (n: number) => Math.round(n * 10) / 10

function unit(a: Pt, b: Pt): Pt {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const l = Math.hypot(dx, dy)
  return [dx / l, dy / l]
}

// The left-hand normal of a direction.
const normal = (d: Pt): Pt => [-d[1], d[0]]

// A polyline offset sideways by `o`, mitred at each corner.
function offset(line: readonly Pt[], o: number): Pt[] {
  const out: Pt[] = []
  for (let i = 0; i < line.length; i++) {
    const p = line[i]!
    if (i === 0 || i === line.length - 1) {
      const d = i === 0 ? unit(line[0]!, line[1]!) : unit(line[i - 1]!, p)
      const n = normal(d)
      out.push([p[0] + n[0] * o, p[1] + n[1] * o])
      continue
    }
    const n1 = normal(unit(line[i - 1]!, p))
    const n2 = normal(unit(p, line[i + 1]!))
    const k = o / (1 + n1[0] * n2[0] + n1[1] * n2[1])
    out.push([p[0] + (n1[0] + n2[0]) * k, p[1] + (n1[1] + n2[1]) * k])
  }
  return out
}

// Shortens the last segment by `by`.
function trimEnd(line: Pt[], by: number): Pt[] {
  const a = line[line.length - 2]!
  const b = line[line.length - 1]!
  const d = unit(a, b)
  const len = Math.hypot(b[0] - a[0], b[1] - a[1])
  const cut = Math.min(by, len - 12)
  return [...line.slice(0, -1), [b[0] - d[0] * cut, b[1] - d[1] * cut]]
}

const pathD = (line: readonly Pt[]) =>
  'M' + line.map(([x, y]) => `${r1(x)} ${r1(y)}`).join('L')

type Bundle = {
  // The centre line, from the chip outward; each turn is 45 or 90 degrees.
  line: Pt[]
  count: number
  spacing: number
  hue: Hue
  // How many of its traces carry a pulse, roughly.
  pulses: number
}

type Chip = { x: number; y: number; w: number; h: number; led: Hue }

const CHIPS: Chip[] = [
  { x: 1190, y: 90, w: 230, h: 230, led: 'red' }, // the big processor, top right
  { x: 110, y: 120, w: 170, h: 110, led: 'blue' }, // top left
  { x: 70, y: 610, w: 150, h: 150, led: 'red' }, // lower left
  { x: 1340, y: 590, w: 170, h: 120, led: 'blue' }, // lower right
  { x: 700, y: 40, w: 120, h: 60, led: 'blue' }, // a small part on the top edge
]

const BUNDLES: Bundle[] = [
  // From the processor: left, then down and away.
  { line: [[1190, 160], [980, 160], [860, 280], [640, 280], [560, 360], [380, 360]], count: 7, spacing: 12, hue: 'purple', pulses: 4 },
  { line: [[1260, 320], [1260, 420], [1160, 520], [1160, 760], [1080, 840], [1080, 1040]], count: 6, spacing: 12, hue: 'green', pulses: 3 },
  { line: [[1420, 170], [1520, 170], [1560, 210], [1560, 470], [1620, 530]], count: 5, spacing: 12, hue: 'blue', pulses: 2 },
  { line: [[1300, 90], [1300, 30], [1330, 0], [1340, -40]], count: 5, spacing: 14, hue: 'purple', pulses: 1 },
  // From the top-left part.
  { line: [[280, 150], [440, 150], [520, 70], [700, 70]], count: 4, spacing: 12, hue: 'green', pulses: 2 },
  { line: [[160, 230], [160, 330], [240, 410], [240, 540]], count: 4, spacing: 12, hue: 'purple', pulses: 2 },
  { line: [[110, 170], [40, 170], [-40, 250]], count: 4, spacing: 12, hue: 'red', pulses: 1 },
  // From the lower-left part.
  { line: [[220, 650], [360, 650], [440, 570], [560, 570]], count: 5, spacing: 12, hue: 'green', pulses: 3 },
  { line: [[150, 760], [150, 860], [230, 940], [520, 940], [580, 1040]], count: 5, spacing: 12, hue: 'blue', pulses: 2 },
  // From the lower-right part.
  { line: [[1340, 660], [1270, 660], [1230, 700], [1230, 800]], count: 3, spacing: 12, hue: 'green', pulses: 1 },
  { line: [[1420, 710], [1420, 820], [1500, 900], [1640, 900]], count: 4, spacing: 12, hue: 'red', pulses: 2 },
  { line: [[1510, 640], [1640, 640]], count: 3, spacing: 14, hue: 'purple', pulses: 1 },
  // Up from the bottom edge through the middle, so a tall phone sees a board too.
  { line: [[660, 1040], [660, 880], [740, 800], [880, 800], [940, 740], [940, 520]], count: 4, spacing: 12, hue: 'purple', pulses: 2 },
  { line: [[820, 1040], [820, 940], [860, 900], [1000, 900]], count: 3, spacing: 12, hue: 'red', pulses: 1 },
  // From the small part on the top edge.
  { line: [[820, 70], [900, 70], [960, 10], [960, -40]], count: 3, spacing: 10, hue: 'blue', pulses: 1 },
]

function build(): string {
  const rand = rng(20771)
  const base: string[] = []
  const glow: string[] = []
  const vias: string[] = []
  const pins: string[] = []

  for (const b of BUNDLES) {
    const lines: Pt[][] = []
    for (let i = 0; i < b.count; i++) {
      const o = (i - (b.count - 1) / 2) * b.spacing
      lines.push(trimEnd(offset(b.line, o), rand() * 90))
    }
    const color = NEON[b.hue]
    const all = lines.map(pathD).join('')
    base.push(`<path class="b" stroke="${color}" d="${all}"/>`, `<path class="t" stroke="${color}" d="${all}"/>`)

    for (const l of lines) {
      const [sx, sy] = l[0]!
      const [ex, ey] = l[l.length - 1]!
      pins.push(`<rect x="${r1(sx - 3)}" y="${r1(sy - 3)}" width="6" height="6"/>`)
      vias.push(`<circle cx="${r1(ex)}" cy="${r1(ey)}" r="4.5" stroke="${color}"/>`)
    }

    // Pulses: pick a few traces, give each its own speed and phase.
    const picks = new Set<number>()
    while (picks.size < Math.min(b.pulses, b.count)) {
      picks.add(Math.floor(rand() * b.count))
    }
    for (const i of picks) {
      const d = pathD(lines[i]!)
      const dur = r1(9 + rand() * 9)
      const delay = r1(-rand() * dur)
      const rest = Math.round(rand() * 1000)
      const style = `animation-duration:${dur}s;animation-delay:${delay}s`
      glow.push(
        `<path class="g" stroke="${color}" stroke-dashoffset="${rest}" style="${style}" pathLength="1000" d="${d}"/>`,
        `<path class="c" stroke-dashoffset="${rest}" style="${style}" pathLength="1000" d="${d}"/>`,
      )
    }
  }

  const chips = CHIPS.map(c => {
    const legs: string[] = []
    const step = 14
    for (let x = c.x + 12; x < c.x + c.w - 8; x += step) {
      legs.push(`<rect x="${x}" y="${c.y - 7}" width="5" height="7"/><rect x="${x}" y="${c.y + c.h}" width="5" height="7"/>`)
    }
    for (let y = c.y + 12; y < c.y + c.h - 8; y += step) {
      legs.push(`<rect x="${c.x - 7}" y="${y}" width="7" height="5"/><rect x="${c.x + c.w}" y="${y}" width="7" height="5"/>`)
    }
    const led = NEON[c.led]
    const core =
      c.w > 200
        ? `<rect x="${c.x + 40}" y="${c.y + 40}" width="${c.w - 80}" height="${c.h - 80}" fill="none" stroke="${NEON.purple}" stroke-opacity=".5" stroke-width="1.5"/>` +
          `<rect x="${c.x + 60}" y="${c.y + 60}" width="${c.w - 120}" height="${c.h - 120}" fill="${NEON.purple}" fill-opacity=".16" stroke="${NEON.purple}" stroke-opacity=".35"/>` +
          `<path d="M${c.x + 40} ${c.y + 40}L${c.x + 60} ${c.y + 60}M${c.x + c.w - 40} ${c.y + c.h - 40}L${c.x + c.w - 60} ${c.y + c.h - 60}" stroke="${NEON.purple}" stroke-opacity=".4"/>`
        : `<rect x="${c.x + 14}" y="${c.y + 14}" width="${Math.round(c.w * 0.35)}" height="4" fill="${NEON.green}" fill-opacity=".35"/>`
    return (
      `<g class="legs">${legs.join('')}</g>` +
      `<rect class="chip" x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" rx="3"/>` +
      core +
      `<circle cx="${c.x + c.w - 16}" cy="${c.y + 16}" r="7" fill="${led}" class="halo"/>` +
      `<circle cx="${c.x + c.w - 16}" cy="${c.y + 16}" r="3.5" fill="${led}" class="led"/>`
    )
  }).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<defs>
<pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="12" cy="12" r="1" fill="#2a2342"/></pattern>
<pattern id="mesh" width="96" height="96" patternUnits="userSpaceOnUse"><path d="M96 0H0V96" fill="none" stroke="#17132a" stroke-width="1"/></pattern>
<radialGradient id="hush" cx="50%" cy="55%" r="55%"><stop offset="0" stop-color="#07050d" stop-opacity=".85"/><stop offset=".6" stop-color="#07050d" stop-opacity=".35"/><stop offset="1" stop-color="#07050d" stop-opacity="0"/></radialGradient>
<linearGradient id="sky" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#120a22"/><stop offset=".55" stop-color="#07060d"/><stop offset="1" stop-color="#03110b"/></linearGradient>
</defs>
<style>
.b{fill:none;stroke-width:9;stroke-opacity:.07;stroke-linejoin:round}
.t{fill:none;stroke-width:2.2;stroke-opacity:.55;stroke-linejoin:miter}
.g{fill:none;stroke-width:9;stroke-opacity:.4;stroke-linecap:round;stroke-dasharray:110 890;animation-name:run;animation-timing-function:linear;animation-iteration-count:infinite}
.c{fill:none;stroke:#ffffff;stroke-width:2.4;stroke-opacity:.9;stroke-linecap:round;stroke-dasharray:110 890;animation-name:run;animation-timing-function:linear;animation-iteration-count:infinite}
.vias circle{fill:#07060d;stroke-width:2;stroke-opacity:.85}
.pins rect{fill:#3b3358}
.legs rect{fill:#4a4170}
.chip{fill:#0d0b18;stroke:#3a3260;stroke-width:1.5}
.led{opacity:.95}
.halo{opacity:.25;animation:breathe 6s ease-in-out infinite alternate}
@keyframes run{from{stroke-dashoffset:1000}to{stroke-dashoffset:0}}
@keyframes breathe{from{opacity:.12}to{opacity:.4}}
</style>
<rect width="1600" height="1000" fill="url(#sky)"/>
<rect width="1600" height="1000" fill="url(#mesh)"/>
<rect width="1600" height="1000" fill="url(#dots)"/>
<g>${base.join('')}</g>
<g class="pins">${pins.join('')}</g>
<g class="vias">${vias.join('')}</g>
${chips}
<g>${glow.join('')}</g>
<rect width="1600" height="1000" fill="url(#hush)"/>
</svg>`
}

export const SCENE = build()
