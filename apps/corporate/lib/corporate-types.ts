export type CorporateSectionId =
  | 'login'
  | 'overview'
  | 'analytics'
  | 'sales-affiliate'
  | 'human-workforce'
  | 'ai-workforce'
  | 'technical-ops'
  | 'kpi-performance'
  | 'commission'
  | 'ai-credits'
  | 'contracts'
  | 'invoices'
  | 'payments'
  | 'reports'
  | 'organization'
  | 'notifications'
  | 'leaderboard'
  | 'settings';

export type CorporateRoleKey =
  | 'corporate_owner'
  | 'corporate_admin'
  | 'corporate_director_viewer'
  | 'corporate_finance_manager'
  | 'corporate_sales_manager'
  | 'corporate_operations_manager'
  | 'corporate_workforce_manager'
  | 'corporate_ai_manager'
  | 'corporate_auditor';

export interface CorporateTenant {
  id: string;
  code: string;
  name: string;
  legalName?: string;
  industry?: string;
  status: 'Aktif' | 'Onboarding';
  primaryContactEmail?: string;
  region?: string;
  contractExpiryDays?: number;
  logoInitials?: string;
}

export interface AnalyticsFilterState {
  period: string;
  provider: string;
  region: string;
  branch: string;
  department: string;
  product: string;
  channel: string;
  status: string;
}

export interface AIWorkerRecord {
  id: string;
  name: string;
  role: string;
  department: string;
  supervisor: string;
  autonomyLevel: 'L0' | 'L1' | 'L2' | 'L3' | 'L4';
  status: 'Aktif & Berjalan' | 'Menunggu Tugas' | 'Maintenance' | 'Nonaktif';
  modelPolicy: string;
  tokensUsedLabel: string;
  creditsUsed: number;
  monthlyBudgetCredits: number;
  estimatedCostIdr: number;
  tasksCompleted: number;
  slaCompliancePct: number;
  allowedTools: string[];
  jobDescription: string;
}

export interface AIRunRecord {
  id: string;
  workerName: string;
  workflowName: string;
  status: 'Completed' | 'Waiting Approval' | 'Running' | 'Failed';
  startedAt: string;
  durationSec: number;
  tokensTotal: number;
  creditsCharged: number;
  handoffTarget?: string;
}

export interface CorporateWorkOrder {
  id: string;
  type: 'Instalasi Baru' | 'Maintenance' | 'Troubleshooting';
  customerName: string;
  region: string;
  address: string;
  technicianName: string;
  status: 'Pending' | 'Proses' | 'Selesai' | 'QC Pending' | 'Perlu Perhatian SLA';
  slaRemaining: string;
  coordinates: { lat: number; lng: number };
  packageName: string;
  evidenceReady: boolean;
  opticalDbm?: string;
  speedtestMbps?: string;
}

export interface CorporateInvoice {
  id: string;
  title: string;
  periodLabel: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  status: 'Lunas' | 'Belum Bayar' | 'Sebagian';
  lineItems: Array<{ label: string; category: 'SaaS Platform' | 'Managed Services' | 'AI Credits'; amount: number }>;
}

export interface CorporatePaymentRecord {
  id: string;
  invoiceId: string;
  paidAt: string;
  method: string;
  referenceNo: string;
  amount: number;
  reconciliationStatus: 'Terekonsiliasi' | 'Menunggu Verifikasi';
}

export interface AICreditTransaction {
  id: string;
  timestamp: string;
  type: 'Top Up' | 'Pemakaian Run' | 'Reservasi Dilepas' | 'Penyesuaian';
  description: string;
  workerOrActor: string;
  creditsDelta: number;
  balanceAfter: number;
  idempotencyKey: string;
}

export interface CorporateUserMember {
  id: string;
  name: string;
  email: string;
  roleKey: CorporateRoleKey | null;
  roleLabel: string;
  department: string;
  branchScope?: string;
  organizationId?: string | null;
  organizationUnitId?: string | null;
  branchId?: string | null;
  departmentId?: string | null;
  status: 'Aktif' | 'Menunggu Aktivasi' | 'Ditangguhkan' | 'Dicabut';
  mfaEnabled: boolean | null;
  lastActive: string | null;
}

export interface CorporateAlertItem {
  id: string;
  title: string;
  description: string;
  category: 'Operasional' | 'Keuangan' | 'Kontrak';
  severity: 'danger' | 'warning' | 'info' | 'success';
  timeAgo: string;
  read: boolean;
  targetSection: CorporateSectionId;
}

export interface AuditComplianceLog {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  resource: string;
  requestId: string;
  result: 'Allowed' | 'Approval Required' | 'Blocked';
}

export interface ReportExportHistory {
  id: string;
  title: string;
  category: string;
  period: string;
  format: 'CSV' | 'PDF' | 'XLSX';
  generatedAt: string;
  generatedBy: string;
}

export interface IntegrationConnection {
  id: string;
  name: string;
  category: 'ISP Provider' | 'CRM' | 'AI Gateway' | 'Payment' | 'Messaging';
  authMethod: string;
  status: 'Terhubung' | 'Degradasi' | 'Perlu Rotasi';
  lastSync: string;
  endpointSummary: string;
}

export type HumanWorkforceRole = 'Staff Sales' | 'Affiliate' | 'Teknisi';

export interface StaffSalesPerformanceRecord {
  rank: number;
  name: string;
  grade: 'OJT' | 'Pro' | 'Elite';
  region: string;
  personalSA: number;
  affiliateSA: number;
  combinedSA: number;
  activeAffiliates: number;
  orders: number;
  activations: number;
  targetPct: number;
  tierLabel: string;
}

export interface AffiliatePartnerRecord {
  rank: number;
  name: string;
  sponsorStaffSales: string;
  region: string;
  orders: number;
  sharePct: number;
  validRate: string;
}

export interface TechnicianLeaderboardRecord {
  rank: number;
  name: string;
  specialty: string;
  region: string;
  completedWo: number;
  slaPct: string;
  firstTimeFixPct: string;
}

