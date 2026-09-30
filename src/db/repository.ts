import { db } from './index.ts';
import * as schema from './schema.ts';
import { eq, desc } from 'drizzle-orm';
import {
  evaluateProjectRules,
  runWhatIfSimulation,
  transitionLegalClock,
  ProjectProfileInput,
  RuleRecord,
  LegalClockState,
} from '../server/rulesEngine.ts';

export async function getOrCreateUser(uid: string, email: string, name?: string) {
  try {
    const existingOrgs = await db.select().from(schema.organizations);
    const defaultOrgId = existingOrgs[0]?.id ?? null;

    const result = await db
      .insert(schema.users)
      .values({
        uid,
        email,
        name: name || email.split('@')[0] || 'Authenticated User',
        role: 'APPLICANT',
        organizationId: defaultOrgId,
      })
      .onConflictDoUpdate({
        target: schema.users.uid,
        set: {
          email,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('Failed to synchronize user profile.', { cause: error });
  }
}

export async function updateUserRole(uid: string, role: string, organizationId?: number) {
  try {
    const updated = await db
      .update(schema.users)
      .set({
        role,
        ...(organizationId ? { organizationId } : {}),
      })
      .where(eq(schema.users.uid, uid))
      .returning();
    return updated[0];
  } catch (error) {
    console.error('Database query failed in updateUserRole:', error);
    throw new Error('Failed to update user role.', { cause: error });
  }
}

export async function listOrganizations() {
  try {
    return await db.select().from(schema.organizations).orderBy(schema.organizations.id);
  } catch (error) {
    console.error('Database query failed in listOrganizations:', error);
    throw new Error('Failed to load organizations.', { cause: error });
  }
}

export async function createOrganizationWithProject(payload: {
  orgName: string;
  constitution: string;
  pan: string;
  gstin: string;
  udyamNumber?: string;
  projectName: string;
  industry: string;
  product: string;
  manufacturingProcess: string;
  location: string;
  district: string;
  isMidc: boolean;
  plotDetails: string;
  fixedCapitalInvestmentCr: string;
  landAreaSqm: number;
  builtUpAreaSqm: number;
  actorEmail: string;
}) {
  try {
    const [org] = await db
      .insert(schema.organizations)
      .values({
        name: payload.orgName,
        constitution: payload.constitution,
        pan: payload.pan,
        gstin: payload.gstin,
        udyamNumber: payload.udyamNumber || null,
        dataLabel: 'USER CREATED',
      })
      .returning();

    const [proj] = await db
      .insert(schema.projects)
      .values({
        organizationId: org.id,
        name: payload.projectName,
        industry: payload.industry,
        product: payload.product,
        manufacturingProcess: payload.manufacturingProcess,
        location: payload.location,
        district: payload.district || 'Pune',
        isMidc: payload.isMidc,
        plotDetails: payload.plotDetails,
        projectStage: 'PRE_ESTABLISHMENT',
        fixedCapitalInvestmentCr: payload.fixedCapitalInvestmentCr || '25.00',
        landAreaSqm: Number(payload.landAreaSqm) || 5000,
        builtUpAreaSqm: Number(payload.builtUpAreaSqm) || 2800,
        dataLabel: 'USER CREATED',
      })
      .returning();

    await db.insert(schema.projectFacts).values({
      projectId: proj.id,
      directWorkers: 80,
      contractWorkers: 55,
      powerKva: 140,
      waterKld: 45,
      hasBoiler: true,
      boilerCapacityTph: '3.00',
      boilerFuelType: 'Briquette / PNG',
      boilerHeatingSurfaceSqm: 45,
      hasHazardousProcess: true,
      storageCapacityTons: 25,
      productionCapacityMta: 400,
      operatingHoursPerDay: 24,
      pollutionCategory: 'RED',
      wasteType: 'Process Residue & ETP Sludge',
      hasHazardousWaste: true,
      waterDischargeType: 'ZLD / CETP Member',
      effluentTreatmentCapacityKld: 25,
      airEmissionsSources: 'Boiler Stack & Process Scrubber',
      midcIndustrialArea: payload.isMidc ? payload.location : null,
      midcPlotNumber: payload.plotDetails,
      midcWaterSupplyConnection: payload.isMidc,
    });

    await db.insert(schema.auditLogs).values({
      organizationId: org.id,
      projectId: proj.id,
      entityType: 'PROJECT',
      entityId: String(proj.id),
      action: 'PROJECT_CREATED',
      actorEmail: payload.actorEmail,
      actorRole: 'APPLICANT',
      detailsJson: JSON.stringify({ orgName: org.name, projectName: proj.name }),
    });

    return { organization: org, project: proj };
  } catch (error) {
    console.error('Database query failed in createOrganizationWithProject:', error);
    throw new Error('Failed to create organization and project.', { cause: error });
  }
}

export async function listProjects() {
  try {
    const projs = await db.select().from(schema.projects).orderBy(schema.projects.id);
    const orgs = await db.select().from(schema.organizations);
    const facts = await db.select().from(schema.projectFacts);

    return projs.map((p) => ({
      ...p,
      organization: orgs.find((o) => o.id === p.organizationId) || null,
      facts: facts.find((f) => f.projectId === p.id) || null,
    }));
  } catch (error) {
    console.error('Database query failed in listProjects:', error);
    throw new Error('Failed to fetch projects.', { cause: error });
  }
}

export async function getProjectBundle(projectId: number) {
  try {
    const projs = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId));
    const project = projs[0];
    if (!project) {
      return null;
    }

    const orgs = await db
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.id, project.organizationId));
    const factsRows = await db
      .select()
      .from(schema.projectFacts)
      .where(eq(schema.projectFacts.projectId, projectId));

    const docs = await db
      .select()
      .from(schema.documents)
      .where(eq(schema.documents.projectId, projectId))
      .orderBy(schema.documents.id);

    const validations = await db
      .select()
      .from(schema.validationResults)
      .where(eq(schema.validationResults.projectId, projectId))
      .orderBy(schema.validationResults.id);

    const apps = await db
      .select()
      .from(schema.applications)
      .where(eq(schema.applications.projectId, projectId))
      .orderBy(schema.applications.id);

    const projectQueries = await db
      .select()
      .from(schema.queries)
      .where(eq(schema.queries.projectId, projectId))
      .orderBy(desc(schema.queries.id));

    const projectEscalations = await db
      .select()
      .from(schema.escalations)
      .where(eq(schema.escalations.projectId, projectId));

    const projectInspections = await db
      .select()
      .from(schema.inspections)
      .where(eq(schema.inspections.projectId, projectId));

    const projectRenewals = await db
      .select()
      .from(schema.renewals)
      .where(eq(schema.renewals.projectId, projectId));

    const projectIncentives = await db
      .select()
      .from(schema.incentives)
      .where(eq(schema.incentives.projectId, projectId));

    const conflicts = await db.select().from(schema.regulatoryConflicts);

    return {
      project,
      organization: orgs[0] || null,
      facts: factsRows[0] || null,
      documents: docs,
      validations,
      applications: apps,
      queries: projectQueries,
      escalations: projectEscalations,
      inspections: projectInspections,
      renewals: projectRenewals,
      incentives: projectIncentives,
      conflicts,
    };
  } catch (error) {
    console.error('Database query failed in getProjectBundle:', error);
    throw new Error('Failed to load project bundle.', { cause: error });
  }
}

