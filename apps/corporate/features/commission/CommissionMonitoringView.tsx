'use client';

import React, { useState } from 'react';
import { ShieldCheck, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import {
  CorporatePageHeader,
  CorporateSegmentedTabs,
  DeltaText,
} from '../../components/data-display/CorporateDataDisplay';
import {
  COMMISSION_CALCULATION_SAMPLES,
  formatIDR,
} from '../../lib/corporate-data';

export function CommissionMonitoringView({
  onBack,
  onSelectCalculation,
}: {
  onBack: () => void;
  onSelectCalculation: (calcId: string) => void;
}) {
  const [tab, setTab] = useState<'ringkasan' | 'perhitungan' | 'rekon'>('ringkasan');

  return (
    <div className="space-y-5">
      <CorporatePageHeader
        title="Komisi & Insentif"
        subtitle="Monitoring komisi deterministik berbasis SA tervalidasi & pembagian 60/40"
        onBack={onBack}
      />

      <CorporateSegmentedTabs
        tabs={[
          { id: 'ringkasan', label: 'Ringkasan' },
          { id: 'perhitungan', label: 'Perhitungan' },
          { id: 'rekon', label: 'Rekon' },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      {tab === 'ringkasan' && (
        <div className="space-y-5">
          {/* Total Komisi Periode Ini Card (Matches Screen 10) */}
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium text-[#526675]">
                  Total Komisi (Periode Ini)
                </p>
                <p className="mt-1 font-mono-tabular text-2xl font-bold text-[#17324D] sm:text-3xl">
                  Rp 1.842.000.000
                </p>
              </div>
              <div className="flex items-center gap-2">
                <DeltaText valuePct={18} />
                <span className="text-xs text-[#526675]">dari bulan lalu</span>
              </div>
            </div>

            {/* 40% Staff Sales / 60% Affiliate Split */}
            <div className="mt-5 grid grid-cols-1 gap-3 border-t border-[#EAF2F6] pt-4 sm:grid-cols-2">
              <div className="rounded-[12px] bg-[#E6F4F9] p-4">
                <p className="text-xs font-semibold text-[#245477]">
                  Staff Sales (40% Inkremental + Personal)
                </p>
                <p className="mt-1 font-mono-tabular text-lg font-bold text-[#17324D]">
                  Rp 736.800.000
                </p>
              </div>
              <div className="rounded-[12px] bg-[#EAF2F6] p-4">
                <p className="text-xs font-semibold text-[#526675]">
                  Affiliate (60% Inkremental)
                </p>
                <p className="mt-1 font-mono-tabular text-lg font-bold text-[#17324D]">
                  Rp 1.105.200.000
                </p>
              </div>
            </div>
          </div>

          {/* Status Komisi Breakdown */}
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
            <h2 className="text-base font-bold text-[#17324D]">Status Komisi</h2>
            <div className="mt-4 divide-y divide-[#EAF2F6] text-sm">
              <div className="flex items-center justify-between py-3">
                <span className="inline-flex items-center gap-2 font-medium text-[#172B3A]">
                  <CheckCircle2 className="h-4 w-4 text-[#247A55]" />
                  <span>Layak Bayar</span>
                </span>
                <span className="font-mono-tabular font-bold text-[#17324D]">
                  1.368 transaksi
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="inline-flex items-center gap-2 font-medium text-[#172B3A]">
                  <Clock className="h-4 w-4 text-[#A96816]" />
                  <span>Proses Validasi</span>
                </span>
                <span className="font-mono-tabular font-bold text-[#17324D]">
                  82 transaksi
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="inline-flex items-center gap-2 font-medium text-[#172B3A]">
                  <AlertCircle className="h-4 w-4 text-[#B23A48]" />
                  <span>Tertunda</span>
                </span>
                <span className="font-mono-tabular font-bold text-[#17324D]">
                  24 transaksi
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'perhitungan' && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-[14px] border border-[#87CEEB] bg-[#E6F4F9] p-4 text-xs text-[#17324D]">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0284C7]" />
            <p>
              <span className="font-bold">Deterministic Commission Engine:</span>{' '}
              Seluruh perhitungan menggunakan presisi Decimal dan skema terversi
              berdasarkan event produktivitas provider yang sah (bukan estimasi
              LLM). Klik baris untuk melihat audit source events.
            </p>
          </div>

          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#D8E3E9] text-xs font-semibold text-[#526675]">
                    <th className="py-3 pr-4">Staff Sales &amp; Grade</th>
                    <th className="py-3 px-4 text-right">SA Personal</th>
                    <th className="py-3 px-4 text-right">SA Affiliate</th>
                    <th className="py-3 px-4 text-right">SA Gabungan</th>
                    <th className="py-3 px-4 text-right">Basis Sales (P+40%)</th>
                    <th className="py-3 px-4 text-right">Nominal Bruto</th>
                    <th className="py-3 pl-4 text-right">Statement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAF2F6]">
                  {COMMISSION_CALCULATION_SAMPLES.map((row) => (
                    <tr key={row.id} className="hover:bg-[#F5F8FA]">
                      <td className="py-3.5 pr-4">
                        <p className="font-bold text-[#17324D]">{row.salesName}</p>
                        <p className="text-xs text-[#526675]">
                          Grade {row.grade} · {row.tierLabel}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-tabular">
                        {row.personalSA}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-tabular">
                        {row.affiliateSA}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-tabular font-semibold text-[#0284C7]">
                        {row.combinedSA}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-tabular font-semibold text-[#17324D]">
                        {row.salesAttributedTotalSA}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-tabular font-bold text-[#17324D]">
                        {formatIDR(row.grossAmount)}
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        <button
                          type="button"
                          onClick={() => onSelectCalculation(row.id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#0284C7] hover:underline whitespace-nowrap"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>Audit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'rekon' && (
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
          <h2 className="text-base font-bold text-[#17324D]">
            Rekonsiliasi Settlement Provider &amp; Ledger Komisi
          </h2>
          <p className="mt-0.5 text-xs text-[#526675]">
            Status pencocokan event aktivasi ISP dengan buku besar komisi immutable
          </p>
          <div className="mt-4 space-y-3">
            {[
              { batch: 'BATCH-KOM-2026-11A', period: '01–15 Nov 2026', matched: '842 / 842 event', status: 'Terekonsiliasi Penuh', amount: 'Rp 984.200.000' },
              { batch: 'BATCH-KOM-2026-10B', period: '16–31 Okt 2026', matched: '790 / 794 event', status: '4 Event Dalam Peninjauan', amount: 'Rp 857.800.000' },
            ].map((b) => (
              <div
                key={b.batch}
                className="flex flex-col gap-2 rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-mono-tabular text-xs font-bold text-[#0284C7]">
                    {b.batch}
                  </p>
                  <p className="text-sm font-bold text-[#17324D]">
                    Periode {b.period} · {b.matched}
                  </p>
                  <p className="text-xs text-[#526675]">{b.status}</p>
                </div>
                <p className="font-mono-tabular text-base font-bold text-[#17324D]">
                  {b.amount}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
