'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Edit3,
  GitCommit,
  RotateCcw,
  ShieldCheck,
  Target,
} from 'lucide-react';
import type { AIWorkerEntity } from '../../lib/ai-workforce-types';
import { formatCreditsID, formatIDRCompact } from '../../services/ai-workforce-service';

type DetailTab = 'info' | 'jd' | 'kpi' | 'config' | 'version';

export function AIWorkerDetailView({
  worker,
  allWorkers,
  onSelectWorker,
  onBack,
  onEditJD,
  onCreateNewVersion,
  onRollbackVersion,
}: {
  worker: AIWorkerEntity;
  allWorkers: AIWorkerEntity[];
  onSelectWorker: (id: string) => void;
  onBack: () => void;
  onEditJD: (workerId: string) => void;
  onCreateNewVersion: (workerId: string, notes: string) => void;
  onRollbackVersion: (workerId: string, version: string) => void;
}) {
  const [tab, setTab] = useState<DetailTab>('info');
  const [jdSubTab, setJdSubTab] = useState<'jd' | 'io'>('jd');
  const [versionNotes, setVersionNotes] = useState('');

  return (
    <div className="space-y-5">
      {/* Top Bar */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="flex h-10 w-10 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-[9px] border border-[#D8E3E9] bg-white text-[#17324D] hover:border-[#0284C7]"
            aria-label="Kembali ke Registry AI Worker"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <h1 className="text-lg sm:text-xl font-bold text-[#17324D] truncate">{worker.name}</h1>
              <span className="font-mono-tabular text-xs font-semibold text-[#0284C7]">
                {worker.version} · {worker.status}
              </span>
            </div>
            <p className="text-xs text-[#526675] truncate">{worker.subtitle}</p>
          </div>
        </div>

        <select
          value={worker.id}
          onChange={(e) => onSelectWorker(e.target.value)}
          aria-label="Pilih AI Worker"
          className="h-10 w-full sm:w-auto rounded-[10px] border border-[#D8E3E9] bg-white px-3 text-xs font-semibold text-[#17324D]"
        >
          {allWorkers.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name} ({w.version})
            </option>
          ))}
        </select>
      </div>

      {/* Main Navigation Tabs (Covers Screens 5, 7, 8, 21) */}
      <div className="flex min-w-0 gap-1.5 overflow-x-auto rounded-[12px] border border-[#D8E3E9] bg-white p-1.5">
        {(
          [
            { id: 'info', label: 'Info Profil' },
            { id: 'jd', label: 'Job Description & Misi' },
            { id: 'kpi', label: 'KPI & SLA' },
            { id: 'config', label: 'Konfigurasi Model & Skill' },
            { id: 'version', label: 'Versi & Lifecycle' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-[8px] px-3.5 py-2 text-xs font-semibold transition whitespace-nowrap shrink-0 ${
              tab === t.id
                ? 'bg-[#0284C7] text-white'
                : 'text-[#526675] hover:text-[#17324D]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* SCREEN 5: Info Profil */}
      {tab === 'info' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-7">
            <div className="flex items-center justify-between border-b border-[#EAF2F6] pb-3">
              <div className="flex items-center gap-2.5">
                <Bot className="h-5 w-5 text-[#0284C7]" />
                <h2 className="text-sm font-bold text-[#17324D]">
                  Identitas &amp; Kontrak Peran
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onEditJD(worker.id)}
                className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#D8E3E9] bg-[#F5F8FA] px-3 py-1.5 text-xs font-semibold text-[#17324D] hover:border-[#0284C7]"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit Konfigurasi</span>
              </button>
            </div>

            <dl className="mt-4 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
              {[
                { label: 'Departemen', value: worker.department },
                { label: 'Peran', value: worker.role },
                { label: 'Supervisor Manusia', value: worker.supervisor },
                { label: 'Job Type', value: worker.jobType },
                { label: 'Kelas Risiko & Otonomi', value: worker.riskClass },
                {
                  label: 'Biaya Rata-rata per Tugas',
                  value: formatIDRCompact(worker.costPerTaskIdr),
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="rounded-[10px] border border-[#EAF2F6] bg-[#F8FBFD] p-3"
                >
                  <dt className="text-[11px] text-[#718391]">{row.label}</dt>
                  <dd className="mt-0.5 font-semibold text-[#17324D]">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-4">
              <p className="text-xs font-bold text-[#17324D]">Deskripsi Peran</p>
              <p className="mt-1 text-xs leading-relaxed text-[#526675] sm:text-sm">
                {worker.description}
              </p>
            </div>
          </div>

          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-5">
            <h2 className="text-sm font-bold text-[#17324D]">
              Ringkasan Performa &amp; Budget
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-[10px] border border-[#EAF2F6] bg-[#F5F8FA] p-3">
                <p className="text-[11px] text-[#526675]">Success Rate</p>
                <p className="mt-1 font-mono-tabular text-lg font-bold text-[#247A55]">
                  {worker.successRatePct}%
                </p>
              </div>
              <div className="rounded-[10px] border border-[#EAF2F6] bg-[#F5F8FA] p-3">
                <p className="text-[11px] text-[#526675]">Kualitas Output</p>
                <p className="mt-1 font-mono-tabular text-lg font-bold text-[#17324D]">
                  {worker.qualityScore}/5
                </p>
              </div>
              <div className="rounded-[10px] border border-[#EAF2F6] bg-[#F5F8FA] p-3">
                <p className="text-[11px] text-[#526675]">Kepatuhan SLA</p>
                <p className="mt-1 font-mono-tabular text-lg font-bold text-[#0284C7]">
                  {worker.slaCompliancePct}%
                </p>
              </div>
              <div className="rounded-[10px] border border-[#EAF2F6] bg-[#F5F8FA] p-3">
                <p className="text-[11px] text-[#526675]">Latency Rata-rata</p>
                <p className="mt-1 font-mono-tabular text-lg font-bold text-[#17324D]">
                  {worker.avgLatencySec} dtk
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-[10px] border border-[#D8E3E9] bg-[#E6F4F9]/50 p-3 text-xs">
              <p className="font-semibold text-[#17324D]">
                Pemakaian AI Credits: {formatCreditsID(worker.creditsUsed)} /{' '}
                {formatCreditsID(worker.creditsBudget)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 7: Job Description & Misi */}
      {tab === 'jd' && (
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 sm:p-6">
          <div className="flex flex-col gap-3 border-b border-[#EAF2F6] pb-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid w-full grid-cols-2 gap-1 rounded-[9px] border border-[#D8E3E9] bg-[#F5F8FA] p-1 sm:inline-flex sm:w-auto">
              <button
                type="button"
                onClick={() => setJdSubTab('jd')}
                className={`rounded-[7px] px-2.5 sm:px-3 py-2 sm:py-1.5 text-xs font-semibold truncate ${
                  jdSubTab === 'jd' ? 'bg-[#17324D] text-white' : 'text-[#526675]'
                }`}
              >
                JD &amp; Misi
              </button>
              <button
                type="button"
                onClick={() => setJdSubTab('io')}
                className={`rounded-[7px] px-2.5 sm:px-3 py-2 sm:py-1.5 text-xs font-semibold truncate ${
                  jdSubTab === 'io' ? 'bg-[#17324D] text-white' : 'text-[#526675]'
                }`}
              >
                Input / Output
              </button>
            </div>

            <button
              type="button"
              onClick={() => onEditJD(worker.id)}
              className="inline-flex h-10 sm:h-9 w-full sm:w-auto items-center justify-center gap-1.5 rounded-[9px] bg-[#0284C7] px-3.5 text-xs font-semibold text-white"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit JD &amp; Misi</span>
            </button>
          </div>

          {jdSubTab === 'jd' ? (
            <div className="mt-4 space-y-5">
              <div className="rounded-[12px] border border-[#87CEEB] bg-[#E6F4F9]/50 p-4">
                <p className="text-xs font-bold text-[#0284C7]">Misi Utama</p>
                <p className="mt-1 text-sm leading-relaxed text-[#17324D]">
                  {worker.mission}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-bold text-[#17324D]">
                    Tujuan (Objectives)
                  </p>
                  <ul className="mt-2.5 space-y-2">
                    {worker.objectives.map((obj) => (
                      <li
                        key={obj}
                        className="flex items-start gap-2 rounded-[10px] border border-[#EAF2F6] bg-[#F8FBFD] p-3 text-xs text-[#172B3A]"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#247A55]" />
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-bold text-[#17324D]">
                    Ruang Lingkup (In-Scope)
                  </p>
                  <ul className="mt-2.5 space-y-2">
                    {worker.scopeIn.map((sc) => (
                      <li
                        key={sc}
                        className="flex items-start gap-2 rounded-[10px] border border-[#EAF2F6] bg-[#F8FBFD] p-3 text-xs text-[#172B3A]"
                      >
                        <Target className="mt-0.5 h-4 w-4 shrink-0 text-[#0284C7]" />
                        <span>{sc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-[12px] border border-[#D8E3E9] bg-[#F8FBFD] p-4">
                <p className="text-xs font-bold text-[#17324D]">Input Contract</p>
                <ul className="mt-2 space-y-1.5 text-xs text-[#526675]">
                  {worker.inputContract.map((i) => (
                    <li key={i}>• {i}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[12px] border border-[#D8E3E9] bg-[#F8FBFD] p-4">
                <p className="text-xs font-bold text-[#17324D]">Output Contract</p>
                <ul className="mt-2 space-y-1.5 text-xs text-[#526675]">
                  {worker.outputContract.map((o) => (
                    <li key={o}>• {o}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[12px] border border-[#B23A48]/25 bg-red-50/40 p-4">
                <p className="text-xs font-bold text-[#B23A48]">
                  Batasan Eksklusi (Dilarang)
                </p>
                <ul className="mt-2 space-y-1.5 text-xs text-[#526675]">
                  {worker.scopeOut.map((ex) => (
                    <li key={ex}>• {ex}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SCREEN 8: KPI & SLA */}
      {tab === 'kpi' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {worker.kpis.map((k) => (
            <div
              key={k.label}
              className="rounded-[14px] border border-[#D8E3E9] bg-white p-5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#526675]">{k.unit}</span>
                <span className="font-bold text-[#247A55]">{k.status}</span>
              </div>
              <h3 className="mt-1.5 text-sm font-bold text-[#17324D]">
                {k.label}
              </h3>
              <div className="mt-3 flex items-baseline justify-between border-t border-[#EAF2F6] pt-3">
                <span className="text-xs text-[#718391]">
                  Target {k.target}
                </span>
                <span className="font-mono-tabular text-2xl font-bold text-[#17324D]">
                  {k.actual}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Konfigurasi Model, Skill & Memory */}
      {tab === 'config' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
            <h3 className="text-sm font-bold text-[#17324D]">
              Kebijakan Model Router
            </h3>
            <div className="mt-3 space-y-2 text-xs text-[#526675]">
              <p>
                <strong>Provider &amp; Model Utama:</strong>{' '}
                {worker.modelPolicy.primaryProvider} ·{' '}
                {worker.modelPolicy.primaryModel}
              </p>
              <p>
                <strong>Fallback Eligible:</strong>{' '}
                {worker.modelPolicy.fallbackModel}
              </p>
              <p>
                <strong>Batas Latency Target:</strong>{' '}
                {worker.modelPolicy.latencyTargetSec} detik
              </p>
            </div>
          </div>

          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
            <h3 className="text-sm font-bold text-[#17324D]">
              Skills, Tools &amp; Lapisan Memori
            </h3>
            <div className="mt-3 space-y-2 text-xs text-[#526675]">
              <p>
                <strong>Skills Terpasang:</strong> {worker.skills.join(' · ')}
              </p>
              <p>
                <strong>Tools Diizinkan:</strong> {worker.tools.join(' · ')}
              </p>
              <p>
                <strong>Memory Scope:</strong> {worker.memoryScopes.join(' · ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 21: Versioning & Lifecycle */}
      {tab === 'version' && (
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 sm:p-6 space-y-5">
          <div className="flex flex-col justify-between gap-3 border-b border-[#EAF2F6] pb-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-bold text-[#17324D]">
                Versi &amp; Lifecycle · {worker.name}
              </h2>
              <p className="text-xs text-[#526675]">
                Siklus: Draft → Configured → Policy Review → Approved → Aktif → Paused
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <input
                type="text"
                value={versionNotes}
                onChange={(e) => setVersionNotes(e.target.value)}
                placeholder="Catatan rilis versi baru..."
                className="h-10 sm:h-9 w-full sm:w-56 rounded-[9px] border border-[#D8E3E9] px-3 text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  onCreateNewVersion(worker.id, versionNotes);
                  setVersionNotes('');
                }}
                className="inline-flex h-10 sm:h-9 w-full sm:w-auto items-center justify-center gap-1.5 rounded-[9px] bg-[#0284C7] px-3.5 text-xs font-semibold text-white whitespace-nowrap"
              >
                <GitCommit className="h-3.5 w-3.5" />
                <span>Buat Versi Baru</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {worker.versions.map((ver) => {
              const isCurrent = ver.version === worker.version;
              return (
                <div
                  key={ver.version}
                  className={`flex flex-col justify-between gap-3 rounded-[12px] border p-4 sm:flex-row sm:items-center ${
                    isCurrent
                      ? 'border-[#0284C7] bg-[#E6F4F9]/55'
                      : 'border-[#D8E3E9] bg-[#F8FBFD]'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-tabular text-sm font-bold text-[#17324D]">
                        {ver.version}
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          isCurrent ? 'text-[#247A55]' : 'text-[#526675]'
                        }`}
                      >
                        {ver.status}
                      </span>
                      <span className="text-[11px] text-[#718391]">
                        · {ver.date}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#526675]">{ver.notes}</p>
                  </div>

                  {!isCurrent && (
                    <button
                      type="button"
                      onClick={() => onRollbackVersion(worker.id, ver.version)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-[9px] border border-[#D8E3E9] bg-white px-3 text-xs font-semibold text-[#17324D] hover:border-[#0284C7] shrink-0 self-start sm:self-center"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Rollback ke {ver.version}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 rounded-[10px] border border-[#EAF2F6] bg-[#F5F8FA] p-3 text-xs text-[#526675]">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#0284C7]" />
            <span>
              Setiap perubahan versi melalui pemeriksaan kebijakan keamanan dan
              tercatat pada Audit Log.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
