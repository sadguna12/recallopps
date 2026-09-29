import React, { useEffect, useState } from 'react';
import { Settings, Save, RefreshCw, Key, Database, Cpu, CheckCircle2, Shield } from 'lucide-react';
import { SettingsData } from '../types';
import { settingsApi } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [llmProvider, setLlmProvider] = useState('demo');
  const [llmModel, setLlmModel] = useState('gpt-4o');
  const [llmApiKey, setLlmApiKey] = useState('');
  const [topK, setTopK] = useState(4);
  const [demoMode, setDemoMode] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    settingsApi.get().then((data) => {
      setSettings(data);
      setLlmProvider(data.llm_provider);
      setLlmModel(data.llm_model);
      setTopK(data.top_k_retrieval);
      setDemoMode(data.demo_mode);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const updated = await settingsApi.update({
        llm_provider: llmProvider,
        llm_model: llmModel,
        llm_api_key: llmApiKey || undefined,
        top_k_retrieval: topK,
        demo_mode: demoMode,
      });
      setSettings(updated);
      setStatusMessage('Configuration settings saved successfully.');
    } catch (e) {
      console.error(e);
      setStatusMessage('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDb = async () => {
    if (!window.confirm('Are you sure you want to reset and re-seed the SQLite database and ChromaDB vector store?')) {
      return;
    }
    setIsResetting(true);
    try {
      const res = await settingsApi.resetDb();
      setStatusMessage(res.message);
    } catch (e) {
      console.error(e);
    } finally {
      setIsResetting(false);
    }
  };

  if (!settings) {
    return <div className="text-center py-20 text-slate-500 text-xs">Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              AI Provider & System Configuration
            </h2>
            <p className="text-xs text-slate-400">
              Manage LLM reasoning brain, ChromaDB vector collections, Top-K RAG retrieval, and Demo Mode
            </p>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/40 text-xs font-semibold text-cyan-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* LLM Provider */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              LLM Reasoning Brain Provider
            </label>
            <select
              value={llmProvider}
              onChange={(e) => setLlmProvider(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-medium"
            >
              <option value="demo">Intelligent SRE Brain (Offline Demo Mode - Zero API Key Required)</option>
              <option value="openai">OpenAI (GPT-4o / GPT-3.5-Turbo)</option>
              <option value="gemini">Google Gemini (Gemini 1.5 Flash / Pro)</option>
              <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
            </select>
          </div>

          {/* Model Name */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Model Identifier
            </label>
            <input
              type="text"
              value={llmModel}
              onChange={(e) => setLlmModel(e.target.value)}
              placeholder="e.g. gpt-4o, gemini-1.5-flash"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          {/* API Key */}
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              LLM API Key (Optional in Demo Mode)
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                value={llmApiKey}
                onChange={(e) => setLlmApiKey(e.target.value)}
                placeholder={settings.api_key_configured ? '•••••••••••••••• (API Key Configured in Backend)' : 'Enter OpenAI / Gemini / Anthropic API Key (or leave blank for Demo Mode)'}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              API keys are processed strictly in backend memory and never exposed to client-side bundles.
            </p>
          </div>

          {/* Top-K Retrieval */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              RAG Top-K Document Retrieval: {topK}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={topK}
              onChange={(e) => setTopK(parseInt(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          {/* Demo Mode Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">Offline Intelligent Demo Mode</span>
              <span className="text-[11px] text-slate-400">Enables deterministic SRE agent tool reasoning</span>
            </div>
            <input
              type="checkbox"
              checked={demoMode}
              onChange={(e) => setDemoMode(e.target.checked)}
              className="w-4 h-4 accent-cyan-500"
            />
          </div>
        </div>

        {/* Save Controls */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetDb}
            disabled={isResetting}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 transition flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>{isResetting ? 'Re-seeding...' : 'Reset Database & ChromaDB'}</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20 transition flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
