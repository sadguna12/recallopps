import React, { useEffect, useState } from 'react';
import { FileText, Search, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import { Postmortem } from '../types';
import { postmortemApi } from '../services/api';

export const PostmortemsPage: React.FC = () => {
  const [postmortems, setPostmortems] = useState<Postmortem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPostmortem, setSelectedPostmortem] = useState<Postmortem | null>(null);

  useEffect(() => {
    postmortemApi.list({ search: searchTerm || undefined }).then((data) => {
      setPostmortems(data);
      if (data.length > 0 && !selectedPostmortem) {
        setSelectedPostmortem(data[0]);
      }
    });
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Blameless Postmortem Repository & Root Cause Knowledge
            </h2>
            <p className="text-xs text-slate-400">
              Historical failure postmortems and lessons learned embedded into ChromaDB RAG index
            </p>
          </div>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search postmortems via semantic RAG..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Postmortems List */}
        <div className="lg:col-span-1 space-y-2 max-h-[700px] overflow-y-auto pr-1">
          {postmortems.map((pm) => {
            const isSelected = selectedPostmortem?.postmortem_id === pm.postmortem_id;
            return (
              <div
                key={pm.postmortem_id}
                onClick={() => setSelectedPostmortem(pm)}
                className={`p-3.5 rounded-xl border transition cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 border-purple-500 shadow-md shadow-purple-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold text-purple-400">
                    {pm.postmortem_id}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {pm.service}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-slate-200 truncate">
                  {pm.title}
                </h4>
              </div>
            );
          })}
        </div>

        {/* Postmortem Viewer */}
        <div className="lg:col-span-2">
          {selectedPostmortem ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-5">
              <div className="pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-purple-400 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                    {selectedPostmortem.postmortem_id}
                  </span>
                  {selectedPostmortem.incident_id && (
                    <span className="font-mono text-xs text-slate-400">
                      Ref: {selectedPostmortem.incident_id}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-white">
                  {selectedPostmortem.title}
                </h3>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Incident Timeline
                </h4>
                <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-wrap">
                  {selectedPostmortem.timeline}
                </pre>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-1">
                  Identified Root Cause
                </h4>
                <p className="text-xs text-slate-300 bg-rose-950/20 p-3 rounded-lg border border-rose-500/30 leading-relaxed">
                  {selectedPostmortem.root_cause}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
                  Resolution Summary
                </h4>
                <p className="text-xs text-slate-300 bg-emerald-950/20 p-3 rounded-lg border border-emerald-500/30 leading-relaxed">
                  {selectedPostmortem.resolution}
                </p>
              </div>

              {selectedPostmortem.lessons_learned && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-1">
                    Key Lessons Learned
                  </h4>
                  <p className="text-xs text-slate-300 bg-purple-950/20 p-3 rounded-lg border border-purple-500/30 leading-relaxed">
                    {selectedPostmortem.lessons_learned}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-slate-500 text-center py-20 text-xs">
              Select a postmortem to inspect root cause findings.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
