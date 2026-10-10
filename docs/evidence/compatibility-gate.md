# Compatibility gate — current findings

Date: 10 October 2026 · Scope: pre-implementation checks in OPS compatibility gate; mapped plan row SAI-13, SAI-18, SAI-20 · Status: **Stage 1 GO; Stage 2 Completed**

[Русская версия](compatibility-gate.ru.md) · [Stage 2 model evidence](stage-2-data-model.md) · [Operations contract](../requirements/operations.md) · [Protocol contract](../requirements/protocol.md) · [Acceptance matrix](../requirements/acceptance.md)

> Current Stage 2 installation, schema, relation, unique-index, Upsert, and permission evidence is recorded in [Stage 2 data model evidence](stage-2-data-model.md). Older snapshots below describe the state at their dated checks and are superseded for current Stage 2 status by that report.

## Verdict

The selected self-hosted Twenty server is healthy. Stage 1's authenticated MCP and Company checks passed in the primary workspace. Stage 2's private App is now installed in a separate disposable `v2.45.6` workspace; current schema and API findings are summarized in the linked Stage 2 report. The primary Compose workspace was not used for the Stage 2 installation or probes.

The Stage 1 decision remains **GO**: official scaffolding, dependency installation, and App dev synchronization completed in an isolated project on `v2.45.8`. For Stage 2, the official scaffold was also synchronized against a disposable isolated app-dev `v2.45.6` target, and the exit probes are complete. Current Stage 2 evidence is linked above.

## Gate decision and bounded candidate

**Decision: GO for starting App development.** The official scaffold resolved `create-twenty-app@latest` to `2.45.0`, installed `twenty-sdk@2.45.0` with Node `24.19.0` / Yarn `4.13.0`, and completed `yarn twenty dev` synchronization against an isolated app-dev server `v2.45.8`. The exact target sync against `v2.45.6` also passed at Stage 2 entry, as recorded below. This gate does not close any SAI.

## Stage 2 entry check (9 October 2026)

**Result: PASS; Stage 2 is In progress.** An isolated disposable `twentycrm/twenty-app-dev:v2.45.6` container was started at `127.0.0.1:2020`; `/healthz` returned HTTP 200. The official scaffolder `create-twenty-app@2.45.0` created `apps/twenty-app/` using Node `24.19.0` and Yarn `4.13.0`; its lockfile pins the generated SDK packages at `2.45.0`. The official `yarn twenty dev` command completed its initial sync against this exact target: Resources Build, Resources Upload, Manifest Build, Application Synchronization, API Client Generation, and Entities (8 synced) all passed; overall status was Synced. The watch process was then stopped; its shell returned 130 due to that deliberate stop. The primary Compose workspace was not used.

| Finding | Classification | Evidence / next action |
| --- | --- | --- |
| Full-payload Journal Upsert overwrites existing immutable fields; a key-only Upsert preserves them. | **Key-only storage path verified; consumer behavior depends on later stages** | On the isolated target, a key-only upsert returned existing payload/resultCode/state/task unchanged; full-payload Upsert changed payload/resultCode. The delivery consumer must compare returned stored values with the incoming payload and avoid re-execution; this belongs to Stage 3/4. See the Stage 2 report. |
| Runtime permissions for role-assigned credentials remain unverified. | **Blocking Stage 2 exit** | Verify operator, Workflows, and worker credentials in the isolated workspace. Worker currently has object-level Journal update access; field/record restrictions are not proven. |

The exact-version entry check and private App installation passed. Relations, unique duplicate rejection, and immutable readback through the key-only Upsert path passed. Runtime role boundaries with role-assigned credentials remain unverified and prevent Stage 2 exit. Full-payload Upsert is unsafe; consumer-side compare/no-reexecution is a dependent Stage 3/4 check. All 28 SAI IDs and statuses remain unchanged; no SAI is promoted by this evidence.

Record these as the working candidate, not as verified compatibility or approved production configuration:

