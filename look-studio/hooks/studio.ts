// The look studio: looks people make, kept as plain data in the plugin's
// store, checked here before they are previewed or saved, and turned into
// the same `Look` the built-in looks are.

import type { EngineInterface, ThemeBackdropGlass, ThemeSetArgs, ThemeSound, ThemeStyle } from 'claude-code'

import { makeColors } from './make-colors.js'
import type { Look } from './looks/look.js'

type Palette = Parameters<typeof makeColors>[0]

// A look as the studio keeps it, and as it is shared: JSON, no code.
export type LookSpec = {
  id: string
  name: string
  summary?: string
  // makeColors' input: roles, and anchors for light, dark or both.
  palette: Omit<Palette, 'label'> & { label?: string }
  // A moving scene (an SVG) or a still ground; absent, the app's own.
  backdrop?:
    | { svg: string; alt?: string; glass?: ThemeBackdropGlass | false }
    | { color: string }
    | { gradient: unknown }
  style?: ThemeStyle
  sound?: ThemeSound
  author?: string
}

export const CUSTOM_PREFIX = 'custom:'
export const PREVIEW = 'preview'
// The store holds 4 MiB of JSON in all; keep room for everything else.
const STORE_BUDGET = 3_500_000
const SCENE_LIMIT = 131_072
const RESERVED = new Set(['off', 'next', 'list', 'new', 'delete', 'export', 'preview', 'help', 'edit'])

export const sceneName = (id: string) => `custom-${id}`

