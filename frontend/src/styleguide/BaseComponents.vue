<template>
  <div class="bc">
    <!-- Hero -->
    <div class="bc-hero">
      <div class="bc-hero-in">
        <span class="tf-eyebrow">Component library</span>
        <h1>Base components</h1>
        <p>
          The reusable Tripyfull primitives — buttons, badges, cards, forms, navigation, and
          feedback — all built with design-system tokens.
        </p>
      </div>
    </div>

    <div class="bc-wrap">
      <!-- Nav -->
      <nav class="bc-nav">
        <a href="#buttons">Buttons</a>
        <a href="#icon-buttons">Icon buttons</a>
        <a href="#badges">Badges</a>
        <a href="#surfaces">Cards & avatars</a>
        <a href="#forms">Forms</a>
        <a href="#nav">Navigation</a>
        <a href="#feedback">Feedback</a>
        <router-link to="/styleguide">Style guide</router-link>
      </nav>

      <!-- BUTTONS -->
      <section id="buttons" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Actions</span>
            <h2 class="bc-sec-title">Buttons</h2>
          </div>
          <p class="bc-sec-note">
            Pill-shaped. One coral primary per view; teal accent, secondary, soft and ghost for
            everything else.
          </p>
        </div>
        <div class="bc-demo">
          <div class="bc-group">
            <div class="bc-label">Variants</div>
            <div class="bc-row">
              <button class="tf-btn tf-btn--primary">
                Plan my trip <span class="tf-btn-arrow">&rarr;</span>
              </button>
              <button class="tf-btn tf-btn--accent">Add booking</button>
              <button class="tf-btn tf-btn--secondary">Details</button>
              <button class="tf-btn tf-btn--soft">Saved</button>
              <button class="tf-btn tf-btn--ghost">Cancel</button>
              <button class="tf-btn tf-btn--primary" disabled>Disabled</button>
            </div>
          </div>
          <div class="bc-group">
            <div class="bc-label">Sizes</div>
            <div class="bc-row">
              <button class="tf-btn tf-btn--primary tf-btn--sm">Small</button>
              <button class="tf-btn tf-btn--primary">Medium</button>
              <button class="tf-btn tf-btn--primary tf-btn--lg">Large</button>
            </div>
          </div>
        </div>
      </section>

      <!-- ICON BUTTONS -->
      <section id="icon-buttons" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Actions</span>
            <h2 class="bc-sec-title">Icon buttons</h2>
          </div>
          <p class="bc-sec-note">
            Compact actions for toolbars and card corners. Solid, soft, outline, and ghost variants.
          </p>
        </div>
        <div class="bc-demo">
          <div class="bc-row">
            <button class="tf-icon-btn tf-icon-btn--solid" title="Save">
              <i class="pi pi-heart"></i>
            </button>
            <button class="tf-icon-btn tf-icon-btn--soft" title="Save">
              <i class="pi pi-heart"></i>
            </button>
            <button class="tf-icon-btn tf-icon-btn--outline" title="Save">
              <i class="pi pi-heart"></i>
            </button>
            <button class="tf-icon-btn tf-icon-btn--ghost" title="Share">
              <i class="pi pi-share-alt"></i>
            </button>
            <button class="tf-icon-btn tf-icon-btn--outline tf-icon-btn--sm" title="Save">
              <i class="pi pi-heart" style="font-size: 14px"></i>
            </button>
            <button class="tf-icon-btn tf-icon-btn--solid tf-icon-btn--lg" title="Save">
              <i class="pi pi-heart" style="font-size: 20px"></i>
            </button>
          </div>
        </div>
      </section>

      <!-- BADGES -->
      <section id="badges" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Status</span>
            <h2 class="bc-sec-title">Badges</h2>
          </div>
          <p class="bc-sec-note">
            Small status and count pills across brand and semantic tones, soft or solid.
          </p>
        </div>
        <div class="bc-demo">
          <div class="bc-group">
            <div class="bc-label">Soft</div>
            <div class="bc-row">
              <span class="tf-badge tf-badge--brand"><span class="tf-badge-dot"></span>Live</span>
              <span class="tf-badge tf-badge--accent">Saved</span>
              <span class="tf-badge tf-badge--gold">Must-do</span>
              <span class="tf-badge tf-badge--success"
                ><span class="tf-badge-dot"></span>Booked</span
              >
              <span class="tf-badge tf-badge--warning">Pending</span>
              <span class="tf-badge tf-badge--danger">Sold out</span>
              <span class="tf-badge tf-badge--neutral">Draft</span>
            </div>
          </div>
          <div class="bc-group">
            <div class="bc-label">Solid</div>
            <div class="bc-row">
              <span class="tf-badge tf-badge--brand tf-badge--solid">3 stops</span>
              <span class="tf-badge tf-badge--accent tf-badge--solid">Day 3</span>
              <span class="tf-badge tf-badge--gold tf-badge--solid">Featured</span>
              <span class="tf-badge tf-badge--success tf-badge--solid">Confirmed</span>
              <span class="tf-badge tf-badge--danger tf-badge--solid">Cancelled</span>
            </div>
          </div>
        </div>
      </section>

      <!-- SURFACES -->
      <section id="surfaces" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Surfaces</span>
            <h2 class="bc-sec-title">Cards & avatars</h2>
          </div>
          <p class="bc-sec-note">
            Raised paper, hairline border, soft warm shadow. Interactive cards lift on hover.
          </p>
        </div>
        <div class="bc-demo">
          <div class="bc-row" style="align-items: stretch">
            <!-- Interactive card -->
            <div class="tf-card tf-card--interactive" style="width: 280px">
              <div
                style="
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  margin-bottom: 10px;
                "
              >
                <span class="tf-eyebrow" style="color: var(--accent)">Day 3 · Kyoto</span>
                <span class="tf-badge tf-badge--gold">Must-do</span>
              </div>
              <h3 style="margin: 0 0 6px">Arashiyama grove</h3>
              <p class="text-sm text-muted" style="margin: 0 0 14px">
                Sunrise walk before the crowds, then matcha by the river.
              </p>
              <button class="tf-btn tf-btn--soft tf-btn--sm">
                Open <span class="tf-btn-arrow">&rarr;</span>
              </button>
            </div>

            <!-- Booking card -->
            <div class="tf-card" style="width: 280px">
              <span class="tf-eyebrow" style="color: var(--accent)">Booking</span>
              <h3 style="margin: 10px 0 6px">BCN &rarr; NRT</h3>
              <div
                style="
                  font: var(--fw-medium) 14px/1.4 var(--font-mono);
                  color: var(--brand);
                  margin-bottom: 10px;
                "
              >
                TRIPY-8KQ2
              </div>
              <span class="tf-badge tf-badge--success"
                ><span class="tf-badge-dot"></span>Confirmed</span
              >
            </div>

            <!-- Avatars card -->
            <div
              class="tf-card"
              style="
                width: 280px;
                display: flex;
                flex-direction: column;
                gap: 14px;
                justify-content: center;
              "
            >
              <div class="bc-label" style="margin: 0">Avatars</div>
              <div class="bc-row">
                <div
                  class="tf-avatar tf-avatar--xl"
                  style="background: var(--coral-200); color: var(--coral-700)"
                >
                  MO
                </div>
                <div
                  class="tf-avatar tf-avatar--lg"
                  style="background: var(--teal-100); color: var(--teal-700)"
                >
                  KS
                </div>
                <div
                  class="tf-avatar tf-avatar--md"
                  style="background: var(--gold-100); color: var(--gold-500)"
                >
                  AL
                </div>
                <div
                  class="tf-avatar tf-avatar--sm"
                  style="background: var(--ink-200); color: var(--ink-700)"
                >
                  L
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- FORMS -->
      <section id="forms" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Forms</span>
            <h2 class="bc-sec-title">Inputs, select, checkbox & switch</h2>
          </div>
          <p class="bc-sec-note">
            Focus shows the coral ring; error flips to danger styling. Helper text under each field.
          </p>
        </div>
        <div class="bc-demo">
          <div class="bc-cols-2">
            <div class="bc-stack">
              <div class="tf-field">
                <label>Destination</label>
                <input type="text" class="tf-input" placeholder="Where to?" />
                <span class="tf-helper">City or airport code</span>
              </div>
              <div class="tf-field">
                <label>Email</label>
                <input type="email" class="tf-input tf-input--error" value="hey@trip" />
                <span class="tf-helper tf-helper--error">That doesn't look right</span>
              </div>
              <div class="tf-field">
                <label>Trip pace</label>
                <select class="tf-select">
                  <option value="" disabled selected>Choose a pace</option>
                  <option>Relaxed</option>
                  <option>Balanced</option>
                  <option>Packed</option>
                </select>
              </div>
            </div>
            <div class="bc-stack">
              <div>
                <div class="bc-label">Checkbox</div>
                <label class="tf-check"
                  ><input type="checkbox" checked /><span>Add travel insurance</span></label
                >
                <span class="tf-helper" style="margin-left: 28px"
                  >Recommended for international trips</span
                >
                <label class="tf-check"
                  ><input type="checkbox" /><span>Email me daily plans</span></label
                >
              </div>
              <div>
                <div class="bc-label">Switch</div>
                <label class="tf-switch"
                  ><input type="checkbox" checked /><span class="tf-switch-track"></span
                  ><span>Auto-sync bookings</span></label
                >
                <label class="tf-switch"
                  ><input type="checkbox" /><span class="tf-switch-track"></span
                  ><span>Offline maps</span></label
                >
                <label class="tf-switch tf-switch--disabled"
                  ><input type="checkbox" disabled /><span class="tf-switch-track"></span
                  ><span>Disabled</span></label
                >
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- NAVIGATION -->
      <section id="nav" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Navigation</span>
            <h2 class="bc-sec-title">Tabs & segmented control</h2>
          </div>
          <p class="bc-sec-note">
            For switching views. Active tab gets the coral underline; segments lift onto a white
            pill.
          </p>
        </div>
        <div class="bc-demo">
          <div class="bc-group">
            <div class="bc-label">Tabs</div>
            <div class="tf-tabs">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                class="tf-tab"
                :class="{ 'tf-tab--active': activeTab === tab.id }"
                @click="activeTab = tab.id"
              >
                {{ tab.label }}
                <span v-if="tab.badge" class="tf-tab-badge">{{ tab.badge }}</span>
              </button>
            </div>
          </div>
          <div class="bc-group">
            <div class="bc-label">Segmented control</div>
            <div class="bc-row">
              <div class="tf-segmented">
                <button
                  v-for="opt in ['List', 'Map', 'Calendar']"
                  :key="opt"
                  class="tf-seg-btn"
                  :class="{ 'tf-seg-btn--active': activeSeg === opt }"
                  @click="activeSeg = opt"
                >
                  {{ opt }}
                </button>
              </div>
              <div class="tf-segmented tf-segmented--sm">
                <button
                  v-for="opt in ['Day', 'Week']"
                  :key="opt"
                  class="tf-seg-btn"
                  :class="{ 'tf-seg-btn--active': activeSegSm === opt }"
                  @click="activeSegSm = opt"
                >
                  {{ opt }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- FEEDBACK -->
      <section id="feedback" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Feedback</span>
            <h2 class="bc-sec-title">Alerts & toasts</h2>
          </div>
          <p class="bc-sec-note">
            Inline banners for status in context; floating toasts for transient confirmations.
          </p>
        </div>
        <div class="bc-demo">
          <div class="bc-cols-2">
            <div class="bc-stack">
              <div class="tf-alert tf-alert--success">
                <div class="tf-alert-title">Flight confirmed</div>
                <div class="tf-alert-body">Your BCN &rarr; NRT booking is saved to Day 1.</div>
              </div>
              <div class="tf-alert tf-alert--warning">
                <div class="tf-alert-title">Layover is tight</div>
                <div class="tf-alert-body">Only 45 min in Doha — consider a later connection.</div>
              </div>
              <div class="tf-alert tf-alert--danger">
                <div class="tf-alert-title">Hotel sold out</div>
              </div>
              <div class="tf-alert tf-alert--info">
                <div class="tf-alert-title">Tip</div>
                <div class="tf-alert-body">Book 3 months ahead for the best fares.</div>
              </div>
            </div>
            <div class="bc-stack">
              <div class="tf-toast">
                <div class="tf-toast-icon" style="color: var(--success-500)">
                  <i class="pi pi-check-circle"></i>
                </div>
                <div class="tf-toast-content">
                  <b>Saved to Kyoto</b>
                  <span class="text-sm text-muted">Added to Day 3 · 14:00</span>
                </div>
              </div>
              <div class="tf-toast">
                <div class="tf-toast-icon" style="color: var(--brand)">
                  <i class="pi pi-share-alt"></i>
                </div>
                <div class="tf-toast-content">
                  <b>Trip shared</b>
                  <span class="text-sm text-muted">Mara can now view & edit.</span>
                </div>
                <button
                  class="tf-btn tf-btn--soft tf-btn--sm"
                  style="margin-left: auto; flex-shrink: 0"
                >
                  Copy link
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <footer class="bc-footer">
      <div class="bc-wrap">
        <span
          style="
            font: var(--fw-bold) var(--text-lg)/1 var(--font-display);
            color: var(--text-strong);
          "
          >Tripyfull</span
        >
        <router-link
          to="/styleguide"
          style="font: var(--fw-medium) var(--text-sm)/1 var(--font-sans); color: var(--text-link)"
          >Style guide</router-link
        >
        <span class="text-xs" style="font-family: var(--font-mono); color: var(--text-subtle)"
          >Components 2026</span
        >
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const activeTab = ref('itin');
const tabs = [
  { id: 'itin', label: 'Itinerary' },
  { id: 'book', label: 'Bookings', badge: 4 },
  { id: 'map', label: 'Map' },
  { id: 'budget', label: 'Budget' },
];
const activeSeg = ref('List');
const activeSegSm = ref('Day');
</script>

<style scoped>
.bc {
  background: var(--surface-page);
  min-height: 100vh;
}

/* Hero */
.bc-hero {
  background: var(--wash-warm);
  border-bottom: 1px solid var(--border-subtle);
}
.bc-hero-in {
  max-width: 1080px;
  margin: 0 auto;
  padding: 72px var(--gutter) 60px;
}
.bc-hero h1 {
  font: var(--fw-bold) clamp(40px, 7vw, 72px)/1 var(--font-display);
  letter-spacing: -0.035em;
  color: var(--text-strong);
  margin: 16px 0 0;
}
.bc-hero p {
  font: var(--fw-regular) var(--text-md)/1.6 var(--font-sans);
  color: var(--text-body);
  max-width: 540px;
  margin: 20px 0 0;
}

.bc-wrap {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 var(--gutter);
}

/* Nav */
.bc-nav {
  position: sticky;
  top: 56px;
  z-index: 30;
  background: rgba(251, 245, 236, 0.88);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-subtle);
  padding: 12px var(--gutter);
  max-width: 1080px;
  margin: 0 auto;
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}
.bc-nav a {
  font: var(--fw-medium) var(--text-sm)/1 var(--font-sans);
  color: var(--text-muted);
  text-decoration: none;
}
.bc-nav a:hover {
  color: var(--brand);
}

