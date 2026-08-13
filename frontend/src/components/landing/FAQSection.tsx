import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const faqs = [
  {
    q: "Who is Flags.Dev a good fit for?",
    a: "Flags.Dev is designed for modern engineering teams, startups, and product leaders who want enterprise-grade feature toggles and progressive rollouts without paying $40k/year per seat or suffering network latency."
  },
  {
    q: "How is evaluation latency under 0.05ms achieved?",
    a: "Our client SDKs stream rule definitions to background memory workers. Evaluations happen entirely in local memory, eliminating network roundtrips during user interactions or render cycles."
  },
  {
    q: "What happens if network connectivity drops?",
    a: "The SDK maintains the last evaluated rule snapshot in local storage/cache. If connectivity drops, your application continues running with cached rules seamlessly with zero downtime."
  },
  {
    q: "Is it really a flat monthly fee, or are there per-seat costs?",
    a: "It is strictly a flat $100/mo fee. You get unlimited feature flags, unlimited environments, and unlimited team member invites with zero hidden per-seat upgrades."
  },
  {
    q: "How does rule-based cohort targeting work?",
    a: "You can target specific user segments using custom rules based on user attributes (e.g. beta flag, geographic region, app version, subscription tier) or percentage-based progressive rollouts."
  },
  {
    q: "What SDKs are supported out of the box?",
    a: "We offer native SDK wrappers for React, Next.js, Node.js, Go, Python, and raw REST API cURL endpoints."
  },
  {
    q: "What is the 100% zero-downtime guarantee?",
    a: "If your app experiences any downtime or latency degradation caused by our flag service during your first 30 days, we issue a 100% full refund immediately."
  }
];

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faqs" className="w-full py-24 px-6 md:px-16 bg-[#fffdf6] text-[#131311] relative overflow-hidden">
      <div className="max-w-3xl mx-auto space-y-12 relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#575755] bg-[#f3f2ea] px-3.5 py-1 rounded-full border border-[#131311]/10">
            Got Questions?
          </span>
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight font-display">
            Frequently Asked FAQs
          </h2>
        </div>

        {/* Accordions */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-[#f3f2ea] border border-[#131311]/15 rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-display font-black text-base md:text-lg uppercase tracking-tight hover:text-[#575755] cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <div className={`w-8 h-8 rounded-full bg-[#131311] text-[#c6fd50] flex items-center justify-center shrink-0 transition-transform ${
                    isOpen ? 'rotate-180 bg-[#c6fd50] text-[#131311]' : ''
                  }`}>
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 text-sm text-[#575755] font-medium leading-relaxed border-t border-[#131311]/10 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
