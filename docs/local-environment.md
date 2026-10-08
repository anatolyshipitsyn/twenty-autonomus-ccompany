# Twenty Docker Compose environment

[Русская версия](local-environment.ru.md) · [README](../README.md)

The environment uses the unmodified official `twentycrm/twenty:v2.45.6` image, PostgreSQL 16, Redis 7, and Twenty's background worker. Registration through the UI uses standard Twenty onboarding and demo data. The optional bootstrap service provisions an empty workspace, skips onboarding, and creates the local MCP API key in `.env`. No image builds or patches are required.

The NestJS/Codex orchestrator worker and its custom objects/workflows are not implemented. All 28 [SAI criteria](requirements/acceptance.md) remain Not verified.

## Local start

Requirements: running Docker, Docker Compose, and at least 2 GB RAM for the environment. Base and production configuration have been checked with Compose v5.5.1. The production override requires support for `!reset` to remove the local bootstrap service.

1. From the repository root, validate and start:

   ```sh
   docker info
   docker compose config --quiet
   docker compose up -d --wait --wait-timeout 240
   ```

2. Choose the first-account setup before registering through the UI:
   - Empty workspace: follow [bootstrap instructions](#bootstrap-an-administrator-and-empty-workspace).
   - Demo workspace: open [http://localhost:3000](http://localhost:3000), register, and complete standard Twenty onboarding.
3. Check the environment:

   ```sh
   docker compose ps
   docker compose logs --tail=100 server worker
   curl --fail http://localhost:3000/healthz
   ```

## Configuration

Settings are grouped at the top of [compose.yaml](../compose.yaml); [.env.example](../.env.example) lists overrides. Compose reads shell environment, then `.env`, then defaults. GitHub variables/secrets must reach the process running Compose.

Shared defaults:

- `IS_MULTIWORKSPACE_ENABLED=true`.
- `IS_CONFIG_VARIABLES_IN_DB_ENABLED=true`: Twenty prefers stored database configuration over environment values when present, except for environment-only variables. Compose interpolation precedence applies before this runtime lookup.
- `DEFAULT_SUBDOMAIN=app`.
- `STORAGE_TYPE=local`.
- `SIGN_IN_PREFILLED=false`.

`SIGN_IN_PREFILLED=false` controls login form prefill. Set it to `true` in `.env` to prefill Twenty's built-in email and password `tim@apple.dev`; it does not use `BOOTSTRAP_ADMIN_EMAIL` or `BOOTSTRAP_ADMIN_PASSWORD` and does not create an account or control CRM demo data. Apply changes with `docker compose up -d server worker`.

Optional overrides:

```sh
cp .env.example .env
docker compose config --quiet
docker compose up -d --wait
```

Different HTTP port without `.env`:

```sh
HTTP_PORT=3001 docker compose up -d --wait
```

Without explicit `SERVER_URL`, it follows `HTTP_PORT`. Update both if `SERVER_URL` is set in `.env`. HTTP binds to loopback by default; PostgreSQL and Redis have no host ports. Server and worker share local file storage.

Committed credentials/encryption keys are public local defaults. `.env` and `.env.*` are ignored except `.env.example`. `docker compose config` prints secrets; use `config --quiet` for validation.

## Bootstrap an administrator and empty workspace

The local-only `bootstrap` service uses the compiled NestJS services from the Twenty image. It calls native signup and `activateWorkspace`, suppresses demo prefill only in this process, clears onboarding flags/history, and creates a Twenty API key assigned to the Admin role. The token is stored in the ignored `.env` as `TWENTY_API_KEY`; only the one-shot bootstrap container mounts that file writable, and it never prints the token. A valid `Codex Local MCP` key is retained on reruns; another valid key is replaced and revoked after the new token is saved. The [script](../scripts/bootstrap.cjs) contains no direct SQL queries and loads no SQL snapshot; Twenty services and ORM manage the database. Server and worker retain normal behavior for later UI-created workspaces.

1. Set private local bootstrap values in `.env`:
   - `BOOTSTRAP_ADMIN_EMAIL`: administrator login email.
   - `BOOTSTRAP_ADMIN_LAST_NAME`: administrator surname, default `User`; first name is `Admin`.
   - `BOOTSTRAP_ADMIN_PASSWORD`: password with 12–50 characters and no line breaks; native validation and hashing run before the creation marker.
   - `BOOTSTRAP_WORKSPACE_NAME`: workspace display name.
   - `BOOTSTRAP_WORKSPACE_SUBDOMAIN`: valid, unique Twenty subdomain, for example `autonomous-company`. Reserved names such as `app` and the configured `DEFAULT_SUBDOMAIN` cannot be used. The service validates availability before writing bootstrap intent.
2. Run the one-shot service:

   ```sh
   docker compose run --rm bootstrap
   ```

3. Open the configured `SERVER_URL` and sign in using the administrator credentials. All onboarding forms are skipped: connect account, app installation, profile, team invitation, and navigation history back to those steps.

The project-scoped Codex MCP config reads `TWENTY_API_KEY` from `.env` for requests to the local MCP endpoint. A regular `docker compose up` followed by unrelated UI signup does not create a key; use this bootstrap flow, or run it to adopt one matching Admin/workspace. Bootstrap reads and writes `.env` through its bind mount; Compose does not pass `TWENTY_API_KEY` in the container environment. Keep `.env` private; the bootstrap service is local-only and is removed from production configuration.

Behavior and boundaries:

- A first run requires a fresh migrated database, including no soft-deleted users/workspaces. Avoid concurrent UI signup during provisioning.
- Requires self-hosted Twenty with billing disabled. Internal service APIs and the process-local prefill override were verified against `v2.45.0`; the current image is `v2.45.6`, so recheck bootstrap compatibility before relying on those APIs.
- Standard objects, fields, views, roles, the server administrator, and an Admin workspace member are initialized. Demo company, person, opportunity, workflow, and dashboard records are omitted; optional onboarding app installation is skipped.
- Bootstrap reads `TWENTY_API_KEY` from the mounted `.env` file, not from a container environment variable. It reuses the token only when it is active for this workspace and its key is named `Codex Local MCP`; otherwise it creates a new key with the Admin role and 100-year expiry, saves it in `.env`, and revokes the previous key when its identity is verified.
- `openssl rand -base64 32` is for encryption keys, not Twenty API tokens. Twenty issues its own signed API token.
- Profile updates target only email verification and unchanged empty surnames. Password, blocking, existing names, and business records are retained. User/workspace caches are invalidated without clearing queues.
- Bootstrap credentials are passed only to the one-shot bootstrap container. That container alone mounts `.env` read/write to inspect or store `TWENTY_API_KEY`; the server and worker do not mount `.env`.

## Bootstrap execution

1. Validate required environment values, start the NestJS context, require billing to be disabled, and acquire `LOCAL_ADMIN_BOOTSTRAP_LOCK`.
2. Read `LOCAL_ADMIN_BOOTSTRAP_STATE` from the global `USER_VARIABLE` scope in Twenty's key-value store and validate the stored identity/completion.
3. Find a matching enabled administrator and workspace with `ACTIVE` or `CREATED` status. Reuse them if found.
4. For a new account, require an empty database, validate the subdomain and demo-prefill hook, and prepare the user with native password validation/hashing.
5. Persist `creating`, then call `signUpOnNewWorkspace` and `activateWorkspace`. Override only `prefillCreatedWorkspaceRecords` in this process, restoring it afterward. Standard metadata, roles, and the workspace member are initialized normally.
6. Verify the Admin role, update email verification and unchanged empty surnames, invalidate account caches, and remove every `ONBOARDING_` user-variable key across all three scopes.
7. Require `onboardingStatus=COMPLETED`. Check that demo objects are empty only on first creation; retain a valid `Codex Local MCP` key or create a new Admin-role key.
8. Write a newly generated token to the mounted `.env` without logging it, then revoke the previous verified key. Persist `completed` with user/workspace IDs.
9. Release the acquired lock, drain events, and close the NestJS context. The service has `restart: "no"` and runs with `docker compose run --rm bootstrap`.

## Bootstrap reruns and recovery

- `completed` and matching identity: skip signup/activation; repeat role/profile checks and onboarding cleanup. Existing business data and password remain intact.
- Email, workspace display name/subdomain, or persisted IDs differ: stop with an error. A rerun is not a rename or password-reset operation. `BOOTSTRAP_ADMIN_LAST_NAME` fills only empty surnames.
- No new-format marker: adopt only a single matching enabled server administrator and active workspace, with valid membership and Admin role. This supports the previous SQL bootstrap; its public marker is not read.
- `creating`: stop rather than replay partial provisioning. Activation spans multiple transactions; a failed run may already have created users, metadata, schemas, or files.
- Existing `LOCAL_ADMIN_BOOTSTRAP_LOCK`: stop. The lock has no expiry; a process crash can leave it behind. Normal cleanup removes only a lock acquired by the current process.
- Invalid password/subdomain before `creating`: correct the input and rerun after normal process cleanup. Errors occurring after `creating` still require inspection.

For a blocked run, inspect `docker compose logs --tail=100 server worker` and the bootstrap command output. Before any administrative marker/lock change, confirm that no bootstrap process remains active and inspect the persisted state, users, workspace activation, membership, and roles. There is no automatic recovery command or general rollback. Do not delete working data or blindly clear a marker to force creation.

## Production

Use [compose.production.yaml](../compose.production.yaml) with the base file. It requires nonempty `SERVER_URL`, `PG_DATABASE_PASSWORD`, and `ENCRYPTION_KEY`; it cannot determine whether supplied values are secure. Creating a workspace through the UI uses full standard onboarding, including demo prefill. `bootstrap: !reset null` removes bootstrap from the merged production configuration, even with `--profile bootstrap` or `--profile "*"`. Bootstrap variables and scripts are not mounted into the production services. This environment has not been deployed to production.

In production, create the Twenty API key manually in workspace settings and configure it on the MCP client through the deployment's secret storage. The API key is not injected into the production server/worker environment, and the local bootstrap service is removed from the production configuration.

1. Prepare a private `.env.production`:
   - `COMPOSE_PROJECT_NAME`: a separate project and volumes.
   - `TAG=v2.45.6`.
   - `SERVER_URL`: actual public HTTPS URL.
   - `PG_DATABASE_PASSWORD`: unique strong alphanumeric password.
   - `ENCRYPTION_KEY`: private key generated with `openssl rand -base64 32`.
   - `IS_MULTIWORKSPACE_ENABLED`: `true` or `false`.
   - `BIND_ADDRESS` / `HTTP_PORT`: interface/port reachable by the real reverse proxy.
2. Validate and start:

   ```sh
   chmod 600 .env.production
   docker compose --env-file .env.production -f compose.yaml -f compose.production.yaml config --quiet
   docker compose --env-file .env.production -f compose.yaml -f compose.production.yaml up -d --wait --wait-timeout 240
   ```

Use both files and the same environment for later production commands. GitHub jobs can expose these values through their step environment; Compose does not fetch GitHub secrets. SSH does not automatically forward that environment. An ephemeral GitHub runner is not a persistent deployment host.

Host, public hostname, TLS proxy, secret transfer, and backup/restore policy remain deployment decisions. Preserve encryption keys with both database and file backups. Changing credentials after PostgreSQL volume initialization requires changing the database password. `FALLBACK_ENCRYPTION_KEY` supports planned key rotation; `APP_SECRET` is optional legacy compatibility.

## Stop, reset, and browser state

- `docker compose stop`: stop and keep data.
- `docker compose up -d --wait`: start again.
- `docker compose down`: remove containers/network and keep named volumes.
- `docker compose down -v`: delete persistent database/file volumes and their data.

Bind mount changes take effect when containers are recreated; deleting a host file does not remove a mount from an existing container. To run server and worker with the current base configuration:

```sh
docker compose -f compose.yaml up -d --no-deps --force-recreate --wait --wait-timeout 240 server worker
```

The command preserves database and file volumes. For production, also use `--env-file .env.production -f compose.production.yaml`.

Volumes are project-scoped; changing `COMPOSE_PROJECT_NAME` selects different data.

Twenty persists account/workspace state in browser localStorage. After resetting volumes, refresh an already-open tab and sign in again. For an empty workspace, run bootstrap before UI signup; UI signup on a fresh database starts normal onboarding.

## Verification

Static checks cover JavaScript syntax, base/production Compose configuration (including absence of bootstrap in production with all profiles enabled), local Markdown links/fences, whitespace, and RU/EN field/status parity. They do not prove runtime behavior or production deployment.

Recorded native-service runtime checks on 2026-10-07 used Twenty `v2.45.0` and PostgreSQL 16:

- Before the review fixes, `twenty-native-bootstrap-test` created one administrator/workspace with the Admin role, standard metadata, no demo records, and `onboardingStatus=COMPLETED`. HTTP password sign-in and workspace token exchange succeeded.
- Its rerun removed 21 onboarding/history keys across three scopes, preserved identity/password, one company, and an unrelated setting. An injected `creating` state blocked replay. The existing local account from SQL provisioning was also adopted.
- After the review fixes, native validation rejected a multiline password without writing a marker; a corrected password proceeded to creation. This check used native password validation with substituted persistence/signup.
- Real TypeORM checks in a disposable PostgreSQL database preserved concurrent password/surname changes, filled an unchanged empty surname, and rejected a concurrently disabled administrator without re-enabling it.
- Full fresh creation and rerun succeeded after the fixes in `twenty-bootstrap-fix-test`. Native Workspace ORM preserved a member's first name and a surname changed between read and update.

On 2026-10-08, the configured `server` and `worker` were recreated from `twentycrm/twenty:v2.45.6` (image digest `sha256:dca6d82985901468b391c0335aa8f0519a52b9809709e66f2de1dbff04351e53`). Compose configuration validation passed, `/healthz` returned `{"status":"ok"}`, and the UI returned HTTP 200. PostgreSQL and Redis containers remained running. Bootstrap behavior and orchestrator SAI criteria have not been revalidated on this image.

Local MCP API key generation through bootstrap was added after those runtime checks. It has not yet been executed against the running `v2.45.6` environment.

Temporary test stacks, databases, volumes, and private credentials were removed. Regression checks did not modify the working workspace. Browser routing was not retested for the native-service version. Public production deployment, backup/restore, and all 28 SAI orchestrator criteria remain Not verified.
