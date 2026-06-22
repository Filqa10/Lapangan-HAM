import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { CustomerNavbar } from '@/components/CustomerNavbar';

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/customer');

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-[var(--bg-body)]">
      <CustomerNavbar userName={profile?.name ?? user.email ?? undefined} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
