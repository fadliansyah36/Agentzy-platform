'use client';

import React, { useState } from 'react';
import { Award, ChevronRight, Users, TrendingUp, Briefcase, Network } from 'lucide-react';
import {
  CorporatePageHeader,
  CorporateSegmentedTabs,
} from '../../components/data-display/CorporateDataDisplay';
import {
  LEADERBOARD_AFFILIATE,
  STAFF_SALES_PERFORMANCE,
  formatNumberID,
} from '../../lib/corporate-data';
import type {
  AffiliatePartnerRecord,
  StaffSalesPerformanceRecord,
} from '../../lib/corporate-types';

export function SalesAffiliateAnalyticsView({
  onBack,
  onSelectSalesStaff,
  onSelectAffiliate,
}: {
  onBack: () => void;
  onSelectSalesStaff: (staff: StaffSalesPerformanceRecord) => void;
  onSelectAffiliate: (affiliate: AffiliatePartnerRecord) => void;
}) {
  const [tab, setTab] = useState<'funnel' | 'staff-sales' | 'affiliate' | 'tim'>('funnel');

  const funnelStages = [
    { stage: 'Lead', count: 8920, pct: '100%', widthPct: 100, color: '#87CEEB', textDark: true },
    { stage: 'Prospek', count: 5640, pct: '63,2%', widthPct: 78, color: '#38BDF8', textDark: true },
    { stage: 'Order', count: 3280, pct: '36,8%', widthPct: 58, color: '#0284C7', textDark: false },
    { stage: 'Aktivasi', count: 3120, pct: '35,0%', widthPct: 44, color: '#17324D', textDark: false },
  ];

  return (
    <div className="space-y-5">
      <CorporatePageHeader
        title="Sales & Affiliate"
        subtitle="Pemisahan kinerja Staff Sales (100% Personal + 40% Inkremental) dan jaringan Affiliate Freelance (60%)"
        onBack={onBack}
      />

      <CorporateSegmentedTabs
        tabs={[
          { id: 'funnel', label: 'Funnel' },
          { id: 'staff-sales', label: 'Staff Sales' },
          { id: 'affiliate', label: 'Affiliate' },
          { id: 'tim', label: 'Tim' },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      {tab === 'funnel' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Funnel Penjualan + Kontribusi Kanal */}
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-6">
            <h2 className="text-base font-bold text-[#17324D]">
              Funnel Penjualan (Staff Sales &amp; Affiliate)
            </h2>
            <p className="mt-0.5 text-xs text-[#526675]">
              Siklus tervalidasi dari lead masuk hingga aktivasi layanan ISP
            </p>

            <div className="mt-6 flex flex-col items-center space-y-2.5">
              {funnelStages.map((s) => (
                <div
                  key={s.stage}
                  className="flex flex-col items-center justify-center rounded-[10px] py-3 px-4 text-center transition"
                  style={{
                    width: `${s.widthPct}%`,
                    minWidth: '180px',
                    backgroundColor: s.color,
                    color: s.textDark ? '#17324D' : '#FFFFFF',
                  }}
                >
                  <span className="text-xs font-semibold">{s.stage}</span>
                  <span className="font-mono-tabular text-sm font-bold">
                    {formatNumberID(s.count)} ({s.pct})
                  </span>
                </div>
              ))}
            </div>

            {/* Channel Split Summary */}
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#EAF2F6] pt-4 text-xs">
              <div className="rounded-[10px] bg-[#F5F8FA] p-3">
                <p className="font-semibold text-[#526675]">Order Staff Sales</p>
                <p className="mt-1 font-mono-tabular text-base font-bold text-[#17324D]">
                  2.034 (62%)
                </p>
                <p className="mt-0.5 text-[11px] text-[#718391]">Personal SA 100%</p>
              </div>
              <div className="rounded-[10px] bg-[#E6F4F9] p-3">
                <p className="font-semibold text-[#245477]">Order Affiliate</p>
                <p className="mt-1 font-mono-tabular text-base font-bold text-[#0284C7]">
                  1.246 (38%)
                </p>
                <p className="mt-0.5 text-[11px] text-[#526675]">Split 60% / 40%</p>
              </div>
            </div>

            <p className="mt-4 border-t border-[#EAF2F6] pt-3 text-[11px] text-[#718391]">
              Unit: Lead/Order · Periode: Bulan Ini · Sumber: Sales CRM &amp; Provider Sync
            </p>
          </div>

          {/* Right Column: BOTH Top Staff Sales AND Top Affiliate */}
          <div className="space-y-5 lg:col-span-6">
            {/* Top Staff Sales */}
            <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#17324D]">
                    Top Staff Sales (Bulan Ini)
                  </h2>
                  <p className="mt-0.5 text-xs text-[#526675]">
                    Penjualan personal &amp; pembinaan Affiliate · Klik untuk rincian SA
                  </p>
                </div>
                <Briefcase className="h-4 w-4 text-[#0284C7]" />
              </div>

              <div className="mt-3 divide-y divide-[#EAF2F6]">
                {STAFF_SALES_PERFORMANCE.slice(0, 3).map((staff) => (
                  <button
                    key={staff.name}
                    type="button"
                    onClick={() => onSelectSalesStaff(staff)}
                    className="flex w-full items-center justify-between py-3 text-left transition hover:bg-[#F5F8FA] rounded-lg px-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#17324D] font-mono-tabular text-xs font-bold text-white">
                        {staff.rank}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#17324D]">
                          {staff.name} · Grade {staff.grade}
                        </p>
                        <p className="text-xs text-[#526675]">
                          {staff.region} · {staff.activeAffiliates} Affiliate binaan
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="block font-mono-tabular text-sm font-bold text-[#17324D]">
                          {staff.activations} Aktivasi
                        </span>
                        <span className="block font-mono-tabular text-[11px] font-semibold text-[#247A55]">
                          {staff.combinedSA} SA Gabungan
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[#718391]" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Top Affiliate */}
            <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#17324D]">
                    Top Affiliate (Bulan Ini)
                  </h2>
                  <p className="mt-0.5 text-xs text-[#526675]">
                    Mitra freelance tervalidasi · Klik untuk rincian atribusi split 60/40
                  </p>
                </div>
                <Award className="h-4 w-4 text-[#C18A3A]" />
              </div>

              <div className="mt-3 divide-y divide-[#EAF2F6]">
                {LEADERBOARD_AFFILIATE.slice(0, 3).map((aff) => (
                  <button
                    key={aff.name}
                    type="button"
                    onClick={() => onSelectAffiliate(aff)}
                    className="flex w-full items-center justify-between py-3 text-left transition hover:bg-[#F5F8FA] rounded-lg px-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E6F4F9] font-mono-tabular text-xs font-bold text-[#17324D]">
                        {aff.rank}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#17324D]">
                          {aff.name}
                        </p>
                        <p className="text-xs text-[#526675]">
                          Sponsor: {aff.sponsorStaffSales} · Validitas {aff.validRate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono-tabular text-sm font-bold text-[#17324D]">
                        {aff.orders} Order
                      </span>
                      <ChevronRight className="h-4 w-4 text-[#718391]" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'staff-sales' && (
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-[#17324D]">
                Kinerja Staff Sales (OJT, Pro &amp; Elite)
              </h2>
              <p className="text-xs text-[#526675]">
                Staff Sales bertanggung jawab atas closing personal (100% SA) serta rekrutmen &amp; pembinaan Affiliate (40% SA inkremental)
              </p>
            </div>
            <span className="font-mono-tabular text-xs font-semibold text-[#0284C7]">
              420 Staff Sales · 406 Aktif
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#D8E3E9] text-xs font-semibold text-[#526675]">
                  <th className="py-3 pr-4">Staff Sales &amp; Grade</th>
                  <th className="py-3 px-4">Area</th>
                  <th className="py-3 px-4 text-right">SA Personal</th>
                  <th className="py-3 px-4 text-right">Affiliate Binaan</th>
                  <th className="py-3 px-4 text-right">SA Gabungan</th>
                  <th className="py-3 px-4 text-right">Aktivasi</th>
                  <th className="py-3 pl-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAF2F6]">
                {STAFF_SALES_PERFORMANCE.map((row) => (
                  <tr key={row.name} className="hover:bg-[#F5F8FA]">
                    <td className="py-3.5 pr-4">
                      <p className="font-bold text-[#17324D]">
                        #{row.rank} · {row.name}
                      </p>
                      <p className="text-xs text-[#526675]">
                        Grade {row.grade} · {row.tierLabel}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-[#526675]">{row.region}</td>
                    <td className="py-3.5 px-4 text-right font-mono-tabular font-semibold text-[#17324D]">
                      {row.personalSA} SA
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-tabular text-[#526675]">
                      {row.activeAffiliates} mitra (+{row.affiliateSA} SA)
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-tabular font-bold text-[#0284C7]">
                      {row.combinedSA} SA
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-tabular font-bold text-[#247A55]">
                      {row.activations} ({row.targetPct}%)
                    </td>
                    <td className="py-3.5 pl-4 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectSalesStaff(row)}
                        className="text-xs font-semibold text-[#0284C7] hover:underline whitespace-nowrap"
                      >
                        Detail Staff Sales
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'affiliate' && (
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-[#17324D]">
                Tata Kelola Jaringan Affiliate Freelance
              </h2>
              <p className="text-xs text-[#526675]">
                Seluruh Affiliate direkrut oleh Staff Sales dengan atribusi terkunci (60% Affiliate / 40% Staff Sales)
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 font-mono-tabular text-xs font-semibold text-[#0284C7]">
              <Network className="h-3.5 w-3.5" />
              <span>480 Affiliate Terdaftar · 462 Aktif</span>
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#D8E3E9] text-xs font-semibold text-[#526675]">
                  <th className="py-3 pr-4">Peringkat &amp; Mitra Affiliate</th>
                  <th className="py-3 px-4">Sponsor Staff Sales</th>
                  <th className="py-3 px-4">Area</th>
                  <th className="py-3 px-4 text-right">Order Tervalidasi</th>
                  <th className="py-3 px-4 text-right">Validitas Order</th>
                  <th className="py-3 pl-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAF2F6]">
                {LEADERBOARD_AFFILIATE.map((row) => (
                  <tr key={row.name} className="hover:bg-[#F5F8FA]">
                    <td className="py-3.5 pr-4 font-semibold text-[#17324D]">
                      #{row.rank} · {row.name}
                    </td>
                    <td className="py-3.5 px-4 text-[#172B3A]">{row.sponsorStaffSales}</td>
                    <td className="py-3.5 px-4 text-[#526675]">{row.region}</td>
                    <td className="py-3.5 px-4 text-right font-mono-tabular font-bold text-[#17324D]">
                      {row.orders}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-tabular text-[#247A55]">
                      {row.validRate}
                    </td>
                    <td className="py-3.5 pl-4 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectAffiliate(row)}
                        className="text-xs font-semibold text-[#0284C7] hover:underline whitespace-nowrap"
                      >
                        Detail Atribusi
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'tim' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { team: 'Tim Jakarta Selatan', spv: 'Raka Pratama', activeSales: 48, activeAffiliates: 151, saTotal: 412, convPct: '44,2%' },
            { team: 'Tim Bandung Raya', spv: 'Siti Nabila', activeSales: 36, activeAffiliates: 86, saTotal: 318, convPct: '42,6%' },
            { team: 'Tim Surabaya Timur', spv: 'Budi Hartono', activeSales: 32, activeAffiliates: 112, saTotal: 294, convPct: '40,9%' },
          ].map((t) => (
            <div key={t.team} className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
              <div className="flex items-center justify-between">
                <Users className="h-5 w-5 text-[#0284C7]" />
                <TrendingUp className="h-4 w-4 text-[#247A55]" />
              </div>
              <h3 className="mt-3 text-base font-bold text-[#17324D]">{t.team}</h3>
              <p className="text-xs text-[#526675]">SPV Staff Sales: {t.spv}</p>
              <div className="mt-4 space-y-2 border-t border-[#EAF2F6] pt-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#526675]">Staff Sales Aktif</span>
                  <span className="font-mono-tabular font-bold text-[#17324D]">{t.activeSales}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#526675]">Affiliate Binaan</span>
                  <span className="font-mono-tabular font-bold text-[#0284C7]">{t.activeAffiliates}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#526675]">SA Gabungan Bulan Ini</span>
                  <span className="font-mono-tabular font-bold text-[#17324D]">{t.saTotal} SA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#526675]">Konversi Order</span>
                  <span className="font-mono-tabular font-bold text-[#247A55]">{t.convPct}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
