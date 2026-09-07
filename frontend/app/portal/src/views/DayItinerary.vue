<template>
  <div class="page-content page-content--full">
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
              <template v-if="day && !day.date"
                >Reserve day {{ reserveIndex }} · outside the trip dates</template
              >
              <template v-else
                >Day {{ day?.dayNumber }} · {{ formatDateShort(day?.date) }}</template
              >
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
            variant="secondary"
            size="sm"
            @click="showAutoPlan = true"
            title="Fill the days from your saved places, following the hotels"
          >
            <i class="pi pi-sparkles" style="font-size: 12px"></i> Auto-plan
          </TfButton>
          <TfButton
            v-if="activities.length > 1"
            variant="ghost"
            size="sm"
            @click="sortByTime"
            title="Reorder activities by their start time"
          >
            <i class="pi pi-sort-amount-down" style="font-size: 13px"></i> Sort by time
          </TfButton>
          <!-- Buffer days are their own reserve days now (the "+ Buffer" chip in
               the strip), so a dated day has nothing to toggle. -->
          <TfButton
            v-if="!day?.date"
            variant="ghost"
            size="sm"
            @click="removeReserveDay(day)"
            title="Remove this reserve day"
          >
            <i class="pi pi-trash" style="font-size: 13px"></i> Remove reserve
          </TfButton>
          <TfButton
            v-if="allDays.length > 1"
            variant="ghost"
            size="sm"
            @click="openSwapModal"
            title="Swap this day's plan with another day"
          >
            <i class="pi pi-arrow-right-arrow-left" style="font-size: 13px"></i> Swap
          </TfButton>
          <TfButton variant="primary" @click="openAddDialog">
            <i class="pi pi-plus" style="font-size: 14px"></i> Activity
          </TfButton>
        </div>
      </div>

      <!-- Day picker strip: buffer days stand in line with the rest, marked but
           not set apart, and can be flipped from here as the plan changes. -->
      <div class="day-picker" v-if="allDays.length > 1">
        <button
          v-for="d in datedDays"
          :key="d.id"
          class="day-picker-btn"
          :class="d.id === dayId ? 'day-picker-btn--on' : 'day-picker-btn--off'"
          @click="switchDay(d.id)"
        >
          <div class="day-picker-label">D{{ d.dayNumber }}</div>
          <div class="day-picker-date">{{ formatDateShort(d.date) }}</div>
          <div class="day-picker-note">{{ d.city || '' }}</div>
        </button>

        <!-- Reserve days: part of the trip, outside its dates. Nothing is planned
             on them until you swap one into a real day. -->
        <span v-if="reserveDays.length" class="day-picker-sep"></span>
        <button
          v-for="(d, i) in reserveDays"
          :key="d.id"
          class="day-picker-btn day-picker-btn--reserve"
          :class="d.id === dayId ? 'day-picker-btn--on' : 'day-picker-btn--off'"
          @click="switchDay(d.id)"
        >
          <span
            class="day-picker-flag is-on"
            v-tooltip="'Remove this reserve day'"
            @click.stop="removeReserveDay(d)"
          >
            <i class="pi pi-times"></i>
          </span>
          <div class="day-picker-label">R{{ i + 1 }}</div>
          <div class="day-picker-date">reserve</div>
          <div class="day-picker-note">{{ d.city || 'no date' }}</div>
        </button>
        <button
          class="day-picker-add"
          v-tooltip="'Add a buffer day outside the trip dates'"
          :disabled="addingBuffer"
          @click="addBufferDay"
        >
          <i class="pi pi-plus"></i>
          <span>Buffer</span>
        </button>
      </div>

      <!-- How full the day already is: the question every "add this?" answers to. -->
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

            <!-- How full the day is: places you go to, and time spent getting there -->
            <div v-if="activities.length" style="flex: 1; min-width: 200px">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px">
                <i class="pi pi-clock" style="color: var(--accent); font-size: 16px"></i>
                <span
                  style="
                    font: var(--fw-semibold) 14px/1 var(--font-sans);
                    color: var(--text-primary);
                  "
                  >Day</span
                >
              </div>
              <div class="day-load">
                <span
                  ><b>{{ dayBudget.stops }}</b> stop{{ dayBudget.stops === 1 ? '' : 's' }}</span
                >
                <span
                  ><span class="day-load-dot day-load-dot--visit"></span
                  >{{ fmtMin(dayBudget.visitMin) }} at places<span
                    v-if="dayBudget.untimed"
                    class="text-subtle"
                  >
                    · {{ dayBudget.untimed }} without a time</span
                  ></span
                >
                <span
                  ><span class="day-load-dot day-load-dot--travel"></span
                  >{{ fmtMin(dayBudget.travelMin) }} on the move</span
                >
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
                <span
                  class="timeline-time"
                  :class="{ 'timeline-time--derived': !a.startTime && derivedTimes[a.id] }"
                  :title="
                    !a.startTime && derivedTimes[a.id]
                      ? 'Worked out from the previous stop and the way there — set a time to fix it'
                      : ''
                  "
                  >{{
                    a.startTime
                      ? a.startTime.slice(0, 5)
                      : derivedTimes[a.id]
                        ? '≈ ' + derivedTimes[a.id]
                        : ''
                  }}</span
                >
                <span v-if="i < activities.length - 1" class="timeline-line"></span>
              </div>
              <div class="timeline-content">
                <TfCard interactive @click="startEdit(a)" style="cursor: pointer">
                  <div style="display: flex; align-items: center; gap: 12px">
                    <div class="cat-icon cat-icon--lg" :style="catStyle(a.type)">
                      {{ stopIcon(a) }}
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
                        <TfBadge v-if="a.needsBooking" tone="gold" variant="soft" dot
                          >Book ahead</TfBadge
                        >
                        <!-- Written by the booking sync, which owns it: the next
                             run rewrites it, so edits here do not survive. -->
                        <TfBadge
                          v-if="a.fromBooking"
                          tone="success"
                          variant="soft"
                          v-tooltip="'From a booking — rewritten when you update the plan'"
                          >Booked</TfBadge
                        >
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
                          v-if="a.startTime && a.endTime"
                          style="display: inline-flex; align-items: center; gap: 4px"
                        >
                          <i class="pi pi-clock" style="font-size: 12px"></i>
                          {{ a.startTime.slice(0, 5) }} – {{ a.endTime.slice(0, 5) }}
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
                    <span
                      v-if="a.costEstimate"
                      class="money money--md"
                      style="flex: none; text-align: right"
                    >
                      {{ a.costEstimate }} {{ a.costCurrency || currency }}
                      <span v-if="isForeign(a)" class="money-approx"
                        >≈ {{ toBase(a).toFixed(2) }} {{ currency }}</span
                      >
                    </span>
                  </div>
                </TfCard>
                <!-- @dragstart guard: a press that drifts must not hijack the row drag -->
                <div v-if="legInfoByActivity[a.id]" class="timeline-leg" @dragstart.prevent.stop>
                  <!-- Not everyone rents a car: the whole set of ways to get to the
                       next stop, with an honest note when the time is an estimate. -->
                  <div class="leg-modes">
                    <button
                      v-for="m in TRAVEL_MODES"
                      :key="m.key"
                      class="leg-mode"
                      :class="{ 'is-on': legInfoByActivity[a.id].mode === m.key }"
                      v-tooltip="m.hint"
                      @click="setLegMode(a, m.key)"
                    >
                      {{ m.icon }}
                    </button>
                  </div>
                  <span v-if="legInfoByActivity[a.id].data">
                    <template v-if="legInfoByActivity[a.id].data.estimated">~</template
                    >{{ fmtDur(legInfoByActivity[a.id].data.durationSec) }} ·
                    {{ fmtDist(legInfoByActivity[a.id].data.distanceM) }}
                    {{ modeLabel(legInfoByActivity[a.id].mode) }}
                    <span v-if="legInfoByActivity[a.id].data.estimated" class="leg-estimate"
                      >estimate</span
                    >
                  </span>
                  <span v-else-if="legInfoByActivity[a.id].data === null">no route found</span>
                  <span v-else>…</span>
                </div>
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

            <!-- Candidates now live beside the map, next to the geography
                 they belong to; this stays as the manual way in. -->
            <div style="text-align: center; margin-top: 16px">
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
          <BookingMap
            :markers="activityMarkers"
            :legs="mapLegs"
            :dots="libraryDots"
            numbered
            :height="mapHeight"
            @dot-add="onMapDotAdd"
            @dot-hide="hidePlace"
          />
          <div class="itin-map-legend">
            <span v-if="libraryDots.length">
              <i class="pi pi-circle-fill" style="font-size: 8px; color: var(--warning-500)"></i>
              {{ libraryDots.length }} saved place{{ libraryDots.length === 1 ? '' : 's' }} on the
              map — colour is the rating; click one for details, to add or to hide it.
            </span>
            <button v-if="hiddenIds.size" type="button" class="link-btn" @click="unhideAll">
              show {{ hiddenIds.size }} hidden
            </button>
          </div>
          <div v-if="routeTotal" class="itin-route-total">
            <i class="pi pi-directions"></i>
            <span
              >{{ fmtDur(routeTotal.durationSec) }} · {{ fmtDist(routeTotal.distanceM) }} ·
              {{ activityMarkers.length }} stops</span
            >
          </div>
          <div v-if="!activityMarkers.length" class="itin-map-empty">
            <i class="pi pi-map" style="font-size: 22px"></i>
            <span>No places with coordinates yet</span>
          </div>

          <!-- Candidates for this day: best-rated first, nearest first among
               equals, and never something already on the timeline. -->
          <div class="itin-picks">
            <div class="itin-picks-head">
              <h3>Places to consider</h3>
              <span class="text-subtle text-sm">{{ candidatePlaces.length }}</span>
            </div>
            <div class="itin-picks-controls">
              <div class="itin-picks-scope">
                <button
                  v-for="s in PICK_SCOPES"
                  :key="s.key"
                  type="button"
                  class="pick-scope-btn"
                  :class="{ 'is-on': pickScope === s.key }"
                  @click="pickScope = s.key"
                >
                  {{ s.label }}
                </button>
              </div>
              <div class="itin-picks-scope">
                <button
                  v-for="o in PICK_SORTS"
                  :key="o.key"
                  type="button"
                  class="pick-scope-btn"
                  :class="{ 'is-on': pickSort === o.key }"
                  v-tooltip="o.hint"
                  @click="pickSort = o.key"
                >
                  {{ o.label }}
                </button>
              </div>
            </div>
            <div class="itin-picks-list">
              <div v-for="p in candidatePlaces" :key="p.id" class="pick-row">
                <span class="pick-rating" :class="`pick-rating--${p.rating || 3}`"
                  >★ {{ p.rating || 3 }}</span
                >
                <span class="pick-main">
                  <span class="pick-name">{{ p.name }}</span>
                  <span class="pick-sub">{{ pickSub(p) }}</span>
                </span>
                <!-- One click puts it in the day, right after the stop it is
                     closest to; the second opens the full form. -->
                <button
                  type="button"
                  class="pick-add"
                  :disabled="quickAddingId === p.id"
                  v-tooltip="p.nearStop ? `Add after ${p.nearStop.name}` : 'Add to this day'"
                  @click="quickAdd(p)"
                >
                  <i
                    class="pi"
                    :class="quickAddingId === p.id ? 'pi-spinner pi-spin' : 'pi-plus'"
                  ></i>
                </button>
                <button
                  type="button"
                  class="pick-more"
                  v-tooltip="'Add with times and notes'"
                  @click="openAddFromPlace(p)"
                >
                  <i class="pi pi-sliders-h"></i>
                </button>
              </div>
              <p v-if="!candidatePlaces.length" class="text-subtle text-sm" style="margin: 6px 0">
                {{
                  pickScope === 'city'
                    ? 'Nothing from the trip list is in this city — try Trip list.'
                    : 'Everything on the trip list is already planned — add places to the trip on the Places page.'
                }}
              </p>
            </div>
          </div>
        </aside>
      </div>
      <!-- /itin-layout -->
    </template>

    <!-- Activity Drawer -->
    <TfDrawer
      v-model="showDrawer"
      :title="isBookingStop ? 'From a booking' : editingActivity ? 'Edit stop' : 'New stop'"
      :eyebrow="day ? `Day ${day.dayNumber} · ${day.city || ''}` : ''"
    >
      <!-- A stop written by the booking sync belongs to its booking: the next
           "Update plan" rewrites it, so there is nothing to edit here. -->
      <template v-if="isBookingStop">
        <TfDrawerSection label="Stop">
          <div class="booking-stop">
            <div class="booking-stop-name">{{ editingActivity.name }}</div>
            <div v-if="editingActivity.startTime" class="booking-stop-line">
              🕘 {{ editingActivity.startTime.slice(0, 5)
              }}<template v-if="editingActivity.endTime">
                – {{ editingActivity.endTime.slice(0, 5) }}</template
              >
            </div>
            <div v-if="editingActivity.address" class="booking-stop-line">
              {{ editingActivity.address }}
            </div>
            <div v-if="editingActivity.notes" class="booking-stop-line">
              {{ editingActivity.notes }}
            </div>
          </div>
          <p class="hint" style="margin: 4px 0 0">
            This stop comes from a booking. Times, names and places are taken from there — change
            the booking and press <strong>Update plan</strong> on the Bookings page; editing it here
            would be undone by the next update.
          </p>
        </TfDrawerSection>
      </template>

      <form v-else @submit.prevent="saveActivity">
        <!-- What: a name is enough; a place adds the map pin and the library's facts -->
        <TfDrawerSection label="What">
          <TfInput
            v-model="form.name"
            label="Name"
            required
            :error="attempted && !form.name.trim() ? 'Say what the stop is' : ''"
            placeholder="e.g. White Temple, lunch at the market, beach afternoon"
            class="w-full"
          />

          <div v-if="linkedPlace" class="linked-place">
            <i class="pi pi-bookmark" style="color: var(--accent)"></i>
            <span class="linked-name">{{ linkedPlaceName }}</span>
            <button type="button" class="link-edit" @click="goEditPlace">
              Edit place <i class="pi pi-arrow-up-right" style="font-size: 10px"></i>
            </button>
            <TfTooltip text="Unlink the place (the stop stays)">
              <button type="button" class="del-btn" @click="unlinkPlace">
                <i class="pi pi-times"></i>
              </button>
            </TfTooltip>
          </div>
          <template v-else>
            <TfSelect
              label="Place"
              :modelValue="selectedPlaceLabel"
              @update:modelValue="onPlaceLabelPicked"
              :options="placeLabelOptions"
              placeholder="Pick one of your places…"
              helper="Optional. Links the stop to a place: it gets a pin on the map and its rating, time and notes."
              class="w-full"
            />
            <div v-if="FEATURES.geoPlaceSearch" class="field">
              <label class="label"
                >Not saved yet? Search a place or an address
                <span v-if="findingPlace" class="text-muted" style="font-weight: 400"
                  >· saving…</span
                ></label
              >
              <TfPlaceSearch
                placeholder="A landmark, a café… or a street address"
                @select="onActivityGeoPicked"
              />
              <span class="hint"
                >A place is saved to your library and linked; an address only pins this stop.</span
              >
            </div>
            <!-- When the map search draws a blank: a pin can still be placed by hand. -->
            <TfInput
              v-model="coordsText"
              label="Coordinates"
              placeholder="19.906, 99.835 — if the search can't find it"
              :error="coordsText.trim() && !parsedCoords ? 'Two numbers: latitude, longitude' : ''"
              :helper="
                parsedCoords
                  ? `Pinned at ${parsedCoords.lat.toFixed(5)}, ${parsedCoords.lon.toFixed(5)}`
                  : 'Right-click a spot in Google Maps and copy what it shows.'
              "
              class="w-full"
            />
          </template>
          <!-- Where the pin lands, whatever put it there. -->
          <BookingMap
            v-if="stopPreviewMarkers.length"
            :markers="stopPreviewMarkers"
            :height="160"
          />

          <TfSelect
            label="Type"
            :modelValue="selectedTypeLabel"
            @update:modelValue="onTypeLabelPicked"
            :options="typeLabelOptions"
            placeholder="Select type"
            class="w-full"
          />
          <p v-if="!linkedPlace && form.address" class="stop-address">
            <i class="pi pi-map-marker"></i> {{ form.address }}
            <button type="button" class="link-btn" @click="form.address = ''">clear</button>
          </p>
        </TfDrawerSection>

        <!-- When -->
        <TfDrawerSection label="When">
          <TfSelect
            v-if="editingActivity && moveDayLabels.length > 1"
            label="Day"
            v-model="moveDayLabel"
            :options="moveDayLabels"
            class="w-full"
            helper="Pick another day to move this stop there"
          />
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px">
            <TfTimePicker
              v-model="form.startTime"
              label="Start"
              :placeholder="
                editingActivity && derivedTimes[editingActivity.id]
                  ? `≈ ${derivedTimes[editingActivity.id]}`
                  : '09:00'
              "
              clearable
            />
            <TfTimePicker v-model="form.endTime" label="End" placeholder="11:00" clearable />
          </div>
        </TfDrawerSection>

        <!-- Details -->
        <TfDrawerSection label="Details">
          <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 12px">
            <TfNumberInput
              v-model="form.costEstimate"
              type="plain"
              :precision="2"
              label="Cost estimate"
              class="w-full"
            />
            <TfSelect
              label="Currency"
              v-model="form.costCurrency"
              :options="currencyOptions"
              class="w-full"
            />
          </div>
          <!-- Same box as on a booking: the rate into the home currency and what
               the estimate comes to. Live rate — an estimate is not a receipt. -->
          <div v-if="showCostRate" class="rate-box">
            <div style="flex: 1">
              <div class="rate-label">1 {{ form.costCurrency }} = ? {{ accountCurrency }}</div>
              <div class="rate-value">
                {{ costRate ? Number(costRate).toFixed(4) : '—' }}
                <span class="rate-unit">{{ accountCurrency }}</span>
              </div>
              <div v-if="form.costEstimate && costRate" class="hint">
                {{ Number(form.costEstimate).toFixed(2) }} {{ form.costCurrency }} ≈
                {{ (Number(form.costEstimate) * Number(costRate)).toFixed(2) }}
                {{ accountCurrency }}
              </div>
            </div>
            <TfButton
              size="sm"
              variant="secondary"
              @click="fetchCostRate"
              :disabled="fetchingCostRate"
            >
              <i
                class="pi pi-sync"
                :style="fetchingCostRate ? 'animation:spin 1s linear infinite' : ''"
                style="font-size: 13px"
              ></i>
              {{ fetchingCostRate ? '' : 'Update rate' }}
            </TfButton>
          </div>
          <TfTextarea
            label="Notes"
            v-model="form.notes"
            :rows="4"
            placeholder="What to see here, tickets, opening hours, what to watch out for"
            class="w-full"
          />
          <label class="save-place-toggle">
            <input type="checkbox" v-model="form.needsBooking" />
            <span
              ><i class="pi pi-ticket" style="font-size: 13px"></i> Needs advance booking (tour,
              show, popular spot)</span
            >
          </label>
          <!-- What you already wrote about this place in the library, so the day
               can be planned without leaving for the place editor. -->
          <div v-if="linkedPlace" class="linked-facts">
            <div class="linked-facts-head">
              <span>From your places</span>
              <button type="button" class="link-edit" @click="goEditPlace">Edit place</button>
            </div>
            <div class="linked-facts-row">
              <span>Rating</span>
              <span class="linked-facts-val"
                >★ {{ linkedPlace.rating || 3 }}
                <span class="text-subtle">{{ RATING_HINTS[linkedPlace.rating || 3] }}</span></span
              >
            </div>
            <div v-if="linkedPlace.visitMinutes" class="linked-facts-row">
              <span>Time to visit</span>
              <span class="linked-facts-val">{{ linkedPlace.visitMinutes }} min</span>
            </div>
            <div v-if="linkedPlace.ratingComment" class="linked-facts-row">
              <span>Why this rating</span>
              <span class="linked-facts-val">{{ linkedPlace.ratingComment }}</span>
            </div>
            <p v-if="linkedPlace.description" class="linked-facts-desc">
              {{ linkedPlace.description }}
            </p>
          </div>
        </TfDrawerSection>
      </form>
      <template #footer>
        <template v-if="isBookingStop">
          <TfButton variant="secondary" @click="$router.push(`/trips/${tripId}/bookings`)">
            <i class="pi pi-ticket" style="font-size: 13px"></i> Open bookings
          </TfButton>
          <span style="flex: 1"></span>
          <TfButton variant="ghost" @click="confirmDelete(editingActivity)"
            >Remove from this day</TfButton
          >
        </template>
        <template v-else>
          <TfButton variant="primary" style="flex: 1" @click="saveActivity" :disabled="saving">
            {{ saving ? 'Saving...' : editingActivity ? 'Save' : 'Add stop' }}
          </TfButton>
          <TfButton v-if="editingActivity" variant="ghost" @click="confirmDelete(editingActivity)"
            >Delete</TfButton
          >
        </template>
      </template>
    </TfDrawer>

    <!-- Swap-days modal -->
    <TfModal v-model="showSwapModal" title="Swap days">
      <p class="text-muted text-sm" style="margin: 0 0 12px">
        The two days trade their plans — activities, cities, stays and notes. Date-bound things
        (expenses, the linked overnight booking) stay on their dates.
      </p>
      <TfSelect
        label="Swap this day with"
        v-model="swapTargetLabel"
        :options="swapDayLabels"
        placeholder="Pick a day"
        class="w-full"
      />
      <div class="dialog-actions" style="margin-top: 16px">
        <TfButton variant="ghost" @click="showSwapModal = false">Cancel</TfButton>
        <TfButton variant="primary" :disabled="!swapTargetLabel || swapping" @click="doSwap">
          {{ swapping ? 'Swapping…' : 'Swap' }}
        </TfButton>
      </div>
    </TfModal>
    <AutoPlanModal v-model="showAutoPlan" :trip-id="tripId" @applied="loadDay(dayId)" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, onBeforeUnmount } from 'vue';
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
  TfModal,
  TfTooltip,
  TfTextarea,
  TfTimePicker,
  toast,
  confirm,
} from '@tripyfull/ui';
import BookingMap from '@/components/BookingMap.vue';
import AutoPlanModal from '@/components/AutoPlanModal.vue';
import { FEATURES } from '@/config.js';
import { baseCurrency as accountCurrency } from '@tripyfull/core';
import { CURRENCIES, formatDateShort, placeTypeMeta, PLACE_TYPE_META } from '@tripyfull/core';
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
  needsBooking: false,
};
const form = ref({ ...emptyForm });

