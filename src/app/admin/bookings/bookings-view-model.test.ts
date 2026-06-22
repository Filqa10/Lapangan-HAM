import { describe, expect, it, vi } from 'vitest';

import { buildAdminBookingRows, buildAdminBookingsLoadMessage } from './bookings-view-model';

describe('buildAdminBookingRows', () => {
  it('selects the latest pending DP proof for pending bookings', async () => {
    const signProofUrl = vi.fn(async (path: string) => `signed:${path}`);

    const rows = await buildAdminBookingRows(
      [
        makeBooking({
          status: 'pending',
          payments: [
            makePayment({
              receipt_url: 'proofs/dp-old.png',
              payment_type: 'dp',
              status: 'pending',
              created_at: '2026-06-18T10:00:00.000Z',
            }),
            makePayment({
              receipt_url: 'proofs/dp-new.png',
              payment_type: 'dp',
              status: 'pending',
              created_at: '2026-06-19T10:00:00.000Z',
            }),
            makePayment({
              receipt_url: 'proofs/final.png',
              payment_type: 'final',
              status: 'pending',
              created_at: '2026-06-20T10:00:00.000Z',
            }),
          ],
        }),
      ],
      signProofUrl,
    );

    expect(signProofUrl).toHaveBeenCalledWith('proofs/dp-new.png');
    expect(rows[0]).toMatchObject({
      customerName: 'Alex',
      customerEmail: 'alex@example.com',
      customerPhone: '08123456789',
      receiptUrl: 'signed:proofs/dp-new.png',
      receiptUnavailable: false,
    });
  });

  it('prefers the latest approved final proof for confirmed bookings and falls back to approved DP', async () => {
    const signProofUrl = vi.fn(async (path: string) => `signed:${path}`);

    const confirmedRows = await buildAdminBookingRows(
      [
        makeBooking({
          status: 'confirmed',
          payments: [
            makePayment({
              receipt_url: 'proofs/dp-approved.png',
              payment_type: 'dp',
              status: 'approved',
              created_at: '2026-06-19T10:00:00.000Z',
            }),
            makePayment({
              receipt_url: 'proofs/final-approved.png',
              payment_type: 'final',
              status: 'approved',
              created_at: '2026-06-20T10:00:00.000Z',
            }),
          ],
        }),
      ],
      signProofUrl,
    );

    expect(confirmedRows[0]?.receiptUrl).toBe('signed:proofs/final-approved.png');

    const fallbackRows = await buildAdminBookingRows(
      [
        makeBooking({
          status: 'paid',
          payments: [
            makePayment({
              receipt_url: 'proofs/dp-approved-only.png',
              payment_type: 'dp',
              status: 'approved',
              created_at: '2026-06-19T10:00:00.000Z',
            }),
            makePayment({
              receipt_url: 'proofs/final-pending.png',
              payment_type: 'final',
              status: 'pending',
              created_at: '2026-06-20T10:00:00.000Z',
            }),
          ],
        }),
      ],
      signProofUrl,
    );

    expect(fallbackRows[0]?.receiptUrl).toBe('signed:proofs/dp-approved-only.png');
  });

  it('marks the proof as unavailable when signed URL generation fails', async () => {
    const signProofUrl = vi.fn(async () => null);

    const rows = await buildAdminBookingRows(
      [
        makeBooking({
          status: 'payment_2_pending',
          payments: [
            makePayment({
              receipt_url: 'proofs/final.png',
              payment_type: 'final',
              status: 'pending',
              created_at: '2026-06-20T10:00:00.000Z',
            }),
          ],
          profiles: { name: 'Jamie', email: null, phone: null },
        }),
      ],
      signProofUrl,
    );

    expect(rows[0]).toMatchObject({
      customerName: 'Jamie',
      customerEmail: '',
      customerPhone: '',
      receiptUrl: null,
      receiptUnavailable: true,
    });
  });

  it('adds a numeric created-at sort key so admin sorting stays chronological', async () => {
    const rows = await buildAdminBookingRows(
      [
        makeBooking({
          id: 7,
          created_at: '2026-06-21T03:04:00.000Z',
        }),
      ],
      async () => null,
    );

    expect(rows[0]).toMatchObject({
      created_at_label: '21 Jun 2026 10:04',
      created_at_sort_key: Date.parse('2026-06-21T03:04:00.000Z'),
    });
  });
});

describe('buildAdminBookingsLoadMessage', () => {
  it('calls out the profiles contact migration when the bookings query references missing profile columns', () => {
    const message = buildAdminBookingsLoadMessage({
      message: 'column profiles.email does not exist',
    });

    expect(message).toContain('Booking data could not be loaded');
    expect(message).toContain('profiles.email');
    expect(message).toContain('migration');
  });
});

function makeBooking(overrides: Partial<AdminBookingFixture> = {}): AdminBookingFixture {
  return {
    id: 42,
    booking_date: '2026-06-25',
    start_time: '18:00:00',
    end_time: '20:00:00',
    price: 2300000,
    dp_amount: 690000,
    status: 'pending',
    created_at: '2026-06-21T03:04:00.000Z',
    fields: { name: 'Field A' },
    profiles: {
      name: 'Alex',
      email: 'alex@example.com',
      phone: '08123456789',
    },
    payments: [],
    ...overrides,
  };
}

function makePayment(overrides: Partial<PaymentFixture> = {}): PaymentFixture {
  return {
    receipt_url: 'proofs/default.png',
    payment_type: 'dp',
    status: 'pending',
    created_at: '2026-06-19T10:00:00.000Z',
    ...overrides,
  };
}

type PaymentFixture = {
  receipt_url: string;
  payment_type: string;
  status: string;
  created_at: string;
};

type AdminBookingFixture = {
  id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  price: number | string;
  dp_amount: number | string;
  status: string;
  created_at: string;
  fields: { name: string } | { name: string }[] | null;
  profiles:
    | {
        name: string | null;
        email: string | null;
        phone: string | null;
      }
    | {
        name: string | null;
        email: string | null;
        phone: string | null;
      }[]
    | null;
  payments: PaymentFixture[] | null;
};
