import React, { useState } from 'react';
import { BookOpen, FileText, Check, Copy, ExternalLink, Bookmark } from 'lucide-react';

export function SourceCitation({
  source,
  index,
  isHighlighted = false,
  onSelect
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    if (source?.chunkText) {
      navigator.clipboard.writeText(source.chunkText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const relevancePercentage = source.relevanceScore
    ? Math.min(100, Math.round(source.relevanceScore * 10))
    : null;

  return (
    <div
      id={`source-${index + 1}`}
      onClick={onSelect}
      className={`rounded-xl border p-4 transition-all duration-200 cursor-pointer ${
        isHighlighted
          ? 'bg-indigo-950/40 border-indigo-500 shadow-md ring-2 ring-indigo-500/30'
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2.5">
        {/* Source ID & Document Title */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-indigo-600 text-white shadow-sm">
              {source.sourceId || `Source ${index + 1}`}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-indigo-400" />
              Page {source.pageNumber}
            </span>
            {relevancePercentage !== null && (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                Score: {source.relevanceScore}
              </span>
            )}
          </div>
          <h5 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 pt-0.5">
            <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate max-w-sm">{source.documentTitle}</span>
          </h5>
        </div>

        {/* Copy excerpt button */}
        <button
          type="button"
          onClick={handleCopy}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition flex-shrink-0"
          title="Copy passage excerpt"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Excerpt */}
      <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 leading-relaxed font-serif italic">
        "{source.chunkText}"
      </div>
    </div>
  );
}

export default SourceCitation;
