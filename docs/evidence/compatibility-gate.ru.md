# Compatibility gate — текущие результаты

Дата: 10 октября 2026 · Область: предпроектные проверки из OPS compatibility gate; строка этапа 1 связывает SAI-13, SAI-18, SAI-20 · Статус: **Этап 1 GO; этап 2 Completed**

[English version](compatibility-gate.md) · [Evidence модели этапа 2](stage-2-data-model.ru.md) · [Контракт эксплуатации](../requirements/operations.ru.md) · [Контракт протокола](../requirements/protocol.ru.md) · [Матрица приёмки](../requirements/acceptance.ru.md)

> Текущие evidence установки этапа 2, схемы, связей, уникальных индексов, Upsert и permissions записаны в [отчёте модели этапа 2](stage-2-data-model.ru.md). Более ранние срезы ниже описывают состояние на указанную дату и для текущего статуса этапа 2 заменены этим отчётом.

## Вердикт

Выбранный self-hosted сервер Twenty работает. Авторизованные MCP и Company-проверки этапа 1 прошли в основном workspace. Приватное приложение этапа 2 установлено в отдельный disposable workspace `v2.45.6`; текущие выводы по схеме и API приведены в отчёте этапа 2. Основной Compose workspace не использовался для установки или probes этапа 2.

Решение этапа 1 остаётся **GO**: официальный scaffold, установка зависимостей и синхронизация App прошли в изолированном проекте на `v2.45.8`. Для этапа 2 официальный scaffold синхронизирован с disposable изолированным app-dev target `v2.45.6`, проверки критериев выхода завершены. Текущие evidence этапа 2 приведены выше.

## Решение gate и ограниченный кандидат

**Решение: GO для начала разработки App.** Официальный scaffolder разрешился из `create-twenty-app@latest` в `2.45.0`, установил `twenty-sdk@2.45.0` с Node `24.19.0` / Yarn `4.13.0` и завершил `yarn twenty dev` на изолированном app-dev server `v2.45.8`. Точная синхронизация с target `v2.45.6` также прошла при входе в этап 2, как записано ниже. Gate не закрывает SAI.

## Входная проверка этапа 2 (9 октября 2026)

**Результат: PASS; этап 2 — In progress.** Запущен disposable изолированный контейнер `twentycrm/twenty-app-dev:v2.45.6` на `127.0.0.1:2020`; `/healthz` вернул HTTP 200. Официальный scaffolder `create-twenty-app@2.45.0` создал `apps/twenty-app/` с Node `24.19.0` и Yarn `4.13.0`; lockfile фиксирует generated SDK packages на `2.45.0`. Официальная команда `yarn twenty dev` завершила начальную синхронизацию с этим точным target: Resources Build, Resources Upload, Manifest Build, Application Synchronization, API Client Generation и Entities (8 synced) прошли; итоговый статус — Synced. Watch process остановлен после успешной синхронизации; shell вернул 130 из-за преднамеренной остановки. Основной Compose workspace не использовался.

| Наблюдение | Классификация | Evidence / следующий шаг |
| --- | --- | --- |
| Full-payload Journal Upsert перезаписывает immutable fields; key-only Upsert их сохраняет. | **Key-only storage path проверен; consumer behavior зависит от следующих этапов** | На изолированном target key-only Upsert вернул прежние payload/resultCode/state/task; full-payload Upsert изменил payload/resultCode. Delivery consumer должен сравнить сохранённые значения с входным payload и исключить повторное исполнение; это зависит от этапа 3/4. См. отчёт этапа 2. |
| Runtime permissions для credentials с назначенными ролями не проверены. | **Блокирует выход этапа 2** | Проверить credentials operator, Workflows и worker в изолированном workspace. Worker сейчас имеет object-level update к Journal; ограничения полей/записей не доказаны. |

