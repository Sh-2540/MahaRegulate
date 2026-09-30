import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  ClipboardList,
  Scale,
  GitBranch,
  FileCheck2,
  ShieldCheck,
  Clock,
  Sliders,
  CalendarClock,
  Briefcase,
  Settings,
  Database,
  AlertOctagon,
  FileSearch,
  MessageSquareText,
  LogOut,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { UserRole } from '../types/regulatory.ts';
import { AiAssistantDrawer } from '../components/AiAssistantDrawer.tsx';

const CORE_JOURNEY_STEPS = [
  { step: '01', label: 'Create Company', path: '/organizations' },
  { step: '02', label: 'Create Project', path: '/projects' },
  { step: '03', label: 'Smart Intake', path: '/projects/1/intake' },
  { step: '04', label: 'Regulatory Analysis', path: '/projects/1/approvals' },
  { step: '05', label: 'Approval Journey', path: '/projects/1/journey' },
  { step: '06', label: 'Document Validation', path: '/projects/1/documents' },
  { step: '07', label: 'Application Readiness', path: '/projects/1/readiness' },
  { step: '08', label: 'Application Tracking', path: '/projects/1/applications' },
  { step: '09', label: 'Legal Clock & Queries', path: '/officer/applications/4' },
  { step: '10', label: 'Escalation Dossier', path: '/officer/applications/3' },
  { step: '11', label: 'What-If Simulator', path: '/projects/1/simulator' },
  { step: '12', label: 'Renewal & Incentives', path: '/projects/1/compliance' },
];

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user,
    activeRole,
    activeOrgId,
    setActiveRole,
    setActiveOrgId,
    isFirebaseAuthenticated,
    signInWithGoogle,
    signOut,
  } = useAuth();
  const [aiOpen, setAiOpen] = useState(false);

  const navGroups = [
    {
      group: 'Overview & Entities',
      items: [
        { label: 'Executive Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Organizations', path: '/organizations', icon: Building2 },
        { label: 'Industrial Projects', path: '/projects', icon: FolderKanban },
      ],
    },
    {
      group: 'Project Intelligence (Aarogya APIs)',
      items: [
        { label: 'Project Hub', path: '/projects/1', icon: Briefcase },
        { label: 'Smart Project Intake', path: '/projects/1/intake', icon: ClipboardList },
        { label: 'Approval Discovery & Conflicts', path: '/projects/1/approvals', icon: Scale },
        { label: 'Knowledge Graph Journey', path: '/projects/1/journey', icon: GitBranch },
        { label: 'Document Vault & Validation', path: '/projects/1/documents', icon: FileCheck2 },
        { label: 'Application Readiness', path: '/projects/1/readiness', icon: ShieldCheck },
        { label: 'Applications & Legal Clock', path: '/projects/1/applications', icon: Clock },
        { label: 'What-If Simulator', path: '/projects/1/simulator', icon: Sliders },
        { label: 'Renewals, Inspections & PSI', path: '/projects/1/compliance', icon: CalendarClock },
      ],
    },
    {
      group: 'Reviewer & Advisor Desk',
      items: [
        { label: 'Officer / Reviewer Workspace', path: '/officer', icon: Briefcase },
        { label: 'Query #Q-102 (MPCB CTE)', path: '/officer/applications/4', icon: Clock },
        { label: 'Breached Dossier (DISH Plan)', path: '/officer/applications/3', icon: AlertOctagon },
      ],
    },
    {
      group: 'Platform Governance & Admin',
      items: [
        { label: 'Admin Overview & Tests', path: '/admin', icon: Settings },
        { label: 'Rules Engine & Versions', path: '/admin/rules', icon: Scale },
        { label: 'Regulatory Sources & Changes', path: '/admin/sources', icon: Database },
        { label: 'Conflict Registry', path: '/admin/conflicts', icon: AlertOctagon },
        { label: 'Immutable Audit Trail', path: '/admin/audit', icon: FileSearch },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Sidebar (268px fixed desktop width) */}
      <aside className="w-68 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 shrink-0">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <Link to="/" className="text-base font-bold tracking-tight text-white">
            MahaRegulate
          </Link>
          <span className="text-xs font-mono text-sky-400">MH-IND</span>
        </div>

        <div className="px-5 py-2.5 bg-slate-950 border-b border-slate-800 text-xs text-slate-400">
          <div>Active Demo Project:</div>
          <div className="text-slate-100 font-medium truncate mt-0.5">
            Aarogya APIs Pvt Ltd · Bulk Drug
          </div>
          <div className="font-mono text-[11px] text-amber-400 mt-0.5">
            SYNTHETIC DEMO DATA
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navGroups.map((grp) => (
            <div key={grp.group}>
              <div className="px-2.5 text-[11px] font-medium text-slate-400 mb-1.5">
                {grp.group}
              </div>
              <div className="space-y-0.5">
                {grp.items.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
                        active
                          ? 'bg-sky-700 text-white'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800 bg-slate-950 space-y-2">
          <button
            onClick={() => setAiOpen(true)}
            className="w-full py-2 px-3 bg-sky-700 hover:bg-sky-600 text-white rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
          >
            <MessageSquareText className="w-4 h-4" />
            Explainable AI Assistant
          </button>
          <div className="text-[11px] text-slate-400 leading-tight">
            Designed to work alongside Maharashtra&apos;s existing approval ecosystem (MAITRI / NSWS).
          </div>
        </div>
      </aside>

      {/* Main Workspace Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Contract for SaaS Workspace */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-600 min-w-0">
            <Link to="/dashboard" className="font-medium text-slate-900 hover:underline">
              Workspace
            </Link>
            <span>/</span>
            <span className="font-mono text-slate-700 truncate">{location.pathname}</span>
            <span>·</span>
            <span className="text-slate-500 hidden lg:inline">
              Rules Decide · Sources Prove · AI Explains
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Active Tenant Switcher */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 hidden sm:inline">Tenant:</span>
              <select
                value={activeOrgId}
                onChange={(e) => setActiveOrgId(Number(e.target.value))}
                className="border border-slate-300 rounded-md px-2 py-1 text-xs bg-white text-slate-900 font-medium"
                aria-label="Active Organization Tenant"
              >
                <option value={1}>Org #1: Aarogya APIs Pvt Ltd</option>
                <option value={2}>Org #2: Sahyadri Specialty Polymers</option>
              </select>
            </div>

            {/* Role Switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(['APPLICANT', 'ADVISOR', 'OFFICER', 'ADMIN'] as UserRole[]).map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    setActiveRole(role);
                    if (role === 'OFFICER' && !location.pathname.startsWith('/officer')) {
                      navigate('/officer');
                    } else if (role === 'ADMIN' && !location.pathname.startsWith('/admin')) {
                      navigate('/admin');
                    }
                  }}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    activeRole === role
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {role === 'APPLICANT'
                    ? 'Applicant'
                    : role === 'ADVISOR'
                    ? 'Legal Advisor'
                    : role === 'OFFICER'
                    ? 'Reviewer'
                    : 'Domain Admin'}
                </button>
              ))}
            </div>

            <button
              onClick={() => setAiOpen(true)}
              className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg text-slate-800 hover:bg-slate-50 whitespace-nowrap"
            >
              Ask KB Assistant
            </button>

            {isFirebaseAuthenticated ? (
              <button
                onClick={signOut}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 flex items-center gap-1 whitespace-nowrap"
                title={`Signed in as ${user.email}`}
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-1.5 whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
            )}
          </div>
        </header>

        {/* Core 12-Step Journey Ribbon */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-2 overflow-x-auto">
          <div className="flex items-center gap-2 text-xs whitespace-nowrap">
            <span className="font-semibold text-slate-700 mr-1">Core Journey:</span>
            {CORE_JOURNEY_STEPS.map((s, idx) => {
              const isCurrent = location.pathname === s.path;
              return (
                <React.Fragment key={s.step}>
                  <Link
                    to={s.path}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      isCurrent
                        ? 'bg-slate-900 text-white font-medium'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                    }`}
                  >
                    <span className="font-mono mr-1">{s.step}.</span>
                    {s.label}
                  </Link>
                  {idx < CORE_JOURNEY_STEPS.length - 1 && (
                    <span className="text-slate-400">→</span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-6 max-w-[1440px] w-full mx-auto">{children}</main>

        {/* Mandatory Legal Safety & Positioning Footer */}
        <footer className="bg-white border-t border-slate-200 px-6 py-3 text-xs text-slate-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <strong className="text-slate-700">Legal Safety Notice:</strong> This platform provides regulatory information and workflow assistance. Final decisions remain with the competent authority.
          </div>
          <div className="text-slate-500">
            Designed to work alongside Maharashtra&apos;s existing approval ecosystem · Not affiliated with MAITRI, NSWS, MPCB, or MIDC.
          </div>
        </footer>
      </div>

      <AiAssistantDrawer isOpen={aiOpen} onClose={() => setAiOpen(false)} projectId={1} />
    </div>
  );
};
