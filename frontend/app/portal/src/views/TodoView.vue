<template>
  <div class="page-content page-content--full">
    <div class="page-head">
      <div>
        <h1>To-do</h1>
        <!-- Explanation, not data: on a phone the list gets the height. -->
        <p class="phone-hide">
          What has to happen before you leave, on the way, and once you are back.
        </p>
      </div>
      <div class="page-head-actions">
        <TfButton variant="secondary" @click="openSuggestions" :disabled="loadingSuggestions">
          <i class="pi pi-sparkles" style="font-size: 14px"></i>
          Suggestions<template v-if="suggestionCount"> · {{ suggestionCount }}</template>
        </TfButton>
        <TfButton variant="primary" @click="openEditor(null)">
          <i class="pi pi-plus" style="font-size: 14px"></i> To-do
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
        <TfProgress label="Done" :value="doneShare" style="flex: 1; min-width: 220px" />
        <span class="todo-summary-text">{{ doneCount }} of {{ todos.length }} done</span>
        <TfBadge v-if="overdueCount" tone="danger" variant="soft" dot
          >{{ overdueCount }} overdue</TfBadge
        >
        <TfBadge v-else-if="dueSoonCount" tone="warning" variant="soft" dot
          >{{ dueSoonCount }} due this week</TfBadge
        >
      </div>

      <div v-if="!todos.length" class="empty-state">
        <div class="empty-state-icon"><i class="pi pi-check-square"></i></div>
        <h3>Nothing on the list yet</h3>
        <p>Start from our suggestions, or add your own to-dos and group them as you like.</p>
        <div style="display: flex; gap: 10px; justify-content: center">
          <TfButton variant="primary" @click="openSuggestions">
            <i class="pi pi-sparkles" style="font-size: 14px"></i> See suggestions
          </TfButton>
          <TfButton variant="secondary" @click="openEditor(null)">
            <i class="pi pi-plus" style="font-size: 14px"></i> Add a to-do
          </TfButton>
        </div>
      </div>

      <div v-else class="todo-groups">
        <section v-for="g in groups" :key="g.name" class="todo-group">
          <header class="todo-group-head">
            <h3>{{ g.name }}</h3>
            <span class="todo-group-count">{{ g.done }}/{{ g.items.length }}</span>
          </header>

          <ul class="todo-list">
            <li
              v-for="t in g.items"
              :key="t.id"
              class="todo-row"
              :class="{ 'todo-row--done': t.done }"
              @click="openEditor(t)"
            >
              <label class="checkbox todo-check" @click.stop>
                <input
                  class="checkbox-input"
                  type="checkbox"
                  :checked="t.done"
                  @change="toggleDone(t, $event.target.checked)"
                />
              </label>
              <div class="todo-main">
                <div class="todo-title">
                  {{ t.title }}
                  <span
                    v-if="t.templateKey"
                    class="todo-from-us"
                    v-tooltip="'One of our suggestions'"
                    ><i class="pi pi-sparkles"></i
                  ></span>
                </div>
                <div v-if="t.notes" class="todo-notes">{{ t.notes }}</div>
              </div>
              <TfBadge
                v-if="t.dueDate"
                size="sm"
                :tone="dueTone(t)"
                :variant="t.done ? 'soft' : dueTone(t) === 'neutral' ? 'soft' : 'solid'"
                >{{ dueLabel(t) }}</TfBadge
              >
            </li>
          </ul>

          <!-- Quick add straight into this group: Enter saves, the field stays for the next one. -->
          <form class="todo-quick" @submit.prevent="quickAdd(g.name)">
            <i class="pi pi-plus"></i>
            <input
              v-model="quick[g.name]"
              class="todo-quick-input"
              :placeholder="`Add to ${g.name}…`"
              :disabled="savingQuick === g.name"
            />
          </form>
        </section>
      </div>
    </template>

    <!-- Editor: the full shape of one to-do -->
    <TfDrawer v-model="showEditor" :title="editing ? 'Edit to-do' : 'New to-do'">
      <form @submit.prevent="saveEditor">
        <TfDrawerSection label="To-do">
          <TfInput
            v-model="form.title"
            label="Title"
            required
            :error="attempted && !form.title.trim() ? 'Say what has to be done' : ''"
            placeholder="e.g. Buy travel insurance"
          />
          <TfSelect
            v-model="groupChoice"
            label="Group"
            :options="groupOptions"
            placeholder="No group"
            :helper="
              groupChoice === NEW_GROUP ? '' : 'Groups are yours: pick one or start a new one.'
            "
          />
          <TfInput
            v-if="groupChoice === NEW_GROUP"
            v-model="form.newGroup"
            label="New group"
            placeholder="e.g. Documents, Packing, Home"
          />
          <TfDatePicker
            v-model="form.dueDate"
            mode="date"
            label="Due"
            :view-date="tripStart"
            clearable
          />
          <TfTextarea
            v-model="form.notes"
            label="Notes"
            placeholder="Details, links, who to call"
          />
        </TfDrawerSection>
      </form>
      <template #footer>
        <TfButton v-if="editing" variant="danger" icon="pi-trash" @click="removeEditing"
          >Delete</TfButton
        >
        <span style="flex: 1"></span>
        <TfButton variant="ghost" @click="showEditor = false">Cancel</TfButton>
        <TfButton variant="primary" @click="saveEditor" :disabled="saving">
          {{ saving ? 'Saving…' : editing ? 'Save' : 'Add' }}
        </TfButton>
      </template>
    </TfDrawer>

    <!-- Suggestions: ours, dated against this trip, added on request only -->
    <TfModal
      v-model="showSuggestions"
      title="Suggested to-dos"
      :subtitle="
        tripStart
          ? 'Due dates are counted from your departure and return.'
          : 'Set the trip dates to get due dates with these.'
      "
      size="lg"
    >
      <div v-if="!suggestions.length" class="text-muted" style="padding: 12px 0">
        Everything we know to suggest is already on your list.
      </div>
      <div v-else class="sug-groups">
        <div class="sug-toolbar">
          <button type="button" class="link-btn" @click="selectAll(true)">Select all</button>
          <span class="text-subtle">·</span>
          <button type="button" class="link-btn" @click="selectAll(false)">None</button>
          <span style="flex: 1"></span>
          <span class="text-subtle text-sm">{{ selectedKeys.size }} selected</span>
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
        <TfButton variant="ghost" @click="showSuggestions = false">Close</TfButton>
        <TfButton
          variant="primary"
          :disabled="!selectedKeys.size || addingSuggestions"
          @click="addSelected"
        >
          {{
            addingSuggestions
              ? 'Adding…'
              : `Add ${selectedKeys.size || ''} to my list`.replace('  ', ' ')
          }}
        </TfButton>
      </template>
    </TfModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { api, formatDateShort, formatDateRange, parseDate, toDateStr } from '@tripyfull/core';
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
const NO_GROUP = 'Other';

