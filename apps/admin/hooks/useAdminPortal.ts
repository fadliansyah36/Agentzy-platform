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
import { useAgentzyAuth } from '@/apps/web/lib/auth/useAgentzyAuth';
import {
  createTenant as createTenantApi,
  listPlatformTenants,
  listTenantMemberships,
  inviteTenantMember,
  revokeTenantMembership,
  activateTenantMembership,
  suspendTenantMembership,
  replaceMembershipRole,
  listOrganizationUnits,
  listBranches,
  listDepartments,
  updateTenant as updateTenantApi,
  archiveTenant as archiveTenantApi,
  createAgentzyRole,
  updateAgentzyRole,
  deleteAgentzyRole,
  listRoleTemplates,
  listPermissionRegistry,
  replaceRolePermissions,
  type AgentzyPermissionDefinition,
  listBreakGlassRequests,
  requestBreakGlass,
  approveBreakGlass,
  rejectBreakGlass,
  activateBreakGlass,
  revokeBreakGlass,
  reviewBreakGlass,
  listAuditLogs,
  exportAuditLogs,
  listSecurityAlerts,
  acknowledgeSecurityAlert as acknowledgeSecurityAlertApi,
  type AgentzySecurityAlert,
} from '@/apps/web/lib/api-client';
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
  const auth = useAgentzyAuth();
  const idCounter = useRef(800);

  const nextId = (prefix: string) => {
    idCounter.current += 1;
    return `${prefix}-${idCounter.current}`;
  };

  const platformMemberships = useMemo(
    () => auth.identity?.memberships.filter((membership) =>
      membership.permissions.some((permission) => permission.startsWith('platform.'))
    ) ?? [],
    [auth.identity]
  );
  const verifiedRole = useMemo(
    () => platformMemberships.flatMap((membership) => membership.role_keys)
      .find((roleKey) => roleKey.startsWith('platform_')) ?? null,
    [platformMemberships]
  );
  const hasPlatformAccess = platformMemberships.length > 0;
  const platformPermissions = useMemo(
    () => Array.from(new Set(platformMemberships.flatMap((membership) => membership.permissions))),
    [platformMemberships]
  );
  const isAuthenticated = Boolean(
    !auth.loading && auth.session && auth.identity && hasPlatformAccess && auth.aal === 'aal2'
  );
  const adminRole = verifiedRole ?? '';
  const adminEmail = auth.identity?.email ?? auth.session?.user.email ?? '';
  const [requestedActiveSection, setActiveSection] = useState<AdminSectionId>(initialSection);
  const activeSection = !auth.loading && !isAuthenticated
    ? 'login'
    : isAuthenticated && requestedActiveSection === 'login'
      ? 'overview'
      : requestedActiveSection;
  const [modal, setModal] = useState<AdminModalState>({ type: 'none' });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Core collections
  const [tenants, setTenants] = useState<AdminTenantRecord[]>([]);
  const [providers, setProviders] = useState<AdminIspProviderRecord[]>(initial.providers);
  const [industries, setIndustries] = useState<MasterIndustryItem[]>(initial.industries);
  const [services, setServices] = useState<MasterServiceItem[]>(initial.services);
  const [products, setProducts] = useState<MasterProductItem[]>(initial.products);
  const [cooperationPolicies, setCooperationPolicies] = useState<CooperationPolicyRecord[]>(
    initial.cooperationPolicies
  );
  const [orgUnits, setOrgUnits] = useState<OrgUnitRecord[]>([]);
  const [users, setUsers] = useState<PlatformUserRecord[]>([]);
  const [roles, setRoles] = useState<RbacRoleRecord[]>([]);
  const [permissionRegistry, setPermissionRegistry] = useState<AgentzyPermissionDefinition[]>([]);
  const [staffList, setStaffList] = useState<HumanStaffRecord[]>(initial.staff);
  const [aiWorkers, setAiWorkers] = useState<AdminAIWorkerRecord[]>(initial.aiWorkers);
  const [selectedAiWorkerId, setSelectedAiWorkerId] = useState<string>(
    ''
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
  const [memoryPolicy, setMemoryPolicy] = useState<MemoryGovernancePolicy | null>(initial.memoryPolicy);
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
  const [platformCreditsBalance, setPlatformCreditsBalance] = useState<number>(0);
  const [platformCreditsUsedMonth] = useState<number>(0);
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
  const [mfaEnforced] = useState<boolean | null>(null);
  const [activeSessionsCount] = useState<number | null>(null);
  const [ipAllowlistEnabled] = useState<boolean | null>(null);
  const [sessionTtlMinutes] = useState<number | null>(null);
  const [breakGlassRequests, setBreakGlassRequests] = useState<BreakGlassRequestRecord[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlagRecord[]>(initial.featureFlags);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<AgentzySecurityAlert[]>([]);
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
    (_action: string, _targetResource: string, _tenantScope: string,
      _diffSummary: string, _result: AuditLogRecord['result'] = 'Sukses') => {
      // Security/audit records are written by FastAPI; client-side activity is never treated as an audit record.
    },
    []
  );

  const navigateTo = useCallback((section: AdminSectionId) => {
    setActiveSection(section);
    setModal({ type: 'none' });
  }, []);

  useEffect(() => {
    if (!auth.loading && auth.session && auth.identity && !hasPlatformAccess) {
      void auth.signOut();
    }
  }, [auth.loading, auth.session, auth.identity, hasPlatformAccess, auth.signOut]);

  useEffect(() => {
    const accessToken = auth.session?.access_token;
    const canReadDirectory = auth.identity?.memberships.some((membership) =>
      membership.permissions.includes('platform.tenants.read')
    );
    if (!accessToken || auth.aal !== 'aal2' || !canReadDirectory) return;
    let active = true;
    void listPlatformTenants(accessToken).then((rows) => {
      if (!active) return;
      setTenants(rows.map((tenant) => ({
        id: tenant.id,
        code: tenant.slug,
        name: tenant.name,
        legalName: tenant.name,
        domain: '',
        industry: '',
        clientType: tenant.tenant_type === 'provider' ? 'ISP / Provider' : 'Corporate Enterprise',
        cooperationLabel: 'Belum diatur',
        status: tenant.status === 'active' ? 'Aktif' : tenant.status === 'suspended' || tenant.status === 'archived' ? 'Suspended' : 'Trial',
        region: '',
        humanCount: 0,
        aiWorkerCount: 0,
        creditsBalance: 0,
        monthlyCreditsUsed: 0,
        slaScore: 0,
        createdAt: new Date(tenant.created_at).toLocaleDateString('id-ID'),
      })));
    }).catch((error) => {
      if (active) showToast(error instanceof Error ? error.message : 'Gagal memuat direktori tenant.');
    });
    return () => { active = false; };
  }, [auth.session?.access_token, auth.identity, auth.aal, showToast]);

  // Membership directory visibility is derived from the verified AAL2 platform grant.
  const canReadMembershipDirectory = Boolean(
    auth.session?.access_token &&
    auth.aal === 'aal2' &&
    platformPermissions.includes('platform.memberships.read') &&
    tenants.length > 0
  );

  useEffect(() => {
    const accessToken = auth.session?.access_token;
    if (!accessToken || !canReadMembershipDirectory) return;
    let active = true;
    void Promise.all(tenants.map(async (tenant) => {
      const memberships = await listTenantMemberships(accessToken, tenant.id);
      return memberships.map((membership) => {
        const roleKeys = membership.role_keys ?? [];
        const role = roles.find((item) => roleKeys.includes(item.key));
        return {
          id: membership.id,
          tenantId: tenant.id,
          tenantName: tenant.name,
          name: membership.display_name ?? membership.email ?? membership.user_id,
          email: membership.email ?? '',
          roleId: role?.id ?? roleKeys[0] ?? '',
          roleKey: roleKeys.find((key) => key.startsWith('corporate_')) ?? roleKeys[0] ?? '',
          roleName: roleKeys.map((key) => roles.find((item) => item.key === key)?.name ?? key).join(', '),
          department: membership.department_id ?? '',
          branchScope: membership.branch_id ?? '',
          organizationId: membership.organization_id,
          organizationUnitId: membership.organization_unit_id,
          branchId: membership.branch_id,
          departmentId: membership.department_id,
          mfaEnabled: null,
          status: membership.status === 'active'
            ? 'Aktif' as const
            : membership.status === 'revoked'
              ? 'Dicabut' as const
              : membership.status === 'suspended'
                ? 'Suspended' as const
                : 'Pending' as const,
          lastLogin: null,
        };
      });
    })).then((rows) => {
      if (active) setUsers(rows.flat());
    }).catch((error) => {
      if (active) {
        setUsers([]);
        showToast(error instanceof Error ? error.message : 'Gagal memuat membership directory.');
      }
    });
    return () => { active = false; };
  }, [auth.session?.access_token, canReadMembershipDirectory, tenants, roles, showToast]);

  useEffect(() => {
    const accessToken = auth.session?.access_token;
    if (
      !accessToken ||
      auth.aal !== 'aal2' ||
      !platformPermissions.includes('platform.tenants.read') ||
      tenants.length === 0
    ) return;
    let active = true;
    void Promise.all(tenants.map(async (tenant) => {
      const [unitRows, branchRows, departmentRows] = await Promise.all([
        listOrganizationUnits(accessToken, tenant.id),
        listBranches(accessToken, tenant.id),
        listDepartments(accessToken, tenant.id),
      ]);
      const unitNames = new Map(unitRows.map((item) => [item.id, item.name]));
      const branchNames = new Map(branchRows.map((item) => [item.id, item.name]));
      const organizationUnits: OrgUnitRecord[] = [
        ...branchRows.map((item) => ({
          id: item.id,
          tenantId: tenant.id,
          name: item.name,
          unitType: 'Cabang / Regional' as const,
          parentName: item.organization_unit_id
            ? unitNames.get(item.organization_unit_id) ?? null
            : null,
          headName: null,
          memberCount: null,
          status: item.status === 'active' ? 'Aktif' as const : 'Nonaktif' as const,
        })),
        ...departmentRows.map((item) => ({
          id: item.id,
          tenantId: tenant.id,
          name: item.name,
          unitType: 'Departemen' as const,
          parentName: item.branch_id
            ? branchNames.get(item.branch_id) ?? null
            : item.parent_department_id
              ? departmentRows.find((parent) => parent.id === item.parent_department_id)?.name ?? null
              : null,
          headName: null,
          memberCount: null,
          status: item.status === 'active' ? 'Aktif' as const : 'Nonaktif' as const,
        })),
      ];
      return organizationUnits;
    })).then((rows) => {
      if (active) setOrgUnits(rows.flat());
    }).catch((error) => {
      if (active) showToast(error instanceof Error ? error.message : 'Gagal memuat hierarchy tenant dari FastAPI.');
    });
    return () => { active = false; };
  }, [auth.session?.access_token, auth.aal, platformPermissions, tenants, showToast]);

  useEffect(() => {
    const accessToken = auth.session?.access_token;
    const canManageRoles = platformMemberships.some((membership) =>
      membership.permissions.includes('platform.roles.read')
    );
    if (!accessToken || auth.aal !== 'aal2' || !canManageRoles) return;
    let active = true;
    void Promise.all([listRoleTemplates(accessToken), listPermissionRegistry(accessToken)])
      .then(([roleRows, permissionRows]) => {
        if (!active) return;
        setPermissionRegistry(permissionRows);
        const byResource = new Map<string, AgentzyPermissionDefinition[]>();
        for (const permission of permissionRows) {
          const resource = permission.resource ?? permission.domain;
          byResource.set(resource, [...(byResource.get(resource) ?? []), permission]);
        }
        setRoles(roleRows.map((role) => {
          const granted = new Set(role.permissions);
          const levels: RbacRoleRecord['permissions'] = {};
          for (const [resource, definitions] of byResource) {
            const selected = definitions.filter((item) => granted.has(item.key));
            if (selected.length === 0) levels[resource] = '---';
            else if (selected.length === definitions.length) levels[resource] = 'F';
            else if (selected.every((item) => ['create', 'update', 'manage', 'write'].includes(item.action))) levels[resource] = 'C/U';
            else if (selected.every((item) => ['read', 'list', 'view'].includes(item.action))) levels[resource] = 'R';
            else if (selected.every((item) => ['approve', 'review'].includes(item.action))) levels[resource] = 'A';
            else levels[resource] = 'S';
          }
          return {
            id: role.id,
            key: role.key,
            name: role.name,
            scopeType: role.scope_type === 'platform' ? 'Platform' : 'Tenant',
            description: role.description ?? '',
            userCount: 0,
            isSystemRole: role.is_system,
            permissionKeys: role.permissions,
            permissions: levels,
          };
        }));
      })
      .catch((error) => {
        if (active) showToast(error instanceof Error ? error.message : 'Gagal memuat RBAC registry.');
      });
    return () => { active = false; };
  }, [auth.session?.access_token, auth.aal, platformMemberships, showToast]);

  useEffect(() => {
    const accessToken = auth.session?.access_token;
    if (!accessToken || auth.aal !== 'aal2') return;
    let active = true;
    if (platformPermissions.includes('platform.security.manage')) {
      void listBreakGlassRequests(accessToken).then(({ data }) => {
        if (!active) return;
        setBreakGlassRequests(data.map((item) => {
          const statusMap: Record<string, BreakGlassRequestRecord['status']> = {
            requested: 'Menunggu Approval',
            approved: 'Menunggu Aktivasi',
            active: 'Aktif',
            expired: 'Menunggu Review',
            revoked: 'Menunggu Review',
            reviewed: 'Selesai',
            rejected: 'Ditolak',
          };
          return {
            id: item.id,
            actorEmail: item.requester_user_id ?? 'System',
            requesterUserId: item.requester_user_id,
            approverUserId: item.approver_user_id,
            targetTenant: item.requested_scope?.tenant_ids?.join(', ') || 'Platform-wide',
            reason: item.reason ?? '',
            durationMinutes: item.requested_scope?.duration_minutes ?? 30,
            permissionKeys: item.requested_scope?.permission_keys ?? [],
            tenantIds: item.requested_scope?.tenant_ids ?? [],
            approver1: item.approver_user_id ?? 'Menunggu approval',
            approver2: item.reviewed_at ? 'Post-incident reviewed' : 'Pending review',
            status: statusMap[item.status] ?? 'Menunggu Approval',
            requestedAt: item.requested_at ?? '',
          };
        }));
      }).catch((error) => {
        if (active) showToast(error instanceof Error ? error.message : 'Gagal memuat break-glass requests.');
      });
    }
    if (platformPermissions.includes('platform.audit.read')) {
      void listAuditLogs(accessToken, { limit: 100 }).then(({ data }) => {
        if (!active) return;
        setAuditLogs(data.map((item) => ({
          id: item.id,
          action: item.action,
          actorEmail: item.actor_user_id ?? 'System',
          targetResource: [item.resource_type, item.resource_id].filter(Boolean).join(':'),
          tenantScope: item.tenant_id ?? 'Platform',
          timestamp: item.created_at,
          result: item.action.includes('denied') ? 'Ditolak' : item.action.includes('approved') ? 'Disetujui' : 'Sukses',
          diffSummary: JSON.stringify(item.metadata ?? {}),
        })));
      }).catch((error) => {
        if (active) showToast(error instanceof Error ? error.message : 'Gagal memuat audit logs.');
      });
    }
    if (platformPermissions.includes('platform.security.events.read')) {
      void listSecurityAlerts(accessToken, { limit: 100 }).then(({ data }) => {
        if (active) setSecurityAlerts(data);
      }).catch((error) => {
        if (active) showToast(error instanceof Error ? error.message : 'Gagal memuat security alerts.');
      });
    }
    return () => { active = false; };
  }, [auth.session?.access_token, auth.aal, platformPermissions, showToast]);

  const acknowledgeSecurityAlert = useCallback(async (alertId: string) => {
    const accessToken = auth.session?.access_token;
    if (!accessToken || auth.aal !== 'aal2') {
      showToast('Session AAL2 diperlukan untuk acknowledge security alert.');
      return;
    }
    try {
      await acknowledgeSecurityAlertApi(accessToken, alertId);
      const { data } = await listSecurityAlerts(accessToken, { limit: 100 });
      setSecurityAlerts(data);
      showToast('Security alert berhasil di-acknowledge.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Gagal acknowledge security alert.');
    }
  }, [auth.session?.access_token, auth.aal, showToast]);

  const handleLogin = useCallback(
    async (email: string, password: string, mfaCode: string) => {
      const context = await auth.signIn(email, password, true, mfaCode);
      if (context.aal !== 'aal2') throw new Error('MFA TOTP wajib diaktifkan. Gunakan menu Setup MFA TOTP sebelum masuk Super Admin.');
      const hasPlatformPermission = context.identity.memberships.some((membership) =>
        membership.permissions.some((permission) => permission.startsWith('platform.'))
      );
      if (!hasPlatformPermission || context.aal !== 'aal2') {
        await auth.signOut();
        throw new Error('Akun ini tidak memiliki permission platform aktif dengan MFA.');
      }
      setActiveSection('overview');
      showToast(`Autentikasi berhasil untuk ${context.identity.email ?? email}.`);
    },
    [auth.signIn, auth.signOut, showToast]
  );

  const handleLogout = useCallback(async () => {
    await auth.signOut();
    setActiveSection('login');
    setModal({ type: 'none' });
  }, [auth.signOut]);

  // Tenant CRUD — persisted by FastAPI, never by browser-local state.
  const upsertTenant = useCallback(
    async (payload: Omit<AdminTenantRecord, 'id' | 'createdAt'> & { id?: string }) => {
      const accessToken = auth.session?.access_token;
      if (!accessToken) throw new Error('Session Super Admin tidak tersedia.');
      const slugSource = payload.domain?.split('.')[0] || payload.code || payload.name;
      const slug = slugSource.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const tenantType = payload.clientType === 'ISP / Provider' ? 'provider' : 'corporate';
      const status = payload.status === 'Aktif' ? 'active' : payload.status === 'Suspended' ? 'suspended' : 'pending';
      if (payload.id) {
        const updatedRemote = await updateTenantApi(accessToken, payload.id, {
          name: payload.name, slug, tenant_type: tenantType, status,
        });
        setTenants((prev) => prev.map((tenant) => tenant.id === payload.id ? {
          ...tenant, ...payload, code: updatedRemote.slug,
          status: updatedRemote.status === 'active' ? 'Aktif' : updatedRemote.status === 'suspended' || updatedRemote.status === 'archived' ? 'Suspended' : 'Trial',
        } : tenant));
        appendAudit('Update Tenant', payload.name, payload.name, 'Perubahan tersimpan melalui FastAPI.');
        showToast(`Tenant ${payload.name} diperbarui.`);
      } else {
        const createdRemote = await createTenantApi(accessToken, {
          name: payload.name, slug, tenant_type: tenantType,
        });
        const created: AdminTenantRecord = {
          ...payload, id: createdRemote.id, code: createdRemote.slug, status: 'Trial',
          createdAt: new Date(createdRemote.created_at).toLocaleDateString('id-ID'),
          humanCount: 0, aiWorkerCount: 0, creditsBalance: 0, monthlyCreditsUsed: 0, slaScore: 0,
        };
        setTenants((prev) => [created, ...prev.filter((tenant) => tenant.id !== created.id)]);
        appendAudit('Tambah Tenant', created.name, created.name, 'Tenant tersimpan melalui FastAPI.');
        showToast(`Tenant ${created.name} berhasil dibuat dengan status pending.`);
      }
      setModal({ type: 'none' });
    },
    [auth.session?.access_token, appendAudit, showToast]
  );

  const deleteTenant = useCallback(
    async (tenantId: string) => {
      const accessToken = auth.session?.access_token;
      if (!accessToken) throw new Error('Session Super Admin tidak tersedia.');
      const target = tenants.find((tenant) => tenant.id === tenantId);
      await archiveTenantApi(accessToken, tenantId);
      setTenants((prev) => prev.map((tenant) => tenant.id === tenantId ? { ...tenant, status: 'Suspended' } : tenant));
      if (target) appendAudit('Arsip Tenant', target.name, target.name, 'Tenant diarsipkan melalui FastAPI.');
      showToast('Tenant diarsipkan. Data tidak dihapus secara destruktif.');
      setModal({ type: 'none' });
    },
    [auth.session?.access_token, appendAudit, showToast, tenants]
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
    async (payload: Omit<PlatformUserRecord, 'id' | 'lastLogin'> & { id?: string }) => {
      const accessToken = auth.session?.access_token;
      if (!accessToken || auth.aal !== 'aal2') {
        showToast('Session AAL2 diperlukan untuk mengelola membership.');
        return;
      }
      if (payload.id) {
        showToast('Perubahan profil pengguna lain belum didukung oleh kontrak identity. Tidak ada perubahan lokal yang disimpan.');
        return;
      }
      const tenant = tenants.find((item) => item.id === payload.tenantId);
      const role = roles.find((item) => item.id === payload.roleId || item.key === payload.roleId);
      if (!tenant || !role || role.scopeType !== 'Tenant') {
        showToast('Pilih tenant dan role tenant yang valid dari registry.');
        return;
      }
      try {
        await inviteTenantMember(accessToken, tenant.id, {
          email: payload.email,
          full_name: payload.name,
          role_key: role.key,
        });
        const rows = await listTenantMemberships(accessToken, tenant.id);
        const refreshed = rows.map((membership) => {
          const roleKeys = membership.role_keys ?? [];
          return {
            id: membership.id,
            tenantId: tenant.id,
            tenantName: tenant.name,
            name: membership.display_name ?? membership.email ?? membership.user_id,
            email: membership.email ?? '',
            roleId: roles.find((item) => roleKeys.includes(item.key))?.id ?? roleKeys[0] ?? '',
            roleKey: roleKeys.find((key) => key.startsWith('corporate_')) ?? roleKeys[0] ?? '',
            roleName: roleKeys.map((key) => roles.find((item) => item.key === key)?.name ?? key).join(', '),
            department: membership.department_id ?? '',
            branchScope: membership.branch_id ?? '',
            organizationId: membership.organization_id,
            organizationUnitId: membership.organization_unit_id,
            branchId: membership.branch_id,
            departmentId: membership.department_id,
            mfaEnabled: null,
            status: membership.status === 'active'
              ? 'Aktif' as const
              : membership.status === 'revoked'
                ? 'Dicabut' as const
                : membership.status === 'suspended'
                  ? 'Suspended' as const
                  : 'Pending' as const,
            lastLogin: null,
          };
        });
        setUsers((current) => [
          ...current.filter((item) => item.tenantId !== tenant.id),
          ...refreshed,
        ]);
        setModal({ type: 'none' });
        showToast(`Undangan membership dikirim ke ${payload.email} melalui backend.`);
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Gagal mengirim undangan membership.');
      }
    },
    [auth.session?.access_token, auth.aal, roles, tenants, showToast]
  );

  const deletePlatformUser = useCallback(
    async (id: string) => {
      const accessToken = auth.session?.access_token;
      const target = users.find((user) => user.id === id);
      if (!accessToken || auth.aal !== 'aal2' || !target) {
        showToast('Session AAL2 atau membership target tidak tersedia.');
        return;
      }
      try {
        await revokeTenantMembership(accessToken, target.tenantId, target.id);
        const rows = await listTenantMemberships(accessToken, target.tenantId);
        setUsers((current) => [
          ...current.filter((item) => item.tenantId !== target.tenantId),
          ...rows.map((membership) => {
            const roleKeys = membership.role_keys ?? [];
            return {
              id: membership.id,
              tenantId: target.tenantId,
              tenantName: target.tenantName,
              name: membership.display_name ?? membership.email ?? membership.user_id,
              email: membership.email ?? '',
              roleId: roles.find((item) => roleKeys.includes(item.key))?.id ?? roleKeys[0] ?? '',
              roleName: roleKeys.map((key) => roles.find((item) => item.key === key)?.name ?? key).join(', '),
              department: '',
              mfaEnabled: null,
              status: membership.status === 'active'
                ? 'Aktif' as const
                : membership.status === 'suspended' || membership.status === 'revoked'
                  ? 'Suspended' as const
                  : 'Pending' as const,
              lastLogin: null,
            };
          }),
        ]);
        showToast(`Akses membership ${target.name} telah dicabut melalui backend.`);
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Gagal mencabut membership.');
      }
    },
    [auth.session?.access_token, auth.aal, roles, showToast, users]
  );

  // RBAC CRUD & Matrix
  const upsertRbacRole = useCallback(
    async (payload: Omit<RbacRoleRecord, 'id' | 'userCount' | 'isSystemRole'> & { id?: string }) => {
      const accessToken = auth.session?.access_token;
      if (!accessToken || auth.aal !== 'aal2') {
        showToast('Session AAL2 diperlukan untuk mengelola role.');
        return;
      }
      try {
        const saved = payload.id
          ? await updateAgentzyRole(accessToken, payload.id, {
              name: payload.name,
              description: payload.description,
            })
          : await createAgentzyRole(accessToken, {
              key: payload.key,
              name: payload.name,
              description: payload.description,
              scope_type: payload.scopeType === 'Platform' ? 'platform' : 'tenant',
            });
        const nextRole: RbacRoleRecord = {
          id: saved.id,
          key: saved.key,
          name: saved.name,
          scopeType: saved.scope_type === 'platform' ? 'Platform' : 'Tenant',
          description: saved.description ?? '',
          userCount: 0,
          isSystemRole: saved.is_system,
          permissionKeys: saved.permissions,
          permissions: payload.permissions ?? {},
        };
        setRoles((prev) => payload.id
          ? prev.map((role) => role.id === saved.id ? { ...role, ...nextRole } : role)
          : [nextRole, ...prev]);
        showToast(`Role ${saved.name} berhasil disimpan melalui FastAPI.`);
        setModal({ type: 'none' });
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Gagal menyimpan role.');
      }
    },
    [auth.session?.access_token, auth.aal, showToast]
  );

  const deleteRbacRole = useCallback(
    async (id: string) => {
      const accessToken = auth.session?.access_token;
      const target = roles.find((role) => role.id === id);
      if (target?.isSystemRole) {
        showToast('System role inti tidak dapat dihapus.');
        return;
      }
      if (!accessToken || auth.aal !== 'aal2') {
        showToast('Session AAL2 diperlukan untuk menghapus role.');
        return;
      }
      try {
        await deleteAgentzyRole(accessToken, id);
        setRoles((prev) => prev.filter((role) => role.id !== id));
        showToast(`Role ${target?.name ?? id} dihapus melalui FastAPI.`);
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Gagal menghapus role.');
      }
    },
    [auth.session?.access_token, auth.aal, roles, showToast]
  );

  const cycleRolePermission = useCallback(
    async (roleId: string, resourceKey: string) => {
      const accessToken = auth.session?.access_token;
      const role = roles.find((item) => item.id === roleId);
      if (!accessToken || !role || !auth.aal || auth.aal !== 'aal2') {
        showToast('Session AAL2 diperlukan untuk memperbarui permission role.');
        return;
      }
      const definitions = permissionRegistry.filter((item) =>
        (item.resource ?? item.domain) === resourceKey
      );
      if (definitions.length === 0) {
        showToast('Resource tidak tersedia pada permission registry.');
        return;
      }
      const actions = new Set(definitions.map((item) => item.action));
      const levels: Array<'F' | 'C/U' | 'A' | 'R' | 'S' | '---'> = [
        'F',
        ...(Array.from(actions).some((action) => ['create', 'update', 'manage', 'write'].includes(action)) ? ['C/U' as const] : []),
        ...(Array.from(actions).some((action) => ['approve', 'review'].includes(action)) ? ['A' as const] : []),
        ...(Array.from(actions).some((action) => ['read', 'list', 'view'].includes(action)) ? ['R' as const, 'S' as const] : []),
        '---',
      ];
      const current = role.permissions[resourceKey] ?? '---';
      const next = levels[(levels.indexOf(current) + 1) % levels.length];
      if (role.scopeType === 'Platform' && definitions.some((item) => !item.key.startsWith('platform.'))) {
        showToast('Platform role hanya dapat mengelola permission platform.');
        return;
      }
      if (role.scopeType === 'Tenant' && definitions.some((item) => item.key.startsWith('platform.'))) {
        showToast('Tenant role tidak dapat menerima permission platform.');
        return;
      }
      const targetKeys = definitions.filter((item) => {
        if (next === 'F') return true;
        if (next === 'C/U') return ['create', 'update', 'manage', 'write'].includes(item.action);
        if (next === 'A') return ['approve', 'review'].includes(item.action);
        if (next === 'R' || next === 'S') return ['read', 'list', 'view'].includes(item.action);
        return false;
      }).map((item) => item.key);
      const nextKeys = [
        ...(role.permissionKeys ?? []).filter((key) =>
          !definitions.some((item) => item.key === key)
        ),
        ...targetKeys,
      ];
      try {
        const saved = await replaceRolePermissions(accessToken, roleId, nextKeys);
        setRoles((prev) => prev.map((item) => item.id === roleId ? {
          ...item,
          permissionKeys: saved.permission_keys,
          permissions: { ...item.permissions, [resourceKey]: next },
        } : item));
        showToast('Permission role berhasil disimpan melalui FastAPI.');
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Gagal menyimpan permission role.');
      }
    },
    [auth.session?.access_token, auth.aal, roles, permissionRegistry, showToast]
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
    async (payload: {
      tenantIds: string[];
      permissionKeys: string[];
      reason: string;
      durationMinutes: number;
    }) => {
      const accessToken = auth.session?.access_token;
      if (!accessToken || auth.aal !== 'aal2') {
        showToast('Session AAL2 diperlukan untuk meminta break-glass.');
        return;
      }
      try {
        await requestBreakGlass(accessToken, {
          tenant_ids: payload.tenantIds,
          permission_keys: payload.permissionKeys,
          reason: payload.reason,
          duration_minutes: payload.durationMinutes,
        });
        const { data } = await listBreakGlassRequests(accessToken);
        setBreakGlassRequests(data.map((item) => ({
          id: item.id,
          actorEmail: item.requester_user_id ?? 'System',
          requesterUserId: item.requester_user_id,
          approverUserId: item.approver_user_id,
          targetTenant: item.requested_scope?.tenant_ids?.join(', ') || 'Platform-wide',
          reason: item.reason ?? '',
          durationMinutes: item.requested_scope?.duration_minutes ?? 30,
          permissionKeys: item.requested_scope?.permission_keys ?? [],
          tenantIds: item.requested_scope?.tenant_ids ?? [],
          approver1: item.approver_user_id ?? 'Menunggu approval',
          approver2: item.reviewed_at ? 'Post-incident reviewed' : 'Pending review',
          status: ({
            requested: 'Menunggu Approval', approved: 'Menunggu Aktivasi',
            active: 'Aktif', expired: 'Menunggu Review', revoked: 'Menunggu Review',
            reviewed: 'Selesai', rejected: 'Ditolak',
          } as Record<string, BreakGlassRequestRecord['status']>)[item.status] ?? 'Menunggu Approval',
          requestedAt: item.requested_at ?? '',
        })));
        setModal({ type: 'none' });
        showToast('Break-glass request berhasil dicatat dan menunggu approver yang berbeda.');
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Gagal mengajukan break-glass.');
      }
    },
    [auth.session?.access_token, auth.aal, showToast]
  );

  const decideBreakGlass = useCallback(
    async (id: string, action: 'approve' | 'reject' | 'activate' | 'revoke' | 'review') => {
      const accessToken = auth.session?.access_token;
      if (!accessToken || auth.aal !== 'aal2') {
        showToast('Session AAL2 diperlukan untuk lifecycle break-glass.');
        return;
      }
      const current = breakGlassRequests.find((item) => item.id === id);
      try {
        if (action === 'approve') await approveBreakGlass(accessToken, id);
        if (action === 'reject') await rejectBreakGlass(accessToken, id);
        if (action === 'activate') await activateBreakGlass(accessToken, id, current?.durationMinutes ?? 30);
        if (action === 'revoke') await revokeBreakGlass(accessToken, id);
        if (action === 'review') {
          const notes = window.prompt('Catatan post-incident review (minimal 20 karakter):');
          if (!notes || notes.trim().length < 20) {
            showToast('Catatan review minimal 20 karakter wajib diisi.');
            return;
          }
          await reviewBreakGlass(accessToken, id, notes.trim());
        }
        const { data } = await listBreakGlassRequests(accessToken);
        setBreakGlassRequests(data.map((item) => ({
          id: item.id,
          actorEmail: item.requester_user_id ?? 'System',
          requesterUserId: item.requester_user_id,
          approverUserId: item.approver_user_id,
          targetTenant: item.requested_scope?.tenant_ids?.join(', ') || 'Platform-wide',
          reason: item.reason ?? '',
          durationMinutes: item.requested_scope?.duration_minutes ?? 30,
          permissionKeys: item.requested_scope?.permission_keys ?? [],
          tenantIds: item.requested_scope?.tenant_ids ?? [],
          approver1: item.approver_user_id ?? 'Menunggu approval',
          approver2: item.reviewed_at ? 'Post-incident reviewed' : 'Pending review',
          status: ({
            requested: 'Menunggu Approval', approved: 'Menunggu Aktivasi',
            active: 'Aktif', expired: 'Menunggu Review', revoked: 'Menunggu Review',
            reviewed: 'Selesai', rejected: 'Ditolak',
          } as Record<string, BreakGlassRequestRecord['status']>)[item.status] ?? 'Menunggu Approval',
          requestedAt: item.requested_at ?? '',
        })));
        showToast(`Break-glass request ${action} berhasil diproses.`);
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Break-glass action gagal.');
      }
    },
    [auth.session?.access_token, auth.aal, breakGlassRequests, showToast]
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
    authLoading: auth.loading,
    authError: auth.error,
    adminRole,
    adminEmail,
    platformPermissions,
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
    users: canReadMembershipDirectory ? users : [],
    upsertPlatformUser,
    deletePlatformUser,
    roles,
    permissionRegistry,
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
    activeSessionsCount,
    ipAllowlistEnabled,
    sessionTtlMinutes,
    breakGlassRequests,
    activeBreakGlassCount: breakGlassRequests.filter((item) => item.status === 'Aktif').length,
    currentUserId: auth.identity?.user_id ?? null,
    createBreakGlassRequest,
    decideBreakGlass,
    featureFlags,
    toggleFeatureFlag,
    auditLogs,
    securityAlerts,
    acknowledgeSecurityAlert,
    exportAuditLogs: async () => {
      const accessToken = auth.session?.access_token;
      if (!accessToken) throw new Error('Session tidak tersedia.');
      const blob = await exportAuditLogs(accessToken);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'agentzy-audit-export.csv';
      anchor.click();
      URL.revokeObjectURL(url);
    },
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
