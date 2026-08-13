import React from 'react';
import { Cpu, ArrowDown, Check, X } from 'lucide-react';

export const LatencyScene: React.FC = () => {
  const steps = [
    { label: 'Application', sub: 'HTTP GET /checkout', active: true },
    { label: 'SDK Cache', sub: 'local rules snapshot', active: true },
    { label: 'Memory Eval', sub: 'FeatureFlagService.eval()', active: true },
    { label: 'Response', sub: '{ enabled: true }', active: true },
  ];

  return (
    <div className="w-full h-full bg-[#0c0c0d] flex flex-col items-center justify-center p-6 gap-5 select-none overflow-hidden">
      
      {/* Title */}
      <div className="text-center shrink-0">
        <div className="text-[9px] font-mono text-[#d4fe00] tracking-widest uppercase mb-0.5">IN-MEMORY EVALUATION FLOW</div>
        <div className="text-lg font-black uppercase tracking-tight font-display text-white">Zero Network Hops.</div>
      </div>

      {/* Flow Diagram */}
      <div className="flex flex-col items-center gap-0 w-full max-w-[220px] shrink-0">
        {steps.map((step, idx) => (
          <React.Fragment key={idx}>
            <div className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-300 ${
              step.active
                ? 'bg-[#161618] border-[#d4fe00]/30 text-white'
                : 'bg-[#101012] border-white/10 text-white/30'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                step.active ? 'bg-[#d4fe00] text-[#0c0c0d]' : 'bg-white/5 text-white/30'
              }`}>
                {step.active ? <Check className="w-3 h-3 font-black" /> : <X className="w-3 h-3" />}
              </div>
              <div>
                <div className="text-[10px] font-bold font-display">{step.label}</div>
                <div className="text-[8px] font-mono text-white/50">{step.sub}</div>
              </div>
            </div>

            {idx < steps.length - 1 && (
              <div className="flex flex-col items-center py-0.5">
                <ArrowDown className="w-3 h-3 text-[#d4fe00]/50" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Latency Badge */}
      <div className="bg-[#d4fe00] text-[#0c0c0d] rounded-full px-5 py-2 flex items-center gap-2 shadow-[0_0_20px_rgba(212,254,0,0.25)] shrink-0">
        <Cpu className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
        <div>
          <div className="text-xs font-black font-mono">0.042ms</div>
          <div className="text-[7px] font-bold uppercase tracking-wider">IN-MEMORY · NO NETWORK</div>
        </div>
      </div>
    </div>
  );
};
