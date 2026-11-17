import type { Metadata } from 'next';
import { AIWorkforcePortalClient } from '@/apps/ai-workforce/components/AIWorkforcePortalClient';

export const metadata: Metadata = {
  title: 'AI Workforce Management Portal | Agentzy',
  description:
    'Portal pengelolaan AI Worker, Content Studio untuk Support Staff Sales, Model Router, Skills, Memory RAG, Workflow Builder, Approval & Analytics Agentzy.',
};

export default function AIWorkforcePage() {
  return <AIWorkforcePortalClient initialSection="overview" />;
}
