import React from 'react';
import { X, Calculator, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface FormulaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FormulaModal: React.FC<FormulaModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/70 to-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">QA Resource Estimation Formula</h3>
              <p className="text-xs text-slate-600">Enterprise Mathematical Specification & Constants</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[75vh] space-y-5 text-xs text-slate-600 leading-relaxed">
          {/* Main Formula Card */}
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
            <p className="text-[11px] font-bold text-blue-800 uppercase tracking-wider mb-2">
              Primary Person-Hours Formula
            </p>
            <div className="p-3 bg-white rounded-lg border border-blue-100 text-slate-800 font-mono text-xs sm:text-sm font-semibold tracking-wide overflow-x-auto">
              QA Person Hours = (LOC Effort + Test Case Effort) × Coverage Multiplier × Complexity Multiplier × Environment Multiplier
            </div>
          </div>

          {/* Component Breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-xs mb-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>1. LOC Effort</span>
              </div>
              <p className="font-mono text-[11px] bg-white p-2 rounded border border-slate-200 mb-1 text-slate-700">
                (LOC / 1,000) × LOC_RATE
              </p>
              <p className="text-[11px] text-slate-600">
                Industry standard factor: 6.4 to 12.0 hours per 1,000 verified lines of code.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-xs mb-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>2. Test Case Effort</span>
              </div>
              <p className="font-mono text-[11px] bg-white p-2 rounded border border-slate-200 mb-1 text-slate-700">
                TestCases × TEST_CASE_RATE
              </p>
              <p className="text-[11px] text-slate-600">
                Standard baseline rate: ~0.1242 to 0.20 hours per test case execution & logging.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-xs mb-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>3. Coverage Multiplier</span>
              </div>
              <p className="font-mono text-[11px] bg-white p-2 rounded border border-slate-200 mb-1 text-slate-700">
                1 + ((Coverage - 70) / 100)
              </p>
              <p className="text-[11px] text-slate-600">
                For 85% coverage: 1 + (15/100) = 1.15x multiplier over baseline 70%.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-xs mb-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>4. Complexity & Environments</span>
              </div>
              <p className="font-mono text-[11px] bg-white p-2 rounded border border-slate-200 mb-1 text-slate-700">
                Low: 0.85x | Med: 1.00x | High: 1.25x
              </p>
              <p className="text-[11px] text-slate-600">
                Environments: 1 env: 1.00x, 2 envs: 1.10x, 3+ envs: 1.20x.
              </p>
            </div>
          </div>

          {/* Verification Example */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="font-bold text-slate-800 text-xs mb-1.5">Demo Project Calibration:</h4>
            <div className="space-y-1 font-mono text-[11px] text-slate-600">
              <p>• LOC: 12,500 → (12.5 × 6.4) = 80.0 hrs</p>
              <p>• Test Cases: 420 → (420 × 0.1242) = 52.17 hrs</p>
              <p>• Sum = 132.17 hrs × 1.15 (85% cov) × 1.00 (Med) × 1.00 (1 Env) = <span className="text-blue-700 font-bold font-sans">152 person-hours</span> (19 days)</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-600">
            Parameters can be customized under Settings.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors"
          >
            Close Formula Guide
          </button>
        </div>
      </div>
    </div>
  );
};
