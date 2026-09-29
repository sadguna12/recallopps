import React, { useState } from 'react';
import { AgentAction } from '../../types';
import { ShieldAlert, CheckCircle2, XCircle, AlertTriangle, Play, HelpCircle } from 'lucide-react';

interface ApprovalCardProps {
  action: AgentAction;
  onApprove: (actionId: string, approvedBy: string) => Promise<void>;
  onReject: (actionId: string, reason: string) => Promise<void>;
  isProcessing?: boolean;
}

export const ApprovalCard: React.FC<ApprovalCardProps> = ({
  action,
  onApprove,
  onReject,
  isProcessing = false,
}) => {
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [engineerName, setEngineerName] = useState('Site Reliability Lead');

  const getRiskBadge = (level: string) => {
    switch (level.toUpperCase()) {
      case 'CRITICAL':
      case 'HIGH':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500/40 rounded-xl p-5 shadow-2xl relative overflow-hidden">
      {/* Top Banner */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Human-in-the-Loop Safety Gate: Remediation Approval Required
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Autonomous agent paused for engineer sign-off before executing risky tool
            </p>
          </div>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${getRiskBadge(action.risk_level)}`}>
          {action.risk_level} RISK
        </span>
      </div>

      {/* Action Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            AI Recommended Action
          </span>
          <h4 className="text-sm font-semibold text-cyan-300 flex items-center gap-2">
            <Play className="w-4 h-4 fill-current text-cyan-400" />
            {action.title}
          </h4>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            {action.description}
          </p>
          <div className="mt-2 text-[11px] font-mono text-slate-400">
            Target Service: <span className="text-white font-semibold">{action.target_service}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Grounded Reasoning & Evidence
          </span>
          <p className="text-xs text-slate-300 leading-relaxed">
            {action.reasoning || 'Corroborated by historical incident memory and diagnostic tool output.'}
          </p>
          {action.expected_effect && (
            <div className="mt-2 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
              <strong className="text-slate-300">Expected Effect:</strong> {action.expected_effect}
            </div>
          )}
        </div>
      </div>

      {/* Rejection Form Input */}
      {rejectMode ? (
        <div className="p-4 rounded-lg bg-rose-950/20 border border-rose-500/30 mb-4 space-y-3">
          <h5 className="text-xs font-bold text-rose-400">Specify Rejection Reason for Agent:</h5>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Explain why this remediation is unsuitable (e.g. maintenance window required, alternative root cause suspected)..."
            className="w-full h-20 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setRejectMode(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={() => onReject(action.id, rejectReason || 'Rejected by on-call engineer')}
              disabled={isProcessing}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition flex items-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              Confirm Rejection
            </button>
          </div>
        </div>
      ) : (
        /* Action Buttons */
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Sign-off as:</span>
            <input
              type="text"
              value={engineerName}
              onChange={(e) => setEngineerName(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-medium"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setRejectMode(true)}
              disabled={isProcessing}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>Reject Action</span>
            </button>

            <button
              onClick={() => onApprove(action.id, engineerName)}
              disabled={isProcessing}
              className="px-5 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 transition flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isProcessing ? 'Executing & Verifying...' : 'Approve & Execute Remediation'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
