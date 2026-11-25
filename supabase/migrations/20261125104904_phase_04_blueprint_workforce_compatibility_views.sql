-- Blueprint compatibility projections; no duplicate storage or second source of truth.
create or replace view public.workforce_contracts
with (security_invoker = true) as
select id,tenant_id,workforce_profile_id,contract_id as corporate_contract_id,
       classification,agreement_reference,effective_from,effective_until,
       legal_review_reference,facts_acknowledged,status,change_reason,created_by,created_at,updated_at
from public.workforce_engagements;

create or replace view public.workforce_skills
with (security_invoker = true) as
select id,tenant_id,workforce_profile_id,skill_id,proficiency,experience_months,
       verified,verified_by,verified_at,evidence_reference,created_at,updated_at
from public.workforce_worker_skills;

revoke all on public.workforce_contracts from anon,authenticated;
revoke all on public.workforce_skills from anon,authenticated;
