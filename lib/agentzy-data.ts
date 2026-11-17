export type WorkforceRoleMode = 'sales' | 'affiliate' | 'technician';

export type SalesLifecycleStatus =
  | 'Prospek'
  | 'Follow Up'
  | 'Order · Proses Instalasi'
  | 'Aktivasi · Selesai';

export interface LeadItem {
  id: string;
  name: string;
  phone: string;
  email: string;
  product: string;
  address: string;
  status: SalesLifecycleStatus;
  lifecycleKey: string;
  lastUpdate: string;
  notes: string;
  attributionType: 'sales_personal' | 'affiliate';
  activities: Array<{ id: string; time: string; action: string; actor: string }>;
}

export interface TaskItem {
  id: string;
  title: string;
  subtitle: string;
  dueLabel: string;
  priority: 'Prioritas Tinggi' | 'Normal' | 'Campaign' | 'Recruitment';
  status: 'aktif' | 'menunggu' | 'selesai';
  category: 'sales' | 'instalasi' | 'campaign' | 'recruitment';
  roles: WorkforceRoleMode[];
}

export interface AffiliateMember {
  id: string;
  name: string;
  code: string;
  phone: string;
  email: string;
  orders: number;
  commissionTotal: number;
  status: 'Aktif' | 'Pending Verifikasi';
  joinedDate: string;
  rank?: number;
}

export interface WorkOrderItem {
  id: string;
  type: 'Instalasi Baru' | 'Maintenance' | 'Troubleshooting';
  customerName: string;
  customerPhone: string;
  address: string;
  productPackage: string;
  priority: 'Prioritas Tinggi' | 'Normal';
  status: 'Pending' | 'Proses' | 'Selesai';
  slaRemaining: string;
  distanceKm: string;
  etaMinutes: number;
  coordinates: { lat: number; lng: number };
  durationText?: string;
  completedDate?: string;
}

export interface TrainingCourse {
  id: string;
  title: string;
  format: 'Video' | 'Modul' | 'Ujian';
  durationMinutes: number;
  status: 'Belum Mulai' | 'Progress' | 'Selesai' | 'Lanjutkan';
  progressPct: number;
  roleScope: 'sales' | 'affiliate' | 'sales_and_affiliate' | 'technician' | 'all';
  description: string;
}

export interface CertificationItem {
  id: string;
  title: string;
  validUntil: string;
  issuer: string;
  status: 'Aktif' | 'Perlu Pembaruan';
  roleScope: WorkforceRoleMode[];
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Perangkat' | 'Material';
  stockLabel: string;
  unitCount: number;
  unitName: string;
}

export const HUMAN_WORKFORCE_CATALOGUE = [
  {
    title: 'Sales Workforce',
    scope: 'Sales Agentzy (Training, Pro, Elite), SPV, dan Area Manager untuk akuisisi pelanggan terkelola.',
    output: 'Pipeline lead terverifikasi, order validasi provider, dan pencapaian produktivitas SA.',
    governance: 'KPI, target wilayah, audit trail aktivitas, dan eskalasi supervisor.',
  },
  {
    title: 'Affiliate & Freelance Network',
    scope: 'Rekrutmen, registrasi, verifikasi identitas, dan atribusi mitra affiliate oleh Sales Agentzy.',
    output: 'Perluasan kanal akuisisi dengan pembagian produktivitas inkremental 60% Affiliate / 40% Sales.',
    governance: 'Atribusi terkunci, deteksi duplikasi/self-referral, dan persetujuan berjenjang.',
  },
  {
    title: 'Field Technician Workforce',
    scope: 'Teknisi instalasi FTTH/FWA, maintenance, troubleshooting, survey, dan inspektur kualitas.',
    output: 'Work order selesai tepat SLA dengan foto bukti, speedtest, dan tanda tangan pelanggan.',
    governance: 'Checklist SOP, validasi K3, audit QC, dan mode offline lapangan.',
  },
  {
    title: 'Recruitment & Onboarding',
    scope: 'Seleksi terstandar, verifikasi dokumen, dan penentuan klasifikasi hubungan kerja sah.',
    output: 'Workforce Passport terverifikasi siap ditugaskan ke proyek/tenant corporate.',
    governance: 'Kepatuhan ketenagakerjaan, NDA/kontrak digital, dan persetujuan legal.',
  },
  {
    title: 'Training & Certification',
    scope: 'Modul pembelajaran produk ISP, teknik closing, manajemen affiliate, SOP FTTH, dan K3.',
    output: 'Sertifikasi aktif dengan masa berlaku sebagai hard constraint penugasan.',
    governance: 'Skor ujian minimum, masa berlaku sertifikat, dan pembaruan berkala.',
  },
  {
    title: 'Scheduling & Dispatch',
    scope: 'Penjadwalan shift, absensi berbasis geolokasi, dan pembobotan Assignment Engine.',
    output: 'Penugasan optimal berdasarkan skill fit, ketersediaan, jarak, dan beban kerja.',
    governance: 'Hard constraint sertifikasi/tenant, audit perubahan jadwal, dan batas lembur.',
  },
  {
    title: 'Performance & KPI Management',
    scope: 'Pemantauan produktivitas SA, konversi lead, SLA penyelesaian WO, dan First-Time-Fix.',
    output: 'Analitik performa per periode dengan pembanding target vs aktual yang dapat ditelusuri.',
    governance: 'Definisi rumus KPI terversi dan sumber fakta operasional yang sah.',
  },
  {
    title: 'Deterministic Commission Administration',
    scope: 'Perhitungan komisi berbasis event produktivitas tervalidasi provider dan ledger immutable.',
    output: 'Rincian statement transparan, penyesuaian (adjustment), dan batch payout terotorisasi.',
    governance: 'Tanpa perhitungan LLM, presisi Decimal, dan pemisahan tugas approval finance.',
  },
  {
    title: 'Workforce Operations Reporting',
    scope: 'Pelaporan operasional terpadu bagi manajemen corporate/ISP dan supervisor.',
    output: 'Ekspor laporan aktivitas, kepatuhan SLA, dan rekap komisi siap rekonsiliasi.',
    governance: 'Isolasi tenant ketat (RLS), jejak audit akses, dan freshness metadata.',
  },
];

