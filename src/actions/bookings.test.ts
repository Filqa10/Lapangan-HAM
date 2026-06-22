import { beforeEach, describe, expect, it, vi } from 'vitest';

import { approveDPAction, approveFinalPaymentAction, cancelBookingAction, createBookingAction, submitPelunasanAction } from './bookings';
import { buildPaymentProofPath, parseCreateBookingForm } from './bookings-utils';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => supabaseMock),
}));

type QueryResult<T = unknown> = { data: T | null; error: { message: string } | null };
type SupabaseMock = ReturnType<typeof createSupabaseMock>;

let supabaseMock: SupabaseMock;

beforeEach(() => {
  supabaseMock = createSupabaseMock();
});

describe('booking server action helpers', () => {
  it('parses a valid booking form and calculates the required DP', () => {
    const formData = new FormData();
    formData.set('fieldId', '7');
    formData.set('bookingDate', '2026-06-15');
    formData.set('startHour', '18');
    formData.set('endHour', '20');
    formData.set('paymentProof', new File(['proof'], 'bukti transfer.png', { type: 'image/png' }));

    const result = parseCreateBookingForm(formData);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toMatchObject({
      fieldId: 7,
      bookingDate: '2026-06-15',
      startTime: '18:00',
      endTime: '20:00',
      total: 2300000,
      dp: 690000,
    });
    expect(result.data.paymentProof.name).toBe('bukti transfer.png');
  });

  it('rejects an unavailable or reversed slot before upload', () => {
    const formData = new FormData();
    formData.set('fieldId', '7');
    formData.set('bookingDate', '2026-06-15');
    formData.set('startHour', '20');
    formData.set('endHour', '18');
    formData.set('paymentProof', new File(['proof'], 'proof.pdf', { type: 'application/pdf' }));

    const result = parseCreateBookingForm(formData);

    expect(result).toEqual({ ok: false, error: 'Pilih jam mulai dan selesai yang valid.' });
  });

  it('stores payment proofs under the authenticated owner prefix with a safe name', () => {
    const path = buildPaymentProofPath({
      userId: 'user-123',
      bookingFolder: 'draft',
      paymentType: 'dp',
      fileName: 'Bukti Transfer Juni 2026.PNG',
      now: new Date('2026-06-19T08:30:00Z'),
      nonce: 'abc123',
    });

    expect(path).toBe('user-123/draft/2026-06-19T08-30-00-000Z-dp-abc123-bukti-transfer-juni-2026.png');
  });
});

describe('createBookingAction', () => {
  it.each([
    ['inactive', { id: 7, status: 'maintenance' }],
    ['missing', null],
  ])('rejects %s fields before inserting a booking', async (_label, field) => {
    supabaseMock.queues.fieldsSelectMaybeSingle.push({ data: field, error: null });

    const result = await createBookingAction({ ok: false }, validCreateBookingForm());

    expect(result).toEqual({ ok: false, error: 'Lapangan tidak tersedia untuk booking online.' });
    expect(supabaseMock.calls.inserts.some((call) => call.table === 'bookings')).toBe(false);
  });

  it('rejects past booking dates server-side', async () => {
    const formData = validCreateBookingForm();
    formData.set('bookingDate', formatLocalDate(addLocalDays(new Date(), -1)));

    const result = await createBookingAction({ ok: false }, formData);

    expect(result).toEqual({ ok: false, error: 'Tanggal booking tidak boleh sebelum hari ini.' });
    expect(supabaseMock.calls.inserts).toHaveLength(0);
  });

  it('rejects invalid payment proof MIME types and oversized files', async () => {
    const invalidType = validCreateBookingForm();
    invalidType.set('paymentProof', new File(['proof'], 'proof.pdf', { type: 'application/pdf' }));

    const invalidTypeResult = await createBookingAction({ ok: false }, invalidType);

    expect(invalidTypeResult).toEqual({ ok: false, error: 'Bukti pembayaran harus berupa JPG, PNG, atau WebP.' });

    const oversized = validCreateBookingForm();
    oversized.set('paymentProof', new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'proof.png', { type: 'image/png' }));

    const oversizedResult = await createBookingAction({ ok: false }, oversized);

    expect(oversizedResult).toEqual({ ok: false, error: 'Ukuran bukti pembayaran maksimal 5MB.' });
    expect(supabaseMock.calls.inserts).toHaveLength(0);
  });
});

