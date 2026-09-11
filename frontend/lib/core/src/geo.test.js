import { expect, it } from 'vitest';
import { distanceMeters } from './geo.js';

it('measures Chiang Rai clock tower to the White Temple at about 12 km', () => {
  const d = distanceMeters([19.9083, 99.831], [19.8243, 99.7633]);
  expect(d).toBeGreaterThan(11_500);
  expect(d).toBeLessThan(12_500);
});

it('is zero for the same point', () => {
  expect(distanceMeters([18.79, 98.99], [18.79, 98.99])).toBe(0);
});
