'use client';

import React, { useState } from 'react';
import {
  GitBranch,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminSegmentedTabs,
  AdminStatusText,
} from '../../components/data-display/AdminDataDisplay';
import { formatNumberID } from '../../lib/admin-data';
import type {
  AdminWorkflowApprovalRecord,
  AdminWorkflowRecord,
  AdminWorkflowRunRecord,
} from '../../lib/admin-types';

export function WorkflowOrchestrationAdminView({
  workflows,
  runs,
  approvals,
  onOpenModal,
  onDeleteWorkflow,
  onRetryRun,
  onDecideApproval,
  onBack,
}: {
  workflows: AdminWorkflowRecord[];
  runs: AdminWorkflowRunRecord[];
  approvals: AdminWorkflowApprovalRecord[];
  onOpenModal: (wf?: AdminWorkflowRecord) => void;
  onDeleteWorkflow?: (id: string) => void;
  onRetryRun: (id: string) => void;
  onDecideApproval: (id: string, decision: 'Disetujui' | 'Ditolak') => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<'workflow' | 'run' | 'approval'>('workflow');
  const pendingCount = approvals.filter((a) => a.status === 'Menunggu').length;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="AI Runtime Orchestration (Workflow & Human-AI Approval)"
        subtitle="Orkestrasi alur kerja durable lintas Human & AI Workforce, monitoring checkpoint run, dan gerbang persetujuan berisiko tinggi."
        onBack={onBack}
        actions={
          <button
            type="button"
            onClick={() => onOpenModal()}
            className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#0284C7] px-4 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Buat Workflow</span>
          </button>
        }
      />

      <AdminSegmentedTabs
        tabs={[
          { id: 'workflow', label: `Workflow (${workflows.length})` },
          { id: 'run', label: `Run (${runs.length})` },
          { id: 'approval', label: `Approval (${pendingCount})` },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      {tab === 'workflow' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {workflows.map((wf) => (
            <div
              key={wf.id}
              className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#0284C7]">
                    <GitBranch className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#17324D]">{wf.name}</h3>
                    <p className="font-mono-tabular text-[11px] text-[#526675]">
                      {wf.version} · {wf.nodesCount} node · Trigger: {wf.triggerType}
                    </p>
                  </div>
                </div>
                <AdminStatusText
                  tone={
                    wf.status === 'Aktif'
                      ? 'success'
                      : wf.status === 'Draft'
                        ? 'warning'
                        : 'neutral'
                  }
                  label={wf.status}
                />
              </div>

              <div className="flex items-center justify-between rounded-[10px] bg-[#F5F8FA] px-3.5 py-2.5 text-xs">
                <span className="text-[#526675]">
                  Human Handoff:{' '}
                  <strong className="text-[#17324D]">
                    {wf.humanHandoffRequired ? 'Wajib Checkpoint' : 'Otomatis'}
                  </strong>
                </span>
                <span className="font-mono-tabular font-bold text-[#17324D]">
                  {formatNumberID(wf.runsThisMonth)} run/bln
                </span>
              </div>

              <div className="flex justify-end gap-1.5 border-t border-[#EAF2F6] pt-3">
                <button
                  type="button"
                  onClick={() => onOpenModal(wf)}
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#D8E3E9] px-3 text-xs font-semibold text-[#0284C7] hover:bg-[#E6F4F9]"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Edit Definisi</span>
                </button>
                {onDeleteWorkflow && (
                  <button
                    type="button"
                    onClick={() => onDeleteWorkflow(wf.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D8E3E9] text-[#B23A48] hover:bg-[#B23A48]/10"
                    aria-label={`Hapus ${wf.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'run' && (
        <>
          <div className="space-y-3 md:hidden">
            {runs.map((r) => (
              <div
                key={r.id}
                className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#17324D]">{r.workflowName}</p>
                    <p className="font-mono-tabular text-[11px] text-[#718391]">
                      {r.traceId} · {r.startedAt}
                    </p>
                  </div>
                  <AdminStatusText
                    tone={
                      r.status === 'Selesai'
                        ? 'success'
                        : r.status === 'Gagal'
                          ? 'danger'
                          : 'warning'
                    }
                    label={r.status}
                  />
                </div>
                <div className="rounded-[10px] bg-[#F5F8FA] px-3 py-2 text-xs text-[#526675]">
                  <span className="font-semibold text-[#17324D]">{r.tenantName}</span> ·{' '}
                  {r.currentStep}
                </div>
                {r.status === 'Gagal' && (
                  <button
                    type="button"
                    onClick={() => onRetryRun(r.id)}
                    className="inline-flex h-9 w-full items-center justify-center gap-1 rounded-[9px] bg-[#0284C7] text-xs font-semibold text-white"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Retry Idempotent</span>
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-[14px] border border-[#D8E3E9] bg-white md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#EAF2F6] bg-[#F5F8FA] text-[#526675]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Run &amp; Workflow</th>
                    <th className="px-4 py-3 font-semibold">Tenant</th>
                    <th className="px-4 py-3 font-semibold">Step / Checkpoint</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAF2F6]">
                  {runs.map((r) => (
                    <tr key={r.id} className="hover:bg-[#F8FBFD]">
                      <td className="px-4 py-3">
                        <p className="font-bold text-[#17324D]">{r.workflowName}</p>
                        <p className="font-mono-tabular text-[11px] text-[#718391]">
                          {r.traceId} · {r.startedAt}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-[#526675]">{r.tenantName}</td>
                      <td className="px-4 py-3 text-[#172B3A]">{r.currentStep}</td>
                      <td className="px-4 py-3">
                        <AdminStatusText
                          tone={
                            r.status === 'Selesai'
                              ? 'success'
                              : r.status === 'Gagal'
                                ? 'danger'
                                : 'warning'
                          }
                          label={r.status}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {r.status === 'Gagal' ? (
                          <button
                            type="button"
                            onClick={() => onRetryRun(r.id)}
                            className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#0284C7] px-3 text-xs font-semibold text-white hover:bg-[#0369A1]"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Retry Idempotent</span>
                          </button>
                        ) : (
                          <span className="font-mono-tabular text-[11px] text-[#718391]">
                            Trace Tercatat
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'approval' && (
        <div className="space-y-3">
          {approvals.map((apr) => (
            <div
              key={apr.id}
              className="flex flex-col gap-3 rounded-[14px] border border-[#D8E3E9] bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-[#17324D]">{apr.workflowName}</p>
                  <span className="font-mono-tabular text-[11px] font-semibold text-[#526675]">
                    · {apr.tenantName} · Risiko {apr.riskLevel}
                  </span>
                </div>
                <p className="text-xs text-[#172B3A]">{apr.actionSummary}</p>
                <p className="text-[11px] text-[#718391]">
                  Diminta oleh {apr.requestedBy} · {apr.requestedAt}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {apr.status === 'Menunggu' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onDecideApproval(apr.id, 'Disetujui')}
                      className="inline-flex h-9 items-center gap-1 rounded-[10px] bg-[#247A55] px-3.5 text-xs font-semibold text-white hover:bg-[#1E6647]"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Setujui</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDecideApproval(apr.id, 'Ditolak')}
                      className="inline-flex h-9 items-center gap-1 rounded-[10px] border border-[#B23A48]/40 px-3.5 text-xs font-semibold text-[#B23A48] hover:bg-[#B23A48]/10"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Tolak</span>
                    </button>
                  </>
                ) : (
                  <AdminStatusText
                    tone={apr.status === 'Disetujui' ? 'success' : 'danger'}
                    label={apr.status}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
