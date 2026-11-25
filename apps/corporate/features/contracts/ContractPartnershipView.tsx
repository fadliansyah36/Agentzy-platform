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
  activateCorporateContract, getPublicCatalogue, getContractOperationalMetrics, patchCorporateContract,
  listCorporateProviderProfiles, createCorporateProviderProfile,
  updateCorporateProviderProfile, updateCorporateProviderProfileStatus,
  submitContractPolicyReview, updateContractSignatureStatus, updateCorporateProfileStatus,
  upsertCorporateProfile, uploadContractDocument,
  changeContractLifecycle,
  type CorporateContract, type CorporateProfile, type ContractDocument,
  type ContractEntitlement, type ContractVersionRecord, type ContractRenewalRecord, type PublicCatalogueItem,
  type ContractApprovalDelegation, type CorporateProviderProfile, type ContractOperationalMetrics,
  type AgentzyOrganization, type AgentzyBranch,
} from '@/apps/web/lib/api-client';
import { CorporatePageHeader, CorporateSegmentedTabs } from '../../components/data-display/CorporateDataDisplay';
import type { CorporateTenant } from '../../lib/corporate-types';
import { AIWorkerEntitlementPanel } from './AIWorkerEntitlementPanel';
import { NetworkStatusBanner } from '../../components/NetworkStatusBanner';

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

