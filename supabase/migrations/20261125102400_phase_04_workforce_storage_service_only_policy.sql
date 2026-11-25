-- Private workforce document bucket: no browser role may list/read/write objects.
drop policy if exists workforce_private_docs_service_only on storage.objects;
create policy workforce_private_docs_service_only
on storage.objects
for all
to service_role
using (bucket_id='workforce-private-documents')
with check (bucket_id='workforce-private-documents');
