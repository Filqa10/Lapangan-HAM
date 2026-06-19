import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Storage configuration guard.
 *
 * `database/storage.sql` is the committed source of truth for Supabase Storage
 * buckets and their RLS policies. These tests assert the file defines both
 * required buckets and secure per-operation policies, so an accidental deletion
 * or a regression to a permissive policy is caught in CI before it reaches the
 * database. Applied config is verified live via the Supabase MCP.
 */
describe('database/storage.sql storage configuration', () => {
  const rawSql = readFileSync(
    resolve(__dirname, '../../../database/storage.sql'),
    'utf8',
  );
  const sql = rawSql.replace(/--[^\n]*/g, '').toLowerCase();

  it('creates both required buckets with the correct visibility', () => {
    expect(sql).toContain(
      "values ('field-images', 'field-images', true)",
    );
    expect(sql).toContain(
      "values ('payment-proofs', 'payment-proofs', false)",
    );
  });

  it('restricts field-images writes to admins (insert/update/delete)', () => {
    expect(sql).toContain('field_images_admin_insert');
    expect(sql).toContain('field_images_admin_update');
    expect(sql).toContain('field_images_admin_delete');
    // No broad public SELECT — listing is admin-only (public reads use the
    // public object URL, which needs no policy). A `drop policy if exists`
    // cleanup line may reference the old name, but there must be no CREATE.
    expect(sql).not.toMatch(/create policy "field_images_public_read"/);
    expect(sql).toContain('field_images_admin_read');
    expect(sql).toContain('public.is_admin()');
  });

  it('restricts payment-proofs to owner-folder + admin read and owner-folder write', () => {
    expect(sql).toContain('payment_proofs_owner_admin_read');
    expect(sql).toContain('payment_proofs_owner_insert');
    expect(sql).toContain("(select auth.uid())::text = (storage.foldername(name))[1]");
  });

  it('enforces image-only uploads with a 5MB cap on both buckets', () => {
    expect(sql).toContain("array['image/jpeg', 'image/png', 'image/webp']");
    expect(sql).toContain('file_size_limit = 5242880');
  });
});
