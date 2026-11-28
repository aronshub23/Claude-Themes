import type { EngineInterface, Register, ThemeResult } from 'claude-code'

import { LOOKS } from './looks/index.js'
import type { Look } from './looks/index.js'
import {
  CUSTOM_PREFIX,
  PREVIEW,
  compile,
  customSpecs,
  hasRoom,
  report,
  revive,
  sceneName,
} from './studio.js'
import type { LookSpec } from './studio.js'

const PLUGIN = 'theme-switcher'
// The look each person picked, kept across sessions: a look's id, or 'off'.
const CHOICE = 'look'
const OFF = 'off'
const SKILL = 'theme-switcher:create-look'

// What /look new hands Claude: the person's idea and the skill to follow.
export function guidePrompt(idea: string): string {
  const said = idea.trim() === '' ? '' : ` My idea: ${idea.trim()}`
  return `I want to design my own Claude look with theme-switcher.${said} Use the ${SKILL} skill to guide me through it.`
}

// The look being previewed this session (see types/index.d.ts).
const previewing = { plugin: 'theme-switcher', key: 'preview' } as const

// Scenes by backdrop name, filled as looks are put on; a reload empties it
// and the Backdrop hook refills it from the store.
const scenes = new Map<string, string>()

const norm = (s: string) => s.toLowerCase().trim().replace(/\s+/g, '-')

async function allLooks($: EngineInterface): Promise<{ builtIn: readonly Look[]; mine: Look[] }> {
  const mine: Look[] = []
  for (const spec of await customSpecs($)) {
    const look = revive(spec, LOOKS)
    if (look !== undefined) {
      mine.push(look)
    }
  }
  return { builtIn: LOOKS, mine }
}

// A look by its id, its name, or the start of either: `/look neon`.
function find(looks: readonly Look[], query: string): Look | undefined {
  const q = norm(query)
  return looks.find(look => look.id === q) ?? looks.find(look => look.id.startsWith(q) || norm(look.name).startsWith(q))
}

async function chosen($: EngineInterface): Promise<Look | typeof OFF> {
  const stored = await $.store.get(CHOICE)
  if (stored === OFF) {
    return OFF
  }
  if (typeof stored === 'string') {
    const builtIn = LOOKS.find(look => look.id === stored)
    if (builtIn !== undefined) {
      return builtIn
    }
    const spec = await $.store.get(CUSTOM_PREFIX + stored)
    const mine = typeof spec === 'object' && spec !== null ? revive(spec as LookSpec, LOOKS) : undefined
    if (mine !== undefined) {
      return mine
    }
  }
  return LOOKS[0]!
}

// The look previewed earlier in this session, if any and it still checks.
async function previewLook($: EngineInterface): Promise<Look | undefined> {
  const { value } = await $.state.get(previewing)
  if (typeof value !== 'string' || value === '') {
    return undefined
  }
  try {
    const out = compile(JSON.parse(value), LOOKS)
    return 'look' in out ? out.look : undefined
  } catch {
    return undefined
  }
}

async function putOn($: EngineInterface, look: Look): Promise<ThemeResult> {
  if (look.sceneId !== '') {
    scenes.set(look.sceneId, look.scene)
  }
  try {
    return await $.theme.set({ ...look.base, style: look.style, sound: look.sound })
  } catch (error) {
    // A style or sound the build refuses, or a build that takes neither:
    // keep the colors and the scene, and say why.
    $.ui.log(`${look.id}: ${String(error)}`)
    const set = await $.theme.set(look.base)
    return set.isDrawn ? { ...set, refused: String(error) } as ThemeResult : set
  }
}

