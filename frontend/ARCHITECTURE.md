# Tripyfull Frontend — Architecture

Single Vue 3 app (Vite + Pinia + vue-router + PrimeVue). This document describes how
`src/` is organised and the conventions to keep it consistent as it grows.

## Layer layout

```
src/
├── main.js          App bootstrap (createApp, plugins, mount) — Vite entry
├── App.vue          Root component (shell / <router-view/>)
├── router.js        Route table (maps paths → views)
├── index.css        Global stylesheet
│
├── ui/              Design-system primitives — the "Tf*" kit
│   ├── TfButton.vue, TfInput.vue, TfDrawer.vue, ...
│   └── index.js         ← barrel: the ONLY public entry to the kit
│
├── components/      Shared feature components (reused, not routed)
│   └── BookingMap.vue
│
├── views/           Routed pages — one per route in router.js
│   ├── TripList.vue, TripDetail.vue, DayItinerary.vue,
│   ├── BookingsView.vue, BudgetView.vue, PlaceLibrary.vue,
│   └── AccountSettings.vue, Auth.vue
│
├── styleguide/      Component showcase / dev playground
│   ├── StyleGuide.vue, BaseComponents.vue
│
├── services/        Framework-agnostic app logic (no .vue)
│   ├── api.js           axios client + interceptors
│   ├── auth.js          auth state + helpers
│   └── currency.js      currency data + conversion/format helpers
│
├── stores/          Pinia stores
│   └── tripStore.js
│
└── assets/          Static assets (images, logos, fonts)
```

### What goes where

- **`ui/`** — generic, domain-agnostic primitives. A `Tf*` component knows nothing about
  trips or bookings; it takes props and emits events. Reused everywhere.
- **`components/`** — reusable pieces that _are_ domain-aware but are **not** a whole page
  (e.g. `BookingMap`, embedded in several views).
- **`views/`** — a component mapped to a route in `router.js`. Rule of thumb: **if it's in
  the route table, it's a view.**
- **`styleguide/`** — a living catalogue of the `ui/` kit; the safe place to build/preview a
  component in isolation.
- **`services/`** — plain JS modules: network, auth, money math. No Vue components here.
- **`stores/`** — Pinia; shared reactive state across views.

## Import convention

An **`@` alias points at `src/`** (configured in `vite.config.ts` and `jsconfig.json`).

- **Across layers** → use the alias, never deep relatives:
  ```js
  import api from '@/services/api.js';
  import { TfButton } from '@/ui';
  import { useTripStore } from '@/stores/tripStore.js';
  ```
- **Within the same layer/folder** → use relative paths:
  ```js
  // inside ui/TfDrawer.vue
  import TfIconButton from './TfIconButton.vue';
  ```

Why: moving a file between layers no longer breaks its consumers — the alias path is stable.
And relative-only-within-a-layer keeps each layer self-contained.

## The `ui/` barrel

`ui/index.js` re-exports every primitive by name. Consumers import **only** from `@/ui`:

```js
import { TfButton, TfBadge, TfCard } from '@/ui';
```

When you add a `Tf*` component, add one `export { default as TfX } from './TfX.vue'` line to
the barrel. Don't import a `ui/` component by its file path from outside `ui/`.

## Dependency direction (keep it acyclic)

```
services / stores   →  (no UI; may use each other's data)
ui                  →  self-contained primitives (no services/stores/views)
components / views  →  may use ui, services, stores
router              →  imports views
main / App          →  wire everything together
```

Keep arrows pointing one way. If a `ui/` primitive starts needing `services/`, that's a smell —
it probably belongs in `components/` instead.

## Naming

- Components: `PascalCase.vue` (`TripDetail.vue`); `ui/` primitives are prefixed `Tf`.
- Non-component JS: lowercase (`api.js`, `tripStore.js`).
- One route → one file in `views/`.

## Scripts

```bash
npm run dev      # dev server (Vite)
npm run build    # production build → dist/
```

## When would this become a monorepo?

Not needed for a single app. Only split into pnpm workspaces + packages (`app/`, `lib/ui`,
`lib/core`) if you add a **second** app that must share the `ui/` kit — that's the point where
a shared library package earns its keep. Until then, these folder layers give the same
separation without the tooling overhead.
