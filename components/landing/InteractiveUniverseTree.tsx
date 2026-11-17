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
  | 'human_ai'
  | 'tech_ecosystem';

export type TreeNodeId =
  | 'tenant_core'
  | 'sales_resmi'
  | 'sales_personal'
  | 'affiliate_leaf'
  | 'support_human'
  | 'staff_ai'
  | 'technician_lead'
  | 'tech_dispatch'
  | 'tech_execution'
  | 'commission_ledger';

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
    title: 'Inti Tenant & Tata Kelola Agentzy',
    roleTag: 'Corporate Partner · Super Admin · RLS',
    category: 'core',
    parentId: null,
    focusGroups: ['all', 'sales_affiliate', 'human_ai', 'tech_ecosystem'],
    summary:
      'Pusat kendali kontrak layanan (SOW), isolasi data multi-tenant, konfigurasi skema insentif ISP Partner, serta pencatatan audit trail seluruh peran manusia dan AI.',
    authorityBoundary:
      'Mengatur hak akses RBAC/ABAC, anggaran AI Credits, dan menyetujui aturan komisi resmi sebelum berlaku ke portal workforce.',
    collaboratesWith: [
      { target: 'Sales Agentzy', protocol: 'Target SA · Wilayah · Skema Tier' },
      { target: 'Support Staff & Staff AI', protocol: 'Kebijakan Otonomi L0–L4 & Audit' },
      { target: 'Teknisi Lapangan', protocol: 'Standar SLA & Kepatuhan K3' },
    ],
    rules: [
      'Isolasi data ketat per perusahaan mitra (Row-Level Security)',
      'Pemisahan jelas antara biaya SaaS Platform dan Managed Services',
      'Jejak audit append-only untuk seluruh keputusan human maupun AI',
    ],
  },
  sales_resmi: {
    id: 'sales_resmi',
    title: 'Sales Agentzy (Sales Resmi)',
    roleTag: 'Pilar Komersial · Training / Pro / Elite',
    category: 'commercial',
    parentId: 'tenant_core',
    focusGroups: ['all', 'sales_affiliate', 'tech_ecosystem'],
    summary:
      'Tenaga penjualan resmi Agentzy yang menangani closing pelanggan langsung sekaligus berperan sebagai sponsor pembina bagi mitra Affiliate Freelance.',
    authorityBoundary:
      'Berhak merekrut Affiliate Freelance, mengajukan aktivasi affiliate, dan mengelola pipeline hingga order tervalidasi.',
    collaboratesWith: [
      { target: 'Affiliate Freelance', protocol: 'Pembinaan & Bagi Hasil 40% Inkremental' },
      { target: 'Staff AI Qualification', protocol: 'Cek Cakupan ODP & Ringkasan Prospek' },
      { target: 'Teknisi Lapangan', protocol: 'Koordinasi Jadwal Instalasi Pelanggan' },
    ],
    rules: [
      'Tier karir Training (OJT), Pro, dan Elite dihitung dari gabungan SA pribadi + affiliate',
      'Memperoleh 100% basis SA pribadi dan 40% porsi inkremental dari aktivasi affiliate',
      'Terhubung ke Google Calendar, Meet, dan Gmail untuk tindak lanjut prospek',
    ],
  },
  sales_personal: {
    id: 'sales_personal',
    title: 'Pipeline Penjualan Langsung',
    roleTag: 'Cabang Sales · 100% Atribusi Pribadi',
    category: 'commercial',
    parentId: 'sales_resmi',
    focusGroups: ['all', 'sales_affiliate'],
    summary:
      'Akuisisi prospek residensial maupun korporasi yang ditangani langsung oleh Sales Agentzy dari konsultasi paket hingga closing order.',
    authorityBoundary:
      'Seluruh unit produktivitas (SA) dari jalur ini diatribusikan penuh ke akun Sales Agentzy terkait.',
    collaboratesWith: [
      { target: 'Staff AI', protocol: 'Skoring Kelengkapan Data & Promo Aktif' },
      { target: 'Commission Ledger', protocol: '100% Kredit SA + Bonus Tier' },
    ],
    rules: [
      'Mengikuti siklus 10 tahap: Lead Created hingga Commission Settled',
      'Dukungan pengingat tindak lanjut otomatis via Google Calendar',
    ],
  },
  affiliate_leaf: {
    id: 'affiliate_leaf',
    title: 'Affiliate Freelance',
    roleTag: 'Mitra Akuisisi · Node Akhir (60% Komisi)',
    category: 'commercial',
    parentId: 'sales_resmi',
    focusGroups: ['all', 'sales_affiliate'],
    summary:
      'Mitra independen yang direkrut oleh Sales Agentzy untuk mengirimkan prospek pelanggan. Fokus pada pengiriman lead berkualitas dan pemantauan aktivasi.',
    authorityBoundary:
      'Tidak memiliki akses merekrut downline affiliate, tidak memiliki tier karir Training/Pro/Elite, dan tidak terikat absensi shift.',
    collaboratesWith: [
      { target: 'Sales Agentzy (Sponsor)', protocol: 'Pendampingan Closing & Split 60/40' },
      { target: 'Commission Ledger', protocol: 'Penerima Porsi 60% Inkremental' },
    ],
    rules: [
      'Node akhir dalam struktur (tidak membentuk jaringan MLM/berjenjang)',
      'Hanya melihat data prospek pribadi dan simulator komisi 60%',
      'Pembayaran komisi dipicu setelah layanan berstatus aktif tervalidasi',
    ],
  },
  support_human: {
    id: 'support_human',
    title: 'Support Staff Agentzy (Human)',
    roleTag: 'Supervisor Operasional · Human-in-the-Loop',
    category: 'ai_support',
    parentId: 'tenant_core',
    focusGroups: ['all', 'human_ai', 'tech_ecosystem'],
    summary:
      'Tim operasional manusia yang memvalidasi kasus pengecualian, menyetujui draf aksi AI, melakukan eskalasi ke NOC mitra ISP, serta final Quality Control.',
    authorityBoundary:
      'Pemegang otoritas persetujuan kritis (Human Sign-off) sebelum order diproses atau pencairan komisi disahkan.',
    collaboratesWith: [
      { target: 'Staff AI Agentzy', protocol: 'Supervisi Tugas & Override Keputusan' },
      { target: 'Teknisi Lapangan', protocol: 'Asistensi Eskalasi Teknis & QC Berita Acara' },
      { target: 'Sales & Affiliate', protocol: 'Validasi Lead & Resolusi Dispute' },
    ],
    rules: [
      'Meninjau peringatan dini SLA dan mengoordinasikan penjadwalan ulang',
      'Memverifikasi 4 foto bukti kerja dan hasil speedtest teknisi',
      'Selalu menerima ringkasan konteks lengkap saat handoff dari Staf AI',
    ],
  },
  staff_ai: {
    id: 'staff_ai',
    title: 'Staff AI Agentzy (AI Workers)',
    roleTag: 'AI Gateway · Otonomi Terukur L0–L4',
    category: 'ai_support',
    parentId: 'support_human',
    focusGroups: ['all', 'human_ai', 'sales_affiliate', 'tech_ecosystem'],
    summary:
      'Tenaga kerja digital berkontrak tugas di bawah pengawasan Support Staff Human. Menjalankan pra-kualifikasi lead, cek cakupan ODP, dan pengawasan SLA real-time.',
    authorityBoundary:
      'Beroperasi hanya melalui izin tool terdaftar dan dibatasi kuota AI Credits; tidak dapat mengubah aturan komisi secara sepihak.',
    collaboratesWith: [
      { target: 'Support Staff Human', protocol: 'Handoff Ringkasan & Permintaan Approval' },
      { target: 'Sales Agentzy', protocol: 'Kualifikasi Lead & Draf Materi Kampanye' },
      { target: 'Teknisi Lapangan', protocol: 'Assignment Berbasis Skill/Jarak & Monitor SLA' },
    ],
    rules: [
      'Memeriksa duplikasi prospek dan kesiapan port ODP dalam hitungan detik',
      'Memantau antrean sinkronisasi offline teknisi tanpa henti',
      'Memastikan memori & RAG terisolasi per tenant mitra',
    ],
  },
  technician_lead: {
    id: 'technician_lead',
    title: 'Teknisi Lapangan (FTTH / FWA)',
    roleTag: 'Pilar Eksekusi Fisik · Mode Offline Ready',
    category: 'field',
    parentId: 'tenant_core',
    focusGroups: ['all', 'tech_ecosystem', 'human_ai'],
    summary:
      'Staf teknisi bersertifikat K3 yang mengeksekusi instalasi baru, survei ODP, pemeliharaan, dan troubleshooting jaringan di lokasi pelanggan.',
    authorityBoundary:
      'Mengeksekusi Work Order sesuai radius absensi GPS, SOP 7-langkah, dan standar mutu jaringan hingga Berita Acara digital ditandatangani.',
    collaboratesWith: [
      { target: 'AI Dispatch & Support Staff', protocol: 'Penerimaan WO & Eskalasi Lapangan' },
      { target: 'Sales Agentzy', protocol: 'Konfirmasi Jadwal & Kesiapan Pemasangan' },
      { target: 'Commission Ledger', protocol: 'Insentif SLA & Bonus First-Time-Fix' },
    ],
    rules: [
      'Navigasi langsung ke lokasi pelanggan via Google Maps',
      'Checklist SOP wajib, uji speedtest, 4 foto bukti, dan tanda tangan digital',
      'Antrean data tetap tersimpan aman saat sinyal lapangan terputus',
    ],
  },
  tech_dispatch: {
    id: 'tech_dispatch',
    title: 'AI Dispatch & Persiapan Material',
    roleTag: 'Cabang Teknisi · Google Maps & Inventaris',
    category: 'field',
    parentId: 'technician_lead',
    focusGroups: ['all', 'tech_ecosystem', 'human_ai'],
    summary:
      'Penyaluran Work Order otomatis berdasarkan kecocokan keahlian FTTH/FWA, jarak terdekat, kapasitas shift, dan ketersediaan perangkat ONT di gudang.',
    authorityBoundary:
      'Support Staff dapat mengubah penugasan kapan saja jika terdapat permintaan prioritas mendesak.',
    collaboratesWith: [
      { target: 'Staff AI Agentzy', protocol: 'Kalkulasi Rute & Prediksi Estimasi Tiba' },
      { target: 'Support Staff Human', protocol: 'Penyesuaian Prioritas SLA' },
    ],
    rules: [
      'Verifikasi stok ONT, kabel FO dropcore, konektor SC, dan splitter',
      'Rute kunjungan optimal langsung dibuka melalui Google Maps',
    ],
  },
  tech_execution: {
    id: 'tech_execution',
    title: 'Eksekusi 7-Langkah & Berita Acara',
    roleTag: 'Cabang Teknisi · SOP, Speedtest & TTD',
    category: 'field',
    parentId: 'technician_lead',
    focusGroups: ['all', 'tech_ecosystem'],
    summary:
      'Alur kerja lapangan terstruktur mulai dari check-in lokasi, survey ODP, checklist instalasi, speedtest, dokumentasi foto, hingga tanda tangan pelanggan.',
    authorityBoundary:
      'Work Order baru dinyatakan selesai setelah hasil speedtest memenuhi paket dan disetujui QC Supervisor.',
    collaboratesWith: [
      { target: 'Support Staff QC', protocol: 'Verifikasi Foto & Parameter Redaman Optik' },
      { target: 'Commission Ledger', protocol: 'Pemicu Aktivasi Order & Insentif' },
    ],
    rules: [
      'Mengunci akurasi bukti digital sebelum status order berubah menjadi Activated',
      'Sinkronisasi otomatis ke portal saat koneksi internet pulih',
    ],
  },
  commission_ledger: {
    id: 'commission_ledger',
    title: 'QC Final & Commission Ledger',
    roleTag: 'Konvergensi Akhir · Deterministik & Terukur',
    category: 'ledger',
    parentId: 'tenant_core',
    focusGroups: ['all', 'sales_affiliate', 'human_ai', 'tech_ecosystem'],
    summary:
      'Titik temu seluruh kolaborasi: aktivasi layanan yang terverifikasi Support Staff dan AI Auditor langsung menghitung pembagian komisi secara deterministik.',
    authorityBoundary:
      'Perhitungan ledger tidak dapat dimanipulasi manual; setiap penyesuaian memerlukan persetujuan audit dan Finance.',
    collaboratesWith: [
      { target: 'Affiliate Freelance', protocol: 'Kredit 60% Komisi Inkremental' },
      { target: 'Sales Agentzy', protocol: 'Kredit 100% Pribadi + 40% Share + Bonus Tier' },
      { target: 'Teknisi Lapangan', protocol: 'Kredit Komisi Instalasi + Insentif SLA' },
    ],
    rules: [
      'Sumber kebenaran tunggal untuk statement komisi & rekonsiliasi invoice mitra',
      'Status Commission Eligible terbuka otomatis saat Berita Acara lulus QC',
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
    title: '01 · Akuisisi Prospek oleh Affiliate / Sales',
    desc: 'Affiliate Freelance (atau Sales Agentzy) menginput prospek pelanggan baru lengkap dengan alamat pemasangan dan paket minat.',
    activeNodes: ['sales_resmi', 'affiliate_leaf', 'sales_personal'],
    focusedNode: 'affiliate_leaf',
  },
  {
    step: 2,
    title: '02 · Kualifikasi Staff AI & Validasi Support Staff',
    desc: 'Staff AI mengecek kelengkapan data dan port ODP secara otomatis, lalu Support Staff Human menyetujui kelayakan komersial menjadi Order.',
    activeNodes: ['sales_resmi', 'staff_ai', 'support_human'],
    focusedNode: 'staff_ai',
  },
  {
    step: 3,
    title: '03 · AI Dispatch & Persiapan Teknisi Lapangan',
    desc: 'Staff AI bersama Support Staff menugaskan Work Order ke Teknisi FTTH terdekat lengkap dengan rute Google Maps dan alokasi material ONT.',
    activeNodes: ['support_human', 'staff_ai', 'technician_lead', 'tech_dispatch'],
    focusedNode: 'tech_dispatch',
  },
  {
    step: 4,
    title: '04 · Eksekusi 7-Langkah & Monitoring SLA Real-Time',
    desc: 'Teknisi melakukan check-in GPS, checklist SOP, speedtest, foto bukti, dan tanda tangan pelanggan sementara AI memantau kepatuhan SLA.',
    activeNodes: ['technician_lead', 'tech_execution', 'staff_ai', 'support_human'],
    focusedNode: 'tech_execution',
  },
  {
    step: 5,
    title: '05 · QC Sign-off & Pembagian Komisi Deterministik',
    desc: 'Support Staff menyelesaikan QC Berita Acara dan Commission Ledger langsung membagi 60% Affiliate, 40% Sales + SA Tier, serta insentif SLA Teknisi.',
    activeNodes: [
      'support_human',
      'commission_ledger',
      'affiliate_leaf',
      'sales_resmi',
      'technician_lead',
    ],
    focusedNode: 'commission_ledger',
  },
];

