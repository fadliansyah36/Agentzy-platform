'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAgentzyAuth } from '@/apps/web/lib/auth/useAgentzyAuth';

import type {
  AIWMTenant,
  AIWorkerEntity,
  AIWMTaskGoalItem,
  AIWorkforceSectionId,
  ApprovalInboxItem,
  AuditIncidentItem,
  AutonomyLevel,
  CollaborationMessageItem,
  ContentArtifactItem,
  ContentArtifactKind,
  ContentChatMessage,
  HandoffAssignmentItem,
  KnowledgeSourceItem,
  MemoryLayerItem,
  ModelRoutingRule,
  ModelProviderItem,
  SkillPackageItem,
  ToolIntegrationItem,
  WorkflowDefinitionItem,
  WorkflowNodeItem,
  WorkflowRunItem,
} from '../lib/ai-workforce-types';
import {
  loadHumanAIBindings,
  saveHumanAIBindings,
  type AgentzyManagerRole,
  type HumanAIBindingRecord,
} from '@/lib/human-ai-bindings';

export type AIWorkforceModalState =
  | { type: 'none' }
  | { type: 'quick-action' }
  | { type: 'edit-jd'; workerId: string }
  | { type: 'create-task-goal' }
  | { type: 'create-binding' }
  | { type: 'add-skill' }
  | { type: 'add-knowledge' }
  | { type: 'add-workflow-node'; workflowId: string }
  | { type: 'run-detail'; runId: string }
  | { type: 'handoff-assign'; handoffId: string }
  | { type: 'version-compare'; workflowId: string }
  | { type: 'compensation-remediation'; runId: string }
  | { type: 'topup-credits' };

