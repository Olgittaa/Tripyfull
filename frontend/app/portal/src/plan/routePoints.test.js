import { describe, expect, it } from 'vitest';
import { collectDayMaps, collectMapPoints, stopNumbers } from './routePoints.js';

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

describe('stopNumbers', () => {
  it('numbers the places and skips the hotel and the flight, pin or no pin', () => {
    const acts = [
      at('ACCOMMODATION', 1, 1, { fromBooking: true }),
      at('SIGHTSEEING', 1, 1),
      at('MEAL', null, null),
      flight(2, 2),
      at('OTHER', 3, 3),
    ];
    const numbers = stopNumbers(acts, false);
    expect([...numbers.values()]).toEqual(['1', '2', '3']);
    expect(numbers.get(acts[1])).toBe('1');
    expect(numbers.get(acts[2])).toBe('2'); // no pin, still a stop you chose
    expect(numbers.get(acts[4])).toBe('3');
    expect(numbers.has(acts[0])).toBe(false);
    expect(numbers.has(acts[3])).toBe(false);
  });

  it('gives a reserve day no numbers at all', () => {
    expect(stopNumbers([at('OTHER', 1, 1), at('OTHER', 2, 2)], true).size).toBe(0);
  });
});

describe('collectDayMaps', () => {
  it('labels each dot with the number the list prints, keeping the count across a pinless stop', () => {
    const maps = collectDayMaps({
      days: [
        day(1, [
          at('SIGHTSEEING', 1, 1),
          at('MEAL', null, null),
          at('OTHER', 2, 2),
          at('ACCOMMODATION', 3, 3, { fromBooking: true }),
        ]),
      ],
    });
    expect(maps).toEqual([
      {
        reserve: false,
        points: [
          { lat: 1, lon: 1, kind: 'stop', label: '1' },
          { lat: 2, lon: 2, kind: 'stop', label: '3' },
          { lat: 3, lon: 3, kind: 'hotel' },
        ],
      },
    ]);
  });

  it('keeps a stop’s number when the airport run before it is left off the map', () => {
    const maps = collectDayMaps({
      days: [
        day(1, [at('OTHER', 50.8, 7.0), flight(50.0, 8.6), at('SIGHTSEEING', 19.9, 99.9)]),
        day(2, [at('SIGHTSEEING', 19.8, 99.8)]),
      ],
    });
    // The drive to the airport is stop 1 in the list but not on the map; the
    // temple after the flight is still stop 2, as the list says.
    expect(maps[0].points).toEqual([{ lat: 19.9, lon: 99.9, kind: 'stop', label: '2' }]);
    expect(maps[1].points).toEqual([{ lat: 19.8, lon: 99.8, kind: 'stop', label: '1' }]);
  });

  it('dots a reserve day without numbers, and gives an empty day an empty map', () => {
    const maps = collectDayMaps({
      days: [
        day(1, [flight(1, 1)]),
        { dayNumber: 2, activities: [at('OTHER', 5, 5), at('OTHER', 6, 6)] },
        { dayNumber: 3, buffer: true, date: '2026-12-20', activities: [at('OTHER', 7, 7)] },
      ],
    });
    expect(maps[0]).toEqual({ reserve: false, points: [] });
    expect(maps[1]).toEqual({
      reserve: true,
      points: [
        { lat: 5, lon: 5, kind: 'stop' },
        { lat: 6, lon: 6, kind: 'stop' },
      ],
    });
    expect(maps[2].reserve).toBe(true);
  });

  it('answers one entry per day, in the order of the days', () => {
    const d = { days: [day(1, []), day(2, [at('OTHER', 1, 1)]), { dayNumber: 3, activities: [] }] };
    expect(collectDayMaps(d).map((m) => m.points.length)).toEqual([0, 1, 0]);
  });
});
