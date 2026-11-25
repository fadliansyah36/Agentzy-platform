-- Link workforce engagement agreements to existing tenant-owned Corporate contracts.
alter table public.workforce_engagements
 add column contract_id uuid references public.contracts(id) on delete restrict;
create index workforce_engagements_contract_idx
 on public.workforce_engagements(tenant_id,contract_id) where contract_id is not null;
