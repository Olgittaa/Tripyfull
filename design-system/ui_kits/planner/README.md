# Tripyfull — Travel Planner UI kit

High-fidelity, interactive recreation of the **Tripyfull** desktop trip-planner, built to the UX spec. Composes the design-system primitives (`window.TripyfullDesignSystem_bc2c08`). Forms live in **Side Drawers / a Dialog**, not separate pages — exactly as the spec requires.

## Run
This kit loads React + Babel from a CDN, so it needs to be served over HTTP (not opened as a `file://` path). From the project root (`tripyfull-planner/`):

```bash
python3 -m http.server 8765
# then open http://localhost:8765/ui_kits/planner/index.html
```

`index.html` loads `../../_ds_bundle.js`, React + Babel, then `data.js`, `parts.jsx`, `screens.jsx`, `money.jsx`. A blank screen means the in-browser Babel compile hasn't finished — give it a second on first load.

## Architecture
- **`data.js`** (`window.PlannerData`) — fake model: trips, days, activities, bookings + payment schedules, budget-by-category, plus formatting/date helpers. No DS dependency.
- **`parts.jsx`** (`window.PlannerParts`) — shell + shared: icon set (Lucide-style 2px), `Sidebar` (global + in-trip sub-nav), `PageHead`, `Drawer` (right slide-over), `Dialog` (centered modal), `EmptyState`, `Skeleton`, `Money`, `ProgressBar`.
- **`screens.jsx`** (`window.PlannerScreens`) — `TripsList`, `Dashboard`, `DayItinerary`, `ActivityForm`.
- **`money.jsx`** (`window.PlannerMoney`) — `Bookings`, `BookingForm` (with payment tracker), `Budget`, `NewTripForm`, `Placeholder` (Places / Settings).
- **`index.html`** — wires state (current trip, view, day, open drawers/dialog) and the loading→loaded skeleton demo.

## Screens (per spec)
1. **Список поездок (Home)** — trip cards: cover, status badge, dates, budget mini-indicator. `+ Новая поездка` → Dialog. Loading shows skeletons.
2. **Новая / редактировать поездка → Dialog** — name, destination, dates, base currency, hint "дни создадутся автоматически".
3. **Обзор поездки (Dashboard)** — budget summary widget, upcoming payments, day feed, bookings preview; each links into its section.
4. **День / Маршрут** — day header with ← → switcher + editable city, day-picker strip, activity timeline (time · type badge · address · cost), per-category day total, `+ Активность`, empty state.
5. **Активность → Side Drawer** — name, type, start/end, address, cost, notes, links; save / delete.
6. **Брони** — grouped by Транспорт / Проживание / Активности; card shows provider, price, payment status, next payment.
7. **Бронь + платежи → Side Drawer** — booking fields + payment schedule with "сумма платежей = полной цене" indicator; mark paid, add payment.
8. **Бюджет** — план/факт summary, by-category bars, by-day table with Δ.
9–10. **Места / Настройки** — optional, shown as labelled "скоро" placeholders.

## Notes
- This local copy was imported from the Claude Design project `bc2c089c`. The CDN `<script>` tags had their `integrity` (SRI) attributes removed so the page renders reliably outside the design sandbox.
- Trip cover art uses warm gradient **placeholders** — swap for real photography.