export function ContractPartnershipView({ tenant, onBack, organizations, branches }: {
  tenant: CorporateTenant; onBack: () => void;
  organizations: AgentzyOrganization[]; branches: AgentzyBranch[];
}) {
  const auth = useAgentzyAuth();
  const token = auth.session?.access_token ?? '';
  const [tab,setTab] = useState<Tab>('contracts');
  const [profile,setProfile] = useState<CorporateProfile | null>(null);
  const [profileForm,setProfileForm] = useState({legal_name:'',registration_number:'',billing_email:'',billing_phone:'',contact_name:'',contact_title:'',website:'',country_code:'ID',organization_id:'',branch_id:'',tax_rate:'0'});
  const [contracts,setContracts] = useState<CorporateContract[]>([]);
  const [selectedId,setSelectedId] = useState('');
  const [draftEdit,setDraftEdit] = useState({title:'',effective_start:'',effective_end:'',organization_id:'',branch_id:''});
  const [detail,setDetail] = useState<CorporateContract | null>(null);
  const [documents,setDocuments] = useState<ContractDocument[]>([]);
  const [versions,setVersions] = useState<ContractVersionRecord[]>([]);
  const [renewals,setRenewals] = useState<ContractRenewalRecord[]>([]);
  const [delegations,setDelegations] = useState<ContractApprovalDelegation[]>([]);
  const [delegationForm,setDelegationForm] = useState({delegatee_user_id:'',starts_at:'',ends_at:'',reason:''});
  const [entitlements,setEntitlements] = useState<ContractEntitlement[]>([]);
  const [policies,setPolicies] = useState<Array<Record<string,unknown>>>([]);
  const [catalogue,setCatalogue] = useState<PublicCatalogueItem[]>([]);
  const [metrics,setMetrics] = useState<ContractOperationalMetrics | null>(null);
  const [providerProfiles,setProviderProfiles] = useState<CorporateProviderProfile[]>([]);
  const [providerForm,setProviderForm] = useState({provider_code:'',provider_name:'',provider_type:'isp' as CorporateProviderProfile['provider_type'],registration_number:'',contact_email:'',contact_phone:'',service_regions:''});
  const [editingProviderId,setEditingProviderId] = useState('');
  const [loading,setLoading] = useState(false);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const [newContract,setNewContract] = useState({contract_number:'',title:'',contract_type:'master' as 'master'|'statement_of_work',parent_contract_id:'',provider_profile_id:'',scope_summary:'',terms:'',service_key:'',service_scope:'',monthly_fee:'',human_limit:'',ai_limit:'',sla_json:'{}',kpi_json:'{}',entitlement_json:'{}',effective_start:'',effective_end:''});
  const [amendment,setAmendment] = useState({change_summary:'',scope_summary:'',effective_from:'',service_scope:'',monthly_fee:'',human_limit:'',ai_limit:'',sla_json:'',kpi_json:'',entitlement_json:''});
  const [policyName,setPolicyName] = useState('');
  const [policyType,setPolicyType] = useState<'master'|'statement_of_work'|'amendment'>('master');
  const [policySteps,setPolicySteps] = useState(1);
  const [minimumApprovals,setMinimumApprovals] = useState(1);
  const [approvalRole,setApprovalRole] = useState('');
  const [renewalEnd,setRenewalEnd] = useState('');
  const [signatureForm,setSignatureForm] = useState({provider:'manual',signature_reference:'',reason:''});
  const [documentType,setDocumentType] = useState<'master_agreement'|'statement_of_work'|'sla'|'amendment'|'supporting'>('master_agreement');

  const can = (permission:string) => auth.identity?.memberships.some((m) => m.tenant_id === tenant.id && m.permissions.includes(permission)) ?? false;
  const canManage = can('corporate.contracts.manage');
  const canProfile = can('corporate.profiles.manage');
  const canApprove = can('corporate.contracts.approve');
  const canLifecycle = can('corporate.contracts.lifecycle');
  const canReadProviders = can('corporate.providers.read');
  const canManageProviders = can('corporate.providers.manage');

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError('');
    const results = await Promise.allSettled([
      getCorporateProfile(token,tenant.id),
      listCorporateContracts(token,tenant.id),
      getEffectiveContractEntitlements(token,tenant.id),
      listContractApprovalPolicies(token,tenant.id),
      getContractOperationalMetrics(token,tenant.id),
    ]);
    if (results[0].status === 'fulfilled') {
      const p = results[0].value.data; setProfile(p);
      if (p) setProfileForm({legal_name:p.legal_name ?? '',registration_number:p.registration_number ?? '',billing_email:p.billing_email ?? '',billing_phone:p.billing_phone ?? '',contact_name:p.contact_name ?? '',contact_title:p.contact_title ?? '',website:p.website ?? '',country_code:p.country_code ?? 'ID',organization_id:p.organization_id ?? '',branch_id:p.branch_id ?? '',tax_rate:String(p.tax_profile?.tax_rate ?? '0')});
    } else setError(results[0].reason instanceof Error ? results[0].reason.message : 'Gagal memuat profile.');
    if (results[1].status === 'fulfilled') {
      const contractRows = results[1].value.data;
      setContracts(contractRows);
      setSelectedId((id) => id || contractRows[0]?.id || '');
    } else setError(results[1].reason instanceof Error ? results[1].reason.message : 'Gagal memuat kontrak.');
    if (results[2].status === 'fulfilled') setEntitlements(results[2].value.data);
    if (results[3].status === 'fulfilled') setPolicies(results[3].value.data);
    if (results[4].status === 'fulfilled') setMetrics(results[4].value.data);
    try {
      const catalogueResult = await getPublicCatalogue();
      setCatalogue([...catalogueResult.data.human_workforce, ...catalogueResult.data.ai_workforce]);
    } catch {
      setCatalogue([]);
    }
    if (canReadProviders) {
      try {
        const providerResult = await listCorporateProviderProfiles(token,tenant.id);
        setProviderProfiles(providerResult.data);
      } catch {
        setProviderProfiles([]);
      }
    }
    setLoading(false);
  },[token,tenant.id,canReadProviders]);

  const loadDetail = useCallback(async (id:string) => {
    if (!id || !token) { setDetail(null); setDocuments([]); return; }
    try {
      const [d,docs,versionRows,renewalRows] = await Promise.all([
        getCorporateContract(token,tenant.id,id),
        listContractDocuments(token,tenant.id,id),
        listContractVersions(token,tenant.id,id),
        listContractRenewals(token,tenant.id,id),
      ]);
      setDetail(d.data);
      setDraftEdit({
        title:d.data.title,
        effective_start:d.data.effective_start ?? '',
        effective_end:d.data.effective_end ?? '',
        organization_id:d.data.organization_id ?? '',
        branch_id:d.data.branch_id ?? '',
      });
      setDocuments(docs.data);
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

  const saveProviderProfile = () => action(async () => {
    const payload = {
      tenant_id:tenant.id,provider_code:providerForm.provider_code,
      provider_name:providerForm.provider_name,provider_type:providerForm.provider_type,
      registration_number:providerForm.registration_number || null,
      contact_email:providerForm.contact_email || null,
      contact_phone:providerForm.contact_phone || null,
      service_regions:providerForm.service_regions.split(',').map(x=>x.trim()).filter(Boolean),
      service_metadata:{},
    };
    if(editingProviderId) {
      await updateCorporateProviderProfile(token,editingProviderId,payload);
    } else {
      await createCorporateProviderProfile(token,payload);
    }
    setEditingProviderId('');
    setProviderForm({provider_code:'',provider_name:'',provider_type:'isp',registration_number:'',contact_email:'',contact_phone:'',service_regions:''});
  },'Provider profile tersimpan.');

  const saveProfile = () => action(() => upsertCorporateProfile(token,{
    tenant_id:tenant.id, organization_id:profileForm.organization_id || null,
    branch_id:profileForm.branch_id || null, legal_name:profileForm.legal_name,
    registration_number:profileForm.registration_number || null,
    billing_email:profileForm.billing_email || null,billing_phone:profileForm.billing_phone || null,
    billing_address:profile?.billing_address ?? {},
    tax_profile:{tax_rate:Number(profileForm.tax_rate || '0')},
    contact_name:profileForm.contact_name || null,contact_title:profileForm.contact_title || null,
    website:profileForm.website || null,country_code:profileForm.country_code,
  }), 'Corporate profile tersimpan.');

  const createContract = () => action(async () => {
    const result = await createCorporateContract(token,{
      tenant_id:tenant.id,organization_id:profile?.organization_id ?? null,
      branch_id:profile?.branch_id ?? null,
      parent_contract_id:newContract.parent_contract_id || null,
      provider_profile_id:newContract.provider_profile_id || null,
      contract_number:newContract.contract_number,title:newContract.title,
      contract_type:newContract.contract_type,currency:'IDR',
      effective_start:newContract.effective_start || null,effective_end:newContract.effective_end || null,
      scope_summary:newContract.scope_summary,terms:newContract.terms || null,
      commercial_snapshot:{},services:[{
        service_key:newContract.service_key,service_scope:newContract.service_scope,quantity:1,
        monthly_fee:newContract.monthly_fee || null,sla:{},kpi:{},entitlement:{},
        human_workforce_limit:newContract.human_limit ? Number(newContract.human_limit) : null,
        ai_worker_limit:newContract.ai_limit ? Number(newContract.ai_limit) : null,
        sla:JSON.parse(newContract.sla_json || '{}'),
        kpi:JSON.parse(newContract.kpi_json || '{}'),
        entitlement:JSON.parse(newContract.entitlement_json || '{}'),
      }],
    });
    setSelectedId(result.data.id); setTab('contracts');
  }, 'Draft kontrak dibuat.');

  const updateDraftContract = () => {
    if(!detail || detail.status!=='draft') return;
    if(typeof detail.row_version!=='number') {
      setError('Versi kontrak tidak tersedia. Refresh detail sebelum mengubah draft.');
      return;
    }
    const expectedRowVersion = detail.row_version;
    return action(async () => {
      await patchCorporateContract(token,detail.id,{
        tenant_id:tenant.id,
        expected_row_version:expectedRowVersion,
        title:draftEdit.title.trim(),
        effective_start:draftEdit.effective_start || null,
        effective_end:draftEdit.effective_end || null,
        organization_id:draftEdit.organization_id || null,
        branch_id:draftEdit.branch_id || null,
      });
      await loadDetail(detail.id);
    },'Draft kontrak diperbarui melalui FastAPI.');
  };

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
      services:(detail.services ?? []).map((s,index) => ({
        service_key:s.service_key,
        service_scope:index===0 && amendment.service_scope ? amendment.service_scope : s.service_scope,
        quantity:s.quantity,
        monthly_fee:index===0 && amendment.monthly_fee ? amendment.monthly_fee : s.monthly_fee,
        sla:s.sla ?? {},kpi:s.kpi ?? {},entitlement:s.entitlement ?? {},
        human_workforce_limit:index===0 && amendment.human_limit ? Number(amendment.human_limit) : s.human_workforce_limit,
        ai_worker_limit:index===0 && amendment.ai_limit ? Number(amendment.ai_limit) : s.ai_worker_limit,
      })),
    }), 'Amendment version baru tersimpan sebagai draft.');
  };

  const updateSignature = (status:'pending'|'signed'|'rejected'|'cancelled'|'expired') => {
    if(!detail)return;
    return action(()=>updateContractSignatureStatus(token,tenant.id,detail.id,{
      status,provider:signatureForm.provider,
      signature_reference:signatureForm.signature_reference || undefined,
      reason:signatureForm.reason || undefined,
    }),'Signature status kontrak diperbarui dan diaudit.');
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
    <NetworkStatusBanner stale={Boolean(error && !loading)} />
    <CorporateSegmentedTabs tabs={[
      {id:'profile',label:'Corporate Profile'},{id:'contracts',label:'Kontrak'},
      {id:'sow',label:'SOW / Amendment'},{id:'sla',label:'SLA & KPI'},
      {id:'approvals',label:'Approval'},{id:'documents',label:'Dokumen'},
      {id:'entitlements',label:'Entitlements'},
    ]} activeTab={tab} onChange={(v) => setTab(v as Tab)}/>
    {metrics && <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {[['Active Contracts',metrics.active_contracts],['Pending Approval',metrics.pending_approvals],['Expiring 30 Days',metrics.expiring_30_days],['Pending Renewals',metrics.pending_renewals],['Outstanding Invoice',metrics.outstanding_invoices]].map(([name,value])=><div key={String(name)} className="rounded-[12px] border border-[#D8E3E9] bg-white p-4"><p className="text-[11px] font-medium text-[#718391]">{name}</p><p className="mt-1 text-xl font-bold text-[#17324D]">{value}</p></div>)}
    </div>}
    {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>}
    {notice && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">{notice}</div>}
    {loading && <p className="text-xs text-[#718391]">Memuat data dari FastAPI…</p>}

    {tab === 'profile' && <section className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
      <h2 className="text-sm font-bold text-[#17324D]">Legal & Billing Profile</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {([['legal_name','Nama legal'],['registration_number','Nomor registrasi'],['billing_email','Email billing'],['billing_phone','Telepon billing'],['contact_name','Nama PIC'],['contact_title','Jabatan PIC'],['website','Website'],['country_code','Kode negara']] as const).map(([key,name]) =>
          <label key={key}><span className={label}>{name}</span><input className={field} value={profileForm[key]} disabled={!canProfile || saving} onChange={(e)=>setProfileForm((p)=>({...p,[key]:e.target.value}))}/></label>
        )}
        <label><span className={label}>Organization</span><select className={field} disabled={!canProfile || saving} value={profileForm.organization_id} onChange={e=>setProfileForm(p=>({...p,organization_id:e.target.value,branch_id:''}))}><option value="">Pilih organization</option>{organizations.filter(o=>o.status==='active').map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
        <label><span className={label}>Branch</span><select className={field} disabled={!canProfile || saving || !profileForm.organization_id} value={profileForm.branch_id} onChange={e=>setProfileForm(p=>({...p,branch_id:e.target.value}))}><option value="">Pilih branch</option>{branches.filter(b=>b.organization_id===profileForm.organization_id && b.status==='active').map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
        <label><span className={label}>Tax rate (%)</span><input type="number" min="0" max="100" step="0.01" className={field} disabled={!canProfile || saving} value={profileForm.tax_rate} onChange={e=>setProfileForm(p=>({...p,tax_rate:e.target.value}))}/></label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3"><span className="text-xs text-[#718391]">Status: {profile?.profile_status ?? 'Belum dibuat'}</span>
        {canProfile && <button className={primary} disabled={saving || !profileForm.legal_name} onClick={()=>void saveProfile()}>Simpan Profile</button>}
        {canProfile && profile?.profile_status === 'active' && <button className={secondary} disabled={saving} onClick={()=>void action(()=>updateCorporateProfileStatus(token,tenant.id,{status:'suspended',reason:'Suspended by tenant administrator'}),'Profile ditangguhkan.')}>Suspend Profile</button>}
        {canProfile && profile?.profile_status === 'suspended' && <button className={secondary} disabled={saving} onClick={()=>void action(()=>updateCorporateProfileStatus(token,tenant.id,{status:'active',reason:'Reactivated by tenant administrator'}),'Profile diaktifkan kembali.')}>Reactivate Profile</button>}
        {canProfile && profile && profile.profile_status !== 'archived' && <button className={secondary} disabled={saving} onClick={()=>{if(window.confirm('Arsipkan corporate profile ini?'))void action(()=>updateCorporateProfileStatus(token,tenant.id,{status:'archived',reason:'Archived by tenant administrator'}),'Profile diarsipkan.');}}>Archive Profile</button>}
      </div>
      {canReadProviders && <div className="mt-6 border-t border-[#EAF2F6] pt-5">
        <h3 className="text-sm font-bold text-[#17324D]">Provider Profiles</h3>
        <div className="mt-3 divide-y divide-[#EAF2F6]">{providerProfiles.map(provider=><div key={provider.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div><p className="text-xs font-semibold">{provider.provider_name} · {provider.provider_code}</p><p className="text-[11px] text-[#718391]">{provider.provider_type} · {provider.status} · {provider.contact_email ?? 'No contact email'}</p></div>
          {canManageProviders && <div className="flex gap-2"><button className={secondary} onClick={()=>{setEditingProviderId(provider.id);setProviderForm({provider_code:provider.provider_code,provider_name:provider.provider_name,provider_type:provider.provider_type,registration_number:provider.registration_number ?? '',contact_email:provider.contact_email ?? '',contact_phone:provider.contact_phone ?? '',service_regions:provider.service_regions.join(', ')});}}>Edit</button>{provider.status==='draft' && <button className={secondary} disabled={saving} onClick={()=>void action(()=>updateCorporateProviderProfileStatus(token,tenant.id,provider.id,'active','Activated by corporate administrator'),'Provider profile diaktifkan.')}>Activate</button>}{provider.status==='active' && <button className={secondary} disabled={saving} onClick={()=>void action(()=>updateCorporateProviderProfileStatus(token,tenant.id,provider.id,'suspended','Suspended by corporate administrator'),'Provider profile ditangguhkan.')}>Suspend</button>}{provider.status!=='archived' && <button className={secondary} disabled={saving} onClick={()=>{if(window.confirm('Archive provider profile ini?'))void action(()=>updateCorporateProviderProfileStatus(token,tenant.id,provider.id,'archived','Archived by corporate administrator'),'Provider profile diarsipkan.');}}>Archive</button>}</div>}
        </div>)}{!providerProfiles.length && <p className="py-3 text-xs text-[#718391]">Belum ada provider profile.</p>}</div>
        {canManageProviders && <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label><span className={label}>Provider code</span><input className={field} value={providerForm.provider_code} onChange={e=>setProviderForm(p=>({...p,provider_code:e.target.value}))}/></label>
          <label><span className={label}>Provider name</span><input className={field} value={providerForm.provider_name} onChange={e=>setProviderForm(p=>({...p,provider_name:e.target.value}))}/></label>
          <label><span className={label}>Provider type</span><select className={field} value={providerForm.provider_type} onChange={e=>setProviderForm(p=>({...p,provider_type:e.target.value as CorporateProviderProfile['provider_type']}))}><option value="isp">ISP</option><option value="telecom">Telecom</option><option value="managed_service">Managed Service</option><option value="technology">Technology</option><option value="other">Other</option></select></label>
          <label><span className={label}>Registration number</span><input className={field} value={providerForm.registration_number} onChange={e=>setProviderForm(p=>({...p,registration_number:e.target.value}))}/></label>
          <label><span className={label}>Contact email</span><input type="email" className={field} value={providerForm.contact_email} onChange={e=>setProviderForm(p=>({...p,contact_email:e.target.value}))}/></label>
          <label><span className={label}>Contact phone</span><input className={field} value={providerForm.contact_phone} onChange={e=>setProviderForm(p=>({...p,contact_phone:e.target.value}))}/></label>
          <label className="md:col-span-2"><span className={label}>Service regions (comma separated)</span><input className={field} value={providerForm.service_regions} onChange={e=>setProviderForm(p=>({...p,service_regions:e.target.value}))}/></label>
          <button className={primary} disabled={saving || !providerForm.provider_code || !providerForm.provider_name} onClick={()=>void saveProviderProfile()}>{editingProviderId ? 'Update Provider Profile' : 'Create Provider Profile'}</button>
        </div>}
      </div>}
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
          {canManage && detail.status==='draft' && <div className="mt-4 rounded-lg border border-[#D8E3E9] p-4">
            <h3 className="text-xs font-bold text-[#17324D]">Edit Draft Contract</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="md:col-span-2"><span className={label}>Judul kontrak</span><input className={field} value={draftEdit.title} onChange={e=>setDraftEdit(p=>({...p,title:e.target.value}))}/></label>
              <label><span className={label}>Tanggal mulai</span><input type="date" className={field} value={draftEdit.effective_start} onChange={e=>setDraftEdit(p=>({...p,effective_start:e.target.value}))}/></label>
              <label><span className={label}>Tanggal akhir</span><input type="date" className={field} value={draftEdit.effective_end} onChange={e=>setDraftEdit(p=>({...p,effective_end:e.target.value}))}/></label>
              <label><span className={label}>Organization</span><select className={field} value={draftEdit.organization_id} onChange={e=>setDraftEdit(p=>({...p,organization_id:e.target.value,branch_id:''}))}><option value="">Tanpa organization</option>{organizations.filter(o=>o.status==='active').map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
              <label><span className={label}>Branch</span><select className={field} value={draftEdit.branch_id} disabled={!draftEdit.organization_id} onChange={e=>setDraftEdit(p=>({...p,branch_id:e.target.value}))}><option value="">Tanpa branch</option>{branches.filter(b=>b.organization_id===draftEdit.organization_id && b.status==='active').map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
              <button className={primary} disabled={saving || !draftEdit.title.trim() || Boolean(draftEdit.effective_start && draftEdit.effective_end && draftEdit.effective_end<draftEdit.effective_start)} onClick={()=>void updateDraftContract()}>Simpan Perubahan Draft</button>
            </div>
          </div>}
          <div className="mt-4 rounded-lg border border-[#D8E3E9] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-bold text-[#17324D]">Signature status</p><span className="text-xs font-semibold text-[#526675]">{detail.signature_status ?? 'not_started'}</span></div>
            {canManage && detail.signature_status !== 'signed' && <div className="mt-3 grid gap-2 md:grid-cols-3">
              <label><span className={label}>Provider</span><input className={field} value={signatureForm.provider} onChange={e=>setSignatureForm(p=>({...p,provider:e.target.value}))}/></label>
              <label><span className={label}>External signature reference</span><input className={field} value={signatureForm.signature_reference} onChange={e=>setSignatureForm(p=>({...p,signature_reference:e.target.value}))}/></label>
              <label><span className={label}>Reason (jika ditolak/dibatalkan)</span><input className={field} value={signatureForm.reason} onChange={e=>setSignatureForm(p=>({...p,reason:e.target.value}))}/></label>
              <div className="flex flex-wrap gap-2 md:col-span-3">
                {detail.signature_status !== 'pending' && <button className={secondary} disabled={saving} onClick={()=>void updateSignature('pending')}>Request Signature</button>}
                {detail.signature_status === 'pending' && <button className={secondary} disabled={saving || !signatureForm.signature_reference} onClick={()=>void updateSignature('signed')}>Mark Signed with Reference</button>}
                {detail.signature_status === 'pending' && <button className={secondary} disabled={saving || !signatureForm.reason} onClick={()=>void updateSignature('rejected')}>Reject Signature</button>}
              </div>
            </div>}
          </div>
          <h3 className="mt-4 text-xs font-bold text-[#17324D]">Service & Entitlement</h3>
          {(detail.services ?? []).map((s)=><div key={s.service_key} className="border-b border-[#EAF2F6] py-3"><p className="text-sm font-semibold text-[#17324D]">{s.service_key}</p><p className="text-xs text-[#526675]">{s.service_scope}</p><p className="mt-1 text-[11px] text-[#718391]">Fee {s.monthly_fee ?? '—'} · qty {s.quantity}</p></div>)}
          <div className="mt-4 flex flex-wrap gap-2">
            {canManage && (detail.status==='draft' || (detail.status==='active' && detail.version_status==='draft')) && <button className={primary} disabled={saving} onClick={()=>void action(()=>submitContractPolicyReview(token,tenant.id,detail.id),'Kontrak diajukan berdasarkan approval policy.')}>Submit Approval</button>}
            {canManage && detail.status==='approved' && <button className={primary} disabled={saving} onClick={()=>void action(()=>activateCorporateContract(token,tenant.id,detail.id),'Kontrak diaktifkan; entitlement service mulai berlaku.')}>Activate Contract</button>}
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
<label><span className={label}>Provider profile</span><select className={field} value={newContract.provider_profile_id} onChange={e=>setNewContract(p=>({...p,provider_profile_id:e.target.value}))}><option value="">Pilih provider profile</option>{providerProfiles.filter(p=>p.status==='active').map(p=><option key={p.id} value={p.id}>{p.provider_name} · {p.provider_code}</option>)}</select></label>
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
              <label><span className={label}>SLA (JSON object)</span><textarea className="min-h-20 rounded-lg border border-[#D8E3E9] p-3 text-xs" value={newContract.sla_json} onChange={e=>setNewContract(p=>({...p,sla_json:e.target.value}))}/></label>
              <label><span className={label}>KPI (JSON object)</span><textarea className="min-h-20 rounded-lg border border-[#D8E3E9] p-3 text-xs" value={newContract.kpi_json} onChange={e=>setNewContract(p=>({...p,kpi_json:e.target.value}))}/></label>
              <label className="md:col-span-2"><span className={label}>Entitlement scope (JSON object)</span><textarea className="min-h-20 w-full rounded-lg border border-[#D8E3E9] p-3 text-xs" value={newContract.entitlement_json} onChange={e=>setNewContract(p=>({...p,entitlement_json:e.target.value}))}/></label>
            </div>
          </div>
          {canManage && <button className={primary} disabled={saving || !newContract.contract_number || !newContract.title || !newContract.scope_summary || !newContract.service_key || !newContract.service_scope || (newContract.contract_type==='statement_of_work' && !newContract.parent_contract_id)} onClick={()=>void createContract()}>Simpan Draft ke Backend</button>}
        </div>
      </section>
      <section className="rounded-[14px] border border-[#D8E3E9] bg-white p-5"><h2 className="text-sm font-bold text-[#17324D]">Amendment / Versioning</h2><p className="mt-1 text-xs text-[#718391]">Snapshot immutable dan hash konten disimpan untuk setiap versi.</p>
        <label className="mt-3 block"><span className={label}>Ringkasan perubahan</span><input className={field} value={amendment.change_summary} onChange={(e)=>setAmendment(p=>({...p,change_summary:e.target.value}))}/></label>
        <label className="mt-3 block"><span className={label}>Scope versi baru</span><textarea className="min-h-20 w-full rounded-lg border border-[#D8E3E9] p-3 text-sm" value={amendment.scope_summary} onChange={(e)=>setAmendment(p=>({...p,scope_summary:e.target.value}))}/></label>
        <label className="mt-3 block"><span className={label}>Effective from</span><input type="date" className={field} value={amendment.effective_from} onChange={(e)=>setAmendment(p=>({...p,effective_from:e.target.value}))}/></label>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label><span className={label}>Service scope baru (opsional)</span><input className={field} value={amendment.service_scope} onChange={e=>setAmendment(p=>({...p,service_scope:e.target.value}))}/></label>
          <label><span className={label}>Fee bulanan baru</span><input type="number" min="0" className={field} value={amendment.monthly_fee} onChange={e=>setAmendment(p=>({...p,monthly_fee:e.target.value}))}/></label>
          <label><span className={label}>Human workforce limit</span><input type="number" min="0" className={field} value={amendment.human_limit} onChange={e=>setAmendment(p=>({...p,human_limit:e.target.value}))}/></label>
          <label><span className={label}>AI Worker limit</span><input type="number" min="0" className={field} value={amendment.ai_limit} onChange={e=>setAmendment(p=>({...p,ai_limit:e.target.value}))}/></label>
          <label><span className={label}>SLA amendment (JSON object)</span><textarea className="min-h-16 rounded-lg border border-[#D8E3E9] p-3 text-xs" value={amendment.sla_json} onChange={e=>setAmendment(p=>({...p,sla_json:e.target.value}))}/></label>
          <label><span className={label}>KPI amendment (JSON object)</span><textarea className="min-h-16 rounded-lg border border-[#D8E3E9] p-3 text-xs" value={amendment.kpi_json} onChange={e=>setAmendment(p=>({...p,kpi_json:e.target.value}))}/></label>
          <label className="md:col-span-2"><span className={label}>Entitlement amendment (JSON object)</span><textarea className="min-h-16 w-full rounded-lg border border-[#D8E3E9] p-3 text-xs" value={amendment.entitlement_json} onChange={e=>setAmendment(p=>({...p,entitlement_json:e.target.value}))}/></label>
        </div>
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
