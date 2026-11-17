import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { AIWorkforcePortalClient } from '@/apps/ai-workforce/components/AIWorkforcePortalClient';
import type { AIWorkforceSectionId } from '@/apps/ai-workforce/lib/ai-workforce-types';

const VALID_SECTIONS: AIWorkforceSectionId[] = [
  'splash',
  'login',
  'overview',
  'workers',
  'worker-detail',
  'worker-studio',
  'content-studio',
  'model-router',
  'skills-tools',
  'memory-rag',
  'tasks-collab',
  'human-ai-binding',
  'workflows',
  'workflow-builder',
  'runs',
  'approvals',
  'analytics-credits',
  'governance-settings',
];

export const metadata: Metadata = {
  title: 'AI Workforce Management Portal | Agentzy',
  description:
    'Modul pengelolaan AI Worker, Orkestrasi Workflow, Approval Center, dan Content Studio Staff Sales Agentzy.',
};

export default async function AIWorkforceSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!VALID_SECTIONS.includes(section as AIWorkforceSectionId)) {
    notFound();
  }
  return <AIWorkforcePortalClient initialSection={section as AIWorkforceSectionId} />;
}
