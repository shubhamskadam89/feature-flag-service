import React from 'react';
import { Lock, Wifi, Battery, Signal } from 'lucide-react';

interface DeviceFrameProps {
  type: 'mobile' | 'desktop';
  children: React.ReactNode;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({ type, children }) => {
  return (
    <div className="flex flex-col items-center select-none">
      
      {/* MOBILE: Fixed 260×490 device frame */}
      {type === 'mobile' && (
        <div className="relative w-[260px] h-[490px] bg-[#1a1a1e] rounded-[40px] border-[4px] border-[#2c2c30] p-[10px] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.9)]">
          {/* Hardware buttons */}
          <div className="absolute top-[88px] -left-[6px] w-[4px] h-[28px] bg-[#3a3a40] rounded-l-sm" />
          <div className="absolute top-[124px] -left-[6px] w-[4px] h-[28px] bg-[#3a3a40] rounded-l-sm" />
          <div className="absolute top-[104px] -right-[6px] w-[4px] h-[42px] bg-[#3a3a40] rounded-r-sm" />

          {/* Screen */}
          <div className="w-full h-full bg-[#FAF8F5] rounded-[30px] overflow-hidden flex flex-col">
            {/* Status bar */}
            <div className="shrink-0 flex items-center justify-between px-5 pt-2 pb-1 bg-[#FAF8F5]">
              <span className="text-[10px] font-mono font-bold text-[#131311]">9:41</span>
              {/* Phone Camera Notch */}
              <div className="w-[72px] h-[16px] bg-[#0c0c0d] rounded-full flex items-center justify-center">
                <div className="w-[6px] h-[6px] rounded-full bg-[#1e1e24]" />
              </div>
              <div className="flex items-center gap-[3px] text-[#131311]">
                <Signal className="w-[10px] h-[10px]" />
                <Wifi className="w-[10px] h-[10px]" />
                <Battery className="w-[12px] h-[12px] fill-current" />
              </div>
            </div>

            {/* Fixed scene canvas */}
            <div className="flex-1 overflow-hidden">
              {children}
            </div>

            {/* Home bar */}
            <div className="shrink-0 pb-2 flex justify-center bg-[#FAF8F5]">
              <div className="w-[88px] h-[4px] bg-[#131311]/20 rounded-full" />
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP: Fixed 460×380 browser frame */}
      {type === 'desktop' && (
        <div className="w-[460px] h-[380px] bg-[#1a1a1e] rounded-xl border border-white/10 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden">
          {/* Browser chrome */}
          <div className="shrink-0 flex items-center gap-3 px-3 py-2 bg-[#111113] border-b border-white/10">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
            </div>
            <div className="flex-1 flex items-center gap-1.5 bg-[#1e1e22] border border-white/8 rounded px-2 py-0.5">
              <Lock className="w-[10px] h-[10px] text-white/30" />
              <span className="text-[9px] font-mono text-white/50 truncate">acme-store.dev/checkout</span>
            </div>
            <div className="flex items-center gap-1 text-[8px] font-mono text-[#d4fe00]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4fe00] animate-ping" />
              LIVE
            </div>
          </div>

          {/* Fixed scene canvas */}
          <div className="flex-1 overflow-hidden bg-[#FAF8F5]">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};
