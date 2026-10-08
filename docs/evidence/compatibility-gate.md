# Compatibility gate — current findings

Date: 8 October 2026 · Scope: pre-implementation checks in OPS compatibility gate; mapped plan row SAI-13, SAI-18, SAI-20 · Status: **GO — App development may start**

[Русская версия](compatibility-gate.ru.md) · [Operations contract](../requirements/operations.md) · [Protocol contract](../requirements/protocol.md) · [Acceptance matrix](../requirements/acceptance.md)

## Verdict

The configured self-hosted Twenty server is healthy. Authenticated MCP access works with the locally stored `TWENTY_API_KEY`: the workspace exposes 28 standard object metadata names, one workspace member, two role definitions, and no workflows. The expected `AiTask`, `AiRun`, `AiRunJournal`, and `Project` objects are absent because their Twenty app has not yet been developed and installed; this is expected at the current stage, not evidence of server incompatibility. A scoped Company create/update/read-back/soft-delete probe passed, and follow-up searches found no remaining probe records.

The updated gate decision is **GO**: official scaffolding, dependency installation, and the App dev synchronization cycle completed in an isolated temporary project; the selected Twenty `v2.45.6` server, API, Codex handshake, and GitHub access were reachable. App-specific schema/workflows, least-privilege credential behavior, quotas, and full Codex lifecycle remain open for their dependent stages. No app was installed into the configured project workspace. Earlier generic Company and bootstrap probes remain as recorded below; no secret was printed or recorded.

## Gate decision and bounded candidate

**Decision: GO for App development; Stage 2 is unblocked and remains Proposed.** The official scaffold resolved `create-twenty-app@latest` to `2.45.0`, installed `twenty-sdk@2.45.0` with Node `24.19.0` / Yarn `4.13.0`, and completed `yarn twenty dev` synchronization against an isolated app-dev server `v2.45.8`. SDK metadata declares Twenty `>=2.40.0`, which includes the selected server `v2.45.6`. Target health/API, Codex initialize handshake, and GitHub repository access also passed in this recheck. The exact SDK sync against `v2.45.6` remains a Stage 2 entry check; the declared version range plus successful sync on `v2.45.8` makes this non-blocking for starting App development. This gate does not close any SAI.

Record these as the working candidate, not as verified compatibility or approved production configuration:

- Twenty server/worker: `v2.45.6`, image digest `sha256:dca6d82985901468b391c0335aa8f0519a52b9809709e66f2de1dbff04351e53`.
- Twenty App SDK candidate: official `create-twenty-app@latest` resolved to scaffolder `2.45.0` and generated `twenty-sdk@2.45.0`, `twenty-client-sdk@2.45.0`, and `twenty-ui@2.45.0`. SDK engines are Node `^24.5.0`, Yarn `^4.0.2`, Twenty `>=2.40.0`; the bundled Node `24.19.0` and Yarn `4.13.0` satisfy them. Keep these generated exact versions in the Stage 2 app lockfile. The previously inspected monorepo source candidate `2.46.0` was not used for the App and is superseded.
- Codex: `codex-cli 0.160.1`, app-server over stdio, generated experimental schema SHA-256 `e77b7d1436a78f431a74b2cb263a862e92ae40d70411bc63835b47ab2168827c`. This is a protocol candidate only; app-server is labeled experimental.
- Topology: one host, one worker, one isolated non-production Twenty workspace, `concurrency=1`; keep the worker and app-server on the same host. The observed local Compose endpoint was `127.0.0.1:3000`. No remote/production topology is selected.
- Repository policy: candidate repository `anatolyshipitsyn/twenty-autonomus-ccompany`, `main` as base, task branches and reviewable PRs for delivery. Keep the app private and install only into an isolated non-production workspace. `gh` authenticated as `anatolyshipitsyn`; `gh api` confirmed repository `push` permission.
- Credentials: inject a dedicated non-production Twenty API key and GitHub credential from host-managed secret storage at runtime; do not commit credentials or copy them into Journal/analytics. Use least privilege. The existing local MCP key's role and privilege scope are unknown, so it is not approved as the App runtime credential.
- Deployment: no production deployment target is configured. No production rollout, HA, or remote worker is part of this candidate. Production deployment requires a separate configuration and review.

## Open issues and disposition

