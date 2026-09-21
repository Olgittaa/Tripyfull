<template>
  <div class="page-content page-content--full">
    <!-- Page head -->
    <div class="page-head">
      <div>
        <h1>{{ t('bookings.title') }}</h1>
        <p>{{ t('bookings.subtitle') }}</p>
      </div>
      <div class="page-head-actions" data-tour="booking-actions">
        <TfButton variant="primary" @click="openAddDialog">
          <i class="pi pi-plus" style="font-size: 14px"></i> {{ t('bookings.booking') }}
        </TfButton>
        <!-- Bookings already say what is booked and when; this writes them into
             the plan, and writes them again after a booking changes. -->
        <TfButton
          variant="secondary"
          @click="syncPlan"
          :disabled="syncingPlan || !bookings.length"
          v-tooltip="plannedFromBookings ? t('bookings.rewriteHint') : t('bookings.addToPlanHint')"
        >
          <i
            class="pi pi-calendar-plus"
            :style="syncingPlan ? 'animation:spin 1s linear infinite' : ''"
            style="font-size: 14px"
          ></i>
          <!-- "Update plan" spelled out where there is room, "Plan" on a phone. -->
          <span class="phone-hide">{{ planLabel }}</span>
          <span class="phone-only">{{
            syncingPlan ? t('bookings.planning') : t('bookings.planShort')
          }}</span>
        </TfButton>
        <TfButton
          class="phone-icon-btn"
          variant="secondary"
          :aria-label="t('bookings.updateRatesAria')"
          @click="refreshAllRates"
          :disabled="refreshingRates"
        >
          <i
            class="pi pi-sync"
            :style="refreshingRates ? 'animation:spin 1s linear infinite' : ''"
            style="font-size: 14px"
          ></i>
          <span class="phone-hide">{{
            refreshingRates ? t('bookings.updatingRates') : t('bookings.updateRates')
          }}</span>
        </TfButton>
      </div>
    </div>

    <div v-if="loading" style="display: flex; flex-direction: column; gap: 20px">
      <div class="skeleton" style="height: 140px"></div>
      <div class="skeleton" style="height: 140px"></div>
    </div>

    <template v-else>
      <div class="bookings-layout">
        <div class="bookings-main">
          <!-- Grouped bookings by category -->
          <div style="display: flex; flex-direction: column; gap: 28px">
            <div v-for="group in bookingGroups" :key="group.cat">
              <div class="booking-group-header">
                <div class="cat-icon cat-icon--md" :style="catIconStyle(group.cat)">
                  {{ catEmoji(group.cat) }}
                </div>
                <h3>{{ group.label }}</h3>
                <span class="booking-group-count">{{ group.items.length }}</span>
              </div>
              <div style="display: flex; flex-direction: column; gap: 12px">
                <TfCard
                  v-for="b in group.items"
                  :key="b.id"
                  interactive
                  @click="openDetails(b)"
                  style="cursor: pointer"
                >
                  <div class="booking-card-content">
                    <div
                      class="cat-icon cat-icon--xl"
                      :style="catIconStyle(b.category)"
                      v-tooltip="bookingIconTitle(b)"
                    >
                      {{ bookingEmoji(b) }}
                    </div>
                    <div class="booking-card-info">
                      <div class="booking-card-title">
                        <span>{{ b.name }}</span>
                        <TfBadge :tone="payStatusTone(b)" variant="soft" dot>{{
                          payStatusLabel(b)
                        }}</TfBadge>
                        <span
                          v-if="b.attachments && b.attachments.length"
                          style="
                            display: inline-flex;
                            align-items: center;
                            gap: 3px;
                            font: var(--fw-medium) 11px/1 var(--font-mono);
                            color: var(--text-secondary);
                          "
                          v-tooltip="t('bookings.attachments')"
                        >
                          <i class="pi pi-paperclip" style="font-size: 11px"></i
                          >{{ b.attachments.length }}
                        </span>
                      </div>
                      <div class="booking-card-meta">
                        {{ b.vendor || '' }}{{ b.vendor && bookingMeta(b) ? ' · ' : ''
                        }}{{ bookingMeta(b) }}
                      </div>
                      <div v-if="nextPayment(b)" class="booking-card-next-pay">
                        {{
                          t('bookings.nextPayment', {
                            amount: nextPayment(b).amount,
                            currency: b.priceCurrency || currency,
                            date: formatDateShort(nextPayment(b).dueDate),
                          })
                        }}
                      </div>
                    </div>
                    <div class="booking-card-price">
                      <span class="money money--md">{{ dualPrice(b) }}</span>
                      <div class="booking-card-price-label">{{ t('bookings.fullPriceLabel') }}</div>
                    </div>
                  </div>
                </TfCard>
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div v-if="!bookings.length" class="empty-state">
            <div class="empty-state-icon"><i class="pi pi-ticket"></i></div>
            <h3>{{ t('bookings.empty') }}</h3>
            <p>{{ t('bookings.emptySub') }}</p>
            <TfButton variant="primary" @click="openAddDialog">
              <i class="pi pi-plus" style="font-size: 14px"></i> {{ t('bookings.addBooking') }}
            </TfButton>
          </div>
        </div>

        <!-- The right rail carries one thing at a time: the totals, or the
             booking you opened — same idea as the place details panel. -->
        <aside v-if="bookings.length" class="bookings-side">
          <TfCard>
            <div class="side-title">{{ t('bookings.money') }}</div>
            <div class="side-total money money--lg">{{ money(stats.total) }}</div>
            <TfProgress :label="t('bookings.paid')" :value="stats.paidShare" />
            <div class="side-row">
              <span>{{ t('bookings.paid') }}</span>
              <span class="side-val">{{ money(stats.paid) }}</span>
            </div>
            <div class="side-row">
              <span>{{ t('bookings.leftToPay') }}</span>
              <span class="side-val">{{ money(stats.left) }}</span>
            </div>
          </TfCard>

          <TfCard>
            <div class="side-title">{{ t('bookings.byCategory') }}</div>
            <div v-for="c in stats.byCat" :key="c.cat" class="side-cat">
              <div class="side-row">
                <span>{{ catEmoji(c.cat) }} {{ c.label }}</span>
                <span class="side-val">{{ money(c.sum) }}</span>
              </div>
              <div class="side-bar">
                <span :style="{ width: c.share + '%', background: c.color }"></span>
              </div>
              <div class="side-sub">
                {{ t('bookings.catCount', { count: c.n }) }} · {{ Math.round(c.share) }}%
              </div>
            </div>
          </TfCard>

          <TfCard>
            <div class="side-title">{{ t('bookings.status') }}</div>
            <div class="side-row">
              <span>{{ t('bookings.paidInFull') }}</span>
              <span class="side-val">{{ stats.status.paid }}</span>
            </div>
            <div class="side-row">
              <span>{{ t('bookings.partlyPaid') }}</span>
              <span class="side-val">{{ stats.status.partial }}</span>
            </div>
            <div class="side-row">
              <span>{{ t('bookings.notPaid') }}</span>
              <span class="side-val">{{ stats.status.unpaid }}</span>
            </div>
            <div v-if="tripNights" class="side-row">
              <span>{{ t('bookings.nightsBooked') }}</span>
              <span class="side-val">{{ stats.nights }} / {{ tripNights }}</span>
            </div>
          </TfCard>

          <TfCard v-if="upcomingPayments.length">
            <div class="side-title">{{ t('bookings.nextPayments') }}</div>
            <div v-for="p in upcomingPayments" :key="p.id" class="side-pay">
              <div class="side-row">
                <span class="side-pay-name">{{ p.bookingName }}</span>
                <span class="side-val">{{ p.amount }} {{ p.currency }}</span>
              </div>
              <div class="side-sub">{{ formatDateShort(p.dueDate) }}</div>
            </div>
          </TfCard>
        </aside>
        <!-- One drawer for both modes: same side, same width, same sections —
             switching to edit turns values into fields and moves nothing else. -->
        <TfDrawer
          v-model="showDrawer"
          wide
          :title="
            drawerMode === 'view'
              ? viewing?.name
              : editingBooking
                ? t('bookings.edit')
                : t('bookings.new')
          "
        >
          <!-- One template for both modes. Viewing renders the editor with its
               controls disabled and styled as values, so a field sits in the same
               place whichever way you look at it. Payments and attachments stay
               live either way: ticking off an instalment is bookkeeping, not editing.

               Three tabs split what used to be one long scroll: what is booked,
               what it costs, and the paperwork. Each tab counts the required
               fields still empty, so the form says where it is incomplete
               instead of failing on Save. -->
          <form :class="{ 'form-readonly': ro }" @submit.prevent="saveBooking">
            <!-- The class rides the tab strip itself: its 2px rule then spans the
                 panel like the header's and the footer's, instead of floating
                 16px short of both edges inside a wrapper. -->
            <TfTabs v-model="tab" :items="tabItems" class="booking-tabs" />

            <!-- ============ 1. Booking: what and where ============ -->
            <template v-if="tab === 'booking'">
              <fieldset class="form-part" :disabled="ro">
                <TfDrawerSection :label="t('bookings.whatIsBooked')">
                  <TfInput
                    v-model="form.name"
                    :label="t('bookings.name')"
                    required
                    :error="fieldError('name')"
                    :placeholder="t('bookings.namePlaceholder')"
                  />
                  <div class="field">
                    <label class="label"
                      >{{ t('bookings.category')
                      }}<span class="label-req" aria-hidden="true">*</span></label
                    >
                    <TfSegmentedControl v-model="categoryLabel" :options="categoryOptions" fill />
                    <span v-if="fieldError('category')" class="hint hint--error">{{
                      fieldError('category')
                    }}</span>
                    <span v-else-if="!form.category && !ro" class="hint">{{
                      t('bookings.pickCategory')
                    }}</span>
                  </div>
                </TfDrawerSection>

                <!-- Transport: route -->
                <TfDrawerSection
                  v-if="form.category === 'TRANSPORTATION'"
                  :label="t('bookings.route')"
                >
                  <TfSelect
                    v-model="transportModeName"
                    :label="t('bookings.transportMode')"
                    required
                    :error="fieldError('transportMode')"
                    :options="transportOptions"
                    :placeholder="t('bookings.select')"
                  />
                  <div class="two-col">
                    <div class="field">
                      <label class="label"
                        >{{ isRental ? t('bookings.pickUpLocation') : t('bookings.from')
                        }}<span class="label-req" aria-hidden="true">*</span></label
                      >
                      <TfPlaceSearch
                        v-if="FEATURES.geoPlaceSearch"
                        v-model="form.fromPlace"
                        :error="fieldError('fromPlace')"
                        :placeholder="
                          form.transportMode === 'FLIGHT'
                            ? t('bookings.airportOrCityFrom')
                            : t('bookings.departureCity')
                        "
                        @select="onFromSelect"
                      />
                      <input
                        v-else
                        class="input"
                        :class="{ 'is-error': fieldError('fromPlace') }"
                        v-model="form.fromPlace"
                        :placeholder="t('bookings.departureCity')"
                      />
                      <span v-if="fieldError('fromPlace')" class="hint hint--error">{{
                        fieldError('fromPlace')
                      }}</span>
                    </div>
                    <div class="field" v-if="!isRental || !sameDropOff">
                      <label class="label"
                        >{{ isRental ? t('bookings.dropOffLocation') : t('bookings.to')
                        }}<span v-if="!isRental" class="label-req" aria-hidden="true"
                          >*</span
                        ></label
                      >
                      <TfPlaceSearch
                        v-if="FEATURES.geoPlaceSearch"
                        v-model="form.toPlace"
                        :error="fieldError('toPlace')"
                        :placeholder="
                          form.transportMode === 'FLIGHT'
                            ? t('bookings.airportOrCityTo')
                            : t('bookings.arrivalCity')
                        "
                        @select="onToSelect"
                      />
                      <input
                        v-else
                        class="input"
                        :class="{ 'is-error': fieldError('toPlace') }"
                        v-model="form.toPlace"
                        :placeholder="t('bookings.arrivalCity')"
                      />
                      <span v-if="fieldError('toPlace')" class="hint hint--error">{{
                        fieldError('toPlace')
                      }}</span>
                    </div>
                  </div>
                  <label v-if="isRental" class="paid-row" style="padding: 8px 12px">
                    <input type="checkbox" v-model="sameDropOff" :disabled="ro" />
                    <span class="paid-row-text">{{ t('bookings.sameDropOff') }}</span>
                  </label>
                  <!-- One control for the whole journey: date and time at both ends. -->
                  <TfDatePicker
                    v-model="travelRange"
                    mode="datetime-range"
                    :label="isRental ? t('bookings.pickupDropoff') : t('bookings.departureArrival')"
                    :view-date="stayMinDate"
                    clearable
                  />
                  <p v-if="formDurationMin" class="hint" style="margin: -2px 0 0">
                    {{
                      isRental
                        ? t('bookings.rentalFor', { days: rentalDays })
                        : t('bookings.onTheWay', { duration: formatDuration(formDurationMin) })
                    }}
                  </p>

                  <BookingMap v-if="FEATURES.geoPlaceSearch" :markers="transportMarkers" />

                  <!-- Per-mode extras: only what the ticket actually has on it. -->
                  <div v-if="form.transportMode === 'FLIGHT'" class="three-col">
                    <TfInput
                      v-model="form.flightNumber"
                      :label="t('bookings.flightNo')"
                      placeholder="QR305"
                    />
                    <TfInput
                      v-model="form.departureTerminal"
                      :label="t('bookings.depTerminal')"
                      placeholder="—"
                    />
                    <TfInput
                      v-model="form.arrivalTerminal"
                      :label="t('bookings.arrTerminal')"
                      placeholder="—"
                    />
                  </div>
                  <TfInput
                    v-if="form.transportMode === 'FLIGHT'"
                    v-model="form.seat"
                    :label="t('bookings.seat')"
                    :placeholder="t('bookings.seatPlaceholder')"
                  />
                  <div
                    v-if="form.transportMode === 'TRAIN' || form.transportMode === 'BUS'"
                    class="two-col"
                  >
                    <TfInput
                      v-model="form.flightNumber"
                      :label="
                        form.transportMode === 'TRAIN'
                          ? t('bookings.trainNumber')
                          : t('bookings.service')
                      "
                      :placeholder="
                        form.transportMode === 'TRAIN'
                          ? t('bookings.trainNoPlaceholder')
                          : t('bookings.servicePlaceholder')
                      "
                    />
                    <TfInput
                      v-model="form.seat"
                      :label="
                        form.transportMode === 'TRAIN'
                          ? t('bookings.coachSeat')
                          : t('bookings.seat')
                      "
                      :placeholder="
                        form.transportMode === 'TRAIN'
                          ? t('bookings.coachSeatPlaceholder')
                          : t('bookings.busSeatPlaceholder')
                      "
                    />
                  </div>
                  <div v-if="form.transportMode === 'FERRY'" class="two-col">
                    <TfInput
                      v-model="form.vesselName"
                      :label="t('bookings.vesselName')"
                      :placeholder="t('bookings.vesselPlaceholder')"
                    />
                    <TfInput
                      v-model="form.cabin"
                      :label="t('bookings.cabin')"
                      :placeholder="t('bookings.cabinPlaceholder')"
                    />
                  </div>
                  <TfInput
                    v-if="form.transportMode === 'CAR_RENTAL'"
                    v-model="form.carClass"
                    :label="t('bookings.carClass')"
                    :placeholder="t('bookings.carClassPlaceholder')"
                  />
                </TfDrawerSection>

                <!-- Accommodation: property + city + dates -->
                <TfDrawerSection
                  v-if="form.category === 'ACCOMMODATION'"
                  :label="t('bookings.stay')"
                >
                  <div v-if="FEATURES.geoPlaceSearch && !ro" class="field">
                    <label class="label">{{ t('bookings.findProperty') }}</label>
                    <TfPlaceSearch
                      v-model="hotelSearchText"
                      :placeholder="t('bookings.propertyPlaceholder')"
                      @select="onHotelSelect"
                    />
                    <span class="hint">{{ t('bookings.propertyHint') }}</span>
                  </div>
                  <BookingMap v-if="FEATURES.geoPlaceSearch" :markers="placeMarkers" />
                  <div class="field">
                    <label class="label"
                      >{{ t('bookings.city')
                      }}<span class="label-req" aria-hidden="true">*</span></label
                    >
                    <TfCitySearch
                      v-model="form.accommodationCity"
                      :error="fieldError('accommodationCity')"
                      :placeholder="t('bookings.cityPlaceholder')"
                    />
                    <span v-if="fieldError('accommodationCity')" class="hint hint--error">{{
                      fieldError('accommodationCity')
                    }}</span>
                  </div>
                  <TfInput
                    v-model="form.address"
                    :label="t('bookings.address')"
                    :placeholder="t('bookings.addressPlaceholder')"
                    :helper="ro ? '' : t('bookings.addressHelper')"
                  />
                  <TfDatePicker
                    v-model="stayDateRange"
                    mode="range"
                    :label="t('bookings.checkInOut')"
                    required
                    :error="fieldError('stay')"
                    :min="stayMinDate"
                    :max="stayMaxDate"
                    :view-date="stayMinDate"
                    clearable
                  />
                  <p v-if="tripStartDate || formNights" class="hint" style="margin: -2px 0 0">
                    <template v-if="formNights"
                      >{{ t('bookings.nights', { count: formNights })
                      }}<template v-if="formPricePerNight">
                        ·
                        {{
                          t('bookings.perNight', {
                            price: formPricePerNight.toFixed(2),
                            currency: form.priceCurrency || currency,
                          })
                        }}</template
                      ></template
                    >
                    <template v-if="formNights && tripStartDate"> · </template>
                    <template v-if="tripStartDate">{{
                      t('bookings.tripDates', {
                        from: formatDateShort(tripStartDate),
                        to: formatDateShort(tripEndDate),
                      })
                    }}</template>
                  </p>
                  <div class="two-col">
                    <TfTimePicker
                      v-model="form.checkInTime"
                      :label="t('bookings.checkInTime')"
                      placeholder="14:00"
                      clearable
                    />
                    <TfTimePicker
                      v-model="form.checkOutTime"
                      :label="t('bookings.checkOutTime')"
                      placeholder="11:00"
                      clearable
                    />
                  </div>
                  <div class="two-col">
                    <TfInput
                      v-model="form.roomType"
                      :label="t('bookings.roomType')"
                      :placeholder="t('bookings.roomTypePlaceholder')"
                    />
                    <TfNumberInput
                      v-model="form.guests"
                      type="plain"
                      :label="t('bookings.guests')"
                      :min="1"
                    />
                  </div>
                </TfDrawerSection>

                <!-- Activity: optional location -->
                <TfDrawerSection
                  v-if="form.category === 'ACTIVITY'"
                  :label="t('bookings.whenWhere')"
                >
                  <!-- The same one-control range transport uses: a booked tour has
                       a start and an end, and with them the plan knows its day. -->
                  <TfDatePicker
                    v-model="travelRange"
                    mode="datetime-range"
                    :label="t('bookings.startsEnds')"
                    :view-date="stayMinDate"
                    clearable
                  />
                  <p v-if="formDurationMin || !ro" class="hint" style="margin: -2px 0 0">
                    <template v-if="formDurationMin">{{
                      t('bookings.takes', { duration: formatDuration(formDurationMin) })
                    }}</template>
                    <template v-else>{{ t('bookings.withDateHint') }}</template>
                  </p>
                  <div class="field">
                    <label class="label">{{ t('bookings.where') }}</label>
                    <TfPlaceSearch
                      v-if="FEATURES.geoPlaceSearch"
                      v-model="form.fromPlace"
                      :placeholder="t('bookings.wherePlaceholder')"
                      @select="onActivityLocationSelect"
                    />
                    <input
                      v-else
                      class="input"
                      v-model="form.fromPlace"
                      :placeholder="t('bookings.wherePlaceholder')"
                    />
                    <span v-if="!ro" class="hint">{{ t('bookings.whereHint') }}</span>
                  </div>
                  <BookingMap v-if="FEATURES.geoPlaceSearch" :markers="placeMarkers" />
                </TfDrawerSection>
              </fieldset>
            </template>

            <!-- ============ 2. Price: what it costs, what is paid ============ -->
            <template v-else-if="tab === 'price'">
              <TfDrawerSection :label="t('bookings.price')">
                <fieldset class="form-part" :disabled="ro">
                  <div class="two-col two-col--wide-left">
                    <TfNumberInput
                      v-model="form.fullPrice"
                      type="plain"
                      :label="t('bookings.fullPrice')"
                      required
                      :error="fieldError('fullPrice')"
                      :precision="2"
                    />
                    <TfSelect
                      v-model="form.priceCurrency"
                      :label="t('bookings.currency')"
                      :options="currencySelectOptions"
                      placeholder="EUR"
                      @update:modelValue="onCurrencyChange"
                    />
                  </div>
                  <div v-if="showExchangeRate" class="rate-box">
                    <div style="flex: 1">
                      <div class="rate-label">
                        {{ t('bookings.rateQuestion', { from: form.priceCurrency, to: currency }) }}
                      </div>
                      <div class="rate-value">
                        {{ form.exchangeRate ? Number(form.exchangeRate).toFixed(4) : '—' }}
                        <span class="rate-unit">{{ currency }}</span>
                      </div>
                      <div v-if="form.fullPrice && form.exchangeRate" class="hint">
                        {{
                          t('bookings.approx', {
                            amount: Number(form.fullPrice).toFixed(2),
                            from: form.priceCurrency,
                            converted: (Number(form.fullPrice) * Number(form.exchangeRate)).toFixed(
                              2,
                            ),
                            to: currency,
                          })
                        }}
                      </div>
                    </div>
                    <TfButton
                      v-if="!ro"
                      size="sm"
                      variant="secondary"
                      @click="fetchRate"
                      :disabled="fetchingRate"
                    >
                      <i
                        class="pi pi-sync"
                        :style="fetchingRate ? 'animation:spin 1s linear infinite' : ''"
                        style="font-size: 13px"
                      ></i>
                      {{ fetchingRate ? '' : t('bookings.updateRate') }}
                    </TfButton>
                  </div>
                </fieldset>
              </TfDrawerSection>

              <TfDrawerSection :label="t('bookings.payment')">
                <!-- Paid in full: live in both modes. In the details it saves at once,
                     because a box you can tick must do something when ticked. -->
                <label class="paid-row" for="paid-simple">
                  <input
                    type="checkbox"
                    v-model="form.paidSimple"
                    id="paid-simple"
                    @change="onPaidSimpleChange"
                  />
                  <span class="paid-row-text">{{ t('bookings.paidInFull') }}</span>
                  <span class="hint">{{
                    ro ? t('bookings.savedRightAway') : t('bookings.orSchedule')
                  }}</span>
                </label>

                <!-- Instalments: exist only for a saved booking (they are rows of their own). -->
                <div v-if="editingBooking && !form.paidSimple">
                  <div class="pay-head">
                    <span class="pay-head-title">{{ t('bookings.instalments') }}</span>
                    <TfBadge
                      v-if="editingBooking.payments.length"
                      :tone="paymentsMatch ? 'success' : 'warning'"
                      variant="soft"
                    >
                      {{
                        paymentsMatch
                          ? t('bookings.matchesTotal')
                          : `${paymentsTotal.toFixed(2)} / ${Number(editingBooking.fullPrice || 0).toFixed(2)}`
                      }}
                    </TfBadge>
                  </div>
                  <div style="display: flex; flex-direction: column; gap: 8px">
                    <div
                      v-for="p in editingBooking.payments"
                      :key="p.id"
                      class="payment-row"
                      style="cursor: pointer"
                      @click="openPaymentDialog(editingBooking, p)"
                    >
                      <input
                        type="checkbox"
                        :checked="p.paid"
                        @change.stop="togglePaid(editingBooking.id, p)"
                        @click.stop
                        style="accent-color: var(--accent); width: 18px; height: 18px"
                      />
                      <div style="flex: 1">
                        <div class="pay-amount">{{ p.amount }} {{ bookingCurrency }}</div>
                        <div v-if="p.dueDate" class="pay-due">{{ formatDateShort(p.dueDate) }}</div>
                      </div>
                      <TfBadge :tone="p.paid ? 'success' : 'neutral'" variant="soft">{{
                        p.paid ? t('bookings.paid') : t('bookings.pending')
                      }}</TfBadge>
                      <button
                        type="button"
                        class="del-btn"
                        @click.stop="deletePayment(p.id)"
                        v-tooltip="t('common.delete')"
                      >
                        <i class="pi pi-times"></i>
                      </button>
                    </div>
                    <button
                      v-if="paymentRemaining > 0"
                      type="button"
                      class="payment-add-btn"
                      @click="openPaymentDialog(editingBooking, null)"
                    >
                      <i class="pi pi-plus" style="font-size: 14px"></i>
                      {{
                        t('bookings.schedulePayment', {
                          remaining: paymentRemaining.toFixed(2),
                          currency: bookingCurrency,
                        })
                      }}
                    </button>
                    <div
                      v-else-if="editingBooking.fullPrice && editingBooking.payments.length"
                      class="pay-covered"
                    >
                      {{ t('bookings.fullAmountCovered') }}
                    </div>
                  </div>
                </div>
                <div v-if="!editingBooking && !form.paidSimple" class="note-box">
                  <i class="pi pi-info-circle" style="font-size: 14px"></i>
                  {{ t('bookings.saveFirstPayments') }}
                </div>
              </TfDrawerSection>
            </template>

            <!-- ============ 3. Details: paperwork ============ -->
            <template v-else>
              <fieldset class="form-part" :disabled="ro">
                <TfDrawerSection :label="t('bookings.confirmation')">
                  <div class="two-col">
                    <TfSelect
                      v-if="form.category === 'ACCOMMODATION'"
                      v-model="form.vendor"
                      :label="t('bookings.bookedVia')"
                      :options="accommodationVendorOptions"
                      :placeholder="t('bookings.selectPlatform')"
                    />
                    <TfInput
                      v-else
                      v-model="form.vendor"
                      :label="t('bookings.vendor')"
                      :placeholder="t('bookings.vendorPlaceholder')"
                    />
                    <TfInput
                      v-model="form.confirmationNumber"
                      :label="t('bookings.confirmationNumber')"
                      placeholder="ABC-123"
                    />
                  </div>
                  <TfInput
                    v-model="form.bookingUrl"
                    :label="t('bookings.bookingLink')"
                    :placeholder="t('bookings.bookingLinkPlaceholder')"
                  />
                  <TfInput
                    v-model="form.notes"
                    :label="t('bookings.notes')"
                    :placeholder="t('bookings.notesPlaceholder')"
                  />
                </TfDrawerSection>
              </fieldset>

              <!-- Attachments (PDFs, tickets, confirmation emails) — live in both modes -->
              <TfDrawerSection :label="t('bookings.attachments')">
                <div v-if="editingBooking" style="display: flex; flex-direction: column; gap: 8px">
                  <div v-for="a in editingBooking.attachments || []" :key="a.id" class="file-row">
                    <i class="pi pi-file" style="color: var(--accent)"></i>
                    <button type="button" class="file-open" @click="downloadAttachment(a)">
                      <div class="file-name">{{ a.fileName }}</div>
                      <div class="file-meta">
                        {{ formatBytes(a.size) }} · {{ t('bookings.download') }}
                      </div>
                    </button>
                    <button
                      type="button"
                      class="del-btn"
                      @click="removeAttachment(a)"
                      v-tooltip="t('common.delete')"
                    >
                      <i class="pi pi-times"></i>
                    </button>
                  </div>
                  <input
                    ref="attachmentInput"
                    type="file"
                    style="display: none"
                    @change="onAttachmentPicked"
                  />
                  <button
                    type="button"
                    class="payment-add-btn"
                    @click="triggerAttachmentUpload"
                    :disabled="uploadingAttachment"
                  >
                    <i class="pi pi-upload" style="font-size: 14px"></i>
                    {{ uploadingAttachment ? t('bookings.uploading') : t('bookings.uploadFile') }}
                  </button>
                </div>
                <div v-else class="note-box">
                  <i class="pi pi-info-circle" style="font-size: 14px"></i>
                  {{ t('bookings.saveFirstFiles') }}
                </div>
              </TfDrawerSection>
            </template>
          </form>

          <template #footer>
            <template v-if="drawerMode === 'view' && viewing">
              <TfButton icon="pi-pencil" style="flex: 1" @click="editBooking(viewing)">{{
                t('bookings.edit')
              }}</TfButton>
              <TfButton variant="danger" icon="pi-trash" @click="confirmDelete(viewing)">{{
                t('common.delete')
              }}</TfButton>
            </template>
            <template v-else>
              <span class="footer-status" :class="{ 'footer-status--ok': !missingCount }">
                <i :class="missingCount ? 'pi pi-circle' : 'pi pi-check-circle'"></i>
                {{
                  missingCount
                    ? t('bookings.missing', { count: missingCount })
                    : t('bookings.readyToSave')
                }}
              </span>
              <TfButton variant="ghost" @click="closeDrawer">{{ t('common.cancel') }}</TfButton>
              <TfButton variant="primary" @click="saveBooking" :disabled="saving">
                {{
                  saving
                    ? t('settings.saving')
                    : editingBooking
                      ? t('common.save')
                      : t('bookings.createBooking')
                }}
              </TfButton>
            </template>
          </template>
        </TfDrawer>
      </div>
    </template>

    <!-- Booking Drawer -->

    <!-- Payment Dialog (add/edit) -->
    <TfModal
      v-model="showPaymentDialog"
      :title="editingPayment ? t('bookings.editPayment') : t('bookings.schedulePaymentTitle')"
      size="sm"
    >
      <form @submit.prevent="savePayment" class="dialog-form">
        <!-- Quick fill: full remaining amount -->
        <div v-if="!editingPayment && paymentRemaining > 0" style="margin-bottom: 4px">
          <button
            type="button"
            style="
              width: 100%;
              padding: 10px 14px;
              border: 1.5px dashed var(--border-default);
              background: transparent;
              border-radius: var(--radius-md);
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              font: var(--fw-medium) 14px/1 var(--font-sans);
              color: var(--text-primary);
              transition: all var(--dur-fast) var(--ease-out);
            "
            @click="paymentForm.amount = paymentRemaining"
          >
            <i class="pi pi-check-circle" style="font-size: 14px; color: var(--accent)"></i>
            {{
              t('bookings.fillFullAmount', {
                amount: paymentRemaining.toFixed(2),
                currency: bookingCurrency,
              })
            }}
          </button>
        </div>
        <div class="field">
          <label>{{ t('bookings.amount', { currency: bookingCurrency }) }}</label>
          <TfNumberInput
            v-model="paymentForm.amount"
            type="plain"
            :precision="2"
            :max="paymentMaxAmount"
          />
          <small
            v-if="!editingPayment && paymentRemaining > 0"
            style="
              font: var(--fw-regular) 11px/1.3 var(--font-mono);
              color: var(--text-secondary);
              margin-top: 4px;
              display: block;
            "
          >
            {{
              t('bookings.remaining', {
                amount: paymentRemaining.toFixed(2),
                currency: bookingCurrency,
              })
            }}
          </small>
        </div>
        <div class="field">
          <label>{{ t('bookings.dueDate') }}</label>
          <TfDatePicker v-model="paymentDueDate" mode="date" clearable />
        </div>
      </form>
      <template #footer>
        <div class="dialog-actions">
          <TfButton v-if="editingPayment" variant="ghost" @click="deletePaymentAndClose">{{
            t('common.delete')
          }}</TfButton>
          <span style="flex: 1"></span>
          <TfButton variant="ghost" @click="showPaymentDialog = false">{{
            t('common.cancel')
          }}</TfButton>
          <TfButton
            variant="primary"
            :icon="editingPayment ? 'pi-check' : 'pi-plus'"
            :loading="savingPayment"
            @click="savePayment"
            >{{ editingPayment ? t('common.save') : t('common.add') }}</TfButton
          >
        </div>
      </template>
    </TfModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import {
  TfButton,
  TfBadge,
  TfCard,
  TfProgress,
  TfDrawer,
  TfDrawerSection,
  TfSegmentedControl,
  TfTabs,
  TfCitySearch,
  TfPlaceSearch,
  TfInput,
  TfNumberInput,
  TfSelect,
  TfModal,
  TfDatePicker,
  TfTimePicker,
  toast,
  confirm,
} from '@tripyfull/ui';
import BookingMap from '@/components/BookingMap.vue';
import { FEATURES } from '@/config.js';
import { baseCurrency as accountCurrency, catEmoji, bookingEmoji, t } from '@tripyfull/core';
import {
  formatDualPrice,
  toBaseCurrency,
  CURRENCIES,
  toDateStr,
  parseDate,
  formatDateShort,
} from '@tripyfull/core';
import { api } from '@tripyfull/core';

