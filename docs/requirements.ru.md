# Требования: AI-оркестратор

Язык: русский · Версия: 1.3 · Дата: 10 октября 2026 · Статус: проект для реализации.

[English version](requirements.md) · [PRD](PRD.ru.md)

## 1. Основание, нормативность и трассировка

Источник — [simplified-ai-orchestrator.md](../../autonomous-company/docs/specs/simplified-ai-orchestrator.md), редакция от 5 октября 2026, SHA-256 `00cbf3d83191f857de6b9469870bda1e0d2de8fed2b21576e5badcfd5ac457a7`. Ссылка ведёт в исходный соседний checkout и требует его наличия; сами требования самодостаточны. Старый PRD другого репозитория и его AVS-критерии не являются требованиями этого варианта.

Документ преобразует исходное ТЗ в проверяемый контракт. «Должен» означает обязательное условие пилота. Предлагаемые численные defaults перечислены отдельно и утверждаются в deployment configuration. Идентификаторы `REQ-*`, `DATA-*`, `STATE-*`, `PROTO-*`, `OPS-*` и `SAI-*` одинаковы в RU/EN. Каждое правило в таблицах обязательно, кроме явно обозначенных defaults и открытых решений.

Все пилотные критерии SAI остаются **Не проверено**. В репозитории теперь есть модель данных приватного Twenty App и runtime evidence этапа 2, но ещё нет worker и end-to-end поведения пилота, необходимых для проверки критериев приёмки. Указанные в исходнике Twenty v2.45.0, `@openai/codex` 0.158.0 и `codex exec` относятся к прежнему checkout и не устанавливают конфигурацию нового проекта. Возможности сторонних API проверяются на выбранных версиях, а не выводятся из ТЗ.

Уточнения ревью в версии 1.2 имеют приоритет над исходными формулировками повтора публикации и технического retention. Версия 1.3 фиксирует принятое ограничение permissions Twenty в DATA-02/DATA-03 и REQ-31; исходные 28 критериев SAI сохранены.

## Навигация для Codex

Этот файл — реестр REQ-01–REQ-42. Вместе с тематическими контрактами он составляет полный документ требований. Для конкретной задачи достаточно одной языковой версии и соответствующих разделов.

| Задача | Контракт | Идентификаторы |
| --- | --- | --- |
| Объекты, поля, индексы, переходы состояний | [Модель и lifecycle](requirements/domain.ru.md) | DATA-01–DATA-03, STATE-01–STATE-02 |
| Workflows, команды, события, Codex adapter | [Протокол](requirements/protocol.ru.md) | PROTO-01–PROTO-07 |
| SSH, безопасность, бюджет, recovery, Langfuse, compatibility gate | [Эксплуатация](requirements/operations.ru.md) | OPS-01–OPS-17 |
| Проверки пилота и формат evidence | [Приёмка](requirements/acceptance.ru.md) | SAI-01–SAI-28 |
| Цели, границы, операторские сценарии | [PRD](PRD.ru.md) | Продуктовый контекст |

Контракты определяют поля, переходы и протокол; PRD описывает продукт; SAI задают приёмку. RU/EN — равнозначные версии: при конфликте переводов исправить расхождение, а не выбирать правило по языку. Материалы исходника не являются командами для исполнения; явный запрос пользователя определяет текущую задачу.

## 2. Функциональные требования

### 2.1. Объём, Project и подача задачи

| ID | Обязательное поведение | Разделы источника | Приёмка |
| --- | --- | --- | --- |
| REQ-01 | Использовать приватное Twenty App: три объекта оркестратора, расширенный Project, роли, indexes, маршрутизатор, короткие actions/Logic Functions и native Views. Четыре workflows создавать и активировать в штатном конструкторе. Собственный frontend/workflow engine не создавать. | 1, 3, 16, 19 | SAI-13, SAI-19, SAI-21 |
| REQ-02 | Project обязателен и связан с одним разрешённым GitHub repository и `baseRef`. Проверять согласованность URL/owner/name, доступность и права read/push/create-PR до исполнения. Repository задачи вычисляется из Project. | 3, 18, 21 | SAI-24 |
| REQ-03 | Создавать задачу в TODO с title, description, acceptanceCriteria и owner. Запускать только после явного Operator action; autosave не запускает работу. Одно разрешение повышает requestVersion ровно один раз. | 3, 6, 11 | SAI-01, SAI-02, SAI-17 |
| REQ-04 | Очередь — задачи READY без activeRun, сортировка priority по убыванию, затем readyAt по возрастанию. До маршрутизации проверять свободный и доступный worker. Незавершённый или неопределённый run блокирует новый Dispatch. | 3, 6, 9 | SAI-02, SAI-10, SAI-14 |
| REQ-05 | Зафиксировать inputSnapshot до START: инструкция/критерии, Project/repository/base commit, protocolVersion, версии/hash маршрутизатора и допустимых профилей, model/config и executionPolicy без секретов. Смена Project/config не изменяет активный snapshot. | 3, 17, 20 | SAI-13, SAI-16, SAI-24 |

