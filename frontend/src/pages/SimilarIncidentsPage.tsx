import React, { useEffect, useState } from 'react';
import { GitBranch, Search, ArrowRight, CheckCircle, Database } from 'lucide-react';
import { SimilarIncident, Incident } from '../types';
import { incidentApi } from '../services/api';

interface SimilarIncidentsPageProps {
  onSelectIncident: (id: string) => void;
}

export const SimilarIncidentsPage: React.FC<SimilarIncidentsPageProps> = ({
  onSelectIncident,
}) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('');
  const [similarIncidents, setSimilarIncidents] = useState<SimilarIncident[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    incidentApi.list().then((data) => {
      setIncidents(data);
      if (data.length > 0) {
        setSelectedIncidentId(data[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedIncidentId) {
      setIsLoading(true);
      incidentApi.getSimilar(selectedIncidentId, 6).then((results) => {
        setSimilarIncidents(results);
        setIsLoading(false);
      });
    }
  }, [selectedIncidentId]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Semantic Incident Similarity Explorer
            </h2>
            <p className="text-xs text-slate-400">
              ChromaDB vector embedding distance and historical incident matching for root cause cross-correlation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Query Incident:</span>
          <select
            value={selectedIncidentId}
            onChange={(e) => setSelectedIncidentId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
          >
            {incidents.map((i) => (
              <option key={i.id} value={i.id}>
                {i.id} - {i.service}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-3 text-center py-12 text-slate-500 text-xs">
            Querying ChromaDB vector space embeddings...
          </div>
        ) : similarIncidents.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-slate-500 text-xs">
            No similar historical incidents found.
          </div>
        ) : (
          similarIncidents.map((sim) => (
            <div
              key={sim.incident_id}
              onClick={() => onSelectIncident(sim.incident_id)}
              className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 transition cursor-pointer flex flex-col justify-between group shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-cyan-400">
                    {sim.incident_id}
                  </span>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Cosine Sim: {(sim.similarity_score * 100).toFixed(1)}%
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-200 group-hover:text-purple-300 transition mb-1">
                  {sim.title}
                </h4>

                <div className="text-[11px] text-slate-400 font-mono mb-2">
                  Service: {sim.service} • Severity: {sim.severity}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  <strong>Historical Cause:</strong> {sim.root_cause || 'Service degradation'}
                </p>

                <div className="p-2 rounded bg-slate-950 border border-slate-850 text-[11px] text-emerald-400 font-mono">
                  ✓ {sim.resolution_steps ? sim.resolution_steps.slice(0, 120) + '...' : 'Resolved successfully'}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>{sim.why_relevant}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition text-purple-400" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
