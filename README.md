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
- Vitest + @testing-library/react (optional for tests)

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
npm create vite@latest countdown-timer-ts -- --template react-ts
cd countdown-timer-ts
npm i
# drop the provided src/ files into place (replace scaffolded ones)
npm run dev
```

Open `http://localhost:5173` and select a future local date/time.

## Testing

You can run tests using Vitest:

```bash
npm run test
```

## Linting & Formatting

To lint and format your code, run:

```bash
npm run lint
npm run format
```

## Notes

- The `<input type="datetime-local">` interprets values in the user’s local timezone.
- The ticker is aligned to the next whole second for stable updates.
