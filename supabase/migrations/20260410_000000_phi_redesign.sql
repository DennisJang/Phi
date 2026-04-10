-- =====================================================================
-- Phi Redesign Migration
-- =====================================================================
-- Date: 2026-04-10
-- Phase: 1
-- Purpose: Transition from pre-redesign schema to Phi 1.0 schema.
--
-- This migration is atomic. It drops deprecated tables and columns,
-- reshapes profiles and books, creates new tables (book_pages, follows,
-- saved_books, notifications, donation_records), rewrites all RLS
-- policies, adds the get_shelf_signal function, and creates indexes.
--
-- See PROJECT_KNOWLEDGE.md §4 (Database Schema) for the target state.
-- =====================================================================

-- Safety: required extension for gen_random_uuid()
create extension if not exists pgcrypto;

-- =====================================================================
-- Block A: DROP deprecated tables and policies (child → parent order)
-- =====================================================================

-- Drop old policies on tables we're keeping, to unblock column changes
drop policy if exists "Users manage own profile" on public.profiles;
drop policy if exists "Public profiles readable" on public.profiles;
drop policy if exists "Users manage own books" on public.books;
drop policy if exists "Public books readable" on public.books;

-- Drop deprecated tables (children first to respect FKs)
drop table if exists public.photographer_photos cascade;
drop table if exists public.photographers cascade;
drop table if exists public.share_cards cascade;
drop table if exists public.notes cascade;
drop table if exists public.reading_sessions cascade;

-- =====================================================================
-- Block B: ALTER existing tables (profiles, books)
-- =====================================================================

-- profiles: remove deprecated columns, add new ones
alter table public.profiles
  drop column if exists subscription_tier,
  drop column if exists subscription_expires_at;

alter table public.profiles
  add column if not exists display_name text,
  add column if not exists shelf_visibility text default 'private'
    check (shelf_visibility in ('private', 'public')),
  add column if not exists theme_preference text default 'dark'
    check (theme_preference in ('dark', 'light')),
  add column if not exists language_preference text default 'ko'
    check (language_preference in ('ko', 'en'));

-- books: drop deprecated columns first
alter table public.books
  drop column if exists shelf_position,
  drop column if exists material_preset,
  drop column if exists reading_status,
  drop column if exists current_page,
  drop column if exists started_at,
  drop column if exists finished_at;

-- books.source: existing CHECK constraint uses old allowed values
-- (manual, aladin_api, epub_upload, pdf_upload). Drop and recreate with
-- the new allowed values (aladin_api, manual, google_books).
alter table public.books
  drop constraint if exists books_source_check;

alter table public.books
  add constraint books_source_check
  check (source is null or source in ('aladin_api', 'manual', 'google_books'));

-- books: add new columns (source already exists, no ADD needed)
alter table public.books
  add column if not exists publisher text,
  add column if not exists published_year integer,
  add column if not exists cover_source text
    check (cover_source in ('aladin_url', 'user_upload', 'typographic_generated')),
  add column if not exists cover_storage_path text,
  add column if not exists cover_dominant_color text,
  add column if not exists shelf_order integer,
  add column if not exists section_label text,
  add column if not exists is_section_start boolean default false,
  add column if not exists total_pages integer,
  add column if not exists metadata jsonb;
-- NOTE: `source` column already exists on books; CHECK constraint
-- has been rewritten above. `total_pages` and `metadata` already exist
-- but `add column if not exists` is a safe no-op.


-- =====================================================================
-- Block C: CREATE new tables
-- =====================================================================

-- book_pages: one detail page per book, template or canvas mode
create table if not exists public.book_pages (
  id uuid primary key default gen_random_uuid(),
  book_id uuid references public.books(id) on delete cascade unique not null,
  edit_mode text default 'template'
    check (edit_mode in ('template', 'canvas')),
  template_preset text
    check (template_preset in ('classic', 'minimal', 'quote_first', 'essay')),
  content jsonb,
  theme_override text check (theme_override in ('dark', 'light')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- follows: anti-comparison RLS — users cannot see who follows them
create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  notifications_enabled boolean default false,
  created_at timestamptz default now(),
  unique(follower_id, following_id),
  check (follower_id != following_id)
);

-- saved_books: individual book bookmarks
create table if not exists public.saved_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  book_id uuid references public.books(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, book_id)
);

