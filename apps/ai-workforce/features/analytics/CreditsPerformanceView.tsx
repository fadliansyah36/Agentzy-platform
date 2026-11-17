'use client';

import React, { useMemo, useState } from 'react';
import {
  Coins,
  BarChart3,
  TrendingUp,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import type { AIWorkerEntity } from '../../lib/ai-workforce-types';
import { formatCreditsID } from '../../services/ai-workforce-service';

export function CreditsPerformanceView({
  aiWorkers,
  aiCreditsBalance,
  monthlySoftLimit,
  monthlyHardLimit,
  onUpdateSoftLimit,
  onUpdateHardLimit,
  onOpenTopUp,
  onNotify,
}: {
  aiWorkers: AIWorkerEntity[];
  aiCreditsBalance: number;
  monthlySoftLimit: number;
  monthlyHardLimit: number;
  onUpdateSoftLimit: (val: number) => void;
  onUpdateHardLimit: (val: number) => void;
  onOpenTopUp: () => void;
  onNotify: (msg: string) => void;
}) {
  const [perfTab, setPerfTab] = useState<'AI Worker' | 'Workflow' | 'Tim'>('AI Worker');

  const totalUsedCredits = useMemo(
    () => aiWorkers.reduce((sum, w) => sum + w.creditsUsed, 0),
    [aiWorkers]
  );

  const usagePct = Math.min(
    100,
    Math.round((totalUsedCredits / Math.max(1, monthlyHardLimit)) * 100)
  );

  return (
    <div className="space-y-5">
      {/* Header (Screens 19, 20, 40, 41, 44) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-[#0284C7]">
            Screens 19, 20, 40, 41 &amp; 44 · AI Credits, Budget &amp; Business Impact
          </p>
          <h1 className="text-xl font-bold text-[#17324D] sm:text-2xl">
            AI Credits, Budget &amp; Analitik Performa
          </h1>
          <p className="mt-0.5 text-xs text-[#526675]">
            Kendalikan alokasi kuota AI Credits per divisi &amp; worker serta ukur dampak konversi bisnisnya.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenTopUp}
          className="inline-flex h-11 sm:h-10 w-full sm:w-auto items-center justify-center gap-1.5 rounded-[10px] bg-[#0284C7] px-4 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Top Up AI Credits</span>
        </button>
      </div>

      {/* Screens 19 & 40: AI Credits & Budget Allocation */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <section className="lg:col-span-6 rounded-[14px] border border-[#D8E3E9] bg-white p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-[#526675]">
                Saldo AI Credits Tersedia
              </p>
              <p className="mt-1 font-mono-tabular text-2xl font-bold text-[#17324D] sm:text-3xl">
                {formatCreditsID(aiCreditsBalance)}
              </p>
              <p className="mt-0.5 text-xs text-[#526675]">
                Terpakai bulan ini:{' '}
                <strong className="font-mono-tabular text-[#0284C7]">
                  {formatCreditsID(totalUsedCredits)}
                </strong>{' '}
                ({usagePct}% dari Hard Limit)
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#E6F4F9] text-[#0284C7]">
              <Coins className="h-6 w-6" />
            </div>
          </div>

          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#EAF2F6]">
            <div
              className="h-full rounded-full bg-[#0284C7]"
              style={{ width: `${usagePct}%` }}
            />
          </div>

          {/* Per Divisi & Per AI Worker Allocation */}
          <div className="space-y-2.5 border-t border-[#EAF2F6] pt-3">
            <h3 className="text-xs font-bold text-[#17324D]">
              Alokasi Pemakaian per Divisi &amp; AI Worker
            </h3>
            {[
              { label: 'Sales, Affiliate & Content Studio', used: 350000, pct: 47 },
              { label: 'Operasional Teknis & Work Order', used: 240000, pct: 32 },
              { label: 'Customer Care & Maintenance', used: 120000, pct: 16 },
              { label: 'Lainnya & Cadangan', used: 39500, pct: 5 },
            ].map((div) => (
              <div key={div.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#172B3A]">{div.label}</span>
                  <span className="font-mono-tabular font-semibold text-[#17324D]">
                    {formatCreditsID(div.used)} ({div.pct}%)
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EAF2F6]">
                  <div
                    className="h-full rounded-full bg-[#245477]"
                    style={{ width: `${div.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Soft Limit & Hard Limit Controls */}
          <div className="grid grid-cols-1 gap-3 border-t border-[#EAF2F6] pt-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-[#526675]">
                Soft Limit Bulanan (Alert 80%)
              </label>
              <input
                type="number"
                step={50000}
                value={monthlySoftLimit}
                onChange={(e) => onUpdateSoftLimit(Number(e.target.value) || 0)}
                onBlur={() => onNotify('Soft limit AI Credits disimpan')}
                className="h-9 w-full rounded-[9px] border border-[#B8C9D3] px-3 font-mono-tabular text-xs font-bold text-[#17324D]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-[#526675]">
                Hard Limit Bulanan
              </label>
              <input
                type="number"
                step={50000}
                value={monthlyHardLimit}
                onChange={(e) => onUpdateHardLimit(Number(e.target.value) || 0)}
                onBlur={() => onNotify('Hard limit AI Credits disimpan')}
                className="h-9 w-full rounded-[9px] border border-[#B8C9D3] px-3 font-mono-tabular text-xs font-bold text-[#17324D]"
              />
            </div>
          </div>
        </section>

        {/* Screen 44: Workflow Analytics & Business Impact Funnel */}
        <section className="lg:col-span-6 rounded-[14px] border border-[#D8E3E9] bg-white p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#EAF2F6] pb-3">
            <div>
              <p className="text-xs font-semibold text-[#0284C7]">
                Screen 44 · Business Impact
              </p>
              <h2 className="text-sm font-bold text-[#17324D]">
                Dampak Bisnis: Workflow Lead to Install
              </h2>
            </div>
            <TrendingUp className="h-5 w-5 text-[#247A55]" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="rounded-[10px] bg-[#E6F4F9] p-3">
              <p className="text-[11px] text-[#526675]">Konversi Akhir</p>
              <p className="mt-1 font-mono-tabular text-lg font-bold text-[#17324D]">
                35,0%
              </p>
              <p className="font-mono-tabular text-[11px] font-semibold text-[#247A55]">
                +6,4% vs lalu
              </p>
            </div>
            <div className="rounded-[10px] bg-[#F5F8FA] p-3 border border-[#D8E3E9]">
              <p className="text-[11px] text-[#526675]">Waktu Siklus</p>
              <p className="mt-1 font-mono-tabular text-lg font-bold text-[#17324D]">
                2,8 hari
              </p>
              <p className="font-mono-tabular text-[11px] font-semibold text-[#247A55]">
                18% lebih cepat
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1 rounded-[10px] bg-[#247A55]/10 p-3">
              <p className="text-[11px] text-[#526675]">Revenue Terkait</p>
              <p className="mt-1 font-mono-tabular text-lg font-bold text-[#247A55]">
                Rp 4,52 M
              </p>
              <p className="text-[11px] text-[#526675]">Kuartal Berjalan</p>
            </div>
          </div>

          {/* Funnel Bars */}
          <div className="space-y-2.5 pt-1">
            {[
              { stage: 'Lead Masuk (Sosmed, Affiliate & Form)', count: '8.920', pct: 100, color: 'bg-[#17324D]' },
              { stage: 'Terkualifikasi AI (63,2%)', count: '5.640', pct: 63, color: 'bg-[#245477]' },
              { stage: 'Order Disepakati Staff Sales', count: '3.280', pct: 37, color: 'bg-[#0284C7]' },
              { stage: 'Aktivasi Pelanggan Selesai', count: '3.120', pct: 35, color: 'bg-[#247A55]' },
            ].map((row) => (
              <div key={row.stage} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#17324D]">{row.stage}</span>
                  <span className="font-mono-tabular font-bold text-[#17324D]">
                    {row.count}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#EAF2F6]">
                  <div
                    className={`h-full rounded-full ${row.color}`}
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Screens 20 & 41: Performance Analytics */}
      <section className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 space-y-4">
        <div className="flex flex-col gap-3 border-b border-[#EAF2F6] pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#0284C7]" />
            <h2 className="text-sm font-bold text-[#17324D]">
              Analitik Performa AI Worker &amp; Workflow (6 Bulan)
            </h2>
          </div>

          <div className="grid w-full grid-cols-3 gap-1 rounded-[9px] border border-[#D8E3E9] bg-[#F5F8FA] p-0.5 sm:inline-flex sm:w-auto">
            {(['AI Worker', 'Workflow', 'Tim'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setPerfTab(t)}
                className={`h-8 sm:h-7 rounded-[7px] px-2 sm:px-3 text-xs font-semibold truncate ${
                  perfTab === t
                    ? 'bg-white text-[#17324D] shadow-xs'
                    : 'text-[#526675]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] p-3">
            <p className="text-[11px] text-[#526675]">Success Rate ({perfTab})</p>
            <p className="mt-1 font-mono-tabular text-xl font-bold text-[#247A55]">
              98,6%
            </p>
          </div>
          <div className="rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] p-3">
            <p className="text-[11px] text-[#526675]">Kualitas Output</p>
            <p className="mt-1 font-mono-tabular text-xl font-bold text-[#17324D]">
              4,7 / 5
            </p>
          </div>
          <div className="rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] p-3">
            <p className="text-[11px] text-[#526675]">Rata-rata Durasi</p>
            <p className="mt-1 font-mono-tabular text-xl font-bold text-[#0284C7]">
              3,4 mnt
            </p>
          </div>
          <div className="rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] p-3">
            <p className="text-[11px] text-[#526675]">Biaya per Tugas</p>
            <p className="mt-1 font-mono-tabular text-xl font-bold text-[#17324D]">
              Rp 1.250
            </p>
          </div>
        </div>

        {/* 6-Month Execution Trend */}
        <div className="grid grid-cols-6 gap-1.5 sm:gap-3 items-end h-36 pt-3">
          {[
            { month: 'Jan', val: 62 },
            { month: 'Feb', val: 68 },
            { month: 'Mar', val: 74 },
            { month: 'Apr', val: 81 },
            { month: 'Mei', val: 89 },
            { month: 'Jun', val: 96 },
          ].map((m) => (
            <div key={m.month} className="flex flex-col items-center gap-1.5 h-full justify-end">
              <span className="font-mono-tabular text-[10px] sm:text-[11px] font-bold text-[#17324D]">
                {m.val}%
              </span>
              <div
                className="w-full max-w-[42px] rounded-t-[8px] bg-[#0284C7]"
                style={{ height: `${m.val}%` }}
              />
              <span className="text-[10px] sm:text-[11px] font-medium text-[#526675]">
                {m.month}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-[10px] bg-[#E6F4F9] p-3 text-xs text-[#17324D]">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#247A55]" />
          <span>
            Efisiensi waktu Staff Sales meningkat signifikan berkat dukungan Content Studio dan otomatisasi kualifikasi prospek.
          </span>
        </div>
      </section>
    </div>
  );
}
