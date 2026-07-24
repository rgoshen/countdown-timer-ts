# TODO

## [2026-07-24] Feature: GHCR-backed Docker Compose Runtime

**Objective:**
Publish the production countdown timer as a public multi-platform GHCR image
and make `docker compose up` always pull its latest version for local use at
`http://localhost:8080`.

**Approach:**
Add a pinned GitHub Actions workflow that publishes `latest` and immutable
commit tags from `main`. Add a single-service Compose configuration that pulls
`ghcr.io/rgoshen/countdown-timer-ts:latest`, publishes nginx on port 8080, and
reports container health. Repair the missing direct lint dependencies exposed
by a clean install, filter the Docker build context, and document the workflow.

**Tests:**
Use an executable Node contract to validate the Compose and publication
configuration, run the existing CI suite from a clean install, format-check
the YAML, and build and smoke-test the production image locally. After merge,
verify the GitHub Actions publication, public package visibility, anonymous
pull, container health, and host HTTP response.

**Risks & Tradeoffs:**
The mutable `latest` tag favors convenience over reproducibility, so each
publication also retains a commit-specific tag for rollback. GHCR creates the
first package as private; anonymous Compose startup becomes available only
after the first `main` publication and a one-time visibility change to public.
