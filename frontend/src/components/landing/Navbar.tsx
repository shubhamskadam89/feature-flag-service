import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Menu, X, Timer } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      // Detect background theme of current section under navbar
      const navbarHeight = 64;
      const x = window.innerWidth / 2;
      const y = navbarHeight + 10;
      const element = document.elementFromPoint(x, y);
      const section = element?.closest('section, footer');
      
      if (section) {
        const isDark = section.classList.contains('bg-[#131311]') || 
                       section.id === 'pricing' || 
                       section.id === 'contact' ||
                       section.tagName.toLowerCase() === 'footer';
        setIsDarkTheme(isDark);
      } else {
        setIsDarkTheme(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
      scrolled 
        ? isDarkTheme
          ? 'bg-[#131311]/90 backdrop-blur-md border-b border-white/10 py-3 text-[#fffdf6]'
          : 'bg-[#fffdf6]/90 backdrop-blur-md border-b border-[#131311]/10 py-3 text-[#131311]' 
        : 'bg-transparent py-5 text-[#131311]'
    }`}>
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        
        {/* Brand logo */}
        <a href="#" className="flex items-center group">
          <img 
            src={isDarkTheme && scrolled ? "/logo-dark.png" : "/logo-light.png"} 
            className="h-8 w-auto object-contain transition-all duration-300 group-hover:scale-[1.02]" 
            alt="flags.dev Logo" 
          />
        </a>

        {/* Desktop Links */}
        <nav className={`hidden md:flex items-center gap-8 font-display font-bold text-xs uppercase tracking-wider transition-colors duration-300 ${
          isDarkTheme && scrolled ? 'text-white/80' : 'text-[#131311]/80'
        }`}>
          <a href="#process" className="hover:text-[#c6fd50] transition-colors">How It Works</a>
          <a href="#why-us" className="hover:text-[#c6fd50] transition-colors">Why Us</a>
          <a href="#pricing" className="hover:text-[#c6fd50] transition-colors">Pricing</a>
          <a href="#faqs" className="hover:text-[#c6fd50] transition-colors">FAQs</a>
        </nav>

        {/* CTA Actions */}
        <div className="hidden md:flex items-center gap-3">
          <div className={`px-2.5 py-1 rounded-full text-[9px] font-mono font-bold border flex items-center gap-1.5 transition-colors duration-300 ${
            isDarkTheme && scrolled
              ? 'bg-white/5 border-white/15 text-[#c6fd50]'
              : 'bg-[#131311]/5 border-[#131311]/15 text-[#131311]'
          }`}>
            <Timer className="w-3 h-3" />
            <span>0.05ms LATENCY</span>
          </div>

          <Link
            to="/login"
            className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider hover:underline transition-all ${
              isDarkTheme && scrolled ? 'text-white' : 'text-[#131311]'
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
          className={`md:hidden p-2 rounded transition-colors duration-300 ${
            isDarkTheme && scrolled ? 'text-white' : 'text-[#131311]'
          }`}
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
