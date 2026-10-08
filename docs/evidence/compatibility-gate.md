# Compatibility gate — current findings

Date: 8 October 2026 · Scope: pre-implementation checks in OPS compatibility gate; mapped plan row SAI-13, SAI-18, SAI-20 · Status: **NOT PASSED — PARTIAL EVIDENCE**

[Русская версия](compatibility-gate.ru.md) · [Operations contract](../requirements/operations.md) · [Protocol contract](../requirements/protocol.md) · [Acceptance matrix](../requirements/acceptance.md)

## Verdict

The configured self-hosted Twenty server is healthy. Authenticated MCP access works with the locally stored `TWENTY_API_KEY`: the workspace exposes 28 standard object metadata names, one workspace member, two role definitions, and no workflows. The expected `AiTask`, `AiRun`, `AiRunJournal`, and `Project` objects are absent because their Twenty app has not yet been developed and installed; this is expected at the current stage, not evidence of server incompatibility. A scoped Company create/update/read-back/soft-delete probe passed, and follow-up searches found no remaining probe records.

The gate remains **NOT PASSED — PARTIAL EVIDENCE**: the SDK is not pinned or installed; the app that defines contract-specific objects and workflows still needs development and installation; the API key role assignment and workspace plan/quotas are not exposed by the MCP toolset; and Codex app-server runtime lifecycle was not exercised. No app, custom object, or workflow was installed or changed. Two temporary Company records were soft-deleted during the previous probe; in the current run one additional record passed create/update/read-back/soft-delete, and the post-delete search found 0 visible records. The secret was not printed or recorded.

## Environment snapshot

| Component | Observed value | Evidence / qualification |
| --- | --- | --- |
| Orchestrator repository | `main`, `9d33725241e62e17fb73a0732321dc32bb23834b` | Checkout at time of check |
| Twenty server and worker | `twentycrm/twenty:v2.45.6`, image digest `sha256:dca6d82985901468b391c0335aa8f0519a52b9809709e66f2de1dbff04351e53` (local image ID `sha256:ff1d85a1f029d99be27adf7b877362fe84c2870cdc9d3be15cd54a2026c0c15f`) | Server and worker use the same image. Server is healthy; worker is running. PostgreSQL and Redis are healthy. ARM64 host. Observed 8 Oct 2026. |
| Authenticated Twenty MCP | Protocol `2025-06-18`; server `Twenty MCP Server 0.1.0`; 28 standard object names; 1 workspace member; 2 roles; 0 workflows | Accessed using local `.env` key without displaying it. Key-to-role assignment and plan are not exposed by the current toolset. |
| Database / cache | PostgreSQL `16`; Redis `7-alpine` | Running Compose images |
| Docker Compose | `v5.5.1` | Local CLI |
| Twenty SDK candidate | `twenty-sdk@2.46.0`, Twenty source checkout `a3e874920cfa319c7c8683e020b65795d6193af8` | Candidate only; not installed or pinned by this project. Its package declares `engines.twenty >=2.40.0`, so `v2.45.6` is inside the declared range. This is not an install/runtime proof. |
| SDK toolchain | SDK declares Node `^24.5.0`, Yarn `^4.0.2`; host Node `v22.22.3`, Yarn `4.13.0`; bundled Node `v24.19.0` | Host Node does not satisfy the SDK engine; bundled Node does. `yarn install --immutable` completed, but Nx did not reach the `twenty-sdk` target: it stalled at `twenty-shared:generateBarrels` and was stopped. Temporary `node_modules` was removed; the Twenty checkout has no source or lockfile changes. |
| Codex | `codex-cli 0.160.1` | `codex app-server --help` labels app-server experimental. `initialize` returned without an RPC error. Generated experimental schema SHA-256: `e77b7d1436a78f431a74b2cb263a862e92ae40d70411bc63835b47ab2168827c`. |
| Langfuse | Not selected / not configured in this repository | SDK/API version, deployment, and permitted data remain open. |

## Checks

