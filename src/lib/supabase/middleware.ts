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

  // Backward compatibility redirects for old routes
  if (pathname === '/login') {
    return redirectWithSessionCookies(request, supabaseResponse, '/auth/customer');
  }
  if (pathname === '/register') {
    return redirectWithSessionCookies(request, supabaseResponse, '/auth/customer/register');
  }

  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  const isCustomerRoute = pathname === '/customer' || pathname.startsWith('/customer/');
  const isAuthCustomerRoute = pathname === '/auth/customer' || pathname.startsWith('/auth/customer/');
  const isAuthAdminRoute = pathname === '/auth/admin' || pathname.startsWith('/auth/admin/');

  // Auth pages: redirect if already logged in
  if (isAuthCustomerRoute || isAuthAdminRoute) {
    if (user) {
      const role = await getUserRole(supabase, user.id);
      if (role === 'admin') {
        return redirectWithSessionCookies(request, supabaseResponse, '/admin');
      }
      return redirectWithSessionCookies(request, supabaseResponse, '/customer');
    }
    return supabaseResponse;
  }

  // Protected routes: redirect if not logged in
  if (!isAdminRoute && !isCustomerRoute) {
    return supabaseResponse;
  }

  if (!user) {
    const loginPath = isAdminRoute ? '/auth/admin' : '/auth/customer';
    return redirectWithSessionCookies(request, supabaseResponse, loginPath, {
      next: pathname,
    });
  }

  const role = await getUserRole(supabase, user.id);

  if (isAdminRoute && role !== 'admin') {
    return redirectWithSessionCookies(request, supabaseResponse, '/customer');
  }

  if (isCustomerRoute && role === 'admin') {
    return redirectWithSessionCookies(request, supabaseResponse, '/admin');
  }

  return supabaseResponse;
}

async function getUserRole(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  userId: string,
): Promise<ProfileRole | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (error) return null;
  return (data as Profile | null)?.role ?? null;
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
