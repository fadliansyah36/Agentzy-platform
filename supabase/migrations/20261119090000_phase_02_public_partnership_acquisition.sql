-- Phase 02 — Public Landing & Partnership Acquisition
-- Additive migration. Application tables remain server-only; FastAPI is the business authority.
-- Recovery: restore dropped application rows from PITR/backup before any rollback. No destructive DDL.

create table if not exists public.public_catalogue_items (
  id uuid primary key default gen_random_uuid(),
  audience text not null check (audience in ('human','ai')),
  service_key text not null unique,
  name text not null,
  summary text not null,
  scope text not null,
  output text not null,
  boundary text not null,
  governance text not null,
  sort_order integer not null default 100,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.public_faq_entries (
  id uuid primary key default gen_random_uuid(),
  faq_key text not null unique,
  question text not null,
  answer text not null,
  sort_order integer not null default 100,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.public_partnership_applications (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique,
  company_name text not null,
  company_type text not null,
  contact_name text not null,
  contact_title text,
  business_email text not null,
  business_phone text not null,
  website text,
  operating_locations text,
  estimated_workforce integer check (estimated_workforce is null or estimated_workforce between 1 and 1000000),
  human_needs text[] not null default '{}',
  ai_needs text[] not null default '{}',
  provider_products text[] not null default '{}',
  needs_summary text,
  status text not null default 'submitted'
    check (status in ('submitted','assigned','contacted','qualified','disqualified','proposal','contracted','closed')),
  source text not null default 'public_landing',
  request_id text,
  correlation_id text,
  trace_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists public_partnership_applications_created_idx
  on public.public_partnership_applications (created_at desc, id desc);
create index if not exists public_partnership_applications_status_idx
  on public.public_partnership_applications (status, created_at desc);
create index if not exists public_partnership_applications_email_idx
  on public.public_partnership_applications (lower(business_email), created_at desc);

create table if not exists public.public_partnership_consents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.public_partnership_applications(id) on delete restrict,
  consent_type text not null check (consent_type in ('privacy','communication')),
  granted boolean not null check (granted = true),
  policy_version text not null,
  granted_at timestamptz not null default now(),
  source text not null default 'public_landing',
  unique (application_id, consent_type)
);
create index if not exists public_partnership_consents_application_idx
  on public.public_partnership_consents (application_id);

create table if not exists public.crm_prospects (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.public_partnership_applications(id) on delete restrict,
  company_name text not null,
  contact_name text not null,
  business_email text not null,
  business_phone text not null,
  status text not null default 'submitted'
    check (status in ('submitted','assigned','contacted','qualified','disqualified','proposal','contracted','closed')),
  assigned_to uuid references auth.users(id) on delete restrict,
  assigned_at timestamptz,
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists crm_prospects_status_created_idx
  on public.crm_prospects (status, created_at desc, id desc);
create index if not exists crm_prospects_assignee_idx
  on public.crm_prospects (assigned_to, status, created_at desc);

create table if not exists public.crm_prospect_activities (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.crm_prospects(id) on delete restrict,
  actor_user_id uuid references auth.users(id) on delete restrict,
  activity_type text not null check (activity_type in ('submitted','assigned','status_changed','note','notification_queued')),
  from_status text,
  to_status text,
  note text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists crm_prospect_activities_prospect_idx
  on public.crm_prospect_activities (prospect_id, created_at desc, id desc);

create table if not exists public.public_partnership_attachments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.public_partnership_applications(id) on delete restrict,
  bucket_id text not null default 'partnership-quarantine',
  object_path text not null unique,
  original_filename text not null,
  content_type text not null,
  file_size bigint not null check (file_size > 0 and file_size <= 10485760),
  sha256 text not null,
  scan_status text not null default 'pending_scan'
    check (scan_status in ('pending_scan','clean','infected','rejected')),
  uploaded_at timestamptz not null default now(),
  scanned_at timestamptz,
  scan_result jsonb not null default '{}'
);
create index if not exists public_partnership_attachments_application_idx
  on public.public_partnership_attachments (application_id, uploaded_at desc);

create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  aggregate_type text not null,
  aggregate_id uuid not null,
  recipient_email text,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending','processing','sent','failed','dead_letter')),
  attempts integer not null default 0 check (attempts >= 0),
  available_at timestamptz not null default now(),
  processed_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists notification_outbox_ready_idx
  on public.notification_outbox (available_at, created_at) where status in ('pending','failed');

create table if not exists public.public_api_rate_limits (
  key_hash text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (key_hash, window_started_at)
);

-- Seed only the canonical service catalogue and FAQ content described by Master PRD v2.0.
insert into public.public_catalogue_items
  (audience,service_key,name,summary,scope,output,boundary,governance,sort_order)
values
('human','sales-workforce','Sales Workforce','Tim sales profesional untuk akuisisi dan pengembangan pelanggan.','Rekrutmen, onboarding, penempatan, supervisi dan aktivitas penjualan.','Tim sales terkelola dan laporan aktivitas.','Target, wilayah dan penawaran mengikuti persetujuan kontrak.','Tenant-scoped assignment, KPI terdefinisi dan audit aktivitas.',10),
('human','affiliate-network','Affiliate / Freelance Network','Pengelolaan jaringan affiliate dan tenaga freelance.','Referral, pendaftaran, verifikasi, pembinaan dan atribusi.','Jaringan affiliate dengan status dan atribusi yang tercatat.','Aktivasi bergantung pada verifikasi identitas dan perjanjian.','Consent, verifikasi, anti-fraud dan audit perubahan atribusi.',20),
('human','field-technicians','Field Technician Workforce','Tenaga teknisi lapangan untuk instalasi dan pemeliharaan.','Rekrutmen, penjadwalan, dispatch, bukti pekerjaan dan QC.','Kapasitas teknisi dan bukti pekerjaan terstruktur.','SLA dan cakupan pekerjaan mengikuti kontrak dan sertifikasi.','Scope tenant, sertifikasi, keselamatan dan evidence governance.',30),
('human','recruitment-onboarding','Recruitment & Onboarding','Dukungan proses rekrutmen dan aktivasi tenaga kerja.','Pendaftaran, pemeriksaan, onboarding dan status eligibility.','Lifecycle kandidat yang dapat ditelusuri.','Keputusan verifikasi mengikuti proses dan otoritas yang ditetapkan.','Data minimization, consent dan audit lifecycle.',40),
('human','training-certification','Training & Certification','Pembekalan dan pengelolaan pelatihan tenaga kerja.','Kursus, enrollment, assessment dan sertifikasi.','Status pelatihan dan catatan kompetensi.','Tidak menggantikan sertifikasi eksternal yang diwajibkan.','Evidence, masa berlaku dan akses berbasis peran.',50),
('human','scheduling-dispatch','Scheduling & Dispatch','Penjadwalan dan distribusi tugas lapangan.','Availability, hard constraints, assignment dan dispatch.','Jadwal dan penugasan yang dapat diaudit.','Penugasan tunduk pada kompetensi, kontrak dan ketersediaan.','Deterministic constraints dan audit keputusan.',60),
('human','performance-kpi','Performance & KPI','Pengukuran kinerja tenaga kerja berdasarkan definisi KPI.','KPI definition, source, period, target dan measurement.','Laporan kinerja dengan sumber dan periode.','Tidak menampilkan KPI tanpa data sumber.','Formula versioned, owner dan freshness metadata.',70),
('human','commission-admin','Commission Administration','Administrasi komisi berdasarkan skema dan produktivitas yang sah.','Eligibility, calculation, adjustment dan statement.','Rincian komisi yang dapat direkonsiliasi.','Nilai final mengikuti skema kontrak dan event tervalidasi.','Deterministic Decimal calculation dan immutable ledger.',80),
('human','workforce-reporting','Workforce Reporting','Pelaporan operasional tenaga kerja.','Produktivitas, SLA, kualitas dan ketersediaan.','Laporan berdasarkan data operasional aktual.','Tidak menampilkan data simulasi sebagai hasil aktual.','Tenant isolation, source provenance dan audit.',90),
('ai','ai-sales-assistant','AI Sales Assistant','Asisten AI untuk mendukung aktivitas sales.','Knowledge retrieval, drafting dan task assistance.','Rekomendasi dan draft yang ditinjau pengguna.','Tidak melakukan komitmen komersial tanpa otorisasi manusia.','AI Gateway, tenant policy, budget dan audit.',10),
('ai','ai-lead-qualification','AI Lead Qualification','Bantuan AI untuk merangkum dan mengklasifikasikan prospek.','Klasifikasi berbasis kriteria yang disetujui dan data yang tersedia.','Ringkasan dan rekomendasi kualifikasi.','Keputusan final tetap pada petugas berwenang.','Permission-filtered data, explainability dan human review.',20),
('ai','ai-affiliate-assistant','AI Affiliate Recruitment Assistant','Asisten AI untuk mendukung komunikasi dan onboarding affiliate.','FAQ, panduan registrasi dan status proses.','Draft jawaban dan panduan proses.','Tidak memverifikasi identitas atau mengaktifkan affiliate sendiri.','Consent, approved knowledge dan audit.',30),
('ai','ai-marketing-content','AI Marketing & Content Assistant','Bantuan pembuatan materi pemasaran.','Ide, copy, variasi konten dan review.','Draft konten yang siap ditinjau.','Tidak mempublikasikan tanpa approval.','Brand policy, moderation dan human approval.',40),
('ai','ai-customer-support','AI Customer Support Assistant','Asisten untuk dukungan pelanggan.','Pencarian knowledge dan draft respons.','Jawaban dengan rujukan sumber yang tersedia.','Tidak mengakses data pelanggan di luar scope.','Tenant isolation, citation dan escalation.',50),
('ai','ai-technical-knowledge','AI Technical Knowledge Assistant','Asisten knowledge teknis untuk tim lapangan.','Retrieval dokumen teknis yang diizinkan.','Ringkasan prosedur dan referensi teknis.','Tidak menggantikan prosedur keselamatan dan otorisasi kerja.','RAG provenance, versioning dan access policy.',60),
('ai','ai-operations-coordinator','AI Operations Coordinator','Bantuan koordinasi aktivitas operasional.','Ringkasan status dan rekomendasi tindak lanjut.','Task suggestions dan status summary.','Tidak mengeksekusi perubahan sensitif tanpa permission/approval.','Tool allowlist, risk policy dan audit.',70),
('ai','ai-performance-analyst','AI Data & Performance Analyst','Analisis data dan kinerja berdasarkan sumber yang tersedia.','Query terotorisasi, agregasi dan ringkasan.','Analisis dengan periode, unit dan sumber data.','Tidak mengarang KPI ketika data tidak tersedia.','Data access policy, provenance dan trace.',80),
('ai','ai-finance-reporting','AI Finance Reporting Assistant','Bantuan penyusunan laporan keuangan operasional.','Ringkasan transaksi dan laporan yang diizinkan.','Draft laporan dengan sumber transaksi.','Tidak menghitung payout final melalui LLM.','Deterministic finance engine dan least privilege.',90),
('ai','custom-ai-worker','Custom AI Worker by Job Description','AI Worker yang dikonfigurasi sesuai kebutuhan pekerjaan.','Discovery, job description, tool and permission mapping.','Scope dan rancangan AI Worker untuk evaluasi.','Aktivasi menunggu policy, model dan approval.','Capability allowlist, tenant policy dan budget.',100)
on conflict (service_key) do update set
  audience=excluded.audience,name=excluded.name,summary=excluded.summary,scope=excluded.scope,
  output=excluded.output,boundary=excluded.boundary,governance=excluded.governance,
  sort_order=excluded.sort_order,updated_at=now();

insert into public.public_faq_entries (faq_key,question,answer,sort_order) values
('agentzy','Apa itu Agentzy?','Agentzy adalah platform terpadu untuk mengelola Human Workforce dan AI Workforce dalam satu ekosistem kerja.',10),
('human-ai','Apa perbedaan Human Workforce dan AI Workforce?','Human Workforce menjalankan pekerjaan manusia dan aktivitas lapangan; AI Workforce membantu tugas digital, analisis, komunikasi dan koordinasi sesuai izin.',20),
('managed-ai','Apakah Agentzy menyediakan AI terkelola?','Agentzy menyediakan layanan AI Workforce yang dapat dikonfigurasi berdasarkan kebutuhan, kebijakan data, model, anggaran dan persetujuan.',30),
('corporate','Apakah perusahaan dapat mengawasi kinerja?','Portal Corporate/ISP dirancang untuk menampilkan aktivitas, KPI dan status operasional sesuai data serta hak akses tenant.',40),
('affiliate','Bagaimana proses rekrutmen affiliate?','Proses dimulai dari referral dan aplikasi, dilanjutkan verifikasi, perjanjian, pelatihan bila diperlukan, persetujuan dan aktivasi.',50),
('commission','Bagaimana komisi dihitung?','Komisi mengikuti skema yang berlaku, event produktivitas yang tervalidasi dan perhitungan deterministik di backend.',60),
('providers','Apakah Agentzy mendukung multi-ISP?','Platform dirancang untuk mendukung multi-provider melalui integrasi resmi yang diotorisasi, partner portal atau pertukaran file aman.',70),
('integration','Bagaimana integrasi sistem dilakukan?','Integrasi ditentukan melalui discovery dan menggunakan API, webhook, partner portal atau secure file exchange yang diizinkan.',80),
('security','Bagaimana keamanan data dijaga?','Akses dibatasi berdasarkan tenant dan permission, dengan audit, kebijakan retensi, serta kontrol penyimpanan dokumen.',90),
('partnership','Bagaimana mengajukan kerja sama?','Isi formulir pengajuan kerja sama. Tim Agentzy akan menindaklanjuti melalui proses qualification, discovery dan proposal.',100)
on conflict (faq_key) do update set question=excluded.question,answer=excluded.answer,sort_order=excluded.sort_order,updated_at=now();

insert into public.permissions (key,domain,action,description,resource,risk_level)
values
('platform.partnership.read','platform.partnership','read','Read public partnership applications and CRM prospects.','partnership','sensitive'),
('platform.partnership.manage','platform.partnership','manage','Assign, qualify and manage partnership prospects.','partnership','privileged')
on conflict (key) do update set domain=excluded.domain,action=excluded.action,description=excluded.description,resource=excluded.resource,risk_level=excluded.risk_level;

insert into public.role_permissions (role_id,permission_key)
select r.id,p.key
from public.roles r cross join public.permissions p
where r.key='platform_super_admin'
  and p.key in ('platform.partnership.read','platform.partnership.manage')
on conflict do nothing;

alter table public.public_catalogue_items enable row level security;
alter table public.public_faq_entries enable row level security;
alter table public.public_partnership_applications enable row level security;
alter table public.public_partnership_consents enable row level security;
alter table public.crm_prospects enable row level security;
alter table public.crm_prospect_activities enable row level security;
alter table public.public_partnership_attachments enable row level security;
alter table public.notification_outbox enable row level security;
alter table public.public_api_rate_limits enable row level security;

revoke all on public.public_catalogue_items, public.public_faq_entries,
  public.public_partnership_applications, public.public_partnership_consents,
  public.crm_prospects, public.crm_prospect_activities,
  public.public_partnership_attachments, public.notification_outbox,
  public.public_api_rate_limits from public, anon, authenticated, service_role;

-- Private quarantine bucket: only the FastAPI service credential can upload objects.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('partnership-quarantine','partnership-quarantine',false,10485760,
  array['application/pdf','image/jpeg','image/png'])
on conflict (id) do update set public=false,file_size_limit=10485760,
  allowed_mime_types=excluded.allowed_mime_types;
