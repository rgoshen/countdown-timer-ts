# GHCR-backed Docker Compose Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a multi-platform GHCR image from `main` and make `docker compose up` always pull that image for local use.

**Architecture:** A pinned GitHub Actions workflow owns multi-platform image publication and provenance. Compose owns only remote-image selection, pull behavior, host port publication, and health; a built-in Node test validates both configuration contracts before publication.

**Tech Stack:** Docker Engine, Docker Compose, Docker Buildx, GitHub Actions, GHCR, Node.js 20, nginx, Node test runner

## Global Constraints

- Work only on `feature/docker-compose-local` in the primary repository checkout; do not create a linked worktree or another feature branch.
- Publish exactly `ghcr.io/rgoshen/countdown-timer-ts:latest` and `sha-<commit>` from `main`.
- Support exactly `linux/amd64` and `linux/arm64`.
- Compose must use `pull_policy: always`, publish `8080:80`, and contain no `build` key.
- Use `GITHUB_TOKEN`; add no PAT, registry password, or repository secret.
- Pin every GitHub Action to an exact commit SHA.
- Preserve the existing Dockerfile and nginx runtime behavior.
- Update `SUMMARY.md` immediately before every commit.

---

### Task 1: Restore Clean Baseline Lint

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `SUMMARY.md`
- Test: `eslint.config.js`

**Interfaces:**
- Consumes: the imports already present in `eslint.config.js`.
- Produces: exact direct development dependencies compatible with ESLint 9.33 and TypeScript 5.

- [ ] **Step 1: Verify the clean-install lint failure**

Run:

```bash
npm ci
npm run lint
```

Expected: FAIL because `globals`, `eslint-plugin-react-refresh`, and
`typescript-eslint` are unavailable after a clean install.

- [ ] **Step 2: Add exact compatible dependencies**

Run:

```bash
npm install --save-dev --save-exact @eslint/js@9.33.0 globals@16.3.0 eslint-plugin-react-refresh@0.4.20 typescript-eslint@8.39.0
```

- [ ] **Step 3: Verify the baseline**

Run:

```bash
npm run ci
```

Expected: lint, type checking, tests, and build all pass.

- [ ] **Step 4: Summarize and commit**

Prepend a Fix entry to `SUMMARY.md` describing the missing direct flat-config
dependencies, then run:

```bash
git diff --check
git add package.json package-lock.json SUMMARY.md
git commit -m "fix: declare ESLint flat-config dependencies"
```

### Task 2: GHCR Publication and Compose Pull Contract

**Files:**
- Create: `scripts/container-config.test.mjs`
- Create: `.github/workflows/publish-container.yml`
- Create: `compose.yaml`
- Create: `.dockerignore`
- Modify: `package.json`
- Modify: `SUMMARY.md`
- Test: `scripts/container-config.test.mjs`

**Interfaces:**
- Consumes: the existing Dockerfile, nginx configuration, and GitHub repository identity.
- Produces: `npm run test:container-config`, GHCR `latest` and commit tags, and Compose service `app`.

- [ ] **Step 1: Write the failing configuration contract**

Create `scripts/container-config.test.mjs`:

```js
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const image = 'ghcr.io/rgoshen/countdown-timer-ts:latest'

test('Compose always pulls the GHCR image', () => {
  const rendered = execFileSync(
    'docker',
    ['compose', 'config', '--format', 'json'],
    {
      encoding: 'utf8',
      env: { ...process.env, IMAGE_TAG: '' },
    },
  )
  const service = JSON.parse(rendered).services.app

  assert.equal(service.image, image)
  assert.equal(service.pull_policy, 'always')
  assert.equal(service.build, undefined)
  assert.equal(service.ports[0].published, '8080')
  assert.equal(service.ports[0].target, 80)
  assert.deepEqual(service.healthcheck.test, [
    'CMD',
    'wget',
    '-q',
    '-O',
    '/dev/null',
    'http://127.0.0.1/',
  ])
})

test('GitHub Actions publishes a pinned multi-platform image', () => {
  const workflow = readFileSync(
    '.github/workflows/publish-container.yml',
    'utf8',
  )
  const required = [
    'main',
    'packages: write',
    'id-token: write',
    'linux/amd64,linux/arm64',
    'type=raw,value=latest',
    'type=sha,prefix=sha-',
    'push-to-registry: true',
    'actions/checkout@11d5960a326750d5838078e36cf38b85af677262',
    'actions/attest@36051bcae73b7c2a8a6945a48cbf80953c6baa35',
    'docker/login-action@c94ce9fb468520275223c153574b00df6fe4bcc9',
    'docker/metadata-action@c299e40c65443455700f0fdfc63efafe5b349051',
    'docker/setup-qemu-action@c7c53464625b32c7a7e944ae62b3e17d2b600130',
    'docker/setup-buildx-action@8d2750c68a42422c14e847fe6c8ac0403b4cbd6f',
    'docker/build-push-action@10e90e3645eae34f1e60eeb005ba3a3d33f178e8',
  ]

  for (const value of required) {
    assert.match(workflow, new RegExp(value.replaceAll('/', '\\/')))
  }
  assert.doesNotMatch(workflow, /uses:\s+\S+@v\d+/)
})
```

Add to `package.json`:

```json
"test:container-config": "node --test scripts/container-config.test.mjs",
```

