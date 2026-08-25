<template>
  <div class="page-content">
    <div class="page-head">
      <div>
        <div class="tf-eyebrow" style="margin-bottom: 8px">Library</div>
        <h1>Places</h1>
        <p>Reusable places for your trips — yours and shared public ones.</p>
      </div>
      <div class="page-head-actions">
        <TfButton
          v-if="FEATURES.geoPlaceSearch"
          icon="pi-search"
          variant="secondary"
          @click="showFindDialog = true"
          >Find</TfButton
        >
        <TfButton icon="pi-download" variant="secondary" @click="showImportDialog = true"
          >Import</TfButton
        >
        <TfButton icon="pi-plus" @click="openDialog()">Add place</TfButton>
      </div>
    </div>

    <!-- Folders -->
    <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-top: 16px">
      <button :style="chipStyle(!selectedFolderId)" @click="selectFolder(null)">All places</button>
      <button
        v-for="f in folders"
        :key="f.id"
        :style="chipStyle(selectedFolderId === f.id)"
        @click="selectFolder(f.id)"
      >
        <span
          v-if="f.color"
          :style="{
            width: '9px',
            height: '9px',
            borderRadius: '50%',
            background: f.color,
            display: 'inline-block',
          }"
        ></span>
        {{ f.name }}
        <span :style="{ opacity: 0.7 }">{{ f.placeCount }}</span>
      </button>
      <button :style="chipStyle(false)" @click="openFolderDialog()">
        <i class="pi pi-plus" style="font-size: 12px"></i> Folder
      </button>
      <template v-if="currentFolder">
        <button
          class="del-btn"
          @click="openFolderDialog(currentFolder)"
          v-tooltip="'Rename folder'"
        >
          <i class="pi pi-pencil"></i>
        </button>
        <button class="del-btn" @click="deleteFolder(currentFolder)" v-tooltip="'Delete folder'">
          <i class="pi pi-times"></i>
        </button>
      </template>
    </div>

    <!-- Filters -->
    <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end; margin-top: 16px">
      <div style="flex: 1; min-width: 180px">
        <TfInput
          v-model="filterQ"
          label="Search"
          placeholder="Filter by name"
          @keyup.enter="loadPlaces"
        />
      </div>
      <div style="width: 180px">
        <TfSelect
          label="Country"
          :modelValue="countryLabel(filterCountry)"
          @update:modelValue="
            (v) => {
              filterCountry = countryValue(v);
              loadPlaces();
            }
          "
          :options="countryLabels"
          placeholder="All"
        />
      </div>
      <div style="width: 150px">
        <TfSelect
          label="Type"
          :modelValue="typeLabelFromValue(filterType)"
          @update:modelValue="
            (v) => {
              filterType = typeValueFromLabel(v);
              loadPlaces();
            }
          "
          :options="typeLabels"
          placeholder="All"
        />
      </div>
      <div style="width: 130px">
        <TfSelect
          label="Visibility"
          :modelValue="visibilityLabelFromValue(filterVisibility)"
          @update:modelValue="
            (v) => {
              filterVisibility = visibilityValueFromLabel(v);
              loadPlaces();
            }
          "
          :options="visibilityLabels"
          placeholder="All"
        />
      </div>
      <div style="width: 140px">
        <TfSelect
          label="Source"
          :modelValue="sourceLabelFromValue(filterSource)"
          @update:modelValue="
            (v) => {
              filterSource = sourceValueFromLabel(v);
              loadPlaces();
            }
          "
          :options="sourceLabels"
          placeholder="All"
        />
      </div>
      <div style="width: 130px">
        <TfInput v-model="filterCity" label="City" placeholder="Any" @keyup.enter="loadPlaces" />
      </div>
      <div style="width: 150px">
        <TfSelect
          label="Sort"
          :modelValue="sortLabelFromValue(sortBy)"
          @update:modelValue="
            (v) => {
              sortBy = sortValueFromLabel(v);
              loadPlaces();
            }
          "
          :options="sortLabels"
        />
      </div>
      <TfButton variant="secondary" @click="loadPlaces">Apply</TfButton>
    </div>

    <div
      v-if="loading"
      class="skeleton"
      style="height: 120px; border-radius: 14px; margin-top: 16px"
    ></div>

    <template v-else-if="places.length">
      <div class="places-toolbar">
        <span class="text-muted text-sm"
          >{{ places.length }} place{{ places.length === 1 ? '' : 's' }}</span
        >
        <div class="segmented-control">
          <button
            type="button"
            class="segmented-btn"
            :class="{ 'segmented-btn--on': viewMode === 'grid' }"
            @click="viewMode = 'grid'"
            v-tooltip="'Grid'"
          >
            <i class="pi pi-th-large"></i>
          </button>
          <button
            type="button"
            class="segmented-btn"
            :class="{ 'segmented-btn--on': viewMode === 'list' }"
            @click="viewMode = 'list'"
            v-tooltip="'List'"
          >
            <i class="pi pi-bars"></i>
          </button>
        </div>
      </div>

      <TransitionGroup v-if="viewMode === 'grid'" name="gallery" tag="div" class="place-grid">
        <article v-for="p in places" :key="p.id" class="place-card">
          <div
            v-if="p.photos && p.photos.length"
            class="place-card-cover"
            :style="{ backgroundImage: `url(${p.photos[0]})` }"
          >
            <span class="place-card-cover-badge">
              <TfBadge :tone="p.visibility === 'PUBLIC' ? 'success' : 'neutral'" variant="solid">
                {{ p.visibility === 'PUBLIC' ? 'Public' : 'Private' }}
              </TfBadge>
            </span>
          </div>

          <div class="place-card-body">
            <div class="place-card-head">
              <span class="cat-icon cat-icon--lg" :style="typeStyle(p.type)">{{
                typeEmoji(p.type)
              }}</span>
              <div style="min-width: 0; flex: 1">
                <div class="place-card-name">{{ p.name }}</div>
                <div class="place-card-sub">
                  <i class="pi pi-map-marker" style="font-size: 10px"></i>
                  {{
                    [p.city, countryName(p.country)].filter(Boolean).join(' · ') ||
                    p.address ||
                    'No location'
                  }}
                </div>
              </div>
            </div>

            <div class="place-card-tags">
              <TfBadge tone="neutral" variant="soft">{{ typeLabel(p.type) }}</TfBadge>
              <TfBadge v-if="p.priority === 'MUST_SEE'" tone="gold" variant="soft"
                >⭐ Must see</TfBadge
              >
              <TfBadge v-if="p.needsBooking" tone="brand" variant="soft" dot>Book ahead</TfBadge>
              <TfBadge
                v-if="!(p.photos && p.photos.length)"
                :tone="p.visibility === 'PUBLIC' ? 'success' : 'neutral'"
                variant="soft"
              >
                {{ p.visibility === 'PUBLIC' ? 'Public' : 'Private' }}
              </TfBadge>
              <span v-if="p.source && p.source !== 'MANUAL'" class="text-subtle text-xs">{{
                p.source.toLowerCase()
              }}</span>
              <span v-if="!p.owned" class="text-subtle text-xs" style="font-style: italic"
                >· shared</span
              >
            </div>

            <p v-if="p.description" class="place-card-desc">{{ p.description }}</p>

            <div v-if="p.links && p.links.length" class="place-card-links">
              <a
                v-for="(lnk, i) in p.links"
                :key="i"
                :href="lnk"
                target="_blank"
                rel="noopener"
                class="place-link-chip"
              >
                <i class="pi pi-link" style="font-size: 10px"></i> {{ linkLabel(lnk) }}
              </a>
            </div>
          </div>

          <div class="place-card-foot">
            <div style="flex: 1">
              <TfSelect
                :modelValue="folderLabel(p.folderId)"
                @update:modelValue="(v) => assignFolder(p, folderValueFromLabel(v))"
                :options="folderLabels"
                placeholder="＋ Folder"
              />
            </div>
            <template v-if="p.owned">
              <button class="del-btn" @click="openDialog(p)" v-tooltip="'Edit'">
                <i class="pi pi-pencil"></i>
              </button>
              <button class="del-btn" @click="confirmDelete(p)" v-tooltip="'Delete'">
                <i class="pi pi-times"></i>
              </button>
            </template>
          </div>
        </article>
      </TransitionGroup>

      <!-- List view -->
      <TransitionGroup v-else name="list" tag="div" class="place-list">
        <div v-for="p in places" :key="p.id" class="item-card">
          <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0">
            <span
              v-if="p.photos && p.photos.length"
              class="place-thumb"
              :style="{ backgroundImage: `url(${p.photos[0]})` }"
            ></span>
            <span v-else class="cat-icon cat-icon--md" :style="typeStyle(p.type)">{{
              typeEmoji(p.type)
            }}</span>
            <div style="min-width: 0; flex: 1">
              <div
                class="title"
                style="
                  margin-bottom: 2px;
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  flex-wrap: wrap;
                "
              >
                {{ p.name }}
                <TfBadge tone="neutral" variant="soft">{{ typeLabel(p.type) }}</TfBadge>
                <TfBadge v-if="p.priority === 'MUST_SEE'" tone="gold" variant="soft"
                  >⭐ Must see</TfBadge
                >
                <TfBadge v-if="p.needsBooking" tone="brand" variant="soft" dot>Book ahead</TfBadge>
                <TfBadge :tone="p.visibility === 'PUBLIC' ? 'success' : 'neutral'" variant="soft">{{
                  p.visibility === 'PUBLIC' ? 'Public' : 'Private'
                }}</TfBadge>
                <span v-if="!p.owned" class="text-subtle text-xs" style="font-style: italic"
                  >shared</span
                >
              </div>
              <div class="sub text-muted text-sm">
                {{
                  [p.city, countryName(p.country)].filter(Boolean).join(' · ') || p.address || '—'
                }}
              </div>
            </div>
          </div>
          <div class="card-right" style="display: flex; gap: 6px; align-items: center">
            <div style="width: 150px">
              <TfSelect
                :modelValue="folderLabel(p.folderId)"
                @update:modelValue="(v) => assignFolder(p, folderValueFromLabel(v))"
                :options="folderLabels"
                placeholder="＋ Folder"
              />
            </div>
            <template v-if="p.owned">
              <button class="del-btn" @click="openDialog(p)" v-tooltip="'Edit'">
                <i class="pi pi-pencil"></i>
              </button>
              <button class="del-btn" @click="confirmDelete(p)" v-tooltip="'Delete'">
                <i class="pi pi-times"></i>
              </button>
            </template>
          </div>
        </div>
      </TransitionGroup>
    </template>

    <div v-if="!places.length && !loading" class="empty-state">
      <div class="empty-state-icon"><i class="pi pi-map-marker"></i></div>
      <h3>No places yet</h3>
      <p>Search above to find & save a place, or add one manually.</p>
      <TfButton icon="pi-plus" @click="openDialog()">Add place</TfButton>
    </div>

    <TfModal v-model="showDialog" :title="editing ? 'Edit place' : 'New place'">
      <form id="placeForm" @submit.prevent="save" class="dialog-form">
        <TfInput v-model="form.name" label="Name *" required placeholder="e.g. Navagio Beach" />
        <div class="form-row">
          <div style="flex: 1">
            <TfSelect
              label="Type"
              :modelValue="typeLabelFromValue(form.type)"
              @update:modelValue="(v) => (form.type = typeValueFromLabel(v))"
              :options="typeLabels"
            />
          </div>
          <div style="flex: 1">
            <TfSelect
              label="Visibility"
              :modelValue="visibilityLabelFromValue(form.visibility)"
              @update:modelValue="(v) => (form.visibility = visibilityValueFromLabel(v))"
              :options="visibilityLabels"
            />
          </div>
        </div>
        <div class="form-row">
          <div style="flex: 1">
            <TfSelect
              label="Country"
              :modelValue="countryLabel(form.country)"
              @update:modelValue="(v) => (form.country = countryValue(v))"
              :options="countryLabels"
              placeholder="Country"
            />
          </div>
          <div style="flex: 1">
            <TfInput v-model="form.city" label="City" />
          </div>
        </div>
        <div class="field">
          <label
            >Address
            <span class="text-muted text-sm"
              >— auto-filled from name + city/country if left blank</span
            ></label
          >
          <TfInput v-model="form.address" />
        </div>
        <div class="form-row">
          <div style="flex: 1">
            <TfNumberInput v-model="form.latitude" label="Latitude" type="plain" :precision="7" />
          </div>
          <div style="flex: 1">
            <TfNumberInput v-model="form.longitude" label="Longitude" type="plain" :precision="7" />
          </div>
        </div>
        <div class="form-row">
          <div style="flex: 1">
            <div class="field">
              <label>Priority</label>
              <TfSegmentedControl
                :modelValue="form.priority === 'MUST_SEE' ? '⭐ Must see' : 'Optional'"
                @update:modelValue="
                  (v) => (form.priority = v === '⭐ Must see' ? 'MUST_SEE' : 'OPTIONAL')
                "
                :options="['⭐ Must see', 'Optional']"
                size="sm"
              />
            </div>
          </div>
          <div style="flex: 1; display: flex; align-items: flex-end">
            <label class="save-place-toggle">
              <input type="checkbox" v-model="form.needsBooking" />
              <span
                ><i class="pi pi-ticket" style="font-size: 13px"></i> Needs advance booking</span
              >
            </label>
          </div>
        </div>
        <TfInput v-model="form.description" label="Description" />
        <div class="field">
          <label>Photos <span class="text-muted text-sm">(comma-separated URLs)</span></label>
          <TfInput v-model="photosText" placeholder="https://… , https://…" />
        </div>
        <div class="field">
          <label>Links <span class="text-muted text-sm">(comma-separated URLs)</span></label>
          <TfInput v-model="linksText" placeholder="https://… , https://…" />
        </div>
      </form>
      <template #footer>
        <TfButton variant="ghost" @click="showDialog = false">Cancel</TfButton>
        <TfButton type="submit" form="placeForm" icon="pi-check" :loading="saving">{{
          editing ? 'Save' : 'Add'
        }}</TfButton>
      </template>
    </TfModal>
    <TfModal v-model="showFolderDialog" :title="editingFolder ? 'Rename folder' : 'New folder'">
      <form id="folderForm" @submit.prevent="saveFolder" class="dialog-form">
        <TfInput
          v-model="folderForm.name"
          label="Name *"
          required
          placeholder="e.g. Beaches, Greece 2026"
        />
        <div class="field">
          <label>Color</label>
          <input
            type="color"
            v-model="folderForm.color"
            style="width: 48px; height: 34px; border: none; background: none; cursor: pointer"
          />
        </div>
      </form>
      <template #footer>
        <TfButton variant="ghost" @click="showFolderDialog = false">Cancel</TfButton>
        <TfButton type="submit" form="folderForm" icon="pi-check">{{
          editingFolder ? 'Save' : 'Create'
        }}</TfButton>
      </template>
    </TfModal>
    <!-- Find a place (geocode autocomplete) -->
    <TfModal v-model="showFindDialog" title="Find a place">
      <div class="dialog-form">
        <div class="field">
          <label>Search <span v-if="geocoding" class="text-muted text-sm">· saving…</span></label>
          <TfPlaceSearch placeholder="Navagio Beach, Senso-ji…" @select="onGeoPicked" />
        </div>
        <TfSelect
          label="Country"
          :modelValue="countryLabel(geocodeCountry)"
          @update:modelValue="(v) => (geocodeCountry = countryValue(v))"
          :options="countryLabels"
          placeholder="Any"
        />
        <p class="text-muted text-sm" style="margin: 0">
          Pick a suggestion to save it to your library.
        </p>
      </div>
    </TfModal>

    <!-- Import from a link -->
    <TfModal v-model="showImportDialog" title="Import a place">
      <form id="importForm" @submit.prevent="runImport" class="dialog-form">
        <TfInput
          v-model="importUrl"
          label="Google Maps or Tripadvisor link"
          placeholder="https://maps.app.goo.gl/… or tripadvisor.com/…"
          @keyup.enter="runImport"
        />
        <p class="text-muted text-sm" style="margin: 0">
          Paste a link to a single place (not a saved list or destination page).
        </p>
      </form>
      <template #footer>
        <TfButton variant="ghost" @click="showImportDialog = false">Cancel</TfButton>
        <TfButton type="submit" form="importForm" icon="pi-download" :loading="importing">{{
          importing ? 'Importing…' : 'Import'
        }}</TfButton>
      </template>
    </TfModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import {
  TfBadge,
  TfButton,
  TfInput,
  TfSelect,
  TfSegmentedControl,
  TfNumberInput,
  TfModal,
  TfPlaceSearch,
  toast,
  confirm,
} from '@tripyfull/ui';
import { useTripStore } from '@/stores/tripStore.js';
import { useRoute, useRouter } from 'vue-router';
import { FEATURES } from '@/config.js';
import { api, placeTypeMeta, PLACE_TYPE_OPTIONS } from '@tripyfull/core';

