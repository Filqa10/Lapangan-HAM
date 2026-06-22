import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { FieldForm } from '../../FieldForm';
import { updateFieldAction } from '@/actions/fields';

async function wrappedUpdateAction(_prevState: { ok: boolean; error: string | null }, formData: FormData) {
  'use server';
  const result = await updateFieldAction(formData);
  return { ok: result.ok, error: result.error ?? null };
}

export default async function EditFieldPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fieldId = Number(id);
  const supabase = await createClient();

  const { data: field } = await supabase
    .from('fields')
    .select('id, name, price, address, status')
    .eq('id', fieldId)
    .maybeSingle();

  if (!field) redirect('/admin/fields');

  return (
    <FieldForm
      action={wrappedUpdateAction}
      title="Edit Field"
      initialData={{
        id: field.id,
        name: field.name,
        price: Number(field.price),
        address: field.address ?? '',
        status: field.status,
      }}
    />
  );
}
