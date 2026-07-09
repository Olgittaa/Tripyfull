# Tripyfull

Персональный планировщик путешествий: **поездки → дни → активности**, плюс брони
с платежами, бюджет и переиспользуемая библиотека мест. Пользователь вводит минимум,
бесплатные API дополняют остальное; все вызовы сторонних сервисов идут только с бэкенда —
ключи на фронт не попадают.

## Структура (monorepo)

```
Tripyfull/
├── backend/         Spring Boot + PostgreSQL REST API (Java 25, Maven)
├── frontend/        Vue 3 + Pinia + PrimeVue + Vue Router + Leaflet (Vite)
└── design-system/   Токены, стили и UI-kit Tripyfull
```

## Требования

- **Java 25** и Maven (обёртка `./mvnw` в комплекте)
- **Node.js ≥ 20** и npm
- **Docker** (для локальной PostgreSQL)

## Запуск

### 1. База данных

```bash
cd backend
docker compose up -d        # PostgreSQL 16 на :5432 (db=tripdb, user/pass=postgres)
```

### 2. Backend

```bash
cd backend
cp src/main/resources/application-local.properties.example \
   src/main/resources/application-local.properties   # заполни секреты
./mvnw spring-boot:run                                 # http://localhost:8080
```

Профиль `local` активен по умолчанию. Секреты (пароль БД, `jwt.secret`, API-ключи)
живут в `application-local.properties` — этот файл в `.gitignore` и в git не попадает.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173, проксирует на API :8080
```

`VITE_API_URL` задаётся в `frontend/.env.development` (по умолчанию `http://localhost:8080`).

## Конфигурация

| Переменная | Где | Назначение |
|---|---|---|
| `spring.datasource.*` | `application-local.properties` | подключение к PostgreSQL |
| `jwt.secret` | `application-local.properties` | подпись JWT (≥ 32 символов) |
| `AERODATABOX_API_KEY` | env / local props | поиск рейсов (RapidAPI) |
| `GEOAPIFY_API_KEY` | env / local props | геокодинг мест (Nominatim как fallback) |
| `VITE_API_URL` | `frontend/.env.development` | адрес API для фронта |

## Доменная модель

**Trip** (даты, статус, валюта) → **Day** (дата, город) → **Activity** (тип, время, стоимость).
**Booking** (рейс/паром/прокат/жильё) + **Payment[]** + **Attachment[]**.
**Place** — переиспользуемое место (POI) с координатами, фото и видимостью PUBLIC/PRIVATE.

Подробнее — в [`frontend/CONCEPT.md`](frontend/CONCEPT.md).