- Twenty server/worker: `v2.45.6`, image digest `sha256:dca6d82985901468b391c0335aa8f0519a52b9809709e66f2de1dbff04351e53`.
- Twenty App SDK candidate: official `create-twenty-app@latest` resolved to scaffolder `2.45.0` and generated `twenty-sdk@2.45.0`, `twenty-client-sdk@2.45.0`, and `twenty-ui@2.45.0`. SDK engines are Node `^24.5.0`, Yarn `^4.0.2`, Twenty `>=2.40.0`; the bundled Node `24.19.0` and Yarn `4.13.0` satisfy them. Keep these generated exact versions in the Stage 2 app lockfile. The previously inspected monorepo source candidate `2.46.0` was not used for the App and is superseded.
- Codex: `codex-cli 0.160.1`, app-server over stdio, generated experimental schema SHA-256 `e77b7d1436a78f431a74b2cb263a862e92ae40d70411bc63835b47ab2168827c`. This is a protocol candidate only; app-server is labeled experimental.
- Topology: one host, one worker, one isolated non-production Twenty workspace, `concurrency=1`; keep the worker and app-server on the same host. The observed local Compose endpoint was `127.0.0.1:3000`. No remote/production topology is selected.
- Repository policy: candidate repository `anatolyshipitsyn/twenty-autonomus-ccompany`, `main` as base, task branches and reviewable PRs for delivery. Keep the app private and install only into an isolated non-production workspace. `gh` authenticated as `anatolyshipitsyn`; `gh api` confirmed repository `push` permission.
- Credentials: the isolated app-dev API key was rotated and is stored in host-managed Keychain; no value is recorded in Git or Notion. Use credentials assigned to least-privilege roles for permission probes. The primary MCP key is not reused for the app-dev target.
- Deployment: no production deployment target is configured. No production rollout, HA, or remote worker is part of this candidate. Production deployment requires a separate configuration and review.

## Open issues and disposition

| Issue | Class | Why / dependent check |
| --- | --- | --- |
| Native Journal Upsert overwrites immutable payload/result, and runtime role boundaries are unverified. | **Blocking Stage 2 exit** | The isolated `v2.45.6` target accepted duplicate-key rejection but Upsert changed the existing payload and resultCode. Verify a supported immutable redelivery path and run role-assigned permission probes. |
| API-key role binding/least-privilege and workspace plan/quotas are not exposed by the current MCP toolset. | **Non-blocking for App development** | Build in the isolated app-dev environment; before installing/using the App on the selected workspace, verify a dedicated least-privilege key and denied unauthorized operations at Stage 2, and read plan/quota limits before enabling workflows/recovery in Stage 3/5. |
| Codex app-server is experimental; only initialize/EOF are evidenced, and persistent thread/turn behavior is not established. | **Non-blocking for App development** | App schema can be developed independently. Before Stage 4 worker integration, pin the protocol/schema and verify persistent thread, turn, question/answer, interrupt, history reconciliation, and shutdown without replay. If experimental status is unacceptable for the pilot, record a protocol change before Stage 4. |
| Role-boundary enforcement for app-dev remains unverified. | **Blocking Stage 2 exit** | Use credentials assigned to each app role and verify denied unauthorized operations; do not infer runtime behavior from the role manifest. |
| Workspace plan/quotas and server-side SDK helper availability are unknown. | **Non-blocking for App development** | Read the selected plan and run quota/helper probes in Stage 3/5 before enabling workflows and recovery; do not infer plan behavior from the candidate SDK's static metadata. |
| Native Upsert overwrites immutable Journal fields. | **Blocking Stage 2 exit** | Resolve DATA-02 redelivery behavior and repeat the runtime probe on the selected target. Workflow branches/concurrency remain Stage 3 checks. |
| Backup/restore and full Codex lifecycle are untested; production deployment is unconfigured. | **Non-blocking for App development** | Verify restore in Stage 5 and full pilot lifecycle in Stage 7. Production remains outside this candidate until separately configured and reviewed. |
| Langfuse is not selected. | **Non-blocking for App development** | Decide/defer analytics and validate export/recovery in Stage 6; its failure must remain asynchronous under OPS-17. |

