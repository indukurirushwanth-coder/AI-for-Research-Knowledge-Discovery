import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { researchApi } from '../services/api';
import { BookOpen, LogOut, User, Activity, Menu, X, Sparkles } from 'lucide-react';

export function Navbar({ toggleSidebar, sidebarOpen }) {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [health, setHealth] = useState(null);

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await researchApi.getHealth();
        setHealth(res.data);
      } catch (err) {
        setHealth({ status: 'offline' });
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0B132B]/95 backdrop-blur border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand & Mobile Toggle */}
          <div className="flex items-center space-x-3">
            {isAuthenticated && (
              <button
                onClick={toggleSidebar}
                className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
                aria-label="Toggle navigation"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}

            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:bg-indigo-500 transition">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  ResearchLens <span className="text-indigo-400 font-extrabold">AI</span>
                </span>
                <span className="text-[10px] tracking-wider uppercase text-slate-400 font-medium hidden sm:inline">
                  Evidence-Grounded Knowledge Discovery
                </span>
              </div>
            </Link>
          </div>

          {/* Right: Health Badge & User Actions */}
          <div className="flex items-center space-x-4">
            {/* System Status indicator */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full text-xs border border-slate-800 bg-slate-900/60 text-slate-300">
              <span className={`w-2 h-2 rounded-full ${health?.status === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="font-medium">
                {health?.status === 'healthy' ? (
                  health.ai?.geminiConfigured ? 'Gemini 2.5 Active' : 'DB Ready (Local Mode)'
                ) : 'Connecting...'}
              </span>
            </div>

            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-sm font-medium text-slate-200">
                    {user?.fullName || user?.email?.split('@')[0]}
                  </span>
                  <span className="text-xs text-slate-400 truncate max-w-[160px]">
                    {user?.email}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-rose-900/40 hover:text-rose-300 text-slate-300 border border-slate-700 hover:border-rose-800/50 transition cursor-pointer"
                  title="Sign out of ResearchLens"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
