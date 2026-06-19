import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type ProfileRole = 'admin' | 'customer';
type Profile = {
  role: ProfileRole | null;
};

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });

          Object.entries(headers).forEach(([key, value]) => {
            supabaseResponse.headers.set(key, value);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  const isCustomerRoute = pathname === '/customer' || pathname.startsWith('/customer/');

  if (!isAdminRoute && !isCustomerRoute) {
    return supabaseResponse;
  }

  if (!user) {
    return redirectWithSessionCookies(request, supabaseResponse, '/login', {
      next: pathname,
    });
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const role = error ? null : (data as Profile | null)?.role ?? null;

  if (isAdminRoute && role !== 'admin') {
    return redirectWithSessionCookies(request, supabaseResponse, '/customer');
  }

  if (isCustomerRoute && role === 'admin') {
    return redirectWithSessionCookies(request, supabaseResponse, '/admin');
  }

  return supabaseResponse;
}

function redirectWithSessionCookies(
  request: NextRequest,
  sessionResponse: NextResponse,
  pathname: string,
  searchParams?: Record<string, string>,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = '';

  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = NextResponse.redirect(url);

  sessionResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });

  for (const header of ['cache-control', 'expires', 'pragma']) {
    const value = sessionResponse.headers.get(header);
    if (value) {
      response.headers.set(header, value);
    }
  }

  return response;
}
