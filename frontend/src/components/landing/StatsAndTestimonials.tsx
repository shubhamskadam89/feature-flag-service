import React from 'react';

const stats = [
  {
    num: "99.999%",
    label: "Guaranteed SLA Uptime",
    desc: "Built on global high-availability edge nodes"
  },
  {
    num: "<0.05ms",
    label: "Evaluation Latency",
    desc: "In-memory local SDK resolution"
  },
  {
    num: "10M+",
    label: "Daily Flag Evaluations",
    desc: "Serving fast-growing platforms globally"
  },
  {
    num: "150+",
    label: "Engineering Teams",
    desc: "From solopreneurs to unicorn scale"
  }
];

const testimonials = [
  {
    quote: "They took our deployment safety from 'ok' to 'OMG'. Zero downtime rollouts!",
    author: "Chris Klop",
    role: "Engineering Director"
  },
  {
    quote: "Outstanding quality & speed. Don’t even shop around for expensive enterprise platforms.",
    author: "Jill Felty",
    role: "VP of Engineering"
  },
  {
    quote: "Getting instant feature kill switches right was critical for our global launch.",
    author: "Dan Moore",
    role: "Principal Architect"
  },
  {
    quote: "Results beyond what I could have imagined. Our shipping velocity quadrupled.",
    author: "Katrina Miller",
    role: "Head of Product"
  }
];

export const StatsAndTestimonials: React.FC = () => {
  return (
    <section className="w-full py-24 px-6 md:px-16 bg-[#fffdf6] text-[#131311] relative overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-20 relative z-10">
        
        {/* Section Header */}
        <div className="space-y-4">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#575755] bg-[#f3f2ea] px-3 py-1 rounded-full border border-[#131311]/10">
            Transforming Engineering Teams Globally
          </span>
          <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tight font-display max-w-2xl leading-[0.9]">
            YOUR FIRST IMPRESSION?
          </h2>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 border-y border-[#131311]/15 py-12">
          {stats.map((stat, idx) => (
            <div key={idx} className="space-y-2">
              <div className="text-5xl font-black font-display tracking-tight text-[#131311]">
                {stat.num}
              </div>
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#131311]">
                {stat.label}
              </div>
              <p className="text-xs text-[#575755] font-medium leading-relaxed">
                {stat.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Testimonials Ticker / Grid */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black uppercase font-display tracking-tight">
              Trusted by Builders
            </h3>
            <span className="font-handwritten text-lg text-emerald-800 -rotate-2">
              Meet our happy dev teams!
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((item, idx) => (
              <div
                key={idx}
                className="bg-[#f3f2ea] border border-[#131311]/10 rounded-2xl p-6 flex flex-col justify-between hover:border-[#131311]/30 transition-all duration-300"
              >
                <p className="text-sm font-display font-medium text-[#131311] leading-snug mb-6">
                  "{item.quote}"
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-[#131311]/10">
                  <div className="w-8 h-8 rounded-full bg-[#131311] text-[#c6fd50] flex items-center justify-center font-mono font-bold text-xs">
                    {item.author[0]}
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide">{item.author}</div>
                    <div className="text-[10px] font-mono text-[#575755]">{item.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
