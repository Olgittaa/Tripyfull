# AFTER M1

The parking lot. Everything that would be nice and is **not** being built before the launch.

**The rule:** write it down, read the file once a week, build nothing from it. Nothing leaves
this file until all five launch criteria are met. When a consultant interview asks for
something, add the tally — `asked 3 of 5` — that tally, not enthusiasm, decides what gets built
first afterwards.

**How to write one:**

```
- **Name** — one sentence on what it is. *Why not now:* … *Added:* 2026-09-17. *Asked:* 0 of 5.
```

---

## From the spec's own gap list (`docs/app_spec.md` §9)

- **Budget cap** (G-6) — `Trip.plannedBudget` plus a planned/committed/remaining widget against
  the cap, warning but never blocking. *Why not now:* the budget already answers "planned /
  paid / due"; a cap is a second story to get right. *Added:* 2026-09-17.
- **Export as `.ics` and day → Google Maps links** (G-8) — bookings into a calendar, a day's
  stops as one maps URL. Both are client-side. *Why not now:* the print book already gets the
  trip out of the app, and the client page replaces the rest of the need. *Added:* 2026-09-17.
- **All-trip map** (G-5) — one map with every day's route, not just the open day. *Why not now:*
  nice, not load-bearing. *Added:* 2026-09-17.
- **Trip-scoped shortlist** (G-3) — a "maybe" pool per trip, between the library and the days.
  *Why not now:* folders in the library cover it well enough. *Added:* 2026-09-17.
- **Finish the `Tf*` kit migration** (G-13) — the portal still mixes PrimeVue with the design
  system. *Why not now:* invisible to a consultant; touch it only where a screen is being
  rewritten anyway. *Added:* 2026-09-17.

## From the plan

- **Password reset** — there is none today: no reset endpoint, no mail flow. *Why not now:* the
  first users are five invited consultants; a forgotten password is a message to us. Needed
  before open sign-up, so it comes back with stage 4's transactional mail. *Added:* 2026-09-17.

## From the interviews

*(one line per ask, with `asked N of 5`)*

---

## Rejected on purpose

Not "later" — **no**. Written down so the question does not come back every month.

- **Client comments, chat, edits on the client page** — the client reads and ticks to-dos.
  Anything else turns the page into a second product.
- **Open-rate analytics and push on the client page** — a consultant who needs to know whether
  the client opened it can ask them.
- **Collaboration / multiple users on one account** — one consultant, one account.
- **Actual expenses** — Tripyfull plans money, it does not track spending. Removed on
  2026-09-17 (entity, endpoints, the day's expense list and the spent columns, `V4__drop_expenses`)
  because it doubled every money screen and nobody filled it in.
