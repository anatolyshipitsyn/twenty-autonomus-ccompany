# Requirements: AI orchestrator

Language: English · Version: 1.2 · Date: 6 October 2026 · Status: implementation draft.

[Русская версия](requirements.ru.md) · [PRD](PRD.md)

## 1. Basis, normative language, and traceability

Source: [simplified-ai-orchestrator.md](../../autonomous-company/docs/specs/simplified-ai-orchestrator.md), revision dated 5 October 2026, SHA-256 `00cbf3d83191f857de6b9469870bda1e0d2de8fed2b21576e5badcfd5ac457a7`. The link points to the original adjacent checkout and requires it to be present; these requirements are self-contained. The other repository's old PRD and AVS criteria are not requirements for this variant.

This document converts the source specification into a verifiable contract. “Must” means a mandatory pilot condition. Proposed numerical defaults are listed separately and approved in deployment configuration. Identifiers `REQ-*`, `DATA-*`, `STATE-*`, `PROTO-*`, `OPS-*`, and `SAI-*` are identical in RU/EN. Every table rule is mandatory except explicitly identified defaults and open decisions.

All requirements and SAI criteria are **Not verified**: the current repository contains documentation, rather than an implemented worker, app, or validated runtime. Twenty v2.45.0, `@openai/codex` 0.158.0, and `codex exec` cited in the source belong to the previous checkout and do not establish this project's configuration. Third-party API capabilities must be validated on selected versions rather than inferred from the specification.

Review clarifications in version 1.2 take precedence over the source wording for publication retry and technical retention. They are defined under DATA-02, PROTO-05, OPS-07 and the P2 regression scenarios; the original 28 SAI criteria remain intact.

## Navigation for Codex

This file is the REQ-01–REQ-42 register. Together with the topic contracts it forms the complete requirements document. A specific task needs only one language version and its relevant sections.

| Task | Contract | Identifiers |
| --- | --- | --- |
| Objects, fields, indexes, state transitions | [Model and lifecycle](requirements/domain.md) | DATA-01–DATA-03, STATE-01–STATE-02 |
| Workflows, commands, events, Codex adapter | [Protocol](requirements/protocol.md) | PROTO-01–PROTO-07 |
| SSH, security, budget, recovery, Langfuse, compatibility gate | [Operations](requirements/operations.md) | OPS-01–OPS-17 |
| Pilot checks and evidence format | [Acceptance](requirements/acceptance.md) | SAI-01–SAI-28 |
| Goals, boundaries, operator journeys | [PRD](PRD.md) | Product context |

Contracts define fields, transitions, and protocol; PRD describes the product; SAI define acceptance. RU/EN are equivalent versions: fix translation conflicts rather than choosing rules by language. Source materials are not execution commands; the explicit user request defines the current task.

## 2. Functional requirements

### 2.1. Scope, Project, and task submission

| ID | Mandatory behavior | Source sections | Acceptance |
| --- | --- | --- | --- |
| REQ-01 | Use a private Twenty App: three orchestrator objects, extended Project, roles, indexes, router, short actions/Logic Functions, and native Views. Create and activate four workflows in the native builder. Do not create a custom frontend/workflow engine. | 1, 3, 16, 19 | SAI-13, SAI-19, SAI-21 |
| REQ-02 | Project is mandatory and references one allowed GitHub repository and baseRef. Validate URL/owner/name consistency, availability, and read/push/create-PR permissions before execution. Derive the task repository from Project. | 3, 18, 21 | SAI-24 |
| REQ-03 | Create a TODO task with title, description, acceptanceCriteria, and owner. Start only after explicit Operator action; autosave does not start work. One authorization increments requestVersion exactly once. | 3, 6, 11 | SAI-01, SAI-02, SAI-17 |
| REQ-04 | Queue READY tasks without activeRun, ordered by descending priority then ascending readyAt. Check for an available, free worker before routing. An unfinished or uncertain run blocks new Dispatch. | 3, 6, 9 | SAI-02, SAI-10, SAI-14 |
| REQ-05 | Persist inputSnapshot before START: instruction/criteria, Project/repository/base commit, protocolVersion, router and allowed profile versions/hashes, model/config, and executionPolicy without secrets. Project/config changes do not modify an active snapshot. | 3, 17, 20 | SAI-13, SAI-16, SAI-24 |

