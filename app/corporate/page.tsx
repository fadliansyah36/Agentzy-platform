import type { Metadata } from 'next';
import { CorporatePortalClient } from '@/apps/corporate/components/CorporatePortalClient';

export const metadata: Metadata = {
  title: 'Corporate / ISP Partner Portal · Agentzy',
  description:
    'Portal Corporate & ISP Partner Agentzy untuk memantau Human Workforce, AI Workforce, Business Analytics, Komisi, Kontrak, Invoice, dan AI Credits Center.',
};

export default function CorporatePortalPage() {
  return <CorporatePortalClient initialSection="overview" />;
}
