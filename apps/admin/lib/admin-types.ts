export type AdminSectionId =
  | 'login'
  | 'overview'
  | 'tenants'
  | 'onboarding'
  | 'master-data'
  | 'subscriptions'
  | 'organization'
  | 'rbac'
  | 'human-workforce'
  | 'ai-workers'
  | 'ai-worker-detail'
  | 'llm-providers'
  | 'model-registry'
  | 'model-router'
  | 'skills'
  | 'tools'
  | 'memory-governance'
  | 'knowledge-rag'
  | 'workflows'
  | 'ai-credits'
  | 'billing'
  | 'finance'
  | 'contracts'
  | 'commission-schemes'
  | 'integrations'
  | 'security'
  | 'audit-logs'
  | 'data-governance'
  | 'global-analytics';

export type SuperAdminRoleKey =
  | 'platform_super_admin'
  | 'platform_security_admin'
  | 'platform_finance_admin'
  | 'platform_operations_admin';

export interface AdminTenantRecord {
  id: string;
  code: string;
  name: string;
  legalName: string;
  domain: string;
  industry: string;
  clientType: 'ISP / Provider' | 'Corporate Enterprise' | 'Multi-Cabang';
  cooperationModel: 'Kontrak Managed End-to-End' | 'Kontrak Field & Sales' | 'Kontrak Pilot Kemitraan';
  cooperationLabel: string;
  contractNumber: string;
  status: 'Aktif' | 'Trial' | 'Suspended';
  region: string;
  humanCount: number;
  aiWorkerCount: number;
  creditsBalance: number;
  monthlyCreditsUsed: number;
  slaScore: number;
  createdAt: string;
}

export interface AdminIspProviderRecord {
  id: string;
  name: string;
  code: string;
  productLines: string[];
  integrationMode: 'REST API + Webhook' | 'Partner Portal' | 'Secure File Exchange';
  coverageSource: string;
  slaTargetHours: number;
  status: 'Terhubung' | 'Pending Review' | 'Nonaktif';
}

export interface MasterIndustryItem {
  id: string;
  name: string;
  code: string;
  description: string;
  serviceCount: number;
  productCount: number;
  status: 'Aktif' | 'Draft';
}

export interface MasterServiceItem {
  id: string;
  name: string;
  category: 'Human Workforce' | 'AI Workforce';
  industryCode: string;
  scope: string;
  slaStandard: string;
  status: 'Aktif' | 'Nonaktif';
}

export interface MasterProductItem {
  id: string;
  name: string;
  code: string;
  industryCode: string;
  providerName: string;
  unitMeasure: string;
  baseTariffIdr: number;
  status: 'Aktif' | 'Draft';
}

export interface CooperationPolicyRecord {
  id: string;
  key: 'managed_e2e' | 'field_sales' | 'pilot_kemitraan' | string;
  name: string;
  contractScopeNote: string;
  includedAiCreditsMonthly: number;
  maxUsers: string;
  maxAiWorkers: string;
  maxWorkflows: string;
  storageLimit: string;
  apiRateLimit: string;
  slaGuarantee: string;
  status: 'Aktif' | 'Arsip';
  entitlements: {
    aiGateway: boolean;
    modelRouter: boolean;
    memoryRag: boolean;
    customWorkflow: boolean;
    breakGlassAudit: boolean;
    dedicatedSso: boolean;
  };
}

export interface OrgUnitRecord {
  id: string;
  tenantId: string;
  name: string;
  unitType: 'Cabang / Regional' | 'Departemen';
  parentName: string;
  headName: string;
  memberCount: number;
  status: 'Aktif' | 'Nonaktif';
}

export interface PlatformUserRecord {
  id: string;
  tenantId: string;
  tenantName: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  department: string;
  mfaEnabled: boolean;
  status: 'Aktif' | 'Suspended' | 'Pending';
  lastLogin: string;
}

export interface RbacRoleRecord {
  id: string;
  key: string;
  name: string;
  scopeType: 'Platform' | 'Tenant';
  description: string;
  userCount: number;
  isSystemRole: boolean;
  permissions: Record<string, 'F' | 'C/U' | 'A' | 'R' | 'S' | '---'>;
}

export interface HumanStaffRecord {
  id: string;
  workerCode: string;
  name: string;
  tenantId: string;
  tenantName: string;
  placedCorporateSchemaId?: string;
  position: 'Teknisi' | 'Sales' | 'Supervisor' | 'Customer Care' | 'Affiliate';
  grade: 'OJT' | 'Pro' | 'Elite' | 'Senior' | 'Staff';
  region: string;
  verificationStatus: 'Terverifikasi' | 'Menunggu Verifikasi' | 'Ditolak';
  lifecycleStatus: 'Aktif' | 'Pending' | 'Nonaktif';
  assignmentLoad: number;
  slaScore: number;
}

