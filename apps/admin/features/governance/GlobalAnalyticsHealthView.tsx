'use client';

import React, { useState } from 'react';
import { BarChart3, Award, Activity } from 'lucide-react';
import {
  AdminPageHeader,
  AdminSegmentedTabs,
  AdminStatusText,
  TopTenantsPerformanceChart,
} from '../../components/data-display/AdminDataDisplay';
import { GLOBAL_KPI_SERIES, formatNumberID } from '../../lib/admin-data';
import type { AdminTenantRecord } from '../../lib/admin-types';

export function GlobalAnalyticsHealthView({
  tenants,
  onBack,
}: {
  tenants: AdminTenantRecord[];
  onBack: () => void;
}) {
  const [tab, setTab] = useState<'kpi' | 'ranking' | 'sla'>('kpi');

  const sortedTenants = [...tenants].sort((a, b) => b.slaScore - a.slaScore);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Global Analytics, KPI, Ranking & System Health"
        subtitle="Pencapaian SLA platform (99,97%), tren kinerja 3 tenant teratas, ranking operasional lintas industri, dan kesehatan subsistem."
        onBack={onBack}
      />

      <AdminSegmentedTabs
        tabs={[
          { id: 'kpi', label: 'KPI & Tren' },
          { id: 'ranking', label: 'Ranking Tenant' },
          { id: 'sla', label: 'SLA & System Health' },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      {tab === 'kpi' && (
        <div className="space-y-5">
          {/* Global KPI Strip matching right-side Global KPI & Ranking panel */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4">
              <p className="text-xs font-semibold text-[#526675]">Uptime Platform</p>
              <p className="mt-1 font-mono-tabular text-2xl font-bold text-[#247A55]">
                99,97%
              </p>
            </div>
            <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4">
              <p className="text-xs font-semibold text-[#526675]">Total Tenant</p>
              <p className="mt-1 font-mono-tabular text-2xl font-bold text-[#17324D]">
                128
              </p>
            </div>
            <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4">
              <p className="text-xs font-semibold text-[#526675]">Total Human Workforce</p>
              <p className="mt-1 font-mono-tabular text-2xl font-bold text-[#17324D]">
                24.860
              </p>
            </div>
            <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4">
              <p className="text-xs font-semibold text-[#526675]">Total AI Worker</p>
              <p className="mt-1 font-mono-tabular text-2xl font-bold text-[#0284C7]">
                3.420
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-7">
              <div className="mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#0284C7]" />
                <h2 className="text-sm font-bold text-[#17324D]">
                  Kinerja Terbaik (Top 3 Tenant SLA)
                </h2>
              </div>
              <TopTenantsPerformanceChart data={GLOBAL_KPI_SERIES} />
            </div>

            <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-[#EAF2F6] pb-3">
                <Award className="h-4 w-4 text-[#A96816]" />
                <h2 className="text-sm font-bold text-[#17324D]">
                  Ranking Tenant (Kinerja Operasional)
                </h2>
              </div>
              {sortedTenants.slice(0, 4).map((t, idx) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-[10px] bg-[#F5F8FA] px-3.5 py-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#17324D] font-mono-tabular text-xs font-bold text-white">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#17324D]">{t.name}</p>
                      <p className="text-[11px] text-[#526675]">
                        {formatNumberID(t.humanCount)} human · {t.aiWorkerCount} AI
                      </p>
                    </div>
                  </div>
                  <span className="font-mono-tabular text-sm font-bold text-[#247A55]">
                    {String(t.slaScore).replace('.', ',')}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'ranking' && (
        <div className="space-y-3">
          {/* Mobile Ranking Cards */}
          <div className="space-y-2.5 md:hidden">
            {sortedTenants.map((t, idx) => (
              <div
                key={t.id}
                className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#17324D] font-mono-tabular text-xs font-bold text-white">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-[#17324D]">{t.name}</p>
                      <p className="text-xs text-[#526675]">
                        {t.contractNumber} · {t.cooperationLabel}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono-tabular text-sm font-bold text-[#247A55]">
                    {String(t.slaScore).replace('.', ',')}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 rounded-[10px] bg-[#F5F8FA] p-2.5 text-xs">
                  <div>
                    <span className="text-[11px] text-[#718391]">Human Workforce</span>
                    <p className="font-mono-tabular font-bold text-[#17324D]">
                      {formatNumberID(t.humanCount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-[#718391]">AI Worker</span>
                    <p className="font-mono-tabular font-bold text-[#0284C7]">
                      {formatNumberID(t.aiWorkerCount)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Ranking Table */}
          <div className="hidden overflow-hidden rounded-[14px] border border-[#D8E3E9] bg-white md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#EAF2F6] bg-[#F5F8FA] text-[#526675]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Peringkat</th>
                    <th className="px-4 py-3 font-semibold">Tenant</th>
                    <th className="px-4 py-3 font-semibold">Kontrak Kerjasama</th>
                    <th className="px-4 py-3 font-semibold text-right">Human</th>
                    <th className="px-4 py-3 font-semibold text-right">AI Worker</th>
                    <th className="px-4 py-3 font-semibold text-right">Skor SLA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAF2F6]">
                  {sortedTenants.map((t, idx) => (
                    <tr key={t.id} className="hover:bg-[#F8FBFD]">
                      <td className="px-4 py-3 font-mono-tabular font-bold text-[#17324D]">
                        #{idx + 1}
                      </td>
                      <td className="px-4 py-3 font-bold text-[#17324D]">{t.name}</td>
                      <td className="px-4 py-3 text-[#526675]">
                        {t.contractNumber} · {t.cooperationLabel}
                      </td>
                      <td className="px-4 py-3 text-right font-mono-tabular">
                        {formatNumberID(t.humanCount)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono-tabular">
                        {formatNumberID(t.aiWorkerCount)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono-tabular font-bold text-[#247A55]">
                        {String(t.slaScore).replace('.', ',')}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'sla' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              service: 'PostgreSQL + RLS Tenant Isolation',
              uptime: '99,99%',
              latency: '4 ms',
              note: 'Semua query terikat tenant_id',
            },
            {
              service: 'AI Gateway & Model Router',
              uptime: '99,96%',
              latency: '490 ms',
              note: 'Failover multi-provider aktif',
            },
            {
              service: 'Durable Workflow Runtime',
              uptime: '99,98%',
              latency: '18 ms',
              note: 'Checkpoint & retry idempoten sehat',
            },
            {
              service: 'pgvector RAG & Memory Store',
              uptime: '99,95%',
              latency: '31 ms',
              note: '270.140 vektor aktif terisolasi',
            },
            {
              service: 'Commission & AI Credits Ledger',
              uptime: '100,00%',
              latency: '6 ms',
              note: 'Rekonsiliasi deterministik 60/40',
            },
            {
              service: 'Maps, Geolocation & Webhook Hub',
              uptime: '99,92%',
              latency: '142 ms',
              note: 'Midtrans & Workspace terhubung',
            },
          ].map((item) => (
            <div
              key={item.service}
              className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 space-y-2"
            >
              <div className="flex items-center justify-between">
                <Activity className="h-4 w-4 text-[#0284C7]" />
                <AdminStatusText tone="success" label={`Uptime ${item.uptime}`} />
              </div>
              <h3 className="text-sm font-bold text-[#17324D]">{item.service}</h3>
              <p className="text-xs text-[#526675]">
                Latensi p95:{' '}
                <strong className="font-mono-tabular text-[#17324D]">
                  {item.latency}
                </strong>{' '}
                · {item.note}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