Точная входная sync и установка приватного приложения прошли. Readback связей, отклонение уникальных дублей и сохранение данных через key-only Upsert прошли. Runtime-границы ролей с credentials, назначенными ролям, не проверены и пока не позволяют завершить этап 2. Full-payload Upsert небезопасен; consumer-side compare/запрет повторного исполнения зависит от этапов 3/4. Все 28 SAI ID и статусы сохранены; этим evidence статус SAI не меняется.

Зафиксировать следующие значения как рабочий кандидат, а не как подтверждённую совместимость или утверждённую production-конфигурацию:

- Twenty server/worker: `v2.45.6`, image digest `sha256:dca6d82985901468b391c0335aa8f0519a52b9809709e66f2de1dbff04351e53`.
- Кандидат SDK Twenty App: официальный `create-twenty-app@latest` разрешился в scaffolder `2.45.0` и создал зависимости `twenty-sdk@2.45.0`, `twenty-client-sdk@2.45.0`, `twenty-ui@2.45.0`. SDK требует Node `^24.5.0`, Yarn `^4.0.2`, Twenty `>=2.40.0`; bundled Node `24.19.0` и Yarn `4.13.0` подходят. Эти точные версии следует сохранить в lockfile App на этапе 2. Ранее изученный source-кандидат monorepo `2.46.0` не использовался для App и заменён этим кандидатом.
- Codex: `codex-cli 0.160.1`, app-server через stdio, SHA-256 сгенерированной experimental schema `e77b7d1436a78f431a74b2cb263a862e92ae40d70411bc63835b47ab2168827c`. Это только кандидат протокола; app-server помечен experimental.
- Топология: один host, один worker, один изолированный непроизводственный Twenty workspace, `concurrency=1`; worker и app-server размещать на одном host. Наблюдавшийся локальный Compose endpoint — `127.0.0.1:3000`. Удалённая/production-топология не выбрана.
- Политика репозитория: кандидат — `anatolyshipitsyn/twenty-autonomus-ccompany`, базовая ветка `main`, отдельные task branches и проверяемые PR для поставки. App приватный, устанавливается только в изолированный непроизводственный workspace. `gh` авторизован как `anatolyshipitsyn`; `gh api` подтвердил право `push`.
- Credentials: передавать отдельный непроизводственный Twenty API key и GitHub credential из host-managed secret storage во время запуска; не коммитить credentials и не копировать их в Journal/analytics. Использовать least privilege. Ключ основного workspace `Codex Local MCP` имеет роль `Admin` и не подтверждён для изолированного target; это не выделенный app-dev credential.
- Развёртывание: production target не настроен. Production rollout, HA и удалённый worker не входят в этот кандидат. Для production потребуется отдельная конфигурация и проверка.

## Открытые вопросы и классификация

| Вопрос | Класс | Причина / проверка на зависимом этапе |
| --- | --- | --- |
| Контрактная схема и API поведение ещё не проверены на `v2.45.6`. | **Блокирует выход этапа 2** | Входная sync прошла; установить модель и проверить schema, indexes, дубликаты, Upsert/redelivery и permissions на target. |
| MCP toolset не показывает привязку API key к роли/least-privilege и plan/квоты workspace. | **Не блокирует разработку App** | Разрабатывать в изолированной app-dev среде; до установки/использования App в целевом workspace проверить отдельный least-privilege key и запрет неразрешённых операций на этапе 2, прочитать plan/квоты до включения workflows/recovery на этапах 3/5. |

