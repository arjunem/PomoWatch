/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        page: 'var(--color-bg-page)',
        card: 'var(--color-bg-card)',
        line: 'var(--color-border)',
        ink: 'var(--color-text-primary)',
        'ink-soft': 'var(--color-text-secondary)',
        accent: 'var(--color-accent)',
        'accent-ink': 'var(--color-accent-contrast)',
        strong: 'var(--color-neutral-strong)',
        'strong-ink': 'var(--color-neutral-strong-contrast)',
        track: 'var(--color-track-bg)',
        danger: 'var(--color-danger)',
        'danger-bg': 'var(--color-danger-bg)',
        muted: 'var(--color-muted-icon)',
        disabled: 'var(--color-disabled-text)',
        'disabled-bg': 'var(--color-disabled-bg)',
        tile: 'var(--color-stat-tile-bg)',
      },
    },
  },
  plugins: [],
}