export const AI_WORKFORCE_CATALOGUE = [
  {
    title: 'AI Sales Assistant',
    scope: 'Mendampingi Sales Resmi menyusun ringkasan penawaran produk FTTH/FWA dan skrip tindak lanjut.',
    output: 'Draf komunikasi prospek kontekstual dan rekomendasi paket sesuai area cakupan.',
    governance: 'Autonomi L1/L2 dengan persetujuan Sales sebelum pengiriman eksternal.',
  },
  {
    title: 'AI Lead Qualification',
    scope: 'Menyaring kelengkapan data prospek masuk, kesesuaian cakupan jaringan, dan prioritas tindak lanjut.',
    output: 'Skor kesiapan prospek beserta ringkasan konteks untuk handoff ke Sales Resmi.',
    governance: 'Aturan tenant allowlist, tanpa akses mutasi order tanpa validasi.',
  },
  {
    title: 'AI Affiliate Recruitment & Onboarding Assistant',
    scope: 'Memandu calon mitra affiliate melengkapi formulir registrasi, dokumen, dan modul pelatihan awal.',
    output: 'Paket aplikasi affiliate siap tinjau oleh supervisor/admin.',
    governance: 'Tidak dapat menyetujui aktivasi atau mengubah atribusi sponsor.',
  },
  {
    title: 'AI Marketing & Content Assistant',
    scope: 'Menyiapkan materi kampanye area perumahan dan draf konten akuisisi sesuai panduan merek.',
    output: 'Variasi materi promosi siap review tim pemasaran corporate.',
    governance: 'Wajib persetujuan corporate sebelum publikasi atau aktivasi iklan.',
  },
  {
    title: 'AI Customer Support Assistant',
    scope: 'Membantu penanganan pertanyaan layanan pelanggan tingkat awal berbasis Knowledge/RAG resmi.',
    output: 'Jawaban terkurasi dengan sitasi dokumen resmi atau tiket eskalasi.',
    governance: 'Berbasis dokumen tenant terizin, proteksi prompt injection.',
  },
  {
    title: 'AI Technical Knowledge Assistant',
    scope: 'Asisten referensi cepat SOP instalasi FTTH, kode error ONT, dan panduan troubleshooting teknisi.',
    output: 'Langkah diagnosa terstruktur dengan sitasi manual teknis resmi.',
    governance: 'Read-only terhadap basis pengetahuan teknis terverifikasi.',
  },
  {
    title: 'AI Operations Coordinator',
    scope: 'Memantau antrean work order, risiko keterlambatan SLA, dan memicu pengingat eskalasi.',
    output: 'Peringatan dini potensi pelanggaran SLA dan ringkasan dispatch harian.',
    governance: 'Bounded internal execution dengan audit setiap notifikasi.',
  },
  {
    title: 'AI Data & Performance Analyst',
    scope: 'Menyusun ringkasan tren konversi, performa regional, dan anomali produktivitas dari read model.',
    output: 'Narasi eksekutif dan identifikasi deviasi KPI berbasis data transaksi.',
    governance: 'Akses read-only pada agregat terizin; tidak memodifikasi ledger.',
  },
  {
    title: 'AI Finance Reporting Assistant',
    scope: 'Membantu menyusun ringkasan rekonsiliasi tagihan, pemakaian AI Credits, dan laporan periodik.',
    output: 'Draf laporan keuangan terstruktur; perhitungan angka tetap dilakukan oleh engine deterministik.',
    governance: 'Dilarang menghitung payable commission atau memicu pembayaran.',
  },
  {
    title: 'Custom AI Worker by Job Description',
    scope: 'Konfigurasi AI Worker khusus per peran departemen melalui AI Worker Studio dengan kontrak kerja.',
    output: 'Agen terkelola dengan JD, supervisor manusia, batas tool, dan anggaran AI Credits.',
    governance: 'Siklus hidup draft → policy_review → approved → active dengan audit penuh.',
  },
];

