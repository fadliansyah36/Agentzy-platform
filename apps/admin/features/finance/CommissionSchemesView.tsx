'use client';

import React, { useMemo, useState } from 'react';
import {
  Percent,
  Plus,
  Calculator,
  Building2,
  Award,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Wrench,
  Power,
} from 'lucide-react';
import {
  calculateCorporateSalesAffiliatePayroll,
  calculateTechnicianCompensation,
  DEFAULT_TECH_TASK_COUNTS,
  type BonusPeriodType,
  type CorporateCompensationSchema,
  type SalesGradeKey,
  type TechnicianBonusRule,
  type TechnicianTaskCategory,
} from '@/lib/corporate-compensation';
import {
  AdminPageHeader,
  AdminSegmentedTabs,
  AdminStatusText,
} from '../../components/data-display/AdminDataDisplay';
import { formatIDR } from '../../lib/admin-data';
import type { CommissionSchemeRecord } from '../../lib/admin-types';

export function CommissionSchemesView({
  schemes,
  corporateSchemas,
  technicianBonusRules,
  onOpenSchemeModal,
  onDeleteScheme,
  onOpenCorpSchemaModal,
  onDeleteCorpSchema,
  onOpenTechBonusModal,
  onToggleTechBonusStatus,
  onDeleteTechBonusRule,
  onBack,
}: {
  schemes: CommissionSchemeRecord[];
  corporateSchemas: CorporateCompensationSchema[];
  technicianBonusRules: TechnicianBonusRule[];
  onOpenSchemeModal: (scheme?: CommissionSchemeRecord) => void;
  onDeleteScheme?: (id: string) => void;
  onOpenCorpSchemaModal: (schema?: CorporateCompensationSchema) => void;
  onDeleteCorpSchema: (id: string) => void;
  onOpenTechBonusModal: (rule?: TechnicianBonusRule) => void;
  onToggleTechBonusStatus: (id: string) => void;
  onDeleteTechBonusRule: (id: string) => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<'corporate' | 'bonus-teknisi' | 'simulasi' | 'versi'>('corporate');
  const [expandedCorpId, setExpandedCorpId] = useState<string>(corporateSchemas[0]?.id ?? '');

  // Filters for Bonus Teknisi tab
  const [filterCorpId, setFilterCorpId] = useState<string>('ALL');
  const [filterTaskType, setFilterTaskType] = useState<'ALL' | TechnicianTaskCategory>('ALL');
  const [filterPeriod, setFilterPeriod] = useState<'ALL' | BonusPeriodType>('ALL');

  // Simulator A: Sales & Affiliate per Corporate Placement
  const [simSalesCorpId, setSimSalesCorpId] = useState<string>(corporateSchemas[0]?.id ?? '');
  const [simGrade, setSimGrade] = useState<SalesGradeKey>('Pro');
  const [simPersonalSA, setSimPersonalSA] = useState<number>(8);
  const [simAffiliateSA, setSimAffiliateSA] = useState<number>(10);

  // Simulator B: Teknisi Base + WO Fees + Target Bonus (Harian/Mingguan/Bulanan)
  const [simTechCorpId, setSimTechCorpId] = useState<string>(corporateSchemas[0]?.id ?? '');
  const [simSlaPct, setSimSlaPct] = useState<number>(97.5);
  const [simPemDaily, setSimPemDaily] = useState<number>(3);
  const [simPemWeekly, setSimPemWeekly] = useState<number>(16);
  const [simPemMonthly, setSimPemMonthly] = useState<number>(58);
  const [simMntDaily, setSimMntDaily] = useState<number>(4);
  const [simMntWeekly, setSimMntWeekly] = useState<number>(19);
  const [simMntMonthly, setSimMntMonthly] = useState<number>(66);
  const [simSrvDaily, setSimSrvDaily] = useState<number>(5);
  const [simSrvWeekly, setSimSrvWeekly] = useState<number>(25);
  const [simSrvMonthly, setSimSrvMonthly] = useState<number>(92);

  const selectedSalesSchema = useMemo(
    () => corporateSchemas.find((c) => c.id === simSalesCorpId) ?? corporateSchemas[0],
    [corporateSchemas, simSalesCorpId]
  );

  const selectedTechSchema = useMemo(
    () => corporateSchemas.find((c) => c.id === simTechCorpId) ?? corporateSchemas[0],
    [corporateSchemas, simTechCorpId]
  );

  const salesSimulation = useMemo(() => {
    if (!selectedSalesSchema) return null;
    return calculateCorporateSalesAffiliatePayroll({
      schema: selectedSalesSchema,
      grade: simGrade,
      personalSA: simPersonalSA,
      affiliateSA: simAffiliateSA,
    });
  }, [selectedSalesSchema, simAffiliateSA, simGrade, simPersonalSA]);

  const techSimulation = useMemo(() => {
    if (!selectedTechSchema) return null;
    return calculateTechnicianCompensation({
      schema: selectedTechSchema,
      bonusRules: technicianBonusRules,
      slaPct: simSlaPct,
      completedCounts: {
        pemasangan: { daily: simPemDaily, weekly: simPemWeekly, monthly: simPemMonthly },
        maintenance: { daily: simMntDaily, weekly: simMntWeekly, monthly: simMntMonthly },
        survey: { daily: simSrvDaily, weekly: simSrvWeekly, monthly: simSrvMonthly },
      },
    });
  }, [
    selectedTechSchema,
    technicianBonusRules,
    simSlaPct,
    simPemDaily,
    simPemWeekly,
    simPemMonthly,
    simMntDaily,
    simMntWeekly,
    simMntMonthly,
    simSrvDaily,
    simSrvWeekly,
    simSrvMonthly,
  ]);

  const filteredBonusRules = useMemo(() => {
    return technicianBonusRules.filter((r) => {
      if (filterCorpId !== 'ALL' && r.corporateSchemaId !== filterCorpId) return false;
      if (filterTaskType !== 'ALL' && r.taskType !== filterTaskType) return false;
      if (filterPeriod !== 'ALL' && r.period !== filterPeriod) return false;
      return true;
    });
  }, [filterCorpId, filterPeriod, filterTaskType, technicianBonusRules]);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Skema Penggajian, Komisi, Tier & Bonus per Corporate"
        subtitle="Master CRUD kontrak kerjasama korporat: gaji pokok, tier SA, split otomatis Staff Sales ↔ Affiliate, serta bonus target Teknisi (Harian, Mingguan, Bulanan)."
        onBack={onBack}
        actions={
          <div className="flex flex-wrap gap-2">
            {tab === 'bonus-teknisi' ? (
              <button
                type="button"
                onClick={() => onOpenTechBonusModal()}
                className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#0284C7] px-4 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Aturan Bonus Teknisi</span>
              </button>
            ) : tab === 'versi' ? (
              <button
                type="button"
                onClick={() => onOpenSchemeModal()}
                className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#0284C7] px-4 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Audit Skema</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onOpenCorpSchemaModal()}
                className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#0284C7] px-4 text-xs font-semibold text-white hover:bg-[#0369A1] whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Skema Corporate</span>
              </button>
            )}
          </div>
        }
      />

      <AdminSegmentedTabs
        tabs={[
          { id: 'corporate', label: `Payroll & Komisi Corporate (${corporateSchemas.length})` },
          { id: 'bonus-teknisi', label: `Bonus Target Teknisi (${technicianBonusRules.length})` },
          { id: 'simulasi', label: 'Simulator Split & Bonus' },
          { id: 'versi', label: `Audit Versi (${schemes.length})` },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      {/* TAB 1: Corporate Payroll, Commission Split & Tier CRUD */}
      {tab === 'corporate' && (
        <div className="space-y-4">
          {corporateSchemas.map((corp) => {
            const isExpanded = expandedCorpId === corp.id;
            const bonusCount = technicianBonusRules.filter(
              (r) => r.corporateSchemaId === corp.id && r.status === 'Aktif'
            ).length;

            return (
              <div
                key={corp.id}
                className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 space-y-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#E6F4F9] text-[#0284C7]">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-[#17324D]">{corp.corporateName}</h3>
                        <span className="font-mono-tabular text-xs font-semibold text-[#0284C7]">
                          {corp.contractNumber}
                        </span>
                        <AdminStatusText
                          tone={
                            corp.status === 'Aktif'
                              ? 'success'
                              : corp.status === 'Draft'
                                ? 'warning'
                                : 'neutral'
                          }
                          label={corp.status}
                        />
                      </div>
                      <p className="mt-0.5 text-xs text-[#526675]">
                        Kode Vendor: <span className="font-mono-tabular font-semibold">{corp.vendorCode}</span> · Masa Kontrak: {corp.effectiveRange}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandedCorpId(isExpanded ? '' : corp.id)}
                      className="inline-flex h-8 items-center gap-1 rounded-[8px] border border-[#D8E3E9] bg-[#F5F8FA] px-3 text-xs font-semibold text-[#17324D] hover:border-[#0284C7]"
                    >
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      <span>{isExpanded ? 'Tutup Rincian' : `Lihat ${corp.salesConfig.tiers.length} Tier SA`}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenCorpSchemaModal(corp)}
                      className="inline-flex h-8 items-center gap-1 rounded-[8px] border border-[#D8E3E9] px-3 text-xs font-semibold text-[#0284C7] hover:bg-[#E6F4F9]"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span>Edit Skema</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteCorpSchema(corp.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#D8E3E9] text-[#B23A48] hover:bg-[#B23A48]/10"
                      aria-label={`Hapus skema ${corp.corporateName}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Key Contract Metrics Grid */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {/* Sales Compensation Card */}
                  <div className="rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-3.5 space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#0284C7]">
                      Staff Sales &amp; Split Affiliate
                    </p>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-[#526675]">Gaji Pokok Sales</span>
                      <span className="font-mono-tabular font-bold text-[#17324D]">
                        {formatIDR(corp.salesConfig.baseSalaryIdr)}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-[#526675]">Tunjangan Operasional</span>
                      <span className="font-mono-tabular font-semibold text-[#17324D]">
                        {formatIDR(corp.salesConfig.operationalAllowanceIdr)}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between border-t border-[#D8E3E9] pt-2 text-xs">
                      <span className="text-[#526675]">Split Affiliate / Sales</span>
                      <span className="font-mono-tabular font-bold text-[#247A55]">
                        {corp.salesConfig.affiliateSplitPct}% / {corp.salesConfig.salesIncrementalSplitPct}%
                      </span>
                    </div>
                  </div>

                  {/* Technician Compensation Card */}
                  <div className="rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-3.5 space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#17324D]">
                      Staff Teknisi &amp; Fee Work Order
                    </p>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-[#526675]">Gaji Pokok Teknisi</span>
                      <span className="font-mono-tabular font-bold text-[#17324D]">
                        {formatIDR(corp.technicianConfig.baseSalaryIdr)}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-[#526675]">Tunjangan Lapangan</span>
                      <span className="font-mono-tabular font-semibold text-[#17324D]">
                        {formatIDR(corp.technicianConfig.fieldAllowanceIdr)}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between border-t border-[#D8E3E9] pt-2 text-xs">
                      <span className="text-[#526675]">Fee PSB / Maint / Survey</span>
                      <span className="font-mono-tabular font-semibold text-[#17324D]">
                        {Math.round(corp.technicianConfig.feePemasanganIdr / 1000)}K /{' '}
                        {Math.round(corp.technicianConfig.feeMaintenanceIdr / 1000)}K /{' '}
                        {Math.round(corp.technicianConfig.feeSurveyIdr / 1000)}K
                      </span>
                    </div>
                  </div>

                  {/* Bonus & SLA Card */}
                  <div className="rounded-[12px] border border-[#D8E3E9] bg-[#F5F8FA] p-3.5 space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#247A55]">
                      Bonus Target &amp; Grade Kontrak
                    </p>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-[#526675]">Bonus Grade (OJT/Pro/Elite)</span>
                      <span className="font-mono-tabular font-semibold text-[#17324D]">
                        {Math.round(corp.salesConfig.gradeBonus.OJT / 1000)}K /{' '}
                        {Math.round(corp.salesConfig.gradeBonus.Pro / 1000)}K /{' '}
                        {(corp.salesConfig.gradeBonus.Elite / 1000000).toFixed(1)}Jt
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-[#526675]">Bonus SLA Teknisi (≥{corp.technicianConfig.minSlaPctForBonus}%)</span>
                      <span className="font-mono-tabular font-bold text-[#247A55]">
                        {formatIDR(corp.technicianConfig.slaComplianceBonusIdr)}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between border-t border-[#D8E3E9] pt-2 text-xs">
                      <span className="text-[#526675]">Aturan Bonus Target Aktif</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFilterCorpId(corp.id);
                          setTab('bonus-teknisi');
                        }}
                        className="font-mono-tabular font-bold text-[#0284C7] hover:underline"
                      >
                        {bonusCount} Aturan H/M/B →
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expandable SA Tier Brackets */}
                {isExpanded && (
                  <div className="overflow-x-auto rounded-[12px] border border-[#D8E3E9]">
                    <table className="w-full min-w-[560px] text-left text-xs">
                      <thead className="border-b border-[#D8E3E9] bg-[#F5F8FA] text-[11px] font-semibold uppercase tracking-wider text-[#526675]">
                        <tr>
                          <th className="px-4 py-2.5">Bracket Tier SA</th>
                          <th className="px-4 py-2.5">Rentang SA Gabungan</th>
                          <th className="px-4 py-2.5 text-right">Komisi / SA</th>
                          <th className="px-4 py-2.5 text-right">Multiplier</th>
                          <th className="px-4 py-2.5 text-right">Bonus Pencapaian Tier</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D8E3E9]">
                        {corp.salesConfig.tiers.map((tier) => (
                          <tr key={tier.id} className="hover:bg-[#F8FBFD]">
                            <td className="px-4 py-2.5 font-bold text-[#17324D]">{tier.label}</td>
                            <td className="px-4 py-2.5 font-mono-tabular text-[#526675]">
                              {tier.minSA} – {tier.maxSA ?? '∞'} SA
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono-tabular font-semibold text-[#0284C7]">
                              {formatIDR(tier.feePerSA)}
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono-tabular text-[#17324D]">
                              {tier.multiplier}x
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono-tabular font-bold text-[#247A55]">
                              {formatIDR(tier.tierBonusIdr)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: Technician Target Bonus Rules CRUD (Harian / Mingguan / Bulanan × Pemasangan / Maintenance / Survey) */}
      {tab === 'bonus-teknisi' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="grid grid-cols-1 gap-3 rounded-[14px] border border-[#D8E3E9] bg-white p-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#526675]">
                Corporate / Vendor
              </label>
              <select
                value={filterCorpId}
                onChange={(e) => setFilterCorpId(e.target.value)}
                className="h-10 w-full rounded-[10px] border border-[#D8E3E9] bg-white px-3 text-xs font-semibold text-[#172B3A]"
              >
                <option value="ALL">Semua Corporate ({corporateSchemas.length})</option>
                {corporateSchemas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.corporateName} ({c.contractNumber})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#526675]">
                Kategori Tugas Teknisi
              </label>
              <select
                value={filterTaskType}
                onChange={(e) => setFilterTaskType(e.target.value as 'ALL' | TechnicianTaskCategory)}
                className="h-10 w-full rounded-[10px] border border-[#D8E3E9] bg-white px-3 text-xs font-semibold text-[#172B3A]"
              >
                <option value="ALL">Semua Kategori (Pemasangan · Maintenance · Survey)</option>
                <option value="Pemasangan">Pemasangan (Instalasi Baru)</option>
                <option value="Maintenance">Maintenance &amp; Troubleshooting</option>
                <option value="Survey">Survey Lokasi / ODP</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#526675]">
                Periode Target Bonus
              </label>
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value as 'ALL' | BonusPeriodType)}
                className="h-10 w-full rounded-[10px] border border-[#D8E3E9] bg-white px-3 text-xs font-semibold text-[#172B3A]"
              >
                <option value="ALL">Semua Periode (Harian · Mingguan · Bulanan)</option>
                <option value="Harian">Harian</option>
                <option value="Mingguan">Mingguan</option>
                <option value="Bulanan">Bulanan</option>
              </select>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {filteredBonusRules.map((rule) => (
              <div
                key={rule.id}
                className="rounded-[14px] border border-[#D8E3E9] bg-white p-4 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-[#17324D]">
                      {rule.taskType} · {rule.period}
                    </p>
                    <p className="text-xs text-[#526675]">{rule.corporateName}</p>
                  </div>
                  <AdminStatusText
                    tone={rule.status === 'Aktif' ? 'success' : 'neutral'}
                    label={rule.status}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 rounded-[10px] bg-[#F5F8FA] p-2.5 text-xs">
                  <div>
                    <p className="text-[10px] text-[#526675]">Target</p>
                    <p className="font-mono-tabular font-bold text-[#17324D]">
                      {rule.targetCount} tugas
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#526675]">Bonus Target</p>
                    <p className="font-mono-tabular font-bold text-[#247A55]">
                      {formatIDR(rule.bonusAmountIdr)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-[#526675]">Ekstra/Unit</p>
                    <p className="font-mono-tabular font-bold text-[#0284C7]">
                      {formatIDR(rule.extraPerUnitIdr)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-[#EAF2F6] pt-2.5">
                  <span className="font-mono-tabular text-[11px] text-[#526675]">
                    Min SLA {rule.minSlaPct}%
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => onToggleTechBonusStatus(rule.id)}
                      className="inline-flex h-8 items-center gap-1 rounded-[8px] border border-[#D8E3E9] px-2.5 text-xs font-semibold text-[#17324D]"
                    >
                      <Power className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenTechBonusModal(rule)}
                      className="inline-flex h-8 items-center gap-1 rounded-[8px] border border-[#D8E3E9] px-2.5 text-xs font-semibold text-[#0284C7]"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteTechBonusRule(rule.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#D8E3E9] text-[#B23A48]"
                      aria-label="Hapus aturan"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
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
                <thead className="border-b border-[#EAF2F6] bg-[#F5F8FA] text-[11px] font-semibold uppercase tracking-wider text-[#526675]">
                  <tr>
                    <th className="px-4 py-3">Corporate / Vendor</th>
                    <th className="px-4 py-3">Kategori Tugas</th>
                    <th className="px-4 py-3">Periode</th>
                    <th className="px-4 py-3 text-right">Target Unit</th>
                    <th className="px-4 py-3 text-right">Bonus Pencapaian</th>
                    <th className="px-4 py-3 text-right">Ekstra / Unit</th>
                    <th className="px-4 py-3 text-right">Min SLA</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Aksi CRUD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAF2F6]">
                  {filteredBonusRules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-[#F8FBFD]">
                      <td className="px-4 py-3 font-bold text-[#17324D]">{rule.corporateName}</td>
                      <td className="px-4 py-3 font-semibold text-[#172B3A]">{rule.taskType}</td>
                      <td className="px-4 py-3 font-semibold text-[#0284C7]">{rule.period}</td>
                      <td className="px-4 py-3 text-right font-mono-tabular font-bold text-[#17324D]">
                        {rule.targetCount} WO
                      </td>
                      <td className="px-4 py-3 text-right font-mono-tabular font-bold text-[#247A55]">
                        {formatIDR(rule.bonusAmountIdr)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono-tabular text-[#0284C7]">
                        +{formatIDR(rule.extraPerUnitIdr)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono-tabular text-[#526675]">
                        {rule.minSlaPct}%
                      </td>
                      <td className="px-4 py-3">
                        <AdminStatusText
                          tone={rule.status === 'Aktif' ? 'success' : 'neutral'}
                          label={rule.status}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => onToggleTechBonusStatus(rule.id)}
                            className="rounded-[8px] border border-[#D8E3E9] px-2 py-1 text-[11px] font-semibold text-[#17324D] hover:bg-[#F5F8FA]"
                          >
                            {rule.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenTechBonusModal(rule)}
                            className="rounded-[8px] border border-[#D8E3E9] px-2.5 py-1 text-[11px] font-semibold text-[#0284C7] hover:bg-[#E6F4F9]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteTechBonusRule(rule.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-[8px] border border-[#D8E3E9] text-[#B23A48] hover:bg-[#B23A48]/10"
                            aria-label="Hapus aturan bonus"
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

      {/* TAB 3: Simulator Payroll & Split Otomatis (Sales ↔ Affiliate + Bonus Teknisi) */}
      {tab === 'simulasi' && (
        <div className="space-y-6">
          {/* Simulator A: Staff Sales & Affiliate by Corporate Placement */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#EAF2F6] pb-3">
                <Calculator className="h-4 w-4 text-[#0284C7]" />
                <div>
                  <h2 className="text-sm font-bold text-[#17324D]">
                    Simulator Payroll &amp; Split Staff Sales ↔ Affiliate
                  </h2>
                  <p className="text-[11px] text-[#526675]">
                    Pembagian otomatis menyesuaikan vendor corporate penempatan Staff Sales.
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#172B3A]">
                  Penempatan Vendor Corporate
                </label>
                <select
                  value={simSalesCorpId}
                  onChange={(e) => setSimSalesCorpId(e.target.value)}
                  className="h-10 w-full rounded-[10px] border border-[#D8E3E9] bg-white px-3 text-xs font-semibold text-[#172B3A]"
                >
                  {corporateSchemas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.corporateName} ({c.contractNumber} · Split {c.salesConfig.affiliateSplitPct}/
                      {c.salesConfig.salesIncrementalSplitPct})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#172B3A]">
                  Grade Staff Sales
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['OJT', 'Pro', 'Elite'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setSimGrade(g)}
                      className={`h-10 rounded-[10px] border text-xs font-bold ${
                        simGrade === g
                          ? 'border-[#0284C7] bg-[#E6F4F9] text-[#0284C7]'
                          : 'border-[#D8E3E9] bg-white text-[#526675]'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#172B3A]">
                    SA Pribadi Sales
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={simPersonalSA}
                    onChange={(e) => setSimPersonalSA(Number(e.target.value) || 0)}
                    className="h-10 w-full rounded-[10px] border border-[#D8E3E9] px-3 font-mono-tabular text-sm font-bold text-[#172B3A]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#172B3A]">
                    SA Jaringan Affiliate
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={simAffiliateSA}
                    onChange={(e) => setSimAffiliateSA(Number(e.target.value) || 0)}
                    className="h-10 w-full rounded-[10px] border border-[#D8E3E9] px-3 font-mono-tabular text-sm font-bold text-[#172B3A]"
                  />
                </div>
              </div>
            </div>

            {salesSimulation && (
              <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-7 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EAF2F6] pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-[#17324D]">
                      Hasil Perhitungan — {salesSimulation.corporateName}
                    </h2>
                    <p className="text-[11px] text-[#526675]">
                      Kontrak {salesSimulation.contractNumber} · Split Otomatis{' '}
                      <span className="font-bold text-[#17324D]">
                        {salesSimulation.affiliateSplitPct}% Affiliate /{' '}
                        {salesSimulation.salesIncrementalSplitPct}% Staff Sales
                      </span>
                    </p>
                  </div>
                  <span className="font-mono-tabular text-xs font-bold text-[#0284C7]">
                    {salesSimulation.matchedTier.label} · {salesSimulation.matchedTier.multiplier}x
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] p-3">
                    <p className="text-[11px] text-[#526675]">Total SA Gabungan</p>
                    <p className="mt-1 font-mono-tabular text-lg font-bold text-[#17324D]">
                      {salesSimulation.combinedSA} SA
                    </p>
                    <p className="text-[11px] text-[#526675]">
                      Atribusi Sales: {salesSimulation.salesAttributedTotalSA} SA
                    </p>
                  </div>
                  <div className="rounded-[10px] border border-[#0284C7]/30 bg-[#E6F4F9]/40 p-3">
                    <p className="text-[11px] font-semibold text-[#0284C7]">
                      Take-Home Staff Sales
                    </p>
                    <p className="mt-1 font-mono-tabular text-lg font-bold text-[#17324D]">
                      {formatIDR(salesSimulation.salesTotalTakeHomeIdr)}
                    </p>
                    <p className="text-[11px] text-[#526675]">Gaji Pokok + Tunj + Komisi</p>
                  </div>
                  <div className="rounded-[10px] border border-[#247A55]/30 bg-[#E6F4F9]/20 p-3">
                    <p className="text-[11px] font-semibold text-[#247A55]">
                      Payout Affiliate ({salesSimulation.affiliateSplitPct}%)
                    </p>
                    <p className="mt-1 font-mono-tabular text-lg font-bold text-[#247A55]">
                      {formatIDR(salesSimulation.affiliatePayoutIdr)}
                    </p>
                    <p className="text-[11px] text-[#526675]">
                      {salesSimulation.affiliateShareSA} SA Share Affiliate
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 border-t border-[#EAF2F6] pt-3 text-xs sm:grid-cols-3">
                  <div className="flex justify-between">
                    <span className="text-[#526675]">Gaji Pokok</span>
                    <span className="font-mono-tabular font-semibold">
                      {formatIDR(salesSimulation.baseSalaryIdr)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#526675]">Tunjangan Ops</span>
                    <span className="font-mono-tabular font-semibold">
                      {formatIDR(salesSimulation.operationalAllowanceIdr)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#526675]">Bonus Grade ({salesSimulation.grade})</span>
                    <span className="font-mono-tabular font-semibold">
                      {formatIDR(salesSimulation.gradeBonusIdr)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#526675]">Komisi SA Sales</span>
                    <span className="font-mono-tabular font-semibold text-[#0284C7]">
                      {formatIDR(salesSimulation.salesCommissionIdr)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#526675]">Bonus Tier Bracket</span>
                    <span className="font-mono-tabular font-semibold text-[#247A55]">
                      {formatIDR(salesSimulation.tierBonusIdr)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#526675]">Total Beban Kontrak</span>
                    <span className="font-mono-tabular font-bold text-[#17324D]">
                      {formatIDR(salesSimulation.grossCombinedPayoutIdr)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Simulator B: Staff Teknisi Base Salary + WO Fees + Daily/Weekly/Monthly Bonus */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#EAF2F6] pb-3">
                <Wrench className="h-4 w-4 text-[#17324D]" />
                <div>
                  <h2 className="text-sm font-bold text-[#17324D]">
                    Simulator Gaji &amp; Bonus Target Teknisi
                  </h2>
                  <p className="text-[11px] text-[#526675]">
                    Gaji pokok + fee per tugas + bonus target Harian, Mingguan &amp; Bulanan.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#172B3A]">
                    Penempatan Corporate
                  </label>
                  <select
                    value={simTechCorpId}
                    onChange={(e) => setSimTechCorpId(e.target.value)}
                    className="h-10 w-full rounded-[10px] border border-[#D8E3E9] bg-white px-2.5 text-xs font-semibold text-[#172B3A]"
                  >
                    {corporateSchemas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.corporateName} ({c.contractNumber})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#172B3A]">
                    Skor SLA Lapangan (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min={0}
                    max={100}
                    value={simSlaPct}
                    onChange={(e) => setSimSlaPct(Number(e.target.value) || 0)}
                    className="h-10 w-full rounded-[10px] border border-[#D8E3E9] px-3 font-mono-tabular text-sm font-bold text-[#172B3A]"
                  />
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <p className="font-semibold text-[#526675]">
                  Input Capaian Tugas Selesai (Harian / Mingguan / Bulanan)
                </p>
                <div className="grid grid-cols-4 items-center gap-2">
                  <span className="font-bold text-[#17324D]">Pemasangan</span>
                  <input
                    type="number"
                    min={0}
                    value={simPemDaily}
                    onChange={(e) => setSimPemDaily(Number(e.target.value) || 0)}
                    aria-label="Pemasangan Harian"
                    className="h-9 rounded-[8px] border border-[#D8E3E9] px-2 text-center font-mono-tabular font-semibold"
                  />
                  <input
                    type="number"
                    min={0}
                    value={simPemWeekly}
                    onChange={(e) => setSimPemWeekly(Number(e.target.value) || 0)}
                    aria-label="Pemasangan Mingguan"
                    className="h-9 rounded-[8px] border border-[#D8E3E9] px-2 text-center font-mono-tabular font-semibold"
                  />
                  <input
                    type="number"
                    min={0}
                    value={simPemMonthly}
                    onChange={(e) => setSimPemMonthly(Number(e.target.value) || 0)}
                    aria-label="Pemasangan Bulanan"
                    className="h-9 rounded-[8px] border border-[#D8E3E9] px-2 text-center font-mono-tabular font-semibold"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-2">
                  <span className="font-bold text-[#17324D]">Maintenance</span>
                  <input
                    type="number"
                    min={0}
                    value={simMntDaily}
                    onChange={(e) => setSimMntDaily(Number(e.target.value) || 0)}
                    aria-label="Maintenance Harian"
                    className="h-9 rounded-[8px] border border-[#D8E3E9] px-2 text-center font-mono-tabular font-semibold"
                  />
                  <input
                    type="number"
                    min={0}
                    value={simMntWeekly}
                    onChange={(e) => setSimMntWeekly(Number(e.target.value) || 0)}
                    aria-label="Maintenance Mingguan"
                    className="h-9 rounded-[8px] border border-[#D8E3E9] px-2 text-center font-mono-tabular font-semibold"
                  />
                  <input
                    type="number"
                    min={0}
                    value={simMntMonthly}
                    onChange={(e) => setSimMntMonthly(Number(e.target.value) || 0)}
                    aria-label="Maintenance Bulanan"
                    className="h-9 rounded-[8px] border border-[#D8E3E9] px-2 text-center font-mono-tabular font-semibold"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-2">
                  <span className="font-bold text-[#17324D]">Survey</span>
                  <input
                    type="number"
                    min={0}
                    value={simSrvDaily}
                    onChange={(e) => setSimSrvDaily(Number(e.target.value) || 0)}
                    aria-label="Survey Harian"
                    className="h-9 rounded-[8px] border border-[#D8E3E9] px-2 text-center font-mono-tabular font-semibold"
                  />
                  <input
                    type="number"
                    min={0}
                    value={simSrvWeekly}
                    onChange={(e) => setSimSrvWeekly(Number(e.target.value) || 0)}
                    aria-label="Survey Mingguan"
                    className="h-9 rounded-[8px] border border-[#D8E3E9] px-2 text-center font-mono-tabular font-semibold"
                  />
                  <input
                    type="number"
                    min={0}
                    value={simSrvMonthly}
                    onChange={(e) => setSimSrvMonthly(Number(e.target.value) || 0)}
                    aria-label="Survey Bulanan"
                    className="h-9 rounded-[8px] border border-[#D8E3E9] px-2 text-center font-mono-tabular font-semibold"
                  />
                </div>
                <div className="grid grid-cols-4 text-center text-[10px] text-[#718391]">
                  <span />
                  <span>Harian</span>
                  <span>Mingguan</span>
                  <span>Bulanan</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSimPemDaily(DEFAULT_TECH_TASK_COUNTS.pemasangan.daily);
                  setSimPemWeekly(DEFAULT_TECH_TASK_COUNTS.pemasangan.weekly);
                  setSimPemMonthly(DEFAULT_TECH_TASK_COUNTS.pemasangan.monthly);
                  setSimMntDaily(DEFAULT_TECH_TASK_COUNTS.maintenance.daily);
                  setSimMntWeekly(DEFAULT_TECH_TASK_COUNTS.maintenance.weekly);
                  setSimMntMonthly(DEFAULT_TECH_TASK_COUNTS.maintenance.monthly);
                  setSimSrvDaily(DEFAULT_TECH_TASK_COUNTS.survey.daily);
                  setSimSrvWeekly(DEFAULT_TECH_TASK_COUNTS.survey.weekly);
                  setSimSrvMonthly(DEFAULT_TECH_TASK_COUNTS.survey.monthly);
                }}
                className="text-[11px] font-semibold text-[#0284C7] hover:underline"
              >
                Muat baseline progres teknisi lapangan
              </button>
            </div>

            {techSimulation && (
              <div className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 lg:col-span-7 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EAF2F6] pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-[#17324D]">
                      Estimasi Payroll &amp; Bonus Teknisi — {techSimulation.corporateName}
                    </h2>
                    <p className="text-[11px] text-[#526675]">
                      {techSimulation.contractNumber} · Gaji Pokok + Fee WO + Bonus Harian, Mingguan
                      &amp; Bulanan
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-[#526675]">
                      Total Take-Home Pay
                    </p>
                    <p className="font-mono-tabular text-lg font-bold text-[#247A55]">
                      {formatIDR(techSimulation.totalTakeHomePayIdr)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  <div className="rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] p-3">
                    <p className="text-[10px] text-[#526675]">Gaji Pokok + Tunj</p>
                    <p className="mt-1 font-mono-tabular text-xs font-bold text-[#17324D]">
                      {formatIDR(techSimulation.baseSalaryIdr + techSimulation.fieldAllowanceIdr)}
                    </p>
                  </div>
                  <div className="rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] p-3">
                    <p className="text-[10px] text-[#526675]">Fee Work Order</p>
                    <p className="mt-1 font-mono-tabular text-xs font-bold text-[#0284C7]">
                      {formatIDR(techSimulation.taskFeesBreakdown.totalTaskFeesIdr)}
                    </p>
                  </div>
                  <div className="rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] p-3">
                    <p className="text-[10px] text-[#526675]">Bonus Target H/M/B</p>
                    <p className="mt-1 font-mono-tabular text-xs font-bold text-[#247A55]">
                      {formatIDR(techSimulation.totalTargetBonusIdr)}
                    </p>
                  </div>
                  <div className="rounded-[10px] border border-[#D8E3E9] bg-[#F5F8FA] p-3">
                    <p className="text-[10px] text-[#526675]">Bonus SLA</p>
                    <p className="mt-1 font-mono-tabular text-xs font-bold text-[#17324D]">
                      {formatIDR(techSimulation.slaComplianceBonusIdr)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-[#17324D]">
                    Evaluasi Target Bonus (Harian · Mingguan · Bulanan)
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {techSimulation.bonusEvaluations.map((ev) => (
                      <div
                        key={ev.rule.id}
                        className={`rounded-[10px] border p-2.5 text-xs ${
                          ev.achieved
                            ? 'border-[#247A55]/40 bg-[#E6F4F9]/30'
                            : 'border-[#D8E3E9] bg-[#F5F8FA]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#17324D]">
                            {ev.rule.taskType} · {ev.rule.period}
                          </span>
                          <span
                            className={`font-mono-tabular text-[11px] font-bold ${
                              ev.achieved ? 'text-[#247A55]' : 'text-[#A96816]'
                            }`}
                          >
                            {ev.actualCount}/{ev.rule.targetCount}
                          </span>
                        </div>
                        <p className="mt-1 font-mono-tabular text-[11px] font-semibold text-[#172B3A]">
                          {ev.achieved
                            ? `+${formatIDR(ev.earnedBonusIdr)}`
                            : `Target ${formatIDR(ev.rule.bonusAmountIdr)}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Versioning & Audit */}
      {tab === 'versi' && (
        <div className="space-y-3">
          {schemes.map((s) => (
            <div
              key={s.id}
              className="rounded-[14px] border border-[#D8E3E9] bg-white p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#EAF2F6] text-[#17324D]">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-[#17324D]">{s.name}</p>
                    <span className="font-mono-tabular text-xs font-bold text-[#0284C7]">
                      {s.version}
                    </span>
                    <AdminStatusText
                      tone={s.status === 'Aktif' ? 'success' : s.status === 'Draft' ? 'warning' : 'neutral'}
                      label={s.status}
                    />
                  </div>
                  <p className="mt-1 text-xs text-[#526675]">
                    {s.providerName} · {s.productScope} · {s.splitRule}
                  </p>
                  <p className="text-[11px] text-[#718391]">
                    Basis: {s.tierBasis} · Approval: {s.approvedBy}
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => onOpenSchemeModal(s)}
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#D8E3E9] px-3 text-xs font-semibold text-[#0284C7]"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
                {onDeleteScheme && (
                  <button
                    type="button"
                    onClick={() => onDeleteScheme(s.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D8E3E9] text-[#B23A48]"
                    aria-label={`Hapus ${s.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
