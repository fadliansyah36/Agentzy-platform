'use client';

import React, { useMemo, useState } from 'react';
import {
  Bot,
  ChevronRight,
  PauseCircle,
  PlayCircle,
  Plus,
  Search,
} from 'lucide-react';
import type { AIWorkerEntity } from '../../lib/ai-workforce-types';
import { formatCreditsID } from '../../services/ai-workforce-service';

export function AIWorkerRegistryView({
  aiWorkers,
  onSelectWorker,
  onToggleStatus,
  onOpenStudio,
}: {
  aiWorkers: AIWorkerEntity[];
  onSelectWorker: (workerId: string) => void;
  onToggleStatus: (workerId: string) => void;
  onOpenStudio: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Aktif' | 'Paused' | 'Draft'>('Semua');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return aiWorkers.filter((w) => {
      const matchStatus = statusFilter === 'Semua' || w.status === statusFilter;
      const matchSearch =
        !q ||
        w.name.toLowerCase().includes(q) ||
        w.subtitle.toLowerCase().includes(q) ||
        w.department.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [aiWorkers, search, statusFilter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold text-[#0284C7]">
            Registry AI Worker Terkelola
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#17324D]">
            Daftar AI Worker
          </h1>
          <p className="mt-1 text-xs text-[#526675]">
            Setiap AI Worker memiliki kontrak kerja, supervisor manusia, batas
            otonomi L0–L4, dan target KPI terukur.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenStudio}
          className="inline-flex h-11 sm:h-10 w-full sm:w-auto items-center justify-center gap-1.5 rounded-[10px] bg-[#0284C7] px-4 text-xs font-semibold text-white transition hover:bg-[#0369A1] whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Buat AI Worker</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 rounded-[14px] border border-[#D8E3E9] bg-white p-3.5 sm:p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid w-full grid-cols-4 gap-1 rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] p-1 sm:inline-flex sm:w-auto">
          {(['Semua', 'Aktif', 'Paused', 'Draft'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`rounded-[8px] px-2 sm:px-3.5 py-2 sm:py-1.5 text-center text-xs font-semibold transition truncate ${
                statusFilter === tab
                  ? 'bg-[#17324D] text-white'
                  : 'text-[#526675] hover:text-[#17324D]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#718391]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari AI Worker atau departemen..."
            className="h-10 w-full rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] pl-9 pr-3 text-xs text-[#172B3A] focus:border-[#0284C7] focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Worker List */}
      {filtered.length === 0 ? (
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-10 text-center">
          <Bot className="mx-auto h-9 w-9 text-[#5F879E]" />
          <p className="mt-3 text-sm font-bold text-[#17324D]">
            Tidak ada AI Worker pada filter ini
          </p>
          <p className="mt-1 text-xs text-[#526675]">
            Ubah kata kunci pencarian atau buat AI Worker baru di Studio.
          </p>
          <button
            type="button"
            onClick={onOpenStudio}
            className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#0284C7] px-4 text-xs font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Buat AI Worker Baru</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((w) => (
            <div
              key={w.id}
              className="flex flex-col justify-between rounded-[14px] border border-[#D8E3E9] bg-white p-4 sm:p-5 transition hover:border-[#87CEEB]"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#0284C7]">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <h2 className="text-sm font-bold text-[#17324D]">
                          {w.name}
                        </h2>
                        <span className="font-mono-tabular text-[11px] text-[#718391]">
                          {w.version}
                        </span>
                      </div>
                      <p className="text-xs text-[#526675]">{w.subtitle}</p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-bold ${
                      w.status === 'Aktif' ? 'text-[#247A55]' : 'text-[#A96816]'
                    }`}
                  >
                    {w.status}
                  </span>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-[#526675]">
                  {w.description}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#526675]">
                  <span>Supervisor: {w.supervisor}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-[#17324D]">
                    {w.riskClass}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2.5 border-t border-[#EAF2F6] pt-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-mono-tabular text-[11px] text-[#526675]">
                  Credits: {formatCreditsID(w.creditsUsed)} · SLA{' '}
                  {w.slaCompliancePct}%
                </span>
                <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
                  <button
                    type="button"
                    onClick={() => onToggleStatus(w.id)}
                    className="inline-flex h-9 sm:h-8 flex-1 sm:flex-none items-center justify-center gap-1 rounded-[8px] border border-[#D8E3E9] bg-[#F5F8FA] px-3 text-[11px] font-semibold text-[#17324D] hover:border-[#0284C7]"
                  >
                    {w.status === 'Aktif' ? (
                      <>
                        <PauseCircle className="h-3.5 w-3.5 text-[#A96816]" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-3.5 w-3.5 text-[#247A55]" />
                        <span>Aktifkan</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectWorker(w.id)}
                    className="inline-flex h-9 sm:h-8 flex-1 sm:flex-none items-center justify-center gap-1 rounded-[8px] bg-[#17324D] px-3 text-[11px] font-semibold text-white hover:bg-[#245477]"
                  >
                    <span>Detail</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
