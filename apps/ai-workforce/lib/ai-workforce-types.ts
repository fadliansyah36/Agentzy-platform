export type AIWorkforceSectionId =
  | 'splash'
  | 'login'
  | 'overview'
  | 'workers'
  | 'worker-detail'
  | 'worker-studio'
  | 'content-studio'
  | 'model-router'
  | 'skills-tools'
  | 'memory-rag'
  | 'tasks-collab'
  | 'human-ai-binding'
  | 'workflows'
  | 'workflow-builder'
  | 'runs'
  | 'approvals'
  | 'analytics-credits'
  | 'governance-settings';

export type AutonomyLevel = 'L0' | 'L1' | 'L2' | 'L3' | 'L4';

export type WorkerLifecycleState =
  | 'Draft'
  | 'Configured'
  | 'Policy Review'
  | 'Approved'
  | 'Aktif'
  | 'Paused'
  | 'Retired';

export interface AIWMTenant {
  id: string;
  code: string;
  name: string;
  environment: 'Production' | 'Staging';
  industry: string;
  region: string;
}

export interface AIWorkerVersionItem {
  version: string;
  status: WorkerLifecycleState;
  date: string;
  notes: string;
}

export interface AIWorkerEntity {
  id: string;
  name: string;
  subtitle: string;
  department: string;
  role: string;
  supervisor: string;
  jobType: 'Collaborative (Human + AI)' | 'Supervised Autonomous';
  riskClass: string;
  autonomyLevel: AutonomyLevel;
  status: WorkerLifecycleState;
  version: string;
  description: string;
  mission: string;
  objectives: string[];
  scopeIn: string[];
  scopeOut: string[];
  inputContract: string[];
  outputContract: string[];
  kpis: Array<{
    label: string;
    target: string;
    actual: string;
    unit: string;
    status: 'Tercapai' | 'Perlu Pantau';
  }>;
  modelPolicy: {
    primaryProvider: string;
    primaryModel: string;
    fallbackModel: string;
    latencyTargetSec: number;
  };
  skills: string[];
  tools: string[];
  memoryScopes: string[];
  creditsUsed: number;
  creditsBudget: number;
  successRatePct: number;
  qualityScore: number;
  slaCompliancePct: number;
  avgLatencySec: number;
  costPerTaskIdr: number;
  versions: AIWorkerVersionItem[];
}

export interface ModelProviderItem {
  id: string;
  provider: string;
  modelName: string;
  status: 'Aktif' | 'Standby';
  latencyMs: number;
  costTier: 'Hemat' | 'Seimbang' | 'Premium';
  useCase: string;
  allowlisted: boolean;
}

export interface ModelRoutingRule {
  id: string;
  taskClass: string;
  targetModel: string;
  fallbackModel: string;
  maxCostPerRunIdr: number;
  maxLatencySec: number;
}

export interface SkillPackageItem {
  id: string;
  name: string;
  version: string;
  publisher: string;
  status: 'Terpasang' | 'Tersedia';
  risk: 'Rendah' | 'Menengah' | 'Tinggi';
  description: string;
  requiredTools: string[];
}

export interface ToolIntegrationItem {
  id: string;
  name: string;
  category: string;
  scopeSummary: string;
  permissionStatus: 'Disetujui' | 'Review' | 'Dibatasi';
  approvalRequired: boolean;
  lastUsed: string;
}

export interface MemoryLayerItem {
  id: string;
  name: string;
  description: string;
  status: 'Aktif' | 'Terbatas' | 'Nonaktif';
  retentionPolicy: string;
  consentRequired: boolean;
  recordsCount: number;
}

export interface KnowledgeSourceItem {
  id: string;
  title: string;
  category: string;
  documentsCount: number;
  chunksCount: number;
  syncStatus: 'Sinkron' | 'Proses' | 'Perlu Review';
  lastUpdated: string;
}

