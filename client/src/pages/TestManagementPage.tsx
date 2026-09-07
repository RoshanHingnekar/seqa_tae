import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  FileDown,
  Upload,
  Search,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Clock,
  Sparkles,
  Filter,
  Trash2,
} from 'lucide-react';
import { testCasesApi } from '../services/api';
import { useProjects } from '../context/ProjectContext';
import { TestCase, TestCaseStats } from '../types';
import { AddTestCaseModal } from '../components/modals/AddTestCaseModal';

interface TestManagementPageProps {
  onNavigate: (page: string, data?: any) => void;
}

export const TestManagementPage: React.FC<TestManagementPageProps> = () => {
  const { selectedProject, projects } = useProjects();

  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [stats, setStats] = useState<TestCaseStats>({
    total: 0,
    passed: 0,
    failed: 0,
    blocked: 0,
    notRun: 0,
    automated: 0,
    automationCoverage: 0,
    passRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [notice, setNotice] = useState<string | null>(null);

  const fetchCasesAndStats = async () => {
    setLoading(true);
    try {
      const [casesData, statsData] = await Promise.all([
        testCasesApi.list({ projectId: selectedProject?.id }),
        testCasesApi.stats(selectedProject?.id),
      ]);
      setTestCases(casesData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load test management data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCasesAndStats();
  }, [selectedProject]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await testCasesApi.update(id, { status: newStatus });
      fetchCasesAndStats();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this test case?')) {
      try {
        await testCasesApi.delete(id);
        fetchCasesAndStats();
        setNotice('Test case removed');
        setTimeout(() => setNotice(null), 3000);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleExportCSV = () => {
    if (testCases.length === 0) return;
    const headers = ['ID', 'Title', 'Module', 'Priority', 'Type', 'Status', 'Assigned To'];
    const rows = testCases.map((tc) => [
      tc.testId,
      `"${tc.title.replace(/"/g, '""')}"`,
      tc.module,
      tc.priority,
      tc.type,
      tc.status,
      tc.assignedTo || 'Unassigned',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `test-cases-${selectedProject?.name || 'project'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportSample = async () => {
    if (!selectedProject) return;
    const sampleBatch = [
      { testId: `TC-${200 + Math.floor(Math.random() * 50)}`, title: 'Verify Stripe ApplePay tokenization on Safari iOS', module: 'Payments', priority: 'P1', type: 'Automated', status: 'Passed', assignedTo: 'Alex Chen' },
      { testId: `TC-${200 + Math.floor(Math.random() * 50)}`, title: 'Check invoice PDF download layout and VAT calculation', module: 'Billing', priority: 'P2', type: 'Manual', status: 'Not Run', assignedTo: 'Elena Rostova' },
      { testId: `TC-${200 + Math.floor(Math.random() * 50)}`, title: 'Audit JWT token expiration and refresh token rotation', module: 'Security', priority: 'P1', type: 'Automated', status: 'Passed', assignedTo: 'Marcus Brody' },
    ];
    try {
      await testCasesApi.batchImport(selectedProject.id, sampleBatch);
      await fetchCasesAndStats();
      setNotice('Imported 3 sample test cases!');
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  // Distinct modules for filter
  const modules = Array.from(new Set(testCases.map((t) => t.module))).filter(Boolean);

  // Filtered List
  const filteredCases = testCases.filter((tc) => {
    const matchesSearch =
      tc.testId.toLowerCase().includes(search.toLowerCase()) ||
      tc.title.toLowerCase().includes(search.toLowerCase()) ||
      (tc.assignedTo && tc.assignedTo.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || tc.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || tc.priority === priorityFilter;
    const matchesType = typeFilter === 'all' || tc.type === typeFilter;
    const matchesModule = moduleFilter === 'all' || tc.module === moduleFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesType && matchesModule;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs mb-1">
            <CheckSquare className="w-4 h-4" />
            <span>Test Case Management Suite</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Test Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track test execution status, automation coverage, and scenario assignments for {selectedProject?.name || 'Active Project'}.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleImportSample}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import Samples</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Test Case</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      {/* 6 Dashboard Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Total Cases</span>
          <span className="text-2xl font-extrabold text-slate-900">{stats.total}</span>
          <span className="text-[11px] text-slate-600 block mt-1">100% of suite</span>
        </div>

        {/* Passed */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Passed</span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <span className="text-2xl font-extrabold text-emerald-600">{stats.passed}</span>
          <span className="text-[11px] text-emerald-700 font-semibold block mt-1">{stats.passRate}% pass rate</span>
        </div>

        {/* Failed */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-red-500 mb-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Failed</span>
            <XCircle className="w-3.5 h-3.5" />
          </div>
          <span className="text-2xl font-extrabold text-red-600">{stats.failed}</span>
          <span className="text-[11px] text-red-600 block mt-1">Requires fix</span>
        </div>

        {/* Blocked */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-500 mb-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Blocked</span>
            <AlertOctagon className="w-3.5 h-3.5" />
          </div>
          <span className="text-2xl font-extrabold text-amber-600">{stats.blocked}</span>
          <span className="text-[11px] text-amber-700 block mt-1">Dependency hold</span>
        </div>

        {/* Not Run */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Not Run</span>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <span className="text-2xl font-extrabold text-slate-600">{stats.notRun}</span>
          <span className="text-[11px] text-slate-600 block mt-1">Pending run</span>
        </div>

        {/* Automation Coverage */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 mb-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Auto Coverage</span>
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="text-2xl font-extrabold text-blue-700">{stats.automationCoverage}%</span>
          <span className="text-[11px] text-slate-600 block mt-1">{stats.automated} automated</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Test ID, title, or tester..."
            className="w-full text-xs pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">All Statuses</option>
            <option value="Passed">Passed</option>
            <option value="Failed">Failed</option>
            <option value="Blocked">Blocked</option>
            <option value="Not Run">Not Run</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">All Priorities</option>
            <option value="P1">P1 (Critical)</option>
            <option value="P2">P2 (Major)</option>
            <option value="P3">P3 (Minor)</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">All Types</option>
            <option value="Manual">Manual</option>
            <option value="Automated">Automated</option>
          </select>

          {modules.length > 0 && (
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Modules</option>
              {modules.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Test Cases Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px] font-bold bg-slate-50/50">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Test Case Title</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned To</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No test cases match your current filters.
                  </td>
                </tr>
              ) : (
                filteredCases.map((tc) => (
                  <tr key={tc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{tc.testId}</td>
                    <td className="py-3 px-4 font-medium text-slate-900 max-w-sm">{tc.title}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-600 text-[10px]">
                        {tc.module}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] ${
                          tc.priority === 'P1'
                            ? 'bg-red-50 text-red-700'
                            : tc.priority === 'P2'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {tc.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          tc.type === 'Automated'
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {tc.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={tc.status}
                        onChange={(e) => handleStatusChange(tc.id, e.target.value)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border focus:outline-none ${
                          tc.status === 'Passed'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : tc.status === 'Failed'
                            ? 'bg-red-50 text-red-800 border-red-200'
                            : tc.status === 'Blocked'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <option value="Passed">Passed</option>
                        <option value="Failed">Failed</option>
                        <option value="Blocked">Blocked</option>
                        <option value="Not Run">Not Run</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{tc.assignedTo || 'Unassigned'}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(tc.id)}
                        className="p-1 rounded text-slate-400 hover:text-red-600 transition-colors"
                        title="Delete Test Case"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddTestCaseModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdded={fetchCasesAndStats}
      />
    </div>
  );
};
