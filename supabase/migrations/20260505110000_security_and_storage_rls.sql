begin;
  -- Remove existing broad update policy
  drop policy if exists "Users can update own profile" on users;

  -- Allow users to update only safe columns
  create policy "Users can update own profile (safe columns)" on users
    for update
    using (auth.uid() = id)
    with check (
      auth.uid() = id
      and role = (select role from users where id = auth.uid()) -- Role cannot be changed by user
      and is_active = (select is_active from users where id = auth.uid()) -- Status cannot be changed by user
    );

  -- Storage Policies
  -- Allow users to upload to their own folder in seller-documents
  create policy "Users can upload own documents" on storage.objects
    for insert
    with check (
      bucket_id = 'seller-documents'
      and (storage.foldername(name))[1] = auth.uid()::text
    );

  -- Allow users to read their own documents
  create policy "Users can read own documents" on storage.objects
    for select
    using (
      bucket_id = 'seller-documents'
      and (storage.foldername(name))[1] = auth.uid()::text
    );

  -- Admin access to all documents
  create policy "Admins can manage all documents" on storage.objects
    for all
    using (
      exists (
        select 1 from users
        where id = auth.uid()
        and role = 'admin'
      )
    );

  -- Public access to avatars and product images
  create policy "Public access to avatars" on storage.objects
    for select
    using (bucket_id = 'avatars');

  create policy "Public access to product images" on storage.objects
    for select
    using (bucket_id = 'product-images');

  -- Users can upload own avatars
  create policy "Users can upload own avatars" on storage.objects
    for insert
    with check (
      bucket_id = 'avatars'
      and (storage.foldername(name))[1] = auth.uid()::text
    );

  -- Sellers can upload own product images
  create policy "Sellers can upload own product images" on storage.objects
    for insert
    with check (
      bucket_id = 'product-images'
      and exists (
        select 1 from seller_profiles
        where user_id = auth.uid()
        and status = 'approved'
      )
    );
commit;
