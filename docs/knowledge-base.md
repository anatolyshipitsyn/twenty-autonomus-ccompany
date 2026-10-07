# Notion working knowledge base

[Русская версия](knowledge-base.ru.md)

Project home: [Twenty AI Orchestrator](https://app.notion.com/p/3f26f8331343819c9382c33351d7608a).

The home page is inside [Twenty AI Orchestrator](https://app.notion.com/p/3f26f833134381898c4aead9645f463a) in Notion's existing Projects database, stage `Planning`. The original private draft was moved with all five child databases; page and database URLs are unchanged. Access follows the destination's permissions; sharing and publication settings were not explicitly changed. The connector's page readback does not expose a complete access-control list.

## Responsibilities

- Git: [requirements](requirements.md) and linked RU/EN contracts are the specification; [PRD](PRD.md) provides context.
- Notion: working decisions, open questions, proposed implementation stages, pilot evidence, and reports.
- Twenty: execution state, commands, durable AI Run Journal, approvals, and human acceptance.

This setup is connector access plus repository instructions. It does not install a background sync service, start the orchestrator, or add Notion to the product MVP. Source links point to GitHub main; compare them with the actual checkout before relying on a snapshot.

## Registers

- [Decisions](https://app.notion.com/p/5e005b54e48e417c885f998b3878ddaf): context, reason, alternatives, consequences, source, requirement IDs, and confirmation. States: `Proposed`, `Accepted`, `Superseded`.
- [Open questions](https://app.notion.com/p/247a55a7a8f848fcb69a71472bf65a71): six initial compatibility/configuration questions from [operations](requirements/operations.md). States: `Open`, `Resolved`.
- [Implementation plan](https://app.notion.com/p/a56e14044d054520be9ab93cdf55a57c): six proposed stages with dependencies and related SAI IDs. States: `Proposed`, `In progress`, `Completed`. No dates or owners have been assigned; the mapping is planning guidance, not a replacement acceptance matrix.
- [Pilot checks](https://app.notion.com/p/e4e6ec2571c54b87b6f3366dbca55839): all 28 SAI IDs, checks, expected results, source links, and evidence. Initial state: `Not verified`. Other states: `Partially met`, `Met`, `Not met`.
- [Reports](https://app.notion.com/p/fe921adac381418dbf00a35f2be35ab0): work date, kind, changes, commit/PR, actual checks, limitations, and next steps. Kinds: `Setup`, `Engineering`, `Verification`.

Database property names use English so connector calls stay stable; page content is initially Russian. Preserve existing property names and protocol/requirement tokens.

## Codex workflow

Use only MCP tools to manage Notion. Do not fall back to the local Notion app or browser UI. Report unavailable or plan-limited operations and continue only supported MCP operations.

1. Fetch the project home through the Notion connector. Use its database URLs to fetch current schemas and search relevant records before substantive work.
2. Read the applicable repository contracts and compare any Notion snapshot with the current checkout. Record a conflict as an open question; requirement changes need corresponding RU/EN edits in Git.
3. Perform the authorized work. Search for existing matching records before creating new ones. Record unapproved decisions and plans as `Proposed`; record confirmation only with its actual source.
4. Update affected records and add a concise report. Include changed files and commit/PR when available; distinguish static checks from runtime evidence. Do not invent commands, URLs, owners, outcomes, or secrets.
5. Fetch material writes again. Verify content, parent, IDs, statuses, and source/evidence links. If a write fails, report the missing update rather than claiming success.

For pilot checks, retain the environment versions, preconditions, steps, expected/actual result, task/runKey/operationKey/assignmentVersion, sanitized evidence, check results, and PR where applicable. Follow [acceptance](requirements/acceptance.md), including publication retry and retention regression scenarios. Static documentation checks do not close SAI. If integration evidence changes a criterion, update its repository record in both languages as well.

Keep credentials, private keys, tokens, and unsanitized logs outside Notion. Authorization covers this project's knowledge records; sharing, moving to another destination, messaging others, and unrelated workspace changes require an explicit request. If the connector is unavailable, continue authorized repository work and report which knowledge reads/writes could not be completed.

## Example requests

- “Read relevant Notion decisions and compare them with current requirements before implementing this task.”
- “Record this decision and its confirmation source in the project knowledge base.”
- “Add a work report with changes, checks, limitations, and the PR link.”
- “Show open compatibility questions and evidence missing for SAI-13.”