| Codex app-server помечен experimental; подтверждены только initialize/EOF, persistent thread/turn не установлены. | **Не блокирует разработку App** | Схему App можно разрабатывать независимо. Перед интеграцией worker на этапе 4 закрепить протокол/schema и проверить persistent thread, turn, вопрос/ответ, interrupt, сверку истории и shutdown без повтора исполнения. Если experimental-статус неприемлем для пилота, оформить смену протокола до этапа 4. |
| Enforcement role boundaries в app-dev не проверен. | **Блокирует выход этапа 2** | Использовать credentials, назначенные ролям приложения, и проверить отклонение неразрешённых действий; не выводить runtime-поведение из role manifest. |
| Неизвестны plan/квоты workspace и наличие серверных SDK helpers. | **Не блокирует разработку App** | До включения workflows и recovery прочитать выбранный plan и проверить квоты/helpers на этапах 3/5; не выводить поведение plan из статических метаданных SDK. |
| Native Upsert перезаписывает неизменяемые поля Journal. | **Блокирует выход этапа 2** | Устранить поведение redelivery, нарушающее DATA-02, и повторить runtime probe на выбранном target. Workflow branches/concurrency остаются проверками этапа 3. |
| Backup/restore и полный Codex lifecycle не проверены; production deployment не настроен. | **Не блокирует разработку App** | Проверить restore на этапе 5 и полный lifecycle пилота на этапе 7. Production остаётся вне кандидата, пока не будет отдельно настроен и проверен. |
| Langfuse не выбран. | **Не блокирует разработку App** | Выбрать или отложить analytics и проверить export/recovery на этапе 6; по OPS-17 сбой analytics остаётся асинхронным. |

Этап 1 — **Completed — GO** и разрешил начать разработку App. Этап 2 — **In progress**: установка, readback схемы/связей и отклонение уникальных дублей прошли; неизменность Upsert и runtime permissions блокируют выход. Проверки Workflows относятся к этапу 3; интеграция границ записи worker — к этапу 4. Все 28 SAI остаются **Not verified**.

## Повторная проверка текущей сессии (8 октября 2026)

- Официальный Quick Start: `npx --yes create-twenty-app@latest` с Node `24.19.0` разрешил scaffolder `2.45.0`; проект получил `twenty-sdk@2.45.0`, `twenty-client-sdk@2.45.0`, `twenty-ui@2.45.0`. Engines требуют Node `^24.5.0`, Yarn `^4.0.2`, Twenty `>=2.40.0`.
- `yarn install` успешно завершился во временном scaffold. `yarn twenty dev` выполнил Resources Build/Upload, Manifest Build, Application Synchronization, Api Client Generation и синхронизировал 8 сущностей с изолированным app-dev server `v2.45.8` (CLI `2.45.0`). Единственное предупреждение: layout страницы шаблона использует устаревшее vertical-list positioning; синхронизация успешна.
- Выбранный локальный сервер `twentycrm/twenty:v2.45.6` вернул HTTP 200 для `/healthz`; GraphQL `{ __typename }` вернул HTTP 200 и `Query`.
- `codex app-server --stdio` принял `initialize` / `initialized`, вернул результат без RPC error, отправил status notification и завершился с кодом 0 по EOF (`codex-cli 0.160.1`). Это evidence handshake, не полного turn lifecycle.
- `gh auth status` показал активный `anatolyshipitsyn` с `repo` scope; `gh api repos/anatolyshipitsyn/twenty-autonomus-ccompany` подтвердил репозиторий и `push: true`.
- Scaffold находился в `/private/tmp`; удалены созданные для него контейнер `twenty-app-dev` и три volume. Временный проект и `node_modules` monorepo Twenty, отсутствовавший до проверки, удалены; SDK/App в workspace проекта не устанавливался.
- Предыдущая прямая команда monorepo `nx build twenty-sdk` остановилась на `twenty-shared:generateBarrels` с `listen EPERM`, до SDK target. Это ошибка сборочной среды, не свидетельство несовместимости SDK; выше приведены успешные build/install/sync доказательства официального App scaffold.

## Срез окружения

