'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, ReceiptText } from 'lucide-react';
import { useAgentzyAuth } from '@/apps/web/lib/auth/useAgentzyAuth';
import { createCorporateInvoice, getCorporateInvoice, issueCorporateInvoice, listCorporateContracts, listCorporateInvoices, type ContractInvoice, type CorporateContract } from '@/apps/web/lib/api-client';
import { CorporatePageHeader } from '../../components/data-display/CorporateDataDisplay';

const inputClass = 'h-10 w-full rounded-[9px] border border-[#D8E3E9] bg-white px-3 text-sm text-[#17324D]';
const buttonClass = 'inline-flex h-10 items-center gap-2 rounded-[9px] bg-[#17324D] px-4 text-xs font-semibold text-white disabled:opacity-50';
const secondaryClass = 'inline-flex h-9 items-center rounded-[9px] border border-[#D8E3E9] bg-white px-3 text-xs font-semibold text-[#17324D] disabled:opacity-50';
const formatMoney = (value: string) => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(value));

export function InvoiceCenterView({ tenantId, onBack }: { tenantId: string; onBack: () => void }) {
  const auth = useAgentzyAuth();
  const token = auth.session?.access_token ?? '';
  const [invoices,setInvoices] = useState<ContractInvoice[]>([]);
  const [contracts,setContracts] = useState<CorporateContract[]>([]);
  const [selected,setSelected] = useState<ContractInvoice | null>(null);
  const [selectedLines,setSelectedLines] = useState<Array<Record<string,unknown>>>([]);
  const [loading,setLoading] = useState(false);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const [form,setForm] = useState({contract_id:'',invoice_number:'',title:'',description:'',unit_amount:'',tax_amount:'0',due_at:''});
  const canManage = auth.identity?.memberships.some(m=>m.tenant_id===tenantId && m.permissions.includes('corporate.finance.invoice.manage')) ?? false;

  const refresh = useCallback(async () => {
    if(!token || !tenantId) return;
    setLoading(true); setError('');
    try {
      const [invoiceResult,contractResult] = await Promise.all([
        listCorporateInvoices(token,tenantId), listCorporateContracts(token,tenantId),
      ]);
      setInvoices(invoiceResult.data);
      setContracts(contractResult.data);
      setForm(p=>({...p,contract_id:p.contract_id || contractResult.data.find(c=>c.status==='active')?.id || ''}));
      setSelected(current=>current ? invoiceResult.data.find(i=>i.id===current.id) ?? null : null);
    } catch(e) { setError(e instanceof Error?e.message:'Gagal memuat invoice dari FastAPI.'); }
    finally { setLoading(false); }
  },[token,tenantId]);

  useEffect(()=>{ let alive=true; void (async()=>{ if(alive) await refresh(); })(); return ()=>{alive=false;}; },[refresh]);

  const createDraft = async () => {
    if(!form.contract_id || !form.invoice_number || !form.title || !form.description || !form.unit_amount) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const result = await createCorporateInvoice(token,form.contract_id,{
        tenant_id:tenantId,invoice_number:form.invoice_number,title:form.title,
        currency:'IDR',tax_amount:form.tax_amount || '0',due_at:form.due_at || null,
        lines:[{description:form.description,quantity:'1',unit_amount:form.unit_amount}],
      });
      setNotice('Draft invoice tersimpan di database. Terbitkan setelah detail diverifikasi.');
      await refresh();
      const created = await listCorporateInvoices(token,tenantId);
      setSelected(created.data.find(i=>i.id===result.data.id) ?? null);
    } catch(e) { setError(e instanceof Error?e.message:'Gagal membuat invoice.'); }
    finally { setSaving(false); }
  };

  const selectInvoice = async (invoice:ContractInvoice) => {
    setSelected(invoice); setSelectedLines([]);
    try {
      const detail = await getCorporateInvoice(token,tenantId,invoice.id);
      setSelectedLines(detail.data.lines);
    } catch(e) {
      setError(e instanceof Error?e.message:'Gagal memuat invoice detail.');
    }
  };

  const issue = async (invoiceId:string) => {
    setSaving(true); setError(''); setNotice('');
    try {
      await issueCorporateInvoice(token,tenantId,invoiceId);
      setNotice('Invoice diterbitkan. Pembayaran belum dianggap diterima.');
      await refresh();
    } catch(e) { setError(e instanceof Error?e.message:'Gagal menerbitkan invoice.'); }
    finally { setSaving(false); }
  };

  return <div className="space-y-5">
    <CorporatePageHeader title="Invoice Center" subtitle="Invoice kontrak, item tagihan, penerbitan dan due date melalui FastAPI" onBack={onBack}
      actions={<button className={secondaryClass} onClick={()=>void refresh()} disabled={loading}><RefreshCw className="mr-2 h-4 w-4"/>Refresh</button>}/>
    {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>}
    {notice && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">{notice}</div>}
    {canManage && <section className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
      <h2 className="text-sm font-bold text-[#17324D]">Buat Draft Invoice</h2>
      <p className="mt-1 text-xs text-[#718391]">Nilai subtotal dan total dihitung backend dari quantity × unit amount + pajak. Tidak ada transaksi pembayaran yang dibuat.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label><span className="mb-1 block text-xs font-semibold text-[#526675]">Kontrak</span><select className={inputClass} value={form.contract_id} onChange={e=>setForm(p=>({...p,contract_id:e.target.value}))}><option value="">Pilih kontrak aktif</option>{contracts.filter(c=>['active','approved'].includes(c.status)).map(c=><option key={c.id} value={c.id}>{c.contract_number} — {c.title}</option>)}</select></label>
        <label><span className="mb-1 block text-xs font-semibold text-[#526675]">Nomor invoice</span><input className={inputClass} value={form.invoice_number} onChange={e=>setForm(p=>({...p,invoice_number:e.target.value}))}/></label>
        <label><span className="mb-1 block text-xs font-semibold text-[#526675]">Judul invoice</span><input className={inputClass} value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/></label>
        <label><span className="mb-1 block text-xs font-semibold text-[#526675]">Deskripsi item</span><input className={inputClass} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}/></label>
        <label><span className="mb-1 block text-xs font-semibold text-[#526675]">Nominal item (IDR)</span><input type="number" min="0" className={inputClass} value={form.unit_amount} onChange={e=>setForm(p=>({...p,unit_amount:e.target.value}))}/></label>
        <label><span className="mb-1 block text-xs font-semibold text-[#526675]">Pajak (IDR)</span><input type="number" min="0" className={inputClass} value={form.tax_amount} onChange={e=>setForm(p=>({...p,tax_amount:e.target.value}))}/></label>
        <label><span className="mb-1 block text-xs font-semibold text-[#526675]">Jatuh tempo</span><input type="date" className={inputClass} value={form.due_at} onChange={e=>setForm(p=>({...p,due_at:e.target.value}))}/></label>
      </div>
      <button className={buttonClass+' mt-4'} disabled={saving || !form.contract_id || !form.invoice_number || !form.title || !form.description || !form.unit_amount} onClick={()=>void createDraft()}>Simpan Draft Invoice</button>
    </section>}
    <section className="grid gap-5 lg:grid-cols-12">
      <div className="space-y-3 lg:col-span-7">
        <h2 className="text-sm font-bold text-[#17324D]">Invoice Records</h2>
        {invoices.map(invoice=><button key={invoice.id} onClick={()=>void selectInvoice(invoice)} className={'w-full rounded-xl border p-4 text-left '+(selected?.id===invoice.id?'border-[#0284C7] bg-[#F2FAFD]':'border-[#D8E3E9] bg-white')}>
          <div className="flex items-center justify-between gap-3"><span className="font-mono text-xs font-bold text-[#0284C7]">{invoice.invoice_number}</span><span className="text-[11px] font-semibold text-[#526675]">{invoice.status}</span></div>
          <p className="mt-1 text-sm font-bold text-[#17324D]">{invoice.title}</p>
          <p className="mt-1 text-xs text-[#718391]">{formatMoney(invoice.total_amount)} · Jatuh tempo {invoice.due_at ?? '—'}</p>
        </button>)}
        {!invoices.length && !loading && <div className="rounded-xl border border-dashed border-[#D8E3E9] bg-white p-6 text-center text-xs text-[#718391]">Belum ada invoice yang tersimpan.</div>}
      </div>
      <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-5">
        {selected ? <>
          <div className="flex items-center gap-2"><ReceiptText className="h-4 w-4 text-[#0284C7]"/><h2 className="text-sm font-bold text-[#17324D]">{selected.invoice_number}</h2></div>
          <p className="mt-2 text-sm font-semibold">{selected.title}</p>
          <p className="mt-3 text-xl font-bold text-[#17324D]">{formatMoney(selected.total_amount)}</p>
          <div className="mt-3 space-y-2 text-xs text-[#526675]"><p>Subtotal: {formatMoney(selected.subtotal)}</p><p>Pajak: {formatMoney(selected.tax_amount)}</p><p>Status: {selected.status}</p><p>Diterbitkan: {selected.issued_at ?? 'Belum diterbitkan'}</p><p>Jatuh tempo: {selected.due_at ?? '—'}</p></div>
          <div className="mt-4 border-t border-[#EAF2F6] pt-3"><p className="text-xs font-bold text-[#17324D]">Invoice lines</p>
            {selectedLines.map((line,index)=><div key={String(line.id ?? index)} className="flex justify-between gap-2 py-2 text-xs"><span>{String(line.description)} · qty {String(line.quantity)}</span><span>{formatMoney(String(line.line_amount))}</span></div>)}
            {!selectedLines.length && <p className="mt-2 text-xs text-[#718391]">Detail line item belum tersedia.</p>}
          </div>
          {canManage && selected.status==='draft' && <button className={buttonClass+' mt-4'} disabled={saving} onClick={()=>void issue(selected.id)}>Terbitkan Invoice</button>}
        </> : <p className="py-16 text-center text-xs text-[#718391]">Pilih invoice untuk melihat rincian.</p>}
      </div>
    </section>
  </div>;
}
