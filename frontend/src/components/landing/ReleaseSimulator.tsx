import { useMemo, useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";
import {
  BASELINE_ROLLOUT,
  DIMENSIONS,
  FLAG_KEY,
  SAMPLE_BUCKET,
  SAMPLE_CONTEXT_ID,
  buildTrace,
  computeRelease,
  formatCompact,
  formatDelta,
  formatFull,
  traceVariation,
  type DimensionId,
} from "../../lib/release-demo";
import { MonoValue } from "./primitives";

/**
 * Interactive evaluation console.
 * Integrates a load animation from 15% to 25% to demonstrate exposure delta,
 * styled in dark console aesthetic with high-contrast surfaces and vivid lime indicators.
 */
export function ReleaseSimulator({ compact = false }: { compact?: boolean }) {
  const [selected, setSelected] = useState<DimensionId[]>(["country", "plan", "platform"]);
  const [rollout, setRollout] = useState(BASELINE_ROLLOUT);
  const [traceOpen, setTraceOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);

  // Animate target from 15% to 25% on mount to demonstrate causality
  useEffect(() => {
    if (!isAnimating) return;

    const timer = setTimeout(() => {
      let val = BASELINE_ROLLOUT;
      const target = 25;
      const interval = setInterval(() => {
        val += 1;
        setRollout(val);
        if (val >= target) {
          clearInterval(interval);
          setIsAnimating(false);
        }
      }, 70); // Smooth stepping duration

      return () => clearInterval(interval);
    }, 1000); // Give user a brief anchor moment to see base state before animation starts

    return () => clearTimeout(timer);
  }, [isAnimating]);

  const state = useMemo(() => computeRelease(selected, rollout), [selected, rollout]);
  const trace = useMemo(() => buildTrace(selected, rollout), [selected, rollout]);
  const variation = traceVariation(selected, rollout);

  function toggle(id: DimensionId) {
    setIsAnimating(false); // Stop animation on manual user interaction
    setSelected((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
  }

  return (
    <div className="rounded-3xl border border-white/15 bg-[#141412] text-[#fffdf6] shadow-2xl transition-all duration-300 hover:border-white/25 overflow-hidden">
      
      {/* Console Status Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5 sm:px-6 bg-[#1a1a17]">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            {variation === "ON" ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c6fd50] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#c6fd50]" />
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white/20" />
            )}
          </span>
          <MonoValue className="text-sm font-bold tracking-tight text-white">{FLAG_KEY}</MonoValue>
        </div>
        <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-wider">
          <span className="px-2 py-0.5 rounded border border-white/10 text-white/70 bg-white/5 font-semibold">
            env: prod-sim
          </span>
          <span className="text-[#c6fd50] font-semibold flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#c6fd50]" />
            online
          </span>
        </div>
      </div>

      <div className={cn("grid gap-0", compact ? "" : "lg:grid-cols-[1.1fr_0.9fr]")}>
        
        {/* Left Column: Interactive Console Controls */}
        <div className="space-y-6 p-5 sm:p-6">
          
          {/* WHO — Targeting Rules (Manus Chip Box) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between font-mono">
              <span className="text-[10px] text-white/60 uppercase tracking-wider font-semibold">who — targeting rules</span>
              <span className="text-[9px] text-[#c6fd50] bg-[#c6fd50]/15 px-2 py-0.5 rounded border border-[#c6fd50]/30 uppercase tracking-widest font-semibold">
                {selected.length > 0 ? `${selected.length} active` : "global rollout"}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-2 items-center min-h-[42px] p-2.5 rounded-xl border border-white/10 bg-[#1a1a17]">
              {/* Render active dimension chips first */}
              {DIMENSIONS.filter((d) => selected.includes(d.id)).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggle(d.id)}
                  className="font-mono text-xs bg-[#c6fd50]/15 text-[#c6fd50] border border-[#c6fd50]/40 px-2.5 py-1 rounded-lg flex items-center gap-1.5 hover:bg-[#c6fd50]/25 cursor-pointer transition-colors shadow-sm font-semibold"
                >
                  <span>{d.chip}</span>
                  <span className="text-[10px] opacity-70">×</span>
                </button>
              ))}

              {/* Render inactive dimensions with dashed outlines to add */}
              {DIMENSIONS.filter((d) => !selected.includes(d.id)).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggle(d.id)}
                  className="font-mono text-xs border border-dashed border-white/20 text-white/70 px-2.5 py-1 rounded-lg flex items-center gap-1.5 hover:border-white/40 hover:text-white cursor-pointer transition-colors"
                >
                  <span>+ {d.chip}</span>
                </button>
              ))}
              
              {selected.length === 0 && (
                <span className="text-[11px] font-mono text-white/50 italic pl-1">
                  All contexts match (100% targeting scope)
                </span>
              )}
            </div>
          </div>

          {/* HOW MUCH — Rollout Control Panel */}
          <div className="space-y-3">
            <div className="flex items-center justify-between font-mono">
              <label htmlFor="rollout-slider" className="text-[10px] text-white/60 uppercase tracking-wider font-semibold">
                how much — rollout
              </label>
              <div className="flex items-center gap-2">
                {isAnimating && (
                  <span className="text-[9px] text-[#ffbf00] animate-pulse uppercase tracking-wider font-semibold">
                    running trace...
                  </span>
                )}
                <span className="text-xs font-bold text-[#c6fd50] bg-[#c6fd50]/15 border border-[#c6fd50]/30 px-2.5 py-0.5 rounded font-mono">
                  {rollout}%
                </span>
              </div>
            </div>

            <div className="relative flex flex-col sm:flex-row items-center gap-4 bg-[#1a1a17] border border-white/10 rounded-xl p-3.5">
              <input
                id="rollout-slider"
                type="range"
                min={0}
                max={100}
                step={5}
                value={rollout}
                onChange={(e) => {
                  setIsAnimating(false);
                  setRollout(Number(e.target.value));
                }}
                aria-valuetext={`${rollout} percent rollout`}
                className="h-2 w-full sm:flex-1 cursor-pointer appearance-none rounded-full bg-[#0e0e0c] border border-white/20 transition-all focus:outline-none"
                style={{ accentColor: "#c6fd50" }}
              />
              
              <div className="flex gap-1.5 shrink-0 w-full sm:w-auto justify-between sm:justify-start">
                {[0, 15, 25, 50, 100].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      setIsAnimating(false);
                      setRollout(v);
                    }}
                    className={cn(
                      "px-2.5 py-1 font-mono text-[10px] border rounded-md transition-all cursor-pointer shadow-sm flex-1 sm:flex-initial text-center font-semibold",
                      rollout === v
                        ? "border-[#c6fd50] text-[#c6fd50] bg-[#c6fd50]/15 font-bold shadow-[0_0_10px_rgba(198,253,80,0.15)]"
                        : "border-white/10 text-white/60 hover:border-white/30 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    {v}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* WHY — Terminal Trace Console */}
          <div className="rounded-xl border border-white/10 bg-[#1a1a17] shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setTraceOpen((o) => !o)}
              aria-expanded={traceOpen}
              className="flex w-full items-center justify-between px-4 py-3 text-left cursor-pointer hover:bg-white/[0.03] transition-colors"
            >
              <span className="font-mono text-[10px] text-white/70 uppercase tracking-wider font-semibold">why — evaluation trace</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] text-white/50">
                  {traceOpen ? "Collapse log" : "Expand log"}
                </span>
                <ChevronRight
                  className={cn("h-3.5 w-3.5 transition-transform text-white/60", traceOpen && "rotate-90 text-[#c6fd50]")}
                  aria-hidden
                />
              </div>
            </button>
            
            {traceOpen && (
              <div className="space-y-2 border-t border-white/10 bg-[#0e0e0c] p-4 font-mono text-[10px] leading-relaxed text-white/70">
                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                  <span className="text-white/40 text-[8px] uppercase tracking-wider font-bold">SYSTEM EVALUATION TRACE</span>
                  <span className="text-white/50 text-[8px] tabular">
                    ctx_id: {SAMPLE_CONTEXT_ID} | bucket: {SAMPLE_BUCKET.toFixed(2)}
                  </span>
                </div>
                {trace.map((line, idx) => (
                  <div key={idx} className="flex justify-between gap-4 py-0.5">
                    <span className="text-white/80">
                      <span className="text-[#c6fd50] mr-1.5 font-bold">$</span>
                      {line.rule}
                    </span>
                    <span className={cn("font-semibold text-right", line.pass ? "text-[#c6fd50]" : "text-[#ff6b6b]")}>
                      {line.pass ? "MATCH" : "MISMATCH"} (variation: {line.result})
                    </span>
                  </div>
                ))}
                <div className="border-t border-white/10 pt-2 mt-2 flex justify-between items-center font-bold">
                  <span className="text-white text-[9px] uppercase tracking-wider">RESOLVED VARIATION</span>
                  <span className={cn("px-2 py-0.5 rounded text-[10px]", variation === "ON" ? "bg-[#c6fd50]/15 text-[#c6fd50] border border-[#c6fd50]/30" : "bg-white/5 text-white/60 border border-white/10")}>
                    {variation}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Precise Impact Dashboard */}
        <div className="flex flex-col justify-between space-y-6 border-t border-white/10 p-5 sm:p-6 lg:border-t-0 lg:border-l lg:border-white/10 lg:bg-[#171714]/60">
          
          {/* Main Stats Header */}
          <div className="space-y-1">
            <p className="font-mono text-[10px] text-white/60 uppercase tracking-wider font-semibold">Projected Active Exposure</p>
            <div className="flex items-baseline gap-2">
              <p
                key={state.exposure}
                className="animate-value-tick font-display text-5xl font-black tracking-tight text-[#c6fd50]"
              >
                {formatCompact(state.exposure)}
              </p>
              <span className="text-[11px] font-mono text-white/50 lowercase">
                / {formatCompact(state.eligible)} eligible contexts
              </span>
            </div>
          </div>

          {/* Released vs Proposed Comparison Matrix */}
          <div className="grid grid-cols-2 gap-4 border border-white/10 bg-[#1a1a17] rounded-xl p-4 font-mono">
            {/* Released (Baseline) */}
            <div className="space-y-1">
              <span className="text-[8px] text-white/50 uppercase tracking-wider block font-bold">Released</span>
              <span className="text-xl font-bold text-white/80 block">
                {BASELINE_ROLLOUT}%
              </span>
              <span className="text-[11px] text-white/50 block">
                {formatCompact(state.baselineExposure)} exposure
              </span>
            </div>

            {/* Proposed (Target) */}
            <div className="space-y-1 border-l border-white/10 pl-4">
              <span className="text-[8px] text-[#c6fd50] uppercase tracking-wider block font-bold">Proposed</span>
              <span className="text-xl font-bold text-[#c6fd50] block">
                {rollout}%
              </span>
              <span className="text-[11px] text-white block animate-value-tick font-semibold">
                {formatCompact(state.exposure)} exposure
              </span>
            </div>
          </div>

          {/* Exposure Shift (Variance Delta) */}
          <div className="flex items-center justify-between border border-white/10 bg-[#1a1a17] rounded-xl p-3.5 font-mono">
            <div>
              <span className="text-[8px] text-white/50 uppercase tracking-wider block font-bold">Exposure Delta</span>
              <span className="text-[11px] text-white/80 block font-medium">
                {formatFull(state.eligible)} eligible total
              </span>
            </div>
            <div className="text-right">
              <span className={cn(
                "text-lg font-black tracking-tight block animate-value-tick",
                state.delta > 0 ? "text-[#ffbf00]" : state.delta < 0 ? "text-[#c6fd50]" : "text-white/60"
              )}>
                {formatDelta(state.delta)}
              </span>
              <span className="text-[8px] text-white/50 uppercase tracking-wider block">
                audience shift
              </span>
            </div>
          </div>

          {/* Console Parameter Checklist (Metadata Grid) */}
          <div className="space-y-2.5 border-t border-white/10 pt-4 font-mono text-[9px] uppercase tracking-wider">
            <div className="flex justify-between items-center py-1">
              <span className="text-white/50 font-semibold">Plan Distribution</span>
              <span className="font-bold text-white/90">
                {state.planMix.map((p) => `${p.label} ${p.share}%`).join(" / ")}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-white/50 font-semibold">Enterprise Affected</span>
              <div className="flex items-center gap-1.5">
                <span className={cn("inline-block h-1.5 w-1.5 rounded-full", state.enterpriseExposure > 0 ? "bg-[#ffbf00] animate-pulse" : "bg-[#c6fd50]")} />
                <span className={cn("font-bold", state.enterpriseExposure > 0 ? "text-[#ffbf00]" : "text-white")}>
                  {state.enterpriseExposure > 0 ? formatCompact(state.enterpriseExposure) : "0"}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-white/50 font-semibold">Rule Conflicts</span>
              <div className="flex items-center gap-1.5">
                <span className={cn("inline-block h-1.5 w-1.5 rounded-full", state.conflicts > 0 ? "bg-[#ff6b6b] animate-pulse" : "bg-[#c6fd50]")} />
                <span className={cn("font-bold", state.conflicts > 0 ? "text-[#ff6b6b]" : "text-white")}>
                  {state.conflicts > 0 ? `${state.conflicts} active` : "none"}
                </span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