- [ ] **Step 2: Verify red**

Run:

```bash
npm run test:container-config
```

Expected: two failing tests because `compose.yaml` and the publication workflow
do not exist.

- [ ] **Step 3: Add Compose and build-context configuration**

Create `compose.yaml`:

```yaml
services:
  app:
    image: ghcr.io/rgoshen/countdown-timer-ts:${IMAGE_TAG:-latest}
    pull_policy: always
    ports:
      - "8080:80"
    healthcheck:
      test: ["CMD", "wget", "-q", "-O", "/dev/null", "http://127.0.0.1/"]
      interval: 5s
      timeout: 3s
      retries: 5
      start_period: 5s
```

Create `.dockerignore`:

```dockerignore
.git
.github
.idea
.vscode
node_modules
dist
coverage
docs
scripts
*.log
.env
.env.*
!.env.example
.DS_Store
*.code-workspace
SUMMARY.md
TODO.md
```

- [ ] **Step 4: Add the publication workflow**

Create `.github/workflows/publish-container.yml`:

```yaml
name: Publish container image

on:
  push:
    branches: ['main']
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  publish:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
      attestations: write
      id-token: write
    steps:
      - name: Check out repository
        uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262
      - name: Set up QEMU
        uses: docker/setup-qemu-action@c7c53464625b32c7a7e944ae62b3e17d2b600130
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@8d2750c68a42422c14e847fe6c8ac0403b4cbd6f
      - name: Log in to GHCR
        uses: docker/login-action@c94ce9fb468520275223c153574b00df6fe4bcc9
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Extract image metadata
        id: meta
        uses: docker/metadata-action@c299e40c65443455700f0fdfc63efafe5b349051
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=raw,value=latest
            type=sha,prefix=sha-
      - name: Build and push image
        id: push
        uses: docker/build-push-action@10e90e3645eae34f1e60eeb005ba3a3d33f178e8
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
      - name: Attest image provenance
        uses: actions/attest@36051bcae73b7c2a8a6945a48cbf80953c6baa35
        with:
          subject-name: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          subject-digest: ${{ steps.push.outputs.digest }}
          push-to-registry: true
```

- [ ] **Step 5: Verify green and build the image**

Run:

```bash
npm run test:container-config
npx prettier --check compose.yaml .github/workflows/publish-container.yml
docker build --tag countdown-timer-ts:local .
```

Expected: the contract passes, both YAML files parse and are formatted, and the
production image builds.

- [ ] **Step 6: Summarize and commit**

Prepend a Feature entry to `SUMMARY.md`, then run:

```bash
git diff --check
git add scripts/container-config.test.mjs .github/workflows/publish-container.yml compose.yaml .dockerignore package.json SUMMARY.md
git commit -m "feat: publish and pull GHCR container image"
```

### Task 3: Usage Documentation and Final Verification

**Files:**
- Modify: `README.md`
- Modify: `SUMMARY.md`
- Test: `README.md`

**Interfaces:**
- Consumes: the GHCR tags and Compose commands from Task 2.
- Produces: startup, rollback, diagnostic, shutdown, and first-publication instructions.

- [ ] **Step 1: Verify the documentation contract is red**

Run:

```bash
rg -n 'docker compose up -d|localhost:8080|IMAGE_TAG=sha-|package visibility|docker compose down' README.md
```

Expected: FAIL because the GHCR-backed Compose workflow is not documented.

- [ ] **Step 2: Add exact Docker usage documentation**

Insert after `Getting Started`:

````markdown
## Docker

Pushes to `main` publish multi-platform images to
`ghcr.io/rgoshen/countdown-timer-ts` with `latest` and immutable `sha-<commit>`
tags.

After the first successful publication, open the package settings on GitHub and
change the package visibility from private to public. This one-time step allows
anonymous pulls.

Start the latest published image and open
[http://localhost:8080](http://localhost:8080):

```bash
docker compose up -d
```

Compose always checks GHCR for a newer `latest` image. To run an immutable
version instead, set its published commit tag:

```bash
IMAGE_TAG=sha-abcdef0 docker compose up -d
```

Inspect logs or stop the application:

```bash
docker compose logs --follow app
docker compose down
```
````

- [ ] **Step 3: Verify the documentation contract is green**

Run:

```bash
rg -n 'docker compose up -d|localhost:8080|IMAGE_TAG=sha-|package visibility|docker compose down' README.md
```

Expected: every required workflow term is present.

- [ ] **Step 4: Run final local verification**

Run:

```bash
npm run ci
npm run test:container-config
npx prettier --check compose.yaml .github/workflows/publish-container.yml README.md
docker image inspect countdown-timer-ts:local
git diff --check
```

- [ ] **Step 5: Summarize and commit**

Prepend a Docs entry to `SUMMARY.md`, then run:

```bash
git add README.md SUMMARY.md
git commit -m "docs: document GHCR Compose workflow"
git status --short --branch
```

### Task 4: Post-merge Publication Acceptance

After peer review and merge to `main`:

1. Confirm the `Publish container image` workflow succeeds.
2. Change the new GHCR package visibility to public.
3. Run `docker compose pull`.
4. Run `docker compose up --detach --wait`.
5. Verify `curl --fail http://localhost:8080`.
6. Run `docker compose down`.
