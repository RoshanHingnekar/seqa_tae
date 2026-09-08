import React, { useState, useEffect } from 'react';
import {
  Clock,
  Code2,
  CheckSquare,
  Percent,
  TrendingUp,
  TrendingDown,
  Calculator,
  Layers,
  Users,
  FileBarChart2,
  Calendar,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
  Zap,
  Save,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';
import { estimationsApi, projectsApi } from '../services/api';
import { EstimationResult, EstimationHistoryItem } from '../types';
import { FormulaModal } from '../components/modals/FormulaModal';

interface DashboardPageProps {
  onNavigate: (page: string, data?: any) => void;
  onOpenNewProject: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenNewProject,
}) => {
  const { user } = useAuth();
  const { selectedProject, refreshProjects } = useProjects();

  const [metrics, setMetrics] = useState<EstimationResult | null>(null);
  const [historyItems, setHistoryItems] = useState<EstimationHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showFormulaModal, setShowFormulaModal] = useState<boolean>(false);

  // Quick Calculator State
  const [quickLoc, setQuickLoc] = useState<number>(10000);
  const [quickTestCases, setQuickTestCases] = useState<number>(300);
  const [quickCoverage, setQuickCoverage] = useState<number>(80);
  const [quickResult, setQuickResult] = useState<{ hours: number; days: number }>({ hours: 0, days: 0 });
  const [quickCalculating, setQuickCalculating] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Fetch metrics whenever selectedProject changes
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        if (!selectedProject) {
          setMetrics(null);
          setQuickResult({ hours: 0, days: 0 });
          const historyData = await estimationsApi.history();
          setHistoryItems(historyData.slice(0, 5));
          return;
        }

        const payload = {
          projectName: selectedProject.name,
          projectType: selectedProject.type,
          loc: selectedProject.loc,
          testCases: selectedProject.testCases,
          coverage: selectedProject.coverage,
          automationPercent: selectedProject.automationPercent,
          complexity: selectedProject.complexity,
          environments: selectedProject.environments,
          apiCount: selectedProject.apiCount,
        };

        const calc = await estimationsApi.calculate(payload);
        setMetrics(calc);

        // Update quick calculator inputs to match active project
        setQuickLoc(calc.loc);
        setQuickTestCases(calc.testCases);
        setQuickCoverage(calc.coverage);
        setQuickResult({ hours: calc.totalHours, days: calc.personDays });

        // Load history items
        const historyData = await estimationsApi.history();
        setHistoryItems(historyData.slice(0, 5));
      } catch (err) {
        console.error('Failed to load dashboard metrics', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [selectedProject]);

  const handleQuickCalculate = async () => {
    setQuickCalculating(true);
    try {
      const calc = await estimationsApi.calculate({
        projectName: selectedProject?.name || 'Quick Estimate',
        loc: Number(quickLoc),
        testCases: Number(quickTestCases),
        coverage: Number(quickCoverage),
        complexity: selectedProject?.complexity || 'Medium',
        environments: selectedProject?.environments || 1,
      });
      setQuickResult({ hours: calc.totalHours, days: calc.personDays });
      setMetrics(calc);
    } catch (err) {
      console.error(err);
    } finally {
      setQuickCalculating(false);
    }
  };

  const handleSaveCurrentEstimate = async () => {
    if (!metrics) return;
    try {
      await estimationsApi.save({
        projectId: selectedProject?.id,
        ...metrics,
        notes: 'Saved from Quick Estimation panel',
      });
      setSaveSuccessNotice('Estimate successfully saved to project history!');
      setTimeout(() => setSaveSuccessNotice(null), 4000);
      const updatedHistory = await estimationsApi.history();
      setHistoryItems(updatedHistory.slice(0, 5));
    } catch (err) {
      console.error(err);
    }
  };

  // Pie chart effort breakdown data
  const pieData = metrics
    ? [
        { name: 'Manual Testing', value: metrics.breakdown.manualTestingPercent, hours: metrics.breakdown.manualTestingHours, color: '#2563EB' },
        { name: 'Automation Testing', value: metrics.breakdown.automationPercent, hours: metrics.breakdown.automationHours, color: '#4F46E5' },
        { name: 'Defect Retesting', value: metrics.breakdown.defectRetestingPercent, hours: metrics.breakdown.defectRetestingHours, color: '#06B6D4' },
        { name: 'Test Planning & Setup', value: metrics.breakdown.testPlanningPercent, hours: metrics.breakdown.testPlanningHours, color: '#3B82F6' },
        { name: 'Reporting', value: metrics.breakdown.reportingPercent, hours: metrics.breakdown.reportingHours, color: '#93C5FD' },
      ]
    : [];

  // Trend curve data (QA Person Hours vs LOC)
  const trendData = metrics?.trendCurve || [
    { locLabel: '1K LOC', hours: 0, previousEstimateHours: 0 },
    { locLabel: '5K LOC', hours: 0, previousEstimateHours: 0 },
    { locLabel: '10K LOC', hours: 0, previousEstimateHours: 0 },
    { locLabel: '20K LOC', hours: 0, previousEstimateHours: 0 },
    { locLabel: '30K LOC', hours: 0, previousEstimateHours: 0 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Welcome Section & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold border border-blue-400/20 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>Active Project: {selectedProject?.name || 'No Project Selected'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Welcome back{user?.name ? `, ${user.name}` : ''}!
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/80 max-w-2xl">
            Estimate QA effort for your software projects quickly and accurately.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('estimator')}
            className="px-4 py-2.5 rounded-xl bg-white text-blue-900 hover:bg-blue-50 text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
          >
            <Calculator className="w-4 h-4 text-blue-600" />
            <span>Open Estimator</span>
          </button>
          <button
            onClick={onOpenNewProject}
            className="px-4 py-2.5 rounded-xl bg-blue-700/80 hover:bg-blue-600 text-white text-xs font-semibold border border-blue-400/30 shadow-sm transition-all"
          >
            + New Project
          </button>
        </div>
      </div>

      {saveSuccessNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveSuccessNotice}</span>
        </div>
      )}

      {/* 2. Four KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Estimated QA Effort */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Estimated QA Effort</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {metrics ? metrics.totalHours.toLocaleString() : '0'}
            </span>
            <span className="text-xs font-semibold text-slate-500">person-hours</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1 text-slate-500 font-semibold">
              <span>{selectedProject ? 'Estimated QA Effort' : 'No active project'}</span>
            </span>
            <span className="text-slate-400 font-medium">~{metrics?.personDays || 0} working days</span>
          </div>
        </div>

        {/* KPI 2: Total Lines of Code */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Lines of Code</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Code2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {metrics ? metrics.loc.toLocaleString() : '0'}
            </span>
            <span className="text-xs font-semibold text-slate-500">LOC</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1 text-slate-500 font-semibold">
              <span>Codebase Volume</span>
            </span>
            <span className="text-slate-400 font-medium">{metrics?.locRate || 6.4} hrs/1k</span>
          </div>
        </div>

        {/* KPI 3: Total Test Cases */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Test Cases</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition-colors">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {metrics ? metrics.testCases.toLocaleString() : '0'}
            </span>
            <span className="text-xs font-semibold text-slate-500">scenarios</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1 text-slate-500 font-semibold">
              <span>{metrics?.automationPercent || 0}% automated</span>
            </span>
            <span className="text-slate-400 font-medium">~0.12h/test</span>
          </div>
        </div>

        {/* KPI 4: Target Coverage */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Target Coverage</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {metrics ? metrics.coverage : '0'}%
            </span>
            <span className="text-xs font-semibold text-slate-500">branch target</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1 text-slate-500 font-semibold">
              <span>Target Coverage</span>
            </span>
            <span className="text-slate-400 font-medium">{metrics?.coverageMultiplier || 1.0}x weight</span>
          </div>
        </div>
      </div>

      {/* 3. Main Row 1: Estimation Trend Chart & Effort Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* A. Estimation Trend (Line / Area Chart) - 2 Cols */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Estimation Trend</h2>
              <p className="text-xs text-slate-600">QA Person-Hours progression scaled against project LOC size</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 font-medium text-slate-600">
                <div className="w-3 h-3 rounded-full bg-blue-600" />
                <span>Current Estimate</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-slate-400">
                <div className="w-3 h-3 rounded-full bg-slate-300" />
                <span>Previous Estimate</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="locLabel" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} unit="h" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                  formatter={(val: any) => [`${val} person-hours`, '']}
                />
                <Area type="monotone" dataKey="hours" name="Current Estimate" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#blueGradient)" />
                <Line type="monotone" dataKey="previousEstimateHours" name="Previous Estimate" stroke="#CBD5E1" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* B. Effort Breakdown Donut Chart - 1 Col */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-slate-900 text-base">Effort Breakdown</h2>
                <p className="text-xs text-slate-600">Distribution across QA activities</p>
              </div>
              <span className="text-xs font-bold text-blue-700 px-2 py-1 rounded-md bg-blue-50">
                100% Total
              </span>
            </div>

            <div className="h-48 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
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
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-extrabold text-slate-900">{metrics?.totalHours || 0}</span>
                <span className="text-[10px] uppercase font-bold text-slate-400">Hours</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 mt-2 pt-3 border-t border-slate-100 text-xs">
            {pieData.length === 0 ? (
              <p className="text-center text-slate-400 py-3 text-xs">No active effort breakdown to display</p>
            ) : (
              pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-slate-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="truncate max-w-[140px] text-[11px]">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="font-semibold text-slate-800">{item.value}%</span>
                    <span className="text-slate-400">({item.hours}h)</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. Main Row 2: Quick Estimation Panel & Parameters Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* C. Quick Estimation Panel - 1 Col */}
        <div className="bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 rounded-2xl p-6 border border-blue-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-800 font-bold text-base mb-1">
              <Zap className="w-4 h-4 text-blue-600 fill-blue-600" />
              <h2>Quick Estimation Panel</h2>
            </div>
            <p className="text-xs text-slate-600 mb-5">
              Simulate adjustments to LOC, test counts, or coverage in real time.
            </p>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lines of Code (LOC)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={quickLoc}
                  onChange={(e) => setQuickLoc(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Test Case Count
                </label>
                <input
                  type="number"
                  min="0"
                  step="20"
                  value={quickTestCases}
                  onChange={(e) => setQuickTestCases(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Target Coverage (%)</label>
                  <span className="text-xs font-bold text-blue-700">{quickCoverage}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={quickCoverage}
                  onChange={(e) => setQuickCoverage(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <button
                type="button"
                onClick={handleQuickCalculate}
                disabled={quickCalculating}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>{quickCalculating ? 'Calculating...' : 'Calculate Estimate'}</span>
              </button>
            </div>
          </div>

          {/* Quick Result Display */}
          <div className="mt-5 p-4 rounded-xl bg-white border border-blue-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Estimated QA Effort
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-blue-700 tracking-tight">
                {quickResult.hours}
              </span>
              <span className="text-xs font-semibold text-slate-600">person-hours</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Approx. <strong className="text-slate-800">{quickResult.days} working days</strong> (assuming 8h/day).
            </p>
          </div>
        </div>

        {/* D. Estimation Inputs & Results Table - 2 Cols */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-slate-900 text-base">Estimation Inputs & Results</h2>
                <p className="text-xs text-slate-600">Transparent parameters and computed workload components</p>
              </div>
              <button
                onClick={() => setShowFormulaModal(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" /> Formula Details
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                    <th className="pb-3 pr-4">Parameter</th>
                    <th className="pb-3 px-4">Input Value</th>
                    <th className="pb-3 px-4">Weightage / Rate</th>
                    <th className="pb-3 pl-4 text-right">Estimated Effort</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {metrics?.parameterTable?.map((row) => (
                    <tr key={row.parameter} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 pr-4 font-semibold text-slate-900">{row.parameter}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-600">{row.input}</td>
                      <td className="py-2.5 px-4 text-slate-500">{row.weightage}</td>
                      <td className="py-2.5 pl-4 text-right font-mono font-semibold text-slate-800">{row.estimatedEffort}</td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        No active project parameters. Select a project or run a quick estimate.
                      </td>
                    </tr>
                  )}
                  {/* Total Row */}
                  {metrics && (
                    <tr className="border-t-2 border-slate-200 bg-blue-50/40 text-blue-950 font-bold">
                      <td className="py-3 pr-4">Total Estimated QA Effort</td>
                      <td className="py-3 px-4 font-mono">{metrics.loc.toLocaleString()} LOC + {metrics.testCases} TC</td>
                      <td className="py-3 px-4">Combined Multipliers</td>
                      <td className="py-3 pl-4 text-right font-mono text-sm text-blue-700">
                        {metrics.totalHours} person-hours
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span>Formula standard: <strong>(LOC + TC Effort) × Coverage × Complexity × Env</strong></span>
            <button
              onClick={handleSaveCurrentEstimate}
              disabled={!metrics}
              className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Save className="w-3.5 h-3.5 text-blue-600" />
              <span>Save as Estimation Snapshot</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Main Row 3: Project Complexity & Recommended Team + Historical Estimates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* E. Project Complexity Card - 1 Col */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 text-base">Project Complexity</h2>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  metrics?.complexity === 'High'
                    ? 'bg-amber-100 text-amber-800'
                    : metrics?.complexity === 'Low'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {metrics?.complexity || 'N/A'}
              </span>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              {metrics
                ? 'Automatically determined from architectural scale and test environment matrix:'
                : 'No project complexity data available. Create or select a project to evaluate complexity.'}
            </p>

            <div className="space-y-2">
              {metrics?.complexityFactors?.map((fac) => (
                <div key={fac.factor} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">{fac.factor}</p>
                    <p className="text-[11px] text-slate-600">{fac.impact}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                    {fac.level}
                  </span>
                </div>
              )) || (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  Select a project to analyze complexity factors.
                </div>
              )}
            </div>
          </div>

          {/* Recommended Team */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Recommended QA Team
            </span>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-xl bg-blue-50 border border-blue-100">
                <span className="block text-lg font-extrabold text-blue-700">
                  {metrics?.recommendedTeam?.qaLead ?? 0}
                </span>
                <span className="text-[10px] font-semibold text-blue-900">QA Lead</span>
              </div>
              <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100">
                <span className="block text-lg font-extrabold text-indigo-700">
                  {metrics?.recommendedTeam?.qaEngineers ?? 0}
                </span>
                <span className="text-[10px] font-semibold text-indigo-900">QA Engineers</span>
              </div>
              <div className="p-2 rounded-xl bg-cyan-50 border border-cyan-100">
                <span className="block text-lg font-extrabold text-cyan-700">
                  {metrics?.recommendedTeam?.automationEngineers ?? 0}
                </span>
                <span className="text-[10px] font-semibold text-cyan-900">SDET / Auto</span>
              </div>
            </div>
          </div>
        </div>

        {/* F. Historical Estimates Table - 2 Cols */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-slate-900 text-base">Historical Estimates</h2>
                <p className="text-xs text-slate-600">Previous calculation logs and audited baseline versions</p>
              </div>
              <button
                onClick={() => onNavigate('history')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View Full History →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                    <th className="pb-3 pr-3">Date</th>
                    <th className="pb-3 px-3">Project</th>
                    <th className="pb-3 px-3">LOC</th>
                    <th className="pb-3 px-3">Test Cases</th>
                    <th className="pb-3 px-3">Coverage</th>
                    <th className="pb-3 pl-3 text-right">Estimated Effort</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {historyItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        No previous estimation logs recorded
                      </td>
                    </tr>
                  ) : (
                    historyItems.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 pr-3 text-slate-500 font-mono">
                          {new Date(h.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 truncate max-w-[160px]">
                          {h.projectName}
                        </td>
                        <td className="py-2.5 px-3 font-mono">{h.loc?.toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-mono">{h.testCases}</td>
                        <td className="py-2.5 px-3">{h.coverage}%</td>
                        <td className="py-2.5 pl-3 text-right font-mono font-bold text-blue-600">
                          {h.estimatedHours} hrs
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Historical regression buffer: ~15% retesting allocation</span>
            <button
              onClick={() => onNavigate('projects')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Compare All Projects
            </button>
          </div>
        </div>
      </div>

      {/* 6. Estimation Guide & Quick Action Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* G. Estimation Guide - 2 Cols */}
        <div className="lg:col-span-2 bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/40 rounded-2xl p-6 border border-blue-200/70 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <h2>QA Estimation Guide & Quick Rules</h2>
              </div>
              <button
                onClick={() => setShowFormulaModal(true)}
                className="text-xs font-bold text-blue-700 hover:text-blue-800 bg-white border border-blue-200 px-3 py-1.5 rounded-xl shadow-xs transition-colors"
              >
                View Detailed Calculation Formula
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Standard heuristics calibrated against enterprise software testing benchmarks:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-white rounded-xl border border-blue-100 shadow-xs">
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block mb-1">
                  1,000 Lines of Code
                </span>
                <p className="text-xs text-slate-800 font-semibold">≈ 8–12 QA hours</p>
                <p className="text-[11px] text-slate-600 mt-1">Accounts for code walkthroughs & verification suites.</p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-blue-100 shadow-xs">
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block mb-1">
                  1 Test Case Scenario
                </span>
                <p className="text-xs text-slate-800 font-semibold">≈ 0.1–0.2 QA hours</p>
                <p className="text-[11px] text-slate-600 mt-1">Covers manual step runs, assertions, & defect logging.</p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-blue-100 shadow-xs">
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block mb-1">
                  Target Coverage Curve
                </span>
                <p className="text-xs text-slate-800 font-semibold">Higher coverage → Higher effort</p>
                <p className="text-[11px] text-slate-600 mt-1">Marginal hours scale progressively past 80% coverage.</p>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-600 mt-4 italic">
            * {metrics?.disclaimer || 'Estimate based on configurable assumptions and historical/project factors.'}
          </p>
        </div>

        {/* H. Quick Actions - 1 Col */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-base mb-1">Quick Actions</h2>
            <p className="text-xs text-slate-600 mb-4">Direct workflow navigation shortcuts</p>

            <div className="space-y-2">
              <button
                onClick={() => onNavigate('estimator')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-slate-800 text-xs font-semibold flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <Calculator className="w-4 h-4 text-blue-600" />
                  <span>New Estimation</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={handleSaveCurrentEstimate}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-slate-800 text-xs font-semibold flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <Save className="w-4 h-4 text-indigo-600" />
                  <span>Save Project Snapshot</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => onNavigate('reports')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-slate-800 text-xs font-semibold flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <FileBarChart2 className="w-4 h-4 text-cyan-600" />
                  <span>View Reports</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => onNavigate('team')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-slate-800 text-xs font-semibold flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Manage Team</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-600">Enterprise QA SaaS v2.4</span>
          </div>
        </div>
      </div>

      {/* Formula Modal */}
      <FormulaModal isOpen={showFormulaModal} onClose={() => setShowFormulaModal(false)} />
    </div>
  );
};
