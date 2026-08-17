import { useEffect, useRef, useState } from "react";

const STEPS = [
  {
    n: "01",
    label: "Define",
    body: "Choose the contexts your release should reach. Segment by geography, subscription plans, platform dimensions, or user groups.",
    capability: "Evaluation Context",
  },
  {
    n: "02",
    label: "Understand",
    body: "See the audience and projected exposure. Know exactly how many contexts are eligible and how your rule config translates to audience share.",
    capability: "Exposure analysis",
  },
  {
    n: "03",
    label: "Simulate",
    body: "Compare the impact of proposed targeting or rollout changes. Test hypothetical settings to gauge variance before deployment.",
    capability: "Impact simulation",
  },
  {
    n: "04",
    label: "Release",
    body: "Keep evaluation close to your application, with configuration served through the evaluation infrastructure.",
    capability: "Deterministic evaluation",
  },
  {
    n: "05",
    label: "Explain",
    body: "Understand why an individual context received a variation. Trace the deterministic rules and buckets to verify exactly why the context received that variation.",
    capability: "Evaluation explanation",
  },
];

export function WorkflowSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener("resize", checkMobile);
    checkMobile();
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const handleScroll = () => {
      if (!containerRef.current || !trackRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const scrollHeight = containerRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;

      // Calculate vertical scroll progress relative to the container height
      const end = scrollHeight - viewportHeight;
      const current = -rect.top;

      let progress: number;
      if (current < 0) {
        progress = 0;
      } else if (current > end) {
        progress = 1;
      } else {
        progress = current / end;
      }

      setScrollProgress(progress);

      const trackWidth = trackRef.current.scrollWidth;
      const viewportWidth = trackRef.current.parentElement?.offsetWidth || 0;
      const maxTranslate = Math.max(0, trackWidth - viewportWidth);
      setTranslateX(progress * maxTranslate);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isMobile]);

  if (isMobile) {
    // Clean mobile vertical timeline fallback that prevents height/overflow cutoff
    return (
      <section id="workflow" className="border-t border-[var(--color-line)] surface-cream px-5 py-20 sm:px-8">
        <div className="mx-auto w-full max-w-3xl space-y-12">
          
          <div className="space-y-5">
            <p className="label-mono">Release Lifecycle</p>
            <h2 className="font-display text-3xl leading-[1.05] sm:text-4xl md:text-5xl font-black tracking-tight text-[var(--color-foreground)]">
              From configuration to release decision.
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-[var(--color-secondary-text)]">
              flags.dev connects targeting, exposure, deterministic evaluation, and evaluation reasoning into one unified release workflow.
            </p>
          </div>

          <div className="relative space-y-8 pl-6 border-l border-[var(--color-line)] ml-3">
            {STEPS.map((step) => (
              <div key={step.n} className="relative space-y-3">
                {/* Number bullet positioned absolutely on the border-l line */}
                <span className="absolute -left-[35px] top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-lime)] font-mono text-[10px] font-bold text-[var(--color-ink)] border border-[var(--color-line-strong)]">
                  {step.n}
                </span>
                
                <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-3 mb-3">
                    <h3 className="font-display text-base font-bold tracking-tight text-[var(--color-foreground)] uppercase">
                      {step.label}
                    </h3>
                    <span className="rounded-full bg-[var(--color-lime)] px-2.5 py-0.5 font-mono text-[9px] font-bold text-[var(--color-ink)] uppercase tracking-wider">
                      {step.capability}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed text-[var(--color-secondary-text)]">
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>
    );
  }

  // Desktop horizontal sticky scrolling timeline
  return (
    <section 
      ref={containerRef} 
      id="workflow" 
      className="relative h-[350vh] border-t border-[var(--color-line)] surface-cream"
    >
      <div className="sticky top-0 h-screen overflow-hidden flex items-center">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 flex flex-col lg:flex-row gap-12 lg:gap-16 justify-between items-center">
          
          {/* Left Column: Fixed Content */}
          <div className="w-full lg:w-[32%] space-y-6">
            <p className="label-mono">Release Lifecycle</p>
            <h2 className="font-display text-3xl leading-[1.05] sm:text-4xl md:text-5xl font-black tracking-tight text-[var(--color-foreground)]">
              From configuration to release decision.
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-[var(--color-secondary-text)]">
              flags.dev connects targeting, exposure, deterministic evaluation, and evaluation reasoning into one unified release workflow.
            </p>

            <div className="pt-6 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-mono text-[var(--color-muted-text)]">
                <span>TIMELINE PROGRESS</span>
                <span>{(scrollProgress * 100).toFixed(0)}%</span>
              </div>
              <div className="h-1.5 w-full bg-[var(--color-line)]/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[var(--color-lime)] transition-all duration-100 ease-out" 
                  style={{ width: `${scrollProgress * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Horizontal Timeline Track */}
          <div className="w-full lg:w-[65%] overflow-hidden relative">
            {/* Progress Arrow Path Overlay in Background */}
            <div className="absolute left-6 right-6 top-[39px] h-0.5 bg-[var(--color-line)]/40 -z-10">
              <div 
                className="h-full bg-[var(--color-lime)] transition-all duration-75"
                style={{ width: `${scrollProgress * 100}%` }}
              />
            </div>

            <div 
              ref={trackRef} 
              className="flex gap-8 py-8 transition-transform duration-75 ease-out relative"
              style={{ transform: `translate3d(-${translateX}px, 0, 0)` }}
            >
              {STEPS.map((step) => (
                <div 
                  key={step.n} 
                  className="w-[320px] lg:w-[360px] shrink-0 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 transition-all duration-300 hover:border-[var(--color-line-strong)] hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-4 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-surface-subtle)] font-mono text-[10px] font-bold text-[var(--color-muted-text)] border border-[var(--color-line)]">
                        {step.n}
                      </span>
                    </div>
                    <span className="rounded-full bg-[var(--color-lime)] px-2.5 py-0.5 font-mono text-[9px] font-bold text-[var(--color-ink)] uppercase tracking-wider">
                      {step.capability}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold tracking-tight text-[var(--color-foreground)] mb-2 uppercase">
                    {step.label}
                  </h3>
                  <p className="text-xs sm:text-sm leading-relaxed text-[var(--color-secondary-text)]">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