| Issue | Class | Why / dependent check |
| --- | --- | --- |
| Exact official SDK sync against selected server `v2.45.6` has not yet been run; the successful sync used app-dev server `v2.45.8`. | **Non-blocking for starting App development** | SDK `2.45.0` declares Twenty `>=2.40.0`, and scaffold build/upload/synchronization passed on `v2.45.8`; repeat `yarn twenty dev` against `v2.45.6` at Stage 2 entry before app-specific schema work/install. |
| API-key role binding/least-privilege and workspace plan/quotas are not exposed by the current MCP toolset. | **Non-blocking for App development** | Build in the isolated app-dev environment; before installing/using the App on the selected workspace, verify a dedicated least-privilege key and denied unauthorized operations at Stage 2, and read plan/quota limits before enabling workflows/recovery in Stage 3/5. |
| Codex app-server is experimental; only initialize/EOF are evidenced, and persistent thread/turn behavior is not established. | **Non-blocking for App development** | App schema can be developed independently. Before Stage 4 worker integration, pin the protocol/schema and verify persistent thread, turn, question/answer, interrupt, history reconciliation, and shutdown without replay. If experimental status is unacceptable for the pilot, record a protocol change before Stage 4. |
| API-key role binding and least-privilege behavior are unknown; the inspected roles are broad. | **Non-blocking for App development** | Do not reuse the existing MCP key as the worker credential. Verify a dedicated least-privilege key and denied unauthorized operations in the Stage 2 isolated workspace before App install/use. |
| Workspace plan/quotas and server-side SDK helper availability are unknown. | **Non-blocking for App development** | Read the selected plan and run quota/helper probes in Stage 3/5 before enabling workflows and recovery; do not infer plan behavior from the candidate SDK's static metadata. |
| Contract schema, indexes, duplicate rejection, Upsert, and four workflows have no runtime evidence because the App does not exist. | **Non-blocking for this gate** | Verify schema/indexes/Upsert on Stage 2 exit and workflow branches/concurrency on Stage 3 exit in the isolated workspace. |
| Backup/restore and full Codex lifecycle are untested; production deployment is unconfigured. | **Non-blocking for App development** | Verify restore in Stage 5 and full pilot lifecycle in Stage 7. Production remains outside this candidate until separately configured and reviewed. |
| Langfuse is not selected. | **Non-blocking for App development** | Decide/defer analytics and validate export/recovery in Stage 6; its failure must remain asynchronous under OPS-17. |

There are no known blockers to starting App development. Stage 1 is **Completed — GO**; Stage 2 is **Proposed and unblocked**, not yet started. Exact target sync, app schema/workflows, quotas, backup, and full-turn checks remain assigned to their dependent stages. SAI-13, SAI-18, and SAI-20 remain **Not verified**.

## Current-session recheck (8 October 2026)

- Official Quick Start flow: `npx --yes create-twenty-app@latest` with bundled Node `24.19.0` resolved scaffolder `2.45.0`; generated app dependencies were `twenty-sdk@2.45.0`, `twenty-client-sdk@2.45.0`, and `twenty-ui@2.45.0`. Generated package engines match Node `^24.5.0`, Yarn `^4.0.2`, and Twenty `>=2.40.0`.
- `yarn install` completed in the temporary scaffold. `yarn twenty dev` completed Resources Build/Upload, Manifest Build, Application Synchronization, Api Client Generation, and synced 8 entities to the isolated app-dev server `v2.45.8` (CLI `2.45.0`). Only warning: starter template uses deprecated vertical-list page positioning; sync succeeded.
- The selected local `twentycrm/twenty:v2.45.6` server returned HTTP 200 from `/healthz`; GraphQL `{ __typename }` returned HTTP 200 with `Query`.
- `codex app-server --stdio` accepted `initialize` / `initialized`, returned an initialize result without RPC error, emitted status notification, and exited 0 on EOF (`codex-cli 0.160.1`). This is handshake evidence, not full turn lifecycle.
- `gh auth status` showed active `anatolyshipitsyn` with `repo` scope; `gh api repos/anatolyshipitsyn/twenty-autonomus-ccompany` confirmed the repository and `push: true`.
- The scaffold was created under `/private/tmp`, and only its isolated `twenty-app-dev` container and three volumes created during this run were removed. The temporary app tree and previously absent Twenty monorepo `node_modules` were removed; no SDK/App was installed into the configured workspace.
- An earlier direct monorepo `nx build twenty-sdk` attempt stopped at `twenty-shared:generateBarrels` with `listen EPERM` before reaching the SDK target. That was an environment build failure, not evidence of SDK incompatibility; the official scaffold path above provides the relevant successful App build/install/sync evidence.

