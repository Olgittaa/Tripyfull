<template>
  <div class="page-content--wide">
    <div v-if="loading" style="display: flex; flex-direction: column; gap: 20px">
      <div class="skeleton" style="height: 40px; width: 300px"></div>
      <div style="display: flex; gap: 8px">
        <div
          v-for="i in 5"
          :key="i"
          class="skeleton"
          style="width: 58px; height: 52px; border-radius: var(--radius-md)"
        ></div>
      </div>
      <div class="skeleton" style="height: 200px"></div>
    </div>

    <template v-else>
      <!-- Day header with prev/next -->
      <div
        style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        "
      >
        <div style="display: flex; align-items: center; gap: 14px">
          <TfIconButton
            variant="outline"
            size="sm"
            label="Previous day"
            :disabled="currentDayIndex <= 0"
            @click="goToDay(currentDayIndex - 1)"
          >
            <i class="pi pi-chevron-left"></i>
          </TfIconButton>
          <div>
            <div class="tf-eyebrow" style="margin-bottom: 4px">
              Day {{ day?.dayNumber }} · {{ formatDateShort(day?.date) }}
            </div>
            <h1
              style="
                font: var(--fw-bold) 30px/1 var(--font-display);
                letter-spacing: -0.03em;
                display: flex;
                align-items: center;
                gap: 8px;
              "
            >
              {{ day?.city || 'No city set' }}
            </h1>
          </div>
          <TfIconButton
            variant="outline"
            size="sm"
            label="Next day"
            :disabled="currentDayIndex >= allDays.length - 1"
            @click="goToDay(currentDayIndex + 1)"
          >
            <i class="pi pi-chevron-right"></i>
          </TfIconButton>
        </div>
        <div style="display: flex; gap: 8px; align-items: center">
          <TfButton
            v-if="activities.length > 1"
            variant="ghost"
            size="sm"
            @click="sortByTime"
            title="Reorder activities by their start time"
          >
            <i class="pi pi-sort-amount-down" style="font-size: 13px"></i> Sort by time
          </TfButton>
          <TfButton variant="primary" @click="openAddDialog">
            <i class="pi pi-plus" style="font-size: 14px"></i> Activity
          </TfButton>
        </div>
      </div>

      <!-- Day picker strip -->
      <div class="day-picker" v-if="allDays.length > 1">
        <button
          v-for="d in allDays"
          :key="d.id"
          class="day-picker-btn"
          :class="d.id === dayId ? 'day-picker-btn--on' : 'day-picker-btn--off'"
          @click="switchDay(d.id)"
        >
          <div class="day-picker-label">D{{ d.dayNumber }}</div>
          <div class="day-picker-date">{{ formatDateShort(d.date) }}</div>
        </button>
      </div>

      <!-- Two-column: itinerary (left) + day route map (right) -->
      <div class="itin-layout">
        <div class="itin-main">
          <!-- Day info: city + overnight -->
          <div
            class="card"
            style="
              margin-bottom: 24px;
              display: flex;
              gap: 20px;
              flex-wrap: wrap;
              align-items: flex-start;
            "
          >
            <!-- Cities / places -->
            <div style="flex: 1; min-width: 200px">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px">
                <i class="pi pi-map-marker" style="color: var(--accent); font-size: 16px"></i>
                <span
                  style="
                    font: var(--fw-semibold) 14px/1 var(--font-sans);
                    color: var(--text-primary);
                  "
                  >Visiting</span
                >
              </div>
              <div
                v-if="!editingCity"
                style="display: flex; align-items: center; gap: 8px; cursor: pointer"
                @click="
                  editingCity = true;
                  cityDraft = day?.city || '';
                "
              >
                <span
                  style="
                    font: var(--fw-medium) 15px/1.2 var(--font-display);
                    color: var(--text-primary);
                  "
                >
                  {{ day?.city || 'Set cities...' }}
                </span>
                <i class="pi pi-pencil" style="font-size: 11px; color: var(--text-secondary)"></i>
              </div>
              <div v-else style="display: flex; gap: 6px; align-items: center">
                <TfCitySearch
                  v-model="cityDraft"
                  placeholder="e.g. Tokyo, Kamakura"
                  style="flex: 1"
                  @select="onCitySelected"
                />
                <TfIconButton variant="ghost" size="sm" @click="saveCity"
                  ><i class="pi pi-check"></i
                ></TfIconButton>
                <TfIconButton variant="ghost" size="sm" @click="editingCity = false"
                  ><i class="pi pi-times"></i
                ></TfIconButton>
              </div>
            </div>

            <!-- Overnight stay -->
            <div style="flex: 1; min-width: 200px">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px">
                <i class="pi pi-moon" style="color: var(--accent); font-size: 16px"></i>
                <span
                  style="
                    font: var(--fw-semibold) 14px/1 var(--font-sans);
                    color: var(--text-primary);
                  "
                  >Overnight</span
                >
              </div>

              <!-- Not editing -->
              <div v-if="!editingOvernight">
                <!-- Has overnight set -->
                <template v-if="day?.overnightStay">
                  <div style="display: flex; align-items: center; gap: 8px">
                    <span
                      style="
                        font: var(--fw-medium) 15px/1.2 var(--font-display);
                        color: var(--text-primary);
                      "
                    >
                      {{ day.overnightStay }}
                    </span>
                    <i
                      class="pi pi-pencil"
                      style="font-size: 11px; color: var(--text-secondary); cursor: pointer"
                      @click="
                        editingOvernight = true;
                        overnightDraft = day.overnightStay;
                      "
                    ></i>
                  </div>
                  <!-- Linked booking badge -->
                  <div
                    v-if="linkedBooking"
                    style="margin-top: 6px; display: flex; align-items: center; gap: 6px"
                  >
                    <TfBadge tone="accent" variant="soft">
                      <i class="pi pi-link" style="font-size: 10px"></i>
                      {{ linkedBooking.name
                      }}{{
                        linkedBooking.accommodationCity
                          ? ' · ' + linkedBooking.accommodationCity
                          : ''
                      }}
                    </TfBadge>
                    <TfTooltip text="Unlink booking">
                      <button
                        style="
                          background: none;
                          border: none;
                          color: var(--text-secondary);
                          font-size: 11px;
                          cursor: pointer;
                          padding: 2px;
                        "
                        @click="unlinkBooking"
                      >
                        <i class="pi pi-times"></i>
                      </button>
                    </TfTooltip>
                  </div>
                </template>

                <!-- No overnight — show suggestion or placeholder -->
                <template v-else>
                  <!-- Booking suggestion available -->
                  <div v-if="overnightSuggestion">
                    <button
                      style="
                        border: 1.5px dashed var(--border-default);
                        background: transparent;
                        border-radius: var(--radius-md);
                        padding: 10px 14px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        color: var(--text-secondary);
                        font: var(--type-small);
                        width: 100%;
                        transition: all var(--dur-fast) var(--ease-out);
                        text-align: left;
                      "
                      @click="applyOvernightSuggestion"
                    >
                      <i
                        class="pi pi-sparkles"
                        style="color: var(--warning-300); font-size: 16px"
                      ></i>
                      <div>
                        <div
                          style="
                            font: var(--fw-semibold) 14px/1.2 var(--font-sans);
                            color: var(--text-primary);
                          "
                        >
                          {{ overnightSuggestion.name }}
                        </div>
                        <div
                          style="
                            font: var(--fw-regular) 12px/1.2 var(--font-sans);
                            color: var(--text-secondary);
                            margin-top: 2px;
                          "
                        >
                          {{ overnightSuggestion.accommodationCity }} · from booking
                        </div>
                      </div>
                    </button>
                    <div
                      style="
                        margin-top: 6px;
                        font: var(--type-small);
                        color: var(--text-secondary);
                        cursor: pointer;
                      "
                      @click="
                        editingOvernight = true;
                        overnightDraft = '';
                      "
                    >
                      or enter manually...
                    </div>
                  </div>
                  <!-- No suggestion -->
                  <div
                    v-else
                    style="display: flex; align-items: center; gap: 8px; cursor: pointer"
                    @click="
                      editingOvernight = true;
                      overnightDraft = '';
                    "
                  >
                    <span
                      style="
                        font: var(--fw-regular) 14px/1.2 var(--font-sans);
                        color: var(--text-secondary);
                      "
                      >Not set — click to add</span
                    >
                  </div>
                </template>
              </div>

              <!-- Editing manually -->
              <div v-else style="display: flex; gap: 6px; align-items: center">
                <TfInput
                  v-model="overnightDraft"
                  placeholder="e.g. Friend's apartment, Airbnb..."
                  style="flex: 1"
                  @keyup.enter="saveOvernightManual"
                  @keyup.escape="editingOvernight = false"
                />
                <TfIconButton variant="ghost" size="sm" @click="saveOvernightManual"
                  ><i class="pi pi-check"></i
                ></TfIconButton>
                <TfIconButton variant="ghost" size="sm" @click="editingOvernight = false"
                  ><i class="pi pi-times"></i
                ></TfIconButton>
              </div>
            </div>
          </div>

          <!-- Activities timeline -->
          <div v-if="activities.length" style="display: flex; flex-direction: column; gap: 12px">
            <div
              v-for="(a, i) in activities"
              :key="a.id"
              class="timeline-row"
              :class="{ 'is-dragging': dragIndex === i }"
              draggable="true"
              @dragstart="onDragStart(i, $event)"
              @dragover.prevent="onDragOver(i)"
              @drop.prevent
              @dragend="onDragEnd"
            >
              <div class="timeline-gutter">
                <i class="pi pi-bars drag-grip" title="Drag to reorder"></i>
                <span class="timeline-time">{{ a.startTime?.slice(0, 5) || '--:--' }}</span>
                <span v-if="i < activities.length - 1" class="timeline-line"></span>
              </div>
              <div class="timeline-content">
                <TfCard interactive @click="startEdit(a)" style="cursor: pointer">
                  <div style="display: flex; align-items: center; gap: 12px">
                    <div class="cat-icon cat-icon--lg" :style="catStyle(a.type)">
                      {{ typeIcon(a.type) }}
                    </div>
                    <div style="flex: 1; min-width: 0">
                      <div style="display: flex; align-items: center; gap: 8px">
                        <span
                          style="
                            font: var(--fw-semibold) 16px/1.2 var(--font-sans);
                            color: var(--text-primary);
                          "
                          >{{ a.name }}</span
                        >
                        <TfBadge v-if="a.type" tone="neutral" variant="soft">{{
                          typeLabel(a.type)
                        }}</TfBadge>
                      </div>
                      <div
                        style="
                          font: var(--fw-regular) 13px/1.3 var(--font-sans);
                          color: var(--text-secondary);
                          margin-top: 3px;
                          display: flex;
                          gap: 10px;
                          flex-wrap: wrap;
                        "
                      >
                        <span
                          v-if="a.startTime"
                          style="display: inline-flex; align-items: center; gap: 4px"
                        >
                          <i class="pi pi-clock" style="font-size: 12px"></i>
                          {{ a.startTime?.slice(0, 5)
                          }}{{ a.endTime ? ' – ' + a.endTime.slice(0, 5) : '' }}
                        </span>
                        <span
                          v-if="a.address"
                          style="display: inline-flex; align-items: center; gap: 4px"
                        >
                          <i class="pi pi-map-marker" style="font-size: 12px"></i>
                          {{ a.address }}
                        </span>
                        <span
                          v-if="a.placeName"
                          style="
                            display: inline-flex;
                            align-items: center;
                            gap: 4px;
                            color: var(--accent);
                          "
                        >
                          <i class="pi pi-bookmark" style="font-size: 12px"></i>
                          {{ a.placeName }}
                        </span>
                        <span v-if="stopNumbers[a.id]" class="onmap-pill">
                          <span class="onmap-dot">{{ stopNumbers[a.id] }}</span> on map
                        </span>
                      </div>
                      <div
                        v-if="a.notes"
                        style="
                          font: var(--type-small);
                          color: var(--text-secondary);
                          margin-top: 4px;
                          font-style: italic;
                        "
                      >
                        {{ a.notes }}
                      </div>
                    </div>
                    <span v-if="a.costEstimate" class="money money--md" style="flex: none">
                      {{ a.costEstimate }} {{ a.costCurrency || currency }}
                    </span>
                  </div>
                </TfCard>
              </div>
            </div>
          </div>

          <!-- Empty state + quick add from city places -->
          <template v-else>
            <div class="empty-state">
              <div class="empty-state-icon"><i class="pi pi-directions"></i></div>
              <h3>Nothing planned yet</h3>
              <p>Add an activity manually, or quickly from this city's saved places.</p>
            </div>

            <div v-if="cityPlaces.length" style="margin-top: 18px">
              <div class="addfrom-title">
                <i class="pi pi-map-marker" style="color: var(--accent)"></i> Add from places ·
                {{ day?.city }}
              </div>
              <div class="addfrom-grid">
                <button
                  v-for="p in cityPlaces"
                  :key="p.id"
                  type="button"
                  class="addfrom-item"
                  @click="openAddFromPlace(p)"
                >
                  <span
                    v-if="p.photos && p.photos.length"
                    class="addfrom-thumb"
                    :style="{ backgroundImage: `url(${p.photos[0]})` }"
                  ></span>
                  <span v-else class="cat-icon cat-icon--lg" :style="placeTypeStyle(p.type)">{{
                    placeTypeEmoji(p.type)
                  }}</span>
                  <span style="flex: 1; min-width: 0">
                    <span class="addfrom-name">{{ p.name }}</span>
                    <span class="addfrom-sub">{{
                      [placeTypeLabel(p.type), p.city || p.address].filter(Boolean).join(' · ')
                    }}</span>
                  </span>
                  <i class="pi pi-plus" style="color: var(--accent); font-size: 16px"></i>
                </button>
              </div>
              <div style="text-align: center; margin-top: 16px">
                <TfButton variant="ghost" @click="openAddDialog"
                  ><i class="pi pi-plus" style="font-size: 13px"></i> Or add manually</TfButton
                >
              </div>
            </div>
            <div v-else style="text-align: center; margin-top: 16px">
              <TfButton variant="primary" @click="openAddDialog"
                ><i class="pi pi-plus" style="font-size: 13px"></i> Add activity</TfButton
              >
            </div>
          </template>

          <!-- Day total by category -->
          <div
            v-if="activities.length"
            class="card"
            style="
              margin-top: 18px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              flex-wrap: wrap;
              gap: 16px;
            "
          >
            <div style="display: flex; gap: 18px; flex-wrap: wrap">
              <div
                v-for="(amount, type) in costByType"
                :key="type"
                style="display: flex; align-items: center; gap: 7px"
              >
                <div class="cat-icon cat-icon--sm" :style="catStyle(type)">
                  {{ typeIcon(type) }}
                </div>
                <span
                  style="
                    font: var(--fw-medium) 13px/1 var(--font-sans);
                    color: var(--text-secondary);
                  "
                  >{{ typeLabel(type) }}</span
                >
                <span class="money money--sm">{{ amount.toFixed(2) }} {{ currency }}</span>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px">
              <span
                style="font: var(--fw-medium) 13px/1 var(--font-sans); color: var(--text-secondary)"
                >Day total</span
              >
              <span class="money money--md">{{ dayTotal.toFixed(2) }} {{ currency }}</span>
            </div>
          </div>
        </div>
        <!-- /itin-main -->

        <!-- Right: day route map -->
        <aside class="itin-map">
          <div class="itin-map-head">
            <h3 style="font: var(--type-h3); margin: 0">Day route</h3>
            <span class="text-subtle text-sm"
              >{{ activityMarkers.length }} point{{ activityMarkers.length === 1 ? '' : 's' }}</span
            >
          </div>
          <BookingMap :markers="activityMarkers" numbered :height="520" />
          <div v-if="!activityMarkers.length" class="itin-map-empty">
            <i class="pi pi-map" style="font-size: 22px"></i>
            <span>No places with coordinates yet</span>
          </div>
        </aside>
      </div>
      <!-- /itin-layout -->
    </template>

    <!-- Activity Drawer -->
    <TfDrawer
      v-model="showDrawer"
      :title="editingActivity ? 'Edit activity' : 'New activity'"
      :eyebrow="day ? `Day ${day.dayNumber} · ${day.city || ''}` : ''"
    >
      <form @submit.prevent="saveActivity">
        <!-- Where the place comes from: saved / imported / manual -->
        <TfDrawerSection label="Place">
          <div class="field" style="gap: 8px">
            <label>How do you want to add it?</label>
            <div class="src-choice">
              <button
                type="button"
                class="src-btn"
                :class="{ 'src-btn--on': actSource === 'search' }"
                @click="setActSource('search')"
              >
                <i class="pi pi-search"></i><span>Search</span>
              </button>
              <button
                type="button"
                class="src-btn"
                :class="{ 'src-btn--on': actSource === 'import' }"
                @click="setActSource('import')"
              >
                <i class="pi pi-download"></i><span>Import</span>
              </button>
              <button
                type="button"
                class="src-btn"
                :class="{ 'src-btn--on': actSource === 'manual' }"
                @click="setActSource('manual')"
              >
                <i class="pi pi-pencil"></i><span>Manually</span>
              </button>
            </div>
          </div>

          <!-- Search a place (library + geocoding) -->
          <div v-if="actSource === 'search'" class="src-panel">
            <template v-if="!form.placeId">
              <TfSelect
                label="From your places"
                :modelValue="selectedPlaceLabel"
                @update:modelValue="onPlaceLabelPicked"
                :options="placeLabelOptions"
                placeholder="Pick a saved place…"
                class="w-full"
              />
              <div v-if="FEATURES.geoPlaceSearch" class="field">
                <label
                  >…or find a new place
                  <span
                    v-if="findingPlace"
                    class="text-muted"
                    style="font-weight: 400; font-size: 12px"
                    >· saving…</span
                  ></label
                >
                <TfPlaceSearch
                  placeholder="Search a beach, restaurant, landmark…"
                  @select="onActivityGeoPicked"
                />
              </div>
              <small v-else class="text-muted text-sm" style="margin: 0">
                Don't see it here? Import it from a Google Maps / Tripadvisor link or add it
                manually.
              </small>
            </template>
            <div v-else class="linked-place">
              <i class="pi pi-bookmark" style="color: var(--accent)"></i>
              <span class="linked-name">{{ linkedPlaceName }}</span>
              <button type="button" class="link-edit" @click="goEditPlace">
                Edit place <i class="pi pi-arrow-up-right" style="font-size: 10px"></i>
              </button>
              <TfTooltip text="Unlink">
                <button type="button" class="del-btn" @click="unlinkPlace">
                  <i class="pi pi-times"></i>
                </button>
              </TfTooltip>
            </div>
          </div>

          <!-- Import from a Google Maps link -->
          <div v-else-if="actSource === 'import'" class="src-panel">
            <template v-if="!form.placeId">
              <div class="field">
                <label>Google Maps or Tripadvisor link</label>
                <div style="display: flex; gap: 8px">
                  <TfInput
                    v-model="activityImportUrl"
                    placeholder="https://maps.app.goo.gl/… or tripadvisor.com/…"
                    class="w-full"
                    @keyup.enter="runActivityImport"
                  />
                  <TfButton
                    variant="soft"
                    @click="runActivityImport"
                    :disabled="findingPlace || !activityImportUrl"
                  >
                    <i
                      class="pi pi-download"
                      :style="findingPlace ? 'animation:spin 1s linear infinite' : ''"
                    ></i>
                  </TfButton>
                </div>
                <small class="text-muted text-sm">Paste a link to a single place.</small>
              </div>
            </template>
            <div v-else class="linked-place">
              <i class="pi pi-bookmark" style="color: var(--accent)"></i>
              <span class="linked-name">{{ linkedPlaceName }}</span>
              <button type="button" class="link-edit" @click="goEditPlace">
                Edit place <i class="pi pi-arrow-up-right" style="font-size: 10px"></i>
              </button>
              <TfTooltip text="Unlink">
                <button type="button" class="del-btn" @click="unlinkPlace">
                  <i class="pi pi-times"></i>
                </button>
              </TfTooltip>
            </div>
          </div>

          <!-- Fill in manually (type, address, coordinates here only) -->
          <div v-else-if="actSource === 'manual'" class="src-panel">
            <TfInput
              label="Name *"
              v-model="form.name"
              placeholder="What's planned?"
              class="w-full"
            />
            <TfSelect
              label="Type"
              :modelValue="selectedTypeLabel"
              @update:modelValue="onTypeLabelPicked"
              :options="typeLabelOptions"
              placeholder="Select type"
              class="w-full"
            />
            <TfInput
              label="Address"
              v-model="form.address"
              placeholder="Street, area…"
              class="w-full"
            />
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px">
              <div class="field">
                <label
                  >Latitude
                  <span style="font-weight: 400; font-size: 12px; color: var(--text-secondary)"
                    >(optional)</span
                  ></label
                >
                <TfNumberInput v-model="form.latitude" type="plain" :precision="7" class="w-full" />
              </div>
              <div class="field">
                <label
                  >Longitude
                  <span style="font-weight: 400; font-size: 12px; color: var(--text-secondary)"
                    >(optional)</span
                  ></label
                >
                <TfNumberInput
                  v-model="form.longitude"
                  type="plain"
                  :precision="7"
                  class="w-full"
                />
              </div>
            </div>
            <label class="save-place-toggle">
              <input type="checkbox" v-model="saveToPlaces" />
              <span
                ><i class="pi pi-bookmark" style="font-size: 13px"></i> Save as a place (so it shows
                on the map)</span
              >
            </label>
          </div>
        </TfDrawerSection>

        <!-- Details (once a source has set the activity base) -->
        <TfDrawerSection v-if="showCommon" label="Details">
          <TfInput
            v-if="actSource !== 'manual'"
            label="Name *"
            v-model="form.name"
            placeholder="What's planned?"
            class="w-full"
          />

          <TfSelect
            v-if="editingActivity && moveDayLabels.length > 1"
            label="Day"
            v-model="moveDayLabel"
            :options="moveDayLabels"
            class="w-full"
            helper="Pick another day to move this activity there"
          />

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px">
            <div class="field">
              <label
                >Start time
                <span style="font-weight: 400; font-size: 12px; color: var(--text-secondary)"
                  >(optional)</span
                ></label
              >
              <TfInput v-model="form.startTime" placeholder="09:00" class="w-full" />
            </div>
            <div class="field">
              <label
                >End time
                <span style="font-weight: 400; font-size: 12px; color: var(--text-secondary)"
                  >(optional)</span
                ></label
              >
              <TfInput v-model="form.endTime" placeholder="11:00" class="w-full" />
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 12px">
            <div class="field">
              <label
                >Cost
                <span style="font-weight: 400; font-size: 12px; color: var(--text-secondary)"
                  >(optional)</span
                ></label
              >
              <TfNumberInput
                v-model="form.costEstimate"
                type="plain"
                :precision="2"
                class="w-full"
              />
            </div>
            <TfSelect
              label="Currency"
              v-model="form.costCurrency"
              :options="currencyOptions"
              class="w-full"
            />
          </div>
          <TfInput label="Notes" v-model="form.notes" placeholder="Any details" class="w-full" />
        </TfDrawerSection>
      </form>
      <template #footer>
        <TfButton variant="primary" style="flex: 1" @click="saveActivity" :disabled="saving">
          {{ saving ? 'Saving...' : 'Save' }}
        </TfButton>
        <TfButton v-if="editingActivity" variant="ghost" @click="confirmDelete(editingActivity)"
          >Delete</TfButton
        >
      </template>
    </TfDrawer>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  TfButton,
  TfIconButton,
  TfBadge,
  TfCard,
  TfDrawer,
  TfDrawerSection,
  TfCitySearch,
  TfPlaceSearch,
  TfInput,
  TfSelect,
  TfNumberInput,
  TfTooltip,
  toast,
  confirm,
} from '@tripyfull/ui';
import BookingMap from '@/components/BookingMap.vue';
import { FEATURES } from '@/config.js';
import { baseCurrency as accountCurrency } from '@tripyfull/core';
import { CURRENCIES } from '@tripyfull/core';
import { api } from '@tripyfull/core';
const currencyOptions = CURRENCIES;

