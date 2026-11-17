'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Link2,
  ShieldCheck,
  Lock,
  Plus,
  Bot,
  Briefcase,
  Users,
  Wrench,
  PauseCircle,
  PlayCircle,
  ExternalLink,
  Search,
  Building2,
} from 'lucide-react';
import type { AIWorkerEntity } from '../../lib/ai-workforce-types';
import type {
  AgentzyManagerRole,
  HumanAIBindingRecord,
  WorkforceHumanRole,
} from '@/lib/human-ai-bindings';

const MANAGER_ROLES: Array<{
  role: AgentzyManagerRole;
  badge: string;
  desc: string;
}> = [
  {
    role: 'HRD Agentzy',
    badge: 'Penuh · People & Pairing',
    desc: 'Rekrutmen, penempatan & pengikatan Staff Sales / Teknisi dengan AI Worker.',
  },
  {
    role: 'Admin Agentzy',
    badge: 'Penuh · Operasional Workforce',
    desc: 'Mengelola jadwal, akun Affiliate & penyesuaian akses kolaborasi.',
  },
  {
    role: 'Direksi Agentzy',
    badge: 'Penuh · Tata Kelola & KPI',
    desc: 'Persetujuan akhir batas otonomi L1–L3 & target produktivitas lintas tim.',
  },
  {
    role: 'Corporate / ISP Partner (Read-Only)',
    badge: 'Terkunci · Hanya Portal Corporate',
    desc: 'Mitra ISP hanya memantau hasil operasional & SLA di Portal Corporate.',
  },
];