const route = useRoute();

const tripId = route.params.tripId;
const tripTitle = ref('');
const tripStartDate = ref(null);
// A booking's stored rate is what the budget converts with, so it must be a rate
// into the trip's currency — not into whatever the account happens to use.
const tripCurrency = ref(null);
const currency = computed(() => tripCurrency.value || accountCurrency.value);
const tripEndDate = ref(null);
const bookings = ref([]);
const loading = ref(false);
const saving = ref(false);

/* ---- Bookings → plan ----
   The stops a sync writes belong to their booking, so running it again after a
   change is the whole update story: it rewrites its own and leaves the rest. */
const syncingPlan = ref(false);
const plannedFromBookings = ref(0);
const planLabel = computed(() =>
  syncingPlan.value
    ? t('bookings.planning')
    : plannedFromBookings.value
      ? t('bookings.updatePlan')
      : t('bookings.addToPlan'),
);

const loadPlanCount = async () => {
  try {
    const res = await api.get(`/api/trips/${tripId}/plan/from-bookings`);
    plannedFromBookings.value = Number(res.data?.total || 0);
  } catch {
    plannedFromBookings.value = 0; // only decides the button's wording
  }
};

const syncPlan = async () => {
  syncingPlan.value = true;
  try {
    const { data } = await api.post(`/api/trips/${tripId}/plan/from-bookings`);
    plannedFromBookings.value = Number(data.total || 0);
    const detail =
      t('bookings.planDetail', {
        stops: t('bookings.planStops', { count: data.created }),
        days: t('bookings.planDays', { count: data.days }),
      }) + (data.skippedBookings ? t('bookings.planSkipped', { count: data.skippedBookings }) : '');
    if (data.created) toast.success(t('bookings.planUpdated'), detail);
    else toast.info(t('bookings.nothingToPlan'), t('bookings.nothingToPlanMsg'));
  } catch {
    toast.danger(t('common.error'), t('bookings.planFailed'));
  } finally {
    syncingPlan.value = false;
  }
};
const savingPayment = ref(false);
const showDrawer = ref(false);
const showPaymentDialog = ref(false);
const editingBooking = ref(null);
const paymentBookingId = ref(null);
const editingPayment = ref(null);
const paymentDueDate = ref(null);

