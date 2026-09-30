import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import {
  Sliders,
  ShieldCheck,
  Calendar,
  Award,
  ArrowRight,
  PlusCircle,
  MinusCircle,
  FileText,
  Clock,
  IndianRupee,
  RefreshCw,
} from 'lucide-react';
import { apiFetch } from '../services/api.ts';

export function ComplianceAndSimulatorPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isSimulatorRoute = location.pathname.endsWith('/simulator');

  const [bundle, setBundle] = useState<any>(null);
  const [simResult, setSimResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [runningSim, setRunningSim] = useState(false);

  const [activeTab, setActiveTab] = useState<'SIMULATOR' | 'INSPECTIONS_RENEWALS' | 'INCENTIVES'>(
    isSimulatorRoute ? 'SIMULATOR' : 'INSPECTIONS_RENEWALS'
  );

  // What-If Simulator Controls
  const [simFacts, setSimFacts] = useState({
    powerLoadKva: 250,
    boilerInstalled: true,
    hazardousProcess: true,
    midcPlot: true,
    totalWorkers: 145,
    fixedCapitalInvestmentCr: 42.5,
  });

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const proj = await apiFetch<any>(`/api/projects/${id}`);
      setBundle(proj);
      const baseInput = proj.profileInput || {};
      const defaultSim = {
        powerLoadKva: 250, // Default demo shows 140 kVA -> 250 kVA HT Electrical Inspector trigger!
        boilerInstalled: baseInput.boilerInstalled ?? true,
        hazardousProcess: baseInput.hazardousProcess ?? true,
        midcPlot: baseInput.midcPlot ?? true,
        totalWorkers: baseInput.totalWorkers ?? 145,
        fixedCapitalInvestmentCr: baseInput.fixedCapitalInvestmentCr ?? 42.5,
      };
      setSimFacts(defaultSim);

      const simRes = await apiFetch<any>(`/api/projects/${id}/simulator`, {
        method: 'POST',
        body: JSON.stringify({ simulatedFacts: defaultSim }),
      });
      setSimResult(simRes);
    } catch (err) {
      console.error('Failed to load compliance & simulator data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [id]);

  useEffect(() => {
    if (isSimulatorRoute) {
      setActiveTab('SIMULATOR');
    }
  }, [isSimulatorRoute]);

  const handleRunSimulation = async (overrideFacts?: typeof simFacts) => {
    const payload = overrideFacts || simFacts;
    setRunningSim(true);
    try {
      const res = await apiFetch<any>(`/api/projects/${id}/simulator`, {
        method: 'POST',
        body: JSON.stringify({ simulatedFacts: payload }),
      });
      setSimResult(res);
    } catch (err) {
      console.error('Failed to run simulator:', err);
    } finally {
      setRunningSim(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-sm text-slate-500">
        Loading What-If Regulatory Simulator, Renewal Calendar & Incentive Readiness...
      </div>
    );
  }

  const baseProfile = bundle?.profileInput || {};
  const delta = simResult?.simulation;
  const inspections = bundle?.inspections || [];
  const renewals = bundle?.renewals || [];
  const incentives = bundle?.incentives || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-md p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-slate-500">
            STAGE 12 & WHAT-IF SIMULATOR • {bundle?.project?.name}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            What-If Regulatory Simulator, Renewals & Incentive Readiness
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Simulate parameter changes (e.g., Power Load 140 kVA → 250 kVA), coordinate multi-department inspections, and verify Maharashtra PSI-2019 incentives.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('SIMULATOR')}
            className={`px-3.5 py-2 rounded text-xs font-semibold flex items-center gap-1.5 ${
              activeTab === 'SIMULATOR'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            What-If Project Simulator
          </button>
          <button
            onClick={() => setActiveTab('INSPECTIONS_RENEWALS')}
            className={`px-3.5 py-2 rounded text-xs font-semibold flex items-center gap-1.5 ${
              activeTab === 'INSPECTIONS_RENEWALS'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Inspections & Renewal Calendar ({renewals.length})
          </button>
          <button
            onClick={() => setActiveTab('INCENTIVES')}
            className={`px-3.5 py-2 rounded text-xs font-semibold flex items-center gap-1.5 ${
              activeTab === 'INCENTIVES'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Maharashtra Incentive Readiness ({incentives.length})
          </button>
        </div>
      </div>

      {/* TAB 1: WHAT-IF PROJECT SIMULATOR (SECTION 13) */}
      {activeTab === 'SIMULATOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Parameter Sliders & Toggles */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-md p-6 space-y-5">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-blue-700 font-semibold">
                  SECTION 13 • PARAMETER CONTROLS
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">
                  Modify Operational Parameters
                </h2>
              </div>
              <button
                onClick={() => {
                  const preset = {
                    powerLoadKva: 250,
                    boilerInstalled: true,
                    hazardousProcess: true,
                    midcPlot: true,
                    totalWorkers: 145,
                    fixedCapitalInvestmentCr: 42.5,
                  };
                  setSimFacts(preset);
                  handleRunSimulation(preset);
                }}
                className="text-xs font-mono text-blue-700 hover:underline"
              >
                Reset to 250 kVA Preset
              </button>
            </div>

            <div className="space-y-4">
              {/* Power Load */}
              <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Connected Power Load (kVA)
                  </label>
                  <span className="text-xs font-mono text-slate-500">
                    Baseline: {baseProfile.powerLoadKva} kVA (Threshold: 150 kVA)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={50}
                    max={500}
                    step={10}
                    value={simFacts.powerLoadKva}
                    onChange={(e) =>
                      setSimFacts({ ...simFacts, powerLoadKva: Number(e.target.value) })
                    }
                    className="flex-1"
                  />
                  <input
                    type="number"
                    value={simFacts.powerLoadKva}
                    onChange={(e) =>
                      setSimFacts({ ...simFacts, powerLoadKva: Number(e.target.value) })
                    }
                    className="w-24 px-2.5 py-1 text-xs font-mono font-bold border border-slate-300 rounded bg-white text-right"
                  />
                </div>
              </div>

              {/* Boiler Installed */}
              <div className="p-3.5 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">Steam Boiler Installation</div>
                  <div className="text-[11px] font-mono text-slate-500">
                    Baseline: {baseProfile.boilerInstalled ? 'Yes (IBR Steam Boiler)' : 'No'}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={simFacts.boilerInstalled}
                  onChange={(e) =>
                    setSimFacts({ ...simFacts, boilerInstalled: e.target.checked })
                  }
                  className="h-4 w-4 accent-slate-900"
                />
              </div>

              {/* Hazardous Process */}
              <div className="p-3.5 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Hazardous Manufacturing Process
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    Baseline: {baseProfile.hazardousProcess ? 'Yes (First Schedule)' : 'No'}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={simFacts.hazardousProcess}
                  onChange={(e) =>
                    setSimFacts({ ...simFacts, hazardousProcess: e.target.checked })
                  }
                  className="h-4 w-4 accent-slate-900"
                />
              </div>

              {/* MIDC vs Non-MIDC */}
              <div className="p-3.5 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Located in Notified MIDC Industrial Area
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    Baseline: {baseProfile.midcPlot ? 'Yes (MIDC Plot)' : 'No (Non-MIDC Revenue Land)'}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={simFacts.midcPlot}
                  onChange={(e) => setSimFacts({ ...simFacts, midcPlot: e.target.checked })}
                  className="h-4 w-4 accent-slate-900"
                />
              </div>

              {/* Total Worker Count */}
              <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">Total Workforce</label>
                  <span className="text-xs font-mono text-slate-500">
                    Baseline: {baseProfile.totalWorkers} workers
                  </span>
                </div>
                <input
                  type="number"
                  value={simFacts.totalWorkers}
                  onChange={(e) =>
                    setSimFacts({ ...simFacts, totalWorkers: Number(e.target.value) })
                  }
                  className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white"
                />
              </div>

              {/* Investment */}
              <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Fixed Capital Investment (₹ Crore)
                  </label>
                  <span className="text-xs font-mono text-slate-500">
                    Baseline: ₹{baseProfile.fixedCapitalInvestmentCr} Cr
                  </span>
                </div>
                <input
                  type="number"
                  step="0.5"
                  value={simFacts.fixedCapitalInvestmentCr}
                  onChange={(e) =>
                    setSimFacts({
                      ...simFacts,
                      fixedCapitalInvestmentCr: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white"
                />
              </div>
            </div>

            <button
              onClick={() => handleRunSimulation()}
              disabled={runningSim}
              className="w-full py-2.5 px-4 bg-slate-900 text-white text-xs font-semibold rounded hover:bg-slate-800 flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${runningSim ? 'animate-spin' : ''}`} />
              {runningSim ? 'Computing Regulatory Delta...' : 'Compute Regulatory Delta'}
            </button>
          </div>

          {/* Delta Comparison Output */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-slate-200 rounded-md p-6 space-y-5">
              <div className="border-b border-slate-200 pb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-500">
                    DETERMINISTIC DELTA ENGINE OUTPUT
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                    Baseline vs. Simulated Regulatory Impact
                  </h2>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-blue-50 text-blue-900 border border-blue-200">
                  Timeline Delta: {delta?.timelineDeltaDays >= 0 ? `+${delta?.timelineDeltaDays}` : delta?.timelineDeltaDays} Days
                </span>
              </div>

              {/* Summary KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded bg-emerald-50/70 border border-emerald-200">
                  <div className="text-xs font-mono uppercase text-emerald-900">
                    New Approvals Triggered
                  </div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-emerald-950 mt-1">
                    +{delta?.newApprovalsTriggered?.length || 0}
                  </div>
                </div>
                <div className="p-3.5 rounded bg-amber-50/70 border border-amber-200">
                  <div className="text-xs font-mono uppercase text-amber-900">
                    Approvals Removed
                  </div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-amber-950 mt-1">
                    -{delta?.approvalsRemoved?.length || 0}
                  </div>
                </div>
                <div className="p-3.5 rounded bg-slate-50 border border-slate-200">
                  <div className="text-xs font-mono uppercase text-slate-600">
                    New Documents Added
                  </div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                    +{delta?.documentsAdded?.length || 0}
                  </div>
                </div>
              </div>

              {/* Newly Triggered Approvals */}
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-700" />
                  Newly Triggered Approvals ({delta?.newApprovalsTriggered?.length || 0})
                </h3>
                {delta?.newApprovalsTriggered?.length > 0 ? (
                  <div className="space-y-2.5">
                    {delta.newApprovalsTriggered.map((app: any) => (
                      <div
                        key={app.ruleId}
                        className="p-4 rounded border border-emerald-300 bg-emerald-50/40 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-900">{app.approvalName}</span>
                          <span className="text-xs font-mono font-semibold text-emerald-800">
                            +{app.timeline.published} {app.timeline.unit} ({app.authority})
                          </span>
                        </div>
                        <p className="text-xs text-slate-700">{app.whyItApplies}</p>
                        <div className="text-[11px] font-mono text-slate-600">
                          Legal Basis: {app.legalBasis.act} • {app.legalBasis.section} ({app.legalBasis.rule})
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 p-3 bg-slate-50 rounded border border-slate-200">
                    No additional approvals triggered under current simulated parameters.
                  </div>
                )}
              </div>

              {/* Removed Approvals */}
              {delta?.approvalsRemoved?.length > 0 && (
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
                    <MinusCircle className="w-3.5 h-3.5 text-amber-700" />
                    Approvals No Longer Triggered ({delta.approvalsRemoved.length})
                  </h3>
                  <div className="space-y-2">
                    {delta.approvalsRemoved.map((app: any) => (
                      <div
                        key={app.ruleId}
                        className="p-3 rounded border border-amber-200 bg-amber-50/40 flex items-center justify-between"
                      >
                        <span className="text-xs font-bold text-slate-900">{app.approvalName}</span>
                        <span className="text-xs font-mono text-amber-800">
                          Removed (-{app.timeline.published} days)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Added Documents */}
              {delta?.documentsAdded?.length > 0 && (
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-700" />
                    Additional Mandatory Documents Required
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {delta.documentsAdded.map((doc: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-xs font-mono px-2.5 py-1 rounded bg-slate-100 border border-slate-300 text-slate-800"
                      >
                        + {doc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Fee Impact */}
              <div className="p-3.5 rounded bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                <IndianRupee className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-mono uppercase font-bold text-slate-700">
                    Statutory Fee & Cost Reference Impact
                  </div>
                  <p className="text-xs text-slate-700 mt-0.5">{delta?.costFeeReferenceImpact}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INSPECTIONS & RENEWALS (SECTION 19) */}
      {activeTab === 'INSPECTIONS_RENEWALS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coordinated Inspection Planner */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-md p-6 space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-blue-700 font-semibold">
                SECTION 19 • COORDINATED INSPECTION ENGINE
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                Multi-Department Inspection Readiness
              </h2>
            </div>
            <div className="space-y-3">
              {inspections.map((insp: any) => (
                <div
                  key={insp.id}
                  className="p-4 rounded border border-slate-200 bg-slate-50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                      {insp.department}
                    </span>
                    <span className="text-xs font-mono text-blue-800 font-semibold">
                      {insp.coordinatedGroup}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">{insp.inspectionType}</div>
                  <div className="text-xs font-mono text-slate-600">
                    Scheduled Window: {insp.scheduledWindow} • Status: {insp.readinessStatus}
                  </div>
                  <div className="pt-1 flex flex-wrap gap-1.5">
                    {(insp.checklistJson || []).map((item: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700"
                      >
                        ✓ {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Renewal & Expiry Countdown Engine */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-md p-6 space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-700 font-semibold">
                SECTION 19 • STATUTORY RENEWAL & EXPIRY TRACKER
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                License Validity & Renewal Filing Windows
              </h2>
            </div>
            <div className="space-y-3">
              {renewals.map((ren: any) => (
                <div
                  key={ren.id}
                  className="p-4 rounded border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-xs font-mono text-slate-500">{ren.authority}</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">{ren.licenseName}</div>
                    <div className="text-xs font-mono text-slate-600 mt-1">
                      Frequency: {ren.frequency} • File {ren.advanceFilingWindowDays} days prior
                    </div>
                  </div>
                  <div className="sm:text-right shrink-0">
                    <div className="text-sm font-bold font-mono tabular-nums text-slate-900">
                      {ren.daysRemaining} days left
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      Expires: {ren.expiryDate}
                    </div>
                    <span className="inline-block mt-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {ren.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INCENTIVE READINESS MODULE (SECTION 20) */}
      {activeTab === 'INCENTIVES' && (
        <div className="bg-white border border-slate-200 rounded-md p-6 space-y-5">
          <div className="border-b border-slate-200 pb-4">
            <span className="text-xs font-mono uppercase tracking-wider text-blue-700 font-semibold">
              SECTION 20 • MAHARASHTRA INDUSTRIAL INCENTIVE READINESS MODULE
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              Package Scheme of Incentives (PSI), MIDC & Sector Subsidy Readiness
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Evaluates prerequisite approvals and verified documents required before filing for Directorate of Industries Eligibility Certificates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {incentives.map((inc: any) => (
              <div
                key={inc.id}
                className="border border-slate-200 rounded-md p-5 bg-slate-50 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-slate-600">
                      {inc.category}
                    </span>
                    <span
                      className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
                        inc.readinessStatus === 'Missing prerequisite'
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : inc.readinessStatus === 'Potentially relevant'
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                          : 'bg-blue-50 text-blue-900 border-blue-300'
                      }`}
                    >
                      {inc.readinessStatus}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{inc.schemeName}</h3>
                  <p className="text-xs text-slate-700">{inc.eligibilitySummary}</p>

                  {inc.missingPrerequisitesJson?.length > 0 && (
                    <div className="pt-2">
                      <div className="text-[11px] font-mono uppercase text-red-800 font-bold mb-1">
                        Missing Prerequisites:
                      </div>
                      <ul className="space-y-1">
                        {inc.missingPrerequisitesJson.map((m: string, i: number) => (
                          <li key={i} className="text-xs text-red-900 bg-red-50/80 px-2 py-1 rounded border border-red-200">
                            • {m}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200 text-[11px] font-mono text-slate-500">
                  Source Reference: {inc.sourceRef} ({inc.verificationStatus})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