/* Sections */
.bc-block {
  padding: 56px 0 8px;
  border-top: 1px solid var(--border-subtle);
}
.bc-block:first-of-type {
  border-top: none;
}
.bc-sec-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}
.bc-sec-title {
  font: var(--fw-bold) var(--text-xl)/1.05 var(--font-display);
  letter-spacing: -0.02em;
  color: var(--text-strong);
  margin: 10px 0 0;
}
.bc-sec-note {
  font: var(--fw-regular) var(--text-sm)/1.5 var(--font-sans);
  color: var(--text-muted);
  max-width: 420px;
}

/* Demo area */
.bc-demo {
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 28px;
}
.bc-row {
  display: flex;
  gap: 14px;
  align-items: center;
  flex-wrap: wrap;
}
.bc-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.bc-label {
  font: var(--fw-medium) var(--text-2xs)/1 var(--font-mono);
  letter-spacing: var(--ls-caps);
  text-transform: uppercase;
  color: var(--text-subtle);
  margin-bottom: 12px;
}
.bc-group {
  margin-top: 24px;
}
.bc-group:first-child {
  margin-top: 0;
}
.bc-cols-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: start;
}
@media (max-width: 720px) {
  .bc-cols-2 {
    grid-template-columns: 1fr;
  }
}

/* ── COMPONENT STYLES ── */

