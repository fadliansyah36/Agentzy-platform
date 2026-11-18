import type { AnalyticsFilterState, CorporateTenant } from '../lib/corporate-types';

/** API-backed service boundary. Until a domain endpoint is provisioned, collections remain empty. */
export const corporatePortalService = {
  getExecutiveOverviewSnapshot(tenant: CorporateTenant) {
    return {
      tenant,
      humanWorkers: 0,
      staffSalesCount: 0,
      affiliateCount: 0,
      technicianCount: 0,
      humanDeltaPct: 0,
      aiWorkers: 0,
      aiDeltaPct: 0,
      leadsCount: 0,
      leadsDeltaPct: 0,
      ordersCount: 0,
      ordersDeltaPct: 0,
      kpiTarget: 0,
      kpiActual: 0,
      kpiAchievementPct: 0,
      productivityPct: 0,
      slaPct: 0,
      corporateRevenueIdr: 0,
      agentzyServiceFeeIdr: 0,
      aiCreditsBalance: 0,
      estimatedTokens: 0,
      contractExpiryDays: 0,
      sourceFreshness: { status: 'Belum tersedia', computedAt: 'Belum ada data domain' },
    };
  },

  getAnalyticsSeries(_filter: AnalyticsFilterState): Array<{
    month: string;
    aktivasi: number;
    target: number;
    order: number;
  }> {
    return [];
  },

  getInitialDomainCollections() {
    return {
      aiWorkers: [],
      aiRuns: [],
      workOrders: [],
      invoices: [],
      payments: [],
      creditTransactions: [],
      users: [],
      alerts: [],
      integrations: [],
      auditLogs: [],
      reportHistory: [],
    };
  },
};
