'use client';

import React, { useMemo, useState } from 'react';
import { Calendar, SlidersHorizontal, ArrowUpRight } from 'lucide-react';
import {
  ActivationTrendChart,
  ChartMetaFooter,
  CorporatePageHeader,
  CorporateSegmentedTabs,
} from '../../components/data-display/CorporateDataDisplay';
import { REGIONAL_COVERAGE_STATS, formatNumberID } from '../../lib/corporate-data';
import { corporatePortalService } from '../../services/corporate-service';
import type { AnalyticsFilterState } from '../../lib/corporate-types';

export function BusinessAnalyticsView({
  filter,
  onOpenFilterModal,
  onBack,
}: {
  filter: AnalyticsFilterState;
  onOpenFilterModal: () => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<'tren' | 'komposisi' | 'wilayah'>('tren');

  const series = useMemo(
    () => corporatePortalService.getAnalyticsSeries(filter),
    [filter]
  );

  const totals = useMemo(() => {
    const order = series.reduce((acc, s) => acc + s.order, 0);
    const aktivasi = series.reduce((acc, s) => acc + s.aktivasi, 0);
    return {
      order,
      aktivasi,
      conversionPct: order > 0 ? ((aktivasi / order) * 100).toFixed(1).replace('.', ',') : '0',
    };
  }, [series]);

  return (
    <div className="space-y-5">
      <CorporatePageHeader
        title="Business Analytics"
        subtitle="Analitik kinerja penjualan, aktivasi layanan, dan konversi per periode"
        onBack={onBack}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenFilterModal}
              className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-[#D8E3E9] bg-white px-3.5 text-xs font-semibold text-[#17324D] hover:bg-[#EAF2F6] whitespace-nowrap shrink-0"
            >
              <Calendar className="h-3.5 w-3.5 text-[#0284C7]" />
              <span>{filter.period}</span>
            </button>
            <button
              type="button"
              onClick={onOpenFilterModal}
              className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#D8E3E9] bg-white text-[#17324D] hover:bg-[#EAF2F6]"
              aria-label="Filter Analitik"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CorporateSegmentedTabs
          tabs={[
            { id: 'tren', label: 'Tren' },
            { id: 'komposisi', label: 'Komposisi' },
            { id: 'wilayah', label: 'Wilayah' },
          ]}
          activeTab={tab}
          onChange={setTab}
        />

        <p className="text-xs text-[#526675]">
          Filter Aktif: {filter.provider} · {filter.region} · {filter.product}
        </p>
      </div>

      {tab === 'tren' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-[#17324D]">
                Tren Aktivasi Pelanggan
              </h2>
              <span className="font-mono-tabular text-xs font-semibold text-[#247A55]">
                +16% vs Periode Sebelumnya
              </span>
            </div>

            <ActivationTrendChart data={series} />

            <ChartMetaFooter
              unit="Jumlah Aktivasi Pelanggan"
              period={filter.period}
              source="Provider Order & Activation Sync"
              lastUpdated="17 Nov 2026 · 10:15 WIB"
            />
          </div>

          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-4">
            <h2 className="text-base font-bold text-[#17324D]">
              Ringkasan Periode
            </h2>
            <p className="mt-0.5 text-xs text-[#526675]">
              Agregat tervalidasi pada rentang {filter.period}
            </p>

            <div className="mt-5 divide-y divide-[#EAF2F6]">
              <div className="flex items-center justify-between py-3.5">
                <span className="text-sm text-[#526675]">Total Order</span>
                <div className="text-right">
                  <span className="font-mono-tabular text-base font-bold text-[#17324D]">
                    {formatNumberID(totals.order)}
                  </span>
                  <span className="ml-2 inline-flex items-center font-mono-tabular text-xs font-semibold text-[#247A55]">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    +14%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between py-3.5">
                <span className="text-sm text-[#526675]">Aktivasi</span>
                <div className="text-right">
                  <span className="font-mono-tabular text-base font-bold text-[#17324D]">
                    {formatNumberID(totals.aktivasi)}
                  </span>
                  <span className="ml-2 inline-flex items-center font-mono-tabular text-xs font-semibold text-[#247A55]">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    +16%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between py-3.5">
                <span className="text-sm text-[#526675]">Conversion Rate</span>
                <div className="text-right">
                  <span className="font-mono-tabular text-base font-bold text-[#17324D]">
                    41,8%
                  </span>
                  <span className="ml-2 inline-flex items-center font-mono-tabular text-xs font-semibold text-[#247A55]">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    +3,2%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between py-3.5">
                <span className="text-sm text-[#526675]">Rasio Aktivasi/Order</span>
                <span className="font-mono-tabular text-base font-bold text-[#0284C7]">
                  {totals.conversionPct}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'komposisi' && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
            <h2 className="text-base font-bold text-[#17324D]">
              Komposisi Aktivasi per Produk ISP
            </h2>
            <p className="mt-1 text-xs text-[#526675]">
              Cakupan produk FTTH, FWA, dan PXGY pada periode berjalan
            </p>
            <div className="mt-5 space-y-4">
              {[
                { label: 'FTTH (Fiber To The Home)', count: 12480, pct: 68, color: '#0284C7' },
                { label: 'FWA (Fixed Wireless Access)', count: 4020, pct: 22, color: '#3B8C91' },
                { label: 'PXGY (Enterprise Bundling)', count: 1760, pct: 10, color: '#17324D' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#172B3A]">{item.label}</span>
                    <span className="font-mono-tabular text-[#17324D]">
                      {formatNumberID(item.count)} ({item.pct}%)
                    </span>
                  </div>
                  <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-[#EAF2F6]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <ChartMetaFooter
              unit="Aktivasi"
              period={filter.period}
              source="Product Catalogue Attribution"
              lastUpdated="17 Nov 2026 · 10:15 WIB"
            />
          </div>

          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
            <h2 className="text-base font-bold text-[#17324D]">
              Kontribusi Kanal Akuisisi (Staff Sales vs Affiliate)
            </h2>
            <p className="mt-1 text-xs text-[#526675]">
              Perbandingan order personal Staff Sales dan jaringan Affiliate Freelance
            </p>
            <div className="mt-5 space-y-4">
              {[
                { label: 'Staff Sales (Personal SA 100%)', count: 11320, pct: 62, color: '#17324D' },
                { label: 'Affiliate Freelance (Split 60/40)', count: 6940, pct: 38, color: '#0284C7' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#172B3A]">{item.label}</span>
                    <span className="font-mono-tabular text-[#17324D]">
                      {formatNumberID(item.count)} ({item.pct}%)
                    </span>
                  </div>
                  <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-[#EAF2F6]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <ChartMetaFooter
              unit="Aktivasi"
              period={filter.period}
              source="Order Attribution Snapshot"
              lastUpdated="17 Nov 2026 · 10:15 WIB"
            />
          </div>
        </div>
      )}

      {tab === 'wilayah' && (
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
          <h2 className="text-base font-bold text-[#17324D]">
            Sebaran Kinerja Aktivasi &amp; SLA per Regional
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#D8E3E9] text-xs font-semibold text-[#526675]">
                  <th className="py-3 pr-4">Wilayah Regional</th>
                  <th className="py-3 px-4 text-right">Tenaga Kerja</th>
                  <th className="py-3 px-4 text-right">Total Aktivasi</th>
                  <th className="py-3 px-4 text-right">Pencapaian Target</th>
                  <th className="py-3 pl-4 text-right">Kepatuhan SLA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAF2F6]">
                {REGIONAL_COVERAGE_STATS.map((row) => (
                  <tr key={row.region} className="hover:bg-[#F5F8FA]">
                    <td className="py-3.5 pr-4 font-semibold text-[#17324D]">
                      {row.region}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-tabular text-[#526675]">
                      {formatNumberID(row.staffCount)} ({row.workforcePct}%)
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-tabular font-semibold text-[#17324D]">
                      {formatNumberID(row.activations)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-tabular font-semibold text-[#247A55]">
                      {row.targetPct}%
                    </td>
                    <td className="py-3.5 pl-4 text-right font-mono-tabular text-[#172B3A]">
                      {String(row.slaPct).replace('.', ',')}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
