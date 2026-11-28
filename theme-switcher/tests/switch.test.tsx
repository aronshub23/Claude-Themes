import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

// The engine beneath the plugin: what each test stands in for.
function engine(on: On, stored?: Record<string, unknown>) {
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
  return { sets, cleared: () => cleared }
}

const start = { cwd: '/', surface: 'desktop', isInteractive: true } as const
const look = (args: string) =>
  ({ command: 'look', args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 80 } }) as const

test('a new install starts on the first look', async ($, on) => {
  const seen = engine(on)
  await $.session.start(start)
  expect(seen.sets.join(',')).toBe('circuit')
})

test('the look picked before is put on at the next start', async ($, on) => {
  const seen = engine(on, { look: 'turbine-hall' })
  await $.session.start(start)
  expect(seen.sets.join(',')).toBe('turbine-hall')
})

test('/look turb switches, and is remembered', async ($, on) => {
  const seen = engine(on)
  await $.session.start(start)
  const { text } = await $.command.run(look('turb'))
  expect(text ?? '').toContain('Turbine Hall')
  // The next session starts on it.
  await $.session.start(start)
  expect(seen.sets.join(',')).toBe('circuit,turbine-hall,turbine-hall')
})

test('/look next cycles round, and /look off clears and is remembered', async ($, on) => {
  const seen = engine(on, { look: 'turbine-hall' })
  await $.session.start(start)
  await $.command.run(look('next'))
  expect(seen.sets.join(',')).toBe('turbine-hall,circuit')
  await $.command.run(look('off'))
  expect(seen.cleared()).toBe(1)
  // The next session starts with no look.
  await $.session.start(start)
  expect(seen.sets.join(',')).toBe('turbine-hall,circuit')
})

test('/look alone lists every look and marks the current one', async ($, on) => {
  engine(on, { look: 'neon-circuit' })
  const { text } = await $.command.run(look(''))
  expect(text ?? '').toContain('● neon-circuit')
  expect(text ?? '').toContain('○ turbine-hall')
})

test('an unknown name says so and lists the looks', async ($, on) => {
  engine(on)
  const { text } = await $.command.run(look('disco'))
  expect(text ?? '').toContain('No look called "disco"')
})

test('the backdrop draws each look\'s scene, and leaves other plugins\' alone', async $ => {
  for (const scene of ['circuit', 'turbine-hall']) {
    const ui = await $.ui.mount({
      plugin: 'theme-switcher', component: 'Backdrop', surface: 'desktop',
      props: { scene, plugin: 'theme-switcher', glass: { blur: 10, opacity: 0.7 } },
    })
    expect(await ui.find({ type: 'Svg' })).toBeTruthy()
    await ui.unmount()
  }
  const other = await $.ui.mount({
    plugin: 'theme-switcher', component: 'Backdrop', surface: 'desktop',
    props: { scene: 'circuit', plugin: 'someone-else', glass: false },
  })
  expect(await other.find({ type: 'Svg' })).toBeFalsy()
  await other.unmount()
})
