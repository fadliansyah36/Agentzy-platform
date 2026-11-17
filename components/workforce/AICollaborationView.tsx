'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Bot,
  Sparkles,
  Users,
  ShieldCheck,
  Video,
  Palette,
  Image as ImageIcon,
  FileText,
  Send,
  Copy,
  CheckCircle2,
  UserCheck,
  Briefcase,
  Wrench,
  MapPin,
  Clock,
  AlertTriangle,
  MessageSquare,
  Mail,
  ExternalLink,
  Loader2,
  ArrowRight,
  Stethoscope,
  CheckSquare,
} from 'lucide-react';
import type {
  LeadItem,
  WorkOrderItem,
  WorkforceRoleMode,
} from '@/lib/agentzy-data';
import {
  INITIAL_HUMAN_AI_BINDINGS,
  loadHumanAIBindings,
  type HumanAIBindingRecord,
} from '@/lib/human-ai-bindings';
import { useWorkspace } from '@/components/workspace/WorkspaceProvider';

interface AICollaborationViewProps {
  roleMode: WorkforceRoleMode;
  userName: string;
  workOrders: WorkOrderItem[];
  leads: LeadItem[];
  onAddLead: (lead: Omit<LeadItem, 'id' | 'activities' | 'lastUpdate'>) => void;
  onSelectWorkOrder: (wo: WorkOrderItem) => void;
  onNavigate: (tab: string, openLeadModal?: boolean) => void;
  onShowToast: (msg: string) => void;
}

type ContentArtifactKind = 'design' | 'video' | 'image' | 'document';

interface GeneratedContentResult {
  assistantReply?: string;
  title?: string;
  targetAudience?: string;
  summary?: string;
  captionOrCopy?: string;
  hashtags?: string[];
  videoScenes?: Array<{
    timeRange: string;
    visual: string;
    voiceover: string;
    overlayText: string;
  }>;
  designConfig?: {
    headline: string;
    subheadline: string;
    offerBadge: string;
    ctaText: string;
    bullets?: string[];
  };
  imageSpec?: {
    aspectRatio: string;
    visualConcept: string;
    lightingMood: string;
    headlineOverlay: string;
    subOverlay: string;
  };
  documentSections?: Array<{
    heading: string;
    body: string;
  }>;
}

interface AIQualifiedLeadCandidate {
  id: string;
  name: string;
  phone: string;
  email: string;
  product: string;
  address: string;
  score: number;
  sourceAi: string;
  reason: string;
  estCommission: string;
  notes: string;
  roles: Array<'sales' | 'affiliate'>;
}

const AI_LEAD_HANDOFF_POOL: AIQualifiedLeadCandidate[] = [
  {
    id: 'AIH-101',
    name: 'PT Sinar Logistik Nusantara',
    phone: '0811-9420-8811',
    email: 'it.infra@sinarlogistik.co.id',
    product: 'ISP Dedicated Business 200 Mbps',
    address: 'Jl. TB Simatupang Kav. 18, Jakarta Selatan',
    score: 95,
    sourceAi: 'AI Sales Assistant',
    reason: 'Meminta penawaran SLA 99,5% dan membutuhkan 2 IP Public statis minggu ini.',
    estCommission: 'Rp 1.850.000',
    notes: 'Hasil kualifikasi AI Sales Assistant: siap survei teknis & butuh proposal B2B.',
    roles: ['sales'],
  },
  {
    id: 'AIH-102',
    name: 'Klinik Medika Harmoni',
    phone: '0812-8834-1209',
    email: 'admin@klinikharmoni.id',
    product: 'ISP Bisnis Pro 100 Mbps',
    address: 'Jl. Margonda Raya No. 214, Depok',
    score: 91,
    sourceAi: 'Lead Qualification',
    reason: 'Klinik rawat jalan butuh koneksi cadangan stabil untuk sistem rekam medis.',
    estCommission: 'Rp 950.000',
    notes: 'Prospek tervalidasi ODP terjangkau 85m oleh AI Lead Qualification.',
    roles: ['sales'],
  },
  {
    id: 'AIH-103',
    name: 'Ibu Ratna Dewi (Komunitas Cluster Melati)',
    phone: '0856-7712-9033',
    email: 'ratna.dewi@gmail.com',
    product: 'Fiber Home 50 Mbps + WiFi 6',
    address: 'Perumahan Melati Residence Blok C4, Bekasi Barat',
    score: 92,
    sourceAi: 'Affiliate Onboarding Coach',
    reason: 'Menanyakan promo bebas biaya instalasi dari kampanye media sosial warga.',
    estCommission: 'Rp 240.000 (60%)',
    notes: 'Prospek dari materi promosi Affiliate · siap di-follow-up WhatsApp hari ini.',
    roles: ['affiliate', 'sales'],
  },
  {
    id: 'AIH-104',
    name: 'Bapak Dimas Anggara',
    phone: '0813-4421-6570',
    email: 'dimas.anggara@yahoo.com',
    product: 'Fiber Home 100 Mbps Gaming',
    address: 'Komplek Griya Asri No. 19, Tangerang Selatan',
    score: 88,
    sourceAi: 'AI Sales Assistant',
    reason: 'Membutuhkan upload simetris untuk WFH & streaming keluarga.',
    estCommission: 'Rp 300.000 (60%)',
    notes: 'Telah dikonfirmasi cakupan FTTH tersedia oleh AI Onboarding Coach.',
    roles: ['affiliate', 'sales'],
  },
];

