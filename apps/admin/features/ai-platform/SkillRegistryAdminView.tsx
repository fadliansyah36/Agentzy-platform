'use client';

import React, { useState } from 'react';
import { Puzzle, Plus, Pencil, Trash2, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import {
  AdminPageHeader,
  AdminSegmentedTabs,
  AdminStatusText,
} from '../../components/data-display/AdminDataDisplay';
import type { SkillRegistryRecord } from '../../lib/admin-types';

export function SkillRegistryAdminView({
  skills,
  onOpenModal,
  onDecideApproval,
  onDelete,
  onBack,
}: {
  skills: SkillRegistryRecord[];
  onOpenModal: (skill?: SkillRegistryRecord) => void;
  onDecideApproval: (id: string, status: 'Disetujui' | 'Ditolak') => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<'skills' | 'lisensi' | 'approval'>('skills');

  const pendingSkills = skills.filter((s) => s.approvalStatus === 'Menunggu');

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Skill Registry (License & Approval)"
        subtitle="Inventori skill AI Worker, verifikasi lisensi open-source/proprietary, dan persetujuan risiko keamanan."
        onBack={onBack}
        actions={
          <button
            type="button"
            onClick={() => onOpenModal()}
            className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#0284C7] px-4 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Skill</span>
          </button>
        }
      />

      <AdminSegmentedTabs
        tabs={[
          { id: 'skills', label: `Skills (${skills.length})` },
          { id: 'lisensi', label: 'Lisensi' },
          { id: 'approval', label: `Approval (${pendingSkills.length})` },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      {tab === 'skills' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {skills.map((s) => (
            <div
              key={s.id}
              className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#0284C7]">
                    <Puzzle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#17324D]">{s.name}</h3>
                    <p className="font-mono-tabular text-[11px] text-[#526675]">
                      {s.version} · {s.licenseType}
                    </p>
                  </div>
                </div>
                <AdminStatusText
                  tone={
                    s.approvalStatus === 'Disetujui'
                      ? 'success'
                      : s.approvalStatus === 'Menunggu'
                        ? 'warning'
                        : 'danger'
                  }
                  label={s.approvalStatus}
                />
              </div>

              <div className="rounded-[10px] bg-[#F5F8FA] px-3.5 py-2.5 text-xs text-[#526675] space-y-1">
                <p>
                  Provenance:{' '}
                  <span className="font-semibold text-[#17324D]">{s.provenance}</span>
                </p>
                <p>
                  Risiko:{' '}
                  <span className="font-semibold text-[#17324D]">{s.riskLevel}</span> ·
                  Tools: {s.toolDependencies.join(', ') || 'Tidak ada'}
                </p>
              </div>

              <div className="flex items-center justify-end gap-1.5 border-t border-[#EAF2F6] pt-3">
                {s.approvalStatus === 'Menunggu' && (
                  <button
                    type="button"
                    onClick={() => onDecideApproval(s.id, 'Disetujui')}
                    className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#247A55] px-3 text-xs font-semibold text-white hover:bg-[#1E6647]"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Setujui</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onOpenModal(s)}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#D8E3E9] px-2.5 text-xs font-semibold text-[#0284C7] hover:bg-[#E6F4F9]"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(s.id)}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#D8E3E9] px-2.5 text-xs font-semibold text-[#B23A48] hover:bg-[#B23A48]/10"
                  aria-label={`Hapus ${s.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'lisensi' && (
        <div className="space-y-3">
          {/* Mobile License Cards */}
          <div className="space-y-2.5 md:hidden">
            {skills.map((s) => (
              <div
                key={s.id}
                className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-[#17324D]">
                      {s.name}{' '}
                      <span className="font-mono-tabular font-normal text-[#526675]">
                        ({s.version})
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-[#0284C7]">
                      {s.licenseType}
                    </p>
                  </div>
                  <AdminStatusText
                    tone={
                      s.approvalStatus === 'Disetujui'
                        ? 'success'
                        : s.approvalStatus === 'Menunggu'
                          ? 'warning'
                          : 'danger'
                    }
                    label={s.approvalStatus}
                  />
                </div>
                <p className="text-xs text-[#526675]">
                  Provenance: {s.provenance} · Risiko:{' '}
                  <span className="font-semibold text-[#172B3A]">{s.riskLevel}</span>
                </p>
              </div>
            ))}
          </div>

          {/* Desktop License Table */}
          <div className="hidden overflow-hidden rounded-[14px] border border-[#D8E3E9] bg-white md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#EAF2F6] bg-[#F5F8FA] text-[#526675]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Skill &amp; Versi</th>
                    <th className="px-4 py-3 font-semibold">Tipe Lisensi</th>
                    <th className="px-4 py-3 font-semibold">Provenance &amp; Verifikasi</th>
                    <th className="px-4 py-3 font-semibold">Klasifikasi Risiko</th>
                    <th className="px-4 py-3 font-semibold text-right">Status Approval</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAF2F6]">
                  {skills.map((s) => (
                    <tr key={s.id} className="hover:bg-[#F8FBFD]">
                      <td className="px-4 py-3 font-bold text-[#17324D]">
                        {s.name}{' '}
                        <span className="font-mono-tabular font-normal text-[#526675]">
                          ({s.version})
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#0284C7]">
                        {s.licenseType}
                      </td>
                      <td className="px-4 py-3 text-[#526675]">{s.provenance}</td>
                      <td className="px-4 py-3 font-medium text-[#172B3A]">
                        {s.riskLevel}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <AdminStatusText
                          tone={
                            s.approvalStatus === 'Disetujui'
                              ? 'success'
                              : s.approvalStatus === 'Menunggu'
                                ? 'warning'
                                : 'danger'
                          }
                          label={s.approvalStatus}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'approval' && (
        <div className="space-y-3">
          {pendingSkills.length === 0 ? (
            <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-8 text-center">
              <ShieldCheck className="mx-auto h-8 w-8 text-[#247A55]" />
              <p className="mt-2 text-sm font-bold text-[#17324D]">
                Seluruh skill telah direview
              </p>
              <p className="mt-1 text-xs text-[#526675]">
                Tidak ada pengajuan skill baru yang menunggu approval Super Admin.
              </p>
            </div>
          ) : (
            pendingSkills.map((s) => (
              <div
                key={s.id}
                className="flex flex-col gap-3 rounded-[14px] border border-[#D8E3E9] bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-bold text-[#17324D]">
                    {s.name} ({s.version})
                  </p>
                  <p className="mt-0.5 text-xs text-[#526675]">
                    Lisensi: {s.licenseType} · Provenance: {s.provenance} · Risiko:{' '}
                    {s.riskLevel}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onDecideApproval(s.id, 'Disetujui')}
                    className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-[#247A55] px-3.5 text-xs font-semibold text-white hover:bg-[#1E6647]"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Setujui Skill</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDecideApproval(s.id, 'Ditolak')}
                    className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-[#B23A48]/40 px-3.5 text-xs font-semibold text-[#B23A48] hover:bg-[#B23A48]/10"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Tolak</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
