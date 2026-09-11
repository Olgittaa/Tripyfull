import { ownPhotosFirst } from '@tripyfull/core';
// The printed plan: one HTML document built from /api/trips/{id}/export.
//
// Modelled on a travel-agency route book — cover, what is in the plan, a
// day-by-day overview, what to book ahead, a legend, then one section per day
// with its stops — but kept to what prints well and survives a paste into Word:
// real headings, paragraphs and tables, no absolute positioning, no decoration
// that only works on screen. Every photo a place has is offered, but each is
// loaded once before the document is written — links to Google's photo hosts
// expire, and a dead one would print as a broken box.

const TEAL = '#0e5c55';
const INK = '#322a24';
const INK_SOFT = '#6b5f56';
const LINE = '#e4ddd2';

const esc = (s) =>
  String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const parse = (iso) => (iso ? new Date(iso) : null);
const fmtDate = (iso) => {
  const d = parse(iso);
  return d ? `${d.getDate()} ${MONTHS[d.getMonth()]}` : '';
};
// The overview table is read by date: the weekday belongs with it.
const fmtDayDate = (iso) => {
  const d = parse(iso);
  return d ? `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}` : '';
};
const fmtDateLong = (iso) => {
  const d = parse(iso);
  return d
    ? `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
    : '';
};
const fmtTime = (t) => (t ? String(t).slice(0, 5) : '');
const fmtDateTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
const money = (v, cur) => (v == null ? '' : `${Number(v).toFixed(2)} ${cur || ''}`.trim());
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

const MODE_WORD = {
  foot: 'on foot',
  taxi: 'by taxi',
  bus: 'by bus',
  train: 'by train',
  car: 'by car',
  plane: 'by plane',
};
const BOOKING_MODE = {
  FLIGHT: 'Flight',
  TRAIN: 'Train',
  BUS: 'Bus',
  FERRY: 'Ferry',
  TAXI: 'Taxi / transfer',
  CAR_RENTAL: 'Car rental',
  METRO: 'Metro',
  WALK: 'Walk',
};
const PLACE_TYPE_WORD = {
  SIGHTSEEING: 'sights',
  BEACH: 'beaches',
  NATURE: 'nature spots',
  RESTAURANT: 'restaurants',
  MUSEUM: 'museums',
  VIEWPOINT: 'viewpoints',
  PORT: 'ports',
  AIRPORT: 'airports',
  NEIGHBORHOOD: 'neighbourhoods',
  PARK: 'parks',
  SHOP: 'shops & markets',
  OTHER: 'other places',
};

/** Which day the booking is on, for "book ahead" lines. */
const dayOf = (days, iso) => {
  if (!iso) return null;
  const date = String(iso).slice(0, 10);
  return days.find((d) => d.date === date) || null;
};


/** Absolute URL for a stored photo, so the document works outside the app too. */
const photoUrl = (path, apiBase) => (!path ? null : path.startsWith('/') ? apiBase + path : path);

/** Photos per stop; the reference route books use one or two, never a gallery. */
const PHOTOS_PER_STOP = 2;

/**
 * Loads each URL once and resolves with the ones that actually render. A photo
 * that is slow past the timeout counts as missing — better one picture fewer
 * than a document that waits on a dead host.
 */
export function probeImages(urls, timeoutMs = 5000) {
  const unique = [...new Set(urls.filter(Boolean))];
  return Promise.all(
    unique.map(
      (url) =>
        new Promise((resolve) => {
          const img = new Image();
          const done = (ok) => resolve(ok ? url : null);
          const timer = setTimeout(() => done(false), timeoutMs);
          img.onload = () => {
            clearTimeout(timer);
            done(img.naturalWidth > 1);
          };
          img.onerror = () => {
            clearTimeout(timer);
            done(false);
          };
          img.src = url;
        }),
    ),
  ).then((list) => new Set(list.filter(Boolean)));
}

/** Every photo URL the export mentions, absolute — feed for probeImages. */
export function collectPhotoUrls(d, apiBase = '') {
  const out = [];
  for (const day of d.days || []) {
    for (const a of day.activities || []) {
      for (const p of a.placePhotos || []) out.push(photoUrl(p, apiBase));
    }
  }
  for (const p of d.places || []) for (const u of p.photos || []) out.push(photoUrl(u, apiBase));
  return out;
}

/** What the route map needs: every stop with coordinates, in visiting order. */
export function collectMapPoints(d) {
  const pts = [];
  for (const day of d.days || []) {
    if (!day.date) continue;
    for (const a of day.activities || []) {
      if (a.latitude == null || a.longitude == null) continue;
      if (a.fromBooking && a.type === 'TRANSPORT') continue; // airports and stations are not the route
      pts.push({
        lat: Number(a.latitude),
        lon: Number(a.longitude),
        kind: a.type === 'ACCOMMODATION' ? 'hotel' : 'stop',
        rating: a.placeRating || 3,
        dayNumber: day.dayNumber,
      });
    }
  }
  return pts;
}

export function buildTripDocument(
  d,
  { apiBase = '', currency = 'EUR', liveUrls = null, mapImage = null } = {},
) {
  // With no probe result, trust only what this app stores itself.
  const usable = (url) => (liveUrls ? liveUrls.has(url) : url.startsWith(apiBase + '/api/'));
  const livePhotos = (list) =>
    ownPhotosFirst(list)
      .map((p) => photoUrl(p, apiBase))
      .filter(usable);
  const photosFor = (a) => livePhotos(a.placePhotos).slice(0, PHOTOS_PER_STOP);
  const cur = d.baseCurrency || currency;
  const days = d.days || [];
  const dated = days.filter((x) => x.date && !x.buffer);
  const reserve = days.filter((x) => x.buffer || !x.date);
  const bookings = d.bookings || [];
  const todos = (d.todos || []).filter((t) => !t.done);
  const total = dated.length;

  // ---- cover ----
  const cities = [];
  for (const day of dated) {
    // Cities only — a hotel name is not a place on a route.
    if (day.city && cities[cities.length - 1] !== day.city) cities.push(day.city);
  }
  // The must-sees of the shortlist, one photo each, as the cover's collage — a
  // table, because that is the one layout Word keeps. Falls back to any place
  // with a photo, then to a single picture, then to none.
  const shortlist = d.places || [];
  let collage = shortlist
    .filter((p) => p.rating === 5 && livePhotos(p.photos).length)
    .map((p) => ({ name: p.name, url: livePhotos(p.photos)[0] }));
  if (collage.length < 2) {
    const more = shortlist
      .filter((p) => p.rating < 5 && livePhotos(p.photos).length)
      .map((p) => ({ name: p.name, url: livePhotos(p.photos)[0] }));
    collage = collage.concat(more);
  }
  collage = collage.slice(0, 6);
  const cols = collage.length >= 5 ? 3 : collage.length >= 2 ? 2 : 1;
  const collageHtml = collage.length
    ? `<table class="collage collage--${cols}"><tbody>${Array.from(
        { length: Math.ceil(collage.length / cols) },
        (_, r) =>
          `<tr>${collage
            .slice(r * cols, r * cols + cols)
            .map(
              (c) =>
                `<td><img src="${esc(c.url)}" alt=""><div class="collage-cap">${esc(c.name)}</div></td>`,
            )
            .join('')}</tr>`,
      ).join('')}</tbody></table>`
    : '';
  const cover = `
    <section class="cover">
      <div class="brand">Tripyfull · trip plan</div>
      <h1 class="cover-title">${esc(d.title)}</h1>
      <p class="cover-sub">${plural(total, 'day', 'days')}${reserve.length ? ` + ${plural(reserve.length, 'reserve day', 'reserve days')}` : ''}${
        d.startDate ? ` · ${fmtDateLong(d.startDate)} – ${fmtDateLong(d.endDate)}` : ''
      }</p>
      ${d.destination ? `<p class="cover-dest">${esc(d.destination)}</p>` : ''}
      ${cities.length ? `<p class="cover-route">${cities.map(esc).join(' → ')}</p>` : ''}
      ${collageHtml}
    </section>`;

  // ---- the route on a map ----
  const mapPage = mapImage
    ? `
    <section class="page map-page">
      <h2>The route</h2>
      <img class="route-map" src="${mapImage}" alt="Route map">
      <p class="map-legend">
        <span class="lg lg-s"></span> stop &nbsp; <span class="lg lg-h"></span> hotel &nbsp;
        <span class="lg-line"></span> route, day by day
      </p>
    </section>`
    : '';

  // ---- what is in the plan ----
  const stops = dated.flatMap((x) => x.activities.filter((a) => !a.fromBooking));
  const byType = new Map();
  for (const a of stops) {
    const t = a.placeType || a.type || 'OTHER';
    byType.set(t, (byType.get(t) || 0) + 1);
  }
  const included = stops.length
    ? `
    <section class="page">
      <h2>What is in the plan</h2>
      <ul class="counts">
        <li><b>${stops.length}</b> stops over ${plural(total, 'day', 'days')}</li>
        ${[...byType.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([t, n]) => `<li><b>${n}</b> ${esc(PLACE_TYPE_WORD[t] || t.toLowerCase())}</li>`)
          .join('')}
      </ul>
    </section>`
    : '';

  // ---- overview by day ----
  const overview = `
    <section class="page">
      <h2>Day by day</h2>
      <table class="overview">
        <thead><tr><th>Day</th><th>Date</th><th>Where</th><th>Plan</th><th>Night</th></tr></thead>
        <tbody>
          ${dated
            .map((day) => {
              const names = day.activities.filter((a) => !a.fromBooking).map((a) => esc(a.name));
              return `<tr>
                <td class="num">${day.dayNumber}</td>
                <td class="date">${fmtDayDate(day.date)}</td>
                <td>${esc(day.city || '')}</td>
                <td>${names.length ? names.join(' – ') : '<span class="muted">—</span>'}</td>
                <td>${esc(day.overnightStay || '')}</td>
              </tr>`;
            })
            .join('')}
        </tbody>
      </table>
      ${
        reserve.length
          ? `<p class="note"><b>Reserve:</b> ${reserve.map((r) => r.activities.map((a) => esc(a.name)).join(', ') || 'empty').join(' · ')}</p>`
          : ''
      }
    </section>`;

  // ---- book ahead ----
  const transport = bookings.filter((b) => b.category === 'TRANSPORTATION');
  const stays = bookings.filter((b) => b.category === 'ACCOMMODATION');
  const activities = bookings.filter((b) => b.category === 'ACTIVITY');
  const ticketed = dated.flatMap((day) =>
    day.activities.filter((a) => a.needsBooking && !a.fromBooking).map((a) => ({ day, a })),
  );
  const paidLabel = (b) => {
    const paid = b.paidSimple || (b.fullPrice && Number(b.paidTotal) >= Number(b.fullPrice));
    return paid
      ? 'paid'
      : Number(b.paidTotal) > 0
        ? `${money(b.paidTotal, b.priceCurrency)} paid`
        : 'to pay';
  };
  const bookingLine = (b) => {
    const bits = [];
    if (b.category === 'TRANSPORTATION' && b.transportMode === 'CAR_RENTAL') {
      bits.push('Car rental');
      if (b.departureAt)
        bits.push(
          `pick-up ${fmtDateTime(b.departureAt)}${b.fromPlace ? ` at ${esc(b.fromPlace)}` : ''}`,
        );
      if (b.arrivalAt)
        bits.push(
          `drop-off ${fmtDateTime(b.arrivalAt)}${b.toPlace && b.toPlace !== b.fromPlace ? ` at ${esc(b.toPlace)}` : ''}`,
        );
      if (b.seat) bits.push(esc(b.seat));
    } else if (b.category === 'TRANSPORTATION') {
      if (b.transportMode) bits.push(BOOKING_MODE[b.transportMode] || b.transportMode);
      if (b.fromPlace || b.toPlace)
        bits.push(`${esc(b.fromPlace || '?')} → ${esc(b.toPlace || '?')}`);
      if (b.departureAt)
        bits.push(
          fmtDateTime(b.departureAt) + (b.arrivalAt ? ` – ${fmtDateTime(b.arrivalAt)}` : ''),
        );
      if (b.flightNumber) bits.push(esc(b.flightNumber));
      if (b.seat) bits.push(`seat ${esc(b.seat)}`);
    } else if (b.category === 'ACCOMMODATION') {
      if (b.checkIn && b.checkOut) {
        const nights = Math.round((parse(b.checkOut) - parse(b.checkIn)) / 86400000);
        bits.push(
          `${fmtDate(b.checkIn)} – ${fmtDate(b.checkOut)}, ${plural(nights, 'night', 'nights')}`,
        );
      }
      if (b.checkInTime || b.checkOutTime)
        bits.push(
          `check-in ${fmtTime(b.checkInTime) || '—'}, check-out ${fmtTime(b.checkOutTime) || '—'}`,
        );
      if (b.address) bits.push(esc(b.address));
      else if (b.accommodationCity) bits.push(esc(b.accommodationCity));
    } else {
      if (b.departureAt) bits.push(fmtDateTime(b.departureAt));
      if (b.fromPlace) bits.push(esc(b.fromPlace));
    }
    if (b.vendor) bits.push(esc(b.vendor));
    if (b.confirmationNumber) bits.push(`ref ${esc(b.confirmationNumber)}`);
    if (b.fullPrice) bits.push(`${money(b.fullPrice, b.priceCurrency)} · ${paidLabel(b)}`);
    return `<li><b>${esc(b.name)}.</b> ${bits.join(' · ')}${
      b.bookingUrl ? ` <a href="${esc(b.bookingUrl)}">${esc(b.bookingUrl)}</a>` : ''
    }${b.notes ? `<div class="muted">${esc(b.notes)}</div>` : ''}</li>`;
  };
  const group = (title, items) =>
    items.length
      ? `<h3>${title}</h3><ul class="plain">${items.map(bookingLine).join('')}</ul>`
      : '';
  const bookAhead =
    bookings.length || ticketed.length
      ? `
    <section class="page">
      <h2>Booked & to book ahead</h2>
      ${group('Getting there and around', transport)}
      ${group('Where you sleep', stays)}
      ${group('Tours and tickets', activities)}
      ${
        ticketed.length
          ? `<h3>Places that need tickets in advance</h3><ul class="plain">${ticketed
              .map(
                ({ day, a }) =>
                  `<li><b>${esc(a.name)}</b> — day ${day.dayNumber}, ${fmtDate(day.date)}${a.startTime ? `, ${fmtTime(a.startTime)}` : ''}${
                    a.placeLink ? ` · <a href="${esc(a.placeLink)}">${esc(a.placeLink)}</a>` : ''
                  }</li>`,
              )
              .join('')}</ul>`
          : ''
      }
    </section>`
      : '';

  // ---- to-do ----
  const todoSection = todos.length
    ? `
    <section class="page">
      <h2>Still to do</h2>
      <table class="todos">
        <tbody>${todos
          .sort((a, b) => String(a.dueDate || '9').localeCompare(String(b.dueDate || '9')))
          .map(
            (t) =>
              `<tr><td class="box">☐</td><td>${esc(t.title)}${t.groupName ? ` <span class="muted">· ${esc(t.groupName)}</span>` : ''}</td><td class="date">${fmtDate(t.dueDate)}</td></tr>`,
          )
          .join('')}</tbody>
      </table>
    </section>`
    : '';

  // ---- legend ----
  const legend = `
    <section class="legend">
      <h2>Reading the days</h2>
      <ul class="plain legend-list">
        <li><b>🕘</b> start time of a stop, when set</li>
        <li><b>⏱</b> time to allow at the place</li>
        <li><b>🎟</b> needs a ticket or a reservation in advance</li>
        <li><b>→</b> how to reach the next stop</li>
        <li><b>🏨</b> where the night is spent</li>
      </ul>
    </section>`;

  // ---- one section per day ----
  const dayPages = days
    .map((day, idx) => {
      const isReserve = day.buffer || !day.date;
      const head = isReserve
        ? `Reserve day${reserve.indexOf(day) >= 0 ? ' ' + (reserve.indexOf(day) + 1) : ''}`
        : `Day ${day.dayNumber}`;
      const progress = isReserve
        ? ''
        : `<div class="progress">${dated
            .map(
              (x) =>
                `<span class="${x.dayNumber === day.dayNumber ? 'on' : x.dayNumber < day.dayNumber ? 'done' : ''}"></span>`,
            )
            .join('')}<span class="progress-label">${day.dayNumber}/${total}</span></div>`;
      const acts = day.activities;
      let n = 0; // numbers only the places; the hotel and travel rows are not stops you chose
      const stopsHtml = acts.length
        ? acts
            .map((a, i) => {
              const hotel = a.type === 'ACCOMMODATION';
              const isTransport = a.fromBooking && a.type === 'TRANSPORT';
              const cls = hotel
                ? 'stop stop--hotel'
                : isTransport
                  ? 'stop stop--transport'
                  : 'stop';
              const num = hotel || isTransport ? '' : `<span class="stop-num">${++n}</span>`;
              const meta = [];
              if (a.startTime)
                meta.push(
                  `🕘 ${fmtTime(a.startTime)}${a.endTime ? ` – ${fmtTime(a.endTime)}` : ''}`,
                );
              if (a.placeVisitMinutes) meta.push(`⏱ ${a.placeVisitMinutes} min`);
              if (a.needsBooking) meta.push('🎟 book ahead');
              const photos = photosFor(a);
              const next = acts[i + 1];
              const travel =
                a.travelModeToNext && next && !hotel && !isTransport
                  ? `<p class="travel">→ ${esc(next.name)} ${MODE_WORD[a.travelModeToNext] || a.travelModeToNext}</p>`
                  : '';
              return `
              <article class="${cls}">
                <h4>${hotel ? '🏨 ' : ''}${num}${esc(a.name)}</h4>
                ${meta.length ? `<p class="meta">${meta.join(' &nbsp;·&nbsp; ')}</p>` : ''}
                ${a.address ? `<p class="addr">${esc(a.address)}</p>` : ''}
                ${
                  photos.length
                    ? `<div class="photos photos--${photos.length}">${photos.map((u) => `<img class="photo" src="${esc(u)}" alt="">`).join('')}</div>`
                    : ''
                }
                ${a.placeDescription ? `<p>${esc(a.placeDescription)}</p>` : ''}
                ${a.notes ? `<p class="notes">${esc(a.notes)}</p>` : ''}
                ${a.costEstimate ? `<p class="muted">~${money(a.costEstimate, a.costCurrency || cur)}</p>` : ''}
                ${a.placeLink ? `<p class="muted"><a href="${esc(a.placeLink)}">${esc(a.placeLink)}</a></p>` : ''}
                ${travel}
              </article>`;
            })
            .join('')
        : '<p class="muted">Nothing planned yet.</p>';
      return `
    <section class="page day">
      <div class="day-head">
        <div>
          <div class="eyebrow">${head}${day.date ? ` · ${fmtDateLong(day.date)}` : ''}</div>
          <h2>${esc(day.city || (isReserve ? 'Spare day' : head))}</h2>
        </div>
      </div>
      ${progress}
      ${day.notes ? `<p class="day-notes">${esc(day.notes)}</p>` : ''}
      ${stopsHtml}
      ${day.overnightStay && !acts.some((a) => a.type === 'ACCOMMODATION') ? `<p class="overnight">🏨 Overnight: ${esc(day.overnightStay)}</p>` : ''}
    </section>`;
    })
    .join('');

  const css = `
    @page { size: A4; margin: 18mm 16mm 20mm; }
    html, body { margin: 0; padding: 0; }
    body { font: 11pt/1.45 "Hanken Grotesk", "Helvetica Neue", Arial, sans-serif; color: ${INK}; max-width: 178mm; margin: 0 auto; padding: 16px; }
    h1, h2, h3, h4 { font-family: "Bricolage Grotesque", Georgia, "Times New Roman", serif; font-weight: 600; color: ${INK}; margin: 0; }
    h2 { font-size: 22pt; line-height: 1.15; padding-bottom: 6px; border-bottom: 2px solid ${TEAL}; margin-bottom: 14px; }
    h3 { font-size: 13pt; color: ${TEAL}; margin: 16px 0 6px; }
    h4 { font-size: 12.5pt; margin: 0 0 2px; }
    p { margin: 4px 0; }
    a { color: ${TEAL}; word-break: break-all; }
    .muted { color: ${INK_SOFT}; }
    .page { page-break-before: always; break-before: page; padding-top: 4px; }
    .cover { min-height: 60vh; display: flex; flex-direction: column; justify-content: center; text-align: center; padding: 40px 0; }
    .brand { font-size: 9pt; letter-spacing: 0.18em; text-transform: uppercase; color: ${TEAL}; margin-bottom: 26px; }
    .cover-title { font-size: 34pt; line-height: 1.05; font-weight: 700; }
    .cover-sub { font-size: 13pt; color: ${INK_SOFT}; margin-top: 12px; }
    .cover-dest { font-size: 12pt; margin-top: 4px; }
    .cover-route { font-size: 10.5pt; color: ${INK_SOFT}; margin-top: 18px; }
    ul.counts { list-style: none; padding: 0; margin: 0; columns: 2; column-gap: 24px; }
    ul.counts li { padding: 3px 0; break-inside: avoid; }
    ul.counts b { color: ${TEAL}; }
    ul.plain { list-style: none; padding: 0; margin: 0; }
    ul.plain li { padding: 5px 0; border-bottom: 1px solid ${LINE}; }
    table { width: 100%; border-collapse: collapse; }
    table.overview th { text-align: left; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.08em; color: ${INK_SOFT}; padding: 4px 6px; border-bottom: 2px solid ${TEAL}; }
    table.overview td { padding: 6px; border-bottom: 1px solid ${TEAL}; vertical-align: top; }
    table td.num { font-weight: 700; width: 28px; }
    table td.date { white-space: nowrap; color: ${INK_SOFT}; width: 56px; }
    table.todos td { padding: 5px 6px; border-bottom: 1px solid ${LINE}; }
    table.todos td.box { width: 18px; font-size: 13pt; }
    .note { margin-top: 12px; font-size: 10pt; }
    .legend { margin-top: 28px; }
    .legend-list li { border: none; padding: 2px 0; }
    .eyebrow { font-size: 9pt; letter-spacing: 0.12em; text-transform: uppercase; color: ${TEAL}; margin-bottom: 4px; }
    .day h2 { border: none; padding: 0; margin-bottom: 8px; font-size: 24pt; }
    .progress { display: flex; align-items: center; gap: 5px; margin: 6px 0 18px; }
    .progress span { width: 9px; height: 9px; border: 1.5px solid ${TEAL}; border-radius: 50%; display: inline-block; }
    .progress span.on { background: ${TEAL}; width: 13px; height: 13px; }
    .progress span.done { background: #c3ddd8; }
    .progress-label { border: none !important; width: auto !important; height: auto !important; margin-left: 6px; font-size: 10pt; color: ${INK_SOFT}; }
    .day-notes { background: #f6f1e8; border-radius: 6px; padding: 8px 10px; margin-bottom: 12px; }
    .stop { padding: 10px 0 12px; border-bottom: 1px solid ${LINE}; break-inside: avoid; }
    .stop-num { display: inline-block; min-width: 22px; height: 22px; line-height: 22px; text-align: center; border-radius: 50%; background: ${TEAL}; color: #fff; font: 700 10pt/22px "Hanken Grotesk", Arial, sans-serif; margin-right: 8px; vertical-align: 2px; }
    .stop--hotel h4, .stop--transport h4 { color: ${TEAL}; font-size: 11.5pt; }
    .stop--hotel, .stop--transport { padding: 6px 0 8px; }
    .meta { font-size: 10pt; color: ${INK_SOFT}; }
    .addr { font-size: 10pt; color: ${INK_SOFT}; }
    .photos { display: flex; gap: 8px; margin: 8px 0; }
    .photo { display: block; width: 100%; max-height: 70mm; object-fit: cover; border-radius: 6px; }
    .photos--2 .photo { width: 50%; max-height: 55mm; }
    table.collage { margin-top: 26px; border-collapse: separate; border-spacing: 6px; }
    table.collage td { padding: 0; vertical-align: top; text-align: left; }
    table.collage img { display: block; width: 100%; height: 62mm; object-fit: cover; border-radius: 6px; }
    table.collage--3 img { height: 46mm; }
    table.collage--1 img { height: 110mm; }
    .collage-cap { font-size: 8.5pt; color: ${INK_SOFT}; margin-top: 3px; }
    .route-map { display: block; width: 100%; border-radius: 6px; border: 1px solid ${LINE}; }
    .map-legend { font-size: 9.5pt; color: ${INK_SOFT}; margin-top: 8px; }
    .lg { display: inline-block; width: 10px; height: 10px; border-radius: 50%; vertical-align: -1px; }
    .lg-s { background: #e35a38; }
    .lg-h { background: ${TEAL}; border-radius: 2px; }
    .lg-line { display: inline-block; width: 22px; height: 3px; background: ${TEAL}; vertical-align: 2px; }
    .notes { font-style: italic; }
    .travel { font-size: 10pt; color: ${TEAL}; margin-top: 8px; }
    .overnight { margin-top: 14px; font-weight: 600; }
    .toolbar { position: fixed; top: 0; left: 0; right: 0; display: flex; gap: 8px; justify-content: center; padding: 10px; background: #fff; border-bottom: 1px solid ${LINE}; z-index: 9; }
    .toolbar button { font: 600 10.5pt "Hanken Grotesk", Arial, sans-serif; padding: 8px 14px; border-radius: 999px; border: 1.5px solid ${TEAL}; background: ${TEAL}; color: #fff; cursor: pointer; }
    .toolbar button.secondary { background: #fff; color: ${TEAL}; }
    body.has-toolbar { padding-top: 64px; }
    @media print { .toolbar { display: none; } body.has-toolbar { padding-top: 0; } body { padding: 0; max-width: none; } }
  `;

  const body = `${cover}${mapPage}${included}${overview}${bookAhead}${todoSection}${legend}${dayPages}`;
  return {
    title: d.title,
    css,
    body,
    /** Whole document, for a print window or a .doc file. */
    html: (withToolbar = false) =>
      `<!doctype html><html><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><title>${esc(d.title)}</title><style>${css}</style></head>` +
      `<body class="${withToolbar ? 'has-toolbar' : ''}">${
        withToolbar
          ? `<div class="toolbar"><button onclick="window.print()">Print</button><button class="secondary" onclick="window.__saveDoc && window.__saveDoc()">Save for Word (.doc)</button></div>`
          : ''
      }${body}</body></html>`,
  };
}
