'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Briefcase, Users, RefreshCw, ShieldCheck, Clock } from 'lucide-react';
import { CorporatePageHeader, CorporateSegmentedTabs } from '../../components/data-display/CorporateDataDisplay';
import { listWorkforceProfiles, type WorkforceProfile } from '@/apps/web/lib/api-client';

export function HumanWorkforceView({
  tenantId,
  accessToken,
  onBack,
}: {
  tenantId: string;
  accessToken: string | null;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<'overview' | 'directory'>('overview');
  const [profiles, setProfiles] = useState<WorkforceProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!accessToken || !tenantId) return;
    setRefreshing(true);
    setError(null);
    try {
      const result = await listWorkforceProfiles(accessToken, tenantId);
      setProfiles(result.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Data Workforce gagal dimuat dari Agentzy API.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (!accessToken || !tenantId) return;
    void listWorkforceProfiles(accessToken, tenantId)
      .then((result) => { if (active) { setProfiles(result.data); setError(null); } })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Data Workforce gagal dimuat.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [accessToken, tenantId]);

  const activeCount = profiles.filter((p) => p.lifecycle_status === 'active').length;
  const onboardingCount = profiles.filter((p) => ['registered','identity_pending','verified','onboarding','eligible'].includes(p.lifecycle_status)).length;
  const suspendedCount = profiles.filter((p) => ['inactive','suspended','offboarded'].includes(p.lifecycle_status)).length;
  const groups = useMemo(() => {
    const counts = new Map<string, number>();
    profiles.forEach((p) => {
      const key = p.job_family || p.job_title || 'Belum diklasifikasikan';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return [...counts.entries()].sort((a,b) => b[1]-a[1]);
  }, [profiles]);

  return (
    <div className="space-y-5">
      <CorporatePageHeader
        title="Human Workforce"
        subtitle="Data passport, status lifecycle, engagement, dan kesiapan workforce dari backend Agentzy"
        onBack={onBack}
      />
      <div className="flex items-center justify-between gap-3">
        <CorporateSegmentedTabs
          tabs={[{id:'overview',label:'Overview'},{id:'directory',label:'Directory'}]}
          activeTab={tab}
          onChange={setTab}
        />
        <button type="button" onClick={() => void load()} disabled={refreshing || loading}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#D8E3E9] bg-white px-3 text-xs font-semibold text-[#17324D] disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing?'animate-spin':''}`} /> Refresh
        </button>
      </div>
      {(!accessToken || !tenantId) && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">Sesi atau tenant context tidak tersedia.</div>}
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      {(!accessToken || !tenantId) ? (<div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Sesi atau tenant context tidak tersedia.</div>) : loading ? (
        <div className="rounded-xl border border-[#D8E3E9] bg-white p-8 text-center text-sm text-[#526675]">Memuat workforce dari FastAPI…</div>
      ) : (
        <>
          {tab === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  {label:'Total Workforce',value:profiles.length,icon:Users},
                  {label:'Active',value:activeCount,icon:ShieldCheck},
                  {label:'Onboarding / Eligible',value:onboardingCount,icon:Clock},
                  {label:'Inactive / Suspended',value:suspendedCount,icon:Briefcase},
                ].map((item) => {
                  const Icon=item.icon;
                  return <div key={item.label} className="rounded-[14px] border border-[#D8E3E9] bg-white p-4">
                    <div className="flex items-center justify-between text-[#526675]"><span className="text-xs">{item.label}</span><Icon className="h-4 w-4 text-[#0284C7]"/></div>
                    <p className="mt-2 font-mono-tabular text-2xl font-bold text-[#17324D]">{item.value.toLocaleString('id-ID')}</p>
                  </div>;
                })}
              </div>
              <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4">
                <h3 className="text-sm font-bold text-[#17324D]">Komposisi Job Family</h3>
                {groups.length===0 ? <p className="mt-3 text-xs text-[#718391]">Belum ada Workforce Passport pada tenant ini.</p> :
                  <div className="mt-3 space-y-3">{groups.map(([name,count])=><div key={name} className="flex items-center justify-between gap-4 text-xs"><span className="text-[#526675]">{name}</span><span className="font-semibold text-[#17324D]">{count}</span></div>)}</div>}
              </div>
            </div>
          )}
          {tab === 'directory' && (
            <div className="overflow-hidden rounded-[14px] border border-[#D8E3E9] bg-white">
              {profiles.length===0 ? <div className="p-8 text-center text-sm text-[#718391]">Belum ada Workforce Passport terdaftar untuk tenant ini.</div> :
                <div className="overflow-x-auto"><table className="w-full text-left text-xs">
                  <thead className="bg-[#F5F8FA] text-[#526675]"><tr><th className="px-4 py-3">Worker</th><th className="px-4 py-3">Job Family</th><th className="px-4 py-3">Engagement</th><th className="px-4 py-3">Lifecycle</th><th className="px-4 py-3">Updated</th></tr></thead>
                  <tbody>{profiles.map((p)=><tr key={p.id} className="border-t border-[#EAF2F6]">
                    <td className="px-4 py-3"><p className="font-semibold text-[#17324D]">{p.display_name}</p><p className="mt-1 font-mono text-[10px] text-[#718391]">{p.worker_code}</p></td>
                    <td className="px-4 py-3 text-[#526675]">{p.job_family || p.job_title || '—'}</td>
                    <td className="px-4 py-3 text-[#526675]">{p.engagement_status}</td>
                    <td className="px-4 py-3"><span className="rounded-md bg-[#E6F4F9] px-2 py-1 font-semibold text-[#0284C7]">{p.lifecycle_status}</span></td>
                    <td className="px-4 py-3 text-[#718391]">{new Date(p.updated_at).toLocaleDateString('id-ID')}</td>
                  </tr>)}</tbody>
                </table></div>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