const route = useRoute();
const router = useRouter();

const tripId = route.params.tripId;
const dayId = ref(route.params.dayId);

const day = ref(null);
const allDays = ref([]);
const activities = ref([]);
const bookings = ref([]);
const loading = ref(false);
const saving = ref(false);
const showDrawer = ref(false);
const editingActivity = ref(null);
const currency = accountCurrency;

// City + overnight editing
const editingCity = ref(false);
const cityDraft = ref('');
const editingOvernight = ref(false);
const overnightDraft = ref('');

const emptyForm = {
  name: '',
  type: null,
  startTime: '',
  endTime: '',
  address: '',
  costEstimate: null,
  costCurrency: null,
  notes: '',
  placeId: null,
  latitude: null,
  longitude: null,
};
const form = ref({ ...emptyForm });

const linkedPlaceName = computed(() => {
  const p = placesLib.value.find((x) => x.id === form.value.placeId);
  return p?.name || form.value.name || 'Linked place';
});
const unlinkPlace = () => {
  form.value.placeId = null;
};
const goEditPlace = () => {
  if (!form.value.placeId) return;
  showDrawer.value = false;
  router.push({ path: '/places', query: { edit: form.value.placeId } });
};

// Activity drawer: data source ('search' | 'import' | 'manual'), chosen then expanded.
const actSource = ref(null);
const activityImportUrl = ref('');
const showCommon = computed(
  () =>
    actSource.value === 'manual' ||
    !!form.value.placeId ||
    !!(form.value.name && String(form.value.name).trim()),
);
const setActSource = (s) => {
  actSource.value = s;
};

