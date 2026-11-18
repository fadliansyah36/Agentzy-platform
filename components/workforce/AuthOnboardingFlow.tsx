'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Wrench,
  Briefcase,
  Users,
  X,
  Link2,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { AgentzyLogo } from '@/components/brand/AgentzyLogo';
import { useWorkspace } from '@/components/workspace/WorkspaceProvider';
import type { WorkforceRoleMode } from '@/lib/agentzy-data';

export type AuthStep = 'splash' | 'onboarding' | 'login' | 'register' | 'role';

export interface SponsorDirectoryEntry {
  code: string;
  name: string;
  tier: string;
  area: string;
}

const SALES_SPONSOR_DIRECTORY: Record<string, SponsorDirectoryEntry> = {
  'AGT-RAKA-2026': {
    code: 'AGT-RAKA-2026',
    name: 'Raka Pratama',
    tier: 'Sales Agentzy Pro',
    area: 'Jakarta Selatan',
  },
  'AGT-DIMAS-2026': {
    code: 'AGT-DIMAS-2026',
    name: 'Dimas Anggara',
    tier: 'Sales Agentzy Elite',
    area: 'Bandung',
  },
  'AGT-NADIA-2026': {
    code: 'AGT-NADIA-2026',
    name: 'Nadia Kusuma',
    tier: 'Sales Agentzy Pro',
    area: 'Surabaya',
  },
};

export interface AuthEnterMeta {
  referralCode?: string;
  sponsorName?: string;
  phone?: string;
  email?: string;
}

interface AuthOnboardingFlowProps {
  initialStep?: AuthStep;
  selectedRole: WorkforceRoleMode;
  onSelectRole: (role: WorkforceRoleMode) => void;
  onEnterPortal: (
    role: WorkforceRoleMode,
    displayName?: string,
    meta?: AuthEnterMeta
  ) => void;
  onCloseAuth?: () => void;
}

const ONBOARDING_SLIDES = [
  {
    title: 'Kelola Jaringan & Raih Penghasilan Lebih',
    desc: 'Sales Resmi mengelola penjualan dan merekrut mitra affiliate, sementara Affiliate menyalurkan prospek pelanggan dan memantau komisi secara transparan.',
    tag: 'Sales Resmi & Affiliate',
  },
  {
    title: 'Work Order Lapangan & Mode Offline',
    desc: 'Terima penugasan instalasi FTTH/FWA, navigasi rute Google Maps, isi SOP checklist, speedtest, dan tanda tangan pelanggan.',
    tag: 'Teknisi Lapangan',
  },
  {
    title: 'Workforce Passport & Terhubung Workspace',
    desc: 'Sinkronisasi email tindak lanjut di Gmail, jadwal survei di Google Calendar, dan sesi onboarding di Google Meet.',
    tag: 'Terintegrasi Enterprise',
  },
];

