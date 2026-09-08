<template>
  <div class="bc">
    <div class="bc-wrap">
      <!-- Nav -->
      <nav class="bc-nav">
        <a href="#buttons">Buttons</a>
        <a href="#forms">Text inputs &amp; textarea</a>
        <a href="#selects">Selects</a>
        <a href="#numbers">Number inputs</a>
        <a href="#choice">Radios, checkboxes &amp; switches</a>
        <a href="#badges">Badge</a>
        <a href="#chips">Chips</a>
        <a href="#progress">Progress</a>
        <a href="#dates">Date &amp; time</a>
        <a href="#alerts">Alerts</a>
        <a href="#toasts">Toasts</a>
        <a href="#tooltip">Tooltip</a>
        <a href="#modal">Modal</a>
        <a href="#accordion">Accordion</a>
        <a href="#dropdown">Dropdown</a>
        <a href="#table">Table</a>
        <a href="#stat">Stat</a>
        <a href="#avatars">Avatars</a>
        <a href="#skeleton">Skeleton</a>
        <a href="#spinner">Spinner</a>
        <a href="#confirm">Confirm</a>
        <a href="#toast-host">Toast host</a>
        <a href="#popover">Popover</a>
        <a href="#multiselect">Multi-select</a>
        <a href="#upload">File upload</a>
        <a href="#rating">Rating</a>
        <a href="#drawers">Drawer</a>
        <a href="#lightbox">Lightbox</a>
        <a href="#pdf">PDF viewer</a>
        <router-link to="/styleguide">Style guide</router-link>
      </nav>

      <!-- BUTTONS -->
      <section id="buttons" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Actions</span>
            <h2 class="bc-sec-title">Buttons</h2>
          </div>
        </div>
        <div class="bc-demo">
          <div class="bc-matrix">
            <div></div>
            <div v-for="v in btnVariants" :key="'h-' + v.key" class="bc-matrix-colhead">
              {{ v.label }}
            </div>

            <template v-for="s in btnStates" :key="s">
              <div class="bc-matrix-rowhead">{{ s }}</div>
              <div v-for="v in btnVariants" :key="s + '-' + v.key" class="bc-matrix-cell">
                <TfButton
                  :variant="v.variant"
                  :class="v.extraClass"
                  icon="pi-save"
                  :loading="s === 'loading'"
                  :disabled="s === 'disabled'"
                >
                  <template v-if="!v.iconOnly">Save</template>
                </TfButton>
              </div>
            </template>
          </div>

          <div class="bc-group">
            <div class="bc-label">Sizes</div>
            <div class="bc-row">
              <TfButton variant="primary" size="sm" icon="pi-save">Small</TfButton>
              <TfButton variant="primary" icon="pi-save">Medium</TfButton>
              <TfButton variant="primary" size="lg" icon="pi-save">Large</TfButton>
            </div>
          </div>
        </div>
      </section>

      <!-- FORMS -->
      <section id="forms" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Forms</span>
            <h2 class="bc-sec-title">Text inputs &amp; textarea</h2>
          </div>
        </div>
        <div class="bc-demo">
          <div class="bc-forms">
            <!-- Text inputs -->
            <div class="bc-forms-col">
              <div class="bc-forms-colhead">Text inputs</div>
              <div v-for="row in inputStates" :key="row.label" class="bc-forms-row">
                <div class="bc-forms-state">{{ row.label }}</div>
                <TfInput
                  label="E-mail address"
                  placeholder="Input your e-mail address"
                  :model-value="row.value"
                  :state="row.state"
                  :helper="row.hint"
                  :error="row.errHint"
                  :disabled="row.disabled"
                >
                  <template v-if="row.prefix" #prefix
                    ><i class="pi" :class="row.prefix"
                  /></template>
                  <template v-if="row.suffix" #suffix
                    ><i class="pi" :class="row.suffix"
                  /></template>
                </TfInput>
              </div>
            </div>

            <!-- Textarea -->
            <div class="bc-forms-col">
              <div class="bc-forms-colhead">Textarea</div>
              <div v-for="row in textareaStates" :key="row.label" class="bc-forms-row">
                <div class="bc-forms-state">{{ row.label }}</div>
                <TfTextarea
                  label="Address"
                  placeholder="Input your address"
                  :model-value="row.value"
                  :state="row.state"
                  :helper="row.hint"
                  :error="row.errHint"
                  :disabled="row.disabled"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- SELECTS -->
      <section id="selects" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Forms</span>
            <h2 class="bc-sec-title">Selects</h2>
          </div>
        </div>
        <div class="bc-demo">
          <div class="bc-selects">
            <div v-for="row in selectStates" :key="row.label" class="bc-forms-row">
              <div class="bc-forms-state">{{ row.label }}</div>
              <TfSelect
                label="Activity type"
                placeholder="Select type"
                :options="selectOptions"
                v-model="row.value"
                :helper="row.hint"
                :error="row.errHint"
                :disabled="row.disabled"
              >
                <template v-if="row.prefix" #prefix><i class="pi" :class="row.prefix" /></template>
              </TfSelect>
            </div>
          </div>
        </div>
      </section>

      <!-- NUMBER INPUTS -->
      <section id="numbers" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Forms</span>
            <h2 class="bc-sec-title">Number inputs</h2>
          </div>
        </div>
        <div class="bc-demo">
          <div class="bc-nums">
            <div v-for="n in numberInputs" :key="n.name" class="bc-num-block">
              <div class="bc-num-name">{{ n.name }}</div>
              <div class="bc-num-cols">
                <TfNumberInput
                  :type="n.type"
                  :prefix="n.prefix"
                  :precision="n.precision || 0"
                  v-model="n.value"
                />
                <TfNumberInput
                  :type="n.type"
                  :prefix="n.prefix"
                  :precision="n.precision || 0"
                  :model-value="0"
                  disabled
                  hint="This input is disabled"
                />
              </div>
            </div>

            <div class="bc-num-block">
              <div class="bc-num-name">Slider input</div>
              <div class="bc-num-slider">
                <TfSlider v-model="sliderValue" :min="0" :max="10" />
                <TfSlider
                  :model-value="4"
                  :min="0"
                  :max="10"
                  disabled
                  hint="This input is disabled"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- RADIOS / CHECKBOXES / SWITCHES -->
      <section id="choice" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Forms</span>
            <h2 class="bc-sec-title">Radios, checkboxes &amp; switches</h2>
          </div>
        </div>
        <div class="bc-demo">
          <div class="bc-choice">
            <div class="bc-choice-col">
              <div class="bc-num-name">Radio buttons</div>
              <TfRadio
                v-for="row in radioStates"
                :key="row.label"
                v-model="row.model"
                value="on"
                :disabled="row.disabled"
                >{{ row.label }}</TfRadio
              >
            </div>

            <div class="bc-choice-col">
              <div class="bc-num-name">Checkbox</div>
              <TfCheckbox
                v-for="row in checkboxStates"
                :key="row.label"
                v-model="row.checked"
                :indeterminate="!row.checked && !!row.indeterminate"
                :disabled="row.disabled"
                >{{ row.label }}</TfCheckbox
              >
            </div>

            <div class="bc-choice-col">
              <div class="bc-num-name">Switches</div>
              <TfSwitch
                v-for="row in switchStates"
                :key="row.label"
                v-model="row.checked"
                :disabled="row.disabled"
                >{{ row.label }}</TfSwitch
              >
            </div>
          </div>
        </div>
      </section>

      <!-- BADGE -->
      <section id="badges" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Status</span>
            <h2 class="bc-sec-title">Badge</h2>
          </div>
        </div>
        <div class="bc-demo">
          <div class="bc-stack-rows">
            <div class="bc-row">
              <TfBadge v-for="b in badges" :key="b.label" :tone="b.tone" dot>{{ b.label }}</TfBadge>
            </div>
            <div class="bc-row">
              <TfBadge v-for="b in badges" :key="b.label" :tone="b.tone">{{ b.label }}</TfBadge>
            </div>
          </div>
        </div>
      </section>

      <!-- CHIPS -->
      <section id="chips" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Status</span>
            <h2 class="bc-sec-title">Chips</h2>
          </div>
        </div>
        <div class="bc-demo">
          <div class="bc-stack-rows">
            <div class="bc-row">
              <TfChip>Search</TfChip>
              <TfChip selected>Search</TfChip>
            </div>
            <div class="bc-row">
              <TfChip icon="pi-search">Search</TfChip>
              <TfChip icon="pi-search" selected>Search</TfChip>
            </div>
          </div>
        </div>
      </section>

      <!-- PROGRESS -->
      <section id="progress" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Status</span>
            <h2 class="bc-sec-title">Progress</h2>
          </div>
        </div>
        <div class="bc-demo">
          <div class="bc-progress">
            <TfProgress label="Spent" :value="75" />
            <TfProgress label="Spent" :value="100" />
            <TfProgress label="Spent" :value="125" />
          </div>
        </div>
      </section>

      <!-- DATE & TIME -->
      <section id="dates" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Forms</span>
            <h2 class="bc-sec-title">Date &amp; time pickers</h2>
          </div>
        </div>
        <div class="bc-demo">
          <div class="bc-dates">
            <TfDatePicker v-model="dateVal" mode="date" label="Date" />
            <TfTimePicker v-model="timeVal" label="Time" placeholder="14:00" clearable />
            <TfDatePicker v-model="dateTimeVal" mode="datetime" label="Date time" />
            <TfDatePicker v-model="dateRangeVal" mode="range" label="Date range" />
            <TfDatePicker
              v-model="dateTimeRangeVal"
              mode="datetime-range"
              label="Date time range"
            />
            <TfDatePicker v-model="dateClearableVal" mode="date" label="Clearable" clearable />
            <TfDatePicker
              v-model="dateBoundedVal"
              mode="range"
              label="Min / max (Aug 17–25)"
              :min="new Date(2026, 7, 17)"
              :max="new Date(2026, 7, 25)"
            />
          </div>
        </div>
      </section>

      <!-- ALERTS -->
      <section id="alerts" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Feedback</span>
            <h2 class="bc-sec-title">Alerts</h2>
          </div>
        </div>
        <div class="bc-demo">
          <div class="bc-feedback">
            <TfAlert tone="success" title="Flight confirmed"
              >Your BCN → NRT booking is saved to Day 1.</TfAlert
            >
            <TfAlert tone="warning" title="Layover is tight"
              >Only 45 min in Doha — consider a later connection.</TfAlert
            >
            <TfAlert tone="danger" title="Hotel sold out" />
            <TfAlert tone="neutral" title="Tip">Book 3 months ahead for the best fares.</TfAlert>
          </div>
        </div>
      </section>

      <!-- TOASTS -->
      <section id="toasts" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Feedback</span>
            <h2 class="bc-sec-title">Toasts</h2>
          </div>
        </div>
        <div class="bc-demo">
          <div class="bc-feedback">
            <TfToast tone="success" title="Saved to Kyoto" message="Added to Day 3 · 14:00" />
            <TfToast tone="warning" title="Sync delayed" message="Retrying in the background." />
            <TfToast tone="danger" title="Upload failed" message="Check your connection." />
            <TfToast tone="neutral" title="Trip shared" message="Mara can now view & edit." />
          </div>
        </div>
      </section>

      <!-- TOOLTIP -->
      <section id="tooltip" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Overlay</span>
            <h2 class="bc-sec-title">Tooltip</h2>
          </div>
        </div>
        <div class="bc-demo">
          <div class="bc-row" style="gap: 24px">
            <TfTooltip text="Tooltip on top" position="top">
              <TfButton variant="secondary">Top</TfButton>
            </TfTooltip>
            <TfTooltip text="Tooltip on bottom" position="bottom">
              <TfButton variant="secondary">Bottom</TfButton>
            </TfTooltip>
            <TfTooltip text="Tooltip on left" position="left">
              <TfButton variant="secondary">Left</TfButton>
            </TfTooltip>
            <TfTooltip text="Tooltip on right" position="right">
              <TfButton variant="secondary">Right</TfButton>
            </TfTooltip>
          </div>
        </div>
      </section>

      <!-- MODAL -->
      <section id="modal" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Overlay</span>
            <h2 class="bc-sec-title">Modal / dialog</h2>
          </div>
        </div>
        <div class="bc-demo">
          <TfButton variant="primary" @click="modalOpen = true">Open modal</TfButton>
          <TfModal v-model="modalOpen" title="Delete trip?" subtitle="This action can't be undone.">
            <p style="margin: 0">
              You're about to delete “Japan 2026” and all its bookings. This is permanent.
            </p>
            <template #footer>
              <TfButton variant="secondary" @click="modalOpen = false">Cancel</TfButton>
              <TfButton variant="danger" @click="modalOpen = false">Delete</TfButton>
            </template>
          </TfModal>

          <TfButton variant="secondary" @click="mustAnswerOpen = true">Open · must answer</TfButton>
          <TfModal
            v-model="mustAnswerOpen"
            title="Session expired"
            subtitle="Sign in to carry on from the same page."
            size="sm"
            :dismissible="false"
          >
            <p style="margin: 0">
              No ✕, no Escape, no backdrop click — for a question the app cannot continue without.
            </p>
            <template #footer>
              <TfButton variant="ghost" @click="mustAnswerOpen = false">Sign out</TfButton>
              <TfButton variant="primary" @click="mustAnswerOpen = false">Sign in</TfButton>
            </template>
          </TfModal>
        </div>
      </section>

      <!-- ACCORDION -->
      <section id="accordion" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Navigation</span>
            <h2 class="bc-sec-title">Accordion</h2>
          </div>
        </div>
        <div class="bc-demo">
          <div style="max-width: 520px"><TfAccordion :items="accordionItems" /></div>
        </div>
      </section>

      <!-- DROPDOWN -->
      <section id="dropdown" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Navigation</span>
            <h2 class="bc-sec-title">Dropdown menu</h2>
          </div>
        </div>
        <div class="bc-demo">
          <TfDropdown :items="dropdownItems" @select="(it) => toast.info(it.label)">
            <TfButton variant="secondary" icon="pi-ellipsis-h">Actions</TfButton>
          </TfDropdown>
        </div>
      </section>

      <!-- TABLE -->
      <section id="table" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Data</span>
            <h2 class="bc-sec-title">Table</h2>
          </div>
        </div>
        <div class="bc-demo">
          <TfTable :columns="tableColumns" :rows="tableRows">
            <template #status="{ value }">
              <TfBadge :tone="value === 'Paid' ? 'success' : 'warning'" dot>{{ value }}</TfBadge>
            </template>
          </TfTable>
        </div>
      </section>

      <!-- STAT -->
      <section id="stat" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Data</span>
            <h2 class="bc-sec-title">Stat cards</h2>
          </div>
        </div>
        <div class="bc-demo">
          <div class="bc-row">
            <TfStat label="Total spent" value="€ 2,480" :delta="12" />
            <TfStat label="Bookings" value="14" :delta="-3" />
            <TfStat label="Trip days" value="21" />
          </div>
        </div>
      </section>

      <!-- AVATAR GROUP -->
      <section id="avatars" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Data</span>
            <h2 class="bc-sec-title">Avatar group</h2>
          </div>
        </div>
        <div class="bc-demo">
          <TfAvatarGroup :items="people" :max="4" />
        </div>
      </section>

      <!-- SKELETON -->
      <section id="skeleton" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Data</span>
            <h2 class="bc-sec-title">Skeleton</h2>
          </div>
        </div>
        <div class="bc-demo">
          <div style="display: flex; flex-direction: column; gap: 14px; max-width: 320px">
            <div style="display: flex; gap: 12px; align-items: center">
              <TfSkeleton variant="circle" width="44px" height="44px" />
              <div style="flex: 1; display: flex; flex-direction: column; gap: 8px">
                <TfSkeleton variant="text" width="60%" />
                <TfSkeleton variant="text" width="40%" />
              </div>
            </div>
            <TfSkeleton variant="rect" width="100%" height="120px" />
          </div>
        </div>
      </section>

      <!-- SPINNER -->
      <section id="spinner" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Feedback</span>
            <h2 class="bc-sec-title">Spinner</h2>
          </div>
        </div>
        <div class="bc-demo">
          <div class="bc-row" style="gap: 24px; align-items: center">
            <TfSpinner size="18px" />
            <TfSpinner />
            <TfSpinner size="36px" />
          </div>
        </div>
      </section>

      <!-- CONFIRM -->
      <section id="confirm" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Overlay</span>
            <h2 class="bc-sec-title">Confirm dialog</h2>
          </div>
        </div>
        <div class="bc-demo">
          <TfButton variant="danger" @click="confirmOpen = true">Delete trip</TfButton>
          <TfConfirm
            v-model="confirmOpen"
            tone="danger"
            title="Delete trip?"
            message="This permanently removes the trip and all its bookings."
            confirm-label="Delete"
            @confirm="toast.danger('Trip deleted')"
          />
        </div>
      </section>

      <!-- TOAST HOST -->
      <section id="toast-host" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Feedback</span>
            <h2 class="bc-sec-title">Toast host</h2>
          </div>
        </div>
        <div class="bc-demo">
          <div class="bc-row">
            <TfButton variant="secondary" @click="toast.success('Saved', 'Your changes are saved.')"
              >Success</TfButton
            >
            <TfButton variant="secondary" @click="toast.warning('Heads up', 'Layover is tight.')"
              >Warning</TfButton
            >
            <TfButton variant="secondary" @click="toast.danger('Failed', 'Could not save.')"
              >Danger</TfButton
            >
          </div>
        </div>
      </section>

      <!-- POPOVER -->
      <section id="popover" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Overlay</span>
            <h2 class="bc-sec-title">Popover</h2>
          </div>
        </div>
        <div class="bc-demo">
          <TfPopover position="bottom">
            <TfButton variant="secondary" icon="pi-filter">Filters</TfButton>
            <template #content>
              <div style="display: flex; flex-direction: column; gap: 6px; min-width: 200px">
                <div class="type-body-bold">Quick filters</div>
                <p class="type-small" style="margin: 0; color: var(--text-secondary)">
                  Any content fits inside a popover.
                </p>
              </div>
            </template>
          </TfPopover>
        </div>
      </section>

      <!-- MULTI-SELECT -->
      <section id="multiselect" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Forms</span>
            <h2 class="bc-sec-title">Multi-select</h2>
          </div>
        </div>
        <div class="bc-demo">
          <div style="max-width: 340px">
            <TfMultiSelect
              v-model="multiVal"
              :options="multiOptions"
              label="Interests"
              placeholder="Pick a few"
            />
          </div>
        </div>
      </section>

      <!-- FILE UPLOAD -->
      <section id="upload" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Forms</span>
            <h2 class="bc-sec-title">File upload</h2>
          </div>
        </div>
        <div class="bc-demo">
          <div style="display: flex; flex-direction: column; gap: 24px; max-width: 380px">
            <TfFileUpload label="Full" hint="PNG, JPG or PDF up to 5MB" multiple />
            <TfFileUpload label="Compact" variant="compact" hint="PNG, JPG or PDF" multiple />
          </div>
        </div>
      </section>

      <!-- RATING -->
      <section id="rating" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Forms</span>
            <h2 class="bc-sec-title">Rating</h2>
          </div>
        </div>
        <div class="bc-demo">
          <TfRating v-model="ratingVal" />
        </div>
      </section>

      <!-- DRAWERS -->
      <section id="drawers" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Overlay</span>
            <h2 class="bc-sec-title">Side drawer</h2>
          </div>
        </div>
        <div class="bc-demo">
          <div class="bc-row">
            <TfButton variant="secondary" icon="pi-arrow-right" @click="drawerRight = true"
              >Open right</TfButton
            >
            <TfButton variant="secondary" icon="pi-arrow-left" @click="drawerLeft = true"
              >Open left</TfButton
            >
          </div>

          <TfDrawer v-model="drawerRight" eyebrow="Booking" title="Flight details">
            <TfDrawerSection label="Route">
              <p class="type-small" style="margin: 0; color: var(--text-secondary)">
                Barcelona (BCN) → Tokyo (NRT), 17 Aug 2026.
              </p>
            </TfDrawerSection>
            <TfDrawerSection label="Passengers">
              <TfInput label="Lead traveller" model-value="Mara Ortiz" />
              <TfSelect
                label="Seat"
                :options="['Aisle', 'Window', 'Middle']"
                model-value="Window"
              />
            </TfDrawerSection>
            <template #footer>
              <TfButton variant="ghost" @click="drawerRight = false">Cancel</TfButton>
              <TfButton variant="primary" @click="drawerRight = false">Save</TfButton>
            </template>
          </TfDrawer>

          <TfDrawer v-model="drawerLeft" position="left" width="narrow" title="Filters">
            <TfDrawerSection label="Status">
              <TfCheckbox :model-value="true">Confirmed</TfCheckbox>
              <TfCheckbox :model-value="false">Pending</TfCheckbox>
            </TfDrawerSection>
            <TfDrawerSection label="Budget">
              <TfSlider :model-value="60" :min="0" :max="100" />
            </TfDrawerSection>
          </TfDrawer>
        </div>
      </section>

      <!-- LIGHTBOX -->
      <section id="lightbox" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Overlay</span>
            <h2 class="bc-sec-title">Lightbox</h2>
          </div>
        </div>
        <div class="bc-demo">
          <div class="photo-grid" style="max-width: 340px">
            <button
              v-for="(url, i) in demoPhotos"
              :key="url"
              type="button"
              class="photo-thumb"
              @click="openLightbox(i)"
            >
              <img :src="url" alt="" />
            </button>
          </div>
          <TfLightbox
            v-model="lightboxOpen"
            :photos="demoPhotos"
            :index="lightboxIndex"
            caption="Sagrada Família"
            @update:index="(i) => (lightboxIndex = i)"
          />
        </div>
      </section>

      <!-- PDF VIEWER -->
      <section id="pdf" class="bc-block">
        <div class="bc-sec-head">
          <div>
            <span class="tf-eyebrow">Data</span>
            <h2 class="bc-sec-title">PDF viewer</h2>
          </div>
        </div>
        <div class="bc-demo">
          <div style="max-width: 520px; height: 460px">
            <TfPdfViewer :source="pdfBlob" title="Sample document" />
          </div>
        </div>
      </section>
    </div>

    <TfToastHost />

    <footer class="bc-footer">
      <div class="bc-wrap">
        <span
          style="
            font: var(--fw-bold) var(--text-lg)/1 var(--font-display);
            color: var(--text-primary);
          "
          >Tripyfull</span
        >
        <router-link
          to="/styleguide"
          style="font: var(--fw-medium) var(--text-sm)/1 var(--font-sans); color: var(--text-link)"
          >Style guide</router-link
        >
        <span class="text-xs" style="font-family: var(--font-mono); color: var(--text-secondary)"
          >Components 2026</span
        >
      </div>
    </footer>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import {
  TfButton,
  TfInput,
  TfTextarea,
  TfSelect,
  TfNumberInput,
  TfSlider,
  TfRadio,
  TfCheckbox,
  TfSwitch,
  TfBadge,
  TfChip,
  TfProgress,
  TfDatePicker,
  TfTimePicker,
  TfAlert,
  TfToast,
  TfTooltip,
  TfModal,
  TfConfirm,
  TfToastHost,
  TfAccordion,
  TfDropdown,
  TfPopover,
  TfTable,
  TfStat,
  TfAvatarGroup,
  TfSkeleton,
  TfSpinner,
  TfMultiSelect,
  TfFileUpload,
  TfRating,
  TfPdfViewer,
  TfDrawer,
  TfDrawerSection,
  TfLightbox,
  toast,
} from '@tripyfull/ui';

