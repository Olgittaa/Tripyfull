<template>
  <div class="sg">
    <!-- Hero -->
    <div class="sg-hero">
      <div class="sg-hero-in">
        <span class="tf-eyebrow">The ultimate full-trip experience</span>
        <h1>The Tripyfull<br>style guide</h1>
        <p>Everything that makes Tripyfull feel like Tripyfull — the warm sun-soaked palette, the friendly display type, the boarding-pass details, and the calm, well-travelled voice.</p>
      </div>
    </div>

    <div class="sg-wrap">
      <!-- NAV -->
      <nav class="sg-nav">
        <a href="#color">Color</a>
        <a href="#type">Type</a>
        <a href="#space">Spacing</a>
        <a href="#elevation">Elevation</a>
        <a href="#buttons">Buttons</a>
        <a href="#forms">Forms</a>
        <a href="#cards">Cards</a>
        <a href="#feedback">Feedback</a>
        <a href="#voice">Voice</a>
      </nav>

      <!-- ESSENCE -->
      <section class="sg-section">
        <span class="tf-eyebrow">Brand essence</span>
        <h2 class="sg-title">Warm, complete, in order</h2>
        <p class="sg-lead">Tripyfull blends the excitement of a trip with the satisfaction of being <em>full</em> — an itinerary that's packed yet perfectly organized.</p>
        <div class="sg-grid sg-cols-3">
          <div class="sg-card">
            <span class="tf-eyebrow" style="color:var(--accent)">01 — Sun-soaked</span>
            <h3 style="margin:10px 0 6px">Warm, never cold</h3>
            <p class="text-sm text-muted" style="margin:0">Cream paper, sunset coral, ocean teal, golden hour. No clinical white, no bluish grey.</p>
          </div>
          <div class="sg-card">
            <span class="tf-eyebrow" style="color:var(--accent)">02 — Full & tidy</span>
            <h3 style="margin:10px 0 6px">Packed, in order</h3>
            <p class="text-sm text-muted" style="margin:0">Generous spacing and rounded, ticket-like shapes make a busy trip feel effortless.</p>
          </div>
          <div class="sg-card">
            <span class="tf-eyebrow" style="color:var(--accent)">03 — Well-travelled</span>
            <h3 style="margin:10px 0 6px">Calm & confident</h3>
            <p class="text-sm text-muted" style="margin:0">A friend who's already done the planning — reassuring, lightly playful, never frantic.</p>
          </div>
        </div>
      </section>

      <!-- COLOR -->
      <section id="color" class="sg-section">
        <span class="tf-eyebrow">Color</span>
        <h2 class="sg-title">A sunset over the ocean</h2>
        <p class="sg-lead">Coral is the sunset — the single hero action color. Teal is the ocean — links and calm accents. Gold is golden hour — a spark for highlights. The canvas is warm paper, never pure white.</p>

        <div class="sg-grid sg-cols-4" style="margin-bottom:24px">
          <div>
            <div class="sg-swatch" style="background:var(--coral-500)"><span style="color:#fff">#e35a38</span></div>
            <div class="sg-swatch-label"><b>Coral</b><code>--brand</code></div>
          </div>
          <div>
            <div class="sg-swatch" style="background:var(--teal-500)"><span style="color:#fff">#0e5c55</span></div>
            <div class="sg-swatch-label"><b>Teal</b><code>--accent</code></div>
          </div>
          <div>
            <div class="sg-swatch" style="background:var(--gold-300)"><span style="color:var(--ink-900)">#f4ad3c</span></div>
            <div class="sg-swatch-label"><b>Gold</b><code>--highlight</code></div>
          </div>
          <div>
            <div class="sg-swatch" style="background:var(--paper);border:1px solid var(--border-subtle)"><span style="color:var(--ink-700)">#fbf5ec</span></div>
            <div class="sg-swatch-label"><b>Paper</b><code>--surface-page</code></div>
          </div>
        </div>

        <!-- Ramps -->
        <div class="sg-card" style="margin-bottom:16px">
          <div class="sg-ramp-label">Coral</div>
          <div class="sg-ramp">
            <div v-for="s in coralSteps" :key="s.n" class="sg-ramp-step" :style="{background:s.bg,color:s.fg}">{{s.n}}</div>
          </div>
          <div class="sg-ramp-label" style="margin-top:16px">Teal</div>
          <div class="sg-ramp">
            <div v-for="s in tealSteps" :key="s.n" class="sg-ramp-step" :style="{background:s.bg,color:s.fg}">{{s.n}}</div>
          </div>
          <div class="sg-ramp-label" style="margin-top:16px">Warm neutrals</div>
          <div class="sg-ramp">
            <div v-for="s in inkSteps" :key="s.n" class="sg-ramp-step" :style="{background:s.bg,color:s.fg}">{{s.n}}</div>
          </div>
        </div>

        <!-- Semantic + washes -->
        <div class="sg-grid sg-cols-2">
          <div class="sg-card">
            <div class="sg-ramp-label">Semantic feedback</div>
            <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:10px">
              <span class="sg-chip" style="background:var(--success-100);color:var(--success-500)">Success</span>
              <span class="sg-chip" style="background:var(--warning-100);color:var(--warning-500)">Warning</span>
              <span class="sg-chip" style="background:var(--danger-100);color:var(--danger-500)">Danger</span>
              <span class="sg-chip" style="background:var(--info-100);color:var(--info-500)">Info</span>
            </div>
          </div>
          <div class="sg-card">
            <div class="sg-ramp-label">Decorative washes</div>
            <div style="display:flex;gap:10px;margin-top:10px">
              <div style="flex:1;height:54px;border-radius:var(--radius-md);background:var(--wash-warm)"></div>
              <div style="flex:1;height:54px;border-radius:var(--radius-md);background:var(--wash-dusk)"></div>
              <div style="flex:1;height:54px;border-radius:var(--radius-md);background:var(--wash-ocean)"></div>
            </div>
          </div>
        </div>

        <div class="sg-grid sg-cols-2" style="margin-top:16px">
          <div class="sg-do">Do: One coral primary action per view; teal for secondary; gold only as a small spark.</div>
          <div class="sg-dont">Don't: Bluish-purple gradients, pure-grey neutrals, or large fields of gold.</div>
        </div>
      </section>

      <!-- TYPE -->
      <section id="type" class="sg-section">
        <span class="tf-eyebrow">Typography</span>
        <h2 class="sg-title">Confident display, calm body</h2>
        <p class="sg-lead">Bricolage Grotesque for headlines; Hanken Grotesk for body/UI; JetBrains Mono for codes, times, and stamps.</p>

        <div class="sg-grid sg-cols-3" style="margin-bottom:20px">
          <div class="sg-card">
            <div class="sg-ramp-label">Display</div>
            <div style="font:var(--fw-bold) 48px/1 var(--font-display);letter-spacing:-0.03em;color:var(--text-strong);margin:10px 0 4px">Aa</div>
            <div style="font:var(--fw-semibold) 20px/1.1 var(--font-display);color:var(--text-strong)">Pack it full</div>
            <code class="text-xs text-muted" style="display:block;margin-top:6px">Bricolage Grotesque 600-700</code>
          </div>
          <div class="sg-card">
            <div class="sg-ramp-label">Body / UI</div>
            <div style="font:var(--fw-regular) 48px/1 var(--font-sans);color:var(--text-strong);margin:10px 0 4px">Aa</div>
            <div style="font:var(--fw-regular) 16px/1.5 var(--font-sans);color:var(--text-body)">Every booking, beautifully in one place.</div>
            <code class="text-xs text-muted" style="display:block;margin-top:6px">Hanken Grotesk 300-700</code>
          </div>
          <div class="sg-card">
            <div class="sg-ramp-label">Mono</div>
            <div style="font:var(--fw-medium) 48px/1 var(--font-mono);color:var(--text-strong);margin:10px 0 4px">Aa</div>
            <div style="font:var(--fw-medium) 14px/1.4 var(--font-mono);color:var(--text-body)">TRIPY-8KQ2 · 13h 40m</div>
            <code class="text-xs text-muted" style="display:block;margin-top:6px">JetBrains Mono 400-700</code>
          </div>
        </div>

        <div class="sg-card">
          <div class="sg-ramp-label" style="margin-bottom:8px">Type scale</div>
          <div v-for="t in typeScale" :key="t.token" class="sg-spec-row">
            <span class="sg-spec-token">{{ t.token }}</span>
            <span :style="t.style">{{ t.sample }}</span>
          </div>
        </div>
      </section>

      <!-- SPACING -->
      <section id="space" class="sg-section">
        <span class="tf-eyebrow">Spacing & shape</span>
        <h2 class="sg-title">A 4px grid, generous radii</h2>
        <p class="sg-lead">Buttons, badges, chips and avatars are fully pill-shaped — the boarding-pass language at the heart of the system.</p>

        <div class="sg-grid sg-cols-2">
          <div class="sg-card">
            <div class="sg-ramp-label">Spacing scale</div>
            <div style="display:flex;align-items:flex-end;gap:12px;margin-top:12px">
              <div v-for="s in spacingBars" :key="s" style="text-align:center">
                <div :style="{width:'24px',height:s+'px',background:'var(--coral-300)',borderRadius:'3px'}"></div>
                <code class="text-xs text-muted" style="display:block;margin-top:6px">{{s}}</code>
              </div>
            </div>
          </div>
          <div class="sg-card">
            <div class="sg-ramp-label">Corner radii</div>
            <div style="display:flex;align-items:flex-end;gap:14px;margin-top:12px">
              <div v-for="r in radii" :key="r.label" style="text-align:center">
                <div :style="{width:'56px',height:'56px',background:'var(--paper)',border:'1.5px solid var(--border-default)',borderRadius:r.val}"></div>
                <code class="text-xs text-muted" style="display:block;margin-top:8px">{{r.label}}</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ELEVATION -->
      <section id="elevation" class="sg-section">
        <span class="tf-eyebrow">Elevation</span>
        <h2 class="sg-title">Warm shadows, never grey</h2>
        <p class="sg-lead">Every shadow casts warm ink <code style="font:var(--text-sm) var(--font-mono);color:var(--brand)">rgba(33,27,23,...)</code> — never neutral grey. Primary buttons carry a coral glow.</p>
        <div class="sg-grid sg-cols-4">
          <div v-for="sh in shadows" :key="sh.name" style="text-align:center">
            <div :style="{height:'80px',background:'var(--surface-card)',borderRadius:'var(--radius-md)',boxShadow:sh.val}"></div>
            <code class="text-xs text-muted" style="display:block;margin-top:10px">{{sh.name}}</code>
          </div>
        </div>
      </section>

      <!-- BUTTONS -->
      <section id="buttons" class="sg-section">
        <span class="tf-eyebrow">Actions</span>
        <h2 class="sg-title">Buttons</h2>
        <p class="sg-lead">Pill-shaped. One coral primary per view; teal accent for everything secondary.</p>
        <div class="sg-card">
          <div class="sg-ramp-label">Variants</div>
          <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:10px">
            <button class="tf-btn tf-btn--primary">Plan my trip</button>
            <button class="tf-btn tf-btn--accent">Add booking</button>
            <button class="tf-btn tf-btn--secondary">Details</button>
            <button class="tf-btn tf-btn--soft">Saved</button>
            <button class="tf-btn tf-btn--ghost">Cancel</button>
            <button class="tf-btn tf-btn--primary" disabled>Disabled</button>
          </div>
          <div class="sg-ramp-label" style="margin-top:20px">Sizes</div>
          <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:10px">
            <button class="tf-btn tf-btn--primary tf-btn--sm">Small</button>
            <button class="tf-btn tf-btn--primary">Medium</button>
            <button class="tf-btn tf-btn--primary tf-btn--lg">Large</button>
          </div>
        </div>
      </section>

      <!-- FORMS -->
      <section id="forms" class="sg-section">
        <span class="tf-eyebrow">Forms</span>
        <h2 class="sg-title">Inputs & controls</h2>
        <p class="sg-lead">Focus shows the coral ring; error flips to danger styling.</p>
        <div class="sg-card">
          <div class="sg-grid sg-cols-2">
            <div>
              <div class="sg-field">
                <label>Destination</label>
                <input type="text" class="tf-input" placeholder="Where to?">
                <span class="tf-helper">City or airport code</span>
              </div>
              <div class="sg-field">
                <label>Email</label>
                <input type="email" class="tf-input tf-input--error" value="hey@trip">
                <span class="tf-helper tf-helper--error">That doesn't look right</span>
              </div>
              <div class="sg-field">
                <label>Trip pace</label>
                <select class="tf-select">
                  <option>Relaxed</option>
                  <option>Balanced</option>
                  <option>Packed</option>
                </select>
              </div>
            </div>
            <div>
              <div class="sg-ramp-label">Checkboxes</div>
              <label class="tf-check"><input type="checkbox" checked><span>Add travel insurance</span></label>
              <label class="tf-check"><input type="checkbox"><span>Email me daily plans</span></label>
              <div class="sg-ramp-label" style="margin-top:20px">Toggle switches</div>
              <label class="tf-switch"><input type="checkbox" checked><span class="tf-switch-track"></span><span>Auto-sync bookings</span></label>
              <label class="tf-switch"><input type="checkbox"><span class="tf-switch-track"></span><span>Offline maps</span></label>
            </div>
          </div>
        </div>
      </section>

      <!-- CARDS -->
      <section id="cards" class="sg-section">
        <span class="tf-eyebrow">Surfaces</span>
        <h2 class="sg-title">Cards</h2>
        <p class="sg-lead">Raised paper, hairline border, soft warm shadow. Interactive cards lift on hover.</p>
        <div style="display:flex;gap:16px;flex-wrap:wrap">
          <div class="sg-card sg-card--interactive" style="width:280px">
            <span class="tf-eyebrow" style="color:var(--accent)">Day 3 · Kyoto</span>
            <h3 style="margin:10px 0 6px">Arashiyama grove</h3>
            <p class="text-sm text-muted" style="margin:0 0 14px">Sunrise walk before the crowds, then matcha by the river.</p>
            <button class="tf-btn tf-btn--soft tf-btn--sm">Open</button>
          </div>
          <div class="sg-card" style="width:280px">
            <span class="tf-eyebrow" style="color:var(--accent)">Booking</span>
            <h3 style="margin:10px 0 6px">BCN → NRT</h3>
            <div style="font:var(--fw-medium) 14px/1.4 var(--font-mono);color:var(--brand);margin-bottom:8px">TRIPY-8KQ2</div>
            <span class="sg-chip" style="background:var(--success-100);color:var(--success-500)">Confirmed</span>
          </div>
          <div class="sg-card" style="width:280px;display:flex;flex-direction:column;gap:12px;justify-content:center">
            <div class="sg-ramp-label">Avatars</div>
            <div style="display:flex;gap:8px;align-items:center">
              <div class="sg-avatar sg-avatar--xl" style="background:var(--coral-200);color:var(--coral-700)">MO</div>
              <div class="sg-avatar sg-avatar--lg" style="background:var(--teal-100);color:var(--teal-700)">KS</div>
              <div class="sg-avatar sg-avatar--md" style="background:var(--gold-100);color:var(--gold-500)">AL</div>
              <div class="sg-avatar sg-avatar--sm" style="background:var(--ink-200);color:var(--ink-700)">L</div>
            </div>
          </div>
        </div>
      </section>

      <!-- FEEDBACK -->
      <section id="feedback" class="sg-section">
        <span class="tf-eyebrow">Feedback</span>
        <h2 class="sg-title">Alerts & toasts</h2>
        <div class="sg-grid sg-cols-2">
          <div style="display:flex;flex-direction:column;gap:12px">
            <div class="sg-alert sg-alert--success"><b>Flight confirmed</b><br>Your BCN → NRT booking is saved to Day 1.</div>
            <div class="sg-alert sg-alert--warning"><b>Layover is tight</b><br>Only 45 min in Doha — consider a later connection.</div>
            <div class="sg-alert sg-alert--danger"><b>Hotel sold out</b></div>
          </div>
          <div style="display:flex;flex-direction:column;gap:12px">
            <div class="sg-toast"><b>Saved to Kyoto</b><span class="text-sm text-muted">Added to Day 3 · 14:00</span></div>
            <div class="sg-toast"><b>Trip shared</b><span class="text-sm text-muted">Mara can now view & edit.</span></div>
          </div>
        </div>
      </section>

      <!-- MOTIFS -->
      <section class="sg-section">
        <span class="tf-eyebrow">Motifs</span>
        <h2 class="sg-title">Boarding-pass details</h2>
        <div class="sg-card" style="display:flex;gap:24px;align-items:center;flex-wrap:wrap">
          <span class="sg-stamp">FULLY BOOKED</span>
          <span style="font:var(--fw-bold) 18px/1 var(--font-display);color:var(--text-strong)">BCN <span style="display:inline-block;width:40px;height:2px;background:repeating-linear-gradient(90deg,var(--coral-400) 0 5px,transparent 5px 10px);vertical-align:middle;margin:0 4px"></span> NRT</span>
          <span style="font:var(--fw-medium) 14px/1 var(--font-mono);color:var(--ink-900);background:var(--gold-100);padding:8px 12px;border-radius:var(--radius-sm)">35.6586 N, 139.7454 E</span>
        </div>
      </section>

      <!-- VOICE -->
      <section id="voice" class="sg-section">
        <span class="tf-eyebrow">Voice & tone</span>
        <h2 class="sg-title">The well-travelled friend</h2>
        <p class="sg-lead">Warm, confident, calm. Sentence case everywhere. Verbs-first actions. One travel emoji max — only in celebratory confirmations.</p>
        <div class="sg-grid sg-cols-2">
          <div class="sg-card">
            <div class="sg-ramp-label" style="margin-bottom:12px">Examples</div>
            <p style="font:var(--fw-semibold) 22px/1.15 var(--font-display);color:var(--text-strong);margin:0 0 12px">"Pack it full."</p>
            <p class="text-sm text-muted" style="margin:0 0 8px"><b style="color:var(--text-body)">Toast:</b> "Saved to Kyoto — Day 3, 14:00."</p>
            <p class="text-sm text-muted" style="margin:0 0 8px"><b style="color:var(--text-body)">Empty:</b> "Nothing on Day 4 yet. Add a stop and we'll slot it in."</p>
            <p class="text-sm text-muted" style="margin:0"><b style="color:var(--text-body)">Error:</b> "That layover's tight (45 min). Want a later connection?"</p>
          </div>
          <div>
            <div class="sg-do" style="margin-bottom:12px">Do: Sentence case, "you", verbs first. Short sentences, one idea per line.</div>
            <div class="sg-dont">Don't: Title Case, hype words ("unlock", "revolutionary"), exclamation spam, or emoji in UI.</div>
          </div>
        </div>
      </section>

    </div>

    <!-- Footer -->
    <footer class="sg-footer">
      <div class="sg-wrap">
        <span style="font:var(--fw-bold) var(--text-lg)/1 var(--font-display);color:var(--text-strong)">Tripyfull</span>
        <span class="text-xs text-muted" style="font-family:var(--font-mono)">Style guide 2026</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
