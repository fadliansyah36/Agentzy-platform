'use client';

import React from 'react';
import { useAIWorkforcePortal } from '../hooks/useAIWorkforcePortal';
import type { AIWorkforceSectionId } from '../lib/ai-workforce-types';
import { AIWorkforceLoginView } from '../features/auth/AIWorkforceLoginView';
import { AIWorkforceAppShell } from './shell/AIWorkforceAppShell';
import { AIWorkforceOverviewView } from '../features/overview/AIWorkforceOverviewView';
import { AIWorkerRegistryView } from '../features/workers/AIWorkerRegistryView';
import { AIWorkerDetailView } from '../features/workers/AIWorkerDetailView';
import { AIWorkerStudioView } from '../features/workers/AIWorkerStudioView';
import { ContentStudioView } from '../features/content-studio/ContentStudioView';
import { ModelRouterView } from '../features/capabilities/ModelRouterView';
import { SkillsToolsView } from '../features/capabilities/SkillsToolsView';
import { MemoryKnowledgeView } from '../features/capabilities/MemoryKnowledgeView';
import { TasksCollaborationView } from '../features/collaboration/TasksCollaborationView';
import { HumanAIBindingView } from '../features/collaboration/HumanAIBindingView';
import { WorkflowCenterView } from '../features/workflows/WorkflowCenterView';
import { WorkflowBuilderView } from '../features/workflows/WorkflowBuilderView';
import { WorkflowRunsView } from '../features/workflows/WorkflowRunsView';
import { ApprovalsHandoffView } from '../features/approvals/ApprovalsHandoffView';
import { CreditsPerformanceView } from '../features/analytics/CreditsPerformanceView';
import { SafetyAuditSettingsView } from '../features/governance/SafetyAuditSettingsView';
import { AIWorkforceModals } from './modals/AIWorkforceModals';