export async function getRulesAsEngineRecords(): Promise<RuleRecord[]> {
  try {
    const dbRules = await db.select().from(schema.approvalRules).orderBy(schema.approvalRules.id);
    const dbApprovals = await db.select().from(schema.approvals);
    const dbSources = await db.select().from(schema.regulatorySources);

    return dbRules.map((r) => {
      const cat = dbApprovals.find((a) => a.approvalRef === r.approvalRef);
      const src = dbSources.find((s) => s.sourceCode === r.sourceCode);
      return {
        ruleId: r.ruleId,
        approvalRef: r.approvalRef,
        approvalName: cat?.name || r.approvalRef,
        authority: r.authority,
        stage: r.stage,
        when: JSON.parse(r.whenJson || '{}'),
        triggerFacts: JSON.parse(r.triggerFactsJson || '[]'),
        whyExplanation: r.whyExplanation,
        dependencies: JSON.parse(r.dependenciesJson || '[]'),
        parallelWith: JSON.parse(r.parallelWithJson || '[]'),
        documents: JSON.parse(r.documentsJson || '[]'),
        legalBasis: JSON.parse(r.legalBasisJson || '{"act":"","section":"","rule":""}'),
        timeline: JSON.parse(r.timelineJson || '{"published":30,"unit":"days"}'),
        observedProcessingInfo: cat?.observedPublicInfo,
        renewalInfo: cat?.renewalInfo,
        escalationMechanism: JSON.parse(
          r.escalationMechanismJson ||
            '{"applicable":false,"act":"","section":"","appellateAuthority":"","summary":""}'
        ),
        effectiveFrom: r.effectiveFrom,
        effectiveUntil: r.effectiveUntil,
        sourceCode: r.sourceCode,
        sourceName: src?.name || r.sourceCode,
        sourceUrl: src?.url || 'https://maitri.mahaonline.gov.in',
        lastVerified: r.lastVerified,
        verificationStatus: (r.verificationStatus as RuleRecord['verificationStatus']) || 'VERIFIED',
        isActive: r.isActive,
        version: r.version,
      };
    });
  } catch (error) {
    console.error('Database query failed in getRulesAsEngineRecords:', error);
    throw new Error('Failed to load regulatory rules.', { cause: error });
  }
}

export function buildProfileInputFromProject(
  project: typeof schema.projects.$inferSelect,
  facts: typeof schema.projectFacts.$inferSelect | null
): ProjectProfileInput {
  return {
    industry: project.industry,
    product: project.product,
    manufacturingProcess: project.manufacturingProcess,
    location: project.location,
    isMidc: project.isMidc,
    fixedCapitalInvestmentCr: Number(project.fixedCapitalInvestmentCr) || 45,
    landAreaSqm: project.landAreaSqm,
    builtUpAreaSqm: project.builtUpAreaSqm,
    directWorkers: facts?.directWorkers ?? 120,
    contractWorkers: facts?.contractWorkers ?? 60,
    powerKva: facts?.powerKva ?? 140,
    waterKld: facts?.waterKld ?? 85,
    hasBoiler: facts?.hasBoiler ?? true,
    boilerCapacityTph: Number(facts?.boilerCapacityTph) || 4.5,
    hasHazardousProcess: facts?.hasHazardousProcess ?? true,
    storageCapacityTons: facts?.storageCapacityTons ?? 45,
    pollutionCategory: facts?.pollutionCategory ?? 'RED',
    hasHazardousWaste: facts?.hasHazardousWaste ?? true,
    waterDischargeType: facts?.waterDischargeType ?? 'ZLD / CETP Member',
  };
}

