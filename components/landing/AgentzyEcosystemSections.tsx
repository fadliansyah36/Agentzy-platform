'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  Briefcase,
  CheckCircle2,
  Eye,
  EyeOff,
  Layers,
  ShieldCheck,
  Users,
  Wrench,
} from 'lucide-react';
import { InteractiveUniverseTree } from './InteractiveUniverseTree';

const COLLAB_STAGES = [
  {
    step: '01',
    title: 'Penerimaan & Validasi Prospek',
    handoffTrigger: 'Lead masuk dari Sales, Affiliate, atau formulir mitra',
    humanTitle: 'Support Staff Agentzy (Human)',
    humanRole: 'Validasi Komersial & Penanganan Kasus Khusus',
    humanTasks: [
      'Meninjau kelayakan pelanggan bisnis atau klaster baru yang butuh penyesuaian paket',
      'Mengonfirmasi jadwal janji temu bersama perwakilan Sales Agentzy',
      'Menangani pengecualian wilayah apabila titik pemasangan berada di batas jaringan',
    ],
    aiTitle: 'Collaboration Staff AI',
    aiRole: 'Pra-Kualifikasi Otomatis & Cek Cakupan',
    aiTasks: [
      'Memeriksa kelengkapan nomor HP, alamat koordinat, dan deteksi duplikasi lead',
      'Mencocokkan alamat pelanggan dengan kesiapan port ODP dan paket FTTH/FWA tersedia',
      'Mengirimkan ringkasan skor kesiapan prospek ke dasbor Support Staff',
    ],
    aiDraftProposal:
      'Staf AI merekomendasikan: Lead terverifikasi · ODP-JKS-042 tersedia 3 port · Paket cocok FTTH 100 Mbps',
    humanApprovedText:
      'Support Staff menyetujui rekomendasi AI dan meneruskan lead ke antrean order resmi.',
    humanEscalatedText:
      'Support Staff menandai pengecualian jarak kabel >150m dan meminta survei teknis tambahan.',
    output: 'Lead terverifikasi siap dijadwalkan untuk konversi order dan survei lapangan',
  },
  {
    step: '02',
    title: 'Orkestrasi Penugasan & Rute Lapangan',
    handoffTrigger: 'Order tervalidasi masuk antrean Assignment Engine',
    humanTitle: 'Support Staff Agentzy (Human)',
    humanRole: 'Penyelarasan Prioritas & Koordinasi Tim',
    humanTasks: [
      'Menetapkan prioritas SLA mendesak atau permintaan instalasi korporasi VIP',
      'Mengatur ulang penugasan teknisi jika terjadi kendala cuaca atau kondisi darurat',
      'Memastikan ketersediaan stok perangkat ONT dan material kabel bersama gudang',
    ],
    aiTitle: 'Collaboration Staff AI',
    aiRole: 'Rekomendasi Penjadwalan & Rute Optimal',
    aiTasks: [
      'Menghitung jarak tempuh Google Maps dan kecocokan sertifikasi FTTH setiap teknisi',
      'Menyusun rekomendasi urutan kunjungan harian agar kapasitas shift tim maksimal',
      'Membuat draf undangan jadwal survei/aktivasi melalui Google Calendar & Meet',
    ],
    aiDraftProposal:
      'Staf AI merekomendasikan: Tugaskan ke Teknisi Budi Santoso (jarak 2,3 km · skor SLA 98%)',
    humanApprovedText:
      'Support Staff menyetujui dispatch dan mengirim rute Google Maps ke portal Teknisi.',
    humanEscalatedText:
      'Support Staff mengalihkan jadwal ke slot sore sesuai permintaan konfirmasi pelanggan.',
    output: 'Work Order tersalurkan ke Teknisi paling tepat dengan estimasi waktu tiba terukur',
  },
  {
    step: '03',
    title: 'Pendampingan Eksekusi & Monitoring SLA',
    handoffTrigger: 'Teknisi check-in lokasi & menjalankan 7 langkah SOP',
    humanTitle: 'Support Staff Agentzy (Human)',
    humanRole: 'Asistensi Eskalasi & Komunikasi Mitra ISP',
    humanTasks: [
      'Membantu eskalasi redaman optik tinggi atau kendala aktivasi jaringan ke tim NOC ISP',
      'Menghubungi pelanggan apabila diperlukan penjadwalan ulang atau izin pengelola gedung',
      'Memandu tim sales saat terjadi perubahan paket layanan langsung di lokasi pelanggan',
    ],
    aiTitle: 'Collaboration Staff AI',
    aiRole: 'Pengawas SLA Real-Time & Sinkronisasi Offline',
    aiTasks: [
      'Memantau progres 7 tahapan eksekusi (Check-in, Survey, SOP, Speedtest, Foto, TTD, Laporan)',
      'Mengirimkan peringatan dini kepada Support Staff apabila durasi mendekati batas SLA 4 jam',
      'Menjaga antrean sinkronisasi data lapangan saat perangkat teknisi berada di area minim sinyal',
    ],
    aiDraftProposal:
      'Staf AI mendeteksi: Progres SOP 5/7 selesai · Speedtest 102,4 Mbps · Sisa SLA 1 jam 50 menit',
    humanApprovedText:
      'Support Staff mengonfirmasi kelancaran instalasi dan memantau tahap tanda tangan pelanggan.',
    humanEscalatedText:
      'Support Staff berkoordinasi dengan NOC ISP untuk penyesuaian konfigurasi port ONT.',
    output: 'Eksekusi instalasi selesai tepat waktu sesuai standar K3 dan kualitas jaringan',
  },
  {
    step: '04',
    title: 'Audit Kualitas (QC) & Rekonsiliasi Ledger',
    handoffTrigger: 'Berita Acara ditandatangani & layanan berstatus aktif',
    humanTitle: 'Support Staff Agentzy (Human)',
    humanRole: 'Final QC Sign-off & Persetujuan Pencairan',
    humanTasks: [
      'Memeriksa kejelasan 4 bukti foto instalasi, redaman optik, serta hasil uji kecepatan',
      'Menyelesaikan sengketa atribusi atau penyesuaian insentif apabila ada catatan lapangan',
      'Memberikan persetujuan akhir daftar pencairan komisi sebelum diproses Finance',
    ],
    aiTitle: 'Collaboration Staff AI',
    aiRole: 'Audit Bukti & Kalkulasi Komisi Deterministik',
    aiTasks: [
      'Memvalidasi kelengkapan metadata foto, nilai speedtest terhadap paket, dan tanda tangan digital',
      'Menghitung unit produktivitas SA, pembagian 60/40 Sales–Affiliate, serta bonus tier & SLA',
      'Menyusun draf laporan rekonsiliasi invoice Corporate Partner dan audit trail lengkap',
    ],
    aiDraftProposal:
      'Staf AI menyiapkan audit: 4 foto valid · TTD lengkap · Siap hitung split 60/40 & insentif SLA',
    humanApprovedText:
      'Support Staff menandatangani QC Final sehingga komisi langsung berstatus Eligible di Ledger.',
    humanEscalatedText:
      'Support Staff menahan status pencairan dan meminta teknisi mengunggah ulang foto perangkat.',
    output: 'Laporan QC tervalidasi, tagihan mitra akurat, dan komisi tim cair tepat jadwal',
  },
];

