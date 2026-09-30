import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import {
  Clock,
  AlertTriangle,
  MessageSquare,
  ShieldAlert,
  Play,
  Pause,
  FileWarning,
  CheckCircle2,
  Download,
  UserCheck,
  Send,
} from 'lucide-react';
import { apiFetch } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

export function ApplicationsAndClockPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { activeRole } = useAuth();

  const [applications, setApplications] = useState<any[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<number | null>(id ? Number(id) : null);
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Determine default sub-tab based on URL path
  const getInitialTab = () => {
    if (location.pathname.endsWith('/queries')) return 'QUERIES';
    if (location.pathname.endsWith('/escalation')) return 'ESCALATION';
    if (location.pathname.endsWith('/timeline')) return 'CLOCK';
    return 'CLOCK';
  };
  const [activeTab, setActiveTab] = useState<'CLOCK' | 'QUERIES' | 'OFFICER' | 'ESCALATION'>(
    getInitialTab()
  );

  // Forms for Query response & Officer actions
  const [responseText, setResponseText] = useState(
    'Uploaded Hazardous Waste Storage Compatibility Matrix & Form-1 Manifest Undertaking (45 MT/year capacity verified).'
  );
  const [responseDocTitle, setResponseDocTitle] = useState(
    'Hazardous_Waste_Compatibility_Matrix_Rev2.pdf'
  );
  const [newQueryItem, setNewQueryItem] = useState(
    'Revised Zero Liquid Discharge (ZLD) Condensate Recovery Balance'
  );
  const [newQueryDetails, setNewQueryDetails] = useState(
    'Please provide mass balance calculations for MEE condensate reuse in cooling tower make-up.'
  );

  const loadListAndDetail = async (targetId?: number) => {
    setLoading(true);
    try {
      const list = await apiFetch<any[]>('/api/applications');
      setApplications(list);
      const effectiveId = targetId || selectedAppId || (list[0]?.id ?? null);
      if (effectiveId) {
        setSelectedAppId(effectiveId);
        const appDetail = await apiFetch<any>(`/api/applications/${effectiveId}`);
        setDetail(appDetail);
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListAndDetail(id ? Number(id) : undefined);
  }, [id]);

  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [location.pathname]);

  const handleSelectApplication = async (appId: number) => {
    setSelectedAppId(appId);
    setActionError(null);
    const appDetail = await apiFetch<any>(`/api/applications/${appId}`);
    setDetail(appDetail);
  };

  const handleClockAction = async (
    action: 'START_CLOCK' | 'PAUSE_CLOCK' | 'RESUME_CLOCK' | 'SIMULATE_DEADLINE_BREACH',
    reason: string
  ) => {
    if (!selectedAppId) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const updated = await apiFetch<any>(`/api/applications/${selectedAppId}/clock-action`, {
        method: 'POST',
        body: JSON.stringify({
          action,
          reason,
          actorName:
            activeRole === 'ADMIN'
              ? 'Platform Regulatory Reviewer'
              : 'Scrutiny Officer / Legal Clock Engine',
          actorRole: 'OFFICER',
        }),
      });
      setDetail(updated);
      const list = await apiFetch<any[]>('/api/applications');
      setApplications(list);
    } catch (err: any) {
      setActionError(err.message || 'Clock transition failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespondToQuery = async (queryId: number) => {
    if (!selectedAppId) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const updated = await apiFetch<any>(`/api/applications/${selectedAppId}/query-response`, {
        method: 'POST',
        body: JSON.stringify({
          queryId,
          responseText,
          responseDocumentTitle: responseDocTitle,
        }),
      });
      setDetail(updated);
      const list = await apiFetch<any[]>('/api/applications');
      setApplications(list);
    } catch (err: any) {
      setActionError(err.message || 'Failed to respond to query');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOfficerRaiseQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId || !newQueryItem) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const updated = await apiFetch<any>(`/api/applications/${selectedAppId}/query`, {
        method: 'POST',
        body: JSON.stringify({
          requiredItem: newQueryItem,
          detailedQueryText: newQueryDetails,
          actorName: 'Regional Scrutiny Officer (Officer Workspace)',
        }),
      });
      setDetail(updated);
      const list = await apiFetch<any[]>('/api/applications');
      setApplications(list);
    } catch (err: any) {
      setActionError(err.message || 'Failed to raise query');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadEscalationDossier = () => {
    if (!detail?.application) return;
    const app = detail.application;
    const esc = detail.escalations?.[0];
    const eventsText = (detail.events || [])
      .map(
        (ev: any) =>
          `[${ev.timestamp}] ${ev.eventType} (${ev.actorRole} - ${ev.actorName}): ${ev.reason}`
      )
      .join('\n');

    const dossierContent = `====================================================================
MAHAREGULATE STATUTORY ESCALATION READINESS DOSSIER
====================================================================
Generated On: 2026-09-30
Application Reference: ${app.trackingReference || 'PENDING-FILING'}
Approval Name: ${app.approvalName}
Competent Authority: ${app.authority}
External Portal: ${app.externalPortal}

1. LEGAL CLOCK & STATUTORY DEADLINE SUMMARY
--------------------------------------------------------------------
Submission Date:           ${app.submittedAt || 'N/A'}
Published Timeline:        ${app.publishedTimelineDays} days
Days Elapsed (Total):      ${app.daysElapsed} days
Query Pause Days:          ${app.queryPauseDays} days
Active Department Days:    ${app.activeProcessingDays} days
Remaining Legal Days:      ${app.remainingLegalDays} days
Current Clock State:       ${app.clockState}
Observed Public Reference: ${app.observedProcessingRange} (Non-binding public benchmark)

2. STATUTORY BASIS & ESCALATION ROUTE
--------------------------------------------------------------------
Legal Basis:               ${esc?.statutoryBasis || 'Maharashtra Right to Public Services Act, 2015'}
Appellate / Reviewing Auth:${esc?.appellateAuthority || 'Designated First Appellate Authority'}
Verification Status:       ${esc?.verificationStatus || 'VERIFIED'}
Escalation Summary:
${esc?.summaryNotes || 'Statutory processing window exceeded active department days.'}

IMPORTANT LEGAL SAFETY NOTICE:
Expiry of a published timeline does NOT automatically confer deemed approval unless explicitly enacted by statute and verified in the official gazette. This dossier is prepared for formal representation / appellate review.

3. CHRONOLOGICAL EVENT & QUERY LOG
--------------------------------------------------------------------
${eventsText}
====================================================================
`;

    const blob = new Blob([dossierContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Escalation_Dossier_${app.approvalRef}_${app.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !detail) {
    return (
      <div className="p-8 text-sm text-slate-500">
        Loading Legal Clock Engine, Query State Machine & Escalation Dossiers...
      </div>
    );
  }

  const app = detail?.application;
  const events = detail?.events || [];
  const queries = detail?.queries || [];
  const escalations = detail?.escalations || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-md p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-slate-500">
            STAGES 8–11 • APPLICATION TRACKING, LEGAL CLOCK, QUERY MANAGEMENT & ESCALATION
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Legal Clock, Query State Machine & Statutory Escalation Engine
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Tracks active department days vs. applicant query-pause days. Never claims automatic deemed approval when a deadline expires.
          </p>
        </div>
        {app && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadEscalationDossier}
              className="px-3.5 py-2 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800 inline-flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export Escalation Summary Dossier
            </button>
          </div>
        )}
      </div>

      {/* Application Selector Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {applications.map((item) => {
          const isSelected = item.id === selectedAppId;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectApplication(item.id)}
              className={`text-left p-4 rounded-md border transition-all ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-[11px] font-mono ${
                    isSelected ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {item.trackingReference || 'DRAFT-UNSUBMITTED'}
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    item.clockState === 'CLOCK_PAUSED'
                      ? 'bg-amber-500 text-slate-950'
                      : item.clockState === 'ESCALATION_ELIGIBLE' ||
                        item.clockState === 'DEADLINE_EXPIRED'
                      ? 'bg-red-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {item.clockState}
                </span>
              </div>
              <div className="text-sm font-bold mt-1.5">{item.approvalName}</div>
              <div
                className={`text-xs font-mono mt-2 flex items-center justify-between ${
                  isSelected ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                <span>Active: {item.activeProcessingDays}d / {item.publishedTimelineDays}d</span>
                <span>Paused: {item.queryPauseDays}d</span>
              </div>
            </button>
          );
        })}
      </div>

      {actionError && (
        <div className="p-3.5 rounded bg-red-50 border border-red-300 text-xs text-red-900 font-medium">
          {actionError}
        </div>
      )}

      {app && (
        <>
          {/* Legal Clock Metrics Ledger */}
          <div className="bg-white border border-slate-200 rounded-md p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                    {app.authority}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    Portal: {app.externalPortal} • Ref: {app.trackingReference || 'Not Submitted'}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-1">{app.approvalName}</h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {app.clockState === 'NOT_STARTED' && (
                  <button
                    onClick={() =>
                      handleClockAction(
                        'START_CLOCK',
                        'Application formally submitted with fee receipt; statutory clock started.'
                      )
                    }
                    disabled={submitting}
                    className="px-3 py-1.5 text-xs font-semibold bg-emerald-700 text-white rounded hover:bg-emerald-800 inline-flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Submit & Start Legal Clock
                  </button>
                )}
                {app.clockState === 'CLOCK_STARTED' && (
                  <button
                    onClick={() =>
                      handleClockAction(
                        'PAUSE_CLOCK',
                        'Department scrutiny query raised; statutory clock paused pending applicant response.'
                      )
                    }
                    disabled={submitting}
                    className="px-3 py-1.5 text-xs font-semibold bg-amber-600 text-white rounded hover:bg-amber-700 inline-flex items-center gap-1.5"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    Pause Clock (Raise Query)
                  </button>
                )}
                {app.clockState === 'CLOCK_PAUSED' && (
                  <button
                    onClick={() =>
                      handleClockAction(
                        'RESUME_CLOCK',
                        'Applicant submitted complete query response; statutory clock resumed.'
                      )
                    }
                    disabled={submitting}
                    className="px-3 py-1.5 text-xs font-semibold bg-emerald-700 text-white rounded hover:bg-emerald-800 inline-flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Resume Clock (Query Answered)
                  </button>
                )}
                <button
                  onClick={() =>
                    handleClockAction(
                      'SIMULATE_DEADLINE_BREACH',
                      'Simulated statutory timeline breach (+5 days past published window) to verify Escalation Readiness Dossier.'
                    )
                  }
                  disabled={submitting}
                  className="px-3 py-1.5 text-xs font-semibold border border-red-300 text-red-800 bg-red-50 rounded hover:bg-red-100 inline-flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Simulate Deadline Breach (Escalation Test)
                </button>
              </div>
            </div>

            {/* 7 Statutory Clock Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-5">
              <div className="p-3 rounded bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-mono uppercase text-slate-500">Published SLA</div>
                <div className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                  {app.publishedTimelineDays} days
                </div>
                <div className="text-[10px] text-emerald-700 font-mono mt-0.5">VERIFIED SLA</div>
              </div>
              <div className="p-3 rounded bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-mono uppercase text-slate-500">Submitted Date</div>
                <div className="text-sm font-bold font-mono tabular-nums text-slate-900 mt-1">
                  {app.submittedAt || 'Pending'}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">Status: {app.status}</div>
              </div>
              <div className="p-3 rounded bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-mono uppercase text-slate-500">Total Elapsed</div>
                <div className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                  {app.daysElapsed} days
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">Calendar days</div>
              </div>
              <div className="p-3 rounded bg-amber-50/70 border border-amber-200">
                <div className="text-[11px] font-mono uppercase text-amber-900">Query Pause Days</div>
                <div className="text-lg font-bold font-mono tabular-nums text-amber-900 mt-0.5">
                  {app.queryPauseDays} days
                </div>
                <div className="text-[10px] text-amber-800 font-mono mt-0.5">Applicant hold</div>
              </div>
              <div className="p-3 rounded bg-blue-50/70 border border-blue-200">
                <div className="text-[11px] font-mono uppercase text-blue-900">Active Dept Days</div>
                <div className="text-lg font-bold font-mono tabular-nums text-blue-950 mt-0.5">
                  {app.activeProcessingDays} days
                </div>
                <div className="text-[10px] text-blue-800 font-mono mt-0.5">Counted vs SLA</div>
              </div>
              <div className="p-3 rounded bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-mono uppercase text-slate-500">Remaining Legal</div>
                <div
                  className={`text-lg font-bold font-mono tabular-nums mt-0.5 ${
                    app.remainingLegalDays === 0 ? 'text-red-700' : 'text-emerald-700'
                  }`}
                >
                  {app.remainingLegalDays} days
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">Before breach</div>
              </div>
              <div className="p-3 rounded bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-mono uppercase text-slate-500">Public Observed</div>
                <div className="text-xs font-bold font-mono tabular-nums text-slate-800 mt-1">
                  {app.observedProcessingRange}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">Non-binding</div>
              </div>
            </div>
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
            <button
              onClick={() => setActiveTab('CLOCK')}
              className={`px-3.5 py-2 rounded text-xs font-semibold flex items-center gap-1.5 ${
                activeTab === 'CLOCK'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Chronological Legal Clock Event Log ({events.length})
            </button>
            <button
              onClick={() => setActiveTab('QUERIES')}
              className={`px-3.5 py-2 rounded text-xs font-semibold flex items-center gap-1.5 ${
                activeTab === 'QUERIES'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Applicant Query Management ({queries.length})
            </button>
            <button
              onClick={() => setActiveTab('OFFICER')}
              className={`px-3.5 py-2 rounded text-xs font-semibold flex items-center gap-1.5 ${
                activeTab === 'OFFICER'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Officer / Scrutiny Reviewer Workspace
            </button>
            <button
              onClick={() => setActiveTab('ESCALATION')}
              className={`px-3.5 py-2 rounded text-xs font-semibold flex items-center gap-1.5 ${
                activeTab === 'ESCALATION'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Statutory Escalation & Remedy Dossier
            </button>
          </div>

          {/* TAB 1: Chronological Event Log */}
          {activeTab === 'CLOCK' && (
            <div className="bg-white border border-slate-200 rounded-md p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4">
                Immutable Legal Clock & Query State Transitions
              </h3>
              <div className="space-y-3">
                {events.map((ev: any) => (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded border border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                          {ev.eventType}
                        </span>
                        <span className="text-xs font-mono text-slate-600">
                          {ev.actorRole}: {ev.actorName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 mt-1.5">{ev.reason}</p>
                    </div>
                    <div className="text-xs font-mono text-slate-500 shrink-0">{ev.timestamp}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Query Management */}
          {activeTab === 'QUERIES' && (
            <div className="space-y-4">
              {queries.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-md p-6 text-sm text-slate-500">
                  No queries raised on this application. Use the Officer / Reviewer Workspace tab to simulate a scrutiny query.
                </div>
              ) : (
                queries.map((q: any) => (
                  <div key={q.id} className="bg-white border border-slate-200 rounded-md p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-700">
                          {q.queryNumber}
                        </span>
                        <span
                          className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                            q.status === 'RESPONSE_SUBMITTED' || q.status === 'RESOLVED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-900 border-amber-300'
                          }`}
                        >
                          QUERY STATE: {q.status}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-slate-500">
                        Raised: {q.raisedAt} • Answered: {q.respondedAt || 'Pending Response'}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-mono uppercase text-slate-500">Required Clarification / Document</div>
                      <div className="text-base font-bold text-slate-900 mt-0.5">{q.requiredItem}</div>
                      <p className="text-sm text-slate-700 mt-1">{q.detailedQueryText}</p>
                    </div>

                    {q.responseText ? (
                      <div className="p-4 rounded bg-emerald-50/70 border border-emerald-200 space-y-1">
                        <div className="text-xs font-mono font-bold text-emerald-900">
                          APPLICANT RESPONSE SUBMITTED ({q.respondedAt}):
                        </div>
                        <p className="text-xs text-emerald-950">{q.responseText}</p>
                        {q.responseDocumentTitle && (
                          <div className="text-xs font-mono text-emerald-800 pt-1">
                            Attached Evidence: {q.responseDocumentTitle}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 rounded bg-amber-50/60 border border-amber-200 space-y-3">
                        <div className="text-xs font-bold uppercase tracking-wider text-amber-950">
                          Submit Applicant Clarification & Resume Statutory Clock
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Clarification Response Statement
                          </label>
                          <textarea
                            rows={2}
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Supporting Document Reference
                          </label>
                          <input
                            type="text"
                            value={responseDocTitle}
                            onChange={(e) => setResponseDocTitle(e.target.value)}
                            className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded bg-white"
                          />
                        </div>
                        <button
                          onClick={() => handleRespondToQuery(q.id)}
                          disabled={submitting}
                          className="px-4 py-2 text-xs font-semibold bg-emerald-700 text-white rounded hover:bg-emerald-800 inline-flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Submit Query Response & Resume Clock
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: Officer / Reviewer Workspace */}
          {activeTab === 'OFFICER' && (
            <div className="bg-white border border-slate-200 rounded-md p-6 space-y-5">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-blue-700 font-semibold">
                  SECTION 15 • INTERNAL SCRUTINY & REVIEWER WORKSPACE
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  Raise Scrutiny Query / Record Clarification Decision
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Raising an official scrutiny query transitions the Legal Clock to <code className="font-mono">CLOCK_PAUSED</code> and records an immutable audit event.
                </p>
              </div>

              <form onSubmit={handleOfficerRaiseQuery} className="space-y-4 max-w-2xl">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Required Item / Document Deficiency
                  </label>
                  <input
                    type="text"
                    required
                    value={newQueryItem}
                    onChange={(e) => setNewQueryItem(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Detailed Scrutiny Observation
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={newQueryDetails}
                    onChange={(e) => setNewQueryDetails(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold bg-amber-600 text-white rounded hover:bg-amber-700 inline-flex items-center gap-1.5"
                >
                  <FileWarning className="w-3.5 h-3.5" />
                  Raise Official Scrutiny Query & Pause Legal Clock
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: Escalation & Statutory Remedy Engine */}
          {activeTab === 'ESCALATION' && (
            <div className="bg-white border border-slate-200 rounded-md p-6 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-red-700 font-semibold">
                    SECTION 18 • ESCALATION READINESS & STATUTORY REMEDY ENGINE
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                    Post-SLA Breach Remedy & First Appellate Dossier
                  </h3>
                </div>
                <button
                  onClick={handleDownloadEscalationDossier}
                  className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800 inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Printable Escalation Summary (.TXT)
                </button>
              </div>

              <div className="p-4 rounded bg-amber-50 border border-amber-300 text-xs text-amber-950">
                <span className="font-bold">STATUTORY SAFETY PRINCIPLE:</span> Never assume automatic or deemed approval upon expiry of a published timeline unless explicitly provided by a verified statutory notification. Where a timeline is breached, MahaRegulate prepares a structured representation dossier for the Designated Appellate Authority.
              </div>

              {escalations.map((esc: any) => (
                <div
                  key={esc.id}
                  className="border border-slate-200 rounded-md p-5 bg-slate-50 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-900 text-white">
                      ELIGIBILITY STATUS: {esc.eligibilityStatus}
                    </span>
                    <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      ROUTE VERIFICATION: {esc.verificationStatus}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <div className="text-xs font-mono uppercase text-slate-500">
                        Statutory / Legal Basis
                      </div>
                      <div className="text-sm font-semibold text-slate-900 mt-0.5">
                        {esc.statutoryBasis}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-mono uppercase text-slate-500">
                        Designated Appellate / Reviewing Authority
                      </div>
                      <div className="text-sm font-semibold text-slate-900 mt-0.5">
                        {esc.appellateAuthority}
                      </div>
                    </div>
                  </div>
                  <div className="pt-2">
                    <div className="text-xs font-mono uppercase text-slate-500">
                      Chronological Summary & Representation Notes
                    </div>
                    <p className="text-sm text-slate-700 mt-1">{esc.summaryNotes}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