const tripStore = useTripStore();
const route = useRoute();
const router = useRouter();

// Country dropdown: full list from /api/geo/countries, with the open trip's countries pinned on top.
const allCountries = ref([]); // [{ code, name }]
const tripCountryCodes = ref([]); // ISO codes from the current trip

const countryOptions = computed(() => {
  const byCode = new Map(allCountries.value.map((c) => [c.code, c.name]));
  const seen = new Set();
  const opts = [];
  const push = (code, fromTrip) => {
    if (!code || seen.has(code)) return;
    seen.add(code);
    const name = byCode.get(code) || code;
    opts.push({ label: `${fromTrip ? '★ ' : ''}${name} (${code})`, value: code });
  };
  tripCountryCodes.value.forEach((c) => push(c, true));
  allCountries.value.forEach((c) => push(c.code, false));
  return opts;
});

const loadCountries = async () => {
  try {
    allCountries.value = (await api.get('/api/geo/countries')).data || [];
  } catch {
    /* non-fatal */
  }
  const tid = tripStore.currentTrip?.id;
  if (tid) {
    try {
      tripCountryCodes.value = (await api.get(`/api/trips/${tid}/countries`)).data || [];
    } catch {
      /* none */
    }
  }
  // Pre-select the trip's primary country for quick-add.
  if (!geocodeCountry.value && tripCountryCodes.value.length)
    geocodeCountry.value = tripCountryCodes.value[0];
};
const places = ref([]);
const loading = ref(false);
const saving = ref(false);
const showDialog = ref(false);
const editing = ref(null);

