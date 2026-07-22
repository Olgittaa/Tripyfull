<template>
  <div class="bc">
    <div class="bc-wrap">
      <!-- Nav -->
      <nav class="bc-nav">
        <a href="#buttons">Buttons</a>
        <a href="#forms">Text inputs &amp; textarea</a>
        <a href="#selects">Selects</a>
        <a href="#numbers">Number inputs</a>
        <a href="#choice">Radios, checkboxes &amp; switches</a>
        <router-link to="/styleguide">Style guide</router-link>
      </nav>

      <!-- BUTTONS -->
      <section id="buttons" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Actions</span>
            <h2 class="bc-sec-title">Buttons</h2>
          </div>
        </div>
        <div class="bc-demo">
          <div class="bc-matrix">
            <div></div>
            <div v-for="v in btnVariants" :key="'h-' + v.key" class="bc-matrix-colhead">
              {{ v.label }}
            </div>

            <template v-for="s in btnStates" :key="s">
              <div class="bc-matrix-rowhead">{{ s }}</div>
              <div v-for="v in btnVariants" :key="s + '-' + v.key" class="bc-matrix-cell">
                <TfButton
                  :variant="v.variant"
                  :class="v.extraClass"
                  icon="pi-save"
                  :loading="s === 'loading'"
                  :disabled="s === 'disabled'"
                >
                  <template v-if="!v.iconOnly">Save</template>
                </TfButton>
              </div>
            </template>
          </div>

          <div class="bc-group">
            <div class="bc-label">Sizes</div>
            <div class="bc-row">
              <TfButton variant="primary" size="sm" icon="pi-save">Small</TfButton>
              <TfButton variant="primary" icon="pi-save">Medium</TfButton>
              <TfButton variant="primary" size="lg" icon="pi-save">Large</TfButton>
            </div>
          </div>
        </div>
      </section>

      <!-- FORMS -->
      <section id="forms" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Forms</span>
            <h2 class="bc-sec-title">Text inputs &amp; textarea</h2>
          </div>
        </div>
        <div class="bc-demo">
          <div class="bc-forms">
            <!-- Text inputs -->
            <div class="bc-forms-col">
              <div class="bc-forms-colhead">Text inputs</div>
              <div v-for="row in inputStates" :key="row.label" class="bc-forms-row">
                <div class="bc-forms-state">{{ row.label }}</div>
                <TfInput
                  label="E-mail address"
                  placeholder="Input your e-mail address"
                  :model-value="row.value"
                  :state="row.state"
                  :helper="row.hint"
                  :error="row.errHint"
                  :disabled="row.disabled"
                >
                  <template v-if="row.prefix" #prefix><i class="pi" :class="row.prefix" /></template>
                  <template v-if="row.suffix" #suffix><i class="pi" :class="row.suffix" /></template>
                </TfInput>
              </div>
            </div>

            <!-- Textarea -->
            <div class="bc-forms-col">
              <div class="bc-forms-colhead">Textarea</div>
              <div v-for="row in textareaStates" :key="row.label" class="bc-forms-row">
                <div class="bc-forms-state">{{ row.label }}</div>
                <TfTextarea
                  label="Address"
                  placeholder="Input your address"
                  :model-value="row.value"
                  :state="row.state"
                  :helper="row.hint"
                  :error="row.errHint"
                  :disabled="row.disabled"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- SELECTS -->
      <section id="selects" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Forms</span>
            <h2 class="bc-sec-title">Selects</h2>
          </div>
        </div>
        <div class="bc-demo">
          <div class="bc-selects">
            <div v-for="row in selectStates" :key="row.label" class="bc-forms-row">
              <div class="bc-forms-state">{{ row.label }}</div>
              <TfSelect
                label="Activity type"
                placeholder="Select type"
                :options="selectOptions"
                v-model="row.value"
                :helper="row.hint"
                :error="row.errHint"
                :disabled="row.disabled"
              >
                <template v-if="row.prefix" #prefix><i class="pi" :class="row.prefix" /></template>
              </TfSelect>
            </div>
          </div>
        </div>
      </section>

      <!-- NUMBER INPUTS -->
      <section id="numbers" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Forms</span>
            <h2 class="bc-sec-title">Number inputs</h2>
          </div>
        </div>
        <div class="bc-demo">
          <div class="bc-nums">
            <div v-for="n in numberInputs" :key="n.name" class="bc-num-block">
              <div class="bc-num-name">{{ n.name }}</div>
              <div class="bc-num-cols">
                <TfNumberInput
                  :type="n.type"
                  :prefix="n.prefix"
                  :precision="n.precision || 0"
                  v-model="n.value"
                />
                <TfNumberInput
                  :type="n.type"
                  :prefix="n.prefix"
                  :precision="n.precision || 0"
                  :model-value="0"
                  disabled
                  hint="This input is disabled"
                />
              </div>
            </div>

            <div class="bc-num-block">
              <div class="bc-num-name">Slider input</div>
              <div class="bc-num-slider">
                <TfSlider v-model="sliderValue" :min="0" :max="10" />
                <TfSlider :model-value="4" :min="0" :max="10" disabled hint="This input is disabled" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- RADIOS / CHECKBOXES / SWITCHES -->
      <section id="choice" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Forms</span>
            <h2 class="bc-sec-title">Radios, checkboxes &amp; switches</h2>
          </div>
        </div>
        <div class="bc-demo">
          <div class="bc-choice">
            <div class="bc-choice-col">
              <div class="bc-num-name">Radio buttons</div>
              <TfRadio
                v-for="row in radioStates"
                :key="row.label"
                v-model="row.model"
                value="on"
                :disabled="row.disabled"
                >{{ row.label }}</TfRadio
              >
            </div>

            <div class="bc-choice-col">
              <div class="bc-num-name">Checkbox</div>
              <TfCheckbox
                v-for="row in checkboxStates"
                :key="row.label"
                v-model="row.checked"
                :indeterminate="!row.checked && !!row.indeterminate"
                :disabled="row.disabled"
                >{{ row.label }}</TfCheckbox
              >
            </div>

            <div class="bc-choice-col">
              <div class="bc-num-name">Switches</div>
              <TfSwitch
                v-for="row in switchStates"
                :key="row.label"
                v-model="row.checked"
                :disabled="row.disabled"
                >{{ row.label }}</TfSwitch
              >
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
            color: var(--text-primary);
          "
          >Tripyfull</span
        >
        <router-link
          to="/styleguide"
          style="font: var(--fw-medium) var(--text-sm)/1 var(--font-sans); color: var(--text-link)"
          >Style guide</router-link
        >
        <span class="text-xs" style="font-family: var(--font-mono); color: var(--text-secondary)"
          >Components 2026</span
        >
      </div>
    </footer>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import {
  TfButton,
  TfInput,
  TfTextarea,
  TfSelect,
  TfNumberInput,
  TfSlider,
  TfRadio,
  TfCheckbox,
  TfSwitch,
} from '@tripyfull/ui';

