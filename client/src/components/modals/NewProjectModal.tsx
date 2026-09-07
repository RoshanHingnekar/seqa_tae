import React, { useState } from 'react';
import { X, FolderPlus, Sparkles } from 'lucide-react';
import { projectsApi } from '../../services/api';
import { useProjects } from '../../context/ProjectContext';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, onCreated }) => {
  const { refreshProjects, setSelectedProject } = useProjects();

  const [name, setName] = useState('');
  const [type, setType] = useState('Full Stack Application');
  const [loc, setLoc] = useState<number>(10000);
  const [testCases, setTestCases] = useState<number>(350);
  const [coverage, setCoverage] = useState<number>(80);
  const [automationPercent, setAutomationPercent] = useState<number>(35);
  const [complexity, setComplexity] = useState('Medium');
  const [environments, setEnvironments] = useState<number>(1);
  const [apiCount, setApiCount] = useState<number>(10);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await projectsApi.create({
        name: name.trim(),
        type,
        loc: Number(loc),
        testCases: Number(testCases),
        coverage: Number(coverage),
        automationPercent: Number(automationPercent),
        complexity,
        environments: Number(environments),
        apiCount: Number(apiCount),
        description,
        status: 'Active',
      });
      await refreshProjects();
      setSelectedProject(res.project);
      onClose();
      if (onCreated) onCreated();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/70 to-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Create New QA Project</h3>
              <p className="text-xs text-slate-600">Configure parameters for automatic effort estimation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Project Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. NeoPay Mobile Wallet, Cloud ERP Portal"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Project Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="Web Application">Web Application</option>
                <option value="Mobile Application">Mobile Application</option>
                <option value="Full Stack Application">Full Stack Application</option>
                <option value="API">API</option>
                <option value="Enterprise Application">Enterprise Application</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Project Complexity</label>
              <select
                value={complexity}
                onChange={(e) => setComplexity(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="Low">Low (0.85x effort)</option>
                <option value="Medium">Medium (1.00x baseline)</option>
                <option value="High">High (1.25x effort)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lines of Code (LOC)</label>
              <input
                type="number"
                min="0"
                value={loc}
                onChange={(e) => setLoc(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Test Case Count</label>
              <input
                type="number"
                min="0"
                value={testCases}
                onChange={(e) => setTestCases(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Coverage (%)</label>
              <input
                type="number"
                min="10"
                max="100"
                value={coverage}
                onChange={(e) => setCoverage(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Automation %</label>
              <input
                type="number"
                min="0"
                max="100"
                value={automationPercent}
                onChange={(e) => setAutomationPercent(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Environments</label>
              <select
                value={environments}
                onChange={(e) => setEnvironments(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="1">1 Environment (1.00x)</option>
                <option value="2">2 Environments (1.10x)</option>
                <option value="3">3+ Environments (1.20x)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">API Integrations</label>
              <input
                type="number"
                min="0"
                value={apiCount}
                onChange={(e) => setApiCount(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Project Description & Scope</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of architecture, test scope, and target milestone..."
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {loading ? 'Creating & Estimating...' : 'Create & Calculate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
