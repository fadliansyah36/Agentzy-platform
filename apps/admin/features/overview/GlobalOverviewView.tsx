'use client';

import React from 'react';
import {
  Building2,
  Briefcase,
  RadioTower,
  Users,
  Bot,
  Activity,
  ShieldAlert,
  Cpu,
  CheckCircle2,
  ArrowRight,
  Lock,
  Trophy,
  GitBranch,
  Layers,
} from 'lucide-react';
import { AdminDeltaText } from '../../components/data-display/AdminDataDisplay';
import { formatNumberID } from '../../lib/admin-data';
import type {
  AdminSectionId,
  AdminTenantRecord,
  BreakGlassRequestRecord,
} from '../../lib/admin-types';

export function GlobalOverviewView({
  tenants,
  providersCount,
  humanTotal,
  aiWorkersTotal,
  breakGlassRequests,
  onNavigate,
  onOpenBreakGlass,
}: {
  tenants: AdminTenantRecord[];
  providersCount: number;
  humanTotal: number;
  aiWorkersTotal: number;
  breakGlassRequests: BreakGlassRequestRecord[];
  onNavigate: (section: AdminSectionId) => void;
  onOpenBreakGlass: () => void;
}) {
  const activeBreakGlass = breakGlassRequests.filter((b) => b.status === 'Aktif').length;
  const topTenants = [...tenants].sort((a, b) => b.slaScore - a.slaScore).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header matching Screen 1 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-[#0284C7]">
            Agentzy Super Admin Control Plane
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#17324D] sm:text-3xl">
            Halo, Super Admin
          </h1>
          <p className="mt-1 text-xs text-[#526675] sm:text-sm">
            Kontrol penuh seluruh tenant, workforce, AI, layanan, dan operasional platform.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('onboarding')}
            className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#0284C7] px-4 text-xs font-semibold text-white transition hover:bg-[#0369A1] whitespace-nowrap"
          >
            <span>Onboarding Korporat</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate('master-data')}
            className="inline-flex h-10 items-center gap-1.5 rounded-[10px] border border-[#B8C9D3] bg-white px-4 text-xs font-semibold text-[#17324D] transition hover:bg-[#E6F4F9] whitespace-nowrap"
          >
            <span>Master Data CRUD</span>
          </button>
        </div>
      </div>

      {/* 6 Global KPI Cards matching Screen 1 & Global KPI panel */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <button
          type="button"
          onClick={() => onNavigate('tenants')}
          className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 text-left transition hover:border-[#87CEEB]"
        >
          <div className="flex items-center justify-between text-[#526675]">
            <span className="text-xs font-medium">Tenant</span>
            <Building2 className="h-4 w-4 text-[#0284C7]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono-tabular text-2xl font-bold text-[#17324D]">
              {123 + tenants.length}
            </span>
            <AdminDeltaText valuePct={12} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('contracts')}
          className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 text-left transition hover:border-[#87CEEB]"
        >
          <div className="flex items-center justify-between text-[#526675]">
            <span className="text-xs font-medium">Corporate</span>
            <Briefcase className="h-4 w-4 text-[#0284C7]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono-tabular text-2xl font-bold text-[#17324D]">
              42
            </span>
            <AdminDeltaText valuePct={8} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('onboarding')}
          className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 text-left transition hover:border-[#87CEEB]"
        >
          <div className="flex items-center justify-between text-[#526675]">
            <span className="text-xs font-medium">Provider</span>
            <RadioTower className="h-4 w-4 text-[#0284C7]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono-tabular text-2xl font-bold text-[#17324D]">
              {13 + providersCount}
            </span>
            <AdminDeltaText valuePct={6} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('human-workforce')}
          className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 text-left transition hover:border-[#87CEEB]"
        >
          <div className="flex items-center justify-between text-[#526675]">
            <span className="text-xs font-medium">Human Workforce</span>
            <Users className="h-4 w-4 text-[#0284C7]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono-tabular text-2xl font-bold text-[#17324D]">
              {formatNumberID(humanTotal)}
            </span>
            <AdminDeltaText valuePct={11} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('ai-workers')}
          className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 text-left transition hover:border-[#87CEEB]"
        >
          <div className="flex items-center justify-between text-[#526675]">
            <span className="text-xs font-medium">AI Worker</span>
            <Bot className="h-4 w-4 text-[#0284C7]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono-tabular text-2xl font-bold text-[#17324D]">
              {formatNumberID(aiWorkersTotal)}
            </span>
            <AdminDeltaText valuePct={18} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('global-analytics')}
          className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 text-left transition hover:border-[#87CEEB]"
        >
          <div className="flex items-center justify-between text-[#526675]">
            <span className="text-xs font-medium">Uptime Platform</span>
            <Activity className="h-4 w-4 text-[#247A55]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono-tabular text-2xl font-bold text-[#247A55]">
              99,97%
            </span>
          </div>
        </button>
      </div>

      {/* Right-Side Governance Panels from UI/UX Reference Image */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Lifecycle & Governance Pipeline */}
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-7">
          <div className="flex items-center justify-between border-b border-[#EAF2F6] pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#0284C7]" />
              <h2 className="text-sm font-bold text-[#17324D]">
                Lifecycle &amp; Governance AI Runtime
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('model-registry')}
              className="text-xs font-semibold text-[#0284C7] hover:underline"
            >
              Kelola Model &amp; Router →
            </button>
          </div>

          <div className="mt-4 space-y-2.5">
            {[
              {
                step: '01',
                title: 'Model / LLM Registration (Penyedia & Model)',
                sub: 'Validasi vendor, data residency & secret reference via AI Gateway',
                section: 'llm-providers' as AdminSectionId,
              },
              {
                step: '02',
                title: 'Policy & Allowlist (Per Tenant / Per Role)',
                sub: 'Tetapkan batas biaya kredit, sensitivitas data & model allowlist',
                section: 'model-router' as AdminSectionId,
              },
              {
                step: '03',
                title: 'Activation (Approval, Uji, SLA)',
                sub: 'Review lisensi skill, sandbox tool & aktivasi versi AI Worker',
                section: 'skills' as AdminSectionId,
              },
              {
                step: '04',
                title: 'Runtime & Monitoring (Usage, Cost, Performance)',
                sub: 'Pantau workflow runs, checkpoint durable & AI Credits ledger',
                section: 'workflows' as AdminSectionId,
              },
              {
                step: '05',
                title: 'Evaluation, Update / Deactivate (Versioning & Audit)',
                sub: 'Audit log immutable, penyesuaian versi & pencabutan akses',
                section: 'audit-logs' as AdminSectionId,
              },
            ].map((item) => (
              <button
                key={item.step}
                type="button"
                onClick={() => onNavigate(item.section)}
                className="flex w-full items-center justify-between gap-3 rounded-[10px] border border-[#EAF2F6] bg-[#F5F8FA] px-3.5 py-2.5 text-left transition hover:border-[#87CEEB] hover:bg-[#E6F4F9]/50"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="font-mono-tabular mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#17324D] text-[11px] font-bold text-white">
                    {item.step}
                  </span>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-xs font-bold text-[#17324D] sm:truncate">
                      {item.title}
                    </p>
                    <p className="line-clamp-2 text-[11px] text-[#526675] sm:truncate">
                      {item.sub}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-[#5F879E]" />
              </button>
            ))}
          </div>
        </div>

        {/* Break-Glass & AI Governance Policy */}
        <div className="space-y-4 lg:col-span-5">
          <div className="rounded-[14px] border border-[#B23A48]/30 bg-white p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-[#B23A48]" />
                <h2 className="text-sm font-bold text-[#17324D]">
                  Break-Glass Access (Akses Darurat)
                </h2>
              </div>
              <span className="font-mono-tabular text-xs font-bold text-[#B23A48]">
                {activeBreakGlass} Aktif
              </span>
            </div>
            <ul className="mt-3 space-y-1.5 text-xs text-[#526675]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#247A55]" />
                <span>Time-bound (dibatasi waktu maksimum sesi)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#247A55]" />
                <span>Approval-required (persetujuan minimum 2 tahap)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#247A55]" />
                <span>Semua aksi dicatat di Audit Log &amp; wajib ditinjau pasca-akses</span>
              </li>
            </ul>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onOpenBreakGlass}
                className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-[#B23A48] px-3 text-xs font-semibold text-white hover:bg-[#962D39]"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Minta Akses Darurat</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('security')}
                className="inline-flex h-9 items-center rounded-[8px] border border-[#D8E3E9] px-3 text-xs font-semibold text-[#17324D] hover:bg-[#F5F8FA]"
              >
                Buka Security Center
              </button>
            </div>
          </div>

          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-[#0284C7]" />
                <h2 className="text-sm font-bold text-[#17324D]">
                  AI Governance &amp; Policy
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('ai-credits')}
                className="text-xs font-semibold text-[#0284C7] hover:underline"
              >
                AI Credits →
              </button>
            </div>
            <ul className="mt-3 space-y-1.5 text-xs text-[#526675]">
              <li>· Aktivasi LLM melalui allowlist terpusat</li>
              <li>· Semua panggilan AI via Backend AI Gateway</li>
              <li>· Pembatasan biaya, SLA &amp; residensi per tenant</li>
              <li>· Deterministic Commission &amp; Credit Ledger</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Row: Top 3 Tenant Ranking + Quick Control Plane Matrix */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-5">
          <div className="flex items-center justify-between border-b border-[#EAF2F6] pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-[#A96816]" />
              <h2 className="text-sm font-bold text-[#17324D]">
                Ranking Tenant (Kinerja Operasional)
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('global-analytics')}
              className="text-xs font-semibold text-[#0284C7] hover:underline"
            >
              Detail KPI →
            </button>
          </div>
          <div className="mt-3 space-y-2.5">
            {topTenants.map((t, idx) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-[10px] border border-[#EAF2F6] bg-[#F5F8FA] px-3.5 py-2.5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono-tabular flex h-6 w-6 items-center justify-center rounded-full bg-[#17324D] text-xs font-bold text-white">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-[#17324D]">{t.name}</p>
                    <p className="text-[11px] text-[#526675]">
                      {formatNumberID(t.humanCount)} Human · {t.aiWorkerCount} AI
                    </p>
                  </div>
                </div>
                <span className="font-mono-tabular text-sm font-bold text-[#247A55]">
                  {String(t.slaScore).replace('.', ',')}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-7">
          <div className="flex items-center justify-between border-b border-[#EAF2F6] pb-3">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-[#0284C7]" />
              <h2 className="text-sm font-bold text-[#17324D]">
                Akses Cepat Modul Control Plane
              </h2>
            </div>
            <span className="text-[11px] text-[#718391]">28 Modul Terintegrasi</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {(
              [
                { id: 'tenants', label: 'Tenant Directory' },
                { id: 'master-data', label: 'Master Data CRUD' },
                { id: 'subscriptions', label: 'Kontrak & Entitlement' },
                { id: 'rbac', label: 'RBAC & Matrix Akses' },
                { id: 'llm-providers', label: 'LLM Provider CRUD' },
                { id: 'model-registry', label: 'Model Registry' },
                { id: 'skills', label: 'Skills & Approval' },
                { id: 'commission-schemes', label: 'Gaji, Komisi & Bonus' },
                { id: 'data-governance', label: 'Data Governance DSR' },
              ] as const
            ).map((shortcut) => (
              <button
                key={shortcut.id}
                type="button"
                onClick={() => onNavigate(shortcut.id)}
                className="flex min-h-[42px] items-center justify-between rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] px-3 py-2 text-left text-xs font-semibold text-[#17324D] transition hover:border-[#0284C7] hover:bg-[#E6F4F9]"
              >
                <span className="truncate">{shortcut.label}</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#0284C7]" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
