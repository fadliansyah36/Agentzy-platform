'use client';

import React, { useState } from 'react';
import {
  X,
  Coins,
  FileSpreadsheet,
  UserPlus,
  FileSignature,
  MapPin,
  Bot,
  ShieldCheck,
  CheckCircle2,
  Download,
  CreditCard,
  KeyRound,
  Plug,
  Bell,
} from 'lucide-react';
import { TechnicianNavigationMap } from '@/components/maps/TechnicianNavigationMap';
import {
  COMMISSION_CALCULATION_SAMPLES,
  CORPORATE_ROLE_OPTIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_INTEGRATIONS,
  formatIDR,
  formatNumberID,
} from '../../lib/corporate-data';
import type {
  AICreditTransaction,
  AIWorkerRecord,
  AnalyticsFilterState,
  CorporateInvoice,
  CorporateRoleKey,
  CorporateSectionId,
  CorporateTenant,
  CorporateWorkOrder,
} from '../../lib/corporate-types';
import type { CorporateModalState } from '../../hooks/useCorporatePortal';

function ModalContainer({
  title,
  subtitle,
  onClose,
  maxWidth = 'max-w-lg',
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  maxWidth?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B3A]/55 p-4 backdrop-blur-xs"
    >
      <div
        className={`w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-[16px] border border-[#D8E3E9] bg-white p-5 sm:p-6 shadow-xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#EAF2F6] pb-3.5">
          <div>
            <h3 className="text-base font-bold text-[#17324D]">{title}</h3>
            {subtitle && (
              <p className="mt-0.5 text-xs text-[#526675]">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] text-[#526675] hover:bg-[#EAF2F6]"
            aria-label="Tutup Modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export function CorporateModals({
  modal,
  tenant,
  aiWorkers,
  aiCreditsBalance,
  monthlyBudgetLimit,
  autoTopupEnabled,
  creditTransactions,
  workOrders,
  invoices,
  analyticsFilter,
  onClose,
  onNavigate,
  onSetModal,
  onUpdateAnalyticsFilter,
  onToggleAIWorkerStatus,
  onTopUpCredits,
  onSaveBudgetSettings,
  onPayInvoice,
  onInviteUser,
  onApproveWorkOrderQC,
  onGenerateReport,
  onShowToast,
}: {
  modal: CorporateModalState;
  tenant: CorporateTenant;
  aiWorkers: AIWorkerRecord[];
  aiCreditsBalance: number;
  monthlyBudgetLimit: number;
  autoTopupEnabled: boolean;
  creditTransactions: AICreditTransaction[];
  workOrders: CorporateWorkOrder[];
  invoices: CorporateInvoice[];
  analyticsFilter: AnalyticsFilterState;
  onClose: () => void;
  onNavigate: (section: CorporateSectionId) => void;
  onSetModal: (m: CorporateModalState) => void;
  onUpdateAnalyticsFilter: (next: AnalyticsFilterState) => void;
  onToggleAIWorkerStatus: (workerId: string) => void;
  onTopUpCredits: (amount: number, method: string) => void;
  onSaveBudgetSettings: (limit: number, autoTopup: boolean) => void;
  onPayInvoice: (invoiceId: string, method: string) => void;
  onInviteUser: (payload: {
    name: string;
    email: string;
    roleKey: CorporateRoleKey;
    department: string;
    branchScope: string;
  }) => void;
  onApproveWorkOrderQC: (workOrderId: string) => void;
  onGenerateReport: (payload: {
    category: string;
    period: string;
    format: 'CSV' | 'PDF' | 'XLSX';
  }) => void;
  onShowToast: (msg: string) => void;
}) {
  // Local form states for modals
  const [filterDraft, setFilterDraft] = useState<AnalyticsFilterState>(analyticsFilter);
  const [topupAmount, setTopupAmount] = useState(250000);
  const [topupMethod, setTopupMethod] = useState('Virtual Account BCA Enterprise');
  const [budgetDraft, setBudgetDraft] = useState(monthlyBudgetLimit);
  const [autoTopupDraft, setAutoTopupDraft] = useState(autoTopupEnabled);
  const [paymentMethod, setPaymentMethod] = useState('Virtual Account BCA Enterprise');
  const [reportPeriod, setReportPeriod] = useState('Nov 2026');
  const [reportFormat, setReportFormat] = useState<'CSV' | 'XLSX' | 'PDF'>('CSV');
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<CorporateRoleKey>('corporate_operations_manager');
  const [inviteDept, setInviteDept] = useState('Operasional Teknis');
  const [inviteBranch, setInviteBranch] = useState('Regional Jabodetabek');
  const [selectedMapWoId, setSelectedMapWoId] = useState<string>(
    workOrders[0]?.id ?? 'WO-872341'
  );
  const [amendmentNote, setAmendmentNote] = useState(
    'Penambahan kuota 200 Human Workforce dan 10 AI Worker untuk ekspansi area Jawa Barat.'
  );

  if (modal.type === 'none') return null;

  // 1. Quick Action Modal (+ FAB)
  if (modal.type === 'quick-action') {
    return (
      <ModalContainer
        title="Aksi Cepat Corporate"
        subtitle={`Tenant aktif: ${tenant.name} (${tenant.code})`}
        onClose={onClose}
      >
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onSetModal({ type: 'ai-credits-topup' })}
            className="flex items-center gap-3 rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-3.5 text-left hover:border-[#0284C7] hover:bg-[#E6F4F9]"
          >
            <Coins className="h-5 w-5 text-[#0284C7]" />
            <div>
              <p className="text-xs font-bold text-[#17324D]">Top Up AI Credits</p>
              <p className="text-[11px] text-[#526675]">Tambah saldo wallet tenant</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              onSetModal({ type: 'report-export', category: 'Penjualan & Aktivasi' })
            }
            className="flex items-center gap-3 rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-3.5 text-left hover:border-[#0284C7] hover:bg-[#E6F4F9]"
          >
            <FileSpreadsheet className="h-5 w-5 text-[#0284C7]" />
            <div>
              <p className="text-xs font-bold text-[#17324D]">Ekspor Laporan</p>
              <p className="text-[11px] text-[#526675]">Unduh CSV / XLSX / PDF</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSetModal({ type: 'invite-user' })}
            className="flex items-center gap-3 rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-3.5 text-left hover:border-[#0284C7] hover:bg-[#E6F4F9]"
          >
            <UserPlus className="h-5 w-5 text-[#0284C7]" />
            <div>
              <p className="text-xs font-bold text-[#17324D]">Undang Pengguna</p>
              <p className="text-[11px] text-[#526675]">Tambah akses RBAC tim</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              onSetModal({ type: 'contract-document', docKind: 'amendment' })
            }
            className="flex items-center gap-3 rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-3.5 text-left hover:border-[#0284C7] hover:bg-[#E6F4F9]"
          >
            <FileSignature className="h-5 w-5 text-[#0284C7]" />
            <div>
              <p className="text-xs font-bold text-[#17324D]">Amandemen SOW</p>
              <p className="text-[11px] text-[#526675]">Perubahan kuota kontrak</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSetModal({ type: 'work-order-map' })}
            className="flex items-center gap-3 rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-3.5 text-left hover:border-[#0284C7] hover:bg-[#E6F4F9] sm:col-span-2"
          >
            <MapPin className="h-5 w-5 text-[#0284C7]" />
            <div>
              <p className="text-xs font-bold text-[#17324D]">
                Peta Sebaran Work Order Lapangan
              </p>
              <p className="text-[11px] text-[#526675]">
                Pantau lokasi teknisi FTTH dan SLA aktif secara geografis
              </p>
            </div>
          </button>
        </div>
      </ModalContainer>
    );
  }

  // 2. Analytics Filter Modal
  if (modal.type === 'analytics-filter') {
    return (
      <ModalContainer
        title="Filter Analitik Enterprise"
        subtitle="Saring metrik berdasarkan periode, provider, wilayah, departemen, dan produk"
        onClose={onClose}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onUpdateAnalyticsFilter(filterDraft);
            onClose();
            onShowToast('Filter Business Analytics diterapkan.');
          }}
          className="space-y-3.5"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#172B3A]">
                Periode
              </label>
              <select
                value={filterDraft.period}
                onChange={(e) =>
                  setFilterDraft((p) => ({ ...p, period: e.target.value }))
                }
                className="h-10 w-full rounded-[10px] border border-[#D8E3E9] px-3 text-xs font-medium"
              >
                <option value="Jan 2026 – Jun 2026">Jan 2026 – Jun 2026</option>
                <option value="Jul 2026 – Nov 2026">Jul 2026 – Nov 2026</option>
                <option value="Tahun Berjalan 2026">Tahun Berjalan 2026</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#172B3A]">
                Wilayah / Region
              </label>
              <select
                value={filterDraft.region}
                onChange={(e) =>
                  setFilterDraft((p) => ({ ...p, region: e.target.value }))
                }
                className="h-10 w-full rounded-[10px] border border-[#D8E3E9] px-3 text-xs font-medium"
              >
                <option value="Semua Wilayah">Semua Wilayah</option>
                <option value="Jabodetabek">Jabodetabek</option>
                <option value="Jawa Barat">Jawa Barat</option>
                <option value="Jawa Timur">Jawa Timur</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#172B3A]">
                Produk Layanan
              </label>
              <select
                value={filterDraft.product}
                onChange={(e) =>
                  setFilterDraft((p) => ({ ...p, product: e.target.value }))
                }
                className="h-10 w-full rounded-[10px] border border-[#D8E3E9] px-3 text-xs font-medium"
              >
                <option value="FTTH, FWA, PXGY">FTTH, FWA, PXGY</option>
                <option value="FTTH Only">FTTH Only</option>
                <option value="FWA Only">FWA Only</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#172B3A]">
                Kanal Akuisisi
              </label>
              <select
                value={filterDraft.channel}
                onChange={(e) =>
                  setFilterDraft((p) => ({ ...p, channel: e.target.value }))
                }
                className="h-10 w-full rounded-[10px] border border-[#D8E3E9] px-3 text-xs font-medium"
              >
                <option value="Staff Sales & Affiliate">Staff Sales &amp; Affiliate</option>
                <option value="Staff Sales Only">Staff Sales Only</option>
                <option value="Affiliate Network Only">Affiliate Network Only</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-[10px] border border-[#D8E3E9] px-4 text-xs font-semibold text-[#526675]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="h-10 rounded-[10px] bg-[#0284C7] px-5 text-xs font-semibold text-white hover:bg-[#0369A1]"
            >
              Terapkan Filter
            </button>
          </div>
        </form>
      </ModalContainer>
    );
  }

  // 3. AI Worker Detail Modal
  if (modal.type === 'ai-worker-detail') {
    const worker = aiWorkers.find((w) => w.id === modal.workerId);
    if (!worker) return null;
    return (
      <ModalContainer
        title={worker.name}
        subtitle={`${worker.role} · ${worker.department}`}
        onClose={onClose}
      >
        <div className="space-y-4 text-xs">
          <div className="rounded-[12px] bg-[#F5F8FA] p-3.5">
            <p className="font-bold text-[#17324D]">Job Description</p>
            <p className="mt-1 leading-relaxed text-[#526675]">
              {worker.jobDescription}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[10px] border border-[#D8E3E9] p-3">
              <p className="text-[#718391]">Supervisor Manusia</p>
              <p className="mt-0.5 font-bold text-[#17324D]">{worker.supervisor}</p>
            </div>
            <div className="rounded-[10px] border border-[#D8E3E9] p-3">
              <p className="text-[#718391]">Autonomy &amp; Model Policy</p>
              <p className="mt-0.5 font-bold text-[#0284C7]">
                {worker.autonomyLevel} · {worker.modelPolicy}
              </p>
            </div>
          </div>

          <div>
            <p className="font-bold text-[#17324D]">Allowed Tools (Backend Enforced)</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {worker.allowedTools.map((t) => (
                <span
                  key={t}
                  className="rounded-[6px] border border-[#D8E3E9] bg-[#F5F8FA] px-2.5 py-1 font-mono-tabular text-[11px] text-[#172B3A]"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[#EAF2F6] pt-3">
            <span className="font-mono-tabular font-semibold text-[#17324D]">
              Terpakai: {formatNumberID(worker.creditsUsed)} /{' '}
              {formatNumberID(worker.monthlyBudgetCredits)} Credits
            </span>
            <button
              type="button"
              onClick={() => {
                onToggleAIWorkerStatus(worker.id);
                onClose();
              }}
              className="rounded-[10px] bg-[#17324D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#245477]"
            >
              {worker.status === 'Aktif & Berjalan'
                ? 'Pause AI Worker'
                : 'Aktifkan AI Worker'}
            </button>
          </div>
        </div>
      </ModalContainer>
    );
  }

  // 4. AI Credits Top-Up Modal
  if (modal.type === 'ai-credits-topup') {
    const idrRate = 300;
    const totalPrice = topupAmount * idrRate;
    return (
      <ModalContainer
        title="Top Up AI Credits"
        subtitle={`Saldo saat ini: ${formatNumberID(aiCreditsBalance)} AI Credits · Pricing v4`}
        onClose={onClose}
      >
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold text-[#172B3A]">
              Pilih Paket Penambahan Credits
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {[100000, 250000, 500000, 1000000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTopupAmount(amt)}
                  className={`rounded-[10px] border p-3 text-left transition ${
                    topupAmount === amt
                      ? 'border-[#0284C7] bg-[#E6F4F9]'
                      : 'border-[#D8E3E9] bg-white hover:bg-[#F5F8FA]'
                  }`}
                >
                  <p className="font-mono-tabular text-sm font-bold text-[#17324D]">
                    {formatNumberID(amt)} Credits
                  </p>
                  <p className="font-mono-tabular text-[11px] text-[#526675]">
                    {formatIDR(amt * idrRate)}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#172B3A]">
              Metode Pembayaran Terotorisasi
            </label>
            <select
              value={topupMethod}
              onChange={(e) => setTopupMethod(e.target.value)}
              className="h-11 w-full rounded-[10px] border border-[#D8E3E9] px-3 text-xs font-medium"
            >
              <option value="Virtual Account BCA Enterprise">
                Virtual Account BCA Enterprise
              </option>
              <option value="Transfer Bank Mandiri (RTGS)">
                Transfer Bank Mandiri (RTGS)
              </option>
              <option value="Corporate Billing Invoice (NET 14)">
                Corporate Billing Invoice (NET 14)
              </option>
            </select>
          </div>

          <div className="rounded-[12px] bg-[#F5F8FA] p-3.5 text-xs">
            <div className="flex justify-between">
              <span className="text-[#526675]">Total Penambahan</span>
              <span className="font-mono-tabular font-bold text-[#17324D]">
                +{formatNumberID(topupAmount)} Credits
              </span>
            </div>
            <div className="mt-1.5 flex justify-between">
              <span className="text-[#526675]">Nominal Tagihan (Pricing v4)</span>
              <span className="font-mono-tabular font-bold text-[#0284C7]">
                {formatIDR(totalPrice)}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-[10px] border border-[#D8E3E9] px-4 text-xs font-semibold text-[#526675]"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => onTopUpCredits(topupAmount, topupMethod)}
              className="h-10 rounded-[10px] bg-[#0284C7] px-5 text-xs font-semibold text-white hover:bg-[#0369A1]"
            >
              Konfirmasi Top Up
            </button>
          </div>
        </div>
      </ModalContainer>
    );
  }

  // 5. AI Credits History Modal
  if (modal.type === 'ai-credits-history') {
    return (
      <ModalContainer
        title="Riwayat Ledger AI Credits"
        subtitle="Catatan transaksi immutable (Top Up, Pemakaian Run, & Reservasi Dilepas)"
        onClose={onClose}
        maxWidth="max-w-2xl"
      >
        <div className="divide-y divide-[#EAF2F6]">
          {creditTransactions.map((tx) => (
            <div
              key={tx.id}
              className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-xs font-bold text-[#17324D]">
                  {tx.type} · {tx.description}
                </p>
                <p className="text-[11px] text-[#526675]">
                  {tx.timestamp} · {tx.workerOrActor} ·{' '}
                  <span className="font-mono-tabular">{tx.idempotencyKey}</span>
                </p>
              </div>
              <div className="text-left sm:text-right font-mono-tabular">
                <p
                  className={`text-xs font-bold ${
                    tx.creditsDelta >= 0 ? 'text-[#247A55]' : 'text-[#17324D]'
                  }`}
                >
                  {tx.creditsDelta >= 0 ? '+' : ''}
                  {formatNumberID(tx.creditsDelta)}
                </p>
                <p className="text-[11px] text-[#718391]">
                  Saldo: {formatNumberID(tx.balanceAfter)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ModalContainer>
    );
  }

  // 6. AI Credits Budget Settings Modal
  if (modal.type === 'ai-credits-budget') {
    return (
      <ModalContainer
        title="Pengaturan Budget & Auto Top-Up"
        subtitle="Atur hard limit bulanan dan persetujuan pengisian otomatis"
        onClose={onClose}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="mb-1.5 block font-semibold text-[#172B3A]">
              Batas Maksimal Bulanan Tenant (AI Credits)
            </label>
            <input
              type="number"
              value={budgetDraft}
              onChange={(e) => setBudgetDraft(Number(e.target.value) || 0)}
              className="h-11 w-full rounded-[10px] border border-[#D8E3E9] px-3 font-mono-tabular text-sm font-bold"
            />
          </div>

          <label className="flex items-start gap-3 rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-3.5 cursor-pointer">
            <input
              type="checkbox"
              checked={autoTopupDraft}
              onChange={(e) => setAutoTopupDraft(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#0284C7]"
            />
            <div>
              <p className="font-bold text-[#17324D]">
                Aktifkan Auto Top-Up dengan Cap (Persetujuan Eksplisit)
              </p>
              <p className="mt-0.5 text-[#526675]">
                Otomatis isi ulang 250.000 Credits saat saldo di bawah 100.000, maksimal 2x per bulan.
              </p>
            </div>
          </label>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-[10px] border border-[#D8E3E9] px-4 font-semibold text-[#526675]"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                onSaveBudgetSettings(budgetDraft, autoTopupDraft);
                onClose();
                onShowToast('Kebijakan batas budget AI Credits disimpan.');
              }}
              className="h-10 rounded-[10px] bg-[#17324D] px-5 font-semibold text-white hover:bg-[#245477]"
            >
              Simpan Kebijakan
            </button>
          </div>
        </div>
      </ModalContainer>
    );
  }

  // 7. Contract Document / Amendment Modal
  if (modal.type === 'contract-document') {
    const isAmendment = modal.docKind === 'amendment';
    return (
      <ModalContainer
        title={
          isAmendment
            ? 'Pengajuan Perpanjangan & Amandemen Kontrak'
            : modal.docKind === 'msa'
              ? 'Master Service Agreement (MSA-2026-ISP01)'
              : modal.docKind === 'sow'
                ? 'Statement of Work (SOW v2.0)'
                : 'Lampiran SLA & KPI Operasional'
        }
        subtitle={`PT ${tenant.name} × Agentzy · Efektif 1 Jan 2026 – 31 Des 2026`}
        onClose={onClose}
      >
        {isAmendment ? (
          <div className="space-y-4 text-xs">
            <p className="text-[#526675]">
              Pengajuan ini akan membuat draf amandemen resmi menuju review legal &amp; komersial Agentzy.
            </p>
            <div>
              <label className="mb-1.5 block font-semibold text-[#172B3A]">
                Rincian Perubahan Ruang Lingkup / Kuota
              </label>
              <textarea
                rows={4}
                value={amendmentNote}
                onChange={(e) => setAmendmentNote(e.target.value)}
                className="w-full rounded-[10px] border border-[#D8E3E9] p-3 text-xs text-[#172B3A] outline-none focus:border-[#0284C7]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-10 rounded-[10px] border border-[#D8E3E9] px-4 font-semibold text-[#526675]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onShowToast('Permintaan amandemen kontrak dikirim ke tim Legal Agentzy.');
                }}
                className="h-10 rounded-[10px] bg-[#0284C7] px-5 font-semibold text-white hover:bg-[#0369A1]"
              >
                Kirim Pengajuan
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-xs leading-relaxed text-[#526675]">
            <div className="rounded-[12px] bg-[#F5F8FA] p-4">
              <p className="font-bold text-[#17324D]">Status Tanda Tangan &amp; Hash Dokumen</p>
              <p className="mt-1">Ditandatangani secara elektronik pada 12 Des 2025 · Versi 2.0 (Aktif)</p>
              <p className="font-mono-tabular mt-1 text-[11px] text-[#718391]">
                SHA256: 9f84b2...a182e7 · Private Bucket Signed Access
              </p>
            </div>
            <p>
              Dokumen mencakup pemisahan tegas antara biaya lisensi SaaS Platform, biaya Managed Services Human Workforce, dan kuota pemakaian AI Credits beserta perlindungan data sesuai UU PDP.
            </p>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onShowToast('Dokumen kontrak resmi diunduh melalui tautan bertanda tangan.');
                }}
                className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-[#17324D] px-4 font-semibold text-white hover:bg-[#245477]"
              >
                <Download className="h-4 w-4" />
                <span>Unduh Salinan PDF</span>
              </button>
            </div>
          </div>
        )}
      </ModalContainer>
    );
  }

  // 8. Invoice Detail & Payment Modal
  if (modal.type === 'invoice-detail') {
    const invoice = invoices.find((i) => i.id === modal.invoiceId);
    if (!invoice) return null;
    const isPaid = invoice.status === 'Lunas';

    return (
      <ModalContainer
        title={`Faktur ${invoice.id}`}
        subtitle={`${invoice.title} · Periode ${invoice.periodLabel}`}
        onClose={onClose}
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between rounded-[12px] bg-[#F5F8FA] p-3.5">
            <div>
              <p className="text-[#526675]">Status Pembayaran</p>
              <p
                className={`mt-0.5 text-sm font-bold ${
                  isPaid ? 'text-[#247A55]' : 'text-[#A96816]'
                }`}
              >
                {invoice.status}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[#526675]">Total Tagihan</p>
              <p className="font-mono-tabular mt-0.5 text-lg font-bold text-[#17324D]">
                {formatIDR(invoice.amount)}
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2 font-bold text-[#17324D]">Rincian Komponen Tagihan</p>
            <div className="divide-y divide-[#EAF2F6] rounded-[12px] border border-[#D8E3E9] px-3.5">
              {invoice.lineItems.map((li) => (
                <div key={li.label} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="font-semibold text-[#172B3A]">{li.label}</p>
                    <p className="text-[11px] text-[#718391]">{li.category}</p>
                  </div>
                  <span className="font-mono-tabular font-bold text-[#17324D]">
                    {formatIDR(li.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {!isPaid && (
            <div>
              <label className="mb-1.5 block font-semibold text-[#172B3A]">
                Pilih Kanal Pembayaran
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="h-10 w-full rounded-[10px] border border-[#D8E3E9] px-3 font-medium"
              >
                <option value="Virtual Account BCA Enterprise">
                  Virtual Account BCA Enterprise
                </option>
                <option value="Transfer Bank Mandiri (RTGS)">
                  Transfer Bank Mandiri (RTGS)
                </option>
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onShowToast(`Faktur ${invoice.id} berhasil diunduh.`);
              }}
              className="inline-flex h-10 items-center gap-1.5 rounded-[10px] border border-[#D8E3E9] px-4 font-semibold text-[#17324D]"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Unduh Faktur</span>
            </button>

            {!isPaid && (
              <button
                type="button"
                onClick={() => onPayInvoice(invoice.id, paymentMethod)}
                className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#0284C7] px-5 font-semibold text-white hover:bg-[#0369A1]"
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span>Bayar Sekarang</span>
              </button>
            )}
          </div>
        </div>
      </ModalContainer>
    );
  }

  // 9. Payment Reconcile Modal
  if (modal.type === 'payment-reconcile') {
    const unpaid = invoices.filter((i) => i.status !== 'Lunas');
    const targetInv =
      unpaid.find((i) => i.id === modal.invoiceId) ?? unpaid[0];
    if (!targetInv) return null;

    return (
      <ModalContainer
        title="Konfirmasi & Rekonsiliasi Pembayaran"
        subtitle={`Faktur ${targetInv.id} · ${formatIDR(targetInv.amount)}`}
        onClose={onClose}
      >
        <div className="space-y-4 text-xs">
          <p className="text-[#526675]">
            Pembayaran akan dicocokkan otomatis dengan settlement bank dan mencatat jurnal ke ledger pembayaran.
          </p>
          <div>
            <label className="mb-1.5 block font-semibold text-[#172B3A]">
              Kanal Pembayaran
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="h-10 w-full rounded-[10px] border border-[#D8E3E9] px-3 font-medium"
            >
              <option value="Virtual Account BCA Enterprise">
                Virtual Account BCA Enterprise
              </option>
              <option value="Transfer Bank Mandiri (RTGS)">
                Transfer Bank Mandiri (RTGS)
              </option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-[10px] border border-[#D8E3E9] px-4 font-semibold text-[#526675]"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => onPayInvoice(targetInv.id, paymentMethod)}
              className="h-10 rounded-[10px] bg-[#247A55] px-5 font-semibold text-white"
            >
              Verifikasi &amp; Rekon
            </button>
          </div>
        </div>
      </ModalContainer>
    );
  }

  // 10. Report Export Modal
  if (modal.type === 'report-export') {
    return (
      <ModalContainer
        title={`Ekspor Laporan: ${modal.category}`}
        subtitle="Pilih periode dan format keluaran siap audit"
        onClose={onClose}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="mb-1.5 block font-semibold text-[#172B3A]">
              Periode Laporan
            </label>
            <select
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value)}
              className="h-10 w-full rounded-[10px] border border-[#D8E3E9] px-3 font-medium"
            >
              <option value="Nov 2026">November 2026</option>
              <option value="Okt 2026">Oktober 2026</option>
              <option value="Q3 2026">Kuartal III 2026</option>
              <option value="Jan – Jun 2026">Semester I 2026</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block font-semibold text-[#172B3A]">
              Format File
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['CSV', 'XLSX', 'PDF'] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setReportFormat(fmt)}
                  className={`h-10 rounded-[10px] border font-mono-tabular font-bold transition ${
                    reportFormat === fmt
                      ? 'border-[#0284C7] bg-[#E6F4F9] text-[#0284C7]'
                      : 'border-[#D8E3E9] bg-white text-[#526675]'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-[10px] border border-[#D8E3E9] px-4 font-semibold text-[#526675]"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() =>
                onGenerateReport({
                  category: modal.category,
                  period: reportPeriod,
                  format: reportFormat,
                })
              }
              className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#0284C7] px-5 font-semibold text-white hover:bg-[#0369A1]"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Generate &amp; Unduh</span>
            </button>
          </div>
        </div>
      </ModalContainer>
    );
  }

  // 11. Invite User RBAC Modal
  if (modal.type === 'invite-user') {
    return (
      <ModalContainer
        title="Undang Pengguna Corporate Baru"
        subtitle="Penetapan Role RBAC & cakupan cabang sesuai prinsip least-privilege"
        onClose={onClose}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!inviteName.trim() || !inviteEmail.trim()) return;
            onInviteUser({
              name: inviteName.trim(),
              email: inviteEmail.trim(),
              roleKey: inviteRole,
              department: inviteDept,
              branchScope: inviteBranch,
            });
          }}
          className="space-y-3.5 text-xs"
        >
          <div>
            <label className="mb-1 block font-semibold text-[#172B3A]">
              Nama Lengkap
            </label>
            <input
              type="text"
              required
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="Contoh: Nadia Kusuma"
              className="h-10 w-full rounded-[10px] border border-[#D8E3E9] px-3 outline-none focus:border-[#0284C7]"
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-[#172B3A]">
              Email Perusahaan
            </label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="nama@isp.co.id"
              className="h-10 w-full rounded-[10px] border border-[#D8E3E9] px-3 outline-none focus:border-[#0284C7]"
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-[#172B3A]">
              Role RBAC
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as CorporateRoleKey)}
              className="h-10 w-full rounded-[10px] border border-[#D8E3E9] px-3 font-medium"
            >
              {CORPORATE_ROLE_OPTIONS.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-semibold text-[#172B3A]">
                Departemen
              </label>
              <select
                value={inviteDept}
                onChange={(e) => setInviteDept(e.target.value)}
                className="h-10 w-full rounded-[10px] border border-[#D8E3E9] px-3"
              >
                <option value="Operasional Teknis">Operasional Teknis</option>
                <option value="Sales & Marketing">Sales &amp; Marketing</option>
                <option value="AI Operations">AI Operations</option>
                <option value="Keuangan">Keuangan</option>
                <option value="Audit & Kepatuhan">Audit &amp; Kepatuhan</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block font-semibold text-[#172B3A]">
                Cakupan Wilayah
              </label>
              <select
                value={inviteBranch}
                onChange={(e) => setInviteBranch(e.target.value)}
                className="h-10 w-full rounded-[10px] border border-[#D8E3E9] px-3"
              >
                <option value="ISP Nusantara (Pusat)">ISP Nusantara (Pusat)</option>
                <option value="Regional Jabodetabek">Regional Jabodetabek</option>
                <option value="Regional Jawa Barat">Regional Jawa Barat</option>
                <option value="Regional Jawa Tengah">Regional Jawa Tengah</option>
                <option value="Regional Jawa Timur">Regional Jawa Timur</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-[10px] border border-[#D8E3E9] px-4 font-semibold text-[#526675]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="h-10 rounded-[10px] bg-[#0284C7] px-5 font-semibold text-white hover:bg-[#0369A1]"
            >
              Kirim Undangan
            </button>
          </div>
        </form>
      </ModalContainer>
    );
  }

  // 12. Work Order Map Modal
  if (modal.type === 'work-order-map') {
    const activeWo =
      workOrders.find((w) => w.id === (modal.workOrderId || selectedMapWoId)) ??
      workOrders[0];

    return (
      <ModalContainer
        title="Peta Sebaran Pekerjaan & Teknisi"
        subtitle="Pantau rute penugasan FTTH/FWA dan status SLA per titik lokasi"
        onClose={onClose}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {workOrders.map((wo) => (
              <button
                key={wo.id}
                type="button"
                onClick={() => setSelectedMapWoId(wo.id)}
                className={`rounded-[8px] border px-3 py-1.5 text-xs font-semibold transition ${
                  activeWo?.id === wo.id
                    ? 'border-[#0284C7] bg-[#E6F4F9] text-[#0284C7]'
                    : 'border-[#D8E3E9] bg-[#F5F8FA] text-[#526675]'
                }`}
              >
                {wo.id} · {wo.region}
              </button>
            ))}
          </div>

          {activeWo && (
            <TechnicianNavigationMap
              origin={{ lat: -6.2801, lng: 106.7921 }}
              destination={activeWo.coordinates}
              destinationLabel={`${activeWo.id} · ${activeWo.customerName}`}
              destinationAddress={activeWo.address}
              estimatedDistanceKm="2,8"
              estimatedMinutes={11}
            />
          )}
        </div>
      </ModalContainer>
    );
  }

  // 13. Work Order Evidence & QC Modal
  if (modal.type === 'work-order-evidence') {
    const wo = workOrders.find((w) => w.id === modal.workOrderId);
    if (!wo) return null;
    return (
      <ModalContainer
        title={`Bukti Instalasi & QC · ${wo.id}`}
        subtitle={`${wo.customerName} · Teknisi: ${wo.technicianName}`}
        onClose={onClose}
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[10px] bg-[#F5F8FA] p-3.5">
              <p className="text-[#718391]">Redaman Optik (OPM)</p>
              <p className="mt-1 font-mono-tabular text-base font-bold text-[#247A55]">
                {wo.opticalDbm ?? '-18,4 dBm'}
              </p>
            </div>
            <div className="rounded-[10px] bg-[#F5F8FA] p-3.5">
              <p className="text-[#718391]">Hasil Speedtest</p>
              <p className="mt-1 font-mono-tabular text-base font-bold text-[#0284C7]">
                {wo.speedtestMbps ?? '104,2 Mbps'}
              </p>
            </div>
          </div>

          <div className="rounded-[12px] border border-[#D8E3E9] p-3.5 space-y-1.5">
            <p className="font-bold text-[#17324D]">Kelengkapan Artefak Bukti</p>
            <p className="text-[#247A55]">✓ Foto ODP &amp; Sambungan Patchcord Terunggah</p>
            <p className="text-[#247A55]">✓ Foto Lampu Indikator ONT Normal</p>
            <p className="text-[#247A55]">✓ Tanda Tangan Digital Berita Acara Pelanggan</p>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-[10px] border border-[#D8E3E9] px-4 font-semibold text-[#526675]"
            >
              Tutup
            </button>
            {wo.status !== 'Selesai' && (
              <button
                type="button"
                onClick={() => onApproveWorkOrderQC(wo.id)}
                className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#247A55] px-5 font-semibold text-white"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Setujui QC &amp; Tutup WO</span>
              </button>
            )}
          </div>
        </div>
      </ModalContainer>
    );
  }

  // 14A. Staff Sales Detail Modal
  if (modal.type === 'sales-staff-detail') {
    const combinedSA = modal.personalSA + modal.affiliateSA;
    const salesIncrementSA = Math.round(modal.affiliateSA * 0.4 * 10) / 10;
    const salesBasisTotal = Math.round((modal.personalSA + salesIncrementSA) * 10) / 10;
    return (
      <ModalContainer
        title={`Detail Staff Sales: ${modal.name}`}
        subtitle={`Grade ${modal.grade} · ${modal.region} · ${modal.activeAffiliates} Affiliate binaan aktif`}
        onClose={onClose}
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-[10px] bg-[#F5F8FA] p-3">
              <p className="text-[#718391]">SA Personal (100%)</p>
              <p className="mt-1 font-mono-tabular text-lg font-bold text-[#17324D]">
                {modal.personalSA} SA
              </p>
            </div>
            <div className="rounded-[10px] bg-[#E6F4F9] p-3">
              <p className="text-[#245477]">SA Affiliate (40%)</p>
              <p className="mt-1 font-mono-tabular text-lg font-bold text-[#0284C7]">
                +{salesIncrementSA} SA
              </p>
            </div>
            <div className="rounded-[10px] bg-[#EAF2F6] p-3">
              <p className="text-[#526675]">SA Gabungan (Tier)</p>
              <p className="mt-1 font-mono-tabular text-lg font-bold text-[#247A55]">
                {combinedSA} SA
              </p>
            </div>
          </div>

          <div className="rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-3.5 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[#526675]">Total Order Teraktivasi</span>
              <span className="font-mono-tabular font-bold text-[#17324D]">
                {formatNumberID(modal.orders)} Order
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#526675]">Basis Teratribusi Staff Sales (P + 40% ΔP)</span>
              <span className="font-mono-tabular font-bold text-[#17324D]">
                {salesBasisTotal} SA
              </span>
            </div>
          </div>

          <p className="text-[#526675]">
            Staff Sales memperoleh 100% produktivitas personal serta 40% porsi inkremental dari Affiliate yang direkrut, sedangkan penentuan Tier SA mengikuti SA Gabungan.
          </p>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-[10px] border border-[#D8E3E9] px-4 font-semibold text-[#526675]"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => onNavigate('commission')}
              className="h-10 rounded-[10px] bg-[#17324D] px-4 font-semibold text-white"
            >
              Lihat Ledger Komisi →
            </button>
          </div>
        </div>
      </ModalContainer>
    );
  }

  // 14B. Affiliate Detail Modal
  if (modal.type === 'affiliate-detail') {
    const cleanName = modal.name.replace(' (AFF)', '');
    const affiliateSA = Math.round(modal.orders * 0.6 * 10) / 10;
    const salesSA = Math.round(modal.orders * 0.4 * 10) / 10;
    return (
      <ModalContainer
        title={`Rincian Atribusi Affiliate: ${cleanName}`}
        subtitle={`Sponsor Staff Sales: ${modal.sponsorName ?? 'Andi Saputra'} · Skema 60% Affiliate / 40% Staff Sales`}
        onClose={onClose}
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-[10px] bg-[#F5F8FA] p-3">
              <p className="text-[#718391]">Order Teraktivasi</p>
              <p className="mt-1 font-mono-tabular text-lg font-bold text-[#17324D]">
                {modal.orders}
              </p>
            </div>
            <div className="rounded-[10px] bg-[#E6F4F9] p-3">
              <p className="text-[#245477]">Porsi Affiliate (60%)</p>
              <p className="mt-1 font-mono-tabular text-lg font-bold text-[#0284C7]">
                {affiliateSA} SA
              </p>
            </div>
            <div className="rounded-[10px] bg-[#EAF2F6] p-3">
              <p className="text-[#526675]">Porsi Staff Sales (40%)</p>
              <p className="mt-1 font-mono-tabular text-lg font-bold text-[#17324D]">
                {salesSA} SA
              </p>
            </div>
          </div>

          <div className="rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-3.5 space-y-1">
            <div className="flex justify-between">
              <span className="text-[#526675]">Wilayah Operasi</span>
              <span className="font-semibold text-[#17324D]">{modal.region ?? 'Jabodetabek'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#526675]">Tingkat Validitas Order</span>
              <span className="font-mono-tabular font-bold text-[#247A55]">
                {modal.validRate ?? '96,5%'}
              </span>
            </div>
          </div>

          <p className="text-[#526675]">
            Atribusi antara Affiliate Freelance dan Staff Sales perekrut dikunci saat order dikirim ke provider untuk mencegah duplikasi klaim dan menjaga audit trail.
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-[10px] border border-[#D8E3E9] px-4 font-semibold text-[#526675]"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => onNavigate('commission')}
              className="h-10 rounded-[10px] bg-[#17324D] px-4 font-semibold text-white"
            >
              Lihat Ledger Komisi →
            </button>
          </div>
        </div>
      </ModalContainer>
    );
  }

  // 15. KPI Formula Modal
  if (modal.type === 'kpi-formula') {
    return (
      <ModalContainer
        title="Definisi & Formula KPI Korporasi"
        subtitle="Standar kalkulasi terversi (KPI-ISP-v2.1) sesuai Master PRD Section 13"
        onClose={onClose}
      >
        <div className="space-y-3 text-xs">
          {[
            {
              key: 'Aktivasi Pelanggan (109%)',
              formula: '(Aktivasi Tervalidasi Provider / Target Kontrak Bulanan) × 100%',
              source: 'productivity_events & sales_orders',
            },
            {
              key: 'Kepatuhan SLA Work Order (98,6%)',
              formula: '(WO Selesai Tepat Waktu / Total WO Ditutup) × 100%',
              source: 'work_orders & work_order_events',
            },
            {
              key: 'Skor Kinerja Perusahaan (92,4 / 100)',
              formula: '0.40×Norm(Aktivasi) + 0.30×SLA + 0.30×FirstTimeFix',
              source: 'analytics_aggregates',
            },
          ].map((k) => (
            <div key={k.key} className="rounded-[12px] bg-[#F5F8FA] p-3.5">
              <p className="font-bold text-[#17324D]">{k.key}</p>
              <p className="font-mono-tabular mt-1 text-[#0284C7]">{k.formula}</p>
              <p className="mt-1 text-[11px] text-[#718391]">Sumber: {k.source}</p>
            </div>
          ))}
        </div>
      </ModalContainer>
    );
  }

  // 16. Commission Statement Audit Modal
  if (modal.type === 'commission-statement') {
    const calc =
      COMMISSION_CALCULATION_SAMPLES.find((c) => c.id === modal.calcId) ??
      COMMISSION_CALCULATION_SAMPLES[0];

    return (
      <ModalContainer
        title={`Audit Statement Komisi · ${calc.salesName}`}
        subtitle={`${calc.schemeVersion} · ${calc.tierLabel}`}
        onClose={onClose}
      >
        <div className="space-y-3 text-xs">
          <div className="rounded-[12px] bg-[#F5F8FA] p-3.5 space-y-1.5 font-mono-tabular">
            <div className="flex justify-between">
              <span className="text-[#526675]">P_personal (100%)</span>
              <span className="font-bold text-[#17324D]">{calc.personalSA} SA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#526675]">P_affiliate</span>
              <span className="font-bold text-[#17324D]">{calc.affiliateSA} SA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#526675]">P_combined (Dasar Tier)</span>
              <span className="font-bold text-[#0284C7]">{calc.combinedSA} SA</span>
            </div>
            <div className="flex justify-between border-t border-[#D8E3E9] pt-1.5">
              <span className="text-[#526675]">Share Affiliate (60%)</span>
              <span className="font-bold text-[#17324D]">{calc.affiliateShareSA} SA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#526675]">Basis Teratribusi Sales (P + 40%)</span>
              <span className="font-bold text-[#17324D]">
                {calc.salesAttributedTotalSA} SA
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-[12px] border border-[#247A55]/25 bg-[#F2FBF6] p-3.5">
            <span className="font-semibold text-[#17324D]">Estimasi Bruto Terhitung</span>
            <span className="font-mono-tabular text-base font-bold text-[#247A55]">
              {formatIDR(calc.grossAmount)}
            </span>
          </div>
        </div>
      </ModalContainer>
    );
  }

  // 17. Settings & Audit Modals
  if (modal.type === 'settings-modal') {
    const key = modal.key;

    if (key === 'integrations') {
      return (
        <ModalContainer
          title="Integrasi & Koneksi Enterprise"
          subtitle="Status konektor provider ISP, CRM, AI Gateway, dan webhook replay protection"
          onClose={onClose}
          maxWidth="max-w-2xl"
        >
          <div className="divide-y divide-[#EAF2F6] text-xs">
            {INITIAL_INTEGRATIONS.map((intg) => (
              <div
                key={intg.id}
                className="flex flex-col gap-1.5 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-2.5">
                  <Plug className="mt-0.5 h-4 w-4 text-[#0284C7]" />
                  <div>
                    <p className="font-bold text-[#17324D]">{intg.name}</p>
                    <p className="text-[#526675]">
                      {intg.authMethod} · {intg.endpointSummary}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <span className="font-bold text-[#247A55]">{intg.status}</span>
                  <p className="text-[11px] text-[#718391]">Sync: {intg.lastSync}</p>
                </div>
              </div>
            ))}
          </div>
        </ModalContainer>
      );
    }

    if (key === 'audit') {
      return (
        <ModalContainer
          title="Audit & Compliance View (UU PDP)"
          subtitle="Catatan aktivitas append-only terlingkup tenant dengan Request ID"
          onClose={onClose}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-2 rounded-[10px] bg-[#E6F4F9] p-3 text-[#17324D]">
              <ShieldCheck className="h-4 w-4 shrink-0 text-[#0284C7]" />
              <span>
                Seluruh log bersifat append-only, terisolasi oleh RLS tenant {tenant.code}, dan mematuhi retensi UU PDP.
              </span>
            </div>
            <div className="divide-y divide-[#EAF2F6]">
              {INITIAL_AUDIT_LOGS.map((log) => (
                <div key={log.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono-tabular font-bold text-[#0284C7]">
                      {log.action}
                    </span>
                    <span
                      className={`font-semibold ${
                        log.result === 'Allowed' ? 'text-[#247A55]' : 'text-[#A96816]'
                      }`}
                    >
                      {log.result}
                    </span>
                  </div>
                  <p className="mt-0.5 font-semibold text-[#17324D]">
                    {log.actor} ({log.role}) → {log.resource}
                  </p>
                  <p className="font-mono-tabular text-[11px] text-[#718391]">
                    {log.timestamp} · {log.requestId}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </ModalContainer>
      );
    }

    return (
      <ModalContainer
        title={
          key === 'profile'
            ? 'Profil Perusahaan'
            : key === 'notifications'
              ? 'Preferensi Notifikasi'
              : key === 'security'
                ? 'Keamanan Akun (MFA & SSO)'
                : key === 'api'
                  ? 'Manajemen API & Quota'
                  : 'Pengaturan Branding Tenant'
        }
        subtitle={`${tenant.legalName} (${tenant.code})`}
        onClose={onClose}
      >
        <div className="space-y-4 text-xs">
          {key === 'profile' && (
            <div className="space-y-2.5 rounded-[12px] bg-[#F5F8FA] p-4">
              <p><span className="font-bold text-[#17324D]">Nama Legal:</span> {tenant.legalName}</p>
              <p><span className="font-bold text-[#17324D]">Email Bisnis:</span> {tenant.primaryContactEmail}</p>
              <p><span className="font-bold text-[#17324D]">Industri:</span> {tenant.industry}</p>
              <p><span className="font-bold text-[#17324D]">Cakupan:</span> {tenant.region}</p>
            </div>
          )}

          {key === 'notifications' && (
            <div className="space-y-2.5">
              {[
                'Peringatan SLA Work Order melewati ambang batas',
                'Peringatan pemakaian AI Credits mencapai 80% budget',
                'Pengingat perpanjangan kontrak H-30 dan H-7',
              ].map((pref) => (
                <label
                  key={pref}
                  className="flex items-center gap-3 rounded-[10px] border border-[#D8E3E9] p-3"
                >
                  <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#0284C7]" />
                  <Bell className="h-4 w-4 text-[#0284C7]" />
                  <span className="font-medium text-[#17324D]">{pref}</span>
                </label>
              ))}
            </div>
          )}

          {key === 'security' && (
            <div className="space-y-2.5 rounded-[12px] bg-[#F5F8FA] p-4">
              <p className="font-bold text-[#247A55]">✓ Multi-Factor Authentication (MFA) Wajib Aktif</p>
              <p className="font-bold text-[#17324D]">✓ Enterprise SSO OIDC terhubung ke IdP Korporasi</p>
              <p className="text-[#526675]">Sesi aktif: 1 perangkat web terverifikasi (Jakarta, ID)</p>
            </div>
          )}

          {key === 'api' && (
            <div className="space-y-2.5 rounded-[12px] bg-[#F5F8FA] p-4">
              <div className="flex items-center gap-2 font-bold text-[#17324D]">
                <KeyRound className="h-4 w-4 text-[#0284C7]" />
                <span>Scoped API Key · Read Analytics &amp; Webhook</span>
              </div>
              <p className="font-mono-tabular text-[#526675]">
                Prefix: agz_live_isp001_••••••••••••92a1 (Aktif · Rate limit 600 req/min)
              </p>
            </div>
          )}

          {key === 'tenant' && (
            <div className="space-y-2.5 rounded-[12px] bg-[#F5F8FA] p-4">
              <p><span className="font-bold text-[#17324D]">Subdomain Portal:</span> corporate.agentzy.id/{tenant.code.toLowerCase()}</p>
              <p><span className="font-bold text-[#17324D]">Aksen Warna Merek:</span> #17324D &amp; #0284C7</p>
              <p><span className="font-bold text-[#17324D]">Zona Waktu &amp; Mata Uang:</span> Asia/Jakarta (WIB) · IDR</p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                onClose();
                onShowToast('Pengaturan Corporate Portal diperbarui.');
              }}
              className="h-10 rounded-[10px] bg-[#17324D] px-5 font-semibold text-white"
            >
              Simpan &amp; Tutup
            </button>
          </div>
        </div>
      </ModalContainer>
    );
  }

  return null;
}