// Library places for linking activities
const placesLib = ref([]);
const placeOptions = computed(() =>
  placesLib.value.map((p) => ({ label: p.city ? `${p.name} · ${p.city}` : p.name, value: p.id })),
);
// TfSelect works with string options; map label <-> place id.
const placeLabelOptions = computed(() => placeOptions.value.map((o) => o.label));
const selectedPlaceLabel = computed(
  () => placeOptions.value.find((o) => o.value === form.value.placeId)?.label || '',
);
const onPlaceLabelPicked = (label) => {
  const id = placeOptions.value.find((o) => o.label === label)?.value ?? null;
  onPlacePicked(id);
};
const loadPlacesLib = async () => {
  try {
    placesLib.value = (await api.get('/api/places')).data || [];
  } catch {
    /* non-fatal */
  }
};
const onPlacePicked = (id) => {
  form.value.placeId = id;
  const p = placesLib.value.find((x) => x.id === id);
  if (p && !form.value.name && p.name) form.value.name = p.name;
  if (p && !form.value.address && p.address) form.value.address = p.address;
  if (p && !form.value.type && p.type) form.value.type = placeToActivityType(p.type);
};

const saveToPlaces = ref(false);

// Place-type meta for the "Add from places" cards.
const PLACE_TYPE_META = {
  SIGHTSEEING: { e: '🏛', bg: 'var(--success-100)', c: 'var(--accent)', l: 'Sightseeing' },
  BEACH: { e: '🏖', bg: 'var(--warning-100)', c: 'var(--warning-300)', l: 'Beach' },
  NATURE: { e: '🌿', bg: 'var(--success-100)', c: 'var(--success-300)', l: 'Nature' },
  RESTAURANT: { e: '🍽', bg: 'var(--warning-100)', c: 'var(--warning-300)', l: 'Restaurant' },
  MUSEUM: { e: '🏺', bg: 'var(--danger-100)', c: 'var(--accent)', l: 'Museum' },
  VIEWPOINT: { e: '🌄', bg: 'var(--warning-100)', c: 'var(--warning-500)', l: 'Viewpoint' },
  PORT: { e: '⛴', bg: 'var(--success-100)', c: 'var(--accent)', l: 'Port' },
  AIRPORT: { e: '✈️', bg: 'var(--success-100)', c: 'var(--accent)', l: 'Airport' },
  NEIGHBORHOOD: { e: '🏘', bg: 'var(--danger-100)', c: 'var(--accent)', l: 'Neighborhood' },
  PARK: { e: '🌳', bg: 'var(--success-100)', c: 'var(--success-300)', l: 'Park' },
  SHOP: { e: '🛍', bg: 'var(--danger-100)', c: 'var(--danger-500)', l: 'Shop' },
  OTHER: { e: '📍', bg: 'var(--surface)', c: 'var(--ink-500)', l: 'Place' },
};
const pm = (t) => PLACE_TYPE_META[t] || PLACE_TYPE_META.OTHER;
const placeTypeEmoji = (t) => pm(t).e;
const placeTypeStyle = (t) => ({ background: pm(t).bg, color: pm(t).c });
const placeTypeLabel = (t) => pm(t).l;