const filterQ = ref('');
const filterCountry = ref(null);
const filterType = ref(null);
const filterVisibility = ref(null);
const filterSource = ref(null);
const filterCity = ref('');
const sortBy = ref('name');
const geocodeText = ref('');
const geocodeCountry = ref(null);
const geocoding = ref(false);

const viewMode = ref('grid'); // 'grid' | 'list'
const showFindDialog = ref(false);
const showImportDialog = ref(false);

// Folders
const folders = ref([]);
const selectedFolderId = ref(null); // null = All places
const showFolderDialog = ref(false);
const editingFolder = ref(null);
const folderForm = ref({ name: '', color: '#e35a38' });

const sourceOptions = [
  { label: 'Manual', value: 'MANUAL' },
  { label: 'Geocoded', value: 'GEOCODED' },
  { label: 'Imported', value: 'IMPORTED' },
];
const sortOptions = [
  { label: 'Name', value: 'name' },
  { label: 'Recently added', value: 'recent' },
  { label: 'Type', value: 'type' },
];
const currentFolder = computed(
  () => folders.value.find((f) => f.id === selectedFolderId.value) || null,
);
const chipStyle = (active) => ({
  padding: '6px 12px',
  borderRadius: 'var(--radius-pill)',
  cursor: 'pointer',
  border: '1px solid var(--border-default)',
  background: active ? 'var(--accent)' : 'var(--card)',
  color: active ? '#fff' : 'var(--text-primary)',
  font: 'var(--fw-medium) 13px/1 var(--font-sans)',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
});

