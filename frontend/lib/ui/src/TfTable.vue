<template>
  <table class="table">
    <thead>
      <tr>
        <th
          v-for="c in columns"
          :key="c.key"
          :style="{ textAlign: c.align || 'left', width: c.width || null }"
        >
          {{ c.label }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="(row, i) in rows"
        :key="rowKey ? row[rowKey] : i"
        :class="typeof rowClass === 'function' ? rowClass(row) : rowClass"
        @click="$emit('row-click', row)"
      >
        <td v-for="c in columns" :key="c.key" :style="{ textAlign: c.align || 'left' }">
          <slot :name="c.key" :row="row" :value="row[c.key]">{{ row[c.key] }}</slot>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
defineProps({
  columns: { type: Array, default: () => [] },
  rows: { type: Array, default: () => [] },
  // Optional: field used as the row :key (falls back to the index).
  rowKey: { type: String, default: '' },
  // Optional: class per row — a string or (row) => string/object.
  rowClass: { type: [String, Function], default: '' },
});
defineEmits(['row-click']);
</script>
