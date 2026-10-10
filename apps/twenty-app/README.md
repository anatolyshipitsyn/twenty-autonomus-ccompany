# Twenty AI Orchestrator App

Private Twenty App defining the orchestrator data model, unique indexes, and explicit Operator, Workflows, and Worker roles. The product contract is maintained in [`docs/requirements/domain.md`](../../docs/requirements/domain.md); isolated-install evidence is in [`docs/evidence/stage-2-data-model.md`](../../docs/evidence/stage-2-data-model.md).

## Scope

- Defines `AiTask`, `AiRun`, and `AiRunJournal`; `Project` is the related business object.
- Does not configure Workflows, forms, native operator views, a worker service, a queue, or Codex app-server integration.

## Develop against the isolated workspace

See [SETUP.md](SETUP.md). Use only the disposable, non-production Twenty App Dev `v2.45.6` workspace. Read credentials through the host-managed secret storage process. Never place API keys in source files, shell arguments, command output, logs, or documentation.
