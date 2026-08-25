<template>
  <div class="page-content" style="max-width: 640px">
    <div class="page-head">
      <div>
        <div class="tf-eyebrow" style="margin-bottom: 8px">Account</div>
        <h1>Settings</h1>
        <p>Your preferences for currency, language, and formats.</p>
      </div>
    </div>

    <div v-if="loading" class="skeleton" style="height: 300px"></div>

    <template v-else>
      <!-- Currency -->
      <div class="card" style="margin-bottom: 20px">
        <h3 style="font: var(--type-h3); margin: 0 0 16px">Currency</h3>
        <div class="field">
          <label>Base currency</label>
          <p style="font: var(--type-small); color: var(--text-secondary); margin: 0 0 6px">
            All prices will be converted to this currency for totals.
          </p>
          <TfSelect
            v-model="form.baseCurrency"
            :options="currencyOptions"
            placeholder="EUR"
            class="w-full"
          />
        </div>
      </div>

      <!-- Language -->
      <div class="card" style="margin-bottom: 20px">
        <h3 style="font: var(--type-h3); margin: 0 0 16px">Language</h3>
        <div class="field">
          <label>Interface language</label>
          <TfSelect v-model="languageLabel" :options="languageLabels" class="w-full" />
        </div>
      </div>

      <!-- Region -->
      <div class="card" style="margin-bottom: 20px">
        <h3 style="font: var(--type-h3); margin: 0 0 16px">Region</h3>
        <div class="field">
          <label>Home region</label>
          <p style="font: var(--type-small); color: var(--text-secondary); margin: 0 0 6px">
            Optional. Used for suggestions and defaults.
          </p>
          <TfSelect
            v-model="regionLabel"
            :options="regionLabels"
            placeholder="Not set"
            class="w-full"
          />
        </div>
      </div>

      <!-- Date & Time -->
      <div class="card" style="margin-bottom: 20px">
        <h3 style="font: var(--type-h3); margin: 0 0 16px">Date & time</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
          <div class="field">
            <label>Date format</label>
            <TfSelect v-model="dateFormatLabel" :options="dateFormatLabels" class="w-full" />
          </div>
          <div class="field">
            <label>Time format</label>
            <TfSelect v-model="timeFormatLabel" :options="timeFormatLabels" class="w-full" />
          </div>
        </div>
        <div
          style="
            margin-top: 12px;
            padding: 10px 14px;
            background: var(--surface);
            border-radius: var(--radius-md);
            font: var(--type-small);
            color: var(--text-secondary);
          "
        >
          Preview: <strong style="color: var(--text-primary)">{{ datePreview }}</strong> ·
          <strong style="color: var(--text-primary)">{{ timePreview }}</strong>
        </div>
      </div>

      <!-- Save -->
      <div style="display: flex; gap: 10px; justify-content: flex-end">
        <TfButton variant="ghost" @click="resetForm">Reset</TfButton>
        <TfButton variant="primary" @click="save" :disabled="saving">
          {{ saving ? 'Saving...' : 'Save settings' }}
        </TfButton>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { prefs, baseCurrency, updateSettings } from '@tripyfull/core';
import { CURRENCIES, MONTHS_SHORT } from '@tripyfull/core';
import { TfButton, TfSelect, toast } from '@tripyfull/ui';
import { api } from '@tripyfull/core';

const loading = ref(false);
const saving = ref(false);

const form = ref({
  baseCurrency: baseCurrency.value,
  language: prefs.language,
  region: prefs.region,
  dateFormat: prefs.dateFormat,
  timeFormat: prefs.timeFormat,
});

const currencyOptions = CURRENCIES;

const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'Ukrainian', value: 'uk' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Italian', value: 'it' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Korean', value: 'ko' },
  { label: 'Chinese', value: 'zh' },
  { label: 'Polish', value: 'pl' },
  { label: 'Czech', value: 'cs' },
  { label: 'Turkish', value: 'tr' },
  { label: 'Dutch', value: 'nl' },
  { label: 'Swedish', value: 'sv' },
];

