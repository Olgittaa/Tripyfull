<template>
  <div class="avatar-group">
    <span
      v-for="(a, i) in shown"
      :key="i"
      class="avatar-g"
      :style="{ background: a.bg, color: a.fg }"
      :title="a.name"
    >
      {{ a.initials }}
    </span>
    <span v-if="extra > 0" class="avatar-g avatar-g--more">+{{ extra }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  items: { type: Array, default: () => [] },
  max: { type: Number, default: 4 },
});
const shown = computed(() => props.items.slice(0, props.max));
const extra = computed(() => Math.max(props.items.length - props.max, 0));
</script>
