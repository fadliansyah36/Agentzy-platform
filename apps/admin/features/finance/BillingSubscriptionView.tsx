'use client';

import React, { useState } from 'react';
import {
  Coins,
  Receipt,
  Plus,
  CheckCircle2,
  Eye,
  Zap,
  Building2,
  FileSignature,
} from 'lucide-react';
import { formatIDR, formatNumberID } from '../../lib/admin-data';
import type {
  AdminTenantRecord,
  CreditTopUpPackageRecord,
  PlatformInvoiceRecord,
} from '../../lib/admin-types';

export function BillingSubscriptionView({
  creditTopUpPackages,
  tenants,
  invoices,
  onOpenTopUpModal,
  onOpenInvoiceModal,
  onOpenInvoiceDetail,
  onMarkInvoicePaid,
}: {
  creditTopUpPackages: CreditTopUpPackageRecord[];
  tenants: AdminTenantRecord[];
  invoices: PlatformInvoiceRecord[];
  onOpenTopUpModal: (presetTenantName?: string, presetCredits?: number) => void;
  onOpenInvoiceModal: () => void;
  onOpenInvoiceDetail: (invoiceId: string) => void;
  onMarkInvoicePaid: (invoiceId: string) => void;
}) {
  const [tab, setTab] = useState<'topup' | 'invoices'>('topup');

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#172B3A]">
            Top Up AI Credits & Invoice Korporat
          </h1>
          <p className="mt-1 text-sm text-[#526675]">
            Tidak ada tagihan langganan SaaS berulang — korporat hanya melakukan Top Up AI Credits
            dan settlement sesuai Kontrak Kerjasama masing-masing.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onOpenTopUpModal()}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] border border-[#0284C7] bg-[#E6F4F9] px-3.5 text-xs font-semibold text-[#0284C7] hover:bg-[#0284C7] hover:text-white"
          >
            <Coins className="h-3.5 w-3.5" /> Top Up AI Credits
          </button>
          <button
            type="button"
            onClick={onOpenInvoiceModal}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] bg-[#0284C7] px-4 text-xs font-semibold text-white hover:bg-[#0369A1]"
          >
            <Plus className="h-3.5 w-3.5" /> Terbitkan Invoice Kontrak
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-[10px] border border-[#D8E3E9] bg-white p-1 sm:w-fit">
        {[
          { id: 'topup', label: 'Top Up AI Credits & Saldo' },
          { id: 'invoices', label: 'Invoice Korporat' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as typeof tab)}
            className={`rounded-[8px] px-3 py-1.5 text-xs font-semibold transition-colors ${
              tab === t.id
                ? 'bg-[#17324D] text-white'
                : 'text-[#526675] hover:bg-[#F5F8FA] hover:text-[#172B3A]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'topup' && (
        <div className="space-y-5">
          {/* Voucher / Paket Top Up AI Credits */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#172B3A]">
                Opsi Paket Top Up AI Credits (Pay-As-You-Top-Up)
              </h2>
              <span className="text-xs font-semibold text-[#0284C7]">Tanpa Langganan Bulanan</span>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {creditTopUpPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="flex flex-col justify-between rounded-[14px] border border-[#D8E3E9] bg-white p-5"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono-tabular font-semibold text-[#526675]">
                        {pkg.code}
                      </span>
                      <span className="text-xs font-semibold text-[#247A55]">{pkg.status}</span>
                    </div>
                    <h3 className="mt-1.5 text-base font-bold text-[#172B3A]">{pkg.name}</h3>
                    <p className="mt-0.5 text-xs text-[#526675]">{pkg.recommendedFor}</p>

                    <div className="mt-3 border-y border-[#D8E3E9] py-3">
                      <p className="text-xl font-bold text-[#0284C7] tabular-nums">
                        {formatNumberID(pkg.creditsAmount + pkg.bonusCredits)} Credits
                      </p>
                      <p className="text-[11px] text-[#247A55] font-semibold">
                        ({formatNumberID(pkg.creditsAmount)} pokok +{' '}
                        {formatNumberID(pkg.bonusCredits)} bonus)
                      </p>
                      <p className="mt-1 text-sm font-bold text-[#172B3A] tabular-nums">
                        {formatIDR(pkg.priceIdr)}
                      </p>
                    </div>

                    <p className="mt-2.5 text-xs text-[#526675]">{pkg.validityNote}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onOpenTopUpModal(tenants[0]?.name, pkg.creditsAmount + pkg.bonusCredits)
                    }
                    className="mt-4 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] text-xs font-semibold text-[#172B3A] hover:border-[#0284C7] hover:bg-[#E6F4F9] hover:text-[#0284C7]"
                  >
                    <Zap className="h-3.5 w-3.5 text-[#0284C7]" />
                    Top Up Sekarang
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Saldo AI Credits & Kontrak Kerjasama per Korporat */}
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#172B3A]">
                  Saldo AI Credits & Kontrak Aktif per Korporat
                </h2>
                <p className="text-xs text-[#526675]">
                  Setiap korporat menggunakan saldo AI Credits untuk AI Worker & Workflow tanpa
                  biaya langganan platform.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {tenants.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-col justify-between gap-3 rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-4 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 shrink-0 text-[#17324D]" />
                      <p className="truncate text-sm font-bold text-[#172B3A]">{t.name}</p>
                      <span
                        className={`text-xs font-semibold ${
                          t.status === 'Aktif' ? 'text-[#247A55]' : 'text-[#A96816]'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#526675]">
                      <span className="inline-flex items-center gap-1 font-mono-tabular font-semibold text-[#17324D]">
                        <FileSignature className="h-3 w-3 text-[#0284C7]" />
                        {t.contractNumber}
                      </span>
                      <span>·</span>
                      <span>{t.cooperationLabel}</span>
                    </div>
                    <p className="mt-1.5 text-xs font-semibold text-[#172B3A] tabular-nums">
                      Saldo: {formatNumberID(t.creditsBalance)} Credits{' '}
                      <span className="font-normal text-[#526675]">
                        (Terpakai bln ini: {formatNumberID(t.monthlyCreditsUsed)})
                      </span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenTopUpModal(t.name, 150000)}
                    className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-[8px] border border-[#0284C7] bg-white px-3 text-xs font-semibold text-[#0284C7] hover:bg-[#0284C7] hover:text-white"
                  >
                    <Plus className="h-3.5 w-3.5" /> Top Up AI Credits
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'invoices' && (
        <div className="space-y-3">
          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="rounded-[14px] border border-[#D8E3E9] bg-white p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#172B3A]">{inv.invoiceNumber}</p>
                    <p className="text-xs text-[#526675]">
                      {inv.tenantName} · {inv.category}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      inv.status === 'Lunas' ? 'text-[#247A55]' : 'text-[#A96816]'
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
                <p className="mt-2 text-base font-bold text-[#172B3A] tabular-nums">
                  {formatIDR(inv.amountIdr)}
                </p>
                <div className="mt-3 flex gap-2 border-t border-[#D8E3E9] pt-2.5">
                  <button
                    type="button"
                    onClick={() => onOpenInvoiceDetail(inv.id)}
                    className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-[8px] border border-[#D8E3E9] bg-[#F5F8FA] text-xs font-semibold text-[#172B3A]"
                  >
                    <Eye className="h-3.5 w-3.5" /> Detail
                  </button>
                  {inv.status !== 'Lunas' && (
                    <button
                      type="button"
                      onClick={() => onMarkInvoicePaid(inv.id)}
                      className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-[8px] bg-[#247A55] text-xs font-semibold text-white"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Tandai Lunas
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto rounded-[14px] border border-[#D8E3E9] bg-white">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#D8E3E9] bg-[#F5F8FA] text-[11px] font-semibold uppercase tracking-wider text-[#526675]">
                <tr>
                  <th className="px-4 py-3">No. Invoice</th>
                  <th className="px-4 py-3">Tenant / Korporat</th>
                  <th className="px-4 py-3">Kategori Tagihan</th>
                  <th className="px-4 py-3">Nominal</th>
                  <th className="px-4 py-3">Jatuh Tempo</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8E3E9]">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#F5F8FA]/60">
                    <td className="px-4 py-3 font-mono-tabular font-semibold text-[#172B3A]">
                      <div className="flex items-center gap-1.5">
                        <Receipt className="h-3.5 w-3.5 text-[#0284C7]" />
                        {inv.invoiceNumber}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#172B3A]">{inv.tenantName}</td>
                    <td className="px-4 py-3 text-[#526675]">{inv.category}</td>
                    <td className="px-4 py-3 font-semibold text-[#172B3A] tabular-nums">
                      {formatIDR(inv.amountIdr)}
                    </td>
                    <td className="px-4 py-3 text-[#526675]">{inv.dueDate}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-semibold ${
                          inv.status === 'Lunas' ? 'text-[#247A55]' : 'text-[#A96816]'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenInvoiceDetail(inv.id)}
                          className="rounded-[8px] border border-[#D8E3E9] px-2.5 py-1 text-[11px] font-semibold text-[#172B3A] hover:border-[#0284C7]"
                        >
                          Detail
                        </button>
                        {inv.status !== 'Lunas' && (
                          <button
                            type="button"
                            onClick={() => onMarkInvoicePaid(inv.id)}
                            className="rounded-[8px] border border-[#247A55]/30 bg-[#E6F4F9]/50 px-2.5 py-1 text-[11px] font-semibold text-[#247A55]"
                          >
                            Tandai Lunas
                          </button>
                        )}
                      </div>
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
