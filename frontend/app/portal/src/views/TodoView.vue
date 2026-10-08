<template>
  <div class="page-content page-content--full">
    <div class="page-head">
      <div>
        <h1>{{ t('todo.title') }}</h1>
        <!-- Explanation, not data: on a phone the list gets the height. -->
        <p class="phone-hide">{{ t('todo.subtitle') }}</p>
      </div>
      <div class="page-head-actions" data-tour="todo-actions">
        <TfButton variant="secondary" @click="openSuggestions" :disabled="loadingSuggestions">
          <i class="pi pi-sparkles" style="font-size: 14px"></i>
          {{ t('todo.suggestions')
          }}<template v-if="suggestionCount"> · {{ suggestionCount }}</template>
        </TfButton>
        <TfButton variant="primary" @click="openEditor(null)">
          <i class="pi pi-plus" style="font-size: 14px"></i> {{ t('todo.newBtn') }}
        </TfButton>
      </div>
    </div>

    <div v-if="loading" style="display: flex; flex-direction: column; gap: 16px">
      <div class="skeleton" style="height: 56px"></div>
      <div class="skeleton" style="height: 220px"></div>
      <div class="skeleton" style="height: 220px"></div>
    </div>

    <template v-else>
      <!-- One line of state: how far along, and whether anything is late. -->
      <div v-if="todos.length" class="todo-summary">
        <TfProgress :label="t('todo.done')" :value="doneShare" style="flex: 1; min-width: 220px" />
        <span class="todo-summary-text">{{
          t('todo.doneOf', { done: doneCount, total: todos.length })
        }}</span>
        <TfBadge v-if="overdueCount" tone="danger" variant="soft" dot>{{
          t('todo.overdue', { count: overdueCount })
        }}</TfBadge>
        <TfBadge v-else-if="dueSoonCount" tone="warning" variant="soft" dot>{{
          t('todo.dueThisWeek', { count: dueSoonCount })
        }}</TfBadge>
      </div>

      <div v-if="!todos.length" class="empty-state">
        <div class="empty-state-icon"><i class="pi pi-check-square"></i></div>
        <h3>{{ t('todo.empty') }}</h3>
        <p>{{ t('todo.subtitle') }}</p>
        <TfButton variant="primary" @click="openEditor(null)">
          <i class="pi pi-plus" style="font-size: 14px"></i> {{ t('todo.addFirst') }}
        </TfButton>
      </div>

      <div v-else class="todo-groups">
        <section v-for="g in groups" :key="g.key ?? '—'" class="todo-group">
          <header class="todo-group-head">
            <h3>{{ g.name }}</h3>
            <span class="todo-group-count">{{ g.done }}/{{ g.items.length }}</span>
          </header>

          <ul class="todo-list">
            <li
              v-for="item in g.items"
              :key="item.id"
              class="todo-row"
              :class="{ 'todo-row--done': item.done }"
              @click="openEditor(item)"
            >
              <label class="checkbox todo-check" @click.stop>
                <input
                  class="checkbox-input"
                  type="checkbox"
                  :checked="item.done"
                  @change="toggleDone(item, $event.target.checked)"
                />
              </label>
              <div class="todo-main">
                <div class="todo-title">{{ item.title }}</div>
                <div v-if="item.notes" class="todo-notes">{{ item.notes }}</div>
              </div>
              <TfBadge
                v-if="item.dueDate"
                size="sm"
                :tone="dueTone(item)"
                :variant="item.done ? 'soft' : dueTone(item) === 'neutral' ? 'soft' : 'solid'"
                >{{ dueLabel(item) }}</TfBadge
              >
            </li>
          </ul>

          <!-- Quick add straight into this group: Enter saves, the field stays for the next one. -->
          <form class="todo-quick" @submit.prevent="quickAdd(g.key)">
            <i class="pi pi-plus"></i>
            <input
              v-model="quick[g.key ?? '']"
              class="todo-quick-input"
              :placeholder="t('todo.addTo', { group: g.name })"
              :disabled="savingQuick === (g.key ?? '')"
            />
          </form>
        </section>
      </div>
    </template>

    <!-- Editor: the full shape of one to-do -->
    <TfDrawer v-model="showEditor" :title="editing ? t('todo.edit') : t('todo.new')">
      <form @submit.prevent="saveEditor">
        <TfDrawerSection :label="t('todo.section')">
          <TfInput
            v-model="form.title"
            :label="t('todo.titleLabel')"
            required
            :error="attempted && !form.title.trim() ? t('todo.titleError') : ''"
            :placeholder="t('todo.titlePlaceholder')"
          />
          <TfSelect
            v-model="groupChoice"
            :label="t('todo.group')"
            :options="groupOptions"
            :placeholder="t('todo.noGroup')"
            :helper="groupChoice === newGroupOption ? '' : t('todo.groupHelper')"
          />
          <TfInput
            v-if="groupChoice === newGroupOption"
            v-model="form.newGroup"
            :label="t('todo.newGroup')"
            :placeholder="t('todo.newGroupPlaceholder')"
          />
          <TfDatePicker
            v-model="form.dueDate"
            mode="date"
            :label="t('todo.due')"
            :view-date="tripStart"
            clearable
          />
          <TfTextarea
            v-model="form.notes"
            :label="t('todo.notes')"
            :placeholder="t('todo.notesPlaceholder')"
            :maxlength="NOTE_MAX"
          />
        </TfDrawerSection>
      </form>
      <template #footer>
        <TfButton v-if="editing" variant="danger" icon="pi-trash" @click="removeEditing">{{
          t('common.delete')
        }}</TfButton>
        <span style="flex: 1"></span>
        <TfButton variant="ghost" @click="showEditor = false">{{ t('common.cancel') }}</TfButton>
        <TfButton variant="primary" @click="saveEditor" :disabled="saving">
          {{ saving ? t('settings.saving') : editing ? t('common.save') : t('common.add') }}
        </TfButton>
      </template>
    </TfDrawer>

    <!-- Suggestions: ours, dated against this trip, added on request only -->
    <TfModal
      v-model="showSuggestions"
      :title="t('todo.sugTitle')"
      :subtitle="tripStart ? t('todo.sugSubWithDates') : t('todo.sugSubNoDates')"
      size="lg"
    >
      <div v-if="!suggestions.length" class="text-muted" style="padding: 12px 0">
        {{ t('todo.sugEmpty') }}
      </div>
      <div v-else class="sug-groups">
        <div class="sug-toolbar">
          <button type="button" class="link-btn" @click="selectAll(true)">
            {{ t('todo.selectAll') }}
          </button>
          <span class="text-subtle">·</span>
          <button type="button" class="link-btn" @click="selectAll(false)">
            {{ t('todo.selectNone') }}
          </button>
          <span style="flex: 1"></span>
          <span class="text-subtle text-sm">{{
            t('todo.selected', { count: selectedKeys.size })
          }}</span>
        </div>
        <section v-for="g in suggestionGroups" :key="g.name" class="sug-group">
          <h4>{{ g.name }}</h4>
          <label v-for="s in g.items" :key="s.key" class="sug-row">
            <input
              class="checkbox-input"
              type="checkbox"
              :checked="selectedKeys.has(s.key)"
              @change="toggleKey(s.key, $event.target.checked)"
            />
            <div class="sug-main">
              <div class="sug-title">{{ s.title }}</div>
              <div class="sug-why">{{ s.why }}</div>
            </div>
            <span v-if="s.dueDate" class="sug-due">{{ formatDateShort(s.dueDate) }}</span>
          </label>
        </section>
      </div>
      <template #footer>
        <TfButton variant="ghost" @click="showSuggestions = false">{{
          t('common.close')
        }}</TfButton>
        <TfButton
          variant="primary"
          :disabled="!selectedKeys.size || addingSuggestions"
          @click="addSelected"
        >
          {{ addingSuggestions ? t('todo.adding') : t('todo.addN', { count: selectedKeys.size }) }}
        </TfButton>
      </template>
    </TfModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import {
  api,
  formatDateShort,
  formatDateRange,
  NOTE_MAX,
  parseDate,
  toDateStr,
  t,
} from '@tripyfull/core';
import {
  TfButton,
  TfBadge,
  TfProgress,
  TfDrawer,
  TfDrawerSection,
  TfInput,
  TfSelect,
  TfTextarea,
  TfDatePicker,
  TfModal,
  toast,
  confirm,
} from '@tripyfull/ui';

