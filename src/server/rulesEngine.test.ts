import {
  evaluateSingleRule,
  runWhatIfSimulation,
  transitionLegalClock,
  verifyAiCitationsAgainstKnowledgeBase,
  canAccessTenantResource,
  ProjectProfileInput,
  RuleRecord,
} from './rulesEngine.ts';

export interface UnitTestResult {
  testId: string;
  name: string;
  passed: boolean;
  details: string;
}

const sampleBaseProject: ProjectProfileInput = {
  industry: 'Pharmaceuticals & APIs',
  product: 'Bulk Drug Manufacturing Unit (Active Pharmaceutical Ingredients)',
  manufacturingProcess: 'Multi-stage Organic Synthesis, Solvent Extraction & Crystallization',
  location: 'Mahad MIDC Industrial Area, Raigad, Maharashtra',
  isMidc: true,
  fixedCapitalInvestmentCr: 45,
  landAreaSqm: 12500,
  builtUpAreaSqm: 6800,
  directWorkers: 120,
  contractWorkers: 60,
  powerKva: 140,
  waterKld: 85,
  hasBoiler: true,
  boilerCapacityTph: 4.5,
  hasHazardousProcess: true,
  storageCapacityTons: 45,
  pollutionCategory: 'RED',
  hasHazardousWaste: true,
  waterDischargeType: 'ZLD / CETP Member',
};

const sampleRules: RuleRecord[] = [
  {
    ruleId: 'ENV-MPCB-CTE-001',
    approvalRef: 'MPCB_CTE',
    approvalName: 'MPCB Consent to Establish (CTE)',
    authority: 'Maharashtra Pollution Control Board (MPCB)',
    stage: 'PRE_ESTABLISHMENT',
    when: {
      pollutionCategories: ['RED', 'ORANGE', 'GREEN'],
      hasHazardousProcess: true,
    },
    triggerFacts: ['Product: Bulk Drug', 'Hazardous Process: Yes', 'Environmental Category: RED'],
    whyExplanation:
      'Bulk drug manufacturing involves chemical synthesis classified under Red Category with trade effluent and air emissions requiring prior Consent to Establish under Section 25 of Water Act and Section 21 of Air Act.',
    dependencies: ['MIDC_LAND_ALLOTMENT'],
    parallelWith: ['MIDC_BUILDING_PLAN', 'DISH_FACTORY_PLAN'],
    documents: ['Detailed Project Report (DPR)', 'Process Flow & Mass Balance', 'MIDC Plot Allotment Letter'],
    legalBasis: {
      act: 'Water (Prevention and Control of Pollution) Act, 1974 & Air Act, 1981',
      section: 'Section 25 (Water Act) / Section 21 (Air Act)',
      rule: 'Maharashtra Water/Air Consent Rules',
    },
    timeline: { published: 60, unit: 'days' },
    escalationMechanism: {
      applicable: true,
      act: 'Maharashtra Right to Public Services Act, 2015',
      section: 'Section 9 (First Appeal)',
      appellateAuthority: 'Member Secretary, MPCB',
      summary: 'Eligible for First Appeal within 30 days of statutory timeline breach.',
    },
    effectiveFrom: '2021-01-01',
    effectiveUntil: null,
    sourceCode: 'SRC-MPCB-CONSENT-2021',
    lastVerified: '2026-09-15',
    verificationStatus: 'VERIFIED',
    isActive: true,
    version: 3,
  },
  {
    ruleId: 'PWR-CEIG-HT-008',
    approvalRef: 'CEIG_HT_APPROVAL',
    approvalName: 'Chief Electrical Inspector (CEIG) HT Drawing & Charging Sanction',
    authority: 'Chief Electrical Inspector to Government of Maharashtra (CEIG)',
    stage: 'PRE_OPERATION',
    when: {
      minPowerKva: 150,
    },
    triggerFacts: ['Power Requirement ≥ 150 kVA (HT Installation)'],
    whyExplanation:
      'Electrical installations with connected/sanctioned load of 150 kVA or above require HT transformer installation approval and inspection by the Electrical Inspector under Regulation 43 of CEA Regulations.',
    dependencies: ['MIDC_BUILDING_PLAN'],
    parallelWith: ['BOILER_ERECTION_PERMIT'],
    documents: [
      'Single Line Diagram (SLD) signed by Licensed HT Supervisor',
      'Transformer & HT Switchgear Manufacturer Test Certificates',
      'Earth Pit Resistance Test Report',
    ],
    legalBasis: {
      act: 'Electricity Act, 2003',
      section: 'Section 53 & Section 162',
      rule: 'CEA (Measures Relating to Safety and Electric Supply) Regulations, 2023 — Regulation 43',
    },
    timeline: { published: 21, unit: 'days' },
    escalationMechanism: {
      applicable: true,
      act: 'Maharashtra Right to Public Services Act, 2015',
      section: 'Section 9',
      appellateAuthority: 'Chief Electrical Inspector, Mumbai',
      summary: 'First appeal to Chief Electrical Inspector upon expiry of 21 working days.',
    },
    effectiveFrom: '2023-06-01',
    effectiveUntil: null,
    sourceCode: 'SRC-CEIG-CEA-2023',
    lastVerified: '2026-09-10',
    verificationStatus: 'VERIFIED',
    isActive: true,
    version: 1,
  },
  {
    ruleId: 'LAB-CLRA-REG-009',
    approvalRef: 'CLRA_REGISTRATION',
    approvalName: 'Principal Employer Registration under Contract Labour (R&A) Act',
    authority: 'Commissioner of Labour, Maharashtra',
    stage: 'PRE_OPERATION',
    when: {
      minContractWorkers: 50,
    },
    triggerFacts: ['Contract Workers ≥ 50 (Maharashtra Amendment)'],
    whyExplanation:
      'Establishments employing 50 or more contract workers on any day of the preceding 12 months in Maharashtra require Principal Employer Registration under Section 7 of CLRA Act (as amended in Maharashtra).',
    dependencies: ['DISH_FACTORY_PLAN'],
    parallelWith: ['MPCB_CTO'],
    documents: ['Form I Application', 'Contractor Agreement Copy', 'MIDC Possession Receipt'],
    legalBasis: {
      act: 'Contract Labour (Regulation and Abolition) Act, 1970 (Maharashtra Amendment)',
      section: 'Section 7',
      rule: 'Maharashtra Contract Labour Rules, 1971 — Rule 17',
    },
    timeline: { published: 7, unit: 'days' },
    escalationMechanism: {
      applicable: true,
      act: 'Maharashtra Right to Public Services Act, 2015',
      section: 'Section 9',
      appellateAuthority: 'Additional Commissioner of Labour',
      summary: 'RTS appeal available after 7 working days.',
    },
    effectiveFrom: '2020-01-01',
    effectiveUntil: null,
    sourceCode: 'SRC-MAHA-CLRA-2020',
    lastVerified: '2026-09-12',
    verificationStatus: 'VERIFIED',
    isActive: true,
    version: 2,
  },
  {
    ruleId: 'ENV-MPCB-CTE-OLD-2018',
    approvalRef: 'MPCB_CTE_LEGACY',
    approvalName: 'Legacy MPCB Consent Rule (Superseded 2018)',
    authority: 'MPCB',
    stage: 'PRE_ESTABLISHMENT',
    when: {
      alwaysApplicable: true,
    },
    triggerFacts: ['Legacy Trigger'],
    whyExplanation: 'Superseded consent rule.',
    dependencies: [],
    parallelWith: [],
    documents: [],
    legalBasis: {
      act: 'Water Act 1974',
      section: 'Section 25',
      rule: 'Superseded 2018 Notification',
    },
    timeline: { published: 120, unit: 'days' },
    escalationMechanism: {
      applicable: false,
      act: 'None',
      section: 'None',
      appellateAuthority: 'None',
      summary: 'Superseded',
    },
    effectiveFrom: '2018-04-01',
    effectiveUntil: '2023-03-31',
    sourceCode: 'SRC-MPCB-CONSENT-2021',
    lastVerified: '2023-03-31',
    verificationStatus: 'VERIFIED',
    isActive: true,
    version: 1,
  },
];