export const PARTNERSHIP_STEPS = [
  { step: '01', title: 'Application', desc: 'Pengajuan kebutuhan workforce & ruang lingkup melalui formulir kemitraan.' },
  { step: '02', title: 'Qualification', desc: 'Peninjauan awal kelayakan industri, area operasional, dan kesiapan integrasi.' },
  { step: '03', title: 'Discovery', desc: 'Sesi pemetaan workflow, definisi produktivitas/SA, dan target SLA layanan.' },
  { step: '04', title: 'Proposal / Scope', desc: 'Penyusunan arsitektur layanan Human Workforce, AI Workforce, dan tata kelola.' },
  { step: '05', title: 'Legal & Commercial Review', desc: 'Penyelarasan kontrak kerja sama, skema insentif resmi, dan kepatuhan UU PDP.' },
  { step: '06', title: 'Contract & SOW', desc: 'Penandatanganan kontrak induk, SOW, batas entitlement, dan matriks otorisasi.' },
  { step: '07', title: 'Tenant Onboarding', desc: 'Penyediaan tenant terisolasi, katalog produk provider, dan aturan komisi terversi.' },
  { step: '08', title: 'Deployment', desc: 'Aktivasi tim sales, jaringan affiliate, teknisi lapangan, serta AI Worker terotorisasi.' },
  { step: '09', title: 'Operational Review', desc: 'Evaluasi KPI berkala, rekonsiliasi komisi, dan optimalisasi kapasitas berkelanjutan.' },
];