const btnStates = ['default', 'disabled', 'loading'];
const btnVariants = [
  { key: 'primary', label: 'Primary', variant: 'primary' },
  { key: 'secondary', label: 'Secondary', variant: 'secondary' },
  { key: 'ghost', label: 'Ghost', variant: 'ghost' },
  { key: 'danger', label: 'Danger', variant: 'danger' },
  { key: 'icon', label: 'Icon', variant: 'secondary', extraClass: 'btn--icon', iconOnly: true },
];

const inputStates = [
  { label: 'Default', hint: 'Use your private email address' },
  { label: 'Prepend Icon', prefix: 'pi-info-circle' },
  { label: 'Append Element', suffix: 'pi-check' },
  { label: 'Filled', value: 'test@email.com' },
  {
    label: 'Error',
    value: 'test@emailcom',
    errHint: "E-mail address doesn't have correct format",
  },
  { label: 'Disabled', disabled: true },
];
const textareaStates = [
  { label: 'Default', hint: 'Use your private address' },
  { label: 'Filled', value: 'Mile street 4, 50000 New York' },
  {
    label: 'Error',
    value: '+123456789',
    errHint: "Address doesn't have correct format",
  },
  { label: 'Disabled', disabled: true },
];

const selectOptions = ['Sightseeing', 'Museum', 'Beach'];
const selectStates = reactive([
  { label: 'Default', value: '', hint: 'Select your activity type' },
  { label: 'Prepend icon', value: '', prefix: 'pi-info-circle' },
  { label: 'Selected', value: 'Museum' },
  { label: 'Error', value: 'Museum', errHint: 'Activity type is unavailable' },
  { label: 'Disabled', value: '', disabled: true },
]);

