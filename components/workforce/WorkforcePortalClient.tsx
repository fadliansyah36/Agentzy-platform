'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home,
  ClipboardList,
  Briefcase,
  Users,
  UserPlus,
  Wallet,
  Calculator,
  Clock,
  BarChart3,
  GraduationCap,
  HelpCircle,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  Plus,
  Crown,
  LogOut,
  Wrench,
  History,
  Package,
  Calendar,
  Mail,
  ExternalLink,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  LogIn,
  Award,
  Bot,
} from 'lucide-react';
import { AgentzyLogo } from '@/components/brand/AgentzyLogo';
import { PWAInstallButton } from '@/components/pwa/PWAControls';
import {
  AuthOnboardingFlow,
  type AuthStep,
} from '@/components/workforce/AuthOnboardingFlow';
import {
  SalesDashboardView,
  TasksView,
  LeadsAndDetailView,
  AffiliateTeamAndRecruitView,
  CommissionAndSimulatorView,
} from '@/components/workforce/SalesAndAffiliateViews';
import { SalesTierView } from '@/components/workforce/SalesTierView';
import {
  TechnicianDashboardView,
  WorkOrderWorkflowView,
  TechHistoryView,
  TechInventoryView,
  TechCommissionView,
} from '@/components/workforce/TechnicianViews';
import {
  AttendanceView,
  PerformanceKPIView,
  TrainingCertView,
  NotificationsView,
  ProfilePassportView,
  WorkspaceCenterView,
  HelpFAQView,
  SettingsView,
} from '@/components/workforce/SharedWorkforceViews';
import { AICollaborationView } from '@/components/workforce/AICollaborationView';
import {
  INITIAL_TASKS,
  INITIAL_LEADS,
  INITIAL_AFFILIATES,
  INITIAL_WORK_ORDERS,
  INITIAL_INVENTORY,
  type WorkforceRoleMode,
  type TaskItem,
  type LeadItem,
  type SalesLifecycleStatus,
  type AffiliateMember,
  type WorkOrderItem,
  type InventoryItem,
} from '@/lib/agentzy-data';
import {
  INITIAL_CORPORATE_COMPENSATION_SCHEMAS,
  INITIAL_TECH_BONUS_RULES,
  DEFAULT_TECH_TASK_COUNTS,
  COMPENSATION_STORAGE_EVENT,
  loadCorporateCompensationSchemas,
  loadTechnicianBonusRules,
  mapWoTypeToBonusCategory,
  calculateTechnicianCompensation,
  type CorporateCompensationSchema,
  type TechnicianBonusRule,
  type TechnicianTaskCounts,
} from '@/lib/corporate-compensation';
import { useWorkspace } from '@/components/workspace/WorkspaceProvider';

type PortalTab =
  | 'home'
  | 'tasks'
  | 'leads'
  | 'team'
  | 'recruit'
  | 'commission'
  | 'simulator'
  | 'tier'
  | 'workorders'
  | 'history'
  | 'inventory'
  | 'attendance'
  | 'performance'
  | 'training'
  | 'workspace'
  | 'ai-collab'
  | 'notifications'
  | 'profile'
  | 'help'
  | 'settings';