const coralSteps = [
  {n:'50',bg:'var(--coral-50)',fg:'var(--coral-700)'},
  {n:'100',bg:'var(--coral-100)',fg:'var(--coral-700)'},
  {n:'200',bg:'var(--coral-200)',fg:'var(--coral-800)'},
  {n:'300',bg:'var(--coral-300)',fg:'#fff'},
  {n:'400',bg:'var(--coral-400)',fg:'#fff'},
  {n:'500',bg:'var(--coral-500)',fg:'#fff'},
  {n:'600',bg:'var(--coral-600)',fg:'#fff'},
  {n:'700',bg:'var(--coral-700)',fg:'#fff'},
  {n:'800',bg:'var(--coral-800)',fg:'#fff'},
];
const tealSteps = [
  {n:'50',bg:'var(--teal-50)',fg:'var(--teal-700)'},
  {n:'100',bg:'var(--teal-100)',fg:'var(--teal-700)'},
  {n:'200',bg:'var(--teal-200)',fg:'var(--teal-800)'},
  {n:'300',bg:'var(--teal-300)',fg:'#fff'},
  {n:'400',bg:'var(--teal-400)',fg:'#fff'},
  {n:'500',bg:'var(--teal-500)',fg:'#fff'},
  {n:'600',bg:'var(--teal-600)',fg:'#fff'},
  {n:'700',bg:'var(--teal-700)',fg:'#fff'},
  {n:'800',bg:'var(--teal-800)',fg:'#fff'},
];
const inkSteps = [
  {n:'900',bg:'var(--ink-900)',fg:'#fff'},
  {n:'800',bg:'var(--ink-800)',fg:'#fff'},
  {n:'700',bg:'var(--ink-700)',fg:'#fff'},
  {n:'600',bg:'var(--ink-600)',fg:'#fff'},
  {n:'500',bg:'var(--ink-500)',fg:'#fff'},
  {n:'400',bg:'var(--ink-400)',fg:'var(--ink-900)'},
  {n:'300',bg:'var(--ink-300)',fg:'var(--ink-900)'},
  {n:'200',bg:'var(--ink-200)',fg:'var(--ink-900)'},
  {n:'100',bg:'var(--ink-100)',fg:'var(--ink-900)'},
  {n:'paper',bg:'var(--paper)',fg:'var(--ink-700)'},
];
const typeScale = [
  {token:'3xl · h1',sample:'Wander far',style:'font:var(--fw-bold) 40px/1 var(--font-display);letter-spacing:-0.02em;color:var(--text-strong)'},
  {token:'2xl · h2',sample:'Wander everywhere',style:'font:var(--fw-bold) 32px/1 var(--font-display);color:var(--text-strong)'},
  {token:'xl · h3',sample:'Plan the whole trip',style:'font:var(--fw-semibold) 26px/1 var(--font-display);color:var(--text-strong)'},
  {token:'md · lead',sample:'A relaxed lead paragraph for intros.',style:'font:var(--fw-regular) 18px/1.4 var(--font-sans);color:var(--text-body)'},
  {token:'base · body',sample:'Body copy at the default reading size.',style:'font:var(--fw-regular) 16px/1.4 var(--font-sans);color:var(--text-body)'},
  {token:'sm · small',sample:'Captions and helper text.',style:'font:var(--fw-regular) 14px/1.4 var(--font-sans);color:var(--text-muted)'},
];
const spacingBars = [4,8,16,24,32,48,64];
const radii = [
  {label:'sm 8',val:'var(--radius-sm)'},
  {label:'md 12',val:'var(--radius-md)'},
  {label:'lg 18',val:'var(--radius-lg)'},
  {label:'xl 28',val:'var(--radius-xl)'},
  {label:'pill',val:'var(--radius-pill)'},
];
const shadows = [
  {name:'shadow-xs',val:'var(--shadow-xs)'},
  {name:'shadow-sm',val:'var(--shadow-sm)'},
  {name:'shadow-md',val:'var(--shadow-md)'},
  {name:'shadow-brand',val:'var(--shadow-brand)'},
];
</script>

