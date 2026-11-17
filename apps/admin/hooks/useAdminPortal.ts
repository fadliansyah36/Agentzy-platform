'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  COMPENSATION_STORAGE_EVENT,
  loadCorporateCompensationSchemas,
  loadTechnicianBonusRules,
  saveCorporateCompensationSchemas,
  saveTechnicianBonusRules,
  type CorporateCompensationSchema,
  type TechnicianBonusRule,
} from '@/lib/corporate-compensation';
import { adminPortalService } from '../services/admin-service';
import type {
  AdminAIWorkerRecord,
  AdminCreditLedgerItem,
  AdminIspProviderRecord,
  AdminSectionId,
  AdminTenantRecord,
  AdminWorkflowApprovalRecord,
  AdminWorkflowRecord,
  AdminWorkflowRunRecord,
  AuditLogRecord,
  BreakGlassRequestRecord,
  CommissionSchemeRecord,
  ContractDocumentRecord,
  CooperationPolicyRecord,
  CreditPricingRuleRecord,
  CreditTopUpPackageRecord,
  DsrRequestRecord,
  FeatureFlagRecord,
  FinanceReconciliationItem,
  HumanStaffRecord,
  IncidentRecord,
  IntegrationConnectorRecord,
  KnowledgeSourceRecord,
  LLMProviderRecord,
  MasterIndustryItem,
  MasterProductItem,
  MasterServiceItem,
  MemoryGovernancePolicy,
  MemoryLayerRecord,
  ModelRegistryRecord,
  ModelRoutingRuleRecord,
  OrgUnitRecord,
  PlatformInvoiceRecord,
  PlatformUserRecord,
  RbacRoleRecord,
  SkillRegistryRecord,
  SuperAdminRoleKey,
  ToolRegistryRecord,
  VendorSubprocessorRecord,
  WebhookLogRecord,
} from '../lib/admin-types';

export type AdminModalState =
  | { type: 'none' }
  | { type: 'quick-action' }
  | { type: 'tenant-crud'; tenant?: AdminTenantRecord }
  | { type: 'tenant-detail'; tenantId: string }
  | { type: 'provider-crud'; provider?: AdminIspProviderRecord }
  | { type: 'industry-crud'; industry?: MasterIndustryItem }
  | { type: 'service-crud'; service?: MasterServiceItem }
  | { type: 'product-crud'; product?: MasterProductItem }
  | { type: 'cooperation-policy-crud'; policy?: CooperationPolicyRecord }
  | { type: 'org-unit-crud'; unit?: OrgUnitRecord }
  | { type: 'user-crud'; user?: PlatformUserRecord }
  | { type: 'role-crud'; role?: RbacRoleRecord }
  | { type: 'staff-crud'; staff?: HumanStaffRecord }
  | { type: 'ai-worker-crud'; worker?: AdminAIWorkerRecord }
  | { type: 'llm-provider-crud'; provider?: LLMProviderRecord }
  | { type: 'model-crud'; model?: ModelRegistryRecord }
  | { type: 'routing-rule-crud'; rule?: ModelRoutingRuleRecord }
  | { type: 'skill-crud'; skill?: SkillRegistryRecord }
  | { type: 'tool-crud'; tool?: ToolRegistryRecord }
  | { type: 'knowledge-crud'; source?: KnowledgeSourceRecord }
  | { type: 'workflow-crud'; workflow?: AdminWorkflowRecord }
  | { type: 'credit-topup'; presetTenantName?: string; presetCredits?: number }
  | { type: 'credit-pricing-crud'; rule?: CreditPricingRuleRecord }
  | { type: 'invoice-crud' }
  | { type: 'invoice-detail'; invoiceId: string }
  | { type: 'contract-crud'; doc?: ContractDocumentRecord }
  | { type: 'commission-scheme-crud'; scheme?: CommissionSchemeRecord }
  | { type: 'corp-comp-crud'; schema?: CorporateCompensationSchema }
  | { type: 'tech-bonus-crud'; rule?: TechnicianBonusRule }
  | { type: 'integration-crud'; connector?: IntegrationConnectorRecord }
  | { type: 'break-glass-request' }
  | { type: 'security-policy' }
  | { type: 'audit-detail'; logId: string }
  | { type: 'incident-crud' }
  | { type: 'vendor-crud'; vendor?: VendorSubprocessorRecord };

