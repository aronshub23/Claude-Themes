import { expect, test } from 'claude-code/testing'

test('the whole look is set in one call, style and sound included', async ($, on) => {
  const sets: Record<string, unknown>[] = []
  on('theme.set', (_, e) => {
    sets.push({ ...e })
    return { value: { isDrawn: true, requestId: 'look' } }
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  expect(sets.length).toBe(1)
  const set = sets[0]!
  expect(Object.keys(set).sort().join(',')).toContain('style')
  expect(Object.keys(set).sort().join(',')).toContain('sound')
})

test('the backdrop draws the circuit board on desktop and mobile', async $ => {
  for (const surface of ['desktop', 'mobile'] as const) {
    const ui = await $.ui.mount({
      plugin: 'neon-circuit',
      component: 'Backdrop',
      surface,
      props: { scene: 'circuit', plugin: 'neon-circuit', glass: { blur: 10, opacity: 0.72 } },
    })
    const svg = await ui.find({ type: 'Svg' })
    expect(svg).toBeTruthy()
    await ui.unmount()
  }
})
