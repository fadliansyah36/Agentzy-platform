import type { Metadata } from 'next';
import { PlatformBootstrapForm } from '@/apps/admin/features/auth/PlatformBootstrapForm';

export const metadata: Metadata = {
  title: 'Platform Bootstrap · Agentzy',
  robots: { index: false, follow: false },
};

export default function PlatformBootstrapPage() {
  return <PlatformBootstrapForm />;
}
