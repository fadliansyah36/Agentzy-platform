'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { FileText, RefreshCw } from 'lucide-react';
import { useAgentzyAuth } from '@/apps/web/lib/auth/useAgentzyAuth';
import {
  archiveContractDocument, createCorporateAmendment, createCorporateContract, createContractApprovalPolicy,
  createContractApprovalDelegation, listContractApprovalDelegations, revokeContractApprovalDelegation,
  decideContractApproval, getCorporateContract, getCorporateProfile,
  getContractDocumentDownload, getEffectiveContractEntitlements,
  listContractApprovalPolicies, listContractDocuments, listCorporateContracts,
  requestContractRenewal, listContractVersions, listContractRenewals, decideContractRenewal,
  getPublicCatalogue, submitContractPolicyReview, updateCorporateProfileStatus,
  upsertCorporateProfile, uploadContractDocument,
  changeContractLifecycle,
  type CorporateContract, type CorporateProfile, type ContractDocument,
  type ContractEntitlement, type ContractVersionRecord, type ContractRenewalRecord, type PublicCatalogueItem,
  type ContractApprovalDelegation,
} from '@/apps/web/lib/api-client';
import { CorporatePageHeader, CorporateSegmentedTabs } from '../../components/data-display/CorporateDataDisplay';
import type { CorporateTenant } from '../../lib/corporate-types';
import { AIWorkerEntitlementPanel } from './AIWorkerEntitlementPanel';

type Tab = 'profile' | 'contracts' | 'sow' | 'sla' | 'approvals' | 'documents' | 'entitlements';
const field = 'h-10 w-full rounded-[9px] border border-[#D8E3E9] bg-white px-3 text-sm text-[#17324D]';
const label = 'mb-1 block text-xs font-semibold text-[#526675]';
const primary = 'inline-flex h-10 items-center rounded-[9px] bg-[#17324D] px-4 text-xs font-semibold text-white disabled:opacity-50';
const secondary = 'inline-flex h-9 items-center rounded-[9px] border border-[#D8E3E9] bg-white px-3 text-xs font-semibold text-[#17324D] disabled:opacity-50';
const fmt = (v?: string | null) => v ? new Date(v).toLocaleDateString('id-ID') : '—';
const statusName: Record<string,string> = {
  draft: 'Draft', review_pending: 'Menunggu approval', approved: 'Disetujui',
  active: 'Aktif', suspended: 'Ditangguhkan', expired: 'Kedaluwarsa',
  terminated: 'Dihentikan', rejected: 'Ditolak',
};

