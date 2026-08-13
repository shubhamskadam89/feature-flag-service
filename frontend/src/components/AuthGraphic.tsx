import React, { useEffect, useState } from 'react';
import { Cpu, Terminal, Shield } from 'lucide-react';

export const AuthGraphic: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([
    'INIT: Edge engine synchronized.',
    'READY: Evaluated v3.0.4 rules.',
  ]);

  // Rolling telemetry logger
  useEffect(() => {
    const keys = ['new_checkout', 'payment_v2', 'beta_access', 'rollout_discount'];
    const regions = ['US-WEST', 'EU-CENTRAL', 'AP-SOUTH', 'SA-EAST'];
    
    const interval = setInterval(() => {
      const time = new Date().toLocaleTimeString();
      const randKey = keys[Math.floor(Math.random() * keys.length)];
      const randRegion = regions[Math.floor(Math.random() * regions.length)];
      const result = Math.random() > 0.4 ? 'TRUE' : 'FALSE';
      const latency = (Math.random() * 0.08 + 0.01).toFixed(3);
      
      const newLog = `[${time}] ${randRegion} · eval(${randKey}) -> ${result} (${latency}ms)`;
      
      setLogs((prev) => {
        const next = [...prev, newLog];
        if (next.length > 5) next.shift();
        return next;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full bg-[#131311] text-white flex flex-col justify-center items-center p-8 md:p-14 select-none relative overflow-hidden font-mono">
      
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid-dark opacity-10 pointer-events-none"></div>

      {/* Glow element */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#c6fd50]/10 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none"></div>

      {/* SVG Edge Nodes Map */}
      <div className="w-full max-w-sm aspect-square shrink-0 relative flex items-center justify-center mb-8">
        
        {/* Animated Connecting Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" fill="none">
          {/* Paths from center to top, bottom-left, bottom-right */}
          <path d="M 192 192 L 192 64" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1.5" />
          <path d="M 192 192 L 72 260" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1.5" />
          <path d="M 192 192 L 312 260" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1.5" />
          
          {/* Pulsing Dot Animations along paths */}
          <circle r="3" fill="#c6fd50">
            <animateMotion dur="2.5s" repeatCount="indefinite" path="M 192 192 L 192 64" />
          </circle>
          <circle r="3" fill="#c6fd50">
            <animateMotion dur="3s" repeatCount="indefinite" path="M 192 192 L 72 260" />
          </circle>
          <circle r="3" fill="#c6fd50">
            <animateMotion dur="2.8s" repeatCount="indefinite" path="M 192 192 L 312 260" />
          </circle>
        </svg>

        {/* Central Core Engine */}
        <div className="absolute w-20 h-20 bg-[#1e1e1c] border-2 border-white/10 rounded-full flex flex-col items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.05)] transition-all duration-300 hover:border-[#c6fd50]">
          <Cpu className="w-6 h-6 text-[#c6fd50] animate-spin" style={{ animationDuration: '8s' }} />
          <span className="text-[7px] font-bold tracking-widest text-white/50 mt-1 uppercase">CORE</span>
        </div>

        {/* Edge Node 1: US-WEST */}
        <div className="absolute top-[20px] left-[157px] flex flex-col items-center gap-1.5">
          <div className="w-8 h-8 rounded bg-[#1e1e1c] border border-[#c6fd50]/40 flex items-center justify-center text-[#c6fd50] text-xs shadow-[0_0_15px_rgba(200,255,0,0.15)] animate-pulse">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <span className="text-[7px] text-white/60 tracking-wider font-bold">US-WEST</span>
        </div>

        {/* Edge Node 2: EU-CENTRAL */}
        <div className="absolute top-[230px] left-[35px] flex flex-col items-center gap-1.5">
          <div className="w-8 h-8 rounded bg-[#1e1e1c] border border-white/15 flex items-center justify-center text-white/60 text-xs hover:border-[#c6fd50] transition-colors">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <span className="text-[7px] text-white/60 tracking-wider font-bold">EU-CENTRAL</span>
        </div>

        {/* Edge Node 3: AP-SOUTH */}
        <div className="absolute top-[230px] left-[277px] flex flex-col items-center gap-1.5">
          <div className="w-8 h-8 rounded bg-[#1e1e1c] border border-[#c6fd50]/40 flex items-center justify-center text-[#c6fd50] text-xs shadow-[0_0_15px_rgba(200,255,0,0.15)] animate-pulse">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <span className="text-[7px] text-white/60 tracking-wider font-bold">AP-SOUTH</span>
        </div>

      </div>

      {/* Rolling Log Terminal */}
      <div className="w-full max-w-sm bg-[#1e1e1c] border border-white/10 rounded overflow-hidden shadow-2xl shrink-0">
        <div className="bg-[#111113] px-3.5 py-2 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3 h-3 text-[#c6fd50]" />
            <span className="text-[8px] font-bold text-white/50 tracking-wider">EDGE_TELEMETRY</span>
          </div>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
          </div>
        </div>

        <div className="p-3 min-h-[105px] font-mono text-[8px] leading-normal text-white/70 space-y-1">
          {logs.map((log, idx) => (
            <div 
              key={idx} 
              className={`transition-all duration-300 ${
                log.includes('TRUE') 
                  ? 'text-[#c6fd50] font-black' 
                  : log.includes('INIT') || log.includes('READY')
                    ? 'text-white/40'
                    : 'text-white/70'
              }`}
            >
              {log}
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
};
