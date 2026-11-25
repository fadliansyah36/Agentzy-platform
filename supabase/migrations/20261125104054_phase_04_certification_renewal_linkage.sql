-- Link certification renewal records without overwriting historical certificates.
alter table public.workforce_certifications
 add column supersedes_certification_id uuid references public.workforce_certifications(id) on delete set null;
create index workforce_certifications_supersedes_idx
 on public.workforce_certifications(tenant_id,supersedes_certification_id)
 where supersedes_certification_id is not null;
