import type { ThemeMessageRule, ThemeSetArgs, ThemeSound, ThemeStyle } from 'claude-code'

import type { Look } from './look.js'

import { makeColors } from '../make-colors.js'
import { SCENE } from './turbine-scene.js'

// Red, white and charcoal: near-white steel by day, charcoal by night, a
// strong red as the accent; neutral grays with no blue cast. Errors take a
// deeper crimson so they stay apart from the accent.
const { theme, problems } = makeColors({
  label: 'Turbine Hall',
  roles: {
    accent: '#e60012',
    danger: '#a8102f',
    success: '#2e8b57',
    warning: '#d99a00',
    pro: '#3e6d9c',
  },
  light: {
    gray: {
      anchors: {
        'surface-0': '#eeeff0',
        'surface-1': '#f5f5f6',
        'surface-2': '#fbfbfc',
        'text-primary': '#16171a',
        'text-secondary': '#3d4045',
        'text-muted': '#5a5e64',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#111213',
        'surface-1': '#17181a',
        'surface-2': '#1d1e21',
        'surface-3': '#222427',
        'text-primary': '#f1f1f2',
        'text-secondary': '#c8cacd',
        'text-muted': '#9ea1a6',
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

// A riveted steel nameplate, with a red stripe down its left edge.
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

export const LOOK: Look = {
  id: 'turbine-hall',
  name: 'Turbine Hall',
  summary: 'industrial gas turbine in red, white and charcoal (light and dark)',
  base: BASE,
  style: STYLE,
  sound: SOUND,
  sceneId: 'turbine-hall',
  scene: SCENE,
  alt: 'Gas-turbine rotors turning beside a blueprint cutaway of the engine',
  problems,
}