export interface AdminAIWorkerRecord {
  id: string;
  workerKey: string;
  name: string;
  tenantId: string;
  tenantName: string;
  version: string;
  roleDescription: string;
  modelName: string;
  skills: string[];
  tools: string[];
  memoryMode: string;
  slaTarget: string;
  autonomyLevel: 'L0 Advisory' | 'L1 Drafting' | 'L2 Bounded' | 'L3 Approval' | 'L4 Allowlisted';
  lifecycleStatus: 'Draft' | 'Configured' | 'Policy Review' | 'Aktif' | 'Paused' | 'Retired';
  monthlyCreditsUsed: number;
  successRatePct: number;
}

export interface LLMProviderRecord {
  id: string;
  name: string;
  vendor: string;
  status: 'Terhubung' | 'Nonaktif';
  region: string;
  secretRef: string;
  rateLimitRpm: number;
  avgLatencyMs: number;
  modelsCount: number;
}

export interface ModelRegistryRecord {
  id: string;
  modelKey: string;
  name: string;
  providerId: string;
  providerName: string;
  capability: 'Inference' | 'Reasoning' | 'Multimodal' | 'Embedding';
  contextWindow: string;
  costPer1kIdr: number;
  residency: string;
  tenantAllowlist: string;
  status: 'Aktif' | 'Nonaktif';
}

export interface ModelRoutingRuleRecord {
  id: string;
  taskCategory: string;
  targetModelKey: string;
  targetModelName: string;
  fallbackModelName: string;
  sensitivityLevel: 'Internal' | 'Confidential' | 'Restricted';
  priority: number;
  maxLatencyMs: number;
  active: boolean;
}

export interface SkillRegistryRecord {
  id: string;
  name: string;
  version: string;
  licenseType: 'Open Source' | 'MIT' | 'Proprietary' | 'Apache-2.0';
  provenance: string;
  riskLevel: 'Rendah' | 'Sedang' | 'Tinggi';
  approvalStatus: 'Disetujui' | 'Menunggu' | 'Ditolak';
  toolDependencies: string[];
}

export interface ToolRegistryRecord {
  id: string;
  name: string;
  environment: 'Prod' | 'Sandbox';
  riskLevel: 'Rendah' | 'Sedang' | 'Tinggi';
  requiresApproval: boolean;
  timeoutSec: number;
  rateLimitPerMin: number;
  allowedRoles: string[];
  status: 'Aktif' | 'Terbatas';
}

export interface MemoryGovernancePolicy {
  tenantScopeMode: 'Tenant Scoped (Per Tenant)' | 'Worker Scoped' | 'Strict User Consent';
  retentionDays: 30 | 90 | 180 | 365;
  userConsentRequired: boolean;
  autoDeleteRetention: boolean;
  dsrDeletionEnabled: boolean;
  complianceStandard: string;
}

export interface MemoryLayerRecord {
  id: string;
  layerName: string;
  recordsCount: number;
  sensitivity: 'Internal' | 'Confidential' | 'Restricted';
  retentionDays: number;
  consentEnforced: boolean;
  status: 'Aktif' | 'Audit';
}

export interface KnowledgeSourceRecord {
  id: string;
  name: string;
  tenantName: string;
  documentCount: number;
  chunkCount: number;
  indexedPct: number;
  classification: 'Internal' | 'Confidential';
  lastIndexedAt: string;
  status: 'Terindeks' | 'Proses' | 'Perlu Sync';
}

export interface AdminWorkflowRecord {
  id: string;
  name: string;
  version: string;
  triggerType: string;
  nodesCount: number;
  humanHandoffRequired: boolean;
  status: 'Aktif' | 'Draft' | 'Paused';
  runsThisMonth: number;
}

export interface AdminWorkflowRunRecord {
  id: string;
  workflowName: string;
  tenantName: string;
  status: 'Berjalan' | 'Menunggu Approval' | 'Selesai' | 'Gagal';
  currentStep: string;
  startedAt: string;
  traceId: string;
}

export interface AdminWorkflowApprovalRecord {
  id: string;
  workflowName: string;
  tenantName: string;
  requestedBy: string;
  actionSummary: string;
  riskLevel: 'Sedang' | 'Tinggi';
  requestedAt: string;
  status: 'Menunggu' | 'Disetujui' | 'Ditolak';
}