| Компонент | Наблюдаемое значение | Доказательство / оговорка |
| --- | --- | --- |
| Репозиторий оркестратора | `main`, `9d33725241e62e17fb73a0732321dc32bb23834b` | Checkout на момент проверки |
| Twenty server и worker | `twentycrm/twenty:v2.45.6`, digest `sha256:dca6d82985901468b391c0335aa8f0519a52b9809709e66f2de1dbff04351e53` (локальный image ID `sha256:ff1d85a1f029d99be27adf7b877362fe84c2870cdc9d3be15cd54a2026c0c15f`) | Server и worker используют один image. Server healthy; worker запущен. PostgreSQL и Redis healthy. Хост ARM64. Наблюдение от 8 октября 2026. |
| Авторизованный Twenty MCP | Protocol `2025-06-18`; server `Twenty MCP Server 0.1.0`; 28 имён стандартных объектов; 1 участник; 2 роли; 0 workflow | Доступ с ключом из локального `.env`, без его вывода. Текущая MCP toolset не раскрывает назначенную ключу роль и plan. |
| База / cache | PostgreSQL `16`; Redis `7-alpine` | Работающие Compose images |
| Docker Compose | `v5.5.1` | Локальный CLI |
| Кандидат Twenty SDK | Scaffold `2.45.0`; generated `twenty-sdk@2.45.0`; source checkout `2.46.0` superseded | Generated SDK installed and `yarn twenty dev` synchronized on isolated app-dev `v2.45.8`; target `v2.45.6` sync is Stage 2 entry check. |
| SDK toolchain | SDK requires Node `^24.5.0`, Yarn `^4.0.2`; host Node `v22.22.3`, Yarn `4.13.0`; bundled Node `v24.19.0` | Official scaffold installed and synced using bundled Node and Yarn. Host Node still does not satisfy SDK engine; use bundled Node for Stage 2. Earlier monorepo build failure is recorded separately. |
| Codex | `codex-cli 0.160.1` | `codex app-server --help` помечает app-server как experimental. `initialize` вернул RPC без ошибки. SHA-256 сгенерированной experimental schema: `e77b7d1436a78f431a74b2cb263a862e92ae40d70411bc63835b47ab2168827c`. |
| Langfuse | Не выбран / не настроен в этом репозитории | Версия SDK/API, deployment и разрешённые данные остаются открытыми. |

## Проверки

| Требование | Проверка и фактический результат | Оценка |
| --- | --- | --- |
| SAI-13 — целевой сервер/API | Текущий `docker compose ps` показывает `v2.45.6`: server, PostgreSQL и Redis healthy, worker запущен. `GET /healthz` вернул HTTP 200 и `{"status":"ok",...}`. Ранее неавторизованный GraphQL `POST /graphql` с `{__typename}` вернул HTTP 200 и `Query`. | **Частично.** Подтверждены текущее состояние health и доступность endpoint, а также прежняя базовая проверка GraphQL. |
| SAI-13 — схема workspace и права | Авторизованный app-dev metadata/API schema readback вернул установленные `Project`, `AiTask`, `AiRun` и `AiRunJournal` с ожидаемыми полями/связями. Role definitions ограничивают operator чтением Journal, Workflows доступом к task/run/journal, worker — Journal. Runtime-проверки с credentials, назначенными ролям, не выполнялись; effective role probe credential не установлена. | **Частично.** Схема установлена и прочитана обратно; enforcement least-privilege не проверен. SAI остаётся `Not verified`. |
| SAI-13 — совместимость SDK/server | Generated SDK `2.45.0` declares `>=2.40.0`; selected server `v2.45.6` is in range; official scaffold sync passed on `v2.45.8`. | **Partial.** Exact sync against `v2.45.6` is a Stage 2 entry check; this gate does not close SAI. |
| SAI-13 / SAI-18 — unique keys | Установленный target отклонил duplicate creates для `AiRun.runKey` и `AiRunJournal.operationKey` из-за unique constraint. Временные записи удалены. | **Runtime partial.** Отклонение дублей прошло; SAI остаётся `Not verified`, потому что другие части acceptance не выполнены. |
| SAI-18 — записи и relations | GraphQL create/readback подтвердил связи Project→AiTask, AiTask→AiRun и task/run→Journal; все временные записи удалены. | **Runtime partial.** Запись/readback связей прошли; workflow acceptance не проверена. |
| SAI-18 — Upsert | Target GraphQL `createAiRunJournal(..., upsert:true)` принял повторный operationKey, но изменил `payload` с `immutable-v1` на `immutable-v2` и `resultCode` с `OK` на `ERROR`. | **Runtime failure относительно DATA-02.** Native Upsert не сохраняет payload/terminal outcome; этап 2 заблокирован. Статус SAI не изменён. |
| SAI-18 — workflows и concurrency | Авторизованный MCP `list_workflows` вернул 0 workflow. | **Не проверено.** IF/else, четыре workflow, сериализация, конкурентный Dispatch, права и отсутствие workflow storm требуют тестового workspace. |
| SAI-20 — plan, квоты и SDK helpers | Plan workspace и квоты не раскрываются текущим авторизованным MCP toolset. | **Не проверено.** Поведение квот и наличие SDK helpers на сервере/plan не проверялись. |
| Codex protocol в составе SAI-13 | `codex app-server --stdio` принял `initialize` и `initialized`, вернул initialize response без ошибки и завершился с кодом 0 после EOF; сгенерированная schema содержит `thread/start`, `thread/read`, `turn/start`, `turn/interrupt`. Изолированный `thread/start` вернул `ephemeral=false`, но без turn rollout file не создался, а после рестарта процесса `thread/list` вернул 0 (включая фильтр `appServer`). | **Частично.** Handshake и завершение процесса после EOF прошли. Persistence thread/history не подтверждена: probe без turn не даёт однозначного результата; authenticated model turn, вопрос/ответ, interrupt, сверка истории и shutdown при активном turn не запускались. App-server явно помечен experimental. |

