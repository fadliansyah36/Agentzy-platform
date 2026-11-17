'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CORPORATE_ROLE_OPTIONS,
} from '../lib/corporate-data';
import { corporatePortalService } from '../services/corporate-service';
import { useAgentzyAuth } from '@/apps/web/lib/auth/useAgentzyAuth';
import { createOrganization, inviteTenantMember, listTenantMemberships, listTenantOrganizations, type AgentzyOrganization } from '@/apps/web/lib/api-client';
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

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTenantId, setActiveTenantId] = useState<string>('');
  const [activeSection, setActiveSection] = useState<CorporateSectionId>(initialSection);
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
  const [users, setUsers] = useState<CorporateUserMember[]>(initialCollections.users);
  const [organizations, setOrganizations] = useState<AgentzyOrganization[]>([]);
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
      setActiveSection((current) => current === 'login' ? 'overview' : current);
    } else {
      setIsAuthenticated(false);
      if (auth.session && auth.identity && tenantOptions.length === 0) {
        setActiveSection('login');
      }
    }
  }, [auth.loading, auth.session, auth.identity, tenantOptions, activeTenantId]);

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
    void listTenantMemberships(accessToken, activeTenantId).then((rows) => {
      if (!active) return;
      setUsers(rows.map((row) => {
        const roleKey = (row.role_keys.find((key) => key.startsWith('corporate_')) ?? 'corporate_auditor') as CorporateRoleKey;
        const roleMeta = CORPORATE_ROLE_OPTIONS.find((role) => role.key === roleKey);
        return {
          id: row.id,
          name: row.display_name ?? row.email ?? row.user_id,
          email: row.email ?? '',
          roleKey,
          roleLabel: roleMeta?.label ?? roleKey,
          department: '',
          branchScope: '',
          status: row.status === 'active' ? 'Aktif' as const : 'Menunggu Aktivasi' as const,
          mfaEnabled: null,
          lastActive: 'Belum ada aktivitas',
        };
      }));
    }).catch((error) => {
      if (active) showToast(error instanceof Error ? error.message : 'Gagal memuat membership tenant.');
    });
    return () => { active = false; };
  }, [auth.session?.access_token, activeTenantId, showToast]);

  useEffect(() => {
    const accessToken = auth.session?.access_token;
    const membership = auth.identity?.memberships.find((item) => item.tenant_id === activeTenantId);
    if (!accessToken || !activeTenantId || !membership?.permissions.includes('corporate.organization.read')) {
      setOrganizations([]);
      return;
    }
    let active = true;
    void listTenantOrganizations(accessToken, activeTenantId).then((rows) => {
      if (active) setOrganizations(rows);
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
    (invoiceId: string, method: string) => {
      const target = invoices.find((inv) => inv.id === invoiceId);
      if (!target || target.status === 'Lunas') return;

      setInvoices((prev) =>
        prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: 'Lunas' } : inv))
      );
      const payment: CorporatePaymentRecord = {
        id: nextId('PAY-2026'),
        invoiceId,
        paidAt: '17 Nov 2026',
        method,
        referenceNo: `VA-${Math.floor(10000000 + Math.random() * 89999999)}`,
        amount: target.amount,
        reconciliationStatus: 'Terekonsiliasi',
      };
      setPayments((prev) => [payment, ...prev]);
      setModal({ type: 'none' });
      showToast(`Pembayaran ${invoiceId} dikonfirmasi dan terekonsiliasi.`);
    },
    [invoices, showToast]
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
        const roleKey = (row.role_keys.find((key) => key.startsWith('corporate_')) ?? 'corporate_auditor') as CorporateRoleKey;
        const roleMeta = CORPORATE_ROLE_OPTIONS.find((role) => role.key === roleKey);
        return {
          id: row.id,
          name: row.display_name ?? row.email ?? row.user_id,
          email: row.email ?? '',
          roleKey,
          roleLabel: roleMeta?.label ?? roleKey,
          department: '',
          branchScope: '',
          status: row.status === 'active' ? 'Aktif' as const : 'Menunggu Aktivasi' as const,
          mfaEnabled: false,
          lastActive: 'Undangan dikirim',
        };
      }));
      setModal({ type: 'none' });
      showToast(`Undangan Supabase dikirim ke ${payload.email}.`);
    },
    [auth.session?.access_token, activeTenantId, showToast]
  );

  const handleCreateOrganization = useCallback(
    async (payload: { name: string; slug: string; organization_type: 'company' | 'division' | 'department' | 'branch' | 'team'; parent_id?: string | null }) => {
      const accessToken = auth.session?.access_token;
      if (!accessToken || !activeTenantId) throw new Error('Session atau tenant context tidak tersedia.');
      await createOrganization(accessToken, activeTenantId, payload);
      const rows = await listTenantOrganizations(accessToken, activeTenantId);
      setOrganizations(rows);
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
    organizations,
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
    handleMarkAlertRead,
    handleMarkAllAlertsRead,
    handleApproveWorkOrderQC,
    handleGenerateReport,
  };
}
