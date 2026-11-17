'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Bot,
  Sparkles,
  Wand2,
  Cpu,
  Puzzle,
  Database,
  GitBranch,
  Activity,
  CheckSquare,
  Inbox,
  BarChart3,
  ShieldCheck,
  Search,
  Plus,
  Menu,
  X,
  ChevronDown,
  ExternalLink,
  CheckCircle2,
  LogOut,
  Layers,
  Eye,
  Link2,
} from 'lucide-react';
import { AgentzyLogo } from '@/components/brand/AgentzyLogo';
import { PWAInstallButton } from '@/components/pwa/PWAControls';
import type {
  AIWMTenant,
  AIWorkforceSectionId,
} from '../../lib/ai-workforce-types';

interface NavGroup {
  title: string;
  items: Array<{
    id: AIWorkforceSectionId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }>;
}

export function AIWorkforceAppShell({
  activeTenant,
  tenants,
  activeSection,
  pendingApprovalsCount,
  failedRunsCount,
  toastMessage,
  onNavigate,
  onSwitchTenant,
  onOpenQuickAction,
  onOpenLoginScreen,
  onOpenSplashScreen,
  children,
}: {
  activeTenant: AIWMTenant;
  tenants: AIWMTenant[];
  activeSection: AIWorkforceSectionId;
  pendingApprovalsCount: number;
  failedRunsCount: number;
  toastMessage: string | null;
  onNavigate: (section: AIWorkforceSectionId) => void;
  onSwitchTenant: (tenantId: string) => void;
  onOpenQuickAction: () => void;
  onOpenLoginScreen: () => void;
  onOpenSplashScreen: () => void;
  children: React.ReactNode;
}) {
  const [showMobileMenuSheet, setShowMobileMenuSheet] = useState(false);
  const [showTenantDropdown, setShowTenantDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navGroups: NavGroup[] = useMemo(
    () => [
      {
        title: 'Ringkasan & Studio',
        items: [
          { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard },
          { id: 'content-studio', label: 'Generate Content (Sales)', icon: Sparkles },
          { id: 'workers', label: 'Registry AI Worker', icon: Bot },
          { id: 'worker-detail', label: 'Detail, JD & KPI Worker', icon: Layers },
          { id: 'worker-studio', label: 'AI Worker Studio', icon: Wand2 },
        ],
      },
      {
        title: 'Kapabilitas & Memori',
        items: [
          { id: 'model-router', label: 'Model Router & Provider', icon: Cpu },
          { id: 'skills-tools', label: 'Skills & Tools Registry', icon: Puzzle },
          { id: 'memory-rag', label: 'Memory & Knowledge RAG', icon: Database },
        ],
      },
      {
        title: 'Orkestrasi & Workflow',
        items: [
          { id: 'workflows', label: 'Workflow Center & Versi', icon: GitBranch },
          { id: 'workflow-builder', label: 'Workflow Builder & Node', icon: Layers },
          {
            id: 'runs',
            label: 'AI & Workflow Runs',
            icon: Activity,
            badge: failedRunsCount > 0 ? String(failedRunsCount) : undefined,
          },
        ],
      },
      {
        title: 'Kolaborasi & Persetujuan',
        items: [
          { id: 'human-ai-binding', label: 'Integrasi & Binding Human+AI', icon: Link2 },
          { id: 'tasks-collab', label: 'Task, Goal & Kolaborasi', icon: CheckSquare },
          {
            id: 'approvals',
            label: 'Approval & Handoff',
            icon: Inbox,
            badge: pendingApprovalsCount > 0 ? String(pendingApprovalsCount) : undefined,
          },
        ],
      },
      {
        title: 'Kinerja, Credits & Governance',
        items: [
          { id: 'analytics-credits', label: 'AI Credits & Performa', icon: BarChart3 },
          { id: 'governance-settings', label: 'Safety, Audit & Pengaturan', icon: ShieldCheck },
        ],
      },
    ],
    [failedRunsCount, pendingApprovalsCount]
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

  const handleSelectNav = (id: AIWorkforceSectionId) => {
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
        {/* DESKTOP SIDEBAR (256px, Deep Navy) */}
        <aside className="hidden lg:flex lg:w-[256px] lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 bg-[#17324D] text-white border-r border-[#245477]/40 z-30">
          <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
            <Link href="/" className="flex items-center gap-2">
              <AgentzyLogo variant="dark" size="md" />
            </Link>
          </div>

          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-[11px] font-medium text-[#ADD8E6]">
              AI Workforce Management
            </p>
            <p className="truncate text-sm font-bold text-white">
              {activeTenant.name}
            </p>
            <p className="font-mono-tabular text-[11px] text-[#9BB4C7]">
              ID: {activeTenant.code} · {activeTenant.environment}
            </p>
          </div>

          <nav
            aria-label="Navigasi Portal AI Workforce Management"
            className="flex-1 overflow-y-auto px-3 py-3 space-y-4"
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
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={onOpenSplashScreen}
                className="flex items-center justify-center gap-1.5 rounded-[8px] border border-white/15 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-[#CFE3EE] hover:bg-white/10 hover:text-white"
              >
                <Eye className="h-3 w-3" />
                <span>Splash</span>
              </button>
              <button
                type="button"
                onClick={onOpenLoginScreen}
                className="flex items-center justify-center gap-1.5 rounded-[8px] border border-white/15 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-[#CFE3EE] hover:bg-white/10 hover:text-white"
              >
                <LogOut className="h-3 w-3" />
                <span>Login</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <Link
                href="/corporate"
                className="flex items-center justify-center gap-1 rounded-[8px] border border-white/15 px-2 py-1.5 text-[11px] font-medium text-[#ADD8E6] hover:bg-white/10"
              >
                <span>Corporate</span>
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

        {/* MAIN CONTENT AREA */}
        <div className="flex min-w-0 flex-1 flex-col lg:pl-[256px] pb-24 lg:pb-8 overflow-x-hidden">
          {/* Top Bar */}
          <header className="sticky top-0 z-20 flex h-14 sm:h-16 items-center justify-between gap-2 sm:gap-3 border-b border-[#D8E3E9] bg-white/95 px-3 backdrop-blur-md sm:px-6">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <Link href="/" className="lg:hidden shrink-0">
                <AgentzyLogo variant="light" size="sm" />
              </Link>

              {/* Tenant Switcher */}
              <div className="relative min-w-0">
                <button
                  type="button"
                  onClick={() => setShowTenantDropdown((v) => !v)}
                  className="inline-flex h-10 sm:h-9 max-w-full items-center gap-1.5 sm:gap-2 rounded-[9px] border border-[#D8E3E9] bg-[#F5F8FA] px-2.5 sm:px-3 text-xs font-semibold text-[#17324D] hover:border-[#0284C7] whitespace-nowrap"
                >
                  <Bot className="h-3.5 w-3.5 shrink-0 text-[#0284C7]" />
                  <span className="max-w-[115px] sm:max-w-[200px] truncate">
                    {activeTenant.name}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#526675]" />
                </button>

                {showTenantDropdown && (
                  <div className="absolute left-0 mt-1.5 w-64 rounded-[12px] border border-[#D8E3E9] bg-white p-1.5 shadow-xl z-40">
                    <p className="px-2.5 py-1 text-[11px] font-semibold text-[#526675]">
                      Pilih Tenant / Workspace
                    </p>
                    {tenants.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          onSwitchTenant(t.id);
                          setShowTenantDropdown(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-[8px] px-2.5 py-2 text-left text-xs transition ${
                          t.id === activeTenant.id
                            ? 'bg-[#E6F4F9] font-bold text-[#17324D]'
                            : 'text-[#526675] hover:bg-[#F5F8FA]'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[#17324D]">
                            {t.name}
                          </p>
                          <p className="text-[11px] text-[#718391]">
                            {t.code} · {t.environment}
                          </p>
                        </div>
                        {t.id === activeTenant.id && (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#0284C7]" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Search Menu */}
              <div className="relative hidden md:block w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#718391]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari modul AI Workforce..."
                  className="h-9 w-full rounded-[9px] border border-[#D8E3E9] bg-[#F5F8FA] pl-8 pr-3 text-xs text-[#172B3A] placeholder-[#718391] focus:border-[#0284C7] focus:bg-white focus:outline-none"
                />
                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 rounded-[10px] border border-[#D8E3E9] bg-white p-1 shadow-lg z-40">
                    {searchResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectNav(item.id)}
                        className="flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 text-left text-xs font-medium text-[#17324D] hover:bg-[#E6F4F9]"
                      >
                        <item.icon className="h-3.5 w-3.5 text-[#0284C7]" />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <div className="hidden sm:block">
                <PWAInstallButton variant="subtle" />
              </div>

              <button
                type="button"
                onClick={() => handleSelectNav('content-studio')}
                className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-[9px] border border-[#87CEEB] bg-[#E6F4F9] px-3 text-xs font-semibold text-[#17324D] hover:bg-[#D5ECF6] whitespace-nowrap"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#0284C7]" />
                <span>Content Studio Sales</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectNav('approvals')}
                aria-label="Approval Center"
                className="relative flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-[9px] border border-[#D8E3E9] bg-white text-[#17324D] hover:border-[#0284C7]"
              >
                <Inbox className="h-4 w-4" />
                {pendingApprovalsCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#B23A48] px-1 font-mono-tabular text-[10px] font-bold text-white">
                    {pendingApprovalsCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={onOpenQuickAction}
                aria-label="Aksi Cepat"
                className="inline-flex h-10 sm:h-9 items-center gap-1.5 rounded-[9px] bg-[#0284C7] px-2.5 sm:px-3.5 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap"
              >
                <Plus className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">Aksi Cepat</span>
              </button>
            </div>
          </header>

          {/* Viewport */}
          <main className="mx-auto w-full min-w-0 max-w-7xl flex-1 px-3.5 py-4 sm:px-6 sm:py-6">
            {children}
          </main>
        </div>
      </div>

      {/* MOBILE BOTTOM NAVIGATION (Mobile-first PWA) */}
      <nav
        aria-label="Navigasi Bawah AI Workforce"
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#D8E3E9] bg-white/95 backdrop-blur-md lg:hidden pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 items-center min-h-[64px] px-1">
          <button
            type="button"
            onClick={() => handleSelectNav('overview')}
            className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-semibold ${
              activeSection === 'overview' ? 'text-[#0284C7]' : 'text-[#526675]'
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Beranda</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectNav('workers')}
            className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-semibold ${
              activeSection === 'workers' ||
              activeSection === 'worker-detail' ||
              activeSection === 'worker-studio'
                ? 'text-[#0284C7]'
                : 'text-[#526675]'
            }`}
          >
            <Bot className="h-5 w-5" />
            <span>Workers</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectNav('content-studio')}
            aria-label="Content Studio Sales"
            className="flex flex-col items-center justify-center -mt-4"
          >
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-md ring-4 ring-[#F5F8FA] transition ${
                activeSection === 'content-studio'
                  ? 'bg-[#17324D]'
                  : 'bg-[#0284C7]'
              }`}
            >
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="mt-0.5 text-[10px] font-semibold text-[#17324D]">
              Studio
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectNav('runs')}
            className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-semibold ${
              activeSection === 'runs' ||
              activeSection === 'workflows' ||
              activeSection === 'workflow-builder'
                ? 'text-[#0284C7]'
                : 'text-[#526675]'
            }`}
          >
            <Activity className="h-5 w-5" />
            <span>Run</span>
          </button>

          <button
            type="button"
            onClick={() => setShowMobileMenuSheet(true)}
            className="flex min-h-[44px] flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-semibold text-[#526675]"
          >
            <Menu className="h-5 w-5" />
            <span>Menu</span>
          </button>
        </div>
      </nav>

      {/* MOBILE ALL MODULES DRAWER SHEET */}
      <AnimatePresence>
        {showMobileMenuSheet && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#172B3A]/50 backdrop-blur-xs lg:hidden">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.2 }}
              className="max-h-[85vh] w-full overflow-y-auto rounded-t-[20px] border-t border-[#D8E3E9] bg-white p-5 pb-8 shadow-2xl"
            >
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[#D8E3E9]" />
              <div className="flex items-center justify-between border-b border-[#EAF2F6] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#17324D]">
                    Semua Modul AI Workforce Management
                  </h3>
                  <p className="text-[11px] text-[#526675]">
                    {activeTenant.name} · {activeTenant.code}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMobileMenuSheet(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-[#526675] hover:bg-[#EAF2F6]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {navGroups.map((group) => (
                  <div key={group.title}>
                    <p className="mb-2 text-[11px] font-semibold text-[#718391]">
                      {group.title}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = activeSection === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectNav(item.id)}
                            className={`flex min-h-[44px] items-center justify-between gap-2 rounded-[10px] border px-3 py-2.5 text-left text-xs font-semibold ${
                              active
                                ? 'border-[#0284C7] bg-[#E6F4F9] text-[#17324D]'
                                : 'border-[#D8E3E9] bg-[#F5F8FA] text-[#172B3A]'
                            }`}
                          >
                            <span className="flex items-center gap-2.5 min-w-0">
                              <Icon className="h-4 w-4 shrink-0 text-[#0284C7]" />
                              <span className="truncate">{item.label}</span>
                            </span>
                            {item.badge && (
                              <span className="shrink-0 rounded-md bg-[#0284C7]/15 px-1.5 py-0.5 font-mono-tabular text-[10px] font-bold text-[#0284C7]">
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-2 border-t border-[#EAF2F6] pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMobileMenuSheet(false);
                      onOpenQuickAction();
                    }}
                    className="h-11 rounded-[10px] bg-[#0284C7] text-xs font-semibold text-white"
                  >
                    + Aksi Cepat
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMobileMenuSheet(false);
                      onOpenLoginScreen();
                    }}
                    className="h-11 rounded-[10px] border border-[#D8E3E9] bg-white text-xs font-semibold text-[#17324D]"
                  >
                    Ganti Tenant / Login
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <Link
                    href="/workforce"
                    className="flex h-10 items-center justify-center rounded-[9px] border border-[#D8E3E9] bg-[#F5F8FA] text-[11px] font-semibold text-[#17324D]"
                  >
                    Workforce
                  </Link>
                  <Link
                    href="/corporate"
                    className="flex h-10 items-center justify-center rounded-[9px] border border-[#D8E3E9] bg-[#F5F8FA] text-[11px] font-semibold text-[#17324D]"
                  >
                    Corporate
                  </Link>
                  <Link
                    href="/"
                    className="flex h-10 items-center justify-center rounded-[9px] border border-[#D8E3E9] bg-[#F5F8FA] text-[11px] font-semibold text-[#17324D]"
                  >
                    Landing
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