const PLACE_TO_ACT = {
  BEACH: 'BEACH',
  NATURE: 'NATURE',
  PARK: 'NATURE',
  RESTAURANT: 'RESTAURANT',
  SHOP: 'SHOPPING',
  MUSEUM: 'SIGHTSEEING',
  SIGHTSEEING: 'SIGHTSEEING',
  VIEWPOINT: 'SIGHTSEEING',
  NEIGHBORHOOD: 'NEIGHBORHOOD',
  PORT: 'TRANSPORT',
  AIRPORT: 'TRANSPORT',
  OTHER: 'OTHER',
};
const placeToActivityType = (t) => PLACE_TO_ACT[t] || 'OTHER';

// Open the activity drawer pre-filled from a saved place.
const openAddFromPlace = (p) => {
  editingActivity.value = null;
  form.value = {
    ...emptyForm,
    placeId: p.id,
    name: p.name,
    address: p.address || '',
    type: placeToActivityType(p.type),
    costCurrency: accountCurrency.value,
  };
  if (!placesLib.value.some((x) => x.id === p.id)) placesLib.value.unshift(p);
  saveToPlaces.value = false;
  actSource.value = 'search';
  activityImportUrl.value = '';
  moveTargetDayId.value = null;
  showDrawer.value = true;
};

