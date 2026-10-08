# Compatibility gate — текущие результаты

Дата: 8 октября 2026 · Область: предпроектные проверки из OPS compatibility gate; строка этапа 1 связывает SAI-13, SAI-18, SAI-20 · Статус: **НЕ ПРОЙДЕН — ЧАСТИЧНЫЕ ДОКАЗАТЕЛЬСТВА**

[English version](compatibility-gate.md) · [Контракт эксплуатации](../requirements/operations.ru.md) · [Контракт протокола](../requirements/protocol.ru.md) · [Матрица приёмки](../requirements/acceptance.ru.md)

## Вердикт

Настроенный self-hosted сервер Twenty работает. Авторизованный доступ к Twenty MCP работает с локально сохранённым `TWENTY_API_KEY`: workspace возвращает 28 имён стандартных объектов, одного участника, две роли и ноль workflow. Объекты `AiTask`, `AiRun`, `AiRunJournal` и `Project` отсутствуют, потому что приложение Twenty, которое их определяет, ещё не разработано и не установлено. На текущем этапе это ожидаемо и не указывает на несовместимость сервера. Ограниченная проверка Company create/update/read-back/soft-delete прошла; последующий поиск не нашёл временных записей.

Gate остаётся **НЕ ПРОЙДЕН — ЧАСТИЧНЫЕ ДОКАЗАТЕЛЬСТВА**: SDK не закреплён и не установлен; приложение, определяющее контрактные объекты и workflow, ещё нужно разработать и установить; MCP не раскрывает назначенную API key роль и plan/квоты; runtime lifecycle Codex app-server не проверен. Приложение, custom object и workflow не устанавливались и не менялись. Во время предыдущей проверки две временные Company-записи были soft-delete; в текущем прогоне ещё одна запись прошла create/update/read-back/soft-delete, после удаления поиск вернул 0 видимых записей. Локальный bootstrap также успешно запущен с Twenty `v2.45.6` и повторно использовал существующий ключ `Codex Local MCP`; создание нового ключа и запись в `.env` этой проверкой не подтверждены. Секрет не выводился и не сохранялся в отчёте.

## Срез окружения

| Компонент | Наблюдаемое значение | Доказательство / оговорка |
| --- | --- | --- |
| Репозиторий оркестратора | `main`, `9d33725241e62e17fb73a0732321dc32bb23834b` | Checkout на момент проверки |
| Twenty server и worker | `twentycrm/twenty:v2.45.6`, digest `sha256:dca6d82985901468b391c0335aa8f0519a52b9809709e66f2de1dbff04351e53` (локальный image ID `sha256:ff1d85a1f029d99be27adf7b877362fe84c2870cdc9d3be15cd54a2026c0c15f`) | Server и worker используют один image. Server healthy; worker запущен. PostgreSQL и Redis healthy. Хост ARM64. Наблюдение от 8 октября 2026. |
| Авторизованный Twenty MCP | Protocol `2025-06-18`; server `Twenty MCP Server 0.1.0`; 28 имён стандартных объектов; 1 участник; 2 роли; 0 workflow | Доступ с ключом из локального `.env`, без его вывода. Текущая MCP toolset не раскрывает назначенную ключу роль и plan. |
| База / cache | PostgreSQL `16`; Redis `7-alpine` | Работающие Compose images |
| Docker Compose | `v5.5.1` | Локальный CLI |
| Кандидат Twenty SDK | `twenty-sdk@2.46.0`, checkout исходников Twenty `a3e874920cfa319c7c8683e020b65795d6193af8` | Только кандидат; проект его не закрепляет и не устанавливает. Package заявляет `engines.twenty >=2.40.0`, поэтому `v2.45.6` входит в диапазон. Это не доказывает install/runtime совместимость. |
| SDK toolchain | SDK требует Node `^24.5.0`, Yarn `^4.0.2`; системные Node `v22.22.3`, Yarn `4.13.0`; bundled Node `v24.19.0` | Системный Node не подходит; bundled Node подходит. `yarn install --immutable` завершился, но Nx build не дошёл до target `twenty-sdk`: завис на `twenty-shared:generateBarrels` и был остановлен. Временный `node_modules` удалён; в checkout нет изменений исходников или lockfile. |
| Codex | `codex-cli 0.160.1` | `codex app-server --help` помечает app-server как experimental. `initialize` вернул RPC без ошибки. SHA-256 сгенерированной experimental schema: `e77b7d1436a78f431a74b2cb263a862e92ae40d70411bc63835b47ab2168827c`. |
| Langfuse | Не выбран / не настроен в этом репозитории | Версия SDK/API, deployment и разрешённые данные остаются открытыми. |

## Проверки