describe('submitPelunasanAction', () => {
  it('does not insert duplicate final payments when the booking is already past dp_paid', async () => {
    supabaseMock.queues.bookingsSelectMaybeSingle.push({
      data: { id: 42, user_id: 'user-123', price: 2300000, dp_amount: 690000, status: 'payment_2_pending' },
      error: null,
    });

    const result = await submitPelunasanAction({ ok: false }, validPelunasanForm());

    expect(result).toEqual({ ok: false, error: 'Pelunasan sudah dikirim atau booking sudah selesai diproses.' });
    expect(supabaseMock.calls.uploads).toHaveLength(0);
    expect(supabaseMock.calls.inserts.some((call) => call.table === 'payments')).toBe(false);
  });

  it('does not insert a duplicate final payment when the atomic status update cannot claim dp_paid', async () => {
    supabaseMock.queues.bookingsSelectMaybeSingle.push({
      data: { id: 42, user_id: 'user-123', price: 2300000, dp_amount: 690000, status: 'dp_paid' },
      error: null,
    });
    supabaseMock.queues.bookingsUpdateMaybeSingle.push({ data: null, error: null });

    const result = await submitPelunasanAction({ ok: false }, validPelunasanForm());

    expect(result).toEqual({ ok: false, error: 'Pelunasan sudah dikirim atau booking sudah selesai diproses.' });
    expect(supabaseMock.calls.inserts.some((call) => call.table === 'payments')).toBe(false);
    expect(supabaseMock.calls.uploads).toHaveLength(0);
  });
});

describe('admin booking approval actions', () => {
  it('rejects DP approval when the current user is not an admin', async () => {
    supabaseMock.queues.profilesSelectMaybeSingle.push({ data: { role: 'customer' }, error: null });

    const result = await approveDPAction(approvalForm());

    expect(result).toEqual({ ok: false, error: 'Akses admin diperlukan.' });
    expect(supabaseMock.calls.updates).toHaveLength(0);
    expect(supabaseMock.calls.rpcs).toHaveLength(0);
  });

  it('approves a DP payment through the atomic RPC without separate booking/payment updates', async () => {
    supabaseMock.queues.profilesSelectMaybeSingle.push({ data: { role: 'admin' }, error: null });
    supabaseMock.queues.rpcMaybeSingle.push({ data: { booking_id: 42, user_id: 'user-123' }, error: null });
    supabaseMock.queues.bookingsSelectMaybeSingle.push({
      data: { id: 42, booking_date: '2026-06-15', start_time: '18:00', end_time: '20:00', fields: { name: 'Stadion Barat' } },
      error: null,
    });

    const result = await approveDPAction(approvalForm());

    expect(result).toEqual({ ok: true, bookingId: 42, message: 'DP disetujui. Customer dapat mengirim bukti pelunasan.' });
    expect(supabaseMock.calls.rpcs).toEqual([{ fn: 'admin_approve_dp', args: { p_booking_id: 42 } }]);
    expect(supabaseMock.calls.updates).toHaveLength(0);
  });

  it('returns a missing DP payment message when the approval RPC rejects missing pending payment', async () => {
    supabaseMock.queues.profilesSelectMaybeSingle.push({ data: { role: 'admin' }, error: null });
    supabaseMock.queues.rpcMaybeSingle.push({ data: null, error: { message: 'PendingDPPaymentNotFound: no pending DP payment found' } });

    const result = await approveDPAction(approvalForm());

    expect(result).toEqual({ ok: false, error: 'Bukti pembayaran DP belum ditemukan.' });
    expect(supabaseMock.calls.rpcs).toEqual([{ fn: 'admin_approve_dp', args: { p_booking_id: 42 } }]);
    expect(supabaseMock.calls.updates).toHaveLength(0);
  });

  it('returns a retryable error when the final approval RPC fails unexpectedly', async () => {
    supabaseMock.queues.profilesSelectMaybeSingle.push({ data: { role: 'admin' }, error: null });
    supabaseMock.queues.rpcMaybeSingle.push({ data: null, error: { message: 'database timeout' } });

    const result = await approveFinalPaymentAction(approvalForm());

    expect(result).toEqual({ ok: false, error: 'Pelunasan gagal disetujui. Coba lagi.' });
    expect(supabaseMock.calls.rpcs).toEqual([{ fn: 'admin_approve_final_payment', args: { p_booking_id: 42 } }]);
    expect(supabaseMock.calls.updates).toHaveLength(0);
  });

  it('approves a final payment through the atomic RPC without separate booking/payment updates', async () => {
    supabaseMock.queues.profilesSelectMaybeSingle.push({ data: { role: 'admin' }, error: null });
    supabaseMock.queues.rpcMaybeSingle.push({ data: { booking_id: 42, user_id: 'user-123' }, error: null });
    supabaseMock.queues.bookingsSelectMaybeSingle.push({
      data: { id: 42, booking_date: '2026-06-15', start_time: '18:00', end_time: '20:00', fields: { name: 'Stadion Barat' } },
      error: null,
    });

    const result = await approveFinalPaymentAction(approvalForm());

    expect(result).toEqual({ ok: true, bookingId: 42, message: 'Pelunasan disetujui. Booking sudah terkonfirmasi.' });
    expect(supabaseMock.calls.rpcs).toEqual([{ fn: 'admin_approve_final_payment', args: { p_booking_id: 42 } }]);
    expect(supabaseMock.calls.updates).toHaveLength(0);
  });

  it('cancels a booking through the atomic RPC', async () => {
    supabaseMock.queues.profilesSelectMaybeSingle.push({ data: { role: 'admin' }, error: null });
    supabaseMock.queues.rpcMaybeSingle.push({ data: { booking_id: 42, previous_status: 'pending' }, error: null });

    const result = await cancelBookingAction(approvalForm());

    expect(result).toEqual({ ok: true, bookingId: 42, message: 'Booking dibatalkan. Payment pending ditolak otomatis.' });
    expect(supabaseMock.calls.rpcs).toEqual([{ fn: 'admin_cancel_booking', args: { p_booking_id: 42 } }]);
    expect(supabaseMock.calls.updates).toHaveLength(0);
  });

  it('returns a stale cancellation message when the cancel RPC rejects a missing booking', async () => {
    supabaseMock.queues.profilesSelectMaybeSingle.push({ data: { role: 'admin' }, error: null });
    supabaseMock.queues.rpcMaybeSingle.push({ data: null, error: { message: 'BookingAlreadyCancelledOrMissing: booking is cancelled or does not exist' } });

    const result = await cancelBookingAction(approvalForm());

    expect(result).toEqual({ ok: false, error: 'Booking sudah dibatalkan atau tidak ditemukan.' });
    expect(supabaseMock.calls.rpcs).toEqual([{ fn: 'admin_cancel_booking', args: { p_booking_id: 42 } }]);
    expect(supabaseMock.calls.updates).toHaveLength(0);
  });

  it('legacy approval flow does not perform separate booking or payment updates after RPC migration', async () => {
    supabaseMock.queues.profilesSelectMaybeSingle.push({ data: { role: 'admin' }, error: null });
    supabaseMock.queues.rpcMaybeSingle.push({ data: null, error: { message: 'BookingNotPending: booking is not pending or does not exist' } });

    const result = await approveDPAction(approvalForm());

    expect(result).toEqual({ ok: false, error: 'Booking sudah diproses atau tidak lagi menunggu DP.' });
    expect(supabaseMock.calls.updates).toHaveLength(0);
    expect(supabaseMock.calls.rpcs).toEqual([
      {
        fn: 'admin_approve_dp',
        args: { p_booking_id: 42 },
      },
    ]);
  });
});

