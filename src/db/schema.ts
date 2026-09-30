import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  numeric,
  index,
} from 'drizzle-orm/pg-core';

// 1. organizations
export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  constitution: text('constitution').notNull(), // Private Limited, LLP, Partnership, Proprietorship
  pan: text('pan').notNull(),
  gstin: text('gstin').notNull(),
  udyamNumber: text('udyam_number'),
  dataLabel: text('data_label').notNull().default('SYNTHETIC DEMO DATA'), // SYNTHETIC DEMO DATA | USER CREATED
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. users
export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    uid: text('uid').notNull().unique(), // Firebase Auth UID
    email: text('email').notNull(),
    name: text('name').notNull().default('Applicant User'),
    role: text('role').notNull().default('APPLICANT'), // APPLICANT | ADVISOR | ADMIN | OFFICER
    organizationId: integer('organization_id').references(() => organizations.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('idx_users_org').on(table.organizationId)]
);

// 3. projects
export const projects = pgTable(
  'projects',
  {
    id: serial('id').primaryKey(),
    organizationId: integer('organization_id')
      .references(() => organizations.id)
      .notNull(),
    name: text('name').notNull(),
    industry: text('industry').notNull(),
    product: text('product').notNull(),
    manufacturingProcess: text('manufacturing_process').notNull(),
    location: text('location').notNull(),
    district: text('district').notNull().default('Raigad'),
    isMidc: boolean('is_midc').notNull().default(true),
    plotDetails: text('plot_details').notNull(),
    projectStage: text('project_stage').notNull().default('PRE_ESTABLISHMENT'),
    fixedCapitalInvestmentCr: numeric('fixed_capital_investment_cr', {
      precision: 12,
      scale: 2,
    }).notNull(),
    landAreaSqm: integer('land_area_sqm').notNull(),
    builtUpAreaSqm: integer('built_up_area_sqm').notNull(),
    dataLabel: text('data_label').notNull().default('SYNTHETIC DEMO DATA'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('idx_projects_org').on(table.organizationId)]
);

// 4. project_facts
export const projectFacts = pgTable(
  'project_facts',
  {
    id: serial('id').primaryKey(),
    projectId: integer('project_id')
      .references(() => projects.id)
      .notNull()
      .unique(),
    directWorkers: integer('direct_workers').notNull().default(120),
    contractWorkers: integer('contract_workers').notNull().default(60),
    powerKva: integer('power_kva').notNull().default(140),
    waterKld: integer('water_kld').notNull().default(85),
    hasBoiler: boolean('has_boiler').notNull().default(true),
    boilerCapacityTph: numeric('boiler_capacity_tph', { precision: 8, scale: 2 }).default('4.50'),
    boilerFuelType: text('boiler_fuel_type').default('Briquette / LDO'),
     boilerHeatingSurfaceSqm: integer('boiler_heating_surface_sqm').default(65),
    hasHazardousProcess: boolean('has_hazardous_process').notNull().default(true),
    hazardousScheduleRef: text('hazardous_schedule_ref').default('First Schedule - Entry 17 (Chemical & Bulk Drugs)'),
    hazardousChemicalsJson: text('hazardous_chemicals_json').default('["Methanol","Toluene","Acetonitrile","Hydrochloric Acid"]'),
    storageCapacityTons: integer('storage_capacity_tons').notNull().default(45),
    productionCapacityMta: integer('production_capacity_mta').notNull().default(600),
    operatingHoursPerDay: integer('operating_hours_per_day').notNull().default(24),
    pollutionCategory: text('pollution_category').notNull().default('RED'), // RED | ORANGE | GREEN | WHITE
    wasteType: text('waste_type').notNull().default('Process Sludge, Spent Solvents & Distillation Residue'),
    hasHazardousWaste: boolean('has_hazardous_waste').notNull().default(true),
    hazardousWasteScheduleCode: text('hazardous_waste_schedule_code').default('Schedule I - Category 28.1, 28.4, 35.3'),
    waterDischargeType: text('water_discharge_type').notNull().default('ZLD / CETP Member'),
    effluentTreatmentCapacityKld: integer('effluent_treatment_capacity_kld').default(40),
    airEmissionsSources: text('air_emissions_sources').notNull().default('4.5 TPH Boiler Flue Stack, Process Acid Scrubber, DG Set (250 kVA)'),
    midcIndustrialArea: text('midc_industrial_area').default('Mahad MIDC Chemical Zone'),
    midcPlotNumber: text('midc_plot_number').default('Plot No. K-42/1'),
    midcWaterSupplyConnection: boolean('midc_water_supply_connection').default(true),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('idx_project_facts_project').on(table.projectId)]
);

// 5. regulatory_sources
export const regulatorySources = pgTable('regulatory_sources', {
  id: serial('id').primaryKey(),
  sourceCode: text('source_code').notNull().unique(),
  name: text('name').notNull(),
  authority: text('authority').notNull(),
  url: text('url').notNull(),
  actName: text('act_name').notNull(),
  sectionRef: text('section_ref').notNull(),
  publicationDate: text('publication_date').notNull(),
  effectiveDate: text('effective_date').notNull(),
  lastVerified: text('last_verified').notNull(),
  verificationStatus: text('verification_status').notNull().default('VERIFIED'), // VERIFIED | UNDER REVIEW | SYNTHETIC
  changeWorkflowStage: text('change_workflow_stage').notNull().default('PUBLISHED'), // NEW_SOURCE | REVIEW | IMPACT_ANALYSIS | RULE_UPDATE | DOMAIN_APPROVAL | PUBLISHED
  affectedRulesJson: text('affected_rules_json').notNull().default('[]'),
  affectedApprovalsJson: text('affected_approvals_json').notNull().default('[]'),
  summaryNotes: text('summary_notes').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 6. approvals (Master catalogue)
export const approvals = pgTable('approvals', {
  id: serial('id').primaryKey(),
  approvalRef: text('approval_ref').notNull().unique(),
  name: text('name').notNull(),
  authority: text('authority').notNull(),
  department: text('department').notNull(),
  stage: text('stage').notNull(), // PRE_LAND | PRE_ESTABLISHMENT | PRE_CONSTRUCTION | CONSTRUCTION | PRE_OPERATION | POST_COMMENCEMENT
  portalSystem: text('portal_system').notNull(), // MAITRI / MPCB Portal / DISH Portal / PESO / MIDC Single Window
  renewalInfo: text('renewal_info').notNull(),
  observedPublicInfo: text('observed_public_info').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 7. approval_rules
export const approvalRules = pgTable('approval_rules', {
  id: serial('id').primaryKey(),
  ruleId: text('rule_id').notNull().unique(),
  approvalRef: text('approval_ref').notNull(),
  authority: text('authority').notNull(),
  stage: text('stage').notNull(),
  whenJson: text('when_json').notNull(), // JSON condition structure
  triggerFactsJson: text('trigger_facts_json').notNull(),
  whyExplanation: text('why_explanation').notNull(),
  dependenciesJson: text('dependencies_json').notNull(),
  parallelWithJson: text('parallel_with_json').notNull().default('[]'),
  documentsJson: text('documents_json').notNull(),
  legalBasisJson: text('legal_basis_json').notNull(),
  timelineJson: text('timeline_json').notNull(),
  escalationMechanismJson: text('escalation_mechanism_json').notNull(),
  effectiveFrom: text('effective_from').notNull(),
  effectiveUntil: text('effective_until'),
  sourceCode: text('source_code').notNull(),
  lastVerified: text('last_verified').notNull(),
  verificationStatus: text('verification_status').notNull().default('VERIFIED'), // VERIFIED | UNDER REVIEW
  isActive: boolean('is_active').notNull().default(true),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 8. rule_versions
export const ruleVersions = pgTable('rule_versions', {
  id: serial('id').primaryKey(),
  ruleId: text('rule_id').notNull(),
  versionNumber: integer('version_number').notNull(),
  ruleSnapshotJson: text('rule_snapshot_json').notNull(),
  changeNotes: text('change_notes').notNull(),
  actorEmail: text('actor_email').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 9. documents
export const documents = pgTable(
  'documents',
  {
    id: serial('id').primaryKey(),
    projectId: integer('project_id')
      .references(() => projects.id)
      .notNull(),
    organizationId: integer('organization_id')
      .references(() => organizations.id)
      .notNull(),
    title: text('title').notNull(),
    category: text('category').notNull(), // Identity | Land | Building | Environment | Labour | Fire | Power | Factory | Financial | Incentives | Other
    documentType: text('document_type').notNull(),
    fileFormat: text('file_format').notNull().default('PDF'),
    version: integer('version').notNull().default(1),
    status: text('status').notNull().default('USER_REVIEW'), // UPLOADED | PROCESSING | EXTRACTED | USER_REVIEW | VERIFIED | REJECTED
    extractedFieldsJson: text('extracted_fields_json').notNull().default('{}'),
    verifiedFieldsJson: text('verified_fields_json').notNull().default('{}'),
    usedByApprovalsJson: text('used_by_approvals_json').notNull().default('[]'),
    expiryDate: text('expiry_date'),
    uploadedDate: text('uploaded_date').notNull(),
    dataLabel: text('data_label').notNull().default('SYNTHETIC DEMO DATA'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_documents_project').on(table.projectId),
    index('idx_documents_org').on(table.organizationId),
  ]
);

// 10. document_versions
export const documentVersions = pgTable('document_versions', {
  id: serial('id').primaryKey(),
  documentId: integer('document_id')
    .references(() => documents.id)
    .notNull(),
  versionNumber: integer('version_number').notNull(),
  fileName: text('file_name').notNull(),
  status: text('status').notNull(),
  uploadedByEmail: text('uploaded_by_email').notNull(),
  changeSummary: text('change_summary').notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
});

// 11. document_fields
export const documentFields = pgTable('document_fields', {
  id: serial('id').primaryKey(),
  documentId: integer('document_id')
    .references(() => documents.id)
    .notNull(),
  fieldKey: text('field_key').notNull(),
  extractedValue: text('extracted_value').notNull(),
  verifiedValue: text('verified_value'),
  isVerifiedByHuman: boolean('is_verified_by_human').notNull().default(false),
  matchesProjectFact: boolean('matches_project_fact').notNull().default(true),
  discrepancyNote: text('discrepancy_note'),
});

// 12. validation_results
export const validationResults = pgTable(
  'validation_results',
  {
    id: serial('id').primaryKey(),
    projectId: integer('project_id')
      .references(() => projects.id)
      .notNull(),
    documentId: integer('document_id').references(() => documents.id),
    checkCode: text('check_code').notNull(),
    checkTitle: text('check_title').notNull(),
    readinessCategory: text('readiness_category').notNull(), // IDENTITY | LAND | TECHNICAL_DOCUMENTS | ENVIRONMENT | MANDATORY_DECLARATIONS
    severity: text('severity').notNull(), // PASS | WARNING | FAIL
    declaredFactValue: text('declared_fact_value').notNull(),
    documentExtractedValue: text('document_extracted_value').notNull(),
    explanation: text('explanation').notNull(),
    ruleRef: text('rule_ref').notNull(),
    resolved: boolean('resolved').notNull().default(false),
    checkedAt: timestamp('checked_at').defaultNow().notNull(),
  },
  (table) => [index('idx_validation_project').on(table.projectId)]
);

// 13. applications
export const applications = pgTable(
  'applications',
  {
    id: serial('id').primaryKey(),
    applicationCode: text('application_code').notNull().unique(),
    projectId: integer('project_id')
      .references(() => projects.id)
      .notNull(),
    organizationId: integer('organization_id')
      .references(() => organizations.id)
      .notNull(),
    approvalRef: text('approval_ref').notNull(),
    approvalName: text('approval_name').notNull(),
    authority: text('authority').notNull(),
    ruleId: text('rule_id').notNull(),
    applicantName: text('applicant_name').notNull(),
    state: text('state').notNull(), // DRAFT | PREVALIDATED | SUBMITTED | UNDER_SCRUTINY | QUERY_RAISED | QUERY_RESPONDED | APPROVED | REJECTED | BREACHED | ESCALATION_ELIGIBLE | TRANSFERRED | DECIDED
    submittedDate: text('submitted_date'),
    completenessDate: text('completeness_date'),
    publishedTimelineDays: integer('published_timeline_days').notNull(),
    daysElapsed: integer('days_elapsed').notNull().default(0),
    pausedDays: integer('paused_days').notNull().default(0),
    isClockPaused: boolean('is_clock_paused').notNull().default(false),
    deadlineDate: text('deadline_date'),
    riskState: text('risk_state').notNull().default('ON_TRACK'), // ON_TRACK | NEAR_DEADLINE | CLOCK_PAUSED | BREACHED | COMPLETED
    decisionReason: text('decision_reason'),
    dataLabel: text('data_label').notNull().default('SYNTHETIC DEMO DATA'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_applications_project').on(table.projectId),
    index('idx_applications_org').on(table.organizationId),
  ]
);

// 14. application_events
export const applicationEvents = pgTable(
  'application_events',
  {
    id: serial('id').primaryKey(),
    applicationId: integer('application_id')
      .references(() => applications.id)
      .notNull(),
    eventType: text('event_type').notNull(),
    fromState: text('from_state'),
    toState: text('to_state').notNull(),
    clockStatus: text('clock_status').notNull(), // NOT_STARTED | RUNNING | PAUSED | BREACHED | STOPPED
    actorRole: text('actor_role').notNull(),
    actorName: text('actor_name').notNull(),
    eventDate: text('event_date').notNull(),
    notes: text('notes').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('idx_app_events_app').on(table.applicationId)]
);

// 15. queries
export const queries = pgTable(
  'queries',
  {
    id: serial('id').primaryKey(),
    queryNumber: text('query_number').notNull().unique(),
    applicationId: integer('application_id')
      .references(() => applications.id)
      .notNull(),
    projectId: integer('project_id')
      .references(() => projects.id)
      .notNull(),
    requiredItem: text('required_item').notNull(),
    detailedQueryText: text('detailed_query_text').notNull(),
    raisedBy: text('raised_by').notNull(),
    raisedDate: text('raised_date').notNull(),
    status: text('status').notNull().default('AWAITING_APPLICANT'), // AWAITING_APPLICANT | QUERY_RESPONDED | CLOSED
    clockStateImpact: text('clock_state_impact').notNull().default('PAUSED'), // PAUSED | RESUMED
    responseText: text('response_text'),
    responseDocumentTitle: text('response_document_title'),
    respondedDate: text('responded_date'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('idx_queries_app').on(table.applicationId)]
);

// 16. deadlines
export const deadlines = pgTable('deadlines', {
  id: serial('id').primaryKey(),
  applicationId: integer('application_id')
    .references(() => applications.id)
    .notNull(),
  projectId: integer('project_id')
    .references(() => projects.id)
    .notNull(),
  approvalRef: text('approval_ref').notNull(),
  ruleId: text('rule_id').notNull(),
  statutoryDays: integer('statutory_days').notNull(),
  clockStartDate: text('clock_start_date').notNull(),
  pausedDays: integer('paused_days').notNull().default(0),
  effectiveDeadlineDate: text('effective_deadline_date').notNull(),
  status: text('status').notNull(), // ACTIVE | PAUSED | BREACHED | MET
  statutoryProvision: text('statutory_provision').notNull(),
});

// 17. escalations
export const escalations = pgTable('escalations', {
  id: serial('id').primaryKey(),
  escalationCode: text('escalation_code').notNull().unique(),
  applicationId: integer('application_id')
    .references(() => applications.id)
    .notNull(),
  projectId: integer('project_id')
    .references(() => projects.id)
    .notNull(),
  approvalName: text('approval_name').notNull(),
  authority: text('authority').notNull(),
  ruleId: text('rule_id').notNull(),
  submissionDate: text('submission_date').notNull(),
  completenessDate: text('completeness_date').notNull(),
  statutoryDeadlineDate: text('statutory_deadline_date').notNull(),
  daysElapsedNet: integer('days_elapsed_net').notNull(),
  relevantLegalProvision: text('relevant_legal_provision').notNull(),
  designatedAppellateOfficer: text('designated_appellate_officer').notNull(),
  escalationMechanismSummary: text('escalation_mechanism_summary').notNull(),
  dossierPayloadJson: text('dossier_payload_json').notNull(),
  status: text('status').notNull().default('ELIGIBLE_FOR_FILING'), // ELIGIBLE_FOR_FILING | DOSSIER_GENERATED | FILED_WITH_APPELLATE
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 18. inspections
export const inspections = pgTable('inspections', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id')
    .references(() => projects.id)
    .notNull(),
  department: text('department').notNull(),
  inspectionType: text('inspection_type').notNull(),
  riskCategory: text('risk_category').notNull(),
  frequency: text('frequency').notNull(),
  lastInspectionDate: text('last_inspection_date').notNull(),
  nextDueDate: text('next_due_date').notNull(),
  inspectorAllocationMethod: text('inspector_allocation_method').notNull(),
  reportUploadingDeadline: text('report_uploading_deadline').notNull(),
  coordinatedWindowNote: text('coordinated_window_note').notNull(),
  sourceCode: text('source_code').notNull(),
});

// 19. renewals
export const renewals = pgTable('renewals', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id')
    .references(() => projects.id)
    .notNull(),
  approvalRef: text('approval_ref').notNull(),
  approvalName: text('approval_name').notNull(),
  authority: text('authority').notNull(),
  expiryDate: text('expiry_date').notNull(),
  renewalWindowText: text('renewal_window_text').notNull(),
  bucket: text('bucket').notNull(), // UPCOMING | DUE_SOON | OVERDUE | COMPLETED
  requiredDocumentsJson: text('required_documents_json').notNull(),
  ruleId: text('rule_id').notNull(),
  sourceCode: text('source_code').notNull(),
  lastVerified: text('last_verified').notNull(),
});

// 20. incentives
export const incentives = pgTable('incentives', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id')
    .references(() => projects.id)
    .notNull(),
  incentiveName: text('incentive_name').notNull(),
  schemeReference: text('scheme_reference').notNull(),
  talukaCategory: text('taluka_category').notNull(),
  eligibilityConditionsJson: text('eligibility_conditions_json').notNull(),
  documentsAvailableJson: text('documents_available_json').notNull(),
  documentsMissingJson: text('documents_missing_json').notNull(),
  readinessStatus: text('readiness_status').notNull(), // READY_FOR_REVIEW | MISSING_DOCUMENTS | REQUIRES_EC_CERTIFICATE
  validityPeriod: text('validity_period').notNull(),
  sourceCode: text('source_code').notNull(),
  lastVerified: text('last_verified').notNull(),
});

// 21. regulatory_conflicts (Conflict Detector table)
export const regulatoryConflicts = pgTable('regulatory_conflicts', {
  id: serial('id').primaryKey(),
  conflictCode: text('conflict_code').notNull().unique(),
  approvalRef: text('approval_ref').notNull(),
  approvalName: text('approval_name').notNull(),
  conflictDimension: text('conflict_dimension').notNull(), // TIMELINE | FEE_SCHEDULE | THRESHOLD
  sourcesComparisonJson: text('sources_comparison_json').notNull(), // Array of { label, authority, sourceName, value, publicationDate, effectiveDate, legalBasis, lastVerified }
  status: text('status').notNull().default('REQUIRES REVIEW'), // REQUIRES REVIEW | DOMAIN_NOTE_ATTACHED
  advisorGuidanceNote: text('advisor_guidance_note').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 22. audit_logs
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: serial('id').primaryKey(),
    organizationId: integer('organization_id'),
    projectId: integer('project_id'),
    entityType: text('entity_type').notNull(), // RULE | SOURCE | APPLICATION | QUERY | DOCUMENT | SIMULATOR | ESCALATION
    entityId: text('entity_id').notNull(),
    action: text('action').notNull(),
    actorEmail: text('actor_email').notNull(),
    actorRole: text('actor_role').notNull(),
    detailsJson: text('details_json').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('idx_audit_org').on(table.organizationId)]
);
