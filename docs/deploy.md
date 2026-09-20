# Deploying Tripyfull

Two hosts, one repository: the API and its database run on **Render** from
`render.yaml`; the app is a static site on **Cloudflare Pages** built from
`frontend/`. Both deploy from `main` on every push. Nothing secret is in the
repository — keys are typed into the two dashboards once.

## 1. The API on Render

1. Render → **New → Blueprint** → pick the `Tripyfull` GitHub repository.
   Render reads `render.yaml` and proposes two resources: the web service
   `tripyfull-api` (Docker, `backend/Dockerfile`) and the Postgres database
   `tripyfull-db`, both in Frankfurt.
2. It asks for the values marked `sync: false`: `GOOGLE_MAPS_API_KEY` (the paid
   Places + Routes key — leave empty to run on OpenStreetMap only),
   `AERODATABOX_API_KEY` and `OPENTRIPMAP_API_KEY` (optional). `JWT_SECRET` is
   generated; the database's host, port, name, user and password are wired in
   automatically.
3. **Apply.** The first build takes several minutes (Maven downloads its
   dependencies inside the image). The service is up when
   `https://tripyfull-api.onrender.com/actuator/health` answers `{"status":"UP"}`.
   Flyway creates the schema on the empty database on that first start.
4. Copy the service URL — the frontend needs it.

**The free plan, and what it costs in behaviour.** `render.yaml` asks for `free`
on both. The API instance sleeps after 15 idle minutes, so the first visitor
after a pause waits about a minute while Spring Boot starts; and it has no disk,
so uploaded photos and tickets last only until the next deploy or restart
(places' Google photos are links and are fine). The free database is **deleted
after its trial period** — 30 days at the time of writing — with everything in
it; upgrade it in the dashboard before then if the data matters.

For real clients, change two things in `render.yaml` and push: `plan: starter`
on the service and a disk, `disk: { name: uploads, mountPath: /var/data,
sizeGB: 1 }` — then uploads survive and the API stays awake — and a paid
database plan (`basic-256mb` is the smallest).

Redeploy: push to `main`. Logs: the service's **Logs** tab. Shell: **Shell** tab.

## 2. The app on Cloudflare Pages

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

## 3. First run

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
