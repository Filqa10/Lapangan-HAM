import { FieldForm } from '../FieldForm';
import { createFieldAction } from '@/actions/fields';

async function wrappedCreateAction(_prevState: { ok: boolean; error: string | null }, formData: FormData) {
  'use server';
  const result = await createFieldAction(formData);
  return { ok: result.ok, error: result.error ?? null };
}

export default function CreateFieldPage() {
  return (
    <FieldForm
      action={wrappedCreateAction}
      title="Add New Field"
    />
  );
}
