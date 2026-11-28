import { expect, mock, test } from 'claude-code/testing'

import { guidePrompt } from '../hooks/register.js'
import { engine, look, start } from './engine.js'

const SCENE =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">' +
  '<style>.s{animation:spin 40s linear infinite;transform-origin:0 0}@keyframes spin{to{transform:rotate(360deg)}}</style>' +
  '<rect width="1600" height="1000" fill="#0d1512"/><g transform="translate(1400 200)"><g class="s"><path d="M0 0L200 10L200 -10Z" fill="#d8b45a"/></g></g></svg>'

const GARDEN = {
  id: 'midnight-garden',
  name: 'Midnight Garden',
  summary: 'moonlit glasshouse (dark)',
  palette: {
    only: 'dark',
    roles: { accent: '#d8b45a', danger: '#d9534f', success: '#5fb86a', warning: '#e0a43a', pro: '#8fa7e0' },
    dark: {
      gray: {
        anchors: {
          'surface-0': '#0d1512',
          'surface-1': '#121c18',
          'surface-2': '#17231e',
          'surface-3': '#1c2a24',
          'text-primary': '#eef3ef',
          'text-secondary': '#c4d0c8',
          'text-muted': '#98a89e',
        },
      },
    },
  },
  backdrop: { svg: SCENE, alt: 'A gold blade turning' },
}

const call = (name: string, args: Record<string, unknown>) =>
  ({ tool: `mcp__theme-switcher__${name}`, tool_use_id: `t-${name}`, ...args }) as const

const resultOf = (out: unknown) => String((out as { result?: unknown }).result ?? '')

test('a preview puts the look on without saving it', async ($, on) => {
  const seen = engine(on)
  const out = resultOf(await $.tool.run(call('look_preview', { look: GARDEN })))
  expect(out).toContain('Previewing "Midnight Garden"')
  expect(seen.sets.join(',')).toBe('custom-midnight-garden')
  const { text } = await $.command.run(look(''))
  expect(text ?? '').toContain('none yet')
})

test('a scene with a picture in it is refused, and says why', async ($, on) => {
  const seen = engine(on)
  const bad = { ...GARDEN, backdrop: { svg: SCENE.replace('</svg>', '<image width="10" height="10"/></svg>') } }
  const out = resultOf(await $.tool.run(call('look_preview', { look: bad })))
  expect(out).toContain('Not put on')
  expect(out).toContain('<image>')
  expect(seen.sets.length).toBe(0)
})

test('a palette makeColors cannot use is refused with its reason', async ($, on) => {
  engine(on)
  const bad = { ...GARDEN, palette: { roles: { accent: 'purple' } } }
  const out = resultOf(await $.tool.run(call('look_preview', { look: bad })))
  expect(out).toContain('Not put on')
  expect(out).toContain('palette')
})

test('a built-in id is refused', async ($, on) => {
  engine(on)
  const out = resultOf(await $.tool.run(call('look_save', { look: { ...GARDEN, id: 'neon-circuit' } })))
  expect(out).toContain('taken')
})

test('a saved look is listed, comes back next session, exports and deletes', async ($, on) => {
  const seen = engine(on)
  const saved = resultOf(await $.tool.run(call('look_save', { look: GARDEN })))
  expect(saved).toContain('Saved "Midnight Garden"')

  const list = await $.command.run(look(''))
  expect(list.text ?? '').toContain('● midnight-garden')

  await $.session.start(start)
  expect(seen.sets.at(-1)).toBe('custom-midnight-garden')

  const got = resultOf(await $.tool.run(call('look_get', { id: 'midnight-garden' })))
  expect(JSON.parse(got).name).toBe('Midnight Garden')

  const exported = await $.command.run(look('export midnight'))
  expect(exported.text ?? '').toContain('"id":"midnight-garden"')

  const deleted = await $.command.run(look('delete midnight'))
  expect(deleted.text ?? '').toContain('Deleted Midnight Garden')
  // Deleting the look that was on goes back to the first built-in.
  expect(seen.sets.at(-1)).toBe('circuit')
  const after = await $.command.run(look(''))
  expect(after.text ?? '').toContain('none yet')
})

test('/look switches to a saved look by the start of its name', async ($, on) => {
  const seen = engine(on, { 'custom:midnight-garden': GARDEN })
  const { text } = await $.command.run(look('midnight'))
  expect(text ?? '').toContain('Look: Midnight Garden')
  expect(seen.sets.at(-1)).toBe('custom-midnight-garden')
})

test('the backdrop draws a saved look\'s scene', async ($, on) => {
  engine(on, { 'custom:midnight-garden': GARDEN })
  const ui = await $.ui.mount({
    plugin: 'theme-switcher',
    component: 'Backdrop',
    surface: 'mobile',
    props: { scene: 'custom-midnight-garden', plugin: 'theme-switcher', glass: { blur: 12, opacity: 0.7 } },
  })
  expect(await ui.find({ type: 'Svg' })).toBeTruthy()
  await ui.unmount()
})

test('/look new answers at once and submits the guide prompt once it has', async ($, on) => {
  const seen = engine(on)
  const clock = mock.clock(on)
  const { text } = await $.command.run(look('new a rainy Tokyo alley at night'))
  expect(text ?? '').toContain('look studio')
  expect(seen.logs.join('')).toBe('')
  await clock.advance(100)
  expect(seen.logs.join('')).toBe('')
  expect(seen.prompts.join('\n')).toContain('My idea: a rainy Tokyo alley at night')
  expect(seen.prompts.join('\n')).toContain('theme-switcher:create-look')
})

test('the guide prompt carries the idea and names the skill', () => {
  expect(guidePrompt('a rainy Tokyo alley at night')).toContain('My idea: a rainy Tokyo alley at night')
  expect(guidePrompt('')).not.toContain('My idea')
  expect(guidePrompt('')).toContain('theme-switcher:create-look')
})
