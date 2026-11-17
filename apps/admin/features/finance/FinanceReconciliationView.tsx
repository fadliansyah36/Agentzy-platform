'use client';

import React, { useState } from 'react';
import { Download, CheckCircle2 } from 'lucide-react';
import {
  AdminDeltaText,
  AdminPageHeader,
  AdminStatusText,
  FinanceRevenueLineChart,
} from '../../components/data-display/AdminDataDisplay';
import { FINANCE_MONTHLY_SERIES, formatIDR } from '../../lib/admin-data';
import type { FinanceReconciliationItem } from '../../lib/admin-types';

export function FinanceReconciliationView({
  reconciliations,
  onVerify,
  onNotify,
  onBack,
}: {
  reconciliations: FinanceReconciliationItem[];
  onVerify: (id: string) => void;
  onNotify: (msg: string) => void;
  onBack: () => void;
}) {
  const [period, setPeriod] = useState<'Nov 2026' | 'Okt 2026' | 'Q4 2026'>('Nov 2026');

  const handleExportCsv = () => {
    const header = 'ReferenceNo,Tenant,Channel,GrossIDR,NetSettledIDR,SettledAt,Status\n';
    const rows = reconciliations
      .map(
        (r) =>
          `${r.referenceNo},"${r.tenantName}","${r.channel}",${r.grossAmountIdr},${r.netSettledIdr},"${r.settledAt}",${r.status}`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agentzy-rekonsiliasi-${period.replace(/\s+/g, '-').toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify(`Laporan rekonsiliasi ${period} berhasil diekspor (CSV).`);
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Finance & Rekonsiliasi"
        subtitle="Ringkasan pendapatan platform, piutang berjalan, penyelesaian pembayaran Midtrans/Bank, dan rekonsiliasi settlement."
        onBack={onBack}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={period}
              onChange={(e) =>
                setPeriod(e.target.value as 'Nov 2026' | 'Okt 2026' | 'Q4 2026')
              }
              className="h-10 rounded-[10px] border border-[#D8E3E9] bg-white px-3 text-xs font-semibold text-[#17324D]"
              aria-label="Pilih Periode Keuangan"
            >
              <option value="Nov 2026">Periode: Nov 2026</option>
              <option value="Okt 2026">Periode: Okt 2026</option>
              <option value="Q4 2026">Periode: Q4 2026</option>
            </select>
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#17324D] px-4 text-xs font-semibold text-white hover:bg-[#245477] whitespace-nowrap"
            >
              <Download className="h-4 w-4" />
              <span>Export Rekonsiliasi</span>
            </button>
          </div>
        }
      />

      {/* Financial KPIs matching Screen 23 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#526675]">Pendapatan</span>
            <AdminDeltaText valuePct={12} />
          </div>
          <p className="mt-1.5 font-mono-tabular text-2xl font-bold text-[#17324D]">
            Rp 4,520 M
          </p>
          <p className="mt-1 text-[11px] text-[#718391]">
            Kontrak Kerjasama + Managed Services + AI Credits
          </p>
        </div>

        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#526675]">Piutang</span>
            <AdminDeltaText valuePct={6} />
          </div>
          <p className="mt-1.5 font-mono-tabular text-2xl font-bold text-[#17324D]">
            Rp 620 Jt
          </p>
          <p className="mt-1 text-[11px] text-[#718391]">
            Invoice terbuka dalam masa termin korporat
          </p>
        </div>

        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
          <span className="text-xs font-semibold text-[#526675]">Terbayar</span>
          <p className="mt-1.5 font-mono-tabular text-2xl font-bold text-[#247A55]">
            Rp 3,900 M
          </p>
          <p className="mt-1 text-[11px] text-[#718391]">
            Sudah masuk rekening settlement Agentzy
          </p>
        </div>
      </div>

      {/* Revenue Line Chart */}
      <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
        <h2 className="mb-3 text-sm font-bold text-[#17324D]">
          Tren Pendapatan vs Penyelesaian Settlement ({period})
        </h2>
        <FinanceRevenueLineChart data={FINANCE_MONTHLY_SERIES} />
      </div>

      {/* Reconciliation List (Mobile Cards + Desktop Table) */}
      <div className="overflow-hidden rounded-[14px] border border-[#D8E3E9] bg-white">
        <div className="border-b border-[#EAF2F6] px-4 py-3.5 sm:px-5">
          <h2 className="text-sm font-bold text-[#17324D]">
            Antrean Rekonsiliasi Bank &amp; Payment Gateway
          </h2>
        </div>

        <div className="divide-y divide-[#EAF2F6] md:hidden">
          {reconciliations.map((r) => (
            <div key={r.id} className="p-4 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono-tabular text-sm font-bold text-[#17324D]">
                    {r.referenceNo}
                  </p>
                  <p className="text-[11px] text-[#526675]">
                    {r.tenantName} · {r.channel}
                  </p>
                </div>
                <AdminStatusText
                  tone={r.status === 'Terekonsiliasi' ? 'success' : 'warning'}
                  label={r.status}
                />
              </div>
              <div className="flex items-center justify-between rounded-[10px] bg-[#F5F8FA] px-3 py-2 text-xs">
                <span className="text-[#526675]">{r.settledAt}</span>
                <span className="font-mono-tabular font-bold text-[#17324D]">
                  {formatIDR(r.netSettledIdr)}
                </span>
              </div>
              {r.status !== 'Terekonsiliasi' && (
                <button
                  type="button"
                  onClick={() => onVerify(r.id)}
                  className="inline-flex h-9 w-full items-center justify-center gap-1 rounded-[9px] bg-[#0284C7] text-xs font-semibold text-white"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Verifikasi &amp; Rekonsiliasi</span>
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#EAF2F6] bg-[#F5F8FA] text-[#526675]">
              <tr>
                <th className="px-4 py-3 font-semibold">Referensi &amp; Tenant</th>
                <th className="px-4 py-3 font-semibold">Kanal Pembayaran</th>
                <th className="px-4 py-3 font-semibold text-right">Nominal Gross</th>
                <th className="px-4 py-3 font-semibold text-right">Net Settled</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAF2F6]">
              {reconciliations.map((r) => (
                <tr key={r.id} className="hover:bg-[#F8FBFD]">
                  <td className="px-4 py-3">
                    <p className="font-mono-tabular font-bold text-[#17324D]">
                      {r.referenceNo}
                    </p>
                    <p className="text-[11px] text-[#526675]">
                      {r.tenantName} · {r.settledAt}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-[#526675]">{r.channel}</td>
                  <td className="px-4 py-3 text-right font-mono-tabular text-[#172B3A]">
                    {formatIDR(r.grossAmountIdr)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono-tabular font-bold text-[#17324D]">
                    {formatIDR(r.netSettledIdr)}
                  </td>
                  <td className="px-4 py-3">
                    <AdminStatusText
                      tone={r.status === 'Terekonsiliasi' ? 'success' : 'warning'}
                      label={r.status}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.status !== 'Terekonsiliasi' ? (
                      <button
                        type="button"
                        onClick={() => onVerify(r.id)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#0284C7] px-3 text-xs font-semibold text-white hover:bg-[#0369A1]"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Rekonsiliasi</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-[#247A55] font-semibold">
                        Cocok
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
