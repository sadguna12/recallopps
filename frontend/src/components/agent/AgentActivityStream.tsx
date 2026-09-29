import React from 'react';
import { TimelineEvent } from '../../types';
import {
  Brain, Search, Database, Wrench, ShieldAlert,
  UserCheck, Play, CheckCircle2, Sparkles, Clock, AlertTriangle
} from 'lucide-react';

interface AgentActivityStreamProps {
  events: TimelineEvent[];
  isLoading?: boolean;
}

export const AgentActivityStream: React.FC<AgentActivityStreamProps> = ({
  events,
  isLoading = false,
}) => {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'OBSERVE':
      case 'UNDERSTAND':
      case 'REASON':
        return <Brain className="w-4 h-4 text-cyan-400" />;
      case 'RETRIEVE':
        return <Database className="w-4 h-4 text-purple-400" />;
      case 'TOOL_CALL':
      case 'TOOL_RESULT':
        return <Wrench className="w-4 h-4 text-amber-400" />;
      case 'APPROVAL_REQUEST':
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case 'APPROVED':
        return <UserCheck className="w-4 h-4 text-emerald-400" />;
      case 'EXECUTE':
        return <Play className="w-4 h-4 text-blue-400" />;
      case 'VERIFY':
      case 'RESOLVED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'LEARN':
        return <Sparkles className="w-4 h-4 text-pink-400" />;
      case 'VERIFY_FAILED':
      case 'REJECTED':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getEventBadgeClass = (type: string) => {
    switch (type) {
      case 'APPROVAL_REQUEST':
      case 'REJECTED':
      case 'VERIFY_FAILED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'RESOLVED':
      case 'APPROVED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'LEARN':
        return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      case 'RETRIEVE':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'TOOL_CALL':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Live Agent Activity Stream
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-500">
          {events.length} real events
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {events.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No agent events recorded yet. Trigger AI analysis to start the loop.
          </div>
        ) : (
          events.map((evt, idx) => (
            <div key={evt.id || idx} className="flex gap-3 text-left group">
              {/* Timeline Indicator */}
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${getEventBadgeClass(evt.event_type)}`}>
                  {getEventIcon(evt.event_type)}
                </div>
                {idx !== events.length - 1 && (
                  <div className="w-0.5 flex-1 bg-slate-800 my-1"></div>
                )}
              </div>

              {/* Event Content */}
              <div className="flex-1 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-semibold text-slate-200">
                    {evt.title}
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                    {evt.created_at ? new Date(evt.created_at).toLocaleTimeString() : ''}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {evt.description}
                </p>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-medium py-2 animate-pulse">
            <Brain className="w-4 h-4 animate-spin" />
            <span>Agent reasoning and investigating tools in progress...</span>
          </div>
        )}
      </div>
    </div>
  );
};
