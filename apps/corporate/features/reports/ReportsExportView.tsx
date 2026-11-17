'use client';

import React, { useMemo, useState } from 'react';
import {
  Search,
  ChevronRight,
  BarChart3,
  Users,
  Wallet,
  Wrench,
  Bot,
  FileSpreadsheet,
  Award,
  Download,
} from 'lucide-react';
import { CorporatePageHeader } from '../../components/data-display/CorporateDataDisplay';
import type { ReportExportHistory } from '../../lib/corporate-types';

const REPORT_CATEGORIES = [
  {
    id: 'Penjualan & Aktivasi',
    title: 'Laporan Penjualan & Aktivasi',
    desc: 'Rekap lead masuk, order tervalidasi provider, dan aktivasi per produk FTTH/FWA.',
    icon: BarChart3,
  },
  {
    id: 'Performa Tim',
    title: 'Laporan Performa Tim',
    desc: 'Pencapaian produktivitas Staff Sales, jaringan Affiliate, Teknisi, dan perbandingan wilayah.',
    icon: Users,
  },
  {
    id: 'Komisi & Insentif',
    title: 'Laporan Komisi & Insentif',
    desc: 'Rincian kalkulasi SA deterministik, pembagian 60/40, dan statement siap bayar.',
    icon: Wallet,
  },
  {
    id: 'Operasional Teknis',
    title: 'Laporan Operasional Teknis',
    desc: 'Statistik Work Order, durasi instalasi rata-rata, First-Time-Fix, dan audit QC.',
    icon: Wrench,
  },
  {
    id: 'Penggunaan AI & Credits',
    title: 'Laporan Penggunaan AI & Credits',
    desc: 'Konsumsi AI Credits, pemakaian token per AI Worker, dan proyeksi anggaran.',
    icon: Bot,
  },
  {
    id: 'Keuangan',
    title: 'Laporan Keuangan',
    desc: 'Rekap faktur Agentzy, status pembayaran VA/RTGS, dan rekonsiliasi settlement.',
    icon: FileSpreadsheet,
  },
  {
    id: 'KPI & SLA',
    title: 'Laporan KPI & SLA',
    desc: 'Kepatuhan target kontraktual SOW, kepatuhan SLA, dan skor kinerja perusahaan.',
    icon: Award,
  },
];

export function ReportsExportView({
  reportHistory,
  onSelectCategory,
  onBack,
}: {
  reportHistory: ReportExportHistory[];
  onSelectCategory: (category: string) => void;
  onBack: () => void;
}) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return REPORT_CATEGORIES;
    return REPORT_CATEGORIES.filter(
      (c) =>
        c.title.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="space-y-5">
      <CorporatePageHeader
        title="Reports & Export"
        subtitle="Pusat pembuatan laporan terstruktur (CSV, XLSX, PDF) dan riwayat unduhan"
        onBack={onBack}
      />

      {/* Search Bar (Matches Screen 15) */}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5F879E]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari laporan..."
          className="h-11 w-full rounded-[10px] border border-[#D8E3E9] bg-white pl-10 pr-4 text-sm text-[#172B3A] outline-none focus:border-[#0284C7]"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-7">
          <h2 className="text-base font-bold text-[#17324D]">
            Kategori Laporan
          </h2>
          <div className="mt-3 divide-y divide-[#EAF2F6]">
            {filtered.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(cat.id)}
                  className="flex w-full items-center justify-between gap-4 py-3.5 text-left transition hover:bg-[#F5F8FA] rounded-lg px-2"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#0284C7]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#17324D]">
                        {cat.title}
                      </p>
                      <p className="mt-0.5 text-xs text-[#526675]">{cat.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#718391]" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-5">
          <h2 className="text-base font-bold text-[#17324D]">
            Riwayat Ekspor Terakhir
          </h2>
          <p className="mt-0.5 text-xs text-[#526675]">
            Setiap ekspor dicatat ke dalam audit log akses data tenant
          </p>
          <div className="mt-4 divide-y divide-[#EAF2F6]">
            {reportHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 py-3"
              >
                <div>
                  <p className="text-xs font-bold text-[#17324D]">{item.title}</p>
                  <p className="mt-0.5 text-[11px] text-[#718391]">
                    {item.generatedAt} · {item.generatedBy}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectCategory(item.category)}
                  className="inline-flex items-center gap-1 rounded-[8px] border border-[#D8E3E9] bg-[#F5F8FA] px-2.5 py-1 text-[11px] font-bold text-[#0284C7] hover:bg-[#E6F4F9] whitespace-nowrap"
                >
                  <Download className="h-3 w-3" />
                  <span>{item.format}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
