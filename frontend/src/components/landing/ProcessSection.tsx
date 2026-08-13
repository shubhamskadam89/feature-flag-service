import React, { useState } from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';

const steps = [
  {
    num: "1",
    tag: "Kickoff",
    title: "Configure Feature Key",
    desc: "Define your flag key, state defaults, and environment scope in 30 seconds."
  },
  {
    num: "2",
    tag: "Rule Engine",
    title: "Set Targeting Rules",
    desc: "Match users by country, subscription tier, beta flag, or app version."
  },
  {
    num: "3",
    tag: "Progressive Traffic",
    title: "Rollout Percentage",
    desc: "Gradually increase exposure from 5% to 100% while observing telemetry."
  },
  {
    num: "4",
    tag: "Sub-ms Resolution",
    title: "In-Memory Edge Sync",
    desc: "SDKs resolve evaluations locally at under 0.05ms without network block."
  },
  {
    num: "5",
    tag: "Safe Launch",
    title: "Instant Kill Switch",
    desc: "Flaw detected? Turn off the flag instantly with 0ms rollback downtime."
  }
];

export const ProcessSection: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="process" className="w-full py-24 px-6 md:px-16 bg-[#fffdf6] text-[#131311] relative overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-16 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#131311]/15 relative">
          <div className="space-y-3 max-w-xl relative">
            <span className="font-mono text-xs font-bold text-[#131311] uppercase tracking-widest bg-[#f3f2ea] px-3 py-1 rounded-full border border-[#131311]/10">
              5-STEP BULLETPROOF PROCESS
            </span>
            <span className="absolute -top-5 right-6 md:right-20 font-handwritten text-lg text-emerald-800 -rotate-3 hidden sm:inline-block">
              Takes just 5 minutes!
            </span>
            <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tight font-display leading-[0.9]">
              MEET<br />
              FLAGS.DEV
            </h2>
          </div>
          <p className="text-sm md:text-base text-[#575755] font-medium max-w-md">
            We build it, host it, and keep it fast. Our bulletproof process gives you feature flags you can rely on completely.
          </p>
        </div>

        {/* Steps Carousel / Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {steps.map((step, idx) => {
            const isSelected = idx === activeStep;
            return (
              <div
                key={idx}
                onClick={() => setActiveStep(idx)}
                className={`p-6 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between h-72 ${
                  isSelected
                    ? 'bg-[#131311] text-[#fffdf6] border-[#131311] shadow-2xl scale-105'
                    : 'bg-[#f3f2ea] text-[#131311] border-[#131311]/10 hover:border-[#131311]/30'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-black text-sm ${
                      isSelected ? 'bg-[#c6fd50] text-[#131311]' : 'bg-[#131311] text-[#fffdf6]'
                    }`}>
                      {step.num}
                    </span>
                    <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${
                      isSelected ? 'text-[#c6fd50]' : 'text-[#575755]'
                    }`}>
                      {step.tag}
                    </span>
                  </div>

                  <h3 className="text-lg font-black uppercase tracking-tight font-display mb-2">
                    {step.title}
                  </h3>
                  <p className={`text-xs font-medium leading-relaxed ${
                    isSelected ? 'text-white/80' : 'text-[#575755]'
                  }`}>
                    {step.desc}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-[10px] font-mono uppercase font-bold pt-4 border-t border-current/10">
                  {isSelected ? (
                    <span className="text-[#c6fd50] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Step Active
                    </span>
                  ) : (
                    <span className="text-[#575755] flex items-center gap-1">
                      Explore Step <ArrowRight className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Highlight Banner */}
        <div className="p-6 bg-[#f3f2ea] border border-[#131311]/15 rounded-2xl flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-[#131311]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#c6fd50] animate-pulse"></span>
            <span className="font-bold uppercase tracking-wider">All this in under 5 minutes setup time!</span>
          </div>
          <a href="#contact" className="font-bold underline hover:text-[#575755] cursor-pointer">
            Get Started Now ↗
          </a>
        </div>

      </div>
    </section>
  );
};
