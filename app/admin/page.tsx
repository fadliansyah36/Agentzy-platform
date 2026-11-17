import type { Metadata } from 'next';
import { AdminPortalClient } from '@/apps/admin/components/AdminPortalClient';

export const metadata: Metadata = {
  title: 'Super Admin Control Plane · Agentzy',
  description:
    'Portal Super Admin Agentzy untuk governance multi-tenant, master data, RBAC, AI Gateway, Model Router, Skills/Tools, Memory/RAG, AI Credits, Billing, Rekonsiliasi, Skema Komisi, Security Break-Glass, dan Audit Log.',
};

export default function AdminPortalPage() {
  return <AdminPortalClient initialSection="overview" />;
}
