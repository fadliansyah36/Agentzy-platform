'use client';

import React, { useState } from 'react';
import {
  Cpu,
  CheckCircle2,
  ArrowRightLeft,
  ShieldCheck,
  Sliders,
  Plus,
} from 'lucide-react';
import type {
  ModelProviderItem,
  ModelRoutingRule,
} from '../../lib/ai-workforce-types';

export function ModelRouterView({
  providers,
  routingRules,
  onUpdateRoutingRules,
  onNotify,
}: {
  providers: ModelProviderItem[];
  routingRules: ModelRoutingRule[];
  onUpdateRoutingRules: (next: ModelRoutingRule[]) => void;
  onNotify: (msg: string) => void;
}) {
  const [tab, setTab] = useState<'provider' | 'routing' | 'policy'>('provider');
  const [allowlistEnabled, setAllowlistEnabled] = useState(true);
  const [costCapEnabled, setCostCapEnabled] = useState(true);
  const [latencyGuardEnabled, setLatencyGuardEnabled] = useState(true);

  const [newTaskClass, setNewTaskClass] = useState('');
  const [newTargetModel, setNewTargetModel] = useState('Gemini 4 Hydrogen');
  const [newFallbackModel, setNewFallbackModel] = useState('GPT-5.1');

  const handleCycleModel = (ruleId: string) => {
    const models = ['Gemini 4 Hydrogen', 'GPT-5.1', 'Claude 4.5'];
    onUpdateRoutingRules(
      routingRules.map((r) => {
        if (r.id !== ruleId) return r;
        const idx = models.indexOf(r.targetModel);
        const nextModel = models[(idx + 1) % models.length];
        return { ...r, targetModel: nextModel };
      })
    );
    onNotify('Aturan routing model diperbarui');
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskClass.trim()) return;
    const next: ModelRoutingRule = {
      id: `RR-${Date.now().toString().slice(-3)}`,
      taskClass: newTaskClass.trim(),
      targetModel: newTargetModel,
      fallbackModel: newFallbackModel,
      maxCostPerRunIdr: 600,
      maxLatencySec: 5,
    };
    onUpdateRoutingRules([next, ...routingRules]);
    setNewTaskClass('');
    onNotify(`Aturan routing baru "${next.taskClass}" disimpan`);
  };

  return (
    <div className="space-y-5">
      {/* Header + Segmented Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-[#0284C7]">
            Screen 9 · Model Router &amp; Provider
          </p>
          <h1 className="text-xl font-bold text-[#17324D] sm:text-2xl">
            Model Router &amp; Kebijakan Provider
          </h1>
          <p className="mt-0.5 text-xs text-[#526675]">
            Atur model AI utama, model cadangan (fallback), batas biaya per run, dan latensi.
          </p>
        </div>

        <div className="grid w-full grid-cols-3 gap-1 rounded-[10px] border border-[#D8E3E9] bg-white p-1 sm:inline-flex sm:w-auto">
          {(
            [
              { id: 'provider', label: 'Provider' },
              { id: 'routing', label: 'Routing' },
              { id: 'policy', label: 'Policy' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`h-9 sm:h-8 rounded-[8px] px-2.5 sm:px-3.5 text-center text-xs font-semibold transition whitespace-nowrap ${
                tab === t.id
                  ? 'bg-[#0284C7] text-white'
                  : 'text-[#526675] hover:text-[#17324D]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Provider Aktif */}
      {tab === 'provider' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
            {providers.map((p) => (
              <div
                key={p.id}
                className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#0284C7]">
                        <Cpu className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#526675]">
                          {p.provider}
                        </p>
                        <h3 className="text-sm font-bold text-[#17324D]">
                          {p.modelName}
                        </h3>
                      </div>
                    </div>
                    <span className="rounded-[6px] bg-[#247A55]/10 px-2 py-0.5 text-[11px] font-semibold text-[#247A55]">
                      {p.status}
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-[#526675]">
                    {p.useCase}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#EAF2F6] pt-3 text-xs">
                  <span className="font-mono-tabular text-[#526675]">
                    Latensi ~{p.latencyMs} ms
                  </span>
                  <span className="font-semibold text-[#17324D]">
                    Biaya: {p.costTier}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 sm:p-5">
            <div className="flex items-center justify-between border-b border-[#EAF2F6] pb-3">
              <h2 className="text-sm font-bold text-[#17324D]">
                Aturan Routing Aktif (Model Router)
              </h2>
              <button
                type="button"
                onClick={() => setTab('routing')}
                className="text-xs font-semibold text-[#0284C7] hover:underline whitespace-nowrap"
              >
                Kelola Routing
              </button>
            </div>
            <div className="mt-3 space-y-2.5">
              {routingRules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex flex-col gap-2.5 rounded-[10px] border border-[#EAF2F6] bg-[#F5F8FA] p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#17324D]">
                      {rule.taskClass}
                    </p>
                    <p className="mt-0.5 font-mono-tabular text-[11px] text-[#526675]">
                      Fallback: {rule.fallbackModel} · Maks Rp {rule.maxCostPerRunIdr}/run · ≤ {rule.maxLatencySec} dtk
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCycleModel(rule.id)}
                    className="inline-flex h-9 sm:h-8 self-start sm:self-auto items-center gap-1.5 rounded-[8px] border border-[#87CEEB] bg-white px-3 text-xs font-semibold text-[#17324D] hover:bg-[#E6F4F9] whitespace-nowrap shrink-0"
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5 text-[#0284C7]" />
                    <span>{rule.targetModel}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Routing Rules Editor */}
      {tab === 'routing' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7 rounded-[14px] border border-[#D8E3E9] bg-white p-5">
            <h2 className="text-sm font-bold text-[#17324D]">
              Daftar Aturan Routing per Kelas Tugas
            </h2>
            <p className="mt-0.5 text-xs text-[#526675]">
              Klik tombol model utama untuk mengganti prioritas model sesuai kebutuhan biaya &amp; kecepatan.
            </p>
            <div className="mt-4 space-y-3">
              {routingRules.map((rule) => (
                <div
                  key={rule.id}
                  className="rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-3.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#17324D]">
                      {rule.taskClass}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCycleModel(rule.id)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-[8px] bg-[#0284C7] px-3 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap"
                    >
                      <ArrowRightLeft className="h-3.5 w-3.5" />
                      <span>{rule.targetModel}</span>
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 font-mono-tabular text-[11px] text-[#526675]">
                    <span>Cadangan: {rule.fallbackModel}</span>
                    <span>Batas Biaya: Rp {rule.maxCostPerRunIdr}/run</span>
                    <span>Target Latensi: ≤ {rule.maxLatencySec} dtk</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleAddRule}
            className="lg:col-span-5 rounded-[14px] border border-[#D8E3E9] bg-white p-5 space-y-3.5 h-fit"
          >
            <h2 className="text-sm font-bold text-[#17324D]">
              Tambah Aturan Routing Baru
            </h2>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                Kelas Tugas / Aktivitas *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Pembuatan Desain Flyer Promo"
                value={newTaskClass}
                onChange={(e) => setNewTaskClass(e.target.value)}
                className="h-10 w-full rounded-[10px] border border-[#B8C9D3] px-3 text-xs text-[#172B3A]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                Model Utama
              </label>
              <select
                value={newTargetModel}
                onChange={(e) => setNewTargetModel(e.target.value)}
                className="h-10 w-full rounded-[10px] border border-[#B8C9D3] bg-white px-3 text-xs"
              >
                <option>Gemini 4 Hydrogen</option>
                <option>GPT-5.1</option>
                <option>Claude 4.5</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                Model Cadangan (Fallback)
              </label>
              <select
                value={newFallbackModel}
                onChange={(e) => setNewFallbackModel(e.target.value)}
                className="h-10 w-full rounded-[10px] border border-[#B8C9D3] bg-white px-3 text-xs"
              >
                <option>GPT-5.1</option>
                <option>Gemini 4 Hydrogen</option>
                <option>Claude 4.5</option>
              </select>
            </div>
            <button
              type="submit"
              className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[10px] bg-[#0284C7] text-xs font-semibold text-white hover:bg-[#0369A1]"
            >
              <Plus className="h-4 w-4" />
              <span>Simpan Aturan Routing</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Policy (Allowlist, Batas Biaya, Latency) */}
      {tab === 'policy' && (
        <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#EAF2F6] pb-3">
            <Sliders className="h-4 w-4 text-[#0284C7]" />
            <h2 className="text-sm font-bold text-[#17324D]">
              Kebijakan Tata Kelola Model (Guardrail)
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {[
              {
                title: 'Allowlist Provider Terverifikasi',
                desc: 'Hanya izinkan Google Gemini, OpenAI, dan Anthropic yang disetujui tenant.',
                enabled: allowlistEnabled,
                toggle: () => {
                  setAllowlistEnabled((v) => !v);
                  onNotify('Kebijakan Allowlist diperbarui');
                },
              },
              {
                title: 'Batas Biaya Otomatis per Run',
                desc: 'Alihkan ke model hemat secara otomatis jika kuota AI Credits divisi di atas 80%.',
                enabled: costCapEnabled,
                toggle: () => {
                  setCostCapEnabled((v) => !v);
                  onNotify('Kebijakan Batas Biaya diperbarui');
                },
              },
              {
                title: 'Proteksi Latensi & Failover',
                desc: 'Pindah ke model fallback apabila waktu respons melebihi batas SLA tugas.',
                enabled: latencyGuardEnabled,
                toggle: () => {
                  setLatencyGuardEnabled((v) => !v);
                  onNotify('Kebijakan Proteksi Latensi diperbarui');
                },
              },
            ].map((pol) => (
              <div
                key={pol.title}
                className="flex flex-col justify-between rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#0284C7]" />
                    <span
                      className={`text-[11px] font-bold ${
                        pol.enabled ? 'text-[#247A55]' : 'text-[#718391]'
                      }`}
                    >
                      {pol.enabled ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <h3 className="mt-2.5 text-xs font-bold text-[#17324D]">
                    {pol.title}
                  </h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#526675]">
                    {pol.desc}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={pol.toggle}
                  className={`mt-4 h-9 rounded-[9px] border text-xs font-semibold transition ${
                    pol.enabled
                      ? 'border-[#0284C7] bg-white text-[#0284C7] hover:bg-[#E6F4F9]'
                      : 'border-[#D8E3E9] bg-white text-[#526675]'
                  }`}
                >
                  {pol.enabled ? 'Nonaktifkan Kebijakan' : 'Aktifkan Kebijakan'}
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-[10px] bg-[#E6F4F9] p-3 text-xs text-[#17324D]">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#247A55]" />
            <span>
              Seluruh pemanggilan LLM dari portal ini berjalan aman melalui server-side API route dengan jejak audit per tenant.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
