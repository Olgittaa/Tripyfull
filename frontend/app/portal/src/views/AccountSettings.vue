<template>
  <div class="page-content" style="max-width: 640px">
    <div class="page-head">
      <div>
        <div class="tf-eyebrow" style="margin-bottom: 8px">{{ t('settings.eyebrow') }}</div>
        <h1>{{ t('settings.title') }}</h1>
        <p>{{ t('settings.subtitle') }}</p>
      </div>
    </div>

    <div v-if="loading" class="skeleton" style="height: 300px"></div>

    <template v-else>
      <!-- Currency -->
      <div class="card" style="margin-bottom: 20px">
        <h3 style="font: var(--type-h3); margin: 0 0 16px">{{ t('settings.currency') }}</h3>
        <div class="field">
          <label>{{ t('settings.baseCurrency') }}</label>
          <p style="font: var(--type-small); color: var(--text-secondary); margin: 0 0 6px">
            {{ t('settings.baseCurrencyHelp') }}
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
        <h3 style="font: var(--type-h3); margin: 0 0 16px">{{ t('settings.language') }}</h3>
        <div class="field">
          <label>{{ t('settings.interfaceLanguage') }}</label>
          <p style="font: var(--type-small); color: var(--text-secondary); margin: 0 0 6px">
            {{ t('settings.languageHelp') }}
          </p>
          <TfSelect v-model="languageLabel" :options="languageLabels" class="w-full" />
        </div>
      </div>

      <!-- Region -->
      <div class="card" style="margin-bottom: 20px">
        <h3 style="font: var(--type-h3); margin: 0 0 16px">{{ t('settings.region') }}</h3>
        <div class="field">
          <label>{{ t('settings.homeRegion') }}</label>
          <p style="font: var(--type-small); color: var(--text-secondary); margin: 0 0 6px">
            {{ t('settings.regionHelp') }}
          </p>
          <TfSelect
            v-model="regionLabel"
            :options="regionLabels"
            :placeholder="t('settings.notSet')"
            class="w-full"
          />
        </div>
      </div>

      <!-- Date & Time -->
      <div class="card" style="margin-bottom: 20px">
        <h3 style="font: var(--type-h3); margin: 0 0 16px">{{ t('settings.dateTime') }}</h3>
        <div class="field-pair">
          <div class="field">
            <label>{{ t('settings.dateFormat') }}</label>
            <TfSelect v-model="dateFormatLabel" :options="dateFormatLabels" class="w-full" />
          </div>
          <div class="field">
            <label>{{ t('settings.timeFormat') }}</label>
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
          {{ t('settings.preview') }}:
          <strong style="color: var(--text-primary)">{{ datePreview }}</strong> ·
          <strong style="color: var(--text-primary)">{{ timePreview }}</strong>
        </div>
      </div>

      <!-- Save -->
      <div style="display: flex; gap: 10px; justify-content: flex-end">
        <TfButton variant="ghost" @click="resetForm">{{ t('common.reset') }}</TfButton>
        <TfButton variant="primary" @click="save" :disabled="saving">
          {{ saving ? t('settings.saving') : t('settings.save') }}
        </TfButton>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { prefs, baseCurrency, updateSettings, t, LOCALES } from '@tripyfull/core';
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

// The languages the app speaks, each named in itself — that is how you find
// yours when the screen is in a language you cannot read.
const languageOptions = computed(() => LOCALES.map((l) => ({ label: l.label, value: l.code })));

// Option labels are computeds: they are written in the app's language, and
// they re-label themselves when it changes.
const regionOptions = computed(() => [
  // Region is optional — the null option lets the user clear it again
  // (PATCH /me stores an explicit null).
  { label: t('settings.notSet'), value: null },
  { label: t('settings.region.westernEurope'), value: 'Western Europe' },
  { label: t('settings.region.easternEurope'), value: 'Eastern Europe' },
  { label: t('settings.region.northernEurope'), value: 'Northern Europe' },
  { label: t('settings.region.southernEurope'), value: 'Southern Europe' },
  { label: t('settings.region.northAmerica'), value: 'North America' },
  { label: t('settings.region.southAmerica'), value: 'South America' },
  { label: t('settings.region.centralAmerica'), value: 'Central America' },
  { label: t('settings.region.eastAsia'), value: 'East Asia' },
  { label: t('settings.region.southeastAsia'), value: 'Southeast Asia' },
  { label: t('settings.region.southAsia'), value: 'South Asia' },
  { label: t('settings.region.middleEast'), value: 'Middle East' },
  { label: t('settings.region.africa'), value: 'Africa' },
  { label: t('settings.region.oceania'), value: 'Oceania' },
]);

// Date formats read the same in every language: the pattern and an example.
const dateFormatOptions = computed(() => [
  { label: 'DD/MM/YYYY — 18/06/2026', value: 'DD/MM/YYYY' },
  { label: 'MM/DD/YYYY — 06/18/2026', value: 'MM/DD/YYYY' },
  { label: 'YYYY-MM-DD — 2026-06-18', value: 'YYYY-MM-DD' },
  { label: 'DD.MM.YYYY — 18.06.2026', value: 'DD.MM.YYYY' },
  { label: 'D MMM YYYY — 18 Jun 2026', value: 'D MMM YYYY' },
]);

const timeFormatOptions = computed(() => [
  { label: t('settings.time24'), value: '24h' },
  { label: t('settings.time12'), value: '12h' },
]);

// TfSelect works with string options; map label <-> stored value.
function makeLabelProxy(options, key) {
  const labels = computed(() => options.value.map((o) => o.label));
  const proxy = computed({
    get() {
      const opt = options.value.find((o) => o.value === form.value[key]);
      return opt ? opt.label : '';
    },
    set(label) {
      const opt = options.value.find((o) => o.label === label);
      form.value[key] = opt ? opt.value : label;
    },
  });
  return { labels, proxy };
}

const { labels: languageLabels, proxy: languageLabel } = makeLabelProxy(
  languageOptions,
  'language',
);
const { labels: regionLabels, proxy: regionLabel } = makeLabelProxy(regionOptions, 'region');
const { labels: dateFormatLabels, proxy: dateFormatLabel } = makeLabelProxy(
  dateFormatOptions,
  'dateFormat',
);
const { labels: timeFormatLabels, proxy: timeFormatLabel } = makeLabelProxy(
  timeFormatOptions,
  'timeFormat',
);

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
    // The app switches language here, through the settings, before the toast is
    // written — so the toast already speaks the new one.
    updateSettings(res.data);
    toast.success(t('common.saved'), t('settings.savedMsg'));
  } catch {
    toast.danger(t('common.error'), t('settings.saveFailed'));
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
