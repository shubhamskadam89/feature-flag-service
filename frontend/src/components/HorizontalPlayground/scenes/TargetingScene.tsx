import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { DeviceFrame } from '../DeviceFrame';
import { ActivationScene } from './ActivationScene';

export const TargetingScene: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-4 select-none overflow-hidden bg-[#0c0c0d]">
      
      {/* Header Info */}
      <div className="text-center shrink-0">
        <div className="text-[9px] font-mono text-[#d4fe00] tracking-widest uppercase">COHORT TARGETING</div>
        <div className="text-sm font-black uppercase text-white tracking-tight">Two Users. One Flag. Different Storefronts.</div>
      </div>

      {/* Side-by-side Devices */}
      <div className="flex items-center gap-6 justify-center scale-[0.80] sm:scale-90 md:scale-100 origin-center shrink-0">
        
        {/* User A — Targeted */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-[8px] font-mono text-[#d4fe00] uppercase tracking-wider font-bold">BETA · INDIA</div>
          <DeviceFrame type="mobile">
            <ActivationScene flagEnabled={true} />
          </DeviceFrame>
          <div className="text-center mt-1">
            <div className="text-[10px] font-bold text-white">Neha Sharma</div>
            <div className="text-[8px] font-mono text-[#d4fe00] flex items-center gap-0.5 mt-0.5 justify-center">
              <CheckCircle2 className="w-2.5 h-2.5" /> FLAG: TRUE
            </div>
          </div>
        </div>

        {/* User B — Not Targeted */}
        <div className="flex flex-col items-center gap-2 opacity-60">
          <div className="text-[8px] font-mono text-white/40 uppercase tracking-wider font-bold">STANDARD · US</div>
          <DeviceFrame type="mobile">
            <ActivationScene flagEnabled={false} />
          </DeviceFrame>
          <div className="text-center mt-1">
            <div className="text-[10px] font-bold text-white/70">John Doe</div>
            <div className="text-[8px] font-mono text-white/30 flex items-center gap-0.5 mt-0.5 justify-center">
              <Circle className="w-2 h-2" /> FLAG: FALSE
            </div>
          </div>
        </div>

      </div>

      {/* Target Rule Badge */}
      <div className="bg-[#161618] border border-white/10 rounded-lg px-3 py-1.5 text-center shrink-0">
        <div className="text-[7px] font-mono text-white/40 uppercase mb-0.5">MATCHING TARGET RULE</div>
        <code className="text-[8px] font-mono text-[#d4fe00] font-bold">beta_user == true && country == 'IN'</code>
      </div>

    </div>
  );
};
export default TargetingScene;
