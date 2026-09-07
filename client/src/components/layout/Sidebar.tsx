import React from 'react';
import {
  ShieldCheck,
  LayoutDashboard,
  Calculator,
  FolderKanban,
  CheckSquare,
  FileBarChart2,
  Users,
  History,
  Settings,
  UserCheck,
  LogOut,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  mobileOpen,
  setMobileOpen,
}) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'estimator', label: 'Estimator', icon: Calculator, badge: 'Formula' },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'test-management', label: 'Test Management', icon: CheckSquare },
    { id: 'reports', label: 'Reports', icon: FileBarChart2 },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'history', label: 'History', icon: History },
    { id: 'profile', label: 'Profile', icon: UserCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNav = (id: string) => {
    onNavigate(id);
    setMobileOpen(false);
  };

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 text-slate-700 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => handleNav('dashboard')}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 tracking-tight text-lg">QAEstimator</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">PRO</span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium">Software Testing Estimator</p>
          </div>
        </div>
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
          Main Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-blue-50 text-blue-600 border border-blue-100'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Mini Promo Card */}
      <div className="p-3 mx-3 mb-3 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-white rounded-xl border border-blue-100/80">
        <div className="flex items-center gap-2 text-blue-800 font-semibold text-xs mb-1">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Configurable Baseline</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
          Calculations use verified industry coefficients (8-12h/1k LOC).
        </p>
        <button
          onClick={() => handleNav('estimator')}
          className="w-full text-xs font-semibold py-1.5 px-2.5 rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-blue-50/60 shadow-xs transition-colors"
        >
          Open Calculator →
        </button>
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/60">
        <div
          className="flex items-center gap-2.5 cursor-pointer overflow-hidden"
          onClick={() => handleNav('profile')}
        >
          <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center font-bold text-blue-700 text-xs shrink-0 overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name?.slice(0, 2).toUpperCase() || 'RK'
            )}
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-slate-800 truncate">{user?.name || 'Ramesh Kumar'}</p>
            <p className="text-[11px] text-slate-600 truncate">{user?.role || 'QA Lead'}</p>
          </div>
        </div>
        <button
          onClick={logout}
          title="Logout"
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 h-screen sticky top-0 shrink-0 z-30">
        {content}
      </aside>

      {/* Mobile Drawer Backdrop & Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