const route = useRoute();
const tripId = route.params.tripId;

const loading = ref(true);
const tripTitle = ref('');
const tripStart = ref(null);
const tripEnd = ref(null);
const tripDates = computed(() =>
  tripStart.value ? formatDateRange(toDateStr(tripStart.value), toDateStr(tripEnd.value)) : '',
);

const todos = ref([]);
// The catch-all group has no name of its own: null is its key everywhere, and
// only what the screen prints is translated.
const otherGroupName = () => t('todo.otherGroup');

/* ---- grouping ----
   Groups are whatever the owner typed; within one, open items lead, earliest
   due first, and finished ones sink to the bottom. */
const groups = computed(() => {
  const byName = new Map();
  for (const item of todos.value) {
    const key = item.groupName || null;
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key).push(item);
  }
  const sortItems = (a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate || b.dueDate) return a.dueDate ? -1 : 1;
    return a.orderIndex - b.orderIndex;
  };
  const out = [...byName.entries()].map(([key, items]) => ({
    key,
    name: key ?? otherGroupName(),
    items: items.sort(sortItems),
    done: items.filter((item) => item.done).length,
  }));
  // Groups by their earliest open due date, the catch-all last.
  const firstDue = (g) => g.items.find((item) => !item.done && item.dueDate)?.dueDate || '9999';
  return out.sort((a, b) => {
    if (a.key === null) return 1;
    if (b.key === null) return -1;
    return firstDue(a).localeCompare(firstDue(b)) || a.name.localeCompare(b.name);
  });
});

