import { describe, expect, it } from 'vitest';
import { buildLegs, legData, legMode, legTotals, mapSegments, nightShownInPlan } from './stops.js';

const pin = (id, lat, lon, extra = {}) => ({ id, latitude: lat, longitude: lon, ...extra });

describe('legMode', () => {
  it('prefers what the server computed for, then the choice, then walking', () => {
    expect(legMode({ travelMode: 'car', travelModeToNext: 'bus' })).toBe('car');
    expect(legMode({ travelModeToNext: 'bus' })).toBe('bus');
    expect(legMode({ travelModeToNext: 'plane' })).toBe('foot');
    expect(legMode({})).toBe('foot');
  });
});

describe('legData', () => {
  it('is unknown, then no route, then the numbers', () => {
    expect(legData({ travelKnown: false })).toBeUndefined();
    expect(legData({ travelKnown: true, travelSeconds: null })).toBeNull();
    expect(
      legData({ travelKnown: true, travelSeconds: 600, travelMeters: 900, travelNote: 'RTC Bus' }),
    ).toMatchObject({ durationSec: 600, distanceM: 900, note: 'RTC Bus' });
  });
});

describe('buildLegs', () => {
  const temple = pin('a', 19.82, 99.76, {
    travelKnown: true,
    travelSeconds: 1200,
    travelMeters: 20000,
  });
  const lunch = { id: 'b' }; // no pin: the leg skips it
  const flight = pin('c', 19.95, 99.88, {
    fromBooking: true,
    type: 'TRANSPORT',
    bookingDepartureAt: '2026-12-11T18:15:00',
    bookingArrivalAt: '2026-12-11T19:30:00',
    bookingToLatitude: 18.77,
    bookingToLongitude: 98.96,
    travelKnown: true,
    travelSeconds: 300,
    travelMeters: 2000,
  });
  const hotel = pin('d', 18.79, 98.99, { type: 'ACCOMMODATION' });

  it("pairs consecutive pinned stops and starts a same-day journey's leg where it lands", () => {
    const legs = buildLegs([temple, lunch, flight, hotel]);
    expect(legs.map((l) => l.fromId)).toEqual(['a', 'c']);
    expect(legs[0].to).toEqual([19.95, 99.88]);
    expect(legs[1].from).toEqual([18.77, 98.96]);
  });

  it('totals only when every leg is known', () => {
    const legs = buildLegs([temple, flight, hotel]);
    expect(legTotals(legs)).toEqual({ durationSec: 1500, distanceM: 22000 });
    expect(legTotals(buildLegs([temple, { ...flight, travelKnown: false }, hotel]))).toBeNull();
    expect(legTotals([])).toBeNull();
  });

  it('draws a straight segment without geometry and the journey as the crow flies', () => {
    const segments = mapSegments([temple, flight, hotel], buildLegs([temple, flight, hotel]));
    expect(segments[0].points).toEqual([
      [19.82, 99.76],
      [19.95, 99.88],
    ]);
    expect(segments.at(-1)).toEqual({
      mode: 'plane',
      points: [
        [19.95, 99.88],
        [18.77, 98.96],
      ],
    });
  });
});

describe('nightShownInPlan', () => {
  const checkIn = { type: 'ACCOMMODATION', fromBooking: true, name: 'Check in · Hotel' };
  const checkOut = { type: 'ACCOMMODATION', fromBooking: true, name: 'Check out · Hotel' };
  const ownHotel = { type: 'ACCOMMODATION', name: "Cousin's flat" };
  const nightFlight = {
    type: 'TRANSPORT',
    fromBooking: true,
    bookingArrivalAt: '2026-12-11T07:00:00',
  };

  it('counts a check-in, an overnight row or your own hotel stop', () => {
    expect(nightShownInPlan([checkIn], '2026-12-10')).toBe(true);
    expect(nightShownInPlan([ownHotel], '2026-12-10')).toBe(true);
  });
  it('does not count the morning after', () => {
    expect(nightShownInPlan([checkOut], '2026-12-10')).toBe(false);
  });
  it('counts a journey that lands the next day, not one that lands today', () => {
    expect(nightShownInPlan([nightFlight], '2026-12-10')).toBe(true);
    expect(nightShownInPlan([nightFlight], '2026-12-11')).toBe(false);
    expect(nightShownInPlan([nightFlight], null)).toBe(false);
  });
});
