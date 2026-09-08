<template>
  <div class="page-content page-content--full">
    <!-- Two columns: the list shrinks when the details panel opens beside it. -->
    <div class="places-layout" :class="{ 'places-layout--split': showDialog }">
      <div class="places-col" :class="{ 'places-col--table': viewMode === 'list' }" ref="listEl">
        <div class="page-head">
          <div>
            <h1>{{ tripMode ? 'Trip places' : 'Places' }}</h1>
          </div>
          <div class="page-head-actions">
            <!-- The search icon carries this one on a phone, so the title and
                 both buttons share a single line. -->
            <TfButton
              class="phone-icon-btn"
              icon="pi-search"
              variant="secondary"
              @click="showFindDialog = true"
              ><span class="phone-hide">Find &amp; import</span></TfButton
            >
            <TfButton icon="pi-plus" @click="openDialog()">Add place</TfButton>
          </div>
        </div>

        <!-- Scope chips: the global list groups by trip, a trip's list by its own folders -->
        <div class="scope-chips">
          <button :style="chipStyle(!selectedFolderId && !selectedTripId)" @click="selectScope({})">
            {{ tripMode ? 'All trip places' : 'All places' }}
          </button>

          <template v-if="!tripMode">
            <button
              v-for="t in trips"
              :key="t.id"
              :style="chipStyle(selectedTripId === t.id)"
              @click="selectScope({ tripId: t.id })"
            >
              <i class="pi pi-map" style="font-size: 11px"></i>
              {{ t.title }}
              <span :style="{ opacity: 0.7 }">{{ tripPlaceCount(t.id) }}</span>
            </button>
          </template>

          <template v-else>
            <!-- Rename/delete live inside the selected chip — no extra toolbar row. -->
            <button
              v-for="f in folders"
              :key="f.id"
              :style="chipStyle(selectedFolderId === f.id)"
              @click="selectScope({ folderId: f.id })"
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
              <template v-if="selectedFolderId === f.id">
                <span
                  class="chip-action"
                  @click.stop="openFolderDialog(f)"
                  v-tooltip="'Rename folder'"
                >
                  <i class="pi pi-pencil"></i>
                </span>
                <span class="chip-action" @click.stop="deleteFolder(f)" v-tooltip="'Delete folder'">
                  <i class="pi pi-times"></i>
                </span>
              </template>
            </button>
            <button :style="chipStyle(false)" @click="openFolderDialog()">
              <i class="pi pi-plus" style="font-size: 12px"></i> Folder
            </button>
          </template>
        </div>

        <!-- Filters: one full-width row -->
        <div class="filters-row">
          <div style="flex: 1 1 220px; min-width: 180px; max-width: 380px">
            <TfInput
              v-model="filterQ"
              placeholder="Search by name, city, address…"
              @keyup.enter="loadPlaces"
            >
              <template #prefix><i class="pi pi-search" /></template>
            </TfInput>
          </div>

          <!-- Phones only: four selects and five rating chips are 140px of
               controls before the first place, so they wait behind a button. -->
          <button
            type="button"
            class="filters-toggle"
            :class="{ 'is-on': filtersOpen }"
            @click="filtersOpen = !filtersOpen"
          >
            <i class="pi pi-filter" style="font-size: 12px"></i> Filters
            <span v-if="activeFilterCount" class="filters-count">{{ activeFilterCount }}</span>
          </button>

          <div class="filters-extra" :class="{ 'is-open': filtersOpen }">
            <div style="flex: 0 1 170px">
              <TfSelect
                :modelValue="countryLabel(filterCountry)"
                @update:modelValue="
                  (v) => {
                    filterCountry = countryValue(v);
                    loadPlaces();
                  }
                "
                :options="countryLabels"
                placeholder="Country"
              />
            </div>
            <div style="flex: 0 1 150px">
              <TfSelect
                :modelValue="typeLabelFromValue(filterType)"
                @update:modelValue="
                  (v) => {
                    filterType = typeValueFromLabel(v);
                    loadPlaces();
                  }
                "
                :options="typeLabels"
                placeholder="Type"
              />
            </div>
            <div style="flex: 0 1 140px">
              <TfSelect
                :modelValue="visibilityLabelFromValue(filterVisibility)"
                @update:modelValue="
                  (v) => {
                    filterVisibility = visibilityValueFromLabel(v);
                    loadPlaces();
                  }
                "
                :options="visibilityLabels"
                placeholder="Public/private"
              />
            </div>
            <!-- Rating filter: multi-select, any of the picked stars -->
            <div class="rating-filter">
              <span class="rating-filter-label">Rating</span>
              <button
                v-for="n in [5, 4, 3, 2, 1]"
                :key="n"
                type="button"
                class="rating-chip"
                :class="{ on: filterRatings.has(n) }"
                @click="toggleRating(n)"
                v-tooltip="RATING_HINTS[n]"
              >
                {{ n }}★
              </button>
              <button
                v-if="filterRatings.size"
                type="button"
                class="rating-chip rating-chip--clear"
                @click="filterRatings = new Set()"
                v-tooltip="'Clear rating filter'"
              >
                <i class="pi pi-times" style="font-size: 10px"></i>
              </button>
            </div>
          </div>
        </div>

        <div v-if="loading" class="skeleton" style="height: 120px; border-radius: 14px"></div>

        <template v-else-if="places.length">
          <div class="places-toolbar">
            <span class="text-muted text-sm"
              >{{ shownPlaces.length }} place{{ shownPlaces.length === 1 ? '' : 's' }}</span
            >
            <!-- Balance lives in the toolbar so it costs no row while collapsed.
                 Only for a whole trip's shortlist: the quotas say nothing about
                 a library holding other people's places, nor about one folder —
                 a region is a slice of the trip, not a plan of its own. -->
            <button
              v-if="showRatingBalance"
              class="balance-toggle"
              @click="showBalance = !showBalance"
              v-tooltip="'How your ratings are spread vs the planning targets'"
            >
              <i class="pi" :class="showBalance ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
              Rating spread
              <span v-if="balanceWarning" class="balance-warn">{{ balanceWarning }}</span>
            </button>
            <span class="toolbar-spacer"></span>
            <TfButton
              size="sm"
              :variant="selectMode ? 'primary' : 'secondary'"
              style="margin-right: 8px"
              @click="toggleSelectMode"
            >
              <i class="pi pi-check-square" style="font-size: 13px"></i>
              {{ selectMode ? 'Done' : 'Select' }}
            </TfButton>
            <TfButton
              v-if="selectMode"
              size="sm"
              variant="ghost"
              style="margin-right: 8px"
              @click="selectAll"
              >Select all</TfButton
            >
            <span class="toolbar-label">Sort</span>
            <div class="toolbar-sort">
              <TfSelect
                size="sm"
                :modelValue="sortLabelFromValue(sortBy)"
                @update:modelValue="
                  (v) => {
                    sortBy = sortValueFromLabel(v);
                    loadPlaces();
                  }
                "
                :options="sortLabels"
                placeholder="Sort"
              />
            </div>
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

          <!-- Expanded balance: a bar + legend, narrow enough to read at a glance. -->
          <div v-if="showRatingBalance && showBalance" class="balance-body">
            <div class="balance-bar">
              <span
                v-for="q in ratingBalance"
                :key="q.r"
                class="balance-seg"
                :style="{ width: q.share + '%', background: q.color }"
                v-tooltip="`${q.r}★ — ${q.n} of ${places.length}`"
              ></span>
            </div>
            <div class="balance-legend">
              <span v-for="q in ratingBalance" :key="q.r" class="balance-item">
                <span class="balance-dot" :style="{ background: q.color }"></span>
                <b>{{ q.r }}★</b> {{ q.n }}
                <span class="balance-aim">target {{ q.aim }}</span>
              </span>
            </div>
          </div>

          <!-- Selection actions dock at the bottom: no layout jump, clear surface. -->
          <Transition name="dock">
            <div v-if="selectMode && selectedIds.size" class="bulk-bar">
              <span style="font: var(--fw-semibold) 13px/1 var(--font-sans)"
                >{{ selectedIds.size }} selected</span
              >
              <TfButton size="sm" variant="ghost" @click="clearSelection">Clear</TfButton>
              <span class="bulk-sep"></span>
              <!-- Only inside a trip: folders belong to a trip, and filing a place
                   into another trip's folder would not add it to that trip. -->
              <div v-if="tripMode && folders.length" style="width: 160px">
                <TfSelect
                  size="sm"
                  :modelValue="null"
                  @update:modelValue="(v) => bulkMoveToFolder(v)"
                  :options="folderLabels"
                  placeholder="Move to folder…"
                />
              </div>
              <div style="width: 150px">
                <TfSelect
                  size="sm"
                  :modelValue="null"
                  @update:modelValue="(v) => bulkChangeType(v)"
                  :options="typeLabels"
                  placeholder="Set type…"
                />
              </div>
              <TfButton size="sm" variant="secondary" @click="bulkVisibility('PUBLIC')">
                <i class="pi pi-globe" style="font-size: 12px"></i> Make public
              </TfButton>
              <TfButton size="sm" variant="secondary" @click="bulkVisibility('PRIVATE')">
                <i class="pi pi-lock" style="font-size: 12px"></i> Make private
              </TfButton>
              <TfButton v-if="tripMode" size="sm" variant="secondary" @click="bulkRemoveFromTrip">
                <i class="pi pi-minus-circle" style="font-size: 12px"></i> Remove from trip
              </TfButton>
              <TfButton size="sm" variant="danger" @click="bulkDelete">
                <i class="pi pi-trash" style="font-size: 12px"></i> Delete
              </TfButton>
            </div>
          </Transition>

          <TransitionGroup v-if="viewMode === 'grid'" name="gallery" tag="div" class="place-grid">
            <article
              v-for="p in shownPlaces"
              :key="p.id"
              class="place-card"
              :class="{
                'card--selected': isSelected(p),
                'card--selectable': selectMode && p.owned,
                'card--unselectable': selectMode && !p.owned,
              }"
              @click="selectMode ? toggleSelect(p) : openDetails(p)"
            >
              <span
                v-if="selectMode && p.owned"
                class="select-check"
                :class="{ on: isSelected(p) }"
              >
                <i class="pi pi-check"></i>
              </span>
              <!-- Cover: 16:9 photo with a real fallback; only a 4-5★ badge earns space here. -->
              <div class="place-card-cover">
                <img
                  v-if="hasPhoto(p)"
                  :src="photoSrc(cardPhoto(p))"
                  alt=""
                  loading="lazy"
                  @error="onPhotoError(p)"
                />
                <span v-else class="cover-placeholder">{{ typeEmoji(p.type) }}</span>

                <span
                  v-if="!selectMode"
                  class="cover-icon"
                  v-tooltip="p.visibility === 'PUBLIC' ? 'Public' : 'Private'"
                  :aria-label="p.visibility === 'PUBLIC' ? 'Public' : 'Private'"
                >
                  <i :class="p.visibility === 'PUBLIC' ? 'pi pi-globe' : 'pi pi-lock'"></i>
                </span>

                <span
                  class="cover-rating"
                  :class="{
                    'cover-rating--top': (p.rating || 3) === 5,
                    'cover-rating--low': (p.rating || 3) <= 3,
                  }"
                  v-tooltip="RATING_HINTS[p.rating || 3]"
                >
                  <i class="pi pi-star-fill"></i>{{ p.rating || 3 }}
                </span>

                <template v-if="livePhotos(p).length > 1">
                  <button
                    class="cover-nav cover-nav--prev"
                    @click.stop="shiftPhoto(p, -1)"
                    v-tooltip="'Previous photo'"
                  >
                    <i class="pi pi-chevron-left"></i>
                  </button>
                  <button
                    class="cover-nav cover-nav--next"
                    @click.stop="shiftPhoto(p, 1)"
                    v-tooltip="'Next photo'"
                  >
                    <i class="pi pi-chevron-right"></i>
                  </button>
                  <span class="cover-dots">{{ photoIndex(p) + 1 }}/{{ livePhotos(p).length }}</span>
                </template>
              </div>

              <!-- Body: the name leads, everything else is quieter support. -->
              <div class="place-card-body">
                <h3 class="place-card-name">{{ p.name }}</h3>
                <div v-if="placeLocation(p)" class="place-card-sub">
                  <i class="pi pi-map-marker"></i> {{ placeLocation(p) }}
                </div>
                <div class="place-card-meta">
                  <TfBadge size="sm" tone="neutral" variant="soft">{{ typeLabel(p.type) }}</TfBadge>
                  <span v-if="p.visitMinutes" class="meta-fact">{{ p.visitMinutes }} min</span>
                  <!-- Words, not icons: on a 280 px card a glyph was 12 px of
                       decoration that pushed "shared" off the row. -->
                  <TfBadge v-if="p.needsBooking" size="sm" tone="brand" variant="soft"
                    >Book ahead</TfBadge
                  >
                  <TfBadge v-if="p.needsPreparation" size="sm" tone="danger" variant="soft"
                    >Prep needed</TfBadge
                  >
                  <span v-if="!p.owned" class="meta-fact meta-fact--muted">shared</span>
                </div>
                <p v-if="p.description" class="place-card-desc">{{ p.description }}</p>
              </div>
            </article>
          </TransitionGroup>

          <!-- List view -->
          <div v-else class="place-table-wrap">
            <TfTable
              :columns="placeColumns"
              :rows="shownPlaces"
              rowKey="id"
              :rowClass="tableRowClass"
              @row-click="(p) => (selectMode ? toggleSelect(p) : openDetails(p))"
            >
              <template #sel="{ row: p }">
                <span
                  v-if="selectMode && p.owned"
                  class="select-check select-check--inline"
                  :class="{ on: isSelected(p) }"
                >
                  <i class="pi pi-check"></i>
                </span>
              </template>
              <!-- Name and place on two lines in one cell: it reads as one fact
                   and frees the width a separate Location column was eating. -->
              <template #name="{ row: p }">
                <div class="cell-name">
                  <span v-if="hasPhoto(p)" class="place-thumb place-thumb--sm">
                    <img
                      :src="photoSrc(livePhotos(p)[0])"
                      alt=""
                      loading="lazy"
                      @error="onThumbError(livePhotos(p)[0])"
                    />
                  </span>
                  <span v-else class="cat-icon cat-icon--sm" :style="typeStyle(p.type)">{{
                    typeEmoji(p.type)
                  }}</span>
                  <span class="cell-name-main">
                    <span class="cell-name-text cell-clip">
                      {{ p.name }}
                      <span v-if="!p.owned" class="text-subtle text-xs" style="font-style: italic"
                        >shared</span
                      >
                    </span>
                    <span class="cell-name-sub cell-clip">{{ placeLocation(p) || '—' }}</span>
                  </span>
                </div>
              </template>
              <!-- Plain text in a table: a pill per cell turns rows into confetti.
                   Weight and colour carry the emphasis instead. -->
              <template #type="{ row: p }">
                <span class="text-muted cell-clip" style="display: block">{{
                  typeLabel(p.type)
                }}</span>
              </template>
              <template #rating="{ row: p }">
                <span
                  class="cell-rating"
                  :class="`cell-rating--${p.rating || 3}`"
                  v-tooltip="RATING_HINTS[p.rating || 3]"
                  >★ {{ p.rating || 3 }}</span
                >
              </template>
              <template #visit="{ row: p }">
                <span class="text-muted">{{ p.visitMinutes ? p.visitMinutes + ' min' : '—' }}</span>
              </template>
              <!-- Public/private is an icon here: the word cost a third of the
                   column for something almost every place shares. -->
              <template #flags="{ row: p }">
                <span class="cell-flags">
                  <i
                    class="pi"
                    :class="p.visibility === 'PUBLIC' ? 'pi-globe' : 'pi-lock'"
                    v-tooltip="p.visibility === 'PUBLIC' ? 'Public' : 'Private'"
                  ></i>
                  <span
                    v-if="p.needsBooking"
                    class="cell-flag cell-flag--book"
                    v-tooltip="'Needs advance booking'"
                    >Book</span
                  >
                  <span
                    v-if="p.needsPreparation"
                    class="cell-flag cell-flag--prep"
                    v-tooltip="'Needs special preparation'"
                    >Prep</span
                  >
                </span>
              </template>
              <template #folder="{ row: p }">
                <span class="text-muted cell-clip" style="display: block">{{
                  folderLabel(p.folderId) || '—'
                }}</span>
              </template>
            </TfTable>
          </div>
        </template>

        <div v-if="!places.length && !loading" class="empty-state">
          <div class="empty-state-icon"><i class="pi pi-map-marker"></i></div>
          <h3>No places yet</h3>
          <p>Search above to find & save a place, or add one manually.</p>
          <TfButton icon="pi-plus" @click="openDialog()">Add place</TfButton>
        </div>
      </div>

      <TfDrawer
        v-model="showDialog"
        inline
        :title="
          drawerMode === 'view' ? viewing?.name : editing ? form.name || viewing?.name : 'New place'
        "
      >
        <!-- View mode: read-only details, grouped label → value. Editing is a
             separate step from the footer, so browsing never risks a change. -->
        <template v-if="drawerMode === 'view' && viewing">
          <TfDrawerSection>
            <div style="display: flex; gap: 6px; flex-wrap: wrap">
              <TfBadge
                :tone="viewing.rating === 5 ? 'gold' : viewing.rating === 4 ? 'warning' : 'neutral'"
                variant="soft"
                >★ {{ viewing.rating || 3 }} · {{ RATING_HINTS[viewing.rating || 3] }}</TfBadge
              >
              <TfBadge tone="neutral" variant="soft">{{ typeLabel(viewing.type) }}</TfBadge>
              <TfBadge
                :tone="viewing.visibility === 'PUBLIC' ? 'success' : 'neutral'"
                variant="soft"
                >{{ viewing.visibility === 'PUBLIC' ? 'Public' : 'Private' }}</TfBadge
              >
              <TfBadge v-if="viewing.needsBooking" tone="brand" variant="soft" dot
                >Book ahead</TfBadge
              >
              <TfBadge v-if="viewing.needsPreparation" tone="danger" variant="soft"
                >Prep needed</TfBadge
              >
            </div>
          </TfDrawerSection>

          <TfDrawerSection label="Photos">
            <div v-if="shownPhotos.length" class="photo-grid">
              <button
                v-for="(url, i) in shownPhotos"
                :key="url"
                type="button"
                class="photo-thumb"
                @click="openViewer(i)"
              >
                <img :src="photoSrc(url)" alt="" loading="lazy" @error="onThumbError(url)" />
              </button>
            </div>
            <span v-else class="info-value">—</span>
            <TfButton
              v-if="viewing.owned"
              size="sm"
              variant="soft"
              icon="pi-cloud-upload"
              :loading="uploading"
              @click="pickPhotos"
              >Upload photo</TfButton
            >
          </TfDrawerSection>

          <TfDrawerSection label="Location">
            <BookingMap v-if="mapMarkers.length" :markers="mapMarkers" :height="150" />
            <p v-else class="text-subtle text-sm" style="margin: 0">
              Not on the map yet — no coordinates.
            </p>
            <div class="info-row">
              <span class="info-label">City</span>
              <span class="info-value">{{ viewing.city || '—' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Country</span>
              <span class="info-value">{{ countryName(viewing.country) || '—' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Address</span>
              <span class="info-value" style="text-align: right">{{ viewing.address || '—' }}</span>
            </div>
          </TfDrawerSection>

          <TfDrawerSection label="Planning">
            <div class="info-row">
              <span class="info-label">Rating</span>
              <span class="info-value">{{ viewing.rating || 3 }} / 5</span>
            </div>
            <div class="info-row">
              <span class="info-label">Why this rating</span>
              <span class="info-value" style="text-align: right">{{
                viewing.ratingComment || '—'
              }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Time to visit</span>
              <span class="info-value">{{
                viewing.visitMinutes ? viewing.visitMinutes + ' min' : '—'
              }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">For whom</span>
              <span class="info-value">{{ AUDIENCE_LABELS[viewing.audience || 'ALL'] }}</span>
            </div>
          </TfDrawerSection>

          <TfDrawerSection label="Organisation">
            <div v-if="tripMode" class="info-row">
              <span class="info-label">Folder</span>
              <span class="info-value">{{ folderLabel(viewing.folderId) || 'Unfiled' }}</span>
            </div>
            <div v-else class="info-row">
              <span class="info-label">Trips</span>
              <span class="info-value" style="text-align: right">{{
                (viewing.tripIds || [])
                  .map((id) => trips.find((t) => t.id === id)?.title)
                  .filter(Boolean)
                  .join(', ') || 'Not in a trip'
              }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Source</span>
              <span class="info-value">{{ (viewing.source || 'MANUAL').toLowerCase() }}</span>
            </div>
            <div v-if="!viewing.owned" class="info-row">
              <span class="info-label">Owner</span>
              <span class="info-value">shared by another user</span>
            </div>
            <!-- Dropping a place from the trip leaves it in the global library. -->
            <TfButton
              v-if="tripMode"
              size="sm"
              variant="ghost"
              icon="pi-minus-circle"
              @click="removeFromCurrentTrip(viewing)"
              >Remove from this trip</TfButton
            >
          </TfDrawerSection>

          <!-- Kept even when empty, so the section list is the same in both
               modes and nothing shifts when you switch. -->
          <TfDrawerSection label="Description">
            <p style="margin: 0; font: var(--type-small); color: var(--text-secondary)">
              {{ viewing.description || '—' }}
            </p>
          </TfDrawerSection>

          <TfDrawerSection label="Links">
            <div
              v-if="viewing.links && viewing.links.length"
              style="display: flex; gap: 6px; flex-wrap: wrap"
            >
              <a
                v-for="(lnk, i) in viewing.links"
                :key="i"
                :href="lnk"
                target="_blank"
                rel="noopener"
                class="place-link-chip"
              >
                <i class="pi pi-link" style="font-size: 10px"></i> {{ linkLabel(lnk) }}
              </a>
            </div>
            <span v-else class="info-value">—</span>
          </TfDrawerSection>

          <TfDrawerSection label="Tripadvisor">
            <!-- Idle by default: each lookup spends Tripadvisor quota. -->
            <template v-if="taState === 'idle'">
              <TfButton size="sm" variant="soft" icon="pi-star" @click="loadTripadvisor(viewing.id)"
                >Check rating &amp; reviews</TfButton
              >
            </template>
            <span v-else-if="taState === 'loading'" class="text-subtle text-sm">
              <i class="pi pi-spinner pi-spin" style="font-size: 12px"></i> Asking Tripadvisor…
            </span>
            <span v-else-if="taState === 'none'" class="text-subtle text-sm">
              No match on Tripadvisor.
            </span>
            <span v-else-if="taState === 'error'" class="text-subtle text-sm">
              Could not reach Tripadvisor.
              <button type="button" class="link-btn" @click="loadTripadvisor(viewing.id)">
                Try again
              </button>
            </span>
            <template v-else>
              <div class="info-row">
                <span class="info-label">
                  <img
                    v-if="taData.ratingIconUrl"
                    :src="taData.ratingIconUrl"
                    alt=""
                    style="height: 14px"
                  />
                  {{ taData.reviewCount.toLocaleString() }} reviews
                </span>
                <span class="info-value">{{ taData.rating }} / 5</span>
              </div>
              <!-- One clamped quote: three long reviews were the only thing that
                   made this panel scroll. The rest are one click away. -->
              <div v-for="r in (taData.reviews || []).slice(0, 1)" :key="r.url">
                <div style="font: var(--fw-semibold) 12px/1.3 var(--font-sans)">{{ r.title }}</div>
                <div class="text-muted text-xs review-text">{{ r.text }}</div>
              </div>
              <a
                v-if="taData.url"
                :href="taData.url"
                target="_blank"
                rel="noopener"
                class="text-sm"
                style="color: var(--primary)"
                >All {{ taData.reviewCount.toLocaleString() }} reviews on Tripadvisor
                <i class="pi pi-external-link" style="font-size: 10px"></i
              ></a>
            </template>
          </TfDrawerSection>
        </template>

        <!-- Edit mode keeps the details layout: same sections, same order, same
             label column — only the value turns into a control, so switching
             modes never reshuffles the panel. -->
        <template v-else>
          <form id="placeForm" @submit.prevent="save">
            <TfDrawerSection>
              <div class="info-row edit-row edit-row--stack">
                <span class="info-label">Name *</span>
                <div class="edit-control">
                  <TfInput v-model="form.name" required placeholder="e.g. Navagio Beach" />
                </div>
              </div>
              <div class="info-row edit-row">
                <span class="info-label">Type</span>
                <div class="edit-control">
                  <TfSelect
                    :modelValue="typeLabelFromValue(form.type)"
                    @update:modelValue="(v) => (form.type = typeValueFromLabel(v))"
                    :options="typeLabels"
                  />
                </div>
              </div>
              <div class="info-row edit-row">
                <span class="info-label">Visibility</span>
                <div class="edit-control">
                  <TfSelect
                    :modelValue="visibilityLabelFromValue(form.visibility)"
                    @update:modelValue="(v) => (form.visibility = visibilityValueFromLabel(v))"
                    :options="visibilityLabels"
                  />
                </div>
              </div>
              <div class="info-row edit-row">
                <span class="info-label"
                  ><i class="pi pi-ticket" style="font-size: 12px"></i> Book ahead</span
                >
                <label class="edit-control edit-control--check">
                  <input type="checkbox" v-model="form.needsBooking" />
                </label>
              </div>
              <div class="info-row edit-row">
                <span class="info-label"
                  ><i class="pi pi-compass" style="font-size: 12px"></i> Prep needed</span
                >
                <label class="edit-control edit-control--check">
                  <input type="checkbox" v-model="form.needsPreparation" />
                </label>
              </div>
            </TfDrawerSection>

            <TfDrawerSection label="Photos">
              <div v-if="shownPhotos.length" class="photo-grid">
                <button
                  v-for="(url, i) in shownPhotos"
                  :key="url"
                  type="button"
                  class="photo-thumb"
                  @click="openViewer(i)"
                >
                  <img :src="photoSrc(url)" alt="" loading="lazy" @error="onThumbError(url)" />
                  <span
                    class="photo-thumb-remove"
                    role="button"
                    aria-label="Remove photo"
                    v-tooltip="'Remove'"
                    @click.stop="removePhoto(url)"
                  >
                    <i class="pi pi-times"></i>
                  </span>
                </button>
              </div>
              <p v-else class="text-subtle text-sm" style="margin: 0">No photos yet.</p>
              <TfFileUpload
                v-if="editing"
                :key="uploadKey"
                variant="compact"
                accept="image/jpeg,image/png"
                multiple
                :hint="`JPEG or PNG, up to 10 MB each \u00b7 stored at ${MAX_PHOTO_EDGE} px, ${MAX_PHOTOS} per place`"
                @change="uploadPhotos"
              />
              <p v-else class="text-subtle text-sm" style="margin: 0">
                Save the place first, then you can upload photos.
              </p>
            </TfDrawerSection>

            <TfDrawerSection label="Location">
              <BookingMap v-if="mapMarkers.length" :markers="mapMarkers" :height="150" />
              <p v-else class="text-subtle text-sm" style="margin: 0">
                Search an address below to put this place on the map.
              </p>
              <div class="info-row edit-row">
                <span class="info-label">City</span>
                <div class="edit-control">
                  <TfInput v-model="form.city" aria-label="City" />
                </div>
              </div>
              <div class="info-row edit-row">
                <span class="info-label">Country</span>
                <div class="edit-control">
                  <TfSelect
                    :modelValue="countryLabel(form.country)"
                    @update:modelValue="(v) => (form.country = countryValue(v))"
                    :options="countryLabels"
                    placeholder="Country"
                  />
                </div>
              </div>
              <!-- The search fills city, country and the coordinates, so there
                   are no latitude/longitude fields to type into any more. -->
              <div class="info-row edit-row edit-row--stack">
                <span class="info-label">
                  Address
                  <span class="text-subtle text-xs">— search to fill the rest</span>
                </span>
                <div class="edit-control">
                  <TfPlaceSearch
                    v-if="FEATURES.geoPlaceSearch"
                    v-model="form.address"
                    placeholder="Search an address or place"
                    @select="onAddressSelect"
                  />
                  <TfInput v-else v-model="form.address" aria-label="Address" />
                </div>
              </div>
            </TfDrawerSection>

            <TfDrawerSection label="Planning">
              <div class="info-row edit-row">
                <span class="info-label">
                  Rating
                  <span class="text-subtle text-xs">— {{ RATING_HINTS[form.rating] }}</span>
                </span>
                <div class="edit-control edit-control--auto">
                  <TfRating v-model="form.rating" />
                </div>
              </div>
              <div class="info-row edit-row edit-row--stack">
                <span class="info-label">Why this rating</span>
                <div class="edit-control">
                  <TfInput
                    v-model="form.ratingComment"
                    aria-label="Why this rating"
                    placeholder="e.g. iconic view, but 2h queue"
                  />
                </div>
              </div>
              <div class="info-row edit-row">
                <span class="info-label">Time to visit (min)</span>
                <div class="edit-control edit-control--narrow">
                  <TfNumberInput
                    v-model="form.visitMinutes"
                    type="plain"
                    :min="0"
                    :step="15"
                    aria-label="Time to visit in minutes"
                  />
                </div>
              </div>
              <div class="info-row edit-row">
                <span class="info-label">For whom</span>
                <div class="edit-control edit-control--auto">
                  <TfSegmentedControl
                    :modelValue="AUDIENCE_LABELS[form.audience]"
                    @update:modelValue="(v) => (form.audience = AUDIENCE_VALUES[v])"
                    :options="Object.values(AUDIENCE_LABELS)"
                    size="sm"
                  />
                </div>
              </div>
            </TfDrawerSection>

            <!-- Folder and trip membership apply straight away (they are their own
                 endpoints, not part of the form) — the cards no longer carry them. -->
            <TfDrawerSection v-if="editing && viewing" label="Organisation">
              <div v-if="tripMode" class="info-row edit-row">
                <span class="info-label">Folder</span>
                <div v-if="folders.length" class="edit-control">
                  <TfSelect
                    :modelValue="folderLabel(viewing.folderId)"
                    @update:modelValue="(v) => assignFolder(viewing, folderValueFromLabel(v))"
                    :options="folderLabels"
                    placeholder="Unfiled"
                  />
                </div>
                <span v-else class="info-value">{{
                  folderLabel(viewing.folderId) || 'No folders yet'
                }}</span>
              </div>
              <div v-else class="info-row edit-row">
                <span class="info-label">Trips</span>
                <div v-if="trips.length" class="edit-control">
                  <!-- Picking a trip toggles membership; the placeholder lists the
                       trips the place is already in. -->
                  <TfSelect
                    :modelValue="null"
                    @update:modelValue="(v) => toggleTripMembership(viewing, tripValueFromLabel(v))"
                    :options="tripLabels"
                    :placeholder="tripMembershipLabel(viewing)"
                  />
                </div>
                <span v-else class="info-value">No trips yet</span>
              </div>
              <div class="info-row">
                <span class="info-label">Source</span>
                <span class="info-value">{{ (viewing.source || 'MANUAL').toLowerCase() }}</span>
              </div>
            </TfDrawerSection>

            <TfDrawerSection label="Description">
              <div class="info-row edit-row edit-row--stack">
                <div class="edit-control">
                  <TfTextarea
                    v-model="form.description"
                    aria-label="Description"
                    :rows="4"
                    placeholder="What is it, why go, what to watch out for"
                  />
                </div>
              </div>
            </TfDrawerSection>

            <TfDrawerSection label="Links">
              <div class="info-row edit-row edit-row--stack">
                <span class="info-label">
                  Links <span class="text-subtle text-xs">— comma-separated</span>
                </span>
                <div class="edit-control">
                  <TfInput
                    v-model="linksText"
                    aria-label="Links"
                    placeholder="https://… , https://…"
                  />
                </div>
              </div>
            </TfDrawerSection>
          </form>
        </template>

        <template #footer>
          <template v-if="drawerMode === 'view' && viewing">
            <TfButton
              v-if="viewing.owned"
              icon="pi-pencil"
              style="flex: 1"
              @click="openDialog(viewing)"
              >Edit place</TfButton
            >
            <TfButton
              v-if="viewing.owned"
              variant="danger"
              icon="pi-trash"
              @click="confirmDelete(viewing)"
              >Delete</TfButton
            >
            <TfButton v-else variant="ghost" style="flex: 1" @click="showDialog = false"
              >Close</TfButton
            >
          </template>
          <template v-else>
            <TfButton variant="ghost" @click="showDialog = false">Cancel</TfButton>
            <TfButton type="submit" form="placeForm" icon="pi-check" :loading="saving">{{
              editing ? 'Save' : 'Add'
            }}</TfButton>
          </template>
        </template>
      </TfDrawer>

      <!-- The "Upload photo" button in the details view drives this. -->
      <input
        ref="photoInput"
        type="file"
        accept="image/jpeg,image/png"
        multiple
        hidden
        @change="onPhotoInput"
      />
    </div>

    <TfLightbox
      v-model="viewerOpen"
      :photos="viewerPhotos"
      :index="viewerIndex"
      :caption="viewing?.name"
      @update:index="(i) => (viewerIndex = i)"
    />

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
    <!-- Find & import: Google Maps + Tripadvisor search, link import below -->
    <TfModal v-model="showFindDialog" title="Find a place">
      <div class="dialog-form">
        <div class="form-row" style="align-items: flex-end">
          <div style="flex: 1">
            <TfInput
              v-model="findQuery"
              label="Search"
              placeholder="Navagio Beach, Senso-ji…"
              @keyup.enter="runFind"
            />
          </div>
          <TfButton icon="pi-search" :loading="finding" @click="runFind">Search</TfButton>
        </div>

        <template v-if="searched">
          <!-- Google / map results -->
          <div class="find-section">
            <div class="find-section-title"><i class="pi pi-map"></i> Google Maps</div>
            <p v-if="!findGoogle.length" class="text-subtle text-sm" style="margin: 4px 0">
              No results.
            </p>
            <div v-for="(r, i) in findGoogle" :key="'g' + i" class="find-row">
              <div style="min-width: 0; flex: 1">
                <div class="find-row-name">{{ r.name }}</div>
                <div class="text-muted text-sm" style="overflow: hidden; text-overflow: ellipsis">
                  {{ r.displayName }}
                </div>
              </div>
              <TfBadge tone="neutral" variant="soft">{{ r.placeType }}</TfBadge>
              <TfButton
                size="sm"
                variant="soft"
                :loading="savingKey === 'g' + i"
                @click="addGoogleResult(r, 'g' + i)"
              >
                <i class="pi pi-plus" style="font-size: 12px"></i> Add
              </TfButton>
            </div>
          </div>

          <!-- Tripadvisor results -->
          <div class="find-section">
            <div class="find-section-title"><i class="pi pi-star"></i> Tripadvisor</div>
            <p v-if="!findTa.length" class="text-subtle text-sm" style="margin: 4px 0">
              No results.
            </p>
            <div v-for="(r, i) in findTa" :key="'t' + i" class="find-row">
              <div style="min-width: 0; flex: 1">
                <div class="find-row-name">{{ r.name }}</div>
                <div class="text-muted text-sm" style="overflow: hidden; text-overflow: ellipsis">
                  {{ r.address || r.city || '' }}
                </div>
              </div>
              <span v-if="r.rating" class="text-sm" style="white-space: nowrap">
                <b>{{ r.rating }}</b
                ><span class="text-muted"> · {{ (r.reviewCount || 0).toLocaleString() }}</span>
              </span>
              <TfButton
                size="sm"
                variant="soft"
                :disabled="!r.latitude"
                :loading="savingKey === 't' + i"
                @click="addTaResult(r, 't' + i)"
              >
                <i class="pi pi-plus" style="font-size: 12px"></i> Add
              </TfButton>
            </div>
          </div>
        </template>

        <!-- Link import -->
        <div class="find-section">
          <div class="find-section-title"><i class="pi pi-link"></i> Or import from a link</div>
          <div class="form-row" style="align-items: center">
            <div style="flex: 1">
              <TfInput
                v-model="importUrl"
                placeholder="https://maps.app.goo.gl/… or tripadvisor.com/…"
                @keyup.enter="runImport"
              />
            </div>
            <TfButton icon="pi-download" :loading="importing" @click="runImport">Import</TfButton>
          </div>
          <p class="text-subtle text-xs" style="margin: 4px 0 0">
            Paste a link to a single place (not a saved list or destination page).
          </p>
        </div>
      </div>
    </TfModal>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount, watch } from 'vue';
import {
  TfBadge,
  TfButton,
  TfInput,
  TfSelect,
  TfSegmentedControl,
  TfNumberInput,
  TfRating,
  TfTable,
  TfDrawer,
  TfDrawerSection,
  TfFileUpload,
  TfLightbox,
  TfModal,
  TfTextarea,
  TfPlaceSearch,
  toast,
  confirm,
} from '@tripyfull/ui';
import { useTripStore } from '@/stores/tripStore.js';
import { FEATURES } from '@/config.js';
import BookingMap from '@/components/BookingMap.vue';
import { useRoute, useRouter } from 'vue-router';
import { api, isDeadPhotoUrl, photoSrc, placeTypeMeta, PLACE_TYPE_OPTIONS } from '@tripyfull/core';

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
};
const places = ref([]);
const loading = ref(false);
const saving = ref(false);
const showDialog = ref(false);
const editing = ref(null);

const filterQ = ref('');
/* The filter fields fold away on a phone; the button says how many are on. */
const filtersOpen = ref(false);
const filterCountry = ref(null);
const filterType = ref(null);
const filterVisibility = ref(null);
const filterSource = ref(null);
const filterCity = ref('');
const sortBy = ref('name');

const viewMode = ref('grid'); // 'grid' | 'list'
const showFindDialog = ref(false);

// Folders
const folders = ref([]);
const selectedFolderId = ref(null); // null = All places
const selectedTripId = ref(null); // narrow to one trip's own list

// Two lists share this view: /places is the global library (grouped by trip),
// /trips/:tripId/places is one trip's list (grouped by folders created there).
const tripMode = computed(() => !!route.params.tripId);
const routeTripId = computed(() => route.params.tripId || null);
const tripTitle = computed(() => trips.value.find((t) => t.id === routeTripId.value)?.title || '');
const tripPlaceCount = (tripId) =>
  places.value.filter((p) => (p.tripIds || []).includes(tripId)).length;
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
  { label: 'Rating', value: 'rating' },
];

// Rating semantics from the planning strategy (see docs).
const RATING_HINTS = {
  5: 'worth the whole trip',
  4: 'big detour OK',
  3: 'small detour',
  2: 'only if on the way',
  1: 'maybe skip',
};
const AUDIENCE_LABELS = { ALL: 'Everyone', ADULTS: 'Adults', KIDS: 'Kids' };
const AUDIENCE_VALUES = Object.fromEntries(Object.entries(AUDIENCE_LABELS).map(([v, l]) => [l, v]));

// ---- Multi-select + bulk actions ----
const selectMode = ref(false);
const selectedIds = ref(new Set());

const toggleSelectMode = () => {
  selectMode.value = !selectMode.value;
  if (!selectMode.value) selectedIds.value = new Set();
};
const isSelected = (p) => selectedIds.value.has(p.id);
const toggleSelect = (p) => {
  if (!p.owned) return; // shared public places belong to someone else
  const next = new Set(selectedIds.value);
  next.has(p.id) ? next.delete(p.id) : next.add(p.id);
  selectedIds.value = next;
};
const selectAll = () => {
  selectedIds.value = new Set(shownPlaces.value.filter((p) => p.owned).map((p) => p.id));
};
const clearSelection = () => (selectedIds.value = new Set());

/** Runs an async op over the selection with small parallel batches; reloads after. */
const runBulk = async (op, doneMessage) => {
  const ids = [...selectedIds.value];
  if (!ids.length) return;
  let failed = 0;
  const BATCH = 5;
  for (let i = 0; i < ids.length; i += BATCH) {
    const results = await Promise.allSettled(ids.slice(i, i + BATCH).map(op));
    failed += results.filter((r) => r.status === 'rejected').length;
  }
  clearSelection();
  await Promise.all([loadPlaces(), loadFolders()]);
  if (failed) toast.warning('Partly done', `${failed} of ${ids.length} failed`);
  else toast.success(doneMessage, `${ids.length} place${ids.length === 1 ? '' : 's'}`);
};

const bulkVisibility = (visibility) =>
  runBulk(
    (id) => api.patch(`/api/places/${id}`, { visibility }),
    visibility === 'PUBLIC' ? 'Made public' : 'Made private',
  );

const bulkChangeType = (typeLabelValue) => {
  const type = typeValueFromLabel(typeLabelValue);
  if (!type) return;
  return runBulk((id) => api.patch(`/api/places/${id}`, { type }), `Type set to ${typeLabelValue}`);
};

const bulkMoveToFolder = (folderName) => {
  const folderId = folderValueFromLabel(folderName);
  if (!folderId) return;
  return runBulk(
    (id) => api.put(`/api/folders/${folderId}/places/${id}`),
    `Moved to ${folderName}`,
  );
};

/** Trip list only: drop the selection from this trip, keeping the places. */
const bulkRemoveFromTrip = () => {
  if (!routeTripId.value) return;
  return runBulk(
    (id) => api.delete(`/api/places/${id}/trips/${routeTripId.value}`),
    'Removed from trip',
  );
};

const bulkDelete = async () => {
  const n = selectedIds.value.size;
  if (!n) return;
  const ok = await confirm({
    title: 'Delete places',
    message: `Delete ${n} place${n === 1 ? '' : 's'}? This cannot be undone.`,
    tone: 'danger',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
  });
  if (!ok) return;
  await runBulk((id) => api.delete(`/api/places/${id}`), 'Deleted');
};

// Table view: the select column appears only in selection mode.
// Columns are chosen by the width actually available, not by whether the panel
// is open: on a wide screen everything still fits beside it. Short facts get
// fixed widths so the name column keeps all the slack.
const listEl = ref(null);
const listWidth = ref(0);
let listObserver = null;

const placeColumns = computed(() => {
  // Before the observer reports, assume roomy: better than flashing a narrow set.
  const room = (min) => (listWidth.value || 1200) >= min;
  const anyVisit = shownPlaces.value.some((p) => p.visitMinutes);
  const anyFolder = shownPlaces.value.some((p) => p.folderId);
  return [
    ...(selectMode.value ? [{ key: 'sel', label: '', width: '34px' }] : []),
    { key: 'name', label: 'Place' },
    { key: 'rating', label: 'Rating', width: '92px' },
    // Thresholds are "the name column still reads at ~250px after this one".
    ...(room(460) ? [{ key: 'type', label: 'Type', width: '132px' }] : []),
    // A column nobody in this list has filled is pure wasted width.
    ...(room(780) && anyVisit ? [{ key: 'visit', label: 'Time', width: '78px' }] : []),
    ...(room(660) ? [{ key: 'flags', label: 'Flags', width: '152px' }] : []),
    ...(room(920) && anyFolder ? [{ key: 'folder', label: 'Folder', width: '140px' }] : []),
  ];
});
const tableRowClass = (p) => ({
  'card--selectable': selectMode.value && p.owned,
  'card--unselectable': selectMode.value && !p.owned,
  'row--selected': isSelected(p),
});

// Rating filter: multi-select — show places matching ANY of the picked stars.
const filterRatings = ref(new Set());
const activeFilterCount = computed(
  () =>
    (filterCountry.value ? 1 : 0) +
    (filterType.value ? 1 : 0) +
    (filterVisibility.value ? 1 : 0) +
    (filterRatings.value.size ? 1 : 0),
);
const toggleRating = (n) => {
  const next = new Set(filterRatings.value);
  next.has(n) ? next.delete(n) : next.add(n);
  filterRatings.value = next;
};

const shownPlaces = computed(() => {
  let list = places.value;
  if (filterRatings.value.size) list = list.filter((p) => filterRatings.value.has(p.rating || 3));
  if (sortBy.value === 'rating') list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  return list;
});

/** Global list: add/remove a place from a trip's own list. */
const toggleTripMembership = async (place, tripId) => {
  if (!tripId) return;
  const inTrip = (place.tripIds || []).includes(tripId);
  try {
    const res = inTrip
      ? await api.delete(`/api/places/${place.id}/trips/${tripId}`)
      : await api.put(`/api/places/${place.id}/trips/${tripId}`);
    const idx = places.value.findIndex((p) => p.id === place.id);
    if (idx !== -1) places.value[idx] = res.data;
    toast.success(inTrip ? 'Removed from trip' : 'Added to trip', place.name);
  } catch {
    toast.danger('Error', 'Could not update the trip list');
  }
};

/** Trip list: drop a place from this trip (it stays in the global library). */
const removeFromCurrentTrip = async (place) => {
  if (!routeTripId.value) return;
  try {
    await api.delete(`/api/places/${place.id}/trips/${routeTripId.value}`);
    places.value = places.value.filter((p) => p.id !== place.id);
    await loadFolders();
    // The panel would otherwise keep showing a place that left the list.
    if (viewing.value?.id === place.id) showDialog.value = false;
    toast.success('Removed from trip', place.name);
  } catch {
    toast.danger('Error', 'Could not remove the place');
  }
};

// Photos that failed to load are skipped, not shown as a hole. Google's place
// photo links expire after a while and then answer 403, so a place whose first
// photo is one of those must still show the ones that work — typically the
// owner's own uploads, which sit after it. Only when nothing loads does the
// card fall back to the type placeholder.
const brokenPhotos = ref(new Set());
const livePhotos = (p) =>
  (p.photos || []).filter((url) => !isDeadPhotoUrl(url) && !brokenPhotos.value.has(url));
const hasPhoto = (p) => livePhotos(p).length > 0;
const cardPhoto = (p) => livePhotos(p)[photoIndex(p)];
const onPhotoError = (p) => {
  const url = cardPhoto(p);
  if (!url) return;
  brokenPhotos.value = new Set(brokenPhotos.value).add(url);
};

/** A thumbnail that fails to load (dead external link) drops out of the grid. */
const onThumbError = (url) => {
  brokenPhotos.value = new Set(brokenPhotos.value).add(url);
};

/** "City · Country" or the address; empty when we know nothing (no "No location" line). */
const placeLocation = (p) =>
  [p.city, countryName(p.country)].filter(Boolean).join(' · ') || p.address || '';

// Photo carousel state per place (id -> index), so cards keep their own position.
const photoCursor = ref({});
const photoIndex = (p) => {
  const n = livePhotos(p).length;
  if (!n) return 0;
  return (((photoCursor.value[p.id] || 0) % n) + n) % n;
};
const shiftPhoto = (p, delta) => {
  photoCursor.value = { ...photoCursor.value, [p.id]: photoIndex(p) + delta };
};

// Rating balance per the strategy: 4★ ≈ 10%, 3★ ≈ 20%, 2★ ≈ 30%, rest 1★.
// The strategy names "7-8 must-sees"; expressed as 5% it scales with the list
// (and lands on 7-8 at ~150 places, the middle of the 100-300 per week range).
const showBalance = ref(false);
const RATING_COLORS = { 5: '#dc2626', 4: '#f97316', 3: '#eab308', 2: '#9ca3af', 1: '#d1d5db' };

const ratingBalance = computed(() => {
  const total = places.value.length;
  if (!total) return null;
  const count = (r) => places.value.filter((p) => (p.rating || 3) === r).length;
  const aim = {
    5: `~${Math.max(1, Math.round(total * 0.05))}`,
    4: `~${Math.round(total * 0.1)}`,
    3: `~${Math.round(total * 0.2)}`,
    2: `~${Math.round(total * 0.3)}`,
    1: 'rest',
  };
  return [5, 4, 3, 2, 1].map((r) => ({
    r,
    n: count(r),
    aim: aim[r],
    share: (count(r) / total) * 100,
    color: RATING_COLORS[r],
  }));
});

/** The quotas apply to a trip's whole shortlist — not to the global library
 *  (other people's places) and not to a single folder (a slice of the trip). */
const showRatingBalance = computed(
  () =>
    !!ratingBalance.value && (tripMode.value || !!selectedTripId.value) && !selectedFolderId.value,
);

/** Short nudge when the top of the list is off — the whole point of the quotas. */
const balanceWarning = computed(() => {
  const b = ratingBalance.value;
  if (!b) return '';
  const total = places.value.length;
  const fives = b[0].n;
  const target = Math.max(1, Math.round(total * 0.05));
  if (fives > target * 1.5) return `${fives} must-sees, aim for ~${target}`;
  if (!fives && total > 10) return 'no must-sees picked yet';
  return '';
});
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

const tripLabels = computed(() => trips.value.map((t) => t.title));
const tripValueFromLabel = (title) => trips.value.find((t) => t.title === title)?.id ?? null;
/** Card placeholder: which trips already include this place. */
const tripMembershipLabel = (p) => {
  const names = (p.tripIds || [])
    .map((id) => trips.value.find((t) => t.id === id)?.title)
    .filter(Boolean);
  return names.length ? `🗺 ${names.join(', ')}` : '＋ Add to trip';
};

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
  rating: 3,
  ratingComment: '',
  visitMinutes: null,
  audience: 'ALL',
  needsPreparation: false,
  needsBooking: false,
  photoList: [],
};
const form = ref({ ...emptyForm });
const linksText = ref('');

const splitList = (s) =>
  (s || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

// Tripadvisor costs quota per lookup (a search plus a details call), so it is
// never fetched just because a place was opened — the user asks for it.
const taData = ref(null);
const taState = ref('idle'); // idle | loading | loaded | none | error

const resetTripadvisor = () => {
  taData.value = null;
  taState.value = 'idle';
};

const loadTripadvisor = async (placeId) => {
  taData.value = null;
  taState.value = 'loading';
  try {
    const res = await api.get(`/api/places/${placeId}/tripadvisor`);
    // 204 = no match on Tripadvisor; say so instead of offering the button again.
    taData.value = res.status === 200 ? res.data : null;
    taState.value = taData.value ? 'loaded' : 'none';
  } catch {
    taState.value = 'error';
  }
};

// The drawer shows details first; editing is an explicit step from its footer.
// ---- Location: one map for both modes, filled by the Google-backed search ----
const mapMarkers = computed(() => {
  const src = drawerMode.value === 'edit' ? form.value : viewing.value;
  if (!src?.latitude || !src?.longitude) return [];
  return [{ lat: Number(src.latitude), lon: Number(src.longitude), label: src.name || '' }];
});

/** /api/geo/places returns the country's readable name; the form wants its code. */
const countryCodeByName = (name) =>
  allCountries.value.find((c) => c.name.toLowerCase() === String(name || '').toLowerCase())?.code ||
  '';

const onAddressSelect = (r) => {
  if (!r) {
    // Clearing the field is the only way to drop a wrong pin now.
    form.value.latitude = null;
    form.value.longitude = null;
    return;
  }
  form.value.address = r.displayName || r.name || '';
  if (r.city) form.value.city = r.city;
  const code = countryCodeByName(r.country);
  if (code) form.value.country = code;
  form.value.latitude = r.lat;
  form.value.longitude = r.lon;
};

// ---- Photos: a lightbox to view, an upload the API normalises on the way in ----
// Both numbers mirror PlacePhotoService on the backend, which is the authority.
const MAX_PHOTOS = 12;
const MAX_PHOTO_EDGE = 1600;
const viewerOpen = ref(false);
const viewerIndex = ref(0);
const uploading = ref(false);
const uploadKey = ref(0);
const photoInput = ref(null);

// Photos of the place open in the panel, minus the ones that turned out dead.
// The grid renders from this same list, so a viewer index always matches.
const shownPhotos = computed(() =>
  (drawerMode.value === 'edit' ? form.value.photoList : viewing.value?.photos || []).filter(
    (url) => !isDeadPhotoUrl(url) && !brokenPhotos.value.has(url),
  ),
);
const viewerPhotos = computed(() => shownPhotos.value.map(photoSrc));

const openViewer = (i) => {
  viewerIndex.value = i;
  viewerOpen.value = true;
};

const pickPhotos = () => photoInput.value?.click();

const onPhotoInput = (e) => {
  uploadPhotos(Array.from(e.target.files || []));
  e.target.value = ''; // so picking the same file twice still fires
};

/** Puts a place returned by the photo endpoints back into every view of it. */
const applyPlace = (data) => {
  const idx = places.value.findIndex((x) => x.id === data.id);
  if (idx !== -1) places.value[idx] = data;
  if (viewing.value?.id === data.id) viewing.value = data;
  if (editing.value?.id === data.id) {
    editing.value = data;
    form.value.photoList = [...(data.photos || [])];
  }
};

const uploadPhotos = async (files) => {
  const target = viewing.value || editing.value;
  if (!target || !files?.length) return;
  uploading.value = true;
  try {
    for (const file of files) {
      const body = new FormData();
      body.append('file', file);
      const res = await api.post(`/api/places/${target.id}/photos`, body);
      applyPlace(res.data);
    }
    toast.success(files.length > 1 ? `${files.length} photos added` : 'Photo added');
  } catch (e) {
    // The server explains the refusal (too large, wrong type, place full).
    toast.danger('Upload failed', e.response?.data?.message || 'Could not store the image');
  } finally {
    uploading.value = false;
    uploadKey.value += 1; // remounts the dropzone, clearing its staged list
  }
};

const removePhoto = (url) => {
  const target = editing.value || viewing.value;
  if (!target) return;
  confirm({
    title: 'Confirm',
    message: 'Remove this photo?',
    tone: 'danger',
    confirmLabel: 'Remove',
    cancelLabel: 'Cancel',
  }).then(async (ok) => {
    if (!ok) return;
    try {
      const res = await api.delete(`/api/places/${target.id}/photos`, { params: { url } });
      applyPlace(res.data);
    } catch {
      toast.danger('Error', 'Failed to remove photo');
    }
  });
};

const drawerMode = ref('view');
const viewing = ref(null);

/** Row/card click → read-only details. */
const openDetails = (p) => {
  viewing.value = p;
  drawerMode.value = 'view';
  resetTripadvisor();
  showDialog.value = true;
};

const openDialog = (p) => {
  drawerMode.value = 'edit';
  if (p) {
    editing.value = p;
    viewing.value = p;
    resetTripadvisor();
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
      rating: p.rating || 3,
      ratingComment: p.ratingComment || '',
      visitMinutes: p.visitMinutes ?? null,
      audience: p.audience || 'ALL',
      needsPreparation: !!p.needsPreparation,
      needsBooking: !!p.needsBooking,
      photoList: [...(p.photos || [])],
    };
    linksText.value = (p.links || []).join(', ');
  } else {
    editing.value = null;
    resetTripadvisor();
    form.value = { ...emptyForm, photoList: [], country: tripCountryCodes.value[0] || '' };
    linksText.value = '';
  }
  showDialog.value = true;
};

const save = async () => {
  saving.value = true;
  try {
    const { photoList, ...fields } = form.value;
    const payload = { ...fields, photos: photoList, links: splitList(linksText.value) };
    if (editing.value) {
      const res = await api.patch(`/api/places/${editing.value.id}`, payload);
      const idx = places.value.findIndex((p) => p.id === editing.value.id);
      if (idx !== -1) places.value[idx] = res.data;
      viewing.value = res.data;
      drawerMode.value = 'view'; // back to details, so the change is visible
    } else {
      const res = await api.post('/api/places', payload);
      places.value.unshift(res.data);
      viewing.value = res.data;
      drawerMode.value = 'view';
    }
    toast.success('Saved');
  } catch {
    toast.danger('Error', 'Failed to save place');
  } finally {
    saving.value = false;
  }
};

// ---- Find & import dialog: parallel Google + Tripadvisor search ----
const findQuery = ref('');
const finding = ref(false);
const searched = ref(false);
const findGoogle = ref([]);
const findTa = ref([]);
const savingKey = ref(''); // which result row is being saved

const runFind = async () => {
  const q = findQuery.value.trim();
  if (q.length < 2) return;
  finding.value = true;
  try {
    const params = { q };
    const [g, t] = await Promise.allSettled([
      api.get('/api/geo/places', { params }),
      api.get('/api/geo/tripadvisor', { params }),
    ]);
    findGoogle.value = g.status === 'fulfilled' ? g.value.data : [];
    findTa.value = t.status === 'fulfilled' ? t.value.data : [];
    searched.value = true;
  } finally {
    finding.value = false;
  }
};

/** Adds a saved place to the top of the list (or refreshes it in place). */
const upsertPlace = (place) => {
  const idx = places.value.findIndex((p) => p.id === place.id);
  if (idx !== -1) places.value[idx] = place;
  else places.value.unshift(place);
};

// Google result: geocode-create by its precise display name (dedupes by place id).
const addGoogleResult = async (r, key) => {
  savingKey.value = key;
  try {
    const res = await api.post('/api/places/geocode', {
      text: r.displayName || r.name,
      country: null,
    });
    upsertPlace(res.data);
    toast.success('Place saved', res.data.name);
  } catch {
    toast.warning('Not found', 'Could not save this place');
  } finally {
    savingKey.value = '';
  }
};

// Tripadvisor result: create directly from its data; enrichment adds photos/description.
const TA_CATEGORY_TO_TYPE = { attraction: 'SIGHTSEEING', restaurant: 'RESTAURANT', hotel: 'OTHER' };
const addTaResult = async (r, key) => {
  savingKey.value = key;
  try {
    const res = await api.post('/api/places', {
      name: r.name,
      type: TA_CATEGORY_TO_TYPE[(r.category || '').toLowerCase()] || 'SIGHTSEEING',
      country: r.countryCode || null,
      city: r.city || null,
      address: r.address || null,
      latitude: r.latitude,
      longitude: r.longitude,
    });
    upsertPlace(res.data);
    toast.success('Place saved', res.data.name);
  } catch {
    toast.warning('Error', 'Could not save this place');
  } finally {
    savingKey.value = '';
  }
};

// Import a place from a Google Maps / Tripadvisor share link.
const importUrl = ref('');
const importing = ref(false);
const runImport = async () => {
  if (!importUrl.value.trim()) return;
  importing.value = true;
  try {
    const res = await api.post('/api/places/import', { url: importUrl.value.trim() });
    upsertPlace(res.data);
    importUrl.value = '';
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
      tripId: selectedFolderId.value
        ? undefined
        : routeTripId.value || selectedTripId.value || undefined,
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
    const params = routeTripId.value ? { tripId: routeTripId.value } : {};
    folders.value = (await api.get('/api/folders', { params })).data || [];
  } catch {
    /* none */
  }
};

/** Scope chips are mutually exclusive: all places, one trip, or one folder. */
const selectScope = ({ tripId = null, folderId = null }) => {
  selectedTripId.value = tripId;
  selectedFolderId.value = folderId;
  clearSelection();
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
    if (editingFolder.value) {
      await api.patch(`/api/folders/${editingFolder.value.id}`, folderForm.value);
    } else {
      // Folders belong to the trip they're created in — without tripId the new
      // folder lands outside the trip and never shows up in its list.
      await api.post('/api/folders', {
        ...folderForm.value,
        tripId: routeTripId.value || undefined,
      });
    }
    showFolderDialog.value = false;
    await loadFolders();
    toast.success(editingFolder.value ? 'Folder saved' : 'Folder created', folderForm.value.name);
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

// Trip chips: scope the library to one trip's itinerary.
const trips = computed(() => tripStore.trips);

watch(routeTripId, async () => {
  selectedFolderId.value = null;
  selectedTripId.value = null;
  clearSelection();
  await Promise.all([loadFolders(), loadPlaces()]);
});

/** Width the table can actually use, measured rather than assumed. */
const measureList = () => {
  const el = listEl.value;
  if (!el) return;
  const pad = parseFloat(getComputedStyle(el).paddingRight) || 0;
  listWidth.value = Math.round(el.clientWidth - pad);
};

onMounted(() => {
  measureList();
  window.addEventListener('resize', measureList);
  // Belt and braces: catches layout shifts no event of ours announces.
  if (listEl.value && typeof ResizeObserver !== 'undefined') {
    listObserver = new ResizeObserver(measureList);
    listObserver.observe(listEl.value);
  }
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', measureList);
  listObserver?.disconnect();
});

// The two things that change the list's width from inside the app.
watch([showDialog, viewMode], async () => {
  await nextTick();
  measureList();
});

onMounted(async () => {
  loadCountries();
  loadFolders();
  if (!tripStore.trips.length) tripStore.fetchAll().catch(() => {});
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
.find-section {
  border-top: 1px solid var(--border-default);
  padding-top: 10px;
  margin-top: 4px;
}
.find-section-title {
  font: var(--type-code);
  color: var(--text-secondary);
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.find-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 0;
}
.find-row + .find-row {
  border-top: 1px dashed var(--border-default);
}
.find-row-name {
  font: var(--fw-semibold) 14px/1.3 var(--font-sans);
}

.bulk-bar {
  position: fixed;
  left: 50%;
  bottom: 20px;
  transform: translateX(-50%);
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  max-width: calc(100vw - 48px);
  padding: 10px 14px;
  background: var(--card);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-pill);
  box-shadow: var(--elevation-3);
}
.dock-enter-active,
.dock-leave-active {
  transition:
    opacity var(--dur-base) var(--ease-out),
    transform var(--dur-base) var(--ease-out);
}
.dock-enter-from,
.dock-leave-to {
  opacity: 0;
  transform: translate(-50%, 12px);
}

/* Selection mode: the whole card becomes one click target. */
.card--selectable {
  cursor: pointer;
}
.card--selectable :deep(*) {
  pointer-events: none;
}
.card--unselectable {
  opacity: 0.45;
}
.card--selected {
  box-shadow: 0 0 0 3px var(--input-select-focus-bg) !important;
  border-color: var(--primary) !important;
}
.select-check {
  position: absolute;
  top: 7px;
  left: 7px;
  z-index: 2;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--card);
  border: 1px solid var(--border-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: transparent;
  box-shadow: var(--shadow-sm);
}
.select-check.on {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

/* The editor drawer is a sibling column, so it never covers the top bar. */
.places-layout {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}
.places-col {
  flex: 1;
  min-width: 0;
}
/* With the panel open the list owns the scrolling: the page itself then fits
   the viewport, so its scrollbar no longer runs down the panel's edge (where it
   looked like the details were scrolling), and the panel never scrolls at all. */
.places-layout--split .places-col {
  height: calc(100vh - var(--topbar-height) - 2 * var(--page-pad));
  overflow-y: auto;
  padding-right: var(--space-3);
  /* Reserve the bar's track so the grid doesn't shift when it appears. */
  scrollbar-gutter: stable;
}
/* Same quiet bar the page itself uses, so it reads as part of the app. */
.places-col::-webkit-scrollbar {
  width: 10px;
}
.places-col::-webkit-scrollbar-track {
  background: transparent;
}
.places-col::-webkit-scrollbar-thumb {
  background: var(--ink-200);
  border-radius: 8px;
  border: 3px solid var(--bg);
}
/* In table view the rows scroll inside the card: the filters stay put, the
   header stays readable, and the card keeps a real bottom edge. */
.places-layout--split .places-col--table {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.places-layout--split .places-col--table .place-table-wrap {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
.places-layout--split .places-col--table :deep(thead th) {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--card);
}

.scope-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 16px;
}
.scope-sep {
  width: 1px;
  height: 20px;
  background: var(--border-default);
  margin: 0 2px;
}

/* Rename/delete icons inside the active folder chip. */
.chip-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin-left: 1px;
  border-radius: 50%;
  font-size: 10px;
  opacity: 0.75;
}
.chip-action:first-of-type {
  margin-left: 4px;
}
.chip-action:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.25);
}

/* The fields sit in the filter row as if the wrapper were not there — until a
   phone folds them behind the button below. */
.filters-extra {
  display: contents;
}
.filters-toggle {
  display: none;
}

.filters-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 14px;
  /* One gap below the filters, whatever follows: the toolbar, the loading
     skeleton or the empty state — the latter used to sit flush against them. */
  margin-bottom: 16px;
}

.rating-filter {
  display: flex;
  gap: 4px;
  align-items: center;
  margin-left: auto;
}
.rating-chip {
  padding: 8px 10px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-pill);
  background: var(--card);
  color: var(--text-secondary);
  font: var(--fw-medium) 12px/1 var(--font-sans);
  cursor: pointer;
  transition:
    background var(--dur-base) var(--ease-out),
    color var(--dur-base) var(--ease-out);
}
.rating-chip:hover {
  border-color: var(--border-strong);
}
.rating-chip.on {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}
.rating-chip--clear {
  color: var(--text-disabled);
}

/* Rating balance — collapsed to one line by default, opens into a bar + legend. */
.balance-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  font: var(--type-code);
  color: var(--text-secondary);
}
.balance-toggle:hover {
  color: var(--text-primary);
}
.balance-toggle .pi {
  font-size: 10px;
}
.balance-warn {
  margin-left: 4px;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  background: var(--warning-100);
  color: var(--warning-500);
  font: var(--fw-medium) 11px/1.4 var(--font-sans);
}