// Activity type -> Place type for "save to my places".
const ACT_TO_PLACE_TYPE = {
  SIGHTSEEING: 'SIGHTSEEING',
  BEACH: 'BEACH',
  NATURE: 'NATURE',
  NEIGHBORHOOD: 'NEIGHBORHOOD',
  RESTAURANT: 'RESTAURANT',
  MEAL_STOP: 'RESTAURANT',
  SHOPPING: 'SHOP',
  TRANSPORT: 'OTHER',
  OTHER: 'OTHER',
};
const activityToPlaceType = (t) => ACT_TO_PLACE_TYPE[t] || 'OTHER';

// Find & save a brand-new place from geocoding, then link it to this activity.
const findingPlace = ref(false);
const onActivityGeoPicked = async (geo) => {
  if (!geo) return;
  findingPlace.value = true;
  try {
    const res = await api.post('/api/places/geocode', {
      text: geo.displayName || geo.name,
      country: null,
    });
    const place = res.data;
    if (!placesLib.value.some((p) => p.id === place.id)) placesLib.value.unshift(place);
    form.value.placeId = place.id;
    if (!form.value.name && place.name) form.value.name = place.name;
    if (!form.value.address && place.address) form.value.address = place.address;
    if (!form.value.type && place.type) form.value.type = placeToActivityType(place.type);
    toast.success('Place linked', place.name);
  } catch {
    toast.danger('Error', 'Could not save place');
  } finally {
    findingPlace.value = false;
  }
};