export function useAIWorkforcePortal(
  initialSection: AIWorkforceSectionId = 'overview'
) {
  const auth = useAgentzyAuth();
  const [activeSection, setActiveSection] = useState<AIWorkforceSectionId>(initialSection);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTenantId, setActiveTenantId] = useState('');

  // Core states
  const [aiWorkers, setAiWorkers] = useState<AIWorkerEntity[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [providers] = useState<ModelProviderItem[]>([]);
  const [routingRules, setRoutingRules] = useState<ModelRoutingRule[]>([]);
  const [skills, setSkills] = useState<SkillPackageItem[]>([]);
  const [tools, setTools] = useState<ToolIntegrationItem[]>([]);
  const [memoryLayers, setMemoryLayers] = useState<MemoryLayerItem[]>([]);
  const [knowledgeSources, setKnowledgeSources] = useState<
    KnowledgeSourceItem[]
  >([]);
  const [workflows, setWorkflows] = useState<WorkflowDefinitionItem[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');
  const [runs, setRuns] = useState<WorkflowRunItem[]>([]);
  const [approvals, setApprovals] = useState<ApprovalInboxItem[]>([]);
  const [handoffs, setHandoffs] = useState<HandoffAssignmentItem[]>([]);
  const [tasksGoals, setTasksGoals] = useState<AIWMTaskGoalItem[]>([]);
  const [collabMessages, setCollabMessages] = useState<CollaborationMessageItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditIncidentItem[]>([]);

  // AI Credits & Budget
  const [aiCreditsBalance, setAiCreditsBalance] = useState(0);
  const [monthlySoftLimit, setMonthlySoftLimit] = useState(0);
  const [monthlyHardLimit, setMonthlyHardLimit] = useState(0);
  const [offlinePwaMode, setOfflinePwaMode] = useState(true);

  // Content Studio (Chat + Artifact for Staff Sales)
  const [contentArtifacts, setContentArtifacts] = useState<
    ContentArtifactItem[]
  >([]);
  const [selectedArtifactId, setSelectedArtifactId] = useState('');
  const [contentChat, setContentChat] =
    useState<ContentChatMessage[]>([]);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);

  // Human <-> AI Binding & Agentzy Internal RBAC
  const [managerRole, setManagerRole] =
    useState<AgentzyManagerRole>('HRD Agentzy');
  const [humanAiBindings, setHumanAiBindings] = useState<HumanAIBindingRecord[]>(
    []
  );

  useEffect(() => {
    const sync = () => setHumanAiBindings(loadHumanAIBindings());
    const raf = window.requestAnimationFrame(sync);
    window.addEventListener('storage', sync);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const [modal, setModal] = useState<AIWorkforceModalState>({ type: 'none' });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const tenantOptions = useMemo<AIWMTenant[]>(() => {
    const allowed = new Set((auth.identity?.memberships ?? [])
      .filter((membership) => membership.permissions.includes('ai.workers.read'))
      .map((membership) => membership.tenant_id));
    return auth.tenants.filter((tenant) => allowed.has(tenant.id)).map((tenant) => ({
      id: tenant.id,
      code: tenant.slug,
      name: tenant.name,
    }));
  }, [auth.identity, auth.tenants]);
  const activeTenant = useMemo(
    () => tenantOptions.find((tenant) => tenant.id === activeTenantId) ?? tenantOptions[0] ?? null,
    [tenantOptions, activeTenantId]
  );

  useEffect(() => {
    if (auth.loading) return;
    if (auth.session && auth.identity && tenantOptions.length > 0) {
      const tenant = tenantOptions.find((item) => item.id === activeTenantId) ?? tenantOptions[0];
      setActiveTenantId(tenant.id);
      setIsAuthenticated(true);
      setActiveSection((current) => current === 'login' || current === 'splash' ? 'overview' : current);
    } else {
      setIsAuthenticated(false);
    }
  }, [auth.loading, auth.session, auth.identity, tenantOptions, activeTenantId]);

  const selectedWorker = useMemo(
    () => aiWorkers.find((w) => w.id === selectedWorkerId) ?? aiWorkers[0],
    [aiWorkers, selectedWorkerId]
  );

  const selectedWorkflow = useMemo(
    () => workflows.find((w) => w.id === selectedWorkflowId) ?? workflows[0],
    [workflows, selectedWorkflowId]
  );

  const selectedArtifact = useMemo(
    () =>
      contentArtifacts.find((a) => a.id === selectedArtifactId) ??
      contentArtifacts[0],
    [contentArtifacts, selectedArtifactId]
  );

  const appendAudit = useCallback(
    (
      kind: AuditIncidentItem['kind'],
      title: string,
      actor: string,
      detail: string,
      severity: AuditIncidentItem['severity'] = 'Info'
    ) => {
      setAuditLogs((prev) => [
        {
          id: `AUD-${Date.now().toString().slice(-4)}`,
          kind,
          title,
          actor,
          timestamp: 'Baru saja',
          severity,
          detail,
        },
        ...prev,
      ]);
    },
    []
  );

  const navigateTo = useCallback((section: AIWorkforceSectionId) => {
    setActiveSection(section);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const handleLogin = useCallback(
    async (email: string, password: string, method: 'password' | 'sso') => {
      if (method === 'sso') {
        await auth.signInWithOAuth();
        return;
      }
      const context = await auth.signIn(email, password);
      const allowed = new Set(context.identity.memberships
        .filter((membership) => membership.permissions.includes('ai.workers.read'))
        .map((membership) => membership.tenant_id));
      const tenant = context.tenants.find((item) => allowed.has(item.id));
      if (!tenant) {
        await auth.signOut();
        throw new Error('Akun belum memiliki permission ai.workers.read pada tenant aktif.');
      }
      setActiveTenantId(tenant.id);
      setIsAuthenticated(true);
      setActiveSection('overview');
      showToast(`Autentikasi berhasil untuk ${context.identity.email ?? email}.`);
    },
    [auth.signIn, auth.signInWithOAuth, auth.signOut, showToast]
  );

  const handleLogout = useCallback(async () => {
    await auth.signOut();
    setIsAuthenticated(false);
    setActiveTenantId('');
    setActiveSection('login');
    setModal({ type: 'none' });
  }, [auth.signOut]);

  const handleSwitchTenant = useCallback((tenantId: string) => {
    const tenant = auth.tenants.find((item) => item.id === tenantId);
    const membership = auth.identity?.memberships.find((item) => item.tenant_id === tenantId);
    if (!tenant || !membership?.permissions.includes('ai.workers.read')) {
      showToast('Tenant tidak memiliki permission AI Workforce untuk akun ini.');
      return;
    }
    setActiveTenantId(tenant.id);
    showToast(`Workspace tenant aktif berpindah ke ${tenant.name}.`);
  }, [auth.tenants, auth.identity, showToast]);

  const handleToggleWorkerStatus = useCallback(
    (workerId: string) => {
      setAiWorkers((prev) =>
        prev.map((w) => {
          if (w.id !== workerId) return w;
          const next = w.status === 'Aktif' ? 'Paused' : 'Aktif';
          appendAudit(
            'Audit Log',
            `Status AI Worker diubah menjadi ${next}`,
            w.name,
            `Operator mengubah status siklus hidup ${w.name} (${w.version}).`
          );
          showToast(`${w.name} sekarang berstatus ${next}`);
          return { ...w, status: next };
        })
      );
    },
    [appendAudit, showToast]
  );

  const handleCreateAIWorker = useCallback(
    (payload: {
      name: string;
      department: string;
      jobType: 'Collaborative (Human + AI)' | 'Supervised Autonomous';
      autonomyLevel: AutonomyLevel;
      model: string;
      skills: string[];
      memoryScopes: string[];
      mission: string;
    }) => {
      const id = `AIW-${String(aiWorkers.length + 1).padStart(2, '0')}`;
      const newWorker: AIWorkerEntity = {
        id,
        name: payload.name,
        subtitle: `${payload.department} · Custom Studio`,
        department: payload.department,
        role: `${payload.department} AI Specialist`,
        supervisor: 'Raka Pratama (Supervisor)',
        jobType: payload.jobType,
        riskClass: `${payload.autonomyLevel} - Terkendali`,
        autonomyLevel: payload.autonomyLevel,
        status: 'Aktif',
        version: 'v1.0.0',
        description: payload.mission,
        mission: payload.mission,
        objectives: [
          'Menjalankan tugas sesuai kontrak peran dan persetujuan supervisor',
          'Menjaga kepatuhan SLA & akurasi output di atas 95%',
        ],
        scopeIn: ['Eksekusi terpandu dalam batas skill terdaftar'],
        scopeOut: ['Tidak melakukan transaksi finansial atau aksi eksternal tanpa approval'],
        inputContract: ['Data CRM / Work Order', 'Brief Supervisor'],
        outputContract: ['Ringkasan Aksi', 'Laporan Kepatuhan'],
        kpis: [
          { label: 'Success Rate', target: '≥ 95%', actual: '100%', unit: 'Rate', status: 'Tercapai' },
          { label: 'Kepatuhan Policy', target: '100%', actual: '100%', unit: 'Compliance', status: 'Tercapai' },
        ],
        modelPolicy: {
          primaryProvider: 'Google',
          primaryModel: payload.model,
          fallbackModel: 'GPT-5.1',
          latencyTargetSec: 3.0,
        },
        skills: payload.skills,
        tools: ['CRM ISP', 'Google Workspace'],
        memoryScopes: payload.memoryScopes,
        creditsUsed: 0,
        creditsBudget: 200000,
        successRatePct: 100,
        qualityScore: 4.8,
        slaCompliancePct: 100,
        avgLatencySec: 2.5,
        costPerTaskIdr: 380,
        versions: [
          { version: 'v1.0.0', status: 'Aktif', date: 'Hari ini', notes: 'Dibuat melalui AI Worker Studio' },
        ],
      };
      setAiWorkers((prev) => [newWorker, ...prev]);
      setSelectedWorkerId(id);
      appendAudit(
        'Audit Log',
        `AI Worker baru dibuat: ${payload.name}`,
        'AI Worker Studio',
        `Model ${payload.model} · Level ${payload.autonomyLevel}`
      );
      showToast(`${payload.name} berhasil dipublikasikan ke Registry`);
      setActiveSection('worker-detail');
    },
    [aiWorkers.length, appendAudit, showToast]
  );

  const handleUpdateWorkerJD = useCallback(
    (workerId: string, mission: string, objectives: string[]) => {
      setAiWorkers((prev) =>
        prev.map((w) => (w.id === workerId ? { ...w, mission, objectives } : w))
      );
      appendAudit(
        'Audit Log',
        `Pembaruan Job Description & Misi (${workerId})`,
        'Supervisor',
        'Misi utama dan target KPI AI Worker diperbarui.'
      );
      showToast('Job Description & Misi AI Worker diperbarui');
    },
    [appendAudit, showToast]
  );

  const handleCreateNewWorkerVersion = useCallback(
    (workerId: string, notes: string) => {
      setAiWorkers((prev) =>
        prev.map((w) => {
          if (w.id !== workerId) return w;
          const parts = w.version.replace('v', '').split('.').map(Number);
          const nextVersion = `v${parts[0] || 1}.${(parts[1] || 0) + 1}.0`;
          return {
            ...w,
            version: nextVersion,
            versions: [
              {
                version: nextVersion,
                status: 'Aktif',
                date: 'Hari ini',
                notes: notes || 'Pembaruan prompt & batas otonomi',
              },
              ...w.versions.map((v) => ({
                ...v,
                status: 'Approved' as const,
              })),
            ],
          };
        })
      );
      showToast('Versi baru AI Worker berhasil dibuat dan diaktifkan');
    },
    [showToast]
  );

  const handleRollbackWorkerVersion = useCallback(
    (workerId: string, targetVersion: string) => {
      setAiWorkers((prev) =>
        prev.map((w) => {
          if (w.id !== workerId) return w;
          return {
            ...w,
            version: targetVersion,
            versions: w.versions.map((v) => ({
              ...v,
              status: v.version === targetVersion ? 'Aktif' : 'Approved',
            })),
          };
        })
      );
      appendAudit(
        'Audit Log',
        `Rollback versi AI Worker ke ${targetVersion}`,
        'Supervisor',
        `Versi aktif dikembalikan ke ${targetVersion}.`
      );
      showToast(`Berhasil rollback ke versi ${targetVersion}`);
    },
    [appendAudit, showToast]
  );

  const handleInstallSkill = useCallback(
    (skillId: string) => {
      setSkills((prev) =>
        prev.map((s) => (s.id === skillId ? { ...s, status: 'Terpasang' } : s))
      );
      showToast('Skill berhasil dipasang ke Skills Registry');
    },
    [showToast]
  );

  const handleAddSkill = useCallback(
    (name: string, description: string, publisher: string) => {
      const next: SkillPackageItem = {
        id: `SKL-0${skills.length + 1}`,
        name,
        version: 'v1.0.0',
        publisher: publisher || 'ISP Nusantara Internal',
        status: 'Terpasang',
        risk: 'Rendah',
        description,
        requiredTools: ['CRM ISP'],
      };
      setSkills((prev) => [next, ...prev]);
      showToast(`Skill "${name}" ditambahkan`);
    },
    [skills.length, showToast]
  );

  const handleToggleToolPermission = useCallback(
    (toolId: string) => {
      setTools((prev) =>
        prev.map((t) => {
          if (t.id !== toolId) return t;
          const nextStatus =
            t.permissionStatus === 'Disetujui' ? 'Dibatasi' : 'Disetujui';
          return { ...t, permissionStatus: nextStatus };
        })
      );
      showToast('Izin akses tool diperbarui');
    },
    [showToast]
  );

  const handleToggleMemoryStatus = useCallback(
    (memId: string) => {
      setMemoryLayers((prev) =>
        prev.map((m) => {
          if (m.id !== memId) return m;
          const next = m.status === 'Aktif' ? 'Terbatas' : 'Aktif';
          return { ...m, status: next };
        })
      );
      showToast('Kebijakan lapisan memori diperbarui');
    },
    [showToast]
  );

  const handleAddKnowledgeSource = useCallback(
    (title: string, category: string, documentsCount: number) => {
      const item: KnowledgeSourceItem = {
        id: `KNW-0${knowledgeSources.length + 1}`,
        title,
        category,
        documentsCount,
        chunksCount: documentsCount * 14,
        syncStatus: 'Sinkron',
        lastUpdated: 'Baru saja',
      };
      setKnowledgeSources((prev) => [item, ...prev]);
      showToast(`Sumber pengetahuan "${title}" berhasil diindeks`);
    },
    [knowledgeSources.length, showToast]
  );

  const handleAddWorkflowNode = useCallback(
    (
      workflowId: string,
      type: WorkflowNodeItem['type'],
      title: string,
      actor: string
    ) => {
      setWorkflows((prev) =>
        prev.map((wf) => {
          if (wf.id !== workflowId) return wf;
          const nextNode: WorkflowNodeItem = {
            id: `N-${Date.now().toString().slice(-4)}`,
            type,
            title,
            subtitle: `${type} · Ditambahkan dari Node Library`,
            actor,
            branch: 'main',
          };
          return { ...wf, nodes: [...wf.nodes, nextNode] };
        })
      );
      showToast(`Node ${type} "${title}" ditambahkan ke Workflow Builder`);
    },
    [showToast]
  );

  const handleExecuteWorkflow = useCallback(
    (workflowId: string) => {
      const wf = workflows.find((w) => w.id === workflowId);
      if (!wf) return;
      const runId = `RUN-${Math.floor(48300 + Math.random() * 600)}`;
      const newRun: WorkflowRunItem = {
        id: runId,
        runType: 'Workflow Run',
        title: `${wf.name} · Eksekusi Manual`,
        workerOrWorkflowName: `${wf.name} ${wf.version}`,
        startedAt: 'Baru saja',
        durationLabel: '00:12',
        progressPct: 35,
        status: 'Running',
        outputSummary: 'Eksekusi workflow dimulai oleh operator portal.',
        steps: [
          {
            id: 'ST-1',
            label: wf.nodes[0]?.title || 'Trigger Awal',
            timeLabel: 'Baru saja',
            durationLabel: '1 dtk',
            status: 'completed',
            detail: 'Workflow berhasil dipicu dari Workflow Builder.',
          },
          {
            id: 'ST-2',
            label: wf.nodes[1]?.title || 'Eksekusi AI Worker',
            timeLabel: 'Berjalan',
            durationLabel: 'Proses',
            status: 'running',
            detail: 'Sedang memproses langkah berikutnya.',
          },
        ],
      };
      setRuns((prev) => [newRun, ...prev]);
      appendAudit(
        'Run History',
        `Workflow Run ${runId} dimulai`,
        'Operator Portal',
        `Menjalankan ${wf.name} (${wf.version}).`
      );
      showToast(`Workflow ${wf.name} dijalankan (${runId})`);
      setActiveSection('runs');
    },
    [appendAudit, showToast, workflows]
  );

  const handleRetryRun = useCallback(
    (runId: string) => {
      setRuns((prev) =>
        prev.map((r) =>
          r.id === runId
            ? {
                ...r,
                status: 'Running',
                progressPct: 70,
                errorMessage: undefined,
                dlqFlag: false,
                outputSummary: 'Eksekusi diulang otomatis oleh sistem recovery.',
              }
            : r
        )
      );
      appendAudit(
        'Run History',
        `Retry eksekusi ${runId}`,
        'Recovery Console',
        'Run gagal dijalankan ulang dari checkpoint terakhir.'
      );
      showToast(`${runId} sedang dijalankan ulang`);
    },
    [appendAudit, showToast]
  );

  const handleRunCompensation = useCallback(
    (runId: string, actionLabel: string, notes: string) => {
      setRuns((prev) =>
        prev.map((r) =>
          r.id === runId
            ? {
                ...r,
                status: 'Selesai',
                progressPct: 100,
                errorMessage: undefined,
                dlqFlag: false,
                outputSummary: `Kompensasi dijalankan: ${actionLabel}${notes ? ` (${notes})` : ''}`,
              }
            : r
        )
      );
      if (actionLabel.toLowerCase().includes('kuota')) {
        setAiCreditsBalance((b) => b + 12500);
      }
      appendAudit(
        'Audit Log',
        `Aksi Kompensasi pada ${runId}`,
        'Ops Supervisor',
        `${actionLabel}. ${notes || ''}`
      );
      showToast(`Kompensasi "${actionLabel}" berhasil dijalankan`);
    },
    [appendAudit, showToast]
  );

  const handleApprovalDecision = useCallback(
    (approvalId: string, decision: 'Disetujui' | 'Ditolak') => {
      setApprovals((prev) =>
        prev.map((a) => (a.id === approvalId ? { ...a, status: decision } : a))
      );
      appendAudit(
        'Audit Log',
        `Approval ${approvalId} ${decision}`,
        'Supervisor',
        `Keputusan Human-in-the-Loop dicatat untuk ${approvalId}.`
      );
      showToast(`${approvalId} telah ${decision.toLowerCase()}`);
    },
    [appendAudit, showToast]
  );

  const handleConfirmHandoff = useCallback(
    (handoffId: string, assignedTo: string, includeHistory: boolean) => {
      setHandoffs((prev) =>
        prev.map((h) =>
          h.id === handoffId
            ? {
                ...h,
                assignedTo,
                includeHistory,
                status: 'Terkirim ke Staff Sales',
              }
            : h
        )
      );
      appendAudit(
        'Audit Log',
        `Handoff AI ke Staff Sales (${assignedTo})`,
        'Handoff Center',
        `Penugasan diteruskan ke ${assignedTo}${includeHistory ? ' beserta riwayat konteks AI' : ''}.`
      );
      showToast(`Penugasan berhasil dikirim ke Staff Sales ${assignedTo}`);
    },
    [appendAudit, showToast]
  );

  const handleToggleTaskGoal = useCallback((id: string) => {
    setTasksGoals((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              completed: !t.completed,
              progressPct: !t.completed ? 100 : 50,
            }
          : t
      )
    );
  }, []);

  const handleCreateTaskGoal = useCallback(
    (
      kind: AIWMTaskGoalItem['kind'],
      title: string,
      ownerLabel: string,
      priority: AIWMTaskGoalItem['priority'],
      dueLabel: string
    ) => {
      const next: AIWMTaskGoalItem = {
        id: `TG-${Date.now().toString().slice(-3)}`,
        kind,
        title,
        ownerLabel,
        priority,
        dueLabel,
        progressPct: 15,
        completed: false,
      };
      setTasksGoals((prev) => [next, ...prev]);
      showToast(`${kind} baru ditambahkan untuk kolaborasi tim`);
    },
    [showToast]
  );

  const handleSendCollabMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    setCollabMessages((prev) => [
      ...prev,
      {
        id: `MSG-${Date.now()}`,
        senderName: 'Raka Pratama (Anda)',
        senderRole: 'Staff Sales',
        time: new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        text: text.trim(),
      },
    ]);
  }, []);

  const handleTopUpCredits = useCallback(
    (amount: number) => {
      setAiCreditsBalance((b) => b + amount);
      appendAudit(
        'Audit Log',
        `Top Up AI Credits +${amount.toLocaleString('id-ID')}`,
        'Admin Tenant',
        `Saldo AI Credits bertambah untuk operasional AI Worker & Content Studio.`
      );
      showToast(`Saldo AI Credits bertambah +${amount.toLocaleString('id-ID')}`);
    },
    [appendAudit, showToast]
  );

  const canManageBindings =
    managerRole === 'HRD Agentzy' ||
    managerRole === 'Admin Agentzy' ||
    managerRole === 'Direksi Agentzy';

  const handleCreateBinding = useCallback(
    (
      payload: Omit<
        HumanAIBindingRecord,
        'id' | 'managedByRole' | 'managedByPerson' | 'status' | 'updatedAt'
      >
    ) => {
      if (!canManageBindings) {
        showToast(
          'Hanya Divisi HRD, Admin, dan Direksi Agentzy yang dapat mengatur ikatan Staff Human + AI.'
        );
        return;
      }
      const actorPerson =
        managerRole === 'HRD Agentzy'
          ? 'Dina Kusuma (HRD & People Ops Agentzy)'
          : managerRole === 'Admin Agentzy'
            ? 'Hendra Wijaya (Admin Workforce Agentzy)'
            : 'Arif Rahman (Direktur Operasional Agentzy)';
      const newBinding: HumanAIBindingRecord = {
        ...payload,
        id: `BND-${Date.now().toString().slice(-3)}`,
        managedByRole: managerRole,
        managedByPerson: actorPerson,
        status: 'Aktif',
        updatedAt: 'Baru saja',
      };
      setHumanAiBindings((prev) => {
        const next = [newBinding, ...prev];
        saveHumanAIBindings(next);
        return next;
      });
      appendAudit(
        'Audit Log',
        `Ikatan Kolaborasi Baru: ${payload.humanName} ↔ ${payload.aiWorkerName}`,
        actorPerson,
        `Ditetapkan oleh ${managerRole} untuk kolaborasi ${payload.collaborationMode}.`
      );
      showToast(
        `Ikatan kolaborasi ${payload.humanName} ↔ ${payload.aiWorkerName} berhasil disimpan`
      );
    },
    [appendAudit, canManageBindings, managerRole, showToast]
  );

  const handleToggleBindingStatus = useCallback(
    (bindingId: string) => {
      if (!canManageBindings) {
        showToast(
          'Akses dibatasi: Corporate / ISP hanya dapat melihat data operasional di Portal Corporate.'
        );
        return;
      }
      setHumanAiBindings((prev) => {
        const next = prev.map((b) => {
          if (b.id !== bindingId) return b;
          const nextStatus: 'Aktif' | 'Jeda' =
            b.status === 'Aktif' ? 'Jeda' : 'Aktif';
          return { ...b, status: nextStatus, updatedAt: 'Baru saja' };
        });
        saveHumanAIBindings(next);
        return next;
      });
      appendAudit(
        'Audit Log',
        `Perubahan status ikatan Human + AI (${bindingId})`,
        managerRole,
        `Status kolaborasi diperbarui oleh ${managerRole}.`
      );
      showToast('Status ikatan kolaborasi Human + AI diperbarui');
    },
    [appendAudit, canManageBindings, managerRole, showToast]
  );

  const handleUpdateBindingAiWorker = useCallback(
    (bindingId: string, aiWorkerId: string, aiWorkerName: string) => {
      if (!canManageBindings) {
        showToast(
          'Hanya HRD, Admin, atau Direksi Agentzy yang berwenang mengubah ikatan AI Partner.'
        );
        return;
      }
      setHumanAiBindings((prev) => {
        const next = prev.map((b) =>
          b.id === bindingId
            ? {
                ...b,
                aiWorkerId,
                aiWorkerName,
                managedByRole: managerRole,
                updatedAt: 'Baru saja',
              }
            : b
        );
        saveHumanAIBindings(next);
        return next;
      });
      showToast(`Partner AI pada ${bindingId} diperbarui menjadi ${aiWorkerName}`);
    },
    [canManageBindings, managerRole, showToast]
  );

  const handleCreateWorkflowVersion = useCallback(
    (workflowId: string, changeNote: string) => {
      setWorkflows((prev) =>
        prev.map((wf) => {
          if (wf.id !== workflowId) return wf;
          const parts = wf.version.replace('v', '').split('.').map(Number);
          const nextVer = `v${parts[0] || 1}.${(parts[1] || 0) + 1}`;
          return {
            ...wf,
            version: nextVer,
            versions: [
              {
                version: nextVer,
                stage: 'Staging',
                publishedAt: 'Hari ini',
                changes: [
                  changeNote.trim() || 'Penambahan aturan handoff & optimasi SLA',
                ],
              },
              ...wf.versions,
            ],
          };
        })
      );
      appendAudit(
        'Audit Log',
        `Versi workflow baru dibuat untuk ${workflowId}`,
        managerRole,
        changeNote || 'Rilis Staging baru dibuat dari Workflow Center.'
      );
      showToast('Versi workflow baru (Staging) berhasil dibuat');
    },
    [appendAudit, managerRole, showToast]
  );

  const handleGenerateContentArtifact = useCallback(
    async (
      prompt: string,
      kind: ContentArtifactKind,
      channel: string
    ) => {
    if (!activeTenant) throw new Error('Tenant context belum tersedia.');

      const trimmed = prompt.trim();
      if (!trimmed) return;
      setContentError(null);
      setIsGeneratingContent(true);

      const userMsg: ContentChatMessage = {
        id: `CM-U-${Date.now()}`,
        role: 'user',
        timestamp: new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        text: trimmed,
      };
      setContentChat((prev) => [...prev, userMsg]);

      try {
        const res = await fetch('/api/ai-workforce/generate-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: trimmed,
            kind,
            channel,
            tenantName: activeTenant.name,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data?.result) {
          throw new Error(
            data?.error || 'Gagal menghasilkan konten melalui AI Content Studio.'
          );
        }

        const r = data.result;
        const newArtifactId = `ART-${Date.now().toString().slice(-4)}`;
        const newArtifact: ContentArtifactItem = {
          id: newArtifactId,
          kind,
          title: r.title || `Materi ${kind} untuk Staff Sales`,
          targetAudience: r.targetAudience || 'Calon Pelanggan ISP Area Target',
          channel,
          createdAt: 'Baru saja',
          promptUsed: trimmed,
          summary: r.summary || 'Materi promosi siap pakai untuk Staff Sales & Affiliate.',
          captionOrCopy: r.captionOrCopy || '',
          hashtags: Array.isArray(r.hashtags) ? r.hashtags : ['#InternetCepat', '#Agentzy'],
          videoScenes:
            kind === 'video' && Array.isArray(r.videoScenes)
              ? r.videoScenes
              : undefined,
          designConfig:
            kind === 'design' && r.designConfig
              ? {
                  headline: r.designConfig.headline || r.title,
                  subheadline: r.designConfig.subheadline || r.summary,
                  offerBadge: r.designConfig.offerBadge || 'PROMO SPESIAL AREA',
                  ctaText: r.designConfig.ctaText || 'Hubungi Staff Sales Resmi',
                  accentColor: r.designConfig.accentColor || '#0284C7',
                  bullets: Array.isArray(r.designConfig.bullets)
                    ? r.designConfig.bullets
                    : [r.summary],
                }
              : undefined,
          imageSpec:
            kind === 'image' && r.imageSpec
              ? {
                  aspectRatio:
                    r.imageSpec.aspectRatio === '9:16' ||
                    r.imageSpec.aspectRatio === '1:1'
                      ? r.imageSpec.aspectRatio
                      : '16:9',
                  visualConcept: r.imageSpec.visualConcept || r.summary,
                  lightingMood: r.imageSpec.lightingMood || 'Cerah profesional bernuansa biru langit',
                  headlineOverlay: r.imageSpec.headlineOverlay || r.title,
                  subOverlay: r.imageSpec.subOverlay || r.targetAudience,
                  palette: ['#17324D', '#0284C7', '#E6F4F9'],
                }
              : undefined,
          documentSections:
            kind === 'document' && Array.isArray(r.documentSections)
              ? r.documentSections
              : undefined,
        };

        setContentArtifacts((prev) => [newArtifact, ...prev]);
        setSelectedArtifactId(newArtifactId);
        setAiCreditsBalance((b) => Math.max(0, b - 120));

        const assistantMsg: ContentChatMessage = {
          id: `CM-A-${Date.now()}`,
          role: 'assistant',
          timestamp: new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          artifactId: newArtifactId,
          text:
            r.assistantReply ||
            `Artifact ${kind} "${newArtifact.title}" sudah siap di panel Artifact sebelah kanan dan siap dibagikan oleh tim Staff Sales & Affiliate.`,
        };
        setContentChat((prev) => [...prev, assistantMsg]);
        appendAudit(
          'Run History',
          `Generate Content (${kind}) · ${newArtifact.title}`,
          'AI Sales Content Studio',
          `Materi dibuat untuk fasilitas Support Staff Sales (${channel}).`
        );
        showToast('Artifact konten baru siap digunakan Staff Sales');
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'Terjadi kendala saat membuat konten AI.';
        setContentError(message);
      } finally {
        setIsGeneratingContent(false);
      }
    },
    [activeTenant?.name, appendAudit, showToast]
  );

  return {
    activeSection,
    isAuthenticated,
    authLoading: auth.loading,
    authError: auth.error,
    activeTenantId,
    activeTenant,
    tenantOptions,
    aiWorkers,
    selectedWorker,
    providers,
    routingRules,
    setRoutingRules,
    skills,
    tools,
    memoryLayers,
    knowledgeSources,
    workflows,
    selectedWorkflow,
    setSelectedWorkflowId,
    runs,
    approvals,
    handoffs,
    tasksGoals,
    collabMessages,
    auditLogs,
    aiCreditsBalance,
    monthlySoftLimit,
    setMonthlySoftLimit,
    monthlyHardLimit,
    setMonthlyHardLimit,
    offlinePwaMode,
    setOfflinePwaMode,
    contentArtifacts,
    selectedArtifact,
    setSelectedArtifactId,
    contentChat,
    isGeneratingContent,
    contentError,
    managerRole,
    setManagerRole,
    canManageBindings,
    humanAiBindings,
    modal,
    setModal,
    toastMessage,
    showToast,
    navigateTo,
    setIsAuthenticated,
    handleLogout,
    handleSwitchTenant,
    setSelectedWorkerId,
    setActiveTenantId,
    handleLogin,
    handleToggleWorkerStatus,
    handleCreateAIWorker,
    handleUpdateWorkerJD,
    handleCreateNewWorkerVersion,
    handleRollbackWorkerVersion,
    handleInstallSkill,
    handleAddSkill,
    handleToggleToolPermission,
    handleToggleMemoryStatus,
    handleAddKnowledgeSource,
    handleAddWorkflowNode,
    handleExecuteWorkflow,
    handleRetryRun,
    handleRunCompensation,
    handleApprovalDecision,
    handleConfirmHandoff,
    handleToggleTaskGoal,
    handleCreateTaskGoal,
    handleSendCollabMessage,
    handleTopUpCredits,
    handleCreateBinding,
    handleToggleBindingStatus,
    handleUpdateBindingAiWorker,
    handleCreateWorkflowVersion,
    handleGenerateContentArtifact,
  };
}
