'use client';

import React from 'react';
import {
  Coins,
  Plus,
  History,
  Sliders,
  ArrowUpRight,
  Bot,
} from 'lucide-react';
import { CorporatePageHeader } from '../../components/data-display/CorporateDataDisplay';
import { formatNumberID } from '../../lib/corporate-data';
import type { AIWorkerRecord } from '../../lib/corporate-types';

export function AICreditsCenterView({
  balance,
  monthlyBudgetLimit,
  aiWorkers,
  onOpenTopUp,
  onOpenHistory,
  onOpenBudgetSettings,
  onBack,
}: {
  balance: number;
  monthlyBudgetLimit: number;
  aiWorkers: AIWorkerRecord[];
  onOpenTopUp: () => void;
  onOpenHistory: () => void;
  onOpenBudgetSettings: () => void;
  onBack: () => void;
}) {
  const usedThisMonth = 749500;
  const usedPct = Math.min(100, Math.round((usedThisMonth / monthlyBudgetLimit) * 100));
  const estimatedTokens = Math.round(balance * 0.25);

  return (
    <div className="space-y-5">
      <CorporatePageHeader
        title="AI Credits Center"
        subtitle="Dompet AI Credits tenant, riwayat ledger transaksi, batas budget, dan estimasi pemakaian"
        onBack={onBack}
        actions={
          <button
            type="button"
            onClick={onOpenBudgetSettings}
            className="inline-flex h-10 items-center gap-1.5 rounded-[10px] border border-[#D8E3E9] bg-white px-3.5 text-xs font-semibold text-[#17324D] hover:bg-[#EAF2F6] whitespace-nowrap"
          >
            <Sliders className="h-3.5 w-3.5 text-[#0284C7]" />
            <span>Atur Limit &amp; Auto Top-Up</span>
          </button>
        }
      />

      {/* Wallet Card + Top Up & Riwayat (Matches Screen 11) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-[#526675]">
                Saldo AI Credits
              </p>
              <p className="mt-1 font-mono-tabular text-3xl font-bold text-[#17324D]">
                {formatNumberID(balance)}
              </p>
              <p className="mt-1 font-mono-tabular text-xs text-[#718391]">
                ≈ {formatNumberID(estimatedTokens)} token
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E6F4F9] text-[#0284C7]">
              <Coins className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onOpenTopUp}
              className="flex h-11 items-center justify-center gap-1.5 rounded-[10px] bg-[#0284C7] text-xs font-bold text-white transition hover:bg-[#0369A1]"
            >
              <Plus className="h-4 w-4" />
              <span>Top Up</span>
            </button>
            <button
              type="button"
              onClick={onOpenHistory}
              className="flex h-11 items-center justify-center gap-1.5 rounded-[10px] border border-[#D8E3E9] bg-white text-xs font-bold text-[#17324D] transition hover:bg-[#EAF2F6]"
            >
              <History className="h-4 w-4 text-[#0284C7]" />
              <span>Riwayat</span>
            </button>
          </div>

          <div className="mt-5 border-t border-[#EAF2F6] pt-4">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-[#526675]">Penggunaan Bulan Ini</span>
              <span className="font-mono-tabular text-[#17324D]">
                {formatNumberID(usedThisMonth)} ({usedPct}%)
              </span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#EAF2F6]">
              <div
                className="h-full rounded-full bg-[#0284C7]"
                style={{ width: `${usedPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Pemakaian per AI Worker + Estimasi Bulan Depan */}
        <div className="flex flex-col justify-between rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-7">
          <div>
            <h2 className="text-base font-bold text-[#17324D]">
              Pemakaian per AI Worker
            </h2>
            <p className="mt-0.5 text-xs text-[#526675]">
              Unit metering internal AI Credits (bukan token mentah LLM atau uang tunai)
            </p>

            <div className="mt-4 divide-y divide-[#EAF2F6]">
              {aiWorkers.slice(0, 4).map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-2.5">
                    <Bot className="h-4 w-4 text-[#0284C7]" />
                    <div>
                      <p className="text-sm font-semibold text-[#17324D]">
                        {w.name}
                      </p>
                      <p className="text-[11px] text-[#718391]">
                        {w.department} · {w.tokensUsedLabel} tokens
                      </p>
                    </div>
                  </div>
                  <span className="font-mono-tabular text-sm font-bold text-[#17324D]">
                    {formatNumberID(w.creditsUsed)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 rounded-[12px] border border-[#87CEEB] bg-[#E6F4F9] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-[#245477]">
                Estimasi Bulan Depan (Label: Proyeksi Estimasi)
              </p>
              <p className="font-mono-tabular text-xl font-bold text-[#17324D]">
                ≈ 1.320.000 Credits
              </p>
            </div>
            <span className="inline-flex items-center gap-1 font-mono-tabular text-xs font-bold text-[#247A55]">
              <ArrowUpRight className="h-4 w-4" />
              +6% dari bulan ini
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