| Requirement | Check and observed result | Assessment |
| --- | --- | --- |
| SAI-13 — target server/API | Current `docker compose ps` shows `v2.45.6`; server, PostgreSQL, and Redis are healthy, and worker is running. `GET /healthz` returned HTTP 200 and `{"status":"ok",...}`. Earlier unauthenticated GraphQL `POST /graphql` with `{__typename}` returned HTTP 200 and `Query`. | **Partial.** Proves current health and endpoint reachability, plus earlier basic GraphQL reachability only. |
| SAI-13 — workspace schema and permissions | Authenticated MCP returned 28 standard object metadata names; targeted metadata queries for `AiTask`, `AiRun`, `AiRunJournal`, and `Project` returned no matches. These objects are supplied by the app, which is not yet developed or installed, so their absence is expected. One workspace member was found. `list_roles` returned Admin and Member; both have global read/update/delete/destroy access and all tools, with no object-level rules. API-key role assignment and plan are not exposed. | **Partial.** MCP access and standard workspace metadata are verified; app-defined schema and least-privilege/key binding and plan remain to be verified after implementation and installation. |
| SAI-13 — SDK/server compatibility | Candidate SDK metadata declares `>=2.40.0`; configured server is now `v2.45.6`, which is inside the declared range. SDK install compatibility checks exist in the candidate CLI. | **Partial.** The exact SDK package is not pinned in this repository and was not installed against the running server. |
| SAI-13 / SAI-18 — unique keys | SDK source accepts `isUnique` for scalar fields and rejects it for relation/files fields; a source unit test covers unique text fields. | **Static evidence only.** No app was installed and duplicate-key rejection was not exercised on the running database. Source examined is the separate `twenty` checkout at the snapshot above, not the running `v2.45.6` source tag. |
| SAI-18 — record writes | Authenticated MCP Company probe passed create, update, read-back, soft-delete, and post-delete search (0 visible probe rows). | **Partial.** Confirms generic Company CRUD only; contract-object writes, unique indexes, duplicate rejection, relations, and Upsert/redelivery remain unverified. |
| SAI-18 — Upsert | The checked-out server source contains REST and GraphQL `upsert` request handling. | **Static evidence only.** Idempotency, immutable outcomes, duplicate delivery, and Upsert behavior were not run against the target server. |
| SAI-18 — workflows and concurrency | Authenticated MCP `list_workflows` returned 0 workflows. | **Not verified.** IF/else behavior, four-workflow triggers, serialization, concurrent Dispatch, permissions, and absence of workflow storms need a test workspace. |
| SAI-20 — plan, quotas, and SDK helpers | Workspace plan and quotas are not exposed by the current authenticated MCP toolset. | **Not verified.** Quota behavior and SDK helper availability on this server/plan were not tested. |
| Codex protocol portion of SAI-13 | `codex app-server --stdio` accepted `initialize` and `initialized`, returned an initialize response without an error, and exited 0 on EOF; the generated schema contains `thread/start`, `thread/read`, `turn/start`, and `turn/interrupt`. | **Partial.** Handshake and EOF process exit passed. Persistent thread, turn lifecycle, question/answer, interrupt, history reconciliation, and shutdown during an active turn were not run. The app-server is explicitly experimental. |

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
- `codex --version` — `codex-cli 0.160.1`.
- `codex app-server generate-json-schema --experimental --out /tmp/twenty-compat-gate-codex-schema` — succeeded; generated schema is temporary and not committed.
- `codex app-server --stdio` with `initialize` / `initialized` and EOF — exit 0; initialize response returned without an RPC error. This was a handshake probe, not a turn-lifecycle test.
- `node --version` / bundled Node executable — host `v22.22.3`; bundled `v24.19.0`.
- `yarn --version` — `4.13.0`.
- SDK source checkout `a3e874920cfa319c7c8683e020b65795d6193af8` contains `twenty-sdk@2.46.0` with `engines.twenty >=2.40.0`, Node `^24.5.0`, and Yarn `^4.0.2`; the range includes server `v2.45.6`. The checkout has no `node_modules`; the package is not installed and no app build/install was run.
- A temporary full Twenty checkout `yarn install --immutable` completed with peer-dependency warnings; `yarn.lock` remained unchanged. `nx build twenty-sdk --skip-nx-cache` started `twenty-shared:generateBarrels`, but the `tsx`/esbuild processes did not finish and the build was interrupted before reaching the SDK target. A direct Vite attempt from the earlier focused install could not resolve workspace import `twenty-shared/utils`. Temporary dependencies were removed; the Twenty checkout is clean.
- `gh auth status` — GitHub tokens for all configured accounts are invalid; active account `anatolyshipitsyn` cannot be used to verify repository rights or PR behavior.

## Remaining evidence needed

- Develop the Twenty app that defines `AiTask`, `AiRun`, `AiRunJournal`, `Project`, and the required workflows; pin its Twenty SDK version and run its build/install compatibility check against `v2.45.6`.
- Install the app in a non-production workspace, then verify its schema, relations, scalar unique indexes, duplicate rejection, Upsert/redelivery behavior, and permissions. The current MCP credential can write standard Company records; its assigned role and least-privilege posture still need independent verification.
- Run the four workflow probes, including concurrent Dispatch, IF/else, scheduler behavior, and heartbeat storm prevention.
- Read the selected workspace plan and exercise relevant quota/rate-limit behavior.
- Pin the Codex CLI/app-server protocol and test a persistent thread, turn lifecycle, questions, interrupt, history reconciliation, and process shutdown without replaying execution.
- Choose the Langfuse deployment and SDK/API version, or explicitly record that analytics are deferred for this gate.

Until those checks have evidence, SAI-13, SAI-18, and SAI-20 remain **Not verified**, and stage 1 must not be treated as passed.

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
| GitHub permissions and PR idempotency | Not tested; `gh auth status` reports the selected `anatolyshipitsyn` token is invalid | Not verified |
| Native UI and quotas | Workspace plan/UI not inspected | Not verified |
| Backup and restore | No backup/restore operation was run | Not verified |
| Search/Logic Function/schedule limits, Journal pagination, IF/else, permission enforcement | Not tested against the pinned server and workspace plan | Not verified |
| Long Codex execution on the host; worker-to-Twenty topology | No orchestrator worker exists; deployment topology is not configured | Not verified |

The planning record in Notion also says “full gate — all 28 SAI”. The Git acceptance contract treats all 28 SAI as pilot integration criteria, while OPS defines a compatibility check before implementation. This scope discrepancy must be resolved in the project knowledge base; no SAI status was changed here.
