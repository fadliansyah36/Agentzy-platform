'use client';

import React, { useState } from 'react';
import {
  Bot,
  Briefcase,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  GitBranch,
  Play,
  RotateCcw,
  ShieldCheck,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';

export type UniverseFocusMode =
  | 'all'
  | 'sales_affiliate'
  | 'ai_marketing_sales'
  | 'tech_ops';

export type TreeNodeId =
  | 'tenant_core'
  | 'staff_sales'
  | 'sales_personal'
  | 'affiliate_leaf'
  | 'ai_sales_marketing'
  | 'ai_tech_ops'
  | 'technician_lead'
  | 'tech_dispatch'
  | 'tech_execution'
  | 'growth_settlement';

interface TreeNodeMeta {
  id: TreeNodeId;
  title: string;
  roleTag: string;
  category: 'core' | 'commercial' | 'ai_support' | 'field' | 'ledger';
  parentId: TreeNodeId | null;
  focusGroups: UniverseFocusMode[];
  summary: string;
  authorityBoundary: string;
  collaboratesWith: Array<{ target: string; protocol: string }>;
  rules: string[];
}

const TREE_NODES: Record<TreeNodeId, TreeNodeMeta> = {
  tenant_core: {
    id: 'tenant_core',
    title: 'Ekosistem Bisnis & Kemitraan Agentzy',
    roleTag: 'Perusahaan Mitra · Tim Sales · Teknisi · AI',
    category: 'core',
    parentId: null,
    focusGroups: ['all', 'sales_affiliate', 'ai_marketing_sales', 'tech_ops'],
    summary:
      'Pusat kerja sama antara perusahaan mitra dan seluruh tim terkelola Agentzy. Setiap target penjualan, pembagian komisi, dan standar layanan pelanggan dikelola secara transparan dalam satu sistem.',
    authorityBoundary:
      'Perusahaan mitra memiliki kendali penuh atas target area, promo yang berjalan, jadwal layanan, serta persetujuan anggaran kemitraan.',
    collaboratesWith: [
      { target: 'Staff Sales & Affiliate', protocol: 'Target Penjualan · Wilayah Pemasaran · Bagi Hasil' },
      { target: 'Asisten AI Bisnis & Operasional', protocol: 'Dukungan Marketing Sales & Operasional Teknisi' },
      { target: 'Teknisi Lapangan', protocol: 'Ketepatan Jadwal & Kepuasan Pelanggan' },
    ],
    rules: [
      'Data pelanggan, wilayah, dan laporan penjualan terpisah aman khusus untuk perusahaan Anda',
      'Transparansi penuh antara pertumbuhan bisnis mitra dan insentif tim lapangan',
      'Setiap aktivitas tercatat rapi agar mudah dievaluasi secara berkala',
    ],
  },
  staff_sales: {
    id: 'staff_sales',
    title: 'Staff Sales Agentzy',
    roleTag: 'Pilar Penjualan · Training / Pro / Elite',
    category: 'commercial',
    parentId: 'tenant_core',
    focusGroups: ['all', 'sales_affiliate', 'ai_marketing_sales'],
    summary:
      'Tim penjualan profesional yang menangani konsultasi produk, presentasi penawaran, dan closing pelanggan baru sekaligus membina jaringan Affiliate Freelance di wilayah kerjanya.',
    authorityBoundary:
      'Membina mitra Affiliate baru, mengawal calon pelanggan hingga berlangganan aktif, dan menjaga etika promosi sesuai merek perusahaan mitra.',
    collaboratesWith: [
      { target: 'AI Marketing & Content Support', protocol: 'Konten Sosmed, Kampanye Digital & Pencarian Leads' },
      { target: 'Affiliate Freelance', protocol: 'Pendampingan Closing & Bagi Hasil 60/40' },
      { target: 'Teknisi Lapangan', protocol: 'Koordinasi Jadwal Pemasangan Pelanggan' },
    ],
    rules: [
      'Jenjang karir Training, Pro, hingga Elite memacu produktivitas penjualan berkelanjutan',
      'Memperoleh 100% komisi penjualan pribadi dan 40% porsi pembinaan dari aktivasi Affiliate',
      'Didukung penuh oleh AI untuk konten promosi, media sosial, dan pencarian prospek baru',
    ],
  },
  sales_personal: {
    id: 'sales_personal',
    title: 'Penjualan Langsung (Direct Sales)',
    roleTag: 'Cabang Staff Sales · 100% Komisi Pribadi',
    category: 'commercial',
    parentId: 'staff_sales',
    focusGroups: ['all', 'sales_affiliate', 'ai_marketing_sales'],
    summary:
      'Akuisisi pelanggan perumahan maupun bisnis yang ditangani langsung oleh Staff Sales dari promosi produk, konsultasi paket, hingga kesepakatan berlangganan.',
    authorityBoundary:
      'Seluruh pencapaian penjualan di jalur ini tercatat penuh untuk Staff Sales yang menangani prospek hingga aktif.',
    collaboratesWith: [
      { target: 'AI Marketing & Leads', protocol: 'Materi Promo Siap Sebar & Penyaringan Prospek' },
      { target: 'Bagi Hasil & Pertumbuhan', protocol: '100% Komisi Penjualan + Bonus Pencapaian' },
    ],
    rules: [
      'Alur penjualan jelas dari calon pelanggan masuk hingga layanan aktif terpasang',
      'Pengingat tindak lanjut otomatis agar tidak ada prospek potensial yang terlewat',
    ],
  },
  affiliate_leaf: {
    id: 'affiliate_leaf',
    title: 'Affiliate Freelance',
    roleTag: 'Mitra Promosi · Bagi Hasil 60%',
    category: 'commercial',
    parentId: 'staff_sales',
    focusGroups: ['all', 'sales_affiliate', 'ai_marketing_sales'],
    summary:
      'Mitra promosi fleksibel yang membantu menjangkau komunitas, lingkungan perumahan, dan kanal online untuk merekomendasikan calon pelanggan potensial.',
    authorityBoundary:
      'Fokus mempromosikan produk dan menyetor calon pelanggan berkualitas tanpa terbebani jam kerja kaku atau tugas rekrutmen berjenjang.',
    collaboratesWith: [
      { target: 'Staff Sales Pembina', protocol: 'Bantuan Penawaran & Proses Closing Pelanggan' },
      { target: 'AI Generate Content & Sosmed', protocol: 'Caption IG/TikTok/WA & Brosur Digital Siap Pakai' },
    ],
    rules: [
      'Menerima porsi komisi 60% untuk setiap calon pelanggan yang berhasil aktif berlangganan',
      'Langsung mendapatkan materi konten media sosial dan panduan promosi dari AI',
      'Transparan memantau status prospek hingga pencairan komisi di aplikasi',
    ],
  },
  ai_sales_marketing: {
    id: 'ai_sales_marketing',
    title: 'AI Support: Staff Sales & Affiliate',
    roleTag: 'Digital Marketing · Content · Leads · Sosmed',
    category: 'ai_support',
    parentId: 'tenant_core',
    focusGroups: ['all', 'sales_affiliate', 'ai_marketing_sales'],
    summary:
      'Rekan kerja AI khusus untuk memperkuat pemasaran Staff Sales dan Affiliate: merancang kampanye digital marketing, membuat konten & caption media sosial, mencari & menyaring leads, serta menyiapkan bahan follow-up.',
    authorityBoundary:
      'AI menyiapkan materi kreatif dan daftar prospek hangat; keputusan pengiriman penawaran dan komunikasi personal tetap di tangan Staff Sales & Affiliate.',
    collaboratesWith: [
      { target: 'Staff Sales Agentzy', protocol: 'Ide Kampanye, Draf Follow-Up & Prospek Siap Closing' },
      { target: 'Affiliate Freelance', protocol: 'Generate Konten Sosmed, Video Script & Flyer Promo' },
    ],
    rules: [
      'Menghasilkan konten Instagram, TikTok, Facebook, dan WhatsApp Broadcast dalam hitungan detik',
      'Membantu menyaring prospek online sehingga tim Sales fokus pada calon pembeli serius',
      'Menyesuaikan gaya bahasa dengan promo resmi perusahaan mitra',
    ],
  },
  ai_tech_ops: {
    id: 'ai_tech_ops',
    title: 'AI Support: Operasional & Teknis',
    roleTag: 'Khusus Teknisi · Jadwal, Rute & Panduan Teknis',
    category: 'ai_support',
    parentId: 'tenant_core',
    focusGroups: ['all', 'tech_ops'],
    summary:
      'Berbeda dari tim penjualan, AI untuk divisi Teknisi difokuskan penuh pada kelancaran operasional dan teknis: mengatur jadwal & rute kunjungan tercepat, memastikan kesiapan material, serta menyediakan panduan teknis di lapangan.',
    authorityBoundary:
      'Membantu efisiensi kerja dan ketepatan waktu teknisi di lapangan; perubahan jadwal mendesak atau keputusan teknis kritis tetap dikendalikan tim operasional.',
    collaboratesWith: [
      { target: 'Teknisi Lapangan', protocol: 'Rute Kunjungan Optimal, Panduan Teknis & Monitor SLA' },
      { target: 'Manajemen Perusahaan Mitra', protocol: 'Laporan Ketepatan Jadwal & Kualitas Pemasangan' },
    ],
    rules: [
      'Menyusun urutan kunjungan harian berdasarkan jarak terdekat dan keahlian teknisi',
      'Memberikan referensi cepat standar pemasangan dan solusi kendala teknis di lokasi',
      'Mengingatkan batas waktu layanan agar kepuasan pelanggan tetap terjaga tinggi',
    ],
  },
  technician_lead: {
    id: 'technician_lead',
    title: 'Teknisi Lapangan Profesional',
    roleTag: 'Pilar Layanan · Instalasi & Perawatan',
    category: 'field',
    parentId: 'tenant_core',
    focusGroups: ['all', 'tech_ops'],
    summary:
      'Tim teknisi terlatih dan bersertifikat yang menangani pemasangan baru, survei lokasi, perawatan berkala, hingga perbaikan kendala layanan langsung di tempat pelanggan.',
    authorityBoundary:
      'Menjalankan pekerjaan lapangan sesuai standar keselamatan kerja, daftar periksa kualitas, dan bukti serah terima digital bersama pelanggan.',
    collaboratesWith: [
      { target: 'AI Operasional & Teknis', protocol: 'Jadwal Kunjungan, Rute Peta & Panduan Teknis' },
      { target: 'Staff Sales Agentzy', protocol: 'Konfirmasi Kesiapan Jadwal Pemasangan Pelanggan' },
      { target: 'Bagi Hasil & Pertumbuhan', protocol: 'Insentif Pemasangan & Bonus Ketepatan Waktu' },
    ],
    rules: [
      'Navigasi langsung ke titik lokasi pelanggan melalui peta digital',
      'Standar pengerjaan rapi lengkap dengan uji kualitas layanan & tanda tangan pelanggan',
      'Tetap bisa mencatat laporan pekerjaan meski berada di area sinyal lemah',
    ],
  },
  tech_dispatch: {
    id: 'tech_dispatch',
    title: 'Penjadwalan Rute & Material (Operasional)',
    roleTag: 'Dukungan AI Operasional · Peta & Stok',
    category: 'field',
    parentId: 'technician_lead',
    focusGroups: ['all', 'tech_ops'],
    summary:
      'Pengaturan tugas pemasangan ke teknisi terdekat dengan keahlian yang tepat, lengkap dengan pengecekan kesiapan perangkat dan material sebelum berangkat ke lokasi.',
    authorityBoundary:
      'Memastikan teknisi berangkat dengan rute paling hemat waktu dan perlengkapan lengkap sehingga jarang terjadi penundaan.',
    collaboratesWith: [
      { target: 'AI Operasional & Teknis', protocol: 'Estimasi Waktu Tiba & Urutan Kunjungan Terbaik' },
      { target: 'Staff Sales', protocol: 'Kepastian Jadwal Pemasangan untuk Pelanggan Baru' },
    ],
    rules: [
      'Pengecekan ketersediaan perangkat dan kabel sebelum kunjungan dimulai',
      'Rekomendasi rute terdekat untuk memperbanyak kapasitas pemasangan harian',
    ],
  },
  tech_execution: {
    id: 'tech_execution',
    title: 'Eksekusi Lapangan & Panduan Teknis',
    roleTag: 'Dukungan AI Teknis · Uji Kualitas & Berita Acara',
    category: 'field',
    parentId: 'technician_lead',
    focusGroups: ['all', 'tech_ops'],
    summary:
      'Panduan langkah demi langkah di lapangan mulai dari tiba di lokasi, pemasangan rapi, uji performa layanan, dokumentasi foto, hingga tanda tangan kepuasan pelanggan.',
    authorityBoundary:
      'Layanan baru dinyatakan selesai setelah hasil uji kualitas sesuai standar perusahaan mitra dan disetujui oleh pelanggan.',
    collaboratesWith: [
      { target: 'AI Asisten Teknis', protocol: 'Solusi Cepat Gangguan & Validasi Kualitas Instalasi' },
      { target: 'Pertumbuhan & Bagi Hasil', protocol: 'Aktivasi Layanan Resmi & Pencairan Insentif' },
    ],
    rules: [
      'Dokumentasi foto dan hasil uji kualitas tersimpan rapi sebagai bukti kerja resmi',
      'Mengurangi risiko kunjungan ulang berkat pengecekan kualitas sejak hari pertama',
    ],
  },
  growth_settlement: {
    id: 'growth_settlement',
    title: 'Pertumbuhan Bisnis & Bagi Hasil Transparan',
    roleTag: 'Hasil Kerja Sama · Pelanggan Aktif & Komisi Jelas',
    category: 'ledger',
    parentId: 'tenant_core',
    focusGroups: ['all', 'sales_affiliate', 'ai_marketing_sales', 'tech_ops'],
    summary:
      'Muara seluruh kolaborasi: setiap pelanggan yang berhasil diakuisisi dan terpasang rapi langsung menambah pendapatan perusahaan mitra sekaligus menghitung komisi tim secara adil.',
    authorityBoundary:
      'Perhitungan komisi dan laporan kinerja mengikuti kesepakatan kontrak kerja sama secara transparan dan dapat dipantau manajemen kapan saja.',
    collaboratesWith: [
      { target: 'Affiliate Freelance', protocol: 'Bagi Hasil 60% per Pelanggan Aktif' },
      { target: 'Staff Sales Agentzy', protocol: '100% Komisi Langsung + 40% Pembinaan Affiliate' },
      { target: 'Teknisi Lapangan', protocol: 'Insentif Penyelesaian & Ketepatan Jadwal' },
    ],
    rules: [
      'Laporan penjualan, biaya layanan, dan pencairan komisi tercatat rapi dalam satu tempat',
      'Komisi hanya cair untuk pelanggan yang benar-benar terpasang dan aktif berlangganan',
    ],
  },
};

const SIMULATION_STEPS: Array<{
  step: number;
  title: string;
  desc: string;
  activeNodes: TreeNodeId[];
  focusedNode: TreeNodeId;
}> = [
  {
    step: 1,
    title: '01 · AI Siapkan Konten Sosmed & Kampanye Digital Marketing',
    desc: 'AI membantu Staff Sales dan Affiliate membuat caption Instagram/TikTok, desain pesan WhatsApp, dan iklan promo area agar cepat menarik perhatian calon pelanggan.',
    activeNodes: ['ai_sales_marketing', 'staff_sales', 'affiliate_leaf'],
    focusedNode: 'ai_sales_marketing',
  },
  {
    step: 2,
    title: '02 · AI Saring Leads, Staff Sales & Affiliate Tindak Lanjut Closing',
    desc: 'Calon pelanggan dari media sosial dan komunitas dijaring AI lalu diteruskan ke Staff Sales atau Affiliate untuk penawaran paket terbaik hingga sepakat berlangganan.',
    activeNodes: ['ai_sales_marketing', 'staff_sales', 'sales_personal', 'affiliate_leaf'],
    focusedNode: 'staff_sales',
  },
  {
    step: 3,
    title: '03 · AI Operasional Atur Jadwal & Rute Teknisi Terdekat',
    desc: 'Begitu pesanan disetujui, AI Operasional langsung mencocokkan lokasi pelanggan dengan Teknisi terdekat lengkap beserta kebutuhan perangkat dan rute kunjungan optimal.',
    activeNodes: ['ai_tech_ops', 'technician_lead', 'tech_dispatch'],
    focusedNode: 'tech_dispatch',
  },
  {
    step: 4,
    title: '04 · Teknisi Pasang di Lokasi dengan Panduan AI Teknis',
    desc: 'Teknisi melaksanakan instalasi sesuai standar, didampingi AI Teknis untuk pengecekan kualitas sinyal/layanan hingga berita acara ditandatangani pelanggan.',
    activeNodes: ['ai_tech_ops', 'technician_lead', 'tech_execution'],
    focusedNode: 'tech_execution',
  },
  {
    step: 5,
    title: '05 · Pelanggan Aktif, Bisnis Mitra Tumbuh & Komisi Cair',
    desc: 'Layanan pelanggan resmi aktif: perusahaan mitra memperoleh pelanggan baru yang puas, sementara Staff Sales, Affiliate (60/40), dan Teknisi menerima hak komisi secara transparan.',
    activeNodes: [
      'growth_settlement',
      'affiliate_leaf',
      'staff_sales',
      'technician_lead',
    ],
    focusedNode: 'growth_settlement',
  },
];

const FOCUS_MODES: Array<{
  id: UniverseFocusMode;
  label: string;
  mobileLabel: string;
}> = [
  { id: 'all', label: 'Semua Ekosistem', mobileLabel: 'Semua' },
  { id: 'sales_affiliate', label: 'Staff Sales & Affiliate', mobileLabel: 'Sales & Affiliate' },
  { id: 'ai_marketing_sales', label: 'AI Marketing & Konten', mobileLabel: 'AI Marketing' },
  { id: 'tech_ops', label: 'Teknisi & AI Operasional', mobileLabel: 'Teknisi & Ops' },
];

export function InteractiveUniverseTree() {
  const [focusMode, setFocusMode] = useState<UniverseFocusMode>('all');
  const [selectedNodeId, setSelectedNodeId] = useState<TreeNodeId>('ai_sales_marketing');
  const [simStepIndex, setSimStepIndex] = useState<number | null>(null);
  const [expandedBranches, setExpandedBranches] = useState<{
    commercial: boolean;
    ai_support: boolean;
    field: boolean;
  }>({
    commercial: true,
    ai_support: true,
    field: true,
  });

  const activeSim = simStepIndex !== null ? SIMULATION_STEPS[simStepIndex] : null;
  const selectedNode = TREE_NODES[selectedNodeId];

  const isNodeHighlighted = (id: TreeNodeId) => {
    if (activeSim) {
      return activeSim.activeNodes.includes(id);
    }
    if (focusMode === 'all') return true;
    return TREE_NODES[id].focusGroups.includes(focusMode);
  };

  const handleSelectMode = (mode: UniverseFocusMode) => {
    setSimStepIndex(null);
    setFocusMode(mode);
    if (mode === 'sales_affiliate') {
      setExpandedBranches((p) => ({ ...p, commercial: true }));
      setSelectedNodeId('affiliate_leaf');
    } else if (mode === 'ai_marketing_sales') {
      setExpandedBranches((p) => ({ ...p, ai_support: true, commercial: true }));
      setSelectedNodeId('ai_sales_marketing');
    } else if (mode === 'tech_ops') {
      setExpandedBranches((p) => ({ ...p, field: true, ai_support: true }));
      setSelectedNodeId('ai_tech_ops');
    } else {
      setSelectedNodeId('tenant_core');
    }
  };

  const handleAdvanceSimulation = () => {
    const nextIdx =
      simStepIndex === null
        ? 0
        : simStepIndex + 1 >= SIMULATION_STEPS.length
          ? 0
          : simStepIndex + 1;
    setFocusMode('all');
    setExpandedBranches({ commercial: true, ai_support: true, field: true });
    setSimStepIndex(nextIdx);
    setSelectedNodeId(SIMULATION_STEPS[nextIdx].focusedNode);
  };

  const toggleBranch = (branch: 'commercial' | 'ai_support' | 'field') => {
    setExpandedBranches((prev) => ({ ...prev, [branch]: !prev[branch] }));
  };

  const getNodeCardClasses = (id: TreeNodeId) => {
    const isSelected = selectedNodeId === id;
    const isActive = isNodeHighlighted(id);
    if (isSelected) {
      return 'border-[#0284C7] bg-[#E6F4F9] ring-2 ring-[#0284C7]/25 shadow-sm';
    }
    if (isActive) {
      return 'border-[#B8C9D3] bg-white hover:border-[#0284C7]';
    }
    return 'border-[#E2EBF0] bg-[#F8FAFC] opacity-45 hover:opacity-80';
  };

  return (
    <div className="space-y-5">
      {/* Top Controls Bar: Mode Filter + Flow Simulation */}
      <div className="flex flex-col gap-3 rounded-[14px] border border-[#D8E3E9] bg-white p-3.5 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid grid-cols-2 gap-1.5 sm:inline-flex sm:flex-wrap sm:rounded-[10px] sm:border sm:border-[#D8E3E9] sm:bg-[#F5F8FA] sm:p-1">
          {FOCUS_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => handleSelectMode(m.id)}
              className={`min-h-[40px] rounded-[8px] px-2.5 py-2 text-xs font-semibold transition whitespace-nowrap truncate sm:min-h-0 sm:px-3 ${
                focusMode === m.id && simStepIndex === null
                  ? 'bg-[#17324D] text-white'
                  : 'bg-[#F5F8FA] text-[#526675] hover:text-[#17324D] sm:bg-transparent'
              }`}
            >
              <span className="sm:hidden">{m.mobileLabel}</span>
              <span className="hidden sm:inline">{m.label}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="button"
            onClick={handleAdvanceSimulation}
            className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[9px] bg-[#0284C7] px-3.5 text-xs font-semibold text-white transition hover:bg-[#0369A1] whitespace-nowrap sm:h-9 sm:w-auto"
          >
            <Play className="h-3.5 w-3.5 shrink-0" />
            <span>
              {simStepIndex === null
                ? 'Simulasikan Alur Bisnis'
                : `Lanjut Tahap ${((simStepIndex + 1) % SIMULATION_STEPS.length) + 1}/5`}
            </span>
          </button>
          {simStepIndex !== null && (
            <button
              type="button"
              onClick={() => setSimStepIndex(null)}
              className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[9px] border border-[#D8E3E9] bg-[#F5F8FA] px-3 text-xs font-semibold text-[#526675] hover:text-[#17324D] sm:h-9 sm:w-auto"
            >
              <RotateCcw className="h-3.5 w-3.5 shrink-0" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Simulation Banner */}
      {activeSim && (
        <div className="rounded-[12px] border border-[#87CEEB] bg-[#E6F4F9] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono-tabular text-xs font-bold text-[#0284C7]">
              {activeSim.title}
            </p>
            <div className="flex items-center gap-1">
              {SIMULATION_STEPS.map((s, idx) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => {
                    setSimStepIndex(idx);
                    setSelectedNodeId(s.focusedNode);
                  }}
                  aria-label={`Pilih tahap simulasi ${s.step}`}
                  className={`h-2.5 rounded-full transition-all ${
                    idx === simStepIndex
                      ? 'w-6 bg-[#0284C7]'
                      : 'w-2.5 bg-[#B8C9D3] hover:bg-[#5F879E]'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[#17324D] sm:text-sm">
            {activeSim.desc}
          </p>
        </div>
      )}

      {/* Main Layout: Structural Tree (8 cols) + Node & Collaboration Inspector (4 cols) */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        {/* LEFT: Interactive Structural Tree Canvas */}
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 sm:p-6 lg:col-span-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#EAF2F6] pb-3">
            <div>
              <p className="text-xs font-bold text-[#17324D]">
                Peta Kolaborasi Tim &amp; Peran Bisnis Agentzy
              </p>
              <p className="text-[11px] text-[#526675]">
                Klik setiap kotak peran untuk melihat tugas, manfaat bisnis, &amp; cara kerja samanya
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[#526675]">
              <span>Sales &amp; Affiliate</span>
              <span aria-hidden="true">·</span>
              <span>Asisten AI</span>
              <span aria-hidden="true">·</span>
              <span>Teknisi Lapangan</span>
            </div>
          </div>

          {/* DESKTOP / TABLET HIERARCHICAL TREE (md and up) */}
          <div className="hidden md:block">
            {/* Level 1: Root Node */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setSelectedNodeId('tenant_core')}
                className={`w-full max-w-md rounded-[12px] border p-3.5 text-left transition ${getNodeCardClasses('tenant_core')}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#17324D] text-white">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#17324D]">
                        {TREE_NODES.tenant_core.title}
                      </p>
                      <p className="text-[11px] text-[#526675]">
                        {TREE_NODES.tenant_core.roleTag}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono-tabular text-[11px] font-semibold text-[#0284C7]">
                    Mitra
                  </span>
                </div>
              </button>
            </div>

            {/* SVG Tree Trunk & 3-Branch Orthogonal Connectors */}
            <div className="mx-auto w-full px-6" aria-hidden="true">
              <svg viewBox="0 0 900 54" className="h-12 w-full overflow-visible">
                <line
                  x1="450"
                  y1="0"
                  x2="450"
                  y2="24"
                  stroke="#0284C7"
                  strokeWidth="2"
                />
                <line
                  x1="150"
                  y1="24"
                  x2="750"
                  y2="24"
                  stroke="#B8C9D3"
                  strokeWidth="2"
                />
                <line
                  x1="150"
                  y1="24"
                  x2="150"
                  y2="54"
                  stroke={isNodeHighlighted('staff_sales') ? '#0284C7' : '#D8E3E9'}
                  strokeWidth={isNodeHighlighted('staff_sales') ? '2.5' : '1.5'}
                />
                <line
                  x1="450"
                  y1="24"
                  x2="450"
                  y2="54"
                  stroke={isNodeHighlighted('ai_sales_marketing') ? '#0284C7' : '#D8E3E9'}
                  strokeWidth={isNodeHighlighted('ai_sales_marketing') ? '2.5' : '1.5'}
                />
                <line
                  x1="750"
                  y1="24"
                  x2="750"
                  y2="54"
                  stroke={isNodeHighlighted('technician_lead') ? '#247A55' : '#D8E3E9'}
                  strokeWidth={isNodeHighlighted('technician_lead') ? '2.5' : '1.5'}
                />
                <circle cx="150" cy="24" r="3.5" fill="#0284C7" />
                <circle cx="450" cy="24" r="3.5" fill="#0284C7" />
                <circle cx="750" cy="24" r="3.5" fill="#247A55" />
              </svg>
            </div>

            {/* Level 2 & Level 3: 3 Primary Pillars */}
            <div className="grid grid-cols-3 gap-4 items-start">
              {/* BRANCH 1: STAFF SALES & AFFILIATE */}
              <div className="space-y-2.5">
                <div className={`rounded-[12px] border p-3.5 transition ${getNodeCardClasses('staff_sales')}`}>
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId('staff_sales')}
                      className="flex items-start gap-2.5 text-left flex-1 min-w-0"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#0284C7] text-white">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#17324D]">
                          Staff Sales Agentzy
                        </p>
                        <p className="text-[11px] text-[#526675]">
                          Penjualan · Pembina Affiliate
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleBranch('commercial')}
                      aria-label="Buka atau tutup cabang Staff Sales"
                      className="rounded-md p-1 text-[#526675] hover:bg-[#EAF2F6]"
                    >
                      {expandedBranches.commercial ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {expandedBranches.commercial && (
                  <div className="ml-3 space-y-2.5 border-l border-[#D8E3E9] pl-3">
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId('sales_personal')}
                      className={`w-full rounded-[10px] border p-3 text-left transition ${getNodeCardClasses('sales_personal')}`}
                    >
                      <p className="text-xs font-bold text-[#17324D]">
                        Penjualan Langsung
                      </p>
                      <p className="mt-0.5 font-mono-tabular text-[11px] text-[#526675]">
                        100% Komisi · Tier Pro &amp; Elite
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedNodeId('affiliate_leaf')}
                      className={`w-full rounded-[10px] border p-3 text-left transition ${getNodeCardClasses('affiliate_leaf')}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-[#17324D]">
                          Affiliate Freelance
                        </p>
                        <span className="font-mono-tabular text-[10px] font-bold text-[#247A55]">
                          60%
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-[#526675]">
                        Mitra promosi · Sebar info &amp; setor prospek
                      </p>
                    </button>
                  </div>
                )}
              </div>

              {/* BRANCH 2: DUKUNGAN AI PER PERAN */}
              <div className="space-y-2.5">
                <div className={`rounded-[12px] border p-3.5 transition ${getNodeCardClasses('ai_sales_marketing')}`}>
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId('ai_sales_marketing')}
                      className="flex items-start gap-2.5 text-left flex-1 min-w-0"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#17324D] text-white">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#17324D]">
                          AI Sales &amp; Affiliate
                        </p>
                        <p className="text-[11px] text-[#526675]">
                          Digital Marketing &amp; Konten
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleBranch('ai_support')}
                      aria-label="Buka atau tutup cabang Dukungan AI"
                      className="rounded-md p-1 text-[#526675] hover:bg-[#EAF2F6]"
                    >
                      {expandedBranches.ai_support ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {expandedBranches.ai_support && (
                  <div className="ml-3 space-y-2.5 border-l border-[#D8E3E9] pl-3">
                    <div className="rounded-[10px] border border-dashed border-[#87CEEB] bg-[#E6F4F9]/55 p-2.5 text-[11px] text-[#245477]">
                      <span className="font-semibold text-[#17324D]">
                        Untuk Sales &amp; Affiliate:
                      </span>{' '}
                      Generate konten, caption sosmed, iklan digital, &amp; cari leads
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedNodeId('ai_tech_ops')}
                      className={`w-full rounded-[10px] border p-3 text-left transition ${getNodeCardClasses('ai_tech_ops')}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Bot className="h-3.5 w-3.5 text-[#247A55]" />
                          <p className="text-xs font-bold text-[#17324D]">
                            AI Operasional Teknisi
                          </p>
                        </div>
                        <span className="font-mono-tabular text-[10px] font-bold text-[#247A55]">
                          Teknis
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-[#526675]">
                        Khusus jadwal, rute kunjungan, &amp; panduan teknis
                      </p>
                    </button>
                  </div>
                )}
              </div>

              {/* BRANCH 3: FIELD TECHNICIAN */}
              <div className="space-y-2.5">
                <div className={`rounded-[12px] border p-3.5 transition ${getNodeCardClasses('technician_lead')}`}>
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId('technician_lead')}
                      className="flex items-start gap-2.5 text-left flex-1 min-w-0"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#247A55] text-white">
                        <Wrench className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#17324D]">
                          Teknisi Lapangan
                        </p>
                        <p className="text-[11px] text-[#526675]">
                          Instalasi · Perawatan · SLA
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleBranch('field')}
                      aria-label="Buka atau tutup cabang Teknisi"
                      className="rounded-md p-1 text-[#526675] hover:bg-[#EAF2F6]"
                    >
                      {expandedBranches.field ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {expandedBranches.field && (
                  <div className="ml-3 space-y-2.5 border-l border-[#D8E3E9] pl-3">
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId('tech_dispatch')}
                      className={`w-full rounded-[10px] border p-3 text-left transition ${getNodeCardClasses('tech_dispatch')}`}
                    >
                      <p className="text-xs font-bold text-[#17324D]">
                        Jadwal, Rute &amp; Material
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#526675]">
                        Rute kunjungan optimal &amp; kesiapan perangkat
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedNodeId('tech_execution')}
                      className={`w-full rounded-[10px] border p-3 text-left transition ${getNodeCardClasses('tech_execution')}`}
                    >
                      <p className="text-xs font-bold text-[#17324D]">
                        Eksekusi &amp; Panduan Teknis
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#526675]">
                        Pemasangan rapi, uji kualitas &amp; berita acara
                      </p>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* SVG Convergence Connectors to Growth & Settlement */}
            <div className="mx-auto w-full px-6" aria-hidden="true">
              <svg viewBox="0 0 900 44" className="h-10 w-full overflow-visible">
                <line
                  x1="150"
                  y1="0"
                  x2="150"
                  y2="20"
                  stroke={isNodeHighlighted('growth_settlement') ? '#0284C7' : '#D8E3E9'}
                  strokeWidth="2"
                />
                <line
                  x1="450"
                  y1="0"
                  x2="450"
                  y2="20"
                  stroke={isNodeHighlighted('growth_settlement') ? '#0284C7' : '#D8E3E9'}
                  strokeWidth="2"
                />
                <line
                  x1="750"
                  y1="0"
                  x2="750"
                  y2="20"
                  stroke={isNodeHighlighted('growth_settlement') ? '#247A55' : '#D8E3E9'}
                  strokeWidth="2"
                />
                <line
                  x1="150"
                  y1="20"
                  x2="750"
                  y2="20"
                  stroke="#B8C9D3"
                  strokeWidth="2"
                />
                <line
                  x1="450"
                  y1="20"
                  x2="450"
                  y2="44"
                  stroke={isNodeHighlighted('growth_settlement') ? '#247A55' : '#B8C9D3'}
                  strokeWidth="2.5"
                />
                <circle cx="450" cy="20" r="3.5" fill="#247A55" />
              </svg>
            </div>

            {/* Level 4: Convergence Node */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setSelectedNodeId('growth_settlement')}
                className={`w-full max-w-xl rounded-[12px] border p-3.5 text-left transition ${getNodeCardClasses('growth_settlement')}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#247A55] text-white">
                      <Wallet className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#17324D]">
                        {TREE_NODES.growth_settlement.title}
                      </p>
                      <p className="text-[11px] text-[#526675]">
                        Pelanggan Aktif → Pertumbuhan Mitra · 60% Affiliate / 40% Staff Sales + Insentif Teknisi
                      </p>
                    </div>
                  </div>
                  <span className="font-mono-tabular text-[11px] font-bold text-[#247A55]">
                    Bagi Hasil
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* MOBILE INTERACTIVE COLLAPSIBLE STRUCTURAL TREE (< md) */}
          <div className="space-y-3 md:hidden">
            {/* Root */}
            <button
              type="button"
              onClick={() => setSelectedNodeId('tenant_core')}
              className={`w-full rounded-[12px] border p-3 text-left transition ${getNodeCardClasses('tenant_core')}`}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#17324D] text-white">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#17324D]">
                    {TREE_NODES.tenant_core.title}
                  </p>
                  <p className="text-[11px] text-[#526675]">
                    Kerja Sama Mitra, Tim Terkelola &amp; Laporan Transparan
                  </p>
                </div>
              </div>
            </button>

            <div className="ml-3 space-y-3 border-l border-[#D8E3E9] pl-3">
              {/* Branch 1 Mobile */}
              <div className="space-y-2">
                <div className={`rounded-[11px] border p-3 transition ${getNodeCardClasses('staff_sales')}`}>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId('staff_sales')}
                      className="flex items-center gap-2 text-left flex-1"
                    >
                      <Briefcase className="h-4 w-4 shrink-0 text-[#0284C7]" />
                      <div>
                        <p className="text-xs font-bold text-[#17324D]">
                          Staff Sales Agentzy
                        </p>
                        <p className="text-[11px] text-[#526675]">
                          Penjualan langsung &amp; pembina affiliate
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleBranch('commercial')}
                      aria-label="Toggle cabang Staff Sales"
                      className="p-1 text-[#526675]"
                    >
                      {expandedBranches.commercial ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                {expandedBranches.commercial && (
                  <div className="ml-3 space-y-2 border-l border-[#D8E3E9] pl-3">
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId('sales_personal')}
                      className={`w-full rounded-[10px] border p-2.5 text-left ${getNodeCardClasses('sales_personal')}`}
                    >
                      <p className="text-xs font-bold text-[#17324D]">
                        Penjualan Langsung (100% Komisi)
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId('affiliate_leaf')}
                      className={`w-full rounded-[10px] border p-2.5 text-left ${getNodeCardClasses('affiliate_leaf')}`}
                    >
                      <p className="text-xs font-bold text-[#17324D]">
                        Affiliate Freelance (Bagi Hasil 60%)
                      </p>
                    </button>
                  </div>
                )}
              </div>

              {/* Branch 2 Mobile */}
              <div className="space-y-2">
                <div className={`rounded-[11px] border p-3 transition ${getNodeCardClasses('ai_sales_marketing')}`}>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId('ai_sales_marketing')}
                      className="flex items-center gap-2 text-left flex-1"
                    >
                      <Bot className="h-4 w-4 shrink-0 text-[#17324D]" />
                      <div>
                        <p className="text-xs font-bold text-[#17324D]">
                          AI untuk Sales &amp; Affiliate
                        </p>
                        <p className="text-[11px] text-[#526675]">
                          Digital marketing, generate konten &amp; leads
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleBranch('ai_support')}
                      aria-label="Toggle cabang Dukungan AI"
                      className="p-1 text-[#526675]"
                    >
                      {expandedBranches.ai_support ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                {expandedBranches.ai_support && (
                  <div className="ml-3 space-y-2 border-l border-[#D8E3E9] pl-3">
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId('ai_tech_ops')}
                      className={`w-full rounded-[10px] border p-2.5 text-left ${getNodeCardClasses('ai_tech_ops')}`}
                    >
                      <p className="text-xs font-bold text-[#17324D]">
                        AI untuk Teknisi (Operasional &amp; Teknis)
                      </p>
                    </button>
                  </div>
                )}
              </div>

              {/* Branch 3 Mobile */}
              <div className="space-y-2">
                <div className={`rounded-[11px] border p-3 transition ${getNodeCardClasses('technician_lead')}`}>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId('technician_lead')}
                      className="flex items-center gap-2 text-left flex-1"
                    >
                      <Wrench className="h-4 w-4 shrink-0 text-[#247A55]" />
                      <div>
                        <p className="text-xs font-bold text-[#17324D]">
                          Teknisi Lapangan Profesional
                        </p>
                        <p className="text-[11px] text-[#526675]">
                          Instalasi, perawatan &amp; jaminan layanan
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleBranch('field')}
                      aria-label="Toggle cabang Teknisi"
                      className="p-1 text-[#526675]"
                    >
                      {expandedBranches.field ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                {expandedBranches.field && (
                  <div className="ml-3 space-y-2 border-l border-[#D8E3E9] pl-3">
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId('tech_dispatch')}
                      className={`w-full rounded-[10px] border p-2.5 text-left ${getNodeCardClasses('tech_dispatch')}`}
                    >
                      <p className="text-xs font-bold text-[#17324D]">
                        Penjadwalan Rute &amp; Material
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId('tech_execution')}
                      className={`w-full rounded-[10px] border p-2.5 text-left ${getNodeCardClasses('tech_execution')}`}
                    >
                      <p className="text-xs font-bold text-[#17324D]">
                        Eksekusi &amp; Panduan Teknis Lapangan
                      </p>
                    </button>
                  </div>
                )}
              </div>

              {/* Convergence Mobile */}
              <button
                type="button"
                onClick={() => setSelectedNodeId('growth_settlement')}
                className={`w-full rounded-[11px] border p-3 text-left ${getNodeCardClasses('growth_settlement')}`}
              >
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 shrink-0 text-[#247A55]" />
                  <div>
                    <p className="text-xs font-bold text-[#17324D]">
                      Pertumbuhan Bisnis &amp; Bagi Hasil
                    </p>
                    <p className="text-[11px] text-[#526675]">
                      60% Affiliate / 40% Staff Sales + Insentif Teknisi
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Live Selected Node & Collaboration Inspector */}
        <div
          id="universe-inspector"
          className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 sm:p-5 lg:col-span-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-[#EAF2F6] pb-3">
            <span className="text-xs font-semibold text-[#0284C7]">
              Detail Peran &amp; Manfaat
            </span>
            <span className="text-[11px] font-medium text-[#526675]">
              {selectedNode.roleTag}
            </span>
          </div>

          <h3 className="mt-3 text-lg font-bold text-[#17324D]">
            {selectedNode.title}
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-[#526675] sm:text-sm">
            {selectedNode.summary}
          </p>

          {/* Ruang Lingkup & Kendali */}
          <div className="mt-4 rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#17324D]">
              <ShieldCheck className="h-4 w-4 text-[#0284C7]" />
              <span>Fokus Kerja &amp; Kendali</span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-[#526675]">
              {selectedNode.authorityBoundary}
            </p>
          </div>

          {/* Jalur Kolaborasi Aktif */}
          <div className="mt-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#17324D]">
              <GitBranch className="h-4 w-4 text-[#247A55]" />
              <span>Sinergi dengan Peran Lain</span>
            </div>
            <div className="mt-2 space-y-2">
              {selectedNode.collaboratesWith.map((col) => (
                <div
                  key={col.target}
                  className="rounded-[9px] border border-[#EAF2F6] bg-[#F8FBFD] px-3 py-2 text-xs"
                >
                  <p className="font-bold text-[#17324D]">{col.target}</p>
                  <p className="mt-0.5 text-[11px] text-[#526675]">
                    {col.protocol}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Keunggulan Operasional */}
          <div className="mt-4 border-t border-[#EAF2F6] pt-3.5">
            <p className="text-xs font-bold text-[#17324D]">
              Nilai Tambah Kemitraan
            </p>
            <ul className="mt-2 space-y-1.5">
              {selectedNode.rules.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2 text-xs leading-relaxed text-[#526675]"
                >
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#247A55]" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
