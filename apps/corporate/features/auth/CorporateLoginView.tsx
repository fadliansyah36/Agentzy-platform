'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  ChevronDown,
  Lock,
  Mail,
} from 'lucide-react';
import { AgentzyLogo } from '@/components/brand/AgentzyLogo';
import { CORPORATE_TENANTS } from '../../lib/corporate-data';

export function CorporateLoginView({
  initialTenantId,
  onLogin,
}: {
  initialTenantId: string;
  onLogin: (tenantId: string, email: string, method: 'password' | 'sso') => void;
}) {
  const [selectedTenantId, setSelectedTenantId] = useState(initialTenantId);
  const [email, setEmail] = useState('corp@isp.co.id');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedTenant =
    CORPORATE_TENANTS.find((t) => t.id === selectedTenantId) ?? CORPORATE_TENANTS[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Email perusahaan dan kata sandi wajib diisi.');
      return;
    }
    setErrorMsg(null);
    onLogin(selectedTenantId, email.trim(), 'password');
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[#F5F8FA] px-4 py-8 sm:px-6">
      <div className="mx-auto grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-[20px] border border-[#D8E3E9] bg-white shadow-sm lg:grid-cols-12">
        {/* Left Brand Context Panel (Desktop) */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between bg-[#17324D] p-8 text-white">
          <div>
            <AgentzyLogo variant="dark" size="lg" />
            <p className="mt-6 text-xs font-semibold text-[#87CEEB]">
              Corporate / ISP Partner Portal
            </p>
            <h1 className="mt-2 text-2xl font-bold leading-snug text-white">
              Satu Kendali untuk Human Workforce &amp; Managed AI Workforce
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[#CFE3EE]">
              Pantau produktivitas Staff Sales, jaringan Affiliate, Work Order
              teknisi lapangan, rekonsiliasi komisi, serta penggunaan AI Credits
              dalam isolasi tenant penuh.
            </p>
          </div>

          <div className="space-y-3 border-t border-white/10 pt-5 text-xs text-[#ADD8E6]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-[#87CEEB]" />
              <span>Isolasi Data Tenant (RLS) &amp; Akses RBAC Teraudit</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 shrink-0 text-[#87CEEB]" />
              <span>Mendukung SSO Enterprise (OIDC / SAML) &amp; MFA</span>
            </div>
          </div>
        </div>

        {/* Right Login Form & Tenant Selector (Matches Screen 1 in UI/UX Image) */}
        <div className="p-6 sm:p-8 lg:col-span-7">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="lg:hidden">
              <AgentzyLogo variant="light" size="lg" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-[#17324D] lg:mt-0">
              Corporate Portal
            </h2>
            <p className="mt-1 text-sm text-[#526675]">
              Masuk ke akun perusahaan Anda
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="corp-email"
                className="mb-1.5 block text-xs font-semibold text-[#172B3A]"
              >
                Email perusahaan
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5F879E]" />
                <input
                  id="corp-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="corp@isp.co.id"
                  className="h-11 w-full rounded-[10px] border border-[#D8E3E9] bg-white pl-10 pr-4 text-sm text-[#172B3A] outline-none transition focus:border-[#0284C7] focus:ring-2 focus:ring-[#87CEEB]/40"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="corp-password"
                className="mb-1.5 block text-xs font-semibold text-[#172B3A]"
              >
                Kata sandi
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5F879E]" />
                <input
                  id="corp-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 w-full rounded-[10px] border border-[#D8E3E9] bg-white pl-10 pr-11 text-sm text-[#172B3A] outline-none transition focus:border-[#0284C7] focus:ring-2 focus:ring-[#87CEEB]/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#526675] hover:bg-[#EAF2F6]"
                  aria-label={showPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {errorMsg && (
              <p className="rounded-[8px] border border-[#B23A48]/30 bg-[#B23A48]/10 px-3 py-2 text-xs font-medium text-[#B23A48]">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#0284C7] text-sm font-semibold text-white transition hover:bg-[#0369A1]"
            >
              <span>Masuk</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#D8E3E9]" />
            <span className="text-xs font-medium text-[#718391]">atau</span>
            <div className="h-px flex-1 bg-[#D8E3E9]" />
          </div>

          <button
            type="button"
            onClick={() => onLogin(selectedTenantId, email.trim() || 'sso@isp.co.id', 'sso')}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-[#B8C9D3] bg-white text-sm font-semibold text-[#17324D] transition hover:bg-[#E6F4F9]"
          >
            <ShieldCheck className="h-4 w-4 text-[#0284C7]" />
            <span>Masuk dengan SSO</span>
          </button>

          {/* Tenant / Perusahaan Selector */}
          <div className="mt-6 border-t border-[#EAF2F6] pt-5">
            <label
              htmlFor="tenant-selector"
              className="mb-2 block text-xs font-semibold text-[#172B3A]"
            >
              Pilih Tenant / Perusahaan
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg bg-[#E6F4F9] text-[#0284C7]">
                <Building2 className="h-4 w-4" />
              </div>
              <select
                id="tenant-selector"
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="h-14 w-full appearance-none rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] pl-12 pr-10 text-sm font-bold text-[#17324D] outline-none transition focus:border-[#0284C7] focus:bg-white"
              >
                {CORPORATE_TENANTS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (ID: {t.code} · {t.status})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#526675]" />
            </div>
            <p className="mt-2 text-xs text-[#526675]">
              {selectedTenant.legalName} · {selectedTenant.region}
            </p>
          </div>

          <div className="mt-5 flex items-center justify-between text-xs text-[#526675]">
            <Link href="/" className="font-medium hover:text-[#17324D] hover:underline">
              Kembali ke Landing Page
            </Link>
            <Link href="/workforce" className="font-semibold text-[#0284C7] hover:underline">
              Human Workforce Portal →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
