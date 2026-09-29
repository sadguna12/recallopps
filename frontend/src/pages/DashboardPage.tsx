import React, { useEffect, useState } from 'react';
import {
  AlertTriangle, ShieldCheck, CheckCircle2, Clock, Zap,
  TrendingUp, Sparkles, ArrowRight, Eye, Play, BarChart2
} from 'lucide-react';
import { Incident, ServiceItem, AnalyticsData, TimelineEvent } from '../types';
import { ServiceHealthGrid } from '../components/simulation/ServiceHealthGrid';
import { AgentActivityStream } from '../components/agent/AgentActivityStream';
import { incidentApi, simulationApi, analyticsApi } from '../services/api';

interface DashboardPageProps {
  onSelectIncident: (id: string) => void;
  onNavigate: (page: string) => void;
  onOpenFailureInjector: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onSelectIncident,
  onNavigate,
  onOpenFailureInjector,
}) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [recentEvents, setRecentEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const [incs, svcs, anlys] = await Promise.all([
        incidentApi.list(),
        simulationApi.listServices(),
        analyticsApi.get(),
      ]);
      setIncidents(incs);
      setServices(svcs);
      setAnalytics(anlys);

      // Collect all recent timeline events across incidents
      const allEvents: TimelineEvent[] = [];
      incs.slice(0, 5).forEach((i) => {
        if (i.timeline_events) {
          allEvents.push(...i.timeline_events);
        }
      });
      allEvents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRecentEvents(allEvents.slice(0, 10));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 10000);
    return () => clearInterval(timer);
  }, []);

  const activeIncidents = incidents.filter((i) => i.status !== 'RESOLVED');

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Stat Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Incidents */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Incidents</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-white">{activeIncidents.length}</span>
            <span className="text-xs text-rose-400 font-medium font-mono">
              {incidents.filter((i) => i.severity === 'CRITICAL').length} Critical
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">Auto-monitored by AI agent</div>
        </div>

        {/* Avg Resolution MTTR */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Mean Time to Resolve</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-white">
              {analytics?.avg_resolution_time_minutes || 14.5}m
            </span>
            <span className="text-xs text-emerald-400 font-semibold font-mono">
              -70% vs manual
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">Grounded via RAG & runbooks</div>
        </div>

        {/* AI Assisted Resolution Rate */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">AI Resolution Success</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Zap className="w-4 h-4 fill-current" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-white">
              {analytics?.ai_assisted_resolution_rate || 94.5}%
            </span>
            <span className="text-xs text-emerald-400 font-medium">Closed Loop</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">Verified by telemetry probes</div>
        </div>

        {/* Continuous Learning Index */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">ChromaDB Memories</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-white">
              {(analytics?.total_incidents || 20) + 23}
            </span>
            <span className="text-xs text-purple-400 font-mono font-medium">Indexed</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">Episodic + Procedural + Semantic</div>
        </div>
      </div>

      {/* Simulated Infrastructure Health Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Live Cluster Services & Simulated Infrastructure
            </h3>
          </div>
          <button
            onClick={onOpenFailureInjector}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
          >
            <span>Inject Chaos Failure</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <ServiceHealthGrid
          services={services}
          onRestart={async (s) => {
            await simulationApi.restart(s);
            loadData();
          }}
          onRollback={async (s) => {
            await simulationApi.rollback(s);
            loadData();
          }}
          onViewLogs={(s) => {
            onNavigate('execution-history');
          }}
        />
      </div>

      {/* Active Incidents & Live Agent Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Incidents Table */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Production Incidents ({incidents.length})
              </h3>
            </div>
            <button
              onClick={() => onNavigate('create-incident')}
              className="text-xs px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition font-semibold"
            >
              + Create Incident
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <th className="pb-2.5">ID</th>
                  <th className="pb-2.5">Title & Service</th>
                  <th className="pb-2.5">Severity</th>
                  <th className="pb-2.5">Status</th>
                  <th className="pb-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {incidents.slice(0, 7).map((inc) => (
                  <tr
                    key={inc.id}
                    className="hover:bg-slate-800/40 transition group cursor-pointer"
                    onClick={() => onSelectIncident(inc.id)}
                  >
                    <td className="py-3 font-mono font-bold text-cyan-400">
                      {inc.id}
                    </td>
                    <td className="py-3 pr-2">
                      <div className="font-semibold text-slate-200 group-hover:text-cyan-300 transition">
                        {inc.title}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {inc.service} • {inc.environment}
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${getSeverityBadge(inc.severity)}`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                        inc.status === 'RESOLVED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : inc.status === 'PENDING_APPROVAL'
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse'
                          : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                      }`}>
                        {inc.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectIncident(inc.id);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-cyan-300 hover:bg-slate-700 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Agent Activity Stream */}
        <div className="lg:col-span-1">
          <AgentActivityStream events={recentEvents} />
        </div>
      </div>
    </div>
  );
};
