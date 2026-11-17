'use client';

import React, { useState } from 'react';
import { Award, Info, Trophy } from 'lucide-react';
import {
  CorporatePageHeader,
  CorporateSegmentedTabs,
} from '../../components/data-display/CorporateDataDisplay';
import { LEADERBOARD_HUMAN, REGIONAL_COVERAGE_STATS } from '../../lib/corporate-data';

export function KpiPerformanceView({
  onBack,
  onOpenFormulaModal,
}: {
  onBack: () => void;
  onOpenFormulaModal: () => void;
}) {
  const [tab, setTab] = useState<'kpi' | 'tim' | 'individu'>('kpi');

  return (
    <div className="space-y-5">
      <CorporatePageHeader
        title="KPI & Performa"
        subtitle="Pencapaian indikator utama korporasi, tim regional, dan individu"
        onBack={onBack}
        actions={
          <button
            type="button"
            onClick={onOpenFormulaModal}
            className="inline-flex h-10 items-center gap-1.5 rounded-[10px] border border-[#D8E3E9] bg-white px-3.5 text-xs font-semibold text-[#17324D] hover:bg-[#EAF2F6] whitespace-nowrap"
          >
            <Info className="h-3.5 w-3.5 text-[#0284C7]" />
            <span>Definisi &amp; Formula KPI</span>
          </button>
        }
      />

      <CorporateSegmentedTabs
        tabs={[
          { id: 'kpi', label: 'KPI' },
          { id: 'tim', label: 'Tim' },
          { id: 'individu', label: 'Individu' },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      {tab === 'kpi' && (
        <div className="space-y-5">
          {/* Pencapaian Utama (Bulan Ini) */}
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
            <h2 className="text-base font-bold text-[#17324D]">
              Pencapaian Utama (Bulan Ini)
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: 'Aktivasi', value: '109%', pct: 100, color: '#247A55' },
                { label: 'Produktivitas', value: '118%', pct: 100, color: '#0284C7' },
                { label: 'SLA', value: '98,6%', pct: 98.6, color: '#247A55' },
                { label: 'First Time Fix', value: '96,2%', pct: 96.2, color: '#0284C7' },
              ].map((item) => (
                <div key={item.label} className="rounded-[12px] bg-[#F5F8FA] p-4">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#526675]">{item.label}</span>
                    <span className="font-mono-tabular text-sm font-bold text-[#17324D]">
                      {item.value}
                    </span>
                  </div>
                  <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[#D8E3E9]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* Skor Kinerja Perusahaan (Matches Screen 8) */}
            <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#17324D]">
                  Skor Kinerja Perusahaan
                </h2>
                <Award className="h-5 w-5 text-[#247A55]" />
              </div>
              <div className="mt-4 flex flex-col items-center justify-center rounded-[12px] bg-[#E6F4F9] py-6 text-center">
                <span className="font-mono-tabular text-3xl font-bold text-[#247A55]">
                  A (92,4 / 100)
                </span>
                <p className="mt-1.5 text-xs text-[#526675]">
                  Komposit terbobot: Aktivasi (40%) · SLA (30%) · Kualitas QC (30%)
                </p>
              </div>
              <p className="mt-3 text-[11px] text-[#718391]">
                Versi Formula: KPI-ISP-v2.1 · Sumber: Analytics Aggregates
              </p>
            </div>

            {/* Ranking Tim Terbaik */}
            <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-7">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#17324D]">
                  Ranking Tim Terbaik
                </h2>
                <Trophy className="h-4 w-4 text-[#C18A3A]" />
              </div>
              <div className="mt-4 divide-y divide-[#EAF2F6]">
                {[
                  { rank: 1, name: 'Tim Jakarta Selatan', score: '96,8' },
                  { rank: 2, name: 'Tim Bandung', score: '95,4' },
                  { rank: 3, name: 'Tim Surabaya', score: '94,9' },
                ].map((team) => (
                  <div
                    key={team.name}
                    className="flex items-center justify-between py-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E6F4F9] font-mono-tabular text-xs font-bold text-[#17324D]">
                        {team.rank}
                      </span>
                      <span className="text-sm font-semibold text-[#17324D]">
                        {team.name}
                      </span>
                    </div>
                    <span className="font-mono-tabular text-sm font-bold text-[#17324D]">
                      {team.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'tim' && (
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
          <h2 className="text-base font-bold text-[#17324D]">
            Matriks KPI per Wilayah / Tim
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#D8E3E9] text-xs font-semibold text-[#526675]">
                  <th className="py-3 pr-4">Wilayah Tim</th>
                  <th className="py-3 px-4 text-right">Tenaga Kerja</th>
                  <th className="py-3 px-4 text-right">Target Aktivasi</th>
                  <th className="py-3 pl-4 text-right">SLA Operasional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAF2F6]">
                {REGIONAL_COVERAGE_STATS.map((r) => (
                  <tr key={r.region}>
                    <td className="py-3.5 pr-4 font-semibold text-[#17324D]">
                      Tim {r.region}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-tabular text-[#526675]">
                      {r.staffCount}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-tabular font-bold text-[#247A55]">
                      {r.targetPct}%
                    </td>
                    <td className="py-3.5 pl-4 text-right font-mono-tabular text-[#17324D]">
                      {String(r.slaPct).replace('.', ',')}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'individu' && (
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
          <h2 className="text-base font-bold text-[#17324D]">
            Pencapaian KPI Individu Terbaik
          </h2>
          <div className="mt-4 divide-y divide-[#EAF2F6]">
            {LEADERBOARD_HUMAN.map((p) => (
              <div
                key={p.name}
                className="flex items-center justify-between py-3.5"
              >
                <div>
                  <p className="text-sm font-bold text-[#17324D]">
                    #{p.rank} · {p.name}
                  </p>
                  <p className="text-xs text-[#526675]">
                    {p.role} · {p.region}
                  </p>
                </div>
                <div className="text-right font-mono-tabular">
                  <p className="text-sm font-bold text-[#17324D]">
                    {p.activations} Aktivasi
                  </p>
                  <p className="text-xs font-semibold text-[#247A55]">
                    {p.targetPct}% target
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
