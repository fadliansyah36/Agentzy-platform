'use client';

import React, { useState } from 'react';
import { BookOpen, Plus, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import {
  AdminPageHeader,
  AdminSegmentedTabs,
  AdminStatusText,
} from '../../components/data-display/AdminDataDisplay';
import { formatNumberID } from '../../lib/admin-data';
import type { KnowledgeSourceRecord } from '../../lib/admin-types';

export function KnowledgeRagAdminView({
  sources,
  onOpenModal,
  onReindex,
  onDelete,
  onBack,
}: {
  sources: KnowledgeSourceRecord[];
  onOpenModal: (source?: KnowledgeSourceRecord) => void;
  onReindex: (id: string) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<'sumber' | 'indeks' | 'kualitas'>('sumber');

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Knowledge / RAG (Indexing & Sumber Data)"
        subtitle="Kelola dokumen sumber, pipeline chunking & embedding pgvector, serta validasi kualitas retrieval per tenant."
        onBack={onBack}
        actions={
          <button
            type="button"
            onClick={() => onOpenModal()}
            className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#0284C7] px-4 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Sumber</span>
          </button>
        }
      />

      <AdminSegmentedTabs
        tabs={[
          { id: 'sumber', label: `Sumber (${sources.length})` },
          { id: 'indeks', label: 'Indeks pgvector' },
          { id: 'kualitas', label: 'Kualitas Retrieval' },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      {tab === 'sumber' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {sources.map((src) => (
            <div
              key={src.id}
              className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#0284C7]">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#17324D]">{src.name}</h3>
                    <p className="text-[11px] text-[#526675]">
                      {src.tenantName} · {src.classification}
                    </p>
                  </div>
                </div>
                <AdminStatusText
                  tone={src.status === 'Terindeks' ? 'success' : 'warning'}
                  label={`${src.indexedPct}% · ${src.status}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-[10px] bg-[#F5F8FA] p-3 text-xs">
                <div>
                  <span className="text-[#718391]">Dokumen</span>
                  <p className="font-mono-tabular font-bold text-[#17324D]">
                    {formatNumberID(src.documentCount)} dokumen
                  </p>
                </div>
                <div>
                  <span className="text-[#718391]">Vector Chunks</span>
                  <p className="font-mono-tabular font-bold text-[#17324D]">
                    {formatNumberID(src.chunkCount)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[#EAF2F6] pt-3">
                <span className="text-[11px] text-[#718391]">
                  Sync: {src.lastIndexedAt}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onReindex(src.id)}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#D8E3E9] px-2.5 text-xs font-semibold text-[#17324D] hover:bg-[#EAF2F6]"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Re-index</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenModal(src)}
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-[#D8E3E9] px-2 text-[#0284C7]"
                    aria-label={`Edit ${src.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(src.id)}
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-[#D8E3E9] px-2 text-[#B23A48]"
                    aria-label={`Hapus ${src.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'indeks' && (
        <div className="space-y-3">
          {/* Mobile Index Cards */}
          <div className="space-y-2.5 md:hidden">
            {sources.map((src) => (
              <div
                key={src.id}
                className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-[#17324D]">{src.name}</p>
                    <p className="text-xs text-[#526675]">{src.tenantName}</p>
                  </div>
                  <span className="font-mono-tabular text-xs font-bold text-[#247A55]">
                    {src.indexedPct}%
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-[10px] bg-[#F5F8FA] px-3 py-2 text-xs">
                  <span className="text-[#526675]">
                    Chunks:{' '}
                    <strong className="font-mono-tabular text-[#17324D]">
                      {formatNumberID(src.chunkCount)}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => onReindex(src.id)}
                    className="rounded-lg border border-[#D8E3E9] bg-white px-3 py-1.5 text-xs font-semibold text-[#0284C7]"
                  >
                    Sync Ulang
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Index Table */}
          <div className="hidden overflow-hidden rounded-[14px] border border-[#D8E3E9] bg-white md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#EAF2F6] bg-[#F5F8FA] text-[#526675]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Sumber Pengetahuan</th>
                    <th className="px-4 py-3 font-semibold">Tenant</th>
                    <th className="px-4 py-3 font-semibold text-right">Chunks</th>
                    <th className="px-4 py-3 font-semibold text-right">Indeks</th>
                    <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAF2F6]">
                  {sources.map((src) => (
                    <tr key={src.id} className="hover:bg-[#F8FBFD]">
                      <td className="px-4 py-3 font-bold text-[#17324D]">{src.name}</td>
                      <td className="px-4 py-3 text-[#526675]">{src.tenantName}</td>
                      <td className="px-4 py-3 text-right font-mono-tabular font-semibold text-[#17324D]">
                        {formatNumberID(src.chunkCount)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono-tabular font-bold text-[#247A55]">
                        {src.indexedPct}%
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => onReindex(src.id)}
                          className="rounded-lg border border-[#D8E3E9] px-2.5 py-1 text-xs font-semibold text-[#0284C7] hover:bg-[#E6F4F9]"
                        >
                          Sync Ulang
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'kualitas' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
            <p className="text-xs font-semibold text-[#526675]">
              Precision@5 Retrieval
            </p>
            <p className="mt-1 font-mono-tabular text-2xl font-bold text-[#17324D]">
              96,4%
            </p>
            <p className="mt-1 text-[11px] text-[#247A55]">
              Isolasi filter tenant_id aktif pada seluruh query vektor
            </p>
          </div>
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
            <p className="text-xs font-semibold text-[#526675]">
              Citation Grounding Score
            </p>
            <p className="mt-1 font-mono-tabular text-2xl font-bold text-[#17324D]">
              98,1%
            </p>
            <p className="mt-1 text-[11px] text-[#526675]">
              Jawaban AI Tech &amp; Sales menyertakan referensi SOP terindeks
            </p>
          </div>
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
            <p className="text-xs font-semibold text-[#526675]">
              Deletion Propagation SLA
            </p>
            <p className="mt-1 font-mono-tabular text-2xl font-bold text-[#247A55]">
              &lt; 45 detik
            </p>
            <p className="mt-1 text-[11px] text-[#526675]">
              Hapus dokumen langsung membersihkan seluruh vector chunk
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
