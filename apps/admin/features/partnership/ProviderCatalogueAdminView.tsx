'use client';

import { useCallback,useEffect,useState,type FormEvent } from 'react';
import { RefreshCw,Plus,RadioTower,PackageCheck,ShieldCheck } from 'lucide-react';
import { ApiError,listSalesProviders,listSalesProducts,createSalesProvider,setSalesProviderStatus,createSalesProduct,setSalesProductStatus,configureSalesProvider,retrySalesProviderSubmissions,type SalesProvider,type SalesProduct } from '@/apps/web/lib/api-client';

type TenantOption={id:string;name:string};
export function ProviderCatalogueAdminView({accessToken,tenants}:{accessToken:string;tenants:TenantOption[]}) {
  const [tenantId,setTenantId]=useState(tenants[0]?.id??'');
  const [providers,setProviders]=useState<SalesProvider[]>([]);
  const [products,setProducts]=useState<SalesProduct[]>([]);
  const [providerId,setProviderId]=useState('');
  const [providerForm,setProviderForm]=useState({provider_code:'',provider_name:'',provider_type:'isp',registration_number:'',contact_email:'',contact_phone:'',regions:''});
  const [form,setForm]=useState({product_code:'',name:'',category:'internet_access',coverage_source:'authorized_provider_api',region:'',pricingReference:'provider_quote_required'});
  const [integration,setIntegration]=useState({endpoint_url:'',health_url:'',auth_env_key:'',webhook_secret_env_key:'',enabled:false,requestMappingJson:'{}',responseMappingJson:'{}',statusMappingJson:'{"accepted":"provider_pending","approved":"provider_approved","rejected":"provider_rejected","scheduled":"installation_scheduled","installing":"installation_in_progress","activated":"activated"}'});
  const [loading,setLoading]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [notice,setNotice]=useState<string|null>(null);

  const load=useCallback(async()=>{
    if(!tenantId||!accessToken)return;
    setLoading(true);setError(null);
    try {
      const [p,c]=await Promise.all([listSalesProviders(accessToken,tenantId),listSalesProducts(accessToken,tenantId)]);
      setProviders(p.data);setProducts(c.data);
      if(!providerId&&p.data.length)setProviderId(p.data[0].id);
    } catch(e){setError(e instanceof ApiError?e.message:'Provider catalogue tidak dapat dimuat.');}
    finally{setLoading(false);}
  },[tenantId,accessToken,providerId]);
  useEffect(()=>{void Promise.resolve().then(()=>load());},[load]);

  const createProvider=async(event:FormEvent)=>{event.preventDefault();setBusy(true);setError(null);setNotice(null);try{const {regions,...providerPayload}=providerForm;const result=await createSalesProvider(accessToken,{tenant_id:tenantId,...providerPayload,service_regions:regions.split(',').map(v=>v.trim()).filter(Boolean),service_metadata:{}});setProviderId(result.data.id);setNotice('Provider profile dibuat sebagai draft. Aktifkan setelah dokumen kemitraan dan cakupan wilayah diverifikasi.');setProviderForm({provider_code:'',provider_name:'',provider_type:'isp',registration_number:'',contact_email:'',contact_phone:'',regions:''});await load();}catch(e){setError(e instanceof ApiError?e.message:'Provider profile gagal dibuat.');}finally{setBusy(false);}};
  const activateProvider=async(provider:SalesProvider)=>{setBusy(true);setError(null);try{await setSalesProviderStatus(accessToken,provider.id,{tenant_id:tenantId,status:'active',reason:'Provider profile verified by authorized platform operator.'});setNotice('Provider '+provider.provider_code+' diaktifkan.');await load();}catch(e){setError(e instanceof ApiError?e.message:'Provider status gagal diperbarui.');}finally{setBusy(false);}};
  const createProduct=async(event:FormEvent)=>{
    event.preventDefault();if(!providerId)return;
    setBusy(true);setError(null);setNotice(null);
    try {
      const result=await createSalesProduct(accessToken,providerId,{
        tenant_id:tenantId,product_code:form.product_code,name:form.name,category:form.category,
        coverage_source:form.coverage_source,service_regions:form.region.split(',').map(v=>v.trim()).filter(Boolean),
        requirements:{},pricing_reference:{reference:form.pricingReference},sla:{},eligibility:{},
      });
      setNotice('Product version '+result.data.version+' dibuat sebagai draft. Aktifkan setelah provider, price reference dan eligibility diverifikasi.');
      setForm({product_code:'',name:'',category:'internet_access',coverage_source:'authorized_provider_api',region:'',pricingReference:'provider_quote_required'});
      await load();
    } catch(e){setError(e instanceof ApiError?e.message:'Product gagal dibuat.');}
    finally{setBusy(false);}
  };
  const activate=async(product:SalesProduct)=>{
    setBusy(true);setError(null);
    try {await setSalesProductStatus(accessToken,product.id,{tenant_id:tenantId,status:'active',reason:'Catalogue approved by authorized platform operator.'});setNotice('Product '+product.product_code+' diaktifkan.');await load();}
    catch(e){setError(e instanceof ApiError?e.message:'Status product gagal diperbarui.');}
    finally{setBusy(false);}
  };
  const saveIntegration=async()=>{
    if(!providerId)return;
    setBusy(true);setError(null);
    try {
      await configureSalesProvider(accessToken,providerId,{
        tenant_id:tenantId,adapter_key:'http_json',endpoint_url:integration.endpoint_url||null,health_url:integration.health_url||null,
        auth_env_key:integration.auth_env_key||null,webhook_secret_env_key:integration.webhook_secret_env_key||null,
        enabled:integration.enabled,timeout_seconds:15,request_mapping:JSON.parse(integration.requestMappingJson),
        response_mapping:JSON.parse(integration.responseMappingJson),status_mapping:JSON.parse(integration.statusMappingJson),
      });
      setNotice('Contract adapter tersimpan. Secret tetap berada di deployment environment, tidak disimpan di database.');
      await load();
    } catch(e){setError(e instanceof ApiError?e.message:'Provider adapter gagal disimpan.');}
    finally{setBusy(false);}
  };
  const retry=async()=>{
    if(!providerId)return;setBusy(true);setError(null);
    try{const r=await retrySalesProviderSubmissions(accessToken,tenantId,providerId);setNotice(r.data.requeued+' blocked submission masuk kembali ke outbox.');}
    catch(e){setError(e instanceof ApiError?e.message:'Retry tidak dapat dijalankan.');}
    finally{setBusy(false);}
  };
  const selectedProvider=providers.find(p=>p.id===providerId);
  return <section className="mt-6 space-y-4 rounded-xl border border-[#D8E3E9] bg-white p-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-bold text-[#17324D]">Provider & Product Catalogue</h2><p className="text-xs text-[#526675]">Master provider Phase 03, product versioning, adapter contract dan operational retry</p></div><button onClick={()=>void load()} className="inline-flex items-center gap-2 rounded-lg border border-[#D8E3E9] px-3 py-2 text-xs font-semibold text-[#17324D]"><RefreshCw className="h-4 w-4"/>Refresh</button></div>
    {error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {notice&&<p className="rounded-lg bg-[#F1F8FB] p-3 text-sm text-[#245477]">{notice}</p>}
    <div className="grid gap-3 md:grid-cols-2">
      <label className="text-xs font-semibold text-[#526675]">Corporate Tenant<select value={tenantId} onChange={e=>{setTenantId(e.target.value);setProviderId('');}} className="mt-1 w-full rounded-lg border border-[#D8E3E9] bg-white px-3 py-2 text-sm">{tenants.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
      <label className="text-xs font-semibold text-[#526675]">Provider Profile<select value={providerId} onChange={e=>setProviderId(e.target.value)} className="mt-1 w-full rounded-lg border border-[#D8E3E9] bg-white px-3 py-2 text-sm"><option value="">Pilih provider</option>{providers.map(p=><option key={p.id} value={p.id}>{p.provider_name} · {p.status}</option>)}</select></label>
    </div>
    <form onSubmit={createProvider} className="grid gap-3 rounded-lg border border-[#EAF2F6] p-4 md:grid-cols-2">
      <div className="md:col-span-2"><h3 className="font-semibold text-[#17324D]">Create Provider Profile</h3><p className="text-xs text-[#526675]">Provider profile dibuat draft; tidak mengaktifkan integrasi eksternal otomatis.</p></div>
      {([['provider_code','Provider code'],['provider_name','Provider name'],['registration_number','Registration number'],['contact_email','Contact email'],['contact_phone','Contact phone'],['regions','Service regions (comma separated)']] as const).map(([key,label])=><label key={key} className="text-xs font-semibold text-[#526675]">{label}<input required={key==='provider_code'||key==='provider_name'} value={providerForm[key]} onChange={e=>setProviderForm(v=>({...v,[key]:e.target.value}))} className="mt-1 w-full rounded-lg border border-[#D8E3E9] px-3 py-2 text-sm font-normal"/></label>)}
      <label className="text-xs font-semibold text-[#526675]">Provider type<select value={providerForm.provider_type} onChange={e=>setProviderForm(v=>({...v,provider_type:e.target.value}))} className="mt-1 w-full rounded-lg border border-[#D8E3E9] bg-white px-3 py-2 text-sm"><option value="isp">ISP</option><option value="telecom">Telecom</option><option value="managed_service">Managed service</option><option value="technology">Technology</option><option value="other">Other</option></select></label>
      <button disabled={busy||!tenantId} className="self-end rounded-lg bg-[#1769C2] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Create Provider Draft</button>
    </form>
    <div className="rounded-lg border border-[#EAF2F6] p-4"><h3 className="mb-2 font-semibold text-[#17324D]">Provider Profiles ({providers.length})</h3><div className="space-y-2">{providers.map(p=><div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#F8FBFC] p-3 text-xs"><span className="font-semibold text-[#17324D]">{p.provider_name} · {p.provider_code} · {p.status}</span>{p.status==='draft'&&<button disabled={busy} onClick={()=>void activateProvider(p)} className="font-semibold text-[#0284C7] disabled:opacity-50">Activate profile</button>}</div>)}</div></div>
    {selectedProvider&&<div className="rounded-lg border border-[#EAF2F6] bg-[#F8FBFC] p-3 text-xs text-[#526675]"><div className="flex items-center gap-2 font-semibold text-[#17324D]"><RadioTower className="h-4 w-4"/> {selectedProvider.provider_name} ({selectedProvider.provider_code})</div><p className="mt-1">Provider profile status: {selectedProvider.status} · Adapter: {selectedProvider.adapter_enabled?'enabled':'pending external configuration'}</p></div>}
    <div className="grid gap-4 xl:grid-cols-2">
      <form onSubmit={createProduct} className="space-y-3 rounded-lg border border-[#EAF2F6] p-4">
        <h3 className="flex items-center gap-2 font-semibold text-[#17324D]"><Plus className="h-4 w-4"/>Tambah Product Version</h3>
        {([['product_code','Product code'],['name','Product name'],['category','Category'],['coverage_source','Coverage source'],['region','Region (comma separated)'],['pricingReference','Pricing reference']] as const).map(([key,label])=><label key={key} className="block text-xs font-semibold text-[#526675]">{label}<input required value={form[key]} onChange={e=>setForm(v=>({...v,[key]:e.target.value}))} className="mt-1 w-full rounded-lg border border-[#D8E3E9] px-3 py-2 text-sm font-normal"/></label>)}
        <button disabled={busy||!providerId} className="w-full rounded-lg bg-[#1769C2] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Simpan Product Draft</button>
      </form>
      <div className="space-y-3 rounded-lg border border-[#EAF2F6] p-4">
        <h3 className="flex items-center gap-2 font-semibold text-[#17324D]"><ShieldCheck className="h-4 w-4"/>Authorized Provider Adapter</h3>
        <p className="text-xs text-[#526675]">Gunakan endpoint resmi HTTPS dan environment reference. Secret/token tidak boleh dimasukkan ke form atau database.</p>
        <label className="block text-xs font-semibold text-[#526675]">Official API base endpoint<input value={integration.endpoint_url} onChange={e=>setIntegration(v=>({...v,endpoint_url:e.target.value}))} placeholder="https://api.provider.example/v1" className="mt-1 w-full rounded-lg border border-[#D8E3E9] px-3 py-2 text-sm font-normal"/></label>
        <label className="block text-xs font-semibold text-[#526675]">Health check URL<input value={integration.health_url} onChange={e=>setIntegration(v=>({...v,health_url:e.target.value}))} placeholder="https://api.provider.example/v1/health" className="mt-1 w-full rounded-lg border border-[#D8E3E9] px-3 py-2 text-sm font-normal"/></label>
        <label className="block text-xs font-semibold text-[#526675]">Auth environment key<input value={integration.auth_env_key} onChange={e=>setIntegration(v=>({...v,auth_env_key:e.target.value}))} placeholder="AGENTZY_PROVIDER_AUTH__PROVIDER_CODE" className="mt-1 w-full rounded-lg border border-[#D8E3E9] px-3 py-2 text-sm font-normal"/></label>
        <label className="block text-xs font-semibold text-[#526675]">Webhook secret environment key<input value={integration.webhook_secret_env_key} onChange={e=>setIntegration(v=>({...v,webhook_secret_env_key:e.target.value}))} placeholder="AGENTZY_PROVIDER_WEBHOOK__PROVIDER_CODE" className="mt-1 w-full rounded-lg border border-[#D8E3E9] px-3 py-2 text-sm font-normal"/></label>
        {([['requestMappingJson','Request mapping JSON'],['responseMappingJson','Response mapping JSON'],['statusMappingJson','Webhook status mapping JSON']] as const).map(([key,label])=><label key={key} className="block text-xs font-semibold text-[#526675]">{label}<textarea value={integration[key]} onChange={e=>setIntegration(v=>({...v,[key]:e.target.value}))} rows={3} className="mt-1 w-full rounded-lg border border-[#D8E3E9] px-3 py-2 font-mono text-xs font-normal"/></label>)}
        <label className="flex items-center gap-2 text-xs text-[#526675]"><input type="checkbox" checked={integration.enabled} onChange={e=>setIntegration(v=>({...v,enabled:e.target.checked}))}/>Enable adapter (requires official access, allowlisted host and deployment secret)</label>
        <button disabled={busy||!providerId} onClick={()=>void saveIntegration()} className="w-full rounded-lg border border-[#B9DCEB] px-3 py-2 text-sm font-semibold text-[#245477] disabled:opacity-50">Simpan Adapter Contract</button>
        <button disabled={busy||!providerId} onClick={()=>void retry()} className="w-full rounded-lg border border-[#D8E3E9] px-3 py-2 text-xs font-semibold text-[#526675] disabled:opacity-50">Retry blocked / dead-letter submissions</button>
      </div>
    </div>
    <div><h3 className="mb-2 flex items-center gap-2 font-semibold text-[#17324D]"><PackageCheck className="h-4 w-4"/>Catalogue ({products.length})</h3>
      {loading?<p className="text-sm text-[#526675]">Memuat catalogue…</p>:products.length===0?<p className="text-sm text-[#718391]">Belum ada product. Buat draft lalu aktifkan setelah diverifikasi.</p>:<div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead><tr className="border-b border-[#D8E3E9] text-xs text-[#526675]"><th className="py-2">Provider / Product</th><th>Category</th><th>Version</th><th>Status</th><th>Action</th></tr></thead><tbody>{products.map(p=><tr key={p.id} className="border-b border-[#EAF2F6]"><td className="py-3"><p className="font-semibold text-[#17324D]">{p.name}</p><p className="text-xs text-[#718391]">{p.provider_name} · {p.product_code}</p></td><td>{p.category}</td><td>v{p.version}</td><td>{p.status}</td><td>{p.status==='draft'?<button disabled={busy} onClick={()=>void activate(p)} className="text-xs font-semibold text-[#0284C7] disabled:opacity-50">Activate</button>:<span className="text-xs text-[#718391]">Managed</span>}</td></tr>)}</tbody></table></div>}
    </div>
  </section>;
}