## Команды и результаты

- `docker compose ps --format json` — server `v2.45.6` healthy; worker `v2.45.6` запущен; PostgreSQL и Redis healthy. Compose image label server/worker: `sha256:ff1d85a1f029d99be27adf7b877362fe84c2870cdc9d3be15cd54a2026c0c15f`.
- `docker image inspect twentycrm/twenty:v2.45.6` — registry digest `sha256:dca6d82985901468b391c0335aa8f0519a52b9809709e66f2de1dbff04351e53`.
- `curl -fsS -D - http://127.0.0.1:3000/healthz` — HTTP 200; тело `{"status":"ok","info":{},"error":{},"details":{}}`.
- `curl -X POST http://127.0.0.1:3000/graphql` с `{__typename}` — HTTP 200; получен `Query`.
- `curl http://127.0.0.1:3000/rest/metadata/objects` — без авторизации HTTP 403.
- `docker compose config --quiet` — базовая конфигурация Compose валидна. Production merge не прошёл интерполяцию: в `.env` отсутствуют `SERVER_URL`, `PG_DATABASE_PASSWORD` и `ENCRYPTION_KEY`; production runtime не настраивался.
- Авторизованный MCP `initialize` / `tools/list` — protocol `2025-06-18`; server `Twenty MCP Server 0.1.0`; семь wrapper tools. Бизнес-методы загружались через `learn_tools` и вызывались через `execute_tool`.
- Авторизованные MCP metadata / roles / workflows — 28 имён стандартных объектов; четыре контрактных объекта отсутствуют до разработки/установки приложения; 2 роли; 0 workflow. У Admin разрешены глобальные чтение/обновление/удаление/destroy и все tools; у Member также широкие глобальные права чтения/обновления/удаления/destroy и все tools, но API keys назначать нельзя. Привязка текущего ключа к роли и plan недоступны через этот toolset.
- Текущая временная Company-проверка через MCP — create, update, read-back, soft-delete успешны; поиск по точному обновлённому имени после удаления вернул 0 видимых записей. Одна soft-deleted запись остаётся обратимой в Twenty. `TWENTY_API_KEY` прочитан из локального `.env`, значение не выводилось.
- `docker compose run --rm bootstrap` — успешно завершился на Twenty `v2.45.6` и повторно использовал существующий локальный API key без его вывода. Проверен только повторный запуск с готовым ключом; создание нового ключа и запись в `.env` остаются непроверенными.
- `codex --version` — `codex-cli 0.160.1`.
- `codex app-server generate-json-schema --experimental --out /tmp/twenty-compat-gate-codex-schema` — успешно; schema временная и не добавлена в репозиторий.
- `codex app-server --stdio` с `initialize` / `initialized` и EOF — exit 0; initialize response получен без RPC error. Это handshake probe, не тест turn lifecycle.
- Изолированный Codex persistence probe — временный `CODEX_HOME`, пустые credentials и без AI turn: `thread/start` вернул persistent thread, но rollout file не создался; после рестарта `thread/list` вернул 0 при default, `appServer` и state-DB-only фильтрах. Без turn результат неокончательный и не доказывает сбой persistence.
- `node --version` / bundled Node executable — системная `v22.22.3`; bundled `v24.19.0`.
- `yarn --version` — `4.13.0`.
- SDK source checkout `a3e874920cfa319c7c8683e020b65795d6193af8` содержит `twenty-sdk@2.46.0` с `engines.twenty >=2.40.0`, Node `^24.5.0`, Yarn `^4.0.2`; диапазон включает сервер `v2.45.6`. В checkout нет `node_modules`, пакет не установлен, app build/install не выполнялись.
- `yarn install --immutable` во временном полном Twenty checkout завершился с peer-dependency warnings; `yarn.lock` не изменён. `nx build twenty-sdk --skip-nx-cache` запустил prerequisite `twenty-shared:generateBarrels`, но `tsx`/esbuild процессы не завершились и build был прерван; target `twenty-sdk` не достигнут. Прямая попытка Vite из focused install не разрешила workspace import `twenty-shared/utils`. Созданные зависимости удалены; `git status` checkout Twenty чистый.
- При разрешённом сетевом доступе `gh auth status` — активный `anatolyshipitsyn` авторизован с scope `repo`. `gh pr create` создал PR #6; `gh pr view` показывает `MERGEABLE` / `CLEAN`, а `gh pr checks` сообщает, что checks не настроены. Это подтверждает базовый доступ к репозиторию/PR, но не идемпотентность публикации оркестратора.

