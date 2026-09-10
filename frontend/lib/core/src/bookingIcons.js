/**
 * The emoji a booking shows: the way it travels where there is one, else its
 * category. Shared by the bookings page and the trip overview.
 */
export const CATEGORY_EMOJI = {
  TRANSPORTATION: '\u2708\uFE0F',
  ACCOMMODATION: '\u{1F3E8}',
  ACTIVITY: '\u{1F3AB}',
};

// A journey shows what it travels by: a plane on the ferry row said nothing.
export const MODE_EMOJI = {
  FLIGHT: '\u2708\uFE0F',
  TRAIN: '\u{1F686}',
  BUS: '\u{1F68C}',
  FERRY: '\u26F4\uFE0F',
  TAXI: '\u{1F695}',
  CAR_RENTAL: '\u{1F697}',
  METRO: '\u{1F687}',
  WALK: '\u{1F6B6}',
};

export const MODE_LABEL = {
  FLIGHT: 'Flight',
  TRAIN: 'Train',
  BUS: 'Bus',
  FERRY: 'Ferry',
  TAXI: 'Taxi',
  CAR_RENTAL: 'Car pick-up',
  METRO: 'Metro',
  WALK: 'Walk',
};

export const catEmoji = (c) => CATEGORY_EMOJI[c] ?? '\u{1F4CB}';

export const bookingEmoji = (b) =>
  (b.category === 'TRANSPORTATION' && MODE_EMOJI[b.transportMode]) || catEmoji(b.category);
