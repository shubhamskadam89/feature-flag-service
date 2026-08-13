import React from 'react';
import { ArrowDownRight, ShieldCheck, Zap } from 'lucide-react';

interface HeroSectionProps {
  onExploreClick?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onExploreClick }) => {
  return (
    <section className="relative w-full pt-32 pb-20 px-6 md:px-16 flex flex-col justify-center bg-[#fffdf6] text-[#131311] overflow-hidden">
      <div className="absolute inset-0 bg-grid-light opacity-40 pointer-events-none"></div>

      <div className="max-w-2xl relative z-10 space-y-6">
        
        {/* Top Tag */}
        <div className="inline-flex items-center gap-2 bg-[#131311] text-[#c6fd50] px-3.5 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-widest border border-[#c6fd50]/20 shadow-sm">
          <Zap className="w-3 h-3 fill-current text-[#c6fd50]" />
          <span>Official Edge Feature Flag Engine</span>
        </div>

        {/* Display Headline */}
        <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight leading-[0.85] uppercase font-display text-[#131311]">
          ONE PLAN.<br />
          ONE FLAG.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#131311] via-[#131311] to-[#354316]">
            DONE RIGHT.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-[#575755] font-medium leading-relaxed max-w-xl">
          Turn features on, roll them out safely, and control target cohorts — with zero redeploys and &lt;0.05ms edge latency.
        </p>

        {/* Handwritten Annotation */}
        <div className="relative pt-2">
          <span className="font-handwritten text-xl text-emerald-800 -rotate-3 block">
            Try out the live playground on the right! ↓
          </span>
        </div>

        {/* CTA Buttons */}
        <div className="pt-4 flex flex-wrap items-center gap-4">
          <a
            href="#contact"
            className="px-8 py-4 bg-[#131311] text-[#fffdf6] font-display font-black text-xs uppercase tracking-widest rounded-full hover:bg-black transition-all flex items-center gap-2 shadow-xl hover:scale-105 cursor-pointer"
          >
            <span>JOIN WAITLIST</span>
            <ArrowDownRight className="w-4 h-4 text-[#c6fd50]" />
          </a>

          <a
            href="#pricing"
            className="px-8 py-4 bg-[#f3f2ea] text-[#131311] border border-[#131311]/15 font-display font-black text-xs uppercase tracking-widest rounded-full hover:bg-[#eae9e0] transition-all cursor-pointer"
          >
            VIEW PRICING
          </a>

          {onExploreClick && (
            <button
              onClick={onExploreClick}
              className="lg:hidden text-xs font-mono font-bold text-[#131311] underline hover:text-[#575755] cursor-pointer"
            >
              Jump to Demo ↓
            </button>
          )}
        </div>

        {/* Guarantee Badge */}
        <div className="pt-6 border-t border-[#131311]/10 flex items-center gap-3 text-xs font-mono text-[#575755]">
          <div className="w-6 h-6 rounded-full bg-[#c6fd50] text-[#131311] flex items-center justify-center font-bold">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="font-bold text-[#131311]">100% Zero-Downtime Satisfaction Guarantee</span>
        </div>

      </div>
    </section>
  );
};
