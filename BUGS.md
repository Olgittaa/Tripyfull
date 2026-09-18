# BUGS

Everything known to be wrong with Tripyfull, in three buckets. One line per bug, newest at
the top of its section. The spec is [`docs/features.md`](docs/features.md) — if a bug is
"the app does X but the spec says Y", say which one is right.

**The launch rule:** only *Breaks the main path* has to be empty before launch. The other two
sections may stay full forever; they are a record, not a backlog. A bug that turns out to be a
missing feature moves to [`AFTER_M1.md`](AFTER_M1.md) instead of being fixed.

**How to write one:**

```
- [ ] **Where** — what happens, what should happen. *Steps:* … *Seen:* 2026-09-17, Chrome/desktop.
```

Tick the box and leave the line when it is fixed; move it under **Fixed** with the commit
once the fix is on `main`.

---

## 1. Breaks the main path

The consultant cannot finish the job: create trip → build the itinerary → add bookings and
payments → print the book → hand over the link. Data loss, a blank screen, a spinner that
never ends, a wrong number in the budget. **These block the launch.**

*(empty)*

## 2. Annoying, but there is a way round

It works if you know the trick, or it is ugly but harmless. Fixed when nothing in section 1
is waiting, or when a consultant names it in an interview.

- [ ] **"Failed to load day" after signing out on purpose** — choosing *Sign out* in the
  expired-session dialog lands on the sign-in page with a red error toast, because the request
  that was waiting for the sign-in is rejected and the screen it belonged to complains. Nobody
  needs to be told a load failed after they chose to leave. *Steps:* let a session expire on a
  day screen → *Sign out*. *Seen:* 2026-09-17.

## 3. Only I noticed

Wrong padding, a word that grates, an animation that stutters. Written down so it stops
occupying the head. Never a reason to delay anything.

- [ ] **Labels not tied to their controls in several dialogs** — the payment dialog's "Amount",
  the booking form's "City", the trip dialog's "Destination" and "Dates" are plain `<label>`
  elements next to a component rather than labels of the control inside it. A screen reader
  announces the field without its name, clicking the label does not focus it, and a test has to
  aim at a class. The three components that own their control (`TfInput`, `TfNumberInput`,
  `TfTextarea`) were fixed on 2026-09-17; what is left are the bare labels in the views.
  *Seen:* 2026-09-17.

---

## Fixed

- [x] **"1 meal_stop" in the client's own document** — the book's *What is in the plan* page
  named a kind of stop by its database word whenever the stop had no saved place behind it, and
  counted in plurals regardless ("1 sights"). *Found by:* reading a printed PDF of the seeded
  trip. *Fixed:* 2026-09-18 — every kind of stop, from either list, has a word for one and a
  word for many, and the test refuses a document containing an underscore anywhere.

- [x] **Nameless buttons on a phone** — the head's *Edit* and *Print*, the library's *Find &
  import* and the bookings' *Update rates* keep only their icon on a narrow screen: their label
  is a `<span class="phone-hide">`, which is `display: none` there, so the accessible name was
  empty. A screen reader on a phone announced "button". *Found by:* the print book's phone run,
  which could not find the Print button at all. *Fixed:* 2026-09-18 — each carries an
  `aria-label` that says what it does, whatever the width.

- [x] **A cancelled booking left its stops on the itinerary** — deleting a hotel, a flight or an
  activity removed the booking, its instalments and its files, but the stops it had written into
  the days stayed: "Check in · Hotel Alfonso XIII" still on day 1, still marked *Booked*, still
  refusing to be edited ("change the booking and press Update plan" — for a booking that no
  longer exists). They only went away the next time somebody pressed *Update plan*, and a book
  printed before that showed the client a hotel that had been cancelled. *Found by:* the
  walkthrough of the "update plan from bookings" link. *Fixed:* 2026-09-18 — a booking takes its
  own stops with it, the way it already took its payments and its files.

