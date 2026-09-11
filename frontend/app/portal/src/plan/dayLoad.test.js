import { describe, expect, it } from 'vitest';
import { dayLoad, journeyMinutesOn, minutesBetween } from './dayLoad.js';

describe('minutesBetween', () => {
  it('reads the clock and refuses negative spans', () => {
    expect(minutesBetween({ startTime: '09:30', endTime: '11:00' })).toBe(90);
    expect(minutesBetween({ startTime: '11:00', endTime: '09:30' })).toBe(0);
    expect(minutesBetween({ startTime: '09:30' })).toBe(0);
  });
});

describe('journeyMinutesOn', () => {
  const flight = {
    bookingDepartureAt: '2026-12-10T20:55:00',
    bookingArrivalAt: '2026-12-11T07:00:00',
  };
  it('splits an overnight flight between its two days', () => {
    expect(journeyMinutesOn(flight, '2026-12-10')).toBe(185);
    expect(journeyMinutesOn(flight, '2026-12-11')).toBe(420);
    expect(journeyMinutesOn(flight, '2026-12-12')).toBe(0);
  });
  it('falls back to the stop clock without booking times', () => {
    expect(journeyMinutesOn({ startTime: '10:00', endTime: '10:45' }, '2026-12-10')).toBe(45);
  });
});

describe('dayLoad', () => {
  const hotel = { id: 'h', type: 'ACCOMMODATION' };
  const temple = { id: 't', startTime: '09:30', endTime: '11:30', placeId: 'p1' };
  const lunch = { id: 'l', placeId: 'p2' };
  const cafe = { id: 'c' };
  const depart = {
    id: 'd',
    fromBooking: true,
    type: 'TRANSPORT',
    bookingDepartureAt: '2026-12-11T18:15:00',
    bookingArrivalAt: '2026-12-11T19:30:00',
  };
  const arrive = {
    id: 'a',
    fromBooking: true,
    type: 'TRANSPORT',
    bookingDepartureAt: '2026-12-11T18:15:00',
    bookingArrivalAt: '2026-12-11T19:30:00',
  };

  it('counts stops, clocks, estimates and the unknown, and a journey once', () => {
    const load = dayLoad({
      activities: [hotel, temple, lunch, cafe, depart, arrive],
      date: '2026-12-11',
      routeSeconds: 1800,
      visitMinutesFor: (a) => (a.placeId === 'p2' ? 60 : null),
    });
    expect(load).toEqual({ stops: 3, visitMin: 180, travelMin: 30 + 75, untimed: 1 });
  });

  it('has nothing on the move while the legs are unknown', () => {
    expect(
      dayLoad({ activities: [temple], date: '2026-12-11', routeSeconds: null }).travelMin,
    ).toBe(0);
  });
});