export interface WorkflowNodeItem {
  id: string;
  type:
    | 'Trigger'
    | 'Condition'
    | 'AI Task'
    | 'Human Task'
    | 'Parallel'
    | 'Wait / Timer'
    | 'Integration'
    | 'Compensation';
  title: string;
  subtitle: string;
  actor: string;
  branch?: 'main' | 'yes' | 'no';
}

export interface WorkflowVersionItem {
  version: string;
  stage: 'Aktif (Production)' | 'Staging' | 'Draft' | 'Archived';
  publishedAt: string;
  changes: string[];
}

export interface WorkflowDefinitionItem {
  id: string;
  name: string;
  category: 'Workflow' | 'Template' | 'Library';
  version: string;
  status: 'Aktif' | 'Draft' | 'Staging';
  description: string;
  slaTargetLabel: string;
  nodes: WorkflowNodeItem[];
  versions: WorkflowVersionItem[];
}

export interface WorkflowRunStepLog {
  id: string;
  label: string;
  timeLabel: string;
  durationLabel: string;
  status: 'completed' | 'running' | 'waiting' | 'failed';
  detail: string;
}

export interface WorkflowRunItem {
  id: string;
  runType: 'Workflow Run' | 'AI Run';
  title: string;
  workerOrWorkflowName: string;
  startedAt: string;
  durationLabel: string;
  progressPct: number;
  status:
    | 'Running'
    | 'Menunggu Approval'
    | 'Selesai'
    | 'Gagal'
    | 'Retry';
  errorMessage?: string;
  dlqFlag?: boolean;
  steps: WorkflowRunStepLog[];
  outputSummary: string;
}

export interface ApprovalInboxItem {
  id: string;
  title: string;
  requester: string;
  category: 'Eksekusi AI' | 'Budget' | 'Akses Eksternal' | 'Workflow Handoff';
  runId: string;
  submittedLabel: string;
  riskSummary: string;
  contextDetail: string;
  status: 'Menunggu' | 'Disetujui' | 'Ditolak';
}

export interface HandoffAssignmentItem {
  id: string;
  runId: string;
  fromWorker: string;
  taskTitle: string;
  leadName: string;
  qualificationScore: string;
  aiRecommendation: string;
  assignedTo: string;
  areaLabel: string;
  includeHistory: boolean;
  status: 'Menunggu Penugasan' | 'Terkirim ke Staff Sales';
}

export interface AIWMTaskGoalItem {
  id: string;
  kind: 'Tugas' | 'Goal' | 'Backlog';
  title: string;
  ownerLabel: string;
  priority: 'Prioritas Tinggi' | 'Normal';
  dueLabel: string;
  progressPct: number;
  completed: boolean;
}

export interface CollaborationMessageItem {
  id: string;
  senderName: string;
  senderRole: 'AI Worker' | 'Supervisor' | 'Staff Sales';
  time: string;
  text: string;
  handoffApproved?: boolean;
}

export interface AuditIncidentItem {
  id: string;
  kind: 'Audit Log' | 'Insiden' | 'Run History';
  title: string;
  actor: string;
  timestamp: string;
  severity: 'Info' | 'Minor' | 'Perhatian';
  detail: string;
}

export type ContentArtifactKind = 'video' | 'design' | 'image' | 'document';

export interface ContentArtifactItem {
  id: string;
  kind: ContentArtifactKind;
  title: string;
  targetAudience: string;
  channel: string;
  createdAt: string;
  promptUsed: string;
  summary: string;
  captionOrCopy: string;
  hashtags: string[];
  // Structured fields per kind
  videoScenes?: Array<{
    timeRange: string;
    visual: string;
    voiceover: string;
    overlayText: string;
  }>;
  designConfig?: {
    headline: string;
    subheadline: string;
    offerBadge: string;
    ctaText: string;
    accentColor: string;
    bullets: string[];
  };
  imageSpec?: {
    aspectRatio: '1:1' | '9:16' | '16:9';
    visualConcept: string;
    lightingMood: string;
    headlineOverlay: string;
    subOverlay: string;
    palette: [string, string, string];
  };
  documentSections?: Array<{
    heading: string;
    body: string;
  }>;
}

export interface ContentChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  artifactId?: string;
}
