'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/apps/web/lib/supabase/client';
import { AgentzyLogo } from '@/components/brand/AgentzyLogo';

export default function PasswordRecoveryPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [returnPath, setReturnPath] = useState('/admin');
  const [phase, setPhase] = useState<'request' | 'sent' | 'reset' | 'done'>('request');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    let alive = true;
    const params = new URLSearchParams(window.location.search);
    const requestedReturn = params.get('returnTo');
    const allowedReturnPaths = new Set(['/admin', '/corporate', '/ai-workforce', '/workforce']);
    if (requestedReturn && allowedReturnPaths.has(requestedReturn)) {
      setReturnPath(requestedReturn);
    }
    const errorCode = params.get('error_code');
    if (errorCode) {
      setError(
        errorCode === 'otp_expired'
          ? 'Tautan pemulihan sudah kedaluwarsa. Minta tautan baru.'
          : 'Tautan pemulihan tidak valid. Minta tautan baru.'
      );
      setPhase('request');
    }
    void client.auth.getSession().then(({ data }) => {
      if (!alive) return;
      const recovery = Boolean(data.session);
      setHasRecoverySession(recovery);
      if (recovery) setPhase('reset');
    });
    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      if (!alive) return;
      if (event === 'PASSWORD_RECOVERY' || session) {
        setHasRecoverySession(true);
        setPhase('reset');
      }
    });
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  const requestReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const client = getSupabaseBrowserClient();
    if (!client) {
      setError('Konfigurasi Supabase belum tersedia.');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await client.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/recovery?returnTo=${encodeURIComponent(returnPath)}`,
      });
      setPhase('sent');
      setMessage('Jika alamat email terdaftar, instruksi pemulihan akan dikirim. Periksa inbox dan folder spam.');
    } catch {
      setMessage('Jika alamat email terdaftar, instruksi pemulihan akan dikirim. Periksa inbox dan folder spam.');
      setPhase('sent');
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const client = getSupabaseBrowserClient();
    if (!client) {
      setError('Konfigurasi Supabase belum tersedia.');
      return;
    }
    if (!hasRecoverySession) {
      setError('Sesi pemulihan tidak valid atau sudah kedaluwarsa. Minta tautan pemulihan baru.');
      return;
    }
    if (password.length < 12) {
      setError('Kata sandi baru minimal 12 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak sama.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: updateError } = await client.auth.updateUser({ password });
      if (updateError) throw updateError;
      await client.auth.signOut({ scope: 'global' });
      setPhase('done');
      setHasRecoverySession(false);
      setMessage('Kata sandi berhasil diperbarui. Silakan masuk kembali menggunakan kata sandi baru.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Kata sandi tidak dapat diperbarui.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F8FA] px-4 py-8">
      <section className="w-full max-w-md rounded-[20px] border border-[#D8E3E9] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center text-center">
          <AgentzyLogo variant="light" size="lg" />
          <h1 className="mt-6 text-xl font-bold text-[#17324D]">Pemulihan Kata Sandi</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#526675]">
            Pemulihan identitas menggunakan Supabase Auth untuk seluruh portal Agentzy.
          </p>
        </div>

        {error && <p role="alert" className="mt-5 rounded-lg border border-[#B23A48]/30 bg-[#B23A48]/5 px-3 py-2.5 text-xs text-[#B23A48]">{error}</p>}
        {message && <p role="status" className="mt-5 rounded-lg border border-[#247A55]/25 bg-[#247A55]/5 px-3 py-2.5 text-xs text-[#247A55]">{message}</p>}

        {phase === 'request' && (
          <form onSubmit={requestReset} className="mt-6 space-y-4">
            <label className="block text-left text-xs font-semibold text-[#17324D]">
              Email akun Agentzy
              <input
                type="email" required autoComplete="email" value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1.5 h-11 w-full rounded-[10px] border border-[#D8E3E9] px-3 text-sm outline-none focus:border-[#0284C7]"
              />
            </label>
            <button disabled={loading} className="h-11 w-full rounded-[10px] bg-[#17324D] text-sm font-semibold text-white disabled:opacity-60">
              {loading ? 'Mengirim…' : 'Kirim tautan pemulihan'}
            </button>
          </form>
        )}

        {phase === 'sent' && (
          <div className="mt-6 space-y-3">
            <button onClick={() => setPhase('request')} className="h-11 w-full rounded-[10px] border border-[#D8E3E9] text-sm font-semibold text-[#17324D]">
              Kirim ulang atau gunakan email lain
            </button>
          </div>
        )}

        {phase === 'reset' && (
          <form onSubmit={updatePassword} className="mt-6 space-y-4">
            <label className="block text-left text-xs font-semibold text-[#17324D]">
              Kata sandi baru
              <input
                type="password" required minLength={12} autoComplete="new-password"
                value={password} onChange={(event) => setPassword(event.target.value)}
                className="mt-1.5 h-11 w-full rounded-[10px] border border-[#D8E3E9] px-3 text-sm outline-none focus:border-[#0284C7]"
              />
            </label>
            <label className="block text-left text-xs font-semibold text-[#17324D]">
              Konfirmasi kata sandi baru
              <input
                type="password" required minLength={12} autoComplete="new-password"
                value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-1.5 h-11 w-full rounded-[10px] border border-[#D8E3E9] px-3 text-sm outline-none focus:border-[#0284C7]"
              />
            </label>
            <button disabled={loading} className="h-11 w-full rounded-[10px] bg-[#17324D] text-sm font-semibold text-white disabled:opacity-60">
              {loading ? 'Memperbarui…' : 'Perbarui kata sandi'}
            </button>
          </form>
        )}

        {phase === 'done' && (
          <Link href={returnPath} className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-[10px] bg-[#17324D] text-sm font-semibold text-white">
            Kembali ke halaman masuk
          </Link>
        )}
        {phase !== 'done' && (
          <Link href="/" className="mt-5 inline-flex w-full justify-center text-xs font-semibold text-[#0284C7]">
            Kembali ke Agentzy
          </Link>
        )}
      </section>
    </main>
  );
}
