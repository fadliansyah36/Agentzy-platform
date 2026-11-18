'use client';

import React from 'react';
import {
  Lock,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  XCircle,
  Sliders,
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminStatusText,
} from '../../components/data-display/AdminDataDisplay';
import type {
  BreakGlassRequestRecord,
  FeatureFlagRecord,
} from '../../lib/admin-types';
import type { AgentzySecurityAlert } from '@/apps/web/lib/api-client';

export function SecurityCenterView({
  mfaEnforced,
  activeSessionsCount,
  ipAllowlistEnabled,
  sessionTtlMinutes,
  breakGlassRequests,
  securityAlerts,
  onAcknowledgeSecurityAlert,
  onOpenBreakGlassModal,
  onDecideBreakGlass,
  currentUserId,
  onOpenSecurityPolicyModal,
  featureFlags,
  onToggleFeatureFlag,
  onBack,
}: {
  mfaEnforced: boolean | null;
  activeSessionsCount: number | null;
  ipAllowlistEnabled: boolean;
  sessionTtlMinutes: number;
  breakGlassRequests: BreakGlassRequestRecord[];
  securityAlerts: AgentzySecurityAlert[];
  onAcknowledgeSecurityAlert: (alertId: string) => Promise<void>;
  onOpenBreakGlassModal: () => void;
  onDecideBreakGlass: (
    id: string,
    action: 'approve' | 'reject' | 'activate' | 'revoke' | 'review'
  ) => void;
  currentUserId: string | null;
  onOpenSecurityPolicyModal: () => void;
  featureFlags: FeatureFlagRecord[];
  onToggleFeatureFlag: (id: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Security Center (MFA, Break-Glass & Integrasi Akses)"
        subtitle="Autentikasi 2FA platform, sesi aktif, persetujuan darurat 2-tahap Break-Glass Access, kebijakan IP allowlist, dan feature flags."
        onBack={onBack}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenBreakGlassModal}
              className="inline-flex h-10 items-center gap-1.5 rounded-[10px] border border-[#B23A48]/40 bg-[#B23A48]/5 px-3.5 text-xs font-semibold text-[#B23A48] hover:bg-[#B23A48]/10 whitespace-nowrap"
            >
              <Lock className="h-4 w-4" />
              <span>Ajukan Break-Glass</span>
            </button>
            <button
              type="button"
              onClick={onOpenSecurityPolicyModal}
              className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#17324D] px-4 text-xs font-semibold text-white hover:bg-[#245477] whitespace-nowrap"
            >
              <Sliders className="h-4 w-4" />
              <span>Atur Kebijakan</span>
            </button>
          </div>
        }
      />

      {/* Top Row matching Screen 27 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#526675]">MFA (2FA)</span>
            <AdminStatusText
              tone={mfaEnforced === null ? 'warning' : mfaEnforced ? 'success' : 'danger'}
              label={mfaEnforced === null ? 'Belum diverifikasi' : mfaEnforced ? 'Aktif' : 'Nonaktif'}
            />
          </div>
          <p className="text-sm font-bold text-[#17324D]">Enforcement MFA hosted Auth</p>
          <p className="text-xs text-[#526675]">
            {mfaEnforced === null ? 'Status provider belum dapat dibaca melalui connector Supabase. Jangan menganggap MFA enforcement aktif.' : mfaEnforced ? 'MFA enforcement terverifikasi.' : 'MFA enforcement tidak aktif.'}
          </p>
        </div>

        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#526675]">Session Aktif</span>
            <KeyRound className="h-4 w-4 text-[#0284C7]" />
          </div>
          <p className="font-mono-tabular text-2xl font-bold text-[#17324D]">
            {activeSessionsCount === null ? '—' : activeSessionsCount}
          </p>
          <p className="text-xs text-[#526675]">
            {activeSessionsCount === null ? 'Jumlah sesi Auth belum tersedia melalui endpoint yang terhubung.' : 'Jumlah sesi aktif dari sumber Auth.'}
          </p>
        </div>

        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#526675]">
              Kebijakan Keamanan
            </span>
            <ShieldCheck className="h-4 w-4 text-[#247A55]" />
          </div>
          <p className="text-sm font-bold text-[#17324D]">
            IP Allowlist: {ipAllowlistEnabled === null ? 'Belum diverifikasi' : ipAllowlistEnabled ? 'Ketat Aktif' : 'Terbuka'}
          </p>
          <p className="text-xs text-[#526675]">
            Batas sesi:{' '}
            <span className="font-mono-tabular font-semibold text-[#17324D]">
              {sessionTtlMinutes === null ? 'Belum diverifikasi' : `${sessionTtlMinutes} menit`}
            </span>
          </p>
        </div>

        <div className="rounded-[14px] border border-[#B23A48]/35 bg-[#B23A48]/5 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#B23A48]">Break-Glass Access</span>
            <Lock className="h-4 w-4 text-[#B23A48]" />
          </div>
          <p className="text-xs font-semibold text-[#17324D]">
            Akses darurat (terkendali, 2-tahap approval, time-bound)
          </p>
          <p className="font-mono-tabular text-[11px] text-[#526675]">
            {breakGlassRequests.filter((b) => b.status === 'Aktif').length} sesi aktif ·
            Semua aksi diaudit
          </p>
        </div>
      </div>

      {/* Security alert feed — source is the durable FastAPI/Supabase event feed. */}
      <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EAF2F6] pb-3">
          <div>
            <h2 className="text-sm font-bold text-[#17324D]">Security Alert Feed</h2>
            <p className="text-xs text-[#526675]">Alert dari audit decision, break-glass, perubahan akses, dan event Supabase Auth yang terhubung dengan request/correlation/trace ID.</p>
          </div>
          <span className="font-mono-tabular text-xs font-bold text-[#17324D]">{securityAlerts.filter((alert) => alert.status === 'open').length} open</span>
        </div>
        {securityAlerts.length === 0 && (
          <p className="rounded-lg border border-dashed border-[#B8C9D3] p-4 text-xs text-[#718391]">Belum ada security alert pada event feed. Tidak ada alert demo yang ditampilkan.</p>
        )}
        {securityAlerts.map((alert) => (
          <div key={alert.id} className="flex flex-col gap-3 rounded-[10px] border border-[#EAF2F6] bg-[#F5F8FA] p-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-[#17324D]">{alert.title}</span>
                <AdminStatusText
                  tone={alert.severity === 'critical' || alert.severity === 'high' ? 'danger' : alert.severity === 'medium' ? 'warning' : 'neutral'}
                  label={`${alert.severity.toUpperCase()} · ${alert.status}`}
                />
              </div>
              <p className="text-xs text-[#526675]">{alert.summary}</p>
              <p className="font-mono-tabular text-[10px] text-[#718391]">
                {alert.occurred_at} · {alert.tenant_id ?? 'Platform'} · {alert.alert_key}
              </p>
              <p className="font-mono-tabular break-all text-[10px] text-[#718391]">
                Request: {alert.request_id ?? '—'} · Correlation: {alert.correlation_id ?? '—'} · Trace: {alert.trace_id ?? '—'}
              </p>
            </div>
            {alert.status === 'open' && (
              <button type="button" onClick={() => void onAcknowledgeSecurityAlert(alert.id)}
                className="h-8 shrink-0 rounded-lg border border-[#B8C9D3] bg-white px-3 text-xs font-semibold text-[#17324D] hover:bg-[#EAF2F6]">
                Acknowledge
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Break-Glass Governance Queue */}
      <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EAF2F6] pb-3">
          <div>
            <h2 className="text-sm font-bold text-[#17324D]">
              Antrean &amp; Sesi Break-Glass Access (Akses Darurat Lintas Tenant)
            </h2>
            <p className="text-xs text-[#526675]">
              Time-bound · Approval-required (min. 2 tahap) · Wajib ditinjau pasca-akses
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {breakGlassRequests.map((req) => (
            <div
              key={req.id}
              className="flex flex-col gap-3 rounded-[10px] border border-[#EAF2F6] bg-[#F5F8FA] p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-[#17324D]">
                    {req.targetTenant}
                  </span>
                  <AdminStatusText
                    tone={
                      req.status === 'Aktif'
                        ? 'danger'
                        : ['Menunggu Approval', 'Menunggu Aktivasi', 'Menunggu Review'].includes(req.status)
                          ? 'warning'
                          : req.status === 'Selesai'
                            ? 'success'
                            : 'neutral'
                    }
                    label={req.status}
                  />
                </div>
                <p className="text-xs text-[#172B3A]">{req.reason}</p>
                <p className="font-mono-tabular text-[11px] text-[#718391]">
                  Requester: {req.actorEmail} · Durasi: {req.durationMinutes} mnt · Approver: {req.approver1}
                </p>
                <p className="font-mono-tabular text-[10px] text-[#718391]">
                  Scope: {req.permissionKeys?.join(', ') || '—'} · {req.approver2}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {req.status === 'Menunggu Approval' && req.requesterUserId !== currentUserId && (
                  <>
                    <button
                      type="button"
                      onClick={() => onDecideBreakGlass(req.id, 'approve')}
                      className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#247A55] px-3 text-xs font-semibold text-white"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Setujui</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDecideBreakGlass(req.id, 'reject')}
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#B23A48]/40 px-2.5 text-xs font-semibold text-[#B23A48]"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Tolak</span>
                    </button>
                  </>
                )}
                {req.status === 'Menunggu Aktivasi' && req.requesterUserId === currentUserId && (
                  <button
                    type="button"
                    onClick={() => onDecideBreakGlass(req.id, 'activate')}
                    className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#B23A48] px-3 text-xs font-semibold text-white"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    <span>Aktifkan</span>
                  </button>
                )}
                {req.status === 'Aktif' &&
                  (req.requesterUserId === currentUserId || req.approverUserId === currentUserId) && (
                    <button
                      type="button"
                      onClick={() => onDecideBreakGlass(req.id, 'revoke')}
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#B23A48]/40 px-3 text-xs font-semibold text-[#B23A48]"
                    >
                      <span>Cabut Akses</span>
                    </button>
                  )}
                {req.status === 'Menunggu Review' && req.requesterUserId !== currentUserId && (
                  <button
                    type="button"
                    onClick={() => onDecideBreakGlass(req.id, 'review')}
                    className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#17324D] px-3 text-xs font-semibold text-white"
                  >
                    <span>Review Pasca-Akses</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Feature Flags */}
      <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 space-y-3">
        <h2 className="text-sm font-bold text-[#17324D]">
          Platform Feature Flags &amp; Kill-Switch
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {featureFlags.map((flag) => (
            <div
              key={flag.id}
              className="flex items-center justify-between gap-3 rounded-[10px] border border-[#EAF2F6] bg-[#F5F8FA] p-3.5"
            >
              <div>
                <p className="text-xs font-bold text-[#17324D]">{flag.label}</p>
                <p className="font-mono-tabular text-[11px] text-[#526675]">
                  {flag.flagKey} · {flag.scope}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onToggleFeatureFlag(flag.id)}
                className={`h-8 shrink-0 rounded-lg px-3 text-xs font-bold ${
                  flag.enabled
                    ? 'bg-[#0284C7] text-white'
                    : 'border border-[#D8E3E9] bg-white text-[#526675]'
                }`}
              >
                {flag.enabled ? 'Aktif' : 'Nonaktif'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
