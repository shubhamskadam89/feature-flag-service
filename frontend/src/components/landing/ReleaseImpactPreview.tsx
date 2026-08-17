import { useEffect, useState } from 'react';

const HERO_EXPOSURE = 63000;

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

export function ReleaseImpactPreview() {
  const exposure = useCountUp(HERO_EXPOSURE);

  return (
    <div className="w-full max-w-xl rounded-3xl border border-[#131311]/15 bg-[#131311] p-5 text-[#fffdf6] shadow-[0_24px_80px_rgba(19,19,17,0.18)] md:p-6">
      <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Impact preview</p>
          <p className="mt-1 font-mono text-sm font-bold">new-checkout</p>
        </div>
        <span className="rounded-full border border-[#c6fd50]/30 bg-[#c6fd50]/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-[#c6fd50]">projected · demo</span>
      </div>

      <div className="py-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Target audience</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {['India', 'PRO plan', 'Android'].map((item) => (
            <span key={item} className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] text-white/85">{item}</span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-5">
        <div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">Rollout</p><p className="mt-2 text-2xl font-black tracking-tight">15%</p></div>
        <div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">Eligible contexts</p><p className="mt-2 text-2xl font-black tracking-tight">420K</p></div>
      </div>

      <div className="mt-4 rounded-2xl border border-[#c6fd50]/20 bg-[#c6fd50]/[0.06] p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#c6fd50]/70">Projected exposure</p>
        <p className="mt-1 text-5xl font-black tracking-[-0.04em] text-[#c6fd50]">{new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(exposure)}</p>
        <p className="mt-1 font-mono text-[10px] text-white/45">63K at current 15% rollout</p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 font-mono text-[10px]">
        <span className="text-white/45">Enterprise affected</span>
        <span className="text-[#c6fd50]">0 · safe</span>
      </div>
    </div>
  );
}
