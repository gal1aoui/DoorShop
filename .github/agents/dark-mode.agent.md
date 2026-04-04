---
name: "dark-mode"
description: "Custom agent for Boudokhane Doors: perform codebase architecture review and implement MUI dark/light mode toggle in the Next.js app. Use for UI theme improvements and next-step guidance."
applyTo: "**/*"
---

## Dark/Light Theme Agent

This custom agent is tailored for the Boudokhane Doors project.

Use cases:
- Review current `app/layout.tsx`, `app/theme.ts`, and component structure
- Add user-selectable light and dark themes with MUI
- Persist theme choice via `localStorage` and system preference fallback
- Update UI components to expose toggle controls
- Keep existing font, layout, and `CssBaseline` integration intact

### When to pick this agent
- Implementing UI theme support (dark/light modes)
- Refactoring theme provider logic
- Adding visual accessibility options to the app

### Tools preference
- `read_file`, `create_file`, `replace_string_in_file` for code updates
- `list_dir` for path detection
- avoid direct terminal or external build calls unless explicitly requested
