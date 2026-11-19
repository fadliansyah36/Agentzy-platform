'use client';

import React, { useMemo, useState } from 'react';
import { AIWorkforceAccessView } from './AIWorkforceAccessView';
import type { AgentzyWorkforceTenantContext, AgentzyTenantMembership, AgentzyRoleTemplate, InviteTenantMemberInput, ReassignMembershipHierarchyInput } from '@/apps/web/lib/api-client';
import {
  ShieldCheck,
  Users,
  FileSearch,
  Settings,
  CheckCircle2,
  AlertTriangle,
  WifiOff,
  Wifi,
  ChevronRight,
} from 'lucide-react';
import type {
  AIWMTenant,
  AIWorkforceSectionId,
  AuditIncidentItem,
} from '../../lib/ai-workforce-types';

const AUTONOMY_LEVELS = [
  {
    level: 'L0 · Advisory',
    desc: 'Hanya memberi saran, ringkasan, dan rekomendasi kepada manusia.',
    active: true,
  },
  {
    level: 'L1 · Drafting',
    desc: 'Menyusun draf konten promosi, proposal, teks, dan rencana.',
    active: true,
  },
  {
    level: 'L2 · Bounded Internal',
    desc: 'Eksekusi internal terbatas (skor lead, kelola tugas) tanpa aksi eksternal.',
    active: true,
  },
  {
    level: 'L3 · External Action (Approval)',
    desc: 'Aksi eksternal (kirim email/ubah jadwal) wajib persetujuan manusia terlebih dahulu.',
    active: true,
  },
  {
    level: 'L4 · Policy-Bounded Autonomy',
    desc: 'Eksekusi otomatis dalam batas kebijakan ketat dan allowlist yang disetujui tenant.',
    active: false,
  },
];