const doneCount = computed(() => todos.value.filter((item) => item.done).length);
const doneShare = computed(() =>
  todos.value.length ? (doneCount.value / todos.value.length) * 100 : 0,
);

/* ---- due dates ---- */
const todayStr = () => toDateStr(new Date());
const daysUntil = (item) =>
  Math.round((parseDate(item.dueDate) - parseDate(todayStr())) / 86400000);
const overdueCount = computed(
  () => todos.value.filter((item) => !item.done && item.dueDate && daysUntil(item) < 0).length,
);
const dueSoonCount = computed(
  () =>
    todos.value.filter(
      (item) => !item.done && item.dueDate && daysUntil(item) >= 0 && daysUntil(item) <= 7,
    ).length,
);
const dueTone = (item) => {
  if (item.done) return 'neutral';
  const d = daysUntil(item);
  if (d < 0) return 'danger';
  if (d <= 7) return 'warning';
  return 'neutral';
};
const dueLabel = (item) => {
  const d = daysUntil(item);
  if (item.done) return formatDateShort(item.dueDate);
  if (d < -1) return t('todo.daysLate', { count: -d });
  if (d === -1) return t('todo.yesterday');
  if (d === 0) return t('todo.today');
  if (d === 1) return t('todo.tomorrow');
  if (d <= 7) return t('todo.inDays', { count: d });
  return formatDateShort(item.dueDate);
};

/* ---- loading ---- */
const load = async () => {
  const [tripRes, todosRes] = await Promise.all([
    api.get(`/api/trips/${tripId}`),
    api.get(`/api/trips/${tripId}/todos`),
  ]);
  tripTitle.value = tripRes.data.title;
  tripStart.value = parseDate(tripRes.data.startDate);
  tripEnd.value = parseDate(tripRes.data.endDate);
  todos.value = todosRes.data;
};

const replaceLocal = (data) => {
  const i = todos.value.findIndex((item) => item.id === data.id);
  if (i !== -1) todos.value[i] = data;
  else todos.value.push(data);
};

const toggleDone = async (item, done) => {
  try {
    const res = await api.patch(`/api/todos/${item.id}`, { done });
    replaceLocal(res.data);
  } catch {
    toast.danger(t('common.error'), t('todo.updateFailed'));
  }
};

/* ---- quick add ---- */
const quick = ref({});
const savingQuick = ref('');
const quickAdd = async (groupKey) => {
  const slot = groupKey ?? '';
  const title = (quick.value[slot] || '').trim();
  if (!title) return;
  savingQuick.value = slot;
  try {
    const res = await api.post(`/api/trips/${tripId}/todos`, { title, groupName: groupKey });
    todos.value.push(res.data);
    quick.value[slot] = '';
  } catch {
    toast.danger(t('common.error'), t('todo.addFailed'));
  } finally {
    savingQuick.value = '';
  }
};