## Какие доказательства ещё нужны

- Устранить обнаруженную перезапись при native Upsert и подтвердить неизменность redelivery по DATA-02 на изолированном `v2.45.6`.
- Проверить role boundaries с credentials, назначенными operator, Workflows и worker; подтвердить, что worker не может менять бизнес-lifecycle и несвязанные записи/поля Journal. Схема, связи и отклонение дублей уже проверены; результаты и ограничения native Upsert описаны в [evidence этапа 2](stage-2-data-model.ru.md).
- Проверить четыре workflow, конкурентный Dispatch, IF/else, расписание и отсутствие heartbeat storm.
- Прочитать plan выбранного workspace и проверить соответствующие квоты/rate limits.
- Закрепить Codex CLI/app-server protocol и проверить persistent thread, turn lifecycle, вопросы, interrupt, сверку истории и shutdown процесса без повторного исполнения.
- На этапе 6 выбрать Langfuse deployment и SDK/API version либо записать, что analytics отложены.

Исторический срез на 8 октября: этап 1 был завершён с **GO**, а этап 2 имел статус **Proposed**. Точная входная проверка и текущие результаты этапа 2 описаны в [актуальном отчёте](stage-2-data-model.ru.md); SAI-13, SAI-18 и SAI-20 остаются **Not verified**.

## Покрытие полного OPS gate

Таблица ниже — исторический срез предпроектного gate; текущие installation/runtime probes см. в [актуальном evidence этапа 2](stage-2-data-model.ru.md).

Контракт эксплуатации задаёт более широкий предпроектный gate, чем три SAI, связанные со строкой этапа 1 в плане. Этот отчёт не считает gate завершённым только на основании этой строки.