export function useAdminPortal(initialSection: AdminSectionId = 'overview') {
  const initial = useMemo(() => adminPortalService.getInitialCollections(), []);
  const idCounter = useRef(800);

  const nextId = (prefix: string) => {
    idCounter.current += 1;
    return `${prefix}-${idCounter.current}`;
  };

  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [adminRole, setAdminRole] = useState<SuperAdminRoleKey>('platform_super_admin');
  const [adminEmail, setAdminEmail] = useState('superadmin@agentzy.id');
  const [activeSection, setActiveSection] = useState<AdminSectionId>(initialSection);
  const [modal, setModal] = useState<AdminModalState>({ type: 'none' });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Core collections
  const [tenants, setTenants] = useState<AdminTenantRecord[]>(initial.tenants);
  const [providers, setProviders] = useState<AdminIspProviderRecord[]>(initial.providers);
  const [industries, setIndustries] = useState<MasterIndustryItem[]>(initial.industries);
  const [services, setServices] = useState<MasterServiceItem[]>(initial.services);
  const [products, setProducts] = useState<MasterProductItem[]>(initial.products);
  const [cooperationPolicies, setCooperationPolicies] = useState<CooperationPolicyRecord[]>(
    initial.cooperationPolicies
  );
  const [orgUnits, setOrgUnits] = useState<OrgUnitRecord[]>(initial.orgUnits);
  const [users, setUsers] = useState<PlatformUserRecord[]>(initial.users);
  const [roles, setRoles] = useState<RbacRoleRecord[]>(initial.roles);
  const [staffList, setStaffList] = useState<HumanStaffRecord[]>(initial.staff);
  const [aiWorkers, setAiWorkers] = useState<AdminAIWorkerRecord[]>(initial.aiWorkers);
  const [selectedAiWorkerId, setSelectedAiWorkerId] = useState<string>(
    initial.aiWorkers[0]?.id ?? ''
  );

  // AI Platform & Runtime
  const [llmProviders, setLlmProviders] = useState<LLMProviderRecord[]>(initial.llmProviders);
  const [models, setModels] = useState<ModelRegistryRecord[]>(initial.models);
  const [routingPolicyName, setRoutingPolicyName] = useState<string>('Smart Auto (Default)');
  const [routingFallbackEnabled, setRoutingFallbackEnabled] = useState<boolean>(true);
  const [routingActive, setRoutingActive] = useState<boolean>(true);
  const [routingRules, setRoutingRules] = useState<ModelRoutingRuleRecord[]>(initial.routingRules);
  const [skills, setSkills] = useState<SkillRegistryRecord[]>(initial.skills);
  const [tools, setTools] = useState<ToolRegistryRecord[]>(initial.tools);
  const [memoryPolicy, setMemoryPolicy] = useState<MemoryGovernancePolicy>(initial.memoryPolicy);
  const [memoryLayers, setMemoryLayers] = useState<MemoryLayerRecord[]>(initial.memoryLayers);
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSourceRecord[]>(
    initial.knowledgeSources
  );
  const [workflows, setWorkflows] = useState<AdminWorkflowRecord[]>(initial.workflows);
  const [workflowRuns, setWorkflowRuns] = useState<AdminWorkflowRunRecord[]>(initial.workflowRuns);
  const [workflowApprovals, setWorkflowApprovals] = useState<AdminWorkflowApprovalRecord[]>(
    initial.workflowApprovals
  );

  // Finance, Top Up AI Credits, Contracts, Corporate Compensation & Tech Bonus
  const [platformCreditsBalance, setPlatformCreditsBalance] = useState<number>(1250000);
  const [platformCreditsUsedMonth] = useState<number>(749500);
  const [creditPricingRules, setCreditPricingRules] = useState<CreditPricingRuleRecord[]>(
    initial.creditPricingRules
  );
  const [creditLedger, setCreditLedger] = useState<AdminCreditLedgerItem[]>(initial.creditLedger);
  const [creditTopUpPackages] = useState<CreditTopUpPackageRecord[]>(
    initial.creditTopUpPackages
  );
  const [invoices, setInvoices] = useState<PlatformInvoiceRecord[]>(initial.invoices);
  const [reconciliations, setReconciliations] = useState<FinanceReconciliationItem[]>(
    initial.reconciliations
  );
  const [contracts, setContracts] = useState<ContractDocumentRecord[]>(initial.contracts);
  const [commissionSchemes, setCommissionSchemes] = useState<CommissionSchemeRecord[]>(
    initial.commissionSchemes
  );
  const [corporateSchemas, setCorporateSchemas] = useState<CorporateCompensationSchema[]>(() =>
    loadCorporateCompensationSchemas()
  );
  const [technicianBonusRules, setTechnicianBonusRules] = useState<TechnicianBonusRule[]>(() =>
    loadTechnicianBonusRules()
  );

  useEffect(() => {
    const syncFromStorage = () => {
      setCorporateSchemas(loadCorporateCompensationSchemas());
      setTechnicianBonusRules(loadTechnicianBonusRules());
    };
    window.addEventListener(COMPENSATION_STORAGE_EVENT, syncFromStorage);
    window.addEventListener('storage', syncFromStorage);
    return () => {
      window.removeEventListener(COMPENSATION_STORAGE_EVENT, syncFromStorage);
      window.removeEventListener('storage', syncFromStorage);
    };
  }, []);

  // Integrations, Security, Audit, Data Governance
  const [integrations, setIntegrations] = useState<IntegrationConnectorRecord[]>(
    initial.integrations
  );
  const [webhookLogs, setWebhookLogs] = useState<WebhookLogRecord[]>(initial.webhookLogs);
  const [mfaEnforced, setMfaEnforced] = useState<boolean>(true);
  const [activeSessionsCount, setActiveSessionsCount] = useState<number>(18);
  const [ipAllowlistEnabled, setIpAllowlistEnabled] = useState<boolean>(true);
  const [sessionTtlMinutes, setSessionTtlMinutes] = useState<number>(120);
  const [breakGlassRequests, setBreakGlassRequests] = useState<BreakGlassRequestRecord[]>(
    initial.breakGlassRequests
  );
  const [featureFlags, setFeatureFlags] = useState<FeatureFlagRecord[]>(initial.featureFlags);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>(initial.auditLogs);
  const [incidents, setIncidents] = useState<IncidentRecord[]>(initial.incidents);
  const [dsrRequests, setDsrRequests] = useState<DsrRequestRecord[]>(initial.dsrRequests);
  const [vendors, setVendors] = useState<VendorSubprocessorRecord[]>(initial.vendors);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3600);
  }, []);

  const appendAudit = useCallback(
    (
      action: string,
      targetResource: string,
      tenantScope: string,
      diffSummary: string,
      result: AuditLogRecord['result'] = 'Sukses'
    ) => {
      const entry: AuditLogRecord = {
        id: nextId('aud'),
        action,
        actorEmail: adminEmail,
        targetResource,
        tenantScope,
        timestamp: 'Baru saja · 17 Nov 2026',
        result,
        diffSummary,
      };
      setAuditLogs((prev) => [entry, ...prev]);
    },
    [adminEmail]
  );

  const navigateTo = useCallback((section: AdminSectionId) => {
    setActiveSection(section);
    setModal({ type: 'none' });
  }, []);

  const handleLogin = useCallback(
    (role: SuperAdminRoleKey, email: string) => {
      setAdminRole(role);
      setAdminEmail(email);
      setIsAuthenticated(true);
      setActiveSection('overview');
      showToast(`Masuk ke Super Admin Control Plane sebagai ${email}.`);
    },
    [showToast]
  );

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setActiveSection('login');
    setModal({ type: 'none' });
  }, []);

  // Tenant CRUD
  const upsertTenant = useCallback(
    (payload: Omit<AdminTenantRecord, 'id' | 'createdAt'> & { id?: string }) => {
      if (payload.id) {
        setTenants((prev) =>
          prev.map((t) => (t.id === payload.id ? { ...t, ...payload } : t))
        );
        appendAudit('Update Tenant', payload.name, payload.name, `status: ${payload.status}`);
        showToast(`Tenant ${payload.name} diperbarui.`);
      } else {
        const created: AdminTenantRecord = {
          ...payload,
          id: nextId('ten'),
          createdAt: '17 Nov 2026',
        };
        setTenants((prev) => [created, ...prev]);
        appendAudit('Tambah Tenant', created.name, created.name, `kontrak: ${created.contractNumber}`);
        showToast(`Tenant ${created.name} berhasil dibuat.`);
      }
      setModal({ type: 'none' });
    },
    [appendAudit, showToast]
  );

  const deleteTenant = useCallback(
    (tenantId: string) => {
      const target = tenants.find((t) => t.id === tenantId);
      setTenants((prev) => prev.filter((t) => t.id !== tenantId));
      if (target) {
        appendAudit('Hapus Tenant', target.name, target.name, `code: ${target.code}`);
        showToast(`Tenant ${target.name} dihapus dari direktori.`);
      }
      setModal({ type: 'none' });
    },
    [appendAudit, showToast, tenants]
  );

  // Onboarding Wizard submit
  const processCorporateOnboarding = useCallback(
    (payload: {
      companyName: string;
      domain: string;
      clientType: AdminTenantRecord['clientType'];
      cooperationModel: AdminTenantRecord['cooperationModel'];
      contractNumber: string;
      initialCreditsTopUp: number;
      industry: string;
      region: string;
      adminEmailInvite: string;
    }) => {
      const cooperationLabel =
        payload.cooperationModel === 'Kontrak Managed End-to-End'
          ? 'Kontrak Managed E2E'
          : payload.cooperationModel === 'Kontrak Field & Sales'
            ? 'Kontrak Field & Sales'
            : 'Kontrak Pilot Kemitraan';
      const created: AdminTenantRecord = {
        id: nextId('ten'),
        code: `TEN-${Math.floor(100 + Math.random() * 899)}`,
        name: payload.companyName,
        legalName: payload.companyName,
        domain: payload.domain || 'partner.agentzy.id',
        industry: payload.industry,
        clientType: payload.clientType,
        cooperationModel: payload.cooperationModel,
        cooperationLabel,
        contractNumber: payload.contractNumber || `CTR-2026-${Math.floor(100 + Math.random() * 899)}`,
        status: payload.cooperationModel === 'Kontrak Pilot Kemitraan' ? 'Trial' : 'Aktif',
        region: payload.region || 'Jabodetabek',
        humanCount: 0,
        aiWorkerCount: 2,
        creditsBalance: payload.initialCreditsTopUp || 50000,
        monthlyCreditsUsed: 0,
        slaScore: 99.0,
        createdAt: '17 Nov 2026',
      };
      setTenants((prev) => [created, ...prev]);
      appendAudit(
        'Proses Onboarding Korporat',
        created.name,
        created.name,
        `kontrak: ${created.contractNumber}; topUpAwal: ${created.creditsBalance} credits; adminInvite: ${payload.adminEmailInvite}`
      );
      showToast(`Onboarding ${created.name} (${created.contractNumber}) selesai & saldo AI Credits aktif.`);
      navigateTo('tenants');
    },
    [appendAudit, navigateTo, showToast]
  );

  // ISP Provider CRUD
  const upsertIspProvider = useCallback(
    (payload: Omit<AdminIspProviderRecord, 'id'> & { id?: string }) => {
      if (payload.id) {
        setProviders((prev) =>
          prev.map((p) => (p.id === payload.id ? { ...p, ...payload } : p))
        );
        showToast(`Provider ${payload.name} diperbarui.`);
      } else {
        setProviders((prev) => [{ ...payload, id: nextId('prov') }, ...prev]);
        showToast(`Provider ${payload.name} ditambahkan.`);
      }
      appendAudit('Kelola ISP Provider', payload.name, 'Global Platform', `status: ${payload.status}`);
      setModal({ type: 'none' });
    },
    [appendAudit, showToast]
  );

  const deleteIspProvider = useCallback(
    (id: string) => {
      setProviders((prev) => prev.filter((p) => p.id !== id));
      showToast('Provider dihapus dari registry.');
    },
    [showToast]
  );

  // Master Data CRUD
  const upsertIndustry = useCallback(
    (payload: Omit<MasterIndustryItem, 'id'> & { id?: string }) => {
      if (payload.id) {
        setIndustries((prev) => prev.map((i) => (i.id === payload.id ? { ...i, ...payload } : i)));
        showToast(`Industri ${payload.name} diperbarui.`);
      } else {
        setIndustries((prev) => [{ ...payload, id: nextId('ind') }, ...prev]);
        showToast(`Industri ${payload.name} ditambahkan.`);
      }
      setModal({ type: 'none' });
    },
    [showToast]
  );

  const deleteIndustry = useCallback(
    (id: string) => {
      setIndustries((prev) => prev.filter((i) => i.id !== id));
      showToast('Data industri dihapus.');
    },
    [showToast]
  );

  const upsertMasterService = useCallback(
    (payload: Omit<MasterServiceItem, 'id'> & { id?: string }) => {
      if (payload.id) {
        setServices((prev) => prev.map((s) => (s.id === payload.id ? { ...s, ...payload } : s)));
        showToast(`Layanan ${payload.name} diperbarui.`);
      } else {
        setServices((prev) => [{ ...payload, id: nextId('svc') }, ...prev]);
        showToast(`Layanan ${payload.name} ditambahkan.`);
      }
      setModal({ type: 'none' });
    },
    [showToast]
  );

  const deleteMasterService = useCallback(
    (id: string) => {
      setServices((prev) => prev.filter((s) => s.id !== id));
      showToast('Master layanan dihapus.');
    },
    [showToast]
  );

  const upsertMasterProduct = useCallback(
    (payload: Omit<MasterProductItem, 'id'> & { id?: string }) => {
      if (payload.id) {
        setProducts((prev) => prev.map((p) => (p.id === payload.id ? { ...p, ...payload } : p)));
        showToast(`Produk ${payload.name} diperbarui.`);
      } else {
        setProducts((prev) => [{ ...payload, id: nextId('prd') }, ...prev]);
        showToast(`Produk ${payload.name} ditambahkan.`);
      }
      setModal({ type: 'none' });
    },
    [showToast]
  );

  const deleteMasterProduct = useCallback(
    (id: string) => {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast('Master produk dihapus.');
    },
    [showToast]
  );

  // Cooperation Policy CRUD (No SaaS Subscription)
  const upsertCooperationPolicy = useCallback(
    (payload: Omit<CooperationPolicyRecord, 'id'> & { id?: string }) => {
      if (payload.id) {
        setCooperationPolicies((prev) =>
          prev.map((p) => (p.id === payload.id ? { ...p, ...payload } : p))
        );
        showToast(`Profil kontrak ${payload.name} diperbarui.`);
      } else {
        setCooperationPolicies((prev) => [...prev, { ...payload, id: nextId('coop') }]);
        showToast(`Profil kontrak ${payload.name} dibuat.`);
      }
      appendAudit(
        'Kelola Profil Kontrak Kerjasama',
        payload.name,
        'Global Platform',
        `kuota kredit awal: ${payload.includedAiCreditsMonthly}`
      );
      setModal({ type: 'none' });
    },
    [appendAudit, showToast]
  );

  const toggleCooperationEntitlement = useCallback(
    (policyId: string, entitlementKey: keyof CooperationPolicyRecord['entitlements']) => {
      setCooperationPolicies((prev) =>
        prev.map((p) =>
          p.id === policyId
            ? {
                ...p,
                entitlements: {
                  ...p.entitlements,
                  [entitlementKey]: !p.entitlements[entitlementKey],
                },
              }
            : p
        )
      );
      showToast('Entitlement modul kontrak kerjasama diperbarui.');
    },
    [showToast]
  );

  // Org & User CRUD
  const upsertOrgUnit = useCallback(
    (payload: Omit<OrgUnitRecord, 'id'> & { id?: string }) => {
      if (payload.id) {
        setOrgUnits((prev) => prev.map((u) => (u.id === payload.id ? { ...u, ...payload } : u)));
        showToast(`Unit ${payload.name} diperbarui.`);
      } else {
        setOrgUnits((prev) => [{ ...payload, id: nextId('org') }, ...prev]);
        showToast(`Unit ${payload.name} ditambahkan.`);
      }
      setModal({ type: 'none' });
    },
    [showToast]
  );

  const deleteOrgUnit = useCallback(
    (id: string) => {
      setOrgUnits((prev) => prev.filter((u) => u.id !== id));
      showToast('Unit organisasi dihapus.');
    },
    [showToast]
  );

  const upsertPlatformUser = useCallback(
    (payload: Omit<PlatformUserRecord, 'id' | 'lastLogin'> & { id?: string }) => {
      if (payload.id) {
        setUsers((prev) =>
          prev.map((u) => (u.id === payload.id ? { ...u, ...payload } : u))
        );
        showToast(`Pengguna ${payload.name} diperbarui.`);
      } else {
        setUsers((prev) => [
          { ...payload, id: nextId('usr'), lastLogin: 'Undangan dikirim' },
          ...prev,
        ]);
        showToast(`Pengguna ${payload.name} ditambahkan & undangan MFA dikirim.`);
      }
      setModal({ type: 'none' });
    },
    [showToast]
  );

  const deletePlatformUser = useCallback(
    (id: string) => {
      const target = users.find((u) => u.id === id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      if (target) {
        appendAudit('Hapus Pengguna Platform', target.name, target.tenantName, `email: ${target.email}`);
        showToast(`Pengguna ${target.name} dihapus.`);
      }
    },
    [appendAudit, showToast, users]
  );

  // RBAC CRUD & Matrix
  const upsertRbacRole = useCallback(
    (payload: Omit<RbacRoleRecord, 'id' | 'userCount' | 'isSystemRole'> & { id?: string }) => {
      if (payload.id) {
        setRoles((prev) => prev.map((r) => (r.id === payload.id ? { ...r, ...payload } : r)));
        showToast(`Role ${payload.name} diperbarui.`);
      } else {
        setRoles((prev) => [
          ...prev,
          { ...payload, id: nextId('role'), userCount: 0, isSystemRole: false },
        ]);
        showToast(`Role baru ${payload.name} dibuat.`);
      }
      appendAudit('Kelola RBAC Role', payload.name, payload.scopeType, `key: ${payload.key}`);
      setModal({ type: 'none' });
    },
    [appendAudit, showToast]
  );

  const deleteRbacRole = useCallback(
    (id: string) => {
      const target = roles.find((r) => r.id === id);
      if (target?.isSystemRole) {
        showToast('System role inti tidak dapat dihapus.');
        return;
      }
      setRoles((prev) => prev.filter((r) => r.id !== id));
      if (target) {
        appendAudit('Hapus RBAC Role', target.name, target.scopeType, `key: ${target.key}`);
        showToast(`Role ${target.name} dihapus.`);
      }
    },
    [appendAudit, roles, showToast]
  );

  const cycleRolePermission = useCallback(
    (roleId: string, resourceKey: string) => {
      const levels: Array<'F' | 'C/U' | 'A' | 'R' | 'S' | '---'> = ['F', 'C/U', 'A', 'R', 'S', '---'];
      setRoles((prev) =>
        prev.map((r) => {
          if (r.id !== roleId) return r;
          const current = r.permissions[resourceKey] ?? '---';
          const next = levels[(levels.indexOf(current) + 1) % levels.length];
          return {
            ...r,
            permissions: {
              ...r.permissions,
              [resourceKey]: next,
            },
          };
        })
      );
      showToast('Permission matrix RBAC diperbarui.');
    },
    [showToast]
  );

  // Human Workforce CRUD & Verify
  const upsertHumanStaff = useCallback(
    (payload: Omit<HumanStaffRecord, 'id'> & { id?: string }) => {
      if (payload.id) {
        setStaffList((prev) => prev.map((s) => (s.id === payload.id ? { ...s, ...payload } : s)));
        showToast(`Data staff ${payload.name} diperbarui.`);
      } else {
        setStaffList((prev) => [{ ...payload, id: nextId('stf') }, ...prev]);
        showToast(`Staff ${payload.name} ditambahkan ke direktori.`);
      }
      setModal({ type: 'none' });
    },
    [showToast]
  );

  const verifyHumanStaff = useCallback(
    (staffId: string, approved: boolean) => {
      setStaffList((prev) =>
        prev.map((s) =>
          s.id === staffId
            ? {
                ...s,
                verificationStatus: approved ? 'Terverifikasi' : 'Ditolak',
                lifecycleStatus: approved ? 'Aktif' : 'Nonaktif',
              }
            : s
        )
      );
      appendAudit(
        'Verifikasi Human Workforce',
        staffId,
        'Workforce Ops',
        `approved: ${approved}`
      );
      showToast(approved ? 'Identitas & Passport staff disetujui.' : 'Verifikasi staff ditolak.');
    },
    [appendAudit, showToast]
  );

  const deleteHumanStaff = useCallback(
    (id: string) => {
      const target = staffList.find((s) => s.id === id);
      setStaffList((prev) => prev.filter((s) => s.id !== id));
      if (target) {
        appendAudit('Hapus Human Workforce', target.name, target.tenantName, target.workerCode);
        showToast(`Staff ${target.name} dihapus dari direktori.`);
      }
    },
    [appendAudit, showToast, staffList]
  );

  // AI Worker CRUD & Lifecycle
  const upsertAiWorker = useCallback(
    (payload: Omit<AdminAIWorkerRecord, 'id'> & { id?: string }) => {
      if (payload.id) {
        setAiWorkers((prev) => prev.map((w) => (w.id === payload.id ? { ...w, ...payload } : w)));
        showToast(`Konfigurasi ${payload.name} disimpan.`);
      } else {
        const created: AdminAIWorkerRecord = { ...payload, id: nextId('aiw') };
        setAiWorkers((prev) => [created, ...prev]);
        setSelectedAiWorkerId(created.id);
        showToast(`AI Worker ${created.name} berhasil didaftarkan.`);
      }
      appendAudit('Kelola AI Worker', payload.name, payload.tenantName, `status: ${payload.lifecycleStatus}`);
      setModal({ type: 'none' });
    },
    [appendAudit, showToast]
  );

  const deleteAiWorker = useCallback(
    (workerId: string) => {
      const target = aiWorkers.find((w) => w.id === workerId);
      setAiWorkers((prev) => {
        const next = prev.filter((w) => w.id !== workerId);
        if (selectedAiWorkerId === workerId) {
          setSelectedAiWorkerId(next[0]?.id ?? '');
        }
        return next;
      });
      if (target) {
        appendAudit('Hapus AI Worker', target.name, target.tenantName, target.workerKey);
        showToast(`AI Worker ${target.name} dihapus dari registry.`);
      }
      if (activeSection === 'ai-worker-detail') {
        navigateTo('ai-workers');
      }
    },
    [activeSection, aiWorkers, appendAudit, navigateTo, selectedAiWorkerId, showToast]
  );

  const toggleAiWorkerStatus = useCallback(
    (workerId: string) => {
      setAiWorkers((prev) =>
        prev.map((w) => {
          if (w.id !== workerId) return w;
          const next = w.lifecycleStatus === 'Aktif' ? 'Paused' : 'Aktif';
          appendAudit('Ubah Status AI Worker', w.name, w.tenantName, `${w.lifecycleStatus} → ${next}`);
          return { ...w, lifecycleStatus: next };
        })
      );
      showToast('Status operasional AI Worker diperbarui.');
    },
    [appendAudit, showToast]
  );

  const updateAiWorkerLifecycle = useCallback(
    (workerId: string, nextStatus: AdminAIWorkerRecord['lifecycleStatus']) => {
      setAiWorkers((prev) =>
        prev.map((w) => (w.id === workerId ? { ...w, lifecycleStatus: nextStatus } : w))
      );
      appendAudit('Transisi Lifecycle AI Worker', workerId, 'AI Governance', `state → ${nextStatus}`);
      showToast(`Lifecycle AI Worker berubah menjadi ${nextStatus}.`);
    },
    [appendAudit, showToast]
  );

  // LLM Provider & Model Registry CRUD
  const upsertLlmProvider = useCallback(
    (payload: Omit<LLMProviderRecord, 'id'> & { id?: string }) => {
      if (payload.id) {
        setLlmProviders((prev) =>
          prev.map((p) => (p.id === payload.id ? { ...p, ...payload } : p))
        );
        showToast(`LLM Provider ${payload.name} diperbarui.`);
      } else {
        setLlmProviders((prev) => [{ ...payload, id: nextId('llm') }, ...prev]);
        showToast(`LLM Provider ${payload.name} didaftarkan.`);
      }
      appendAudit('Kelola LLM Provider', payload.name, 'AI Gateway', `status: ${payload.status}`);
      setModal({ type: 'none' });
    },
    [appendAudit, showToast]
  );

  const deleteLlmProvider = useCallback(
    (id: string) => {
      setLlmProviders((prev) => prev.filter((p) => p.id !== id));
      showToast('LLM Provider dihapus.');
    },
    [showToast]
  );

  const upsertModel = useCallback(
    (payload: Omit<ModelRegistryRecord, 'id'> & { id?: string }) => {
      if (payload.id) {
        setModels((prev) => prev.map((m) => (m.id === payload.id ? { ...m, ...payload } : m)));
        showToast(`Model ${payload.name} diperbarui.`);
      } else {
        setModels((prev) => [{ ...payload, id: nextId('mdl') }, ...prev]);
        showToast(`Model ${payload.name} ditambahkan ke registry.`);
      }
      appendAudit('Kelola Model Registry', payload.name, 'AI Gateway', `status: ${payload.status}`);
      setModal({ type: 'none' });
    },
    [appendAudit, showToast]
  );

  const toggleModelStatus = useCallback(
    (modelId: string) => {
      setModels((prev) =>
        prev.map((m) => {
          if (m.id !== modelId) return m;
          const next = m.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
          appendAudit('Aktivasi Model', m.name, 'Global Platform', `${m.status} → ${next}`);
          return { ...m, status: next };
        })
      );
      showToast('Status allowlist model diperbarui.');
    },
    [appendAudit, showToast]
  );

  const deleteModel = useCallback(
    (id: string) => {
      setModels((prev) => prev.filter((m) => m.id !== id));
      showToast('Model dihapus dari registry.');
    },
    [showToast]
  );

  // Model Router Rules CRUD
  const upsertRoutingRule = useCallback(
    (payload: Omit<ModelRoutingRuleRecord, 'id'> & { id?: string }) => {
      if (payload.id) {
        setRoutingRules((prev) =>
          prev.map((r) => (r.id === payload.id ? { ...r, ...payload } : r))
        );
        showToast(`Aturan routing "${payload.taskCategory}" diperbarui.`);
      } else {
        setRoutingRules((prev) => [...prev, { ...payload, id: nextId('rr') }]);
        showToast(`Aturan routing baru ditambahkan.`);
      }
      setModal({ type: 'none' });
    },
    [showToast]
  );

  const toggleRoutingRule = useCallback(
    (ruleId: string) => {
      setRoutingRules((prev) =>
        prev.map((r) => (r.id === ruleId ? { ...r, active: !r.active } : r))
      );
      showToast('Status aturan routing diperbarui.');
    },
    [showToast]
  );

  const deleteRoutingRule = useCallback(
    (id: string) => {
      setRoutingRules((prev) => prev.filter((r) => r.id !== id));
      showToast('Aturan routing dihapus.');
    },
    [showToast]
  );

  // Skills & Tools CRUD
  const upsertSkill = useCallback(
    (payload: Omit<SkillRegistryRecord, 'id'> & { id?: string }) => {
      if (payload.id) {
        setSkills((prev) => prev.map((s) => (s.id === payload.id ? { ...s, ...payload } : s)));
        showToast(`Skill ${payload.name} diperbarui.`);
      } else {
        setSkills((prev) => [{ ...payload, id: nextId('skl') }, ...prev]);
        showToast(`Skill ${payload.name} ditambahkan ke registry.`);
      }
      setModal({ type: 'none' });
    },
    [showToast]
  );

  const decideSkillApproval = useCallback(
    (skillId: string, status: 'Disetujui' | 'Ditolak') => {
      setSkills((prev) =>
        prev.map((s) => (s.id === skillId ? { ...s, approvalStatus: status } : s))
      );
      appendAudit('Approval Skill Registry', skillId, 'AI Governance', `status → ${status}`);
      showToast(`Skill ${status.toLowerCase()}.`);
    },
    [appendAudit, showToast]
  );

  const deleteSkill = useCallback(
    (id: string) => {
      setSkills((prev) => prev.filter((s) => s.id !== id));
      showToast('Skill dihapus dari registry.');
    },
    [showToast]
  );

  const upsertTool = useCallback(
    (payload: Omit<ToolRegistryRecord, 'id'> & { id?: string }) => {
      if (payload.id) {
        setTools((prev) => prev.map((t) => (t.id === payload.id ? { ...t, ...payload } : t)));
        showToast(`Tool ${payload.name} diperbarui.`);
      } else {
        setTools((prev) => [{ ...payload, id: nextId('tl') }, ...prev]);
        showToast(`Tool ${payload.name} didaftarkan.`);
      }
      setModal({ type: 'none' });
    },
    [showToast]
  );

  const deleteTool = useCallback(
    (id: string) => {
      setTools((prev) => prev.filter((t) => t.id !== id));
      showToast('Tool dihapus dari registry.');
    },
    [showToast]
  );

  // Knowledge RAG & Memory
  const upsertKnowledgeSource = useCallback(
    (payload: Omit<KnowledgeSourceRecord, 'id' | 'lastIndexedAt'> & { id?: string }) => {
      if (payload.id) {
        setKnowledgeSources((prev) =>
          prev.map((k) =>
            k.id === payload.id
              ? { ...k, ...payload, lastIndexedAt: 'Baru saja' }
              : k
          )
        );
        showToast(`Sumber knowledge ${payload.name} diperbarui.`);
      } else {
        setKnowledgeSources((prev) => [
          { ...payload, id: nextId('kng'), lastIndexedAt: 'Baru saja' },
          ...prev,
        ]);
        showToast(`Sumber knowledge ${payload.name} mulai diindeks ke pgvector.`);
      }
      setModal({ type: 'none' });
    },
    [showToast]
  );

  const reindexKnowledgeSource = useCallback(
    (sourceId: string) => {
      setKnowledgeSources((prev) =>
        prev.map((k) =>
          k.id === sourceId
            ? { ...k, indexedPct: 100, status: 'Terindeks', lastIndexedAt: 'Baru saja' }
            : k
        )
      );
      showToast('Sinkronisasi & indexing ulang pgvector selesai (100%).');
    },
    [showToast]
  );

  const deleteKnowledgeSource = useCallback(
    (id: string) => {
      setKnowledgeSources((prev) => prev.filter((k) => k.id !== id));
      showToast('Sumber dokumen & chunk vektor dihapus (propagation aktif).');
    },
    [showToast]
  );

  // Workflows & Approvals
  const upsertWorkflow = useCallback(
    (payload: Omit<AdminWorkflowRecord, 'id' | 'runsThisMonth'> & { id?: string }) => {
      if (payload.id) {
        setWorkflows((prev) =>
          prev.map((w) => (w.id === payload.id ? { ...w, ...payload } : w))
        );
        showToast(`Workflow ${payload.name} diperbarui.`);
      } else {
        setWorkflows((prev) => [
          { ...payload, id: nextId('wf'), runsThisMonth: 0 },
          ...prev,
        ]);
        showToast(`Workflow ${payload.name} dibuat.`);
      }
      setModal({ type: 'none' });
    },
    [showToast]
  );

  const deleteWorkflow = useCallback(
    (id: string) => {
      setWorkflows((prev) => prev.filter((w) => w.id !== id));
      showToast('Workflow dihapus dari registry.');
    },
    [showToast]
  );

  const decideWorkflowApproval = useCallback(
    (approvalId: string, decision: 'Disetujui' | 'Ditolak') => {
      setWorkflowApprovals((prev) =>
        prev.map((a) => (a.id === approvalId ? { ...a, status: decision } : a))
      );
      appendAudit('Workflow Human-AI Approval', approvalId, 'AI Runtime', `decision: ${decision}`);
      showToast(`Permintaan handoff workflow ${decision.toLowerCase()}.`);
    },
    [appendAudit, showToast]
  );

  const retryWorkflowRun = useCallback(
    (runId: string) => {
      setWorkflowRuns((prev) =>
        prev.map((r) =>
          r.id === runId ? { ...r, status: 'Berjalan', currentStep: 'Retry Step Idempotent' } : r
        )
      );
      showToast(`Run ${runId} dijadwalkan ulang dari checkpoint terakhir.`);
    },
    [showToast]
  );

  // AI Credits, Top Up & Finance
  const topUpPlatformCredits = useCallback(
    (tenantName: string, amount: number, ref: string) => {
      const nextBal = platformCreditsBalance + amount;
      setPlatformCreditsBalance(nextBal);
      setTenants((prev) =>
        prev.map((t) =>
          t.name === tenantName || t.legalName === tenantName
            ? { ...t, creditsBalance: t.creditsBalance + amount }
            : t
        )
      );
      setCreditLedger((prev) => [
        {
          id: nextId('crd'),
          tenantName,
          type: 'Top Up',
          creditsDelta: amount,
          balanceAfter: nextBal,
          reference: ref,
          timestamp: 'Baru saja · 17 Nov 2026',
        },
        ...prev,
      ]);
      appendAudit('Top Up AI Credits', tenantName, tenantName, `+${amount} credits`);
      setModal({ type: 'none' });
      showToast(`Top up ${amount.toLocaleString('id-ID')} AI Credits untuk ${tenantName} dicatat.`);
    },
    [appendAudit, platformCreditsBalance, showToast]
  );

  const upsertCreditPricingRule = useCallback(
    (payload: Omit<CreditPricingRuleRecord, 'id'> & { id?: string }) => {
      if (payload.id) {
        setCreditPricingRules((prev) =>
          prev.map((r) => (r.id === payload.id ? { ...r, ...payload } : r))
        );
        showToast(`Aturan tarif ${payload.modelKey} diperbarui.`);
      } else {
        setCreditPricingRules((prev) => [{ ...payload, id: nextId('cpr') }, ...prev]);
        showToast(`Aturan tarif baru ditambahkan.`);
      }
      setModal({ type: 'none' });
    },
    [showToast]
  );

  const issuePlatformInvoice = useCallback(
    (payload: Omit<PlatformInvoiceRecord, 'id' | 'invoiceNumber'>) => {
      const inv: PlatformInvoiceRecord = {
        ...payload,
        id: nextId('inv'),
        invoiceNumber: `INV-2026-${Math.floor(1104 + Math.random() * 800)}`,
      };
      setInvoices((prev) => [inv, ...prev]);
      setModal({ type: 'none' });
      showToast(`Invoice ${inv.invoiceNumber} diterbitkan.`);
    },
    [showToast]
  );

  const markInvoicePaid = useCallback(
    (invoiceId: string) => {
      setInvoices((prev) =>
        prev.map((i) => (i.id === invoiceId ? { ...i, status: 'Lunas' } : i))
      );
      showToast('Status invoice diperbarui menjadi Lunas.');
    },
    [showToast]
  );

  const verifyReconciliation = useCallback(
    (recId: string) => {
      setReconciliations((prev) =>
        prev.map((r) => (r.id === recId ? { ...r, status: 'Terekonsiliasi' } : r))
      );
      appendAudit('Rekonsiliasi Settlement', recId, 'Finance', 'status → Terekonsiliasi');
      showToast('Settlement berhasil direkonsiliasi.');
    },
    [appendAudit, showToast]
  );

  // Contracts & Commission Schemes
  const upsertContractDoc = useCallback(
    (payload: Omit<ContractDocumentRecord, 'id'> & { id?: string }) => {
      if (payload.id) {
        setContracts((prev) =>
          prev.map((c) => (c.id === payload.id ? { ...c, ...payload } : c))
        );
        showToast(`Dokumen ${payload.docNumber} diperbarui.`);
      } else {
        setContracts((prev) => [{ ...payload, id: nextId('ctr') }, ...prev]);
        showToast(`Dokumen ${payload.docNumber} dibuat.`);
      }
      setModal({ type: 'none' });
    },
    [showToast]
  );

  const deleteContractDoc = useCallback(
    (id: string) => {
      setContracts((prev) => prev.filter((c) => c.id !== id));
      showToast('Dokumen kontrak / SOW / SLA dihapus.');
    },
    [showToast]
  );

  const upsertCommissionScheme = useCallback(
    (payload: Omit<CommissionSchemeRecord, 'id'> & { id?: string }) => {
      if (payload.id) {
        setCommissionSchemes((prev) =>
          prev.map((s) => (s.id === payload.id ? { ...s, ...payload } : s))
        );
        showToast(`Skema ${payload.name} diperbarui.`);
      } else {
        setCommissionSchemes((prev) => [{ ...payload, id: nextId('sch') }, ...prev]);
        showToast(`Skema komisi ${payload.name} dibuat.`);
      }
      appendAudit('Kelola Skema Komisi', payload.name, payload.providerName, `version: ${payload.version}`);
      setModal({ type: 'none' });
    },
    [appendAudit, showToast]
  );

  const deleteCommissionScheme = useCallback(
    (id: string) => {
      setCommissionSchemes((prev) => prev.filter((s) => s.id !== id));
      showToast('Skema komisi dihapus.');
    },
    [showToast]
  );

  // Corporate Payroll, Commission & Tier CRUD (Per Corporate Cooperation Contract)
  const upsertCorporateSchema = useCallback(
    (payload: Omit<CorporateCompensationSchema, 'id'> & { id?: string }) => {
      if (payload.id) {
        setCorporateSchemas((prev) => {
          const next = prev.map((c) => (c.id === payload.id ? { ...c, ...payload } : c));
          saveCorporateCompensationSchemas(next);
          return next;
        });
        showToast(`Skema payroll & komisi ${payload.corporateName} diperbarui.`);
      } else {
        const created: CorporateCompensationSchema = {
          ...payload,
          id: nextId('corp-comp'),
        };
        setCorporateSchemas((prev) => {
          const next = [created, ...prev];
          saveCorporateCompensationSchemas(next);
          return next;
        });
        showToast(`Skema corporate ${created.corporateName} berhasil ditambahkan.`);
      }
      appendAudit(
        'Kelola Skema Payroll & Komisi Corporate',
        payload.corporateName,
        payload.contractNumber,
        `split affiliate/sales: ${payload.salesConfig.affiliateSplitPct}/${payload.salesConfig.salesIncrementalSplitPct}`
      );
      setModal({ type: 'none' });
    },
    [appendAudit, showToast]
  );

  const deleteCorporateSchema = useCallback(
    (id: string) => {
      const target = corporateSchemas.find((c) => c.id === id);
      setCorporateSchemas((prev) => {
        const next = prev.filter((c) => c.id !== id);
        saveCorporateCompensationSchemas(next);
        return next;
      });
      if (target) {
        appendAudit('Hapus Skema Corporate', target.corporateName, target.contractNumber, 'deleted');
        showToast(`Skema ${target.corporateName} dihapus.`);
      }
    },
    [appendAudit, corporateSchemas, showToast]
  );

  // Technician Target Bonus Rules CRUD (Harian / Mingguan / Bulanan × Pemasangan / Maintenance / Survey)
  const upsertTechBonusRule = useCallback(
    (payload: Omit<TechnicianBonusRule, 'id'> & { id?: string }) => {
      if (payload.id) {
        setTechnicianBonusRules((prev) => {
          const next = prev.map((r) => (r.id === payload.id ? { ...r, ...payload } : r));
          saveTechnicianBonusRules(next);
          return next;
        });
        showToast(
          `Aturan bonus ${payload.taskType} (${payload.period}) — ${payload.corporateName} diperbarui.`
        );
      } else {
        const created: TechnicianBonusRule = { ...payload, id: nextId('tbr') };
        setTechnicianBonusRules((prev) => {
          const next = [created, ...prev];
          saveTechnicianBonusRules(next);
          return next;
        });
        showToast(
          `Aturan bonus ${created.taskType} (${created.period}) — ${created.corporateName} ditambahkan.`
        );
      }
      appendAudit(
        'Kelola Bonus Target Teknisi',
        `${payload.taskType} · ${payload.period}`,
        payload.corporateName,
        `target: ${payload.targetCount}; bonus: ${payload.bonusAmountIdr}`
      );
      setModal({ type: 'none' });
    },
    [appendAudit, showToast]
  );

  const toggleTechBonusRuleStatus = useCallback(
    (id: string) => {
      setTechnicianBonusRules((prev) => {
        const next = prev.map((r) =>
          r.id === id
            ? { ...r, status: r.status === 'Aktif' ? ('Nonaktif' as const) : ('Aktif' as const) }
            : r
        );
        saveTechnicianBonusRules(next);
        return next;
      });
      showToast('Status aturan bonus teknisi diperbarui.');
    },
    [showToast]
  );

  const deleteTechBonusRule = useCallback(
    (id: string) => {
      setTechnicianBonusRules((prev) => {
        const next = prev.filter((r) => r.id !== id);
        saveTechnicianBonusRules(next);
        return next;
      });
      showToast('Aturan bonus target teknisi dihapus.');
    },
    [showToast]
  );

  // Integrations, Security, Incidents, DSR, Vendors
  const upsertIntegration = useCallback(
    (payload: Omit<IntegrationConnectorRecord, 'id' | 'lastSyncAt'> & { id?: string }) => {
      if (payload.id) {
        setIntegrations((prev) =>
          prev.map((c) =>
            c.id === payload.id ? { ...c, ...payload, lastSyncAt: 'Baru saja' } : c
          )
        );
        showToast(`Integrasi ${payload.name} diperbarui.`);
      } else {
        setIntegrations((prev) => [
          { ...payload, id: nextId('int'), lastSyncAt: 'Baru saja' },
          ...prev,
        ]);
        showToast(`Integrasi ${payload.name} ditambahkan.`);
      }
      setModal({ type: 'none' });
    },
    [showToast]
  );

  const deleteIntegration = useCallback(
    (id: string) => {
      setIntegrations((prev) => prev.filter((c) => c.id !== id));
      showToast('Konektor integrasi dihapus.');
    },
    [showToast]
  );

  const testWebhookConnector = useCallback(
    (connectorName: string) => {
      setWebhookLogs((prev) => [
        {
          id: nextId('whl'),
          connectorName,
          eventType: 'health.ping',
          httpStatus: 200,
          latencyMs: 92,
          timestamp: 'Baru saja',
          idempotencyKey: `idem_ping_${Date.now()}`,
        },
        ...prev,
      ]);
      showToast(`Ping kesehatan webhook ${connectorName} berhasil (HTTP 200 · 92ms).`);
    },
    [showToast]
  );

  const createBreakGlassRequest = useCallback(
    (payload: { targetTenant: string; reason: string; durationMinutes: number }) => {
      const req: BreakGlassRequestRecord = {
        id: nextId('bg'),
        actorEmail: adminEmail,
        targetTenant: payload.targetTenant,
        reason: payload.reason,
        durationMinutes: payload.durationMinutes,
        approver1: 'platform_super_admin',
        approver2: 'Menunggu Security Admin',
        status: 'Menunggu Approval',
        requestedAt: 'Baru saja · 17 Nov 2026',
      };
      setBreakGlassRequests((prev) => [req, ...prev]);
      appendAudit('Break-Glass Request', payload.targetTenant, payload.targetTenant, payload.reason, 'Disetujui');
      setModal({ type: 'none' });
      showToast('Permintaan Break-Glass Access dicatat & menunggu persetujuan tahap-2.');
    },
    [adminEmail, appendAudit, showToast]
  );

  const decideBreakGlass = useCallback(
    (id: string, status: 'Aktif' | 'Ditolak' | 'Selesai') => {
      setBreakGlassRequests((prev) =>
        prev.map((b) =>
          b.id === id
            ? {
                ...b,
                status,
                approver2: status === 'Aktif' ? 'platform_security_admin' : b.approver2,
              }
            : b
        )
      );
      appendAudit('Break-Glass Governance', id, 'Security Center', `status → ${status}`);
      showToast(`Break-Glass ${id} diubah menjadi ${status}.`);
    },
    [appendAudit, showToast]
  );

  const toggleFeatureFlag = useCallback(
    (flagId: string) => {
      setFeatureFlags((prev) =>
        prev.map((f) => (f.id === flagId ? { ...f, enabled: !f.enabled, updatedBy: adminEmail } : f))
      );
      showToast('Feature flag diperbarui dan dicatat ke audit log.');
    },
    [adminEmail, showToast]
  );

  const createIncident = useCallback(
    (payload: Omit<IncidentRecord, 'id' | 'reportedAt'>) => {
      const inc: IncidentRecord = {
        ...payload,
        id: nextId('inc'),
        reportedAt: 'Baru saja · 17 Nov 2026',
      };
      setIncidents((prev) => [inc, ...prev]);
      setModal({ type: 'none' });
      showToast(`Insiden ${inc.title} dicatat.`);
    },
    [showToast]
  );

  const resolveIncident = useCallback(
    (id: string) => {
      setIncidents((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: 'Terselesaikan' } : i))
      );
      showToast('Status insiden ditandai Terselesaikan.');
    },
    [showToast]
  );

  const advanceDsrStatus = useCallback(
    (id: string) => {
      setDsrRequests((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                status:
                  d.status === 'Menunggu Verifikasi'
                    ? 'Diproses'
                    : 'Selesai',
              }
            : d
        )
      );
      appendAudit('Proses DSR UU PDP', id, 'Data Governance', 'status diperbarui');
      showToast('Status Permintaan Subjek Data (DSR) diperbarui.');
    },
    [appendAudit, showToast]
  );

  const upsertVendor = useCallback(
    (payload: Omit<VendorSubprocessorRecord, 'id'> & { id?: string }) => {
      if (payload.id) {
        setVendors((prev) => prev.map((v) => (v.id === payload.id ? { ...v, ...payload } : v)));
        showToast(`Vendor ${payload.name} diperbarui.`);
      } else {
        setVendors((prev) => [{ ...payload, id: nextId('vnd') }, ...prev]);
        showToast(`Vendor ${payload.name} ditambahkan ke register.`);
      }
      setModal({ type: 'none' });
    },
    [showToast]
  );

  const deleteVendor = useCallback(
    (id: string) => {
      setVendors((prev) => prev.filter((v) => v.id !== id));
      showToast('Vendor sub-processor dihapus.');
    },
    [showToast]
  );

  const selectedAiWorker = useMemo(
    () => aiWorkers.find((w) => w.id === selectedAiWorkerId) ?? aiWorkers[0],
    [aiWorkers, selectedAiWorkerId]
  );

  return {
    isAuthenticated,
    adminRole,
    setAdminRole,
    adminEmail,
    activeSection,
    modal,
    setModal,
    toastMessage,
    showToast,
    navigateTo,
    handleLogin,
    handleLogout,

    // Collections & actions
    tenants,
    upsertTenant,
    deleteTenant,
    processCorporateOnboarding,
    providers,
    upsertIspProvider,
    deleteIspProvider,
    industries,
    upsertIndustry,
    deleteIndustry,
    services,
    upsertMasterService,
    deleteMasterService,
    products,
    upsertMasterProduct,
    deleteMasterProduct,
    cooperationPolicies,
    upsertCooperationPolicy,
    toggleCooperationEntitlement,
    orgUnits,
    upsertOrgUnit,
    deleteOrgUnit,
    users,
    upsertPlatformUser,
    deletePlatformUser,
    roles,
    upsertRbacRole,
    deleteRbacRole,
    cycleRolePermission,
    staffList,
    upsertHumanStaff,
    deleteHumanStaff,
    verifyHumanStaff,
    aiWorkers,
    selectedAiWorker,
    setSelectedAiWorkerId,
    upsertAiWorker,
    deleteAiWorker,
    toggleAiWorkerStatus,
    updateAiWorkerLifecycle,
    llmProviders,
    upsertLlmProvider,
    deleteLlmProvider,
    models,
    upsertModel,
    toggleModelStatus,
    deleteModel,
    routingPolicyName,
    setRoutingPolicyName,
    routingFallbackEnabled,
    setRoutingFallbackEnabled,
    routingActive,
    setRoutingActive,
    routingRules,
    upsertRoutingRule,
    toggleRoutingRule,
    deleteRoutingRule,
    skills,
    upsertSkill,
    decideSkillApproval,
    deleteSkill,
    tools,
    upsertTool,
    deleteTool,
    memoryPolicy,
    setMemoryPolicy,
    memoryLayers,
    knowledgeSources,
    upsertKnowledgeSource,
    reindexKnowledgeSource,
    deleteKnowledgeSource,
    workflows,
    upsertWorkflow,
    deleteWorkflow,
    workflowRuns,
    retryWorkflowRun,
    workflowApprovals,
    decideWorkflowApproval,
    platformCreditsBalance,
    platformCreditsUsedMonth,
    creditPricingRules,
    upsertCreditPricingRule,
    creditLedger,
    topUpPlatformCredits,
    creditTopUpPackages,
    invoices,
    issuePlatformInvoice,
    markInvoicePaid,
    reconciliations,
    verifyReconciliation,
    contracts,
    upsertContractDoc,
    deleteContractDoc,
    commissionSchemes,
    upsertCommissionScheme,
    deleteCommissionScheme,
    corporateSchemas,
    upsertCorporateSchema,
    deleteCorporateSchema,
    technicianBonusRules,
    upsertTechBonusRule,
    toggleTechBonusRuleStatus,
    deleteTechBonusRule,
    integrations,
    upsertIntegration,
    deleteIntegration,
    webhookLogs,
    testWebhookConnector,
    mfaEnforced,
    setMfaEnforced,
    activeSessionsCount,
    setActiveSessionsCount,
    ipAllowlistEnabled,
    setIpAllowlistEnabled,
    sessionTtlMinutes,
    setSessionTtlMinutes,
    breakGlassRequests,
    createBreakGlassRequest,
    decideBreakGlass,
    featureFlags,
    toggleFeatureFlag,
    auditLogs,
    incidents,
    createIncident,
    resolveIncident,
    dsrRequests,
    advanceDsrStatus,
    vendors,
    upsertVendor,
    deleteVendor,
  };
}