/* ---- editor ---- */
const newGroupOption = computed(() => t('todo.newGroupOption'));
const showEditor = ref(false);
const editing = ref(null);
const saving = ref(false);
const attempted = ref(false);
const form = ref({ title: '', notes: '', dueDate: null, newGroup: '' });
const groupChoice = ref('');

const existingGroups = computed(() =>
  [...new Set(todos.value.map((item) => item.groupName).filter(Boolean))].sort(),
);
const groupOptions = computed(() => [...existingGroups.value, newGroupOption.value]);

const openEditor = (item) => {
  editing.value = item;
  attempted.value = false;
  form.value = {
    title: item?.title || '',
    notes: item?.notes || '',
    dueDate: item?.dueDate ? parseDate(item.dueDate) : null,
    newGroup: '',
  };
  groupChoice.value = item?.groupName || '';
  showEditor.value = true;
};

const chosenGroup = () =>
  groupChoice.value === newGroupOption.value ? form.value.newGroup.trim() : groupChoice.value;

const saveEditor = async () => {
  attempted.value = true;
  if (!form.value.title.trim()) return;
  saving.value = true;
  try {
    const payload = {
      title: form.value.title.trim(),
      notes: form.value.notes,
      // PATCH keeps nulls, so an empty group is sent as '' and cleared server-side.
      groupName: chosenGroup() || '',
      dueDate: form.value.dueDate ? toDateStr(form.value.dueDate) : null,
      clearDueDate: editing.value ? !form.value.dueDate : undefined,
    };
    const res = editing.value
      ? await api.patch(`/api/todos/${editing.value.id}`, payload)
      : await api.post(`/api/trips/${tripId}/todos`, payload);
    replaceLocal(res.data);
    showEditor.value = false;
    toast.success(editing.value ? t('common.saved') : t('common.added'), res.data.title);
  } catch {
    toast.danger(t('common.error'), t('todo.saveFailed'));
  } finally {
    saving.value = false;
  }
};

const removeEditing = async () => {
  const item = editing.value;
  if (!item) return;
  const ok = await confirm({
    title: t('todo.deleteTitle'),
    message: t('todo.deleteMsg', { title: item.title }),
    tone: 'danger',
    confirmLabel: t('common.delete'),
    cancelLabel: t('common.cancel'),
  });
  if (!ok) return;
  try {
    await api.delete(`/api/todos/${item.id}`);
    todos.value = todos.value.filter((x) => x.id !== item.id);
    showEditor.value = false;
  } catch {
    toast.danger(t('common.error'), t('todo.deleteFailed'));
  }
};

/* ---- suggestions ---- */
const showSuggestions = ref(false);
const loadingSuggestions = ref(false);
const addingSuggestions = ref(false);
const suggestions = ref([]);
const suggestionCount = computed(() => suggestions.value.length);
const selectedKeys = ref(new Set());

const suggestionGroups = computed(() => {
  const byName = new Map();
  for (const s of suggestions.value) {
    if (!byName.has(s.groupName)) byName.set(s.groupName, []);
    byName.get(s.groupName).push(s);
  }
  return [...byName.entries()].map(([name, items]) => ({ name, items }));
});

const loadSuggestions = async () => {
  loadingSuggestions.value = true;
  try {
    suggestions.value = (await api.get(`/api/trips/${tripId}/todos/suggestions`)).data;
  } catch {
    suggestions.value = [];
  } finally {
    loadingSuggestions.value = false;
  }
};

const openSuggestions = async () => {
  await loadSuggestions();
  selectedKeys.value = new Set();
  showSuggestions.value = true;
};
const toggleKey = (key, on) => {
  const next = new Set(selectedKeys.value);
  on ? next.add(key) : next.delete(key);
  selectedKeys.value = next;
};
const selectAll = (on) => {
  selectedKeys.value = on ? new Set(suggestions.value.map((s) => s.key)) : new Set();
};
const addSelected = async () => {
  addingSuggestions.value = true;
  try {
    const res = await api.post(`/api/trips/${tripId}/todos/from-suggestions`, {
      keys: [...selectedKeys.value],
    });
    todos.value.push(...res.data);
    toast.success(t('todo.addedToList'), t('todo.addedCount', { count: res.data.length }));
    showSuggestions.value = false;
    await loadSuggestions();
  } catch {
    toast.danger(t('common.error'), t('todo.sugAddFailed'));
  } finally {
    addingSuggestions.value = false;
  }
};

