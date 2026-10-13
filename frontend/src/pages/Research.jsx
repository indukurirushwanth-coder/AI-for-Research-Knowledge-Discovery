import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { researchApi } from '../services/api';
import QuestionForm from '../components/QuestionForm';
import AnswerPanel from '../components/AnswerPanel';
import { MessageSquareText, FileText, History, Clock, ArrowRight, Layers, Sparkles, AlertCircle, AlertTriangle } from 'lucide-react';

export function Research() {
  const [documents, setDocuments] = useState([]);
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  const [querying, setQuerying] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [selectedSourceIndex, setSelectedSourceIndex] = useState(null);

  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [docsRes, histRes] = await Promise.all([
          researchApi.getDocuments(),
          researchApi.getHistory().catch(() => ({ data: { history: [] } }))
        ]);
        const docs = docsRes.data.documents || [];
        setDocuments(docs);
        setHistory(histRes.data.history || []);

        // By default, if there are indexed digital documents, do not pre-select a scanned document
        const firstValidDoc = docs.find(d => d.status !== 'scanned_ocr_required');
        if (firstValidDoc && docs.length === 1) {
          setSelectedDocIds([firstValidDoc.id]);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load documents.');
      } finally {
        setLoadingDocs(false);
      }
    }
    loadInitialData();
  }, []);

  const handleAskQuestion = async (queryText) => {
    setQuerying(true);
    setError(null);
    setSelectedSourceIndex(null);

    try {
      const res = await researchApi.askQuestion({
        query: queryText,
        documentIds: selectedDocIds.length > 0 ? selectedDocIds : undefined
      });

      setCurrentResult(res.data);

      // Refresh history
      try {
        const histRes = await researchApi.getHistory();
        setHistory(histRes.data.history || []);
      } catch (hErr) {
        // non-blocking
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to execute grounded query.');
    } finally {
      setQuerying(false);
    }
  };

  const handleSelectSource = (index) => {
    setSelectedSourceIndex(index);
    const element = document.getElementById(`source-${index + 1}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const toggleDocSelection = (id) => {
    setSelectedDocIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const scannedDocs = documents.filter(d => d.status === 'scanned_ocr_required');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <MessageSquareText className="w-6 h-6 text-indigo-400" />
            Evidence-Grounded Research Inquiries
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Answers are synthesized strictly from retrieved document passages. Citations map to verified source pages.
          </p>
        </div>

        {/* Scope Filter Badges */}
        {documents.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400">Document Scope:</span>
            <button
              type="button"
              onClick={() => setSelectedDocIds([])}
              className={`text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                selectedDocIds.length === 0
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              All Papers ({documents.length})
            </button>
            {documents.map((doc) => {
              const isSelected = selectedDocIds.includes(doc.id);
              const isScanned = doc.status === 'scanned_ocr_required';

              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => toggleDocSelection(doc.id)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition truncate max-w-[170px] cursor-pointer ${
                    isSelected
                      ? isScanned
                        ? 'bg-amber-950/40 border-amber-600 text-amber-300 font-bold'
                        : 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title={doc.title + (isScanned ? ' (Scanned - Requires OCR)' : ' (Indexed)')}
                >
                  {doc.title} {isScanned && '⚠️'}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Scanned Document Notice Banner */}
      {scannedDocs.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/80 text-amber-200 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-amber-300">Scanned Document Detected:</strong>{' '}
            {scannedDocs.map(d => `"${d.title}"`).join(', ')} consists of camera-scanned photos (CamScanner) without digital selectable text.
            To query this paper, select a digital text PDF (like <em>I MID EXAMINATION DLCO</em>) or upload a vector PDF with selectable text.
          </div>
        </div>
      )}

      {/* Empty State when no papers uploaded */}
      {!loadingDocs && documents.length === 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No Research Papers Available</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            You need to upload at least one PDF research paper before asking questions. Head to the Dashboard to upload papers or load samples.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition"
          >
            Go to Dashboard & Upload
          </Link>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Research Form */}
      {documents.length > 0 && (
        <QuestionForm
          onSubmit={handleAskQuestion}
          loading={querying}
          selectedDocCount={selectedDocIds.length}
        />
      )}

      {/* Grounded Answer Presentation */}
      {currentResult && (
        <AnswerPanel
          result={currentResult}
          selectedSourceIndex={selectedSourceIndex}
          onSelectSource={handleSelectSource}
        />
      )}

      {/* Recent Inquiries History */}
      {history.length > 0 && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-indigo-400" />
            Previous Inquiries in this Session
          </h4>
          <div className="divide-y divide-slate-800/80">
            {history.slice(0, 5).map((h) => (
              <div
                key={h.id}
                onClick={() => {
                  setCurrentResult({
                    query: h.question,
                    answer: h.answer,
                    sources: h.sources || [],
                    insufficientEvidence: false
                  });
                }}
                className="py-2.5 flex items-center justify-between text-xs text-slate-300 hover:text-indigo-300 cursor-pointer group"
              >
                <div className="flex items-center gap-2 truncate">
                  <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="font-medium truncate">{h.question}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400 flex-shrink-0 ml-2" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Research;
