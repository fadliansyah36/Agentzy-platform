'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { getMyIdentity, getMyTenants, type AgentzyIdentity, type AgentzyTenant } from '@/apps/web/lib/api-client';
import { getSupabaseBrowserClient } from '@/apps/web/lib/supabase/client';

type AuthSnapshot = { session: Session | null; identity: AgentzyIdentity | null; tenants: AgentzyTenant[] };
type AuthContext = { session: Session; identity: AgentzyIdentity; tenants: AgentzyTenant[] };

async function loadContext(session: Session): Promise<AuthContext> {
  const [identity, tenants] = await Promise.all([
    getMyIdentity(session.access_token),
    getMyTenants(session.access_token),
  ]);
  return { session, identity, tenants };
}

export function useAgentzyAuth() {
  const [snapshot, setSnapshot] = useState<AuthSnapshot>({ session: null, identity: null, tenants: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hydrate = useCallback(async (_client: SupabaseClient, session: Session | null) => {
    if (!session) {
      setSnapshot({ session: null, identity: null, tenants: [] });
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const context = await loadContext(session);
      setSnapshot(context);
      setError(null);
    } catch (cause) {
      setSnapshot({ session, identity: null, tenants: [] });
      setError(cause instanceof Error ? cause.message : 'Gagal memuat identitas Agentzy.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      setError('Konfigurasi Supabase belum tersedia. Atur NEXT_PUBLIC_SUPABASE_URL dan publishable/anon key.');
      setLoading(false);
      return;
    }
    let alive = true;
    void client.auth.getSession().then(({ data, error: sessionError }) => {
      if (!alive) return;
      if (sessionError) setError(sessionError.message);
      void hydrate(client, data.session);
    });
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (alive) void hydrate(client, session);
    });
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, [hydrate]);

  const signIn = useCallback(async (email: string, password: string, requireMfa = false, mfaCode?: string) => {
    const client = getSupabaseBrowserClient();
    if (!client) throw new Error('Konfigurasi Supabase belum tersedia.');
    const { data, error: signInError } = await client.auth.signInWithPassword({ email, password });
    if (signInError) throw signInError;
    if (!data.session) throw new Error('Supabase tidak mengembalikan session aktif.');

    if (requireMfa) {
      const { data: assurance, error: assuranceError } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assuranceError) throw assuranceError;
      if (assurance.currentLevel !== 'aal2') {
        const { data: factors, error: factorsError } = await client.auth.mfa.listFactors();
        if (factorsError) throw factorsError;
        const factor = factors.totp.find((item) => item.status === 'verified');
        if (!factor) throw new Error('Akun Super Admin wajib memiliki MFA TOTP terverifikasi.');
        if (!mfaCode || !/^\\d{6}$/.test(mfaCode)) throw new Error('Masukkan kode MFA 6 digit dari authenticator.');
        const { data: challenge, error: challengeError } = await client.auth.mfa.challenge({ factorId: factor.id });
        if (challengeError) throw challengeError;
        const { error: verifyError } = await client.auth.mfa.verify({
          factorId: factor.id, challengeId: challenge.id, code: mfaCode,
        });
        if (verifyError) throw verifyError;
      }
    }

    const context = await loadContext(data.session);
    setSnapshot(context);
    setError(null);
    setLoading(false);
    return context;
  }, []);

  const signInWithOAuth = useCallback(async () => {
    const client = getSupabaseBrowserClient();
    if (!client) throw new Error('Konfigurasi Supabase belum tersedia.');
    const { error: oauthError } = await client.auth.signInWithOAuth({
      provider: 'google', options: { redirectTo: window.location.href },
    });
    if (oauthError) throw oauthError;
  }, []);

  const signOut = useCallback(async () => {
    const client = getSupabaseBrowserClient();
    if (client) {
      const { error: signOutError } = await client.auth.signOut();
      if (signOutError) throw signOutError;
    }
    setSnapshot({ session: null, identity: null, tenants: [] });
    setError(null);
    setLoading(false);
  }, []);

  return { ...snapshot, loading, error, signIn, signInWithOAuth, signOut };
}
