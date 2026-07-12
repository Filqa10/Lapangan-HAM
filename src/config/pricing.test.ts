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

describe('calculateBookingPrice operating hours', () => {
  it('returns zero for Friday morning closed hours (6-14)', () => {
    const friday = new Date('2026-07-17'); // Friday
    expect(calculateBookingPrice(friday, 6, 8)).toEqual({ total: 0, dp: 0 });
    expect(calculateBookingPrice(friday, 8, 10)).toEqual({ total: 0, dp: 0 });
    expect(calculateBookingPrice(friday, 10, 12)).toEqual({ total: 0, dp: 0 });
    expect(calculateBookingPrice(friday, 12, 14)).toEqual({ total: 0, dp: 0 });
    expect(calculateBookingPrice(friday, 6, 14)).toEqual({ total: 0, dp: 0 });
  });

  it('returns valid price for Friday afternoon hours (14-22)', () => {
    const friday = new Date('2026-07-17'); // Friday
    const result = calculateBookingPrice(friday, 14, 16);
    expect(result.total).toBeGreaterThan(0);
    expect(result.dp).toBe(Math.max(result.total * 0.3, 500000));
  });

  it('returns zero for Mon-Thu morning closed hours (6-8)', () => {
    const monday = new Date('2026-07-13'); // Monday
    expect(calculateBookingPrice(monday, 6, 8)).toEqual({ total: 0, dp: 0 });
  });

  it('returns valid price for Mon-Thu open hours (8-22)', () => {
    const monday = new Date('2026-07-13'); // Monday
    const result = calculateBookingPrice(monday, 8, 10);
    expect(result.total).toBeGreaterThan(0);
  });
});
