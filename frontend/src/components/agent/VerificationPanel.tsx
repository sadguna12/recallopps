import React from 'react';
import { CheckCircle2, AlertCircle, ArrowRight, Activity, Cpu, ShieldCheck } from 'lucide-react';

interface VerificationPanelProps {
  service: string;
  isResolved: boolean;
  errorRateBefore?: number;
  errorRateAfter?: number;
  latencyBefore?: number;
  latencyAfter?: number;
  verifiedAt?: string;
}

export const VerificationPanel: React.FC<VerificationPanelProps> = ({
  service,
  isResolved,
  errorRateBefore = 38.5,
  errorRateAfter = 0.05,
  latencyBefore = 3800,
  latencyAfter = 45,
  verifiedAt,
}) => {
  return (
    <div className={`p-4 rounded-xl border ${isResolved ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-amber-950/20 border-amber-500/40'}`}>
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
        <div className="flex items-center gap-2">
          {isResolved ? (
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Activity className="w-4 h-4" />
            </div>
          )}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Verification & Telemetry Normalization
            </h4>
            <p className="text-[11px] text-slate-400">
              Automated telemetry probes evaluating post-remediation health on <span className="text-slate-200 font-semibold">{service}</span>
            </p>
          </div>
        </div>

        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold font-mono border ${isResolved ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>
          {isResolved ? 'VERIFICATION PASSED' : 'PENDING VERIFICATION'}
        </span>
      </div>

      {/* Telemetry Before vs After Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Error Rate */}
        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            HTTP Error Rate
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-rose-400 line-through">
              {errorRateBefore.toFixed(1)}%
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-sm font-bold font-mono text-emerald-400">
              {isResolved ? `${errorRateAfter.toFixed(2)}%` : `${errorRateBefore.toFixed(1)}%`}
            </span>
          </div>
        </div>

        {/* Latency */}
        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            p99 Latency
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-rose-400 line-through">
              {latencyBefore.toFixed(0)}ms
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-sm font-bold font-mono text-emerald-400">
              {isResolved ? `${latencyAfter.toFixed(0)}ms` : `${latencyBefore.toFixed(0)}ms`}
            </span>
          </div>
        </div>

        {/* Service State */}
        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Cluster State
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-rose-400 line-through">
              DEGRADED
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-bold font-mono text-emerald-400">
              {isResolved ? 'HEALTHY' : 'DEGRADED'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