- [x] **The reschedule preview threatened to delete a day that was never at risk** — moving a
  trip with a reserve day to another week, same length, warned "1 day now outside the range
  will be deleted, together with their activities". Nothing was going to be deleted: a reserve
  day has no date, so the move neither shifts nor drops it. The preview counted every day the
  trip has, including the undated ones, against the length of the new range. It is the one
  dialog whose whole job is to be believed before data is destroyed, and it cried wolf.
  *Found by:* the walkthrough of the trip-dates link, on the seeded trip. *Fixed:* 2026-09-17 —
  the preview counts dated days only, and a test moves a trip with a reserve day and fails if
  the word "deleted" appears.

- [x] **A trip could be created ending before it started** — `POST /api/trips` and `PATCH
  /api/trips/{id}` took an end date before the start without a word, and the trip came out with
  no days at all (there is no date in the range to generate one for), while `POST …/reschedule`
  refused the same thing properly. *Fixed:* 2026-09-17 — all three doors give the same
  sentence, "End date cannot be before start date".

- [x] **A session that died inside a form could not be answered** — the *Session expired*
  dialog opened **underneath** the modal or drawer the consultant was working in, and its
  backdrop swallowed every click, so the only way out was to close the form and lose what was
  typed — in the one case the dialog exists for. *Cause:* every overlay sits at the same
  z-index (90) and a modal teleports to `<body>` at the position its component was mounted, so
  the dialog, mounted once with the app shell, was always earlier in the document than a modal
  a screen opened later. *Found by:* the session test, which fills in a new trip and lets the
  save run into a dead session. *Fixed:* 2026-09-17 — `TfModal` takes `topmost`, the one
  overlay nobody opens on purpose sits above the rest, and the test now proves the trip is
  saved after signing back in, without retyping.

- [x] **Itinerary — the way to a stop did not appear until the day was reopened** — adding a
  stop, editing one, moving it to another day or deleting it left the leg above it showing
  "…" (or the time it had before the change). Reported from use; reproduced on the seeded
  trip: a place added at the end of day 2 showed nothing under the stop before it, and after a
  reload the same row read "1 h 3 min · 46.3 km by car". *Cause:* the server recomputes the
  day's legs on every one of those calls, but answers with the stop that changed alone, and
  the day screen patched that one row into its list instead of taking the day back from the
  server. Dragging and the map's quick-add-after-a-stop were fine — they go through the
  reorder endpoint, which returns the whole day. *Fixed:* 2026-09-17 — the day's stops are
  re-read after every change, and the golden-path test fails without it.

- [x] **Print — the route book left out every travel time** — a day's stops printed with no
  "→ next stop by car · 25 min" line unless the consultant had picked the mode by hand. The
  server computes a default mode (walk / taxi / car) without writing it on the stop — it only
  goes into the leg's key — so `travelModeToNext` was null for every leg nobody touched, and
  the book prints the line only when it has a mode. The itinerary screen derives the same
  default for itself, which is why the gap showed up only on paper. *Found by:* the golden-path
  test, on its first complete run. *Fixed:* 2026-09-17 — `GET /trips/{id}/export` reports the
  mode the leg was computed with when the stop carries none.

- [x] **Itinerary, any trip without bookings** — the **second** stop with coordinates on a day
  fails with `500 NullPointerException` and is **not saved**; the first one is fine, and so is
  any number of stops without coordinates. A trip whose bookings already put a stop on that day
  (a hotel, a flight) never hits it, which is why the seeded trip looks healthy — it is the
  first thing a new user does that breaks. *Cause:* `TravelLegService.refresh`
  ([TravelLegService.java:70](backend/src/main/java/com/tripyfull/service/TravelLegService.java#L70))
  calls `bookings.get(from.getSourceBookingId())`; when no stop on the day came from a booking,
  `bookings` is `Map.of()`, and an immutable map throws on a null key where a `HashMap` would
  return null. *Steps:* new trip, no bookings → day 1 → add two places from the library →
  the second one 500s. *Also hits:* every reserve day seeded by `scripts/seed-qa.py`, which is
  where it surfaced. *Seen:* 2026-09-17, backend on `main` (`db25ab9`).
  *Fixed:* 2026-09-17 — the source-booking lookup skips a null key, with a regression test
  (`TravelLegServiceTest.aDayWhoseStopsCameFromNoBookingStillGetsItsLegs`) that fails without it.
