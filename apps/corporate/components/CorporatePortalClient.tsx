'use client';

import React from 'react';
import { CorporateAppShell } from './shell/CorporateAppShell';
import { CorporateModals } from './modals/CorporateModals';
import { useCorporatePortal } from '../hooks/useCorporatePortal';
import { CorporateLoginView } from '../features/auth/CorporateLoginView';
import { ExecutiveOverviewView } from '../features/overview/ExecutiveOverviewView';
import { BusinessAnalyticsView } from '../features/analytics/BusinessAnalyticsView';
import { SalesAffiliateAnalyticsView } from '../features/analytics/SalesAffiliateAnalyticsView';
import { HumanWorkforceView } from '../features/workforce/HumanWorkforceView';
import { AIWorkforceView } from '../features/workforce/AIWorkforceView';
import { TechnicalOperationsView } from '../features/technical/TechnicalOperationsView';
import { KpiPerformanceView } from '../features/kpi/KpiPerformanceView';
import { CommissionMonitoringView } from '../features/commission/CommissionMonitoringView';
import { AICreditsCenterView } from '../features/ai-credits/AICreditsCenterView';
import { ContractPartnershipView } from '../features/contracts/ContractPartnershipView';
import { InvoiceCenterView } from '../features/finance/InvoiceCenterView';
import { PaymentReconciliationView } from '../features/finance/PaymentReconciliationView';
import { ReportsExportView } from '../features/reports/ReportsExportView';
import { OrganizationUsersView } from '../features/organization/OrganizationUsersView';
import { NotificationsAlertsView } from '../features/notifications/NotificationsAlertsView';
import { LeaderboardView } from '../features/kpi/LeaderboardView';
import { SettingsGovernanceView } from '../features/settings/SettingsGovernanceView';
import type { CorporateSectionId } from '../lib/corporate-types';

