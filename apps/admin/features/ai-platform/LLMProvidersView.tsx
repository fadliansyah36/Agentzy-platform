'use client';

import React from 'react';
import { Server, Plus, Pencil, Trash2, Activity } from 'lucide-react';
import {
  AdminPageHeader,
  AdminStatusText,
} from '../../components/data-display/AdminDataDisplay';
import { formatNumberID } from '../../lib/admin-data';
import type { LLMProviderRecord } from '../../lib/admin-types';

export function LLMProvidersView({
  providers,
  onOpenCreate,
  onOpenEdit,
  onDelete,
  onTestHealth,
  onBack,
}: {
  providers: LLMProviderRecord[];
  onOpenCreate: () => void;
  onOpenEdit: (p: LLMProviderRecord) => void;
  onDelete: (id: string) => void;
  onTestHealth: (name: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="LLM Provider Registry (CRUD)"
        subtitle="Kelola penyedia LLM terotorisasi, referensi secret vault, residensi regional, dan kesehatan AI Gateway."
        onBack={onBack}
        actions={
          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#0284C7] px-4 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Provider</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {providers.map((p) => (
          <div
            key={p.id}
            className="rounded-[14px] border border-[#D8E3E9] bg-white p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#0284C7]">
                  <Server className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#17324D]">{p.name}</h3>
                  <p className="text-xs text-[#526675]">{p.vendor}</p>
                </div>
              </div>
              <AdminStatusText
                tone={p.status === 'Terhubung' ? 'success' : 'neutral'}
                label={p.status === 'Terhubung' ? 'Aktif · Terhubung' : 'Nonaktif'}
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 rounded-[10px] bg-[#F5F8FA] p-3 text-xs">
              <div>
                <span className="text-[11px] text-[#718391]">Region / DPA</span>
                <p className="font-semibold text-[#17324D]">{p.region}</p>
              </div>
              <div>
                <span className="text-[11px] text-[#718391]">Rate Limit &amp; Latensi</span>
                <p className="font-mono-tabular font-semibold text-[#17324D]">
                  {formatNumberID(p.rateLimitRpm)} RPM · {p.avgLatencyMs}ms
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-[11px] text-[#718391]">Secret Manager Ref</span>
                <p className="font-mono-tabular text-[11px] text-[#526675]">
                  {p.secretRef}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#EAF2F6] pt-3">
              <button
                type="button"
                onClick={() => onTestHealth(p.name)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#D8E3E9] px-2.5 text-xs font-semibold text-[#17324D] hover:bg-[#E6F4F9]"
              >
                <Activity className="h-3.5 w-3.5 text-[#247A55]" />
                <span>Uji Koneksi</span>
              </button>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onOpenEdit(p)}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#D8E3E9] px-2.5 text-xs font-semibold text-[#0284C7] hover:bg-[#E6F4F9]"
                >
                  <Pencil className="h-3 w-3" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(p.id)}
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
