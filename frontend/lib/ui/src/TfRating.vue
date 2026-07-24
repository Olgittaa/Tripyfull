<template>
  <div class="rating" @mouseleave="hover = 0">
    <button
      v-for="n in max"
      :key="n"
      type="button"
      class="rating-star"
      :class="{ 'is-on': n <= (hover || modelValue) }"
      :disabled="readonly"
      @mouseenter="hover = n"
      @click="$emit('update:modelValue', n)"
    >
      <i class="pi" :class="n <= (hover || modelValue) ? 'pi-star-fill' : 'pi-star'" />
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  modelValue: { type: Number, default: 0 },
  max: { type: Number, default: 5 },
  readonly: Boolean,
});
defineEmits(['update:modelValue']);
const hover = ref(0);
</script>