const currencySelectOptions = CURRENCIES;

const emptyForm = {
  name: '',
  category: null,
  vendor: '',
  confirmationNumber: '',
  bookingUrl: '',
  fullPrice: null,
  priceCurrency: null,
  exchangeRate: null,
  notes: '',
  flightNumber: '',
  fromPlace: '',
  toPlace: '',
  fromLatitude: null,
  fromLongitude: null,
  toLatitude: null,
  toLongitude: null,
  transportMode: null,
  fromIata: '',
  toIata: '',
  departureTerminal: '',
  arrivalTerminal: '',
  seat: '',
  departureAt: null,
  arrivalAt: null,
  vesselName: '',
  cabin: '',
  carClass: '',
  accommodationCity: '',
  checkInTime: '',
  checkOutTime: '',
  roomType: '',
  guests: null,
  address: '',
  latitude: null,
  longitude: null,
  paidSimple: false,
};
const attachmentInput = ref(null);
const uploadingAttachment = ref(false);
const form = ref({ ...emptyForm });

// Location coords for map — not sent to backend, just for display
const fromCoords = ref(null);
const toCoords = ref(null);
const placeCoords = ref(null);
const hotelSearchText = ref('');

const transportMarkers = computed(() => {
  const m = [];
  if (fromCoords.value) m.push({ ...fromCoords.value, label: form.value.fromPlace });
  if (toCoords.value) m.push({ ...toCoords.value, label: form.value.toPlace });
  return m;
});