.balance-body {
  margin-top: 10px;
  max-width: 620px;
}
.balance-bar {
  display: flex;
  height: 8px;
  border-radius: var(--radius-pill);
  overflow: hidden;
  background: var(--surface);
}
.balance-seg {
  height: 100%;
}
.balance-legend {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 8px;
}
.balance-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font: var(--fw-regular) 12px/1 var(--font-sans);
  color: var(--text-secondary);
}
.balance-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.balance-aim {
  color: var(--text-disabled);
}

.bulk-sep {
  width: 1px;
  height: 20px;
  background: var(--border-default);
  margin: 0 2px;
}

.toolbar-label {
  font: var(--type-code);
  color: var(--text-secondary);
  margin-right: 6px;
}
.rating-filter-label {
  font: var(--type-code);
  color: var(--text-secondary);
  margin-right: 2px;
}

.places-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  /* Count, sort and the view switch sit on one line while there is room. */
  flex-wrap: wrap;
}
/* Pushes the sort and view controls to the right edge on a wide screen. */
.toolbar-spacer {
  flex: 1;
}
.toolbar-sort {
  width: 140px;
  margin-right: 8px;
}

.place-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;
  margin-top: 12px;
  align-items: stretch;
}

.place-table-wrap {
  margin-top: 12px;
  background: var(--card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow-x: auto;
}
/* Fixed layout so long names and addresses truncate instead of pushing the
   table wider than the column it lives in. */
.place-table-wrap :deep(.table) {
  table-layout: fixed;
  width: 100%;
}
.place-table-wrap :deep(td) {
  overflow: hidden;
  padding: 9px 14px;
}
.place-table-wrap :deep(th) {
  padding: 9px 14px;
}
/* Rating is the field you scan by, so it carries weight and colour — but as
   text, not as a pill. Threes and below stay quiet. */
.cell-rating {
  font: var(--fw-regular) var(--text-sm)/1 var(--font-sans);
  color: var(--text-secondary);
  white-space: nowrap;
}
.cell-rating--4 {
  font-weight: var(--fw-semibold);
  color: var(--text-primary);
}
.cell-rating--5 {
  font-weight: var(--fw-bold);
  color: var(--warning-700);
}
.cell-flag {
  font: var(--fw-medium) 12px/1 var(--font-sans);
  white-space: nowrap;
}
.cell-flag--book {
  color: var(--success-700);
}
.cell-flag--prep {
  color: var(--danger-700);
}
.cell-name {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

/* Two lines of quote carry the tone; the link has the rest. */
.review-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ---- Editable detail rows: the .info-row grid with a control on the right ---- */
/* TfPlaceSearch styles its own input (42px, 14px text) — match the other
   fields in the panel, which sit at 41px. */
.edit-control :deep(.tf-place-input) {
  height: 41px;
  font-size: var(--text-base);
}
.edit-row {
  gap: var(--space-4);
}
.edit-row .info-label {
  flex: none;
}
.edit-control {
  width: 250px;
  flex: none;
}
/* Full-width value under the label — for long text (address, links, notes). */
.edit-row--stack {
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-1);
}
.edit-row--stack .edit-control {
  width: auto;
}
/* Controls that carry their own natural width (stars, segmented control). */
.edit-control--auto {
  width: auto;
}
.edit-control--narrow {
  width: 96px;
}
.edit-control--pair {
  display: flex;
  gap: var(--space-2);
}
.edit-control--pair > * {
  flex: 1;
  min-width: 0;
}
.edit-control--check {
  display: flex;
  justify-content: flex-end;
  width: auto;
  cursor: pointer;
}
.edit-control--check input {
  width: 16px;
  height: 16px;
  accent-color: var(--primary);
  cursor: pointer;
}
.cell-name-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 1px;
}
.cell-name-sub {
  font: var(--fw-regular) 12px/1.35 var(--font-sans);
  color: var(--text-secondary);
}
.cell-flags {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 13px;
}

