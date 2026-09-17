# Tripyfull — What the app does

> **This is the single specification.** Nothing else decides what Tripyfull should do.
> Every change to the app changes this document **first**, in the same commit as the code.
> Every working session starts by reading it. If the code and this document disagree, that is
> a bug in one of them — record it in [`../BUGS.md`](../BUGS.md) rather than leaving it.

**Status:** current as of September 2026 (commit `36fb576` and later).
This is the functional reference: every screen, what it shows, what you can do there, and
the rules the server applies. For the product frame see [`persona_jbtd.md`](persona_jbtd.md);
the July 2026 design spec [`app_spec.md`](app_spec.md) is **archived** — kept for its
reasoning and its gap list, not for what the app does. Known defects live in
[`../BUGS.md`](../BUGS.md), deliberately postponed ideas in [`../AFTER_M1.md`](../AFTER_M1.md).

Tripyfull is a personal trip planner for one traveller (or one household): **trips → days →
stops**, with bookings and their payments, a budget, a to-do list, and a reusable library of
places. It runs on a laptop, a tablet and a phone; every screen folds to a phone width.

---

## 1. Account and shell

- **Sign in / register** (`/auth`): username + password, JWT session. The token lives a day;
  when it runs out — on a 401 or when the expiry passes while the tab is open — a
  *Session expired* dialog asks for the password in place. The page stays where it is, and the
  requests that failed replay themselves after sign-in.
- **Settings** (`/settings`): base currency (everything in the budget is converted into it),
  language, region, date & time preferences. The currency shows in the top bar.
- **Shell**: top bar (All trips · All places · currency · account), and inside a trip a
  sidebar with the trip's name and its sections — Overview, Itinerary, Map, Trip places,
  Bookings, To-do, Budget. The sidebar collapses to icons (remembered per browser); on a
  phone it becomes a drawer behind a hamburger, and the top bar shows the trip's name.
- **Feature flag** `FEATURES.geoPlaceSearch` (frontend `config.js`) switches every external
  place search on or off at once.

## 2. Trips (`/trips`)

- Cards for every trip: cover wash, title, destination, date range, budget progress. Filter by
  status: **Draft · Planned · Active · Completed**.
- **New trip**: title, destination (city search), dates, status, base currency. Days are
  generated from the dates at once.
- **Edit trip** (overview → Edit): title, destination, dates, status. Changing the dates opens
  a **reschedule preview** — how many days shift, which are added, which are removed with
  their content — before `POST /trips/{id}/reschedule` runs. Rescheduling shifts every day by
  the same delta, deletes days that fall outside the new range, and fills uncovered dates
  with empty days; bookings and payment schedules are left as they are.
- Delete a trip (confirmation).

## 3. Trip overview (`/trips/:id`)

The dashboard; every tile opens its section.

- **Head**: status eyebrow, title, destination · dates, "N days to go", Edit, **Print**.
- **Four tiles**: Itinerary (planned days / total, "every day has a plan" or the gaps),
  Bookings (nights covered / total, bookings count, hotel gaps), Budget (planned total,
  % paid, still to pay), To-do (done / total, overdue or due this week).
- **Coming up**: the three nearest things, whatever they are — open to-dos by due date,
  payments falling due, the departure, and the bookings themselves (a flight leaving, a
  hotel check-in, a booked activity) with their time and route. Bookings already in the past
  stay out.
- **Places**: rating buckets of the trip's shortlist (5★ … 1★), how many are in the plan,
  must-sees not planned yet, and a link to the plan map.
- **Trip days**: a card per day — number, weekday and date, city (editable inline), stops
  count, time on the move between them ("5 stops · 46 min on the move"), a hotel mark when
  the night is set. Click → the day.
- **Print**: builds the **route book** (see §11) in a new tab.

## 4. Itinerary — one day (`/trips/:tripId/days/:dayId`)

The core screen: the day's list on the left, its route on the right.

### Head and navigation
- **Title is the city**; a pencil beside it opens the city search in place.
- Previous / next arrows; a strip of all days (D1, D2 … plus **reserve days** after a divider
  and a **+ Buffer** chip). Reserve days sit outside the trip dates until swapped into a real
  one; they can be removed.
- Tools: **Sort by time**, **Swap** (trade this day's plan with another
  day; the linked overnight booking stays with the date), **Remove reserve**,
  **+ Activity**.
