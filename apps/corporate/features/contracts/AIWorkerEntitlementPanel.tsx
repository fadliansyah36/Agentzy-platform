'use client';

import React,{useCallback,useEffect,useState} from 'react';
import {useAgentzyAuth} from '@/apps/web/lib/auth/useAgentzyAuth';
import {
  activateCorporateAIWorker,createCorporateAIWorker,listCorporateAIWorkers,
  suspendCorporateAIWorker,type CorporateAIWorker,type ContractEntitlement,
} from '@/apps/web/lib/api-client';

const field='h-10 w-full rounded-[9px] border border-[#D8E3E9] bg-white px-3 text-sm text-[#17324D]';
const button='inline-flex h-9 items-center rounded-[9px] bg-[#17324D] px-3 text-xs font-semibold text-white disabled:opacity-50';
const secondary='inline-flex h-9 items-center rounded-[9px] border border-[#D8E3E9] bg-white px-3 text-xs font-semibold text-[#17324D] disabled:opacity-50';

export function AIWorkerEntitlementPanel({tenantId,entitlements}:{tenantId:string;entitlements:ContractEntitlement[]}) {
  const auth=useAgentzyAuth();
  const token=auth.session?.access_token ?? '';
  const canRead=auth.identity?.memberships.some(m=>m.tenant_id===tenantId && (m.permissions.includes('corporate.ai_workers.read') || m.permissions.includes('corporate.ai_workers.manage'))) ?? false;
  const canManage=auth.identity?.memberships.some(m=>m.tenant_id===tenantId && m.permissions.includes('corporate.ai_workers.manage')) ?? false;
  const [workers,setWorkers]=useState<CorporateAIWorker[]>([]);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [form,setForm]=useState({entitlement:'',worker_code:'',display_name:'',model_provider:'openai',model_key:''});

  const refresh=useCallback(async()=>{
    if(!token || !tenantId || !canRead)return;
    try{const result=await listCorporateAIWorkers(token,tenantId);setWorkers(result.data);}
    catch(e){setError(e instanceof Error?e.message:'Gagal memuat AI Worker.');}
  },[token,tenantId,canRead]);
  useEffect(()=>{let active=true;void(async()=>{if(active)await refresh();})();return()=>{active=false;};},[refresh]);

  const act=async(fn:()=>Promise<unknown>,message:string)=>{
    setSaving(true);setError('');setNotice('');
    try{await fn();setNotice(message);await refresh();}
    catch(e){setError(e instanceof Error?e.message:'Operasi AI Worker gagal.');}
    finally{setSaving(false);}
  };

  const create=()=>{
    const [contract_id,service_key]=form.entitlement.split('|');
    return act(()=>createCorporateAIWorker(token,{
      tenant_id:tenantId,contract_id,service_key,worker_code:form.worker_code,
      display_name:form.display_name,model_provider:form.model_provider,
      model_key:form.model_key,capabilities:[],runtime_config:{},
    }),'AI Worker draft tersimpan. Aktivasi akan memeriksa limit kontrak kembali.');
  };

  if(!canRead)return null;

  return <section className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
    <h2 className="text-sm font-bold text-[#17324D]">Tenant AI Worker Registry</h2>
    <p className="mt-1 text-xs text-[#718391]">Aktivasi diproteksi oleh limit AI Worker kontrak aktif. Provider credentials tidak disimpan di runtime config.</p>
    {error && <p role="alert" className="mt-3 text-xs text-red-700">{error}</p>}
    {notice && <p role="status" className="mt-3 text-xs text-emerald-700">{notice}</p>}
    {canManage && <div className="mt-4 grid gap-3 md:grid-cols-2">
      <label><span className="mb-1 block text-xs font-semibold text-[#526675]">Contract entitlement</span><select className={field} value={form.entitlement} onChange={e=>setForm(p=>({...p,entitlement:e.target.value}))}><option value="">Pilih service entitlement</option>{entitlements.map(e=><option key={e.id} value={e.contract_id+'|'+e.service_key}>{e.service_key} · limit {e.ai_worker_limit ?? 'unlimited'}</option>)}</select></label>
      <label><span className="mb-1 block text-xs font-semibold text-[#526675]">Worker code</span><input className={field} value={form.worker_code} onChange={e=>setForm(p=>({...p,worker_code:e.target.value}))}/></label>
      <label><span className="mb-1 block text-xs font-semibold text-[#526675]">Display name</span><input className={field} value={form.display_name} onChange={e=>setForm(p=>({...p,display_name:e.target.value}))}/></label>
      <label><span className="mb-1 block text-xs font-semibold text-[#526675]">Model provider</span><input className={field} value={form.model_provider} onChange={e=>setForm(p=>({...p,model_provider:e.target.value}))}/></label>
      <label><span className="mb-1 block text-xs font-semibold text-[#526675]">Model route key</span><input className={field} value={form.model_key} onChange={e=>setForm(p=>({...p,model_key:e.target.value}))}/></label>
      <button className={button} disabled={saving || !form.entitlement || !form.worker_code || !form.display_name || !form.model_key} onClick={()=>void create()}>Create AI Worker Draft</button>
    </div>}
    <div className="mt-4 divide-y divide-[#EAF2F6]">
      {workers.map(worker=><div key={worker.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div><p className="text-xs font-semibold text-[#17324D]">{worker.display_name} · {worker.worker_code}</p><p className="mt-1 text-[11px] text-[#718391]">{worker.service_key} · {worker.model_provider}/{worker.model_key} · {worker.status}</p></div>
        {canManage && <div className="flex gap-2">
          {worker.status!=='active' && worker.status!=='retired' && <button className={secondary} disabled={saving} onClick={()=>void act(()=>activateCorporateAIWorker(token,tenantId,worker.id),'AI Worker aktif setelah capacity check.')}>Activate</button>}
          {worker.status==='active' && <button className={secondary} disabled={saving} onClick={()=>void act(()=>suspendCorporateAIWorker(token,tenantId,worker.id),'AI Worker ditangguhkan.')}>Suspend</button>}
        </div>}
      </div>)}
      {!workers.length && <p className="py-4 text-xs text-[#718391]">Belum ada AI Worker terdaftar.</p>}
    </div>
  </section>;
}
