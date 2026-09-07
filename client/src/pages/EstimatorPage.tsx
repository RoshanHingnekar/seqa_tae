import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Save,
  RotateCcw,
  Sparkles,
  Info,
  Layers,
  Users,
  Clock,
  Calendar,
  CheckCircle2,
  FileDown,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { estimationsApi, projectsApi } from '../services/api';
import { useProjects } from '../context/ProjectContext';
import { EstimationResult } from '../types';

interface EstimatorPageProps {
  onNavigate: (page: string, data?: any) => void;
}

export const EstimatorPage: React.FC<EstimatorPageProps> = ({ onNavigate }) => {
  const { selectedProject, refreshProjects } = useProjects();

  // Inputs
  const [projectName, setProjectName] = useState('E-Commerce Full Stack Platform');
  const [projectType, setProjectType] = useState('Full Stack Application');
  const [loc, setLoc] = useState<number>(12500);
  const [testCases, setTestCases] = useState<number>(420);
  const [coverage, setCoverage] = useState<number>(85);
  const [automationPercent, setAutomationPercent] = useState<number>(35);
  const [complexity, setComplexity] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [environments, setEnvironments] = useState<number>(1);
  const [apiCount, setApiCount] = useState<number>(14);

  // Result state
  const [result, setResult] = useState<EstimationResult | null>(null);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Synchronize with selectedProject if available on load
  useEffect(() => {
    if (selectedProject) {
      setProjectName(selectedProject.name);
      setProjectType(selectedProject.type);
      setLoc(selectedProject.loc);
      setTestCases(selectedProject.testCases);
      setCoverage(selectedProject.coverage);
      setAutomationPercent(selectedProject.automationPercent);
      setComplexity(selectedProject.complexity as any);
      setEnvironments(selectedProject.environments);
      setApiCount(selectedProject.apiCount);
    }
  }, [selectedProject]);

  // Live dynamic calculation on any input change
  useEffect(() => {
    const runCalculation = async () => {
      setCalculating(true);
      try {
        const data = await estimationsApi.calculate({
          projectName,
          projectType,
          loc: Number(loc),
          testCases: Number(testCases),
          coverage: Number(coverage),
          automationPercent: Number(automationPercent),
          complexity,
          environments: Number(environments),
          apiCount: Number(apiCount),
        });
        setResult(data);
      } catch (err) {
        console.error('Calculation error', err);
      } finally {
        setCalculating(false);
      }
    };

    runCalculation();
  }, [projectName, projectType, loc, testCases, coverage, automationPercent, complexity, environments, apiCount]);

  const handleReset = () => {
    setProjectName('E-Commerce Full Stack Platform');
    setProjectType('Full Stack Application');
    setLoc(12500);
    setTestCases(420);
    setCoverage(85);
    setAutomationPercent(35);
    setComplexity('Medium');
    setEnvironments(1);
    setApiCount(14);
  };

  const handleSaveEstimate = async () => {
    if (!result) return;
    setSaveLoading(true);
    try {
      if (selectedProject) {
        // Update current project
        await projectsApi.update(selectedProject.id, {
          name: projectName,
          type: projectType,
          loc: Number(loc),
          testCases: Number(testCases),
          coverage: Number(coverage),
          automationPercent: Number(automationPercent),
          complexity,
          environments: Number(environments),
          apiCount: Number(apiCount),
        });
      } else {
        // Create new project
        await projectsApi.create({
          name: projectName,
          type: projectType,
          loc: Number(loc),
          testCases: Number(testCases),
          coverage: Number(coverage),
          automationPercent: Number(automationPercent),
          complexity,
          environments: Number(environments),
          apiCount: Number(apiCount),
        });
      }
      await refreshProjects();
      setNotification({ type: 'success', text: `Estimate for "${projectName}" saved successfully!` });
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setNotification({ type: 'error', text: err.response?.data?.error || 'Failed to save estimate' });
    } finally {
      setSaveLoading(false);
    }
  };

  const pieData = result
    ? [
        { name: 'Manual Testing', value: result.breakdown.manualTestingPercent, hours: result.breakdown.manualTestingHours, color: '#2563EB' },
        { name: 'Automation Testing', value: result.breakdown.automationPercent, hours: result.breakdown.automationHours, color: '#4F46E5' },
        { name: 'Defect Retesting', value: result.breakdown.defectRetestingPercent, hours: result.breakdown.defectRetestingHours, color: '#06B6D4' },
        { name: 'Test Planning & Setup', value: result.breakdown.testPlanningPercent, hours: result.breakdown.testPlanningHours, color: '#3B82F6' },
        { name: 'Reporting', value: result.breakdown.reportingPercent, hours: result.breakdown.reportingHours, color: '#93C5FD' },
      ]
    : [];

  const barData = result
    ? [
        { name: 'Manual', hours: result.breakdown.manualTestingHours },
        { name: 'Automation', hours: result.breakdown.automationHours },
        { name: 'Retest', hours: result.breakdown.defectRetestingHours },
        { name: 'Planning', hours: result.breakdown.testPlanningHours },
        { name: 'Reporting', hours: result.breakdown.reportingHours },
      ]
    : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs mb-1">
            <Calculator className="w-4 h-4" />
            <span>Resource Estimation Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Estimation Calculator
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure project size, test scope, and environment matrix to compute required QA person-hours.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={handleSaveEstimate}
            disabled={saveLoading}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saveLoading ? 'Saving...' : 'Save Estimate'}</span>
          </button>
        </div>
      </div>

      {notification && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification.text}</span>
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Inputs (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 text-base">Project & Sizing Parameters</h2>
              <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                Dynamic Recalculation
              </span>
            </div>

            {/* 1. Project Name & Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Project Type</label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium"
                >
                  <option value="Web Application">Web Application</option>
                  <option value="Mobile Application">Mobile Application</option>
                  <option value="Full Stack Application">Full Stack Application</option>
                  <option value="API">API / Microservices</option>
                  <option value="Enterprise Application">Enterprise Application</option>
                </select>
              </div>
            </div>

            {/* 2. LOC & Test Cases */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800">Lines of Code (LOC)</label>
                  <span className="text-xs font-mono font-bold text-blue-700">{loc.toLocaleString()} LOC</span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={loc}
                  onChange={(e) => setLoc(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium mb-1.5"
                />
                <span className="text-[11px] text-slate-600 block">
                  LOC Effort: <strong>{result?.locEffort || 80} hrs</strong> (at 6.4h/1k LOC)
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800">Test Case Count</label>
                  <span className="text-xs font-mono font-bold text-indigo-700">{testCases.toLocaleString()} Cases</span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="20"
                  value={testCases}
                  onChange={(e) => setTestCases(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium mb-1.5"
                />
                <span className="text-[11px] text-slate-600 block">
                  Test Case Effort: <strong>{result?.testCaseEffort || 52.2} hrs</strong> (at 0.124h/case)
                </span>
              </div>
            </div>

            {/* 3. Sliders: Coverage & Automation */}
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-xs font-bold text-slate-800">Target Test/Code Coverage</span>
                    <p className="text-[11px] text-slate-600">Baseline is 70%. Multiplier: 1 + ((Coverage - 70)/100)</p>
                  </div>
                  <span className="text-sm font-extrabold text-blue-600 font-mono bg-blue-50 px-2.5 py-1 rounded-lg">
                    {coverage}% ({result?.coverageMultiplier || 1.15}x)
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  value={coverage}
                  onChange={(e) => setCoverage(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-slate-600 font-mono mt-1">
                  <span>40% (Light)</span>
                  <span>70% (Baseline 1.0x)</span>
                  <span>85% (Target 1.15x)</span>
                  <span>100% (Full 1.30x)</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-xs font-bold text-slate-800">Automation Ratio (%)</span>
                    <p className="text-[11px] text-slate-600">Higher automation shifts effort from manual execution to test script creation</p>
                  </div>
                  <span className="text-sm font-extrabold text-indigo-600 font-mono bg-indigo-50 px-2.5 py-1 rounded-lg">
                    {automationPercent}% Auto
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={automationPercent}
                  onChange={(e) => setAutomationPercent(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-600 font-mono mt-1">
                  <span>0% (All Manual)</span>
                  <span>35% (Balanced Hybrid)</span>
                  <span>70%+ (High Automation)</span>
                </div>
              </div>
            </div>

            {/* 4. Complexity & Environment Multipliers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Project Complexity</label>
                <select
                  value={complexity}
                  onChange={(e) => setComplexity(e.target.value as any)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium"
                >
                  <option value="Low">Low (0.85x)</option>
                  <option value="Medium">Medium (1.00x)</option>
                  <option value="High">High (1.25x)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Environments</label>
                <select
                  value={environments}
                  onChange={(e) => setEnvironments(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium"
                >
                  <option value="1">1 Env (1.00x)</option>
                  <option value="2">2 Envs (1.10x)</option>
                  <option value="3">3+ Envs (1.20x)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">API Integrations</label>
                <input
                  type="number"
                  min="0"
                  value={apiCount}
                  onChange={(e) => setApiCount(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Transparent Formula Callout */}
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-3 leading-relaxed">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Transparent Formula Applied:</p>
              <p className="font-mono text-[11px] text-blue-800 mt-1">
                QA Person Hours = ({result?.locEffort || 80} + {result?.testCaseEffort || 52.2}) × {result?.coverageMultiplier || 1.15} (Coverage) × {result?.complexityMultiplier || 1.0} (Complexity) × {result?.envMultiplier || 1.0} (Env) = <strong className="text-blue-950 font-sans text-xs">{result?.totalHours || 152} person-hours</strong>
              </p>
              <p className="text-[11px] text-blue-700 mt-1">
                * {result?.disclaimer || 'Estimate based on configurable assumptions and historical/project factors.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Computed Outputs & Breakdowns (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Computed Metric Display */}
          <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 rounded-2xl p-6 text-white shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-blue-200">
                Calculated Estimate
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/20">
                Enterprise Sizing
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-extrabold tracking-tight text-white">
                  {result ? result.totalHours : '152'}
                </span>
                <span className="text-sm font-semibold text-blue-200">QA person-hours</span>
              </div>
              <p className="text-xs text-blue-100/80 mt-1">
                Total engineering capacity needed for end-to-end verification.
              </p>
            </div>

            {/* Time units grid */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10 text-center">
              <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs">
                <span className="block text-2xl font-extrabold text-white">
                  {result?.personDays || 19}
                </span>
                <span className="text-[11px] text-blue-200 font-medium">Working Days (8h/day)</span>
              </div>
              <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs">
                <span className="block text-2xl font-extrabold text-white">
                  {result?.personWeeks || 3.8}
                </span>
                <span className="text-[11px] text-blue-200 font-medium">Sprint Weeks (40h/wk)</span>
              </div>
            </div>

            {/* Recommended Team Composition */}
            <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-white mb-2">
                <Users className="w-4 h-4 text-blue-300" />
                <span>Recommended Team: {result?.recommendedTeam.totalTeamSize || 4} Specialists</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-black/20 p-2 rounded-lg">
                  <span className="font-extrabold text-blue-300 block">{result?.recommendedTeam.qaLead || 1}</span>
                  <span className="text-[10px] text-blue-100">QA Lead</span>
                </div>
                <div className="bg-black/20 p-2 rounded-lg">
                  <span className="font-extrabold text-blue-300 block">{result?.recommendedTeam.qaEngineers || 2}</span>
                  <span className="text-[10px] text-blue-100">QA Engineers</span>
                </div>
                <div className="bg-black/20 p-2 rounded-lg">
                  <span className="font-extrabold text-blue-300 block">{result?.recommendedTeam.automationEngineers || 1}</span>
                  <span className="text-[10px] text-blue-100">Automation</span>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Breakdown Donut & Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Effort Allocation Breakdown</h3>
              <span className="text-xs font-semibold text-slate-400">Activity Distribution</span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }}
                    formatter={(val: any, name: any, item: any) => [`${val}% (${item.payload.hours}h)`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 text-xs">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-700 font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-slate-900">{item.value}%</span>
                    <span className="text-slate-400">({item.hours} hrs)</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => onNavigate('reports')}
                className="w-full py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Export Formal QA Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