.cell-clip {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cell-name-text {
  font: var(--fw-semibold) 15px/1.3 var(--font-sans);
}
.row--selected td {
  background: var(--success-100);
}
.select-check--inline {
  position: static;
}
.place-thumb {
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-default);
  overflow: hidden;
}
.place-thumb img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
/* Must follow the base rule — declared before it, the smaller size lost and
   table rows were 69px tall because of a 44px thumbnail. */
.place-thumb--sm,
.cell-name .cat-icon--sm {
  width: 34px;
  height: 34px;
  font-size: 15px;
}

.place-card {
  /* One height for every card, split the same way: a fixed text block and the
     cover taking the rest. Nothing has to be reserved or pushed around. */
  height: 300px;
  position: relative;
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

/* 16:9 keeps the photo useful without eating the card. */
.place-card-cover {
  /* The card's height is fixed, the text block takes what it needs, and the
     cover absorbs the rest — so a short description leaves no empty strip. */
  flex: 1;
  min-height: 120px;
  position: relative;
  background: var(--surface);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
/* Absolute, not in flow: a photo taller than 16:9 would otherwise stretch the
   cover past its ratio and make that one card taller than the rest. */
.place-card-cover img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.cover-placeholder {
  font-size: 26px;
  opacity: 0.4;
}
.place-card-cover::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(33, 27, 23, 0.32), transparent 40%);
  pointer-events: none;
}

