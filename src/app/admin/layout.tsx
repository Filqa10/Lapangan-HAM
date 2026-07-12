import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/dashboard-shell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/admin');

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') redirect('/customer');

  return (
    <DashboardShell variant="admin" userName={profile?.name ?? 'Administrator'}>
      {children}
    </DashboardShell>
  );
}