export const LANDING_FAQS = [
  {
    q: 'Apa perbedaan utama antara Human Workforce dan AI Workforce di Agentzy?',
    a: 'Human Workforce mencakup Sales Resmi, Affiliate Freelance, dan Teknisi Lapangan yang memiliki Workforce Passport dan klasifikasi hukum yang jelas. AI Workforce adalah agen AI terkelola dengan Job Description, supervisor manusia, batas tool/budget, dan audit trail dalam satu workflow terpadu.',
  },
  {
    q: 'Bagaimana tata kelola AI Workforce agar tetap aman untuk operasional enterprise?',
    a: 'Setiap AI Worker dikelola melalui AI Gateway tunggal dengan isolasi tenant, batas anggaran AI Credits, level otonomi bertingkat (L0–L4), dan kewajiban persetujuan manusia untuk aksi eksternal atau berdampak finansial.',
  },
  {
    q: 'Bagaimana peran supervisor corporate dalam mengawasi AI dan tim lapangan?',
    a: 'Corporate dapat memantau KPI aktual vs target, menyetujui langkah handoff Human-AI, meninjau audit log eksekusi, serta mengatur batas anggaran AI Credits melalui portal terpadu.',
  },
  {
    q: 'Bagaimana mekanisme rekrutmen Affiliate Freelance oleh Sales Resmi?',
    a: 'Sales Resmi yang berizin dapat membuat tautan referral atau mendaftarkan calon affiliate secara manual. Aplikasi melewati verifikasi identitas, persetujuan perjanjian, dan pelatihan sebelum aktif dengan atribusi yang terkunci.',
  },
  {
    q: 'Bagaimana sistem pembagian produktivitas dan komisi bekerja?',
    a: 'Produktivitas personal Sales Resmi tetap dihitung 100%, sedangkan produktivitas inkremental dari affiliate dibagi 60% untuk Affiliate dan 40% untuk Sales Resmi. Tier SA menggunakan gabungan keduanya, dan seluruh perhitungan dilakukan oleh Commission Engine deterministik — bukan LLM.',
  },
  {
    q: 'Apakah Agentzy mendukung skema multi-ISP dan ekspansi ke industri lain?',
    a: 'Ya. Industri telekomunikasi/ISP (FTTH, FWA, PXGY) menjadi fokus awal, dengan arsitektur tenant & provider configuration yang dapat diadaptasi untuk industri ritel, logistik, maupun layanan lapangan lainnya.',
  },
  {
    q: 'Bagaimana integrasi dengan sistem provider ISP dan Google Workspace?',
    a: 'Integrasi ke sistem provider hanya menggunakan kanal resmi terotorisasi (REST API, webhook bertanda tangan, atau rekonsiliasi file aman). Untuk kolaborasi harian, Agentzy juga mendukung integrasi Google Maps, Gmail, Google Calendar, dan Google Meet atas izin pengguna.',
  },
  {
    q: 'Apa itu AI Credits dan bagaimana transparansinya?',
    a: 'AI Credits adalah unit metering internal (bukan token mentah atau uang tunai) untuk mencatat pemakaian AI Worker per run dan departemen, lengkap dengan mekanisme reservasi anggaran, batas keras (hard limit), dan laporan pemakaian.',
  },
];

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'TSK-01',
    title: 'Follow Up & Closing Lead ISP',
    subtitle: '3 lead · Hari ini, 18:00',
    dueLabel: 'Hari ini, 18:00',
    priority: 'Prioritas Tinggi',
    status: 'aktif',
    category: 'sales',
    roles: ['sales', 'affiliate'],
  },
  {
    id: 'TSK-02',
    title: 'Koordinasi Instalasi Pelanggan',
    subtitle: '2 order · Besok, 12:00',
    dueLabel: 'Besok, 12:00',
    priority: 'Normal',
    status: 'aktif',
    category: 'instalasi',
    roles: ['sales'],
  },
  {
    id: 'TSK-03',
    title: 'Kampanye Area Perumahan',
    subtitle: 'Target 10 lead · 3 hari lagi',
    dueLabel: '3 hari lagi',
    priority: 'Campaign',
    status: 'aktif',
    category: 'campaign',
    roles: ['sales', 'affiliate'],
  },
  {
    id: 'TSK-04',
    title: 'Rekrut 5 Affiliate Baru',
    subtitle: 'Progress 2 / 5 · 7 hari lagi',
    dueLabel: '7 hari lagi',
    priority: 'Recruitment',
    status: 'aktif',
    category: 'recruitment',
    roles: ['sales'],
  },
  {
    id: 'TSK-05',
    title: 'Verifikasi Dokumen KYC Affiliate',
    subtitle: '2 pendaftar menunggu persetujuan',
    dueLabel: 'Besok, 17:00',
    priority: 'Normal',
    status: 'menunggu',
    category: 'recruitment',
    roles: ['sales'],
  },
  {
    id: 'TSK-06',
    title: 'Rekonsiliasi Order FTTH Minggu 2',
    subtitle: '8 order tervalidasi provider',
    dueLabel: 'Selesai',
    priority: 'Normal',
    status: 'selesai',
    category: 'sales',
    roles: ['sales', 'affiliate'],
  },
];

