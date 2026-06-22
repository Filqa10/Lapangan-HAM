-- =============================================================================
-- Booking Lapangan HAM — Supabase Storage buckets & RLS policies
--
-- Source of truth for storage configuration. Applied to Supabase via the
-- Supabase MCP `apply_migration` tool. Idempotent so it can be re-run safely.
--
-- Buckets:
--   field-images   (public)  — read: everyone; write/update/delete: admin only
--   payment-proofs (private) — read: uploader + admin; write: uploader (own folder)
--
-- Convention: payment-proof objects are stored under a top-level folder named
-- after the uploader's auth uid (e.g. `<uid>/<booking_id>/receipt.jpg`), so
-- `(storage.foldername(name))[1]` is the owner uid.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Buckets
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('field-images', 'field-images', true)
on conflict (id) do update set public = excluded.public;

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do update set public = excluded.public;

-- -----------------------------------------------------------------------------
-- 2. RLS — field-images (public read via object URL, admin-only listing + write)
--    Public buckets serve objects via their public URL WITHOUT any SELECT
--    policy; a broad SELECT only enables the .list() API and exposes the full
--    bucket contents (advisor lint 0025). Listing is scoped to admins (for the
--    field-management UI); customers read images via public object URLs.
--    Reuses public.is_admin() (SECURITY DEFINER, recursion-safe).
-- -----------------------------------------------------------------------------
drop policy if exists "field_images_public_read" on storage.objects;
drop policy if exists "Allow public read for field-images" on storage.objects;
drop policy if exists "field_images_admin_read" on storage.objects;
create policy "field_images_admin_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'field-images' and public.is_admin());

drop policy if exists "field_images_admin_insert" on storage.objects;
drop policy if exists "Allow admin write for field-images" on storage.objects;
create policy "field_images_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'field-images' and public.is_admin());

drop policy if exists "field_images_admin_update" on storage.objects;
create policy "field_images_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'field-images' and public.is_admin())
  with check (bucket_id = 'field-images' and public.is_admin());

drop policy if exists "field_images_admin_delete" on storage.objects;
create policy "field_images_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'field-images' and public.is_admin());

-- -----------------------------------------------------------------------------
-- 3. RLS — payment-proofs (private; owner + admin read, owner-folder write)
-- -----------------------------------------------------------------------------
drop policy if exists "payment_proofs_owner_admin_read" on storage.objects;
drop policy if exists "Allow owner and admin read for payment-proofs" on storage.objects;
create policy "payment_proofs_owner_admin_read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'payment-proofs'
    and (
      (select auth.uid())::text = (storage.foldername(name))[1]
      or public.is_admin()
    )
  );

-- Authenticated users may upload only into their own uid-prefixed folder.
drop policy if exists "payment_proofs_owner_insert" on storage.objects;
drop policy if exists "Allow authenticated write for payment-proofs" on storage.objects;
create policy "payment_proofs_owner_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'payment-proofs'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

-- Admins may delete payment proofs (e.g. cleanup of rejected uploads).
drop policy if exists "payment_proofs_admin_delete" on storage.objects;
create policy "payment_proofs_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'payment-proofs' and public.is_admin());

-- -----------------------------------------------------------------------------
-- 4. Bucket-level hygiene: image-only uploads, 5MB cap per object.
-- -----------------------------------------------------------------------------
update storage.buckets
  set file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id in ('field-images', 'payment-proofs');
