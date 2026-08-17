import { useEffect, useState } from "react";
import {
  BASELINE_ROLLOUT,
  DIMENSIONS,
  FLAG_KEY,
  computeRelease,
  formatCompact,
  formatFull,
} from "../../lib/release-demo";
import { ButtonLink, Eyebrow, MonoValue } from "./primitives";

const REPO_URL = "https://github.com/shubhamskadam89/feature-flag-service";
const HERO_STATE = computeRelease(["country", "plan", "platform"], BASELINE_ROLLOUT);

/** Counts up once on mount to establish hierarchy — respects reduced motion. */
function useCountUp(target: number, duration = 2400) {
  const [value, setValue] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? target : 0
  );

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

export function HeroSection() {
  const exposure = useCountUp(HERO_STATE.exposure);

  return (
    <section id="top" className="surface-cream pt-16">
      <div className="mx-auto grid w-full max-w-6xl gap-14 px-5 py-20 sm:px-8 md:py-28 lg:grid-cols-[1.05fr_1fr] lg:items-center">
        <div className="space-y-7">
          <Eyebrow>Feature flags for informed releases</Eyebrow>
          <h1 className="text-4xl leading-[1.02] sm:text-5xl md:text-6xl">
            Know what your release will affect.
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-[var(--color-secondary-text)]">
            Define your audience, see the exposure your rollout creates, and understand how
            targeting or rollout changes affect it — before you make the change.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink to="/register" variant="solid">Try flags.dev</ButtonLink>
            <ButtonLink href={REPO_URL} variant="outline">
              View on GitHub
            </ButtonLink>
          </div>
          <p className="font-mono text-xs text-[var(--color-muted-text)]">
            release → audience → projected exposure
          </p>
        </div>

        {/* Impact preview card */}
        <div className="relative overflow-hidden surface-ink rounded-3xl border border-[var(--color-line)] p-6 sm:p-7 shadow-2xl">
          <img
            src="images/earth-hero-card-bg.jpg"
            alt="Earth background"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Use specific dark overlay scrim */}
          <div className="absolute inset-0 bg-black/80" />
          
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
              <MonoValue className="text-sm font-semibold">{FLAG_KEY}</MonoValue>
              <span className="label-mono font-bold text-[var(--color-lime)]">impact preview</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {DIMENSIONS.map((d) => (
                <span
                  key={d.id}
                  className="rounded-full border border-[var(--color-line)] px-3 py-1 font-mono text-[11px] text-[var(--color-secondary-text)] bg-white/5"
                >
                  {d.chip}
                </span>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between font-mono text-xs">
                <span className="text-[var(--color-secondary-text)]">{BASELINE_ROLLOUT}% rollout</span>
                <span className="tabular text-[var(--color-secondary-text)]">
                  {formatFull(HERO_STATE.eligible)} eligible
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-subtle)]">
                <div className="h-full rounded-full bg-[var(--color-lime)]" style={{ width: `${BASELINE_ROLLOUT}%` }} />
              </div>
            </div>

            <div className="border-t border-[var(--color-line)] pt-6">
              <p className="font-display text-6xl leading-none tracking-tight text-[var(--color-lime)] font-black">
                {formatCompact(exposure)}
              </p>
              <p className="label-mono mt-2">projected exposure</p>
            </div>

            <dl className="space-y-2 font-mono text-xs border-t border-[var(--color-line)] pt-4">
              <div className="flex justify-between">
                <dt className="text-[var(--color-secondary-text)]">Enterprise affected</dt>
                <dd className="tabular font-medium">{HERO_STATE.enterpriseExposure}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-secondary-text)]">Rule conflicts</dt>
                <dd className="tabular text-[var(--color-conflict)] font-medium">{HERO_STATE.conflicts}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
