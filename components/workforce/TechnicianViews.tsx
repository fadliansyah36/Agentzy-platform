'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import {
  Wrench,
  Search,
  ChevronRight,
  Phone,
  MessageSquare,
  Navigation,
  MapPin,
  Clock,
  CheckCircle2,
  Camera,
  Gauge,
  FileCheck,
  Package,
  Plus,
  X,
  Trash2,
  RotateCcw,
  Wallet,
  ShieldCheck,
  Target,
  Building2,
} from 'lucide-react';
import { TechnicianNavigationMap } from '@/components/maps/TechnicianNavigationMap';
import {
  formatIDR,
  type WorkOrderItem,
  type InventoryItem,
} from '@/lib/agentzy-data';
import {
  INITIAL_CORPORATE_COMPENSATION_SCHEMAS,
  INITIAL_TECH_BONUS_RULES,
  DEFAULT_TECH_TASK_COUNTS,
  calculateTechnicianCompensation,
  type CorporateCompensationSchema,
  type TechnicianBonusRule,
  type TechnicianTaskCounts,
  type TechnicianTaskCategory,
  type BonusPeriodType,
} from '@/lib/corporate-compensation';

// --- 1. BERANDA TEKNISI (Image 4 Screen 4) ---
export function TechnicianDashboardView({
  workOrders,
  onNavigate,
  onSelectWorkOrder,
  placedSchema,
  allCorpSchemas,
  onChangePlacedCorporateId,
  techBonusRules,
  techTaskCounts,
}: {
  workOrders: WorkOrderItem[];
  onNavigate: (tab: string) => void;
  onSelectWorkOrder: (wo: WorkOrderItem) => void;
  placedSchema?: CorporateCompensationSchema;
  allCorpSchemas?: CorporateCompensationSchema[];
  onChangePlacedCorporateId?: (id: string) => void;
  techBonusRules?: TechnicianBonusRule[];
  techTaskCounts?: TechnicianTaskCounts;
}) {
  const nearest = workOrders.find((w) => w.status !== 'Selesai') || workOrders[0];
  const pendingCount = workOrders.filter((w) => w.status === 'Pending').length;
  const processCount = workOrders.filter((w) => w.status === 'Proses').length;
  const doneCount = workOrders.filter((w) => w.status === 'Selesai').length;

  const activeSchema = placedSchema || INITIAL_CORPORATE_COMPENSATION_SCHEMAS[0];
  const schemasList = allCorpSchemas && allCorpSchemas.length > 0 ? allCorpSchemas : INITIAL_CORPORATE_COMPENSATION_SCHEMAS;
  const activeRules = techBonusRules || INITIAL_TECH_BONUS_RULES;
  const counts = techTaskCounts || DEFAULT_TECH_TASK_COUNTS;

  const comp = calculateTechnicianCompensation({
    schema: activeSchema,
    bonusRules: activeRules,
    completedCounts: counts,
    slaPct: 97,
  });

  const dailyBonuses = comp.bonusEvaluations.filter((b) => b.rule.period === 'Harian');
  const achievedCount = comp.bonusEvaluations.filter((b) => b.achieved).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#17324D] sm:text-2xl">
            Halo, Budi Santoso 👋
          </h1>
          <p className="text-xs text-[#526675] sm:text-sm">
            Teknisi FTTH/FWA · Penempatan: <strong className="text-[#17324D]">{activeSchema.corporateName}</strong> ({activeSchema.contractNumber})
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
                    {s.corporateName} · {s.contractNumber}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="rounded-[10px] border border-[#ADD8E6] bg-[#E6F4F9] px-3.5 py-2 text-xs font-semibold text-[#17324D]">
            Shift Hari Ini: <span className="text-[#247A55]">Aktif 08:00 – 17:00</span>
          </div>
        </div>
      </div>

      {/* Field Visual Banner */}
      <div className="relative overflow-hidden rounded-[14px] border border-[#D8E3E9] bg-white">
        <div className="grid grid-cols-1 items-center md:grid-cols-12">
          <div className="p-5 md:col-span-7">
            <p className="text-xs font-bold text-[#0284C7]">
              Portal Teknisi Lapangan · Kontrak {activeSchema.contractNumber}
            </p>
            <h2 className="mt-1 text-lg font-bold text-[#17324D]">
              Eksekusi Work Order, SOP Instalasi &amp; Target Bonus Teknisi
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-[#526675]">
              Selesaikan tugas Pemasangan, Maintenance, dan Survey sesuai SLA untuk membuka bonus target harian, mingguan, hingga bulanan di luar gaji pokok.
            </p>
          </div>
          <div className="relative h-36 w-full md:col-span-5 md:h-44">
            <Image
              src="/images/workforce_technician_field.jpg"
              alt="Teknisi FTTH memeriksa terminal optik lapangan"
              fill
              referrerPolicy="no-referrer"
              className="object-cover"
            />
          </div>
        </div>
      </div>

      {/* 4 KPI Cards (Screen 4) */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4">
          <p className="text-xs text-[#526675]">Tugas Aktif</p>
          <p className="mt-1.5 font-mono-tabular text-2xl font-bold text-[#17324D]">
            {pendingCount + processCount}
          </p>
        </div>
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4">
          <p className="text-xs text-[#526675]">Selesai Hari Ini / Total</p>
          <p className="mt-1.5 font-mono-tabular text-2xl font-bold text-[#247A55]">
            {doneCount}
          </p>
        </div>
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4">
          <p className="text-xs text-[#526675]">Gaji Pokok ({activeSchema.vendorCode})</p>
          <p className="mt-1.5 font-mono-tabular text-lg font-bold text-[#17324D]">
            {formatIDR(comp.baseSalaryIdr)}
          </p>
        </div>
        <div className="rounded-[14px] border border-[#ADD8E6] bg-[#E6F4F9] p-4">
          <p className="text-xs font-semibold text-[#526675]">Estimasi Take-Home Pay</p>
          <p className="mt-1.5 font-mono-tabular text-lg font-bold text-[#0284C7]">
            {formatIDR(comp.totalTakeHomePayIdr)}
          </p>
        </div>
      </div>

      {/* Target Bonus Harian · Mingguan · Bulanan Snapshot */}
      <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-[#17324D]">
              Target Bonus Harian Anda (Di Luar Gaji Pokok)
            </h3>
            <p className="text-xs text-[#526675]">
              {achievedCount} dari {comp.bonusEvaluations.length} target bonus (Harian/Mingguan/Bulanan) telah tercapai · SLA Aktual 97%
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('commission')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0284C7] hover:underline"
          >
            <span>Lihat Rincian Gaji &amp; Bonus</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {dailyBonuses.map((item) => (
            <div
              key={item.rule.id}
              className={`rounded-[12px] border p-3.5 ${
                item.achieved
                  ? 'border-[#247A55]/40 bg-emerald-50/60'
                  : 'border-[#D8E3E9] bg-[#F5F8FA]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#17324D]">
                  {item.rule.taskType} (Harian)
                </span>
                <span
                  className={`font-mono-tabular text-xs font-bold ${
                    item.achieved ? 'text-[#247A55]' : 'text-[#A96816]'
                  }`}
                >
                  {item.actualCount}/{item.rule.targetCount}
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white">
                <div
                  className={`h-full rounded-full transition-all ${
                    item.achieved ? 'bg-[#247A55]' : 'bg-[#0284C7]'
                  }`}
                  style={{ width: `${item.progressPct}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-[#526675]">
                  {item.achieved
                    ? 'Target Tercapai'
                    : `Kurang ${Math.max(0, item.rule.targetCount - item.actualCount)} tugas lagi`}
                </span>
                <span className="font-mono-tabular font-bold text-[#17324D]">
                  +{formatIDR(item.rule.bonusAmountIdr)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Work Order Terdekat (Screen 4) */}
      {nearest && (
        <div className="rounded-[14px] border border-[#87CEEB] bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#0284C7]">
              Work Order Terdekat · {nearest.id}
            </span>
            <span className="text-xs font-semibold text-[#B23A48]">
              {nearest.priority}
            </span>
          </div>
          <h3 className="mt-2 text-base font-bold text-[#17324D]">
            {nearest.type} — {nearest.customerName}
          </h3>
          <p className="mt-1 text-xs text-[#526675]">
            {nearest.distanceKm} km · {nearest.address} · {nearest.productPackage}
          </p>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => onSelectWorkOrder(nearest)}
              className="flex-1 rounded-[10px] bg-[#0284C7] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0369A1]"
            >
              Buka Work Order
            </button>
            <button
              type="button"
              onClick={() => onNavigate('workorders')}
              className="rounded-[10px] border border-[#B8C9D3] bg-white px-4 py-2.5 text-sm font-semibold text-[#17324D] hover:bg-[#F5F8FA]"
            >
              Lihat Semua Tugas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- 2. WORK ORDER & 7-STEP EXECUTION WIZARD (Screens 5-13) ---
const SOP_CHECKLIST_ITEMS = [
  'Cek ketersediaan material & ONT',
  'Survey jalur kabel & redaman ODP',
  'Pemasangan kabel FO dropcore',
  'Instalasi ONT / Modem pelanggan',
  'Konfigurasi perangkat & WiFi',
  'Uji koneksi & speedtest sesuai paket',
  'Kerapihan & keselamatan kerja (K3)',
];

export function WorkOrderWorkflowView({
  workOrders,
  selectedWoId,
  onSelectWoId,
  onCompleteWo,
  onQueueOfflineAction,
}: {
  workOrders: WorkOrderItem[];
  selectedWoId: string | null;
  onSelectWoId: (id: string | null) => void;
  onCompleteWo: (id: string) => void;
  onQueueOfflineAction: (label: string) => void;
}) {
  const [filter, setFilter] = useState<'Semua' | 'Pending' | 'Proses'>('Semua');
  const [query, setQuery] = useState('');
  const [subView, setSubView] = useState<'detail' | 'navigation' | 'execution'>('detail');
  const [execStep, setExecStep] = useState<number>(1); // 1..7

  // Execution state
  const [checkedInAt, setCheckedInAt] = useState<string | null>(null);
  const [sopChecked, setSopChecked] = useState<boolean[]>([
    true,
    true,
    true,
    false,
    false,
    false,
    false,
  ]);
  const [speedRunning, setSpeedRunning] = useState(false);
  const [speedResult, setSpeedResult] = useState({
    download: 102.4,
    upload: 96.8,
    ping: 12,
    jitter: 3,
  });
  const [photos, setPhotos] = useState<Record<string, string>>({
    sebelum: '/images/workforce_technician_field.jpg',
    proses: '/images/workforce_technician_field.jpg',
  });
  const [customerNameSign, setCustomerNameSign] = useState('Andi Pratama');
  const [customerConfirmChecked, setCustomerConfirmChecked] = useState(true);
  const [hasSignature, setHasSignature] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);

  const selectedWo = workOrders.find((w) => w.id === selectedWoId) || null;

  const filteredList = workOrders.filter((w) => {
    const matchTab =
      filter === 'Semua'
        ? w.status !== 'Selesai'
        : w.status === filter;
    const matchSearch =
      w.id.toLowerCase().includes(query.toLowerCase()) ||
      w.customerName.toLowerCase().includes(query.toLowerCase()) ||
      w.address.toLowerCase().includes(query.toLowerCase());
    return matchTab && matchSearch;
  });

  // Signature pad handlers
  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.strokeStyle = '#17324D';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    drawingRef.current = true;
    setHasSignature(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const endDraw = () => {
    drawingRef.current = false;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const runSpeedTest = () => {
    setSpeedRunning(true);
    setTimeout(() => {
      setSpeedResult({
        download: Number((98 + Math.random() * 10).toFixed(1)),
        upload: Number((91 + Math.random() * 9).toFixed(1)),
        ping: Math.floor(9 + Math.random() * 6),
        jitter: Math.floor(2 + Math.random() * 3),
      });
      setSpeedRunning(false);
    }, 900);
  };

  const handlePhotoUpload = (slot: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotos((prev) => ({ ...prev, [slot]: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  // --- VIEW: NAVIGASI LOKASI (Screen 7) ---
  if (selectedWo && subView === 'navigation') {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setSubView('detail')}
          className="text-xs font-semibold text-[#0284C7] hover:underline"
        >
          ← Kembali ke Detail {selectedWo.id}
        </button>

        <h1 className="text-xl font-bold text-[#17324D]">Navigasi ke Lokasi</h1>

        <TechnicianNavigationMap
          origin={{ lat: -6.2804, lng: 106.7924 }}
          destination={selectedWo.coordinates}
          destinationLabel={`${selectedWo.id} — ${selectedWo.customerName}`}
          destinationAddress={selectedWo.address}
          estimatedDistanceKm={selectedWo.distanceKm}
          estimatedMinutes={selectedWo.etaMinutes}
        />
      </div>
    );
  }

  // --- VIEW: 7-STEP EKSEKUSI PEKERJAAN (Screens 8-13) ---
  if (selectedWo && subView === 'execution') {
    const completedSop = sopChecked.filter(Boolean).length;

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setSubView('detail')}
            className="text-xs font-semibold text-[#0284C7] hover:underline"
          >
            ← Kembali ke Detail {selectedWo.id}
          </button>
          <span className="font-mono-tabular text-xs font-semibold text-[#526675]">
            Langkah {execStep} / 7
          </span>
        </div>

        {/* Stepper Pills */}
        <div className="overflow-x-auto pb-1">
          <div className="flex min-w-max items-center gap-1.5 rounded-[12px] border border-[#D8E3E9] bg-white p-1.5">
            {[
              { s: 1, label: '1. Check-in' },
              { s: 2, label: '2. Survey' },
              { s: 3, label: '3. Checklist SOP' },
              { s: 4, label: '4. Speedtest' },
              { s: 5, label: '5. Dokumentasi' },
              { s: 6, label: '6. Konfirmasi' },
              { s: 7, label: '7. Selesai' },
            ].map((item) => (
              <button
                key={item.s}
                type="button"
                onClick={() => setExecStep(item.s)}
                className={`rounded-[8px] px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                  execStep === item.s
                    ? 'bg-[#0284C7] text-white'
                    : execStep > item.s
                      ? 'bg-[#E6F4F9] text-[#17324D]'
                      : 'text-[#526675] hover:bg-[#F5F8FA]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Step 1: Check-in Lokasi */}
        {execStep === 1 && (
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-6 space-y-4">
            <h2 className="text-lg font-bold text-[#17324D]">
              1. Check-in Lokasi Kerja
            </h2>
            <div className="rounded-[12px] border border-[#ADD8E6] bg-[#E6F4F9] p-4 space-y-1.5 text-sm">
              <div className="flex items-center gap-2 font-semibold text-[#17324D]">
                <MapPin className="h-4 w-4 text-[#0284C7]" />
                <span>{selectedWo.address}</span>
              </div>
              <p className="font-mono-tabular text-xs text-[#526675]">
                Akurasi GPS Lapangan: 8 meter · Status: Dalam Radius Operasional
              </p>
            </div>
            {checkedInAt ? (
              <div className="flex items-center gap-2 rounded-[10px] bg-emerald-50 p-3 text-xs font-semibold text-[#247A55]">
                <CheckCircle2 className="h-4 w-4" />
                <span>Berhasil Check-in pada pukul {checkedInAt}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const now = new Date().toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  setCheckedInAt(now);
                  onQueueOfflineAction(`Check-in lokasi ${selectedWo.id} (${now})`);
                }}
                className="h-11 w-full rounded-[10px] bg-[#0284C7] text-sm font-semibold text-white hover:bg-[#0369A1]"
              >
                Konfirmasi Check-in Lokasi Sekarang
              </button>
            )}
          </div>
        )}

        {/* Step 2: Verifikasi & Survey */}
        {execStep === 2 && (
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-6 space-y-4">
            <h2 className="text-lg font-bold text-[#17324D]">
              2. Verifikasi &amp; Survey ODP
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                  Kode ODP Terdekat
                </label>
                <input
                  type="text"
                  defaultValue="ODP-JKS-CLD-042"
                  className="h-10 w-full rounded-[10px] border border-[#B8C9D3] px-3 font-mono-tabular text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                  Redaman Optik (dBm)
                </label>
                <input
                  type="text"
                  defaultValue="-18.4 dBm (Normal)"
                  className="h-10 w-full rounded-[10px] border border-[#B8C9D3] px-3 font-mono-tabular text-sm"
                />
              </div>
            </div>
            <p className="text-xs text-[#526675]">
              Pastikan jalur kabel FO aman dari hambatan dan jarak penarikan
              sesuai batas standar material.
            </p>
          </div>
        )}

        {/* Step 3: Checklist SOP Instalasi (Screen 9) */}
        {execStep === 3 && (
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#17324D]">
                3. Checklist SOP Instalasi FTTH
              </h2>
              <span className="font-mono-tabular text-xs font-bold text-[#0284C7]">
                Progress {completedSop}/{SOP_CHECKLIST_ITEMS.length}
              </span>
            </div>

            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#EAF2F6]">
              <div
                className="h-full rounded-full bg-[#0284C7] transition-all"
                style={{
                  width: `${(completedSop / SOP_CHECKLIST_ITEMS.length) * 100}%`,
                }}
              />
            </div>

            <div className="space-y-2.5">
              {SOP_CHECKLIST_ITEMS.map((item, idx) => (
                <label
                  key={item}
                  className="flex cursor-pointer items-center gap-3 rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] px-3.5 py-3 text-sm text-[#172B3A]"
                >
                  <input
                    type="checkbox"
                    checked={sopChecked[idx]}
                    onChange={() => {
                      const next = [...sopChecked];
                      next[idx] = !next[idx];
                      setSopChecked(next);
                    }}
                    className="h-4 w-4 rounded accent-[#247A55]"
                  />
                  <span className={sopChecked[idx] ? 'font-medium' : 'text-[#526675]'}>
                    {item}
                  </span>
                </label>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                onQueueOfflineAction(
                  `Simpan progress SOP ${selectedWo.id} (${completedSop}/7)`
                )
              }
              className="h-11 w-full rounded-[10px] bg-[#0284C7] text-sm font-semibold text-white hover:bg-[#0369A1]"
            >
              Simpan Progress
            </button>
          </div>
        )}

        {/* Step 4: Uji Koneksi / Speedtest (Screen 11) */}
        {execStep === 4 && (
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-6 space-y-5 text-center">
            <h2 className="text-lg font-bold text-[#17324D]">
              4. Uji Koneksi (Speedtest)
            </h2>

            <div className="mx-auto flex max-w-xs flex-col items-center rounded-[16px] border border-[#ADD8E6] bg-[#E6F4F9] p-6">
              <Gauge
                className={`h-10 w-10 text-[#0284C7] ${
                  speedRunning ? 'animate-spin' : ''
                }`}
              />
              <p className="mt-2 text-xs font-semibold text-[#526675]">
                Download
              </p>
              <p className="font-mono-tabular text-3xl font-bold text-[#17324D]">
                {speedResult.download}{' '}
                <span className="text-base font-medium">Mbps</span>
              </p>

              <div className="mt-4 grid w-full grid-cols-3 gap-2 border-t border-[#B8C9D3] pt-3 text-xs">
                <div>
                  <p className="text-[#718391]">Upload</p>
                  <p className="font-mono-tabular font-bold text-[#17324D]">
                    {speedResult.upload} Mbps
                  </p>
                </div>
                <div>
                  <p className="text-[#718391]">Ping</p>
                  <p className="font-mono-tabular font-bold text-[#17324D]">
                    {speedResult.ping} ms
                  </p>
                </div>
                <div>
                  <p className="text-[#718391]">Jitter</p>
                  <p className="font-mono-tabular font-bold text-[#17324D]">
                    {speedResult.jitter} ms
                  </p>
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-[10px] bg-emerald-50 px-4 py-2 text-xs font-semibold text-[#247A55]">
              <CheckCircle2 className="h-4 w-4" />
              <span>Koneksi Sesuai Paket ({selectedWo.productPackage})</span>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={runSpeedTest}
                disabled={speedRunning}
                className="flex-1 rounded-[10px] border border-[#B8C9D3] bg-white py-2.5 text-sm font-semibold text-[#17324D] hover:bg-[#F5F8FA]"
              >
                {speedRunning ? 'Menguji Koneksi...' : 'Jalankan Uji Ulang'}
              </button>
              <button
                type="button"
                onClick={() => {
                  onQueueOfflineAction(
                    `Simpan hasil speedtest ${selectedWo.id}: ${speedResult.download} Mbps`
                  );
                  setExecStep(5);
                }}
                className="flex-1 rounded-[10px] bg-[#0284C7] py-2.5 text-sm font-semibold text-white hover:bg-[#0369A1]"
              >
                Simpan Hasil
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Dokumentasi Pekerjaan (Screen 10) */}
        {execStep === 5 && (
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-[#17324D]">
                5. Dokumentasi Pekerjaan
              </h2>
              <p className="text-xs text-[#526675]">
                Ambil atau unggah foto bukti pengerjaan untuk verifikasi QC.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'sebelum', label: 'Sebelum (Area Lokasi)' },
                { key: 'proses', label: 'Proses (Pemasangan)' },
                { key: 'sesudah', label: 'Sesudah (Instalasi)' },
                { key: 'perangkat', label: 'Perangkat (ONT/Modem)' },
              ].map((slot) => {
                const imgSrc = photos[slot.key];
                return (
                  <div
                    key={slot.key}
                    className="rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-2.5"
                  >
                    <div className="relative h-28 w-full overflow-hidden rounded-[8px] bg-[#EAF2F6]">
                      {imgSrc ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imgSrc}
                            alt={slot.label}
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setPhotos((p) => {
                                const copy = { ...p };
                                delete copy[slot.key];
                                return copy;
                              })
                            }
                            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#17324D]/80 text-white"
                            aria-label={`Hapus foto ${slot.label}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </>
                      ) : (
                        <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 text-xs text-[#526675] hover:text-[#0284C7]">
                          <Camera className="h-5 w-5" />
                          <span>Unggah Foto</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handlePhotoUpload(slot.key, e)}
                          />
                        </label>
                      )}
                    </div>
                    <p className="mt-2 text-center text-[11px] font-semibold text-[#17324D]">
                      {slot.label}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setPhotos((p) => ({
                    ...p,
                    sesudah: '/images/workforce_technician_field.jpg',
                    perangkat: '/images/hero_agentzy_workforce.jpg',
                  }))
                }
                className="h-10 rounded-[10px] bg-[#0284C7] text-xs font-semibold text-white"
              >
                Ambil Foto Lapangan
              </button>
              <label className="flex h-10 cursor-pointer items-center justify-center rounded-[10px] border border-[#0284C7] text-xs font-semibold text-[#0284C7]">
                <span>Pilih dari Galeri</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhotoUpload('sesudah', e)}
                />
              </label>
            </div>
          </div>
        )}

        {/* Step 6: Konfirmasi Pelanggan & Tanda Tangan Digital (Screen 12) */}
        {execStep === 6 && (
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-[#17324D]">
                6. Konfirmasi Pelanggan
              </h2>
              <p className="text-xs text-[#526675]">
                Minta konfirmasi kepada pelanggan bahwa pekerjaan telah selesai dan
                layanan berfungsi baik.
              </p>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-[#17324D]">
                  Tanda Tangan Digital
                </span>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#526675] hover:text-[#B23A48]"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Bersihkan</span>
                </button>
              </div>
              <canvas
                ref={canvasRef}
                width={420}
                height={150}
                onPointerDown={startDraw}
                onPointerMove={draw}
                onPointerUp={endDraw}
                onPointerLeave={endDraw}
                className="w-full touch-none rounded-[12px] border border-dashed border-[#B8C9D3] bg-[#F5F8FA] cursor-crosshair"
              />
              {!hasSignature && (
                <p className="mt-1 text-[11px] text-[#718391]">
                  Goreskan tanda tangan pelanggan di area di atas.
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                Nama Pelanggan
              </label>
              <input
                type="text"
                value={customerNameSign}
                onChange={(e) => setCustomerNameSign(e.target.value)}
                className="h-10 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-sm"
              />
            </div>

            <label className="flex cursor-pointer items-start gap-2.5 text-xs text-[#526675]">
              <input
                type="checkbox"
                checked={customerConfirmChecked}
                onChange={(e) => setCustomerConfirmChecked(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-[#247A55]"
              />
              <span>
                Pelanggan menyatakan pekerjaan selesai dan layanan berfungsi baik.
              </span>
            </label>

            <button
              type="button"
              onClick={() => {
                onCompleteWo(selectedWo.id);
                onQueueOfflineAction(`Konfirmasi pelanggan ${selectedWo.id} selesai`);
                setExecStep(7);
              }}
              className="h-11 w-full rounded-[10px] bg-[#0284C7] text-sm font-semibold text-white hover:bg-[#0369A1]"
            >
              Simpan Konfirmasi &amp; Selesaikan
            </button>
          </div>
        )}

        {/* Step 7: Pekerjaan Selesai & Laporan (Screen 13) */}
        {execStep === 7 && (
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-6 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-[#247A55]">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#17324D]">
                Work Order Diselesaikan
              </h2>
              <p className="mt-1 text-sm text-[#526675]">
                {selectedWo.id} – {selectedWo.type} ({selectedWo.customerName})
              </p>
            </div>

            <div className="mx-auto max-w-sm rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[#526675]">Durasi Pengerjaan</span>
                <span className="font-mono-tabular font-bold text-[#17324D]">
                  1 jam 42 menit
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#526675]">Status SLA</span>
                <span className="font-bold text-[#247A55]">Tepat Waktu</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#526675]">Hasil Speedtest</span>
                <span className="font-mono-tabular font-bold text-[#17324D]">
                  {speedResult.download} Mbps
                </span>
              </div>
            </div>

            <div className="mx-auto flex max-w-sm flex-col gap-2.5">
              <button
                type="button"
                onClick={() => setShowReportModal(true)}
                className="h-11 w-full rounded-[10px] border border-[#0284C7] bg-white text-sm font-semibold text-[#0284C7] hover:bg-[#E6F4F9]"
              >
                Lihat Laporan
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubView('detail');
                  onSelectWoId(null);
                }}
                className="h-11 w-full rounded-[10px] bg-[#0284C7] text-sm font-semibold text-white hover:bg-[#0369A1]"
              >
                Kembali ke Daftar Tugas
              </button>
            </div>
          </div>
        )}

        {/* Wizard Prev / Next Footer */}
        {execStep < 7 && (
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setExecStep(Math.max(1, execStep - 1))}
              disabled={execStep === 1}
              className="rounded-[10px] border border-[#B8C9D3] bg-white px-5 py-2.5 text-sm font-semibold text-[#17324D] disabled:opacity-40"
            >
              Kembali
            </button>
            <button
              type="button"
              onClick={() => setExecStep(Math.min(7, execStep + 1))}
              className="rounded-[10px] bg-[#17324D] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#245477]"
            >
              Lanjut
            </button>
          </div>
        )}

        {/* Laporan Work Order Modal */}
        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B3A]/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-[14px] border border-[#D8E3E9] bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#EAF2F6] pb-3">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-[#247A55]" />
                  <h3 className="text-base font-bold text-[#17324D]">
                    Berita Acara Pekerjaan ({selectedWo.id})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="rounded-lg p-1 text-[#526675] hover:bg-[#EAF2F6]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <dl className="mt-4 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-[#526675]">Pelanggan</dt>
                  <dd className="font-semibold text-[#17324D]">{selectedWo.customerName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#526675]">Paket</dt>
                  <dd className="font-semibold text-[#17324D]">{selectedWo.productPackage}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#526675]">SOP Selesai</dt>
                  <dd className="font-mono-tabular font-semibold text-[#17324D]">
                    {completedSop}/7 Item
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#526675]">Speedtest</dt>
                  <dd className="font-mono-tabular font-semibold text-[#247A55]">
                    {speedResult.download} / {speedResult.upload} Mbps
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#526675]">Konfirmasi</dt>
                  <dd className="font-semibold text-[#17324D]">
                    {customerNameSign} (Tertandatangani)
                  </dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="mt-5 w-full rounded-[10px] bg-[#17324D] py-2.5 text-sm font-semibold text-white"
              >
                Tutup Laporan
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- VIEW: DETAIL WORK ORDER (Screen 6) ---
  if (selectedWo) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => onSelectWoId(null)}
          className="text-xs font-semibold text-[#0284C7] hover:underline"
        >
          ← Kembali ke Daftar Work Order
        </button>

        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono-tabular text-sm font-bold text-[#0284C7]">
              {selectedWo.id}
            </span>
            <span
              className={`text-xs font-bold ${
                selectedWo.priority === 'Prioritas Tinggi'
                  ? 'text-[#B23A48]'
                  : 'text-[#247A55]'
              }`}
            >
              {selectedWo.priority}
            </span>
          </div>

          <div>
            <h1 className="text-lg font-bold text-[#17324D]">
              {selectedWo.type} ({selectedWo.productPackage})
            </h1>
          </div>

          <dl className="space-y-3 border-t border-[#EAF2F6] pt-3 text-sm">
            <div>
              <dt className="text-xs text-[#718391]">Pelanggan</dt>
              <dd className="font-semibold text-[#172B3A]">
                {selectedWo.customerName} · {selectedWo.customerPhone}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#718391]">Alamat</dt>
              <dd className="font-medium text-[#172B3A]">
                {selectedWo.address}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <dt className="text-xs text-[#718391]">Paket</dt>
                <dd className="font-semibold text-[#172B3A]">
                  {selectedWo.productPackage}
                </dd>
              </div>
              <div className="text-right">
                <dt className="text-xs text-[#718391]">Target SLA</dt>
                <dd className="font-mono-tabular font-semibold text-[#247A55]">
                  {selectedWo.slaRemaining}
                </dd>
              </div>
            </div>
          </dl>

          {/* 3 Quick Buttons: Telepon, Chat, Navigasi */}
          <div className="grid grid-cols-3 gap-2.5 pt-2">
            <a
              href={`tel:${selectedWo.customerPhone.replace(/\s+/g, '')}`}
              className="flex items-center justify-center gap-1.5 rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] py-2.5 text-xs font-semibold text-[#17324D] hover:bg-[#E6F4F9]"
            >
              <Phone className="h-4 w-4 text-[#0284C7]" />
              <span>Telepon</span>
            </a>
            <a
              href={`https://wa.me/62${selectedWo.customerPhone.replace(/\D/g, '').replace(/^0/, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] py-2.5 text-xs font-semibold text-[#17324D] hover:bg-[#E6F4F9]"
            >
              <MessageSquare className="h-4 w-4 text-[#247A55]" />
              <span>Chat</span>
            </a>
            <button
              type="button"
              onClick={() => setSubView('navigation')}
              className="flex items-center justify-center gap-1.5 rounded-[10px] border border-[#0284C7] bg-[#E6F4F9] py-2.5 text-xs font-semibold text-[#17324D] hover:bg-[#DCEFF7]"
            >
              <Navigation className="h-4 w-4 text-[#0284C7]" />
              <span>Navigasi</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setExecStep(1);
              setSubView('execution');
            }}
            className="h-11 w-full rounded-[10px] bg-[#0284C7] text-sm font-semibold text-white hover:bg-[#0369A1]"
          >
            Mulai Pekerjaan
          </button>
        </div>
      </div>
    );
  }

  // --- VIEW: DAFTAR WORK ORDER (Screen 5) ---
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-[#17324D]">
        Tugas / Work Order
      </h1>

      <div className="grid grid-cols-3 rounded-[10px] border border-[#D8E3E9] bg-white p-1">
        {(['Semua', 'Pending', 'Proses'] as const).map((tab) => (
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

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#718391]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari WO, pelanggan, atau lokasi..."
          className="h-11 w-full rounded-[10px] border border-[#D8E3E9] bg-white pl-10 pr-4 text-sm text-[#172B3A]"
        />
      </div>

      <div className="space-y-3">
        {filteredList.map((wo) => (
          <button
            key={wo.id}
            type="button"
            onClick={() => {
              onSelectWoId(wo.id);
              setSubView('detail');
            }}
            className="flex w-full items-center justify-between gap-4 rounded-[14px] border border-[#D8E3E9] bg-white p-4 text-left transition hover:border-[#87CEEB]"
          >
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#0284C7]">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <p className="font-mono-tabular text-xs font-bold text-[#0284C7]">
                  {wo.id} · {wo.status}
                </p>
                <p className="text-sm font-bold text-[#17324D]">{wo.type}</p>
                <p className="mt-0.5 text-xs text-[#526675]">
                  {wo.customerName} · {wo.address}
                </p>
                <p
                  className={`mt-1.5 text-xs font-semibold ${
                    wo.priority === 'Prioritas Tinggi'
                      ? 'text-[#B23A48]'
                      : 'text-[#247A55]'
                  }`}
                >
                  {wo.priority} · {wo.distanceKm} km
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-[#718391]" />
          </button>
        ))}
      </div>
    </div>
  );
}

// --- 3. RIWAYAT PEKERJAAN TEKNISI (Screen 17) ---
export function TechHistoryView({ workOrders }: { workOrders: WorkOrderItem[] }) {
  const [filter, setFilter] = useState<'Semua' | 'Instalasi' | 'Maintenance' | 'Survey'>('Semua');
  const [selectedReport, setSelectedReport] = useState<WorkOrderItem | null>(null);

  const completed = workOrders.filter((w) => {
    if (w.status !== 'Selesai') return false;
    if (filter === 'Instalasi') return w.type === 'Instalasi Baru';
    if (filter === 'Maintenance') return w.type === 'Maintenance' || w.type === 'Troubleshooting';
    if (filter === 'Survey') return w.type === 'Survey';
    return true;
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-[#17324D]">Riwayat Pekerjaan</h1>

      <div className="grid grid-cols-4 rounded-[10px] border border-[#D8E3E9] bg-white p-1">
        {(['Semua', 'Instalasi', 'Maintenance', 'Survey'] as const).map((tab) => (
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

      <div className="space-y-3">
        {completed.map((wo) => (
          <button
            key={wo.id}
            type="button"
            onClick={() => setSelectedReport(wo)}
            className="flex w-full items-center justify-between gap-4 rounded-[14px] border border-[#D8E3E9] bg-white p-4 text-left hover:border-[#87CEEB]"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-[#247A55]" />
              <div>
                <p className="font-mono-tabular text-xs font-bold text-[#0284C7]">
                  {wo.id}
                </p>
                <p className="text-sm font-bold text-[#17324D]">{wo.type}</p>
                <p className="text-xs text-[#526675]">
                  Selesai · {wo.completedDate || 'Hari ini'} · {wo.customerName}
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-[#718391]" />
          </button>
        ))}
      </div>

      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B3A]/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[14px] border border-[#D8E3E9] bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#EAF2F6] pb-3">
              <h3 className="text-base font-bold text-[#17324D]">
                Arsip Work Order {selectedReport.id}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="rounded-lg p-1 text-[#526675]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <dl className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <dt className="text-[#526675]">Pelanggan</dt>
                <dd className="font-semibold text-[#17324D]">{selectedReport.customerName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#526675]">Durasi</dt>
                <dd className="font-mono-tabular font-semibold text-[#17324D]">
                  {selectedReport.durationText || '1 jam 20 menit'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#526675]">Status SLA</dt>
                <dd className="font-semibold text-[#247A55]">Tepat Waktu</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => setSelectedReport(null)}
              className="mt-5 w-full rounded-[10px] bg-[#17324D] py-2.5 text-sm font-semibold text-white"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- 4. INVENTARIS & MATERIAL TEKNISI (Screen 18) ---
export function TechInventoryView({
  inventory,
  onRequestRestock,
}: {
  inventory: InventoryItem[];
  onRequestRestock: (itemName: string, qty: number) => void;
}) {
  const [tab, setTab] = useState<'Semua' | 'Perangkat' | 'Material'>('Semua');
  const [showModal, setShowModal] = useState(false);
  const [reqItem, setReqItem] = useState(inventory[0]?.name || 'ONT ZTE F670L');
  const [reqQty, setReqQty] = useState(2);

  const visible = inventory.filter((i) => tab === 'Semua' || i.category === tab);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-[#17324D]">
          Inventaris &amp; Material
        </h1>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0369A1]"
        >
          <Plus className="h-4 w-4" />
          <span>Ajukan Pengambilan</span>
        </button>
      </div>

      <div className="grid grid-cols-3 rounded-[10px] border border-[#D8E3E9] bg-white p-1">
        {(['Semua', 'Perangkat', 'Material'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-[8px] py-2 text-xs font-semibold transition ${
              tab === t
                ? 'bg-[#0284C7] text-white'
                : 'text-[#526675] hover:text-[#17324D]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {visible.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-4 rounded-[14px] border border-[#D8E3E9] bg-white p-4"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#0284C7]">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#17324D]">{item.name}</p>
                <p className="font-mono-tabular text-xs text-[#526675]">
                  {item.category} · {item.stockLabel}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setReqItem(item.name);
                setShowModal(true);
              }}
              className="rounded-[8px] border border-[#B8C9D3] px-3 py-1.5 text-xs font-semibold text-[#17324D] hover:bg-[#F5F8FA]"
            >
              Minta Stok
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B3A]/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onRequestRestock(reqItem, reqQty);
              setShowModal(false);
            }}
            className="w-full max-w-sm rounded-[14px] border border-[#D8E3E9] bg-white p-6 shadow-xl"
          >
            <h3 className="text-base font-bold text-[#17324D]">
              Pengambilan Material Gudang
            </h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                  Item Perangkat / Material
                </label>
                <select
                  value={reqItem}
                  onChange={(e) => setReqItem(e.target.value)}
                  className="h-10 w-full rounded-[10px] border border-[#B8C9D3] bg-white px-3 text-sm"
                >
                  {inventory.map((i) => (
                    <option key={i.id} value={i.name}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                  Jumlah Pengambilan
                </label>
                <input
                  type="number"
                  min={1}
                  value={reqQty}
                  onChange={(e) => setReqQty(Math.max(1, Number(e.target.value)))}
                  className="h-10 w-full rounded-[10px] border border-[#B8C9D3] px-3 font-mono-tabular text-sm"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-[10px] border border-[#B8C9D3] px-4 py-2 text-xs font-semibold text-[#17324D]"
              >
                Batal
              </button>
              <button
                type="submit"
                className="rounded-[10px] bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white"
              >
                Ajukan Pengambilan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// --- 5. GAJI POKOK, KOMISI & BONUS TARGET TEKNISI (Screen 16) ---
export function TechCommissionView({
  placedSchema,
  allCorpSchemas,
  onChangePlacedCorporateId,
  techBonusRules,
  techTaskCounts,
}: {
  placedSchema?: CorporateCompensationSchema;
  allCorpSchemas?: CorporateCompensationSchema[];
  onChangePlacedCorporateId?: (id: string) => void;
  techBonusRules?: TechnicianBonusRule[];
  techTaskCounts?: TechnicianTaskCounts;
}) {
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [done, setDone] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<'Semua' | BonusPeriodType>('Semua');
  const [taskFilter, setTaskFilter] = useState<'Semua' | TechnicianTaskCategory>('Semua');
  const [slaPct, setSlaPct] = useState(97);

  const activeSchema = placedSchema || INITIAL_CORPORATE_COMPENSATION_SCHEMAS[0];
  const schemasList = allCorpSchemas && allCorpSchemas.length > 0 ? allCorpSchemas : INITIAL_CORPORATE_COMPENSATION_SCHEMAS;
  const activeRules = techBonusRules || INITIAL_TECH_BONUS_RULES;
  const counts = techTaskCounts || DEFAULT_TECH_TASK_COUNTS;

  const comp = calculateTechnicianCompensation({
    schema: activeSchema,
    bonusRules: activeRules,
    completedCounts: counts,
    slaPct,
  });

  const filteredBonuses = comp.bonusEvaluations.filter((item) => {
    const matchPeriod = periodFilter === 'Semua' || item.rule.period === periodFilter;
    const matchTask = taskFilter === 'Semua' || item.rule.taskType === taskFilter;
    return matchPeriod && matchTask;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#17324D]">
            Gaji, Komisi &amp; Bonus Target Teknisi
          </h1>
          <p className="text-xs text-[#526675]">
            Kontrak <strong className="text-[#17324D]">{comp.corporateName}</strong> ({comp.contractNumber}) · Skema bonus harian, mingguan &amp; bulanan di luar gaji pokok.
          </p>
        </div>

        {onChangePlacedCorporateId && (
          <div className="flex items-center gap-1.5 rounded-[10px] border border-[#D8E3E9] bg-white px-3 py-2">
            <Building2 className="h-4 w-4 text-[#0284C7]" />
            <select
              value={activeSchema.id}
              onChange={(e) => onChangePlacedCorporateId(e.target.value)}
              aria-label="Penempatan Vendor Corporate Teknisi"
              className="bg-transparent text-xs font-semibold text-[#17324D] outline-none"
            >
              {schemasList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.corporateName} · {s.contractNumber}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Total Take-Home Pay Card */}
      <div className="rounded-[14px] border border-[#ADD8E6] bg-gradient-to-br from-[#E6F4F9] to-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#0284C7] text-white">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#526675]">
                Total Estimasi Take-Home Pay (Gaji Pokok + Fee WO + Bonus Target)
              </p>
              <p className="font-mono-tabular text-2xl font-bold text-[#17324D] sm:text-3xl">
                {formatIDR(comp.totalTakeHomePayIdr)}
              </p>
              <p className="text-xs font-semibold text-[#247A55]">
                Gaji Pokok {formatIDR(comp.baseSalaryIdr)} + Total Bonus Target {formatIDR(comp.totalTargetBonusIdr)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-[10px] border border-[#D8E3E9] bg-white px-3 py-2">
            <span className="text-xs text-[#526675]">SLA Aktual:</span>
            <input
              type="number"
              min={80}
              max={100}
              value={slaPct}
              onChange={(e) => setSlaPct(Math.min(100, Math.max(80, Number(e.target.value))))}
              aria-label="Simulasi SLA Teknisi"
              className="w-14 rounded border border-[#B8C9D3] px-1.5 py-0.5 text-center font-mono-tabular text-xs font-bold text-[#17324D]"
            />
            <span className="text-xs font-bold text-[#0284C7]">%</span>
          </div>
        </div>

        {/* Summary Split Cards: Harian, Mingguan, Bulanan */}
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          <div className="rounded-[10px] border border-[#D8E3E9] bg-white p-3">
            <p className="text-[11px] text-[#526675]">Bonus Harian</p>
            <p className="mt-1 font-mono-tabular text-sm font-bold text-[#17324D]">
              {formatIDR(comp.totalDailyBonusIdr)}
            </p>
          </div>
          <div className="rounded-[10px] border border-[#D8E3E9] bg-white p-3">
            <p className="text-[11px] text-[#526675]">Bonus Mingguan</p>
            <p className="mt-1 font-mono-tabular text-sm font-bold text-[#0284C7]">
              {formatIDR(comp.totalWeeklyBonusIdr)}
            </p>
          </div>
          <div className="rounded-[10px] border border-[#D8E3E9] bg-white p-3">
            <p className="text-[11px] text-[#526675]">Bonus Bulanan</p>
            <p className="mt-1 font-mono-tabular text-sm font-bold text-[#247A55]">
              {formatIDR(comp.totalMonthlyBonusIdr)}
            </p>
          </div>
        </div>
      </div>

      {/* Rincian Gaji Pokok & Komisi WO */}
      <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
        <h2 className="text-sm font-bold text-[#17324D]">
          Rincian Gaji Pokok &amp; Fee Work Order ({comp.corporateName})
        </h2>
        <div className="mt-3 divide-y divide-[#EAF2F6] text-sm">
          {[
            { label: `Gaji Pokok Teknisi (${comp.contractNumber})`, val: formatIDR(comp.baseSalaryIdr) },
            { label: 'Tunjangan Operasional Lapangan', val: formatIDR(comp.fieldAllowanceIdr) },
            {
              label: `Fee Pemasangan (${comp.taskFeesBreakdown.pemasanganCount} WO × ${formatIDR(activeSchema.technicianConfig.feePemasanganIdr)})`,
              val: formatIDR(comp.taskFeesBreakdown.pemasanganFeeIdr),
            },
            {
              label: `Fee Maintenance (${comp.taskFeesBreakdown.maintenanceCount} WO × ${formatIDR(activeSchema.technicianConfig.feeMaintenanceIdr)})`,
              val: formatIDR(comp.taskFeesBreakdown.maintenanceFeeIdr),
            },
            {
              label: `Fee Survey Lokasi/ODP (${comp.taskFeesBreakdown.surveyCount} WO × ${formatIDR(activeSchema.technicianConfig.feeSurveyIdr)})`,
              val: formatIDR(comp.taskFeesBreakdown.surveyFeeIdr),
            },
            {
              label: `Bonus Kepatuhan SLA (Min. ${activeSchema.technicianConfig.minSlaPctForBonus}%)`,
              val: comp.slaQualified ? formatIDR(comp.slaComplianceBonusIdr) : 'Rp 0 (Di bawah SLA)',
            },
            {
              label: 'Total Bonus Target (Harian + Mingguan + Bulanan)',
              val: formatIDR(comp.totalTargetBonusIdr),
            },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-3 py-3 text-xs sm:text-sm">
              <span className="text-[#526675]">{row.label}</span>
              <span className="font-mono-tabular font-semibold text-[#17324D]">
                {row.val}
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            setDone(false);
            setShowWithdraw(true);
          }}
          className="mt-4 h-11 w-full rounded-[10px] bg-[#0284C7] text-sm font-semibold text-white hover:bg-[#0369A1]"
        >
          Tarik Penghasilan ({formatIDR(comp.totalTakeHomePayIdr)})
        </button>
      </div>

      {/* Skema Bonus Target Teknisi (Harian, Mingguan, Bulanan) */}
      <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold text-[#17324D]">
              <Target className="h-4 w-4 text-[#0284C7]" />
              <span>Pencapaian Target Bonus (Pemasangan · Maintenance · Survey)</span>
            </h2>
            <p className="mt-0.5 text-xs text-[#526675]">
              Selesaikan Work Order di tab Tugas untuk melihat progres target harian, mingguan, dan bulanan bertambah otomatis.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-4 rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] p-1">
            {(['Semua', 'Harian', 'Mingguan', 'Bulanan'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriodFilter(p)}
                className={`rounded-[7px] px-2.5 py-1.5 text-xs font-semibold transition ${
                  periodFilter === p
                    ? 'bg-[#17324D] text-white'
                    : 'text-[#526675] hover:text-[#17324D]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-4 rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] p-1">
            {(['Semua', 'Pemasangan', 'Maintenance', 'Survey'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTaskFilter(t)}
                className={`rounded-[7px] px-2.5 py-1.5 text-xs font-semibold transition ${
                  taskFilter === t
                    ? 'bg-[#0284C7] text-white'
                    : 'text-[#526675] hover:text-[#17324D]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Bonus Rule Progress Cards */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filteredBonuses.map((item) => (
            <div
              key={item.rule.id}
              className={`rounded-[12px] border p-4 transition ${
                item.achieved
                  ? 'border-[#247A55]/40 bg-emerald-50/40'
                  : 'border-[#D8E3E9] bg-[#F8FAFC]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0284C7]">
                    {item.rule.period}
                  </span>
                  <h3 className="text-sm font-bold text-[#17324D]">
                    {item.rule.taskType}
                  </h3>
                </div>
                <span
                  className={`font-mono-tabular text-xs font-bold ${
                    item.achieved ? 'text-[#247A55]' : 'text-[#A96816]'
                  }`}
                >
                  {item.achieved ? 'Tercapai' : `Kurang ${Math.max(0, item.rule.targetCount - item.actualCount)}`}
                </span>
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-xs">
                  <span className="text-[#526675]">Capaian Tugas</span>
                  <span className="font-mono-tabular font-bold text-[#17324D]">
                    {item.actualCount} / {item.rule.targetCount} WO ({item.progressPct}%)
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#D8E3E9]">
                  <div
                    className={`h-full rounded-full transition-all ${
                      item.achieved ? 'bg-[#247A55]' : 'bg-[#0284C7]'
                    }`}
                    style={{ width: `${item.progressPct}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 space-y-1 border-t border-[#EAF2F6] pt-2.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#526675]">Bonus Target</span>
                  <span className="font-mono-tabular font-semibold text-[#17324D]">
                    {formatIDR(item.rule.bonusAmountIdr)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#526675]">Ekstra / Unit Kelebihan</span>
                  <span className="font-mono-tabular font-semibold text-[#17324D]">
                    +{formatIDR(item.rule.extraPerUnitIdr)} ({item.extraUnits} unit)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#526675]">Syarat Min. SLA</span>
                  <span
                    className={`font-mono-tabular font-semibold ${
                      item.slaQualified ? 'text-[#247A55]' : 'text-[#B23A48]'
                    }`}
                  >
                    {item.rule.minSlaPct}% ({item.slaQualified ? 'Memenuhi' : 'Kurang'})
                  </span>
                </div>
                <div className="flex justify-between pt-1 text-xs font-bold">
                  <span className="text-[#17324D]">Bonus Diterima</span>
                  <span
                    className={`font-mono-tabular ${
                      item.earnedBonusIdr > 0 ? 'text-[#247A55]' : 'text-[#718391]'
                    }`}
                  >
                    {formatIDR(item.earnedBonusIdr)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showWithdraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B3A]/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-[14px] border border-[#D8E3E9] bg-white p-6 shadow-xl text-center">
            {done ? (
              <div className="space-y-3">
                <ShieldCheck className="mx-auto h-10 w-10 text-[#247A55]" />
                <h3 className="text-base font-bold text-[#17324D]">
                  Penarikan Diajukan
                </h3>
                <p className="text-xs text-[#526675]">
                  Pencairan <strong className="font-mono-tabular">{formatIDR(comp.totalTakeHomePayIdr)}</strong> ke rekening Mandiri Budi Santoso ({comp.corporateName}) sedang diproses Finance.
                </p>
                <button
                  type="button"
                  onClick={() => setShowWithdraw(false)}
                  className="w-full rounded-[10px] bg-[#17324D] py-2.5 text-sm font-semibold text-white"
                >
                  Tutup
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-left">
                <h3 className="text-base font-bold text-[#17324D]">
                  Konfirmasi Tarik Penghasilan
                </h3>
                <p className="text-xs text-[#526675]">
                  Saldo siap tarik ({comp.corporateName}):{' '}
                  <strong className="font-mono-tabular text-[#17324D]">
                    {formatIDR(comp.totalTakeHomePayIdr)}
                  </strong>
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowWithdraw(false)}
                    className="rounded-[10px] border border-[#B8C9D3] px-4 py-2 text-xs font-semibold text-[#17324D]"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => setDone(true)}
                    className="rounded-[10px] bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white"
                  >
                    Konfirmasi
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
