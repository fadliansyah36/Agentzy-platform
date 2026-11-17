'use client';

import React, { useState } from 'react';
import {
  X,
  Bot,
  Sparkles,
  Wand2,
  GitBranch,
  CheckCircle2,
  Coins,
  UserCheck,
  AlertTriangle,
  Database,
  Puzzle,
  Plus,
} from 'lucide-react';
import type {
  AIWorkerEntity,
  AIWorkforceSectionId,
  AIWMTaskGoalItem,
  HandoffAssignmentItem,
  WorkflowDefinitionItem,
  WorkflowNodeItem,
  WorkflowRunItem,
} from '../../lib/ai-workforce-types';
import type {
  HumanAIBindingRecord,
  WorkforceHumanRole,
} from '@/lib/human-ai-bindings';
import type { AIWorkforceModalState } from '../../hooks/useAIWorkforcePortal';
import { formatCreditsID } from '../../services/ai-workforce-service';

function ModalCard({
  title,
  subtitle,
  onClose,
  maxWidth = 'max-w-lg',
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  maxWidth?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#172B3A]/55 p-0 sm:p-4 backdrop-blur-xs"
    >
      <div
        className={`w-full ${maxWidth} max-h-[88vh] overflow-y-auto rounded-t-[20px] sm:rounded-[16px] border border-[#D8E3E9] bg-white p-4 sm:p-6 shadow-xl`}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#D8E3E9] sm:hidden" />
        <div className="flex items-start justify-between gap-3 border-b border-[#EAF2F6] pb-3.5">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-[#17324D]">{title}</h3>
            {subtitle && (
              <p className="mt-0.5 text-xs text-[#526675]">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-[8px] text-[#526675] hover:bg-[#EAF2F6]"
            aria-label="Tutup modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export function AIWorkforceModals({
  modal,
  aiWorkers,
  workflows,
  runs,
  handoffs,
  aiCreditsBalance,
  onClose,
  onNavigate,
  onUpdateWorkerJD,
  onCreateTaskGoal,
  onAddSkill,
  onAddKnowledge,
  onAddWorkflowNode,
  onConfirmHandoff,
  onRetryRun,
  onRunCompensation,
  onTopUpCredits,
  onCreateBinding,
}: {
  modal: AIWorkforceModalState;
  aiWorkers: AIWorkerEntity[];
  workflows: WorkflowDefinitionItem[];
  runs: WorkflowRunItem[];
  handoffs: HandoffAssignmentItem[];
  aiCreditsBalance: number;
  onClose: () => void;
  onNavigate: (section: AIWorkforceSectionId) => void;
  onUpdateWorkerJD: (workerId: string, mission: string, objectives: string[]) => void;
  onCreateTaskGoal: (
    kind: AIWMTaskGoalItem['kind'],
    title: string,
    ownerLabel: string,
    priority: AIWMTaskGoalItem['priority'],
    dueLabel: string
  ) => void;
  onAddSkill: (name: string, description: string, publisher: string) => void;
  onAddKnowledge: (title: string, category: string, documentsCount: number) => void;
  onAddWorkflowNode: (
    workflowId: string,
    type: WorkflowNodeItem['type'],
    title: string,
    actor: string
  ) => void;
  onConfirmHandoff: (
    handoffId: string,
    assignedTo: string,
    includeHistory: boolean
  ) => void;
  onRetryRun: (runId: string) => void;
  onRunCompensation: (runId: string, actionLabel: string, notes: string) => void;
  onTopUpCredits: (amount: number) => void;
  onCreateBinding: (
    payload: Omit<
      HumanAIBindingRecord,
      'id' | 'managedByRole' | 'managedByPerson' | 'status' | 'updatedAt'
    >
  ) => void;
}) {
  const [jdMission, setJdMission] = useState('');
  const [jdObjectivesText, setJdObjectivesText] = useState('');
  const [taskKind, setTaskKind] = useState<AIWMTaskGoalItem['kind']>('Tugas');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskOwner, setTaskOwner] = useState('Staff Sales + AI Sales Assistant');
  const [taskPriority, setTaskPriority] =
    useState<AIWMTaskGoalItem['priority']>('Prioritas Tinggi');
  const [skillName, setSkillName] = useState('');
  const [skillDesc, setSkillDesc] = useState('');
  const [knowledgeTitle, setKnowledgeTitle] = useState('');
  const [knowledgeCategory, setKnowledgeCategory] = useState('Katalog Komersial');
  const [nodeType, setNodeType] = useState<WorkflowNodeItem['type']>('AI Task');
  const [nodeTitle, setNodeTitle] = useState('');
  const [nodeActor, setNodeActor] = useState('AI Sales Assistant');
  const [handoffOwner, setHandoffOwner] = useState('Raka Pratama');
  const [includeHistory, setIncludeHistory] = useState(true);
  const [compAction, setCompAction] = useState('Kembalikan kuota AI Credits terpakai');
  const [compNotes, setCompNotes] = useState('');
  const [topupAmount, setTopupAmount] = useState(500000);
  const [runDetailTab, setRunDetailTab] = useState<
    'Timeline' | 'Detail' | 'Log' | 'Output'
  >('Timeline');

  const [bindHumanName, setBindHumanName] = useState('');
  const [bindHumanRole, setBindHumanRole] = useState<WorkforceHumanRole>('sales');
  const [bindAiWorkerId, setBindAiWorkerId] = useState(aiWorkers[0]?.id || 'AIW-01');
  const [bindAutonomy, setBindAutonomy] = useState<'L1' | 'L2' | 'L3'>('L2');
  const [bindKpi, setBindKpi] = useState('≥ 30 Aktivasi/bln · SLA < 15 mnt');

  if (modal.type === 'none') return null;

  if (modal.type === 'quick-action') {
    return (
      <ModalCard
        title="Aksi Cepat AI Workforce Management"
        subtitle="Akses instan ke modul utama pengelolaan AI & dukungan Staff Sales"
        onClose={onClose}
      >
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {[
            {
              icon: Sparkles,
              label: 'Generate Content (Staff Sales)',
              desc: 'Buat Video, Flyer Design, Gambar & Dokumen Penawaran',
              section: 'content-studio' as AIWorkforceSectionId,
            },
            {
              icon: Wand2,
              label: 'Buat AI Worker Baru',
              desc: 'Wizard 5 tahap di AI Worker Studio',
              section: 'worker-studio' as AIWorkforceSectionId,
            },
            {
              icon: GitBranch,
              label: 'Buka Workflow Builder',
              desc: 'Tambah node Trigger, Condition, AI & Human Task',
              section: 'workflow-builder' as AIWorkforceSectionId,
            },
            {
              icon: UserCheck,
              label: 'Tinjau Approval & Handoff',
              desc: 'Setujui eksekusi AI atau teruskan ke Staff Sales',
              section: 'approvals' as AIWorkforceSectionId,
            },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                onNavigate(item.section);
                onClose();
              }}
              className="flex items-start gap-3 rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-3.5 text-left transition hover:border-[#0284C7] hover:bg-[#E6F4F9]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-[#0284C7] text-white">
                <item.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#17324D]">{item.label}</p>
                <p className="mt-0.5 text-[11px] text-[#526675]">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </ModalCard>
    );
  }

  if (modal.type === 'edit-jd') {
    const worker =
      aiWorkers.find((w) => w.id === modal.workerId) ?? aiWorkers[0];
    const missionVal = jdMission || worker.mission;
    const objVal = jdObjectivesText || worker.objectives.join('\n');

    return (
      <ModalCard
        title={`Edit Job Description & Misi · ${worker.name}`}
        subtitle={`${worker.department} · ${worker.version}`}
        onClose={onClose}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const parsedObj = objVal
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean);
            onUpdateWorkerJD(worker.id, missionVal, parsedObj);
            setJdMission('');
            setJdObjectivesText('');
            onClose();
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#17324D]">
              Misi Utama
            </label>
            <textarea
              rows={3}
              value={missionVal}
              onChange={(e) => setJdMission(e.target.value)}
              className="w-full rounded-[10px] border border-[#B8C9D3] p-3 text-xs text-[#172B3A] focus:border-[#0284C7] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#17324D]">
              Tujuan / Objectives (1 poin per baris)
            </label>
            <textarea
              rows={4}
              value={objVal}
              onChange={(e) => setJdObjectivesText(e.target.value)}
              className="w-full rounded-[10px] border border-[#B8C9D3] p-3 text-xs text-[#172B3A] focus:border-[#0284C7] focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-[10px] border border-[#D8E3E9] px-4 text-xs font-semibold text-[#526675]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="h-10 rounded-[10px] bg-[#0284C7] px-5 text-xs font-semibold text-white hover:bg-[#0369A1]"
            >
              Simpan Perubahan JD
            </button>
          </div>
        </form>
      </ModalCard>
    );
  }

  if (modal.type === 'create-task-goal') {
    return (
      <ModalCard
        title="Buat Tugas / Goal Kolaborasi Tim & AI"
        subtitle="Tetapkan target bersama antara Staff Sales, Teknisi, atau AI Worker"
        onClose={onClose}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!taskTitle.trim()) return;
            onCreateTaskGoal(
              taskKind,
              taskTitle.trim(),
              taskOwner,
              taskPriority,
              'Hari ini'
            );
            setTaskTitle('');
            onClose();
          }}
          className="space-y-3.5"
        >
          <div className="grid grid-cols-3 gap-2">
            {(['Tugas', 'Goal', 'Backlog'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setTaskKind(k)}
                className={`h-9 rounded-[9px] border text-xs font-semibold ${
                  taskKind === k
                    ? 'border-[#0284C7] bg-[#E6F4F9] text-[#17324D]'
                    : 'border-[#D8E3E9] bg-white text-[#526675]'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#17324D]">
              Judul Tugas / Goal *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Siapkan paket konten promo klaster baru"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="h-10 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-xs text-[#172B3A]"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                Penanggung Jawab
              </label>
              <select
                value={taskOwner}
                onChange={(e) => setTaskOwner(e.target.value)}
                className="h-10 w-full rounded-[10px] border border-[#B8C9D3] bg-white px-2.5 text-xs"
              >
                <option>Staff Sales + AI Sales Assistant</option>
                <option>Affiliate Coach AI + Siti Nabila</option>
                <option>Tim Teknisi + Work Order Coordinator AI</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                Prioritas
              </label>
              <select
                value={taskPriority}
                onChange={(e) =>
                  setTaskPriority(e.target.value as AIWMTaskGoalItem['priority'])
                }
                className="h-10 w-full rounded-[10px] border border-[#B8C9D3] bg-white px-2.5 text-xs"
              >
                <option value="Prioritas Tinggi">Prioritas Tinggi</option>
                <option value="Normal">Normal</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-[10px] border border-[#D8E3E9] px-4 text-xs font-semibold text-[#526675]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="h-10 rounded-[10px] bg-[#0284C7] px-5 text-xs font-semibold text-white"
            >
              Simpan Tugas / Goal
            </button>
          </div>
        </form>
      </ModalCard>
    );
  }

  if (modal.type === 'add-skill') {
    return (
      <ModalCard
        title="Tambah / Import Skill ke Skills Registry"
        subtitle="Setiap skill memiliki izin tool dan kontrak input/output tervalidasi"
        onClose={onClose}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!skillName.trim()) return;
            onAddSkill(
              skillName.trim(),
              skillDesc.trim() || 'Skill terkelola untuk mendukung operasional tim.',
              'ISP Nusantara'
            );
            setSkillName('');
            setSkillDesc('');
            onClose();
          }}
          className="space-y-3.5"
        >
          <div className="flex items-center gap-2 rounded-[10px] bg-[#E6F4F9] p-3 text-xs text-[#17324D]">
            <Puzzle className="h-4 w-4 text-[#0284C7]" />
            <span>Skill yang ditambahkan akan melewati pemeriksaan izin tool tenant.</span>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#17324D]">
              Nama Skill *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Promo Campaign Copywriter"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              className="h-10 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#17324D]">
              Deskripsi Fungsi
            </label>
            <textarea
              rows={3}
              placeholder="Jelaskan tugas dan output yang dihasilkan skill ini..."
              value={skillDesc}
              onChange={(e) => setSkillDesc(e.target.value)}
              className="w-full rounded-[10px] border border-[#B8C9D3] p-3 text-xs"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-[10px] border border-[#D8E3E9] px-4 text-xs font-semibold text-[#526675]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="h-10 rounded-[10px] bg-[#0284C7] px-5 text-xs font-semibold text-white"
            >
              Pasang Skill
            </button>
          </div>
        </form>
      </ModalCard>
    );
  }

  if (modal.type === 'add-knowledge') {
    return (
      <ModalCard
        title="Tambah Sumber Pengetahuan (Knowledge / RAG)"
        subtitle="Dokumen hanya dapat diakses oleh AI Worker dalam tenant yang sama"
        onClose={onClose}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!knowledgeTitle.trim()) return;
            onAddKnowledge(knowledgeTitle.trim(), knowledgeCategory, 120);
            setKnowledgeTitle('');
            onClose();
          }}
          className="space-y-3.5"
        >
          <div className="flex items-center gap-2 rounded-[10px] bg-[#E6F4F9] p-3 text-xs text-[#17324D]">
            <Database className="h-4 w-4 text-[#0284C7]" />
            <span>Mendukung PDF katalog promo, SOP instalasi teknisi, dan FAQ layanan.</span>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#17324D]">
              Judul Sumber Pengetahuan *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Promo Akhir Tahun FTTH Jabodetabek 2026"
              value={knowledgeTitle}
              onChange={(e) => setKnowledgeTitle(e.target.value)}
              className="h-10 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#17324D]">
              Kategori Dokumen
            </label>
            <select
              value={knowledgeCategory}
              onChange={(e) => setKnowledgeCategory(e.target.value)}
              className="h-10 w-full rounded-[10px] border border-[#B8C9D3] bg-white px-3 text-xs"
            >
              <option>Katalog Komersial</option>
              <option>Operasional Teknis</option>
              <option>Panduan Layanan</option>
              <option>Tata Kelola</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-[10px] border border-[#D8E3E9] px-4 text-xs font-semibold text-[#526675]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="h-10 rounded-[10px] bg-[#0284C7] px-5 text-xs font-semibold text-white"
            >
              Unggah &amp; Indeks
            </button>
          </div>
        </form>
      </ModalCard>
    );
  }

  if (modal.type === 'add-workflow-node') {
    const wf = workflows.find((w) => w.id === modal.workflowId) ?? workflows[0];
    return (
      <ModalCard
        title="Tambah Node Workflow"
        subtitle={`Tambahkan langkah baru ke ${wf.name} (${wf.version})`}
        onClose={onClose}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!nodeTitle.trim()) return;
            onAddWorkflowNode(wf.id, nodeType, nodeTitle.trim(), nodeActor);
            setNodeTitle('');
            onClose();
          }}
          className="space-y-3.5"
        >
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#17324D]">
              Pilih Tipe Node (Node Library)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  'Trigger',
                  'Condition',
                  'AI Task',
                  'Human Task',
                  'Parallel',
                  'Wait / Timer',
                  'Integration',
                  'Compensation',
                ] as const
              ).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setNodeType(t)}
                  className={`rounded-[9px] border px-3 py-2 text-left text-xs font-semibold ${
                    nodeType === t
                      ? 'border-[#0284C7] bg-[#E6F4F9] text-[#17324D]'
                      : 'border-[#D8E3E9] bg-white text-[#526675]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#17324D]">
              Nama Langkah / Node *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Kirim Penawaran via WhatsApp"
              value={nodeTitle}
              onChange={(e) => setNodeTitle(e.target.value)}
              className="h-10 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#17324D]">
              Pelaksana (Human / AI Worker)
            </label>
            <input
              type="text"
              value={nodeActor}
              onChange={(e) => setNodeActor(e.target.value)}
              className="h-10 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-xs"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-[10px] border border-[#D8E3E9] px-4 text-xs font-semibold text-[#526675]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#0284C7] px-5 text-xs font-semibold text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambahkan Node</span>
            </button>
          </div>
        </form>
      </ModalCard>
    );
  }

  if (modal.type === 'run-detail') {
    const run = runs.find((r) => r.id === modal.runId) ?? runs[0];
    return (
      <ModalCard
        title={`Detail Eksekusi · ${run.id}`}
        subtitle={`${run.workerOrWorkflowName} · Mulai ${run.startedAt} · Durasi ${run.durationLabel}`}
        maxWidth="max-w-xl"
        onClose={onClose}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] p-3 text-xs">
            <span className="font-semibold text-[#17324D]">{run.title}</span>
            <span className="font-mono-tabular font-bold text-[#0284C7]">
              {run.status} ({run.progressPct}%)
            </span>
          </div>

          {/* Screen 30 Sub-tabs: Timeline | Detail | Log | Output */}
          <div className="grid grid-cols-4 gap-1 rounded-[9px] border border-[#D8E3E9] bg-[#F5F8FA] p-1">
            {(['Timeline', 'Detail', 'Log', 'Output'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setRunDetailTab(t)}
                className={`h-8 rounded-[7px] px-2 text-xs font-semibold whitespace-nowrap ${
                  runDetailTab === t
                    ? 'bg-white text-[#17324D] shadow-xs'
                    : 'text-[#526675]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {runDetailTab === 'Timeline' && (
            <div className="space-y-2.5">
              {run.steps.map((step) => (
                <div
                  key={step.id}
                  className="flex items-start justify-between gap-3 rounded-[10px] border border-[#EAF2F6] bg-white p-3"
                >
                  <div className="flex items-start gap-2.5">
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#247A55]" />
                    ) : step.status === 'failed' ? (
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#B23A48]" />
                    ) : (
                      <Bot className="mt-0.5 h-4 w-4 shrink-0 text-[#0284C7]" />
                    )}
                    <div>
                      <p className="text-xs font-bold text-[#17324D]">
                        {step.label}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#526675]">
                        {step.detail}
                      </p>
                    </div>
                  </div>
                  <div className="text-right font-mono-tabular text-[11px] text-[#718391] shrink-0">
                    <p>{step.timeLabel}</p>
                    <p>{step.durationLabel}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {runDetailTab === 'Detail' && (
            <div className="rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-4 text-xs space-y-2">
              <p>
                <strong>Run ID:</strong>{' '}
                <span className="font-mono-tabular">{run.id}</span>
              </p>
              <p>
                <strong>Tipe Eksekusi:</strong> {run.runType}
              </p>
              <p>
                <strong>Workflow / Worker:</strong> {run.workerOrWorkflowName}
              </p>
              <p>
                <strong>Waktu Mulai &amp; Durasi:</strong> {run.startedAt} ({run.durationLabel})
              </p>
              <p>
                <strong>Status DLQ:</strong>{' '}
                {run.dlqFlag ? 'Tercatat di Antrean Pemulihan (DLQ)' : 'Normal'}
              </p>
            </div>
          )}

          {runDetailTab === 'Log' && (
            <div className="overflow-x-auto rounded-[12px] border border-[#D8E3E9] bg-[#17324D] p-3.5 font-mono-tabular text-[11px] text-[#E6F4F9] space-y-1.5">
              {run.steps.map((s) => (
                <p key={s.id} className="break-words">
                  [{s.timeLabel}] [{s.status.toUpperCase()}] {s.label} — {s.detail}
                </p>
              ))}
            </div>
          )}

          {runDetailTab === 'Output' && (
            <div className="rounded-[10px] bg-[#E6F4F9] p-4 text-xs text-[#17324D] space-y-1.5">
              <p className="font-bold">Ringkasan Output Eksekusi</p>
              <p className="leading-relaxed">{run.outputSummary}</p>
              {run.errorMessage && (
                <p className="mt-2 font-semibold text-[#B23A48]">
                  Kendala: {run.errorMessage}
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            {run.status === 'Gagal' && (
              <button
                type="button"
                onClick={() => {
                  onRetryRun(run.id);
                  onClose();
                }}
                className="h-10 rounded-[10px] bg-[#0284C7] px-4 text-xs font-semibold text-white"
              >
                Retry Eksekusi
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-[10px] border border-[#D8E3E9] px-4 text-xs font-semibold text-[#17324D]"
            >
              Tutup
            </button>
          </div>
        </div>
      </ModalCard>
    );
  }

  if (modal.type === 'handoff-assign') {
    const h = handoffs.find((item) => item.id === modal.handoffId) ?? handoffs[0];
    return (
      <ModalCard
        title="Human Assignment & Handoff Center"
        subtitle={`${h.runId} · Dari ${h.fromWorker}`}
        onClose={onClose}
      >
        <div className="space-y-4">
          <div className="rounded-[12px] border border-[#87CEEB] bg-[#E6F4F9]/60 p-3.5 text-xs">
            <p className="font-bold text-[#17324D]">{h.taskTitle}</p>
            <div className="mt-2 space-y-1 text-[#245477]">
              <p>
                <strong>Lead:</strong> {h.leadName} · Skor {h.qualificationScore}
              </p>
              <p>
                <strong>Rekomendasi AI:</strong> {h.aiRecommendation}
              </p>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[#17324D]">
              Tetapkan Penanggung Jawab (Staff Sales)
            </label>
            <select
              value={handoffOwner}
              onChange={(e) => setHandoffOwner(e.target.value)}
              className="h-10 w-full rounded-[10px] border border-[#B8C9D3] bg-white px-3 text-xs"
            >
              <option value="Raka Pratama">Raka Pratama (Staff Sales Jakarta)</option>
              <option value="Andi Saputra">Andi Saputra (Staff Sales Tangsel)</option>
              <option value="Siti Nabila">Siti Nabila (Staff Sales Bekasi)</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-xs text-[#172B3A]">
            <input
              type="checkbox"
              checked={includeHistory}
              onChange={(e) => setIncludeHistory(e.target.checked)}
              className="h-4 w-4 accent-[#0284C7]"
            />
            <span>Sertakan ringkasan konteks &amp; riwayat percakapan AI</span>
          </label>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-[10px] border border-[#D8E3E9] px-4 text-xs font-semibold text-[#526675]"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirmHandoff(h.id, handoffOwner, includeHistory);
                onClose();
              }}
              className="h-10 rounded-[10px] bg-[#0284C7] px-5 text-xs font-semibold text-white"
            >
              Kirim Penugasan
            </button>
          </div>
        </div>
      </ModalCard>
    );
  }

  if (modal.type === 'version-compare') {
    const wf = workflows.find((w) => w.id === modal.workflowId) ?? workflows[0];
    const latest = wf.versions[0];
    const prev = wf.versions[1] ?? wf.versions[0];
    return (
      <ModalCard
        title={`Bandingkan Versi · ${wf.name}`}
        subtitle={`${prev.version} vs ${latest.version}`}
        maxWidth="max-w-xl"
        onClose={onClose}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] p-3">
              <p className="font-mono-tabular text-sm font-bold text-[#526675]">
                {prev.version}
              </p>
              <p className="text-[11px] text-[#718391]">{prev.stage}</p>
            </div>
            <div className="rounded-[10px] border border-[#0284C7] bg-[#E6F4F9] p-3">
              <p className="font-mono-tabular text-sm font-bold text-[#17324D]">
                {latest.version}
              </p>
              <p className="text-[11px] text-[#0284C7]">{latest.stage}</p>
            </div>
          </div>

          <div className="rounded-[12px] border border-[#D8E3E9] bg-white p-4">
            <p className="text-xs font-bold text-[#17324D]">Perubahan Utama</p>
            <ul className="mt-2.5 space-y-2">
              {latest.changes.map((c) => (
                <li key={c} className="flex items-start gap-2 text-xs text-[#247A55]">
                  <span className="font-bold">+</span>
                  <span className="text-[#172B3A]">{c}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-[10px] bg-[#17324D] px-5 text-xs font-semibold text-white"
            >
              Tutup Perbandingan
            </button>
          </div>
        </div>
      </ModalCard>
    );
  }

  if (modal.type === 'compensation-remediation') {
    const run = runs.find((r) => r.id === modal.runId) ?? runs[0];
    return (
      <ModalCard
        title={`Kompensasi & Pemulihan · ${run.id}`}
        subtitle={run.title}
        onClose={onClose}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onRunCompensation(run.id, compAction, compNotes);
            setCompNotes('');
            onClose();
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#17324D]">
              Pilih Aksi Kompensasi Eksplisit
            </p>
            {[
              'Kembalikan kuota AI Credits terpakai',
              'Batalkan pembuatan konten tertunda',
              'Kirim notifikasi eskalasi ke tim terkait',
              'Jalankan workflow koreksi alternatif',
            ].map((opt) => (
              <label
                key={opt}
                className={`flex cursor-pointer items-center gap-2.5 rounded-[10px] border p-3 text-xs ${
                  compAction === opt
                    ? 'border-[#0284C7] bg-[#E6F4F9] font-semibold text-[#17324D]'
                    : 'border-[#D8E3E9] bg-white text-[#526675]'
                }`}
              >
                <input
                  type="radio"
                  name="compAction"
                  checked={compAction === opt}
                  onChange={() => setCompAction(opt)}
                  className="accent-[#0284C7]"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[#17324D]">
              Catatan Audit (Opsional)
            </label>
            <textarea
              rows={2}
              placeholder="Jelaskan alasan kompensasi untuk jejak audit..."
              value={compNotes}
              onChange={(e) => setCompNotes(e.target.value)}
              className="w-full rounded-[10px] border border-[#B8C9D3] p-2.5 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-[10px] border border-[#D8E3E9] px-4 text-xs font-semibold text-[#526675]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="h-10 rounded-[10px] bg-[#0284C7] px-5 text-xs font-semibold text-white"
            >
              Jalankan Kompensasi
            </button>
          </div>
        </form>
      </ModalCard>
    );
  }

  if (modal.type === 'topup-credits') {
    return (
      <ModalCard
        title="Top Up Saldo AI Credits"
        subtitle={`Saldo saat ini: ${formatCreditsID(aiCreditsBalance)} AI Credits`}
        onClose={onClose}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-2.5">
            {[250000, 500000, 1000000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setTopupAmount(val)}
                className={`flex items-center justify-between sm:block rounded-[10px] border p-3 sm:text-center transition ${
                  topupAmount === val
                    ? 'border-[#0284C7] bg-[#E6F4F9]'
                    : 'border-[#D8E3E9] bg-white'
                }`}
              >
                <Coins className="h-4 w-4 sm:mx-auto text-[#0284C7]" />
                <p className="sm:mt-1 font-mono-tabular text-xs font-bold text-[#17324D]">
                  +{formatCreditsID(val)}
                </p>
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-[10px] border border-[#D8E3E9] px-4 text-xs font-semibold text-[#526675]"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                onTopUpCredits(topupAmount);
                onClose();
              }}
              className="h-10 rounded-[10px] bg-[#0284C7] px-5 text-xs font-semibold text-white"
            >
              Konfirmasi Top Up
            </button>
          </div>
        </div>
      </ModalCard>
    );
  }

  if (modal.type === 'create-binding') {
    const selectedAi =
      aiWorkers.find((w) => w.id === bindAiWorkerId) ?? aiWorkers[0];
    const modeDefault =
      bindHumanRole === 'technician'
        ? 'Operasional Work Order, Optimasi Rute & Panduan Teknis'
        : bindHumanRole === 'affiliate'
          ? 'Materi Sosmed Harian, Skrip Promosi & Leads Komunitas'
          : 'Digital Marketing, Generate Content & Pencarian Leads';

    return (
      <ModalCard
        title="Ikat Staff Human dengan Staff AI (Collaboration)"
        subtitle="Khusus Divisi HRD, Admin, dan Direksi Agentzy — sinkron langsung ke Portal Workforce"
        onClose={onClose}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!bindHumanName.trim()) return;
            onCreateBinding({
              humanName: bindHumanName.trim(),
              humanCode:
                bindHumanRole === 'technician'
                  ? `TK-${Date.now().toString().slice(-4)}`
                  : bindHumanRole === 'affiliate'
                    ? `AF-${Date.now().toString().slice(-4)}`
                    : `SLS-${Date.now().toString().slice(-4)}`,
              humanRole: bindHumanRole,
              humanRoleLabel:
                bindHumanRole === 'technician'
                  ? 'Teknisi Lapangan FTTH/FWA'
                  : bindHumanRole === 'affiliate'
                    ? 'Affiliate Freelance Terkelola'
                    : 'Staff Sales Resmi Agentzy',
              aiWorkerId: selectedAi.id,
              aiWorkerName: selectedAi.name,
              collaborationMode: modeDefault,
              collaborationScope:
                bindHumanRole === 'technician'
                  ? [
                      'Koordinasi rute Work Order dan pengingat SLA',
                      'Panduan troubleshooting teknis di lokasi pelanggan',
                    ]
                  : [
                      'Generate konten promosi digital (Video, Design, Gambar, Dokumen)',
                      'Kualifikasi leads & draf pesan follow-up siap closing',
                    ],
              autonomyLevel: bindAutonomy,
              sharedKpiTarget: bindKpi,
              tenantScope: 'ISP Nusantara (Operasional Terkelola)',
            });
            setBindHumanName('');
            onClose();
          }}
          className="space-y-3.5"
        >
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#17324D]">
              Nama Staff Human *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Dimas Prakoso"
              value={bindHumanName}
              onChange={(e) => setBindHumanName(e.target.value)}
              className="h-10 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                Peran Staff Human
              </label>
              <select
                value={bindHumanRole}
                onChange={(e) =>
                  setBindHumanRole(e.target.value as WorkforceHumanRole)
                }
                className="h-10 w-full rounded-[10px] border border-[#B8C9D3] bg-white px-2.5 text-xs"
              >
                <option value="sales">Staff Sales</option>
                <option value="affiliate">Affiliate Freelance</option>
                <option value="technician">Teknisi Lapangan</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                Ikat dengan AI Worker
              </label>
              <select
                value={bindAiWorkerId}
                onChange={(e) => setBindAiWorkerId(e.target.value)}
                className="h-10 w-full rounded-[10px] border border-[#B8C9D3] bg-white px-2.5 text-xs"
              >
                {aiWorkers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                Level Otonomi Kolaborasi
              </label>
              <select
                value={bindAutonomy}
                onChange={(e) =>
                  setBindAutonomy(e.target.value as 'L1' | 'L2' | 'L3')
                }
                className="h-10 w-full rounded-[10px] border border-[#B8C9D3] bg-white px-2.5 text-xs"
              >
                <option value="L1">L1 · Drafting Konten &amp; Saran</option>
                <option value="L2">L2 · Bounded Internal</option>
                <option value="L3">L3 · Aksi Eksternal (Approval)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                Target KPI Bersama
              </label>
              <input
                type="text"
                value={bindKpi}
                onChange={(e) => setBindKpi(e.target.value)}
                className="h-10 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-xs"
              />
            </div>
          </div>

          <div className="rounded-[10px] bg-[#E6F4F9] p-3 text-[11px] text-[#17324D]">
            <strong>Mode Kolaborasi Otomatis:</strong> {modeDefault}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-[10px] border border-[#D8E3E9] px-4 text-xs font-semibold text-[#526675]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="h-10 rounded-[10px] bg-[#0284C7] px-5 text-xs font-semibold text-white"
            >
              Simpan Ikatan Kolaborasi
            </button>
          </div>
        </form>
      </ModalCard>
    );
  }

  return null;
}
