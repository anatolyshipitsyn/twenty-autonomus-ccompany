# Workflows and execution protocol

Version: 1.2 · Date: 6 October 2026 · Status: Not verified.

[Русская версия](protocol.ru.md) · [All requirements](../requirements.md) · [PRD](../PRD.md)

## 1. Workflows and protocol

### Four workflows

| ID | Workflow / trigger | Responsibility |
| --- | --- | --- |
| PROTO-01 | Operator action / Single manual trigger + Form | All operator actions, permissions, and correlation; one authorization version per action key |
| PROTO-02 | Dispatch / Schedule | READY without activeRun, free worker, Project validation, router, snapshot, run, and START; serialized Dispatch |
| PROTO-03 | Apply worker event / new Journal business EVENT | Idempotent application of STARTED/QUESTION/ASSIGNED/RESULT, HANDOFF_REQUEST → ASSIGN routing, WORK_COMPLETED → PUBLISH_PR, PR_CREATED and outcome |
| PROTO-04 | Recovery monitor / Schedule | Last contact/progress, reapplication of persisted facts, RECONCILE on reconnect, and WAITING/RECOVERY on unknown outcome |

Schedule defaults to every minute; validate schedule timezone in compatibility gate. Heartbeat/APPLIED and technical exports do not trigger business loops.

### Journal operations

**COMMAND**

- `START`
- `RESUME`
- `ASSIGN`
- `PUBLISH_PR`
- `CANCEL`
- `RECONCILE`

**EVENT**

- `STARTED`
- `QUESTION`
- `HANDOFF_REQUEST`
- `ASSIGNED`
- `WORK_COMPLETED`
- `PR_CREATED`
- `RESULT`
- `ERROR`
- `STOPPED`
- `HEARTBEAT`
- `RECOVERY_REPORT`
- `CHECKPOINT`

`PROTO-05`: PENDING denotes an unacknowledged command/unprocessed event; APPLIED denotes an executed command/applied event. ACK includes resultCode OK/ERROR/REJECTED; PENDING after a network error is an unknown outcome. operationKey remains stable on delivery; validate task/runKey/assignmentVersion/questionId/handoffId as applicable. Reject wrong versions or conflicting payloads while retaining diagnostics.

PUBLISH_PR recovery and retry:

1. Redelivery of an APPLIED operation returns the saved outcome; it does not execute the command again or change its acknowledgement.
2. For PENDING with an unknown GitHub outcome, reconcile the existing attempt and look up the PR by repository/base/head. If found, deliver PR_CREATED/RESULT without creating another PR. If lookup is inconclusive, keep the operation unresolved; do not start a new attempt.
3. Only after a confirmed failure has been saved as APPLIED/ERROR may Operator action authorize a new command attempt. One operator action produces one new operationKey and records publicationKey/retryOfOperationKey. Duplicate submissions reuse that attempt.
4. Before the new attempt publishes, search again for an existing PR. Reuse the same runKey, requestVersion, repository/base/head and already prepared changes; preserve any known headCommit. Do not start a Codex turn, recreate changes, or reset the run budget.
5. Persist the new attempt's intent and acknowledgement independently of the previous command. Workflow applies a confirmed publication outcome to the same AI Run / AI Task; a retry does not create a new engineering run.

`PROTO-06`: the adapter uses:

- agreed handshake `initialize`/`initialized`
- persistent `thread/start`
- `turn/start`
- events
- questions/approval
- `turn/interrupt`
- thread reads for reconciliation

Ephemeral mode is prohibited. If selected, WebSocket listens on loopback and requires a transport token. Validate exact RPC/event schemas, RESUME confirmation, and turn recovery on the pinned version; no continuation event name is invented. Compatibility gate separately checks the source's stated experimental app-server/WebSocket status and pilot suitability.

`PROTO-07`: NestJS components:

- TwentyClient (pagination/timeouts)
- CommandExecutor (sequential commands)
- CodexClient
- WorkspaceService
- AgentExecutor
- GitHubPublisher
- RunJournal
- LangfuseExporter

They do not contain a custom business workflow engine. A polling scheduler does not replace an overlap lock. Core API serves records, Metadata API serves initial setup; obtain routes and filters from target schema.