export async function analyzeProjectApprovals(projectId: number) {
  try {
    const bundle = await getProjectBundle(projectId);
    if (!bundle) {
      throw new Error('Project not found');
    }
    const rules = await getRulesAsEngineRecords();
    const profileInput = buildProfileInputFromProject(bundle.project, bundle.facts);
    const evaluation = evaluateProjectRules(rules, profileInput, '2026-09-30');
    return {
      project: bundle.project,
      organization: bundle.organization,
      facts: bundle.facts,
      profileInput,
      evaluation,
      conflicts: bundle.conflicts,
    };
  } catch (error) {
    console.error('Database query failed in analyzeProjectApprovals:', error);
    throw new Error('Failed to evaluate project regulatory rules.', { cause: error });
  }
}

export async function updateProjectIntakeAndFacts(
  projectId: number,
  updates: {
    company?: Partial<typeof schema.organizations.$inferInsert>;
    project?: Partial<typeof schema.projects.$inferInsert>;
    facts?: Partial<typeof schema.projectFacts.$inferInsert>;
    actorEmail?: string;
  }
) {
  try {
    const projs = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId));
    const proj = projs[0];
    if (!proj) throw new Error('Project not found');

    if (updates.company && Object.keys(updates.company).length > 0) {
      await db
        .update(schema.organizations)
        .set(updates.company)
        .where(eq(schema.organizations.id, proj.organizationId));
    }

    if (updates.project && Object.keys(updates.project).length > 0) {
      await db
        .update(schema.projects)
        .set({ ...updates.project, updatedAt: new Date() })
        .where(eq(schema.projects.id, projectId));
    }

    if (updates.facts && Object.keys(updates.facts).length > 0) {
      await db
        .update(schema.projectFacts)
        .set({ ...updates.facts, updatedAt: new Date() })
        .where(eq(schema.projectFacts.projectId, projectId));
    }

    await db.insert(schema.auditLogs).values({
      organizationId: proj.organizationId,
      projectId,
      entityType: 'PROJECT_INTAKE',
      entityId: String(projectId),
      action: 'SMART_INTAKE_UPDATED',
      actorEmail: updates.actorEmail || 'applicant@aarogya-apis.in',
      actorRole: 'APPLICANT',
      detailsJson: JSON.stringify({
        updatedProjectFields: Object.keys(updates.project || {}),
        updatedFactFields: Object.keys(updates.facts || {}),
      }),
    });

    return await analyzeProjectApprovals(projectId);
  } catch (error) {
    console.error('Database query failed in updateProjectIntakeAndFacts:', error);
    throw new Error('Failed to update smart project intake.', { cause: error });
  }
}

export async function simulateProjectChanges(
  projectId: number,
  overrideFacts: Partial<ProjectProfileInput>,
  actorEmail: string = 'advisor@maharegulate.in'
) {
  try {
    const bundle = await getProjectBundle(projectId);
    if (!bundle) throw new Error('Project not found');
    const rules = await getRulesAsEngineRecords();
    const baseline = buildProfileInputFromProject(bundle.project, bundle.facts);
    const simulated: ProjectProfileInput = {
      ...baseline,
      ...overrideFacts,
    };

    const diff = runWhatIfSimulation(rules, baseline, simulated, '2026-09-30');

    if (diff.changedFacts.length > 0) {
      await db.insert(schema.auditLogs).values({
        organizationId: bundle.project.organizationId,
        projectId,
        entityType: 'SIMULATOR',
        entityId: `SIM-${projectId}-${Date.now()}`,
        action: 'WHAT_IF_SIMULATION_EXECUTED',
        actorEmail,
        actorRole: 'APPLICANT',
        detailsJson: JSON.stringify({
          changedFacts: diff.changedFacts,
          newlyTriggered: diff.newlyTriggeredApprovals.map((a) => a.ruleId),
          removed: diff.removedApprovals.map((a) => a.ruleId),
        }),
      });
    }

    return {
      baseline,
      simulated,
      diff,
    };
  } catch (error) {
    console.error('Database query failed in simulateProjectChanges:', error);
    throw new Error('Failed to run What-If regulatory simulation.', { cause: error });
  }
}

