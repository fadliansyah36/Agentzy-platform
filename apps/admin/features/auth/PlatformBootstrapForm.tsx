'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AgentzyLogo } from '@/components/brand/AgentzyLogo';

export function PlatformBootstrapForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);
    const base = (process.env.NEXT_PUBLIC_AGENTZY_API_URL ?? '').replace(/\/$/, '');
    if (!base) {
      setError('NEXT_PUBLIC_AGENTZY_API_URL belum dikonfigurasi.');
      setBusy(false);
      return;
    }
    try {
      const response = await fetch(`${base}/api/v1/bootstrap/platform-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Platform-Bootstrap-Token': token },
        body: JSON.stringify({ full_name: fullName, email }),
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.detail ?? 'Bootstrap administrator gagal.');
      setMessage(payload.message ?? 'Undangan administrator berhasil dikirim.');
      setToken('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Bootstrap administrator gagal.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F8FA] px-4 py-10">
      <section className="w-full max-w-lg rounded-[18px] border border-[#D8E3E9] bg-white p-6 shadow-sm sm:p-8">
        <AgentzyLogo variant="light" size="lg" />
        <p className="mt-6 text-xs font-semibold text-[#0284C7]">INITIAL PLATFORM SETUP</p>
        <h1 className="mt-2 text-2xl font-bold text-[#17324D]">Bootstrap Super Admin</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#526675]">
          Buat undangan administrator platform pertama. Endpoint hanya dapat dipakai satu kali dan memerlukan bootstrap token rahasia yang dikonfigurasi pada service FastAPI.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-[#172B3A]">Nama lengkap</span>
            <input required maxLength={120} value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="h-11 w-full rounded-[10px] border border-[#D8E3E9] px-3 text-sm outline-none focus:border-[#0284C7]" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-[#172B3A]">Email administrator</span>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-[10px] border border-[#D8E3E9] px-3 text-sm outline-none focus:border-[#0284C7]" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-[#172B3A]">Bootstrap token</span>
            <input required type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)}
              className="h-11 w-full rounded-[10px] border border-[#D8E3E9] px-3 text-sm outline-none focus:border-[#0284C7]" />
          </label>
          {error && <p role="alert" className="rounded-[8px] border border-[#B23A48]/30 bg-[#B23A48]/10 px-3 py-2 text-xs font-medium text-[#B23A48]">{error}</p>}
          {message && <p role="status" className="rounded-[8px] border border-[#247A55]/30 bg-[#247A55]/10 px-3 py-2 text-xs font-medium text-[#247A55]">{message}</p>}
          <button disabled={busy} type="submit"
            className="h-11 w-full rounded-[10px] bg-[#17324D] text-sm font-semibold text-white transition hover:bg-[#245477] disabled:opacity-60">
            {busy ? 'Memproses undangan…' : 'Kirim Undangan Super Admin'}
          </button>
        </form>
        <div className="mt-5 border-t border-[#EAF2F6] pt-4 text-xs text-[#526675]">
          <Link href="/admin" className="font-semibold text-[#0284C7] hover:underline">Kembali ke Super Admin Login</Link>
        </div>
      </section>
    </main>
  );
}