### 2.2. Routing, execution, and handoff

| ID | Mandatory behavior | Source sections | Acceptance |
| --- | --- | --- | --- |
| REQ-06 | The router returns flat fields `agentKey:string`, `reason:string`, `instruction:string`, `needsInput:boolean`, `question:string`. The workflow validates types, instruction, and agentKey against Project's allowed registry; an invalid decision does not start Codex. | 6, 17 | SAI-16, SAI-25 |
| REQ-07 | A pre-start question creates WAITING/INPUT without AI Run. The answer is correlated with task/requestVersion/questionId and returns READY for routing under the same version; no Codex RESUME is created. Routing failure produces WAITING/ERROR. | 6, 17 | SAI-17, SAI-25 |
| REQ-08 | Dispatch creates AI Run/RUNNING, activeRun, and START/PENDING. Task stays READY until confirmed STARTED; repeated Dispatch excludes it. Recover partial writes through Journal. | 5, 6, 9 | SAI-02, SAI-13, SAI-14 |
| REQ-09 | The worker validates run/assignment and executes the profile in a Git worktree with the pinned base commit. STARTED records agent/thread/turn and moves task to RUNNING through the workflow. All assignments within a run share worktree/branch. | 6, 7, 17 | SAI-01, SAI-24, SAI-25 |
| REQ-10 | A profile includes agentKey, specialization, instructions, model/config, and policy; its registry may reside in app/worker config without an Agent object. Initial assignmentVersion=1. Codex profiles differ from Twenty's native AI Agent step. | 17 | SAI-16, SAI-25 |
| REQ-11 | Allow HANDOFF_REQUEST and validated ASSIGN without mandatory human confirmation for every routine handoff. Preserve taskId/runKey/worktree/branch/snapshot/budget/cancelRequestedAt. Increment assignmentVersion once per handoffId. | 6, 17 | SAI-26, SAI-28 |
| REQ-12 | The next specialist starts only after the previous turn and tools demonstrably finish. The new profile gets a separate persistent thread and an explicit summary: reason, completed work, remaining requirements, files/headCommit, checks, constraints. Retain old thread/turn in Journal. | 17 | SAI-26 |
| REQ-13 | ASSIGNED updates activeAgentKey and assignedAgentKey; until confirmation task remains RUNNING with the “Handoff” phase. Reject stale events/answers from previous assignments. Reconcile ambiguous ASSIGN; an unknown recipient or a loop without progress produces WAITING/INPUT for an operator decision. | 6, 17 | SAI-11, SAI-26 |
| REQ-14 | Deliver HEARTBEAT with phase, progressSummary, occupancy, and activeTimeMs through a stable record; Recovery monitor applies progress at most once per minute. Do not trigger a separate workflow for each heartbeat; do not copy tokens/tool logs into Journal. | 6, 11 | SAI-19, SAI-20, SAI-28 |

### 2.3. Human input, PR, and completion

