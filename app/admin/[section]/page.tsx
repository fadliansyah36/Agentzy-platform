import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AdminPortalClient } from '@/apps/admin/components/AdminPortalClient';
import type { AdminSectionId } from '@/apps/admin/lib/admin-types';

const VALID_SECTIONS: AdminSectionId[] = [
  'login',
  'overview',
  'tenants',
  'onboarding',
  'partnerships',
  'master-data',
  'subscriptions',
  'organization',
  'rbac',
  'human-workforce',
  'ai-workers',
  'ai-worker-detail',
  'llm-providers',
  'model-registry',
  'model-router',
  'skills',
  'tools',
  'memory-governance',
  'knowledge-rag',
  'workflows',
  'ai-credits',
  'billing',
  'finance',
  'contracts',
  'commission-schemes',
  'integrations',
  'security',
  'audit-logs',
  'data-governance',
  'global-analytics',
];

export const metadata: Metadata = {
  title: 'Super Admin Control Plane · Agentzy',
  description:
    'Modul Super Admin Control Plane Agentzy untuk manajemen tenant, master data, AI Gateway, keuangan, keamanan, dan tata kelola data.',
};

export default async function AdminSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;

  if (!VALID_SECTIONS.includes(section as AdminSectionId)) {
    notFound();
  }

  return <AdminPortalClient initialSection={section as AdminSectionId} />;
}
