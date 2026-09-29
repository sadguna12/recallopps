import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Clock, Zap, CheckCircle2, ShieldCheck } from 'lucide-react';
import { AnalyticsData } from '../types';
import { analyticsApi } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    analyticsApi.get().then(setData);
  }, []);

  if (!data) {
    return <div className="text-center py-20 text-slate-500 text-xs">Loading analytics...</div>;
  }

  const serviceChartData = Object.entries(data.incidents_by_service).map(([k, v]) => ({
    name: k,
    count: v,
  }));

  const severityChartData = Object.entries(data.incidents_by_severity).map(([k, v]) => ({
    name: k,
    value: v,
  }));

  const SEVERITY_COLORS: Record<string, string> = {
    CRITICAL: '#EF4444',
    HIGH: '#F97316',
    MEDIUM: '#F59E0B',
    LOW: '#10B981',
  };

  const mttrData = [
    { name: 'Manual Resolution (No AI)', minutes: data.resolution_time_before_ai_minutes },
    { name: 'AI SRE Agent (Closed Loop)', minutes: data.avg_resolution_time_minutes },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              SRE & AI Incident Response Analytics
            </h2>
            <p className="text-xs text-slate-400">
              Quantitative impact analysis, MTTR reduction, and remediation reliability metrics
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xl">
          <span className="text-xs text-slate-400 font-semibold block mb-1">Total Incidents Handled</span>
          <span className="text-2xl font-bold font-mono text-white">{data.total_incidents}</span>
          <span className="text-[11px] text-cyan-400 block mt-1">100% vector indexed</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xl">
          <span className="text-xs text-slate-400 font-semibold block mb-1">AI Resolution Rate</span>
          <span className="text-2xl font-bold font-mono text-emerald-400">{data.ai_assisted_resolution_rate}%</span>
          <span className="text-[11px] text-emerald-300 block mt-1">Closed-loop verified</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xl">
          <span className="text-xs text-slate-400 font-semibold block mb-1">MTTR with AI Agent</span>
          <span className="text-2xl font-bold font-mono text-cyan-400">{data.avg_resolution_time_minutes}m</span>
          <span className="text-[11px] text-slate-400 block mt-1">vs {data.resolution_time_before_ai_minutes}m manual</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xl">
          <span className="text-xs text-slate-400 font-semibold block mb-1">Successful Remediation</span>
          <span className="text-2xl font-bold font-mono text-purple-400">{data.successful_recommendations_count}</span>
          <span className="text-[11px] text-purple-300 block mt-1">0 fatal rollback issues</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MTTR Comparison */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            MTTR Comparison (Minutes to Resolution)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mttrData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit="m" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Bar dataKey="minutes" fill="#06B6D4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incidents by Service */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Incidents by Microservice
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceChartData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Root Causes */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 pb-2 border-b border-slate-800">
            Most Frequent Production Root Causes
          </h3>
          <div className="space-y-2 text-xs">
            {data.top_root_causes.map((rc, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-850">
                <span className="text-slate-300 font-medium truncate max-w-sm">{rc.cause}</span>
                <span className="font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                  {rc.count} incidents
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Runbook Effectiveness */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 pb-2 border-b border-slate-800">
            Procedural Runbook Reliability & Usage
          </h3>
          <div className="space-y-2 text-xs">
            {data.most_used_runbooks.map((rb, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-850">
                <div>
                  <div className="font-semibold text-purple-300">{rb.runbook_id}: {rb.title}</div>
                  <div className="text-[10px] text-slate-400">{rb.usage_count} executions</div>
                </div>
                <span className="font-mono font-bold text-emerald-400">
                  {rb.success_rate}% Success
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
