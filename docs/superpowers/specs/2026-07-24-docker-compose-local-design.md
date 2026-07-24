# Local Docker Compose Runtime Design

> **Status:** Superseded by
> `docs/superpowers/specs/2026-07-24-ghcr-compose-design.md`.

## Objective

Provide a production-like local container workflow in which
`docker compose up --build` builds the countdown timer and serves it at
`http://localhost:8080`.

## Acceptance Criteria

- `docker compose up --build` creates and starts the application container.
- The application is reachable from the host at `http://localhost:8080`.
- The container serves the production Vite bundle through nginx.
- Compose reports whether the HTTP service is healthy.
- Docker excludes dependencies, generated output, and local metadata from the
  build context.
- Existing npm development, test, and build workflows remain unchanged.
- The README documents how to start, rebuild, inspect, and stop the container.

## Architecture

The Compose project contains one service named `app`. It builds the existing
root Dockerfile, which compiles the React application in a Node builder stage
and copies the resulting static bundle into an nginx runtime stage. Compose
publishes host port 8080 to container port 80.

There are no source bind mounts or development-server processes. The running
container is an immutable representation of the production bundle. Developers
rebuild the image after changing source files.

## Components

### `compose.yaml`

- Builds from the repository root using the existing Dockerfile.
- Publishes `8080:80`.
- Adds an HTTP health check against nginx on the container loopback interface.
- Avoids a fixed container name so separate Compose projects do not conflict.
- Avoids restart policies because this is an explicitly managed local workflow.

### `.dockerignore`

Excludes Git metadata, dependency directories, generated bundles, coverage,
logs, editor settings, and local environment files. Source code, npm manifests,
Vite configuration, nginx configuration, and the Dockerfile remain in the
build context.

### `README.md`

Adds commands for:

- building and starting with `docker compose up --build`;
- running in the background;
- rebuilding after source changes;
- viewing logs; and
- stopping and removing the local Compose resources.

## Runtime Flow

1. Compose sends the filtered repository context to the Docker builder.
2. The Node stage installs locked npm dependencies and runs the production
   build.
3. The nginx stage receives only the generated `dist` files.
4. nginx serves the application on container port 80.
5. Docker publishes that port as `localhost:8080`.
6. The health check requests the root page inside the container.

## Error Handling

Image build failures stop Compose before the service starts. Runtime health is
reported through the Compose health status. nginx retains the existing SPA
fallback, cache behavior, and security headers. The README will direct
developers to `docker compose logs app` for runtime diagnosis.

## Test Strategy

The configuration follows a red-green cycle:

1. Run `docker compose config --quiet` before `compose.yaml` exists and confirm
   it fails because no Compose configuration is present.
2. Add the minimum Compose configuration and confirm the command passes.
3. Run `npm run ci` to protect the existing application workflow.
4. Run `docker compose build` to verify the image builds.
5. Start the service in detached mode and wait for it to become healthy.
6. Request `http://localhost:8080` from the host and verify a successful HTTP
   response containing the application shell.
7. Stop and remove the test container and network with `docker compose down`.

## Security and Supply Chain

No credentials or environment secrets are needed. The build uses the committed
npm lockfile through the existing Dockerfile. The final image contains static
assets and nginx rather than the Node toolchain or application source.

Base-image pinning and changing nginx to a non-root image are intentionally
outside this feature because they alter the existing image-maintenance policy.
They can be handled as a separate supply-chain hardening task.

## Scope Boundaries

This feature does not add hot reload, source mounts, Compose profiles, TLS,
external services, deployment automation, or changes to the application UI.
