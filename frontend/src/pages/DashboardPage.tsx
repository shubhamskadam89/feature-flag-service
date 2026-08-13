import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlagAdminPanel } from '../components/FlagAdminPanel';
import { LogOut, Layout, Terminal, Database, ShieldCheck } from 'lucide-react';

interface UserData {
  name: string;
  email: string;
}

export const DashboardPage: React.FC = () => {
  const [user] = useState<UserData | null>(() => {
    const savedUserStr = localStorage.getItem('user');
    if (savedUserStr) {
      try {
        return JSON.parse(savedUserStr);
      } catch {
        return { name: 'Developer User', email: 'dev@flags.dev' };
      }
    }
    return { name: 'Developer User', email: 'dev@flags.dev' };
  });
  const [flagEnabled, setFlagEnabled] = useState(true);
  const [rolloutPercent, setRolloutPercent] = useState(75);
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear all client auth state
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect to public homepage
    navigate('/');
  };

  return (
    <div className="w-full min-h-screen bg-[#131311] text-[#fffdf6] flex flex-col font-mono select-none relative">
      
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid-dark opacity-10 pointer-events-none"></div>

      {/* Main header navbar */}
      <header className="relative z-10 shrink-0 px-8 py-5 border-b border-white/10 flex items-center justify-between bg-[#131311]/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-[#c6fd50] text-[#131311] rounded-full flex items-center justify-center font-black text-xs">
            ⚡
          </div>
          <span className="font-display font-black text-base uppercase tracking-tight text-white">
            FLAGS<span className="text-[#c6fd50]">.DEV</span>
          </span>
        </div>

        {/* User profile & Logout */}
        <div className="flex items-center gap-6 text-xs">
          {user && (
            <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-white/80">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c6fd50] animate-pulse"></span>
              <span>{user.name} ({user.email})</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/15 rounded hover:bg-red-500/10 hover:border-red-500/30 text-white/90 hover:text-red-400 transition-all cursor-pointer font-bold"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </header>

      {/* Dashboard container */}
      <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 p-8 md:p-14 max-w-7xl mx-auto w-full items-start">
        
        {/* Left column: Overview stats & Environments list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1e1e1c] border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-white/40 uppercase tracking-widest text-[9px] font-bold">
              <Layout className="w-3.5 h-3.5 text-[#c6fd50]" /> Overview
            </div>
            <h2 className="text-2xl md:text-3xl font-black font-display uppercase tracking-tight text-white leading-none">
              Console Dashboard
            </h2>
            <p className="text-white/60 text-xs font-sans leading-relaxed">
              Your feature flag service is live at the edge. The REST endpoints will immediately fetch in-memory configurations in under 0.05 milliseconds.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="bg-[#131311]/50 border border-white/5 p-4 rounded-xl space-y-1">
                <div className="text-[8px] text-white/40 uppercase font-bold">EVALUATIONS</div>
                <div className="text-xl font-bold font-display text-[#c6fd50]">1,402 / sec</div>
              </div>
              <div className="bg-[#131311]/50 border border-white/5 p-4 rounded-xl space-y-1">
                <div className="text-[8px] text-white/40 uppercase font-bold">ACTIVE FLAGS</div>
                <div className="text-xl font-bold font-display text-white">4 Configured</div>
              </div>
              <div className="bg-[#131311]/50 border border-white/5 p-4 rounded-xl space-y-1">
                <div className="text-[8px] text-white/40 uppercase font-bold">EDGE LATENCY</div>
                <div className="text-xl font-bold font-display text-[#c6fd50]">0.04 ms</div>
              </div>
            </div>
          </div>

          {/* Telemetry Console */}
          <div className="bg-[#1e1e1c] border border-white/10 rounded-2xl overflow-hidden">
            <div className="bg-[#191917] px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#c6fd50]" />
                <span className="text-[10px] font-bold text-white/60 uppercase">Telemetry Audit Log</span>
              </div>
              <div className="text-[8px] text-[#c6fd50] font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c6fd50] animate-ping" />
                STREAMING_LIVE
              </div>
            </div>
            <div className="p-6 font-mono text-[9px] leading-relaxed text-white/65 space-y-2 bg-[#131311]/40 min-h-[160px]">
              <div>[15:00:01] US-WEST · Fetching rule configuration snapshot... 200 OK</div>
              <div>[15:00:01] AP-SOUTH · Resolved flag "new_checkout" to TRUE (0.038ms)</div>
              <div>[15:00:02] EU-CENTRAL · Resolved flag "signup_captcha" to FALSE (0.042ms)</div>
              <div className="text-white/40 animate-pulse">// Waiting for telemetry events...</div>
            </div>
          </div>
        </div>

        {/* Right column: Interactive Flag Configuration tool */}
        <div className="space-y-6">
          <div className="bg-[#1e1e1c] border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/40 uppercase tracking-widest text-[9px] font-bold">
                <Database className="w-3.5 h-3.5 text-[#c6fd50]" /> Rule Configurator
              </div>
            </div>
            
            <FlagAdminPanel
              flagEnabled={flagEnabled}
              rolloutPercent={rolloutPercent}
              onToggle={setFlagEnabled}
              onRolloutChange={setRolloutPercent}
              showRollout={true}
              showTargeting={true}
            />

            <div className="p-4 bg-[#c6fd50]/5 border border-[#c6fd50]/15 rounded-xl flex items-start gap-3 text-[9px] text-[#c6fd50]/80">
              <ShieldCheck className="w-5 h-5 text-[#c6fd50] shrink-0" />
              <span>
                Evaluating live rule conditions. Any changes made to rules or percentage toggles are synchronized globally in milliseconds.
              </span>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 shrink-0 px-8 py-4 border-t border-white/8 flex items-center justify-between text-[8px] text-white/30 mt-auto">
        <span>FLAGS.DEV SYSTEM STABLE</span>
        <span>CONNECTED</span>
      </footer>

    </div>
  );
};

export default DashboardPage;
