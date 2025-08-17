# Countdown Timer (TypeScript + React)

A modular, TypeScript React app that validates a future date/time and shows a precise, animated countdown to the second.

## Features
- Future-only validation (blocks past dates)
- Weeks · Days · Hours · Minutes · Seconds
- Smooth flip/fade animation on value change
- Accessible: `aria-live` announcements, clear error messages
- DRY utilities and SOLID-oriented modular design (hooks, lib, components, types)

## Tech
- React + TypeScript (Vite)
- ESLint + Prettier (recommended)
- Vitest + @testing-library/react (unit + component tests)

## Architecture
- `components/` — pure UI: `CountdownDisplay`, `CountdownUnit`
- `hooks/` — logic hooks:
  - `useTicker` (S)ingle responsibility: emits aligned 1s ticks
  - `useCountdown` derives countdown state from target + time
  - `usePrevious` re-triggers animations on value change
- `lib/` — pure functions: time math, formatting, validation
- `types/` — domain types (`TimeLeft`)
- `App.tsx` — composition & minimal state (targetValue, error)

### SOLID & DRY in practice
- **S**RP: Each hook/component has one purpose.
- **O**CP: Time utilities are extendable without modifying callers.
- **L**SP: Components accept stable, substitutable props.
- **I**SP: Small focused interfaces/types.
- **D**IP: UI depends on abstractions (`lib/time`) not concrete date math.
- **DRY**: Shared logic (formatting, math, validation) centralized in `lib/`.

## Getting Started
```bash
npm i
npm run dev
```
> If starting from an empty folder, run `npm create vite@latest . -- --template react-ts` first, then copy these files.

Open http://localhost:5173 and select a **future** local date/time.

## Testing
```bash
npm test           # run tests once
npm run coverage   # coverage report
npm run test:watch # watch mode
```

## Lint/Format
```bash
npm run lint
npm run format
```

## Notes
- `<input type="datetime-local">` interprets values in the user’s local timezone.
- The ticker aligns to the next whole second for stable updates.

## License
MIT


## Theme toggle
Use the selector at the top to switch **System / Light / Dark**. Your choice is saved to `localStorage` and, when set to **System**, the UI follows your OS preference dynamically.