onMounted(async () => {
  try {
    await Promise.all([load(), loadSuggestions()]);
  } catch {
    toast.danger(t('common.error'), t('todo.loadFailed'));
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.todo-summary {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex-wrap: wrap;
  margin: 0 0 var(--space-6);
  padding: var(--space-3) var(--space-4);
  background: var(--card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
}
.todo-summary-text {
  font: var(--type-small);
  color: var(--text-secondary);
  white-space: nowrap;
}

/* Groups side by side where the width allows; each is one card. The 340px
   minimum yields to the screen on a narrow phone. */
.todo-groups {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(340px, 100%), 1fr));
  gap: var(--space-4);
  align-items: start;
}
.todo-group {
  background: var(--card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  overflow: hidden;
}
.todo-group-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-default);
}
.todo-group-head h3 {
  margin: 0;
  font: var(--fw-semibold) var(--text-base) / 1.3 var(--font-display);
  color: var(--text-primary);
}
.todo-group-count {
  font: var(--type-code);
  color: var(--text-secondary);
}
.todo-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.todo-row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-default);
  cursor: pointer;
}
.todo-row:hover {
  background: var(--surface);
}
.todo-check {
  margin-top: 1px;
}
.todo-main {
  flex: 1;
  min-width: 0;
}
.todo-title {
  font: var(--fw-medium) var(--text-sm) / 1.4 var(--font-sans);
  color: var(--text-primary);
  overflow-wrap: anywhere;
}
.todo-row--done .todo-title {
  color: var(--text-secondary);
  text-decoration: line-through;
}
.todo-notes {
  margin-top: 2px;
  font: var(--fw-regular) var(--text-xs) / 1.4 var(--font-sans);
  color: var(--text-secondary);
  overflow-wrap: anywhere;
}
.todo-quick {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  color: var(--text-disabled);
}
.todo-quick-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  padding: 6px 0;
  font: var(--fw-regular) var(--text-sm) / 1.4 var(--font-sans);
  color: var(--text-primary);
}
.todo-quick-input::placeholder {
  color: var(--text-disabled);
}
.todo-quick:focus-within {
  color: var(--primary);
}

/* Suggestions modal */
.sug-toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}
.sug-group + .sug-group {
  margin-top: var(--space-4);
}
.sug-group h4 {
  margin: 0 0 var(--space-2);
  font: var(--type-code);
  text-transform: uppercase;
  letter-spacing: var(--ls-caps);
  color: var(--text-secondary);
}
.sug-row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
}
.sug-row:hover {
  background: var(--surface);
}
.sug-row .checkbox-input {
  margin-top: 2px;
}
.sug-main {
  flex: 1;
  min-width: 0;
}
.sug-title {
  font: var(--fw-medium) var(--text-sm) / 1.4 var(--font-sans);
  color: var(--text-primary);
}
.sug-why {
  font: var(--fw-regular) var(--text-xs) / 1.4 var(--font-sans);
  color: var(--text-secondary);
}
.sug-due {
  font: var(--fw-medium) var(--text-xs) / 1.4 var(--font-mono);
  color: var(--text-secondary);
  white-space: nowrap;
}

/* ---- Phones: last in the file, so these win over the rules above ---- */
@media (max-width: 700px) {
  /* The state line: progress on top, the count and the badge under it. */
  .todo-summary {
    gap: var(--space-2) var(--space-3);
    padding: var(--space-3);
    margin-bottom: var(--space-4);
  }
  /* A suggestion's date leaves the right column, which was squeezing the
     reason into three lines, and sits under the text, in line with it. */
  .sug-row {
    flex-wrap: wrap;
  }
  .sug-due {
    flex-basis: 100%;
    padding-left: calc(20px + var(--space-3));
  }
}
</style>