export async function uploadProjectDocument(
  projectId: number,
  payload: {
    title: string;
    category: string;
    documentType: string;
    fileFormat: string;
    extractedFields: Record<string, string>;
    usedByApprovals: string[];
    expiryDate?: string;
    actorEmail: string;
  }
) {
  try {
    const projs = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId));
    const proj = projs[0];
    if (!proj) throw new Error('Project not found');

    // Note: OCR output is NEVER treated as automatically verified -> status starts at EXTRACTED / USER_REVIEW
    const [inserted] = await db
      .insert(schema.documents)
      .values({
        projectId,
        organizationId: proj.organizationId,
        title: payload.title,
        category: payload.category,
        documentType: payload.documentType,
        fileFormat: payload.fileFormat || 'PDF',
        version: 1,
        status: 'USER_REVIEW',
        extractedFieldsJson: JSON.stringify(payload.extractedFields || {}),
        verifiedFieldsJson: JSON.stringify({}),
        usedByApprovalsJson: JSON.stringify(payload.usedByApprovals || []),
        expiryDate: payload.expiryDate || null,
        uploadedDate: '2026-09-30',
        dataLabel: 'USER UPLOADED',
      })
      .returning();

    await db.insert(schema.documentVersions).values({
      documentId: inserted.id,
      versionNumber: 1,
      fileName: `${payload.title.replace(/[^a-zA-Z0-9]/g, '_')}_v1.${(payload.fileFormat || 'pdf').toLowerCase()}`,
      status: 'USER_REVIEW',
      uploadedByEmail: payload.actorEmail,
      changeSummary: 'Uploaded and OCR fields extracted; awaiting human verification.',
    });

    await db.insert(schema.auditLogs).values({
      organizationId: proj.organizationId,
      projectId,
      entityType: 'DOCUMENT',
      entityId: String(inserted.id),
      action: 'DOCUMENT_UPLOADED_FOR_REVIEW',
      actorEmail: payload.actorEmail,
      actorRole: 'APPLICANT',
      detailsJson: JSON.stringify({ title: inserted.title, status: inserted.status }),
    });

    return inserted;
  } catch (error) {
    console.error('Database query failed in uploadProjectDocument:', error);
    throw new Error('Failed to upload document.', { cause: error });
  }
}

export async function verifyOrUpdateDocument(
  documentId: number,
  payload: {
    status: 'VERIFIED' | 'REJECTED' | 'USER_REVIEW';
    verifiedFields: Record<string, string>;
    resolveValidationCode?: string;
    actorEmail: string;
  }
) {
  try {
    const docs = await db
      .select()
      .from(schema.documents)
      .where(eq(schema.documents.id, documentId));
    const doc = docs[0];
    if (!doc) throw new Error('Document not found');

    const [updated] = await db
      .update(schema.documents)
      .set({
        status: payload.status,
        verifiedFieldsJson: JSON.stringify(payload.verifiedFields || {}),
        version: doc.version + 1,
      })
      .where(eq(schema.documents.id, documentId))
      .returning();

    if (payload.resolveValidationCode) {
      await db
        .update(schema.validationResults)
        .set({
          severity: 'PASS',
          resolved: true,
          documentExtractedValue:
            Object.values(payload.verifiedFields)[0] || 'Verified & Reconciled by User',
          explanation: `Reconciled and human-verified by ${payload.actorEmail} on 2026-09-30.`,
        })
        .where(eq(schema.validationResults.checkCode, payload.resolveValidationCode));
    }

    await db.insert(schema.auditLogs).values({
      organizationId: doc.organizationId,
      projectId: doc.projectId,
      entityType: 'DOCUMENT',
      entityId: String(documentId),
      action: `DOCUMENT_${payload.status}`,
      actorEmail: payload.actorEmail,
      actorRole: 'APPLICANT',
      detailsJson: JSON.stringify({
        documentTitle: doc.title,
        status: payload.status,
        verifiedFields: payload.verifiedFields,
      }),
    });

    return updated;
  } catch (error) {
    console.error('Database query failed in verifyOrUpdateDocument:', error);
    throw new Error('Failed to verify document.', { cause: error });
  }
}

export async function resolveValidationCheckById(
  validationId: number,
  reconciliationNote: string,
  actorEmail: string
) {
  try {
    const rows = await db
      .select()
      .from(schema.validationResults)
      .where(eq(schema.validationResults.id, validationId));
    const row = rows[0];
    if (!row) throw new Error('Validation check not found');

    const [updated] = await db
      .update(schema.validationResults)
      .set({
        severity: 'PASS',
        resolved: true,
        documentExtractedValue: row.declaredFactValue,
        explanation: `Resolved (${reconciliationNote}) — Verified against project facts by ${actorEmail}.`,
      })
      .where(eq(schema.validationResults.id, validationId))
      .returning();

    await db.insert(schema.auditLogs).values({
      projectId: row.projectId,
      entityType: 'VALIDATION',
      entityId: row.checkCode,
      action: 'PREVALIDATION_ISSUE_RESOLVED',
      actorEmail,
      actorRole: 'APPLICANT',
      detailsJson: JSON.stringify({ checkCode: row.checkCode, note: reconciliationNote }),
    });

    return updated;
  } catch (error) {
    console.error('Database query failed in resolveValidationCheckById:', error);
    throw new Error('Failed to resolve validation issue.', { cause: error });
  }
}

