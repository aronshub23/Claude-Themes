// The turbine-hall backdrop, built once as an SVG string.
// A large compressor rotor turns in the top-right corner, a hotter turbine
// stage counter-turns in the bottom-left shedding embers, and a blueprint
// cutaway of a gas turbine runs along the top-left with air streaming
// through it, a flickering combustor and heat shimmer over the exhaust.
// Two gauges drift as if the engine were running. On a tall screen the
// rotors move in towards the middle strip that a phone shows, and the
// cutaway and gauges step aside. Colors follow the app's mode: red, white
// and charcoal.

const r1 = (n: number) => Math.round(n * 10) / 10

// A small seeded generator, so the scene is the same at every load.
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

// One swept blade lying along +x from root `a` to tip `b`, then turned by `deg`.
function blade(a: number, b: number, rootW: number, tipW: number, sweep: number, deg: number): string {
  const m = (a + b) / 2
  return (
    `<path transform="rotate(${r1(deg)})" d="M${a} ${-rootW}Q${m} ${r1(-rootW - sweep)} ${b} ${r1(-tipW + sweep / 2)}` +
    `L${b} ${r1(tipW + sweep / 2)}Q${m} ${r1(rootW - sweep)} ${a} ${rootW}Z"/>`
  )
}

function rotor(opts: {
  root: number
  tip: number
  blades: number
  rootW: number
  tipW: number
  sweep: number
  bolts: number
  bladeClass: string
  spin: string
}): string {
  const { root, tip, blades, rootW, tipW, sweep, bolts, bladeClass, spin } = opts
  const ring: string[] = []
  for (let i = 0; i < blades; i++) {
    ring.push(blade(root - 4, tip, rootW, tipW, sweep, (360 / blades) * i))
  }
  const boltRing: string[] = []
  const br = root * 0.62
  for (let i = 0; i < bolts; i++) {
    const t = (Math.PI * 2 * i) / bolts
    boltRing.push(`<circle cx="${r1(Math.cos(t) * br)}" cy="${r1(Math.sin(t) * br)}" r="${r1(root * 0.05)}"/>`)
  }
  return (
    `<circle class="case" r="${tip + 14}"/><circle class="case thin" r="${tip + 26}"/>` +
    `<circle class="duct" r="${tip + 6}"/>` +
    `<g class="${spin}">` +
    `<g class="${bladeClass}">${ring.join('')}</g>` +
    `<circle class="hub" r="${root}"/>` +
    `<g class="bolt">${boltRing.join('')}</g>` +
    `<circle class="hub inner" r="${r1(root * 0.38)}"/>` +
    `</g>` +
    `<circle class="heat" r="${r1(root * 0.9)}" fill="url(#heat)"/>` +
    `<path class="mark" d="M${-tip - 40} 0H${-tip + 10}M${tip - 10} 0H${tip + 40}M0 ${-tip - 40}V${-tip + 10}M0 ${tip - 10}V${tip + 40}"/>`
  )
}