/* ---- grouping ----
   Groups are whatever the owner typed; within one, open items lead, earliest
   due first, and finished ones sink to the bottom. */
const groups = computed(() => {
  const byName = new Map();
  for (const t of todos.value) {
    const name = t.groupName || NO_GROUP;
    if (!byName.has(name)) byName.set(name, []);
    byName.get(name).push(t);
  }
  const sortItems = (a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate || b.dueDate) return a.dueDate ? -1 : 1;
    return a.orderIndex - b.orderIndex;
  };
  const out = [...byName.entries()].map(([name, items]) => ({
    name,
    items: items.sort(sortItems),
    done: items.filter((t) => t.done).length,
  }));
  // Groups by their earliest open due date, the catch-all last.
  const firstDue = (g) => g.items.find((t) => !t.done && t.dueDate)?.dueDate || '9999';
  return out.sort((a, b) => {
    if (a.name === NO_GROUP) return 1;
    if (b.name === NO_GROUP) return -1;
    return firstDue(a).localeCompare(firstDue(b)) || a.name.localeCompare(b.name);
  });
});

const doneCount = computed(() => todos.value.filter((t) => t.done).length);
const doneShare = computed(() =>
  todos.value.length ? (doneCount.value / todos.value.length) * 100 : 0,
);