export function AuthOnboardingFlow({
  initialStep = 'login',
  selectedRole,
  onSelectRole,
  onEnterPortal,
  onCloseAuth,
}: AuthOnboardingFlowProps) {
  const { connectWorkspace, isSigningIn, authError, user } = useWorkspace();
  const [step, setStep] = useState<AuthStep>(initialStep);
  const [slideIdx, setSlideIdx] = useState(0);

  // Login state
  const [emailOrPhone, setEmailOrPhone] = useState(
    selectedRole === 'technician' ? 'teknisi@agentzy.id' : 'raka@agentzy.id'
  );
  const [password, setPassword] = useState('••••••••••');
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register state
  const [regType, setRegType] = useState<'sales_staff' | 'affiliate'>(
    selectedRole === 'affiliate' ? 'affiliate' : 'sales_staff'
  );
  const [regName, setRegName] = useState(
    selectedRole === 'affiliate' ? 'Siti Nabila' : 'Raka Pratama'
  );
  const [regPhone, setRegPhone] = useState(
    selectedRole === 'affiliate' ? '0813 7788 9900' : '0812 3456 7890'
  );
  const [regEmail, setRegEmail] = useState(
    selectedRole === 'affiliate' ? 'siti.nabila@contoh.id' : 'raka@agentzy.id'
  );
  const [regRole, setRegRole] = useState<WorkforceRoleMode>(selectedRole);
  const [regReferralCode, setRegReferralCode] = useState('AGT-RAKA-2026');
  const [regAgree, setRegAgree] = useState(true);

  const normalizedReferral = regReferralCode.trim().toUpperCase();
  const matchedSponsor = SALES_SPONSOR_DIRECTORY[normalizedReferral];
  const isReferralFormatValid = /^[A-Z0-9-]{6,24}$/.test(normalizedReferral);
  const canSubmitRegister =
    regAgree && (regType !== 'affiliate' || isReferralFormatValid);

  const handleGoogleLogin = async () => {
    const ok = await connectWorkspace();
    if (ok) {
      setStep('role');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F8FA] px-4 py-8 sm:px-6 flex flex-col items-center justify-center">
      <div className="mb-4 flex w-full max-w-md items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#526675] hover:text-[#17324D]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Landing Page</span>
        </Link>
        {onCloseAuth && (
          <button
            type="button"
            onClick={onCloseAuth}
            className="text-xs font-semibold text-[#0284C7] hover:underline"
          >
            Lanjut ke Demo Portal
          </button>
        )}
      </div>

      {/* Mode Switcher Pills for Previewing Screens 1-4 */}
      <div className="mb-4 flex flex-wrap items-center justify-center gap-1.5 rounded-[12px] border border-[#D8E3E9] bg-white p-1">
        {(
          [
            { id: 'splash', label: '1. Splash' },
            { id: 'onboarding', label: '2. Onboarding' },
            { id: 'login', label: '3. Login' },
            { id: 'register', label: '4. Registrasi' },
            { id: 'role', label: '5. Pilih Peran' },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setStep(item.id)}
            className={`rounded-[8px] px-2.5 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
              step === item.id
                ? 'bg-[#17324D] text-white'
                : 'text-[#526675] hover:bg-[#EAF2F6]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="w-full max-w-md overflow-hidden rounded-[20px] border border-[#D8E3E9] bg-white p-6 shadow-md sm:p-8">
        {/* 1. SPLASH SCREEN */}
        {step === 'splash' && (
          <div className="flex min-h-[460px] flex-col items-center justify-between py-4 text-center">
            <div className="mt-8 flex flex-col items-center">
              <AgentzyLogo variant="light" size="lg" showWordmark={false} />
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#17324D]">
                Agentzy
              </h1>
              <p className="mt-1 text-sm font-semibold text-[#245477]">
                Human Workforce Portal
              </p>
              <div className="mt-5 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#0284C7]" />
                <span className="h-2 w-2 rounded-full bg-[#87CEEB]" />
                <span className="h-2 w-2 rounded-full bg-[#ADD8E6]" />
                <span className="h-2 w-2 rounded-full bg-[#D8E3E9]" />
              </div>
            </div>

            <div className="w-full space-y-5">
              <p className="mx-auto max-w-xs text-sm leading-relaxed text-[#526675]">
                Kelola penugasan, rekrut affiliate, penjualan, instalasi teknis,
                komisi, dan penghasilan dalam satu aplikasi terpadu.
              </p>
              <button
                type="button"
                onClick={() => setStep('onboarding')}
                className="w-full rounded-[12px] bg-[#0284C7] py-3.5 text-sm font-semibold text-white transition hover:bg-[#0369A1]"
              >
                Mulai
              </button>
            </div>
          </div>
        )}

        {/* 2. ONBOARDING CAROUSEL */}
        {step === 'onboarding' && (
          <div className="flex min-h-[460px] flex-col justify-between py-2">
            <div>
              <div className="flex items-center justify-between">
                <AgentzyLogo variant="light" size="sm" />
                <span className="text-xs font-semibold text-[#0284C7]">
                  {ONBOARDING_SLIDES[slideIdx].tag}
                </span>
              </div>

              <div className="mt-6 rounded-[14px] border border-[#D8E3E9] bg-[#E6F4F9] p-6 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-[#0284C7] shadow-xs">
                  {slideIdx === 0 ? (
                    <Users className="h-10 w-10" />
                  ) : slideIdx === 1 ? (
                    <Wrench className="h-10 w-10" />
                  ) : (
                    <Briefcase className="h-10 w-10" />
                  )}
                </div>
                <p className="mt-4 font-mono-tabular text-xs font-semibold text-[#245477]">
                  Langkah 0{slideIdx + 1} / 03
                </p>
              </div>

              <h2 className="mt-6 text-center text-xl font-bold text-[#17324D]">
                {ONBOARDING_SLIDES[slideIdx].title}
              </h2>
              <p className="mt-2.5 text-center text-sm leading-relaxed text-[#526675]">
                {ONBOARDING_SLIDES[slideIdx].desc}
              </p>
            </div>

            <div className="space-y-5">
              <div className="flex items-center justify-center gap-2">
                {ONBOARDING_SLIDES.map((s, i) => (
                  <button
                    key={s.title}
                    type="button"
                    aria-label={`Slide ${i + 1}`}
                    onClick={() => setSlideIdx(i)}
                    className={`h-2 rounded-full transition-all ${
                      slideIdx === i ? 'w-6 bg-[#0284C7]' : 'w-2 bg-[#D8E3E9]'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep('login')}
                  className="px-4 py-2.5 text-sm font-semibold text-[#526675] hover:text-[#17324D]"
                >
                  Lewati
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (slideIdx < ONBOARDING_SLIDES.length - 1) {
                      setSlideIdx(slideIdx + 1);
                    } else {
                      setStep('login');
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-[10px] bg-[#0284C7] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#0369A1]"
                >
                  <span>
                    {slideIdx < ONBOARDING_SLIDES.length - 1
                      ? 'Lanjut'
                      : 'Masuk Sekarang'}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. LOGIN SCREEN */}
        {step === 'login' && (
          <div>
            <div className="text-center">
              <div className="flex justify-center">
                <AgentzyLogo variant="light" size="md" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-[#17324D]">
                Masuk ke Akun Anda
              </h2>
              <p className="mt-1 text-xs font-medium text-[#526675]">
                Human Workforce Portal
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setStep('role');
              }}
              className="mt-6 space-y-4"
            >
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                  Email atau Nomor HP
                </label>
                <input
                  type="text"
                  required
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  className="h-11 w-full rounded-[10px] border border-[#B8C9D3] px-3.5 text-sm text-[#172B3A] focus:border-[#0284C7] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                  Kata Sandi
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 w-full rounded-[10px] border border-[#B8C9D3] px-3.5 pr-10 text-sm text-[#172B3A] focus:border-[#0284C7] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#526675] hover:text-[#17324D]"
                    aria-label="Tampilkan atau sembunyikan kata sandi"
                  >
                    {showPass ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex cursor-pointer items-center gap-2 text-[#526675]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded accent-[#0284C7]"
                  />
                  <span>Ingat saya</span>
                </label>
                <Link
                  href="/auth/recovery?returnTo=/workforce"
                  className="font-semibold text-[#0284C7] hover:underline"
                >
                  Lupa kata sandi?
                </Link>
              </div>

              <button
                type="submit"
                className="h-11 w-full rounded-[10px] bg-[#0284C7] text-sm font-semibold text-white transition hover:bg-[#0369A1]"
              >
                Masuk
              </button>
            </form>

            <div className="my-4 flex items-center gap-3 text-xs text-[#718391]">
              <div className="h-px flex-1 bg-[#D8E3E9]" />
              <span>atau</span>
              <div className="h-px flex-1 bg-[#D8E3E9]" />
            </div>

            {/* Official Sign in with Google button for Workspace Auth */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSigningIn}
              className="gsi-material-button"
            >
              <div className="gsi-material-button-content-wrapper">
                <div className="gsi-material-button-icon">
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    style={{ display: 'block' }}
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                    <path fill="none" d="M0 0h48v48H0z" />
                  </svg>
                </div>
                <span className="gsi-material-button-contents">
                  {isSigningIn ? 'Menghubungkan Google...' : 'Sign in with Google'}
                </span>
              </div>
            </button>

            {user && (
              <p className="mt-2 text-center text-xs font-medium text-[#247A55]">
                Terhubung sebagai {user.email}
              </p>
            )}

            {authError && (
              <p className="mt-2 text-center text-xs text-[#B23A48]">
                {authError}
              </p>
            )}

            <p className="mt-5 text-center text-xs text-[#526675]">
              Belum punya akun?{' '}
              <button
                type="button"
                onClick={() => setStep('register')}
                className="font-semibold text-[#0284C7] hover:underline"
              >
                Daftar
              </button>
            </p>
          </div>
        )}

        {/* 4. REGISTER SCREEN */}
        {step === 'register' && (
          <div>
            <h2 className="text-center text-xl font-bold text-[#17324D]">
              Buat Akun Workforce
            </h2>
            <div className="mt-4 grid grid-cols-2 rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] p-1">
              <button
                type="button"
                onClick={() => {
                  setRegType('sales_staff');
                  setRegRole('sales');
                  if (regName === 'Siti Nabila') {
                    setRegName('Raka Pratama');
                    setRegPhone('0812 3456 7890');
                    setRegEmail('raka@agentzy.id');
                  }
                }}
                className={`rounded-[8px] py-2 text-xs font-semibold transition ${
                  regType === 'sales_staff'
                    ? 'bg-[#0284C7] text-white'
                    : 'text-[#526675]'
                }`}
              >
                Sales / Staff
              </button>
              <button
                type="button"
                onClick={() => {
                  setRegType('affiliate');
                  setRegRole('affiliate');
                  if (regName === 'Raka Pratama') {
                    setRegName('Siti Nabila');
                    setRegPhone('0813 7788 9900');
                    setRegEmail('siti.nabila@contoh.id');
                  }
                }}
                className={`rounded-[8px] py-2 text-xs font-semibold transition ${
                  regType === 'affiliate'
                    ? 'bg-[#0284C7] text-white'
                    : 'text-[#526675]'
                }`}
              >
                Affiliate
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!canSubmitRegister) return;
                onSelectRole(regRole);
                onEnterPortal(regRole, regName, {
                  phone: regPhone,
                  email: regEmail,
                  referralCode:
                    regType === 'affiliate' ? normalizedReferral : undefined,
                  sponsorName:
                    regType === 'affiliate'
                      ? matchedSponsor?.name || `Staff Sales (${normalizedReferral})`
                      : undefined,
                });
              }}
              className="mt-4 space-y-3"
            >
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="h-10 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-sm text-[#172B3A] focus:border-[#0284C7] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                  Nomor HP
                </label>
                <input
                  type="tel"
                  required
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="h-10 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-sm text-[#172B3A] focus:border-[#0284C7] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="h-10 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-sm text-[#172B3A] focus:border-[#0284C7] focus:outline-none"
                />
              </div>

              {regType === 'affiliate' && (
                <div className="rounded-[12px] border border-[#ADD8E6] bg-[#F5F8FA] p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="affiliate-referral-code"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#17324D]"
                    >
                      <Link2 className="h-3.5 w-3.5 text-[#0284C7]" />
                      <span>Kode Referral Staff Sales</span>
                    </label>
                    <span className="rounded-md bg-[#E6F4F9] px-1.5 py-0.5 text-[10px] font-bold text-[#0284C7]">
                      Wajib Terikat
                    </span>
                  </div>

                  <input
                    id="affiliate-referral-code"
                    type="text"
                    required
                    value={regReferralCode}
                    onChange={(e) =>
                      setRegReferralCode(
                        e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '')
                      )
                    }
                    placeholder="Contoh: AGT-RAKA-2026"
                    className="font-mono-tabular h-10 w-full rounded-[10px] border border-[#0284C7]/60 bg-white px-3 text-sm font-semibold uppercase tracking-wide text-[#17324D] placeholder:normal-case placeholder:font-normal placeholder:text-[#718391] focus:border-[#0284C7] focus:outline-none"
                  />

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-[#526675]">
                      Contoh kode aktif:
                    </span>
                    {Object.values(SALES_SPONSOR_DIRECTORY).map((sp) => (
                      <button
                        key={sp.code}
                        type="button"
                        onClick={() => setRegReferralCode(sp.code)}
                        className={`font-mono-tabular rounded-md border px-2 py-0.5 text-[10px] font-semibold transition ${
                          normalizedReferral === sp.code
                            ? 'border-[#0284C7] bg-[#0284C7] text-white'
                            : 'border-[#D8E3E9] bg-white text-[#245477] hover:border-[#0284C7]'
                        }`}
                      >
                        {sp.code}
                      </button>
                    ))}
                  </div>

                  {matchedSponsor ? (
                    <div className="flex items-start gap-2 rounded-[9px] border border-[#247A55]/30 bg-[#E6F4F9] px-2.5 py-2 text-[11px] text-[#17324D]">
                      <UserCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#247A55]" />
                      <div>
                        <p className="font-bold text-[#17324D]">
                          Terhubung ke Staff Sales: {matchedSponsor.name}
                        </p>
                        <p className="text-[10px] text-[#526675]">
                          {matchedSponsor.tier} · Area {matchedSponsor.area} · Skema 60% Affiliate / 40% Sales
                        </p>
                      </div>
                    </div>
                  ) : isReferralFormatValid ? (
                    <div className="flex items-start gap-2 rounded-[9px] border border-[#0284C7]/30 bg-[#E6F4F9] px-2.5 py-2 text-[11px] text-[#17324D]">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0284C7]" />
                      <p>
                        Kode <strong className="font-mono-tabular">{normalizedReferral}</strong>{' '}
                        akan mengikat akun Affiliate Anda ke Staff Sales pemilik kode tersebut.
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 rounded-[9px] border border-[#B23A48]/30 bg-white px-2.5 py-2 text-[11px] text-[#B23A48]">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <p>
                        Masukkan kode referral Staff Sales minimal 6 karakter (huruf kapital, angka, atau tanda &ldquo;-&rdquo;).
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                  Pilih Peran
                </label>
                {regType === 'affiliate' ? (
                  <div className="rounded-[10px] border border-[#ADD8E6] bg-[#E6F4F9] px-3 py-2.5 text-xs text-[#17324D]">
                    <p className="font-bold">Affiliate Freelance (Mitra Akuisisi Prospek)</p>
                    <p className="mt-0.5 text-[11px] text-[#526675]">
                      Terikat dengan Staff Sales sponsor di atas untuk input lead pelanggan dan menerima bagi hasil 60%.
                    </p>
                  </div>
                ) : (
                  <select
                    value={regRole === 'affiliate' ? 'sales' : regRole}
                    onChange={(e) => setRegRole(e.target.value as WorkforceRoleMode)}
                    className="h-10 w-full rounded-[10px] border border-[#B8C9D3] bg-white px-3 text-sm text-[#172B3A] focus:border-[#0284C7] focus:outline-none"
                  >
                    <option value="sales">Sales Agentzy (Sales Resmi)</option>
                    <option value="technician">Staff Teknisi (FTTH/FWA)</option>
                  </select>
                )}
              </div>
              <label className="flex cursor-pointer items-start gap-2 text-xs text-[#526675]">
                <input
                  type="checkbox"
                  checked={regAgree}
                  onChange={(e) => setRegAgree(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded accent-[#0284C7]"
                />
                <span>
                  Saya setuju dengan <strong className="text-[#0284C7]">S&amp;K</strong> dan{' '}
                  <strong className="text-[#0284C7]">Kebijakan Privasi</strong> Agentzy.
                </span>
              </label>

              <button
                type="submit"
                disabled={!canSubmitRegister}
                className="h-11 w-full rounded-[10px] bg-[#0284C7] text-sm font-semibold text-white hover:bg-[#0369A1] disabled:opacity-50"
              >
                {regType === 'affiliate'
                  ? 'Daftar & Hubungkan ke Staff Sales'
                  : 'Daftar & Masuk Portal'}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-[#526675]">
              Sudah terdaftar?{' '}
              <button
                type="button"
                onClick={() => setStep('login')}
                className="font-semibold text-[#0284C7] hover:underline"
              >
                Masuk di sini
              </button>
            </p>
          </div>
        )}

        {/* 5. PILIH PERAN (Screen 3 of Image 4) */}
        {step === 'role' && (
          <div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-[#17324D]">Pilih Peran Kerja</h2>
              <p className="mt-1 text-xs text-[#526675]">
                Pilih ruang kerja Human Workforce yang ingin Anda buka
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {(
                [
                  {
                    role: 'sales' as const,
                    title: 'Sales Agentzy (Sales Resmi)',
                    desc: 'Lead & penjualan, rekrut affiliate, simulasi & rincian komisi.',
                    icon: Briefcase,
                  },
                  {
                    role: 'technician' as const,
                    title: 'Staff Teknisi',
                    desc: 'Instalasi FTTH, maintenance, troubleshooting, navigasi Maps, SOP & offline.',
                    icon: Wrench,
                  },
                  {
                    role: 'affiliate' as const,
                    title: 'Affiliate Freelance',
                    desc: 'Input lead prospek pelanggan, pantau status aktivasi, dan terima komisi 60%.',
                    icon: Users,
                  },
                ]
              ).map((item) => {
                const Icon = item.icon;
                const active = selectedRole === item.role;
                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => onSelectRole(item.role)}
                    className={`flex w-full items-start gap-3.5 rounded-[14px] border p-4 text-left transition ${
                      active
                        ? 'border-[#0284C7] bg-[#E6F4F9]'
                        : 'border-[#D8E3E9] bg-white hover:bg-[#F5F8FA]'
                    }`}
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] ${
                        active
                          ? 'bg-[#0284C7] text-white'
                          : 'bg-[#EAF2F6] text-[#17324D]'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[#17324D]">
                          {item.title}
                        </span>
                        {active && (
                          <CheckCircle2 className="h-4 w-4 text-[#0284C7]" />
                        )}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-[#526675]">
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => onEnterPortal(selectedRole)}
              className="mt-6 h-11 w-full rounded-[10px] bg-[#0284C7] text-sm font-semibold text-white transition hover:bg-[#0369A1]"
            >
              Lanjut ke Portal
            </button>
          </div>
        )}
      </div>


    </div>
  );
}
