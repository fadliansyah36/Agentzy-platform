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
  type: 'Instalasi Baru' | 'Maintenance' | 'Troubleshooting' | 'Survey';
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
    title: 'Tim Staff Sales Profesional',
    scope: 'Penyediaan dan pengelolaan Staff Sales berpengalaman (jenjang Training, Pro, hingga Elite) untuk mendorong penjualan langsung dan pertumbuhan pelanggan baru.',
    output: 'Peningkatan closing pelanggan baru, penguatan pasar area potensial, dan pencapaian target penjualan rutin.',
    governance: 'Supervisi target berkala, pembinaan karir berjenjang, dan laporan kinerja transparan.',
  },
  {
    title: 'Jaringan Affiliate & Mitra Penjualan',
    scope: 'Rekrutmen, pelatihan awal, dan pengelolaan ribuan mitra Affiliate Freelance yang dibina langsung oleh Staff Sales di berbagai wilayah.',
    output: 'Perluasan jangkauan promosi ke perumahan dan komunitas dengan skema bagi hasil 60% Affiliate / 40% Staff Sales.',
    governance: 'Pencatatan kepemilikan prospek yang adil, transparan, dan bebas tumpang tindih.',
  },
  {
    title: 'Tim Teknisi Lapangan Bersertifikat',
    scope: 'Tenaga teknisi terlatih untuk instalasi baru, survei lokasi, perawatan berkala, hingga perbaikan kendala layanan di rumah atau kantor pelanggan.',
    output: 'Pemasangan rapi, cepat, tepat waktu sesuai jadwal janji temu, dengan kepuasan pelanggan terjaga.',
    governance: 'Standar keselamatan kerja, pemeriksaan hasil kerja, dan berita acara digital.',
  },
  {
    title: 'Rekrutmen & Penempatan Terkelola',
    scope: 'Seleksi kandidat, verifikasi kelengkapan profil, serta penempatan tim sales maupun teknisi sesuai wilayah ekspansi bisnis mitra.',
    output: 'Tenaga kerja siap terjun ke lapangan dengan identitas resmi dan kontrak kerja sama yang jelas.',
    governance: 'Kepatuhan ketenagakerjaan, perjanjian kerja sama resmi, dan kesiapan operasional.',
  },
  {
    title: 'Pelatihan & Peningkatan Kapabilitas',
    scope: 'Program pembekalan pengenalan produk, teknik komunikasi penawaran, strategi pemasaran digital, hingga standar instalasi lapangan.',
    output: 'Tim lapangan yang kompeten, komunikatif, dan selalu siap menghadapi target pasar baru.',
    governance: 'Evaluasi pemahaman berkala dan sertifikasi kelayakan tugas.',
  },
  {
    title: 'Penjadwalan & Pengelolaan Area Kerja',
    scope: 'Pengaturan pembagian area pemasaran serta jadwal kunjungan lapangan agar tidak terjadi kekosongan layanan di wilayah prioritas.',
    output: 'Distribusi tim yang merata dan waktu respon lebih cepat di setiap titik permintaan pelanggan.',
    governance: 'Pemantauan kehadiran dan pencapaian target per area operasional.',
  },
  {
    title: 'Pemantauan Kinerja & Target Bisnis',
    scope: 'Pelaporan capaian penjualan, konversi prospek menjadi pelanggan aktif, serta tingkat ketepatan jadwal layanan di lapangan.',
    output: 'Ringkasan performa yang mudah dibaca oleh manajemen untuk pengambilan keputusan ekspansi.',
    governance: 'Indikator kinerja disepakati bersama sejak awal kontrak kerja sama.',
  },
  {
    title: 'Pengelolaan Komisi & Insentif Transparan',
    scope: 'Perhitungan otomatis bagi hasil Staff Sales, Affiliate Freelance, dan insentif Teknisi berdasarkan pelanggan yang resmi aktif.',
    output: 'Pembayaran komisi tepat waktu dengan rincian hasil kerja yang dapat dipantau langsung oleh tim.',
    governance: 'Aturan insentif resmi sesuai perjanjian kemitraan dan persetujuan keuangan.',
  },
  {
    title: 'Laporan Eksekutif Kemitraan',
    scope: 'Penyajian laporan pertumbuhan pelanggan, efektivitas kanal promosi, serta kualitas layanan untuk manajemen perusahaan mitra.',
    output: 'Laporan siap pakai untuk evaluasi bulanan dan perencanaan target kuartal berikutnya.',
    governance: 'Akses khusus per perusahaan mitra dengan kerahasiaan data bisnis terjamin.',
  },
];

