# Tripyfull

A personal trip planner: **trips → days → activities**, plus bookings with payments,
budgeting, and a reusable library of places. The user enters the bare minimum, and free
APIs fill in the rest; all third-party calls go through the backend only — keys never
reach the frontend.

## Structure (monorepo)

```
Tripyfull/
├── backend/         Spring Boot + PostgreSQL REST API (Java 25, Maven)
├── frontend/        Vue 3 + Pinia + PrimeVue + Vue Router + Leaflet (Vite)
├── design-system/   Tripyfull tokens, styles, and UI kit
└── docker-compose.yml   Local PostgreSQL
```

## Requirements

- **Java 25** and Maven (the `./mvnw` wrapper is included)
- **Node.js ≥ 20** and npm
- **Docker** (for local PostgreSQL)

## Running

### 1. Database

```bash
docker compose up -d        # from the root; PostgreSQL 16 on :5432 (db=tripdb, user/pass=postgres)
```

### 2. Backend

```bash
cd backend
cp src/main/resources/application-local.properties.example \
   src/main/resources/application-local.properties   # fill in your secrets
./mvnw spring-boot:run                                 # http://localhost:8080
```

The `local` profile is active by default. Secrets (DB password, `jwt.secret`, API keys)
live in `application-local.properties` — this file is in `.gitignore` and never lands in git.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173, proxies to the API on :8080
```

`VITE_API_URL` is set in `frontend/.env.development` (defaults to `http://localhost:8080`).

## Configuration

| Variable | Where | Purpose |
|---|---|---|
| `spring.datasource.*` | `application-local.properties` | PostgreSQL connection |
| `jwt.secret` | `application-local.properties` | JWT signing (≥ 32 characters) |
| `AERODATABOX_API_KEY` | env / local props | flight lookup (RapidAPI) |
| `GEOAPIFY_API_KEY` | env / local props | geocoding for places (Nominatim as fallback) |
| `VITE_API_URL` | `frontend/.env.development` | API address for the frontend |

## Domain model

**Trip** (dates, status, currency) → **Day** (date, city) → **Activity** (type, time, cost).
**Booking** (flight/ferry/rental/lodging) + **Payment[]** + **Attachment[]**.
**Place** — a reusable place (POI) with coordinates, photos, and PUBLIC/PRIVATE visibility.

For more detail, see [`frontend/CONCEPT.md`](frontend/CONCEPT.md).