-- notifications: Phase 3+ queue
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('new_book', 'updated_page', 'follow')),
  actor_id uuid references public.profiles(id) on delete cascade,
  book_id uuid references public.books(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- donation_records: Phase 4 transparency ledger
create table if not exists public.donation_records (
  id uuid primary key default gen_random_uuid(),
  period_start date not null,
  period_end date not null,
  total_revenue_krw integer not null,
  donation_amount_krw integer not null,
  recipient_organization text not null,
  donated_at timestamptz not null,
  receipt_url text,
  created_at timestamptz default now()
);

-- =====================================================================
-- Block D: RLS — enable and rewrite all policies
-- =====================================================================

-- profiles
alter table public.profiles enable row level security;

create policy "Users manage own profile"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Public profiles readable"
  on public.profiles for select
  using (shelf_visibility = 'public');

-- books
alter table public.books enable row level security;

create policy "Users manage own books"
  on public.books for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Public shelves readable by all authenticated"
  on public.books for select
  using (user_id in (
    select id from public.profiles where shelf_visibility = 'public'
  ));

-- book_pages
alter table public.book_pages enable row level security;

create policy "Users manage own book pages"
  on public.book_pages for all
  using (book_id in (select id from public.books where user_id = auth.uid()))
  with check (book_id in (select id from public.books where user_id = auth.uid()));

create policy "Public book pages readable"
  on public.book_pages for select
  using (book_id in (
    select id from public.books
    where user_id in (select id from public.profiles where shelf_visibility = 'public')
  ));

-- follows: users see only who THEY follow — never who follows them
alter table public.follows enable row level security;

create policy "Users see who they follow"
  on public.follows for select
  using (auth.uid() = follower_id);

create policy "Users manage own follows"
  on public.follows for all
  using (auth.uid() = follower_id)
  with check (auth.uid() = follower_id);
-- NOTE: intentionally NO policy for "users see who follows them"
-- Follower counts exposed only via get_shelf_signal() SECURITY DEFINER function.

-- saved_books
alter table public.saved_books enable row level security;

create policy "Users manage own saves"
  on public.saved_books for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- notifications
alter table public.notifications enable row level security;

create policy "Users see own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- donation_records: publicly readable for transparency
alter table public.donation_records enable row level security;

create policy "Donation records are public"
  on public.donation_records for select
  using (true);

-- =====================================================================
-- Block E: SECURITY DEFINER aggregation function
-- =====================================================================

-- Returns abstracted signal instead of raw follower count.
-- The anti-comparison philosophy enforced at the query layer.
create or replace function public.get_shelf_signal(target_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  follower_count integer;
begin
  select count(*) into follower_count
  from public.follows
  where following_id = target_user_id;

  return case
    when follower_count >= 1000 then 'widely_loved'
    when follower_count >= 100 then 'spreading'
    when follower_count >= 10 then 'loved'
    else null
  end;
end;
$$;

-- Restrict direct access; callers get only the abstracted return value.
revoke all on function public.get_shelf_signal(uuid) from public;
grant execute on function public.get_shelf_signal(uuid) to anon, authenticated;

-- =====================================================================
-- Block F: INDEXES
-- =====================================================================

create index if not exists idx_books_user
  on public.books(user_id);
create index if not exists idx_books_shelf_order
  on public.books(user_id, shelf_order);
create index if not exists idx_books_isbn
  on public.books(isbn) where isbn is not null;
create index if not exists idx_book_pages_book
  on public.book_pages(book_id);
create index if not exists idx_follows_follower
  on public.follows(follower_id);
create index if not exists idx_follows_following
  on public.follows(following_id);
create index if not exists idx_saved_books_user
  on public.saved_books(user_id);
create index if not exists idx_notifications_user_unread
  on public.notifications(user_id) where read_at is null;

-- =====================================================================
-- End of migration
-- =====================================================================