export function AgentzyEcosystemSections({
  onRequestPartnership,
}: {
  onRequestPartnership: () => void;
}) {
  const [activeCollabStep, setActiveCollabStep] = useState<number>(0);
  const [collabDecision, setCollabDecision] = useState<'pending' | 'approved' | 'escalated'>(
    'pending'
  );
  const [showUniverseArtwork, setShowUniverseArtwork] = useState(false);

  const stage = COLLAB_STAGES[activeCollabStep];

  return (
    <>
      {/* SECTION A: Ilustrasi Menarik Tentang Agentzy */}
      <section
        id="ekosistem"
        className="border-b border-[#D8E3E9] bg-white py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12">
            {/* Left Visual Illustration */}
            <div className="lg:col-span-6">
              <div className="relative h-full min-h-[300px] overflow-hidden rounded-[14px] border border-[#D8E3E9] bg-gradient-to-br from-[#E6F4F9] via-[#F5F8FA] to-[#D6EEF8] lg:min-h-[420px]">
                <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center text-[#526675]">
                  <Layers className="h-10 w-10 text-[#0284C7]" />
                  <p className="mt-3 text-sm font-semibold text-[#17324D]">
                    Ekosistem Tenaga Kerja Sales, Teknisi &amp; Staf AI Agentzy
                  </p>
                </div>
                <Image
                  src="/images/agentzy_ecosystem_illustration.jpg"
                  alt="Ilustrasi ekosistem Agentzy yang menghubungkan Sales Resmi, Affiliate Freelance, Teknisi Lapangan, dan Staf AI Terkelola"
                  fill
                  referrerPolicy="no-referrer"
                  className="object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#17324D]/90 via-[#17324D]/55 to-transparent p-5 text-white">
                  <p className="text-xs font-medium text-[#ADD8E6]">
                    Tenaga Kerja Lapangan Terlatih · Didukung Staf AI Terkendali
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    Penjualan Terukur, Instalasi Tepat SLA, dan Tata Kelola Audit Penuh
                  </p>
                </div>
              </div>
            </div>

            {/* Right Editorial Breakdown */}
            <div className="flex flex-col justify-center lg:col-span-6">
              <p className="text-xs font-semibold text-[#0284C7]">
                Ekosistem Operasional Agentzy
              </p>
              <h2
                className="mt-2 text-2xl font-bold tracking-tight text-[#17324D] sm:text-3xl"
                style={{ textWrap: 'balance' }}
              >
                Menghubungkan Tenaga Kerja Lapangan dengan Staf AI dalam Satu Kesatuan Kerja
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#526675] sm:text-base">
                Agentzy tidak sekadar menyediakan perangkat lunak. Kami menyiapkan
                serta mengelola tenaga kerja Sales Agentzy, jaringan Affiliate
                Freelance, dan Teknisi FTTH/FWA bersertifikat yang bekerja
                berdampingan bersama staf AI untuk menjaga kecepatan eksekusi dan
                akurasi layanan bagi perusahaan mitra.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {[
                  {
                    num: '01',
                    icon: Briefcase,
                    title: 'Sales Agentzy',
                    desc: 'Sales resmi yang menjalankan penjualan langsung, membina jaringan affiliate, dan bertumbuh melalui skema Training, Pro, serta Elite.',
                  },
                  {
                    num: '02',
                    icon: Users,
                    title: 'Affiliate Freelance',
                    desc: 'Mitra akuisisi prospek di bawah pembinaan Sales Resmi dengan skema pembagian komisi inkremental 60% yang transparan.',
                  },
                  {
                    num: '03',
                    icon: Wrench,
                    title: 'Teknisi Lapangan',
                    desc: 'Eksekutor instalasi dan pemeliharaan jaringan dengan navigasi Google Maps, checklist SOP 7-langkah, serta dukungan mode offline.',
                  },
                  {
                    num: '04',
                    icon: Bot,
                    title: 'Staf AI Terkelola',
                    desc: 'Asisten operasional berkontrak kerja yang menyaring prospek, mengawasi SLA, dan menyiapkan rekonsiliasi laporan bagi tim manusia.',
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.num}
                      className="rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono-tabular text-xs font-bold text-[#0284C7]">
                          {item.num}
                        </span>
                        <Icon className="h-4 w-4 text-[#17324D]" />
                      </div>
                      <h3 className="mt-2 text-sm font-bold text-[#17324D]">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-[#526675]">
                        {item.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION B: Interactive Structural Tree Universe */}
      <section
        id="universe"
        className="border-b border-[#D8E3E9] bg-[#F5F8FA] py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold text-[#0284C7]">
                Struktural Tree Interactive Universe
              </p>
              <h2
                className="mt-2 text-2xl font-bold tracking-tight text-[#17324D] sm:text-3xl"
                style={{ textWrap: 'balance' }}
              >
                Pohon Struktur Kolaborasi Sales, Affiliate, Teknisi, dan Staf AI Agentzy
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#526675] sm:text-base">
                Jelajahi pohon struktur interaktif di bawah ini, buka atau tutup
                cabang tim, klik tiap simpul peran, atau jalankan simulasi alur
                order lintas peran secara langsung.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowUniverseArtwork((v) => !v)}
              className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-[#D8E3E9] bg-white px-4 text-xs font-semibold text-[#17324D] transition hover:border-[#0284C7] hover:bg-[#E6F4F9] whitespace-nowrap shrink-0 self-start"
            >
              {showUniverseArtwork ? (
                <EyeOff className="h-4 w-4 text-[#0284C7]" />
              ) : (
                <Eye className="h-4 w-4 text-[#0284C7]" />
              )}
              <span>
                {showUniverseArtwork
                  ? 'Sembunyikan Ilustrasi Visual'
                  : 'Lihat Ilustrasi Visual Universe'}
              </span>
            </button>
          </div>

          {showUniverseArtwork && (
            <div className="mt-6 overflow-hidden rounded-[14px] border border-[#D8E3E9] bg-white">
              <div className="grid grid-cols-1 items-center lg:grid-cols-12">
                <div className="relative h-64 w-full bg-gradient-to-br from-[#E6F4F9] to-[#F5F8FA] lg:col-span-6 lg:h-72">
                  <Image
                    src="/images/agentzy_universe_structure.jpg"
                    alt="Ilustrasi peta struktural universe Agentzy yang menghubungkan inti platform dengan tim Sales, jaringan Affiliate, Teknisi Lapangan, dan Staf AI"
                    fill
                    referrerPolicy="no-referrer"
                    className="object-cover"
                  />
                </div>
                <div className="p-6 lg:col-span-6">
                  <p className="text-xs font-semibold text-[#0284C7]">
                    Ilustrasi Arsitektur Konseptual
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-[#17324D]">
                    Satu Inti Data Tenant untuk Seluruh Peran Lapangan &amp; AI
                  </h3>
                  <div className="mt-3 space-y-2 text-xs leading-relaxed text-[#526675] sm:text-sm">
                    <p>
                      <span className="font-semibold text-[#17324D]">Sales ↔ Affiliate:</span>{' '}
                      Pembinaan langsung oleh Sales Resmi dan pembagian komisi 60/40 tanpa struktur MLM.
                    </p>
                    <p>
                      <span className="font-semibold text-[#17324D]">Staff Human ↔ Staff AI:</span>{' '}
                      Otomasi berbatas L0–L4 dengan persetujuan supervisor dan audit log.
                    </p>
                    <p>
                      <span className="font-semibold text-[#17324D]">Teknisi ↔ Lintas Tim:</span>{' '}
                      Penugasan jarak optimal, eksekusi 7-langkah offline-ready, dan QC digital.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Hierarchical Tree Universe */}
          <div className="mt-6">
            <InteractiveUniverseTree />
          </div>
        </div>
      </section>

      {/* SECTION C: Ilustrasi & Simulasi Metode Kerja Support Staff Agentzy & Collaboration Staff AI */}
      <section
        id="kolaborasi-ai"
        className="border-b border-[#D8E3E9] bg-white py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12">
            {/* Left Copy & Interactive 4-Step Collaboration Matrix */}
            <div className="flex flex-col justify-between lg:col-span-6">
              <div>
                <p className="text-xs font-semibold text-[#0284C7]">
                  Metode Kerja Operasional Support Staff
                </p>
                <h2
                  className="mt-2 text-2xl font-bold tracking-tight text-[#17324D] sm:text-3xl"
                  style={{ textWrap: 'balance' }}
                >
                  Cara Kerja Support Staff Agentzy Bersama Collaboration Staff AI
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[#526675] sm:text-base">
                  Di balik setiap tim Sales dan Teknisi di lapangan, Support Staff
                  Agentzy bekerja berdampingan dengan Collaboration Staff AI untuk
                  memvalidasi prospek, mengorkestrasi penugasan, mengawasi SLA, dan
                  memastikan audit kualitas sebelum komisi dicairkan.
                </p>
              </div>

              {/* Interactive Stage Selector */}
              <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {COLLAB_STAGES.map((item, idx) => (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => {
                      setActiveCollabStep(idx);
                      setCollabDecision('pending');
                    }}
                    className={`rounded-[10px] border p-3 text-left transition ${
                      activeCollabStep === idx
                        ? 'border-[#0284C7] bg-[#E6F4F9]'
                        : 'border-[#D8E3E9] bg-[#F5F8FA] hover:border-[#87CEEB]'
                    }`}
                  >
                    <span className="font-mono-tabular text-xs font-bold text-[#0284C7]">
                      Tahap {item.step}
                    </span>
                    <p className="mt-1 text-xs font-bold leading-snug text-[#17324D]">
                      {item.title}
                    </p>
                  </button>
                ))}
              </div>

              {/* Active Stage Dual-Track Breakdown + Interactive Handoff Decision */}
              <div className="mt-5 rounded-[14px] border border-[#D8E3E9] bg-[#F5F8FA] p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D8E3E9] pb-3">
                  <h3 className="text-base font-bold text-[#17324D]">
                    {stage.step}. {stage.title}
                  </h3>
                  <span className="text-xs font-medium text-[#526675]">
                    {stage.handoffTrigger}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Collaboration AI Column */}
                  <div className="rounded-[12px] border border-[#ADD8E6] bg-[#E6F4F9]/60 p-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#0284C7]">
                      <Bot className="h-4 w-4 text-[#0284C7]" />
                      <span>{stage.aiTitle}</span>
                    </div>
                    <p className="mt-1 text-[11px] font-semibold text-[#245477]">
                      {stage.aiRole}
                    </p>
                    <ul className="mt-3 space-y-2">
                      {stage.aiTasks.map((task) => (
                        <li
                          key={task}
                          className="flex items-start gap-2 text-xs leading-relaxed text-[#172B3A]"
                        >
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0284C7]" />
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Human Support Column */}
                  <div className="rounded-[12px] border border-[#D8E3E9] bg-white p-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#17324D]">
                      <Users className="h-4 w-4 text-[#17324D]" />
                      <span>{stage.humanTitle}</span>
                    </div>
                    <p className="mt-1 text-[11px] font-semibold text-[#526675]">
                      {stage.humanRole}
                    </p>
                    <ul className="mt-3 space-y-2">
                      {stage.humanTasks.map((task) => (
                        <li
                          key={task}
                          className="flex items-start gap-2 text-xs leading-relaxed text-[#172B3A]"
                        >
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#247A55]" />
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Interactive Handoff Approval Simulation */}
                <div className="mt-4 rounded-[12px] border border-[#D8E3E9] bg-white p-4">
                  <p className="text-xs font-semibold text-[#0284C7]">
                    Simulasi Titik Handoff (Human-in-the-Loop)
                  </p>
                  <p className="mt-1 text-xs font-medium text-[#17324D]">
                    {stage.aiDraftProposal}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setCollabDecision('approved')}
                      className={`rounded-[8px] px-3 py-1.5 text-xs font-semibold transition ${
                        collabDecision === 'approved'
                          ? 'bg-[#247A55] text-white'
                          : 'border border-[#D8E3E9] bg-[#F5F8FA] text-[#17324D] hover:border-[#247A55]'
                      }`}
                    >
                      Setujui Rekomendasi AI
                    </button>
                    <button
                      type="button"
                      onClick={() => setCollabDecision('escalated')}
                      className={`rounded-[8px] px-3 py-1.5 text-xs font-semibold transition ${
                        collabDecision === 'escalated'
                          ? 'bg-[#17324D] text-white'
                          : 'border border-[#D8E3E9] bg-[#F5F8FA] text-[#17324D] hover:border-[#17324D]'
                      }`}
                    >
                      Intervensi / Eskalasi Staff
                    </button>
                  </div>
                  {collabDecision !== 'pending' && (
                    <p className="mt-2.5 text-xs font-semibold text-[#247A55]">
                      {collabDecision === 'approved'
                        ? stage.humanApprovedText
                        : stage.humanEscalatedText}
                    </p>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#D8E3E9] pt-3 text-xs">
                  <p className="text-[#172B3A]">
                    <span className="font-bold text-[#17324D]">Hasil Tahapan:</span>{' '}
                    {stage.output}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Visual Illustration & Action Card */}
            <div className="flex flex-col justify-between gap-5 lg:col-span-6">
              <div className="relative min-h-[300px] flex-1 overflow-hidden rounded-[14px] border border-[#D8E3E9] bg-gradient-to-br from-[#E6F4F9] via-[#F5F8FA] to-[#D6EEF8] lg:min-h-[380px]">
                <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center text-[#526675]">
                  <Bot className="h-10 w-10 text-[#0284C7]" />
                  <p className="mt-3 text-sm font-semibold text-[#17324D]">
                    Kolaborasi Support Staff Agentzy &amp; Staf AI
                  </p>
                </div>
                <Image
                  src="/images/agentzy_human_ai_collab.jpg"
                  alt="Ilustrasi Support Staff Agentzy bekerja bersama antarmuka Collaboration Staff AI untuk validasi rute, checklist SOP, dan kontrol kualitas"
                  fill
                  referrerPolicy="no-referrer"
                  className="object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#17324D]/90 via-[#17324D]/55 to-transparent p-5 text-white">
                  <p className="text-xs font-medium text-[#ADD8E6]">
                    Human Supervision · AI Automation Speed
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    Pekerjaan berulang ditangani Staf AI, keputusan kritis disetujui Support Staff Agentzy
                  </p>
                </div>
              </div>

              <div className="flex flex-col justify-between gap-4 rounded-[14px] border border-[#D8E3E9] bg-[#F5F8FA] p-5 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#247A55]">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Tata Kelola Terpadu &amp; Audit Trail</span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-[#17324D]">
                    Siap Mengoperasikan Tim Sales, Teknisi, dan Staf AI untuk Bisnis Anda
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={onRequestPartnership}
                    className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#0284C7] px-4 text-xs font-semibold text-white transition hover:bg-[#0369A1] whitespace-nowrap shrink-0"
                  >
                    <span>Ajukan Kerja Sama</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <Link
                    href="/workforce"
                    className="inline-flex h-10 items-center gap-1.5 rounded-[10px] border border-[#B8C9D3] bg-white px-4 text-xs font-semibold text-[#17324D] transition hover:bg-[#E6F4F9] whitespace-nowrap shrink-0"
                  >
                    <span>Coba Portal</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
