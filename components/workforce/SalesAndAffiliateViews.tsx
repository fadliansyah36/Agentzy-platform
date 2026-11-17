'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Plus,
  UserPlus,
  ClipboardList,
  Wallet,
  Search,
  ChevronRight,
  Phone,
  MessageSquare,
  Mail,
  Calendar,
  CheckCircle2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Award,
  ArrowUpRight,
  X,
  QrCode,
  ShieldCheck,
  AlertCircle,
  Filter,
  Building2,
} from 'lucide-react';
import {
  formatIDR,
  type LeadItem,
  type TaskItem,
  type AffiliateMember,
  type SalesLifecycleStatus,
  type WorkforceRoleMode,
} from '@/lib/agentzy-data';
import {
  INITIAL_CORPORATE_COMPENSATION_SCHEMAS,
  calculateCorporateSalesAffiliatePayroll,
  type CorporateCompensationSchema,
  type SalesGradeKey,
} from '@/lib/corporate-compensation';
import { useWorkspace } from '@/components/workspace/WorkspaceProvider';

// --- 1. SALES / AFFILIATE DASHBOARD (Image 1 Desktop/Mobile + Screen 5) ---
export function SalesDashboardView({
  roleMode,
  tasks,
  onNavigate,
  onOpenNewLead,
  userName,
  sponsorInfo,
  placedSchema,
  allCorpSchemas,
  onChangePlacedCorporateId,
}: {
  roleMode: WorkforceRoleMode;
  tasks: TaskItem[];
  onNavigate: (tab: string) => void;
  onOpenNewLead: () => void;
  userName?: string;
  sponsorInfo?: { name: string; code: string };
  placedSchema?: CorporateCompensationSchema;
  allCorpSchemas?: CorporateCompensationSchema[];
  onChangePlacedCorporateId?: (id: string) => void;
}) {
  const isAffiliate = roleMode === 'affiliate';
  const displayName = userName || (isAffiliate ? 'Siti Nabila' : 'Raka Pratama');
  const sponsorName = sponsorInfo?.name || 'Raka Pratama';
  const sponsorCode = sponsorInfo?.code || 'AGT-RAKA-2026';
  const activeSchema = placedSchema || INITIAL_CORPORATE_COMPENSATION_SCHEMAS[0];
  const schemasList =
    allCorpSchemas && allCorpSchemas.length > 0
      ? allCorpSchemas
      : INITIAL_CORPORATE_COMPENSATION_SCHEMAS;

  const payroll = calculateCorporateSalesAffiliatePayroll({
    schema: activeSchema,
    grade: 'Pro',
    personalSA: 24,
    affiliateSA: 10,
  });

  const affSplit = payroll.affiliateSplitPct;
  const salesSplit = payroll.salesIncrementalSplitPct;

  const activeTasks = tasks
    .filter((t) => t.roles.includes(roleMode) && t.status === 'aktif')
    .slice(0, 3);

  const monthlyData = [
    { month: 'Jan', target: 18, actual: 12 },
    { month: 'Feb', target: 20, actual: 16 },
    { month: 'Mar', target: 22, actual: 19 },
    { month: 'Apr', target: 25, actual: 22 },
    { month: 'Mei', target: 28, actual: 24 },
    { month: 'Jun', target: 32, actual: 28 },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting & Tier Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#17324D] sm:text-2xl">
            Halo, {displayName} 👋
          </h1>
          <p className="text-xs text-[#526675] sm:text-sm">
            {isAffiliate
              ? `Affiliate Freelance · Sponsor Sales: ${sponsorName} (${sponsorCode}) · ${activeSchema.corporateName}`
              : `Penempatan: ${activeSchema.corporateName} (${activeSchema.contractNumber}) · Split ${affSplit}/${salesSplit}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onChangePlacedCorporateId && (
            <div className="flex items-center gap-1.5 rounded-[10px] border border-[#D8E3E9] bg-white px-2.5 py-1.5">
              <Building2 className="h-3.5 w-3.5 text-[#0284C7]" />
              <select
                value={activeSchema.id}
                onChange={(e) => onChangePlacedCorporateId(e.target.value)}
                aria-label="Penempatan Vendor Corporate"
                className="bg-transparent text-xs font-semibold text-[#17324D] outline-none"
              >
                {schemasList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.corporateName} ({s.salesConfig.affiliateSplitPct}/{s.salesConfig.salesIncrementalSplitPct})
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            type="button"
            onClick={() => onNavigate(isAffiliate ? 'profile' : 'tier')}
            className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#ADD8E6] bg-[#E6F4F9] px-3 py-1.5 text-xs font-bold text-[#17324D] hover:bg-[#DCEFF7]"
          >
            <Award className="h-3.5 w-3.5 text-[#0284C7]" />
            <span>{isAffiliate ? `Terikat: ${sponsorCode}` : 'Sales Agentzy · Tier Pro'}</span>
          </button>
        </div>
      </div>

      {/* Hero Promotional Banner (Image 1) */}
      <div className="relative overflow-hidden rounded-[14px] border border-[#ADD8E6] bg-gradient-to-r from-[#E6F4F9] via-[#D6EEF8] to-[#ADD8E6]/60">
        <div className="grid grid-cols-1 items-center md:grid-cols-12">
          <div className="p-5 sm:p-6 md:col-span-7">
            <p className="text-xs font-bold text-[#0284C7]">
              {isAffiliate
                ? `Skema Pembagian Inkremental ${affSplit}% (${activeSchema.corporateName})`
                : `Kontrak ${activeSchema.contractNumber} · Split ${affSplit}% Affiliate / ${salesSplit}% Sales`}
            </p>
            <h2 className="mt-1 text-lg font-bold leading-snug text-[#17324D] sm:text-xl">
              {isAffiliate
                ? 'Kirim Prospek ISP & Pantau Komisi Anda Real-Time'
                : 'Jual, Rekrut, Kolaborasi & Raih Gaji + Komisi Sesuai Kontrak'}
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-[#526675] sm:text-sm">
              {isAffiliate
                ? `Setiap aktivasi pelanggan di ${activeSchema.corporateName} terhitung otomatis pada rasio ${affSplit}% Affiliate / ${salesSplit}% Staff Sales.`
                : `Gaji Pokok ${formatIDR(payroll.baseSalaryIdr)} + Komisi SA & pembagian otomatis ${salesSplit}% dari jaringan Affiliate di ${activeSchema.corporateName}.`}
            </p>
          </div>
          <div className="relative h-40 w-full md:col-span-5 md:h-48">
            <Image
              src="/images/workforce_sales_banner.jpg"
              alt="Tim Sales Eksekutif Agentzy"
              fill
              referrerPolicy="no-referrer"
              className="object-cover object-top"
            />
          </div>
        </div>
      </div>

      {/* Quick Actions 4-Grid (Image 1) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          type="button"
          onClick={onOpenNewLead}
          className="flex flex-col items-center justify-center gap-2 rounded-[14px] border border-[#D8E3E9] bg-white p-4 text-center transition hover:border-[#0284C7] hover:bg-[#F5F8FA]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#0284C7]">
            <Plus className="h-5 w-5" />
          </div>
          <span className="text-xs font-semibold text-[#17324D]">Buat Lead</span>
        </button>

        {!isAffiliate ? (
          <button
            type="button"
            onClick={() => onNavigate('recruit')}
            className="flex flex-col items-center justify-center gap-2 rounded-[14px] border border-[#D8E3E9] bg-white p-4 text-center transition hover:border-[#0284C7] hover:bg-[#F5F8FA]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#0284C7]">
              <UserPlus className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-[#17324D]">
              Rekrut Affiliate
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onNavigate('leads')}
            className="flex flex-col items-center justify-center gap-2 rounded-[14px] border border-[#D8E3E9] bg-white p-4 text-center transition hover:border-[#0284C7] hover:bg-[#F5F8FA]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#0284C7]">
              <ArrowUpRight className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-[#17324D]">
              Lead Saya
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onNavigate('tasks')}
          className="flex flex-col items-center justify-center gap-2 rounded-[14px] border border-[#D8E3E9] bg-white p-4 text-center transition hover:border-[#0284C7] hover:bg-[#F5F8FA]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#0284C7]">
            <ClipboardList className="h-5 w-5" />
          </div>
          <span className="text-xs font-semibold text-[#17324D]">Tugas Saya</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('commission')}
          className="flex flex-col items-center justify-center gap-2 rounded-[14px] border border-[#D8E3E9] bg-white p-4 text-center transition hover:border-[#0284C7] hover:bg-[#F5F8FA]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#0284C7]">
            <Wallet className="h-5 w-5" />
          </div>
          <span className="text-xs font-semibold text-[#17324D]">
            Komisi &amp; Penghasilan
          </span>
        </button>
      </div>

      {/* Ringkasan Performa KPI Strip */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#17324D]">
            Ringkasan Performa (Bulan Ini)
          </h3>
          <button
            type="button"
            onClick={() => onNavigate('performance')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0284C7] hover:underline"
          >
            <span>Lihat Detail</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4">
            <p className="text-xs text-[#526675]">
              {isAffiliate ? 'Prospek / Order' : 'Sales / Order'}
            </p>
            <div className="mt-1.5 flex items-baseline justify-between gap-2">
              <span className="font-mono-tabular text-2xl font-bold text-[#172B3A]">
                {isAffiliate ? 8 : 24}
              </span>
              <span className="font-mono-tabular text-xs font-semibold text-[#247A55]">
                {isAffiliate ? '+14%' : '+26%'}
              </span>
            </div>
          </div>

          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4">
            <p className="text-xs text-[#526675]">Aktivasi</p>
            <div className="mt-1.5 flex items-baseline justify-between gap-2">
              <span className="font-mono-tabular text-2xl font-bold text-[#172B3A]">
                {isAffiliate ? 7 : 22}
              </span>
              <span className="font-mono-tabular text-xs font-semibold text-[#247A55]">
                {isAffiliate ? '+17%' : '+29%'}
              </span>
            </div>
          </div>

          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4">
            <p className="text-xs text-[#526675]">
              {isAffiliate ? 'Tingkat Konversi' : 'Produktivitas'}
            </p>
            <div className="mt-1.5 flex items-baseline justify-between gap-2">
              <span className="font-mono-tabular text-2xl font-bold text-[#172B3A]">
                {isAffiliate ? '87,5%' : '118%'}
              </span>
              <span className="font-mono-tabular text-xs font-semibold text-[#247A55]">
                {isAffiliate ? '+9%' : '+18%'}
              </span>
            </div>
          </div>

          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4">
            <p className="text-xs text-[#526675]">
              {isAffiliate ? `Komisi Affiliate (${affSplit}%)` : 'Total Take-Home Pay'}
            </p>
            <div className="mt-1.5 flex items-baseline justify-between gap-2">
              <span className="font-mono-tabular text-lg font-bold text-[#172B3A] sm:text-xl">
                {isAffiliate ? formatIDR(payroll.affiliatePayoutIdr) : formatIDR(payroll.salesTotalTakeHomeIdr)}
              </span>
              <span className="font-mono-tabular text-xs font-semibold text-[#247A55]">
                {activeSchema.vendorCode}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Analytics Grid (Image 1 bottom-right) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Performa Bulanan Chart */}
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[#17324D]">
                Performa Bulanan
              </h3>
              <p className="text-[11px] text-[#718391]">
                Unit: SA / Order · Periode: Jan–Jun · Sumber: Provider Events
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[#526675]">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#87CEEB]" /> Target
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#0284C7]" /> Aktual
              </span>
            </div>
          </div>

          <div className="mt-4">
            <svg viewBox="0 0 360 150" className="h-40 w-full">
              {[0, 10, 20, 30, 40].map((val) => {
                const y = 125 - (val / 40) * 105;
                return (
                  <g key={val}>
                    <line
                      x1="28"
                      y1={y}
                      x2="348"
                      y2={y}
                      stroke="#EAF2F6"
                      strokeWidth="1"
                    />
                    <text
                      x="22"
                      y={y + 3}
                      textAnchor="end"
                      fontSize="9"
                      fill="#718391"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {monthlyData.map((d, idx) => {
                const x = 44 + idx * 52;
                const barH = (d.actual / 40) * 105;
                return (
                  <g key={d.month}>
                    <rect
                      x={x}
                      y={125 - barH}
                      width="24"
                      height={barH}
                      rx="4"
                      fill="#0284C7"
                    />
                    <text
                      x={x + 12}
                      y="142"
                      textAnchor="middle"
                      fontSize="10"
                      fill="#526675"
                    >
                      {d.month}
                    </text>
                  </g>
                );
              })}

              {/* Target line */}
              <polyline
                fill="none"
                stroke="#17324D"
                strokeWidth="2"
                strokeDasharray="4 3"
                points={monthlyData
                  .map((d, idx) => `${56 + idx * 52},${125 - (d.target / 40) * 105}`)
                  .join(' ')}
              />
              {monthlyData.map((d, idx) => (
                <circle
                  key={`dot-${d.month}`}
                  cx={56 + idx * 52}
                  cy={125 - (d.target / 40) * 105}
                  r="3.5"
                  fill="#87CEEB"
                  stroke="#17324D"
                  strokeWidth="1.5"
                />
              ))}
            </svg>
          </div>
        </div>

        {/* Komposisi Penghasilan Donut */}
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-4">
          <h3 className="text-sm font-bold text-[#17324D]">
            Komposisi Penghasilan
          </h3>
          <p className="text-[11px] text-[#718391]">
            Estimasi bruto bulan berjalan · Ledger preview
          </p>

          <div className="mt-4 flex items-center gap-5">
            <div className="relative h-28 w-28 shrink-0">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#EAF2F6"
                  strokeWidth="14"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#0284C7"
                  strokeWidth="14"
                  strokeDasharray="111 239"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#3B8C91"
                  strokeWidth="14"
                  strokeDasharray="78 239"
                  strokeDashoffset="-111"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#87CEEB"
                  strokeWidth="14"
                  strokeDasharray="28 239"
                  strokeDashoffset="-189"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#C18A3A"
                  strokeWidth="14"
                  strokeDasharray="22 239"
                  strokeDashoffset="-217"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-mono-tabular text-xs font-bold text-[#17324D]">
                  {isAffiliate ? 'Rp 2,40 jt' : 'Rp 12,85 jt'}
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-2 text-xs">
              {(isAffiliate
                ? [
                    { label: 'Komisi Prospek (60%)', pct: '77,1%', color: 'bg-[#0284C7]' },
                    { label: 'Insentif Kampanye', pct: '14,6%', color: 'bg-[#3B8C91]' },
                    { label: 'Bonus Validasi Data', pct: '8,3%', color: 'bg-[#87CEEB]' },
                  ]
                : [
                    { label: 'Komisi Pribadi', pct: '46,7%', color: 'bg-[#0284C7]' },
                    { label: 'Share Affiliate', pct: '32,7%', color: 'bg-[#3B8C91]' },
                    { label: 'Insentif SA', pct: '11,7%', color: 'bg-[#87CEEB]' },
                    { label: 'Bonus Tier', pct: '8,9%', color: 'bg-[#C18A3A]' },
                  ]
              ).map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[#526675]">
                    <span className={`h-2.5 w-2.5 rounded-full ${row.color}`} />
                    {row.label}
                  </span>
                  <span className="font-mono-tabular font-semibold text-[#172B3A]">
                    {row.pct}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Aktivitas Terbaru */}
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#17324D]">
              Aktivitas Terbaru
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('notifications')}
              className="text-xs font-semibold text-[#0284C7] hover:underline"
            >
              Semua
            </button>
          </div>
          <div className="mt-4 space-y-3 text-xs">
            <div className="border-b border-[#EAF2F6] pb-2.5">
              <p className="font-semibold text-[#172B3A]">
                {isAffiliate ? 'Prospek berhasil diaktivasi' : 'Order berhasil diaktivasi'}
              </p>
              <p className="mt-0.5 text-[#526675]">
                #ORD-78452 · 10 menit lalu
              </p>
            </div>
            <div className="border-b border-[#EAF2F6] pb-2.5">
              <p className="font-semibold text-[#172B3A]">
                {isAffiliate ? 'Prospek baru diverifikasi' : 'Affiliate baru terdaftar'}
              </p>
              <p className="mt-0.5 text-[#526675]">
                {isAffiliate ? 'Rina Marlina · 1 jam lalu' : 'Siti Nabila · 1 jam lalu'}
              </p>
            </div>
            <div>
              <p className="font-semibold text-[#172B3A]">
                {isAffiliate ? 'Komisi 60% ditambahkan' : 'Komisi ditambahkan'}
              </p>
              <p className="mt-0.5 font-mono-tabular text-[#247A55]">
                {isAffiliate ? 'Rp 210.000 · 2 jam lalu' : 'Rp 350.000 · 2 jam lalu'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tugas Aktif Section */}
      <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#17324D]">Tugas Aktif</h3>
          <button
            type="button"
            onClick={() => onNavigate('tasks')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0284C7] hover:underline"
          >
            <span>Lihat Semua</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-3 divide-y divide-[#EAF2F6]">
          {activeTasks.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onNavigate('tasks')}
              className="flex w-full items-center justify-between gap-4 py-3 text-left transition hover:bg-[#F5F8FA] px-2 rounded-lg"
            >
              <div>
                <p className="text-sm font-semibold text-[#172B3A]">
                  {t.title}
                </p>
                <p className="mt-0.5 text-xs text-[#526675]">
                  {t.subtitle} · {t.priority}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-[#718391]" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- 2. TUGAS & PENUGASAN (Screen 8) ---
export function TasksView({
  roleMode = 'sales',
  tasks,
  onToggleTaskStatus,
}: {
  roleMode?: WorkforceRoleMode;
  tasks: TaskItem[];
  onToggleTaskStatus: (id: string, nextStatus: TaskItem['status']) => void;
}) {
  const { openScheduleMeetingModal } = useWorkspace();
  const [filter, setFilter] = useState<'aktif' | 'menunggu' | 'selesai'>('aktif');
  const [priorityFilter, setPriorityFilter] = useState<string>('Semua');
  const [showPriorityFilter, setShowPriorityFilter] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  const roleTasks = tasks.filter((t) => t.roles.includes(roleMode));

  const counts = {
    aktif: roleTasks.filter((t) => t.status === 'aktif').length,
    menunggu: roleTasks.filter((t) => t.status === 'menunggu').length,
    selesai: roleTasks.filter((t) => t.status === 'selesai').length,
  };

  const filtered = roleTasks.filter(
    (t) =>
      t.status === filter &&
      (priorityFilter === 'Semua' || t.priority === priorityFilter) &&
      (t.title.toLowerCase().includes(query.toLowerCase()) ||
        t.subtitle.toLowerCase().includes(query.toLowerCase()))
  );

  const priorityOptions =
    roleMode === 'sales'
      ? ['Semua', 'Prioritas Tinggi', 'Normal', 'Campaign', 'Recruitment']
      : ['Semua', 'Prioritas Tinggi', 'Normal', 'Campaign'];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-[#17324D]">Tugas &amp; Penugasan</h1>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 rounded-[10px] border border-[#D8E3E9] bg-white p-1">
        {(
          [
            { id: 'aktif', label: `Aktif (${counts.aktif})` },
            { id: 'menunggu', label: `Menunggu (${counts.menunggu})` },
            { id: 'selesai', label: `Selesai (${counts.selesai})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`rounded-[8px] py-2 text-xs font-semibold transition whitespace-nowrap ${
              filter === tab.id
                ? 'bg-[#0284C7] text-white'
                : 'text-[#526675] hover:text-[#17324D]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Filter Toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#718391]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari tugas, lokasi, atau produk..."
            className="h-11 w-full rounded-[10px] border border-[#D8E3E9] bg-white pl-10 pr-4 text-sm text-[#172B3A] focus:border-[#0284C7] focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowPriorityFilter((v) => !v)}
          className={`flex h-11 items-center gap-1.5 rounded-[10px] border px-3.5 text-xs font-semibold transition ${
            showPriorityFilter || priorityFilter !== 'Semua'
              ? 'border-[#0284C7] bg-[#E6F4F9] text-[#0284C7]'
              : 'border-[#D8E3E9] bg-white text-[#17324D]'
          }`}
        >
          <span>Filter</span>
        </button>
      </div>

      {showPriorityFilter && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-[12px] border border-[#D8E3E9] bg-white p-3">
          {priorityOptions.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriorityFilter(p)}
              className={`rounded-[8px] px-2.5 py-1 text-xs font-semibold transition ${
                priorityFilter === p
                  ? 'bg-[#17324D] text-white'
                  : 'bg-[#F5F8FA] text-[#526675] hover:text-[#17324D]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Task List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-8 text-center text-sm text-[#526675]">
            Tidak ada tugas pada kategori ini.
          </div>
        ) : (
          filtered.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => setSelectedTask(task)}
              className="flex w-full items-center justify-between gap-4 rounded-[14px] border border-[#D8E3E9] bg-white p-4 text-left transition hover:border-[#87CEEB]"
            >
              <div>
                <p className="text-sm font-bold text-[#17324D]">{task.title}</p>
                <p className="mt-1 text-xs text-[#526675]">{task.subtitle}</p>
                <p
                  className={`mt-2 text-xs font-semibold ${
                    task.priority === 'Prioritas Tinggi'
                      ? 'text-[#B23A48]'
                      : task.priority === 'Recruitment'
                        ? 'text-[#247A55]'
                        : task.priority === 'Campaign'
                          ? 'text-[#A96816]'
                          : 'text-[#2D6F91]'
                  }`}
                >
                  {task.priority}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-[#718391]" />
            </button>
          ))
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B3A]/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[14px] border border-[#D8E3E9] bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono-tabular text-xs font-semibold text-[#0284C7]">
                  {selectedTask.id}
                </p>
                <h3 className="mt-1 text-base font-bold text-[#17324D]">
                  {selectedTask.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="rounded-lg p-1 text-[#526675] hover:bg-[#EAF2F6]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-3 text-sm text-[#526675]">
              {selectedTask.subtitle} · <strong>{selectedTask.priority}</strong>
            </p>

            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  const start = new Date(Date.now() + 3600000);
                  const end = new Date(start.getTime() + 30 * 60000);
                  openScheduleMeetingModal({
                    summary: `Pengingat Tugas: ${selectedTask.title}`,
                    description: selectedTask.subtitle,
                    startIso: start.toISOString(),
                    endIso: end.toISOString(),
                    includeMeet: false,
                  });
                }}
                className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-[#B8C9D3] bg-white py-2.5 text-sm font-semibold text-[#17324D] hover:bg-[#F5F8FA]"
              >
                <Calendar className="h-4 w-4 text-[#0284C7]" />
                <span>Simpan Pengingat di Google Calendar</span>
              </button>

              {selectedTask.status !== 'selesai' && (
                <button
                  type="button"
                  onClick={() => {
                    onToggleTaskStatus(selectedTask.id, 'selesai');
                    setSelectedTask(null);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#247A55] py-2.5 text-sm font-semibold text-white hover:opacity-95"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Tandai Tugas Selesai</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- 3. LEAD & PENJUALAN + DETAIL LEAD (Screens 9 & 10) ---
export function LeadsAndDetailView({
  roleMode = 'sales',
  leads,
  onAddLead,
  onUpdateLeadStatus,
  onAddLeadActivity,
  initialShowAddLead = false,
}: {
  roleMode?: WorkforceRoleMode;
  leads: LeadItem[];
  onAddLead: (lead: Omit<LeadItem, 'id' | 'activities' | 'lastUpdate'>) => void;
  onUpdateLeadStatus: (id: string, status: SalesLifecycleStatus) => void;
  onAddLeadActivity: (id: string, action: string) => void;
  initialShowAddLead?: boolean;
}) {
  const isAffiliate = roleMode === 'affiliate';
  const { openSendEmailModal, openScheduleMeetingModal } = useWorkspace();
  const [filter, setFilter] = useState<string>('Semua');
  const [sourceFilter, setSourceFilter] = useState<'semua' | 'sales_personal' | 'affiliate'>('semua');
  const [showSourceFilter, setShowSourceFilter] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<'info' | 'aktivitas' | 'order'>('info');

  const [showAddLead, setShowAddLead] = useState(initialShowAddLead);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);

  // Add Lead Form
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newProduct, setNewProduct] = useState('FTTH 100 Mbps');
  const [newAddress, setNewAddress] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Status / Activity Form
  const [nextStatus, setNextStatus] = useState<SalesLifecycleStatus>('Follow Up');
  const [activityNote, setActivityNote] = useState('');

  const scopedLeads = isAffiliate
    ? leads.filter((l) => l.attributionType === 'affiliate')
    : leads;

  const selectedLead = scopedLeads.find((l) => l.id === selectedLeadId) || null;

  const filteredLeads = scopedLeads.filter((l) => {
    const matchFilter =
      filter === 'Semua' ||
      (filter === 'Prospek' && (l.status === 'Prospek' || l.status === 'Follow Up')) ||
      (filter === 'Order' && l.status.includes('Order')) ||
      (filter === 'Aktivasi' && l.status.includes('Aktivasi'));
    const matchSource =
      isAffiliate || sourceFilter === 'semua' || l.attributionType === sourceFilter;
    const matchQuery =
      l.name.toLowerCase().includes(query.toLowerCase()) ||
      l.product.toLowerCase().includes(query.toLowerCase()) ||
      l.address.toLowerCase().includes(query.toLowerCase());
    return matchFilter && matchSource && matchQuery;
  });

  if (selectedLead) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setSelectedLeadId(null)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0284C7] hover:underline"
        >
          <span>← Kembali ke Lead &amp; Penjualan</span>
        </button>

        {/* Lead Header Card (Screen 10) */}
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E6F4F9] text-base font-bold text-[#17324D]">
                {selectedLead.name
                  .split(' ')
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join('')}
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#17324D]">
                  {selectedLead.name}
                </h2>
                <p className="font-mono-tabular text-xs text-[#526675]">
                  {selectedLead.phone} · {selectedLead.email}
                </p>
              </div>
            </div>

            <span className="text-xs font-semibold text-[#0284C7]">
              {selectedLead.status}
            </span>
          </div>

          {/* 4 Quick Action Buttons (Telepon, WhatsApp, Email Gmail, Calendar+Meet) */}
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <a
              href={`tel:${selectedLead.phone.replace(/\s+/g, '')}`}
              className="flex items-center justify-center gap-2 rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] py-2.5 text-xs font-semibold text-[#17324D] hover:bg-[#E6F4F9]"
            >
              <Phone className="h-4 w-4 text-[#0284C7]" />
              <span>Telepon</span>
            </a>
            <a
              href={`https://wa.me/62${selectedLead.phone.replace(/\D/g, '').replace(/^0/, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] py-2.5 text-xs font-semibold text-[#17324D] hover:bg-[#E6F4F9]"
            >
              <MessageSquare className="h-4 w-4 text-[#247A55]" />
              <span>WhatsApp</span>
            </a>
            <button
              type="button"
              onClick={() =>
                openSendEmailModal({
                  to: selectedLead.email,
                  subject: `Penawaran Paket ${selectedLead.product} — Agentzy ISP`,
                  body: `Halo ${selectedLead.name},\n\nTerima kasih telah berkonsultasi mengenai layanan ${selectedLead.product} untuk area ${selectedLead.address}.\n\nSilakan konfirmasi jadwal survei/aktivasi yang sesuai untuk Anda.\n\nSalam,\nTim Sales Agentzy`,
                  contextLabel: `Kirim penawaran resmi ke ${selectedLead.name} via Gmail.`,
                })
              }
              className="flex items-center justify-center gap-2 rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] py-2.5 text-xs font-semibold text-[#17324D] hover:bg-[#E6F4F9]"
            >
              <Mail className="h-4 w-4 text-[#0284C7]" />
              <span>Kirim Gmail</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const start = new Date(Date.now() + 86400000);
                start.setHours(14, 0, 0, 0);
                const end = new Date(start.getTime() + 30 * 60000);
                openScheduleMeetingModal({
                  summary: `Konsultasi Paket ${selectedLead.product} — ${selectedLead.name}`,
                  description: `Follow-up prospek ${selectedLead.name} (${selectedLead.phone}) di ${selectedLead.address}.`,
                  startIso: start.toISOString(),
                  endIso: end.toISOString(),
                  attendeeEmail: selectedLead.email,
                  includeMeet: true,
                });
              }}
              className="flex items-center justify-center gap-2 rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] py-2.5 text-xs font-semibold text-[#17324D] hover:bg-[#E6F4F9]"
            >
              <Calendar className="h-4 w-4 text-[#0284C7]" />
              <span>Jadwal Meet</span>
            </button>
          </div>
        </div>

        {/* Info / Aktivitas / Order Tabs */}
        <div className="grid grid-cols-3 rounded-[10px] border border-[#D8E3E9] bg-white p-1">
          {(
            [
              { id: 'info', label: 'Info' },
              { id: 'aktivitas', label: `Aktivitas (${selectedLead.activities.length})` },
              { id: 'order', label: 'Order' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setDetailTab(t.id)}
              className={`rounded-[8px] py-2 text-xs font-semibold transition ${
                detailTab === t.id
                  ? 'bg-[#0284C7] text-white'
                  : 'text-[#526675] hover:text-[#17324D]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
          {detailTab === 'info' && (
            <dl className="space-y-3.5 text-sm">
              <div>
                <dt className="text-xs text-[#718391]">Produk Minat</dt>
                <dd className="mt-0.5 font-semibold text-[#172B3A]">
                  {selectedLead.product}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#718391]">Alamat Pemasangan</dt>
                <dd className="mt-0.5 font-medium text-[#172B3A]">
                  {selectedLead.address}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#718391]">Status Siklus Hidup</dt>
                <dd className="mt-0.5 font-semibold text-[#0284C7]">
                  {selectedLead.status} ({selectedLead.lifecycleKey})
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#718391]">Atribusi Produktivitas</dt>
                <dd className="mt-0.5 font-medium text-[#172B3A]">
                  {selectedLead.attributionType === 'affiliate'
                    ? isAffiliate
                      ? 'Prospek Affiliate Anda (Porsi Komisi 60% Inkremental)'
                      : 'Affiliate Teratribusi (Split 60% Affiliate / 40% Sales)'
                    : 'Sales Personal (100% Basis Sales)'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#718391]">Catatan</dt>
                <dd className="mt-0.5 text-[#526675]">{selectedLead.notes}</dd>
              </div>
            </dl>
          )}

          {detailTab === 'aktivitas' && (
            <div className="space-y-3">
              {selectedLead.activities.map((a) => (
                <div
                  key={a.id}
                  className="rounded-[10px] border border-[#EAF2F6] bg-[#F5F8FA] p-3"
                >
                  <div className="flex items-center justify-between text-[11px] text-[#718391]">
                    <span>{a.actor}</span>
                    <span>{a.time}</span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-[#172B3A]">
                    {a.action}
                  </p>
                </div>
              ))}
            </div>
          )}

          {detailTab === 'order' && (
            <div className="space-y-3 text-sm text-[#526675]">
              <p className="font-semibold text-[#17324D]">
                Tahapan Siklus Order Provider (ISP)
              </p>
              <div className="space-y-2 text-xs">
                {[
                  { key: 'lead_created', label: '1. Lead Terdaftar & Terverifikasi' },
                  { key: 'qualified', label: '2. Kualifikasi & Pengecekan Cakupan ODP' },
                  { key: 'order_submitted', label: '3. Order Dikirim ke Provider Validation' },
                  { key: 'installation', label: '4. Penugasan & Instalasi Teknisi FTTH' },
                  { key: 'activated', label: '5. Aktivasi Selesai & Komisi Eligible' },
                ].map((stage, idx) => {
                  const isDone =
                    selectedLead.status === 'Aktivasi · Selesai' ||
                    (selectedLead.status.includes('Order') && idx <= 3) ||
                    (selectedLead.status === 'Follow Up' && idx <= 1) ||
                    idx === 0;
                  return (
                    <div
                      key={stage.key}
                      className={`flex items-center justify-between rounded-[10px] border px-3 py-2 ${
                        isDone
                          ? 'border-[#247A55]/30 bg-emerald-50 text-[#17324D]'
                          : 'border-[#EAF2F6] bg-[#F5F8FA] text-[#718391]'
                      }`}
                    >
                      <span className="font-medium">{stage.label}</span>
                      <span className="font-bold">
                        {isDone ? 'Terpenuhi' : 'Menunggu'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setNextStatus(selectedLead.status);
              setShowStatusModal(true);
            }}
            className="h-11 rounded-[10px] bg-[#0284C7] text-sm font-semibold text-white hover:bg-[#0369A1]"
          >
            Ubah Status
          </button>
          <button
            type="button"
            onClick={() => setShowActivityModal(true)}
            className="h-11 rounded-[10px] border border-[#0284C7] bg-white text-sm font-semibold text-[#0284C7] hover:bg-[#E6F4F9]"
          >
            Tambah Aktivitas
          </button>
        </div>

        {/* Ubah Status Modal */}
        {showStatusModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B3A]/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-[14px] border border-[#D8E3E9] bg-white p-6 shadow-xl">
              <h3 className="text-base font-bold text-[#17324D]">
                Perbarui Status Lead
              </h3>
              <select
                value={nextStatus}
                onChange={(e) =>
                  setNextStatus(e.target.value as SalesLifecycleStatus)
                }
                className="mt-4 h-11 w-full rounded-[10px] border border-[#B8C9D3] bg-white px-3 text-sm text-[#172B3A]"
              >
                <option value="Prospek">Prospek</option>
                <option value="Follow Up">Follow Up</option>
                <option value="Order · Proses Instalasi">
                  Order · Proses Instalasi
                </option>
                <option value="Aktivasi · Selesai">Aktivasi · Selesai</option>
              </select>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="rounded-[10px] border border-[#B8C9D3] px-4 py-2 text-xs font-semibold text-[#17324D]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateLeadStatus(selectedLead.id, nextStatus);
                    setShowStatusModal(false);
                  }}
                  className="rounded-[10px] bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white"
                >
                  Simpan Status
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tambah Aktivitas Modal */}
        {showActivityModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B3A]/50 p-4 backdrop-blur-xs">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!activityNote.trim()) return;
                onAddLeadActivity(selectedLead.id, activityNote.trim());
                setActivityNote('');
                setShowActivityModal(false);
                setDetailTab('aktivitas');
              }}
              className="w-full max-w-sm rounded-[14px] border border-[#D8E3E9] bg-white p-6 shadow-xl"
            >
              <h3 className="text-base font-bold text-[#17324D]">
                Catat Aktivitas Tindak Lanjut
              </h3>
              <textarea
                rows={3}
                required
                placeholder="Contoh: Pelanggan setuju pemasangan hari Jumat pukul 10:00..."
                value={activityNote}
                onChange={(e) => setActivityNote(e.target.value)}
                className="mt-3 w-full rounded-[10px] border border-[#B8C9D3] p-3 text-sm text-[#172B3A]"
              />
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowActivityModal(false)}
                  className="rounded-[10px] border border-[#B8C9D3] px-4 py-2 text-xs font-semibold text-[#17324D]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-[10px] bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white"
                >
                  Simpan Aktivitas
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-[#17324D]">
          {isAffiliate ? 'Lead & Prospek Saya' : 'Lead & Penjualan'}
        </h1>
        <button
          type="button"
          onClick={() => setShowAddLead(true)}
          className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0369A1]"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Lead</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="grid grid-cols-4 rounded-[10px] border border-[#D8E3E9] bg-white p-1">
        {['Semua', 'Prospek', 'Order', 'Aktivasi'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`rounded-[8px] py-2 text-xs font-semibold transition ${
              filter === tab
                ? 'bg-[#0284C7] text-white'
                : 'text-[#526675] hover:text-[#17324D]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#718391]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari pelanggan / lead..."
            className="h-11 w-full rounded-[10px] border border-[#D8E3E9] bg-white pl-10 pr-4 text-sm text-[#172B3A] focus:border-[#0284C7] focus:outline-none"
          />
        </div>
        {!isAffiliate && (
          <button
            type="button"
            onClick={() => setShowSourceFilter((v) => !v)}
            className={`flex h-11 items-center gap-1.5 rounded-[10px] border px-3.5 text-xs font-semibold transition ${
              showSourceFilter || sourceFilter !== 'semua'
                ? 'border-[#0284C7] bg-[#E6F4F9] text-[#0284C7]'
                : 'border-[#D8E3E9] bg-white text-[#17324D]'
            }`}
            aria-label="Filter Sumber Lead"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filter</span>
          </button>
        )}
      </div>

      {!isAffiliate && showSourceFilter && (
        <div className="flex flex-wrap items-center gap-2 rounded-[10px] border border-[#D8E3E9] bg-white px-3.5 py-2.5 text-xs">
          <span className="font-semibold text-[#526675]">Sumber Lead:</span>
          {(
            [
              { id: 'semua', label: 'Semua Sumber' },
              { id: 'sales_personal', label: 'Lead Pribadi Sales' },
              { id: 'affiliate', label: 'Lead Tim Affiliate' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSourceFilter(opt.id)}
              className={`rounded-[7px] px-2.5 py-1 font-semibold ${
                sourceFilter === opt.id
                  ? 'bg-[#17324D] text-white'
                  : 'bg-[#F5F8FA] text-[#526675] hover:text-[#17324D]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {filteredLeads.map((lead) => (
          <button
            key={lead.id}
            type="button"
            onClick={() => setSelectedLeadId(lead.id)}
            className="flex w-full items-center justify-between gap-4 rounded-[14px] border border-[#D8E3E9] bg-white p-4 text-left transition hover:border-[#87CEEB]"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E6F4F9] text-xs font-bold text-[#17324D]">
                {lead.name
                  .split(' ')
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join('')}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#17324D]">
                  {lead.name}
                </p>
                <p className="text-xs text-[#526675]">
                  {lead.product} · {lead.status}
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-[#718391]" />
          </button>
        ))}
      </div>

      {/* Tambah Lead Modal */}
      {showAddLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B3A]/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onAddLead({
                name: newName,
                phone: newPhone,
                email: newEmail || 'pelanggan@contoh.id',
                product: newProduct,
                address: newAddress,
                status: 'Prospek',
                lifecycleKey: 'lead_created',
                notes: newNotes || 'Prospek baru dari portal workforce',
                attributionType: isAffiliate ? 'affiliate' : 'sales_personal',
              });
              setNewName('');
              setNewPhone('');
              setNewEmail('');
              setNewAddress('');
              setNewNotes('');
              setShowAddLead(false);
            }}
            className="w-full max-w-md rounded-[14px] border border-[#D8E3E9] bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-[#EAF2F6] pb-3">
              <h3 className="text-base font-bold text-[#17324D]">
                Tambah Lead Pelanggan Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowAddLead(false)}
                className="rounded-lg p-1 text-[#526675] hover:bg-[#EAF2F6]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                  Nama Pelanggan *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Hendra Wijaya"
                  className="h-10 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                    Nomor HP *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="0812 xxxx xxxx"
                    className="h-10 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="nama@email.id"
                    className="h-10 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                  Paket Produk ISP
                </label>
                <select
                  value={newProduct}
                  onChange={(e) => setNewProduct(e.target.value)}
                  className="h-10 w-full rounded-[10px] border border-[#B8C9D3] bg-white px-3 text-sm"
                >
                  <option>FTTH 100 Mbps</option>
                  <option>FTTH 200 Mbps</option>
                  <option>FWA 50 Mbps</option>
                  <option>PXGY Enterprise</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                  Alamat Pemasangan *
                </label>
                <input
                  type="text"
                  required
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Jl. Melati No. 12, Jakarta Selatan"
                  className="h-10 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                  Catatan
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Minat pemasangan akhir pekan"
                  className="h-10 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-sm"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddLead(false)}
                className="rounded-[10px] border border-[#B8C9D3] px-4 py-2 text-xs font-semibold text-[#17324D]"
              >
                Batal
              </button>
              <button
                type="submit"
                className="rounded-[10px] bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0369A1]"
              >
                Simpan Lead
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// --- 4. TIM AFFILIATE & REKRUT AFFILIATE (Screens 11 & 12) ---
export function AffiliateTeamAndRecruitView({
  affiliates,
  onAddAffiliate,
  onApproveAffiliate,
  initialSubView = 'team',
}: {
  affiliates: AffiliateMember[];
  onAddAffiliate: (m: Omit<AffiliateMember, 'id' | 'orders' | 'commissionTotal' | 'joinedDate'>) => void;
  onApproveAffiliate: (id: string) => void;
  initialSubView?: 'team' | 'recruit';
}) {
  const { openSendEmailModal } = useWorkspace();
  const [view, setView] = useState<'team' | 'recruit'>(initialSubView);
  const [showAllTeam, setShowAllTeam] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Manual Register Form
  const [affName, setAffName] = useState('');
  const [affPhone, setAffPhone] = useState('');
  const [affEmail, setAffEmail] = useState('');

  const activeCount = affiliates.filter((a) => a.status === 'Aktif').length;
  const pendingCount = affiliates.filter((a) => a.status === 'Pending Verifikasi').length;
  const referralUrl = 'https://agentzy.id/join/AGT-RAKA-2026';

  if (view === 'recruit') {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => setView('team')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0284C7] hover:underline"
        >
          <span>← Kembali ke Tim Affiliate</span>
        </button>

        <div className="rounded-[16px] border border-[#D8E3E9] bg-white p-6">
          <div className="mx-auto max-w-lg text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E6F4F9] text-[#0284C7]">
              <UserPlus className="h-8 w-8" />
            </div>
            <h1 className="mt-4 text-xl font-bold text-[#17324D]">
              Ajak &amp; Rekrut Affiliate Freelance
            </h1>
            <p className="mt-1.5 text-sm text-[#526675]">
              Bangun tim penjualanmu sendiri dan dapatkan atribusi produktivitas
              dari setiap aktivasi tim affiliate Anda.
            </p>
          </div>

          <div className="mx-auto mt-6 max-w-lg space-y-3 rounded-[14px] border border-[#EAF2F6] bg-[#F5F8FA] p-5 text-sm">
            {[
              'Dapatkan 40% porsi produktivitas inkremental dari aktivasi affiliate Anda (60% untuk Affiliate)',
              'Tier SA Sales Resmi dihitung dari gabungan produktivitas personal + affiliate',
              'Proses pendaftaran cepat, verifikasi identitas & persetujuan perjanjian digital',
              'Pantau performa dan atribusi setiap affiliate secara real-time',
            ].map((b) => (
              <div key={b} className="flex items-start gap-2.5 text-[#172B3A]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#247A55]" />
                <span className="text-xs leading-relaxed sm:text-sm">{b}</span>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-6 flex max-w-lg flex-col gap-3">
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="h-11 w-full rounded-[10px] bg-[#0284C7] text-sm font-semibold text-white hover:bg-[#0369A1]"
            >
              + Bagikan Link Rekrut
            </button>
            <button
              type="button"
              onClick={() => setShowManualModal(true)}
              className="h-11 w-full rounded-[10px] border border-[#0284C7] bg-white text-sm font-semibold text-[#0284C7] hover:bg-[#E6F4F9]"
            >
              Daftarkan Manual
            </button>
          </div>
        </div>

        {/* Share Link & QR Modal */}
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B3A]/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-[14px] border border-[#D8E3E9] bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#17324D]">
                  Bagikan Link Rekrut Affiliate
                </h3>
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="rounded-lg p-1 text-[#526675] hover:bg-[#EAF2F6]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 flex flex-col items-center rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-5 text-center">
                <QrCode className="h-24 w-24 text-[#17324D]" />
                <p className="mt-2 font-mono-tabular text-xs font-bold text-[#0284C7]">
                  Kode Referral: AGT-RAKA-2026
                </p>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <input
                  readOnly
                  value={referralUrl}
                  className="h-10 flex-1 rounded-[10px] border border-[#B8C9D3] bg-[#F5F8FA] px-3 font-mono-tabular text-xs text-[#172B3A]"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(referralUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#17324D] px-3.5 text-xs font-semibold text-white"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowShareModal(false);
                  openSendEmailModal({
                    to: '',
                    subject: 'Undangan Bergabung Menjadi Affiliate Freelance Agentzy',
                    body: `Halo,\n\nAnda diundang untuk bergabung sebagai mitra Affiliate Freelance Agentzy di bawah tim Raka Pratama.\n\nDaftar melalui tautan berikut:\n${referralUrl}\n\nKode Referral: AGT-RAKA-2026`,
                    contextLabel: 'Kirim undangan rekrutmen affiliate melalui Gmail.',
                  });
                }}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-[10px] border border-[#B8C9D3] py-2.5 text-xs font-semibold text-[#17324D] hover:bg-[#F5F8FA]"
              >
                <Mail className="h-4 w-4 text-[#0284C7]" />
                <span>Kirim Undangan via Gmail</span>
              </button>
            </div>
          </div>
        )}

        {/* Daftarkan Manual Modal */}
        {showManualModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B3A]/50 p-4 backdrop-blur-xs">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onAddAffiliate({
                  name: affName,
                  phone: affPhone,
                  email: affEmail,
                  code: `AGT-${affName.slice(0, 4).toUpperCase()}-${Math.floor(10 + Math.random() * 89)}`,
                  status: 'Pending Verifikasi',
                });
                setAffName('');
                setAffPhone('');
                setAffEmail('');
                setShowManualModal(false);
                setView('team');
              }}
              className="w-full max-w-md rounded-[14px] border border-[#D8E3E9] bg-white p-6 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-[#EAF2F6] pb-3">
                <h3 className="text-base font-bold text-[#17324D]">
                  Daftarkan Affiliate Baru
                </h3>
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="rounded-lg p-1 text-[#526675] hover:bg-[#EAF2F6]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                    Nama Lengkap Calon Affiliate *
                  </label>
                  <input
                    type="text"
                    required
                    value={affName}
                    onChange={(e) => setAffName(e.target.value)}
                    placeholder="Contoh: Reza Fahlevi"
                    className="h-10 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                    Nomor WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={affPhone}
                    onChange={(e) => setAffPhone(e.target.value)}
                    placeholder="0812 xxxx xxxx"
                    className="h-10 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={affEmail}
                    onChange={(e) => setAffEmail(e.target.value)}
                    placeholder="reza@contoh.id"
                    className="h-10 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-sm"
                  />
                </div>
                <p className="rounded-[10px] bg-[#E6F4F9] p-3 text-xs text-[#245477]">
                  Setelah didaftarkan, calon affiliate masuk antrean{' '}
                  <strong>Pending Verifikasi</strong> untuk pemeriksaan identitas
                  &amp; persetujuan perjanjian sebelum aktif.
                </p>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="rounded-[10px] border border-[#B8C9D3] px-4 py-2 text-xs font-semibold text-[#17324D]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-[10px] bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white"
                >
                  Daftarkan Affiliate
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  const topPerformers = affiliates.filter((a) => a.status === 'Aktif').slice(0, 3);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-[#17324D]">Tim Affiliate</h1>
        <button
          type="button"
          onClick={() => setView('recruit')}
          className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0369A1]"
        >
          <UserPlus className="h-4 w-4" />
          <span>+ Rekrut Affiliate Baru</span>
        </button>
      </div>

      {/* 3 Stats Cards (Screen 11) */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 text-center">
          <p className="font-mono-tabular text-2xl font-bold text-[#17324D]">
            {affiliates.length}
          </p>
          <p className="mt-0.5 text-xs text-[#526675]">Total Affiliate</p>
        </div>
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 text-center">
          <p className="font-mono-tabular text-2xl font-bold text-[#247A55]">
            {activeCount}
          </p>
          <p className="mt-0.5 text-xs text-[#526675]">Aktif</p>
        </div>
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 text-center">
          <p className="font-mono-tabular text-2xl font-bold text-[#A96816]">
            {pendingCount}
          </p>
          <p className="mt-0.5 text-xs text-[#526675]">Pending</p>
        </div>
      </div>

      {/* Top Performer Affiliate */}
      <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#17324D]">Top Performer</h2>
          <button
            type="button"
            onClick={() => setShowAllTeam(!showAllTeam)}
            className="text-xs font-semibold text-[#0284C7] hover:underline"
          >
            {showAllTeam ? 'Ringkas' : 'Lihat Semua Tim'}
          </button>
        </div>

        <div className="mt-3 divide-y divide-[#EAF2F6]">
          {(showAllTeam ? affiliates : topPerformers).map((aff, index) => (
            <div
              key={aff.id}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E6F4F9] text-xs font-bold text-[#17324D]">
                  {aff.name
                    .split(' ')
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join('')}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#17324D]">{aff.name}</p>
                  <p className="font-mono-tabular text-xs text-[#526675]">
                    {aff.orders} order · {formatIDR(aff.commissionTotal)} ·{' '}
                    <span
                      className={
                        aff.status === 'Aktif'
                          ? 'text-[#247A55]'
                          : 'text-[#A96816]'
                      }
                    >
                      {aff.status}
                    </span>
                  </p>
                </div>
              </div>

              {aff.status === 'Pending Verifikasi' ? (
                <button
                  type="button"
                  onClick={() => onApproveAffiliate(aff.id)}
                  className="rounded-[8px] bg-[#0284C7] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0369A1]"
                >
                  Ajukan Aktivasi
                </button>
              ) : (
                <span className="font-mono-tabular text-xs font-bold text-[#A96816]">
                  #{aff.rank || index + 1}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- 5. KOMISI & PENGHASILAN + SIMULASI KOMISI (Screens 13 & 14) ---
export function CommissionAndSimulatorView({
  roleMode = 'sales',
  initialSubTab = 'rincian',
  placedSchema,
  allCorpSchemas,
  onChangePlacedCorporateId,
}: {
  roleMode?: WorkforceRoleMode;
  initialSubTab?: 'rincian' | 'riwayat' | 'simulasi';
  placedSchema?: CorporateCompensationSchema;
  allCorpSchemas?: CorporateCompensationSchema[];
  onChangePlacedCorporateId?: (id: string) => void;
}) {
  const isAffiliate = roleMode === 'affiliate';
  const [subTab, setSubTab] = useState<'rincian' | 'riwayat' | 'simulasi'>(
    initialSubTab
  );
  const [hideAmount, setHideAmount] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawDone, setWithdrawDone] = useState(false);
  const [bankAccount, setBankAccount] = useState(
    isAffiliate
      ? 'Mandiri · 13000918274 (Siti Nabila)'
      : 'BCA · 8840192831 (Raka Pratama)'
  );

  const schemasList =
    allCorpSchemas && allCorpSchemas.length > 0
      ? allCorpSchemas
      : INITIAL_CORPORATE_COMPENSATION_SCHEMAS;
  const activeSchema = placedSchema || schemasList[0];

  // Sales Simulator State (linked to Corporate Placement)
  const [salesGrade, setSalesGrade] = useState<SalesGradeKey>('Pro');
  const [personalSA, setPersonalSA] = useState(24);
  const [affiliateSA, setAffiliateSA] = useState(10);

  // Affiliate Simulator State
  const [affOrders, setAffOrders] = useState(8);
  const [affPackageRate, setAffPackageRate] = useState(activeSchema.salesConfig.productRates.ftthIdr);

  // Monthly deterministic payroll for current placement (24 Personal SA + 10 Affiliate SA, Grade Pro)
  const currentPayroll = calculateCorporateSalesAffiliatePayroll({
    schema: activeSchema,
    grade: 'Pro',
    personalSA: 24,
    affiliateSA: 10,
  });

  // Live Simulator payroll calculation
  const simPayroll = calculateCorporateSalesAffiliatePayroll({
    schema: activeSchema,
    grade: salesGrade,
    personalSA,
    affiliateSA,
  });

  const affSplit = activeSchema.salesConfig.affiliateSplitPct;
  const salesSplit = activeSchema.salesConfig.salesIncrementalSplitPct;
  const affiliatePersonalEst = Math.round(
    affOrders * (affPackageRate || activeSchema.salesConfig.affiliateFeePerSAIdr) * (affSplit / 100)
  );
  const totalDisplay = isAffiliate
    ? formatIDR(currentPayroll.affiliatePayoutIdr)
    : formatIDR(currentPayroll.salesTotalTakeHomeIdr);

  const rincianRows = isAffiliate
    ? [
        {
          label: `Komisi Prospek Teraktivasi (${currentPayroll.affiliateShareSA} SA · Porsi ${affSplit}% ${activeSchema.corporateName})`,
          val: formatIDR(currentPayroll.affiliatePayoutIdr),
        },
        {
          label: `Rate Fee Affiliate per SA (${activeSchema.contractNumber})`,
          val: formatIDR(activeSchema.salesConfig.affiliateFeePerSAIdr),
        },
        {
          label: 'Skema Split Penempatan Vendor',
          val: `${affSplit}% Affiliate / ${salesSplit}% Staff Sales`,
        },
      ]
    : [
        {
          label: `Gaji Pokok Staff Sales (${activeSchema.contractNumber})`,
          val: formatIDR(currentPayroll.baseSalaryIdr),
        },
        {
          label: 'Tunjangan Operasional Penempatan',
          val: formatIDR(currentPayroll.operationalAllowanceIdr),
        },
        {
          label: `Komisi SA Pribadi + ${salesSplit}% Inkremental (${currentPayroll.salesAttributedTotalSA} SA × ${formatIDR(currentPayroll.matchedTier.feePerSA)})`,
          val: formatIDR(currentPayroll.salesCommissionIdr),
        },
        {
          label: 'Bonus Grade Sales Agentzy Pro',
          val: formatIDR(currentPayroll.gradeBonusIdr),
        },
        {
          label: `Bonus Tier (${currentPayroll.matchedTier.label})`,
          val: formatIDR(currentPayroll.tierBonusIdr),
        },
      ];

  const riwayatRows = isAffiliate
    ? [
        {
          period: 'Oktober 2025',
          rule: `Skema Affiliate ${affSplit}% (${activeSchema.corporateName})`,
          net: 'Rp 2.150.000',
          status: 'Dibayarkan · 05 Nov 2025',
        },
        {
          period: 'September 2025',
          rule: `Skema Affiliate ${affSplit}% (${activeSchema.corporateName})`,
          net: 'Rp 1.800.000',
          status: 'Dibayarkan · 05 Okt 2025',
        },
        {
          period: 'Agustus 2025',
          rule: `Skema Affiliate ${affSplit}% (${activeSchema.corporateName})`,
          net: 'Rp 1.450.000',
          status: 'Dibayarkan · 05 Sep 2025',
        },
      ]
    : [
        {
          period: 'Oktober 2025',
          rule: `${activeSchema.contractNumber} (Sales Pro · Split ${affSplit}/${salesSplit})`,
          net: 'Rp 9.720.000',
          status: 'Dibayarkan · 05 Nov 2025',
        },
        {
          period: 'September 2025',
          rule: `${activeSchema.contractNumber} (Sales Pro · Split ${affSplit}/${salesSplit})`,
          net: 'Rp 8.940.000',
          status: 'Dibayarkan · 05 Okt 2025',
        },
        {
          period: 'Agustus 2025',
          rule: `${activeSchema.contractNumber} (Sales OJT)`,
          net: 'Rp 6.450.000',
          status: 'Dibayarkan · 05 Sep 2025',
        },
      ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#17324D]">
            Gaji, Komisi &amp; Bagi Hasil Corporate
          </h1>
          <p className="text-xs text-[#526675]">
            Penempatan aktif: <strong className="text-[#17324D]">{activeSchema.corporateName}</strong> ({activeSchema.contractNumber}) · Split {affSplit}% Affiliate / {salesSplit}% Staff Sales
          </p>
        </div>

        {onChangePlacedCorporateId && (
          <div className="flex items-center gap-1.5 rounded-[10px] border border-[#D8E3E9] bg-white px-3 py-2">
            <Building2 className="h-4 w-4 text-[#0284C7]" />
            <select
              value={activeSchema.id}
              onChange={(e) => onChangePlacedCorporateId(e.target.value)}
              aria-label="Pilih Penempatan Corporate"
              className="bg-transparent text-xs font-semibold text-[#17324D] outline-none"
            >
              {schemasList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.corporateName} · {s.contractNumber} ({s.salesConfig.affiliateSplitPct}/{s.salesConfig.salesIncrementalSplitPct})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Total Earnings Header Card (Screen 13) */}
      <div className="rounded-[14px] border border-[#D8E3E9] bg-[#E6F4F9] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#526675]">
              {isAffiliate
                ? `Total Komisi Affiliate Bulan Ini (Porsi ${affSplit}% · ${activeSchema.corporateName})`
                : `Total Take-Home Pay Sales Bulan Ini (${activeSchema.corporateName})`}
            </p>
            <p className="mt-1 font-mono-tabular text-2xl font-bold text-[#17324D] sm:text-3xl">
              {hideAmount ? 'Rp •••••••••' : totalDisplay}
            </p>
            <p className="mt-1 text-xs font-semibold text-[#247A55]">
              {isAffiliate
                ? `Atribusi ${currentPayroll.affiliateShareSA} SA dari ${currentPayroll.affiliateSA} SA · Kontrak ${activeSchema.contractNumber}`
                : `Gaji Pokok ${formatIDR(currentPayroll.baseSalaryIdr)} + Komisi & Bonus ${formatIDR(currentPayroll.salesTotalTakeHomeIdr - currentPayroll.baseSalaryIdr)}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setHideAmount(!hideAmount)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#17324D] shadow-xs"
            aria-label="Sembunyikan atau tampilkan nominal"
          >
            {hideAmount ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Sub Tabs: Rincian | Riwayat | Simulasi */}
      <div className="grid grid-cols-3 rounded-[10px] border border-[#D8E3E9] bg-white p-1">
        {(
          [
            { id: 'rincian', label: 'Rincian' },
            { id: 'riwayat', label: 'Riwayat' },
            { id: 'simulasi', label: 'Simulasi' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSubTab(t.id)}
            className={`rounded-[8px] py-2 text-xs font-semibold transition ${
              subTab === t.id
                ? 'bg-[#0284C7] text-white'
                : 'text-[#526675] hover:text-[#17324D]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'rincian' && (
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
          <h2 className="text-sm font-bold text-[#17324D]">
            Rincian Bulan Ini ({activeSchema.corporateName})
          </h2>
          <div className="mt-4 divide-y divide-[#EAF2F6] text-sm">
            {rincianRows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-4 py-3 text-xs sm:text-sm"
              >
                <span className="text-[#526675]">{row.label}</span>
                <span className="font-mono-tabular font-semibold text-[#172B3A]">
                  {hideAmount ? 'Rp ••••••' : row.val}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between rounded-[10px] bg-emerald-50 px-4 py-3 text-sm font-bold text-[#17324D]">
            <span>Total Penghasilan</span>
            <span className="font-mono-tabular text-[#247A55]">
              {hideAmount ? 'Rp •••••••' : totalDisplay}
            </span>
          </div>

          {!isAffiliate && (
            <div className="mt-3 flex items-center justify-between rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] px-4 py-2.5 text-xs">
              <span className="text-[#526675]">
                Porsi Affiliate Terkait ({affSplit}% × {currentPayroll.affiliateSA} SA)
              </span>
              <span className="font-mono-tabular font-bold text-[#0284C7]">
                {hideAmount ? 'Rp ••••••' : formatIDR(currentPayroll.affiliatePayoutIdr)}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setWithdrawDone(false);
              setShowWithdrawModal(true);
            }}
            className="mt-4 h-11 w-full rounded-[10px] bg-[#0284C7] text-sm font-semibold text-white hover:bg-[#0369A1]"
          >
            Tarik Penghasilan
          </button>
        </div>
      )}

      {subTab === 'riwayat' && (
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
          <h2 className="text-sm font-bold text-[#17324D]">
            Riwayat Statement &amp; Pencairan (Ledger)
          </h2>
          <div className="mt-4 divide-y divide-[#EAF2F6] text-sm">
            {riwayatRows.map((st) => (
              <div
                key={st.period}
                className="flex flex-wrap items-center justify-between gap-2 py-3.5"
              >
                <div>
                  <p className="font-bold text-[#17324D]">{st.period}</p>
                  <p className="text-xs text-[#526675]">
                    {st.rule} · {st.status}
                  </p>
                </div>
                <span className="font-mono-tabular font-bold text-[#247A55]">
                  {st.net}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'simulasi' && isAffiliate && (
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 space-y-4">
          <div>
            <h2 className="text-base font-bold text-[#17324D]">
              Simulasi Komisi Affiliate ({affSplit}% · {activeSchema.corporateName})
            </h2>
            <p className="text-xs text-[#526675]">
              Hitung estimasi pendapatan dari prospek pelanggan ISP yang berhasil teraktivasi sesuai kontrak penempatan Sales Sponsor Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                Jumlah Aktivasi Pelanggan
              </label>
              <input
                type="number"
                min={0}
                value={affOrders}
                onChange={(e) => setAffOrders(Math.max(0, Number(e.target.value)))}
                className="h-11 w-full rounded-[10px] border border-[#B8C9D3] px-3 font-mono-tabular text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                Kategori Paket ISP ({activeSchema.corporateName})
              </label>
              <select
                value={affPackageRate}
                onChange={(e) => setAffPackageRate(Number(e.target.value))}
                className="h-11 w-full rounded-[10px] border border-[#B8C9D3] bg-white px-3 text-sm"
              >
                <option value={activeSchema.salesConfig.productRates.fwaIdr}>
                  FWA Wireless ({formatIDR(activeSchema.salesConfig.productRates.fwaIdr)})
                </option>
                <option value={activeSchema.salesConfig.productRates.ftthIdr}>
                  FTTH Fiber ({formatIDR(activeSchema.salesConfig.productRates.ftthIdr)})
                </option>
                <option value={activeSchema.salesConfig.productRates.pxgyIdr}>
                  PXGY Enterprise ({formatIDR(activeSchema.salesConfig.productRates.pxgyIdr)})
                </option>
              </select>
            </div>
          </div>

          <div className="rounded-[12px] border border-[#ADD8E6] bg-[#E6F4F9] p-4 space-y-2.5 text-sm">
            <p className="font-bold text-[#17324D]">
              Estimasi Komisi Affiliate Freelance ({activeSchema.contractNumber})
            </p>
            <div className="flex justify-between text-xs">
              <span className="text-[#526675]">Total Aktivasi Prospek</span>
              <span className="font-mono-tabular font-bold text-[#17324D]">
                {affOrders} aktivasi
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#526675]">Porsi Pembagian Affiliate</span>
              <span className="font-mono-tabular font-bold text-[#17324D]">
                {affSplit}% Affiliate / {salesSplit}% Staff Sales
              </span>
            </div>
            <div className="border-t border-[#B8C9D3] pt-2.5 flex justify-between text-sm font-bold text-[#247A55]">
              <span>Estimasi Penghasilan Anda</span>
              <span className="font-mono-tabular">
                {formatIDR(affiliatePersonalEst)}
              </span>
            </div>
          </div>
        </div>
      )}

      {subTab === 'simulasi' && !isAffiliate && (
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#17324D]">
                Simulasi Gaji, Tier &amp; Pembagian SA ({affSplit}/{salesSplit})
              </h2>
              <p className="text-xs text-[#526675]">
                Otomatis mengikuti skema kontrak penempatan vendor <strong className="text-[#17324D]">{activeSchema.corporateName}</strong> ({activeSchema.contractNumber})
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {onChangePlacedCorporateId && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                  Penempatan Vendor Corporate
                </label>
                <select
                  value={activeSchema.id}
                  onChange={(e) => onChangePlacedCorporateId(e.target.value)}
                  className="h-11 w-full rounded-[10px] border border-[#B8C9D3] bg-white px-3 text-sm"
                >
                  {schemasList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.corporateName} ({s.salesConfig.affiliateSplitPct}/{s.salesConfig.salesIncrementalSplitPct})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                Tingkatan Sales Agentzy
              </label>
              <select
                value={salesGrade}
                onChange={(e) => setSalesGrade(e.target.value as SalesGradeKey)}
                className="h-11 w-full rounded-[10px] border border-[#B8C9D3] bg-white px-3 text-sm"
              >
                <option value="OJT">Sales Agentzy Training (OJT)</option>
                <option value="Pro">Sales Agentzy Pro</option>
                <option value="Elite">Sales Agentzy Elite</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                Produktivitas Pribadi (SA)
              </label>
              <input
                type="number"
                min={0}
                value={personalSA}
                onChange={(e) => setPersonalSA(Math.max(0, Number(e.target.value)))}
                className="h-11 w-full rounded-[10px] border border-[#B8C9D3] px-3 font-mono-tabular text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                Order Affiliate Inkremental (SA)
              </label>
              <input
                type="number"
                min={0}
                value={affiliateSA}
                onChange={(e) => setAffiliateSA(Math.max(0, Number(e.target.value)))}
                className="h-11 w-full rounded-[10px] border border-[#B8C9D3] px-3 font-mono-tabular text-sm"
              />
            </div>
          </div>

          <div className="rounded-[12px] border border-[#ADD8E6] bg-[#E6F4F9] p-4 space-y-2.5 text-sm">
            <p className="font-bold text-[#17324D]">
              Hasil Kalkulasi Otomatis ({simPayroll.corporateName} · {simPayroll.contractNumber})
            </p>
            <div className="flex justify-between text-xs">
              <span className="text-[#526675]">Combined SA (Penentu Bracket Tier)</span>
              <span className="font-mono-tabular font-bold text-[#17324D]">
                {simPayroll.combinedSA} SA · {simPayroll.matchedTier.label} ({formatIDR(simPayroll.matchedTier.feePerSA)}/SA)
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#526675]">
                Atribusi Staff Sales (Personal + {simPayroll.salesIncrementalSplitPct}% Inkremental)
              </span>
              <span className="font-mono-tabular font-bold text-[#17324D]">
                {simPayroll.salesAttributedTotalSA} SA ({simPayroll.personalSA} + {simPayroll.salesIncrementalSA})
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#526675]">
                Atribusi Affiliate ({simPayroll.affiliateSplitPct}% Inkremental)
              </span>
              <span className="font-mono-tabular font-bold text-[#17324D]">
                {simPayroll.affiliateShareSA} SA
              </span>
            </div>
            <div className="border-t border-[#B8C9D3] pt-2.5 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#526675]">Gaji Pokok + Tunjangan Operasional</span>
                <span className="font-mono-tabular font-semibold text-[#17324D]">
                  {formatIDR(simPayroll.baseSalaryIdr + simPayroll.operationalAllowanceIdr)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#526675]">Komisi SA + Bonus Grade + Bonus Tier</span>
                <span className="font-mono-tabular font-semibold text-[#17324D]">
                  {formatIDR(simPayroll.salesCommissionIdr + simPayroll.gradeBonusIdr + simPayroll.tierBonusIdr)}
                </span>
              </div>
              <div className="flex justify-between text-xs font-bold text-[#0284C7]">
                <span>Total Take-Home Pay Staff Sales</span>
                <span className="font-mono-tabular">
                  {formatIDR(simPayroll.salesTotalTakeHomeIdr)}
                </span>
              </div>
              <div className="flex justify-between text-xs font-bold text-[#17324D]">
                <span>Payout Mitra Affiliate ({simPayroll.affiliateSplitPct}%)</span>
                <span className="font-mono-tabular">
                  {formatIDR(simPayroll.affiliatePayoutIdr)}
                </span>
              </div>
              <div className="flex justify-between border-t border-[#B8C9D3] pt-1.5 text-sm font-bold text-[#247A55]">
                <span>Total Payout Gabungan (Sales + Affiliate)</span>
                <span className="font-mono-tabular">
                  {formatIDR(simPayroll.grossCombinedPayoutIdr)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] p-3 text-[11px] text-[#526675]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#0284C7]" />
            <span>
              Kalkulasi disinkronkan langsung dengan aturan kontrak {activeSchema.corporateName} dari Super Admin Control Plane. Mengubah rasio split atau gaji pokok di Super Admin otomatis memperbarui simulasi ini.
            </span>
          </div>
        </div>
      )}

      {/* Tarik Penghasilan Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B3A]/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[14px] border border-[#D8E3E9] bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#EAF2F6] pb-3">
              <h3 className="text-base font-bold text-[#17324D]">
                Ajukan Penarikan Penghasilan
              </h3>
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="rounded-lg p-1 text-[#526675] hover:bg-[#EAF2F6]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {withdrawDone ? (
              <div className="py-6 text-center space-y-3">
                <ShieldCheck className="mx-auto h-12 w-12 text-[#247A55]" />
                <p className="text-base font-bold text-[#17324D]">
                  Permintaan Pencairan Tercatat
                </p>
                <p className="text-xs text-[#526675]">
                  Permintaan batch payout sebesar{' '}
                  <strong className="font-mono-tabular">{totalDisplay}</strong> ke{' '}
                  <strong>{bankAccount}</strong> menunggu persetujuan Finance.
                </p>
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="w-full rounded-[10px] bg-[#17324D] py-2.5 text-sm font-semibold text-white"
                >
                  Selesai
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                    Rekening Tujuan Terverifikasi
                  </label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    className="h-10 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-sm"
                  />
                </div>
                <div className="rounded-[10px] bg-[#F5F8FA] p-3 text-xs text-[#526675]">
                  Nominal tersedia ({activeSchema.corporateName}):{' '}
                  <strong className="font-mono-tabular text-[#17324D]">{totalDisplay}</strong>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowWithdrawModal(false)}
                    className="rounded-[10px] border border-[#B8C9D3] px-4 py-2 text-xs font-semibold text-[#17324D]"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawDone(true)}
                    className="rounded-[10px] bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white"
                  >
                    Konfirmasi Penarikan
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