Stage 1 is **Completed — GO** and authorized App development. Stage 2 is **In progress**: installation, schema/relation readback, and unique duplicate rejection passed; Upsert immutability and runtime permissions block exit. Workflow checks remain in Stage 3; worker write-boundary integration remains in Stage 4. All 28 SAI statuses remain **Not verified**.

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
| SAI-13 — workspace schema and permissions | Authenticated app-dev metadata/schema readback returned the installed `Project`, `AiTask`, `AiRun`, and `AiRunJournal` objects and expected fields/relations. App role definitions scope operator to Journal read, Workflows to task/run/journal, and worker to Journal. Runtime role-assigned credential checks were not performed; the probe credential's effective role was not established. | **Partial.** App schema is installed and read back; least-privilege enforcement is not verified. SAI remains `Not verified`. |
| SAI-13 — SDK/server compatibility | Generated SDK `2.45.0` declares `>=2.40.0`; selected server `v2.45.6` is in range; official scaffold sync passed on `v2.45.8`. | **Partial.** Exact sync against `v2.45.6` is a Stage 2 entry check; this gate does not close SAI. |
| SAI-13 / SAI-18 — unique keys | Installed target rejected duplicate creates for `AiRun.runKey` and `AiRunJournal.operationKey` with unique-constraint violations. Disposable records were deleted. | **Runtime partial.** Duplicate rejection passed; SAI remains `Not verified` because other acceptance behavior is incomplete. |
| SAI-18 — record writes and relations | GraphQL create/readback confirmed Project→AiTask, AiTask→AiRun, and task/run→Journal links; all temporary records were deleted. | **Runtime partial.** Relation writes/readback passed; broader workflow acceptance remains untested. |
| SAI-18 — Upsert | Target GraphQL `createAiRunJournal(..., upsert:true)` accepted a repeated operationKey but changed `payload` from `immutable-v1` to `immutable-v2` and `resultCode` from `OK` to `ERROR`. | **Runtime failure against DATA-02.** Native Upsert does not preserve payload/terminal outcome; Stage 2 remains blocked. SAI status is unchanged. |
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

- Resolve the observed DATA-02 native Upsert overwrite behavior and verify immutable redelivery on isolated `v2.45.6`.
- Verify role boundaries using credentials assigned to operator, Workflows, and worker roles; confirm worker cannot update business lifecycle or unrelated Journal records/fields.
- Run the four workflow probes, including concurrent Dispatch, IF/else, scheduler behavior, and heartbeat storm prevention.
- Read the selected workspace plan and exercise relevant quota/rate-limit behavior.
- Pin the Codex CLI/app-server protocol and test a persistent thread, turn lifecycle, questions, interrupt, history reconciliation, and process shutdown without replaying execution.
- At Stage 6, choose the Langfuse deployment and SDK/API version or record that analytics are deferred.

Historical snapshot from 8 October: Stage 1 was complete with **GO** and Stage 2 was unblocked/Proposed. The 9 October exact-version entry check supersedes that status: Stage 2 is now **In progress**, blocked on the dedicated credential and exact sync. SAI-13, SAI-18, and SAI-20 remain **Not verified**.

## Coverage of the full OPS gate

The table below is the pre-installation snapshot; use the current [Stage 2 data model evidence](stage-2-data-model.md) for the installed app and runtime probes.

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

## Stage 2 entry recheck (9 October 2026)

This historical entry record is superseded by the current [Stage 2 data model evidence](stage-2-data-model.md).

- Started isolated disposable `twentycrm/twenty-app-dev:v2.45.6` as `twenty-stage2-appdev-v2456`, bound only to `127.0.0.1:2020`. `GET /healthz` returned HTTP 200. The primary Compose workspace was not used.
- Official scaffolder `create-twenty-app@2.45.0` generated `apps/twenty-app/` using Node `24.19.0` and Yarn `4.13.0`. `package.json` pins `twenty-sdk`, `twenty-client-sdk`, and `twenty-ui` to `2.45.0`; `yarn.lock` records those exact package versions. The `twenty` CLI binary is provided by the pinned `twenty-sdk@2.45.0`.
- An initial scaffold attempt against `http://host.docker.internal:2020` selected OAuth. A later official `yarn twenty dev` run against the local Docker target completed successfully; see the entry-check result above. During subsequent UI verification, an automation snapshot exposed the used API key in tool output. The value is not reproduced or recorded; the user authorized rotation and must perform the credential change under browser handoff policy.
- Read-only inspection of primary workspace Settings → MCP & APIs identified the `.env` credential entry as `Codex Local MCP`, Role `Admin`, Expiration `Never`. A read-only probe transmitting this primary Admin key to the separate disposable app-dev container was rejected by automatic approval review because its authorization/scope on that separate workspace is unverified. No transfer or probe occurred; no workaround was attempted.
- Stage 2 remains **In progress**. The credential was rotated and saved to host-managed Keychain; no secret was included in repository or knowledge-base records. Current installation and probe results, including the DATA-02 Upsert failure, are recorded in the Stage 2 report. All 28 SAI IDs and statuses are unchanged.
