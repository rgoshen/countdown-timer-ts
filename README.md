# Countdown Timer (TypeScript + React)

A modular, TypeScript React app that validates a future date/time and shows a precise, animated countdown to the second.

[Demo](https://rgoshen.github.io/countdown-timer-ts/)

## Features
- Future-only validation (blocks past dates)
- Weeks · Days · Hours · Minutes · Seconds
- Smooth animation on value change
- Accessible: `aria-live` announcements, clear error messages
- DRY utils & SOLID-ish modular structure (hooks/lib/components)
- Theme: System/Light/Dark with persistence
- Time format: 24h/12h toggle **inside** the picker, persistence to localStorage
- Persists selected target datetime

## GitHub Pages
- `vite.config.ts` auto-sets `base` to `/countdown-timer-ts/` on CI (Pages), `/` locally
- `.github/workflows/pages.yml` publishes prod on `main` and previews on PRs
- SPA fallback is enabled by copying `index.html` → `404.html` in CI

## Getting Started
```bash
npm ci
npm run dev
# local prod check
npm run build && npm run preview
```

## Scripts
- `npm run ci` → lint + typecheck + tests + build