## Environment snapshot

| Component | Observed value | Evidence / qualification |
| --- | --- | --- |
| Orchestrator repository | `main`, `9d33725241e62e17fb73a0732321dc32bb23834b` | Checkout at time of check |
| Twenty server and worker | `twentycrm/twenty:v2.45.6`, image digest `sha256:dca6d82985901468b391c0335aa8f0519a52b9809709e66f2de1dbff04351e53` (local image ID `sha256:ff1d85a1f029d99be27adf7b877362fe84c2870cdc9d3be15cd54a2026c0c15f`) | Server and worker use the same image. Server is healthy; worker is running. PostgreSQL and Redis are healthy. ARM64 host. Observed 8 Oct 2026. |
| Authenticated Twenty MCP | Protocol `2025-06-18`; server `Twenty MCP Server 0.1.0`; 28 standard object names; 1 workspace member; 2 roles; 0 workflows | Accessed using local `.env` key without displaying it. Key-to-role assignment and plan are not exposed by the current toolset. |
| Database / cache | PostgreSQL `16`; Redis `7-alpine` | Running Compose images |
| Docker Compose | `v5.5.1` | Local CLI |
| Twenty SDK candidate | Scaffold `2.45.0`; generated `twenty-sdk@2.45.0`; source checkout `2.46.0` superseded | Generated SDK installed and `yarn twenty dev` synchronized on isolated app-dev `v2.45.8`; target `v2.45.6` sync is Stage 2 entry check. |
| SDK toolchain | SDK declares Node `^24.5.0`, Yarn `^4.0.2`; host Node `v22.22.3`, Yarn `4.13.0`; bundled Node `v24.19.0` | Official scaffold installed and synced using bundled Node and Yarn. Host Node still does not satisfy the SDK engine; use bundled Node for Stage 2. Earlier monorepo build failure is recorded separately. |
| Codex | `codex-cli 0.160.1` | `codex app-server --help` labels app-server experimental. `initialize` returned without an RPC error. Generated experimental schema SHA-256: `e77b7d1436a78f431a74b2cb263a862e92ae40d70411bc63835b47ab2168827c`. |
| Langfuse | Not selected / not configured in this repository | SDK/API version, deployment, and permitted data remain open. |

## Checks

| Requirement | Check and observed result | Assessment |
| --- | --- | --- |
| SAI-13 — target server/API | Current `docker compose ps` shows `v2.45.6`; server, PostgreSQL, and Redis are healthy, and worker is running. `GET /healthz` returned HTTP 200 and `{"status":"ok",...}`. Earlier unauthenticated GraphQL `POST /graphql` with `{__typename}` returned HTTP 200 and `Query`. | **Partial.** Proves current health and endpoint reachability, plus earlier basic GraphQL reachability only. |
| SAI-13 — workspace schema and permissions | Authenticated MCP returned 28 standard object metadata names; targeted metadata queries for `AiTask`, `AiRun`, `AiRunJournal`, and `Project` returned no matches. These objects are supplied by the app, which is not yet developed or installed, so their absence is expected. One workspace member was found. `list_roles` returned Admin and Member; both have global read/update/delete/destroy access and all tools, with no object-level rules. API-key role assignment and plan are not exposed. | **Partial.** MCP access and standard workspace metadata are verified; app-defined schema and least-privilege/key binding and plan remain to be verified after implementation and installation. |
| SAI-13 — SDK/server compatibility | Generated SDK `2.45.0` declares `>=2.40.0`; selected server `v2.45.6` is in range; official scaffold sync passed on `v2.45.8`. | **Partial.** Exact sync against `v2.45.6` is a Stage 2 entry check; this gate does not close SAI. |
| SAI-13 / SAI-18 — unique keys | SDK source accepts `isUnique` for scalar fields and rejects it for relation/files fields; a source unit test covers unique text fields. | **Static evidence only.** No app was installed and duplicate-key rejection was not exercised on the running database. Source examined is the separate `twenty` checkout at the snapshot above, not the running `v2.45.6` source tag. |
| SAI-18 — record writes | Authenticated MCP Company probe passed create, update, read-back, soft-delete, and post-delete search (0 visible probe rows). | **Partial.** Confirms generic Company CRUD only; contract-object writes, unique indexes, duplicate rejection, relations, and Upsert/redelivery remain unverified. |
| SAI-18 — Upsert | The checked-out server source contains REST and GraphQL `upsert` request handling. | **Static evidence only.** Idempotency, immutable outcomes, duplicate delivery, and Upsert behavior were not run against the target server. |
| SAI-18 — workflows and concurrency | Authenticated MCP `list_workflows` returned 0 workflows. | **Not verified.** IF/else behavior, four-workflow triggers, serialization, concurrent Dispatch, permissions, and absence of workflow storms need a test workspace. |
| SAI-20 — plan, quotas, and SDK helpers | Workspace plan and quotas are not exposed by the current authenticated MCP toolset. | **Not verified.** Quota behavior and SDK helper availability on this server/plan were not tested. |
| Codex protocol portion of SAI-13 | `codex app-server --stdio` accepted `initialize` and `initialized`, returned an initialize response without an error, and exited 0 on EOF; the generated schema contains `thread/start`, `thread/read`, `turn/start`, and `turn/interrupt`. An isolated `thread/start` returned `ephemeral=false`, but without a turn no rollout file was created and `thread/list` returned 0 after process restart (including `appServer` source filtering). | **Partial.** Handshake and EOF process exit passed. Thread/history persistence is not verified: the no-turn probe is inconclusive, and no authenticated model turn, question/answer, interrupt, history reconciliation, or shutdown during an active turn was run. The app-server is explicitly experimental. |

