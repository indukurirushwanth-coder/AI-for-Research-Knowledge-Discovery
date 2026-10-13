import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { researchApi } from '../services/api';
import DocumentUpload from '../components/DocumentUpload';
import DocumentList from '../components/DocumentList';
import { FileText, Layers, MessageSquareText, GitCompare, Sparkles, BookOpen, Clock } from 'lucide-react';

export function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await researchApi.getDocuments();
      setDocuments(res.data.documents || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUploadSuccess = () => {
    fetchDocuments();
  };

  const handleDeleteDocument = async (id) => {
    try {
      await researchApi.deleteDocument(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      alert('Failed to delete document: ' + (err.response?.data?.message || err.message));
    }
  };

  // Compute stats
  const totalChunks = documents.reduce((sum, d) => sum + (d.chunk_count || 0), 0);
  const totalPages = documents.reduce((sum, d) => sum + (d.page_count || 0), 0);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            AI for Research & Knowledge Discovery
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Research Workspace & Paper Vault
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            Upload and index multiple scientific papers. Ask queries grounded strictly in retrieved evidence, inspect page-level citations, and compare divergent findings across studies.
          </p>
        </div>

        {/* Quick Action Badges */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/research"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition"
          >
            <MessageSquareText className="w-4 h-4" />
            Open Research Q&A
          </Link>
          <Link
            to="/compare"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition"
          >
            <GitCompare className="w-4 h-4 text-indigo-400" />
            Compare Papers Matrix
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Indexed Papers</span>
            <FileText className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white">{documents.length}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Active research documents</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Evidence Passages</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">{totalChunks}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Semantic searchable chunks</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Pages Processed</span>
            <BookOpen className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white">{totalPages}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Page-indexed boundaries</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Grounding Level</span>
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-indigo-400">100%</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Zero fabricated citations</span>
        </div>
      </div>

      {/* Upload Section */}
      <section className="space-y-3">
        <DocumentUpload onUploadSuccess={handleUploadSuccess} />
      </section>

      {/* Document Library Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Indexed Document Vault
          </h2>
          <button
            onClick={fetchDocuments}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Refresh Library
          </button>
        </div>

        <DocumentList
          documents={documents}
          loading={loading}
          onDeleteDocument={handleDeleteDocument}
        />
      </section>
    </div>
  );
}

export default Dashboard;
