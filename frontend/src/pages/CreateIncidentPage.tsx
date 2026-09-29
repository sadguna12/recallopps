import React, { useState } from 'react';
import {
  PlusCircle, Sparkles, Brain, Server, AlertTriangle,
  Play, FileText, CheckCircle2, ArrowRight
} from 'lucide-react';
import { incidentApi } from '../services/api';
import { IncidentSeverity } from '../types';

interface CreateIncidentPageProps {
  onIncidentCreated: (incidentId: string) => void;
}

export const CreateIncidentPage: React.FC<CreateIncidentPageProps> = ({
  onIncidentCreated,
}) => {
  const [title, setTitle] = useState('Payment Gateway 500 Errors After Traffic Spike');
  const [service, setService] = useState('payment-api');
  const [environment, setEnvironment] = useState('production');
  const [severity, setSeverity] = useState<IncidentSeverity>('HIGH');
  const [component, setComponent] = useState('Database Connection Pool');
  const [deploymentVersion, setDeploymentVersion] = useState('v2.4.0');
  const [description, setDescription] = useState(
    'Payment API is throwing HTTP 500 responses on POST /v1/charges during flash sale traffic surge. Customers cannot complete checkout.'
  );
  const [errorMessage, setErrorMessage] = useState(
    'TimeoutError: QueuePool limit of size 50 overflow 10 reached, connection timed out, timeout 30.00'
  );
  const [logs, setLogs] = useState(
    `2026-09-29 14:32:01 ERROR [payment-api] [pool.py:302] Connection pool exhausted: 50/50 active connections in use
2026-09-29 14:32:05 ERROR [payment-api] [checkout.py:118] HTTP 500: Database connection timeout while processing order pay_99482
2026-09-29 14:32:10 WARN [payment-api] [health.py:44] Health check degraded: latency 4200ms`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const demoScenarios = [
    {
      label: 'INC-1024: Payment API 500 DB Pool Exhaustion (Primary Demo)',
      title: 'Payment Gateway 500 Errors After Traffic Spike',
      service: 'payment-api',
      severity: 'HIGH' as IncidentSeverity,
      component: 'Database Connection Pool',
      deploymentVersion: 'v2.4.0',
      description: 'Payment API is throwing HTTP 500 responses on POST /v1/charges during flash sale traffic surge. Customers cannot complete checkout.',
      error: 'TimeoutError: QueuePool limit of size 50 overflow 10 reached, connection timed out, timeout 30.00',
      logs: `2026-09-29 14:32:01 ERROR [payment-api] [pool.py:302] Connection pool exhausted: 50/50 active connections in use\n2026-09-29 14:32:05 ERROR [payment-api] [checkout.py:118] HTTP 500: Database connection timeout while processing order pay_99482\n2026-09-29 14:32:10 WARN [payment-api] [health.py:44] Health check degraded: latency 4200ms`
    },
    {
      label: 'INC-1025: Auth Service 401 JWT Rotation Cache Desync',
      title: 'Auth Service 401 Unauthorized Outage on All APIs',
      service: 'auth-service',
      severity: 'CRITICAL' as IncidentSeverity,
      component: 'JWKS Validator',
      deploymentVersion: 'v1.9.1',
      description: 'Scheduled key rotation occurred 10 minutes ago. Now 100% of incoming user tokens fail signature validation.',
      error: "JWTVerificationError: Signature verification failed for key ID 'key_2026_q3_b'. Public key not found in local JWKS cache.",
      logs: `2026-09-29 09:00:15 ERROR [auth-service] [jwt.py:84] Failed to verify bearer token: key ID key_2026_q3_b missing in key cache\n2026-09-29 09:00:18 ERROR [auth-service] [routes.py:55] HTTP 401 Unauthorized for user_88329`
    },
    {
      label: 'INC-1026: Order Service Memory Leak & OOMKilled Loop',
      title: 'Order Service Crash-Looping with Exit Code 137',
      service: 'order-service',
      severity: 'HIGH' as IncidentSeverity,
      component: 'Invoice Exporter',
      deploymentVersion: 'v3.2.0',
      description: 'Order service pods crash every 2 minutes after end-of-day invoice batch export cron is triggered.',
      error: 'ContainerKilled: OOMKilled - Process 1 exceeded memory limit 1024MiB, consumed 1150MiB',
      logs: `2026-09-29 23:45:10 WARN [order-service] Memory usage reached 95% (972MB / 1024MB)\n2026-09-29 23:45:15 ERROR [order-service] Memory allocation failed during DataFrame export\n2026-09-29 23:45:18 FATAL [k8s] Pod order-service terminated with OOMKilled`
    }
  ];

  const loadScenario = (s: typeof demoScenarios[0]) => {
    setTitle(s.title);
    setService(s.service);
    setSeverity(s.severity);
    setComponent(s.component);
    setDeploymentVersion(s.deploymentVersion);
    setDescription(s.description);
    setErrorMessage(s.error);
    setLogs(s.logs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const inc = await incidentApi.create({
        title,
        service,
        environment,
        severity,
        component,
        deployment_version: deploymentVersion,
        description,
        error_message: errorMessage,
        logs,
      });

      // Trigger automatic agent analysis loop
      await incidentApi.analyze(inc.id);

      onIncidentCreated(inc.id);
    } catch (e) {
      console.error('Failed to create incident:', e);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Create New Production Incident
            </h2>
            <p className="text-xs text-slate-400">
              Submit alert payload to trigger Autonomous AI SRE Agent RAG retrieval, multi-step investigation, and remediation
            </p>
          </div>
        </div>

        {/* Demo Scenario Presets */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Load Pre-Configured Test Scenarios:
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {demoScenarios.map((demo, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => loadScenario(demo)}
                className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-500/5 text-left transition group"
              >
                <span className="text-xs font-semibold text-slate-300 group-hover:text-cyan-300 block truncate">
                  {demo.label}
                </span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                  {demo.service} • {demo.severity}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Incident Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Affected Microservice
            </label>
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="payment-api">payment-api (Payment Gateway & Checkout)</option>
              <option value="auth-service">auth-service (Authentication & JWKS)</option>
              <option value="order-service">order-service (Order Fulfillment)</option>
              <option value="user-service">user-service (User Profiles & Cache)</option>
              <option value="database-service">database-service (PostgreSQL Primary)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Severity Level
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="CRITICAL">CRITICAL (Total Outage)</option>
              <option value="HIGH">HIGH (Severe Degradation)</option>
              <option value="MEDIUM">MEDIUM (Partial Impact)</option>
              <option value="LOW">LOW (Minor Glitch)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Component
            </label>
            <input
              type="text"
              value={component}
              onChange={(e) => setComponent(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Deployment Version Tag
            </label>
            <input
              type="text"
              value={deploymentVersion}
              onChange={(e) => setDeploymentVersion(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Incident Description & Symptoms
            </label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Primary Error Exception Signature
            </label>
            <input
              type="text"
              value={errorMessage}
              onChange={(e) => setErrorMessage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Application Log Trace (Passed to RAG & AI Agent)
            </label>
            <textarea
              rows={4}
              value={logs}
              onChange={(e) => setLogs(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Brain className="w-4 h-4 text-cyan-400" />
            <span>AI Agent will search historical memory, run diagnostic tools, and formulate remediation</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 transition flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Brain className="w-4 h-4 animate-spin" />
                <span>Running Agent Investigation Loop...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Ingest & Run AI Agent Investigation</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
