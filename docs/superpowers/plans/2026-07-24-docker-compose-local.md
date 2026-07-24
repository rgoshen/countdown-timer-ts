# Local Docker Compose Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and run the production countdown timer locally at `http://localhost:8080` with `docker compose up --build`.

**Architecture:** Compose will orchestrate the existing multi-stage Dockerfile as one `app` service, publishing host port 8080 to nginx port 80. An executable integration contract will resolve the Compose configuration, build the image, wait for container health, verify the published application shell, and clean up all test resources.

**Tech Stack:** Docker Engine, Docker Compose, Node.js 20 Alpine, nginx 1.27 Alpine, npm, POSIX shell, curl

## Global Constraints

- Use the existing root `Dockerfile` and `nginx.conf`; do not create a second image definition.
- Serve an immutable Vite production bundle without source mounts or hot reload.
- Publish the app at exactly `http://localhost:8080`.
- Keep existing npm development, test, and build workflows unchanged.
- Add no dependencies, credentials, TLS, external services, deployment automation, or UI changes.
- Preserve the existing nginx SPA fallback, cache behavior, and security headers.
- Use the `feature/docker-compose-local` branch and Conventional Commits.
- Update `SUMMARY.md` immediately before every commit.

---

## File Structure

- Create `compose.yaml`: define the single production-like application service and its health check.
- Create `.dockerignore`: keep local metadata, secrets, dependencies, and generated output out of the Docker build context.
- Create `scripts/test-docker-compose.sh`: own the repeatable end-to-end Docker Compose contract and cleanup.
- Modify `package.json`: expose the integration contract as `npm run test:docker`.
- Modify `README.md`: document the local Docker workflow.
- Modify `SUMMARY.md`: record the rationale for each atomic implementation commit.

### Task 1: Executable Docker Compose Runtime

**Files:**
- Create: `scripts/test-docker-compose.sh`
- Create: `compose.yaml`
- Create: `.dockerignore`
- Modify: `package.json`
- Modify: `SUMMARY.md`
- Test: `scripts/test-docker-compose.sh`

**Interfaces:**
- Consumes: the existing root `Dockerfile`, `nginx.conf`, npm lockfile, and HTML title `<title>Countdown Timer (TS + React)</title>`.
- Produces: Compose service `app`, host endpoint `http://127.0.0.1:8080`, health status from the container root page, and npm script `test:docker`.

- [ ] **Step 1: Write the failing Compose integration contract**

Create `scripts/test-docker-compose.sh`:

```sh
#!/bin/sh
set -eu

cleanup() {
  docker compose down --remove-orphans >/dev/null 2>&1 || true
}

trap cleanup EXIT HUP INT TERM

docker compose config --quiet
docker compose build
docker compose up --detach --wait

response=$(curl --fail --silent --show-error http://127.0.0.1:8080/)
printf '%s' "$response" |
  grep --quiet '<title>Countdown Timer (TS + React)</title>'
```

Make it executable:

```bash
chmod +x scripts/test-docker-compose.sh
```

Add the npm script to `package.json` immediately after `test:run`:

```json
"test:docker": "sh scripts/test-docker-compose.sh",
```

- [ ] **Step 2: Run the contract and verify the expected red state**

Run:

```bash
npm run test:docker
```

Expected: FAIL during `docker compose config --quiet` because no Compose
configuration file exists. The failure must occur before any image build or
container startup.

- [ ] **Step 3: Add the minimum Compose implementation**

Create `compose.yaml`:

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
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

- [ ] **Step 4: Run the Compose contract and verify the green state**

Run:

```bash
npm run test:docker
```

Expected: PASS. Compose resolves the configuration, builds the production
image, reports the service healthy, the host request finds the countdown timer
HTML title, and the exit trap removes the test container and network.

- [ ] **Step 5: Run the existing application verification**

Run:

```bash
npm run ci
```

Expected: PASS for lint, TypeScript checking, unit/component tests, and the
production Vite build.

- [ ] **Step 6: Record the implementation commit**

Prepend a `SUMMARY.md` entry with:

- Change Type: Feature
- Scope: Docker Compose local runtime
- Summary: add a single-service Compose runtime, filtered build context, and repeatable integration contract.
- Rationale: reuse the existing production image path and test the externally observable HTTP workflow.
- Bug Fix Context: Not applicable.
- Reference: `TODO.md: 2026-07-24 Local Docker Compose Runtime`.

Run:

```bash
git diff --check
git status --short
git add compose.yaml .dockerignore scripts/test-docker-compose.sh package.json SUMMARY.md
git commit -m "feat: add local Docker Compose runtime"
```

Expected: the commit contains only the runtime configuration, executable
contract, npm entry point, and its summary.

### Task 2: Docker Developer Documentation

**Files:**
- Modify: `README.md`
- Modify: `SUMMARY.md`
- Test: `README.md`

**Interfaces:**
- Consumes: Compose service `app`, host endpoint `http://localhost:8080`, and npm script `test:docker` from Task 1.
- Produces: copy-pasteable start, detached start, rebuild, log, verification, and shutdown instructions.

- [ ] **Step 1: Verify the documentation acceptance check is red**

Run:

```bash
rg -n 'docker compose up --build|http://localhost:8080|docker compose logs --follow app|docker compose down|npm run test:docker' README.md
```

Expected: FAIL with exit status 1 because none of the Docker Compose workflow is
documented.

- [ ] **Step 2: Add the Docker workflow to the README**

Insert this section after `Getting Started` and before `Scripts`:

````markdown
## Docker

Build and start the production-like nginx container:

```bash
docker compose up --build
```

Open [http://localhost:8080](http://localhost:8080). Source changes require an
image rebuild; run the same command again after stopping the service.

To run in the background, inspect logs, verify the full Docker workflow, or
stop the service:

```bash
docker compose up --build --detach
docker compose logs --follow app
npm run test:docker
docker compose down
```
````

- [ ] **Step 3: Verify the documentation acceptance check is green**

Run:

```bash
rg -n 'docker compose up --build|http://localhost:8080|docker compose logs --follow app|docker compose down|npm run test:docker' README.md
```

Expected: PASS with matches for the start command, local URL, log command,
integration test, and shutdown command.

- [ ] **Step 4: Run final verification from a clean Compose state**

Run:

```bash
npm run ci
npm run test:docker
git diff --check
git status --short --branch
```

Expected: both npm verification commands pass, the diff has no whitespace
errors, the Compose test removes its resources, and only the documentation
commit files remain uncommitted.

- [ ] **Step 5: Record and commit the documentation**

Prepend a `SUMMARY.md` entry with:

- Change Type: Docs
- Scope: Docker Compose local runtime
- Summary: document production-like container startup, rebuild, logs, verification, and shutdown.
- Rationale: provide one copy-pasteable local workflow aligned with the tested Compose service.
- Bug Fix Context: Not applicable.
- Reference: `TODO.md: 2026-07-24 Local Docker Compose Runtime`.

Run:

```bash
git add README.md SUMMARY.md
git commit -m "docs: document local Docker workflow"
git status --short --branch
git log -3 --oneline --decorate
```

Expected: a clean `feature/docker-compose-local` branch containing the design,
runtime, and documentation commits.