export const INITIAL_LEADS: LeadItem[] = [
  {
    id: 'LD-101',
    name: 'Budi Santoso',
    phone: '0857 1234 5678',
    email: 'budi.santoso@contoh.id',
    product: 'FTTH 100 Mbps',
    address: 'Jl. Melati No. 12, Jakarta',
    status: 'Prospek',
    lifecycleKey: 'qualified',
    lastUpdate: 'Hari ini',
    notes: 'Konsultasi paket & promo',
    attributionType: 'sales_personal',
    activities: [
      { id: 'ACT-1', time: 'Hari ini, 10:15', action: 'Telepon awal — konfirmasi kebutuhan bandwidth rumah', actor: 'Raka Pratama' },
      { id: 'ACT-2', time: 'Kemarin, 16:40', action: 'Pengecekan cakupan jaringan ODP area Melati selesai (Tersedia)', actor: 'AI Lead Qualification' },
    ],
  },
  {
    id: 'LD-102',
    name: 'Rina Marlina',
    phone: '0813 8890 4412',
    email: 'rina.marlina@contoh.id',
    product: 'FWA 50 Mbps',
    address: 'Jl. Kemang Timur No. 45, Jakarta Selatan',
    status: 'Follow Up',
    lifecycleKey: 'offer_presented',
    lastUpdate: 'Besok',
    notes: 'Menunggu konfirmasi jadwal kunjungan survey perangkat',
    attributionType: 'sales_personal',
    activities: [
      { id: 'ACT-3', time: 'Hari ini, 09:00', action: 'Kirim penawaran paket FWA 50 Mbps via email', actor: 'Raka Pratama' },
    ],
  },
  {
    id: 'LD-103',
    name: 'Dedi Kurniawan',
    phone: '0821 7765 3320',
    email: 'dedi.kurniawan@contoh.id',
    product: 'FTTH 200 Mbps',
    address: 'Cluster Griya Asri Blok C4, Tangerang Selatan',
    status: 'Order · Proses Instalasi',
    lifecycleKey: 'installation',
    lastUpdate: 'Proses Instalasi',
    notes: 'WO-872343 sudah dijadwalkan untuk teknisi lapangan',
    attributionType: 'affiliate',
    activities: [
      { id: 'ACT-4', time: 'Kemarin, 14:20', action: 'Order disetujui provider (ID Order Provider #ISP-99241)', actor: 'Provider Sync' },
    ],
  },
  {
    id: 'LD-104',
    name: 'Sari Wulandari',
    phone: '0819 3341 9088',
    email: 'sari.wulandari@contoh.id',
    product: 'FTTH 100 Mbps',
    address: 'Jl. Kencana No. 8, Jakarta Selatan',
    status: 'Aktivasi · Selesai',
    lifecycleKey: 'activated',
    lastUpdate: 'Selesai',
    notes: 'Aktivasi berhasil, memenuhi syarat produktivitas 1 SA',
    attributionType: 'sales_personal',
    activities: [
      { id: 'ACT-5', time: '2 hari lalu', action: 'Aktivasi layanan FTTH selesai & terverifikasi', actor: 'System' },
    ],
  },
  {
    id: 'LD-105',
    name: 'Nadia Kusuma',
    phone: '0812 5531 7740',
    email: 'nadia.kusuma@contoh.id',
    product: 'FTTH 100 Mbps',
    address: 'Kompleks Permata Hijau Blok B2, Jakarta Selatan',
    status: 'Aktivasi · Selesai',
    lifecycleKey: 'activated',
    lastUpdate: 'Kemarin',
    notes: 'Prospek Affiliate teraktivasi dengan komisi bagi hasil 60%',
    attributionType: 'affiliate',
    activities: [
      { id: 'ACT-6', time: 'Kemarin, 17:10', action: 'Layanan aktif & komisi 60% tercatat untuk Affiliate', actor: 'Commission Engine' },
    ],
  },
];

export const INITIAL_AFFILIATES: AffiliateMember[] = [
  {
    id: 'AFF-01',
    name: 'Siti Nabila',
    code: 'AGT-SITI-01',
    phone: '0812 9001 1122',
    email: 'siti.nabila@contoh.id',
    orders: 8,
    commissionTotal: 2400000,
    status: 'Aktif',
    joinedDate: '12 Okt 2025',
    rank: 1,
  },
  {
    id: 'AFF-02',
    name: 'Andi Saputra',
    code: 'AGT-ANDI-02',
    phone: '0813 7781 2233',
    email: 'andi.saputra@contoh.id',
    orders: 6,
    commissionTotal: 1800000,
    status: 'Aktif',
    joinedDate: '25 Okt 2025',
    rank: 2,
  },
  {
    id: 'AFF-03',
    name: 'Dewi Lestari',
    code: 'AGT-DEWI-03',
    phone: '0856 4412 8899',
    email: 'dewi.lestari@contoh.id',
    orders: 5,
    commissionTotal: 1500000,
    status: 'Aktif',
    joinedDate: '04 Nov 2025',
    rank: 3,
  },
  {
    id: 'AFF-04',
    name: 'Bagus Prasetyo',
    code: 'AGT-BAGUS-04',
    phone: '0878 1123 5544',
    email: 'bagus.p@contoh.id',
    orders: 0,
    commissionTotal: 0,
    status: 'Pending Verifikasi',
    joinedDate: 'Hari ini',
  },
  {
    id: 'AFF-05',
    name: 'Nadia Permata',
    code: 'AGT-NADIA-05',
    phone: '0852 6610 9944',
    email: 'nadia.permata@contoh.id',
    orders: 0,
    commissionTotal: 0,
    status: 'Pending Verifikasi',
    joinedDate: 'Kemarin',
  },
];

