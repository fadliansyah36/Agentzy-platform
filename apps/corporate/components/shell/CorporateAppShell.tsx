'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  LineChart,
  TrendingUp,
  Users,
  Bot,
  Wrench,
  Award,
  Wallet,
  Coins,
  FileSignature,
  Receipt,
  CreditCard,
  FileSpreadsheet,
  Network,
  Bell,
  Trophy,
  Settings,
  Search,
  Plus,
  Menu,
  X,
  Building2,
  ChevronDown,
  ExternalLink,
  CheckCircle2,
  LogOut,
} from 'lucide-react';
import { AgentzyLogo } from '@/components/brand/AgentzyLogo';
import { PWAInstallButton } from '@/components/pwa/PWAControls';
import type {
  CorporateAlertItem,
  CorporateSectionId,
  CorporateTenant,
} from '../../lib/corporate-types';

interface NavGroup {
  title: string;
  items: Array<{
    id: CorporateSectionId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }>;
}

export function CorporateAppShell({
  activeTenant,
  tenants,
  activeSection,
  alerts,
  toastMessage,
  onNavigate,
  onSwitchTenant,
  onOpenQuickAction,
  onOpenLoginScreen,
  children,
}: {
  activeTenant: CorporateTenant;
  tenants: CorporateTenant[];
  activeSection: CorporateSectionId;
  alerts: CorporateAlertItem[];
  toastMessage: string | null;
  onNavigate: (section: CorporateSectionId) => void;
  onSwitchTenant: (tenantId: string) => void;
  onOpenQuickAction: () => void;
  onOpenLoginScreen: () => void;
  children: React.ReactNode;
}) {
  const [showMobileMenuSheet, setShowMobileMenuSheet] = useState(false);
  const [showTenantDropdown, setShowTenantDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const unreadAlertsCount = useMemo(
    () => alerts.filter((a) => !a.read).length,
    [alerts]
  );

  const navGroups: NavGroup[] = useMemo(
    () => [
      {
        title: 'Ringkasan & Analitik',
        items: [
          { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard },
          { id: 'analytics', label: 'Business Analytics', icon: LineChart },
          { id: 'sales-affiliate', label: 'Sales & Affiliate', icon: TrendingUp },
          { id: 'kpi-performance', label: 'KPI & Performance', icon: Award },
          { id: 'leaderboard', label: 'Ranking & Leaderboard', icon: Trophy },
        ],
      },
      {
        title: 'Workforce & Operasi',
        items: [
          { id: 'human-workforce', label: 'Human Workforce', icon: Users },
          { id: 'ai-workforce', label: 'AI Workforce', icon: Bot },
          { id: 'technical-ops', label: 'Technical Operations', icon: Wrench },
        ],
      },
      {
        title: 'Keuangan & Kontrak',
        items: [
          { id: 'commission', label: 'Komisi & Insentif', icon: Wallet },
          { id: 'ai-credits', label: 'AI Credits Center', icon: Coins },
          { id: 'contracts', label: 'Kontrak & Kerja Sama', icon: FileSignature },
          { id: 'invoices', label: 'Invoice Center', icon: Receipt },
          { id: 'payments', label: 'Payment & Rekonsiliasi', icon: CreditCard },
          { id: 'reports', label: 'Reports & Export', icon: FileSpreadsheet },
        ],
      },
      {
        title: 'Tata Kelola & Sistem',
        items: [
          { id: 'organization', label: 'Organisasi & Pengguna', icon: Network },
          {
            id: 'notifications',
            label: 'Notifikasi & Peringatan',
            icon: Bell,
            badge: unreadAlertsCount > 0 ? String(unreadAlertsCount) : undefined,
          },
          { id: 'settings', label: 'Pengaturan & Audit', icon: Settings },
        ],
      },
    ],
    [unreadAlertsCount]
  );

  const allNavItems = useMemo(
    () => navGroups.flatMap((g) => g.items),
    [navGroups]
  );

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return allNavItems.filter((item) => item.label.toLowerCase().includes(q));
  }, [allNavItems, searchQuery]);

  const handleSelectNav = (id: CorporateSectionId) => {
    onNavigate(id);
    setShowMobileMenuSheet(false);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-[#F5F8FA] text-[#172B3A]">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.16 }}
            className="fixed right-4 top-16 z-50 flex max-w-sm items-center gap-2 rounded-[10px] border border-[#247A55]/30 bg-[#17324D] px-4 py-2.5 text-xs font-semibold text-white shadow-lg"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#87CEEB]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex min-h-screen">
        {/* DESKTOP SIDEBAR (252px, Deep Navy) */}
        <aside className="hidden lg:flex lg:w-[252px] lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 bg-[#17324D] text-white border-r border-[#245477]/40 z-30">
          <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
            <Link href="/" className="flex items-center gap-2">
              <AgentzyLogo variant="dark" size="md" />
            </Link>
          </div>

          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-[11px] font-medium text-[#ADD8E6]">
              Corporate / ISP Partner
            </p>
            <p className="truncate text-sm font-bold text-white">
              {activeTenant.name}
            </p>
            <p className="font-mono-tabular text-[11px] text-[#9BB4C7]">
              ID: {activeTenant.code} · {activeTenant.status}
            </p>
          </div>

          <nav
            aria-label="Navigasi Portal Corporate"
            className="flex-1 overflow-y-auto px-3 py-3 space-y-5"
          >
            {navGroups.map((group) => (
              <div key={group.title}>
                <p className="px-3 pb-1.5 text-[11px] font-semibold text-[#9BB4C7]">
                  {group.title}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectNav(item.id)}
                        className={`flex w-full items-center justify-between rounded-[10px] px-3 py-2 text-left text-xs font-semibold transition whitespace-nowrap ${
                          isActive
                            ? 'bg-[#0284C7] text-white'
                            : 'text-[#CFE3EE] hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </span>
                        {item.badge && (
                          <span className="ml-2 rounded-md bg-white/15 px-1.5 py-0.5 font-mono-tabular text-[10px] font-bold text-white">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-white/10 p-3 space-y-2">
            <button
              type="button"
              onClick={onOpenLoginScreen}
              className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-[#CFE3EE] transition hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Ganti Tenant / Login SSO</span>
            </button>
            <div className="grid grid-cols-2 gap-1.5">
              <Link
                href="/ai-workforce"
                className="flex items-center justify-center gap-1 rounded-[8px] border border-white/15 px-2 py-1.5 text-[11px] font-medium text-[#ADD8E6] hover:bg-white/10"
              >
                <span>AI Portal</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
              <Link
                href="/workforce"
                className="flex items-center justify-center gap-1 rounded-[8px] border border-white/15 px-2 py-1.5 text-[11px] font-medium text-[#ADD8E6] hover:bg-white/10"
              >
                <span>Workforce</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
              <Link
                href="/admin"
                className="flex items-center justify-center gap-1 rounded-[8px] border border-white/15 px-2 py-1.5 text-[11px] font-medium text-[#ADD8E6] hover:bg-white/10"
              >
                <span>Super Admin</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
              <Link
                href="/"
                className="flex items-center justify-center gap-1 rounded-[8px] border border-white/15 px-2 py-1.5 text-[11px] font-medium text-[#ADD8E6] hover:bg-white/10"
              >
                <span>Landing</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* MAIN VIEWPORT */}
        <div className="flex min-w-0 flex-1 flex-col lg:pl-[252px]">
          {/* TOP HEADER BAR (56px mobile, 64px desktop) */}
          <header className="sticky top-0 z-20 border-b border-[#D8E3E9] bg-white/95 backdrop-blur-md">
            <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:h-16">
              {/* Left: Mobile Logo / Drawer OR Desktop Tenant Context */}
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setShowMobileMenuSheet(true)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-[#D8E3E9] text-[#17324D] hover:bg-[#EAF2F6] lg:hidden"
                  aria-label="Buka Daftar Modul Portal"
                >
                  <Menu className="h-5 w-5" />
                </button>

                <div className="lg:hidden">
                  <AgentzyLogo variant="light" size="sm" />
                </div>

                {/* Desktop Tenant Switcher */}
                <div className="relative hidden lg:block">
                  <button
                    type="button"
                    onClick={() => setShowTenantDropdown((v) => !v)}
                    className="flex items-center gap-2.5 rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] px-3 py-1.5 text-left transition hover:border-[#87CEEB]"
                  >
                    <Building2 className="h-4 w-4 text-[#0284C7]" />
                    <div className="leading-tight">
                      <span className="block text-xs font-bold text-[#17324D] whitespace-nowrap">
                        {activeTenant.name}
                      </span>
                      <span className="block font-mono-tabular text-[10px] text-[#526675] whitespace-nowrap">
                        {activeTenant.code} · {activeTenant.region}
                      </span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-[#526675]" />
                  </button>

                  {showTenantDropdown && (
                    <div className="absolute left-0 top-12 z-40 w-72 rounded-[14px] border border-[#D8E3E9] bg-white p-2 shadow-lg">
                      <p className="px-2.5 py-1 text-[11px] font-semibold text-[#718391]">
                        Pilih Tenant Perusahaan
                      </p>
                      {tenants.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            onSwitchTenant(t.id);
                            setShowTenantDropdown(false);
                          }}
                          className={`mt-1 flex w-full items-center justify-between rounded-[10px] px-2.5 py-2 text-left text-xs transition ${
                            t.id === activeTenant.id
                              ? 'bg-[#E6F4F9] font-bold text-[#17324D]'
                              : 'text-[#526675] hover:bg-[#F5F8FA]'
                          }`}
                        >
                          <div>
                            <p className="font-semibold text-[#17324D]">{t.name}</p>
                            <p className="font-mono-tabular text-[11px] text-[#718391]">
                              {t.code} · {t.status}
                            </p>
                          </div>
                          {t.id === activeTenant.id && (
                            <CheckCircle2 className="h-4 w-4 text-[#0284C7]" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Center: Quick Module Search */}
              <div className="relative hidden md:block flex-1 max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5F879E]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari modul: analitik, AI credits, invoice..."
                  className="h-10 w-full rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] pl-9 pr-8 text-xs text-[#172B3A] outline-none transition focus:border-[#0284C7] focus:bg-white"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#526675]"
                    aria-label="Hapus pencarian"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}

                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-11 z-40 rounded-[12px] border border-[#D8E3E9] bg-white p-1.5 shadow-lg">
                    {searchResults.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectNav(item.id)}
                          className="flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2 text-left text-xs font-semibold text-[#17324D] hover:bg-[#E6F4F9]"
                        >
                          <Icon className="h-4 w-4 text-[#0284C7]" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right: Quick Action + PWA + Notifications + Avatar */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onOpenQuickAction}
                  className="hidden sm:inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#17324D] px-3.5 text-xs font-semibold text-white transition hover:bg-[#245477] whitespace-nowrap shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  <span>Aksi Cepat</span>
                </button>

                <div className="hidden xl:block">
                  <PWAInstallButton variant="subtle" />
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectNav('notifications')}
                  className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border transition ${
                    activeSection === 'notifications'
                      ? 'border-[#0284C7] bg-[#E6F4F9] text-[#0284C7]'
                      : 'border-[#D8E3E9] bg-white text-[#17324D] hover:bg-[#F5F8FA]'
                  }`}
                  aria-label="Notifikasi dan Peringatan"
                >
                  <Bell className="h-4 w-4" />
                  {unreadAlertsCount > 0 && (
                    <span className="absolute right-2 top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#B23A48] px-1 font-mono-tabular text-[9px] font-bold text-white">
                      {unreadAlertsCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectNav('settings')}
                  className="flex h-11 items-center gap-2 rounded-[10px] border border-[#D8E3E9] bg-white px-2.5 hover:border-[#0284C7]"
                  aria-label="Profil dan Pengaturan Corporate"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#17324D] text-[11px] font-bold text-white">
                    {activeTenant.logoInitials}
                  </span>
                  <span className="hidden md:block text-left leading-tight">
                    <span className="block text-xs font-bold text-[#17324D] whitespace-nowrap">
                      Arif Budiman
                    </span>
                    <span className="block text-[10px] text-[#526675] whitespace-nowrap">
                      Corporate Owner
                    </span>
                  </span>
                </button>
              </div>
            </div>
          </header>

          {/* MAIN CONTENT CONTAINER */}
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 pb-24 sm:px-6 lg:px-8 lg:pb-10">
            <motion.div
              key={`${activeTenant.id}-${activeSection}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR (Matching Reference UI: Beranda, Analytics, +, Notif, Menu) */}
      <nav
        aria-label="Navigasi Mobile Corporate Portal"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[#D8E3E9] bg-white/95 backdrop-blur-md lg:hidden"
      >
        <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-center px-2">
          <button
            type="button"
            onClick={() => handleSelectNav('overview')}
            className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${
              activeSection === 'overview' ? 'text-[#0284C7]' : 'text-[#526675]'
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Beranda</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectNav('analytics')}
            className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${
              activeSection === 'analytics' || activeSection === 'sales-affiliate'
                ? 'text-[#0284C7]'
                : 'text-[#526675]'
            }`}
          >
            <LineChart className="h-5 w-5" />
            <span>Analytics</span>
          </button>

          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={onOpenQuickAction}
              className="-mt-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#0284C7] text-white shadow-md ring-4 ring-white transition active:scale-95"
              aria-label="Aksi Cepat Corporate"
            >
              <Plus className="h-6 w-6" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleSelectNav('notifications')}
            className={`relative flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${
              activeSection === 'notifications' ? 'text-[#0284C7]' : 'text-[#526675]'
            }`}
          >
            <Bell className="h-5 w-5" />
            <span>Notif</span>
            {unreadAlertsCount > 0 && (
              <span className="absolute right-4 top-1.5 h-2 w-2 rounded-full bg-[#B23A48]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowMobileMenuSheet(true)}
            className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${
              showMobileMenuSheet ? 'text-[#0284C7]' : 'text-[#526675]'
            }`}
          >
            <Menu className="h-5 w-5" />
            <span>Menu</span>
          </button>
        </div>
      </nav>

      {/* MOBILE FULL MODULE MENU DRAWER */}
      <AnimatePresence>
        {showMobileMenuSheet && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMenuSheet(false)}
              className="fixed inset-0 bg-[#172B3A]/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed inset-x-0 bottom-0 max-h-[86vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl"
            >
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[#D8E3E9]" />
              <div className="flex items-center justify-between border-b border-[#EAF2F6] pb-3">
                <div>
                  <p className="text-sm font-bold text-[#17324D]">
                    Menu Corporate / ISP Portal
                  </p>
                  <p className="text-xs text-[#526675]">
                    {activeTenant.name} · {activeTenant.code}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMobileMenuSheet(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#D8E3E9] text-[#526675]"
                  aria-label="Tutup Menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-5 pb-6">
                {navGroups.map((group) => (
                  <div key={group.title}>
                    <p className="mb-2 text-xs font-bold text-[#718391]">
                      {group.title}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = activeSection === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectNav(item.id)}
                            className={`flex min-h-[44px] items-center gap-2 rounded-[10px] border px-3 py-2 text-left text-xs font-semibold transition ${
                              active
                                ? 'border-[#0284C7] bg-[#E6F4F9] text-[#17324D]'
                                : 'border-[#D8E3E9] bg-[#F5F8FA] text-[#172B3A]'
                            }`}
                          >
                            <Icon className="h-4 w-4 shrink-0 text-[#0284C7]" />
                            <span className="truncate">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="border-t border-[#EAF2F6] pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMobileMenuSheet(false);
                      onOpenLoginScreen();
                    }}
                    className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-[10px] border border-[#B23A48]/30 bg-[#B23A48]/5 px-4 py-2.5 text-xs font-bold text-[#B23A48]"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Ganti Tenant / Layar Login SSO</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
