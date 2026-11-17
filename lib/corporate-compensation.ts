export type SalesGradeKey = 'OJT' | 'Pro' | 'Elite';
export type TechnicianTaskCategory = 'Pemasangan' | 'Maintenance' | 'Survey';
export type BonusPeriodType = 'Harian' | 'Mingguan' | 'Bulanan';

export interface SalesTierBracket {
  id: string;
  label: string;
  minSA: number;
  maxSA: number | null;
  feePerSA: number;
  multiplier: number;
  tierBonusIdr: number;
}

export interface CorporateCompensationSchema {
  id: string;
  tenantId: string;
  corporateName: string;
  vendorCode: string;
  contractNumber: string;
  effectiveRange: string;
  status: 'Aktif' | 'Draft' | 'Arsip';
  salesConfig: {
    baseSalaryIdr: number;
    operationalAllowanceIdr: number;
    affiliateSplitPct: number;
    salesIncrementalSplitPct: number;
    affiliateFeePerSAIdr: number;
    gradeBonus: Record<SalesGradeKey, number>;
    productRates: {
      ftthIdr: number;
      fwaIdr: number;
      pxgyIdr: number;
    };
    tiers: SalesTierBracket[];
  };
  technicianConfig: {
    baseSalaryIdr: number;
    fieldAllowanceIdr: number;
    feePemasanganIdr: number;
    feeMaintenanceIdr: number;
    feeSurveyIdr: number;
    slaComplianceBonusIdr: number;
    minSlaPctForBonus: number;
  };
}

export interface TechnicianBonusRule {
  id: string;
  corporateSchemaId: string;
  corporateName: string;
  taskType: TechnicianTaskCategory;
  period: BonusPeriodType;
  targetCount: number;
  bonusAmountIdr: number;
  extraPerUnitIdr: number;
  minSlaPct: number;
  status: 'Aktif' | 'Nonaktif';
}

export interface TechnicianTaskCounts {
  pemasangan: { daily: number; weekly: number; monthly: number };
  maintenance: { daily: number; weekly: number; monthly: number };
  survey: { daily: number; weekly: number; monthly: number };
}

export interface EvaluatedTechBonusItem {
  rule: TechnicianBonusRule;
  actualCount: number;
  progressPct: number;
  achieved: boolean;
  slaQualified: boolean;
  extraUnits: number;
  earnedBonusIdr: number;
}

export interface TechnicianCompensationBreakdown {
  corporateName: string;
  contractNumber: string;
  baseSalaryIdr: number;
  fieldAllowanceIdr: number;
  taskFeesBreakdown: {
    pemasanganCount: number;
    pemasanganFeeIdr: number;
    maintenanceCount: number;
    maintenanceFeeIdr: number;
    surveyCount: number;
    surveyFeeIdr: number;
    totalTaskFeesIdr: number;
  };
  slaComplianceBonusIdr: number;
  slaQualified: boolean;
  bonusEvaluations: EvaluatedTechBonusItem[];
  totalDailyBonusIdr: number;
  totalWeeklyBonusIdr: number;
  totalMonthlyBonusIdr: number;
  totalTargetBonusIdr: number;
  totalTakeHomePayIdr: number;
}

export interface CorporateSalesAffiliateBreakdown {
  corporateName: string;
  contractNumber: string;
  grade: SalesGradeKey;
  personalSA: number;
  affiliateSA: number;
  combinedSA: number;
  affiliateSplitPct: number;
  salesIncrementalSplitPct: number;
  affiliateShareSA: number;
  salesIncrementalSA: number;
  salesAttributedTotalSA: number;
  matchedTier: SalesTierBracket;
  baseSalaryIdr: number;
  operationalAllowanceIdr: number;
  gradeBonusIdr: number;
  tierBonusIdr: number;
  salesCommissionIdr: number;
  salesTotalTakeHomeIdr: number;
  affiliatePayoutIdr: number;
  grossCombinedPayoutIdr: number;
}