export const INITIAL_WORK_ORDERS: WorkOrderItem[] = [
  {
    id: 'WO-872341',
    type: 'Instalasi Baru',
    customerName: 'Bpk. Andi Pratama',
    customerPhone: '0812 3456 7890',
    address: 'Jl. Melati No.12, Cilandak, Jakarta Selatan',
    productPackage: 'FTTH 100 Mbps',
    priority: 'Prioritas Tinggi',
    status: 'Pending',
    slaRemaining: '± 4 jam (sisa 2 jam 30 mnt)',
    distanceKm: '2,3',
    etaMinutes: 8,
    coordinates: { lat: -6.2921, lng: 106.7985 },
  },
  {
    id: 'WO-872342',
    type: 'Maintenance',
    customerName: 'Ibu Sari Wulandari',
    customerPhone: '0819 3341 9088',
    address: 'Jl. Kencana No.8, Jakarta Selatan',
    productPackage: 'FTTH 100 Mbps',
    priority: 'Normal',
    status: 'Proses',
    slaRemaining: '± 6 jam (sisa 4 jam 10 mnt)',
    distanceKm: '3,8',
    etaMinutes: 14,
    coordinates: { lat: -6.2832, lng: 106.8091 },
  },
  {
    id: 'WO-872343',
    type: 'Troubleshooting',
    customerName: 'Bpk. Dedi Kurniawan',
    customerPhone: '0821 7765 3320',
    address: 'Jl. Terogong Raya No. 22, Jakarta Selatan',
    productPackage: 'FTTH 200 Mbps',
    priority: 'Prioritas Tinggi',
    status: 'Proses',
    slaRemaining: '± 3 jam (sisa 1 jam 45 mnt)',
    distanceKm: '4,5',
    etaMinutes: 17,
    coordinates: { lat: -6.2874, lng: 106.7852 },
  },
  {
    id: 'WO-872300',
    type: 'Maintenance',
    customerName: 'Ibu Kartika Sari',
    customerPhone: '0811 2234 5567',
    address: 'Jl. Ampera Raya No. 19, Jakarta Selatan',
    productPackage: 'FTTH 100 Mbps',
    priority: 'Normal',
    status: 'Selesai',
    slaRemaining: 'Tepat Waktu',
    distanceKm: '3,1',
    etaMinutes: 11,
    coordinates: { lat: -6.2799, lng: 106.8199 },
    durationText: '1 jam 15 menit',
    completedDate: '20 Jan 2025',
  },
  {
    id: 'WO-872299',
    type: 'Troubleshooting',
    customerName: 'Bpk. Hendra Wijaya',
    customerPhone: '0818 9912 4401',
    address: 'Jl. Cipete Raya No. 51, Jakarta Selatan',
    productPackage: 'FWA 50 Mbps',
    priority: 'Normal',
    status: 'Selesai',
    slaRemaining: 'Tepat Waktu',
    distanceKm: '2,9',
    etaMinutes: 10,
    coordinates: { lat: -6.2752, lng: 106.8012 },
    durationText: '55 menit',
    completedDate: '19 Jan 2025',
  },
];

