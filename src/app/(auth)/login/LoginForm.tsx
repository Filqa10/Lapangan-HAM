'use client';

import { useActionState } from 'react';
import Link from 'next/link';

import { loginAction } from '@/actions/auth';

type LoginFormProps = {
  nextPath?: string;
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="mt-8 grid gap-5">
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}

      <div className="grid gap-2">
        <label htmlFor="email" className="text-sm font-bold text-lime-50/80">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded-2xl border border-lime-100/15 bg-[#06140f] px-4 py-3 text-lime-50 outline-none transition placeholder:text-lime-50/35 focus:border-lime-200 focus:ring-4 focus:ring-lime-300/15"
          placeholder="nama@email.com"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="password" className="text-sm font-bold text-lime-50/80">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-2xl border border-lime-100/15 bg-[#06140f] px-4 py-3 text-lime-50 outline-none transition placeholder:text-lime-50/35 focus:border-lime-200 focus:ring-4 focus:ring-lime-300/15"
          placeholder="Masukkan password"
        />
      </div>

      {state?.error ? (
        <p aria-live="polite" className="rounded-2xl border border-red-200/30 bg-red-950/50 px-4 py-3 text-sm font-bold text-red-100">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-lime-300 px-5 py-3 font-black text-[#082014] transition hover:-translate-y-0.5 hover:bg-lime-200 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {pending ? 'Memeriksa akses...' : 'Masuk ke portal'}
      </button>

      <div className="text-center text-sm text-lime-50/60">
        Belum punya akun?{' '}
        <Link href="/register" className="font-bold text-lime-300 hover:text-lime-200 transition underline underline-offset-4">
          Daftar sekarang
        </Link>
      </div>
    </form>
  );
}