const btnStates = ['default', 'disabled', 'loading'];
const btnVariants = [
  { key: 'primary', label: 'Primary', variant: 'primary' },
  { key: 'secondary', label: 'Secondary', variant: 'secondary' },
  { key: 'ghost', label: 'Ghost', variant: 'ghost' },
  { key: 'danger', label: 'Danger', variant: 'danger' },
  { key: 'icon', label: 'Icon', variant: 'secondary', extraClass: 'btn--icon', iconOnly: true },
];

const inputStates = [
  { label: 'Default', hint: 'Use your private email address' },
  { label: 'Prepend Icon', prefix: 'pi-info-circle' },
  { label: 'Append Element', suffix: 'pi-check' },
  { label: 'Filled', value: 'test@email.com' },
  {
    label: 'Error',
    value: 'test@emailcom',
    errHint: "E-mail address doesn't have correct format",
  },
  { label: 'Disabled', disabled: true },
];
const textareaStates = [
  { label: 'Default', hint: 'Use your private address' },
  { label: 'Filled', value: 'Mile street 4, 50000 New York' },
  {
    label: 'Error',
    value: '+123456789',
    errHint: "Address doesn't have correct format",
  },
  { label: 'Disabled', disabled: true },
];

const selectOptions = ['Sightseeing', 'Museum', 'Beach'];
const selectStates = reactive([
  { label: 'Default', value: '', hint: 'Select your activity type' },
  { label: 'Prepend icon', value: '', prefix: 'pi-info-circle' },
  { label: 'Selected', value: 'Museum' },
  { label: 'Error', value: 'Museum', errHint: 'Activity type is unavailable' },
  { label: 'Disabled', value: '', disabled: true },
]);

