import React from 'react';
import { ShoppingBag, Zap, Star } from 'lucide-react';

interface AcmeStorePreviewProps {
  mode: 'single' | 'targeting';
  flagEnabled: boolean;
}

export const AcmeStorePreview: React.FC<AcmeStorePreviewProps> = ({
  mode,
  flagEnabled,
}) => {
  if (mode === 'targeting') {
    return (
      <div className="w-full flex flex-col md:flex-row gap-4 p-2 font-display text-[11px] select-none">
        
        {/* User A Card - targeted */}
        <div className="flex-1 bg-[var(--theme-surface)] border border-[var(--theme-border-strong)] rounded p-4 relative overflow-hidden transition-all duration-300">
          <div className="absolute top-3 right-3 flex items-center gap-1 text-[9px] font-mono text-accent bg-[#131311] text-[#c6fd50] px-2 py-0.5 rounded-full border border-[#c6fd50]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c6fd50] animate-pulse"></span>
            BETA · INDIA
          </div>
          
          <div className="text-[9px] font-mono text-[var(--theme-text-muted)] mb-1">SESSION: A_8829</div>
          <div className="text-xs font-bold text-current mb-3">Neha Sharma</div>
          
          {/* Internal card mockup */}
          <div className="bg-[var(--theme-surface-subtle)] border border-[var(--theme-border)] rounded p-3 text-current">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[8px] font-mono tracking-widest text-[var(--theme-text-secondary)] font-bold">ACME STORE</span>
              <span className="text-[8px] font-mono bg-[#c6fd50] text-[#131311] px-1 py-0.2 rounded font-black">✨ NEW BUILD</span>
            </div>
            
            <div className="w-full h-14 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded flex items-center justify-center mb-3">
              <ShoppingBag className="w-4 h-4 text-[var(--theme-text-muted)]" />
            </div>

            <div className="text-[10px] font-bold">Stealth Keyboard</div>
            <div className="text-[9px] text-[var(--theme-text-secondary)] mb-3 font-mono">₹ 1,299</div>

            {/* Instant checkout button */}
            <button className="w-full py-1.5 bg-[#c6fd50] text-[#131311] text-[10px] font-black rounded flex items-center justify-center gap-1 cursor-not-allowed">
              <Zap className="w-3 h-3 fill-current" />
              Buy now ⚡
            </button>
          </div>
          <div className="mt-3 text-[9px] font-mono text-[#c6fd50] bg-[#131311] py-1 rounded text-center">
            Flag: <span className="underline font-bold">TRUE</span>
          </div>
        </div>

        {/* User B Card - not targeted */}
        <div className="flex-1 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded p-4 relative overflow-hidden transition-all duration-300 opacity-50">
          <div className="absolute top-3 right-3 flex items-center gap-1 text-[9px] font-mono text-[var(--theme-text-muted)] bg-[var(--theme-surface-subtle)] px-2 py-0.5 rounded-full border border-[var(--theme-border)]">
            STANDARD · US
          </div>
          
          <div className="text-[9px] font-mono text-[var(--theme-text-muted)] mb-1">SESSION: B_5401</div>
          <div className="text-xs font-bold text-[var(--theme-text-secondary)] mb-3">John Doe</div>
          
          {/* Card Mock */}
          <div className="bg-[var(--theme-surface-subtle)] border border-[var(--theme-border)] rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[8px] font-mono tracking-widest text-[var(--theme-text-secondary)] font-bold">ACME STORE</span>
            </div>
            
            <div className="w-full h-14 bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded flex items-center justify-center mb-3">
              <ShoppingBag className="w-4 h-4 text-[var(--theme-text-muted)]" />
            </div>

            <div className="text-[10px] font-bold text-[var(--theme-text-secondary)]">Stealth Keyboard</div>
            <div className="text-[9px] text-[var(--theme-text-muted)] mb-3 font-mono">₹ 1,299</div>

            {/* Standard checkout button */}
            <button className="w-full py-1.5 bg-[var(--theme-surface)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)] text-[10px] font-medium rounded flex items-center justify-center gap-1 cursor-not-allowed">
              Add to cart
            </button>
          </div>
          <div className="mt-3 text-[9px] font-mono text-[var(--theme-text-muted)] text-center">
            Flag: <span className="underline">FALSE</span>
          </div>
        </div>
      </div>
    );
  }

  // Single Mock Mode
  return (
    <div className="w-full max-w-sm mx-auto bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded p-5 relative overflow-hidden transition-all duration-300 font-display select-none">
      
      {/* Acme Header */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-[10px] font-mono tracking-widest text-[var(--theme-text-secondary)] font-bold uppercase">ACME STUDIOS</span>
        <div className="flex items-center gap-2">
          {flagEnabled ? (
            <span className="text-[9px] font-mono bg-[#c6fd50]/15 text-[#c6fd50] border border-[#c6fd50]/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-[#c6fd50] animate-pulse"></span>
              FLAG ON
            </span>
          ) : (
            <span className="text-[9px] font-mono bg-[var(--theme-surface-subtle)] text-[var(--theme-text-muted)] border border-[var(--theme-border)] px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-[var(--theme-text-muted)]"></span>
              FLAG OFF
            </span>
          )}
        </div>
      </div>

      {/* Main product showcase image */}
      <div className="w-full h-36 bg-[var(--theme-surface-subtle)] border border-[var(--theme-border)] rounded mb-4 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300">
        
        {/* SVG Keyboard Illustration */}
        <svg className={`w-24 h-24 transition-all duration-500 ${flagEnabled ? 'text-[#c6fd50] scale-105 filter drop-shadow-[0_0_10px_rgba(200,255,0,0.2)]' : 'text-[var(--theme-text-muted)]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 16h10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {flagEnabled && (
          <div className="absolute top-2 left-2 bg-[#c6fd50] text-[#131311] text-[8px] font-mono font-black px-1.5 py-0.5 rounded tracking-wide animate-bounce">
            ⚡ RELEASE EVAL TRUE
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="space-y-1 mb-5">
        <div className="flex justify-between items-start">
          <h3 className="text-sm font-bold text-current tracking-tight">Cyberboard Stealth v2</h3>
          <div className="flex items-center text-[9px] text-[#c6fd50] font-mono bg-[#131311] px-1.5 py-0.2 rounded">
            <Star className="w-2.5 h-2.5 fill-current mr-0.5 text-[#c6fd50]" />
            4.9
          </div>
        </div>
        <p className="text-[11px] text-[var(--theme-text-secondary)] leading-snug">
          Stealth black tactile wireless mechanical keyboard.
        </p>
        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-sm font-bold font-mono text-current">₹ 1,299</span>
          <span className="text-[10px] text-[var(--theme-text-muted)] line-through font-mono">₹ 3,999</span>
        </div>
      </div>

      {/* Dynamic CTA Transition */}
      <div className="relative h-9 w-full overflow-hidden rounded">
        {/* Default Button State (Add to Cart) */}
        <button
          className={`absolute inset-0 w-full h-full bg-[var(--theme-surface-subtle)] text-[var(--theme-text-secondary)] border border-[var(--theme-border)] text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-all duration-300 cursor-not-allowed ${
            flagEnabled ? 'opacity-0 translate-y-4 scale-95 pointer-events-none' : 'opacity-100 translate-y-0 scale-100'
          }`}
        >
          Add to cart
        </button>

        {/* Active Flag Button State (Instant checkout) */}
        <button
          className={`absolute inset-0 w-full h-full bg-[#131311] text-[#fffdf6] border border-[#131311] text-[10px] font-black flex items-center justify-center gap-1.5 transition-all duration-300 cursor-not-allowed ${
            flagEnabled ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'
          }`}
        >
          <Zap className="w-3.5 h-3.5 fill-current text-[#c6fd50]" />
          Buy now ⚡
        </button>
      </div>

      {/* metadata panel */}
      <div className="mt-4 pt-3 border-t border-[var(--theme-border)] flex justify-between text-[8px] font-mono text-[var(--theme-text-muted)]">
        <span>LOC: INDIA_PRODUCTION</span>
        <span>LATENCY: 1.2ms</span>
      </div>
    </div>
  );
};