function listText(builtIn: readonly Look[], mine: readonly Look[], current: Look | typeof OFF): string {
  const row = (look: Look) =>
    `${current !== OFF && look.id === current.id ? '●' : '○'} ${look.id}: ${look.summary}`
  return [
    'Built in:',
    ...builtIn.map(row),
    '',
    'Yours:',
    ...(mine.length > 0 ? mine.map(row) : ['  none yet. Make one with /look new']),
    '',
    `${current === OFF ? '●' : '○'} off: the app's own look`,
    '',
    '/look <name> switches (a start is enough) · /look next · /look off',
    '/look new [idea] designs a new look with Claude · /look export <name> · /look delete <name>',
  ].join('\n')
}

// What a person sees after a look goes on.
function onText(look: Look, set: ThemeResult): string {
  const refused = (set as ThemeResult & { refused?: string }).refused
  const where = set.isDrawn
    ? 'It shows in the desktop and mobile apps.'
    : `Nothing draws it here: ${set.reason}`
  return `Look: ${look.name}. ${where}${refused ? `\n(Its style or sound was refused: ${refused})` : ''}`
}

async function checkAndPutOn($: EngineInterface, spec: unknown, save: boolean): Promise<string> {
  const out = compile(spec, LOOKS)
  if ('errors' in out) {
    return ['Not put on. Fix these and try again:', ...out.errors.map(l => `- ${l}`)].join('\n')
  }
  const { look, problems } = out
  if (save) {
    if (!(await hasRoom($, spec as LookSpec))) {
      return "Not saved: the person's saved looks are full (about 3.5 MB in all). Make the scene smaller, or ask them to /look delete one."
    }
    await $.store.set(CUSTOM_PREFIX + look.id, spec)
    await $.store.set(CHOICE, look.id)
    await $.store.delete(PREVIEW)
    await $.state.set(previewing, '')
  } else {
    await $.store.set(PREVIEW, spec)
    await $.state.set(previewing, JSON.stringify(spec))
  }
  const set = await putOn($, look)
  const refused = (set as ThemeResult & { refused?: string }).refused
  return [
    save ? `Saved "${look.name}" as ${look.id} and put it on.` : `Previewing "${look.name}" (not saved).`,
    set.isDrawn
      ? 'A surface that draws looks is attached: ask the person to look in the desktop or mobile app, in light and dark mode where the look has both.'
      : `Nothing draws it in this session: ${set.reason}. It is checked, but the person can only see it in the Claude desktop or mobile app.`,
    refused ? `The app refused the style or sound, so only colors and backdrop are on. Fix this and preview again: ${refused}` : '',
    report(problems),
    look.sceneId !== '' && look.scene.length > 60_000
      ? `The scene is ${look.scene.length} characters; under 60,000 keeps it light.`
      : '',
  ]
    .filter(line => line !== '')
    .join('\n')
}

