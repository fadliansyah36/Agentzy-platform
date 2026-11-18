'use client';

import React from 'react';
import { useAdminPortal } from '../hooks/useAdminPortal';
import type { AdminSectionId } from '../lib/admin-types';
import { AdminAppShell } from './shell/AdminAppShell';
import { AdminModals } from './modals/AdminModals';
import { AdminLoginView } from '../features/auth/AdminLoginView';
import { GlobalOverviewView } from '../features/overview/GlobalOverviewView';
import { TenantDirectoryView } from '../features/tenants/TenantDirectoryView';
import { CorporateOnboardingView } from '../features/tenants/CorporateOnboardingView';
import { MasterDataView } from '../features/master-data/MasterDataView';
import { SubscriptionPlansView } from '../features/master-data/SubscriptionPlansView';
import { OrganizationUsersView } from '../features/organization/OrganizationUsersView';
import { RbacMatrixView } from '../features/organization/RbacMatrixView';
import { HumanWorkforceAdminView } from '../features/workforce/HumanWorkforceAdminView';
import { AIWorkerRegistryAdminView } from '../features/workforce/AIWorkerRegistryAdminView';
import { AIWorkerDetailAdminView } from '../features/workforce/AIWorkerDetailAdminView';
import { LLMProvidersView } from '../features/ai-platform/LLMProvidersView';
import { ModelRegistryView } from '../features/ai-platform/ModelRegistryView';
import { ModelRouterAdminView } from '../features/ai-platform/ModelRouterAdminView';
import { SkillRegistryAdminView } from '../features/ai-platform/SkillRegistryAdminView';
import { ToolRegistryAdminView } from '../features/ai-platform/ToolRegistryAdminView';
import { MemoryGovernanceView } from '../features/ai-platform/MemoryGovernanceView';
import { KnowledgeRagAdminView } from '../features/ai-platform/KnowledgeRagAdminView';
import { WorkflowOrchestrationAdminView } from '../features/ai-platform/WorkflowOrchestrationAdminView';
import { AICreditsAdminView } from '../features/finance/AICreditsAdminView';
import { BillingSubscriptionView } from '../features/finance/BillingSubscriptionView';
import { FinanceReconciliationView } from '../features/finance/FinanceReconciliationView';
import { ContractSowSlaView } from '../features/finance/ContractSowSlaView';
import { CommissionSchemesView } from '../features/finance/CommissionSchemesView';
import { IntegrationsWebhooksView } from '../features/governance/IntegrationsWebhooksView';
import { SecurityCenterView } from '../features/governance/SecurityCenterView';
import { AuditIncidentView } from '../features/governance/AuditIncidentView';
import { DataGovernanceView } from '../features/governance/DataGovernanceView';
import { GlobalAnalyticsHealthView } from '../features/governance/GlobalAnalyticsHealthView';

