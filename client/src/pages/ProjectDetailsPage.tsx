import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  ArrowLeft,
  Clock,
  Code2,
  CheckSquare,
  Percent,
  Calculator,
  FileDown,
  Layers,
  Users,
  CheckCircle2,
  Calendar,
  Sparkles,
  Save,
  HelpCircle,
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
import { projectsApi } from '../services/api';
import { useProjects } from '../context/ProjectContext';
import { Project, TestCase, EstimationHistoryItem, EstimationResult } from '../types';

interface ProjectDetailsPageProps {
  projectId?: string;
  onNavigate: (page: string, data?: any) => void;
}

export const ProjectDetailsPage: React.FC<ProjectDetailsPageProps> = ({ projectId, onNavigate }) => {
  const { selectedProject, refreshProjects } = useProjects();
  const targetId = projectId || selectedProject?.id;

  const [projectData, setProjectData] = useState<{
    project: Project & { testCaseItems: TestCase[]; history: EstimationHistoryItem[] };
    metrics: EstimationResult;
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [notes, setNotes] = useState('');
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!targetId) return;
      setLoading(true);
      try {
        const data = await projectsApi.get(targetId);
        setProjectData(data as any);
        setNotes(data.project.description || '');
      } catch (err) {
        console.error('Failed to load project details', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [targetId]);

  const handleSaveNotes = async () => {
    if (!projectData) return;
    try {
      await projectsApi.update(projectData.project.id, { description: notes });
      await refreshProjects();
      setSaveNotice('Project notes updated successfully!');
      setTimeout(() => setSaveNotice(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !projectData) {
    return (
      <div className="py-16 text-center text-slate-500 text-xs">
        Loading project details and calculated models...
      </div>
    );
  }

  const { project, metrics } = projectData;

  const pieData = metrics?.breakdown
    ? [
        { name: 'Manual Testing', value: metrics.breakdown.manualTestingPercent, hours: metrics.breakdown.manualTestingHours, color: '#2563EB' },
        { name: 'Automation Testing', value: metrics.breakdown.automationPercent, hours: metrics.breakdown.automationHours, color: '#4F46E5' },
        { name: 'Defect Retesting', value: metrics.breakdown.defectRetestingPercent, hours: metrics.breakdown.defectRetestingHours, color: '#06B6D4' },
        { name: 'Test Planning & Setup', value: metrics.breakdown.testPlanningPercent, hours: metrics.breakdown.testPlanningHours, color: '#3B82F6' },
        { name: 'Reporting', value: metrics.breakdown.reportingPercent, hours: metrics.breakdown.reportingHours, color: '#93C5FD' },
      ]
    : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Bar with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('projects')}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                {project.type}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                Created on {new Date(project.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {project.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('estimator')}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Calculator className="w-4 h-4 text-blue-600" />
            <span>Recalculate in Estimator</span>
          </button>
          <button
            onClick={() => onNavigate('reports', { projectId: project.id })}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <FileDown className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {saveNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Estimated QA Effort
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-blue-700">{metrics.totalHours}</span>
            <span className="text-xs text-slate-500 font-semibold">person-hours</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            {metrics.personDays} days ({metrics.personWeeks} weeks)
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Codebase Size
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{project.loc.toLocaleString()}</span>
            <span className="text-xs text-slate-500 font-semibold">LOC</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            Weighted effort: {metrics.locEffort} hours
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Test Case Suite
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-indigo-700">{project.testCases}</span>
            <span className="text-xs text-slate-500 font-semibold">scenarios</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            {project.testCaseItems?.length || 0} registered in test tracker
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Target Coverage
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600">{project.coverage}%</span>
            <span className="text-xs text-slate-500 font-semibold">code branch</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            Multiplier factor: {metrics.coverageMultiplier}x
          </p>
        </div>
      </div>

      {/* Main Details Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Parameters & Effort Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Input Parameters Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <h2 className="font-bold text-slate-900 text-base mb-4">Input Parameters & Multipliers</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                    <th className="pb-3 pr-4">Parameter</th>
                    <th className="pb-3 px-4">Configured Value</th>
                    <th className="pb-3 px-4">Rate / Weight</th>
                    <th className="pb-3 pl-4 text-right">Computed Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {metrics.parameterTable.map((row) => (
                    <tr key={row.parameter}>
                      <td className="py-2.5 pr-4 font-semibold text-slate-900">{row.parameter}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-600">{row.input}</td>
                      <td className="py-2.5 px-4 text-slate-500">{row.weightage}</td>
                      <td className="py-2.5 pl-4 text-right font-mono font-bold text-slate-800">{row.estimatedEffort}</td>
                    </tr>
                  ))}
                  <tr className="bg-blue-50/50 font-bold text-blue-900 border-t-2 border-slate-200">
                    <td className="py-3 pr-4">Total Required Effort</td>
                    <td className="py-3 px-4 font-mono">{project.loc.toLocaleString()} LOC</td>
                    <td className="py-3 px-4">All Multipliers</td>
                    <td className="py-3 pl-4 text-right font-mono text-sm text-blue-700">{metrics.totalHours} person-hours</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Effort Breakdown Visual */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <h2 className="font-bold text-slate-900 text-base mb-4">QA Phase Effort Allocation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="h-52 w-full">
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
                  <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-medium text-slate-700">{item.name}</span>
                    </div>
                    <div className="font-mono text-slate-800">
                      <strong>{item.value}%</strong> ({item.hours}h)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Team Recommendation & Notes */}
        <div className="space-y-6">
          {/* Team Recommendation */}
          <div className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white rounded-2xl p-6 shadow-md">
            <span className="text-xs uppercase font-bold text-blue-200 block mb-1">
              Engineering Sizing
            </span>
            <h2 className="text-xl font-bold text-white mb-3">Recommended QA Team</h2>
            <p className="text-xs text-blue-100/80 mb-5 leading-relaxed">
              Based on {metrics.totalHours} person-hours needed over {metrics.personWeeks} weeks:
            </p>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/10 backdrop-blur-xs text-xs">
                <span className="font-semibold">QA Lead</span>
                <span className="font-mono font-bold text-blue-300">{metrics.recommendedTeam.qaLead} FTE</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/10 backdrop-blur-xs text-xs">
                <span className="font-semibold">QA Engineers</span>
                <span className="font-mono font-bold text-blue-300">{metrics.recommendedTeam.qaEngineers} FTE</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/10 backdrop-blur-xs text-xs">
                <span className="font-semibold">Automation Engineer</span>
                <span className="font-mono font-bold text-blue-300">{metrics.recommendedTeam.automationEngineers} FTE</span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-blue-200">Total QA Capacity:</span>
              <span className="font-bold text-white">{metrics.recommendedTeam.totalTeamSize} Specialists</span>
            </div>
          </div>

          {/* Project Notes Section */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <h2 className="font-bold text-slate-900 text-base mb-2">Project Notes & Context</h2>
            <p className="text-xs text-slate-600 mb-3">Document project milestones, testing caveats, or dependencies:</p>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add release notes or QA assumptions..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleSaveNotes}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