function validCreateBookingForm() {
  const formData = new FormData();
  formData.set('fieldId', '7');
  formData.set('bookingDate', formatLocalDate(addLocalDays(new Date(), 14)));
  formData.set('startHour', '18');
  formData.set('endHour', '20');
  formData.set('paymentProof', new File(['proof'], 'proof.png', { type: 'image/png' }));
  return formData;
}

function validPelunasanForm() {
  const formData = new FormData();
  formData.set('bookingId', '42');
  formData.set('paymentProof', new File(['proof'], 'proof.png', { type: 'image/png' }));
  return formData;
}

function approvalForm() {
  const formData = new FormData();
  formData.set('bookingId', '42');
  return formData;
}

function addLocalDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function formatLocalDate(date: Date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

function createSupabaseMock() {
  const queues = {
    fieldsSelectMaybeSingle: [] as QueryResult[],
    profilesSelectMaybeSingle: [] as QueryResult[],
    bookingsInsertSingle: [{ data: { id: 42 }, error: null }] as QueryResult[],
    bookingsSelectMaybeSingle: [] as QueryResult[],
    bookingsUpdateMaybeSingle: [] as QueryResult[],
    paymentsSelectMaybeSingle: [] as QueryResult[],
    paymentsUpdateMaybeSingle: [] as QueryResult[],
    paymentsInsert: [{ data: null, error: null }] as QueryResult[],
    paymentsInsertSingle: [{ data: { id: 99 }, error: null }] as QueryResult[],
    rpcMaybeSingle: [] as QueryResult[],
    generic: [{ data: null, error: null }] as QueryResult[],
  };
  const calls = {
    inserts: [] as Array<{ table: string; payload: unknown }>,
    updates: [] as Array<{ table: string; payload: unknown; filters: Array<[string, unknown]> }>,
    deletes: [] as Array<{ table: string; filters: Array<[string, unknown]> }>,
    uploads: [] as Array<{ path: string; file: File; options: unknown }>,
    removals: [] as string[][],
    rpcs: [] as Array<{ fn: string; args: unknown }>,
  };

  return {
    queues,
    calls,
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: 'user-123' } }, error: null })),
    },
    from: vi.fn((table: string) => createQueryBuilder(table, queues, calls)),
    rpc: vi.fn((fn: string, args: unknown) => createRpcBuilder(fn, args, queues, calls)),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(async (path: string, file: File, options: unknown) => {
          calls.uploads.push({ path, file, options });
          return { data: { path }, error: null };
        }),
        remove: vi.fn(async (paths: string[]) => {
          calls.removals.push(paths);
          return { data: paths, error: null };
        }),
      })),
    },
  };
}