// A side cutaway of a gas turbine: inlet, compressor, combustor, turbine, exhaust.
function profile(): string {
  const cy = 150
  const top: [number, number][] = [
    [40, 92], [120, 88], [170, 70], [330, 50], [360, 50], [380, 70], [470, 70], [490, 52], [520, 54], [640, 82], [700, 94],
  ]
  const outline =
    'M' + top.map(([x, h]) => `${x} ${cy - h}`).join('L') + 'L700 ' + (cy + 94) + 'L' +
    [...top].reverse().map(([x, h]) => `${x} ${cy + h}`).join('L') + 'Z'

  const stages: string[] = []
  for (let i = 0; i < 13; i++) {
    const x = 180 + i * 12
    const h = 66 - i * 1.4
    stages.push(`M${x} ${r1(cy - h)}V${r1(cy - 20)}M${x} ${r1(cy + 20)}V${r1(cy + h)}`)
  }
  for (let i = 0; i < 6; i++) {
    const x = 535 + i * 18
    const h = 54 + i * 5
    stages.push(`M${x} ${r1(cy - h)}V${r1(cy - 22)}M${x} ${r1(cy + 22)}V${r1(cy + h)}`)
  }
  const cans = `<rect class="can" x="392" y="${cy - 62}" width="70" height="20" rx="10"/><rect class="can" x="392" y="${cy + 42}" width="70" height="20" rx="10"/>`
  const exhaust = `<path class="ink" d="M700 ${cy - 94}H780V${cy + 120}H700"/><path class="ink thin" d="M716 ${cy - 80}H766V${cy + 106}H716Z"/>`
  const shaft = `<rect class="shaft" x="60" y="${cy - 8}" width="640" height="16"/>`
  const centre = `<path class="centre" d="M0 ${cy}H820"/>`

  // Air: cool through the compressor, hot after the combustor.
  const lanes = [-38, -24, 24, 38]
  const cold = lanes.map(o => `M60 ${cy + o}H378`).join('')
  const hot = lanes.map(o => `M474 ${cy + o * 0.9}H696`).join('')
  const flow = `<path class="flow cold" d="${cold}"/><path class="flow hot" d="${hot}"/>`

  // Heat shimmer rising out of the exhaust stack.
  const shimmer = [724, 741, 758]
    .map((x, i) => `<path class="shimmer" style="animation-delay:${-i * 1.2}s" d="M${x} ${cy - 98}q6 -10 0 -20q-6 -10 0 -20q6 -10 0 -20"/>`)
    .join('')

  const dy = cy + 150
  const dim =
    `<path class="ink thin" d="M40 ${cy + 100}V${dy + 10}M780 ${cy + 128}V${dy + 10}M40 ${dy}H780"/>` +
    `<path class="arrow" d="M40 ${dy}l14 -5v10Z M780 ${dy}l-14 -5v10Z"/>` +
    `<path class="ink thin" d="M330 ${cy - 50}V${cy - 120}M490 ${cy - 52}V${cy - 120}M330 ${cy - 110}H490"/>` +
    `<path class="arrow" d="M330 ${cy - 110}l12 -4v8Z M490 ${cy - 110}l-12 -4v8Z"/>`

  return (
    `<g class="profile">` +
    `<path class="body" d="${outline}"/>` +
    shaft +
    flow +
    `<path class="ink thin" d="${stages.join('')}"/>` +
    `<ellipse class="flame" cx="427" cy="${cy}" rx="40" ry="34" fill="url(#flame)"/>` +
    cans +
    `<path class="ink" d="${outline}"/>` +
    exhaust +
    shimmer +
    centre +
    dim +
    `</g>`
  )
}

// A dial gauge at the origin: ticks over 240 degrees, a red band at the top
// of its range, and a needle that drifts with `sweep`.
function gauge(r: number, sweep: string): string {
  const at = (deg: number, rad: number): [number, number] => {
    const t = (deg * Math.PI) / 180
    return [r1(Math.sin(t) * rad), r1(-Math.cos(t) * rad)]
  }
  const ticks: string[] = []
  for (let d = -120; d <= 120; d += 15) {
    const long = d % 60 === 0
    const [x1, y1] = at(d, r - (long ? 16 : 10))
    const [x2, y2] = at(d, r - 4)
    ticks.push(`M${x1} ${y1}L${x2} ${y2}`)
  }
  const [ax, ay] = at(70, r - 7)
  const [bx, by] = at(120, r - 7)
  return (
    `<circle class="gface" r="${r}"/>` +
    `<circle class="gring" r="${r - 2}"/>` +
    `<path class="gtick" d="${ticks.join('')}"/>` +
    `<path class="gred" d="M${ax} ${ay}A${r - 7} ${r - 7} 0 0 1 ${bx} ${by}"/>` +
    `<g class="needle ${sweep}"><path d="M-3 6L0 ${-(r - 14)}L3 6Z"/></g>` +
    `<circle class="gpin" r="5"/>`
  )
}

// Embers drifting up off the turbine stage.
function embers(): string {
  const rand = rng(8801)
  const out: string[] = []
  for (let i = 0; i < 16; i++) {
    const x = r1(-80 + rand() * 280)
    const y = r1(-40 - rand() * 120)
    const dur = r1(6 + rand() * 6)
    const delay = r1(-rand() * dur)
    const kind = rand() < 0.5 ? 'rise-a' : 'rise-b'
    const size = r1(1.6 + rand() * 1.8)
    out.push(
      `<g class="ember ${kind}" style="animation-duration:${dur}s;animation-delay:${delay}s">` +
        `<circle cx="${x}" cy="${y}" r="${r1(size * 3)}" class="eglow"/><circle cx="${x}" cy="${y}" r="${size}"/></g>`,
    )
  }
  return out.join('')
}

