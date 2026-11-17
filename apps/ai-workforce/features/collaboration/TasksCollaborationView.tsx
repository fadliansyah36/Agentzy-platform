'use client';

import React, { useMemo, useState } from 'react';
import {
  CheckSquare,
  MessageSquare,
  Plus,
  Send,
  CheckCircle2,
  Circle,
  UserCheck,
  Sparkles,
  FileText,
} from 'lucide-react';
import type {
  AIWMTaskGoalItem,
  AIWorkforceSectionId,
  CollaborationMessageItem,
  HandoffAssignmentItem,
} from '../../lib/ai-workforce-types';

export function TasksCollaborationView({
  tasksGoals,
  collabMessages,
  handoffs,
  onToggleTaskGoal,
  onOpenCreateTaskGoal,
  onSendCollabMessage,
  onOpenHandoffModal,
  onNavigate,
}: {
  tasksGoals: AIWMTaskGoalItem[];
  collabMessages: CollaborationMessageItem[];
  handoffs: HandoffAssignmentItem[];
  onToggleTaskGoal: (id: string) => void;
  onOpenCreateTaskGoal: () => void;
  onSendCollabMessage: (text: string) => void;
  onOpenHandoffModal: (handoffId: string) => void;
  onNavigate: (section: AIWorkforceSectionId) => void;
}) {
  const [taskTab, setTaskTab] = useState<'Tugas' | 'Goal' | 'Backlog'>('Tugas');
  const [collabTab, setCollabTab] = useState<'Diskusi' | 'Handoff' | 'File & Aktivitas'>('Diskusi');
  const [draftMsg, setDraftMsg] = useState('');

  const filteredTasks = useMemo(
    () => tasksGoals.filter((t) => t.kind === taskTab),
    [tasksGoals, taskTab]
  );

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftMsg.trim()) return;
    onSendCollabMessage(draftMsg);
    setDraftMsg('');
  };

  return (
    <div className="space-y-5">
      {/* Header (Screens 14, 15, 38, 39) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-[#0284C7]">
            Screens 14, 15, 38 &amp; 39 · Task, Goal &amp; Collaboration Space
          </p>
          <h1 className="text-xl font-bold text-[#17324D] sm:text-2xl">
            Task &amp; Goal Management + Kolaborasi Human &amp; AI
          </h1>
          <p className="mt-0.5 text-xs text-[#526675]">
            Pembagian target kerja bersama antara Staff Sales, Affiliate Coach AI, Teknisi, dan AI Worker.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('content-studio')}
            className="inline-flex h-11 sm:h-10 w-full sm:w-auto items-center justify-center gap-1.5 rounded-[10px] border border-[#87CEEB] bg-[#E6F4F9] px-3.5 text-xs font-semibold text-[#17324D] hover:bg-[#D5ECF6] whitespace-nowrap"
          >
            <Sparkles className="h-4 w-4 text-[#0284C7]" />
            <span>Buka Content Studio Sales</span>
          </button>
          <button
            type="button"
            onClick={onOpenCreateTaskGoal}
            className="inline-flex h-11 sm:h-10 w-full sm:w-auto items-center justify-center gap-1.5 rounded-[10px] bg-[#0284C7] px-4 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Buat Tugas / Goal</span>
          </button>
        </div>
      </div>

      {/* Two-Column Split: Left = Task & Goal, Right = Collaboration Space */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left: Task & Goal Management */}
        <section className="lg:col-span-6 rounded-[14px] border border-[#D8E3E9] bg-white p-4 sm:p-5 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex flex-col gap-2.5 border-b border-[#EAF2F6] pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-[#0284C7]" />
                <h2 className="text-sm font-bold text-[#17324D]">
                  Task &amp; Goal Kolaborasi
                </h2>
              </div>
              <div className="grid w-full grid-cols-3 gap-1 rounded-[9px] border border-[#D8E3E9] bg-[#F5F8FA] p-0.5 sm:inline-flex sm:w-auto">
                {(['Tugas', 'Goal', 'Backlog'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTaskTab(t)}
                    className={`h-8 sm:h-7 rounded-[7px] px-2 sm:px-3 text-xs font-semibold truncate ${
                      taskTab === t
                        ? 'bg-white text-[#17324D] shadow-xs'
                        : 'text-[#526675]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-2.5">
              {filteredTasks.length === 0 ? (
                <p className="rounded-[10px] bg-[#F5F8FA] p-4 text-center text-xs text-[#718391]">
                  Belum ada item di kategori {taskTab}. Klik &ldquo;Buat Tugas / Goal&rdquo; untuk menambah.
                </p>
              ) : (
                filteredTasks.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-3.5 transition hover:border-[#87CEEB]"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => onToggleTaskGoal(item.id)}
                        className="mt-0.5 shrink-0 text-[#0284C7]"
                        aria-label={`Tandai selesai ${item.title}`}
                      >
                        {item.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-[#247A55]" />
                        ) : (
                          <Circle className="h-5 w-5 text-[#718391]" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-xs font-bold ${
                            item.completed
                              ? 'line-through text-[#718391]'
                              : 'text-[#17324D]'
                          }`}
                        >
                          {item.title}
                        </p>
                        <p className="mt-1 text-[11px] text-[#526675]">
                          {item.ownerLabel} · {item.dueLabel}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span
                            className={`text-[11px] font-semibold ${
                              item.priority === 'Prioritas Tinggi'
                                ? 'text-[#B23A48]'
                                : 'text-[#0284C7]'
                            }`}
                          >
                            {item.priority}
                          </span>
                          <span className="font-mono-tabular text-[11px] font-bold text-[#17324D]">
                            {item.progressPct}%
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#D8E3E9]">
                          <div
                            className={`h-full rounded-full ${
                              item.completed ? 'bg-[#247A55]' : 'bg-[#0284C7]'
                            }`}
                            style={{ width: `${item.progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenCreateTaskGoal}
            className="mt-4 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[10px] border border-[#87CEEB] bg-[#E6F4F9] text-xs font-semibold text-[#17324D] hover:bg-[#D5ECF6]"
          >
            <Plus className="h-4 w-4 text-[#0284C7]" />
            <span>Tambah Task / Goal Baru</span>
          </button>
        </section>

        {/* Right: Kolaborasi Human + AI Space */}
        <section className="lg:col-span-6 rounded-[14px] border border-[#D8E3E9] bg-white p-4 sm:p-5 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex flex-col gap-2.5 border-b border-[#EAF2F6] pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[#0284C7]" />
                <h2 className="text-sm font-bold text-[#17324D]">
                  Kolaborasi Human + AI
                </h2>
              </div>
              <div className="grid w-full grid-cols-3 gap-1 rounded-[9px] border border-[#D8E3E9] bg-[#F5F8FA] p-0.5 sm:inline-flex sm:w-auto">
                {(['Diskusi', 'Handoff', 'File & Aktivitas'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setCollabTab(t)}
                    className={`h-8 sm:h-7 rounded-[7px] px-1.5 sm:px-2.5 text-[11px] sm:text-xs font-semibold truncate ${
                      collabTab === t
                        ? 'bg-white text-[#17324D] shadow-xs'
                        : 'text-[#526675]'
                    }`}
                  >
                    {t === 'File & Aktivitas' ? 'File & Log' : t}
                  </button>
                ))}
              </div>
            </div>

            {collabTab === 'Diskusi' && (
              <div className="mt-4 space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {collabMessages.map((msg) => {
                  const isAI = msg.senderRole === 'AI Worker';
                  return (
                    <div
                      key={msg.id}
                      className={`rounded-[12px] border p-3.5 ${
                        isAI
                          ? 'border-[#87CEEB] bg-[#E6F4F9]/55'
                          : 'border-[#D8E3E9] bg-[#F5F8FA]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#17324D]">
                            {msg.senderName}
                          </span>
                          <span className="text-[11px] font-medium text-[#0284C7]">
                            · {msg.senderRole}
                          </span>
                        </div>
                        <span className="font-mono-tabular text-[11px] text-[#718391]">
                          {msg.time}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#172B3A]">
                        {msg.text}
                      </p>
                      {msg.handoffApproved && (
                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-[6px] bg-[#247A55]/10 px-2 py-0.5 text-[11px] font-semibold text-[#247A55]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Handoff Disetujui Supervisor</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {collabTab === 'Handoff' && (
              <div className="mt-4 space-y-3">
                {handoffs.map((h) => (
                  <div
                    key={h.id}
                    className="rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-3.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono-tabular text-[11px] font-bold text-[#0284C7]">
                        {h.runId} · {h.fromWorker}
                      </span>
                      <span className="text-[11px] font-semibold text-[#17324D]">
                        {h.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-bold text-[#17324D]">
                      {h.taskTitle}
                    </p>
                    <p className="mt-1 text-[11px] text-[#526675]">
                      Lead: {h.leadName} ({h.qualificationScore}) → {h.assignedTo} ({h.areaLabel})
                    </p>
                    <button
                      type="button"
                      onClick={() => onOpenHandoffModal(h.id)}
                      className="mt-2.5 inline-flex h-8 items-center gap-1.5 rounded-[8px] bg-[#0284C7] px-3 text-xs font-semibold text-white"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      <span>Atur Penugasan Staff Sales</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {collabTab === 'File & Aktivitas' && (
              <div className="mt-4 space-y-2.5">
                {[
                  {
                    name: 'Proposal_B2B_PT_Maju_Jaya.md',
                    by: 'AI Sales Assistant · Content Studio',
                    time: 'Hari ini, 09:15',
                  },
                  {
                    name: 'Storyboard_Reels_FTTH_100Mbps.svg',
                    by: 'AI Sales Assistant · Support Staff Sales',
                    time: 'Hari ini, 08:50',
                  },
                  {
                    name: 'Jadwal_15_WO_Jabodetabek.csv',
                    by: 'Work Order Coordinator AI',
                    time: 'Hari ini, 08:30',
                  },
                ].map((f) => (
                  <div
                    key={f.name}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] p-3"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                      <FileText className="h-4 w-4 shrink-0 text-[#0284C7]" />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-[#17324D]">
                          {f.name}
                        </p>
                        <p className="truncate text-[11px] text-[#526675]">{f.by}</p>
                      </div>
                    </div>
                    <span className="font-mono-tabular shrink-0 text-[11px] text-[#718391]">
                      {f.time}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {collabTab === 'Diskusi' && (
            <form
              onSubmit={handleSend}
              className="mt-4 flex items-center gap-2 border-t border-[#EAF2F6] pt-3"
            >
              <input
                type="text"
                value={draftMsg}
                onChange={(e) => setDraftMsg(e.target.value)}
                placeholder="Tulis pesan koordinasi ke tim atau AI Worker..."
                className="h-10 flex-1 rounded-[10px] border border-[#B8C9D3] px-3 text-xs text-[#172B3A] focus:border-[#0284C7] focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#0284C7] px-4 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Kirim</span>
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
