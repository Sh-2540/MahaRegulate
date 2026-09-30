import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Scale,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  FileText,
  GitBranch,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { apiFetch } from '../services/api.ts';
import { RuleEvaluation, ConflictRecord } from '../types/regulatory.ts';

export const ApprovalsDiscoveryPage: React.FC = () => {
  const { id } = useParams();
  const projectId = Number(id) || 1;

  const [data, setData] = useState<{
    project: any;
    organization: any;
    evaluation: {
      requiredApprovals: RuleEvaluation[];
      potentialReviewApprovals: RuleEvaluation[];
      externalApprovals: RuleEvaluation[];
      notApplicableApprovals: RuleEvaluation[];
    };
    conflicts: ConflictRecord[];
  } | null>(null);
  const [activeCategory, setActiveCategory] = useState<
    'REQUIRED' | 'POTENTIAL_REVIEW' | 'EXTERNAL' | 'NOT_APPLICABLE'
  >('REQUIRED');
  const [selectedRule, setSelectedRule] = useState<RuleEvaluation | null>(null);

  useEffect(() => {
    apiFetch<any>(`/api/projects/${projectId}/approvals`).then((res) => {
      setData(res);
      if (res.evaluation?.requiredApprovals?.length > 0) {
        setSelectedRule(res.evaluation.requiredApprovals[0]);
      }
    });
  }, [projectId]);

  if (!data) {
    return (
      <div className="p-6 bg-white border border-slate-200 rounded-lg text-xs text-slate-600">
        Evaluating deterministic Maharashtra regulatory rules...
      </div>
    );
  }

  const listMap = {
    REQUIRED: data.evaluation.requiredApprovals,
    POTENTIAL_REVIEW: data.evaluation.potentialReviewApprovals,
    EXTERNAL: data.evaluation.externalApprovals,
    NOT_APPLICABLE: data.evaluation.notApplicableApprovals,
  };

  const currentList = listMap[activeCategory] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-sky-800">
            STEP 04 · DETERMINISTIC APPROVAL DISCOVERY & EXPLAINABILITY
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">
            Applicable Maharashtra Industrial Approvals & Rule Trace
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Every approval below is triggered deterministically by versioned JSON rules and backed by verified statutory sources.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to={`/projects/${projectId}/intake`}
            className="px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 hover:bg-slate-50"
          >
            Modify Project Facts
          </Link>
          <Link
            to={`/projects/${projectId}/journey`}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 flex items-center gap-1.5"
          >
            <GitBranch className="w-3.5 h-3.5" />
            View Knowledge Graph Journey →
          </Link>
        </div>
      </div>

      {/* Category Switcher Tabs (4 required groups) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          onClick={() => {
            setActiveCategory('REQUIRED');
            setSelectedRule(data.evaluation.requiredApprovals[0] || null);
          }}
          className={`p-4 rounded-lg border text-left transition-colors ${
            activeCategory === 'REQUIRED'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="text-xs opacity-80">01. Mandatory Statutory</div>
          <div className="text-lg font-bold font-mono tabular-nums mt-0.5">
            {data.evaluation.requiredApprovals.length} Required Approvals
          </div>
        </button>

        <button
          onClick={() => {
            setActiveCategory('POTENTIAL_REVIEW');
            setSelectedRule(data.evaluation.potentialReviewApprovals[0] || null);
          }}
          className={`p-4 rounded-lg border text-left transition-colors ${
            activeCategory === 'POTENTIAL_REVIEW'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="text-xs opacity-80">02. Conditional / Advisor Review</div>
          <div className="text-lg font-bold font-mono tabular-nums mt-0.5">
            {data.evaluation.potentialReviewApprovals.length} Potential Review
          </div>
        </button>

        <button
          onClick={() => {
            setActiveCategory('EXTERNAL');
            setSelectedRule(data.evaluation.externalApprovals[0] || null);
          }}
          className={`p-4 rounded-lg border text-left transition-colors ${
            activeCategory === 'EXTERNAL'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="text-xs opacity-80">03. External Central Portals</div>
          <div className="text-lg font-bold font-mono tabular-nums mt-0.5">
            {data.evaluation.externalApprovals.length} External (PESO/NSWS)
          </div>
        </button>

        <button
          onClick={() => {
            setActiveCategory('NOT_APPLICABLE');
            setSelectedRule(data.evaluation.notApplicableApprovals[0] || null);
          }}
          className={`p-4 rounded-lg border text-left transition-colors ${
            activeCategory === 'NOT_APPLICABLE'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="text-xs opacity-80">04. Below Threshold</div>
          <div className="text-lg font-bold font-mono tabular-nums mt-0.5">
            {data.evaluation.notApplicableApprovals.length} Not Applicable
          </div>
        </button>
      </div>

      {/* Master-Detail Split View: Approval List + Explainable Rule Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List */}
        <div className="lg:col-span-5 space-y-2.5">
          {currentList.map((item) => {
            const isSelected = selectedRule?.ruleId === item.ruleId;
            return (
              <button
                key={item.ruleId}
                onClick={() => setSelectedRule(item)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  isSelected
                    ? 'bg-white border-slate-900 ring-1 ring-slate-900'
                    : 'bg-white border-slate-200 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                  <span>
                    {item.ruleId} · v{item.ruleVersion}
                  </span>
                  <span>{item.stage}</span>
                </div>
                <div className="text-sm font-bold text-slate-900 mt-1">{item.approvalName}</div>
                <div className="text-xs text-slate-600 mt-0.5">{item.authority}</div>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-700">
                    Published: {item.publishedTimeline}
                  </span>
                  <span className="font-mono text-emerald-700 font-medium">
                    {item.verificationStatus} ({item.lastVerified})
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Full Explainable Rule Inspection Card */}
        <div className="lg:col-span-7">
          {selectedRule ? (
            <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
              <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-mono text-sky-800">
                    RULE ID: {selectedRule.ruleId} (Version {selectedRule.ruleVersion}) · STAGE: {selectedRule.stage}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                    {selectedRule.approvalName}
                  </h2>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Competent Authority: <strong>{selectedRule.authority}</strong>
                  </div>
                </div>
                <div className="text-right font-mono text-xs">
                  <div className="text-emerald-700 font-semibold">
                    {selectedRule.verificationStatus}
                  </div>
                  <div className="text-slate-500">Verified: {selectedRule.lastVerified}</div>
                </div>
              </div>

              {/* 1. Why It Applies */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-sky-800" />
                  Why This Rule Applies (Deterministic Evaluation)
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{selectedRule.whyApplies}</p>
              </div>

              {/* 2. Trigger Facts */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-900">
                  Matched Project Trigger Facts ({selectedRule.matchedTriggerFacts.length})
                </div>
                {selectedRule.matchedTriggerFacts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedRule.matchedTriggerFacts.map((fact, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 border border-slate-200 rounded bg-white text-xs flex items-start gap-2"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-slate-500">{fact.label}</div>
                          <div className="font-mono font-semibold text-slate-900">{fact.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 border border-amber-200 bg-amber-50 rounded text-xs text-amber-900">
                    Unmatched Threshold Conditions: {selectedRule.unmatchedConditions.join('; ')}
                  </div>
                )}
              </div>

              {/* 3. Legal Basis & Source Provenance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 rounded-lg space-y-1.5 text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-sky-800" />
                    Statutory Legal Basis
                  </div>
                  <div>
                    <span className="text-slate-500">Act:</span>{' '}
                    <span className="font-medium text-slate-900">{selectedRule.legalBasis.act}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Section:</span>{' '}
                    <span className="font-mono font-semibold text-slate-900">
                      {selectedRule.legalBasis.section}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Rule / Regulation:</span>{' '}
                    <span className="text-slate-800">{selectedRule.legalBasis.rule}</span>
                  </div>
                </div>

                <div className="p-4 border border-slate-200 rounded-lg space-y-1.5 text-xs">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>Verified Regulatory Source</span>
                    <span className="font-mono text-sky-800">{selectedRule.sourceCode}</span>
                  </div>
                  <div className="text-slate-800 font-medium">{selectedRule.sourceName}</div>
                  <div className="text-slate-500 font-mono">
                    Effective From: {selectedRule.effectiveFrom}{' '}
                    {selectedRule.effectiveUntil ? `to ${selectedRule.effectiveUntil}` : '(Current)'}
                  </div>
                  <a
                    href={selectedRule.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sky-800 font-semibold hover:underline pt-1"
                  >
                    Official Authority Portal ({selectedRule.sourceUrl})
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* 4. Published Timeline vs Observed Processing Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 border border-slate-200 rounded-lg bg-slate-50 text-xs">
                  <div className="text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-700" />
                    Published Statutory Timeline (RTS / Act)
                  </div>
                  <div className="text-base font-bold font-mono text-slate-900 mt-1">
                    {selectedRule.publishedTimeline}
                  </div>
                  <div className="text-slate-500 mt-1">Renewal: {selectedRule.renewalInfo}</div>
                </div>

                <div className="p-3.5 border border-slate-200 rounded-lg bg-slate-50 text-xs">
                  <div className="text-slate-500">
                    Observed Public Processing Info / Source Comparison
                  </div>
                  <div className="text-slate-800 font-medium mt-1 leading-relaxed">
                    {selectedRule.observedProcessingInfo}
                  </div>
                </div>
              </div>

              {/* 5. Required Documents & Dependencies */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 border border-slate-200 rounded-lg space-y-2">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-sky-800" />
                    Mandatory Supporting Documents ({selectedRule.documents.length})
                  </div>
                  <ul className="space-y-1 text-slate-700 list-disc list-inside">
                    {selectedRule.documents.map((doc, i) => (
                      <li key={i}>{doc}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 border border-slate-200 rounded-lg space-y-2">
                  <div className="font-bold text-slate-900">
                    Sequencing Dependencies & Parallel Execution
                  </div>
                  <div>
                    <span className="text-slate-500">Prerequisite Approvals:</span>{' '}
                    {selectedRule.dependencies.length > 0 ? (
                      <span className="font-mono font-semibold text-slate-900">
                        {selectedRule.dependencies.join(', ')}
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-medium">
                        None (Entry-stage approval)
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-500">Can Run in Parallel With:</span>{' '}
                    {selectedRule.parallelWith.length > 0 ? (
                      <span className="font-mono text-slate-800">
                        {selectedRule.parallelWith.join(', ')}
                      </span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <div className="font-semibold text-slate-900">
                      Statutory Escalation Mechanism:
                    </div>
                    <div className="text-slate-600 mt-0.5">
                      {selectedRule.escalationMechanism.act} ({selectedRule.escalationMechanism.section}) →{' '}
                      <strong>{selectedRule.escalationMechanism.appellateAuthority}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-white border border-slate-200 rounded-lg text-xs text-slate-500">
              Select an approval on the left to inspect its full legal rule trace.
            </div>
          )}
        </div>
      </div>

      {/* Regulatory Conflict Detector Section */}
      <div className="bg-white border border-amber-300 rounded-lg p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 pb-3">
          <div>
            <div className="text-xs font-mono text-amber-800 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              REGULATORY CONFLICT DETECTOR · MULTI-SOURCE VARIANCE DISCLOSURE
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-0.5">
              Conflicting Official Timelines & Thresholds Across Sources
            </h2>
            <p className="text-xs text-slate-600">
              When statutory Acts, Maharashtra RTS notifications, and departmental circulars differ, MahaRegulate shows all sources side-by-side without guessing or fabricating a resolution.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-amber-800 shrink-0">
            STATUS: REQUIRES REVIEW ({data.conflicts.length} CONFLICTS)
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {data.conflicts.map((conf) => {
            const sources = JSON.parse(conf.sourcesComparisonJson || '[]');
            return (
              <div
                key={conf.id}
                className="border border-slate-200 rounded-lg p-4 bg-amber-50/30 flex flex-col justify-between space-y-3 text-xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-mono text-slate-500">
                    <span>{conf.conflictCode}</span>
                    <span className="text-amber-800 font-semibold">{conf.status}</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">{conf.approvalName}</div>

                  <div className="space-y-2 pt-1">
                    {sources.map((s: any, idx: number) => (
                      <div key={idx} className="p-2.5 bg-white border border-slate-200 rounded space-y-0.5">
                        <div className="flex items-center justify-between font-semibold text-slate-900">
                          <span>
                            {s.label}: {s.sourceName}
                          </span>
                          <span className="font-mono text-sky-800">{s.value}</span>
                        </div>
                        <div className="text-slate-600">{s.authority}</div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {s.legalBasis} · Pub: {s.publicationDate} · Verified: {s.lastVerified}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-200/80 text-slate-700 leading-relaxed">
                  <strong>Advisor Guidance Note:</strong> {conf.advisorGuidanceNote}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
