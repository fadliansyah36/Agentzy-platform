'use client';

import React, { useState } from 'react';
import type { AgentzyOrganization, AgentzyPermissionDefinition } from '@/apps/web/lib/api-client';
import {
  X,
  Plus,
  Building2,
  Server,
  Bot,
  Puzzle,
  Coins,
  Lock,
  ShieldCheck,
  AlertTriangle,
  FileClock,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type {
  BonusPeriodType,
  CorporateCompensationSchema,
  SalesTierBracket,
  TechnicianBonusRule,
  TechnicianTaskCategory,
} from '@/lib/corporate-compensation';
import type { AdminModalState } from '../../hooks/useAdminPortal';
import { formatIDR, formatNumberID } from '../../lib/admin-data';
import type {
  AdminAIWorkerRecord,
  AdminIspProviderRecord,
  AdminSectionId,
  AdminTenantRecord,
  AdminWorkflowRecord,
  AuditLogRecord,
  CommissionSchemeRecord,
  ContractDocumentRecord,
  CooperationPolicyRecord,
  CreditPricingRuleRecord,
  HumanStaffRecord,
  IncidentRecord,
  IntegrationConnectorRecord,
  KnowledgeSourceRecord,
  LLMProviderRecord,
  MasterIndustryItem,
  MasterProductItem,
  MasterServiceItem,
  ModelRegistryRecord,
  ModelRoutingRuleRecord,
  OrgUnitRecord,
  PlatformInvoiceRecord,
  PlatformUserRecord,
  RbacRoleRecord,
  SkillRegistryRecord,
  ToolRegistryRecord,
  VendorSubprocessorRecord,
} from '../../lib/admin-types';

function ModalFrame({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.14 }}
        onClick={onClose}
        className="fixed inset-0 bg-[#172B3A]/60 backdrop-blur-xs"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 20 }}
        transition={{ duration: 0.18 }}
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[20px] border border-[#D8E3E9] bg-white shadow-2xl sm:rounded-[18px]"
      >
        <div className="border-b border-[#EAF2F6] bg-[#F5F8FA] px-4 pb-3.5 pt-2.5 sm:px-5 sm:py-4">
          <div className="mx-auto mb-2.5 h-1 w-10 rounded-full bg-[#B8C9D3] sm:hidden" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-[#17324D]">{title}</h2>
              {subtitle && <p className="mt-0.5 text-xs text-[#526675]">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-[#D8E3E9] bg-white text-[#526675] hover:text-[#17324D] sm:h-9 sm:w-9"
              aria-label="Tutup modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto p-4 pb-6 sm:p-5">{children}</div>
      </motion.div>
    </div>
  );
}

const inputCls =
  'h-11 sm:h-10 w-full rounded-[10px] border border-[#D8E3E9] bg-white px-3 text-xs text-[#172B3A] outline-none focus:border-[#0284C7]';
const labelCls = 'mb-1 block text-xs font-semibold text-[#172B3A]';

function ModalActions({
  onClose,
  submitLabel = 'Simpan Perubahan',
  danger,
}: {
  onClose: () => void;
  submitLabel?: string;
  danger?: boolean;
}) {
  return (
    <div className="mt-5 flex flex-col-reverse gap-2 border-t border-[#EAF2F6] pt-4 sm:flex-row sm:items-center sm:justify-end">
      <button
        type="button"
        onClick={onClose}
        className="h-11 rounded-[10px] border border-[#D8E3E9] bg-white px-4 text-xs font-semibold text-[#526675] hover:bg-[#F5F8FA] sm:h-10"
      >
        Batal
      </button>
      <button
        type="submit"
        className={`h-11 rounded-[10px] px-4 text-xs font-semibold text-white sm:h-10 ${
          danger
            ? 'bg-[#B23A48] hover:bg-[#932E3A]'
            : 'bg-[#0284C7] hover:bg-[#0369A1]'
        }`}
      >
        {submitLabel}
      </button>
    </div>
  );
}

export interface AdminModalsProps {
  modal: AdminModalState;
  onClose: () => void;
  onNavigate: (section: AdminSectionId) => void;
  onSetModal: (next: AdminModalState) => void;

  tenants: AdminTenantRecord[];
  organizationsByTenant: Record<string, AgentzyOrganization[]>;
  roles: RbacRoleRecord[];
  permissionRegistry: AgentzyPermissionDefinition[];
  corporateSchemas: CorporateCompensationSchema[];
  invoices: PlatformInvoiceRecord[];
  auditLogs: AuditLogRecord[];
  ipAllowlistEnabled: boolean | null;
  sessionTtlMinutes: number | null;

  onUpsertTenant: (p: Omit<AdminTenantRecord, 'id' | 'createdAt'> & { id?: string }) => void;
  onUpsertProvider: (p: Omit<AdminIspProviderRecord, 'id'> & { id?: string }) => void;
  onUpsertIndustry: (p: Omit<MasterIndustryItem, 'id'> & { id?: string }) => void;
  onUpsertService: (p: Omit<MasterServiceItem, 'id'> & { id?: string }) => void;
  onUpsertProduct: (p: Omit<MasterProductItem, 'id'> & { id?: string }) => void;
  onUpsertCooperationPolicy: (
    p: Omit<CooperationPolicyRecord, 'id'> & { id?: string }
  ) => void;
  onUpsertOrgUnit: (p: Omit<OrgUnitRecord, 'id'> & { id?: string }) => void;
  onUpsertUser: (p: Omit<PlatformUserRecord, 'id' | 'lastLogin'> & { id?: string }) => void;
  onUpsertRole: (
    p: Omit<RbacRoleRecord, 'id' | 'userCount' | 'isSystemRole'> & { id?: string }
  ) => void;
  onUpsertStaff: (p: Omit<HumanStaffRecord, 'id'> & { id?: string }) => void;
  onUpsertAiWorker: (p: Omit<AdminAIWorkerRecord, 'id'> & { id?: string }) => void;
  onUpsertLlmProvider: (p: Omit<LLMProviderRecord, 'id'> & { id?: string }) => void;
  onUpsertModel: (p: Omit<ModelRegistryRecord, 'id'> & { id?: string }) => void;
  onUpsertRoutingRule: (p: Omit<ModelRoutingRuleRecord, 'id'> & { id?: string }) => void;
  onUpsertSkill: (p: Omit<SkillRegistryRecord, 'id'> & { id?: string }) => void;
  onUpsertTool: (p: Omit<ToolRegistryRecord, 'id'> & { id?: string }) => void;
  onUpsertKnowledge: (
    p: Omit<KnowledgeSourceRecord, 'id' | 'lastIndexedAt'> & { id?: string }
  ) => void;
  onUpsertWorkflow: (
    p: Omit<AdminWorkflowRecord, 'id' | 'runsThisMonth'> & { id?: string }
  ) => void;
  onTopUpCredits: (tenantName: string, amount: number, ref: string) => void;
  onUpsertCreditPricing: (p: Omit<CreditPricingRuleRecord, 'id'> & { id?: string }) => void;
  onIssueInvoice: (p: Omit<PlatformInvoiceRecord, 'id' | 'invoiceNumber'>) => void;
  onMarkInvoicePaid: (invoiceId: string) => void;
  onUpsertContract: (p: Omit<ContractDocumentRecord, 'id'> & { id?: string }) => void;
  onUpsertCommissionScheme: (p: Omit<CommissionSchemeRecord, 'id'> & { id?: string }) => void;
  onUpsertCorpSchema: (
    p: Omit<CorporateCompensationSchema, 'id'> & { id?: string }
  ) => void;
  onUpsertTechBonusRule: (p: Omit<TechnicianBonusRule, 'id'> & { id?: string }) => void;
  onUpsertIntegration: (
    p: Omit<IntegrationConnectorRecord, 'id' | 'lastSyncAt'> & { id?: string }
  ) => void;
  onCreateBreakGlass: (p: {
    tenantIds: string[];
    permissionKeys: string[];
    reason: string;
    durationMinutes: number;
  }) => void;
  onUpdateSecurityPolicy: (ipAllow: boolean, ttlMinutes: number) => void;
  onCreateIncident: (p: Omit<IncidentRecord, 'id' | 'reportedAt'>) => void;
  onUpsertVendor: (p: Omit<VendorSubprocessorRecord, 'id'> & { id?: string }) => void;
}

export function AdminModals(props: AdminModalsProps) {
  const { modal, onClose } = props;

  return (
    <AnimatePresence>
      {modal.type !== 'none' && <AdminModalSwitch {...props} key={JSON.stringify(modal)} />}
    </AnimatePresence>
  );
}

function AdminModalSwitch(props: AdminModalsProps) {
  const { modal, onClose, onNavigate, onSetModal } = props;

  if (modal.type === 'quick-action') {
    const quickItems = [
      {
        title: 'Tambah Tenant Korporat',
        desc: 'Buat tenant terisolasi baru dengan kuota awal',
        icon: Building2,
        action: () => onSetModal({ type: 'tenant-crud' }),
      },
      {
        title: 'Onboarding Korporat 3-Step',
        desc: 'Buka wizard onboarding & provider ISP',
        icon: Plus,
        action: () => onNavigate('onboarding'),
      },
      {
        title: 'Daftarkan LLM Provider / Model',
        desc: 'Tambah OpenAI, Anthropic, Google, atau VPC',
        icon: Server,
        action: () => onSetModal({ type: 'llm-provider-crud' }),
      },
      {
        title: 'Buat AI Worker Baru',
        desc: 'Konfigurasi persona, model router, dan guardrail',
        icon: Bot,
        action: () => onSetModal({ type: 'ai-worker-crud' }),
      },
      {
        title: 'Tambah Skill Registry',
        desc: 'Daftarkan skill beserta lisensi & approval risiko',
        icon: Puzzle,
        action: () => onSetModal({ type: 'skill-crud' }),
      },
      {
        title: 'Top Up AI Credits Tenant',
        desc: 'Catat penambahan saldo ke ledger immutable',
        icon: Coins,
        action: () => onSetModal({ type: 'credit-topup' }),
      },
      {
        title: 'Ajukan Break-Glass Access',
        desc: 'Akses darurat time-bound dengan persetujuan 2 tahap',
        icon: Lock,
        action: () => onSetModal({ type: 'break-glass-request' }),
      },
    ];

    return (
      <ModalFrame
        title="Aksi Cepat Super Admin Control Plane"
        subtitle="Pilih operasi CRUD atau tata kelola platform yang ingin dijalankan segera."
        onClose={onClose}
      >
        <div className="space-y-2">
          {quickItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                type="button"
                onClick={item.action}
                className="flex w-full items-center gap-3 rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-3 text-left transition hover:border-[#0284C7] hover:bg-[#E6F4F9]/40"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white text-[#0284C7] border border-[#D8E3E9]">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#17324D]">{item.title}</p>
                  <p className="text-[11px] text-[#526675]">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </ModalFrame>
    );
  }

  if (modal.type === 'tenant-detail') {
    const t = props.tenants.find((x) => x.id === modal.tenantId);
    if (!t) return null;
    return (
      <ModalFrame
        title={`Detail Tenant: ${t.name}`}
        subtitle={`${t.legalName} · ${t.code}`}
        onClose={onClose}
      >
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3 rounded-[12px] bg-[#F5F8FA] p-4">
            <div>
              <span className="text-[#718391]">Domain Terisolasi</span>
              <p className="font-mono-tabular font-bold text-[#17324D]">{t.domain}</p>
            </div>
            <div>
              <span className="text-[#718391]">Industri &amp; Tipe</span>
              <p className="font-semibold text-[#17324D]">
                {t.industry} · {t.clientType}
              </p>
            </div>
            <div>
              <span className="text-[#718391]">Kontrak Kerjasama &amp; Status</span>
              <p className="font-semibold text-[#0284C7]">
                {t.contractNumber} · {t.cooperationLabel} ({t.status})
              </p>
            </div>
            <div>
              <span className="text-[#718391]">Wilayah Operasional</span>
              <p className="font-semibold text-[#17324D]">{t.region}</p>
            </div>
            <div>
              <span className="text-[#718391]">Workforce Aktif</span>
              <p className="font-mono-tabular font-bold text-[#17324D]">
                {formatNumberID(t.humanCount)} Human · {formatNumberID(t.aiWorkerCount)} AI
              </p>
            </div>
            <div>
              <span className="text-[#718391]">Saldo AI Credits</span>
              <p className="font-mono-tabular font-bold text-[#247A55]">
                {formatNumberID(t.creditsBalance)} credits
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => onSetModal({ type: 'tenant-crud', tenant: t })}
              className="h-9 rounded-[10px] bg-[#0284C7] px-4 text-xs font-semibold text-white"
            >
              Edit Tenant
            </button>
          </div>
        </div>
      </ModalFrame>
    );
  }

  if (modal.type === 'tenant-crud') {
    return (
      <TenantCrudModal
        initial={modal.tenant}
        onClose={onClose}
        onSubmit={props.onUpsertTenant}
      />
    );
  }

  if (modal.type === 'provider-crud') {
    return (
      <ProviderCrudModal
        initial={modal.provider}
        onClose={onClose}
        onSubmit={props.onUpsertProvider}
      />
    );
  }

  if (modal.type === 'industry-crud') {
    return (
      <IndustryCrudModal
        initial={modal.industry}
        onClose={onClose}
        onSubmit={props.onUpsertIndustry}
      />
    );
  }

  if (modal.type === 'service-crud') {
    return (
      <ServiceCrudModal
        initial={modal.service}
        onClose={onClose}
        onSubmit={props.onUpsertService}
      />
    );
  }

  if (modal.type === 'product-crud') {
    return (
      <ProductCrudModal
        initial={modal.product}
        onClose={onClose}
        onSubmit={props.onUpsertProduct}
      />
    );
  }

  if (modal.type === 'cooperation-policy-crud') {
    return (
      <CooperationPolicyCrudModal
        initial={modal.policy}
        onClose={onClose}
        onSubmit={props.onUpsertCooperationPolicy}
      />
    );
  }

  if (modal.type === 'org-unit-crud') {
    return (
      <OrgUnitCrudModal
        initial={modal.unit}
        tenants={props.tenants}
        organizationsByTenant={props.organizationsByTenant}
        onClose={onClose}
        onSubmit={props.onUpsertOrgUnit}
      />
    );
  }

  if (modal.type === 'user-crud') {
    return (
      <UserCrudModal
        initial={modal.user}
        tenants={props.tenants}
        roles={props.roles}
        onClose={onClose}
        onSubmit={props.onUpsertUser}
      />
    );
  }

  if (modal.type === 'role-crud') {
    return (
      <RoleCrudModal
        initial={modal.role}
        onClose={onClose}
        onSubmit={props.onUpsertRole}
      />
    );
  }

  if (modal.type === 'staff-crud') {
    return (
      <StaffCrudModal
        initial={modal.staff}
        tenants={props.tenants}
        onClose={onClose}
        onSubmit={props.onUpsertStaff}
      />
    );
  }

  if (modal.type === 'ai-worker-crud') {
    return (
      <AiWorkerCrudModal
        initial={modal.worker}
        tenants={props.tenants}
        onClose={onClose}
        onSubmit={props.onUpsertAiWorker}
      />
    );
  }

  if (modal.type === 'llm-provider-crud') {
    return (
      <LlmProviderCrudModal
        initial={modal.provider}
        onClose={onClose}
        onSubmit={props.onUpsertLlmProvider}
      />
    );
  }

  if (modal.type === 'model-crud') {
    return (
      <ModelCrudModal
        initial={modal.model}
        onClose={onClose}
        onSubmit={props.onUpsertModel}
      />
    );
  }

  if (modal.type === 'routing-rule-crud') {
    return (
      <RoutingRuleCrudModal
        initial={modal.rule}
        onClose={onClose}
        onSubmit={props.onUpsertRoutingRule}
      />
    );
  }

  if (modal.type === 'skill-crud') {
    return (
      <SkillCrudModal
        initial={modal.skill}
        onClose={onClose}
        onSubmit={props.onUpsertSkill}
      />
    );
  }

  if (modal.type === 'tool-crud') {
    return (
      <ToolCrudModal
        initial={modal.tool}
        onClose={onClose}
        onSubmit={props.onUpsertTool}
      />
    );
  }

  if (modal.type === 'knowledge-crud') {
    return (
      <KnowledgeCrudModal
        initial={modal.source}
        onClose={onClose}
        onSubmit={props.onUpsertKnowledge}
      />
    );
  }

  if (modal.type === 'workflow-crud') {
    return (
      <WorkflowCrudModal
        initial={modal.workflow}
        onClose={onClose}
        onSubmit={props.onUpsertWorkflow}
      />
    );
  }

  if (modal.type === 'credit-topup') {
    return (
      <CreditTopupModal
        tenants={props.tenants}
        presetTenantName={modal.presetTenantName}
        presetCredits={modal.presetCredits}
        onClose={onClose}
        onSubmit={props.onTopUpCredits}
      />
    );
  }

  if (modal.type === 'credit-pricing-crud') {
    return (
      <CreditPricingCrudModal
        initial={modal.rule}
        onClose={onClose}
        onSubmit={props.onUpsertCreditPricing}
      />
    );
  }

  if (modal.type === 'corp-comp-crud') {
    return (
      <CorporateCompensationCrudModal
        initial={modal.schema}
        tenants={props.tenants}
        onClose={onClose}
        onSubmit={props.onUpsertCorpSchema}
      />
    );
  }

  if (modal.type === 'tech-bonus-crud') {
    return (
      <TechBonusRuleCrudModal
        initial={modal.rule}
        corporateSchemas={props.corporateSchemas}
        onClose={onClose}
        onSubmit={props.onUpsertTechBonusRule}
      />
    );
  }

  if (modal.type === 'invoice-crud') {
    return (
      <InvoiceCrudModal
        tenants={props.tenants}
        onClose={onClose}
        onSubmit={props.onIssueInvoice}
      />
    );
  }

  if (modal.type === 'invoice-detail') {
    const inv = props.invoices.find((i) => i.id === modal.invoiceId);
    if (!inv) return null;
    return (
      <ModalFrame
        title={`Detail Invoice: ${inv.invoiceNumber}`}
        subtitle={`${inv.tenantName} · Kategori ${inv.category}`}
        onClose={onClose}
      >
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-1 gap-3 rounded-[12px] bg-[#F5F8FA] p-4 sm:grid-cols-2">
            <div>
              <span className="text-[#718391]">Nomor Invoice</span>
              <p className="font-mono-tabular font-bold text-[#17324D]">
                {inv.invoiceNumber}
              </p>
            </div>
            <div>
              <span className="text-[#718391]">Tenant Ditagih</span>
              <p className="font-bold text-[#17324D]">{inv.tenantName}</p>
            </div>
            <div>
              <span className="text-[#718391]">Kategori Tagihan</span>
              <p className="font-semibold text-[#172B3A]">{inv.category}</p>
            </div>
            <div>
              <span className="text-[#718391]">Jatuh Tempo</span>
              <p className="font-mono-tabular font-semibold text-[#172B3A]">
                {inv.dueDate}
              </p>
            </div>
            <div>
              <span className="text-[#718391]">Nominal Tagihan</span>
              <p className="font-mono-tabular text-base font-bold text-[#0284C7]">
                {formatIDR(inv.amountIdr)}
              </p>
            </div>
            <div>
              <span className="text-[#718391]">Status Pembayaran</span>
              <p
                className={`font-bold ${
                  inv.status === 'Lunas'
                    ? 'text-[#247A55]'
                    : inv.status === 'Menunggu Bayar'
                      ? 'text-[#A96816]'
                      : 'text-[#B23A48]'
                }`}
              >
                {inv.status}
              </p>
            </div>
          </div>

          <div className="rounded-[10px] border border-[#EAF2F6] bg-white p-3.5 text-[#526675] space-y-1">
            <p className="font-semibold text-[#17324D]">Rincian Tagihan Platform</p>
            <div className="flex justify-between">
              <span>{inv.category} Periodik ({inv.tenantName})</span>
              <span className="font-mono-tabular font-semibold text-[#17324D]">
                {formatIDR(inv.amountIdr)}
              </span>
            </div>
            <div className="flex justify-between border-t border-[#EAF2F6] pt-1.5 font-bold text-[#17324D]">
              <span>Total Tagihan</span>
              <span className="font-mono-tabular">{formatIDR(inv.amountIdr)}</span>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-[10px] border border-[#D8E3E9] px-4 text-xs font-semibold text-[#526675] hover:bg-[#F5F8FA]"
            >
              Tutup
            </button>
            {inv.status !== 'Lunas' && (
              <button
                type="button"
                onClick={() => {
                  props.onMarkInvoicePaid(inv.id);
                  onClose();
                }}
                className="h-10 rounded-[10px] bg-[#247A55] px-4 text-xs font-semibold text-white hover:bg-[#1E6647]"
              >
                Tandai Lunas
              </button>
            )}
          </div>
        </div>
      </ModalFrame>
    );
  }

  if (modal.type === 'contract-crud') {
    return (
      <ContractCrudModal
        initial={modal.doc}
        onClose={onClose}
        onSubmit={props.onUpsertContract}
      />
    );
  }

  if (modal.type === 'commission-scheme-crud') {
    return (
      <CommissionSchemeCrudModal
        initial={modal.scheme}
        onClose={onClose}
        onSubmit={props.onUpsertCommissionScheme}
      />
    );
  }

  if (modal.type === 'integration-crud') {
    return (
      <IntegrationCrudModal
        initial={modal.connector}
        onClose={onClose}
        onSubmit={props.onUpsertIntegration}
      />
    );
  }

  if (modal.type === 'break-glass-request') {
    return (
      <BreakGlassModal
        tenants={props.tenants}
        permissionRegistry={props.permissionRegistry}
        onClose={onClose}
        onSubmit={props.onCreateBreakGlass}
      />
    );
  }

  if (modal.type === 'security-policy') {
    return (
      <SecurityPolicyModal
        ipAllowlist={props.ipAllowlistEnabled}
        ttlMinutes={props.sessionTtlMinutes}
        onClose={onClose}
        onSubmit={props.onUpdateSecurityPolicy}
      />
    );
  }

  if (modal.type === 'audit-detail') {
    const log = props.auditLogs.find((l) => l.id === modal.logId);
    if (!log) return null;
    return (
      <ModalFrame
        title="Detail Audit Log & Diff Perubahan"
        subtitle={`${log.id} · ${log.timestamp}`}
        onClose={onClose}
      >
        <div className="space-y-3 text-xs">
          <div className="flex items-center gap-2 text-[#17324D] font-bold">
            <FileClock className="h-4 w-4 text-[#0284C7]" />
            <span>{log.action}</span>
          </div>
          <div className="rounded-[10px] bg-[#F5F8FA] p-3.5 space-y-1.5 text-[#526675]">
            <p>
              Aktor: <strong className="text-[#17324D]">{log.actorEmail}</strong>
            </p>
            <p>
              Target Resource:{' '}
              <strong className="text-[#17324D]">{log.targetResource}</strong>
            </p>
            <p>
              Scope Tenant: <strong className="text-[#17324D]">{log.tenantScope}</strong>
            </p>
            <p>
              Hasil: <strong className="text-[#247A55]">{log.result}</strong>
            </p>
          </div>
          <div>
            <p className="mb-1 font-semibold text-[#172B3A]">Immutable Diff Payload</p>
            <pre className="overflow-x-auto rounded-[10px] bg-[#17324D] p-3 font-mono-tabular text-[11px] text-[#E6F4F9]">
              {log.diffSummary}
            </pre>
          </div>
        </div>
      </ModalFrame>
    );
  }

  if (modal.type === 'incident-crud') {
    return <IncidentCrudModal onClose={onClose} onSubmit={props.onCreateIncident} />;
  }

  if (modal.type === 'vendor-crud') {
    return (
      <VendorCrudModal
        initial={modal.vendor}
        onClose={onClose}
        onSubmit={props.onUpsertVendor}
      />
    );
  }

  return null;
}

/* ---------- Individual Form Modals ---------- */

function TenantCrudModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: AdminTenantRecord;
  onClose: () => void;
  onSubmit: (p: Omit<AdminTenantRecord, 'id' | 'createdAt'> & { id?: string }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [legalName, setLegalName] = useState(initial?.legalName ?? '');
  const [domain, setDomain] = useState(initial?.domain ?? '');
  const [code, setCode] = useState(initial?.code ?? 'TEN-NEW-010');
  const [industry, setIndustry] = useState(initial?.industry ?? 'ISP / Telekomunikasi');
  const [clientType, setClientType] = useState<AdminTenantRecord['clientType']>(
    initial?.clientType ?? 'ISP / Provider'
  );
  const [cooperationModel, setCooperationModel] = useState<
    AdminTenantRecord['cooperationModel']
  >(initial?.cooperationModel ?? 'Kontrak Managed End-to-End');
  const [contractNumber, setContractNumber] = useState(
    initial?.contractNumber ?? 'CTR-2026-099'
  );
  const [status, setStatus] = useState<AdminTenantRecord['status']>(
    initial?.status ?? 'Aktif'
  );
  const [region, setRegion] = useState(initial?.region ?? 'Jabodetabek');

  return (
    <ModalFrame
      title={initial ? `Edit Tenant: ${initial.name}` : 'Tambah Tenant Baru'}
      subtitle="Data tenant diisolasi secara ketat pada layer RLS berdasarkan kontrak kerjasama."
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const cooperationLabel =
            cooperationModel === 'Kontrak Managed End-to-End'
              ? 'Kontrak Managed E2E'
              : cooperationModel === 'Kontrak Field & Sales'
                ? 'Kontrak Field & Sales'
                : 'Kontrak Pilot Kemitraan';
          onSubmit({
            id: initial?.id,
            code,
            name: name || 'Tenant Baru',
            legalName: legalName || name || 'PT Tenant Baru',
            domain: domain || 'tenant.agentzy.id',
            industry,
            clientType,
            cooperationModel,
            cooperationLabel,
            contractNumber: contractNumber || 'CTR-2026-099',
            status,
            region,
            humanCount: initial?.humanCount ?? 0,
            aiWorkerCount: initial?.aiWorkerCount ?? 2,
            creditsBalance: initial?.creditsBalance ?? 50000,
            monthlyCreditsUsed: initial?.monthlyCreditsUsed ?? 0,
            slaScore: initial?.slaScore ?? 99.0,
          });
        }}
        className="space-y-3"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Nama Tenant</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="PT ISP Nusantara"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Kode Tenant</label>
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Nama Legal Badan Usaha</label>
          <input
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            placeholder="PT ISP Nusantara Telekomunikasi"
            className={inputCls}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Domain Korporat</label>
            <input
              required
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="domain.co.id"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Industri</label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className={inputCls}
            >
              <option value="ISP / Telekomunikasi">ISP / Telekomunikasi</option>
              <option value="Properti">Properti</option>
              <option value="Manufaktur">Manufaktur</option>
              <option value="Retail & Distribusi">Retail &amp; Distribusi</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Jenis Klien</label>
            <select
              value={clientType}
              onChange={(e) =>
                setClientType(e.target.value as AdminTenantRecord['clientType'])
              }
              className={inputCls}
            >
              <option value="ISP / Provider">ISP / Provider</option>
              <option value="Corporate Enterprise">Corporate Enterprise</option>
              <option value="Multi-Cabang">Multi-Cabang</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Skema Kontrak Kerjasama</label>
            <select
              value={cooperationModel}
              onChange={(e) =>
                setCooperationModel(e.target.value as AdminTenantRecord['cooperationModel'])
              }
              className={inputCls}
            >
              <option value="Kontrak Managed End-to-End">Kontrak Managed End-to-End</option>
              <option value="Kontrak Field & Sales">Kontrak Field &amp; Sales</option>
              <option value="Kontrak Pilot Kemitraan">Kontrak Pilot Kemitraan</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className={labelCls}>No. Kontrak (MSA/PKS)</label>
            <input
              required
              value={contractNumber}
              onChange={(e) => setContractNumber(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as AdminTenantRecord['status'])
              }
              className={inputCls}
            >
              <option value="Aktif">Aktif</option>
              <option value="Trial">Trial</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Wilayah Operasional</label>
            <input
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <ModalActions onClose={onClose} submitLabel={initial ? 'Update Tenant' : 'Buat Tenant'} />
      </form>
    </ModalFrame>
  );
}

function ProviderCrudModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: AdminIspProviderRecord;
  onClose: () => void;
  onSubmit: (p: Omit<AdminIspProviderRecord, 'id'> & { id?: string }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [code, setCode] = useState(initial?.code ?? 'PRV-NEW');
  const [lines, setLines] = useState(initial?.productLines.join(', ') ?? 'FTTH, FWA');
  const [integrationMode, setIntegrationMode] =
    useState<AdminIspProviderRecord['integrationMode']>(
      initial?.integrationMode ?? 'REST API + Webhook'
    );
  const [coverageSource, setCoverageSource] = useState(
    initial?.coverageSource ?? 'PostGIS Coverage Grid'
  );
  const [slaTargetHours, setSlaTargetHours] = useState(initial?.slaTargetHours ?? 24);
  const [status, setStatus] = useState<AdminIspProviderRecord['status']>(
    initial?.status ?? 'Terhubung'
  );

  return (
    <ModalFrame
      title={initial ? `Edit Provider: ${initial.name}` : 'Tambah ISP Provider'}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            id: initial?.id,
            name,
            code,
            productLines: lines
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
            integrationMode,
            coverageSource,
            slaTargetHours: Number(slaTargetHours) || 24,
            status,
          });
        }}
        className="space-y-3"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Nama Provider</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Kode Provider</label>
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Lini Produk (pisahkan koma)</label>
          <input
            value={lines}
            onChange={(e) => setLines(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Organisasi Induk</label>
          <select
            required
            value={selectedOrganizationId}
            disabled={Boolean(initial)}
            onChange={(event) => setOrganizationId(event.target.value)}
            className={inputCls}
          >
            <option value="" disabled>Pilih organisasi aktif</option>
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>{organization.name}</option>
            ))}
          </select>
          {organizations.length === 0 && !initial && (
            <p className="mt-1 text-[10px] text-[#B23A48]">Tenant belum memiliki organisasi aktif yang dapat dipilih.</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Mode Integrasi</label>
            <select
              value={integrationMode}
              onChange={(e) =>
                setIntegrationMode(
                  e.target.value as AdminIspProviderRecord['integrationMode']
                )
              }
              className={inputCls}
            >
              <option value="REST API + Webhook">REST API + Webhook</option>
              <option value="Partner Portal">Partner Portal</option>
              <option value="Secure File Exchange">Secure File Exchange</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Target SLA (jam)</label>
            <input
              type="number"
              value={slaTargetHours}
              onChange={(e) => setSlaTargetHours(Number(e.target.value))}
              className={inputCls}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Sumber Coverage ODP/BTS</label>
            <input
              value={coverageSource}
              onChange={(e) => setCoverageSource(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as AdminIspProviderRecord['status'])
              }
              className={inputCls}
            >
              <option value="Terhubung">Terhubung</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
          </div>
        </div>
        <ModalActions onClose={onClose} />
      </form>
    </ModalFrame>
  );
}

function IndustryCrudModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: MasterIndustryItem;
  onClose: () => void;
  onSubmit: (p: Omit<MasterIndustryItem, 'id'> & { id?: string }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [code, setCode] = useState(initial?.code ?? 'IND-NEW');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [serviceCount, setServiceCount] = useState(initial?.serviceCount ?? 4);
  const [productCount, setProductCount] = useState(initial?.productCount ?? 10);
  const [status, setStatus] = useState<MasterIndustryItem['status']>(
    initial?.status ?? 'Aktif'
  );

  return (
    <ModalFrame
      title={initial ? `Edit Industri: ${initial.name}` : 'Tambah Master Industri'}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            id: initial?.id,
            name,
            code,
            description,
            serviceCount,
            productCount,
            status,
          });
        }}
        className="space-y-3"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Nama Industri</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Kode</label>
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Deskripsi Layanan</label>
          <input
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Jml Layanan</label>
            <input
              type="number"
              value={serviceCount}
              onChange={(e) => setServiceCount(Number(e.target.value))}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Jml Produk</label>
            <input
              type="number"
              value={productCount}
              onChange={(e) => setProductCount(Number(e.target.value))}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as MasterIndustryItem['status'])
              }
              className={inputCls}
            >
              <option value="Aktif">Aktif</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
        </div>
        <ModalActions onClose={onClose} />
      </form>
    </ModalFrame>
  );
}

function ServiceCrudModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: MasterServiceItem;
  onClose: () => void;
  onSubmit: (p: Omit<MasterServiceItem, 'id'> & { id?: string }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState<MasterServiceItem['category']>(
    initial?.category ?? 'Human Workforce'
  );
  const [industryCode, setIndustryCode] = useState(initial?.industryCode ?? 'IND-ISP');
  const [scope, setScope] = useState(initial?.scope ?? '');
  const [slaStandard, setSlaStandard] = useState(
    initial?.slaStandard ?? 'First-Time-Right ≥ 95%'
  );
  const [status, setStatus] = useState<MasterServiceItem['status']>(
    initial?.status ?? 'Aktif'
  );

  return (
    <ModalFrame
      title={initial ? 'Edit Master Layanan' : 'Tambah Master Layanan'}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            id: initial?.id,
            name,
            category,
            industryCode,
            scope,
            slaStandard,
            status,
          });
        }}
        className="space-y-3"
      >
        <div>
          <label className={labelCls}>Nama Layanan</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Kategori Workforce</label>
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as MasterServiceItem['category'])
              }
              className={inputCls}
            >
              <option value="Human Workforce">Human Workforce</option>
              <option value="AI Workforce">AI Workforce</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Kode Industri</label>
            <input
              value={industryCode}
              onChange={(e) => setIndustryCode(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Ruang Lingkup</label>
          <input
            required
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Standar SLA</label>
            <input
              value={slaStandard}
              onChange={(e) => setSlaStandard(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as MasterServiceItem['status'])
              }
              className={inputCls}
            >
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
          </div>
        </div>
        <ModalActions onClose={onClose} />
      </form>
    </ModalFrame>
  );
}

function ProductCrudModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: MasterProductItem;
  onClose: () => void;
  onSubmit: (p: Omit<MasterProductItem, 'id'> & { id?: string }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [code, setCode] = useState(initial?.code ?? 'FTTH-NEW');
  const [industryCode, setIndustryCode] = useState(initial?.industryCode ?? 'IND-ISP');
  const [providerName, setProviderName] = useState(
    initial?.providerName ?? 'XL SMART Fiber'
  );
  const [unitMeasure, setUnitMeasure] = useState(
    initial?.unitMeasure ?? 'SA (Sales Activation)'
  );
  const [baseTariffIdr, setBaseTariffIdr] = useState(initial?.baseTariffIdr ?? 349000);
  const [status, setStatus] = useState<MasterProductItem['status']>(
    initial?.status ?? 'Aktif'
  );

  return (
    <ModalFrame
      title={initial ? 'Edit Master Produk' : 'Tambah Master Produk'}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            id: initial?.id,
            name,
            code,
            industryCode,
            providerName,
            unitMeasure,
            baseTariffIdr: Number(baseTariffIdr) || 0,
            status,
          });
        }}
        className="space-y-3"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Nama Produk</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Kode Produk</label>
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Provider</label>
            <input
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Unit Pengukuran</label>
            <input
              value={unitMeasure}
              onChange={(e) => setUnitMeasure(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Kode Industri</label>
            <input
              value={industryCode}
              onChange={(e) => setIndustryCode(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Tarif Dasar (IDR)</label>
            <input
              type="number"
              value={baseTariffIdr}
              onChange={(e) => setBaseTariffIdr(Number(e.target.value))}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as MasterProductItem['status'])
              }
              className={inputCls}
            >
              <option value="Aktif">Aktif</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
        </div>
        <ModalActions onClose={onClose} />
      </form>
    </ModalFrame>
  );
}

function CooperationPolicyCrudModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: CooperationPolicyRecord;
  onClose: () => void;
  onSubmit: (p: Omit<CooperationPolicyRecord, 'id'> & { id?: string }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [key, setKey] = useState(initial?.key ?? 'custom_kontrak');
  const [includedAiCreditsMonthly, setIncludedAiCreditsMonthly] = useState(
    initial?.includedAiCreditsMonthly ?? 150000
  );
  const [contractScopeNote, setContractScopeNote] = useState(
    initial?.contractScopeNote ?? 'Sesuai perjanjian kontrak kerjasama korporat + Top Up AI Credits'
  );
  const [maxUsers, setMaxUsers] = useState(initial?.maxUsers ?? '250 pengguna');
  const [maxAiWorkers, setMaxAiWorkers] = useState(
    initial?.maxAiWorkers ?? '40 AI Worker'
  );
  const [maxWorkflows, setMaxWorkflows] = useState(
    initial?.maxWorkflows ?? '50 Workflow aktif'
  );

  return (
    <ModalFrame
      title={
        initial
          ? `Edit Profil Kontrak: ${initial.name}`
          : 'Buat Profil Kontrak Kerjasama'
      }
      subtitle="Tidak menggunakan harga langganan SaaS; hanya alokasi kredit awal dan kuota kontrak."
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            id: initial?.id,
            key,
            name,
            includedAiCreditsMonthly: Number(includedAiCreditsMonthly) || 50000,
            contractScopeNote,
            maxUsers,
            maxAiWorkers,
            maxWorkflows,
            storageLimit: initial?.storageLimit ?? '250 GB RAG Storage',
            apiRateLimit: initial?.apiRateLimit ?? '1.500 req/menit',
            slaGuarantee: initial?.slaGuarantee ?? '99,5% SLA Kontrak',
            status: initial?.status ?? 'Aktif',
            entitlements: initial?.entitlements ?? {
              aiGateway: true,
              modelRouter: true,
              memoryRag: true,
              customWorkflow: true,
              breakGlassAudit: true,
              dedicatedSso: false,
            },
          });
        }}
        className="space-y-3"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Nama Profil Kontrak</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Kontrak Managed Nasional"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Alokasi Awal AI Credits</label>
            <input
              type="number"
              value={includedAiCreditsMonthly}
              onChange={(e) => setIncludedAiCreditsMonthly(Number(e.target.value))}
              className={inputCls}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Key Profil</label>
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Catatan Ruang Lingkup</label>
            <input
              value={contractScopeNote}
              onChange={(e) => setContractScopeNote(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Max User</label>
            <input
              value={maxUsers}
              onChange={(e) => setMaxUsers(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Max AI Worker</label>
            <input
              value={maxAiWorkers}
              onChange={(e) => setMaxAiWorkers(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Max Workflow</label>
            <input
              value={maxWorkflows}
              onChange={(e) => setMaxWorkflows(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <ModalActions onClose={onClose} />
      </form>
    </ModalFrame>
  );
}

function OrgUnitCrudModal({
  initial,
  tenants,
  organizationsByTenant,
  onClose,
  onSubmit,
}: {
  initial?: OrgUnitRecord;
  tenants: AdminTenantRecord[];
  organizationsByTenant: Record<string, AgentzyOrganization[]>;
  onClose: () => void;
  onSubmit: (p: Omit<OrgUnitRecord, 'id'> & { id?: string }) => void;
}) {
  const [tenantId, setTenantId] = useState(
    initial?.tenantId ?? tenants[0]?.id ?? 'ten-isp-nusantara'
  );
  const [organizationId, setOrganizationId] = useState(initial?.organizationId ?? '');
  const organizations = (organizationsByTenant[tenantId] ?? []).filter((item) => item.status === 'active');
  const selectedOrganizationId = organizationId || (organizations.length === 1 ? organizations[0].id : '');
  const [name, setName] = useState(initial?.name ?? '');
  const [unitType, setUnitType] = useState<OrgUnitRecord['unitType']>(
    initial?.unitType ?? 'Cabang / Regional'
  );
  const [parentName, setParentName] = useState(initial?.parentName ?? '');

  return (
    <ModalFrame
      title={initial ? `Edit Unit: ${initial.name}` : 'Tambah Unit / Departemen'}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            id: initial?.id,
            tenantId,
            organizationId: selectedOrganizationId,
            name,
            unitType,
            parentName,
            headName: null,
            memberCount: null,
            status: 'Aktif',
          });
        }}
        className="space-y-3"
      >
        <div>
          <label className={labelCls}>Tenant</label>
          <select
            value={tenantId}
            disabled={Boolean(initial)}
            onChange={(e) => { setTenantId(e.target.value); setOrganizationId(''); }}
            className={inputCls}
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Nama Unit / Departemen</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Tipe Unit</label>
            <select
              value={unitType}
              onChange={(e) =>
                setUnitType(e.target.value as OrgUnitRecord['unitType'])
              }
              className={inputCls}
            >
              <option value="Unit Organisasi">Unit Organisasi</option>
              <option value="Cabang / Regional">Cabang / Regional</option>
              <option value="Departemen">Departemen</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Induk (nama unit/cabang/departemen terdaftar, opsional untuk cabang)</label>
          <input
            value={parentName}
            onChange={(e) => setParentName(e.target.value)}
            className={inputCls}
            placeholder="Masukkan nama induk yang sudah terdaftar"
          />
        </div>
        <ModalActions onClose={onClose} />
      </form>
    </ModalFrame>
  );
}

function UserCrudModal({
  initial,
  tenants,
  roles,
  onClose,
  onSubmit,
}: {
  initial?: PlatformUserRecord;
  tenants: AdminTenantRecord[];
  roles: RbacRoleRecord[];
  onClose: () => void;
  onSubmit: (p: Omit<PlatformUserRecord, 'id' | 'lastLogin'> & { id?: string }) => void;
}) {
  const [tenantId, setTenantId] = useState(initial?.tenantId ?? tenants[0]?.id ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [roleKey, setRoleKey] = useState(initial?.roleKey ?? '');
  const tenantRoles = roles.filter((role) => role.scopeType === 'Tenant');
  const selectedRole = tenantRoles.find((role) => role.key === roleKey);

  return (
    <ModalFrame
      title={initial ? `Edit Pengguna: ${initial.name}` : 'Undang Pengguna Platform'}
      subtitle="Undangan dan role membership diproses oleh FastAPI; status akhir dibaca kembali dari Supabase."
      onClose={onClose}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const tenant = tenants.find((item) => item.id === tenantId);
          if (!tenant || !selectedRole) return;
          onSubmit({
            id: initial?.id,
            tenantId,
            tenantName: tenant.name,
            name,
            email,
            roleId: selectedRole.id,
            roleKey: selectedRole.key,
            roleName: selectedRole.name,
            department: '',
            branchScope: '',
            organizationId: null,
            organizationUnitId: null,
            branchId: null,
            departmentId: null,
            mfaEnabled: null,
            status: 'Pending',
          });
        }}
        className="space-y-3"
      >
        <div>
          <label className={labelCls}>Tenant Korporat</label>
          <select required value={tenantId} onChange={(event) => setTenantId(event.target.value)} className={inputCls}>
            <option value="" disabled>Pilih tenant</option>
            {tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Nama Lengkap</label>
            <input required value={name} onChange={(event) => setName(event.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Email Kerja</label>
            <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Role Tenant dari Registry</label>
          <select required value={roleKey} onChange={(event) => setRoleKey(event.target.value)} className={inputCls}>
            <option value="" disabled>Pilih role yang tersedia</option>
            {tenantRoles.map((role) => <option key={role.id} value={role.key}>{role.name}</option>)}
          </select>
          {tenantRoles.length === 0 && (
            <p className="mt-1 text-[11px] text-[#B23A48]">Role tenant belum berhasil dimuat dari API. Undangan tidak dapat dikirim.</p>
          )}
        </div>
        <ModalActions onClose={onClose} submitLabel="Kirim Undangan" />
      </form>
    </ModalFrame>
  );
}

function RoleCrudModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: RbacRoleRecord;
  onClose: () => void;
  onSubmit: (
    p: Omit<RbacRoleRecord, 'id' | 'userCount' | 'isSystemRole'> & { id?: string }
  ) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [key, setKey] = useState(initial?.key ?? 'custom_auditor');
  const [scopeType, setScopeType] = useState<RbacRoleRecord['scopeType']>(
    initial?.scopeType ?? 'Tenant'
  );
  const [description, setDescription] = useState(initial?.description ?? '');

  return (
    <ModalFrame
      title={initial ? `Edit Role: ${initial.name}` : 'Tambah Role RBAC'}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            id: initial?.id,
            key,
            name,
            scopeType,
            description,
            permissions: initial?.permissions ?? {
              'tenant.manage': 'R',
              'workforce.manage': 'R',
              'ai_worker.manage': 'R',
              'commission.manage': 'R',
              'security.audit': 'R',
            },
          });
        }}
        className="space-y-3"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Nama Role</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Role Key</label>
            <input
              required
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Lingkup (Scope)</label>
          <select
            value={scopeType}
            onChange={(e) =>
              setScopeType(e.target.value as RbacRoleRecord['scopeType'])
            }
            className={inputCls}
          >
            <option value="Tenant">Tenant</option>
            <option value="Platform">Platform</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Deskripsi Hak Akses</label>
          <input
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputCls}
          />
        </div>
        <ModalActions onClose={onClose} />
      </form>
    </ModalFrame>
  );
}

function StaffCrudModal({
  initial,
  tenants,
  onClose,
  onSubmit,
}: {
  initial?: HumanStaffRecord;
  tenants: AdminTenantRecord[];
  onClose: () => void;
  onSubmit: (p: Omit<HumanStaffRecord, 'id'> & { id?: string }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [workerCode, setWorkerCode] = useState(initial?.workerCode ?? 'HW-NEW-901');
  const [tenantId, setTenantId] = useState(
    initial?.tenantId ?? tenants[0]?.id ?? 'ten-isp-nusantara'
  );
  const [position, setPosition] = useState<HumanStaffRecord['position']>(
    initial?.position ?? 'Teknisi'
  );
  const [grade, setGrade] = useState<HumanStaffRecord['grade']>(
    initial?.grade ?? 'Pro'
  );
  const [region, setRegion] = useState(initial?.region ?? 'Jakarta Selatan');

  return (
    <ModalFrame
      title={initial ? `Edit Staff: ${initial.name}` : 'Tambah Human Workforce'}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const tenantName =
            tenants.find((t) => t.id === tenantId)?.name ?? 'ISP Nusantara';
          onSubmit({
            id: initial?.id,
            workerCode,
            name,
            tenantId,
            tenantName,
            position,
            grade,
            region,
            verificationStatus: initial?.verificationStatus ?? 'Menunggu Verifikasi',
            lifecycleStatus: initial?.lifecycleStatus ?? 'Pending',
            assignmentLoad: initial?.assignmentLoad ?? 30,
            slaScore: initial?.slaScore ?? 97.5,
          });
        }}
        className="space-y-3"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Nama Staff</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Kode Pekerja</label>
            <input
              required
              value={workerCode}
              onChange={(e) => setWorkerCode(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Tenant Penempatan</label>
          <select
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            className={inputCls}
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Posisi</label>
            <select
              value={position}
              onChange={(e) =>
                setPosition(e.target.value as HumanStaffRecord['position'])
              }
              className={inputCls}
            >
              <option value="Teknisi">Teknisi</option>
              <option value="Sales">Sales</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Customer Care">Customer Care</option>
              <option value="Affiliate">Affiliate</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Grade</label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value as HumanStaffRecord['grade'])}
              className={inputCls}
            >
              <option value="OJT">OJT</option>
              <option value="Pro">Pro</option>
              <option value="Elite">Elite</option>
              <option value="Senior">Senior</option>
              <option value="Staff">Staff</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Wilayah</label>
            <input
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <ModalActions onClose={onClose} />
      </form>
    </ModalFrame>
  );
}

function AiWorkerCrudModal({
  initial,
  tenants,
  onClose,
  onSubmit,
}: {
  initial?: AdminAIWorkerRecord;
  tenants: AdminTenantRecord[];
  onClose: () => void;
  onSubmit: (p: Omit<AdminAIWorkerRecord, 'id'> & { id?: string }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [version, setVersion] = useState(initial?.version ?? 'v1.0');
  const [tenantId, setTenantId] = useState(
    initial?.tenantId ?? tenants[0]?.id ?? 'ten-isp-nusantara'
  );
  const [roleDescription, setRoleDescription] = useState(
    initial?.roleDescription ?? ''
  );
  const [modelName, setModelName] = useState(initial?.modelName ?? 'GPT-5.1 (Router)');
  const [autonomyLevel, setAutonomyLevel] = useState<
    AdminAIWorkerRecord['autonomyLevel']
  >(initial?.autonomyLevel ?? 'L2 Bounded');
  const [lifecycleStatus, setLifecycleStatus] = useState<
    AdminAIWorkerRecord['lifecycleStatus']
  >(initial?.lifecycleStatus ?? 'Draft');

  return (
    <ModalFrame
      title={initial ? `Edit AI Worker: ${initial.name}` : 'Buat AI Worker Baru'}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const tenantName =
            tenants.find((t) => t.id === tenantId)?.name ?? 'ISP Nusantara';
          onSubmit({
            id: initial?.id,
            workerKey:
              initial?.workerKey ?? name.toLowerCase().replace(/\s+/g, '-'),
            name,
            tenantId,
            tenantName,
            version,
            roleDescription,
            modelName,
            skills: initial?.skills ?? ['Lead Scoring', 'CRM Integration'],
            tools: initial?.tools ?? ['CRM (Internal)'],
            memoryMode: initial?.memoryMode ?? 'Aktif (Tenant Scoped)',
            slaTarget: initial?.slaTarget ?? '≥ 98%',
            autonomyLevel,
            lifecycleStatus,
            monthlyCreditsUsed: initial?.monthlyCreditsUsed ?? 0,
            successRatePct: initial?.successRatePct ?? 98.0,
          });
        }}
        className="space-y-3"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className={labelCls}>Nama AI Worker</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Versi</label>
            <input
              required
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Tenant Terikat</label>
          <select
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            className={inputCls}
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Peran &amp; Job Contract</label>
          <input
            required
            value={roleDescription}
            onChange={(e) => setRoleDescription(e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Model Router</label>
            <select
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className={inputCls}
            >
              <option value="GPT-5.1 (Router)">GPT-5.1 (Router)</option>
              <option value="Claude 4.5 (Router)">Claude 4.5 (Router)</option>
              <option value="Gemini 2.5 Pro (Router)">Gemini 2.5 Pro (Router)</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Level Otonomi</label>
            <select
              value={autonomyLevel}
              onChange={(e) =>
                setAutonomyLevel(
                  e.target.value as AdminAIWorkerRecord['autonomyLevel']
                )
              }
              className={inputCls}
            >
              <option value="L0 Advisory">L0 Advisory</option>
              <option value="L1 Drafting">L1 Drafting</option>
              <option value="L2 Bounded">L2 Bounded</option>
              <option value="L3 Approval">L3 Approval</option>
              <option value="L4 Allowlisted">L4 Allowlisted</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Status Lifecycle</label>
            <select
              value={lifecycleStatus}
              onChange={(e) =>
                setLifecycleStatus(
                  e.target.value as AdminAIWorkerRecord['lifecycleStatus']
                )
              }
              className={inputCls}
            >
              <option value="Draft">Draft</option>
              <option value="Configured">Configured</option>
              <option value="Policy Review">Policy Review</option>
              <option value="Aktif">Aktif</option>
              <option value="Paused">Paused</option>
            </select>
          </div>
        </div>
        <ModalActions onClose={onClose} />
      </form>
    </ModalFrame>
  );
}

function LlmProviderCrudModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: LLMProviderRecord;
  onClose: () => void;
  onSubmit: (p: Omit<LLMProviderRecord, 'id'> & { id?: string }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [vendor, setVendor] = useState(initial?.vendor ?? '');
  const [region, setRegion] = useState(initial?.region ?? 'Asia-Southeast1');
  const [secretRef, setSecretRef] = useState(
    initial?.secretRef ?? 'secret://agentzy/llm/provider-key'
  );
  const [rateLimitRpm, setRateLimitRpm] = useState(initial?.rateLimitRpm ?? 5000);
  const [status, setStatus] = useState<LLMProviderRecord['status']>(
    initial?.status ?? 'Terhubung'
  );

  return (
    <ModalFrame
      title={initial ? `Edit LLM Provider: ${initial.name}` : 'Tambah LLM Provider'}
      subtitle="Secret API dikelola via KMS reference (tidak pernah diekspos ke klien)."
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            id: initial?.id,
            name,
            vendor,
            region,
            secretRef,
            rateLimitRpm: Number(rateLimitRpm) || 5000,
            avgLatencyMs: initial?.avgLatencyMs ?? 540,
            modelsCount: initial?.modelsCount ?? 2,
            status,
          });
        }}
        className="space-y-3"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Nama Provider</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Vendor Endpoint</label>
            <input
              required
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Residensi / Region</label>
            <input
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Rate Limit (RPM)</label>
            <input
              type="number"
              value={rateLimitRpm}
              onChange={(e) => setRateLimitRpm(Number(e.target.value))}
              className={inputCls}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Vault Secret Reference</label>
            <input
              value={secretRef}
              onChange={(e) => setSecretRef(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as LLMProviderRecord['status'])
              }
              className={inputCls}
            >
              <option value="Terhubung">Terhubung</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
          </div>
        </div>
        <ModalActions onClose={onClose} />
      </form>
    </ModalFrame>
  );
}

function ModelCrudModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: ModelRegistryRecord;
  onClose: () => void;
  onSubmit: (p: Omit<ModelRegistryRecord, 'id'> & { id?: string }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [modelKey, setModelKey] = useState(initial?.modelKey ?? '');
  const [providerName, setProviderName] = useState(initial?.providerName ?? 'Google');
  const [capability, setCapability] = useState<ModelRegistryRecord['capability']>(
    initial?.capability ?? 'Inference'
  );
  const [contextWindow, setContextWindow] = useState(initial?.contextWindow ?? '200K');
  const [costPer1kIdr, setCostPer1kIdr] = useState(initial?.costPer1kIdr ?? 750);
  const [status, setStatus] = useState<ModelRegistryRecord['status']>(
    initial?.status ?? 'Aktif'
  );

  return (
    <ModalFrame
      title={initial ? `Edit Model: ${initial.name}` : 'Tambah Model Registry'}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            id: initial?.id,
            modelKey: modelKey || name.toLowerCase().replace(/\s+/g, '-'),
            name,
            providerId: initial?.providerId ?? 'llm-google',
            providerName,
            capability,
            contextWindow,
            costPer1kIdr: Number(costPer1kIdr) || 750,
            residency: initial?.residency ?? 'Asia-Southeast1',
            tenantAllowlist: initial?.tenantAllowlist ?? 'Semua Tenant Aktif',
            status,
          });
        }}
        className="space-y-3"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Nama Model</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Model Key</label>
            <input
              required
              value={modelKey}
              onChange={(e) => setModelKey(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Provider</label>
            <select
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              className={inputCls}
            >
              <option value="OpenAI">OpenAI</option>
              <option value="Anthropic">Anthropic</option>
              <option value="Google">Google</option>
              <option value="Other (Custom)">Other (Custom)</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Kapabilitas</label>
            <select
              value={capability}
              onChange={(e) =>
                setCapability(e.target.value as ModelRegistryRecord['capability'])
              }
              className={inputCls}
            >
              <option value="Inference">Inference</option>
              <option value="Reasoning">Reasoning</option>
              <option value="Multimodal">Multimodal</option>
              <option value="Embedding">Embedding</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Context</label>
            <input
              value={contextWindow}
              onChange={(e) => setContextWindow(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Biaya / 1K (IDR)</label>
            <input
              type="number"
              value={costPer1kIdr}
              onChange={(e) => setCostPer1kIdr(Number(e.target.value))}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as ModelRegistryRecord['status'])
              }
              className={inputCls}
            >
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
          </div>
        </div>
        <ModalActions onClose={onClose} />
      </form>
    </ModalFrame>
  );
}

function RoutingRuleCrudModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: ModelRoutingRuleRecord;
  onClose: () => void;
  onSubmit: (p: Omit<ModelRoutingRuleRecord, 'id'> & { id?: string }) => void;
}) {
  const [taskCategory, setTaskCategory] = useState(initial?.taskCategory ?? '');
  const [targetModelName, setTargetModelName] = useState(
    initial?.targetModelName ?? 'Claude 4.5'
  );
  const [fallbackModelName, setFallbackModelName] = useState(
    initial?.fallbackModelName ?? 'GPT-5.1'
  );
  const [sensitivityLevel, setSensitivityLevel] = useState<
    ModelRoutingRuleRecord['sensitivityLevel']
  >(initial?.sensitivityLevel ?? 'Confidential');
  const [maxLatencyMs, setMaxLatencyMs] = useState(initial?.maxLatencyMs ?? 2000);

  return (
    <ModalFrame
      title={initial ? 'Edit Aturan Routing' : 'Tambah Aturan Model Router'}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            id: initial?.id,
            taskCategory,
            targetModelKey: targetModelName.toLowerCase().replace(/\s+/g, '-'),
            targetModelName,
            fallbackModelName,
            sensitivityLevel,
            priority: initial?.priority ?? 4,
            maxLatencyMs: Number(maxLatencyMs) || 2000,
            active: initial?.active ?? true,
          });
        }}
        className="space-y-3"
      >
        <div>
          <label className={labelCls}>Kategori Tugas</label>
          <input
            required
            value={taskCategory}
            onChange={(e) => setTaskCategory(e.target.value)}
            placeholder="Contoh: Validasi Kontrak & SLA"
            className={inputCls}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Model Utama</label>
            <select
              value={targetModelName}
              onChange={(e) => setTargetModelName(e.target.value)}
              className={inputCls}
            >
              <option value="GPT-5.1">GPT-5.1</option>
              <option value="Claude 4.5">Claude 4.5</option>
              <option value="Gemini 2.5 Pro">Gemini 2.5 Pro</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Fallback Alternatif</label>
            <select
              value={fallbackModelName}
              onChange={(e) => setFallbackModelName(e.target.value)}
              className={inputCls}
            >
              <option value="GPT-5.1">GPT-5.1</option>
              <option value="Claude 4.5">Claude 4.5</option>
              <option value="Gemini 2.5 Pro">Gemini 2.5 Pro</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Sensitivitas Data</label>
            <select
              value={sensitivityLevel}
              onChange={(e) =>
                setSensitivityLevel(
                  e.target.value as ModelRoutingRuleRecord['sensitivityLevel']
                )
              }
              className={inputCls}
            >
              <option value="Internal">Internal</option>
              <option value="Confidential">Confidential</option>
              <option value="Restricted">Restricted</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Max Latensi (ms)</label>
            <input
              type="number"
              value={maxLatencyMs}
              onChange={(e) => setMaxLatencyMs(Number(e.target.value))}
              className={inputCls}
            />
          </div>
        </div>
        <ModalActions onClose={onClose} />
      </form>
    </ModalFrame>
  );
}

function SkillCrudModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: SkillRegistryRecord;
  onClose: () => void;
  onSubmit: (p: Omit<SkillRegistryRecord, 'id'> & { id?: string }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [version, setVersion] = useState(initial?.version ?? 'v1.0');
  const [licenseType, setLicenseType] = useState<SkillRegistryRecord['licenseType']>(
    initial?.licenseType ?? 'Proprietary'
  );
  const [provenance, setProvenance] = useState(
    initial?.provenance ?? 'Agentzy Verified Registry'
  );
  const [riskLevel, setRiskLevel] = useState<SkillRegistryRecord['riskLevel']>(
    initial?.riskLevel ?? 'Rendah'
  );
  const [approvalStatus, setApprovalStatus] = useState<
    SkillRegistryRecord['approvalStatus']
  >(initial?.approvalStatus ?? 'Menunggu');

  return (
    <ModalFrame
      title={initial ? `Edit Skill: ${initial.name}` : 'Tambah Skill Registry'}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            id: initial?.id,
            name,
            version,
            licenseType,
            provenance,
            riskLevel,
            approvalStatus,
            toolDependencies: initial?.toolDependencies ?? ['CRM (Internal)'],
          });
        }}
        className="space-y-3"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className={labelCls}>Nama Skill</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Versi</label>
            <input
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Lisensi</label>
            <select
              value={licenseType}
              onChange={(e) =>
                setLicenseType(e.target.value as SkillRegistryRecord['licenseType'])
              }
              className={inputCls}
            >
              <option value="Open Source">Open Source</option>
              <option value="MIT">MIT</option>
              <option value="Apache-2.0">Apache-2.0</option>
              <option value="Proprietary">Proprietary</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Risiko</label>
            <select
              value={riskLevel}
              onChange={(e) =>
                setRiskLevel(e.target.value as SkillRegistryRecord['riskLevel'])
              }
              className={inputCls}
            >
              <option value="Rendah">Rendah</option>
              <option value="Sedang">Sedang</option>
              <option value="Tinggi">Tinggi</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Approval</label>
            <select
              value={approvalStatus}
              onChange={(e) =>
                setApprovalStatus(
                  e.target.value as SkillRegistryRecord['approvalStatus']
                )
              }
              className={inputCls}
            >
              <option value="Menunggu">Menunggu</option>
              <option value="Disetujui">Disetujui</option>
              <option value="Ditolak">Ditolak</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Provenance</label>
          <input
            value={provenance}
            onChange={(e) => setProvenance(e.target.value)}
            className={inputCls}
          />
        </div>
        <ModalActions onClose={onClose} />
      </form>
    </ModalFrame>
  );
}

function ToolCrudModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: ToolRegistryRecord;
  onClose: () => void;
  onSubmit: (p: Omit<ToolRegistryRecord, 'id'> & { id?: string }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [environment, setEnvironment] = useState<ToolRegistryRecord['environment']>(
    initial?.environment ?? 'Prod'
  );
  const [riskLevel, setRiskLevel] = useState<ToolRegistryRecord['riskLevel']>(
    initial?.riskLevel ?? 'Rendah'
  );
  const [timeoutSec, setTimeoutSec] = useState(initial?.timeoutSec ?? 15);
  const [rateLimitPerMin, setRateLimitPerMin] = useState(
    initial?.rateLimitPerMin ?? 120
  );
  const [requiresApproval, setRequiresApproval] = useState(
    initial?.requiresApproval ?? false
  );

  return (
    <ModalFrame
      title={initial ? `Edit Tool: ${initial.name}` : 'Daftarkan Tool Baru'}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            id: initial?.id,
            name,
            environment,
            riskLevel,
            requiresApproval,
            timeoutSec: Number(timeoutSec) || 15,
            rateLimitPerMin: Number(rateLimitPerMin) || 60,
            allowedRoles: initial?.allowedRoles ?? ['AI Sales Assistant'],
            status: environment === 'Sandbox' ? 'Terbatas' : 'Aktif',
          });
        }}
        className="space-y-3"
      >
        <div>
          <label className={labelCls}>Nama Tool</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Lingkungan</label>
            <select
              value={environment}
              onChange={(e) =>
                setEnvironment(e.target.value as ToolRegistryRecord['environment'])
              }
              className={inputCls}
            >
              <option value="Prod">Prod</option>
              <option value="Sandbox">Sandbox</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Tingkat Risiko</label>
            <select
              value={riskLevel}
              onChange={(e) =>
                setRiskLevel(e.target.value as ToolRegistryRecord['riskLevel'])
              }
              className={inputCls}
            >
              <option value="Rendah">Rendah</option>
              <option value="Sedang">Sedang</option>
              <option value="Tinggi">Tinggi</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Timeout (detik)</label>
            <input
              type="number"
              value={timeoutSec}
              onChange={(e) => setTimeoutSec(Number(e.target.value))}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Rate Limit (/menit)</label>
            <input
              type="number"
              value={rateLimitPerMin}
              onChange={(e) => setRateLimitPerMin(Number(e.target.value))}
              className={inputCls}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs text-[#172B3A]">
          <input
            type="checkbox"
            checked={requiresApproval}
            onChange={(e) => setRequiresApproval(e.target.checked)}
            className="accent-[#0284C7]"
          />
          <span>Wajib Human Approval sebelum eksekusi</span>
        </label>
        <ModalActions onClose={onClose} />
      </form>
    </ModalFrame>
  );
}

function KnowledgeCrudModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: KnowledgeSourceRecord;
  onClose: () => void;
  onSubmit: (
    p: Omit<KnowledgeSourceRecord, 'id' | 'lastIndexedAt'> & { id?: string }
  ) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [tenantName, setTenantName] = useState(initial?.tenantName ?? 'ISP Nusantara');
  const [documentCount, setDocumentCount] = useState(initial?.documentCount ?? 420);
  const [classification, setClassification] = useState<
    KnowledgeSourceRecord['classification']
  >(initial?.classification ?? 'Internal');

  return (
    <ModalFrame
      title={initial ? `Edit Sumber: ${initial.name}` : 'Tambah Sumber Knowledge / RAG'}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            id: initial?.id,
            name,
            tenantName,
            documentCount: Number(documentCount) || 100,
            chunkCount: (Number(documentCount) || 100) * 16,
            indexedPct: 100,
            classification,
            status: 'Terindeks',
          });
        }}
        className="space-y-3"
      >
        <div>
          <label className={labelCls}>Nama Koleksi Dokumen</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Scope Tenant</label>
            <input
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Jml Dokumen</label>
            <input
              type="number"
              value={documentCount}
              onChange={(e) => setDocumentCount(Number(e.target.value))}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Klasifikasi</label>
            <select
              value={classification}
              onChange={(e) =>
                setClassification(
                  e.target.value as KnowledgeSourceRecord['classification']
                )
              }
              className={inputCls}
            >
              <option value="Internal">Internal</option>
              <option value="Confidential">Confidential</option>
            </select>
          </div>
        </div>
        <ModalActions onClose={onClose} />
      </form>
    </ModalFrame>
  );
}

function WorkflowCrudModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: AdminWorkflowRecord;
  onClose: () => void;
  onSubmit: (
    p: Omit<AdminWorkflowRecord, 'id' | 'runsThisMonth'> & { id?: string }
  ) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [version, setVersion] = useState(initial?.version ?? 'v1.0');
  const [triggerType, setTriggerType] = useState(
    initial?.triggerType ?? 'Inbound Webhook Event'
  );
  const [nodesCount, setNodesCount] = useState(initial?.nodesCount ?? 6);
  const [humanHandoffRequired, setHumanHandoffRequired] = useState(
    initial?.humanHandoffRequired ?? true
  );
  const [status, setStatus] = useState<AdminWorkflowRecord['status']>(
    initial?.status ?? 'Draft'
  );

  return (
    <ModalFrame
      title={initial ? `Edit Workflow: ${initial.name}` : 'Buat Durable Workflow Baru'}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            id: initial?.id,
            name,
            version,
            triggerType,
            nodesCount: Number(nodesCount) || 5,
            humanHandoffRequired,
            status,
          });
        }}
        className="space-y-3"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className={labelCls}>Nama Workflow</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Versi</label>
            <input
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Trigger Event</label>
            <input
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Jumlah Node</label>
            <input
              type="number"
              value={nodesCount}
              onChange={(e) => setNodesCount(Number(e.target.value))}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as AdminWorkflowRecord['status'])
              }
              className={inputCls}
            >
              <option value="Draft">Draft</option>
              <option value="Aktif">Aktif</option>
              <option value="Paused">Paused</option>
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs text-[#172B3A]">
          <input
            type="checkbox"
            checked={humanHandoffRequired}
            onChange={(e) => setHumanHandoffRequired(e.target.checked)}
            className="accent-[#0284C7]"
          />
          <span>Wajib Human-AI Handoff Checkpoint sebelum eksekusi final</span>
        </label>
        <ModalActions onClose={onClose} />
      </form>
    </ModalFrame>
  );
}

function CreditTopupModal({
  tenants,
  presetTenantName,
  presetCredits,
  onClose,
  onSubmit,
}: {
  tenants: AdminTenantRecord[];
  presetTenantName?: string;
  presetCredits?: number;
  onClose: () => void;
  onSubmit: (tenantName: string, amount: number, ref: string) => void;
}) {
  const [tenantName, setTenantName] = useState(
    presetTenantName ?? tenants[0]?.name ?? 'ISP Nusantara'
  );
  const [amount, setAmount] = useState(presetCredits ?? 150000);
  const [ref, setRef] = useState('TOPUP-CRD-2026-990');

  return (
    <ModalFrame
      title="Top Up Saldo AI Credits"
      subtitle="Satu-satunya model top-up pemakaian AI Worker; dicatat ke ledger immutable."
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(tenantName, Number(amount) || 50000, ref);
        }}
        className="space-y-3"
      >
        <div>
          <label className={labelCls}>Tenant / Korporat Penerima</label>
          <select
            value={tenantName}
            onChange={(e) => setTenantName(e.target.value)}
            className={inputCls}
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.name}>
                {t.name} ({t.contractNumber})
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Nominal AI Credits</label>
            <input
              type="number"
              min={1000}
              step={1000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Nomor Referensi</label>
            <input
              required
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <ModalActions onClose={onClose} submitLabel="Catat Top Up ke Ledger" />
      </form>
    </ModalFrame>
  );
}

function CreditPricingCrudModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: CreditPricingRuleRecord;
  onClose: () => void;
  onSubmit: (p: Omit<CreditPricingRuleRecord, 'id'> & { id?: string }) => void;
}) {
  const [modelKey, setModelKey] = useState(initial?.modelKey ?? '');
  const [providerName, setProviderName] = useState(initial?.providerName ?? 'Google');
  const [creditsPer1kInput, setCreditsPer1kInput] = useState(
    initial?.creditsPer1kInput ?? 1.2
  );
  const [creditsPer1kOutput, setCreditsPer1kOutput] = useState(
    initial?.creditsPer1kOutput ?? 3.6
  );
  const [idrPerCredit, setIdrPerCredit] = useState(initial?.idrPerCredit ?? 45);

  return (
    <ModalFrame
      title={initial ? `Edit Tarif: ${initial.modelKey}` : 'Tambah Tarif AI Credits'}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            id: initial?.id,
            modelKey,
            providerName,
            creditsPer1kInput: Number(creditsPer1kInput) || 1,
            creditsPer1kOutput: Number(creditsPer1kOutput) || 3,
            idrPerCredit: Number(idrPerCredit) || 45,
            effectiveFrom: initial?.effectiveFrom ?? '17 Nov 2026',
            status: 'Aktif',
          });
        }}
        className="space-y-3"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Model LLM</label>
            <input
              required
              value={modelKey}
              onChange={(e) => setModelKey(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Provider</label>
            <input
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Credit/1K In</label>
            <input
              type="number"
              step="0.1"
              value={creditsPer1kInput}
              onChange={(e) => setCreditsPer1kInput(Number(e.target.value))}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Credit/1K Out</label>
            <input
              type="number"
              step="0.1"
              value={creditsPer1kOutput}
              onChange={(e) => setCreditsPer1kOutput(Number(e.target.value))}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>IDR / Credit</label>
            <input
              type="number"
              value={idrPerCredit}
              onChange={(e) => setIdrPerCredit(Number(e.target.value))}
              className={inputCls}
            />
          </div>
        </div>
        <ModalActions onClose={onClose} />
      </form>
    </ModalFrame>
  );
}