- On a phone: the strip and arrows give way to a **dock** at the bottom — previous · day ·
  next, the map (with a pin count) and "add" — and the map becomes a sheet the dock slides up.

### Facts strip
- How full the day is: stops, time at places (a stop without a clock borrows its saved
  place's usual visit length; "N without a time" otherwise), time on the move.
- **Overnight** — only when the plan does not already show the night (a check-in or
  overnight hotel row, a hotel stop of your own, a flight landing tomorrow). Then it offers
  the hotel booking that covers the date, or a name typed by hand, and lets you unlink a
  booking.

### The list
- A card per stop: icon by kind, name, type badge, "Book ahead", "Booked" (written from a
  booking), time, address, linked place, its number on the map, notes, cost with a live
  conversion when the currency differs from the trip's.
- **Drag to reorder**; the numbered map pins follow. Times not set are shown as **≈ derived**
  from the previous stop and the way there.
- **Between stops — the leg**: five ways to get there — walk, taxi, bus, train, car — with the
  time and distance for the chosen one. Legs are computed on the server and kept on the stop
  (see §12); the row lights the mode the leg was computed for.
  - No mode chosen → a sensible default: a hop of up to 1.5 km is walked; a longer one is
    driven when a car-rental booking covers that day, else taken by taxi.
  - Bus and train ask Google's transit timetables for the stop's own departure time; where a
    service is listed the leg gets its real time and names the line
    ("46 min · 5.1 km by bus · RTC Bus Chiang Mai"); where none is, an estimate marked "~".
  - Walking and driving are routed for real (Google Routes, OSRM as the fallback).
  - A flight is not a leg — it is a booking with its own row and its real times.
- **Day total** by category at the bottom (converted into the trip's currency).

### The stop editor (drawer)
- **What**: name; a place from the library (adds the pin and the library's facts), or a
  search for a place or an address (pins the stop; a venue can also be saved to the library
  on request), or coordinates typed by hand; a preview map of the pin; type.
- **When**: start / end times; on an existing stop, **move to another day**.
- **Details**: cost estimate + currency with the live rate into the home currency, notes,
  "needs advance booking".
- A linked place shows its rating, why, time to visit and description; *Edit place* jumps to
  the library.
- A stop written from a booking is shown read-only with a link to the booking — the next
  *Update plan* would overwrite edits.

### The route aside (right column / phone sheet)
- Leaflet map: numbered pins for the day's stops, the legs drawn as routed lines (straight
  where unroutable), a same-day flight as a crow-flies line, and **dots for candidate places**
  coloured by rating; click a dot for details, to add it or to hide it.
- Legend, route total ("46 min · 30.8 km · 4 stops"), hidden-places counter.
- **Places to consider**: the trip's shortlist not yet in the plan — *This city* or *Trip
  list*, *Best first* or *Nearest*. Each row says type, visit time, and what it sits next to
  today ("2.7 km from 4. Check in · Nak Nakara"). **One click adds** the place right after the
  stop it is nearest to; the sliders button opens the full editor. Places planned on **any**
  day of the trip stay out; "show N already in the plan" brings them back greyed with the
  day they are on. "Not today" hiding is a browser-side choice per trip.

### Empty day
- "Nothing planned yet" with a quick-add grid of the city's saved places.

## 5. Plan map (`/trips/:tripId/map`)

- Every place on the trip's list on **one map** — OpenStreetMap tiles, no basemap switch.
  A pin's colour and size is its rating (5★ red and largest down to 1★ small grey); above the
  map a key names each rating with how many places carry it. Planned places carry their day
  number as a tag on the pin, and *Planned only* narrows the map to them. A pin's popup gives
  the place, its rating and the days it is planned on, each a link to that day.

## 6. Trip places (`/trips/:tripId/places`) and the library (`/places`)

The same screen in two scopes: one trip's shortlist (grouped by the trip's **folders**), or
the whole library across trips. Every place belongs to the account that saved it and is seen
by nobody else — there is no sharing and no public place.

- **Cards or table**, search by name/city/address, filters: country, type, rating,
  folder / trip. Sort by name, recent, type, rating. Rating balance bar in a trip.
- **Place card**: photos (carousel), name, city · country, type, visit time, description,
  rating with a reason, links, address on a small map.
  The rating is the consultant's own — there is no rating from anywhere else. How a place got
  in (typed, geocoded, imported) is still recorded on the row, but no screen shows it.
- **Add place** (form): name, type, country/city/address search, coordinates,
  description, rating 1–5 and why, time to visit, audience (everyone / adults / kids),
  needs preparation, needs booking, photos (upload up to 12, own photos shown first), links.
- **Find & import**: search Google Maps, or paste a Google Maps link. The link imports
  Google's own record of the place — name, address, type, editorial description and up to
  three photos. The saved place opens at once.
- A place made while a **folder or a trip is open joins it** (a folder brings its trip along).
- **Selection mode** for bulk actions: move to folder (in a trip), **add to trip**, set type,
  remove from trip, delete.
- **Folders** per trip: create, rename, colour, delete; drag places in or assign from the
  panel.
- **Trips**: one checkbox per trip in the place panel, ticked where the place already is.
- Photos of a place: uploads are scaled to 1600 px and stored on the server; imported and
  enriched photos are links.

## 7. Bookings (`/trips/:tripId/bookings`)

- Three categories: **Transportation** (flight, train, ferry, bus, metro, car rental, taxi),
  **Accommodation**, **Activity**. Grouped list with the category's icon, dates, price, paid
  state, attachments count. Summary head: bookings, nights covered, hotel gaps.
- **Booking form**: name, vendor, confirmation number, link, full price + currency with the
  live exchange rate into the home currency, notes; per category —
  - transport: mode, flight/train number, from → to (searched, with coordinates and IATA),
    departure → arrival date-times, terminals, seat / coach, vessel, car class,
    pick-up → drop-off for rentals; **flight lookup** by number and date (AeroDataBox) fills
    the route and times;
  - accommodation: city, address, check-in → check-out with times, room type, guests;
  - activity: where and when, tied to a day.
- **Payments**: "paid in full" switch, or an instalment schedule (amount, due date, paid /
  unpaid with the paid date); Σ instalments ≤ full price. **Attachments** (tickets,
  vouchers) upload, download, delete — 10 MB each.
- **Update plan** (`plan/from-bookings`): writes the bookings into the days — the hotel as
  the day's last stop on arrival night, first stop on the morning you leave, both in
  between; transport on the day it departs at its time, with an "Arrive" stop the next
  morning for an overnight leg; a booked activity on its day. Generated stops belong to the
  booking: the next update rewrites them and never touches hand-made stops. The day's
  overnight and city are set from the hotel.

## 8. To-do (`/trips/:tripId/todos`)

- Groups (Documents, Money, Health, Bookings, Home, Packing … or your own), a to-do with
  title, group, due date, notes; done / undone. One line of state: progress and whether
  anything is late; quick add straight into a group.
- **Suggestions**: a built-in list (passport validity, visas, insurance, copies of documents,
  telling the bank, local cash, card limits, vaccinations, medicine, first-aid kit, airport
  transfer …), each dated against the trip; add the ones you want.

## 9. Budget (`/trips/:tripId/budget`)

All in the account's base currency, converted at live rates (missing rates are counted and
shown).

