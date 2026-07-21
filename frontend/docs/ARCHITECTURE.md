# Tripyfull Frontend — Architecture

npm-workspaces monorepo: two deployable **apps** that share versioned **libs**.

## Layout

```
frontend/
├── package.json          workspaces: ["lib/*", "app/*"] + orchestration scripts
├── app/
│   ├── portal/           the main Tripyfull app (deployable)
│   │   ├── index.html · vite.config.ts · jsconfig.json
│   │   └── src/  main.js · App.vue · router.js · views/ · components/ · stores/ · assets/
│   └── dev/              the style guide / component showcase (deployable)
│       ├── index.html · vite.config.ts · jsconfig.json
│       └── src/  main.js · App.vue · router.js · styleguide/
├── lib/
│   ├── ui/               @tripyfull/ui — Tf* components + TfIcon + fonts + the design-system CSS
│   │   └── src/  *.vue · index.js (barrel) · assets/fonts/ · styles/ (7-1 tree)
│   └── core/             @tripyfull/core — framework-agnostic services (circle-breaker)
│       └── src/  api.js · auth.js · currency.js · index.js (barrel)
└── docs/                 CONCEPT.md · ARCHITECTURE.md
```

## Packages & dependency direction

```
@tripyfull/core   →  no workspace deps (axios + vue only). The circle-breaker.
@tripyfull/ui     →  may depend on @tripyfull/core (+ vue)
app/portal        →  depends on ui + core (+ vue-router, pinia, primevue, leaflet)
app/dev           →  depends on ui + core (+ vue-router)
```

Apps never depend on each other; shared code lives in `lib/*`. Keep the arrows one-way — if a
`ui` component needs app state, it belongs in the app, not the lib.

- **`@tripyfull/core`** — `api` (axios client), `auth` (session state/helpers), `currency`
  (data + math). No Vue components, no router. The 401 reaction is injected by the app via
  `setUnauthorizedHandler()` so core stays app-agnostic.
- **`@tripyfull/ui`** — the `Tf*` component kit + `TfIcon` (Material Symbols Rounded, FILL axis)
  - the shared stylesheet. Owns `styles/` (the 7-1 CSS incl. design tokens) so both apps render
    identically; each app imports `@tripyfull/ui/styles/main.css` once in its `main.js`.
- **`app/portal`** — the real app: routed `views/`, shared feature `components/`, Pinia `stores/`.
- **`app/dev`** — a thin shell that routes to the style-guide pages; consumes the same `ui` styles.

## Imports

- **Cross-package** → bare package specifier: `@tripyfull/ui`, `@tripyfull/core`.
  ```js
  import { TfButton, TfIcon } from '@tripyfull/ui';
  import { api, CURRENCIES } from '@tripyfull/core';
  ```
- **Within an app** → the app's own `@` alias points at that app's `src`:
  ```js
  import TripList from '@/views/TripList.vue';
  import { useTripStore } from '@/stores/tripStore.js';
  ```
- **Within a package** → relative paths (a package never imports its own barrel).

Each lib exposes a single **barrel** (`src/index.js`); consumers import only from the package
name. npm links the workspaces, so `@tripyfull/*` resolve via `node_modules` symlinks.

## Scripts (run from `frontend/`)

```bash
npm run dev              # start the portal app
npm run dev:styleguide   # start the dev/style-guide app (port 4001)
npm run build            # build both apps
npm run format:fix       # prettier
```

## Known simplifications

- `lib/ui/styles/` currently holds **all** CSS, including some portal-specific `layout/` and
  `pages/` rules. It's kept as one shared stylesheet for simplicity; if the two apps' styling
  diverges, split the app-specific layers back into `app/portal`.
