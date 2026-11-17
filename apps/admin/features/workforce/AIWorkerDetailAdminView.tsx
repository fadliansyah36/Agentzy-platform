'use client';

import React, { useState } from 'react';
import { Bot, Pencil, Power, ArrowLeft, Trash2 } from 'lucide-react';
import {
  AdminPageHeader,
  AdminSegmentedTabs,
  AdminStatusText,
} from '../../components/data-display/AdminDataDisplay';
import type { AdminAIWorkerRecord } from '../../lib/admin-types';

const LIFECYCLE_STAGES: Array<AdminAIWorkerRecord['lifecycleStatus']> = [
  'Draft',
  'Configured',
  'Policy Review',
  'Aktif',
  'Paused',
  'Retired',
];

export function AIWorkerDetailAdminView({
  worker,
  allWorkers,
  onSelectWorker,
  onEditWorker,
  onDeleteWorker,
  onToggleStatus,
  onChangeLifecycle,
  onBackToRegistry,
}: {
  worker: AdminAIWorkerRecord;
  allWorkers: AdminAIWorkerRecord[];
  onSelectWorker: (id: string) => void;
  onEditWorker: (w: AdminAIWorkerRecord) => void;
  onDeleteWorker?: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onChangeLifecycle: (id: string, status: AdminAIWorkerRecord['lifecycleStatus']) => void;
  onBackToRegistry: () => void;
}) {
  const [tab, setTab] = useState<'info' | 'konfigurasi' | 'lifecycle'>('info');

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Detail AI Worker & Konfigurasi"
        subtitle="Inspeksi job contract, model router, skills/tools binding, memory scope, dan state lifecycle."
        onBack={onBackToRegistry}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBackToRegistry}
              className="inline-flex h-10 items-center gap-1.5 rounded-[10px] border border-[#D8E3E9] bg-white px-3 text-xs font-semibold text-[#17324D] hover:bg-[#F5F8FA]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Registry</span>
            </button>
            <select
              value={worker.id}
              onChange={(e) => onSelectWorker(e.target.value)}
              className="h-10 rounded-[10px] border border-[#D8E3E9] bg-white px-3 text-xs font-semibold text-[#17324D]"
            >
              {allWorkers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.version})
                </option>
              ))}
            </select>
          </div>
        }
      />

      {/* Top Worker Card matching Screen 11 */}
      <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
        <div className="flex flex-col justify-between gap-4 border-b border-[#EAF2F6] pb-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#E6F4F9] text-[#0284C7]">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-[#17324D]">{worker.name}</h2>
                <AdminStatusText
                  tone={worker.lifecycleStatus === 'Aktif' ? 'success' : 'warning'}
                  label={`${worker.version} · ${worker.lifecycleStatus}`}
                />
              </div>
              <p className="text-xs text-[#526675]">
                {worker.tenantName} · {worker.autonomyLevel}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onEditWorker(worker)}
              className="inline-flex h-10 sm:h-9 items-center gap-1.5 rounded-[9px] bg-[#0284C7] px-3.5 text-xs font-semibold text-white hover:bg-[#0369A1]"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleStatus(worker.id)}
              className="inline-flex h-10 sm:h-9 items-center gap-1.5 rounded-[9px] border border-[#D8E3E9] bg-white px-3.5 text-xs font-semibold text-[#17324D] hover:bg-[#F5F8FA]"
            >
              <Power className="h-3.5 w-3.5" />
              <span>
                {worker.lifecycleStatus === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
              </span>
            </button>
            {onDeleteWorker && (
              <button
                type="button"
                onClick={() => onDeleteWorker(worker.id)}
                className="inline-flex h-10 sm:h-9 items-center gap-1.5 rounded-[9px] border border-[#D8E3E9] bg-white px-3 text-xs font-semibold text-[#B23A48] hover:bg-[#B23A48]/10"
                aria-label={`Hapus ${worker.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Hapus</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-4">
          <AdminSegmentedTabs
            tabs={[
              { id: 'info', label: 'Info' },
              { id: 'konfigurasi', label: 'Konfigurasi' },
              { id: 'lifecycle', label: 'Lifecycle' },
            ]}
            activeTab={tab}
            onChange={setTab}
          />
        </div>

        {tab === 'info' && (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-[10px] bg-[#F5F8FA] p-4">
              <p className="text-[11px] font-medium text-[#718391]">Peran</p>
              <p className="mt-1 text-xs font-bold text-[#17324D]">
                {worker.roleDescription}
              </p>
            </div>
            <div className="rounded-[10px] bg-[#F5F8FA] p-4">
              <p className="text-[11px] font-medium text-[#718391]">Model</p>
              <p className="mt-1 text-xs font-bold text-[#17324D]">{worker.modelName}</p>
            </div>
            <div className="rounded-[10px] bg-[#F5F8FA] p-4">
              <p className="text-[11px] font-medium text-[#718391]">Skills</p>
              <p className="mt-1 text-xs font-bold text-[#17324D]">
                {worker.skills.join(', ')}
              </p>
            </div>
            <div className="rounded-[10px] bg-[#F5F8FA] p-4">
              <p className="text-[11px] font-medium text-[#718391]">Memory</p>
              <p className="mt-1 text-xs font-bold text-[#247A55]">
                {worker.memoryMode}
              </p>
            </div>
            <div className="rounded-[10px] bg-[#F5F8FA] p-4">
              <p className="text-[11px] font-medium text-[#718391]">SLA</p>
              <p className="mt-1 font-mono-tabular text-xs font-bold text-[#17324D]">
                {worker.slaTarget} (Aktual: {worker.successRatePct}%)
              </p>
            </div>
            <div className="rounded-[10px] bg-[#F5F8FA] p-4">
              <p className="text-[11px] font-medium text-[#718391]">Tools Diizinkan</p>
              <p className="mt-1 text-xs font-bold text-[#17324D]">
                {worker.tools.join(', ')}
              </p>
            </div>
          </div>
        )}

        {tab === 'konfigurasi' && (
          <div className="mt-5 space-y-3 text-xs">
            <div className="flex flex-col gap-1 rounded-[10px] border border-[#EAF2F6] bg-[#F5F8FA] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-semibold text-[#17324D]">Worker Key &amp; Tenant Scope</span>
              <span className="font-mono-tabular text-[#526675]">
                {worker.workerKey} · {worker.tenantId}
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-[10px] border border-[#EAF2F6] bg-[#F5F8FA] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-semibold text-[#17324D]">Batas Otonomi (PRD §7)</span>
              <span className="font-semibold text-[#0284C7]">{worker.autonomyLevel}</span>
            </div>
            <div className="flex flex-col gap-1 rounded-[10px] border border-[#EAF2F6] bg-[#F5F8FA] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-semibold text-[#17324D]">Policy Eksekusi Eksternal</span>
              <span className="text-[#526675] sm:text-right">
                Wajib melalui Backend AI Gateway + Human Approval untuk aksi finansial
              </span>
            </div>
          </div>
        )}

        {tab === 'lifecycle' && (
          <div className="mt-5">
            <p className="mb-3 text-xs text-[#526675]">
              Transisi state AI Worker tercatat di Audit Log Control Plane:
            </p>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
              {LIFECYCLE_STAGES.map((stage) => {
                const active = worker.lifecycleStatus === stage;
                return (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => onChangeLifecycle(worker.id, stage)}
                    className={`min-h-[44px] rounded-[10px] border px-3 py-2 text-xs font-semibold transition ${
                      active
                        ? 'border-[#0284C7] bg-[#0284C7] text-white'
                        : 'border-[#D8E3E9] bg-[#F5F8FA] text-[#17324D] hover:bg-[#E6F4F9]'
                    }`}
                  >
                    {stage}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
