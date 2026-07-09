/* Tripyfull Planner — fake data model.
   Plain JS, exposed as window.PlannerData. No design-system dependency. */

const CATEGORY = {
  food:      { label: 'Food',         icon: 'food',     color: 'var(--gold-400)',  soft: 'var(--gold-50)' },
  transport: { label: 'Transport',   icon: 'plane',    color: 'var(--accent)',    soft: 'var(--teal-50)' },
  stay:      { label: 'Stay',  icon: 'bed',      color: 'var(--coral-500)', soft: 'var(--coral-50)' },
  activity:  { label: 'Activities',  icon: 'compass',  color: 'var(--teal-400)',  soft: 'var(--teal-50)' },
  other:     { label: 'Other',      icon: 'tag',      color: 'var(--ink-500)',   soft: 'var(--surface-sunken)' },
};

const PAYMENT_STATUS = {
  paid:    { label: 'Paid',     tone: 'success' },
  partial: { label: 'Partial',     tone: 'warning' },
  unpaid:  { label: 'Unpaid',  tone: 'danger'  },
};

const TRIP_STATUS = {
  draft:     { label: 'Draft',  tone: 'neutral' },
  planned:   { label: 'Planned', tone: 'accent'  },
  active:    { label: 'On the road',    tone: 'brand'   },
  completed: { label: 'Completed', tone: 'success' },
};

const trips = [
  {
    id: 'jp',
    name: 'Tokyo & Kyoto',
    destination: 'Japan',
    start: '2026-06-16', end: '2026-06-23',
    status: 'planned',
    currency: '€',
    wash: 'var(--wash-dusk)',
    planned: 4280, paid: 2640,
  },
  {
    id: 'pt',
    name: 'Portugal Coast',
    destination: 'Lisbon · Porto',
    start: '2026-09-04', end: '2026-09-11',
    status: 'draft',
    currency: '€',
    wash: 'linear-gradient(150deg,#f4ad3c,#e35a38)',
    planned: 2150, paid: 320,
  },
  {
    id: 'pa',
    name: 'Patagonia Trek',
    destination: 'Chile · Argentina',
    start: '2025-11-02', end: '2025-11-14',
    status: 'completed',
    currency: '€',
    wash: 'var(--wash-ocean)',
    planned: 5600, paid: 5600,
  },
];

/* Days for the Japan trip */
const days = [
  { id: 'd1', n: 1, date: '2026-06-16', city: 'Tokyo', activities: ['a1', 'a2', 'a3'] },
  { id: 'd2', n: 2, date: '2026-06-17', city: 'Tokyo', activities: ['a4', 'a5'] },
  { id: 'd3', n: 3, date: '2026-06-18', city: 'Kyoto', activities: ['a6', 'a7', 'a8', 'a9'] },
  { id: 'd4', n: 4, date: '2026-06-19', city: 'Kyoto', activities: [] },
  { id: 'd5', n: 5, date: '2026-06-20', city: 'Osaka', activities: ['a10'] },
  { id: 'd6', n: 6, date: '2026-06-21', city: 'Osaka', activities: [] },
  { id: 'd7', n: 7, date: '2026-06-22', city: 'Nara',  activities: ['a11'] },
  { id: 'd8', n: 8, date: '2026-06-23', city: 'Tokyo', activities: [] },
];

