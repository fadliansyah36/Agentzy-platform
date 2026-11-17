import type { Metadata } from 'next';
import { WorkforcePortalClient } from '@/components/workforce/WorkforcePortalClient';

export const metadata: Metadata = {
  title: 'Human Workforce Portal · Agentzy',
  description:
    'Portal kerja Human Workforce Agentzy untuk Sales Agentzy, Affiliate Freelance, dan Teknisi Lapangan.',
};

export default function WorkforcePage() {
  return <WorkforcePortalClient />;
}
