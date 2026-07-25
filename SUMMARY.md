# Change Summary

## [2026-07-24 17:13] Commit Summary

**Change Type:** Feature
**Scope:** GHCR publication and Docker Compose

**Summary:**
Add the always-pull Compose service, filtered Docker build context, pinned
multi-platform GHCR publication workflow, provenance attestation, and
executable configuration contract.

**Rationale:**
GitHub Actions now owns the shared production image while Compose consumes that
artifact without a local build fallback. Structured tests validate the
configuration GitHub and Docker consume rather than matching source text.

**Bug Fix Context (if applicable):**
The repository previously had no Compose configuration, causing
`docker compose up` to fail before resolving any service.

**References:**
- TODO.md: 2026-07-24 GHCR-backed Docker Compose Runtime
- Issue: Not applicable

## [2026-07-24 16:44] Commit Summary

**Change Type:** Fix
**Scope:** Clean CI baseline

**Summary:**
Declare the flat ESLint configuration dependencies, resolve the rules they
activate, make browser storage deterministic in Node 26 tests, and stabilize
the countdown change callback.

**Rationale:**
A clean installation must load the configured lint rules and exercise the same
provider boundary used in production. Separating the theme context preserves
Fast Refresh, while a stable picker callback prevents elapsed countdown values
from being revalidated and cleared.

**Bug Fix Context (if applicable):**
`npm run ci` failed first on missing ESLint imports, then on latent lint errors
and a Node 26 storage collision. The App integration test also exposed a
feedback loop that cleared the target before rendering the finished state.

**References:**
- TODO.md: 2026-07-24 GHCR-backed Docker Compose Runtime
- Issue: Not applicable

## [2026-07-24 16:32] Commit Summary

**Change Type:** Docs
**Scope:** GHCR configuration testing

**Summary:**
Replace workflow source-text checks in the implementation plan with structured
YAML contract assertions.

**Rationale:**
Parsing the workflow verifies the configuration GitHub consumes and permits
intentional action upgrades while still enforcing immutable commit pins.

**Bug Fix Context (if applicable):**
The initial plan would have tested workflow text rather than its parsed
behavior.

**References:**
- TODO.md: 2026-07-24 GHCR-backed Docker Compose Runtime
- Issue: Not applicable

## [2026-07-24 16:19] Commit Summary

**Change Type:** Docs
**Scope:** GHCR-backed Docker Compose runtime

**Summary:**
Replace the local-image Compose design with the approved GHCR publication and
always-pull workflow, including exact implementation and verification steps.

**Rationale:**
Compose must consume the same multi-platform artifact published from `main`,
while immutable commit tags preserve rollback even though local startup follows
the mutable `latest` tag.

**Bug Fix Context (if applicable):**
The previous plan never created `compose.yaml`, causing Docker Compose to fail
with `no configuration file provided: not found`.

**References:**
- TODO.md: 2026-07-24 GHCR-backed Docker Compose Runtime
- Issue: Not applicable

## [2026-07-24 15:01] Commit Summary

**Change Type:** Chore
**Scope:** Git worktree isolation

**Summary:**
Ignore the project-local worktree directory used for isolated feature
implementation.

**Rationale:**
Keeping linked worktrees out of version control prevents nested checkout
contents from appearing as repository changes during subagent execution.

**Bug Fix Context (if applicable):**
Not applicable.

**References:**
- TODO.md: 2026-07-24 Local Docker Compose Runtime
- Issue: Not applicable

## [2026-07-24 14:53] Commit Summary

**Change Type:** Docs
**Scope:** Docker Compose local runtime

**Summary:**
Add the task-by-task implementation plan for the approved local Docker Compose
workflow.

**Rationale:**
The plan records the executable red-green contract, exact configuration, full
verification sequence, and atomic commit boundaries before implementation
begins.

**Bug Fix Context (if applicable):**
Not applicable.

**References:**
- TODO.md: 2026-07-24 Local Docker Compose Runtime
- Issue: Not applicable

## [2026-07-24 14:50] Commit Summary

**Change Type:** Docs  
**Scope:** Docker Compose local runtime

**Summary:**  
Document the approved production-like Docker Compose design and record its
implementation plan, test strategy, and tradeoffs.

**Rationale:**  
The existing multi-stage Dockerfile already defines the production artifact.
Reusing it from Compose avoids a second build path and keeps the local runtime
representative of production.

**Bug Fix Context (if applicable):**  
Not applicable.

**References:**  
- TODO.md: 2026-07-24 Local Docker Compose Runtime
- Issue: Not applicable
