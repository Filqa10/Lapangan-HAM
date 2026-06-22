export interface PriceSlot {
  startHour: number;
  endHour: number;
  weekdayPrice: number | null;
  fridayPrice: number | null;
  weekendPrice: number;
}

export const BOOKING_PRICE_SLOTS: PriceSlot[] = [
  { startHour: 6, endHour: 8, weekdayPrice: null, fridayPrice: null, weekendPrice: 2600000 },
  { startHour: 8, endHour: 10, weekdayPrice: 1300000, fridayPrice: null, weekendPrice: 2600000 },
  { startHour: 10, endHour: 12, weekdayPrice: 800000, fridayPrice: null, weekendPrice: 1500000 },
  { startHour: 12, endHour: 14, weekdayPrice: 800000, fridayPrice: null, weekendPrice: 1500000 },
  { startHour: 14, endHour: 16, weekdayPrice: 1300000, fridayPrice: 1300000, weekendPrice: 2600000 },
  { startHour: 16, endHour: 18, weekdayPrice: 2000000, fridayPrice: 2300000, weekendPrice: 2600000 },
  { startHour: 18, endHour: 20, weekdayPrice: 2300000, fridayPrice: 2500000, weekendPrice: 2800000 },
  { startHour: 20, endHour: 22, weekdayPrice: 2300000, fridayPrice: 2500000, weekendPrice: 2800000 },
];

export function calculateBookingPrice(
  date: Date,
  startHour: number,
  endHour: number,
): { total: number; dp: number } {
  const day = date.getDay();
  let total = 0;

  for (const slot of BOOKING_PRICE_SLOTS) {
    if (slot.startHour >= startHour && slot.endHour <= endHour) {
      let price = slot.weekendPrice;

      if (day >= 1 && day <= 4) {
        price = slot.weekdayPrice ?? slot.weekendPrice;
      } else if (day === 5) {
        price = slot.fridayPrice ?? slot.weekendPrice;
      }

      total += price;
    }
  }

  return { total, dp: Math.max(total * 0.3, 500000) };
}
