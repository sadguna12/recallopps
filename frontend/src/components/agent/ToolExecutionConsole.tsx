import React from 'react';
import { ToolExecution } from '../../types';
import { Terminal, CheckCircle, XCircle, Clock, ChevronRight } from 'lucide-react';

interface ToolExecutionConsoleProps {
  executions: ToolExecution[];
}

export const ToolExecutionConsole: React.FC<ToolExecutionConsoleProps> = ({ executions }) => {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-xl font-mono text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
            Agent Tool Execution Console
          </span>
        </div>
        <span className="text-[10px] text-slate-400">
          {executions.length} tool invocation(s) logged
        </span>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {executions.length === 0 ? (
          <div className="text-slate-400 py-6 text-center text-xs">
            No tool executions logged for this incident yet.
          </div>
        ) : (
          executions.map((exec) => {
            const isSuccess = exec.status === 'SUCCESS';
            let parsedInput = {};
            let parsedOutput = {};
            try {
              parsedInput = JSON.parse(exec.tool_input_json || '{}');
            } catch (e) {
              parsedInput = { raw: exec.tool_input_json };
            }
            try {
              parsedOutput = JSON.parse(exec.tool_output_json || '{}');
            } catch (e) {
              parsedOutput = { raw: exec.tool_output_json };
            }

            return (
              <div
                key={exec.id}
                className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between text-[11px] mb-2">
                  <div className="flex items-center gap-2">
                    {isSuccess ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    )}
                    <span className="text-cyan-400 font-bold">{exec.tool_name}()</span>
                    <span className="text-slate-400">[{exec.id}]</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{exec.execution_time_ms}ms</span>
                    <span>•</span>
                    <span>{new Date(exec.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                  {/* Parameters */}
                  <div className="p-2 rounded bg-slate-950 border border-slate-900 text-slate-300">
                    <div className="text-[10px] font-bold text-slate-400 mb-1">INPUT PAYLOAD:</div>
                    <pre className="text-[10px] text-amber-300 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(parsedInput, null, 2)}
                    </pre>
                  </div>

                  {/* Output */}
                  <div className="p-2 rounded bg-slate-950 border border-slate-900 text-slate-300">
                    <div className="text-[10px] font-bold text-slate-400 mb-1">RESULT OBSERVATION:</div>
                    <pre className="text-[10px] text-emerald-300 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(parsedOutput, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
