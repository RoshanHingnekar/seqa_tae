import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Trash2,
  Calculator,
  Calendar,
  Layers,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { estimationsApi } from '../services/api';
import { EstimationHistoryItem } from '../types';
import { useProjects } from '../context/ProjectContext';

interface HistoryPageProps {
  onNavigate: (page: string, data?: any) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onNavigate }) => {
  const { setSelectedProject, projects } = useProjects();

  const [history, setHistory] = useState<EstimationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [complexityFilter, setComplexityFilter] = useState('All');
  const [notice, setNotice] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await estimationsApi.history();
      setHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this historical calculation record?')) {
      try {
        await estimationsApi.deleteHistory(id);
        fetchHistory();
        setNotice('Record deleted');
        setTimeout(() => setNotice(null), 3000);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleLoadIntoEstimator = (item: EstimationHistoryItem) => {
    const match = projects.find((p) => p.name === item.projectName);
    if (match) {
      setSelectedProject(match);
    }
    onNavigate('estimator');
  };

  const filteredHistory = history.filter((h) => {
    const matchesSearch = h.projectName.toLowerCase().includes(search.toLowerCase());
    const matchesComp = complexityFilter === 'All' || h.complexity === complexityFilter;
    return matchesSearch && matchesComp;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs mb-1">
            <History className="w-4 h-4" />
            <span>Estimation Audit Trail</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Calculation History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Review previous estimation snapshots, compare sizing parameters, and reload past models.
          </p>
        </div>

        <button
          onClick={() => onNavigate('estimator')}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
        >
          <Calculator className="w-4 h-4" />
          <span>New Calculation</span>
        </button>
      </div>

      {notice && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by project name..."
            className="w-full text-xs pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div>
          <select
            value={complexityFilter}
            onChange={(e) => setComplexityFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="All">All Complexities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px] font-bold bg-slate-50/50">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">LOC</th>
                <th className="py-3 px-4">Test Cases</th>
                <th className="py-3 px-4">Coverage</th>
                <th className="py-3 px-4">Complexity</th>
                <th className="py-3 px-4 text-right">Estimated Effort</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No historical calculations found.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((h) => (
                  <tr key={h.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {new Date(h.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{h.projectName}</td>
                    <td className="py-3 px-4 font-mono font-medium">{h.loc?.toLocaleString()} LOC</td>
                    <td className="py-3 px-4 font-mono font-medium">{h.testCases} Cases</td>
                    <td className="py-3 px-4 font-mono font-semibold text-blue-600">{h.coverage}%</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          h.complexity === 'High'
                            ? 'bg-amber-50 text-amber-800'
                            : h.complexity === 'Low'
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-blue-50 text-blue-800'
                        }`}
                      >
                        {h.complexity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-extrabold text-blue-700 text-sm">
                      {h.estimatedHours} hrs
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleLoadIntoEstimator(h)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] transition-colors flex items-center gap-1"
                          title="Load into Estimator"
                        >
                          <span>Load</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(h.id, e)}
                          className="p-1 rounded text-slate-400 hover:text-red-600"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