export async function getApplicationDetail(applicationId: number) {
  try {
    const apps = await db
      .select()
      .from(schema.applications)
      .where(eq(schema.applications.id, applicationId));
    const application = apps[0];
    if (!application) return null;

    const events = await db
      .select()
      .from(schema.applicationEvents)
      .where(eq(schema.applicationEvents.applicationId, applicationId))
      .orderBy(schema.applicationEvents.id);

    const appQueries = await db
      .select()
      .from(schema.queries)
      .where(eq(schema.queries.applicationId, applicationId))
      .orderBy(desc(schema.queries.id));

    const appDeadlines = await db
      .select()
      .from(schema.deadlines)
      .where(eq(schema.deadlines.applicationId, applicationId));

    const appEscalations = await db
      .select()
      .from(schema.escalations)
      .where(eq(schema.escalations.applicationId, applicationId));

    const rules = await getRulesAsEngineRecords();
    const rule = rules.find((r) => r.ruleId === application.ruleId) || null;

    const projectBundle = await getProjectBundle(application.projectId);

    return {
      application,
      events,
      queries: appQueries,
      deadlines: appDeadlines,
      escalations: appEscalations,
      rule,
      project: projectBundle?.project || null,
      facts: projectBundle?.facts || null,
      documents: projectBundle?.documents || [],
    };
  } catch (error) {
    console.error('Database query failed in getApplicationDetail:', error);
    throw new Error('Failed to load application details.', { cause: error });
  }
}

export async function listAllApplications() {
  try {
    return await db.select().from(schema.applications).orderBy(schema.applications.id);
  } catch (error) {
    console.error('Database query failed in listAllApplications:', error);
    throw new Error('Failed to list applications.', { cause: error });
  }
}

export async function raiseApplicationQuery(
  applicationId: number,
  payload: {
    requiredItem: string;
    detailedQueryText: string;
    actorName: string;
    actorEmail: string;
  }
) {
  try {
    const apps = await db
      .select()
      .from(schema.applications)
      .where(eq(schema.applications.id, applicationId));
    const app = apps[0];
    if (!app) throw new Error('Application not found');

    const nextSnapshot = transitionLegalClock(
      {
        state: app.state as LegalClockState,
        isClockPaused: app.isClockPaused,
        daysElapsed: app.daysElapsed,
        pausedDays: app.pausedDays,
        publishedTimelineDays: app.publishedTimelineDays,
        riskState: app.riskState as 'ON_TRACK' | 'NEAR_DEADLINE' | 'CLOCK_PAUSED' | 'BREACHED' | 'COMPLETED',
      },
      'RAISE_QUERY'
    );

    const queryNumber = `Q-${Math.floor(103 + Math.random() * 800)}`;

    const [createdQuery] = await db
      .insert(schema.queries)
      .values({
        queryNumber,
        applicationId,
        projectId: app.projectId,
        requiredItem: payload.requiredItem,
        detailedQueryText: payload.detailedQueryText,
        raisedBy: payload.actorName,
        raisedDate: '30 Sep 2026',
        status: 'AWAITING_APPLICANT',
        clockStateImpact: 'PAUSED',
      })
      .returning();

    await db
      .update(schema.applications)
      .set({
        state: nextSnapshot.state,
        isClockPaused: nextSnapshot.isClockPaused,
        riskState: nextSnapshot.riskState,
        updatedAt: new Date(),
      })
      .where(eq(schema.applications.id, applicationId));

    await db.insert(schema.applicationEvents).values({
      applicationId,
      eventType: 'QUERY_RAISED_CLOCK_PAUSED',
      fromState: app.state,
      toState: nextSnapshot.state,
      clockStatus: 'PAUSED',
      actorRole: 'OFFICER',
      actorName: payload.actorName,
      eventDate: '2026-09-30',
      notes: `QUERY #${queryNumber} raised: ${payload.requiredItem}. Statutory legal clock PAUSED pending applicant clarification.`,
    });

    await db.insert(schema.auditLogs).values({
      organizationId: app.organizationId,
      projectId: app.projectId,
      entityType: 'QUERY',
      entityId: queryNumber,
      action: 'QUERY_RAISED_CLOCK_PAUSED',
      actorEmail: payload.actorEmail,
      actorRole: 'OFFICER',
      detailsJson: JSON.stringify({
        applicationCode: app.applicationCode,
        queryNumber,
        requiredItem: payload.requiredItem,
      }),
    });

    return createdQuery;
  } catch (error) {
    console.error('Database query failed in raiseApplicationQuery:', error);
    throw new Error('Failed to raise query and pause legal clock.', { cause: error });
  }
}

