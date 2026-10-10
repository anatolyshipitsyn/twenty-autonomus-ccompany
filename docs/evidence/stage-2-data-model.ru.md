# Доказательства модели данных и изолированной установки этапа 2

Дата: 10 октября 2026 · Статус: **Completed** · Target: disposable Twenty App Dev `v2.45.6`

[English version](stage-2-data-model.md) · [Roadmap](../ROADMAP.ru.md) · [Domain contract](../requirements/domain.ru.md) · [Матрица приёмки](../requirements/acceptance.ru.md)

## Результат

Исходники приватного App находятся в `apps/twenty-app`; App синхронизирован только с изолированным непроизводственным target на `127.0.0.1:2020`. Он определяет три оркестраторских объекта (`AiTask`, `AiRun`, `AiRunJournal`) и связанный бизнес-объект `Project`. Зафиксированные прямые версии: `twenty-sdk@2.45.0` (включая CLI), `twenty-client-sdk@2.45.0`, `twenty-ui@2.45.0`; для проверки использовались Node.js `v24.19.0` и Yarn `4.13.0`.

Входная проверка использовала официальный Twenty scaffolder и `yarn twenty dev --once` против выбранного сервера `v2.45.6`. CLI завершил синхронизацию, загрузил 3 файла, применил manifest и сгенерировал API client. Постоянный CLI credential для этого запуска не использовался: временная конфигурация с правами `600`, полученная из Keychain, удалена после завершения команды. Production workspace не использовался. Workflows этапа 3, операторский UI, worker service, очередь, Codex app-server, аналитика и deployment не добавлялись.

## Runtime evidence

- Target metadata и generated API schema подтвердили `AiTask`, `AiRun`, `AiRunJournal` с полями контракта, а также `Project` как связанный бизнес-объект. Create/readback подтвердил `Project → AiTask`, `AiTask → AiRun` и `AiTask/AiRun → AiRunJournal`; relation IDs совпали с ID связанных записей.
- Unique indexes `AiRun.runKey` и `AiRunJournal.operationKey` отклонили дубли. Повторный Journal POST с тем же `operationKey` вернул HTTP 400 из-за database unique constraint.
- Full-payload Journal Upsert может перезаписать `payload` и терминальный `resultCode`, поэтому этот вариант небезопасен при redelivery. Key-only и sparse `{ operationKey, taskId }` Upsert сохранили `payload`, `resultCode`, `state` и связь. Повторная доставка Workflows с тем же `operationKey` была отклонена. Это проверяет возможности хранилища, но не будущую логику consumer для сравнения payload и недопущения повторного исполнения.
- API-пробы Workflows прочитали Task/Run, применили разрешённый переход Task и изменение версии с readback, создали и прочитали связанный `AiRun`, а также создали синтетическую запись Journal в состоянии PENDING. Workflows установил `APPLIED` и `resultCode=OK`; readback прошёл. Это были только API-пробы permissions; Workflows в этапе 2 не настраивались.
- Operator API key прочитал Journal (HTTP 200); POST и PATCH Journal были отклонены (HTTP 400 `PERMISSION_DENIED`). Временная настройка assignability роли для API key возвращена в `false` и отсутствовала в списке доступных ролей. Представления и операторский UI не настраивались.
- Обновлённая Worker role прочитала Journal через `GET /rest/aiRunJournals` (HTTP 200) и увидела синтетическую PENDING-запись с непустым `workerId`. Создание синтетического `STARTED` Journal event вернуло HTTP 201; readback — HTTP 200. PATCH полей `activeTimeMs` и `checkpointAt` вернул HTTP 200, значения совпали при чтении.
- Worker PATCH синтетического `AiTask.status=RUNNING` был отклонён (HTTP 400 `PERMISSION_DENIED`). PATCH его Journal-записи со `state=APPLIED` также отклонён (HTTP 400), поскольку итоговая строка выходит из row-level scope PENDING.
- Worker PATCH `payload` существующей PENDING-записи вернул HTTP 200. Исходный синтетический payload был восстановлен; readback подтвердил восстановленное значение. Это подтверждает принятое ограничение native permissions Twenty: роль может менять поля, необходимые для создания событий, и не может обеспечивать write-once для существующей записи в своём scope. Consumer должен сравнить существующие `operationKey` и payload перед обработкой и сохранять применённые/терминальные результаты при redelivery. Эта логика относится к последующему этапу Worker и здесь не реализована.
- Ранее наблюдавшийся Worker `UNAUTHENTICATED` был вызван некорректным row-filter значением, а не отказом ACL: target ожидал JSON-массив для `state IS`, но получил строку `PENDING`. В manifest передаётся `['PENDING']`; Worker authentication и синхронизация с выбранным target прошли.
- REST create с пустым RAW_JSON payload `{}` вернул HTTP 400: target сохранил значение как null, что нарушило NOT NULL constraint. Непустой синтетический payload прошёл; обходное поле не добавлялось.
- При UI-проверке значение одного Admin API key случайно попало в accessibility-результат. Этот ключ был отозван; его значение не записывалось в репозиторий или Notion. Владелец подтвердил, что disposable workspace будет удалён после этапа 2 и оставшиеся временные тестовые credentials могут храниться до удаления. Текущая постоянная конфигурация CLI сообщает `api-key (invalid)`; синхронизация с выбранным сервером выполнена через временную конфигурацию из Keychain.
- В disposable workspace остаются синтетические тестовые записи, включая текущую Worker probe. Target изолирован от production. Секреты и Bearer значения в evidence не включены.

## Критерии выхода и продолжение

Критерии выхода этапа 2 **подтверждены**: приватный App синхронизирован с изолированным выбранным сервером; schema и relations прочитаны обратно; unique indexes и отклонение дублей проверены; поддерживаемое поведение Upsert проверено; границы permissions Operator, Workflows и Worker проверены на синтетических записях. Принятое ограничение native permissions описано в domain contract.

Остаток, который не блокирует установку модели данных и относится к следующим этапам:

- Будущая реализация Worker должна сравнивать сохранённые operation key и payload при redelivery, возвращать сохранённый исход для точного дубликата, отклонять несовпадающий payload и не выполнять уже применённую операцию повторно. Здесь проверены только возможности target storage и permissions.
- Конфигурация Workflows, бизнес-переходы и интерфейс оператора относятся к этапу 3. В этом этапе Workflows и операторский UI не создавались.
- Все 28 SAI ID и статусов сохранены без изменений и остаются **Not verified**. Полный прогон не выполнялся; SAI-13, SAI-15, SAI-18 и SAI-24 этими пробами этапа 2 не закрыты.
- Этап 2 не включает Worker service, очередь, интеграцию Codex app-server, аналитику, отчётность, backup/restore или production deployment.
