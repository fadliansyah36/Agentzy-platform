'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
} from '../lib/corporate-data';
import { corporatePortalService } from '../services/corporate-service';
import { useAgentzyAuth } from '@/apps/web/lib/auth/useAgentzyAuth';
import {
  createOrganization,
  inviteTenantMember,
  activateTenantMembership,
  suspendTenantMembership,
  revokeTenantMembership,
  replaceMembershipRole,
  reassignMembershipHierarchy,
  listTenantMemberships,
  listRoleTemplates,
  listTenantOrganizations,
  listOrganizationUnits,
  listBranches,
  listDepartments,
  createPaymentReference,
  listCorporateInvoices,
  listPaymentReferences,
  type AgentzyOrganization,
  type AgentzyOrganizationUnit,
  type AgentzyBranch,
  type AgentzyDepartment,
  type AgentzyRoleTemplate,
} from '@/apps/web/lib/api-client';
import type {
  AICreditTransaction,
  AIWorkerRecord,
  AnalyticsFilterState,
  CorporateAlertItem,
  CorporateInvoice,
  CorporatePaymentRecord,
  CorporateRoleKey,
  CorporateSectionId,
  CorporateUserMember,
  CorporateWorkOrder,
  ReportExportHistory,
} from '../lib/corporate-types';

export type CorporateModalState =
  | { type: 'none' }
  | { type: 'quick-action' }
  | { type: 'analytics-filter' }
  | { type: 'ai-worker-detail'; workerId: string }
  | { type: 'ai-credits-topup' }
  | { type: 'ai-credits-history' }
  | { type: 'ai-credits-budget' }
  | { type: 'contract-document'; docKind: 'msa' | 'sow' | 'sla' | 'amendment' }
  | { type: 'invoice-detail'; invoiceId: string }
  | { type: 'payment-reconcile'; invoiceId?: string }
  | { type: 'report-export'; category: string }
  | { type: 'invite-user' }
  | { type: 'work-order-map'; workOrderId?: string }
  | { type: 'work-order-evidence'; workOrderId: string }
  | {
      type: 'sales-staff-detail';
      name: string;
      grade: 'OJT' | 'Pro' | 'Elite';
      region: string;
      personalSA: number;
      affiliateSA: number;
      activeAffiliates: number;
      orders: number;
    }
  | {
      type: 'affiliate-detail';
      name: string;
      orders: number;
      sponsorName?: string;
      region?: string;
      validRate?: string;
    }
  | { type: 'kpi-formula' }
  | { type: 'commission-statement'; calcId: string }
  | { type: 'settings-modal'; key: 'profile' | 'integrations' | 'notifications' | 'security' | 'api' | 'tenant' | 'audit' };

