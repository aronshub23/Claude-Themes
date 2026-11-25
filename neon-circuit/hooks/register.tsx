import type { Register, ThemeMessageRule, ThemeSetArgs, ThemeSound, ThemeStyle } from 'claude-code'

import { makeColors } from './make-colors.js'
import { NEON, SCENE } from './scene.js'

// Night only: violet-black surfaces, neon purple and green, hard blue and red.
const { theme, problems } = makeColors({
  label: 'Neon Circuit',
  only: 'dark',
  roles: {
    accent: NEON.purple,
    success: NEON.green,
    danger: NEON.red,
    pro: NEON.blue,
    warning: '#ffb020',
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#0a0812',
        'surface-1': '#100d1a',
        'surface-2': '#151122',
        'surface-3': '#1a1529',
        'text-primary': '#f1ecff',
        'text-secondary': '#c9c0e3',
        'text-muted': '#a197c0',
      },
    },
    git: {
      added: NEON.green,
      removed: NEON.red,
      modified: '#5a8bff',
      merged: '#c77dff',
      conflicting: '#ffb020',
    },
  },
})

type Hex = `#${string}`

// A chamfered panel: top-left and bottom-right corners cut, a neon outline,
// a hard tick of a second color in the top-right corner.
function panel(fill: Hex, line: Hex, tick: Hex): ThemeMessageRule['fill'] {
  return {
    vector: {
      viewBox: 64,
      slice: 16,
      paths: [
        { d: 'M10 0H64V54L54 64H0V10Z', color: fill },
        { d: 'M10.5 0.75H63.25V53.7L53.7 63.25H0.75V10.5Z', color: line, strokeWidth: 1.25 },
        { d: 'M48 3H60V5.5H48Z', color: tick },
        { d: 'M3 15L15 3', color: tick, strokeWidth: 1.5 },
      ],
    },
  }
}

const STYLE: ThemeStyle = {
  Heading: { fontFamily: ['code'], fontWeight: 'bold', letterSpacing: 1, color: NEON.green },
  UserMessage: {
    color: '#eafff2',
    backgroundColor: '#0c1a13',
    fill: panel('#0c1a13', NEON.green, NEON.red),
    paddingX: 18,
    paddingY: 14,
    shadow: { x: 0, y: 0, blur: 18, color: '#39ff8a33' },
  },
  AssistantMessage: {
    color: '#f1ecff',
    backgroundColor: '#120c20',
    fill: panel('#120c20', '#b44cffaa', NEON.blue),
    paddingX: 18,
    paddingY: 14,
    shadow: { x: 0, y: 0, blur: 18, color: '#b44cff26' },
  },
  ToolUse: {
    color: '#a8f7cb',
    fontFamily: ['code'],
    backgroundColor: '#0b0915f2',
    borderColor: NEON.blue,
    borderWidth: 1,
    radius: 0,
    paddingX: 10,
    paddingY: 4,
  },
}

// A low mains hum, a faint fan, and the odd blip of data; short synthetic cues.
const SOUND: ThemeSound = {
  ambience: {
    reverb: 0.25,
    layers: [
      { wave: 'sine', notes: ['A1', 'E2'], drone: true, gain: 0.12, filter: { type: 'lowpass', hz: 220 } },
      { wave: 'brown', drone: true, gain: 0.08, filter: { type: 'lowpass', hz: 500, to: 900 } },
      {
        wave: 'square',
        notes: ['E6', 'A6', 'B6', 'D7'],
        scatter: 0.25,
        gain: 0.04,
        attack: 0.002,
        release: 0.06,
        filter: { type: 'bandpass', hz: 2400 },
      },
    ],
  },
  cues: {
    send: { layers: [{ wave: 'square', notes: ['E5'], glide: 7, gain: 0.12, release: 0.12, filter: { type: 'lowpass', hz: 3000 } }] },
    tool: { layers: [{ wave: 'triangle', notes: ['C6'], gain: 0.08, release: 0.04 }] },
    done: { reverb: 0.3, layers: [{ wave: 'triangle', notes: ['A4', 'C#5', 'E5', 'A5'], step: 0.06, gain: 0.18, release: 0.25 }] },
    ask: { layers: [{ wave: 'square', notes: ['B5', 'E6'], step: 0.09, gain: 0.1, release: 0.1, filter: { type: 'lowpass', hz: 2500 } }] },
    error: { layers: [{ wave: 'saw', notes: ['E3'], glide: -12, gain: 0.14, release: 0.35, filter: { type: 'lowpass', hz: 1200 } }] },
    compact: { layers: [{ wave: 'pink', gain: 0.1, attack: 0.05, release: 0.4, filter: { type: 'bandpass', hz: 1200, to: 300 } }] },
    click: { layers: [{ wave: 'triangle', notes: ['A4', 'C5', 'D5', 'E5', 'G5', 'A5'], gain: 0.12, release: 0.15 }] },
  },
}

const BASE: ThemeSetArgs = {
  colors: theme,
  backdrop: { scene: 'circuit', glass: { blur: 10, tint: '#0a0812', opacity: 0.72 } },
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
      // An older build may take no style or sound: keep the colors and the board.
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
    if (e.props.scene !== 'circuit') {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)

    return <Svg source={SCENE} alt="A dark circuit board with neon pulses running along its traces" isInteractive />
  })
}
