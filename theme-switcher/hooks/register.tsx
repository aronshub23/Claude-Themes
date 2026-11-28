import type { EngineInterface, Register, ThemeResult } from 'claude-code'

import { LOOKS } from './looks/index.js'
import type { Look } from './looks/index.js'

// The look each person picked, kept across sessions: a look's id, or 'off'.
const CHOICE = 'look'
const OFF = 'off'

// A look by its id, its name, or the start of either: `/look neon`.
function find(query: string): Look | undefined {
  const q = query.toLowerCase().replace(/\s+/g, '-')
  return (
    LOOKS.find(look => look.id === q) ??
    LOOKS.find(look => look.id.startsWith(q) || look.name.toLowerCase().replace(/\s+/g, '-').startsWith(q))
  )
}

async function chosen($: EngineInterface): Promise<Look | typeof OFF> {
  const stored = await $.store.get(CHOICE)
  if (stored === OFF) {
    return OFF
  }
  return (typeof stored === 'string' ? LOOKS.find(look => look.id === stored) : undefined) ?? LOOKS[0]!
}

async function putOn($: EngineInterface, look: Look): Promise<ThemeResult> {
  try {
    return await $.theme.set({ ...look.base, style: look.style, sound: look.sound })
  } catch (error) {
    // An older build may take no style or sound: keep the colors and the scene.
    $.ui.log(`${look.id}: ${String(error)}`)
    return await $.theme.set(look.base)
  }
}

function list(current: Look | typeof OFF): string {
  const rows = LOOKS.map(look => `${look === current ? '●' : '○'} ${look.id}: ${look.summary}`)
  return [
    'Looks:',
    ...rows,
    `${current === OFF ? '●' : '○'} off: the app's own look`,
    '',
    'Switch with /look <name> (a start is enough: /look neon), /look next, or /look off.',
  ].join('\n')
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'look',
      description: 'Switch the look of Claude: list them, or name one',
      argumentHint: '[name | next | off]',
      immediate: true,
    })

    const current = await chosen($)
    if (current !== OFF) {
      const set = await putOn($, current)
      if (!set.isDrawn) {
        $.ui.log(set.reason)
      }
    }

    return next(e)
  })

  on('command.run', { command: 'look' }, async ($, e) => {
    const arg = e.args.trim()
    const current = await chosen($)

    if (arg === '' || arg === 'list') {
      return { text: list(current), isTextDisplayOnly: true }
    }

    if (arg.toLowerCase() === OFF) {
      await $.store.set(CHOICE, OFF)
      await $.theme.clear()
      return { text: "Look off: back to the app's own.", isTextDisplayOnly: true }
    }

    const look =
      arg.toLowerCase() === 'next'
        ? LOOKS[(current === OFF ? -1 : LOOKS.indexOf(current)) + 1] ?? LOOKS[0]!
        : find(arg)
    if (look === undefined) {
      return { text: `No look called "${arg}".\n\n${list(current)}`, isTextDisplayOnly: true }
    }

    await $.store.set(CHOICE, look.id)
    const set = await putOn($, look)
    const where = set.isDrawn
      ? 'It shows in the desktop and mobile apps.'
      : `Nothing draws it here: ${set.reason}`
    return { text: `Look: ${look.name}. ${where}`, isTextDisplayOnly: true }
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') {
      return next(e)
    }
    if (e.props.plugin !== 'theme-switcher') {
      return next(e)
    }
    const look = LOOKS.find(one => one.sceneId === e.props.scene)
    if (look === undefined) {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)

    return <Svg source={look.scene} alt={look.alt} isInteractive />
  })
}