const placeMarkers = computed(() => {
  if (!placeCoords.value) return [];
  return [{ ...placeCoords.value, label: form.value.name || form.value.accommodationCity || '' }];
});

const onFromSelect = (place) => {
  fromCoords.value = place ? { lat: place.lat, lon: place.lon } : null;
  form.value.fromLatitude = place ? place.lat : null;
  form.value.fromLongitude = place ? place.lon : null;
};

const onToSelect = (place) => {
  toCoords.value = place ? { lat: place.lat, lon: place.lon } : null;
  form.value.toLatitude = place ? place.lat : null;
  form.value.toLongitude = place ? place.lon : null;
};

const onHotelSelect = (place) => {
  if (!place) {
    placeCoords.value = null;
    return;
  }
  placeCoords.value = { lat: place.lat, lon: place.lon };
  if (!form.value.name && place.name) form.value.name = place.name;
  if (!form.value.accommodationCity) {
    form.value.accommodationCity =
      place.city ||
      (place.displayName ? place.displayName.split(',').map((p) => p.trim())[1] || '' : '');
  }
  // Persist coordinates + address (server keeps these instead of re-geocoding).
  form.value.latitude = place.lat;
  form.value.longitude = place.lon;
  if (place.displayName) form.value.address = place.displayName;
};

