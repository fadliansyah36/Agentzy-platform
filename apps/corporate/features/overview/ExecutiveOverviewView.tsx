'use client';

import React from 'react';
import {
  Users,
  Bot,
  UserPlus,
  ShoppingBag,
  Coins,
  FileWarning,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import { formatIDR, formatNumberID } from '../../lib/corporate-data';
import type { CorporateSectionId, CorporateTenant } from '../../lib/corporate-types';
import { DeltaText } from '../../components/data-display/CorporateDataDisplay';

export function ExecutiveOverviewView({
  tenant,
  aiCreditsBalance,
  snapshot,
  onNavigate,
  onOpenTopUp,
  onOpenContractModal,
}: {
  tenant: CorporateTenant;
  aiCreditsBalance: number;
  snapshot: {
    humanWorkers: number;
    staffSalesCount: number;
    affiliateCount: number;
    technicianCount: number;
    humanDeltaPct: number;
    aiWorkers: number;
    aiDeltaPct: number;
    leadsCount: number;
    leadsDeltaPct: number;
    ordersCount: number;
    ordersDeltaPct: number;
    kpiTarget: number;
    kpiActual: number;
    kpiAchievementPct: number;
    productivityPct: number;
    slaPct: number;
    corporateRevenueIdr: number;
    agentzyServiceFeeIdr: number;
    contractExpiryDays: number;
    sourceFreshness: { status: string; computedAt: string };
  };
  onNavigate: (section: CorporateSectionId) => void;
  onOpenTopUp: () => void;
  onOpenContractModal: () => void;
}) {
  const estimatedTokens = Math.round(aiCreditsBalance * 0.25);

  return (
    <div className="space-y-5">
      {/* Greeting Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#17324D] sm:text-2xl">
            Halo, {tenant.name}
          </h1>
          <p className="text-xs text-[#526675] sm:text-sm">
            Executive Overview · Ringkasan Kinerja Human &amp; AI Workforce
          </p>
        </div>
        <p className="text-[11px] text-[#718391]">
          Freshness: Near-Realtime · Diperbarui {snapshot.sourceFreshness.computedAt}
        </p>
      </div>

      {/* Top 4 KPI Stat Cards (2x2 mobile, 4-col desktop) */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <button
          type="button"
          onClick={() => onNavigate('human-workforce')}
          className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 text-left transition hover:border-[#87CEEB]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#526675]">Human Workforce</span>
            <Users className="h-4 w-4 text-[#0284C7]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono-tabular text-2xl font-bold text-[#17324D]">
              {formatNumberID(snapshot.humanWorkers)}
            </span>
            <DeltaText valuePct={snapshot.humanDeltaPct} />
          </div>
          <p className="mt-1.5 font-mono-tabular text-[11px] text-[#526675]">
            {snapshot.staffSalesCount} Staff Sales · {snapshot.affiliateCount} Affiliate · {snapshot.technicianCount} Teknisi
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('ai-workforce')}
          className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 text-left transition hover:border-[#87CEEB]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#526675]">AI Worker</span>
            <Bot className="h-4 w-4 text-[#0284C7]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono-tabular text-2xl font-bold text-[#17324D]">
              {formatNumberID(snapshot.aiWorkers)}
            </span>
            <DeltaText valuePct={snapshot.aiDeltaPct} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('sales-affiliate')}
          className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 text-left transition hover:border-[#87CEEB]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#526675]">Lead</span>
            <UserPlus className="h-4 w-4 text-[#0284C7]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono-tabular text-2xl font-bold text-[#17324D]">
              {formatNumberID(snapshot.leadsCount)}
            </span>
            <DeltaText valuePct={snapshot.leadsDeltaPct} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('analytics')}
          className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 text-left transition hover:border-[#87CEEB]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#526675]">Order</span>
            <ShoppingBag className="h-4 w-4 text-[#0284C7]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono-tabular text-2xl font-bold text-[#17324D]">
              {formatNumberID(snapshot.ordersCount)}
            </span>
            <DeltaText valuePct={snapshot.ordersDeltaPct} />
          </div>
        </button>
      </div>

      {/* Middle Row: Pencapaian KPI + Produktivitas & SLA */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-[#17324D]">
                Pencapaian KPI (Bulan Ini)
              </h2>
              <p className="mt-0.5 text-xs text-[#526675]">
                Basis: Aktivasi pelanggan tervalidasi provider
              </p>
            </div>
            <span className="font-mono-tabular text-2xl font-bold text-[#247A55]">
              {snapshot.kpiAchievementPct}%
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-[#526675]">Target</span>
              <p className="font-mono-tabular text-xl font-bold text-[#17324D]">
                {formatNumberID(snapshot.kpiTarget)}
              </p>
            </div>
            <div>
              <span className="text-xs text-[#526675]">Aktual</span>
              <p className="font-mono-tabular text-xl font-bold text-[#17324D]">
                {formatNumberID(snapshot.kpiActual)}
              </p>
            </div>
          </div>

          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-[#EAF2F6]">
            <div
              className="h-full rounded-full bg-[#247A55]"
              style={{ width: `${Math.min(snapshot.kpiAchievementPct, 100)}%` }}
            />
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[#EAF2F6] pt-3">
            <span className="text-xs text-[#526675]">
              Unit: Aktivasi · Sumber: Order Activation Ledger
            </span>
            <button
              type="button"
              onClick={() => onNavigate('kpi-performance')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#0284C7] hover:underline whitespace-nowrap shrink-0"
            >
              <span>Detail KPI</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:col-span-5">
          <button
            type="button"
            onClick={() => onNavigate('kpi-performance')}
            className="flex flex-col justify-between rounded-[14px] border border-[#D8E3E9] bg-white p-5 text-left transition hover:border-[#87CEEB]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#526675]">
                Produktivitas
              </span>
              <TrendingUp className="h-4 w-4 text-[#247A55]" />
            </div>
            <div className="my-3">
              <p className="font-mono-tabular text-3xl font-bold text-[#247A55]">
                {snapshot.productivityPct}%
              </p>
              <p className="mt-1 text-xs text-[#526675]">
                Terhadap baseline SA bulanan
              </p>
            </div>
            <span className="text-xs font-semibold text-[#0284C7]">
              Lihat Leaderboard →
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('technical-ops')}
            className="flex flex-col justify-between rounded-[14px] border border-[#D8E3E9] bg-white p-5 text-left transition hover:border-[#87CEEB]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#526675]">SLA</span>
              <ShieldCheck className="h-4 w-4 text-[#0284C7]" />
            </div>
            <div className="my-3">
              <p className="font-mono-tabular text-3xl font-bold text-[#17324D]">
                {String(snapshot.slaPct).replace('.', ',')}%
              </p>
              <p className="mt-1 text-xs text-[#526675]">
                Penyelesaian Work Order tepat waktu
              </p>
            </div>
            <span className="text-xs font-semibold text-[#0284C7]">
              Pantau Lapangan →
            </span>
          </button>
        </div>
      </div>

      {/* Financial & Operational Governance Cards (Separating ISP Revenue vs Agentzy Service Fee per PRD 1.3) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => onNavigate('commission')}
          className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 text-left transition hover:border-[#87CEEB]"
        >
          <p className="text-xs font-medium text-[#526675]">Pendapatan (ISP)</p>
          <p className="mt-2 font-mono-tabular text-xl font-bold text-[#17324D]">
            Rp 5,42 M
          </p>
          <p className="mt-1 text-[11px] text-[#718391]">
            Nilai akuisisi hak corporate ({formatIDR(snapshot.corporateRevenueIdr)})
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('invoices')}
          className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 text-left transition hover:border-[#87CEEB]"
        >
          <p className="text-xs font-medium text-[#526675]">Biaya Layanan Agentzy</p>
          <p className="mt-2 font-mono-tabular text-xl font-bold text-[#17324D]">
            Rp 412 jt
          </p>
          <p className="mt-1 text-[11px] text-[#718391]">
            SaaS Platform &amp; Managed Services
          </p>
        </button>

        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#526675]">AI Credits</span>
            <Coins className="h-4 w-4 text-[#0284C7]" />
          </div>
          <p className="mt-2 font-mono-tabular text-xl font-bold text-[#17324D]">
            {formatNumberID(aiCreditsBalance)}
          </p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="font-mono-tabular text-[11px] text-[#718391]">
              ≈ {formatNumberID(estimatedTokens)} token
            </span>
            <button
              type="button"
              onClick={onOpenTopUp}
              className="text-xs font-semibold text-[#0284C7] hover:underline whitespace-nowrap"
            >
              Top Up
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenContractModal}
          className="rounded-[14px] border border-[#A96816]/30 bg-[#FFFBF2] p-4 text-left transition hover:border-[#A96816]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#A96816]">Kontrak</span>
            <FileWarning className="h-4 w-4 text-[#A96816]" />
          </div>
          <p className="mt-2 text-base font-bold text-[#17324D]">
            Berakhir {snapshot.contractExpiryDays} hari lagi
          </p>
          <p className="mt-1 text-[11px] font-medium text-[#A96816]">
            Tinjau perpanjangan &amp; SOW →
          </p>
        </button>
      </div>

      {/* Quick Operational Shortcuts for Desktop & Mobile */}
      <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#17324D]">
              Akses Cepat Modul Kemitraan
            </h2>
            <p className="text-xs text-[#526675]">
              Buka rincian analitik, perhitungan komisi 60/40, atau ekspor laporan keuangan.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('analytics')}
              className="rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] px-3.5 py-2 text-xs font-semibold text-[#17324D] hover:bg-[#E6F4F9] whitespace-nowrap shrink-0"
            >
              Business Analytics
            </button>
            <button
              type="button"
              onClick={() => onNavigate('ai-credits')}
              className="rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] px-3.5 py-2 text-xs font-semibold text-[#17324D] hover:bg-[#E6F4F9] whitespace-nowrap shrink-0"
            >
              AI Credits Center
            </button>
            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className="rounded-[10px] bg-[#17324D] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#245477] whitespace-nowrap shrink-0"
            >
              Reports &amp; Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
