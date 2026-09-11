import { describe, expect, it } from 'vitest';
import { collectMapPoints } from './routePoints.js';

const at = (type, lat, lon, extra = {}) => ({ type, latitude: lat, longitude: lon, ...extra });
const flight = (lat, lon) => at('TRANSPORT', lat, lon, { fromBooking: true });
const day = (dayNumber, activities) => ({
  date: `2026-12-${12 + dayNumber}`,
  dayNumber,
  activities,
});

describe('collectMapPoints', () => {
  it('keeps the way to the airport and the way home off the map', () => {
    const pts = collectMapPoints({
      days: [
        day(1, [at('OTHER', 50.8, 7.0), flight(50.0, 8.6)]),
        day(2, [
          flight(19.9, 99.9),
          at('OTHER', 19.95, 99.88),
          at('ACCOMMODATION', 19.9, 99.8, { fromBooking: true }),
        ]),
        day(3, [at('SIGHTSEEING', 19.8, 99.7), flight(19.9, 99.9), at('OTHER', 50.8, 7.0)]),
      ],
    });
    expect(pts).toEqual([
      { lat: 19.95, lon: 99.88, kind: 'stop', dayNumber: 2 },
      { lat: 19.9, lon: 99.8, kind: 'hotel', dayNumber: 2 },
      { lat: 19.8, lon: 99.7, kind: 'stop', dayNumber: 3 },
    ]);
  });

  it('leaves a trip without journeys, and a mid-trip flight, alone', () => {
    const days = [
      day(1, [at('OTHER', 1, 1)]),
      day(2, [at('OTHER', 2, 2), flight(2.5, 2.5), at('OTHER', 3, 3)]),
      day(3, [at('OTHER', 4, 4)]),
    ];
    expect(collectMapPoints({ days }).map((p) => p.lat)).toEqual([1, 2, 3, 4]);
  });

  it('skips stops without coordinates and days without a date', () => {
    const pts = collectMapPoints({
      days: [
        day(1, [at('OTHER', null, null), at('OTHER', 1, 1)]),
        { dayNumber: 2, activities: [at('OTHER', 2, 2)] },
      ],
    });
    expect(pts.map((p) => p.lat)).toEqual([1]);
  });
});
