# twenty-autonomus-ccompany

AI orchestrator: Twenty Workflows → AI Run Journal ↔ NestJS worker → Codex, GitHub PR, and human acceptance.

- [PRD](docs/PRD.md)
- [Requirements](docs/requirements.md)
- [Data model and lifecycle](docs/requirements/domain.md)
- [Workflows and protocol](docs/requirements/protocol.md)
- [Operations](docs/requirements/operations.md)
- [Acceptance](docs/requirements/acceptance.md)
- [Docker Compose setup](docs/local-environment.md)

For Codex: [AGENTS.md](AGENTS.md) provides concise rules and task-based document routing. The requirements register and topic contracts form the full specification; read one language version and the relevant sections.

Status: orchestrator design documentation plus a standard Twenty Docker Compose environment. The orchestrator implementation and all SAI integration criteria remain Not verified.

## Run the local environment in Docker

The environment includes standard Twenty v2.45.0, its background worker, PostgreSQL, and Redis. Docker must be running with Docker Compose available and at least 2 GB RAM allocated to the stack.

1. From the repository root, validate configuration and start:

   ```sh
   docker compose config --quiet
   docker compose up -d --wait --wait-timeout 240
   ```

2. Choose how to create the first account/workspace:
   - Without demo data: run [bootstrap](#bootstrap-an-administrator-without-demo-data) before registering through the UI.
   - With demo data: open [http://localhost:3000](http://localhost:3000), register an account, and create a workspace through standard Twenty onboarding.

## Bootstrap an administrator without demo data

The optional one-shot `bootstrap` service creates a server administrator, assigns the workspace Admin role, and initializes standard objects/fields without demo companies, people, opportunities, workflows, or dashboard records.

1. Create a private `.env` from [.env.example](.env.example) if it does not already exist. Set these values; replace the password placeholder with a private password of 12–50 characters without line breaks:

   ```dotenv
   BOOTSTRAP_ADMIN_EMAIL=admin@lvh.me
   BOOTSTRAP_ADMIN_LAST_NAME=User
   BOOTSTRAP_ADMIN_PASSWORD=<your-private-password>
   BOOTSTRAP_WORKSPACE_NAME=Autonomous Company
   BOOTSTRAP_WORKSPACE_SUBDOMAIN=autonomous-company
   ```

2. Run bootstrap after the local stack is ready:

   ```sh
   docker compose run --rm bootstrap
   ```

3. Open [http://localhost:3000](http://localhost:3000) and sign in with the configured email/password. For a different address, use `SERVER_URL`.

The [bootstrap script](scripts/bootstrap.cjs) uses the compiled NestJS services in the Twenty image, creates `Admin` with the configured surname (`User` by default), and clears **all onboarding steps** before login. It suppresses demo prefill only in the bootstrap process and clears pending flags/history in user-global, workspace-global, and user/workspace scopes. The script contains no direct SQL queries and loads no SQL templates; database operations go through Twenty services and ORM.

- A first run requires a migrated database without users or workspaces. Avoid registering through the UI during bootstrap.
- Native activation spans several transactions. A durable creation marker prevents automatic replay after a partial failure; inspect the previous run before recovery.
- A completed rerun reuses the existing account/workspace and skips signup and `activateWorkspace`. Role checks, profile updates, and onboarding cleanup still run; business data and the password are retained.
- Email, workspace name/subdomain, and persisted user/workspace IDs must match. Changing `BOOTSTRAP_ADMIN_PASSWORD` does not reset an existing password.
- Profile updates preserve concurrent password/name changes and do not overwrite account blocking. Native password validation runs before the creation marker is written.
- Existing locks, `creating` state, or identity mismatches stop bootstrap with an error; see [recovery instructions](docs/local-environment.md#bootstrap-reruns-and-recovery). A single matching enabled administrator and active workspace can be adopted without a new-format marker, including from the previous SQL bootstrap.
- The service uses internal Twenty `v2.45.0` APIs; verify compatibility when upgrading the image.
- Keep `.env` private. Workspace creation through the UI still uses Twenty's normal demo prefill and onboarding.

Bootstrap is available only in the local configuration. [compose.production.yaml](compose.production.yaml) removes it from the merged service list, including when profiles are enabled. Production uses standard account/workspace registration through the UI.

See the detailed instructions in [English](docs/local-environment.md#bootstrap-an-administrator-and-empty-workspace) or [Russian](docs/local-environment.ru.md#bootstrap-администратора-и-пустого-workspace), including prerequisites, recovery boundaries, and runtime verification.

## Configuration and lifecycle

Configuration:

- Shared defaults: top of [compose.yaml](compose.yaml).
- Overrides: copy [.env.example](.env.example) to `.env` and edit the values, or pass shell environment variables.
- `SIGN_IN_PREFILLED=false`: enables built-in `tim@apple.dev` login prefill when set to `true`; it does not use bootstrap credentials or control demo data.
- Different port and production inputs from `.env` or GitHub variables/secrets: [detailed instructions](docs/local-environment.md).

Stop and restart:

- `docker compose stop`: stop the environment and retain data.
- `docker compose up -d --wait`: start it again.
- `docker compose down`: remove containers/network and retain database/file volumes.

`docker compose down -v` deletes the persistent volumes and their data. The NestJS/Codex orchestrator worker and custom workflows are not installed by this environment.