export async function respondToApplicationQuery(
  applicationId: number,
  payload: {
    queryId: number;
    responseText: string;
    responseDocumentTitle: string;
    actorName: string;
    actorEmail: string;
  }
) {
  try {
    const apps = await db
      .select()
      .from(schema.applications)
      .where(eq(schema.applications.id, applicationId));
    const app = apps[0];
    if (!app) throw new Error('Application not found');

    const qRows = await db
      .select()
      .from(schema.queries)
      .where(eq(schema.queries.id, payload.queryId));
    const q = qRows[0];
    if (!q) throw new Error('Query not found');

    const nextSnapshot = transitionLegalClock(
      {
        state: app.state as LegalClockState,
        isClockPaused: app.isClockPaused,
        daysElapsed: app.daysElapsed,
        pausedDays: app.pausedDays,
        publishedTimelineDays: app.publishedTimelineDays,
        riskState: app.riskState as 'ON_TRACK' | 'NEAR_DEADLINE' | 'CLOCK_PAUSED' | 'BREACHED' | 'COMPLETED',
      },
      'RESPOND_QUERY',
      { additionalPausedDays: 2 }
    );

    const [updatedQuery] = await db
      .update(schema.queries)
      .set({
        status: 'QUERY_RESPONDED',
        clockStateImpact: 'RESUMED',
        responseText: payload.responseText,
        responseDocumentTitle: payload.responseDocumentTitle || 'Clarification_Annex_Verified.pdf',
        respondedDate: '30 Sep 2026',
      })
      .where(eq(schema.queries.id, payload.queryId))
      .returning();

    await db
      .update(schema.applications)
      .set({
        state: nextSnapshot.state,
        isClockPaused: nextSnapshot.isClockPaused,
        pausedDays: nextSnapshot.pausedDays,
        riskState: nextSnapshot.riskState,
        updatedAt: new Date(),
      })
      .where(eq(schema.applications.id, applicationId));

    await db.insert(schema.applicationEvents).values({
      applicationId,
      eventType: 'QUERY_RESPONDED_CLOCK_RESUMED',
      fromState: app.state,
      toState: nextSnapshot.state,
      clockStatus: 'RUNNING',
      actorRole: 'APPLICANT',
      actorName: payload.actorName,
      eventDate: '2026-09-30',
      notes: `Applicant responded to QUERY #${q.queryNumber} (${payload.responseDocumentTitle}). Legal clock RESUMED.`,
    });

    await db.insert(schema.auditLogs).values({
      organizationId: app.organizationId,
      projectId: app.projectId,
      entityType: 'QUERY',
      entityId: q.queryNumber,
      action: 'QUERY_RESPONDED_CLOCK_RESUMED',
      actorEmail: payload.actorEmail,
      actorRole: 'APPLICANT',
      detailsJson: JSON.stringify({
        applicationCode: app.applicationCode,
        queryNumber: q.queryNumber,
        responseDocumentTitle: payload.responseDocumentTitle,
      }),
    });

    return updatedQuery;
  } catch (error) {
    console.error('Database query failed in respondToApplicationQuery:', error);
    throw new Error('Failed to submit query response.', { cause: error });
  }
}

export async function performApplicationClockAction(
  applicationId: number,
  payload: {
    action: 'SIMULATE_BREACH' | 'APPROVE' | 'REJECT' | 'START_SCRUTINY';
    reason?: string;
    actorName: string;
    actorEmail: string;
    actorRole: string;
  }
) {
  try {
    const apps = await db
      .select()
      .from(schema.applications)
      .where(eq(schema.applications.id, applicationId));
    const app = apps[0];
    if (!app) throw new Error('Application not found');

    const nextSnapshot = transitionLegalClock(
      {
        state: app.state as LegalClockState,
        isClockPaused: app.isClockPaused,
        daysElapsed: app.daysElapsed,
        pausedDays: app.pausedDays,
        publishedTimelineDays: app.publishedTimelineDays,
        riskState: app.riskState as 'ON_TRACK' | 'NEAR_DEADLINE' | 'CLOCK_PAUSED' | 'BREACHED' | 'COMPLETED',
        decisionReason: app.decisionReason,
      },
      payload.action,
      { reason: payload.reason }
    );

    const [updatedApp] = await db
      .update(schema.applications)
      .set({
        state: nextSnapshot.state,
        isClockPaused: nextSnapshot.isClockPaused,
        daysElapsed: nextSnapshot.daysElapsed,
        riskState: nextSnapshot.riskState,
        decisionReason: nextSnapshot.decisionReason ?? app.decisionReason,
        updatedAt: new Date(),
      })
      .where(eq(schema.applications.id, applicationId))
      .returning();

    const clockStatusMap: Record<string, string> = {
      SIMULATE_BREACH: 'BREACHED',
      APPROVE: 'STOPPED',
      REJECT: 'STOPPED',
      START_SCRUTINY: 'RUNNING',
    };

    await db.insert(schema.applicationEvents).values({
      applicationId,
      eventType: `CLOCK_${payload.action}`,
      fromState: app.state,
      toState: nextSnapshot.state,
      clockStatus: clockStatusMap[payload.action] || 'RUNNING',
      actorRole: payload.actorRole,
      actorName: payload.actorName,
      eventDate: '2026-09-30',
      notes:
        payload.action === 'SIMULATE_BREACH'
          ? `[SIMULATION] Statutory timeline of ${app.publishedTimelineDays} days breached (${nextSnapshot.daysElapsed} net days elapsed). Does NOT result in automatic approval; check applicable statutory escalation mechanism under rule ${app.ruleId}.`
          : `Application ${nextSnapshot.state}: ${payload.reason || 'State updated'}`,
    });

    if (payload.action === 'SIMULATE_BREACH') {
      const rules = await getRulesAsEngineRecords();
      const rule = rules.find((r) => r.ruleId === app.ruleId);
      const escCode = `ESC-2026-${Math.floor(110 + Math.random() * 800)}`;

      await db.insert(schema.escalations).values({
        escalationCode: escCode,
        applicationId: app.id,
        projectId: app.projectId,
        approvalName: app.approvalName,
        authority: app.authority,
        ruleId: app.ruleId,
        submissionDate: app.submittedDate || '2026-08-01',
        completenessDate: app.completenessDate || '2026-08-04',
        statutoryDeadlineDate: app.deadlineDate || '2026-09-29',
        daysElapsedNet: nextSnapshot.daysElapsed,
        relevantLegalProvision:
          rule?.escalationMechanism.act
            ? `${rule.escalationMechanism.act} — ${rule.escalationMechanism.section}`
            : 'Maharashtra Right to Public Services Act, 2015 — Section 9 (First Appeal)',
        designatedAppellateOfficer:
          rule?.escalationMechanism.appellateAuthority ||
          'Designated First Appellate Authority under Maharashtra RTS Act',
        escalationMechanismSummary:
          rule?.escalationMechanism.summary ||
          'Statutory timeline breached. File Form-A First Appeal before Designated Appellate Authority.',
        dossierPayloadJson: JSON.stringify({
          applicationCode: app.applicationCode,
          applicant: app.applicantName,
          ruleId: app.ruleId,
          statutoryTimelineDays: app.publishedTimelineDays,
          netWorkingDaysElapsed: nextSnapshot.daysElapsed,
          pausedDaysExcluded: app.pausedDays,
          note: 'SIMULATION — Generated escalation dossier with full audit trail.',
        }),
        status: 'DOSSIER_GENERATED',
      });
    }

    await db.insert(schema.auditLogs).values({
      organizationId: app.organizationId,
      projectId: app.projectId,
      entityType: 'APPLICATION',
      entityId: app.applicationCode,
      action: `APPLICATION_${payload.action}`,
      actorEmail: payload.actorEmail,
      actorRole: payload.actorRole,
      detailsJson: JSON.stringify({
        fromState: app.state,
        toState: nextSnapshot.state,
        reason: payload.reason,
      }),
    });

    return updatedApp;
  } catch (error) {
    console.error('Database query failed in performApplicationClockAction:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to transition application state.', {
      cause: error,
    });
  }
}

