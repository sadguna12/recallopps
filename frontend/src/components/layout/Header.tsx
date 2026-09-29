import React from 'react';
import { ShieldCheck, Cpu, RefreshCw, AlertCircle, Play } from 'lucide-react';
import { ServiceItem } from '../../types';

interface HeaderProps {
  services: ServiceItem[];
  onRefresh: () => void;
  onOpenFailureInjector: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  services,
  onRefresh,
  onOpenFailureInjector,
  isRefreshing = false,
}) => {
  const degradedCount = services.filter((s) => s.status !== 'HEALTHY').length;

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-200">Cluster Status:</span>
        </div>
        <div className="flex items-center gap-2">
          {degradedCount === 0 ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              All 5 Services Healthy
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-pulse">
              <AlertCircle className="w-3.5 h-3.5" />
              {degradedCount} Service(s) Degraded
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Simulation Failure Injector Trigger */}
        <button
          onClick={onOpenFailureInjector}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Inject Test Failure</span>
        </button>

        {/* Global Refresh */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 transition"
          title="Refresh cluster metrics"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
        </button>

        {/* User / Persona Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-mono text-xs font-bold">
            SRE
          </div>
          <div className="text-left">
            <p className="text-xs font-medium text-slate-200 leading-none">On-Call Engineer</p>
            <p className="text-[10px] text-slate-400 leading-tight">Tier-3 Escalation</p>
          </div>
        </div>
      </div>
    </header>
  );
};
