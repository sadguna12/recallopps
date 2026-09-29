import React from 'react';
import {
  LayoutDashboard, AlertTriangle, PlusCircle, Activity, Brain,
  GitBranch, BookOpen, FileText, Database, ShieldAlert,
  Terminal, BarChart3, Settings, Zap
} from 'lucide-react';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  activeIncidentsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  setActivePage,
  activeIncidentsCount,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create-incident', label: 'Create Incident', icon: PlusCircle, highlight: true },
    { id: 'active-incidents', label: 'Active Incidents', icon: AlertTriangle, badge: activeIncidentsCount },
    { id: 'ai-analysis', label: 'AI Analysis Hub', icon: Brain },
    { id: 'similar-incidents', label: 'Similar Incidents', icon: GitBranch },
    { id: 'runbooks', label: 'Runbook Library', icon: BookOpen },
    { id: 'postmortems', label: 'Postmortems', icon: FileText },
    { id: 'memory-explorer', label: 'Memory Explorer', icon: Database },
    { id: 'agent-actions', label: 'Agent Actions', icon: ShieldAlert },
    { id: 'execution-history', label: 'Execution History', icon: Terminal },
    { id: 'analytics', label: 'SRE Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col h-screen sticky top-0 backdrop-blur select-none z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
          <Zap className="w-5 h-5 fill-current" />
        </div>
        <div>
          <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
            RecallOpps <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono font-medium border border-cyan-500/20">AI SRE</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">Autonomous Incident Agent</p>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Operations & Agent
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                  : item.highlight
                  ? 'text-cyan-300 hover:bg-slate-800/60 hover:text-white'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Status Widget */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-300 font-medium">ChromaDB Vector</span>
          </div>
          <span className="text-[11px] font-mono text-cyan-400 font-semibold">Active</span>
        </div>
      </div>
    </aside>
  );
};
