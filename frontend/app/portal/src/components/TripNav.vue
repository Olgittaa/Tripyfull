<template>
  <nav class="sidebar-trip-nav">
    <router-link
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="sidebar-nav-btn"
      :class="{ 'active-filled': item.active }"
      :title="collapsed ? item.label : null"
      @click="$emit('navigate')"
    >
      <TfIcon :name="item.icon" style="font-size: 20px" />
      <span class="nav-label">{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<script setup>
import { t } from '@tripyfull/core';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { TfIcon } from '@tripyfull/ui';

const props = defineProps({
  tripId: { type: String, required: true },
  // Icons only: the label is hidden and becomes the row's tooltip.
  collapsed: { type: Boolean, default: false },
});
defineEmits(['navigate']);

const route = useRoute();
const at = (path) => route.path.replace(/\/$/, '') === path.replace(/\/$/, '');

/* One list for both places this menu appears: the sidebar on a laptop and the
   drawer on a phone. */
const items = computed(() => {
  const base = `/trips/${props.tripId}`;
  return [
    { to: base, icon: 'dashboard', label: t('nav.overview'), active: at(base) },
    {
      to: `${base}/itinerary`,
      icon: 'route',
      label: t('nav.itinerary'),
      active: route.path.includes('/days/') || at(`${base}/itinerary`),
    },
    { to: `${base}/map`, icon: 'map', label: t('nav.map'), active: route.path.includes('/map') },
    {
      to: `${base}/places`,
      icon: 'location_on',
      label: t('nav.tripPlaces'),
      active: at(`${base}/places`),
    },
    {
      to: `${base}/bookings`,
      icon: 'confirmation_number',
      label: t('nav.bookings'),
      active: route.path.includes('/bookings'),
    },
    {
      to: `${base}/todos`,
      icon: 'checklist',
      label: t('nav.todo'),
      active: route.path.includes('/todos'),
    },
    {
      to: `${base}/budget`,
      icon: 'account_balance_wallet',
      label: t('nav.budget'),
      active: route.path.includes('/budget'),
    },
  ];
});
</script>
