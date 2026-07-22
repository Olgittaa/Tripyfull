<template>
  <div class="sg">
    <div class="sg-wrap">
      <!-- NAV -->
      <nav class="sg-nav">
        <a href="#color">Color</a>
        <a href="#type">Type</a>
        <a href="#space">Spacing</a>
        <a href="#elevation">Elevation</a>
        <router-link to="/components">Components →</router-link>
      </nav>

      <!-- COLOR -->
      <section id="color" class="sg-section">
        <span class="tf-eyebrow">Color</span>
        <h2 class="type-h2">Colors</h2>

        <!-- Hero swatches -->
        <div class="sg-colors-hero">
          <div v-for="c in heroColors" :key="c.name" class="sg-color-lg">
            <div class="sg-color-box" :style="{ background: c.hex }"></div>
            <div class="type-small-reg sg-color-name">{{ c.name }}</div>
            <div class="type-small-reg text-muted">{{ c.hex.toUpperCase() }}</div>
          </div>
        </div>

        <h3 class="type-h3 sg-subhead">Primaries, accents, semantics, and grays</h3>

        <!-- Color ramps -->
        <div v-for="ramp in ramps" :key="ramp.title" class="sg-scale-block">
          <h4 class="type-body-bold sg-subtitle">{{ ramp.title }}</h4>
          <div class="sg-scale">
            <div class="sg-scale-bar">
              <div
                v-for="s in ramp.steps"
                :key="s.name"
                class="sg-scale-seg"
                :style="{ background: s.hex }"
              ></div>
            </div>
            <div class="sg-scale-legend">
              <div v-for="s in ramp.steps" :key="s.name" class="sg-scale-item">
                <span class="type-small-reg sg-scale-name">{{ s.name }}</span>
                <span class="type-small-reg text-muted">{{ s.hex.toUpperCase() }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Semantic -->
        <div class="sg-scale-block">
          <h4 class="type-body-bold sg-subtitle">Default semantic colors</h4>
          <div class="sg-scale sg-scale--semantic">
            <div class="sg-scale-bar">
              <div
                v-for="s in semantics"
                :key="s.name"
                class="sg-scale-seg"
                :style="{ background: s.hex }"
              ></div>
            </div>
            <div class="sg-scale-legend">
              <div v-for="s in semantics" :key="s.name" class="sg-scale-item">
                <span class="type-small-reg sg-scale-name">{{ s.name }}</span>
                <span class="type-small-reg text-muted">{{ s.hex.toUpperCase() }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Grays -->
        <div class="sg-scale-block">
          <h4 class="type-body-bold sg-subtitle">Gray colors</h4>
          <div class="sg-scale sg-scale--tall">
            <div class="sg-scale-bar">
              <div
                v-for="s in grays"
                :key="s.name"
                class="sg-scale-seg"
                :style="{ background: s.hex }"
              ></div>
            </div>
            <div class="sg-scale-legend">
              <div v-for="s in grays" :key="s.name" class="sg-scale-item">
                <span class="type-small-reg sg-scale-name">{{ s.name }}</span>
                <span class="type-small-reg text-muted">{{ s.hex.toUpperCase() }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- TYPE -->
      <section id="type" class="sg-section">
        <span class="tf-eyebrow">Typography</span>
        <h2 class="type-h2">Text styles</h2>

        <div class="sg-type-list">
          <div v-for="t in typeStyles" :key="t.cls" class="sg-type-row">
            <span :class="t.cls">{{ t.name }}</span>
            <span class="type-small-reg text-muted sg-type-meta">{{ t.meta }}</span>
          </div>
        </div>
      </section>

      <!-- SPACING -->
      <section id="space" class="sg-section">
        <span class="tf-eyebrow">Spacing & shape</span>
        <h2 class="type-h2">A 4px grid, generous radii</h2>
        <p class="type-lead text-muted">
          Buttons, badges, chips and avatars are fully pill-shaped — the boarding-pass language at
          the heart of the system.
        </p>

        <div class="sg-grid sg-cols-2">
          <div class="card">
            <div class="section-title">Spacing scale</div>
            <div style="display: flex; align-items: flex-end; gap: 12px; margin-top: 12px">
              <div v-for="s in spacingBars" :key="s" style="text-align: center">
                <div
                  :style="{
                    width: '24px',
                    height: s + 'px',
                    background: 'var(--danger-300)',
                    borderRadius: '3px',
                  }"
                ></div>
                <code class="text-xs text-muted" style="display: block; margin-top: 6px">{{
                  s
                }}</code>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="section-title">Corner radii</div>
            <div style="display: flex; align-items: flex-end; gap: 14px; margin-top: 12px">
              <div v-for="r in radii" :key="r.label" style="text-align: center">
                <div
                  :style="{
                    width: '56px',
                    height: '56px',
                    background: 'var(--ink-50)',
                    border: '1.5px solid var(--border-default)',
                    borderRadius: r.val,
                  }"
                ></div>
                <code class="text-xs text-muted" style="display: block; margin-top: 8px">{{
                  r.label
                }}</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ELEVATION -->
      <section id="elevation" class="sg-section">
        <span class="tf-eyebrow">Elevation</span>
        <h2 class="type-h2">Elevation</h2>
        <p class="type-lead text-muted">
          Four warm-ink elevation levels, from a resting card to a floating overlay.
        </p>
        <div class="sg-grid sg-cols-4">
          <div v-for="e in elevations" :key="e.name" style="text-align: center">
            <div class="sg-elev-box" :class="e.cls"></div>
            <code class="text-xs text-muted" style="display: block; margin-top: 10px">{{
              e.name
            }}</code>
          </div>
        </div>
      </section>

      <!-- COMPONENTS LINK -->
      <section class="sg-section">
        <span class="tf-eyebrow">Components</span>
        <h2 class="type-h2">Looking for UI components?</h2>
        <p class="type-lead text-muted">
          Buttons, inputs, cards and the rest of the component library live on their own page.
        </p>
        <router-link to="/components" class="btn btn--primary">Browse components →</router-link>
      </section>
    </div>

    <!-- Footer -->
    <footer class="sg-footer">
      <div class="sg-wrap">
        <span class="type-body-bold">Tripyfull</span>
        <span class="text-xs text-muted" style="font-family: var(--font-mono)"
          >Style guide 2026</span
        >
      </div>
    </footer>
  </div>
</template>

<script setup>
const heroColors = [
  { name: 'Primary', hex: '#0e5c55' },
  { name: 'Accent', hex: '#e35a38' },
  { name: 'Light', hex: '#fbf5ec' },
];
const ramps = [
  {
    title: 'Primary color shades',
    steps: [
      { name: 'success-900', hex: '#073531' },
      { name: 'success-700', hex: '#0c4e47' },
      { name: 'success-500', hex: '#0e5c55' },
      { name: 'success-300', hex: '#4f9d92' },
      { name: 'success-100', hex: '#c3ddd8' },
    ],
  },
  {
    title: 'Accent color shades',
    steps: [
      { name: 'danger-900', hex: '#6f2617' },
      { name: 'danger-700', hex: '#9e3722' },
      { name: 'danger-500', hex: '#e35a38' },
      { name: 'danger-300', hex: '#f0906f' },
      { name: 'danger-100', hex: '#fbdccf' },
    ],
  },
  {
    title: 'Highlight color shades',
    steps: [
      { name: 'warning-900', hex: '#5e3a06' },
      { name: 'warning-700', hex: '#855309' },
      { name: 'warning-500', hex: '#c67a12' },
      { name: 'warning-300', hex: '#f4ad3c' },
      { name: 'warning-100', hex: '#fae1b4' },
    ],
  },
];
const semantics = [
  { name: 'Success', hex: '#0e5c55' },
  { name: 'Danger', hex: '#e35a38' },
  { name: 'Warning', hex: '#c67a12' },
];
const grays = [
  { name: 'black', hex: '#000000' },
  { name: 'ink-900', hex: '#211b17' },
  { name: 'ink-800', hex: '#322a24' },
  { name: 'ink-700', hex: '#4a4039' },
  { name: 'ink-600', hex: '#6b5f56' },
  { name: 'ink-500', hex: '#8c8077' },
  { name: 'ink-400', hex: '#ada399' },
  { name: 'ink-300', hex: '#cdc6bd' },
  { name: 'ink-200', hex: '#e4ddd2' },
  { name: 'ink-100', hex: '#efe9de' },
  { name: 'ink-50', hex: '#fbf5ec' },
  { name: 'ink-0', hex: '#fffdf8' },
  { name: 'white', hex: '#ffffff' },
];
const typeStyles = [
  { cls: 'type-hero', name: 'Hero', meta: '84 · Bold' },
  { cls: 'type-display', name: 'Display', meta: '64 · Bold' },
  { cls: 'type-h1', name: 'h1', meta: '48 · Bold' },
  { cls: 'type-h2', name: 'h2', meta: '36 · Bold' },
  { cls: 'type-h3', name: 'h3', meta: '28 · Semibold' },
  { cls: 'type-lead', name: 'lead', meta: '18 · Regular' },
  { cls: 'type-code', name: 'code', meta: '14 · Mono' },
  { cls: 'type-body', name: 'body', meta: '16 · Regular' },
  { cls: 'type-body-bold', name: 'body-bold', meta: '16 · Semibold' },
  { cls: 'type-small', name: 'small', meta: '14 · Light' },
  { cls: 'type-small-reg', name: 'small-reg', meta: '14 · Regular' },
];
const spacingBars = [4, 8, 16, 24, 32, 48, 64];
const radii = [
  { label: 'sm 8', val: 'var(--radius-sm)' },
  { label: 'md 12', val: 'var(--radius-md)' },
  { label: 'lg 18', val: 'var(--radius-lg)' },
  { label: 'xl 28', val: 'var(--radius-xl)' },
  { label: 'pill', val: 'var(--radius-pill)' },
];
const elevations = [
  { cls: 'elevation-1', name: 'elevation-1' },
  { cls: 'elevation-2', name: 'elevation-2' },
  { cls: 'elevation-3', name: 'elevation-3' },
  { cls: 'elevation-4', name: 'elevation-4' },
];
</script>

<!--
  Only layout lives here. All visual styling (typography, colours,
  surfaces, buttons) comes from the shared design system in
  frontend/lib/ui/src/styles via .type-*, .card, .tf-eyebrow,
  .section-title, .text-*, .btn classes and design tokens.
-->
<style scoped>
.sg {
  background: var(--bg);
  min-height: 100vh;
}

.sg-wrap {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 var(--gutter);
}

/* Nav */
.sg-nav {
  position: sticky;
  top: 0;
  z-index: 30;
  background: rgba(251, 245, 236, 0.88);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-default);
  padding: 12px var(--gutter);
  max-width: 1080px;
  margin: 0 auto;
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}
.sg-nav a {
  font: var(--fw-medium) var(--text-sm)/1 var(--font-sans);
  color: var(--text-secondary);
  text-decoration: none;
}
.sg-nav a:hover {
  color: var(--accent);
}