export function SafetyAuditSettingsView({
  activeTenant,
  auditLogs,
  offlinePwaMode,
  onToggleOfflinePwa,
  onNavigate,
  onNotify,
  canManageAccess,
  accessMemberships,
  accessRoles,
  accessLoading,
  accessError,
  workforceTenantContext,
  onInviteMember,
  onReplaceMembershipRole,
  onActivateMembership,
  onSuspendMembership,
  onRevokeMembership,
  onReassignMembership,
}: {
  activeTenant: AIWMTenant;
  auditLogs: AuditIncidentItem[];
  offlinePwaMode: boolean;
  onToggleOfflinePwa: (next: boolean) => void;
  onNavigate: (section: AIWorkforceSectionId) => void;
  onNotify: (msg: string) => void;
  canManageAccess: boolean;
  accessMemberships: AgentzyTenantMembership[];
  accessRoles: AgentzyRoleTemplate[];
  accessLoading: boolean;
  accessError: string | null;
  workforceTenantContext: AgentzyWorkforceTenantContext | null;
  onInviteMember: (payload: InviteTenantMemberInput) => Promise<void>;
  onReplaceMembershipRole: (membershipId: string, roleKey: string) => Promise<void>;
  onActivateMembership: (membershipId: string) => Promise<void>;
  onSuspendMembership: (membershipId: string) => Promise<void>;
  onRevokeMembership: (membershipId: string) => Promise<void>;
  onReassignMembership: (membershipId: string, payload: ReassignMembershipHierarchyInput) => Promise<void>;
}) {
  const [tab, setTab] = useState<'safety' | 'audit' | 'settings' | 'access'>('safety');
  const [auditFilter, setAuditFilter] = useState<
    'Semua' | 'Audit Log' | 'Insiden' | 'Run History'
  >('Semua');

  const filteredLogs = useMemo(() => {
    if (auditFilter === 'Semua') return auditLogs;
    return auditLogs.filter((l) => l.kind === auditFilter);
  }, [auditLogs, auditFilter]);

  return (
    <div className="space-y-5">
      {/* Header (Screens 22, 23, 24, 42, 43, 45) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-[#0284C7]">
            Screens 22–24 &amp; 42–45 · Governance, Audit &amp; Pengaturan
          </p>
          <h1 className="text-xl font-bold text-[#17324D] sm:text-2xl">
            Safety Policy, Audit Log &amp; Pengaturan Portal
          </h1>
          <p className="mt-0.5 text-xs text-[#526675]">
            Tata kelola otonomi L0–L4, kepatuhan SLA, rekam audit transparan, dan preferensi PWA tenant.
          </p>
        </div>

        <div className="grid w-full grid-cols-4 gap-1 rounded-[10px] border border-[#D8E3E9] bg-white p-1 sm:inline-flex sm:w-auto">
          {(
            [
              { id: 'safety', label: 'Kebijakan & SLA', shortLabel: 'Kebijakan', icon: ShieldCheck },
              { id: 'audit', label: 'Audit & Insiden', shortLabel: 'Audit Log', icon: FileSearch },
              { id: 'settings', label: 'Pengaturan', shortLabel: 'Pengaturan', icon: Settings },
              { id: 'access', label: 'Akses & Membership', shortLabel: 'Akses', icon: Users },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex h-9 sm:h-8 items-center justify-center gap-1.5 rounded-[8px] px-2 sm:px-3 text-[11px] sm:text-xs font-semibold whitespace-nowrap ${
                tab === t.id
                  ? 'bg-[#0284C7] text-white'
                  : 'text-[#526675] hover:text-[#17324D]'
              }`}
            >
              <t.icon className="h-3.5 w-3.5 shrink-0" />
              <span className="sm:hidden">{t.shortLabel}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Screens 22 & 42 (Safety & Autonomy Policy + SLA & Policy Compliance) */}
      {tab === 'safety' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <section className="lg:col-span-7 rounded-[14px] border border-[#D8E3E9] bg-white p-5 space-y-3.5">
            <h2 className="text-sm font-bold text-[#17324D]">
              Kebijakan &amp; Level Otonomi (L0 – L4)
            </h2>
            <div className="space-y-2.5">
              {AUTONOMY_LEVELS.map((lv) => (
                <div
                  key={lv.level}
                  className="flex items-start justify-between gap-3 rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-3.5"
                >
                  <div>
                    <p className="text-xs font-bold text-[#17324D]">
                      {lv.level}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#526675]">
                      {lv.desc}
                    </p>
                  </div>
                  <span
                    className={`rounded-[6px] px-2 py-0.5 text-[11px] font-semibold shrink-0 ${
                      lv.active
                        ? 'bg-[#247A55]/10 text-[#247A55]'
                        : 'bg-[#718391]/15 text-[#526675]'
                    }`}
                  >
                    {lv.active ? 'Diizinkan' : 'Dibatasi'}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-[10px] border border-[#B23A48]/30 bg-[#B23A48]/5 p-3 text-xs font-semibold text-[#B23A48]">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                Tidak ada akses otonomi tanpa batas (unrestricted autonomy) pada seluruh workspace tenant.
              </span>
            </div>
          </section>

          <section className="lg:col-span-5 rounded-[14px] border border-[#D8E3E9] bg-white p-5 space-y-3.5 h-fit">
            <h2 className="text-sm font-bold text-[#17324D]">
              Screen 42 · SLA &amp; Policy Compliance
            </h2>
            {[
              { label: 'SLA Workflow', val: '98,6%', target: 'Target ≥ 98%' },
              { label: 'SLA AI Worker', val: '97,9%', target: 'Target ≥ 95%' },
              { label: 'Policy Compliance', val: '100%', target: '0 pelanggaran kebijakan' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-3.5"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-[#247A55]" />
                  <div>
                    <p className="text-xs font-bold text-[#17324D]">
                      {item.label}
                    </p>
                    <p className="text-[11px] text-[#526675]">{item.target}</p>
                  </div>
                </div>
                <span className="font-mono-tabular text-base font-bold text-[#247A55]">
                  {item.val}
                </span>
              </div>
            ))}
          </section>
        </div>
      )}

      {/* Tab 2: Screens 23 & 43 (Audit Log, Insiden & Run History) */}
      {tab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex min-w-0 w-full gap-1 overflow-x-auto rounded-[10px] border border-[#D8E3E9] bg-white p-1 sm:inline-flex sm:w-auto">
              {(['Semua', 'Audit Log', 'Insiden', 'Run History'] as const).map(
                (f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setAuditFilter(f)}
                    className={`h-8 shrink-0 rounded-[8px] px-3 text-xs font-semibold whitespace-nowrap ${
                      auditFilter === f
                        ? 'bg-[#E6F4F9] text-[#17324D]'
                        : 'text-[#526675]'
                    }`}
                  >
                    {f}
                  </button>
                )
              )}
            </div>
            <span className="font-mono-tabular text-xs text-[#526675]">
              {filteredLogs.length} catatan ditampilkan
            </span>
          </div>

          <div className="space-y-2.5">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col gap-2 rounded-[14px] border border-[#D8E3E9] bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] ${
                      log.kind === 'Insiden'
                        ? 'bg-[#B23A48]/10 text-[#B23A48]'
                        : 'bg-[#E6F4F9] text-[#0284C7]'
                    }`}
                  >
                    {log.kind === 'Insiden' ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-[#17324D]">
                        {log.title}
                      </span>
                      <span className="text-[11px] font-medium text-[#0284C7]">
                        · {log.kind}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[#526675]">{log.detail}</p>
                    <p className="mt-1 text-[11px] text-[#718391]">
                      Aktor: {log.actor}
                    </p>
                  </div>
                </div>
                <span className="font-mono-tabular text-[11px] text-[#718391] shrink-0">
                  {log.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Screens 24 & 45 (Pengaturan, Integrasi, Mode Offline PWA) */}
      {tab === 'access' && canManageAccess && workforceTenantContext && (
        <AIWorkforceAccessView
          tenantId={activeTenant.id}
          tenantName={activeTenant.name}
          memberships={accessMemberships}
          roles={accessRoles}
          organizations={workforceTenantContext.organizations}
          organizationUnits={workforceTenantContext.organization_units}
          branches={workforceTenantContext.branches}
          departments={workforceTenantContext.departments}
          loading={accessLoading}
          error={accessError}
          onInvite={onInviteMember}
          onReplaceRole={onReplaceMembershipRole}
          onActivate={onActivateMembership}
          onSuspend={onSuspendMembership}
          onRevoke={onRevokeMembership}
          onReassign={onReassignMembership}
        />
      )}
      {tab === 'access' && !canManageAccess && (
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 text-xs text-[#526675]">
          Membership management memerlukan permission <strong>corporate.organization.manage</strong> atau <strong>platform.memberships.manage</strong>.
        </div>
      )}
      {tab === 'settings' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 space-y-3">
            <h2 className="text-sm font-bold text-[#17324D]">
              Profil &amp; Akses Tenant
            </h2>
            <div className="rounded-[10px] bg-[#F5F8FA] p-3.5 text-xs space-y-1">
              <p>
                <strong>Nama Perusahaan:</strong> {activeTenant.name}
              </p>
              <p>
                <strong>Kode Workspace:</strong> {activeTenant.code} ({activeTenant.environment})
              </p>
              <p>
                <strong>Industri:</strong> {activeTenant.industry}
              </p>
              <p>
                <strong>Wilayah Operasi:</strong> {activeTenant.region}
              </p>
            </div>

            <div className="space-y-2 pt-1">
              {[
                {
                  title: 'Model & Provider',
                  desc: 'Kelola routing dan kuota model',
                  target: 'model-router' as AIWorkforceSectionId,
                },
                {
                  title: 'Integrasi & Konektor',
                  desc: 'CRM ISP, Work Order, Google Workspace, Content Studio',
                  target: 'skills-tools' as AIWorkforceSectionId,
                },
                {
                  title: 'Kebijakan & Keamanan',
                  desc: 'Data, retensi memori & level otonomi L0–L4',
                  target: 'memory-rag' as AIWorkforceSectionId,
                },
              ].map((link) => (
                <button
                  key={link.title}
                  type="button"
                  onClick={() => onNavigate(link.target)}
                  className="flex w-full items-center justify-between rounded-[10px] border border-[#D8E3E9] bg-white p-3 text-left transition hover:border-[#0284C7] hover:bg-[#E6F4F9]/40"
                >
                  <div>
                    <p className="text-xs font-bold text-[#17324D]">
                      {link.title}
                    </p>
                    <p className="text-[11px] text-[#526675]">{link.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#526675]" />
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 space-y-4 h-fit">
            <h2 className="text-sm font-bold text-[#17324D]">
              Preferensi Sistem &amp; Mode Offline (PWA)
            </h2>

            <div className="flex flex-col items-start gap-3 rounded-[12px] border border-[#87CEEB] bg-[#E6F4F9]/60 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3 min-w-0">
                {offlinePwaMode ? (
                  <Wifi className="mt-0.5 h-5 w-5 shrink-0 text-[#247A55]" />
                ) : (
                  <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-[#718391]" />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#17324D]">
                    Mode Offline &amp; Cache PWA
                  </p>
                  <p className="text-[11px] text-[#526675]">
                    Simpan daftar AI Worker &amp; materi promosi Staff Sales agar tetap dapat dibuka saat sinyal lemah.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onToggleOfflinePwa(!offlinePwaMode);
                  onNotify(
                    !offlinePwaMode
                      ? 'Mode Offline PWA diaktifkan'
                      : 'Mode Offline PWA dinonaktifkan'
                  );
                }}
                className={`h-10 sm:h-9 w-full sm:w-auto rounded-[9px] px-3.5 text-xs font-semibold shrink-0 whitespace-nowrap ${
                  offlinePwaMode
                    ? 'bg-[#247A55] text-white'
                    : 'border border-[#D8E3E9] bg-white text-[#526675]'
                }`}
              >
                {offlinePwaMode ? 'Aktif' : 'Nonaktif'}
              </button>
            </div>

            <div className="rounded-[10px] bg-[#F5F8FA] p-3.5 text-xs text-[#526675] space-y-1">
              <p className="font-bold text-[#17324D]">Bahasa &amp; Zona Waktu</p>
              <p>Bahasa Indonesia · Asia/Jakarta (WIB, UTC+7)</p>
              <p className="pt-1 font-bold text-[#17324D]">Notifikasi &amp; Alert</p>
              <p>Email, Push Notifikasi PWA, dan Alert Approval Center aktif.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
