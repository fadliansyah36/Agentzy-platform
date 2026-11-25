'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, ShieldCheck, Users, ClipboardCheck } from 'lucide-react';
import { AdminPageHeader, AdminSegmentedTabs, AdminStatusText } from '../../components/data-display/AdminDataDisplay';
import {
  listWorkforceProfiles,
  listWorkforceIdentityVerifications,
  decideWorkforceIdentity,
  type WorkforceProfile,
} from '@/apps/web/lib/api-client';

type TenantOption = { id: string; name: string };
type VerificationRow = {
  id:string; workforce_profile_id:string; status:string; verification_type:string;
  submitted_at:string; worker_code:string; display_name:string; job_title:string|null;
};

export function HumanWorkforceAdminView({
  accessToken,
  tenants,
  onBack,
}: {
  accessToken: string | null;
  tenants: TenantOption[];
  onBack: () => void;
}) {
  const [tab,setTab]=useState<'staff'|'verifikasi'|'assignment'>('staff');
  const [tenantId,setTenantId]=useState(tenants[0]?.id ?? '');
  const [profiles,setProfiles]=useState<WorkforceProfile[]>([]);
  const [verifications,setVerifications]=useState<VerificationRow[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const [busyId,setBusyId]=useState<string|null>(null);
  const [reason,setReason]=useState('Dokumen telah diperiksa sesuai persyaratan verifikasi.');

  const load=async()=>{
    if(!accessToken||!tenantId){setLoading(false);setError('Pilih tenant yang dapat dikelola.');return;}
    setLoading(true);setError(null);
    try{
      const [profileResult,verificationResult]=await Promise.all([
        listWorkforceProfiles(accessToken,tenantId),
        listWorkforceIdentityVerifications(accessToken,tenantId,'pending'),
      ]);
      setProfiles(profileResult.data);
      setVerifications(verificationResult.data as VerificationRow[]);
    }catch(cause){setError(cause instanceof Error?cause.message:'Data Human Workforce gagal dimuat dari FastAPI.');}
    finally{setLoading(false);}
  };
  useEffect(()=>{void load();},[accessToken,tenantId]);

  const decide=async(row:VerificationRow,decision:'verified'|'rejected')=>{
    if(!accessToken||!tenantId)return;
    const decisionReason=reason.trim();
    if(decisionReason.length<3){setError('Alasan keputusan minimal 3 karakter.');return;}
    setBusyId(row.id);setError(null);
    try{
      await decideWorkforceIdentity(accessToken,row.id,{tenant_id:tenantId,decision,reason:decisionReason});
      await load();
    }catch(cause){setError(cause instanceof Error?cause.message:'Keputusan verifikasi gagal disimpan.');}
    finally{setBusyId(null);}
  };

  return <div className="space-y-5">
    <AdminPageHeader title="Human Workforce Governance" subtitle="Passport, identity verification, lifecycle dan assignment visibility berbasis data backend." onBack={onBack}
      actions={<button type="button" onClick={()=>void load()} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-[#D8E3E9] bg-white px-3 text-xs font-semibold text-[#17324D] disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${loading?'animate-spin':''}`}/> Refresh</button>}/>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <AdminSegmentedTabs tabs={[{id:'staff',label:`Staff (${profiles.length})`},{id:'verifikasi',label:`Verifikasi (${verifications.length})`},{id:'assignment',label:'Lifecycle'}]} activeTab={tab} onChange={setTab}/>
      <select value={tenantId} onChange={e=>setTenantId(e.target.value)} className="h-10 min-w-56 rounded-[10px] border border-[#D8E3E9] bg-white px-3 text-xs text-[#17324D]" aria-label="Pilih tenant">
        {tenants.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
    </div>
    {error&&<div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">{error}</div>}
    {loading?<div className="rounded-xl border border-[#D8E3E9] bg-white p-8 text-center text-sm text-[#526675]">Memuat data Human Workforce…</div>:<>
      {tab==='staff'&&<div className="overflow-hidden rounded-[14px] border border-[#D8E3E9] bg-white">
        {profiles.length===0?<div className="p-8 text-center text-sm text-[#718391]">Belum ada Workforce Passport pada tenant terpilih.</div>:
          <div className="overflow-x-auto"><table className="w-full text-left text-xs">
            <thead className="bg-[#F5F8FA] text-[#526675]"><tr><th className="px-4 py-3">Worker</th><th className="px-4 py-3">Job Family</th><th className="px-4 py-3">Engagement</th><th className="px-4 py-3">Lifecycle</th><th className="px-4 py-3">Updated</th></tr></thead>
            <tbody>{profiles.map(p=><tr key={p.id} className="border-t border-[#EAF2F6]">
              <td className="px-4 py-3"><p className="font-semibold text-[#17324D]">{p.display_name}</p><p className="mt-1 font-mono text-[10px] text-[#718391]">{p.worker_code}</p></td>
              <td className="px-4 py-3 text-[#526675]">{p.job_family||p.job_title||'—'}</td><td className="px-4 py-3 text-[#526675]">{p.engagement_status}</td>
              <td className="px-4 py-3"><AdminStatusText tone={p.lifecycle_status==='active'?'success':(['suspended','offboarded'].includes(p.lifecycle_status)?'danger':'warning')} label={p.lifecycle_status}/></td>
              <td className="px-4 py-3 text-[#718391]">{new Date(p.updated_at).toLocaleDateString('id-ID')}</td>
            </tr>)}</tbody>
          </table></div>}
      </div>}
      {tab==='verifikasi'&&<div className="space-y-3">
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4">
          <label className="block text-xs font-semibold text-[#17324D]">Alasan keputusan verifikasi</label>
          <textarea value={reason} onChange={e=>setReason(e.target.value)} rows={2} className="mt-2 w-full rounded-lg border border-[#D8E3E9] p-3 text-xs text-[#17324D]"/>
        </div>
        {verifications.length===0?<div className="rounded-[14px] border border-[#D8E3E9] bg-white p-8 text-center text-sm text-[#718391]">Tidak ada verifikasi yang menunggu keputusan.</div>:
          verifications.map(row=><div key={row.id} className="rounded-[14px] border border-[#D8E3E9] bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-bold text-[#17324D]">{row.display_name}</p><p className="mt-1 text-xs text-[#526675]">{row.worker_code} · {row.verification_type} · {new Date(row.submitted_at).toLocaleString('id-ID')}</p></div><AdminStatusText tone="warning" label={row.status}/></div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" disabled={busyId!==null} onClick={()=>void decide(row,'verified')} className="rounded-lg bg-[#247A55] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{busyId===row.id?'Menyimpan…':'Verifikasi'}</button>
              <button type="button" disabled={busyId!==null} onClick={()=>void decide(row,'rejected')} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50">Tolak</button>
            </div>
          </div>)}
      </div>}
      {tab==='assignment'&&<div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
        <div className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-[#0284C7]"/><h3 className="text-sm font-bold text-[#17324D]">Lifecycle Workforce</h3></div>
        <p className="mt-2 text-xs text-[#526675]">Ringkasan status berasal dari Workforce Passport yang tersimpan. Riwayat assignment tersedia melalui endpoint per Passport dan tidak ditampilkan sebagai angka simulasi.</p>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">{(['invited','registered','identity_pending','verified','onboarding','eligible','active','suspended'] as const).map(status=><div key={status} className="rounded-lg bg-[#F5F8FA] p-3"><p className="text-[10px] text-[#718391]">{status}</p><p className="mt-1 text-lg font-bold text-[#17324D]">{profiles.filter(p=>p.lifecycle_status===status).length}</p></div>)}</div>
      </div>}
    </>}
  </div>;
}