const onActivityLocationSelect = (place) => {
  if (!place) {
    placeCoords.value = null;
    return;
  }
  placeCoords.value = { lat: place.lat, lon: place.lon };
};
const stayDateRange = ref(null);
const paymentForm = ref({ amount: null });
const fetchingRate = ref(false);
const refreshingRates = ref(false);

const showExchangeRate = computed(
  () => form.value.priceCurrency && form.value.priceCurrency !== currency.value,
);

// Live derived values shown while editing (server recomputes them authoritatively).
const formNights = computed(() => {
  const a = stayDateRange.value?.[0],
    b = stayDateRange.value?.[1];
  if (!a || !b) return null;
  const n = Math.round(
    (new Date(b.getFullYear(), b.getMonth(), b.getDate()) -
      new Date(a.getFullYear(), a.getMonth(), a.getDate())) /
      86400000,
  );
  return n > 0 ? n : null;
});
const formPricePerNight = computed(() =>
  formNights.value && form.value.fullPrice ? Number(form.value.fullPrice) / formNights.value : null,
);
const formDurationMin = computed(() => {
  if (!form.value.departureAt || !form.value.arrivalAt) return null;
  const mins = Math.round(
    (new Date(form.value.arrivalAt) - new Date(form.value.departureAt)) / 60000,
  );
  return mins > 0 ? mins : null;
});

const fetchRate = async () => {
  if (!form.value.priceCurrency || form.value.priceCurrency === currency.value) return;
  fetchingRate.value = true;
  try {
    const res = await api.get('/api/exchange-rate', {
      params: { from: form.value.priceCurrency, to: currency.value },
    });
    form.value.exchangeRate = res.data.rate;
  } catch {
    toast.warning(
      t('bookings.rateUnavailable'),
      t('bookings.rateFailed', { currency: form.value.priceCurrency }),
    );
  } finally {
    fetchingRate.value = false;
  }
};

const placeLabel = (city, name, iata) => {
  const base = city || name || '';
  return iata ? (base ? `${base} (${iata})` : iata) : base;
};

const onCurrencyChange = (val) => {
  form.value.priceCurrency = val;
  if (val && val !== currency.value) {
    form.value.exchangeRate = null;
    fetchRate();
  } else {
    form.value.exchangeRate = null;
  }
};

// Both pickers work in words, so their labels are read through t() inside
// computeds — a change of language relabels them without a reload.
const CATEGORY_VALUES = ['TRANSPORTATION', 'ACCOMMODATION', 'ACTIVITY'];
const categoryLabelOf = (v) =>
  ({
    TRANSPORTATION: t('bookings.typeTransportation'),
    ACCOMMODATION: t('bookings.typeAccommodation'),
    ACTIVITY: t('bookings.typeActivity'),
  })[v] ?? v;
const categoryOptions = computed(() => CATEGORY_VALUES.map(categoryLabelOf));

/**
 * A booking is something you reserve and pay for. Walking and hopping on the
 * metro are not booked, so they are not offered here — they live on the day's
 * legs in the itinerary instead. Old rows keep displaying their label.
 */
const TRANSPORT_VALUES = ['FLIGHT', 'TRAIN', 'BUS', 'FERRY', 'TAXI', 'CAR_RENTAL'];
// Not offered any more, kept so existing bookings still read correctly:
const LEGACY_TRANSPORT = ['METRO', 'WALK'];
const transportLabelOf = (v) =>
  [...TRANSPORT_VALUES, ...LEGACY_TRANSPORT].includes(v) ? t(`bookings.mode.${v}`) : v;
const transportOptions = computed(() => TRANSPORT_VALUES.map(transportLabelOf));

const accommodationVendorOptions = computed(() => [
  'Booking.com',
  'Airbnb',
  'Hotels.com',
  'Expedia',
  'Agoda',
  'Hostelworld',
  t('bookings.vendorDirect'),
  t('bookings.vendorOther'),
]);
// TfSelect works with string labels; bridge label <-> stored value for category/transport.
const categoryLabel = computed({
  get: () => categoryLabelOf(form.value.category),
  set: (label) => {
    form.value.category = CATEGORY_VALUES.find((v) => categoryLabelOf(v) === label) ?? label;
  },
});
const transportModeName = computed({
  get: () => transportLabelOf(form.value.transportMode),
  set: (label) => {
    form.value.transportMode = TRANSPORT_VALUES.find((v) => transportLabelOf(v) === label) ?? label;
  },
});

/** What that icon means, spelled out on hover. */
const bookingIconTitle = (b) =>
  b.transportMode ? transportLabelOf(b.transportMode) : categoryLabelOf(b.category);

const dualPrice = (b) =>
  formatDualPrice(b.fullPrice, b.priceCurrency || currency.value, currency.value, b.exchangeRate);

const bookingCurrency = computed(
  () => editingBooking.value?.priceCurrency || form.value.priceCurrency || currency.value,
);

const paymentsTotal = computed(() =>
  (editingBooking.value?.payments || []).reduce((s, p) => s + Number(p.amount || 0), 0),
);

const paymentRemaining = computed(() => {
  const total = Number(editingBooking.value?.fullPrice || 0);
  return Math.max(0, total - paymentsTotal.value);
});

const paymentMaxAmount = computed(() => {
  if (!editingBooking.value?.fullPrice) return undefined;
  const total = Number(editingBooking.value.fullPrice);
  if (editingPayment.value) {
    // When editing, max = remaining + current payment amount
    const othersTotal = (editingBooking.value.payments || [])
      .filter((p) => p.id !== editingPayment.value.id)
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    return Math.max(0, total - othersTotal);
  }
  return paymentRemaining.value > 0 ? paymentRemaining.value : undefined;
});

const paymentsMatch = computed(() => {
  const total = Number(editingBooking.value?.fullPrice || 0);
  return total > 0 && Math.abs(paymentsTotal.value - total) < 0.01;
});

const catIconStyle = (cat) =>
  ({
    TRANSPORTATION: { background: 'var(--success-100)', color: 'var(--accent)' },
    ACCOMMODATION: { background: 'var(--danger-100)', color: 'var(--accent)' },
    ACTIVITY: { background: 'var(--success-100)', color: 'var(--success-300)' },
  })[cat] || { background: 'var(--surface)', color: 'var(--ink-500)' };

/** Everything on the right column, derived from the bookings themselves. */
const CAT_META = [
  { cat: 'TRANSPORTATION', key: 'bookings.catTransport', color: 'var(--primary)' },
  { cat: 'ACCOMMODATION', key: 'bookings.catAccommodation', color: 'var(--warning-500)' },
  { cat: 'ACTIVITY', key: 'bookings.catActivities', color: 'var(--accent)' },
];

/** Prices live in their own currencies; totals only make sense in one. */
const inBase = (b, amount) =>
  toBaseCurrency(amount, b.priceCurrency || currency.value, currency.value, b.exchangeRate);

const money = (v) => `${(Number(v) || 0).toFixed(2)} ${currency.value}`;