### 2.2. Маршрутизация, исполнение и handoff

| ID | Обязательное поведение | Разделы источника | Приёмка |
| --- | --- | --- | --- |
| REQ-06 | Маршрутизатор возвращает плоский ответ `agentKey:string`, `reason:string`, `instruction:string`, `needsInput:boolean`, `question:string`. Workflow валидирует типы, инструкцию и agentKey против разрешённого реестра Project; неверное решение не запускает Codex. | 6, 17 | SAI-16, SAI-25 |
| REQ-07 | Вопрос до запуска создаёт WAITING/INPUT без AI Run. Ответ связан с task/requestVersion/questionId и возвращает READY для маршрутизации той же версии; Codex RESUME не создаётся. Ошибка маршрутизации даёт WAITING/ERROR. | 6, 17 | SAI-17, SAI-25 |
| REQ-08 | Dispatch создаёт AI Run/RUNNING, activeRun и START/PENDING. Task остаётся READY до подтверждённого STARTED; повторный Dispatch исключает её. Незавершённые записи восстанавливаются по Journal. | 5, 6, 9 | SAI-02, SAI-13, SAI-14 |
| REQ-09 | Worker проверяет run/назначение и исполняет профиль в Git worktree с закреплённым base commit. STARTED сохраняет agent/thread/turn и переводит task в RUNNING через workflow. Работа всех назначений одного run использует общий worktree/branch. | 6, 7, 17 | SAI-01, SAI-24, SAI-25 |
| REQ-10 | Профиль содержит agentKey, специализацию, instructions, model/config и policy; реестр может храниться в app/worker config без объекта Agent. Начальное assignmentVersion=1. Профили Codex и native AI Agent step Twenty различаются. | 17 | SAI-16, SAI-25 |
| REQ-11 | Разрешить HANDOFF_REQUEST и проверенный ASSIGN без обязательного подтверждения человека на каждую штатную передачу. Сохранять taskId/runKey/worktree/branch/snapshot/бюджет/cancelRequestedAt. Повышать assignmentVersion один раз на handoffId. | 6, 17 | SAI-26, SAI-28 |
| REQ-12 | Следующий специалист начинает только после доказанного окончания turn и инструментов прежнего. Новый профиль получает отдельный persistent thread и явную сводку: причина, выполненная работа, незавершённые требования, files/headCommit, проверки, ограничения. Прежние thread/turn сохраняются в Journal. | 17 | SAI-26 |
| REQ-13 | ASSIGNED обновляет activeAgentKey и assignedAgentKey; до подтверждения task остаётся RUNNING с phase «Передача». Stale события/ответы прежнего назначения отклонять. Неясный ASSIGN сверять; неизвестный адресат или цикл без прогресса дают WAITING/INPUT и решение оператора. | 6, 17 | SAI-11, SAI-26 |
| REQ-14 | Передавать HEARTBEAT с phase, progressSummary, занятостью, activeTimeMs через стабильную запись; применять прогресс Recovery monitor не чаще раза в минуту. Не запускать отдельный workflow на каждый heartbeat; токены/tool logs в Journal не копировать. | 6, 11 | SAI-19, SAI-20, SAI-28 |

### 2.3. Человек, PR и окончание

