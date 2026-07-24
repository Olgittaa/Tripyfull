<template>
  <table class="table">
    <thead>
      <tr>
        <th v-for="c in columns" :key="c.key" :style="{ textAlign: c.align || 'left' }">
          {{ c.label }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(row, i) in rows" :key="i">
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
});
</script>
