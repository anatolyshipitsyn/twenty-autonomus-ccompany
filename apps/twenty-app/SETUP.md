# Isolated app development

This App is maintained for the disposable, non-production Twenty App Dev `v2.45.6` workspace. Do not run setup or sync commands against production or the primary workspace.

## Prerequisites

- Node.js `v24.19.0` (see `.nvmrc`)
- Yarn `4.13.0` (pinned in `package.json`)
- Access to the designated isolated Twenty App Dev workspace
- A workspace API key available only through the host-managed secret storage process

## Install and synchronize

From this directory:

1. Install the exact locked dependencies with `yarn install --immutable`.
2. Configure the Twenty CLI remote using the approved host-managed credential workflow. Do not paste a key into shell history, command arguments, repository files, or logs.
3. Check the active target with `yarn twenty remote:status`. Stop if it is not the isolated `v2.45.6` workspace.
4. Run `yarn twenty dev --once` to build, typecheck, and synchronize this App to that target.

The app scaffold does not start or reset a Twenty server. Use of `yarn twenty docker:start`, default scaffold accounts, or integration setup that uninstalls an App is outside this project's Stage 2 procedure.

## Local checks

- `yarn lint`
- `yarn typecheck`
- `yarn twenty dev:typecheck`

Runtime schema and permissions evidence is recorded in [`../../docs/evidence/stage-2-data-model.md`](../../docs/evidence/stage-2-data-model.md). A local lint/typecheck does not replace those target checks or close any SAI criterion.