// Import a place from a Google Maps link, then link it to this activity.
const runActivityImport = async () => {
  if (!activityImportUrl.value.trim()) return;
  findingPlace.value = true;
  try {
    const res = await api.post('/api/places/import', { url: activityImportUrl.value.trim() });
    const place = res.data;
    if (!placesLib.value.some((p) => p.id === place.id)) placesLib.value.unshift(place);
    form.value.placeId = place.id;
    if (!form.value.name && place.name) form.value.name = place.name;
    if (!form.value.address && place.address) form.value.address = place.address;
    if (!form.value.type && place.type) form.value.type = placeToActivityType(place.type);
    activityImportUrl.value = '';
    toast.success('Imported', place.name);
  } catch (e) {
    const msg = e.response?.status === 400 ? "Couldn't read that link" : 'Import failed';
    toast.warning('Import', msg);
  } finally {
    findingPlace.value = false;
  }
};

const typeOptions = [
  { label: 'Sightseeing', value: 'SIGHTSEEING' },
  { label: 'Beach', value: 'BEACH' },
  { label: 'Nature', value: 'NATURE' },
  { label: 'Neighborhood', value: 'NEIGHBORHOOD' },
  { label: 'Restaurant', value: 'RESTAURANT' },
  { label: 'Meal stop', value: 'MEAL_STOP' },
  { label: 'Shopping', value: 'SHOPPING' },
  { label: 'Transport', value: 'TRANSPORT' },
  { label: 'Other', value: 'OTHER' },
];

// TfSelect works with string options; map label <-> type value.
const typeLabelOptions = typeOptions.map((o) => o.label);
const selectedTypeLabel = computed(
  () => typeOptions.find((o) => o.value === form.value.type)?.label || '',
);
const onTypeLabelPicked = (label) => {
  form.value.type = typeOptions.find((o) => o.label === label)?.value ?? null;
};

const typeIcon = (t) =>
  ({
    SIGHTSEEING: '\u{1F3DB}',
    BEACH: '\u{1F3D6}',
    NATURE: '\u{1F33F}',
    NEIGHBORHOOD: '\u{1F3D8}',
    RESTAURANT: '\u{1F37D}',
    MEAL_STOP: '\u2615',
    SHOPPING: '\u{1F6CD}',
    TRANSPORT: '\u{1F68C}',
    OTHER: '\u{1F4CC}',
  })[t] ?? '\u{1F4CC}';

const typeLabel = (t) => typeOptions.find((o) => o.value === t)?.label ?? t ?? '';

const catStyle = (type) => {
  const styles = {
    SIGHTSEEING: { background: 'var(--success-100)', color: 'var(--success-300)' },
    BEACH: { background: 'var(--warning-100)', color: 'var(--warning-300)' },
    NATURE: { background: 'var(--success-100)', color: 'var(--accent)' },
    NEIGHBORHOOD: { background: 'var(--danger-100)', color: 'var(--accent)' },
    RESTAURANT: { background: 'var(--warning-100)', color: 'var(--warning-300)' },
    MEAL_STOP: { background: 'var(--warning-100)', color: 'var(--warning-500)' },
    SHOPPING: { background: 'var(--danger-100)', color: 'var(--danger-500)' },
    TRANSPORT: { background: 'var(--success-100)', color: 'var(--accent)' },
    OTHER: { background: 'var(--surface)', color: 'var(--ink-500)' },
  };
  return styles[type] || styles.OTHER;
};

const currentDayIndex = computed(() => allDays.value.findIndex((d) => d.id === dayId.value));

/* ---- Manual ordering: drag-and-drop + sort by time ---- */
const dragIndex = ref(null);

const onDragStart = (i, e) => {
  dragIndex.value = i;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', String(i)); // Firefox refuses to drag without data
};

// Live reorder while hovering: the list (and the numbered map pins) preview the result.
const onDragOver = (i) => {
  if (dragIndex.value === null || i === dragIndex.value) return;
  const arr = activities.value;
  const [moved] = arr.splice(dragIndex.value, 1);
  arr.splice(i, 0, moved);
  dragIndex.value = i;
};

const onDragEnd = () => {
  if (dragIndex.value === null) return;
  dragIndex.value = null;
  persistOrder();
};

const persistOrder = async () => {
  try {
    const res = await api.patch(`/api/days/${dayId.value}/activities/reorder`, {
      orderedIds: activities.value.map((a) => a.id),
    });
    activities.value = res.data;
  } catch {
    toast.danger('Error', 'Failed to save the order');
    loadDay(dayId.value); // restore the server's order
  }
};

const sortByTime = () => {
  activities.value = [...activities.value].sort((a, b) => {
    if (!a.startTime && !b.startTime) return 0;
    if (!a.startTime) return 1; // untimed go last
    if (!b.startTime) return -1;
    return a.startTime.localeCompare(b.startTime);
  });
  persistOrder();
};

/* ---- Move an activity to another day (edit drawer) ---- */
const moveTargetDayId = ref(null);
const moveDayOptions = computed(() =>
  allDays.value.map((d) => ({
    label: `Day ${d.dayNumber} · ${formatDateShort(d.date)}`,
    value: d.id,
  })),
);
const moveDayLabels = computed(() => moveDayOptions.value.map((o) => o.label));
const moveDayLabel = computed({
  get: () => moveDayOptions.value.find((o) => o.value === moveTargetDayId.value)?.label || '',
  set: (label) => {
    moveTargetDayId.value = moveDayOptions.value.find((o) => o.label === label)?.value ?? null;
  },
});

const dayTotal = computed(() =>
  activities.value.reduce((s, a) => s + (Number(a.costEstimate) || 0), 0),
);

