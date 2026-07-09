<template>
  <div class="page-content">
    <div class="page-head">
      <div>
        <div class="tf-eyebrow" style="margin-bottom:8px">Library</div>
        <h1>Places</h1>
        <p>Reusable places for your trips — yours and shared public ones.</p>
      </div>
      <div class="page-head-actions">
        <PButton icon="pi pi-search" label="Find" severity="secondary" outlined @click="showFindDialog = true" />
        <PButton icon="pi pi-download" label="Import" severity="secondary" outlined @click="showImportDialog = true" />
        <PButton icon="pi pi-plus" label="Add place" @click="openDialog()" />
      </div>
    </div>

    <!-- Folders -->
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:16px">
      <button :style="chipStyle(!selectedFolderId)" @click="selectFolder(null)">All places</button>
      <button v-for="f in folders" :key="f.id" :style="chipStyle(selectedFolderId === f.id)" @click="selectFolder(f.id)">
        <span v-if="f.color" :style="{ width:'9px', height:'9px', borderRadius:'50%', background:f.color, display:'inline-block' }"></span>
        {{ f.name }}
        <span :style="{ opacity:.7 }">{{ f.placeCount }}</span>
      </button>
      <button :style="chipStyle(false)" @click="openFolderDialog()"><i class="pi pi-plus" style="font-size:12px"></i> Folder</button>
      <template v-if="currentFolder">
        <button class="del-btn" @click="openFolderDialog(currentFolder)" v-tooltip="'Rename folder'"><i class="pi pi-pencil"></i></button>
        <button class="del-btn" @click="deleteFolder(currentFolder)" v-tooltip="'Delete folder'"><i class="pi pi-times"></i></button>
      </template>
    </div>

    <!-- Filters -->
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;margin-top:16px">
      <div class="field" style="flex:1;min-width:180px;margin:0">
        <label>Search</label>
        <PInputText v-model="filterQ" class="w-full" placeholder="Filter by name" @keyup.enter="loadPlaces" />
      </div>
      <div class="field" style="width:180px;margin:0">
        <label>Country</label>
        <PSelect v-model="filterCountry" :options="countryOptions" optionLabel="label" optionValue="value"
                 filter showClear placeholder="All" class="w-full" @change="loadPlaces" />
      </div>
      <div class="field" style="width:150px;margin:0">
        <label>Type</label>
        <PSelect v-model="filterType" :options="typeOptions" optionLabel="label" optionValue="value"
                 showClear placeholder="All" class="w-full" @change="loadPlaces" />
      </div>
      <div class="field" style="width:130px;margin:0">
        <label>Visibility</label>
        <PSelect v-model="filterVisibility" :options="visibilityOptions" optionLabel="label" optionValue="value"
                 showClear placeholder="All" class="w-full" @change="loadPlaces" />
      </div>
      <div class="field" style="width:140px;margin:0">
        <label>Source</label>
        <PSelect v-model="filterSource" :options="sourceOptions" optionLabel="label" optionValue="value"
                 showClear placeholder="All" class="w-full" @change="loadPlaces" />
      </div>
      <div class="field" style="width:130px;margin:0">
        <label>City</label>
        <PInputText v-model="filterCity" class="w-full" placeholder="Any" @keyup.enter="loadPlaces" />
      </div>
      <div class="field" style="width:150px;margin:0">
        <label>Sort</label>
        <PSelect v-model="sortBy" :options="sortOptions" optionLabel="label" optionValue="value"
                 class="w-full" @change="loadPlaces" />
      </div>
      <PButton label="Apply" severity="secondary" outlined @click="loadPlaces" />
    </div>

    <div v-if="loading" class="skeleton" style="height:120px;border-radius:14px;margin-top:16px"></div>

    <template v-else-if="places.length">
      <div class="places-toolbar">
        <span class="text-muted text-sm">{{ places.length }} place{{ places.length === 1 ? '' : 's' }}</span>
        <div class="segmented-control">
          <button type="button" class="segmented-btn" :class="{ 'segmented-btn--on': viewMode === 'grid' }" @click="viewMode = 'grid'" v-tooltip="'Grid'"><i class="pi pi-th-large"></i></button>
          <button type="button" class="segmented-btn" :class="{ 'segmented-btn--on': viewMode === 'list' }" @click="viewMode = 'list'" v-tooltip="'List'"><i class="pi pi-bars"></i></button>
        </div>
      </div>

      <TransitionGroup v-if="viewMode === 'grid'" name="gallery" tag="div" class="place-grid">
        <article v-for="p in places" :key="p.id" class="place-card">
        <div v-if="p.photos && p.photos.length" class="place-card-cover"
             :style="{ backgroundImage: `url(${p.photos[0]})` }">
          <span class="place-card-cover-badge">
            <TfBadge :tone="p.visibility === 'PUBLIC' ? 'success' : 'neutral'" variant="solid">
              {{ p.visibility === 'PUBLIC' ? 'Public' : 'Private' }}
            </TfBadge>
          </span>
        </div>

        <div class="place-card-body">
          <div class="place-card-head">
            <span class="cat-icon cat-icon--lg" :style="typeStyle(p.type)">{{ typeEmoji(p.type) }}</span>
            <div style="min-width:0;flex:1">
              <div class="place-card-name">{{ p.name }}</div>
              <div class="place-card-sub">
                <i class="pi pi-map-marker" style="font-size:10px"></i>
                {{ [p.city, countryName(p.country)].filter(Boolean).join(' · ') || (p.address || 'No location') }}
              </div>
            </div>
          </div>

          <div class="place-card-tags">
            <TfBadge tone="neutral" variant="soft">{{ typeLabel(p.type) }}</TfBadge>
            <TfBadge v-if="!(p.photos && p.photos.length)" :tone="p.visibility === 'PUBLIC' ? 'success' : 'neutral'" variant="soft">
              {{ p.visibility === 'PUBLIC' ? 'Public' : 'Private' }}
            </TfBadge>
            <span v-if="p.source && p.source !== 'MANUAL'" class="text-subtle text-xs">{{ p.source.toLowerCase() }}</span>
            <span v-if="!p.owned" class="text-subtle text-xs" style="font-style:italic">· shared</span>
          </div>

          <p v-if="p.description" class="place-card-desc">{{ p.description }}</p>

          <div v-if="p.links && p.links.length" class="place-card-links">
            <a v-for="(lnk, i) in p.links" :key="i" :href="lnk" target="_blank" rel="noopener" class="place-link-chip">
              <i class="pi pi-link" style="font-size:10px"></i> {{ linkLabel(lnk) }}
            </a>
          </div>
        </div>

        <div class="place-card-foot">
          <PSelect :modelValue="p.folderId" @update:modelValue="v => assignFolder(p, v)"
                   :options="folderSelectOptions" optionLabel="label" optionValue="value"
                   showClear placeholder="＋ Folder" style="flex:1" />
          <template v-if="p.owned">
            <button class="del-btn" @click="openDialog(p)" v-tooltip="'Edit'"><i class="pi pi-pencil"></i></button>
            <button class="del-btn" @click="confirmDelete(p)" v-tooltip="'Delete'"><i class="pi pi-times"></i></button>
          </template>
        </div>
        </article>
      </TransitionGroup>

      <!-- List view -->
      <TransitionGroup v-else name="list" tag="div" class="place-list">
        <div v-for="p in places" :key="p.id" class="item-card">
          <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:0">
            <span v-if="p.photos && p.photos.length" class="place-thumb" :style="{ backgroundImage: `url(${p.photos[0]})` }"></span>
            <span v-else class="cat-icon cat-icon--md" :style="typeStyle(p.type)">{{ typeEmoji(p.type) }}</span>
            <div style="min-width:0;flex:1">
              <div class="title" style="margin-bottom:2px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                {{ p.name }}
                <TfBadge tone="neutral" variant="soft">{{ typeLabel(p.type) }}</TfBadge>
                <TfBadge :tone="p.visibility === 'PUBLIC' ? 'success' : 'neutral'" variant="soft">{{ p.visibility === 'PUBLIC' ? 'Public' : 'Private' }}</TfBadge>
                <span v-if="!p.owned" class="text-subtle text-xs" style="font-style:italic">shared</span>
              </div>
              <div class="sub text-muted text-sm">{{ [p.city, countryName(p.country)].filter(Boolean).join(' · ') || p.address || '—' }}</div>
            </div>
          </div>
          <div class="card-right" style="display:flex;gap:6px;align-items:center">
            <PSelect :modelValue="p.folderId" @update:modelValue="v => assignFolder(p, v)"
                     :options="folderSelectOptions" optionLabel="label" optionValue="value"
                     showClear placeholder="＋ Folder" :style="{ width: '150px' }" />
            <template v-if="p.owned">
              <button class="del-btn" @click="openDialog(p)" v-tooltip="'Edit'"><i class="pi pi-pencil"></i></button>
              <button class="del-btn" @click="confirmDelete(p)" v-tooltip="'Delete'"><i class="pi pi-times"></i></button>
            </template>
          </div>
        </div>
      </TransitionGroup>
    </template>

    <div v-if="!places.length && !loading" class="empty-state">
      <div class="empty-state-icon"><i class="pi pi-map-marker"></i></div>
      <h3>No places yet</h3>
      <p>Search above to find & save a place, or add one manually.</p>
      <PButton icon="pi pi-plus" label="Add place" @click="openDialog()" />
    </div>

    <PDialog v-model:visible="showDialog" :header="editing ? 'Edit place' : 'New place'" modal :style="{ width: '520px' }" :draggable="false" @hide="resetForm">
      <form @submit.prevent="save" class="dialog-form">
        <div class="field">
          <label>Name *</label>
          <PInputText v-model="form.name" required class="w-full" placeholder="e.g. Navagio Beach" />
        </div>
        <div class="form-row">
          <div class="field" style="flex:1">
            <label>Type</label>
            <PSelect v-model="form.type" :options="typeOptions" optionLabel="label" optionValue="value" class="w-full" />
          </div>
          <div class="field" style="flex:1">
            <label>Visibility</label>
            <PSelect v-model="form.visibility" :options="visibilityOptions" optionLabel="label" optionValue="value" class="w-full" />
          </div>
        </div>
        <div class="form-row">
          <div class="field" style="flex:1">
            <label>Country</label>
            <PSelect v-model="form.country" :options="countryOptions" optionLabel="label" optionValue="value"
                     filter showClear placeholder="Country" class="w-full" />
          </div>
          <div class="field" style="flex:1">
            <label>City</label>
            <PInputText v-model="form.city" class="w-full" />
          </div>
        </div>
        <div class="field">
          <label>Address <span class="text-muted text-sm">— auto-filled from name + city/country if left blank</span></label>
          <PInputText v-model="form.address" class="w-full" />
        </div>
        <div class="form-row">
          <div class="field" style="flex:1">
            <label>Latitude</label>
            <PInputNumber v-model="form.latitude" :maxFractionDigits="7" class="w-full" />
          </div>
          <div class="field" style="flex:1">
            <label>Longitude</label>
            <PInputNumber v-model="form.longitude" :maxFractionDigits="7" class="w-full" />
          </div>
        </div>
        <div class="field">
          <label>Description</label>
          <PInputText v-model="form.description" class="w-full" />
        </div>
        <div class="field">
          <label>Photos <span class="text-muted text-sm">(comma-separated URLs)</span></label>
          <PInputText v-model="photosText" class="w-full" placeholder="https://… , https://…" />
        </div>
        <div class="field">
          <label>Links <span class="text-muted text-sm">(comma-separated URLs)</span></label>
          <PInputText v-model="linksText" class="w-full" placeholder="https://… , https://…" />
        </div>
        <div class="dialog-actions">
          <PButton type="button" label="Cancel" severity="secondary" text @click="showDialog = false" />
          <PButton type="submit" :label="editing ? 'Save' : 'Add'" icon="pi pi-check" :loading="saving" />
        </div>
      </form>
    </PDialog>
    <PDialog v-model:visible="showFolderDialog" :header="editingFolder ? 'Rename folder' : 'New folder'" modal :style="{ width: '360px' }" :draggable="false">
      <form @submit.prevent="saveFolder" class="dialog-form">
        <div class="field">
          <label>Name *</label>
          <PInputText v-model="folderForm.name" required class="w-full" placeholder="e.g. Beaches, Greece 2026" />
        </div>
        <div class="field">
          <label>Color</label>
          <input type="color" v-model="folderForm.color" style="width:48px;height:34px;border:none;background:none;cursor:pointer" />
        </div>
        <div class="dialog-actions">
          <PButton type="button" label="Cancel" severity="secondary" text @click="showFolderDialog = false" />
          <PButton type="submit" :label="editingFolder ? 'Save' : 'Create'" icon="pi pi-check" />
        </div>
      </form>
    </PDialog>
    <!-- Find a place (geocode autocomplete) -->
    <PDialog v-model:visible="showFindDialog" modal header="Find a place" :style="{ width: '460px' }" :draggable="false">
      <div class="dialog-form">
        <div class="field">
          <label>Search <span v-if="geocoding" class="text-muted text-sm">· saving…</span></label>
          <TfPlaceSearch placeholder="Navagio Beach, Senso-ji…" @select="onGeoPicked" />
        </div>
        <div class="field">
          <label>Country <span class="text-muted text-sm">(optional)</span></label>
          <PSelect v-model="geocodeCountry" :options="countryOptions" optionLabel="label" optionValue="value"
                   filter showClear placeholder="Any" class="w-full" />
        </div>
        <p class="text-muted text-sm" style="margin:0">Pick a suggestion to save it to your library.</p>
      </div>
    </PDialog>

    <!-- Import from Google Maps -->
    <PDialog v-model:visible="showImportDialog" modal header="Import from Google Maps" :style="{ width: '460px' }" :draggable="false">
      <form @submit.prevent="runImport" class="dialog-form">
        <div class="field">
          <label>Google Maps link</label>
          <PInputText v-model="importUrl" class="w-full" placeholder="https://maps.app.goo.gl/…" @keyup.enter="runImport" autofocus />
        </div>
        <p class="text-muted text-sm" style="margin:0">Paste a share link to a single place (not a saved list).</p>
        <div class="dialog-actions">
          <PButton type="button" label="Cancel" severity="secondary" text @click="showImportDialog = false" />
          <PButton type="submit" :label="importing ? 'Importing…' : 'Import'" icon="pi pi-download" :loading="importing" @click="runImport" />
        </div>
      </form>
    </PDialog>

    <PConfirmDialog />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { TfBadge, TfPlaceSearch } from './ui';
