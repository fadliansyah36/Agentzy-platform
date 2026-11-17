'use client';

import React from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckSquare,
  Coins,
  GitBranch,
  Inbox,
  Sparkles,
  Target,
  Wand2,
} from 'lucide-react';
import type {
  AIWMTenant,
  AIWorkerEntity,
  AIWorkforceSectionId,
  ApprovalInboxItem,
  WorkflowRunItem,
} from '../../lib/ai-workforce-types';
import { formatCreditsID } from '../../services/ai-workforce-service';

export function AIWorkforceOverviewView({
  tenant,
  aiWorkers,
  runs,
  approvals,
  aiCreditsBalance,
  monthlyHardLimit,
  onNavigate,
  onOpenTopUp,
}: {
  tenant: AIWMTenant;
  aiWorkers: AIWorkerEntity[];
  runs: WorkflowRunItem[];
  approvals: ApprovalInboxItem[];
  aiCreditsBalance: number;
  monthlyHardLimit: number;
  onNavigate: (section: AIWorkforceSectionId) => void;
  onOpenTopUp: () => void;
}) {
  const activeWorkersCount = aiWorkers.filter((w) => w.status === 'Aktif').length;
  const activeRunsCount = runs.filter(
    (r) => r.status === 'Running' || r.status === 'Menunggu Approval'
  ).length;
  const pendingApprovals = approvals.filter((a) => a.status === 'Menunggu');
  const failedRuns = runs.filter((r) => r.status === 'Gagal');
  const creditsUsed = 749500;
  const usagePct = Math.min(100, Math.round((creditsUsed / monthlyHardLimit) * 100));

  return (
    <div className="space-y-6">
      {/* Header Welcome */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold text-[#0284C7]">
            AI Workforce Overview · {tenant.name}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#17324D]">
            Halo, {tenant.name}
          </h1>
          <p className="mt-1 text-xs text-[#526675]">
            Ringkasan operasional AI Worker, Workflow Runs, persetujuan tim, dan
            fasilitas Generate Content Support Staff Sales.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('content-studio')}
            className="inline-flex h-11 sm:h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-[10px] bg-[#0284C7] px-4 text-xs font-semibold text-white transition hover:bg-[#0369A1] whitespace-nowrap"
          >
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>Buka Generate Content (Sales)</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('worker-studio')}
            className="inline-flex h-11 sm:h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-[10px] border border-[#B8C9D3] bg-white px-4 text-xs font-semibold text-[#17324D] transition hover:bg-[#E6F4F9] whitespace-nowrap"
          >
            <Wand2 className="h-4 w-4 shrink-0 text-[#0284C7]" />
            <span>+ Buat AI Worker</span>
          </button>
        </div>
      </div>

      {/* KPI Strip (Screen 3) */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => onNavigate('workers')}
          className="rounded-[14px] border border-[#D8E3E9] bg-white p-3.5 sm:p-4 text-left transition hover:border-[#0284C7] min-w-0"
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] sm:text-xs font-semibold text-[#526675] truncate">
              AI Worker Aktif
            </span>
            <Bot className="h-4 w-4 shrink-0 text-[#0284C7]" />
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-1.5 sm:gap-2">
            <span className="font-mono-tabular text-xl sm:text-2xl font-bold text-[#17324D]">
              {activeWorkersCount}
            </span>
            <span className="font-mono-tabular text-[11px] sm:text-xs font-semibold text-[#247A55]">
              +12%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#718391] leading-snug">
            Dari total {aiWorkers.length} registry terkelola
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('runs')}
          className="rounded-[14px] border border-[#D8E3E9] bg-white p-3.5 sm:p-4 text-left transition hover:border-[#0284C7] min-w-0"
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] sm:text-xs font-semibold text-[#526675] truncate">
              Run Aktif &amp; Antrean
            </span>
            <Activity className="h-4 w-4 shrink-0 text-[#0284C7]" />
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-1.5 sm:gap-2">
            <span className="font-mono-tabular text-xl sm:text-2xl font-bold text-[#17324D]">
              {activeRunsCount + 83}
            </span>
            <span className="font-mono-tabular text-[11px] sm:text-xs font-semibold text-[#247A55]">
              +18%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#718391] leading-snug">
            {runs.filter((r) => r.status === 'Menunggu Approval').length} menunggu approval
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('tasks-collab')}
          className="rounded-[14px] border border-[#D8E3E9] bg-white p-3.5 sm:p-4 text-left transition hover:border-[#0284C7] min-w-0"
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] sm:text-xs font-semibold text-[#526675] truncate">
              Tugas Hari Ini
            </span>
            <CheckSquare className="h-4 w-4 shrink-0 text-[#247A55]" />
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-1.5 sm:gap-2">
            <span className="font-mono-tabular text-xl sm:text-2xl font-bold text-[#17324D]">
              456
            </span>
            <span className="font-mono-tabular text-[11px] sm:text-xs font-semibold text-[#0284C7]">
              78%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#718391] leading-snug">
            Konten Sales, Leads &amp; WO
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('analytics-credits')}
          className="rounded-[14px] border border-[#D8E3E9] bg-white p-3.5 sm:p-4 text-left transition hover:border-[#0284C7] min-w-0"
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] sm:text-xs font-semibold text-[#526675] truncate">
              Goal Bulanan
            </span>
            <Target className="h-4 w-4 shrink-0 text-[#A96816]" />
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-1.5 sm:gap-2">
            <span className="font-mono-tabular text-xl sm:text-2xl font-bold text-[#17324D]">
              12
            </span>
            <span className="font-mono-tabular text-[11px] sm:text-xs font-semibold text-[#247A55]">
              75%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#718391] leading-snug">
            SLA rata-rata 98,6% bulan ini
          </p>
        </button>
      </div>

      {/* Main Split: AI Credits Meter + Peringatan & Spotlight Content Studio */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* AI Credits Usage Bar & Active Workers */}
        <div className="space-y-5 lg:col-span-7 min-w-0">
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-[#0284C7]" />
                <h2 className="text-sm font-bold text-[#17324D]">
                  Pemakaian AI Credits Bulan Ini
                </h2>
              </div>
              <button
                type="button"
                onClick={onOpenTopUp}
                className="text-xs font-semibold text-[#0284C7] hover:underline py-1"
              >
                + Top Up Credits
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-baseline justify-between gap-1 text-xs">
              <span className="font-mono-tabular font-bold text-[#17324D]">
                {formatCreditsID(aiCreditsBalance)} saldo · Terpakai{' '}
                {formatCreditsID(creditsUsed)} / {formatCreditsID(monthlyHardLimit)}
              </span>
              <span className="font-mono-tabular font-bold text-[#0284C7]">
                {usagePct}%
              </span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#EAF2F6]">
              <div
                className="h-full rounded-full bg-[#0284C7] transition-all"
                style={{ width: `${usagePct}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-[#526675]">
              Termasuk pemakaian AI Sales Assistant, Generate Content Studio, Lead
              Qualification, dan Work Order Coordinator.
            </p>
          </div>

          {/* Spotlight: Staff Sales Content Studio */}
          <div className="rounded-[14px] border border-[#87CEEB] bg-[#E6F4F9]/60 p-4 sm:p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#0284C7]">
                  Fasilitas Support Staff Sales &amp; Affiliate
                </p>
                <h2 className="mt-1 text-base font-bold text-[#17324D]">
                  Chat &amp; Artifact Studio: Generate Video, Design, Gambar &amp; Dokumen
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-[#526675]">
                  Bantu Staff Sales membuat naskah Reels/TikTok, desain flyer promo,
                  konsep visual iklan, dan proposal penawaran B2B dalam satu ruang
                  kerja interaktif.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('content-studio')}
                className="inline-flex h-11 sm:h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-[10px] bg-[#17324D] px-4 text-xs font-semibold text-white transition hover:bg-[#245477] whitespace-nowrap shrink-0"
              >
                <Sparkles className="h-4 w-4 text-[#87CEEB]" />
                <span>Mulai Buat Konten</span>
              </button>
            </div>
          </div>

          {/* Quick Registry Preview */}
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
            <div className="flex items-center justify-between border-b border-[#EAF2F6] pb-3">
              <h2 className="text-sm font-bold text-[#17324D]">
                AI Worker Teratas
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('workers')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0284C7] hover:underline"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-3 divide-y divide-[#EAF2F6]">
              {aiWorkers.slice(0, 4).map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-[#17324D]">
                      {w.name}{' '}
                      <span className="font-mono-tabular font-normal text-[#718391]">
                        {w.version}
                      </span>
                    </p>
                    <p className="truncate text-[11px] text-[#526675]">
                      {w.subtitle}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      w.status === 'Aktif' ? 'text-[#247A55]' : 'text-[#A96816]'
                    }`}
                  >
                    {w.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Peringatan + Approval & Workflow Snapshot */}
        <div className="space-y-5 lg:col-span-5 min-w-0">
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 border-b border-[#EAF2F6] pb-3">
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="h-4 w-4 shrink-0 text-[#A96816]" />
                <h2 className="truncate text-sm font-bold text-[#17324D]">
                  Peringatan &amp; Tindak Lanjut
                </h2>
              </div>
              <span className="font-mono-tabular shrink-0 text-xs font-bold text-[#B23A48]">
                {pendingApprovals.length + failedRuns.length} item
              </span>
            </div>

            <div className="mt-3 space-y-2.5">
              <button
                type="button"
                onClick={() => onNavigate('approvals')}
                className="flex w-full items-center justify-between gap-2.5 rounded-[10px] border border-[#EAF2F6] bg-[#F5F8FA] p-3 text-left transition hover:border-[#0284C7]"
              >
                <div className="flex min-w-0 items-start gap-2.5">
                  <Inbox className="mt-0.5 h-4 w-4 shrink-0 text-[#0284C7]" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#17324D]">
                      {pendingApprovals.length} Tugas Menunggu Approval Supervisor
                    </p>
                    <p className="text-[11px] text-[#526675]">
                      Termasuk jadwal instalasi prioritas &amp; proposal B2B
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-[#526675]" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('runs')}
                className="flex w-full items-center justify-between gap-2.5 rounded-[10px] border border-[#EAF2F6] bg-[#F5F8FA] p-3 text-left transition hover:border-[#B23A48]"
              >
                <div className="flex min-w-0 items-start gap-2.5">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#B23A48]" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#17324D]">
                      {failedRuns.length} Run Memerlukan Recovery / Retry
                    </p>
                    <p className="text-[11px] text-[#526675]">
                      Timeout CRM eksternal &amp; antrean DLQ siap dipulihkan
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-[#526675]" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('workflows')}
                className="flex w-full items-center justify-between gap-2.5 rounded-[10px] border border-[#EAF2F6] bg-[#F5F8FA] p-3 text-left transition hover:border-[#0284C7]"
              >
                <div className="flex min-w-0 items-start gap-2.5">
                  <GitBranch className="mt-0.5 h-4 w-4 shrink-0 text-[#247A55]" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#17324D]">
                      Workflow Lead to Install v2.3 Berjalan Normal
                    </p>
                    <p className="text-[11px] text-[#526675]">
                      Kepatuhan SLA 98,6% · Konversi 35,0%
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-[#526675]" />
              </button>
            </div>
          </div>

          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
            <h2 className="text-sm font-bold text-[#17324D]">
              Akses Modul Utama
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-2.5 text-xs">
              {[
                { label: 'Model Router', section: 'model-router' as AIWorkforceSectionId },
                { label: 'Skills & Tools', section: 'skills-tools' as AIWorkforceSectionId },
                { label: 'Memory & RAG', section: 'memory-rag' as AIWorkforceSectionId },
                { label: 'Workflow Builder', section: 'workflow-builder' as AIWorkforceSectionId },
                { label: 'Safety L0–L4', section: 'governance-settings' as AIWorkforceSectionId },
                { label: 'Audit & Log', section: 'governance-settings' as AIWorkforceSectionId },
              ].map((m) => (
                <button
                  key={m.label}
                  type="button"
                  onClick={() => onNavigate(m.section)}
                  className="rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] px-3 py-2.5 text-left font-semibold text-[#17324D] transition hover:border-[#0284C7] hover:bg-[#E6F4F9]"
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
