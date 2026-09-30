export interface ProjectProfileInput {
  industry: string;
  product: string;
  manufacturingProcess: string;
  location: string;
  isMidc: boolean;
  fixedCapitalInvestmentCr: number;
  landAreaSqm: number;
  builtUpAreaSqm: number;
  directWorkers: number;
  contractWorkers: number;
  powerKva: number;
  waterKld: number;
  hasBoiler: boolean;
  boilerCapacityTph?: number;
  hasHazardousProcess: boolean;
  storageCapacityTons: number;
  pollutionCategory: string;
  hasHazardousWaste: boolean;
  waterDischargeType: string;
}

export interface RuleWhenCondition {
  isMidc?: boolean;
  hasHazardousProcess?: boolean;
  hasBoiler?: boolean;
  hasHazardousWaste?: boolean;
  minTotalWorkers?: number;
  minContractWorkers?: number;
  minPowerKva?: number;
  minStorageCapacityTons?: number;
  minInvestmentCr?: number;
  pollutionCategories?: string[];
  industries?: string[];
  requiresReviewCondition?: string;
  externalAuthorityPortal?: boolean;
  alwaysApplicable?: boolean;
}

export interface RuleRecord {
  ruleId: string;
  approvalRef: string;
  approvalName?: string;
  authority: string;
  stage: string;
  when: RuleWhenCondition;
  triggerFacts: string[];
  whyExplanation: string;
  dependencies: string[];
  parallelWith: string[];
  documents: string[];
  legalBasis: {
    act: string;
    section: string;
    rule: string;
  };
  timeline: {
    published: number;
    unit: string;
    notes?: string;
  };
  observedProcessingInfo?: string;
  renewalInfo?: string;
  escalationMechanism: {
    applicable: boolean;
    act: string;
    section: string;
    appellateAuthority: string;
    summary: string;
  };
  effectiveFrom: string;
  effectiveUntil: string | null;
  sourceCode: string;
  sourceName?: string;
  sourceUrl?: string;
  lastVerified: string;
  verificationStatus: 'VERIFIED' | 'UNDER REVIEW' | 'SYNTHETIC' | 'MOCK' | 'SIMULATION';
  isActive: boolean;
  version: number;
}

export interface RuleEvaluationResult {
  ruleId: string;
  approvalRef: string;
  approvalName: string;
  authority: string;
  stage: string;
  applicabilityStatus: 'REQUIRED' | 'POTENTIAL_REVIEW' | 'EXTERNAL' | 'NOT_APPLICABLE';
  whyApplies: string;
  matchedTriggerFacts: { label: string; value: string }[];
  unmatchedConditions: string[];
  legalBasis: {
    act: string;
    section: string;
    rule: string;
  };
  documents: string[];
  dependencies: string[];
  parallelWith: string[];
  publishedTimeline: string;
  publishedTimelineDays: number;
  observedProcessingInfo: string;
  renewalInfo: string;
  escalationMechanism: {
    applicable: boolean;
    act: string;
    section: string;
    appellateAuthority: string;
    summary: string;
  };
  sourceCode: string;
  sourceName: string;
  sourceUrl: string;
  effectiveFrom: string;
  effectiveUntil: string | null;
  lastVerified: string;
  verificationStatus: string;
  ruleVersion: number;
}

export function isRuleCurrentlyEffective(
  rule: Pick<RuleRecord, 'isActive' | 'effectiveFrom' | 'effectiveUntil'>,
  evaluationDateIso: string = '2026-09-30'
): { effective: boolean; reason?: string } {
  if (!rule.isActive) {
    return { effective: false, reason: 'Rule is marked inactive by administrator.' };
  }
  if (rule.effectiveFrom > evaluationDateIso) {
    return {
      effective: false,
      reason: `Rule is not yet effective (effective from ${rule.effectiveFrom}).`,
    };
  }
  if (rule.effectiveUntil && rule.effectiveUntil < evaluationDateIso) {
    return {
      effective: false,
      reason: `Rule expired on ${rule.effectiveUntil} and cannot be used as a current rule.`,
    };
  }
  return { effective: true };
}

