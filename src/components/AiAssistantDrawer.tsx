import React, { useState } from 'react';
import { X, Send, BookOpen, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import { apiFetch } from '../services/api.ts';

interface Citation {
  ruleId: string;
  sourceCode: string;
  sourceName: string;
  legalSection: string;
  lastVerified: string;
  verificationStatus: string;
}

interface AiMessage {
  id: string;
  question: string;
  answer: string;
  verifiable: boolean;
  citations: Citation[];
  engineMode: string;
}

const SUGGESTED_QUESTIONS = [
  'What approvals apply to my project?',
  'Why is this approval required?',
  'What document am I missing?',
  'Why is my application blocked?',
  'What happens after a query?',
  'Which approvals can run in parallel?',
  'What changed when I changed my power requirement?',
];

export const AiAssistantDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
}> = ({ isOpen, onClose, projectId }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      id: 'initial-1',
      question: 'What approvals apply to my project?',
      answer:
        'For Bulk Drug Manufacturing Unit (Unit-II) at Mahad MIDC (Aarogya APIs Pvt Ltd), 9 Required Approvals apply under Maharashtra rules (including MIDC Plot Allotment, Provisional Fire NOC, MIDC Building Plan Approval, MPCB Consent to Establish [Red Category], DISH Factory Building Plan Approval, Steam Boiler Erection Permit, CLRA Principal Employer Registration, MIDC BCC, MPCB CTO, and DISH Factory License), 1 External Central Approval (PESO Solvent Tank Farm Prior Approval), and 1 Potential Review item (Hazardous Waste Form 2 vs CCA). At 140 kVA, CEIG HT Approval is not triggered (triggers at ≥ 150 kVA).',
      verifiable: true,
      citations: [
        {
          ruleId: 'ENV-MPCB-CTE-001',
          sourceCode: 'SRC-MPCB-CONSENT-2021',
          sourceName: 'Water Act 1974 & Air Act 1981 — MPCB Consent Management Circular',
          legalSection: 'Section 25 (Water Act) / Section 21 (Air Act)',
          lastVerified: '2026-09-18',
          verificationStatus: 'VERIFIED',
        },
        {
          ruleId: 'FAC-DISH-PLAN-004',
          sourceCode: 'SRC-DISH-FACTORIES-1963',
          sourceName: 'Factories Act, 1948 & Maharashtra Factories Rules, 1963',
          legalSection: 'Section 6, Section 41A & Rule 3A',
          lastVerified: '2026-09-20',
          verificationStatus: 'VERIFIED',
        },
      ],
      engineMode: 'DETERMINISTIC_KNOWLEDGE_BASE',
    },
  ]);

  if (!isOpen) return null;

  const askQuestion = async (qText: string) => {
    const trimmed = qText.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setInput('');
    try {
      const res = await apiFetch<{
        question: string;
        answer: string;
        verifiable: boolean;
        citations: Citation[];
        engineMode: string;
      }>(`/api/projects/${projectId}/ai-assistant`, {
        method: 'POST',
        body: JSON.stringify({ question: trimmed }),
      });

      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          question: trimmed,
          answer: res.answer,
          verifiable: res.verifiable,
          citations: res.citations || [],
          engineMode: res.engineMode,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          question: trimmed,
          answer: "I couldn't verify this from the current regulatory knowledge base.",
          verifiable: false,
          citations: [],
          engineMode: 'ERROR_FALLBACK',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-[1px]">
      <div className="w-full max-w-xl bg-white h-full border-l border-slate-200 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div>
            <div className="text-xs font-mono text-sky-400">
              RULES DECIDE · SOURCES PROVE · AI EXPLAINS
            </div>
            <h2 className="text-base font-semibold mt-0.5">
              Explainable Regulatory Knowledge Assistant
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guardrail notice */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 flex items-center justify-between">
          <span>
            Grounded strictly on verified Maharashtra rules. Unverified claims are rejected.
          </span>
          <span className="font-mono text-slate-500">Project #{projectId}</span>
        </div>

        {/* Suggested prompts */}
        <div className="px-6 py-3 border-b border-slate-200 bg-white">
          <div className="text-xs font-medium text-slate-500 mb-2">
            Contextual Knowledge Base Queries:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => askQuestion(q)}
                disabled={loading}
                className="text-xs px-2.5 py-1 rounded border border-slate-200 bg-slate-50 text-slate-700 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-900 transition-colors text-left"
              >
                {q}
              </button>
            ))}
            <button
              onClick={() => askQuestion('Can I get an unverified offshore customs tax holiday?')}
              disabled={loading}
              className="text-xs px-2.5 py-1 rounded border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors text-left"
            >
              Test Unverified Query Guardrail
            </button>
          </div>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {messages.map((m) => (
            <div key={m.id} className="space-y-2">
              <div className="flex justify-end">
                <div className="bg-slate-900 text-white text-sm px-4 py-2.5 rounded-lg max-w-md">
                  {m.question}
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg bg-white p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-2">
                  <span className="font-medium text-slate-700 flex items-center gap-1.5">
                    {m.verifiable ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    )}
                    {m.verifiable ? 'Verified Knowledge Base Explanation' : 'Unverified Query Guard Triggered'}
                  </span>
                  <span className="font-mono">{m.engineMode}</span>
                </div>

                <p className="text-sm text-slate-800 leading-relaxed">{m.answer}</p>

                {m.citations.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-sky-700" />
                      Mandatory Regulatory Citations ({m.citations.length})
                    </div>
                    {m.citations.map((cit, idx) => (
                      <div
                        key={`${cit.ruleId}-${idx}`}
                        className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-mono">
                          <span className="font-semibold text-slate-900">
                            Rule: {cit.ruleId} · Source: {cit.sourceCode}
                          </span>
                          <span className="text-emerald-700 font-medium">
                            {cit.verificationStatus} · Verified {cit.lastVerified}
                          </span>
                        </div>
                        <div className="text-slate-700 font-medium">{cit.sourceName}</div>
                        <div className="text-slate-600">
                          Legal Section: <span className="font-mono">{cit.legalSection}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 text-xs text-slate-600 font-mono">
              Retrieving deterministic rule trace & verifying source citations...
            </div>
          )}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            askQuestion(input);
          }}
          className="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-2"
        >
          <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about approvals, triggers, missing documents, queries, or power simulator..."
            className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-700"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
          >
            <Send className="w-3.5 h-3.5" />
            Ask KB
          </button>
        </form>
      </div>
    </div>
  );
};
