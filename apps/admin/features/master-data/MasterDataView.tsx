'use client';

import React, { useState } from 'react';
import { Database, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  AdminPageHeader,
  AdminSegmentedTabs,
  AdminStatusText,
} from '../../components/data-display/AdminDataDisplay';
import { formatIDR } from '../../lib/admin-data';
import type {
  MasterIndustryItem,
  MasterProductItem,
  MasterServiceItem,
} from '../../lib/admin-types';

export function MasterDataView({
  industries,
  services,
  products,
  onOpenIndustryModal,
  onDeleteIndustry,
  onOpenServiceModal,
  onDeleteService,
  onOpenProductModal,
  onDeleteProduct,
  onBack,
}: {
  industries: MasterIndustryItem[];
  services: MasterServiceItem[];
  products: MasterProductItem[];
  onOpenIndustryModal: (item?: MasterIndustryItem) => void;
  onDeleteIndustry: (id: string) => void;
  onOpenServiceModal: (item?: MasterServiceItem) => void;
  onDeleteService: (id: string) => void;
  onOpenProductModal: (item?: MasterProductItem) => void;
  onDeleteProduct: (id: string) => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<'industri' | 'layanan' | 'produk'>('industri');

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Master Data Industri, Layanan & Produk (CRUD)"
        subtitle="Kelola katalog multi-industri, layanan Human & AI Workforce, serta produk provider."
        onBack={onBack}
        actions={
          <button
            type="button"
            onClick={() => {
              if (tab === 'industri') onOpenIndustryModal();
              else if (tab === 'layanan') onOpenServiceModal();
              else onOpenProductModal();
            }}
            className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#0284C7] px-4 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>
              Tambah {tab === 'industri' ? 'Industri' : tab === 'layanan' ? 'Layanan' : 'Produk'}
            </span>
          </button>
        }
      />

      <AdminSegmentedTabs
        tabs={[
          { id: 'industri', label: `Industri (${industries.length})` },
          { id: 'layanan', label: `Layanan (${services.length})` },
          { id: 'produk', label: `Produk (${products.length})` },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      {tab === 'industri' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {industries.map((ind) => (
            <div
              key={ind.id}
              className="flex flex-col justify-between rounded-[14px] border border-[#D8E3E9] bg-white p-5"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#0284C7]">
                      <Database className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#17324D]">{ind.name}</h3>
                      <p className="font-mono-tabular text-[11px] text-[#718391]">
                        {ind.code}
                      </p>
                    </div>
                  </div>
                  <AdminStatusText
                    tone={ind.status === 'Aktif' ? 'success' : 'warning'}
                    label={ind.status}
                  />
                </div>
                <p className="mt-3 text-xs leading-relaxed text-[#526675]">
                  {ind.description}
                </p>
                <p className="mt-2 font-mono-tabular text-xs font-semibold text-[#17324D]">
                  {ind.serviceCount} layanan · {ind.productCount} produk
                </p>
              </div>

              <div className="mt-4 flex justify-end gap-2 border-t border-[#EAF2F6] pt-3">
                <button
                  type="button"
                  onClick={() => onOpenIndustryModal(ind)}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#D8E3E9] px-2.5 text-xs font-semibold text-[#17324D] hover:bg-[#E6F4F9]"
                >
                  <Pencil className="h-3 w-3" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteIndustry(ind.id)}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#D8E3E9] px-2.5 text-xs font-semibold text-[#B23A48] hover:bg-[#B23A48]/10"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'layanan' && (
        <>
          <div className="space-y-3 md:hidden">
            {services.map((svc) => (
              <div
                key={svc.id}
                className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-[#17324D]">{svc.name}</p>
                    <p className="text-[11px] text-[#526675]">
                      {svc.category} · {svc.industryCode}
                    </p>
                  </div>
                  <AdminStatusText
                    tone={svc.status === 'Aktif' ? 'success' : 'neutral'}
                    label={svc.status}
                  />
                </div>
                <p className="text-xs text-[#526675]">{svc.scope}</p>
                <div className="flex items-center justify-between border-t border-[#EAF2F6] pt-2.5 text-xs">
                  <span className="font-mono-tabular text-[11px] font-semibold text-[#17324D]">
                    SLA: {svc.slaStandard}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenServiceModal(svc)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D8E3E9] text-[#0284C7]"
                      aria-label={`Edit ${svc.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteService(svc.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D8E3E9] text-[#B23A48]"
                      aria-label={`Hapus ${svc.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-[14px] border border-[#D8E3E9] bg-white md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#EAF2F6] bg-[#F5F8FA] text-[#526675]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Nama Layanan</th>
                    <th className="px-4 py-3 font-semibold">Kategori</th>
                    <th className="px-4 py-3 font-semibold">Industri</th>
                    <th className="px-4 py-3 font-semibold">Standar SLA</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Aksi CRUD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAF2F6]">
                  {services.map((svc) => (
                    <tr key={svc.id} className="hover:bg-[#F8FBFD]">
                      <td className="px-4 py-3">
                        <p className="font-bold text-[#17324D]">{svc.name}</p>
                        <p className="text-[11px] text-[#526675]">{svc.scope}</p>
                      </td>
                      <td className="px-4 py-3 font-medium text-[#172B3A]">
                        {svc.category}
                      </td>
                      <td className="px-4 py-3 font-mono-tabular text-[#526675]">
                        {svc.industryCode}
                      </td>
                      <td className="px-4 py-3 text-[#526675]">{svc.slaStandard}</td>
                      <td className="px-4 py-3">
                        <AdminStatusText
                          tone={svc.status === 'Aktif' ? 'success' : 'neutral'}
                          label={svc.status}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenServiceModal(svc)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8E3E9] text-[#0284C7] hover:bg-[#E6F4F9]"
                            aria-label={`Edit ${svc.name}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteService(svc.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8E3E9] text-[#B23A48] hover:bg-[#B23A48]/10"
                            aria-label={`Hapus ${svc.name}`}
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

      {tab === 'produk' && (
        <>
          <div className="space-y-3 md:hidden">
            {products.map((prd) => (
              <div
                key={prd.id}
                className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-[#17324D]">{prd.name}</p>
                    <p className="font-mono-tabular text-[11px] text-[#718391]">
                      {prd.code} · {prd.providerName}
                    </p>
                  </div>
                  <AdminStatusText
                    tone={prd.status === 'Aktif' ? 'success' : 'warning'}
                    label={prd.status}
                  />
                </div>
                <div className="flex items-center justify-between rounded-[10px] bg-[#F5F8FA] px-3 py-2 text-xs">
                  <span className="text-[#526675]">{prd.unitMeasure}</span>
                  <span className="font-mono-tabular font-bold text-[#17324D]">
                    {formatIDR(prd.baseTariffIdr)}
                  </span>
                </div>
                <div className="flex justify-end gap-1.5 border-t border-[#EAF2F6] pt-2.5">
                  <button
                    type="button"
                    onClick={() => onOpenProductModal(prd)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D8E3E9] text-[#0284C7]"
                    aria-label={`Edit ${prd.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteProduct(prd.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D8E3E9] text-[#B23A48]"
                    aria-label={`Hapus ${prd.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
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
                    <th className="px-4 py-3 font-semibold">Produk &amp; Kode</th>
                    <th className="px-4 py-3 font-semibold">Provider</th>
                    <th className="px-4 py-3 font-semibold">Satuan Produktivitas</th>
                    <th className="px-4 py-3 font-semibold text-right">Tarif Dasar</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Aksi CRUD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAF2F6]">
                  {products.map((prd) => (
                    <tr key={prd.id} className="hover:bg-[#F8FBFD]">
                      <td className="px-4 py-3">
                        <p className="font-bold text-[#17324D]">{prd.name}</p>
                        <p className="font-mono-tabular text-[11px] text-[#718391]">
                          {prd.code} · {prd.industryCode}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-medium text-[#172B3A]">
                        {prd.providerName}
                      </td>
                      <td className="px-4 py-3 text-[#526675]">{prd.unitMeasure}</td>
                      <td className="px-4 py-3 text-right font-mono-tabular font-semibold text-[#17324D]">
                        {formatIDR(prd.baseTariffIdr)}
                      </td>
                      <td className="px-4 py-3">
                        <AdminStatusText
                          tone={prd.status === 'Aktif' ? 'success' : 'warning'}
                          label={prd.status}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenProductModal(prd)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8E3E9] text-[#0284C7] hover:bg-[#E6F4F9]"
                            aria-label={`Edit ${prd.name}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteProduct(prd.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8E3E9] text-[#B23A48] hover:bg-[#B23A48]/10"
                            aria-label={`Hapus ${prd.name}`}
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
