import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  BarChart3,
  Users,
  AlertCircle,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notRegistered, setNotRegistered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      setNotRegistered(false);
      return;
    }
    if (!password) {
      setError('Please enter your password');
      setNotRegistered(false);
      return;
    }

    setLoading(true);
    setError(null);
    setNotRegistered(false);
    try {
      await login(email.trim(), password);
      onNavigate('dashboard');
    } catch (err: any) {
      const isNotReg = err.response?.data?.notRegistered;
      setNotRegistered(!!isNotReg);
      setError(
        err.response?.data?.error || 'Unable to sign in. Please verify your email and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#F8FAFC]">
      {/* Left side: Enterprise Brand Banner */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-12 text-white flex-col justify-between relative overflow-hidden">
        {/* Background decorative circles & grid */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        {/* Top brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xl">
            <ShieldCheck className="w-7 h-7 text-blue-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tight">QAEstimator</span>
              <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-blue-500/30 text-blue-200 border border-blue-400/20">PRO</span>
            </div>
            <p className="text-xs text-blue-200/80">Software Testing Resource Estimator</p>
          </div>
        </div>

        {/* Center Illustration & Value Proposition */}
        <div className="relative z-10 my-auto py-12 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>Plan Smarter. Test Better.</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-4 text-white">
            Precision QA resource estimation for software teams.
          </h1>

          <p className="text-base text-blue-100/80 leading-relaxed mb-8">
            Eliminate guesswork. Compute exact QA person-hours, test case execution capacity, and optimal team composition based on LOC, test suites, and target coverage.
          </p>

          {/* Feature Badges */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="flex items-center gap-2.5 text-white font-semibold text-sm mb-1">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <span>LOC & Case Modeling</span>
              </div>
              <p className="text-xs text-blue-200/70">
                Calibrated formulas mapped to 8-12h per 1,000 lines of verified code.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="flex items-center gap-2.5 text-white font-semibold text-sm mb-1">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Team Sizing Matrix</span>
              </div>
              <p className="text-xs text-blue-200/70">
                Automated recommendations for QA Leads, Manual Testers & SDETs.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom stats badge */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-blue-200/80">
          <span>Enterprise SaaS Quality Engineering</span>
          <span>Trusted by 500+ QA Teams</span>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-slate-900">QAEstimator Pro</span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Sign In</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Enter your registered account credentials to access your testing workspace.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs animate-in fade-in duration-150 shadow-xs">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{error}</p>
                  {notRegistered && (
                    <div className="mt-3 pt-2.5 border-t border-red-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs text-slate-600">Don't have an account yet?</span>
                      <button
                        type="button"
                        onClick={() => onNavigate('signup')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors shadow-xs"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Create Account Now</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@acmeqa.io"
                  className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span className="text-xs text-slate-600">Remember this device</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Create Account Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
            <p className="text-xs text-slate-600">
              Don't have an enterprise account?
            </p>
            <button
              type="button"
              onClick={() => onNavigate('signup')}
              className="w-full py-2 px-4 rounded-xl bg-white hover:bg-slate-100 text-blue-600 border border-slate-200 font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create an Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
