begin;

drop policy if exists "Public can read door product images bucket" on storage.objects;
create policy "Public can read door product images bucket"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'door-product-images');

drop policy if exists "Admins can upload door product images" on storage.objects;
create policy "Admins can upload door product images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'door-product-images'
  and public.is_admin(auth.uid())
);

drop policy if exists "Admins can update door product images" on storage.objects;
create policy "Admins can update door product images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'door-product-images'
  and public.is_admin(auth.uid())
)
with check (
  bucket_id = 'door-product-images'
  and public.is_admin(auth.uid())
);

drop policy if exists "Admins can delete door product images" on storage.objects;
create policy "Admins can delete door product images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'door-product-images'
  and public.is_admin(auth.uid())
);

commit;
