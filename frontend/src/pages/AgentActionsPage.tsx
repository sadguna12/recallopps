import React, { useEffect, useState } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, Clock, Play, UserCheck } from 'lucide-react';
import { AgentAction } from '../types';
import { actionApi } from '../services/api';

export const AgentActionsPage: React.FC = () => {
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    actionApi.list().then(setActions);
  }, []);

  const filtered = actions.filter((a) => filterStatus === 'ALL' || a.status === filterStatus);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'PENDING_APPROVAL':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse';
      case 'REJECTED':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default:
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Agent Actions & Human Approvals Audit Log
            </h2>
            <p className="text-xs text-slate-400">
              Complete historical record of automated diagnostic tool calls and human-approved remediation executions
            </p>
          </div>
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
        >
          <option value="ALL">All Actions</option>
          <option value="PENDING_APPROVAL">Pending Approval</option>
          <option value="COMPLETED">Completed</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map((act) => (
          <div
            key={act.id}
            className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-cyan-400">
                    {act.id}
                  </span>
                  <span className="font-mono text-xs text-slate-400">
                    Incident: {act.incident_id}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${getStatusBadge(act.status)}`}>
                    {act.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white">
                  {act.title}
                </h3>
              </div>

              <div className="text-[11px] font-mono text-slate-400">
                {new Date(act.created_at).toLocaleString()}
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {act.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div>
                <strong className="text-slate-400 block text-[10px] uppercase">Reasoning:</strong>
                <span className="text-slate-200">{act.reasoning || 'Diagnostic evidence matched standard recovery protocol.'}</span>
              </div>
              <div>
                <strong className="text-slate-400 block text-[10px] uppercase">Sign-Off:</strong>
                <span className="text-emerald-400 font-medium">
                  {act.approved_by ? `Approved by ${act.approved_by}` : 'Awaiting Engineer Sign-Off'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
