# Deploying Tripyfull

Two hosts, one repository: the API and its database run on **Render** from
`render.yaml`; the app is a static site on **Cloudflare Pages** built from
`frontend/`. Both deploy from `main` on every push. Nothing secret is in the
repository — keys are typed into the two dashboards once.

## 1. The database on Neon

Neon's free plan has no expiry date — unlike Render's free database, which is
deleted 44 days after it is made. It gives 0.5 GB per project (a trip is a few
kilobytes of text; photos are links), suspends its compute after five idle
minutes and wakes it in well under a second. Writes fail — nothing is deleted —
if the 0.5 GB ever fill.

1. [neon.com](https://neon.com) → **New project**: name `tripyfull`, region
   **Frankfurt** (eu-central-1), Postgres **16**.
2. On the project's dashboard, **Connect** → the connection details. Take the
   **direct** host — the one *without* `-pooler` in it (Flyway needs a plain
   connection) — the database name, the user and the password.
3. They go into Render as the five `DB_*` variables (next section). Nothing
   else: Flyway creates the schema on the empty database at the API's first
   start.

Point-in-time restore on the free plan reaches six hours back. A nightly
`pg_dump` into GitHub Actions is the cheap insurance beyond that — a step still
to come.

## 2. The API on Render

1. Render → **New → Blueprint** → pick the `Tripyfull` GitHub repository.
   Render reads `render.yaml` and proposes the web service `tripyfull-api`
   (Docker, `backend/Dockerfile`, Frankfurt).
2. It asks for the values marked `sync: false`: the four Neon details
   (`DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`), `GOOGLE_MAPS_API_KEY` (the
   paid Places + Routes key — leave empty to run on OpenStreetMap only),
   `AERODATABOX_API_KEY` and `OPENTRIPMAP_API_KEY` (optional). `JWT_SECRET` is
   generated.
3. **Apply.** The first build takes several minutes (Maven downloads its
   dependencies inside the image). The service is up when
   `https://tripyfull-api.onrender.com/actuator/health` answers `{"status":"UP"}`.
4. Copy the service URL — the frontend needs it.

Moving an existing service from a Render database to Neon: **Environment** →
overwrite `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` with Neon's, save
(Render redeploys), then delete the Render database once the API is up on Neon.

**The free plan, and what it costs in behaviour.** The API instance sleeps after
15 idle minutes, so the first visitor after a pause waits about a minute while
Spring Boot starts. It has no disk, so uploaded photos and tickets last only
until the next deploy or restart (places' Google photos are links and are fine)
— object storage for uploads is the next step. A workspace gets 750 free
instance hours a month; when they run out, free services are suspended until
the next month, not deleted.

For real clients: `plan: starter` on the service and a disk,
`disk: { name: uploads, mountPath: /var/data, sizeGB: 1 }` — then uploads
survive and the API stays awake.

Redeploy: push to `main`. Logs: the service's **Logs** tab. Shell: **Shell** tab.

## 3. The app on Cloudflare Pages

1. Cloudflare → **Workers & Pages → Create → Pages → Connect to Git** → the
   `Tripyfull` repository, production branch `main`.
2. Build settings:

   | Setting                | Value                                               |
   | ---------------------- | --------------------------------------------------- |
   | Framework preset       | None                                                |
   | Root directory         | `frontend`                                          |
   | Build command          | `npm ci && npm run build -w @tripyfull/portal`      |
   | Build output directory | `app/portal/dist`                                   |

3. Environment variables (Production):

   | Variable       | Value                                            |
   | -------------- | ------------------------------------------------ |
   | `VITE_API_URL` | the Render URL, e.g. `https://tripyfull-api.onrender.com` — **no trailing slash** |
   | `NODE_VERSION` | `22`                                             |

   `VITE_API_URL` is baked into the build: change it and **Retry deployment**.
4. **Save and Deploy.** The app is at `https://<project>.pages.dev`. Deep links
   (`/trips/…`) work because `frontend/app/portal/public/_redirects` sends every
   path to `index.html`.

A custom domain can be added in the project's **Custom domains** tab later; the
API needs no change for it — CORS allows any origin, and sessions are bearer
tokens, not cookies.

## 4. First run

Open the Pages URL, register the first account, create a trip. To load the
consultant's demo trip on the deployed API:

```bash
API_URL=https://tripyfull-api.onrender.com python3 scripts/seed-qa.py demo
```

(`scripts/seed-qa.py` reads `API_URL` when set.)

## Local reference

- Backend: `node scripts/dev-backend.mjs` (Postgres in Docker + Spring Boot on :8080).
- Frontend: `npm run dev` in `frontend/` (Vite on :5173, `VITE_API_URL` from `.env.development`).
- The production image can be tried locally:
  `docker build -t tripyfull-api backend && docker run --rm -p 8080:8080 -e DB_HOST=host.docker.internal -e DB_NAME=tripdb -e DB_USER=postgres -e DB_PASSWORD=postgres -e JWT_SECRET=$(openssl rand -hex 32) tripyfull-api`