- **Hero**: the planned total — bookings plus the day plans' estimates — with how much of the
  bookings is paid and how much is still to pay.
- **Payments**: the schedule of instalments falling due, and bookings that still owe money
  without a plan to say when. A payment can be ticked paid from here.
- **By category**: booked, paid and estimated (day plans) per category, with planned against
  paid as a bar.
- **Day by day**: booked and estimated per day.

What the trip actually cost is deliberately not here: Tripyfull plans money, it does not track
spending. See [`../AFTER_M1.md`](../AFTER_M1.md).

## 10. Places' data sources (all through the backend; keys never reach the browser)

| Need | Primary | Fallback / note |
|---|---|---|
| Place & address search | Google Places (New) | Photon (OSM), Nominatim |
| City / country pick-lists | seeded database | — |
| Import from a link | Google Places by name near the link's pin; page metadata | OSM reverse geocoding |
| Description & photos | Google Place Details (editorial summary, 3 photos) | OpenTripMap (Wikipedia extract, photo) |
| Routing between stops | Google Routes (drive, walk, transit) | OSRM (drive, walk); road-based estimates for taxi/bus/train |
| Flight lookup | AeroDataBox | — |
| Exchange rates | Frankfurter | — |
| Map tiles | OpenStreetMap | — |

Without a Google key the free OSM stack runs everywhere; OpenTripMap and AeroDataBox are
optional too.