/* Buttons */
.tf-btn {
  font: var(--fw-semibold) var(--text-sm)/1 var(--font-sans);
  padding: 10px 22px;
  border-radius: var(--radius-pill);
  border: none;
  cursor: pointer;
  transition: all var(--dur-base) var(--ease-out);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.tf-btn:active {
  transform: scale(0.97);
}
.tf-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.tf-btn--primary {
  background: var(--brand);
  color: var(--brand-on);
  box-shadow: var(--shadow-brand);
}
.tf-btn--primary:hover:not(:disabled) {
  background: var(--brand-hover);
  filter: brightness(1.05);
}
.tf-btn--accent {
  background: var(--accent);
  color: var(--accent-on);
}
.tf-btn--accent:hover {
  background: var(--accent-hover);
}
.tf-btn--secondary {
  background: var(--surface-sunken);
  color: var(--text-body);
}
.tf-btn--secondary:hover {
  background: var(--ink-200);
}
.tf-btn--soft {
  background: var(--brand-soft);
  color: var(--brand);
}
.tf-btn--soft:hover {
  background: var(--coral-100);
}
.tf-btn--ghost {
  background: transparent;
  color: var(--text-muted);
}
.tf-btn--ghost:hover {
  background: var(--surface-sunken);
  color: var(--text-body);
}
.tf-btn--sm {
  padding: 7px 16px;
  font-size: var(--text-xs);
}
.tf-btn--lg {
  padding: 14px 28px;
  font-size: var(--text-base);
}
.tf-btn-arrow {
  font-size: 1.1em;
}

/* Icon buttons */
.tf-icon-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--dur-base) var(--ease-out);
  font-size: 18px;
}
.tf-icon-btn:active {
  transform: scale(0.92);
}
.tf-icon-btn--solid {
  background: var(--brand);
  color: var(--brand-on);
  box-shadow: var(--shadow-brand);
}
.tf-icon-btn--solid:hover {
  filter: brightness(1.08);
}
.tf-icon-btn--soft {
  background: var(--brand-soft);
  color: var(--brand);
}
.tf-icon-btn--soft:hover {
  background: var(--coral-100);
}
.tf-icon-btn--outline {
  background: transparent;
  color: var(--text-muted);
  border: 1.5px solid var(--border-default);
}
.tf-icon-btn--outline:hover {
  border-color: var(--brand);
  color: var(--brand);
  background: var(--brand-soft);
}
.tf-icon-btn--ghost {
  background: transparent;
  color: var(--text-muted);
}
.tf-icon-btn--ghost:hover {
  background: var(--surface-sunken);
  color: var(--text-body);
}
.tf-icon-btn--sm {
  width: 32px;
  height: 32px;
  font-size: 14px;
}
.tf-icon-btn--lg {
  width: 48px;
  height: 48px;
  font-size: 22px;
}

