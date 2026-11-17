'use client';

import React, { useState } from 'react';
import { Route, Plus, Pencil, Trash2, Play } from 'lucide-react';
import {
  AdminPageHeader,
  AdminSegmentedTabs,
  AdminStatusText,
} from '../../components/data-display/AdminDataDisplay';
import { adminPortalService } from '../../services/admin-service';
import type { ModelRoutingRuleRecord } from '../../lib/admin-types';

export function ModelRouterAdminView({
  policyName,
  onChangePolicyName,
  fallbackEnabled,
  onToggleFallback,
  routingActive,
  onToggleRoutingActive,
  rules,
  onOpenRuleModal,
  onToggleRule,
  onDeleteRule,
  onBack,
}: {
  policyName: string;
  onChangePolicyName: (name: string) => void;
  fallbackEnabled: boolean;
  onToggleFallback: () => void;
  routingActive: boolean;
  onToggleRoutingActive: () => void;
  rules: ModelRoutingRuleRecord[];
  onOpenRuleModal: (rule?: ModelRoutingRuleRecord) => void;
  onToggleRule: (id: string) => void;
  onDeleteRule: (id: string) => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<'kebijakan' | 'aturan' | 'pengujian'>('kebijakan');
  const [simTask, setSimTask] = useState('Tugas Analitik & Audit');
  const [simSensitivity, setSimSensitivity] = useState<
    'Internal' | 'Confidential' | 'Restricted'
  >('Confidential');
  const [simLatency, setSimLatency] = useState(1800);
  const [simResult, setSimResult] = useState(() =>
    adminPortalService.simulateModelRouting({
      taskType: 'Tugas Analitik & Audit',
      sensitivity: 'Confidential',
      maxLatencyMs: 1800,
    })
  );

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Model Router (Policy & Routing Rules)"
        subtitle="Konfigurasi kebijakan routing deterministik, aturan per kategori tugas, fallback, dan simulator rute."
        onBack={onBack}
        actions={
          <button
            type="button"
            onClick={() => onOpenRuleModal()}
            className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#0284C7] px-4 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Aturan Routing</span>
          </button>
        }
      />

      <AdminSegmentedTabs
        tabs={[
          { id: 'kebijakan', label: 'Kebijakan Routing' },
          { id: 'aturan', label: `Aturan (${rules.length})` },
          { id: 'pengujian', label: 'Pengujian Simulator' },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      {tab === 'kebijakan' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-7 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#172B3A]">
                Kebijakan Routing Aktif
              </label>
              <select
                value={policyName}
                onChange={(e) => onChangePolicyName(e.target.value)}
                className="h-11 w-full rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] px-3.5 text-sm font-bold text-[#17324D]"
              >
                <option value="Smart Auto (Default)">
                  Smart Auto (Default) — Rute berdasarkan tugas, biaya &amp; SLA
                </option>
                <option value="Cost Optimized">
                  Cost Optimized — Prioritas efisiensi AI Credits
                </option>
                <option value="Latency First">
                  Latency First — Respon tercepat untuk chat realtime
                </option>
                <option value="Strict Residency">
                  Strict Residency — Asia-Southeast1 &amp; Enterprise DPA Only
                </option>
              </select>
            </div>

            <div className="flex items-center justify-between rounded-[10px] border border-[#EAF2F6] bg-[#F5F8FA] px-4 py-3">
              <div>
                <p className="text-xs font-bold text-[#17324D]">
                  Fallback Otomatis ke Model Eligible
                </p>
                <p className="text-[11px] text-[#526675]">
                  Jika model utama gagal/timeout → alihkan ke model alternatif pada allowlist
                </p>
              </div>
              <button
                type="button"
                onClick={onToggleFallback}
                className={`h-8 rounded-lg px-3 text-xs font-bold ${
                  fallbackEnabled
                    ? 'bg-[#247A55] text-white'
                    : 'border border-[#D8E3E9] bg-white text-[#526675]'
                }`}
              >
                {fallbackEnabled ? 'Aktif' : 'Nonaktif'}
              </button>
            </div>

            <div className="flex items-center justify-between rounded-[10px] border border-[#EAF2F6] bg-[#F5F8FA] px-4 py-3">
              <div>
                <p className="text-xs font-bold text-[#17324D]">Routing Aktif (Master Switch)</p>
                <p className="text-[11px] text-[#526675]">
                  Semua panggilan LLM AI Workforce melalui Backend AI Gateway Router
                </p>
              </div>
              <button
                type="button"
                onClick={onToggleRoutingActive}
                className={`h-8 rounded-lg px-3 text-xs font-bold ${
                  routingActive
                    ? 'bg-[#0284C7] text-white'
                    : 'bg-[#B23A48] text-white'
                }`}
              >
                {routingActive ? 'Routing Aktif' : 'Bypass Terkunci'}
              </button>
            </div>
          </div>

          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-5">
            <div className="flex items-center gap-2 border-b border-[#EAF2F6] pb-3">
              <Route className="h-4 w-4 text-[#0284C7]" />
              <h2 className="text-sm font-bold text-[#17324D]">
                Ringkasan Aturan Prioritas
              </h2>
            </div>
            <div className="mt-3 space-y-2.5">
              {rules.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-[10px] bg-[#F5F8FA] px-3.5 py-2.5 text-xs"
                >
                  <span className="font-semibold text-[#17324D]">{r.taskCategory}</span>
                  <span className="font-mono-tabular font-bold text-[#0284C7]">
                    → {r.targetModelName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'aturan' && (
        <div className="space-y-3">
          {/* Mobile Rule Cards */}
          <div className="space-y-2.5 md:hidden">
            {rules.map((r) => (
              <div
                key={r.id}
                className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-[#17324D]">{r.taskCategory}</p>
                    <p className="mt-0.5 text-xs font-semibold text-[#0284C7]">
                      Utama: {r.targetModelName}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleRule(r.id)}
                    className="shrink-0"
                  >
                    <AdminStatusText
                      tone={r.active ? 'success' : 'neutral'}
                      label={r.active ? 'Aktif' : 'Nonaktif'}
                    />
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] bg-[#F5F8FA] px-3 py-2 text-[11px] text-[#526675]">
                  <span>Fallback: {r.fallbackModelName}</span>
                  <span>Sensitivitas: {r.sensitivityLevel}</span>
                </div>
                <div className="flex items-center justify-end gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => onOpenRuleModal(r)}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#D8E3E9] px-3 text-xs font-semibold text-[#0284C7]"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteRule(r.id)}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#D8E3E9] px-3 text-xs font-semibold text-[#B23A48]"
                    aria-label={`Hapus ${r.taskCategory}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Rule Table */}
          <div className="hidden overflow-hidden rounded-[14px] border border-[#D8E3E9] bg-white md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#EAF2F6] bg-[#F5F8FA] text-[#526675]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Kategori Tugas</th>
                    <th className="px-4 py-3 font-semibold">Model Utama</th>
                    <th className="px-4 py-3 font-semibold">Fallback</th>
                    <th className="px-4 py-3 font-semibold">Sensitivitas</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Aksi CRUD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAF2F6]">
                  {rules.map((r) => (
                    <tr key={r.id} className="hover:bg-[#F8FBFD]">
                      <td className="px-4 py-3 font-bold text-[#17324D]">
                        {r.taskCategory}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#0284C7]">
                        {r.targetModelName}
                      </td>
                      <td className="px-4 py-3 text-[#526675]">{r.fallbackModelName}</td>
                      <td className="px-4 py-3 text-[#526675]">{r.sensitivityLevel}</td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => onToggleRule(r.id)}>
                          <AdminStatusText
                            tone={r.active ? 'success' : 'neutral'}
                            label={r.active ? 'Aktif' : 'Nonaktif'}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenRuleModal(r)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8E3E9] text-[#0284C7]"
                            aria-label={`Edit ${r.taskCategory}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteRule(r.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8E3E9] text-[#B23A48]"
                            aria-label={`Hapus ${r.taskCategory}`}
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
        </div>
      )}

      {tab === 'pengujian' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-6 space-y-4">
            <h2 className="text-sm font-bold text-[#17324D]">
              Simulator Keputusan Model Router
            </h2>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#172B3A]">
                Jenis Tugas AI Worker
              </label>
              <select
                value={simTask}
                onChange={(e) => setSimTask(e.target.value)}
                className="h-10 w-full rounded-[10px] border border-[#D8E3E9] bg-white px-3 text-xs text-[#17324D]"
              >
                <option value="Tugas Analitik & Audit">Tugas Analitik &amp; Audit</option>
                <option value="Tugas Kreatif & Penawaran Sales">
                  Tugas Kreatif &amp; Penawaran Sales
                </option>
                <option value="Tugas Multimodal & Bukti Foto Teknisi">
                  Tugas Multimodal &amp; Bukti Foto Teknisi
                </option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#172B3A]">
                Klasifikasi Data
              </label>
              <select
                value={simSensitivity}
                onChange={(e) =>
                  setSimSensitivity(
                    e.target.value as 'Internal' | 'Confidential' | 'Restricted'
                  )
                }
                className="h-10 w-full rounded-[10px] border border-[#D8E3E9] bg-white px-3 text-xs text-[#17324D]"
              >
                <option value="Internal">Internal</option>
                <option value="Confidential">Confidential</option>
                <option value="Restricted">Restricted</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#172B3A]">
                Batas Latensi Maksimum ({simLatency} ms)
              </label>
              <input
                type="range"
                min={400}
                max={3000}
                step={100}
                value={simLatency}
                onChange={(e) => setSimLatency(Number(e.target.value))}
                className="w-full accent-[#0284C7]"
              />
            </div>
            <button
              type="button"
              onClick={() =>
                setSimResult(
                  adminPortalService.simulateModelRouting({
                    taskType: simTask,
                    sensitivity: simSensitivity,
                    maxLatencyMs: simLatency,
                  })
                )
              }
              className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-[#17324D] px-4 text-xs font-semibold text-white hover:bg-[#245477]"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Uji Keputusan Router</span>
            </button>
          </div>

          <div className="rounded-[14px] border border-[#87CEEB] bg-[#E6F4F9]/45 p-5 lg:col-span-6">
            <p className="text-xs font-semibold text-[#0284C7]">
              Hasil Evaluasi Router
            </p>
            <h3 className="mt-1 text-lg font-bold text-[#17324D]">
              {simResult.chosenModel}
            </h3>
            <p className="mt-1 font-mono-tabular text-xs font-semibold text-[#247A55]">
              Route Score: {simResult.score} · Fallback: {simResult.fallbackModel}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-[#526675]">
              {simResult.reason}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
