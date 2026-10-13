import React from 'react';
import { FileText, Trash2, Calendar, Layers, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export function DocumentList({
  documents = [],
  selectedIds = [],
  onToggleSelect,
  onDeleteDocument,
  loading = false
}) {
  if (loading) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center">
        <p className="text-sm text-slate-400 animate-pulse">Loading indexed papers...</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 mx-auto mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-slate-200">No Research Papers Uploaded</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Upload PDF papers above or use the "Load 2 Sample Research Papers" button to begin evidence-grounded analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Showing <strong className="text-slate-200">{documents.length}</strong> indexed paper{documents.length === 1 ? '' : 's'}
        </span>
        {onToggleSelect && selectedIds.length > 0 && (
          <span className="text-indigo-400 font-medium">
            {selectedIds.length} selected for scope
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {documents.map((doc) => {
          const isSelected = selectedIds.includes(doc.id);
          const formattedSize = doc.file_size
            ? (doc.file_size / (1024 * 1024)).toFixed(2) + ' MB'
            : 'N/A';
          const formattedDate = doc.created_at
            ? new Date(doc.created_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })
            : '';

          return (
            <div
              key={doc.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition gap-3 ${
                isSelected
                  ? 'bg-indigo-950/30 border-indigo-500/50 shadow-sm'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Left: Checkbox + Title & Metadata */}
              <div className="flex items-start gap-3">
                {onToggleSelect && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(doc.id)}
                    className="mt-1 w-4 h-4 rounded text-indigo-600 border-slate-700 bg-slate-800 focus:ring-indigo-500 cursor-pointer"
                    title="Select document"
                  />
                )}

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-semibold text-slate-100 hover:text-indigo-300 transition leading-snug">
                      {doc.title}
                    </h4>
                    {doc.status === 'scanned_ocr_required' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-800">
                        <AlertCircle className="w-3 h-3" />
                        Scanned (OCR Req)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                        <CheckCircle className="w-3 h-3" />
                        Indexed
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                    <span className="font-mono text-slate-400">{doc.original_name}</span>
                    <span>•</span>
                    <span>{formattedSize}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-indigo-400" />
                      {doc.page_count} page{doc.page_count === 1 ? '' : 's'}
                    </span>
                    <span>•</span>
                    <span>{doc.chunk_count} passages</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {formattedDate}
                    </span>
                  </div>

                  {doc.status_message && (
                    <p className="text-[11px] text-amber-400/90 pt-0.5">
                      {doc.status_message}
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                {onDeleteDocument && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete "${doc.title}" and its evidence chunks?`)) {
                        onDeleteDocument(doc.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/50 transition cursor-pointer"
                    title="Delete document and chunks"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DocumentList;
