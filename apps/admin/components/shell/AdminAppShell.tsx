'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Building2,
  Rocket,
  Database,
  Layers,
  Network,
  ShieldCheck,
  Users,
  Bot,
  Sliders,
  Server,
  Cpu,
  Route,
  Puzzle,
  Wrench,
  Brain,
  BookOpen,
  GitBranch,
  Coins,
  CreditCard,
  Receipt,
  FileSignature,
  Percent,
  PlugZap,
  Lock,
  FileClock,
  ShieldAlert,
  BarChart3,
  Search,
  Plus,
  Menu,
  X,
  ChevronDown,
  ExternalLink,
  CheckCircle2,
  LogOut,
  UserCheck,
  Bell,
} from 'lucide-react';
import { AgentzyLogo } from '@/components/brand/AgentzyLogo';
import { PWAInstallButton } from '@/components/pwa/PWAControls';
import { SUPER_ADMIN_ROLES } from '../../lib/admin-data';
import type { AdminSectionId } from '../../lib/admin-types';

interface NavGroup {
  title: string;
  items: Array<{
    id: AdminSectionId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }>;
}

export function AdminAppShell({
  activeSection,
  adminRole,
  adminEmail,
  permissions,
  pendingApprovalsCount,
  openIncidentsCount,
  activeBreakGlassCount,
  toastMessage,
  onNavigate,
  onOpenQuickAction,
  onOpenBreakGlass,
  onLogout,
  children,
}: {
  activeSection: AdminSectionId;
  adminRole: string;
  adminEmail: string;
  permissions: string[];
  pendingApprovalsCount: number;
  openIncidentsCount: number;
  activeBreakGlassCount: number;
  toastMessage: string | null;
  onNavigate: (section: AdminSectionId) => void;
  onOpenQuickAction: () => void;
  onOpenBreakGlass: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const [showMobileMenuSheet, setShowMobileMenuSheet] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentRoleMeta =
    SUPER_ADMIN_ROLES.find((r) => r.key === adminRole) ?? SUPER_ADMIN_ROLES[0];

  const navGroups: NavGroup[] = useMemo(
    () => [
      {
        title: 'Control Plane Overview',
        items: [
          { id: 'overview', label: '1. Global Overview', icon: LayoutDashboard },
          { id: 'global-analytics', label: '30. Global KPI & Health', icon: BarChart3 },
        ],
      },
      {
        title: 'Tenant, Master Data & Akses',
        items: [
          { id: 'tenants', label: '2. Tenant Directory', icon: Building2 },
          { id: 'onboarding', label: '3. Onboarding & Provider', icon: Rocket },
          { id: 'master-data', label: '4. Master Data (CRUD)', icon: Database },
          { id: 'subscriptions', label: '5. Kontrak & Entitlement', icon: Layers },
          { id: 'organization', label: '6. Organisasi & Pengguna', icon: Network },
          { id: 'rbac', label: '7. RBAC & Matrix Akses', icon: ShieldCheck },
        ],
      },
      {
        title: 'Workforce Management',
        items: [
          { id: 'human-workforce', label: '8. Human Workforce', icon: Users },
          { id: 'ai-workers', label: '10. AI Worker Registry', icon: Bot },
          { id: 'ai-worker-detail', label: '11. Detail AI Worker', icon: Sliders },
        ],
      },
      {
        title: 'AI Gateway, Skills & Runtime',
        items: [
          { id: 'llm-providers', label: '12. LLM Provider Registry', icon: Server },
          { id: 'model-registry', label: '13. Model Registry', icon: Cpu },
          { id: 'model-router', label: '14. Model Router', icon: Route },
          { id: 'skills', label: '15. Skill Registry', icon: Puzzle },
          { id: 'tools', label: '16. Tool Registry', icon: Wrench },
          { id: 'memory-governance', label: '17. Memory Governance', icon: Brain },
          { id: 'knowledge-rag', label: '18. Knowledge / RAG', icon: BookOpen },
          {
            id: 'workflows',
            label: '20. Workflow & Approval',
            icon: GitBranch,
            badge: pendingApprovalsCount > 0 ? String(pendingApprovalsCount) : undefined,
          },
        ],
      },
      {
        title: 'Keuangan, AI Credits & Kontrak',
        items: [
          { id: 'ai-credits', label: '21. AI Credits & Ledger', icon: Coins },
          { id: 'billing', label: '22. Top Up AI Credits & Invoice', icon: CreditCard },
          { id: 'finance', label: '23. Finance & Rekonsiliasi', icon: Receipt },
          { id: 'contracts', label: '24. Kontrak, SOW & SLA', icon: FileSignature },
          { id: 'commission-schemes', label: '25. Gaji, Komisi & Bonus', icon: Percent },
        ],
      },
      {
        title: 'Integrasi, Keamanan & Audit',
        items: [
          { id: 'integrations', label: '26. Integrasi & Webhook', icon: PlugZap },
          {
            id: 'security',
            label: '27. Security & Break-Glass',
            icon: Lock,
            badge: activeBreakGlassCount > 0 ? String(activeBreakGlassCount) : undefined,
          },
          {
            id: 'audit-logs',
            label: '28. Audit Log & Insiden',
            icon: FileClock,
            badge: openIncidentsCount > 0 ? String(openIncidentsCount) : undefined,
          },
          { id: 'data-governance', label: '29. Data Governance', icon: ShieldAlert },
        ],
      },
    ],
    [activeBreakGlassCount, openIncidentsCount, pendingApprovalsCount]
  );

  const requiredPermission: Record<AdminSectionId, string> = {
    login: 'platform.tenants.read',
    overview: 'platform.tenants.read',
    'global-analytics': 'platform.audit.read',
    tenants: 'platform.tenants.read',
    onboarding: 'platform.tenants.manage',
    'master-data': 'platform.operations.manage',
    subscriptions: 'platform.finance.read',
    organization: 'platform.roles.read',
    rbac: 'platform.roles.read',
    'human-workforce': 'platform.memberships.read',
    'ai-workers': 'platform.operations.manage',
    'ai-worker-detail': 'platform.operations.manage',
    'llm-providers': 'platform.operations.manage',
    'model-registry': 'platform.operations.manage',
    'model-router': 'platform.operations.manage',
    skills: 'platform.operations.manage',
    tools: 'platform.operations.manage',
    'memory-governance': 'platform.security.manage',
    'knowledge-rag': 'platform.operations.manage',
    workflows: 'platform.operations.manage',
    'ai-credits': 'platform.finance.read',
    billing: 'platform.finance.read',
    finance: 'platform.finance.read',
    contracts: 'platform.finance.read',
    'commission-schemes': 'platform.finance.manage',
    integrations: 'platform.operations.manage',
    security: 'platform.security.manage',
    'audit-logs': 'platform.audit.read',
    'data-governance': 'platform.security.manage',
  };

  const visibleNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => permissions.includes(requiredPermission[item.id])),
    }))
    .filter((group) => group.items.length > 0);

  const allNavItems = useMemo(
    () => visibleNavGroups.flatMap((group) => group.items),
    [visibleNavGroups]
  );

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return allNavItems.filter((item) => item.label.toLowerCase().includes(q));
  }, [allNavItems, searchQuery]);

  const handleSelectNav = (id: AdminSectionId) => {
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
        {/* DESKTOP SIDEBAR (268px, Deep Navy) */}
        <aside className="hidden lg:flex lg:w-[268px] lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 bg-[#17324D] text-white border-r border-[#245477]/40 z-30">
          <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
            <Link href="/" className="flex items-center gap-2">
              <AgentzyLogo variant="dark" size="md" />
            </Link>
          </div>

          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-[11px] font-semibold text-[#87CEEB]">
              Super Admin Control Plane
            </p>
            <p className="truncate text-sm font-bold text-white">
              {currentRoleMeta.label}
            </p>
            <p className="truncate font-mono-tabular text-[11px] text-[#9BB4C7]">
              {adminEmail}
            </p>
          </div>

          <nav
            aria-label="Navigasi Super Admin Control Plane"
            className="flex-1 overflow-y-auto px-3 py-3 space-y-4"
          >
            {visibleNavGroups.map((group) => (
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
              onClick={onLogout}
              className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-[#CFE3EE] transition hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Kunci Sesi / Login Role</span>
            </button>
            <div className="grid grid-cols-3 gap-1">
              <Link
                href="/corporate"
                className="flex items-center justify-center gap-1 rounded-[8px] border border-white/15 px-1.5 py-1.5 text-[10px] font-medium text-[#ADD8E6] hover:bg-white/10"
              >
                <span>Corporate</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </Link>
              <Link
                href="/ai-workforce"
                className="flex items-center justify-center gap-1 rounded-[8px] border border-white/15 px-1.5 py-1.5 text-[10px] font-medium text-[#ADD8E6] hover:bg-white/10"
              >
                <span>AI Portal</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </Link>
              <Link
                href="/workforce"
                className="flex items-center justify-center gap-1 rounded-[8px] border border-white/15 px-1.5 py-1.5 text-[10px] font-medium text-[#ADD8E6] hover:bg-white/10"
              >
                <span>Workforce</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </Link>
            </div>
          </div>
        </aside>

        {/* MAIN VIEWPORT */}
        <div className="flex min-w-0 flex-1 flex-col lg:pl-[268px]">
          <header className="sticky top-0 z-20 border-b border-[#D8E3E9] bg-white/95 backdrop-blur-md">
            <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:h-16">
              {/* Left: Mobile Menu + Role Switcher */}
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setShowMobileMenuSheet(true)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-[#D8E3E9] text-[#17324D] hover:bg-[#EAF2F6] lg:hidden"
                  aria-label="Buka Daftar Modul Super Admin"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="lg:hidden">
                  <AgentzyLogo variant="light" size="sm" />
                </div>

                {/* Role is resolved from the verified membership; it is not user-selectable. */}
                <div className="relative hidden lg:block">
                  <div className="flex items-center gap-2.5 rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] px-3 py-1.5 text-left">
                    <UserCheck className="h-4 w-4 text-[#0284C7]" />
                    <div className="leading-tight">
                      <span className="block text-xs font-bold text-[#17324D] whitespace-nowrap">
                        {currentRoleMeta.label}
                      </span>
                      <span className="block text-[10px] text-[#526675] whitespace-nowrap">
                        Role terverifikasi · Akses berbasis permission
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Center: Quick Module Search */}
              <div className="relative hidden md:block flex-1 max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5F879E]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari 28 modul: tenant, LLM, skill, RBAC, komisi..."
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
                  <div className="absolute left-0 right-0 top-11 z-40 max-h-80 overflow-y-auto rounded-[12px] border border-[#D8E3E9] bg-white p-1.5 shadow-lg">
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

              {/* Right: Break-Glass + Quick Action + PWA + Audit */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onOpenBreakGlass}
                  className="hidden sm:inline-flex h-10 items-center gap-1.5 rounded-[10px] border border-[#B23A48]/35 bg-[#B23A48]/5 px-3 text-xs font-semibold text-[#B23A48] transition hover:bg-[#B23A48]/10 whitespace-nowrap shrink-0"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Break-Glass</span>
                </button>

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
                  onClick={() => handleSelectNav('audit-logs')}
                  className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border transition ${
                    activeSection === 'audit-logs'
                      ? 'border-[#0284C7] bg-[#E6F4F9] text-[#0284C7]'
                      : 'border-[#D8E3E9] bg-white text-[#17324D] hover:bg-[#F5F8FA]'
                  }`}
                  aria-label="Audit Log dan Insiden"
                >
                  <Bell className="h-4 w-4" />
                  {openIncidentsCount > 0 && (
                    <span className="absolute right-2 top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#B23A48] px-1 font-mono-tabular text-[9px] font-bold text-white">
                      {openIncidentsCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </header>

          {/* MAIN CONTENT CONTAINER */}
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 pb-24 sm:px-6 lg:px-8 lg:pb-10">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR (Beranda, Modul, +, Notif, Profil — matching UI/UX Image) */}
      <nav
        aria-label="Navigasi Mobile Super Admin"
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
            onClick={() => setShowMobileMenuSheet(true)}
            className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${
              showMobileMenuSheet ? 'text-[#0284C7]' : 'text-[#526675]'
            }`}
          >
            <Layers className="h-5 w-5" />
            <span>Modul</span>
          </button>

          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={onOpenQuickAction}
              className="-mt-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#0284C7] text-white shadow-md ring-4 ring-white transition active:scale-95"
              aria-label="Aksi Cepat Super Admin"
            >
              <Plus className="h-6 w-6" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleSelectNav('audit-logs')}
            className={`relative flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${
              activeSection === 'audit-logs' ? 'text-[#0284C7]' : 'text-[#526675]'
            }`}
          >
            <Bell className="h-5 w-5" />
            <span>Notif</span>
            {openIncidentsCount > 0 && (
              <span className="absolute right-4 top-1.5 h-2 w-2 rounded-full bg-[#B23A48]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSelectNav('security')}
            className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${
              activeSection === 'security' ? 'text-[#0284C7]' : 'text-[#526675]'
            }`}
          >
            <ShieldCheck className="h-5 w-5" />
            <span>Profil</span>
          </button>
        </div>
      </nav>

      {/* MOBILE FULL 28-MODULE DRAWER */}
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
                    Super Admin Control Plane (28 Modul)
                  </p>
                  <p className="text-xs text-[#526675]">
                    {currentRoleMeta.label} · {adminEmail}
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
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5F879E]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari modul: tenant, LLM, skill, RBAC..."
                    className="h-11 w-full rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] pl-9 pr-8 text-xs text-[#172B3A] outline-none focus:border-[#0284C7] focus:bg-white"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#526675]"
                      aria-label="Hapus pencarian modul"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {navGroups
                  .map((group) => ({
                    ...group,
                    items: searchQuery.trim()
                      ? group.items.filter((i) =>
                          i.label.toLowerCase().includes(searchQuery.trim().toLowerCase())
                        )
                      : group.items,
                  }))
                  .filter((g) => g.items.length > 0)
                  .map((group) => (
                  <div key={group.title}>
                    <p className="mb-2 text-xs font-bold text-[#718391]">{group.title}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = activeSection === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectNav(item.id)}
                            className={`flex min-h-[44px] items-center justify-between gap-2 rounded-[10px] border px-3 py-2 text-left text-xs font-semibold transition ${
                              active
                                ? 'border-[#0284C7] bg-[#E6F4F9] text-[#17324D]'
                                : 'border-[#D8E3E9] bg-[#F5F8FA] text-[#172B3A]'
                            }`}
                          >
                            <span className="flex items-center gap-2 min-w-0">
                              <Icon className="h-4 w-4 shrink-0 text-[#0284C7]" />
                              <span className="truncate">{item.label}</span>
                            </span>
                            {item.badge && (
                              <span className="font-mono-tabular text-[10px] font-bold text-[#B23A48]">
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-2 border-t border-[#EAF2F6] pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMobileMenuSheet(false);
                      onOpenBreakGlass();
                    }}
                    className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-[10px] border border-[#B23A48]/30 bg-[#B23A48]/5 px-3 text-xs font-bold text-[#B23A48]"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    <span>Break-Glass Access</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMobileMenuSheet(false);
                      onLogout();
                    }}
                    className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-[10px] border border-[#D8E3E9] bg-white px-3 text-xs font-bold text-[#17324D]"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Kunci / Ganti Role</span>
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
