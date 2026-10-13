import React, { useState } from 'react';
import { Search, Sparkles, Send, Loader2, Filter } from 'lucide-react';

export function QuestionForm({ onSubmit, loading = false, selectedDocCount = 0 }) {
  const [query, setQuery] = useState('');

  const sampleQuestions = [
    'What are the physical qubit and runtime requirements to break RSA-2048 using Shor\'s algorithm?',
    'How does CRYSTALS-Kyber compare to classical RSA-2048 in encapsulation speed and memory footprint?',
    'What are the primary hardware and network limitations reported in these studies?'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;
    onSubmit(query.trim());
  };

  const handleSelectSample = (sample) => {
    setQuery(sample);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between">
          <label htmlFor="research-query" className="text-sm font-bold text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-indigo-400" />
            Ask Evidence-Grounded Research Question
          </label>
          {selectedDocCount > 0 ? (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Scoped to {selectedDocCount} selected document{selectedDocCount === 1 ? '' : 's'}
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">
              Querying all uploaded documents
            </span>
          )}
        </div>

        <div className="relative">
          <textarea
            id="research-query"
            rows={3}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. What empirical findings are established regarding Shor's algorithm runtime and lattice-based alternatives?"
            disabled={loading}
            className="w-full bg-slate-950/70 border border-slate-700 focus:border-indigo-500 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 outline-none transition resize-none"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Sample Prompts */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              Suggestions:
            </span>
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSample(q)}
                disabled={loading}
                className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer text-left truncate max-w-xs"
                title={q}
              >
                {idx === 0 ? 'Qubit Requirements' : idx === 1 ? 'Kyber vs RSA Speed' : 'Hardware Limits'}
              </button>
            ))}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-md shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Retrieving & Grounding...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Inquiry
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default QuestionForm;