/* Coordinates typed by hand, as one field: "lat, lon". Parsed live; the form
   only ever holds numbers or nothing. */
const coordsText = ref('');
const parsedCoords = computed(() => {
  const m = coordsText.value.trim().match(/^(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const lat = Number(m[1]),
    lon = Number(m[2]);
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lat, lon };
});
watch(parsedCoords, (c) => {
  form.value.latitude = c ? c.lat : null;
  form.value.longitude = c ? c.lon : null;
});
/* Cost in another currency: show the rate and the converted amount, like the
   booking editor does. Activities store no rate of their own — the budget
   converts estimates live — so this is a live lookup too. */
const costRate = ref(null);
const fetchingCostRate = ref(false);
const showCostRate = computed(
  () => !!form.value.costCurrency && form.value.costCurrency !== accountCurrency.value,
);
const fetchCostRate = async () => {
  if (!showCostRate.value) return;
  fetchingCostRate.value = true;
  try {
    const res = await api.get('/api/exchange-rate', {
      params: { from: form.value.costCurrency, to: accountCurrency.value },
    });
    costRate.value = res.data.rate;
  } catch {
    costRate.value = null;
    toast.warning('Rate unavailable', `Could not fetch a rate for ${form.value.costCurrency}`);
  } finally {
    fetchingCostRate.value = false;
  }
};
watch(
  () => form.value.costCurrency,
  (cur) => {
    costRate.value = null;
    if (cur && cur !== accountCurrency.value && showDrawer.value) fetchCostRate();
  },
);
// The form is filled before the drawer opens, so an existing foreign-currency
// estimate needs its rate looked up on open as well.
watch(showDrawer, (open) => {
  if (open && showCostRate.value && costRate.value == null) fetchCostRate();
});

/** The pin this stop will get: the linked place's, else its own. */
const stopPreviewMarkers = computed(() => {
  const p = linkedPlace.value;
  const lat = p?.latitude ?? form.value.latitude;
  const lon = p?.longitude ?? form.value.longitude;
  return lat != null && lon != null
    ? [{ lat: Number(lat), lon: Number(lon), label: form.value.name || p?.name || '' }]
    : [];
});
// Field errors appear only after a save attempt, as in the booking editor.
const attempted = ref(false);
/** A stop the booking sync wrote; it is shown, not edited. */
const isBookingStop = computed(() => !!editingActivity.value?.fromBooking);

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

// Place-type meta for the "Add from places" cards (shared via @tripyfull/core).
const placeTypeEmoji = (t) => placeTypeMeta(t).emoji;
const placeTypeStyle = (t) => ({ background: placeTypeMeta(t).bg, color: placeTypeMeta(t).color });
// Untyped places read better as "Place" than "Other" on the cards.
const placeTypeLabel = (t) =>
  t && t !== 'OTHER' && PLACE_TYPE_META[t] ? PLACE_TYPE_META[t].label : 'Place';

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
  attempted.value = false;
  coordsText.value = '';
  moveTargetDayId.value = null;
  showDrawer.value = true;
};

