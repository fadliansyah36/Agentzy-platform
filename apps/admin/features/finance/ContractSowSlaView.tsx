'use client';

import React, { useState } from 'react';
import { FileSignature, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  AdminPageHeader,
  AdminSegmentedTabs,
  AdminStatusText,
} from '../../components/data-display/AdminDataDisplay';
import type { ContractDocumentRecord } from '../../lib/admin-types';

export function ContractSowSlaView({
  contracts,
  onOpenModal,
  onDelete,
  onBack,
}: {
  contracts: ContractDocumentRecord[];
  onOpenModal: (doc?: ContractDocumentRecord) => void;
  onDelete?: (id: string) => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<'Kontrak' | 'SOW' | 'SLA'>('Kontrak');

  const filtered = contracts.filter((c) => c.docType === tab);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Kontrak, SOW & SLA Management"
        subtitle="Repositori kontrak induk (MSA), Statement of Work operasional ISP, dan komitmen SLA korporat terverifikasi."
        onBack={onBack}
        actions={
          <button
            type="button"
            onClick={() => onOpenModal()}
            className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#0284C7] px-4 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Buat Dokumen</span>
          </button>
        }
      />

      <AdminSegmentedTabs
        tabs={[
          { id: 'Kontrak', label: 'Kontrak' },
          { id: 'SOW', label: 'SOW' },
          { id: 'SLA', label: 'SLA' },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      <div className="space-y-3">
        {filtered.map((doc) => (
          <div
            key={doc.id}
            className="flex flex-col gap-3 rounded-[14px] border border-[#D8E3E9] bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#0284C7]">
                <FileSignature className="h-5 w-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono-tabular text-sm font-bold text-[#17324D]">
                    {doc.docNumber}
                  </span>
                  <AdminStatusText
                    tone={
                      doc.status === 'Aktif'
                        ? 'success'
                        : doc.status === 'Menunggu TTD'
                          ? 'warning'
                          : 'danger'
                    }
                    label={doc.status}
                  />
                </div>
                <p className="mt-0.5 text-xs font-semibold text-[#172B3A]">
                  {doc.title}
                </p>
                <p className="mt-1 text-[11px] text-[#526675]">
                  {doc.tenantName} · Berlaku: {doc.effectiveRange} · {doc.slaCommitment}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onOpenModal(doc)}
                className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-[#D8E3E9] px-3 text-xs font-semibold text-[#0284C7] hover:bg-[#E6F4F9]"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(doc.id)}
                  className="inline-flex h-9 items-center gap-1 rounded-[10px] border border-[#D8E3E9] px-3 text-xs font-semibold text-[#B23A48] hover:bg-[#B23A48]/10"
                  aria-label={`Hapus ${doc.docNumber}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Hapus</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