export const AI_WORKFORCE_CATALOGUE = [
  {
    title: 'AI Digital Marketing & Campaign Support',
    scope: 'Membantu Staff Sales dan Affiliate merancang ide kampanye promosi area perumahan, promo musiman, serta pesan penawaran yang menarik.',
    output: 'Paket materi promosi siap pakai yang disesuaikan dengan promo terbaru perusahaan mitra.',
    governance: 'Selalu mengikuti panduan merek dan persetujuan tim pemasaran mitra.',
  },
  {
    title: 'AI Generate Content & Social Media',
    scope: 'Membantu Staff Sales dan Affiliate membuat caption media sosial (Instagram, TikTok, Facebook, WhatsApp), naskah video pendek, dan materi brosur digital.',
    output: 'Konten promosi harian yang konsisten untuk menjangkau lebih banyak calon pelanggan online.',
    governance: 'Materi tersaring agar tetap akurat, sopan, dan sesuai penawaran resmi.',
  },
  {
    title: 'AI Pencari & Penyaring Leads',
    scope: 'Mendukung Staff Sales dan Affiliate dalam menjaring prospek dari kanal digital, merespons pertanyaan awal 24/7, dan memilah calon pelanggan paling siap closing.',
    output: 'Daftar prospek hangat lengkap dengan minat paket dan lokasi siap ditindaklanjuti.',
    governance: 'Distribusi prospek adil dan terhubung langsung ke Staff Sales atau Affiliate.',
  },
  {
    title: 'AI Asisten Penawaran & Follow-Up Sales',
    scope: 'Menyiapkan draf pesan follow-up WhatsApp, perbandingan paket layanan, dan jawaban atas pertanyaan umum calon pelanggan bagi Staff Sales & Affiliate.',
    output: 'Komunikasi penjualan lebih cepat, persuasif, dan meningkatkan rasio closing order.',
    governance: 'Keputusan penawaran dan pengiriman pesan tetap berada di kendali Staff Sales.',
  },
  {
    title: 'AI Pendamping Rekrutmen Affiliate',
    scope: 'Membantu Staff Sales menjelaskan cara bergabung, manfaat bagi hasil, serta memandu proses pendaftaran mitra Affiliate baru.',
    output: 'Proses pendaftaran Affiliate lebih cepat sehingga jaringan pemasaran bertumbuh lebih luas.',
    governance: 'Persetujuan akhir keaktifan mitra tetap berada di tangan Staff Sales dan Supervisor.',
  },
  {
    title: 'AI Customer Care & Respon Pelanggan',
    scope: 'Menjawab pertanyaan informasi produk, promo, dan status pendaftaran pelanggan secara ramah dan responsif sepanjang hari.',
    output: 'Pengalaman pelanggan yang cepat tanggap sebelum diteruskan ke tim lapangan.',
    governance: 'Berbasis informasi produk resmi perusahaan mitra.',
  },
  {
    title: 'AI Koordinator Operasional Teknisi',
    scope: 'Khusus mendukung divisi teknis dalam mengatur prioritas antrean pekerjaan, rute kunjungan paling efisien, dan pengingat tenggat jadwal layanan.',
    output: 'Jadwal kerja teknisi tertata rapi dan risiko keterlambatan kunjungan berkurang drastis.',
    governance: 'Koordinator lapangan tetap memegang kendali penuh atas perubahan jadwal mendadak.',
  },
  {
    title: 'AI Asisten Teknis & Panduan Lapangan',
    scope: 'Membantu teknisi saat bertugas dengan referensi cepat langkah pemasangan, pengecekan kualitas sinyal/perangkat, dan solusi kendala teknis di lokasi.',
    output: 'Penanganan kendala di rumah pelanggan lebih cepat dan tepat sasaran pada kunjungan pertama.',
    governance: 'Mengacu khusus pada buku panduan operasional resmi perusahaan mitra.',
  },
  {
    title: 'AI Analis Pertumbuhan Bisnis',
    scope: 'Merangkum tren penjualan wilayah, efektivitas konten pemasaran, serta performa tim menjadi ringkasan bisnis yang mudah dipahami pimpinan.',
    output: 'Rekomendasi area potensial untuk fokus promosi dan penambahan kapasitas tim.',
    governance: 'Laporan disajikan secara terukur khusus untuk manajemen perusahaan mitra.',
  },
  {
    title: 'AI Asisten Administrasi & Rekap Kemitraan',
    scope: 'Membantu menyusun draf rekap tagihan bulanan, laporan pencapaian target kerja sama, dan ringkasan aktivitas tim.',
    output: 'Administrasi kemitraan lebih rapi sehingga manajemen bisa fokus pada ekspansi bisnis.',
    governance: 'Validasi angka dan persetujuan pembayaran tetap dilakukan tim keuangan berwenang.',
  },
];