// Find & save a brand-new place from geocoding, then link it to this activity.
const findingPlace = ref(false);
// Result types that describe a location rather than a venue: these do not
// belong in the place library, they just say where the stop is.
const ADDRESS_TYPES = new Set([
  'address',
  'street',
  'road',
  'city',
  'town',
  'village',
  'locality',
  'region',
  'country',
  'postcode',
]);
const onActivityGeoPicked = async (geo) => {
  if (!geo) return;
  if (ADDRESS_TYPES.has(String(geo.placeType || '').toLowerCase())) {
    form.value.address = geo.displayName || geo.name || '';
    coordsText.value = `${geo.lat}, ${geo.lon}`;
    return;
  }
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

const typeOptions = [
  { label: 'Sightseeing', value: 'SIGHTSEEING' },
  { label: 'Beach', value: 'BEACH' },
  { label: 'Nature', value: 'NATURE' },
  { label: 'Neighborhood', value: 'NEIGHBORHOOD' },
  { label: 'Restaurant', value: 'RESTAURANT' },
  { label: 'Meal stop', value: 'MEAL_STOP' },
  { label: 'Shopping', value: 'SHOPPING' },
  { label: 'Transport', value: 'TRANSPORT' },
  { label: 'Hotel', value: 'ACCOMMODATION' },
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
    ACCOMMODATION: '\u{1F3E8}',
    OTHER: '\u{1F4CC}',
  })[t] ?? '\u{1F4CC}';

