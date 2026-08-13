import React from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';

const painPoints = [
  {
    quote: "The last deployment broke production for 2 hours",
    author: "Sound Familiar?"
  },
  {
    quote: "Why does a simple rollback take 45 minutes of CI build time?",
    author: "DevOps Fatigue"
  },
  {
    quote: "Staging environment never matches actual production behavior",
    author: "Environment Mismatch"
  },
  {
    quote: "Marketing has to wait on eng deploys for campaign launches",
    author: "Bottleneck Release"
  },
  {
    quote: "We've been burned by accidental feature leaks before",
    author: "Risk Exposure"
  },
  {
    quote: "Enterprise flag platforms charge $40,000/yr per seat",
    author: "Overpriced SaaS"
  }
];

export const SoundFamiliar: React.FC = () => {
  return (
    <section className="w-full py-24 px-6 md:px-16 bg-[#131311] text-[#fffdf6] relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-dark opacity-20 pointer-events-none"></div>

      <div className="max-w-4xl mx-auto space-y-12 relative z-10">
        
        {/* Section Title */}
        <div className="text-center space-y-4 relative">
          <span className="font-mono text-[#c6fd50] text-xs font-bold uppercase tracking-widest bg-[#c6fd50]/10 border border-[#c6fd50]/20 px-3 py-1 rounded-full inline-block">
            Sound Familiar?
          </span>
          <span className="absolute top-0 right-4 md:right-24 font-handwritten text-lg text-[#c6fd50] rotate-6 hidden sm:inline-block">
            We've all been there...
          </span>
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight font-display leading-tight">
            Your Feature Releases Shouldn’t Feel Like a Never-Ending Checklist.
          </h2>
          <p className="text-[#a3a3a1] text-base font-medium max-w-2xl mx-auto">
            One decision and you're done. No complex enterprise seats, no delayed CI pipelines, no more praying during Friday deploys.
          </p>
        </div>

        {/* Pain points grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {painPoints.map((item, idx) => (
            <div
              key={idx}
              className="bg-[#1e1e1c] border border-white/10 rounded-xl p-6 flex flex-col justify-between hover:border-[#c6fd50]/40 transition-all duration-300 group"
            >
              <div className="space-y-3">
                <AlertCircle className="w-5 h-5 text-[#c6fd50] group-hover:rotate-12 transition-transform" />
                <p className="text-sm font-display font-medium text-white/90 leading-snug">
                  "{item.quote}"
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 text-[10px] font-mono text-white/40 uppercase tracking-wider">
                {item.author}
              </div>
            </div>
          ))}
        </div>

        {/* Banner Callout */}
        <div className="bg-[#c6fd50] text-[#131311] rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-2 text-center md:text-left">
            <div className="font-mono text-xs uppercase tracking-widest font-black text-[#131311]/70">
              SIMPLE EDGE ARCHITECTURE
            </div>
            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight font-display">
              We Make Launching Features Insanely Simple.
            </h3>
          </div>

          <a
            href="#contact"
            className="px-6 py-3.5 bg-[#131311] text-[#fffdf6] font-display font-black text-xs uppercase tracking-widest rounded-full hover:bg-black transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <span>START YOUR PROJECT</span>
            <ArrowRight className="w-4 h-4 text-[#c6fd50]" />
          </a>
        </div>

      </div>
    </section>
  );
};
