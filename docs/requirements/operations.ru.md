# Эксплуатация, восстановление и аналитика

Версия: 1.2 · Дата: 6 октября 2026 · Статус: Не проверено.

[English version](operations.md) · [Все требования](../requirements.ru.md) · [PRD](../PRD.ru.md)

## 1. Эксплуатационные требования

### Настраиваемые defaults

| ID | Параметр | Предлагаемое значение / смысл |
| --- | --- | --- |
| OPS-01 | concurrency | 1; обязательная граница MVP |
| OPS-02 | command poll / heartbeat | 10 / 30 секунд; значения до утверждения config |
| OPS-03 | потеря связи | Heartbeat старше 90 секунд; только индикатор, не доказательство остановки |
| OPS-04 | Dispatch / Recovery / progress apply | 1 минута / 1 минута / не чаще 1 раза в минуту |
| OPS-05 | run active budget | 60 минут; START payload задаёт бюджет, WAITING человека исключается лишь при подтверждении |
| OPS-06 | graceful shutdown | До 30 секунд, затем supervisor завершает выделенный app-server и процессы; недоказанная остановка блокирует очередь |
| OPS-07 | retention | Предлагаемый срок технической очистки — 30 дней для terminal run после доставки результата; защита приёмки/экспорта и минимум аудита ниже имеют приоритет. Расписание и backup настраивает администратор. |

Это проектные значения, не SLA. Изменения согласуются с конфигурацией проверок, включая SAI-09.

Правила retention по OPS-07:

- Default 30 дней применяется к удаляемым техническим данным, например подробным tool logs и файлам workspace. Это не срок удаления AI Run, истории задачи или минимума аудита в Journal.
- Очистка требует terminal run и подтверждённой доставки результата. Удалять только данные, которые больше не нужны для приёмки, восстановления, ожидающей публикации или экспорта аналитики; одного возраста недостаточно.
- Пока задача находится в WAITING/REVIEW, сохранять evidence для проверки успешного run и PR и выполнения ACCEPT/REWORK. Run SUCCEEDED терминален, но приёмка ещё ожидается.
- До подтверждённой доставки Langfuse сохранять все необходимые факты, решения и checkpoints ожидающего экспорта. Отказ Langfuse продлевает защиту данных без блокировки исполнения или человеческой приёмки.
- Сохранять доступный для запросов минимум аудита в существующих AI Run / Journal Twenty для каждой попытки задачи, включая FAILED/CANCELLED, пока хранится история задачи. Это сохраняет возможность поздних решений приёмки и атрибуции стоимости/версий; новый объект или сервис не требуется.
- Минимум аудита включает идентичность/status run и связь с task, snapshot/version references, историю назначений, результаты checks, summary/PR/headCommit, решения/reasons/timestamps приёмки, active-time и доступные факты cost/tokens, идентичность/исходы операций и идентичность/checkpoints экспорта. Сохранять payload, нужный для восстановления ожидающей доставки.
- Backup или недоступный архив не заменяют этот минимум для запросов. Техническая очистка должна сохранять операторские действия, идемпотентность и метрики после очистки и backup/restore.
- Удаление бизнес-истории задачи и её минимума аудита требует отдельной явно заданной retention policy. Default технической очистки 30 дней не разрешает такое удаление.

### SSH, сеть и credentials

`OPS-08`: worker инициирует local forwarding; supervisor — отдельный host service с reconnect/backoff. Нет публичного endpoint запуска, health при необходимости слушает loopback. Worker проверяет реальный API request. При недоступности туннеля новые задачи не запускаются; SSH не заменяет Twenty API authentication.

```sh
ssh -N -T -L 127.0.0.1:<local-port>:<twenty-internal-host>:<api-port> \
  -o ExitOnForwardFailure=yes \
  -o ServerAliveInterval=30 \
  -o ServerAliveCountMax=3 \
  <ssh-user>@<twenty-ssh-host>
```

Шаблон требует deployment values. Проверка SSH host key обязательна, ключ ограничен нужным forwarding. При HTTPS сохраняются hostname/SNI и certificate verification; отключать TLS verification нельзя. HTTP к внутреннему API допускается только внутри шифрованного SSH. `ssh -R` не нужен.

### Сбои и восстановление

