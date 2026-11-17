'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  CORPORATE_ROLE_OPTIONS,
  CORPORATE_TENANTS,
} from '../lib/corporate-data';
import { corporatePortalService } from '../services/corporate-service';
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
  const initialCollections = useMemo(
    () => corporatePortalService.getInitialDomainCollections(),
    []
  );

  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [activeTenantId, setActiveTenantId] = useState<string>(CORPORATE_TENANTS[0].id);
  const [activeSection, setActiveSection] = useState<CorporateSectionId>(initialSection);
  const [modal, setModal] = useState<CorporateModalState>({ type: 'none' });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const idCounter = useRef(500);

  // Stateful collections
  const [aiWorkers, setAiWorkers] = useState<AIWorkerRecord[]>(initialCollections.aiWorkers);
  const [aiCreditsBalance, setAiCreditsBalance] = useState<number>(1250000);
  const [monthlyBudgetLimit, setMonthlyBudgetLimit] = useState<number>(1250000);
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

  const activeTenant = useMemo(
    () => CORPORATE_TENANTS.find((t) => t.id === activeTenantId) ?? CORPORATE_TENANTS[0],
    [activeTenantId]
  );

  const overviewSnapshot = useMemo(
    () => corporatePortalService.getExecutiveOverviewSnapshot(activeTenantId),
    [activeTenantId]
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

  const navigateTo = useCallback((section: CorporateSectionId) => {
    setActiveSection(section);
    setModal({ type: 'none' });
  }, []);

  const handleLogin = useCallback(
    (tenantId: string, email: string, method: 'password' | 'sso') => {
      setActiveTenantId(tenantId);
      setIsAuthenticated(true);
      setActiveSection('overview');
      const tenant = CORPORATE_TENANTS.find((t) => t.id === tenantId);
      showToast(
        `Berhasil masuk ke ${tenant?.name ?? 'Corporate Portal'} (${method === 'sso' ? 'SSO Enterprise' : email}).`
      );
    },
    [showToast]
  );

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setActiveSection('login');
    setModal({ type: 'none' });
  }, []);

  const handleSwitchTenant = useCallback(
    (tenantId: string) => {
      setActiveTenantId(tenantId);
      const tenant = CORPORATE_TENANTS.find((t) => t.id === tenantId);
      showToast(`Konteks tenant aktif berpindah ke ${tenant?.name} (${tenant?.code}).`);
    },
    [showToast]
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
    (payload: {
      name: string;
      email: string;
      roleKey: CorporateRoleKey;
      department: string;
      branchScope: string;
    }) => {
      const roleMeta = CORPORATE_ROLE_OPTIONS.find((r) => r.key === payload.roleKey);
      const nextUser: CorporateUserMember = {
        id: nextId('USR'),
        name: payload.name,
        email: payload.email,
        roleKey: payload.roleKey,
        roleLabel: roleMeta?.label ?? payload.roleKey,
        department: payload.department,
        branchScope: payload.branchScope,
        status: 'Menunggu Aktivasi',
        mfaEnabled: true,
        lastActive: 'Undangan terkirim',
      };
      setUsers((prev) => [nextUser, ...prev]);
      setModal({ type: 'none' });
      showToast(`Undangan RBAC dikirim ke ${payload.email} (${nextUser.roleLabel}).`);
    },
    [showToast]
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
    [activeTenant.code, activeTenant.name, showToast]
  );

  return {
    isAuthenticated,
    activeTenant,
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
    handleMarkAlertRead,
    handleMarkAllAlertsRead,
    handleApproveWorkOrderQC,
    handleGenerateReport,
  };
}
