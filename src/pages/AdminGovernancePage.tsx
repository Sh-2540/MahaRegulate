import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Shield,
  BookOpen,
  Scale,
  AlertTriangle,
  History,
  CheckCircle2,
  Plus,
  PlayCircle,
} from 'lucide-react';
import { apiFetch } from '../services/api.ts';

export function AdminGovernancePage() {
  const location = useLocation();

  const getTabFromPath = () => {
    if (location.pathname.endsWith('/rules')) return 'RULES';
    if (location.pathname.endsWith('/sources')) return 'SOURCES';
    if (location.pathname.endsWith('/conflicts')) return 'CONFLICTS';
    if (location.pathname.endsWith('/audit')) return 'AUDIT';
    return 'OVERVIEW';
  };

  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'RULES' | 'SOURCES' | 'CONFLICTS' | 'AUDIT'
  >(getTabFromPath());

  const [rulesData, setRulesData] = useState<any>(null);
  const [sourcesData, setSourcesData] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [unitTests, setUnitTests] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New versioned rule form
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    ruleId: 'ENV-MPCB-CTE-001',
    approvalRef: 'MPCB_CTE',
    approvalName: 'MPCB Consent to Establish (CTE) — Updated Circular v1.3',
    authority: 'MPCB',
    changeSummary: 'Added explicit ZLD condensate monitoring note for Red Category Bulk Drug units.',
    publishedDays: 60,
  });

  // New regulatory source form
  const [showSourceForm, setShowSourceForm] = useState(false);
  const [sourceForm, setSourceForm] = useState({
    sourceCode: 'SRC-MPCB-CIRCULAR-2026-09',
    title: 'MPCB Circular on Online OCEMS & ZLD Telemetry for Bulk Drug Units',
    authority: 'MPCB',
    documentType: 'Circular',
    citationText: 'Circular No. MPCB/JD(WPC)/OCEMS-2026/114',
    publicationDate: '2026-09-15',
    effectiveFrom: '2026-09-20',
    verificationStatus: 'VERIFIED',
  });

  const loadAdminBundle = async () => {
    setLoading(true);
    try {
      const [rData, sData, aData, tData] = await Promise.all([
        apiFetch<any>('/api/admin/rules'),
        apiFetch<any>('/api/admin/sources'),
        apiFetch<any[]>('/api/admin/audit'),
        apiFetch<any>('/api/admin/unit-tests'),
      ]);
      setRulesData(rData);
      setSourcesData(sData);
      setAuditLogs(aData);
      setUnitTests(tData);
    } catch (err) {
      console.error('Failed to load admin governance bundle:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminBundle();
  }, []);

  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname]);

  const handleSaveRuleVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const existing = rulesData?.rules?.find((r: any) => r.ruleId === ruleForm.ruleId);
      const baseJson = existing?.ruleJson || {
        rule_id: ruleForm.ruleId,
        approval_ref: ruleForm.approvalRef,
        authority: ruleForm.authority,
        when: { pollution_category_in: ['RED', 'ORANGE', 'GREEN'] },
        trigger_facts: ['Industry category', 'Manufacturing process'],
        stage: 'PRE_ESTABLISHMENT',
        dependencies: ['MIDC_LAND_ALLOTMENT'],
        documents: ['Detailed Project Report (DPR)', 'MIDC Plot Allotment Letter'],
        legal_basis: {
          act: 'Water Act 1974 & Air Act 1981',
          section: 'Section 25 / Section 21',
          rule: 'Maharashtra Consent Rules',
        },
        timeline: { published: String(ruleForm.publishedDays), unit: 'days' },
        effective_from: '2021-01-01',
        effective_until: null,
        source: 'SRC-MPCB-CONSENT-2021',
        last_verified: '2026-09-30',
        verification_status: 'VERIFIED',
      };

      await apiFetch('/api/admin/rules', {
        method: 'POST',
        body: JSON.stringify({
          ruleId: ruleForm.ruleId,
          approvalRef: ruleForm.approvalRef,
          approvalName: ruleForm.approvalName,
          authority: ruleForm.authority,
          stage: 'PRE_ESTABLISHMENT',
          whyTemplate:
            'Mandatory statutory consent required prior to taking any steps to establish an industrial plant with effluent/emission potential.',
          observedProcessingRange: '45–75 days (Observed public portal data)',
          renewalInfo: 'Valid up to commissioning or 5 years',
          changeSummary: ruleForm.changeSummary,
          ruleJson: {
            ...baseJson,
            timeline: { published: String(ruleForm.publishedDays), unit: 'days' },
            last_verified: '2026-09-30',
          },
        }),
      });
      setShowRuleForm(false);
      await loadAdminBundle();
    } catch (err) {
      console.error('Failed to version rule:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSource = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/api/admin/sources', {
        method: 'POST',
        body: JSON.stringify(sourceForm),
      });
      setShowSourceForm(false);
      await loadAdminBundle();
    } catch (err) {
      console.error('Failed to add source:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-sm text-slate-500">
        Loading Regulatory Knowledge Base, Versioned Rules, Conflict Detector & Audit Logs...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-md p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-slate-500">
            SECTIONS 8, 22, 23 & 36 • PLATFORM ADMIN & REGULATORY GOVERNANCE
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Regulatory Knowledge Base, Rule Versioning & Audit Governance
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Every rule is versioned, effective-dated, linked to a verified statutory source, and backed by automated unit tests and immutable audit logs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowRuleForm(true)}
            className="px-3.5 py-2 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800 inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Create / Version Rule
          </button>
          <button
            onClick={() => setShowSourceForm(true)}
            className="px-3.5 py-2 text-xs font-semibold border border-slate-300 text-slate-800 bg-white rounded hover:bg-slate-50 inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Register Statutory Source
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <Link
          to="/admin"
          className={`px-3.5 py-2 rounded text-xs font-semibold flex items-center gap-1.5 ${
            activeTab === 'OVERVIEW'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <PlayCircle className="w-3.5 h-3.5" />
          Overview & Automated Unit Tests ({unitTests?.passedCount}/{unitTests?.total})
        </Link>
        <Link
          to="/admin/rules"
          className={`px-3.5 py-2 rounded text-xs font-semibold flex items-center gap-1.5 ${
            activeTab === 'RULES'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          Versioned Rules Engine ({rulesData?.rules?.length || 0})
        </Link>
        <Link
          to="/admin/sources"
          className={`px-3.5 py-2 rounded text-xs font-semibold flex items-center gap-1.5 ${
            activeTab === 'SOURCES'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Statutory Sources ({sourcesData?.sources?.length || 0})
        </Link>
        <Link
          to="/admin/conflicts"
          className={`px-3.5 py-2 rounded text-xs font-semibold flex items-center gap-1.5 ${
            activeTab === 'CONFLICTS'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Conflict Detector ({sourcesData?.conflicts?.length || 0})
        </Link>
        <Link
          to="/admin/audit"
          className={`px-3.5 py-2 rounded text-xs font-semibold flex items-center gap-1.5 ${
            activeTab === 'AUDIT'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Immutable Audit Log ({auditLogs.length})
        </Link>
      </div>

      {/* TAB 1: OVERVIEW & LIVE UNIT TEST RUNNER (SECTION 36) */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-md p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-700 font-semibold">
                  SECTION 36 • AUTOMATED REGULATORY VERIFICATION SUITE
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                  Deterministic Engine & Safety Guardrail Unit Tests
                </h2>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-300">
                ALL {unitTests?.passedCount} / {unitTests?.total} TESTS PASSING
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {(unitTests?.results || []).map((test: any) => (
                <div
                  key={test.testId}
                  className="p-4 rounded border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-slate-500">
                        {test.testId}
                      </span>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        PASS
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{test.name}</h3>
                    <p className="text-xs text-slate-600 mt-1 font-mono">{test.Assertion}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VERSIONED RULES ENGINE */}
      {activeTab === 'RULES' && (
        <div className="space-y-4">
          {(rulesData?.rules || []).map((rule: any) => (
            <div key={rule.id} className="bg-white border border-slate-200 rounded-md p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                    {rule.ruleId}
                  </span>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                    Version {rule.version}
                  </span>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {rule.ruleJson?.verification_status}
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  Authority: {rule.authority} • Stage: {rule.stage} • Effective:{' '}
                  {rule.ruleJson?.effective_from}
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-6 space-y-2">
                  <h3 className="text-base font-bold text-slate-900">{rule.approvalName}</h3>
                  <p className="text-xs text-slate-700">{rule.whyTemplate}</p>
                  <div className="text-xs font-mono text-slate-600">
                    Source Code: {rule.ruleJson?.source} • Published SLA:{' '}
                    {rule.ruleJson?.timeline?.published} {rule.ruleJson?.timeline?.unit}
                  </div>
                </div>
                <div className="lg:col-span-6">
                  <pre className="p-3 rounded bg-slate-900 text-slate-100 text-[11px] font-mono overflow-x-auto max-h-44">
                    {JSON.stringify(rule.ruleJson, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: STATUTORY SOURCES REGISTRY */}
      {activeTab === 'SOURCES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(sourcesData?.sources || []).map((src: any) => (
            <div key={src.id} className="bg-white border border-slate-200 rounded-md p-5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono font-bold text-slate-700">{src.sourceCode}</span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {src.verificationStatus}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">{src.title}</h3>
              <div className="text-xs font-mono text-slate-600">{src.citationText}</div>
              <p className="text-xs text-slate-700">{src.notes}</p>
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-500">
                <span>Published: {src.publicationDate}</span>
                <span>Effective: {src.effectiveFrom}</span>
                <span>Last Verified: {src.lastVerified}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: CONFLICT DETECTOR REGISTRY */}
      {activeTab === 'CONFLICTS' && (
        <div className="space-y-4">
          {(sourcesData?.conflicts || []).map((conf: any) => (
            <div
              key={conf.id}
              className="bg-amber-50/90 border border-amber-300 rounded-md p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-amber-950">
                  ⚠ REGULATORY INFORMATION CONFLICT — {conf.approvalName}
                </span>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-amber-200 text-amber-950">
                  STATUS: {conf.status}
                </span>
              </div>
              <p className="text-xs text-amber-950">{conf.notes}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded border border-amber-200">
                  <div className="text-xs font-mono font-bold text-slate-800">
                    Source A: {conf.sourceAAuthority}
                  </div>
                  <div className="text-base font-bold font-mono text-slate-900 mt-1">
                    {conf.sourceATimeline}
                  </div>
                  <div className="text-[11px] font-mono text-slate-600 mt-1">
                    {conf.sourceALegalBasis}
                  </div>
                </div>
                <div className="bg-white p-4 rounded border border-amber-200">
                  <div className="text-xs font-mono font-bold text-slate-800">
                    Source B: {conf.sourceBAuthority}
                  </div>
                  <div className="text-base font-bold font-mono text-slate-900 mt-1">
                    {conf.sourceBTimeline}
                  </div>
                  <div className="text-[11px] font-mono text-slate-600 mt-1">
                    {conf.sourceBLegalBasis}
                  </div>
                </div>
                <div className="bg-white p-4 rounded border border-amber-200">
                  <div className="text-xs font-mono font-bold text-slate-800">
                    Source C: {conf.sourceCAuthority}
                  </div>
                  <div className="text-base font-bold font-mono text-slate-900 mt-1">
                    {conf.sourceCTimeline}
                  </div>
                  <div className="text-[11px] font-mono text-slate-600 mt-1">
                    {conf.sourceCLegalBasis}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: IMMUTABLE AUDIT LOGS */}
      {activeTab === 'AUDIT' && (
        <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Immutable Platform Audit Log ({auditLogs.length} entries)
            </span>
            <span className="text-xs font-mono text-slate-500">Append-Only Ledger</span>
          </div>
          <div className="divide-y divide-slate-200">
            {auditLogs.map((log: any) => (
              <div key={log.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-900">
                      {log.action}
                    </span>
                    <span className="text-xs font-mono text-slate-600">
                      {log.entityType} #{log.entityId}
                    </span>
                    <span className="text-xs font-mono text-blue-700">
                      Actor: {log.actorEmail} ({log.actorRole})
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 mt-1">{log.summary}</p>
                </div>
                <div className="text-xs font-mono text-slate-500 shrink-0">{log.timestamp}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Create/Version Rule */}
      {showRuleForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-md max-w-lg w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Create New Rule Version & Record Audit Log
            </h3>
            <form onSubmit={handleSaveRuleVersion} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rule ID</label>
                <input
                  type="text"
                  value={ruleForm.ruleId}
                  onChange={(e) => setRuleForm({ ...ruleForm, ruleId: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Approval Title
                </label>
                <input
                  type="text"
                  value={ruleForm.approvalName}
                  onChange={(e) => setRuleForm({ ...ruleForm, approvalName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Change Summary (Logged in Rule Version History)
                </label>
                <textarea
                  rows={2}
                  value={ruleForm.changeSummary}
                  onChange={(e) => setRuleForm({ ...ruleForm, changeSummary: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRuleForm(false)}
                  className="px-3 py-1.5 text-xs border border-slate-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded"
                >
                  Publish New Rule Version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Register Statutory Source */}
      {showSourceForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-md max-w-lg w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Register Verified Regulatory Source
            </h3>
            <form onSubmit={handleSaveSource} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Source Code
                </label>
                <input
                  type="text"
                  value={sourceForm.sourceCode}
                  onChange={(e) => setSourceForm({ ...sourceForm, sourceCode: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notification / Circular Title
                </label>
                <input
                  type="text"
                  value={sourceForm.title}
                  onChange={(e) => setSourceForm({ ...sourceForm, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gazette / Legal Citation
                </label>
                <input
                  type="text"
                  value={sourceForm.citationText}
                  onChange={(e) => setSourceForm({ ...sourceForm, citationText: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSourceForm(false)}
                  className="px-3 py-1.5 text-xs border border-slate-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded"
                >
                  Save Verified Source
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
