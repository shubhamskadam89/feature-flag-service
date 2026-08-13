import React from 'react';
import { Zap, ShieldCheck, Target, RefreshCw, Rocket, Package, Lock, BarChart2, Globe, DollarSign, Activity } from 'lucide-react';

const items = [
  { icon: Zap,          label: 'In-Memory Evaluation' },
  { icon: ShieldCheck,  label: '100% Zero-Downtime Guarantee' },
  { icon: Target,       label: 'Rule-Based Targeting' },
  { icon: RefreshCw,    label: 'Instant Rollback Switch' },
  { icon: Rocket,       label: 'Live in 14 Days' },
  { icon: Package,      label: 'Multi-SDK Support' },
  { icon: Lock,         label: 'SOC2 Type II Certified' },
  { icon: BarChart2,    label: 'Real-Time Telemetry' },
  { icon: Globe,        label: 'Edge CDN Synchronization' },
  { icon: DollarSign,   label: '$100/mo Transparent Pricing' },
  { icon: Activity,     label: 'Sub-0.05ms Evaluation' },
];

export const MarqueeTicker: React.FC = () => {
  const repeated = [...items, ...items, ...items];

  return (
    <div className="w-full bg-[#131311] py-3 overflow-hidden border-y border-white/10 select-none relative z-30">
      <div className="flex whitespace-nowrap animate-marquee">
        {repeated.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 mx-3 text-[10px] font-mono tracking-wider uppercase bg-white/5 border border-white/10 px-4 py-1.5 rounded-full shrink-0"
          >
            <item.icon className="w-3 h-3 text-[#c6fd50] shrink-0" />
            <span className="text-white/80">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