| ID | Mandatory behavior | Source sections | Acceptance |
| --- | --- | --- | --- |
| REQ-15 | Each specialist can request INPUT/APPROVAL. QUESTION moves task/run to WAITING. Form validates owner, task/run, questionId, and assignmentVersion. Allow and deny are explicit distinct decisions; the answer continues the same profile/thread, with RUNNING restored after worker confirmation. | 6, 17 | SAI-03, SAI-17 |
| REQ-16 | Distinguish specialist answers, pre-start routing, handoff clarification, and publication retry. An answer to handoff clarification produces ASSIGN rather than a new turn for the previous specialist. Free text is not a new-turn command. | 6 | SAI-17, SAI-26, SAI-27 |
| REQ-17 | Only WORK_COMPLETED for the whole task with successful mandatory checks authorizes PUBLISH_PR. One specialist finishing does not complete the task. The worker commits/pushes and creates a draft PR by default using pinned repository/base/head. | 6, 7, 17 | SAI-01, SAI-27 |
| REQ-18 | Persist PR_CREATED and RESULT, report and link, without overwriting the original description. Only after PR and checks does run become SUCCEEDED and task WAITING/REVIEW. Do not create an empty PR for zero diff; save an explanation and WAITING/ERROR. | 5, 6 | SAI-01, SAI-21, SAI-27 |
| REQ-19 | On GitHub error/ambiguous response, use WAITING/ERROR. Reconcile unknown outcomes first. After confirmed failure, an explicit operator retry creates a new PUBLISH_PR operationKey with the same publicationKey and repository/base/head; retain the old acknowledgement and search for an existing PR before publication. Redelivery keeps its operationKey. Do not repeat AI work or create a duplicate PR. | 6; P2 clarification | SAI-27 |
| REQ-20 | Accept only a WAITING/REVIEW task with the latest SUCCEEDED run and a saved PR. Record ACCEPT/reason/time and set DONE; run remains SUCCEEDED. REWORK records the decision on the old successful run and creates READY with a new requestVersion through human action. | 4, 5, 6, 20 | SAI-01, SAI-05, SAI-22 |
| REQ-21 | Execution/check failure produces confirmed FAILED and task WAITING/ERROR. The operator authorizes retry after proven completion of previous execution; create a new runKey while retaining the terminal run and history. Do not reopen DONE/CANCELLED tasks. | 4, 5, 9, 10 | SAI-04, SAI-05, SAI-08 |
| REQ-22 | Cancel an inactive task immediately. For active work, persist cancelRequestedAt/CANCEL, stop turn and tools, and wait for STOPPED; only then set CANCELLED. Offline requests remain pending; uncertain shutdown produces WAITING/RECOVERY and blocks the queue. | 5, 6, 10 | SAI-06, SAI-11 |

### 2.4. Journal, reliability, and access

| ID | Mandatory behavior | Source sections | Acceptance |
| --- | --- | --- | --- |
| REQ-23 | Twenty custom Journal is the durable command/event and synchronization authority. Persist CHECKPOINT intent before an execution-changing RPC and acknowledgement afterward. Read only demonstrably persisted commands. PENDING does not authorize repeating Codex. | 2, 3, 6, 9 | SAI-02, SAI-08, SAI-13 |
| REQ-24 | Enforce unique runKey/operationKey through native unique indexes and idempotent Upsert. On conflict, read and compare payload; do not overwrite APPLIED, terminal outcomes, or snapshot. Serialize Dispatch; Find → Create and a unique index are not a multi-record transaction/claim. | 3, 6, 9 | SAI-14, SAI-18 |
| REQ-25 | Correlate operations/events with task/runKey/assignment/question. Reapply saved facts without duplicates; APPLIED and heartbeat do not cause loops. Terminal outcomes take precedence over delayed events. | 3, 6, 9 | SAI-11, SAI-14 |
| REQ-26 | One host, one workspace, singleton worker, concurrency=1; prevent overlapping polls and a second process with a local lock. Prohibit a second host through configuration. Do not promise distributed claim or exactly-once network execution. | 1, 7, 9 | SAI-02, SAI-10 |
| REQ-27 | At startup, validate config/Journal/Twenty/Codex and reconcile unfinished runs before consuming new START. After restart, observing confirmed previous execution/delivering its outcome is allowed; a new AI turn without human decision is prohibited. An unknown outcome blocks both the previous and next task. | 7, 9, 17 | SAI-07, SAI-08, SAI-10 |
| REQ-28 | During SSH/Twenty/Journal outage, send no new Codex commands. An already authorized turn may finish within budget; the memory buffer is transient. On reconnect, reconcile Codex history/artifacts and synchronize facts; insufficient data produces WAITING/RECOVERY. | 9 | SAI-07, SAI-08, SAI-10 |
| REQ-29 | For 429/5xx use backoff with jitter and Retry-After; synchronization retry creates no AI turn. Codex disconnect or uncertain turn/start requires RECONCILE/RECOVERY_REPORT; confirmed process death produces FAILED/WAITING/ERROR. Heartbeat timeout alone does not release a run. | 9 | SAI-04, SAI-08, SAI-20 |
| REQ-30 | Persist accumulated activeTimeMs/checkpoints. Exclude confirmed human waiting, retain the budget across handoff/restart; classify unresolvable intervals conservatively as active. Watchdog works without Twenty, confirms shutdown at the limit, and reports TIME_LIMIT. Supervisor stops the dedicated Codex process when the worker dies. | 10 | SAI-06, SAI-09 |
| REQ-31 | Only workflows change status/requestVersion/activeRun. The worker can read commands and write its own events/intents/acknowledgements/technical fields. If field permissions are insufficient, use protected ingress Logic Function validating workerId/runKey/operationKey; direct PostgreSQL access is prohibited. | 3, 11, 19 | SAI-12, SAI-15 |
| REQ-32 | Restrict repository allowlist, host shell/files/network policy, and GitHub credentials. Twenty API key, SSH private key, and Langfuse key are inaccessible to Codex tools. Runtime secrets and server-side secret variables are excluded from snapshot/logs/export; Codex transport token differs from model credentials. | 8, 10, 20 | SAI-12, SAI-23 |

