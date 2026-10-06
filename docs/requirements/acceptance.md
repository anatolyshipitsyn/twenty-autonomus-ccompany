# Pilot acceptance

Version: 1.2 · Date: 6 October 2026 · Status: Not verified.

[Русская версия](acceptance.ru.md) · [All requirements](../requirements.md) · [PRD](../PRD.md)

## 1. Acceptance matrix

Identifiers and meaning of all 28 source criteria are preserved; provenance and SHA-256 are recorded in the [requirements register](../requirements.md). Every row is **Not verified**. Execute checks on a test repository/workspace with pinned versions; runtime evidence is mandatory.

| ID | Check | Expected result |
| --- | --- | --- |
| SAI-01 | Full Project → READY → specialist → PR → acceptance path | One run; agent, progress, checks, PR, and report saved; DONE only after operator decision |
| SAI-02 | Repeated polls and repeated authorization of the same command | One runKey, one execution; behavior persists after restart |
| SAI-03 | Answer a question and deny approval | Same run; the correct question gets its answer; denial is not treated as permission |
| SAI-04 | Codex or acceptance check failure | Run FAILED, task WAITING/ERROR; no automatic retry |
| SAI-05 | Rework after a successful run | New requestVersion and run; previous SUCCEEDED retained in history |
| SAI-06 | Cancel active execution | CANCELLED only after shutdown; repeated cancellation is safe |
| SAI-07 | SSH outage, including worker restart before recovery | No new Codex commands; outcome recovered from history/artifacts or WAITING/RECOVERY; journal synchronized without a repeated turn |
| SAI-08 | Worker restart and lost execution-start RPC response | Previous execution confirmed or WAITING/RECOVERY; no duplicate start |
| SAI-09 | Exhaust 60 minutes, including restart and human waiting | Budget retained; waiting excluded; shutdown and outcome recorded |
| SAI-10 | Second worker instance; unavailable/corrupt Twenty journal | Start blocked; no new Codex commands; no concurrent execution |
| SAI-11 | Stale answer/cancel/events and wrong version | Actions do not affect another run; terminal outcome is not overwritten |
| SAI-12 | SSH, API permissions, secrets, and sandbox | Forwarding restricted, keys inaccessible to Codex, prohibited repositories/actions rejected |
| SAI-13 | Workspace API and pinned Codex protocol | Three custom objects, relations, runKey/operationKey, permissions, PENDING recovery, RPC, events, answers, and interrupt verified on selected versions |
| SAI-14 | Repeated/concurrent workflow triggers and EVENT/APPLIED | One START/runKey; idempotent event application; no loops |
| SAI-15 | Workflow and worker permissions | Workflows apply business transitions; worker cannot change status or authorize retry |
| SAI-16 | Router and specialist profile | Allowed agentKey selected; instruction/question validated; STARTED assigns specialist; workflow owns lifecycle and acceptance is manual |
| SAI-17 | Manual Form: answer, denial, retry, and stale question | Question visible in card; Operator action validates task/run/questionId; pre-start router answer creates no Codex RESUME; duplicate/stale decisions rejected |
| SAI-18 | Unique indexes and Upsert | Duplicate keys rejected; redelivery does not overwrite outcome; four workflows operate without Jobs/KV or a separate orchestrator queue |
| SAI-19 | Native UI, history, and versions | Tasks, queue, journal, reports, and step history available without a separate frontend; version rollback does not replay old commands |
| SAI-20 | Twenty limits and selected server version | Quotas, permissions, and required SDK helpers actually available; quota failure creates no new Codex turn; polling/heartbeat creates no workflow storm |
| SAI-21 | Report, backup/restore, and private app | Concise report and allowed link available to operator; test restore retains journal; app update preserves history/secrets; no file upload required |
| SAI-22 | Langfuse: trace, version, and human score | Run linked to trace, template versions distinguished; tests and ACCEPT/REWORK delivered without duplicates; Langfuse failure blocks neither START, answer, RESULT, nor acceptance; export retried from Twenty after recovery |
| SAI-23 | Analytics completeness and secrets | Unknown tokens/cost remain empty; credentials not exported; first-pass uses tasks with decisions, attempts are not conflated, and unfinished tasks shown separately |
| SAI-24 | Project and GitHub repository | Project mandatory; missing/inaccessible repository blocks START; Project repository changes do not modify active run snapshot |
| SAI-25 | Specialist selection and acknowledgement | Router selects allowed profile; STARTED moves task to RUNNING and shows agent; selection failure starts no executor |
| SAI-26 | Handoff and recovery | A → B within the same task/run/worktree; old turn finished; assignmentVersion/context saved; duplicates, stale answer/result, and restart do not start a second specialist |
| SAI-27 | PR creation and GitHub failure | One PR after checks in correct repository/base/head; ambiguous response triggers an existing-PR lookup; publication retry does not repeat Codex; link/report saved, description preserved |
| SAI-28 | Ten-step operator journey | Project creation, routing, progress, human input, continuation, handoff, and PR verified end to end; specialist history present in Journal/Langfuse |

For every SAI, retain:

- environment/config versions
- preconditions and steps
- expected/actual outcome
- task/runKey/operationKey/assignmentVersion
- sanitized API/Journal/RPC evidence
- check results
- PR URL where applicable

For cancellation/recovery, include proof of shutdown or an existing previous turn and absence of duplicates; heartbeat/PID alone is insufficient. For analytics, retain IDs/decisions, completeness, and failure scenario. For backup, retain test restore evidence.

Verification states:

- **Met** — expected outcome proven
- **Partially met** — only part proven
- **Not verified** — insufficient execution
- **Not met** — a confirmed mismatch with defect/evidence

Static documentation checks do not close SAI. Pilot acceptance requires all 28 criteria to be met; criterion/scope changes must be explicit in both language versions.

## 2. P2 regression scenarios

These scenarios clarify the existing criteria; they introduce no new SAI identifiers. They remain Not verified until an integration run provides evidence.

Publication retry under SAI-27:

- Simulate a confirmed GitHub publication failure saved as APPLIED/ERROR. Authorize retry: one new operationKey, the same publicationKey/runKey/requestVersion/repository/base/head, and retryOfOperationKey referencing the old command. Preserve the old acknowledgement and prepared changes; start no Codex turn.
- Submit the same retry action twice and redeliver its command. Observe one new command attempt; after APPLIED, delivery returns its saved outcome without re-execution.
- Lose the GitHub response after PR creation. Reconcile the original PENDING operation and deliver the existing PR URL without creating a new PR or attempt. If lookup remains inconclusive, keep the operation unresolved and start no retry.
- Before an authorized new attempt publishes, verify the existing-PR lookup; assert one PR and saved PR_CREATED/RESULT.

Retention under SAI-21, SAI-22, and SAI-23:

- Advance beyond the configured technical retention period with a SUCCEEDED run and a task still WAITING/REVIEW. Run cleanup; verify that the run, PR, checks, snapshot/version references, and required Journal evidence remain queryable. Exercise ACCEPT and REWORK on separate fixtures.
- Keep Langfuse unavailable beyond that period, including an ACCEPT/REWORK decision awaiting export. Run cleanup and restart the exporter; verify delivery from retained facts/checkpoints using the original trace/observation/score IDs without duplicates.
- Retain a task with multiple attempts, including FAILED/CANCELLED older than the technical retention period. After cleanup, verify preserved assignment/version history and available cost/time facts across all attempts for first-pass and cost attribution.
- Perform backup/restore after cleanup; verify the protected audit minimum, pending export checkpoints, and idempotent publication outcomes survive.