export function useCorporatePortal(initialSection: CorporateSectionId = 'overview') {
  const auth = useAgentzyAuth();
  const initialCollections = useMemo(
    () => corporatePortalService.getInitialDomainCollections(),
    []
  );

  const [selectedTenantId, setActiveTenantId] = useState<string>('');
  const [requestedActiveSection, setActiveSection] = useState<CorporateSectionId>(initialSection);
  const [modal, setModal] = useState<CorporateModalState>({ type: 'none' });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const idCounter = useRef(500);

  // Stateful collections
  const [aiWorkers, setAiWorkers] = useState<AIWorkerRecord[]>(initialCollections.aiWorkers);
  const [aiCreditsBalance, setAiCreditsBalance] = useState<number>(0);
  const [monthlyBudgetLimit, setMonthlyBudgetLimit] = useState<number>(0);
  const [autoTopupEnabled, setAutoTopupEnabled] = useState<boolean>(false);
  const [creditTransactions, setCreditTransactions] = useState<AICreditTransaction[]>(
    initialCollections.creditTransactions
  );
  const [workOrders, setWorkOrders] = useState<CorporateWorkOrder[]>(
    initialCollections.workOrders
  );
  const [invoices, setInvoices] = useState<CorporateInvoice[]>(initialCollections.invoices);
  const [payments, setPayments] = useState<CorporatePaymentRecord[]>(
    initialCollections.payments
  );
  const [users, setUsers] = useState<CorporateUserMember[]>([]);
  const [tenantRoleOptions, setTenantRoleOptions] = useState<Array<{ key: CorporateRoleKey; label: string; permissionsSummary: string }>>([]);
  const [organizations, setOrganizations] = useState<AgentzyOrganization[]>([]);
  const [organizationUnits, setOrganizationUnits] = useState<AgentzyOrganizationUnit[]>([]);
  const [branches, setBranches] = useState<AgentzyBranch[]>([]);
  const [departments, setDepartments] = useState<AgentzyDepartment[]>([]);
  const [organizationsTenantId, setOrganizationsTenantId] = useState('');
  const [alerts, setAlerts] = useState<CorporateAlertItem[]>(initialCollections.alerts);
  const [reportHistory, setReportHistory] = useState<ReportExportHistory[]>(
    initialCollections.reportHistory
  );
  const [analyticsFilter, setAnalyticsFilter] = useState<AnalyticsFilterState>({
    period: 'Jan 2026 – Jun 2026',
    provider: 'Semua Provider',
    region: 'Semua Wilayah',
    branch: 'Semua Cabang',
    department: 'Semua Departemen',
    product: 'FTTH, FWA, PXGY',
    channel: 'Staff Sales & Affiliate',
    status: 'Teraktivasi',
  });

  const tenantOptions = useMemo(() => {
    const allowed = new Set((auth.identity?.memberships ?? [])
      .filter((membership) => membership.permissions.includes('corporate.overview.read'))
      .map((membership) => membership.tenant_id));
    return auth.tenants.filter((tenant) => allowed.has(tenant.id)).map((tenant) => ({
      id: tenant.id,
      code: tenant.slug,
      name: tenant.name,
      status: tenant.status === 'active' ? 'Aktif' as const : 'Onboarding' as const,
    }));
  }, [auth.identity, auth.tenants]);
  const activeTenantId = tenantOptions.some((tenant) => tenant.id === selectedTenantId)
    ? selectedTenantId
    : tenantOptions[0]?.id ?? '';
  const isAuthenticated = Boolean(
    !auth.loading && auth.session && auth.identity && tenantOptions.length > 0
  );
  const activeSection = !auth.loading && !isAuthenticated
    ? 'login'
    : isAuthenticated && requestedActiveSection === 'login'
      ? 'overview'
      : requestedActiveSection;
  const activeTenant = useMemo(
    () => tenantOptions.find((tenant) => tenant.id === activeTenantId) ?? tenantOptions[0] ?? null,
    [tenantOptions, activeTenantId]
  );

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3600);
  }, []);

  useEffect(() => {
    const accessToken = auth.session?.access_token;
    if (!accessToken || !activeTenantId) return;
    let active = true;
    void listCorporateInvoices(accessToken, activeTenantId).then(async (result) => {
      const mappedInvoices: CorporateInvoice[] = result.data.map((invoice) => ({
        id: invoice.id,
        title: invoice.title,
        periodLabel: invoice.issued_at ? new Date(invoice.issued_at).toLocaleDateString('id-ID') : 'Draft',
        issueDate: invoice.issued_at ?? '',
        dueDate: invoice.due_at ?? '',
        amount: Number(invoice.total_amount),
        status: invoice.status === 'paid' ? 'Lunas' : invoice.status === 'partially_paid' ? 'Sebagian' : 'Belum Bayar',
        lineItems: [],
      }));
      const paymentPages = await Promise.all(
        result.data.map((invoice) => listPaymentReferences(accessToken, activeTenantId, invoice.id))
      );
      const mappedPayments: CorporatePaymentRecord[] = paymentPages.flatMap((page, index) =>
        page.data.map((reference) => ({
          id: reference.id,
          invoiceId: result.data[index].invoice_number,
          paidAt: reference.verified_at ?? reference.created_at,
          method: reference.payment_method,
          referenceNo: reference.reference_number,
          amount: Number(reference.amount),
          reconciliationStatus: reference.status === 'reconciled'
            ? 'Terekonsiliasi'
            : 'Menunggu Verifikasi',
        }))
      );
      if (active) {
        setInvoices(mappedInvoices);
        setPayments(mappedPayments);
      }
    }).catch((error) => {
      if (active) {
        setInvoices([]);
        setPayments([]);
        showToast(error instanceof Error ? error.message : 'Gagal memuat invoice dan payment references.');
      }
    });
    return () => { active = false; };
  }, [auth.session?.access_token, activeTenantId, showToast]);
  const activeMembership = auth.identity?.memberships.find(
    (membership) => membership.tenant_id === activeTenantId
  );
  const canReadOrganizations = Boolean(
    auth.session?.access_token && activeTenantId &&
    activeMembership?.permissions.includes('corporate.organization.read')
  );
  const visibleOrganizations = canReadOrganizations && organizationsTenantId === activeTenantId
    ? organizations
    : [];
  const visibleOrganizationUnits = canReadOrganizations && organizationsTenantId === activeTenantId
    ? organizationUnits
    : [];
  const visibleBranches = canReadOrganizations && organizationsTenantId === activeTenantId
    ? branches
    : [];
  const visibleDepartments = canReadOrganizations && organizationsTenantId === activeTenantId
    ? departments
    : [];

  const canManageOrganizations = auth.identity?.memberships.some((membership) =>
    membership.tenant_id === activeTenantId && membership.permissions.includes('corporate.organization.manage')
  ) ?? false;

  const overviewSnapshot = useMemo(
    () => activeTenant ? corporatePortalService.getExecutiveOverviewSnapshot(activeTenant) : null,
    [activeTenant]
  );



  const nextId = (prefix: string) => {
    idCounter.current += 1;
    return `${prefix}-${idCounter.current}`;
  };

  useEffect(() => {
    const accessToken = auth.session?.access_token;
    if (!accessToken) return;
    let active = true;
    void listRoleTemplates(accessToken).then((roles: AgentzyRoleTemplate[]) => {
      if (!active) return;
      setTenantRoleOptions(
        roles
          .filter((role) => role.key.startsWith('corporate_'))
          .map((role) => ({
            key: role.key as CorporateRoleKey,
            label: role.name,
            permissionsSummary: role.permissions.join(', '),
          })),
      );
    }).catch((error) => {
      if (active) {
        setTenantRoleOptions([]);
        showToast(error instanceof Error ? error.message : 'Gagal memuat role registry.');
      }
    });
    return () => { active = false; };
  }, [auth.session?.access_token, showToast]);

  useEffect(() => {
    const accessToken = auth.session?.access_token;
    if (!accessToken || !activeTenantId) return;
    let active = true;
    void listTenantMemberships(accessToken, activeTenantId).then((rows) => {
      if (!active) return;
      setUsers(rows.map((row) => {
        const roleKey = (row.role_keys.find((key) => key.startsWith('corporate_')) ?? null) as CorporateRoleKey | null;
        const roleMeta = tenantRoleOptions.find((role) => role.key === roleKey);
        return {
          id: row.id,
          name: row.display_name ?? row.email ?? row.user_id,
          email: row.email ?? '',
          roleKey,
          roleLabel: roleMeta?.label ?? roleKey ?? 'Belum ada role',
          department: row.department_id
            ? departments.find((item) => item.id === row.department_id)?.name ?? '—'
            : '',
          branchScope: row.branch_id
            ? branches.find((item) => item.id === row.branch_id)?.name ?? '—'
            : '',
          organizationId: row.organization_id,
          organizationUnitId: row.organization_unit_id,
          branchId: row.branch_id,
          departmentId: row.department_id,
          status: row.status === 'active' ? 'Aktif' as const : row.status === 'suspended' ? 'Ditangguhkan' as const : row.status === 'revoked' ? 'Dicabut' as const : 'Menunggu Aktivasi' as const,
          mfaEnabled: null,
          lastActive: null,
        };
      }));
    }).catch((error) => {
      if (active) showToast(error instanceof Error ? error.message : 'Gagal memuat membership tenant.');
    });
    return () => { active = false; };
  }, [auth.session?.access_token, activeTenantId, branches, departments, showToast, tenantRoleOptions]);

  useEffect(() => {
    const accessToken = auth.session?.access_token;
    const membership = auth.identity?.memberships.find((item) => item.tenant_id === activeTenantId);
    if (!accessToken || !activeTenantId || !membership?.permissions.includes('corporate.organization.read')) {
      return;
    }
    let active = true;
    void Promise.all([
      listTenantOrganizations(accessToken, activeTenantId),
      listOrganizationUnits(accessToken, activeTenantId),
      listBranches(accessToken, activeTenantId),
      listDepartments(accessToken, activeTenantId),
    ]).then(([organizationRows, unitRows, branchRows, departmentRows]) => {
      if (!active) return;
      setOrganizations(organizationRows);
      setOrganizationUnits(unitRows);
      setBranches(branchRows);
      setDepartments(departmentRows);
      setOrganizationsTenantId(activeTenantId);
    }).catch((error) => {
      if (active) showToast(error instanceof Error ? error.message : 'Gagal memuat struktur organisasi.');
    });
    return () => { active = false; };
  }, [auth.session?.access_token, auth.identity, activeTenantId, showToast]);

  const navigateTo = useCallback((section: CorporateSectionId) => {
    setActiveSection(section);
    setModal({ type: 'none' });
  }, []);

  const handleLogin = useCallback(
    async (email: string, password: string, method: 'password' | 'sso') => {
      if (method === 'sso') {
        await auth.signInWithOAuth();
        return;
      }
      const context = await auth.signIn(email, password);
      const allowed = new Set(context.identity.memberships
        .filter((membership) => membership.permissions.includes('corporate.overview.read'))
        .map((membership) => membership.tenant_id));
      const tenant = context.tenants.find((item) => allowed.has(item.id));
      if (!tenant) {
        await auth.signOut();
        throw new Error('Akun belum memiliki permission corporate.overview.read pada tenant aktif.');
      }
      setActiveTenantId(tenant.id);
      setActiveSection('overview');
      showToast(`Autentikasi berhasil untuk ${context.identity.email ?? email}.`);
    },
    [auth.signIn, auth.signInWithOAuth, auth.signOut, showToast]
  );

  const handleLogout = useCallback(async () => {
    await auth.signOut();
    setActiveTenantId('');
    setActiveSection('login');
    setTenantRoleOptions([]);
    setModal({ type: 'none' });
  }, [auth.signOut]);

  const handleSwitchTenant = useCallback(
    (tenantId: string) => {
      const tenant = auth.tenants.find((item) => item.id === tenantId);
      const membership = auth.identity?.memberships.find((item) => item.tenant_id === tenantId);
      if (!tenant || !membership?.permissions.includes('corporate.overview.read')) {
        showToast('Tenant tidak memiliki permission Corporate Portal untuk akun ini.');
        return;
      }
      setActiveTenantId(tenant.id);
      showToast(`Konteks tenant aktif berpindah ke ${tenant.name}.`);
    },
    [auth.tenants, auth.identity, showToast]
  );

  const handleToggleAIWorkerStatus = useCallback(
    (workerId: string) => {
      setAiWorkers((prev) =>
        prev.map((w) => {
          if (w.id !== workerId) return w;
          const nextStatus =
            w.status === 'Aktif & Berjalan' ? 'Nonaktif' : 'Aktif & Berjalan';
          return { ...w, status: nextStatus };
        })
      );
      showToast('Status operasional AI Worker berhasil diperbarui.');
    },
    [showToast]
  );

  const handleTopUpCredits = useCallback(
    (creditsAmount: number, paymentMethod: string) => {
      const nextBalance = aiCreditsBalance + creditsAmount;
      const tx: AICreditTransaction = {
        id: nextId('CRD-TX'),
        timestamp: 'Baru saja · 17 Nov 2026',
        type: 'Top Up',
        description: `Top-up AI Credits via ${paymentMethod}`,
        workerOrActor: 'Arif Budiman (Corporate Owner)',
        creditsDelta: creditsAmount,
        balanceAfter: nextBalance,
        idempotencyKey: `idem_topup_${Date.now()}`,
      };
      setAiCreditsBalance(nextBalance);
      setCreditTransactions((prev) => [tx, ...prev]);
      setModal({ type: 'none' });
      showToast(
        `Permintaan top-up ${creditsAmount.toLocaleString('id-ID')} AI Credits tercatat ke ledger.`
      );
    },
    [aiCreditsBalance, showToast]
  );

  const handlePayInvoice = useCallback(
    async (invoiceId: string, method: string) => {
      const accessToken = auth.session?.access_token;
      const target = invoices.find((invoice) => invoice.id === invoiceId);
      if (!accessToken || !activeTenantId || !target || target.status === 'Lunas') {
        throw new Error('Invoice tidak tersedia untuk membuat payment reference.');
      }
      const referenceNumber = `AGZ-REQ-${crypto.randomUUID()}`;
      await createPaymentReference(accessToken, invoiceId, {
        tenant_id: activeTenantId,
        reference_number: referenceNumber,
        payment_method: method,
        amount: String(target.amount),
      });
      const result = await listCorporateInvoices(accessToken, activeTenantId);
      setInvoices(result.data.map((invoice) => ({
        id: invoice.id,
        title: invoice.title,
        periodLabel: invoice.issued_at ? new Date(invoice.issued_at).toLocaleDateString('id-ID') : 'Draft',
        issueDate: invoice.issued_at ?? '',
        dueDate: invoice.due_at ?? '',
        amount: Number(invoice.total_amount),
        status: invoice.status === 'paid' ? 'Lunas' : invoice.status === 'partially_paid' ? 'Sebagian' : 'Belum Bayar',
        lineItems: [],
      })));
      const pages = await Promise.all(
        result.data.map((invoice) => listPaymentReferences(accessToken, activeTenantId, invoice.id))
      );
      setPayments(pages.flatMap((page, index) => page.data.map((reference) => ({
        id: reference.id,
        invoiceId: result.data[index].invoice_number,
        paidAt: reference.verified_at ?? reference.created_at,
        method: reference.payment_method,
        referenceNo: reference.reference_number,
        amount: Number(reference.amount),
        reconciliationStatus: reference.status === 'reconciled' ? 'Terekonsiliasi' as const : 'Menunggu Verifikasi' as const,
      }))));
      setModal({ type: 'none' });
      showToast(`Payment reference ${referenceNumber} dibuat. Invoice belum ditandai lunas.`);
    },
    [auth.session?.access_token, activeTenantId, invoices, showToast]
  );

  const handleInviteUser = useCallback(
    async (payload: {
      name: string;
      email: string;
      roleKey: CorporateRoleKey;
      department: string;
      branchScope: string;
    }) => {
      const accessToken = auth.session?.access_token;
      if (!accessToken || !activeTenantId) throw new Error('Session atau tenant context tidak tersedia.');
      await inviteTenantMember(accessToken, activeTenantId, {
        email: payload.email,
        full_name: payload.name,
        role_key: payload.roleKey,
      });
      const rows = await listTenantMemberships(accessToken, activeTenantId);
      setUsers(rows.map((row) => {
        const roleKey = (row.role_keys.find((key) => key.startsWith('corporate_')) ?? null) as CorporateRoleKey | null;
        const roleMeta = tenantRoleOptions.find((role) => role.key === roleKey);
        return {
          id: row.id,
          name: row.display_name ?? row.email ?? row.user_id,
          email: row.email ?? '',
          roleKey,
          roleLabel: roleMeta?.label ?? roleKey ?? 'Belum ada role',
          department: row.department_id
            ? departments.find((item) => item.id === row.department_id)?.name ?? '—'
            : '',
          branchScope: row.branch_id
            ? branches.find((item) => item.id === row.branch_id)?.name ?? '—'
            : '',
          organizationId: row.organization_id,
          organizationUnitId: row.organization_unit_id,
          branchId: row.branch_id,
          departmentId: row.department_id,
          status: row.status === 'active' ? 'Aktif' as const : row.status === 'suspended' ? 'Ditangguhkan' as const : row.status === 'revoked' ? 'Dicabut' as const : 'Menunggu Aktivasi' as const,
          mfaEnabled: null,
          lastActive: null,
        };
      }));
      setModal({ type: 'none' });
      showToast(`Undangan Supabase dikirim ke ${payload.email}.`);
    },
    [auth.session?.access_token, activeTenantId, branches, departments, showToast]
  );

  const refreshTenantMemberships = useCallback(async () => {
    const accessToken = auth.session?.access_token;
    if (!accessToken || !activeTenantId) throw new Error('Session atau tenant context tidak tersedia.');
    const rows = await listTenantMemberships(accessToken, activeTenantId);
    setUsers(rows.map((row) => {
      const roleKey = (row.role_keys.find((key) => key.startsWith('corporate_')) ?? null) as CorporateRoleKey | null;
      const roleMeta = tenantRoleOptions.find((role) => role.key === roleKey);
      return {
        id: row.id, name: row.display_name ?? row.email ?? row.user_id,
        email: row.email ?? '', roleKey, roleLabel: roleMeta?.label ?? roleKey ?? 'Belum ada role',
        department: row.department_id ? departments.find((item) => item.id === row.department_id)?.name ?? '—' : '',
        branchScope: row.branch_id ? branches.find((item) => item.id === row.branch_id)?.name ?? '—' : '',
        organizationId: row.organization_id, organizationUnitId: row.organization_unit_id,
        branchId: row.branch_id, departmentId: row.department_id,
        status: row.status === 'active' ? 'Aktif' as const : row.status === 'suspended' ? 'Ditangguhkan' as const : row.status === 'revoked' ? 'Dicabut' as const : 'Menunggu Aktivasi' as const,
        mfaEnabled: null, lastActive: null,
      };
    }));
  }, [auth.session?.access_token, activeTenantId, branches, departments, tenantRoleOptions]);

  const handleReplaceMembershipRole = useCallback(async (membershipId: string, roleKey: CorporateRoleKey) => {
    const accessToken = auth.session?.access_token;
    if (!accessToken || !activeTenantId) throw new Error('Session atau tenant context tidak tersedia.');
    await replaceMembershipRole(accessToken, activeTenantId, membershipId, { role_key: roleKey, scope_type: 'tenant' });
    await refreshTenantMemberships();
    showToast('Role membership berhasil diganti melalui FastAPI.');
  }, [auth.session?.access_token, activeTenantId, refreshTenantMemberships, showToast]);

  const handleReassignMembership = useCallback(async (
    membershipId: string,
    assignment: {
      organization_id: string | null;
      organization_unit_id: string | null;
      branch_id: string | null;
      department_id: string | null;
    },
  ) => {
    const accessToken = auth.session?.access_token;
    if (!accessToken || !activeTenantId) throw new Error('Session atau tenant context tidak tersedia.');
    await reassignMembershipHierarchy(accessToken, activeTenantId, membershipId, assignment);
    await refreshTenantMemberships();
    showToast('Penempatan membership berhasil diperbarui melalui FastAPI.');
  }, [auth.session?.access_token, activeTenantId, refreshTenantMemberships, showToast]);

  const handleActivateMembership = useCallback(async (membershipId: string) => {
    const accessToken = auth.session?.access_token;
    if (!accessToken || !activeTenantId) throw new Error('Session atau tenant context tidak tersedia.');
    await activateTenantMembership(accessToken, activeTenantId, membershipId);
    await refreshTenantMemberships();
    showToast('Membership berhasil diaktifkan kembali.');
  }, [auth.session?.access_token, activeTenantId, refreshTenantMemberships, showToast]);

  const handleSuspendMembership = useCallback(async (membershipId: string) => {
    const accessToken = auth.session?.access_token;
    if (!accessToken || !activeTenantId) throw new Error('Session atau tenant context tidak tersedia.');
    await suspendTenantMembership(accessToken, activeTenantId, membershipId);
    await refreshTenantMemberships();
    showToast('Membership berhasil ditangguhkan.');
  }, [auth.session?.access_token, activeTenantId, refreshTenantMemberships, showToast]);

  const handleRevokeMembership = useCallback(async (membershipId: string) => {
    const accessToken = auth.session?.access_token;
    if (!accessToken || !activeTenantId) throw new Error('Session atau tenant context tidak tersedia.');
    await revokeTenantMembership(accessToken, activeTenantId, membershipId);
    await refreshTenantMemberships();
    showToast('Membership berhasil dicabut.');
  }, [auth.session?.access_token, activeTenantId, refreshTenantMemberships, showToast]);

  const handleCreateOrganization = useCallback(
    async (payload: { name: string; slug: string; organization_type: 'company' | 'division' | 'department' | 'branch' | 'team'; parent_id?: string | null }) => {
      const accessToken = auth.session?.access_token;
      if (!accessToken || !activeTenantId) throw new Error('Session atau tenant context tidak tersedia.');
      await createOrganization(accessToken, activeTenantId, payload);
      const rows = await listTenantOrganizations(accessToken, activeTenantId);
      setOrganizations(rows);
      setOrganizationsTenantId(activeTenantId);
      showToast(`Unit organisasi ${payload.name} berhasil disimpan.`);
    },
    [auth.session?.access_token, activeTenantId, showToast]
  );

  const handleMarkAlertRead = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, read: true } : a))
    );
  }, []);

  const handleMarkAllAlertsRead = useCallback(() => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
    showToast('Semua notifikasi ditandai sudah dibaca.');
  }, [showToast]);

  const handleApproveWorkOrderQC = useCallback(
    (workOrderId: string) => {
      setWorkOrders((prev) =>
        prev.map((wo) =>
          wo.id === workOrderId
            ? { ...wo, status: 'Selesai', slaRemaining: 'Tepat Waktu' }
            : wo
        )
      );
      setModal({ type: 'none' });
      showToast(`Quality Control untuk ${workOrderId} disetujui.`);
    },
    [showToast]
  );

  const handleGenerateReport = useCallback(
    (payload: { category: string; period: string; format: 'CSV' | 'PDF' | 'XLSX' }) => {
    if (!activeTenant) throw new Error('Tenant context belum tersedia.');

      const entry: ReportExportHistory = {
        id: nextId('REP-2026'),
        title: `Laporan ${payload.category} — ${payload.period}`,
        category: payload.category,
        period: payload.period,
        format: payload.format,
        generatedAt: 'Baru saja · 17 Nov 2026',
        generatedBy: 'Arif Budiman',
      };
      setReportHistory((prev) => [entry, ...prev]);

      // Trigger real downloadable CSV when CSV selected
      if (payload.format === 'CSV' && typeof window !== 'undefined') {
        const csvContent = [
          'tenant_code,tenant_name,category,period,generated_at',
          `${activeTenant.code},"${activeTenant.name}","${payload.category}","${payload.period}","${new Date().toISOString()}"`,
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `agentzy-${activeTenant.code.toLowerCase()}-${payload.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      }

      setModal({ type: 'none' });
      showToast(`Laporan ${payload.category} (${payload.format}) berhasil dibuat.`);
    },
    [activeTenant?.code, activeTenant?.name, showToast]
  );

  return {
    isAuthenticated,
    authLoading: auth.loading,
    authError: auth.error,
    activeTenant,
    tenantOptions,
    activeTenantId,
    activeSection,
    modal,
    setModal,
    toastMessage,
    showToast,
    overviewSnapshot,
    aiWorkers,
    aiCreditsBalance,
    monthlyBudgetLimit,
    setMonthlyBudgetLimit,
    autoTopupEnabled,
    setAutoTopupEnabled,
    creditTransactions,
    workOrders,
    invoices,
    payments,
    users,
    tenantRoleOptions,
    organizations: visibleOrganizations,
    organizationUnits,
    branches,
    departments,
    canManageOrganizations,
    alerts,
    reportHistory,
    analyticsFilter,
    setAnalyticsFilter,
    navigateTo,
    handleLogin,
    handleLogout,
    handleSwitchTenant,
    handleToggleAIWorkerStatus,
    handleTopUpCredits,
    handlePayInvoice,
    handleInviteUser,
    handleCreateOrganization,
    handleReplaceMembershipRole,
    handleReassignMembership,
    handleActivateMembership,
    handleSuspendMembership,
    handleRevokeMembership,
    handleMarkAlertRead,
    handleMarkAllAlertsRead,
    handleApproveWorkOrderQC,
    handleGenerateReport,
  };
}
