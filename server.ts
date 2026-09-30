import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { optionalAuth, AuthRequest } from './src/middleware/auth.ts';
import { ensureSeeded } from './src/db/seed.ts';
import {
  getOrCreateUser,
  updateUserRole,
  listOrganizations,
  createOrganizationWithProject,
  listProjects,
  getProjectBundle,
  analyzeProjectApprovals,
  updateProjectIntakeAndFacts,
  simulateProjectChanges,
  uploadProjectDocument,
  verifyOrUpdateDocument,
  resolveValidationCheckById,
  listAllApplications,
  getApplicationDetail,
  raiseApplicationQuery,
  respondToApplicationQuery,
  performApplicationClockAction,
  listAdminData,
  createOrVersionRule,
  createOrUpdateSource,
} from './src/db/repository.ts';
import { answerRegulatoryQuestion } from './src/server/aiAssistant.ts';
import { runAllRegulatoryUnitTests } from './src/server/rulesEngine.test.ts';
import { canAccessTenantResource } from './src/server/rulesEngine.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '5mb' }));

  // Simple rate-limiting middleware for API protection
  const rateCounts = new Map<string, { count: number; resetAt: number }>();
  app.use('/api', (req, res, next) => {
    const key = req.ip || 'global';
    const now = Date.now();
    const record = rateCounts.get(key);
    if (!record || record.resetAt < now) {
      rateCounts.set(key, { count: 1, resetAt: now + 60_000 });
    } else {
      record.count += 1;
      if (record.count > 300) {
        return res.status(429).json({ error: 'Too many requests. Please try again shortly.' });
      }
    }
    next();
  });

  // Ensure seed data is populated on first API request (lazy initialization, no startup probe loops)
  let seeded = false;
  const withSeed = async () => {
    if (!seeded) {
      await ensureSeeded();
      seeded = true;
    }
  };

  // Auth & User Synchronization Endpoint
  app.get('/api/auth/me', optionalAuth, async (req: AuthRequest, res) => {
    try {
      await withSeed();
      if (req.user?.uid && req.user?.email) {
        const dbUser = await getOrCreateUser(req.user.uid, req.user.email, req.user.name);
        return res.json({ authenticated: true, user: dbUser });
      }
      const orgs = await listOrganizations();
      return res.json({
        authenticated: false,
        user: {
          id: 0,
          uid: 'demo-session',
          email: 'rohan.kulkarni@aarogya-apis.in',
          name: 'Rohan Kulkarni (Demo Session)',
          role: 'APPLICANT',
          organizationId: orgs[0]?.id ?? 1,
        },
      });
    } catch (error: any) {
      console.error('Failed in GET /api/auth/me:', error);
      res.status(500).json({ error: error.message || 'Failed to load user profile' });
    }
  });

  app.post('/api/auth/role', optionalAuth, async (req: AuthRequest, res) => {
    try {
      await withSeed();
      const { role, organizationId } = req.body;
      if (req.user?.uid) {
        const updated = await updateUserRole(req.user.uid, role, organizationId);
        return res.json({ user: updated });
      }
      return res.json({
        user: {
          id: 0,
          uid: 'demo-session',
          email: 'rohan.kulkarni@aarogya-apis.in',
          name: 'Rohan Kulkarni',
          role: role || 'APPLICANT',
          organizationId: organizationId || 1,
        },
      });
    } catch (error: any) {
      console.error('Failed in POST /api/auth/role:', error);
      res.status(500).json({ error: error.message || 'Failed to update role' });
    }
  });

  // Organizations
  app.get('/api/organizations', optionalAuth, async (_req: AuthRequest, res) => {
    try {
      await withSeed();
      const orgs = await listOrganizations();
      res.json(orgs);
    } catch (error: any) {
      console.error('Failed in GET /api/organizations:', error);
      res.status(500).json({ error: error.message || 'Failed to list organizations' });
    }
  });

  // Projects
  app.get('/api/projects', optionalAuth, async (_req: AuthRequest, res) => {
    try {
      await withSeed();
      const projects = await listProjects();
      res.json(projects);
    } catch (error: any) {
      console.error('Failed in GET /api/projects:', error);
      res.status(500).json({ error: error.message || 'Failed to list projects' });
    }
  });

  app.post('/api/projects', optionalAuth, async (req: AuthRequest, res) => {
    try {
      await withSeed();
      const actorEmail = req.user?.email || 'rohan.kulkarni@aarogya-apis.in';
      const created = await createOrganizationWithProject({
        ...req.body,
        actorEmail,
      });
      res.status(201).json(created);
    } catch (error: any) {
      console.error('Failed in POST /api/projects:', error);
      res.status(500).json({ error: error.message || 'Failed to create project' });
    }
  });

  app.get('/api/projects/:id', optionalAuth, async (req: AuthRequest, res) => {
    try {
      await withSeed();
      const projectId = Number(req.params.id);
      const bundle = await getProjectBundle(projectId);
      if (!bundle) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Tenant isolation check if query param enforces strict org check
      const reqRole = (req.headers['x-active-role'] as string) || 'APPLICANT';
      const reqOrgId = Number(req.headers['x-active-org-id']) || bundle.project.organizationId;
      if (!canAccessTenantResource(reqRole, reqOrgId, bundle.project.organizationId)) {
        return res.status(403).json({
          error: 'Tenant Isolation Violation: Organization cannot access another tenant project.',
        });
      }

      const analysis = await analyzeProjectApprovals(projectId);
      res.json({
        ...bundle,
        evaluation: analysis.evaluation,
        profileInput: analysis.profileInput,
      });
    } catch (error: any) {
      console.error('Failed in GET /api/projects/:id:', error);
      res.status(500).json({ error: error.message || 'Failed to load project' });
    }
  });

  app.post('/api/projects/:id/analyze', optionalAuth, async (req: AuthRequest, res) => {
    try {
      await withSeed();
      const projectId = Number(req.params.id);
      const actorEmail = req.user?.email || 'rohan.kulkarni@aarogya-apis.in';
      const updatedAnalysis = await updateProjectIntakeAndFacts(projectId, {
        company: req.body.company,
        project: req.body.project,
        facts: req.body.facts,
        actorEmail,
      });
      res.json(updatedAnalysis);
    } catch (error: any) {
      console.error('Failed in POST /api/projects/:id/analyze:', error);
      res.status(500).json({ error: error.message || 'Failed to analyze project' });
    }
  });

  app.get('/api/projects/:id/approvals', optionalAuth, async (req: AuthRequest, res) => {
    try {
      await withSeed();
      const projectId = Number(req.params.id);
      const analysis = await analyzeProjectApprovals(projectId);
      res.json(analysis);
    } catch (error: any) {
      console.error('Failed in GET /api/projects/:id/approvals:', error);
      res.status(500).json({ error: error.message || 'Failed to load project approvals' });
    }
  });

  app.get('/api/projects/:id/journey', optionalAuth, async (req: AuthRequest, res) => {
    try {
      await withSeed();
      const projectId = Number(req.params.id);
      const analysis = await analyzeProjectApprovals(projectId);
      const bundle = await getProjectBundle(projectId);
      res.json({
        project: analysis.project,
        evaluation: analysis.evaluation,
        applications: bundle?.applications || [],
        documents: bundle?.documents || [],
        renewals: bundle?.renewals || [],
      });
    } catch (error: any) {
      console.error('Failed in GET /api/projects/:id/journey:', error);
      res.status(500).json({ error: error.message || 'Failed to load approval journey' });
    }
  });

  // Documents & Pre-Validation
  app.post('/api/projects/:id/documents', optionalAuth, async (req: AuthRequest, res) => {
    try {
      await withSeed();
      const projectId = Number(req.params.id);
      const actorEmail = req.user?.email || 'rohan.kulkarni@aarogya-apis.in';
      const created = await uploadProjectDocument(projectId, {
        ...req.body,
        actorEmail,
      });
      res.status(201).json(created);
    } catch (error: any) {
      console.error('Failed in POST /api/projects/:id/documents:', error);
      res.status(500).json({ error: error.message || 'Failed to upload document' });
    }
  });

  app.post('/api/documents/:id/validate', optionalAuth, async (req: AuthRequest, res) => {
    try {
      await withSeed();
      const documentId = Number(req.params.id);
      const actorEmail = req.user?.email || 'rohan.kulkarni@aarogya-apis.in';
      const updated = await verifyOrUpdateDocument(documentId, {
        status: req.body.status || 'VERIFIED',
        verifiedFields: req.body.verifiedFields || {},
        resolveValidationCode: req.body.resolveValidationCode,
        actorEmail,
      });
      res.json(updated);
    } catch (error: any) {
      console.error('Failed in POST /api/documents/:id/validate:', error);
      res.status(500).json({ error: error.message || 'Failed to validate document' });
    }
  });

  app.post('/api/validations/:id/resolve', optionalAuth, async (req: AuthRequest, res) => {
    try {
      await withSeed();
      const validationId = Number(req.params.id);
      const actorEmail = req.user?.email || 'rohan.kulkarni@aarogya-apis.in';
      const updated = await resolveValidationCheckById(
        validationId,
        req.body.reconciliationNote || 'Verified and reconciled against project records',
        actorEmail
      );
      res.json(updated);
    } catch (error: any) {
      console.error('Failed in POST /api/validations/:id/resolve:', error);
      res.status(500).json({ error: error.message || 'Failed to resolve validation check' });
    }
  });

  app.get('/api/projects/:id/readiness', optionalAuth, async (req: AuthRequest, res) => {
    try {
      await withSeed();
      const projectId = Number(req.params.id);
      const bundle = await getProjectBundle(projectId);
      if (!bundle) return res.status(404).json({ error: 'Project not found' });

      const categories = [
        'IDENTITY',
        'LAND',
        'TECHNICAL_DOCUMENTS',
        'ENVIRONMENT',
        'MANDATORY_DECLARATIONS',
      ].map((cat) => {
        const checks = bundle.validations.filter((v) => v.readinessCategory === cat);
        const hasFail = checks.some((c) => c.severity === 'FAIL' && !c.resolved);
        const hasWarn = checks.some((c) => c.severity === 'WARNING' && !c.resolved);
        return {
          category: cat,
          status: hasFail ? 'FAIL' : hasWarn ? 'WARNING' : 'PASS',
          checks,
        };
      });

      const unresolvedIssues = bundle.validations.filter(
        (v) => (v.severity === 'FAIL' || v.severity === 'WARNING') && !v.resolved
      );

      res.json({
        project: bundle.project,
        readyForSubmission: unresolvedIssues.length === 0,
        statusSummaryText:
          unresolvedIssues.length === 0
            ? 'Ready for submission'
            : 'Not ready for submission',
        unresolvedCount: unresolvedIssues.length,
        categories,
        validations: bundle.validations,
        incentives: bundle.incentives,
      });
    } catch (error: any) {
      console.error('Failed in GET /api/projects/:id/readiness:', error);
      res.status(500).json({ error: error.message || 'Failed to compute application readiness' });
    }
  });

  // Applications, Legal Clock, Queries & Escalations
  app.get('/api/applications', optionalAuth, async (_req: AuthRequest, res) => {
    try {
      await withSeed();
      const apps = await listAllApplications();
      res.json(apps);
    } catch (error: any) {
      console.error('Failed in GET /api/applications:', error);
      res.status(500).json({ error: error.message || 'Failed to list applications' });
    }
  });

  app.get('/api/applications/:id', optionalAuth, async (req: AuthRequest, res) => {
    try {
      await withSeed();
      const applicationId = Number(req.params.id);
      const detail = await getApplicationDetail(applicationId);
      if (!detail) return res.status(404).json({ error: 'Application not found' });
      res.json(detail);
    } catch (error: any) {
      console.error('Failed in GET /api/applications/:id:', error);
      res.status(500).json({ error: error.message || 'Failed to load application detail' });
    }
  });

  app.post('/api/applications/:id/query', optionalAuth, async (req: AuthRequest, res) => {
    try {
      await withSeed();
      const applicationId = Number(req.params.id);
      const actorEmail = req.user?.email || 'scrutiny.officer@maharegulate.in';
      const created = await raiseApplicationQuery(applicationId, {
        requiredItem: req.body.requiredItem,
        detailedQueryText: req.body.detailedQueryText,
        actorName: req.body.actorName || 'Regional Scrutiny Officer (Reviewer Workspace)',
        actorEmail,
      });
      res.status(201).json(created);
    } catch (error: any) {
      console.error('Failed in POST /api/applications/:id/query:', error);
      res.status(500).json({ error: error.message || 'Failed to raise query' });
    }
  });

  app.post('/api/applications/:id/query-response', optionalAuth, async (req: AuthRequest, res) => {
    try {
      await withSeed();
      const applicationId = Number(req.params.id);
      const actorEmail = req.user?.email || 'rohan.kulkarni@aarogya-apis.in';
      const updated = await respondToApplicationQuery(applicationId, {
        queryId: Number(req.body.queryId),
        responseText: req.body.responseText,
        responseDocumentTitle: req.body.responseDocumentTitle,
        actorName: req.body.actorName || 'Rohan Kulkarni (Applicant — Aarogya APIs Pvt Ltd)',
        actorEmail,
      });
      res.json(updated);
    } catch (error: any) {
      console.error('Failed in POST /api/applications/:id/query-response:', error);
      res.status(500).json({ error: error.message || 'Failed to submit query response' });
    }
  });

  app.post('/api/applications/:id/clock-action', optionalAuth, async (req: AuthRequest, res) => {
    try {
      await withSeed();
      const applicationId = Number(req.params.id);
      const actorEmail = req.user?.email || 'reviewer@maharegulate.in';
      const updated = await performApplicationClockAction(applicationId, {
        action: req.body.action,
        reason: req.body.reason,
        actorName: req.body.actorName || 'Authorized Reviewer / Clock Engine',
        actorRole: req.body.actorRole || 'OFFICER',
        actorEmail,
      });
      res.json(updated);
    } catch (error: any) {
      console.error('Failed in POST /api/applications/:id/clock-action:', error);
      res.status(400).json({ error: error.message || 'Failed to perform clock action' });
    }
  });

  app.get('/api/applications/:id/timeline', optionalAuth, async (req: AuthRequest, res) => {
    try {
      await withSeed();
      const applicationId = Number(req.params.id);
      const detail = await getApplicationDetail(applicationId);
      if (!detail) return res.status(404).json({ error: 'Application not found' });
      res.json({
        application: detail.application,
        events: detail.events,
        queries: detail.queries,
        deadlines: detail.deadlines,
        escalations: detail.escalations,
      });
    } catch (error: any) {
      console.error('Failed in GET /api/applications/:id/timeline:', error);
      res.status(500).json({ error: error.message || 'Failed to load application timeline' });
    }
  });

  // What-If Simulator
  app.get('/api/projects/:id/simulator', optionalAuth, async (req: AuthRequest, res) => {
    try {
      await withSeed();
      const projectId = Number(req.params.id);
      // Default demo preview shows the 140 kVA -> 250 kVA power change impact ready to inspect
      const sim = await simulateProjectChanges(projectId, {});
      res.json(sim);
    } catch (error: any) {
      console.error('Failed in GET /api/projects/:id/simulator:', error);
      res.status(500).json({ error: error.message || 'Failed to initialize simulator' });
    }
  });

  app.post('/api/projects/:id/simulator', optionalAuth, async (req: AuthRequest, res) => {
    try {
      await withSeed();
      const projectId = Number(req.params.id);
      const actorEmail = req.user?.email || 'rohan.kulkarni@aarogya-apis.in';
      const sim = await simulateProjectChanges(projectId, req.body.simulatedFacts || {}, actorEmail);
      res.json(sim);
    } catch (error: any) {
      console.error('Failed in POST /api/projects/:id/simulator:', error);
      res.status(500).json({ error: error.message || 'Failed to execute simulation' });
    }
  });

  // Contextual AI Assistant (Backend-Only Gemini API + Knowledge Base Verification)
  app.post('/api/projects/:id/ai-assistant', optionalAuth, async (req: AuthRequest, res) => {
    try {
      await withSeed();
      const projectId = Number(req.params.id);
      const question = String(req.body.question || '').trim();
      if (!question) {
        return res.status(400).json({ error: 'Question is required' });
      }
      const response = await answerRegulatoryQuestion(projectId, question);
      res.json(response);
    } catch (error: any) {
      console.error('Failed in POST /api/projects/:id/ai-assistant:', error);
      res.status(500).json({ error: error.message || 'Failed to process AI assistant query' });
    }
  });

  // Admin Governance Routes
  app.get('/api/admin/rules', optionalAuth, async (_req: AuthRequest, res) => {
    try {
      await withSeed();
      const data = await listAdminData();
      res.json({
        rules: data.rules,
        versions: data.versions,
        approvalsCatalogue: data.approvalsCatalogue,
      });
    } catch (error: any) {
      console.error('Failed in GET /api/admin/rules:', error);
      res.status(500).json({ error: error.message || 'Failed to load rules' });
    }
  });

  app.post('/api/admin/rules', optionalAuth, async (req: AuthRequest, res) => {
    try {
      await withSeed();
      const actorEmail = req.user?.email || 'admin@maharegulate.in';
      const saved = await createOrVersionRule({
        ...req.body,
        actorEmail,
      });
      res.status(201).json(saved);
    } catch (error: any) {
      console.error('Failed in POST /api/admin/rules:', error);
      res.status(500).json({ error: error.message || 'Failed to save rule' });
    }
  });

  app.get('/api/admin/sources', optionalAuth, async (_req: AuthRequest, res) => {
    try {
      await withSeed();
      const data = await listAdminData();
      res.json({
        sources: data.sources,
        conflicts: data.conflicts,
      });
    } catch (error: any) {
      console.error('Failed in GET /api/admin/sources:', error);
      res.status(500).json({ error: error.message || 'Failed to load sources' });
    }
  });

  app.post('/api/admin/sources', optionalAuth, async (req: AuthRequest, res) => {
    try {
      await withSeed();
      const actorEmail = req.user?.email || 'admin@maharegulate.in';
      const saved = await createOrUpdateSource({
        ...req.body,
        actorEmail,
      });
      res.status(201).json(saved);
    } catch (error: any) {
      console.error('Failed in POST /api/admin/sources:', error);
      res.status(500).json({ error: error.message || 'Failed to save regulatory source' });
    }
  });

  app.get('/api/admin/audit', optionalAuth, async (_req: AuthRequest, res) => {
    try {
      await withSeed();
      const data = await listAdminData();
      res.json(data.audits);
    } catch (error: any) {
      console.error('Failed in GET /api/admin/audit:', error);
      res.status(500).json({ error: error.message || 'Failed to load audit logs' });
    }
  });

  app.get('/api/admin/unit-tests', optionalAuth, async (_req: AuthRequest, res) => {
    try {
      const results = runAllRegulatoryUnitTests();
      res.json({
        executedAt: '2026-09-30T00:00:00Z',
        total: results.length,
        passedCount: results.filter((r) => r.passed).length,
        results,
      });
    } catch (error: any) {
      console.error('Failed in GET /api/admin/unit-tests:', error);
      res.status(500).json({ error: error.message || 'Failed to run unit tests' });
    }
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MahaRegulate full-stack server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