export function AdminPortalClient({
  initialSection = 'overview',
}: {
  initialSection?: AdminSectionId;
}) {
  const portal = useAdminPortal(initialSection);

  if (portal.authLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#F5F8FA] text-sm font-medium text-[#526675]">Memverifikasi sesi Agentzy…</div>;
  }

  if (!portal.isAuthenticated || portal.activeSection === 'login') {
    return (
      <AdminLoginView
        onLogin={portal.handleLogin}
        systemError={portal.authError}
      />
    );
  }

  const pendingApprovalsCount = portal.workflowApprovals.filter(
    (a) => a.status === 'Menunggu'
  ).length;
  const openIncidentsCount = portal.incidents.filter(
    (i) => i.status !== 'Terselesaikan'
  ).length;
  const activeBreakGlassCount = portal.breakGlassRequests.filter(
    (b) => b.status === 'Aktif' || b.status === 'Menunggu Approval'
  ).length;

  const backToOverview = () => portal.navigateTo('overview');

  return (
    <>
      <AdminAppShell
        activeSection={portal.activeSection}
        adminRole={portal.adminRole}
        adminEmail={portal.adminEmail}
        permissions={portal.platformPermissions}
        pendingApprovalsCount={pendingApprovalsCount}
        openIncidentsCount={openIncidentsCount}
        activeBreakGlassCount={activeBreakGlassCount}
        toastMessage={portal.toastMessage}
        onNavigate={portal.navigateTo}
        onOpenQuickAction={() => portal.setModal({ type: 'quick-action' })}
        onOpenBreakGlass={() => portal.setModal({ type: 'break-glass-request' })}
        onLogout={portal.handleLogout}
      >
        {portal.activeSection === 'overview' && (
          <GlobalOverviewView
            tenants={portal.tenants}
        permissionRegistry={portal.permissionRegistry}
            providersCount={portal.providers.length}
            humanTotal={portal.tenants.reduce((total, tenant) => total + tenant.humanCount, 0)}
            aiWorkersTotal={portal.tenants.reduce((total, tenant) => total + tenant.aiWorkerCount, 0)}
            breakGlassRequests={portal.breakGlassRequests}
            onNavigate={portal.navigateTo}
            onOpenBreakGlass={() => portal.setModal({ type: 'break-glass-request' })}
          />
        )}

        {portal.activeSection === 'tenants' && (
          <TenantDirectoryView
            tenants={portal.tenants}
            onOpenCreate={() => portal.setModal({ type: 'tenant-crud' })}
            onOpenEdit={(tenant) => portal.setModal({ type: 'tenant-crud', tenant })}
            onOpenDetail={(tenantId) =>
              portal.setModal({ type: 'tenant-detail', tenantId })
            }
            onDelete={portal.deleteTenant}
            onBack={backToOverview}
          />
        )}

        {portal.activeSection === 'onboarding' && (
          <CorporateOnboardingView
            providers={portal.providers}
            onSubmitOnboarding={portal.processCorporateOnboarding}
            onOpenAddProvider={() => portal.setModal({ type: 'provider-crud' })}
            onOpenEditProvider={(provider) =>
              portal.setModal({ type: 'provider-crud', provider })
            }
            onDeleteProvider={portal.deleteIspProvider}
            onBack={backToOverview}
          />
        )}

        {portal.activeSection === 'master-data' && (
          <MasterDataView
            industries={portal.industries}
            services={portal.services}
            products={portal.products}
            onOpenIndustryModal={(industry) =>
              portal.setModal({ type: 'industry-crud', industry })
            }
            onDeleteIndustry={portal.deleteIndustry}
            onOpenServiceModal={(service) =>
              portal.setModal({ type: 'service-crud', service })
            }
            onDeleteService={portal.deleteMasterService}
            onOpenProductModal={(product) =>
              portal.setModal({ type: 'product-crud', product })
            }
            onDeleteProduct={portal.deleteMasterProduct}
            onBack={backToOverview}
          />
        )}

        {portal.activeSection === 'subscriptions' && (
          <SubscriptionPlansView
            policies={portal.cooperationPolicies}
            onOpenPolicyModal={(policy) =>
              portal.setModal({ type: 'cooperation-policy-crud', policy })
            }
            onToggleEntitlement={portal.toggleCooperationEntitlement}
          />
        )}

        {portal.activeSection === 'organization' && (
          <OrganizationUsersView
            tenants={portal.tenants}
            orgUnits={portal.orgUnits}
            users={portal.users}
            onOpenOrgUnitModal={(unit) =>
              portal.setModal({ type: 'org-unit-crud', unit })
            }
            onDeleteOrgUnit={portal.deleteOrgUnit}
            onOpenUserModal={(user) => portal.setModal({ type: 'user-crud', user })}
            onDeleteUser={portal.deletePlatformUser}
            onBack={backToOverview}
          />
        )}

        {portal.activeSection === 'rbac' && (
          <RbacMatrixView
            roles={portal.roles}
            onOpenRoleModal={(role) => portal.setModal({ type: 'role-crud', role })}
            onCyclePermission={portal.cycleRolePermission}
            onDeleteRole={portal.deleteRbacRole}
            onBack={backToOverview}
          />
        )}

        {portal.activeSection === 'human-workforce' && (
          <HumanWorkforceAdminView
            staffList={portal.staffList}
            corporateSchemas={portal.corporateSchemas}
            onOpenStaffModal={(staff) => portal.setModal({ type: 'staff-crud', staff })}
            onVerifyStaff={portal.verifyHumanStaff}
            onDeleteStaff={portal.deleteHumanStaff}
            onShowToast={portal.showToast}
            onBack={backToOverview}
          />
        )}

        {portal.activeSection === 'ai-workers' && (
          <AIWorkerRegistryAdminView
            aiWorkers={portal.aiWorkers}
            onSelectWorker={(workerId) => {
              portal.setSelectedAiWorkerId(workerId);
              portal.navigateTo('ai-worker-detail');
            }}
            onToggleStatus={portal.toggleAiWorkerStatus}
            onOpenCreate={() => portal.setModal({ type: 'ai-worker-crud' })}
            onBack={backToOverview}
          />
        )}

        {portal.activeSection === 'ai-worker-detail' && portal.selectedAiWorker && (
          <AIWorkerDetailAdminView
            worker={portal.selectedAiWorker}
            allWorkers={portal.aiWorkers}
            onSelectWorker={portal.setSelectedAiWorkerId}
            onEditWorker={(worker) =>
              portal.setModal({ type: 'ai-worker-crud', worker })
            }
            onToggleStatus={portal.toggleAiWorkerStatus}
            onChangeLifecycle={portal.updateAiWorkerLifecycle}
            onDeleteWorker={portal.deleteAiWorker}
            onBackToRegistry={() => portal.navigateTo('ai-workers')}
          />
        )}

        {portal.activeSection === 'llm-providers' && (
          <LLMProvidersView
            providers={portal.llmProviders}
            onOpenCreate={() => portal.setModal({ type: 'llm-provider-crud' })}
            onOpenEdit={(provider) =>
              portal.setModal({ type: 'llm-provider-crud', provider })
            }
            onDelete={portal.deleteLlmProvider}
            onTestHealth={(name) =>
              portal.showToast(`Health check LLM Gateway ${name}: OK (Latensi 490ms).`)
            }
            onBack={backToOverview}
          />
        )}

        {portal.activeSection === 'model-registry' && (
          <ModelRegistryView
            models={portal.models}
            onOpenCreate={() => portal.setModal({ type: 'model-crud' })}
            onOpenEdit={(model) => portal.setModal({ type: 'model-crud', model })}
            onToggleStatus={portal.toggleModelStatus}
            onDelete={portal.deleteModel}
            onBack={backToOverview}
          />
        )}

        {portal.activeSection === 'model-router' && (
          <ModelRouterAdminView
            policyName={portal.routingPolicyName}
            onChangePolicyName={(name) => {
              portal.setRoutingPolicyName(name);
              portal.showToast(`Kebijakan router diubah menjadi ${name}.`);
            }}
            fallbackEnabled={portal.routingFallbackEnabled}
            onToggleFallback={() =>
              portal.setRoutingFallbackEnabled((prev) => !prev)
            }
            routingActive={portal.routingActive}
            onToggleRoutingActive={() => portal.setRoutingActive((prev) => !prev)}
            rules={portal.routingRules}
            onOpenRuleModal={(rule) =>
              portal.setModal({ type: 'routing-rule-crud', rule })
            }
            onToggleRule={portal.toggleRoutingRule}
            onDeleteRule={portal.deleteRoutingRule}
            onBack={backToOverview}
          />
        )}

        {portal.activeSection === 'skills' && (
          <SkillRegistryAdminView
            skills={portal.skills}
            onOpenModal={(skill) => portal.setModal({ type: 'skill-crud', skill })}
            onDecideApproval={portal.decideSkillApproval}
            onDelete={portal.deleteSkill}
            onBack={backToOverview}
          />
        )}

        {portal.activeSection === 'tools' && (
          <ToolRegistryAdminView
            tools={portal.tools}
            onOpenModal={(tool) => portal.setModal({ type: 'tool-crud', tool })}
            onDelete={portal.deleteTool}
            onBack={backToOverview}
          />
        )}

        {portal.activeSection === 'memory-governance' && (
          portal.memoryPolicy ? (
            <MemoryGovernanceView
              policy={portal.memoryPolicy}
              onChangePolicy={portal.setMemoryPolicy}
              layers={portal.memoryLayers}
              onNotify={portal.showToast}
              onBack={backToOverview}
            />
          ) : (
            <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-6 text-sm text-[#526675]">Kebijakan memory belum dikonfigurasi di backend Agentzy.</div>
          )
        )}

        {portal.activeSection === 'knowledge-rag' && (
          <KnowledgeRagAdminView
            sources={portal.knowledgeSources}
            onOpenModal={(source) =>
              portal.setModal({ type: 'knowledge-crud', source })
            }
            onReindex={portal.reindexKnowledgeSource}
            onDelete={portal.deleteKnowledgeSource}
            onBack={backToOverview}
          />
        )}

        {portal.activeSection === 'workflows' && (
          <WorkflowOrchestrationAdminView
            workflows={portal.workflows}
            runs={portal.workflowRuns}
            approvals={portal.workflowApprovals}
            onOpenModal={(workflow) =>
              portal.setModal({ type: 'workflow-crud', workflow })
            }
            onDeleteWorkflow={portal.deleteWorkflow}
            onRetryRun={portal.retryWorkflowRun}
            onDecideApproval={portal.decideWorkflowApproval}
            onBack={backToOverview}
          />
        )}

        {portal.activeSection === 'ai-credits' && (
          <AICreditsAdminView
            balance={portal.platformCreditsBalance}
            usedMonth={portal.platformCreditsUsedMonth}
            tenants={portal.tenants}
            pricingRules={portal.creditPricingRules}
            ledger={portal.creditLedger}
            onOpenTopUp={() => portal.setModal({ type: 'credit-topup' })}
            onOpenPricingModal={(rule) =>
              portal.setModal({ type: 'credit-pricing-crud', rule })
            }
            onBack={backToOverview}
          />
        )}

        {portal.activeSection === 'billing' && (
          <BillingSubscriptionView
            creditTopUpPackages={portal.creditTopUpPackages}
            tenants={portal.tenants}
            invoices={portal.invoices}
            onOpenTopUpModal={(presetTenantName, presetCredits) =>
              portal.setModal({
                type: 'credit-topup',
                presetTenantName,
                presetCredits,
              })
            }
            onOpenInvoiceModal={() => portal.setModal({ type: 'invoice-crud' })}
            onOpenInvoiceDetail={(invoiceId) =>
              portal.setModal({ type: 'invoice-detail', invoiceId })
            }
            onMarkInvoicePaid={portal.markInvoicePaid}
          />
        )}

        {portal.activeSection === 'finance' && (
          <FinanceReconciliationView
            reconciliations={portal.reconciliations}
            onVerify={portal.verifyReconciliation}
            onNotify={portal.showToast}
            onBack={backToOverview}
          />
        )}

        {portal.activeSection === 'contracts' && (
          <ContractSowSlaView
            contracts={portal.contracts}
            onOpenModal={(doc) => portal.setModal({ type: 'contract-crud', doc })}
            onDelete={portal.deleteContractDoc}
            onBack={backToOverview}
          />
        )}

        {portal.activeSection === 'commission-schemes' && (
          <CommissionSchemesView
            schemes={portal.commissionSchemes}
            corporateSchemas={portal.corporateSchemas}
            technicianBonusRules={portal.technicianBonusRules}
            onOpenSchemeModal={(scheme) =>
              portal.setModal({ type: 'commission-scheme-crud', scheme })
            }
            onDeleteScheme={portal.deleteCommissionScheme}
            onOpenCorpSchemaModal={(schema) =>
              portal.setModal({ type: 'corp-comp-crud', schema })
            }
            onDeleteCorpSchema={portal.deleteCorporateSchema}
            onOpenTechBonusModal={(rule) =>
              portal.setModal({ type: 'tech-bonus-crud', rule })
            }
            onToggleTechBonusStatus={portal.toggleTechBonusRuleStatus}
            onDeleteTechBonusRule={portal.deleteTechBonusRule}
            onBack={backToOverview}
          />
        )}

        {portal.activeSection === 'integrations' && (
          <IntegrationsWebhooksView
            integrations={portal.integrations}
            webhookLogs={portal.webhookLogs}
            onOpenModal={(connector) =>
              portal.setModal({ type: 'integration-crud', connector })
            }
            onDelete={portal.deleteIntegration}
            onTestPing={portal.testWebhookConnector}
            onBack={backToOverview}
          />
        )}

        {portal.activeSection === 'security' && (
          <SecurityCenterView
            mfaEnforced={portal.mfaEnforced}
            onToggleMfa={() => {
              portal.setMfaEnforced((prev) => !prev);
              portal.showToast('Kebijakan MFA (2FA) platform diperbarui.');
            }}
            activeSessionsCount={portal.activeSessionsCount}
            onRevokeAllSessions={() => {
              portal.setActiveSessionsCount(1);
              portal.showToast('17 sesi non-esensial dicabut paksa.');
            }}
            ipAllowlistEnabled={portal.ipAllowlistEnabled}
            sessionTtlMinutes={portal.sessionTtlMinutes}
            breakGlassRequests={portal.breakGlassRequests}
            currentUserId={portal.currentUserId}
            onOpenBreakGlassModal={() => portal.setModal({ type: 'break-glass-request' })}
            onDecideBreakGlass={portal.decideBreakGlass}
            onOpenSecurityPolicyModal={() => portal.setModal({ type: 'security-policy' })}
            featureFlags={portal.featureFlags}
            onToggleFeatureFlag={portal.toggleFeatureFlag}
            onBack={backToOverview}
          />
        )}

        {portal.activeSection === 'audit-logs' && (
          <AuditIncidentView
            auditLogs={portal.auditLogs}
            incidents={portal.incidents}
            onOpenAuditDetail={(logId) =>
              portal.setModal({ type: 'audit-detail', logId })
            }
            onExportAudit={portal.exportAuditLogs}
            onOpenCreateIncident={() => portal.setModal({ type: 'incident-crud' })}
            onResolveIncident={portal.resolveIncident}
            onNotify={portal.showToast}
            onBack={backToOverview}
          />
        )}

        {portal.activeSection === 'data-governance' && (
          <DataGovernanceView
            dsrRequests={portal.dsrRequests}
            vendors={portal.vendors}
            onAdvanceDsr={portal.advanceDsrStatus}
            onOpenVendorModal={(vendor) =>
              portal.setModal({ type: 'vendor-crud', vendor })
            }
            onDeleteVendor={portal.deleteVendor}
            onNotify={portal.showToast}
            onBack={backToOverview}
          />
        )}

        {portal.activeSection === 'global-analytics' && (
          <GlobalAnalyticsHealthView
            tenants={portal.tenants}
            onBack={backToOverview}
          />
        )}
      </AdminAppShell>

      <AdminModals
        modal={portal.modal}
        onClose={() => portal.setModal({ type: 'none' })}
        onNavigate={portal.navigateTo}
        onSetModal={portal.setModal}
        tenants={portal.tenants}
        permissionRegistry={portal.permissionRegistry}
        corporateSchemas={portal.corporateSchemas}
        invoices={portal.invoices}
        auditLogs={portal.auditLogs}
        ipAllowlistEnabled={portal.ipAllowlistEnabled}
        sessionTtlMinutes={portal.sessionTtlMinutes}
        onUpsertTenant={portal.upsertTenant}
        onUpsertProvider={portal.upsertIspProvider}
        onUpsertIndustry={portal.upsertIndustry}
        onUpsertService={portal.upsertMasterService}
        onUpsertProduct={portal.upsertMasterProduct}
        onUpsertCooperationPolicy={portal.upsertCooperationPolicy}
        onUpsertOrgUnit={portal.upsertOrgUnit}
        onUpsertUser={portal.upsertPlatformUser}
        onUpsertRole={portal.upsertRbacRole}
        onUpsertStaff={portal.upsertHumanStaff}
        onUpsertAiWorker={portal.upsertAiWorker}
        onUpsertLlmProvider={portal.upsertLlmProvider}
        onUpsertModel={portal.upsertModel}
        onUpsertRoutingRule={portal.upsertRoutingRule}
        onUpsertSkill={portal.upsertSkill}
        onUpsertTool={portal.upsertTool}
        onUpsertKnowledge={portal.upsertKnowledgeSource}
        onUpsertWorkflow={portal.upsertWorkflow}
        onTopUpCredits={portal.topUpPlatformCredits}
        onUpsertCreditPricing={portal.upsertCreditPricingRule}
        onIssueInvoice={portal.issuePlatformInvoice}
        onMarkInvoicePaid={portal.markInvoicePaid}
        onUpsertContract={portal.upsertContractDoc}
        onUpsertCommissionScheme={portal.upsertCommissionScheme}
        onUpsertCorpSchema={portal.upsertCorporateSchema}
        onUpsertTechBonusRule={portal.upsertTechBonusRule}
        onUpsertIntegration={portal.upsertIntegration}
        onCreateBreakGlass={portal.createBreakGlassRequest}
        onUpdateSecurityPolicy={(ipAllow, ttl) => {
          portal.setIpAllowlistEnabled(ipAllow);
          portal.setSessionTtlMinutes(ttl);
          portal.setModal({ type: 'none' });
          portal.showToast(
            `Kebijakan keamanan diperbarui (IP Allowlist: ${ipAllow ? 'Aktif' : 'Nonaktif'}, TTL: ${ttl} mnt).`
          );
        }}
        onCreateIncident={portal.createIncident}
        onUpsertVendor={portal.upsertVendor}
      />
    </>
  );
}
