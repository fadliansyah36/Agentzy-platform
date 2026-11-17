'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Eye,
  EyeOff,
  GitBranch,
  Lock,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { AgentzyLogo } from '@/components/brand/AgentzyLogo';

export function AIWorkforceLoginView({
  mode,
  initialTenantId,
  onStartFromSplash,
  onLogin,
  onSwitchMode,
}: {
  mode: 'splash' | 'login';
  initialTenantId: string;
  onStartFromSplash: () => void;
  onLogin: (email: string, password: string, method: 'password' | 'sso') => Promise<void>;
  onSwitchMode: (mode: 'splash' | 'login') => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  if (mode === 'splash') {
    return (
      <div className="min-h-screen bg-[#F5F8FA] flex flex-col justify-between px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#526675] hover:text-[#17324D]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Beranda</span>
          </Link>
          <AgentzyLogo variant="light" size="sm" />
        </div>

        <div className="mx-auto my-8 grid w-full max-w-5xl grid-cols-1 items-center gap-8 rounded-[20px] border border-[#D8E3E9] bg-white p-6 shadow-sm sm:p-10 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <AgentzyLogo variant="light" size="lg" />
            <p className="mt-4 text-xs font-semibold text-[#0284C7]">
              AI Workforce Management Portal
            </p>
            <h1
              className="mt-2 text-2xl font-bold tracking-tight text-[#17324D] sm:text-3xl"
              style={{ textWrap: 'balance' }}
            >
              Kelola, Jalankan, dan Kolaborasikan AI Worker Bersama Tim Human Workforce
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[#526675]">
              Pusat kendali terpadu untuk mengelola AI Worker, Content Studio
              untuk Support Staff Sales, Skills &amp; Memory RAG, hingga Workflow
              Orkestrasi &amp; Approval Human-in-the-Loop.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-2.5 text-xs sm:grid-cols-2 sm:gap-3">
              {[
                { icon: Bot, text: 'AI Worker Studio & Registry' },
                { icon: Sparkles, text: 'Generate Content (Sales)' },
                { icon: GitBranch, text: 'Workflow Builder & Runs' },
                { icon: ShieldCheck, text: 'Guardrail & Audit Log' },
              ].map((item) => (
                <div
                  key={item.text}
                  className="flex items-center gap-2 rounded-[10px] border border-[#EAF2F6] bg-[#F5F8FA] px-3 py-2.5 font-semibold text-[#17324D]"
                >
                  <item.icon className="h-4 w-4 shrink-0 text-[#0284C7]" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={onStartFromSplash}
                className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-[10px] bg-[#0284C7] px-6 text-sm font-semibold text-white transition hover:bg-[#0369A1]"
              >
                <span>Mulai Masuk Portal</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onStartFromSplash}
                className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-[10px] border border-[#B8C9D3] bg-white px-5 text-sm font-semibold text-[#17324D] transition hover:bg-[#E6F4F9]"
              >
                <span>Langsung ke Dashboard</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative h-64 overflow-hidden rounded-[14px] border border-[#D8E3E9] bg-[#EAF2F6] sm:h-80">
              <Image
                src="/images/agentzy_human_ai_collab.jpg"
                alt="Kolaborasi AI Worker dan tim Human Workforce dalam portal Agentzy"
                fill
                referrerPolicy="no-referrer"
                className="object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#17324D]/90 via-[#17324D]/45 to-transparent p-4 text-white">
                <p className="text-xs font-medium text-[#ADD8E6]">
                  Tenant Isolated · Human Approval · Auditable Runs
                </p>
                <p className="mt-0.5 text-sm font-bold">
                  Satu Ekosistem AI Workforce untuk ISP &amp; Enterprise
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-[#718391]">
          Agentzy Unified Human &amp; AI Workforce Platform
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F8FA] flex flex-col justify-center px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-md rounded-[18px] border border-[#D8E3E9] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => onSwitchMode('splash')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#526675] hover:text-[#17324D]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Onboarding</span>
          </button>
          <AgentzyLogo variant="light" size="sm" />
        </div>

        <div className="mt-5">
          <h1 className="text-xl font-bold text-[#17324D]">
            Masuk ke Akun Anda
          </h1>
          <p className="mt-1 text-xs text-[#526675]">
            AI Workforce Management Portal · Kelola AI Worker, Workflow &amp; Content Studio
          </p>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setErrorMsg(null);
            setIsSubmitting(true);
            try { await onLogin(email.trim(), password, 'password'); }
            catch (error) { setErrorMsg(error instanceof Error ? error.message : 'Autentikasi gagal.'); }
            finally { setIsSubmitting(false); }
          }}
          className="mt-5 space-y-4"
        >
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#17324D]">
              Email / Nomor HP
            </label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-sm text-[#172B3A] focus:border-[#0284C7] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[#17324D]">
              Kata Sandi
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 w-full rounded-[10px] border border-[#B8C9D3] pl-3 pr-10 text-sm text-[#172B3A] focus:border-[#0284C7] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label="Tampilkan atau sembunyikan sandi"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#526675]"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <label className="flex items-center gap-2 text-[#526675]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 accent-[#0284C7]"
              />
              <span>Ingat saya</span>
            </label>
            <span className="font-medium text-[#0284C7]">
              Akses Terenkripsi
            </span>
          </div>

          <div className="rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] px-3 py-3 text-xs leading-relaxed text-[#526675]">
            Tenant dan akses AI Workforce ditentukan dari membership akun yang diverifikasi oleh Agentzy API.
          </div>

          {errorMsg && <p className="rounded-[8px] border border-[#B23A48]/30 bg-[#B23A48]/10 px-3 py-2 text-xs font-medium text-[#B23A48]">{errorMsg}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full rounded-[10px] bg-[#0284C7] text-sm font-semibold text-white transition hover:bg-[#0369A1] disabled:opacity-60"
          >
            {isSubmitting ? 'Memverifikasi…' : 'Masuk'}
          </button>

          <div className="relative py-1 text-center text-[11px] text-[#718391]">
            <span className="bg-white px-2">atau</span>
            <div className="absolute inset-x-0 top-1/2 -z-10 border-t border-[#EAF2F6]" />
          </div>

          <button
            type="button"
            onClick={async () => {
              setErrorMsg(null);
              setIsSubmitting(true);
              try { await onLogin(email.trim(), '', 'sso'); }
              catch (error) { setErrorMsg(error instanceof Error ? error.message : 'SSO tidak dapat dimulai.'); setIsSubmitting(false); }
            }}
            className="gsi-material-button"
          >
            <span className="gsi-material-button-content-wrapper">
              <Lock className="gsi-material-button-icon text-[#0284C7]" />
              <span className="gsi-material-button-contents">
                Masuk dengan SSO Perusahaan
              </span>
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