export function evaluateSingleRule(
  rule: RuleRecord,
  facts: ProjectProfileInput,
  evaluationDateIso: string = '2026-09-30'
): RuleEvaluationResult {
  const effectiveness = isRuleCurrentlyEffective(rule, evaluationDateIso);
  const totalWorkers = (facts.directWorkers || 0) + (facts.contractWorkers || 0);
  const matchedTriggerFacts: { label: string; value: string }[] = [];
  const unmatchedConditions: string[] = [];

  if (!effectiveness.effective) {
    return {
      ruleId: rule.ruleId,
      approvalRef: rule.approvalRef,
      approvalName: rule.approvalName || rule.approvalRef,
      authority: rule.authority,
      stage: rule.stage,
      applicabilityStatus: 'NOT_APPLICABLE',
      whyApplies: effectiveness.reason || 'Rule is not currently effective.',
      matchedTriggerFacts: [],
      unmatchedConditions: [effectiveness.reason || 'Rule inactive/expired'],
      legalBasis: rule.legalBasis,
      documents: rule.documents,
      dependencies: rule.dependencies,
      parallelWith: rule.parallelWith,
      publishedTimeline: `${rule.timeline.published} ${rule.timeline.unit}`,
      publishedTimelineDays: Number(rule.timeline.published) || 30,
      observedProcessingInfo: rule.observedProcessingInfo || 'Public dashboard data via MAITRI / department portal',
      renewalInfo: rule.renewalInfo || 'Refer to statutory validity period',
      escalationMechanism: rule.escalationMechanism,
      sourceCode: rule.sourceCode,
      sourceName: rule.sourceName || rule.sourceCode,
      sourceUrl: rule.sourceUrl || 'https://maitri.mahaonline.gov.in',
      effectiveFrom: rule.effectiveFrom,
      effectiveUntil: rule.effectiveUntil,
      lastVerified: rule.lastVerified,
      verificationStatus: rule.verificationStatus,
      ruleVersion: rule.version,
    };
  }

  const w = rule.when;

  if (w.isMidc !== undefined) {
    if (facts.isMidc === w.isMidc) {
      matchedTriggerFacts.push({
        label: 'Industrial Area Type',
        value: facts.isMidc ? 'MIDC Notified Industrial Area' : 'Non-MIDC Area',
      });
    } else {
      unmatchedConditions.push(
        w.isMidc ? 'Requires location inside MIDC Industrial Area' : 'Applies only to Non-MIDC land'
      );
    }
  }

  if (w.hasHazardousProcess !== undefined) {
    if (facts.hasHazardousProcess === w.hasHazardousProcess) {
      matchedTriggerFacts.push({
        label: 'Hazardous Process (First Schedule)',
        value: facts.hasHazardousProcess ? 'Yes (Hazardous Chemical/API Process)' : 'No',
      });
    } else {
      unmatchedConditions.push('Requires Hazardous Process = Yes');
    }
  }

  if (w.hasBoiler !== undefined) {
    if (facts.hasBoiler === w.hasBoiler) {
      matchedTriggerFacts.push({
        label: 'Steam Boiler Installation',
        value: facts.hasBoiler ? `Yes (${facts.boilerCapacityTph || 4.5} TPH)` : 'No',
      });
    } else {
      unmatchedConditions.push('Requires Steam Boiler under Indian Boilers Act, 1923');
    }
  }

  if (w.hasHazardousWaste !== undefined) {
    if (facts.hasHazardousWaste === w.hasHazardousWaste) {
      matchedTriggerFacts.push({
        label: 'Hazardous Waste Generation',
        value: facts.hasHazardousWaste ? 'Yes (Schedule I / II Waste)' : 'No',
      });
    } else {
      unmatchedConditions.push('Requires Hazardous Waste generation');
    }
  }

  if (w.minTotalWorkers !== undefined) {
    if (totalWorkers >= w.minTotalWorkers) {
      matchedTriggerFacts.push({
        label: 'Total Workforce Threshold',
        value: `${totalWorkers} workers (Direct: ${facts.directWorkers}, Contract: ${facts.contractWorkers}) ≥ ${w.minTotalWorkers} threshold`,
      });
    } else {
      unmatchedConditions.push(
        `Total workers (${totalWorkers}) is below statutory threshold of ${w.minTotalWorkers}`
      );
    }
  }

  if (w.minContractWorkers !== undefined) {
    if (facts.contractWorkers >= w.minContractWorkers) {
      matchedTriggerFacts.push({
        label: 'Contract Labour Count',
        value: `${facts.contractWorkers} contract workers ≥ ${w.minContractWorkers} threshold (Maharashtra CLRA Amendment)`,
      });
    } else {
      unmatchedConditions.push(
        `Contract workers (${facts.contractWorkers}) is below threshold of ${w.minContractWorkers}`
      );
    }
  }

  if (w.minPowerKva !== undefined) {
    if (facts.powerKva >= w.minPowerKva) {
      matchedTriggerFacts.push({
        label: 'Electrical Sanctioned Load',
        value: `${facts.powerKva} kVA ≥ ${w.minPowerKva} kVA HT Inspector threshold`,
      });
    } else {
      unmatchedConditions.push(
        `Electrical load (${facts.powerKva} kVA) is below ${w.minPowerKva} kVA threshold`
      );
    }
  }

  if (w.minStorageCapacityTons !== undefined) {
    if (facts.storageCapacityTons >= w.minStorageCapacityTons) {
      matchedTriggerFacts.push({
        label: 'Chemical / Solvent Storage',
        value: `${facts.storageCapacityTons} MT ≥ ${w.minStorageCapacityTons} MT threshold`,
      });
    } else {
      unmatchedConditions.push(
        `Storage capacity (${facts.storageCapacityTons} MT) is below ${w.minStorageCapacityTons} MT threshold`
      );
    }
  }

  if (w.pollutionCategories && w.pollutionCategories.length > 0) {
    if (w.pollutionCategories.includes(facts.pollutionCategory.toUpperCase())) {
      matchedTriggerFacts.push({
        label: 'Environmental Category',
        value: `${facts.pollutionCategory.toUpperCase()} Category (${facts.product})`,
      });
    } else {
      unmatchedConditions.push(
        `Pollution category ${facts.pollutionCategory} not in [${w.pollutionCategories.join(', ')}]`
      );
    }
  }

  if (w.alwaysApplicable) {
    matchedTriggerFacts.push({
      label: 'Project Activity',
      value: `${facts.product} (${facts.manufacturingProcess}) in Maharashtra`,
    });
  }

  let applicabilityStatus: RuleEvaluationResult['applicabilityStatus'] = 'REQUIRED';
  if (unmatchedConditions.length > 0) {
    applicabilityStatus = 'NOT_APPLICABLE';
  } else if (w.externalAuthorityPortal) {
    applicabilityStatus = 'EXTERNAL';
  } else if (w.requiresReviewCondition) {
    applicabilityStatus = 'POTENTIAL_REVIEW';
  }

  return {
    ruleId: rule.ruleId,
    approvalRef: rule.approvalRef,
    approvalName: rule.approvalName || rule.approvalRef,
    authority: rule.authority,
    stage: rule.stage,
    applicabilityStatus,
    whyApplies:
      applicabilityStatus === 'NOT_APPLICABLE'
        ? `Not triggered: ${unmatchedConditions.join('; ')}`
        : rule.whyExplanation,
    matchedTriggerFacts,
    unmatchedConditions,
    legalBasis: rule.legalBasis,
    documents: rule.documents,
    dependencies: rule.dependencies,
    parallelWith: rule.parallelWith,
    publishedTimeline: `${rule.timeline.published} ${rule.timeline.unit}`,
    publishedTimelineDays: Number(rule.timeline.published) || 30,
    observedProcessingInfo:
      rule.observedProcessingInfo ||
      'Published under Maharashtra Right to Public Services Act departmental dashboard.',
    renewalInfo: rule.renewalInfo || 'Periodic renewal per statutory rules.',
    escalationMechanism: rule.escalationMechanism,
    sourceCode: rule.sourceCode,
    sourceName: rule.sourceName || rule.sourceCode,
    sourceUrl: rule.sourceUrl || 'https://maitri.mahaonline.gov.in',
    effectiveFrom: rule.effectiveFrom,
    effectiveUntil: rule.effectiveUntil,
    lastVerified: rule.lastVerified,
    verificationStatus: rule.verificationStatus,
    ruleVersion: rule.version,
  };
}

