'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  ApiError, getMyWorkforcePassport, listWorkforceCourses, registerMyWorkforceProfile,
  submitWorkforceIdentity, uploadWorkforceIdentityDocument, enrollWorkforceTraining, updateWorkforceTrainingProgress,
  createWorkforceAvailability, updateWorkforceOnboardingTask,
  listWorkforceSkills, addWorkforceSkill, addWorkforceCertification, renewWorkforceCertification,
  type AgentzyWorkforceTenantContext, type WorkforcePassport,
} from '@/apps/web/lib/api-client';

type Course = Record<string, unknown> & { id:string; title:string; description?:string|null; course_key:string };
type Tab = 'passport'|'training'|'availability'|'onboarding'|'history';

export function WorkforcePassportBackendView({
  accessToken,
  tenantContexts,
  userName,
  initialTab='passport',
}:{
  accessToken:string|null;
  tenantContexts:AgentzyWorkforceTenantContext[];
  userName:string;
  initialTab?:Tab;
}) {
  const [tenantId,setTenantId]=useState(tenantContexts[0]?.tenant_id??'');
  const [tab,setTab]=useState<Tab>(initialTab);
  const [passport,setPassport]=useState<WorkforcePassport|null>(null);
  const [courses,setCourses]=useState<Course[]>([]);
  const [skillRegistry,setSkillRegistry]=useState<Record<string,unknown>[]>([]);
  const [skillForm,setSkillForm]=useState({skill_id:'',proficiency:'intermediate',experience_months:'0',evidence_reference:''});
  const [certForm,setCertForm]=useState({name:'',issuer:'',certificate_reference:'',valid_from:'',expires_at:''});
  const [renewalOf,setRenewalOf]=useState('');
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [notRegistered,setNotRegistered]=useState(false);
  const [registration,setRegistration]=useState({worker_code:'',display_name:userName,job_family:'',job_title:'',experience_years:'0'});
  const [assessmentScore,setAssessmentScore]=useState('');
  const [taskReason,setTaskReason]=useState('');
  const [identityFile,setIdentityFile]=useState<File|null>(null);
  const [pendingVerificationId,setPendingVerificationId]=useState<string|null>(null);
  const [availability,setAvailability]=useState({type:'leave',starts_at:'',ends_at:'',reason:''});

  const load=useCallback(async()=>{
    if(!accessToken||!tenantId){setLoading(false);setError('Tenant Workforce belum dipilih.');return;}
    setLoading(true);setError(null);setNotRegistered(false);
    try{
      const result=await getMyWorkforcePassport(accessToken,tenantId);
      setPassport(result.data);
      setNotRegistered(false);
    }catch(cause){
      if(cause instanceof ApiError&&cause.status===404){setPassport(null);setNotRegistered(true);}
      else setError(cause instanceof Error?cause.message:'Workforce Passport gagal dimuat.');
    }
    try{
      const result=await listWorkforceCourses(accessToken,tenantId);
      setCourses(result.data as Course[]);
    }catch(cause){
      if(!(cause instanceof ApiError&&cause.status===403)) setError(cause instanceof Error?cause.message:'Training catalogue gagal dimuat.');
    }finally{setLoading(false);}
  },[accessToken,tenantId]);

  useEffect(()=>{
    if(!accessToken||!tenantId)return;
    let active=true;
    void Promise.all([
      getMyWorkforcePassport(accessToken,tenantId).then(result=>({kind:'passport' as const,result})).catch(cause=>({kind:'passport-error' as const,cause})),
      listWorkforceCourses(accessToken,tenantId).then(result=>({kind:'courses' as const,result})).catch(cause=>({kind:'courses-error' as const,cause})),
      listWorkforceSkills(accessToken,tenantId).then(result=>({kind:'skills' as const,result})).catch(cause=>({kind:'skills-error' as const,cause})),
    ]).then(results=>{
      if(!active)return;
      for(const item of results){
        if(item.kind==='passport') {setPassport(item.result.data);setNotRegistered(false);}
        else if(item.kind==='passport-error') {
          if(item.cause instanceof ApiError&&item.cause.status===404){setPassport(null);setNotRegistered(true);}
          else setError(item.cause instanceof Error?item.cause.message:'Workforce Passport gagal dimuat.');
        } else if(item.kind==='courses') setCourses(item.result.data as Course[]);
        else if(item.kind==='skills') setSkillRegistry(item.result.data);
        else if(!(item.cause instanceof ApiError&&item.cause.status===403)) setError(item.cause instanceof Error?item.cause.message:'Data Workforce gagal dimuat.');
      }
    }).finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[accessToken,tenantId]);

  const run=async(action:()=>Promise<unknown>)=>{
    setBusy(true);setError(null);
    try{await action();await load();}
    catch(cause){setError(cause instanceof Error?cause.message:'Operasi Workforce gagal disimpan.');}
    finally{setBusy(false);}
  };

  const register=()=>run(()=>registerMyWorkforceProfile(accessToken!,{
    tenant_id:tenantId,worker_code:registration.worker_code.trim(),display_name:registration.display_name.trim(),
    job_family:registration.job_family||undefined,job_title:registration.job_title||undefined,
    experience_years:Number(registration.experience_years),
  }));

  const submitIdentity=async()=>{
    if(!passport||!accessToken||!identityFile){setError('Pilih dokumen identitas terlebih dahulu.');return;}
    setBusy(true);setError(null);
    try{
      let verificationId=pendingVerificationId;
      if(!verificationId){
        const submitted=await submitWorkforceIdentity(accessToken,passport.id,{tenant_id:tenantId,verification_type:'identity'});
        verificationId=String(submitted.data.id);
        setPendingVerificationId(verificationId);
      }
      await uploadWorkforceIdentityDocument(accessToken,tenantId,verificationId,identityFile,'identity_document');
      setIdentityFile(null);setPendingVerificationId(null);
      await load();
    }catch(cause){setError(cause instanceof Error?cause.message:'Dokumen identitas gagal diunggah atau diverifikasi.');}
    finally{setBusy(false);}
  };

  const enroll=(courseId:string)=>passport&&run(()=>enrollWorkforceTraining(accessToken!,passport.id,{tenant_id:tenantId,course_id:courseId}));

  const saveProgress=(enrollmentId:string)=>run(()=>updateWorkforceTrainingProgress(accessToken!,enrollmentId,{
    tenant_id:tenantId,progress_percent:100,assessment_score:Number(assessmentScore),
    assessment_result:{recorded_at:new Date().toISOString(),source:'workforce_portal'},
  }));

  const submitSkill=()=>passport&&run(()=>addWorkforceSkill(accessToken!,passport.id,{
    tenant_id:tenantId,skill_id:skillForm.skill_id,proficiency:skillForm.proficiency,
    experience_months:Number(skillForm.experience_months),evidence_reference:skillForm.evidence_reference||undefined,
  }));
  const renewCertification=()=>renewalOf&&run(()=>renewWorkforceCertification(accessToken!,renewalOf,{
    tenant_id:tenantId,certificate_reference:certForm.certificate_reference,
    valid_from:certForm.valid_from,expires_at:certForm.expires_at||undefined,
  }));
  const submitCertification=()=>passport&&run(()=>addWorkforceCertification(accessToken!,passport.id,{
    tenant_id:tenantId,name:certForm.name,issuer:certForm.issuer,
    certificate_reference:certForm.certificate_reference||undefined,
    valid_from:certForm.valid_from||undefined,expires_at:certForm.expires_at||undefined,evidence_metadata:{},
  }));
  const saveAvailability=()=>passport&&run(()=>createWorkforceAvailability(accessToken!,passport.id,{
    tenant_id:tenantId,availability_type:availability.type,
    starts_at:new Date(availability.starts_at).toISOString(),ends_at:new Date(availability.ends_at).toISOString(),
    timezone:passport.timezone,reason:availability.reason,
  }));

  const completeTask=(taskId:string)=>run(()=>updateWorkforceOnboardingTask(accessToken!,taskId,{
    tenant_id:tenantId,status:'completed',reason:taskReason.trim(),
  }));

  const nav:[Tab,string][]=[['passport','Passport'],['training','Training'],['availability','Availability'],['onboarding','Onboarding'],['history','History']];

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-lg font-bold text-[#17324D]">Human Workforce Passport</h2><p className="mt-1 text-xs text-[#718391]">Data identitas dan lifecycle dari Agentzy FastAPI.</p></div>
      <div className="flex items-center gap-2">
        {tenantContexts.length>1&&<select value={tenantId} onChange={e=>setTenantId(e.target.value)} className="h-9 rounded-lg border border-[#D8E3E9] bg-white px-3 text-xs">{tenantContexts.map(t=><option key={t.tenant_id} value={t.tenant_id}>{t.tenant_id.slice(0,8)}</option>)}</select>}
        <button type="button" onClick={()=>void load()} disabled={loading||busy} className="h-9 rounded-lg border border-[#D8E3E9] px-3 text-xs font-semibold text-[#17324D]">Refresh</button>
      </div>
    </div>
    <div className="flex flex-wrap gap-1.5 border-b border-[#D8E3E9] pb-2">{nav.map(([key,label])=><button key={key} type="button" onClick={()=>setTab(key)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${tab===key?'bg-[#E6F4F9] text-[#0284C7]':'text-[#526675] hover:bg-[#F5F8FA]'}`}>{label}</button>)}</div>
    {error&&<div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">{error}</div>}
    {loading?<div className="rounded-xl border border-[#D8E3E9] bg-white p-8 text-center text-sm text-[#526675]">Memuat data Workforce…</div>:
      notRegistered?<div className="max-w-xl rounded-[14px] border border-[#D8E3E9] bg-white p-5">
        <h3 className="text-sm font-bold text-[#17324D]">Registrasi Workforce</h3><p className="mt-1 text-xs text-[#718391]">Buat Passport menggunakan membership tenant yang aktif.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-[#526675]">Worker Code<input value={registration.worker_code} onChange={e=>setRegistration(v=>({...v,worker_code:e.target.value}))} className="mt-1 h-10 w-full rounded-lg border border-[#D8E3E9] px-3 text-sm" /></label>
          <label className="text-xs text-[#526675]">Nama tampilan<input value={registration.display_name} onChange={e=>setRegistration(v=>({...v,display_name:e.target.value}))} className="mt-1 h-10 w-full rounded-lg border border-[#D8E3E9] px-3 text-sm" /></label>
          <label className="text-xs text-[#526675]">Job Family<input value={registration.job_family} onChange={e=>setRegistration(v=>({...v,job_family:e.target.value}))} className="mt-1 h-10 w-full rounded-lg border border-[#D8E3E9] px-3 text-sm" /></label>
          <label className="text-xs text-[#526675]">Jabatan<input value={registration.job_title} onChange={e=>setRegistration(v=>({...v,job_title:e.target.value}))} className="mt-1 h-10 w-full rounded-lg border border-[#D8E3E9] px-3 text-sm" /></label>
          <label className="text-xs text-[#526675]">Pengalaman (tahun)<input type="number" min="0" max="80" value={registration.experience_years} onChange={e=>setRegistration(v=>({...v,experience_years:e.target.value}))} className="mt-1 h-10 w-full rounded-lg border border-[#D8E3E9] px-3 text-sm" /></label>
        </div>
        <button type="button" disabled={busy||!registration.worker_code.trim()||!registration.display_name.trim()} onClick={()=>void register()} className="mt-4 h-10 rounded-lg bg-[#0284C7] px-4 text-xs font-semibold text-white disabled:opacity-50">{busy?'Menyimpan…':'Daftar Workforce'}</button>
      </div>:
      passport&&<>
        {tab==='passport'&&<div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-[14px] border border-[#D8E3E9] bg-white p-5"><p className="text-xs text-[#718391]">Passport Identity</p><h3 className="mt-1 text-lg font-bold text-[#17324D]">{passport.display_name}</h3><p className="mt-1 font-mono text-xs text-[#526675]">{passport.worker_code}</p><div className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><p className="text-[#718391]">Job Family</p><p className="mt-1 font-semibold text-[#17324D]">{passport.job_family||'—'}</p></div><div><p className="text-[#718391]">Jabatan</p><p className="mt-1 font-semibold text-[#17324D]">{passport.job_title||'—'}</p></div><div><p className="text-[#718391]">Lifecycle</p><p className="mt-1 font-semibold text-[#0284C7]">{passport.lifecycle_status}</p></div><div><p className="text-[#718391]">Engagement</p><p className="mt-1 font-semibold text-[#17324D]">{passport.engagement_status}</p></div></div><div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="min-w-0 flex-1 text-xs text-[#526675]">Dokumen identitas (PDF/JPG/PNG, maks. 10 MB)
              <input type="file" accept="application/pdf,image/jpeg,image/png" onChange={e=>setIdentityFile(e.target.files?.[0]??null)} className="mt-1 block w-full text-xs"/>
            </label>
            <button type="button" disabled={busy||!identityFile||(!pendingVerificationId&&passport.lifecycle_status!=='registered')} onClick={()=>void submitIdentity()} className="h-10 rounded-lg border border-[#0284C7] px-4 text-xs font-semibold text-[#0284C7] disabled:opacity-40">{busy?'Mengunggah…':pendingVerificationId?'Unggah Dokumen':'Ajukan Verifikasi'}</button>
          </div></section>
          <section className="rounded-[14px] border border-[#D8E3E9] bg-white p-5"><h3 className="text-sm font-bold text-[#17324D]">Passport Summary</h3><div className="mt-3 grid grid-cols-2 gap-3 text-xs">{[['Skills',passport.skills.length],['Certifications',passport.certifications.length],['Training',passport.training.length],['Assignments',passport.assignments.length],['Onboarding Tasks',passport.onboarding.length],['Lifecycle Events',passport.history.length]].map(([label,value])=><div key={String(label)} className="rounded-lg bg-[#F5F8FA] p-3"><p className="text-[#718391]">{label}</p><p className="mt-1 text-lg font-bold text-[#17324D]">{value}</p></div>)}</div></section>
          <div className="grid gap-4 lg:col-span-2 lg:grid-cols-2">
            <section className="rounded-[14px] border border-[#D8E3E9] bg-white p-5"><h3 className="text-sm font-bold text-[#17324D]">Skills & Proficiency</h3>
              {passport.skills.map((item,index)=><p key={String(item.id??index)} className="mt-2 text-xs text-[#526675]">{String(item.skill_name??item.skill_id)} · {String(item.proficiency)} · {String(item.experience_months)} months{item.verified?' · Verified':''}</p>)}
              <div className="mt-3 grid gap-2"><select value={skillForm.skill_id} onChange={e=>setSkillForm(v=>({...v,skill_id:e.target.value}))} className="h-9 rounded-lg border border-[#D8E3E9] px-2 text-xs"><option value="">Pilih skill registry</option>{skillRegistry.map(skill=><option key={String(skill.id)} value={String(skill.id)}>{String(skill.name)} · {String(skill.category)}</option>)}</select><select value={skillForm.proficiency} onChange={e=>setSkillForm(v=>({...v,proficiency:e.target.value}))} className="h-9 rounded-lg border border-[#D8E3E9] px-2 text-xs">{['beginner','intermediate','advanced','expert'].map(x=><option key={x}>{x}</option>)}</select><input type="number" min="0" max="960" value={skillForm.experience_months} onChange={e=>setSkillForm(v=>({...v,experience_months:e.target.value}))} className="h-9 rounded-lg border border-[#D8E3E9] px-2 text-xs" placeholder="Experience months"/><input value={skillForm.evidence_reference} onChange={e=>setSkillForm(v=>({...v,evidence_reference:e.target.value}))} className="h-9 rounded-lg border border-[#D8E3E9] px-2 text-xs" placeholder="Evidence reference (optional)"/><button type="button" disabled={busy||!skillForm.skill_id} onClick={()=>void submitSkill()} className="h-9 rounded-lg bg-[#0284C7] text-xs font-semibold text-white disabled:opacity-40">Submit Skill</button></div>
            </section>
            <section className="rounded-[14px] border border-[#D8E3E9] bg-white p-5"><h3 className="text-sm font-bold text-[#17324D]">Certification & Renewal</h3>
              {passport.certifications.map((item,index)=><p key={String(item.id??index)} className="mt-2 text-xs text-[#526675]">{String(item.name)} · {String(item.issuer)} · {String(item.verification_status)} · Expires {String(item.expires_at??'—')}</p>)}
              <div className="mt-3 grid gap-2"><input value={certForm.name} onChange={e=>setCertForm(v=>({...v,name:e.target.value}))} placeholder="Certification name" className="h-9 rounded-lg border border-[#D8E3E9] px-2 text-xs"/><input value={certForm.issuer} onChange={e=>setCertForm(v=>({...v,issuer:e.target.value}))} placeholder="Issuer" className="h-9 rounded-lg border border-[#D8E3E9] px-2 text-xs"/><input value={certForm.certificate_reference} onChange={e=>setCertForm(v=>({...v,certificate_reference:e.target.value}))} placeholder="Certificate reference" className="h-9 rounded-lg border border-[#D8E3E9] px-2 text-xs"/><input type="date" value={certForm.valid_from} onChange={e=>setCertForm(v=>({...v,valid_from:e.target.value}))} className="h-9 rounded-lg border border-[#D8E3E9] px-2 text-xs"/><input type="date" value={certForm.expires_at} onChange={e=>setCertForm(v=>({...v,expires_at:e.target.value}))} className="h-9 rounded-lg border border-[#D8E3E9] px-2 text-xs"/><button type="button" disabled={busy||!certForm.name||!certForm.issuer||!certForm.valid_from} onClick={()=>void submitCertification()} className="h-9 rounded-lg bg-[#0284C7] text-xs font-semibold text-white disabled:opacity-40">Submit Certification</button><select value={renewalOf} onChange={e=>setRenewalOf(e.target.value)} className="h-9 rounded-lg border border-[#D8E3E9] px-2 text-xs"><option value="">Select certificate to renew</option>{passport.certifications.map(item=><option key={String(item.id)} value={String(item.id)}>{String(item.name)} · {String(item.certificate_reference??item.id)}</option>)}</select><button type="button" disabled={busy||!renewalOf||!certForm.certificate_reference||!certForm.valid_from} onClick={()=>void renewCertification()} className="h-9 rounded-lg border border-[#0284C7] text-xs font-semibold text-[#0284C7] disabled:opacity-40">Renew Selected Certificate</button></div>
            </section>
          </div>
          <section className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-2"><h3 className="text-sm font-bold text-[#17324D]">Engagement Classification</h3>{passport.engagements.length===0?<p className="mt-2 text-xs text-[#718391]">Belum ada agreement classification yang ditetapkan Corporate.</p>:<div className="mt-3 space-y-2">{passport.engagements.map((item,index)=><div key={String(item.id??index)} className="flex flex-wrap justify-between gap-2 border-b border-[#EAF2F6] pb-2 text-xs"><span className="font-semibold text-[#17324D]">{String(item.classification)}</span><span className="text-[#526675]">{String(item.agreement_reference)} · {String(item.status)}</span></div>)}</div>}</section>
        </div>}
        {tab==='training'&&<div className="space-y-3">
          <section className="rounded-[14px] border border-[#D8E3E9] bg-white p-4"><h3 className="text-sm font-bold text-[#17324D]">Training Catalogue</h3>{courses.length===0?<p className="mt-2 text-xs text-[#718391]">Tidak ada course yang dipublikasikan.</p>:courses.map(course=><div key={course.id} className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#EAF2F6] pt-3"><div><p className="text-xs font-semibold text-[#17324D]">{course.title}</p><p className="mt-1 text-[11px] text-[#718391]">{course.description||course.course_key}</p></div><button type="button" disabled={busy} onClick={()=>void enroll(course.id)} className="h-9 rounded-lg bg-[#0284C7] px-3 text-xs font-semibold text-white disabled:opacity-50">Enroll</button></div>)}</section>
          <section className="rounded-[14px] border border-[#D8E3E9] bg-white p-4"><h3 className="text-sm font-bold text-[#17324D]">My Training Progress</h3>{passport.training.length===0?<p className="mt-2 text-xs text-[#718391]">Belum ada enrollment.</p>:passport.training.map((item,index)=><div key={String(item.id??index)} className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#EAF2F6] pt-3"><div><p className="text-xs font-semibold text-[#17324D]">{String(item.course_id)}</p><p className="mt-1 text-[11px] text-[#718391]">{String(item.status)} · {String(item.progress_percent)}%</p></div>{item.status!=='completed'&&<div className="flex items-center gap-2"><input aria-label="Assessment score" type="number" min="0" max="100" value={assessmentScore} onChange={e=>setAssessmentScore(e.target.value)} className="h-9 w-16 rounded-lg border border-[#D8E3E9] px-2 text-xs"/><button type="button" disabled={busy||assessmentScore.trim()===''||Number(assessmentScore)<0||Number(assessmentScore)>100} onClick={()=>void saveProgress(String(item.id))} className="h-9 rounded-lg border border-[#0284C7] px-3 text-xs font-semibold text-[#0284C7]">Complete</button></div>}</div>)}</section>
        </div>}
        {tab==='availability'&&<div className="space-y-3"><section className="rounded-[14px] border border-[#D8E3E9] bg-white p-4"><h3 className="text-sm font-bold text-[#17324D]">Tambah Availability / Leave</h3><div className="mt-3 grid gap-3 sm:grid-cols-2"><select value={availability.type} onChange={e=>setAvailability(v=>({...v,type:e.target.value}))} className="h-10 rounded-lg border border-[#D8E3E9] px-3 text-xs"><option value="leave">Leave</option><option value="unavailable">Unavailable</option><option value="working_hours">Working Hours</option><option value="preferred_shift">Preferred Shift</option></select><input type="datetime-local" value={availability.starts_at} onChange={e=>setAvailability(v=>({...v,starts_at:e.target.value}))} className="h-10 rounded-lg border border-[#D8E3E9] px-3 text-xs"/><input type="datetime-local" value={availability.ends_at} onChange={e=>setAvailability(v=>({...v,ends_at:e.target.value}))} className="h-10 rounded-lg border border-[#D8E3E9] px-3 text-xs"/><input value={availability.reason} onChange={e=>setAvailability(v=>({...v,reason:e.target.value}))} placeholder="Alasan (opsional)" className="h-10 rounded-lg border border-[#D8E3E9] px-3 text-xs"/></div><button type="button" disabled={busy||!availability.starts_at||!availability.ends_at} onClick={()=>void saveAvailability()} className="mt-3 h-9 rounded-lg bg-[#0284C7] px-4 text-xs font-semibold text-white disabled:opacity-50">Simpan Availability</button></section><section className="rounded-[14px] border border-[#D8E3E9] bg-white p-4"><h3 className="text-sm font-bold text-[#17324D]">Availability Calendar</h3>{passport.availability.length===0?<p className="mt-2 text-xs text-[#718391]">Belum ada periode availability.</p>:passport.availability.map((item,index)=><p key={String(item.id??index)} className="mt-2 border-b border-[#EAF2F6] pb-2 text-xs text-[#526675]">{String(item.availability_type)} · {new Date(String(item.starts_at)).toLocaleString('id-ID')} – {new Date(String(item.ends_at)).toLocaleString('id-ID')}</p>)}</section></div>}
        {tab==='onboarding'&&<section className="rounded-[14px] border border-[#D8E3E9] bg-white p-4"><h3 className="text-sm font-bold text-[#17324D]">Onboarding Checklist</h3><label className="mt-3 block text-xs text-[#526675]">Alasan penyelesaian task<input value={taskReason} onChange={e=>setTaskReason(e.target.value)} placeholder="Masukkan alasan" className="mt-1 h-10 w-full rounded-lg border border-[#D8E3E9] px-3 text-xs"/></label>{passport.onboarding.length===0?<p className="mt-2 text-xs text-[#718391]">Checklist belum diterbitkan oleh administrator.</p>:passport.onboarding.map((item,index)=><div key={String(item.id??index)} className="mt-3 flex flex-wrap items-center justify-between gap-3 border-b border-[#EAF2F6] pb-3"><div><p className="text-xs font-semibold text-[#17324D]">{String(item.title)}</p><p className="mt-1 text-[11px] text-[#718391]">{String(item.task_type)} · {String(item.status)}{item.required?' · Required':''}</p></div>{item.status!=='completed'&&item.status!=='waived'&&<button type="button" disabled={busy||taskReason.trim().length<3} onClick={()=>void completeTask(String(item.id))} className="h-9 rounded-lg border border-[#0284C7] px-3 text-xs font-semibold text-[#0284C7]">Tandai selesai</button>}</div>)}</section>}
        {tab==='history'&&<section className="rounded-[14px] border border-[#D8E3E9] bg-white p-4"><h3 className="text-sm font-bold text-[#17324D]">Lifecycle & Activity History</h3>{passport.history.length===0?<p className="mt-2 text-xs text-[#718391]">Belum ada event lifecycle.</p>:passport.history.map((item,index)=><div key={String(item.id??index)} className="mt-3 border-b border-[#EAF2F6] pb-3"><p className="text-xs font-semibold text-[#17324D]">{String(item.from_status??'—')} → {String(item.to_status)}</p><p className="mt-1 text-[11px] text-[#718391]">{String(item.reason)} · {new Date(String(item.occurred_at)).toLocaleString('id-ID')}</p></div>)}</section>}
      </>}
  </div>;
}
