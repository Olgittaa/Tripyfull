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
| `AERODATABOX_API_KEY` | env / local props | optional: flight lookup by number and date (RapidAPI) |
| `OPENTRIPMAP_API_KEY` | env / local props | optional: attraction descriptions & photos on saved places (free key at dev.opentripmap.org) |
| `VITE_API_URL` | `frontend/.env.development` | API address for the frontend |

## Domain model

**Trip** (dates, status, currency) → **Day** (date, city) → **Activity** (type, time, cost).
**Booking** (flight/ferry/rental/lodging) + **Payment[]** + **Attachment[]**.
**Place** — a reusable place (POI) with coordinates and photos, private to its owner.

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
cd backend && ./mvnw test          # unit tests: geometry, place types, the travel-leg rules
cd frontend && npm test            # Vitest over lib/core and app/portal/src/plan
cd e2e && npm test                 # the golden path, end to end in a browser
python3 scripts/seed-qa.py         # a throwaway consultant with one client trip, on a running backend
```

### The golden path

`e2e/` holds one Playwright test, and it is the gate before `main`: register → a three-day
trip → three stops added three different ways → drag one to the front → a hotel for two nights
→ *Add to plan* → an instalment → the budget → the printed route book, which must carry the
stops, the hotel and a way to the next stop with a time on it. **A red run means no merge**,
whatever the unit tests say.

`auth.spec.js` covers the way in and the way back in: registering, the errors, and a session
that dies while a form is open — the dialog has to be answerable from inside that form, and the
save that failed has to go through afterwards without anything being retyped.

`trip-dates.spec.js` guards the one place that deletes data: days are generated per date, a
backwards range is refused wherever it is set, moving a trip keeps every day with its city,
notes and stops (and leaves the bookings on their own dates), shortening it deletes the days
that fall outside together with what was on them, lengthening it fills the gap — and the
preview that asks before all this has to say what will really happen.

`stops.spec.js` covers the day's own edits: a stop moved to another day arrives whole at the
end of it and leaves nothing behind, a stop cannot be moved into a different trip, deleting one
leaves the order of the rest alone, dragging renumbers the pins on the map, and a price in
another currency is shown converted.

Run the three suites one after another, not at once: the end-to-end run and `./mvnw test` both
work against the same database, and racing them makes the browser tests fail for no reason of
their own.

They start what they need: `npm test` inside `e2e/` brings up Postgres, the backend and the
portal when they are not already running, and reuses them when they are. The first run needs
the browser: `npx playwright install chromium`.
