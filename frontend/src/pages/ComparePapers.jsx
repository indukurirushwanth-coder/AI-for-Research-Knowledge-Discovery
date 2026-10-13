import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { researchApi } from '../services/api';
import ComparisonPanel from '../components/ComparisonPanel';
import { GitCompare, FileText, CheckCircle2, AlertCircle, ArrowRight, Loader2, Sparkles } from 'lucide-react';

export function ComparePapers() {
  const [documents, setDocuments] = useState([]);
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  const [comparing, setComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDocs() {
      try {
        const res = await researchApi.getDocuments();
        const docs = res.data.documents || [];
        setDocuments(docs);
        // By default, select first 2 documents if available
        if (docs.length >= 2) {
          setSelectedDocIds([docs[0].id, docs[1].id]);
        }
      } catch (err) {
        setError('Failed to load documents for comparison: ' + err.message);
      } finally {
        setLoadingDocs(false);
      }
    }
    fetchDocs();
  }, []);

  const handleToggleDoc = (id) => {
    setSelectedDocIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleRunComparison = async () => {
    if (selectedDocIds.length < 2) {
      setError('Please select at least two papers to generate a comparative analysis.');
      return;
    }

    setComparing(true);
    setError(null);

    try {
      const res = await researchApi.comparePapers({
        documentIds: selectedDocIds
      });
      setComparisonResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Comparison failed.');
    } finally {
      setComparing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
          <GitCompare className="w-6 h-6 text-indigo-400" />
          Cross-Paper Comparative Analysis & Synthesis
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Extract and compare objectives, methodologies, findings, convergences, and conflicting conclusions across at least two papers.
        </p>
      </div>

      {/* Case when < 2 documents uploaded */}
      {!loadingDocs && documents.length < 2 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <GitCompare className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">At Least Two Papers Required</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Comparative synthesis requires at least two distinct research papers. Head to the Dashboard to upload papers or use the 1-click sample papers loader.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition"
          >
            Upload Papers on Dashboard
          </Link>
        </div>
      )}

      {/* Paper Selection Workspace */}
      {documents.length >= 2 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white">
                Select Papers to Compare ({selectedDocIds.length} of {documents.length} selected)
              </h3>
              <p className="text-xs text-slate-400">
                Choose 2 or more indexed papers to generate a dimensional comparison matrix.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRunComparison}
              disabled={selectedDocIds.length < 2 || comparing}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-md shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              {comparing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Synthesizing Comparison...
                </>
              ) : (
                <>
                  <GitCompare className="w-4 h-4" />
                  Run Comparison Matrix
                </>
              )}
            </button>
          </div>

          {/* Paper Checkbox Chips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {documents.map((doc) => {
              const isSelected = selectedDocIds.includes(doc.id);
              return (
                <div
                  key={doc.id}
                  onClick={() => handleToggleDoc(doc.id)}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500 shadow-sm'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}} // handled by parent onClick
                    className="mt-0.5 w-4 h-4 rounded text-indigo-600 border-slate-700 bg-slate-800 cursor-pointer"
                  />
                  <div className="overflow-hidden">
                    <h5 className="text-xs font-semibold text-slate-200 truncate" title={doc.title}>
                      {doc.title}
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                      {doc.original_name} • {doc.page_count}p • {doc.chunk_count} passages
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Comparison Results */}
      <ComparisonPanel
        comparisonData={comparisonResult}
        loading={comparing}
      />
    </div>
  );
}

export default ComparePapers;