/* Section rhythm */
.sg-section {
  padding: 64px 0 8px;
  border-top: 1px solid var(--border-default);
}
.sg-section:first-of-type {
  border-top: none;
}
.sg-section > .type-h2 {
  margin: 12px 0 6px;
}
.sg-section > .type-lead {
  max-width: 620px;
  margin: 0 0 32px;
}

/* Grid */
.sg-grid {
  display: grid;
  gap: 16px;
}
.sg-cols-2 {
  grid-template-columns: repeat(2, 1fr);
}
.sg-cols-4 {
  grid-template-columns: repeat(4, 1fr);
}
@media (max-width: 760px) {
  .sg-cols-2,
  .sg-cols-4 {
    grid-template-columns: 1fr 1fr;
  }
}

/* Colors — hero swatches */
.sg-colors-hero {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  margin: 8px 0 4px;
}
.sg-color-lg {
  width: 120px;
}
.sg-color-box {
  height: 118px;
  border-radius: 8px;
  border: 1px solid var(--border-default);
}
.sg-color-name {
  margin-top: 10px;
}

/* Colors — subhead spacing */
.sg-subhead {
  margin: 40px 0 20px;
}
.sg-subtitle {
  margin: 0 0 12px;
}
.sg-scale-block {
  margin-bottom: 28px;
}

/* Colors — horizontal scale */
.sg-scale-bar {
  display: flex;
  border-radius: 8px;
  overflow: hidden;
}
.sg-scale-seg {
  flex: 1;
  height: 64px;
}
.sg-scale--tall .sg-scale-seg {
  height: 92px;
}
.sg-scale--semantic {
  max-width: 460px;
}
.sg-scale-legend {
  display: flex;
  margin-top: 10px;
}
.sg-scale-item {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-right: 12px;
}
.sg-scale-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sg-scale--tall .type-small-reg {
  font-size: var(--text-xs);
}

/* Type styles list */
.sg-type-list {
  display: flex;
  flex-direction: column;
  gap: 28px;
}
.sg-type-row {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px 16px;
}
.sg-type-meta {
  flex: none;
}

/* Elevation box */
.sg-elev-box {
  height: 80px;
  background: var(--card);
  border-radius: var(--radius-md);
}

/* Footer */
.sg-footer {
  padding: 48px var(--gutter) 72px;
  border-top: 1px solid var(--border-default);
  margin-top: 48px;
}
.sg-footer .sg-wrap {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1080px;
  margin: 0 auto;
}
</style>
