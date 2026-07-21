<template>
  <span
    v-if="name"
    class="tf-icon"
    :style="fillOverride !== undefined ? { '--tf-icon-fill': fillOverride } : undefined"
    >{{ name }}</span
  >
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  // Material Symbols ligature name, e.g. "map", "account_balance_wallet".
  name: { type: String, required: true },
  // "outline" (default) or "filled". An explicit value forces the FILL axis;
  // otherwise the inherited --tf-icon-fill hook decides (so an active nav item
  // can turn fill on via the cascade).
  variant: { type: String, default: undefined },
});

const fillOverride = computed(() => (props.variant === 'filled' ? 1 : undefined));
</script>

<style>
/* Material Symbols Rounded (variable on FILL only). Source + processing in assets/fonts. */
@font-face {
  font-family: 'Material Symbols Rounded';
  font-style: normal;
  font-display: block;
  font-weight: 300;
  src: url('./assets/fonts/material-symbols-rounded.woff2') format('woff2');
}

.tf-icon {
  font-family: 'Material Symbols Rounded';
  /* FILL axis: 0 = outline (default), 1 = filled. Inherited hook so an ancestor can toggle it. */
  font-variation-settings: 'FILL' var(--tf-icon-fill, 0);
  display: inline-block;
  font-style: normal;
  line-height: 1;
  vertical-align: middle;
  letter-spacing: normal;
  text-transform: none;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  user-select: none;
  -webkit-font-smoothing: antialiased;
}
</style>
