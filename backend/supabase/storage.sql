-- FinSight storage setup

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
	(
		'receipts',
		'receipts',
		false,
		5242880,
		array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
	)
on conflict (id) do update
set public = excluded.public,
		file_size_limit = excluded.file_size_limit,
		allowed_mime_types = excluded.allowed_mime_types;

-- Path convention: <user_id>/<filename>

drop policy if exists "receipts_select_own" on storage.objects;
create policy "receipts_select_own"
on storage.objects
for select
using (
	bucket_id = 'receipts'
	and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "receipts_insert_own" on storage.objects;
create policy "receipts_insert_own"
on storage.objects
for insert
with check (
	bucket_id = 'receipts'
	and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "receipts_update_own" on storage.objects;
create policy "receipts_update_own"
on storage.objects
for update
using (
	bucket_id = 'receipts'
	and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
	bucket_id = 'receipts'
	and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "receipts_delete_own" on storage.objects;
create policy "receipts_delete_own"
on storage.objects
for delete
using (
	bucket_id = 'receipts'
	and auth.uid()::text = (storage.foldername(name))[1]
);