const typeLabel = (t) => typeOptions.find((o) => o.value === t)?.label ?? t ?? '';

// A journey written from a booking shows what it travels by, not a generic bus.
const MODE_ICON = {
  FLIGHT: '\u2708\uFE0F',
  TRAIN: '\u{1F686}',
  BUS: '\u{1F68C}',
  FERRY: '\u26F4\uFE0F',
  TAXI: '\u{1F695}',
  CAR_RENTAL: '\u{1F697}',
  METRO: '\u{1F687}',
  WALK: '\u{1F6B6}',
};
const stopIcon = (a) => (a.fromBooking && MODE_ICON[a.bookingTransportMode]) || typeIcon(a.type);

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
    ACCOMMODATION: { background: 'var(--success-100)', color: 'var(--primary)' },
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

/**
 * The day in time order. Timed stops sort by their time; a stop without one
 * stays right after the stop it follows; the hotel rows the booking sync wrote
 * keep their place at the ends of the day (where you wake up, where you sleep).
 */
const inTimeOrder = (list) => {
  const isHotel = (a) => a.fromBooking && a.type === 'ACCOMMODATION';
  let head = 0;
  while (head < list.length && isHotel(list[head])) head++;
  let tail = list.length;
  while (tail > head && isHotel(list[tail - 1])) tail--;
  const middle = list.slice(head, tail);
  // Effective time: own, else the last timed stop before it (so it trails it).
  let last = '';
  const keyed = middle.map((a, i) => {
    if (a.startTime) last = a.startTime;
    return { a, i, t: a.startTime || last };
  });
  keyed.sort((x, y) => x.t.localeCompare(y.t) || x.i - y.i);
  return [...list.slice(0, head), ...keyed.map((k) => k.a), ...list.slice(tail)];
};
const sortByTime = () => {
  activities.value = inTimeOrder(activities.value);
  persistOrder();
};
/** After a save: if the day is no longer in time order, put it back. */
const autoSortByTime = () => {
  const ordered = inTimeOrder(activities.value);
  if (ordered.some((a, i) => a.id !== activities.value[i].id)) {
    activities.value = ordered;
    persistOrder();
  }
};

/**
 * Times the chain works out for stops that have none: the previous stop's time
 * (its own or worked out) plus how long it takes there — its own span, else the
 * place's visit time, else nothing (a departure point) — plus the way over.
 */
const derivedTimes = computed(() => {
  const out = {};
  let clock = null; // minutes since midnight at the end of the previous stop
  for (const a of activities.value) {
    const own = a.startTime ? toMinutes(a.startTime) : null;
    const start = own ?? clock;
    if (own == null && start != null) out[a.id] = fromMinutes(start);
    if (start == null) continue;
    let stay = minutesBetween(a);
    if (!stay && !a.fromBooking) {
      const place = placesLib.value.find((x) => x.id === a.placeId);
      stay = place?.visitMinutes || 0;
    }
    const leg = legInfoByActivity.value[a.id]?.data?.durationSec;
    clock = start + stay + (leg ? Math.round(leg / 60) : 0);
    if (clock >= 24 * 60) clock = null; // past midnight: stop guessing
  }
  return out;
});
const toMinutes = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
const fromMinutes = (min) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

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

/* Costs in other currencies are converted at the live rate, the way the budget
   page does it — a THB estimate must not be added up as if it were euros. */