export function ContractPartnershipView({ tenant, onBack }: { tenant: CorporateTenant; onBack: () => void }) {
  const auth = useAgentzyAuth();
  const token = auth.session?.access_token ?? '';
  const [tab,setTab] = useState<Tab>('contracts');
  const [profile,setProfile] = useState<CorporateProfile | null>(null);
  const [profileForm,setProfileForm] = useState({legal_name:'',registration_number:'',billing_email:'',billing_phone:'',contact_name:'',contact_title:'',website:'',country_code:'ID',organization_id:'',branch_id:''});
  const [contracts,setContracts] = useState<CorporateContract[]>([]);
  const [selectedId,setSelectedId] = useState('');
  const [detail,setDetail] = useState<CorporateContract | null>(null);
  const [documents,setDocuments] = useState<ContractDocument[]>([]);
  const [versions,setVersions] = useState<ContractVersionRecord[]>([]);
  const [renewals,setRenewals] = useState<ContractRenewalRecord[]>([]);
  const [delegations,setDelegations] = useState<ContractApprovalDelegation[]>([]);
  const [delegationForm,setDelegationForm] = useState({delegatee_user_id:'',starts_at:'',ends_at:'',reason:''});
  const [entitlements,setEntitlements] = useState<ContractEntitlement[]>([]);
  const [policies,setPolicies] = useState<Array<Record<string,unknown>>>([]);
  const [catalogue,setCatalogue] = useState<PublicCatalogueItem[]>([]);
  const [loading,setLoading] = useState(false);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const [newContract,setNewContract] = useState({contract_number:'',title:'',contract_type:'master' as 'master'|'statement_of_work',parent_contract_id:'',scope_summary:'',terms:'',service_key:'',service_scope:'',monthly_fee:'',human_limit:'',ai_limit:'',effective_start:'',effective_end:''});
  const [amendment,setAmendment] = useState({change_summary:'',scope_summary:'',effective_from:''});
  const [policyName,setPolicyName] = useState('');
  const [policyType,setPolicyType] = useState<'master'|'statement_of_work'|'amendment'>('master');
  const [policySteps,setPolicySteps] = useState(1);
  const [minimumApprovals,setMinimumApprovals] = useState(1);
  const [approvalRole,setApprovalRole] = useState('');
  const [renewalEnd,setRenewalEnd] = useState('');
  const [documentType,setDocumentType] = useState<'master_agreement'|'statement_of_work'|'sla'|'amendment'|'supporting'>('master_agreement');

  const can = (permission:string) => auth.identity?.memberships.some((m) => m.tenant_id === tenant.id && m.permissions.includes(permission)) ?? false;
  const canManage = can('corporate.contracts.manage');
  const canProfile = can('corporate.profiles.manage');
  const canApprove = can('corporate.contracts.approve');
  const canLifecycle = can('corporate.contracts.lifecycle');

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError('');
    const results = await Promise.allSettled([
      getCorporateProfile(token,tenant.id),
      listCorporateContracts(token,tenant.id),
      getEffectiveContractEntitlements(token,tenant.id),
      listContractApprovalPolicies(token,tenant.id),
    ]);
    if (results[0].status === 'fulfilled') {
      const p = results[0].value.data; setProfile(p);
      if (p) setProfileForm({legal_name:p.legal_name ?? '',registration_number:p.registration_number ?? '',billing_email:p.billing_email ?? '',billing_phone:p.billing_phone ?? '',contact_name:p.contact_name ?? '',contact_title:p.contact_title ?? '',website:p.website ?? '',country_code:p.country_code ?? 'ID',organization_id:p.organization_id ?? '',branch_id:p.branch_id ?? ''});
    } else setError(results[0].reason instanceof Error ? results[0].reason.message : 'Gagal memuat profile.');
    if (results[1].status === 'fulfilled') {
      const contractRows = results[1].value.data;
      setContracts(contractRows);
      setSelectedId((id) => id || contractRows[0]?.id || '');
    } else setError(results[1].reason instanceof Error ? results[1].reason.message : 'Gagal memuat kontrak.');
    if (results[2].status === 'fulfilled') setEntitlements(results[2].value.data);
    if (results[3].status === 'fulfilled') setPolicies(results[3].value.data);
    try {
      const catalogueResult = await getPublicCatalogue();
      setCatalogue([...catalogueResult.data.human_workforce, ...catalogueResult.data.ai_workforce]);
    } catch {
      setCatalogue([]);
    }
    setLoading(false);
  },[token,tenant.id]);

  const loadDetail = useCallback(async (id:string) => {
    if (!id || !token) { setDetail(null); setDocuments([]); return; }
    try {
      const [d,docs,versionRows,renewalRows] = await Promise.all([
        getCorporateContract(token,tenant.id,id),
        listContractDocuments(token,tenant.id,id),
        listContractVersions(token,tenant.id,id),
        listContractRenewals(token,tenant.id,id),
      ]);
      setDetail(d.data); setDocuments(docs.data);
      setVersions(versionRows.data); setRenewals(renewalRows.data);
    } catch(e) { setError(e instanceof Error ? e.message : 'Gagal memuat detail kontrak.'); }
  },[token,tenant.id]);

  useEffect(() => {
    if (!token || !canApprove) return;
    void listContractApprovalDelegations(token,tenant.id)
      .then((result) => setDelegations(result.data))
      .catch(() => setDelegations([]));
  },[token,tenant.id,canApprove]);
  useEffect(() => {
    const task = Promise.resolve().then(() => refresh());
    return () => { void task; };
  },[refresh]);
  useEffect(() => {
    if (!selectedId) return;
    const task = Promise.resolve().then(() => loadDetail(selectedId));
    return () => { void task; };
  },[selectedId,loadDetail]);

  const action = async (fn:()=>Promise<unknown>,message:string) => {
    setSaving(true); setError(''); setNotice('');
    try {
      await fn(); setNotice(message); await refresh();
      if(selectedId) await loadDetail(selectedId);
      if(canApprove) {
        const result = await listContractApprovalDelegations(token,tenant.id);
        setDelegations(result.data);
      }
    }
    catch(e) { setError(e instanceof Error ? e.message : 'Permintaan gagal.'); }
    finally { setSaving(false); }
  };

  const saveProfile = () => action(() => upsertCorporateProfile(token,{
    tenant_id:tenant.id, organization_id:profileForm.organization_id || null,
    branch_id:profileForm.branch_id || null, legal_name:profileForm.legal_name,
    registration_number:profileForm.registration_number || null,
    billing_email:profileForm.billing_email || null,billing_phone:profileForm.billing_phone || null,
    billing_address:profile?.billing_address ?? {},tax_profile:profile?.tax_profile ?? {},
    contact_name:profileForm.contact_name || null,contact_title:profileForm.contact_title || null,
    website:profileForm.website || null,country_code:profileForm.country_code,
  }), 'Corporate profile tersimpan.');

  const createContract = () => action(async () => {
    const result = await createCorporateContract(token,{
      tenant_id:tenant.id,organization_id:profile?.organization_id ?? null,
      branch_id:profile?.branch_id ?? null,
      parent_contract_id:newContract.parent_contract_id || null,
      contract_number:newContract.contract_number,title:newContract.title,
      contract_type:newContract.contract_type,currency:'IDR',
      effective_start:newContract.effective_start || null,effective_end:newContract.effective_end || null,
      scope_summary:newContract.scope_summary,terms:newContract.terms || null,
      commercial_snapshot:{},services:[{
        service_key:newContract.service_key,service_scope:newContract.service_scope,quantity:1,
        monthly_fee:newContract.monthly_fee || null,sla:{},kpi:{},entitlement:{},
        human_workforce_limit:newContract.human_limit ? Number(newContract.human_limit) : null,
        ai_worker_limit:newContract.ai_limit ? Number(newContract.ai_limit) : null,
      }],
    });
    setSelectedId(result.data.id); setTab('contracts');
  }, 'Draft kontrak dibuat.');

  const createPolicy = () => action(() => createContractApprovalPolicy(token,{
    tenant_id:tenant.id,policy_name:policyName,contract_type:policyType,currency:'IDR',
    min_amount:'0',steps:Array.from({length:policySteps},()=>({
      required_permission_key:'corporate.contracts.approve',
      required_role_key:approvalRole || null,minimum_approvals:minimumApprovals,
    })),
  }), 'Approval policy tersimpan.');

  const createDelegation = () => action(() => createContractApprovalDelegation(token,{
    tenant_id:tenant.id,delegatee_user_id:delegationForm.delegatee_user_id,
    starts_at:new Date(delegationForm.starts_at).toISOString(),
    ends_at:new Date(delegationForm.ends_at).toISOString(),reason:delegationForm.reason,
  }), 'Delegasi approval tersimpan.');

  const createAmendment = () => {
    if(!detail) return;
    return action(() => createCorporateAmendment(token,detail.id,{
      tenant_id:tenant.id,change_summary:amendment.change_summary,
      scope_summary:amendment.scope_summary,effective_from:amendment.effective_from,
      services:(detail.services ?? []).map((s) => ({
        service_key:s.service_key,service_scope:s.service_scope,quantity:s.quantity,
        monthly_fee:s.monthly_fee,sla:s.sla ?? {},kpi:s.kpi ?? {},entitlement:s.entitlement ?? {},
      })),
    }), 'Amendment version baru tersimpan sebagai draft.');
  };

  const uploadDoc = (file?:File) => {
    if(!file || !detail) return;
    return action(() => uploadContractDocument(token,tenant.id,detail.id,file,documentType,detail.version_id), 'Dokumen berhasil diunggah ke private storage.');
  };

  const downloadDoc = async (id:string) => {
    try {
      const result = await getContractDocumentDownload(token,tenant.id,id);
      window.open(result.data.signed_url,'_blank','noopener,noreferrer');
    } catch(e) { setError(e instanceof Error ? e.message : 'Gagal membuat secure download URL.'); }
  };

  return <div className="space-y-5">
    <CorporatePageHeader title="Kontrak & Kerja Sama" subtitle="Corporate profile, kontrak, SOW, amendment, approval, dokumen, SLA, entitlement dan lifecycle" onBack={onBack}
      actions={<button className={secondary} onClick={() => void refresh()} disabled={loading}><RefreshCw className="mr-2 h-4 w-4"/>Refresh</button>}/>
    <CorporateSegmentedTabs tabs={[
      {id:'profile',label:'Corporate Profile'},{id:'contracts',label:'Kontrak'},
      {id:'sow',label:'SOW / Amendment'},{id:'sla',label:'SLA & KPI'},
      {id:'approvals',label:'Approval'},{id:'documents',label:'Dokumen'},
      {id:'entitlements',label:'Entitlements'},
    ]} activeTab={tab} onChange={(v) => setTab(v as Tab)}/>
    {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>}
    {notice && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">{notice}</div>}
    {loading && <p className="text-xs text-[#718391]">Memuat data dari FastAPI…</p>}

    {tab === 'profile' && <section className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
      <h2 className="text-sm font-bold text-[#17324D]">Legal & Billing Profile</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {([['legal_name','Nama legal'],['registration_number','Nomor registrasi'],['billing_email','Email billing'],['billing_phone','Telepon billing'],['contact_name','Nama PIC'],['contact_title','Jabatan PIC'],['website','Website'],['country_code','Kode negara'],['organization_id','Organization ID'],['branch_id','Branch ID']] as const).map(([key,name]) =>
          <label key={key}><span className={label}>{name}</span><input className={field} value={profileForm[key]} disabled={!canProfile || saving} onChange={(e)=>setProfileForm((p)=>({...p,[key]:e.target.value}))}/></label>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3"><span className="text-xs text-[#718391]">Status: {profile?.profile_status ?? 'Belum dibuat'}</span>
        {canProfile && <button className={primary} disabled={saving || !profileForm.legal_name} onClick={()=>void saveProfile()}>Simpan Profile</button>}
        {canProfile && profile?.profile_status === 'active' && <button className={secondary} disabled={saving} onClick={()=>void action(()=>updateCorporateProfileStatus(token,tenant.id,{status:'suspended',reason:'Suspended by tenant administrator'}),'Profile ditangguhkan.')}>Suspend Profile</button>}
      </div>
    </section>}

    {tab === 'contracts' && <div className="grid gap-5 lg:grid-cols-12">
      <section className="space-y-3 lg:col-span-5"><div className="flex justify-between"><h2 className="text-sm font-bold text-[#17324D]">Kontrak Tenant</h2><span className="text-xs text-[#718391]">{contracts.length} kontrak</span></div>
        {contracts.map((c)=><button key={c.id} onClick={()=>setSelectedId(c.id)} className={'w-full rounded-xl border p-4 text-left '+(selectedId===c.id?'border-[#0284C7] bg-[#F2FAFD]':'border-[#D8E3E9] bg-white')}>
          <div className="flex justify-between gap-2"><span className="font-mono text-xs font-bold text-[#0284C7]">{c.contract_number}</span><span className="text-[11px] text-[#526675]">{statusName[c.status] ?? c.status}</span></div>
          <p className="mt-1 text-sm font-bold text-[#17324D]">{c.title}</p><p className="mt-1 text-[11px] text-[#718391]">v{c.current_version} · {c.contract_type} · {fmt(c.effective_end)}</p>
        </button>)}
        {!contracts.length && <div className="rounded-xl border border-dashed border-[#D8E3E9] p-6 text-center text-xs text-[#718391]">Belum ada kontrak untuk tenant ini.</div>}
      </section>
      <section className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-7">
        {detail ? <>
          <p className="text-xs font-semibold text-[#0284C7]">{detail.contract_number}</p><h2 className="mt-1 text-lg font-bold text-[#17324D]">{detail.title}</h2>
          <p className="mt-1 text-xs text-[#718391]">{statusName[detail.status] ?? detail.status} · v{detail.current_version} · {fmt(detail.effective_start)} — {fmt(detail.effective_end)}</p>
          <div className="mt-4 rounded-lg bg-[#F5F8FA] p-4"><p className="text-xs font-semibold text-[#526675]">Scope</p><p className="mt-1 whitespace-pre-wrap text-sm text-[#17324D]">{detail.scope_summary ?? 'Scope belum tersedia.'}</p></div>
          <h3 className="mt-4 text-xs font-bold text-[#17324D]">Service & Entitlement</h3>
          {(detail.services ?? []).map((s)=><div key={s.service_key} className="border-b border-[#EAF2F6] py-3"><p className="text-sm font-semibold text-[#17324D]">{s.service_key}</p><p className="text-xs text-[#526675]">{s.service_scope}</p><p className="mt-1 text-[11px] text-[#718391]">Fee {s.monthly_fee ?? '—'} · qty {s.quantity}</p></div>)}
          <div className="mt-4 flex flex-wrap gap-2">
            {canManage && (detail.status==='draft' || (detail.status==='active' && detail.version_status==='draft')) && <button className={primary} disabled={saving} onClick={()=>void action(()=>submitContractPolicyReview(token,tenant.id,detail.id),'Kontrak diajukan berdasarkan approval policy.')}>Submit Approval</button>}
            {canLifecycle && detail.status==='active' && <button className={secondary} disabled={saving} onClick={()=>void action(()=>changeContractLifecycle(token,tenant.id,detail.id,'suspend','Suspension requested from Corporate Portal'),'Kontrak disuspend dan entitlement dihentikan.')}>Suspend</button>}
            {canLifecycle && ['active','suspended','approved'].includes(detail.status) && <button className={secondary} disabled={saving} onClick={()=>{if(window.confirm('Hentikan kontrak ini?')) void action(()=>changeContractLifecycle(token,tenant.id,detail.id,'terminate','Termination requested from Corporate Portal'),'Kontrak dihentikan.')}}>Terminate</button>}
          </div>
          {renewals.length > 0 && <div className="mt-4 border-t border-[#EAF2F6] pt-4">
          <h3 className="text-xs font-bold text-[#17324D]">Renewal History</h3>
          {renewals.map((renewal) => <div key={renewal.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EAF2F6] py-2">
            <div><p className="text-xs font-semibold">{renewal.renewal_type} · {renewal.status}</p><p className="text-[11px] text-[#718391]">Requested end {fmt(renewal.requested_end)}</p></div>
            {canLifecycle && renewal.status === 'requested' && <div className="flex gap-2">
              <button className={secondary} disabled={saving} onClick={()=>void action(()=>decideContractRenewal(token,tenant.id,renewal.id,'approved','Approved by authorized tenant lifecycle manager'),'Renewal disetujui dan effective date kontrak diperbarui.')}>Approve</button>
              <button className={secondary} disabled={saving} onClick={()=>void action(()=>decideContractRenewal(token,tenant.id,renewal.id,'rejected','Rejected by authorized tenant lifecycle manager'),'Renewal ditolak.')}>Reject</button>
            </div>}
          </div>)}
        </div>}
        {canLifecycle && ['active','approved'].includes(detail.status) && <div className="mt-4 grid gap-2 border-t border-[#EAF2F6] pt-4 md:grid-cols-2">
            <label><span className={label}>Tanggal akhir renewal</span><input type="date" className={field} value={renewalEnd} onChange={(e)=>setRenewalEnd(e.target.value)}/></label>
            <button className={secondary+' self-end'} disabled={!renewalEnd || saving} onClick={()=>void action(()=>requestContractRenewal(token,detail.id,{tenant_id:tenant.id,renewal_type:'renewal',requested_end:renewalEnd}),'Renewal request tercatat.')}>Ajukan Renewal</button>
          </div>}
        </> : <p className="py-16 text-center text-xs text-[#718391]">Pilih kontrak untuk melihat detail dan lifecycle.</p>}
      </section>
    </div>}

    {tab === 'sow' && <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-[14px] border border-[#D8E3E9] bg-white p-5"><h2 className="text-sm font-bold text-[#17324D]">Buat Master Agreement / SOW</h2>
        <div className="mt-3 grid gap-3">
          <label><span className={label}>Nomor kontrak</span><input className={field} value={newContract.contract_number} onChange={(e)=>setNewContract(p=>({...p,contract_number:e.target.value}))}/></label>
          <label><span className={label}>Judul</span><input className={field} value={newContract.title} onChange={(e)=>setNewContract(p=>({...p,title:e.target.value}))}/></label>
          <label><span className={label}>Jenis</span><select className={field} value={newContract.contract_type} onChange={(e)=>setNewContract(p=>({...p,contract_type:e.target.value as 'master'|'statement_of_work'}))}><option value="master">Master Agreement</option><option value="statement_of_work">Statement of Work</option></select></label>
          {newContract.contract_type==='statement_of_work' && <label><span className={label}>Kontrak induk</span><select className={field} value={newContract.parent_contract_id} onChange={(e)=>setNewContract(p=>({...p,parent_contract_id:e.target.value}))}><option value="">Pilih kontrak induk</option>{contracts.filter(c=>['active','approved'].includes(c.status)).map(c=><option key={c.id} value={c.id}>{c.contract_number} — {c.title}</option>)}</select></label>}
          <label><span className={label}>Tanggal mulai</span><input type="date" className={field} value={newContract.effective_start} onChange={(e)=>setNewContract(p=>({...p,effective_start:e.target.value}))}/></label>
          <label><span className={label}>Tanggal akhir</span><input type="date" className={field} value={newContract.effective_end} onChange={(e)=>setNewContract(p=>({...p,effective_end:e.target.value}))}/></label>
          <label><span className={label}>Ringkasan scope</span><textarea className="min-h-20 rounded-lg border border-[#D8E3E9] p-3 text-sm" value={newContract.scope_summary} onChange={(e)=>setNewContract(p=>({...p,scope_summary:e.target.value}))}/></label>
          <label><span className={label}>Terms</span><textarea className="min-h-16 rounded-lg border border-[#D8E3E9] p-3 text-sm" value={newContract.terms} onChange={(e)=>setNewContract(p=>({...p,terms:e.target.value}))}/></label>
          <div className="rounded-lg bg-[#F5F8FA] p-3"><p className="mb-2 text-xs font-bold text-[#17324D]">Service scope / SLA entitlement</p>
            <label><span className={label}>Service catalogue</span><select className={field} value={newContract.service_key} onChange={(e)=>{const item=catalogue.find(x=>x.service_key===e.target.value);setNewContract(p=>({...p,service_key:e.target.value,service_scope:item?.scope ?? p.service_scope}));}}><option value="">Pilih service catalogue</option>{catalogue.map(item=><option key={item.service_key} value={item.service_key}>{item.name} · {item.service_key}</option>)}</select></label>
            <label className="mt-2 block"><span className={label}>Deskripsi scope</span><textarea className="min-h-16 w-full rounded-lg border border-[#D8E3E9] p-3 text-sm" value={newContract.service_scope} onChange={(e)=>setNewContract(p=>({...p,service_scope:e.target.value}))}/></label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <label><span className={label}>Fee/bulan</span><input type="number" min="0" className={field} value={newContract.monthly_fee} onChange={(e)=>setNewContract(p=>({...p,monthly_fee:e.target.value}))}/></label>
              <label><span className={label}>Human limit</span><input type="number" min="0" className={field} value={newContract.human_limit} onChange={(e)=>setNewContract(p=>({...p,human_limit:e.target.value}))}/></label>
              <label><span className={label}>AI limit</span><input type="number" min="0" className={field} value={newContract.ai_limit} onChange={(e)=>setNewContract(p=>({...p,ai_limit:e.target.value}))}/></label>
            </div>
          </div>
          {canManage && <button className={primary} disabled={saving || !newContract.contract_number || !newContract.title || !newContract.scope_summary || !newContract.service_key || !newContract.service_scope || (newContract.contract_type==='statement_of_work' && !newContract.parent_contract_id)} onClick={()=>void createContract()}>Simpan Draft ke Backend</button>}
        </div>
      </section>
      <section className="rounded-[14px] border border-[#D8E3E9] bg-white p-5"><h2 className="text-sm font-bold text-[#17324D]">Amendment / Versioning</h2><p className="mt-1 text-xs text-[#718391]">Snapshot immutable dan hash konten disimpan untuk setiap versi.</p>
        <label className="mt-3 block"><span className={label}>Ringkasan perubahan</span><input className={field} value={amendment.change_summary} onChange={(e)=>setAmendment(p=>({...p,change_summary:e.target.value}))}/></label>
        <label className="mt-3 block"><span className={label}>Scope versi baru</span><textarea className="min-h-20 w-full rounded-lg border border-[#D8E3E9] p-3 text-sm" value={amendment.scope_summary} onChange={(e)=>setAmendment(p=>({...p,scope_summary:e.target.value}))}/></label>
        <label className="mt-3 block"><span className={label}>Effective from</span><input type="date" className={field} value={amendment.effective_from} onChange={(e)=>setAmendment(p=>({...p,effective_from:e.target.value}))}/></label>
        {canManage && detail && ['active','approved'].includes(detail.status) && <button className={primary+' mt-3'} disabled={saving || !amendment.change_summary || !amendment.scope_summary || !amendment.effective_from} onClick={()=>void createAmendment()}>Buat Amendment Version</button>}
        {detail && <p className="mt-4 text-xs text-[#526675]">Selected {detail.contract_number} · current v{detail.current_version}</p>}
        <div className="mt-4 divide-y divide-[#EAF2F6]">{versions.map(v=><div key={v.id} className="py-3"><div className="flex justify-between gap-2"><p className="text-xs font-semibold">Version {v.version_number} · {v.version_status}</p><p className="text-[11px] text-[#718391]">{fmt(v.effective_from)}</p></div><p className="mt-1 text-xs text-[#526675]">{v.change_summary ?? v.scope_summary}</p><p className="mt-1 break-all font-mono text-[10px] text-[#718391]">SHA-256 {v.content_hash}</p></div>)}{!versions.length && <p className="py-3 text-xs text-[#718391]">Riwayat versi belum tersedia.</p>}</div>
      </section>
    </div>}

    {tab === 'sla' && <section className="rounded-[14px] border border-[#D8E3E9] bg-white p-5"><h2 className="text-sm font-bold text-[#17324D]">SLA & KPI pada versi kontrak</h2>
      {(detail?.services ?? []).map(s=><div key={s.service_key} className="grid gap-3 border-b border-[#EAF2F6] py-3 md:grid-cols-3"><div><p className="text-xs font-bold">{s.service_key}</p><p className="text-xs text-[#526675]">{s.service_scope}</p></div><div><p className="text-[11px] font-semibold text-[#718391]">SLA</p><pre className="whitespace-pre-wrap text-xs">{JSON.stringify(s.sla ?? {},null,2)}</pre></div><div><p className="text-[11px] font-semibold text-[#718391]">KPI</p><pre className="whitespace-pre-wrap text-xs">{JSON.stringify(s.kpi ?? {},null,2)}</pre></div></div>)}
      {!(detail?.services ?? []).length && <p className="mt-4 text-xs text-[#718391]">Tidak ada data SLA/KPI pada kontrak terpilih.</p>}
    </section>}

    {tab === 'approvals' && <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-[14px] border border-[#D8E3E9] bg-white p-5"><h2 className="text-sm font-bold text-[#17324D]">Approval Policy</h2>
        {policies.map(p=><div key={String(p.id)} className="mt-3 rounded-lg bg-[#F5F8FA] p-3"><p className="text-sm font-semibold">{String(p.policy_name)}</p><p className="text-xs text-[#718391]">{String(p.contract_type)} · {Array.isArray(p.steps)?p.steps.length:0} step(s)</p></div>)}
        {!policies.length && <p className="mt-3 text-xs text-[#718391]">Belum ada policy.</p>}
        {canManage && <div className="mt-4 border-t border-[#EAF2F6] pt-4">
          <label><span className={label}>Nama policy</span><input className={field} value={policyName} onChange={e=>setPolicyName(e.target.value)}/></label>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <label><span className={label}>Jenis kontrak</span><select className={field} value={policyType} onChange={e=>setPolicyType(e.target.value as typeof policyType)}><option value="master">Master</option><option value="statement_of_work">SOW</option><option value="amendment">Amendment</option></select></label>
            <label><span className={label}>Tahapan approval</span><input type="number" min="1" max="8" className={field} value={policySteps} onChange={e=>setPolicySteps(Math.max(1,Math.min(8,Number(e.target.value)||1)))}/></label>
            <label><span className={label}>Minimum approver / tahap</span><input type="number" min="1" max="5" className={field} value={minimumApprovals} onChange={e=>setMinimumApprovals(Math.max(1,Math.min(5,Number(e.target.value)||1)))}/></label>
          </div>
          <label className="mt-3 block"><span className={label}>Role approver (opsional)</span><select className={field} value={approvalRole} onChange={e=>setApprovalRole(e.target.value)}><option value="">Semua role dengan permission approve</option><option value="corporate_finance_manager">Finance Manager</option><option value="corporate_owner">Corporate Owner</option><option value="corporate_admin">Corporate Admin</option></select></label>
          <p className="mt-2 text-[11px] text-[#718391]">Approval step dijalankan berurutan; setiap tahap memerlukan jumlah persetujuan sesuai konfigurasi.</p>
          <button className={primary+' mt-3'} disabled={saving || !policyName} onClick={()=>void createPolicy()}>Simpan Policy</button>
        </div>}
      </section>
      <section className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-2"><h2 className="text-sm font-bold text-[#17324D]">Approval Delegation</h2>
        {canApprove && <div className="mt-3 grid gap-3 md:grid-cols-4">
          <label><span className={label}>Delegatee user UUID</span><input className={field} value={delegationForm.delegatee_user_id} onChange={e=>setDelegationForm(p=>({...p,delegatee_user_id:e.target.value}))}/></label>
          <label><span className={label}>Mulai</span><input type="datetime-local" className={field} value={delegationForm.starts_at} onChange={e=>setDelegationForm(p=>({...p,starts_at:e.target.value}))}/></label>
          <label><span className={label}>Berakhir</span><input type="datetime-local" className={field} value={delegationForm.ends_at} onChange={e=>setDelegationForm(p=>({...p,ends_at:e.target.value}))}/></label>
          <label><span className={label}>Alasan</span><input className={field} value={delegationForm.reason} onChange={e=>setDelegationForm(p=>({...p,reason:e.target.value}))}/></label>
          <button className={primary} disabled={saving || !delegationForm.delegatee_user_id || !delegationForm.starts_at || !delegationForm.ends_at || !delegationForm.reason} onClick={()=>void createDelegation()}>Buat Delegasi</button>
        </div>}
        <div className="mt-4 divide-y divide-[#EAF2F6]">{delegations.map(d=><div key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2"><div><p className="text-xs font-semibold">{d.delegator_user_id} → {d.delegatee_user_id} · {d.status}</p><p className="text-[11px] text-[#718391]">{fmt(d.starts_at)} — {fmt(d.ends_at)} · {d.reason}</p></div>{d.status==='active' && d.delegator_user_id===auth.session?.user?.id && <button className={secondary} disabled={saving} onClick={()=>void action(()=>revokeContractApprovalDelegation(token,tenant.id,d.id),'Delegasi dicabut.')}>Revoke</button>}</div>)}{!delegations.length && <p className="py-3 text-xs text-[#718391]">Tidak ada delegasi approval aktif atau historis.</p>}</div>
      </section>
      <section className="rounded-[14px] border border-[#D8E3E9] bg-white p-5"><h2 className="text-sm font-bold text-[#17324D]">Approval History</h2>
        {(detail?.approvals ?? []).map((a,i)=><div key={String(a.id ?? i)} className="border-b border-[#EAF2F6] py-3"><p className="text-xs font-semibold">Step {String(a.approval_step)} · {String(a.status)}</p><p className="text-[11px] text-[#718391]">Approver {String(a.approver_user_id)}</p>
          {canApprove && a.status==='pending' && <div className="mt-2 flex gap-2"><button className={secondary} disabled={saving} onClick={()=>void action(()=>decideContractApproval(token,detail!.id,{tenant_id:tenant.id,approval_id:String(a.id),decision:'approved',reason:'Approved from Corporate Portal'}),'Approval tersimpan.')}>Approve</button><button className={secondary} disabled={saving} onClick={()=>void action(()=>decideContractApproval(token,detail!.id,{tenant_id:tenant.id,approval_id:String(a.id),decision:'rejected',reason:'Rejected from Corporate Portal'}),'Rejection tersimpan.')}>Reject</button></div>}
        </div>)}
        {!(detail?.approvals ?? []).length && <p className="mt-3 text-xs text-[#718391]">Belum ada approval untuk versi ini.</p>}
      </section>
    </div>}

    {tab === 'documents' && <section className="rounded-[14px] border border-[#D8E3E9] bg-white p-5"><h2 className="text-sm font-bold text-[#17324D]">Dokumen Kontrak</h2><p className="mt-1 text-xs text-[#718391]">Upload melewati FastAPI; file disimpan pada private bucket Supabase Storage dan hash metadata direkam.</p>
      {detail && canManage && <div className="mt-4 flex flex-wrap items-end gap-3"><label><span className={label}>Jenis dokumen</span><select className={field} value={documentType} onChange={e=>setDocumentType(e.target.value as typeof documentType)}><option value="master_agreement">Master Agreement</option><option value="statement_of_work">SOW</option><option value="sla">SLA</option><option value="amendment">Amendment</option><option value="supporting">Supporting</option></select></label><label><span className={label}>File PDF/JPG/PNG/DOCX, max 25 MB</span><input type="file" accept=".pdf,.jpg,.jpeg,.png,.docx" disabled={saving} onChange={e=>{const file=e.target.files?.[0];if(file)void uploadDoc(file);e.currentTarget.value='';}}/></label></div>}
      {documents.map(d=><div key={d.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAF2F6] py-3"><div className="flex items-center gap-3"><FileText className="h-4 w-4 text-[#0284C7]"/><div><p className="text-xs font-semibold">{d.original_filename}</p><p className="text-[11px] text-[#718391]">{d.document_type} · {Math.ceil(d.file_size/1024)} KB · {d.lifecycle_status}</p></div></div>{d.lifecycle_status==='available' && <div className="flex gap-2"><button className={secondary} onClick={()=>void (async()=>{try{const url=await getContractDocumentDownload(token,tenant.id,d.id);window.open(url.data.signed_url,'_blank','noopener,noreferrer');}catch(e){setError(e instanceof Error?e.message:'Gagal membuat tautan.');}})()}>Secure Download</button>{canManage && <button className={secondary} disabled={saving} onClick={()=>void action(()=>archiveContractDocument(token,tenant.id,d.id),'Dokumen diarsipkan.')}>Archive</button>}</div>}</div>)}
      {!documents.length && <p className="mt-4 text-xs text-[#718391]">Belum ada dokumen.</p>}
    </section>}

    {tab === 'entitlements' && <div className="space-y-5">
      <section className="rounded-[14px] border border-[#D8E3E9] bg-white p-5"><h2 className="text-sm font-bold text-[#17324D]">Effective Entitlements</h2><p className="mt-1 text-xs text-[#718391]">Hanya grant dari kontrak aktif dan tanggal efektif yang berlaku.</p><div className="mt-4 overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-[#D8E3E9] text-[#718391]"><th className="py-3">Service</th><th>Human</th><th>AI Worker</th><th>AI Credits</th><th>Periode</th></tr></thead><tbody>{entitlements.map(e=><tr key={e.id} className="border-b border-[#EAF2F6]"><td className="py-3 font-semibold">{e.service_key}</td><td>{e.human_workforce_limit ?? 'Unlimited'}</td><td>{e.ai_worker_limit ?? 'Unlimited'}</td><td>{e.ai_credits_limit ?? 'Unlimited'}</td><td>{fmt(e.effective_start)} — {fmt(e.effective_end)}</td></tr>)}</tbody></table></div>{!entitlements.length && <p className="mt-4 text-xs text-[#718391]">Belum ada entitlement aktif.</p>}</section>
      <AIWorkerEntitlementPanel tenantId={tenant.id} entitlements={entitlements}/>
    </div>}
  </div>;
}