export interface CreditPricingRuleRecord {
  id: string;
  modelKey: string;
  providerName: string;
  creditsPer1kInput: number;
  creditsPer1kOutput: number;
  idrPerCredit: number;
  effectiveFrom: string;
  status: 'Aktif' | 'Draft';
}

export interface AdminCreditLedgerItem {
  id: string;
  tenantName: string;
  type: 'Top Up' | 'Settlement' | 'Adjustment' | 'Reserve';
  creditsDelta: number;
  balanceAfter: number;
  reference: string;
  timestamp: string;
}

export interface CreditTopUpPackageRecord {
  id: string;
  code: string;
  name: string;
  creditsAmount: number;
  bonusCredits: number;
  priceIdr: number;
  validityNote: string;
  recommendedFor: string;
  status: 'Tersedia' | 'Arsip';
}

export interface PlatformInvoiceRecord {
  id: string;
  invoiceNumber: string;
  tenantName: string;
  category: 'Kontrak Kerjasama' | 'Managed Services' | 'AI Credits' | 'Payroll & Komisi';
  amountIdr: number;
  dueDate: string;
  status: 'Lunas' | 'Menunggu Bayar' | 'Jatuh Tempo';
}

export interface FinanceReconciliationItem {
  id: string;
  referenceNo: string;
  tenantName: string;
  channel: string;
  grossAmountIdr: number;
  netSettledIdr: number;
  settledAt: string;
  status: 'Terekonsiliasi' | 'Perlu Verifikasi' | 'Selisih';
}

export interface ContractDocumentRecord {
  id: string;
  docNumber: string;
  docType: 'Kontrak' | 'SOW' | 'SLA';
  tenantName: string;
  title: string;
  effectiveRange: string;
  slaCommitment: string;
  status: 'Aktif' | 'Menunggu TTD' | 'Akan Berakhir';
}

export interface CommissionSchemeRecord {
  id: string;
  name: string;
  version: string;
  providerName: string;
  productScope: string;
  splitRule: string;
  tierBasis: string;
  status: 'Aktif' | 'Draft' | 'Arsip';
  approvedBy: string;
}

export interface IntegrationConnectorRecord {
  id: string;
  name: string;
  category: 'CRM' | 'Workspace' | 'Maps / Logistik' | 'Payment' | 'ISP Core';
  authMethod: string;
  endpointUrl: string;
  healthStatus: 'Terhubung' | 'Degraded' | 'Terputus';
  lastSyncAt: string;
  webhookSuccessPct: number;
}

export interface WebhookLogRecord {
  id: string;
  connectorName: string;
  eventType: string;
  httpStatus: number;
  latencyMs: number;
  timestamp: string;
  idempotencyKey: string;
}

export interface BreakGlassRequestRecord {
  id: string;
  actorEmail: string;
  targetTenant: string;
  reason: string;
  durationMinutes: number;
  approver1: string;
  approver2: string;
  status: 'Menunggu Approval' | 'Aktif' | 'Selesai' | 'Ditolak';
  requestedAt: string;
}

export interface FeatureFlagRecord {
  id: string;
  flagKey: string;
  label: string;
  scope: 'Global' | 'Enterprise Only' | 'Beta Tenant';
  enabled: boolean;
  updatedBy: string;
}

export interface AuditLogRecord {
  id: string;
  action: string;
  actorEmail: string;
  targetResource: string;
  tenantScope: string;
  timestamp: string;
  result: 'Sukses' | 'Disetujui' | 'Ditolak';
  diffSummary: string;
}

export interface IncidentRecord {
  id: string;
  title: string;
  severity: 'Kritis' | 'Tinggi' | 'Sedang' | 'Rendah';
  domain: 'Security' | 'AI Runtime' | 'Integration' | 'Finance';
  reportedAt: string;
  owner: string;
  status: 'Investigasi' | 'Mitigasi' | 'Terselesaikan';
}

export interface DsrRequestRecord {
  id: string;
  requesterName: string;
  tenantName: string;
  requestType: 'Akses Data' | 'Penghapusan' | 'Koreksi Data';
  submittedAt: string;
  slaDue: string;
  status: 'Diproses' | 'Menunggu Verifikasi' | 'Selesai';
}

export interface VendorSubprocessorRecord {
  id: string;
  name: string;
  category: string;
  dataRegion: string;
  dpaStatus: 'Signed & Valid' | 'Review Tahunan';
  riskClass: 'Rendah' | 'Sedang';
}