export const PARTNERSHIP_STEPS = [
  { step: '01', title: 'Pengajuan Kerja Sama', desc: 'Sampaikan kebutuhan area, target pertumbuhan pelanggan, dan komposisi tim melalui formulir kemitraan.' },
  { step: '02', title: 'Kualifikasi Kebutuhan', desc: 'Tim bisnis Agentzy meninjau profil industri, cakupan wilayah, dan kesiapan target operasional Anda.' },
  { step: '03', title: 'Sesi Diskusi Bisnis', desc: 'Pertemuan untuk memetakan alur kerja, target penjualan, standar layanan pelanggan, dan skema insentif.' },
  { step: '04', title: 'Proposal & Rancangan Tim', desc: 'Penyusunan rekomendasi jumlah Staff Sales, jaringan Affiliate, Teknisi, dan dukungan AI yang paling efisien.' },
  { step: '05', title: 'Penyelarasan Komersial & Legal', desc: 'Pembahasan perjanjian kerja sama, struktur biaya yang transparan, dan target layanan bersama.' },
  { step: '06', title: 'Penandatanganan Kontrak', desc: 'Kesepakatan resmi kerja sama (MSA & SOW) beserta jadwal mulai beroperasinya tim di lapangan.' },
  { step: '07', title: 'Persiapan Mitra & Produk', desc: 'Penyesuaian materi promosi, katalog paket layanan, dan pembekalan standar kerja sama bagi tim.' },
  { step: '08', title: 'Peluncuran Operasional', desc: 'Tim Staff Sales, Affiliate, Teknisi, dan dukungan AI mulai aktif memasarkan dan melayani pelanggan Anda.' },
  { step: '09', title: 'Evaluasi & Ekspansi Berkala', desc: 'Tinjauan hasil penjualan, kepuasan pelanggan, dan perluasan ke wilayah bisnis baru bersama-sama.' },
];