const costRates = ref({});
const isForeign = (a) => !!a.costCurrency && a.costCurrency !== currency.value;
const toBase = (a) => {
  const amt = Number(a.costEstimate) || 0;
  if (!isForeign(a)) return amt;
  const rate = costRates.value[a.costCurrency];
  return rate ? amt * rate : 0; // unknown rate: left out rather than counted as base currency
};
const loadCostRates = async () => {
  const wanted = [...new Set(activities.value.filter(isForeign).map((a) => a.costCurrency))].filter(
    (c) => !costRates.value[c],
  );
  await Promise.all(
    wanted.map(async (c) => {
      try {
        const res = await api.get('/api/exchange-rate', {
          params: { from: c, to: currency.value },
        });
        costRates.value = { ...costRates.value, [c]: Number(res.data.rate) };
      } catch {
        /* no rate: the amount stays visible in its own currency, out of the total */
      }
    }),
  );
};
watch(activities, loadCostRates, { deep: true });
const dayTotal = computed(() => activities.value.reduce((s, a) => s + toBase(a), 0));

// Saved places near the route: grey context dots on the map. Places already
// planned today are hidden — they're route pins.
/**
 * Every saved place in the current scope that is not planned yet — the map and
 * the candidate list show the same set, so whatever you spot on one you can act
 * on in the other.
 */
const libraryDots = computed(() =>
  candidatePlaces.value
    .filter((p) => p.latitude != null && p.longitude != null)
    .map((p) => ({
      id: p.id,
      lat: Number(p.latitude),
      lon: Number(p.longitude),
      label: p.name,
      rating: p.rating || 3,
      sub: pickSub(p),
      note: p.ratingComment || null,
    })),
);
const onMapDotAdd = (id) => {
  const p = placesLib.value.find((x) => x.id === id);
  if (p) openAddFromPlace(p);
};

// A stop is on the map either through its linked place or, for one written from
// a booking (a hotel, an airport), through coordinates of its own.
const stopLat = (a) => a.placeLatitude ?? a.latitude;
const stopLon = (a) => a.placeLongitude ?? a.longitude;
const hasCoords = (a) => stopLat(a) != null && stopLon(a) != null;

// Pins for activities that have coordinates (ordered = numbered).
const activityMarkers = computed(() =>
  activities.value.filter(hasCoords).map((a) => ({
    lat: Number(stopLat(a)),
    lon: Number(stopLon(a)),
    label: a.placeName || a.name,
  })),
);
// activity id -> its number on the map (same order as the markers)
const stopNumbers = computed(() => {
  const map = {};
  let n = 0;
  activities.value.forEach((a) => {
    if (hasCoords(a)) map[a.id] = ++n;
  });
  return map;
});

// Per-leg road routes (OSRM via /api/geo/route): each pair of consecutive
// mapped stops is routed with its own travel mode (activity.travelModeToNext,
// walking by default). Results are keyed by mode+coords — toggling a leg only
// fetches what's missing, and late responses can never mismatch their leg.
// Non-fatal: a failed leg falls back to a straight segment and a "no route" chip.
const LEG_CACHE_MAX = 150;
const legCache = ref(new Map()); // key -> { durationSec, distanceM, geometry } | null (no route)
const legsInFlight = new Set();
let legTimer = null;
let legRetryTimer = null;

/**
 * How you get to the next stop. Walking and driving are routed for real; taxi,
 * bus, train and plane are estimates (no open timetables here) — the row says so.
 */
const TRAVEL_MODES = [
  { key: 'foot', icon: '🚶', label: 'on foot', hint: 'Walk to the next stop' },
  {
    key: 'taxi',
    icon: '🚕',
    label: 'by taxi',
    hint: 'Taxi / ride-hailing — road time plus hailing',
  },
  {
    key: 'bus',
    icon: '🚌',
    label: 'by bus',
    hint: 'Bus — road time plus stops and waiting (estimate)',
  },
  {
    key: 'train',
    icon: '🚆',
    label: 'by train',
    hint: 'Train — own track, plus station time (estimate)',
  },
  { key: 'car', icon: '🚗', label: 'by car', hint: 'Drive yourself to the next stop' },
  {
    key: 'plane',
    icon: '✈️',
    label: 'by plane',
    hint: 'Flight — straight line plus airport time (estimate)',
  },
];
const MODE_KEYS = TRAVEL_MODES.map((m) => m.key);
const modeLabel = (key) => TRAVEL_MODES.find((m) => m.key === key)?.label || '';

const legMode = (a) => (MODE_KEYS.includes(a.travelModeToNext) ? a.travelModeToNext : 'foot');

// One leg per consecutive pair of mapped stops, owned by the departing activity.
const dayLegs = computed(() => {
  const stops = activities.value.filter(hasCoords);
  const legs = [];
  for (let i = 0; i < stops.length - 1; i++) {
    const from = stops[i];
    const to = stops[i + 1];
    const mode = legMode(from);
    const points = `${Number(stopLat(from))},${Number(stopLon(from))};${Number(stopLat(to))},${Number(stopLon(to))}`;
    legs.push({ fromId: from.id, mode, key: `${mode}|${points}` });
  }
  return legs;
});

// Fetch every leg without a cached result. Only a definite 404 ("no route
// between these points" — the backend caches that verdict too) is stored as
// null; transient failures (backend/OSRM down, timeouts) stay uncached and are
// retried on a timer, so one blip can't pin "no route found" on a leg.
const fetchMissingLegs = () => {
  const missing = dayLegs.value.filter(
    (l) => !legCache.value.has(l.key) && !legsInFlight.has(l.key),
  );
  missing.forEach(async ({ key }) => {
    legsInFlight.add(key);
    try {
      const [mode, points] = key.split('|');
      const res = await api.get('/api/geo/route', { params: { points, mode } });
      legCache.value.set(key, {
        durationSec: res.data.durationSec,
        distanceM: res.data.distanceM,
        geometry: res.data.geometry,
        estimated: !!res.data.estimated,
      });
    } catch (err) {
      if (err.response?.status === 404) {
        legCache.value.set(key, null); // genuinely unroutable
      } else if (!legRetryTimer) {
        legRetryTimer = setTimeout(() => {
          legRetryTimer = null;
          fetchMissingLegs();
        }, 8000);
      }
    } finally {
      legsInFlight.delete(key);
    }
  });
  // keep the cache bounded; drop entries the current day no longer uses
  if (legCache.value.size > LEG_CACHE_MAX) {
    const keep = new Set(dayLegs.value.map((l) => l.key));
    for (const k of legCache.value.keys()) if (!keep.has(k)) legCache.value.delete(k);
  }
};

// Debounced — drag-reordering mutates the list many times per second.
watch(
  () => dayLegs.value.map((l) => l.key).join(' '),
  () => {
    clearTimeout(legTimer);
    legTimer = setTimeout(fetchMissingLegs, 400);
  },
);

onUnmounted(() => {
  clearTimeout(legTimer);
  clearTimeout(legRetryTimer);
});

// activity id -> its outgoing leg { mode, data } (data: undefined = loading, null = failed)
const legInfoByActivity = computed(() => {
  const m = {};
  for (const l of dayLegs.value) m[l.fromId] = { mode: l.mode, data: legCache.value.get(l.key) };
  return m;
});

// Latest requested mode per activity: quick repeated toggles are last-write-wins,
// and stale settlements (or a reorder replacing the array) can't desync the UI.
const pendingModeSaves = new Map(); // activity id -> mode of the newest in-flight PATCH
const setLegMode = async (a, mode) => {
  if (legMode(a) === mode) return;
  const id = a.id;
  pendingModeSaves.set(id, mode);
  a.travelModeToNext = mode; // optimistic — dayLegs recomputes and fetches
  try {
    const res = await api.patch(`/api/activities/${id}`, { travelModeToNext: mode });
    if (pendingModeSaves.get(id) !== mode) return; // superseded by a newer click
    pendingModeSaves.delete(id);
    // re-apply to the current object — the array may have been replaced meanwhile
    const cur = activities.value.find((x) => x.id === id);
    if (cur) cur.travelModeToNext = res.data.travelModeToNext;
  } catch {
    if (pendingModeSaves.get(id) !== mode) return; // a newer click owns the state now
    pendingModeSaves.delete(id);
    toast.danger('Error', 'Failed to save travel mode');
    loadDay(dayId.value); // resync from the server instead of guessing a revert
  }
};