export function runAllRegulatoryUnitTests(): UnitTestResult[] {
  const results: UnitTestResult[] = [];

  // Test 1: Input Bulk drug + hazardous process -> Expected: MPCB environmental rule triggered
  const t1 = evaluateSingleRule(sampleRules[0], sampleBaseProject, '2026-09-30');
  results.push({
    testId: 'TEST-01',
    name: 'Bulk drug + hazardous process triggers MPCB CTE rule (ENV-MPCB-CTE-001)',
    passed: t1.applicabilityStatus === 'REQUIRED' && t1.matchedTriggerFacts.length >= 2,
    details: `Status=${t1.applicabilityStatus}; Matched triggers=${t1.matchedTriggerFacts
      .map((f) => `${f.label}: ${f.value}`)
      .join(', ')}`,
  });

  // Test 2: Power threshold changes (140 kVA -> 250 kVA)
  const simPower = runWhatIfSimulation(
    sampleRules,
    sampleBaseProject,
    { ...sampleBaseProject, powerKva: 250 },
    '2026-09-30'
  );
  const triggeredCeig = simPower.newlyTriggeredApprovals.some(
    (a) => a.ruleId === 'PWR-CEIG-HT-008'
  );
  results.push({
    testId: 'TEST-02',
    name: 'Power threshold change (140 kVA → 250 kVA) triggers CEIG HT Approval & new documents',
    passed: triggeredCeig && simPower.addedDocuments.length === 3,
    details: `Newly triggered: ${simPower.newlyTriggeredApprovals
      .map((a) => a.ruleId)
      .join(', ')}; Added docs: ${simPower.addedDocuments.length}`,
  });

  // Test 3: Worker threshold changes (Contract workers 60 -> 35 drops below 50 CLRA Maharashtra threshold)
  const simWorkers = runWhatIfSimulation(
    sampleRules,
    sampleBaseProject,
    { ...sampleBaseProject, contractWorkers: 35 },
    '2026-09-30'
  );
  const removedClra = simWorkers.removedApprovals.some((a) => a.ruleId === 'LAB-CLRA-REG-009');
  results.push({
    testId: 'TEST-03',
    name: 'Contract worker threshold change (60 → 35) removes CLRA Registration requirement',
    passed: removedClra,
    details: `Removed approvals when contractWorkers=35: ${simWorkers.removedApprovals
      .map((a) => a.ruleId)
      .join(', ')}`,
  });

  // Test 4: Rule effective date (future rule not yet effective)
  const futureRule: RuleRecord = {
    ...sampleRules[0],
    ruleId: 'ENV-FUTURE-2028',
    effectiveFrom: '2028-01-01',
  };
  const t4 = evaluateSingleRule(futureRule, sampleBaseProject, '2026-09-30');
  results.push({
    testId: 'TEST-04',
    name: 'Rule effective date guard prevents future rule (effective 2028-01-01) from triggering today',
    passed: t4.applicabilityStatus === 'NOT_APPLICABLE',
    details: `Reason: ${t4.whyApplies}`,
  });

  // Test 5: Query pauses legal clock
  const clockBeforeQuery = {
    state: 'UNDER_SCRUTINY' as const,
    isClockPaused: false,
    daysElapsed: 22,
    pausedDays: 0,
    publishedTimelineDays: 60,
    riskState: 'ON_TRACK' as const,
  };
  const clockAfterQuery = transitionLegalClock(clockBeforeQuery, 'RAISE_QUERY');
  results.push({
    testId: 'TEST-05',
    name: 'Raising an official query transitions state to QUERY_RAISED and pauses legal clock',
    passed:
      clockAfterQuery.state === 'QUERY_RAISED' &&
      clockAfterQuery.isClockPaused === true &&
      clockAfterQuery.riskState === 'CLOCK_PAUSED',
    details: `State=${clockAfterQuery.state}, isClockPaused=${clockAfterQuery.isClockPaused}, riskState=${clockAfterQuery.riskState}`,
  });

  // Test 6: Query response resumes legal clock
  const clockAfterResponse = transitionLegalClock(clockAfterQuery, 'RESPOND_QUERY', {
    additionalPausedDays: 5,
  });
  results.push({
    testId: 'TEST-06',
    name: 'Applicant query response transitions state to QUERY_RESPONDED and resumes legal clock',
    passed:
      clockAfterResponse.state === 'QUERY_RESPONDED' &&
      clockAfterResponse.isClockPaused === false &&
      clockAfterResponse.pausedDays === 5,
    details: `State=${clockAfterResponse.state}, isClockPaused=${clockAfterResponse.isClockPaused}, pausedDays=${clockAfterResponse.pausedDays}`,
  });

  // Test 7: Expired rule cannot be used as current rule
  const expiredEval = evaluateSingleRule(sampleRules[3], sampleBaseProject, '2026-09-30');
  results.push({
    testId: 'TEST-07',
    name: 'Expired rule (effectiveUntil: 2023-03-31) cannot be used as a current rule',
    passed:
      expiredEval.applicabilityStatus === 'NOT_APPLICABLE' &&
      expiredEval.whyApplies.includes('expired'),
    details: `${expiredEval.ruleId}: ${expiredEval.whyApplies}`,
  });

  // Test 8: AI answer without supporting source is rejected
  const validRulesSet = new Set(['ENV-MPCB-CTE-001', 'PWR-CEIG-HT-008']);
  const validSourcesSet = new Set(['SRC-MPCB-CONSENT-2021', 'SRC-CEIG-CEA-2023']);
  const unverifiedAiAttempt = verifyAiCitationsAgainstKnowledgeBase(
    [
      {
        ruleId: 'HALLUCINATED-RULE-999',
        sourceCode: 'FAKE-SOURCE',
        legalSection: 'Sec 99',
        lastVerified: '2026-01-01',
      },
    ],
    validRulesSet,
    validSourcesSet
  );
  results.push({
    testId: 'TEST-08',
    name: 'AI answer without verified supporting source/rule ID is rejected by citation guard',
    passed:
      unverifiedAiAttempt.valid === false &&
      unverifiedAiAttempt.fallbackMessage ===
        "I couldn't verify this from the current regulatory knowledge base.",
    details: `Valid=${unverifiedAiAttempt.valid}; Fallback="${unverifiedAiAttempt.fallbackMessage}"`,
  });

  // Test 9: Tenant A cannot access Tenant B documents
  const tenantACanAccessTenantB = canAccessTenantResource('APPLICANT', 1, 2);
  const tenantACanAccessTenantA = canAccessTenantResource('APPLICANT', 1, 1);
  results.push({
    testId: 'TEST-09',
    name: 'Tenant isolation blocks Organization A (id=1) applicant from accessing Organization B (id=2) documents',
    passed: tenantACanAccessTenantB === false && tenantACanAccessTenantA === true,
    details: `Tenant 1 -> Org 2 allowed: ${tenantACanAccessTenantB}; Tenant 1 -> Org 1 allowed: ${tenantACanAccessTenantA}`,
  });

  return results;
}
