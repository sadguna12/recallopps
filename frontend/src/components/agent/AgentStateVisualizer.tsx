import React from 'react';
import {
  Eye, Brain, Database, ListOrdered, Wrench, FileSearch,
  CheckCircle2, ShieldAlert, Play, Cpu, Sparkles, ArrowRight
} from 'lucide-react';

interface AgentStateVisualizerProps {
  currentStep?: string;
  status: string;
}

export const AgentStateVisualizer: React.FC<AgentStateVisualizerProps> = ({
  currentStep = 'OBSERVE',
  status,
}) => {
  const steps = [
    { id: 'OBSERVE', label: 'Observe', icon: Eye },
    { id: 'UNDERSTAND', label: 'Understand', icon: Brain },
    { id: 'RETRIEVE', label: 'Retrieve RAG', icon: Database },
    { id: 'PLAN', label: 'Plan', icon: ListOrdered },
    { id: 'TOOL_CALL', label: 'Tools', icon: Wrench },
    { id: 'REASON', label: 'Reason', icon: FileSearch },
    { id: 'APPROVAL_REQUEST', label: 'Approval Gate', icon: ShieldAlert },
    { id: 'EXECUTE', label: 'Execute', icon: Play },
    { id: 'VERIFY', label: 'Verify', icon: Cpu },
    { id: 'LEARN', label: 'Learn & Memory', icon: Sparkles },
    { id: 'RESOLVED', label: 'Resolved', icon: CheckCircle2 },
  ];

  // Helper to determine step status
  const getStepStatus = (stepId: string) => {
    if (status === 'RESOLVED') return 'completed';
    if (stepId === currentStep || (status === 'PENDING_APPROVAL' && stepId === 'APPROVAL_REQUEST')) {
      return 'active';
    }
    return 'pending';
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Autonomous Agent State Machine Flow
          </h3>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">
          Current: {status}
        </span>
      </div>

      {/* Horizontal Step Sequence */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto py-2 scrollbar-none">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const stepStatus = getStepStatus(step.id);
          const isLast = idx === steps.length - 1;

          let badgeStyle = 'bg-slate-800/80 text-slate-500 border-slate-700/50';
          let iconStyle = 'text-slate-500';

          if (stepStatus === 'completed') {
            badgeStyle = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-sm shadow-emerald-500/10';
            iconStyle = 'text-emerald-400';
          } else if (stepStatus === 'active') {
            badgeStyle = 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-md shadow-cyan-500/20 animate-pulse';
            iconStyle = 'text-cyan-300';
          }

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center flex-shrink-0 min-w-[72px]">
                <div className={`w-9 h-9 rounded-lg border flex items-center justify-center mb-1.5 transition-all duration-200 ${badgeStyle}`}>
                  <Icon className={`w-4 h-4 ${iconStyle}`} />
                </div>
                <span className={`text-[10px] font-medium text-center ${stepStatus === 'active' ? 'text-cyan-300 font-bold' : stepStatus === 'completed' ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {step.label}
                </span>
              </div>

              {!isLast && (
                <ArrowRight className={`w-3.5 h-3.5 flex-shrink-0 mx-0.5 ${stepStatus === 'completed' ? 'text-emerald-500/60' : 'text-slate-700'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
