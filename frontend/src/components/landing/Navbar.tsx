import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const REPO_URL = "https://github.com/shubhamskadam89/feature-flag-service";

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 surface-cream border-b ${scrolled
        ? 'border-[var(--color-line)] bg-[var(--cream)]/90 backdrop-blur-md'
        : 'border-transparent bg-transparent'
        }`}
    >
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        {/* Brand */}
        <img src="/logo-light.png" alt="Logo" className="h-8" />

        {/* Desktop nav */}
        <div className="hidden items-center gap-7 font-mono text-xs text-[var(--color-secondary-text)] md:flex">
          <a href="#problem" className="hover:text-[var(--color-foreground)] transition-colors">
            Problem
          </a>
          <a href="#preview" className="hover:text-[var(--color-foreground)] transition-colors">
            Simulator
          </a>
          <a href="#developers" className="hover:text-[var(--color-foreground)] transition-colors">
            Docs
          </a>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-foreground)] transition-colors">
            GitHub
          </a>
          <Link to="/login" className="hover:text-[var(--color-foreground)] transition-colors">
            Sign in
          </Link>
        </div>

        {/* CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/register"
            className="inline-flex h-9 items-center rounded-full bg-[var(--color-primary)] px-4 font-mono text-xs text-[var(--color-primary-foreground)] transition-colors hover:opacity-90"
          >
            Try flags.dev
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg border border-[var(--color-line)] transition-colors"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden surface-cream border-t border-[var(--color-line)] px-5 pb-6 pt-4 flex flex-col gap-4">
          <a href="#problem" onClick={() => setMobileOpen(false)} className="font-mono text-sm text-[var(--color-secondary-text)]">Problem</a>
          <a href="#preview" onClick={() => setMobileOpen(false)} className="font-mono text-sm text-[var(--color-secondary-text)]">Simulator</a>
          <a href="#developers" onClick={() => setMobileOpen(false)} className="font-mono text-sm text-[var(--color-secondary-text)]">Docs</a>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="font-mono text-sm text-[var(--color-secondary-text)]">GitHub</a>
          <Link to="/login" onClick={() => setMobileOpen(false)} className="font-mono text-sm text-[var(--color-secondary-text)]">Sign in</Link>
          <Link
            to="/register"
            onClick={() => setMobileOpen(false)}
            className="mt-2 inline-flex h-10 items-center justify-center rounded-full bg-[var(--color-primary)] font-mono text-xs text-[var(--color-primary-foreground)]"
          >
            Try flags.dev
          </Link>
        </div>
      )}
    </header>
  );
};
