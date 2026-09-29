import React, { useEffect, useState } from 'react';
import { Database, Search, Sparkles, BookOpen, FileText, ArrowRight, Shield } from 'lucide-react';
import { MemoryRecord } from '../types';
import { memoryApi } from '../services/api';

export const MemoryExplorerPage: React.FC = () => {
  const [query, setQuery] = useState('database connection pool exhaustion');
  const [memoryType, setMemoryType] = useState('ALL');
  const [records, setRecords] = useState<MemoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (searchQuery = query) => {
    setIsLoading(true);
    try {
      const data = await memoryApi.search(searchQuery, memoryType === 'ALL' ? undefined : memoryType, 8);
      setRecords(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, [memoryType]);

  const presetQueries = [
    'database connection timeout and pool exhaustion',
    'JWT key rotation cache desynchronization 401',
    'Order service OOMKilled exit code 137 crash loop',
    'Postgres table lock deadlock on concurrent update',
    'Redis memory maxmemory eviction storm'
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              ChromaDB Vector & Long-Term Operational Memory Explorer
            </h2>
            <p className="text-xs text-slate-400">
              Query episodic, procedural, and semantic memory collections with live cosine similarity scoring
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Test semantic similarity search across ChromaDB vector space..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
            />
          </div>

          <select
            value={memoryType}
            onChange={(e) => setMemoryType(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-medium"
          >
            <option value="ALL">All Memory Types</option>
            <option value="EPISODIC">Episodic (Incidents)</option>
            <option value="PROCEDURAL">Procedural (Runbooks)</option>
            <option value="SEMANTIC">Semantic (Postmortems)</option>
          </select>

          <button
            onClick={() => handleSearch()}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition flex items-center justify-center gap-2 shadow-md shadow-cyan-600/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isLoading ? 'Searching Vectors...' : 'Search Memory'}</span>
          </button>
        </div>

        {/* Preset Queries */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-bold text-slate-400">Test Queries:</span>
          {presetQueries.map((pq, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(pq);
                handleSearch(pq);
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 transition"
            >
              {pq}
            </button>
          ))}
        </div>
      </div>

      {/* Memory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {records.map((rec) => {
          const typeBadge =
            rec.memory_type === 'EPISODIC'
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
              : rec.memory_type === 'PROCEDURAL'
              ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
              : 'bg-pink-500/20 text-pink-300 border-pink-500/30';

          return (
            <div
              key={rec.id}
              className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${typeBadge}`}>
                    {rec.memory_type} MEMORY
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    Similarity: {(rec.similarity_score * 100).toFixed(1)}%
                  </span>
                </div>

                <h4 className="text-xs font-bold text-white mb-1">
                  {rec.title}
                </h4>

                {rec.reference_id && (
                  <div className="text-[11px] font-mono text-cyan-400 mb-2">
                    Ref ID: {rec.reference_id}
                  </div>
                )}

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono">
                  {rec.content}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Indexed in ChromaDB Persistent Store</span>
                <span>Dim: 384</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
