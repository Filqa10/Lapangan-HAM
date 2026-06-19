'use client';

import { useActionState } from 'react';
import Link from 'next/link';

import { registerAction } from '@/actions/auth';

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, undefined);

  return (
    <form action={formAction} className="mt-8 grid gap-4">
      {/* Name */}
      <div className="grid gap-1.5">
        <label htmlFor="name" className="text-sm font-bold text-lime-50/80">
          Nama Lengkap
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="rounded-2xl border border-lime-100/15 bg-[#06140f] px-4 py-3 text-lime-50 outline-none transition placeholder:text-lime-50/35 focus:border-lime-200 focus:ring-4 focus:ring-lime-300/15"
          placeholder="Nama lengkap Anda"
        />
      </div>

      {/* Phone */}
      <div className="grid gap-1.5">
        <label htmlFor="phone" className="text-sm font-bold text-lime-50/80">
          No. Telepon / WhatsApp
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          className="rounded-2xl border border-lime-100/15 bg-[#06140f] px-4 py-3 text-lime-50 outline-none transition placeholder:text-lime-50/35 focus:border-lime-200 focus:ring-4 focus:ring-lime-300/15"
          placeholder="Contoh: 081234567890"
        />
      </div>

      {/* Email */}
      <div className="grid gap-1.5">
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

      {/* Password */}
      <div className="grid gap-1.5">
        <label htmlFor="password" className="text-sm font-bold text-lime-50/80">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className="rounded-2xl border border-lime-100/15 bg-[#06140f] px-4 py-3 text-lime-50 outline-none transition placeholder:text-lime-50/35 focus:border-lime-200 focus:ring-4 focus:ring-lime-300/15"
          placeholder="Minimal 6 karakter"
        />
      </div>

      {/* Messages */}
      {state?.error ? (
        <p aria-live="polite" className="rounded-2xl border border-red-200/30 bg-red-950/50 px-4 py-3 text-sm font-bold text-red-100">
          {state.error}
        </p>
      ) : null}

      {state?.success ? (
        <p aria-live="polite" className="rounded-2xl border border-lime-200/30 bg-lime-950/50 px-4 py-3 text-sm font-bold text-lime-100">
          {state.success}
        </p>
      ) : null}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-lime-300 px-5 py-3 font-black text-[#082014] transition hover:-translate-y-0.5 hover:bg-lime-200 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {pending ? 'Mendaftarkan akun...' : 'Daftar Sekarang'}
      </button>

      {/* Link back to Login */}
      <div className="text-center text-sm text-lime-50/60 mt-2">
        Sudah memiliki akun?{' '}
        <Link href="/login" className="font-bold text-lime-300 hover:text-lime-200 transition underline underline-offset-4">
          Masuk di sini
        </Link>
      </div>
    </form>
  );
}