<style scoped>
.sg { background: var(--surface-page); min-height: 100vh; }

/* Hero */
.sg-hero { background: var(--wash-warm); border-bottom: 1px solid var(--border-subtle); }
.sg-hero-in { max-width: 1080px; margin: 0 auto; padding: 80px var(--gutter) 68px; }
.sg-hero h1 { font: var(--fw-bold) clamp(42px,7vw,72px)/0.98 var(--font-display); letter-spacing: -0.035em; color: var(--text-strong); margin: 16px 0 0; }
.sg-hero p { font: var(--fw-regular) var(--text-md)/1.6 var(--font-sans); color: var(--text-body); max-width: 540px; margin: 20px 0 0; }

.sg-wrap { max-width: 1080px; margin: 0 auto; padding: 0 var(--gutter); }

/* Nav */
.sg-nav { position: sticky; top: 56px; z-index: 30; background: rgba(251,245,236,0.88); backdrop-filter: blur(10px); border-bottom: 1px solid var(--border-subtle); padding: 12px var(--gutter); max-width: 1080px; margin: 0 auto; display: flex; gap: 20px; flex-wrap: wrap; }
.sg-nav a { font: var(--fw-medium) var(--text-sm)/1 var(--font-sans); color: var(--text-muted); text-decoration: none; }
.sg-nav a:hover { color: var(--brand); }

