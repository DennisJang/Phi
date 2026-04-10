-- Step 4c: User upload policies for covers bucket
--
-- Adds INSERT/UPDATE/DELETE policies to storage.objects scoped to the
-- authenticated user's own folder under covers/{user_id}/...
--
-- Existing policies on covers bucket (preserved):
--   - covers_public_read (SELECT, public)
--
-- service_role bypasses RLS entirely, so /api/cover-proxy continues to
-- write covers/{sha1}.webp at the bucket root without any policy change.
--
-- Anonymous sign-in users have a real auth.uid() and is_anonymous = true
-- in auth.users; from RLS's perspective they are indistinguishable from
-- a regular authenticated user. That is the entire point.

-- ---------------------------------------------------------------
-- INSERT: user can write only into covers/{their own uid}/...
-- ---------------------------------------------------------------
create policy "covers_user_insert_own_folder"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'covers'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------
-- UPDATE: user can update only objects in their own folder
-- (required for upsert: true on the API route)
-- ---------------------------------------------------------------
create policy "covers_user_update_own_folder"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'covers'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'covers'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------
-- DELETE: user can delete only objects in their own folder
-- (not used in Phase 1, added for symmetry; book deletion in Phase 2
--  will rely on this)
-- ---------------------------------------------------------------
create policy "covers_user_delete_own_folder"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'covers'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );