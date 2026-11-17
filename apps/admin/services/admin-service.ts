export const adminPortalService = {
  getInitialCollections() {
    return {
      tenants: [], providers: [], industries: [], services: [], products: [],
      cooperationPolicies: [], orgUnits: [], users: [], roles: [], staff: [],
      aiWorkers: [], llmProviders: [], models: [], routingRules: [], skills: [],
      tools: [], memoryPolicy: null, memoryLayers: [], knowledgeSources: [],
      workflows: [], workflowRuns: [], workflowApprovals: [], creditPricingRules: [],
      creditLedger: [], creditTopUpPackages: [], invoices: [], reconciliations: [],
      contracts: [], commissionSchemes: [], integrations: [], webhookLogs: [],
      breakGlassRequests: [], featureFlags: [], auditLogs: [], incidents: [],
      dsrRequests: [], vendors: [],
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
