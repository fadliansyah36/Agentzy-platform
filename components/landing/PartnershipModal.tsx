'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, Building2, Video } from 'lucide-react';
import { useWorkspace } from '@/components/workspace/WorkspaceProvider';

interface PartnershipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HUMAN_NEEDS = [
  'Sales Resmi (AE)',
  'Jaringan Affiliate Freelance',
  'Teknisi Lapangan FTTH/FWA',
  'Rekrutmen & Onboarding',
  'Pelatihan & Sertifikasi',
];

const AI_NEEDS = [
  'AI Sales & Lead Qualification',
  'AI Affiliate Onboarding',
  'AI Marketing & Content',
  'AI Technical Knowledge',
  'AI Operations & Analytics',
];

const PROVIDER_PRODUCTS = ['FTTH', 'FWA', 'PXGY', 'Enterprise Connectivity'];

export function PartnershipModal({ isOpen, onClose }: PartnershipModalProps) {
  const { openScheduleMeetingModal } = useWorkspace();
  const [companyName, setCompanyName] = useState('');
  const [companyType, setCompanyType] = useState('ISP / Telekomunikasi');
  const [picName, setPicName] = useState('');
  const [picTitle, setPicTitle] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [locations, setLocations] = useState('Jabodetabek, Jawa Barat');
  const [estimatedWorkforce, setEstimatedWorkforce] = useState('50');
  const [humanNeeds, setHumanNeeds] = useState<string[]>([
    'Sales Resmi (AE)',
    'Teknisi Lapangan FTTH/FWA',
  ]);
  const [aiNeeds, setAiNeeds] = useState<string[]>([
    'AI Sales & Lead Qualification',
  ]);
  const [products, setProducts] = useState<string[]>(['FTTH', 'FWA']);
  const [needsSummary, setNeedsSummary] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleItem = (list: string[], setter: (v: string[]) => void, item: string) => {
    setter(
      list.includes(item) ? list.filter((i) => i !== item) : [...list, item]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!companyName.trim() || !picName.trim() || !businessEmail.trim() || !businessPhone.trim()) {
      setError('Mohon lengkapi nama perusahaan, PIC, email bisnis, dan nomor telepon.');
      return;
    }
    if (!consent) {
      setError('Persetujuan kebijakan privasi dan komunikasi diperlukan sebelum mengirim.');
      return;
    }
    const ticket = `PRT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setSubmittedRef(ticket);
  };

  const handleResetAndClose = () => {
    setSubmittedRef(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B3A]/55 p-4 backdrop-blur-xs">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[16px] border border-[#D8E3E9] bg-white p-6 shadow-xl sm:p-8">
        <div className="flex items-start justify-between gap-4 border-b border-[#D8E3E9] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#0284C7]">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#172B3A]">
                Ajukan Kerja Sama Enterprise & Partner
              </h2>
              <p className="text-xs text-[#526675]">
                Tahap 01 · Application → Qualification → Discovery → Contract & SOW
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="rounded-lg p-1.5 text-[#526675] hover:bg-[#EAF2F6]"
            aria-label="Tutup modal pengajuan kerja sama"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {submittedRef ? (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-[#247A55]">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-xl font-bold text-[#172B3A]">
              Pengajuan Kerja Sama Diterima
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#526675]">
              Terima kasih, <strong>{picName}</strong> ({companyName}). Pengajuan Anda tercatat dengan nomor referensi{' '}
              <span className="font-mono-tabular font-semibold text-[#17324D]">
                {submittedRef}
              </span>{' '}
              (Kebijakan Privasi v2026-01).
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const start = new Date(Date.now() + 86400000);
                  start.setHours(10, 0, 0, 0);
                  const end = new Date(start.getTime() + 45 * 60000);
                  openScheduleMeetingModal({
                    summary: `Discovery Call Agentzy x ${companyName}`,
                    description: `Sesi Discovery untuk pengajuan ${submittedRef}. Kebutuhan: ${humanNeeds.join(', ')} | ${aiNeeds.join(', ')}`,
                    startIso: start.toISOString(),
                    endIso: end.toISOString(),
                    attendeeEmail: businessEmail,
                    includeMeet: true,
                  });
                }}
                className="inline-flex items-center gap-2 rounded-[10px] bg-[#0284C7] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0369A1]"
              >
                <Video className="h-4 w-4" />
                <span>Jadwalkan Discovery Call (Google Meet)</span>
              </button>
              <button
                type="button"
                onClick={handleResetAndClose}
                className="rounded-[10px] border border-[#B8C9D3] bg-white px-4 py-2.5 text-sm font-semibold text-[#17324D] hover:bg-[#F5F8FA]"
              >
                Selesai
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                  Nama Perusahaan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT Fiber Nusantara"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="h-11 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-sm text-[#172B3A] focus:border-[#0284C7] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                  Sektor / Tipe Perusahaan *
                </label>
                <select
                  value={companyType}
                  onChange={(e) => setCompanyType(e.target.value)}
                  className="h-11 w-full rounded-[10px] border border-[#B8C9D3] bg-white px-3 text-sm text-[#172B3A] focus:border-[#0284C7] focus:outline-none"
                >
                  <option>ISP / Telekomunikasi</option>
                  <option>Enterprise B2B / Distribusi</option>
                  <option>Layanan Lapangan & Utilitas</option>
                  <option>Lainnya</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                  Nama PIC *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama lengkap penanggung jawab"
                  value={picName}
                  onChange={(e) => setPicName(e.target.value)}
                  className="h-11 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-sm text-[#172B3A] focus:border-[#0284C7] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                  Jabatan PIC
                </label>
                <input
                  type="text"
                  placeholder="Head of Operations / Sales Director"
                  value={picTitle}
                  onChange={(e) => setPicTitle(e.target.value)}
                  className="h-11 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-sm text-[#172B3A] focus:border-[#0284C7] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                  Email Bisnis *
                </label>
                <input
                  type="email"
                  required
                  placeholder="pic@perusahaan.co.id"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  className="h-11 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-sm text-[#172B3A] focus:border-[#0284C7] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                  Nomor Telepon / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+62 812 xxxx xxxx"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  className="h-11 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-sm text-[#172B3A] focus:border-[#0284C7] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                  Website Perusahaan
                </label>
                <input
                  type="url"
                  placeholder="https://perusahaan.co.id"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="h-11 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-sm text-[#172B3A] focus:border-[#0284C7] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                  Estimasi Kapasitas Workforce (Opsional)
                </label>
                <input
                  type="number"
                  min={1}
                  value={estimatedWorkforce}
                  onChange={(e) => setEstimatedWorkforce(e.target.value)}
                  className="h-11 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-sm text-[#172B3A] font-mono-tabular focus:border-[#0284C7] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                Wilayah Operasional
              </label>
              <input
                type="text"
                value={locations}
                onChange={(e) => setLocations(e.target.value)}
                className="h-11 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-sm text-[#172B3A] focus:border-[#0284C7] focus:outline-none"
              />
            </div>

            <div>
              <span className="mb-1.5 block text-xs font-semibold text-[#17324D]">
                Kebutuhan Human Workforce
              </span>
              <div className="flex flex-wrap gap-2">
                {HUMAN_NEEDS.map((item) => {
                  const active = humanNeeds.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleItem(humanNeeds, setHumanNeeds, item)}
                      className={`rounded-[8px] border px-3 py-1.5 text-xs font-medium transition ${
                        active
                          ? 'border-[#0284C7] bg-[#E6F4F9] text-[#17324D]'
                          : 'border-[#D8E3E9] bg-white text-[#526675] hover:bg-[#F5F8FA]'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="mb-1.5 block text-xs font-semibold text-[#17324D]">
                Kebutuhan AI Workforce
              </span>
              <div className="flex flex-wrap gap-2">
                {AI_NEEDS.map((item) => {
                  const active = aiNeeds.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleItem(aiNeeds, setAiNeeds, item)}
                      className={`rounded-[8px] border px-3 py-1.5 text-xs font-medium transition ${
                        active
                          ? 'border-[#0284C7] bg-[#E6F4F9] text-[#17324D]'
                          : 'border-[#D8E3E9] bg-white text-[#526675] hover:bg-[#F5F8FA]'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="mb-1.5 block text-xs font-semibold text-[#17324D]">
                Cakupan Produk Provider
              </span>
              <div className="flex flex-wrap gap-2">
                {PROVIDER_PRODUCTS.map((item) => {
                  const active = products.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleItem(products, setProducts, item)}
                      className={`rounded-[8px] border px-3 py-1.5 text-xs font-medium transition ${
                        active
                          ? 'border-[#17324D] bg-[#17324D] text-white'
                          : 'border-[#D8E3E9] bg-white text-[#526675] hover:bg-[#F5F8FA]'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                Ringkasan Kebutuhan Operasional
              </label>
              <textarea
                rows={3}
                placeholder="Jelaskan target area, kebutuhan tim lapangan/sales, atau integrasi provider yang diharapkan..."
                value={needsSummary}
                onChange={(e) => setNeedsSummary(e.target.value)}
                className="w-full rounded-[10px] border border-[#B8C9D3] p-3 text-sm text-[#172B3A] focus:border-[#0284C7] focus:outline-none"
              />
            </div>

            <label className="flex cursor-pointer items-start gap-2.5 rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] p-3 text-xs text-[#526675]">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded accent-[#0284C7]"
              />
              <span>
                Saya menyetujui Kebijakan Privasi Agentzy (v2026-01) serta mengizinkan tim Agentzy menghubungi saya untuk proses kualifikasi kemitraan.
              </span>
            </label>

            {error && (
              <p className="rounded-[10px] bg-red-50 px-3 py-2 text-xs font-medium text-[#B23A48]">
                {error}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="rounded-[10px] border border-[#B8C9D3] bg-white px-4 py-2.5 text-sm font-semibold text-[#17324D] hover:bg-[#F5F8FA]"
              >
                Batal
              </button>
              <button
                type="submit"
                className="rounded-[10px] bg-[#17324D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#245477]"
              >
                Kirim Pengajuan Kerja Sama
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
