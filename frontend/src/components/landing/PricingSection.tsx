import React from 'react';
import { Check, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

const includedFeatures = [
  "Custom-built Feature Engine & Configuration",
  "Sub-0.05ms In-Memory Edge Evaluation",
  "Rule-Based Cohort & Region Targeting",
  "Progressive Percentage Rollouts",
  "Multi-SDK Support (React, Node, Go, cURL)",
  "Real-Time Telemetry & Audit Logs",
  "100% Zero-Downtime Satisfaction Guarantee",
  "One Kickoff Call + Instant Onboarding Support"
];

export const PricingSection: React.FC = () => {
  return (
    <section id="pricing" className="w-full py-24 px-6 md:px-16 bg-[#131311] text-[#fffdf6] relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-dark opacity-20 pointer-events-none"></div>

      <div className="max-w-4xl mx-auto space-y-12 relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#c6fd50] bg-[#c6fd50]/10 border border-[#c6fd50]/20 px-3.5 py-1 rounded-full inline-block">
            Transparent Pricing
          </span>
          <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tight font-display">
            One Price. One Plan.
          </h2>
          <p className="text-[#a3a3a1] text-base font-medium max-w-lg mx-auto">
            We host it, we power it, you own it. Everything included. No hidden per-seat traps.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="bg-[#1e1e1c] border border-white/15 rounded-3xl p-8 md:p-12 space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-[#c6fd50] text-[#131311] font-mono font-black text-[9px] uppercase px-4 py-1.5 rounded-bl-xl tracking-widest">
            THE ONE PLAN
          </div>

          <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4 pb-8 border-b border-white/10 relative">
            <div>
              <div className="flex items-baseline gap-2 relative">
                <span className="text-6xl md:text-8xl font-black font-display text-white tracking-tight">
                  $100
                </span>
                <span className="text-xl font-mono text-[#c6fd50] font-bold">USD</span>
                <span className="absolute -top-7 left-32 font-handwritten text-lg text-[#c6fd50] -rotate-6 hidden sm:inline-block">
                  No hidden per-seat traps!
                </span>
              </div>
              <p className="text-xs font-mono text-white/60 uppercase tracking-widest mt-1">
                Per month · Everything Included · Cancel Anytime
              </p>
            </div>

            <a
              href="#contact"
              className="px-8 py-4 bg-[#c6fd50] text-[#131311] font-display font-black text-xs uppercase tracking-widest rounded-full hover:bg-[#d4ff66] transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <span>JOIN WAITLIST</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Checklist */}
          <div className="space-y-4">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#c6fd50]">
              WHAT’S INCLUDED:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm font-display font-medium text-white/90">
              {includedFeatures.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#c6fd50]/15 text-[#c6fd50] flex items-center justify-center shrink-0 font-bold">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dev Care Plan Box */}
          <div className="bg-[#292927] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#c6fd50] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Dev Care+ Plan (Optional)
              </div>
              <p className="text-xs text-white/70 font-medium">
                Get instant access to our core dev team for priority custom rule integrations & SLA guarantees.
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xl font-black font-display text-white">+$30</span>
              <span className="text-xs font-mono text-white/60"> USD p/m</span>
            </div>
          </div>

          {/* Guarantee Banner */}
          <div className="p-4 bg-[#c6fd50]/10 border border-[#c6fd50]/20 rounded-xl flex items-center gap-3 text-xs font-mono text-white/80">
            <ShieldCheck className="w-5 h-5 text-[#c6fd50] shrink-0" />
            <span>
              <strong>100% Satisfaction Guarantee:</strong> If Flags.Dev doesn't save your engineering team time in 14 days, get a 100% full refund with zero questions asked.
            </span>
          </div>

        </div>

      </div>
    </section>
  );
};
