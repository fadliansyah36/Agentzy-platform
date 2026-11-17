'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ChevronDown,
  KeyRound,
} from 'lucide-react';
import { AgentzyLogo } from '@/components/brand/AgentzyLogo';
import { SUPER_ADMIN_ROLES } from '../../lib/admin-data';
import type { SuperAdminRoleKey } from '../../lib/admin-types';

export function AdminLoginView({
  initialRole,
  onLogin,
}: {
  initialRole: SuperAdminRoleKey;
  onLogin: (role: SuperAdminRoleKey, email: string) => void;
}) {
  const [role, setRole] = useState<SuperAdminRoleKey>(initialRole);
  const [email, setEmail] = useState('superadmin@agentzy.id');
  const [password, setPassword] = useState('••••••••••••');
  const [mfaCode, setMfaCode] = useState('482910');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedRole =
    SUPER_ADMIN_ROLES.find((r) => r.key === role) ?? SUPER_ADMIN_ROLES[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || mfaCode.trim().length < 6) {
      setErrorMsg('Email admin, kata sandi, dan kode MFA 6 digit wajib diisi.');
      return;
    }
    setErrorMsg(null);
    onLogin(role, email.trim());
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[#F5F8FA] px-4 py-8 sm:px-6">
      <div className="mx-auto grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-[20px] border border-[#D8E3E9] bg-white shadow-sm lg:grid-cols-12">
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between bg-[#17324D] p-8 text-white">
          <div>
            <AgentzyLogo variant="dark" size="lg" />
            <p className="mt-6 text-xs font-semibold text-[#87CEEB]">
              Super Admin Control Plane
            </p>
            <h1 className="mt-2 text-2xl font-bold leading-snug text-white">
              Kendali Platform Terpadu: Tenant, AI Gateway, Finance &amp; Keamanan
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[#CFE3EE]">
              Akses tingkat platform dengan kewajiban MFA, pemisahan tugas RBAC,
              persetujuan 2 tahap Break-Glass, serta audit trail immutable untuk setiap
              perubahan kebijakan.
            </p>
          </div>

          <div className="space-y-3 border-t border-white/10 pt-5 text-xs text-[#ADD8E6]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-[#87CEEB]" />
              <span>Multi-Tenant Isolation &amp; RLS Enforcement</span>
            </div>
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 shrink-0 text-[#87CEEB]" />
              <span>Wajib MFA (2FA) &amp; Break-Glass Time-Bound Access</span>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 lg:col-span-7">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="lg:hidden">
              <AgentzyLogo variant="light" size="lg" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-[#17324D] lg:mt-0">
              Super Admin Control Plane
            </h2>
            <p className="mt-1 text-sm text-[#526675]">
              Autentikasi terproteksi MFA untuk administrator platform Agentzy
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="admin-role-select"
                className="mb-1.5 block text-xs font-semibold text-[#172B3A]"
              >
                Role Kontrol Platform
              </label>
              <div className="relative">
                <select
                  id="admin-role-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value as SuperAdminRoleKey)}
                  className="h-11 w-full appearance-none rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] px-3.5 pr-10 text-sm font-bold text-[#17324D] outline-none transition focus:border-[#0284C7] focus:bg-white"
                >
                  {SUPER_ADMIN_ROLES.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#526675]" />
              </div>
              <p className="mt-1 text-xs text-[#526675]">{selectedRole.scope}</p>
            </div>

            <div>
              <label
                htmlFor="admin-email"
                className="mb-1.5 block text-xs font-semibold text-[#172B3A]"
              >
                Email Administrator
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5F879E]" />
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 w-full rounded-[10px] border border-[#D8E3E9] bg-white pl-10 pr-4 text-sm text-[#172B3A] outline-none transition focus:border-[#0284C7]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="admin-password"
                  className="mb-1.5 block text-xs font-semibold text-[#172B3A]"
                >
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5F879E]" />
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 w-full rounded-[10px] border border-[#D8E3E9] bg-white pl-10 pr-10 text-sm text-[#172B3A] outline-none transition focus:border-[#0284C7]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#526675] hover:bg-[#EAF2F6]"
                    aria-label="Toggle sandi"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="admin-mfa"
                  className="mb-1.5 block text-xs font-semibold text-[#172B3A]"
                >
                  Kode MFA (2FA Authenticator)
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5F879E]" />
                  <input
                    id="admin-mfa"
                    type="text"
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    className="font-mono-tabular h-11 w-full rounded-[10px] border border-[#D8E3E9] bg-white pl-10 pr-4 text-sm font-semibold tracking-widest text-[#172B3A] outline-none transition focus:border-[#0284C7]"
                  />
                </div>
              </div>
            </div>

            {errorMsg && (
              <p className="rounded-[8px] border border-[#B23A48]/30 bg-[#B23A48]/10 px-3 py-2 text-xs font-medium text-[#B23A48]">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#17324D] text-sm font-semibold text-white transition hover:bg-[#245477]"
            >
              <span>Masuk ke Control Plane</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-[#EAF2F6] pt-4 text-xs text-[#526675]">
            <Link href="/" className="font-medium hover:text-[#17324D] hover:underline">
              Kembali ke Landing Page
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/corporate" className="font-semibold text-[#0284C7] hover:underline">
                Corporate Portal
              </Link>
              <Link href="/ai-workforce" className="font-semibold text-[#0284C7] hover:underline">
                AI Portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
