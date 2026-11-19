-- Applied migration 20261119161337: clarify tenant-scoped corporate profile reference.
alter table public.provider_profiles
 rename column corporate_profile_id to corporate_tenant_id;
