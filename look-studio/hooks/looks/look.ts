import type { ThemeSetArgs, ThemeSound, ThemeStyle } from 'claude-code'

// One look the switcher can put on.
export type Look = {
  // What `/look <id>` takes, and what is remembered across sessions.
  id: string
  name: string
  // One line for `/look`'s list.
  summary: string
  // The colors and backdrop: what every build takes.
  base: ThemeSetArgs
  // Added on builds that take them; a build that doesn't gets `base` alone.
  style?: ThemeStyle
  sound?: ThemeSound
  // The backdrop's scene name, as `base.backdrop` gives it, and its SVG.
  sceneId: string
  scene: string
  alt: string
  // makeColors' contrast notes, for whoever adds a look.
  problems: readonly string[]
}