## Commands and results

- `docker compose ps --format json` — server `v2.45.6` healthy; worker `v2.45.6` running; PostgreSQL and Redis healthy. Server and worker Compose image label is `sha256:ff1d85a1f029d99be27adf7b877362fe84c2870cdc9d3be15cd54a2026c0c15f`.
- `docker image inspect twentycrm/twenty:v2.45.6` — registry digest `sha256:dca6d82985901468b391c0335aa8f0519a52b9809709e66f2de1dbff04351e53`.
- `curl -fsS -D - http://127.0.0.1:3000/healthz` — HTTP 200; body `{"status":"ok","info":{},"error":{},"details":{}}`.
- `curl -X POST http://127.0.0.1:3000/graphql` with `{__typename}` — HTTP 200; `Query` returned.
- `curl http://127.0.0.1:3000/rest/metadata/objects` — HTTP 403 without authentication.
- `docker compose config --quiet` — base Compose configuration is valid. Production merge failed interpolation because `.env` lacks `SERVER_URL`, `PG_DATABASE_PASSWORD`, and `ENCRYPTION_KEY`; production runtime is not configured.
- Authenticated MCP `initialize` / `tools/list` — protocol `2025-06-18`; server `Twenty MCP Server 0.1.0`; seven wrapper tools. Business methods were loaded with `learn_tools` and called through `execute_tool`.
- Authenticated MCP metadata / roles / workflows — 28 standard object names; four contract objects are absent before app development/install; 2 roles; 0 workflows. Admin permits global read/update/delete/destroy and all tools; Member also permits broad global read/update/delete/destroy and all tools, but cannot be assigned to API keys. Key-role binding and plan are unavailable through this toolset.
- Current temporary MCP Company probe — create, update, read-back, and soft-delete succeeded; an exact search after deletion found 0 visible records. One soft-deleted record remains reversible in Twenty. `TWENTY_API_KEY` was read from local `.env` and never printed.
- `docker compose run --rm bootstrap` — completed successfully against Twenty `v2.45.6` and reused the existing local MCP API key without printing it. This verifies the bootstrap rerun/reuse path only; new-key creation and `.env` writing remain unverified.
- `codex --version` — `codex-cli 0.160.1`.
- `codex app-server generate-json-schema --experimental --out /tmp/twenty-compat-gate-codex-schema` — succeeded; generated schema is temporary and not committed.
- `codex app-server --stdio` with `initialize` / `initialized` and EOF — exit 0; initialize response returned without an RPC error. This was a handshake probe, not a turn-lifecycle test.
- Isolated Codex persistence probe — with a temporary `CODEX_HOME`, empty credentials, and no AI turn, `thread/start` returned a persistent thread but created no rollout file; after the process restarted, `thread/list` returned 0 with default, `appServer`, and state-DB-only filters. This is inconclusive without a turn and does not prove a persistence failure.
- `node --version` / bundled Node executable — host `v22.22.3`; bundled `v24.19.0`.
- `yarn --version` — `4.13.0`.
- Historical source inspection of checkout `a3e874920cfa319c7c8683e020b65795d6193af8` found `twenty-sdk@2.46.0` with `engines.twenty >=2.40.0`, Node `^24.5.0`, and Yarn `^4.0.2`. The monorepo package was not built; the later official scaffold installed SDK `2.45.0` and synchronized the App as recorded above.
- A temporary full Twenty checkout `yarn install --immutable` completed with peer-dependency warnings; `yarn.lock` remained unchanged. `nx build twenty-sdk --skip-nx-cache` started `twenty-shared:generateBarrels`, but the `tsx`/esbuild processes did not finish and the build was interrupted before reaching the SDK target. A direct Vite attempt from the earlier focused install could not resolve workspace import `twenty-shared/utils`. Temporary dependencies were removed; the Twenty checkout is clean.
- With network access enabled, `gh auth status` — logged in as active account `anatolyshipitsyn` with `repo` scope. `gh pr create` opened PR #6; `gh pr view` reports `MERGEABLE` / `CLEAN`, and `gh pr checks` reports no checks configured. This proves basic repository/PR access, not orchestrator publish idempotency.

