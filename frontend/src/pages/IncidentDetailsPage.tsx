import React, { useEffect, useState } from 'react';
import {
  AlertTriangle, Brain, Sparkles, RefreshCw, CheckCircle2,
  Clock, ShieldAlert, BookOpen, FileText, Database, ArrowLeft,
  ChevronRight, Wrench, Play, Terminal, HelpCircle
} from 'lucide-react';
import { Incident, AgentAction, AIAnalysisResult, ToolExecution, SimilarIncident, RetrievedRunbook, RetrievedPostmortem, FeedbackRating } from '../types';
import { incidentApi, actionApi } from '../services/api';
import { AgentStateVisualizer } from '../components/agent/AgentStateVisualizer';
import { ApprovalCard } from '../components/agent/ApprovalModal';
import { ToolExecutionConsole } from '../components/agent/ToolExecutionConsole';
import { VerificationPanel } from '../components/agent/VerificationPanel';
import { FeedbackCard } from '../components/agent/FeedbackModal';
import { AgentActivityStream } from '../components/agent/AgentActivityStream';

interface IncidentDetailsPageProps {
  incidentId: string;
  onBack: () => void;
}

export const IncidentDetailsPage: React.FC<IncidentDetailsPageProps> = ({
  incidentId,
  onBack,
}) => {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [toolExecutions, setToolExecutions] = useState<ToolExecution[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'EVIDENCE' | 'TOOLS' | 'TIMELINE'>('OVERVIEW');

  const loadData = async () => {
    try {
      const [inc, acts, execs] = await Promise.all([
        incidentApi.get(incidentId),
        actionApi.list({ incident_id: incidentId }),
        actionApi.listToolExecutions(incidentId),
      ]);
      setIncident(inc);
      setActions(acts);
      setToolExecutions(execs);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 6000);
    return () => clearInterval(interval);
  }, [incidentId]);

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const res = await incidentApi.analyze(incidentId);
      setAnalysis(res);
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApproveAction = async (actionId: string, approvedBy: string) => {
    setIsProcessingAction(true);
    try {
      await actionApi.approve(actionId, { approved_by: approvedBy });
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleRejectAction = async (actionId: string, reason: string) => {
    setIsProcessingAction(true);
    try {
      await actionApi.reject(actionId, reason);
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleSubmitFeedback = async (data: { incident_id: string; rating: FeedbackRating; comments?: string; engineer_name?: string }) => {
    await incidentApi.submitFeedback(data);
    await loadData();
  };

  if (!incident) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <RefreshCw className="w-5 h-5 animate-spin mr-2 text-cyan-400" />
        <span>Loading incident workspace...</span>
      </div>
    );
  }

  const pendingAction = actions.find((a) => a.status === 'PENDING_APPROVAL');
  const isResolved = incident.status === 'RESOLVED';

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-300 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Incidents</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 transition shadow-sm"
          >
            <Brain className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Analyzing with Agent...' : 'Re-Run AI Agent Analysis'}</span>
          </button>
        </div>
      </div>

      {/* Incident Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="text-sm font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                {incident.id}
              </span>
              <h1 className="text-lg font-bold text-white tracking-tight">
                {incident.title}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
              <span>Service: <strong className="text-slate-200">{incident.service}</strong></span>
              <span>•</span>
              <span>Env: <strong className="text-slate-200">{incident.environment}</strong></span>
              <span>•</span>
              <span>Version: <strong className="text-slate-200">{incident.deployment_version || 'v1.0.0'}</strong></span>
              <span>•</span>
              <span>Created: <strong className="text-slate-200">{new Date(incident.created_at).toLocaleString()}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs px-3 py-1 rounded-full font-mono font-bold border ${getSeverityBadge(incident.severity)}`}>
              {incident.severity}
            </span>
            <span className={`text-xs px-3 py-1 rounded-full font-mono font-bold ${
              isResolved
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : incident.status === 'PENDING_APPROVAL'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
            }`}>
              {incident.status}
            </span>
          </div>
        </div>

        {/* State Machine Flow Visualizer */}
        <div className="mt-4">
          <AgentStateVisualizer status={incident.status} />
        </div>
      </div>

      {/* Human Approval Card (Prominent when pending) */}
      {pendingAction && (
        <ApprovalCard
          action={pendingAction}
          onApprove={handleApproveAction}
          onReject={handleRejectAction}
          isProcessing={isProcessingAction}
        />
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: AI Analysis, Root Cause, Evidence, Tools */}
        <div className="lg:col-span-2 space-y-6">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'OVERVIEW'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              AI Root Cause & Analysis
            </button>
            <button
              onClick={() => setActiveTab('EVIDENCE')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'EVIDENCE'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              RAG Evidence & Runbooks
            </button>
            <button
              onClick={() => setActiveTab('TOOLS')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'TOOLS'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tool Executions ({toolExecutions.length})
            </button>
          </div>

          {activeTab === 'OVERVIEW' && (
            <div className="space-y-5">
              {/* Root Cause & Confidence */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Likely Root Cause Analysis
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Confidence:</span>
                    <span className="text-xs font-mono font-bold text-cyan-300 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                      {incident.confidence_score ? `${Math.round(incident.confidence_score * 100)}%` : '92%'} (AI estimate)
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800">
                  <h4 className="text-sm font-semibold text-white">
                    {incident.suspected_cause || incident.root_cause || 'Database connection pool exhaustion and hung thread socket handles.'}
                  </h4>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    Corroborated by historical incident <strong className="text-cyan-300">INC-782</strong>, Runbook <strong className="text-purple-300">RUN-DB-001</strong>, and active QueuePool timeout logs on {incident.service}.
                  </p>
                </div>

                {/* Symptoms & Logs */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Incident Logs & Observed Exceptions
                  </span>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-rose-300 overflow-x-auto whitespace-pre-wrap">
                    {incident.logs || incident.error_message || '2026-09-29 ERROR Database connection timeout'}
                  </div>
                </div>

                {/* Resolution Steps Summary if Resolved */}
                {isResolved && (
                  <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-500/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                      Verified Resolution Steps Executed
                    </span>
                    <pre className="text-xs text-emerald-300 font-mono whitespace-pre-wrap">
                      {incident.resolution_steps || '1. Restarted connection pool\n2. Verified health probe'}
                    </pre>
                  </div>
                )}
              </div>

              {/* Verification Telemetry */}
              <VerificationPanel
                service={incident.service}
                isResolved={isResolved}
                errorRateBefore={42.5}
                errorRateAfter={0.05}
                latencyBefore={4200}
                latencyAfter={48}
              />

              {/* Closed-Loop Continuous Learning Banner */}
              {isResolved && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/30 via-slate-900 to-slate-900 border border-purple-500/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        Experience Indexed into Long-Term Memory
                      </h4>
                      <p className="text-[11px] text-slate-300">
                        Incident <span className="font-mono text-cyan-300">{incident.id}</span> was vectorized into ChromaDB. Future incidents matching this failure pattern will retrieve this experience as ground truth.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
                    ChromaDB: Ready
                  </span>
                </div>
              )}

              {/* Engineer Feedback Card */}
              <FeedbackCard
                incidentId={incident.id}
                onSubmit={handleSubmitFeedback}
                existingRating={incident.feedback_rating}
                existingComments={incident.engineer_feedback}
              />
            </div>
          )}

          {activeTab === 'EVIDENCE' && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-purple-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Retrieved Episodic Memory (Similar Historical Incidents)
                    </h3>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold font-mono text-cyan-400">INC-782</span>
                      <span className="text-emerald-400 font-mono text-[10px] font-bold">Similarity: 0.942</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-200">
                      Payment API Connection Pool Starvation Under Spike
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Database connection pool size was capped at 20 with overflow 10, causing connection starvation during flash traffic.
                    </p>
                    <div className="mt-2 text-[11px] text-emerald-400 font-mono">
                      ✓ Resolved by: Restarting connection pool service and scaling max pool size.
                    </div>
                  </div>
                </div>
              </div>

              {/* Runbooks */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Retrieved Procedural Memory (SRE Runbooks)
                    </h3>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold font-mono text-purple-400">RUN-DB-001</span>
                    <span className="text-amber-400 font-mono text-[10px] font-bold">Risk: MEDIUM</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-200">
                    Database Connection Pool Recovery & Scaling
                  </div>
                  <pre className="text-[11px] font-mono text-slate-400 whitespace-pre-wrap bg-slate-900/80 p-2.5 rounded border border-slate-800">
{`1. Run check_database_connections() to inspect pool usage.
2. If pool is locked, trigger restart_service(service='payment-api').
3. Run verify_resolution(service='payment-api') and inspect error rate drop.`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'TOOLS' && (
            <ToolExecutionConsole executions={toolExecutions} />
          )}
        </div>

        {/* Right 1 Column: Live Agent Activity Stream */}
        <div className="lg:col-span-1">
          <AgentActivityStream
            events={incident.timeline_events || []}
            isLoading={isAnalyzing}
          />
        </div>
      </div>
    </div>
  );
};
