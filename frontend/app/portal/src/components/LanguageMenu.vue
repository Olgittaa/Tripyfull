<template>
  <TfPopover position="bottom-end">
    <button
      type="button"
      class="topbar-lang"
      :title="t('nav.language')"
      :aria-label="t('nav.language')"
    >
      {{ shortCode }}
      <i class="pi pi-angle-down" style="font-size: 9px"></i>
    </button>
    <template #content="{ close }">
      <div class="lang-menu">
        <!-- Each language is named in itself: that is how you find yours when
             the screen is in one you cannot read. -->
        <button
          v-for="l in LOCALES"
          :key="l.code"
          type="button"
          class="topbar-link lang-row"
          :class="{ 'lang-row--on': l.code === prefs.language }"
          :lang="l.tag"
          @click="pick(l.code, close)"
        >
          <i class="pi lang-check" :class="l.code === prefs.language ? 'pi-check' : ''"></i>
          {{ l.label }}
        </button>
      </div>
    </template>
  </TfPopover>
</template>

<script setup>
import { computed } from 'vue';
import { api, prefs, updateSettings, LOCALES, t } from '@tripyfull/core';
import { TfPopover, toast } from '@tripyfull/ui';

const shortCode = computed(() => (prefs.language || 'en').toUpperCase());

/** The choice is the account's, like the one on the settings page. */
const pick = async (code, close) => {
  close?.();
  if (code === prefs.language) return;
  try {
    const res = await api.patch('/api/auth/me', { language: code });
    // Switching here is the whole feedback: every word on screen follows.
    updateSettings(res.data);
  } catch {
    toast.danger(t('common.error'), t('settings.saveFailed'));
  }
};
</script>
