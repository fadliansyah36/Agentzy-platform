'use client';

import React, { useMemo, useState } from 'react';
import {
  Activity,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Eye,
  Wrench,
} from 'lucide-react';
import type { WorkflowRunItem } from '../../lib/ai-workforce-types';

export function WorkflowRunsView({
  runs,
  onOpenRunDetail,
  onRetryRun,
  onOpenCompensationModal,
}: {
  runs: WorkflowRunItem[];
  onOpenRunDetail: (runId: string) => void;
  onRetryRun: (runId: string) => void;
  onOpenCompensationModal: (runId: string) => void;
}) {
  const [filterStatus, setFilterStatus] = useState<
    'Semua' | 'Running' | 'Menunggu Approval' | 'Selesai' | 'Gagal'
  >('Semua');
  const [viewMode, setViewMode] = useState<'execution' | 'monitoring' | 'recovery'>(
    'execution'
  );
  const [recoveryTab, setRecoveryTab] = useState<'Gagal' | 'Retry' | 'DLQ'>('Gagal');
  const [search, setSearch] = useState('');

  const counts = useMemo(() => {
    return {
      running: runs.filter((r) => r.status === 'Running').length,
      waiting: runs.filter((r) => r.status === 'Menunggu Approval').length,
      success: runs.filter((r) => r.status === 'Selesai').length,
      failed: runs.filter((r) => r.status === 'Gagal').length,
      retry: runs.filter((r) => r.status === 'Retry').length,
      dlq: runs.filter((r) => r.dlqFlag).length,
    };
  }, [runs]);

  const filteredRuns = useMemo(() => {
    return runs.filter((r) => {
      if (viewMode === 'recovery') {
        if (recoveryTab === 'Gagal' && r.status !== 'Gagal') return false;
        if (recoveryTab === 'Retry' && r.status !== 'Retry' && r.status !== 'Running') return false;
        if (recoveryTab === 'DLQ' && !r.dlqFlag) return false;
      } else {
        if (filterStatus !== 'Semua' && r.status !== filterStatus) return false;
      }
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        r.id.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.workerOrWorkflowName.toLowerCase().includes(q)
      );
    });
  }, [runs, viewMode, recoveryTab, filterStatus, search]);

  return (
    <div className="space-y-5">
      {/* Header (Screens 17, 29, 30, 35, 36, 37) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-[#0284C7]">
            Screens 17, 29, 30, 35, 36 &amp; 37 · Execution, Monitoring &amp; Recovery
          </p>
          <h1 className="text-xl font-bold text-[#17324D] sm:text-2xl">
            AI &amp; Workflow Execution Center
          </h1>
          <p className="mt-0.5 text-xs text-[#526675]">
            Pantau status eksekusi durable, jejak langkah AI/Human, serta recovery &amp; kompensasi jika terjadi kendala.
          </p>
        </div>

        <div className="grid w-full grid-cols-3 gap-1 rounded-[10px] border border-[#D8E3E9] bg-white p-1 sm:inline-flex sm:w-auto">
          {(
            [
              { id: 'execution', label: 'Daftar Run' },
              { id: 'monitoring', label: 'Health & SLA' },
              { id: 'recovery', label: `Recovery (${counts.failed})` },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setViewMode(m.id)}
              className={`h-9 sm:h-8 rounded-[8px] px-2 sm:px-3 text-center text-[11px] sm:text-xs font-semibold whitespace-nowrap truncate ${
                viewMode === m.id
                  ? 'bg-[#0284C7] text-white'
                  : 'text-[#526675] hover:text-[#17324D]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Screen 37: Workflow Monitoring & Health KPI Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4">
          <p className="text-xs font-medium text-[#526675]">Sedang Running</p>
          <p className="mt-1 font-mono-tabular text-2xl font-bold text-[#0284C7]">
            {counts.running}
          </p>
        </div>
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4">
          <p className="text-xs font-medium text-[#526675]">Sukses (Bulan Ini)</p>
          <p className="mt-1 font-mono-tabular text-2xl font-bold text-[#247A55]">
            1.240
          </p>
        </div>
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4">
          <p className="text-xs font-medium text-[#526675]">Perlu Pemulihan</p>
          <p className="mt-1 font-mono-tabular text-2xl font-bold text-[#B23A48]">
            {counts.failed}
          </p>
        </div>
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4">
          <p className="text-xs font-medium text-[#526675]">SLA Tercapai</p>
          <p className="mt-1 font-mono-tabular text-2xl font-bold text-[#17324D]">
            98,6%
          </p>
        </div>
      </div>

      {/* Monitoring Health Chart View (Screen 37) */}
      {viewMode === 'monitoring' && (
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EAF2F6] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#17324D]">
                Status Eksekusi 24 Jam Terakhir
              </h2>
              <p className="text-xs text-[#526675]">
                Rata-rata durasi eksekusi: <strong className="text-[#17324D]">7,2 mnt</strong> · Tingkat kepatuhan SLA: <strong className="text-[#247A55]">98,6%</strong>
              </p>
            </div>
          </div>
          <div className="grid grid-cols-6 gap-1.5 sm:gap-3 items-end h-40 pt-4">
            {[
              { hour: '00:00', ok: 58, fail: 2 },
              { hour: '04:00', ok: 42, fail: 1 },
              { hour: '08:00', ok: 86, fail: 3 },
              { hour: '12:00', ok: 94, fail: 2 },
              { hour: '16:00', ok: 88, fail: 4 },
              { hour: '20:00', ok: 72, fail: 1 },
            ].map((bar) => (
              <div key={bar.hour} className="flex flex-col items-center gap-1.5 h-full justify-end">
                <div className="flex items-end gap-1 w-full justify-center h-28">
                  <div
                    className="w-3.5 sm:w-5 rounded-t-[6px] bg-[#0284C7]"
                    style={{ height: `${bar.ok}%` }}
                    title={`Sukses: ${bar.ok}`}
                  />
                  <div
                    className="w-2 sm:w-2.5 rounded-t-[4px] bg-[#B23A48]"
                    style={{ height: `${Math.max(8, bar.fail * 5)}%` }}
                    title={`Gagal: ${bar.fail}`}
                  />
                </div>
                <span className="font-mono-tabular text-[10px] sm:text-[11px] text-[#526675]">
                  {bar.hour}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Status Filter */}
      <div className="flex flex-col gap-3 rounded-[14px] border border-[#D8E3E9] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#718391]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari ID Run, workflow, atau AI Worker..."
            className="h-10 w-full rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] pl-9 pr-3 text-xs"
          />
        </div>

        {viewMode === 'recovery' ? (
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: 'Gagal', label: `Gagal (${counts.failed})` },
                { id: 'Retry', label: `Retry (${counts.retry})` },
                { id: 'DLQ', label: `DLQ (${counts.dlq})` },
              ] as const
            ).map((rt) => (
              <button
                key={rt.id}
                type="button"
                onClick={() => setRecoveryTab(rt.id)}
                className={`h-8 rounded-[8px] border px-3 text-xs font-semibold whitespace-nowrap ${
                  recoveryTab === rt.id
                    ? 'border-[#B23A48] bg-[#B23A48]/10 text-[#B23A48]'
                    : 'border-[#D8E3E9] bg-white text-[#526675]'
                }`}
              >
                {rt.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex min-w-0 gap-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:pb-0">
            {(
              ['Semua', 'Running', 'Menunggu Approval', 'Selesai', 'Gagal'] as const
            ).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilterStatus(s)}
                className={`h-9 sm:h-8 shrink-0 rounded-[8px] border px-2.5 text-xs font-semibold whitespace-nowrap ${
                  filterStatus === s
                    ? 'border-[#0284C7] bg-[#E6F4F9] text-[#17324D]'
                    : 'border-[#D8E3E9] bg-white text-[#526675]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Runs List (Screens 17, 29, 30, 35, 36) */}
      <div className="space-y-3">
        {filteredRuns.map((run) => {
          const isFailed = run.status === 'Gagal';
          const isDone = run.status === 'Selesai';
          return (
            <div
              key={run.id}
              className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 space-y-3"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${
                      isFailed
                        ? 'bg-[#B23A48]/10 text-[#B23A48]'
                        : isDone
                          ? 'bg-[#247A55]/10 text-[#247A55]'
                          : 'bg-[#E6F4F9] text-[#0284C7]'
                    }`}
                  >
                    {isFailed ? (
                      <AlertTriangle className="h-5 w-5" />
                    ) : isDone ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Activity className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono-tabular text-xs font-bold text-[#0284C7]">
                        {run.id}
                      </span>
                      <span className="text-[11px] text-[#718391]">
                        · {run.runType} · {run.workerOrWorkflowName}
                      </span>
                      {run.dlqFlag && (
                        <span className="rounded-[5px] bg-[#B23A48]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#B23A48]">
                          DLQ
                        </span>
                      )}
                    </div>
                    <h3 className="mt-0.5 text-sm font-bold text-[#17324D]">
                      {run.title}
                    </h3>
                    <p className="mt-1 text-xs text-[#526675]">
                      {run.errorMessage ? run.errorMessage : run.outputSummary}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1 font-mono-tabular text-[11px] text-[#718391]">
                    <Clock className="h-3.5 w-3.5" />
                    {run.durationLabel}
                  </span>
                  <span
                    className={`rounded-[6px] px-2.5 py-1 text-xs font-semibold ${
                      isFailed
                        ? 'bg-[#B23A48]/10 text-[#B23A48]'
                        : isDone
                          ? 'bg-[#247A55]/10 text-[#247A55]'
                          : run.status === 'Menunggu Approval'
                            ? 'bg-[#A96816]/10 text-[#A96816]'
                            : 'bg-[#0284C7]/10 text-[#0284C7]'
                    }`}
                  >
                    {run.status}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EAF2F6]">
                <div
                  className={`h-full rounded-full ${
                    isFailed
                      ? 'bg-[#B23A48]'
                      : isDone
                        ? 'bg-[#247A55]'
                        : 'bg-[#0284C7]'
                  }`}
                  style={{ width: `${run.progressPct}%` }}
                />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <span className="text-[11px] text-[#718391]">
                  Mulai: {run.startedAt} · {run.steps.length} langkah terekam
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenRunDetail(run.id)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-[#D8E3E9] bg-[#F5F8FA] px-3 text-xs font-semibold text-[#17324D] hover:border-[#0284C7] whitespace-nowrap"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>{isFailed ? 'Analisis & Perbaiki' : 'Detail & Trace'}</span>
                  </button>

                  {isFailed && (
                    <>
                      <button
                        type="button"
                        onClick={() => onRetryRun(run.id)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-[8px] bg-[#0284C7] px-3 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Retry</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenCompensationModal(run.id)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-[#B23A48]/40 bg-[#B23A48]/5 px-3 text-xs font-semibold text-[#B23A48] hover:bg-[#B23A48]/10 whitespace-nowrap"
                      >
                        <Wrench className="h-3.5 w-3.5" />
                        <span>Kompensasi</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