// Admin: Rules, Sources, Conflicts, Audit
export async function listAdminData() {
  try {
    const rules = await db.select().from(schema.approvalRules).orderBy(schema.approvalRules.id);
    const versions = await db
      .select()
      .from(schema.ruleVersions)
      .orderBy(desc(schema.ruleVersions.id));
    const sources = await db
      .select()
      .from(schema.regulatorySources)
      .orderBy(schema.regulatorySources.id);
    const conflicts = await db
      .select()
      .from(schema.regulatoryConflicts)
      .orderBy(schema.regulatoryConflicts.id);
    const audits = await db
      .select()
      .from(schema.auditLogs)
      .orderBy(desc(schema.auditLogs.id));
    const approvalsCatalogue = await db
      .select()
      .from(schema.approvals)
      .orderBy(schema.approvals.id);

    return {
      rules,
      versions,
      sources,
      conflicts,
      audits,
      approvalsCatalogue,
    };
  } catch (error) {
    console.error('Database query failed in listAdminData:', error);
    throw new Error('Failed to load admin governance data.', { cause: error });
  }
}

export async function createOrVersionRule(payload: {
  ruleId: string;
  approvalRef: string;
  authority: string;
  stage: string;
  whenJson: string;
  triggerFactsJson: string;
  whyExplanation: string;
  dependenciesJson: string;
  documentsJson: string;
  legalBasisJson: string;
  timelineJson: string;
  escalationMechanismJson: string;
  effectiveFrom: string;
  effectiveUntil: string | null;
  sourceCode: string;
  verificationStatus: string;
  isActive: boolean;
  changeNotes: string;
  actorEmail: string;
}) {
  try {
    const existingRows = await db
      .select()
      .from(schema.approvalRules)
      .where(eq(schema.approvalRules.ruleId, payload.ruleId));
    const existing = existingRows[0];

    if (existing) {
      // Never overwrite old rules without preserving immutable snapshot in rule_versions
      const nextVersion = existing.version + 1;
      await db.insert(schema.ruleVersions).values({
        ruleId: existing.ruleId,
        versionNumber: existing.version,
        ruleSnapshotJson: JSON.stringify(existing),
        changeNotes: `Archived prior to v${nextVersion}: ${payload.changeNotes}`,
        actorEmail: payload.actorEmail,
      });

      const [updated] = await db
        .update(schema.approvalRules)
        .set({
          authority: payload.authority,
          stage: payload.stage,
          whenJson: payload.whenJson,
          triggerFactsJson: payload.triggerFactsJson,
          whyExplanation: payload.whyExplanation,
          dependenciesJson: payload.dependenciesJson,
          documentsJson: payload.documentsJson,
          legalBasisJson: payload.legalBasisJson,
          timelineJson: payload.timelineJson,
          escalationMechanismJson: payload.escalationMechanismJson,
          effectiveFrom: payload.effectiveFrom,
          effectiveUntil: payload.effectiveUntil,
          sourceCode: payload.sourceCode,
          lastVerified: '2026-09-30',
          verificationStatus: payload.verificationStatus,
          isActive: payload.isActive,
          version: nextVersion,
        })
        .where(eq(schema.approvalRules.ruleId, payload.ruleId))
        .returning();

      await db.insert(schema.ruleVersions).values({
        ruleId: updated.ruleId,
        versionNumber: nextVersion,
        ruleSnapshotJson: JSON.stringify(updated),
        changeNotes: payload.changeNotes,
        actorEmail: payload.actorEmail,
      });

      await db.insert(schema.auditLogs).values({
        entityType: 'RULE',
        entityId: updated.ruleId,
        action: `RULE_VERSIONED_V${nextVersion}`,
        actorEmail: payload.actorEmail,
        actorRole: 'ADMIN',
        detailsJson: JSON.stringify({
          ruleId: updated.ruleId,
          version: nextVersion,
          changeNotes: payload.changeNotes,
          isActive: updated.isActive,
          verificationStatus: updated.verificationStatus,
        }),
      });

      return updated;
    } else {
      const [created] = await db
        .insert(schema.approvalRules)
        .values({
          ruleId: payload.ruleId,
          approvalRef: payload.approvalRef,
          authority: payload.authority,
          stage: payload.stage,
          whenJson: payload.whenJson,
          triggerFactsJson: payload.triggerFactsJson,
          whyExplanation: payload.whyExplanation,
          dependenciesJson: payload.dependenciesJson,
          parallelWithJson: '[]',
          documentsJson: payload.documentsJson,
          legalBasisJson: payload.legalBasisJson,
          timelineJson: payload.timelineJson,
          escalationMechanismJson: payload.escalationMechanismJson,
          effectiveFrom: payload.effectiveFrom,
          effectiveUntil: payload.effectiveUntil,
          sourceCode: payload.sourceCode,
          lastVerified: '2026-09-30',
          verificationStatus: payload.verificationStatus,
          isActive: payload.isActive,
          version: 1,
        })
        .returning();

      await db.insert(schema.ruleVersions).values({
        ruleId: created.ruleId,
        versionNumber: 1,
        ruleSnapshotJson: JSON.stringify(created),
        changeNotes: payload.changeNotes || 'Initial rule creation',
        actorEmail: payload.actorEmail,
      });

      await db.insert(schema.auditLogs).values({
        entityType: 'RULE',
        entityId: created.ruleId,
        action: 'RULE_CREATED_V1',
        actorEmail: payload.actorEmail,
        actorRole: 'ADMIN',
        detailsJson: JSON.stringify({
          ruleId: created.ruleId,
          approvalRef: created.approvalRef,
          sourceCode: created.sourceCode,
        }),
      });

      return created;
    }
  } catch (error) {
    console.error('Database query failed in createOrVersionRule:', error);
    throw new Error('Failed to save or version regulatory rule.', { cause: error });
  }
}

