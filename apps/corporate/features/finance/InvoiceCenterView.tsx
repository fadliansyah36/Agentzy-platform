'use client';

import React, { useState } from 'react';
import { ChevronRight, Receipt } from 'lucide-react';
import {
  CorporatePageHeader,
  CorporateSegmentedTabs,
} from '../../components/data-display/CorporateDataDisplay';
import { formatIDR } from '../../lib/corporate-data';
import type { CorporateInvoice } from '../../lib/corporate-types';

export function InvoiceCenterView({
  invoices,
  onSelectInvoice,
  onBack,
}: {
  invoices: CorporateInvoice[];
  onSelectInvoice: (invoiceId: string) => void;
  onBack: () => void;
}) {
  const [filter, setFilter] = useState<'semua' | 'belum' | 'lunas'>('semua');

  const filtered = invoices.filter((inv) => {
    if (filter === 'belum') return inv.status !== 'Lunas';
    if (filter === 'lunas') return inv.status === 'Lunas';
    return true;
  });

  return (
    <div className="space-y-5">
      <CorporatePageHeader
        title="Invoice Center"
        subtitle="Daftar tagihan layanan SaaS Platform, Managed Workforce, dan AI Credits"
        onBack={onBack}
      />

      <CorporateSegmentedTabs
        tabs={[
          { id: 'semua', label: 'Semua' },
          { id: 'belum', label: 'Belum Bayar' },
          { id: 'lunas', label: 'Lunas' },
        ]}
        activeTab={filter}
        onChange={setFilter}
      />

      <div className="space-y-3">
        {filtered.map((inv) => {
          const isPaid = inv.status === 'Lunas';
          return (
            <button
              key={inv.id}
              type="button"
              onClick={() => onSelectInvoice(inv.id)}
              className="flex w-full items-center justify-between gap-4 rounded-[14px] border border-[#D8E3E9] bg-white p-4 text-left transition hover:border-[#87CEEB]"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#0284C7]">
                  <Receipt className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-tabular text-sm font-bold text-[#17324D]">
                      {inv.id}
                    </span>
                    <span className="text-xs text-[#718391]">·</span>
                    <span className="font-mono-tabular text-xs font-semibold text-[#17324D]">
                      {formatIDR(inv.amount)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs font-medium text-[#526675]">
                    {inv.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#718391]">
                    Periode: {inv.periodLabel} · Jatuh tempo: {inv.dueDate}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`text-xs font-bold ${
                    isPaid ? 'text-[#247A55]' : 'text-[#A96816]'
                  }`}
                >
                  {inv.status}
                </span>
                <ChevronRight className="h-4 w-4 text-[#718391]" />
              </div>
            </button>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-8 text-center">
            <p className="text-sm font-bold text-[#17324D]">
              Tidak ada faktur pada filter ini
            </p>
            <p className="mt-1 text-xs text-[#526675]">
              Seluruh tagihan Anda telah terselesaikan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