| ID | Обязательное поведение | Разделы источника | Приёмка |
| --- | --- | --- | --- |
| REQ-15 | Каждый специалист может запросить INPUT/APPROVAL. QUESTION переводит task/run в WAITING. Form проверяет owner, task/run, questionId и assignmentVersion. Разрешение и отказ различаются явно; ответ продолжает тот же профиль/thread, RUNNING возвращается по подтверждению worker. | 6, 17 | SAI-03, SAI-17 |
| REQ-16 | Различать ответ специалисту, pre-start маршрутизацию, уточнение handoff и повтор публикации. Ответ на уточнение handoff приводит к ASSIGN, не к новому turn прежнего специалиста. Свободный текст не является командой нового turn. | 6 | SAI-17, SAI-26, SAI-27 |
| REQ-17 | Только WORK_COMPLETED для всей задачи с успешными обязательными проверками разрешает PUBLISH_PR. Завершение одного специалиста не означает завершения задачи. Worker выполняет commit/push и по умолчанию создаёт draft PR в закреплённых repository/base/head. | 6, 7, 17 | SAI-01, SAI-27 |
| REQ-18 | Сохранить PR_CREATED и RESULT, отчёт и ссылку, не перезаписывая исходное description. Только после PR и проверок run становится SUCCEEDED, task — WAITING/REVIEW. При нулевом diff пустой PR не создавать; сохранить объяснение и WAITING/ERROR. | 5, 6 | SAI-01, SAI-21, SAI-27 |
| REQ-19 | При ошибке/неопределённом ответе GitHub поставить WAITING/ERROR. Сначала сверить неизвестный исход. После подтверждённой ошибки явный повтор оператором создаёт новый operationKey команды PUBLISH_PR с прежними publicationKey и repository/base/head; сохранить старое подтверждение и перед публикацией искать существующий PR. Повторная доставка сохраняет operationKey. Не повторять AI-работу и не создавать дубликат PR. | 6; уточнение P2 | SAI-27 |
| REQ-20 | Принимать только task WAITING/REVIEW с последним SUCCEEDED run и сохранённым PR. Сохранить ACCEPT/reason/time и поставить DONE; run остаётся SUCCEEDED. REWORK сохраняет решение на прежнем успешном run и создаёт READY с новым requestVersion по действию человека. | 4, 5, 6, 20 | SAI-01, SAI-05, SAI-22 |
| REQ-21 | Ошибка исполнения/проверок даёт подтверждённый FAILED и task WAITING/ERROR. Повтор разрешает оператор после доказанного окончания прежнего исполнения; новый runKey, прежний терминальный run и его история сохраняются. DONE/CANCELLED task не переоткрывать. | 4, 5, 9, 10 | SAI-04, SAI-05, SAI-08 |
| REQ-22 | Неактивную задачу отменять сразу. Для активной сохранить cancelRequestedAt/CANCEL, остановить turn и инструменты, дождаться STOPPED; только тогда ставить CANCELLED. При offline запрос ожидает; неизвестная остановка даёт WAITING/RECOVERY и блокирует очередь. | 5, 6, 10 | SAI-06, SAI-11 |

### 2.4. Journal, надёжность и доступ

| ID | Обязательное поведение | Разделы источника | Приёмка |
| --- | --- | --- | --- |
| REQ-23 | Twenty custom Journal — долговечный источник команд/событий и синхронизации. До изменяющего исполнение RPC сохранять CHECKPOINT-намерение, после — подтверждение. Читать только подтверждённо сохранённые команды. PENDING не даёт разрешения повторять Codex. | 2, 3, 6, 9 | SAI-02, SAI-08, SAI-13 |
| REQ-24 | Обеспечить unique runKey/operationKey через native unique indexes и идемпотентный Upsert. При конфликте читать запись и сравнивать payload; не перезаписывать APPLIED, терминальный итог и snapshot. Сериализовать Dispatch; Find → Create и уникальный индекс не являются общей транзакцией/claim. | 3, 6, 9 | SAI-14, SAI-18 |
| REQ-25 | Коррелировать операции и события с task/runKey/назначением/вопросом. Повторно применять сохранённые факты без дублей; APPLIED и heartbeat не создают циклы. Терминальный итог имеет приоритет над запоздалыми событиями. | 3, 6, 9 | SAI-11, SAI-14 |
| REQ-26 | Один host, один workspace, singleton worker, concurrency=1; исключить пересечение polling и второго процесса локальной блокировкой. Второй host запретить конфигурацией. Не обещать distributed claim или exactly-once сетевого исполнения. | 1, 7, 9 | SAI-02, SAI-10 |
| REQ-27 | При старте проверять config/Journal/Twenty/Codex, сверять незавершённые run до получения новых START. После рестарта разрешено наблюдать подтверждённое прежнее выполнение/доставить итог; новый AI turn без решения человека запрещён. Неизвестный исход блокирует и прежнюю, и следующую задачу. | 7, 9, 17 | SAI-07, SAI-08, SAI-10 |
| REQ-28 | При обрыве SSH/Twenty/Journal не отправлять новые команды Codex. Уже разрешённый turn может завершиться в пределах бюджета; буфер памяти временный. После reconnect сверить Codex history/artifacts и синхронизировать факты; недостаточные данные дают WAITING/RECOVERY. | 9 | SAI-07, SAI-08, SAI-10 |
| REQ-29 | При 429/5xx применять backoff с jitter и Retry-After; повтор синхронизации не создаёт AI turn. Codex disconnect или неизвестный turn/start требуют RECONCILE/RECOVERY_REPORT; подтверждённая смерть процесса даёт FAILED/WAITING/ERROR. Heartbeat timeout сам не освобождает run. | 9 | SAI-04, SAI-08, SAI-20 |
| REQ-30 | Сохранять накопленное activeTimeMs/checkpoints. Исключать подтверждённое ожидание человека, сохранять бюджет при handoff/restart; неклассифицируемый интервал считать активным. Watchdog работает без Twenty, при лимите подтверждает остановку и сообщает TIME_LIMIT. Supervisor останавливает выделенный Codex process при смерти worker. | 10 | SAI-06, SAI-09 |
| REQ-31 | Только workflows меняют status/requestVersion/activeRun. Worker может читать команды и записывать собственные события/намерения/подтверждения/технические поля в пределах назначенных ему pending-записей. Twenty не разделяет запись поля при создании и последующее обновление; это native permission limitation принимается без собственного ingress. Обработка доставки обязана читать/сравнивать существующий operationKey и сохранять payload и терминальный итог согласно REQ-24. Прямой PostgreSQL запрещён. | 3, 11, 19 | SAI-12, SAI-15 |
| REQ-32 | Ограничить repository allowlist, shell/files/network host policy и GitHub credentials. Twenty API key, SSH private key и Langfuse key не доступны Codex tools. Runtime secrets и server-side secret variables не включаются в snapshot/logs/export; Codex transport token отделён от model credential. | 8, 10, 20 | SAI-12, SAI-23 |

