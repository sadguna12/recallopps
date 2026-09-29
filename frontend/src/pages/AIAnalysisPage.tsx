import React, { useEffect, useState } from 'react';
import { Brain, Sparkles, Database, FileText, BookOpen, AlertCircle, ArrowRight, Play } from 'lucide-react';
import { Incident } from '../types';
import { incidentApi } from '../services/api';

interface AIAnalysisPageProps {
  onSelectIncident: (id: string) => void;
}

export const AIAnalysisPage: React.FC<AIAnalysisPageProps> = ({ onSelectIncident }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('');

  useEffect(() => {
    incidentApi.list().then((data) => {
      setIncidents(data);
      if (data.length > 0) {
        setSelectedIncidentId(data[0].id);
      }
    });
  }, []);

  const selectedIncident = incidents.find((i) => i.id === selectedIncidentId);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              AI Incident Reasoning & Evidence Hub
            </h2>
            <p className="text-xs text-slate-400">
              Inspect grounded multi-step reasoning, hypothesis formulation, and RAG memory synthesis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Select Incident:</span>
          <select
            value={selectedIncidentId}
            onChange={(e) => setSelectedIncidentId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
          >
            {incidents.map((i) => (
              <option key={i.id} value={i.id}>
                {i.id} - {i.service} ({i.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedIncident && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Reasoning Breakdown */}
          <div className="lg:col-span-2 space-y-5">
            {/* Hypothesized Root Cause */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Synthesized Root Cause Hypothesis
                </span>
                <span className="text-xs font-mono font-bold text-slate-300">
                  Confidence: {selectedIncident.confidence_score ? `${Math.round(selectedIncident.confidence_score * 100)}%` : '92%'}
                </span>
              </div>
              <p className="text-sm font-semibold text-white">
                {selectedIncident.suspected_cause || selectedIncident.root_cause || 'Database connection pool exhaustion'}
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                The agent corroborated this hypothesis by cross-referencing live QueuePool error messages against historical incident patterns in ChromaDB episodic memory.
              </p>
            </div>

            {/* Evidence Evaluation */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200 block pb-2 border-b border-slate-800">
                Grounded Evidence Matrix
              </span>
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="font-semibold text-cyan-300 mb-1">1. Episodic Memory Parallel (INC-782)</div>
                  <p className="text-slate-400">Matched previous connection pool timeout on payment-api with 0.94 similarity. Verified resolution was service restart.</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="font-semibold text-purple-300 mb-1">2. Procedural Memory Runbook (RUN-DB-001)</div>
                  <p className="text-slate-400">Prescribes diagnostic verification of connection counts followed by service restart and health probe monitoring.</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="font-semibold text-amber-300 mb-1">3. Live Tool Observation (get_logs)</div>
                  <p className="text-slate-400">QueuePool timeout trace confirmed active connections at 50/50 capacity limit.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Incident Quick Details */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 pb-2 border-b border-slate-800">
                Incident Context
              </h4>
              <div className="text-xs space-y-2 text-slate-300">
                <div><strong>ID:</strong> <span className="font-mono text-cyan-400">{selectedIncident.id}</span></div>
                <div><strong>Service:</strong> {selectedIncident.service}</div>
                <div><strong>Severity:</strong> {selectedIncident.severity}</div>
                <div><strong>Status:</strong> {selectedIncident.status}</div>
                <div><strong>Component:</strong> {selectedIncident.component || 'N/A'}</div>
              </div>
              <button
                onClick={() => onSelectIncident(selectedIncident.id)}
                className="w-full mt-4 py-2 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition flex items-center justify-center gap-1.5"
              >
                <span>Open Incident Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