export const LANDING_FAQS = [
  {
    q: 'Apa keuntungan utama bermitra dengan Agentzy bagi perusahaan atau ISP?',
    a: 'Perusahaan Anda tidak perlu repot membangun tim sales, jaringan affiliate, dan teknisi dari nol. Agentzy menyediakan tenaga kerja profesional beserta dukungan asisten AI sehingga akuisisi pelanggan meningkat, pemasangan lebih cepat, dan seluruh hasil kerja terpantau transparan dalam satu portal.',
  },
  {
    q: 'Bagaimana AI berkolaborasi dengan Staff Sales dan Affiliate di Agentzy?',
    a: 'AI bertugas menjadi asisten pemasaran dan penjualan bagi Staff Sales dan Affiliate — mulai dari membuat ide kampanye digital marketing, menyusun konten promosi dan caption media sosial, menjaring serta menyaring calon pelanggan (leads), hingga menyiapkan bahan follow-up agar closing lebih cepat.',
  },
  {
    q: 'Bagaimana dukungan AI untuk tim Teknisi Lapangan?',
    a: 'Berbeda dengan tim penjualan, dukungan AI untuk Teknisi fokus penuh pada kelancaran operasional dan teknis: membantu pengaturan rute dan jadwal kunjungan paling efisien, menjaga ketepatan waktu layanan pelanggan, serta menyediakan panduan cepat penanganan teknis saat berada di lokasi.',
  },
  {
    q: 'Apa perbedaan peran Staff Sales, Affiliate Freelance, dan Teknisi?',
    a: 'Staff Sales adalah tenaga penjualan resmi yang melakukan penjualan langsung sekaligus membina jaringan mitra. Affiliate Freelance adalah mitra lepas yang membantu memperluas jangkauan promosi dengan bagi hasil 60% Affiliate dan 40% Staff Sales. Teknisi adalah tim lapangan yang menangani survei, pemasangan, dan perawatan layanan pelanggan.',
  },
  {
    q: 'Apakah kerja sama ini hanya untuk perusahaan ISP dan telekomunikasi?',
    a: 'Industri ISP dan telekomunikasi (seperti layanan internet rumah dan bisnis) merupakan fokus utama kami saat ini, namun model tim sales, affiliate, teknisi, dan dukungan pemasaran AI dari Agentzy juga siap diadaptasi untuk sektor ritel, properti, distribusi, maupun jasa layanan lapangan lainnya.',
  },
  {
    q: 'Bagaimana transparansi target dan bagi hasil dalam kemitraan?',
    a: 'Seluruh target penjualan, status pemasangan pelanggan, hingga rincian komisi dan tagihan layanan dipisahkan secara jelas antara pendapatan perusahaan mitra, biaya layanan Agentzy, dan insentif tim. Perusahaan dapat memantau seluruh progres secara langsung melalui Corporate Partner Portal.',
  },
  {
    q: 'Apakah perusahaan kami bisa menyesuaikan skala tim sesuai pertumbuhan bisnis?',
    a: 'Tentu. Anda dapat memulai dari satu wilayah atau kota prioritas terlebih dahulu, lalu menambah kapasitas Staff Sales, jaringan Affiliate, maupun Teknisi Lapangan secara bertahap seiring ekspansi area layanan Anda.',
  },
  {
    q: 'Bagaimana cara memulai kerja sama atau menjadwalkan diskusi dengan tim Agentzy?',
    a: 'Anda cukup menekan tombol "Ajukan Kerja Sama" di halaman ini untuk mengisi kebutuhan singkat perusahaan, atau langsung menjadwalkan sesi diskusi bisnis online bersama tim kemitraan kami.',
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
    id: 'WO-872344',
    type: 'Survey',
    customerName: 'Cluster Kemang Timur Residence',
    customerPhone: '0813 8801 4455',
    address: 'Jl. Kemang Timur No. 45, Jakarta Selatan',
    productPackage: 'Survey ODP & FTTH Area',
    priority: 'Normal',
    status: 'Pending',
    slaRemaining: '± 3 jam (sisa 2 jam 15 mnt)',
    distanceKm: '1,9',
    etaMinutes: 7,
    coordinates: { lat: -6.2768, lng: 106.8184 },
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
  {
    id: 'WO-872298',
    type: 'Survey',
    customerName: 'Kompleks Pondok Indah Blok D',
    customerPhone: '0812 9900 1122',
    address: 'Jl. Metro Pondok Indah No. 14, Jakarta Selatan',
    productPackage: 'Survey Jalur Fiber & Tiang',
    priority: 'Normal',
    status: 'Selesai',
    slaRemaining: 'Tepat Waktu',
    distanceKm: '3,4',
    etaMinutes: 12,
    coordinates: { lat: -6.2831, lng: 106.7832 },
    durationText: '45 menit',
    completedDate: '18 Jan 2025',
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