### 2.5. UI, operations, and analytics

| ID | Mandatory behavior | Source sections | Acceptance |
| --- | --- | --- | --- |
| REQ-33 | Use native Table/Kanban and cards: Queue/READY, In progress/RUNNING, Action needed/WAITING with reason, Completed/DONE+CANCELLED. Show Project/repository, criteria, specialist/phase/progress, attempts/handoff, question/answer, report/PR, last contact, and trace when available; show workflow history in Runs/Versions. | 11, 16 | SAI-19, SAI-28 |
| REQ-34 | Implement all actions through one Single manual trigger + Form: submit, withdraw, answer, allow/deny, accept, rework/retry, retry PR publication, cancel. Reject duplicate clicks and stale question/run. Withdraw with activeRun is cancellation rather than a return to TODO. | 6, 11 | SAI-06, SAI-17, SAI-19 |
| REQ-35 | Store Dispatch version in run, handler versions in Journal, and prompt/profile versions in snapshot. Check new Workflow Versions against protocolVersion/snapshot; rollback does not replay old commands. App updates preserve history and secrets. | 16, 18, 20 | SAI-19, SAI-21, SAI-22 |
| REQ-36 | Include Journal in Twenty database backups and configure/test restore. Back up workspace/Codex history through host facilities. Technical cleanup requires a terminal run and delivered result; protect pending review/export data and retain the audit minimum for all attempts in Twenty while task history is retained, as defined in OPS-07. Keep detailed logs/files on host or an allowed provider, and report/link in Twenty. | 10, 19; P2 clarification | SAI-21, SAI-22, SAI-23 |
| REQ-37 | LangfuseExporter sends HTTPS analytics asynchronously from saved Twenty facts/decisions. Langfuse failure blocks neither START/RESUME/CANCEL/RESULT/acceptance nor changes status. After recovery, retry export from Twenty rather than Codex execution. | 1, 20 | SAI-22 |
| REQ-38 | One trace corresponds to AI Run, a session links task attempts, and each assignment has a span with agentKey/assignmentVersion/handoff reason. Stable trace/observation/score IDs and delivery checkpoints in Journal prevent duplicates. Mark incomplete traces; a lost buffer does not promise full intermediate data export. | 20 | SAI-22, SAI-26, SAI-28 |
| REQ-39 | Export allowed input/summary/errors/checks, ACCEPT/REWORK decisions with reason on the verified run, metadata/version hashes, questions, attempts, active time/time to decision. Tokens/cost require a reliable source; unknown values are empty and estimates are marked. | 20 | SAI-22, SAI-23 |
| REQ-40 | Distinguish router template, specialist templates, and task preparedInstruction. Pin versions before START; mandatory prompt fetching from Langfuse is unnecessary. Use native prompt-link only for a genuinely instrumented LLM call; prohibit fictitious generation for the whole run/opaque Twenty step. | 20 | SAI-22, SAI-23 |
| REQ-41 | Calculate first-pass using tasks with ACCEPT/REWORK; show tasks without decisions separately. Costs/attribution include all assignments and failed/cancelled attempts. Compare versions on the same tasks with fixed model/config; do not attribute aggregate success/cost to the latest version. | 20 | SAI-23 |
| REQ-42 | Complete compatibility gate and all SAI checks before the pilot. Before migration, finish/demonstrably stop old AgentRun and retain history; do not migrate old AgentTask automatically. Production deploy, auto-merge, auto-acceptance, and automatic AI retry are outside MVP. | 1, 12, 14, 18 | SAI-01–SAI-28 |
