import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Menu, X, Timer } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-[#131311]/90 backdrop-blur-md border-b border-white/10 py-3 text-[#fffdf6]' 
        : 'bg-transparent py-5 text-[#131311]'
    }`}>
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        
        {/* Brand logo */}
        <a href="#" className="flex items-center gap-2 group">
          <div className="w-7 h-7 bg-[#c6fd50] rounded-full flex items-center justify-center p-1 group-hover:scale-105 transition-transform overflow-hidden">
            <img src="/logo-icon.png" className="w-full h-full object-contain" alt="Flags.dev Logo" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className={`font-display font-black text-base uppercase tracking-tight ${scrolled ? 'text-white' : 'text-[#131311]'}`}>
                FLAGS<span className="text-[#c6fd50]">.DEV</span>
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#c6fd50] animate-pulse"></span>
            </div>
            <span className={`text-[8px] font-mono tracking-widest uppercase -mt-1 ${scrolled ? 'text-white/60' : 'text-[#131311]/60'}`}>
              Edge Flag Service
            </span>
          </div>
        </a>

        {/* Desktop Links */}
        <nav className={`hidden md:flex items-center gap-8 font-display font-bold text-xs uppercase tracking-wider ${
          scrolled ? 'text-white/80' : 'text-[#131311]/80'
        }`}>
          <a href="#process" className="hover:text-[#c6fd50] transition-colors">How It Works</a>
          <a href="#why-us" className="hover:text-[#c6fd50] transition-colors">Why Us</a>
          <a href="#pricing" className="hover:text-[#c6fd50] transition-colors">Pricing</a>
          <a href="#faqs" className="hover:text-[#c6fd50] transition-colors">FAQs</a>
        </nav>

        {/* CTA Actions */}
        <div className="hidden md:flex items-center gap-3">
          <div className={`px-2.5 py-1 rounded-full text-[9px] font-mono font-bold border flex items-center gap-1.5 ${
            scrolled 
              ? 'bg-white/5 border-white/15 text-[#c6fd50]' 
              : 'bg-[#131311]/5 border-[#131311]/15 text-[#131311]'
          }`}>
            <Timer className="w-3 h-3" />
            <span>0.05ms LATENCY</span>
          </div>

          <Link
            to="/login"
            className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider hover:underline transition-all ${
              scrolled ? 'text-white' : 'text-[#131311]'
            }`}
          >
            Login
          </Link>
          <a
            href="#contact"
            className="px-5 py-2.5 bg-[#c6fd50] text-[#131311] font-display font-black text-xs uppercase tracking-wider rounded-full hover:bg-[#d4ff66] transition-all flex items-center gap-1 shadow-md hover:scale-105 cursor-pointer"
          >
            <span>Join Waitlist</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Mobile menu toggle button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`md:hidden p-2 rounded ${scrolled ? 'text-white' : 'text-[#131311]'}`}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#131311] text-[#fffdf6] px-6 py-6 border-b border-white/10 flex flex-col gap-4 font-display text-sm uppercase tracking-wider">
          <a href="#process" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
          <a href="#why-us" onClick={() => setMobileMenuOpen(false)}>Why Us</a>
          <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
          <a href="#faqs" onClick={() => setMobileMenuOpen(false)}>FAQs</a>
          <Link
            to="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="mt-2 py-2 border border-white/20 text-white font-mono text-xs font-bold rounded text-center hover:bg-white/5 transition-all"
          >
            Login
          </Link>
          <a
            href="#contact"
            onClick={() => setMobileMenuOpen(false)}
            className="py-3 bg-[#c6fd50] text-[#131311] font-black rounded text-center"
          >
            Join Waitlist ↗
          </a>
        </div>
      )}
    </header>
  );
};