const LOOK_SCHEMA = {
  type: 'object',
  description: 'A look as JSON. Read the create-look skill before writing one.',
  properties: {
    id: { type: 'string', description: 'kebab-case, 2-40 chars, unique; not a built-in id' },
    name: { type: 'string', description: 'display name, up to 48 chars' },
    summary: { type: 'string', description: 'one line for the /look list' },
    palette: {
      type: 'object',
      description:
        "makeColors input: { roles: { accent, danger, success, warning, pro } (6-digit hex), light?: { gray: { anchors: { 'surface-0', 'surface-1', 'surface-2', 'surface-3'?, 'text-primary', 'text-secondary', 'text-muted' } }, git? }, dark?: same, only?: 'light'|'dark' }",
    },
    backdrop: {
      type: 'object',
      description:
        '{ svg, alt?, glass? } for a moving scene (one pure-vector SVG with viewBox and preserveAspectRatio="xMidYMid slice", CSS animation in its own <style>), or { color } / { gradient } for a still ground',
    },
    style: { type: 'object', description: 'ThemeStyle: Text, Heading, UserMessage, AssistantMessage, ToolUse rules' },
    sound: { type: 'object', description: 'ThemeSound: { ambience?, cues? }, numbers only' },
    author: { type: 'string' },
  },
  required: ['id', 'name', 'palette'],
} as const

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'look',
      description: 'Switch the look of Claude, or design your own with /look new',
      argumentHint: '[name | next | off | new [idea] | export <name> | delete <name>]',
      immediate: true,
    })

    await $.tool.register({
      name: 'look_preview',
      description:
        "Put a look on now without saving it, so the person can see it. Checks the look first and answers what to fix: the palette's contrast problems (fix every MUST FIX line), scene rules, and any style or sound the app refused. Use it after each change while designing; save with look_save once the person is happy.",
      inputSchema: { type: 'object', properties: { look: LOOK_SCHEMA }, required: ['look'] },
      isDeferred: false,
    })
    await $.tool.register({
      name: 'look_save',
      description:
        "Save a look to the person's own looks and put it on; it stays theirs across sessions and /look lists it. The same checks as look_preview. Saving an id that exists replaces that look.",
      inputSchema: { type: 'object', properties: { look: LOOK_SCHEMA }, required: ['look'] },
      isDeferred: false,
    })
    await $.tool.register({
      name: 'look_get',
      description:
        "Return one of the person's saved looks as JSON, to change it (edit, then look_preview and look_save under the same id) or to share it (anyone can paste the JSON to Claude and have it saved with look_save).",
      inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
      isDeferred: false,
    })
    await $.tool.register({
      name: 'look_use',
      description:
        "Switch to a look, built-in or saved, by id or the start of its name ('neon', 'abyssal'), or 'off' for the app's own; it stays on in later sessions, as /look does. Ends any preview.",
      inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
      isDeferred: false,
    })
    await $.tool.register({
      name: 'look_list',
      description: 'List every look: the built-in ones and the ones the person made, and which is on.',
      inputSchema: { type: 'object', properties: {} },
      isDeferred: false,
    })

    // A reload mid-design keeps the preview on; a new session has none.
    const preview = await previewLook($)
    const current = preview ?? (await chosen($))
    if (current !== OFF) {
      const set = await putOn($, current)
      if (!set.isDrawn) {
        $.ui.log(set.reason)
      }
    }

    return next(e)
  })

  // ---- the command ----

  on('command.run', { command: 'look' }, async ($, e) => {
    const [word = '', ...rest] = e.args.trim().split(/\s+/)
    const arg = rest.join(' ')
    const verb = word.toLowerCase()
    const current = await chosen($)
    const { builtIn, mine } = await allLooks($)
    const text = (t: string) => ({ text: t, isTextDisplayOnly: true }) as const

    if (verb === '' || verb === 'list') {
      return text(listText(builtIn, mine, current))
    }

    if (verb === 'new') {
      // A command can't start a turn while it runs: submit once it has answered.
      $.clock.after(50, () => {
        $.prompt
          .submit({
            text: guidePrompt(arg),
            asUser: true,
          })
          .catch(error => $.ui.log(`look new: ${String(error)}`))
      })
      return text(`Starting the look studio… Claude will ask about the look you want. (If nothing starts, ask Claude to "make me a new look", or run /${SKILL}.)`)
    }

    if (verb === OFF) {
      await $.state.set(previewing, '')
      await $.store.set(CHOICE, OFF)
      await $.theme.clear()
      return text("Look off: back to the app's own.")
    }

    if (verb === 'export' || verb === 'delete') {
      const look = find(mine, arg)
      if (arg === '' || look === undefined) {
        return text(`Name one of your own looks: /look ${verb} <name>.\n\n${listText(builtIn, mine, current)}`)
      }
      if (verb === 'export') {
        const spec = await $.store.get(CUSTOM_PREFIX + look.id)
        return text(
          `${look.name}, as JSON. Send it to anyone with theme-switcher: they paste it to Claude and ask to save the look.\n\n${JSON.stringify(spec)}`,
        )
      }
      await $.store.delete(CUSTOM_PREFIX + look.id)
      if (current !== OFF && current.id === look.id) {
        await $.store.delete(CHOICE)
        await putOn($, LOOKS[0]!)
      }
      return text(`Deleted ${look.name}.`)
    }

    const all = [...builtIn, ...mine]
    const look = verb === 'next' ? all[(current === OFF ? -1 : all.findIndex(one => one.id === current.id)) + 1] ?? all[0]! : find(all, e.args)
    if (look === undefined) {
      return text(`No look called "${e.args.trim()}".\n\n${listText(builtIn, mine, current)}`)
    }
    await $.state.set(previewing, '')
    await $.store.set(CHOICE, look.id)
    return text(onText(look, await putOn($, look)))
  })

  // ---- the tools the model calls while designing ----

  // Each answers what went wrong as the call's error, never by throwing.
  on('tool.run', { tool: 'mcp__theme-switcher__look_preview' }, async ($, e) => {
    try {
      return { result: await checkAndPutOn($, e['look'], false) }
    } catch (error) {
      return { deny: `look_preview failed: ${String(error)}` }
    }
  })

  on('tool.run', { tool: 'mcp__theme-switcher__look_save' }, async ($, e) => {
    try {
      return { result: await checkAndPutOn($, e['look'], true) }
    } catch (error) {
      return { deny: `look_save failed: ${String(error)}` }
    }
  })

  on('tool.run', { tool: 'mcp__theme-switcher__look_get' }, async ($, e) => {
    try {
      const id = norm(String(e['id'] ?? ''))
      if (LOOKS.some(look => look.id === id)) {
        return { result: `${id} is a built-in look, written as code, so it has no JSON. Describe what to keep from it and design a new look instead.` }
      }
      const spec = await $.store.get(CUSTOM_PREFIX + id)
      return { result: spec === undefined ? `No saved look "${id}". Call look_list.` : JSON.stringify(spec) }
    } catch (error) {
      return { deny: `look_get failed: ${String(error)}` }
    }
  })

  on('tool.run', { tool: 'mcp__theme-switcher__look_use' }, async ($, e) => {
    try {
      const query = String(e['id'] ?? '')
      await $.state.set(previewing, '')
      if (norm(query) === OFF) {
        await $.store.set(CHOICE, OFF)
        await $.theme.clear()
        return { result: "Look off: back to the app's own." }
      }
      const { builtIn, mine } = await allLooks($)
      const look = find([...builtIn, ...mine], query)
      if (look === undefined) {
        return { result: `No look called "${query}".\n\n${listText(builtIn, mine, await chosen($))}` }
      }
      await $.store.set(CHOICE, look.id)
      return { result: onText(look, await putOn($, look)) }
    } catch (error) {
      return { deny: `look_use failed: ${String(error)}` }
    }
  })

  on('tool.run', { tool: 'mcp__theme-switcher__look_list' }, async $ => {
    try {
      const { builtIn, mine } = await allLooks($)
      return { result: listText(builtIn, mine, await chosen($)) }
    } catch (error) {
      return { deny: `look_list failed: ${String(error)}` }
    }
  })

  // ---- drawing ----

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') {
      return next(e)
    }
    if (e.props.plugin !== PLUGIN) {
      return next(e)
    }
    let svg = LOOKS.find(one => one.sceneId === e.props.scene)?.scene ?? scenes.get(e.props.scene)
    if (svg === undefined) {
      // After a reload: find the scene among the saved looks and the preview.
      const specs = await customSpecs($)
      const preview = await $.store.get(PREVIEW)
      for (const spec of [...specs, preview as LookSpec | undefined]) {
        if (spec && spec.backdrop && 'svg' in spec.backdrop && sceneName(spec.id) === e.props.scene) {
          svg = spec.backdrop.svg
          scenes.set(e.props.scene, svg)
        }
      }
    }
    if (svg === undefined) {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)
    const alt = LOOKS.find(one => one.sceneId === e.props.scene)?.alt ?? 'A backdrop made with the look studio'

    return <Svg source={svg} alt={alt} isInteractive />
  })
}
