'use server';

import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

type ProfileRole = 'admin' | 'customer';

type Profile = {
  role: ProfileRole | null;
};

export type LoginActionState = {
  error?: string;
};

export type RegisterActionState = {
  error?: string;
  success?: string;
};

export async function loginAction(
  _previousState: LoginActionState | undefined,
  formData: FormData,
): Promise<LoginActionState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const nextPath = String(formData.get('next') ?? '').trim();

  if (!email || !password) {
    return { error: 'Email dan password wajib diisi.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !user) {
    return { error: 'Email atau password tidak cocok.' };
  }

  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const role = ((data as Profile | null)?.role ?? 'customer') === 'admin' ? 'admin' : 'customer';

  redirect(resolveLoginRedirect(role, nextPath));
}

export async function registerAction(
  _previousState: RegisterActionState | undefined,
  formData: FormData,
): Promise<RegisterActionState> {
  const name = String(formData.get('name') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!name || !phone || !email || !password) {
    return { error: 'Semua kolom wajib diisi.' };
  }

  if (password.length < 6) {
    return { error: 'Password minimal harus 6 karakter.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        phone,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // If a session was automatically established (email verification disabled)
  if (data?.session) {
    redirect('/customer');
  }

  // If email verification is enabled or user needs to log in manually
  return { 
    success: 'Registrasi berhasil! Silakan masuk menggunakan akun baru Anda.' 
  };
}

function resolveLoginRedirect(role: ProfileRole, nextPath: string) {
  if (isAllowedNextPath(role, nextPath)) return nextPath;
  return role === 'admin' ? '/admin' : '/customer';
}

function isAllowedNextPath(role: ProfileRole, nextPath: string) {
  if (role === 'admin') return nextPath === '/admin' || nextPath.startsWith('/admin/');
  return nextPath === '/customer' || nextPath.startsWith('/customer/');
}

