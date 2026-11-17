import {
  BUSINESS_TREND_SERIES,
  CORPORATE_TENANTS,
  INITIAL_AI_RUNS,
  INITIAL_AI_WORKERS,
  INITIAL_AUDIT_LOGS,
  INITIAL_CORPORATE_ALERTS,
  INITIAL_CORPORATE_USERS,
  INITIAL_CORP_WORK_ORDERS,
  INITIAL_CREDIT_TRANSACTIONS,
  INITIAL_INTEGRATIONS,
  INITIAL_INVOICES,
  INITIAL_PAYMENTS,
  INITIAL_REPORT_HISTORY,
} from '../lib/corporate-data';
import type {
  AnalyticsFilterState,
  CorporateTenant,
} from '../lib/corporate-types';

/**
 * Typed service adapter boundary for Corporate/ISP Portal.
 * In production monorepo deployment, each method forwards authenticated requests
 * with tenant resolution headers to FastAPI (`/api/v1/corporate/*`).
 */
export const corporatePortalService = {
  listTenants(): CorporateTenant[] {
    return CORPORATE_TENANTS;
  },

  getExecutiveOverviewSnapshot(tenantId: string) {
    const tenant =
      CORPORATE_TENANTS.find((t) => t.id === tenantId) ?? CORPORATE_TENANTS[0];
    return {
      tenant,
      humanWorkers: 1240,
      staffSalesCount: 420,
      affiliateCount: 480,
      technicianCount: 340,
      humanDeltaPct: 8,
      aiWorkers: 24,
      aiDeltaPct: 20,
      leadsCount: 8920,
      leadsDeltaPct: 12,
      ordersCount: 3280,
      ordersDeltaPct: 16,
      kpiTarget: 3000,
      kpiActual: 3280,
      kpiAchievementPct: 109,
      productivityPct: 118,
      slaPct: 98.6,
      corporateRevenueIdr: 5420000000,
      agentzyServiceFeeIdr: 412000000,
      aiCreditsBalance: 1250000,
      estimatedTokens: 312500,
      contractExpiryDays: tenant.contractExpiryDays,
      sourceFreshness: {
        status: 'near_realtime',
        computedAt: '17 Nov 2026 · 10:15 WIB',
      },
    };
  },

  getAnalyticsSeries(filter: AnalyticsFilterState) {
    const multiplier =
      filter.region === 'Semua Wilayah'
        ? 1
        : filter.region === 'Jabodetabek'
          ? 0.34
          : filter.region === 'Jawa Barat'
            ? 0.24
            : 0.21;

    return BUSINESS_TREND_SERIES.map((row) => ({
      ...row,
      aktivasi: Math.round(row.aktivasi * multiplier),
      target: Math.round(row.target * multiplier),
      order: Math.round(row.order * multiplier),
    }));
  },

  getInitialDomainCollections() {
    return {
      aiWorkers: INITIAL_AI_WORKERS,
      aiRuns: INITIAL_AI_RUNS,
      workOrders: INITIAL_CORP_WORK_ORDERS,
      invoices: INITIAL_INVOICES,
      payments: INITIAL_PAYMENTS,
      creditTransactions: INITIAL_CREDIT_TRANSACTIONS,
      users: INITIAL_CORPORATE_USERS,
      alerts: INITIAL_CORPORATE_ALERTS,
      integrations: INITIAL_INTEGRATIONS,
      auditLogs: INITIAL_AUDIT_LOGS,
      reportHistory: INITIAL_REPORT_HISTORY,
    };
  },
};
