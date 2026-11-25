// The turbine-hall backdrop, built once as an SVG string.
// A large compressor rotor turns slowly in the top-right corner, a hotter
// turbine stage counter-turns in the bottom-left, and a blueprint cutaway
// of a gas turbine runs along the top-left. On a tall screen the rotors
// move in towards the middle strip that a phone shows, and the cutaway
// steps aside. Colors follow the app's mode.

const r1 = (n: number) => Math.round(n * 10) / 10

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
    // the casing, which stays still
    `<circle class="case" r="${tip + 14}"/><circle class="case thin" r="${tip + 26}"/>` +
    `<circle class="duct" r="${tip + 6}"/>` +
    // the turning part
    `<g class="${spin}">` +
    `<g class="${bladeClass}">${ring.join('')}</g>` +
    `<circle class="hub" r="${root}"/>` +
    `<g class="bolt">${boltRing.join('')}</g>` +
    `<circle class="hub inner" r="${r1(root * 0.38)}"/>` +
    `</g>` +
    // heat at the hub, breathing slowly
    `<circle class="heat" r="${r1(root * 0.9)}" fill="url(#heat)"/>` +
    // a centre mark, as on a drawing
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
  // compressor stages, getting shorter towards the back
  for (let i = 0; i < 13; i++) {
    const x = 180 + i * 12
    const h = 66 - i * 1.4
    stages.push(`M${x} ${r1(cy - h)}V${r1(cy - 20)}M${x} ${r1(cy + 20)}V${r1(cy + h)}`)
  }
  // turbine stages, growing towards the exhaust
  for (let i = 0; i < 6; i++) {
    const x = 535 + i * 18
    const h = 54 + i * 5
    stages.push(`M${x} ${r1(cy - h)}V${r1(cy - 22)}M${x} ${r1(cy + 22)}V${r1(cy + h)}`)
  }
  // the burner cans
  const cans = `<rect class="can" x="392" y="${cy - 62}" width="70" height="20" rx="10"/><rect class="can" x="392" y="${cy + 42}" width="70" height="20" rx="10"/>`

  // exhaust collector box
  const exhaust = `<path class="ink" d="M700 ${cy - 94}H780V${cy + 120}H700"/><path class="ink thin" d="M716 ${cy - 80}H766V${cy + 106}H716Z"/>`

  // the shaft and its centre line
  const shaft = `<rect class="shaft" x="60" y="${cy - 8}" width="640" height="16"/>`
  const centre = `<path class="centre" d="M0 ${cy}H820"/>`

  // a dimension line under the machine, ticks and arrows, no words
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
    `<path class="ink thin" d="${stages.join('')}"/>` +
    `<ellipse class="flame" cx="427" cy="${cy}" rx="40" ry="34" fill="url(#flame)"/>` +
    cans +
    `<path class="ink" d="${outline}"/>` +
    exhaust +
    centre +
    dim +
    `</g>`
  )
}

