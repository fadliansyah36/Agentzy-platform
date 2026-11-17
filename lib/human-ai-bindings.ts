export type AgentzyManagerRole =
  | 'HRD Agentzy'
  | 'Admin Agentzy'
  | 'Direksi Agentzy'
  | 'Corporate / ISP Partner (Read-Only)';

export type WorkforceHumanRole = 'sales' | 'affiliate' | 'technician';

export interface HumanAIBindingRecord {
  id: string;
  humanName: string;
  humanCode: string;
  humanRole: WorkforceHumanRole;
  humanRoleLabel: string;
  aiWorkerId: string;
  aiWorkerName: string;
  secondaryAiWorkerName?: string;
  collaborationMode: string;
  collaborationScope: string[];
  autonomyLevel: 'L1' | 'L2' | 'L3';
  sharedKpiTarget: string;
  managedByRole: 'HRD Agentzy' | 'Admin Agentzy' | 'Direksi Agentzy';
  managedByPerson: string;
  tenantScope: string;
  status: 'Aktif' | 'Jeda';
  updatedAt: string;
}

export const HUMAN_AI_BINDINGS_STORAGE_KEY = 'agentzy_human_ai_bindings_v1';

export const INITIAL_HUMAN_AI_BINDINGS: HumanAIBindingRecord[] = [
  {
    id: 'BND-01',
    humanName: 'Raka Pratama',
    humanCode: 'SLS-2026-014',
    humanRole: 'sales',
    humanRoleLabel: 'Staff Sales (Tier Pro · Jakarta)',
    aiWorkerId: 'AIW-01',
    aiWorkerName: 'AI Sales Assistant',
    secondaryAiWorkerName: 'Lead Qualification',
    collaborationMode: 'Digital Marketing, Generate Content & Pencarian Leads',
    collaborationScope: [
      'Generate konten promosi sosmed (Video Reels, Desain Flyer, Gambar Iklan, Dokumen Proposal B2B)',
      'Penyaringan & skoring kesiapan prospek sebelum follow-up closing',
      'Draf balasan WhatsApp & penjadwalan pertemuan pelanggan',
    ],
    autonomyLevel: 'L2',
    sharedKpiTarget: '≥ 32 Aktivasi/bln · Konversi ≥ 35%',
    managedByRole: 'HRD Agentzy',
    managedByPerson: 'Dina Kusuma (HRD & People Ops Agentzy)',
    tenantScope: 'ISP Nusantara (Operasional Terkelola)',
    status: 'Aktif',
    updatedAt: 'Hari ini, 08:30',
  },
  {
    id: 'BND-02',
    humanName: 'Siti Nabila',
    humanCode: 'AF-88412',
    humanRole: 'affiliate',
    humanRoleLabel: 'Affiliate Freelance (Sponsor: Raka Pratama)',
    aiWorkerId: 'AIW-03',
    aiWorkerName: 'Affiliate Onboarding Coach',
    secondaryAiWorkerName: 'AI Sales Assistant',
    collaborationMode: 'Materi Sosmed Harian, Skrip Promosi & Leads Komunitas',
    collaborationScope: [
      'Paket konten promosi harian siap bagikan ke Instagram, TikTok & grup WhatsApp warga',
      'Panduan penjelasan promo resmi tanpa biaya pasang & bagi hasil 60/40',
      'Pengecekan awal ketersediaan jaringan sebelum prospek dikirim ke Staff Sales',
    ],
    autonomyLevel: 'L1',
    sharedKpiTarget: '≥ 18 Order Referral/bln · SLA Respon < 15 mnt',
    managedByRole: 'Admin Agentzy',
    managedByPerson: 'Hendra Wijaya (Admin Workforce Agentzy)',
    tenantScope: 'ISP Nusantara (Operasional Terkelola)',
    status: 'Aktif',
    updatedAt: 'Hari ini, 09:05',
  },
  {
    id: 'BND-03',
    humanName: 'Budi Santoso',
    humanCode: 'TK-000128',
    humanRole: 'technician',
    humanRoleLabel: 'Teknisi Lapangan FTTH/FWA (Jakarta Selatan)',
    aiWorkerId: 'AIW-04',
    aiWorkerName: 'Technical Troubleshooting',
    secondaryAiWorkerName: 'Work Order Coordinator',
    collaborationMode: 'Operasional Work Order, Optimasi Rute & Panduan Teknis',
    collaborationScope: [
      'Pengaturan antrean Work Order prioritas & estimasi rute perjalanan tercepat',
      'Diagnosis redaman optik, konfigurasi ONT/WiFi 6, dan langkah perbaikan lapangan',
      'Peringatan batas waktu SLA 4 jam dan kelengkapan checklist Berita Acara',
    ],
    autonomyLevel: 'L2',
    sharedKpiTarget: 'First Time Fix ≥ 95% · SLA ≥ 98%',
    managedByRole: 'Direksi Agentzy',
    managedByPerson: 'Arif Rahman (Direktur Operasional Agentzy)',
    tenantScope: 'ISP Nusantara (Operasional Terkelola)',
    status: 'Aktif',
    updatedAt: 'Kemarin, 16:45',
  },
  {
    id: 'BND-04',
    humanName: 'Andi Saputra',
    humanCode: 'SLS-2026-009',
    humanRole: 'sales',
    humanRoleLabel: 'Staff Sales (Tier Elite · Tangerang Selatan)',
    aiWorkerId: 'AIW-02',
    aiWorkerName: 'Lead Qualification',
    secondaryAiWorkerName: 'AI Sales Assistant',
    collaborationMode: 'Kualifikasi Prospek Klaster Baru & Proposal Korporasi',
    collaborationScope: [
      'Verifikasi otomatis calon pelanggan klaster BSD & Bintaro dari kampanye digital',
      'Penyusunan dokumen penawaran B2B & perbandingan paket bisnis',
    ],
    autonomyLevel: 'L2',
    sharedKpiTarget: '≥ 40 Aktivasi/bln · Respon Lead < 10 mnt',
    managedByRole: 'HRD Agentzy',
    managedByPerson: 'Dina Kusuma (HRD & People Ops Agentzy)',
    tenantScope: 'ISP Nusantara (Operasional Terkelola)',
    status: 'Aktif',
    updatedAt: '2 hari lalu',
  },
];

export function loadHumanAIBindings(): HumanAIBindingRecord[] {
  if (typeof window === 'undefined') return INITIAL_HUMAN_AI_BINDINGS;
  try {
    const raw = window.localStorage.getItem(HUMAN_AI_BINDINGS_STORAGE_KEY);
    if (!raw) return INITIAL_HUMAN_AI_BINDINGS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as HumanAIBindingRecord[];
    }
    return INITIAL_HUMAN_AI_BINDINGS;
  } catch {
    return INITIAL_HUMAN_AI_BINDINGS;
  }
}

export function saveHumanAIBindings(items: HumanAIBindingRecord[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      HUMAN_AI_BINDINGS_STORAGE_KEY,
      JSON.stringify(items)
    );
  } catch {
    // Ignore storage quota errors
  }
}