/* Badges */
.tf-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: var(--radius-pill);
  font: var(--fw-semibold) var(--text-xs)/1 var(--font-sans);
}
.tf-badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.tf-badge--brand {
  background: var(--brand-soft);
  color: var(--brand);
}
.tf-badge--accent {
  background: var(--accent-soft);
  color: var(--accent);
}
.tf-badge--gold {
  background: var(--gold-50);
  color: var(--gold-500);
}
.tf-badge--success {
  background: var(--success-100);
  color: var(--success-500);
}
.tf-badge--warning {
  background: var(--warning-100);
  color: var(--warning-500);
}
.tf-badge--danger {
  background: var(--danger-100);
  color: var(--danger-500);
}
.tf-badge--neutral {
  background: var(--surface-sunken);
  color: var(--text-muted);
}
.tf-badge--solid.tf-badge--brand {
  background: var(--brand);
  color: var(--brand-on);
}
.tf-badge--solid.tf-badge--accent {
  background: var(--accent);
  color: var(--accent-on);
}
.tf-badge--solid.tf-badge--gold {
  background: var(--gold-300);
  color: var(--ink-900);
}
.tf-badge--solid.tf-badge--success {
  background: var(--success-500);
  color: #fff;
}
.tf-badge--solid.tf-badge--danger {
  background: var(--danger-500);
  color: #fff;
}