const numberInputs = reactive([
  { name: 'Split input', type: 'split', value: 0 },
  { name: 'Stacked input', type: 'stacked', value: 26 },
  { name: 'Plain input', type: 'plain', value: 67 },
  { name: 'Currency input', type: 'plain', prefix: '€', precision: 2, value: 67.5 },
]);
const sliderValue = ref(3);

const radioStates = reactive([
  { label: 'Default', model: '' },
  { label: 'Selected', model: 'on' },
  { label: 'Disabled', model: '', disabled: true },
  { label: 'Selected but disabled', model: 'on', disabled: true },
]);
const checkboxStates = reactive([
  { label: 'Checked', checked: true },
  { label: 'Indeterminate', checked: false, indeterminate: true },
  { label: 'Default', checked: false },
  { label: 'Disabled', checked: false, disabled: true },
  { label: 'Selected but disabled', checked: true, disabled: true },
]);
const switchStates = reactive([
  { label: 'Default', checked: false },
  { label: 'Selected', checked: true },
  { label: 'Disabled', checked: false, disabled: true },
  { label: 'Selected but disabled', checked: true, disabled: true },
]);

const dateVal = ref(new Date(2026, 7, 17));
const timeVal = ref('09:30');
const dateTimeVal = ref(new Date(2026, 6, 15, 14, 15));
const dateRangeVal = ref([new Date(2026, 7, 17), new Date(2026, 7, 25)]);
const dateTimeRangeVal = ref([new Date(2026, 7, 17, 14, 15), new Date(2026, 7, 25, 14, 15)]);
const dateClearableVal = ref(new Date(2026, 7, 17));
const dateBoundedVal = ref(null);
const modalOpen = ref(false);
const mustAnswerOpen = ref(false);
const confirmOpen = ref(false);
const lightboxOpen = ref(false);
const lightboxIndex = ref(0);
// Inline SVG data URIs: the styleguide must render with no network at all.
const demoPhotos = ['#e8734a', '#2f7d72', '#d9a53b'].map(
  (c) =>
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="${c}"/><circle cx="400" cy="300" r="150" fill="rgba(255,255,255,.35)"/></svg>`,
    ),
);
const openLightbox = (i) => {
  lightboxIndex.value = i;
  lightboxOpen.value = true;
};
const drawerRight = ref(false);
const drawerLeft = ref(false);
const ratingVal = ref(3);
const multiVal = ref(['Museums', 'Food']);
const multiOptions = ['Museums', 'Food', 'Nature', 'Nightlife', 'Beaches', 'Shopping'];

const SAMPLE_PDF = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 320 180] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 54 >>
stream
BT /F1 20 Tf 28 92 Td (Tripyfull PDF preview) Tj ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
trailer
<< /Root 1 0 R >>
%%EOF`;
const pdfBlob = new Blob([SAMPLE_PDF], { type: 'application/pdf' });

const accordionItems = [
  { title: 'What is included?', text: 'Flights, hotels and daily activities in one itinerary.' },
  { title: 'Can I change dates?', text: 'Yes — edit any booking and we re-slot the plan for you.' },
  { title: 'Refund policy', text: 'Free cancellation up to 48 hours before departure.' },
];
const dropdownItems = [
  { label: 'Edit', icon: 'pi-pencil' },
  { label: 'Duplicate', icon: 'pi-copy' },
  { label: 'Share', icon: 'pi-share-alt' },
  { divider: true },
  { label: 'Delete', icon: 'pi-trash', danger: true },
];
const tableColumns = [
  { key: 'trip', label: 'Trip' },
  { key: 'date', label: 'Date' },
  { key: 'status', label: 'Status' },
  { key: 'total', label: 'Total', align: 'right' },
];
const tableRows = [
  { trip: 'Kyoto → Tokyo', date: '17.08.2026', status: 'Paid', total: '€ 820' },
  { trip: 'Barcelona', date: '02.09.2026', status: 'Pending', total: '€ 460' },
  { trip: 'Reykjavík', date: '20.10.2026', status: 'Paid', total: '€ 1,240' },
];
const people = [
  { initials: 'MO', bg: 'var(--danger-100)', fg: 'var(--danger-700)' },
  { initials: 'KS', bg: 'var(--success-100)', fg: 'var(--success-700)' },
  { initials: 'AL', bg: 'var(--warning-100)', fg: 'var(--warning-700)' },
  { initials: 'JD', bg: 'var(--ink-200)', fg: 'var(--ink-700)' },
  { initials: 'RP', bg: 'var(--ink-200)', fg: 'var(--ink-700)' },
  { initials: 'TM', bg: 'var(--ink-200)', fg: 'var(--ink-700)' },
];

const badges = [
  { tone: 'success', label: 'Paid' },
  { tone: 'danger', label: 'Due soon' },
  { tone: 'warning', label: 'Overdue' },
  { tone: 'neutral', label: 'Neutral' },
  { tone: 'contrast', label: 'Contrast' },
];
</script>

<style scoped>
.bc {
  background: var(--bg);
  min-height: 100vh;
}

.bc-wrap {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 var(--gutter);
}

/* Nav */
.bc-nav {
  position: sticky;
  top: 0;
  z-index: 30;
  background: rgba(251, 245, 236, 0.88);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-default);
  padding: 12px var(--gutter);
  max-width: 1080px;
  margin: 0 auto;
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}
.bc-nav a {
  font: var(--fw-medium) var(--text-sm)/1 var(--font-sans);
  color: var(--text-secondary);
  text-decoration: none;
}
.bc-nav a:hover {
  color: var(--accent);
}

