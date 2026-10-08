# Project roadmap

Language: English · Date: 8 October 2026 · Status: proposed sequence; no dates or owners assigned.

[Русская версия](ROADMAP.ru.md) · [PRD](PRD.md) · [Requirements](requirements.md) · [Acceptance](requirements/acceptance.md)

This is the flat, sequential delivery plan. Requirements and linked contracts remain normative. The stage descriptions below use one template; detailed implementation rules stay in the contracts. A stage is complete only when its exit conditions have evidence. Static checks do not change SAI status. All 28 SAI criteria remain **Not verified** until the required integration evidence is recorded.

## Stages

1. **Pre-implementation compatibility gate**
   - **Goal:** establish a viable, bounded target for implementation.
   - **Work:** choose and record candidate Twenty/SDK/Codex protocol versions, host/workspace topology, repository policy, credentials approach, and deployment constraints; verify basic target reachability, API access, protocol handshake, and available GitHub access; list unresolved risks and checks that require the app.
   - **Deliverable:** versioned compatibility assessment with an explicit `GO` or `HOLD` decision for App development; app-dependent checks are carried to their dependent stages.
   - **Exit criteria:** issue `GO` only when the minimum compatibility prerequisites for App development have evidence and no known blocker remains. Classify every unresolved issue as blocking or non-blocking; a non-blocking issue needs a reason and a concrete verification step in its dependent stage. A `HOLD` or an unresolved blocker keeps this stage **In progress** and blocks Stage 2. The gate does not require proving app schema, workflows, quotas, backup/restore, or full Codex turn lifecycle before those components exist.
   - **Dependencies:** none.
   - **Verification/evidence:** sanitized environment/version inventory and actual API/protocol/GitHub probe results; distinguish static/source inspection from runtime evidence.
   - **Status:** **Completed — GO** — official Twenty App scaffold install and `yarn twenty dev` synchronization passed in an isolated app-dev server; selected server health/API, Codex initialize handshake, and GitHub push access were confirmed. Exact sync against selected server `v2.45.6` is a Stage 2 entry check; see [compatibility assessment](evidence/compatibility-gate.md).
   - **SAI mapping:** SAI-13, SAI-18, SAI-20 are related pilot criteria; no SAI is closed by this gate.

2. **Twenty App data model and installation**
   - **Goal:** persist the product entities and protect their integrity.
   - **Work:** pin the compatible SDK; implement Project, AI Task, AI Run, and AI Run Journal fields, relations, indexes, permissions, and required write operations; build and install the private App in an isolated workspace.
   - **Deliverable:** installed App with contract-aligned schema and documented version/configuration.
   - **Exit criteria:** schema, relations, unique indexes, duplicate rejection, Upsert/redelivery behavior, and permissions are verified against the selected server; test data and workspace are isolated from production.
   - **Dependencies:** Stage 1 explicit `GO`; a `HOLD` blocks this stage.
   - **Verification/evidence:** actual App build/install output, schema/API readback, duplicate and redelivery probes, and permission checks.
   - **Status:** **Proposed** — unblocked by Stage 1 GO; not started.
   - **SAI mapping:** SAI-13, SAI-15, SAI-18, SAI-24.

3. **Workflows and native operator experience**
   - **Goal:** implement business lifecycle and operator actions in Twenty.
   - **Work:** configure the four Workflows, routing/dispatch guards, recovery and progress monitoring, manual task actions, permissions, and native views/forms; validate repeated, concurrent, stale, and unauthorized actions.
   - **Deliverable:** usable task queue and operator path with workflow-owned business transitions.
   - **Exit criteria:** valid authorization creates one dispatch; invalid or stale actions do not change another task/run; routing and lifecycle decisions remain in Workflows; operator can see and perform the required actions in native Twenty UI.
   - **Dependencies:** Stage 2 data model.
   - **Verification/evidence:** workflow run history, controlled duplicate/concurrency probes, permission results, and UI evidence from the isolated workspace.
   - **Status:** **Proposed**.
   - **SAI mapping:** SAI-14, SAI-16, SAI-17, SAI-19, SAI-25.

