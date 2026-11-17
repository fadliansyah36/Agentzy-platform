'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { getMyIdentity, getMyTenants, type AgentzyIdentity, type AgentzyTenant } from '@/apps/web/lib/api-client';
import { getSupabaseBrowserClient } from '@/apps/web/lib/supabase/client';

type AuthSnapshot = {
  session: Session | null;
  identity: AgentzyIdentity | null;
  tenants: AgentzyTenant[];
};

export function useAgentzyAuth() {
  const [snapshot, setSnapshot] = useState<AuthSnapshot>({ session: null, identity: null, tenants: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hydrate = useCallback(async (client: SupabaseClient, session: Session | null) => {
    if (!session) {
      setSnapshot({ session: null, identity: null, tenants: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [identity, tenants] = await Promise.all([
        getMyIdentity(session.access_token),
        getMyTenants(session.access_token),
      ]);
      setSnapshot({ session, identity, tenants });
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
      if (!alive) return;
      void hydrate(client, session);
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, [hydrate]);

  const signIn = useCallback(async (email: string, password: string, requireMfa = false) => {
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
        const { data: challenge, error: challengeError } = await client.auth.mfa.challenge({ factorId: factor.id });
        if (challengeError) throw challengeError;
        throw new Error('MFA_CHALLENGE_REQUIRED:' + challenge.id + ':' + factor.id);
      }
    }

    await hydrate(client, data.session);
    return data.session;
  }, [hydrate]);

  const verifyMfa = useCallback(async (challengeId: string, factorId: string, code: string) => {
    const client = getSupabaseBrowserClient();
    if (!client) throw new Error('Konfigurasi Supabase belum tersedia.');
    const { error: verifyError } = await client.auth.mfa.verify({ factorId, challengeId, code });
    if (verifyError) throw verifyError;
    const { data } = await client.auth.getSession();
    await hydrate(client, data.session);
  }, [hydrate]);

  const signInWithOAuth = useCallback(async () => {
    const client = getSupabaseBrowserClient();
    if (!client) throw new Error('Konfigurasi Supabase belum tersedia.');
    const { error: oauthError } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href },
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
  }, []);

  return {
    ...snapshot,
    loading,
    error,
    signIn,
    verifyMfa,
    signInWithOAuth,
    signOut,
    refresh: () => hydrate(getSupabaseBrowserClient() as SupabaseClient, snapshot.session),
  };
}
