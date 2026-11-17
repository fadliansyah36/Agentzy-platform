'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AgentzyLogo } from '@/components/brand/AgentzyLogo';
import { getSupabaseBrowserClient } from '@/apps/web/lib/supabase/client';

export function AdminMfaSetupForm() {
  const router = useRouter();
  const [factorId, setFactorId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    async function prepare() {
      const client = getSupabaseBrowserClient();
      if (!client) {
        setError('Konfigurasi Supabase belum tersedia.');
        setLoading(false);
        return;
      }
      const { data: sessionData, error: sessionError } = await client.auth.getSession();
      if (!active) return;
      if (sessionError) {
        setError(sessionError.message);
        setLoading(false);
        return;
      }
      if (!sessionData.session) {
        setError('Silakan masuk dengan email dan kata sandi terlebih dahulu, lalu buka halaman Setup MFA.');
        setLoading(false);
        return;
      }
      const { data: factors, error: factorsError } = await client.auth.mfa.listFactors();
      if (!active) return;
      if (factorsError) {
        setError(factorsError.message);
        setLoading(false);
        return;
      }
      const existing = factors.totp.find((factor) => factor.status === 'verified');
      if (existing) {
        setReady(true);
        setLoading(false);
        return;
      }
      const { data, error: enrollError } = await client.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Agentzy Super Admin',
      });
      if (!active) return;
      if (enrollError) setError(enrollError.message);
      else {
        setFactorId(data.id);
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
      }
      setLoading(false);
    }
    void prepare();
    return () => { active = false; };
  }, []);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!factorId || !/^\\d{6}$/.test(code)) {
      setError('Masukkan kode 6 digit dari aplikasi authenticator.');
      return;
    }
    const client = getSupabaseBrowserClient();
    if (!client) {
      setError('Konfigurasi Supabase belum tersedia.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { data: challenge, error: challengeError } = await client.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;
      const { error: verifyError } = await client.auth.mfa.verify({ factorId, challengeId: challenge.id, code });
      if (verifyError) throw verifyError;
      const { data: sessionData, error: sessionError } = await client.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData.session) throw new Error('Session tidak ditemukan setelah verifikasi MFA.');
      const { data: aal, error: aalError } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalError) throw aalError;
      if (aal.currentLevel !== 'aal2') throw new Error('Verifikasi MFA belum mencapai assurance level aal2.');
      router.replace('/admin');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Verifikasi MFA gagal.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F8FA] px-4 py-10">
      <section className="w-full max-w-lg rounded-[18px] border border-[#D8E3E9] bg-white p-6 shadow-sm sm:p-8">
        <AgentzyLogo variant="light" size="lg" />
        <p className="mt-6 text-xs font-semibold text-[#0284C7]">SECURITY SETUP</p>
        <h1 className="mt-2 text-2xl font-bold text-[#17324D]">Aktivasi MFA TOTP</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#526675]">
          Super Admin hanya dapat masuk dengan session Supabase pada assurance level aal2.
        </p>
        {loading && <p className="mt-6 text-sm text-[#526675]">Memeriksa session dan faktor MFA…</p>}
        {ready && !loading && <div className="mt-6 rounded-[10px] border border-[#247A55]/30 bg-[#247A55]/10 p-3 text-sm text-[#247A55]">Faktor MFA TOTP sudah terdaftar. Keluar lalu masuk kembali ke Super Admin menggunakan kode authenticator.</div>}
        {qrCode && !loading && (
          <form onSubmit={verify} className="mt-6 space-y-4">
            <div className="rounded-[12px] border border-[#D8E3E9] bg-white p-4 text-center">
              <img src={qrCode} alt="QR code untuk MFA TOTP Agentzy" className="mx-auto h-48 w-48" />
              <p className="mt-3 text-xs text-[#526675]">Pindai QR menggunakan aplikasi authenticator.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#172B3A]">Secret manual (jaga kerahasiaannya)</label>
              <code className="block break-all rounded-[8px] bg-[#F5F8FA] p-3 text-xs text-[#17324D]">{secret}</code>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[#172B3A]">Kode verifikasi 6 digit</span>
              <input required inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code}
                onChange={(event) => setCode(event.target.value.replace(/\\D/g, '').slice(0,6))}
                className="font-mono-tabular h-11 w-full rounded-[10px] border border-[#D8E3E9] px-3 text-center text-lg tracking-[0.35em] outline-none focus:border-[#0284C7]" />
            </label>
            <button disabled={busy} type="submit" className="h-11 w-full rounded-[10px] bg-[#17324D] text-sm font-semibold text-white hover:bg-[#245477] disabled:opacity-60">
              {busy ? 'Memverifikasi…' : 'Verifikasi dan Aktifkan MFA'}
            </button>
          </form>
        )}
        {error && <p role="alert" className="mt-4 rounded-[8px] border border-[#B23A48]/30 bg-[#B23A48]/10 px-3 py-2 text-xs font-medium text-[#B23A48]">{error}</p>}
        <div className="mt-5 border-t border-[#EAF2F6] pt-4 text-xs text-[#526675]">
          <Link href="/admin" className="font-semibold text-[#0284C7] hover:underline">Kembali ke Super Admin Login</Link>
        </div>
      </section>
    </main>
  );
}