export const INITIAL_COURSES: TrainingCourse[] = [
  {
    id: 'TRN-01',
    title: 'Produk ISP & Promo Terbaru',
    format: 'Video',
    durationMinutes: 30,
    status: 'Belum Mulai',
    progressPct: 0,
    roleScope: 'sales_and_affiliate',
    description: 'Pemahaman detail paket FTTH, FWA, PXGY, syarat cakupan ODP, dan promo resmi Mitra ISP Provider.',
  },
  {
    id: 'TRN-02',
    title: 'Teknik Closing Penjualan',
    format: 'Video',
    durationMinutes: 45,
    status: 'Progress',
    progressPct: 60,
    roleScope: 'sales_and_affiliate',
    description: 'Strategi penanganan keberatan calon pelanggan dan konversi prospek menjadi order valid.',
  },
  {
    id: 'TRN-03',
    title: 'Manajemen Tim Affiliate',
    format: 'Video',
    durationMinutes: 40,
    status: 'Selesai',
    progressPct: 100,
    roleScope: 'sales',
    description: 'Alur rekrutmen, onboarding, kepatuhan atribusi, dan pembinaan produktivitas jaringan affiliate untuk Sales Agentzy.',
  },
  {
    id: 'TRN-04',
    title: 'Sertifikasi Sales Agentzy Pro',
    format: 'Ujian',
    durationMinutes: 60,
    status: 'Belum Mulai',
    progressPct: 0,
    roleScope: 'sales',
    description: 'Evaluasi komprehensif standar produk, kode etik penjualan, dan aturan komisi untuk jenjang Sales Agentzy Pro & Elite.',
  },
  {
    id: 'TRN-08',
    title: 'Panduan Input Lead & Komisi Affiliate (60%)',
    format: 'Modul',
    durationMinutes: 25,
    status: 'Selesai',
    progressPct: 100,
    roleScope: 'affiliate',
    description: 'Tata cara pengajuan prospek valid, pengecekan ketersediaan cakupan area, dan pemantauan bagi hasil 60%.',
  },
  {
    id: 'TRN-05',
    title: 'SOP Instalasi FTTH',
    format: 'Modul',
    durationMinutes: 45,
    status: 'Selesai',
    progressPct: 100,
    roleScope: 'technician',
    description: 'Standar penarikan kabel dropcore, redaman optik, aktivasi ONT, dan verifikasi speedtest.',
  },
  {
    id: 'TRN-06',
    title: 'Troubleshooting Jaringan',
    format: 'Modul',
    durationMinutes: 60,
    status: 'Lanjutkan',
    progressPct: 50,
    roleScope: 'technician',
    description: 'Diagnosa gangguan LOS, redaman tinggi, interferensi WiFi pelanggan, dan penggantian konektor SC.',
  },
  {
    id: 'TRN-07',
    title: 'K3 Lapangan',
    format: 'Modul',
    durationMinutes: 30,
    status: 'Belum Mulai',
    progressPct: 0,
    roleScope: 'technician',
    description: 'Prosedur keselamatan kerja di ketinggian, APD wajib teknisi, dan keamanan area kerja pelanggan.',
  },
];

export const INITIAL_CERTIFICATIONS: CertificationItem[] = [
  {
    id: 'CRT-01',
    title: 'Sertifikasi Sales Agentzy Pro',
    validUntil: '31 Des 2026',
    issuer: 'Agentzy Workforce Academy',
    status: 'Aktif',
    roleScope: ['sales'],
  },
  {
    id: 'CRT-02',
    title: 'Produk ISP Specialist',
    validUntil: '30 Jun 2026',
    issuer: 'Agentzy ISP Partner Enablement',
    status: 'Aktif',
    roleScope: ['sales', 'affiliate', 'technician'],
  },
  {
    id: 'CRT-03',
    title: 'K3 Lapangan & Instalasi Aman',
    validUntil: '31 Des 2025',
    issuer: 'Agentzy Safety Compliance',
    status: 'Aktif',
    roleScope: ['technician', 'sales'],
  },
  {
    id: 'CRT-04',
    title: 'Sertifikasi Teknisi FTTH Lapangan',
    validUntil: '31 Des 2026',
    issuer: 'Agentzy Technical Academy',
    status: 'Aktif',
    roleScope: ['technician'],
  },
  {
    id: 'CRT-05',
    title: 'Mitra Akuisisi Affiliate Terverifikasi',
    validUntil: '31 Des 2026',
    issuer: 'Agentzy Partner Compliance',
    status: 'Aktif',
    roleScope: ['affiliate'],
  },
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'INV-01',
    name: 'ONT ZTE F670L',
    category: 'Perangkat',
    stockLabel: 'Stok: 3 unit',
    unitCount: 3,
    unitName: 'unit',
  },
  {
    id: 'INV-02',
    name: 'Kabel FO Dropcore',
    category: 'Material',
    stockLabel: 'Stok: 300 meter',
    unitCount: 300,
    unitName: 'meter',
  },
  {
    id: 'INV-03',
    name: 'Connector SC',
    category: 'Material',
    stockLabel: 'Stok: 20 pcs',
    unitCount: 20,
    unitName: 'pcs',
  },
  {
    id: 'INV-04',
    name: 'Splitter 1:8',
    category: 'Material',
    stockLabel: 'Stok: 4 pcs',
    unitCount: 4,
    unitName: 'pcs',
  },
];

