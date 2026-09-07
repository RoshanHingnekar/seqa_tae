import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  Search,
  Filter,
  Plus,
  LayoutGrid,
  List,
  Clock,
  Code2,
  CheckSquare,
  Percent,
  Copy,
  Trash2,
  Edit,
  Eye,
  FileBarChart2,
  MoreVertical,
  CheckCircle2,
} from 'lucide-react';
import { projectsApi } from '../services/api';
import { useProjects } from '../context/ProjectContext';
import { Project } from '../types';

interface ProjectsPageProps {
  onNavigate: (page: string, data?: any) => void;
  onOpenNewProject: () => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ onNavigate, onOpenNewProject }) => {
  const { projects, refreshProjects, setSelectedProject } = useProjects();

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [complexityFilter, setComplexityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.type.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
    const matchesType = typeFilter === 'All' || p.type === typeFilter;
    const matchesComplexity = complexityFilter === 'All' || p.complexity === complexityFilter;
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesType && matchesComplexity && matchesStatus;
  });

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await projectsApi.duplicate(id);
      await refreshProjects();
      setActionNotice('Project successfully duplicated!');
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete project "${name}"?`)) {
      try {
        await projectsApi.delete(id);
        await refreshProjects();
        setActionNotice(`Project "${name}" deleted.`);
        setTimeout(() => setActionNotice(null), 3500);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    onNavigate('project-details', { projectId: project.id });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs mb-1">
            <FolderKanban className="w-4 h-4" />
            <span>QA Portfolio Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            QA Projects
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage software projects, track codebases, and review testing effort allocations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold ${
                viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold ${
                viewMode === 'table' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onOpenNewProject}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects by name, type, or description..."
            className="w-full text-xs pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="All">All Types</option>
            <option value="Web Application">Web Application</option>
            <option value="Mobile Application">Mobile Application</option>
            <option value="Full Stack Application">Full Stack Application</option>
            <option value="API">API</option>
            <option value="Enterprise Application">Enterprise Application</option>
          </select>

          <select
            value={complexityFilter}
            onChange={(e) => setComplexityFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="All">All Complexity</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="In Review">In Review</option>
            <option value="Planning">Planning</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Grid or Table Display */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center">
          <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">No QA Projects Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or create a new software testing project.
          </p>
          <button
            onClick={onOpenNewProject}
            className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-xs"
          >
            + Create New Project
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((p) => (
            <div
              key={p.id}
              onClick={() => handleSelectProject(p)}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      p.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : p.status === 'In Review'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : p.status === 'Completed'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {p.status}
                  </span>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      p.complexity === 'High'
                        ? 'bg-amber-50 text-amber-800'
                        : p.complexity === 'Low'
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'bg-blue-50 text-blue-800'
                    }`}
                  >
                    {p.complexity} Complexity
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors line-clamp-1">
                  {p.name}
                </h3>
                <p className="text-xs text-slate-400 font-medium mb-3">{p.type}</p>

                {p.description && (
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                    {p.description}
                  </p>
                )}

                {/* Sizing Matrix Grid */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50/80 rounded-xl text-center text-xs mb-4">
                  <div>
                    <span className="text-[10px] text-slate-600 block uppercase font-bold">LOC</span>
                    <span className="font-mono font-bold text-slate-800">{p.loc?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-600 block uppercase font-bold">Test Cases</span>
                    <span className="font-mono font-bold text-slate-800">{p.testCases}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-600 block uppercase font-bold">Coverage</span>
                    <span className="font-mono font-bold text-blue-600">{p.coverage}%</span>
                  </div>
                </div>
              </div>

              {/* Bottom stats & action footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Estimated Effort</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-extrabold text-blue-700">{p.estimatedHours}</span>
                    <span className="text-xs text-slate-500 font-semibold">hrs ({p.personDays}d)</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleDuplicate(p.id, e)}
                    title="Duplicate Project"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProject(p);
                      onNavigate('reports', { projectId: p.id });
                    }}
                    title="Generate Report"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    <FileBarChart2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(p.id, p.name, e)}
                    title="Delete Project"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px] font-bold bg-slate-50/50">
                  <th className="py-3 px-4">Project Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">LOC</th>
                  <th className="py-3 px-4">Test Cases</th>
                  <th className="py-3 px-4">Coverage</th>
                  <th className="py-3 px-4">Complexity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Estimated Effort</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredProjects.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => handleSelectProject(p)}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                    <td className="py-3 px-4 text-slate-500">{p.type}</td>
                    <td className="py-3 px-4 font-mono font-medium">{p.loc?.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono font-medium">{p.testCases}</td>
                    <td className="py-3 px-4 font-mono font-medium text-blue-600">{p.coverage}%</td>
                    <td className="py-3 px-4 font-semibold">{p.complexity}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-blue-700">
                      {p.estimatedHours} hrs
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleSelectProject(p)}
                          className="p-1 rounded text-slate-400 hover:text-blue-600"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDuplicate(p.id, e)}
                          className="p-1 rounded text-slate-400 hover:text-blue-600"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(p.id, p.name, e)}
                          className="p-1 rounded text-slate-400 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