export function evaluateProjectRules(
  rules: RuleRecord[],
  facts: ProjectProfileInput,
  evaluationDateIso: string = '2026-09-30'
): {
  allEvaluations: RuleEvaluationResult[];
  requiredApprovals: RuleEvaluationResult[];
  potentialReviewApprovals: RuleEvaluationResult[];
  externalApprovals: RuleEvaluationResult[];
  notApplicableApprovals: RuleEvaluationResult[];
} {
  // Filter out expired/inactive rules from active evaluation unless no active rule exists for that ref
  const activeEvaluations: RuleEvaluationResult[] = [];
  for (const rule of rules) {
    const effectiveness = isRuleCurrentlyEffective(rule, evaluationDateIso);
    if (!effectiveness.effective) {
      continue;
    }
    activeEvaluations.push(evaluateSingleRule(rule, facts, evaluationDateIso));
  }

  return {
    allEvaluations: activeEvaluations,
    requiredApprovals: activeEvaluations.filter((r) => r.applicabilityStatus === 'REQUIRED'),
    potentialReviewApprovals: activeEvaluations.filter(
      (r) => r.applicabilityStatus === 'POTENTIAL_REVIEW'
    ),
    externalApprovals: activeEvaluations.filter((r) => r.applicabilityStatus === 'EXTERNAL'),
    notApplicableApprovals: activeEvaluations.filter(
      (r) => r.applicabilityStatus === 'NOT_APPLICABLE'
    ),
  };
}

