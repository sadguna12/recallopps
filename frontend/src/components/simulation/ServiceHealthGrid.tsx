import React from 'react';
import { ServiceItem } from '../../types';
import {
  Server, RefreshCw, Undo2, Terminal, AlertTriangle,
  CheckCircle2, Flame, Shield, Activity
} from 'lucide-react';

interface ServiceHealthGridProps {
  services: ServiceItem[];
  onRestart: (serviceName: string) => Promise<void>;
  onRollback: (serviceName: string) => Promise<void>;
  onViewLogs: (serviceName: string) => void;
  loadingService?: string | null;
}

export const ServiceHealthGrid: React.FC<ServiceHealthGridProps> = ({
  services,
  onRestart,
  onRollback,
  onViewLogs,
  loadingService,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'DEGRADED':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/40 animate-pulse';
      case 'DOWN':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-bounce';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {services.map((svc) => {
        const isDegraded = svc.status !== 'HEALTHY';
        const isLoading = loadingService === svc.name;

        return (
          <div
            key={svc.id}
            className={`p-4 rounded-xl border transition-all duration-200 ${
              isDegraded
                ? 'bg-slate-900 border-amber-500/40 shadow-lg shadow-amber-500/5'
                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
                  isDegraded ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-cyan-400 border-slate-700'
                }`}>
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-tight">
                    {svc.display_name}
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">
                    {svc.name} • {svc.current_version}
                  </span>
                </div>
              </div>

              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${getStatusBadge(svc.status)}`}>
                {svc.status}
              </span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 py-2.5 my-2 border-y border-slate-800/80 text-[11px] font-mono">
              <div>
                <span className="text-[9px] text-slate-400 block">ERROR RATE</span>
                <span className={`font-bold ${svc.error_rate > 1.0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {svc.error_rate.toFixed(2)}%
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block">LATENCY</span>
                <span className={`font-bold ${svc.latency_ms > 200 ? 'text-amber-300' : 'text-slate-200'}`}>
                  {svc.latency_ms.toFixed(0)}ms
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block">DB POOL</span>
                <span className={`font-bold ${(svc.active_connections / svc.max_connections) > 0.8 ? 'text-rose-400' : 'text-cyan-400'}`}>
                  {svc.active_connections}/{svc.max_connections}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between pt-1 gap-1.5">
              <button
                onClick={() => onViewLogs(svc.name)}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1"
                title="View recent service logs"
              >
                <Terminal className="w-3 h-3 text-cyan-400" />
                <span>Logs</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onRollback(svc.name)}
                  disabled={isLoading}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1"
                  title="Rollback to previous version"
                >
                  <Undo2 className="w-3 h-3 text-purple-400" />
                  <span>Rollback</span>
                </button>

                <button
                  onClick={() => onRestart(svc.name)}
                  disabled={isLoading}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 transition flex items-center gap-1"
                  title="Restart service container"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Restart</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