function build(): string {
  const compressor = rotor({
    root: 92, tip: 330, blades: 41, rootW: 9, tipW: 5, sweep: 10, bolts: 16,
    bladeClass: 'blade', spin: 'spin-slow',
  })
  const turbine = rotor({
    root: 70, tip: 220, blades: 29, rootW: 10, tipW: 6, sweep: -12, bolts: 12,
    bladeClass: 'blade hot', spin: 'spin-back',
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<defs>
<pattern id="minor" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" class="grid"/></pattern>
<pattern id="major" width="200" height="200" patternUnits="userSpaceOnUse"><path d="M200 0H0V200" fill="none" class="grid major"/></pattern>
<radialGradient id="heat"><stop offset="0" stop-color="#ff8a2a" stop-opacity=".75"/><stop offset=".5" stop-color="#e2561b" stop-opacity=".3"/><stop offset="1" stop-color="#e2561b" stop-opacity="0"/></radialGradient>
<radialGradient id="flame"><stop offset="0" stop-color="#ffc06a" stop-opacity=".9"/><stop offset=".55" stop-color="#ff7a1a" stop-opacity=".45"/><stop offset="1" stop-color="#ff7a1a" stop-opacity="0"/></radialGradient>
<linearGradient id="steelD" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#171b20"/><stop offset=".5" stop-color="#0f1215"/><stop offset="1" stop-color="#14100d"/></linearGradient>
<linearGradient id="steelL" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9ecef"/><stop offset=".5" stop-color="#dde1e5"/><stop offset="1" stop-color="#e6e2dc"/></linearGradient>
<radialGradient id="hushD" cx="50%" cy="52%" r="50%"><stop offset="0" stop-color="#0f1215" stop-opacity=".85"/><stop offset=".65" stop-color="#0f1215" stop-opacity=".3"/><stop offset="1" stop-color="#0f1215" stop-opacity="0"/></radialGradient>
<radialGradient id="hushL" cx="50%" cy="52%" r="50%"><stop offset="0" stop-color="#e4e7ea" stop-opacity=".85"/><stop offset=".65" stop-color="#e4e7ea" stop-opacity=".3"/><stop offset="1" stop-color="#e4e7ea" stop-opacity="0"/></radialGradient>
</defs>
<style>
.ground{fill:url(#steelD)}
.hush{fill:url(#hushD)}
.grid{stroke:#1a2027;stroke-width:1}
.grid.major{stroke:#222a32}
.case{fill:none;stroke:#5c6773;stroke-width:2.5}
.case.thin{stroke-width:1;stroke-opacity:.6}
.duct{fill:#13171b}
.blade path{fill:#2b333b;stroke:#6f7b87;stroke-width:1}
.blade.hot path{fill:#3a2b22;stroke:#9a6a45}
.hub{fill:#1a1f24;stroke:#6f7b87;stroke-width:1.5}
.hub.inner{fill:#232a31}
.bolt circle{fill:#8793a0}
.mark{fill:none;stroke:#6f7b87;stroke-width:1;stroke-dasharray:24 6 4 6;stroke-opacity:.7}
.ink{fill:none;stroke:#7d8996;stroke-width:1.6}
.ink.thin{stroke-width:1;stroke-opacity:.7}
.arrow{fill:#7d8996}
.body{fill:#141a20;fill-opacity:.8}
.shaft{fill:#28313a}
.can{fill:#3a2b22;stroke:#9a6a45}
.centre{fill:none;stroke:#7d8996;stroke-width:1;stroke-dasharray:28 6 4 6;stroke-opacity:.6}
.spin-slow{transform-origin:0 0;animation:spin 70s linear infinite}
.spin-back{transform-origin:0 0;animation:spin 55s linear infinite reverse}
.heat{opacity:.45;animation:breathe 9s ease-in-out infinite alternate}
.flame{opacity:.6;animation:breathe 7s ease-in-out infinite alternate}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes breathe{from{opacity:.3}to{opacity:.7}}
@media (max-aspect-ratio:1/1){.pin-p{display:none}.pin-c{transform:translate(1000px,170px) scale(.5) translate(-1350px,-250px)}.pin-t{transform:translate(640px,860px) scale(.5) translate(-230px,-820px)}}
@media (prefers-color-scheme:light){
.ground{fill:url(#steelL)}
.hush{fill:url(#hushL)}
.grid{stroke:#d3d8dd}
.grid.major{stroke:#c7cdd3}
.case{stroke:#7b8590}
.duct{fill:#d6dbe0}
.blade path{fill:#c4cad1;stroke:#7f8994}
.blade.hot path{fill:#cdb39b;stroke:#94704f}
.hub{fill:#d0d5da;stroke:#7f8994}
.hub.inner{fill:#c2c8ce}
.bolt circle{fill:#6d7782}
.mark{stroke:#7f8994}
.ink{stroke:#4f6a8a}
.arrow{fill:#4f6a8a}
.body{fill:#dfe6ee}
.shaft{fill:#c3ccd6}
.can{fill:#e3cdb6;stroke:#94704f}
.centre{stroke:#4f6a8a}
.heat{opacity:.3}
}
</style>
<rect class="ground" width="1600" height="1000"/>
<rect width="1600" height="1000" fill="url(#minor)"/>
<rect width="1600" height="1000" fill="url(#major)"/>
<g class="pin-p"><g transform="translate(60 40)">${profile()}</g></g>
<g class="pin-c"><g transform="translate(1350 250)">${compressor}</g></g>
<g class="pin-t"><g transform="translate(230 820)">${turbine}</g></g>
<rect class="hush" width="1600" height="1000"/>
</svg>`
}

export const SCENE = build()
