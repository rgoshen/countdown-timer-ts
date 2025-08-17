# Countdown Timer (TypeScript + React)

A modular, TypeScript React app that validates a future date/time and shows a precise, animated countdown to the second.

## Features
- Future-only validation (blocks past dates)
- Weeks · Days · Hours · Minutes · Seconds
- Smooth flip/fade animation on value change
- Accessible: `aria-live` announcements, clear error messages
- DRY utilities and SOLID-oriented modular design (hooks, lib, components, types)
- Theme: System/Light/Dark with persistence
- Time format: 24h/12h **inline toggle inside the picker** with persistence
- Persists selected target datetime

## Getting Started
```bash
npm i
npm run dev
```
http://localhost:5173

## Persistence
- `countdown-target` — selected datetime
- `theme-mode` — System/Light/Dark
- `time-format` — 24h or 12h

## Testing
```bash
npm test
npm run coverage
```
