import { ArrowUpRight } from 'lucide-react';
import { ReleaseImpactPreview } from './ReleaseImpactPreview';

interface HeroProps {
  onExploreClick?: () => void;
}

export function Hero({ onExploreClick }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-[#fffdf6] px-6 pb-20 pt-32 text-[#131311] md:px-12 md:pb-28 md:pt-40">
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1fr_0.9fr] lg:gap-20">
        <div className="max-w-2xl">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#575755]">
            Feature flags for informed releases
          </p>

          <h1 className="mt-5 font-display text-5xl font-black uppercase leading-[0.9] tracking-[-0.04em] sm:text-6xl md:text-7xl lg:text-8xl">
            Know what your
            <br />
            release will affect.
          </h1>

          <p className="mt-7 max-w-xl text-base font-medium leading-7 text-[#575755] sm:text-lg">
            Define your audience, see the exposure your rollout creates, and understand how targeting or rollout changes affect it — before you make the change.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#simulation"
              onClick={onExploreClick}
              className="inline-flex items-center gap-2 rounded-full bg-[#131311] px-6 py-3 text-xs font-black uppercase tracking-widest text-[#fffdf6] transition-transform hover:scale-[1.02]"
            >
              Try flags.dev
              <ArrowUpRight className="h-4 w-4 text-[#c6fd50]" />
            </a>
            <a
              href="https://github.com/shubhamskadam89/feature-flag-service"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-3 font-mono text-xs font-bold text-[#131311] underline decoration-[#131311]/25 underline-offset-4 hover:decoration-[#131311]"
            >
              View on GitHub
            </a>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#131311]/10 pt-5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#575755]">
            <span>release</span>
            <span>→</span>
            <span>audience</span>
            <span>→</span>
            <span>projected exposure</span>
          </div>
        </div>

        <div className="lg:justify-self-end">
          <ReleaseImpactPreview />
        </div>
      </div>
    </section>
  );
}
