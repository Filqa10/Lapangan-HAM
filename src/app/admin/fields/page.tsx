import { createClient } from '@/lib/supabase/server';
import { AdminFieldsClient } from './AdminFieldsClient';

type FieldRow = {
  id: number;
  name: string;
  price: number | string;
  address: string | null;
  status: string;
  created_at: string;
};

export default async function AdminFieldsPage() {
  const supabase = await createClient();

  const { data: fields } = await supabase
    .from('fields')
    .select('id, name, price, address, status, created_at')
    .order('created_at', { ascending: false });

  const rows = ((fields ?? []) as FieldRow[]).map((f) => {
    // Format created_at to DD MMM YYYY HH:mm
    const dateObj = new Date(f.created_at);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = dateObj.getDate();
    const month = months[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const formattedDate = `${day} ${month} ${year} ${hours}:${minutes}`;

    return {
      id: f.id,
      name: f.name,
      price: Number(f.price),
      address: f.address,
      status: f.status,
      created_at_label: formattedDate,
    };
  });

  return <AdminFieldsClient fields={rows} />;
}
