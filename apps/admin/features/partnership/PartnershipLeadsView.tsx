'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw, UserCheck, Clock3, Building2, Activity } from 'lucide-react';
import {
  ApiError,
  listPartnershipProspects,
  listPartnershipProspectActivities,
  updatePartnershipProspect,
  type PartnershipProspect,
} from '@/apps/web/lib/api-client';

const STATUS_OPTIONS = [
  'submitted', 'assigned', 'contacted', 'qualified',
  'disqualified', 'proposal', 'contracted', 'closed',
];

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Baru Masuk',
  assigned: 'Ditugaskan',
  contacted: 'Dihubungi',
  qualified: 'Terkualifikasi',
  disqualified: 'Tidak Sesuai',
  proposal: 'Proposal',
  contracted: 'Kontrak',
  closed: 'Ditutup',
};

type ActivityItem = {
  id: string;
  activity_type: string;
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  created_at: string;
};

export function PartnershipLeadsView({
  accessToken,
  currentUserId,
  onBack,
}: {
  accessToken: string;
  currentUserId: string | null;
  onBack: () => void;
}) {
  const [items, setItems] = useState<PartnershipProspect[]>([]);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<PartnershipProspect | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listPartnershipProspects(accessToken, filter || undefined);
      setItems(response.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Lead inbox tidak dapat dimuat.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, filter]);

  const loadActivities = useCallback(async (prospectId: string) => {
    try {
      const response = await listPartnershipProspectActivities(accessToken, prospectId);
      setActivities(response.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Aktivitas prospek tidak dapat dimuat.');
    }
  }, [accessToken]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => active ? load() : undefined);
    return () => { active = false; };
  }, [load]);

  const selectProspect = async (item: PartnershipProspect) => {
    setSelected(item);
    setNote('');
    await loadActivities(item.id);
  };

  const update = async (payload: { status?: string; assigned_to?: string | null; note?: string }) => {
    if (!selected) return;
    setUpdating(true);
    setError(null);
    try {
      const response = await updatePartnershipProspect(accessToken, selected.id, payload);
      setSelected((current) => current ? { ...current, status: response.data.status, assigned_to: response.data.assigned_to } : current);
      await load();
      await loadActivities(selected.id);
      setNote('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Perubahan prospek gagal disimpan.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button onClick={onBack} className="mb-2 inline-flex items-center gap-2 text-xs font-semibold text-[#526675] hover:text-[#17324D]">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Overview
          </button>
          <h1 className="text-2xl font-bold text-[#17324D]">Partnership Lead Inbox</h1>
          <p className="mt-1 text-sm text-[#526675]">Prospek kemitraan dari Public Landing, tersimpan pada CRM Agentzy.</p>
        </div>
        <button onClick={() => void load()} disabled={loading} className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-[#B8C9D3] bg-white px-4 text-xs font-semibold text-[#17324D] disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && <div role="alert" className="rounded-[10px] border border-[#B23A48]/30 bg-white p-3 text-sm text-[#B23A48]">{error}</div>}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <section className="overflow-hidden rounded-[14px] border border-[#D8E3E9] bg-white">
          <div className="flex flex-col gap-3 border-b border-[#EAF2F6] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-[#17324D]"><Building2 className="h-4 w-4 text-[#0284C7]" /> Prospek ({items.length})</div>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="h-9 rounded-[8px] border border-[#D8E3E9] bg-white px-3 text-xs text-[#17324D]">
              <option value="">Semua Status</option>
              {STATUS_OPTIONS.map((value) => <option key={value} value={value}>{STATUS_LABELS[value]}</option>)}
            </select>
          </div>
          {loading ? (
            <div className="p-6 text-sm text-[#526675]">Memuat prospek dari FastAPI…</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#526675]">Belum ada prospek untuk filter ini.</div>
          ) : (
            <div className="divide-y divide-[#EAF2F6]">
              {items.map((item) => (
                <button key={item.id} onClick={() => void selectProspect(item)} className={`block w-full p-4 text-left transition hover:bg-[#F5F8FA] ${selected?.id === item.id ? 'bg-[#E6F4F9]/60' : 'bg-white'}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-[#17324D]">{item.company_name}</p>
                      <p className="mt-0.5 font-mono-tabular text-[10px] text-[#0284C7]">{item.reference_code}</p>
                    </div>
                    <span className="rounded-full bg-[#EAF2F6] px-2.5 py-1 text-[10px] font-semibold text-[#526675]">{STATUS_LABELS[item.status] ?? item.status}</span>
                  </div>
                  <p className="mt-2 text-xs text-[#526675]">{item.contact_name} · {item.business_email} · {item.business_phone}</p>
                  <p className="mt-2 line-clamp-2 text-xs text-[#526675]">{[...item.human_needs, ...item.ai_needs].join(' · ') || 'Belum memilih kebutuhan layanan'}</p>
                  <p className="mt-2 flex items-center gap-1 text-[10px] text-[#718391]"><Clock3 className="h-3 w-3" /> {new Date(item.created_at).toLocaleString('id-ID')}</p>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[14px] border border-[#D8E3E9] bg-white p-4">
          {!selected ? (
            <div className="flex min-h-64 flex-col items-center justify-center text-center text-sm text-[#718391]">
              <Activity className="mb-2 h-7 w-7" /> Pilih prospek untuk melihat detail dan mengelola lifecycle.
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#5F879E]">Detail Prospek</p>
                <h2 className="mt-1 text-lg font-bold text-[#17324D]">{selected.company_name}</h2>
                <p className="font-mono-tabular text-[10px] text-[#0284C7]">{selected.reference_code}</p>
                <p className="mt-2 text-xs leading-relaxed text-[#526675]">{selected.contact_name} · {selected.business_email} · {selected.business_phone}</p>
                <p className="mt-1 text-xs text-[#526675]">Wilayah: {selected.operating_locations || 'Tidak dicantumkan'}</p>
                <p className="mt-1 text-xs text-[#526675]">Estimasi workforce: {selected.estimated_workforce ?? 'Tidak dicantumkan'}</p>
              </div>
              <div className="border-t border-[#EAF2F6] pt-4">
                <label className="mb-1 block text-xs font-semibold text-[#17324D]">Qualification Status</label>
                <select value={selected.status} disabled={updating} onChange={(e) => void update({ status: e.target.value })} className="h-10 w-full rounded-[8px] border border-[#D8E3E9] bg-white px-3 text-xs text-[#17324D]">
                  {STATUS_OPTIONS.map((value) => <option key={value} value={value}>{STATUS_LABELS[value]}</option>)}
                </select>
                {!selected.assigned_to && currentUserId && (
                  <button onClick={() => void update({ assigned_to: currentUserId })} disabled={updating} className="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-[8px] bg-[#17324D] px-3 text-xs font-semibold text-white disabled:opacity-50">
                    <UserCheck className="h-4 w-4" /> Ambil & Assign ke Saya
                  </button>
                )}
                {selected.assigned_to && <p className="mt-2 text-[11px] text-[#526675]">Assigned user: {selected.assigned_to}</p>}
              </div>
              <div className="border-t border-[#EAF2F6] pt-4">
                <label className="mb-1 block text-xs font-semibold text-[#17324D]">Catatan aktivitas</label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Catat hasil follow-up atau kebutuhan discovery…" className="w-full rounded-[8px] border border-[#D8E3E9] p-3 text-xs text-[#17324D]" />
                <button onClick={() => void update({ note })} disabled={updating || !note.trim()} className="mt-2 h-9 w-full rounded-[8px] border border-[#B8C9D3] bg-white px-3 text-xs font-semibold text-[#17324D] disabled:opacity-50">Simpan Catatan</button>
              </div>
              <div className="border-t border-[#EAF2F6] pt-4">
                <h3 className="mb-2 flex items-center gap-2 text-xs font-bold text-[#17324D]"><Activity className="h-4 w-4 text-[#0284C7]" /> Activity Timeline</h3>
                <div className="max-h-56 space-y-2 overflow-y-auto">
                  {activities.map((activity) => (
                    <div key={activity.id} className="rounded-[8px] bg-[#F5F8FA] p-2.5">
                      <p className="text-[11px] font-semibold text-[#17324D]">{activity.activity_type.replaceAll('_', ' ')}</p>
                      {activity.note && <p className="mt-1 text-[11px] text-[#526675]">{activity.note}</p>}
                      {activity.to_status && <p className="mt-1 text-[10px] text-[#5F879E]">{activity.from_status ?? '—'} → {activity.to_status}</p>}
                      <p className="mt-1 text-[10px] text-[#718391]">{new Date(activity.created_at).toLocaleString('id-ID')}</p>
                    </div>
                  ))}
                  {activities.length === 0 && <p className="text-[11px] text-[#718391]">Belum ada aktivitas.</p>}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
