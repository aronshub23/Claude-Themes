import type { Register, ThemeMessageRule, ThemeSetArgs, ThemeSound, ThemeStyle } from 'claude-code'

import { makeColors } from './make-colors.js'
import { SCENE } from './scene.js'

// Brushed steel by day, graphite turbine hall by night; combustor orange
// as the accent, blued titanium for literals.
const { theme, problems } = makeColors({
  label: 'Turbine Hall',
  roles: {
    accent: '#e8701e',
    danger: '#d23a2c',
    success: '#3f9a62',
    warning: '#d4a317',
    pro: '#4f7fc4',
  },
  light: {
    gray: {
      anchors: {
        'surface-0': '#e8ebee',
        'surface-1': '#eff1f3',
        'surface-2': '#f8f9fa',
        'text-primary': '#15191d',
        'text-secondary': '#3c444c',
        'text-muted': '#56606a',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#0f1215',
        'surface-1': '#151a1e',
        'surface-2': '#1b2025',
        'surface-3': '#20262c',
        'text-primary': '#edf1f4',
        'text-secondary': '#c3cbd2',
        'text-muted': '#9aa4ae',
      },
    },
  },
})

const RIVETS = [
  [6, 6],
  [42, 6],
  [6, 42],
  [42, 42],
] as const
const rivet = ([x, y]: readonly [number, number]) => `M${x - 1.6} ${y}a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0Z`

// A riveted steel nameplate, with an orange heat stripe down its left edge.
const plate: ThemeMessageRule['fill'] = {
  vector: {
    viewBox: 48,
    slice: 12,
    paths: [
      { d: 'M0 0H48V48H0Z', color: 'surface-2' },
      { d: 'M0.5 0.5H47.5V47.5H0.5Z', color: 'border-strong', strokeWidth: 1 },
      { d: RIVETS.map(rivet).join(''), color: 'border-stronger' },
      { d: 'M0 0H3V48H0Z', color: 'fill-accent' },
    ],
  },
}

// A plainer panel for replies: riveted along the top only.
const panel: ThemeMessageRule['fill'] = {
  vector: {
    viewBox: 48,
    slice: 12,
    paths: [
      { d: 'M0 0H48V48H0Z', color: 'surface-1' },
      { d: 'M0.5 0.5H47.5V47.5H0.5Z', color: 'border', strokeWidth: 1 },
      { d: RIVETS.slice(0, 2).map(rivet).join(''), color: 'border-strong' },
    ],
  },
}

const STYLE: ThemeStyle = {
  Heading: { fontFamily: ['mono'], fontWeight: 'semibold', letterSpacing: 1, color: 'text-accent' },
  UserMessage: {
    color: 'text-primary',
    backgroundColor: 'surface-2',
    fill: plate,
    paddingLeft: 20,
    paddingRight: 16,
    paddingY: 14,
    shadow: { x: 0, y: 2, blur: 6, color: '#0000002e' },
  },
  AssistantMessage: {
    color: 'text-primary',
    backgroundColor: 'surface-1',
    fill: panel,
    paddingX: 16,
    paddingY: 14,
  },
  ToolUse: {
    color: 'text-secondary',
    fontFamily: ['mono'],
    backgroundColor: 'surface-2',
    borderColor: 'border-strong',
    borderWidth: 1,
    radius: 0,
    paddingX: 10,
    paddingY: 4,
  },
}

// The hall: a low spool hum, airflow, a faint high whine; cues that spool up
// and down.
const SOUND: ThemeSound = {
  ambience: {
    reverb: 0.35,
    layers: [
      { wave: 'saw', notes: ['A1'], drone: true, gain: 0.06, filter: { type: 'lowpass', hz: 180, to: 320 } },
      { wave: 'brown', drone: true, gain: 0.1, filter: { type: 'lowpass', hz: 320 } },
      { wave: 'pink', drone: true, gain: 0.03, filter: { type: 'bandpass', hz: 900, to: 1300 } },
      { wave: 'sine', notes: [1760], drone: true, gain: 0.012, tremolo: { hz: 0.2, depth: 0.4 } },
    ],
  },
  cues: {
    send: { layers: [{ wave: 'triangle', notes: ['A3'], glide: 12, attack: 0.02, release: 0.5, gain: 0.12, filter: { type: 'lowpass', hz: 1500 } }] },
    tool: { layers: [{ wave: 'white', gain: 0.05, release: 0.03, filter: { type: 'bandpass', hz: 3000 } }] },
    done: {
      reverb: 0.4,
      layers: [
        { wave: 'triangle', notes: ['A4'], glide: -5, release: 0.6, gain: 0.1, filter: { type: 'lowpass', hz: 1800 } },
        { wave: 'bell', notes: ['E5'], release: 1.2, gain: 0.08 },
      ],
    },
    ask: { layers: [{ wave: 'square', notes: ['D5', 'A5'], step: 0.12, gain: 0.07, release: 0.12, filter: { type: 'lowpass', hz: 2000 } }] },
    error: { layers: [{ wave: 'saw', notes: ['A2'], glide: -12, gain: 0.12, release: 0.6, filter: { type: 'lowpass', hz: 900 } }] },
    compact: { layers: [{ wave: 'brown', attack: 0.1, release: 0.8, gain: 0.12, filter: { type: 'lowpass', hz: 600, to: 200 } }] },
    click: { layers: [{ wave: 'triangle', notes: ['A3', 'C4', 'D4', 'E4', 'G4', 'A4'], gain: 0.1, release: 0.2 }] },
  },
}

const BASE: ThemeSetArgs = {
  colors: theme,
  backdrop: { scene: 'turbine-hall', glass: { blur: 12, opacity: 0.7 } },
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))
    if (unpainted !== undefined) {
      $.ui.toast(unpainted)
    }

    let set
    try {
      set = await $.theme.set({ ...BASE, style: STYLE, sound: SOUND })
    } catch (error) {
      // An older build may take no style or sound: keep the colors and the scene.
      $.ui.log(String(error))
      set = await $.theme.set(BASE)
    }
    if (!set.isDrawn) {
      $.ui.status(set.reason)
    }

    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') {
      return next(e)
    }
    if (e.props.scene !== 'turbine-hall') {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)

    return <Svg source={SCENE} alt="Gas-turbine rotors turning slowly beside a blueprint cutaway of the engine" isInteractive />
  })
}