/* Sections */
.bc-block {
  padding: 56px 0 8px;
  border-top: 1px solid var(--border-default);
}
.bc-block:first-of-type {
  border-top: none;
}
.bc-sec-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
}
.bc-sec-title {
  font: var(--fw-bold) var(--text-xl)/1.05 var(--font-display);
  letter-spacing: -0.02em;
  color: var(--text-primary);
  margin: 10px 0 0;
}

/* Demo area */
.bc-demo {
  background: var(--card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 28px;
}
.bc-row {
  display: flex;
  gap: 14px;
  align-items: center;
  flex-wrap: wrap;
}
.bc-label {
  font: var(--fw-medium) var(--text-2xs)/1 var(--font-mono);
  letter-spacing: var(--ls-caps);
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 12px;
}
.bc-group {
  margin-top: 28px;
}

/* Button state matrix */
.bc-matrix {
  display: grid;
  grid-template-columns: auto repeat(5, minmax(0, 1fr));
  gap: 18px 16px;
  align-items: center;
  overflow-x: auto;
}
.bc-matrix-colhead {
  font: var(--fw-medium) var(--text-2xs)/1 var(--font-mono);
  letter-spacing: var(--ls-caps);
  text-transform: uppercase;
  color: var(--ink-500);
  text-align: center;
}
.bc-matrix-rowhead {
  font: var(--fw-semibold) var(--text-sm)/1 var(--font-sans);
  color: var(--text-secondary);
  text-align: right;
  padding-right: 4px;
  white-space: nowrap;
}
.bc-matrix-cell {
  display: flex;
  justify-content: center;
}

/* Input & textarea state matrix */
.bc-forms {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px 40px;
}
@media (max-width: 900px) {
  .bc-forms {
    grid-template-columns: 1fr;
  }
}
.bc-forms-col {
  display: flex;
  flex-direction: column;
  gap: 22px;
}
.bc-forms-colhead {
  font: var(--fw-medium) var(--text-2xs)/1 var(--font-mono);
  letter-spacing: var(--ls-caps);
  text-transform: uppercase;
  color: var(--ink-500);
}
.bc-forms-row {
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: 16px;
  align-items: center;
}
.bc-forms-state {
  font: var(--fw-medium) var(--text-2xs)/1.3 var(--font-mono);
  letter-spacing: var(--ls-caps);
  text-transform: uppercase;
  color: var(--ink-500);
  text-align: right;
}

/* Select state list */
.bc-selects {
  display: flex;
  flex-direction: column;
  gap: 22px;
  max-width: 480px;
}
.bc-selects .bc-forms-row {
  align-items: start;
}

/* Number inputs */
.bc-nums {
  display: flex;
  flex-direction: column;
  gap: 32px;
  max-width: 460px;
}
.bc-num-name {
  font: var(--fw-semibold) var(--text-md)/1.2 var(--font-sans);
  color: var(--text-primary);
  margin-bottom: 12px;
}
.bc-num-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: start;
}
.bc-num-slider {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Radios / checkboxes / switches */
.bc-choice {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
}
@media (max-width: 760px) {
  .bc-choice {
    grid-template-columns: 1fr;
  }
}
.bc-choice-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: flex-start;
}

/* Badge / chip rows */
.bc-stack-rows {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Progress */
.bc-progress {
  display: flex;
  flex-direction: column;
  gap: 22px;
  max-width: 420px;
}

/* Feedback (alerts / toasts) */
.bc-feedback {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 420px;
}

/* Date & time pickers */
.bc-dates {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px 32px;
  max-width: 680px;
  align-items: start;
}
@media (max-width: 720px) {
  .bc-dates {
    grid-template-columns: 1fr;
  }
}

/* Footer */
.bc-footer {
  padding: 48px var(--gutter) 72px;
  border-top: 1px solid var(--border-default);
  margin-top: 48px;
}
.bc-footer .bc-wrap {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1080px;
  margin: 0 auto;
}
</style>