/* Section */
.sg-section { padding: 64px 0 8px; border-top: 1px solid var(--border-subtle); }
.sg-section:first-of-type { border-top: none; }
.sg-title { font: var(--fw-bold) var(--text-2xl)/1.05 var(--font-display); letter-spacing: -0.03em; color: var(--text-strong); margin: 12px 0 6px; }
.sg-lead { font: var(--fw-regular) var(--text-md)/1.55 var(--font-sans); color: var(--text-muted); max-width: 620px; margin: 0 0 32px; }

/* Grid */
.sg-grid { display: grid; gap: 16px; }
.sg-cols-2 { grid-template-columns: repeat(2,1fr); }
.sg-cols-3 { grid-template-columns: repeat(3,1fr); }
.sg-cols-4 { grid-template-columns: repeat(4,1fr); }
@media (max-width:760px) { .sg-cols-2,.sg-cols-3,.sg-cols-4 { grid-template-columns: 1fr 1fr; } }

/* Card */
.sg-card { background: var(--surface-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); padding: 22px; }
.sg-card--interactive { cursor: pointer; transition: all var(--dur-base) var(--ease-out); }
.sg-card--interactive:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }

/* Swatches */
.sg-swatch { border-radius: var(--radius-md); box-shadow: var(--shadow-xs); height: 88px; display: flex; align-items: flex-end; padding: 12px; }
.sg-swatch span { font: var(--fw-semibold) var(--text-xs)/1 var(--font-mono); }
.sg-swatch-label { margin-top: 10px; }
.sg-swatch-label b { display: block; font: var(--fw-semibold) var(--text-sm)/1.3 var(--font-sans); color: var(--text-strong); }
.sg-swatch-label code { font: var(--text-2xs)/1.3 var(--font-mono); color: var(--text-muted); }