// Pins for activities whose linked place has coordinates (ordered = numbered).
const activityMarkers = computed(() =>
  activities.value
    .filter((a) => a.placeLatitude != null && a.placeLongitude != null)
    .map((a) => ({
      lat: Number(a.placeLatitude),
      lon: Number(a.placeLongitude),
      label: a.placeName || a.name,
    })),
);
// activity id -> its number on the map (same order as the markers)
const stopNumbers = computed(() => {
  const map = {};
  let n = 0;
  activities.value.forEach((a) => {
    if (a.placeLatitude != null && a.placeLongitude != null) map[a.id] = ++n;
  });
  return map;
});
// Saved places in this day's city, for quick-add in the empty state.
const cityPlaces = computed(() => {
  const c = (day.value?.city || '').trim().toLowerCase();
  if (!c) return [];
  return placesLib.value
    .filter((p) => {
      const pc = (p.city || '').toLowerCase();
      return pc && (pc === c || pc.includes(c) || c.includes(pc));
    })
    .slice(0, 6);
});

const costByType = computed(() => {
  const map = {};
  activities.value.forEach((a) => {
    if (a.costEstimate && a.type) {
      map[a.type] = (map[a.type] || 0) + Number(a.costEstimate);
    }
  });
  return map;
});

// Find accommodation booking that covers this day's date (for suggestion)
const overnightSuggestion = computed(() => {
  if (!day.value?.date || day.value?.linkedBookingId) return null;
  const dayDate = day.value.date;
  return (
    bookings.value.find(
      (b) =>
        b.category === 'ACCOMMODATION' &&
        b.checkIn &&
        b.checkOut &&
        dayDate >= b.checkIn &&
        dayDate < b.checkOut,
    ) || null
  );
});

// Find the linked booking (when day has linkedBookingId)
const linkedBooking = computed(() => {
  if (!day.value?.linkedBookingId) return null;
  return bookings.value.find((b) => b.id === day.value.linkedBookingId) || null;
});

const onCitySelected = (item) => {
  cityDraft.value = item.name;
  saveCity();
};

const saveCity = async () => {
  try {
    const res = await api.patch(`/api/days/${dayId.value}`, { city: cityDraft.value });
    updateDayLocal(res.data);
    editingCity.value = false;
  } catch {
    toast.danger('Error', 'Failed to update city');
  }
};

// Manual overnight entry — no booking link
const saveOvernightManual = async () => {
  try {
    const res = await api.patch(`/api/days/${dayId.value}`, {
      overnightStay: overnightDraft.value,
      clearLinkedBooking: true,
    });
    updateDayLocal(res.data);
    editingOvernight.value = false;
  } catch {
    toast.danger('Error', 'Failed to update overnight');
  }
};

// Apply from booking — saves overnight + city + booking link
const applyOvernightSuggestion = async () => {
  if (!overnightSuggestion.value) return;
  const booking = overnightSuggestion.value;
  try {
    const res = await api.patch(`/api/days/${dayId.value}`, {
      overnightStay: booking.name,
      city: booking.accommodationCity,
      linkedBookingId: booking.id,
    });
    updateDayLocal(res.data);
  } catch {
    toast.danger('Error', 'Failed to link booking');
  }
};

// Unlink booking but keep the text
const unlinkBooking = async () => {
  try {
    const res = await api.patch(`/api/days/${dayId.value}`, { clearLinkedBooking: true });
    updateDayLocal(res.data);
  } catch {
    toast.danger('Error', 'Failed to unlink');
  }
};

// Helper to sync day data locally
const updateDayLocal = (data) => {
  day.value = { ...day.value, ...data };
  const idx = allDays.value.findIndex((d) => d.id === dayId.value);
  if (idx !== -1) allDays.value[idx] = { ...allDays.value[idx], ...data };
};

const switchDay = (id) => {
  router.replace(`/trips/${tripId}/days/${id}`);
  dayId.value = id;
  loadDay(id);
};

// The route can also change without switchDay — sidebar "Itinerary" link,
// browser back/forward. The component is reused, so react to the param.
watch(
  () => route.params.dayId,
  (id) => {
    if (id && id !== dayId.value) {
      dayId.value = id;
      loadDay(id);
    }
  },
);

const goToDay = (idx) => {
  if (idx >= 0 && idx < allDays.value.length) {
    switchDay(allDays.value[idx].id);
  }
};

const loadDay = async (id) => {
  editingCity.value = false;
  editingOvernight.value = false;
  try {
    // Reload all days to get fresh overnightStay/city data
    const [daysRes, activitiesRes] = await Promise.all([
      api.get(`/api/trips/${tripId}/days`),
      api.get(`/api/days/${id}/itinerary`),
    ]);
    allDays.value = daysRes.data;
    day.value = daysRes.data.find((d) => d.id === id) || null;
    activities.value = activitiesRes.data;
  } catch {
    day.value = allDays.value.find((d) => d.id === id) || null;
    activities.value = [];
  }
};

const openAddDialog = () => {
  editingActivity.value = null;
  form.value = { ...emptyForm, costCurrency: accountCurrency.value };
  saveToPlaces.value = false;
  actSource.value = null;
  activityImportUrl.value = '';
  moveTargetDayId.value = null;
  showDrawer.value = true;
};

const startEdit = (a) => {
  editingActivity.value = a;
  form.value = {
    name: a.name,
    type: a.type,
    startTime: a.startTime?.slice(0, 5) || '',
    endTime: a.endTime?.slice(0, 5) || '',
    address: a.address || '',
    costEstimate: a.costEstimate,
    notes: a.notes || '',
    placeId: a.placeId || null,
    costCurrency: a.costCurrency || accountCurrency.value,
  };
  saveToPlaces.value = false;
  actSource.value = a.placeId ? 'search' : 'manual';
  activityImportUrl.value = '';
  moveTargetDayId.value = dayId.value; // preselect the current day in the move select
  showDrawer.value = true;
};