import { useTripStore } from '../stores/tripStore.js';
import { useRoute, useRouter } from 'vue-router';
import api from '../api.js';

const toast = useToast();
const confirm = useConfirm();
const tripStore = useTripStore();
const route = useRoute();
const router = useRouter();

// Country dropdown: full list from /api/geo/countries, with the open trip's countries pinned on top.
const allCountries = ref([]);       // [{ code, name }]
const tripCountryCodes = ref([]);   // ISO codes from the current trip

const countryOptions = computed(() => {
  const byCode = new Map(allCountries.value.map(c => [c.code, c.name]));
  const seen = new Set();
  const opts = [];
  const push = (code, fromTrip) => {
    if (!code || seen.has(code)) return;
    seen.add(code);
    const name = byCode.get(code) || code;
    opts.push({ label: `${fromTrip ? '★ ' : ''}${name} (${code})`, value: code });
  };
  tripCountryCodes.value.forEach(c => push(c, true));
  allCountries.value.forEach(c => push(c.code, false));
  return opts;
});

const loadCountries = async () => {
  try { allCountries.value = (await api.get('/api/geo/countries')).data || []; } catch { /* non-fatal */ }
  const tid = tripStore.currentTrip?.id;
  if (tid) {
    try { tripCountryCodes.value = (await api.get(`/api/trips/${tid}/countries`)).data || []; } catch { /* none */ }
  }
  // Pre-select the trip's primary country for quick-add.
  if (!geocodeCountry.value && tripCountryCodes.value.length) geocodeCountry.value = tripCountryCodes.value[0];
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

const viewMode = ref('grid');        // 'grid' | 'list'
const showFindDialog = ref(false);
const showImportDialog = ref(false);

// Folders
const folders = ref([]);
const selectedFolderId = ref(null);   // null = All places
const showFolderDialog = ref(false);
const editingFolder = ref(null);
const folderForm = ref({ name: '', color: '#e35a38' });

const sourceOptions = [{ label: 'Manual', value: 'MANUAL' }, { label: 'Geocoded', value: 'GEOCODED' }];
const sortOptions = [
  { label: 'Name', value: 'name' },
  { label: 'Recently added', value: 'recent' },
  { label: 'Type', value: 'type' },
];
const folderSelectOptions = computed(() => folders.value.map(f => ({ label: f.name, value: f.id })));
const currentFolder = computed(() => folders.value.find(f => f.id === selectedFolderId.value) || null);
const chipStyle = (active) => ({
  padding: '6px 12px', borderRadius: 'var(--radius-pill)', cursor: 'pointer',
  border: '1px solid var(--border-subtle)',
  background: active ? 'var(--brand)' : 'var(--surface-card)',
  color: active ? '#fff' : 'var(--text-body)',
  font: 'var(--fw-medium) 13px/1 var(--font-sans)',
  display: 'inline-flex', alignItems: 'center', gap: '6px',
});

const typeOptions = [
  { label: 'Sightseeing', value: 'SIGHTSEEING' }, { label: 'Beach', value: 'BEACH' },
  { label: 'Nature', value: 'NATURE' }, { label: 'Restaurant', value: 'RESTAURANT' },
  { label: 'Museum', value: 'MUSEUM' }, { label: 'Viewpoint', value: 'VIEWPOINT' },
  { label: 'Port', value: 'PORT' }, { label: 'Airport', value: 'AIRPORT' },
  { label: 'Neighborhood', value: 'NEIGHBORHOOD' }, { label: 'Park', value: 'PARK' },
  { label: 'Shop', value: 'SHOP' }, { label: 'Other', value: 'OTHER' },
];
const visibilityOptions = [
  { label: 'Private', value: 'PRIVATE' },
  { label: 'Public', value: 'PUBLIC' },
];
const typeLabel = (v) => typeOptions.find(o => o.value === v)?.label || v;
const linkLabel = (url) => {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
};

// Per-type icon + warm color, matching the Tripyfull category styling.
const TYPE_META = {
  SIGHTSEEING:  { e: '🏛', bg: 'var(--teal-50)',       c: 'var(--accent)' },
  BEACH:        { e: '🏖', bg: 'var(--gold-50)',       c: 'var(--gold-400)' },
  NATURE:       { e: '🌿', bg: 'var(--teal-50)',       c: 'var(--teal-400)' },
  RESTAURANT:   { e: '🍽', bg: 'var(--gold-50)',       c: 'var(--gold-400)' },
  MUSEUM:       { e: '🏺', bg: 'var(--coral-50)',      c: 'var(--brand)' },
  VIEWPOINT:    { e: '🌄', bg: 'var(--gold-50)',       c: 'var(--gold-500)' },
  PORT:         { e: '⛴', bg: 'var(--teal-50)',       c: 'var(--accent)' },
  AIRPORT:      { e: '✈️', bg: 'var(--teal-50)',       c: 'var(--accent)' },
  NEIGHBORHOOD: { e: '🏘', bg: 'var(--coral-50)',      c: 'var(--brand)' },
  PARK:         { e: '🌳', bg: 'var(--teal-50)',       c: 'var(--teal-400)' },
  SHOP:         { e: '🛍', bg: 'var(--coral-50)',      c: 'var(--coral-400)' },
  OTHER:        { e: '📍', bg: 'var(--surface-sunken)', c: 'var(--ink-500)' },
};
const typeEmoji = (t) => (TYPE_META[t] || TYPE_META.OTHER).e;
const typeStyle = (t) => { const m = TYPE_META[t] || TYPE_META.OTHER; return { background: m.bg, color: m.c }; };
const countryName = (code) => allCountries.value.find(c => c.code === code)?.name || code || '';

const emptyForm = {
  name: '', type: 'OTHER', country: '', city: '', address: '',
  latitude: null, longitude: null, description: '', visibility: 'PRIVATE',
};
const form = ref({ ...emptyForm });
const photosText = ref('');
const linksText = ref('');

const splitList = (s) => (s || '').split(',').map(x => x.trim()).filter(Boolean);

const openDialog = (p) => {
  if (p) {
    editing.value = p;
    form.value = {
      name: p.name, type: p.type || 'OTHER', country: p.country || '', city: p.city || '',
      address: p.address || '', latitude: p.latitude, longitude: p.longitude,
      description: p.description || '', visibility: p.visibility || 'PRIVATE',
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
    const payload = { ...form.value, photos: splitList(photosText.value), links: splitList(linksText.value) };
    if (editing.value) {
      const res = await api.patch(`/api/places/${editing.value.id}`, payload);
      const idx = places.value.findIndex(p => p.id === editing.value.id);
      if (idx !== -1) places.value[idx] = res.data;
    } else {
      const res = await api.post('/api/places', payload);
      places.value.unshift(res.data);
    }
    showDialog.value = false;
    toast.add({ severity: 'success', summary: 'Saved', life: 3000 });
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save place', life: 3000 });
  } finally { saving.value = false; }
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
    const idx = places.value.findIndex(p => p.id === res.data.id);
    if (idx !== -1) places.value[idx] = res.data; else places.value.unshift(res.data);
    geocodeText.value = '';
    showFindDialog.value = false;
    toast.add({ severity: 'success', summary: 'Place saved', detail: res.data.name, life: 3000 });
  } catch (e) {
    const msg = e.response?.status === 404 ? 'No location found' : 'Geocoding failed';
    toast.add({ severity: 'warn', summary: 'Not found', detail: msg, life: 3000 });
  } finally { geocoding.value = false; }
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
    const idx = places.value.findIndex(p => p.id === res.data.id);
    if (idx !== -1) places.value[idx] = res.data; else places.value.unshift(res.data);
    importUrl.value = '';
    showImportDialog.value = false;
    toast.add({ severity: 'success', summary: 'Imported', detail: res.data.name, life: 3000 });
  } catch (e) {
    const msg = e.response?.status === 400 ? "Couldn't read that link" : 'Import failed';
    toast.add({ severity: 'warn', summary: 'Import', detail: msg, life: 3500 });
  } finally { importing.value = false; }
};