| Требование | Проверка и фактический результат | Оценка |
| --- | --- | --- |
| SAI-13 — целевой сервер/API | Текущий `docker compose ps` показывает `v2.45.6`: server, PostgreSQL и Redis healthy, worker запущен. `GET /healthz` вернул HTTP 200 и `{"status":"ok",...}`. Ранее неавторизованный GraphQL `POST /graphql` с `{__typename}` вернул HTTP 200 и `Query`. | **Частично.** Подтверждены текущее состояние health и доступность endpoint, а также прежняя базовая проверка GraphQL. |
| SAI-13 — схема workspace и права | Авторизованный MCP вернул 28 имён стандартных объектов; целевые запросы metadata для `AiTask`, `AiRun`, `AiRunJournal` и `Project` не нашли совпадений. Эти объекты создаёт приложение, которое ещё не разработано и не установлено, поэтому их отсутствие ожидаемо. Найден один участник. `list_roles` вернул Admin и Member; обе роли имеют глобальные права чтения/обновления/удаления и доступ ко всем tools, правил для объектов нет. Назначенная API key роль и plan не раскрываются. | **Частично.** Проверены MCP-доступ и стандартная metadata workspace; схему приложения, least-privilege, привязку ключа и plan нужно проверить после реализации и установки. |
| SAI-13 — совместимость SDK/server | Metadata кандидата SDK заявляет `>=2.40.0`; текущий server — `v2.45.6`, он входит в этот диапазон. В CLI кандидата есть проверки совместимости SDK/server при install. | **Частично.** Точная версия SDK не закреплена в репозитории и не устанавливалась на работающий сервер. |
| SAI-13 / SAI-18 — unique keys | SDK source принимает `isUnique` для scalar fields и отклоняет для relation/files; source unit test проверяет unique text field. | **Только статические доказательства.** App не устанавливался, отклонение дублирующего ключа в базе не проверялось. Изучен отдельный checkout `twenty` со snapshot выше, не исходники работающего tag `v2.45.6`. |
| SAI-18 — записи | Авторизованная проверка Company прошла: create, update, read-back, soft-delete и поиск после удаления (0 видимых временных записей). | **Частично.** Подтверждён только общий Company CRUD; записи контрактных объектов, unique indexes, отклонение дублей, relations и Upsert/redelivery не проверялись. |
| SAI-18 — Upsert | В проверенном server source есть обработка `upsert` для REST и GraphQL. | **Только статические доказательства.** Idempotency, неизменность результата, повторная доставка и Upsert не запускались на целевом сервере. |
| SAI-18 — workflows и concurrency | Авторизованный MCP `list_workflows` вернул 0 workflow. | **Не проверено.** IF/else, четыре workflow, сериализация, конкурентный Dispatch, права и отсутствие workflow storm требуют тестового workspace. |
| SAI-20 — plan, квоты и SDK helpers | Plan workspace и квоты не раскрываются текущим авторизованным MCP toolset. | **Не проверено.** Поведение квот и наличие SDK helpers на сервере/plan не проверялись. |
| Codex protocol в составе SAI-13 | `codex app-server --stdio` принял `initialize` и `initialized`, вернул initialize response без ошибки и завершился с кодом 0 после EOF; сгенерированная schema содержит `thread/start`, `thread/read`, `turn/start`, `turn/interrupt`. | **Частично.** Проверены handshake и завершение процесса после EOF. Persistent thread, turn lifecycle, вопрос/ответ, interrupt, сверка истории и shutdown при активном turn не запускались. App-server явно помечен experimental. |

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
- `node --version` / bundled Node executable — системная `v22.22.3`; bundled `v24.19.0`.
- `yarn --version` — `4.13.0`.
- SDK source checkout `a3e874920cfa319c7c8683e020b65795d6193af8` содержит `twenty-sdk@2.46.0` с `engines.twenty >=2.40.0`, Node `^24.5.0`, Yarn `^4.0.2`; диапазон включает сервер `v2.45.6`. В checkout нет `node_modules`, пакет не установлен, app build/install не выполнялись.
- `yarn install --immutable` во временном полном Twenty checkout завершился с peer-dependency warnings; `yarn.lock` не изменён. `nx build twenty-sdk --skip-nx-cache` запустил prerequisite `twenty-shared:generateBarrels`, но `tsx`/esbuild процессы не завершились и build был прерван; target `twenty-sdk` не достигнут. Прямая попытка Vite из focused install не разрешила workspace import `twenty-shared/utils`. Созданные зависимости удалены; `git status` checkout Twenty чистый.
- При разрешённом сетевом доступе `gh auth status` — активный `anatolyshipitsyn` авторизован с scope `repo`. `gh pr create` создал PR #6; `gh pr view` показывает `MERGEABLE` / `CLEAN`, а `gh pr checks` сообщает, что checks не настроены. Это подтверждает базовый доступ к репозиторию/PR, но не идемпотентность публикации оркестратора.

## Какие доказательства ещё нужны

- Разработать Twenty app, которая определит `AiTask`, `AiRun`, `AiRunJournal`, `Project` и нужные workflow; закрепить версию Twenty SDK и выполнить build/install compatibility check на `v2.45.6`.
- Установить приложение в непроизводственный workspace и проверить его схему, relations, scalar unique indexes, отклонение дублей, Upsert/redelivery и permissions. Текущий MCP credential позволяет менять стандартные Company-записи; назначенную ему роль и least-privilege нужно подтвердить отдельно.
- Проверить четыре workflow, конкурентный Dispatch, IF/else, расписание и отсутствие heartbeat storm.
- Прочитать plan выбранного workspace и проверить соответствующие квоты/rate limits.
- Закрепить Codex CLI/app-server protocol и проверить persistent thread, turn lifecycle, вопросы, interrupt, сверку истории и shutdown процесса без повторного исполнения.
- Выбрать Langfuse deployment и SDK/API version либо явно записать, что analytics отложены для этого gate.

Пока эти проверки не подтверждены, SAI-13, SAI-18 и SAI-20 остаются **Not verified**, а этап 1 нельзя считать пройденным.

## Покрытие полного OPS gate

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

В записи плана в Notion также указано «полный gate — все 28 SAI». Git-контракт приёмки определяет все 28 SAI как интеграционные критерии пилота, а OPS описывает compatibility check до реализации. Это расхождение области нужно разрешить в базе знаний проекта; статусы SAI здесь не менялись.