## 11. Print — the route book

From the overview's Print button; a document for the browser's print-to-PDF, laid out to
survive Word too.

- Cover with a photo collage of the shortlist; **The route** on one flat map image (tiles
  fetched gently; gaps are reported, and a map with most tiles missing is left out);
  **What is in the plan** (counts by type); **Day by day** — each day with its city, its
  stops (time, name, address, photos, description, notes, cost) and the way to the next
  stop with its mode and time ("→ Wat Rong Khun by car · 25 min · RTC Bus"); **Booked & to
  book ahead**; **Still to do**; a legend. Ratings are deliberately not printed.

Also: `GET /trips/{id}/export` returns the whole trip as JSON.

## 12. How the server keeps travel times

Every stop with a pin carries the leg to the next pinned stop — seconds, metres, the line
for the map, whether it is an estimate, the transit line's name — together with a key naming
what it was computed for (mode, both endpoints, and for bus/train the departure minute).
On every read of a day and after every edit the keys are compared with the day as it stands
and only legs whose order, pin, mode or time moved are routed again. Reading the trip's days
refreshes every day first, so the overview's "on the move" is right even for a day never
opened. A day nobody touched costs nothing to open.

## 13. API map

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, settings |
| Trips | `GET/POST /api/trips`, `GET/PATCH/DELETE /api/trips/{id}`, `GET …/countries`, `POST …/reschedule`, `GET …/export` |
| Days | `GET/POST /api/trips/{tripId}/days`, `POST …/days/buffer`, `PATCH/DELETE /api/days/{id}`, `POST …/days/{a}/swap/{b}` |
| Stops | `GET /api/days/{id}/itinerary`, `POST /api/days/{id}/activities`, `PATCH …/activities/reorder`, `PATCH/DELETE /api/activities/{id}`, `GET /api/trips/{id}/planned-places` |
| Plan from bookings | `GET/POST /api/trips/{id}/plan/from-bookings` |
| Bookings | `GET/POST /api/trips/{id}/bookings`, `PATCH/DELETE /api/bookings/{id}`, payments `POST …/payments`, `PATCH/DELETE /api/payments/{id}`, `PATCH …/paid` / `…/unpaid`, attachments, `GET /api/flights/lookup` |
| Budget | `GET /api/trips/{id}/budget`, `GET /api/exchange-rate` |
| To-do | `GET/POST /api/trips/{id}/todos`, `PATCH/DELETE /api/todos/{id}`, `GET …/todos/suggestions`, `POST …/todos/from-suggestions` |
| Places | `GET/POST /api/places`, `POST …/geocode`, `POST …/import`, `PATCH/DELETE /api/places/{id}`, `PUT/DELETE …/trips/{tripId}`, photos `POST/DELETE /api/places/{id}/photos`, `GET /api/place-photos/…` |
| Folders | `GET/POST /api/folders`, `PATCH/DELETE /api/folders/{id}`, `PUT/DELETE …/places/{placeId}` |
| Geo | `GET /api/geo/places`, `…/cities`, `…/countries` |

## 14. Development notes

- Backend: Spring Boot 4, Java 25, PostgreSQL 16, Flyway (`V1__baseline`, `V2__travel_legs`,
  `V3__travel_note`, `V4__drop_expenses`, `V5__places_are_private`). Unit tests for geometry, place types and the travel-leg rules.
- Frontend: Vue 3 monorepo — `lib/ui` (design system, `Tf*` components, tokens),
  `lib/core` (API client, auth, dates, money, durations, geo), `app/portal` (the app),
  `app/dev` (styleguide). Pure logic in `app/portal/src/plan/` with Vitest tests
  (`npm test`); stateful pieces in `composables/`; the itinerary is composed of
  `DayHead`, `DayStrip`, `DayFacts`, `StopCard`, `LegRow`, `StopDrawer`, `DayRouteAside`,
  `DayDock`.
- `scripts/seed-qa.py` seeds a throwaway consultant account with **the** QA trip: six days
  plus a reserve day, two hotels, two flights and a car rental, a payment schedule in three
  parts (paid / overdue / ahead), seven places in three folders, hand-made stops in a second
  currency, the stops generated from the bookings, and a to-do list. Every manual check runs
  on this trip.
