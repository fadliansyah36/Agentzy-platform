'use client';

import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, Building2, Video } from 'lucide-react';
import { useWorkspace } from '@/components/workspace/WorkspaceProvider';
import { ApiError, createPublicPartnershipApplication, uploadPublicPartnershipAttachment } from '@/apps/web/lib/api-client';

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: {
        sitekey: string;
        callback: (token: string) => void;
        'expired-callback'?: () => void;
        'error-callback'?: () => void;
      }) => string;
      remove: (widgetId: string) => void;
    };
  }
}

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

interface PartnershipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HUMAN_NEEDS = [
  'Staff Sales Profesional',
  'Jaringan Affiliate Freelance',
  'Teknisi Lapangan',
  'Rekrutmen & Penempatan',
  'Pelatihan & Sertifikasi Tim',
];

const AI_NEEDS = [
  'AI Digital Marketing & Konten Sosmed',
  'AI Pencari & Penyaring Leads',
  'AI Pendamping Rekrutmen Affiliate',
  'AI Dukungan Operasional & Teknis',
  'AI Analis Pertumbuhan & Laporan',
];

const PROVIDER_PRODUCTS = ['Internet Fiber (FTTH)', 'Wireless (FWA)', 'Paket Bisnis / Korporasi', 'Layanan Lapangan Lainnya'];

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
    'Staff Sales Profesional',
    'Teknisi Lapangan',
  ]);
  const [aiNeeds, setAiNeeds] = useState<string[]>([
    'AI Digital Marketing & Konten Sosmed',
    'AI Pencari & Penyaring Leads',
  ]);
  const [products, setProducts] = useState<string[]>(['Internet Fiber (FTTH)', 'Wireless (FWA)']);
  const [needsSummary, setNeedsSummary] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [communicationConsent, setCommunicationConsent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [attachmentMessage, setAttachmentMessage] = useState<string | null>(null);
  const [faxNumber, setFaxNumber] = useState('');

  useEffect(() => {
    if (!isOpen || !TURNSTILE_SITE_KEY) return;
    let disposed = false;
    let widgetId: string | null = null;
    const renderWidget = () => {
      const container = document.getElementById('agentzy-partnership-turnstile');
      if (disposed || !container || !window.turnstile || widgetId) return;
      widgetId = window.turnstile.render(container, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token) => setCaptchaToken(token),
        'expired-callback': () => setCaptchaToken(''),
        'error-callback': () => setCaptchaToken(''),
      });
    };
    let script = document.querySelector<HTMLScriptElement>('script[data-agentzy-turnstile]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.dataset.agentzyTurnstile = 'true';
      document.head.appendChild(script);
    }
    if (window.turnstile) renderWidget();
    else script.addEventListener('load', renderWidget, { once: true });
    return () => {
      disposed = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleItem = (list: string[], setter: (v: string[]) => void, item: string) => {
    setter(
      list.includes(item) ? list.filter((i) => i !== item) : [...list, item]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAttachmentMessage(null);
    if (!companyName.trim() || !picName.trim() || !businessEmail.trim() || !businessPhone.trim()) {
      setError('Mohon lengkapi nama perusahaan, PIC, email bisnis, dan nomor telepon.');
      return;
    }
    if (!privacyConsent || !communicationConsent) {
      setError('Persetujuan kebijakan privasi dan komunikasi diperlukan sebelum mengirim.');
      return;
    }
    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setError('Selesaikan verifikasi anti-bot sebelum mengirim pengajuan.');
      return;
    }
    if (attachments.some((file) => file.size > 10 * 1024 * 1024)) {
      setError('Setiap lampiran maksimal 10 MB.');
      return;
    }
    if (attachments.some((file) => !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type))) {
      setError('Format lampiran harus PDF, JPG, atau PNG.');
      return;
    }
    if (attachments.length > 3) {
      setError('Maksimal tiga lampiran per pengajuan.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await createPublicPartnershipApplication({
        company_name: companyName.trim(),
        company_type: companyType,
        contact_name: picName.trim(),
        contact_title: picTitle.trim() || undefined,
        business_email: businessEmail.trim().toLowerCase(),
        business_phone: businessPhone.trim(),
        website: website.trim() || undefined,
        operating_locations: locations.trim() || undefined,
        estimated_workforce: estimatedWorkforce ? Number(estimatedWorkforce) : undefined,
        human_needs: humanNeeds,
        ai_needs: aiNeeds,
        provider_products: products,
        needs_summary: needsSummary.trim() || undefined,
        privacy_consent: true,
        communication_consent: communicationConsent,
        captcha_token: captchaToken || undefined,
        policy_version: '2026-01',
        fax_number: faxNumber,
      }, crypto.randomUUID());

      setSubmittedRef(result.data.reference_code);
      if (attachments.length) {
        let uploaded = 0;
        for (const file of attachments) {
          try {
            await uploadPublicPartnershipAttachment(result.data.id, result.data.upload_token, file, crypto.randomUUID());
            uploaded += 1;
          } catch (uploadError) {
            setAttachmentMessage(uploadError instanceof ApiError
              ? `Pengajuan tercatat, tetapi lampiran gagal diunggah: ${uploadError.message}`
              : 'Pengajuan tercatat, tetapi sebagian lampiran gagal diunggah.');
          }
        }
        if (uploaded === attachments.length) {
          setAttachmentMessage(`${uploaded} lampiran diterima di private quarantine dan menunggu pemindaian.`);
        } else if (uploaded > 0) {
          setAttachmentMessage(`${uploaded} dari ${attachments.length} lampiran diterima; sisanya perlu dikirim ulang.`);
        }
      }
    } catch (submitError) {
      setError(submitError instanceof ApiError
        ? submitError.message
        : 'Pengajuan belum dapat dikirim. Silakan coba kembali.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedRef(null);
    setError(null);
    setAttachmentMessage(null);
    setAttachments([]);
    setPrivacyConsent(false);
    setCommunicationConsent(false);
    setCaptchaToken('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#172B3A]/55 p-0 backdrop-blur-xs sm:items-center sm:p-4">
      <div className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-[20px] border border-[#D8E3E9] bg-white p-5 shadow-xl sm:rounded-[16px] sm:p-8">
        <div className="flex items-start justify-between gap-4 border-b border-[#D8E3E9] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#0284C7]">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#172B3A]">
                Ajukan Kerja Sama Bisnis &amp; Kemitraan
              </h2>
              <p className="text-xs text-[#526675]">
                Langkah Awal Kemitraan · Konsultasi Kebutuhan · Penawaran Kerja Sama
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
            {attachmentMessage && <p className="mx-auto mt-3 max-w-md rounded-[10px] bg-[#E6F4F9] px-3 py-2 text-xs text-[#17324D]">{attachmentMessage}</p>}
            <p className="mt-2 text-xs text-[#526675]">Notifikasi pengajuan telah masuk ke antrean sistem untuk diproses.</p>
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
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#17324D]">Lampiran (Opsional, PDF/JPG/PNG, maks. 10 MB per file)</label>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={(e) => setAttachments(Array.from(e.target.files ?? []).slice(0, 3))}
                className="block w-full rounded-[10px] border border-[#B8C9D3] bg-white p-2 text-xs text-[#526675]"
              />
              {attachments.length > 0 && <p className="mt-1 text-[11px] text-[#526675]">{attachments.length} file dipilih. File akan disimpan secara privat dan menunggu pemindaian.</p>}
            </div>
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label htmlFor="partnership-fax">Fax</label>
              <input id="partnership-fax" tabIndex={-1} autoComplete="off" value={faxNumber} onChange={(e) => setFaxNumber(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="flex cursor-pointer items-start gap-2.5 rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] p-3 text-xs text-[#526675]">
                <input type="checkbox" checked={privacyConsent} onChange={(e) => setPrivacyConsent(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 rounded accent-[#0284C7]" />
                <span>Saya menyetujui Kebijakan Privasi Agentzy (v2026-01) untuk pemrosesan data pengajuan kemitraan.</span>
              </label>
              <label className="flex cursor-pointer items-start gap-2.5 rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] p-3 text-xs text-[#526675]">
                <input type="checkbox" checked={communicationConsent} onChange={(e) => setCommunicationConsent(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 rounded accent-[#0284C7]" />
                <span>Saya mengizinkan tim Agentzy menghubungi saya untuk proses kualifikasi dan tindak lanjut kemitraan.</span>
              </label>
            </div>
            {TURNSTILE_SITE_KEY && (
              <div className="rounded-[10px] border border-[#D8E3E9] p-3">
                <div id="agentzy-partnership-turnstile" />
                <p className="mt-1 text-[10px] text-[#718391]">Verifikasi keamanan Cloudflare Turnstile.</p>
              </div>
            )}

            {error && (
              <p className="rounded-[10px] bg-red-50 px-3 py-2 text-xs font-medium text-[#B23A48]">
                {error}
              </p>
            )}

            <div className="grid grid-cols-1 gap-2.5 pt-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end sm:gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="h-11 rounded-[10px] bg-[#17324D] px-5 text-sm font-semibold text-white transition hover:bg-[#245477] disabled:cursor-not-allowed disabled:opacity-60 sm:order-2"
              >
                Kirim Pengajuan Kerja Sama
              </button>
              <button
                type="button"
                onClick={handleResetAndClose}
                className="h-11 rounded-[10px] border border-[#B8C9D3] bg-white px-4 text-sm font-semibold text-[#17324D] hover:bg-[#F5F8FA] sm:order-1"
              >
                Batal
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