/* Ramps */
.sg-ramp { display: flex; border-radius: var(--radius-md); overflow: hidden; box-shadow: var(--shadow-xs); }
.sg-ramp-step { flex: 1; height: 44px; display: flex; align-items: center; justify-content: center; font: var(--fw-medium) var(--text-2xs)/1 var(--font-mono); }
.sg-ramp-label { font: var(--fw-medium) var(--text-2xs)/1 var(--font-mono); letter-spacing: var(--ls-caps); text-transform: uppercase; color: var(--text-subtle); margin-bottom: 8px; }

/* Spec rows */
.sg-spec-row { display: flex; align-items: baseline; gap: 18px; padding: 10px 0; border-bottom: 1px dashed var(--border-subtle); }
.sg-spec-row:last-child { border-bottom: none; }
.sg-spec-token { width: 120px; flex: none; font: var(--fw-medium) var(--text-2xs)/1.4 var(--font-mono); color: var(--text-subtle); }

/* Chip */
.sg-chip { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: var(--radius-pill); font: var(--fw-semibold) var(--text-sm)/1 var(--font-sans); }

/* Do/Don't */
.sg-do { border-radius: var(--radius-md); padding: 16px 18px; font: var(--fw-regular) var(--text-sm)/1.5 var(--font-sans); background: var(--success-100); color: var(--text-body); }
.sg-dont { border-radius: var(--radius-md); padding: 16px 18px; font: var(--fw-regular) var(--text-sm)/1.5 var(--font-sans); background: var(--danger-100); color: var(--text-body); }