| ID | Сбой | Обязательный исход |
| --- | --- | --- |
| OPS-09 | Потерян ответ run creation/START/ASSIGN | Найти run по runKey и исполнение по подтверждаемой Codex identity; наблюдать прежнее или WAITING/RECOVERY; повторный start запрещён |
| OPS-10 | SSH/API outage и restart worker | До подключения восстановление отложено; buffer мог исчезнуть. Сверить persistent history/artifacts, записать итог либо WAITING/RECOVERY; новые RPC запрещены |
| OPS-11 | RESULT не сохранился | Доставить доказанный исход, восстановить связи task/run; работу не повторять |
| OPS-12 | Codex disconnect/process death | Неясный исход → сверка/RECOVERY; подтверждённая смерть → FAILED/WAITING/ERROR; повтор решает человек |
| OPS-13 | Journal недоступен/повреждён | Блокировать новые задачи и команды Codex; после восстановления сверить факты, при неоднозначности — ручной разбор |
| OPS-14 | API rate/quota failure | Jitter/backoff/Retry-After и pagination; нет нового turn и workflow storm |
| OPS-15 | Langfuse outage | Ограниченный export buffer/backoff, техническая ошибка без изменения lifecycle; доставка из Twenty с прежними IDs, incomplete trace отмечен |

Решение оператора о восстановлении не доказывает остановку прежнего исполнения. Локальные логи и workflow history не заменяют Journal. Сохранение всех промежуточных tool logs при одновременном outage и restart не гарантируется.

### Аналитический контракт

`OPS-16`: trace metadata включает:

- taskId/projectId
- runId/runKey
- requestVersion
- workflowVersionId/protocolVersion
- repository/base commit/PR
- model/config
- template versions/hashes

Session группирует attempts задачи; assignment spans сохраняют agentKey/assignmentVersion/reason. Экспортер сохраняет валидные SDK traceId/URL в run и checkpoints доставки в Journal. Доставка не запускает бизнес-workflow.

`OPS-17`: сначала сохранить facts/decisions в Twenty, потом экспортировать. Native агенты Twenty и внутренние model calls Codex не считаются автоматически инструментированными. Привязка prompt к generation и точные tokens/cost требуют проверенной интеграции. ACCEPT/REWORK — решение человека, execution error не является таким score. Разрешённые project inputs/outputs очищаются от credentials.

## 2. Compatibility gate и открытые решения

До реализации зафиксировать фактические версии Twenty server/SDK/plan, Codex protocol и Langfuse SDK/API.

Проверить:

- приватный app
- три объекта и Project
- relations/indexes/Upsert
- router response/profiles
- четыре workflows/Form/ветки
- permissions/ingress/secrets
- конкурентный Dispatch
- PENDING recovery
- Codex handshake/questions/interrupt/history/shutdown
- GitHub rights/PR idempotency
- native UI
- quotas
- backup/restore

В исходнике отмечены:

- alpha-статус Skills & Agents
- плоский structured response
- Search Records до 200 результатов
- Logic Function до 900 секунд
- Schedule в UTC
- отсутствие предполагаемого автоматического retry failed workflow

Эти сведения не перепроверены здесь: совместимость/лимиты устанавливаются на целевой версии. Journal API должен поддерживать pagination; долгое Codex execution находится на host. If/else и enforcement permissions также проверяются фактически.

| Решение перед реализацией | Требуемая фиксация |
| --- | --- |
| Host / «remote server» | Worker и app-server на одном host относительно Twenty; иной topology требует изменения требований |
| Twenty workspace / SSH | Схема, API URL, internal host/port, SSH account/key, TLS/SNI |
| Protocol / serialization | Закреплённые версии, event schemas, guard для Dispatch и допустимый способ подтверждения |
| Project policies | Repository allowlist/baseRef, доступы GitHub, профили/models, обязательные команды проверок |
| Security / operations | Secret storage/изоляция, supervisor, backup/restore schedule, retention и утверждённые defaults |
| Langfuse | Cloud/self-host, URL/credentials/SDK, разрешённые данные, стабильные IDs, полнота измерения cost |

Конкретные адреса, secrets, команды тестов и поддержка API не выдуманы. Исследование возможностей Twenty из другого документа не расширяет объём MVP автоматически.
