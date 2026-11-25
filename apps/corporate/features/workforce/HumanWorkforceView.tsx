'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Briefcase, Users, RefreshCw, ShieldCheck, Clock } from 'lucide-react';
import { CorporatePageHeader, CorporateSegmentedTabs } from '../../components/data-display/CorporateDataDisplay';
import {
  listWorkforceProfiles, listWorkforceEngagements, listWorkforceOnboarding,
  listWorkforceAssignments, listWorkforceAvailability, createWorkforceAssignment,
  createWorkforceEngagement, createWorkforceOnboardingTask, transitionWorkforceLifecycle,
  activateWorkforceEngagement, changeWorkforceEngagementStatus,
  type WorkforceProfile,
} from '@/apps/web/lib/api-client';

export function HumanWorkforceView({
  tenantId,
  accessToken,
  onBack,
}: {
  tenantId: string;
  accessToken: string | null;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<'overview' | 'directory'>('overview');
  const [profiles, setProfiles] = useState<WorkforceProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProfileId,setSelectedProfileId]=useState<string|null>(null);
  const [engagements,setEngagements]=useState<Record<string,unknown>[]>([]);
  const [onboarding,setOnboarding]=useState<Record<string,unknown>[]>([]);
  const [assignments,setAssignments]=useState<Record<string,unknown>[]>([]);
  const [availability,setAvailability]=useState<Record<string,unknown>[]>([]);
  const [assignmentForm,setAssignmentForm]=useState({assignment_reference:'',assignment_type:'project',starts_at:'',ends_at:'',workload_units:'1'});
  const [detailError,setDetailError]=useState<string|null>(null);
  const [engagementForm,setEngagementForm]=useState({classification:'employee',agreement_reference:'',contract_id:'',effective_from:'',effective_until:'',legal_review_reference:'',change_reason:''});
  const [factsAcknowledged,setFactsAcknowledged]=useState(false);
  const [taskForm,setTaskForm]=useState({task_key:'',title:'',task_type:'approval',description:''});
  const [lifecycleTarget,setLifecycleTarget]=useState<'onboarding'|'eligible'|'active'|'inactive'|'suspended'|'offboarded'>('onboarding');
  const [actionReason,setActionReason]=useState('');

  const load = async () => {
    if (!accessToken || !tenantId) return;
    setRefreshing(true);
    setError(null);
    try {
      const result = await listWorkforceProfiles(accessToken, tenantId);
      setProfiles(result.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Data Workforce gagal dimuat dari Agentzy API.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (!accessToken || !tenantId) return;
    void listWorkforceProfiles(accessToken, tenantId)
      .then((result) => { if (active) { setProfiles(result.data); setError(null); } })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Data Workforce gagal dimuat.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [accessToken, tenantId]);

  useEffect(()=>{
    if(!accessToken||!tenantId||!selectedProfileId)return;
    let active=true;
    void Promise.all([
      listWorkforceEngagements(accessToken,tenantId,selectedProfileId),
      listWorkforceOnboarding(accessToken,tenantId,selectedProfileId),
      listWorkforceAssignments(accessToken,tenantId,selectedProfileId),
      listWorkforceAvailability(accessToken,tenantId,selectedProfileId),
    ]).then(([engagementResult,taskResult,assignmentResult,availabilityResult])=>{
      if(!active)return;
      setEngagements(engagementResult.data);
      setOnboarding(taskResult.data);
      setAssignments(assignmentResult.data);
      setAvailability(availabilityResult.data);
      setDetailError(null);
    }).catch(cause=>{if(active)setDetailError(cause instanceof Error?cause.message:'Detail workforce gagal dimuat.');});
    return ()=>{active=false;};
  },[accessToken,tenantId,selectedProfileId]);

  const selectedProfile=profiles.find(p=>p.id===selectedProfileId)??null;
  const createEngagement=async()=>{
    if(!accessToken||!selectedProfileId)return;
    setDetailError(null);
    try{
      await createWorkforceEngagement(accessToken,selectedProfileId,{
        tenant_id:tenantId,classification:engagementForm.classification,
        agreement_reference:engagementForm.agreement_reference,contract_id:engagementForm.contract_id||null,
        effective_from:engagementForm.effective_from,effective_until:engagementForm.effective_until||null,legal_review_reference:engagementForm.legal_review_reference||null,
        facts_acknowledged:factsAcknowledged,change_reason:engagementForm.change_reason,
      });
      const result=await listWorkforceEngagements(accessToken,tenantId,selectedProfileId);setEngagements(result.data);
      await load();
    }catch(cause){setDetailError(cause instanceof Error?cause.message:'Engagement gagal disimpan.');}
  };
  const createAssignment=async()=>{
    if(!accessToken||!selectedProfileId)return;
    setDetailError(null);
    try{
      await createWorkforceAssignment(accessToken,selectedProfileId,{
        tenant_id:tenantId,assignment_reference:assignmentForm.assignment_reference,
        assignment_type:assignmentForm.assignment_type,
        starts_at:new Date(assignmentForm.starts_at).toISOString(),
        ends_at:assignmentForm.ends_at?new Date(assignmentForm.ends_at).toISOString():undefined,
        workload_units:Number(assignmentForm.workload_units),
      });
      const result=await listWorkforceAssignments(accessToken,tenantId,selectedProfileId);
      setAssignments(result.data);
      setAssignmentForm({assignment_reference:'',assignment_type:'project',starts_at:'',ends_at:'',workload_units:'1'});
    }catch(cause){setDetailError(cause instanceof Error?cause.message:'Assignment gagal dibuat atau terjadi scheduling conflict.');}
  };

  const createTask=async()=>{
    if(!accessToken||!selectedProfileId)return;
    setDetailError(null);
    try{
      await createWorkforceOnboardingTask(accessToken,selectedProfileId,{
        tenant_id:tenantId,...taskForm,required:true,
      });
      const result=await listWorkforceOnboarding(accessToken,tenantId,selectedProfileId);setOnboarding(result.data);
      setTaskForm({task_key:'',title:'',task_type:'approval',description:''});
    }catch(cause){setDetailError(cause instanceof Error?cause.message:'Onboarding task gagal dibuat.');}
  };
  const transition=async()=>{
    if(!accessToken||!selectedProfileId||actionReason.trim().length<3)return;
    setDetailError(null);
    try{
      await transitionWorkforceLifecycle(accessToken,selectedProfileId,{tenant_id:tenantId,to_status:lifecycleTarget,reason:actionReason});
      setActionReason('');await load();
    }catch(cause){setDetailError(cause instanceof Error?cause.message:'Lifecycle transition gagal.');}
  };
  const activateEngagement=async(engagementId:string)=>{
    if(!accessToken)return;
    try{await activateWorkforceEngagement(accessToken,engagementId,{tenant_id:tenantId,reason:actionReason.trim()});setActionReason('');await listWorkforceEngagements(accessToken,tenantId,selectedProfileId!).then(x=>setEngagements(x.data));await load();}
    catch(cause){setDetailError(cause instanceof Error?cause.message:'Engagement activation gagal.');}
  };
  const updateEngagement=async(engagementId:string,status:'suspended'|'ended')=>{
    if(!accessToken)return;
    try{await changeWorkforceEngagementStatus(accessToken,engagementId,tenantId,status,actionReason.trim());setActionReason('');await listWorkforceEngagements(accessToken,tenantId,selectedProfileId!).then(x=>setEngagements(x.data));await load();}
    catch(cause){setDetailError(cause instanceof Error?cause.message:'Perubahan engagement gagal.');}
  };

  const activeCount = profiles.filter((p) => p.lifecycle_status === 'active').length;
  const onboardingCount = profiles.filter((p) => ['registered','identity_pending','verified','onboarding','eligible'].includes(p.lifecycle_status)).length;
  const suspendedCount = profiles.filter((p) => ['inactive','suspended','offboarded'].includes(p.lifecycle_status)).length;
  const groups = useMemo(() => {
    const counts = new Map<string, number>();
    profiles.forEach((p) => {
      const key = p.job_family || p.job_title || 'Belum diklasifikasikan';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return [...counts.entries()].sort((a,b) => b[1]-a[1]);
  }, [profiles]);

  return (
    <div className="space-y-5">
      <CorporatePageHeader
        title="Human Workforce"
        subtitle="Data passport, status lifecycle, engagement, dan kesiapan workforce dari backend Agentzy"
        onBack={onBack}
      />
      <div className="flex items-center justify-between gap-3">
        <CorporateSegmentedTabs
          tabs={[{id:'overview',label:'Overview'},{id:'directory',label:'Directory'}]}
          activeTab={tab}
          onChange={setTab}
        />
        <button type="button" onClick={() => void load()} disabled={refreshing || loading}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#D8E3E9] bg-white px-3 text-xs font-semibold text-[#17324D] disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing?'animate-spin':''}`} /> Refresh
        </button>
      </div>
      {(!accessToken || !tenantId) && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">Sesi atau tenant context tidak tersedia.</div>}
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      {(!accessToken || !tenantId) ? (<div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Sesi atau tenant context tidak tersedia.</div>) : loading ? (
        <div className="rounded-xl border border-[#D8E3E9] bg-white p-8 text-center text-sm text-[#526675]">Memuat workforce dari FastAPI…</div>
      ) : (
        <>
          {tab === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  {label:'Total Workforce',value:profiles.length,icon:Users},
                  {label:'Active',value:activeCount,icon:ShieldCheck},
                  {label:'Onboarding / Eligible',value:onboardingCount,icon:Clock},
                  {label:'Inactive / Suspended',value:suspendedCount,icon:Briefcase},
                ].map((item) => {
                  const Icon=item.icon;
                  return <div key={item.label} className="rounded-[14px] border border-[#D8E3E9] bg-white p-4">
                    <div className="flex items-center justify-between text-[#526675]"><span className="text-xs">{item.label}</span><Icon className="h-4 w-4 text-[#0284C7]"/></div>
                    <p className="mt-2 font-mono-tabular text-2xl font-bold text-[#17324D]">{item.value.toLocaleString('id-ID')}</p>
                  </div>;
                })}
              </div>
              <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4">
                <h3 className="text-sm font-bold text-[#17324D]">Komposisi Job Family</h3>
                {groups.length===0 ? <p className="mt-3 text-xs text-[#718391]">Belum ada Workforce Passport pada tenant ini.</p> :
                  <div className="mt-3 space-y-3">{groups.map(([name,count])=><div key={name} className="flex items-center justify-between gap-4 text-xs"><span className="text-[#526675]">{name}</span><span className="font-semibold text-[#17324D]">{count}</span></div>)}</div>}
              </div>
            </div>
          )}
          {tab === 'directory' && (
            <div className="overflow-hidden rounded-[14px] border border-[#D8E3E9] bg-white">
              {profiles.length===0 ? <div className="p-8 text-center text-sm text-[#718391]">Belum ada Workforce Passport terdaftar untuk tenant ini.</div> :
                <div className="overflow-x-auto"><table className="w-full text-left text-xs">
                  <thead className="bg-[#F5F8FA] text-[#526675]"><tr><th className="px-4 py-3">Worker</th><th className="px-4 py-3">Job Family</th><th className="px-4 py-3">Engagement</th><th className="px-4 py-3">Lifecycle</th><th className="px-4 py-3">Updated</th></tr></thead>
                  <tbody>{profiles.map((p)=><tr key={p.id} className="border-t border-[#EAF2F6]">
                    <td className="px-4 py-3"><button type="button" onClick={()=>setSelectedProfileId(p.id)} className="text-left"><p className="font-semibold text-[#17324D]">{p.display_name}</p><p className="mt-1 font-mono text-[10px] text-[#718391]">{p.worker_code} · Detail</p></button></td>
                    <td className="px-4 py-3 text-[#526675]">{p.job_family || p.job_title || '—'}</td>
                    <td className="px-4 py-3 text-[#526675]">{p.engagement_status}</td>
                    <td className="px-4 py-3"><span className="rounded-md bg-[#E6F4F9] px-2 py-1 font-semibold text-[#0284C7]">{p.lifecycle_status}</span></td>
                    <td className="px-4 py-3 text-[#718391]">{new Date(p.updated_at).toLocaleDateString('id-ID')}</td>
                  </tr>)}</tbody>
                </table></div>}
            </div>
          )}
          {selectedProfile&&<section className="space-y-4 rounded-[14px] border border-[#D8E3E9] bg-white p-4">
            <div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-bold text-[#17324D]">{selectedProfile.display_name} · Workforce Operations</h3><p className="text-[11px] text-[#718391]">{selectedProfile.worker_code} · {selectedProfile.lifecycle_status}</p></div><button type="button" onClick={()=>setSelectedProfileId(null)} className="text-xs text-[#526675]">Tutup</button></div>
            {detailError&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-xs text-red-800">{detailError}</p>}
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg bg-[#F5F8FA] p-3"><h4 className="text-xs font-bold text-[#17324D]">Engagement & Contract</h4>
                {engagements.map((item,index)=><div key={String(item.id??index)} className="mt-2 border-b border-[#D8E3E9] pb-2 text-xs"><p className="font-semibold text-[#17324D]">{String(item.classification)} · {String(item.status)}</p><p className="mt-1 text-[#526675]">{String(item.agreement_reference)} · {String(item.contract_id??'External agreement')}</p>{item.status==='pending'&&<button type="button" disabled={actionReason.trim().length<3} onClick={()=>void activateEngagement(String(item.id))} className="mt-2 rounded-md bg-[#0284C7] px-2 py-1 text-[10px] font-semibold text-white disabled:opacity-40">Activate</button>}{item.status==='active'&&<div className="mt-2 flex gap-2"><button type="button" disabled={actionReason.trim().length<3} onClick={()=>void updateEngagement(String(item.id),'suspended')} className="rounded-md border border-[#D8E3E9] px-2 py-1 text-[10px] disabled:opacity-40">Suspend</button><button type="button" disabled={actionReason.trim().length<3} onClick={()=>void updateEngagement(String(item.id),'ended')} className="rounded-md border border-red-200 px-2 py-1 text-[10px] text-red-700 disabled:opacity-40">End</button></div>}</div>)}
                <div className="mt-3 grid gap-2">
                  <select value={engagementForm.classification} onChange={e=>setEngagementForm(v=>({...v,classification:e.target.value}))} className="h-9 rounded-md border border-[#D8E3E9] px-2 text-xs">{['employee','outsourced_worker','independent_contractor','freelance','affiliate','technical_partner','project_based_worker'].map(x=><option key={x}>{x}</option>)}</select>
                  <input value={engagementForm.agreement_reference} onChange={e=>setEngagementForm(v=>({...v,agreement_reference:e.target.value}))} placeholder="Agreement / Contract number" className="h-9 rounded-md border border-[#D8E3E9] px-2 text-xs"/>
                  <input value={engagementForm.contract_id} onChange={e=>setEngagementForm(v=>({...v,contract_id:e.target.value}))} placeholder="Contract UUID (optional)" className="h-9 rounded-md border border-[#D8E3E9] px-2 text-xs"/>
                  <input type="date" value={engagementForm.effective_from} onChange={e=>setEngagementForm(v=>({...v,effective_from:e.target.value}))} className="h-9 rounded-md border border-[#D8E3E9] px-2 text-xs"/><input type="date" value={engagementForm.effective_until} onChange={e=>setEngagementForm(v=>({...v,effective_until:e.target.value}))} className="h-9 rounded-md border border-[#D8E3E9] px-2 text-xs" aria-label="Effective until (optional)"/>
                  <input value={engagementForm.legal_review_reference} onChange={e=>setEngagementForm(v=>({...v,legal_review_reference:e.target.value}))} placeholder="Legal review reference" className="h-9 rounded-md border border-[#D8E3E9] px-2 text-xs"/>
                  <input value={engagementForm.change_reason} onChange={e=>setEngagementForm(v=>({...v,change_reason:e.target.value}))} placeholder="Reason for classification change" className="h-9 rounded-md border border-[#D8E3E9] px-2 text-xs"/>
                  <p className="text-[10px] leading-relaxed text-[#718391]">Classification harus mencerminkan hubungan kerja dan fakta pelaksanaan yang sebenarnya; label ini tidak mengubah atau menghindari kewajiban hukum.</p><label className="flex items-center gap-2 text-[11px] text-[#526675]"><input type="checkbox" checked={factsAcknowledged} onChange={e=>setFactsAcknowledged(e.target.checked)}/> Acknowledged actual engagement facts</label>
                  <button type="button" disabled={!engagementForm.agreement_reference||!engagementForm.effective_from||engagementForm.change_reason.length<3||!factsAcknowledged} onClick={()=>void createEngagement()} className="h-9 rounded-md bg-[#0284C7] text-xs font-semibold text-white disabled:opacity-40">Save Engagement</button>
                </div>
              </div>
              <div className="rounded-lg bg-[#F5F8FA] p-3"><h4 className="text-xs font-bold text-[#17324D]">Onboarding Checklist</h4>
                {onboarding.map((item,index)=><p key={String(item.id??index)} className="mt-2 border-b border-[#D8E3E9] pb-2 text-xs text-[#526675]">{String(item.title)} · {String(item.status)}</p>)}
                <div className="mt-3 grid gap-2"><input value={taskForm.task_key} onChange={e=>setTaskForm(v=>({...v,task_key:e.target.value}))} placeholder="Task key" className="h-9 rounded-md border border-[#D8E3E9] px-2 text-xs"/><input value={taskForm.title} onChange={e=>setTaskForm(v=>({...v,title:e.target.value}))} placeholder="Task title" className="h-9 rounded-md border border-[#D8E3E9] px-2 text-xs"/><select value={taskForm.task_type} onChange={e=>setTaskForm(v=>({...v,task_type:e.target.value}))} className="h-9 rounded-md border border-[#D8E3E9] px-2 text-xs">{['document','agreement_acknowledgement','training','verification','approval','other'].map(x=><option key={x}>{x}</option>)}</select><textarea value={taskForm.description} onChange={e=>setTaskForm(v=>({...v,description:e.target.value}))} placeholder="Task description" className="rounded-md border border-[#D8E3E9] p-2 text-xs"/><button type="button" disabled={!taskForm.task_key||!taskForm.title} onClick={()=>void createTask()} className="h-9 rounded-md bg-[#0284C7] text-xs font-semibold text-white disabled:opacity-40">Add Task</button></div>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg bg-[#F5F8FA] p-3"><h4 className="text-xs font-bold text-[#17324D]">Availability Calendar</h4>{availability.map((item,index)=><p key={String(item.id??index)} className="mt-2 border-b border-[#D8E3E9] pb-2 text-[11px] text-[#526675]">{String(item.availability_type)} · {new Date(String(item.starts_at)).toLocaleString('id-ID')} – {new Date(String(item.ends_at)).toLocaleString('id-ID')}</p>)}</div>
              <div className="rounded-lg bg-[#F5F8FA] p-3"><h4 className="text-xs font-bold text-[#17324D]">Assignment & Workload</h4>{assignments.map((item,index)=><p key={String(item.id??index)} className="mt-2 border-b border-[#D8E3E9] pb-2 text-[11px] text-[#526675]">{String(item.assignment_reference)} · {String(item.status)} · workload {String(item.workload_units)}</p>)}<div className="mt-3 grid gap-2"><input value={assignmentForm.assignment_reference} onChange={e=>setAssignmentForm(v=>({...v,assignment_reference:e.target.value}))} placeholder="Assignment reference" className="h-9 rounded-md border border-[#D8E3E9] px-2 text-xs"/><input value={assignmentForm.assignment_type} onChange={e=>setAssignmentForm(v=>({...v,assignment_type:e.target.value}))} placeholder="Assignment type" className="h-9 rounded-md border border-[#D8E3E9] px-2 text-xs"/><input type="datetime-local" value={assignmentForm.starts_at} onChange={e=>setAssignmentForm(v=>({...v,starts_at:e.target.value}))} className="h-9 rounded-md border border-[#D8E3E9] px-2 text-xs"/><input type="datetime-local" value={assignmentForm.ends_at} onChange={e=>setAssignmentForm(v=>({...v,ends_at:e.target.value}))} className="h-9 rounded-md border border-[#D8E3E9] px-2 text-xs"/><input type="number" min="0" value={assignmentForm.workload_units} onChange={e=>setAssignmentForm(v=>({...v,workload_units:e.target.value}))} className="h-9 rounded-md border border-[#D8E3E9] px-2 text-xs"/><button type="button" disabled={!assignmentForm.assignment_reference||!assignmentForm.assignment_type||!assignmentForm.starts_at} onClick={()=>void createAssignment()} className="h-9 rounded-md bg-[#0284C7] text-xs font-semibold text-white disabled:opacity-40">Schedule Assignment</button></div></div>
            </div>
            <div className="rounded-lg bg-[#F5F8FA] p-3"><h4 className="text-xs font-bold text-[#17324D]">Lifecycle transition</h4><div className="mt-2 flex flex-wrap gap-2"><select value={lifecycleTarget} onChange={e=>setLifecycleTarget(e.target.value as typeof lifecycleTarget)} className="h-9 rounded-md border border-[#D8E3E9] px-2 text-xs">{['onboarding','eligible','active','inactive','suspended','offboarded'].map(x=><option key={x}>{x}</option>)}</select><input value={actionReason} onChange={e=>setActionReason(e.target.value)} placeholder="Reason (required)" className="h-9 min-w-48 flex-1 rounded-md border border-[#D8E3E9] px-2 text-xs"/><button type="button" disabled={actionReason.trim().length<3} onClick={()=>void transition()} className="h-9 rounded-md bg-[#17324D] px-3 text-xs font-semibold text-white disabled:opacity-40">Transition</button></div></div>
          </section>}
        </>
      )}
    </div>
  );
}