## Remaining evidence needed

- Develop the Twenty app that defines `AiTask`, `AiRun`, `AiRunJournal`, `Project`, and the required workflows; preserve the generated SDK versions in its lockfile and run the exact sync against `v2.45.6` at Stage 2 entry.
- Install the app in a non-production workspace, then verify its schema, relations, scalar unique indexes, duplicate rejection, Upsert/redelivery behavior, and permissions. The current MCP credential can write standard Company records; its assigned role and least-privilege posture still need independent verification.
- Run the four workflow probes, including concurrent Dispatch, IF/else, scheduler behavior, and heartbeat storm prevention.
- Read the selected workspace plan and exercise relevant quota/rate-limit behavior.
- Pin the Codex CLI/app-server protocol and test a persistent thread, turn lifecycle, questions, interrupt, history reconciliation, and process shutdown without replaying execution.
- At Stage 6, choose the Langfuse deployment and SDK/API version or record that analytics are deferred.

Stage 1 is complete with **GO**; Stage 2 is unblocked and remains **Proposed**. SAI-13, SAI-18, and SAI-20 remain **Not verified**: this gate confirms readiness to start development, not pilot integration acceptance.

## Coverage of the full OPS gate

The operations contract lists a broader pre-implementation gate than the three SAI IDs attached to the Stage 1 planning row. This report does not mark the gate complete based on that row alone.

| OPS gate item | Current evidence | State |
| --- | --- | --- |
| Private app; three objects and Project | App is not yet developed or installed; absence of its four objects is expected at this stage | Not verified |
| Relations, indexes, and Upsert | No contract objects; generic Company CRUD passed, but no target schema/index/duplicate/redelivery probe | Not verified |
| Router response and profiles | No app or router implementation exists in this project | Not verified |
| Four workflows, Form, branches, scheduler | Authenticated MCP lists zero workflows; no workflow test run | Not verified |
| Permissions, ingress, and secrets | MCP exposes Admin/Member roles with broad global permissions; API-key assignment and least-privilege remain unverified. Server is published on `127.0.0.1:3000`; unauthenticated GraphQL `__typename` returns 200 while REST metadata returns 403. Local key was not printed. | Partial / not verified |
| Concurrent Dispatch and PENDING recovery | No orchestrator worker or Journal app is implemented | Not verified |
| Codex handshake, questions, interrupt, history, shutdown | `initialize`/`initialized` succeeded and app-server exited on EOF; lifecycle RPCs were not called | Partial / not verified |
| GitHub permissions and PR idempotency | Active `anatolyshipitsyn` access created PR #6; GitHub reports `MERGEABLE` / `CLEAN` and no checks are configured. Orchestrator publish idempotency was not tested. | Partial / not verified |
| Native UI and quotas | Workspace plan/UI not inspected | Not verified |
| Backup and restore | No backup/restore operation was run | Not verified |
| Search/Logic Function/schedule limits, Journal pagination, IF/else, permission enforcement | Not tested against the pinned server and workspace plan | Not verified |
| Long Codex execution on the host; worker-to-Twenty topology | No orchestrator worker exists; deployment topology is not configured | Not verified |

The planning record in Notion previously said “full gate — all 28 SAI”. The owner clarified the scope in the 8 October request: OPS defines the pre-implementation gate, while all 28 SAI remain pilot integration criteria. The matching Notion open question is now resolved to that scope; no SAI status is changed here.