function build(): string {
  const compressor = rotor({
    root: 92, tip: 330, blades: 41, rootW: 9, tipW: 5, sweep: 10, bolts: 16,
    bladeClass: 'blade', spin: 'spin-c',
  })
  const turbine = rotor({
    root: 70, tip: 220, blades: 29, rootW: 10, tipW: 6, sweep: -12, bolts: 12,
    bladeClass: 'blade hot', spin: 'spin-t',
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<defs>
<pattern id="minor" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" class="grid"/></pattern>
<pattern id="major" width="200" height="200" patternUnits="userSpaceOnUse"><path d="M200 0H0V200" fill="none" class="grid major"/></pattern>
<radialGradient id="heat"><stop offset="0" stop-color="#ff2a2a" stop-opacity=".7"/><stop offset=".5" stop-color="#e60012" stop-opacity=".28"/><stop offset="1" stop-color="#e60012" stop-opacity="0"/></radialGradient>
<radialGradient id="flame"><stop offset="0" stop-color="#ffd2c2" stop-opacity=".95"/><stop offset=".45" stop-color="#ff3a2a" stop-opacity=".55"/><stop offset="1" stop-color="#e60012" stop-opacity="0"/></radialGradient>
<linearGradient id="steelD" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1b1c1e"/><stop offset=".5" stop-color="#111213"/><stop offset="1" stop-color="#170f10"/></linearGradient>
<linearGradient id="steelL" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6f6f7"/><stop offset=".5" stop-color="#eceded"/><stop offset="1" stop-color="#f3eeee"/></linearGradient>
<radialGradient id="hushD" cx="50%" cy="52%" r="50%"><stop offset="0" stop-color="#111213" stop-opacity=".85"/><stop offset=".65" stop-color="#111213" stop-opacity=".3"/><stop offset="1" stop-color="#111213" stop-opacity="0"/></radialGradient>
<radialGradient id="hushL" cx="50%" cy="52%" r="50%"><stop offset="0" stop-color="#f1f1f2" stop-opacity=".85"/><stop offset=".65" stop-color="#f1f1f2" stop-opacity=".3"/><stop offset="1" stop-color="#f1f1f2" stop-opacity="0"/></radialGradient>
</defs>
<style>
.ground{fill:url(#steelD)}
.hush{fill:url(#hushD)}
.grid{stroke:#1d1f21;stroke-width:1}
.grid.major{stroke:#26282b}
.case{fill:none;stroke:#5f6368;stroke-width:2.5}
.case.thin{stroke-width:1;stroke-opacity:.6}
.duct{fill:#151617}
.blade path{fill:#2c2e31;stroke:#74787e;stroke-width:1}
.blade.hot path{fill:#3a1a1c;stroke:#b8343a}
.hub{fill:#1c1d1f;stroke:#74787e;stroke-width:1.5}
.hub.inner{fill:#26282b}
.bolt circle{fill:#9a9ea4}
.mark{fill:none;stroke:#74787e;stroke-width:1;stroke-dasharray:24 6 4 6;stroke-opacity:.7}
.ink{fill:none;stroke:#8a8e94;stroke-width:1.6}
.ink.thin{stroke-width:1;stroke-opacity:.7}
.arrow{fill:#8a8e94}
.body{fill:#17181a;fill-opacity:.85}
.shaft{fill:#2c2e31}
.can{fill:#3a1a1c;stroke:#b8343a}
.centre{fill:none;stroke:#8a8e94;stroke-width:1;stroke-dasharray:28 6 4 6;stroke-opacity:.6}
.flow{fill:none;stroke-width:2;stroke-linecap:round;animation:flow linear infinite}
.flow.cold{stroke:#c9ccd1;stroke-opacity:.55;stroke-dasharray:6 18;animation-duration:.9s}
.flow.hot{stroke:#ff3b30;stroke-opacity:.75;stroke-dasharray:10 14;animation-duration:.6s}
.shimmer{fill:none;stroke:#ff5a4a;stroke-width:1.5;stroke-linecap:round;opacity:.35;animation:shimmer 3.6s ease-in-out infinite}
.gface{fill:#151617;stroke:#5f6368;stroke-width:2}
.gring{fill:none;stroke:#2c2e31;stroke-width:1}
.gtick{fill:none;stroke:#9a9ea4;stroke-width:1.5}
.gred{fill:none;stroke:#e60012;stroke-width:5}
.needle{fill:#ff2a2a;transform-origin:0 0}
.gpin{fill:#d0d2d6}
.sweep-a{transform:rotate(-30deg);animation:sweep-a 14s ease-in-out infinite}
.sweep-b{transform:rotate(10deg);animation:sweep-b 11s ease-in-out infinite}
.ember{opacity:.5;fill:#ff3b30}
.eglow{fill:#e60012;opacity:.3}
.rise-a{animation-name:rise-a;animation-timing-function:ease-out;animation-iteration-count:infinite}
.rise-b{animation-name:rise-b;animation-timing-function:ease-out;animation-iteration-count:infinite}
.spin-c{transform-origin:0 0;animation:spin 25s linear infinite}
.spin-t{transform-origin:0 0;animation:spin 17s linear infinite reverse}
.heat{opacity:.45;animation:breathe 4s ease-in-out infinite alternate}
.flame{opacity:.65;transform-box:fill-box;transform-origin:center;animation:flicker 2.4s ease-in-out infinite alternate}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes breathe{from{opacity:.3}to{opacity:.75}}
@keyframes flicker{0%{opacity:.55;transform:scale(.94,1)}40%{opacity:.8;transform:scale(1.06,.97)}100%{opacity:.68;transform:scale(1,1.05)}}
@keyframes flow{from{stroke-dashoffset:0}to{stroke-dashoffset:-24}}
@keyframes shimmer{0%{opacity:0;transform:translateY(8px)}40%{opacity:.6}100%{opacity:0;transform:translateY(-34px)}}
@keyframes sweep-a{0%{transform:rotate(-70deg)}30%{transform:rotate(15deg)}50%{transform:rotate(-5deg)}75%{transform:rotate(40deg)}100%{transform:rotate(-70deg)}}
@keyframes sweep-b{0%{transform:rotate(-40deg)}35%{transform:rotate(55deg)}60%{transform:rotate(35deg)}85%{transform:rotate(70deg)}100%{transform:rotate(-40deg)}}
@keyframes rise-a{0%{opacity:0;transform:translate(0,0)}15%{opacity:.9}100%{opacity:0;transform:translate(40px,-300px)}}
@keyframes rise-b{0%{opacity:0;transform:translate(0,0)}15%{opacity:.9}100%{opacity:0;transform:translate(-30px,-260px)}}
@media (max-aspect-ratio:1/1){.pin-p,.pin-g{display:none}.pin-c{transform:translate(1000px,170px) scale(.5) translate(-1350px,-250px)}.pin-t{transform:translate(640px,860px) scale(.5) translate(-230px,-820px)}}
@media (prefers-color-scheme:light){
.ground{fill:url(#steelL)}
.hush{fill:url(#hushL)}
.grid{stroke:#e2e3e5}
.grid.major{stroke:#d6d8da}
.case{stroke:#80848a}
.duct{fill:#e3e4e6}
.blade path{fill:#d2d4d7;stroke:#80848a}
.blade.hot path{fill:#f1d0d1;stroke:#b8343a}
.hub{fill:#dcdee0;stroke:#80848a}
.hub.inner{fill:#cdd0d3}
.bolt circle{fill:#5f6368}
.mark{stroke:#80848a}
.ink{stroke:#3a3d41}
.arrow{fill:#3a3d41}
.body{fill:#ebeced}
.shaft{fill:#cfd2d5}
.can{fill:#f4d6d6;stroke:#b8343a}
.centre{stroke:#3a3d41}
.flow.cold{stroke:#6b7077;stroke-opacity:.6}
.flow.hot{stroke:#e60012;stroke-opacity:.7}
.shimmer{stroke:#e60012}
.gface{fill:#f8f8f9;stroke:#80848a}
.gring{stroke:#dcdee0}
.gtick{stroke:#3a3d41}
.needle{fill:#e60012}
.gpin{fill:#3a3d41}
.ember{fill:#e60012}
.eglow{opacity:.18}
.heat{opacity:.3}
}
</style>
<rect class="ground" width="1600" height="1000"/>
<rect width="1600" height="1000" fill="url(#minor)"/>
<rect width="1600" height="1000" fill="url(#major)"/>
<g class="pin-p"><g transform="translate(60 40)">${profile()}</g></g>
<g class="pin-c"><g transform="translate(1350 250)">${compressor}</g></g>
<g class="pin-t"><g transform="translate(230 820)">${turbine}<g class="embers">${embers()}</g></g></g>
<g class="pin-g"><g transform="translate(1300 790)">${gauge(64, 'sweep-a')}</g><g transform="translate(1470 760)">${gauge(52, 'sweep-b')}</g></g>
<rect class="hush" width="1600" height="1000"/>
</svg>`
}

export const SCENE = build()
