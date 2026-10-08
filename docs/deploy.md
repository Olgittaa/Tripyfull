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
   (`DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`), and the optional
   `AERODATABOX_API_KEY` and `OPENTRIPMAP_API_KEY`. Search, maps, routing,
   descriptions and photos need no key at all. `JWT_SECRET` is
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
Spring Boot starts. Two things keep that wait away: the workflow
`.github/workflows/keep-api-awake.yml` asks the health check every ten minutes
(GitHub runs it late when busy, and pauses it after 60 days without a push —
*Actions → Keep the API awake → Run workflow* restarts it), and the app knocks on
the health check the moment its page opens, so a sleeping API is already starting
while the sign-in form is filled in. Awake all month is about 744 of the
workspace's 750 free hours — enough for this one service, not for a second one
kept awake beside it. It has no disk, so uploaded photos and tickets last only
until the next deploy or restart (places' found photos are links and are fine)
— which is why uploads live in R2 (§3), not on the instance. A workspace gets 750 free
instance hours a month; when they run out, free services are suspended until
the next month, not deleted.

For real clients: `plan: starter` on the service and a disk,
`disk: { name: uploads, mountPath: /var/data, sizeGB: 1 }` — then uploads
survive and the API stays awake.

Redeploy: push to `main`. Logs: the service's **Logs** tab. Shell: **Shell** tab.

## 3. Uploads on Cloudflare R2

The free Render instance has no disk: anything written to it is gone at the
next deploy or restart. So a place's photos and a booking's tickets live in an
R2 bucket — S3-compatible object storage on the Cloudflare account that already
hosts the app. Free: 10 GB stored, a million writes and ten million reads a
month, no charge for traffic, no expiry. (Cloudflare asks for a payment method
to switch R2 on, even to stay within the free allowance.)

1. Cloudflare → **R2 Object Storage → Create bucket**: name `tripyfull-uploads`,
   location **Automatic**, jurisdiction **EU** if offered. Leave it private.
2. **R2 → Manage R2 API Tokens → Create API token**: name `tripyfull-api`,
   permission **Object Read & Write**, scoped to the bucket `tripyfull-uploads`,
   TTL forever. Copy the **Access Key ID** and **Secret Access Key** at once —
   the secret is shown only this once. The same screen shows the endpoint,
   `https://<account id>.r2.cloudflarestorage.com`.
3. In Render → **tripyfull-api → Environment**, set `APP_STORAGE` = `s3`,
   `S3_ENDPOINT`, `S3_BUCKET` = `tripyfull-uploads`, `S3_ACCESS_KEY`,
   `S3_SECRET_KEY` (and `S3_REGION` = `auto`). Save; Render redeploys.

The API checks the bucket once at start-up: a wrong key or bucket name fails
the deploy with a sentence in the logs rather than every upload failing later.
Photos are still served from the API's own `/api/place-photos/…` addresses and
tickets from `/api/attachments/…/download`; only where the bytes rest changed,
so uploads made before this step (on the vanished disk) are the only ones
missing.

Locally nothing changes: `app.storage` defaults to `local`, a folder on disk.

## 4. The app on Cloudflare Pages

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

## 5. First run

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
