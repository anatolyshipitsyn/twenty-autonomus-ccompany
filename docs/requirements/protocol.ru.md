# Workflows и протокол исполнения

Версия: 1.2 · Дата: 6 октября 2026 · Статус: Не проверено.

[English version](protocol.md) · [Все требования](../requirements.ru.md) · [PRD](../PRD.ru.md)

## 1. Workflow и протокол

### Четыре процесса

| ID | Workflow / триггер | Обязанность |
| --- | --- | --- |
| PROTO-01 | Operator action / Single manual trigger + Form | Все операторские действия, permissions и корреляция; одна версия разрешения на ключ действия |
| PROTO-02 | Dispatch / Schedule | READY без activeRun, свободный worker, Project validation, маршрутизатор, snapshot, run и START; сериализованный Dispatch |
| PROTO-03 | Apply worker event / новый бизнес-EVENT Journal | Идемпотентное применение STARTED/QUESTION/ASSIGNED/RESULT, маршрутизация HANDOFF_REQUEST → ASSIGN, WORK_COMPLETED → PUBLISH_PR, PR_CREATED и итог |
| PROTO-04 | Recovery monitor / Schedule | Последняя связь/прогресс, повторное применение сохранённых фактов, RECONCILE при reconnect и WAITING/RECOVERY при неизвестном исходе |

Schedule defaults — раз в минуту; timezone расписания проверяется в compatibility gate. Heartbeat/APPLIED и технический экспорт не запускают бизнес-циклы.

### Операции Journal

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

`PROTO-05`: PENDING означает неподтверждённую команду/необработанное событие; APPLIED означает исполненную команду/применённое событие. ACK включает resultCode OK/ERROR/REJECTED; PENDING после сетевой ошибки является неизвестным исходом. operationKey стабилен при доставке; task/runKey/assignmentVersion/questionId/handoffId проверяются по применимости. Неверная версия или конфликтующий payload отклоняется с сохранением диагностики.

Сверка и повтор PUBLISH_PR:

1. Повторная доставка APPLIED возвращает сохранённый исход; команда не исполняется заново, подтверждение не меняется.
2. Для PENDING с неизвестным исходом GitHub сверить существующую попытку и найти PR по repository/base/head. Если найден, доставить PR_CREATED/RESULT без нового PR. Если поиск не доказывает исход, операция остаётся неопределённой; новая попытка запрещена.
3. Только после сохранения подтверждённой ошибки как APPLIED/ERROR Operator action может разрешить новую попытку команды. Одно операторское действие создаёт один новый operationKey и сохраняет publicationKey/retryOfOperationKey. Повторные подачи используют ту же попытку.
4. Перед публикацией новой попытки снова искать существующий PR. Сохранить runKey, requestVersion, repository/base/head и уже подготовленные изменения; сохранить известный headCommit. Не запускать Codex turn, не выполнять изменения заново и не сбрасывать бюджет run.
5. Сохранять намерение и подтверждение новой попытки отдельно от прежней команды. Workflow применяет подтверждённый исход публикации к тем же AI Run / AI Task; повтор не создаёт новый инженерный run.

`PROTO-06`: adapter использует:

- согласованный handshake `initialize`/`initialized`
- persistent `thread/start`
- `turn/start`
- события
- вопросы/approval
- `turn/interrupt`
- read thread для сверки

Ephemeral mode запрещён. Канал WebSocket при выборе слушает loopback и требует transport token. Точная схема RPC/events, подтверждение RESUME и восстановление turn проверяются на закреплённой версии; название события продолжения не выдумывается. Compatibility gate отдельно проверяет заявленный в исходнике экспериментальный статус app-server/WebSocket и допустимость пилота.

`PROTO-07`: компоненты NestJS:

- TwentyClient (pagination/timeouts)
- CommandExecutor (последовательные команды)
- CodexClient
- WorkspaceService
- AgentExecutor
- GitHubPublisher
- RunJournal
- LangfuseExporter

Они не содержат собственный business workflow engine. Polling scheduler не заменяет блокировку пересечения итераций. Core API обслуживает записи, Metadata API — первоначальную настройку; маршруты и фильтры получают из целевой schema.
