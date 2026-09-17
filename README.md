# Tripyfull

A personal trip planner: **trips → days → activities**, plus bookings with payments,
budgeting, and a reusable library of places. The user enters the bare minimum, and free
APIs fill in the rest; all third-party calls go through the backend only — keys never
reach the frontend.

## Structure (monorepo)

```
Tripyfull/
├── backend/         Spring Boot + PostgreSQL REST API (Java 25, Maven)
├── frontend/        Vue 3 + Pinia + Vue Router + Leaflet (Vite)
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
| `GOOGLE_MAPS_API_KEY` | env / local props | optional: Google Places (search, import, photos, descriptions) and Google Routes (driving, walking, transit timetables); without it the free OSM stack (Photon, Nominatim, OSRM) is used |
| `TRIPADVISOR_API_KEY` | env / local props | optional: ratings and reviews shown on demand, never stored |
| `AERODATABOX_API_KEY` | env / local props | optional: flight lookup by number and date (RapidAPI) |
| `OPENTRIPMAP_API_KEY` | env / local props | optional: attraction descriptions & photos on saved places (free key at dev.opentripmap.org) |
| `VITE_API_URL` | `frontend/.env.development` | API address for the frontend |

## Domain model

**Trip** (dates, status, currency) → **Day** (date, city) → **Activity** (type, time, cost).
**Booking** (flight/ferry/rental/lodging) + **Payment[]** + **Attachment[]**.
**Place** — a reusable place (POI) with coordinates, photos, and PUBLIC/PRIVATE visibility.

**Day** also carries the leg to the next stop on each **Activity** (time, distance, mode,
route line), computed on the server and kept until the day changes.

## Where things are written down

| File | What it is |
|---|---|
| [`docs/features.md`](docs/features.md) | **The specification.** What the app does today, screen by screen. Changed in the same commit as the code it describes. |
| [`BUGS.md`](BUGS.md) | Known defects, in three buckets. Only *Breaks the main path* blocks a release. |
| [`AFTER_M1.md`](AFTER_M1.md) | Ideas parked until after launch, and the ones rejected on purpose. |
| [`docs/app_spec.md`](docs/app_spec.md) | Archived July 2026 design spec — reasoning and gap list, not current behaviour. |

Personas and early flows are in [`docs/`](docs/) as well.

## Tests and QA

```bash
cd backend && ./mvnw test          # unit tests: geometry, place types, travel-leg rules
cd frontend && npm test            # Vitest over lib/core and app/portal/src/plan
python3 scripts/seed-qa.py         # a throwaway consultant with one client trip, on a running backend
```
