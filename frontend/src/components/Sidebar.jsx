import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MessageSquareText, GitCompare, FileText, UploadCloud, Layers } from 'lucide-react';

export function Sidebar({ documentCount = 0, isOpen = true }) {
  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Overview & Paper Library'
    },
    {
      to: '/research',
      label: 'Research Q&A',
      icon: MessageSquareText,
      description: 'Evidence-Grounded Inquiries'
    },
    {
      to: '/compare',
      label: 'Compare Papers',
      icon: GitCompare,
      description: 'Synthesis & Gap Analysis'
    }
  ];

  return (
    <aside
      className={`fixed md:static inset-y-0 left-0 z-20 w-64 bg-[#0E172E] border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="p-4 space-y-6">
        {/* Navigation links */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Workspace
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <div className="flex flex-col">
                  <span>{item.label}</span>
                  <span className="text-[10px] text-slate-400 font-normal leading-tight">
                    {item.description}
                  </span>
                </div>
              </NavLink>
            );
          })}
        </div>

        {/* Library quick summary */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Document Vault
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {documentCount}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {documentCount === 0
              ? 'Upload your first research PDF to start synthesis.'
              : `${documentCount} paper${documentCount === 1 ? '' : 's'} indexed for evidence retrieval.`}
          </p>
        </div>
      </div>

      {/* Footer info */}
      <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
        <p className="font-medium text-slate-400">ResearchLens AI v1.0</p>
        <p className="text-[10px]">Strict Evidence Grounding</p>
      </div>
    </aside>
  );
}

export default Sidebar;
