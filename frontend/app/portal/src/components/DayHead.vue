<template>
  <!-- The day's head: arrows around the title on the left, the day's tools on the right.
       The title is the city, and where it is changed. -->
  <div class="day-head">
    <div class="day-head-main">
      <TfIconButton
        class="phone-hide"
        variant="outline"
        size="sm"
        label="Previous day"
        :disabled="dayIndex <= 0"
        @click="$emit('prev')"
      >
        <i class="pi pi-chevron-left"></i>
      </TfIconButton>
      <div>
        <!-- The dock and the strip already name the day on a phone; the head
             keeps the city alone there. -->
        <div class="tf-eyebrow phone-hide" style="margin-bottom: 4px">
          <template v-if="day && !day.date"
            >Reserve day {{ reserveIndex }} · outside the trip dates</template
          >
          <template v-else>Day {{ day?.dayNumber }} · {{ formatDayDate(day?.date) }}</template>
        </div>
        <h1 v-if="!editingCity" class="day-h1">
          <span class="day-h1-text">{{ day?.city || 'No city set' }}</span>
          <button
            type="button"
            class="day-h1-edit"
            aria-label="Change the city"
            @click="
              editingCity = true;
              cityDraft = day?.city || '';
            "
          >
            <i class="pi pi-pencil"></i>
          </button>
        </h1>
        <div v-else class="day-h1-form">
          <TfCitySearch
            v-model="cityDraft"
            placeholder="e.g. Tokyo, Kamakura"
            style="flex: 1"
            @select="onCitySelected"
          />
          <TfIconButton variant="ghost" size="sm" label="Save" @click="saveCity"
            ><i class="pi pi-check"></i
          ></TfIconButton>
          <TfIconButton variant="ghost" size="sm" label="Cancel" @click="editingCity = false"
            ><i class="pi pi-times"></i
          ></TfIconButton>
        </div>
      </div>
      <TfIconButton
        class="phone-hide"
        variant="outline"
        size="sm"
        label="Next day"
        :disabled="dayIndex >= dayCount - 1"
        @click="$emit('next')"
      >
        <i class="pi pi-chevron-right"></i>
      </TfIconButton>
    </div>
    <div class="day-head-actions">
      <TfButton
        variant="secondary"
        size="sm"
        @click="$emit('auto-plan')"
        title="Fill the days from your saved places, following the hotels"
      >
        <i class="pi pi-sparkles" style="font-size: 12px"></i>
        <span>Auto-plan</span>
      </TfButton>
      <TfButton
        v-if="canSort"
        variant="ghost"
        size="sm"
        @click="$emit('sort')"
        title="Reorder activities by their start time"
      >
        <i class="pi pi-sort-amount-down" style="font-size: 13px"></i>
        <span>Sort by time</span>
      </TfButton>
      <!-- Buffer days are their own reserve days now (the "+ Buffer" chip in
           the strip), so a dated day has nothing to toggle. -->
      <TfButton
        v-if="!day?.date"
        variant="ghost"
        size="sm"
        @click="$emit('remove-reserve')"
        title="Remove this reserve day"
      >
        <i class="pi pi-trash" style="font-size: 13px"></i>
        <span>Remove reserve</span>
      </TfButton>
      <TfButton
        v-if="dayCount > 1"
        variant="ghost"
        size="sm"
        @click="$emit('swap')"
        title="Swap this day's plan with another day"
      >
        <i class="pi pi-arrow-right-arrow-left" style="font-size: 13px"></i>
        <span>Swap</span>
      </TfButton>
      <TfButton class="phone-hide" variant="primary" @click="$emit('add')">
        <i class="pi pi-plus" style="font-size: 14px"></i> Activity
      </TfButton>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { api, formatDayDate } from '@tripyfull/core';
import { TfButton, TfCitySearch, TfIconButton, toast } from '@tripyfull/ui';

const props = defineProps({
  day: { type: Object, default: null },
  dayId: { type: String, required: true },
  dayIndex: { type: Number, required: true },
  dayCount: { type: Number, required: true },
  /** Which reserve day this is, when the day has no date. */
  reserveIndex: { type: Number, default: 0 },
  /** More than one stop: "Sort by time" has something to do. */
  canSort: { type: Boolean, default: false },
});
const emit = defineEmits([
  'prev',
  'next',
  'auto-plan',
  'sort',
  'remove-reserve',
  'swap',
  'add',
  'updated',
]);

// The city, edited in place of the title.
const editingCity = ref(false);
const cityDraft = ref('');
watch(
  () => props.dayId,
  () => (editingCity.value = false),
);

const onCitySelected = (item) => {
  cityDraft.value = item.name;
  saveCity();
};

const saveCity = async () => {
  try {
    const res = await api.patch(`/api/days/${props.dayId}`, { city: cityDraft.value });
    emit('updated', res.data);
    editingCity.value = false;
  } catch {
    toast.danger('Error', 'Failed to update city');
  }
};
</script>

<style scoped>
/* The day's head: arrows around the title on the left, the day's tools on the right. */
.day-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}
.day-head-main {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}
.day-h1 {
  font: var(--fw-bold) 30px/1 var(--font-display);
  letter-spacing: -0.03em;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.day-h1-text {
  min-width: 0;
}
/* The pencil that changes the city: quiet until the title is hovered. */
.day-h1-edit {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--radius-sm);
  background: none;
  color: var(--text-disabled);
  font-size: 14px;
  cursor: pointer;
  transition: color var(--dur-fast) var(--ease-out);
}
.day-h1:hover .day-h1-edit,
.day-h1-edit:focus-visible {
  color: var(--text-secondary);
}
.day-h1-edit:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--input-select-focus-bg);
}
.day-h1-form {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 320px;
}
/* The day's own buttons: they wrap under the title rather than push the page. */
.day-head-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
@media (max-width: 700px) {
  /* The head stacks: the title takes the width, and the day's three tools sit
     in one short row under it instead of piling up beside a two-line city. */
  .day-head {
    flex-wrap: wrap;
    gap: 8px 0;
    margin-bottom: 16px;
  }
  .day-head-main {
    flex: 1 1 100%;
  }
  .day-h1 {
    font-size: 24px;
    line-height: 1.1;
  }
  .day-h1-edit {
    width: 38px;
    height: 38px;
    color: var(--text-secondary);
  }
  .day-h1-form {
    min-width: 0;
  }
  /* The three tools share one row: a little less air inside each button. */
  .day-head-actions {
    gap: 6px;
  }
  .day-head-actions .btn {
    padding-inline: 10px;
  }
}
</style>