/* Cards */
.tf-card {
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 22px;
}
.tf-card--interactive {
  cursor: pointer;
  transition: all var(--dur-base) var(--ease-out);
}
.tf-card--interactive:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
}

/* Avatars */
.tf-avatar {
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font: var(--fw-semibold) var(--text-xs)/1 var(--font-sans);
}
.tf-avatar--sm {
  width: 28px;
  height: 28px;
  font-size: 10px;
}
.tf-avatar--md {
  width: 36px;
  height: 36px;
}
.tf-avatar--lg {
  width: 44px;
  height: 44px;
  font-size: var(--text-sm);
}
.tf-avatar--xl {
  width: 56px;
  height: 56px;
  font-size: var(--text-base);
}

/* Forms */
.tf-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.tf-field label {
  font: var(--fw-semibold) var(--text-sm)/1 var(--font-sans);
  color: var(--text-muted);
}
.tf-input {
  font: var(--fw-regular) var(--text-sm)/1.4 var(--font-sans);
  padding: 10px 14px;
  border: 1.5px solid var(--field-border);
  border-radius: var(--radius-md);
  background: var(--field-bg);
  color: var(--text-body);
  outline: none;
  transition:
    border-color var(--dur-base),
    box-shadow var(--dur-base);
}
.tf-input::placeholder {
  color: var(--field-placeholder);
}
.tf-input:focus {
  border-color: var(--border-focus);
  box-shadow: var(--ring-brand);
}
.tf-input--error {
  border-color: var(--danger-500);
}
.tf-input--error:focus {
  box-shadow: 0 0 0 3px rgba(210, 63, 44, 0.2);
}
.tf-helper {
  font: var(--fw-regular) var(--text-xs)/1.3 var(--font-sans);
  color: var(--text-subtle);
}
.tf-helper--error {
  color: var(--danger-500);
}
.tf-select {
  font: var(--fw-regular) var(--text-sm)/1.4 var(--font-sans);
  padding: 10px 14px;
  border: 1.5px solid var(--field-border);
  border-radius: var(--radius-md);
  background: var(--field-bg);
  color: var(--text-body);
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%238c8077' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  padding-right: 36px;
}
.tf-select:focus {
  border-color: var(--border-focus);
  box-shadow: var(--ring-brand);
}
.tf-check {
  display: flex;
  align-items: center;
  gap: 10px;
  font: var(--fw-regular) var(--text-sm)/1 var(--font-sans);
  color: var(--text-body);
  cursor: pointer;
  padding: 6px 0;
}
.tf-check input {
  accent-color: var(--brand);
  width: 18px;
  height: 18px;
  cursor: pointer;
}
.tf-switch {
  display: flex;
  align-items: center;
  gap: 12px;
  font: var(--fw-regular) var(--text-sm)/1 var(--font-sans);
  color: var(--text-body);
  cursor: pointer;
  padding: 6px 0;
}
.tf-switch input {
  display: none;
}
.tf-switch-track {
  width: 40px;
  height: 22px;
  background: var(--ink-300);
  border-radius: var(--radius-pill);
  position: relative;
  transition: background var(--dur-base);
  flex-shrink: 0;
}
.tf-switch-track::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  transition: transform var(--dur-base) var(--ease-out);
  box-shadow: var(--shadow-xs);
}
.tf-switch input:checked + .tf-switch-track {
  background: var(--brand);
}
.tf-switch input:checked + .tf-switch-track::after {
  transform: translateX(18px);
}
.tf-switch--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Tabs */
.tf-tabs {
  display: flex;
  border-bottom: 2px solid var(--border-subtle);
  gap: 0;
}
.tf-tab {
  padding: 12px 18px;
  border: none;
  background: none;
  font: var(--fw-medium) var(--text-sm)/1 var(--font-sans);
  color: var(--text-muted);
  cursor: pointer;
  position: relative;
  transition: color var(--dur-base);
  display: flex;
  align-items: center;
  gap: 8px;
}
.tf-tab:hover {
  color: var(--text-strong);
}
.tf-tab--active {
  color: var(--brand);
  font-weight: var(--fw-semibold);
}
.tf-tab--active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--brand);
  border-radius: 2px 2px 0 0;
}
.tf-tab-badge {
  font: var(--fw-semibold) var(--text-2xs)/1 var(--font-mono);
  background: var(--brand-soft);
  color: var(--brand);
  padding: 2px 7px;
  border-radius: var(--radius-pill);
}