/* Stamp motif */
.sg-stamp { display: inline-block; border: 1.5px dashed var(--coral-400); color: var(--coral-600); background: transparent; font: var(--fw-medium) var(--text-2xs)/1 var(--font-mono); letter-spacing: var(--ls-caps); text-transform: uppercase; padding: 8px 14px; border-radius: var(--radius-pill); transform: rotate(-3deg); }

/* Buttons */
.tf-btn { font: var(--fw-semibold) var(--text-sm)/1 var(--font-sans); padding: 10px 22px; border-radius: var(--radius-pill); border: none; cursor: pointer; transition: all var(--dur-base) var(--ease-out); display: inline-flex; align-items: center; gap: 8px; }
.tf-btn:active { transform: scale(0.97); }
.tf-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.tf-btn--primary { background: var(--brand); color: var(--brand-on); box-shadow: var(--shadow-brand); }
.tf-btn--primary:hover:not(:disabled) { background: var(--brand-hover); filter: brightness(1.05); }
.tf-btn--accent { background: var(--accent); color: var(--accent-on); }
.tf-btn--accent:hover { background: var(--accent-hover); }
.tf-btn--secondary { background: var(--surface-sunken); color: var(--text-body); }
.tf-btn--secondary:hover { background: var(--ink-200); }
.tf-btn--soft { background: var(--brand-soft); color: var(--brand); }
.tf-btn--soft:hover { background: var(--coral-100); }
.tf-btn--ghost { background: transparent; color: var(--text-muted); }
.tf-btn--ghost:hover { background: var(--surface-sunken); color: var(--text-body); }
.tf-btn--sm { padding: 7px 16px; font-size: var(--text-xs); }
.tf-btn--lg { padding: 14px 28px; font-size: var(--text-base); }

