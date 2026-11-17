'use client';

import React, { useState } from 'react';
import { Bot, ChevronRight, PauseCircle, PlayCircle, ShieldCheck } from 'lucide-react';
import {
  CorporatePageHeader,
  CorporateSegmentedTabs,
} from '../../components/data-display/CorporateDataDisplay';
import { INITIAL_AI_RUNS, formatNumberID } from '../../lib/corporate-data';
import type { AIWorkerRecord } from '../../lib/corporate-types';

export function AIWorkforceView({
  aiWorkers,
  onSelectWorker,
  onToggleWorkerStatus,
  onBack,
}: {
  aiWorkers: AIWorkerRecord[];
  onSelectWorker: (workerId: string) => void;
  onToggleWorkerStatus: (workerId: string) => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<'worker' | 'penggunaan' | 'budget'>('worker');

  const activeCount = aiWorkers.filter((w) => w.status === 'Aktif & Berjalan').length;
  const standbyCount = aiWorkers.filter((w) => w.status === 'Menunggu Tugas').length;

  return (
    <div className="space-y-5">
      <CorporatePageHeader
        title="AI Workforce (Monitoring Operasional)"
        subtitle="Pemantauan performa AI Worker & kolaborasi bersama Staff Sales, Affiliate, dan Teknisi — pengelolaan penuh oleh tim HRD, Admin & Direksi Agentzy"
        onBack={onBack}
      />

      <div className="flex items-start gap-2.5 rounded-[12px] border border-[#87CEEB] bg-[#E6F4F9] px-4 py-3 text-xs text-[#17324D]">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0284C7]" />
        <div>
          <span className="font-bold">Portal Monitoring Corporate / ISP:</span>{' '}
          Perusahaan mitra memantau kinerja, SLA, penggunaan kuota AI Credits, dan hasil kolaborasi tim lapangan. Penugasan dan pengikatan Staff Human ↔ Staff AI dikelola langsung oleh Divisi HRD, Admin, dan Direksi Agentzy.
        </div>
      </div>

      <CorporateSegmentedTabs
        tabs={[
          { id: 'worker', label: 'AI Worker' },
          { id: 'penggunaan', label: 'Penggunaan' },
          { id: 'budget', label: 'Budget' },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      {tab === 'worker' && (
        <div className="space-y-5">
          {/* Header Total AI Worker Summary (Matches Screen 6) */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#E6F4F9] text-[#0284C7]">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#526675]">Total AI Worker</p>
                  <p className="font-mono-tabular text-2xl font-bold text-[#17324D]">
                    24
                  </p>
                  <p className="text-xs text-[#526675]">
                    (20 Aktif · 4 Standby)
                  </p>
                </div>
              </div>

              <div className="mt-5 divide-y divide-[#EAF2F6] border-t border-[#EAF2F6] pt-2 text-sm">
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-[#526675]">Aktif &amp; Berjalan</span>
                  <span className="font-mono-tabular font-bold text-[#247A55]">20</span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-[#526675]">Menunggu Tugas</span>
                  <span className="font-mono-tabular font-bold text-[#0284C7]">2</span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-[#526675]">Maintenance</span>
                  <span className="font-mono-tabular font-bold text-[#A96816]">1</span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-[#526675]">Nonaktif</span>
                  <span className="font-mono-tabular font-bold text-[#718391]">1</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-7">
              <div>
                <h2 className="text-base font-bold text-[#17324D]">
                  Penggunaan Bulan Ini
                </h2>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="rounded-[12px] bg-[#F5F8FA] p-4">
                    <span className="text-xs text-[#526675]">Tokens</span>
                    <p className="mt-1 font-mono-tabular text-2xl font-bold text-[#17324D]">
                      38,6 M
                    </p>
                  </div>
                  <div className="rounded-[12px] bg-[#F5F8FA] p-4">
                    <span className="text-xs text-[#526675]">Biaya Estimasi</span>
                    <p className="mt-1 font-mono-tabular text-2xl font-bold text-[#17324D]">
                      Rp 186 jt
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 border-t border-[#EAF2F6] pt-4">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#17324D]">Budget Bulanan</span>
                  <span className="font-mono-tabular text-[#247A55]">
                    Rp 186 jt · 62%
                  </span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#EAF2F6]">
                  <div
                    className="h-full rounded-full bg-[#247A55]"
                    style={{ width: '62%' }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-[#718391]">
                  {activeCount} agen aktif &amp; {standbyCount} standby pada registry utama · Semua pemanggilan melalui AI Gateway
                </p>
              </div>
            </div>
          </div>

          {/* Registry List */}
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#17324D]">
                  Daftar AI Worker Terdaftar
                </h2>
                <p className="text-xs text-[#526675]">
                  Klik kartu untuk melihat Job Description, supervisor, izin tool, dan kontrol status
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0284C7]">
                <ShieldCheck className="h-4 w-4" />
                <span>Policy Enforced</span>
              </span>
            </div>

            <div className="mt-4 divide-y divide-[#EAF2F6]">
              {aiWorkers.map((w) => {
                const isRunning = w.status === 'Aktif & Berjalan';
                return (
                  <div
                    key={w.id}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <button
                      type="button"
                      onClick={() => onSelectWorker(w.id)}
                      className="flex flex-1 items-start gap-3 text-left"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#0284C7]">
                        <Bot className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-[#17324D]">
                            {w.name}
                          </span>
                          <span className="font-mono-tabular text-[11px] font-semibold text-[#0284C7]">
                            Autonomy {w.autonomyLevel}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-[#526675]">{w.role}</p>
                        <p className="mt-1 text-[11px] text-[#718391]">
                          Supervisor: {w.supervisor} · {w.department} · SLA {String(w.slaCompliancePct).replace('.', ',')}%
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <div className="text-right">
                        <p className="font-mono-tabular text-xs font-bold text-[#17324D]">
                          {formatNumberID(w.creditsUsed)} Credits
                        </p>
                        <p
                          className={`text-[11px] font-semibold ${
                            isRunning ? 'text-[#247A55]' : 'text-[#A96816]'
                          }`}
                        >
                          {w.status}
                        </p>
                      </div>

                      <span className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-[#D8E3E9] bg-[#F5F8FA] px-2.5 text-[11px] font-semibold text-[#526675] whitespace-nowrap">
                        {isRunning ? (
                          <>
                            <PlayCircle className="h-3.5 w-3.5 text-[#247A55]" />
                            <span>Terkelola Agentzy</span>
                          </>
                        ) : (
                          <>
                            <PauseCircle className="h-3.5 w-3.5 text-[#A96816]" />
                            <span>Standby Agentzy</span>
                          </>
                        )}
                      </span>

                      <button
                        type="button"
                        onClick={() => onSelectWorker(w.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-[8px] text-[#526675] hover:bg-[#EAF2F6]"
                        aria-label={`Detail ${w.name}`}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === 'penggunaan' && (
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
          <h2 className="text-base font-bold text-[#17324D]">
            Riwayat Eksekusi AI Run Terakhir
          </h2>
          <p className="mt-0.5 text-xs text-[#526675]">
            Setiap run memiliki trace ID, durasi, jumlah token, dan status persetujuan handoff
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#D8E3E9] text-xs font-semibold text-[#526675]">
                  <th className="py-3 pr-4">Run ID &amp; Worker</th>
                  <th className="py-3 px-4">Workflow</th>
                  <th className="py-3 px-4">Handoff</th>
                  <th className="py-3 px-4 text-right">Tokens / Credits</th>
                  <th className="py-3 pl-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAF2F6]">
                {INITIAL_AI_RUNS.map((run) => (
                  <tr key={run.id} className="hover:bg-[#F5F8FA]">
                    <td className="py-3.5 pr-4">
                      <p className="font-mono-tabular text-xs font-bold text-[#0284C7]">
                        {run.id}
                      </p>
                      <p className="text-xs font-semibold text-[#17324D]">
                        {run.workerName}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#526675]">
                      <p className="font-medium text-[#172B3A]">{run.workflowName}</p>
                      <p>{run.startedAt} ({run.durationSec} dtk)</p>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#526675]">
                      {run.handoffTarget ?? 'Internal'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-tabular text-xs">
                      <p className="font-semibold text-[#17324D]">
                        {formatNumberID(run.tokensTotal)} tok
                      </p>
                      <p className="text-[#718391]">{run.creditsCharged} Credits</p>
                    </td>
                    <td className="py-3.5 pl-4 text-right text-xs font-semibold">
                      <span
                        className={
                          run.status === 'Completed'
                            ? 'text-[#247A55]'
                            : run.status === 'Waiting Approval'
                              ? 'text-[#A96816]'
                              : 'text-[#0284C7]'
                        }
                      >
                        {run.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'budget' && (
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
          <h2 className="text-base font-bold text-[#17324D]">
            Alokasi Budget AI Credits per AI Worker
          </h2>
          <p className="mt-0.5 text-xs text-[#526675]">
            Hard stop aktif otomatis jika pemakaian menyentuh 100% batas bulanan
          </p>
          <div className="mt-5 space-y-4">
            {aiWorkers.map((w) => {
              const pct = Math.min(
                100,
                Math.round((w.creditsUsed / w.monthlyBudgetCredits) * 100)
              );
              return (
                <div key={w.id}>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#17324D]">{w.name}</span>
                    <span className="font-mono-tabular text-[#526675]">
                      {formatNumberID(w.creditsUsed)} / {formatNumberID(w.monthlyBudgetCredits)} Credits ({pct}%)
                    </span>
                  </div>
                  <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-[#EAF2F6]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: pct >= 80 ? '#A96816' : '#0284C7',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
