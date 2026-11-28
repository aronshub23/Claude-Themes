# Look Studio: design your own Claude looks

Design your own animated theme for Claude's desktop and mobile apps, with Claude as your designer. Describe a mood, a place or an era; Claude proposes colors, an animated backdrop, message styles and sound, puts it on live so you can see it, and refines it with you until you save it. Switch between your looks and the built-in ones with `/look`, and share yours as a snippet anyone with the plugin can import.

## Install

Formerly `theme-switcher`. If you have that installed, first run `/look export <name>` for each look you made and keep the JSON, then uninstall it (`claude plugin uninstall theme-switcher`), install look-studio below, and paste each JSON to Claude to save it again: the two plugins don't share storage.


In a terminal (the desktop app can't add a marketplace itself):

```
claude plugin marketplace add aronshub23/claude-themes
claude plugin install look-studio@claude-themes
```

Choose the user scope, restart the Claude desktop app, and open a local session in its Code tab.

## Make a look

```
/look new a rainy neon alley in Tokyo at night
```

Or just ask Claude: "make me a new look". Claude walks you through it:

1. **The idea**: a feel, a place, an era, a material. Light, dark or both.
2. **Colors**: a palette from the idea, checked for readable contrast.
3. **Backdrop**: an animated scene drawn as vector art (drifting, flowing, turning, glowing), or a still ground; calm or lively.
4. **Messages**: bubble shapes, fonts and a signature detail (a stripe, rivets, tape, a glow).
5. **Sound**: none, or a quiet ambience and cues.
6. **Preview**: it goes on live; you look, say what to change, and it updates.
7. **Save**: it's yours, in every session from then on. (A preview stays on if the plugin reloads mid-design, but a new session opens on your saved look until you save.)

Every look is checked before it goes on: contrast that would stop the app painting it, scene content the app refuses, a style or sound out of range. Claude fixes what the check finds before showing you.

## Switch and share

| Type | To |
| --- | --- |
| `/look` | list the built-in looks and yours, the current one marked |
| `/look <name>` | switch (any start of a name works: `/look neon`) |
| `/look next` | go to the next look |
| `/look off` | go back to the app's own look |
| `/look new [idea]` | design a new look with Claude |
| `/look export <name>` | get your look as JSON to share |
| `/look delete <name>` | delete one of your looks |

To share, send the JSON from `/look export`. Your friend, with look-studio installed, pastes it to Claude and asks to save the look. To change a look, ask Claude to edit it ("make Midnight Garden warmer").

## Built-in looks

| Look | What it is |
| --- | --- |
| `neon-circuit` | Cyberpunk. A live circuit board with light pulsing along its traces; neon purple and green with hard blue and red; chamfered neon message panels; an electrical hum with synth cues. Dark mode. |
| `turbine-hall` | Industrial, in red, white and charcoal. Compressor and turbine rotors turning on a drafting grid, embers rising off the hot stage, a blueprint cutaway with air streaming through it and a flickering combustor, and two drifting gauges; riveted nameplate message panels; a turbine-hall hum with spool-up and spool-down cues. Light and dark mode. Unofficial, and not affiliated with any manufacturer. |

## Good to know

- Looks draw in the Claude **desktop and mobile apps**, not in a plain terminal.
- Sound is off until you press the speaker in the session's title bar.
- Your looks live in the plugin's own storage on each computer, about 3.5 MB in all (dozens of looks). Export the ones you want on another computer and import them there.
- If you also have the single-theme plugins `neon-circuit` or `turbine-hall` from this marketplace on, turn them off: whichever starts last wins.

## How it works

The plugin is a Claude Code hooks module and a skill:

- `/look` and the theme itself: `hooks/register.tsx`.
- Five tools Claude calls: `look_preview` (check and put on without saving), `look_save`, `look_get`, `look_list` and `look_use` (switch, so you can just ask Claude to change looks).
- `skills/create-look/SKILL.md`: the guided flow, and the design rules Claude follows (palette anchors and contrast, scene rules such as no flashing and quiet middle, message style ranges, sound ranges).
- `hooks/studio.ts`: a look's JSON format and the checks it passes.
- Built-in looks are code in `hooks/looks/`; to add one to the plugin, write a module there and list it in `hooks/looks/index.ts`.