/* Forms */
.sg-field { margin-bottom: 16px; display: flex; flex-direction: column; gap: 6px; }
.sg-field label { font: var(--fw-semibold) var(--text-sm)/1 var(--font-sans); color: var(--text-muted); }
.tf-input { font: var(--fw-regular) var(--text-sm)/1 var(--font-sans); padding: 10px 14px; border: 1px solid var(--field-border); border-radius: var(--radius-md); background: var(--field-bg); color: var(--text-body); outline: none; transition: border-color var(--dur-base), box-shadow var(--dur-base); }
.tf-input:focus { border-color: var(--border-focus); box-shadow: var(--ring-brand); }
.tf-input--error { border-color: var(--danger-500); }
.tf-input--error:focus { box-shadow: 0 0 0 3px rgba(210,63,44,0.2); }
.tf-helper { font: var(--fw-regular) var(--text-xs)/1.3 var(--font-sans); color: var(--text-subtle); }
.tf-helper--error { color: var(--danger-500); }
.tf-select { font: var(--fw-regular) var(--text-sm)/1 var(--font-sans); padding: 10px 14px; border: 1px solid var(--field-border); border-radius: var(--radius-md); background: var(--field-bg); color: var(--text-body); outline: none; }
.tf-select:focus { border-color: var(--border-focus); box-shadow: var(--ring-brand); }
.tf-check { display: flex; align-items: center; gap: 10px; font: var(--fw-regular) var(--text-sm)/1 var(--font-sans); color: var(--text-body); cursor: pointer; padding: 6px 0; }
.tf-check input { accent-color: var(--brand); width: 18px; height: 18px; }
.tf-switch { display: flex; align-items: center; gap: 12px; font: var(--fw-regular) var(--text-sm)/1 var(--font-sans); color: var(--text-body); cursor: pointer; padding: 6px 0; }
.tf-switch input { display: none; }
.tf-switch-track { width: 40px; height: 22px; background: var(--ink-300); border-radius: var(--radius-pill); position: relative; transition: background var(--dur-base); flex-shrink: 0; }
.tf-switch-track::after { content: ''; position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; background: white; border-radius: 50%; transition: transform var(--dur-base) var(--ease-out); box-shadow: var(--shadow-xs); }
.tf-switch input:checked + .tf-switch-track { background: var(--brand); }
.tf-switch input:checked + .tf-switch-track::after { transform: translateX(18px); }

