// The look being previewed, as its JSON, or '' when none: kept for the
// session, so a reload of the plugin mid-design keeps the preview on and a
// new session starts on the saved look.
export type PreviewJson = string

declare module 'claude-code' {
  interface PluginState {
    'theme-switcher': { preview: PreviewJson }
  }
}
