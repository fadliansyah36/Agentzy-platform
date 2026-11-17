'use client';

import React from 'react';
import {
  ShieldAlert,
  Database,
  FileCheck2,
  Building,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminStatusText,
} from '../../components/data-display/AdminDataDisplay';
import type {
  DsrRequestRecord,
  VendorSubprocessorRecord,
} from '../../lib/admin-types';

export function DataGovernanceView({
  dsrRequests,
  vendors,
  onAdvanceDsr,
  onOpenVendorModal,
  onDeleteVendor,
  onNotify,
  onBack,
}: {
  dsrRequests: DsrRequestRecord[];
  vendors: VendorSubprocessorRecord[];
  onAdvanceDsr: (id: string) => void;
  onOpenVendorModal: (vendor?: VendorSubprocessorRecord) => void;
  onDeleteVendor?: (id: string) => void;
  onNotify: (msg: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Data Governance (Retention, DSR & Vendor)"
        subtitle="Klasifikasi data, kebijakan retensi & arsip, antrean Permintaan Subjek Data (DSR UU PDP), dan register vendor sub-processor."
        onBack={onBack}
        actions={
          <button
            type="button"
            onClick={() => onOpenVendorModal()}
            className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#0284C7] px-4 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Vendor</span>
          </button>
        }
      />

      {/* Top 2 Policy Cards matching Screen 29 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 space-y-2.5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-[#0284C7]" />
            <h2 className="text-sm font-bold text-[#17324D]">Kebijakan Data</h2>
          </div>
          <p className="text-xs text-[#526675]">
            Klasifikasi, akses, retensi: Public · Internal · Confidential · Restricted (PII
            KTP/NPWP &amp; Bank terenkripsi AES-256).
          </p>
          <AdminStatusText tone="success" label="Enkripsi & RLS Tenant Aktif" />
        </div>

        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-[#0284C7]" />
              <h2 className="text-sm font-bold text-[#17324D]">Retensi &amp; Arsip</h2>
            </div>
            <p className="mt-1.5 text-xs text-[#526675]">
              Aturan penyimpanan data: Transaksi &amp; Audit Ledger (7 tahun) · Working AI
              Memory (90–180 hari).
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              onNotify('Verifikasi arsip retensi UU PDP selesai: 0 pelanggaran ditemukan.')
            }
            className="inline-flex h-9 w-fit items-center gap-1.5 rounded-[10px] border border-[#D8E3E9] px-3 text-xs font-semibold text-[#17324D] hover:bg-[#EAF2F6]"
          >
            <FileCheck2 className="h-3.5 w-3.5 text-[#247A55]" />
            <span>Verifikasi Kepatuhan Arsip</span>
          </button>
        </div>
      </div>

      {/* DSR Queue */}
      <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 space-y-3">
        <div>
          <h2 className="text-sm font-bold text-[#17324D]">
            Permintaan Subjek Data (DSR: akses, hapus, koreksi)
          </h2>
          <p className="text-xs text-[#526675]">
            SLA penyelesaian DSR maksimal 7 hari kalender sesuai standar UU PDP.
          </p>
        </div>

        {/* Mobile DSR Cards */}
        <div className="space-y-2.5 md:hidden">
          {dsrRequests.map((dsr) => (
            <div
              key={dsr.id}
              className="rounded-[12px] border border-[#EAF2F6] bg-[#F5F8FA] p-3.5 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-[#17324D]">{dsr.requesterName}</p>
                  <p className="text-[11px] text-[#526675]">
                    {dsr.tenantName} · {dsr.submittedAt}
                  </p>
                </div>
                <AdminStatusText
                  tone={
                    dsr.status === 'Selesai'
                      ? 'success'
                      : dsr.status === 'Diproses'
                        ? 'info'
                        : 'warning'
                  }
                  label={dsr.status}
                />
              </div>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-[#0284C7]">{dsr.requestType}</span>
                <span className="font-mono-tabular text-[11px] text-[#526675]">
                  SLA: {dsr.slaDue}
                </span>
              </div>
              {dsr.status !== 'Selesai' && (
                <button
                  type="button"
                  onClick={() => onAdvanceDsr(dsr.id)}
                  className="inline-flex h-9 w-full items-center justify-center gap-1 rounded-lg bg-[#0284C7] px-3 text-xs font-semibold text-white hover:bg-[#0369A1]"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>
                    {dsr.status === 'Menunggu Verifikasi' ? 'Proses DSR' : 'Selesaikan DSR'}
                  </span>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Desktop DSR Table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#EAF2F6] bg-[#F5F8FA] text-[#526675]">
              <tr>
                <th className="px-4 py-3 font-semibold">Pemohon &amp; Tenant</th>
                <th className="px-4 py-3 font-semibold">Jenis Permintaan</th>
                <th className="px-4 py-3 font-semibold">Batas SLA</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAF2F6]">
              {dsrRequests.map((dsr) => (
                <tr key={dsr.id} className="hover:bg-[#F8FBFD]">
                  <td className="px-4 py-3">
                    <p className="font-bold text-[#17324D]">{dsr.requesterName}</p>
                    <p className="text-[11px] text-[#526675]">
                      {dsr.tenantName} · Masuk: {dsr.submittedAt}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#0284C7]">
                    {dsr.requestType}
                  </td>
                  <td className="px-4 py-3 font-mono-tabular text-[#526675]">
                    {dsr.slaDue}
                  </td>
                  <td className="px-4 py-3">
                    <AdminStatusText
                      tone={
                        dsr.status === 'Selesai'
                          ? 'success'
                          : dsr.status === 'Diproses'
                            ? 'info'
                            : 'warning'
                      }
                      label={dsr.status}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {dsr.status !== 'Selesai' ? (
                      <button
                        type="button"
                        onClick={() => onAdvanceDsr(dsr.id)}
                        className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#0284C7] px-3 text-xs font-semibold text-white hover:bg-[#0369A1]"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>
                          {dsr.status === 'Menunggu Verifikasi' ? 'Proses' : 'Selesaikan'}
                        </span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-[#247A55] font-semibold">
                        Tutup
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vendor Register */}
      <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-[#0284C7]" />
          <h2 className="text-sm font-bold text-[#17324D]">
            Vendor Register (Daftar Pihak Ketiga &amp; Kepatuhan DPA)
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {vendors.map((v) => (
            <div
              key={v.id}
              className="flex items-start justify-between gap-3 rounded-[10px] border border-[#EAF2F6] bg-[#F5F8FA] p-4"
            >
              <div>
                <p className="text-xs font-bold text-[#17324D]">{v.name}</p>
                <p className="text-[11px] text-[#526675]">
                  {v.category} · Region: {v.dataRegion}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <AdminStatusText
                    tone={v.dpaStatus === 'Signed & Valid' ? 'success' : 'warning'}
                    label={v.dpaStatus}
                  />
                  <span className="text-[11px] text-[#718391]">
                    · Risiko {v.riskClass}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenVendorModal(v)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D8E3E9] bg-white text-[#0284C7]"
                  aria-label={`Edit ${v.name}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                {onDeleteVendor && (
                  <button
                    type="button"
                    onClick={() => onDeleteVendor(v.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D8E3E9] bg-white text-[#B23A48]"
                    aria-label={`Hapus ${v.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