export function AIWorkforcePortalClient({
  initialSection = 'overview',
}: {
  initialSection?: AIWorkforceSectionId;
}) {
  const portal = useAIWorkforcePortal(initialSection);

  // Screens 1 & 2: Splash Onboarding or Login & Pilih Tenant
  if (
    !portal.isAuthenticated ||
    portal.activeSection === 'splash' ||
    portal.activeSection === 'login'
  ) {
    return (
      <AIWorkforceLoginView
        mode={portal.activeSection === 'splash' ? 'splash' : 'login'}
        initialTenantId={portal.activeTenantId}
        onStartFromSplash={() => portal.navigateTo('login')}
        onLogin={portal.handleLogin}
        onSwitchMode={(m) => portal.navigateTo(m)}
      />
    );
  }

  const pendingApprovalsCount = portal.approvals.filter(
    (a) => a.status === 'Menunggu'
  ).length;
  const failedRunsCount = portal.runs.filter(
    (r) => r.status === 'Gagal'
  ).length;

  return (
    <>
      <AIWorkforceAppShell
        activeTenant={portal.activeTenant}
        activeSection={portal.activeSection}
        pendingApprovalsCount={pendingApprovalsCount}
        failedRunsCount={failedRunsCount}
        toastMessage={portal.toastMessage}
        onNavigate={portal.navigateTo}
        onSwitchTenant={(tenantId) => {
          portal.setActiveTenantId(tenantId);
          portal.showToast('Workspace tenant AI Workforce berhasil diganti');
        }}
        onOpenQuickAction={() => portal.setModal({ type: 'quick-action' })}
        onOpenLoginScreen={() => {
          portal.setIsAuthenticated(false);
          portal.navigateTo('login');
        }}
        onOpenSplashScreen={() => {
          portal.setIsAuthenticated(false);
          portal.navigateTo('splash');
        }}
      >
        {portal.activeSection === 'overview' && (
          <AIWorkforceOverviewView
            tenant={portal.activeTenant}
            aiWorkers={portal.aiWorkers}
            runs={portal.runs}
            approvals={portal.approvals}
            aiCreditsBalance={portal.aiCreditsBalance}
            monthlyHardLimit={portal.monthlyHardLimit}
            onNavigate={portal.navigateTo}
            onOpenTopUp={() => portal.setModal({ type: 'topup-credits' })}
          />
        )}

        {portal.activeSection === 'content-studio' && (
          <ContentStudioView
            artifacts={portal.contentArtifacts}
            selectedArtifact={portal.selectedArtifact}
            chatMessages={portal.contentChat}
            isGenerating={portal.isGeneratingContent}
            error={portal.contentError}
            onSelectArtifact={portal.setSelectedArtifactId}
            onGenerate={portal.handleGenerateContentArtifact}
            onShowToast={portal.showToast}
          />
        )}

        {portal.activeSection === 'workers' && (
          <AIWorkerRegistryView
            aiWorkers={portal.aiWorkers}
            onSelectWorker={(id) => {
              portal.setSelectedWorkerId(id);
              portal.navigateTo('worker-detail');
            }}
            onToggleStatus={portal.handleToggleWorkerStatus}
            onOpenStudio={() => portal.navigateTo('worker-studio')}
          />
        )}

        {portal.activeSection === 'worker-detail' && (
          <AIWorkerDetailView
            worker={portal.selectedWorker}
            allWorkers={portal.aiWorkers}
            onSelectWorker={(id) => portal.setSelectedWorkerId(id)}
            onBack={() => portal.navigateTo('workers')}
            onEditJD={(workerId) =>
              portal.setModal({
                type: 'edit-jd',
                workerId,
              })
            }
            onCreateNewVersion={portal.handleCreateNewWorkerVersion}
            onRollbackVersion={portal.handleRollbackWorkerVersion}
          />
        )}

        {portal.activeSection === 'worker-studio' && (
          <AIWorkerStudioView
            onCancel={() => portal.navigateTo('workers')}
            onCreateWorker={portal.handleCreateAIWorker}
          />
        )}

        {portal.activeSection === 'model-router' && (
          <ModelRouterView
            providers={portal.providers}
            routingRules={portal.routingRules}
            onUpdateRoutingRules={portal.setRoutingRules}
            onNotify={portal.showToast}
          />
        )}

        {portal.activeSection === 'skills-tools' && (
          <SkillsToolsView
            skills={portal.skills}
            tools={portal.tools}
            onInstallSkill={portal.handleInstallSkill}
            onOpenAddSkill={() => portal.setModal({ type: 'add-skill' })}
            onToggleToolPermission={portal.handleToggleToolPermission}
          />
        )}

        {portal.activeSection === 'memory-rag' && (
          <MemoryKnowledgeView
            memoryLayers={portal.memoryLayers}
            knowledgeSources={portal.knowledgeSources}
            onToggleMemoryStatus={portal.handleToggleMemoryStatus}
            onOpenAddKnowledge={() =>
              portal.setModal({ type: 'add-knowledge' })
            }
          />
        )}

        {portal.activeSection === 'tasks-collab' && (
          <TasksCollaborationView
            tasksGoals={portal.tasksGoals}
            collabMessages={portal.collabMessages}
            handoffs={portal.handoffs}
            onToggleTaskGoal={portal.handleToggleTaskGoal}
            onOpenCreateTaskGoal={() =>
              portal.setModal({ type: 'create-task-goal' })
            }
            onSendCollabMessage={portal.handleSendCollabMessage}
            onOpenHandoffModal={(handoffId) =>
              portal.setModal({ type: 'handoff-assign', handoffId })
            }
            onNavigate={portal.navigateTo}
          />
        )}

        {portal.activeSection === 'human-ai-binding' && (
          <HumanAIBindingView
            bindings={portal.humanAiBindings}
            aiWorkers={portal.aiWorkers}
            managerRole={portal.managerRole}
            canManageBindings={portal.canManageBindings}
            onChangeManagerRole={portal.setManagerRole}
            onOpenCreateBinding={() =>
              portal.setModal({ type: 'create-binding' })
            }
            onToggleBindingStatus={portal.handleToggleBindingStatus}
            onUpdateBindingAiWorker={portal.handleUpdateBindingAiWorker}
          />
        )}

        {portal.activeSection === 'workflows' && (
          <WorkflowCenterView
            workflows={portal.workflows}
            selectedWorkflowId={portal.selectedWorkflow.id}
            onSelectWorkflow={portal.setSelectedWorkflowId}
            onExecuteWorkflow={portal.handleExecuteWorkflow}
            onOpenVersionCompare={(workflowId) =>
              portal.setModal({ type: 'version-compare', workflowId })
            }
            onCreateWorkflowVersion={portal.handleCreateWorkflowVersion}
            onNavigate={portal.navigateTo}
          />
        )}

        {portal.activeSection === 'workflow-builder' && (
          <WorkflowBuilderView
            workflows={portal.workflows}
            selectedWorkflow={portal.selectedWorkflow}
            onSelectWorkflow={portal.setSelectedWorkflowId}
            onOpenAddNodeModal={(workflowId) =>
              portal.setModal({ type: 'add-workflow-node', workflowId })
            }
            onExecuteWorkflow={portal.handleExecuteWorkflow}
          />
        )}

        {portal.activeSection === 'runs' && (
          <WorkflowRunsView
            runs={portal.runs}
            onOpenRunDetail={(runId) =>
              portal.setModal({ type: 'run-detail', runId })
            }
            onRetryRun={portal.handleRetryRun}
            onOpenCompensationModal={(runId) =>
              portal.setModal({ type: 'compensation-remediation', runId })
            }
          />
        )}

        {portal.activeSection === 'approvals' && (
          <ApprovalsHandoffView
            approvals={portal.approvals}
            handoffs={portal.handoffs}
            onApprovalDecision={portal.handleApprovalDecision}
            onOpenHandoffModal={(handoffId) =>
              portal.setModal({ type: 'handoff-assign', handoffId })
            }
          />
        )}

        {portal.activeSection === 'analytics-credits' && (
          <CreditsPerformanceView
            aiWorkers={portal.aiWorkers}
            aiCreditsBalance={portal.aiCreditsBalance}
            monthlySoftLimit={portal.monthlySoftLimit}
            monthlyHardLimit={portal.monthlyHardLimit}
            onUpdateSoftLimit={portal.setMonthlySoftLimit}
            onUpdateHardLimit={portal.setMonthlyHardLimit}
            onOpenTopUp={() => portal.setModal({ type: 'topup-credits' })}
            onNotify={portal.showToast}
          />
        )}

        {portal.activeSection === 'governance-settings' && (
          <SafetyAuditSettingsView
            activeTenant={portal.activeTenant}
            auditLogs={portal.auditLogs}
            offlinePwaMode={portal.offlinePwaMode}
            onToggleOfflinePwa={portal.setOfflinePwaMode}
            onNavigate={portal.navigateTo}
            onNotify={portal.showToast}
          />
        )}
      </AIWorkforceAppShell>

      <AIWorkforceModals
        modal={portal.modal}
        aiWorkers={portal.aiWorkers}
        workflows={portal.workflows}
        runs={portal.runs}
        handoffs={portal.handoffs}
        aiCreditsBalance={portal.aiCreditsBalance}
        onClose={() => portal.setModal({ type: 'none' })}
        onNavigate={portal.navigateTo}
        onUpdateWorkerJD={portal.handleUpdateWorkerJD}
        onCreateTaskGoal={portal.handleCreateTaskGoal}
        onAddSkill={portal.handleAddSkill}
        onAddKnowledge={portal.handleAddKnowledgeSource}
        onAddWorkflowNode={portal.handleAddWorkflowNode}
        onConfirmHandoff={portal.handleConfirmHandoff}
        onRetryRun={portal.handleRetryRun}
        onRunCompensation={portal.handleRunCompensation}
        onTopUpCredits={portal.handleTopUpCredits}
        onCreateBinding={portal.handleCreateBinding}
      />
    </>
  );
}
