import React, { useState, useEffect } from 'react';
import {
  Settings,
  Calculator,
  Bell,
  Sun,
  Moon,
  Shield,
  Save,
  CheckCircle2,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import { settingsApi } from '../services/api';
import { SystemSettings } from '../types';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'estimation' | 'notifications' | 'theme' | 'security'>('estimation');

  // Estimation Constants
  const [locRate, setLocRate] = useState<number>(6.4);
  const [testCaseRate, setTestCaseRate] = useState<number>(0.1242);
  const [baselineCoverage, setBaselineCoverage] = useState<number>(70.0);
  const [lowMultiplier, setLowMultiplier] = useState<number>(0.85);
  const [medMultiplier, setMedMultiplier] = useState<number>(1.00);
  const [highMultiplier, setHighMultiplier] = useState<number>(1.25);
  const [env1Multiplier, setEnv1Multiplier] = useState<number>(1.00);
  const [env2Multiplier, setEnv2Multiplier] = useState<number>(1.10);
  const [env3Multiplier, setEnv3Multiplier] = useState<number>(1.20);
  const [workingHoursPerDay, setWorkingHoursPerDay] = useState<number>(8.0);

  // Notification Preferences
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [thresholdAlerts, setThresholdAlerts] = useState(true);
  const [sprintReminders, setSprintReminders] = useState(false);

  // Theme
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>('light');

  // Security
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await settingsApi.get();
        if (data) {
          setLocRate(data.locRate);
          setTestCaseRate(data.testCaseRate);
          setBaselineCoverage(data.baselineCoverage);
          setLowMultiplier(data.lowMultiplier);
          setMedMultiplier(data.medMultiplier);
          setHighMultiplier(data.highMultiplier);
          setEnv1Multiplier(data.env1Multiplier);
          setEnv2Multiplier(data.env2Multiplier);
          setEnv3Multiplier(data.env3Multiplier);
          setWorkingHoursPerDay(data.workingHoursPerDay);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchSettings();
  }, []);

  const handleSaveEstimationSettings = async () => {
    setLoading(true);
    try {
      await settingsApi.update({
        locRate: Number(locRate),
        testCaseRate: Number(testCaseRate),
        baselineCoverage: Number(baselineCoverage),
        lowMultiplier: Number(lowMultiplier),
        medMultiplier: Number(medMultiplier),
        highMultiplier: Number(highMultiplier),
        env1Multiplier: Number(env1Multiplier),
        env2Multiplier: Number(env2Multiplier),
        env3Multiplier: Number(env3Multiplier),
        workingHoursPerDay: Number(workingHoursPerDay),
      });
      setNotice('Estimation constants and multipliers updated successfully!');
      setTimeout(() => setNotice(null), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetDefaults = () => {
    setLocRate(6.4);
    setTestCaseRate(0.1242);
    setBaselineCoverage(70.0);
    setLowMultiplier(0.85);
    setMedMultiplier(1.00);
    setHighMultiplier(1.25);
    setEnv1Multiplier(1.00);
    setEnv2Multiplier(1.10);
    setEnv3Multiplier(1.20);
    setWorkingHoursPerDay(8.0);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs mb-1">
            <Settings className="w-4 h-4" />
            <span>Platform Configuration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            System Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure global estimation algorithms, multipliers, notifications, and security.
          </p>
        </div>

        {activeTab === 'estimation' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Defaults</span>
            </button>
            <button
              onClick={handleSaveEstimationSettings}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Saving...' : 'Save Settings'}</span>
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

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('estimation')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'estimation'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Estimation Multipliers</span>
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'notifications'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notifications</span>
        </button>
        <button
          onClick={() => setActiveTab('theme')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'theme'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sun className="w-4 h-4" />
          <span>Theme & Appearance</span>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'security'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Security & 2FA</span>
        </button>
      </div>

      {/* Tab 1: Estimation Settings */}
      {activeTab === 'estimation' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Mathematical Formula Constants</h2>
            <p className="text-xs text-slate-600 mt-0.5">
              These rates govern the backend calculation formula applied across all projects.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LOC Rate */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                LOC Testing Rate (Hours per 1,000 LOC)
              </label>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Calibration rate for codebase comprehension and unit test development. Default: 6.4 to 12.0.
              </p>
              <input
                type="number"
                step="0.1"
                min="1"
                value={locRate}
                onChange={(e) => setLocRate(Number(e.target.value))}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 font-mono font-bold text-blue-700"
              />
            </div>

            {/* Test Case Rate */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Test Case Execution Rate (Hours per Test Case)
              </label>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Time required to execute, verify assertions, and document defect tickets. Default: ~0.1242h.
              </p>
              <input
                type="number"
                step="0.001"
                min="0.01"
                value={testCaseRate}
                onChange={(e) => setTestCaseRate(Number(e.target.value))}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 font-mono font-bold text-indigo-700"
              />
            </div>

            {/* Baseline Coverage */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Baseline Coverage (%)
              </label>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Standard baseline percentage at 1.00x multiplier. Default is 70%.
              </p>
              <input
                type="number"
                min="10"
                max="100"
                value={baselineCoverage}
                onChange={(e) => setBaselineCoverage(Number(e.target.value))}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 font-mono font-bold text-slate-800"
              />
            </div>

            {/* Working Hours */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Working Hours per Business Day
              </label>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Billable engineering hours per specialist per working day (used to compute Person-Days). Default: 8.0.
              </p>
              <input
                type="number"
                min="1"
                max="24"
                value={workingHoursPerDay}
                onChange={(e) => setWorkingHoursPerDay(Number(e.target.value))}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 font-mono font-bold text-slate-800"
              />
            </div>
          </div>

          {/* Multipliers Matrix */}
          <div>
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">
              Complexity Multipliers
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-600 block mb-1">Low Complexity</span>
                <input
                  type="number"
                  step="0.05"
                  value={lowMultiplier}
                  onChange={(e) => setLowMultiplier(Number(e.target.value))}
                  className="w-full text-xs p-2 rounded-lg bg-white border border-slate-200 font-mono"
                />
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-600 block mb-1">Medium Complexity (Base)</span>
                <input
                  type="number"
                  step="0.05"
                  value={medMultiplier}
                  onChange={(e) => setMedMultiplier(Number(e.target.value))}
                  className="w-full text-xs p-2 rounded-lg bg-white border border-slate-200 font-mono"
                />
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-600 block mb-1">High Complexity</span>
                <input
                  type="number"
                  step="0.05"
                  value={highMultiplier}
                  onChange={(e) => setHighMultiplier(Number(e.target.value))}
                  className="w-full text-xs p-2 rounded-lg bg-white border border-slate-200 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Environment Multipliers */}
          <div>
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">
              Environment Multipliers
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-600 block mb-1">1 Environment</span>
                <input
                  type="number"
                  step="0.05"
                  value={env1Multiplier}
                  onChange={(e) => setEnv1Multiplier(Number(e.target.value))}
                  className="w-full text-xs p-2 rounded-lg bg-white border border-slate-200 font-mono"
                />
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-600 block mb-1">2 Environments</span>
                <input
                  type="number"
                  step="0.05"
                  value={env2Multiplier}
                  onChange={(e) => setEnv2Multiplier(Number(e.target.value))}
                  className="w-full text-xs p-2 rounded-lg bg-white border border-slate-200 font-mono"
                />
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-600 block mb-1">3+ Environments</span>
                <input
                  type="number"
                  step="0.05"
                  value={env3Multiplier}
                  onChange={(e) => setEnv3Multiplier(Number(e.target.value))}
                  className="w-full text-xs p-2 rounded-lg bg-white border border-slate-200 font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Notifications */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h2 className="font-bold text-slate-900 text-base mb-1">Notification Preferences</h2>
          <p className="text-xs text-slate-600 mb-4">Choose how you receive estimation threshold and test alerts.</p>

          <div className="space-y-3 divide-y divide-slate-100">
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="font-semibold text-xs text-slate-800">Email Alerts on Recalculation</p>
                <p className="text-[11px] text-slate-600">Send an executive summary when a project estimate exceeds 200 hours.</p>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="font-semibold text-xs text-slate-800">Coverage Threshold Notifications</p>
                <p className="text-[11px] text-slate-600">Alert if target branch coverage drops below baseline 70%.</p>
              </div>
              <input
                type="checkbox"
                checked={thresholdAlerts}
                onChange={(e) => setThresholdAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="font-semibold text-xs text-slate-800">Sprint Milestone Reminders</p>
                <p className="text-[11px] text-slate-600">Daily slack/email digest for team capacity bottlenecks.</p>
              </div>
              <input
                type="checkbox"
                checked={sprintReminders}
                onChange={(e) => setSprintReminders(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Theme */}
      {activeTab === 'theme' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h2 className="font-bold text-slate-900 text-base">Interface Appearance</h2>
          <p className="text-xs text-slate-600">Tailor the visual design of your QA workspace.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div
              onClick={() => setSelectedTheme('light')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedTheme === 'light' ? 'border-blue-600 bg-blue-50/40 shadow-sm' : 'border-slate-200 bg-white'
              }`}
            >
              <Sun className="w-5 h-5 text-amber-500 mb-2" />
              <p className="font-bold text-slate-900 text-xs">Light Blue & White (Default)</p>
              <p className="text-[11px] text-slate-600 mt-1">High-clarity enterprise blue SaaS palette.</p>
            </div>

            <div
              onClick={() => setSelectedTheme('dark')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedTheme === 'dark' ? 'border-blue-600 bg-blue-50/40 shadow-sm' : 'border-slate-200 bg-white'
              }`}
            >
              <Moon className="w-5 h-5 text-indigo-600 mb-2" />
              <p className="font-bold text-slate-900 text-xs">Dark Mode</p>
              <p className="text-[11px] text-slate-600 mt-1">Deep navy background for night shifts.</p>
            </div>

            <div
              onClick={() => setSelectedTheme('system')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedTheme === 'system' ? 'border-blue-600 bg-blue-50/40 shadow-sm' : 'border-slate-200 bg-white'
              }`}
            >
              <Settings className="w-5 h-5 text-slate-500 mb-2" />
              <p className="font-bold text-slate-900 text-xs">System Synchronized</p>
              <p className="text-[11px] text-slate-600 mt-1">Matches your operating system settings.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Security */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h2 className="font-bold text-slate-900 text-base">Account Security & Access</h2>
          <p className="text-xs text-slate-600">Enterprise session tokens and multi-factor authentication.</p>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <p className="font-bold text-xs text-slate-800">Two-Factor Authentication (2FA)</p>
              <p className="text-[11px] text-slate-600">Require an authenticator code when signing into QAEstimator Pro.</p>
            </div>
            <button
              onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                twoFactorEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