/* Segmented control */
.tf-segmented {
  display: inline-flex;
  background: var(--surface-sunken);
  border-radius: var(--radius-pill);
  padding: 4px;
  gap: 2px;
}
.tf-seg-btn {
  padding: 8px 18px;
  border: none;
  background: none;
  border-radius: var(--radius-pill);
  font: var(--fw-medium) var(--text-sm)/1 var(--font-sans);
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--dur-base) var(--ease-out);
}
.tf-seg-btn:hover {
  color: var(--text-body);
}
.tf-seg-btn--active {
  background: var(--white);
  color: var(--text-strong);
  font-weight: var(--fw-semibold);
  box-shadow: var(--shadow-sm);
}
.tf-segmented--sm .tf-seg-btn {
  padding: 6px 14px;
  font-size: var(--text-xs);
}

/* Alerts */
.tf-alert {
  padding: 14px 18px;
  border-radius: var(--radius-md);
  border-left: 3px solid;
}
.tf-alert-title {
  font: var(--fw-semibold) var(--text-sm)/1.3 var(--font-sans);
  color: var(--text-strong);
  margin-bottom: 4px;
}
.tf-alert-body {
  font: var(--fw-regular) var(--text-sm)/1.5 var(--font-sans);
  color: var(--text-body);
}
.tf-alert--success {
  background: var(--success-100);
  border-color: var(--success-500);
}
.tf-alert--success .tf-alert-title {
  color: var(--success-500);
}
.tf-alert--warning {
  background: var(--warning-100);
  border-color: var(--warning-500);
}
.tf-alert--warning .tf-alert-title {
  color: var(--warning-500);
}
.tf-alert--danger {
  background: var(--danger-100);
  border-color: var(--danger-500);
}
.tf-alert--danger .tf-alert-title {
  color: var(--danger-500);
}
.tf-alert--info {
  background: var(--info-100);
  border-color: var(--info-500);
}
.tf-alert--info .tf-alert-title {
  color: var(--info-500);
}

/* Toasts */
.tf-toast {
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 14px 18px;
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  gap: 12px;
}
.tf-toast-icon {
  font-size: 20px;
  flex-shrink: 0;
}
.tf-toast-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.tf-toast-content b {
  font: var(--fw-semibold) var(--text-sm)/1.3 var(--font-sans);
  color: var(--text-strong);
}

/* Footer */
.bc-footer {
  padding: 48px var(--gutter) 72px;
  border-top: 1px solid var(--border-subtle);
  margin-top: 48px;
}
.bc-footer .bc-wrap {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1080px;
  margin: 0 auto;
}
</style>