const regionOptions = [
  // Region is optional — the null option lets the user clear it again
  // (PATCH /me stores an explicit null).
  { label: 'Not set', value: null },
  { label: 'Western Europe', value: 'Western Europe' },
  { label: 'Eastern Europe', value: 'Eastern Europe' },
  { label: 'Northern Europe', value: 'Northern Europe' },
  { label: 'Southern Europe', value: 'Southern Europe' },
  { label: 'North America', value: 'North America' },
  { label: 'South America', value: 'South America' },
  { label: 'Central America', value: 'Central America' },
  { label: 'East Asia', value: 'East Asia' },
  { label: 'Southeast Asia', value: 'Southeast Asia' },
  { label: 'South Asia', value: 'South Asia' },
  { label: 'Middle East', value: 'Middle East' },
  { label: 'Africa', value: 'Africa' },
  { label: 'Oceania', value: 'Oceania' },
];

const dateFormatOptions = [
  { label: 'DD/MM/YYYY — 18/06/2026', value: 'DD/MM/YYYY' },
  { label: 'MM/DD/YYYY — 06/18/2026', value: 'MM/DD/YYYY' },
  { label: 'YYYY-MM-DD — 2026-06-18', value: 'YYYY-MM-DD' },
  { label: 'DD.MM.YYYY — 18.06.2026', value: 'DD.MM.YYYY' },
  { label: 'D MMM YYYY — 18 Jun 2026', value: 'D MMM YYYY' },
];

const timeFormatOptions = [
  { label: '24-hour — 14:30', value: '24h' },
  { label: '12-hour — 2:30 PM', value: '12h' },
];

// TfSelect works with string options; map label <-> stored value.
function makeLabelProxy(options, key) {
  const labels = options.map((o) => o.label);
  const proxy = computed({
    get() {
      const opt = options.find((o) => o.value === form.value[key]);
      return opt ? opt.label : '';
    },
    set(label) {
      const opt = options.find((o) => o.label === label);
      form.value[key] = opt ? opt.value : label;
    },
  });
  return { labels, proxy };
}

const languageLabels = languageOptions.map((o) => o.label);
const languageLabel = makeLabelProxy(languageOptions, 'language').proxy;

const regionLabels = regionOptions.map((o) => o.label);
const regionLabel = makeLabelProxy(regionOptions, 'region').proxy;

const dateFormatLabels = dateFormatOptions.map((o) => o.label);
const dateFormatLabel = makeLabelProxy(dateFormatOptions, 'dateFormat').proxy;

const timeFormatLabels = timeFormatOptions.map((o) => o.label);
const timeFormatLabel = makeLabelProxy(timeFormatOptions, 'timeFormat').proxy;

const datePreview = computed(() => {
  const d = new Date();
  const day = d.getDate();
  const mon = String(d.getMonth() + 1).padStart(2, '0');
  const yr = d.getFullYear();
  switch (form.value.dateFormat) {
    case 'MM/DD/YYYY':
      return `${mon}/${String(day).padStart(2, '0')}/${yr}`;
    case 'YYYY-MM-DD':
      return `${yr}-${mon}-${String(day).padStart(2, '0')}`;
    case 'DD.MM.YYYY':
      return `${String(day).padStart(2, '0')}.${mon}.${yr}`;
    case 'D MMM YYYY':
      return `${day} ${MONTHS_SHORT[d.getMonth()]} ${yr}`;
    default:
      return `${String(day).padStart(2, '0')}/${mon}/${yr}`;
  }
});

const timePreview = computed(() => {
  const d = new Date();
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  if (form.value.timeFormat === '12h') {
    const h12 = h % 12 || 12;
    return `${h12}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
  }
  return `${String(h).padStart(2, '0')}:${m}`;
});

const resetForm = () => {
  form.value = {
    baseCurrency: baseCurrency.value,
    language: prefs.language,
    region: prefs.region,
    dateFormat: prefs.dateFormat,
    timeFormat: prefs.timeFormat,
  };
};

const save = async () => {
  saving.value = true;
  try {
    const res = await api.patch('/api/auth/me', form.value);
    updateSettings(res.data);
    toast.success('Saved', 'Settings updated');
  } catch {
    toast.danger('Error', 'Failed to save settings');
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  loading.value = true;
  try {
    const res = await api.get('/api/auth/me');
    form.value = {
      baseCurrency: res.data.baseCurrency || 'EUR',
      language: res.data.language || 'en',
      region: res.data.region || '',
      dateFormat: res.data.dateFormat || 'DD/MM/YYYY',
      timeFormat: res.data.timeFormat || '24h',
    };
    updateSettings(res.data);
  } catch {
    // use local values
  } finally {
    loading.value = false;
  }
});
</script>