export const INITIAL_CORPORATE_COMPENSATION_SCHEMAS: CorporateCompensationSchema[] = [
  {
    id: 'corp-comp-nusantara',
    tenantId: 'ten-isp-nusantara',
    corporateName: 'PT ISP Nusantara',
    vendorCode: 'VND-ISN-01',
    contractNumber: 'CTR-2026-001',
    effectiveRange: '01 Jan 2026 – 31 Des 2026',
    status: 'Aktif',
    salesConfig: {
      baseSalaryIdr: 4500000,
      operationalAllowanceIdr: 650000,
      affiliateSplitPct: 60,
      salesIncrementalSplitPct: 40,
      affiliateFeePerSAIdr: 125000,
      gradeBonus: {
        OJT: 250000,
        Pro: 750000,
        Elite: 1500000,
      },
      productRates: {
        ftthIdr: 200000,
        fwaIdr: 150000,
        pxgyIdr: 175000,
      },
      tiers: [
        { id: 't-isn-1', label: 'Tier 1 (0–6 SA)', minSA: 0, maxSA: 6, feePerSA: 80000, multiplier: 1.0, tierBonusIdr: 0 },
        { id: 't-isn-2', label: 'Tier 2 (7–13 SA)', minSA: 7, maxSA: 13, feePerSA: 150000, multiplier: 1.5, tierBonusIdr: 350000 },
        { id: 't-isn-3', label: 'Tier 3 (14–29 SA)', minSA: 14, maxSA: 29, feePerSA: 200000, multiplier: 2.0, tierBonusIdr: 750000 },
        { id: 't-isn-4', label: 'Tier 4 (30–49 SA)', minSA: 30, maxSA: 49, feePerSA: 240000, multiplier: 2.5, tierBonusIdr: 1400000 },
        { id: 't-isn-5', label: 'Tier 5 (50+ SA)', minSA: 50, maxSA: null, feePerSA: 275000, multiplier: 3.0, tierBonusIdr: 2500000 },
      ],
    },
    technicianConfig: {
      baseSalaryIdr: 4800000,
      fieldAllowanceIdr: 750000,
      feePemasanganIdr: 150000,
      feeMaintenanceIdr: 95000,
      feeSurveyIdr: 65000,
      slaComplianceBonusIdr: 600000,
      minSlaPctForBonus: 95,
    },
  },
  {
    id: 'corp-comp-globalnet',
    tenantId: 'ten-globalnet',
    corporateName: 'GlobalNet ISP',
    vendorCode: 'VND-GLN-02',
    contractNumber: 'CTR-2026-008',
    effectiveRange: '01 Feb 2026 – 31 Jan 2027',
    status: 'Aktif',
    salesConfig: {
      baseSalaryIdr: 5000000,
      operationalAllowanceIdr: 800000,
      affiliateSplitPct: 55,
      salesIncrementalSplitPct: 45,
      affiliateFeePerSAIdr: 135000,
      gradeBonus: {
        OJT: 300000,
        Pro: 900000,
        Elite: 1800000,
      },
      productRates: {
        ftthIdr: 220000,
        fwaIdr: 165000,
        pxgyIdr: 195000,
      },
      tiers: [
        { id: 't-gln-1', label: 'Tier 1 (0–9 SA)', minSA: 0, maxSA: 9, feePerSA: 95000, multiplier: 1.0, tierBonusIdr: 0 },
        { id: 't-gln-2', label: 'Tier 2 (10–24 SA)', minSA: 10, maxSA: 24, feePerSA: 185000, multiplier: 1.75, tierBonusIdr: 500000 },
        { id: 't-gln-3', label: 'Tier 3 (25–44 SA)', minSA: 25, maxSA: 44, feePerSA: 235000, multiplier: 2.25, tierBonusIdr: 1200000 },
        { id: 't-gln-4', label: 'Tier 4 (45+ SA)', minSA: 45, maxSA: null, feePerSA: 290000, multiplier: 3.1, tierBonusIdr: 2800000 },
      ],
    },
    technicianConfig: {
      baseSalaryIdr: 5200000,
      fieldAllowanceIdr: 900000,
      feePemasanganIdr: 175000,
      feeMaintenanceIdr: 110000,
      feeSurveyIdr: 75000,
      slaComplianceBonusIdr: 750000,
      minSlaPctForBonus: 96,
    },
  },
  {
    id: 'corp-comp-metrolink',
    tenantId: 'ten-metrolink',
    corporateName: 'MetroLink',
    vendorCode: 'VND-MTR-03',
    contractNumber: 'CTR-2026-014',
    effectiveRange: '01 Nov 2026 – 31 Okt 2027',
    status: 'Aktif',
    salesConfig: {
      baseSalaryIdr: 3800000,
      operationalAllowanceIdr: 500000,
      affiliateSplitPct: 70,
      salesIncrementalSplitPct: 30,
      affiliateFeePerSAIdr: 145000,
      gradeBonus: {
        OJT: 200000,
        Pro: 600000,
        Elite: 1200000,
      },
      productRates: {
        ftthIdr: 180000,
        fwaIdr: 135000,
        pxgyIdr: 155000,
      },
      tiers: [
        { id: 't-mtr-1', label: 'Tier 1 (0–5 SA)', minSA: 0, maxSA: 5, feePerSA: 75000, multiplier: 1.0, tierBonusIdr: 0 },
        { id: 't-mtr-2', label: 'Tier 2 (6–15 SA)', minSA: 6, maxSA: 15, feePerSA: 140000, multiplier: 1.4, tierBonusIdr: 300000 },
        { id: 't-mtr-3', label: 'Tier 3 (16–30 SA)', minSA: 16, maxSA: 30, feePerSA: 190000, multiplier: 1.9, tierBonusIdr: 700000 },
        { id: 't-mtr-4', label: 'Tier 4 (31+ SA)', minSA: 31, maxSA: null, feePerSA: 230000, multiplier: 2.4, tierBonusIdr: 1500000 },
      ],
    },
    technicianConfig: {
      baseSalaryIdr: 4400000,
      fieldAllowanceIdr: 600000,
      feePemasanganIdr: 135000,
      feeMaintenanceIdr: 85000,
      feeSurveyIdr: 55000,
      slaComplianceBonusIdr: 500000,
      minSlaPctForBonus: 94,
    },
  },
  {
    id: 'corp-comp-citranet',
    tenantId: 'ten-citranet',
    corporateName: 'CitraNet',
    vendorCode: 'VND-CTN-04',
    contractNumber: 'CTR-2026-019',
    effectiveRange: '15 Mar 2026 – 14 Mar 2027',
    status: 'Aktif',
    salesConfig: {
      baseSalaryIdr: 4200000,
      operationalAllowanceIdr: 600000,
      affiliateSplitPct: 65,
      salesIncrementalSplitPct: 35,
      affiliateFeePerSAIdr: 130000,
      gradeBonus: {
        OJT: 225000,
        Pro: 700000,
        Elite: 1400000,
      },
      productRates: {
        ftthIdr: 195000,
        fwaIdr: 145000,
        pxgyIdr: 165000,
      },
      tiers: [
        { id: 't-ctn-1', label: 'Tier 1 (0–7 SA)', minSA: 0, maxSA: 7, feePerSA: 85000, multiplier: 1.0, tierBonusIdr: 0 },
        { id: 't-ctn-2', label: 'Tier 2 (8–19 SA)', minSA: 8, maxSA: 19, feePerSA: 165000, multiplier: 1.6, tierBonusIdr: 400000 },
        { id: 't-ctn-3', label: 'Tier 3 (20–39 SA)', minSA: 20, maxSA: 39, feePerSA: 215000, multiplier: 2.1, tierBonusIdr: 950000 },
        { id: 't-ctn-4', label: 'Tier 4 (40+ SA)', minSA: 40, maxSA: null, feePerSA: 260000, multiplier: 2.8, tierBonusIdr: 2000000 },
      ],
    },
    technicianConfig: {
      baseSalaryIdr: 4600000,
      fieldAllowanceIdr: 700000,
      feePemasanganIdr: 145000,
      feeMaintenanceIdr: 90000,
      feeSurveyIdr: 60000,
      slaComplianceBonusIdr: 550000,
      minSlaPctForBonus: 95,
    },
  },
];

