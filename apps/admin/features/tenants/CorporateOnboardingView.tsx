'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Rocket,
  RadioTower,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminSegmentedTabs,
  AdminStatusText,
} from '../../components/data-display/AdminDataDisplay';
import type { AdminIspProviderRecord, AdminTenantRecord } from '../../lib/admin-types';

export function CorporateOnboardingView({
  providers,
  onSubmitOnboarding,
  onOpenAddProvider,
  onOpenEditProvider,
  onDeleteProvider,
  onBack,
}: {
  providers: AdminIspProviderRecord[];
  onSubmitOnboarding: (payload: {
    companyName: string;
    domain: string;
    clientType: AdminTenantRecord['clientType'];
    cooperationModel: AdminTenantRecord['cooperationModel'];
    contractNumber: string;
    initialCreditsTopUp: number;
    industry: string;
    region: string;
    adminEmailInvite: string;
  }) => void;
  onOpenAddProvider: () => void;
  onOpenEditProvider: (p: AdminIspProviderRecord) => void;
  onDeleteProvider: (id: string) => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<'wizard' | 'providers'>('wizard');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [companyName, setCompanyName] = useState('PT ISP Nusantara Baru');
  const [domain, setDomain] = useState('nusantaranet.co.id');
  const [clientType, setClientType] =
    useState<AdminTenantRecord['clientType']>('ISP / Provider');
  const [cooperationModel, setCooperationModel] =
    useState<AdminTenantRecord['cooperationModel']>('Kontrak Managed End-to-End');
  const [contractNumber, setContractNumber] = useState('CTR-2026-099');
  const [initialCreditsTopUp, setInitialCreditsTopUp] = useState<number>(150000);
  const [industry, setIndustry] = useState('ISP / Telekomunikasi');
  const [region, setRegion] = useState('Jawa Barat & Jabodetabek');
  const [adminEmailInvite, setAdminEmailInvite] = useState('admin@nusantaranet.co.id');

  const [servicesSelected, setServicesSelected] = useState<string[]>([
    'Managed Sales & Affiliate 60/40',
    'Teknisi Lapangan FTTH/FWA',
    'AI Sales & Content Studio',
  ]);

  const toggleService = (svc: string) => {
    setServicesSelected((prev) =>
      prev.includes(svc) ? prev.filter((x) => x !== svc) : [...prev, svc]
    );
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Onboarding Korporat & Provider Management"
        subtitle="Aktivasi tenant baru 3 langkah (Data, Layanan, Akses) serta kelola ISP Provider terhubung."
        onBack={onBack}
        actions={
          <AdminSegmentedTabs
            tabs={[
              { id: 'wizard', label: 'Onboarding Korporat (3 Langkah)' },
              { id: 'providers', label: `ISP Provider Registry (${providers.length})` },
            ]}
            activeTab={tab}
            onChange={setTab}
          />
        }
      />

      {tab === 'wizard' ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-7">
            {/* 3-Step Stepper matching Screen 3 */}
            <div className="mb-6 flex items-center justify-between border-b border-[#EAF2F6] pb-4">
              {(
                [
                  { n: 1, label: 'Data' },
                  { n: 2, label: 'Layanan' },
                  { n: 3, label: 'Akses' },
                ] as const
              ).map((item, i) => {
                const active = step === item.n;
                const done = step > item.n;
                return (
                  <React.Fragment key={item.n}>
                    <button
                      type="button"
                      onClick={() => setStep(item.n)}
                      className="flex items-center gap-2 text-left"
                    >
                      <span
                        className={`font-mono-tabular flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                          active
                            ? 'bg-[#0284C7] text-white'
                            : done
                              ? 'bg-[#247A55] text-white'
                              : 'bg-[#EAF2F6] text-[#526675]'
                        }`}
                      >
                        {item.n}
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          active ? 'text-[#17324D]' : 'text-[#526675]'
                        }`}
                      >
                        {item.label}
                      </span>
                    </button>
                    {i < 2 && <div className="mx-2 h-px flex-1 bg-[#D8E3E9]" />}
                  </React.Fragment>
                );
              })}
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#172B3A]">
                    Perusahaan
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="h-11 w-full rounded-[10px] border border-[#D8E3E9] px-3.5 text-sm text-[#172B3A] outline-none focus:border-[#0284C7]"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#172B3A]">
                      Jenis Klien
                    </label>
                    <select
                      value={clientType}
                      onChange={(e) =>
                        setClientType(e.target.value as AdminTenantRecord['clientType'])
                      }
                      className="h-11 w-full rounded-[10px] border border-[#D8E3E9] bg-white px-3 text-sm text-[#172B3A] outline-none focus:border-[#0284C7]"
                    >
                      <option value="ISP / Provider">ISP / Provider</option>
                      <option value="Corporate Enterprise">Corporate Enterprise</option>
                      <option value="Multi-Cabang">Multi-Cabang</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#172B3A]">
                      Skema Kontrak Kerjasama
                    </label>
                    <select
                      value={cooperationModel}
                      onChange={(e) =>
                        setCooperationModel(e.target.value as AdminTenantRecord['cooperationModel'])
                      }
                      className="h-11 w-full rounded-[10px] border border-[#D8E3E9] bg-white px-3 text-sm text-[#172B3A] outline-none focus:border-[#0284C7]"
                    >
                      <option value="Kontrak Managed End-to-End">Kontrak Managed End-to-End</option>
                      <option value="Kontrak Field & Sales">Kontrak Field &amp; Sales</option>
                      <option value="Kontrak Pilot Kemitraan">Kontrak Pilot Kemitraan</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#172B3A]">
                      No. Kontrak Kerjasama (MSA/PKS)
                    </label>
                    <input
                      type="text"
                      value={contractNumber}
                      onChange={(e) => setContractNumber(e.target.value)}
                      className="h-11 w-full rounded-[10px] border border-[#D8E3E9] px-3.5 text-sm font-mono-tabular text-[#172B3A] outline-none focus:border-[#0284C7]"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#172B3A]">
                      Top Up AI Credits Awal (Non-Langganan)
                    </label>
                    <select
                      value={initialCreditsTopUp}
                      onChange={(e) => setInitialCreditsTopUp(Number(e.target.value))}
                      className="h-11 w-full rounded-[10px] border border-[#D8E3E9] bg-white px-3 text-sm text-[#172B3A] outline-none focus:border-[#0284C7]"
                    >
                      <option value={50000}>50.000 AI Credits (Starter Pack)</option>
                      <option value={150000}>150.000 AI Credits (Growth Pack)</option>
                      <option value={350000}>350.000 AI Credits (Enterprise Pack)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#172B3A]">
                      Domain Korporat
                    </label>
                    <input
                      type="text"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className="h-11 w-full rounded-[10px] border border-[#D8E3E9] px-3.5 text-sm text-[#172B3A] outline-none focus:border-[#0284C7]"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#172B3A]">
                      Wilayah Operasi
                    </label>
                    <input
                      type="text"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="h-11 w-full rounded-[10px] border border-[#D8E3E9] px-3.5 text-sm text-[#172B3A] outline-none focus:border-[#0284C7]"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="h-10 rounded-[10px] bg-[#0284C7] px-5 text-xs font-semibold text-white hover:bg-[#0369A1]"
                  >
                    Lanjut ke Layanan →
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#172B3A]">
                    Industri Konfigurasi
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="h-11 w-full rounded-[10px] border border-[#D8E3E9] bg-white px-3 text-sm text-[#172B3A]"
                  >
                    <option value="ISP / Telekomunikasi">ISP / Telekomunikasi</option>
                    <option value="Properti">Properti</option>
                    <option value="Manufaktur">Manufaktur</option>
                    <option value="Retail & Distribusi">Retail &amp; Distribusi</option>
                  </select>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold text-[#172B3A]">
                    Modul Layanan yang Diaktifkan
                  </p>
                  <div className="space-y-2">
                    {[
                      'Managed Sales & Affiliate 60/40',
                      'Teknisi Lapangan FTTH/FWA',
                      'AI Sales & Content Studio',
                      'AI Technical & Route Assistant',
                      'Corporate Financial & Commission Center',
                    ].map((svc) => {
                      const checked = servicesSelected.includes(svc);
                      return (
                        <label
                          key={svc}
                          className="flex cursor-pointer items-center gap-2.5 rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] px-3.5 py-2.5 text-xs font-medium text-[#17324D]"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleService(svc)}
                            className="h-4 w-4 accent-[#0284C7]"
                          />
                          <span>{svc}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="h-10 rounded-[10px] border border-[#D8E3E9] px-4 text-xs font-semibold text-[#526675]"
                  >
                    ← Kembali
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="h-10 rounded-[10px] bg-[#0284C7] px-5 text-xs font-semibold text-white hover:bg-[#0369A1]"
                  >
                    Lanjut ke Akses RBAC →
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#172B3A]">
                    Email Tenant Admin Pertama (Undangan RBAC + MFA)
                  </label>
                  <input
                    type="email"
                    value={adminEmailInvite}
                    onChange={(e) => setAdminEmailInvite(e.target.value)}
                    className="h-11 w-full rounded-[10px] border border-[#D8E3E9] px-3.5 text-sm text-[#172B3A] outline-none focus:border-[#0284C7]"
                  />
                </div>
                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="h-10 rounded-[10px] border border-[#D8E3E9] px-4 text-xs font-semibold text-[#526675]"
                  >
                    ← Kembali
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onSubmitOnboarding({
                        companyName: companyName.trim() || 'Tenant Baru',
                        domain: domain.trim(),
                        clientType,
                        cooperationModel,
                        contractNumber: contractNumber.trim() || 'CTR-2026-099',
                        initialCreditsTopUp,
                        industry,
                        region,
                        adminEmailInvite,
                      })
                    }
                    className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-[#17324D] px-5 text-xs font-semibold text-white hover:bg-[#245477]"
                  >
                    <Rocket className="h-4 w-4" />
                    <span>Proses Onboarding</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Checklist Preview matching Screen 3 */}
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-5">
            <h2 className="text-sm font-bold text-[#17324D]">
              Checklist Otomatisasi Onboarding
            </h2>
            <p className="mt-1 text-xs text-[#526675]">
              Seluruh provisioning berjalan melalui API Control Plane dengan isolasi RLS.
            </p>
            <ul className="mt-4 space-y-2.5 text-xs font-medium text-[#17324D]">
              {[
                'Buat Tenant & Domain',
                'Aktifkan Layanan & Entitlement',
                'Atur RBAC Admin & Kebijakan MFA',
                'Kirim Undangan Aktivasi ke PIC',
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2.5 rounded-[10px] border border-[#EAF2F6] bg-[#F5F8FA] px-3.5 py-2.5"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#247A55]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-[#EAF2F6] pt-3 text-xs text-[#526675]">
              <p>
                Ringkasan: <strong className="text-[#17324D]">{companyName}</strong> ·{' '}
                {clientType} · {servicesSelected.length} layanan aktif
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onOpenAddProvider}
              className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#0284C7] px-4 text-xs font-semibold text-white hover:bg-[#0369A1]"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Provider ISP</span>
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {providers.map((p) => (
              <div
                key={p.id}
                className="rounded-[14px] border border-[#D8E3E9] bg-white p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#0284C7]">
                      <RadioTower className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#17324D]">{p.name}</h3>
                      <p className="font-mono-tabular text-[11px] text-[#718391]">
                        {p.code} · {p.integrationMode}
                      </p>
                    </div>
                  </div>
                  <AdminStatusText
                    tone={
                      p.status === 'Terhubung'
                        ? 'success'
                        : p.status === 'Pending Review'
                          ? 'warning'
                          : 'danger'
                    }
                    label={p.status}
                  />
                </div>
                <p className="mt-3 text-xs text-[#526675]">
                  Produk: <span className="font-semibold text-[#17324D]">{p.productLines.join(', ')}</span> · SLA Target:{' '}
                  <span className="font-mono-tabular font-semibold">{p.slaTargetHours} jam</span>
                </p>
                <p className="mt-1 text-[11px] text-[#718391]">
                  Sumber Coverage: {p.coverageSource}
                </p>
                <div className="mt-4 flex justify-end gap-2 border-t border-[#EAF2F6] pt-3">
                  <button
                    type="button"
                    onClick={() => onOpenEditProvider(p)}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#D8E3E9] px-2.5 text-xs font-semibold text-[#17324D] hover:bg-[#E6F4F9]"
                  >
                    <Pencil className="h-3 w-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteProvider(p.id)}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#D8E3E9] px-2.5 text-xs font-semibold text-[#B23A48] hover:bg-[#B23A48]/10"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
