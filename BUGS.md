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

*(empty)*

## 3. Only I noticed

Wrong padding, a word that grates, an animation that stutters. Written down so it stops
occupying the head. Never a reason to delay anything.

*(empty)*

---

## Fixed

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
