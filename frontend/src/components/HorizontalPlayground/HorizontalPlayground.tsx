import React, { useState, useEffect, useRef } from 'react';
import { DeviceFrame } from './DeviceFrame';
import { ActivationScene } from './scenes/ActivationScene';
import { RollbackScene } from './scenes/RollbackScene';
import { RolloutScene } from './scenes/RolloutScene';
import { TargetingScene } from './scenes/TargetingScene';
import { LatencyScene } from './scenes/LatencyScene';
import { SdkScene } from './scenes/SdkScene';
import { ChevronLeft, ChevronRight, RefreshCw, ToggleLeft, ToggleRight, Sliders } from 'lucide-react';

// ─── Slide Definitions ────────────────────────────────────────────────────────
const slides = [
  {
    id: 0,
    step: '01',
    tag: 'ACTIVATION',
    title: 'TURN IT ON.',
    subtitle: 'Instant Feature Activation',
    desc: 'No deployments. No bundle rebuilds. One toggle. The flag evaluates in-memory and the user sees a completely different experience — instantly.',
    system: 'phone' as const,      // shows DeviceFrame
  },
  {
    id: 1,
    step: '02',
    tag: 'ROLLBACK',
    title: 'TURN IT OFF.',
    subtitle: 'Zero-Downtime Kill Switch',
    desc: 'Pipeline on fire? Server overloading? Disable the flag. The same product reverts to the old experience in 0ms — no redeploy.',
    system: 'phone' as const,
  },
  {
    id: 2,
    step: '03',
    tag: 'ROLLOUT',
    title: 'ROLL IT OUT.',
    subtitle: 'Percentage-Based Traffic Gradients',
    desc: 'Start at 25%. Watch your metrics. When signals look good, push to 75%. Then 100%. Control exposure, not confidence.',
    system: 'open' as const,       // open stage, no phone frame
  },
  {
    id: 3,
    step: '04',
    tag: 'TARGETING',
    title: 'NOT EVERYONE.',
    subtitle: 'Rule-Based Cohort Targeting',
    desc: 'Neha from India on the beta plan gets the new UI. John from the US on standard plan sees the original. Same flag, different worlds.',
    system: 'open' as const,
  },
  {
    id: 4,
    step: '05',
    tag: 'LATENCY',
    title: 'ZERO LATENCY.',
    subtitle: 'In-Memory Edge Evaluation',
    desc: 'No network call to evaluate a flag. The SDK resolves everything locally from a cached rule snapshot — in under 0.05ms.',
    system: 'engineering' as const, // no device frame, dark engineering canvas
  },
  {
    id: 5,
    step: '06',
    tag: 'SDK',
    title: 'DEVELOPER FIRST.',
    subtitle: 'Multi-Language SDK Support',
    desc: 'Drop-in hooks and clients for React, Node.js, Go, Python, and raw cURL. Branch on a flag as naturally as you write an if statement.',
    system: 'engineering' as const,
  },
];

// ─── Per-system stage colors ───────────────────────────────────────────────────
const stageBg: Record<string, string> = {
  phone:       'bg-[#0c0c0d]',
  open:        'bg-[#0c0c0d]',
  engineering: 'bg-[#0c0c0d]',
};

