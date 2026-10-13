import React from 'react';
import { AlertCircle, CheckCircle, ShieldCheck, Sparkles, BookOpen, Layers } from 'lucide-react';
import SourceCitation from './SourceCitation';

export function AnswerPanel({
  result,
  selectedSourceIndex,
  onSelectSource
}) {
  if (!result) return null;

  const {
    query,
    answer,
    synthesisSummary,
    sources = [],
    citations = [],
    insufficientEvidence = false,
    modelUsed,
    warning
  } = result;

  // Split and render answer text with clickable source badges
  const renderFormattedAnswer = (text) => {
    if (!text) return null;

    // Regex to match [Source N]
    const parts = text.split(/(\[Source \d+\])/g);

    return parts.map((part, idx) => {
      const match = part.match(/\[Source (\d+)\]/);
      if (match) {
        const sourceNum = parseInt(match[1], 10);
        const sourceExists = sources && sources.length >= sourceNum;

        if (sourceExists) {
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectSource && onSelectSource(sourceNum - 1)}
              className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-[11px] font-bold bg-indigo-500/20 hover:bg-indigo-500/35 text-indigo-300 border border-indigo-500/40 hover:border-indigo-400 transition cursor-pointer"
              title={`View Evidence: Source ${sourceNum}`}
            >
              [Source {sourceNum}]
            </button>
          );
        }
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className="space-y-6">
      {/* Main Answer Container */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur space-y-5">
        {/* Header: Query & Model Info */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800 gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
              Research Synthesis
            </span>
            <h3 className="text-base font-bold text-white mt-0.5">
              "{query}"
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-indigo-400" />
              {modelUsed || 'Grounded Gemini Engine'}
            </span>
          </div>
        </div>

        {/* Warning if API Key missing */}
        {warning && (
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800 text-amber-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Notice:</strong> {warning}
            </div>
          </div>
        )}

        {/* Insufficient Evidence Warning Banner */}
        {insufficientEvidence && (
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/80 text-amber-200 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
            <div className="space-y-2">
              <h5 className="font-bold text-amber-300">Insufficient Evidence in Selected Scope</h5>
              <p className="leading-relaxed text-slate-200">
                {answer || 'The uploaded papers do not contain sufficient verified passages to substantiate this specific claim. In accordance with academic rigor, no speculative answers have been fabricated.'}
              </p>
              <div className="pt-2 text-[11px] text-amber-300/80 border-t border-amber-800/50 space-y-1">
                <p className="font-semibold text-amber-300">Helpful context & next steps:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li><strong>Scanned/Photo PDFs:</strong> Documents created from camera images (e.g. CamScanner) lack selectable digital text. Without OCR preprocessing, text inside image pixels cannot be indexed.</li>
                  <li><strong>Document Scope:</strong> In the scope buttons above, select a document with digital text (such as <em>"I MID EXAMINATION DLCO"</em> or sample papers).</li>
                  <li><strong>Targeted Queries:</strong> Try asking for specific topics in the document (e.g. <em>"SR FLIP FLOP"</em>, <em>"decoder"</em>, <em>"first question"</em>).</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Synthesis Summary Callout */}
        {synthesisSummary && (
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-700/50 text-indigo-200 text-xs flex items-start gap-3">
            <Sparkles className="w-4 h-4 flex-shrink-0 text-indigo-400 mt-0.5" />
            <div>
              <strong className="text-indigo-300 block mb-0.5 font-bold uppercase tracking-wider text-[10px]">
                Executive Synthesis
              </strong>
              <p className="leading-relaxed text-slate-200 font-medium">{synthesisSummary}</p>
            </div>
          </div>
        )}

        {/* Body Answer */}
        {!insufficientEvidence && answer && (
          <div className="text-sm text-slate-200 leading-relaxed space-y-3 font-normal">
            <div className="whitespace-pre-line">
              {renderFormattedAnswer(answer)}
            </div>
          </div>
        )}

        {/* AI Transparency Disclaimer */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Grounded strictly in {sources.length} retrieved passage{sources.length === 1 ? '' : 's'}.
          </span>
          <span className="hidden sm:inline">
            Click any [Source N] tag to inspect the underlying page excerpt.
          </span>
        </div>
      </div>

      {/* Supporting Evidence Sources */}
      {sources.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Retrieved Supporting Evidence ({sources.length})
            </h4>
            <span className="text-xs text-slate-400">
              Ranked by BM25 relevance score
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sources.map((src, idx) => (
              <SourceCitation
                key={idx}
                source={src}
                index={idx}
                isHighlighted={selectedSourceIndex === idx}
                onSelect={() => onSelectSource && onSelectSource(idx)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AnswerPanel;