const numberInputs = reactive([
  { name: 'Split input', type: 'split', value: 0 },
  { name: 'Stacked input', type: 'stacked', value: 26 },
  { name: 'Plain input', type: 'plain', value: 67 },
  { name: 'Currency input', type: 'plain', prefix: '€', precision: 2, value: 67.5 },
]);
const sliderValue = ref(3);

const radioStates = reactive([
  { label: 'Default', model: '' },
  { label: 'Selected', model: 'on' },
  { label: 'Disabled', model: '', disabled: true },
  { label: 'Selected but disabled', model: 'on', disabled: true },
]);
const checkboxStates = reactive([
  { label: 'Checked', checked: true },
  { label: 'Indeterminate', checked: false, indeterminate: true },
  { label: 'Default', checked: false },
  { label: 'Disabled', checked: false, disabled: true },
  { label: 'Selected but disabled', checked: true, disabled: true },
]);
const switchStates = reactive([
  { label: 'Default', checked: false },
  { label: 'Selected', checked: true },
  { label: 'Disabled', checked: false, disabled: true },
  { label: 'Selected but disabled', checked: true, disabled: true },
]);
</script>

<style scoped>
.bc {
  background: var(--bg);
  min-height: 100vh;
}

.bc-wrap {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 var(--gutter);
}

/* Nav */
.bc-nav {
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
.bc-nav a {
  font: var(--fw-medium) var(--text-sm)/1 var(--font-sans);
  color: var(--text-secondary);
  text-decoration: none;
}
.bc-nav a:hover {
  color: var(--accent);
}

/* Sections */
.bc-block {
  padding: 56px 0 8px;
  border-top: 1px solid var(--border-default);
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
  color: var(--text-primary);
  margin: 10px 0 0;
}

/* Demo area */
.bc-demo {
  background: var(--card);
  border: 1px solid var(--border-default);
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
.bc-label {
  font: var(--fw-medium) var(--text-2xs)/1 var(--font-mono);
  letter-spacing: var(--ls-caps);
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 12px;
}
.bc-group {
  margin-top: 28px;
}

/* Button state matrix */
.bc-matrix {
  display: grid;
  grid-template-columns: auto repeat(5, minmax(0, 1fr));
  gap: 18px 16px;
  align-items: center;
  overflow-x: auto;
}
.bc-matrix-colhead {
  font: var(--fw-medium) var(--text-2xs)/1 var(--font-mono);
  letter-spacing: var(--ls-caps);
  text-transform: uppercase;
  color: var(--ink-500);
  text-align: center;
}
.bc-matrix-rowhead {
  font: var(--fw-semibold) var(--text-sm)/1 var(--font-sans);
  color: var(--text-secondary);
  text-align: right;
  padding-right: 4px;
  white-space: nowrap;
}
.bc-matrix-cell {
  display: flex;
  justify-content: center;
}

/* Input & textarea state matrix */
.bc-forms {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px 40px;
}
@media (max-width: 900px) {
  .bc-forms {
    grid-template-columns: 1fr;
  }
}
.bc-forms-col {
  display: flex;
  flex-direction: column;
  gap: 22px;
}
.bc-forms-colhead {
  font: var(--fw-medium) var(--text-2xs)/1 var(--font-mono);
  letter-spacing: var(--ls-caps);
  text-transform: uppercase;
  color: var(--ink-500);
}
.bc-forms-row {
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: 16px;
  align-items: center;
}
.bc-forms-state {
  font: var(--fw-medium) var(--text-2xs)/1.3 var(--font-mono);
  letter-spacing: var(--ls-caps);
  text-transform: uppercase;
  color: var(--ink-500);
  text-align: right;
}

/* Select state list */
.bc-selects {
  display: flex;
  flex-direction: column;
  gap: 22px;
  max-width: 480px;
}
.bc-selects .bc-forms-row {
  align-items: start;
}

/* Number inputs */
.bc-nums {
  display: flex;
  flex-direction: column;
  gap: 32px;
  max-width: 460px;
}
.bc-num-name {
  font: var(--fw-semibold) var(--text-md)/1.2 var(--font-sans);
  color: var(--text-primary);
  margin-bottom: 12px;
}
.bc-num-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: start;
}
.bc-num-slider {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Radios / checkboxes / switches */
.bc-choice {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
}
@media (max-width: 760px) {
  .bc-choice {
    grid-template-columns: 1fr;
  }
}
.bc-choice-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: flex-start;
}

/* Footer */
.bc-footer {
  padding: 48px var(--gutter) 72px;
  border-top: 1px solid var(--border-default);
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
