# Theme Switcher

Animated looks for Claude's desktop and mobile apps, in one plugin. Pick one with `/look` and it stays picked in every session after.

| Look | What it is |
| --- | --- |
| `neon-circuit` | Cyberpunk. A live circuit board with light pulsing along its traces; neon purple and green with hard blue and red; chamfered neon message panels; an electrical hum with synth cues. Dark mode. |
| `turbine-hall` | Industrial, in red, white and charcoal. Compressor and turbine rotors turning on a drafting grid, embers rising off the hot stage, a blueprint cutaway with air streaming through it and a flickering combustor, and two drifting gauges; riveted nameplate message panels; a turbine-hall hum with spool-up and spool-down cues. Light and dark mode. Unofficial, and not affiliated with any manufacturer. |

## Install

In a terminal:

```
claude plugin marketplace add aronshub23/claude-themes
claude plugin install theme-switcher@claude-themes
```

Or at the prompt of a Claude Code terminal session: `/plugin install theme-switcher --marketplace aronshub23/claude-themes`.

Choose the user scope, then restart the Claude desktop app and open a local session in its Code tab. The desktop app can install a plugin from a marketplace once one is added, but it can't add the marketplace itself, so the first command needs a terminal.

## Use

| Type | To |
| --- | --- |
| `/look` | list the looks, the current one marked |
| `/look turbine` | switch (any start of a name works) |
| `/look next` | go to the next look |
| `/look off` | go back to the app's own look |

The looks draw in the Claude desktop and mobile apps, not in a plain terminal. Sound is off until you press the speaker in the session's title bar. If you also have the single-theme plugins `neon-circuit` or `turbine-hall` from this marketplace on, turn them off: whichever starts last wins.

## Adding a look

Write a module in `hooks/looks/` that exports a `LOOK` (see `look.ts` and the two there), then list it in `hooks/looks/index.ts`.
