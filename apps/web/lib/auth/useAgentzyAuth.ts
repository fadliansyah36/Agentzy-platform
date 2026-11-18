'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { getMyIdentity, getMyTenants, revokeMySessions, type AgentzyIdentity, type AgentzyTenant } from '@/apps/web/lib/api-client';
import { getSupabaseBrowserClient } from '@/apps/web/lib/supabase/client';

type AuthSnapshot = {
  session: Session | null;
  identity: AgentzyIdentity | null;
  tenants: AgentzyTenant[];
  aal: string | null;
};
type AuthContext = {
  session: Session;
  identity: AgentzyIdentity;
  tenants: AgentzyTenant[];
  aal: string | null;
};

async function loadContext(client: SupabaseClient, session: Session): Promise<AuthContext> {
  const [identity, tenants, assurance] = await Promise.all([
    getMyIdentity(session.access_token),
    getMyTenants(session.access_token),
    client.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);
  if (assurance.error) throw assurance.error;
  return { session, identity, tenants, aal: assurance.data.currentLevel };
}

export function useAgentzyAuth() {
  const [client] = useState(() => getSupabaseBrowserClient());
  const [snapshot, setSnapshot] = useState<AuthSnapshot>({ session: null, identity: null, tenants: [], aal: null });
  const hydrationVersion = useRef(0);
  const [loading, setLoading] = useState(() => Boolean(client));
  const [error, setError] = useState<string | null>(() =>
    client ? null : 'Konfigurasi Supabase belum tersedia. Atur NEXT_PUBLIC_SUPABASE_URL dan publishable/anon key.'
  );

  const hydrate = useCallback(async (client: SupabaseClient, session: Session | null) => {
    const version = ++hydrationVersion.current;
    if (!session) {
      setSnapshot({ session: null, identity: null, tenants: [], aal: null });
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const context = await loadContext(client, session);
      if (version !== hydrationVersion.current) return;
      setSnapshot(context);
      setError(null);
    } catch (cause) {
      if (version !== hydrationVersion.current) return;
      setSnapshot({ session, identity: null, tenants: [], aal: null });
      setError(cause instanceof Error ? cause.message : 'Gagal memuat identitas Agentzy.');
    } finally {
      if (version === hydrationVersion.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!client) return;
    let alive = true;
    void client.auth.getSession().then(({ data, error: sessionError }) => {
      if (!alive) return;
      if (sessionError) {
        setError(sessionError.message);
        setLoading(false);
        return;
      }
      void hydrate(client, data.session);
    });
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (alive) void hydrate(client, session);
    });
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, [client, hydrate]);

  const signIn = useCallback(async (email: string, password: string, requireMfa = false, mfaCode?: string) => {
    const client = getSupabaseBrowserClient();
    if (!client) throw new Error('Konfigurasi Supabase belum tersedia.');
    const credentials = email.includes('@') ? { email, password } : { phone: email, password };
    const { data, error: signInError } = await client.auth.signInWithPassword(credentials);
    if (signInError) throw signInError;
    if (!data.session) throw new Error('Supabase tidak mengembalikan session aktif.');
    let session = data.session;

    if (requireMfa) {
      const { data: assurance, error: assuranceError } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assuranceError) throw assuranceError;
      if (assurance.currentLevel !== 'aal2') {
        const { data: factors, error: factorsError } = await client.auth.mfa.listFactors();
        if (factorsError) throw factorsError;
        const factor = factors.totp.find((item) => item.status === 'verified');
        if (!factor) {
          const context = await loadContext(client, session);
          setSnapshot(context);
          setError('MFA TOTP belum terdaftar. Selesaikan pendaftaran MFA sebelum membuka Super Admin.');
          setLoading(false);
          return context;
        }
        if (!mfaCode || !/^\\d{6}$/.test(mfaCode)) {
          throw new Error('Masukkan kode MFA 6 digit dari authenticator.');
        }
        const { data: challenge, error: challengeError } = await client.auth.mfa.challenge({ factorId: factor.id });
        if (challengeError) throw challengeError;
        const { error: verifyError } = await client.auth.mfa.verify({
          factorId: factor.id, challengeId: challenge.id, code: mfaCode,
        });
        if (verifyError) throw verifyError;
        const refreshed = await client.auth.getSession();
        if (refreshed.error) throw refreshed.error;
        session = refreshed.data.session ?? session;
      }
    }

    const context = await loadContext(client, session);
    setSnapshot(context);
    setError(null);
    setLoading(false);
    return context;
  }, []);

  const refresh = useCallback(async () => {
    if (!client) throw new Error('Konfigurasi Supabase belum tersedia.');
    const { data, error: sessionError } = await client.auth.getSession();
    if (sessionError) throw sessionError;
    await hydrate(client, data.session);
  }, [client, hydrate]);

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
      const { data, error: sessionError } = await client.auth.getSession();
      if (sessionError) throw sessionError;
      let serverRevoked = false;
      if (data.session) {
        try {
          await revokeMySessions(data.session.access_token);
          serverRevoked = true;
        } catch {
          // Fall back to Supabase Auth global sign-out if the API cannot revoke sessions.
        }
      }
      const { error: signOutError } = await client.auth.signOut({
        scope: serverRevoked ? 'local' : 'global',
      });
      if (signOutError) throw signOutError;
    }
    setSnapshot({ session: null, identity: null, tenants: [], aal: null });
    setError(null);
    setLoading(false);
  }, []);

  return { ...snapshot, loading, error, signIn, signInWithOAuth, signOut, refresh };
}
