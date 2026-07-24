# TODO

## [2026-07-24] Feature: Local Docker Compose Runtime

**Objective:**  
Allow developers to build and run the production-like countdown timer locally
with `docker compose up --build` and access it at `http://localhost:8080`.

**Approach:**  
Add a single-service Compose configuration that builds the existing multi-stage
Dockerfile, publishes nginx on host port 8080, and reports container health.
Add a Docker build-context ignore file and document the local workflow.

**Tests:**  
Validate the resolved Compose configuration, run the existing CI suite, build
the image, start the service, wait for a healthy container, and verify the app
responds over HTTP from the host.

**Risks & Tradeoffs:**  
This workflow intentionally serves an immutable production bundle without hot
reload. Source changes require an image rebuild, which keeps local container
behavior aligned with the deployed artifact at the cost of slower iteration.