const activities = {
  a1:  { id: 'a1',  title: 'Arrival · Narita', cat: 'transport', start: '07:20', end: '08:00', address: 'Narita Airport, T1', cost: 0,   note: 'N\'EX train to the city' },
  a2:  { id: 'a2',  title: 'Hotel check-in', cat: 'stay',     start: '11:00', end: '11:30', address: 'Shibuya Stream Hotel', cost: 0,   note: 'Early check-in confirmed' },
  a3:  { id: 'a3',  title: 'Dinner — Shibuya',     cat: 'food',      start: '19:30', end: '21:00', address: 'Ichiran Shibuya',      cost: 28,  note: 'Tonkotsu ramen' },
  a4:  { id: 'a4',  title: 'Breakfast — Sarutahiko', cat: 'food',  start: '08:30', end: '09:15', address: 'Ebisu',                cost: 14,  note: 'Coffee and tamago' },
  a5:  { id: 'a5',  title: 'Sensō-ji and Asakusa', cat: 'activity', start: '10:30', end: '13:00', address: 'Asakusa',             cost: 0,   note: 'Temple + Nakamise street' },
  a6:  { id: 'a6',  title: 'Shinkansen to Kyoto',  cat: 'transport', start: '07:00', end: '09:20', address: 'Tokyo → Kyoto',       cost: 96,  note: 'Car 7, seats 11A/B' },
  a7:  { id: 'a7',  title: 'Arashiyama Bamboo Grove', cat: 'activity', start: '10:00', end: '11:30', address: 'Kyoto', cost: 0, note: 'Sunrise before the crowds' },
  a8:  { id: 'a8',  title: 'Lunch — Ramen Sen',  cat: 'food',      start: '13:00', end: '14:00', address: 'Kyoto',               cost: 22,  note: 'Reservation for 2' },
  a9:  { id: 'a9',  title: 'Ryokan Yoshikawa',      cat: 'stay',      start: '20:00', end: '20:30', address: 'Kyoto, room 4',    cost: 0,   note: 'Check-in' },
  a10: { id: 'a10', title: 'Dotonbori street food', cat: 'food',     start: '18:00', end: '20:30', address: 'Osaka',               cost: 35,  note: 'Takoyaki + okonomiyaki' },
  a11: { id: 'a11', title: 'Nara Deer Park',   cat: 'activity',  start: '11:00', end: '14:00', address: 'Nara',                cost: 8,   note: 'Feed the deer' },
};

const bookings = [
  { id: 'b1', cat: 'transport', title: 'Barcelona → Tokyo', provider: 'Qatar Airways', conf: 'QR-8KQ2LX',
    price: 1240, status: 'paid',    from: 'BCN', to: 'NRT', date: '2026-06-16 06:00', dayId: 'd1',
    payments: [ { id: 'p1', amount: 1240, date: '2026-02-10', paid: true } ] },
  { id: 'b2', cat: 'stay', title: 'Shibuya Stream Hotel', provider: 'Booking.com', conf: 'BK-77213',
    price: 860, status: 'partial', checkIn: '2026-06-16', checkOut: '2026-06-18', nights: 2, dayId: 'd1',
    payments: [ { id: 'p2', amount: 260, date: '2026-03-01', paid: true }, { id: 'p3', amount: 600, date: '2026-06-16', paid: false } ] },
  { id: 'b3', cat: 'stay', title: 'Ryokan Yoshikawa', provider: 'direct', conf: 'RY-04',
    price: 540, status: 'unpaid', checkIn: '2026-06-18', checkOut: '2026-06-20', nights: 2, dayId: 'd3',
    payments: [ { id: 'p4', amount: 540, date: '2026-06-18', paid: false } ] },
  { id: 'b4', cat: 'transport', title: 'Tokyo → Kyoto', provider: 'JR Central', conf: 'JR-7-11AB',
    price: 192, status: 'paid', from: 'Tokyo', to: 'Kyoto', date: '2026-06-18 07:00', dayId: 'd3',
    payments: [ { id: 'p5', amount: 192, date: '2026-04-12', paid: true } ] },
  { id: 'b5', cat: 'activity', title: 'Sunrise tour · Arashiyama', provider: 'GetYourGuide', conf: 'GYG-2231',
    price: 76, status: 'partial', date: '2026-06-18 06:00', dayId: 'd3',
    payments: [ { id: 'p6', amount: 38, date: '2026-05-20', paid: true }, { id: 'p7', amount: 38, date: '2026-06-18', paid: false } ] },
];

/* Budget by category (planned vs actual, in trip currency) */
const budgetByCategory = [
  { cat: 'transport', planned: 1528, actual: 1432 },
  { cat: 'stay',      planned: 1400, actual: 260 },
  { cat: 'food',      planned: 720,  actual: 188 },
  { cat: 'activity',  planned: 532,  actual: 84 },
  { cat: 'other',     planned: 100,  actual: 36 },
];

window.PlannerData = {
  CATEGORY, PAYMENT_STATUS, TRIP_STATUS,
  trips, days, activities, bookings, budgetByCategory,
  fmt(n, cur = '€') { return cur + n.toLocaleString('en-US'); },
  dateShort(iso) {
    const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const d = new Date(iso); return d.getDate() + ' ' + M[d.getMonth()];
  },
  dateRange(a, b) { return this.dateShort(a) + ' – ' + this.dateShort(b); },
  dayCost(dayId) {
    const day = days.find(d => d.id === dayId); if (!day) return 0;
    return day.activities.reduce((s, id) => s + (activities[id] ? activities[id].cost : 0), 0);
  },
};
