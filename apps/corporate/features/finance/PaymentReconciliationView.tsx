'use client';

import React, { useMemo, useState } from 'react';
import { CheckCircle2, FileCheck2 } from 'lucide-react';
import {
  CorporatePageHeader,
  CorporateSegmentedTabs,
} from '../../components/data-display/CorporateDataDisplay';
import { formatIDR } from '../../lib/corporate-data';
import type {
  CorporateInvoice,
  CorporatePaymentRecord,
} from '../../lib/corporate-types';

export function PaymentReconciliationView({
  invoices,
  payments,
  onOpenReconcileModal,
  onBack,
}: {
  invoices: CorporateInvoice[];
  payments: CorporatePaymentRecord[];
  onOpenReconcileModal: (invoiceId?: string) => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<'pembayaran' | 'rekonsiliasi'>('pembayaran');

  const summary = useMemo(() => {
    const totalBilled = invoices.reduce((acc, i) => acc + i.amount, 0);
    const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
    const outstanding = Math.max(0, totalBilled - totalPaid);
    return { totalBilled, totalPaid, outstanding };
  }, [invoices, payments]);

  const unpaidInvoices = invoices.filter((i) => i.status !== 'Lunas');

  return (
    <div className="space-y-5">
      <CorporatePageHeader
        title="Payment & Rekonsiliasi"
        subtitle="Ringkasan status tagihan, riwayat pembayaran terverifikasi, dan rekonsiliasi settlement"
        onBack={onBack}
        actions={
          unpaidInvoices.length > 0 ? (
            <button
              type="button"
              onClick={() => onOpenReconcileModal(unpaidInvoices[0].id)}
              className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#0284C7] px-4 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap"
            >
              <FileCheck2 className="h-4 w-4" />
              <span>Konfirmasi Pembayaran</span>
            </button>
          ) : undefined
        }
      />

      <CorporateSegmentedTabs
        tabs={[
          { id: 'pembayaran', label: 'Pembayaran' },
          { id: 'rekonsiliasi', label: 'Rekonsiliasi' },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      {tab === 'pembayaran' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Ringkasan Pembayaran (Matches Screen 14) */}
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-5">
            <h2 className="text-base font-bold text-[#17324D]">
              Ringkasan Pembayaran
            </h2>
            <div className="mt-4 divide-y divide-[#EAF2F6] text-sm">
              <div className="flex items-center justify-between py-3">
                <span className="text-[#526675]">Total Tagihan</span>
                <span className="font-mono-tabular font-bold text-[#17324D]">
                  {formatIDR(summary.totalBilled)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-[#526675]">Total Dibayar</span>
                <span className="font-mono-tabular font-bold text-[#247A55]">
                  {formatIDR(summary.totalPaid)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-[#526675]">Sisa Tagihan</span>
                <span
                  className={`font-mono-tabular font-bold ${
                    summary.outstanding > 0 ? 'text-[#A96816]' : 'text-[#247A55]'
                  }`}
                >
                  {formatIDR(summary.outstanding)}
                </span>
              </div>
            </div>
          </div>

          {/* Riwayat Pembayaran */}
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-7">
            <h2 className="text-base font-bold text-[#17324D]">
              Riwayat Pembayaran
            </h2>
            <div className="mt-4 divide-y divide-[#EAF2F6]">
              {payments.map((pay) => (
                <div
                  key={pay.id}
                  className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#247A55]" />
                    <div>
                      <p className="text-sm font-bold text-[#17324D]">
                        {pay.paidAt}
                      </p>
                      <p className="text-xs text-[#526675]">
                        Pembayaran {pay.invoiceId} · {pay.method}
                      </p>
                      <p className="font-mono-tabular text-[11px] text-[#718391]">
                        Ref: {pay.referenceNo}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono-tabular text-sm font-bold text-[#17324D]">
                    {formatIDR(pay.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'rekonsiliasi' && (
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
          <h2 className="text-base font-bold text-[#17324D]">
            Matriks Rekonsiliasi Ledger &amp; Bank Settlement
          </h2>
          <p className="mt-0.5 text-xs text-[#526675]">
            Setiap pembayaran dicocokkan dengan nomor referensi Virtual Account / RTGS dan faktur Agentzy
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#D8E3E9] text-xs font-semibold text-[#526675]">
                  <th className="py-3 pr-4">ID Pembayaran &amp; Faktur</th>
                  <th className="py-3 px-4">Metode &amp; Referensi</th>
                  <th className="py-3 px-4 text-right">Nominal</th>
                  <th className="py-3 pl-4 text-right">Status Rekon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAF2F6]">
                {payments.map((pay) => (
                  <tr key={pay.id}>
                    <td className="py-3.5 pr-4">
                      <p className="font-mono-tabular text-xs font-bold text-[#0284C7]">
                        {pay.id}
                      </p>
                      <p className="text-xs font-semibold text-[#17324D]">
                        {pay.invoiceId} · {pay.paidAt}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#526675]">
                      <p>{pay.method}</p>
                      <p className="font-mono-tabular text-[#718391]">
                        {pay.referenceNo}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-tabular font-bold text-[#17324D]">
                      {formatIDR(pay.amount)}
                    </td>
                    <td className="py-3.5 pl-4 text-right text-xs font-bold text-[#247A55]">
                      {pay.reconciliationStatus}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
