'use client';

import React from 'react';
import {
  GitBranch,
  Play,
  Plus,
  Zap,
  Split,
  Bot,
  UserCheck,
  Layers,
  Clock,
  Plug,
  RotateCcw,
  ArrowDown,
} from 'lucide-react';
import type {
  WorkflowDefinitionItem,
  WorkflowNodeItem,
} from '../../lib/ai-workforce-types';

const NODE_LIBRARY: Array<{
  type: WorkflowNodeItem['type'];
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { type: 'Trigger', desc: 'Pemicu eksekusi workflow otomatis', icon: Zap },
  { type: 'Condition', desc: 'Percabangan berbasis skor/aturan', icon: Split },
  { type: 'AI Task', desc: 'Jalankan tugas oleh AI Worker', icon: Bot },
  { type: 'Human Task', desc: 'Tugas untuk Staff Sales / Teknisi', icon: UserCheck },
  { type: 'Parallel', desc: 'Jalankan beberapa cabang paralel', icon: Layers },
  { type: 'Wait / Timer', desc: 'Tunggu berdasarkan waktu / event', icon: Clock },
  { type: 'Integration', desc: 'Panggil CRM, Maps, Workspace API', icon: Plug },
  { type: 'Compensation', desc: 'Aksi pemulihan bila terjadi gagal', icon: RotateCcw },
];