| Пункт OPS gate | Текущие доказательства | Статус |
| --- | --- | --- |
| Приватный app; три объекта и Project | Приложение ещё не разработано и не установлено; отсутствие его четырёх объектов на этом этапе ожидаемо | Не проверено |
| Relations, indexes и Upsert | Контрактных объектов нет; общий Company CRUD прошёл, но целевая схема, индексы, дубли и повторная доставка не проверялись | Не проверено |
| Ответ router и profiles | В проекте нет приложения или router implementation | Не проверено |
| Четыре workflow, Form, branches, scheduler | Авторизованный MCP показывает ноль workflow; тестового запуска не было | Не проверено |
| Permissions, ingress и secrets | MCP показывает Admin/Member с широкими глобальными правами; назначение роли API key и least-privilege не проверены. Server опубликован на `127.0.0.1:3000`; unauthenticated GraphQL `__typename` возвращает 200, REST metadata — 403. Локальный ключ не выводился. | Частично / не проверено |
| Concurrent Dispatch и PENDING recovery | Orchestrator worker и Journal app ещё не реализованы | Не проверено |
| Codex handshake, вопросы, interrupt, history, shutdown | `initialize`/`initialized` завершились без ошибки и app-server вышел по EOF; lifecycle RPC не вызывались | Частично / не проверено |
| GitHub permissions и идемпотентность PR | Активный `anatolyshipitsyn` создал PR #6; GitHub сообщает `MERGEABLE` / `CLEAN`, checks не настроены. Идемпотентность публикации оркестратора не проверялась. | Частично / не проверено |
| Native UI и quotas | Plan/UI workspace не проверялись | Не проверено |
| Backup и restore | Backup/restore не выполнялись | Не проверено |
| Лимиты Search/Logic Function/schedule, pagination Journal, IF/else, enforcement permissions | На закреплённой версии сервера и plan workspace не проверялись | Не проверено |
| Долгий Codex execution на host; топология worker-to-Twenty | Orchestrator worker не реализован; deployment topology не настроена | Не проверено |

Ранее в записи плана Notion было написано «полный gate — все 28 SAI». Владелец уточнил область в запросе от 8 октября: OPS задаёт gate до разработки, а все 28 SAI остаются критериями интеграционной приёмки пилота. Связанный открытый вопрос Notion теперь закрыт с этим решением; статусы SAI здесь не меняются.

## Повторная входная проверка этапа 2 (9 октября 2026)

Эта историческая запись заменена текущим [evidence модели этапа 2](stage-2-data-model.ru.md).

- Запущен изолированный disposable `twentycrm/twenty-app-dev:v2.45.6` как `twenty-stage2-appdev-v2456`, опубликован только на `127.0.0.1:2020`. `GET /healthz` вернул HTTP 200. Основной Compose workspace не использовался.
- Официальный scaffolder `create-twenty-app@2.45.0` создал `apps/twenty-app/` с Node `24.19.0` и Yarn `4.13.0`. В `package.json` закреплены `twenty-sdk`, `twenty-client-sdk` и `twenty-ui` `2.45.0`; `yarn.lock` фиксирует эти версии. CLI binary `twenty` предоставляется закреплённым `twenty-sdk@2.45.0`.
- Историческая техническая заметка: первая попытка scaffold через `host.docker.internal` выбрала OAuth; успешная точная синхронизация `yarn twenty dev` с `v2.45.6` описана выше. Credential позднее перевыпущен и хранится в host-managed Keychain; прежнее значение здесь не приводится.
- Read-only проверка Settings → MCP & APIs основного workspace показала для credential из `.env`: имя `Codex Local MCP`, Role `Admin`, Expiration `Never`. Автоматическая проверка доступа отклонила read-only probe, который должен был передать этот primary Admin key отдельному disposable app-dev container: scope ключа в другом workspace не подтверждён. Передачи и probe не было; обход блокировки не предпринимался.
- Этап 2 остаётся **In progress**. Credential перевыпущен и сохранён в host-managed Keychain; секрет не включён в репозиторий или knowledge base. Текущие результаты установки и проверок, включая несоответствие Upsert DATA-02, записаны в [отчёте этапа 2](stage-2-data-model.ru.md). Все 28 SAI ID и статусы сохранены.
