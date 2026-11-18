'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { AgentzyLogo } from '@/components/brand/AgentzyLogo';
import type { AgentzyInvitation } from '@/apps/web/lib/api-client';

export function WorkforceIdentityGate({
  onLogin, onGoogleLogin, onSignOut, onAcceptInvitation, invitations, loading, error,
}: {
  onLogin: (email: string, password: string) => Promise<void>;
  onGoogleLogin: () => Promise<void>;
  onSignOut?: () => Promise<void>;
  onAcceptInvitation: (invitation: AgentzyInvitation) => Promise<void>;
  invitations: AgentzyInvitation[];
  loading: boolean;
  error?: string | null;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setLocalError(null);
    try { await onLogin(email.trim(), password); }
    catch (cause) { setLocalError(cause instanceof Error ? cause.message : 'Autentikasi gagal.'); }
    finally { setSubmitting(false); }
  };
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--az-surface-canvas)] px-4 py-8">
      <section className="w-full max-w-md rounded-[20px] border border-[var(--az-border-default)] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center text-center">
          <AgentzyLogo variant="light" size="lg" />
          <div className="mt-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--az-surface-sky)] text-[var(--az-brand-azure)]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-[var(--az-brand-navy)]">Human Workforce Portal</h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--az-text-secondary)]">
            Masuk menggunakan akun Agentzy yang telah diundang dan memiliki membership Workforce aktif.
          </p>
        </div>
        {(localError || error) && <p role="alert" className="mt-5 rounded-lg border border-[var(--az-danger)]/25 bg-[var(--az-danger)]/5 px-3 py-2.5 text-xs text-[var(--az-danger)]">{localError || error}</p>}
        {invitations.length > 0 && (
          <div className="mt-5 rounded-xl border border-[var(--az-border-default)] p-4">
            <h2 className="text-sm font-semibold text-[var(--az-text-primary)]">Undangan membership</h2>
            <p className="mt-1 text-xs text-[var(--az-text-secondary)]">Setujui undangan setelah masuk dengan email yang menerima undangan.</p>
            <div className="mt-3 space-y-2">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between gap-3 rounded-lg bg-[var(--az-surface-canvas)] p-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-[var(--az-text-primary)]">{invitation.tenant_name}</p>
                    <p className="mt-1 text-[10px] text-[var(--az-text-muted)]">{invitation.role_keys.join(', ')}</p>
                  </div>
                  <button type="button" disabled={loading || acceptingId !== null}
                    onClick={() => {
                      setAcceptingId(invitation.id);
                      setLocalError(null);
                      void onAcceptInvitation(invitation)
                        .catch((cause) => setLocalError(cause instanceof Error ? cause.message : 'Gagal menerima undangan.'))
                        .finally(() => setAcceptingId(null));
                    }}
                    className="shrink-0 rounded-lg bg-[var(--az-brand-azure)] px-3 py-2 text-[11px] font-semibold text-white disabled:opacity-60">
                    {acceptingId === invitation.id ? 'Memproses…' : 'Terima'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-[var(--az-text-primary)]">Email</span>
            <span className="relative block">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--az-text-muted)]" />
              <input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 w-full rounded-[10px] border border-[var(--az-border-default)] bg-white pl-10 pr-3 text-sm outline-none focus:border-[var(--az-brand-azure)]" />
            </span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-[var(--az-text-primary)]">Password</span>
            <span className="relative block">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--az-text-muted)]" />
              <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 w-full rounded-[10px] border border-[var(--az-border-default)] bg-white pl-10 pr-3 text-sm outline-none focus:border-[var(--az-brand-azure)]" />
            </span>
          </label>
          <div className="flex justify-end">
            <Link href="/auth/recovery" className="text-xs font-semibold text-[var(--az-brand-azure)] hover:underline">
              Lupa kata sandi?
            </Link>
          </div>
          <button type="submit" disabled={submitting || loading} className="h-11 w-full rounded-[10px] bg-[var(--az-brand-azure)] text-sm font-semibold text-white transition hover:bg-[var(--az-brand-azure-hover)] disabled:cursor-not-allowed disabled:opacity-60">{submitting ? 'Memverifikasi…' : 'Masuk'}</button>
        </form>
        <div className="my-4 flex items-center gap-3 text-[11px] text-[var(--az-text-muted)]"><span className="h-px flex-1 bg-[var(--az-border-default)]" />atau<span className="h-px flex-1 bg-[var(--az-border-default)]" /></div>
        <button type="button" disabled={submitting || loading} onClick={() => void onGoogleLogin().catch((cause) => setLocalError(cause instanceof Error ? cause.message : 'Google sign-in gagal.'))} className="h-11 w-full rounded-[10px] border border-[var(--az-border-default)] bg-white text-sm font-semibold text-[var(--az-text-primary)] hover:bg-[var(--az-surface-canvas)] disabled:opacity-60">Lanjutkan dengan Google</button>
        {onSignOut && <button type="button" onClick={() => void onSignOut()} className="mt-4 w-full text-xs font-semibold text-[var(--az-text-muted)] hover:text-[var(--az-text-primary)]">Keluar dari sesi tersimpan</button>}
        <p className="mt-5 text-center text-[11px] leading-relaxed text-[var(--az-text-muted)]">Pendaftaran mandiri tidak tersedia. Akses diberikan melalui undangan dan verifikasi identitas.</p>
      </section>
    </main>
  );
}
