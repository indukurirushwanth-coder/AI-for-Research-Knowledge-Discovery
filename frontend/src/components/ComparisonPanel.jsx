import React from 'react';
import { GitCompare, CheckCircle2, AlertTriangle, HelpCircle, ArrowRight, Lightbulb, FileText } from 'lucide-react';

export function ComparisonPanel({ comparisonData, loading = false }) {
  if (loading) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <h4 className="text-sm font-semibold text-slate-200">Generating Multi-Paper Comparative Matrix...</h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Extracting objectives, empirical methodologies, findings, convergences, and conflicting conclusions.
        </p>
      </div>
    );
  }

  if (!comparisonData) {
    return null;
  }

  const {
    comparisonMatrix = [],
    agreements = [],
    disagreements = [],
    researchGaps = [],
    futureResearchDirections = [],
    synthesisOverview,
    warning
  } = comparisonData;

  return (
    <div className="space-y-6">
      {/* High-level Overview */}
      {synthesisOverview && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-1">
            Comparative Synthesis Overview
          </span>
          <p className="text-sm text-slate-200 leading-relaxed font-medium">
            {synthesisOverview}
          </p>
        </div>
      )}

      {/* Structured Comparison Matrix Table */}
      {comparisonMatrix.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-indigo-400" />
              Side-by-Side Dimensional Comparison ({comparisonMatrix.length} Papers)
            </h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3 bg-slate-950/50 w-36">Dimension</th>
                  {comparisonMatrix.map((item, idx) => (
                    <th key={idx} className="py-3 px-4 bg-slate-950/30 text-indigo-300 font-bold max-w-xs">
                      {item.documentTitle}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {/* Objective */}
                <tr className="hover:bg-slate-850/40">
                  <td className="py-3.5 px-3 font-semibold text-slate-400 bg-slate-950/40">Objective</td>
                  {comparisonMatrix.map((item, idx) => (
                    <td key={idx} className="py-3.5 px-4 leading-relaxed">
                      {item.objective}
                    </td>
                  ))}
                </tr>

                {/* Methodology */}
                <tr className="hover:bg-slate-850/40">
                  <td className="py-3.5 px-3 font-semibold text-slate-400 bg-slate-950/40">Methodology</td>
                  {comparisonMatrix.map((item, idx) => (
                    <td key={idx} className="py-3.5 px-4 leading-relaxed">
                      {item.methodology}
                    </td>
                  ))}
                </tr>

                {/* Key Findings */}
                <tr className="hover:bg-slate-850/40">
                  <td className="py-3.5 px-3 font-semibold text-slate-400 bg-slate-950/40">Key Findings</td>
                  {comparisonMatrix.map((item, idx) => (
                    <td key={idx} className="py-3.5 px-4 leading-relaxed font-medium text-slate-200">
                      {item.keyFindings}
                    </td>
                  ))}
                </tr>

                {/* Limitations */}
                <tr className="hover:bg-slate-850/40">
                  <td className="py-3.5 px-3 font-semibold text-slate-400 bg-slate-950/40">Limitations</td>
                  {comparisonMatrix.map((item, idx) => (
                    <td key={idx} className="py-3.5 px-4 leading-relaxed text-amber-300/90">
                      {item.limitations}
                    </td>
                  ))}
                </tr>

                {/* Conclusions */}
                <tr className="hover:bg-slate-850/40">
                  <td className="py-3.5 px-3 font-semibold text-slate-400 bg-slate-950/40">Conclusions</td>
                  {comparisonMatrix.map((item, idx) => (
                    <td key={idx} className="py-3.5 px-4 leading-relaxed">
                      {item.conclusions}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Convergences & Divergences */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Agreements */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Verified Convergences (Agreements)
          </h4>
          {agreements.length > 0 ? (
            <div className="space-y-2.5">
              {agreements.map((agr, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-xs">
                  <span className="font-bold text-emerald-300 block mb-1">
                    {agr.topic}
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    {agr.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No explicit agreement claims detected in the provided excerpts.</p>
          )}
        </div>

        {/* Disagreements */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            Empirical Divergences (Disagreements)
          </h4>
          {disagreements.length > 0 ? (
            <div className="space-y-2.5">
              {disagreements.map((dis, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 text-xs">
                  <span className="font-bold text-rose-300 block mb-1">
                    {dis.topic}
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    {dis.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No conflicting claims detected across the provided excerpts.</p>
          )}
        </div>
      </div>

      {/* Research Gaps & Future Directions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Research Gaps */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            Identified Research Gaps
          </h4>
          {researchGaps.length > 0 ? (
            <ul className="space-y-2 text-xs text-slate-300">
              {researchGaps.map((gap, idx) => (
                <li key={idx} className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{gap}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic">No unaddressed gaps noted in the excerpts.</p>
          )}
        </div>

        {/* Future Directions (Labeled as AI hypotheses) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-indigo-400" />
              Future Research Directions
            </h4>
            <span className="text-[10px] text-indigo-300/80 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800">
              AI-Generated Suggestions
            </span>
          </div>
          {futureResearchDirections.length > 0 ? (
            <ul className="space-y-2 text-xs text-slate-300">
              {futureResearchDirections.map((dir, idx) => (
                <li key={idx} className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{dir}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic">No recommendations generated.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ComparisonPanel;
