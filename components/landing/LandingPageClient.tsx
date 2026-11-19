'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Users,
  Bot,
  Layers,
  ShieldCheck,
  GitBranch,
  ChevronDown,
  Check,
  Building2,
  Briefcase,
  RadioTower,
  Calendar,
  Mail,
  Smartphone,
  FileText,
  X,
  TrendingUp,
  Megaphone,
  Wrench,
  Sparkles,
  Menu,
} from 'lucide-react';
import { AgentzyLogo } from '@/components/brand/AgentzyLogo';
import { PWAInstallButton } from '@/components/pwa/PWAControls';
import { PartnershipModal } from './PartnershipModal';
import { AgentzyEcosystemSections } from './AgentzyEcosystemSections';
import { PARTNERSHIP_STEPS } from '@/lib/agentzy-data';
import { getPublicCatalogue, type PublicCatalogueResponse } from '@/apps/web/lib/api-client';
import { useWorkspace } from '@/components/workspace/WorkspaceProvider';

type LegalDocKey = 'privacy' | 'terms' | 'security' | null;

const PLATFORM_ADVANTAGES = [
  {
    title: 'Satu Ekosistem Terpadu',
    desc: 'Menggabungkan Staff Sales, Affiliate Freelance, Teknisi Lapangan, dan Asisten AI dalam satu sistem kerja yang rapi.',
  },
  {
    title: 'Tim Terkelola Siap Terjun',
    desc: 'Tidak perlu membangun tim pemasaran dan lapangan dari awal — Agentzy menyiapkan rekrutmen, pembekalan, hingga pengawasan harian.',
  },
  {
    title: 'Target & Kinerja Transparan',
    desc: 'Pantau jumlah prospek, pertumbuhan pelanggan aktif, ketepatan jadwal pemasangan, hingga rincian bagi hasil kapan saja.',
  },
  {
    title: 'AI Tepat Guna per Peran',
    desc: 'AI membantu Staff Sales & Affiliate membuat konten sosmed, kampanye digital & cari leads; serta membantu Teknisi pada operasional & teknis.',
  },
  {
    title: 'Jaringan Affiliate Luas',
    desc: 'Perluas jangkauan promosi hingga ke tingkat perumahan dan komunitas dengan sistem pembinaan Affiliate 60/40 yang adil.',
  },
  {
    title: 'Siap Multi-Partner & Lintas Industri',
    desc: 'Fokus utama mendukung pertumbuhan perusahaan ISP & telekomunikasi, serta siap diadaptasi untuk sektor ritel, properti, manufaktur, dan jasa.',
  },
];