export const INITIAL_TECH_BONUS_RULES: TechnicianBonusRule[] = [
  // PT ISP Nusantara — Lengkap 3 Kategori × 3 Periode (Harian, Mingguan, Bulanan)
  { id: 'tbr-isn-pem-d', corporateSchemaId: 'corp-comp-nusantara', corporateName: 'PT ISP Nusantara', taskType: 'Pemasangan', period: 'Harian', targetCount: 3, bonusAmountIdr: 150000, extraPerUnitIdr: 45000, minSlaPct: 95, status: 'Aktif' },
  { id: 'tbr-isn-pem-w', corporateSchemaId: 'corp-comp-nusantara', corporateName: 'PT ISP Nusantara', taskType: 'Pemasangan', period: 'Mingguan', targetCount: 15, bonusAmountIdr: 600000, extraPerUnitIdr: 55000, minSlaPct: 95, status: 'Aktif' },
  { id: 'tbr-isn-pem-m', corporateSchemaId: 'corp-comp-nusantara', corporateName: 'PT ISP Nusantara', taskType: 'Pemasangan', period: 'Bulanan', targetCount: 55, bonusAmountIdr: 2000000, extraPerUnitIdr: 65000, minSlaPct: 96, status: 'Aktif' },

  { id: 'tbr-isn-mnt-d', corporateSchemaId: 'corp-comp-nusantara', corporateName: 'PT ISP Nusantara', taskType: 'Maintenance', period: 'Harian', targetCount: 4, bonusAmountIdr: 120000, extraPerUnitIdr: 30000, minSlaPct: 95, status: 'Aktif' },
  { id: 'tbr-isn-mnt-w', corporateSchemaId: 'corp-comp-nusantara', corporateName: 'PT ISP Nusantara', taskType: 'Maintenance', period: 'Mingguan', targetCount: 18, bonusAmountIdr: 450000, extraPerUnitIdr: 35000, minSlaPct: 95, status: 'Aktif' },
  { id: 'tbr-isn-mnt-m', corporateSchemaId: 'corp-comp-nusantara', corporateName: 'PT ISP Nusantara', taskType: 'Maintenance', period: 'Bulanan', targetCount: 65, bonusAmountIdr: 1500000, extraPerUnitIdr: 40000, minSlaPct: 95, status: 'Aktif' },

  { id: 'tbr-isn-srv-d', corporateSchemaId: 'corp-comp-nusantara', corporateName: 'PT ISP Nusantara', taskType: 'Survey', period: 'Harian', targetCount: 5, bonusAmountIdr: 100000, extraPerUnitIdr: 20000, minSlaPct: 92, status: 'Aktif' },
  { id: 'tbr-isn-srv-w', corporateSchemaId: 'corp-comp-nusantara', corporateName: 'PT ISP Nusantara', taskType: 'Survey', period: 'Mingguan', targetCount: 24, bonusAmountIdr: 400000, extraPerUnitIdr: 25000, minSlaPct: 92, status: 'Aktif' },
  { id: 'tbr-isn-srv-m', corporateSchemaId: 'corp-comp-nusantara', corporateName: 'PT ISP Nusantara', taskType: 'Survey', period: 'Bulanan', targetCount: 90, bonusAmountIdr: 1250000, extraPerUnitIdr: 30000, minSlaPct: 94, status: 'Aktif' },

  // GlobalNet ISP — Skema Kontrak CTR-2026-008
  { id: 'tbr-gln-pem-d', corporateSchemaId: 'corp-comp-globalnet', corporateName: 'GlobalNet ISP', taskType: 'Pemasangan', period: 'Harian', targetCount: 3, bonusAmountIdr: 180000, extraPerUnitIdr: 55000, minSlaPct: 96, status: 'Aktif' },
  { id: 'tbr-gln-pem-w', corporateSchemaId: 'corp-comp-globalnet', corporateName: 'GlobalNet ISP', taskType: 'Pemasangan', period: 'Mingguan', targetCount: 16, bonusAmountIdr: 720000, extraPerUnitIdr: 65000, minSlaPct: 96, status: 'Aktif' },
  { id: 'tbr-gln-pem-m', corporateSchemaId: 'corp-comp-globalnet', corporateName: 'GlobalNet ISP', taskType: 'Pemasangan', period: 'Bulanan', targetCount: 60, bonusAmountIdr: 2500000, extraPerUnitIdr: 75000, minSlaPct: 97, status: 'Aktif' },
  { id: 'tbr-gln-mnt-d', corporateSchemaId: 'corp-comp-globalnet', corporateName: 'GlobalNet ISP', taskType: 'Maintenance', period: 'Harian', targetCount: 4, bonusAmountIdr: 140000, extraPerUnitIdr: 35000, minSlaPct: 95, status: 'Aktif' },
  { id: 'tbr-gln-mnt-w', corporateSchemaId: 'corp-comp-globalnet', corporateName: 'GlobalNet ISP', taskType: 'Maintenance', period: 'Mingguan', targetCount: 20, bonusAmountIdr: 550000, extraPerUnitIdr: 40000, minSlaPct: 95, status: 'Aktif' },
  { id: 'tbr-gln-mnt-m', corporateSchemaId: 'corp-comp-globalnet', corporateName: 'GlobalNet ISP', taskType: 'Maintenance', period: 'Bulanan', targetCount: 70, bonusAmountIdr: 1800000, extraPerUnitIdr: 45000, minSlaPct: 96, status: 'Aktif' },
  { id: 'tbr-gln-srv-d', corporateSchemaId: 'corp-comp-globalnet', corporateName: 'GlobalNet ISP', taskType: 'Survey', period: 'Harian', targetCount: 5, bonusAmountIdr: 115000, extraPerUnitIdr: 25000, minSlaPct: 94, status: 'Aktif' },
  { id: 'tbr-gln-srv-w', corporateSchemaId: 'corp-comp-globalnet', corporateName: 'GlobalNet ISP', taskType: 'Survey', period: 'Mingguan', targetCount: 25, bonusAmountIdr: 475000, extraPerUnitIdr: 30000, minSlaPct: 94, status: 'Aktif' },
  { id: 'tbr-gln-srv-m', corporateSchemaId: 'corp-comp-globalnet', corporateName: 'GlobalNet ISP', taskType: 'Survey', period: 'Bulanan', targetCount: 95, bonusAmountIdr: 1450000, extraPerUnitIdr: 35000, minSlaPct: 95, status: 'Aktif' },

  // MetroLink — Skema Kontrak CTR-2026-014
  { id: 'tbr-mtr-pem-d', corporateSchemaId: 'corp-comp-metrolink', corporateName: 'MetroLink', taskType: 'Pemasangan', period: 'Harian', targetCount: 2, bonusAmountIdr: 110000, extraPerUnitIdr: 40000, minSlaPct: 94, status: 'Aktif' },
  { id: 'tbr-mtr-pem-w', corporateSchemaId: 'corp-comp-metrolink', corporateName: 'MetroLink', taskType: 'Pemasangan', period: 'Mingguan', targetCount: 12, bonusAmountIdr: 480000, extraPerUnitIdr: 45000, minSlaPct: 94, status: 'Aktif' },
  { id: 'tbr-mtr-pem-m', corporateSchemaId: 'corp-comp-metrolink', corporateName: 'MetroLink', taskType: 'Pemasangan', period: 'Bulanan', targetCount: 45, bonusAmountIdr: 1650000, extraPerUnitIdr: 55000, minSlaPct: 95, status: 'Aktif' },
  { id: 'tbr-mtr-mnt-d', corporateSchemaId: 'corp-comp-metrolink', corporateName: 'MetroLink', taskType: 'Maintenance', period: 'Harian', targetCount: 3, bonusAmountIdr: 95000, extraPerUnitIdr: 25000, minSlaPct: 93, status: 'Aktif' },
  { id: 'tbr-mtr-mnt-w', corporateSchemaId: 'corp-comp-metrolink', corporateName: 'MetroLink', taskType: 'Maintenance', period: 'Mingguan', targetCount: 15, bonusAmountIdr: 375000, extraPerUnitIdr: 30000, minSlaPct: 94, status: 'Aktif' },
  { id: 'tbr-mtr-mnt-m', corporateSchemaId: 'corp-comp-metrolink', corporateName: 'MetroLink', taskType: 'Maintenance', period: 'Bulanan', targetCount: 55, bonusAmountIdr: 1200000, extraPerUnitIdr: 35000, minSlaPct: 94, status: 'Aktif' },
  { id: 'tbr-mtr-srv-d', corporateSchemaId: 'corp-comp-metrolink', corporateName: 'MetroLink', taskType: 'Survey', period: 'Harian', targetCount: 4, bonusAmountIdr: 85000, extraPerUnitIdr: 20000, minSlaPct: 92, status: 'Aktif' },
  { id: 'tbr-mtr-srv-w', corporateSchemaId: 'corp-comp-metrolink', corporateName: 'MetroLink', taskType: 'Survey', period: 'Mingguan', targetCount: 20, bonusAmountIdr: 350000, extraPerUnitIdr: 22000, minSlaPct: 92, status: 'Aktif' },
  { id: 'tbr-mtr-srv-m', corporateSchemaId: 'corp-comp-metrolink', corporateName: 'MetroLink', taskType: 'Survey', period: 'Bulanan', targetCount: 75, bonusAmountIdr: 1100000, extraPerUnitIdr: 25000, minSlaPct: 93, status: 'Aktif' },

  // CitraNet — Skema Kontrak CTR-2026-019
  { id: 'tbr-ctn-pem-d', corporateSchemaId: 'corp-comp-citranet', corporateName: 'CitraNet', taskType: 'Pemasangan', period: 'Harian', targetCount: 3, bonusAmountIdr: 140000, extraPerUnitIdr: 45000, minSlaPct: 95, status: 'Aktif' },
  { id: 'tbr-ctn-pem-w', corporateSchemaId: 'corp-comp-citranet', corporateName: 'CitraNet', taskType: 'Pemasangan', period: 'Mingguan', targetCount: 14, bonusAmountIdr: 560000, extraPerUnitIdr: 50000, minSlaPct: 95, status: 'Aktif' },
  { id: 'tbr-ctn-pem-m', corporateSchemaId: 'corp-comp-citranet', corporateName: 'CitraNet', taskType: 'Pemasangan', period: 'Bulanan', targetCount: 52, bonusAmountIdr: 1850000, extraPerUnitIdr: 60000, minSlaPct: 96, status: 'Aktif' },
  { id: 'tbr-ctn-mnt-d', corporateSchemaId: 'corp-comp-citranet', corporateName: 'CitraNet', taskType: 'Maintenance', period: 'Harian', targetCount: 4, bonusAmountIdr: 115000, extraPerUnitIdr: 28000, minSlaPct: 94, status: 'Aktif' },
  { id: 'tbr-ctn-mnt-w', corporateSchemaId: 'corp-comp-citranet', corporateName: 'CitraNet', taskType: 'Maintenance', period: 'Mingguan', targetCount: 16, bonusAmountIdr: 420000, extraPerUnitIdr: 32000, minSlaPct: 95, status: 'Aktif' },
  { id: 'tbr-ctn-mnt-m', corporateSchemaId: 'corp-comp-citranet', corporateName: 'CitraNet', taskType: 'Maintenance', period: 'Bulanan', targetCount: 60, bonusAmountIdr: 1400000, extraPerUnitIdr: 38000, minSlaPct: 95, status: 'Aktif' },
  { id: 'tbr-ctn-srv-d', corporateSchemaId: 'corp-comp-citranet', corporateName: 'CitraNet', taskType: 'Survey', period: 'Harian', targetCount: 5, bonusAmountIdr: 95000, extraPerUnitIdr: 20000, minSlaPct: 93, status: 'Aktif' },
  { id: 'tbr-ctn-srv-w', corporateSchemaId: 'corp-comp-citranet', corporateName: 'CitraNet', taskType: 'Survey', period: 'Mingguan', targetCount: 22, bonusAmountIdr: 380000, extraPerUnitIdr: 24000, minSlaPct: 93, status: 'Aktif' },
  { id: 'tbr-ctn-srv-m', corporateSchemaId: 'corp-comp-citranet', corporateName: 'CitraNet', taskType: 'Survey', period: 'Bulanan', targetCount: 80, bonusAmountIdr: 1180000, extraPerUnitIdr: 28000, minSlaPct: 94, status: 'Aktif' },
];