export function AICollaborationView({
  roleMode,
  userName,
  workOrders,
  leads,
  onAddLead,
  onSelectWorkOrder,
  onNavigate,
  onShowToast,
}: AICollaborationViewProps) {
  const { openSendEmailModal } = useWorkspace();

  const [bindings, setBindings] = useState<HumanAIBindingRecord[]>(
    INITIAL_HUMAN_AI_BINDINGS
  );

  useEffect(() => {
    const syncBindings = () => {
      setBindings(loadHumanAIBindings());
    };
    const raf = window.requestAnimationFrame(syncBindings);
    window.addEventListener('storage', syncBindings);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('storage', syncBindings);
    };
  }, []);

  const activeBinding = useMemo(() => {
    const byNameAndRole = bindings.find(
      (b) =>
        b.humanRole === roleMode &&
        b.humanName.toLowerCase() === userName.trim().toLowerCase()
    );
    if (byNameAndRole) return byNameAndRole;
    const byRole = bindings.find((b) => b.humanRole === roleMode);
    return byRole ?? INITIAL_HUMAN_AI_BINDINGS[0];
  }, [bindings, roleMode, userName]);

  // Sub-tabs tailored per role
  const [salesTab, setSalesTab] = useState<'content' | 'leads' | 'chat'>('content');
  const [techTab, setTechTab] = useState<'ops' | 'diag' | 'chat'>('ops');

  // Sales & Affiliate Content Studio Co-Pilot State
  const [contentKind, setContentKind] = useState<ContentArtifactKind>('design');
  const [contentChannel, setContentChannel] = useState(
    roleMode === 'affiliate'
      ? 'WhatsApp Status · Instagram Story · Grup Warga'
      : 'LinkedIn · WhatsApp Business · Instagram Reels'
  );
  const [contentPrompt, setContentPrompt] = useState(
    roleMode === 'affiliate'
      ? 'Buat materi promosi paket Fiber Home 50 Mbps bebas biaya instalasi untuk penghuni perumahan baru.'
      : 'Buat materi kampanye & penawaran paket Bisnis 100 Mbps SLA 99,5% untuk pemilik kantor dan UMKM.'
  );
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContentResult | null>(
    () => ({
      assistantReply:
        roleMode === 'affiliate'
          ? 'Draft promosi siap dibagikan ke status WhatsApp dan grup komunitas perumahan Anda.'
          : 'Materi penawaran paket bisnis siap digunakan untuk prospek B2B dan follow-up hari ini.',
      title:
        roleMode === 'affiliate'
          ? 'Promo Fiber Home 50 Mbps · Gratis Biaya Pasang'
          : 'Solusi Internet Kantor 100 Mbps Stabil & Terjamin SLA',
      targetAudience:
        roleMode === 'affiliate'
          ? 'Keluarga Muda & Penghuni Cluster Perumahan'
          : 'Kantor UMKM, Klinik, & Ruko Komersial',
      summary:
        'Menonjolkan kecepatan simetris, dukungan teknisi lokal bersertifikat, serta kemudahan aktivasi cepat.',
      captionOrCopy:
        roleMode === 'affiliate'
          ? 'Internet rumah sering buffering saat WFH & belajar online? Saatnya pindah ke Fiber Home 50 Mbps! Gratis biaya pasang bulan ini, router WiFi 6 siap pakai, dan dibantu teknisi lokal hingga aktif. Balas pesan ini untuk cek ketersediaan di blok rumah Anda.'
          : 'Tingkatkan produktivitas tim Anda dengan koneksi Fiber Bisnis 100 Mbps ber-SLA 99,5%. Dilengkapi dukungan prioritas 24/7 dan survei lokasi gratis. Balas pesan ini untuk mendapatkan simulasi biaya dan jadwal survei minggu ini.',
      hashtags: ['#InternetCepat', '#FiberHome', '#AgentzyISP', '#BisnisLancar'],
      designConfig: {
        headline:
          roleMode === 'affiliate'
            ? 'WIFI RUMAH ANTI LEMOT 50 MBPS'
            : 'INTERNET BISNIS SLA 99,5%',
        subheadline:
          roleMode === 'affiliate'
            ? 'Gratis Instalasi + Router WiFi 6 Khusus Bulan Ini'
            : 'Koneksi Simetris & Prioritas Penanganan Teknis',
        offerBadge: roleMode === 'affiliate' ? 'GRATIS PASANG' : 'SURVEI GRATIS',
        ctaText: 'Cek Area Sekarang',
        bullets: [
          'Jaringan Fiber Optik penuh tanpa kuota FUP',
          'Pemasangan cepat oleh Teknisi bersertifikat',
          'Layanan dukungan operasional responsif',
        ],
      },
    })
  );

  // Claimed leads tracker
  const [claimedLeadIds, setClaimedLeadIds] = useState<string[]>([]);

  // Technician Diagnostic Co-Pilot State
  const [diagQuery, setDiagQuery] = useState(
    'Redaman optik RX pada ONT pelanggan terbaca -27.8 dBm saat instalasi FTTH baru.'
  );
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagError, setDiagError] = useState<string | null>(null);
  const [diagResult, setDiagResult] = useState<GeneratedContentResult | null>({
    assistantReply:
      'Redaman -27.8 dBm melewati ambang standar operasional (-15 s.d -25 dBm). Lakukan pemeriksaan konektor dan sambungan sebelum aktivasi.',
    title: 'Prosedur Penanganan Redaman Tinggi (-27.8 dBm)',
    summary:
      'Audit kebersihan konektor SC/APC di ODP & roset, cek micro-bending patchcord, dan verifikasi daya splitter ODP.',
    captionOrCopy:
      'Target RX layak aktivasi adalah -17 dBm hingga -24 dBm agar koneksi tidak putus-putus saat hujan.',
    documentSections: [
      {
        heading: '1. Inspeksi Visual & Pembersihan Konektor',
        body: 'Bersihkan ujung konektor SC/APC pada ODP dan roset rumah menggunakan optical cleaner pen. Pastikan tidak ada debu atau goresan.',
      },
      {
        heading: '2. Pengukuran OPM Bertahap',
        body: 'Ukur output langsung di port splitter ODP (ideal -14 s.d -18 dBm). Jika di ODP sudah rendah, segera laporkan ke NOC untuk pindah port atau cek kabel distribusi.',
      },
      {
        heading: '3. Uji Bending & Re-Splicing Dropcore',
        body: 'Periksa tekukan tajam pada klip tiang maupun belokan masuk rumah. Jika selisih > 3 dB, lakukan re-splicing atau ganti konektor fast-connector.',
      },
    ],
  });
  const [ftfChecks, setFtfChecks] = useState<Record<string, boolean>>({
    opm: true,
    wifi: false,
    ba: false,
  });

  // Collaboration Chat State
  const [chatMessages, setChatMessages] = useState<
    Array<{ id: string; sender: 'ai' | 'human'; name: string; time: string; text: string }>
  >(() =>
    roleMode === 'technician'
      ? [
          {
            id: 'MSG-1',
            sender: 'ai',
            name: 'Technical Troubleshooting AI',
            time: '08:15',
            text: `Halo ${userName}, hari ini ada ${workOrders.filter((w) => w.status !== 'Selesai').length} Work Order aktif. Prioritas terdekat berada dalam radius 2,4 km dengan sisa SLA 2 jam. Perlu panduan teknis atau cek kelengkapan material?`,
          },
          {
            id: 'MSG-2',
            sender: 'human',
            name: userName,
            time: '08:18',
            text: 'Siap, saya menuju lokasi WO prioritas pertama. Tolong pantau batas SLA instalasi sore nanti.',
          },
        ]
      : [
          {
            id: 'MSG-1',
            sender: 'ai',
            name:
              roleMode === 'affiliate'
                ? 'Affiliate Onboarding Coach'
                : 'AI Sales Assistant',
            time: '09:00',
            text:
              roleMode === 'affiliate'
                ? `Halo ${userName}! Saya sudah menyiapkan 2 prospek komunitas baru dan draf konten promosi status WhatsApp untuk membantu target komisi 60% Anda hari ini.`
                : `Halo ${userName}! Saya sudah menyaring 2 prospek B2B skor tinggi dan menyiapkan materi penawaran kampanye hari ini. Mau mulai dari konten promosi atau follow-up prospek?`,
          },
          {
            id: 'MSG-2',
            sender: 'human',
            name: userName,
            time: '09:04',
            text: 'Mantap, bantu siapkan poin keunggulan paket saat calon pelanggan menanyakan perbandingan harga kompetitor.',
          },
        ]
  );
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

  const handleGenerateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentPrompt.trim()) return;
    setIsGeneratingContent(true);
    setContentError(null);
    try {
      const res = await fetch('/api/ai-workforce/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: contentPrompt,
          kind: contentKind,
          channel: contentChannel,
          tenantName: 'ISP Nusantara · Agentzy Partner',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Gagal menghasilkan konten AI.');
      }
      setGeneratedContent(data.result);
      onShowToast('Materi promosi AI berhasil dibuat untuk kebutuhan Anda.');
    } catch (err) {
      setContentError(
        err instanceof Error ? err.message : 'Terjadi kendala saat menghubungi AI.'
      );
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleDiagnoseTechnical = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagQuery.trim()) return;
    setIsDiagnosing(true);
    setDiagError(null);
    try {
      const res = await fetch('/api/ai-workforce/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Sebagai AI Technical Troubleshooting untuk Teknisi Lapangan ISP FTTH/FWA, berikan langkah diagnosis teknis dan SOP perbaikan ringkas untuk kasus berikut: ${diagQuery}`,
          kind: 'document',
          channel: 'SOP Teknis Lapangan FTTH',
          tenantName: 'Operasional Teknisi Agentzy',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Gagal memproses diagnosis teknis.');
      }
      setDiagResult(data.result);
      onShowToast('Panduan diagnosis teknis AI diperbarui.');
    } catch (err) {
      setDiagError(
        err instanceof Error ? err.message : 'Kendala koneksi ke layanan AI.'
      );
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed || isSendingChat) return;

    const nowLabel = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const humanMsg = {
      id: `MSG-${Date.now()}`,
      sender: 'human' as const,
      name: userName,
      time: nowLabel,
      text: trimmed,
    };
    setChatMessages((prev) => [...prev, humanMsg]);
    setChatInput('');
    setIsSendingChat(true);

    try {
      const roleContext =
        roleMode === 'technician'
          ? 'Teknisi Lapangan FTTH yang membutuhkan dukungan operasional, urutan WO, dan troubleshooting teknis'
          : roleMode === 'affiliate'
            ? 'Mitra Affiliate Freelance yang membutuhkan materi digital marketing, caption sosmed, dan pencarian prospek'
            : 'Staff Sales Resmi yang membutuhkan strategi digital marketing, skrip closing, dan kualifikasi leads';

      const res = await fetch('/api/ai-workforce/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Peran mitra manusia: ${roleContext}. Jawab pertanyaan kolaborasi ini secara singkat, jelas, dan langsung dapat dipraktikkan: "${trimmed}"`,
          kind: 'document',
          channel: 'Chat Kolaborasi Human + AI',
          tenantName: 'Agentzy Unified Workforce',
        }),
      });
      const data = await res.json();
      const replyText =
        res.ok && data?.result
          ? [data.result.assistantReply, data.result.captionOrCopy]
              .filter(Boolean)
              .join(' ')
          : 'Saya telah mencatat permintaan Anda dan menyiapkan rekomendasi tindakan sesuai ruang lingkup kolaborasi.';

      setChatMessages((prev) => [
        ...prev,
        {
          id: `MSG-${Date.now() + 1}`,
          sender: 'ai',
          name: activeBinding.aiWorkerName,
          time: new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          text: replyText,
        },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `MSG-${Date.now() + 1}`,
          sender: 'ai',
          name: activeBinding.aiWorkerName,
          time: new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          text: 'Koneksi sedang sibuk, namun panduan standar kolaborasi tetap tersedia di tab utama.',
        },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleClaimLead = (candidate: AIQualifiedLeadCandidate) => {
    const alreadyExists =
      claimedLeadIds.includes(candidate.id) ||
      leads.some((l) => l.name.toLowerCase() === candidate.name.toLowerCase());
    if (alreadyExists) {
      onShowToast(`Prospek ${candidate.name} sudah berada di daftar Lead Anda.`);
      return;
    }

    onAddLead({
      name: candidate.name,
      phone: candidate.phone,
      email: candidate.email,
      product: candidate.product,
      address: candidate.address,
      status: 'Follow Up',
      lifecycleKey: '2_lead_followup',
      notes: candidate.notes,
      attributionType: roleMode === 'affiliate' ? 'affiliate' : 'sales_personal',
    });
    setClaimedLeadIds((prev) => [...prev, candidate.id]);
  };

  const visibleLeadPool = useMemo(() => {
    const targetRole = roleMode === 'affiliate' ? 'affiliate' : 'sales';
    return AI_LEAD_HANDOFF_POOL.filter((item) => item.roles.includes(targetRole));
  }, [roleMode]);

  const prioritizedWorkOrders = useMemo(
    () =>
      [...workOrders].sort((a, b) => {
        if (a.status === 'Selesai' && b.status !== 'Selesai') return 1;
        if (a.status !== 'Selesai' && b.status === 'Selesai') return -1;
        if (a.priority === 'Prioritas Tinggi' && b.priority !== 'Prioritas Tinggi')
          return -1;
        return a.etaMinutes - b.etaMinutes;
      }),
    [workOrders]
  );

  return (
    <div className="space-y-5">
      {/* Page Title & Governance Context */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#ADD8E6] bg-[#E6F4F9] px-2.5 py-0.5 text-[11px] font-bold text-[#0284C7]">
            <Bot className="h-3.5 w-3.5" />
            <span>Integrasi &amp; Kolaborasi Human + AI Workforce</span>
          </div>
          <h1 className="mt-1.5 text-xl font-bold tracking-tight text-[#17324D]">
            {roleMode === 'technician'
              ? 'Kolaborasi Teknisi & AI Operasional'
              : roleMode === 'affiliate'
                ? 'Kolaborasi Affiliate & AI Promosi'
                : 'Kolaborasi Staff Sales & AI Marketing'}
          </h1>
          <p className="text-xs text-[#526675]">
            {roleMode === 'technician'
              ? 'Dukungan AI fokus pada pengaturan rute Work Order, ketepatan SLA, dan panduan diagnosis teknis lapangan.'
              : 'Dukungan AI fokus membantu Digital Marketing, pembuatan konten promosi, media sosial, dan pencarian prospek.'}
          </p>
        </div>

        <Link
          href="/ai-workforce/human-ai-binding"
          className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[10px] border border-[#D8E3E9] bg-white px-3 py-2 text-xs font-bold text-[#17324D] hover:border-[#0284C7] hover:bg-[#E6F4F9]"
        >
          <ShieldCheck className="h-4 w-4 text-[#0284C7]" />
          <span>Pengaturan Binding (HRD/Admin/Direksi)</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Official Binding Card (Set by HRD / Admin / Direksi Agentzy) */}
      <section className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5 rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] px-3.5 py-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#17324D] text-xs font-bold text-white">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#526675]">
                  Staff Human
                </p>
                <p className="text-xs font-bold text-[#17324D]">{userName}</p>
                <p className="text-[11px] text-[#526675]">
                  {roleMode === 'technician'
                    ? 'Teknisi Lapangan'
                    : roleMode === 'affiliate'
                      ? 'Affiliate Freelance'
                      : 'Staff Sales Resmi'}
                </p>
              </div>
            </div>

            <ArrowRight className="hidden h-4 w-4 text-[#0284C7] sm:block" />

            <div className="flex items-center gap-2.5 rounded-[12px] border border-[#ADD8E6] bg-[#E6F4F9] px-3.5 py-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0284C7] text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#0284C7]">
                  Partner AI Terikat ({activeBinding.autonomyLevel})
                </p>
                <p className="text-xs font-bold text-[#17324D]">
                  {activeBinding.aiWorkerName}
                </p>
                {activeBinding.secondaryAiWorkerName && (
                  <p className="text-[11px] text-[#245477]">
                    Pendamping: {activeBinding.secondaryAiWorkerName}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-1 rounded-[12px] border border-[#EAF2F6] bg-[#F5F8FA] px-3.5 py-2.5 lg:items-end">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#EBF7F1] px-2.5 py-0.5 text-[11px] font-bold text-[#247A55]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Ikatan Aktif · {activeBinding.id}
            </span>
            <p className="text-[11px] font-semibold text-[#17324D]">
              Target Bersama: {activeBinding.sharedKpiTarget}
            </p>
            <p className="text-[11px] text-[#526675]">
              Ditetapkan oleh{' '}
              <span className="font-bold text-[#17324D]">
                {activeBinding.managedByRole}
              </span>{' '}
              ({activeBinding.managedByPerson})
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[#EAF2F6] pt-3">
          {activeBinding.collaborationScope.map((scope, idx) => (
            <span
              key={idx}
              className="rounded-[8px] border border-[#D8E3E9] bg-[#F5F8FA] px-2.5 py-1 text-[11px] text-[#172B3A]"
            >
              • {scope}
            </span>
          ))}
        </div>
      </section>

      {/* ROLE WORKSPACE: SALES & AFFILIATE (Digital Marketing, Content & Leads) */}
      {roleMode !== 'technician' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSalesTab('content')}
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[10px] border px-3.5 py-2 text-xs font-bold transition ${
                salesTab === 'content'
                  ? 'border-[#0284C7] bg-[#0284C7] text-white'
                  : 'border-[#D8E3E9] bg-white text-[#526675] hover:text-[#17324D]'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>Generate Konten &amp; Promosi AI</span>
            </button>
            <button
              type="button"
              onClick={() => setSalesTab('leads')}
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[10px] border px-3.5 py-2 text-xs font-bold transition ${
                salesTab === 'leads'
                  ? 'border-[#0284C7] bg-[#0284C7] text-white'
                  : 'border-[#D8E3E9] bg-white text-[#526675] hover:text-[#17324D]'
              }`}
            >
              <Briefcase className="h-4 w-4" />
              <span>Leads &amp; Handoff AI ({visibleLeadPool.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setSalesTab('chat')}
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[10px] border px-3.5 py-2 text-xs font-bold transition ${
                salesTab === 'chat'
                  ? 'border-[#0284C7] bg-[#0284C7] text-white'
                  : 'border-[#D8E3E9] bg-white text-[#526675] hover:text-[#17324D]'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Chat Partner AI</span>
            </button>
          </div>

          {salesTab === 'content' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Prompt Form */}
              <form
                onSubmit={handleGenerateContent}
                className="lg:col-span-5 rounded-[14px] border border-[#D8E3E9] bg-white p-4 sm:p-5 space-y-3.5"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-[#17324D]">
                    Brief Konten Promosi
                  </h2>
                  <Link
                    href="/ai-workforce/content-studio"
                    className="text-[11px] font-bold text-[#0284C7] hover:underline"
                  >
                    Buka Full Studio →
                  </Link>
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#526675]">
                    Jenis Materi
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: 'design', label: 'Desain Flyer', icon: Palette },
                        { id: 'video', label: 'Skrip Video Reels', icon: Video },
                        { id: 'image', label: 'Konsep Gambar Iklan', icon: ImageIcon },
                        { id: 'document', label: 'Dokumen Penawaran', icon: FileText },
                      ] as const
                    ).map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setContentKind(item.id)}
                          className={`flex items-center gap-2 rounded-[10px] border px-2.5 py-2 text-left text-xs font-semibold transition ${
                            contentKind === item.id
                              ? 'border-[#0284C7] bg-[#E6F4F9] text-[#0284C7]'
                              : 'border-[#D8E3E9] bg-[#F5F8FA] text-[#172B3A]'
                          }`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#526675]">
                    Kanal Target
                  </label>
                  <input
                    type="text"
                    value={contentChannel}
                    onChange={(e) => setContentChannel(e.target.value)}
                    className="h-9 w-full rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] px-3 text-xs text-[#172B3A] outline-none focus:border-[#0284C7] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#526675]">
                    Brief / Ide Kampanye
                  </label>
                  <textarea
                    rows={4}
                    value={contentPrompt}
                    onChange={(e) => setContentPrompt(e.target.value)}
                    placeholder="Contoh: Promo Fiber 100 Mbps bebas instalasi untuk penghuni klaster..."
                    className="w-full rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] p-3 text-xs text-[#172B3A] outline-none focus:border-[#0284C7] focus:bg-white"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Promo Gratis Pasang Perumahan',
                    'Penawaran Internet Bisnis 100 Mbps',
                    'Skrip Follow-up Prospek Ragu Harga',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setContentPrompt(preset)}
                      className="rounded-full border border-[#D8E3E9] bg-[#F5F8FA] px-2.5 py-1 text-[11px] font-medium text-[#245477] hover:border-[#0284C7]"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {contentError && (
                  <p className="rounded-[10px] bg-red-50 px-3 py-2 text-xs text-[#B23A48]">
                    {contentError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isGeneratingContent}
                  className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#0284C7] py-2.5 text-xs font-bold text-white hover:bg-[#0369A1] disabled:opacity-60"
                >
                  {isGeneratingContent ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  <span>
                    {isGeneratingContent
                      ? 'Menyusun Materi Promosi...'
                      : 'Generate Materi dengan AI Partner'}
                  </span>
                </button>
              </form>

              {/* Artifact Output Preview */}
              <div className="lg:col-span-7 rounded-[14px] border border-[#D8E3E9] bg-white p-4 sm:p-5 space-y-4">
                {generatedContent ? (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#EAF2F6] pb-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#0284C7]">
                          Hasil Artifact ({contentKind.toUpperCase()})
                        </span>
                        <h3 className="text-base font-bold text-[#17324D]">
                          {generatedContent.title || 'Materi Promosi Siap Pakai'}
                        </h3>
                        {generatedContent.targetAudience && (
                          <p className="text-[11px] text-[#526675]">
                            Target: {generatedContent.targetAudience}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const fullText = [
                              generatedContent.title,
                              generatedContent.captionOrCopy,
                              generatedContent.hashtags?.join(' '),
                            ]
                              .filter(Boolean)
                              .join('\n\n');
                            navigator.clipboard?.writeText(fullText);
                            onShowToast('Caption & materi promosi berhasil disalin.');
                          }}
                          className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[8px] border border-[#D8E3E9] bg-[#F5F8FA] px-3 py-1.5 text-xs font-bold text-[#17324D] hover:bg-[#E6F4F9]"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          <span>Salin Caption</span>
                        </button>
                        {roleMode === 'sales' && (
                          <button
                            type="button"
                            onClick={() =>
                              openSendEmailModal({
                                to: '',
                                subject:
                                  generatedContent.title ||
                                  'Penawaran Layanan Fiber Agentzy',
                                body:
                                  generatedContent.captionOrCopy ||
                                  'Berikut materi penawaran layanan internet fiber untuk bisnis Anda.',
                                contextLabel: 'Kirim Penawaran Kolaborasi AI',
                              })
                            }
                            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[8px] bg-[#17324D] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#245477]"
                          >
                            <Mail className="h-3.5 w-3.5" />
                            <span>Kirim via Gmail</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {generatedContent.designConfig && (
                      <div className="rounded-[12px] border border-[#ADD8E6] bg-gradient-to-br from-[#17324D] to-[#245477] p-4 text-white">
                        <span className="inline-block rounded-full bg-[#0284C7] px-2.5 py-0.5 text-[10px] font-bold">
                          {generatedContent.designConfig.offerBadge}
                        </span>
                        <h4 className="mt-2 text-lg font-bold">
                          {generatedContent.designConfig.headline}
                        </h4>
                        <p className="text-xs text-[#CFE3EE]">
                          {generatedContent.designConfig.subheadline}
                        </p>
                        {generatedContent.designConfig.bullets && (
                          <ul className="mt-3 space-y-1 text-xs text-[#E6F4F9]">
                            {generatedContent.designConfig.bullets.map((b, i) => (
                              <li key={i}>✓ {b}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {generatedContent.videoScenes &&
                      generatedContent.videoScenes.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-[#17324D]">
                            Storyboard Video Reels / TikTok:
                          </p>
                          {generatedContent.videoScenes.map((scene, idx) => (
                            <div
                              key={idx}
                              className="rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] p-3 text-xs"
                            >
                              <div className="flex items-center justify-between font-bold text-[#0284C7]">
                                <span>Adegan {idx + 1}</span>
                                <span className="font-mono-tabular">
                                  {scene.timeRange}
                                </span>
                              </div>
                              <p className="mt-1 text-[#172B3A]">
                                <strong>Visual:</strong> {scene.visual}
                              </p>
                              <p className="mt-0.5 text-[#526675]">
                                <strong>Voiceover:</strong> &ldquo;{scene.voiceover}&rdquo;
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                    {generatedContent.imageSpec && (
                      <div className="rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] p-3 text-xs space-y-1">
                        <p className="font-bold text-[#17324D]">
                          Panduan Visual Iklan ({generatedContent.imageSpec.aspectRatio})
                        </p>
                        <p className="text-[#172B3A]">
                          {generatedContent.imageSpec.visualConcept}
                        </p>
                        <p className="text-[#0284C7] font-semibold">
                          Teks Banner: {generatedContent.imageSpec.headlineOverlay}
                        </p>
                      </div>
                    )}

                    {generatedContent.documentSections &&
                      generatedContent.documentSections.length > 0 && (
                        <div className="space-y-2">
                          {generatedContent.documentSections.map((sec, idx) => (
                            <div
                              key={idx}
                              className="rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] p-3 text-xs"
                            >
                              <p className="font-bold text-[#17324D]">{sec.heading}</p>
                              <p className="mt-1 text-[#526675]">{sec.body}</p>
                            </div>
                          ))}
                        </div>
                      )}

                    {generatedContent.captionOrCopy && (
                      <div className="rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-3.5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#526675]">
                          Caption / Naskah Penawaran Siap Posting
                        </p>
                        <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-[#172B3A]">
                          {generatedContent.captionOrCopy}
                        </p>
                        {generatedContent.hashtags &&
                          generatedContent.hashtags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {generatedContent.hashtags.map((tag, i) => (
                                <span
                                  key={i}
                                  className="rounded-full bg-[#E6F4F9] px-2 py-0.5 text-[11px] font-semibold text-[#0284C7]"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            </div>
          )}

          {salesTab === 'leads' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] border border-[#ADD8E6] bg-[#E6F4F9] p-3.5">
                <div className="flex items-center gap-2.5">
                  <Bot className="h-5 w-5 text-[#0284C7]" />
                  <div>
                    <p className="text-xs font-bold text-[#17324D]">
                      Daftar Prospek Terkualifikasi oleh AI Partner
                    </p>
                    <p className="text-[11px] text-[#526675]">
                      Klik &ldquo;Ambil &amp; Follow-Up&rdquo; untuk memasukkan prospek ke pipeline Lead Anda.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('leads')}
                  className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[8px] bg-white px-3 py-1.5 text-xs font-bold text-[#17324D] border border-[#D8E3E9] hover:border-[#0284C7]"
                >
                  <span>Buka Semua Lead ({leads.length})</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {visibleLeadPool.map((cand) => {
                  const isClaimed =
                    claimedLeadIds.includes(cand.id) ||
                    leads.some(
                      (l) => l.name.toLowerCase() === cand.name.toLowerCase()
                    );
                  return (
                    <div
                      key={cand.id}
                      className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#EBF7F1] px-2 py-0.5 font-mono-tabular text-[10px] font-bold text-[#247A55]">
                            Skor AI: {cand.score}/100 · {cand.sourceAi}
                          </span>
                          <h3 className="mt-1.5 text-sm font-bold text-[#17324D]">
                            {cand.name}
                          </h3>
                          <p className="text-xs font-semibold text-[#0284C7]">
                            {cand.product}
                          </p>
                        </div>
                        <span className="rounded-[8px] border border-[#D8E3E9] bg-[#F5F8FA] px-2.5 py-1 font-mono-tabular text-[11px] font-bold text-[#17324D]">
                          Est. {cand.estCommission}
                        </span>
                      </div>

                      <p className="text-xs text-[#526675]">{cand.reason}</p>
                      <p className="text-[11px] text-[#526675]">
                        📍 {cand.address} · 📞 {cand.phone}
                      </p>

                      <div className="flex items-center justify-between gap-2 border-t border-[#EAF2F6] pt-2.5">
                        <button
                          type="button"
                          onClick={() => handleClaimLead(cand)}
                          disabled={isClaimed}
                          className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-[9px] px-3 py-2 text-xs font-bold transition ${
                            isClaimed
                              ? 'bg-[#EBF7F1] text-[#247A55] border border-[#247A55]/25'
                              : 'bg-[#0284C7] text-white hover:bg-[#0369A1]'
                          }`}
                        >
                          {isClaimed ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Sudah Masuk Pipeline Lead</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-3.5 w-3.5" />
                              <span>Ambil &amp; Follow-Up Lead</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {salesTab === 'chat' && (
            <CollaborationChatPanel
              messages={chatMessages}
              input={chatInput}
              onInputChange={setChatInput}
              onSubmit={handleSendChat}
              isSending={isSendingChat}
              aiPartnerName={activeBinding.aiWorkerName}
              placeholder={
                roleMode === 'affiliate'
                  ? 'Tanya ide konten WhatsApp, jawaban promo, atau cek area perumahan...'
                  : 'Tanya skrip handling keberatan harga, strategi closing B2B, atau ide kampanye...'
              }
            />
          )}
        </div>
      ) : (
        /* ROLE WORKSPACE: TECHNICIAN (Operasional & Teknis) */
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTechTab('ops')}
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[10px] border px-3.5 py-2 text-xs font-bold transition ${
                techTab === 'ops'
                  ? 'border-[#0284C7] bg-[#0284C7] text-white'
                  : 'border-[#D8E3E9] bg-white text-[#526675] hover:text-[#17324D]'
              }`}
            >
              <Wrench className="h-4 w-4" />
              <span>Koordinasi Work Order AI</span>
            </button>
            <button
              type="button"
              onClick={() => setTechTab('diag')}
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[10px] border px-3.5 py-2 text-xs font-bold transition ${
                techTab === 'diag'
                  ? 'border-[#0284C7] bg-[#0284C7] text-white'
                  : 'border-[#D8E3E9] bg-white text-[#526675] hover:text-[#17324D]'
              }`}
            >
              <Stethoscope className="h-4 w-4" />
              <span>Diagnosis Teknis &amp; SOP</span>
            </button>
            <button
              type="button"
              onClick={() => setTechTab('chat')}
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[10px] border px-3.5 py-2 text-xs font-bold transition ${
                techTab === 'chat'
                  ? 'border-[#0284C7] bg-[#0284C7] text-white'
                  : 'border-[#D8E3E9] bg-white text-[#526675] hover:text-[#17324D]'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Chat Kolaborasi Teknis</span>
            </button>
          </div>

          {techTab === 'ops' && (
            <div className="space-y-3">
              <div className="rounded-[12px] border border-[#ADD8E6] bg-[#E6F4F9] p-3.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Bot className="h-5 w-5 text-[#0284C7]" />
                  <div>
                    <p className="text-xs font-bold text-[#17324D]">
                      Rekomendasi Urutan Eksekusi (Work Order Coordinator AI)
                    </p>
                    <p className="text-[11px] text-[#526675]">
                      Diurutkan otomatis berdasarkan sisa SLA terketat dan estimasi waktu tempuh tercepat.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {prioritizedWorkOrders.map((wo, idx) => (
                  <div
                    key={wo.id}
                    className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="rounded-full bg-[#17324D] px-2 py-0.5 font-mono-tabular text-[10px] font-bold text-white">
                            #{idx + 1} · {wo.id}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              wo.status === 'Selesai'
                                ? 'bg-[#EBF7F1] text-[#247A55]'
                                : wo.priority === 'Prioritas Tinggi'
                                  ? 'bg-[#FEF3C7] text-[#A96816]'
                                  : 'bg-[#E6F4F9] text-[#0284C7]'
                            }`}
                          >
                            {wo.status === 'Selesai' ? 'Selesai' : wo.priority}
                          </span>
                        </div>
                        <h3 className="mt-1.5 text-sm font-bold text-[#17324D]">
                          {wo.customerName}
                        </h3>
                        <p className="text-xs font-semibold text-[#0284C7]">
                          {wo.type} · {wo.productPackage}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-[#526675]">📍 {wo.address}</p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-[#17324D]">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-[#0284C7]" />
                        {wo.distanceKm} ({wo.etaMinutes} mnt)
                      </span>
                      <span className="inline-flex items-center gap-1 text-[#A96816]">
                        <Clock className="h-3.5 w-3.5" />
                        SLA: {wo.slaRemaining}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectWorkOrder(wo)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-[9px] bg-[#0284C7] py-2 text-xs font-bold text-white hover:bg-[#0369A1]"
                    >
                      <Wrench className="h-3.5 w-3.5" />
                      <span>Buka &amp; Eksekusi Work Order</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {techTab === 'diag' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <form
                onSubmit={handleDiagnoseTechnical}
                className="lg:col-span-5 rounded-[14px] border border-[#D8E3E9] bg-white p-4 sm:p-5 space-y-3.5"
              >
                <h2 className="text-sm font-bold text-[#17324D]">
                  Konsultasi Kendala Teknis Lapangan
                </h2>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#526675]">
                    Gejala / Masalah di Lokasi
                  </label>
                  <textarea
                    rows={4}
                    value={diagQuery}
                    onChange={(e) => setDiagQuery(e.target.value)}
                    className="w-full rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] p-3 text-xs text-[#172B3A] outline-none focus:border-[#0284C7] focus:bg-white"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Redaman ONT -27.8 dBm',
                    'LOS Merah pada Modem',
                    'WiFi 6 lambat di lantai 2',
                    'Prosedur uji speedtest & Berita Acara',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDiagQuery(preset)}
                      className="rounded-full border border-[#D8E3E9] bg-[#F5F8FA] px-2.5 py-1 text-[11px] font-medium text-[#245477] hover:border-[#0284C7]"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {diagError && (
                  <p className="rounded-[10px] bg-red-50 px-3 py-2 text-xs text-[#B23A48]">
                    {diagError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isDiagnosing}
                  className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#0284C7] py-2.5 text-xs font-bold text-white hover:bg-[#0369A1] disabled:opacity-60"
                >
                  {isDiagnosing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Stethoscope className="h-4 w-4" />
                  )}
                  <span>
                    {isDiagnosing
                      ? 'Menganalisis Kendala...'
                      : 'Minta Panduan Diagnosis AI'}
                  </span>
                </button>

                {/* First Time Fix Safety Checklist */}
                <div className="rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-3 space-y-2">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-[#17324D]">
                    <CheckSquare className="h-4 w-4 text-[#247A55]" />
                    <span>Checklist First Time Fix (SOP Bersama AI)</span>
                  </p>
                  {[
                    { key: 'opm', label: 'Redaman RX terukur -17 s.d -24 dBm di OPM' },
                    { key: 'wifi', label: 'Uji speedtest ≥ 90% bandwidth paket' },
                    { key: 'ba', label: 'Foto instalasi & tanda tangan Berita Acara lengkap' },
                  ].map((chk) => (
                    <label
                      key={chk.key}
                      className="flex cursor-pointer items-center gap-2 text-xs text-[#172B3A]"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(ftfChecks[chk.key])}
                        onChange={(e) =>
                          setFtfChecks((prev) => ({
                            ...prev,
                            [chk.key]: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded accent-[#0284C7]"
                      />
                      <span>{chk.label}</span>
                    </label>
                  ))}
                </div>
              </form>

              <div className="lg:col-span-7 rounded-[14px] border border-[#D8E3E9] bg-white p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2 border-b border-[#EAF2F6] pb-3">
                  <AlertTriangle className="h-4 w-4 text-[#A96816]" />
                  <div>
                    <h3 className="text-sm font-bold text-[#17324D]">
                      {diagResult?.title || 'Panduan Diagnosis Teknis AI'}
                    </h3>
                    <p className="text-[11px] text-[#526675]">
                      {diagResult?.assistantReply}
                    </p>
                  </div>
                </div>

                {diagResult?.documentSections?.map((sec, idx) => (
                  <div
                    key={idx}
                    className="rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] p-3.5 text-xs"
                  >
                    <p className="font-bold text-[#17324D]">{sec.heading}</p>
                    <p className="mt-1 leading-relaxed text-[#526675]">{sec.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {techTab === 'chat' && (
            <CollaborationChatPanel
              messages={chatMessages}
              input={chatInput}
              onInputChange={setChatInput}
              onSubmit={handleSendChat}
              isSending={isSendingChat}
              aiPartnerName={activeBinding.aiWorkerName}
              placeholder="Tanya langkah troubleshooting, pembagian waktu WO, atau kebutuhan material..."
            />
          )}
        </div>
      )}
    </div>
  );
}

function CollaborationChatPanel({
  messages,
  input,
  onInputChange,
  onSubmit,
  isSending,
  aiPartnerName,
  placeholder,
}: {
  messages: Array<{
    id: string;
    sender: 'ai' | 'human';
    name: string;
    time: string;
    text: string;
  }>;
  input: string;
  onInputChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSending: boolean;
  aiPartnerName: string;
  placeholder: string;
}) {
  return (
    <div className="rounded-[14px] border border-[#D8E3E9] bg-white overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#EAF2F6] bg-[#F5F8FA] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0284C7] text-white">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#17324D]">{aiPartnerName}</p>
            <p className="text-[11px] text-[#247A55] font-semibold">
              Terhubung dalam Ikatan Kolaborasi Aktif
            </p>
          </div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'human' ? 'items-end' : 'items-start'
            }`}
          >
            <span className="mb-1 text-[10px] font-semibold text-[#526675]">
              {msg.name} · {msg.time}
            </span>
            <div
              className={`max-w-[85%] rounded-[12px] px-3.5 py-2.5 text-xs leading-relaxed ${
                msg.sender === 'human'
                  ? 'bg-[#17324D] text-white'
                  : 'border border-[#D8E3E9] bg-[#F5F8FA] text-[#172B3A]'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 border-t border-[#EAF2F6] bg-white p-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={placeholder}
          className="h-10 flex-1 rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] px-3 text-xs text-[#172B3A] outline-none focus:border-[#0284C7] focus:bg-white"
        />
        <button
          type="submit"
          disabled={isSending || !input.trim()}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[10px] bg-[#0284C7] px-4 text-xs font-bold text-white hover:bg-[#0369A1] disabled:opacity-60"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          <span>Kirim</span>
        </button>
      </form>
    </div>
  );
}
