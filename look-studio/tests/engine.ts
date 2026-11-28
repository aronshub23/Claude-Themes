import { mock } from 'claude-code/testing'
import type { On } from 'claude-code'

// The engine beneath the plugin: what each test stands in for.
export function engine(on: On, stored?: Record<string, unknown>) {
  const sets: string[] = []
  let cleared = 0
  mock.store(on, stored)
  on('command.register', (_, e) => ({ value: { command: e.name } }))
  on('theme.set', (_, e) => {
    sets.push(String(e.backdrop && 'scene' in e.backdrop ? e.backdrop.scene : ''))
    return { value: { isDrawn: true, requestId: 'look' } }
  })
  on('theme.clear', () => {
    cleared++
    return { value: { isDrawn: false, reason: 'cleared', wasSet: true } as never }
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  const prompts: string[] = []
  on('prompt.submit', (_, e) => {
    prompts.push(e.text)
    return { text: e.text }
  })
  on('tool.register', (_, e) => ({ value: { tool: e.name } }) as never)
  const logs: string[] = []
  on('ui.log', (_, e) => {
    logs.push(JSON.stringify(e))
    return { value: null } as never
  })
  return { sets, prompts, logs, cleared: () => cleared }
}

export const start = { cwd: '/', surface: 'desktop', isInteractive: true } as const
export const look = (args: string) =>
  ({ command: 'look', args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 80 } }) as const