const stats = computed(() => {
  const sums = Object.fromEntries(CAT_META.map((c) => [c.cat, { n: 0, sum: 0 }]));
  const status = { paid: 0, partial: 0, unpaid: 0 };
  let total = 0;
  let paid = 0;
  let nights = 0;

  for (const b of bookings.value) {
    const full = inBase(b, b.fullPrice);
    total += full;
    // A booking flagged "paid" has no payment rows to add up.
    paid += b.paidSimple ? full : inBase(b, b.paidTotal);
    if (sums[b.category]) {
      sums[b.category].n += 1;
      sums[b.category].sum += full;
    }
    status[payStatusKey(b)] += 1;
    if (b.category === 'ACCOMMODATION' && b.nights) nights += b.nights;
  }

  return {
    total,
    paid,
    left: Math.max(0, total - paid),
    paidShare: total > 0 ? Math.round((paid / total) * 100) : 0,
    nights,
    status,
    byCat: CAT_META.map((c) => ({
      ...c,
      label: t(c.key),
      ...sums[c.cat],
      share: total > 0 ? (sums[c.cat].sum / total) * 100 : 0,
    })).filter((c) => c.n > 0),
  };
});

/** Nights the trip actually has, to say how much of it is covered. */
const tripNights = computed(() => {
  const from = parseDate(tripStartDate.value);
  const to = parseDate(tripEndDate.value);
  if (!from || !to) return 0;
  return Math.max(0, Math.round((to - from) / 86400000));
});

const upcomingPayments = computed(() =>
  bookings.value
    .flatMap((b) =>
      (b.payments || [])
        .filter((p) => !p.paid && p.dueDate)
        .map((p) => ({
          ...p,
          bookingName: b.name,
          currency: b.priceCurrency || currency.value,
        })),
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 4),
);

const bookingGroups = computed(() => {
  return CAT_META.map((g) => ({
    cat: g.cat,
    label: t(g.key),
    items: bookings.value.filter((b) => b.category === g.cat),
  })).filter((g) => g.items.length > 0);
});

const payStatusTone = (b) => {
  if (b.paidSimple) return 'success';
  const paid = Number(b.paidTotal) || 0;
  const total = Number(b.fullPrice) || 0;
  if (paid >= total && total > 0) return 'success';
  if (paid > 0) return 'warning';
  return 'danger';
};

/** The state itself, so the totals can count it whatever the language says. */
const payStatusKey = (b) => {
  if (b.paidSimple) return 'paid';
  const paid = Number(b.paidTotal) || 0;
  const total = Number(b.fullPrice) || 0;
  if (paid >= total && total > 0) return 'paid';
  if (paid > 0) return 'partial';
  return 'unpaid';
};

const payStatusLabel = (b) => t(`bookings.${payStatusKey(b)}`);

const nextPayment = (b) => {
  const unpaid = (b.payments || []).filter((p) => !p.paid && p.dueDate);
  if (!unpaid.length) return null;
  return unpaid.sort((a, c) => a.dueDate.localeCompare(c.dueDate))[0];
};

const bookingMeta = (b) => {
  if (b.category === 'TRANSPORTATION' && b.transportMode === 'CAR_RENTAL') {
    const parts = [];
    if (b.departureAt)
      parts.push(
        t('bookings.metaPickup', { when: formatDateTime(b.departureAt) }) +
          (b.fromPlace ? ` · ${b.fromPlace}` : ''),
      );
    if (b.arrivalAt)
      parts.push(
        t('bookings.metaDropoff', { when: formatDateTime(b.arrivalAt) }) +
          (b.toPlace && b.toPlace !== b.fromPlace ? ` · ${b.toPlace}` : ''),
      );
    if (b.carClass) parts.push(b.carClass);
    return parts.join(' · ');
  }
  if (b.category === 'TRANSPORTATION') {
    const parts = [];
    if (b.flightNumber) parts.push(b.flightNumber);
    if (b.fromPlace && b.toPlace) parts.push(`${b.fromPlace} → ${b.toPlace}`);
    if (b.departureAt) parts.push(formatDateTime(b.departureAt));
    if (b.durationMinutes) parts.push(formatDuration(b.durationMinutes));
    if (b.seat) parts.push(t('bookings.metaSeat', { seat: b.seat }));
    if (b.vesselName) parts.push(b.vesselName);
    if (b.carClass) parts.push(b.carClass);
    return parts.join(' · ');
  }
  if (b.category === 'ACCOMMODATION') {
    const parts = [];
    if (b.accommodationCity) parts.push(b.accommodationCity);
    if (b.checkIn) parts.push(`${formatDateShort(b.checkIn)} → ${formatDateShort(b.checkOut)}`);
    if (b.nights) parts.push(t('bookings.nights', { count: b.nights }));
    if (b.pricePerNight)
      parts.push(
        t('bookings.perNight', {
          price: Number(b.pricePerNight).toFixed(2),
          currency: b.priceCurrency || currency.value,
        }),
      );
    if (b.roomType) parts.push(b.roomType);
    if (b.guests) parts.push(t('bookings.metaGuests', { count: b.guests }));
    return parts.join(' · ');
  }
  if (b.category === 'ACTIVITY') {
    const parts = [];
    if (b.fromPlace) parts.push(b.fromPlace);
    if (b.departureAt) parts.push(formatDateTime(b.departureAt));
    if (b.durationMinutes) parts.push(formatDuration(b.durationMinutes));
    if (b.confirmationNumber) parts.push(b.confirmationNumber);
    // An activity with none of that at least says what is missing, instead of
    // leaving the row blank under its name.
    if (!parts.length) return t('bookings.metaNoDate');
    return parts.join(' · ');
  }
  return '';
};

// Stay dates must fall inside the trip; the server allows check-out up to
// trip end + 1 day (leaving on the morning after the last day).
const stayMinDate = computed(() => parseDate(tripStartDate.value));
const stayMaxDate = computed(() => {
  const d = parseDate(tripEndDate.value);
  if (!d) return null;
  d.setDate(d.getDate() + 1);
  return d;
});

const resetLocationState = () => {
  fromCoords.value = null;
  toCoords.value = null;
  placeCoords.value = null;
  hotelSearchText.value = '';
};

/** Details first, editing second — the same two-step as the place panel. */
const drawerMode = ref('view');
const viewing = ref(null);

/** Viewing: the editor's template with its fields disabled. */
const ro = computed(() => drawerMode.value === 'view');

/* ---- Car rental: picked up and dropped off, not departed and arrived ---- */
const isRental = computed(() => form.value.transportMode === 'CAR_RENTAL');
// Most rentals go back where they came from; the drop-off field appears only when not.
const sameDropOff = ref(true);
watch(sameDropOff, (same) => {
  if (same && isRental.value) {
    form.value.toPlace = form.value.fromPlace;
    form.value.toLatitude = form.value.fromLatitude;
    form.value.toLongitude = form.value.fromLongitude;
  }
});
const rentalDays = computed(() => {
  if (!form.value.departureAt || !form.value.arrivalAt) return '';
  const d = Math.max(
    1,
    Math.ceil((new Date(form.value.arrivalAt) - new Date(form.value.departureAt)) / 86400000),
  );
  return t('bookings.days', { count: d });
});

/* ---- Tabs and required fields ----
   What a booking needs before it can be saved depends on its category; the
   list is computed live, counted per tab, and shown on the tabs themselves.
   Field-level errors appear only after a Save attempt, so a fresh form is
   guidance, not a wall of red. */
const tab = ref('booking');
const attempted = ref(false);

const REQUIRED_KEYS = {
  name: 'bookings.reqName',
  category: 'bookings.reqCategory',
  transportMode: 'bookings.reqTransportMode',
  fromPlace: 'bookings.reqFrom',
  toPlace: 'bookings.reqTo',
  accommodationCity: 'bookings.reqCity',
  stay: 'bookings.reqStay',
  fullPrice: 'bookings.reqPrice',
};
const TAB_OF = {
  name: 'booking',
  category: 'booking',
  transportMode: 'booking',
  fromPlace: 'booking',
  toPlace: 'booking',
  accommodationCity: 'booking',
  stay: 'booking',
  fullPrice: 'price',
};

/** Keys of the required fields that are still empty, in form order. */
const missing = computed(() => {
  const f = form.value;
  const m = [];
  if (!String(f.name || '').trim()) m.push('name');
  if (!f.category) m.push('category');
  if (f.category === 'TRANSPORTATION') {
    if (!f.transportMode) m.push('transportMode');
    if (!String(f.fromPlace || '').trim()) m.push('fromPlace');
    // A rental returned to the same place has no second location to ask for.
    if (f.transportMode !== 'CAR_RENTAL' && !String(f.toPlace || '').trim()) m.push('toPlace');
  }
  if (f.category === 'ACCOMMODATION') {
    if (!String(f.accommodationCity || '').trim()) m.push('accommodationCity');
    if (!stayDateRange.value?.[0] || !stayDateRange.value?.[1]) m.push('stay');
  }
  if (f.fullPrice == null || Number(f.fullPrice) <= 0) m.push('fullPrice');
  return m;
});
const missingCount = computed(() => missing.value.length);
const fieldError = (key) =>
  attempted.value && missing.value.includes(key) ? t(REQUIRED_KEYS[key]) : '';

