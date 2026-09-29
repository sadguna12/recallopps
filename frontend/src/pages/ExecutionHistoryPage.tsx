import React, { useEffect, useState } from 'react';
import { Terminal, Search, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { ToolExecution } from '../types';
import { actionApi } from '../services/api';

export const ExecutionHistoryPage: React.FC = () => {
  const [executions, setExecutions] = useState<ToolExecution[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    actionApi.listToolExecutions().then(setExecutions);
  }, []);

  const filtered = executions.filter(
    (e) =>
      e.tool_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.incident_id && e.incident_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Low-Level Tool Execution Telemetry & Latency Logs
            </h2>
            <p className="text-xs text-slate-400">
              Granular observability into agent tool payloads, responses, execution durations, and errors
            </p>
          </div>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search tool executions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      <div className="space-y-3 font-mono text-xs">
        {filtered.map((exec) => {
          const isSuccess = exec.status === 'SUCCESS';
          let inputData = {};
          let outputData = {};
          try {
            inputData = JSON.parse(exec.tool_input_json || '{}');
          } catch (e) {
            inputData = { raw: exec.tool_input_json };
          }
          try {
            outputData = JSON.parse(exec.tool_output_json || '{}');
          } catch (e) {
            outputData = { raw: exec.tool_output_json };
          }

          return (
            <div
              key={exec.id}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-3"
            >
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  {isSuccess ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  )}
                  <span className="font-bold text-cyan-300 text-sm">{exec.tool_name}()</span>
                  <span className="text-slate-400">ID: {exec.id}</span>
                  {exec.incident_id && (
                    <span className="text-purple-400">Incident: {exec.incident_id}</span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                  <span className="text-amber-300 font-bold">{exec.execution_time_ms} ms</span>
                  <span>{new Date(exec.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-850">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Input Arguments:
                  </span>
                  <pre className="text-amber-300 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(inputData, null, 2)}
                  </pre>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-850">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Tool Observation Output:
                  </span>
                  <pre className="text-emerald-300 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(outputData, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
