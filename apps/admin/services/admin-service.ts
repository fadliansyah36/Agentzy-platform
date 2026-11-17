import {
  INITIAL_ADMIN_AI_WORKERS,
  INITIAL_ADMIN_TENANTS,
  INITIAL_ADMIN_WORKFLOWS,
  INITIAL_AUDIT_LOGS,
  INITIAL_BREAK_GLASS_REQUESTS,
  INITIAL_COMMISSION_SCHEMES,
  INITIAL_CONTRACTS,
  INITIAL_COOPERATION_POLICIES,
  INITIAL_CREDIT_LEDGER,
  INITIAL_CREDIT_PRICING_RULES,
  INITIAL_CREDIT_TOPUP_PACKAGES,
  INITIAL_DSR_REQUESTS,
  INITIAL_FEATURE_FLAGS,
  INITIAL_FINANCE_RECONCILIATIONS,
  INITIAL_HUMAN_STAFF,
  INITIAL_INCIDENTS,
  INITIAL_INDUSTRIES,
  INITIAL_INTEGRATIONS,
  INITIAL_ISP_PROVIDERS,
  INITIAL_KNOWLEDGE_SOURCES,
  INITIAL_LLM_PROVIDERS,
  INITIAL_MASTER_PRODUCTS,
  INITIAL_MASTER_SERVICES,
  INITIAL_MEMORY_LAYERS,
  INITIAL_MEMORY_POLICY,
  INITIAL_MODEL_REGISTRY,
  INITIAL_ORG_UNITS,
  INITIAL_PLATFORM_INVOICES,
  INITIAL_PLATFORM_USERS,
  INITIAL_RBAC_ROLES,
  INITIAL_ROUTING_RULES,
  INITIAL_SKILLS,
  INITIAL_TOOLS,
  INITIAL_VENDORS,
  INITIAL_WEBHOOK_LOGS,
  INITIAL_WORKFLOW_APPROVALS,
  INITIAL_WORKFLOW_RUNS,
} from '../lib/admin-data';

export const adminPortalService = {
  getInitialCollections() {
    return {
      tenants: INITIAL_ADMIN_TENANTS,
      providers: INITIAL_ISP_PROVIDERS,
      industries: INITIAL_INDUSTRIES,
      services: INITIAL_MASTER_SERVICES,
      products: INITIAL_MASTER_PRODUCTS,
      cooperationPolicies: INITIAL_COOPERATION_POLICIES,
      orgUnits: INITIAL_ORG_UNITS,
      users: INITIAL_PLATFORM_USERS,
      roles: INITIAL_RBAC_ROLES,
      staff: INITIAL_HUMAN_STAFF,
      aiWorkers: INITIAL_ADMIN_AI_WORKERS,
      llmProviders: INITIAL_LLM_PROVIDERS,
      models: INITIAL_MODEL_REGISTRY,
      routingRules: INITIAL_ROUTING_RULES,
      skills: INITIAL_SKILLS,
      tools: INITIAL_TOOLS,
      memoryPolicy: INITIAL_MEMORY_POLICY,
      memoryLayers: INITIAL_MEMORY_LAYERS,
      knowledgeSources: INITIAL_KNOWLEDGE_SOURCES,
      workflows: INITIAL_ADMIN_WORKFLOWS,
      workflowRuns: INITIAL_WORKFLOW_RUNS,
      workflowApprovals: INITIAL_WORKFLOW_APPROVALS,
      creditPricingRules: INITIAL_CREDIT_PRICING_RULES,
      creditLedger: INITIAL_CREDIT_LEDGER,
      creditTopUpPackages: INITIAL_CREDIT_TOPUP_PACKAGES,
      invoices: INITIAL_PLATFORM_INVOICES,
      reconciliations: INITIAL_FINANCE_RECONCILIATIONS,
      contracts: INITIAL_CONTRACTS,
      commissionSchemes: INITIAL_COMMISSION_SCHEMES,
      integrations: INITIAL_INTEGRATIONS,
      webhookLogs: INITIAL_WEBHOOK_LOGS,
      breakGlassRequests: INITIAL_BREAK_GLASS_REQUESTS,
      featureFlags: INITIAL_FEATURE_FLAGS,
      auditLogs: INITIAL_AUDIT_LOGS,
      incidents: INITIAL_INCIDENTS,
      dsrRequests: INITIAL_DSR_REQUESTS,
      vendors: INITIAL_VENDORS,
    };
  },

  simulateModelRouting(params: {
    taskType: string;
    sensitivity: 'Internal' | 'Confidential' | 'Restricted';
    maxLatencyMs: number;
  }) {
    if (params.sensitivity === 'Restricted') {
      return {
        chosenModel: 'Gemini 2.5 Pro (Asia-Southeast1)',
        fallbackModel: 'Claude 4.5 (Enterprise DPA)',
        score: 94.6,
        reason:
          'Data Restricted wajib memenuhi residensi regional Asia-Southeast1 & zero-training policy.',
      };
    }
    if (params.taskType.includes('Analitik') || params.taskType.includes('Audit')) {
      return {
        chosenModel: 'Claude 4.5 (Reasoning)',
        fallbackModel: 'GPT-5.1',
        score: 96.2,
        reason:
          'Skor reasoning tertinggi untuk analisis kepatuhan, kontrak, dan validasi anomali.',
      };
    }
    if (params.taskType.includes('Multimodal') || params.maxLatencyMs < 600) {
      return {
        chosenModel: 'Gemini 2.5 Pro',
        fallbackModel: 'GPT-5.1',
        score: 95.4,
        reason:
          'Context window 1M & latensi terendah (490ms) untuk bukti foto lapangan & multimodal.',
      };
    }
    return {
      chosenModel: 'GPT-5.1 (Inference)',
      fallbackModel: 'Gemini 2.5 Pro',
      score: 95.8,
      reason:
        'Keseimbangan optimal antara kualitas penawaran Sales, tool calling, dan biaya kredit.',
    };
  },

  calculateDeterministicCommissionPreview(params: {
    personalSA: number;
    affiliateSA: number;
    grade: 'OJT' | 'Pro' | 'Elite';
  }) {
    const personal = Math.max(0, params.personalSA);
    const affiliate = Math.max(0, params.affiliateSA);
    const combined = personal + affiliate;
    const affiliateShareSA = Number((affiliate * 0.6).toFixed(2));
    const salesIncrementalSA = Number((affiliate * 0.4).toFixed(2));
    const salesAttributedTotal = Number((personal + salesIncrementalSA).toFixed(2));

    let tierFeePerSA = 80000;
    let multiplier = 0;
    if (combined >= 50) {
      tierFeePerSA = 275000;
      multiplier = 4.65;
    } else if (combined >= 40) {
      tierFeePerSA = 250000;
      multiplier = 4.5;
    } else if (combined >= 30) {
      tierFeePerSA = 225000;
      multiplier = 4.25;
    } else if (combined >= 14) {
      tierFeePerSA = 200000;
      multiplier = 4;
    } else if (combined >= 10) {
      tierFeePerSA = 175000;
      multiplier = 2;
    } else if (combined >= 7) {
      tierFeePerSA = 150000;
      multiplier = 1.5;
    }

    const salesEstimatedIdr = Math.round(salesAttributedTotal * tierFeePerSA);
    const affiliateEstimatedIdr = Math.round(affiliateShareSA * 125000);

    return {
      personal,
      affiliate,
      combined,
      affiliateShareSA,
      salesIncrementalSA,
      salesAttributedTotal,
      tierFeePerSA,
      multiplier,
      salesEstimatedIdr,
      affiliateEstimatedIdr,
      grade: params.grade,
    };
  },
};