function CorporateCompensationCrudModal({
  initial,
  tenants,
  onClose,
  onSubmit,
}: {
  initial?: CorporateCompensationSchema;
  tenants: AdminTenantRecord[];
  onClose: () => void;
  onSubmit: (p: Omit<CorporateCompensationSchema, 'id'> & { id?: string }) => void;
}) {
  const [tenantId, setTenantId] = useState(
    initial?.tenantId ?? tenants[0]?.id ?? 'ten-isp-nusantara'
  );
  const [corporateName, setCorporateName] = useState(
    initial?.corporateName ?? tenants[0]?.name ?? 'PT ISP Nusantara'
  );
  const [vendorCode, setVendorCode] = useState(initial?.vendorCode ?? 'VND-NEW-01');
  const [contractNumber, setContractNumber] = useState(
    initial?.contractNumber ?? 'CTR-2026-099'
  );
  const [effectiveRange, setEffectiveRange] = useState(
    initial?.effectiveRange ?? '01 Nov 2026 – 31 Okt 2027'
  );
  const [status, setStatus] = useState<CorporateCompensationSchema['status']>(
    initial?.status ?? 'Aktif'
  );

  // Sales Payroll & Split
  const [salesBaseSalaryIdr, setSalesBaseSalaryIdr] = useState(
    initial?.salesConfig.baseSalaryIdr ?? 4500000
  );
  const [salesAllowanceIdr, setSalesAllowanceIdr] = useState(
    initial?.salesConfig.operationalAllowanceIdr ?? 650000
  );
  const [affiliateSplitPct, setAffiliateSplitPct] = useState(
    initial?.salesConfig.affiliateSplitPct ?? 60
  );
  const [affiliateFeePerSAIdr, setAffiliateFeePerSAIdr] = useState(
    initial?.salesConfig.affiliateFeePerSAIdr ?? 125000
  );
  const [gradeOjtBonus, setGradeOjtBonus] = useState(
    initial?.salesConfig.gradeBonus.OJT ?? 250000
  );
  const [gradeProBonus, setGradeProBonus] = useState(
    initial?.salesConfig.gradeBonus.Pro ?? 750000
  );
  const [gradeEliteBonus, setGradeEliteBonus] = useState(
    initial?.salesConfig.gradeBonus.Elite ?? 1500000
  );

  // Technician Payroll & WO Fee
  const [techBaseSalaryIdr, setTechBaseSalaryIdr] = useState(
    initial?.technicianConfig.baseSalaryIdr ?? 4800000
  );
  const [techFieldAllowanceIdr, setTechFieldAllowanceIdr] = useState(
    initial?.technicianConfig.fieldAllowanceIdr ?? 750000
  );
  const [feePemasanganIdr, setFeePemasanganIdr] = useState(
    initial?.technicianConfig.feePemasanganIdr ?? 150000
  );
  const [feeMaintenanceIdr, setFeeMaintenanceIdr] = useState(
    initial?.technicianConfig.feeMaintenanceIdr ?? 95000
  );
  const [feeSurveyIdr, setFeeSurveyIdr] = useState(
    initial?.technicianConfig.feeSurveyIdr ?? 65000
  );
  const [slaComplianceBonusIdr, setSlaComplianceBonusIdr] = useState(
    initial?.technicianConfig.slaComplianceBonusIdr ?? 600000
  );
  const [minSlaPctForBonus, setMinSlaPctForBonus] = useState(
    initial?.technicianConfig.minSlaPctForBonus ?? 95
  );

  const [tiers, setTiers] = useState<SalesTierBracket[]>(
    initial?.salesConfig.tiers ?? [
      { id: 'tr-1', label: 'Tier 1 (0–9 SA)', minSA: 0, maxSA: 9, feePerSA: 90000, multiplier: 1.0, tierBonusIdr: 0 },
      { id: 'tr-2', label: 'Tier 2 (10–24 SA)', minSA: 10, maxSA: 24, feePerSA: 175000, multiplier: 1.6, tierBonusIdr: 450000 },
      { id: 'tr-3', label: 'Tier 3 (25+ SA)', minSA: 25, maxSA: null, feePerSA: 245000, multiplier: 2.4, tierBonusIdr: 1350000 },
    ]
  );

  const salesIncrementalSplitPct = Math.max(0, 100 - Math.min(100, Math.max(0, affiliateSplitPct)));

  return (
    <ModalFrame
      title={
        initial
          ? `Edit Skema Payroll & Komisi: ${initial.corporateName}`
          : 'Tambah Skema Payroll & Komisi Corporate'
      }
      subtitle="Nilai gaji, tier SA, dan pembagian Sales ↔ Affiliate disesuaikan per kontrak kerjasama."
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            id: initial?.id,
            tenantId,
            corporateName,
            vendorCode,
            contractNumber,
            effectiveRange,
            status,
            salesConfig: {
              baseSalaryIdr: Number(salesBaseSalaryIdr) || 0,
              operationalAllowanceIdr: Number(salesAllowanceIdr) || 0,
              affiliateSplitPct: Math.min(100, Math.max(0, Number(affiliateSplitPct) || 60)),
              salesIncrementalSplitPct,
              affiliateFeePerSAIdr: Number(affiliateFeePerSAIdr) || 0,
              gradeBonus: {
                OJT: Number(gradeOjtBonus) || 0,
                Pro: Number(gradeProBonus) || 0,
                Elite: Number(gradeEliteBonus) || 0,
              },
              productRates: initial?.salesConfig.productRates ?? {
                ftthIdr: 200000,
                fwaIdr: 150000,
                pxgyIdr: 175000,
              },
              tiers,
            },
            technicianConfig: {
              baseSalaryIdr: Number(techBaseSalaryIdr) || 0,
              fieldAllowanceIdr: Number(techFieldAllowanceIdr) || 0,
              feePemasanganIdr: Number(feePemasanganIdr) || 0,
              feeMaintenanceIdr: Number(feeMaintenanceIdr) || 0,
              feeSurveyIdr: Number(feeSurveyIdr) || 0,
              slaComplianceBonusIdr: Number(slaComplianceBonusIdr) || 0,
              minSlaPctForBonus: Number(minSlaPctForBonus) || 95,
            },
          });
        }}
        className="space-y-4"
      >
        {/* Identitas Kontrak */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Pilih Tenant Korporat</label>
            <select
              value={tenantId}
              onChange={(e) => {
                const picked = tenants.find((t) => t.id === e.target.value);
                setTenantId(e.target.value);
                if (picked) {
                  setCorporateName(picked.name);
                  setContractNumber(picked.contractNumber ?? '');
                }
              }}
              className={inputCls}
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Nama Corporate / Vendor</label>
            <input
              required
              value={corporateName}
              onChange={(e) => setCorporateName(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className={labelCls}>No. Kontrak Kerjasama</label>
            <input
              required
              value={contractNumber}
              onChange={(e) => setContractNumber(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Kode Vendor</label>
            <input
              value={vendorCode}
              onChange={(e) => setVendorCode(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as CorporateCompensationSchema['status'])
              }
              className={inputCls}
            >
              <option value="Aktif">Aktif</option>
              <option value="Draft">Draft</option>
              <option value="Arsip">Arsip</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Periode Berlaku Kontrak</label>
          <input
            value={effectiveRange}
            onChange={(e) => setEffectiveRange(e.target.value)}
            className={inputCls}
          />
        </div>

        {/* Penggajian & Split Staff Sales ↔ Affiliate */}
        <div className="rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-3.5 space-y-3">
          <p className="text-xs font-bold text-[#0284C7]">
            Skema Penggajian Staff Sales &amp; Pembagian Split Affiliate
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Gaji Pokok Sales (IDR)</label>
              <input
                type="number"
                value={salesBaseSalaryIdr}
                onChange={(e) => setSalesBaseSalaryIdr(Number(e.target.value))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Tunjangan Operasional (IDR)</label>
              <input
                type="number"
                value={salesAllowanceIdr}
                onChange={(e) => setSalesAllowanceIdr(Number(e.target.value))}
                className={inputCls}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>
                Porsi Split Affiliate (%) — Sales otomatis {salesIncrementalSplitPct}%
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={affiliateSplitPct}
                onChange={(e) => setAffiliateSplitPct(Number(e.target.value))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Fee Affiliate / SA Share (IDR)</label>
              <input
                type="number"
                value={affiliateFeePerSAIdr}
                onChange={(e) => setAffiliateFeePerSAIdr(Number(e.target.value))}
                className={inputCls}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className={labelCls}>Bonus OJT</label>
              <input
                type="number"
                value={gradeOjtBonus}
                onChange={(e) => setGradeOjtBonus(Number(e.target.value))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Bonus Pro</label>
              <input
                type="number"
                value={gradeProBonus}
                onChange={(e) => setGradeProBonus(Number(e.target.value))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Bonus Elite</label>
              <input
                type="number"
                value={gradeEliteBonus}
                onChange={(e) => setGradeEliteBonus(Number(e.target.value))}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Tier SA Brackets */}
        <div className="rounded-[12px] border border-[#D8E3E9] bg-white p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-[#17324D]">Bracket Tier Tingkatan SA</p>
            <button
              type="button"
              onClick={() =>
                setTiers((prev) => [
                  ...prev,
                  {
                    id: `tr-${Date.now()}`,
                    label: `Tier ${prev.length + 1}`,
                    minSA: (prev[prev.length - 1]?.minSA ?? 0) + 15,
                    maxSA: null,
                    feePerSA: 250000,
                    multiplier: 2.5,
                    tierBonusIdr: 1000000,
                  },
                ])
              }
              className="text-[11px] font-semibold text-[#0284C7] hover:underline"
            >
              + Tambah Tier
            </button>
          </div>
          <div className="space-y-2">
            {tiers.map((tier, idx) => (
              <div key={tier.id} className="grid grid-cols-12 items-center gap-1.5 text-xs">
                <input
                  value={tier.label}
                  onChange={(e) =>
                    setTiers((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x))
                    )
                  }
                  placeholder="Label Tier"
                  className="col-span-4 h-9 rounded-[8px] border border-[#D8E3E9] px-2 text-xs"
                />
                <input
                  type="number"
                  value={tier.minSA}
                  onChange={(e) =>
                    setTiers((prev) =>
                      prev.map((x, i) =>
                        i === idx ? { ...x, minSA: Number(e.target.value) || 0 } : x
                      )
                    )
                  }
                  placeholder="Min"
                  className="col-span-2 h-9 rounded-[8px] border border-[#D8E3E9] px-2 text-center font-mono-tabular text-xs"
                />
                <input
                  type="number"
                  value={tier.feePerSA}
                  onChange={(e) =>
                    setTiers((prev) =>
                      prev.map((x, i) =>
                        i === idx ? { ...x, feePerSA: Number(e.target.value) || 0 } : x
                      )
                    )
                  }
                  placeholder="Fee/SA"
                  className="col-span-3 h-9 rounded-[8px] border border-[#D8E3E9] px-2 text-right font-mono-tabular text-xs"
                />
                <input
                  type="number"
                  value={tier.tierBonusIdr}
                  onChange={(e) =>
                    setTiers((prev) =>
                      prev.map((x, i) =>
                        i === idx ? { ...x, tierBonusIdr: Number(e.target.value) || 0 } : x
                      )
                    )
                  }
                  placeholder="Bonus"
                  className="col-span-3 h-9 rounded-[8px] border border-[#D8E3E9] px-2 text-right font-mono-tabular text-xs"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Penggajian & Fee Teknisi */}
        <div className="rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-3.5 space-y-3">
          <p className="text-xs font-bold text-[#17324D]">
            Skema Penggajian Pokok &amp; Fee Work Order Teknisi
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Gaji Pokok Teknisi (IDR)</label>
              <input
                type="number"
                value={techBaseSalaryIdr}
                onChange={(e) => setTechBaseSalaryIdr(Number(e.target.value))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Tunjangan Lapangan (IDR)</label>
              <input
                type="number"
                value={techFieldAllowanceIdr}
                onChange={(e) => setTechFieldAllowanceIdr(Number(e.target.value))}
                className={inputCls}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className={labelCls}>Fee Pemasangan</label>
              <input
                type="number"
                value={feePemasanganIdr}
                onChange={(e) => setFeePemasanganIdr(Number(e.target.value))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Fee Maintenance</label>
              <input
                type="number"
                value={feeMaintenanceIdr}
                onChange={(e) => setFeeMaintenanceIdr(Number(e.target.value))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Fee Survey</label>
              <input
                type="number"
                value={feeSurveyIdr}
                onChange={(e) => setFeeSurveyIdr(Number(e.target.value))}
                className={inputCls}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Bonus Kepatuhan SLA (IDR)</label>
              <input
                type="number"
                value={slaComplianceBonusIdr}
                onChange={(e) => setSlaComplianceBonusIdr(Number(e.target.value))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Minimum SLA Bonus (%)</label>
              <input
                type="number"
                value={minSlaPctForBonus}
                onChange={(e) => setMinSlaPctForBonus(Number(e.target.value))}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        <ModalActions onClose={onClose} submitLabel="Simpan Skema Corporate" />
      </form>
    </ModalFrame>
  );
}

function TechBonusRuleCrudModal({
  initial,
  corporateSchemas,
  onClose,
  onSubmit,
}: {
  initial?: TechnicianBonusRule;
  corporateSchemas: CorporateCompensationSchema[];
  onClose: () => void;
  onSubmit: (p: Omit<TechnicianBonusRule, 'id'> & { id?: string }) => void;
}) {
  const [corporateSchemaId, setCorporateSchemaId] = useState(
    initial?.corporateSchemaId ?? corporateSchemas[0]?.id ?? 'corp-comp-nusantara'
  );
  const [taskType, setTaskType] = useState<TechnicianTaskCategory>(
    initial?.taskType ?? 'Pemasangan'
  );
  const [period, setPeriod] = useState<BonusPeriodType>(initial?.period ?? 'Harian');
  const [targetCount, setTargetCount] = useState(initial?.targetCount ?? 3);
  const [bonusAmountIdr, setBonusAmountIdr] = useState(initial?.bonusAmountIdr ?? 150000);
  const [extraPerUnitIdr, setExtraPerUnitIdr] = useState(initial?.extraPerUnitIdr ?? 45000);
  const [minSlaPct, setMinSlaPct] = useState(initial?.minSlaPct ?? 95);
  const [status, setStatus] = useState<TechnicianBonusRule['status']>(
    initial?.status ?? 'Aktif'
  );

  const selectedCorp = corporateSchemas.find((c) => c.id === corporateSchemaId);

  return (
    <ModalFrame
      title={
        initial
          ? `Edit Aturan Bonus: ${initial.taskType} (${initial.period})`
          : 'Tambah Aturan Bonus Target Teknisi'
      }
      subtitle="Berlaku di luar gaji pokok apabila teknisi mencapai target periode Harian, Mingguan, atau Bulanan."
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            id: initial?.id,
            corporateSchemaId,
            corporateName: selectedCorp?.corporateName ?? initial?.corporateName ?? 'PT ISP Nusantara',
            taskType,
            period,
            targetCount: Math.max(1, Number(targetCount) || 1),
            bonusAmountIdr: Math.max(0, Number(bonusAmountIdr) || 0),
            extraPerUnitIdr: Math.max(0, Number(extraPerUnitIdr) || 0),
            minSlaPct: Math.min(100, Math.max(0, Number(minSlaPct) || 90)),
            status,
          });
        }}
        className="space-y-3"
      >
        <div>
          <label className={labelCls}>Corporate / Vendor Kontrak</label>
          <select
            value={corporateSchemaId}
            onChange={(e) => setCorporateSchemaId(e.target.value)}
            className={inputCls}
          >
            {corporateSchemas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.corporateName} ({c.contractNumber})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Kategori Tugas</label>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value as TechnicianTaskCategory)}
              className={inputCls}
            >
              <option value="Pemasangan">Pemasangan (Instalasi)</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Survey">Survey Lokasi / ODP</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Periode Target Bonus</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as BonusPeriodType)}
              className={inputCls}
            >
              <option value="Harian">Harian</option>
              <option value="Mingguan">Mingguan</option>
              <option value="Bulanan">Bulanan</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Target Jumlah Tugas (WO)</label>
            <input
              type="number"
              min={1}
              value={targetCount}
              onChange={(e) => setTargetCount(Number(e.target.value))}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Minimal SLA Tercapai (%)</label>
            <input
              type="number"
              min={50}
              max={100}
              value={minSlaPct}
              onChange={(e) => setMinSlaPct(Number(e.target.value))}
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Bonus Pencapaian Target (IDR)</label>
            <input
              type="number"
              min={0}
              step={5000}
              value={bonusAmountIdr}
              onChange={(e) => setBonusAmountIdr(Number(e.target.value))}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Bonus Ekstra / Tugas Tambahan (IDR)</label>
            <input
              type="number"
              min={0}
              step={1000}
              value={extraPerUnitIdr}
              onChange={(e) => setExtraPerUnitIdr(Number(e.target.value))}
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Status Aturan</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TechnicianBonusRule['status'])}
            className={inputCls}
          >
            <option value="Aktif">Aktif</option>
            <option value="Nonaktif">Nonaktif</option>
          </select>
        </div>

        <ModalActions onClose={onClose} submitLabel="Simpan Aturan Bonus" />
      </form>
    </ModalFrame>
  );
}

function InvoiceCrudModal({
  tenants,
  onClose,
  onSubmit,
}: {
  tenants: AdminTenantRecord[];
  onClose: () => void;
  onSubmit: (p: Omit<PlatformInvoiceRecord, 'id' | 'invoiceNumber'>) => void;
}) {
  const [tenantName, setTenantName] = useState(tenants[0]?.name ?? 'ISP Nusantara');
  const [category, setCategory] =
    useState<PlatformInvoiceRecord['category']>('AI Credits');
  const [amountIdr, setAmountIdr] = useState(6750000);
  const [dueDate, setDueDate] = useState('30 Nov 2026');

  return (
    <ModalFrame title="Terbitkan Invoice Korporat" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            tenantName,
            category,
            amountIdr: Number(amountIdr) || 0,
            dueDate,
            status: 'Menunggu Bayar',
          });
        }}
        className="space-y-3"
      >
        <div>
          <label className={labelCls}>Tenant Ditagih</label>
          <select
            value={tenantName}
            onChange={(e) => setTenantName(e.target.value)}
            className={inputCls}
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.name}>
                {t.name} ({t.contractNumber})
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Kategori</label>
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as PlatformInvoiceRecord['category'])
              }
              className={inputCls}
            >
              <option value="AI Credits">AI Credits (Top Up)</option>
              <option value="Kontrak Kerjasama">Kontrak Kerjasama</option>
              <option value="Managed Services">Managed Services</option>
              <option value="Payroll & Komisi">Payroll &amp; Komisi</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Nominal (IDR)</label>
            <input
              type="number"
              value={amountIdr}
              onChange={(e) => setAmountIdr(Number(e.target.value))}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Jatuh Tempo</label>
            <input
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <ModalActions onClose={onClose} submitLabel="Terbitkan Invoice" />
      </form>
    </ModalFrame>
  );
}

function ContractCrudModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: ContractDocumentRecord;
  onClose: () => void;
  onSubmit: (p: Omit<ContractDocumentRecord, 'id'> & { id?: string }) => void;
}) {
  const [docNumber, setDocNumber] = useState(initial?.docNumber ?? 'CTR-2026-022');
  const [docType, setDocType] = useState<ContractDocumentRecord['docType']>(
    initial?.docType ?? 'Kontrak'
  );
  const [tenantName, setTenantName] = useState(
    initial?.tenantName ?? 'PT ISP Nusantara'
  );
  const [title, setTitle] = useState(initial?.title ?? '');
  const [effectiveRange, setEffectiveRange] = useState(
    initial?.effectiveRange ?? '01 Des 2026 – 30 Nov 2027'
  );
  const [slaCommitment, setSlaCommitment] = useState(
    initial?.slaCommitment ?? 'Uptime ≥ 99,5%'
  );
  const [status, setStatus] = useState<ContractDocumentRecord['status']>(
    initial?.status ?? 'Aktif'
  );

  return (
    <ModalFrame
      title={initial ? `Edit Dokumen: ${initial.docNumber}` : 'Buat Dokumen Kontrak / SOW / SLA'}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            id: initial?.id,
            docNumber,
            docType,
            tenantName,
            title,
            effectiveRange,
            slaCommitment,
            status,
          });
        }}
        className="space-y-3"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className={labelCls}>No. Dokumen</label>
            <input
              required
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Jenis</label>
            <select
              value={docType}
              onChange={(e) =>
                setDocType(e.target.value as ContractDocumentRecord['docType'])
              }
              className={inputCls}
            >
              <option value="Kontrak">Kontrak</option>
              <option value="SOW">SOW</option>
              <option value="SLA">SLA</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as ContractDocumentRecord['status'])
              }
              className={inputCls}
            >
              <option value="Aktif">Aktif</option>
              <option value="Menunggu TTD">Menunggu TTD</option>
              <option value="Akan Berakhir">Akan Berakhir</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Judul Dokumen</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Tenant / Korporasi</label>
            <input
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Masa Berlaku</label>
            <input
              value={effectiveRange}
              onChange={(e) => setEffectiveRange(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Komitmen SLA</label>
          <input
            value={slaCommitment}
            onChange={(e) => setSlaCommitment(e.target.value)}
            className={inputCls}
          />
        </div>
        <ModalActions onClose={onClose} />
      </form>
    </ModalFrame>
  );
}

function CommissionSchemeCrudModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: CommissionSchemeRecord;
  onClose: () => void;
  onSubmit: (p: Omit<CommissionSchemeRecord, 'id'> & { id?: string }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [version, setVersion] = useState(initial?.version ?? 'v3.3');
  const [providerName, setProviderName] = useState(
    initial?.providerName ?? 'XL SMART Fiber'
  );
  const [productScope, setProductScope] = useState(
    initial?.productScope ?? 'FTTH, FWA, PXGY'
  );
  const [splitRule, setSplitRule] = useState(
    initial?.splitRule ?? '60% Affiliate / 40% Sales Incremental'
  );
  const [status, setStatus] = useState<CommissionSchemeRecord['status']>(
    initial?.status ?? 'Draft'
  );

  return (
    <ModalFrame
      title={initial ? `Revisi Skema: ${initial.name}` : 'Buat Skema Komisi Baru'}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            id: initial?.id,
            name,
            version,
            providerName,
            productScope,
            splitRule,
            tierBasis: initial?.tierBasis ?? 'Gabungan SA Deterministik',
            status,
            approvedBy: initial?.approvedBy ?? 'Platform Finance Admin',
          });
        }}
        className="space-y-3"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className={labelCls}>Nama Skema</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Versi</label>
            <input
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Provider</label>
            <input
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Cakupan Produk</label>
            <input
              value={productScope}
              onChange={(e) => setProductScope(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Aturan Split</label>
            <input
              value={splitRule}
              onChange={(e) => setSplitRule(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as CommissionSchemeRecord['status'])
              }
              className={inputCls}
            >
              <option value="Draft">Draft</option>
              <option value="Aktif">Aktif</option>
              <option value="Arsip">Arsip</option>
            </select>
          </div>
        </div>
        <ModalActions onClose={onClose} />
      </form>
    </ModalFrame>
  );
}

function IntegrationCrudModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: IntegrationConnectorRecord;
  onClose: () => void;
  onSubmit: (
    p: Omit<IntegrationConnectorRecord, 'id' | 'lastSyncAt'> & { id?: string }
  ) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState<IntegrationConnectorRecord['category']>(
    initial?.category ?? 'CRM'
  );
  const [authMethod, setAuthMethod] = useState(
    initial?.authMethod ?? 'OAuth 2.0 / HMAC Webhook'
  );
  const [endpointUrl, setEndpointUrl] = useState(
    initial?.endpointUrl ?? 'https://api.agentzy.id/v1/webhook'
  );
  const [healthStatus, setHealthStatus] = useState<
    IntegrationConnectorRecord['healthStatus']
  >(initial?.healthStatus ?? 'Terhubung');

  return (
    <ModalFrame
      title={initial ? `Edit Integrasi: ${initial.name}` : 'Tambah Konektor Integrasi'}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            id: initial?.id,
            name,
            category,
            authMethod,
            endpointUrl,
            healthStatus,
            webhookSuccessPct: initial?.webhookSuccessPct ?? 99.8,
          });
        }}
        className="space-y-3"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Nama Integrasi</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Kategori</label>
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as IntegrationConnectorRecord['category'])
              }
              className={inputCls}
            >
              <option value="CRM">CRM</option>
              <option value="Workspace">Workspace</option>
              <option value="Maps / Logistik">Maps / Logistik</option>
              <option value="Payment">Payment</option>
              <option value="ISP Core">ISP Core</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Endpoint URL</label>
          <input
            required
            value={endpointUrl}
            onChange={(e) => setEndpointUrl(e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Autentikasi</label>
            <input
              value={authMethod}
              onChange={(e) => setAuthMethod(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select
              value={healthStatus}
              onChange={(e) =>
                setHealthStatus(
                  e.target.value as IntegrationConnectorRecord['healthStatus']
                )
              }
              className={inputCls}
            >
              <option value="Terhubung">Terhubung</option>
              <option value="Degraded">Degraded</option>
              <option value="Terputus">Terputus</option>
            </select>
          </div>
        </div>
        <ModalActions onClose={onClose} />
      </form>
    </ModalFrame>
  );
}

function BreakGlassModal({
  tenants,
  permissionRegistry,
  onClose,
  onSubmit,
}: {
  tenants: AdminTenantRecord[];
  permissionRegistry: AgentzyPermissionDefinition[];
  onClose: () => void;
  onSubmit: (payload: {
    tenantIds: string[];
    permissionKeys: string[];
    reason: string;
    durationMinutes: number;
  }) => void;
}) {
  const [targetTenantId, setTargetTenantId] = useState(tenants[0]?.id ?? '');
  const [reason, setReason] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [permissionKeys, setPermissionKeys] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const emergencyPermissions = permissionRegistry.filter((permission) =>
    permission.key.startsWith('platform.') &&
    ['privileged', 'critical'].includes(permission.risk_level)
  );

  return (
    <ModalFrame
      title="Break-Glass Access (Akses Darurat Lintas Tenant)"
      subtitle="Time-bound · Approval terpisah · Scope permission eksplisit · Wajib ditinjau pasca-akses."
      onClose={onClose}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!targetTenantId) {
            setValidationError('Pilih tenant sasaran.');
            return;
          }
          if (permissionKeys.length === 0) {
            setValidationError('Pilih minimal satu permission platform dengan risiko tinggi.');
            return;
          }
          if (reason.trim().length < 20) {
            setValidationError('Alasan harus minimal 20 karakter.');
            return;
          }
          onSubmit({
            tenantIds: [targetTenantId],
            permissionKeys,
            reason: reason.trim(),
            durationMinutes,
          });
        }}
        className="space-y-3"
      >
        <div className="flex items-start gap-2 rounded-[10px] border border-[#B23A48]/30 bg-[#B23A48]/5 p-3 text-xs text-[#172B3A]">
          <AlertTriangle className="h-4 w-4 shrink-0 text-[#B23A48]" />
          <span>
            Emergency access hanya untuk investigasi insiden, dibatasi pada permission yang dipilih,
            membutuhkan approver berbeda, dan otomatis kedaluwarsa.
          </span>
        </div>
        {validationError && (
          <p role="alert" className="rounded-lg border border-[#B23A48]/30 bg-[#B23A48]/5 p-2 text-xs text-[#B23A48]">
            {validationError}
          </p>
        )}
        <div>
          <label className={labelCls}>Tenant Sasaran</label>
          <select
            required
            value={targetTenantId}
            onChange={(event) => setTargetTenantId(event.target.value)}
            className={inputCls}
          >
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name} ({tenant.code})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Permission Darurat</label>
          <div className="max-h-48 space-y-2 overflow-y-auto rounded-[10px] border border-[#D8E3E9] bg-white p-3">
            {emergencyPermissions.length === 0 ? (
              <p className="text-xs text-[#B23A48]">Permission registry belum tersedia atau tidak ada permission privileged/critical.</p>
            ) : emergencyPermissions.map((permission) => (
              <label key={permission.key} className="flex items-start gap-2 text-xs text-[#17324D]">
                <input
                  type="checkbox"
                  checked={permissionKeys.includes(permission.key)}
                  onChange={(event) => setPermissionKeys((current) =>
                    event.target.checked
                      ? [...current, permission.key]
                      : current.filter((key) => key !== permission.key)
                  )}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-semibold">{permission.key}</span>
                  <span className="block text-[11px] text-[#718391]">{permission.description ?? permission.risk_level}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className={labelCls}>Alasan Insiden / Investigasi</label>
          <textarea
            required
            minLength={20}
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Jelaskan ID insiden, kebutuhan darurat, dan ruang lingkup..."
            className="w-full rounded-[10px] border border-[#D8E3E9] bg-white p-3 text-xs text-[#172B3A] outline-none focus:border-[#0284C7]"
          />
        </div>
        <div>
          <label className={labelCls}>Batas Durasi Akses</label>
          <select
            value={durationMinutes}
            onChange={(event) => setDurationMinutes(Number(event.target.value))}
            className={inputCls}
          >
            <option value={15}>15 menit</option>
            <option value={30}>30 menit</option>
            <option value={60}>60 menit</option>
          </select>
        </div>
        <ModalActions onClose={onClose} submitLabel="Ajukan Break-Glass" danger />
      </form>
    </ModalFrame>
  );
}

function SecurityPolicyModal({
  ipAllowlist,
  ttlMinutes,
  onClose,
  onSubmit,
}: {
  ipAllowlist: boolean | null;
  ttlMinutes: number | null;
  onClose: () => void;
  onSubmit: (ipAllow: boolean, ttlMinutes: number) => void;
}) {
  const [ipAllow, setIpAllow] = useState(ipAllowlist ?? false);
  const [ttl, setTtl] = useState(ttlMinutes ?? 120);
  if (ipAllowlist === null || ttlMinutes === null) {
    return (
      <ModalFrame
        title="Kebijakan Keamanan Platform"
        subtitle="Konfigurasi hosted Supabase Auth belum tersedia untuk dibaca atau diubah melalui connector."
        onClose={onClose}
      >
        <div className="space-y-3 text-xs text-[#526675]">
          <p>Status IP allowlist dan session TTL tidak ditampilkan sebagai nilai default karena belum ada bukti konfigurasi aktual.</p>
          <p>Pengaturan harus diverifikasi dan diubah melalui Supabase Dashboard atau Management API yang berwenang. Tidak ada perubahan konfigurasi yang dilakukan dari modal ini.</p>
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className="h-9 rounded-lg border border-[#D8E3E9] px-4 text-xs font-semibold text-[#17324D]">Tutup</button>
          </div>
        </div>
      </ModalFrame>
    );
  }

  return (
    <ModalFrame
      title="Kebijakan Keamanan Platform"
      subtitle="Atur IP Allowlist admin panel dan TTL sesi autentikasi."
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(ipAllow, Number(ttl) || 120);
        }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between rounded-[10px] bg-[#F5F8FA] p-3.5 text-xs">
          <div>
            <p className="font-bold text-[#17324D]">IP Allowlist Super Admin</p>
            <p className="text-[#526675]">Batasi login Control Plane hanya dari VPN/IP terotorisasi</p>
          </div>
          <input
            type="checkbox"
            checked={ipAllow}
            onChange={(e) => setIpAllow(e.target.checked)}
            className="h-4 w-4 accent-[#0284C7]"
          />
        </div>
        <div>
          <label className={labelCls}>Session TTL (Menit)</label>
          <input
            type="number"
            min={15}
            max={480}
            value={ttl}
            onChange={(e) => setTtl(Number(e.target.value))}
            className={inputCls}
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-[#247A55]">
          <ShieldCheck className="h-4 w-4" />
          <span>Perubahan kebijakan otomatis tercatat di Audit Log.</span>
        </div>
        <ModalActions onClose={onClose} submitLabel="Simpan Kebijakan" />
      </form>
    </ModalFrame>
  );
}

function IncidentCrudModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (p: Omit<IncidentRecord, 'id' | 'reportedAt'>) => void;
}) {
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState<IncidentRecord['severity']>('Sedang');
  const [domain, setDomain] = useState<IncidentRecord['domain']>('AI Runtime');
  const [owner, setOwner] = useState('Platform SRE');

  return (
    <ModalFrame title="Catat Insiden Operasional" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            title,
            severity,
            domain,
            owner,
            status: 'Investigasi',
          });
        }}
        className="space-y-3"
      >
        <div>
          <label className={labelCls}>Judul Insiden</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Severity</label>
            <select
              value={severity}
              onChange={(e) =>
                setSeverity(e.target.value as IncidentRecord['severity'])
              }
              className={inputCls}
            >
              <option value="Kritis">Kritis</option>
              <option value="Tinggi">Tinggi</option>
              <option value="Sedang">Sedang</option>
              <option value="Rendah">Rendah</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Domain</label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value as IncidentRecord['domain'])}
              className={inputCls}
            >
              <option value="Security">Security</option>
              <option value="AI Runtime">AI Runtime</option>
              <option value="Integration">Integration</option>
              <option value="Finance">Finance</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Owner Tim</label>
            <input
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <ModalActions onClose={onClose} submitLabel="Buka Tiket Insiden" />
      </form>
    </ModalFrame>
  );
}

function VendorCrudModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: VendorSubprocessorRecord;
  onClose: () => void;
  onSubmit: (p: Omit<VendorSubprocessorRecord, 'id'> & { id?: string }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState(initial?.category ?? 'AI / Cloud Sub-processor');
  const [dataRegion, setDataRegion] = useState(initial?.dataRegion ?? 'Asia-Southeast1');
  const [dpaStatus, setDpaStatus] = useState<VendorSubprocessorRecord['dpaStatus']>(
    initial?.dpaStatus ?? 'Signed & Valid'
  );
  const [riskClass, setRiskClass] = useState<VendorSubprocessorRecord['riskClass']>(
    initial?.riskClass ?? 'Rendah'
  );

  return (
    <ModalFrame
      title={initial ? `Edit Vendor: ${initial.name}` : 'Tambah Vendor Sub-processor'}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            id: initial?.id,
            name,
            category,
            dataRegion,
            dpaStatus,
            riskClass,
          });
        }}
        className="space-y-3"
      >
        <div>
          <label className={labelCls}>Nama Vendor / Sub-processor</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Kategori Layanan</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Region Data</label>
            <input
              value={dataRegion}
              onChange={(e) => setDataRegion(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Status DPA</label>
            <select
              value={dpaStatus}
              onChange={(e) =>
                setDpaStatus(e.target.value as VendorSubprocessorRecord['dpaStatus'])
              }
              className={inputCls}
            >
              <option value="Signed & Valid">Signed &amp; Valid</option>
              <option value="Review Tahunan">Review Tahunan</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Risiko</label>
            <select
              value={riskClass}
              onChange={(e) =>
                setRiskClass(e.target.value as VendorSubprocessorRecord['riskClass'])
              }
              className={inputCls}
            >
              <option value="Rendah">Rendah</option>
              <option value="Sedang">Sedang</option>
            </select>
          </div>
        </div>
        <ModalActions onClose={onClose} />
      </form>
    </ModalFrame>
  );
}
