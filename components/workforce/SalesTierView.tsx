'use client';

import React, { useState } from 'react';
import {
  Award,
  Crown,
  CheckCircle2,
  Target,
  TrendingUp,
  Users,
  Calculator,
  ShieldCheck,
  X,
  ArrowRight,
} from 'lucide-react';
import {
  SALES_AGENTZY_TIERS,
  SALES_TIER_LEVELS,
  formatIDR,
} from '@/lib/agentzy-data';
import type { CorporateCompensationSchema } from '@/lib/corporate-compensation';

export function SalesTierView({
  onNavigate,
  placedSchema,
}: {
  onNavigate: (tab: string) => void;
  placedSchema?: CorporateCompensationSchema;
}) {
  const [selectedTierId, setSelectedTierId] = useState<'Training' | 'Pro' | 'Elite'>('Pro');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeSent, setUpgradeSent] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('');

  const currentSA = 24;
  const eliteThresholdSA = 30;
  const progressPct = Math.min(100, Math.round((currentSA / eliteThresholdSA) * 100));
  const affSplit = placedSchema?.salesConfig.affiliateSplitPct ?? 60;
  const salesSplit = placedSchema?.salesConfig.salesIncrementalSplitPct ?? 40;
  const corpLabel = placedSchema
    ? `${placedSchema.corporateName} (${placedSchema.contractNumber})`
    : 'PT ISP Nusantara (CTR-2026-001)';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#17324D] sm:text-2xl">
            Tier &amp; Skema Target Sales Agentzy
          </h1>
          <p className="text-xs text-[#526675] sm:text-sm">
            Jenjang karir Sales Agentzy (Training, Pro, Elite) beserta skema target SA dan komisi sesuai Master PRD.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('simulator')}
          className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#B8C9D3] bg-white px-4 py-2 text-xs font-semibold text-[#17324D] hover:bg-[#E6F4F9]"
        >
          <Calculator className="h-4 w-4 text-[#0284C7]" />
          <span>Buka Simulasi Komisi</span>
        </button>
      </div>

      {/* Current Tier Progress Hero Card */}
      <div className="rounded-[14px] border border-[#ADD8E6] bg-gradient-to-r from-[#17324D] to-[#245477] p-5 text-white sm:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-[8px] bg-white/10 px-3 py-1 text-xs font-semibold text-[#87CEEB]">
              <Award className="h-4 w-4" />
              <span>Status Aktif: Sales Agentzy · Tier Pro</span>
            </div>
            <h2 className="mt-3 text-lg font-bold sm:text-xl">
              Progres Menuju Sales Agentzy Elite
            </h2>
            <p className="mt-1 text-xs text-[#CFE3EE] sm:text-sm">
              Capaian bulan berjalan <strong className="font-mono-tabular text-white">{currentSA} SA</strong> dari target minimum kualifikasi Elite (<strong className="font-mono-tabular text-white">30 SA gabungan</strong>).
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
            <button
              type="button"
              onClick={() => {
                setUpgradeSent(false);
                setShowUpgradeModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-[10px] bg-[#87CEEB] px-4 py-2.5 text-xs font-bold text-[#17324D] transition hover:bg-[#ADD8E6]"
            >
              <Crown className="h-4 w-4" />
              <span>Ajukan Evaluasi Tier Elite</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-[#CFE3EE]">
            <span>Pencapaian SA Gabungan Bulan Ini</span>
            <span className="font-mono-tabular font-bold text-white">
              {currentSA} / {eliteThresholdSA} SA ({progressPct}%)
            </span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-[#87CEEB] transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
            <div className="rounded-[10px] bg-white/10 px-3 py-2">
              <span className="text-[#CFE3EE]">Affiliate Aktif:</span>{' '}
              <strong className="font-mono-tabular text-white">10 / 10 Mitra</strong>
            </div>
            <div className="rounded-[10px] bg-white/10 px-3 py-2">
              <span className="text-[#CFE3EE]">SLA Follow-up:</span>{' '}
              <strong className="font-mono-tabular text-white">96% (Min. 95%)</strong>
            </div>
            <div className="rounded-[10px] bg-white/10 px-3 py-2">
              <span className="text-[#CFE3EE]">Sertifikasi Pro:</span>{' '}
              <strong className="text-[#87CEEB]">Terverifikasi Aktif</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Tier Cards: Training -> Pro -> Elite */}
      <div>
        <h2 className="text-base font-bold text-[#17324D]">
          Tingkatan Sales Agentzy (Training · Pro · Elite)
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {SALES_TIER_LEVELS.map((tier) => {
            const isCurrent = tier.id === 'Pro';
            const isSelected = selectedTierId === tier.id;
            return (
              <div
                key={tier.id}
                onClick={() => setSelectedTierId(tier.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setSelectedTierId(tier.id);
                }}
                className={`flex cursor-pointer flex-col justify-between rounded-[14px] border p-5 transition ${
                  isSelected
                    ? 'border-[#0284C7] bg-white shadow-sm ring-1 ring-[#0284C7]/25'
                    : 'border-[#D8E3E9] bg-white hover:border-[#87CEEB]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-[8px] px-2.5 py-1 text-[11px] font-bold ${
                        tier.id === 'Elite'
                          ? 'bg-[#FEF3C7] text-[#A96816]'
                          : tier.id === 'Pro'
                            ? 'bg-[#E6F4F9] text-[#0284C7]'
                            : 'bg-[#EAF2F6] text-[#526675]'
                      }`}
                    >
                      {tier.id === 'Elite' ? (
                        <Crown className="h-3.5 w-3.5" />
                      ) : tier.id === 'Pro' ? (
                        <Award className="h-3.5 w-3.5" />
                      ) : (
                        <Target className="h-3.5 w-3.5" />
                      )}
                      <span>{tier.id}</span>
                    </span>
                    {isCurrent && (
                      <span className="text-[11px] font-bold text-[#247A55]">
                        Tier Anda Saat Ini
                      </span>
                    )}
                  </div>

                  <h3 className="mt-3 text-base font-bold text-[#17324D]">
                    {tier.name}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#526675]">
                    {tier.subtitle}
                  </p>

                  <div className="mt-4 space-y-2 rounded-[10px] border border-[#EAF2F6] bg-[#F5F8FA] p-3 text-xs">
                    <div className="flex items-start gap-2">
                      <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0284C7]" />
                      <span className="font-semibold text-[#17324D]">
                        {tier.targetSA}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#247A55]" />
                      <span className="text-[#526675]">{tier.feeScheme}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#245477]" />
                      <span className="text-[#526675]">{tier.affiliateQuota}</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-bold text-[#17324D]">
                      Syarat Kualifikasi:
                    </p>
                    <ul className="mt-2 space-y-1.5 text-xs text-[#526675]">
                      {tier.requirements.map((req) => (
                        <li key={req} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0284C7]" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-bold text-[#17324D]">
                      Benefit &amp; Skema Insentif:
                    </p>
                    <ul className="mt-2 space-y-1.5 text-xs text-[#526675]">
                      {tier.benefits.map((b) => (
                        <li key={b} className="flex items-start gap-2">
                          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#247A55]" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {tier.id === 'Elite' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUpgradeSent(false);
                      setShowUpgradeModal(true);
                    }}
                    className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-[10px] bg-[#0284C7] py-2.5 text-xs font-semibold text-white hover:bg-[#0369A1]"
                  >
                    <span>Ajukan Naik ke Elite</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Skema Target & Referensi SA Matrix (Master PRD Section 6.2 & 6.3) */}
      <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#17324D]">
              Skema Target SA &amp; Referensi Insentif Sales Agentzy
            </h2>
            <p className="mt-1 text-xs text-[#526675]">
              Penempatan aktif: <strong className="text-[#17324D]">{corpLabel}</strong> · Personal Sales (100%) + Inkremental Affiliate ({salesSplit}% Sales / {affSplit}% Affiliate).
            </p>
          </div>
          <span className="rounded-[8px] border border-[#ADD8E6] bg-[#E6F4F9] px-3 py-1 text-[11px] font-bold text-[#17324D]">
            Combined SA Basis
          </span>
        </div>

        {/* Formula Callout */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-[10px] border border-[#EAF2F6] bg-[#F5F8FA] p-3">
            <p className="text-[11px] font-semibold text-[#526675]">
              1. Combined SA (Penentu Bracket)
            </p>
            <p className="mt-1 font-mono-tabular text-xs font-bold text-[#17324D]">
              P_combined = P_personal + P_affiliate
            </p>
          </div>
          <div className="rounded-[10px] border border-[#EAF2F6] bg-[#F5F8FA] p-3">
            <p className="text-[11px] font-semibold text-[#526675]">
              2. Basis Atribusi Sales Resmi ({salesSplit}%)
            </p>
            <p className="mt-1 font-mono-tabular text-xs font-bold text-[#17324D]">
              Sales_basis = P_personal + {(salesSplit / 100).toFixed(2)} × ΔP
            </p>
          </div>
          <div className="rounded-[10px] border border-[#EAF2F6] bg-[#F5F8FA] p-3">
            <p className="text-[11px] font-semibold text-[#526675]">
              3. Porsi Affiliate Teratribusi ({affSplit}%)
            </p>
            <p className="mt-1 font-mono-tabular text-xs font-bold text-[#17324D]">
              Affiliate_share = {(affSplit / 100).toFixed(2)} × ΔP
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[540px] border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#D8E3E9] bg-[#F5F8FA] text-[#526675]">
                <th className="px-3.5 py-2.5 font-semibold">Rentang SA</th>
                <th className="px-3.5 py-2.5 font-semibold">Tingkatan</th>
                <th className="px-3.5 py-2.5 font-semibold">Fee Referensi</th>
                <th className="px-3.5 py-2.5 font-semibold">Multiplier Referensi</th>
                <th className="px-3.5 py-2.5 font-semibold">Status Anda</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAF2F6]">
              {(placedSchema
                ? placedSchema.salesConfig.tiers.map((t) => ({
                    min: t.minSA,
                    max: t.maxSA ?? 9999,
                    label: t.label,
                    tierGroup: t.label,
                    feeRef: t.feePerSA,
                    multiplier: t.multiplier,
                  }))
                : SALES_AGENTZY_TIERS
              ).map((row) => {
                const isActiveRow = currentSA >= row.min && currentSA <= row.max;
                return (
                  <tr
                    key={row.label}
                    className={isActiveRow ? 'bg-[#E6F4F9]/70 font-semibold' : ''}
                  >
                    <td className="px-3.5 py-3 font-mono-tabular text-[#17324D]">
                      {row.max > 900 ? `≥ ${row.min} SA` : `${row.min}–${row.max} SA`}
                    </td>
                    <td className="px-3.5 py-3 text-[#172B3A]">
                      {row.tierGroup}
                    </td>
                    <td className="px-3.5 py-3 font-mono-tabular text-[#17324D]">
                      {formatIDR(row.feeRef)}
                    </td>
                    <td className="px-3.5 py-3 font-mono-tabular text-[#0284C7]">
                      {row.multiplier}x
                    </td>
                    <td className="px-3.5 py-3">
                      {isActiveRow ? (
                        <span className="inline-flex items-center gap-1 rounded-[6px] bg-[#0284C7] px-2 py-0.5 text-[11px] font-bold text-white">
                          Posisi Saat Ini ({currentSA} SA)
                        </span>
                      ) : row.min > currentSA ? (
                        <span className="text-[11px] text-[#526675]">
                          Target Berikutnya (+{row.min - currentSA} SA)
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#247A55]">Terlampaui</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Training (OJT) Special Reference Note */}
        <div className="mt-4 rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] p-3.5 text-xs text-[#526675]">
          <strong className="text-[#17324D]">Catatan Skema Training (OJT):</strong>{' '}
          Sales Agentzy tahap Training memakai referensi fee progresif (Rp 80.000, Rp 100.000, Rp 130.000, Rp 150.000, Rp 200.000) serta lump sum 3 SA = Rp 325.000 dan 7 SA = Rp 600.000. Angka payable resmi tetap dikalkulasi oleh Commission Engine berdasarkan dokumen insentif provider yang berlaku.
        </div>
      </div>

      {/* Modal Card Pengajuan Evaluasi Tier Elite */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B3A]/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[16px] border border-[#D8E3E9] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#FEF3C7] text-[#A96816]">
                  <Crown className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#17324D]">
                    Evaluasi Naik ke Sales Agentzy Elite
                  </h3>
                  <p className="text-xs text-[#526675]">
                    Persyaratan &amp; pengajuan peninjauan Area Manager
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="rounded-lg p-1 text-[#526675] hover:bg-[#F5F8FA]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {upgradeSent ? (
              <div className="mt-5 space-y-3 rounded-[12px] border border-[#247A55]/30 bg-emerald-50 p-4 text-center">
                <CheckCircle2 className="mx-auto h-9 w-9 text-[#247A55]" />
                <p className="text-sm font-bold text-[#17324D]">
                  Pengajuan Evaluasi Elite Terkirim
                </p>
                <p className="text-xs text-[#526675]">
                  Area Manager akan meninjau pencapaian SA gabungan dan keaktifan jaringan Affiliate Anda.
                </p>
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-full rounded-[10px] bg-[#17324D] py-2.5 text-xs font-bold text-white"
                >
                  Selesai
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setUpgradeSent(true);
                }}
                className="mt-4 space-y-3"
              >
                <div className="rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-3.5 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#526675]">Target SA Gabungan Elite</span>
                    <span className="font-mono-tabular font-bold text-[#17324D]">
                      24 / 30 SA
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#526675]">Minimal Affiliate Aktif</span>
                    <span className="font-mono-tabular font-bold text-[#247A55]">
                      10 / 10 Mitra
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#526675]">Sertifikasi Sales Agentzy Pro</span>
                    <span className="font-bold text-[#247A55]">Aktif</span>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#17324D]">
                    Catatan Pengajuan / Pipeline Bulan Ini
                  </label>
                  <textarea
                    rows={2}
                    value={upgradeReason}
                    onChange={(e) => setUpgradeReason(e.target.value)}
                    placeholder="Contoh: 8 order FTTH dalam tahap instalasi untuk mencapai 32 SA bulan ini..."
                    className="w-full rounded-[10px] border border-[#B8C9D3] p-2.5 text-xs text-[#172B3A]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowUpgradeModal(false)}
                    className="rounded-[10px] border border-[#B8C9D3] px-4 py-2 text-xs font-semibold text-[#17324D]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded-[10px] bg-[#0284C7] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0369A1]"
                  >
                    Kirim Pengajuan
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
