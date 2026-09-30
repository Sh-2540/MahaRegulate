import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { UserRole } from '../types/regulatory.ts';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signInWithGoogle, setActiveRole, isFirebaseAuthenticated, user } = useAuth();

  const handleRoleLogin = (role: UserRole, targetPath: string) => {
    setActiveRole(role);
    navigate(targetPath);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <header className="px-8 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
        <Link to="/" className="text-lg font-bold tracking-tight text-slate-900">
          MahaRegulate
        </Link>
        <span className="text-xs text-slate-500">
          Designed to work alongside Maharashtra&apos;s existing approval ecosystem
        </span>
      </header>

      <div className="max-w-xl w-full mx-auto my-12 px-6">
        <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-6">
          <div>
            <div className="text-xs font-mono text-sky-800">AUTHENTICATION & ROLE SELECTION</div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">
              Sign in to MahaRegulate Workspace
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Authenticate with Google Sign-In or launch directly into one of the primary role workspaces with pre-seeded demo data for Aarogya APIs Pvt Ltd.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={async () => {
                try {
                  await signInWithGoogle();
                  navigate('/dashboard');
                } catch (err) {
                  console.error('Google Sign-In popup closed or failed:', err);
                }
              }}
              className="w-full py-3 px-4 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              {isFirebaseAuthenticated
                ? `Continue as ${user.email}`
                : 'Sign In with Google (OAuth 2.0)'}
            </button>
          </div>

          <div className="relative py-2 flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-xs text-slate-400 whitespace-nowrap">
              OR SELECT ROLE WORKSPACE (SYNTHETIC DEMO SESSION)
            </span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => handleRoleLogin('APPLICANT', '/dashboard')}
              className="p-4 border border-slate-200 rounded-lg text-left hover:border-slate-900 hover:bg-slate-50 transition-colors"
            >
              <div className="text-xs font-mono text-sky-800">ROLE A</div>
              <div className="text-sm font-semibold text-slate-900 mt-0.5">
                Industrial Applicant
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Aarogya APIs Pvt Ltd · Intake, Approvals, Documents, Queries & Simulator.
              </p>
            </button>

            <button
              onClick={() => handleRoleLogin('ADVISOR', '/projects/1/approvals')}
              className="p-4 border border-slate-200 rounded-lg text-left hover:border-slate-900 hover:bg-slate-50 transition-colors"
            >
              <div className="text-xs font-mono text-sky-800">ROLE B</div>
              <div className="text-sm font-semibold text-slate-900 mt-0.5">
                Compliance / Legal Advisor
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Multi-company oversight, Conflict Detector review & Escalation Dossiers.
              </p>
            </button>

            <button
              onClick={() => handleRoleLogin('OFFICER', '/officer')}
              className="p-4 border border-slate-200 rounded-lg text-left hover:border-slate-900 hover:bg-slate-50 transition-colors"
            >
              <div className="text-xs font-mono text-sky-800">REVIEWER DESK</div>
              <div className="text-sm font-semibold text-slate-900 mt-0.5">
                Officer / Scrutiny Reviewer
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Scrutiny queue, raise structured queries, pause/resume clock & record decisions.
              </p>
            </button>

            <button
              onClick={() => handleRoleLogin('ADMIN', '/admin')}
              className="p-4 border border-slate-200 rounded-lg text-left hover:border-slate-900 hover:bg-slate-50 transition-colors"
            >
              <div className="text-xs font-mono text-sky-800">ROLE C</div>
              <div className="text-sm font-semibold text-slate-900 mt-0.5">
                Platform Admin / Domain Expert
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Versioned rules, source verification, regulatory updates & unit tests.
              </p>
            </button>
          </div>
        </div>
      </div>

      <footer className="px-8 py-4 border-t border-slate-200 text-xs text-slate-500 text-center">
        This platform provides regulatory information and workflow assistance. Final decisions remain with the competent authority.
      </footer>
    </div>
  );
};