const typeOptions = PLACE_TYPE_OPTIONS;
const visibilityOptions = [
  { label: 'Private', value: 'PRIVATE' },
  { label: 'Public', value: 'PUBLIC' },
];
const typeLabel = (v) => typeOptions.find((o) => o.value === v)?.label || v;

// --- Label <-> value mapping helpers for TfSelect (string-array based) ---
const typeLabels = typeOptions.map((o) => o.label);
const typeLabelFromValue = (v) => typeOptions.find((o) => o.value === v)?.label ?? null;
const typeValueFromLabel = (l) => typeOptions.find((o) => o.label === l)?.value ?? null;

const visibilityLabels = visibilityOptions.map((o) => o.label);
const visibilityLabelFromValue = (v) => visibilityOptions.find((o) => o.value === v)?.label ?? null;
const visibilityValueFromLabel = (l) => visibilityOptions.find((o) => o.label === l)?.value ?? null;

const sourceLabels = sourceOptions.map((o) => o.label);
const sourceLabelFromValue = (v) => sourceOptions.find((o) => o.value === v)?.label ?? null;
const sourceValueFromLabel = (l) => sourceOptions.find((o) => o.label === l)?.value ?? null;

const sortLabels = sortOptions.map((o) => o.label);
const sortLabelFromValue = (v) => sortOptions.find((o) => o.value === v)?.label ?? null;
const sortValueFromLabel = (l) => sortOptions.find((o) => o.label === l)?.value ?? null;

