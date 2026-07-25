# Tripyfull — Concept

A personal trip planner: **trips → days → activities**, plus bookings with payments,
budgeting, and a reusable library of places.

Core data principle: **the user enters the minimum (the key bit), free APIs fill in the
rest.** All third-party calls happen on the backend only; keys never reach the frontend.

## Stack and structure (monorepo)

- **Backend** (`backend/`) — Spring Boot + PostgreSQL, JWT authentication, JPA (`ddl-auto=update`).
- **Frontend** (`frontend/`) — Vue 3 + Pinia + PrimeVue + Vue Router + Leaflet.
- **Design system** (`design-system/`) — Tripyfull tokens, styles, and UI kit.
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

A warm "paper" palette (`--paper`, coral brand, teal accent, gold), fonts
Bricolage Grotesque / Hanken Grotesk / JetBrains Mono, generous radii, pill badges and
buttons, cards with a soft shadow and hover lift, eyebrow labels. All via
CSS tokens in `src/index.css` + PrimeVue overrides.

## Engineering notes

- `ddl-auto=update` won't alter existing CHECK constraints and won't add NOT NULL to
  non-empty tables — so new enum values go through `columnDefinition`, new columns are
  nullable, and the stale `places_source_check` is dropped by the `SchemaFixup`
  auto-runner at startup.
- Budget math converts everything to the user's base currency (stored booking rates →
  live rates → raw pass-through); changing the base currency clears stored booking rates
  so they re-resolve. The day-itinerary cost widget still sums raw amounts client-side.
