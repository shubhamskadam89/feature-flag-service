import { Cpu, Check, X, Zap } from 'lucide-react';

interface InteractiveFlowProps {
  flagEnabled: boolean;
}

export const InteractiveFlow: React.FC<InteractiveFlowProps> = ({ flagEnabled }) => {
  return (
    <div className="w-full max-w-sm mx-auto bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded p-5 font-mono text-[10px] select-none transition-all duration-300 relative overflow-hidden">
      
      <div className="text-center mb-6 relative z-10 text-current">
        <div className="text-[8px] text-[var(--theme-text-muted)] tracking-wider uppercase mb-0.5">SYSTEM ARCHITECTURE</div>
        <h4 className="text-xs font-bold uppercase tracking-tight">EVALUATION FLOW</h4>
      </div>

      <div className="flex flex-col items-center relative z-10 text-current">
        {/* Step 1: Request */}
        <div className="w-full flex items-center justify-between bg-[var(--theme-surface-subtle)] border border-[var(--theme-border)] p-3 rounded relative">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c6fd50] animate-ping"></span>
            <span className="font-bold text-current">HTTP GET /store/checkout</span>
          </div>
          <span className="text-[8px] text-[var(--theme-text-muted)] font-bold">CLIENT REQUEST</span>
        </div>

        {/* Connector */}
        <div className="h-6 w-0.5 bg-[var(--theme-border)] relative flex items-center justify-center">
          <div className="absolute top-0 w-1.5 h-1.5 rounded-full bg-[#c6fd50] animate-[bounce_2s_infinite]"></div>
        </div>

        {/* Step 2: Evaluation Service */}
        <div className="w-full bg-[var(--theme-surface-subtle)] border border-[var(--theme-border-strong)] p-3 rounded text-center relative">
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-[#131311] text-[#c6fd50] font-black text-[7px] px-2 py-0.2 rounded-full border border-[#c6fd50]/10">
            ENGINE EVALUATION
          </div>

          <div className="flex items-center justify-center gap-2 mb-2 pt-1 font-bold text-current">
            <Cpu className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
            <span>FeatureFlagService.eval()</span>
          </div>

          <div className="text-[9px] text-[var(--theme-text-secondary)] bg-[var(--theme-surface)] p-1.5 rounded border border-[var(--theme-border)]">
            key: <span className="font-bold text-current">new_checkout</span>
          </div>
        </div>

        {/* Branching container */}
        <div className="w-full flex justify-between relative mt-3">
          
          {/* SVG Connector Lines */}
          <svg className="absolute top-0 left-0 w-full h-10 pointer-events-none" fill="none">
            {/* Left Branch Line (TRUE) */}
            <path
              d="M 175 0 C 175 20, 75 20, 75 40"
              stroke={flagEnabled ? '#c6fd50' : 'var(--theme-border)'}
              strokeWidth="1.5"
              className="transition-all duration-300"
            />
            {/* Right Branch Line (FALSE) */}
            <path
              d="M 175 0 C 175 20, 275 20, 275 40"
              stroke={!flagEnabled ? 'var(--theme-border-strong)' : 'var(--theme-border)'}
              strokeWidth="1.5"
              className="transition-all duration-300"
            />
          </svg>

          {/* Dummy space for line rendering */}
          <div className="h-10 w-full"></div>
        </div>

        {/* Results Columns */}
        <div className="w-full grid grid-cols-2 gap-3 mt-1 relative">
          
          {/* True Path Column */}
          <div className={`p-2.5 border rounded text-center transition-all duration-300 ${
            flagEnabled 
              ? 'border-[#c6fd50] bg-[#c6fd50]/10 text-current scale-105 font-bold' 
              : 'border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-muted)] opacity-30 scale-95'
          }`}>
            <div className="flex justify-center mb-1">
              <Check className={`w-4 h-4 ${flagEnabled ? 'text-current' : 'text-[var(--theme-text-muted)]'}`} />
            </div>
            <div className="text-[9px] tracking-wide mb-1">EVAL: TRUE</div>
            <div className="text-[8px] font-bold p-1 bg-[var(--theme-surface-subtle)] rounded border border-[var(--theme-border)] flex items-center justify-center gap-0.5">
              <span>RENDER: Buy now</span>
              <Zap className="w-2.5 h-2.5 text-[#c6fd50] fill-[#c6fd50]" />
            </div>
          </div>

          {/* False Path Column */}
          <div className={`p-2.5 border rounded text-center transition-all duration-300 ${
            !flagEnabled 
              ? 'border-[var(--theme-border-strong)] bg-[var(--theme-surface-subtle)] text-current scale-105 font-bold' 
              : 'border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-muted)] opacity-30 scale-95'
          }`}>
            <div className="flex justify-center mb-1">
              <X className={`w-4 h-4 ${!flagEnabled ? 'text-current' : 'text-[var(--theme-text-muted)]'}`} />
            </div>
            <div className="text-[9px] tracking-wide mb-1">EVAL: FALSE</div>
            <div className="text-[8px] font-bold p-1 bg-[var(--theme-surface)] rounded border border-[var(--theme-border)]">
              RENDER: Add to cart
            </div>
          </div>

        </div>

      </div>

      {/* Footer info */}
      <div className="mt-4 pt-3 border-t border-[var(--theme-border)] flex justify-between text-[8px] text-[var(--theme-text-muted)]">
        <span>STRATEGY: RULES_ENGINE</span>
        <span>RESOLVED: 0.45ms</span>
      </div>
    </div>
  );
};
