import { expect, test } from 'claude-code/testing'

import { engine, look, start } from './engine.js'

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