const countryLabels = computed(() => countryOptions.value.map((o) => o.label));
const countryLabel = (v) => countryOptions.value.find((o) => o.value === v)?.label ?? null;
const countryValue = (l) => countryOptions.value.find((o) => o.label === l)?.value ?? null;

const folderLabels = computed(() => folders.value.map((f) => f.name));
const folderLabel = (id) => folders.value.find((f) => f.id === id)?.name ?? null;
const folderValueFromLabel = (name) => folders.value.find((f) => f.name === name)?.id ?? null;
const linkLabel = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

// Per-type icon + warm color (shared via @tripyfull/core).
const typeEmoji = (t) => placeTypeMeta(t).emoji;
const typeStyle = (t) => {
  const m = placeTypeMeta(t);
  return { background: m.bg, color: m.color };
};
const countryName = (code) => allCountries.value.find((c) => c.code === code)?.name || code || '';

const emptyForm = {
  name: '',
  type: 'OTHER',
  country: '',
  city: '',
  address: '',
  latitude: null,
  longitude: null,
  description: '',
  visibility: 'PRIVATE',
  priority: 'OPTIONAL',
  needsBooking: false,
};
const form = ref({ ...emptyForm });
const photosText = ref('');
const linksText = ref('');

const splitList = (s) =>
  (s || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

const openDialog = (p) => {
  if (p) {
    editing.value = p;
    form.value = {
      name: p.name,
      type: p.type || 'OTHER',
      country: p.country || '',
      city: p.city || '',
      address: p.address || '',
      latitude: p.latitude,
      longitude: p.longitude,
      description: p.description || '',
      visibility: p.visibility || 'PRIVATE',
      priority: p.priority || 'OPTIONAL',
      needsBooking: !!p.needsBooking,
    };
    photosText.value = (p.photos || []).join(', ');
    linksText.value = (p.links || []).join(', ');
  } else {
    editing.value = null;
    form.value = { ...emptyForm, country: tripCountryCodes.value[0] || '' };
    photosText.value = '';
    linksText.value = '';
  }
  showDialog.value = true;
};

const save = async () => {
  saving.value = true;
  try {
    const payload = {
      ...form.value,
      photos: splitList(photosText.value),
      links: splitList(linksText.value),
    };
    if (editing.value) {
      const res = await api.patch(`/api/places/${editing.value.id}`, payload);
      const idx = places.value.findIndex((p) => p.id === editing.value.id);
      if (idx !== -1) places.value[idx] = res.data;
    } else {
      const res = await api.post('/api/places', payload);
      places.value.unshift(res.data);
    }
    showDialog.value = false;
    toast.success('Saved');
  } catch {
    toast.danger('Error', 'Failed to save place');
  } finally {
    saving.value = false;
  }
};

const runGeocode = async (text) => {
  const query = (text || geocodeText.value || '').trim();
  if (!query) return;
  geocoding.value = true;
  try {
    const res = await api.post('/api/places/geocode', {
      text: query,
      country: geocodeCountry.value || null,
    });
    const idx = places.value.findIndex((p) => p.id === res.data.id);
    if (idx !== -1) places.value[idx] = res.data;
    else places.value.unshift(res.data);
    geocodeText.value = '';
    showFindDialog.value = false;
    toast.success('Place saved', res.data.name);
  } catch (e) {
    const msg = e.response?.status === 404 ? 'No location found' : 'Geocoding failed';
    toast.warning('Not found', msg);
  } finally {
    geocoding.value = false;
  }
};

// Picked a suggestion from the geo dropdown — save that exact place (precise displayName).
const onGeoPicked = (place) => {
  if (!place) return;
  runGeocode(place.displayName || place.name);
};

// Import a place from a Google Maps share link.
const importUrl = ref('');
const importing = ref(false);
const runImport = async () => {
  if (!importUrl.value.trim()) return;
  importing.value = true;
  try {
    const res = await api.post('/api/places/import', { url: importUrl.value.trim() });
    const idx = places.value.findIndex((p) => p.id === res.data.id);
    if (idx !== -1) places.value[idx] = res.data;
    else places.value.unshift(res.data);
    importUrl.value = '';
    showImportDialog.value = false;
    toast.success('Imported', res.data.name);
  } catch (e) {
    const msg = e.response?.status === 400 ? "Couldn't read that link" : 'Import failed';
    toast.warning('Import', msg);
  } finally {
    importing.value = false;
  }
};

const confirmDelete = (p) => {
  confirm({
    title: 'Confirm',
    message: `Delete "${p.name}"?`,
    tone: 'danger',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
  }).then(async (ok) => {
    if (!ok) return;
    try {
      await api.delete(`/api/places/${p.id}`);
      places.value = places.value.filter((x) => x.id !== p.id);
      toast.success('Deleted');
    } catch {
      toast.danger('Error', 'Failed to delete place');
    }
  });
};

const resetForm = () => {
  form.value = { ...emptyForm };
  editing.value = null;
  photosText.value = '';
  linksText.value = '';
};

// TfModal has no @hide event — reset the form whenever the place dialog closes.
watch(showDialog, (open) => {
  if (!open) resetForm();
});

const clean = (s) => (s && String(s).trim() ? String(s).trim() : undefined);

const loadPlaces = async () => {
  loading.value = true;
  try {
    const params = {
      folderId: selectedFolderId.value || undefined,
      country: filterCountry.value || undefined,
      type: filterType.value || undefined,
      visibility: filterVisibility.value || undefined,
      source: filterSource.value || undefined,
      city: clean(filterCity.value),
      q: clean(filterQ.value),
      sort: sortBy.value || undefined,
    };
    places.value = (await api.get('/api/places', { params })).data;
  } catch {
    toast.danger('Error', 'Failed to load places');
  } finally {
    loading.value = false;
  }
};

// ---- folders ----
const loadFolders = async () => {
  try {
    folders.value = (await api.get('/api/folders')).data || [];
  } catch {
    /* none */
  }
};

const selectFolder = (id) => {
  selectedFolderId.value = id;
  loadPlaces();
};

const openFolderDialog = (f) => {
  editingFolder.value = f || null;
  folderForm.value = f
    ? { name: f.name, color: f.color || '#e35a38' }
    : { name: '', color: '#e35a38' };
  showFolderDialog.value = true;
};

const saveFolder = async () => {
  if (!folderForm.value.name.trim()) return;
  try {
    if (editingFolder.value)
      await api.patch(`/api/folders/${editingFolder.value.id}`, folderForm.value);
    else await api.post('/api/folders', folderForm.value);
    showFolderDialog.value = false;
    await loadFolders();
  } catch {
    toast.danger('Error', 'Failed to save folder');
  }
};

const deleteFolder = (f) => {
  confirm({
    title: 'Confirm',
    message: `Delete folder "${f.name}"? Places stay in the library.`,
    tone: 'danger',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
  }).then(async (ok) => {
    if (!ok) return;
    try {
      await api.delete(`/api/folders/${f.id}`);
      if (selectedFolderId.value === f.id) selectedFolderId.value = null;
      await loadFolders();
      await loadPlaces();
      toast.success('Deleted');
    } catch {
      toast.danger('Error', 'Failed to delete folder');
    }
  });
};

const assignFolder = async (place, folderId) => {
  try {
    if (folderId) await api.put(`/api/folders/${folderId}/places/${place.id}`);
    else if (place.folderId) await api.delete(`/api/folders/${place.folderId}/places/${place.id}`);
    const previous = place.folderId;
    place.folderId = folderId || null;
    await loadFolders();
    // If viewing a specific folder and the place moved out of it, drop it from the list.
    if (
      selectedFolderId.value &&
      place.folderId !== selectedFolderId.value &&
      previous === selectedFolderId.value
    ) {
      places.value = places.value.filter((p) => p.id !== place.id);
    }
  } catch {
    toast.danger('Error', 'Failed to update folder');
  }
};

onMounted(async () => {
  loadCountries();
  loadFolders();
  await loadPlaces();
  // Opened from an activity's "Edit place" link → open that place's editor.
  const editId = route.query.edit;
  if (editId) {
    const p = places.value.find((x) => x.id === editId);
    if (p) openDialog(p);
    router.replace({ query: {} });
  }
});
</script>

<style scoped>
.places-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}