// What the engine refuses in a scene, caught here so the model hears why.
export function checkScene(svg: string): string[] {
  const out: string[] = []
  if (svg.length > SCENE_LIMIT) {
    out.push(`The scene is ${svg.length} characters; keep it under ${SCENE_LIMIT} (aim for under 60,000).`)
  }
  if (!/^\s*<svg[\s>]/.test(svg)) {
    out.push('The scene must be one <svg> element and nothing before it.')
  }
  if (!/viewBox\s*=/.test(svg)) {
    out.push('Give the root <svg> a viewBox, with preserveAspectRatio="xMidYMid slice" so it fills any screen.')
  }
  const banned: [RegExp, string][] = [
    [/<image\b/i, '<image> (redraw pictures as vector paths)'],
    [/<foreignObject\b/i, '<foreignObject>'],
    [/<script\b/i, '<script>'],
    [/<iframe\b|<video\b|<audio\b/i, 'embedded media'],
    [/\bhref\b/i, 'href or xlink:href (no <use>, links or external references; the engine refuses the word even in a comment)'],
    [/<!\[CDATA\[/i, 'CDATA'],
    [/url\(\s*['"]?(?!#)/i, 'url() to anything but an id in the same SVG'],
    [/@import|@font-face/i, '@import or @font-face (no fonts or outside styles)'],
    [/<text\b/i, '<text> (no fonts: draw lettering as paths, or leave it out)'],
    [/\bon[a-z]+\s*=/i, 'event attributes such as onclick'],
  ]
  for (const [re, what] of banned) {
    if (re.test(svg)) {
      out.push(`Remove ${what}.`)
    }
  }
  for (const m of svg.matchAll(/<!--([\s\S]*?)-->/g)) {
    if (/<|--/.test(m[1] ?? '')) {
      out.push('Keep XML comments to plain words, with no < or -- inside.')
      break
    }
  }
  return out
}

function checkId(id: unknown, builtIns: readonly Look[]): string[] {
  if (typeof id !== 'string' || !/^[a-z0-9][a-z0-9-]{1,39}$/.test(id)) {
    return ['id: 2 to 40 lowercase letters, digits and hyphens, starting with a letter or digit (like "midnight-garden").']
  }
  if (RESERVED.has(id) || builtIns.some(look => look.id === id)) {
    return [`id: "${id}" is taken by a built-in look or a /look word; pick another.`]
  }
  return []
}

export type Compiled = { look: Look; problems: string[] }

// Checks a spec and turns it into a look, or says what to change.
export function compile(spec: unknown, builtIns: readonly Look[]): { errors: string[] } | Compiled {
  if (typeof spec !== 'object' || spec === null) {
    return { errors: ['The look must be an object: { id, name, palette, backdrop?, style?, sound? }.'] }
  }
  const s = spec as Partial<LookSpec>
  const errors = [...checkId(s.id, builtIns)]
  if (typeof s.name !== 'string' || s.name.trim() === '' || s.name.length > 48) {
    errors.push('name: a short display name, 1 to 48 characters.')
  }
  if (typeof s.palette !== 'object' || s.palette === null) {
    errors.push('palette: makeColors input, { roles, light?, dark?, only? }, with surface-0 and text-primary in each mode given.')
  }
  const backdrop = s.backdrop
  if (backdrop !== undefined && 'svg' in backdrop) {
    if (typeof backdrop.svg !== 'string') {
      errors.push('backdrop.svg must be the scene as one SVG string.')
    } else {
      errors.push(...checkScene(backdrop.svg))
    }
  }
  if (errors.length > 0) {
    return { errors }
  }

  let colors: ReturnType<typeof makeColors>
  try {
    colors = makeColors({ ...s.palette!, label: s.palette!.label ?? s.name! })
  } catch (error) {
    return { errors: [`palette: ${error instanceof Error ? error.message : String(error)}`] }
  }

  const id = s.id!
  let base: ThemeSetArgs = { colors: colors.theme }
  let scene = ''
  let sceneId = ''
  let alt = ''
  if (backdrop !== undefined && 'svg' in backdrop) {
    sceneId = sceneName(id)
    scene = backdrop.svg
    alt = backdrop.alt ?? `${s.name} backdrop`
    base = { ...base, backdrop: { scene: sceneId, ...(backdrop.glass === undefined ? {} : { glass: backdrop.glass }) } }
  } else if (backdrop !== undefined) {
    base = { ...base, backdrop: backdrop as ThemeSetArgs['backdrop'] }
  }

  return {
    look: {
      id,
      name: s.name!,
      summary: s.summary ?? 'made with /look new',
      base,
      style: s.style,
      sound: s.sound,
      sceneId,
      scene,
      alt,
      problems: colors.problems,
    },
    problems: colors.problems,
  }
}

// The store's custom looks, and what they weigh.
export async function customSpecs($: EngineInterface): Promise<LookSpec[]> {
  const keys = await $.store.keys()
  const out: LookSpec[] = []
  for (const key of keys) {
    if (key.startsWith(CUSTOM_PREFIX)) {
      const spec = await $.store.get(key)
      if (typeof spec === 'object' && spec !== null) {
        out.push(spec as LookSpec)
      }
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name))
}

export async function hasRoom($: EngineInterface, spec: LookSpec): Promise<boolean> {
  const others = (await customSpecs($)).filter(one => one.id !== spec.id)
  const weight = others.reduce((sum, one) => sum + JSON.stringify(one).length, 0)
  return weight + JSON.stringify(spec).length < STORE_BUDGET
}

// Turns a stored spec back into a look; a spec that no longer compiles is skipped.
export function revive(spec: LookSpec, builtIns: readonly Look[]): Look | undefined {
  const out = compile(spec, builtIns)
  return 'look' in out ? out.look : undefined
}

// The lines worth the model's attention: what stops Desktop painting the
// look comes first, then the rest, capped.
export function report(problems: readonly string[]): string {
  const blocking = problems.filter(line => line.startsWith("Desktop won't paint"))
  const rest = problems.filter(line => !line.startsWith("Desktop won't paint"))
  const lines: string[] = []
  if (blocking.length > 0) {
    lines.push('MUST FIX (Desktop ignores the whole theme until these are gone):', ...blocking.map(l => `- ${l}`))
  }
  if (rest.length > 0) {
    lines.push(
      `${rest.length} contrast notes under the design system's bar (these still paint; fix ones about text-primary, text-secondary or text-muted, leave the rest):`,
      ...rest.slice(0, 12).map(l => `- ${l}`),
    )
  }
  return lines.join('\n') || 'No contrast problems.'
}
