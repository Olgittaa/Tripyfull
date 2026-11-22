# Tripyfull — project guide

A trip planner (trips → days → activities, bookings, budget, places) that is gaining an
**AI planning assistant**. See `README.md` for setup and `docs/features.md` for what the app
does today.

## Architecture

```
Vue portal (frontend/)  ──postMessage: JWT + page context──▶  AI chat (web/, Next.js in an iframe)
        ▲                                                             │  /api/chat (server side)
        └────────── "trip-updated" ◀──────────────────────────────────┤  LLM + tools
                                                                      ▼
                                                     Spring Boot API (backend/), user's JWT
```

- **`backend/`** — Spring Boot + PostgreSQL: accounts, JWT, trips, external APIs
  (AeroDataBox flights, OpenTripMap places, routing, geocoding). The single source of truth.
- **`frontend/`** — the **Vue 3 portal**. Stays the main UI; it is *not* being rewritten.
  It hosts a floating button (bottom right) that opens a panel with the chat iframe.
- **`web/`** — **Next.js + TypeScript**: only the AI chat. Streaming, tool calling (Vercel AI
  SDK), tool-result cards, confirmations. Deployed separately; the portal knows only its URL.

Rules of the seam:
- The portal sends the JWT and the current page context (route, `tripId`, `dayId`, selection)
  to the iframe via `postMessage`; both sides check `event.origin`.
- The agent learns about the page through **IDs + tools** (`get_trip`, `get_day`, …), never by
  reading the portal's DOM.
- Agent edits go through tools that call the Spring API with the user's JWT, so the existing
  ownership checks apply. Destructive actions need the user's confirmation in the chat.
- After an edit the chat posts `trip-updated`; the portal reloads its data.
- LLM keys live only on the `web/` server (`.env.local`), never in the browser.

## Roadmap

| When | Focus |
|---|---|
| to mid-Dec 2026 | 1. button + panel + iframe · 2. streaming chat · 3. page context, auth, `get_trip`/`get_day` |
| Jan 2027 | 4. editing tools, `trip-updated`, confirmations, change cards |
| Feb 2027 | RAG over place descriptions (pgvector) |
| Mar 2027 | mobile view, rate limits + LLM budget cap, Langfuse, 30–50 evals, Impressum/Datenschutz, deploy → launch |

## Running locally (Windows)

- `docker compose up -d` — Postgres on :5433 (Docker Desktop must be running).
- Backend: `.claude/launch.json` → `backend` (`node scripts/dev-backend.mjs`), :8080. First start
  seeds the GeoNames cities and reports `OUT_OF_SERVICE` until done.
- Portal: `npm run dev --prefix frontend`, :5173. Chat app: `npm run dev --prefix web`, :3000.
- Demo data: `python scripts/seed-qa.py` (creates a local QA user and a full trip).

## Conventions

- Code, identifiers, comments and commit messages in English.
- Commit messages carry no AI attribution trailer.
- Flyway owns the schema (`ddl-auto=validate`); every schema change is a new migration.
- Frontend component rules: `frontend/CLAUDE.md`.