/* Alerts */
.sg-alert { padding: 14px 18px; border-radius: var(--radius-md); font: var(--fw-regular) var(--text-sm)/1.5 var(--font-sans); }
.sg-alert b { font-weight: var(--fw-semibold); }
.sg-alert--success { background: var(--success-100); color: var(--text-body); border-left: 3px solid var(--success-500); }
.sg-alert--warning { background: var(--warning-100); color: var(--text-body); border-left: 3px solid var(--warning-500); }
.sg-alert--danger { background: var(--danger-100); color: var(--text-body); border-left: 3px solid var(--danger-500); }

/* Toasts */
.sg-toast { background: var(--surface-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 14px 18px; box-shadow: var(--shadow-md); display: flex; flex-direction: column; gap: 4px; }
.sg-toast b { font: var(--fw-semibold) var(--text-sm)/1.3 var(--font-sans); color: var(--text-strong); }

/* Avatars */
.sg-avatar { border-radius: 50%; display: flex; align-items: center; justify-content: center; font: var(--fw-semibold) var(--text-xs)/1 var(--font-sans); }
.sg-avatar--sm { width: 28px; height: 28px; font-size: 10px; }
.sg-avatar--md { width: 36px; height: 36px; }
.sg-avatar--lg { width: 44px; height: 44px; font-size: var(--text-sm); }
.sg-avatar--xl { width: 56px; height: 56px; font-size: var(--text-base); }

/* Footer */
.sg-footer { padding: 48px var(--gutter) 72px; border-top: 1px solid var(--border-subtle); margin-top: 48px; }
.sg-footer .sg-wrap { display: flex; justify-content: space-between; align-items: center; max-width: 1080px; margin: 0 auto; }
</style>