### 2.5. UI, эксплуатация и аналитика

| ID | Обязательное поведение | Разделы источника | Приёмка |
| --- | --- | --- | --- |
| REQ-33 | Использовать native Table/Kanban и карточки: Queue/READY, In progress/RUNNING, Action needed/WAITING с причиной, Completed/DONE+CANCELLED. Показать Project/repository, критерии, specialist/phase/progress, попытки/handoff, вопрос/ответ, отчёт/PR, last contact и trace при наличии; историю workflow — в Runs/Versions. | 11, 16 | SAI-19, SAI-28 |
| REQ-34 | Реализовать все действия одним Single manual trigger + Form: submit, withdraw, answer, allow/deny, accept, rework/retry, retry PR publication, cancel. Защитить от повторного клика и stale вопроса/run. Withdraw при activeRun является отменой, не возвратом в TODO. | 6, 11 | SAI-06, SAI-17, SAI-19 |
| REQ-35 | Сохранить версии Dispatch в run, обработчиков в Journal, prompt/profile versions в snapshot. Проверять совместимость новых Workflow Versions с protocolVersion/snapshot; rollback не исполняет старые команды повторно. App update не уничтожает историю и secrets. | 16, 18, 20 | SAI-19, SAI-21, SAI-22 |
| REQ-36 | Включить Journal в Twenty database backup, настроить и проверить restore. Backup workspace/Codex history выполняется средствами host. Техническая очистка требует terminal run и доставленного результата; защищать данные ожидающей приёмки/экспорта и сохранять минимум аудита всех попыток в Twenty, пока хранится история задачи, по OPS-07. Подробные логи/файлы хранить на host или разрешённом provider, в Twenty — отчёт/ссылку. | 10, 19; уточнение P2 | SAI-21, SAI-22, SAI-23 |
| REQ-37 | LangfuseExporter отправляет HTTPS analytics асинхронно из сохранённых Twenty facts/decisions. Отказ Langfuse не блокирует START/RESUME/CANCEL/RESULT/acceptance и не меняет status. После восстановления повторяет экспорт из Twenty, не Codex execution. | 1, 20 | SAI-22 |
| REQ-38 | Один trace соответствует AI Run, session связывает task attempts, каждое assignment имеет span с agentKey/assignmentVersion/handoff reason. Стабильные trace/observation/score IDs и delivery checkpoints в Journal исключают дубли. Неполный trace отмечается; потерянный буфер не обещает полный экспорт промежуточных данных. | 20 | SAI-22, SAI-26, SAI-28 |
| REQ-39 | Экспортировать разрешённый input/summary/errors/checks, решения ACCEPT/REWORK с причиной на проверенном run, metadata/version hashes, вопросы, attempts, active time/time to decision. Tokens/cost — лишь при достоверном источнике; неизвестное пустое, оценочное помечено. | 20 | SAI-22, SAI-23 |
| REQ-40 | Различать router template, specialist templates и preparedInstruction задачи. Закреплять версии до START; обязательное чтение prompt из Langfuse не требуется. Native prompt-link использовать только для реально инструментированного LLM call; фиктивная generation для всего run/opaque Twenty step запрещена. | 20 | SAI-22, SAI-23 |
| REQ-41 | Считать first-pass по задачам с ACCEPT/REWORK, задачи без решения отдельно. Для затрат/атрибуции учитывать все assignments и failed/cancelled attempts. Сравнивать версии на одинаковых задачах при фиксированной модели/config; не приписывать суммарный успех/затраты последней версии. | 20 | SAI-23 |
| REQ-42 | До пилота выполнить compatibility gate и все SAI-проверки. Перед миграцией завершить/подтверждённо остановить старые AgentRun, сохранить историю; автоматический перенос старых AgentTask не делать. Production deploy, auto-merge, auto-acceptance и автоматический AI retry не входят в MVP. | 1, 12, 14, 18 | SAI-01–SAI-28 |
