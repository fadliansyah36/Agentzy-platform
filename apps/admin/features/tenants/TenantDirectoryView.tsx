'use client';

import React, { useMemo, useState } from 'react';
import { Building2, Plus, Search, Pencil, Trash2, Eye } from 'lucide-react';
import {
  AdminPageHeader,
  AdminSegmentedTabs,
  AdminStatusText,
} from '../../components/data-display/AdminDataDisplay';
import { formatNumberID } from '../../lib/admin-data';
import type { AdminTenantRecord } from '../../lib/admin-types';

export function TenantDirectoryView({
  tenants,
  onOpenCreate,
  onOpenEdit,
  onOpenDetail,
  onDelete,
  onBack,
}: {
  tenants: AdminTenantRecord[];
  onOpenCreate: () => void;
  onOpenEdit: (tenant: AdminTenantRecord) => void;
  onOpenDetail: (tenantId: string) => void;
  onDelete: (tenantId: string) => void;
  onBack: () => void;
}) {
  const [filter, setFilter] = useState<'Semua' | 'Aktif' | 'Trial' | 'Suspended'>('Semua');
  const [query, setQuery] = useState('');

  const aktifCount = tenants.filter((t) => t.status === 'Aktif').length;
  const trialCount = tenants.filter((t) => t.status === 'Trial').length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tenants.filter((t) => {
      const matchTab = filter === 'Semua' || t.status === filter;
      const matchQuery =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.domain.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q);
      return matchTab && matchQuery;
    });
  }, [filter, query, tenants]);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Tenant Directory & Detail Tenant"
        subtitle="Kelola tenant terisolasi, kuota workforce, kontrak kerjasama, dan saldo Top Up AI Credits."
        onBack={onBack}
        actions={
          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#0284C7] px-4 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Tenant</span>
          </button>
        }
      />

      {/* Search & Filter matching Screen 2 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5F879E]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari tenant, domain, atau ID..."
            className="h-11 w-full rounded-[10px] border border-[#D8E3E9] bg-white pl-9 pr-3 text-xs text-[#172B3A] outline-none focus:border-[#0284C7]"
          />
        </div>

        <AdminSegmentedTabs
          tabs={[
            { id: 'Semua', label: `Semua (${tenants.length})` },
            { id: 'Aktif', label: `Aktif (${aktifCount})` },
            { id: 'Trial', label: `Trial (${trialCount})` },
            { id: 'Suspended', label: 'Suspended' },
          ]}
          activeTab={filter}
          onChange={setFilter}
        />
      </div>

      {/* Tenant Cards & Table */}
      {filtered.length === 0 ? (
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-10 text-center">
          <Building2 className="mx-auto h-8 w-8 text-[#5F879E]" />
          <p className="mt-2 text-sm font-bold text-[#17324D]">
            Tidak ada tenant yang cocok
          </p>
          <p className="mt-1 text-xs text-[#526675]">
            Ubah kata kunci pencarian atau tambahkan tenant baru.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile-first Cards matching Screen 2 */}
          <div className="space-y-3 md:hidden">
            {filtered.map((t) => (
              <div
                key={t.id}
                className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenDetail(t.id)}
                    className="min-w-0 text-left"
                  >
                    <p className="text-sm font-bold text-[#17324D]">{t.name}</p>
                    <p className="font-mono-tabular truncate text-[11px] text-[#718391]">
                      {t.domain} · {t.code}
                    </p>
                  </button>
                  <AdminStatusText
                    tone={
                      t.status === 'Aktif'
                        ? 'success'
                        : t.status === 'Trial'
                          ? 'warning'
                          : 'danger'
                    }
                    label={t.status}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 rounded-[10px] bg-[#F5F8FA] p-3 text-center">
                  <div>
                    <p className="text-[10px] text-[#526675]">Human</p>
                    <p className="font-mono-tabular text-xs font-bold text-[#17324D]">
                      {formatNumberID(t.humanCount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#526675]">AI Worker</p>
                    <p className="font-mono-tabular text-xs font-bold text-[#17324D]">
                      {formatNumberID(t.aiWorkerCount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#526675]">SLA</p>
                    <p className="font-mono-tabular text-xs font-bold text-[#247A55]">
                      {String(t.slaScore).replace('.', ',')}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-[#EAF2F6] pt-2.5 text-xs">
                  <span className="truncate text-[11px] font-medium text-[#526675]">
                    {t.contractNumber} · {t.cooperationLabel}
                  </span>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenDetail(t.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D8E3E9] text-[#17324D]"
                      aria-label={`Detail ${t.name}`}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenEdit(t)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D8E3E9] text-[#0284C7]"
                      aria-label={`Edit ${t.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(t.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D8E3E9] text-[#B23A48]"
                      aria-label={`Hapus ${t.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden overflow-hidden rounded-[14px] border border-[#D8E3E9] bg-white md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#EAF2F6] bg-[#F5F8FA] text-[#526675]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Tenant &amp; Domain</th>
                    <th className="px-4 py-3 font-semibold">Industri &amp; Kontrak Kerjasama</th>
                    <th className="px-4 py-3 font-semibold text-right">Human</th>
                    <th className="px-4 py-3 font-semibold text-right">AI Worker</th>
                    <th className="px-4 py-3 font-semibold text-right">SLA</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Aksi CRUD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAF2F6]">
                  {filtered.map((t) => (
                    <tr key={t.id} className="hover:bg-[#F8FBFD]">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => onOpenDetail(t.id)}
                          className="text-left group"
                        >
                          <p className="font-bold text-[#17324D] group-hover:text-[#0284C7]">
                            {t.name}
                          </p>
                          <p className="font-mono-tabular text-[11px] text-[#718391]">
                            {t.domain} · {t.code}
                          </p>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#172B3A]">{t.industry}</p>
                        <p className="text-[11px] text-[#526675]">
                          {t.contractNumber} · {t.cooperationLabel}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right font-mono-tabular font-semibold text-[#17324D]">
                        {formatNumberID(t.humanCount)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono-tabular font-semibold text-[#17324D]">
                        {formatNumberID(t.aiWorkerCount)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono-tabular font-semibold text-[#247A55]">
                        {String(t.slaScore).replace('.', ',')}%
                      </td>
                      <td className="px-4 py-3">
                        <AdminStatusText
                          tone={
                            t.status === 'Aktif'
                              ? 'success'
                              : t.status === 'Trial'
                                ? 'warning'
                                : 'danger'
                          }
                          label={t.status}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenDetail(t.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8E3E9] text-[#17324D] hover:bg-[#E6F4F9]"
                            aria-label={`Detail ${t.name}`}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenEdit(t)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8E3E9] text-[#0284C7] hover:bg-[#E6F4F9]"
                            aria-label={`Edit ${t.name}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(t.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8E3E9] text-[#B23A48] hover:bg-[#B23A48]/10"
                            aria-label={`Hapus ${t.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
