import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFieldAction, deleteFieldAction, updateFieldAction } from './fields';

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

describe('field admin actions', () => {
  it('rejects field creation when the current user is not an admin', async () => {
    supabaseMock.queues.profilesSelectMaybeSingle.push({ data: { role: 'customer' }, error: null });

    const result = await createFieldAction(validFieldForm());

    expect(result).toEqual({ ok: false, error: 'Akses admin diperlukan.' });
    expect(supabaseMock.calls.inserts).toHaveLength(0);
  });

  it('rejects invalid price and status before writing a field', async () => {
    supabaseMock.queues.profilesSelectMaybeSingle.push({ data: { role: 'admin' }, error: null });
    const invalidPrice = validFieldForm();
    invalidPrice.set('price', '-1');

    const priceResult = await createFieldAction(invalidPrice);

    expect(priceResult).toEqual({ ok: false, error: 'Harga lapangan tidak boleh negatif.' });

    supabaseMock.queues.profilesSelectMaybeSingle.push({ data: { role: 'admin' }, error: null });
    const invalidStatus = validFieldForm();
    invalidStatus.set('status', 'maintenance');

    const statusResult = await createFieldAction(invalidStatus);

    expect(statusResult).toEqual({ ok: false, error: 'Status lapangan tidak valid.' });
    expect(supabaseMock.calls.inserts).toHaveLength(0);
  });

  it.each([
    ['blank', '   '],
    ['omitted', null],
  ])('rejects %s price before writing a field', async (_label, price) => {
    supabaseMock.queues.profilesSelectMaybeSingle.push({ data: { role: 'admin' }, error: null });
    const formData = validFieldForm();
    if (price === null) {
      formData.delete('price');
    } else {
      formData.set('price', price);
    }

    const result = await createFieldAction(formData);

    expect(result).toEqual({ ok: false, error: 'Harga lapangan wajib diisi.' });
    expect(supabaseMock.calls.inserts).toHaveLength(0);
  });

  it('creates fields with trimmed values after admin validation', async () => {
    supabaseMock.queues.profilesSelectMaybeSingle.push({ data: { role: 'admin' }, error: null });

    const result = await createFieldAction(validFieldForm());

    expect(result).toEqual({ ok: true, message: 'Lapangan berhasil ditambahkan.' });
    expect(supabaseMock.calls.inserts).toEqual([
      {
        table: 'fields',
        payload: {
          name: 'Stadion Barat',
          price: 250000,
          address: 'Jl. HAM No. 7',
          status: 'active',
        },
      },
    ]);
  });

  it('updates and deactivates fields by id only after admin validation', async () => {
    supabaseMock.queues.profilesSelectMaybeSingle.push({ data: { role: 'admin' }, error: null });
    supabaseMock.queues.profilesSelectMaybeSingle.push({ data: { role: 'admin' }, error: null });

    await updateFieldAction(validFieldForm('12'));
    const deactivationResult = await deleteFieldAction(fieldIdForm('12'));

    expect(supabaseMock.calls.updates[0]).toMatchObject({
      table: 'fields',
      payload: {
        name: 'Stadion Barat',
        price: 250000,
        address: 'Jl. HAM No. 7',
        status: 'active',
      },
      filters: [['id', 12]],
    });
    expect(deactivationResult).toEqual({ ok: true, message: 'Lapangan berhasil dinonaktifkan.' });
    expect(supabaseMock.calls.updates[1]).toMatchObject({
      table: 'fields',
      payload: { status: 'inactive' },
      filters: [['id', 12]],
    });
    expect(supabaseMock.calls.deletes).toHaveLength(0);
  });
});

function validFieldForm(id?: string) {
  const formData = fieldIdForm(id);
  formData.set('name', '  Stadion Barat  ');
  formData.set('price', '250000');
  formData.set('address', '  Jl. HAM No. 7  ');
  formData.set('status', 'active');
  return formData;
}

function fieldIdForm(id?: string) {
  const formData = new FormData();
  if (id) formData.set('fieldId', id);
  return formData;
}

function createSupabaseMock() {
  const queues = {
    profilesSelectMaybeSingle: [] as QueryResult[],
    fieldsInsert: [{ data: null, error: null }] as QueryResult[],
    fieldsUpdate: [{ data: null, error: null }] as QueryResult[],
    fieldsDelete: [{ data: null, error: null }] as QueryResult[],
    generic: [{ data: null, error: null }] as QueryResult[],
  };
  const calls = {
    inserts: [] as Array<{ table: string; payload: unknown }>,
    updates: [] as Array<{ table: string; payload: unknown; filters: Array<[string, unknown]> }>,
    deletes: [] as Array<{ table: string; filters: Array<[string, unknown]> }>,
  };

  return {
    queues,
    calls,
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: 'admin-123' } }, error: null })),
    },
    from: vi.fn((table: string) => createQueryBuilder(table, queues, calls)),
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
    maybeSingle: vi.fn(async () => dequeue(table, state.operation, queues)),
    then: (resolve: (value: QueryResult) => unknown, reject: (reason: unknown) => unknown) =>
      Promise.resolve(dequeue(table, state.operation, queues)).then(resolve, reject),
  };

  return builder;
}

function dequeue(table: string, operation: string, queues: SupabaseMock['queues']) {
  if (table === 'profiles') return queues.profilesSelectMaybeSingle.shift() ?? { data: { role: 'customer' }, error: null };
  if (table === 'fields' && operation === 'insert') return queues.fieldsInsert.shift() ?? { data: null, error: null };
  if (table === 'fields' && operation === 'update') return queues.fieldsUpdate.shift() ?? { data: null, error: null };
  if (table === 'fields' && operation === 'delete') return queues.fieldsDelete.shift() ?? { data: null, error: null };
  return queues.generic.shift() ?? { data: null, error: null };
}
