# Tripyfull frontend — component conventions

How we build UI components and the design system. Follow these when adding or
editing anything under `lib/ui` or the styleguide.

## Layout

- `lib/ui/src/*.vue` — shared components, exported from `lib/ui/src/index.js` as `Tf*`.
- `lib/ui/src/styles/` — the design system (7-1 architecture, entry `main.css`):
  - `abstracts/variables.css` — the ONLY source of tokens.
  - `base/`, `components/`, `layout/`, `pages/` — imported by `main.css`.
- `app/dev` — the styleguide (dev app): `/styleguide` = foundations, `/components` = component showcase.
- `app/portal` — the real app; consumes `Tf*` components. Never break its API.

## Tokens (`abstracts/variables.css`)

- Use **only** the real Figma "Mode 1" tokens. There are **no legacy aliases**
  (`--brand`, `--text-strong`, `--surface-card`, `--field-*`, `--coral-*`, `--gold-*` … are gone).
- Semantics: `--primary` = teal, `--accent`/`--danger-*` = coral, `--warning-*` = gold,
  neutral/contrast = ink ramp. `--success-*` is used for selection/range highlights.
- Text: `--text-primary` (ink-800), `--text-secondary` (ink-600), `--text-disabled`.
- Surfaces: `--bg`, `--card`, `--surface`; borders `--border-default`/`--border-strong`.
- Never hardcode colors, spacing, radii, or shadows. Use `--space-*`, `--radius-*`,
  `--shadow-*` / `--elevation-*` (elevation = Figma effect styles, used for floating layers).

## Typography — use the saved type roles, don't invent sizes

Roles map 1:1 to Figma text styles. Apply via `font: var(--type-*)`:

`--type-hero` 84 · `--type-display` 64 · `--type-h1` 48 · `--type-h2` 36 · `--type-h3` 28 ·
`--type-lead` 18 · `--type-body` 16 · `--type-body-bold` 16 · `--type-code` 14 mono ·
`--type-small` 14 regular (= "small-reg") · `--type-small-light` 14 light (= "small").

Utility classes exist too: `.type-*`, `.tf-eyebrow`, `.section-title`, `.text-muted`, `.text-xs/sm`.

## Components

- Styles live in `styles/components/*.css` with **plain class names** (`.btn`, `.input`,
  `.select`, `.badge`, `.chip`, `.progress`, `.dp-*`). **No `tf-` prefix** (except the shared
  `.tf-eyebrow` utility).
- `Tf*.vue` components have **no `<style>` block** — they only render markup + classes + props.
- Controlled via `v-model`: `modelValue` prop + `emit('update:modelValue', …)`.
- Real interaction states via real pseudo-classes: `:hover`, `:focus-visible`, `:focus-within`.
  Don't fake hover/focus with static classes.
- Single focus ring everywhere: `box-shadow: 0 0 0 3px var(--input-select-focus-bg)` (teal).
- Overlays (menus, calendar): `position: absolute`, `box-shadow: var(--elevation-3)`,
  `z-index: 20`, close on outside click (document listener in `onMounted`/`onBeforeUnmount`).
- Icons: primeicons (`pi pi-*`).
- Reuse what exists (e.g. the date picker reuses `.select` trigger and `.btn` for nav).
- Keep it lean: **no form library, no i18n/locale, no third-party widgets** — plain `Date`/JS.

## Styleguide (`app/dev`)

- `/components` (`BaseComponents.vue`) imports and renders the `Tf*` components. Its scoped
  styles contain **layout only** (grids, section arrangement) — never component styles.
- `/styleguide` (`StyleGuide.vue`) shows **foundations only** (color, type, spacing, elevation).
- Show only meaningful static states (default / selected / disabled / error / loading /
  checked / indeterminate). hover / focus / open happen live on interaction.
- Demos are interactive: use `reactive`/`ref` + `v-model` so selection actually works.

## Screen sizes

The app is used on a laptop, on a tablet and on a phone. Layouts are built
wide, then folded — every page must fit its viewport with no sideways drag.

Breakpoints, widest first (max-width):

- **1300 / 1100 / 900** — how many columns a grid of tiles or cards keeps.
- **768** — the shell folds: the trip menu lies flat as a scrolling strip, the
  top bar keeps icons only, the document scrolls instead of an inner pane
  (`base/responsive.css`).
- **700** — a page's own internals stack: side-by-side facts, tighter cards,
  finger-sized controls.
- **560 / 480 / 430** — narrow phones: field pairs become one column, tile
  rows and card grids go single-file, the trip's name leaves the menu strip.

Rules that keep this working:

- A `1fr` grid track will not shrink below its content: write
  `minmax(0, 1fr)` for anything that must fit a phone, and `min-width: 0` on
  flex/grid children that hold long text.
- No `style="display: grid; grid-template-columns: …"` in a template — an
  inline style cannot be answered by a media query. Use `.field-pair`,
  `.metric-grid`, `.trip-gallery`, or add a class.
- Rows of buttons wrap (`flex-wrap: wrap`); strips of chips scroll
  (`overflow-x: auto` + hidden scrollbar). Never let either push the page.
- A `<style scoped>` rule outranks a global one, and a later rule beats an
  earlier one of equal weight: put a component's phone overrides at the **end
  of its own** style block, not in `responsive.css`.
- Touch targets are at least ~38px; nothing that carries meaning is under 11px.

## Hygiene

- No dead selectors, no undefined tokens. Delete unused CSS/props when you remove a feature.
- A style is defined once in the design system — it applies to both the portal and the styleguide.
- After changes, both `app/dev` and `app/portal` must build (`npm run build`).