// Map geometry per leg: road points when routed, straight segment while
// loading or when unroutable.
const mapLegs = computed(() =>
  dayLegs.value.map((l) => {
    const cached = legCache.value.get(l.key);
    const [from, to] = l.key
      .split('|')[1]
      .split(';')
      .map((p) => p.split(',').map(Number));
    return {
      mode: l.mode,
      points: cached?.geometry?.length >= 2 ? cached.geometry : [from, to],
    };
  }),
);

// Whole-day totals; hidden until every leg has real numbers.
const routeTotal = computed(() => {
  if (!dayLegs.value.length) return null;
  let durationSec = 0;
  let distanceM = 0;
  for (const l of dayLegs.value) {
    const d = legCache.value.get(l.key);
    if (!d) return null;
    durationSec += d.durationSec;
    distanceM += d.distanceM;
  }
  return { durationSec, distanceM };
});

const fmtDur = (sec) => {
  const min = Math.max(1, Math.round(sec / 60));
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60} min`;
};
const fmtDist = (m) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`);
// Saved places in this day's city, for quick-add in the empty state.
/** The map is the widest thing here, so it follows the window's height. */
const mapHeight = ref(560);
const measureMap = () => {
  mapHeight.value = Math.max(420, Math.min(760, window.innerHeight - 320));
};

