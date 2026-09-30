import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, ArrowLeft, Sliders } from 'lucide-react';
import { apiFetch } from '../services/api.ts';

const STEPS = [
  { id: 1, label: '01. Company Profile' },
  { id: 2, label: '02. Project & Land' },
  { id: 3, label: '03. Operations & Utilities' },
  { id: 4, label: '04. Environmental & Waste' },
];

export const SmartIntakePage: React.FC = () => {
  const { id } = useParams();
  const projectId = Number(id) || 1;
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [savedBanner, setSavedBanner] = useState<string | null>(null);

  const [company, setCompany] = useState({
    name: 'Aarogya APIs Pvt Ltd',
    constitution: 'Private Limited Company',
    pan: 'AABCA8941M',
    gstin: '27AABCA8941M1Z5',
    udyamNumber: 'UDYAM-MH-24-0049182',
  });

  const [project, setProject] = useState({
    name: 'Bulk Drug Manufacturing Unit (Unit-II)',
    industry: 'Pharmaceuticals & Active Pharmaceutical Ingredients (API)',
    product: 'Bulk Drug Manufacturing Unit (Metformin HCl, Losartan Potassium & Specialty Intermediates)',
    manufacturingProcess: 'Multi-stage Organic Synthesis, Solvent Extraction, Centrifugation & Vacuum Drying',
    location: 'Mahad MIDC Industrial Area, Taluka Mahad, Dist. Raigad, Maharashtra',
    isMidc: true,
    plotDetails: 'Plot No. K-42/1, Mahad MIDC Additional Chemical Zone',
    projectStage: 'PRE_ESTABLISHMENT',
    fixedCapitalInvestmentCr: '45.00',
    landAreaSqm: 12500,
    builtUpAreaSqm: 6800,
  });

  const [facts, setFacts] = useState({
    directWorkers: 120,
    contractWorkers: 60,
    powerKva: 140,
    waterKld: 85,
    hasBoiler: true,
    boilerCapacityTph: '4.50',
    boilerFuelType: 'Briquette / LDO Dual-Fired',
    boilerHeatingSurfaceSqm: 65,
    hasHazardousProcess: true,
    hazardousScheduleRef: 'Factories Act First Schedule - Entry 17 (Chemical Works) & Entry 20 (Drugs & Pharmaceuticals)',
    hazardousChemicalsJson: 'Methanol, Toluene, Acetonitrile, Hydrochloric Acid, Thionyl Chloride',
    storageCapacityTons: 45,
    productionCapacityMta: 600,
    operatingHoursPerDay: 24,
    pollutionCategory: 'RED',
    wasteType: 'Process Organic Residue, Spent Solvents, ETP Chemical Sludge & Scrubber Bleed',
    hasHazardousWaste: true,
    hazardousWasteScheduleCode: 'Schedule I - Cat 28.1, 28.6, 35.3',
    waterDischargeType: 'ZLD (Multiple Effect Evaporator + RO) & Mahad CETP Member',
    effluentTreatmentCapacityKld: 45,
    airEmissionsSources: '4.5 TPH Steam Boiler Stack (30m), Two-Stage Alkaline Process Scrubber, 250 kVA Acoustic DG Set',
    midcIndustrialArea: 'Mahad MIDC Additional Chemical Zone',
    midcPlotNumber: 'Plot No. K-42/1',
    midcWaterSupplyConnection: true,
  });

  useEffect(() => {
    apiFetch<any>(`/api/projects/${projectId}`).then((bundle) => {
      if (bundle.organization) {
        setCompany({
          name: bundle.organization.name || '',
          constitution: bundle.organization.constitution || '',
          pan: bundle.organization.pan || '',
          gstin: bundle.organization.gstin || '',
          udyamNumber: bundle.organization.udyamNumber || '',
        });
      }
      if (bundle.project) {
        setProject({
          name: bundle.project.name || '',
          industry: bundle.project.industry || '',
          product: bundle.project.product || '',
          manufacturingProcess: bundle.project.manufacturingProcess || '',
          location: bundle.project.location || '',
          isMidc: Boolean(bundle.project.isMidc),
          plotDetails: bundle.project.plotDetails || '',
          projectStage: bundle.project.projectStage || 'PRE_ESTABLISHMENT',
          fixedCapitalInvestmentCr: String(bundle.project.fixedCapitalInvestmentCr || '45.00'),
          landAreaSqm: Number(bundle.project.landAreaSqm) || 12500,
          builtUpAreaSqm: Number(bundle.project.builtUpAreaSqm) || 6800,
        });
      }
      if (bundle.facts) {
        setFacts((prev) => ({
          ...prev,
          ...bundle.facts,
        }));
      }
    });
  }, [projectId]);

  const handleSaveAndAnalyze = async (redirectToApprovals: boolean) => {
    setSaving(true);
    setSavedBanner(null);
    try {
      await apiFetch(`/api/projects/${projectId}/analyze`, {
        method: 'POST',
        body: JSON.stringify({
          company,
          project,
          facts,
        }),
      });
      setSavedBanner('Project profile saved and deterministic regulatory analysis recalculated.');
      if (redirectToApprovals) {
        navigate(`/projects/${projectId}/approvals`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-sky-800">
            STEP 03 · ADAPTIVE SMART PROJECT INTAKE
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">
            Project Parameters & Regulatory Fact Sheet
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Conditional sections adapt automatically based on MIDC status, Steam Boiler installation, and First Schedule Hazardous Processes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSaveAndAnalyze(false)}
            disabled={saving}
            className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 hover:bg-slate-50"
          >
            {saving ? 'Recalculating...' : 'Save Facts'}
          </button>
          <button
            onClick={() => handleSaveAndAnalyze(true)}
            disabled={saving}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 flex items-center gap-1.5"
          >
            Run Regulatory Analysis
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {savedBanner && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedBanner}</span>
        </div>
      )}

      {/* Step Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {STEPS.map((s) => (
          <button
            key={s.id}
            onClick={() => setStep(s.id)}
            className={`py-3 px-4 rounded-lg border text-xs font-semibold text-left transition-colors ${
              step === s.id
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Form Panel */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              01. Company Identity & Statutory Identifiers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={company.name}
                  onChange={(e) => setCompany({ ...company, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Constitution</label>
                <select
                  value={company.constitution}
                  onChange={(e) => setCompany({ ...company, constitution: e.target.value })}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white"
                >
                  <option>Private Limited Company</option>
                  <option>Public Limited Company</option>
                  <option>Limited Liability Partnership (LLP)</option>
                  <option>Partnership Firm</option>
                  <option>Sole Proprietorship</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Permanent Account Number (PAN)</label>
                <input
                  type="text"
                  value={company.pan}
                  onChange={(e) => setCompany({ ...company, pan: e.target.value })}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Maharashtra GSTIN</label>
                <input
                  type="text"
                  value={company.gstin}
                  onChange={(e) => setCompany({ ...company, gstin: e.target.value })}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Udyam Registration Number</label>
                <input
                  type="text"
                  value={company.udyamNumber}
                  onChange={(e) => setCompany({ ...company, udyamNumber: e.target.value })}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              02. Project Activity, Location & Land Parameters
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Project Name</label>
                <input
                  type="text"
                  value={project.name}
                  onChange={(e) => setProject({ ...project, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Industry Sector</label>
                <input
                  type="text"
                  value={project.industry}
                  onChange={(e) => setProject({ ...project, industry: e.target.value })}
                  className="w-full border border-slate-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Product Manufactured</label>
                <input
                  type="text"
                  value={project.product}
                  onChange={(e) => setProject({ ...project, product: e.target.value })}
                  className="w-full border border-slate-300 rounded-md px-3 py-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-medium text-slate-700 mb-1">Manufacturing Process</label>
                <input
                  type="text"
                  value={project.manufacturingProcess}
                  onChange={(e) =>
                    setProject({ ...project, manufacturingProcess: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Project Stage</label>
                <select
                  value={project.projectStage}
                  onChange={(e) => setProject({ ...project, projectStage: e.target.value })}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white"
                >
                  <option value="PRE_LAND">PRE_LAND (Plot Acquisition)</option>
                  <option value="PRE_ESTABLISHMENT">PRE_ESTABLISHMENT (Prior to Construction)</option>
                  <option value="PRE_CONSTRUCTION">PRE_CONSTRUCTION (Building Plan & Fire)</option>
                  <option value="PRE_OPERATION">PRE_OPERATION (Prior to Commissioning)</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Location / District</label>
                <input
                  type="text"
                  value={project.location}
                  onChange={(e) => setProject({ ...project, location: e.target.value })}
                  className="w-full border border-slate-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Fixed Capital Investment (₹ Crore)
                </label>
                <input
                  type="text"
                  value={project.fixedCapitalInvestmentCr}
                  onChange={(e) =>
                    setProject({ ...project, fixedCapitalInvestmentCr: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-md px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Land Area (Sq.m)</label>
                <input
                  type="number"
                  value={project.landAreaSqm}
                  onChange={(e) => setProject({ ...project, landAreaSqm: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Built-Up Area (Sq.m)</label>
                <input
                  type="number"
                  value={project.builtUpAreaSqm}
                  onChange={(e) =>
                    setProject({ ...project, builtUpAreaSqm: Number(e.target.value) })
                  }
                  className="w-full border border-slate-300 rounded-md px-3 py-2 font-mono"
                />
              </div>

              {/* Adaptive Trigger: MIDC Notified Area */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Located inside MIDC Notified Area?
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setProject({ ...project, isMidc: true })}
                    className={`px-4 py-2 rounded-md font-semibold ${
                      project.isMidc
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-300 text-slate-700'
                    }`}
                  >
                    Yes (MIDC)
                  </button>
                  <button
                    type="button"
                    onClick={() => setProject({ ...project, isMidc: false })}
                    className={`px-4 py-2 rounded-md font-semibold ${
                      !project.isMidc
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-300 text-slate-700'
                    }`}
                  >
                    No (Non-MIDC)
                  </button>
                </div>
              </div>
            </div>

            {/* Conditional MIDC Block */}
            {project.isMidc && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <div className="text-xs font-semibold text-sky-900 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  Adaptive Fields Enabled: MIDC Special Planning Authority (SPA) Details
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      MIDC Industrial Estate Name
                    </label>
                    <input
                      type="text"
                      value={facts.midcIndustrialArea}
                      onChange={(e) =>
                        setFacts({ ...facts, midcIndustrialArea: e.target.value })
                      }
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      MIDC Plot Number & Zone
                    </label>
                    <input
                      type="text"
                      value={facts.midcPlotNumber}
                      onChange={(e) => setFacts({ ...facts, midcPlotNumber: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      MIDC Water Supply Pipeline Connection
                    </label>
                    <select
                      value={facts.midcWaterSupplyConnection ? 'YES' : 'NO'}
                      onChange={(e) =>
                        setFacts({
                          ...facts,
                          midcWaterSupplyConnection: e.target.value === 'YES',
                        })
                      }
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2"
                    >
                      <option value="YES">Yes — MIDC Potable/Industrial Water Main</option>
                      <option value="NO">No — Private Tanker / Surface Source</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              03. Operations, Workforce, Power, Steam Boiler & Hazardous Processes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Direct Workers (On Roll)
                </label>
                <input
                  type="number"
                  value={facts.directWorkers}
                  onChange={(e) =>
                    setFacts({ ...facts, directWorkers: Number(e.target.value) })
                  }
                  className="w-full border border-slate-300 rounded-md px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Contract Workers (CLRA Threshold ≥ 50)
                </label>
                <input
                  type="number"
                  value={facts.contractWorkers}
                  onChange={(e) =>
                    setFacts({ ...facts, contractWorkers: Number(e.target.value) })
                  }
                  className="w-full border border-slate-300 rounded-md px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Power Requirement (kVA) (CEIG HT ≥ 150)
                </label>
                <input
                  type="number"
                  value={facts.powerKva}
                  onChange={(e) => setFacts({ ...facts, powerKva: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Water Requirement (KLD)
                </label>
                <input
                  type="number"
                  value={facts.waterKld}
                  onChange={(e) => setFacts({ ...facts, waterKld: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Bulk Chemical / Solvent Storage (MT)
                </label>
                <input
                  type="number"
                  value={facts.storageCapacityTons}
                  onChange={(e) =>
                    setFacts({ ...facts, storageCapacityTons: Number(e.target.value) })
                  }
                  className="w-full border border-slate-300 rounded-md px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Production Capacity (MTA)
                </label>
                <input
                  type="number"
                  value={facts.productionCapacityMta}
                  onChange={(e) =>
                    setFacts({ ...facts, productionCapacityMta: Number(e.target.value) })
                  }
                  className="w-full border border-slate-300 rounded-md px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Steam Boiler Installed?
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFacts({ ...facts, hasBoiler: true })}
                    className={`px-3.5 py-2 rounded-md font-semibold ${
                      facts.hasBoiler
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-300 text-slate-700'
                    }`}
                  >
                    Boiler = Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setFacts({ ...facts, hasBoiler: false })}
                    className={`px-3.5 py-2 rounded-md font-semibold ${
                      !facts.hasBoiler
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-300 text-slate-700'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Hazardous Process (Factories Act First Schedule)?
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFacts({ ...facts, hasHazardousProcess: true })}
                    className={`px-3.5 py-2 rounded-md font-semibold ${
                      facts.hasHazardousProcess
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-300 text-slate-700'
                    }`}
                  >
                    Hazardous = Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setFacts({ ...facts, hasHazardousProcess: false })}
                    className={`px-3.5 py-2 rounded-md font-semibold ${
                      !facts.hasHazardousProcess
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-300 text-slate-700'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>

            {/* Adaptive Boiler Fields */}
            {facts.hasBoiler && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <div className="text-xs font-semibold text-sky-900">
                  Adaptive Fields (Boiler = Yes): Indian Boilers Act, 1923 & IBR Parameters
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Steam Evaporation Capacity (TPH)
                    </label>
                    <input
                      type="text"
                      value={facts.boilerCapacityTph}
                      onChange={(e) =>
                        setFacts({ ...facts, boilerCapacityTph: e.target.value })
                      }
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Boiler Fuel Type
                    </label>
                    <input
                      type="text"
                      value={facts.boilerFuelType}
                      onChange={(e) => setFacts({ ...facts, boilerFuelType: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Boiler Heating Surface Area (Sq.m)
                    </label>
                    <input
                      type="number"
                      value={facts.boilerHeatingSurfaceSqm}
                      onChange={(e) =>
                        setFacts({
                          ...facts,
                          boilerHeatingSurfaceSqm: Number(e.target.value),
                        })
                      }
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Adaptive Hazardous Process Fields */}
            {facts.hasHazardousProcess && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <div className="text-xs font-semibold text-sky-900">
                  Adaptive Fields (Hazardous Process = Yes): Chapter IV-A Factories Act & PESO Solvents
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Factories Act First Schedule Entry Reference
                    </label>
                    <input
                      type="text"
                      value={facts.hazardousScheduleRef}
                      onChange={(e) =>
                        setFacts({ ...facts, hazardousScheduleRef: e.target.value })
                      }
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Hazardous Chemicals & Class A/B Solvents Stored
                    </label>
                    <input
                      type="text"
                      value={facts.hazardousChemicalsJson}
                      onChange={(e) =>
                        setFacts({ ...facts, hazardousChemicalsJson: e.target.value })
                      }
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              04. Environmental Characteristics, Effluent Discharge & Air Emissions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  MPCB / CPCB Pollution Category
                </label>
                <select
                  value={facts.pollutionCategory}
                  onChange={(e) => setFacts({ ...facts, pollutionCategory: e.target.value })}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white font-semibold"
                >
                  <option value="RED">RED Category (PI ≥ 60 — Bulk Drugs / Chemical Synthesis)</option>
                  <option value="ORANGE">ORANGE Category (PI 41–59)</option>
                  <option value="GREEN">GREEN Category (PI 21–40)</option>
                  <option value="WHITE">WHITE Category (PI ≤ 20 — Non-Polluting Intimation)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Water Discharge / ETP Mode
                </label>
                <input
                  type="text"
                  value={facts.waterDischargeType}
                  onChange={(e) => setFacts({ ...facts, waterDischargeType: e.target.value })}
                  className="w-full border border-slate-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  ETP / ZLD Treatment Capacity (KLD)
                </label>
                <input
                  type="number"
                  value={facts.effluentTreatmentCapacityKld}
                  onChange={(e) =>
                    setFacts({
                      ...facts,
                      effluentTreatmentCapacityKld: Number(e.target.value),
                    })
                  }
                  className="w-full border border-slate-300 rounded-md px-3 py-2 font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-medium text-slate-700 mb-1">
                  Air Emission Sources & APCE Scrubbers
                </label>
                <input
                  type="text"
                  value={facts.airEmissionsSources}
                  onChange={(e) => setFacts({ ...facts, airEmissionsSources: e.target.value })}
                  className="w-full border border-slate-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Hazardous Waste Generation (HOWM Rules 2016)?
                </label>
                <select
                  value={facts.hasHazardousWaste ? 'YES' : 'NO'}
                  onChange={(e) =>
                    setFacts({ ...facts, hasHazardousWaste: e.target.value === 'YES' })
                  }
                  className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white"
                >
                  <option value="YES">Yes — Schedule I / II Hazardous Waste</option>
                  <option value="NO">No Hazardous Waste</option>
                </select>
              </div>

              {facts.hasHazardousWaste && (
                <>
                  <div className="md:col-span-2">
                    <label className="block font-medium text-slate-700 mb-1">
                      Waste Stream Description
                    </label>
                    <input
                      type="text"
                      value={facts.wasteType}
                      onChange={(e) => setFacts({ ...facts, wasteType: e.target.value })}
                      className="w-full border border-slate-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Schedule I Hazardous Waste Category Codes
                    </label>
                    <input
                      type="text"
                      value={facts.hazardousWasteScheduleCode}
                      onChange={(e) =>
                        setFacts({ ...facts, hazardousWasteScheduleCode: e.target.value })
                      }
                      className="w-full border border-slate-300 rounded-md px-3 py-2 font-mono"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Step Navigation Footer */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 disabled:opacity-40 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Previous Step
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(4, s + 1))}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              Next Step
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSaveAndAnalyze(true)}
              disabled={saving}
              className="px-5 py-2.5 bg-sky-700 text-white rounded-lg text-xs font-semibold hover:bg-sky-600 flex items-center gap-1.5"
            >
              Complete Intake & View Approval Discovery →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
