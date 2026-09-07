import React, { useState, useEffect } from 'react';
import {
  FileBarChart2,
  Download,
  Printer,
  Sparkles,
  Calendar,
  Layers,
  Users,
  Clock,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { reportsApi, projectsApi } from '../services/api';
import { useProjects } from '../context/ProjectContext';
import { Project, ReportItem } from '../types';

export const ReportsPage: React.FC = () => {
  const { projects, selectedProject, setSelectedProject } = useProjects();

  const [reportType, setReportType] = useState('Estimation Report');
  const [projectId, setProjectId] = useState<string>(selectedProject?.id || '');
  const [reportsList, setReportsList] = useState<ReportItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [generating, setGenerating] = useState<boolean>(false);
  const [notes, setNotes] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  // Sync projectId with active project
  useEffect(() => {
    if (selectedProject && !projectId) {
      setProjectId(selectedProject.id);
    }
  }, [selectedProject]);

  const loadReports = async () => {
    try {
      const data = await reportsApi.list({ projectId: projectId || undefined });
      setReportsList(data);
      if (data.length > 0 && !selectedReport) {
        setSelectedReport(data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadReports();
  }, [projectId]);

  const handleGenerateReport = async () => {
    const targetProject = projectId || selectedProject?.id || projects[0]?.id;
    if (!targetProject) return;

    setGenerating(true);
    try {
      const p = projects.find((x) => x.id === targetProject);
      const res = await reportsApi.generate({
        projectId: targetProject,
        reportType,
        title: `${reportType} – ${p?.name || 'Software Project'}`,
        notes,
      });
      await loadReports();
      setSelectedReport(res);
      setNotice('Report successfully generated and saved!');
      setTimeout(() => setNotice(null), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  // PDF Export
  const handleDownloadPDF = () => {
    if (!selectedReport) return;
    let parsedData: any = {};
    try {
      parsedData = JSON.parse(selectedReport.data);
    } catch (e) {
      parsedData = {};
    }

    const doc = new jsPDF();
    const primaryColor: [number, number, number] = [37, 99, 235]; // #2563EB

    // Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 26, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('QAEstimator Pro – Formal QA Resource Report', 14, 16);

    // Subtitle
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(selectedReport.title, 14, 38);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${new Date(selectedReport.createdAt).toLocaleString()}`, 14, 44);
    doc.text(`Project: ${selectedReport.project?.name || 'Enterprise QA Project'}`, 14, 50);

    // Summary Box
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, 56, 182, 20, 2, 2, 'F');
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(9);
    doc.text(doc.splitTextToSize(selectedReport.summary, 175), 18, 64);

    // Table of Sizing & Parameters
    const metrics = parsedData.estimationMetrics;
    const tableData = metrics
      ? [
          ['Project Name', metrics.projectName],
          ['Project Type', metrics.projectType],
          ['Lines of Code (LOC)', `${metrics.loc?.toLocaleString()} LOC (at ${metrics.locRate}h/1k)`],
          ['Test Case Count', `${metrics.testCases} Scenarios (at ${metrics.testCaseRate}h/test)`],
          ['Target Code Coverage', `${metrics.coverage}% (${metrics.coverageMultiplier}x multiplier)`],
          ['Project Complexity', `${metrics.complexity} (${metrics.complexityMultiplier}x)`],
          ['Deployment Environments', `${metrics.environments} Env(s) (${metrics.envMultiplier}x)`],
          ['Total QA Person-Hours', `${metrics.totalHours} Person-Hours`],
          ['Estimated Working Days', `${metrics.personDays} Days (at 8h/day)`],
          ['Recommended Team Size', `${metrics.recommendedTeam?.totalTeamSize || 4} Specialists (${metrics.recommendedTeam?.qaLead || 1} Lead, ${metrics.recommendedTeam?.qaEngineers || 2} QA, ${metrics.recommendedTeam?.automationEngineers || 1} Auto)`],
        ]
      : [
          ['Project Name', selectedReport.project?.name || 'Project'],
          ['Report Type', selectedReport.reportType],
          ['Generated Hours', `${selectedReport.project?.estimatedHours || 152} person-hours`],
        ];

    (doc as any).autoTable({
      startY: 82,
      head: [['Key Attribute', 'Estimated Value']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: 255, fontSize: 10, fontStyle: 'bold' },
      bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 12;

    // Disclaimer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Disclaimer: Estimate based on configurable assumptions and historical/project factors. Formal verification by QAEstimator Pro.',
      14,
      Math.min(280, finalY)
    );

    doc.save(`${selectedReport.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  };

  // Excel Export
  const handleDownloadExcel = () => {
    if (!selectedReport) return;
    let parsedData: any = {};
    try {
      parsedData = JSON.parse(selectedReport.data);
    } catch (e) {
      parsedData = {};
    }

    const metrics = parsedData.estimationMetrics || {};
    const wsData = [
      ['QAEstimator Pro - Enterprise Testing Resource Assessment'],
      ['Report Title', selectedReport.title],
      ['Generated Date', new Date(selectedReport.createdAt).toISOString()],
      ['Project Name', selectedReport.project?.name || metrics.projectName || ''],
      ['Project Type', metrics.projectType || ''],
      [],
      ['Metric Parameter', 'Value', 'Unit / Weight'],
      ['Lines of Code (LOC)', metrics.loc || 0, `${metrics.locRate || 6.4} hrs / 1k LOC`],
      ['Test Case Count', metrics.testCases || 0, `${metrics.testCaseRate || 0.1242} hrs / test`],
      ['Target Coverage', `${metrics.coverage || 85}%`, `${metrics.coverageMultiplier || 1.15}x multiplier`],
      ['Complexity Factor', metrics.complexity || 'Medium', `${metrics.complexityMultiplier || 1.0}x`],
      ['Environments', metrics.environments || 1, `${metrics.envMultiplier || 1.0}x`],
      ['Total QA Person-Hours', metrics.totalHours || 152, 'Hours'],
      ['Person Days (8h/day)', metrics.personDays || 19, 'Days'],
      ['Person Weeks (40h/week)', metrics.personWeeks || 3.8, 'Weeks'],
      ['Recommended Team Size', metrics.recommendedTeam?.totalTeamSize || 4, 'Engineers'],
      [],
      ['Effort Distribution Breakdown'],
      ['Phase', 'Percentage', 'Allocated Hours'],
      ['Manual Testing', `${metrics.breakdown?.manualTestingPercent || 42}%`, metrics.breakdown?.manualTestingHours || 63.8],
      ['Automation Testing', `${metrics.breakdown?.automationPercent || 28}%`, metrics.breakdown?.automationHours || 42.6],
      ['Defect Retesting', `${metrics.breakdown?.defectRetestingPercent || 15}%`, metrics.breakdown?.defectRetestingHours || 22.8],
      ['Test Planning & Setup', `${metrics.breakdown?.testPlanningPercent || 10}%`, metrics.breakdown?.testPlanningHours || 15.2],
      ['Reporting', `${metrics.breakdown?.reportingPercent || 5}%`, metrics.breakdown?.reportingHours || 7.6],
      [],
      ['Assumptions & Scope', selectedReport.summary],
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'QA Estimate Report');
    XLSX.writeFile(wb, `${selectedReport.title.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  let reportPreviewData: any = {};
  if (selectedReport) {
    try {
      reportPreviewData = JSON.parse(selectedReport.data);
    } catch (e) {
      reportPreviewData = {};
    }
  }

  const pMetrics = reportPreviewData.estimationMetrics;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs mb-1">
            <FileBarChart2 className="w-4 h-4" />
            <span>Formal QA Documentation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            QA Reports & Exports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Generate executive estimation summaries, team utilization reports, and coverage audit documents.
          </p>
        </div>

        {selectedReport && (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownloadExcel}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Download Excel</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
          </div>
        )}
      </div>

      {notice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      {/* Generator Form & Template Selectors */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h2 className="font-bold text-slate-900 text-base">Generate New Report</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Project</label>
            <select
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                const match = projects.find((p) => p.id === e.target.value);
                if (match) setSelectedProject(match);
              }}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Report Template</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white font-medium"
            >
              <option value="Estimation Report">Estimation Report</option>
              <option value="Project QA Report">Project QA Report</option>
              <option value="Test Coverage Report">Test Coverage Report</option>
              <option value="Team Utilization Report">Team Utilization Report</option>
              <option value="Historical Estimation Report">Historical Estimation Report</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Optional Scope Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. For Q3 Stakeholder review"
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{generating ? 'Generating...' : 'Generate Report Preview'}</span>
          </button>
        </div>
      </div>

      {/* Main Content: Reports Archive Sidebar + Live Document Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4 Cols: Saved Reports List */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <h2 className="font-bold text-slate-900 text-sm">Saved Report Archives</h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {reportsList.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No reports saved yet</p>
            ) : (
              reportsList.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedReport(r)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer text-xs ${
                    selectedReport?.id === r.id
                      ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-blue-700 text-[11px] uppercase tracking-wider">
                      {r.reportType}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-900 line-clamp-1">{r.title}</h3>
                  <p className="text-slate-500 text-[11px] line-clamp-2 mt-1 leading-relaxed">
                    {r.summary}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 8 Cols: Interactive Report Preview Card */}
        <div className="lg:col-span-8">
          {selectedReport ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6">
              {/* Document Header */}
              <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <span className="text-base font-bold text-slate-900">QAEstimator Pro</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 uppercase">
                      Executive Audit
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900">{selectedReport.title}</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Generated on {new Date(selectedReport.createdAt).toLocaleString()} · Confidential QA Report
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs font-semibold text-slate-400 block uppercase">Project Assessment</span>
                  <span className="text-sm font-bold text-slate-800">
                    {selectedReport.project?.name || 'Project'}
                  </span>
                </div>
              </div>

              {/* Executive Summary Callout */}
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-950 leading-relaxed">
                <p className="font-bold mb-1">Executive Summary:</p>
                <p>{selectedReport.summary}</p>
              </div>

              {/* Metrics Grid */}
              {pMetrics && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total QA Effort</span>
                    <span className="text-xl font-extrabold text-blue-700">{pMetrics.totalHours} hrs</span>
                    <span className="text-[10px] text-slate-500 block">{pMetrics.personDays} working days</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">LOC Scope</span>
                    <span className="text-xl font-extrabold text-slate-900">{pMetrics.loc?.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-500 block">{pMetrics.locEffort} hrs baseline</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Test Cases</span>
                    <span className="text-xl font-extrabold text-indigo-700">{pMetrics.testCases}</span>
                    <span className="text-[10px] text-slate-500 block">{pMetrics.testCaseEffort} hrs baseline</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Coverage Goal</span>
                    <span className="text-xl font-extrabold text-emerald-600">{pMetrics.coverage}%</span>
                    <span className="text-[10px] text-slate-500 block">{pMetrics.coverageMultiplier}x multiplier</span>
                  </div>
                </div>
              )}

              {/* Parameter Table Preview */}
              {pMetrics?.parameterTable && (
                <div>
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                    Calculation Factors & Components
                  </h3>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Factor</th>
                          <th className="py-2.5 px-3">Specification</th>
                          <th className="py-2.5 px-3">Standard Multiplier</th>
                          <th className="py-2.5 px-3 text-right">Computed Hours</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {pMetrics.parameterTable.map((row: any) => (
                          <tr key={row.parameter}>
                            <td className="py-2 px-3 font-semibold text-slate-900">{row.parameter}</td>
                            <td className="py-2 px-3 font-mono">{row.input}</td>
                            <td className="py-2 px-3 text-slate-500">{row.weightage}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">{row.estimatedEffort}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Team Recommendation */}
              {pMetrics?.recommendedTeam && (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                  <h4 className="font-bold text-slate-800 text-xs mb-1.5">Recommended QA Staffing:</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {pMetrics.recommendedTeam.notes} ({pMetrics.recommendedTeam.totalTeamSize} specialists recommended to achieve sign-off within standard sprint timeline).
                  </p>
                </div>
              )}

              {/* Document Footer Disclaimer */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
                <span>QAEstimator Pro Enterprise Audit · Report ID: {selectedReport.id.slice(0, 10)}</span>
                <span className="italic">Estimate based on configurable assumptions and historical/project factors.</span>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center text-slate-400 text-xs">
              Select or generate a report to view live preview.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