/* ---- due dates ---- */
const today = () => toDateStr(new Date());
const daysUntil = (t) => Math.round((parseDate(t.dueDate) - parseDate(today())) / 86400000);
const overdueCount = computed(
  () => todos.value.filter((t) => !t.done && t.dueDate && daysUntil(t) < 0).length,
);
const dueSoonCount = computed(
  () =>
    todos.value.filter((t) => !t.done && t.dueDate && daysUntil(t) >= 0 && daysUntil(t) <= 7)
      .length,
);
const dueTone = (t) => {
  if (t.done) return 'neutral';
  const d = daysUntil(t);
  if (d < 0) return 'danger';
  if (d <= 7) return 'warning';
  return 'neutral';
};
const dueLabel = (t) => {
  const d = daysUntil(t);
  if (t.done) return formatDateShort(t.dueDate);
  if (d < -1) return `${-d} days late`;
  if (d === -1) return 'Yesterday';
  if (d === 0) return 'Today';
  if (d === 1) return 'Tomorrow';
  if (d <= 7) return `In ${d} days`;
  return formatDateShort(t.dueDate);
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
  const i = todos.value.findIndex((t) => t.id === data.id);
  if (i !== -1) todos.value[i] = data;
  else todos.value.push(data);
};

const toggleDone = async (t, done) => {
  try {
    const res = await api.patch(`/api/todos/${t.id}`, { done });
    replaceLocal(res.data);
  } catch {
    toast.danger('Error', 'Could not update the to-do');
  }
};

/* ---- quick add ---- */
const quick = ref({});
const savingQuick = ref('');
const quickAdd = async (groupName) => {
  const title = (quick.value[groupName] || '').trim();
  if (!title) return;
  savingQuick.value = groupName;
  try {
    const res = await api.post(`/api/trips/${tripId}/todos`, {
      title,
      groupName: groupName === NO_GROUP ? null : groupName,
    });
    todos.value.push(res.data);
    quick.value[groupName] = '';
  } catch {
    toast.danger('Error', 'Could not add the to-do');
  } finally {
    savingQuick.value = '';
  }
};

/* ---- editor ---- */
const NEW_GROUP = '+ New group…';
const showEditor = ref(false);
const editing = ref(null);
const saving = ref(false);
const attempted = ref(false);
const form = ref({ title: '', notes: '', dueDate: null, newGroup: '' });
const groupChoice = ref('');

const existingGroups = computed(() =>
  [...new Set(todos.value.map((t) => t.groupName).filter(Boolean))].sort(),
);
const groupOptions = computed(() => [...existingGroups.value, NEW_GROUP]);

const openEditor = (t) => {
  editing.value = t;
  attempted.value = false;
  form.value = {
    title: t?.title || '',
    notes: t?.notes || '',
    dueDate: t?.dueDate ? parseDate(t.dueDate) : null,
    newGroup: '',
  };
  groupChoice.value = t?.groupName || '';
  showEditor.value = true;
};

const chosenGroup = () =>
  groupChoice.value === NEW_GROUP ? form.value.newGroup.trim() : groupChoice.value;

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
    toast.success(editing.value ? 'Saved' : 'Added', res.data.title);
  } catch {
    toast.danger('Error', 'Could not save the to-do');
  } finally {
    saving.value = false;
  }
};

const removeEditing = async () => {
  const t = editing.value;
  if (!t) return;
  const ok = await confirm({
    title: 'Delete to-do',
    message: `Remove "${t.title}"?`,
    tone: 'danger',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
  });
  if (!ok) return;
  try {
    await api.delete(`/api/todos/${t.id}`);
    todos.value = todos.value.filter((x) => x.id !== t.id);
    showEditor.value = false;
  } catch {
    toast.danger('Error', 'Could not delete the to-do');
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
    toast.success(
      'Added to your list',
      `${res.data.length} to-do${res.data.length === 1 ? '' : 's'}`,
    );
    showSuggestions.value = false;
    await loadSuggestions();
  } catch {
    toast.danger('Error', 'Could not add the suggestions');
  } finally {
    addingSuggestions.value = false;
  }
};

onMounted(async () => {
  try {
    await Promise.all([load(), loadSuggestions()]);
  } catch {
    toast.danger('Error', 'Failed to load the to-do list');
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
.todo-from-us {
  margin-left: 4px;
  color: var(--text-disabled);
  font-size: 11px;
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