/** km between two points — good enough to sort candidates by "how far off route". */
const distanceKm = (aLat, aLon, bLat, bLon) => {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const la1 = (aLat * Math.PI) / 180;
  const la2 = (bLat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

/** Rating wording shared with the places library. */
const RATING_HINTS = {
  5: 'worth the whole trip',
  4: 'big detour OK',
  3: 'small detour',
  2: 'only if on the way',
  1: 'maybe skip',
};

/** The library place this activity points at, if any. */
const linkedPlace = computed(() =>
  form.value.placeId ? placesLib.value.find((p) => p.id === form.value.placeId) || null : null,
);

/** "Not today" — hiding declutters both the map and the list. It is a view
 *  choice, so it lives in the browser per trip, not in the trip's data. */
const HIDDEN_KEY = `tf.hiddenPlaces.${tripId}`;
const hiddenIds = ref(new Set());

const loadHidden = () => {
  try {
    hiddenIds.value = new Set(JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]'));
  } catch {
    hiddenIds.value = new Set();
  }
};
const persistHidden = () => {
  try {
    localStorage.setItem(HIDDEN_KEY, JSON.stringify([...hiddenIds.value]));
  } catch {
    /* private mode — hiding just won't survive a reload */
  }
};
const hidePlace = (id) => {
  const next = new Set(hiddenIds.value);
  next.add(id);
  hiddenIds.value = next;
  persistHidden();
  const name = placesLib.value.find((p) => p.id === id)?.name || 'Place';
  toast.success('Hidden', `${name} — "show hidden" brings it back`);
};
const unhideAll = () => {
  hiddenIds.value = new Set();
  persistHidden();
};

// The candidates are the trip's own shortlist — the whole library is what the
// Places page is for.
const PICK_SCOPES = [
  { key: 'city', label: 'This city' },
  { key: 'trip', label: 'Trip list' },
];
const PICK_SORTS = [
  { key: 'rating', label: 'Best first', hint: 'Must-sees first, nearest among equals' },
  { key: 'near', label: 'Nearest', hint: 'Closest to what is already planned today' },
];
const pickScope = ref('trip');
const pickSort = ref('rating');

/** A usable sightseeing day, the yardstick the budget bar measures against. */
/** "1 h 30 min" from minutes. */
const fmtMin = (min) => {
  const m = Math.max(0, Math.round(min));
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60 ? (m % 60) + ' min' : ''}`.trim();
};

/**
 * How full the day is. Stops are the places you go to — the hotel rows and the
 * flights, trains and ferries written from bookings are not stops, they frame the
 * day. Time at places: a stop's own start–end, else the place's visit time; a stop
 * with neither is counted as unknown, not guessed at. Time on the move: the routed legs between mapped stops plus the
 * booked journeys with a departure and an arrival on this day (the flight itself).
 * A rental-car pickup is an errand — half an hour at a counter, not five days of
 * driving.
 */
const minutesBetween = (a) => {
  if (!a.startTime || !a.endTime) return 0;
  const [h1, m1] = a.startTime.split(':').map(Number);
  const [h2, m2] = a.endTime.split(':').map(Number);
  const span = h2 * 60 + m2 - (h1 * 60 + m1);
  return span > 0 ? span : 0;
};
const isHotelRow = (a) => a.type === 'ACCOMMODATION';
const isJourneyRow = (a) => a.fromBooking && a.type === 'TRANSPORT';

/**
 * Minutes of a booked journey that fall on this day: an overnight flight leaving
 * at 20:55 is three hours of this day and seven of the next. Without the
 * booking's real times, the stop's own start–end has to do.
 */
const journeyMinutesToday = (a) => {
  if (!day.value?.date || !a.bookingDepartureAt || !a.bookingArrivalAt) return minutesBetween(a);
  const dayStart = new Date(`${day.value.date}T00:00:00`);
  const dayEnd = new Date(dayStart.getTime() + 86400000);
  const from = Math.max(new Date(a.bookingDepartureAt).getTime(), dayStart.getTime());
  const to = Math.min(new Date(a.bookingArrivalAt).getTime(), dayEnd.getTime());
  return to > from ? Math.round((to - from) / 60000) : 0;
};

const dayBudget = computed(() => {
  let visitMin = 0;
  let travelMin = routeTotal.value ? Math.round(routeTotal.value.durationSec / 60) : 0;
  let stops = 0;
  let untimed = 0;
  const seenJourneys = new Set();
  for (const a of activities.value) {
    if (isHotelRow(a)) continue;
    if (isJourneyRow(a)) {
      // A departure and its "Arrive" row are one journey; count it once.
      const key = a.bookingDepartureAt ? `${a.bookingDepartureAt}|${a.bookingArrivalAt}` : a.id;
      if (!seenJourneys.has(key)) {
        seenJourneys.add(key);
        travelMin += journeyMinutesToday(a);
      }
      continue;
    }
    stops += 1;
    const span = minutesBetween(a);
    const place = a.fromBooking ? null : placesLib.value.find((x) => x.id === a.placeId);
    if (span) visitMin += span;
    else if (place?.visitMinutes) visitMin += place.visitMinutes;
    else untimed += 1; // no time, no estimate: say so instead of inventing an hour
  }
  return { stops, visitMin, travelMin, untimed };
});

/** Places attached to this trip — the shortlist the day should be built from. */
const inThisTrip = (p) => (p.tripIds || []).includes(tripId);

/** The day's stops, so a candidate can be measured against the nearest one. */
const dayStops = computed(() =>
  activityMarkers.value.map((m, i) => ({ n: i + 1, name: m.label, lat: m.lat, lon: m.lon })),
);

/** Fallback anchor for an empty day: something saved in the day's own city. */
const cityAnchor = computed(() => {
  const withCity = placesLib.value.find(
    (p) => p.latitude != null && p.longitude != null && matchesDayCity(p),
  );
  return withCity ? { lat: Number(withCity.latitude), lon: Number(withCity.longitude) } : null;
});

/** Nearest planned stop to a place — the answer to "what is this next to?". */
const nearestStop = (p) => {
  if (p.latitude == null || p.longitude == null || !dayStops.value.length) return null;
  let best = null;
  for (const st of dayStops.value) {
    const km = distanceKm(st.lat, st.lon, Number(p.latitude), Number(p.longitude));
    if (!best || km < best.km) best = { ...st, km };
  }
  return best;
};

const matchesDayCity = (p) => {
  const c = (day.value?.city || '').trim().toLowerCase();
  if (!c) return true;
  const pc = (p.city || '').toLowerCase();
  return !!pc && (pc === c || pc.includes(c) || c.includes(pc));
};

/** Rating first (the strategy's whole point), then nearest among equals. */
const candidatePlaces = computed(() => {
  const planned = new Set(activities.value.map((a) => a.placeId).filter(Boolean));
  const fallback = cityAnchor.value;
  const byKm = (a, b) => (a.km == null ? 1e9 : a.km) - (b.km == null ? 1e9 : b.km);
  return (
    placesLib.value
      .filter((p) => !planned.has(p.id) && !hiddenIds.value.has(p.id))
      // city subset of trip subset of all
      .filter(inThisTrip)
      .filter((p) => (pickScope.value === 'city' ? matchesDayCity(p) : true))
      .map((p) => {
        const near = nearestStop(p);
        const km =
          near?.km ??
          (fallback && p.latitude != null && p.longitude != null
            ? distanceKm(fallback.lat, fallback.lon, Number(p.latitude), Number(p.longitude))
            : null);
        return { ...p, nearStop: near, km };
      })
      .sort((a, b) =>
        pickSort.value === 'near'
          ? byKm(a, b) || (b.rating || 3) - (a.rating || 3)
          : (b.rating || 3) - (a.rating || 3) || byKm(a, b) || a.name.localeCompare(b.name),
      )
      .slice(0, 40)
  );
});

const fmtKm = (km) => (km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`);

/** Type, how long it takes, and what it sits next to today. */
const pickSub = (p) =>
  [
    placeTypeLabel(p.type),
    p.visitMinutes ? `${p.visitMinutes} min` : null,
    p.nearStop
      ? `${fmtKm(p.nearStop.km)} from ${p.nearStop.n}. ${p.nearStop.name}`
      : p.km != null
        ? `${fmtKm(p.km)} away`
        : null,
    p.needsBooking ? 'book ahead' : null,
  ]
    .filter(Boolean)
    .join(' · ');

/**
 * Add straight to the day and drop it in after the stop it is nearest to —
 * geography decides the order, which is the point of planning on a map.
 */
const quickAddingId = ref(null);
const quickAdd = async (p) => {
  quickAddingId.value = p.id;
  const near = p.nearStop;
  try {
    const res = await api.post(`/api/days/${dayId.value}/activities`, {
      name: p.name,
      type: placeToActivityType(p.type),
      address: p.address || null,
      placeId: p.id,
      needsBooking: !!p.needsBooking,
    });
    activities.value = [...activities.value, res.data];
    if (!placesLib.value.some((x) => x.id === p.id)) placesLib.value.unshift(p);

    if (near) {
      const ids = activities.value.map((a) => a.id).filter((id) => id !== res.data.id);
      const anchorId = activities.value.find((a) => a.name === near.name)?.id;
      const at = anchorId ? ids.indexOf(anchorId) + 1 : ids.length;
      ids.splice(at, 0, res.data.id);
      const ordered = await api.patch(`/api/days/${dayId.value}/activities/reorder`, {
        orderedIds: ids,
      });
      activities.value = ordered.data;
    }
    toast.success('Added', near ? `After ${near.n}. ${near.name}` : `${p.name} is in the day`);
  } catch {
    toast.danger('Error', 'Failed to add the place');
  } finally {
    quickAddingId.value = null;
  }
};

/** Flip any day between planned and buffer straight from the strip. */
/** Dated days are the trip; reserve days sit beside it, without a date. */
const datedDays = computed(() => allDays.value.filter((d) => d.date));
const reserveDays = computed(() => allDays.value.filter((d) => !d.date));
const reserveIndex = computed(() => reserveDays.value.findIndex((d) => d.id === dayId.value) + 1);

const addingBuffer = ref(false);
const addBufferDay = async () => {
  addingBuffer.value = true;
  try {
    const res = await api.post(`/api/trips/${tripId}/days/buffer`);
    allDays.value = res.data || [];
    toast.success('Buffer day added', 'It sits outside the trip dates until you swap it in');
  } catch {
    toast.danger('Error', 'Failed to add a buffer day');
  } finally {
    addingBuffer.value = false;
  }
};

const removeReserveDay = async (d) => {
  const ok = await confirm({
    title: 'Remove reserve day',
    message: 'Anything planned on it is removed too. Continue?',
    tone: 'danger',
    confirmLabel: 'Remove',
    cancelLabel: 'Cancel',
  });
  if (!ok) return;
  try {
    await api.delete(`/api/days/${d.id}`);
    allDays.value = allDays.value.filter((x) => x.id !== d.id);
    // Standing on the day that just went away: fall back to the first real one.
    if (d.id === dayId.value && datedDays.value.length) switchDay(datedDays.value[0].id);
    toast.success('Removed');
  } catch {
    toast.danger('Error', 'Failed to remove the day');
  }
};

const costByType = computed(() => {
  const map = {};
  activities.value.forEach((a) => {
    if (a.costEstimate && a.type) {
      map[a.type] = (map[a.type] || 0) + toBase(a);
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

// Swap this day's plan with another day of the trip.
const showSwapModal = ref(false);
const swapping = ref(false);
const swapTargetLabel = ref(null);
const swapDayOptions = computed(() =>
  allDays.value
    .filter((d) => d.id !== dayId.value)
    .map((d) => ({ label: `Day ${d.dayNumber} · ${formatDateShort(d.date)}`, value: d.id })),
);
const swapDayLabels = computed(() => swapDayOptions.value.map((o) => o.label));
const openSwapModal = () => {
  swapTargetLabel.value = null;
  showSwapModal.value = true;
};
const doSwap = async () => {
  const target = swapDayOptions.value.find((o) => o.label === swapTargetLabel.value)?.value;
  if (!target) return;
  swapping.value = true;
  try {
    await api.post(`/api/trips/${tripId}/days/${dayId.value}/swap/${target}`);
    showSwapModal.value = false;
    await loadDay(dayId.value);
    toast.success('Swapped', `Plans traded with ${swapTargetLabel.value}`);
  } catch {
    toast.danger('Error', 'Failed to swap days');
  } finally {
    swapping.value = false;
  }
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

const showAutoPlan = ref(false);

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
    autoSortByTime(); // stops appended out of time order (bookings first, hand-made after) fall into place
  } catch {
    day.value = allDays.value.find((d) => d.id === id) || null;
    activities.value = [];
  }
};

const openAddDialog = () => {
  editingActivity.value = null;
  form.value = { ...emptyForm, costCurrency: accountCurrency.value };
  attempted.value = false;
  coordsText.value = '';
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
    needsBooking: !!a.needsBooking,
    latitude: a.latitude ?? null,
    longitude: a.longitude ?? null,
  };
  coordsText.value =
    a.latitude != null && a.longitude != null ? `${a.latitude}, ${a.longitude}` : '';
  attempted.value = false;
  moveTargetDayId.value = dayId.value; // preselect the current day in the move select
  showDrawer.value = true;
};

const saveActivity = async () => {
  attempted.value = true;
  if (!String(form.value.name || '').trim()) return;
  saving.value = true;
  try {
    const payload = {
      ...form.value,
      startTime: form.value.startTime || null,
      endTime: form.value.endTime || null,
      costEstimate: form.value.costEstimate || null,
      costCurrency: form.value.costCurrency || accountCurrency.value,
      placeId: form.value.placeId || null,
      clearPlace: !form.value.placeId,
      latitude: form.value.placeId ? null : form.value.latitude,
      longitude: form.value.placeId ? null : form.value.longitude,
      clearCoords: !!form.value.placeId || form.value.latitude == null,
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
        if (res.data.startTime) autoSortByTime();
        toast.success('Updated', 'Activity updated');
      }
    } else {
      const res = await api.post(`/api/days/${dayId.value}/activities`, payload);
      activities.value.push(res.data);
      if (res.data.startTime) autoSortByTime();
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

onMounted(() => {
  loadHidden();
  measureMap();
  window.addEventListener('resize', measureMap);
});
onBeforeUnmount(() => window.removeEventListener('resize', measureMap));

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
    autoSortByTime(); // stops appended out of time order (bookings first, hand-made after) fall into place
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
  /* The map earns the wider half it needs to be read at a glance. */
  grid-template-columns: minmax(0, 1fr) minmax(420px, 34%);
  gap: 24px;
  align-items: start;
}
@media (max-width: 1100px) {
  .itin-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}
.itin-map {
  position: sticky;
  top: 0;
}
/* Travel modes on a leg: small, always all of them, current one filled. */
.leg-modes {
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  border-radius: var(--radius-pill);
  background: var(--surface);
  flex: none;
}
.leg-mode {
  width: 24px;
  height: 22px;
  border: none;
  background: none;
  border-radius: var(--radius-pill);
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
  opacity: 0.45;
  filter: grayscale(1);
}
.leg-mode:hover {
  opacity: 0.8;
  filter: none;
}
.leg-mode.is-on {
  background: var(--card);
  box-shadow: var(--shadow-sm);
  opacity: 1;
  filter: none;
}
.leg-estimate {
  margin-left: 4px;
  padding: 1px 6px;
  border-radius: var(--radius-pill);
  background: var(--surface);
  font: var(--fw-medium) 10px/1.4 var(--font-sans);
  color: var(--text-disabled);
}

.itin-map-legend {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  margin-top: 6px;
  font: var(--fw-regular) 11px/1.4 var(--font-sans);
  color: var(--text-secondary);
}

/* How full the day is: two stacked shares of a 10h day. */

.itin-picks-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 8px 0;
}
.pick-add,
.pick-more {
  flex: none;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-sm);
  background: none;
  cursor: pointer;
  font-size: 12px;
}
.pick-add {
  color: var(--accent);
}
.pick-more {
  color: var(--text-disabled);
}
.pick-add:hover,
.pick-more:hover {
  background: var(--card);
  color: var(--text-primary);
}
.pick-add:disabled {
  opacity: 0.5;
  cursor: default;
}

/* Candidates: a dense, scannable list — rating badge, name, the facts that
   decide whether it fits today. */
.itin-picks {
  margin-top: 18px;
  background: var(--card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--space-3) var(--space-4);
}
.itin-picks-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
}
.itin-picks-head h3 {
  margin: 0;
  font: var(--fw-bold) 15px/1.2 var(--font-display);
}
.itin-picks-scope {
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  border-radius: var(--radius-pill);
  background: var(--surface);
}
.pick-scope-btn {
  border: none;
  background: none;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  font: var(--fw-medium) 12px/1 var(--font-sans);
  color: var(--text-secondary);
  cursor: pointer;
}
.pick-scope-btn.is-on {
  background: var(--card);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
}
.itin-picks-list {
  max-height: 320px;
  overflow-y: auto;
  margin: 0 calc(-1 * var(--space-2));
}
.pick-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 7px var(--space-2);
  border: none;
  background: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: left;
}
.pick-row:hover {
  background: var(--surface);
}
.pick-rating {
  flex: none;
  font: var(--fw-semibold) 12px/1 var(--font-sans);
  color: var(--text-secondary);
  width: 30px;
}
.pick-rating--5 {
  color: var(--warning-700);
  font-weight: var(--fw-bold);
}
.pick-rating--4 {
  color: var(--text-primary);
}
.pick-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.pick-name {
  font: var(--fw-semibold) 13px/1.3 var(--font-sans);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pick-sub {
  font: var(--fw-regular) 11px/1.3 var(--font-sans);
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pick-row .pi-plus {
  color: var(--accent);
  font-size: 13px;
  flex: none;
}

/* Reserve days live after a divider: same strip, outside the dates. */
.day-picker-sep {
  width: 1px;
  align-self: stretch;
  margin: 4px 6px;
  background: var(--border-default);
  flex: none;
}
.day-picker-btn--reserve .day-picker-date {
  font-style: italic;
}
.day-picker-add {
  flex: none;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 58px;
  padding: 8px 10px;
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-md);
  background: none;
  color: var(--text-secondary);
  font: var(--fw-medium) 11px/1.2 var(--font-sans);
  cursor: pointer;
}
.day-picker-add:hover {
  background: var(--surface);
  color: var(--text-primary);
}
.day-picker-add:disabled {
  opacity: 0.5;
  cursor: default;
}

/* Buffer days: same row, same size, just visibly held in reserve. */
.day-picker-btn {
  position: relative;
}
.day-picker-note {
  font: var(--fw-regular) 10px/1.2 var(--font-sans);
  color: var(--text-disabled);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 68px;
}
.day-picker-flag {
  position: absolute;
  top: 2px;
  right: 3px;
  font-size: 10px;
  line-height: 1;
  color: var(--text-disabled);
  opacity: 0;
  transition: opacity var(--dur-fast) var(--ease-out);
}
.day-picker-flag.is-on {
  opacity: 1;
}
.day-picker-flag.is-on {
  color: var(--warning-700);
}

/* The linked place's own words, read-only inside the activity drawer. */
.linked-facts {
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  background: var(--surface);
}
.linked-facts-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  font: var(--type-code);
  text-transform: uppercase;
  letter-spacing: var(--ls-caps);
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
}
.linked-facts-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  padding: 3px 0;
  font: var(--type-small);
  color: var(--text-secondary);
}
.linked-facts-val {
  font-weight: var(--fw-semibold);
  color: var(--text-primary);
  text-align: right;
}
.linked-facts-desc {
  margin: var(--space-2) 0 0;
  font: var(--type-small);
  color: var(--text-secondary);
}

