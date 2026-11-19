'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, ShieldCheck } from 'lucide-react';
import { useAgentzyAuth } from '@/apps/web/lib/auth/useAgentzyAuth';
import { createPaymentReference, listCorporateInvoices, listPaymentReferences, type ContractInvoice, type ContractPaymentReference } from '@/apps/web/lib/api-client';
import { CorporatePageHeader } from '../../components/data-display/CorporateDataDisplay';

const field='h-10 w-full rounded-[9px] border border-[#D8E3E9] bg-white px-3 text-sm text-[#17324D]';
const button='inline-flex h-10 items-center rounded-[9px] bg-[#17324D] px-4 text-xs font-semibold text-white disabled:opacity-50';
const secondary='inline-flex h-9 items-center rounded-[9px] border border-[#D8E3E9] bg-white px-3 text-xs font-semibold text-[#17324D]';
const money=(value:string)=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(value));

export function PaymentReconciliationView({tenantId,onBack}:{tenantId:string;onBack:()=>void}) {
  const auth=useAgentzyAuth();
  const token=auth.session?.access_token ?? '';
  const [invoices,setInvoices]=useState<ContractInvoice[]>([]);
  const [references,setReferences]=useState<Array<ContractPaymentReference & {invoice_number:string}>>([]);
  const [selectedInvoice,setSelectedInvoice]=useState('');
  const [method,setMethod]=useState('Bank Transfer');
  const [amount,setAmount]=useState('');
  const [loading,setLoading]=useState(false);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const canManage=auth.identity?.memberships.some(m=>m.tenant_id===tenantId && m.permissions.includes('corporate.finance.invoice.manage')) ?? false;

  const refresh=useCallback(async()=>{
    if(!token || !tenantId) return;
    setLoading(true);setError('');
    try {
      const invoiceResult=await listCorporateInvoices(token,tenantId);
      setInvoices(invoiceResult.data);
      const pages=await Promise.all(invoiceResult.data.map(invoice=>listPaymentReferences(token,tenantId,invoice.id)));
      const mapped=pages.flatMap((page,index)=>page.data.map(reference=>({...reference,invoice_number:invoiceResult.data[index].invoice_number})));
      setReferences(mapped);
      setSelectedInvoice(current=>current || invoiceResult.data.find(i=>['issued','partially_paid','overdue'].includes(i.status))?.id || '');
    } catch(e) {setError(e instanceof Error?e.message:'Gagal memuat payment references.');}
    finally {setLoading(false);}
  },[token,tenantId]);

  useEffect(()=>{let alive=true;void(async()=>{if(alive)await refresh();})();return()=>{alive=false;};},[refresh]);

  const selected=invoices.find(i=>i.id===selectedInvoice) ?? null;
  const reconciled=references.filter(r=>r.status==='reconciled').reduce((sum,r)=>sum+Number(r.amount),0);
  const pending=references.filter(r=>['reference_created','submitted'].includes(r.status)).reduce((sum,r)=>sum+Number(r.amount),0);

  const createReference=async()=>{
    if(!selected || !amount || Number(amount)<=0) return;
    setSaving(true);setError('');setNotice('');
    try {
      const referenceNumber='AGZ-REQ-'+crypto.randomUUID();
      await createPaymentReference(token,selected.id,{
        tenant_id:tenantId,reference_number:referenceNumber,payment_method:method,amount,
      });
      setNotice('Payment reference berhasil dibuat. Ini bukan bukti pembayaran dan invoice tidak ditandai lunas.');
      await refresh();
    } catch(e) {setError(e instanceof Error?e.message:'Gagal membuat payment reference.');}
    finally {setSaving(false);}
  };

  return <div className="space-y-5">
    <CorporatePageHeader title="Payment References" subtitle="Pencatatan referensi, bukti eksternal dan rekonsiliasi pembayaran" onBack={onBack}
      actions={<button className={secondary} onClick={()=>void refresh()} disabled={loading}><RefreshCw className="mr-2 h-4 w-4"/>Refresh</button>}/>
    {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>}
    {notice && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">{notice}</div>}
    <div className="grid gap-3 md:grid-cols-3">
      <div className="rounded-xl border border-[#D8E3E9] bg-white p-4"><p className="text-xs text-[#718391]">Total terekonsiliasi</p><p className="mt-2 text-lg font-bold text-[#17324D]">{money(String(reconciled))}</p></div>
      <div className="rounded-xl border border-[#D8E3E9] bg-white p-4"><p className="text-xs text-[#718391]">Referensi menunggu</p><p className="mt-2 text-lg font-bold text-[#A96816]">{money(String(pending))}</p></div>
      <div className="rounded-xl border border-[#D8E3E9] bg-white p-4"><p className="text-xs text-[#718391]">Jumlah referensi</p><p className="mt-2 text-lg font-bold text-[#17324D]">{references.length}</p></div>
    </div>
    {canManage && <section className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
      <h2 className="text-sm font-bold text-[#17324D]">Buat Referensi Pembayaran</h2>
      <p className="mt-1 text-xs text-[#718391]">Membuat reference record saja. Status paid hanya boleh berubah setelah bukti settlement diverifikasi oleh proses finance yang berwenang.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <label><span className="mb-1 block text-xs font-semibold text-[#526675]">Invoice</span><select className={field} value={selectedInvoice} onChange={e=>{setSelectedInvoice(e.target.value);const item=invoices.find(i=>i.id===e.target.value);setAmount(item?.total_amount ?? '');}}><option value="">Pilih invoice terbit</option>{invoices.filter(i=>['issued','partially_paid','overdue'].includes(i.status)).map(i=><option key={i.id} value={i.id}>{i.invoice_number} · {i.title}</option>)}</select></label>
        <label><span className="mb-1 block text-xs font-semibold text-[#526675]">Metode</span><select className={field} value={method} onChange={e=>setMethod(e.target.value)}><option>Bank Transfer</option><option>Virtual Account</option><option>Manual Transfer</option><option>Other</option></select></label>
        <label><span className="mb-1 block text-xs font-semibold text-[#526675]">Nominal referensi (IDR)</span><input type="number" min="1" className={field} value={amount} onChange={e=>setAmount(e.target.value)}/></label>
      </div>
      <button className={button+' mt-4'} disabled={saving || !selected || !amount} onClick={()=>void createReference()}>Simpan Payment Reference</button>
    </section>}
    <section className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
      <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#0284C7]"/><h2 className="text-sm font-bold text-[#17324D]">Reference & Reconciliation Ledger</h2></div>
      <div className="mt-3 divide-y divide-[#EAF2F6]">
        {references.map(reference=><div key={reference.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div><p className="text-xs font-semibold text-[#17324D]">{reference.reference_number} · {reference.invoice_number}</p><p className="mt-1 text-[11px] text-[#718391]">{reference.payment_method} · {reference.created_at}</p><p className="mt-1 text-[11px] text-[#718391]">External ref: {reference.external_reference ?? 'Belum ada'}</p></div>
          <div className="text-right"><p className="text-sm font-bold text-[#17324D]">{money(reference.amount)}</p><p className="mt-1 text-[11px] font-semibold text-[#A96816]">{reference.status}</p></div>
        </div>)}
        {!references.length && <p className="py-5 text-xs text-[#718391]">Belum ada payment reference.</p>}
      </div>
    </section>
  </div>;
}
