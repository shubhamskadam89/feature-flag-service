import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Heart, ShieldCheck } from 'lucide-react';

export const FooterSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <footer id="contact" className="w-full bg-[#131311] text-[#fffdf6] pt-24 pb-12 px-6 md:px-16 border-t border-white/10 relative overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-16 relative z-10">
        
        {/* Waitlist Banner Card */}
        <div className="bg-[#1e1e1c] border border-white/15 rounded-3xl p-8 md:p-14 space-y-8 relative overflow-hidden">
          <div className="space-y-4 max-w-2xl">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#c6fd50] bg-[#c6fd50]/10 border border-[#c6fd50]/20 px-3.5 py-1 rounded-full inline-block">
              Be the first to know when we launch
            </span>
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight font-display leading-[0.9]">
              Your Feature Engine Won’t Build Itself.<br />
              <span className="text-[#c6fd50]">Good Thing We Will.</span>
            </h2>
            <p className="text-white/70 text-sm md:text-base font-medium">
              One plan. One flag service. Zero excuses left. Sign up today to secure your priority early-access slot.
            </p>
          </div>

          {/* Form */}
          {submitted ? (
            <div className="bg-[#c6fd50] text-[#131311] p-6 rounded-2xl flex items-center gap-3 font-display font-black text-base uppercase tracking-tight">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <span>YOU'RE ON THE WAITLIST! WE'LL BE IN TOUCH SHORTLY.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg relative">
              <input
                type="email"
                required
                placeholder="Enter your work email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-[#131311] border border-white/20 rounded-full px-6 py-4 text-xs font-mono text-white placeholder-white/40 focus:outline-none focus:border-[#c6fd50]"
              />
              <span className="absolute -top-7 right-6 font-handwritten text-lg text-[#c6fd50] rotate-3 hidden sm:inline-block">
                Priority slots filling fast!
              </span>
              <button
                type="submit"
                className="px-8 py-4 bg-[#c6fd50] text-[#131311] font-display font-black text-xs uppercase tracking-widest rounded-full hover:bg-[#d4ff66] transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <span>JOIN WAITLIST</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="text-[10px] font-mono text-white/50 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#c6fd50] shrink-0" />
            <span>100% Money-Back &amp; Zero-Downtime Satisfaction Guarantee</span>
          </div>
        </div>

        {/* Footer Navigation Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-8 border-t border-white/10 text-xs font-mono">
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-display font-black text-base uppercase text-white">
              <span>FLAGS</span>
              <span className="text-[#c6fd50]">.DEV</span>
            </div>
            <p className="text-white/50 text-[11px] font-medium leading-relaxed">
              Edge Feature Flag Service built for high-performance product teams. Zero redeploys, sub-ms evaluations.
            </p>
          </div>

          <div className="space-y-3">
            <div className="text-white font-bold uppercase tracking-wider">NAVIGATION</div>
            <ul className="space-y-2 text-white/70 font-medium">
              <li><a href="#process" className="hover:text-[#c6fd50]">How It Works</a></li>
              <li><a href="#why-us" className="hover:text-[#c6fd50]">Why Us</a></li>
              <li><a href="#pricing" className="hover:text-[#c6fd50]">Pricing</a></li>
              <li><a href="#faqs" className="hover:text-[#c6fd50]">FAQs</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="text-white font-bold uppercase tracking-wider">LEGAL</div>
            <ul className="space-y-2 text-white/70 font-medium">
              <li><a href="#" className="hover:text-[#c6fd50]">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-[#c6fd50]">Terms of Service</a></li>
              <li><a href="#" className="hover:text-[#c6fd50]">Refund Guarantee</a></li>
              <li><a href="#" className="hover:text-[#c6fd50]">Security & SOC2</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="text-white font-bold uppercase tracking-wider">COMMUNITY</div>
            <ul className="space-y-2 text-white/70 font-medium">
              <li><a href="#" className="hover:text-[#c6fd50]">GitHub Repo ↗</a></li>
              <li><a href="#" className="hover:text-[#c6fd50]">API Documentation ↗</a></li>
              <li><a href="#" className="hover:text-[#c6fd50]">SDK Registry ↗</a></li>
              <li><a href="#" className="hover:text-[#c6fd50]">Status Page ↗</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-mono text-white/40">
          <div>
            © 2026 FLAGS.DEV INC. ALL RIGHTS RESERVED.
          </div>
          <div className="flex items-center gap-1">
            Crafted with <Heart className="w-3 h-3 text-[#c6fd50] fill-current inline" /> for modern systems
          </div>
        </div>

      </div>
    </footer>
  );
};