const confirmDelete = (p) => {
  confirm.require({
    message: `Delete "${p.name}"?`, header: 'Confirm', icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: 'Cancel', severity: 'secondary', text: true },
    acceptProps: { label: 'Delete', severity: 'danger' },
    accept: async () => {
      await api.delete(`/api/places/${p.id}`);
      places.value = places.value.filter(x => x.id !== p.id);
      toast.add({ severity: 'success', summary: 'Deleted', life: 3000 });
    },
  });
};

const resetForm = () => { form.value = { ...emptyForm }; editing.value = null; photosText.value = ''; linksText.value = ''; };

const clean = (s) => (s && String(s).trim()) ? String(s).trim() : undefined;

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
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load places', life: 3000 });
  } finally { loading.value = false; }
};

// ---- folders ----
const loadFolders = async () => {
  try { folders.value = (await api.get('/api/folders')).data || []; } catch { /* none */ }
};

const selectFolder = (id) => { selectedFolderId.value = id; loadPlaces(); };

const openFolderDialog = (f) => {
  editingFolder.value = f || null;
  folderForm.value = f ? { name: f.name, color: f.color || '#e35a38' } : { name: '', color: '#e35a38' };
  showFolderDialog.value = true;
};

const saveFolder = async () => {
  if (!folderForm.value.name.trim()) return;
  try {
    if (editingFolder.value) await api.patch(`/api/folders/${editingFolder.value.id}`, folderForm.value);
    else await api.post('/api/folders', folderForm.value);
    showFolderDialog.value = false;
    await loadFolders();
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save folder', life: 3000 });
  }
};

