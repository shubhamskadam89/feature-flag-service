import { Check, Circle } from 'lucide-react';

interface RolloutSceneProps {
  rolloutPercent: number;
}

const USER_COUNT = 8;

export const RolloutScene: React.FC<RolloutSceneProps> = ({ rolloutPercent }) => {
  const activeCount = Math.round((rolloutPercent / 100) * USER_COUNT);
  const segments = [25, 50, 75, 100];

  return (
    <div className="w-full h-full bg-[#0c0c0d] text-white flex flex-col items-center justify-center p-6 gap-6 select-none overflow-hidden">
      
      {/* Title */}
      <div className="text-center space-y-1 shrink-0">
        <div className="text-[9px] font-mono text-[#d4fe00] tracking-widest uppercase">TRAFFIC GRADIENT</div>
        <div className="text-2xl font-black tracking-tight font-display uppercase">{rolloutPercent}% ROLLOUT</div>
      </div>

      {/* User Grid */}
      <div className="grid grid-cols-4 gap-2.5 w-full max-w-[240px] shrink-0">
        {Array.from({ length: USER_COUNT }).map((_, idx) => {
          const isActive = idx < activeCount;
          return (
            <div
              key={idx}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all duration-500 border ${
                isActive
                  ? 'bg-[#d4fe00] border-[#d4fe00] text-[#0c0c0d] scale-105 shadow-[0_0_12px_rgba(212,254,0,0.3)]'
                  : 'bg-white/5 border-white/10 text-white/30'
              }`}
            >
              <span className="text-base leading-none">
                {isActive ? <Check className="w-4 h-4 stroke-[3]" /> : <Circle className="w-3 h-3 opacity-40" />}
              </span>
              <span className="text-[7px] font-mono mt-0.5 font-bold">{isActive ? 'NEW' : 'OLD'}</span>
            </div>
          );
        })}
      </div>

      {/* Segment Pills */}
      <div className="flex items-center gap-1.5 shrink-0">
        {segments.map((seg) => (
          <div
            key={seg}
            className={`px-2.5 py-1 rounded-full text-[9px] font-mono font-bold transition-all duration-300 ${
              rolloutPercent >= seg
                ? 'bg-[#d4fe00] text-[#0c0c0d]'
                : 'bg-white/5 text-white/30 border border-white/10'
            }`}
          >
            {seg}%
          </div>
        ))}
      </div>

      {/* Status Label */}
      <div className="text-[9px] font-mono text-white/50 text-center leading-relaxed shrink-0">
        {activeCount} of {USER_COUNT} users receiving<br />
        <span className="text-[#d4fe00] font-bold">NEW CHECKOUT EXPERIENCE</span>
      </div>
    </div>
  );
};
