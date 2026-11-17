'use client';

import React, { useState } from 'react';
import { Brain, ShieldCheck, RefreshCw } from 'lucide-react';
import {
  AdminPageHeader,
  AdminSegmentedTabs,
  AdminStatusText,
} from '../../components/data-display/AdminDataDisplay';
import { formatNumberID } from '../../lib/admin-data';
import type { MemoryGovernancePolicy, MemoryLayerRecord } from '../../lib/admin-types';

export function MemoryGovernanceView({
  policy,
  onChangePolicy,
  layers,
  onNotify,
  onBack,
}: {
  policy: MemoryGovernancePolicy;
  onChangePolicy: (next: MemoryGovernancePolicy) => void;
  layers: MemoryLayerRecord[];
  onNotify: (msg: string) => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<'kebijakan' | 'retensi' | 'consent'>('kebijakan');

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Memory Governance (Retention, Consent, Deletion)"
        subtitle="Kontrol isolasi memori AI per tenant, durasi retensi otomatis, persetujuan pengguna, dan pemenuhan penghapusan UU PDP."
        onBack={onBack}
        actions={
          <button
            type="button"
            onClick={() =>
              onNotify(
                `Audit retensi dijalankan: memori > ${policy.retentionDays} hari dijadwalkan untuk purge aman.`
              )
            }
            className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#17324D] px-4 text-xs font-semibold text-white hover:bg-[#245477] whitespace-nowrap"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Jalankan Siklus Retensi</span>
          </button>
        }
      />

      <AdminSegmentedTabs
        tabs={[
          { id: 'kebijakan', label: 'Kebijakan' },
          { id: 'retensi', label: 'Retensi & Layer' },
          { id: 'consent', label: 'Consent & Penghapusan' },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      {tab === 'kebijakan' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-7 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#172B3A]">
                Lingkup Memory (Isolation Scope)
              </label>
              <select
                value={policy.tenantScopeMode}
                onChange={(e) => {
                  onChangePolicy({
                    ...policy,
                    tenantScopeMode: e.target.value as MemoryGovernancePolicy['tenantScopeMode'],
                  });
                  onNotify('Lingkup isolasi memori diperbarui.');
                }}
                className="h-11 w-full rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] px-3.5 text-sm font-bold text-[#17324D]"
              >
                <option value="Tenant Scoped (Per Tenant)">
                  Tenant Scoped (Per Tenant)
                </option>
                <option value="Worker Scoped">Worker Scoped</option>
                <option value="Strict User Consent">Strict User Consent</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#172B3A]">
                Retensi Data Default
              </label>
              <select
                value={policy.retentionDays}
                onChange={(e) => {
                  onChangePolicy({
                    ...policy,
                    retentionDays: Number(e.target.value) as 30 | 90 | 180 | 365,
                  });
                  onNotify(`Durasi retensi default diubah menjadi ${e.target.value} hari.`);
                }}
                className="h-11 w-full rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] px-3.5 text-sm font-bold text-[#17324D]"
              >
                <option value={30}>30 hari</option>
                <option value={90}>90 hari</option>
                <option value={180}>180 hari</option>
                <option value={365}>365 hari</option>
              </select>
            </div>

            <div className="rounded-[10px] border border-[#247A55]/25 bg-[#247A55]/5 px-4 py-3 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 shrink-0 text-[#247A55]" />
              <div>
                <p className="text-xs font-bold text-[#17324D]">Kepatuhan Aktif</p>
                <p className="text-[11px] text-[#526675]">{policy.complianceStandard}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-[#EAF2F6] pb-3">
              <Brain className="h-4 w-4 text-[#0284C7]" />
              <h2 className="text-sm font-bold text-[#17324D]">
                Kontrol Perlindungan Cepat
              </h2>
            </div>

            {[
              {
                key: 'userConsentRequired' as const,
                title: 'Consent Pengguna (Personal Memory)',
                desc: 'Memerlukan opt-in eksplisit sebelum menyimpan preferensi personal.',
                value: policy.userConsentRequired,
              },
              {
                key: 'autoDeleteRetention' as const,
                title: 'Hapus Otomatis (Retention)',
                desc: 'Purge otomatis record kedaluwarsa di seluruh embedding & ledger.',
                value: policy.autoDeleteRetention,
              },
              {
                key: 'dsrDeletionEnabled' as const,
                title: 'Permintaan Penghapusan (DSR)',
                desc: 'Sinkronisasi penghapusan subjek data ke pgvector dalam < 24 jam.',
                value: policy.dsrDeletionEnabled,
              },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-3 rounded-[10px] bg-[#F5F8FA] px-3.5 py-3"
              >
                <div>
                  <p className="text-xs font-bold text-[#17324D]">{item.title}</p>
                  <p className="text-[11px] text-[#526675]">{item.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onChangePolicy({ ...policy, [item.key]: !item.value });
                    onNotify(`Pengaturan "${item.title}" diperbarui.`);
                  }}
                  className={`h-8 shrink-0 rounded-lg px-3 text-xs font-bold ${
                    item.value
                      ? 'bg-[#247A55] text-white'
                      : 'border border-[#D8E3E9] bg-white text-[#526675]'
                  }`}
                >
                  {item.value ? 'Aktif' : 'Nonaktif'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'retensi' && (
        <div className="space-y-3">
          {/* Mobile Layer Cards */}
          <div className="space-y-2.5 md:hidden">
            {layers.map((l) => (
              <div
                key={l.id}
                className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-[#17324D]">{l.layerName}</p>
                    <p className="text-xs text-[#526675]">Sensitivitas: {l.sensitivity}</p>
                  </div>
                  <AdminStatusText
                    tone={l.status === 'Aktif' ? 'success' : 'warning'}
                    label={l.status}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 rounded-[10px] bg-[#F5F8FA] p-2.5 text-xs">
                  <div>
                    <span className="text-[11px] text-[#718391]">Jumlah Record</span>
                    <p className="font-mono-tabular font-bold text-[#17324D]">
                      {formatNumberID(l.recordsCount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-[#718391]">Retensi</span>
                    <p className="font-mono-tabular font-bold text-[#17324D]">
                      {l.retentionDays} hari
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Layer Table */}
          <div className="hidden overflow-hidden rounded-[14px] border border-[#D8E3E9] bg-white md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#EAF2F6] bg-[#F5F8FA] text-[#526675]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Layer Memory</th>
                    <th className="px-4 py-3 font-semibold text-right">Jumlah Record</th>
                    <th className="px-4 py-3 font-semibold">Sensitivitas</th>
                    <th className="px-4 py-3 font-semibold text-right">Retensi</th>
                    <th className="px-4 py-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAF2F6]">
                  {layers.map((l) => (
                    <tr key={l.id} className="hover:bg-[#F8FBFD]">
                      <td className="px-4 py-3 font-bold text-[#17324D]">{l.layerName}</td>
                      <td className="px-4 py-3 text-right font-mono-tabular font-semibold text-[#17324D]">
                        {formatNumberID(l.recordsCount)}
                      </td>
                      <td className="px-4 py-3 text-[#526675]">{l.sensitivity}</td>
                      <td className="px-4 py-3 text-right font-mono-tabular text-[#17324D]">
                        {l.retentionDays} hari
                      </td>
                      <td className="px-4 py-3 text-right">
                        <AdminStatusText
                          tone={l.status === 'Aktif' ? 'success' : 'warning'}
                          label={l.status}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'consent' && (
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 space-y-3">
          <h2 className="text-sm font-bold text-[#17324D]">
            Protokol Consent &amp; Penghapusan Lintas Layer
          </h2>
          <p className="text-xs leading-relaxed text-[#526675]">
            Setiap record Personal Memory hanya dapat ditulis apabila flag{' '}
            <span className="font-mono-tabular font-semibold text-[#17324D]">
              consent_granted = true
            </span>{' '}
            terverifikasi. Ketika permintaan DSR penghapusan dipicu, sistem melakukan tombstone
            sinkronisasi pada tabel transaksi, working memory, dan vector embeddings pgvector
            secara teraudit.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-2">
            {layers.map((l) => (
              <div
                key={l.id}
                className="rounded-[10px] border border-[#EAF2F6] bg-[#F5F8FA] p-3.5"
              >
                <p className="text-xs font-bold text-[#17324D]">{l.layerName}</p>
                <p className="mt-1 text-[11px] text-[#526675]">
                  Consent Enforced:{' '}
                  <span className="font-semibold text-[#247A55]">
                    {l.consentEnforced ? 'Ya' : 'Tidak'}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