// PRD Section 6.2 & 6.3 deterministic reference helper (design preview calculator)
export const SALES_AGENTZY_TIERS = [
  { min: 1, max: 6, label: 'Bracket 1 (1–6 SA)', tierGroup: 'Training / Pro', feeRef: 80000, multiplier: 0 },
  { min: 7, max: 9, label: 'Bracket 2 (7–9 SA)', tierGroup: 'Pro', feeRef: 150000, multiplier: 1.5 },
  { min: 10, max: 13, label: 'Bracket 3 (10–13 SA)', tierGroup: 'Pro', feeRef: 175000, multiplier: 2 },
  { min: 14, max: 29, label: 'Bracket 4 (14–29 SA)', tierGroup: 'Pro', feeRef: 200000, multiplier: 4 },
  { min: 30, max: 39, label: 'Bracket 5 (30–39 SA)', tierGroup: 'Elite', feeRef: 225000, multiplier: 4.25 },
  { min: 40, max: 49, label: 'Bracket 6 (40–49 SA)', tierGroup: 'Elite', feeRef: 250000, multiplier: 4.5 },
  { min: 50, max: 9999, label: 'Bracket 7 (≥50 SA)', tierGroup: 'Elite', feeRef: 275000, multiplier: 4.65 },
];

export const SALES_TIER_LEVELS = [
  {
    id: 'Training' as const,
    name: 'Tier 1 · Training (OJT)',
    subtitle: 'Tahap Onboarding & Sertifikasi Dasar Sales Agentzy',
    targetSA: 'Target Lulus: 7 SA / periode OJT',
    feeScheme: 'Progresif Rp 80rb – Rp 200rb / SA · Lump Sum 3 SA (Rp 325rb) & 7 SA (Rp 600rb)',
    affiliateQuota: 'Fokus Produktivitas Pribadi',
    requirements: [
      'Menyelesaikan modul Produk ISP & Teknik Closing Penjualan',
      'Lulus verifikasi identitas (Workforce Passport) & NDA',
      'Mencapai minimal 7 SA tervalidasi provider',
    ],
    benefits: [
      'Fee progresif OJT dan bonus lump sum pencapaian awal',
      'Pendampingan langsung oleh Supervisor area',
      'Akses penuh ke katalog paket FTTH, FWA, dan PXGY',
    ],
  },
  {
    id: 'Pro' as const,
    name: 'Tier 2 · Pro (Sales Agentzy Pro)',
    subtitle: 'Sales Resmi Terverifikasi dengan Hak Rekrutmen Affiliate',
    targetSA: 'Target Bulanan: 10 – 29 SA Gabungan',
    feeScheme: 'Fee Rp 80rb – Rp 200rb / SA · Multiplier Referensi 0x – 4x',
    affiliateQuota: 'Hingga 20 Affiliate Aktif (Split 60/40)',
    requirements: [
      'Lulus sertifikasi Sales Agentzy Pro & Kepatuhan Kode Etik',
      'Menjaga konversi prospek dan SLA tindak lanjut ≥ 90%',
      'Mencapai produktivitas gabungan (Personal + 40% Affiliate) sesuai target bulanan',
    ],
    benefits: [
      'Skema pembagian produktivitas inkremental 40% untuk Sales / 60% untuk Affiliate',
      'Tier SA gabungan dihitung dari Personal + Affiliate teratribusi',
      'Bonus produktivitas dan insentif kampanye area perumahan',
    ],
  },
  {
    id: 'Elite' as const,
    name: 'Tier 3 · Elite (Sales Agentzy Elite)',
    subtitle: 'Jenjang Tertinggi · Pemimpin Jaringan & Akun Korporasi',
    targetSA: 'Target Bulanan: ≥ 30 SA hingga ≥ 50 SA Gabungan',
    feeScheme: 'Fee Rp 225rb – Rp 275rb / SA · Multiplier Referensi 4,25x – 4,65x',
    affiliateQuota: 'Hingga 50 Affiliate Aktif + Prioritas Klaster',
    requirements: [
      'Konsisten mencapai ≥ 30 SA gabungan selama 2 bulan berturut-turut',
      'Memiliki minimal 10 Affiliate aktif dengan tingkat aktivasi sehat',
      'SLA tindak lanjut ≥ 95% tanpa pelanggaran kepatuhan / duplikasi',
    ],
    benefits: [
      'Multiplier insentif tertinggi (4,25x hingga 4,65x) sesuai dokumen provider',
      'Prioritas distribusi prospek korporasi & area ekspansi baru',
      'Bonus kepemimpinan jaringan & akses evaluasi menjadi Supervisor (SPV)',
    ],
  },
];

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace('IDR', 'Rp')
    .trim();
}
