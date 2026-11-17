'use client';

import React, { useState } from 'react';
import { Wrench, Plus, Pencil, Trash2, ShieldAlert } from 'lucide-react';
import {
  AdminPageHeader,
  AdminSegmentedTabs,
  AdminStatusText,
} from '../../components/data-display/AdminDataDisplay';
import type { ToolRegistryRecord } from '../../lib/admin-types';

export function ToolRegistryAdminView({
  tools,
  onOpenModal,
  onDelete,
  onBack,
}: {
  tools: ToolRegistryRecord[];
  onOpenModal: (tool?: ToolRegistryRecord) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<'tools' | 'permission' | 'risiko'>('tools');

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Tool Registry (Permission & Sandbox)"
        subtitle="Tata kelola eksekusi tools eksternal & internal, isolasi sandbox, batas laju (rate limit), dan kontrol persetujuan manusia."
        onBack={onBack}
        actions={
          <button
            type="button"
            onClick={() => onOpenModal()}
            className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#0284C7] px-4 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Daftarkan Tool</span>
          </button>
        }
      />

      <AdminSegmentedTabs
        tabs={[
          { id: 'tools', label: `Tools (${tools.length})` },
          { id: 'permission', label: 'Permission' },
          { id: 'risiko', label: 'Risiko & Sandbox' },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      {tab === 'tools' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {tools.map((t) => (
            <div
              key={t.id}
              className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#EAF2F6] text-[#17324D]">
                    <Wrench className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#17324D]">{t.name}</h3>
                    <p className="font-mono-tabular text-[11px] text-[#526675]">
                      {t.environment} · Risiko: {t.riskLevel}
                    </p>
                  </div>
                </div>
                <AdminStatusText
                  tone={t.status === 'Aktif' ? 'success' : 'warning'}
                  label={t.status}
                />
              </div>

              <div className="rounded-[10px] bg-[#F5F8FA] px-3.5 py-2.5 text-xs text-[#526675] space-y-1">
                <p>
                  Timeout:{' '}
                  <span className="font-mono-tabular font-semibold text-[#17324D]">
                    {t.timeoutSec} detik
                  </span>{' '}
                  · Rate Limit:{' '}
                  <span className="font-mono-tabular font-semibold text-[#17324D]">
                    {t.rateLimitPerMin}/menit
                  </span>
                </p>
                <p>
                  Human Approval:{' '}
                  <span className="font-semibold text-[#17324D]">
                    {t.requiresApproval ? 'Wajib (Gated)' : 'Otomatis (Allowlist)'}
                  </span>
                </p>
              </div>

              <div className="flex items-center justify-end gap-1.5 border-t border-[#EAF2F6] pt-3">
                <button
                  type="button"
                  onClick={() => onOpenModal(t)}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#D8E3E9] px-2.5 text-xs font-semibold text-[#0284C7] hover:bg-[#E6F4F9]"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(t.id)}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#D8E3E9] px-2.5 text-xs font-semibold text-[#B23A48] hover:bg-[#B23A48]/10"
                  aria-label={`Hapus ${t.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'permission' && (
        <div className="space-y-3">
          {/* Mobile Permission Cards */}
          <div className="space-y-2.5 md:hidden">
            {tools.map((t) => (
              <div
                key={t.id}
                className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-[#17324D]">{t.name}</p>
                  <AdminStatusText
                    tone={t.requiresApproval ? 'warning' : 'success'}
                    label={t.requiresApproval ? 'Wajib Approval' : 'Bounded Auto'}
                  />
                </div>
                <p className="text-xs text-[#526675]">
                  Role: {t.allowedRoles.join(', ') || 'Belum diikat'}
                </p>
                <div className="flex items-center justify-between rounded-[10px] bg-[#F5F8FA] px-3 py-2 text-[11px]">
                  <span className="text-[#526675]">Rate Limit</span>
                  <span className="font-mono-tabular font-bold text-[#17324D]">
                    {t.rateLimitPerMin} req/mnt
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Permission Table */}
          <div className="hidden overflow-hidden rounded-[14px] border border-[#D8E3E9] bg-white md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#EAF2F6] bg-[#F5F8FA] text-[#526675]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Nama Tool</th>
                    <th className="px-4 py-3 font-semibold">AI Worker Diizinkan</th>
                    <th className="px-4 py-3 font-semibold">Human-in-the-Loop</th>
                    <th className="px-4 py-3 font-semibold text-right">Rate Limit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAF2F6]">
                  {tools.map((t) => (
                    <tr key={t.id} className="hover:bg-[#F8FBFD]">
                      <td className="px-4 py-3 font-bold text-[#17324D]">{t.name}</td>
                      <td className="px-4 py-3 text-[#526675]">
                        {t.allowedRoles.join(', ') || 'Belum diikat'}
                      </td>
                      <td className="px-4 py-3">
                        <AdminStatusText
                          tone={t.requiresApproval ? 'warning' : 'success'}
                          label={t.requiresApproval ? 'Wajib Approval' : 'Bounded Auto'}
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-mono-tabular font-semibold text-[#17324D]">
                        {t.rateLimitPerMin} req/mnt
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'risiko' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {tools.map((t) => (
            <div
              key={t.id}
              className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#17324D]">{t.name}</span>
                <AdminStatusText
                  tone={
                    t.riskLevel === 'Tinggi'
                      ? 'danger'
                      : t.riskLevel === 'Sedang'
                        ? 'warning'
                        : 'success'
                  }
                  label={`Risiko ${t.riskLevel}`}
                />
              </div>
              <p className="text-xs text-[#526675]">
                Lingkungan eksekusi:{' '}
                <span className="font-semibold text-[#17324D]">{t.environment}</span>
              </p>
              <div className="flex items-start gap-2 rounded-[10px] bg-[#F5F8FA] p-3 text-[11px] text-[#526675]">
                <ShieldAlert className="h-4 w-4 shrink-0 text-[#0284C7]" />
                <span>
                  {t.environment === 'Sandbox'
                    ? 'Eksekusi terisolasi di container Sandbox dengan audit log penuh & persetujuan wajib.'
                    : 'Eksekusi produksi dengan token ter-scope per tenant dan pembatasan laju otomatis.'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
