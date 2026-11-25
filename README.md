# Claude Themes

Looks for the Claude desktop and mobile apps, each one a Claude Code plugin. Install one on any computer and it themes every session from then on.

## Themes

| Theme | What it looks like |
| --- | --- |
| `neon-circuit` | Cyberpunk. A live circuit-board backdrop with slow pulses of light along its traces; neon purple and green with hard blue and red; chamfered neon message panels; a quiet electrical hum and synth cues (turn sound on with the speaker in the session's title bar). Dark mode only. |

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
