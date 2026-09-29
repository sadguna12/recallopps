import React, { useState } from 'react';
import { Flame, X, AlertTriangle, Play, Sparkles } from 'lucide-react';
import { ServiceItem } from '../../types';

interface FailureInjectorModalProps {
  services: ServiceItem[];
  isOpen: boolean;
  onClose: () => void;
  onInject: (payload: { service_name: string; failure_type: string; severity?: string; error_rate?: number; latency_ms?: number }) => Promise<void>;
}

export const FailureInjectorModal: React.FC<FailureInjectorModalProps> = ({
  services,
  isOpen,
  onClose,
  onInject,
}) => {
  const [selectedService, setSelectedService] = useState('payment-api');
  const [failureType, setFailureType] = useState('DB_POOL_EXHAUSTION');
  const [severity, setSeverity] = useState('HIGH');
  const [errorRate, setErrorRate] = useState(42.5);
  const [latencyMs, setLatencyMs] = useState(3800);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const failureTemplates = [
    {
      id: 'DB_POOL_EXHAUSTION',
      label: 'Database Connection Pool Exhaustion',
      desc: 'Saturates DB connection pool to 100%, causing QueuePool timeouts and 500 error spikes.',
      service: 'payment-api',
      errorRate: 42.5,
      latency: 4200,
      severity: 'HIGH'
    },
    {
      id: 'JWT_KEY_DESYNC',
      label: 'Auth JWT Key Rotation Desync',
      desc: 'Invalidates public keys in cache, causing 100% 401 Unauthorized errors across APIs.',
      service: 'auth-service',
      errorRate: 100.0,
      latency: 45,
      severity: 'CRITICAL'
    },
    {
      id: 'MEMORY_LEAK',
      label: 'Container Memory Leak (OOMKilled Loop)',
      desc: 'Spikes memory consumption to 98%, triggering exit code 137 container crash loops.',
      service: 'order-service',
      errorRate: 28.0,
      latency: 2500,
      severity: 'HIGH'
    },
    {
      id: 'DEADLOCK',
      label: 'Postgres Transaction Deadlock Contention',
      desc: 'Simulates circular row locks on inventory decrement with blocked query queues.',
      service: 'database-service',
      errorRate: 65.0,
      latency: 8900,
      severity: 'CRITICAL'
    }
  ];

  const handleApplyTemplate = (tpl: typeof failureTemplates[0]) => {
    setSelectedService(tpl.service);
    setFailureType(tpl.id);
    setSeverity(tpl.severity);
    setErrorRate(tpl.errorRate);
    setLatencyMs(tpl.latency);
  };

  const handleInject = async () => {
    setIsSubmitting(true);
    try {
      await onInject({
        service_name: selectedService,
        failure_type: failureType,
        severity,
        error_rate: errorRate,
        latency_ms: latencyMs,
      });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Simulated Infrastructure Chaos & Failure Injection
              </h3>
              <p className="text-xs text-slate-400">
                Trigger realistic microservice degradation to test Autonomous AI Agent response
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Scenario Templates */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Quick Scenario Presets:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {failureTemplates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleApplyTemplate(tpl)}
                className={`p-2.5 rounded-lg border text-left transition ${
                  failureType === tpl.id
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                    : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-semibold">{tpl.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{tpl.service}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Form Controls */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Target Service</label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {services.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.display_name} ({s.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="CRITICAL">CRITICAL (Outage)</option>
              <option value="HIGH">HIGH (Degraded)</option>
              <option value="MEDIUM">MEDIUM (Warning)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Simulated Error Rate: {errorRate}%
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={errorRate}
              onChange={(e) => setErrorRate(parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Latency Spike: {latencyMs}ms
            </label>
            <input
              type="range"
              min="100"
              max="10000"
              step="100"
              value={latencyMs}
              onChange={(e) => setLatencyMs(parseInt(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleInject}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-600/30 transition flex items-center gap-1.5"
          >
            <Flame className="w-4 h-4" />
            <span>{isSubmitting ? 'Injecting Chaos...' : 'Inject Failure into Cluster'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