export function WorkflowBuilderView({
  workflows,
  selectedWorkflow,
  onSelectWorkflow,
  onOpenAddNodeModal,
  onExecuteWorkflow,
}: {
  workflows: WorkflowDefinitionItem[];
  selectedWorkflow: WorkflowDefinitionItem;
  onSelectWorkflow: (workflowId: string) => void;
  onOpenAddNodeModal: (workflowId: string) => void;
  onExecuteWorkflow: (workflowId: string) => void;
}) {
  const mainNodes = selectedWorkflow.nodes.filter(
    (n) => n.branch !== 'yes' && n.branch !== 'no'
  );
  const noBranch = selectedWorkflow.nodes.filter((n) => n.branch === 'no');
  const yesBranch = selectedWorkflow.nodes.filter((n) => n.branch === 'yes');

  const getNodeIcon = (type: WorkflowNodeItem['type']) => {
    const found = NODE_LIBRARY.find((l) => l.type === type);
    return found ? found.icon : GitBranch;
  };

  return (
    <div className="space-y-5">
      {/* Header (Screens 16, 27, 28) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-[#0284C7]">
            Screens 16, 27 &amp; 28 · Workflow Designer, Builder &amp; Node Library
          </p>
          <h1 className="text-xl font-bold text-[#17324D] sm:text-2xl">
            Workflow Builder · {selectedWorkflow.name}
          </h1>
          <p className="mt-0.5 text-xs text-[#526675]">
            Susun alur kerja Trigger, AI Task, Condition, Human Task Staff Sales/Teknisi, dan Parallel nodes.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center shrink-0">
          <select
            value={selectedWorkflow.id}
            onChange={(e) => onSelectWorkflow(e.target.value)}
            aria-label="Pilih Workflow"
            className="h-10 w-full sm:w-auto rounded-[10px] border border-[#D8E3E9] bg-white px-3 text-xs font-semibold text-[#17324D]"
          >
            {workflows.map((wf) => (
              <option key={wf.id} value={wf.id}>
                {wf.name} ({wf.version})
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <button
              type="button"
              onClick={() => onOpenAddNodeModal(selectedWorkflow.id)}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[10px] border border-[#87CEEB] bg-[#E6F4F9] px-3.5 text-xs font-semibold text-[#17324D] hover:bg-[#D5ECF6] whitespace-nowrap"
            >
              <Plus className="h-4 w-4 text-[#0284C7]" />
              <span>Tambah Node</span>
            </button>

            <button
              type="button"
              onClick={() => onExecuteWorkflow(selectedWorkflow.id)}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[10px] bg-[#0284C7] px-4 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap"
            >
              <Play className="h-4 w-4" />
              <span>Jalankan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Split: Visual Flowchart Canvas (Screen 27) + Node Library (Screen 28) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left: Visual Workflow Builder Canvas */}
        <section className="lg:col-span-8 rounded-[14px] border border-[#D8E3E9] bg-white p-4 sm:p-5 min-w-0">
          <div className="flex items-center justify-between gap-2 border-b border-[#EAF2F6] pb-3">
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-[#17324D]">
                Kanvas Alur Kerja ({selectedWorkflow.nodes.length} Node)
              </h2>
              <p className="text-[11px] text-[#526675]">
                {selectedWorkflow.slaTargetLabel} · Status: {selectedWorkflow.status}
              </p>
            </div>
            <span className="font-mono-tabular shrink-0 text-xs font-bold text-[#0284C7]">
              {selectedWorkflow.version}
            </span>
          </div>

          <div className="mt-4 sm:mt-5 flex flex-col items-center space-y-3 rounded-[12px] border border-dashed border-[#B8C9D3] bg-[#F5F8FA] p-3.5 sm:p-5">
            {mainNodes.map((node, idx) => {
              const Icon = getNodeIcon(node.type);
              const isCondition = node.type === 'Condition';
              return (
                <React.Fragment key={node.id}>
                  <div
                    className={`w-full max-w-md rounded-[12px] border p-3.5 shadow-xs ${
                      isCondition
                        ? 'border-[#0284C7] bg-[#E6F4F9]'
                        : node.type === 'Human Task'
                          ? 'border-[#247A55]/40 bg-[#247A55]/5'
                          : 'border-[#D8E3E9] bg-white'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#17324D] text-white">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#0284C7]">
                            {node.type}
                          </p>
                          <p className="text-xs font-bold text-[#17324D]">
                            {node.title}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-[#526675]">
                        {node.actor}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-[#526675]">
                      {node.subtitle}
                    </p>
                  </div>

                  {/* Branching visualization if Condition node and branches exist */}
                  {isCondition && (noBranch.length > 0 || yesBranch.length > 0) && (
                    <div className="w-full max-w-lg grid grid-cols-1 gap-3 sm:grid-cols-2 py-2">
                      <div className="rounded-[12px] border border-[#D8E3E9] bg-white p-3">
                        <p className="text-[11px] font-bold text-[#A96816]">
                          Cabang: Tidak Memenuhi
                        </p>
                        {noBranch.map((bn) => (
                          <div key={bn.id} className="mt-2">
                            <p className="text-xs font-bold text-[#17324D]">
                              {bn.title}
                            </p>
                            <p className="text-[11px] text-[#526675]">
                              {bn.actor} · {bn.subtitle}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-[12px] border border-[#247A55]/35 bg-white p-3">
                        <p className="text-[11px] font-bold text-[#247A55]">
                          Cabang: Ya (Siap Closing)
                        </p>
                        {yesBranch.map((by) => (
                          <div key={by.id} className="mt-2">
                            <p className="text-xs font-bold text-[#17324D]">
                              {by.title}
                            </p>
                            <p className="text-[11px] text-[#526675]">
                              {by.actor} · {by.subtitle}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {idx < mainNodes.length - 1 && (
                    <ArrowDown className="h-4 w-4 text-[#5F879E]" />
                  )}
                </React.Fragment>
              );
            })}

            <button
              type="button"
              onClick={() => onOpenAddNodeModal(selectedWorkflow.id)}
              className="mt-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#0284C7] text-white shadow-md hover:bg-[#0369A1]"
              aria-label="Tambah Node Baru"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </section>

        {/* Right: Screen 28 Node Library */}
        <aside className="lg:col-span-4 rounded-[14px] border border-[#D8E3E9] bg-white p-5 h-fit space-y-3">
          <div className="border-b border-[#EAF2F6] pb-3">
            <h2 className="text-sm font-bold text-[#17324D]">
              Node Library &amp; Konfigurasi
            </h2>
            <p className="text-[11px] text-[#526675]">
              Pilih jenis node untuk ditambahkan ke workflow aktif.
            </p>
          </div>

          <div className="space-y-2">
            {NODE_LIBRARY.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => onOpenAddNodeModal(selectedWorkflow.id)}
                  className="flex w-full items-center gap-3 rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] p-2.5 text-left transition hover:border-[#0284C7] hover:bg-[#E6F4F9]"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-white text-[#0284C7] border border-[#D8E3E9]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#17324D]">
                      {item.type}
                    </p>
                    <p className="truncate text-[11px] text-[#526675]">
                      {item.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
