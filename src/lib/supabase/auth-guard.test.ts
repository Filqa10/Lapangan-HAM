// @vitest-environment node

import { NextRequest } from 'next/server';
import type { CookieOptions } from '@supabase/ssr';
import { afterEach, describe, expect, it, vi } from 'vitest';

type ProfileRole = 'admin' | 'customer' | null;

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

type MockSessionOptions = {
  userId?: string;
  role?: ProfileRole;
  cookiesToSet?: CookieToSet[];
  headersToSet?: Record<string, string>;
};

afterEach(() => {
  vi.doUnmock('@supabase/ssr');
  vi.resetModules();
});

describe('Supabase auth guard wiring', () => {
  it('exports the browser client factory', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    const { createClient } = await import('./client');

    expect(createClient).toBeTypeOf('function');
  });

  it('exports the async server client factory', async () => {
    const { createClient } = await import('./server');

    expect(createClient).toBeTypeOf('function');
    expect(createClient.constructor.name).toBe('AsyncFunction');
  });

  it('exports the middleware session updater', async () => {
    const { updateSession } = await import('./middleware');

    expect(updateSession).toBeTypeOf('function');
  });

  it('exports the Next proxy entrypoint and protected route matcher', async () => {
    const { config, proxy } = await import('../../proxy');

    expect(proxy).toBeTypeOf('function');

    const matcher = Array.isArray(config.matcher)
      ? config.matcher.join(' ')
      : String(config.matcher);

    expect(matcher).toContain('_next/static');
    expect(matcher).toContain('_next/image');
  });
});

describe('updateSession auth guard behavior', () => {
  it('redirects unauthenticated admin requests to login with next path', async () => {
    const { updateSession } = await loadUpdateSession({});

    const response = await updateSession(new NextRequest('http://localhost/admin'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'http://localhost/auth/admin?next=%2Fadmin',
    );
  });

  it('redirects authenticated customers away from admin routes', async () => {
    const { updateSession } = await loadUpdateSession({
      userId: 'user-1',
      role: 'customer',
    });

    const response = await updateSession(new NextRequest('http://localhost/admin'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/customer');
  });

  it('redirects authenticated admins away from customer routes', async () => {
    const { updateSession } = await loadUpdateSession({
      userId: 'user-1',
      role: 'admin',
    });

    const response = await updateSession(
      new NextRequest('http://localhost/customer'),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/admin');
  });

  it('allows authenticated customers through customer routes', async () => {
    const { updateSession } = await loadUpdateSession({
      userId: 'user-1',
      role: 'customer',
    });

    const response = await updateSession(
      new NextRequest('http://localhost/customer'),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('preserves refreshed session cookies on redirects', async () => {
    const { updateSession } = await loadUpdateSession({
      userId: 'user-1',
      role: 'customer',
      cookiesToSet: [
        {
          name: 'sb-session',
          value: 'fresh-token',
          options: { httpOnly: true, path: '/', sameSite: 'lax' },
        },
      ],
      headersToSet: {
        'cache-control': 'private, no-cache, no-store, must-revalidate, max-age=0',
      },
    });

    const response = await updateSession(new NextRequest('http://localhost/admin'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/customer');
    expect(response.headers.get('set-cookie')).toContain(
      'sb-session=fresh-token',
    );
    expect(response.headers.get('cache-control')).toBe(
      'private, no-cache, no-store, must-revalidate, max-age=0',
    );
  });
});

async function loadUpdateSession(options: MockSessionOptions) {
  vi.resetModules();

  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

  vi.doMock('@supabase/ssr', () => ({
    createServerClient: vi.fn(
      (
        _supabaseUrl: string,
        _supabaseKey: string,
        clientOptions: {
          cookies: {
            setAll(cookies: CookieToSet[], headers: Record<string, string>): void;
          };
        },
      ) => ({
        auth: {
          getUser: vi.fn(async () => {
            clientOptions.cookies.setAll(
              options.cookiesToSet ?? [],
              options.headersToSet ?? {},
            );

            return {
              data: {
                user: options.userId ? { id: options.userId } : null,
              },
            };
          }),
        },
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(async () => ({
                data: { role: options.role ?? null },
                error: null,
              })),
            })),
          })),
        })),
      }),
    ),
  }));

  return import('./middleware');
}