const tabItems = computed(() => {
  const count = (id) => missing.value.filter((k) => TAB_OF[k] === id).length;
  const badge = (id) => (ro.value ? '' : count(id) ? String(count(id)) : '');
  return [
    { id: 'booking', label: t('bookings.tabBooking'), badge: badge('booking') },
    { id: 'price', label: t('bookings.tabPrice'), badge: badge('price') },
    { id: 'details', label: t('bookings.tabDetails'), badge: '' },
  ];
});

/** Opens the drawer on its first tab with a clean slate. */
const resetTabs = () => {
  tab.value = 'booking';
  attempted.value = false;
};

const openDetails = (b) => {
  resetLocationState();
  resetTabs();
  viewing.value = b;
  editingBooking.value = b;
  loadForm(b);
  drawerMode.value = 'view';
  showDrawer.value = true;
};

/** In the details there is no Save button, so the tick itself is the save. */
const onPaidSimpleChange = () => {
  if (ro.value) saveBooking();
};

const closeDrawer = () => {
  // Cancelling an edit of an existing booking falls back to its details.
  if (drawerMode.value === 'edit' && editingBooking.value) {
    drawerMode.value = 'view';
    return;
  }
  showDrawer.value = false;
};

/** One picker, two datetimes: departure and arrival as the API stores them. */
const travelRange = computed({
  get: () => {
    const from = form.value.departureAt ? new Date(form.value.departureAt) : null;
    const to = form.value.arrivalAt ? new Date(form.value.arrivalAt) : null;
    return from || to ? [from, to] : null;
  },
  set: (v) => {
    const [from, to] = v || [null, null];
    form.value.departureAt = from ? toLocalDateTime(from) : null;
    form.value.arrivalAt = to ? toLocalDateTime(to) : null;
  },
});

/** The backend takes a local date-time without a zone; never send UTC here. */
const toLocalDateTime = (d) => {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:00`
  );
};

/** A booking flagged "paid" has no payment rows to add up. */
const paidOf = (b) => (b.paidSimple ? b.fullPrice : b.paidTotal);

const openAddDialog = () => {
  resetTabs();
  editingBooking.value = null;
  drawerMode.value = 'edit';
  viewing.value = null;
  form.value = { ...emptyForm, priceCurrency: currency.value };
  stayDateRange.value = null;
  resetLocationState();
  showDrawer.value = true;
};

const editBooking = (b) => {
  resetLocationState();
  resetTabs();
  drawerMode.value = 'edit';
  viewing.value = b;
  editingBooking.value = b;
  loadForm(b);
  showDrawer.value = true;
};

/** The form as the booking has it; the same fill for viewing and editing. */
const loadForm = (b) => {
  form.value = {
    name: b.name,
    category: b.category,
    vendor: b.vendor || '',
    confirmationNumber: b.confirmationNumber || '',
    bookingUrl: b.bookingUrl || '',
    fullPrice: b.fullPrice,
    priceCurrency: b.priceCurrency || currency.value,
    exchangeRate: b.exchangeRate,
    notes: b.notes || '',
    flightNumber: b.flightNumber || '',
    fromPlace: b.fromPlace || '',
    toPlace: b.toPlace || '',
    fromLatitude: b.fromLatitude ?? null,
    fromLongitude: b.fromLongitude ?? null,
    toLatitude: b.toLatitude ?? null,
    toLongitude: b.toLongitude ?? null,
    transportMode: b.transportMode,
    fromIata: b.fromIata || '',
    toIata: b.toIata || '',
    departureTerminal: b.departureTerminal || '',
    arrivalTerminal: b.arrivalTerminal || '',
    seat: b.seat || '',
    departureAt: b.departureAt || null,
    arrivalAt: b.arrivalAt || null,
    vesselName: b.vesselName || '',
    cabin: b.cabin || '',
    carClass: b.carClass || '',
    accommodationCity: b.accommodationCity || '',
    checkInTime: b.checkInTime ? b.checkInTime.slice(0, 5) : '',
    checkOutTime: b.checkOutTime ? b.checkOutTime.slice(0, 5) : '',
    roomType: b.roomType || '',
    guests: b.guests ?? null,
    address: b.address || '',
    latitude: b.latitude ?? null,
    longitude: b.longitude ?? null,
    paidSimple: b.paidSimple || false,
  };
  stayDateRange.value =
    b.checkIn && b.checkOut ? [parseDate(b.checkIn), parseDate(b.checkOut)] : null;
  sameDropOff.value = !b.toPlace || b.toPlace === b.fromPlace;
  // A saved booking keeps its pins; before, the map opened empty until the
  // places were searched for again.
  if (b.latitude != null && b.longitude != null && b.category !== 'TRANSPORTATION') {
    placeCoords.value = { lat: b.latitude, lon: b.longitude };
  }
  if (b.fromLatitude != null && b.fromLongitude != null) {
    fromCoords.value = { lat: b.fromLatitude, lon: b.fromLongitude };
  }
  if (b.toLatitude != null && b.toLongitude != null) {
    toCoords.value = { lat: b.toLatitude, lon: b.toLongitude };
  }
};

const saveBooking = async () => {
  if (isRental.value && sameDropOff.value) {
    form.value.toPlace = form.value.fromPlace;
    form.value.toLatitude = form.value.fromLatitude;
    form.value.toLongitude = form.value.fromLongitude;
  }
  // Incomplete: show what is missing and go to the tab holding the first gap.
  if (!ro.value && missing.value.length) {
    attempted.value = true;
    tab.value = TAB_OF[missing.value[0]];
    return;
  }
  saving.value = true;
  try {
    const payload = {
      ...form.value,
      priceCurrency: form.value.priceCurrency || currency.value,
      exchangeRate: form.value.exchangeRate || null,
      // PATCH keeps null fields; explicitly drop a stale rate (e.g. after a currency
      // change) — the server auto-fills a fresh one for the current currency.
      clearExchangeRate: editingBooking.value ? !form.value.exchangeRate : undefined,
      checkIn: toDateStr(stayDateRange.value?.[0]),
      checkOut: toDateStr(stayDateRange.value?.[1]),
      checkInTime: form.value.checkInTime || null,
      checkOutTime: form.value.checkOutTime || null,
    };
    if (editingBooking.value) {
      const res = await api.patch(`/api/bookings/${editingBooking.value.id}`, payload);
      const idx = bookings.value.findIndex((b) => b.id === editingBooking.value.id);
      if (idx !== -1) bookings.value[idx] = res.data;
      editingBooking.value = res.data;
      // Back to the details, so the change is visible where you left it.
      viewing.value = res.data;
      drawerMode.value = 'view';
    } else {
      const res = await api.post(`/api/trips/${tripId}/bookings`, payload);
      bookings.value.push(res.data);
      // Stay in the editor so instalments and files can be added right away;
      // Cancel from here lands on the new booking's details, not a blank panel.
      editingBooking.value = res.data;
      viewing.value = res.data;
    }
    toast.success(t('common.saved'));
  } catch {
    toast.danger(t('common.error'), t('bookings.saveFailed'));
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (b) => {
  confirm({
    title: t('common.confirm'),
    message: t('bookings.deleteMsg', { name: b.name }),
    tone: 'danger',
    confirmLabel: t('common.delete'),
    cancelLabel: t('common.cancel'),
  }).then(async (ok) => {
    if (!ok) return;
    try {
      await api.delete(`/api/bookings/${b.id}`);
      bookings.value = bookings.value.filter((x) => x.id !== b.id);
      showDrawer.value = false;
      toast.success(t('common.deleted'));
    } catch {
      toast.danger(t('common.error'), t('bookings.deleteFailed'));
    }
  });
};

const openPaymentDialog = (b, payment = null) => {
  paymentBookingId.value = b.id;
  editingPayment.value = payment;
  if (payment) {
    paymentForm.value = { amount: Number(payment.amount) };
    paymentDueDate.value = payment.dueDate ? new Date(payment.dueDate) : null;
  } else {
    paymentForm.value = { amount: null };
    paymentDueDate.value = null;
  }
  showPaymentDialog.value = true;
};

const savePayment = async () => {
  savingPayment.value = true;
  try {
    const payload = {
      amount: paymentForm.value.amount,
      dueDate: toDateStr(paymentDueDate.value),
      // PATCH keeps null fields; ask explicitly to drop a cleared due date.
      clearDueDate: editingPayment.value ? !paymentDueDate.value : undefined,
    };
    let res;
    if (editingPayment.value) {
      res = await api.patch(`/api/payments/${editingPayment.value.id}`, payload);
    } else {
      res = await api.post(`/api/bookings/${paymentBookingId.value}/payments`, payload);
    }
    updateBookingLocal(res.data);
    showPaymentDialog.value = false;
    toast.success(editingPayment.value ? t('bookings.paymentUpdated') : t('bookings.paymentAdded'));
  } catch (err) {
    // GlobalExceptionHandler returns { error: "..." }; never toast a raw object.
    const data = err.response?.data;
    const msg = data?.error || (typeof data === 'string' ? data : null);
    toast.danger(t('common.error'), msg || t('bookings.paymentSaveFailed'));
  } finally {
    savingPayment.value = false;
  }
};

const togglePaid = async (bookingId, payment) => {
  try {
    const endpoint = payment.paid ? 'unpaid' : 'paid';
    const res = await api.patch(`/api/payments/${payment.id}/${endpoint}`);
    updateBookingLocal(res.data);
  } catch {
    toast.danger(t('common.error'), t('bookings.paymentUpdateFailed'));
  }
};

const deletePayment = async (paymentId) => {
  try {
    const res = await api.delete(`/api/payments/${paymentId}`);
    updateBookingLocal(res.data);
    toast.success(t('common.deleted'));
  } catch {
    toast.danger(t('common.error'), t('bookings.paymentDeleteFailed'));
  }
};

const deletePaymentAndClose = async () => {
  if (!editingPayment.value) return;
  await deletePayment(editingPayment.value.id);
  showPaymentDialog.value = false;
};

const updateBookingLocal = (data) => {
  const idx = bookings.value.findIndex((b) => b.id === data.id);
  if (idx !== -1) bookings.value[idx] = data;
  if (editingBooking.value?.id === data.id) editingBooking.value = data;
  if (viewing.value?.id === data.id) viewing.value = data;
};

const formatBytes = (n) => {
  if (!n) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

const triggerAttachmentUpload = () => attachmentInput.value?.click();

const onAttachmentPicked = async (e) => {
  const file = e.target.files?.[0];
  if (!file || !editingBooking.value) return;
  uploadingAttachment.value = true;
  try {
    const fd = new FormData();
    fd.append('file', file);
    const res = await api.post(`/api/bookings/${editingBooking.value.id}/attachments`, fd);
    updateBookingLocal(res.data);
    toast.success(t('bookings.uploaded'), file.name);
  } catch {
    toast.danger(t('common.error'), t('bookings.uploadFailed'));
  } finally {
    uploadingAttachment.value = false;
    e.target.value = '';
  }
};

const downloadAttachment = async (a) => {
  try {
    const res = await api.get(`/api/attachments/${a.id}/download`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = a.fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch {
    toast.danger(t('common.error'), t('bookings.downloadFailed'));
  }
};

const removeAttachment = async (a) => {
  try {
    const res = await api.delete(`/api/attachments/${a.id}`);
    updateBookingLocal(res.data);
    toast.success(t('bookings.removed'), a.fileName);
  } catch {
    toast.danger(t('common.error'), t('bookings.deleteFileFailed'));
  }
};

const refreshAllRates = async () => {
  const needsUpdate = bookings.value.filter(
    (b) => b.priceCurrency && b.priceCurrency !== currency.value,
  );
  if (!needsUpdate.length) {
    toast.info(t('bookings.allBase'));
    return;
  }
  refreshingRates.value = true;
  let updated = 0;
  for (const b of needsUpdate) {
    try {
      const rateRes = await api.get('/api/exchange-rate', {
        params: { from: b.priceCurrency, to: currency.value },
      });
      await api.patch(`/api/bookings/${b.id}`, { exchangeRate: rateRes.data.rate });
      updated++;
    } catch {
      /* skip failed */
    }
  }
  // Reload all bookings
  try {
    const res = await api.get(`/api/trips/${tripId}/bookings`);
    bookings.value = res.data;
  } catch {
    /* ignore */
  }
  refreshingRates.value = false;
  toast.success(t('bookings.ratesUpdated', { count: updated }));
};

const formatDateTime = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  const hh = String(dt.getHours()).padStart(2, '0');
  const mm = String(dt.getMinutes()).padStart(2, '0');
  return `${formatDateShort(d)}, ${hh}:${mm}`;
};
const formatDuration = (mins) => {
  if (!mins || mins <= 0) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h ? h + 'h' : ''}${h && m ? ' ' : ''}${m ? m + 'm' : h ? '' : '0m'}`;
};

