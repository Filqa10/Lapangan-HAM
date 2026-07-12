import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/dashboard-shell';

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
    <DashboardShell variant="customer" userName={profile?.name ?? user.email ?? 'Customer'}>
      {children}
    </DashboardShell>
  );
}