const saveActivity = async () => {
  saving.value = true;
  try {
    // Optionally save a standalone activity into the places library, then link it.
    if (saveToPlaces.value && !form.value.placeId && form.value.name) {
      try {
        const res = await api.post('/api/places', {
          name: form.value.name,
          address: form.value.address || null,
          type: activityToPlaceType(form.value.type),
          latitude: form.value.latitude || null,
          longitude: form.value.longitude || null,
          visibility: 'PRIVATE',
        });
        if (!placesLib.value.some((p) => p.id === res.data.id)) placesLib.value.unshift(res.data);
        form.value.placeId = res.data.id;
        if (!form.value.address && res.data.address) form.value.address = res.data.address;
      } catch {
        toast.warning('Note', 'Activity saved, but adding to places failed');
      }
    }

    const payload = {
      ...form.value,
      startTime: form.value.startTime || null,
      endTime: form.value.endTime || null,
      costEstimate: form.value.costEstimate || null,
      costCurrency: form.value.costCurrency || accountCurrency.value,
      placeId: form.value.placeId || null,
      clearPlace: !form.value.placeId,
      // On edit: a different day here moves the activity (appended at its end).
      dayId: editingActivity.value ? moveTargetDayId.value || undefined : undefined,
    };

    if (editingActivity.value) {
      const res = await api.patch(`/api/activities/${editingActivity.value.id}`, payload);
      if (moveTargetDayId.value && moveTargetDayId.value !== dayId.value) {
        activities.value = activities.value.filter((a) => a.id !== editingActivity.value.id);
        toast.success('Moved', `Activity moved to ${moveDayLabel.value}`);
      } else {
        const idx = activities.value.findIndex((a) => a.id === editingActivity.value.id);
        if (idx !== -1) activities.value[idx] = res.data;
        toast.success('Updated', 'Activity updated');
      }
    } else {
      const res = await api.post(`/api/days/${dayId.value}/activities`, payload);
      activities.value.push(res.data);
      toast.success('Added', `"${res.data.name}" added`);
    }
    showDrawer.value = false;
  } catch {
    toast.danger('Error', 'Failed to save activity');
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (a) => {
  confirm({
    title: 'Confirm',
    message: `Delete "${a.name}"?`,
    tone: 'danger',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
  }).then(async (ok) => {
    if (ok) {
      try {
        await api.delete(`/api/activities/${a.id}`);
        activities.value = activities.value.filter((x) => x.id !== a.id);
        showDrawer.value = false;
        toast.success('Deleted', 'Activity deleted');
      } catch {
        toast.danger('Error', 'Failed to delete');
      }
    }
  });
};

const formatDateShort = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${dt.getDate()} ${months[dt.getMonth()]}`;
};

onMounted(async () => {
  loading.value = true;
  loadPlacesLib();
  try {
    const [tripRes, daysRes, activitiesRes, bookingsRes] = await Promise.all([
      api.get(`/api/trips/${tripId}`),
      api.get(`/api/trips/${tripId}/days`),
      api.get(`/api/days/${dayId.value}/itinerary`),
      api.get(`/api/trips/${tripId}/bookings`),
    ]);
    allDays.value = daysRes.data;
    day.value = daysRes.data.find((d) => d.id === dayId.value);
    activities.value = activitiesRes.data;
    bookings.value = bookingsRes.data;
  } catch {
    toast.danger('Error', 'Failed to load day');
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.itin-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 24px;
  align-items: start;
}
.itin-map {
  position: sticky;
  top: 0;
}
.itin-map-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.itin-map-empty {
  height: 520px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-default);
  background: var(--surface);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-secondary);
  font: var(--fw-medium) 13px/1 var(--font-sans);
}

.addfrom-title {
  display: flex;
  align-items: center;
  gap: 9px;
  font: var(--fw-semibold) 16px/1 var(--font-sans);
  color: var(--text-primary);
  margin-bottom: 14px;
}
.addfrom-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}
.addfrom-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  cursor: pointer;
  text-align: left;
  background: var(--card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  transition:
    border-color var(--dur-fast) var(--ease-out),
    box-shadow var(--dur-fast) var(--ease-out);
}
.addfrom-item:hover {
  border-color: var(--border-default);
  box-shadow: var(--shadow-sm);
}
.addfrom-thumb {
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background-size: cover;
  background-position: center;
  border: 1px solid var(--border-default);
}
.addfrom-name {
  display: block;
  font: var(--fw-semibold) 15px/1.2 var(--font-sans);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.addfrom-sub {
  display: block;
  font: var(--fw-regular) 13px/1.3 var(--font-sans);
  color: var(--text-secondary);
  margin-top: 2px;
}

.onmap-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--success-700);
  font: var(--fw-semibold) 12px/1 var(--font-mono);
}
.onmap-dot {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: var(--success-500);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
}

/* drag-and-drop ordering */
.timeline-row {
  cursor: grab;
}
.timeline-row:active {
  cursor: grabbing;
}
.timeline-row.is-dragging {
  opacity: 0.45;
}
.drag-grip {
  font-size: 11px;
  color: var(--text-disabled);
  opacity: 0;
  transition: opacity var(--dur-fast) var(--ease-out);
  margin-bottom: 4px;
}
.timeline-row:hover .drag-grip {
  opacity: 1;
}

@media (max-width: 1024px) {
  .itin-layout {
    grid-template-columns: 1fr;
  }
  .itin-map {
    position: static;
  }
  .itin-map-empty {
    height: 280px;
  }
}

.src-choice {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.src-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 8px;
  border: 1.5px solid var(--border-default);
  background: var(--card);
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--text-secondary);
  font: var(--fw-semibold) 13px/1 var(--font-sans);
  transition: all var(--dur-fast) var(--ease-out);
}
.src-btn i {
  font-size: 18px;
}
.src-btn:hover {
  border-color: var(--border-default);
  color: var(--text-primary);
}
.src-btn--on {
  border-color: var(--accent);
  background: var(--danger-100);
  color: var(--danger-900);
}

.src-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px;
  background: var(--surface);
  border-radius: var(--radius-md);
}

.linked-place {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--card);
  border: 1.5px solid var(--success-100);
  border-radius: var(--radius-md);
}
.linked-place .linked-name {
  flex: 1;
  min-width: 0;
  font: var(--fw-semibold) 15px/1.2 var(--font-sans);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.link-edit {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-link);
  font: var(--fw-semibold) 13px/1 var(--font-sans);
  white-space: nowrap;
}
.link-edit:hover {
  text-decoration: underline;
}

.save-place-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: var(--surface);
  border-radius: var(--radius-md);
  cursor: pointer;
  font: var(--fw-medium) 14px/1.3 var(--font-sans);
  color: var(--text-primary);
}
.save-place-toggle input {
  accent-color: var(--accent);
  width: 18px;
  height: 18px;
}
.save-place-toggle span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>
