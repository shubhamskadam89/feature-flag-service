import React from 'react';
import { ShoppingBag, Zap, Star } from 'lucide-react';

interface ActivationSceneProps {
  flagEnabled: boolean;
}

export const ActivationScene: React.FC<ActivationSceneProps> = ({ flagEnabled }) => {
  return (
    <div className="w-full h-full flex flex-col bg-[#FAF8F5] text-[#131311] font-display select-none overflow-hidden">
      {/* Store Header */}
      <div className="px-4 py-3 border-b border-[#131311]/10 flex items-center justify-between bg-white shrink-0">
        <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-[#575755]">ACME STUDIOS</span>
        <div className={`flex items-center gap-1 text-[8px] font-mono font-bold px-2 py-0.5 rounded-full transition-all duration-300 ${
          flagEnabled
            ? 'bg-[#131311] text-[#d4fe00]'
            : 'bg-[#f3f2ea] text-[#8d8d8a] border border-[#131311]/10'
        }`}>
          <span className={`w-1 h-1 rounded-full ${flagEnabled ? 'bg-[#d4fe00] animate-pulse' : 'bg-[#8d8d8a]'}`}></span>
          {flagEnabled ? 'FLAG ON' : 'FLAG OFF'}
        </div>
      </div>

      {/* Product Image */}
      <div className={`mx-4 mt-4 rounded-xl border transition-all duration-500 flex items-center justify-center relative overflow-hidden shrink-0 ${
        flagEnabled
          ? 'bg-[#131311] border-[#d4fe00]/30 h-28'
          : 'bg-[#f3f2ea] border-[#131311]/10 h-28'
      }`}>
        <svg
          className={`w-16 h-16 transition-all duration-500 ${flagEnabled ? 'text-[#d4fe00] scale-110 drop-shadow-[0_0_12px_rgba(212,254,0,0.4)]' : 'text-[#8d8d8a]'}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"
        >
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 16h10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {flagEnabled && (
          <div className="absolute top-2 left-2 bg-[#d4fe00] text-[#131311] text-[7px] font-mono font-black px-1.5 py-0.5 rounded tracking-wide flex items-center gap-0.5">
            <Zap className="w-2 h-2 fill-current" /> NEW BUILD ACTIVE
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="px-4 mt-3 space-y-1 shrink-0">
        <div className="flex items-start justify-between">
          <h3 className="text-sm font-bold text-[#131311]">Cyberboard Stealth v2</h3>
          <div className="flex items-center gap-0.5 text-[8px] font-mono bg-[#131311] text-[#d4fe00] px-1.5 py-0.5 rounded">
            <Star className="w-2 h-2 fill-current" />4.9
          </div>
        </div>
        <p className="text-[10px] text-[#575755] leading-snug">Stealth black tactile wireless mechanical keyboard.</p>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-bold font-mono text-[#131311]">₹ 1,299</span>
          <span className="text-[9px] text-[#8d8d8a] line-through font-mono">₹ 3,999</span>
        </div>
      </div>

      {/* CTA Button */}
      <div className="px-4 mt-4 shrink-0">
        <div className="relative h-10 w-full overflow-hidden rounded-xl">
          {/* Default: Add to Cart */}
          <div className={`absolute inset-0 flex items-center justify-center gap-1.5 bg-[#f3f2ea] border border-[#131311]/15 text-[10px] font-semibold text-[#575755] transition-all duration-400 ${
            flagEnabled ? 'opacity-0 translate-y-4 scale-95' : 'opacity-100 translate-y-0 scale-100'
          }`}>
            <ShoppingBag className="w-3.5 h-3.5" />
            Add to Cart
          </div>
          {/* New: Buy Now */}
          <div className={`absolute inset-0 flex items-center justify-center gap-1.5 bg-[#131311] text-[10px] font-black text-white transition-all duration-400 ${
            flagEnabled ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'
          }`}>
            <Zap className="w-3.5 h-3.5 text-[#d4fe00] fill-current" />
            Buy Now
          </div>
        </div>
      </div>

      {/* Footer meta */}
      <div className="mt-auto px-4 pb-3 pt-3 border-t border-[#131311]/8 flex justify-between text-[7px] font-mono text-[#8d8d8a] shrink-0">
        <span>LOC: INDIA_PROD</span>
        <span>LATENCY: 0.04ms</span>
      </div>
    </div>
  );
};
