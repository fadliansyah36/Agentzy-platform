'use client';

import React from 'react';
import {
  Building2,
  Plug,
  Bell,
  ShieldCheck,
  KeyRound,
  Palette,
  FileSearch,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { CorporatePageHeader } from '../../components/data-display/CorporateDataDisplay';
import type { CorporateTenant } from '../../lib/corporate-types';

export function SettingsGovernanceView({
  tenant,
  onOpenSettingsModal,
  onLogout,
  onBack,
}: {
  tenant: CorporateTenant;
  onOpenSettingsModal: (
    key: 'profile' | 'integrations' | 'notifications' | 'security' | 'api' | 'tenant' | 'audit'
  ) => void;
  onLogout: () => void;
  onBack: () => void;
}) {
  const menuItems: Array<{
    key: 'profile' | 'integrations' | 'notifications' | 'security' | 'api' | 'tenant' | 'audit';
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      key: 'profile',
      title: 'Profil Perusahaan',
      subtitle: `${tenant.legalName} · PIC & kontak resmi`,
      icon: Building2,
    },
    {
      key: 'integrations',
      title: 'Integrasi & Koneksi',
      subtitle: 'Provider ISP, CRM, AI Gateway, & Webhook Health',
      icon: Plug,
    },
    {
      key: 'notifications',
      title: 'Preferensi Notifikasi',
      subtitle: 'Ambang batas SLA, AI Credits 80%, & pengingat kontrak',
      icon: Bell,
    },
    {
      key: 'security',
      title: 'Keamanan Akun',
      subtitle: 'Kata sandi, wajib 2FA/MFA, & SSO OIDC/SAML',
      icon: ShieldCheck,
    },
    {
      key: 'api',
      title: 'Manajemen API',
      subtitle: 'API Key terlingkup tenant, Access Policy, & Quota',
      icon: KeyRound,
    },
    {
      key: 'tenant',
      title: 'Pengaturan Tenant',
      subtitle: 'Logo, Domain portal khusus, & Branding korporasi',
      icon: Palette,
    },
    {
      key: 'audit',
      title: 'Audit & Compliance View',
      subtitle: 'Log aktivitas append-only, kepatuhan UU PDP, & jejak persetujuan',
      icon: FileSearch,
    },
  ];

  return (
    <div className="space-y-5">
      <CorporatePageHeader
        title="Pengaturan"
        subtitle="Konfigurasi tenant korporasi, integrasi provider, API, keamanan, dan jejak audit"
        onBack={onBack}
      />

      {/* Profile Header Card (Matches Screen 20) */}
      <div className="flex flex-col gap-4 rounded-[14px] border border-[#D8E3E9] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#17324D] text-lg font-bold text-white">
            {tenant.logoInitials}
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#17324D]">{tenant.name}</h2>
            <p className="text-xs text-[#526675]">
              Corporate Client · {tenant.code} · {tenant.industry}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onOpenSettingsModal('profile')}
          className="rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] px-4 py-2 text-xs font-semibold text-[#17324D] hover:bg-[#E6F4F9] whitespace-nowrap self-start sm:self-auto"
        >
          Edit Profil Perusahaan
        </button>
      </div>

      {/* Menu List */}
      <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-3">
        <div className="divide-y divide-[#EAF2F6]">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onOpenSettingsModal(item.key)}
                className="flex w-full items-center justify-between gap-4 rounded-[10px] px-3 py-3.5 text-left transition hover:bg-[#F5F8FA]"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#0284C7]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#17324D]">
                      {item.title}
                    </p>
                    <p className="truncate text-xs text-[#526675]">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-[#718391]" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Keluar Action */}
      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-[#B23A48]/30 bg-white px-6 text-sm font-bold text-[#B23A48] transition hover:bg-[#B23A48]/5"
        >
          <LogOut className="h-4 w-4" />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );
}