.itin-map-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.itin-map-empty {
  height: 420px;
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
.itin-route-total {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  color: var(--text-secondary);
  font: var(--fw-medium) 12px/1 var(--font-sans);
}
.itin-route-total i {
  font-size: 12px;
  color: var(--success-700);
}
.timeline-leg {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0 0 4px;
  color: var(--text-secondary);
  font: var(--fw-medium) 12px/1 var(--font-sans);
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

.money-approx {
  display: block;
  font: var(--fw-medium) 11px/1.3 var(--font-mono);
  color: var(--text-secondary);
}

.timeline-time--derived {
  color: var(--text-disabled);
  font-style: italic;
}

.day-load {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font: var(--fw-medium) 14px/1.3 var(--font-sans);
  color: var(--text-secondary);
}
.day-load b {
  color: var(--text-primary);
}
.day-load-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 5px;
  vertical-align: 1px;
}
.day-load-dot--visit {
  background: var(--primary);
}
.day-load-dot--travel {
  background: var(--warning-500);
}

.stop-address {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font: var(--type-small);
  color: var(--text-secondary);
}
.stop-address .pi {
  color: var(--accent);
  font-size: 12px;
}
.rate-box {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 12px 14px;
  background: var(--surface);
  border-radius: var(--radius-md);
}
.rate-label {
  font: var(--fw-medium) 12px/1 var(--font-mono);
  color: var(--text-secondary);
  margin-bottom: 6px;
}
.rate-value {
  display: flex;
  align-items: center;
  gap: 8px;
  font: var(--fw-bold) 20px/1 var(--font-display);
  color: var(--text-primary);
}
.rate-unit {
  font: var(--fw-medium) 13px/1 var(--font-sans);
  color: var(--text-secondary);
}

.booking-stop {
  padding: 12px 14px;
  border-radius: var(--radius-md);
  background: var(--surface);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.booking-stop-name {
  font: var(--fw-semibold) 15px/1.3 var(--font-sans);
  color: var(--text-primary);
}
.booking-stop-line {
  font: var(--type-small);
  color: var(--text-secondary);
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
