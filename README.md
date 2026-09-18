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
cd backend && ./mvnw test          # unit tests: geometry, place types, travel legs, the budget
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

`reserve-days.spec.js` covers the day without a date: it joins the trip without disturbing the
dated ones, swapping trades the plans while the dates stay put, only an undated day can be
removed — and the printed book offers it rather than passing it off as day seven.

`bookings.spec.js` covers what has already been paid for: every category stores and reads back
(hotel, train, ferry, car rental, activity), a flight number nobody knows comes back empty
rather than broken and can be typed in by hand, a ticket uploads and downloads byte for byte,
and deleting a booking takes its payments and its files with it — the budget included.

`plan-from-bookings.spec.js` pins the one action that edits the itinerary on the consultant's
behalf: a three-night stay marks four days (in, both ends of the days between, out), pressing it
twice changes nothing, a hand-made stop keeps its name, time, notes and its place in the day,
an overnight journey arrives the next morning, and a cancelled booking leaves nothing behind.

`payments.spec.js` checks the money on a booking to the cent: instalments that can never add up
to more than the price (adding or raising one), ticking one paid and un-ticking it, what "paid
in full" means to the budget, and the money owed with no date on it, which is listed apart
rather than quietly dropped. It also pins the stay dates against the trip's.

`print-book.spec.js` is the one spec that runs in **every engine** — Chromium, Firefox, WebKit
and a phone — because the book is the only thing that leaves the app and lands on someone
else's screen or printer. It covers the awkward trips: no photos (the cover still stands), no
pins (no map, no gap, no broken image), twelve days each on its own page, a day long enough to
overrun a page (no stop card may be split), and a hotel wifi that drops every map tile. In
Chromium it also prints the real PDF and attaches it to the run.

`places.spec.js` covers the library a consultant builds over years: a place saved and edited
keeps everything the edit did not mention, five photos and a clear refusal at the sixth, folders
made, renamed, filled, emptied and deleted without taking their places with them, a place that
joins a trip and leaves it while staying in the library, and the screen's own select-all-and-act.
**Not covered by the gate:** importing a place from a Google Maps link, which needs a live
Google key — it is checked by hand (it fills the canonical name, address, pin, description and
photos).

Run the three suites one after another, not at once: the end-to-end run and `./mvnw test` both
work against the same database, and racing them makes the browser tests fail for no reason of
their own.

They start what they need: `npm test` inside `e2e/` brings up Postgres, the backend and the
portal when they are not already running, and reuses them when they are. The first run needs
the browser: `npx playwright install chromium`.