/* Publicity is a quiet fact, not a status — neutral, never green. */
.cover-icon {
  position: absolute;
  top: 7px;
  left: 7px;
  z-index: 1;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(33, 27, 23, 0.45);
  backdrop-filter: blur(3px);
  color: rgba(255, 255, 255, 0.92);
  font-size: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Every card shows its rating, but the weight is graded so 5★ still stands out. */
.cover-rating {
  position: absolute;
  top: 7px;
  right: 7px;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 8px;
  border-radius: var(--radius-pill);
  background: rgba(33, 27, 23, 0.5);
  backdrop-filter: blur(3px);
  color: #fff;
  font: var(--fw-semibold) 11px/1 var(--font-mono);
}
.cover-rating .pi {
  font-size: 9px;
  color: var(--warning-300);
}
.cover-rating--top {
  background: var(--warning-500);
  color: var(--ink-800);
}
.cover-rating--top .pi {
  color: var(--ink-800);
}
/* 1-3★ stay quiet: readable, but they don't compete with the must-sees. */
.cover-rating--low {
  background: rgba(33, 27, 23, 0.34);
  color: rgba(255, 255, 255, 0.85);
}
.cover-rating--low .pi {
  color: rgba(255, 255, 255, 0.6);
}

/* Photo carousel: arrows appear on hover, counter bottom-right. */
.cover-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 50%;
  background: rgba(33, 27, 23, 0.5);
  color: #fff;
  font-size: 11px;
  cursor: pointer;
  opacity: 0;
  transition: opacity var(--dur-base) var(--ease-out);
}
.cover-nav--prev {
  left: 8px;
}
.cover-nav--next {
  right: 8px;
}
.place-card:hover .cover-nav {
  opacity: 1;
}
.cover-nav:hover {
  background: rgba(33, 27, 23, 0.75);
}
.cover-dots {
  position: absolute;
  bottom: 8px;
  right: 8px;
  z-index: 1;
  padding: 2px 7px;
  border-radius: var(--radius-pill);
  background: rgba(33, 27, 23, 0.5);
  color: #fff;
  font: var(--fw-medium) 10px/1.4 var(--font-mono);
}

