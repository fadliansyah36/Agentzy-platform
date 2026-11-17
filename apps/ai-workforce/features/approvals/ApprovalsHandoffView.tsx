'use client';

import React, { useMemo, useState } from 'react';
import {
  Inbox,
  UserCheck,
  CheckCircle2,
  XCircle,
  Send,
  ShieldAlert,
} from 'lucide-react';
import type {
  ApprovalInboxItem,
  HandoffAssignmentItem,
} from '../../lib/ai-workforce-types';

export function ApprovalsHandoffView({
  approvals,
  handoffs,
  onApprovalDecision,
  onOpenHandoffModal,
}: {
  approvals: ApprovalInboxItem[];
  handoffs: HandoffAssignmentItem[];
  onApprovalDecision: (
    approvalId: string,
    decision: 'Disetujui' | 'Ditolak'
  ) => void;
  onOpenHandoffModal: (handoffId: string) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<
    'Menunggu' | 'Disetujui' | 'Ditolak'
  >('Menunggu');

  const counts = useMemo(
    () => ({
      Menunggu: approvals.filter((a) => a.status === 'Menunggu').length,
      Disetujui: approvals.filter((a) => a.status === 'Disetujui').length,
      Ditolak: approvals.filter((a) => a.status === 'Ditolak').length,
    }),
    [approvals]
  );

  const filteredApprovals = useMemo(
    () => approvals.filter((a) => a.status === statusFilter),
    [approvals, statusFilter]
  );

  return (
    <div className="space-y-5">
      {/* Header (Screens 18, 31, 32) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-[#0284C7]">
            Screens 18, 31 &amp; 32 · Approval Inbox &amp; Human Assignment Handoff Center
          </p>
          <h1 className="text-xl font-bold text-[#17324D] sm:text-2xl">
            Approval Center &amp; Penugasan Handoff ke Staff
          </h1>
          <p className="mt-0.5 text-xs text-[#526675]">
            Kontrol Human-in-the-Loop untuk menyetujui eksekusi sensitif AI serta menyalurkan prospek/tugas ke Staff Sales &amp; Teknisi.
          </p>
        </div>

        <div className="grid w-full grid-cols-3 gap-1 rounded-[10px] border border-[#D8E3E9] bg-white p-1 sm:inline-flex sm:w-auto">
          {(['Menunggu', 'Disetujui', 'Ditolak'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`h-9 sm:h-8 rounded-[8px] px-2 sm:px-3 text-center text-[11px] sm:text-xs font-semibold whitespace-nowrap truncate ${
                statusFilter === st
                  ? 'bg-[#0284C7] text-white'
                  : 'text-[#526675] hover:text-[#17324D]'
              }`}
            >
              {st} ({counts[st]})
            </button>
          ))}
        </div>
      </div>

      {/* Main Split: Left = Approval Center (Screens 18 & 31), Right = Human Assignment & Handoff Center (Screen 32) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Approval Inbox */}
        <section className="lg:col-span-7 space-y-3 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-[#0284C7]" />
              <h2 className="text-sm font-bold text-[#17324D]">
                Approval Inbox ({statusFilter})
              </h2>
            </div>
          </div>

          {filteredApprovals.length === 0 ? (
            <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-6 text-center text-xs text-[#718391]">
              Tidak ada permintaan approval dengan status {statusFilter}.
            </div>
          ) : (
            filteredApprovals.map((item) => (
              <div
                key={item.id}
                className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono-tabular text-xs font-bold text-[#0284C7]">
                        {item.id}
                      </span>
                      <span className="text-[11px] font-medium text-[#718391]">
                        · {item.category} · {item.runId}
                      </span>
                    </div>
                    <h3 className="mt-0.5 text-sm font-bold text-[#17324D]">
                      {item.title}
                    </h3>
                    <p className="mt-0.5 text-[11px] text-[#526675]">
                      Diajukan oleh: <strong className="text-[#17324D]">{item.requester}</strong> · {item.submittedLabel}
                    </p>
                  </div>
                  <span
                    className={`rounded-[6px] px-2 py-0.5 text-[11px] font-semibold shrink-0 ${
                      item.status === 'Menunggu'
                        ? 'bg-[#A96816]/10 text-[#A96816]'
                        : item.status === 'Disetujui'
                          ? 'bg-[#247A55]/10 text-[#247A55]'
                          : 'bg-[#B23A48]/10 text-[#B23A48]'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="rounded-[10px] bg-[#F5F8FA] p-3 text-xs text-[#172B3A]">
                  <p className="font-semibold text-[#17324D]">{item.riskSummary}</p>
                  <p className="mt-1 text-[11px] text-[#526675]">{item.contextDetail}</p>
                </div>

                {item.status === 'Menunggu' && (
                  <div className="grid grid-cols-2 gap-2 pt-1 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
                    <button
                      type="button"
                      onClick={() => onApprovalDecision(item.id, 'Ditolak')}
                      className="inline-flex h-10 sm:h-9 items-center justify-center gap-1.5 rounded-[9px] border border-[#B23A48]/40 bg-white px-3.5 text-xs font-semibold text-[#B23A48] hover:bg-[#B23A48]/5 whitespace-nowrap"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Tolak</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onApprovalDecision(item.id, 'Disetujui')}
                      className="inline-flex h-10 sm:h-9 items-center justify-center gap-1.5 rounded-[9px] bg-[#247A55] px-4 text-xs font-semibold text-white hover:bg-[#1D6344] whitespace-nowrap"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Setujui Eksekusi</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </section>

        {/* Screen 32: Human Assignment & Handoff Center */}
        <section className="lg:col-span-5 space-y-3">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-[#0284C7]" />
            <h2 className="text-sm font-bold text-[#17324D]">
              Human Assignment &amp; Handoff Center
            </h2>
          </div>

          {handoffs.map((h) => (
            <div
              key={h.id}
              className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono-tabular text-xs font-bold text-[#0284C7]">
                  {h.runId} · Dari {h.fromWorker}
                </span>
                <span
                  className={`rounded-[6px] px-2 py-0.5 text-[11px] font-semibold ${
                    h.status === 'Terkirim ke Staff Sales'
                      ? 'bg-[#247A55]/10 text-[#247A55]'
                      : 'bg-[#0284C7]/10 text-[#0284C7]'
                  }`}
                >
                  {h.status}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#17324D]">{h.taskTitle}</h3>
                <div className="mt-2 rounded-[10px] border border-[#87CEEB] bg-[#E6F4F9]/60 p-3 text-xs space-y-1">
                  <p className="text-[#17324D]">
                    <strong>Lead:</strong> {h.leadName} · Skor {h.qualificationScore}
                  </p>
                  <p className="text-[#245477]">
                    <strong>Rekomendasi AI:</strong> {h.aiRecommendation}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#EAF2F6] pt-3">
                <div className="text-xs">
                  <p className="font-bold text-[#17324D]">{h.assignedTo}</p>
                  <p className="text-[11px] text-[#526675]">{h.areaLabel}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenHandoffModal(h.id)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-[9px] bg-[#0284C7] px-3.5 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>
                    {h.status === 'Terkirim ke Staff Sales'
                      ? 'Ubah Penugasan'
                      : 'Kirim Penugasan'}
                  </span>
                </button>
              </div>
            </div>
          ))}

          <div className="flex items-start gap-2.5 rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-3.5 text-xs text-[#526675]">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#0284C7]" />
            <span>
              Setiap handoff AI ke Staff Sales menyertakan ringkasan prospek dan materi penawaran dari Content Studio agar tim penjualan siap melakukan closing.
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