export function LandingPageClient() {
  const { openScheduleMeetingModal, openSendEmailModal } = useWorkspace();
  const [isPartnershipOpen, setIsPartnershipOpen] = useState(false);
  const [catalogueTab, setCatalogueTab] = useState<'human' | 'ai'>('human');
  const [solutionTab, setSolutionTab] = useState<'human' | 'ai' | 'hybrid'>('hybrid');
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [legalModal, setLegalModal] = useState<LegalDocKey>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [publicCatalogue, setPublicCatalogue] = useState<PublicCatalogueResponse['data'] | null>(null);
  const [catalogueLoading, setCatalogueLoading] = useState(true);
  const [catalogueError, setCatalogueError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getPublicCatalogue()
      .then((response) => {
        if (active) setPublicCatalogue(response.data);
      })
      .catch((error: unknown) => {
        if (active) setCatalogueError(error instanceof Error ? error.message : 'Katalog layanan tidak dapat dimuat.');
      })
      .finally(() => {
        if (active) setCatalogueLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F5F8FA] text-[#172B3A]">
      {/* Strict 3-Zone Top Bar Contract + Mobile Drawer Trigger */}
      <header className="sticky top-0 z-40 border-b border-[#D8E3E9] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:gap-8 sm:px-6 lg:px-8">
          <Link href="/" className="whitespace-nowrap shrink-0">
            <AgentzyLogo variant="light" size="sm" />
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#526675]">
            <a
              href="#tentang"
              className="whitespace-nowrap shrink-0 transition hover:text-[#17324D] hover:underline underline-offset-4"
            >
              Tentang
            </a>
            <a
              href="#kolaborasi-ai"
              className="whitespace-nowrap shrink-0 transition hover:text-[#17324D] hover:underline underline-offset-4"
            >
              Kolaborasi
            </a>
            <a
              href="#solusi"
              className="whitespace-nowrap shrink-0 transition hover:text-[#17324D] hover:underline underline-offset-4"
            >
              Solusi
            </a>
            <a
              href="#layanan"
              className="whitespace-nowrap shrink-0 transition hover:text-[#17324D] hover:underline underline-offset-4"
            >
              Layanan
            </a>
            <a
              href="#kemitraan"
              className="whitespace-nowrap shrink-0 transition hover:text-[#17324D] hover:underline underline-offset-4"
            >
              Kemitraan
            </a>
          </nav>

          <div className="flex items-center gap-2 shrink-0 sm:gap-3">
            <Link
              href="/workforce"
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-[#17324D] px-3 text-xs font-semibold text-white transition hover:bg-[#245477] whitespace-nowrap shrink-0 sm:h-10 sm:gap-2 sm:px-4"
            >
              <span>Masuk Portal</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Buka Menu Navigasi"
              className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#D8E3E9] bg-white text-[#17324D] transition hover:bg-[#EAF2F6] md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#172B3A]/50 backdrop-blur-xs md:hidden">
          <div className="flex h-full w-[86%] max-w-xs flex-col justify-between bg-white p-5 shadow-xl">
            <div className="overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#EAF2F6] pb-4">
                <AgentzyLogo variant="light" size="sm" />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Tutup Menu"
                  className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#D8E3E9] text-[#526675] hover:bg-[#EAF2F6]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-1">
                <p className="px-2 pb-1 text-xs font-semibold text-[#526675]">
                  Navigasi Halaman
                </p>
                {[
                  { href: '#tentang', label: 'Tentang Agent-zy' },
                  { href: '#ekosistem', label: 'Ekosistem & Peta Kolaborasi' },
                  { href: '#kolaborasi-ai', label: 'Kolaborasi Manusia & AI' },
                  { href: '#solusi', label: 'Solusi Tenaga Kerja' },
                  { href: '#layanan', label: 'Katalog Layanan' },
                  { href: '#industri', label: 'Industri & ISP' },
                  { href: '#kemitraan', label: 'Proses Kerja Sama' },
                  { href: '#faq', label: 'FAQ' },
                ].map((navItem) => (
                  <a
                    key={navItem.href}
                    href={navItem.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex h-11 items-center justify-between rounded-[10px] px-3 text-sm font-semibold text-[#17324D] transition hover:bg-[#E6F4F9]"
                  >
                    <span>{navItem.label}</span>
                    <ArrowRight className="h-4 w-4 text-[#5F879E]" />
                  </a>
                ))}
              </div>

              <div className="mt-5 space-y-2 border-t border-[#EAF2F6] pt-4">
                <p className="px-2 text-xs font-semibold text-[#526675]">
                  Akses Portal
                </p>
                <Link
                  href="/corporate"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-11 items-center gap-2.5 rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] px-3 text-xs font-semibold text-[#17324D]"
                >
                  <Building2 className="h-4 w-4 text-[#0284C7]" />
                  <span>Corporate / ISP Portal</span>
                </Link>
                <Link
                  href="/ai-workforce"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-11 items-center gap-2.5 rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] px-3 text-xs font-semibold text-[#17324D]"
                >
                  <Bot className="h-4 w-4 text-[#0284C7]" />
                  <span>AI Workforce Management</span>
                </Link>
                <Link
                  href="/workforce"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-11 items-center gap-2.5 rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] px-3 text-xs font-semibold text-[#17324D]"
                >
                  <Smartphone className="h-4 w-4 text-[#0284C7]" />
                  <span>Portal Workforce</span>
                </Link>
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-11 items-center gap-2.5 rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] px-3 text-xs font-semibold text-[#17324D]"
                >
                  <ShieldCheck className="h-4 w-4 text-[#0284C7]" />
                  <span>Super Admin Control Plane</span>
                </Link>
              </div>
            </div>

            <div className="border-t border-[#EAF2F6] pt-4">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsPartnershipOpen(true);
                }}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#0284C7] px-4 text-sm font-semibold text-white transition hover:bg-[#0369A1]"
              >
                <span>Ajukan Kerja Sama</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <main>
        {/* 1. Hero Section */}
        <section className="border-b border-[#D8E3E9] bg-white">
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-stretch gap-7 px-4 py-8 sm:gap-10 sm:px-6 sm:py-12 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-20">
            <div className="flex flex-col justify-center lg:col-span-6">
              <p className="text-xs font-semibold tracking-wide text-[#0284C7]">
                Jasa &amp; Tenaga Kerja Terkelola Agent-zy
              </p>
              <h1
                className="mt-2.5 text-[1.75rem] font-bold leading-[1.2] tracking-tight text-[#17324D] sm:mt-3 sm:text-4xl lg:text-5xl lg:leading-[1.15]"
                style={{ textWrap: 'balance' }}
              >
                Smarter Workforce, Powered by Human &amp; AI
              </h1>
              <p className="mt-3.5 max-w-xl text-sm leading-relaxed text-[#17324D] font-medium sm:mt-4 sm:text-base">
                Menyediakan Jasa dan Tenaga Kerja dengan Support Teknologi dan
                Artificial Intelligence.
              </p>
              <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-[#526675] sm:text-base">
                Ingin mempercepat pertumbuhan pelanggan ISP dan bisnis Anda tanpa repot
                membangun tim dari nol? Agent-zy menghadirkan{' '}
                <strong className="font-semibold text-[#17324D]">
                  Staff Sales, jaringan Affiliate, dan Teknisi Lapangan terkelola
                </strong>{' '}
                yang diperkuat asisten AI — siap meningkatkan penjualan dan menjaga
                kualitas layanan di setiap wilayah.
              </p>

              <div className="mt-6 flex flex-col gap-2.5 sm:mt-7 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                <button
                  type="button"
                  onClick={() => setIsPartnershipOpen(true)}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#0284C7] px-6 text-sm font-semibold text-white transition hover:bg-[#0369A1] whitespace-nowrap shrink-0 sm:w-auto"
                >
                  <span>Ajukan Kerja Sama</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <div className="grid grid-cols-2 gap-2.5 sm:contents">
                  <Link
                    href="/corporate"
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-[10px] border border-[#B8C9D3] bg-white px-3 text-xs font-semibold text-[#17324D] transition hover:bg-[#E6F4F9] whitespace-nowrap shrink-0 sm:h-12 sm:gap-2 sm:px-5 sm:text-sm"
                  >
                    <Building2 className="h-4 w-4 shrink-0 text-[#0284C7]" />
                    <span className="truncate">Corporate Portal</span>
                  </Link>
                  <Link
                    href="/workforce"
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-[10px] border border-[#B8C9D3] bg-white px-3 text-xs font-semibold text-[#17324D] transition hover:bg-[#E6F4F9] whitespace-nowrap shrink-0 sm:h-12 sm:gap-2 sm:px-5 sm:text-sm"
                  >
                    <Smartphone className="h-4 w-4 shrink-0 text-[#0284C7]" />
                    <span className="truncate">Portal Workforce</span>
                  </Link>
                  <PWAInstallButton
                    variant="subtle"
                    className="col-span-2 h-11 w-full justify-center px-4 sm:col-span-1 sm:h-12 sm:w-auto"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-[#EAF2F6] pt-4 text-xs text-[#526675] sm:mt-8 sm:gap-x-5 sm:pt-5">
                <span>Partner Pertumbuhan ISP &amp; Enterprise</span>
                <span aria-hidden="true">·</span>
                <span>AI Marketing &amp; Leads untuk Sales</span>
                <span aria-hidden="true">·</span>
                <span>AI Operasional &amp; Teknis untuk Teknisi</span>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative h-full min-h-[240px] overflow-hidden rounded-[14px] border border-[#D8E3E9] bg-[#EAF2F6] sm:min-h-[320px] lg:min-h-[420px]">
                <Image
                  src="/images/hero_agentzy_workforce.jpg"
                  alt="Kolaborasi tim profesional Staff Sales, Teknisi, dan dukungan AI Agentzy untuk pertumbuhan bisnis mitra"
                  fill
                  priority
                  referrerPolicy="no-referrer"
                  className="object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#17324D]/90 via-[#17324D]/55 to-transparent p-4 text-white sm:p-5">
                  <p className="text-xs font-medium text-[#ADD8E6]">
                    Kemitraan Terkelola · Hasil Penjualan &amp; Layanan Terukur
                  </p>
                  <p className="mt-1 text-xs font-semibold sm:text-sm">
                    Tingkatkan akuisisi pelanggan baru lebih cepat dengan tim terlatih dan dukungan teknologi AI yang tepat sasaran
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Tentang Agentzy & Keunggulan Kerja Sama */}
        <section id="tentang" className="border-b border-[#D8E3E9] bg-[#F5F8FA] py-10 sm:py-14 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold text-[#0284C7]">
                Tentang Agent-zy &amp; Keunggulan Kemitraan
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#17324D] sm:text-3xl">
                Partner Operasional yang Menyatukan Tenaga Kerja Profesional dan Teknologi AI
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#526675] sm:text-base">
                Agent-zy hadir sebagai penyedia jasa dan tenaga kerja dengan dukungan teknologi
                serta Artificial Intelligence untuk mempercepat penjualan dan memperluas
                jangkauan layanan perusahaan Anda — mulai dari ISP hingga sektor komersial
                lainnya secara terukur.
              </p>
            </div>

            {/* 4 Portal Overview */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:gap-5 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-[14px] border border-[#87CEEB] bg-white p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#17324D] text-white">
                  <Building2 className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-[#172B3A]">
                  Corporate / ISP Portal
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#526675]">
                  Dasbor eksekutif perusahaan mitra untuk memantau pertumbuhan pelanggan,
                  performa sales, jadwal teknisi, kontrak kerja sama, dan tagihan.
                </p>
                <Link
                  href="/corporate"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0284C7] hover:underline"
                >
                  <span>Lihat Corporate Portal</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="rounded-[14px] border border-[#87CEEB] bg-white p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#0284C7] text-white">
                  <Smartphone className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-[#172B3A]">
                  Portal Workforce Agentzy
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#526675]">
                  Aplikasi mobile-first bagi Staff Sales, Affiliate Freelance, dan Teknisi
                  untuk menerima prospek, materi promosi AI, jadwal pasang, dan komisi.
                </p>
                <Link
                  href="/workforce"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0284C7] hover:underline"
                >
                  <span>Buka Portal Workforce</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#17324D]">
                  <Bot className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-[#172B3A]">
                  Layanan Asisten AI Terkelola
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#526675]">
                  Asisten AI yang disesuaikan dengan promo dan standar layanan perusahaan
                  Anda — siap mendukung pemasaran tim sales dan operasional teknisi.
                </p>
                <Link
                  href="/ai-workforce"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0284C7] hover:underline"
                >
                  <span>Buka AI Workforce Portal</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#17324D]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-[#172B3A]">
                  Pengawasan Mutu &amp; Transparansi
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#526675]">
                  Pengelolaan kualitas tim, kepatuhan kerja sama, perlindungan data
                  pelanggan, serta laporan pencapaian bisnis yang jelas dan akuntabel.
                </p>
                <Link
                  href="/admin"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0284C7] hover:underline"
                >
                  <span>Buka Super Admin Control Plane</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* 6 Business Advantages */}
            <div className="mt-6 rounded-[14px] border border-[#D8E3E9] bg-white p-4 sm:mt-8 sm:p-6">
              <div className="flex flex-col gap-3 border-b border-[#EAF2F6] pb-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2">
                <div>
                  <h3 className="text-base font-bold text-[#17324D]">
                    Mengapa Perusahaan Memilih Bermitra dengan Agent-zy?
                  </h3>
                  <p className="mt-1 text-xs text-[#526675]">
                    Dirancang agar perusahaan mitra bisa fokus pada produk dan jaringan utama sementara pertumbuhan pelanggan berjalan optimal
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPartnershipOpen(true)}
                  className="inline-flex h-9 items-center gap-1.5 self-start text-xs font-semibold text-[#0284C7] hover:underline whitespace-nowrap"
                >
                  <span>Konsultasi Kebutuhan Bisnis</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:mt-5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {PLATFORM_ADVANTAGES.map((adv) => (
                  <div
                    key={adv.title}
                    className="rounded-[12px] border border-[#EAF2F6] bg-[#F8FBFD] p-4"
                  >
                    <div className="flex items-center gap-2 text-sm font-bold text-[#17324D]">
                      <Check className="h-4 w-4 shrink-0 text-[#247A55]" />
                      <span>{adv.title}</span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#526675]">
                      {adv.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 2B, 2C, 2D. Ecosystem Illustration, Structural Universe & Role-Based AI Collaboration */}
        <AgentzyEcosystemSections
          onRequestPartnership={() => setIsPartnershipOpen(true)}
        />

        {/* 3. Solutions: Human, AI, Hybrid Workforce */}
        <section id="solusi" className="border-b border-[#D8E3E9] bg-white py-10 sm:py-14 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-semibold text-[#0284C7]">
                  Solusi &amp; Layanan Bisnis
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#17324D] sm:text-3xl">
                  Pilih Solusi Tenaga Kerja Sesuai Target Pertumbuhan Anda
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-[#526675] sm:text-base">
                  Fleksibel menyesuaikan kebutuhan perusahaan: mulai dari tim penjualan
                  &amp; teknisi terkelola, asisten AI pemasaran &amp; operasional, hingga
                  paket kolaborasi lengkap Hybrid Workforce.
                </p>
              </div>

              <div className="grid w-full grid-cols-3 gap-1 rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] p-1 sm:inline-flex sm:w-auto sm:self-start">
                {(
                  [
                    { id: 'human', label: 'Human Workforce', mobileLabel: 'Human' },
                    { id: 'ai', label: 'AI Workforce', mobileLabel: 'AI Support' },
                    { id: 'hybrid', label: 'Hybrid Workforce', mobileLabel: 'Hybrid' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSolutionTab(t.id)}
                    className={`min-h-[40px] rounded-[8px] px-2 py-2 text-xs font-semibold transition whitespace-nowrap truncate sm:min-h-0 sm:px-3.5 ${
                      solutionTab === t.id
                        ? 'bg-[#17324D] text-white'
                        : 'text-[#526675] hover:text-[#17324D]'
                    }`}
                  >
                    <span className="sm:hidden">{t.mobileLabel}</span>
                    <span className="hidden sm:inline">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:mt-8 sm:gap-6 lg:grid-cols-12">
              {solutionTab === 'human' && (
                <>
                  <div className="rounded-[14px] border border-[#D8E3E9] bg-[#F5F8FA] p-4 sm:p-6 lg:col-span-7">
                    <div className="flex items-center gap-3">
                      <Users className="h-6 w-6 text-[#0284C7]" />
                      <h3 className="text-xl font-bold text-[#17324D]">
                        Human Workforce Terkelola
                      </h3>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-[#526675]">
                      Kami menyiapkan dan mengelola tenaga kerja lapangan profesional
                      mulai dari Staff Sales, jaringan Affiliate Freelance, hingga Teknisi
                      Lapangan agar ekspansi area dan pelayanan pelanggan berjalan cepat
                      serta terstandar.
                    </p>
                    <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {[
                        'Staff Sales Berjenjang (Training, Pro, Elite)',
                        'Jaringan Affiliate Freelance dengan Bagi Hasil 60/40',
                        'Teknisi Instalasi & Perawatan Bersertifikat',
                        'Rekrutmen, Pembekalan & Penempatan Wilayah',
                        'Absensi Lokasi & Kepatuhan Standar Layanan',
                        'Laporan Penjualan & Kepuasan Pelanggan Transparan',
                      ].map((pt) => (
                        <li
                          key={pt}
                          className="flex items-start gap-2 text-sm text-[#172B3A]"
                        >
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#247A55]" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-col justify-between rounded-[14px] border border-[#D8E3E9] bg-[#E6F4F9] p-4 sm:p-6 lg:col-span-5">
                    <div>
                      <p className="text-xs font-semibold text-[#245477]">
                        Siap Diterapkan di Wilayah Anda
                      </p>
                      <h4 className="mt-1 text-lg font-bold text-[#17324D]">
                        Lihat Pengalaman Tim di Portal Workforce
                      </h4>
                      <p className="mt-2 text-sm text-[#526675]">
                        Tinjau langsung bagaimana Staff Sales mengelola prospek dan mitra
                        Affiliate, hingga cara Teknisi menjalankan tugas pemasangan
                        lapangan dengan panduan peta digital.
                      </p>
                    </div>
                    <Link
                      href="/workforce"
                      className="mt-6 inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#0284C7] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0369A1]"
                    >
                      <span>Buka Portal Workforce</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </>
              )}

              {solutionTab === 'ai' && (
                <>
                  <div className="rounded-[14px] border border-[#D8E3E9] bg-[#F5F8FA] p-4 sm:p-6 lg:col-span-7">
                    <div className="flex items-center gap-3">
                      <Bot className="h-6 w-6 text-[#0284C7]" />
                      <h3 className="text-xl font-bold text-[#17324D]">
                        AI Workforce Sesuai Peran Bisnis
                      </h3>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-[#526675]">
                      Setiap Asisten AI di Agentzy dirancang khusus agar langsung memberi
                      dampak pada hasil penjualan dan kecepatan layanan — dengan pembagian
                      peran yang jelas antara tim pemasaran dan tim teknisi.
                    </p>
                    <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {[
                        'AI Digital Marketing & Kampanye Promo (Sales & Affiliate)',
                        'AI Generate Content & Caption Media Sosial (Sales & Affiliate)',
                        'AI Pencari, Penjaring & Penyaring Leads 24/7',
                        'AI Asisten Penawaran & Follow-Up Closing Pelanggan',
                        'AI Pengatur Jadwal & Rute Kunjungan (Khusus Teknisi)',
                        'AI Panduan Teknis & Penjaga Mutu Layanan (Khusus Teknisi)',
                      ].map((pt) => (
                        <li
                          key={pt}
                          className="flex items-start gap-2 text-sm text-[#172B3A]"
                        >
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#247A55]" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 sm:p-6 lg:col-span-5">
                    <p className="text-xs font-semibold text-[#526675]">
                      Manfaat Langsung bagi Perusahaan Mitra
                    </p>
                    <ol className="mt-4 space-y-2.5 text-sm">
                      {[
                        'Produksi konten promosi harian lebih cepat & konsisten',
                        'Calon pelanggan online langsung disambut & disaring 24 jam',
                        'Staff Sales & Affiliate lebih fokus melakukan penawaran & closing',
                        'Jadwal kunjungan Teknisi lebih teratur dengan risiko telat minimal',
                        'Anggaran pemakaian AI terpantau & terkontrol sesuai kebutuhan',
                      ].map((benefit, i) => (
                        <li
                          key={benefit}
                          className="flex items-center gap-3 rounded-[10px] border border-[#EAF2F6] bg-[#F5F8FA] px-3.5 py-2.5 font-medium text-[#17324D]"
                        >
                          <span className="font-mono-tabular text-xs font-bold text-[#0284C7]">
                            0{i + 1}
                          </span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </>
              )}

              {solutionTab === 'hybrid' && (
                <div className="rounded-[14px] border border-[#D8E3E9] bg-[#F5F8FA] p-4 sm:p-6 lg:col-span-12">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <Layers className="h-6 w-6 text-[#0284C7]" />
                      <h3 className="text-xl font-bold text-[#17324D]">
                        Alur Kerja Hybrid Workforce: Kolaborasi Optimal untuk Pertumbuhan Bisnis
                      </h3>
                    </div>
                    <span className="text-xs font-medium text-[#526675]">
                      Sinergi Pemasaran Digital · Penjualan Manusia · Eksekusi Teknis
                    </span>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      {
                        step: '01 · AI Marketing & Konten Sosmed',
                        actor: 'AI + Staff Sales & Affiliate',
                        icon: Megaphone,
                        desc: 'AI membantu Staff Sales & Affiliate membuat konten media sosial, materi iklan digital marketing, dan pesan promosi area siap sebar.',
                      },
                      {
                        step: '02 · Cari Leads & Follow-Up Closing',
                        actor: 'AI Leads + Staff Sales & Affiliate',
                        icon: Sparkles,
                        desc: 'AI menjaring dan menyaring calon pelanggan paling siap beli, lalu Staff Sales & Affiliate menghubungi untuk penawaran dan closing.',
                      },
                      {
                        step: '03 · Operasional & Teknis Lapangan',
                        actor: 'AI Operasional + Teknisi',
                        icon: Wrench,
                        desc: 'AI membantu Teknisi mengatur jadwal, rute kunjungan tercepat, dan memberi panduan teknis agar pemasangan berjalan rapi tepat waktu.',
                      },
                      {
                        step: '04 · Pelanggan Aktif & Bagi Hasil',
                        actor: 'Perusahaan Mitra & Tim Agentzy',
                        icon: TrendingUp,
                        desc: 'Pelanggan resmi aktif berlangganan, manajemen memantau laporan pertumbuhan di Corporate Portal, dan komisi cair transparan.',
                      },
                    ].map((node) => {
                      const Icon = node.icon;
                      return (
                        <div
                          key={node.step}
                          className="rounded-[12px] border border-[#D8E3E9] bg-white p-4"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-[#0284C7]">
                              {node.step}
                            </p>
                            <Icon className="h-4 w-4 text-[#17324D] shrink-0" />
                          </div>
                          <p className="mt-1 text-xs font-semibold text-[#17324D]">
                            {node.actor}
                          </p>
                          <p className="mt-2 text-xs leading-relaxed text-[#526675]">
                            {node.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 4. Service Catalogue (Tanpa Harga) */}
        <section id="layanan" className="border-b border-[#D8E3E9] bg-[#F5F8FA] py-10 sm:py-14 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-semibold text-[#0284C7]">
                  Katalog Jasa &amp; Tenaga Kerja
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#17324D] sm:text-3xl">
                  Smarter Workforce, Powered by Human &amp; AI
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-[#526675] sm:text-base">
                  Menyediakan jasa dan tenaga kerja dengan support teknologi dan Artificial
                  Intelligence sesuai target ekspansi area dan kebutuhan pemasaran Anda.
                </p>
              </div>
              <div className="grid w-full grid-cols-2 gap-1 rounded-[10px] border border-[#D8E3E9] bg-white p-1 sm:inline-flex sm:w-auto sm:self-start">
                <button
                  type="button"
                  onClick={() => setCatalogueTab('human')}
                  className={`min-h-[40px] rounded-[8px] px-3 py-2 text-xs font-semibold transition whitespace-nowrap truncate sm:min-h-0 sm:px-4 ${
                    catalogueTab === 'human'
                      ? 'bg-[#0284C7] text-white'
                      : 'text-[#526675] hover:text-[#17324D]'
                  }`}
                >
                  <span className="sm:hidden">Tenaga Kerja ({publicCatalogue?.human_workforce.length ?? 0})</span>
                  <span className="hidden sm:inline">Human Workforce ({publicCatalogue?.human_workforce.length ?? 0} Layanan)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogueTab('ai')}
                  className={`min-h-[40px] rounded-[8px] px-3 py-2 text-xs font-semibold transition whitespace-nowrap truncate sm:min-h-0 sm:px-4 ${
                    catalogueTab === 'ai'
                      ? 'bg-[#0284C7] text-white'
                      : 'text-[#526675] hover:text-[#17324D]'
                  }`}
                >
                  <span className="sm:hidden">Dukungan AI ({publicCatalogue?.ai_workforce.length ?? 0})</span>
                  <span className="hidden sm:inline">AI Workforce ({publicCatalogue?.ai_workforce.length ?? 0} Layanan)</span>
                </button>
              </div>
            </div>

            {catalogueLoading ? (
              <div className="mt-6 rounded-[14px] border border-[#D8E3E9] bg-white p-6 text-sm text-[#526675]">Memuat katalog layanan dari Agentzy API…</div>
            ) : catalogueError ? (
              <div role="alert" className="mt-6 rounded-[14px] border border-[#B23A48]/30 bg-white p-6 text-sm text-[#B23A48]">Katalog layanan tidak tersedia: {catalogueError}</div>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 md:grid-cols-2 lg:grid-cols-3">
                {(catalogueTab === 'human'
                  ? publicCatalogue?.human_workforce ?? []
                  : publicCatalogue?.ai_workforce ?? []
                ).map((svc, idx) => (
                  <div
                    key={svc.service_key}
                    className="flex flex-col justify-between rounded-[14px] border border-[#D8E3E9] bg-white p-5 transition hover:border-[#87CEEB]"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-[#526675]">
                        <span className="font-mono-tabular font-semibold text-[#0284C7]">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span>{catalogueTab === 'human' ? 'Tim Profesional' : 'Dukungan AI'}</span>
                      </div>
                      <h3 className="mt-2 text-base font-bold text-[#17324D]">{svc.name}</h3>
                      <p className="mt-1 text-xs text-[#5F879E]">{svc.summary}</p>
                      <p className="mt-2 text-sm leading-relaxed text-[#526675]">{svc.scope}</p>
                      <p className="mt-2 text-xs leading-relaxed text-[#526675]"><span className="font-semibold text-[#17324D]">Batas layanan:</span> {svc.boundary}</p>
                    </div>
                    <div className="mt-4 space-y-1.5 border-t border-[#EAF2F6] pt-3 text-xs">
                      <p className="text-[#172B3A]"><span className="font-semibold">Hasil Bisnis:</span> {svc.output}</p>
                      <p className="text-[#526675]"><span className="font-semibold text-[#17324D]">Governance:</span> {svc.governance}</p>
                    </div>
                  </div>
                ))}
                {((catalogueTab === 'human' ? publicCatalogue?.human_workforce : publicCatalogue?.ai_workforce) ?? []).length === 0 && (
                  <p className="col-span-full rounded-[14px] border border-[#D8E3E9] bg-white p-6 text-sm text-[#526675]">Belum ada layanan yang dipublikasikan.</p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* 5. Industries Supported */}
        <section id="industri" className="border-b border-[#D8E3E9] bg-white py-10 sm:py-14 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 items-center gap-7 sm:gap-10 lg:grid-cols-12">
              <div className="lg:col-span-6">
                <p className="text-xs font-semibold text-[#0284C7]">
                  Industri yang Kami Dukung · Fokus Awal Telekomunikasi &amp; ISP
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#17324D] sm:text-3xl">
                  Solusi Nyata untuk Industri ISP, Telekomunikasi &amp; Sektor Bisnis Berkembang
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[#526675] sm:text-base">
                  Agent-zy dirancang untuk menjawab kebutuhan nyata penyedia layanan
                  internet (FTTH, Wireless/FWA, Internet Bisnis) dalam mempercepat
                  akuisisi pelanggan sekaligus menjaga keandalan instalasi lapangan — dan
                  siap memperluas dukungan ke berbagai sektor usaha lainnya.
                </p>

                <div className="mt-6 space-y-4">
                  <div className="rounded-[12px] border border-[#87CEEB] bg-[#E6F4F9]/45 p-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#17324D]">
                      <RadioTower className="h-4 w-4 shrink-0 text-[#0284C7]" />
                      <span>Fokus Awal: Telekomunikasi &amp; ISP</span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#526675]">
                      Mendukung kebutuhan akuisisi pelanggan baru lewat Staff Sales &amp;
                      Affiliate (dibantu AI Digital Marketing &amp; Konten Sosmed), serta
                      pemasangan &amp; perawatan oleh Teknisi Lapangan (dibantu AI
                      Operasional &amp; Teknis).
                    </p>
                  </div>

                  <div className="rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#17324D]">
                      <Briefcase className="h-4 w-4 shrink-0 text-[#0284C7]" />
                      <span>Industri Lainnya yang Siap Didukung</span>
                    </div>
                    <div className="mt-2.5 grid grid-cols-1 gap-2 text-xs text-[#172B3A] min-[380px]:grid-cols-2">
                      <div className="rounded-[8px] border border-[#D8E3E9] bg-white px-3 py-2 font-medium">
                        Ritel &amp; Distribusi
                      </div>
                      <div className="rounded-[8px] border border-[#D8E3E9] bg-white px-3 py-2 font-medium">
                        Properti &amp; Kawasan
                      </div>
                      <div className="rounded-[8px] border border-[#D8E3E9] bg-white px-3 py-2 font-medium">
                        Manufaktur &amp; Produk B2B
                      </div>
                      <div className="rounded-[8px] border border-[#D8E3E9] bg-white px-3 py-2 font-medium">
                        Jasa &amp; Layanan Lapangan
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="relative h-[240px] overflow-hidden rounded-[14px] border border-[#D8E3E9] bg-[#EAF2F6] sm:h-[340px] lg:h-[400px]">
                  <Image
                    src="/images/workforce_technician_field.jpg"
                    alt="Teknisi lapangan profesional melayani instalasi internet fiber di perumahan pelanggan"
                    fill
                    referrerPolicy="no-referrer"
                    className="object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#17324D]/90 via-[#17324D]/45 to-transparent p-4 text-white sm:p-5">
                    <p className="text-xs font-medium text-[#ADD8E6]">
                      Kesiapan Ekspansi Lapangan · Online &amp; Offline Ready
                    </p>
                    <p className="mt-1 text-xs font-semibold sm:text-sm">
                      Pemasaran digital gencar di media sosial, pemasangan di lapangan tuntas rapi &amp; tepat waktu
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Partnership Process (9 Stages) */}
        <section id="kemitraan" className="border-b border-[#D8E3E9] bg-[#F5F8FA] py-10 sm:py-14 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-semibold text-[#0284C7]">
                  Langkah Mudah Bermitra
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#17324D] sm:text-3xl">
                  Proses Kerja Sama Terstruktur (9 Tahap)
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-[#526675] sm:text-base">
                  Dari pengajuan awal hingga peluncuran tim di area target Anda — semua
                  berjalan sistematis, jelas jadwalnya, dan terukur hasilnya.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPartnershipOpen(true)}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#0284C7] px-5 text-sm font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap shrink-0 sm:w-auto sm:self-start"
              >
                <GitBranch className="h-4 w-4" />
                <span>Ajukan Kerja Sama Sekarang</span>
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3.5 sm:mt-8 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {PARTNERSHIP_STEPS.map((s) => (
                <div
                  key={s.step}
                  className="rounded-[14px] border border-[#D8E3E9] bg-white p-5"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono-tabular flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#E6F4F9] text-xs font-bold text-[#0284C7]">
                      {s.step}
                    </span>
                    <h3 className="text-sm font-bold text-[#17324D]">
                      {s.title}
                    </h3>
                  </div>
                  <p className="mt-2.5 text-xs leading-relaxed text-[#526675]">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6B. Join as Agentzy Workforce Banner */}
        <section className="border-b border-[#D8E3E9] bg-white py-10 sm:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-[16px] border border-[#D8E3E9] bg-[#F5F8FA]">
              <div className="grid grid-cols-1 items-center lg:grid-cols-12">
                <div className="p-5 sm:p-8 lg:col-span-7">
                  <p className="text-xs font-semibold text-[#0284C7]">
                    Peluang Karir &amp; Kemitraan Individu
                  </p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#17324D] sm:text-3xl">
                    Bergabung sebagai Staff Sales, Affiliate, atau Teknisi Agent-zy
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-[#526675] sm:text-base">
                    Jadilah bagian dari jaringan tenaga kerja profesional Agent-zy.
                    Dapatkan penghasilan menarik dengan dukungan teknologi dan AI untuk konten media
                    sosial, pencarian calon pelanggan, maupun panduan kerja lapangan
                    serta pencairan komisi yang transparan.
                  </p>
                  <ul className="mt-4 grid grid-cols-1 gap-2 text-xs text-[#172B3A] sm:grid-cols-2 sm:text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 shrink-0 text-[#247A55]" />
                      <span>Staff Sales · Komisi 100% + Bonus Affiliate</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 shrink-0 text-[#247A55]" />
                      <span>Affiliate Freelance · Bagi Hasil 60% Fleksibel</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 shrink-0 text-[#247A55]" />
                      <span>Teknisi Lapangan · Insentif &amp; Panduan AI Teknis</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 shrink-0 text-[#247A55]" />
                      <span>Pelatihan, Sertifikasi &amp; Peluang di Banyak Kota</span>
                    </li>
                  </ul>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Link
                      href="/workforce"
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#17324D] px-5 text-sm font-semibold text-white transition hover:bg-[#245477] whitespace-nowrap sm:w-auto"
                    >
                      <span>Daftar &amp; Masuk Portal Workforce</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
                <div className="relative h-52 w-full bg-[#EAF2F6] sm:h-64 lg:col-span-5 lg:h-full lg:min-h-[340px]">
                  <Image
                    src="/images/workforce_sales_banner.jpg"
                    alt="Tim Staff Sales dan Affiliate Agentzy berkolaborasi memantau prospek dan target penjualan"
                    fill
                    referrerPolicy="no-referrer"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. FAQ Section */}
        <section id="faq" className="border-b border-[#D8E3E9] bg-[#F5F8FA] py-10 sm:py-14 lg:py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-[#17324D] sm:text-3xl">
                Pertanyaan yang Sering Diajukan
              </h2>
              <p className="mt-2 text-sm text-[#526675] sm:text-base">
                Jawaban ringkas mengenai kerja sama bisnis, dukungan AI bagi Staff Sales,
                Affiliate, dan Teknisi, serta transparansi hasil di Agentzy.
              </p>
            </div>

            <div className="mt-8 divide-y divide-[#D8E3E9] rounded-[14px] border border-[#D8E3E9] bg-white">
              {(publicCatalogue?.faqs ?? []).map((faq, idx) => {
                const isOpen = openFaqIdx === idx;
                return (
                  <div
                    key={faq.faq_key}
                    className="bg-white first:rounded-t-[14px] last:rounded-b-[14px]"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    >
                      <span className="text-sm font-semibold text-[#17324D]">
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-[#526675] transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="border-t border-[#EAF2F6] px-5 py-4 text-sm leading-relaxed text-[#526675]">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 8. CTA & Contact Section */}
        <section className="bg-[#17324D] py-10 text-white sm:py-14">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 sm:gap-8 sm:px-6 lg:flex-row lg:items-center lg:px-8">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Siap Mengakselerasi Penjualan &amp; Operasional Bisnis Anda Bersama Agent-zy?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#ADD8E6] sm:text-base">
                Ajukan kerja sama untuk wilayah ekspansi Anda, jadwalkan sesi konsultasi
                bisnis melalui Google Meet, atau kirim pertanyaan langsung kepada tim
                kemitraan kami.
              </p>
            </div>
            <div className="grid w-full grid-cols-1 gap-2.5 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-3">
              <button
                type="button"
                onClick={() => setIsPartnershipOpen(true)}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#87CEEB] px-5 text-sm font-bold text-[#17324D] transition hover:bg-[#ADD8E6] whitespace-nowrap shrink-0 sm:w-auto"
              >
                <span>Ajukan Kerja Sama</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const start = new Date(Date.now() + 86400000);
                  start.setHours(10, 0, 0, 0);
                  const end = new Date(start.getTime() + 45 * 60000);
                  openScheduleMeetingModal({
                    summary: 'Diskusi Kerja Sama Bisnis — Agent-zy',
                    description:
                      'Konsultasi kebutuhan tim Staff Sales, Affiliate, Teknisi Lapangan, serta dukungan teknologi & Asisten AI untuk pertumbuhan perusahaan.',
                    startIso: start.toISOString(),
                    endIso: end.toISOString(),
                    includeMeet: true,
                  });
                }}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-[#5F879E] bg-[#245477] px-4 text-sm font-semibold text-white transition hover:bg-[#2D6F91] whitespace-nowrap shrink-0 sm:w-auto"
              >
                <Calendar className="h-4 w-4 shrink-0" />
                <span>Jadwalkan Diskusi</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  openSendEmailModal({
                    to: 'partnership@agentzy.id',
                    subject: 'Permintaan Kerja Sama Bisnis dengan Agent-zy',
                    body: 'Halo Tim Kemitraan Agent-zy,\n\nKami tertarik mendiskusikan kerja sama penyediaan jasa dan tenaga kerja dengan support teknologi dan Artificial Intelligence untuk ekspansi bisnis kami.\n\nTerima kasih.',
                    contextLabel: 'Kirim pesan ke tim kemitraan Agent-zy via Gmail.',
                  })
                }
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-[#5F879E] px-4 text-sm font-semibold text-white transition hover:bg-[#245477] whitespace-nowrap shrink-0 sm:w-auto"
              >
                <Mail className="h-4 w-4 shrink-0" />
                <span>Hubungi Kami</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Enterprise Footer */}
      <footer className="border-t border-[#D8E3E9] bg-white py-8 sm:py-10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div>
            <AgentzyLogo variant="light" size="sm" />
            <p className="mt-2.5 max-w-md text-xs leading-relaxed text-[#526675]">
              © {new Date().getFullYear()} Agent-zy. Smarter Workforce, Powered by Human &amp; AI — Menyediakan Jasa dan Tenaga Kerja dengan Support Teknologi dan Artificial Intelligence.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs font-medium text-[#526675] sm:flex sm:flex-wrap sm:items-center sm:gap-5">
            <Link href="/corporate" className="py-1 hover:text-[#17324D]">
              Corporate / ISP Portal
            </Link>
            <Link href="/ai-workforce" className="py-1 hover:text-[#17324D]">
              AI Workforce Portal
            </Link>
            <Link href="/workforce" className="py-1 hover:text-[#17324D]">
              Portal Workforce
            </Link>
            <Link href="/admin" className="py-1 hover:text-[#17324D]">
              Super Admin Portal
            </Link>
            <button
              type="button"
              onClick={() => setLegalModal('privacy')}
              className="py-1 text-left hover:text-[#17324D]"
            >
              Kebijakan Privasi
            </button>
            <button
              type="button"
              onClick={() => setLegalModal('terms')}
              className="py-1 text-left hover:text-[#17324D]"
            >
              Syarat &amp; Ketentuan
            </button>
            <button
              type="button"
              onClick={() => setLegalModal('security')}
              className="py-1 text-left hover:text-[#17324D]"
            >
              Keamanan &amp; Kepatuhan
            </button>
          </div>
        </div>
      </footer>

      <PartnershipModal
        isOpen={isPartnershipOpen}
        onClose={() => setIsPartnershipOpen(false)}
      />

      {legalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B3A]/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-[14px] border border-[#D8E3E9] bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#EAF2F6] pb-3">
              <div className="flex items-center gap-2.5">
                <FileText className="h-5 w-5 text-[#0284C7]" />
                <h3 className="text-base font-bold text-[#172B3A]">
                  {legalModal === 'privacy'
                    ? 'Kebijakan Privasi & Perlindungan Data'
                    : legalModal === 'terms'
                      ? 'Syarat & Ketentuan Kemitraan Agentzy'
                      : 'Komitmen Keamanan & Kepatuhan'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="rounded-lg p-1 text-[#526675] hover:bg-[#EAF2F6]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-2.5 text-sm leading-relaxed text-[#526675]">
              {legalModal === 'privacy' && (
                <>
                  <p>
                    Agentzy menjaga kerahasiaan data perusahaan mitra, data tim
                    lapangan, serta informasi calon pelanggan sesuai prinsip persetujuan
                    jelas dan kepatuhan terhadap Undang-Undang Perlindungan Data Pribadi
                    (UU PDP) Indonesia.
                  </p>
                  <p>
                    Data lokasi dan dokumentasi lapangan hanya digunakan untuk kebutuhan
                    verifikasi kunjungan kerja dan kepastian layanan pelanggan.
                  </p>
                </>
              )}
              {legalModal === 'terms' && (
                <>
                  <p>
                    Pembagian peran antara Staff Sales, Affiliate Freelance, dan Teknisi
                    Lapangan diatur dalam perjanjian resmi kerja sama dengan skema
                    target dan bagi hasil yang disepakati bersama.
                  </p>
                  <p>
                    Seluruh komisi penjualan dan layanan dicatat berdasarkan pelanggan
                    yang resmi aktif berlangganan sesuai laporan mitra.
                  </p>
                </>
              )}
              {legalModal === 'security' && (
                <>
                  <p>
                    Data penjualan, daftar prospek, dan laporan keuangan setiap
                    perusahaan mitra tersimpan secara terpisah dan aman dengan kontrol
                    akses berjenjang sesuai jabatan pengguna.
                  </p>
                  <p>
                    Seluruh aktivitas penting dalam kerja sama tercatat rapi untuk
                    memudahkan peninjauan dan evaluasi berkala bersama manajemen.
                  </p>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => setLegalModal(null)}
              className="mt-5 w-full rounded-[10px] bg-[#17324D] py-2.5 text-sm font-semibold text-white hover:bg-[#245477]"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
