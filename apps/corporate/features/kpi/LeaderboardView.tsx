'use client';

import React, { useState } from 'react';
import { Trophy, Bot, Wrench } from 'lucide-react';
import {
  CorporatePageHeader,
  CorporateSegmentedTabs,
} from '../../components/data-display/CorporateDataDisplay';
import {
  INITIAL_AI_WORKERS,
  LEADERBOARD_AFFILIATE,
  LEADERBOARD_TECHNICIAN,
  STAFF_SALES_PERFORMANCE,
  formatNumberID,
} from '../../lib/corporate-data';

export function LeaderboardView({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<'staff-sales' | 'affiliate' | 'teknisi' | 'ai'>('staff-sales');
  const [period, setPeriod] = useState('Bulan Ini');

  return (
    <div className="space-y-5">
      <CorporatePageHeader
        title="Ranking & Leaderboard"
        subtitle="Peringkat terpisah untuk Staff Sales, Affiliate Freelance, Teknisi Lapangan, AI Worker, dan Wilayah"
        onBack={onBack}
        actions={
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            aria-label="Periode Leaderboard"
            className="h-10 rounded-[10px] border border-[#D8E3E9] bg-white px-3 text-xs font-semibold text-[#17324D] outline-none focus:border-[#0284C7]"
          >
            <option value="Bulan Ini">Periode: Bulan Ini</option>
            <option value="Kuartal Ini">Periode: Kuartal Ini</option>
            <option value="Tahun Ini">Periode: Tahun Ini</option>
          </select>
        }
      />

      <CorporateSegmentedTabs
        tabs={[
          { id: 'staff-sales', label: 'Staff Sales' },
          { id: 'affiliate', label: 'Affiliate' },
          { id: 'teknisi', label: 'Teknisi' },
          { id: 'ai', label: 'AI' },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Top Performer Card */}
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#17324D]">
              {tab === 'staff-sales'
                ? 'Top Performer — Staff Sales'
                : tab === 'affiliate'
                  ? 'Top Performer — Mitra Affiliate Freelance'
                  : tab === 'teknisi'
                    ? 'Top Performer — Teknisi Lapangan'
                    : 'Top Performer — AI Worker'}
            </h2>
            <Trophy className="h-4 w-4 text-[#C18A3A]" />
          </div>

          <div className="mt-4 divide-y divide-[#EAF2F6]">
            {tab === 'staff-sales' &&
              STAFF_SALES_PERFORMANCE.map((p) => (
                <div
                  key={p.name}
                  className="flex items-center justify-between py-3.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#17324D] font-mono-tabular text-xs font-bold text-white">
                      {p.rank}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-[#17324D]">{p.name}</p>
                      <p className="text-xs text-[#526675]">
                        Staff Sales (Grade {p.grade}) · {p.region} · {p.activeAffiliates} Affiliate
                      </p>
                    </div>
                  </div>
                  <div className="text-right font-mono-tabular">
                    <p className="text-sm font-bold text-[#17324D]">
                      {p.activations} Aktivasi
                    </p>
                    <p className="text-xs font-semibold text-[#247A55]">
                      {p.combinedSA} SA ({p.targetPct}%)
                    </p>
                  </div>
                </div>
              ))}

            {tab === 'affiliate' &&
              LEADERBOARD_AFFILIATE.map((a) => (
                <div
                  key={a.name}
                  className="flex items-center justify-between py-3.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E6F4F9] font-mono-tabular text-xs font-bold text-[#17324D]">
                      {a.rank}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-[#17324D]">{a.name}</p>
                      <p className="text-xs text-[#526675]">
                        Sponsor: {a.sponsorStaffSales} · {a.region} · Validitas {a.validRate}
                      </p>
                    </div>
                  </div>
                  <div className="text-right font-mono-tabular">
                    <p className="text-sm font-bold text-[#17324D]">
                      {a.orders} Order
                    </p>
                    <p className="text-xs font-semibold text-[#0284C7]">
                      Share {a.sharePct}%
                    </p>
                  </div>
                </div>
              ))}

            {tab === 'teknisi' &&
              LEADERBOARD_TECHNICIAN.map((t) => (
                <div
                  key={t.name}
                  className="flex items-center justify-between py-3.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E6F4F9] text-[#0284C7]">
                      <Wrench className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-[#17324D]">
                        #{t.rank} · {t.name}
                      </p>
                      <p className="text-xs text-[#526675]">
                        {t.specialty} · {t.region}
                      </p>
                    </div>
                  </div>
                  <div className="text-right font-mono-tabular">
                    <p className="text-sm font-bold text-[#17324D]">
                      {t.completedWo} WO Selesai
                    </p>
                    <p className="text-xs font-semibold text-[#247A55]">
                      SLA {t.slaPct} · FTF {t.firstTimeFixPct}
                    </p>
                  </div>
                </div>
              ))}

            {tab === 'ai' &&
              INITIAL_AI_WORKERS.map((w, idx) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between py-3.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E6F4F9] text-[#0284C7]">
                      <Bot className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-[#17324D]">
                        #{idx + 1} · {w.name}
                      </p>
                      <p className="text-xs text-[#526675]">
                        {w.department} · Autonomy {w.autonomyLevel}
                      </p>
                    </div>
                  </div>
                  <div className="text-right font-mono-tabular">
                    <p className="text-sm font-bold text-[#17324D]">
                      {formatNumberID(w.tasksCompleted)} Tugas
                    </p>
                    <p className="text-xs font-semibold text-[#247A55]">
                      SLA {String(w.slaCompliancePct).replace('.', ',')}%
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Ranking Tim / Wilayah */}
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-5">
          <h2 className="text-base font-bold text-[#17324D]">
            Ranking Tim / Wilayah ({period})
          </h2>
          <p className="mt-0.5 text-xs text-[#526675]">
            Pencapaian aktivasi terhadap target kuota wilayah
          </p>
          <div className="mt-4 divide-y divide-[#EAF2F6]">
            {[
              { rank: 1, area: 'Jakarta Selatan', pct: 132 },
              { rank: 2, area: 'Bandung', pct: 128 },
              { rank: 3, area: 'Surabaya', pct: 124 },
              { rank: 4, area: 'Semarang', pct: 118 },
            ].map((row) => (
              <div
                key={row.area}
                className="flex items-center justify-between py-3.5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F5F8FA] font-mono-tabular text-xs font-bold text-[#17324D]">
                    {row.rank}
                  </span>
                  <span className="text-sm font-semibold text-[#17324D]">
                    {row.area}
                  </span>
                </div>
                <span className="font-mono-tabular text-sm font-bold text-[#247A55]">
                  {row.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
