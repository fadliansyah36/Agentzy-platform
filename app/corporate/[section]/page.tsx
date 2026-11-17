import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CorporatePortalClient } from '@/apps/corporate/components/CorporatePortalClient';
import type { CorporateSectionId } from '@/apps/corporate/lib/corporate-types';

const VALID_SECTIONS: CorporateSectionId[] = [
  'login',
  'overview',
  'analytics',
  'sales-affiliate',
  'human-workforce',
  'ai-workforce',
  'technical-ops',
  'kpi-performance',
  'commission',
  'ai-credits',
  'contracts',
  'invoices',
  'payments',
  'reports',
  'organization',
  'notifications',
  'leaderboard',
  'settings',
];

export const metadata: Metadata = {
  title: 'Corporate / ISP Partner Portal · Agentzy',
  description:
    'Modul portal Corporate & ISP Partner Agentzy untuk analitik, pemantauan workforce, keuangan, kontrak, dan AI Credits.',
};

export default async function CorporateSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;

  if (!VALID_SECTIONS.includes(section as CorporateSectionId)) {
    notFound();
  }

  return <CorporatePortalClient initialSection={section as CorporateSectionId} />;
}