export const DEFAULT_TECH_TASK_COUNTS: TechnicianTaskCounts = {
  pemasangan: { daily: 2, weekly: 14, monthly: 52 },
  maintenance: { daily: 3, weekly: 18, monthly: 62 },
  survey: { daily: 4, weekly: 23, monthly: 88 },
};

export const CORP_COMP_STORAGE_KEY = 'agentzy_corp_comp_schemas_v1';
export const TECH_BONUS_STORAGE_KEY = 'agentzy_tech_bonus_rules_v1';
export const COMPENSATION_STORAGE_EVENT = 'agentzy:compensation-updated';

export function loadCorporateCompensationSchemas(): CorporateCompensationSchema[] {
  if (typeof window === 'undefined') return INITIAL_CORPORATE_COMPENSATION_SCHEMAS;
  try {
    const raw = window.localStorage.getItem(CORP_COMP_STORAGE_KEY);
    if (!raw) return INITIAL_CORPORATE_COMPENSATION_SCHEMAS;
    const parsed = JSON.parse(raw) as CorporateCompensationSchema[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CORPORATE_COMPENSATION_SCHEMAS;
  } catch {
    return INITIAL_CORPORATE_COMPENSATION_SCHEMAS;
  }
}

export function saveCorporateCompensationSchemas(schemas: CorporateCompensationSchema[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CORP_COMP_STORAGE_KEY, JSON.stringify(schemas));
    window.dispatchEvent(new CustomEvent(COMPENSATION_STORAGE_EVENT));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadTechnicianBonusRules(): TechnicianBonusRule[] {
  if (typeof window === 'undefined') return INITIAL_TECH_BONUS_RULES;
  try {
    const raw = window.localStorage.getItem(TECH_BONUS_STORAGE_KEY);
    if (!raw) return INITIAL_TECH_BONUS_RULES;
    const parsed = JSON.parse(raw) as TechnicianBonusRule[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_TECH_BONUS_RULES;
  } catch {
    return INITIAL_TECH_BONUS_RULES;
  }
}

export function saveTechnicianBonusRules(rules: TechnicianBonusRule[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TECH_BONUS_STORAGE_KEY, JSON.stringify(rules));
    window.dispatchEvent(new CustomEvent(COMPENSATION_STORAGE_EVENT));
  } catch {
    // Ignore storage quota errors
  }
}

export function mapWoTypeToBonusCategory(
  woType: 'Instalasi Baru' | 'Maintenance' | 'Troubleshooting' | 'Survey' | string
): TechnicianTaskCategory {
  if (woType === 'Instalasi Baru' || woType === 'Pemasangan') return 'Pemasangan';
  if (woType === 'Survey') return 'Survey';
  return 'Maintenance';
}

export function matchSalesTierBracket(
  tiers: SalesTierBracket[],
  combinedSA: number
): SalesTierBracket {
  const sorted = [...tiers].sort((a, b) => a.minSA - b.minSA);
  for (const tier of sorted) {
    const upperOk = tier.maxSA === null || combinedSA <= tier.maxSA;
    if (combinedSA >= tier.minSA && upperOk) {
      return tier;
    }
  }
  return (
    sorted[sorted.length - 1] ?? {
      id: 'fallback-tier',
      label: 'Standard',
      minSA: 0,
      maxSA: null,
      feePerSA: 100000,
      multiplier: 1,
      tierBonusIdr: 0,
    }
  );
}

export function calculateCorporateSalesAffiliatePayroll(params: {
  schema: CorporateCompensationSchema;
  grade: SalesGradeKey;
  personalSA: number;
  affiliateSA: number;
}): CorporateSalesAffiliateBreakdown {
  const { schema, grade } = params;
  const personalSA = Math.max(0, params.personalSA);
  const affiliateSA = Math.max(0, params.affiliateSA);
  const combinedSA = personalSA + affiliateSA;

  const affiliateSplitPct = schema.salesConfig.affiliateSplitPct;
  const salesIncrementalSplitPct = schema.salesConfig.salesIncrementalSplitPct;

  const affiliateShareSA = Number(((affiliateSA * affiliateSplitPct) / 100).toFixed(2));
  const salesIncrementalSA = Number(((affiliateSA * salesIncrementalSplitPct) / 100).toFixed(2));
  const salesAttributedTotalSA = Number((personalSA + salesIncrementalSA).toFixed(2));

  const matchedTier = matchSalesTierBracket(schema.salesConfig.tiers, combinedSA);

  const baseSalaryIdr = schema.salesConfig.baseSalaryIdr;
  const operationalAllowanceIdr = schema.salesConfig.operationalAllowanceIdr;
  const gradeBonusIdr = schema.salesConfig.gradeBonus[grade] ?? 0;
  const tierBonusIdr = matchedTier.tierBonusIdr;
  const salesCommissionIdr = Math.round(salesAttributedTotalSA * matchedTier.feePerSA);

  const salesTotalTakeHomeIdr =
    baseSalaryIdr + operationalAllowanceIdr + gradeBonusIdr + tierBonusIdr + salesCommissionIdr;
  const affiliatePayoutIdr = Math.round(affiliateShareSA * schema.salesConfig.affiliateFeePerSAIdr);
  const grossCombinedPayoutIdr = salesTotalTakeHomeIdr + affiliatePayoutIdr;

  return {
    corporateName: schema.corporateName,
    contractNumber: schema.contractNumber,
    grade,
    personalSA,
    affiliateSA,
    combinedSA,
    affiliateSplitPct,
    salesIncrementalSplitPct,
    affiliateShareSA,
    salesIncrementalSA,
    salesAttributedTotalSA,
    matchedTier,
    baseSalaryIdr,
    operationalAllowanceIdr,
    gradeBonusIdr,
    tierBonusIdr,
    salesCommissionIdr,
    salesTotalTakeHomeIdr,
    affiliatePayoutIdr,
    grossCombinedPayoutIdr,
  };
}

export function calculateTechnicianCompensation(params: {
  schema: CorporateCompensationSchema;
  bonusRules: TechnicianBonusRule[];
  completedCounts: TechnicianTaskCounts;
  slaPct: number;
}): TechnicianCompensationBreakdown {
  const { schema, bonusRules, completedCounts, slaPct } = params;
  const cfg = schema.technicianConfig;

  const activeRules = bonusRules.filter(
    (r) => r.corporateSchemaId === schema.id && r.status === 'Aktif'
  );

  const pemasanganCount = completedCounts.pemasangan.monthly;
  const maintenanceCount = completedCounts.maintenance.monthly;
  const surveyCount = completedCounts.survey.monthly;

  const pemasanganFeeIdr = pemasanganCount * cfg.feePemasanganIdr;
  const maintenanceFeeIdr = maintenanceCount * cfg.feeMaintenanceIdr;
  const surveyFeeIdr = surveyCount * cfg.feeSurveyIdr;
  const totalTaskFeesIdr = pemasanganFeeIdr + maintenanceFeeIdr + surveyFeeIdr;

  const slaQualified = slaPct >= cfg.minSlaPctForBonus;
  const slaComplianceBonusIdr = slaQualified ? cfg.slaComplianceBonusIdr : 0;

  const getActual = (taskType: TechnicianTaskCategory, period: BonusPeriodType): number => {
    const bucket =
      taskType === 'Pemasangan'
        ? completedCounts.pemasangan
        : taskType === 'Maintenance'
          ? completedCounts.maintenance
          : completedCounts.survey;
    if (period === 'Harian') return bucket.daily;
    if (period === 'Mingguan') return bucket.weekly;
    return bucket.monthly;
  };

  const bonusEvaluations: EvaluatedTechBonusItem[] = activeRules.map((rule) => {
    const actualCount = Math.max(0, getActual(rule.taskType, rule.period));
    const progressPct =
      rule.targetCount > 0 ? Math.min(100, Math.round((actualCount / rule.targetCount) * 100)) : 100;
    const ruleSlaOk = slaPct >= rule.minSlaPct;
    const achieved = actualCount >= rule.targetCount && ruleSlaOk;
    const extraUnits = achieved ? Math.max(0, actualCount - rule.targetCount) : 0;
    const earnedBonusIdr = achieved
      ? rule.bonusAmountIdr + extraUnits * rule.extraPerUnitIdr
      : 0;

    return {
      rule,
      actualCount,
      progressPct,
      achieved,
      slaQualified: ruleSlaOk,
      extraUnits,
      earnedBonusIdr,
    };
  });

  const totalDailyBonusIdr = bonusEvaluations
    .filter((b) => b.rule.period === 'Harian')
    .reduce((sum, b) => sum + b.earnedBonusIdr, 0);
  const totalWeeklyBonusIdr = bonusEvaluations
    .filter((b) => b.rule.period === 'Mingguan')
    .reduce((sum, b) => sum + b.earnedBonusIdr, 0);
  const totalMonthlyBonusIdr = bonusEvaluations
    .filter((b) => b.rule.period === 'Bulanan')
    .reduce((sum, b) => sum + b.earnedBonusIdr, 0);

  const totalTargetBonusIdr = totalDailyBonusIdr + totalWeeklyBonusIdr + totalMonthlyBonusIdr;
  const totalTakeHomePayIdr =
    cfg.baseSalaryIdr +
    cfg.fieldAllowanceIdr +
    totalTaskFeesIdr +
    slaComplianceBonusIdr +
    totalTargetBonusIdr;

  return {
    corporateName: schema.corporateName,
    contractNumber: schema.contractNumber,
    baseSalaryIdr: cfg.baseSalaryIdr,
    fieldAllowanceIdr: cfg.fieldAllowanceIdr,
    taskFeesBreakdown: {
      pemasanganCount,
      pemasanganFeeIdr,
      maintenanceCount,
      maintenanceFeeIdr,
      surveyCount,
      surveyFeeIdr,
      totalTaskFeesIdr,
    },
    slaComplianceBonusIdr,
    slaQualified,
    bonusEvaluations,
    totalDailyBonusIdr,
    totalWeeklyBonusIdr,
    totalMonthlyBonusIdr,
    totalTargetBonusIdr,
    totalTakeHomePayIdr,
  };
}
