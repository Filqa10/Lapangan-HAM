import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Schema integration guard.
 *
 * The Postgres schema is applied to Supabase via the Supabase MCP migration
 * tooling, but `database/migration.sql` is the committed source of truth. These
 * tests assert that the migration file actually defines every table, enum,
 * trigger, and security control the application depends on, so an accidental
 * deletion or rename is caught in CI before it reaches the database.
 */
describe('database/migration.sql schema definition', () => {
  const rawSql = readFileSync(
    resolve(__dirname, '../../../database/migration.sql'),
    'utf8',
  );
  // Strip `-- ...` line comments so prose mentions of SQL keywords don't get
  // counted as executable statements, then normalise case for matching.
  const sql = rawSql
    .replace(/--[^\n]*/g, '')
    .toLowerCase();
  const normalizedSql = sql.replace(/\s+/g, ' ');

  it('defines the required enum types with all values', () => {
    expect(sql).toContain("create type public.user_role as enum ('admin', 'customer')");
    expect(sql).toContain("create type public.payment_type as enum ('dp', 'final')");
    // booking_status must keep every state in the two-stage payment lifecycle;
    // dropping one (e.g. payment_2_pending) would silently break the app.
    expect(sql).toContain('create type public.booking_status as enum');
    for (const state of [
      'pending',
      'dp_paid',
      'payment_2_pending',
      'paid',
      'confirmed',
      'cancelled',
    ]) {
      expect(sql).toContain(`'${state}'`);
    }
  });

  it('creates every application table', () => {
    for (const table of ['profiles', 'fields', 'bookings', 'payments']) {
      expect(sql).toContain(`create table if not exists public.${table}`);
    }

    expect(normalizedSql).toMatch(
      /create table if not exists public\.profiles\s*\(\s*id\s+uuid primary key references auth\.users on delete cascade,\s*name\s+text not null,\s*email\s+text,\s*phone\s+text,\s*role\s+public\.user_role not null default 'customer'/,
    );
  });

  it('wires the auth-sync and double-booking triggers', () => {
    expect(sql).toContain('function public.handle_new_user()');
    expect(sql).toContain('on_auth_user_created');
    expect(sql).toContain('function public.prevent_double_booking()');
    expect(sql).toContain('before_booking_upsert');
    expect(sql).toContain('doublebookingexception');
  });

  it('keeps auth-to-profile email sync in the committed migration', () => {
    expect(normalizedSql).toMatch(
      /insert into public\.profiles\s*\(\s*id\s*,\s*name\s*,\s*email\s*,\s*phone\s*,\s*role\s*\)\s*values\s*\(\s*new\.id\s*,\s*coalesce\(new\.raw_user_meta_data ->> 'name', 'user'\)\s*,\s*new\.email\s*,\s*new\.raw_user_meta_data ->> 'phone'\s*,\s*'customer'\s*\)/,
    );
    expect(normalizedSql).toMatch(
      /update public\.profiles as p\s*set email = u\.email\s*from auth\.users as u\s*where p\.id = u\.id\s*and u\.email is not null\s*and p\.email is distinct from u\.email/,
    );
  });

  it('pins search_path on every security definer function', () => {
    // Every `security definer` function declaration must immediately pin its
    // search_path to prevent search-path injection. We match the declaration
    // sequence directly (ignoring prose mentions in comments) so a definer
    // function without a pinned search_path fails the guard.
    const definerDecls = sql.match(/\bsecurity\s+definer\b/g) ?? [];
    const definerWithPinnedPath =
      sql.match(/\bsecurity\s+definer\b[\s\S]{0,80}?set\s+search_path\s*=\s*''/g) ?? [];
    expect(definerDecls.length).toBeGreaterThan(0);
    expect(definerWithPinnedPath.length).toBe(definerDecls.length);
  });

  it('enables row level security on every table', () => {
    for (const table of ['profiles', 'fields', 'bookings', 'payments']) {
      expect(sql).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it('enforces concurrency-safe overlap prevention with an exclusion constraint', () => {
    expect(sql).toContain('create extension if not exists btree_gist');
    expect(sql).toContain('exclude using gist');
    expect(sql).toContain('bookings_no_overlap');
    expect(sql).toContain("where (status <> 'cancelled')");
  });

  it('keeps final RLS hardening controls in the committed migration', () => {
    expect(normalizedSql).toMatch(/grant update\s*\(\s*name\s*,\s*phone\s*\) on public\.profiles to authenticated/);
    expect(normalizedSql).not.toMatch(/create policy "fields_delete_admin"/);
    expect(sql).toContain('function public.calculate_booking_price_db(');
    expect(sql).toContain('function public.prevent_customer_booking_update_tampering()');
    expect(sql).toContain('create trigger prevent_customer_booking_update_tampering');
    expect(normalizedSql).toMatch(/create policy "payments_insert_own" on public\.payments for insert to authenticated with check \( status = 'pending'/);
  });
});