const deleteFolder = (f) => {
  confirm.require({
    message: `Delete folder "${f.name}"? Places stay in the library.`, header: 'Confirm', icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: 'Cancel', severity: 'secondary', text: true },
    acceptProps: { label: 'Delete', severity: 'danger' },
    accept: async () => {
      await api.delete(`/api/folders/${f.id}`);
      if (selectedFolderId.value === f.id) selectedFolderId.value = null;
      await loadFolders();
      await loadPlaces();
      toast.add({ severity: 'success', summary: 'Deleted', life: 2500 });
    },
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
    if (selectedFolderId.value && place.folderId !== selectedFolderId.value && previous === selectedFolderId.value) {
      places.value = places.value.filter(p => p.id !== place.id);
    }
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update folder', life: 3000 });
  }
};

onMounted(async () => {
  loadCountries();
  loadFolders();
  await loadPlaces();
  // Opened from an activity's "Edit place" link → open that place's editor.
  const editId = route.query.edit;
  if (editId) {
    const p = places.value.find(x => x.id === editId);
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

.place-list { margin-top: 12px; }

.place-thumb {
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background-size: cover;
  background-position: center;
  border: 1px solid var(--border-subtle);
}

.place-card {
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out);
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
  background: linear-gradient(to top, rgba(33,27,23,0.32), transparent 55%);
}
.place-card-cover-badge { position: absolute; top: 10px; left: 10px; z-index: 1; }

.place-card-body {
  padding: 14px 16px 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}

.place-card-head { display: flex; gap: 11px; align-items: flex-start; }

.place-card-name {
  font: var(--fw-bold) 17px/1.15 var(--font-display);
  color: var(--text-strong);
  letter-spacing: -0.01em;
  word-break: break-word;
}

.place-card-sub {
  font: var(--fw-regular) 12px/1.3 var(--font-sans);
  color: var(--text-muted);
  margin-top: 3px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.place-card-tags { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

.place-card-desc {
  font: var(--type-small);
  color: var(--text-muted);
  font-style: italic;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.place-card-links { display: flex; gap: 6px; flex-wrap: wrap; }
.place-link-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font: var(--fw-medium) 12px/1 var(--font-sans);
  color: var(--text-link);
  background: var(--surface-sunken);
  padding: 5px 10px;
  border-radius: var(--radius-pill);
  text-decoration: none;
}
.place-link-chip:hover { text-decoration: none; filter: brightness(0.97); }

.place-card-foot {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px 12px;
  border-top: 1px solid var(--border-subtle);
  margin-top: auto;
}
.place-card-foot :deep(.p-select) { font-size: var(--text-sm); }
</style>
