import { describe, expect, it } from 'vitest';
import { formatDistance, formatDuration, formatMinutes } from './format.js';

describe('formatDuration', () => {
  it('never says less than a minute', () => {
    expect(formatDuration(0)).toBe('1 min');
    expect(formatDuration(20)).toBe('1 min');
  });
  it('rounds to minutes and folds hours', () => {
    expect(formatDuration(1500)).toBe('25 min');
    expect(formatDuration(6000)).toBe('1 h 40 min');
    expect(formatDuration(7200)).toBe('2 h');
  });
});

describe('formatMinutes', () => {
  it('handles zero and whole hours', () => {
    expect(formatMinutes(0)).toBe('0 min');
    expect(formatMinutes(120)).toBe('2 h');
    expect(formatMinutes(61)).toBe('1 h 1 min');
  });
});

describe('formatDistance', () => {
  it('uses metres under a kilometre and one decimal above', () => {
    expect(formatDistance(350.4)).toBe('350 m');
    expect(formatDistance(12_440)).toBe('12.4 km');
  });
});
