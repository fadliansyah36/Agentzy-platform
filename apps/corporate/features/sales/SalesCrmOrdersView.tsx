'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, RefreshCw, Plus, SearchCheck, ShoppingCart, Activity } from 'lucide-react';
import {
  ApiError, getSalesDashboard, listSalesLeads, listSalesProviders, listSalesCatalogue,
  listSalesOrders, createSalesLead, captureSalesConsent, checkSalesCoverage, transitionSalesLead,
  listSalesWorkforceOptions, assignSalesLead, type SalesWorkforceOption,
  listSalesLeadActivities, listSalesConsents, revokeSalesConsent, updateSalesLead, updateSalesCustomer, listSalesOrderEvents, listSalesOrderAttempts,
  getSalesReconciliation, listUnmatchedProviderWebhooks, getSalesOrderAttributions, correctSalesOrderAttribution, type SalesOrderAttribution,
  createSalesOffer, createSalesOrder, transitionSalesOrder, type SalesLead,
  type SalesProvider, type SalesProduct, type SalesOrder, type SalesDashboard,
} from '@/apps/web/lib/api-client';

export function SalesCrmOrdersView({tenantId,accessToken,onBack}:{tenantId:string;accessToken:string;onBack:()=>void}) {
  const [dashboard,setDashboard]=useState<SalesDashboard|null>(null);
  const [leads,setLeads]=useState<SalesLead[]>([]);
  const [providers,setProviders]=useState<SalesProvider[]>([]);
  const [products,setProducts]=useState<SalesProduct[]>([]);
  const [orders,setOrders]=useState<SalesOrder[]>([]);
  const [workforce,setWorkforce]=useState<SalesWorkforceOption[]>([]);
  const [activities,setActivities]=useState<Array<{id:string;activity_type:string;from_stage:string|null;to_stage:string|null;note:string|null;source:string;created_at:string}>>([]);
  const [consents,setConsents]=useState<Array<{id:string;consent_type:string;purpose:string;policy_version:string;granted:boolean;source:string;captured_at:string;revoked_at:string|null;revoked_reason:string|null}>>([]);
  const [consentReason,setConsentReason]=useState('Customer requested revocation.');
  const [reconciliation,setReconciliation]=useState<Record<string,unknown>[]>([]);
  const [unmatchedWebhooks,setUnmatchedWebhooks]=useState<Array<{id:string;external_event_id:string;event_type:string;payload_hash:string;processing_status:string;error_code:string|null;event_timestamp:string;received_at:string;provider_code:string;provider_name:string}>>([]);
  const [selectedOrder,setSelectedOrder]=useState('');
  const [orderEvents,setOrderEvents]=useState<Record<string,unknown>[]>([]);
  const [orderAttempts,setOrderAttempts]=useState<Array<{attempt_number:number;status:string;request_hash:string;response_hash:string|null;provider_reference:string|null;error_code:string|null;duration_ms:number|null;created_at:string}>>([]);
  const [orderAttributions,setOrderAttributions]=useState<SalesOrderAttribution[]>([]);
  const [correctionWorkerId,setCorrectionWorkerId]=useState('');
  const [correctionReason,setCorrectionReason]=useState('Correct lead assignment before provider submission.');
  const [customerFormState,setCustomerFormState]=useState<{leadId:string;value:{customer_name:string;contact_name:string;email:string;phone:string;service_address:string;region_code:string}}|null>(null);
  const [followUpState,setFollowUpState]=useState<{leadId:string;value:string}|null>(null);
  const [leadNoteState,setLeadNoteState]=useState<{leadId:string;value:string}|null>(null);
  const [qualificationState,setQualificationState]=useState<{leadId:string;value:string}|null>(null);
  const [selectedWorker,setSelectedWorker]=useState('');
  const [selectedLead,setSelectedLead]=useState<string>('');
  const [selectedProduct,setSelectedProduct]=useState<string>('');
  const [nextStage,setNextStage]=useState('contacted');
  const [stageReason,setStageReason]=useState('Follow-up dilakukan oleh sales operator.');
  const [coverageConsent,setCoverageConsent]=useState(false);
  const [orderConsent,setOrderConsent]=useState(false);
  const [coverageId,setCoverageId]=useState<string|null>(null);
  const [offerId,setOfferId]=useState<string|null>(null);
  const [coverageResult,setCoverageResult]=useState<string|null>(null);
  const [coverageMeta,setCoverageMeta]=useState<{source:string;checked_at:string;error_code:string|null}|null>(null);
  const [leadForm,setLeadForm]=useState({customer_name:'',contact_name:'',email:'',phone:'',service_address:'',region_code:'',source:'corporate_portal'});
  const [creating,setCreating]=useState(false);
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const [notice,setNotice]=useState<string|null>(null);

  const load=useCallback(async()=>{
    if(!accessToken||!tenantId){setLoading(false);setError('Sesi atau tenant tidak tersedia.');return;}
    setLoading(true);setError(null);
    try {
      const [d,l,p,c,o,w,r,u,a,cs]=await Promise.all([
        getSalesDashboard(accessToken,tenantId),listSalesLeads(accessToken,tenantId),
        listSalesProviders(accessToken,tenantId),listSalesCatalogue(accessToken,tenantId),
        listSalesOrders(accessToken,tenantId),listSalesWorkforceOptions(accessToken,tenantId),
        getSalesReconciliation(accessToken,tenantId),listUnmatchedProviderWebhooks(accessToken,tenantId),
        selectedLead?listSalesLeadActivities(accessToken,tenantId,selectedLead):Promise.resolve({data:[]}),
        selectedLead?listSalesConsents(accessToken,tenantId,selectedLead):Promise.resolve({data:[]}),
      ]);
      setDashboard(d.data);setLeads(l.data);setProviders(p.data);setProducts(c.data);setOrders(o.data);setWorkforce(w.data);
      setReconciliation(r.data);setUnmatchedWebhooks(u.data);setActivities(a.data);setConsents(cs.data);
      if(!selectedLead&&l.data.length)setSelectedLead(l.data[0].id);
    } catch(e) {
      setError(e instanceof ApiError?e.message:'Data Sales CRM tidak dapat dimuat dari Agentzy API.');
    } finally {setLoading(false);}
  },[accessToken,tenantId,selectedLead]);
  useEffect(()=>{void Promise.resolve().then(()=>load());},[load]);

  const activeLead=leads.find(item=>item.id===selectedLead)??null;
  const selectedProductRow=products.find(item=>item.id===selectedProduct)??null;
  const defaultCustomerForm={customer_name:activeLead?.customer_name??'',contact_name:activeLead?.contact_name??'',email:activeLead?.email??'',phone:activeLead?.phone??'',service_address:activeLead?.service_address??'',region_code:activeLead?.region_code??''};
  const customerForm=customerFormState&&activeLead&&customerFormState.leadId===activeLead.id?customerFormState.value:defaultCustomerForm;
  const setCustomerForm=(next:typeof defaultCustomerForm|((previous:typeof defaultCustomerForm)=>typeof defaultCustomerForm))=>{if(!activeLead)return;setCustomerFormState(current=>({leadId:activeLead.id,value:typeof next==='function'?next(current?.leadId===activeLead.id?current.value:defaultCustomerForm):next}));};
  const defaultFollowUpAt=activeLead?.follow_up_at?new Date(activeLead.follow_up_at).toISOString().slice(0,16):'';
  const followUpAt=followUpState&&activeLead&&followUpState.leadId===activeLead.id?followUpState.value:defaultFollowUpAt;
  const setFollowUpAt=(value:string)=>{if(activeLead)setFollowUpState({leadId:activeLead.id,value});};
  const leadNote=leadNoteState&&activeLead&&leadNoteState.leadId===activeLead.id?leadNoteState.value:'';
  const setLeadNote=(value:string)=>{if(activeLead)setLeadNoteState({leadId:activeLead.id,value});};
  const defaultQualificationJson=JSON.stringify(activeLead?.qualification??{},null,2);
  const qualificationJson=qualificationState&&activeLead&&qualificationState.leadId===activeLead.id?qualificationState.value:defaultQualificationJson;
  const setQualificationJson=(value:string)=>{if(activeLead)setQualificationState({leadId:activeLead.id,value});};
  const assignLead=async()=>{if(!activeLead||!selectedWorker)return;setBusy(true);setError(null);try{await assignSalesLead(accessToken,activeLead.id,{tenant_id:tenantId,workforce_profile_id:selectedWorker,reason:'Lead assigned through Corporate Sales Portal.'});setNotice('Lead berhasil di-assign ke workforce Phase 04.');await load();}catch(e){setError(e instanceof ApiError?e.message:'Assignment gagal.');}finally{setBusy(false);}};
  const advanceLead=async()=>{if(!activeLead)return;setBusy(true);setError(null);try{await transitionSalesLead(accessToken,activeLead.id,tenantId,nextStage,stageReason);setNotice('Lead stage diperbarui melalui FastAPI.');await load();}catch(e){setError(e instanceof ApiError?e.message:'Lead stage gagal diperbarui.');}finally{setBusy(false);}};
  const saveLeadDetails=async()=>{if(!activeLead)return;setBusy(true);setError(null);try{await updateSalesLead(accessToken,activeLead.id,{tenant_id:tenantId,follow_up_at:followUpAt?new Date(followUpAt).toISOString():null,note:leadNote||null,qualification:JSON.parse(qualificationJson)});setLeadNote('');setNotice('Follow-up dan catatan tersimpan pada activity timeline.');await load();}catch(e){setError(e instanceof ApiError?e.message:'Lead details gagal diperbarui.');}finally{setBusy(false);}};
  const saveCustomer=async()=>{if(!activeLead)return;setBusy(true);setError(null);try{await updateSalesCustomer(accessToken,activeLead.customer_id,{tenant_id:tenantId,...customerForm,email:customerForm.email||null,phone:customerForm.phone||null,service_address:customerForm.service_address||null,region_code:customerForm.region_code||null});setNotice('Customer profile diperbarui melalui FastAPI.');await load();}catch(e){setError(e instanceof ApiError?e.message:'Customer profile gagal diperbarui.');}finally{setBusy(false);}};
  const revokeConsent=async(consentId:string)=>{if(!activeLead)return;setBusy(true);setError(null);try{await revokeSalesConsent(accessToken,tenantId,consentId,consentReason);setNotice('Consent dicabut dan tercatat pada audit log.');await load();}catch(e){setError(e instanceof ApiError?e.message:'Consent tidak dapat dicabut.');}finally{setBusy(false);}};
  const viewOrderHistory=async(orderId:string)=>{setSelectedOrder(orderId);setError(null);try{const [events,attempts,attributions]=await Promise.all([listSalesOrderEvents(accessToken,tenantId,orderId),listSalesOrderAttempts(accessToken,tenantId,orderId),getSalesOrderAttributions(accessToken,tenantId,orderId)]);setOrderEvents(events.data);setOrderAttempts(attempts.data);setOrderAttributions(attributions.data);}catch(e){setError(e instanceof ApiError?e.message:'Order history tidak dapat dimuat.');}};
  const correctAttribution=async()=>{if(!selectedOrder||!correctionWorkerId)return;setBusy(true);setError(null);try{await correctSalesOrderAttribution(accessToken,selectedOrder,{tenant_id:tenantId,attributed_worker_id:correctionWorkerId,reason:correctionReason});setNotice('Order attribution diperbarui dan audit tercatat.');setCorrectionWorkerId('');await viewOrderHistory(selectedOrder);}catch(e){setError(e instanceof ApiError?e.message:'Attribution tidak dapat dikoreksi.');}finally{setBusy(false);}};
  const cancelOrder=async(orderId:string)=>{setBusy(true);setError(null);try{await transitionSalesOrder(accessToken,orderId,{tenant_id:tenantId,to_status:'cancelled',reason:'Cancelled by authorized corporate sales operator',evidence:{source:'corporate_portal'}});setNotice('Order internal dibatalkan. Jika provider sudah menerima order, pembatalan eksternal memerlukan cancellation contract resmi.');await load();}catch(e){setError(e instanceof ApiError?e.message:'Order tidak dapat dibatalkan.');}finally{setBusy(false);}};
  const createLead=async(event:FormEvent)=>{
    event.preventDefault();setCreating(true);setError(null);setNotice(null);
    try {
      const result=await createSalesLead(accessToken,{tenant_id:tenantId,...leadForm,email:leadForm.email||null,phone:leadForm.phone||null,service_address:leadForm.service_address||null,region_code:leadForm.region_code||null});
      setSelectedLead(result.data.id);setLeadForm({customer_name:'',contact_name:'',email:'',phone:'',service_address:'',region_code:'',source:'corporate_portal'});
      setNotice('Lead tersimpan pada database Agentzy.');await load();
    } catch(e){setError(e instanceof ApiError?e.message:'Lead gagal disimpan.');}
    finally{setCreating(false);}
  };
  const captureConsent=async(type:'coverage_check'|'order_submission')=>{
    if(!activeLead)return;
    setBusy(true);setError(null);
    try {
      const result=await captureSalesConsent(accessToken,activeLead.id,{
        tenant_id:tenantId,consent_type:type,
        purpose:type==='coverage_check'?'provider_coverage_validation':'submit_provider_order',
        policy_version:type==='coverage_check'?'sales-coverage-v1':'sales-order-v1',
        granted:true,source:'corporate_portal',
        evidence:{capture_method:'manual_operator_attestation',operator_attested:true,confirmation_channel:'manual'},
      });
      if(type==='coverage_check')setCoverageConsent(true);else setOrderConsent(true);
      if(type==='order_submission')setOfferId(offerId);
      setNotice('Persetujuan pelanggan tercatat dengan policy version dan timestamp.');
      if(type==='coverage_check')setCoverageId(result.data.id);
      else setOrderConsent(true);
    } catch(e){setError(e instanceof ApiError?e.message:'Consent tidak dapat disimpan.');}
    finally{setBusy(false);}
  };
  const runCoverage=async()=>{
    if(!activeLead||!selectedProductRow||!coverageId)return;
    setBusy(true);setError(null);setCoverageResult(null);
    try {
      const result=await checkSalesCoverage(accessToken,activeLead.id,{
        tenant_id:tenantId,product_id:selectedProductRow.id,consent_id:coverageId,
        request_reference:globalThis.crypto?.randomUUID?.()??String(Date.now()),
      });
      setCoverageResult(result.data.result_status);
      setCoverageMeta({source:result.data.source,checked_at:result.data.checked_at,error_code:result.data.error_code});
      if(result.data.result_status==='available'){
        const offer=await createSalesOffer(accessToken,activeLead.id,{
          tenant_id:tenantId,product_id:selectedProductRow.id,coverage_check_id:result.data.id,
        });
        setOfferId(offer.data.id);setNotice('Coverage tersedia dari sumber provider. Offer berhasil dibuat.');
      } else {
        setNotice('Coverage belum dapat dipastikan: '+result.data.result_status+' ('+(result.data.error_code??result.data.source)+'). Tidak ada hasil coverage sintetis.');
      }
      await load();
    } catch(e){setError(e instanceof ApiError?e.message:'Coverage check gagal.');}
    finally{setBusy(false);}
  };
  const submitOrder=async()=>{
    if(!activeLead||!offerId||!orderConsent)return;
    setBusy(true);setError(null);
    try {
      const order=await createSalesOrder(accessToken,{
        tenant_id:tenantId,lead_id:activeLead.id,consent_id:orderConsentIdRef.current,offer_id:offerId,
      });
      await transitionSalesOrder(accessToken,order.data.id,{
        tenant_id:tenantId,to_status:'submitted',reason:'Submission authorized by sales operator',
        evidence:{source:'corporate_portal',lead_id:activeLead.id},
      });
      setNotice('Order internal dibuat dan masuk antrean submission provider. Status provider belum dianggap berhasil sampai ada response terverifikasi.');
      setCoverageId(null);setOfferId(null);setCoverageResult(null);setCoverageMeta(null);setCoverageConsent(false);setOrderConsent(false);
      await load();
    } catch(e){setError(e instanceof ApiError?e.message:'Order tidak dapat dibuat atau dikirim.');}
    finally{setBusy(false);}
  };
  const [orderConsentId,setOrderConsentId]=useState<string|null>(null);
  const orderConsentIdRef={current:orderConsentId};
  const captureOrderConsent=async()=>{
    if(!activeLead)return;
    setBusy(true);setError(null);
    try {
      const result=await captureSalesConsent(accessToken,activeLead.id,{
        tenant_id:tenantId,consent_type:'order_submission',purpose:'submit_provider_order',
        policy_version:'sales-order-v1',granted:true,source:'corporate_portal',
        evidence:{capture_method:'explicit_operator_confirmation',customer_confirmation_recorded:true},
      });
      setOrderConsentId(result.data.id);setOrderConsent(true);setNotice('Consent pengiriman order tercatat.');
    } catch(e){setError(e instanceof ApiError?e.message:'Consent order gagal dicatat.');}
    finally{setBusy(false);}
  };

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><button onClick={onBack} className="mb-2 inline-flex items-center gap-2 text-xs font-semibold text-[#0284C7]"><ArrowLeft className="h-4 w-4"/>Kembali</button>
        <h1 className="text-xl font-bold text-[#17324D]">Sales CRM & Order Management</h1>
        <p className="text-sm text-[#526675]">Lead lifecycle, customer consent, provider catalogue, coverage, order submission dan reconciliation</p>
      </div>
      <button onClick={()=>void load()} className="inline-flex items-center gap-2 rounded-lg border border-[#D8E3E9] bg-white px-3 py-2 text-sm font-semibold text-[#17324D]"><RefreshCw className="h-4 w-4"/>Refresh API</button>
    </div>
    {error&&<div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {notice&&<div className="rounded-lg border border-[#B9DCEB] bg-[#F1F8FB] p-3 text-sm text-[#245477]">{notice}</div>}
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[
        ['Total Lead',dashboard?.leads.total_leads??'—'],
        ['Qualified',dashboard?.leads.qualified??'—'],
        ['Order Submitted',dashboard?.leads.orders_submitted??'—'],
        ['Activated',dashboard?.orders.activated??'—'],
      ].map(([label,value])=><div key={label} className="rounded-xl border border-[#D8E3E9] bg-white p-4"><p className="text-xs text-[#526675]">{label}</p><p className="mt-1 text-2xl font-bold text-[#17324D]">{value}</p></div>)}
    </div>
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="rounded-xl border border-[#D8E3E9] bg-white p-5">
        <h2 className="mb-3 text-base font-bold text-[#17324D]">Tambah Lead</h2>
        <form onSubmit={createLead} className="grid gap-3 sm:grid-cols-2">
          {([
            ['customer_name','Nama perusahaan/pelanggan'],['contact_name','Nama kontak'],['email','Email'],['phone','Telepon'],['service_address','Alamat layanan'],['region_code','Kode wilayah'],
          ] as const).map(([key,label])=><label key={key} className="text-xs font-semibold text-[#526675]">{label}
            <input required={key==='customer_name'||key==='contact_name'} value={leadForm[key]} onChange={e=>setLeadForm(p=>({...p,[key]:e.target.value}))} className="mt-1 w-full rounded-lg border border-[#D8E3E9] px-3 py-2 text-sm font-normal text-[#17324D]"/>
          </label>)}
          <button disabled={creating} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1769C2] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-2"><Plus className="h-4 w-4"/>{creating?'Menyimpan…':'Simpan Lead ke Backend'}</button>
        </form>
      </section>
      <section className="rounded-xl border border-[#D8E3E9] bg-white p-5">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-base font-bold text-[#17324D]">Lead Pipeline</h2><span className="text-xs text-[#526675]">{leads.length} record</span></div>
        {loading?<p className="text-sm text-[#526675]">Memuat data…</p>:leads.length===0?<p className="text-sm text-[#718391]">Belum ada lead pada tenant ini.</p>:<div className="max-h-80 space-y-2 overflow-auto">
          {leads.map(lead=><button key={lead.id} onClick={()=>{setSelectedLead(lead.id);setCoverageId(null);setOfferId(null);setCoverageResult(null);setCoverageConsent(false);setOrderConsent(false);setOrderConsentId(null);}} className={'w-full rounded-lg border p-3 text-left '+(selectedLead===lead.id?'border-[#1769C2] bg-[#F1F8FB]':'border-[#EAF2F6]')}>
            <div className="flex items-center justify-between gap-2"><span className="font-semibold text-[#17324D]">{lead.customer_name}</span><span className="rounded-full bg-[#E6F4F9] px-2 py-1 text-[10px] font-semibold text-[#245477]">{lead.stage}</span></div>
            <p className="mt-1 text-xs text-[#526675]">{lead.contact_name} · {lead.email??lead.phone??'Kontak belum tersedia'} · {lead.source}</p>
          </button>)}
        </div>}
      </section>
    </div>
    {activeLead&&<section className="rounded-xl border border-[#D8E3E9] bg-white p-5">
      <h2 className="text-base font-bold text-[#17324D]">Workflow pelanggan: {activeLead.customer_name}</h2>
      <p className="mb-4 text-xs text-[#526675]">Provider aktif: {providers.filter(p=>p.status==='active').length} · Produk aktif: {products.length}</p>
      <div className="mb-4 flex flex-wrap items-end gap-2 rounded-lg bg-[#F5F8FA] p-3"><label className="text-xs font-semibold text-[#526675]">Assign workforce<select value={selectedWorker} onChange={e=>setSelectedWorker(e.target.value)} className="mt-1 block rounded-lg border border-[#D8E3E9] bg-white px-3 py-2 text-sm"><option value="">Pilih workforce eligible</option>{workforce.map(w=><option key={w.id} value={w.id}>{w.display_name} · {w.job_title??w.worker_code}</option>)}</select></label><button disabled={busy||!selectedWorker} onClick={()=>void assignLead()} className="rounded-lg border border-[#B9DCEB] bg-white px-3 py-2 text-xs font-semibold text-[#245477] disabled:opacity-50">Assign Lead</button><label className="text-xs font-semibold text-[#526675]">Lead stage<select value={nextStage} onChange={e=>setNextStage(e.target.value)} className="mt-1 block rounded-lg border border-[#D8E3E9] bg-white px-3 py-2 text-sm"><option value="contacted">Contacted</option><option value="qualified">Qualified</option><option value="disqualified">Disqualified</option><option value="closed">Closed</option></select></label><label className="min-w-[220px] flex-1 text-xs font-semibold text-[#526675]">Reason<input value={stageReason} onChange={e=>setStageReason(e.target.value)} className="mt-1 w-full rounded-lg border border-[#D8E3E9] bg-white px-3 py-2 text-sm"/></label><button disabled={busy} onClick={()=>void advanceLead()} className="rounded-lg border border-[#B9DCEB] bg-white px-3 py-2 text-xs font-semibold text-[#245477] disabled:opacity-50">Update Pipeline</button></div>
      <div className="mb-4 grid gap-4 xl:grid-cols-2">
        <div className="rounded-lg border border-[#EAF2F6] p-4"><h3 className="mb-3 font-semibold text-[#17324D]">Customer Profile</h3><div className="grid gap-2 sm:grid-cols-2">
          {([['customer_name','Nama pelanggan'],['contact_name','Kontak'],['email','Email'],['phone','Telepon'],['service_address','Alamat layanan'],['region_code','Kode wilayah']] as const).map(([key,label])=><label key={key} className="text-xs font-semibold text-[#526675]">{label}<input value={customerForm[key]} onChange={e=>setCustomerForm(v=>({...v,[key]:e.target.value}))} className="mt-1 w-full rounded-lg border border-[#D8E3E9] px-3 py-2 text-sm font-normal"/></label>)}
        </div><button disabled={busy} onClick={()=>void saveCustomer()} className="mt-3 rounded-lg border border-[#B9DCEB] px-3 py-2 text-xs font-semibold text-[#245477] disabled:opacity-50">Simpan Customer Profile</button></div>
        <div className="rounded-lg border border-[#EAF2F6] p-4"><h3 className="mb-3 font-semibold text-[#17324D]">Follow-up & Notes</h3><label className="block text-xs font-semibold text-[#526675]">Follow-up date/time<input type="datetime-local" value={followUpAt} onChange={e=>setFollowUpAt(e.target.value)} className="mt-1 w-full rounded-lg border border-[#D8E3E9] px-3 py-2 text-sm font-normal"/></label><label className="mt-2 block text-xs font-semibold text-[#526675]">Qualification JSON<textarea value={qualificationJson} onChange={e=>setQualificationJson(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-[#D8E3E9] px-3 py-2 font-mono text-xs font-normal"/></label><label className="mt-2 block text-xs font-semibold text-[#526675]">Activity note<textarea value={leadNote} onChange={e=>setLeadNote(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-[#D8E3E9] px-3 py-2 text-sm font-normal" placeholder="Catatan hasil komunikasi/follow-up"/></label><button disabled={busy} onClick={()=>void saveLeadDetails()} className="mt-3 rounded-lg bg-[#1769C2] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Simpan Follow-up & Note</button>
          <div className="mt-3 border-t border-[#EAF2F6] pt-3"><h4 className="mb-2 text-xs font-bold text-[#17324D]">Activity Timeline</h4>{activities.length===0?<p className="text-xs text-[#718391]">Belum ada aktivitas.</p>:<div className="max-h-40 space-y-2 overflow-auto">{activities.map(a=><div key={a.id} className="border-l-2 border-[#B9DCEB] pl-3 text-xs"><p className="font-semibold text-[#245477]">{a.activity_type} {a.from_stage&&a.to_stage?'· '+a.from_stage+' → '+a.to_stage:''}</p>{a.note&&<p className="text-[#526675]">{a.note}</p>}<p className="text-[10px] text-[#718391]">{new Date(a.created_at).toLocaleString('id-ID')}</p></div>)}</div>}</div>
          <div className="mt-3 border-t border-[#EAF2F6] pt-3"><h4 className="mb-2 text-xs font-bold text-[#17324D]">Consent History</h4><label className="mb-2 block text-[10px] text-[#526675]">Revocation reason<input value={consentReason} onChange={e=>setConsentReason(e.target.value)} className="mt-1 w-full rounded border border-[#D8E3E9] px-2 py-1 text-xs"/></label>{consents.length===0?<p className="text-xs text-[#718391]">Belum ada consent.</p>:consents.map(c=><div key={c.id} className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs"><span className="text-[#526675]">{c.purpose} · {c.policy_version} · {c.granted?'granted':'denied'} · {c.revoked_at?'revoked':'active'}</span>{c.granted&&!c.revoked_at&&<button disabled={busy} onClick={()=>void revokeConsent(c.id)} className="font-semibold text-red-600 disabled:opacity-50">Revoke</button>}</div>)}</div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-[#F5F8FA] p-4"><h3 className="font-semibold text-[#17324D]">1. Consent & Coverage</h3>
          <label className="mt-3 flex items-start gap-2 text-xs text-[#526675]"><input type="checkbox" checked={coverageConsent} onChange={e=>setCoverageConsent(e.target.checked)}/>Konfirmasi operator: persetujuan pelanggan telah diterima untuk validasi coverage provider.</label>
          <button disabled={!coverageConsent||busy} onClick={()=>void captureConsent('coverage_check')} className="mt-3 w-full rounded-lg border border-[#B9DCEB] bg-white px-3 py-2 text-xs font-semibold text-[#245477] disabled:opacity-50">Catat Consent Coverage</button>
          <select value={selectedProduct} onChange={e=>setSelectedProduct(e.target.value)} className="mt-3 w-full rounded-lg border border-[#D8E3E9] bg-white px-3 py-2 text-xs text-[#17324D]"><option value="">Pilih produk/provider</option>{products.map(p=><option key={p.id} value={p.id}>{p.provider_name} · {p.name}</option>)}</select>
          <button disabled={!coverageId||!selectedProduct||busy} onClick={()=>void runCoverage()} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1769C2] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><SearchCheck className="h-4 w-4"/>Validasi Coverage</button>
          {coverageResult&&<div className="mt-2 rounded border border-[#D8E3E9] bg-white p-2 text-xs text-[#245477]"><p className="font-semibold">Result: {coverageResult}</p>{coverageMeta&&<p>Source: {coverageMeta.source} · Checked: {new Date(coverageMeta.checked_at).toLocaleString('id-ID')} · {coverageMeta.error_code??'No provider error'}</p>}</div>}
        </div>
        <div className="rounded-lg bg-[#F5F8FA] p-4"><h3 className="font-semibold text-[#17324D]">2. Offer & Order Consent</h3>
          <p className="mt-2 text-xs text-[#526675]">{selectedProductRow?selectedProductRow.name:'Pilih produk untuk melihat offer.'}</p>
          <p className="mt-2 text-xs text-[#526675]">{offerId?'Offer tersedia dan tersimpan.':'Offer hanya dibuat jika provider mengembalikan coverage available.'}</p>
          <label className="mt-3 flex items-start gap-2 text-xs text-[#526675]"><input type="checkbox" checked={orderConsent} onChange={e=>setOrderConsent(e.target.checked)}/>Konfirmasi operator: persetujuan pelanggan telah diterima untuk pengiriman order.</label>
          <button disabled={!orderConsent||!offerId||busy} onClick={()=>void captureOrderConsent()} className="mt-3 w-full rounded-lg border border-[#B9DCEB] bg-white px-3 py-2 text-xs font-semibold text-[#245477] disabled:opacity-50">Catat Consent Order</button>
          <button disabled={!offerId||!orderConsentId||busy} onClick={()=>void submitOrder()} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1769C2] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><ShoppingCart className="h-4 w-4"/>Buat & Submit Order</button>
        </div>
        <div className="rounded-lg bg-[#F5F8FA] p-4"><h3 className="font-semibold text-[#17324D]">3. Provider & Reconciliation</h3>
          <p className="mt-2 text-xs text-[#526675]">Provider submission diproses oleh outbox worker. Status approved/activation hanya berubah melalui webhook provider yang signature-nya valid.</p>
          <div className="mt-3 space-y-1 text-xs text-[#526675]">{providers.map(p=><p key={p.id}>{p.provider_name}: {p.adapter_enabled?'Adapter enabled':'Pending external configuration'}</p>)}</div>
        </div>
      </div>
    </section>}
    <section className="rounded-xl border border-[#D8E3E9] bg-white p-5">
      <div className="mb-3 flex items-center gap-2"><Activity className="h-4 w-4 text-[#0284C7]"/><h2 className="text-base font-bold text-[#17324D]">Order Lifecycle</h2></div>
      {orders.length===0?<p className="text-sm text-[#718391]">Belum ada order pada tenant ini.</p>:<div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead><tr className="border-b border-[#D8E3E9] text-xs text-[#526675]"><th className="py-2">Order</th><th>Pelanggan</th><th>Provider / Produk</th><th>Status</th><th>Dibuat</th><th>Actions</th></tr></thead><tbody>{orders.map(o=><tr key={o.id} className="border-b border-[#EAF2F6]"><td className="py-3 font-semibold text-[#17324D]">{o.order_number}</td><td>{o.customer_name}</td><td>{o.provider_name} · {o.product_name}</td><td><span className="rounded-full bg-[#E6F4F9] px-2 py-1 text-xs text-[#245477]">{o.status}</span></td><td className="text-xs text-[#526675]">{new Date(o.created_at).toLocaleDateString('id-ID')}</td><td className="space-x-2"><button onClick={()=>void viewOrderHistory(o.id)} className="text-xs font-semibold text-[#0284C7]">History</button>{(o.status==='draft'||o.status==='submitted')&&<button disabled={busy} onClick={()=>void cancelOrder(o.id)} className="text-xs font-semibold text-red-600 disabled:opacity-50">Cancel</button>}</td></tr>)}</tbody></table></div>}
      {selectedOrder&&<div className="mt-4 rounded-lg border border-[#EAF2F6] p-3"><h3 className="mb-2 text-sm font-bold text-[#17324D]">Order Event & Provider Attempt — {selectedOrder}</h3><div className="grid gap-3 md:grid-cols-2"><div><h4 className="text-xs font-semibold text-[#526675]">Events</h4>{orderEvents.map((e,i)=><p key={i} className="mt-1 text-xs text-[#526675]">{String(e.event_type)} · {String(e.from_status??'')} → {String(e.to_status??'')} · {String(e.source)}</p>)}</div><div><h4 className="text-xs font-semibold text-[#526675]">Provider attempts</h4>{orderAttempts.map(a=><p key={a.attempt_number} className="mt-1 text-xs text-[#526675]">#{a.attempt_number} · {a.status} · {a.error_code??a.provider_reference??'No error'}</p>)}</div></div>
        <div className="mt-3 border-t border-[#EAF2F6] pt-3"><h4 className="text-xs font-semibold text-[#526675]">Order attribution</h4>{orderAttributions.map(a=><p key={a.id} className="mt-1 text-xs text-[#526675]">{a.display_name} ({a.worker_code}) · {a.attribution_type} · share {String(a.share_basis)} · {a.attribution_status}{a.locked_at?' · locked':''}</p>)}
          {orders.find(o=>o.id===selectedOrder)?.status==='draft'&&<div className="mt-2 flex flex-wrap gap-2"><select value={correctionWorkerId} onChange={e=>setCorrectionWorkerId(e.target.value)} className="rounded border border-[#D8E3E9] bg-white px-2 py-1 text-xs"><option value="">Pilih worker pengganti</option>{workforce.map(w=><option key={w.id} value={w.id}>{w.display_name} · {w.worker_code}</option>)}</select><input value={correctionReason} onChange={e=>setCorrectionReason(e.target.value)} className="min-w-[200px] flex-1 rounded border border-[#D8E3E9] px-2 py-1 text-xs"/><button disabled={busy||!correctionWorkerId} onClick={()=>void correctAttribution()} className="rounded bg-[#1769C2] px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">Correct attribution</button></div>}
        </div></div>}
    </section>
    <section className="rounded-xl border border-[#D8E3E9] bg-white p-5"><h2 className="mb-3 text-base font-bold text-[#17324D]">Provider Reconciliation</h2>{reconciliation.length===0?<p className="text-sm text-[#718391]">Tidak ada order yang membutuhkan rekonsiliasi.</p>:<div className="space-y-2">{reconciliation.map((item,i)=><div key={i} className="flex flex-wrap justify-between gap-2 rounded-lg bg-[#F8FBFC] p-3 text-xs"><span className="font-semibold text-[#17324D]">{String(item.order_number)} · {String(item.provider_name)}</span><span className="text-[#526675]">{String(item.status)} · attempts {String(item.submission_attempts)} · unresolved webhooks {String(item.unresolved_webhooks)} · {String(item.last_error_code??'')}</span></div>)}</div>}
      {unmatchedWebhooks.length>0&&<div className="mt-4 border-t border-[#EAF2F6] pt-3"><h3 className="mb-2 text-sm font-semibold text-[#17324D]">Unmatched Provider Events</h3>{unmatchedWebhooks.map(e=><p key={e.id} className="text-xs text-[#526675]">{e.provider_name} · {e.external_event_id} · {e.processing_status} · {e.error_code??'Awaiting mapping'}</p>)}</div>}
    </section>
  </div>;
}