4. **Worker and core vertical execution path**
   - **Goal:** complete one authorized task from dispatch through a reviewable result.
   - **Work:** implement the single-worker command loop and Codex adapter; persist intent before execution-changing RPCs; run one specialist in the task worktree; publish STARTED, checks, result, and a draft PR; expose the report and require human acceptance.
   - **Deliverable:** one end-to-end engineering attempt, with linked task/run/history, checks, draft PR, report, and human decision.
   - **Exit criteria:** a controlled test task reaches PR and manual acceptance; checks are recorded; an ambiguous execution start is reconciled rather than replayed. PR retry idempotency is hardened in Stage 6.
   - **Dependencies:** Stages 2 and 3.
   - **Verification/evidence:** sanitized integration run showing correlation IDs, task/run state, check results, PR link, and explicit human acceptance.
   - **Status:** **Proposed**.
   - **SAI mapping:** SAI-01, SAI-02, SAI-13, SAI-24, SAI-25, SAI-28; baseline PR flow from SAI-27.

5. **Reliability, human input, and recovery**
   - **Goal:** preserve safe execution across interruptions and human decisions.
   - **Work:** implement same-run questions/approvals and handoff, progress, cancellation, active-time budget, SSH/restart reconciliation, unknown-outcome queue holds, backup/restore, and retention behavior.
   - **Deliverable:** recovery and operator-control behavior that preserves identities, snapshots, history, and safety holds.
   - **Exit criteria:** outage, restart, cancellation, budget, handoff, and restore probes preserve required state; an unknown outcome blocks new execution and is never replayed; the next specialist starts only after the prior turn/tools finish.
   - **Dependencies:** Stages 2–4.
   - **Verification/evidence:** failure-injection and restore evidence with sanitized Journal facts, process/turn outcome, and queue state.
   - **Status:** **Proposed**.
   - **SAI mapping:** SAI-02–SAI-12, SAI-14, SAI-17, SAI-18, SAI-20–SAI-21, SAI-24–SAI-26, SAI-28.

6. **Reporting, idempotent publication, and analytics**
   - **Goal:** make delivery complete and analytics recoverable without coupling analytics to execution.
   - **Work:** finalize concise operator reporting; handle ambiguous PR responses and publication-only retries without rerunning Codex; add Langfuse trace/version/human-decision export with durable checkpoints and outage recovery.
   - **Deliverable:** reliable PR/report delivery and asynchronous, recoverable analytics export.
   - **Exit criteria:** duplicate/ambiguous GitHub responses resolve to one PR; publication retry does not create a new Codex turn; Langfuse outages do not block execution or acceptance; incomplete token/cost facts remain unknown.
   - **Dependencies:** Stages 4 and 5.
   - **Verification/evidence:** GitHub lookup/retry probes, report readback, and Langfuse delivery/recovery probes using stable IDs and sanitized data.
   - **Status:** **Proposed**.
   - **SAI mapping:** SAI-21–SAI-23, SAI-27.

7. **Integrated pilot and decision**
   - **Goal:** assess the complete product against the acceptance contract.
   - **Work:** run all acceptance scenarios in the selected non-production environment; record environment versions, preconditions, actual results, sanitized evidence, and limitations; obtain the human pilot decision.
   - **Deliverable:** complete acceptance register and documented pilot decision.
   - **Exit criteria:** each of the 28 SAI rows has evidence-backed status; unresolved failures/limitations and follow-up actions are explicit. No status is promoted based on documentation or configuration alone.
   - **Dependencies:** Stages 1–6.
   - **Verification/evidence:** completed [SAI-01–SAI-28 acceptance record](requirements/acceptance.md) with linked integration evidence.
   - **Status:** **Proposed**.
   - **SAI mapping:** SAI-01–SAI-28.

## Planning rules

- Stage order expresses dependencies, not a claim of current implementation progress. Stage 1 is complete with GO; Stage 2 is unblocked but not started. Stages 2–7 have no completion evidence in the current repository snapshot.
- Dates, estimates, and owners are not assigned. Assign them only when the team has agreed them.
- The OPS compatibility gate is a prerequisite and is distinct from the 28 pilot acceptance criteria. The Notion planning records previously conflated these scopes; keep all SAI statuses **Not verified** until integration evidence exists.
- Update `requirements/acceptance.md` and its Russian counterpart only from integration evidence. Preserve all 28 IDs and current statuses until then.
- This roadmap does not authorize automatic AI retries, result acceptance, merge, release, or production deployment.
