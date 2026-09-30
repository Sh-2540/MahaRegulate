/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx';
import { AppShell } from './layouts/AppShell.tsx';
import { LandingPage } from './pages/LandingPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import {
  DashboardPage,
  OrganizationsPage,
  ProjectsListPage,
  ProjectHubPage,
} from './pages/WorkspacePages.tsx';
import { SmartIntakePage } from './pages/SmartIntakePage.tsx';
import { ApprovalsDiscoveryPage } from './pages/ApprovalsDiscoveryPage.tsx';
import { ApprovalJourneyPage } from './pages/ApprovalJourneyPage.tsx';
import { DocumentsValidationPage } from './pages/DocumentsValidationPage.tsx';
import { ApplicationsAndClockPage } from './pages/ApplicationsAndClockPage.tsx';
import { ComplianceAndSimulatorPage } from './pages/ComplianceAndSimulatorPage.tsx';
import { AdminGovernancePage } from './pages/AdminGovernancePage.tsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Auth Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Authenticated / Workspace Shell Routes */}
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/organizations" element={<OrganizationsPage />} />
            <Route path="/projects" element={<ProjectsListPage />} />
            <Route path="/projects/new" element={<OrganizationsPage />} />
            <Route path="/projects/:id" element={<ProjectHubPage />} />
            <Route path="/projects/:id/intake" element={<SmartIntakePage />} />
            <Route path="/projects/:id/approvals" element={<ApprovalsDiscoveryPage />} />
            <Route path="/projects/:id/journey" element={<ApprovalJourneyPage />} />
            <Route path="/projects/:id/documents" element={<DocumentsValidationPage />} />
            <Route path="/projects/:id/readiness" element={<DocumentsValidationPage />} />
            <Route path="/projects/:id/applications" element={<ApplicationsAndClockPage />} />
            <Route path="/projects/:id/simulator" element={<ComplianceAndSimulatorPage />} />
            <Route path="/projects/:id/compliance" element={<ComplianceAndSimulatorPage />} />

            {/* Applications, Legal Clock, Queries & Escalations */}
            <Route path="/applications" element={<ApplicationsAndClockPage />} />
            <Route path="/applications/:id" element={<ApplicationsAndClockPage />} />
            <Route path="/applications/:id/queries" element={<ApplicationsAndClockPage />} />
            <Route path="/applications/:id/timeline" element={<ApplicationsAndClockPage />} />
            <Route path="/applications/:id/escalation" element={<ApplicationsAndClockPage />} />

            {/* Platform Admin & Governance Routes */}
            <Route path="/admin" element={<AdminGovernancePage />} />
            <Route path="/admin/rules" element={<AdminGovernancePage />} />
            <Route path="/admin/sources" element={<AdminGovernancePage />} />
            <Route path="/admin/conflicts" element={<AdminGovernancePage />} />
            <Route path="/admin/audit" element={<AdminGovernancePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
