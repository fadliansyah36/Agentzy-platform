'use client';

import React, { useState } from 'react';
import { Coins, Plus, Pencil, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  AdminPageHeader,
  AdminSegmentedTabs,
  AdminStatusText,
} from '../../components/data-display/AdminDataDisplay';
import { formatIDR, formatNumberID } from '../../lib/admin-data';
import type {
  AdminCreditLedgerItem,
  AdminTenantRecord,
  CreditPricingRuleRecord,
} from '../../lib/admin-types';

export function AICreditsAdminView({
  balance,
  usedMonth,
  tenants,
  pricingRules,
  ledger,
  onOpenTopUp,
  onOpenPricingModal,
  onBack,
}: {
  balance: number;
  usedMonth: number;
  tenants: AdminTenantRecord[];
  pricingRules: CreditPricingRuleRecord[];
  ledger: AdminCreditLedgerItem[];
  onOpenTopUp: () => void;
  onOpenPricingModal: (rule?: CreditPricingRuleRecord) => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<'wallet' | 'pricing' | 'ledger'>('wallet');
  const approxTokens = Math.round(balance * 0.25);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="AI Credits (Pricing & Wallet Ledger)"
        subtitle="Dompet AI Credits terpusat, konversi tarif per model LLM, kuota per tenant, dan buku besar ledger immutable."
        onBack={onBack}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenPricingModal()}
              className="inline-flex h-10 items-center gap-1.5 rounded-[10px] border border-[#D8E3E9] bg-white px-3.5 text-xs font-semibold text-[#17324D] hover:bg-[#EAF2F6] whitespace-nowrap"
            >
              <Plus className="h-4 w-4 text-[#0284C7]" />
              <span>Atur Tarif Model LLM</span>
            </button>
            <button
              type="button"
              onClick={onOpenTopUp}
              className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#0284C7] px-4 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap"
            >
              <Coins className="h-4 w-4" />
              <span>Top Up</span>
            </button>
          </div>
        }
      />

      <AdminSegmentedTabs
        tabs={[
          { id: 'wallet', label: 'Saldo & Per Tenant' },
          { id: 'pricing', label: `Tarif Model (${pricingRules.length})` },
          { id: 'ledger', label: `Ledger (${ledger.length})` },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      {tab === 'wallet' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-5 space-y-4">
            <div className="rounded-[12px] bg-[#17324D] p-5 text-white">
              <p className="text-xs font-semibold text-[#87CEEB]">Saldo AI Credits</p>
              <p className="mt-1 font-mono-tabular text-3xl font-bold">
                {formatNumberID(balance)}
              </p>
              <p className="mt-1 font-mono-tabular text-xs text-[#ADD8E6]">
                ≈ {formatNumberID(approxTokens)} token ekuivalen · Ledger unit terpisah
              </p>
              <button
                type="button"
                onClick={onOpenTopUp}
                className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-[10px] bg-[#0284C7] text-xs font-bold text-white hover:bg-[#0369A1]"
              >
                Top Up AI Credits Tenant
              </button>
            </div>

            <div className="rounded-[12px] border border-[#EAF2F6] bg-[#F5F8FA] p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#526675]">Penggunaan Bulan Ini</span>
                <span className="font-mono-tabular font-bold text-[#17324D]">
                  {formatNumberID(usedMonth)} (60%)
                </span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#D8E3E9]">
                <div className="h-full w-[60%] rounded-full bg-[#0284C7]" />
              </div>
            </div>
          </div>

          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-7">
            <h2 className="text-sm font-bold text-[#17324D]">
              Saldo &amp; Pemakaian Per Tenant
            </h2>
            <div className="mt-3 divide-y divide-[#EAF2F6]">
              {tenants.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-3 text-xs"
                >
                  <div>
                    <p className="font-bold text-[#17324D]">{t.name}</p>
                    <p className="text-[11px] text-[#526675]">
                      Terpakai bulan ini: {formatNumberID(t.monthlyCreditsUsed)} credits
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono-tabular text-sm font-bold text-[#17324D]">
                      {formatNumberID(t.creditsBalance)}
                    </p>
                    <p className="text-[11px] text-[#718391]">AI Credits tersedia</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'pricing' && (
        <>
          <div className="space-y-3 md:hidden">
            {pricingRules.map((r) => (
              <div
                key={r.id}
                className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-[#17324D]">{r.modelKey}</p>
                    <p className="text-[11px] text-[#526675]">{r.providerName}</p>
                  </div>
                  <AdminStatusText
                    tone={r.status === 'Aktif' ? 'success' : 'warning'}
                    label={r.status}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 rounded-[10px] bg-[#F5F8FA] p-2.5 text-center text-xs">
                  <div>
                    <p className="text-[10px] text-[#718391]">In / 1K</p>
                    <p className="font-mono-tabular font-bold text-[#17324D]">
                      {r.creditsPer1kInput}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#718391]">Out / 1K</p>
                    <p className="font-mono-tabular font-bold text-[#17324D]">
                      {r.creditsPer1kOutput}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#718391]">Valuasi</p>
                    <p className="font-mono-tabular font-bold text-[#0284C7]">
                      {formatIDR(r.idrPerCredit)}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => onOpenPricingModal(r)}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#D8E3E9] px-3 text-xs font-semibold text-[#0284C7]"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Edit Tarif</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-[14px] border border-[#D8E3E9] bg-white md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#EAF2F6] bg-[#F5F8FA] text-[#526675]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Model LLM</th>
                    <th className="px-4 py-3 font-semibold text-right">
                      Credits / 1K Input
                    </th>
                    <th className="px-4 py-3 font-semibold text-right">
                      Credits / 1K Output
                    </th>
                    <th className="px-4 py-3 font-semibold text-right">
                      Valuasi / Credit
                    </th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAF2F6]">
                  {pricingRules.map((r) => (
                    <tr key={r.id} className="hover:bg-[#F8FBFD]">
                      <td className="px-4 py-3 font-bold text-[#17324D]">
                        {r.modelKey}
                      </td>
                      <td className="px-4 py-3 text-right font-mono-tabular font-semibold text-[#17324D]">
                        {r.creditsPer1kInput}
                      </td>
                      <td className="px-4 py-3 text-right font-mono-tabular font-semibold text-[#17324D]">
                        {r.creditsPer1kOutput}
                      </td>
                      <td className="px-4 py-3 text-right font-mono-tabular font-semibold text-[#0284C7]">
                        {formatIDR(r.idrPerCredit)}
                      </td>
                      <td className="px-4 py-3">
                        <AdminStatusText
                          tone={r.status === 'Aktif' ? 'success' : 'warning'}
                          label={r.status}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenPricingModal(r)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8E3E9] text-[#0284C7]"
                          aria-label={`Edit tarif ${r.modelKey}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'ledger' && (
        <>
          <div className="space-y-3 md:hidden">
            {ledger.map((item) => {
              const positive = item.creditsDelta >= 0;
              return (
                <div
                  key={item.id}
                  className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-[#17324D]">{item.tenantName}</p>
                      <p className="font-mono-tabular text-[11px] text-[#718391]">
                        {item.reference} · {item.type}
                      </p>
                    </div>
                    <span
                      className={`font-mono-tabular inline-flex items-center gap-0.5 text-sm font-bold ${
                        positive ? 'text-[#247A55]' : 'text-[#B23A48]'
                      }`}
                    >
                      {positive ? '+' : ''}
                      {formatNumberID(item.creditsDelta)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#526675] border-t border-[#EAF2F6] pt-2">
                    <span>Saldo Akhir: {formatNumberID(item.balanceAfter)}</span>
                    <span>{item.timestamp}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden overflow-hidden rounded-[14px] border border-[#D8E3E9] bg-white md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#EAF2F6] bg-[#F5F8FA] text-[#526675]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Tenant &amp; Referensi</th>
                    <th className="px-4 py-3 font-semibold">Tipe Mutasi</th>
                    <th className="px-4 py-3 font-semibold text-right">Delta Credits</th>
                    <th className="px-4 py-3 font-semibold text-right">Saldo Akhir</th>
                    <th className="px-4 py-3 font-semibold text-right">Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAF2F6]">
                  {ledger.map((item) => {
                    const positive = item.creditsDelta >= 0;
                    return (
                      <tr key={item.id} className="hover:bg-[#F8FBFD]">
                        <td className="px-4 py-3">
                          <p className="font-bold text-[#17324D]">{item.tenantName}</p>
                          <p className="font-mono-tabular text-[11px] text-[#718391]">
                            {item.reference}
                          </p>
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#172B3A]">
                          {item.type}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-mono-tabular font-bold ${
                            positive ? 'text-[#247A55]' : 'text-[#B23A48]'
                          }`}
                        >
                          <span className="inline-flex items-center gap-0.5">
                            {positive ? (
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowDownRight className="h-3.5 w-3.5" />
                            )}
                            {positive ? '+' : ''}
                            {formatNumberID(item.creditsDelta)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono-tabular font-semibold text-[#17324D]">
                          {formatNumberID(item.balanceAfter)}
                        </td>
                        <td className="px-4 py-3 text-right text-[#718391]">
                          {item.timestamp}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