onMounted(async () => {
  loading.value = true;
  try {
    const [tripRes, bookingsRes] = await Promise.all([
      api.get(`/api/trips/${tripId}`),
      api.get(`/api/trips/${tripId}/bookings`),
      loadPlanCount(),
    ]);
    tripTitle.value = tripRes.data.title;
    tripCurrency.value = tripRes.data.baseCurrency || null;
    tripStartDate.value = tripRes.data.startDate;
    tripEndDate.value = tripRes.data.endDate;
    bookings.value = bookingsRes.data;
  } catch {
    toast.danger(t('common.error'), t('bookings.loadFailed'));
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
/* Two columns: the list carries the detail, the right rail the totals. It
   sticks, so the figures stay in view while you scroll the list. */
.bookings-layout {
  display: flex;
  gap: var(--space-5);
  align-items: flex-start;
}
.bookings-main {
  flex: 1;
  min-width: 0;
}
/* A booking is one line of facts and a price: 22px of card around it made a
   list of twelve twice as long as it needs to be. */
.bookings-main .tf-card {
  padding: 12px 14px;
}
/* The icon anchors the row; it does not need to set the row's height. */
.bookings-main .cat-icon--xl {
  width: 36px;
  height: 36px;
  font-size: 17px;
}
.booking-card-content {
  gap: 12px;
}

/* Phones: the icon, the name and the price shared one line, which left the
   name about 170px and the facts under it five lines deep. The price goes to
   a line of its own, aligned with the text column, and the facts are clamped
   — the card is a summary, the drawer has the detail. */
@media (max-width: 700px) {
  /* Icon-only actions lose the padding meant for a word beside the icon. */
  .phone-icon-btn {
    padding-left: 13px;
    padding-right: 13px;
  }
  .booking-card-content {
    flex-wrap: wrap;
  }
  .booking-card-info {
    flex: 1 1 calc(100% - 48px);
  }
  .booking-card-meta {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .booking-card-price {
    flex: 1 1 100%;
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding-left: 48px;
    text-align: left;
  }
  .booking-card-price-label {
    margin-top: 0;
  }
}

/* Drawer form: tabs stay in view while the section below scrolls. */
.booking-tabs {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--card);
  padding: 0 var(--space-4);
}
.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.two-col--wide-left {
  grid-template-columns: 2fr 1fr;
}
.three-col {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
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
.paid-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: var(--surface);
  border-radius: var(--radius-md);
  cursor: pointer;
}
.paid-row input {
  accent-color: var(--accent);
  width: 18px;
  height: 18px;
}
.paid-row-text {
  flex: 1;
  font: var(--fw-medium) 14px/1 var(--font-sans);
  color: var(--text-primary);
}
.pay-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 6px 0 10px;
}
.pay-head-title {
  font: var(--fw-semibold) 15px/1 var(--font-display);
  color: var(--text-primary);
}
.pay-amount {
  font: var(--fw-semibold) 14px/1.2 var(--font-sans);
  color: var(--text-primary);
}
.pay-due {
  font: var(--fw-medium) 11px/1 var(--font-mono);
  color: var(--text-secondary);
  margin-top: 2px;
}
.pay-covered {
  font: var(--type-small);
  color: var(--success-500);
  text-align: center;
  padding: 8px;
}
.note-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--surface);
  border-radius: var(--radius-md);
  font: var(--type-small);
  color: var(--text-secondary);
}
.file-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
}
.file-open {
  flex: 1;
  min-width: 0;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}
.file-name {
  font: var(--fw-semibold) 14px/1.2 var(--font-sans);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.file-meta {
  font: var(--fw-medium) 11px/1 var(--font-mono);
  color: var(--text-secondary);
  margin-top: 2px;
}
.bookings-side {
  width: 320px;
  flex: none;
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.side-title {
  font: var(--type-code);
  text-transform: uppercase;
  letter-spacing: var(--ls-caps);
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
}
.side-total {
  display: block;
  margin-bottom: var(--space-2);
}
.side-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  padding: 5px 0;
  font: var(--type-small);
  color: var(--text-secondary);
}
.side-val {
  font: var(--fw-semibold) var(--text-sm)/1.3 var(--font-sans);
  color: var(--text-primary);
  white-space: nowrap;
}
.side-sub {
  font: var(--fw-regular) 11px/1.3 var(--font-sans);
  color: var(--text-disabled);
}
.side-cat + .side-cat,
.side-pay + .side-pay {
  margin-top: var(--space-3);
}
.side-bar {
  height: 5px;
  border-radius: var(--radius-pill);
  background: var(--surface);
  overflow: hidden;
}
.side-bar span {
  display: block;
  height: 100%;
  border-radius: var(--radius-pill);
}
.side-pay-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-primary);
}

/* Narrow screens: the totals move under the list instead of squeezing it. */
@media (max-width: 1100px) {
  .bookings-layout {
    flex-wrap: wrap;
  }
  .bookings-side {
    width: 100%;
    position: static;
  }
}

/* ---- Phones: last in the file, so these win over the rules above ----
   The form's own grids are sized for a 560px drawer; at 353px two fields
   side by side cut their own labels and placeholders. */
@media (max-width: 700px) {
  .two-col,
  .two-col--wide-left {
    grid-template-columns: minmax(0, 1fr);
  }
  .three-col {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
}
</style>
