'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { AgentzyLogo } from '@/components/brand/AgentzyLogo';
import { PWAInstallButton } from '@/components/pwa/PWAControls';
import { PartnershipModal } from './PartnershipModal';
import { AgentzyEcosystemSections } from './AgentzyEcosystemSections';
import {
  HUMAN_WORKFORCE_CATALOGUE,
  AI_WORKFORCE_CATALOGUE,
  PARTNERSHIP_STEPS,
  LANDING_FAQS,
} from '@/lib/agentzy-data';
import { useWorkspace } from '@/components/workspace/WorkspaceProvider';

type LegalDocKey = 'privacy' | 'terms' | 'security' | null;

export function LandingPageClient() {
  const { openScheduleMeetingModal, openSendEmailModal } = useWorkspace();
  const [isPartnershipOpen, setIsPartnershipOpen] = useState(false);
  const [catalogueTab, setCatalogueTab] = useState<'human' | 'ai'>('human');
  const [solutionTab, setSolutionTab] = useState<'human' | 'ai' | 'hybrid'>('hybrid');
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [legalModal, setLegalModal] = useState<LegalDocKey>(null);

  return (
    <div className="min-h-screen bg-[#F5F8FA] text-[#172B3A]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 border-b border-[#D8E3E9] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="whitespace-nowrap shrink-0">
            <AgentzyLogo variant="light" size="md" />
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#526675]">
            <a
              href="#ekosistem"
              className="whitespace-nowrap shrink-0 transition hover:text-[#17324D] hover:underline underline-offset-4"
            >
              Ekosistem
            </a>
            <a
              href="#universe"
              className="whitespace-nowrap shrink-0 transition hover:text-[#17324D] hover:underline underline-offset-4"
            >
              Universe
            </a>
            <a
              href="#kolaborasi-ai"
              className="whitespace-nowrap shrink-0 transition hover:text-[#17324D] hover:underline underline-offset-4"
            >
              Kolaborasi
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

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/workforce"
              className="inline-flex items-center gap-2 rounded-[10px] bg-[#17324D] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#245477] whitespace-nowrap shrink-0"
            >
              <span>Masuk Portal</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* 1. Hero Section */}
        <section className="border-b border-[#D8E3E9] bg-white">
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-stretch gap-10 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-20">
            <div className="flex flex-col justify-center lg:col-span-6">
              <p className="text-xs font-semibold tracking-wide text-[#0284C7]">
                Profil Perusahaan · Tenaga Kerja Terkelola &amp; Staf AI
              </p>
              <h1
                className="mt-3 text-3xl font-bold tracking-tight text-[#17324D] sm:text-4xl lg:text-5xl lg:leading-[1.15]"
                style={{ textWrap: 'balance' }}
              >
                Perusahaan Jasa Tenaga Kerja Sales dan Teknisi yang Didukung oleh Staf AI
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-[#526675] sm:text-lg">
                Agentzy menyediakan dan mengelola tenaga kerja Sales Agentzy, jaringan
                Affiliate Freelance, dan Teknisi Lapangan profesional yang bekerja
                berdampingan dengan staf AI terkelola untuk hasil penjualan, instalasi,
                serta tata kelola komisi yang transparan.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPartnershipOpen(true)}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-[#0284C7] px-6 text-sm font-semibold text-white transition hover:bg-[#0369A1] whitespace-nowrap shrink-0"
                >
                  <span>Ajukan Kerja Sama</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <Link
                  href="/workforce"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] border border-[#B8C9D3] bg-white px-5 text-sm font-semibold text-[#17324D] transition hover:bg-[#E6F4F9] whitespace-nowrap shrink-0"
                >
                  <Smartphone className="h-4 w-4 text-[#0284C7]" />
                  <span>Human Workforce Portal</span>
                </Link>
                <PWAInstallButton variant="subtle" className="h-12 px-4" />
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#EAF2F6] pt-5 text-xs text-[#526675]">
                <span>Satu Platform · Empat Portal Terintegrasi</span>
                <span aria-hidden="true">·</span>
                <span>Fokus Awal Industri ISP &amp; Telekomunikasi</span>
                <span aria-hidden="true">·</span>
                <span>Siap Kerja Online &amp; Offline</span>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative h-full min-h-[300px] overflow-hidden rounded-[14px] border border-[#D8E3E9] bg-[#EAF2F6] lg:min-h-[420px]">
                <Image
                  src="/images/hero_agentzy_workforce.jpg"
                  alt="Kolaborasi tim operasional enterprise menggunakan platform Agentzy"
                  fill
                  priority
                  referrerPolicy="no-referrer"
                  className="object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#17324D]/90 via-[#17324D]/55 to-transparent p-5 text-white">
                  <p className="text-xs font-medium text-[#ADD8E6]">
                    Satu Arsitektur Data · Isolasi Tenant &amp; Tata Kelola Penuh
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    Corporate Partner Portal · Human Workforce Portal · AI Workforce Studio · Super Admin
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. About Agentzy & Four Portals Strip */}
        <section className="border-b border-[#D8E3E9] bg-[#F5F8FA] py-14 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-bold tracking-tight text-[#17324D] sm:text-3xl">
                Tentang Agentzy &amp; Arsitektur Empat Portal
              </h2>
              <p className="mt-3 text-base leading-relaxed text-[#526675]">
                Sebagai perusahaan jasa tenaga kerja sales dan teknisi yang didukung
                staf AI, Agentzy memisahkan layanan SaaS Platform dan Managed Services
                secara transparan dalam satu tenant, KPI, dan jejak audit yang sama.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#17324D]">
                  <Building2 className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-[#172B3A]">
                  Corporate / ISP Portal
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#526675]">
                  Executive overview, analitik penjualan &amp; SLA, kontrak SOW,
                  rekening AI Credits, dan rekonsiliasi invoice terukur.
                </p>
              </div>

              <div className="rounded-[14px] border border-[#87CEEB] bg-white p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#0284C7] text-white">
                  <Smartphone className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-[#172B3A]">
                  Human Workforce Portal
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#526675]">
                  Aplikasi mobile-first untuk Sales Agentzy, Affiliate Freelance, dan
                  Teknisi Lapangan lengkap dengan Workforce Passport &amp; mode offline.
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
                  AI Workforce Management
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#526675]">
                  AI Worker Studio dengan job description, model router, skill/tool
                  permissions, memory coordinator, RAG, dan batas anggaran.
                </p>
              </div>

              <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#17324D]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-[#172B3A]">
                  Agentzy Super Admin
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#526675]">
                  Kendali tata kelola tenant, konfigurasi skema insentif provider,
                  kepatuhan keamanan, audit log, dan kesehatan sistem.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 2B, 2C, 2D. Ecosystem Illustration, Structural Universe & Support + AI Collaboration */}
        <AgentzyEcosystemSections
          onRequestPartnership={() => setIsPartnershipOpen(true)}
        />

        {/* 3. Solutions: Human, AI, Hybrid Workforce */}
        <section id="solusi" className="border-b border-[#D8E3E9] bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-[#17324D] sm:text-3xl">
                  Solusi Operasional Terpadu
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-[#526675] sm:text-base">
                  Pilih model pengoperasian tenaga kerja manusia, AI terkelola,
                  atau alur hibrida Human-AI dengan handoff yang dapat diaudit.
                </p>
              </div>

              <div className="inline-flex rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] p-1 self-start">
                {(
                  [
                    { id: 'human', label: 'Human Workforce' },
                    { id: 'ai', label: 'AI Workforce' },
                    { id: 'hybrid', label: 'Hybrid Workflow' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSolutionTab(t.id)}
                    className={`rounded-[8px] px-3.5 py-2 text-xs font-semibold transition whitespace-nowrap shrink-0 ${
                      solutionTab === t.id
                        ? 'bg-[#17324D] text-white'
                        : 'text-[#526675] hover:text-[#17324D]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
              {solutionTab === 'human' && (
                <>
                  <div className="rounded-[14px] border border-[#D8E3E9] bg-[#F5F8FA] p-6 lg:col-span-7">
                    <div className="flex items-center gap-3">
                      <Users className="h-6 w-6 text-[#0284C7]" />
                      <h3 className="text-xl font-bold text-[#17324D]">
                        Managed Human Workforce
                      </h3>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-[#526675]">
                      Mengelola seluruh siklus hidup Sales Resmi, jaringan Affiliate
                      Freelance, dan Teknisi Lapangan dengan klasifikasi hubungan
                      kerja yang sah dan Workforce Passport digital.
                    </p>
                    <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {[
                        'Workforce Passport & Verifikasi Identitas',
                        'Assignment Engine berbasis Skill & Jarak',
                        'Rekrutmen Affiliate oleh Sales Resmi',
                        'Skema Pembagian Inkremental 60/40',
                        'Absensi Geolokasi & Kepatuhan K3',
                        'Work Order Teknisi dengan Mode Offline Lapangan',
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
                  <div className="flex flex-col justify-between rounded-[14px] border border-[#D8E3E9] bg-[#E6F4F9] p-6 lg:col-span-5">
                    <div>
                      <p className="text-xs font-semibold text-[#245477]">
                        Siap Dicoba Langsung
                      </p>
                      <h4 className="mt-1 text-lg font-bold text-[#17324D]">
                        Jelajahi Human Workforce Portal
                      </h4>
                      <p className="mt-2 text-sm text-[#526675]">
                        Lihat alur lengkap Sales Agentzy (Sales Resmi), rekrutmen
                        affiliate, simulator komisi, dan eksekusi work order
                        teknisi lapangan dengan navigasi Google Maps.
                      </p>
                    </div>
                    <Link
                      href="/workforce"
                      className="mt-6 inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#0284C7] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0369A1]"
                    >
                      <span>Buka Human Workforce Portal</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </>
              )}

              {solutionTab === 'ai' && (
                <>
                  <div className="rounded-[14px] border border-[#D8E3E9] bg-[#F5F8FA] p-6 lg:col-span-7">
                    <div className="flex items-center gap-3">
                      <Bot className="h-6 w-6 text-[#0284C7]" />
                      <h3 className="text-xl font-bold text-[#17324D]">
                        Managed AI Workforce
                      </h3>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-[#526675]">
                      AI bukan sekadar alat chat terpisah. Di Agentzy, setiap AI
                      Worker memiliki kontrak kerja, supervisor manusia, batas
                      tool, kebijakan memori/RAG per tenant, serta kontrol anggaran
                      AI Credits.
                    </p>
                    <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {[
                        'Job Description, KPI, dan Supervisor Manusia',
                        'Model Router & AI Gateway Tunggal',
                        'Skill Registry & Tool Permissions Terbatas',
                        'Memory Coordinator & RAG Berbasis Tenant',
                        'Level Otonomi Bertingkat (L0–L4)',
                        'Metering AI Credits dengan Hard Budget Limit',
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
                  <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-6 lg:col-span-5">
                    <p className="text-xs font-semibold text-[#526675]">
                      Siklus Hidup AI Worker Terkendali
                    </p>
                    <ol className="mt-4 space-y-2.5 text-sm">
                      {[
                        'Draft & Job Contract Definition',
                        'Model, Skill & Tool Binding',
                        'Policy & Security Review',
                        'Supervisor Approval & Active Execution',
                        'Continuous Evaluation & Audit Trail',
                      ].map((stage, i) => (
                        <li
                          key={stage}
                          className="flex items-center gap-3 rounded-[10px] border border-[#EAF2F6] bg-[#F5F8FA] px-3.5 py-2.5 font-medium text-[#17324D]"
                        >
                          <span className="font-mono-tabular text-xs font-bold text-[#0284C7]">
                            0{i + 1}
                          </span>
                          <span>{stage}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </>
              )}

              {solutionTab === 'hybrid' && (
                <div className="rounded-[14px] border border-[#D8E3E9] bg-[#F5F8FA] p-6 lg:col-span-12">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <Layers className="h-6 w-6 text-[#0284C7]" />
                      <h3 className="text-xl font-bold text-[#17324D]">
                        Contoh Alur Hybrid Human–AI di Industri ISP
                      </h3>
                    </div>
                    <span className="text-xs font-medium text-[#526675]">
                      Setiap transisi handoff membawa ringkasan konteks &amp; audit trail
                    </span>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      {
                        step: '01 · AI Marketing & Qualification',
                        actor: 'AI Worker',
                        desc: 'Menyusun materi kampanye, menyaring kelengkapan lead, dan memeriksa kesiapan area cakupan.',
                      },
                      {
                        step: '02 · Corporate Approval & Follow-up',
                        actor: 'Human (Sales Resmi)',
                        desc: 'Corporate menyetujui kampanye; Sales Resmi melakukan pendekatan, penawaran paket, dan closing order.',
                      },
                      {
                        step: '03 · Order Monitor & Field Dispatch',
                        actor: 'AI + Teknisi',
                        desc: 'AI memantau status validasi provider dan SLA; Teknisi melaksanakan instalasi FTTH dengan SOP & bukti.',
                      },
                      {
                        step: '04 · QC & Commission Ledger',
                        actor: 'Supervisor + Engine',
                        desc: 'Supervisor memverifikasi hasil QC; Commission Engine menghitung SA & pembagian 60/40 secara deterministik.',
                      },
                    ].map((node) => (
                      <div
                        key={node.step}
                        className="rounded-[12px] border border-[#D8E3E9] bg-white p-4"
                      >
                        <p className="text-xs font-bold text-[#0284C7]">
                          {node.step}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-[#17324D]">
                          Pelaksana: {node.actor}
                        </p>
                        <p className="mt-2 text-xs leading-relaxed text-[#526675]">
                          {node.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 4. Service Catalogue (Tanpa Harga) */}
        <section id="layanan" className="border-b border-[#D8E3E9] bg-[#F5F8FA] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-[#17324D] sm:text-3xl">
                  Katalog Layanan Terkelola
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-[#526675] sm:text-base">
                  Setiap layanan merinci ruang lingkup, hasil kerja terukur, dan
                  batasan tata kelola sesuai kebutuhan kontrak enterprise.
                </p>
              </div>
              <div className="inline-flex rounded-[10px] border border-[#D8E3E9] bg-white p-1 self-start">
                <button
                  type="button"
                  onClick={() => setCatalogueTab('human')}
                  className={`rounded-[8px] px-4 py-2 text-xs font-semibold transition whitespace-nowrap shrink-0 ${
                    catalogueTab === 'human'
                      ? 'bg-[#0284C7] text-white'
                      : 'text-[#526675] hover:text-[#17324D]'
                  }`}
                >
                  Human Workforce (9 Layanan)
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogueTab('ai')}
                  className={`rounded-[8px] px-4 py-2 text-xs font-semibold transition whitespace-nowrap shrink-0 ${
                    catalogueTab === 'ai'
                      ? 'bg-[#0284C7] text-white'
                      : 'text-[#526675] hover:text-[#17324D]'
                  }`}
                >
                  AI Workforce (10 Layanan)
                </button>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(catalogueTab === 'human'
                ? HUMAN_WORKFORCE_CATALOGUE
                : AI_WORKFORCE_CATALOGUE
              ).map((svc, idx) => (
                <div
                  key={svc.title}
                  className="flex flex-col justify-between rounded-[14px] border border-[#D8E3E9] bg-white p-5 transition hover:border-[#87CEEB]"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#526675]">
                      <span className="font-mono-tabular font-semibold text-[#0284C7]">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span>
                        {catalogueTab === 'human'
                          ? 'Managed Human'
                          : 'Managed AI'}
                      </span>
                    </div>
                    <h3 className="mt-2 text-base font-bold text-[#17324D]">
                      {svc.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#526675]">
                      {svc.scope}
                    </p>
                  </div>
                  <div className="mt-4 space-y-1.5 border-t border-[#EAF2F6] pt-3 text-xs">
                    <p className="text-[#172B3A]">
                      <span className="font-semibold">Output:</span> {svc.output}
                    </p>
                    <p className="text-[#526675]">
                      <span className="font-semibold text-[#17324D]">
                        Tata Kelola:
                      </span>{' '}
                      {svc.governance}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Industries (ISP / Telekomunikasi Focus) */}
        <section id="industri" className="border-b border-[#D8E3E9] bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
              <div className="lg:col-span-6">
                <p className="text-xs font-semibold text-[#0284C7]">
                  Fokus Industri Awal · Multi-Provider &amp; Multi-Tenant
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#17324D] sm:text-3xl">
                  Telekomunikasi &amp; ISP (FTTH, FWA, PXGY)
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[#526675] sm:text-base">
                  Dirancang untuk menjawab kompleksitas operasional ISP mulai dari
                  pengecekan cakupan, akuisisi prospek melalui Sales Resmi &amp;
                  Affiliate, validasi order provider, hingga instalasi teknisi
                  lapangan dan rekonsiliasi komisi berbasis SA.
                </p>

                <div className="mt-6 space-y-4">
                  <div className="rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#17324D]">
                      <Briefcase className="h-4 w-4 text-[#0284C7]" />
                      <span>Alur Penjualan &amp; Aktivasi Tervalidasi</span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#526675]">
                      Lead Created → Assigned → Qualified → Coverage Checked →
                      Order Submitted → Provider Validation → Installation →
                      Activated → Commission Eligible → Settled.
                    </p>
                  </div>

                  <div className="rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#17324D]">
                      <RadioTower className="h-4 w-4 text-[#0284C7]" />
                      <span>Operasional Teknis Lapangan &amp; QC</span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#526675]">
                      Work Order Created → Dispatch → Accepted → On-Site Check-in →
                      SOP Checklist &amp; Speedtest → Evidence &amp; Tanda Tangan →
                      QC Review → Closed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="relative h-[340px] overflow-hidden rounded-[14px] border border-[#D8E3E9] bg-[#EAF2F6] sm:h-[400px]">
                  <Image
                    src="/images/workforce_technician_field.jpg"
                    alt="Teknisi FTTH memeriksa terminal optik di area perumahan"
                    fill
                    referrerPolicy="no-referrer"
                    className="object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#17324D]/90 via-[#17324D]/45 to-transparent p-5 text-white">
                    <p className="text-xs font-medium text-[#ADD8E6]">
                      Field Operations · Mode Offline Siap Lapangan
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      Navigasi Google Maps, SOP Instalasi FTTH, Uji Koneksi, &amp;
                      Bukti Digital Pelanggan
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Partnership Process (9 Stages) */}
        <section id="kemitraan" className="border-b border-[#D8E3E9] bg-[#F5F8FA] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-[#17324D] sm:text-3xl">
                  Proses Kemitraan Enterprise (9 Tahap)
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-[#526675] sm:text-base">
                  Alur onboarding terstruktur dari pengajuan awal hingga
                  penandatanganan SOW dan pengoperasian workforce.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPartnershipOpen(true)}
                className="inline-flex items-center gap-2 rounded-[10px] bg-[#0284C7] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap shrink-0 self-start"
              >
                <GitBranch className="h-4 w-4" />
                <span>Mulai Pengajuan</span>
              </button>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

        {/* 7. FAQ Section */}
        <section id="faq" className="border-b border-[#D8E3E9] bg-white py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-[#17324D] sm:text-3xl">
                Pertanyaan yang Sering Diajukan
              </h2>
              <p className="mt-2 text-sm text-[#526675] sm:text-base">
                Penjelasan lengkap mengenai model Human Workforce, Managed AI,
                skema komisi, serta keamanan data di Agentzy.
              </p>
            </div>

            <div className="mt-8 divide-y divide-[#D8E3E9] rounded-[14px] border border-[#D8E3E9] bg-[#F5F8FA]">
              {LANDING_FAQS.map((faq, idx) => {
                const isOpen = openFaqIdx === idx;
                return (
                  <div key={faq.q} className="bg-white first:rounded-t-[14px] last:rounded-b-[14px]">
                    <button
                      type="button"
                      onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    >
                      <span className="text-sm font-semibold text-[#17324D]">
                        {faq.q}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-[#526675] transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="border-t border-[#EAF2F6] px-5 py-4 text-sm leading-relaxed text-[#526675]">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 8. CTA & Contact Section */}
        <section className="bg-[#17324D] py-14 text-white">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-4 sm:px-6 lg:flex-row lg:items-center lg:px-8">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Siap Mengelola Human &amp; AI Workforce dalam Satu Sistem?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#ADD8E6] sm:text-base">
                Ajukan kemitraan korporasi, jadwalkan sesi discovery melalui
                Google Calendar &amp; Meet, atau langsung uji pengalaman pengguna di
                Human Workforce Portal.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPartnershipOpen(true)}
                className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-[#87CEEB] px-5 text-sm font-bold text-[#17324D] transition hover:bg-[#ADD8E6] whitespace-nowrap shrink-0"
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
                    summary: 'Discovery Call — Agentzy Enterprise Workforce',
                    description:
                      'Diskusi kebutuhan Human Workforce, AI Workforce, dan integrasi sistem ISP/Enterprise.',
                    startIso: start.toISOString(),
                    endIso: end.toISOString(),
                    includeMeet: true,
                  });
                }}
                className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-[#5F879E] bg-[#245477] px-4 text-sm font-semibold text-white transition hover:bg-[#2D6F91] whitespace-nowrap shrink-0"
              >
                <Calendar className="h-4 w-4" />
                <span>Jadwalkan Meet</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  openSendEmailModal({
                    to: 'partnership@agentzy.id',
                    subject: 'Permintaan Informasi Kemitraan Agentzy',
                    body: 'Halo Tim Agentzy,\n\nKami tertarik mendiskusikan implementasi Human Workforce dan AI Workforce untuk operasional perusahaan kami.\n\nTerima kasih.',
                    contextLabel: 'Kirim email resmi ke tim kemitraan Agentzy via Gmail.',
                  })
                }
                className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-[#5F879E] px-4 text-sm font-semibold text-white transition hover:bg-[#245477] whitespace-nowrap shrink-0"
              >
                <Mail className="h-4 w-4" />
                <span>Kirim Email</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Enterprise Footer */}
      <footer className="border-t border-[#D8E3E9] bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div>
            <AgentzyLogo variant="light" size="sm" />
            <p className="mt-2 text-xs text-[#526675]">
              © {new Date().getFullYear()} Agentzy. Platform Terpadu Manajemen Tim Lapangan &amp; Agen AI Enterprise.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-[#526675]">
            <Link href="/workforce" className="hover:text-[#17324D]">
              Portal Human Workforce
            </Link>
            <button
              type="button"
              onClick={() => setLegalModal('privacy')}
              className="hover:text-[#17324D]"
            >
              Kebijakan Privasi
            </button>
            <button
              type="button"
              onClick={() => setLegalModal('terms')}
              className="hover:text-[#17324D]"
            >
              Syarat &amp; Ketentuan
            </button>
            <button
              type="button"
              onClick={() => setLegalModal('security')}
              className="hover:text-[#17324D]"
            >
              Keamanan &amp; Tata Kelola
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
                    ? 'Kebijakan Privasi & Perlindungan Data (UU PDP)'
                    : legalModal === 'terms'
                      ? 'Syarat & Ketentuan Platform Agentzy'
                      : 'Arsitektur Keamanan & Tata Kelola'}
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
                    Agentzy memproses data pribadi pekerja, mitra affiliate, dan
                    pelanggan prospek berdasarkan persetujuan eksplisit, pembatasan
                    tujuan, dan kepatuhan terhadap UU Perlindungan Data Pribadi
                    (UU PDP) Indonesia.
                  </p>
                  <p>
                    Data lokasi absensi dan bukti instalasi hanya diambil saat
                    pengguna melakukan aksi operasional terkait.
                  </p>
                </>
              )}
              {legalModal === 'terms' && (
                <>
                  <p>
                    Klasifikasi hubungan kerja (Sales Resmi, Affiliate Freelance,
                    Teknisi Lapangan) mengikuti perjanjian tertulis resmi dan
                    ketentuan hukum yang berlaku.
                  </p>
                  <p>
                    Perhitungan komisi dan AI Credits mengacu pada versi skema
                    terotorisasi dan sumber fakta event provider yang sah.
                  </p>
                </>
              )}
              {legalModal === 'security' && (
                <>
                  <p>
                    Seluruh tenant dipisahkan dengan Row-Level Security (RLS) dan
                    kontrol akses RBAC/ABAC. Seluruh pemanggilan model AI melalui
                    AI Gateway tunggal dengan audit trail append-only.
                  </p>
                  <p>
                    Token integrasi Google Workspace disimpan sementara di memori
                    sesi dan tidak pernah disimpan di browser storage persisten.
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