.place-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;
  margin-top: 12px;
  align-items: start;
}

.place-list {
  margin-top: 12px;
}

.place-thumb {
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background-size: cover;
  background-position: center;
  border: 1px solid var(--border-default);
}

.place-card {
  background: var(--card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition:
    transform var(--dur-base) var(--ease-out),
    box-shadow var(--dur-base) var(--ease-out),
    border-color var(--dur-base) var(--ease-out);
}
.place-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
  border-color: var(--border-default);
}

.place-card-cover {
  height: 116px;
  background-size: cover;
  background-position: center;
  position: relative;
}
.place-card-cover::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(33, 27, 23, 0.32), transparent 55%);
}
.place-card-cover-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1;
}

.place-card-body {
  padding: 14px 16px 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}

.place-card-head {
  display: flex;
  gap: 11px;
  align-items: flex-start;
}

.place-card-name {
  font: var(--fw-bold) 17px/1.15 var(--font-display);
  color: var(--text-primary);
  letter-spacing: -0.01em;
  word-break: break-word;
}

.place-card-sub {
  font: var(--fw-regular) 12px/1.3 var(--font-sans);
  color: var(--text-secondary);
  margin-top: 3px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.place-card-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.place-card-desc {
  font: var(--type-small);
  color: var(--text-secondary);
  font-style: italic;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.place-card-links {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.place-link-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font: var(--fw-medium) 12px/1 var(--font-sans);
  color: var(--text-link);
  background: var(--surface);
  padding: 5px 10px;
  border-radius: var(--radius-pill);
  text-decoration: none;
}
.place-link-chip:hover {
  text-decoration: none;
  filter: brightness(0.97);
}

.place-card-foot {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px 12px;
  border-top: 1px solid var(--border-default);
  margin-top: auto;
}
</style>
