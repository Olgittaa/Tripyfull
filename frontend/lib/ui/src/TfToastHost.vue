<template>
  <teleport to="body">
    <div class="toast-host">
      <transition-group name="toast">
        <TfToast
          v-for="t in toasts"
          :key="t.id"
          :tone="t.tone"
          :title="t.title"
          :message="t.message"
          @close="dismissToast(t.id)"
        />
      </transition-group>
    </div>
  </teleport>
</template>

<script setup>
import TfToast from './TfToast.vue';
import { toasts, dismissToast } from './toast.js';
</script>
