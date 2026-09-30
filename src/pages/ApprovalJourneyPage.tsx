import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
  MarkerType,
} from '@xyflow/react';
import { GitBranch, Clock, AlertTriangle, CheckCircle2, FileCheck2 } from 'lucide-react';
import { apiFetch } from '../services/api.ts';
import { RuleEvaluation, ApplicationRecord } from '../types/regulatory.ts';

export const ApprovalJourneyPage: React.FC = () => {
  const { id } = useParams();
  const projectId = Number(id) || 1;

  const [data, setData] = useState<{
    project: any;
    evaluation: {
      requiredApprovals: RuleEvaluation[];
      externalApprovals: RuleEvaluation[];
    };
    applications: ApplicationRecord[];
  } | null>(null);
  const [selectedRef, setSelectedRef] = useState<string>('MPCB_CTE');

  useEffect(() => {
    apiFetch<any>(`/api/projects/${projectId}/journey`).then(setData);
  }, [projectId]);

  const { nodes, edges } = useMemo(() => {
    const appStatusByRef = new Map<string, ApplicationRecord>();
    data?.applications?.forEach((a) => appStatusByRef.set(a.approvalRef, a));

    const getStatusBadge = (ref: string) => {
      const app = appStatusByRef.get(ref);
      if (!app) return { text: 'PREREQ BLOCKED', bg: '#f8fafc', border: '#94a3b8', color: '#475569' };
      if (app.state === 'APPROVED') return { text: 'APPROVED', bg: '#f0fdf4', border: '#16a34a', color: '#15803d' };
      if (app.state === 'QUERY_RAISED') return { text: 'CLOCK PAUSED (Q-102)', bg: '#fffbeb', border: '#d97706', color: '#b45309' };
      if (app.state === 'BREACHED') return { text: 'BREACHED (65d/60d)', bg: '#fef2f2', border: '#dc2626', color: '#b91c1c' };
      if (app.state === 'UNDER_SCRUTINY') return { text: 'UNDER SCRUTINY', bg: '#f0f9ff', border: '#0284c7', color: '#0369a1' };
      return { text: app.state, bg: '#ffffff', border: '#cbd5e1', color: '#334155' };
    };

    const rawNodes: {
      id: string;
      title: string;
      stage: string;
      days: string;
      x: number;
      y: number;
    }[] = [
      { id: 'MIDC_LAND_ALLOTMENT', title: '01. MIDC Land Allotment', stage: 'PRE_LAND', days: '30d', x: 40, y: 180 },
      { id: 'FIRE_PROVISIONAL_NOC', title: '02. Provisional Fire NOC', stage: 'PRE_CONSTRUCTION', days: '15d', x: 300, y: 40 },
      { id: 'MPCB_CTE', title: '03. MPCB Consent to Establish', stage: 'PRE_ESTABLISHMENT', days: '60d', x: 300, y: 180 },
      { id: 'DISH_FACTORY_PLAN', title: '04. DISH Factory Plan Approval', stage: 'PRE_CONSTRUCTION', days: '60d', x: 300, y: 320 },
      { id: 'PESO_PRIOR_APPROVAL', title: '05. PESO Solvent Prior Approval', stage: 'EXTERNAL', days: '30d', x: 300, y: 450 },
      { id: 'MIDC_BUILDING_PLAN', title: '06. MIDC Building Plan (BPA)', stage: 'PRE_CONSTRUCTION', days: '30d', x: 580, y: 60 },
      { id: 'BOILER_ERECTION_PERMIT', title: '07. Boiler Erection Permit (IBR)', stage: 'PRE_OPERATION', days: '15d', x: 850, y: 40 },
      { id: 'MIDC_BCC_OCCUPANCY', title: '08. MIDC Building Completion (BCC)', stage: 'PRE_OPERATION', days: '21d', x: 850, y: 180 },
      { id: 'LAB_CLRA_REGISTRATION', title: '09. CLRA Registration (≥50)', stage: 'PRE_OPERATION', days: '7d', x: 850, y: 330 },
      { id: 'MPCB_CTO', title: '10. MPCB 1st CTO & HW CCA', stage: 'PRE_OPERATION', days: '60d', x: 1130, y: 120 },
      { id: 'DISH_FACTORY_LICENSE', title: '11. DISH Factory License (Form 4)', stage: 'PRE_OPERATION', days: '30d', x: 1130, y: 270 },
    ];

    const builtNodes: Node[] = rawNodes.map((n) => {
      const badge = getStatusBadge(n.id);
      return {
        id: n.id,
        position: { x: n.x, y: n.y },
        data: {
          label: (
            <div className="text-left space-y-1 p-1">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span style={{ color: badge.color, fontWeight: 700 }}>{badge.text}</span>
                <span className="text-slate-500">{n.days}</span>
              </div>
              <div className="text-xs font-bold text-slate-900 leading-snug">{n.title}</div>
              <div className="text-[10px] font-mono text-slate-500">{n.stage}</div>
            </div>
          ),
        },
        style: {
          background: badge.bg,
          border: `2px solid ${selectedRef === n.id ? '#0f172a' : badge.border}`,
          borderRadius: '8px',
          width: 220,
          padding: '6px',
          cursor: 'pointer',
        },
      };
    });

    const rawEdges: [string, string][] = [
      ['MIDC_LAND_ALLOTMENT', 'FIRE_PROVISIONAL_NOC'],
      ['MIDC_LAND_ALLOTMENT', 'MPCB_CTE'],
      ['MIDC_LAND_ALLOTMENT', 'DISH_FACTORY_PLAN'],
      ['MIDC_LAND_ALLOTMENT', 'PESO_PRIOR_APPROVAL'],
      ['FIRE_PROVISIONAL_NOC', 'MIDC_BUILDING_PLAN'],
      ['MIDC_BUILDING_PLAN', 'BOILER_ERECTION_PERMIT'],
      ['MIDC_BUILDING_PLAN', 'MIDC_BCC_OCCUPANCY'],
      ['DISH_FACTORY_PLAN', 'LAB_CLRA_REGISTRATION'],
      ['DISH_FACTORY_PLAN', 'DISH_FACTORY_LICENSE'],
      ['MIDC_BCC_OCCUPANCY', 'DISH_FACTORY_LICENSE'],
      ['MPCB_CTE', 'MPCB_CTO'],
      ['MIDC_BCC_OCCUPANCY', 'MPCB_CTO'],
    ];

    const builtEdges: Edge[] = rawEdges.map(([src, tgt]) => ({
      id: `${src}->${tgt}`,
      source: src,
      target: tgt,
      animated: src === 'MPCB_CTE' || src === 'DISH_FACTORY_PLAN',
      style: { stroke: '#475569', strokeWidth: 1.75 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#475569',
      },
    }));

    return { nodes: builtNodes, edges: builtEdges };
  }, [data, selectedRef]);

  if (!data) {
    return (
      <div className="p-6 bg-white border border-slate-200 rounded-lg text-xs">
        Building Regulatory Knowledge Graph...
      </div>
    );
  }

  const allRules = [
    ...(data.evaluation?.requiredApprovals || []),
    ...(data.evaluation?.externalApprovals || []),
  ];
  const activeRule = allRules.find((r) => r.approvalRef === selectedRef) || allRules[0];
  const activeApp = data.applications.find((a) => a.approvalRef === selectedRef);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-sky-800">
            STEP 05 · REGULATORY KNOWLEDGE GRAPH & APPROVAL SEQUENCING
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">
            End-to-End Industrial Approval Dependency Graph
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Click any approval node in the graph to inspect prerequisites, parallel opportunities, required documents, and current legal clock state.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1 text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
          </span>
          <span className="flex items-center gap-1 text-amber-700">
            <Clock className="w-3.5 h-3.5" /> Clock Paused (Q-102)
          </span>
          <span className="flex items-center gap-1 text-red-700">
            <AlertTriangle className="w-3.5 h-3.5" /> Breached
          </span>
        </div>
      </div>

      {/* React Flow Interactive Canvas */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden h-[500px] relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodeClick={(_e, node) => setSelectedRef(node.id)}
          fitView
          attributionPosition="bottom-right"
        >
          <Background color="#cbd5e1" gap={20} />
          <Controls />
        </ReactFlow>
      </div>

      {/* Selected Node Inspection + Parallel & Critical Path Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          {activeRule && (
            <>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="text-xs font-mono text-sky-800">
                    SELECTED GRAPH NODE · {activeRule.ruleId}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">{activeRule.approvalName}</h2>
                  <div className="text-xs text-slate-600">{activeRule.authority}</div>
                </div>
                <div className="text-right font-mono text-xs">
                  <div className="font-bold text-slate-900">
                    Published: {activeRule.publishedTimeline}
                  </div>
                  <div className="text-slate-500">Stage: {activeRule.stage}</div>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">{activeRule.whyApplies}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                  <div className="font-semibold text-slate-900 mb-1">
                    Must Complete Before This Node:
                  </div>
                  {activeRule.dependencies.length > 0 ? (
                    <div className="font-mono text-slate-800">
                      {activeRule.dependencies.join(' → ')}
                    </div>
                  ) : (
                    <div className="text-emerald-700 font-medium">
                      Root Node (Can start immediately)
                    </div>
                  )}
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                  <div className="font-semibold text-slate-900 mb-1">
                    Can Run in Parallel With:
                  </div>
                  {activeRule.parallelWith.length > 0 ? (
                    <div className="font-mono text-slate-800">
                      {activeRule.parallelWith.join(' · ')}
                    </div>
                  ) : (
                    <div className="text-slate-500">Sequential milestone</div>
                  )}
                </div>
              </div>

              {activeApp && (
                <div className="p-4 border border-slate-200 rounded-lg flex items-center justify-between text-xs bg-slate-50">
                  <div>
                    <div className="font-mono font-semibold text-slate-900">
                      Active Application: {activeApp.applicationCode} · State: {activeApp.state}
                    </div>
                    <div className="text-slate-600 mt-0.5">
                      Elapsed: {activeApp.daysElapsed}d / {activeApp.publishedTimelineDays}d · Clock Paused:{' '}
                      {activeApp.isClockPaused ? 'YES' : 'NO'}
                    </div>
                  </div>
                  <Link
                    to={`/officer/applications/${activeApp.id}`}
                    className="px-3 py-1.5 bg-slate-900 text-white rounded font-semibold hover:bg-slate-800"
                  >
                    Open Legal Clock →
                  </Link>
                </div>
              )}
            </>
          )}
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-6 space-y-4 text-xs">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-sky-800" />
            Critical Path & Sequencing Intelligence
          </h2>

          <div className="p-3.5 border border-slate-200 rounded-lg space-y-1.5">
            <div className="font-bold text-slate-900">
              1. Critical Path Bottleneck (150 Working Days Sequential):
            </div>
            <p className="text-slate-600 font-mono leading-relaxed">
              MIDC Plot Allotment (30d) → MPCB CTE (60d) → Civil Construction & ETP Installation → MIDC BCC (21d) → MPCB 1st CTO (60d)
            </p>
          </div>

          <div className="p-3.5 border border-slate-200 rounded-lg space-y-1.5">
            <div className="font-bold text-slate-900">
              2. Parallel Execution Window (Saves 105 Days):
            </div>
            <p className="text-slate-600 leading-relaxed">
              Immediately after MIDC Plot Allotment, file <strong>Provisional Fire NOC</strong>, <strong>MPCB CTE</strong>, <strong>DISH Factory Plan</strong>, and <strong>PESO Tank Farm Prior Approval</strong> simultaneously instead of waiting sequentially.
            </p>
          </div>

          <div className="p-3.5 border border-slate-200 rounded-lg space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-emerald-700" />
              3. High-Impact Document Reuse:
            </div>
            <p className="text-slate-600 leading-relaxed">
              Your <strong>MIDC Plot Allotment Letter</strong> and <strong>Detailed Project Report (DPR)</strong> are reused across 7 separate departmental applications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