const FOCUS_MODES: Array<{ id: UniverseFocusMode; label: string }> = [
  { id: 'all', label: 'Semua Universe' },
  { id: 'sales_affiliate', label: 'Sales ↔ Affiliate' },
  { id: 'human_ai', label: 'Human ↔ Staf AI' },
  { id: 'tech_ecosystem', label: 'Teknisi ↔ Lintas Peran' },
];

export function InteractiveUniverseTree() {
  const [focusMode, setFocusMode] = useState<UniverseFocusMode>('all');
  const [selectedNodeId, setSelectedNodeId] = useState<TreeNodeId>('sales_resmi');
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
    } else if (mode === 'human_ai') {
      setExpandedBranches((p) => ({ ...p, ai_support: true }));
      setSelectedNodeId('staff_ai');
    } else if (mode === 'tech_ecosystem') {
      setExpandedBranches((p) => ({ ...p, field: true }));
      setSelectedNodeId('technician_lead');
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
              className={`rounded-[8px] px-3 py-2 text-xs font-semibold transition whitespace-nowrap ${
                focusMode === m.id && simStepIndex === null
                  ? 'bg-[#17324D] text-white'
                  : 'bg-[#F5F8FA] text-[#526675] hover:text-[#17324D] sm:bg-transparent'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleAdvanceSimulation}
            className="inline-flex h-9 items-center gap-1.5 rounded-[9px] bg-[#0284C7] px-3.5 text-xs font-semibold text-white transition hover:bg-[#0369A1] whitespace-nowrap"
          >
            <Play className="h-3.5 w-3.5" />
            <span>
              {simStepIndex === null
                ? 'Simulasikan Alur Order'
                : `Lanjut Tahap ${((simStepIndex + 1) % SIMULATION_STEPS.length) + 1}/5`}
            </span>
          </button>
          {simStepIndex !== null && (
            <button
              type="button"
              onClick={() => setSimStepIndex(null)}
              className="inline-flex h-9 items-center gap-1.5 rounded-[9px] border border-[#D8E3E9] bg-[#F5F8FA] px-3 text-xs font-semibold text-[#526675] hover:text-[#17324D]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
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
                Pohon Struktur Universe Interaktif
              </p>
              <p className="text-[11px] text-[#526675]">
                Klik simpul peran untuk meninjau wewenang, batasan, &amp; jalur kolaborasi
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[#526675]">
              <span>Pilar Komersial</span>
              <span aria-hidden="true">·</span>
              <span>Human &amp; AI</span>
              <span aria-hidden="true">·</span>
              <span>Operasional Teknisi</span>
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
                    Root
                  </span>
                </div>
              </button>
            </div>

            {/* SVG Tree Trunk & 3-Branch Orthogonal Connectors */}
            <div className="mx-auto w-full px-6" aria-hidden="true">
              <svg viewBox="0 0 900 54" className="h-12 w-full overflow-visible">
                {/* Vertical Trunk from Root */}
                <line
                  x1="450"
                  y1="0"
                  x2="450"
                  y2="24"
                  stroke="#0284C7"
                  strokeWidth="2"
                />
                {/* Horizontal Distribution Bus */}
                <line
                  x1="150"
                  y1="24"
                  x2="750"
                  y2="24"
                  stroke="#B8C9D3"
                  strokeWidth="2"
                />
                {/* Left Drop: Sales */}
                <line
                  x1="150"
                  y1="24"
                  x2="150"
                  y2="54"
                  stroke={
                    isNodeHighlighted('sales_resmi') ? '#0284C7' : '#D8E3E9'
                  }
                  strokeWidth={isNodeHighlighted('sales_resmi') ? '2.5' : '1.5'}
                />
                {/* Center Drop: Support & AI */}
                <line
                  x1="450"
                  y1="24"
                  x2="450"
                  y2="54"
                  stroke={
                    isNodeHighlighted('support_human') ? '#0284C7' : '#D8E3E9'
                  }
                  strokeWidth={isNodeHighlighted('support_human') ? '2.5' : '1.5'}
                />
                {/* Right Drop: Teknisi */}
                <line
                  x1="750"
                  y1="24"
                  x2="750"
                  y2="54"
                  stroke={
                    isNodeHighlighted('technician_lead') ? '#247A55' : '#D8E3E9'
                  }
                  strokeWidth={
                    isNodeHighlighted('technician_lead') ? '2.5' : '1.5'
                  }
                />
                <circle cx="150" cy="24" r="3.5" fill="#0284C7" />
                <circle cx="450" cy="24" r="3.5" fill="#0284C7" />
                <circle cx="750" cy="24" r="3.5" fill="#247A55" />
              </svg>
            </div>

            {/* Level 2 & Level 3: 3 Primary Pillars */}
            <div className="grid grid-cols-3 gap-4 items-start">
              {/* BRANCH 1: SALES & AFFILIATE */}
              <div className="space-y-2.5">
                <div className={`rounded-[12px] border p-3.5 transition ${getNodeCardClasses('sales_resmi')}`}>
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId('sales_resmi')}
                      className="flex items-start gap-2.5 text-left flex-1 min-w-0"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#0284C7] text-white">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#17324D]">
                          Sales Agentzy
                        </p>
                        <p className="text-[11px] text-[#526675]">
                          Sales Resmi · Pembina
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleBranch('commercial')}
                      aria-label="Buka atau tutup cabang Sales"
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
                  <div className="ml-4 space-y-2.5 border-l border-[#B8C9D3] pl-3.5">
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId('sales_personal')}
                      className={`w-full rounded-[10px] border p-3 text-left transition ${getNodeCardClasses('sales_personal')}`}
                    >
                      <p className="text-xs font-bold text-[#17324D]">
                        Penjualan Pribadi
                      </p>
                      <p className="mt-0.5 font-mono-tabular text-[11px] text-[#526675]">
                        100% Basis SA · Tier Pro/Elite
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
                        Node akhir · Kirim prospek (tanpa rekrutmen)
                      </p>
                    </button>
                  </div>
                )}
              </div>

              {/* BRANCH 2: SUPPORT HUMAN & STAFF AI */}
              <div className="space-y-2.5">
                <div className={`rounded-[12px] border p-3.5 transition ${getNodeCardClasses('support_human')}`}>
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId('support_human')}
                      className="flex items-start gap-2.5 text-left flex-1 min-w-0"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#17324D] text-white">
                        <Users className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#17324D]">
                          Support Staff Human
                        </p>
                        <p className="text-[11px] text-[#526675]">
                          Supervisor · Approval &amp; QC
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleBranch('ai_support')}
                      aria-label="Buka atau tutup cabang Support dan AI"
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
                  <div className="ml-4 space-y-2.5 border-l border-[#B8C9D3] pl-3.5">
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId('staff_ai')}
                      className={`w-full rounded-[10px] border p-3 text-left transition ${getNodeCardClasses('staff_ai')}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Bot className="h-3.5 w-3.5 text-[#0284C7]" />
                          <p className="text-xs font-bold text-[#17324D]">
                            Staff AI Agentzy
                          </p>
                        </div>
                        <span className="font-mono-tabular text-[10px] font-bold text-[#0284C7]">
                          L0–L4
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-[#526675]">
                        Pra-kualifikasi lead, cek ODP, &amp; monitor SLA
                      </p>
                    </button>

                    <div className="rounded-[10px] border border-dashed border-[#87CEEB] bg-[#E6F4F9]/50 p-2.5 text-[11px] text-[#245477]">
                      <span className="font-semibold text-[#17324D]">
                        Handoff Lintas Tim:
                      </span>{' '}
                      Menyambungkan order Sales/Affiliate ke jadwal Teknisi secara otomatis
                    </div>
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
                          FTTH/FWA · Offline Ready
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
                  <div className="ml-4 space-y-2.5 border-l border-[#B8C9D3] pl-3.5">
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId('tech_dispatch')}
                      className={`w-full rounded-[10px] border p-3 text-left transition ${getNodeCardClasses('tech_dispatch')}`}
                    >
                      <p className="text-xs font-bold text-[#17324D]">
                        AI Dispatch &amp; Material
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#526675]">
                        Rute Google Maps · Stok ONT &amp; FO
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedNodeId('tech_execution')}
                      className={`w-full rounded-[10px] border p-3 text-left transition ${getNodeCardClasses('tech_execution')}`}
                    >
                      <p className="text-xs font-bold text-[#17324D]">
                        Eksekusi 7-Langkah &amp; QC
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#526675]">
                        SOP, Speedtest, 4 Foto, TTD Digital
                      </p>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* SVG Convergence Connectors to Commission Ledger */}
            <div className="mx-auto w-full px-6" aria-hidden="true">
              <svg viewBox="0 0 900 44" className="h-10 w-full overflow-visible">
                <line
                  x1="150"
                  y1="0"
                  x2="150"
                  y2="20"
                  stroke={
                    isNodeHighlighted('commission_ledger') ? '#0284C7' : '#D8E3E9'
                  }
                  strokeWidth="2"
                />
                <line
                  x1="450"
                  y1="0"
                  x2="450"
                  y2="20"
                  stroke={
                    isNodeHighlighted('commission_ledger') ? '#0284C7' : '#D8E3E9'
                  }
                  strokeWidth="2"
                />
                <line
                  x1="750"
                  y1="0"
                  x2="750"
                  y2="20"
                  stroke={
                    isNodeHighlighted('commission_ledger') ? '#247A55' : '#D8E3E9'
                  }
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
                  stroke={
                    isNodeHighlighted('commission_ledger') ? '#247A55' : '#B8C9D3'
                  }
                  strokeWidth="2.5"
                />
                <circle cx="450" cy="20" r="3.5" fill="#247A55" />
              </svg>
            </div>

            {/* Level 4: Convergence Ledger */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setSelectedNodeId('commission_ledger')}
                className={`w-full max-w-xl rounded-[12px] border p-3.5 text-left transition ${getNodeCardClasses('commission_ledger')}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#247A55] text-white">
                      <Wallet className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#17324D]">
                        {TREE_NODES.commission_ledger.title}
                      </p>
                      <p className="text-[11px] text-[#526675]">
                        Aktivasi Tervalidasi → 60% Affiliate / 40% Sales + Insentif SLA Teknisi
                      </p>
                    </div>
                  </div>
                  <span className="font-mono-tabular text-[11px] font-bold text-[#247A55]">
                    Settlement
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
                    Inti Kontrol SOW, RBAC &amp; Audit Tenant
                  </p>
                </div>
              </div>
            </button>

            {/* Indented Tree Branches */}
            <div className="ml-3 space-y-3 border-l border-[#B8C9D3] pl-3">
              {/* Branch 1 Mobile */}
              <div className="space-y-2">
                <div className={`rounded-[11px] border p-3 transition ${getNodeCardClasses('sales_resmi')}`}>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId('sales_resmi')}
                      className="flex items-center gap-2 text-left flex-1"
                    >
                      <Briefcase className="h-4 w-4 shrink-0 text-[#0284C7]" />
                      <div>
                        <p className="text-xs font-bold text-[#17324D]">
                          Sales Agentzy (Sales Resmi)
                        </p>
                        <p className="text-[11px] text-[#526675]">
                          Penjualan langsung &amp; pembina affiliate
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleBranch('commercial')}
                      aria-label="Toggle cabang Sales"
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
                        Penjualan Pribadi (100% SA)
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId('affiliate_leaf')}
                      className={`w-full rounded-[10px] border p-2.5 text-left ${getNodeCardClasses('affiliate_leaf')}`}
                    >
                      <p className="text-xs font-bold text-[#17324D]">
                        Affiliate Freelance (60% · Node Akhir)
                      </p>
                    </button>
                  </div>
                )}
              </div>

              {/* Branch 2 Mobile */}
              <div className="space-y-2">
                <div className={`rounded-[11px] border p-3 transition ${getNodeCardClasses('support_human')}`}>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId('support_human')}
                      className="flex items-center gap-2 text-left flex-1"
                    >
                      <Users className="h-4 w-4 shrink-0 text-[#17324D]" />
                      <div>
                        <p className="text-xs font-bold text-[#17324D]">
                          Support Staff Human
                        </p>
                        <p className="text-[11px] text-[#526675]">
                          Approval, koordinasi, &amp; QC akhir
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleBranch('ai_support')}
                      aria-label="Toggle cabang Support dan AI"
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
                      onClick={() => setSelectedNodeId('staff_ai')}
                      className={`w-full rounded-[10px] border p-2.5 text-left ${getNodeCardClasses('staff_ai')}`}
                    >
                      <p className="text-xs font-bold text-[#17324D]">
                        Staff AI Agentzy (L0–L4 · Cek ODP &amp; SLA)
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
                          Teknisi Lapangan (FTTH/FWA)
                        </p>
                        <p className="text-[11px] text-[#526675]">
                          Instalasi, survey, &amp; mode offline
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
                        AI Dispatch &amp; Material Gudang
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId('tech_execution')}
                      className={`w-full rounded-[10px] border p-2.5 text-left ${getNodeCardClasses('tech_execution')}`}
                    >
                      <p className="text-xs font-bold text-[#17324D]">
                        Eksekusi 7-Langkah &amp; TTD Pelanggan
                      </p>
                    </button>
                  </div>
                )}
              </div>

              {/* Convergence Mobile */}
              <button
                type="button"
                onClick={() => setSelectedNodeId('commission_ledger')}
                className={`w-full rounded-[11px] border p-3 text-left ${getNodeCardClasses('commission_ledger')}`}
              >
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 shrink-0 text-[#247A55]" />
                  <div>
                    <p className="text-xs font-bold text-[#17324D]">
                      QC Final &amp; Commission Ledger
                    </p>
                    <p className="text-[11px] text-[#526675]">
                      60% Affiliate / 40% Sales + Insentif SLA
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Live Selected Node & Collaboration Inspector */}
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-4">
          <div className="flex items-center justify-between border-b border-[#EAF2F6] pb-3">
            <span className="text-xs font-semibold text-[#0284C7]">
              Detail Simpul Struktural
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

          {/* Batas Wewenang */}
          <div className="mt-4 rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#17324D]">
              <ShieldCheck className="h-4 w-4 text-[#0284C7]" />
              <span>Batas Wewenang &amp; Tata Kelola</span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-[#526675]">
              {selectedNode.authorityBoundary}
            </p>
          </div>

          {/* Jalur Kolaborasi Aktif */}
          <div className="mt-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#17324D]">
              <GitBranch className="h-4 w-4 text-[#247A55]" />
              <span>Jalur Kolaborasi Terhubung</span>
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

          {/* Aturan Operasional */}
          <div className="mt-4 border-t border-[#EAF2F6] pt-3.5">
            <p className="text-xs font-bold text-[#17324D]">
              Ketentuan Sistem &amp; Operasional
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
