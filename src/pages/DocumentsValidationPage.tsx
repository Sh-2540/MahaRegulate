import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import {
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Upload,
  ShieldCheck,
  FileText,
  ArrowRight,
  Edit3,
  Check,
} from 'lucide-react';
import { apiFetch } from '../services/api.ts';

export function DocumentsValidationPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isReadinessView = location.pathname.endsWith('/readiness');

  const [bundle, setBundle] = useState<any>(null);
  const [readiness, setReadiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'DOCUMENTS' | 'CONSISTENCY' | 'READINESS'>(
    isReadinessView ? 'READINESS' : 'DOCUMENTS'
  );

  // Side-by-side document verification state
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [editableFields, setEditableFields] = useState<Record<string, string>>({});
  const [reconciliationNotes, setReconciliationNotes] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);

  // Upload document modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    docType: 'ALLOTMENT_LETTER',
    title: '',
    fileName: '',
    extractedPan: 'AABCA8921K',
    extractedPlotArea: '4500',
    extractedCompanyName: 'Aarogya APIs Pvt Ltd',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [projData, readData] = await Promise.all([
        apiFetch<any>(`/api/projects/${id}`),
        apiFetch<any>(`/api/projects/${id}/readiness`),
      ]);
      setBundle(projData);
      setReadiness(readData);
      if (projData.documents?.length > 0 && !selectedDocId) {
        const firstDoc = projData.documents[0];
        setSelectedDocId(firstDoc.id);
        setEditableFields(
          Object.fromEntries(
            Object.entries(firstDoc.extractedFieldsJson || {}).map(([k, v]) => [k, String(v)])
          )
        );
      }
    } catch (err) {
      console.error('Failed to load documents/readiness:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    if (isReadinessView) {
      setActiveTab('READINESS');
    }
  }, [isReadinessView]);

  const selectedDoc = bundle?.documents?.find((d: any) => d.id === selectedDocId) || null;

  const handleSelectDoc = (doc: any) => {
    setSelectedDocId(doc.id);
    const merged = {
      ...(doc.extractedFieldsJson || {}),
      ...(doc.verifiedFieldsJson || {}),
    };
    setEditableFields(
      Object.fromEntries(Object.entries(merged).map(([k, v]) => [k, String(v)]))
    );
  };

  const handleConfirmDocumentVerified = async (doc: any) => {
    setSaving(true);
    try {
      // Check if user reconciled the 4,800 sq m layout plan to 4,500 sq m
      const resolveValidationCode =
        doc.docType === 'LAYOUT_PLAN' && Number(editableFields.plot_area_sq_m) === 4500
          ? 'VAL-PLOT-AREA-MISMATCH'
          : undefined;

      await apiFetch(`/api/documents/${doc.id}/validate`, {
        method: 'POST',
        body: JSON.stringify({
          status: 'VERIFIED',
          verifiedFields: editableFields,
          resolveValidationCode,
        }),
      });
      await loadData();
    } catch (err) {
      console.error('Failed to verify document:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleResolveValidation = async (checkId: number) => {
    setSaving(true);
    try {
      const note =
        reconciliationNotes[checkId] ||
        'Revised Factory Building Layout Plan Rev-3 uploaded confirming 4,500 sq. m. plot area matching MIDC Allotment Letter.';
      await apiFetch(`/api/validations/${checkId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ reconciliationNote: note }),
      });
      await loadData();
    } catch (err) {
      console.error('Failed to resolve validation check:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.title) return;
    setSaving(true);
    try {
      await apiFetch(`/api/projects/${id}/documents`, {
        method: 'POST',
        body: JSON.stringify({
          docType: uploadForm.docType,
          title: uploadForm.title,
          fileName:
            uploadForm.fileName ||
            `${uploadForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.pdf`,
          extractedFields: {
            company_name: uploadForm.extractedCompanyName,
            pan: uploadForm.extractedPan,
            plot_area_sq_m: Number(uploadForm.extractedPlotArea),
            extraction_method: 'ASSISTED_PARSE_UNVERIFIED',
          },
        }),
      });
      setShowUploadModal(false);
      setUploadForm({
        ...uploadForm,
        title: '',
        fileName: '',
      });
      await loadData();
    } catch (err) {
      console.error('Failed to upload document:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-sm text-slate-500">
        Running Document Pre-Validation & Cross-Document Consistency Checks...
      </div>
    );
  }

  const documents = bundle?.documents || [];
  const validations = readiness?.validations || [];
  const categories = readiness?.categories || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-md p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-500">
            <span>STAGES 6 & 7 • PRE-VALIDATION & SUBMISSION READINESS</span>
            <span>•</span>
            <span>{bundle?.project?.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Document Pre-Validation & Application Readiness Engine
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Assisted field extraction starts as <span className="font-mono font-semibold text-amber-800">UNVERIFIED</span> until explicitly confirmed. Cross-document mismatches block premature filing errors.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-3.5 py-2 text-xs font-semibold border border-slate-300 text-slate-800 rounded hover:bg-slate-100 inline-flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Supporting Document
          </button>
          <Link
            to="/applications"
            className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800 inline-flex items-center gap-1.5"
          >
            Proceed to Application & Legal Clock
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Submission Readiness Status Bar */}
      <div
        className={`border rounded-md p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          readiness?.readyForSubmission
            ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
            : 'bg-red-50/90 border-red-300 text-red-950'
        }`}
      >
        <div className="flex items-start gap-3">
          {readiness?.readyForSubmission ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono uppercase tracking-wider font-bold">
                SUBMISSION READINESS VERDICT:
              </span>
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                  readiness?.readyForSubmission
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                    : 'bg-red-100 text-red-900 border-red-400'
                }`}
              >
                {readiness?.statusSummaryText}
              </span>
            </div>
            <p className="text-xs mt-1">
              {readiness?.readyForSubmission
                ? 'All 5 statutory readiness categories (Identity, Land, Technical Documents, Environment, Mandatory Declarations) passed cross-document consistency checks.'
                : `${readiness?.unresolvedCount} cross-document consistency or completeness issue(s) detected. Review and reconcile below before submitting to MAITRI / MPCB.`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('CONSISTENCY')}
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 text-slate-900 rounded hover:bg-slate-50"
          >
            Review Consistency Checks ({validations.length})
          </button>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('DOCUMENTS')}
          className={`px-3.5 py-2 rounded text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === 'DOCUMENTS'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          1. Side-by-Side Document Verification ({documents.length})
        </button>
        <button
          onClick={() => setActiveTab('CONSISTENCY')}
          className={`px-3.5 py-2 rounded text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === 'CONSISTENCY'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          2. Cross-Document Consistency Checks ({validations.length})
        </button>
        <button
          onClick={() => setActiveTab('READINESS')}
          className={`px-3.5 py-2 rounded text-xs font-semibold flex items-center gap-2 transition-colors ${
            activeTab === 'READINESS'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          3. 5-Category Application Readiness Matrix
        </button>
      </div>

      {/* TAB 1: Side-by-Side Document Verification */}
      {activeTab === 'DOCUMENTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Document List */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-md overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Project Document Dossier ({documents.length})
              </span>
              <span className="text-[11px] font-mono text-slate-500">Select to verify</span>
            </div>
            <div className="divide-y divide-slate-200">
              {documents.map((doc: any) => {
                const isSelected = doc.id === selectedDocId;
                return (
                  <button
                    key={doc.id}
                    onClick={() => handleSelectDoc(doc)}
                    className={`w-full text-left p-4 transition-colors flex items-start justify-between gap-3 ${
                      isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-mono text-slate-500">{doc.docType}</div>
                      <div className="text-sm font-semibold text-slate-900 mt-0.5">{doc.title}</div>
                      <div className="text-xs text-slate-500 font-mono mt-1">
                        File: {doc.fileName} • v{doc.version}
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border shrink-0 ${
                        doc.status === 'VERIFIED'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : doc.status === 'MISMATCH'
                          ? 'bg-red-50 text-red-800 border-red-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Side-by-Side Field Verification Workbench */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-md p-6">
            {selectedDoc ? (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {selectedDoc.docType}
                      </span>
                      <span
                        className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border ${
                          selectedDoc.status === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : selectedDoc.status === 'MISMATCH'
                            ? 'bg-red-50 text-red-800 border-red-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {selectedDoc.status === 'VERIFIED'
                          ? 'VERIFIED BY USER'
                          : selectedDoc.status === 'MISMATCH'
                          ? 'MISMATCH DETECTED — UNVERIFIED'
                          : 'EXTRACTED — UNVERIFIED'}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mt-1.5">{selectedDoc.title}</h2>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Uploaded: {selectedDoc.uploadedAt} • Verified At:{' '}
                      {selectedDoc.verifiedAt || 'Pending User Confirmation'}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded p-3.5 text-xs text-slate-700">
                  <span className="font-semibold text-slate-900">Verification Rule:</span> Assisted document extraction never auto-marks legal values as verified. Review each extracted attribute against the original document below, edit any discrepancy, and click{' '}
                  <span className="font-mono font-semibold">Confirm as Verified</span>.
                </div>

                {/* Extracted vs Verified Fields Table */}
                <div className="space-y-3">
                  {Object.entries(editableFields).map(([fieldKey, fieldVal]) => {
                    const rawExtracted = selectedDoc.extractedFieldsJson?.[fieldKey];
                    const isPlotMismatch =
                      selectedDoc.docType === 'LAYOUT_PLAN' &&
                      fieldKey === 'plot_area_sq_m' &&
                      Number(fieldVal) !== 4500;

                    return (
                      <div
                        key={fieldKey}
                        className={`grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3 rounded border ${
                          isPlotMismatch
                            ? 'bg-red-50/70 border-red-300'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="md:col-span-4">
                          <div className="text-xs font-mono font-semibold text-slate-700 uppercase">
                            {fieldKey.replace(/_/g, ' ')}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            Extracted Raw: {String(rawExtracted ?? 'N/A')}
                          </div>
                        </div>
                        <div className="md:col-span-5">
                          <input
                            type="text"
                            value={fieldVal}
                            onChange={(e) =>
                              setEditableFields({
                                ...editableFields,
                                [fieldKey]: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white text-slate-900"
                          />
                          {isPlotMismatch && (
                            <div className="text-[11px] text-red-700 font-medium mt-1">
                              Conflict: MIDC Allotment Letter states 4500 sq. m. (Update to 4500 after uploading revised layout plan).
                            </div>
                          )}
                        </div>
                        <div className="md:col-span-3 flex justify-end">
                          <span
                            className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                              selectedDoc.status === 'VERIFIED' && !isPlotMismatch
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {selectedDoc.status === 'VERIFIED' && !isPlotMismatch
                              ? 'VERIFIED'
                              : 'UNVERIFIED'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <div className="text-xs text-slate-500">
                    {selectedDoc.docType === 'LAYOUT_PLAN' && (
                      <span>
                        Tip: Set <code className="font-mono">plot_area_sq_m</code> to{' '}
                        <code className="font-mono font-bold">4500</code> and confirm to resolve the cross-document mismatch.
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleConfirmDocumentVerified(selectedDoc)}
                    disabled={saving}
                    className="px-4 py-2 text-xs font-semibold bg-blue-700 text-white rounded hover:bg-blue-800 inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {saving ? 'Confirming...' : 'Confirm as Verified'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500">Select a document from the left panel.</div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Cross-Document Consistency Checks */}
      {activeTab === 'CONSISTENCY' && (
        <div className="space-y-4">
          {validations.map((check: any) => {
            const isFail = (check.severity === 'FAIL' || check.severity === 'WARNING') && !check.resolved;
            return (
              <div
                key={check.id}
                className={`bg-white border rounded-md p-5 ${
                  isFail ? 'border-red-300 bg-red-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-700">
                        {check.checkCode}
                      </span>
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                          check.resolved || check.severity === 'PASS'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : check.severity === 'FAIL'
                            ? 'bg-red-100 text-red-900 border-red-300'
                            : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}
                      >
                        {check.resolved ? 'RECONCILED (PASS)' : check.severity}
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        Category: {check.readinessCategory}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{check.checkName}</h3>
                    <p className="text-sm text-slate-700">{check.details}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      <div className="p-3 rounded bg-slate-50 border border-slate-200">
                        <div className="text-[11px] font-mono uppercase text-slate-500">
                          {check.sourceDocA}
                        </div>
                        <div className="text-xs font-mono font-semibold text-slate-900 mt-0.5">
                          {check.valueA}
                        </div>
                      </div>
                      <div className="p-3 rounded bg-slate-50 border border-slate-200">
                        <div className="text-[11px] font-mono uppercase text-slate-500">
                          {check.sourceDocB}
                        </div>
                        <div className="text-xs font-mono font-semibold text-slate-900 mt-0.5">
                          {check.valueB}
                        </div>
                      </div>
                    </div>
                  </div>

                  {isFail && (
                    <div className="lg:w-80 shrink-0 bg-white border border-slate-200 rounded p-4 space-y-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Reconcile Discrepancy
                      </div>
                      <textarea
                        rows={2}
                        placeholder="Enter reconciliation evidence (e.g., Revised Layout Plan Rev-3 matching 4,500 sq. m.)..."
                        value={reconciliationNotes[check.id] || ''}
                        onChange={(e) =>
                          setReconciliationNotes({
                            ...reconciliationNotes,
                            [check.id]: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded"
                      />
                      <button
                        onClick={() => handleResolveValidation(check.id)}
                        disabled={saving}
                        className="w-full py-2 px-3 bg-emerald-700 text-white text-xs font-semibold rounded hover:bg-emerald-800 disabled:opacity-50"
                      >
                        Confirm Reconciliation & Re-Validate
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: 5-Category Application Readiness Matrix */}
      {activeTab === 'READINESS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat: any) => (
            <div
              key={cat.category}
              className="bg-white border border-slate-200 rounded-md p-5 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
                    {cat.category.replace(/_/g, ' ')}
                  </span>
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                      cat.status === 'PASS'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : cat.status === 'FAIL'
                        ? 'bg-red-50 text-red-800 border-red-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {cat.status}
                  </span>
                </div>

                <div className="mt-4 space-y-2.5">
                  {cat.checks.map((c: any) => (
                    <div key={c.id} className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center justify-between font-semibold text-slate-900">
                        <span>{c.checkName}</span>
                        <span
                          className={`font-mono text-[11px] ${
                            c.resolved || c.severity === 'PASS'
                              ? 'text-emerald-700'
                              : 'text-red-700'
                          }`}
                        >
                          {c.resolved ? 'PASS' : c.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">{c.details}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-500">
                Verified Checks: {cat.checks.filter((c: any) => c.resolved || c.severity === 'PASS').length} /{' '}
                {cat.checks.length}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-md max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Upload Document for Assisted Pre-Validation
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-xs font-mono text-slate-500 hover:text-slate-800"
              >
                CLOSE
              </button>
            </div>
            <form onSubmit={handleUploadDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Category
                </label>
                <select
                  value={uploadForm.docType}
                  onChange={(e) => setUploadForm({ ...uploadForm, docType: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
                >
                  <option value="ALLOTMENT_LETTER">MIDC Plot Allotment Letter</option>
                  <option value="LAYOUT_PLAN">Factory Building Layout Plan</option>
                  <option value="DPR">Detailed Project Report (DPR)</option>
                  <option value="PROCESS_FLOW">Process Flow & Material Balance Diagram</option>
                  <option value="POLLUTION_CONTROL_PLAN">ETP & Air Pollution Control Plan</option>
                  <option value="SAFETY_DOCUMENT">On-Site Emergency & HAZOP Plan</option>
                  <option value="SELF_DECLARATION">Authorized Signatory Self-Declaration</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Revised Factory Layout Plan Rev-3 (Plot B-42)"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Extracted PAN (Unverified)
                  </label>
                  <input
                    type="text"
                    value={uploadForm.extractedPan}
                    onChange={(e) => setUploadForm({ ...uploadForm, extractedPan: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Extracted Plot Area (sq. m.)
                  </label>
                  <input
                    type="number"
                    value={uploadForm.extractedPlotArea}
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, extractedPlotArea: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold border border-slate-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800"
                >
                  Upload as UNVERIFIED
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
