import React from 'react';
import { Check, X } from 'lucide-react';

export const ComparisonTable: React.FC = () => {
  return (
    <section id="why-us" className="w-full py-24 px-6 md:px-16 bg-[#f3f2ea] text-[#131311] relative overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-12 relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto relative">
          <span className="font-mono text-xs font-bold uppercase tracking-widest bg-[#131311] text-[#c6fd50] px-3.5 py-1 rounded-full inline-block">
            Why Partner With Us?
          </span>
          <span className="absolute -top-4 right-10 md:right-32 font-handwritten text-lg text-emerald-800 rotate-6 hidden sm:inline-block">
            Why pay $40,000/year?
          </span>
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight font-display">
            It’s a No-Brainer. Why Wouldn’t You?!
          </h2>
          <p className="text-[#575755] text-sm md:text-base font-medium">
            Whether you’re comparing in-house DIY scripts or legacy enterprise SaaS platforms, Flags.Dev removes the latency, complexity, and massive overhead.
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left border-collapse font-display">
            <thead>
              <tr className="border-b border-[#131311]/15">
                <th className="py-4 px-6 text-xs font-mono font-bold uppercase tracking-widest text-[#575755] w-1/4">
                  Feature
                </th>
                <th className="py-4 px-6 text-xs font-mono font-bold uppercase tracking-widest text-[#575755] w-1/4">
                  DIY In-House Code
                </th>
                <th className="py-4 px-6 text-xs font-mono font-bold uppercase tracking-widest text-[#575755] w-1/4">
                  Legacy Enterprise SaaS
                </th>
                <th className="py-4 px-6 text-xs font-mono font-bold uppercase tracking-widest text-[#131311] bg-[#c6fd50] rounded-t-xl w-1/4">
                  <div className="flex items-center gap-1.5 font-black text-sm">
                    <img src="/logo-icon.png" className="w-4 h-4 object-contain" alt="" /> Flags.Dev
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#131311]/10 text-sm">
              <tr>
                <td className="py-5 px-6 font-bold uppercase tracking-tight">Setup Time</td>
                <td className="py-5 px-6 text-[#575755]">3 - 6 Weeks Dev Time</td>
                <td className="py-5 px-6 text-[#575755]">1 - 2 Months Onboarding</td>
                <td className="py-5 px-6 bg-[#c6fd50]/15 font-black text-[#131311]">Live in 5 Minutes</td>
              </tr>
              <tr>
                <td className="py-5 px-6 font-bold uppercase tracking-tight">Pricing Model</td>
                <td className="py-5 px-6 text-[#575755]">$10k+ Dev Salary Hours</td>
                <td className="py-5 px-6 text-[#575755]">$30k - $80k/yr Per Seat</td>
                <td className="py-5 px-6 bg-[#c6fd50]/15 font-black text-[#131311]">$100 / Month Flat</td>
              </tr>
              <tr>
                <td className="py-5 px-6 font-bold uppercase tracking-tight">Evaluation Latency</td>
                <td className="py-5 px-6 text-[#575755]">Database Bottlenecks (50ms+)</td>
                <td className="py-5 px-6 text-[#575755]">Network Hops (20-40ms)</td>
                <td className="py-5 px-6 bg-[#c6fd50]/15 font-black text-[#131311]">&lt; 0.05ms In-Memory Edge</td>
              </tr>
              <tr>
                <td className="py-5 px-6 font-bold uppercase tracking-tight">Targeting Engine</td>
                <td className="py-5 px-6 text-[#575755]">Hardcoded IF Statements</td>
                <td className="py-5 px-6 text-[#575755]">Over-complicated Rules</td>
                <td className="py-5 px-6 bg-[#c6fd50]/15 font-black text-[#131311]">Visual Cohort Rules</td>
              </tr>
              <tr>
                <td className="py-5 px-6 font-bold uppercase tracking-tight">Zero Downtime Guarantee</td>
                <td className="py-5 px-6 text-[#575755]"><X className="w-4 h-4 text-red-500 inline" /> No Guarantee</td>
                <td className="py-5 px-6 text-[#575755]">Contact Sales for SLA</td>
                <td className="py-5 px-6 bg-[#c6fd50]/15 font-black text-[#131311] rounded-b-xl">
                  <Check className="w-4 h-4 text-emerald-700 inline font-black" /> 100% Guaranteed
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </section>
  );
};
