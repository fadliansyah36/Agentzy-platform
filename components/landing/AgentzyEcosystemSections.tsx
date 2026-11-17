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
  Megaphone,
  ShieldCheck,
  Users,
  Wrench,
} from 'lucide-react';
import { InteractiveUniverseTree } from './InteractiveUniverseTree';

const COLLAB_STAGES = [
  {
    step: '01',
    track: 'Kolaborasi Staff Sales & Affiliate',
    trackBadge: 'Pemasaran & Konten Digital',
    title: 'Generate Content & Social Media',
    handoffTrigger: 'Promo baru atau target area perumahan siap dipasarkan',
    humanTitle: 'Staff Sales & Affiliate Freelance',
    humanRole: 'Penentu Sentuhan Lokal & Publikasi Promosi',
    humanTasks: [
      'Memilih promo yang paling menarik untuk warga perumahan atau pelaku usaha di area target',
      'Menyesuaikan nada bahasa agar akrab dengan komunitas lokal dan grup WhatsApp warga',
      'Membagikan konten secara aktif di Instagram, TikTok, Facebook, dan status WhatsApp',
    ],
    aiTitle: 'AI Marketing & Content Support',
    aiRole: 'Pembuatan Ide Kampanye & Konten Sosmed Instan',
    aiTasks: [
      'Membuat variasi caption Instagram, skrip video singkat TikTok/Reels, dan teks broadcast WhatsApp',
      'Merancang materi brosur digital dan pesan penawaran yang sesuai promo resmi mitra',
      'Menyarankan jam tayang dan sudut pesan yang paling menarik minat calon pelanggan',
    ],
    aiDraftProposal:
      'Draf Konten AI Siap Pakai: Caption TikTok/IG promo pasang internet cepat untuk klaster baru + draf pesan WhatsApp tanpa biaya pemasangan.',
    humanApprovedText:
      'Staff Sales & Affiliate menyetujui materi konten AI dan langsung memublikasikannya ke media sosial serta jaringan komunitas.',
    humanEscalatedText:
      'Staff Sales menyesuaikan detail promo akhir bulan pada teks AI agar lebih relevan dengan target klaster prioritas.',
    output: 'Konten promosi harian selalu tersedia tanpa menyita waktu tim penjualan di lapangan',
  },
  {
    step: '02',
    track: 'Kolaborasi Staff Sales & Affiliate',
    trackBadge: 'Digital Marketing & Pencarian Leads',
    title: 'Pencarian Leads & Follow-Up Closing',
    handoffTrigger: 'Calon pelanggan merespons iklan digital atau tautan promosi',
    humanTitle: 'Staff Sales & Affiliate Freelance',
    humanRole: 'Konsultasi Paket, Negosiasi & Closing Order',
    humanTasks: [
      'Menghubungi prospek hangat secara personal lewat telepon, WhatsApp, atau temu janji',
      'Membantu calon pelanggan memilih paket layanan paling sesuai kebutuhan rumah atau bisnis',
      'Staff Sales mendampingi mitra Affiliate hingga transaksi disepakati dengan bagi hasil 60/40',
    ],
    aiTitle: 'AI Pencari & Penyaring Leads',
    aiRole: 'Penjaringan Prospek Digital & Draf Follow-Up',
    aiTasks: [
      'Merespons pertanyaan awal calon pelanggan dari kanal media sosial secara ramah 24/7',
      'Menjaring data lokasi, kebutuhan paket, serta menyaring prospek paling siap berlangganan',
      'Menyiapkan draf balasan follow-up dan perbandingan paket agar Sales cepat melakukan closing',
    ],
    aiDraftProposal:
      'AI Menjaring 12 Prospek Baru Hari Ini: 5 prospek minat tinggi di area prioritas lengkap dengan nomor WhatsApp dan pilihan paket.',
    humanApprovedText:
      'Staff Sales mengambil alih daftar prospek hangat untuk ditindaklanjuti hingga menjadi pelanggan aktif.',
    humanEscalatedText:
      'Staff Sales meminta AI menyiapkan penawaran khusus untuk calon pelanggan korporasi/Ruko.',
    output: 'Peluang closing meningkat pesat karena tim Sales hanya fokus pada prospek berkualitas',
  },
  {
    step: '03',
    track: 'Khusus Teknisi · Operasional & Teknis',
    trackBadge: 'Operasional Lapangan',
    title: 'Penjadwalan, Rute & Kesiapan Kerja',
    handoffTrigger: 'Pelanggan resmi sepakat berlangganan dan siap dijadwalkan',
    humanTitle: 'Teknisi Lapangan Profesional',
    humanRole: 'Kesiapan Eksekusi & Kunjungan Tepat Waktu',
    humanTasks: [
      'Menerima jadwal kunjungan harian lengkap dengan lokasi dan detail kebutuhan pelanggan',
      'Memastikan kelengkapan perangkat utama serta perlengkapan keselamatan sebelum berangkat',
      'Mengonfirmasi waktu kedatangan ke pelanggan sehingga kunjungan berjalan nyaman',
    ],
    aiTitle: 'AI Koordinator Operasional',
    aiRole: 'Pengaturan Jadwal, Rute Optimal & Stok',
    aiTasks: [
      'Menyalurkan tugas ke teknisi terdekat sesuai keahlian pekerjaan dan kapasitas jadwal hari itu',
      'Menyusun urutan rute kunjungan paling efisien lewat peta agar waktu tempuh jauh lebih hemat',
      'Mengingatkan kelengkapan perangkat yang wajib dibawa untuk menghindari kunjungan tertunda',
    ],
    aiDraftProposal:
      'Rekomendasi Operasional AI: Jadwalkan Teknisi terdekat (2,3 km dari lokasi) pada slot 10.00 WIB dengan rute tercepat dan perangkat tersedia.',
    humanApprovedText:
      'Teknisi mengonfirmasi jadwal dan langsung menavigasi ke alamat pelanggan melalui peta digital.',
    humanEscalatedText:
      'Koordinator operasional menyesuaikan slot ke sore hari sesuai permintaan perubahan jadwal dari pelanggan.',
    output: 'Jumlah pemasangan harian lebih optimal tanpa mengorbankan ketepatan waktu janji temu',
  },
  {
    step: '04',
    track: 'Khusus Teknisi · Operasional & Teknis',
    trackBadge: 'Teknis Lapangan & Mutu Layanan',
    title: 'Panduan Teknis & Jaminan Kualitas',
    handoffTrigger: 'Teknisi tiba di lokasi dan menjalankan pemasangan atau perbaikan',
    humanTitle: 'Teknisi Lapangan Profesional',
    humanRole: 'Pemasangan Rapi, Uji Layanan & Serah Terima',
    humanTasks: [
      'Melaksanakan instalasi atau perbaikan jaringan secara rapi, aman, dan sesuai standar mitra',
      'Melakukan pengujian kualitas layanan bersama pelanggan hingga koneksi berjalan stabil',
      'Mengabadikan foto bukti kerja dan mendapatkan tanda tangan kepuasan pelanggan',
    ],
    aiTitle: 'AI Asisten Teknis & Mutu Layanan',
    aiRole: 'Referensi Langkah Teknis & Penjaga Ketepatan Jadwal',
    aiTasks: [
      'Memberikan panduan cepat pengecekan perangkat dan solusi kendala teknis di lokasi pelanggan',
      'Memantau kelengkapan langkah kerja agar setiap instalasi tuntas pada kunjungan pertama',
      'Mengirimkan pengingat batas waktu layanan agar standar kepuasan pelanggan perusahaan tetap terjaga',
    ],
    aiDraftProposal:
      'Panduan Teknis AI: Langkah standar terpasang rapi · Hasil uji kualitas memenuhi paket pelanggan · Siap tanda tangan serah terima.',
    humanApprovedText:
      'Teknisi menyelesaikan instalasi, pelanggan menandatangani berita acara, dan layanan resmi aktif.',
    humanEscalatedText:
      'Teknisi mencatat kebutuhan penyesuaian teknis di lokasi agar segera ditindaklanjuti koordinator jaringan.',
    output: 'Pelanggan puas sejak hari pertama dan komisi tim langsung tercatat transparan',
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
      {/* SECTION A: Gambaran Bisnis Ekosistem Agentzy */}
      <section
        id="ekosistem"
        className="border-b border-[#D8E3E9] bg-white py-10 sm:py-14 lg:py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-stretch gap-7 sm:gap-10 lg:grid-cols-12">
            {/* Left Visual Illustration */}
            <div className="lg:col-span-6">
              <div className="relative h-full min-h-[240px] overflow-hidden rounded-[14px] border border-[#D8E3E9] bg-gradient-to-br from-[#E6F4F9] via-[#F5F8FA] to-[#D6EEF8] sm:min-h-[320px] lg:min-h-[420px]">
                <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-[#526675] sm:p-8">
                  <Layers className="h-10 w-10 text-[#0284C7]" />
                  <p className="mt-3 text-sm font-semibold text-[#17324D]">
                    Ekosistem Pertumbuhan Bisnis Agent-zy
                  </p>
                </div>
                <Image
                  src="/images/agentzy_ecosystem_illustration.jpg"
                  alt="Ilustrasi ekosistem Agentzy yang menghubungkan Staff Sales, Affiliate Freelance, Teknisi Lapangan, dan Asisten AI"
                  fill
                  referrerPolicy="no-referrer"
                  className="object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#17324D]/90 via-[#17324D]/55 to-transparent p-4 text-white sm:p-5">
                  <p className="text-xs font-medium text-[#ADD8E6]">
                    Ekspansi Penjualan Lebih Cepat · Layanan Lapangan Andal
                  </p>
                  <p className="mt-1 text-xs font-semibold sm:text-sm">
                    Bangun pertumbuhan pelanggan tanpa repot merekrut dan mengelola tim operasional dari nol
                  </p>
                </div>
              </div>
            </div>

            {/* Right Editorial Breakdown */}
            <div className="flex flex-col justify-center lg:col-span-6">
              <p className="text-xs font-semibold text-[#0284C7]">
                Ekosistem Kerja Sama Agentzy
              </p>
              <h2
                className="mt-2 text-2xl font-bold tracking-tight text-[#17324D] sm:text-3xl"
                style={{ textWrap: 'balance' }}
              >
                Satu Mitra Strategis untuk Penjualan, Jaringan Promosi, dan Layanan Lapangan Anda
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#526675] sm:text-base">
                Agentzy menghadirkan kombinasi tenaga kerja profesional dan dukungan AI
                yang siap membantu perusahaan Anda memperluas jangkauan pasar,
                memperbanyak pelanggan baru, sekaligus memastikan kualitas pemasangan
                di lapangan berjalan mulus.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {[
                  {
                    num: '01',
                    icon: Briefcase,
                    title: 'Staff Sales Profesional',
                    desc: 'Tim penjualan resmi (Training, Pro, Elite) yang aktif menjangkau pasar, menangani penawaran, dan mengawal transaksi hingga aktif.',
                  },
                  {
                    num: '02',
                    icon: Users,
                    title: 'Affiliate Freelance',
                    desc: 'Jaringan mitra promosi di komunitas dan media sosial dengan pembagian hasil 60% Affiliate / 40% Staff Sales yang mendorong penjualan viral.',
                  },
                  {
                    num: '03',
                    icon: Wrench,
                    title: 'Teknisi Lapangan',
                    desc: 'Tenaga instalasi dan pemeliharaan terlatih untuk menjamin setiap pelanggan baru terlayani cepat, rapi, dan tepat waktu.',
                  },
                  {
                    num: '04',
                    icon: Bot,
                    title: 'Asisten AI Sesuai Peran',
                    desc: 'AI membantu Staff Sales & Affiliate di Digital Marketing, Konten Sosmed & Leads; serta membantu Teknisi pada Operasional & Teknis.',
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
        className="border-b border-[#D8E3E9] bg-[#F5F8FA] py-10 sm:py-14 lg:py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold text-[#0284C7]">
                Peta Kolaborasi Bisnis Agentzy
              </p>
              <h2
                className="mt-2 text-2xl font-bold tracking-tight text-[#17324D] sm:text-3xl"
                style={{ textWrap: 'balance' }}
              >
                Lihat Bagaimana Staff Sales, Affiliate, Teknisi &amp; AI Bersinergi untuk Bisnis Anda
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#526675] sm:text-base">
                Pilih peran pada bagan interaktif di bawah ini atau jalankan simulasi
                perjalanan pelanggan dari konten promosi hingga pemasangan selesai.
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
                  : 'Lihat Ilustrasi Ekosistem'}
              </span>
            </button>
          </div>

          {showUniverseArtwork && (
            <div className="mt-6 overflow-hidden rounded-[14px] border border-[#D8E3E9] bg-white">
              <div className="grid grid-cols-1 items-center lg:grid-cols-12">
                <div className="relative h-64 w-full bg-gradient-to-br from-[#E6F4F9] to-[#F5F8FA] lg:col-span-6 lg:h-72">
                  <Image
                    src="/images/agentzy_universe_structure.jpg"
                    alt="Ilustrasi peta kolaborasi bisnis Agentzy yang menghubungkan perusahaan mitra dengan Staff Sales, Affiliate Freelance, Teknisi, dan Asisten AI"
                    fill
                    referrerPolicy="no-referrer"
                    className="object-cover"
                  />
                </div>
                <div className="p-6 lg:col-span-6">
                  <p className="text-xs font-semibold text-[#0284C7]">
                    Sinergi Nyata di Setiap Lini Bisnis
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-[#17324D]">
                    Setiap Peran Saling Menguatkan Demi Pertumbuhan Pelanggan Aktif
                  </h3>
                  <div className="mt-3 space-y-2 text-xs leading-relaxed text-[#526675] sm:text-sm">
                    <p>
                      <span className="font-semibold text-[#17324D]">Staff Sales &amp; Affiliate:</span>{' '}
                      Memperluas jangkauan promosi bersama dengan skema bagi hasil 60/40 yang adil dan menarik.
                    </p>
                    <p>
                      <span className="font-semibold text-[#17324D]">AI Marketing &amp; Konten:</span>{' '}
                      Membekali Staff Sales dan Affiliate dengan konten media sosial, materi iklan digital, dan penyaringan leads.
                    </p>
                    <p>
                      <span className="font-semibold text-[#17324D]">Teknisi &amp; AI Operasional:</span>{' '}
                      Menjaga jadwal kunjungan tepat waktu, rute hemat tenaga, dan kualitas instalasi di lokasi pelanggan.
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

      {/* SECTION C: Simulasi Kolaborasi Manusia & AI Sesuai Peran */}
      <section
        id="kolaborasi-ai"
        className="border-b border-[#D8E3E9] bg-white py-10 sm:py-14 lg:py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-stretch gap-7 sm:gap-10 lg:grid-cols-12">
            {/* Left Copy & Interactive 4-Step Collaboration Matrix */}
            <div className="flex flex-col justify-between lg:col-span-6">
              <div>
                <p className="text-xs font-semibold text-[#0284C7]">
                  Kolaborasi Manusia &amp; AI Tepat Guna
                </p>
                <h2
                  className="mt-2 text-2xl font-bold tracking-tight text-[#17324D] sm:text-3xl"
                  style={{ textWrap: 'balance' }}
                >
                  AI Memperkuat Pemasaran Staff Sales &amp; Affiliate, serta Operasional Teknisi
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[#526675] sm:text-base">
                  Di Agentzy, setiap tim mendapatkan asisten AI sesuai bidang kerjanya.
                  <strong className="font-semibold text-[#17324D]"> Staff Sales &amp; Affiliate</strong>{' '}
                  dibantu AI dalam digital marketing, pembuatan konten media sosial,
                  dan pencarian leads; sementara{' '}
                  <strong className="font-semibold text-[#17324D]">Teknisi Lapangan</strong>{' '}
                  didukung AI khusus pada kelancaran operasional dan teknis.
                </p>

                {/* Two Distinct Collaboration Track Cards */}
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-[12px] border border-[#ADD8E6] bg-[#E6F4F9]/55 p-3.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#0284C7]">
                      <Megaphone className="h-4 w-4" />
                      <span>Jalur 1 · Staff Sales &amp; Affiliate</span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[#172B3A]">
                      Fokus <strong>Digital Marketing, Generate Content, Social Media, &amp; Pencarian Leads</strong> agar penjualan melesat.
                    </p>
                  </div>
                  <div className="rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-3.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#247A55]">
                      <Wrench className="h-4 w-4" />
                      <span>Jalur 2 · Khusus Teknisi</span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[#172B3A]">
                      Fokus <strong>Operasional &amp; Teknis</strong>: jadwal, rute tercepat, kesiapan material, &amp; panduan instalasi.
                    </p>
                  </div>
                </div>
              </div>

              {/* Interactive Stage Selector */}
              <div className="mt-5 grid grid-cols-2 gap-2 sm:mt-6 sm:grid-cols-4 sm:gap-2.5">
                {COLLAB_STAGES.map((item, idx) => (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => {
                      setActiveCollabStep(idx);
                      setCollabDecision('pending');
                    }}
                    className={`min-h-[64px] rounded-[10px] border p-2.5 text-left transition sm:p-3 ${
                      activeCollabStep === idx
                        ? 'border-[#0284C7] bg-[#E6F4F9]'
                        : 'border-[#D8E3E9] bg-[#F5F8FA] hover:border-[#87CEEB]'
                    }`}
                  >
                    <span className="font-mono-tabular text-[11px] font-bold text-[#0284C7]">
                      {idx < 2 ? 'Sales' : 'Teknis'} · {item.step}
                    </span>
                    <p className="mt-1 text-xs font-bold leading-snug text-[#17324D]">
                      {item.title}
                    </p>
                  </button>
                ))}
              </div>

              {/* Active Stage Dual-Track Breakdown + Interactive Handoff Preview */}
              <div className="mt-4 rounded-[14px] border border-[#D8E3E9] bg-[#F5F8FA] p-4 sm:mt-5 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D8E3E9] pb-3">
                  <div>
                    <p className="text-[11px] font-semibold text-[#0284C7]">
                      {stage.track} · {stage.trackBadge}
                    </p>
                    <h3 className="text-base font-bold text-[#17324D]">
                      {stage.step}. {stage.title}
                    </h3>
                  </div>
                  <span className="text-xs font-medium text-[#526675]">
                    {stage.handoffTrigger}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4">
                  {/* AI Support Column */}
                  <div className="rounded-[12px] border border-[#ADD8E6] bg-[#E6F4F9]/60 p-3.5 sm:p-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#0284C7]">
                      <Bot className="h-4 w-4 shrink-0 text-[#0284C7]" />
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

                  {/* Human Role Column */}
                  <div className="rounded-[12px] border border-[#D8E3E9] bg-white p-3.5 sm:p-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#17324D]">
                      <Users className="h-4 w-4 shrink-0 text-[#17324D]" />
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

                {/* Interactive Preview */}
                <div className="mt-4 rounded-[12px] border border-[#D8E3E9] bg-white p-3.5 sm:p-4">
                  <p className="text-xs font-semibold text-[#0284C7]">
                    Contoh Kolaborasi Nyata
                  </p>
                  <p className="mt-1 text-xs font-medium text-[#17324D]">
                    {stage.aiDraftProposal}
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
                    <button
                      type="button"
                      onClick={() => setCollabDecision('approved')}
                      className={`h-10 rounded-[8px] px-3.5 text-xs font-semibold transition sm:h-9 ${
                        collabDecision === 'approved'
                          ? 'bg-[#247A55] text-white'
                          : 'border border-[#D8E3E9] bg-[#F5F8FA] text-[#17324D] hover:border-[#247A55]'
                      }`}
                    >
                      Gunakan Rekomendasi AI
                    </button>
                    <button
                      type="button"
                      onClick={() => setCollabDecision('escalated')}
                      className={`h-10 rounded-[8px] px-3.5 text-xs font-semibold transition sm:h-9 ${
                        collabDecision === 'escalated'
                          ? 'bg-[#17324D] text-white'
                          : 'border border-[#D8E3E9] bg-[#F5F8FA] text-[#17324D] hover:border-[#17324D]'
                      }`}
                    >
                      Sesuaikan Secara Manual
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
                    <span className="font-bold text-[#17324D]">Dampak Bisnis:</span>{' '}
                    {stage.output}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Visual Illustration & Action Card */}
            <div className="flex flex-col justify-between gap-4 sm:gap-5 lg:col-span-6">
              <div className="relative min-h-[240px] flex-1 overflow-hidden rounded-[14px] border border-[#D8E3E9] bg-gradient-to-br from-[#E6F4F9] via-[#F5F8FA] to-[#D6EEF8] sm:min-h-[320px] lg:min-h-[380px]">
                <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-[#526675] sm:p-8">
                  <Bot className="h-10 w-10 text-[#0284C7]" />
                  <p className="mt-3 text-sm font-semibold text-[#17324D]">
                    Kolaborasi Tim Profesional &amp; Asisten AI Agent-zy
                  </p>
                </div>
                <Image
                  src="/images/agentzy_human_ai_collab.jpg"
                  alt="Ilustrasi kolaborasi tim Agentzy bersama AI untuk dukungan digital marketing, generate content, dan operasional lapangan"
                  fill
                  referrerPolicy="no-referrer"
                  className="object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#17324D]/90 via-[#17324D]/55 to-transparent p-4 text-white sm:p-5">
                  <p className="text-xs font-medium text-[#ADD8E6]">
                    Kecepatan AI · Sentuhan &amp; Kepercayaan Manusia
                  </p>
                  <p className="mt-1 text-xs font-semibold sm:text-sm">
                    Tim fokus membangun relasi &amp; melayani pelanggan, sementara AI menyiapkan konten, leads, dan jadwal terbaik
                  </p>
                </div>
              </div>

              <div className="flex flex-col justify-between gap-4 rounded-[14px] border border-[#D8E3E9] bg-[#F5F8FA] p-4 sm:flex-row sm:items-center sm:p-5">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#247A55]">
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    <span>Siap Jalan untuk Ekspansi Bisnis Anda</span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-[#17324D]">
                    Hadirkan Tim Staff Sales, Affiliate, Teknisi &amp; AI di Wilayah Target Anda
                  </p>
                </div>
                <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={onRequestPartnership}
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-[10px] bg-[#0284C7] px-3.5 text-xs font-semibold text-white transition hover:bg-[#0369A1] whitespace-nowrap shrink-0 sm:h-10 sm:px-4"
                  >
                    <span>Ajukan Kerja Sama</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <Link
                    href="/workforce"
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-[10px] border border-[#B8C9D3] bg-white px-3.5 text-xs font-semibold text-[#17324D] transition hover:bg-[#E6F4F9] whitespace-nowrap shrink-0 sm:h-10 sm:px-4"
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
