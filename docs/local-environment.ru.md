# Среда Twenty в Docker Compose

[English version](local-environment.md) · [README](../README.md)

Среда использует неизменённый официальный образ `twentycrm/twenty:v2.45.0`, PostgreSQL 16, Redis 7 и фоновый worker Twenty. Регистрация через UI использует стандартный onboarding Twenty и демоданные. Необязательный сервис bootstrap создаёт пустой workspace и пропускает onboarding. Сборка образа и патчи не требуются.

Worker оркестратора NestJS/Codex и его пользовательские объекты/workflows не реализованы. Все 28 [критериев SAI](requirements/acceptance.ru.md) остаются Not verified.

## Локальный запуск

Требования: работающий Docker, Docker Compose и не менее 2 ГБ RAM для среды. Конфигурации base и production проверены с Compose v5.5.1. Production override требует поддержку `!reset` для удаления локального сервиса bootstrap.

1. Из корня репозитория проверьте конфигурацию и запустите среду:

   ```sh
   docker info
   docker compose config --quiet
   docker compose up -d --wait --wait-timeout 240
   ```

2. Выберите способ создания первого аккаунта до регистрации через UI:
   - Пустой workspace: выполните [инструкции bootstrap](#bootstrap-администратора-и-пустого-workspace).
   - Workspace с демоданными: откройте [http://localhost:3000](http://localhost:3000), зарегистрируйтесь и пройдите стандартный onboarding Twenty.
3. Проверьте среду:

   ```sh
   docker compose ps
   docker compose logs --tail=100 server worker
   curl --fail http://localhost:3000/healthz
   ```

## Настройки

Настройки собраны сверху [compose.yaml](../compose.yaml); [.env.example](../.env.example) содержит overrides. Compose берёт shell environment, затем `.env`, затем defaults. GitHub variables/secrets должны попасть в процесс, запускающий Compose.

Общие defaults:

- `IS_MULTIWORKSPACE_ENABLED=true`.
- `IS_CONFIG_VARIABLES_IN_DB_ENABLED=true`: при наличии сохранённого значения Twenty предпочитает конфигурацию из БД переменным окружения, кроме переменных только из environment. Приоритет подстановки Compose применяется до этого runtime lookup.
- `DEFAULT_SUBDOMAIN=app`.
- `STORAGE_TYPE=local`.
- `SIGN_IN_PREFILLED=false`.

`SIGN_IN_PREFILLED=false` управляет заполнением формы входа. Установите `true` в `.env`, чтобы подставлять встроенные в Twenty email и пароль `tim@apple.dev`; флаг не использует `BOOTSTRAP_ADMIN_EMAIL` или `BOOTSTRAP_ADMIN_PASSWORD` и не создаёт аккаунт или CRM-демоданные. Примените изменения командой `docker compose up -d server worker`.

Необязательные overrides:

```sh
cp .env.example .env
docker compose config --quiet
docker compose up -d --wait
```

Другой HTTP-порт без `.env`:

```sh
HTTP_PORT=3001 docker compose up -d --wait
```

Без явного `SERVER_URL` он следует за `HTTP_PORT`. Если `SERVER_URL` задан в `.env`, обновляйте оба значения. HTTP по умолчанию привязан к loopback; PostgreSQL и Redis не публикуют порты на хосте. Сервер и worker используют общее локальное файловое хранилище.

Credentials и ключ шифрования в репозитории — публичные локальные defaults. `.env` и `.env.*` игнорируются, кроме `.env.example`. `docker compose config` выводит секреты; используйте `config --quiet` для проверки.

## Bootstrap администратора и пустого workspace

Локальный сервис `bootstrap` использует скомпилированные NestJS-сервисы образа Twenty. Он вызывает штатную регистрацию и `activateWorkspace`, подавляет demo prefill только в этом процессе и снимает все флаги/историю onboarding до входа. [Скрипт](../scripts/bootstrap.cjs) не содержит прямых SQL-запросов и не загружает SQL snapshot; с БД работают сервисы и ORM Twenty. Сервер и worker сохраняют стандартное поведение для workspace, созданных позже через UI.

1. Задайте приватные значения локального bootstrap в `.env`:
   - `BOOTSTRAP_ADMIN_EMAIL`: email для входа администратора.
   - `BOOTSTRAP_ADMIN_LAST_NAME`: фамилия администратора, по умолчанию `User`; имя — `Admin`.
   - `BOOTSTRAP_ADMIN_PASSWORD`: пароль длиной 12–50 символов без переносов строк; штатная проверка и хеширование выполняются до маркера создания.
   - `BOOTSTRAP_WORKSPACE_NAME`: отображаемое имя workspace.
   - `BOOTSTRAP_WORKSPACE_SUBDOMAIN`: корректный уникальный subdomain Twenty, например `autonomous-company`. Зарезервированные имена вроде `app` и настроенный `DEFAULT_SUBDOMAIN` использовать нельзя. Сервис проверяет доступность до записи намерения bootstrap.
2. Запустите одноразовый сервис:

   ```sh
   docker compose run --rm bootstrap
   ```

3. Откройте настроенный `SERVER_URL` и войдите с credentials администратора. Все формы onboarding пропущены: connect account, установка приложений, профиль, приглашение команды и история возврата к этим шагам.

Поведение и ограничения:

- Первый запуск требует свежую БД с миграциями, в том числе без soft-deleted пользователей/workspace. Во время provisioning не регистрируйтесь через UI.
- Требуется self-hosted Twenty с отключённым billing. Внутренние API сервисов и подавление prefill в процессе проверены на `v2.45.0`; при смене образа перепроверьте совместимость.
- Создаются стандартные объекты, поля, views, роли, администратор сервера и участник workspace с ролью Admin. Демозаписи company, person, opportunity, workflow и dashboard отсутствуют; установка необязательных onboarding-приложений пропускается.
- Обновления профиля затрагивают только подтверждение email и неизменённые пустые фамилии. Пароль, блокировка, существующие имена и бизнес-записи сохраняются. Кеши пользователя/workspace инвалидируются без очистки очередей.
- Credentials передаются через environment контейнера; env-файл должен оставаться приватным.

## Последовательность bootstrap

1. Проверить обязательные переменные окружения, запустить NestJS context, убедиться, что billing отключён, и получить `LOCAL_ADMIN_BOOTSTRAP_LOCK`.
2. Прочитать `LOCAL_ADMIN_BOOTSTRAP_STATE` из глобальной области `USER_VARIABLE` хранилища key-value Twenty и проверить сохранённую identity и завершение.
3. Найти соответствующего незаблокированного администратора и workspace со статусом `ACTIVE` или `CREATED`. Если они найдены, использовать их повторно.
4. Для нового аккаунта потребовать пустую БД, проверить subdomain и hook demo prefill, подготовить пользователя со штатной проверкой и хешированием пароля.
5. Сохранить `creating`, затем вызвать `signUpOnNewWorkspace` и `activateWorkspace`. Подменить только `prefillCreatedWorkspaceRecords` в этом процессе и восстановить его после вызова. Стандартные metadata, роли и участник workspace создаются штатно.
6. Проверить роль Admin, обновить подтверждение email и неизменённые пустые фамилии, инвалидировать кеши аккаунта и удалить все пользовательские ключи `ONBOARDING_` в трёх областях.
7. Потребовать `onboardingStatus=COMPLETED`. Проверить отсутствие демозаписей только при первом создании, затем сохранить `completed` с IDs пользователя/workspace.
8. Освободить полученную блокировку, дождаться обработки событий и закрыть NestJS context. Сервис имеет `restart: "no"` и вызывается явно через `docker compose run --rm bootstrap`.

## Повторный запуск и восстановление bootstrap

- `completed` и совпадающая identity: пропустить регистрацию/активацию; повторить проверки роли/профиля и очистку onboarding. Бизнес-данные и пароль сохраняются.
- Email, имя/subdomain workspace или сохранённые IDs отличаются: завершиться с ошибкой. Повтор не переименовывает workspace и не сбрасывает пароль. `BOOTSTRAP_ADMIN_LAST_NAME` заполняет только пустые фамилии.
- Новый формат маркера отсутствует: принять только единственного соответствующего незаблокированного администратора сервера и активный workspace с корректным membership и ролью Admin. Это поддерживает прежний SQL bootstrap; его публичный маркер не читается.
- `creating`: остановиться без повторения частичного provisioning. Активация использует несколько транзакций; неудачный запуск уже мог создать пользователей, metadata, схемы или файлы.
- Существует `LOCAL_ADMIN_BOOTSTRAP_LOCK`: остановиться. У блокировки нет срока действия; аварийное завершение процесса может оставить её. Обычная очистка удаляет только блокировку, полученную текущим процессом.
- Невалидный пароль/subdomain до `creating`: исправить входные данные и повторить после нормального завершения процесса. Ошибки после `creating` требуют разбора состояния.

При блокировке изучите `docker compose logs --tail=100 server worker` и вывод команды bootstrap. Перед административным изменением маркера/блокировки убедитесь, что активного процесса bootstrap нет, и проверьте сохранённое состояние, пользователей, активацию workspace, membership и роли. Автоматической команды восстановления и общего rollback нет. Не удаляйте рабочие данные и не очищайте маркер вслепую ради принудительного создания.

## Production

Используйте [compose.production.yaml](../compose.production.yaml) вместе с базовым файлом. Он требует непустые `SERVER_URL`, `PG_DATABASE_PASSWORD` и `ENCRYPTION_KEY`, но не может определить безопасность переданных значений. При создании workspace через UI новая production-база проходит полный штатный onboarding, включая demo prefill. `bootstrap: !reset null` удаляет bootstrap из объединённой production-конфигурации, даже с `--profile bootstrap` или `--profile "*"`. Переменные bootstrap и его скрипты не передаются и не монтируются в production-сервисы. Эта среда не развёрнута в production.

1. Подготовьте приватный `.env.production`:
   - `COMPOSE_PROJECT_NAME`: отдельный проект и volumes.
   - `TAG=v2.45.0`.
   - `SERVER_URL`: реальный публичный HTTPS URL.
   - `PG_DATABASE_PASSWORD`: уникальный сложный пароль из букв и цифр.
   - `ENCRYPTION_KEY`: приватный ключ, полученный через `openssl rand -base64 32`.
   - `IS_MULTIWORKSPACE_ENABLED`: `true` или `false`.
   - `BIND_ADDRESS` / `HTTP_PORT`: интерфейс/порт, доступный реальному reverse proxy.
2. Проверьте конфигурацию и запустите среду:

   ```sh
   chmod 600 .env.production
   docker compose --env-file .env.production -f compose.yaml -f compose.production.yaml config --quiet
   docker compose --env-file .env.production -f compose.yaml -f compose.production.yaml up -d --wait --wait-timeout 240
   ```

Для последующих production-команд используйте оба файла и то же окружение. GitHub jobs могут передать значения через step environment; Compose не загружает GitHub secrets самостоятельно. SSH автоматически не пересылает это окружение. Временный GitHub runner не является постоянным deployment host.

Хост, публичное имя, TLS proxy, передача секретов и политика backup/restore остаются решениями для развёртывания. Сохраняйте ключи шифрования вместе с копиями БД и файлов. Изменение credentials после инициализации PostgreSQL volume требует смены пароля в БД. `FALLBACK_ENCRYPTION_KEY` поддерживает запланированную ротацию ключа; `APP_SECRET` — необязательная совместимость со старыми установками.

## Остановка, сброс и состояние браузера

- `docker compose stop`: остановить и сохранить данные.
- `docker compose up -d --wait`: запустить снова.
- `docker compose down`: удалить контейнеры/сеть, сохранить named volumes.
- `docker compose down -v`: удалить постоянные volumes БД/файлов и их данные.

Изменения bind mounts применяются при пересоздании контейнеров; удаление файла на хосте не снимает mount с уже работающего контейнера. Для запуска сервера и worker с текущей базовой конфигурацией выполните:

```sh
docker compose -f compose.yaml up -d --no-deps --force-recreate --wait --wait-timeout 240 server worker
```

Команда сохраняет volumes БД и файлов. Для production используйте также `--env-file .env.production -f compose.production.yaml`.

Volumes привязаны к проекту; изменение `COMPOSE_PROJECT_NAME` выбирает другие данные.

Twenty хранит состояние аккаунта/workspace в localStorage браузера. После сброса volumes обновите уже открытую вкладку и войдите заново. Для пустого workspace выполните bootstrap до регистрации через UI; регистрация через UI на свежей БД запускает обычный onboarding.

## Проверка

Статические проверки охватывают синтаксис JavaScript, конфигурацию base/production Compose (включая отсутствие bootstrap в production со всеми включёнными profiles), локальные Markdown links/fences, whitespace и RU/EN parity полей/статусов. Они не подтверждают runtime или production deploy.

Зафиксированные runtime-проверки через штатные сервисы от 2026-10-07 выполнены с Twenty `v2.45.0` и PostgreSQL 16:

- До исправлений ревью `twenty-native-bootstrap-test` создал одного администратора/workspace с ролью Admin, стандартными metadata, без демозаписей и с `onboardingStatus=COMPLETED`. HTTP-вход по паролю и обмен workspace token прошли.
- Повтор удалил 21 ключ onboarding/history в трёх областях, сохранил identity/пароль, одну компанию и постороннюю настройку. Внедрённый `creating` заблокировал повтор создания. Существующий локальный аккаунт после SQL provisioning также принят новой версией.
- После исправлений ревью штатная проверка отклонила пароль с переносом строки без записи маркера; исправленный пароль позволил перейти к созданию. Проверка использовала штатную валидацию пароля с подставленным хранилищем/регистрацией.
- Проверки реальным TypeORM в отдельной временной PostgreSQL сохранили параллельную смену пароля/фамилии, заполнили неизменённую пустую фамилию и отклонили параллельно заблокированного администратора, не снимая блокировку.
- Полное создание с нуля и повтор после исправлений прошли в `twenty-bootstrap-fix-test`. Штатный Workspace ORM сохранил имя участника и фамилию, изменённую между чтением и обновлением.

Временные тестовые стеки, БД, volumes и приватные credentials удалены. Регрессионные проверки не изменяли рабочий workspace. Маршрутизация браузера для версии через штатные сервисы повторно не проверялась. Публичный production deploy, backup/restore и все 28 критериев SAI оркестратора остаются Not verified.