export function CorporatePortalClient({
  initialSection = 'overview',
}: {
  initialSection?: CorporateSectionId;
}) {
  const portal = useCorporatePortal(initialSection);

  if (portal.authLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#F5F8FA] text-sm font-medium text-[#526675]">Memverifikasi sesi Agentzy…</div>;
  }

  if (!portal.isAuthenticated || !portal.activeTenant || portal.activeSection === 'login') {
    return <CorporateLoginView onLogin={portal.handleLogin} systemError={portal.authError} />;
  }

  const backToOverview = () => portal.navigateTo('overview');

  return (
    <>
      <CorporateAppShell
        activeTenant={portal.activeTenant}
        tenants={portal.tenantOptions}
        activeSection={portal.activeSection}
        alerts={portal.alerts}
        toastMessage={portal.toastMessage}
        onNavigate={portal.navigateTo}
        onSwitchTenant={portal.handleSwitchTenant}
        onOpenQuickAction={() => portal.setModal({ type: 'quick-action' })}
        onOpenLoginScreen={portal.handleLogout}
      >
        {portal.activeSection === 'overview' && (
          <ExecutiveOverviewView
            tenant={portal.activeTenant}
            aiCreditsBalance={portal.aiCreditsBalance}
            snapshot={portal.overviewSnapshot!}
            onNavigate={portal.navigateTo}
            onOpenTopUp={() => portal.setModal({ type: 'ai-credits-topup' })}
            onOpenContractModal={() =>
              portal.setModal({ type: 'contract-document', docKind: 'amendment' })
            }
          />
        )}

        {portal.activeSection === 'analytics' && (
          <BusinessAnalyticsView
            filter={portal.analyticsFilter}
            onOpenFilterModal={() => portal.setModal({ type: 'analytics-filter' })}
            onBack={backToOverview}
          />
        )}

        {portal.activeSection === 'sales-affiliate' && (
          <SalesAffiliateAnalyticsView
            onBack={backToOverview}
            onSelectSalesStaff={(staff) =>
              portal.setModal({
                type: 'sales-staff-detail',
                name: staff.name,
                grade: staff.grade,
                region: staff.region,
                personalSA: staff.personalSA,
                affiliateSA: staff.affiliateSA,
                activeAffiliates: staff.activeAffiliates,
                orders: staff.orders,
              })
            }
            onSelectAffiliate={(aff) =>
              portal.setModal({
                type: 'affiliate-detail',
                name: aff.name,
                orders: aff.orders,
                sponsorName: aff.sponsorStaffSales,
                region: aff.region,
                validRate: aff.validRate,
              })
            }
          />
        )}

        {portal.activeSection === 'human-workforce' && (
          <HumanWorkforceView onBack={backToOverview} />
        )}

        {portal.activeSection === 'ai-workforce' && (
          <AIWorkforceView
            aiWorkers={portal.aiWorkers}
            onSelectWorker={(workerId) =>
              portal.setModal({ type: 'ai-worker-detail', workerId })
            }
            onToggleWorkerStatus={portal.handleToggleAIWorkerStatus}
            onBack={backToOverview}
          />
        )}

        {portal.activeSection === 'technical-ops' && (
          <TechnicalOperationsView
            workOrders={portal.workOrders}
            onOpenMapModal={(workOrderId) =>
              portal.setModal({ type: 'work-order-map', workOrderId })
            }
            onOpenEvidenceModal={(workOrderId) =>
              portal.setModal({ type: 'work-order-evidence', workOrderId })
            }
            onBack={backToOverview}
          />
        )}

        {portal.activeSection === 'kpi-performance' && (
          <KpiPerformanceView
            onBack={backToOverview}
            onOpenFormulaModal={() => portal.setModal({ type: 'kpi-formula' })}
          />
        )}

        {portal.activeSection === 'commission' && (
          <CommissionMonitoringView
            onBack={backToOverview}
            onSelectCalculation={(calcId) =>
              portal.setModal({ type: 'commission-statement', calcId })
            }
          />
        )}

        {portal.activeSection === 'ai-credits' && (
          <AICreditsCenterView
            balance={portal.aiCreditsBalance}
            monthlyBudgetLimit={portal.monthlyBudgetLimit}
            aiWorkers={portal.aiWorkers}
            onOpenTopUp={() => portal.setModal({ type: 'ai-credits-topup' })}
            onOpenHistory={() => portal.setModal({ type: 'ai-credits-history' })}
            onOpenBudgetSettings={() =>
              portal.setModal({ type: 'ai-credits-budget' })
            }
            onBack={backToOverview}
          />
        )}

        {portal.activeSection === 'contracts' && (
          <ContractPartnershipView
            tenant={portal.activeTenant}
            onOpenDocumentModal={(docKind) =>
              portal.setModal({ type: 'contract-document', docKind })
            }
            onBack={backToOverview}
          />
        )}

        {portal.activeSection === 'invoices' && (
          <InvoiceCenterView
            invoices={portal.invoices}
            onSelectInvoice={(invoiceId) =>
              portal.setModal({ type: 'invoice-detail', invoiceId })
            }
            onBack={backToOverview}
          />
        )}

        {portal.activeSection === 'payments' && (
          <PaymentReconciliationView
            invoices={portal.invoices}
            payments={portal.payments}
            onOpenReconcileModal={(invoiceId) =>
              portal.setModal({ type: 'payment-reconcile', invoiceId })
            }
            onBack={backToOverview}
          />
        )}

        {portal.activeSection === 'reports' && (
          <ReportsExportView
            reportHistory={portal.reportHistory}
            onSelectCategory={(category) =>
              portal.setModal({ type: 'report-export', category })
            }
            onBack={backToOverview}
          />
        )}

        {portal.activeSection === 'organization' && (
          <OrganizationUsersView
            tenant={portal.activeTenant}
            users={portal.users}
            organizations={portal.organizations}
            canManageOrganization={portal.canManageOrganizations}
            onCreateOrganization={portal.handleCreateOrganization}
            onOpenInviteModal={() => portal.setModal({ type: 'invite-user' })}
            onBack={backToOverview}
          />
        )}

        {portal.activeSection === 'notifications' && (
          <NotificationsAlertsView
            alerts={portal.alerts}
            onMarkRead={portal.handleMarkAlertRead}
            onMarkAllRead={portal.handleMarkAllAlertsRead}
            onNavigate={portal.navigateTo}
            onBack={backToOverview}
          />
        )}

        {portal.activeSection === 'leaderboard' && (
          <LeaderboardView onBack={backToOverview} />
        )}

        {portal.activeSection === 'settings' && (
          <SettingsGovernanceView
            tenant={portal.activeTenant}
            onOpenSettingsModal={(key) =>
              portal.setModal({ type: 'settings-modal', key })
            }
            onLogout={portal.handleLogout}
            onBack={backToOverview}
          />
        )}
      </CorporateAppShell>

      <CorporateModals
        modal={portal.modal}
        tenant={portal.activeTenant}
        aiWorkers={portal.aiWorkers}
        aiCreditsBalance={portal.aiCreditsBalance}
        monthlyBudgetLimit={portal.monthlyBudgetLimit}
        autoTopupEnabled={portal.autoTopupEnabled}
        creditTransactions={portal.creditTransactions}
        workOrders={portal.workOrders}
        invoices={portal.invoices}
        analyticsFilter={portal.analyticsFilter}
        onClose={() => portal.setModal({ type: 'none' })}
        onNavigate={portal.navigateTo}
        onSetModal={portal.setModal}
        onUpdateAnalyticsFilter={portal.setAnalyticsFilter}
        onToggleAIWorkerStatus={portal.handleToggleAIWorkerStatus}
        onTopUpCredits={portal.handleTopUpCredits}
        onSaveBudgetSettings={(limit, autoTopup) => {
          portal.setMonthlyBudgetLimit(limit);
          portal.setAutoTopupEnabled(autoTopup);
        }}
        onPayInvoice={portal.handlePayInvoice}
        onInviteUser={portal.handleInviteUser}
        onApproveWorkOrderQC={portal.handleApproveWorkOrderQC}
        onGenerateReport={portal.handleGenerateReport}
        onShowToast={portal.showToast}
      />
    </>
  );
}