export interface SimulationDiffResult {
  changedFacts: {
    field: string;
    label: string;
    previousValue: string | number | boolean;
    newValue: string | number | boolean;
  }[];
  newlyTriggeredApprovals: RuleEvaluationResult[];
  removedApprovals: RuleEvaluationResult[];
  addedDocuments: string[];
  removedDocuments: string[];
  baselineRequiredCount: number;
  simulatedRequiredCount: number;
  baselineCriticalPathDays: number;
  simulatedCriticalPathDays: number;
  detailedImpacts: {
    approvalRef: string;
    approvalName: string;
    ruleId: string;
    previousStatus: string;
    newStatus: string;
    reason: string;
    timelineImpactDays: number;
  }[];
}

export function runWhatIfSimulation(
  rules: RuleRecord[],
  baselineFacts: ProjectProfileInput,
  simulatedFacts: ProjectProfileInput,
  evaluationDateIso: string = '2026-09-30'
): SimulationDiffResult {
  const baseline = evaluateProjectRules(rules, baselineFacts, evaluationDateIso);
  const simulated = evaluateProjectRules(rules, simulatedFacts, evaluationDateIso);

  const factLabels: Record<keyof ProjectProfileInput, string> = {
    industry: 'Industry Sector',
    product: 'Product Manufactured',
    manufacturingProcess: 'Manufacturing Process',
    location: 'Location / Industrial Estate',
    isMidc: 'MIDC Notified Area',
    fixedCapitalInvestmentCr: 'Fixed Capital Investment (₹ Cr)',
    landAreaSqm: 'Land Area (Sq.m)',
    builtUpAreaSqm: 'Built-up Area (Sq.m)',
    directWorkers: 'Direct Workers',
    contractWorkers: 'Contract Workers',
    powerKva: 'Power Requirement (kVA)',
    waterKld: 'Water Requirement (KLD)',
    hasBoiler: 'Steam Boiler Installed',
    boilerCapacityTph: 'Boiler Capacity (TPH)',
    hasHazardousProcess: 'Hazardous Process (First Schedule)',
    storageCapacityTons: 'Chemical Storage Capacity (MT)',
    pollutionCategory: 'MPCB Pollution Category',
    hasHazardousWaste: 'Hazardous Waste Generation',
    waterDischargeType: 'Effluent / Water Discharge Mode',
  };

  const changedFacts: SimulationDiffResult['changedFacts'] = [];
  (Object.keys(factLabels) as (keyof ProjectProfileInput)[]).forEach((key) => {
    if (baselineFacts[key] !== simulatedFacts[key]) {
      changedFacts.push({
        field: key,
        label: factLabels[key],
        previousValue: baselineFacts[key] ?? '',
        newValue: simulatedFacts[key] ?? '',
      });
    }
  });

  const newlyTriggeredApprovals: RuleEvaluationResult[] = [];
  const removedApprovals: RuleEvaluationResult[] = [];
  const detailedImpacts: SimulationDiffResult['detailedImpacts'] = [];

  for (const simEval of simulated.allEvaluations) {
    const baseEval = baseline.allEvaluations.find((b) => b.ruleId === simEval.ruleId);
    if (!baseEval) continue;

    const wasApplicable = baseEval.applicabilityStatus !== 'NOT_APPLICABLE';
    const isNowApplicable = simEval.applicabilityStatus !== 'NOT_APPLICABLE';

    if (!wasApplicable && isNowApplicable) {
      newlyTriggeredApprovals.push(simEval);
      detailedImpacts.push({
        approvalRef: simEval.approvalRef,
        approvalName: simEval.approvalName,
        ruleId: simEval.ruleId,
        previousStatus: baseEval.applicabilityStatus,
        newStatus: simEval.applicabilityStatus,
        reason: simEval.whyApplies,
        timelineImpactDays: simEval.publishedTimelineDays,
      });
    } else if (wasApplicable && !isNowApplicable) {
      removedApprovals.push(simEval);
      detailedImpacts.push({
        approvalRef: simEval.approvalRef,
        approvalName: simEval.approvalName,
        ruleId: simEval.ruleId,
        previousStatus: baseEval.applicabilityStatus,
        newStatus: simEval.applicabilityStatus,
        reason: simEval.whyApplies,
        timelineImpactDays: -baseEval.publishedTimelineDays,
      });
    }
  }

  const baseDocs = new Set<string>();
  baseline.allEvaluations
    .filter((r) => r.applicabilityStatus !== 'NOT_APPLICABLE')
    .forEach((r) => r.documents.forEach((d) => baseDocs.add(d)));

  const simDocs = new Set<string>();
  simulated.allEvaluations
    .filter((r) => r.applicabilityStatus !== 'NOT_APPLICABLE')
    .forEach((r) => r.documents.forEach((d) => simDocs.add(d)));

  const addedDocuments = [...simDocs].filter((d) => !baseDocs.has(d));
  const removedDocuments = [...baseDocs].filter((d) => !simDocs.has(d));

  const baselineCriticalPathDays = baseline.allEvaluations
    .filter((r) => r.applicabilityStatus !== 'NOT_APPLICABLE')
    .reduce((acc, r) => acc + r.publishedTimelineDays, 0);

  const simulatedCriticalPathDays = simulated.allEvaluations
    .filter((r) => r.applicabilityStatus !== 'NOT_APPLICABLE')
    .reduce((acc, r) => acc + r.publishedTimelineDays, 0);

  return {
    changedFacts,
    newlyTriggeredApprovals,
    removedApprovals,
    addedDocuments,
    removedDocuments,
    baselineRequiredCount: baseline.allEvaluations.filter(
      (r) => r.applicabilityStatus !== 'NOT_APPLICABLE'
    ).length,
    simulatedRequiredCount: simulated.allEvaluations.filter(
      (r) => r.applicabilityStatus !== 'NOT_APPLICABLE'
    ).length,
    baselineCriticalPathDays,
    simulatedCriticalPathDays,
    detailedImpacts,
  };
}