// ─── Component ────────────────────────────────────────────────────────────────
export const HorizontalPlayground: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [flagEnabled, setFlagEnabled]   = useState(true);
  const [rolloutPercent, setRolloutPercent] = useState(25);
  const [isManualOverride, setIsManualOverride] = useState(false);

  const sectionRef = useRef<HTMLDivElement>(null);

  // Scroll → slide progression
  useEffect(() => {
    const onScroll = () => {
      if (!sectionRef.current) return;
      const { top, height } = sectionRef.current.getBoundingClientRect();
      const scrolled = -top;
      const trackHeight = height - window.innerHeight;
      if (trackHeight <= 0) return;
      const progress = Math.max(0, Math.min(1, scrolled / trackHeight));
      const idx = Math.min(slides.length - 1, Math.floor(progress * slides.length));
      setActiveSlide(idx);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Auto-sync flag state to slide
  useEffect(() => {
    if (isManualOverride) return;
    switch (activeSlide) {
      case 0: setFlagEnabled(true);  setRolloutPercent(100); break;
      case 1: setFlagEnabled(false); setRolloutPercent(0);   break;
      case 2: setFlagEnabled(true);  setRolloutPercent(25);  break;
      default: setFlagEnabled(true); setRolloutPercent(100); break;
    }
  }, [activeSlide, isManualOverride]);

  const goTo = (idx: number) => {
    setActiveSlide(Math.max(0, Math.min(slides.length - 1, idx)));
    setIsManualOverride(true);
  };

  const resetSync = () => { setIsManualOverride(false); };

  const current = slides[activeSlide];

  // ─── Scene selector ─────────────────────────────────────────────────────────
  // ─── Stage renderer per active slide ──────────────────────────────────────────
  const renderStage = () => {
    switch (activeSlide) {
      case 0:
        return (
          <DeviceFrame type="mobile">
            <ActivationScene flagEnabled={flagEnabled} />
          </DeviceFrame>
        );
      case 1:
        return (
          <DeviceFrame type="mobile">
            <RollbackScene flagEnabled={flagEnabled} />
          </DeviceFrame>
        );
      case 2:
        return (
          <div className="w-[460px] h-[490px] rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.9)]">
            <RolloutScene rolloutPercent={rolloutPercent} />
          </div>
        );
      case 3:
        // TargetingScene internally mounts two DeviceFrames side-by-side
        return <TargetingScene />;
      case 4:
        return (
          <div className="w-[460px] h-[490px] rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.9)]">
            <LatencyScene />
          </div>
        );
      case 5:
        return (
          <div className="w-[460px] h-[490px] rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.9)]">
            <SdkScene />
          </div>
        );
      default:
        return null;
    }
  };

  // ─── Inline controls per slide ───────────────────────────────────────────────
  const renderControls = () => {
    if (activeSlide === 0 || activeSlide === 1) {
      return (
        <div className="flex items-center gap-3 py-3 px-4 bg-[#161618] border border-white/10 rounded-xl">
          <span className="text-[9px] font-mono text-white/50 uppercase tracking-wider">Global Toggle</span>
          <button
            onClick={() => { setIsManualOverride(true); setFlagEnabled(!flagEnabled); }}
            className="ml-auto cursor-pointer"
          >
            {flagEnabled
              ? <ToggleRight className="w-8 h-8 text-[#d4fe00]" />
              : <ToggleLeft className="w-8 h-8 text-white/30" />}
          </button>
          <span className={`text-[9px] font-mono font-black ${flagEnabled ? 'text-[#d4fe00]' : 'text-white/30'}`}>
            {flagEnabled ? 'ON' : 'OFF'}
          </span>
        </div>
      );
    }

    if (activeSlide === 2) {
      return (
        <div className="py-3 px-4 bg-[#161618] border border-white/10 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-[9px] font-mono">
            <span className="flex items-center gap-1.5 text-white/50 uppercase tracking-wider">
              <Sliders className="w-3 h-3" /> Rollout
            </span>
            <span className="text-[#d4fe00] font-black">{rolloutPercent}%</span>
          </div>
          <input
            type="range" min={0} max={100} step={25}
            value={rolloutPercent}
            onChange={(e) => { setIsManualOverride(true); setRolloutPercent(Number(e.target.value)); setFlagEnabled(Number(e.target.value) > 0); }}
            className="w-full h-1 rounded appearance-none cursor-ew-resize"
            style={{ background: `linear-gradient(to right, #d4fe00 0%, #d4fe00 ${rolloutPercent}%, rgba(255,255,255,0.1) ${rolloutPercent}%, rgba(255,255,255,0.1) 100%)` }}
          />
        </div>
      );
    }

    return null; // slides 3–5 need no external controls
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    /* Outer scroll track: 300vh gives smooth 6-step progression */
    <section
      id="playground"
      ref={sectionRef}
      className="relative w-full h-[300vh] bg-[#0c0c0d]"
    >
      {/* Sticky viewport */}
      <div className="sticky top-0 w-full h-screen flex flex-col overflow-hidden bg-[#0c0c0d]">
        <div className="absolute inset-0 bg-grid-dark opacity-30 pointer-events-none" />

        {/* ── Top bar ── */}
        <div className="relative z-20 flex items-center justify-between px-8 md:px-14 py-4 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono font-black tracking-widest text-[#d4fe00] uppercase">
              SEE IT IN ACTION
            </span>
            <span className="text-white/20 text-xs">/</span>
            <span className="text-[10px] font-mono text-white/40">
              {current.step}—06
            </span>
            {isManualOverride && (
              <button
                onClick={resetSync}
                className="flex items-center gap-1 text-[8px] font-mono font-bold bg-[#d4fe00]/10 text-[#d4fe00] border border-[#d4fe00]/20 px-2 py-0.5 rounded-full hover:bg-[#d4fe00]/20 cursor-pointer transition-all"
              >
                <RefreshCw className="w-2.5 h-2.5" /> Auto Sync
              </button>
            )}
          </div>

          {/* Step pills */}
          <div className="hidden md:flex items-center gap-1">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => goTo(i)}
                className={`w-7 h-7 rounded-full text-[9px] font-mono font-bold transition-all cursor-pointer ${
                  activeSlide === i
                    ? 'bg-[#d4fe00] text-[#0c0c0d] scale-110'
                    : 'bg-white/5 text-white/40 hover:text-white border border-white/10'
                }`}
              >
                {s.step}
              </button>
            ))}
          </div>
        </div>

        {/* ── Main grid ── */}
        <div className="relative z-20 flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden">

          {/* Left column — story + controls */}
          <div className="flex flex-col justify-center px-8 md:px-14 py-6 gap-5 border-r border-white/8">

            {/* Sliding step text */}
            <div className="relative overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${activeSlide * 100}%)` }}
              >
                {slides.map((s) => (
                  <div key={s.id} className="w-full shrink-0 space-y-3 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-black text-[#d4fe00] tracking-widest uppercase">
                        {s.step} / {s.tag}
                      </span>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">{s.subtitle}</div>
                      <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tight font-display text-white leading-none">
                        {s.title}
                      </h3>
                    </div>
                    <p className="text-sm text-white/70 font-medium leading-relaxed max-w-sm">
                      {s.desc}
                    </p>
                    {/* Dynamic slide-specific handwritten annotations */}
                    {s.id === 0 && (
                      <div className="font-handwritten text-lg text-[#d4fe00] -rotate-2 pt-2 animate-pulse">
                        Try toggle! Instantly swaps to "Buy Now" ↓
                      </div>
                    )}
                    {s.id === 1 && (
                      <div className="font-handwritten text-lg text-white/40 rotate-[1deg] pt-2">
                        Hit toggle. Safely roll back in 0ms!
                      </div>
                    )}
                    {s.id === 2 && (
                      <div className="font-handwritten text-lg text-[#d4fe00] -rotate-3 pt-2">
                        Scale user cohort coverage live! ↓
                      </div>
                    )}
                    {s.id === 3 && (
                      <div className="font-handwritten text-lg text-white/40 rotate-[2deg] pt-2">
                        Served dynamically by user rules.
                      </div>
                    )}
                    {s.id === 4 && (
                      <div className="font-handwritten text-lg text-[#d4fe00] rotate-[-1deg] pt-2">
                        Resolves in local memory cache.
                      </div>
                    )}
                    {s.id === 5 && (
                      <div className="font-handwritten text-lg text-white/40 rotate-[3deg] pt-2">
                        Integrates in less than 5 lines.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Inline controls (only for slides that need them) */}
            <div className="max-w-sm">
              {renderControls()}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-4 mt-2">
              <button
                disabled={activeSlide === 0}
                onClick={() => goTo(activeSlide - 1)}
                className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>

              <div className="flex items-center gap-1.5">
                {slides.map((_, i) => (
                  <div
                    key={i}
                    onClick={() => goTo(i)}
                    className={`h-1 rounded-full cursor-pointer transition-all duration-300 ${
                      activeSlide === i ? 'w-6 bg-[#d4fe00]' : 'w-1 bg-white/20 hover:bg-white/40'
                    }`}
                  />
                ))}
              </div>

              <button
                disabled={activeSlide === slides.length - 1}
                onClick={() => goTo(activeSlide + 1)}
                className="p-2 rounded-full bg-[#d4fe00] text-[#0c0c0d] hover:bg-[#e8ff42] disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <span className="text-[9px] font-mono text-white/30 ml-1">SCROLL ↓ TO PROGRESS</span>
            </div>
          </div>

          {/* Right column — scene stage */}
          <div className={`flex items-center justify-center p-8 ${stageBg[current.system]} overflow-hidden`}>
            <div className="transition-all duration-500">
              {renderStage()}
            </div>
          </div>

        </div>

        {/* ── Bottom progress bar ── */}
        <div className="relative z-20 shrink-0 px-8 md:px-14 py-3 border-t border-white/8 flex items-center justify-between text-[8px] font-mono text-white/30">
          <span className="text-[#d4fe00]/60">FEATURE FLAGS ENGINE</span>
          <div className="flex items-center gap-2">
            <div className="w-32 h-[2px] bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#d4fe00] transition-all duration-400 rounded-full"
                style={{ width: `${((activeSlide + 1) / slides.length) * 100}%` }}
              />
            </div>
            <span>{current.step}/06</span>
          </div>
          <span>&lt;0.05ms IN-MEMORY EDGE</span>
        </div>
      </div>
    </section>
  );
};
