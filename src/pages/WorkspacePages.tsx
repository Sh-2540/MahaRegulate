import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  ArrowRight,
  Building2,
  FolderKanban,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sliders,
  Plus,
  ShieldAlert,
} from 'lucide-react';
import { apiFetch } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Organization, Project, RuleEvaluation, ApplicationRecord, ValidationResult } from '../types/regulatory.ts';

const DEMO_WALKTHROUGH_STEPS = [
  { step: '01', title: 'Create Company & Project', path: '/organizations', desc: 'Aarogya APIs Pvt Ltd · Bulk Drug Unit' },
  { step: '02', title: 'Enter Smart Project Facts', path: '/projects/1/intake', desc: '120 Direct + 60 Contract · 140 kVA · ₹45 Cr' },
  { step: '03', title: 'Generate Approval Analysis', path: '/projects/1/approvals', desc: 'Why each approval applies & trigger facts' },
  { step: '04', title: 'Inspect Conflict Detector', path: '/projects/1/approvals', desc: 'MPCB CTE 120d vs 60d RTS vs 45d circular' },
  { step: '05', title: 'Dependency Graph & Parallel Paths', path: '/projects/1/journey', desc: 'React Flow critical path & parallel approvals' },
  { step: '06', title: 'Document Vault & Contradictions', path: '/projects/1/documents', desc: '140 kVA vs 185 kVA load mismatch & missing doc' },
  { step: '07', title: 'Application Readiness Gate', path: '/projects/1/readiness', desc: 'Category checks: Not ready for submission' },
  { step: '08', title: 'Query #Q-102 & Legal Clock Pause', path: '/officer/applications/4', desc: 'Respond to query to resume legal clock' },
  { step: '09', title: 'Deadline Breach & Escalation Dossier', path: '/officer/applications/3', desc: 'Maharashtra RTS Act Sec 9 First Appeal dossier' },
  { step: '10', title: 'What-If Simulator (140 → 250 kVA)', path: '/projects/1/simulator', desc: 'Triggers CEIG HT Approval (PWR-CEIG-HT-008)' },
  { step: '11', title: 'Renewals, Inspections & PSI Incentives', path: '/projects/1/compliance', desc: 'Renewal calendar & PSI Stamp/Electricity Duty' },
  { step: '12', title: 'Admin Rules, Sources & Unit Tests', path: '/admin', desc: 'Versioned rules, audit logs & 9 unit tests' },
];

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeRole, activeOrgId } = useAuth();
  const [bundle, setBundle] = useState<{
    project: Project;
    organization: Organization;
    evaluation: {
      requiredApprovals: RuleEvaluation[];
      potentialReviewApprovals: RuleEvaluation[];
      externalApprovals: RuleEvaluation[];
      notApplicableApprovals: RuleEvaluation[];
    };
    applications: ApplicationRecord[];
    validations: ValidationResult[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiFetch<any>('/api/projects/1', { activeRole, activeOrgId: 1 })
      .then((data) => setBundle(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [activeRole, activeOrgId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 bg-white border border-slate-200 rounded-lg animate-pulse" />
        <div className="h-64 bg-white border border-slate-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (error || !bundle) {
    return (
      <div className="p-6 bg-white border border-red-200 rounded-lg text-sm text-red-700">
        Unable to load dashboard: {error}
      </div>
    );
  }

  const unresolvedValidations = bundle.validations.filter(
    (v) => (v.severity === 'FAIL' || v.severity === 'WARNING') && !v.resolved
  );
  const breachedApps = bundle.applications.filter((a) => a.state === 'BREACHED');
  const pausedApps = bundle.applications.filter((a) => a.isClockPaused);

  const chartData = bundle.evaluation.requiredApprovals.map((a) => ({
    name: a.approvalRef.replace('MIDC_', '').replace('DISH_', ''),
    days: a.publishedTimelineDays,
  }));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span>{bundle.project.dataLabel}</span>
            <span>·</span>
            <span>Active Role: {activeRole}</span>
            <span>·</span>
            <span>PAN: {bundle.organization?.pan}</span>
            <span>·</span>
            <span>GSTIN: {bundle.organization?.gstin}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {bundle.organization?.name} — {bundle.project.name}
          </h1>
          <p className="text-sm text-slate-600">
            {bundle.project.location} · {bundle.project.plotDetails} · Fixed Capital Investment: ₹{bundle.project.fixedCapitalInvestmentCr} Cr
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => navigate('/projects/1/intake')}
            className="px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap"
          >
            Edit Smart Intake
          </button>
          <button
            onClick={() => navigate('/projects/1/simulator')}
            className="px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 hover:bg-slate-50 flex items-center gap-1.5 whitespace-nowrap"
          >
            <Sliders className="w-3.5 h-3.5" />
            What-If Simulator
          </button>
          <button
            onClick={() => navigate('/projects/1/approvals')}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 flex items-center gap-1.5 whitespace-nowrap"
          >
            View Approval Analysis
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* High-Density KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs text-slate-500">Required Approvals</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {bundle.evaluation.requiredApprovals.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            +{bundle.evaluation.externalApprovals.length} External (PESO) · +{bundle.evaluation.potentialReviewApprovals.length} Review
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs text-slate-500">Document Contradictions</div>
          <div className="text-2xl font-bold text-amber-700 font-mono tabular-nums mt-1">
            {unresolvedValidations.length}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            Power mismatch (140 vs 185 kVA) & missing doc
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs text-slate-500">Legal Clocks Paused</div>
          <div className="text-2xl font-bold text-sky-800 font-mono tabular-nums mt-1">
            {pausedApps.length}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            QUERY #Q-102 on MPCB CTE
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs text-slate-500">Deadlines Breached</div>
          <div className="text-2xl font-bold text-red-700 font-mono tabular-nums mt-1">
            {breachedApps.length}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            DISH Plan (65d / 60d) · RTS Sec 9 Eligible
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-xs text-slate-500">Regulatory Conflicts</div>
          <div className="text-2xl font-bold text-amber-700 font-mono tabular-nums mt-1">
            3
          </div>
          <div className="text-xs text-slate-600 mt-1">
            Multi-source timeline variances flagged
          </div>
        </div>
      </div>

      {/* Main Two-Column Grid: 20-Step Demo Scenario Walkthrough + Statutory Timelines Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Interactive Demo Scenario Walkthrough (Aarogya APIs Pvt Ltd)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any step to inspect the live PostgreSQL-backed workflow.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">12 MODULES</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DEMO_WALKTHROUGH_STEPS.map((item) => (
              <Link
                key={item.step}
                to={item.path}
                className="p-3 border border-slate-200 rounded-lg hover:border-slate-900 hover:bg-slate-50 transition-colors flex items-start justify-between gap-2"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-900">
                    <span className="font-mono text-sky-800 mr-1.5">{item.step}.</span>
                    {item.title}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              </Link>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Published Statutory Timelines (Days)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Derived from verified Maharashtra RTS notifications & departmental acts.
            </p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 12, left: -16, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#475569' }}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip />
                <Bar dataKey="days" fill="#0f172a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong>Conflict Detector Active:</strong> MPCB CTE shows 120 days (Water Act Sec 25(7)), 60 working days (RTS Notification), and 45 days (MPCB Circular).{' '}
              <Link to="/projects/1/approvals" className="underline font-semibold">
                Inspect Conflict →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Active Applications & Legal Clock Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Application Status & Statutory Legal Clock Tracker
            </h2>
            <p className="text-xs text-slate-500">
              Real-time state machine tracking completeness, query pauses, and RTS escalation eligibility.
            </p>
          </div>
          <Link
            to="/projects/1/applications"
            className="text-xs font-semibold text-sky-800 hover:underline"
          >
            Open Full Legal Clock View →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">Application Code</th>
                <th className="py-3 px-4">Approval Name</th>
                <th className="py-3 px-4">Authority</th>
                <th className="py-3 px-4">State</th>
                <th className="py-3 px-4 text-right">Days Elapsed / Published</th>
                <th className="py-3 px-4">Clock Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {bundle.applications.slice(0, 6).map((app) => (
                <tr key={app.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-medium text-slate-900">
                    {app.applicationCode}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900">{app.approvalName}</td>
                  <td className="py-3 px-4 text-slate-600">{app.authority}</td>
                  <td className="py-3 px-4 font-mono">
                    <span
                      className={
                        app.state === 'BREACHED'
                          ? 'text-red-700 font-semibold'
                          : app.state === 'QUERY_RAISED'
                          ? 'text-amber-700 font-semibold'
                          : app.state === 'APPROVED'
                          ? 'text-emerald-700 font-semibold'
                          : 'text-slate-700'
                      }
                    >
                      {app.state}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums">
                    {app.daysElapsed}d / {app.publishedTimelineDays}d
                    {app.pausedDays > 0 && ` (+${app.pausedDays}d paused)`}
                  </td>
                  <td className="py-3 px-4">
                    {app.isClockPaused ? (
                      <span className="text-amber-700 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> PAUSED (Query #Q-102)
                      </span>
                    ) : app.state === 'BREACHED' ? (
                      <span className="text-red-700 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> DEADLINE BREACHED
                      </span>
                    ) : app.state === 'APPROVED' ? (
                      <span className="text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> COMPLETED
                      </span>
                    ) : (
                      <span className="text-slate-600">ACTIVE</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/officer/applications/${app.id}`}
                      className="text-sky-800 font-semibold hover:underline"
                    >
                      Inspect →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Organizations & Create Company Page (/organizations)
export const OrganizationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    orgName: '',
    constitution: 'Private Limited Company',
    pan: 'AABCK5519P',
    gstin: '27AABCK5519P1Z2',
    udyamNumber: 'UDYAM-MH-33-0019283',
    projectName: 'Specialty API & Fine Chemicals Unit',
    industry: 'Pharmaceuticals & APIs',
    product: 'Specialty Active Pharmaceutical Ingredients',
    manufacturingProcess: 'Chemical Synthesis & Purification',
    location: 'Roha MIDC Industrial Area, Raigad, Maharashtra',
    district: 'Raigad',
    isMidc: true,
    plotDetails: 'Plot No. D-18, Roha MIDC',
    fixedCapitalInvestmentCr: '32.00',
    landAreaSqm: 8000,
    builtUpAreaSqm: 4200,
  });

  const loadOrgs = () => {
    apiFetch<Organization[]>('/api/organizations').then(setOrgs);
  };

  useEffect(() => {
    loadOrgs();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.orgName.trim()) return;
    setSubmitting(true);
    try {
      const created = await apiFetch<{ organization: Organization; project: Project }>(
        '/api/projects',
        {
          method: 'POST',
          body: JSON.stringify(form),
        }
      );
      setShowCreate(false);
      loadOrgs();
      navigate(`/projects/${created.project.id}/intake`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg p-6 flex items-center justify-between">
        <div>
          <div className="text-xs font-mono text-sky-800">STEP 01 · TENANT & COMPANY REGISTRY</div>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">
            Registered Industrial Organizations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Each organization is strictly isolated at the tenant level. Legal advisors can review multiple companies with explicit authorization.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 flex items-center gap-1.5 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Create Company & Project
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="bg-white border border-slate-200 rounded-lg p-6 space-y-4"
        >
          <h2 className="text-base font-bold text-slate-900">
            Create New Industrial Company & Project
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Company Name *</label>
              <input
                type="text"
                required
                value={form.orgName}
                onChange={(e) => setForm({ ...form, orgName: e.target.value })}
                placeholder="e.g., Deccan Bioactives Pvt Ltd"
                className="w-full border border-slate-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Constitution</label>
              <select
                value={form.constitution}
                onChange={(e) => setForm({ ...form, constitution: e.target.value })}
                className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white"
              >
                <option>Private Limited Company</option>
                <option>Public Limited Company</option>
                <option>Limited Liability Partnership (LLP)</option>
                <option>Partnership Firm</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">PAN</label>
              <input
                type="text"
                required
                value={form.pan}
                onChange={(e) => setForm({ ...form, pan: e.target.value })}
                className="w-full border border-slate-300 rounded-md px-3 py-2 font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">GSTIN (Maharashtra 27)</label>
              <input
                type="text"
                required
                value={form.gstin}
                onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                className="w-full border border-slate-300 rounded-md px-3 py-2 font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Udyam Number</label>
              <input
                type="text"
                value={form.udyamNumber}
                onChange={(e) => setForm({ ...form, udyamNumber: e.target.value })}
                className="w-full border border-slate-300 rounded-md px-3 py-2 font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Initial Project Name *</label>
              <input
                type="text"
                required
                value={form.projectName}
                onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                className="w-full border border-slate-300 rounded-md px-3 py-2"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
            >
              {submitting ? 'Creating...' : 'Create & Launch Smart Intake →'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
              <th className="py-3 px-4">Org ID</th>
              <th className="py-3 px-4">Company Name</th>
              <th className="py-3 px-4">Constitution</th>
              <th className="py-3 px-4">PAN</th>
              <th className="py-3 px-4">GSTIN</th>
              <th className="py-3 px-4">Udyam Number</th>
              <th className="py-3 px-4">Data Label</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs">
            {orgs.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50">
                <td className="py-3 px-4 font-mono">#{o.id}</td>
                <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  {o.name}
                </td>
                <td className="py-3 px-4 text-slate-600">{o.constitution}</td>
                <td className="py-3 px-4 font-mono">{o.pan}</td>
                <td className="py-3 px-4 font-mono">{o.gstin}</td>
                <td className="py-3 px-4 font-mono">{o.udyamNumber || '—'}</td>
                <td className="py-3 px-4 font-mono text-amber-800">{o.dataLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Projects List Page (/projects)
export const ProjectsListPage: React.FC = () => {
  const { activeRole, activeOrgId } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tenantAlert, setTenantAlert] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch<Project[]>('/api/projects').then(setProjects);
  }, []);

  const handleOpenProject = async (proj: Project) => {
    if (activeRole === 'APPLICANT' && activeOrgId !== proj.organizationId) {
      setTenantAlert(
        `Tenant Isolation Enforced: You are currently acting as Applicant for Organization #${activeOrgId} and cannot access Organization #${proj.organizationId} (${proj.organization?.name}) documents or project records. Switch role to Legal Advisor or switch active Tenant in the top bar.`
      );
      return;
    }
    setTenantAlert(null);
    navigate(`/projects/${proj.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg p-6 flex items-center justify-between">
        <div>
          <div className="text-xs font-mono text-sky-800">STEP 02 · INDUSTRIAL PROJECT PORTFOLIO</div>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">
            Maharashtra Industrial Projects
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Select a project to configure Smart Intake, run deterministic regulatory rules, or simulate project changes.
          </p>
        </div>
        <Link
          to="/organizations"
          className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 flex items-center gap-1.5 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          New Project
        </Link>
      </div>

      {tenantAlert && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
          <div>{tenantAlert}</div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((p) => (
          <div
            key={p.id}
            className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                <span>
                  Project #{p.id} · Org #{p.organizationId} ({p.organization?.name})
                </span>
                <span className="text-amber-700">{p.dataLabel}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-sky-800" />
                {p.name}
              </h2>
              <p className="text-xs text-slate-600">
                {p.product} · {p.location}
              </p>

              <div className="pt-2 grid grid-cols-3 gap-2 border-t border-slate-100 text-xs">
                <div>
                  <div className="text-slate-500">Investment</div>
                  <div className="font-mono font-semibold text-slate-900">
                    ₹{p.fixedCapitalInvestmentCr} Cr
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Power / Workers</div>
                  <div className="font-mono font-semibold text-slate-900">
                    {p.facts?.powerKva ?? 140} kVA / {(p.facts?.directWorkers ?? 120) + (p.facts?.contractWorkers ?? 60)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">MIDC / Hazardous</div>
                  <div className="font-mono font-semibold text-slate-900">
                    {p.isMidc ? 'MIDC' : 'Non-MIDC'} · {p.facts?.hasHazardousProcess ? 'Haz: Yes' : 'No'}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleOpenProject(p)}
                className="px-3.5 py-2 bg-slate-900 text-white text-xs font-semibold rounded-md hover:bg-slate-800"
              >
                Open Project Hub →
              </button>
              <Link
                to={`/projects/${p.id}/intake`}
                className="px-3 py-2 border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Smart Intake
              </Link>
              <Link
                to={`/projects/${p.id}/approvals`}
                className="px-3 py-2 border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Approvals
              </Link>
              <Link
                to={`/projects/${p.id}/simulator`}
                className="px-3 py-2 border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Simulator
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Single Project Hub Page (/projects/:id)
export const ProjectHubPage: React.FC = () => {
  const { id } = useParams();
  const projectId = Number(id) || 1;
  const { activeRole, activeOrgId } = useAuth();
  const [bundle, setBundle] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    apiFetch<any>(`/api/projects/${projectId}`, { activeRole, activeOrgId })
      .then(setBundle)
      .catch((err) => setError(err.message));
  }, [projectId, activeRole, activeOrgId]);

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-sm text-red-900 space-y-2">
        <div className="font-bold flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-700" />
          Access Restricted by Tenant Isolation
        </div>
        <p>{error}</p>
      </div>
    );
  }

  if (!bundle) {
    return <div className="p-6 bg-white border border-slate-200 rounded-lg text-xs">Loading project hub...</div>;
  }

  const modules = [
    {
      title: '01. Smart Project Intake',
      desc: 'Adaptive 4-step intake (Company, Project, Operations, Environmental) with conditional Boiler, Hazardous Process & MIDC fields.',
      path: `/projects/${projectId}/intake`,
      meta: `Power: ${bundle.facts?.powerKva} kVA · Workers: ${bundle.facts?.directWorkers} Direct + ${bundle.facts?.contractWorkers} Contract`,
    },
    {
      title: '02. Approval Discovery & Conflict Detector',
      desc: 'Rule-by-rule explanation trace, trigger facts, legal basis, dependencies, and multi-source timeline Conflict Detector.',
      path: `/projects/${projectId}/approvals`,
      meta: `${bundle.evaluation?.requiredApprovals?.length || 0} Required · 3 Conflicts Flagged`,
    },
    {
      title: '03. Regulatory Knowledge Graph Journey',
      desc: 'Visual React Flow dependency graph showing critical path, parallel approvals, blocked stages, and renewals.',
      path: `/projects/${projectId}/journey`,
      meta: 'LAND → FIRE → BPA / MPCB CTE / DISH PLAN → BCC → CTO',
    },
    {
      title: '04. Document Vault & Pre-Validation',
      desc: 'Manage 20 documents across 11 categories. Separate OCR extraction from human verification and resolve contradictions.',
      path: `/projects/${projectId}/documents`,
      meta: `${bundle.documents?.length || 0} Documents · Pre-validation checks active`,
    },
    {
      title: '05. Application Readiness Gate',
      desc: 'Deterministic category readiness across Identity, Land, Technical Documents, Environment, and Mandatory Declarations.',
      path: `/projects/${projectId}/readiness`,
      meta: 'Status: Not ready for submission (2 issues)',
    },
    {
      title: '06. Applications, Legal Clock & Escalation',
      desc: 'Track state transitions, Query #Q-102 pause/resume, and DISH Factory Plan deadline breach escalation dossier.',
      path: `/projects/${projectId}/applications`,
      meta: `${bundle.applications?.length || 0} Tracked Applications`,
    },
    {
      title: '07. What-If Regulatory Simulator',
      desc: 'Simulate changing electrical power from 140 kVA to 250 kVA or worker counts and view exact regulatory deltas.',
      path: `/projects/${projectId}/simulator`,
      meta: 'Live Rules Engine Recalculation',
    },
    {
      title: '08. Renewals, Inspections & PSI Incentives',
      desc: 'Compliance renewal calendar, coordinated inspection planner, and Maharashtra PSI 2019 incentive readiness.',
      path: `/projects/${projectId}/compliance`,
      meta: `${bundle.renewals?.length || 0} Renewals · ${bundle.incentives?.length || 0} PSI Incentives`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="text-xs font-mono text-slate-500">
          {bundle.project.dataLabel} · {bundle.organization?.name}
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">{bundle.project.name}</h1>
        <p className="text-sm text-slate-600 mt-1">
          {bundle.project.product} · {bundle.project.location} ({bundle.project.plotDetails})
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map((m) => (
          <Link
            key={m.path}
            to={m.path}
            className="bg-white border border-slate-200 rounded-lg p-5 hover:border-slate-900 transition-colors flex flex-col justify-between space-y-3"
          >
            <div>
              <h2 className="text-base font-bold text-slate-900">{m.title}</h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{m.desc}</p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-mono text-slate-500">{m.meta}</span>
              <span className="font-semibold text-sky-800">Open Module →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
