# Operations, recovery, and analytics

Version: 1.2 · Date: 6 October 2026 · Status: Not verified.

[Русская версия](operations.ru.md) · [All requirements](../requirements.md) · [PRD](../PRD.md)

## 1. Operational requirements

### Configurable defaults

| ID | Parameter | Proposed value / meaning |
| --- | --- | --- |
| OPS-01 | concurrency | 1; mandatory MVP boundary |
| OPS-02 | command poll / heartbeat | 10 / 30 seconds; pending configuration approval |
| OPS-03 | loss of contact | Heartbeat older than 90 seconds; an indicator only, not proof of shutdown |
| OPS-04 | Dispatch / Recovery / progress apply | 1 minute / 1 minute / at most once per minute |
| OPS-05 | run active budget | 60 minutes; START payload sets budget, human WAITING excluded only when confirmed |
| OPS-06 | graceful shutdown | Up to 30 seconds, then supervisor terminates the dedicated app-server and processes; unproven shutdown blocks the queue |
| OPS-07 | retention | Proposed 30-day technical cleanup period for terminal runs after result delivery; review/export holds and the retained audit minimum below take precedence. Administrator configures schedule and backup. |

These are design values, not an SLA. Changes must align with check configuration, including SAI-09.

Retention rules under OPS-07:

- The 30-day default applies to disposable technical data, such as detailed tool logs and workspace files. It is not a deletion deadline for AI Run, task history, or the audit minimum in Journal.
- Cleanup requires a terminal run and confirmed result delivery. Delete only data no longer needed for review, recovery, pending publication, or analytics export; age alone is insufficient.
- While a task is WAITING/REVIEW, retain the evidence required to validate the successful run and PR and to perform ACCEPT/REWORK. A SUCCEEDED run is terminal but its review is still pending.
- Retain all facts, decisions, and delivery checkpoints required by a pending Langfuse export until delivery is confirmed. A Langfuse outage extends this hold without blocking execution or human acceptance.
- Keep a queryable audit minimum in existing Twenty AI Run / Journal objects for every task attempt, including FAILED/CANCELLED, for as long as task history is retained. This preserves later review decisions and cost/version attribution; it does not require a new object or service.
- The audit minimum includes run identity/status and task relation, snapshot/version references, assignment history, check results, summary/PR/headCommit, review decisions/reasons/timestamps, active-time and available cost/token facts, operation identities/outcomes, and export identities/checkpoints. Include any payload needed to reconstruct pending delivery.
- Backup or inaccessible archives do not replace this queryable minimum. Technical cleanup must preserve operator actions, idempotency, and metrics after cleanup and after backup/restore.
- Deletion of business task history and its audit minimum requires a separate explicit retention policy. The 30-day technical default never authorizes that deletion.

### SSH, network, and credentials

`OPS-08`: the worker initiates local forwarding; supervisor is a separate host service with reconnect/backoff. There is no public launch endpoint; health listens on loopback if needed. The worker checks a real API request. A tunnel outage prevents new task starts; SSH does not replace Twenty API authentication.

```sh
ssh -N -T -L 127.0.0.1:<local-port>:<twenty-internal-host>:<api-port> \
  -o ExitOnForwardFailure=yes \
  -o ServerAliveInterval=30 \
  -o ServerAliveCountMax=3 \
  <ssh-user>@<twenty-ssh-host>
```

The template requires deployment values. SSH host key verification is mandatory, and the key is restricted to required forwarding. Preserve hostname/SNI and certificate verification for HTTPS; disabling TLS verification is prohibited. HTTP to the internal API is allowed only inside encrypted SSH. `ssh -R` is unnecessary.

### Failures and recovery

| ID | Failure | Mandatory outcome |
| --- | --- | --- |
| OPS-09 | Lost response to run creation/START/ASSIGN | Find run by runKey and execution by verifiable Codex identity; observe the previous execution or WAITING/RECOVERY; repeated start is prohibited |
| OPS-10 | SSH/API outage and worker restart | Recovery waits for connectivity; the buffer may be lost. Reconcile persistent history/artifacts, persist outcome or WAITING/RECOVERY; no new RPC |
| OPS-11 | RESULT not persisted | Deliver proven outcome and restore task/run relations; do not repeat work |
| OPS-12 | Codex disconnect/process death | Uncertain outcome → reconciliation/RECOVERY; confirmed death → FAILED/WAITING/ERROR; human decides retry |
| OPS-13 | Journal unavailable/corrupt | Block new tasks and Codex commands; reconcile facts after recovery, request manual investigation on ambiguity |
| OPS-14 | API rate/quota failure | Jitter/backoff/Retry-After and pagination; no new turn or workflow storm |
| OPS-15 | Langfuse outage | Bounded export buffer/backoff, technical error without lifecycle changes; delivery from Twenty with the same IDs, incomplete trace marked |

A human recovery decision does not prove previous execution has stopped. Local logs and workflow history do not replace Journal. Preservation of every intermediate tool log during simultaneous outage and restart is not guaranteed.

### Analytics contract

`OPS-16`: trace metadata includes:

- taskId/projectId
- runId/runKey
- requestVersion
- workflowVersionId/protocolVersion
- repository/base commit/PR
- model/config
- template versions/hashes

Session groups task attempts; assignment spans retain agentKey/assignmentVersion/reason. The exporter saves SDK-valid traceId/URL in run and delivery checkpoints in Journal. Delivery does not trigger business workflows.

`OPS-17`: persist facts/decisions in Twenty before export. Native Twenty agents and internal Codex model calls are not automatically instrumented. Prompt-to-generation linking and exact tokens/cost require a verified integration. ACCEPT/REWORK is a human decision; execution error is not that score. Allowed project inputs/outputs are sanitized for credentials.

## 2. Compatibility gate and open decisions

Before implementation, record actual Twenty server/SDK/plan, Codex protocol, and Langfuse SDK/API versions.

Validate:

- the private app
- three objects and Project
- relations/indexes/Upsert
- router response/profiles
- four workflows/Form/branches
- permissions/ingress/secrets
- concurrent Dispatch
- PENDING recovery
- Codex handshake/questions/interrupt/history/shutdown
- GitHub rights/PR idempotency
- native UI
- quotas
- backup/restore

The source notes:

- alpha status for Skills & Agents
- flat structured responses
- Search Records limited to 200 results
- Logic Function limited to 900 seconds
- Schedule in UTC
- no assumed automatic retry of failed workflows

These claims have not been reverified here: determine capabilities/limits on the target version. Journal API must support pagination; long Codex execution resides on the host. Also verify If/else support and permission enforcement in practice.

| Decision before implementation | Required record |
| --- | --- |
| Host / “remote server” | Worker and app-server on one host relative to Twenty; another topology requires a requirements change |
| Twenty workspace / SSH | Schema, API URL, internal host/port, SSH account/key, TLS/SNI |
| Protocol / serialization | Pinned versions, event schemas, Dispatch guard, and supported acknowledgement mechanism |
| Project policies | Repository allowlist/baseRef, GitHub permissions, profiles/models, mandatory check commands |
| Security / operations | Secret storage/isolation, supervisor, backup/restore schedule, retention, and approved defaults |
| Langfuse | Cloud/self-host, URL/credentials/SDK, allowed data, stable IDs, and cost measurement completeness |

No concrete addresses, secrets, test commands, or API support are invented. The separate Twenty capabilities research does not automatically expand MVP scope.
