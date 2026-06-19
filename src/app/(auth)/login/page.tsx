import type { Metadata } from 'next';

import { LoginForm } from './LoginForm';

export const metadata: Metadata = {
  title: 'Login | HAM Stadium Booking',
  description: 'Masuk ke portal booking HAM Stadium.',
};

type LoginPageProps = {
  searchParams: Promise<{
    next?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  const nextPath = Array.isArray(next) ? next[0] : next;

  return (
    <main className="min-h-screen bg-[#06140f] px-6 py-8 text-lime-50 sm:px-10 lg:px-16">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center">
        <section className="grid w-full overflow-hidden rounded-[2rem] border border-lime-100/15 bg-[#092018] shadow-2xl lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative min-h-64 border-b border-lime-100/15 bg-[radial-gradient(circle_at_24%_20%,rgba(190,242,100,0.28),transparent_30%),linear-gradient(135deg,#0e2f22,#06140f)] p-6 lg:border-r lg:border-b-0 sm:p-8">
            <p className="font-mono text-sm tracking-[0.3em] text-lime-200 uppercase">Floodlight gate</p>
            <h1 className="mt-4 max-w-lg text-4xl font-black tracking-tight sm:text-6xl">
              Masuk sebelum peluit mulai.
            </h1>
            <p className="mt-4 max-w-md text-lime-50/65">
              Akses admin dan customer diarahkan otomatis sesuai peran akun HAM Stadium.
            </p>
            <div className="absolute right-6 bottom-6 left-6 h-28 rounded-[2rem] border border-lime-200/25 bg-[linear-gradient(90deg,rgba(190,242,100,0.16)_1px,transparent_1px),linear-gradient(0deg,rgba(190,242,100,0.12)_1px,transparent_1px)] bg-[size:48px_28px] opacity-70" aria-hidden="true" />
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            <p className="font-mono text-xs tracking-[0.25em] text-lime-200 uppercase">Portal login</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">Gunakan akun terdaftar</h2>
            <p className="mt-3 text-sm leading-6 text-lime-50/60">
              Setelah berhasil masuk, kamu akan diarahkan ke dashboard yang sesuai dengan peran akun.
            </p>
            <LoginForm nextPath={nextPath} />
          </div>
        </section>
      </div>
    </main>
  );
}
