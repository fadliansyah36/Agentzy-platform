'use client';

import React, { useMemo, useState } from 'react';
import { Bot, Plus, Search, ArrowRight, Power } from 'lucide-react';
import {
  AdminPageHeader,
  AdminSegmentedTabs,
  AdminStatusText,
} from '../../components/data-display/AdminDataDisplay';
import { formatNumberID } from '../../lib/admin-data';
import type { AdminAIWorkerRecord } from '../../lib/admin-types';

export function AIWorkerRegistryAdminView({
  aiWorkers,
  onSelectWorker,
  onToggleStatus,
  onOpenCreate,
  onBack,
}: {
  aiWorkers: AdminAIWorkerRecord[];
  onSelectWorker: (workerId: string) => void;
  onToggleStatus: (workerId: string) => void;
  onOpenCreate: () => void;
  onBack: () => void;
}) {
  const [filter, setFilter] = useState<'Semua' | 'Aktif' | 'Draft' | 'Paused'>('Semua');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return aiWorkers.filter((w) => {
      const matchTab = filter === 'Semua' || w.lifecycleStatus === filter;
      const matchQuery =
        !q ||
        w.name.toLowerCase().includes(q) ||
        w.tenantName.toLowerCase().includes(q) ||
        w.workerKey.toLowerCase().includes(q);
      return matchTab && matchQuery;
    });
  }, [aiWorkers, filter, query]);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="AI Worker Registry & Lifecycle"
        subtitle="Kelola seluruh katalog AI Worker lintas tenant, versi konfigurasi, dan status lifecycle."
        onBack={onBack}
        actions={
          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#0284C7] px-4 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Buat AI Worker</span>
          </button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AdminSegmentedTabs
          tabs={[
            { id: 'Semua', label: `Semua (${aiWorkers.length})` },
            {
              id: 'Aktif',
              label: `Aktif (${aiWorkers.filter((w) => w.lifecycleStatus === 'Aktif').length})`,
            },
            {
              id: 'Draft',
              label: `Draft (${aiWorkers.filter((w) => w.lifecycleStatus === 'Draft').length})`,
            },
            {
              id: 'Paused',
              label: `Paused (${aiWorkers.filter((w) => w.lifecycleStatus === 'Paused').length})`,
            },
          ]}
          activeTab={filter}
          onChange={setFilter}
        />

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5F879E]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari AI Worker..."
            className="h-10 w-full rounded-[10px] border border-[#D8E3E9] bg-white pl-9 pr-3 text-xs text-[#172B3A] outline-none focus:border-[#0284C7]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((w) => (
          <div
            key={w.id}
            className="flex flex-col justify-between rounded-[14px] border border-[#D8E3E9] bg-white p-5 transition hover:border-[#87CEEB]"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#0284C7]">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-[#17324D]">
                      {w.name}
                    </h3>
                    <p className="font-mono-tabular text-[11px] text-[#718391]">
                      {w.version} · {w.tenantName}
                    </p>
                  </div>
                </div>
                <AdminStatusText
                  tone={
                    w.lifecycleStatus === 'Aktif'
                      ? 'success'
                      : w.lifecycleStatus === 'Draft'
                        ? 'warning'
                        : 'neutral'
                  }
                  label={w.lifecycleStatus}
                />
              </div>

              <p className="mt-3 text-xs leading-relaxed text-[#526675]">
                {w.roleDescription}
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2 rounded-[10px] bg-[#F5F8FA] p-3 text-[11px]">
                <div>
                  <span className="text-[#718391]">Model Router</span>
                  <p className="font-semibold text-[#17324D]">{w.modelName}</p>
                </div>
                <div>
                  <span className="text-[#718391]">Kredit Bulan Ini</span>
                  <p className="font-mono-tabular font-semibold text-[#17324D]">
                    {formatNumberID(w.monthlyCreditsUsed)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-[#EAF2F6] pt-3">
              <button
                type="button"
                onClick={() => onToggleStatus(w.id)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#D8E3E9] px-2.5 text-xs font-semibold text-[#526675] hover:bg-[#F5F8FA]"
              >
                <Power className="h-3.5 w-3.5" />
                <span>{w.lifecycleStatus === 'Aktif' ? 'Jeda' : 'Aktifkan'}</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectWorker(w.id)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0284C7] hover:underline"
              >
                <span>Detail &amp; Konfigurasi</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
