import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  Clock,
  Briefcase,
  Mail,
  Phone,
  Trash2,
  Edit,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { teamApi } from '../services/api';
import { TeamMember } from '../types';
import { AddTeamMemberModal } from '../components/modals/AddTeamMemberModal';

export const TeamPage: React.FC = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState({
    totalMembers: 0,
    avgCapacity: 0,
    availableCount: 0,
    busyCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [notice, setNotice] = useState<string | null>(null);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const data = await teamApi.list();
      setMembers(data.members);
      setStats(data.stats);
    } catch (err) {
      console.error('Failed to load team', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Remove ${name} from QA team roster?`)) {
      try {
        await teamApi.delete(id);
        fetchTeam();
        setNotice(`Removed ${name}`);
        setTimeout(() => setNotice(null), 3000);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleUpdateAvailability = async (id: string, newAvailability: string) => {
    try {
      await teamApi.update(id, { availability: newAvailability });
      fetchTeam();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      (m.assignedProjects && m.assignedProjects.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = roleFilter === 'All' || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const chartData = members.map((m) => ({
    name: m.name.split(' ')[0],
    fullName: m.name,
    capacity: m.capacity,
    role: m.role,
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs mb-1">
            <Users className="w-4 h-4" />
            <span>Resource Capacity & Staffing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            QA Team Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage test engineers, track sprint capacity, and balance workload allocations.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Specialist</span>
        </button>
      </div>

      {notice && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total QA Specialists
          </span>
          <span className="text-3xl font-extrabold text-slate-900">{stats.totalMembers}</span>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">Active testing roster</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Average Utilization
          </span>
          <span className="text-3xl font-extrabold text-blue-700">{stats.avgCapacity}%</span>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">Across active projects</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Available Engineers
          </span>
          <span className="text-3xl font-extrabold text-emerald-600">{stats.availableCount}</span>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">Ready for new projects</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Fully Committed (Busy)
          </span>
          <span className="text-3xl font-extrabold text-amber-600">{stats.busyCount}</span>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">At 90%+ capacity</p>
        </div>
      </div>

      {/* Team Utilization Chart */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Team Utilization & Capacity Matrix</h2>
            <p className="text-xs text-slate-600">Committed workload percentage per specialist</p>
          </div>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
            Target: 80–90% Optimal
          </span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} unit="%" domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }}
                formatter={(val: any, _name: any, item: any) => [`${val}% capacity (${item.payload.role})`, item.payload.fullName]}
              />
              <Bar dataKey="capacity" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.capacity >= 95 ? '#F59E0B' : entry.capacity >= 80 ? '#2563EB' : '#10B981'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team member by name, role, or project..."
              className="w-full text-xs pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="All">All Roles</option>
              <option value="QA Lead">QA Lead</option>
              <option value="QA Engineer">QA Engineer</option>
              <option value="Automation Engineer">Automation Engineer</option>
              <option value="Manual Tester">Manual Tester</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px] font-bold bg-slate-50/50">
                <th className="py-3 px-4">Specialist</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Experience</th>
                <th className="py-3 px-4">Assigned Projects</th>
                <th className="py-3 px-4">Availability</th>
                <th className="py-3 px-4">Capacity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredMembers.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 text-blue-700 font-bold flex items-center justify-center text-xs overflow-hidden">
                        {m.avatar ? (
                          <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                        ) : (
                          m.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{m.name}</p>
                        <p className="text-[11px] text-slate-600">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{m.role}</td>
                  <td className="py-3 px-4 text-slate-600">{m.experience}</td>
                  <td className="py-3 px-4 max-w-xs text-slate-600 font-medium">
                    {m.assignedProjects || 'None currently assigned'}
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={m.availability}
                      onChange={(e) => handleUpdateAvailability(m.id, e.target.value)}
                      className={`text-xs font-semibold px-2 py-0.5 rounded-md border focus:outline-none ${
                        m.availability === 'Available'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : m.availability === 'Busy'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <option value="Available">Available</option>
                      <option value="Busy">Busy</option>
                      <option value="On Leave">On Leave</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            m.capacity >= 95 ? 'bg-amber-500' : m.capacity >= 80 ? 'bg-blue-600' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${m.capacity}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-slate-800 text-[11px]">{m.capacity}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDelete(m.id, m.name)}
                      className="p-1 rounded text-slate-400 hover:text-red-600"
                      title="Remove Specialist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AddTeamMemberModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdded={fetchTeam}
      />
    </div>
  );
};