export async function createOrUpdateSource(payload: {
  sourceCode: string;
  name: string;
  authority: string;
  url: string;
  actName: string;
  sectionRef: string;
  publicationDate: string;
  effectiveDate: string;
  verificationStatus: string;
  changeWorkflowStage: string;
  affectedRulesJson: string;
  affectedApprovalsJson: string;
  summaryNotes: string;
  actorEmail: string;
}) {
  try {
    const existingRows = await db
      .select()
      .from(schema.regulatorySources)
      .where(eq(schema.regulatorySources.sourceCode, payload.sourceCode));
    const existing = existingRows[0];

    if (existing) {
      const [updated] = await db
        .update(schema.regulatorySources)
        .set({
          name: payload.name,
          authority: payload.authority,
          url: payload.url,
          actName: payload.actName,
          sectionRef: payload.sectionRef,
          publicationDate: payload.publicationDate,
          effectiveDate: payload.effectiveDate,
          lastVerified: '2026-09-30',
          verificationStatus: payload.verificationStatus,
          changeWorkflowStage: payload.changeWorkflowStage,
          affectedRulesJson: payload.affectedRulesJson,
          affectedApprovalsJson: payload.affectedApprovalsJson,
          summaryNotes: payload.summaryNotes,
        })
        .where(eq(schema.regulatorySources.sourceCode, payload.sourceCode))
        .returning();

      await db.insert(schema.auditLogs).values({
        entityType: 'SOURCE',
        entityId: updated.sourceCode,
        action: `SOURCE_WORKFLOW_${payload.changeWorkflowStage}`,
        actorEmail: payload.actorEmail,
        actorRole: 'ADMIN',
        detailsJson: JSON.stringify({
          sourceCode: updated.sourceCode,
          verificationStatus: updated.verificationStatus,
          workflowStage: updated.changeWorkflowStage,
        }),
      });
      return updated;
    } else {
      const [created] = await db
        .insert(schema.regulatorySources)
        .values({
          sourceCode: payload.sourceCode,
          name: payload.name,
          authority: payload.authority,
          url: payload.url,
          actName: payload.actName,
          sectionRef: payload.sectionRef,
          publicationDate: payload.publicationDate,
          effectiveDate: payload.effectiveDate,
          lastVerified: '2026-09-30',
          verificationStatus: payload.verificationStatus,
          changeWorkflowStage: payload.changeWorkflowStage,
          affectedRulesJson: payload.affectedRulesJson,
          affectedApprovalsJson: payload.affectedApprovalsJson,
          summaryNotes: payload.summaryNotes,
        })
        .returning();

      await db.insert(schema.auditLogs).values({
        entityType: 'SOURCE',
        entityId: created.sourceCode,
        action: 'REGULATORY_SOURCE_ADDED',
        actorEmail: payload.actorEmail,
        actorRole: 'ADMIN',
        detailsJson: JSON.stringify({
          sourceCode: created.sourceCode,
          authority: created.authority,
          workflowStage: created.changeWorkflowStage,
        }),
      });
      return created;
    }
  } catch (error) {
    console.error('Database query failed in createOrUpdateSource:', error);
    throw new Error('Failed to save regulatory source.', { cause: error });
  }
}