export function WorkforcePortalClient() {
  const { openSendEmailModal, openScheduleMeetingModal } = useWorkspace();

  const [roleMode, setRoleMode] = useState<WorkforceRoleMode>('sales');
  const [activeTab, setActiveTab] = useState<PortalTab>('home');
  const [showAuthFlow, setShowAuthFlow] = useState(false);
  const [authInitialStep, setAuthInitialStep] = useState<AuthStep>('splash');
  const [customUserName, setCustomUserName] = useState<string | null>(null);
  const [boundSponsor, setBoundSponsor] = useState<{ name: string; code: string }>({
    name: 'Raka Pratama',
    code: 'AGT-RAKA-2026',
  });

  // Operational Stateful Collections
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [leads, setLeads] = useState<LeadItem[]>(INITIAL_LEADS);
  const [affiliates, setAffiliates] = useState<AffiliateMember[]>(INITIAL_AFFILIATES);
  const [workOrders, setWorkOrders] = useState<WorkOrderItem[]>(INITIAL_WORK_ORDERS);
  const [selectedWoId, setSelectedWoId] = useState<string | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);

  // Live Super Admin Corporate Payroll, Split & Technician Bonus State
  const [corpSchemas, setCorpSchemas] = useState<CorporateCompensationSchema[]>(
    INITIAL_CORPORATE_COMPENSATION_SCHEMAS
  );
  const [techBonusRules, setTechBonusRules] = useState<TechnicianBonusRule[]>(
    INITIAL_TECH_BONUS_RULES
  );
  const [placedCorporateId, setPlacedCorporateId] = useState<string>('corp-comp-nusantara');
  const [techTaskCounts, setTechTaskCounts] = useState<TechnicianTaskCounts>(
    DEFAULT_TECH_TASK_COUNTS
  );

  useEffect(() => {
    const syncCompensation = () => {
      setCorpSchemas(loadCorporateCompensationSchemas());
      setTechBonusRules(loadTechnicianBonusRules());
    };
    syncCompensation();
    window.addEventListener(COMPENSATION_STORAGE_EVENT, syncCompensation);
    window.addEventListener('storage', syncCompensation);
    return () => {
      window.removeEventListener(COMPENSATION_STORAGE_EVENT, syncCompensation);
      window.removeEventListener('storage', syncCompensation);
    };
  }, []);

  const placedSchema = useMemo(
    () => corpSchemas.find((s) => s.id === placedCorporateId) || corpSchemas[0],
    [corpSchemas, placedCorporateId]
  );

  // Offline / PWA Queue State
  const [offlineSyncEnabled, setOfflineSyncEnabled] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState<string[]>([
    'Checklist SOP #WO-872342 · tersimpan lokal siap sinkron',
  ]);

  // UI Overlays & Modals
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [showQuickActionModal, setShowQuickActionModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeSubmitted, setUpgradeSubmitted] = useState(false);
  const [openNewLeadTrigger, setOpenNewLeadTrigger] = useState(false);
  const [leadsMountSeq, setLeadsMountSeq] = useState(0);
  const idCounterRef = useRef(500);
  const [searchQuery, setSearchQuery] = useState('');
  const [portalToast, setPortalToast] = useState<string | null>(null);

  const nextId = (prefix: string) => {
    idCounterRef.current += 1;
    return `${prefix}-${idCounterRef.current}`;
  };

  const currentUser = useMemo(() => {
    if (roleMode === 'technician') {
      return {
        name: customUserName || 'Budi Santoso',
        roleLabel: 'Teknisi FTTH · ID: TK-000128',
        shortRole: 'Teknisi',
        initials: 'BS',
      };
    }
    if (roleMode === 'affiliate') {
      return {
        name: customUserName || 'Siti Nabila',
        roleLabel: 'Affiliate Freelance · AF-88412',
        shortRole: 'Affiliate',
        initials: 'SN',
      };
    }
    return {
      name: customUserName || 'Raka Pratama',
      roleLabel: 'Sales Agentzy (Sales Resmi)',
      shortRole: 'Sales Agentzy',
      initials: 'RP',
    };
  }, [roleMode, customUserName]);

  const showToast = (msg: string) => {
    setPortalToast(msg);
    setTimeout(() => {
      setPortalToast((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const handleRoleSwitch = (nextRole: WorkforceRoleMode) => {
    setRoleMode(nextRole);
    setActiveTab('home');
    setSelectedWoId(null);
    setShowMobileDrawer(false);
    const label =
      nextRole === 'sales'
        ? 'Sales Resmi (Sales Agentzy)'
        : nextRole === 'affiliate'
        ? 'Affiliate Freelance'
        : 'Teknisi Lapangan';
    showToast(`Berpindah ke portal ${label}`);
  };

  const navigateTo = (tab: string, openLeadModal = false) => {
    setOpenNewLeadTrigger(openLeadModal);
    if (openLeadModal) {
      setLeadsMountSeq((n) => n + 1);
    }
    setActiveTab(tab as PortalTab);
    setShowMobileDrawer(false);
  };

  // Mutators
  const handleToggleTaskStatus = (id: string, nextStatus: TaskItem['status']) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: nextStatus } : t))
    );
    showToast(`Status tugas diperbarui menjadi ${nextStatus}.`);
  };

  const handleAddLead = (
    leadInput: Omit<LeadItem, 'id' | 'activities' | 'lastUpdate'>
  ) => {
    const newLead: LeadItem = {
      ...leadInput,
      id: nextId('LD'),
      lastUpdate: 'Baru saja',
      activities: [
        {
          id: nextId('ACT'),
          time: 'Baru saja',
          action: 'Lead baru didaftarkan di Human Workforce Portal',
          actor: currentUser.name,
        },
      ],
    };
    setLeads((prev) => [newLead, ...prev]);
    showToast(`Lead ${newLead.name} berhasil ditambahkan.`);
  };

  const handleUpdateLeadStatus = (id: string, status: SalesLifecycleStatus) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              status,
              lastUpdate: 'Baru saja',
              activities: [
                {
                  id: nextId('ACT'),
                  time: 'Baru saja',
                  action: `Status diubah ke ${status}`,
                  actor: currentUser.name,
                },
                ...l.activities,
              ],
            }
          : l
      )
    );
    showToast(`Status lead diperbarui ke ${status}.`);
  };

  const handleAddLeadActivity = (id: string, action: string) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              lastUpdate: 'Baru saja',
              activities: [
                {
                  id: nextId('ACT'),
                  time: 'Baru saja',
                  action,
                  actor: currentUser.name,
                },
                ...l.activities,
              ],
            }
          : l
      )
    );
    showToast('Catatan aktivitas ditambahkan ke timeline lead.');
  };

  const handleAddAffiliate = (
    m: Omit<AffiliateMember, 'id' | 'orders' | 'commissionTotal' | 'joinedDate'>
  ) => {
    const next: AffiliateMember = {
      ...m,
      id: nextId('AF'),
      orders: 0,
      commissionTotal: 0,
      joinedDate: 'Hari ini',
    };
    setAffiliates((prev) => [next, ...prev]);
    showToast(`Affiliate ${next.name} (${next.code}) ditambahkan.`);
  };

  const handleApproveAffiliate = (id: string) => {
    setAffiliates((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Aktif' } : a))
    );
    showToast('Pendaftaran mitra affiliate telah disetujui.');
  };

  const handleCompleteWo = (id: string) => {
    const targetWo = workOrders.find((w) => w.id === id);
    const shouldCount = targetWo && targetWo.status !== 'Selesai';

    setWorkOrders((prev) =>
      prev.map((wo) =>
        wo.id === id
          ? {
              ...wo,
              status: 'Selesai',
              durationText: '1 jam 42 menit',
              completedDate: 'Hari ini',
            }
          : wo
      )
    );

    if (shouldCount && targetWo) {
      const cat = mapWoTypeToBonusCategory(targetWo.type);
      const bucketKey: keyof TechnicianTaskCounts =
        cat === 'Pemasangan' ? 'pemasangan' : cat === 'Survey' ? 'survey' : 'maintenance';

      const prevCounts = techTaskCounts;
      const nextCounts: TechnicianTaskCounts = {
        ...prevCounts,
        [bucketKey]: {
          daily: prevCounts[bucketKey].daily + 1,
          weekly: prevCounts[bucketKey].weekly + 1,
          monthly: prevCounts[bucketKey].monthly + 1,
        },
      };
      setTechTaskCounts(nextCounts);

      const beforeComp = calculateTechnicianCompensation({
        schema: placedSchema,
        bonusRules: techBonusRules,
        completedCounts: prevCounts,
        slaPct: 97,
      });
      const afterComp = calculateTechnicianCompensation({
        schema: placedSchema,
        bonusRules: techBonusRules,
        completedCounts: nextCounts,
        slaPct: 97,
      });

      const newlyUnlocked = afterComp.bonusEvaluations.filter(
        (afterItem, idx) => afterItem.achieved && !beforeComp.bonusEvaluations[idx]?.achieved
      );

      if (newlyUnlocked.length > 0) {
        const unlockedLabels = newlyUnlocked
          .map((u) => `${u.rule.period} ${u.rule.taskType}`)
          .join(', ');
        showToast(
          `WO ${id} selesai! Target Bonus (${unlockedLabels}) tercapai!`
        );
        return;
      }
    }

    showToast(`Work Order ${id} selesai & laporan Berita Acara tersimpan.`);
  };

  const handleQueueOfflineAction = (label: string) => {
    setOfflineQueue((prev) => [`${label} · ${new Date().toLocaleTimeString('id-ID')}`, ...prev]);
  };

  const handleRequestRestock = (itemName: string, qty: number) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.name === itemName
          ? {
              ...item,
              unitCount: item.unitCount + qty,
              stockLabel: `${item.unitCount + qty} ${item.unitName}`,
            }
          : item
      )
    );
    showToast(`Permintaan pengambilan ${qty} ${itemName} disetujui gudang.`);
  };

  const navItems: Array<{
    id: PortalTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }> = useMemo(() => {
    if (roleMode === 'technician') {
      return [
        { id: 'home', label: 'Beranda Teknisi', icon: Home },
        {
          id: 'workorders',
          label: 'Tugas / Work Order',
          icon: Wrench,
          badge: String(workOrders.filter((w) => w.status !== 'Selesai').length),
        },
        { id: 'ai-collab', label: 'Kolaborasi AI (Partner)', icon: Bot, badge: 'Aktif' },
        { id: 'history', label: 'Riwayat Pekerjaan', icon: History },
        { id: 'inventory', label: 'Inventaris & Material', icon: Package },
        { id: 'attendance', label: 'Absensi Teknisi', icon: Clock },
        { id: 'performance', label: 'Performa & KPI', icon: BarChart3 },
        { id: 'commission', label: 'Komisi & Penghasilan', icon: Wallet },
        { id: 'training', label: 'Pelatihan & Sertifikasi', icon: GraduationCap },
        { id: 'workspace', label: 'Google Workspace', icon: Mail },
        { id: 'help', label: 'Bantuan & FAQ', icon: HelpCircle },
        { id: 'settings', label: 'Pengaturan Aplikasi', icon: Settings },
      ];
    }

    if (roleMode === 'affiliate') {
      return [
        { id: 'home', label: 'Beranda', icon: Home },
        {
          id: 'tasks',
          label: 'Tugas & Kampanye',
          icon: ClipboardList,
          badge: String(
            tasks.filter((t) => t.roles.includes('affiliate') && t.status === 'aktif')
              .length
          ),
        },
        {
          id: 'leads',
          label: 'Lead & Prospek Saya',
          icon: Briefcase,
          badge: String(leads.filter((l) => l.attributionType === 'affiliate').length),
        },
        { id: 'ai-collab', label: 'Kolaborasi AI (Partner)', icon: Bot, badge: 'Aktif' },
        { id: 'commission', label: 'Komisi & Penghasilan', icon: Wallet },
        { id: 'simulator', label: `Simulasi Komisi (${placedSchema.salesConfig.affiliateSplitPct}%)`, icon: Calculator },
        { id: 'performance', label: 'Performa & KPI', icon: BarChart3 },
        { id: 'training', label: 'Pelatihan & Materi', icon: GraduationCap },
        { id: 'help', label: 'Bantuan & FAQ', icon: HelpCircle },
        { id: 'settings', label: 'Pengaturan', icon: Settings },
      ];
    }

    return [
      { id: 'home', label: 'Beranda', icon: Home },
      {
        id: 'tasks',
        label: 'Tugas & Penugasan',
        icon: ClipboardList,
        badge: String(
          tasks.filter((t) => t.roles.includes('sales') && t.status === 'aktif').length
        ),
      },
      {
        id: 'leads',
        label: 'Lead & Penjualan',
        icon: Briefcase,
        badge: String(leads.length),
      },
      { id: 'ai-collab', label: 'Kolaborasi AI (Partner)', icon: Bot, badge: 'Aktif' },
      { id: 'team', label: 'Tim Affiliate', icon: Users },
      { id: 'recruit', label: 'Rekrut Affiliate', icon: UserPlus },
      { id: 'commission', label: 'Komisi & Penghasilan', icon: Wallet },
      { id: 'simulator', label: 'Simulasi Komisi', icon: Calculator },
      { id: 'tier', label: 'Tier & Target Sales', icon: Award },
      { id: 'attendance', label: 'Absensi Staff', icon: Clock },
      { id: 'performance', label: 'Performa & KPI', icon: BarChart3 },
      { id: 'training', label: 'Pelatihan & Sertifikasi', icon: GraduationCap },
      { id: 'workspace', label: 'Google Workspace', icon: Mail },
      { id: 'help', label: 'Bantuan & FAQ', icon: HelpCircle },
      { id: 'settings', label: 'Pengaturan', icon: Settings },
    ];
  }, [roleMode, tasks, leads, workOrders, placedSchema.salesConfig.affiliateSplitPct]);

  // Global search results scoped strictly by active roleMode
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const results: Array<{ id: string; title: string; subtitle: string; tab: PortalTab; woId?: string }> = [];

    if (roleMode === 'technician') {
      workOrders.forEach((w) => {
        if (
          w.id.toLowerCase().includes(q) ||
          w.customerName.toLowerCase().includes(q) ||
          w.address.toLowerCase().includes(q)
        ) {
          results.push({
            id: w.id,
            title: `${w.id} · ${w.customerName}`,
            subtitle: `Work Order · ${w.type}`,
            tab: 'workorders',
            woId: w.id,
          });
        }
      });
      return results.slice(0, 6);
    }

    const visibleLeads =
      roleMode === 'affiliate'
        ? leads.filter((l) => l.attributionType === 'affiliate')
        : leads;

    visibleLeads.forEach((l) => {
      if (l.name.toLowerCase().includes(q) || l.product.toLowerCase().includes(q)) {
        results.push({
          id: l.id,
          title: l.name,
          subtitle: `Lead · ${l.product} (${l.status})`,
          tab: 'leads',
        });
      }
    });

    tasks
      .filter((t) => t.roles.includes(roleMode))
      .forEach((t) => {
        if (t.title.toLowerCase().includes(q) || t.subtitle.toLowerCase().includes(q)) {
          results.push({
            id: t.id,
            title: t.title,
            subtitle: `Tugas · ${t.dueLabel}`,
            tab: 'tasks',
          });
        }
      });

    if (roleMode === 'sales') {
      affiliates.forEach((a) => {
        if (a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q)) {
          results.push({
            id: a.id,
            title: a.name,
            subtitle: `Affiliate · ${a.code} (${a.orders} order)`,
            tab: 'team',
          });
        }
      });
    }

    return results.slice(0, 6);
  }, [roleMode, searchQuery, leads, tasks, workOrders, affiliates]);

  // If user launches Auth/Splash/Onboarding screen
  if (showAuthFlow) {
    return (
      <AuthOnboardingFlow
        initialStep={authInitialStep}
        selectedRole={roleMode}
        onSelectRole={(r) => setRoleMode(r)}
        onEnterPortal={(r, name, meta) => {
          setRoleMode(r);
          if (name) setCustomUserName(name);
          if (r === 'affiliate' && meta?.referralCode) {
            const nextSponsor = {
              code: meta.referralCode,
              name: meta.sponsorName || `Staff Sales (${meta.referralCode})`,
            };
            setBoundSponsor(nextSponsor);
            if (name) {
              setAffiliates((prev) => {
                const exists = prev.some(
                  (a) => a.name.toLowerCase() === name.trim().toLowerCase()
                );
                if (exists) return prev;
                return [
                  {
                    id: nextId('AF'),
                    name: name.trim(),
                    code: `AF-${idCounterRef.current}`,
                    phone: meta.phone || '0813 0000 0000',
                    email: meta.email || 'affiliate@agentzy.id',
                    orders: 0,
                    commissionTotal: 0,
                    status: 'Aktif',
                    joinedDate: 'Baru mendaftar',
                  },
                  ...prev,
                ];
              });
            }
            setActiveTab('home');
            setShowAuthFlow(false);
            showToast(
              `Akun Affiliate terhubung ke Staff Sales ${nextSponsor.name} (${nextSponsor.code}).`
            );
            return;
          }
          setActiveTab('home');
          setShowAuthFlow(false);
          showToast('Berhasil masuk ke Agentzy Human Workforce Portal.');
        }}
        onCloseAuth={() => setShowAuthFlow(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F8FA] text-[#172B3A]">
      {/* Toast Feedback */}
      <AnimatePresence>
        {portalToast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed right-4 top-16 z-50 flex items-center gap-2 rounded-[10px] border border-[#247A55]/30 bg-[#17324D] px-4 py-2.5 text-xs font-semibold text-white shadow-lg"
          >
            <CheckCircle2 className="h-4 w-4 text-[#87CEEB]" />
            <span>{portalToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex min-h-screen">
        {/* DESKTOP DEEP NAVY SIDEBAR (Image 1 Layout) */}
        <aside className="hidden lg:flex lg:w-[252px] lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 bg-[#17324D] text-white border-r border-[#245477]/40 z-30">
          {/* Brand Top */}
          <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
            <Link href="/" className="flex items-center gap-2.5">
              <AgentzyLogo variant="dark" size="md" />
            </Link>
          </div>

          {/* Nav Links */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#9BB4C7]">
              {roleMode === 'technician'
                ? 'Menu Teknisi'
                : roleMode === 'affiliate'
                  ? 'Menu Mitra Affiliate'
                  : 'Menu Sales Agentzy'}
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.id)}
                  className={`flex w-full items-center justify-between rounded-[10px] px-3 py-2.5 text-left text-xs font-semibold transition ${
                    isActive
                      ? 'bg-[#0284C7] text-white shadow-sm'
                      : 'text-[#CFE3EE] hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 font-mono-tabular text-[10px] font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-[#ADD8E6]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Promo / Auth Actions */}
          <div className="border-t border-white/10 p-3 space-y-2.5">
            {roleMode === 'sales' ? (
              <button
                type="button"
                onClick={() => {
                  setUpgradeSubmitted(false);
                  setShowUpgradeModal(true);
                }}
                className="w-full rounded-[12px] border border-[#ADD8E6]/30 bg-gradient-to-br from-[#245477] to-[#1D4463] p-3 text-left transition hover:border-[#87CEEB]"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-[#FDE68A]">
                  <Crown className="h-4 w-4" />
                  <span>Upgrade ke Tier Elite</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-[#CFE3EE]">
                  Target lebih tinggi, komisi lebih besar, dan benefit eksklusif!
                </p>
              </button>
            ) : roleMode === 'affiliate' ? (
              <button
                type="button"
                onClick={() => navigateTo('leads', true)}
                className="w-full rounded-[12px] border border-[#ADD8E6]/25 bg-[#1D4463] p-3 text-left transition hover:border-[#87CEEB]"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-[#87CEEB]">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Mitra Affiliate Aktif ({placedSchema.salesConfig.affiliateSplitPct}%)</span>
                </div>
                <p className="mt-1 text-[11px] text-[#CFE3EE]">
                  {placedSchema.corporateName} · Input prospek &amp; pantau komisi Anda.
                </p>
              </button>
            ) : (
              <div className="rounded-[12px] border border-[#ADD8E6]/25 bg-[#1D4463] p-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#87CEEB]">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Mode Lapangan Offline Ready</span>
                </div>
                <p className="mt-1 text-[11px] text-[#CFE3EE]">
                  Sinkronisasi offline aktif ({offlineQueue.length} item antrean).
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setAuthInitialStep('splash');
                  setShowAuthFlow(true);
                }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-[8px] border border-white/15 bg-white/5 px-2.5 py-2 text-[11px] font-semibold text-[#CFE3EE] hover:bg-white/10"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Splash / Auth</span>
              </button>
              <Link
                href="/"
                className="flex items-center justify-center gap-1 rounded-[8px] border border-white/15 bg-white/5 px-2.5 py-2 text-[11px] font-semibold text-[#CFE3EE] hover:bg-white/10"
                title="Landing Page Agentzy"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Home</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* MAIN WORKSPACE CONTENT AREA */}
        <div className="flex-1 flex flex-col lg:pl-[252px] min-w-0">
          {/* TOP BAR */}
          <header className="sticky top-0 z-20 border-b border-[#D8E3E9] bg-white/95 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
              {/* Left: Mobile Drawer & Logo OR Desktop Title */}
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setShowMobileDrawer(true)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-[#D8E3E9] text-[#17324D] hover:bg-[#F5F8FA] lg:hidden"
                  aria-label="Buka Menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2 lg:hidden">
                  <AgentzyLogo variant="light" size="sm" />
                </div>
                <div className="hidden lg:block">
                  <p className="text-sm font-bold text-[#17324D] whitespace-nowrap">
                    Human Workforce Portal · {placedSchema.corporateName}
                  </p>
                  <p className="text-[11px] text-[#526675] whitespace-nowrap">
                    {roleMode === 'technician'
                      ? `Portal Teknisi Lapangan · Kontrak ${placedSchema.contractNumber}`
                      : roleMode === 'affiliate'
                        ? `Mitra Affiliate Freelance · Bagi Hasil ${placedSchema.salesConfig.affiliateSplitPct}%`
                        : `Sales Resmi · Split ${placedSchema.salesConfig.affiliateSplitPct}/${placedSchema.salesConfig.salesIncrementalSplitPct} (${placedSchema.contractNumber})`}
                  </p>
                </div>
              </div>

              {/* Center: Search (Desktop) */}
              <div className="relative hidden md:block flex-1 max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5F879E]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    roleMode === 'technician'
                      ? 'Cari work order, pelanggan, atau lokasi...'
                      : roleMode === 'affiliate'
                        ? 'Cari prospek atau tugas affiliate...'
                        : 'Cari lead, tugas, atau anggota affiliate...'
                  }
                  className="w-full rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] py-2 pl-9 pr-8 text-xs text-[#172B3A] outline-none focus:border-[#0284C7] focus:bg-white"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#526675]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}

                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-11 z-40 rounded-[12px] border border-[#D8E3E9] bg-white p-1.5 shadow-lg">
                    {searchResults.map((res) => (
                      <button
                        key={res.id}
                        type="button"
                        onClick={() => {
                          if (res.woId) {
                            setRoleMode('technician');
                            setSelectedWoId(res.woId);
                          }
                          setActiveTab(res.tab);
                          setSearchQuery('');
                        }}
                        className="flex w-full flex-col rounded-[8px] px-3 py-2 text-left hover:bg-[#E6F4F9]"
                      >
                        <span className="text-xs font-bold text-[#17324D]">{res.title}</span>
                        <span className="text-[11px] text-[#526675]">{res.subtitle}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Role Switcher + Bell + Settings + Profile */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Role Switcher */}
                <div className="hidden sm:flex items-center rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] p-0.5">
                  {(
                    [
                      { id: 'sales', label: 'Sales Agentzy' },
                      { id: 'affiliate', label: 'Affiliate' },
                      { id: 'technician', label: 'Teknisi' },
                    ] as const
                  ).map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleRoleSwitch(r.id)}
                      className={`whitespace-nowrap rounded-[8px] px-2.5 py-1 text-[11px] font-bold transition ${
                        roleMode === r.id
                          ? 'bg-[#17324D] text-white'
                          : 'text-[#526675] hover:text-[#17324D]'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>

                {/* PWA Button compact on desktop */}
                <div className="hidden xl:block">
                  <PWAInstallButton />
                </div>

                {/* Notifications */}
                <button
                  type="button"
                  onClick={() => navigateTo('notifications')}
                  className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border transition ${
                    activeTab === 'notifications'
                      ? 'border-[#0284C7] bg-[#E6F4F9] text-[#0284C7]'
                      : 'border-[#D8E3E9] text-[#17324D] hover:bg-[#F5F8FA]'
                  }`}
                  aria-label="Notifikasi"
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#B23A48]" />
                </button>

                {/* Settings */}
                <button
                  type="button"
                  onClick={() => navigateTo('settings')}
                  className={`hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border transition ${
                    activeTab === 'settings'
                      ? 'border-[#0284C7] bg-[#E6F4F9] text-[#0284C7]'
                      : 'border-[#D8E3E9] text-[#17324D] hover:bg-[#F5F8FA]'
                  }`}
                  aria-label="Pengaturan"
                >
                  <Settings className="h-4 w-4" />
                </button>

                {/* User Avatar Pill */}
                <button
                  type="button"
                  onClick={() => navigateTo('profile')}
                  className="flex items-center gap-2 rounded-[10px] border border-[#D8E3E9] bg-white px-2 py-1 hover:border-[#0284C7]"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#17324D] text-[11px] font-bold text-white">
                    {currentUser.initials}
                  </span>
                  <span className="hidden md:flex flex-col text-left leading-tight">
                    <span className="text-xs font-bold text-[#17324D] whitespace-nowrap">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-[#526675] whitespace-nowrap">
                      {currentUser.shortRole}
                    </span>
                  </span>
                </button>
              </div>
            </div>

            {/* Mobile Quick Role Switcher Bar */}
            <div className="flex items-center justify-between gap-2 border-t border-[#EAF2F6] bg-[#F5F8FA] px-4 py-1.5 sm:hidden">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#526675]">
                Mode Peran
              </span>
              <div className="flex items-center gap-1">
                {(
                  [
                    { id: 'sales', label: 'Sales Agentzy' },
                    { id: 'affiliate', label: 'Affiliate' },
                    { id: 'technician', label: 'Teknisi' },
                  ] as const
                ).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleRoleSwitch(r.id)}
                    className={`rounded-[7px] px-2 py-1 text-[11px] font-bold ${
                      roleMode === r.id
                        ? 'bg-[#17324D] text-white'
                        : 'bg-white text-[#526675] border border-[#D8E3E9]'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </header>

          {/* VIEWPORT CONTENT */}
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 pb-24 sm:px-6 lg:pb-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${roleMode}-${activeTab}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
              >
                {/* HOME */}
                {activeTab === 'home' &&
                  (roleMode === 'technician' ? (
                    <TechnicianDashboardView
                      workOrders={workOrders}
                      onNavigate={navigateTo}
                      onSelectWorkOrder={(wo) => {
                        setSelectedWoId(wo.id);
                        setActiveTab('workorders');
                      }}
                      placedSchema={placedSchema}
                      allCorpSchemas={corpSchemas}
                      onChangePlacedCorporateId={setPlacedCorporateId}
                      techBonusRules={techBonusRules}
                      techTaskCounts={techTaskCounts}
                    />
                  ) : (
                    <SalesDashboardView
                      roleMode={roleMode}
                      tasks={tasks}
                      onNavigate={navigateTo}
                      onOpenNewLead={() => {
                        setOpenNewLeadTrigger(true);
                        setLeadsMountSeq((n) => n + 1);
                        setActiveTab('leads');
                      }}
                      userName={currentUser.name}
                      sponsorInfo={boundSponsor}
                      placedSchema={placedSchema}
                      allCorpSchemas={corpSchemas}
                      onChangePlacedCorporateId={setPlacedCorporateId}
                    />
                  ))}

                {/* SALES & AFFILIATE ROUTES */}
                {activeTab === 'tasks' && roleMode !== 'technician' && (
                  <TasksView
                    roleMode={roleMode}
                    tasks={tasks}
                    onToggleTaskStatus={handleToggleTaskStatus}
                  />
                )}

                {activeTab === 'leads' && roleMode !== 'technician' && (
                  <LeadsAndDetailView
                    key={`leads-${leadsMountSeq}`}
                    roleMode={roleMode}
                    leads={leads}
                    onAddLead={handleAddLead}
                    onUpdateLeadStatus={handleUpdateLeadStatus}
                    onAddLeadActivity={handleAddLeadActivity}
                    initialShowAddLead={openNewLeadTrigger}
                  />
                )}

                {activeTab === 'team' && roleMode === 'sales' && (
                  <AffiliateTeamAndRecruitView
                    key="team"
                    affiliates={affiliates}
                    onAddAffiliate={handleAddAffiliate}
                    onApproveAffiliate={handleApproveAffiliate}
                    initialSubView="team"
                  />
                )}

                {activeTab === 'recruit' && roleMode === 'sales' && (
                  <AffiliateTeamAndRecruitView
                    key="recruit"
                    affiliates={affiliates}
                    onAddAffiliate={handleAddAffiliate}
                    onApproveAffiliate={handleApproveAffiliate}
                    initialSubView="recruit"
                  />
                )}

                {activeTab === 'commission' &&
                  (roleMode === 'technician' ? (
                    <TechCommissionView
                      placedSchema={placedSchema}
                      allCorpSchemas={corpSchemas}
                      onChangePlacedCorporateId={setPlacedCorporateId}
                      techBonusRules={techBonusRules}
                      techTaskCounts={techTaskCounts}
                    />
                  ) : (
                    <CommissionAndSimulatorView
                      key="commission"
                      roleMode={roleMode}
                      initialSubTab="rincian"
                      placedSchema={placedSchema}
                      allCorpSchemas={corpSchemas}
                      onChangePlacedCorporateId={setPlacedCorporateId}
                    />
                  ))}

                {activeTab === 'simulator' && roleMode !== 'technician' && (
                  <CommissionAndSimulatorView
                    key="simulator"
                    roleMode={roleMode}
                    initialSubTab="simulasi"
                    placedSchema={placedSchema}
                    allCorpSchemas={corpSchemas}
                    onChangePlacedCorporateId={setPlacedCorporateId}
                  />
                )}

                {activeTab === 'tier' && roleMode === 'sales' && (
                  <SalesTierView
                    onNavigate={navigateTo}
                    placedSchema={placedSchema}
                  />
                )}

                {/* TECHNICIAN ROUTES */}
                {activeTab === 'workorders' && roleMode === 'technician' && (
                  <WorkOrderWorkflowView
                    workOrders={workOrders}
                    selectedWoId={selectedWoId}
                    onSelectWoId={setSelectedWoId}
                    onCompleteWo={handleCompleteWo}
                    onQueueOfflineAction={handleQueueOfflineAction}
                  />
                )}

                {activeTab === 'history' && roleMode === 'technician' && (
                  <TechHistoryView workOrders={workOrders} />
                )}

                {activeTab === 'inventory' && roleMode === 'technician' && (
                  <TechInventoryView
                    inventory={inventory}
                    onRequestRestock={handleRequestRestock}
                  />
                )}

                {/* SHARED WORKFORCE ROUTES */}
                {activeTab === 'attendance' && roleMode !== 'affiliate' && (
                  <AttendanceView roleMode={roleMode} />
                )}

                {activeTab === 'performance' && (
                  <PerformanceKPIView roleMode={roleMode} />
                )}

                {activeTab === 'training' && (
                  <TrainingCertView roleMode={roleMode} />
                )}

                {activeTab === 'workspace' && roleMode !== 'affiliate' && (
                  <WorkspaceCenterView />
                )}

                {activeTab === 'ai-collab' && (
                  <AICollaborationView
                    roleMode={roleMode}
                    userName={currentUser.name}
                    workOrders={workOrders}
                    leads={leads}
                    onAddLead={handleAddLead}
                    onSelectWorkOrder={(wo) => {
                      setSelectedWoId(wo.id);
                      setActiveTab('workorders');
                    }}
                    onNavigate={navigateTo}
                    onShowToast={showToast}
                  />
                )}

                {activeTab === 'notifications' && (
                  <NotificationsView roleMode={roleMode} onNavigate={navigateTo} />
                )}

                {activeTab === 'profile' && (
                  <ProfilePassportView
                    roleMode={roleMode}
                    userName={currentUser.name}
                    sponsorInfo={boundSponsor}
                  />
                )}

                {activeTab === 'help' && <HelpFAQView roleMode={roleMode} />}

                {activeTab === 'settings' && (
                  <SettingsView
                    offlineSyncEnabled={offlineSyncEnabled}
                    onToggleOfflineSync={() => {
                      setOfflineSyncEnabled((v) => !v);
                      showToast(
                        !offlineSyncEnabled
                          ? 'Mode Offline diaktifkan.'
                          : 'Mode Offline dinonaktifkan.'
                      );
                    }}
                    offlineQueue={offlineQueue}
                    onFlushQueue={() => {
                      setOfflineQueue([]);
                      showToast('Seluruh antrean offline berhasil disinkronkan ke server.');
                    }}
                    onLogout={() => {
                      setAuthInitialStep('login');
                      setShowAuthFlow(true);
                    }}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR (Images 1-4) */}
      <nav
        aria-label="Navigasi Utama Mobile"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[#D8E3E9] bg-white/95 backdrop-blur lg:hidden"
      >
        <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-center px-2">
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${
              activeTab === 'home' ? 'text-[#0284C7]' : 'text-[#526675]'
            }`}
          >
            <Home className="h-5 w-5" />
            <span>Beranda</span>
          </button>

          <button
            type="button"
            onClick={() =>
              navigateTo(roleMode === 'technician' ? 'workorders' : 'tasks')
            }
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${
              activeTab === 'tasks' || activeTab === 'workorders'
                ? 'text-[#0284C7]'
                : 'text-[#526675]'
            }`}
          >
            {roleMode === 'technician' ? (
              <Wrench className="h-5 w-5" />
            ) : (
              <ClipboardList className="h-5 w-5" />
            )}
            <span>Tugas</span>
          </button>

          {/* Center '+' FAB */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => setShowQuickActionModal(true)}
              className="-mt-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#0284C7] text-white shadow-md ring-4 ring-white transition active:scale-95"
              aria-label="Aksi Cepat"
            >
              <Plus className="h-6 w-6" />
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              navigateTo(
                roleMode === 'technician'
                  ? 'history'
                  : roleMode === 'affiliate'
                    ? 'commission'
                    : 'team'
              )
            }
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${
              activeTab === 'team' ||
              activeTab === 'history' ||
              (roleMode === 'affiliate' && activeTab === 'commission')
                ? 'text-[#0284C7]'
                : 'text-[#526675]'
            }`}
          >
            {roleMode === 'technician' ? (
              <History className="h-5 w-5" />
            ) : roleMode === 'affiliate' ? (
              <Wallet className="h-5 w-5" />
            ) : (
              <Users className="h-5 w-5" />
            )}
            <span>
              {roleMode === 'technician'
                ? 'Histori'
                : roleMode === 'affiliate'
                  ? 'Komisi'
                  : 'Tim'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo('profile')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${
              activeTab === 'profile' ? 'text-[#0284C7]' : 'text-[#526675]'
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[9px] font-bold">
              {currentUser.initials}
            </span>
            <span>Profil</span>
          </button>
        </div>
      </nav>

      {/* MOBILE DRAWER SIDEBAR (Screen 7) */}
      <AnimatePresence>
        {showMobileDrawer && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileDrawer(false)}
              className="fixed inset-0 bg-[#172B3A]/60 backdrop-blur-xs"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.22 }}
              className="fixed inset-y-0 left-0 flex w-[84%] max-w-xs flex-col bg-white shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-[#D8E3E9] bg-[#F5F8FA] px-4 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#17324D] text-sm font-bold text-white">
                    {currentUser.initials}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[#17324D]">
                      {currentUser.name}
                    </p>
                    <p className="text-[11px] font-medium text-[#526675]">
                      {currentUser.roleLabel}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMobileDrawer(false)}
                  className="rounded-lg p-1.5 text-[#526675] hover:bg-white"
                  aria-label="Tutup Menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Menu Items */}
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigateTo(item.id)}
                      className={`flex w-full items-center justify-between rounded-[10px] px-3 py-2.5 text-left text-xs font-semibold ${
                        isActive
                          ? 'bg-[#E6F4F9] text-[#0284C7]'
                          : 'text-[#172B3A] hover:bg-[#F5F8FA]'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </span>
                      {item.badge && (
                        <span className="rounded-full bg-[#F5F8FA] px-2 py-0.5 font-mono-tabular text-[10px] font-bold text-[#17324D]">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Drawer Footer */}
              <div className="border-t border-[#D8E3E9] p-3 space-y-2.5">
                {roleMode === 'sales' && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMobileDrawer(false);
                      setUpgradeSubmitted(false);
                      setShowUpgradeModal(true);
                    }}
                    className="w-full rounded-[12px] border border-[#ADD8E6] bg-[#E6F4F9] p-3 text-left"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-[#17324D]">
                      <Crown className="h-4 w-4 text-[#A96816]" />
                      <span>Upgrade ke Tier Elite</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-[#526675]">
                      Dapatkan benefit &amp; insentif lebih besar!
                    </p>
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMobileDrawer(false);
                      setAuthInitialStep('splash');
                      setShowAuthFlow(true);
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] py-2 text-xs font-semibold text-[#17324D]"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Auth Flow</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMobileDrawer(false);
                      setAuthInitialStep('login');
                      setShowAuthFlow(true);
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-[10px] border border-[#B23A48]/30 bg-[#FEF2F2] py-2 text-xs font-semibold text-[#B23A48]"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Keluar</span>
                  </button>
                </div>

                <Link
                  href="/"
                  className="flex w-full items-center justify-center gap-1.5 rounded-[10px] border border-[#D8E3E9] py-2 text-xs font-semibold text-[#526675]"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Lihat Landing Page Agentzy</span>
                </Link>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* CENTER '+' QUICK ACTION MODAL */}
      {showQuickActionModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#172B3A]/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[16px] border border-[#D8E3E9] bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EAF2F6] pb-3">
              <div>
                <h2 className="text-base font-bold text-[#17324D]">Aksi Cepat Workforce</h2>
                <p className="text-xs text-[#526675]">
                  Pilih tindakan cepat untuk peran {currentUser.shortRole}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickActionModal(false)}
                className="rounded-lg p-1.5 text-[#526675] hover:bg-[#F5F8FA]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {roleMode === 'technician' ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuickActionModal(false);
                      setSelectedWoId(workOrders[0]?.id || null);
                      navigateTo('workorders');
                    }}
                    className="flex flex-col items-start gap-1.5 rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-3 text-left hover:border-[#0284C7] hover:bg-[#E6F4F9]"
                  >
                    <Wrench className="h-5 w-5 text-[#0284C7]" />
                    <span className="text-xs font-bold text-[#17324D]">Eksekusi WO Terdekat</span>
                    <span className="text-[11px] text-[#526675]">Buka checklist &amp; Google Maps</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuickActionModal(false);
                      navigateTo('inventory');
                    }}
                    className="flex flex-col items-start gap-1.5 rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-3 text-left hover:border-[#0284C7] hover:bg-[#E6F4F9]"
                  >
                    <Package className="h-5 w-5 text-[#245477]" />
                    <span className="text-xs font-bold text-[#17324D]">Ambil Material</span>
                    <span className="text-[11px] text-[#526675]">Ajukan ONT &amp; kabel FO</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuickActionModal(false);
                      navigateTo('leads', true);
                    }}
                    className="flex flex-col items-start gap-1.5 rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-3 text-left hover:border-[#0284C7] hover:bg-[#E6F4F9]"
                  >
                    <Briefcase className="h-5 w-5 text-[#0284C7]" />
                    <span className="text-xs font-bold text-[#17324D]">Buat Lead Baru</span>
                    <span className="text-[11px] text-[#526675]">Catat prospek FTTH/FWA</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuickActionModal(false);
                      navigateTo(roleMode === 'sales' ? 'recruit' : 'simulator');
                    }}
                    className="flex flex-col items-start gap-1.5 rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-3 text-left hover:border-[#0284C7] hover:bg-[#E6F4F9]"
                  >
                    {roleMode === 'sales' ? (
                      <UserPlus className="h-5 w-5 text-[#245477]" />
                    ) : (
                      <Calculator className="h-5 w-5 text-[#245477]" />
                    )}
                    <span className="text-xs font-bold text-[#17324D]">
                      {roleMode === 'sales' ? 'Rekrut Affiliate' : 'Simulasi Komisi'}
                    </span>
                    <span className="text-[11px] text-[#526675]">
                      {roleMode === 'sales'
                        ? 'Bagikan kode & link referral'
                        : 'Hitung potensi penghasilan'}
                    </span>
                  </button>
                </>
              )}

              {roleMode === 'affiliate' ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickActionModal(false);
                    navigateTo('commission');
                  }}
                  className="flex flex-col items-start gap-1.5 rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-3 text-left hover:border-[#0284C7] hover:bg-[#E6F4F9]"
                >
                  <Wallet className="h-5 w-5 text-[#247A55]" />
                  <span className="text-xs font-bold text-[#17324D]">
                    Cek Komisi {placedSchema.salesConfig.affiliateSplitPct}%
                  </span>
                  <span className="text-[11px] text-[#526675]">Rincian &amp; tarik penghasilan</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickActionModal(false);
                    navigateTo('attendance');
                  }}
                  className="flex flex-col items-start gap-1.5 rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-3 text-left hover:border-[#0284C7] hover:bg-[#E6F4F9]"
                >
                  <Clock className="h-5 w-5 text-[#247A55]" />
                  <span className="text-xs font-bold text-[#17324D]">Absen Cepat</span>
                  <span className="text-[11px] text-[#526675]">Check-in lokasi &amp; shift</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowQuickActionModal(false);
                  const start = new Date(Date.now() + 60 * 60 * 1000);
                  const end = new Date(start.getTime() + 45 * 60 * 1000);
                  openScheduleMeetingModal({
                    summary: `Briefing Lapangan Agentzy (${currentUser.name})`,
                    description: 'Koordinasi cepat via Google Calendar & Google Meet.',
                    startIso: start.toISOString().slice(0, 16),
                    endIso: end.toISOString().slice(0, 16),
                    includeMeet: true,
                  });
                }}
                className="flex flex-col items-start gap-1.5 rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-3 text-left hover:border-[#0284C7] hover:bg-[#E6F4F9]"
              >
                <Calendar className="h-5 w-5 text-[#A96816]" />
                <span className="text-xs font-bold text-[#17324D]">Jadwal Meet</span>
                <span className="text-[11px] text-[#526675]">Buat Google Calendar + Meet</span>
              </button>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setShowQuickActionModal(false);
                  navigateTo('ai-collab');
                }}
                className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-[#ADD8E6] bg-[#E6F4F9] py-2.5 text-xs font-bold text-[#0284C7] hover:bg-[#D7EFF8]"
              >
                <Bot className="h-4 w-4" />
                <span>Buka Kolaborasi AI Partner</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowQuickActionModal(false);
                  openSendEmailModal({
                    to: 'supervisor@agentzy.id',
                    subject: `Laporan Harian Workforce - ${currentUser.name}`,
                    body: `Halo Supervisor,\n\nBerikut ringkasan progres harian saya di Agentzy Human Workforce Portal.\n\nSalam,\n${currentUser.name}`,
                    contextLabel: 'Laporan Cepat Workforce',
                  });
                }}
                className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-[#D8E3E9] bg-white py-2.5 text-xs font-bold text-[#17324D] hover:bg-[#F5F8FA]"
              >
                <Mail className="h-4 w-4 text-[#0284C7]" />
                <span>Kirim Laporan via Gmail</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPGRADE KE TIER SALES AGENTZY ELITE MODAL */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B3A]/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[16px] border border-[#D8E3E9] bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#FEF3C7] text-[#A96816]">
                  <Crown className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#17324D]">
                    Upgrade ke Sales Agentzy Elite
                  </h2>
                  <p className="text-xs text-[#526675]">
                    Tingkatkan batas komisi &amp; akses kuota affiliate premium
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="rounded-lg p-1.5 text-[#526675] hover:bg-[#F5F8FA]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {upgradeSubmitted ? (
              <div className="mt-4 rounded-[12px] border border-[#247A55]/30 bg-[#EBF7F1] p-4 text-center">
                <CheckCircle2 className="mx-auto h-9 w-9 text-[#247A55]" />
                <p className="mt-2 text-sm font-bold text-[#17324D]">
                  Pengajuan Evaluasi Tier Elite Terkirim
                </p>
                <p className="mt-1 text-xs text-[#526675]">
                  Area Manager akan meninjau pencapaian SA &amp; sertifikasi Anda dalam
                  1x24 jam kerja.
                </p>
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(false)}
                  className="mt-4 w-full rounded-[10px] bg-[#17324D] py-2.5 text-xs font-bold text-white"
                >
                  Tutup
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-3.5 space-y-2">
                  <p className="text-xs font-bold text-[#17324D]">
                    Persyaratan Kelayakan Tier Elite:
                  </p>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#526675]">Minimum 30 SA / bulan (2 bulan beruntun)</span>
                      <span className="font-mono-tabular font-bold text-[#A96816]">24 / 30</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#526675]">Sertifikasi Sales Agentzy Pro Aktif</span>
                      <span className="font-bold text-[#247A55]">Terverifikasi</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#526675]">Minimal 10 Affiliate Aktif</span>
                      <span className="font-mono-tabular font-bold text-[#247A55]">10 / 10</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[12px] border border-[#ADD8E6] bg-[#E6F4F9] p-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#17324D]">
                    <Sparkles className="h-4 w-4 text-[#0284C7]" />
                    <span>Benefit Sales Agentzy Elite</span>
                  </div>
                  <ul className="mt-1.5 space-y-1 text-xs text-[#172B3A]">
                    <li>• Multiplier komisi 1,20x hingga 1,30x per aktivasi</li>
                    <li>• Prioritas distribusi lead corporate &amp; klaster eksklusif</li>
                    <li>• Kapasitas jaringan affiliate hingga 50 mitra aktif</li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowUpgradeModal(false);
                    navigateTo('tier');
                  }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-[10px] border border-[#ADD8E6] bg-white py-2 text-xs font-bold text-[#0284C7] hover:bg-[#E6F4F9]"
                >
                  <Award className="h-4 w-4" />
                  <span>Lihat Skema Lengkap Training, Pro &amp; Elite</span>
                </button>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowUpgradeModal(false)}
                    className="flex-1 rounded-[10px] border border-[#D8E3E9] py-2.5 text-xs font-bold text-[#526675]"
                  >
                    Nanti Saja
                  </button>
                  <button
                    type="button"
                    onClick={() => setUpgradeSubmitted(true)}
                    className="flex-1 rounded-[10px] bg-[#0284C7] py-2.5 text-xs font-bold text-white hover:bg-[#0369A1]"
                  >
                    Ajukan Evaluasi Elite
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
