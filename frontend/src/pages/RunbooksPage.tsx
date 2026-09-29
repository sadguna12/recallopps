import React, { useEffect, useState } from 'react';
import { BookOpen, Search, Shield, Play, ArrowRight } from 'lucide-react';
import { Runbook } from '../types';
import { runbookApi } from '../services/api';

export const RunbooksPage: React.FC = () => {
  const [runbooks, setRunbooks] = useState<Runbook[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRunbook, setSelectedRunbook] = useState<Runbook | null>(null);

  useEffect(() => {
    runbookApi.list({ search: searchTerm || undefined }).then((data) => {
      setRunbooks(data);
      if (data.length > 0 && !selectedRunbook) {
        setSelectedRunbook(data[0]);
      }
    });
  }, [searchTerm]);

  const getRiskBadge = (level: string) => {
    switch (level.toUpperCase()) {
      case 'HIGH':
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              SRE Operational Runbook Library (Procedural Memory)
            </h2>
            <p className="text-xs text-slate-400">
              Standardized operational recovery procedures vectorized into ChromaDB for autonomous agent execution
            </p>
          </div>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search runbooks via vector RAG..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Runbook List */}
        <div className="lg:col-span-1 space-y-2 max-h-[700px] overflow-y-auto pr-1">
          {runbooks.map((rb) => {
            const isSelected = selectedRunbook?.runbook_id === rb.runbook_id;
            return (
              <div
                key={rb.runbook_id}
                onClick={() => setSelectedRunbook(rb)}
                className={`p-3.5 rounded-xl border transition cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-500 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold text-cyan-400">
                    {rb.runbook_id}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${getRiskBadge(rb.risk_level)}`}>
                    {rb.risk_level}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-slate-200 truncate">
                  {rb.title}
                </h4>
                <div className="text-[11px] text-slate-400 font-mono mt-1">
                  Service: {rb.service}
                </div>
              </div>
            );
          })}
        </div>

        {/* Runbook Detail Viewer */}
        <div className="lg:col-span-2">
          {selectedRunbook ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-5">
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                      {selectedRunbook.runbook_id}
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded font-mono font-bold border ${getRiskBadge(selectedRunbook.risk_level)}`}>
                      {selectedRunbook.risk_level} RISK
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">
                    {selectedRunbook.title}
                  </h3>
                  <div className="text-xs text-slate-400 font-mono mt-1">
                    Target Service: <strong className="text-slate-200">{selectedRunbook.service}</strong>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Procedure Description
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedRunbook.description}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Standard Operating Steps (Executed by Autonomous Agent)
                </h4>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 whitespace-pre-wrap leading-relaxed">
                  {selectedRunbook.steps}
                </pre>
              </div>

              {selectedRunbook.verification_steps && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Verification Protocol
                  </h4>
                  <p className="text-xs text-emerald-400 font-mono bg-emerald-950/20 p-3 rounded-lg border border-emerald-500/30">
                    {selectedRunbook.verification_steps}
                  </p>
                </div>
              )}

              {selectedRunbook.rollback_instructions && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Rollback & Fail-Safe Instructions
                  </h4>
                  <p className="text-xs text-rose-300 font-mono bg-rose-950/20 p-3 rounded-lg border border-rose-500/30">
                    {selectedRunbook.rollback_instructions}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-slate-500 text-center py-20 text-xs">
              Select a runbook from the library to inspect its operational procedure.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
