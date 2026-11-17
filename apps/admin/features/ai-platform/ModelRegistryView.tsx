'use client';

import React, { useState } from 'react';
import { Cpu, Plus, Pencil, Trash2, Power } from 'lucide-react';
import {
  AdminPageHeader,
  AdminSegmentedTabs,
  AdminStatusText,
} from '../../components/data-display/AdminDataDisplay';
import { formatIDR } from '../../lib/admin-data';
import type { ModelRegistryRecord } from '../../lib/admin-types';

export function ModelRegistryView({
  models,
  onOpenCreate,
  onOpenEdit,
  onToggleStatus,
  onDelete,
  onBack,
}: {
  models: ModelRegistryRecord[];
  onOpenCreate: () => void;
  onOpenEdit: (m: ModelRegistryRecord) => void;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}) {
  const [filter, setFilter] = useState<'Semua' | 'Aktif' | 'Nonaktif'>('Semua');

  const filtered = models.filter(
    (m) => filter === 'Semua' || m.status === filter
  );

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Model Registry (Activate / Disable & CRUD)"
        subtitle="Atur allowlist model per kapabilitas, context window, tarif per 1K token, dan residensi."
        onBack={onBack}
        actions={
          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#0284C7] px-4 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Model</span>
          </button>
        }
      />

      <AdminSegmentedTabs
        tabs={[
          { id: 'Semua', label: `Semua (${models.length})` },
          {
            id: 'Aktif',
            label: `Aktif (${models.filter((m) => m.status === 'Aktif').length})`,
          },
          {
            id: 'Nonaktif',
            label: `Nonaktif (${models.filter((m) => m.status === 'Nonaktif').length})`,
          },
        ]}
        activeTab={filter}
        onChange={setFilter}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((m) => (
          <div
            key={m.id}
            className="rounded-[14px] border border-[#D8E3E9] bg-white p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#0284C7]">
                  <Cpu className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#17324D]">{m.name}</h3>
                  <p className="text-xs text-[#526675]">
                    {m.providerName} · {m.capability}
                  </p>
                </div>
              </div>
              <AdminStatusText
                tone={m.status === 'Aktif' ? 'success' : 'neutral'}
                label={m.status}
              />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 rounded-[10px] bg-[#F5F8FA] p-3 text-xs">
              <div>
                <span className="text-[11px] text-[#718391]">Context &amp; Tarif</span>
                <p className="font-mono-tabular font-semibold text-[#17324D]">
                  {m.contextWindow} · {formatIDR(m.costPer1kIdr)}/1K
                </p>
              </div>
              <div>
                <span className="text-[11px] text-[#718391]">Allowlist</span>
                <p className="font-semibold text-[#17324D]">{m.tenantAllowlist}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-[#EAF2F6] pt-3">
              <button
                type="button"
                onClick={() => onToggleStatus(m.id)}
                className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold ${
                  m.status === 'Aktif'
                    ? 'border border-[#D8E3E9] text-[#526675] hover:bg-[#F5F8FA]'
                    : 'bg-[#247A55] text-white hover:bg-[#1D6344]'
                }`}
              >
                <Power className="h-3.5 w-3.5" />
                <span>{m.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}</span>
              </button>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onOpenEdit(m)}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#D8E3E9] px-2.5 text-xs font-semibold text-[#0284C7] hover:bg-[#E6F4F9]"
                >
                  <Pencil className="h-3 w-3" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(m.id)}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#D8E3E9] px-2.5 text-xs font-semibold text-[#B23A48] hover:bg-[#B23A48]/10"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
