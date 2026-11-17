'use client';

import React, { useMemo, useState } from 'react';
import {
  Database,
  Brain,
  FileText,
  Plus,
  Search,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import type {
  KnowledgeSourceItem,
  MemoryLayerItem,
} from '../../lib/ai-workforce-types';

export function MemoryKnowledgeView({
  memoryLayers,
  knowledgeSources,
  onToggleMemoryStatus,
  onOpenAddKnowledge,
}: {
  memoryLayers: MemoryLayerItem[];
  knowledgeSources: KnowledgeSourceItem[];
  onToggleMemoryStatus: (memId: string) => void;
  onOpenAddKnowledge: () => void;
}) {
  const [mainTab, setMainTab] = useState<'memory' | 'knowledge'>('memory');
  const [memSubTab, setMemSubTab] = useState<'Memori' | 'Kebijakan' | 'Retensi'>('Memori');
  const [knSubTab, setKnSubTab] = useState<'Sumber' | 'Ingest' | 'Pencarian'>('Sumber');
  const [ragQuery, setRagQuery] = useState('');

  const totalDocs = useMemo(
    () => knowledgeSources.reduce((acc, s) => acc + s.documentsCount, 0),
    [knowledgeSources]
  );
  const totalChunks = useMemo(
    () => knowledgeSources.reduce((acc, s) => acc + s.chunksCount, 0),
    [knowledgeSources]
  );

  const ragMatches = useMemo(() => {
    const q = ragQuery.trim().toLowerCase();
    if (!q) return knowledgeSources;
    return knowledgeSources.filter(
      (k) =>
        k.title.toLowerCase().includes(q) ||
        k.category.toLowerCase().includes(q)
    );
  }, [knowledgeSources, ragQuery]);

  return (
    <div className="space-y-5">
      {/* Header (Screens 12 & 13) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-[#0284C7]">
            Screens 12 &amp; 13 · Memory Coordinator &amp; Knowledge / RAG
          </p>
          <h1 className="text-xl font-bold text-[#17324D] sm:text-2xl">
            Memory Coordinator &amp; Knowledge / RAG
          </h1>
          <p className="mt-0.5 text-xs text-[#526675]">
            Kelola 8 lapisan memori AI terisolasi per tenant serta sumber dokumen resmi ISP.
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-1 rounded-[10px] border border-[#D8E3E9] bg-white p-1 sm:inline-flex sm:w-auto">
          <button
            type="button"
            onClick={() => setMainTab('memory')}
            className={`inline-flex h-9 sm:h-8 items-center justify-center gap-1.5 rounded-[8px] px-2.5 sm:px-3 text-xs font-semibold whitespace-nowrap ${
              mainTab === 'memory'
                ? 'bg-[#0284C7] text-white'
                : 'text-[#526675] hover:text-[#17324D]'
            }`}
          >
            <Brain className="h-3.5 w-3.5 shrink-0" />
            <span className="sm:hidden">Memory (8)</span>
            <span className="hidden sm:inline">Memory Coordinator (8)</span>
          </button>
          <button
            type="button"
            onClick={() => setMainTab('knowledge')}
            className={`inline-flex h-9 sm:h-8 items-center justify-center gap-1.5 rounded-[8px] px-2.5 sm:px-3 text-xs font-semibold whitespace-nowrap ${
              mainTab === 'knowledge'
                ? 'bg-[#0284C7] text-white'
                : 'text-[#526675] hover:text-[#17324D]'
            }`}
          >
            <Database className="h-3.5 w-3.5 shrink-0" />
            <span>Knowledge / RAG</span>
          </button>
        </div>
      </div>

      {/* Screen 12: Memory Coordinator */}
      {mainTab === 'memory' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="grid w-full grid-cols-3 gap-1 rounded-[9px] border border-[#D8E3E9] bg-white p-1 sm:inline-flex sm:w-auto">
              {(['Memori', 'Kebijakan', 'Retensi'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMemSubTab(t)}
                  className={`h-8 sm:h-7 rounded-[7px] px-2.5 sm:px-3 text-xs font-semibold ${
                    memSubTab === t
                      ? 'bg-[#E6F4F9] text-[#17324D]'
                      : 'text-[#526675]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#247A55]">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Isolasi Memori Tenant Aktif (UUID-Scoped)</span>
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {memoryLayers.map((mem) => (
              <div
                key={mem.id}
                className="flex flex-col justify-between rounded-[14px] border border-[#D8E3E9] bg-white p-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-[#17324D]">
                        {mem.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-[#526675]">
                        {mem.description}
                      </p>
                    </div>
                    <span
                      className={`rounded-[6px] px-2 py-0.5 text-[11px] font-semibold shrink-0 ${
                        mem.status === 'Aktif'
                          ? 'bg-[#247A55]/10 text-[#247A55]'
                          : 'bg-[#A96816]/10 text-[#A96816]'
                      }`}
                    >
                      {mem.status}
                    </span>
                  </div>

                  {memSubTab !== 'Memori' && (
                    <div className="mt-3 rounded-[9px] bg-[#F5F8FA] p-2.5 text-[11px] text-[#526675]">
                      <p>
                        <strong className="text-[#17324D]">Kebijakan Retensi:</strong>{' '}
                        {mem.retentionPolicy}
                      </p>
                      <p className="mt-0.5">
                        <strong className="text-[#17324D]">Persetujuan Pengguna (Consent):</strong>{' '}
                        {mem.consentRequired ? 'Wajib Opt-in' : 'Otomatis Sesuai Kontrak'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-3.5 flex items-center justify-between border-t border-[#EAF2F6] pt-3">
                  <span className="font-mono-tabular text-[11px] text-[#718391]">
                    {mem.recordsCount.toLocaleString('id-ID')} entri · {mem.retentionPolicy}
                  </span>
                  <button
                    type="button"
                    onClick={() => onToggleMemoryStatus(mem.id)}
                    className="h-8 rounded-[8px] border border-[#D8E3E9] bg-[#F5F8FA] px-3 text-xs font-semibold text-[#17324D] hover:border-[#0284C7] whitespace-nowrap"
                  >
                    {mem.status === 'Aktif' ? 'Batasi' : 'Aktifkan'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Screen 13: Knowledge / RAG */}
      {mainTab === 'knowledge' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4">
              <p className="text-xs font-medium text-[#526675]">Total Dokumen Terindeks</p>
              <p className="mt-1 font-mono-tabular text-2xl font-bold text-[#17324D]">
                {totalDocs.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4">
              <p className="text-xs font-medium text-[#526675]">Total Chunks Pengetahuan</p>
              <p className="mt-1 font-mono-tabular text-2xl font-bold text-[#0284C7]">
                {totalChunks.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 rounded-[14px] border border-[#87CEEB] bg-[#E6F4F9] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold text-[#17324D]">Tambah Dokumen Baru</p>
                <p className="mt-0.5 text-[11px] text-[#245477]">
                  Katalog promo, SOP teknisi, FAQ
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenAddKnowledge}
                className="inline-flex h-10 w-full sm:w-auto items-center justify-center gap-1.5 rounded-[10px] bg-[#0284C7] px-3.5 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Sumber</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="grid w-full grid-cols-3 gap-1 rounded-[9px] border border-[#D8E3E9] bg-white p-1 sm:inline-flex sm:w-auto">
              {(['Sumber', 'Ingest', 'Pencarian'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setKnSubTab(t)}
                  className={`h-8 sm:h-7 rounded-[7px] px-2.5 sm:px-3 text-xs font-semibold ${
                    knSubTab === t
                      ? 'bg-[#E6F4F9] text-[#17324D]'
                      : 'text-[#526675]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#718391]" />
              <input
                type="text"
                value={ragQuery}
                onChange={(e) => setRagQuery(e.target.value)}
                placeholder="Cari sumber pengetahuan RAG..."
                className="h-9 w-full rounded-[9px] border border-[#D8E3E9] bg-white pl-8 pr-3 text-xs text-[#172B3A]"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            {ragMatches.map((src) => (
              <div
                key={src.id}
                className="flex flex-col gap-2 rounded-[14px] border border-[#D8E3E9] bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#0284C7]">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#17324D]">
                      {src.title}
                    </h3>
                    <p className="mt-0.5 font-mono-tabular text-[11px] text-[#526675]">
                      {src.category} · {src.documentsCount.toLocaleString('id-ID')} dokumen ·{' '}
                      {src.chunksCount.toLocaleString('id-ID')} chunks · Pembaruan: {src.lastUpdated}
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 rounded-[6px] px-2.5 py-1 text-xs font-semibold shrink-0 ${
                    src.syncStatus === 'Sinkron'
                      ? 'bg-[#247A55]/10 text-[#247A55]'
                      : 'bg-[#0284C7]/10 text-[#0284C7]'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{src.syncStatus}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
