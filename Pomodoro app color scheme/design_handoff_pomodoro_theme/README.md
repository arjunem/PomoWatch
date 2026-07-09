# Handoff: Pomodoro App — Theme Selector (3 color schemes × light/dark)

## Overview
The user has an existing, fully-functional Pomodoro app. This handoff adds a **theme selector**: 3 color schemes (Indigo Slate, Deep Teal, Warm Clay), each with a light and dark mode — 6 total combinations. Goal: wire up theming **without touching any existing functionality** (timer logic, session history, noise player, progress tracking all stay exactly as they are).

## About the Design Files
`Pomodoro Color Schemes Reference.html` in this folder is a **design reference** — a static HTML mockup showing how each theme/mode combination should look. It is NOT production code to copy in verbatim. Recreate the visual treatment using the existing app's real components (React/Vue/whatever the app already uses) and its real data — only the colors change.

## Fidelity
**High-fidelity.** Exact hex values are given below and in `tokens.css`. Match them precisely.

## The approach: CSS custom properties, not new markup
Every themeable color in the UI should resolve to a CSS custom property (see `tokens.css`). Each theme × mode combination is a selector block keyed on two data attributes on a root element (`<html>` or a top-level app wrapper):

```html
<html data-theme="indigo-slate" data-mode="dark">
```

Changing those two attributes (e.g. from a theme-selector dropdown + a light/dark toggle) re-themes the whole app instantly — no component code needs to branch on theme.

### Implementation steps for Claude Code
1. Import `tokens.css` once, globally (root layout / `index.css` / `_app`).
2. Go through the existing stylesheet(s)/styled-components/CSS-in-JS and replace hardcoded color values with the matching `var(--color-*)` token below. Do not change any layout, spacing, sizing, font, or component structure — only swap color values.
3. Add a small theme-selector control (e.g. in a settings/header area) with:
   - A select or segmented control for the 3 scheme names: Indigo Slate / Deep Teal / Warm Clay
   - A toggle for Light / Dark
   - Persist the choice (localStorage is fine) and set the two data attributes on mount and on change.
4. Default to whichever theme/mode the app currently ships with (pick one, e.g. `indigo-slate` / `light`) so behavior is unchanged for existing users until they pick a new one.

## Design Tokens
Full values are in `tokens.css`. Semantic roles, used consistently across all 3 schemes:

- `--color-bg-page` — outer page/app background
- `--color-bg-card` — card/panel surface (timer card, session history card, progress card)
- `--color-border` — card and input borders
- `--color-text-primary` — headings, timer digits, primary labels
- `--color-text-secondary` — secondary labels ("Work Time", timestamps)
- `--color-accent` — the single theme accent: timer ring, primary button fill, active slider track/thumb, links ("Hide"), stat numbers
- `--color-accent-contrast` — text color used on top of an accent-filled surface
- `--color-neutral-strong` — the secondary "strong" button fill (Pause Noise, Reset) — intentionally NOT the accent color, to keep only one accent per screen
- `--color-neutral-strong-contrast` — text on top of that neutral-strong fill
- `--color-track-bg` — the unfilled portion of sliders
- `--color-danger` / `--color-danger-bg` — kept constant across all 3 schemes (semantic: "Cancelled" badge text/background, delete icon, "Clear All"). Do not theme these — they signal meaning, not brand.
- `--color-muted-icon` — the volume ± icons, seek icon
- `--color-disabled-text` / `--color-disabled-bg` — the disabled "Stop" button
- `--color-stat-tile-bg` — the 4 tile backgrounds in Today's Progress

## Components & where each token applies
- **Timer card**: ring border = accent; "00:00" = text-primary; "Work Time" = text-secondary; card bg = bg-card; card border = border.
- **Start Work** button: filled accent bg, accent-contrast text.
- **Start Break** button: outlined accent (1.5px border, accent text, transparent/card bg).
- **Noise row** (Lo-fi select, YouTube URL input, Pause Noise button): inputs use bg-card/bg-card-dark equivalent + border; Pause Noise button uses neutral-strong fill.
- **Volume slider**: track = track-bg, filled portion + thumb = accent, ± icons = muted-icon. The ± icons must stay horizontally aligned with the seek-bar time labels below (both are fixed 34px-wide flex items) — don't reintroduce misalignment.
- **Seek bar**: only rendered when the noise-source select is set to "Lo-fi" (existing behavior — preserve as-is); track = track-bg, filled = accent, time labels = disabled-text-ish secondary tone (see reference file for exact shade per theme, same as disabled-text).
- **Stop button**: disabled-bg fill, disabled-text text, border = border. **Reset button**: neutral-strong fill, neutral-strong-contrast text.
- **Session History card**: title = text-primary, "Clear All" = danger, "Hide" = accent. Each session row border = border; "Cancelled" badge = danger text on danger-bg; delete icon = danger; timestamps = muted-icon.
- **Today's Progress card**: tile bg = stat-tile-bg; big numbers = accent; tile labels = muted-icon/disabled-text tone (see reference for exact per-theme value).

## Interactions & Behavior (unchanged — do not modify)
- Timer, Start Work / Start Break, noise player, volume slider, seek bar, Stop/Reset, session history list + Clear All + delete-per-row, Today's Progress counters — all existing logic stays exactly as-is.
- The only new interactive behavior is the theme/mode selector itself.

## Files
- `tokens.css` — all 6 token sets (3 schemes × light/dark), ready to import as-is or translate into your existing token system.
- `Pomodoro Color Schemes Reference.html` — visual reference, open in a browser; click "Show dark"/"Show light" on each of the 3 options to see all 6 states.
- `screenshots/` — one PNG per theme/mode combination (timer card shown; scroll the reference HTML for Session History and Today's Progress in the same colors):
  - `indigo-slate-light.png`, `indigo-slate-dark.png`
  - `deep-teal-light.png`, `deep-teal-dark.png`
  - `warm-clay-light.png`, `warm-clay-dark.png`
