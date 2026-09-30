export type UserRole = 'APPLICANT' | 'ADVISOR' | 'OFFICER' | 'ADMIN';

export interface Organization {
  id: number;
  name: string;
  constitution: string;
  pan: string;
  gstin: string;
  udyamNumber: string | null;
  dataLabel: string;
}

export interface Project {
  id: number;
  organizationId: number;
  name: string;
  industry: string;
  product: string;
  manufacturingProcess: string;
  location: string;
  district: string;
  isMidc: boolean;
  plotDetails: string;
  projectStage: string;
  fixedCapitalInvestmentCr: string;
  landAreaSqm: number;
  builtUpAreaSqm: number;
  dataLabel: string;
  organization?: Organization | null;
  facts?: ProjectFacts | null;
}

export interface ProjectFacts {
  id: number;
  projectId: number;
  directWorkers: number;
  contractWorkers: number;
  powerKva: number;
  waterKld: number;
  hasBoiler: boolean;
  boilerCapacityTph: string;
  boilerFuelType: string;
  boilerHeatingSurfaceSqm: number;
  hasHazardousProcess: boolean;
  hazardousScheduleRef: string;
  hazardousChemicalsJson: string;
  storageCapacityTons: number;
  productionCapacityMta: number;
  operatingHoursPerDay: number;
  pollutionCategory: string;
  wasteType: string;
  hasHazardousWaste: boolean;
  hazardousWasteScheduleCode: string;
  waterDischargeType: string;
  effluentTreatmentCapacityKld: number;
  airEmissionsSources: string;
  midcIndustrialArea: string;
  midcPlotNumber: string;
  midcWaterSupplyConnection: boolean;
}

export interface RuleEvaluation {
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

export interface ProjectDocument {
  id: number;
  projectId: number;
  organizationId: number;
  title: string;
  category: string;
  documentType: string;
  fileFormat: string;
  version: number;
  status: 'UPLOADED' | 'PROCESSING' | 'EXTRACTED' | 'USER_REVIEW' | 'VERIFIED' | 'REJECTED';
  extractedFieldsJson: string;
  verifiedFieldsJson: string;
  usedByApprovalsJson: string;
  expiryDate: string | null;
  uploadedDate: string;
  dataLabel: string;
}

export interface ValidationResult {
  id: number;
  projectId: number;
  documentId: number | null;
  checkCode: string;
  checkTitle: string;
  readinessCategory: string;
  severity: 'PASS' | 'WARNING' | 'FAIL';
  declaredFactValue: string;
  documentExtractedValue: string;
  explanation: string;
  ruleRef: string;
  resolved: boolean;
}

export interface ApplicationRecord {
  id: number;
  applicationCode: string;
  projectId: number;
  organizationId: number;
  approvalRef: string;
  approvalName: string;
  authority: string;
  ruleId: string;
  applicantName: string;
  state: string;
  submittedDate: string | null;
  completenessDate: string | null;
  publishedTimelineDays: number;
  daysElapsed: number;
  pausedDays: number;
  isClockPaused: boolean;
  deadlineDate: string | null;
  riskState: string;
  decisionReason: string | null;
  dataLabel: string;
}

export interface ApplicationEvent {
  id: number;
  applicationId: number;
  eventType: string;
  fromState: string | null;
  toState: string;
  clockStatus: string;
  actorRole: string;
  actorName: string;
  eventDate: string;
  notes: string;
}

export interface QueryRecord {
  id: number;
  queryNumber: string;
  applicationId: number;
  projectId: number;
  requiredItem: string;
  detailedQueryText: string;
  raisedBy: string;
  raisedDate: string;
  status: string;
  clockStateImpact: string;
  responseText: string | null;
  responseDocumentTitle: string | null;
  respondedDate: string | null;
}

export interface EscalationRecord {
  id: number;
  escalationCode: string;
  applicationId: number;
  projectId: number;
  approvalName: string;
  authority: string;
  ruleId: string;
  submissionDate: string;
  completenessDate: string;
  statutoryDeadlineDate: string;
  daysElapsedNet: number;
  relevantLegalProvision: string;
  designatedAppellateOfficer: string;
  escalationMechanismSummary: string;
  dossierPayloadJson: string;
  status: string;
}

export interface ConflictRecord {
  id: number;
  conflictCode: string;
  approvalRef: string;
  approvalName: string;
  conflictDimension: string;
  sourcesComparisonJson: string;
  status: string;
  advisorGuidanceNote: string;
}

export interface InspectionRecord {
  id: number;
  projectId: number;
  department: string;
  inspectionType: string;
  riskCategory: string;
  frequency: string;
  lastInspectionDate: string;
  nextDueDate: string;
  inspectorAllocationMethod: string;
  reportUploadingDeadline: string;
  coordinatedWindowNote: string;
  sourceCode: string;
}

export interface RenewalRecord {
  id: number;
  projectId: number;
  approvalRef: string;
  approvalName: string;
  authority: string;
  expiryDate: string;
  renewalWindowText: string;
  bucket: 'UPCOMING' | 'DUE_SOON' | 'OVERDUE' | 'COMPLETED';
  requiredDocumentsJson: string;
  ruleId: string;
  sourceCode: string;
  lastVerified: string;
}

export interface IncentiveRecord {
  id: number;
  projectId: number;
  incentiveName: string;
  schemeReference: string;
  talukaCategory: string;
  eligibilityConditionsJson: string;
  documentsAvailableJson: string;
  documentsMissingJson: string;
  readinessStatus: string;
  validityPeriod: string;
  sourceCode: string;
  lastVerified: string;
}
