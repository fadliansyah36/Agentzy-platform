'use client';

import React, { useMemo, useState } from 'react';
import {
  GitBranch,
  Search,
  Play,
  Layers,
  GitCompare,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import type {
  AIWorkforceSectionId,
  WorkflowDefinitionItem,
} from '../../lib/ai-workforce-types';

export function WorkflowCenterView({
  workflows,
  selectedWorkflowId,
  onSelectWorkflow,
  onExecuteWorkflow,
  onOpenVersionCompare,
  onCreateWorkflowVersion,
  onNavigate,
}: {
  workflows: WorkflowDefinitionItem[];
  selectedWorkflowId: string;
  onSelectWorkflow: (workflowId: string) => void;
  onExecuteWorkflow: (workflowId: string) => void;
  onOpenVersionCompare: (workflowId: string) => void;
  onCreateWorkflowVersion: (workflowId: string, changeNote: string) => void;
  onNavigate: (section: AIWorkforceSectionId) => void;
}) {
  const [catTab, setCatTab] = useState<'Semua' | 'Workflow' | 'Template' | 'Library'>('Semua');
  const [search, setSearch] = useState('');

  const selectedWf =
    workflows.find((w) => w.id === selectedWorkflowId) ?? workflows[0];

  const filteredWorkflows = useMemo(() => {
    return workflows.filter((w) => {
      if (catTab !== 'Semua' && w.category !== catTab) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        w.name.toLowerCase().includes(q) ||
        w.description.toLowerCase().includes(q)
      );
    });
  }, [workflows, catTab, search]);

  return (
    <div className="space-y-5">
      {/* Screen 25: Workflow Center Overview Banner */}
      <div className="rounded-[14px] border border-[#87CEEB] bg-gradient-to-r from-[#17324D] via-[#245477] to-[#0284C7] p-4 sm:p-6 text-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl min-w-0">
            <p className="text-xs font-semibold text-[#ADD8E6]">
              Screens 25, 26, 33 &amp; 34 · Workflow &amp; Orchestration Center
            </p>
            <h1 className="mt-1 text-xl font-bold sm:text-2xl">
              Workflow &amp; Orchestration Kolaborasi Human + AI
            </h1>
            <p className="mt-1.5 text-xs leading-relaxed text-[#E6F4F9] sm:text-sm">
              Rancang, jalankan, dan kelola alur kerja otomatis antara AI Worker, Staff Sales, Affiliate, dan Teknisi Lapangan dengan eksekusi yang andal dan teraudit.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('workflow-builder')}
              className="inline-flex h-11 sm:h-10 w-full sm:w-auto items-center justify-center gap-1.5 rounded-[10px] bg-white px-4 text-xs font-bold text-[#17324D] hover:bg-[#E6F4F9] whitespace-nowrap"
            >
              <Layers className="h-4 w-4 text-[#0284C7]" />
              <span>Buka Workflow Builder</span>
            </button>
            <button
              type="button"
              onClick={() => onExecuteWorkflow(selectedWf.id)}
              className="inline-flex h-11 sm:h-10 w-full sm:w-auto items-center justify-center gap-1.5 rounded-[10px] border border-white/30 bg-white/10 px-4 text-xs font-semibold text-white hover:bg-white/20 whitespace-nowrap"
            >
              <Play className="h-4 w-4" />
              <span className="truncate">Jalankan {selectedWf.name}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Screen 26: Daftar Workflow (Definition) + Filter */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-3.5 min-w-0">
          <div className="flex flex-col gap-3 rounded-[14px] border border-[#D8E3E9] bg-white p-3.5 sm:p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid w-full grid-cols-4 gap-1 rounded-[9px] border border-[#D8E3E9] bg-[#F5F8FA] p-0.5 sm:inline-flex sm:w-auto">
              {(['Semua', 'Workflow', 'Template', 'Library'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setCatTab(t)}
                  className={`h-8 rounded-[7px] px-1.5 sm:px-3 text-xs font-semibold whitespace-nowrap truncate ${
                    catTab === t
                      ? 'bg-white text-[#17324D] shadow-xs'
                      : 'text-[#526675]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#718391]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari workflow..."
                className="h-9 w-full rounded-[9px] border border-[#D8E3E9] bg-[#F5F8FA] pl-8 pr-3 text-xs"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredWorkflows.map((wf) => {
              const active = wf.id === selectedWf.id;
              return (
                <div
                  key={wf.id}
                  onClick={() => onSelectWorkflow(wf.id)}
                  className={`cursor-pointer rounded-[14px] border bg-white p-4 transition ${
                    active
                      ? 'border-[#0284C7] ring-1 ring-[#0284C7]/20'
                      : 'border-[#D8E3E9] hover:border-[#87CEEB]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#0284C7]">
                        <GitBranch className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#17324D]">
                          {wf.name}
                        </h3>
                        <p className="font-mono-tabular text-[11px] text-[#526675]">
                          {wf.version} · {wf.category} · {wf.slaTargetLabel}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`rounded-[6px] px-2 py-0.5 text-[11px] font-semibold ${
                        wf.status === 'Aktif'
                          ? 'bg-[#247A55]/10 text-[#247A55]'
                          : 'bg-[#5F879E]/15 text-[#245477]'
                      }`}
                    >
                      {wf.status}
                    </span>
                  </div>

                  <p className="mt-2.5 text-xs leading-relaxed text-[#526675]">
                    {wf.description}
                  </p>

                  <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-[#EAF2F6] pt-3">
                    <span className="font-mono-tabular text-[11px] text-[#718391]">
                      {wf.nodes.length} Node Terkonfigurasi
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectWorkflow(wf.id);
                          onNavigate('workflow-builder');
                        }}
                        className="h-8 rounded-[8px] border border-[#D8E3E9] bg-[#F5F8FA] px-3 text-xs font-semibold text-[#17324D] hover:border-[#0284C7] whitespace-nowrap"
                      >
                        Edit Node
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onExecuteWorkflow(wf.id);
                        }}
                        className="inline-flex h-8 items-center gap-1 rounded-[8px] bg-[#0284C7] px-3 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap"
                      >
                        <Play className="h-3 w-3" />
                        <span>Jalankan</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Screens 33 & 34 Workflow Versioning & Release Management */}
        <div className="lg:col-span-5 rounded-[14px] border border-[#D8E3E9] bg-white p-4 sm:p-5 h-fit space-y-4 min-w-0">
          <div className="flex flex-col gap-3 border-b border-[#EAF2F6] pb-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-[#0284C7]">
                Screens 33 &amp; 34 · Versi Workflow
              </p>
              <h2 className="text-base font-bold text-[#17324D]">
                {selectedWf.name}
              </h2>
            </div>
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-1.5">
              <button
                type="button"
                onClick={() => onOpenVersionCompare(selectedWf.id)}
                className="inline-flex h-9 sm:h-8 items-center justify-center gap-1.5 rounded-[8px] border border-[#87CEEB] bg-[#E6F4F9] px-3 text-xs font-semibold text-[#17324D] hover:bg-[#D5ECF6] whitespace-nowrap"
              >
                <GitCompare className="h-3.5 w-3.5 text-[#0284C7] shrink-0" />
                <span>Bandingkan</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onCreateWorkflowVersion(
                    selectedWf.id,
                    'Penambahan aturan validasi & optimasi SLA Staging'
                  )
                }
                className="inline-flex h-9 sm:h-8 items-center justify-center gap-1 rounded-[8px] bg-[#0284C7] px-3 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap"
              >
                <span>Buat Versi Baru</span>
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {selectedWf.versions.map((ver) => (
              <div
                key={ver.version}
                className="rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-tabular text-sm font-bold text-[#17324D]">
                      {ver.version}
                    </span>
                    <span
                      className={`rounded-[6px] px-2 py-0.5 text-[11px] font-semibold ${
                        ver.stage.includes('Aktif')
                          ? 'bg-[#247A55]/10 text-[#247A55]'
                          : ver.stage === 'Staging'
                            ? 'bg-[#0284C7]/10 text-[#0284C7]'
                            : 'bg-[#718391]/15 text-[#526675]'
                      }`}
                    >
                      {ver.stage}
                    </span>
                  </div>
                  <span className="font-mono-tabular text-[11px] text-[#718391]">
                    {ver.publishedAt}
                  </span>
                </div>
                <ul className="mt-2 space-y-1">
                  {ver.changes.map((c) => (
                    <li
                      key={c}
                      className="flex items-start gap-1.5 text-[11px] text-[#526675]"
                    >
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0284C7]" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="rounded-[10px] border border-[#87CEEB] bg-[#E6F4F9]/60 p-3 text-xs text-[#17324D]">
            <div className="flex items-center gap-2 font-bold">
              <Sparkles className="h-4 w-4 text-[#0284C7]" />
              <span>Workflow Lifecycle (End-to-End)</span>
            </div>
            <p className="mt-1 text-[11px] text-[#245477]">
              Created → Validated → Queued → Running → Waiting Approval / External → Retrying (jika gagal) → Completed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