// Legal Clock State Machine
export type LegalClockState =
  | 'DRAFT'
  | 'PREVALIDATED'
  | 'SUBMITTED'
  | 'UNDER_SCRUTINY'
  | 'QUERY_RAISED'
  | 'QUERY_RESPONDED'
  | 'APPROVED'
  | 'REJECTED'
  | 'BREACHED'
  | 'ESCALATION_ELIGIBLE'
  | 'TRANSFERRED'
  | 'DECIDED';

export interface LegalClockSnapshot {
  state: LegalClockState;
  isClockPaused: boolean;
  daysElapsed: number;
  pausedDays: number;
  publishedTimelineDays: number;
  riskState: 'ON_TRACK' | 'NEAR_DEADLINE' | 'CLOCK_PAUSED' | 'BREACHED' | 'COMPLETED';
  decisionReason?: string | null;
}

export function transitionLegalClock(
  current: LegalClockSnapshot,
  action:
    | 'PREVALIDATE'
    | 'SUBMIT'
    | 'START_SCRUTINY'
    | 'RAISE_QUERY'
    | 'RESPOND_QUERY'
    | 'SIMULATE_BREACH'
    | 'MARK_ESCALATION_ELIGIBLE'
    | 'APPROVE'
    | 'REJECT',
  options?: { reason?: string; additionalPausedDays?: number }
): LegalClockSnapshot {
  switch (action) {
    case 'PREVALIDATE':
      return {
        ...current,
        state: 'PREVALIDATED',
        isClockPaused: false,
        riskState: 'ON_TRACK',
      };
    case 'SUBMIT':
      return {
        ...current,
        state: 'SUBMITTED',
        isClockPaused: false,
        riskState: 'ON_TRACK',
      };
    case 'START_SCRUTINY':
      return {
        ...current,
        state: 'UNDER_SCRUTINY',
        isClockPaused: false,
        riskState:
          current.daysElapsed >= current.publishedTimelineDays - 7 ? 'NEAR_DEADLINE' : 'ON_TRACK',
      };
    case 'RAISE_QUERY':
      return {
        ...current,
        state: 'QUERY_RAISED',
        isClockPaused: true,
        riskState: 'CLOCK_PAUSED',
      };
    case 'RESPOND_QUERY': {
      const addedPaused = options?.additionalPausedDays ?? 4;
      const nextPaused = current.pausedDays + addedPaused;
      return {
        ...current,
        state: 'QUERY_RESPONDED',
        isClockPaused: false,
        pausedDays: nextPaused,
        riskState:
          current.daysElapsed >= current.publishedTimelineDays - 7 ? 'NEAR_DEADLINE' : 'ON_TRACK',
      };
    }
    case 'SIMULATE_BREACH': {
      const breachedDays = current.publishedTimelineDays + 4;
      return {
        ...current,
        state: 'BREACHED',
        isClockPaused: false,
        daysElapsed: breachedDays,
        riskState: 'BREACHED',
      };
    }
    case 'MARK_ESCALATION_ELIGIBLE':
      return {
        ...current,
        state: 'ESCALATION_ELIGIBLE',
        isClockPaused: false,
        riskState: 'BREACHED',
      };
    case 'APPROVE':
      if (!options?.reason || !options.reason.trim()) {
        throw new Error('A formal reason is mandatory to approve an application.');
      }
      return {
        ...current,
        state: 'APPROVED',
        isClockPaused: false,
        riskState: 'COMPLETED',
        decisionReason: options.reason.trim(),
      };
    case 'REJECT':
      if (!options?.reason || !options.reason.trim()) {
        throw new Error('A formal reason is mandatory to reject an application.');
      }
      return {
        ...current,
        state: 'REJECTED',
        isClockPaused: false,
        riskState: 'COMPLETED',
        decisionReason: options.reason.trim(),
      };
    default:
      return current;
  }
}

// AI Assistant Source Verification Guard
export interface VerifiedCitation {
  ruleId: string;
  sourceCode: string;
  legalSection: string;
  lastVerified: string;
}

export function verifyAiCitationsAgainstKnowledgeBase(
  citations: VerifiedCitation[],
  validRuleIds: Set<string>,
  validSourceCodes: Set<string>
): { valid: boolean; verifiedCitations: VerifiedCitation[]; fallbackMessage?: string } {
  const verifiedCitations = citations.filter(
    (c) => validRuleIds.has(c.ruleId) && validSourceCodes.has(c.sourceCode)
  );
  if (verifiedCitations.length === 0) {
    return {
      valid: false,
      verifiedCitations: [],
      fallbackMessage:
        "I couldn't verify this from the current regulatory knowledge base.",
    };
  }
  return {
    valid: true,
    verifiedCitations,
  };
}

// Tenant Isolation Guard
export function canAccessTenantResource(
  userRole: string,
  userOrgId: number | null | undefined,
  resourceOrgId: number
): boolean {
  if (userRole === 'ADMIN' || userRole === 'ADVISOR' || userRole === 'OFFICER') {
    return true;
  }
  if (!userOrgId) {
    return false;
  }
  return userOrgId === resourceOrgId;
}
