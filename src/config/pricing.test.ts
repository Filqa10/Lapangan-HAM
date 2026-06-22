import { describe, expect, it } from 'vitest';

import { calculateBookingPrice } from './pricing';

describe('Pricing Calculator', () => {
  it('calculates weekday morning price correctly', () => {
    const date = new Date('2026-06-15');

    const result = calculateBookingPrice(date, 8, 10);

    expect(result.total).toBe(1300000);
    expect(result.dp).toBe(500000);
  });

  it('calculates weekend evening price correctly', () => {
    const date = new Date('2026-06-21');

    const result = calculateBookingPrice(date, 18, 20);

    expect(result.total).toBe(2800000);
    expect(result.dp).toBe(840000);
  });
});