function createRpcBuilder(fn: string, args: unknown, queues: SupabaseMock['queues'], calls: SupabaseMock['calls']) {
  calls.rpcs.push({ fn, args });
  return {
    maybeSingle: vi.fn(async () => queues.rpcMaybeSingle.shift() ?? { data: null, error: null }),
  };
}

function createQueryBuilder(table: string, queues: SupabaseMock['queues'], calls: SupabaseMock['calls']) {
  const state = { operation: 'select', filters: [] as Array<[string, unknown]> };

  const builder = {
    select: vi.fn(() => builder),
    insert: vi.fn((payload: unknown) => {
      state.operation = 'insert';
      calls.inserts.push({ table, payload });
      return builder;
    }),
    update: vi.fn((payload: unknown) => {
      state.operation = 'update';
      calls.updates.push({ table, payload, filters: state.filters });
      return builder;
    }),
    delete: vi.fn(() => {
      state.operation = 'delete';
      calls.deletes.push({ table, filters: state.filters });
      return builder;
    }),
    eq: vi.fn((column: string, value: unknown) => {
      state.filters.push([column, value]);
      return builder;
    }),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => dequeue(table, state.operation, 'maybeSingle', queues)),
    single: vi.fn(async () => dequeue(table, state.operation, 'single', queues)),
    then: (resolve: (value: QueryResult) => unknown, reject: (reason: unknown) => unknown) =>
      Promise.resolve(dequeue(table, state.operation, 'then', queues)).then(resolve, reject),
  };

  return builder;
}

function dequeue(table: string, operation: string, terminal: 'maybeSingle' | 'single' | 'then', queues: SupabaseMock['queues']) {
  if (table === 'fields' && terminal === 'maybeSingle') return queues.fieldsSelectMaybeSingle.shift() ?? { data: { id: 7, status: 'active' }, error: null };
  if (table === 'profiles' && terminal === 'maybeSingle') return queues.profilesSelectMaybeSingle.shift() ?? { data: { role: 'customer' }, error: null };
  if (table === 'bookings' && operation === 'insert' && terminal === 'single') return queues.bookingsInsertSingle.shift() ?? { data: { id: 42 }, error: null };
  if (table === 'bookings' && operation === 'select' && terminal === 'maybeSingle') return queues.bookingsSelectMaybeSingle.shift() ?? { data: null, error: null };
  if (table === 'bookings' && operation === 'update' && terminal === 'maybeSingle') return queues.bookingsUpdateMaybeSingle.shift() ?? { data: { id: 42 }, error: null };
  if (table === 'payments' && operation === 'select' && terminal === 'maybeSingle') return queues.paymentsSelectMaybeSingle.shift() ?? { data: { id: 99 }, error: null };
  if (table === 'payments' && operation === 'update' && terminal === 'maybeSingle') return queues.paymentsUpdateMaybeSingle.shift() ?? { data: { id: 99 }, error: null };
  if (table === 'payments' && operation === 'insert' && terminal === 'single') return queues.paymentsInsertSingle.shift() ?? { data: { id: 99 }, error: null };
  if (table === 'payments' && operation === 'insert' && terminal === 'then') return queues.paymentsInsert.shift() ?? { data: null, error: null };
  return queues.generic.shift() ?? { data: null, error: null };
}
