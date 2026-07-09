<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="modelValue" class="drawer-backdrop" @click="$emit('update:modelValue', false)"></div>
    </Transition>
    <div
      class="drawer-panel"
      :class="{ 'drawer-panel--wide': wide }"
      :style="{ transform: modelValue ? 'translateX(0)' : 'translateX(102%)' }"
    >
      <div class="drawer-header">
        <div>
          <div v-if="eyebrow" class="tf-eyebrow" style="margin-bottom:6px">{{ eyebrow }}</div>
          <h2>{{ title }}</h2>
        </div>
        <TfIconButton variant="ghost" size="sm" label="Close" @click="$emit('update:modelValue', false)">
          <i class="pi pi-times"></i>
        </TfIconButton>
      </div>
      <div class="drawer-body">
        <slot />
      </div>
      <div v-if="$slots.footer" class="drawer-footer">
        <slot name="footer" />
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import TfIconButton from './TfIconButton.vue';

defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  eyebrow: { type: String, default: '' },
  wide: { type: Boolean, default: false },
});

defineEmits(['update:modelValue']);
</script>