.place-card-body {
  padding: 10px 12px 6px;
  display: flex;
  flex-direction: column;
  /* Its own height: two-line name, city, facts and up to two lines of
     description — every field clamped, so it can never run away. */
  flex: none;
  overflow: hidden;
}

/* Clear hierarchy: the name is the only loud thing in the card. */
.place-card-name {
  margin: 0;
  font: var(--fw-bold) 15px/1.25 var(--font-display);
  color: var(--text-primary);
  letter-spacing: -0.01em;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.place-card-sub {
  margin-top: 2px;
  font: var(--fw-regular) 11px/1.3 var(--font-sans);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.place-card-sub .pi {
  font-size: 9px;
  flex: none;
}

.place-card-meta {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: nowrap;
  overflow: hidden;
}
.meta-fact {
  font: var(--fw-medium) 11px/1 var(--font-mono);
  color: var(--text-secondary);
}
.meta-fact--muted {
  color: var(--text-disabled);
  font-style: italic;
}

.place-card-desc {
  margin: 6px 0 0;
  font: var(--fw-regular) 12px/1.4 var(--font-sans);
  color: var(--text-secondary);
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

/* ---- Phones: last in the file, so these win over the rules above ---- */
@media (max-width: 700px) {
  /* Icon-only actions lose the padding meant for a word beside the icon. */
  .phone-icon-btn {
    padding-left: 13px;
    padding-right: 13px;
  }
  /* The trip's folders scroll sideways instead of taking two rows. */
  .scope-chips {
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
    margin-top: 12px;
    padding-bottom: 2px;
  }
  .scope-chips::-webkit-scrollbar {
    display: none;
  }
  .scope-chips > * {
    flex: none;
  }
  /* A shorter card: two of them share the screen, and the cover still leads. */
  .place-card {
    height: 220px;
  }
  /* Search stays; the rest waits behind the button. */
  .filters-toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex: none;
    height: 40px;
    padding: 0 14px;
    border: 1.5px solid var(--border-default);
    border-radius: var(--radius-pill);
    background: var(--card);
    color: var(--text-primary);
    font: var(--fw-medium) 13px/1 var(--font-sans);
    cursor: pointer;
  }
  .filters-toggle.is-on {
    border-color: var(--border-strong);
    background: var(--surface);
  }
  .filters-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: var(--radius-pill);
    background: var(--accent);
    color: #fff;
    font: var(--fw-semibold) 11px/1 var(--font-mono);
  }
  .filters-extra {
    display: none;
  }
  .filters-extra.is-open {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    flex-basis: 100%;
  }
  .filters-extra.is-open > div {
    flex: 1 1 140px;
  }
  /* The toolbar: no word for "Sort" (the select says it), no spacer pushing
     the controls apart, and a sort field that takes what is left. Four rows
     become two. */
  .toolbar-label,
  .toolbar-spacer {
    display: none;
  }
  .places-toolbar {
    gap: 8px;
  }
  .toolbar-sort {
    flex: 1 1 110px;
  }
}
</style>
