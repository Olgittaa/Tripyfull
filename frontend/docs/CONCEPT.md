# Tripyfull — Concept

A personal trip planner: **trips → days → activities**, plus bookings with payments,
budgeting, and a reusable library of places.

Core data principle: **the user enters the minimum (the key bit), free APIs fill in the
rest.** All third-party calls happen on the backend only; keys never reach the frontend.

## Stack and structure (monorepo)

- **Backend** (`backend/`) — Spring Boot + PostgreSQL, JWT authentication, JPA + Flyway migrations.
- **Frontend** (`frontend/`) — Vue 3 + Pinia + Vue Router + Leaflet.
- **Design system** — tokens and styles live in `frontend/lib/ui/src/styles/` (see ARCHITECTURE.md).
- Secrets (DB, jwt, API keys) live in `application-local.properties` (outside git).
- Visual language comes from the Tripyfull mockup system (Claude Design).

## Domain model

- **Trip** (title, destination, dates, status, currency)
  → **Day** (date, city, overnight)
  → **Activity** (name, type, time*, cost+currency, notes, `placeId?`).
- **Booking** (flight/ferry/rental/lodging/activity) + **Payment[]** (payment schedule)
  - **Attachment[]** (files).
- **Place** — a reusable place (POI): type, country/city, address, coordinates,
  photos[], links[], `osmId`, **visibility** (PUBLIC/PRIVATE), **source**
  (MANUAL/GEOCODED/IMPORTED), owner. **PlaceFolder** — folders (one folder per place;
  you can also file other people's public places).
- An activity references a Place → inherits its address/coordinates → a pin on the day's map.

## Free API stack (on the backend)

- **Frankfurter** (+ open.er-api fallback) — currency conversion.
- **Photon by komoot** (primary, no key) + **Nominatim/OSM** (fallback) — place
  autocomplete, forward and reverse geocoding; result language is forced to
  English (`Accept-Language: en` / `lang=en`) → Latin script.
- **OpenTripMap** (optional free key) — attraction enrichment: Wikipedia
  descriptions + photos auto-filled on saved places.
- **AeroDataBox** (RapidAPI) — flight by number+date (times, terminals, airports),
  with AviationStack/AirLabs as fallback.
- **Google Maps import** — expands a share link via its redirect, reads Open Graph
  (name/photo/description) and coordinates; detects and rejects "lists".

## Features

1. **Smart trip-date shift** — move `start/end` and all days by a delta, drop days
   outside the range, with a confirmation preview.
2. **Bookings** — fields per type (IATA/terminals/seat, vessel/cabin, carClass,
   roomType/guests, bookingUrl), flight autofill (AeroDataBox), attachments,
   derived fields (nights, pricePerNight, duration — computed on the server).
3. **Places library** — CRUD, visibility (own + others' public), filters
   (country/type/privacy/source/city/search/sort), **folders**, import from
   Google Maps, photos+links, **grid/list** toggle, autocomplete search,
   type inference from category.
4. **Day itinerary** — two-column screen: on the left, a Visiting/Overnight card +
   an activity timeline ("N on the map" pills); on the right, a sticky "Day route" map
   with numbered pins and a dashed route; on an empty day — "Add from places ·
   {city}".
5. **Activity form** — collapsed source picker **Search / Import / Manually**;
   type/address/coordinates only in manual mode, a linked place shows "Edit place →"
   (opens the place editor); time/cost+currency/notes are shared; option to
   "save the activity as a place".

## Design system

A warm "paper" palette (teal primary, coral accent, gold warning), fonts
Bricolage Grotesque / Hanken Grotesk / JetBrains Mono, generous radii, pill badges and
buttons, cards with a soft shadow and hover lift, eyebrow labels. All via
CSS tokens in `lib/ui/src/styles/abstracts/variables.css` (see CLAUDE.md).

## Engineering notes

- Schema changes go through Flyway migrations (`backend/src/main/resources/db/migration`);
  Hibernate runs with `ddl-auto=validate`. `V1__baseline.sql` captures the pre-Flyway
  schema — existing databases are baselined past it via `baseline-on-migrate`.
- Budget math converts everything to the user's base currency (stored booking rates →
  live rates → raw pass-through); changing the base currency clears stored booking rates
  so they re-resolve. The day-itinerary cost widget still sums raw amounts client-side.
