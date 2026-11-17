import type { Metadata } from 'next';
import { AdminMfaSetupForm } from '@/apps/admin/features/auth/AdminMfaSetupForm';

export const metadata: Metadata = {
  title: 'MFA Setup · Agentzy',
  robots: { index: false, follow: false },
};

export default function AdminMfaSetupPage() {
  return <AdminMfaSetupForm />;
}
