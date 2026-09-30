import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Scale, Clock, GitBranch, FileCheck2, Sliders } from 'lucide-react';
import heroFacilityImg from '../assets/images/hero_industrial_maharashtra_1790738745006.jpg';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-slate-200 max-w-[1440px] w-full mx-auto">
        {/* Zone 1: Single text element wordmark */}
        <Link to="/" className="text-lg font-bold tracking-tight text-slate-900">
          MahaRegulate
        </Link>

        {/* Zone 2: 5 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <a href="#how-it-works" className="hover:text-slate-900 transition-colors whitespace-nowrap">
            How It Works
          </a>
          <a href="#approval-intelligence" className="hover:text-slate-900 transition-colors whitespace-nowrap">
            Approvals
          </a>
          <a href="#legal-clock" className="hover:text-slate-900 transition-colors whitespace-nowrap">
            Legal Clock
          </a>
          <a href="#simulator" className="hover:text-slate-900 transition-colors whitespace-nowrap">
            Simulator
          </a>
          <a href="#transparency" className="hover:text-slate-900 transition-colors whitespace-nowrap">
            Transparency
          </a>
        </nav>

        {/* Zone 3: 2 primary actions */}
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors whitespace-nowrap"
          >
            Sign In
          </Link>
          <button
            onClick={() => navigate('/projects/1/intake')}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            Create Project
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-[1440px] w-full mx-auto px-8 py-16 lg:py-20 border-b border-slate-200">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="text-xs text-slate-600 font-medium">
              Designed to work alongside Maharashtra&apos;s existing approval ecosystem · Rules Decide · Sources Prove · AI Explains
            </div>

            <h1
              className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.12]"
              style={{ textWrap: 'balance' }}
            >
              Understand every approval. Prepare every application. Stay ahead of compliance.
            </h1>

            <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
              An explainable regulatory intelligence platform for industrial projects in Maharashtra. Discover exact statutory triggers across MIDC, MPCB, DISH, Boilers, Labour, and CEIG—backed by versioned legal rules and verifiable source citations.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => navigate('/projects/1/intake')}
                className="px-6 py-3 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                Create Project
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#how-it-works"
                className="px-6 py-3 border border-slate-300 text-slate-800 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                Explore How It Works
              </a>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-3 text-sm font-medium text-sky-800 hover:underline whitespace-nowrap"
              >
                Open Aarogya APIs Demo Workspace →
              </button>
            </div>

            <div className="pt-4 border-t border-slate-200 text-xs text-slate-500 flex flex-wrap items-center gap-2">
              <span>Complements MAITRI & NSWS</span>
              <span>·</span>
              <span>Deterministic Rule Trace</span>
              <span>·</span>
              <span>Statutory Clock & Query Tracking</span>
              <span>·</span>
              <span>Zero Hallucinated Laws</span>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 aspect-video">
              <img
                src={heroFacilityImg}
                alt="Maharashtra industrial chemical and API manufacturing facility"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent flex flex-col justify-end p-5 text-white">
                <div className="text-xs font-mono text-sky-300">
                  DEMO CASE · AAROGYA APIs PVT LTD (SYNTHETIC DEMO DATA)
                </div>
                <div className="text-sm font-semibold mt-0.5">
                  Bulk Drug Manufacturing Unit · Mahad MIDC · ₹45 Cr Investment · 140 kVA
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  12 Versioned Rules · 3 Regulatory Conflicts Flagged · 1 Active Query (#Q-102)
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: Problem & Positioning */}
      <section className="max-w-[1440px] w-full mx-auto px-8 py-16 border-b border-slate-200">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4">
            <div className="text-xs font-mono text-sky-800">01. THE INDUSTRIAL CHALLENGE</div>
            <h2 className="text-2xl font-bold text-slate-900 mt-2">
              Why industrial projects face avoidable delays before commissioning
            </h2>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              Industrial entrepreneurs and compliance advisors navigate dozens of interlocking statutes across land, environment, factory safety, boilers, electrical installations, and contract labour.
            </p>
          </div>
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 border border-slate-200 rounded-lg bg-slate-50/60">
              <h3 className="text-base font-semibold text-slate-900">
                01. Opaque Applicability & Sequencing
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Entrepreneurs rarely see which approvals depend on others (such as Provisional Fire NOC before MIDC Building Plan Approval) versus which can run in parallel.
              </p>
            </div>
            <div className="p-6 border border-slate-200 rounded-lg bg-slate-50/60">
              <h3 className="text-base font-semibold text-slate-900">
                02. Cross-Document Contradictions
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                A mismatch between declared electrical load (140 kVA) and an uploaded MSEDCL load sheet (185 kVA) triggers scrutiny queries that pause statutory clocks for weeks.
              </p>
            </div>
            <div className="p-6 border border-slate-200 rounded-lg bg-slate-50/60">
              <h3 className="text-base font-semibold text-slate-900">
                03. Conflicting Published Timelines
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Central statutes, Maharashtra RTS notifications, and departmental circulars often publish different timelines. Hiding those conflicts creates compliance blind spots.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: How It Works & Core Architecture */}
      <section id="how-it-works" className="max-w-[1440px] w-full mx-auto px-8 py-16 border-b border-slate-200 bg-slate-50">
        <div className="max-w-3xl mb-10">
          <div className="text-xs font-mono text-sky-800">02. CORE ARCHITECTURE</div>
          <h2 className="text-2xl font-bold text-slate-900 mt-2">
            Rules Decide. Sources Prove. AI Explains.
          </h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            An LLM is never permitted to invent an approval, legal section, deadline, threshold, or statutory consequence. Every output is computed by a deterministic backend rules engine and linked to verified regulatory sources.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div id="approval-intelligence" className="p-6 bg-white border border-slate-200 rounded-lg space-y-3">
            <Scale className="w-5 h-5 text-sky-800" />
            <h3 className="text-base font-semibold text-slate-900">
              01. Approval Intelligence & Conflict Detector
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Evaluates project parameters against versioned JSON rules (`ENV-MPCB-CTE-001`, `FAC-DISH-PLAN-004`, `PWR-CEIG-HT-008`). Surfaces multi-source timeline conflicts without fabricating a resolution.
            </p>
            <Link to="/projects/1/approvals" className="inline-block text-xs font-semibold text-sky-800 hover:underline">
              Inspect Approval Discovery →
            </Link>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-lg space-y-3">
            <GitBranch className="w-5 h-5 text-sky-800" />
            <h3 className="text-base font-semibold text-slate-900">
              02. Regulatory Knowledge Graph Journey
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Interactive React Flow dependency graph mapping `LAND → FIRE → BUILDING PLAN / MPCB CTE / DISH PLAN → CONSTRUCTION → BCC → MPCB CTO / FACTORY LICENSE → PRODUCTION`.
            </p>
            <Link to="/projects/1/journey" className="inline-block text-xs font-semibold text-sky-800 hover:underline">
              Open Dependency Graph →
            </Link>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-lg space-y-3">
            <FileCheck2 className="w-5 h-5 text-sky-800" />
            <h3 className="text-base font-semibold text-slate-900">
              03. Document Pre-Validation & Readiness
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Separates OCR extraction from human verification. Runs deterministic cross-checks for company name, plot number, power load mismatches, and missing mandatory declarations.
            </p>
            <Link to="/projects/1/documents" className="inline-block text-xs font-semibold text-sky-800 hover:underline">
              Review Document Validation →
            </Link>
          </div>

          <div id="legal-clock" className="p-6 bg-white border border-slate-200 rounded-lg space-y-3">
            <Clock className="w-5 h-5 text-sky-800" />
            <h3 className="text-base font-semibold text-slate-900">
              04. Legal Clock & Query Management
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              State machine tracking completeness, clock start, query pause (`QUERY #Q-102`), applicant response, clock resume, deadline breach, and Maharashtra RTS Act Section 9 Escalation Dossiers.
            </p>
            <Link to="/officer/applications/4" className="inline-block text-xs font-semibold text-sky-800 hover:underline">
              Explore Legal Clock & Query #Q-102 →
            </Link>
          </div>

          <div id="simulator" className="p-6 bg-white border border-slate-200 rounded-lg space-y-3">
            <Sliders className="w-5 h-5 text-sky-800" />
            <h3 className="text-base font-semibold text-slate-900">
              05. What-If Regulatory Simulator
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Test engineering changes before filing: change electrical load from 140 kVA to 250 kVA or contract workers from 60 to 35 and immediately see which approvals and documents change.
            </p>
            <Link to="/projects/1/simulator" className="inline-block text-xs font-semibold text-sky-800 hover:underline">
              Launch What-If Simulator →
            </Link>
          </div>

          <div id="transparency" className="p-6 bg-white border border-slate-200 rounded-lg space-y-3">
            <Shield className="w-5 h-5 text-sky-800" />
            <h3 className="text-base font-semibold text-slate-900">
              06. Security, Multi-Tenancy & Source Transparency
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Strict tenant isolation across organizations, immutable rule version history, audit logs, and explicit labeling of `VERIFIED`, `UNDER REVIEW`, `SYNTHETIC DEMO DATA`, and `SIMULATION` states.
            </p>
            <Link to="/admin" className="inline-block text-xs font-semibold text-sky-800 hover:underline">
              Inspect Governance & Unit Tests →
            </Link>
          </div>
        </div>
      </section>

      {/* Section 3: Data Transparency & Legal Positioning */}
      <section className="max-w-[1440px] w-full mx-auto px-8 py-14">
        <div className="p-8 border border-slate-200 rounded-xl bg-slate-900 text-white grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-2">
            <div className="text-xs font-mono text-amber-400">
              REGULATORY POSITIONING & DATA TRANSPARENCY
            </div>
            <h3 className="text-xl font-bold">
              Designed to work alongside Maharashtra&apos;s existing approval ecosystem.
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              MahaRegulate is an independent regulatory intelligence and compliance orchestration layer. It is not MAITRI, NSWS, MPCB, or MIDC, and does not issue government approvals or claim automatic approval upon deadline expiry. This platform provides regulatory information and workflow assistance. Final decisions remain with the competent authority.
            </p>
          </div>
          <div className="lg:col-span-4 flex lg:justify-end">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-white text-slate-900 text-sm font-semibold rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap"
            >
              Enter Platform Workspace →
            </button>
          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="mt-auto border-t border-slate-200 px-8 py-6 text-xs text-slate-500 max-w-[1440px] w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="font-bold text-slate-900">MahaRegulate</span> · Explainable Industrial Regulatory Intelligence for Maharashtra
        </div>
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="hover:text-slate-900">Dashboard</Link>
          <Link to="/projects/1/approvals" className="hover:text-slate-900">Approvals</Link>
          <Link to="/officer" className="hover:text-slate-900">Reviewer Desk</Link>
          <Link to="/admin" className="hover:text-slate-900">Admin Rules</Link>
        </div>
      </footer>
    </div>
  );
};