export function HumanAIBindingView({
  bindings,
  aiWorkers,
  managerRole,
  canManageBindings,
  onChangeManagerRole,
  onOpenCreateBinding,
  onToggleBindingStatus,
  onUpdateBindingAiWorker,
}: {
  bindings: HumanAIBindingRecord[];
  aiWorkers: AIWorkerEntity[];
  managerRole: AgentzyManagerRole;
  canManageBindings: boolean;
  onChangeManagerRole: (role: AgentzyManagerRole) => void;
  onOpenCreateBinding: () => void;
  onToggleBindingStatus: (bindingId: string) => void;
  onUpdateBindingAiWorker: (
    bindingId: string,
    aiWorkerId: string,
    aiWorkerName: string
  ) => void;
}) {
  const [roleFilter, setRoleFilter] = useState<'semua' | WorkforceHumanRole>('semua');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bindings.filter((b) => {
      if (roleFilter !== 'semua' && b.humanRole !== roleFilter) return false;
      if (!q) return true;
      return (
        b.humanName.toLowerCase().includes(q) ||
        b.aiWorkerName.toLowerCase().includes(q) ||
        b.collaborationMode.toLowerCase().includes(q) ||
        b.humanCode.toLowerCase().includes(q)
      );
    });
  }, [bindings, roleFilter, search]);

  const roleBadgeIcon = (role: WorkforceHumanRole) => {
    if (role === 'technician') return Wrench;
    if (role === 'affiliate') return Users;
    return Briefcase;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-[#0284C7]">
            Integrasi &amp; Tata Kelola Internal Agentzy · Human + AI Collaboration Binding
          </p>
          <h1 className="text-xl font-bold text-[#17324D] sm:text-2xl">
            Integrasi &amp; Pengikatan Staff Human ↔ Staff AI
          </h1>
          <p className="mt-0.5 text-xs text-[#526675]">
            Pengaturan ikatan kolaborasi antara Staff Sales, Affiliate &amp; Teknisi dengan AI Worker. Dikelola penuh oleh Divisi HRD, Admin, dan Direksi Agentzy.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center shrink-0">
          <Link
            href="/workforce"
            className="inline-flex h-11 sm:h-10 w-full sm:w-auto items-center justify-center gap-1.5 rounded-[10px] border border-[#D8E3E9] bg-white px-3.5 text-xs font-semibold text-[#17324D] hover:border-[#0284C7] whitespace-nowrap"
          >
            <span>Lihat di Portal Workforce</span>
            <ExternalLink className="h-3.5 w-3.5 text-[#0284C7]" />
          </Link>

          <button
            type="button"
            disabled={!canManageBindings}
            onClick={onOpenCreateBinding}
            className={`inline-flex h-11 sm:h-10 w-full sm:w-auto items-center justify-center gap-1.5 rounded-[10px] px-4 text-xs font-semibold whitespace-nowrap ${
              canManageBindings
                ? 'bg-[#0284C7] text-white hover:bg-[#0369A1]'
                : 'cursor-not-allowed bg-[#D8E3E9] text-[#718391]'
            }`}
          >
            <Plus className="h-4 w-4" />
            <span>Ikat Staff Human + AI</span>
          </button>
        </div>
      </div>

      {/* RBAC Governance Bar: HRD / Admin / Direksi Agentzy vs Corporate ISP Read-Only */}
      <section className="rounded-[14px] border border-[#87CEEB] bg-white p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#EAF2F6] pb-3">
          <div className="flex items-center gap-2.5">
            {canManageBindings ? (
              <ShieldCheck className="h-5 w-5 text-[#247A55]" />
            ) : (
              <Lock className="h-5 w-5 text-[#B23A48]" />
            )}
            <div>
              <h2 className="text-sm font-bold text-[#17324D]">
                Hak Akses Pengelola Workforce (Agentzy Internal Control)
              </h2>
              <p className="text-[11px] text-[#526675]">
                Perusahaan Corporate / ISP mitra tidak mengatur staff secara langsung dan hanya memantau hasil operasional di Portal Corporate.
              </p>
            </div>
          </div>

          <span
            className={`rounded-[6px] px-2.5 py-1 text-xs font-bold whitespace-nowrap self-start sm:self-auto ${
              canManageBindings
                ? 'bg-[#247A55]/10 text-[#247A55]'
                : 'bg-[#B23A48]/10 text-[#B23A48]'
            }`}
          >
            Mode Aktif: {managerRole}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {MANAGER_ROLES.map((item) => {
            const active = managerRole === item.role;
            const isReadOnly = item.role.includes('Read-Only');
            return (
              <button
                key={item.role}
                type="button"
                onClick={() => onChangeManagerRole(item.role)}
                className={`rounded-[11px] border p-3 text-left transition ${
                  active
                    ? isReadOnly
                      ? 'border-[#B23A48] bg-[#B23A48]/5'
                      : 'border-[#0284C7] bg-[#E6F4F9]'
                    : 'border-[#D8E3E9] bg-[#F5F8FA] hover:border-[#87CEEB]'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-[#17324D]">
                    {item.role}
                  </span>
                  {isReadOnly && <Lock className="h-3.5 w-3.5 text-[#B23A48]" />}
                </div>
                <p
                  className={`mt-0.5 text-[10px] font-semibold ${
                    isReadOnly ? 'text-[#B23A48]' : 'text-[#0284C7]'
                  }`}
                >
                  {item.badge}
                </p>
                <p className="mt-1 text-[11px] leading-snug text-[#526675]">
                  {item.desc}
                </p>
              </button>
            );
          })}
        </div>

        {!canManageBindings && (
          <div className="flex flex-col gap-2 rounded-[10px] border border-[#B23A48]/30 bg-[#B23A48]/5 p-3.5 text-xs text-[#172B3A] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-[#B23A48]" />
              <div>
                <p className="font-bold text-[#B23A48]">
                  Akses Pengaturan Ikatan Staff Terkunci untuk Corporate / ISP Partner
                </p>
                <p className="mt-0.5 text-[11px] text-[#526675]">
                  Seluruh pengelolaan Staff Sales, Affiliate, Teknisi, dan pengikatan AI Worker dilakukan penuh oleh Divisi HRD, Admin, dan Direksi Agentzy. Mitra ISP hanya memantau laporan &amp; SLA di Corporate Portal.
                </p>
              </div>
            </div>
            <Link
              href="/corporate"
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[9px] bg-[#17324D] px-3.5 text-xs font-semibold text-white hover:bg-[#245477] whitespace-nowrap"
            >
              <span>Buka Corporate Portal</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </section>

      {/* Filter & Search */}
      <div className="flex flex-col gap-3 rounded-[14px] border border-[#D8E3E9] bg-white p-3.5 sm:p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap">
          {(
            [
              { id: 'semua', label: `Semua Ikatan (${bindings.length})` },
              { id: 'sales', label: 'Staff Sales' },
              { id: 'affiliate', label: 'Affiliate' },
              { id: 'technician', label: 'Teknisi' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setRoleFilter(f.id)}
              className={`h-9 rounded-[9px] border px-2.5 sm:px-3 text-xs font-semibold whitespace-nowrap truncate ${
                roleFilter === f.id
                  ? 'border-[#0284C7] bg-[#E6F4F9] text-[#17324D]'
                  : 'border-[#D8E3E9] bg-white text-[#526675]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#718391]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama staff atau AI Worker..."
            className="h-9 w-full rounded-[9px] border border-[#D8E3E9] bg-[#F5F8FA] pl-8 pr-3 text-xs text-[#172B3A]"
          />
        </div>
      </div>

      {/* Bindings Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filtered.map((b) => {
          const RoleIcon = roleBadgeIcon(b.humanRole);
          const isActive = b.status === 'Aktif';
          return (
            <article
              key={b.id}
              className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 sm:p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-tabular text-xs font-bold text-[#0284C7]">
                      {b.id}
                    </span>
                    <span className="text-[11px] text-[#718391]">
                      · Otonomi {b.autonomyLevel} · {b.tenantScope}
                    </span>
                  </div>
                  <span
                    className={`rounded-[6px] px-2 py-0.5 text-[11px] font-semibold shrink-0 ${
                      isActive
                        ? 'bg-[#247A55]/10 text-[#247A55]'
                        : 'bg-[#A96816]/10 text-[#A96816]'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>

                {/* Human <-> AI Visual Binding Header */}
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-11 sm:items-center">
                  <div className="sm:col-span-5 rounded-[11px] border border-[#D8E3E9] bg-[#F5F8FA] p-3">
                    <div className="flex items-center gap-2">
                      <RoleIcon className="h-4 w-4 text-[#17324D]" />
                      <span className="text-[11px] font-semibold text-[#526675]">
                        Staff Human
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-[#17324D]">
                      {b.humanName}
                    </p>
                    <p className="text-[11px] text-[#526675]">
                      {b.humanRoleLabel}
                    </p>
                  </div>

                  <div className="sm:col-span-1 flex items-center justify-center py-0.5 sm:py-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E6F4F9] text-[#0284C7]">
                      <Link2 className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="sm:col-span-5 rounded-[11px] border border-[#87CEEB] bg-[#E6F4F9]/60 p-3">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-[#0284C7]" />
                      <span className="text-[11px] font-semibold text-[#0284C7]">
                        Staff AI Terikat
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-[#17324D]">
                      {b.aiWorkerName}
                    </p>
                    <p className="text-[11px] text-[#245477]">
                      {b.secondaryAiWorkerName
                        ? `+ Pendukung: ${b.secondaryAiWorkerName}`
                        : 'AI Partner Utama'}
                    </p>
                  </div>
                </div>

                {/* Collaboration Mode & Scope */}
                <div className="rounded-[10px] border border-[#EAF2F6] bg-[#F8FBFD] p-3 space-y-1.5">
                  <p className="text-xs font-bold text-[#17324D]">
                    Mode Kolaborasi: {b.collaborationMode}
                  </p>
                  <ul className="space-y-1">
                    {b.collaborationScope.map((sc) => (
                      <li key={sc} className="text-[11px] text-[#526675]">
                        • {sc}
                      </li>
                    ))}
                  </ul>
                  <p className="pt-1 font-mono-tabular text-[11px] font-semibold text-[#247A55]">
                    Target KPI Bersama: {b.sharedKpiTarget}
                  </p>
                </div>
              </div>

              {/* Footer Controls (Strictly HRD / Admin / Direksi Agentzy) */}
              <div className="flex flex-col gap-2.5 border-t border-[#EAF2F6] pt-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-[11px] text-[#718391]">
                  <p>
                    Diatur oleh: <strong className="text-[#17324D]">{b.managedByRole}</strong>
                  </p>
                  <p>
                    {b.managedByPerson} · {b.updatedAt}
                  </p>
                </div>

                <div className="flex w-full items-center gap-2 sm:w-auto">
                  <select
                    disabled={!canManageBindings}
                    value={b.aiWorkerId}
                    onChange={(e) => {
                      const chosen = aiWorkers.find(
                        (w) => w.id === e.target.value
                      );
                      if (chosen) {
                        onUpdateBindingAiWorker(b.id, chosen.id, chosen.name);
                      }
                    }}
                    aria-label={`Ubah AI Worker untuk ${b.humanName}`}
                    className={`h-9 sm:h-8 min-w-0 flex-1 sm:w-auto rounded-[8px] border px-2 text-[11px] font-semibold ${
                      canManageBindings
                        ? 'border-[#D8E3E9] bg-white text-[#17324D]'
                        : 'cursor-not-allowed border-[#EAF2F6] bg-[#F5F8FA] text-[#718391]'
                    }`}
                  >
                    {aiWorkers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    disabled={!canManageBindings}
                    onClick={() => onToggleBindingStatus(b.id)}
                    className={`inline-flex h-9 sm:h-8 shrink-0 items-center gap-1 rounded-[8px] border px-3 text-[11px] font-semibold whitespace-nowrap ${
                      !canManageBindings
                        ? 'cursor-not-allowed border-[#EAF2F6] bg-[#F5F8FA] text-[#718391]'
                        : isActive
                          ? 'border-[#A96816]/40 bg-[#A96816]/5 text-[#A96816] hover:bg-[#A96816]/10'
                          : 'border-[#247A55]/40 bg-[#247A55]/5 text-[#247A55] hover:bg-[#247A55]/10'
                    }`}
                  >
                    {isActive ? (
                      <>
                        <PauseCircle className="h-3.5 w-3.5" />
                        <span>Jeda</span>
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-3.5 w-3.5" />
                        <span>Aktifkan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
