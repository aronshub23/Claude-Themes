# Claude Themes

Animated looks for Claude's desktop and mobile apps, each one a Claude Code plugin. Install one on any computer and it themes every session from then on.

**Easiest:** install `theme-switcher`, a look studio: design your own theme with Claude's help (`/look new`), preview it live, save and share it, and switch between it and the built-in looks with `/look`. See [theme-switcher/README.md](theme-switcher/README.md).

```
claude plugin marketplace add aronshub23/claude-themes
claude plugin install theme-switcher@claude-themes
```

The single-theme plugins below are still here for anyone who wants just one; don't turn one on beside `theme-switcher`.

## Themes

| Theme | What it looks like |
| --- | --- |
| `neon-circuit` | Cyberpunk. A live circuit-board backdrop with slow pulses of light along its traces; neon purple and green with hard blue and red; chamfered neon message panels; a quiet electrical hum and synth cues (turn sound on with the speaker in the session's title bar). Dark mode only. |
| `turbine-hall` | Industrial, in a red, white and charcoal palette inspired by Mitsubishi Power and aeroderivative power turbines such as the FT8. A compressor rotor and a red-hot turbine stage turn on a drafting grid, the turbine shedding embers; a blueprint cutaway of the engine has air streaming through it, a flickering combustor and heat shimmer over the exhaust; two gauges drift as if the engine were running. Near-white steel by day, charcoal by night; riveted nameplate message panels with a red stripe; a turbine-hall hum with spool-up and spool-down cues. Light and dark mode. Unofficial, and not affiliated with any manufacturer: it uses no logo, name or lettering of theirs. |

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install neon-circuit --marketplace aronshub23/claude-themes
```

From a shell:

```
claude plugin install neon-circuit --marketplace aronshub23/claude-themes
```

In the desktop app, where `/plugin` does not run: click **+** next to the prompt box, then **Plugins**, **Add marketplace** with `aronshub23/claude-themes`, then **Add plugin**.

Answer `y` to add the marketplace, then pick a scope (user scope applies the theme everywhere). Swap `neon-circuit` for any other theme's name above.

If this repository is private, the computer you install on needs a GitHub credential for git first: `gh auth login`, then `gh auth setup-git`.

## Adding a theme

Put the theme's plugin folder at the top of this repository and add an entry for it to `.claude-plugin/marketplace.json`.
