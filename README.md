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

## Docker

The Compose service pulls the production image from
`ghcr.io/rgoshen/countdown-timer-ts`. Pushes to `main` publish both `latest`
and an immutable `sha-<commit>` tag for `linux/amd64` and `linux/arm64`.

### First publication

The package does not exist until `.github/workflows/publish-container.yml` runs
successfully on `main`. GHCR creates the first package as private. After that
workflow completes, open the package settings on GitHub and change the package
visibility from private to public. This one-time setting enables anonymous
Compose pulls.

### Run locally

Start the latest published image in the background, wait for its health check,
and open [http://localhost:8080](http://localhost:8080):

```bash
docker compose up -d --wait
```

Compose uses `pull_policy: always`, so every start checks GHCR for a newer
`latest` image. To run an immutable version instead, provide its published
commit tag:

```bash
IMAGE_TAG=sha-abcdef0 docker compose up -d --wait
```

Inspect logs, verify the response, or stop the application:

```bash
docker compose logs --follow app
curl --fail http://localhost:8080
docker compose down
```

## Scripts

- `npm run ci` → lint + typecheck + tests + build
- `npm run test:container-config` → Compose and GHCR workflow contract

## Releases

Releases are automatic. Merging to `main` runs `semantic-release`, which reads
the Conventional Commit messages since the previous tag and, when at least one
of them qualifies, creates a git tag, publishes a GitHub Release, updates
`CHANGELOG.md`, and bumps the `package.json` version.

| Commit type                           | Release                             |
| ------------------------------------- | ----------------------------------- |
| `feat:`                               | minor                               |
| `fix:`                                | patch                               |
| `perf:`                               | patch                               |
| `BREAKING CHANGE:` footer             | major                               |
| `docs:`, `refactor:`, `build:`, `ci:` | none, but listed in the changelog   |
| `style:`, `test:`, `chore:`           | none, and hidden from the changelog |

Commit messages are validated by a `commit-msg` hook, so an invalid message is
rejected before it is recorded. Run `npm install` once after cloning to
activate the hook.

To preview what the next release would be without changing anything:

```bash
GITHUB_TOKEN=$(gh auth token) npx semantic-release --dry-run
```

Run that from `main`. On any other branch it reports that semantic-release is
configured to publish only from `main` and computes no version — which is the
branch restriction working, not an error.

`CHANGELOG.md` is generated. Do not edit it by hand; the next release
overwrites hand-written changes.

Deployment is independent of releasing. GitHub Pages and the GHCR image publish
on every push to `main`, whether or not that push produces a release.
