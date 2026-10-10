# Stage 2 data model and isolated installation evidence

Date: 10 October 2026 · Status: **Completed** · Target: disposable Twenty App Dev `v2.45.6`

[Russian version](stage-2-data-model.ru.md) · [Roadmap](../ROADMAP.md) · [Domain contract](../requirements/domain.md) · [Acceptance register](../requirements/acceptance.md)

## Result

The private App source is in `apps/twenty-app` and was synchronized only to the isolated, non-production target at `127.0.0.1:2020`. The App defines three orchestrator objects (`AiTask`, `AiRun`, `AiRunJournal`) and the related business object `Project`. Locked direct versions are `twenty-sdk@2.45.0` (including the CLI), `twenty-client-sdk@2.45.0`, and `twenty-ui@2.45.0`; the successful run used Node.js `v24.19.0` and Yarn `4.13.0`.

The required entry check used the official Twenty scaffolder and `yarn twenty dev --once` against the selected `v2.45.6` server. The CLI completed the sync, uploaded 3 files, synchronized the manifest, and generated the API client. The persistent CLI credential was not used for this run: a mode-`600` temporary config sourced from Keychain was removed when the command exited. No production workspace, Stage 3 Workflow configuration or operator UI, worker service, queue, Codex app-server, analytics, or deployment was added.

## Runtime evidence

- Target metadata and generated API schema read back `AiTask`, `AiRun`, and `AiRunJournal` with the contract fields, plus `Project` as a related business object. Create/readback probes verified `Project → AiTask`, `AiTask → AiRun`, and `AiTask/AiRun → AiRunJournal`; relation IDs matched their linked records.
- Unique indexes on `AiRun.runKey` and `AiRunJournal.operationKey` rejected duplicate creates. A duplicate Journal POST returned HTTP 400 with a database unique-constraint error.
- A full-payload Journal Upsert can overwrite `payload` and terminal `resultCode`; it is unsafe for redelivery. Key-only and sparse `{ operationKey, taskId }` Upserts preserved the stored `payload`, `resultCode`, `state`, and relation. A duplicate Workflows delivery with the same `operationKey` was rejected. These checks establish target storage behavior; they do not implement or prove a future Worker consumer's redelivery logic.
- Workflows API probes read Task/Run, applied an authorized Task transition and version update with readback, created/read back a linked `AiRun`, and created a synthetic PENDING Journal entry. Workflows applied `APPLIED` with `resultCode=OK`; readback succeeded. These were API permission probes only; no Workflows were configured in Stage 2.
- An Operator API key read Journal successfully (HTTP 200); Journal POST and PATCH were denied (HTTP 400 `PERMISSION_DENIED`). The temporary API-key role-assignability setting was restored to `false` and was absent from the role chooser. No Operator UI or views were configured.
- With the updated Worker role, `GET /rest/aiRunJournals` returned HTTP 200 and exposed the new synthetic PENDING row with a non-empty `workerId`. Worker POST of a synthetic `STARTED` Journal event returned HTTP 201; readback returned HTTP 200. PATCH of `activeTimeMs` and `checkpointAt` returned HTTP 200, and readback matched.
- Worker PATCH of the synthetic `AiTask.status` to `RUNNING` returned HTTP 400 `PERMISSION_DENIED`. Worker PATCH of its Journal row to `state=APPLIED` was rejected (HTTP 400) because the resulting row leaves the role's PENDING row-level scope.
- A direct Worker PATCH of the existing PENDING Journal `payload` returned HTTP 200. The synthetic payload was restored and read back. This confirms the accepted Twenty limitation: the role can write fields needed for event creation and cannot enforce write-once fields on existing in-scope rows. The consumer must compare an existing `operationKey` and payload before acting, and must preserve applied/terminal outcomes on redelivery. This consumer behavior belongs to the later worker stage and is not implemented here.
- The prior Worker `UNAUTHENTICATED` observation was a malformed row-filter value, not evidence of an ACL rejection: the target expected a JSON array for `state IS`, but received bare `PENDING`. The manifest now supplies `['PENDING']`; Worker authentication and the exact-target sync both succeeded.
- An empty RAW_JSON payload `{}` sent through REST returned HTTP 400 because the target persisted it as null and violated the non-null column constraint. A non-empty synthetic payload succeeded; no workaround field was added.
- During UI inspection, the value of an Admin API key was inadvertently included in an accessibility result. That key was revoked; its value was not copied into repository files or Notion. The owner confirmed that this disposable workspace will be removed after Stage 2 and that remaining temporary test credentials may stay until teardown. The default persistent CLI config currently reports `api-key (invalid)`; the exact-target sync succeeded using the temporary Keychain-sourced config described above.
- Synthetic test records remain in the disposable workspace, including the current Worker probe. The target is isolated from production. No secret or bearer value is recorded here.

## Exit criteria and follow-up

Stage 2 exit criteria are **met**: the isolated App was synchronized to the selected server, schema and relations were read back, unique indexes and duplicate rejection were verified, supported Upsert behavior was tested, and Operator/Workflows/Worker permission boundaries were exercised with synthetic records. The accepted native permission limitation is documented in the domain contract.

The following work remains outside Stage 2 and does not block the data-model installation:

- The later Worker implementation must compare stored operation keys and payloads on redelivery, return the saved outcome for an exact duplicate, reject a payload mismatch, and never re-execute an applied operation. Only the target's storage primitives and permissions were tested here.
- Workflow configuration, business transitions and the operator experience belong to Stage 3. No Workflows or operator UI were implemented in this stage.
- All 28 SAI IDs and statuses remain unchanged and **Not verified**; no full SAI run was performed. SAI-13, SAI-15, SAI-18, and SAI-24 are not closed by these Stage 2 probes.
- Stage 2 does not implement the Worker service, queue, Codex app-server integration, analytics, reporting, backup/restore, or production deployment.
