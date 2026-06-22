import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  redirect: vi.fn((path: string) => {
    throw new RedirectError(path);
  }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => supabaseMock),
}));

type QueryResult<T = unknown> = { data: T | null; error: { message: string } | null };
type SupabaseMock = ReturnType<typeof createSupabaseMock>;

class RedirectError extends Error {
  constructor(readonly path: string) {
    super(`redirect:${path}`);
  }
}

let supabaseMock: SupabaseMock;

beforeEach(() => {
  supabaseMock = createSupabaseMock();
});

describe('loginAction', () => {
  it('redirects admins to the admin dashboard by default', async () => {
    const { loginAction } = await import('./auth');
    supabaseMock.authUserId = 'admin-123';
    supabaseMock.queues.profilesSelectMaybeSingle.push({ data: { role: 'admin' }, error: null });

    await expect(loginAction(undefined, loginForm())).rejects.toMatchObject({ path: '/admin' });
  });

  it('respects an admin next path for admin users', async () => {
    const { loginAction } = await import('./auth');
    supabaseMock.authUserId = 'admin-123';
    supabaseMock.queues.profilesSelectMaybeSingle.push({ data: { role: 'admin' }, error: null });
    const formData = loginForm('/admin/bookings');

    await expect(loginAction(undefined, formData)).rejects.toMatchObject({ path: '/admin/bookings' });
  });

  it('does not allow a customer user to follow an admin next path', async () => {
    const { loginAction } = await import('./auth');
    supabaseMock.authUserId = 'customer-123';
    supabaseMock.queues.profilesSelectMaybeSingle.push({ data: { role: 'customer' }, error: null });
    const formData = loginForm('/admin');

    await expect(loginAction(undefined, formData)).rejects.toMatchObject({ path: '/customer' });
  });

  it('ignores unsafe external next paths', async () => {
    const { loginAction } = await import('./auth');
    supabaseMock.authUserId = 'customer-123';
    supabaseMock.queues.profilesSelectMaybeSingle.push({ data: { role: 'customer' }, error: null });
    const formData = loginForm('https://evil.example/customer');

    await expect(loginAction(undefined, formData)).rejects.toMatchObject({ path: '/customer' });
  });

  it('returns a clear message when Supabase rejects the credentials', async () => {
    const { loginAction } = await import('./auth');
    supabaseMock.authError = { message: 'Invalid login credentials' };

    const result = await loginAction(undefined, loginForm());

    expect(result).toEqual({ error: 'Email atau password tidak cocok.' });
  });
});

describe('registerAction', () => {
  it('registers a user successfully and returns a success message', async () => {
    const { registerAction } = await import('./auth');
    supabaseMock.authUserId = 'new-user-123';
    supabaseMock.authSession = null; // Email confirmation needed

    const formData = new FormData();
    formData.set('name', 'Budi');
    formData.set('phone', '08123456');
    formData.set('email', 'budi@example.com');
    formData.set('password', 'securepass');

    const result = await registerAction(undefined, formData);
    expect(result).toEqual({ success: 'Registrasi berhasil! Silakan masuk menggunakan akun baru Anda.' });
    expect(supabaseMock.auth.signUp).toHaveBeenCalledWith({
      email: 'budi@example.com',
      password: 'securepass',
      options: {
        data: {
          email: 'budi@example.com',
          name: 'Budi',
          phone: '08123456',
        },
      },
    });
  });

  it('fails when fields are missing', async () => {
    const { registerAction } = await import('./auth');
    const formData = new FormData();
    formData.set('name', 'Budi');

    const result = await registerAction(undefined, formData);
    expect(result).toEqual({ error: 'Semua kolom wajib diisi.' });
  });

  it('fails when password is too short', async () => {
    const { registerAction } = await import('./auth');
    const formData = new FormData();
    formData.set('name', 'Budi');
    formData.set('phone', '08123456');
    formData.set('email', 'budi@example.com');
    formData.set('password', '123');

    const result = await registerAction(undefined, formData);
    expect(result).toEqual({ error: 'Password minimal harus 6 karakter.' });
  });
});

function loginForm(next?: string) {
  const formData = new FormData();
  formData.set('email', 'member@example.com');
  formData.set('password', 'secret-password');
  if (next) formData.set('next', next);
  return formData;
}

function createSupabaseMock() {
  const queues = {
    profilesSelectMaybeSingle: [] as QueryResult[],
  };

  return {
    authUserId: 'user-123',
    authSession: null as { access_token?: string } | null,
    authError: null as { message: string } | null,
    queues,
    auth: {
      signInWithPassword: vi.fn(async () => ({
        data: { user: supabaseMock.authUserId ? { id: supabaseMock.authUserId } : null },
        error: supabaseMock.authError,
      })),
      signUp: vi.fn(async () => ({
        data: { 
          user: supabaseMock.authUserId ? { id: supabaseMock.authUserId } : null,
          session: supabaseMock.authSession
        },
        error: supabaseMock.authError,
      })),
    },
    from: vi.fn((table: string) => createQueryBuilder(table, queues)),
  };
}

function createQueryBuilder(table: string, queues: SupabaseMock['queues']) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => {
      if (table === 'profiles') return queues.profilesSelectMaybeSingle.shift() ?? { data: null, error: null };
      return { data: null, error: null };
    }),
  };

  return builder;
}
