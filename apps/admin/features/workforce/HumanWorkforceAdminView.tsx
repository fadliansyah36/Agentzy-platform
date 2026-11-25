'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, ClipboardCheck } from 'lucide-react';
import { AdminPageHeader, AdminSegmentedTabs, AdminStatusText } from '../../components/data-display/AdminDataDisplay';
import {
  listWorkforceProfiles,
  listWorkforceIdentityVerifications,
  listWorkforceCertificationQueue,
  listWorkforceSkillVerificationQueue,
  listWorkforceSkills,
  createWorkforceSkill,
  listWorkforceCourses,
  createWorkforceCourse,
  decideWorkforceIdentity,
  verifyWorkforceCertification,
  verifyWorkforceSkill,
  purgeExpiredWorkforceDocuments,
  type WorkforceProfile,
} from '@/apps/web/lib/api-client';

type TenantOption = { id: string; name: string };
type SkillQueueRow = {id:string;workforce_profile_id:string;proficiency:string;experience_months:number;skill_name:string;skill_key:string;worker_code:string;display_name:string};
type CertificationRow = {id:string;workforce_profile_id:string;name:string;issuer:string;certificate_reference:string|null;expires_at:string|null;verification_status:string;worker_code:string;display_name:string};
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
  const [tab,setTab]=useState<'staff'|'verifikasi'|'sertifikasi'|'skills'|'training'|'privacy'|'assignment'>('staff');
  const [tenantId,setTenantId]=useState(tenants[0]?.id ?? '');
  const [profiles,setProfiles]=useState<WorkforceProfile[]>([]);
  const [verifications,setVerifications]=useState<VerificationRow[]>([]);
  const [certifications,setCertifications]=useState<CertificationRow[]>([]);
  const [skillQueue,setSkillQueue]=useState<SkillQueueRow[]>([]);
  const [skillRegistry,setSkillRegistry]=useState<Record<string,unknown>[]>([]);
  const [courses,setCourses]=useState<Record<string,unknown>[]>([]);
  const [courseForm,setCourseForm]=useState({course_key:'',title:'',description:'',material_title:'',material_url:'',pass_score:'70',validity_days:'365'});
  const [requiredForActivation,setRequiredForActivation]=useState(false);
  const [retentionReason,setRetentionReason]=useState('');
  const [purgedCount,setPurgedCount]=useState<number|null>(null);
  const [newSkill,setNewSkill]=useState({skill_key:'',name:'',category:'technical',description:''});
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const [busyId,setBusyId]=useState<string|null>(null);
  const [reason,setReason]=useState('Dokumen telah diperiksa sesuai persyaratan verifikasi.');

  const load=async()=>{
    if(!accessToken||!tenantId){setLoading(false);setError('Pilih tenant yang dapat dikelola.');return;}
    setLoading(true);setError(null);
    try{
      const [profileResult,verificationResult,certificationResult,skillQueueResult,skillRegistryResult,courseResult]=await Promise.all([
        listWorkforceProfiles(accessToken,tenantId),
        listWorkforceIdentityVerifications(accessToken,tenantId,'pending'),
        listWorkforceCertificationQueue(accessToken,tenantId,'pending'),
        listWorkforceSkillVerificationQueue(accessToken,tenantId),
        listWorkforceSkills(accessToken,tenantId),
        listWorkforceCourses(accessToken,tenantId),
      ]);
      setProfiles(profileResult.data);
      setVerifications(verificationResult.data as VerificationRow[]);
      setCertifications(certificationResult.data as CertificationRow[]);
      setSkillQueue(skillQueueResult.data as SkillQueueRow[]);
      setSkillRegistry(skillRegistryResult.data);
      setCourses(courseResult.data);
    }catch(cause){setError(cause instanceof Error?cause.message:'Data Human Workforce gagal dimuat dari FastAPI.');}
    finally{setLoading(false);}
  };
  useEffect(()=>{
    if(!accessToken||!tenantId)return;
    let active=true;
    void Promise.all([
      listWorkforceProfiles(accessToken,tenantId),
      listWorkforceIdentityVerifications(accessToken,tenantId,'pending'),
      listWorkforceCertificationQueue(accessToken,tenantId,'pending'),
      listWorkforceSkillVerificationQueue(accessToken,tenantId),
      listWorkforceSkills(accessToken,tenantId),
      listWorkforceCourses(accessToken,tenantId),
    ]).then(([profileResult,verificationResult,certificationResult,skillQueueResult,skillRegistryResult,courseResult])=>{
      if(!active)return;
      setProfiles(profileResult.data);
      setVerifications(verificationResult.data as VerificationRow[]);
      setCertifications(certificationResult.data as CertificationRow[]);
      setSkillQueue(skillQueueResult.data as SkillQueueRow[]);
      setSkillRegistry(skillRegistryResult.data);
      setCourses(courseResult.data);
      setError(null);
    }).catch(cause=>{
      if(active)setError(cause instanceof Error?cause.message:'Data Human Workforce gagal dimuat dari FastAPI.');
    }).finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[accessToken,tenantId]);

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

  const decideCertification=async(row:CertificationRow,decision:'verified'|'rejected')=>{
    if(!accessToken||!tenantId)return;
    const decisionReason=reason.trim();
    if(decisionReason.length<3){setError('Alasan keputusan minimal 3 karakter.');return;}
    setBusyId(row.id);setError(null);
    try{
      await verifyWorkforceCertification(accessToken,tenantId,row.id,decision,decisionReason);
      await load();
    }catch(cause){setError(cause instanceof Error?cause.message:'Keputusan sertifikasi gagal disimpan.');}
    finally{setBusyId(null);}
  };

  const verifySkill=async(row:SkillQueueRow)=>{
    if(!accessToken||!tenantId)return;
    const decisionReason=reason.trim();
    if(decisionReason.length<3){setError('Alasan verifikasi minimal 3 karakter.');return;}
    setBusyId(row.id);setError(null);
    try{await verifyWorkforceSkill(accessToken,tenantId,row.id,decisionReason);await load();}
    catch(cause){setError(cause instanceof Error?cause.message:'Verifikasi skill gagal.');}
    finally{setBusyId(null);}
  };
  const addSkill=async()=>{
    if(!accessToken||!tenantId)return;
    setBusyId('new-skill');setError(null);
    try{
      await createWorkforceSkill(accessToken,{tenant_id:tenantId,...newSkill});
      setNewSkill({skill_key:'',name:'',category:'technical',description:''});
      await load();
    }catch(cause){setError(cause instanceof Error?cause.message:'Skill registry gagal disimpan.');}
    finally{setBusyId(null);}
  };

  const purgeExpiredDocuments=async()=>{
    if(!accessToken||!tenantId||retentionReason.trim().length<3)return;
    setBusyId('retention-purge');setError(null);
    try{
      const result=await purgeExpiredWorkforceDocuments(accessToken,tenantId,retentionReason.trim());
      setPurgedCount(result.data.purged_count);
      setRetentionReason('');
    }catch(cause){setError(cause instanceof Error?cause.message:'Document retention purge gagal.');}
    finally{setBusyId(null);}
  };

  const addCourse=async()=>{
    if(!accessToken||!tenantId)return;
    let materials:Record<string,unknown>[]=[];
    if(courseForm.material_title.trim()&&courseForm.material_url.trim()){
      materials=[{title:courseForm.material_title.trim(),url:courseForm.material_url.trim()}];
    }
    setBusyId('new-course');setError(null);
    try{
      await createWorkforceCourse(accessToken,{
        tenant_id:tenantId,course_key:courseForm.course_key,title:courseForm.title,
        description:courseForm.description,materials,assessment:{pass_score:Number(courseForm.pass_score)},
        eligibility_rules:{required_for_activation:requiredForActivation},
        validity_days:courseForm.validity_days?Number(courseForm.validity_days):undefined,status:'published',
      });
      setCourseForm({course_key:'',title:'',description:'',material_title:'',material_url:'',pass_score:'70',validity_days:'365'});
      await load();
    }catch(cause){setError(cause instanceof Error?cause.message:'Training course gagal dibuat.');}
    finally{setBusyId(null);}
  };

  return <div className="space-y-5">
    <AdminPageHeader title="Human Workforce Governance" subtitle="Passport, identity verification, lifecycle dan assignment visibility berbasis data backend." onBack={onBack}
      actions={<button type="button" onClick={()=>void load()} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-[#D8E3E9] bg-white px-3 text-xs font-semibold text-[#17324D] disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${loading?'animate-spin':''}`}/> Refresh</button>}/>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <AdminSegmentedTabs tabs={[{id:'staff',label:`Staff (${profiles.length})`},{id:'verifikasi',label:`Verifikasi (${verifications.length})`},{id:'sertifikasi',label:`Sertifikasi (${certifications.length})`},{id:'skills',label:`Skills (${skillQueue.length})`},{id:'training',label:`Training (${courses.length})`},{id:'privacy',label:'Privacy'},{id:'assignment',label:'Lifecycle'}]} activeTab={tab} onChange={setTab}/>
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
      {tab==='sertifikasi'&&<div className="space-y-3">
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4"><label className="block text-xs font-semibold text-[#17324D]">Alasan keputusan sertifikasi</label><textarea value={reason} onChange={e=>setReason(e.target.value)} rows={2} className="mt-2 w-full rounded-lg border border-[#D8E3E9] p-3 text-xs text-[#17324D]"/></div>
        {certifications.length===0?<div className="rounded-[14px] border border-[#D8E3E9] bg-white p-8 text-center text-sm text-[#718391]">Tidak ada sertifikasi yang menunggu verifikasi.</div>:
          certifications.map(row=><div key={row.id} className="rounded-[14px] border border-[#D8E3E9] bg-white p-4"><p className="text-sm font-bold text-[#17324D]">{row.name}</p><p className="mt-1 text-xs text-[#526675]">{row.display_name} · {row.worker_code} · {row.issuer}</p><p className="mt-1 text-[11px] text-[#718391]">Ref: {row.certificate_reference||'—'} · Expiry: {row.expires_at||'—'}</p><div className="mt-3 flex gap-2"><button type="button" disabled={busyId!==null} onClick={()=>void decideCertification(row,'verified')} className="rounded-lg bg-[#247A55] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Verify</button><button type="button" disabled={busyId!==null} onClick={()=>void decideCertification(row,'rejected')} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50">Reject</button></div></div>)}
      </div>}
      {tab==='skills'&&<div className="space-y-3">
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4"><h3 className="text-xs font-bold text-[#17324D]">Skill Registry</h3><div className="mt-3 grid gap-2 sm:grid-cols-2"><input value={newSkill.skill_key} onChange={e=>setNewSkill(v=>({...v,skill_key:e.target.value}))} placeholder="Skill key" className="h-9 rounded-lg border border-[#D8E3E9] px-3 text-xs"/><input value={newSkill.name} onChange={e=>setNewSkill(v=>({...v,name:e.target.value}))} placeholder="Skill name" className="h-9 rounded-lg border border-[#D8E3E9] px-3 text-xs"/><input value={newSkill.category} onChange={e=>setNewSkill(v=>({...v,category:e.target.value}))} placeholder="Category" className="h-9 rounded-lg border border-[#D8E3E9] px-3 text-xs"/><input value={newSkill.description} onChange={e=>setNewSkill(v=>({...v,description:e.target.value}))} placeholder="Description" className="h-9 rounded-lg border border-[#D8E3E9] px-3 text-xs"/></div><button type="button" disabled={busyId!==null||!newSkill.skill_key||!newSkill.name} onClick={()=>void addSkill()} className="mt-3 h-9 rounded-lg bg-[#0284C7] px-3 text-xs font-semibold text-white disabled:opacity-50">Create Skill</button><div className="mt-3 flex flex-wrap gap-2">{skillRegistry.map(skill=><span key={String(skill.id)} className="rounded-md bg-[#F5F8FA] px-2 py-1 text-[10px] text-[#526675]">{String(skill.name)} · {String(skill.category)}</span>)}</div></div>
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4"><h3 className="text-xs font-bold text-[#17324D]">Skill Verification Queue</h3><textarea value={reason} onChange={e=>setReason(e.target.value)} rows={2} className="mt-2 w-full rounded-lg border border-[#D8E3E9] p-3 text-xs" placeholder="Verification reason"/>{skillQueue.length===0?<p className="mt-3 text-xs text-[#718391]">Tidak ada skill yang menunggu verifikasi.</p>:skillQueue.map(row=><div key={row.id} className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#EAF2F6] pt-3"><div><p className="text-xs font-semibold text-[#17324D]">{row.skill_name} · {row.proficiency}</p><p className="text-[11px] text-[#718391]">{row.display_name} · {row.worker_code} · {row.experience_months} months</p></div><button type="button" disabled={busyId!==null||reason.trim().length<3} onClick={()=>void verifySkill(row)} className="rounded-lg border border-[#0284C7] px-3 py-2 text-xs font-semibold text-[#0284C7] disabled:opacity-50">Verify Skill</button></div>)}</div>
      </div>}
      {tab==='training'&&<div className="space-y-3">
        <section className="rounded-[14px] border border-[#D8E3E9] bg-white p-4"><h3 className="text-xs font-bold text-[#17324D]">Training Catalogue</h3><div className="mt-3 grid gap-2 sm:grid-cols-2"><input value={courseForm.course_key} onChange={e=>setCourseForm(v=>({...v,course_key:e.target.value}))} placeholder="Course key" className="h-9 rounded-lg border border-[#D8E3E9] px-3 text-xs"/><input value={courseForm.title} onChange={e=>setCourseForm(v=>({...v,title:e.target.value}))} placeholder="Course title" className="h-9 rounded-lg border border-[#D8E3E9] px-3 text-xs"/><input value={courseForm.description} onChange={e=>setCourseForm(v=>({...v,description:e.target.value}))} placeholder="Description" className="h-9 rounded-lg border border-[#D8E3E9] px-3 text-xs"/><input value={courseForm.pass_score} onChange={e=>setCourseForm(v=>({...v,pass_score:e.target.value}))} type="number" min="0" max="100" placeholder="Pass score" className="h-9 rounded-lg border border-[#D8E3E9] px-3 text-xs"/><input value={courseForm.validity_days} onChange={e=>setCourseForm(v=>({...v,validity_days:e.target.value}))} type="number" min="1" max="3650" placeholder="Validity days" className="h-9 rounded-lg border border-[#D8E3E9] px-3 text-xs"/><input value={courseForm.material_title} onChange={e=>setCourseForm(v=>({...v,material_title:e.target.value}))} placeholder="Material title" className="h-9 rounded-lg border border-[#D8E3E9] px-3 text-xs"/><input value={courseForm.material_url} onChange={e=>setCourseForm(v=>({...v,material_url:e.target.value}))} placeholder="Material URL" className="h-9 rounded-lg border border-[#D8E3E9] px-3 text-xs"/></div><label className="mt-3 flex items-center gap-2 text-xs text-[#526675]"><input type="checkbox" checked={requiredForActivation} onChange={e=>setRequiredForActivation(e.target.checked)}/> Required for workforce activation</label><button type="button" disabled={busyId!==null||!courseForm.course_key||!courseForm.title||Number(courseForm.pass_score)<0||Number(courseForm.pass_score)>100} onClick={()=>void addCourse()} className="mt-3 h-9 rounded-lg bg-[#0284C7] px-3 text-xs font-semibold text-white disabled:opacity-50">Publish Course</button></section>
        <section className="rounded-[14px] border border-[#D8E3E9] bg-white p-4"><h3 className="text-xs font-bold text-[#17324D]">Published Courses</h3>{courses.length===0?<p className="mt-2 text-xs text-[#718391]">Belum ada course yang dipublikasikan.</p>:courses.map(course=><div key={String(course.id)} className="mt-2 border-b border-[#EAF2F6] pb-2"><p className="text-xs font-semibold text-[#17324D]">{String(course.title)}</p><p className="text-[11px] text-[#718391]">{String(course.course_key)} · Validity {String(course.validity_days??'—')} days</p></div>)}</section>
      </div>}
      {tab==='privacy'&&<div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5"><h3 className="text-sm font-bold text-[#17324D]">Workforce Document Retention</h3><p className="mt-2 text-xs text-[#526675]">Hapus object dan redact metadata dokumen yang telah melewati retention_until. Proses hanya menyentuh dokumen tenant terpilih dan mencatat audit.</p><label className="mt-3 block text-xs text-[#526675]">Reason<input value={retentionReason} onChange={e=>setRetentionReason(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[#D8E3E9] px-3 text-xs"/></label><button type="button" disabled={busyId!==null||retentionReason.trim().length<3} onClick={()=>void purgeExpiredDocuments()} className="mt-3 h-9 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-700 disabled:opacity-50">Purge Expired Documents</button>{purgedCount!==null&&<p className="mt-3 text-xs text-[#247A55]">Dokumen yang berhasil di-purge: {purgedCount}</p>}</div>}
      {tab==='assignment'&&<div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
        <div className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-[#0284C7]"/><h3 className="text-sm font-bold text-[#17324D]">Lifecycle Workforce</h3></div>
        <p className="mt-2 text-xs text-[#526675]">Ringkasan status berasal dari Workforce Passport yang tersimpan. Riwayat assignment tersedia melalui endpoint per Passport dan tidak ditampilkan sebagai angka simulasi.</p>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">{(['invited','registered','identity_pending','verified','onboarding','eligible','active','suspended'] as const).map(status=><div key={status} className="rounded-lg bg-[#F5F8FA] p-3"><p className="text-[10px] text-[#718391]">{status}</p><p className="mt-1 text-lg font-bold text-[#17324D]">{profiles.filter(p=>p.lifecycle_status===status).length}</p></div>)}</div>
      </div>}
    </>}
  </div>;
}
