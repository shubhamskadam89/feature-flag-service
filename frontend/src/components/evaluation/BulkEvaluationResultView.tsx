import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { type EvaluationResult } from '../../types';

interface BulkEvaluationResultViewProps {
  results: EvaluationResult[];
  contextKey: string;
}

export const BulkEvaluationResultView: React.FC<BulkEvaluationResultViewProps> = ({
  results,
  contextKey,
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <div className="mt-4 space-y-3 animate-fadeIn">
      {/* Summary Header */}
      <div className="flex items-center justify-between font-mono text-xs text-[var(--cream)]/70 pb-1 border-b border-[var(--color-line)]">
        <span>Context: <code className="text-[var(--color-lime)] font-bold">{contextKey}</code></span>
        <span>Features evaluated: {results.length}</span>
      </div>

      {/* Result Cards */}
      <div className="space-y-2">
        {results.map((res, idx) => {
          const isExpanded = expandedIndex === idx;
          return (
            <div
              key={res.key}
              className="rounded-xl border border-[var(--color-line)] bg-[#1c1c1a] p-3.5 space-y-2 transition hover:border-[var(--color-line-strong)]"
            >
              <div 
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                    res.enabled 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {res.enabled ? '✓ ENABLED' : '✗ DISABLED'}
                  </span>
                  <span className="font-mono text-xs font-bold text-[var(--cream)]">
                    {res.key}
                  </span>
                </div>

                <div className="flex items-center gap-3 font-mono text-[10px]">
                  <span className="text-[var(--cream)]/60">
                    {res.reason?.type === 'PERCENTAGE_ROLLOUT' 
                      ? `Rollout ${res.reason.rolloutPercentage}% · bucket ${res.reason.bucket?.toLocaleString()}` 
                      : 'Static feature state'}
                  </span>
                  <span className="text-[var(--cream)]/40">
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </span>
                </div>
              </div>

              {/* Expandable Details */}
              {isExpanded && (
                <div className="mt-2 pt-2 border-t border-[var(--color-line)] text-xs font-mono text-[var(--cream)]/80 space-y-1 bg-[#131311] p-3 rounded-lg">
                  {res.reason?.type === 'STATIC' && (
                    <p>Static feature toggle evaluation decision.</p>
                  )}

                  {res.reason?.type === 'PERCENTAGE_ROLLOUT' && (
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-[var(--cream)]/60">Rollout target:</span>
                        <span className="text-[var(--color-lime)] font-bold">{res.reason.rolloutPercentage}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--cream)]/60">Context bucket:</span>
                        <span>{res.reason.bucket?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--cream)]/60">Threshold:</span>
                        <span>{res.reason.threshold?.toLocaleString()}</span>
                      </div>
                      <div className="pt-1 text-center font-bold text-emerald-400 border-t border-[var(--color-line)] mt-1">
                        <code>{res.reason.bucket?.toLocaleString()} {res.enabled ? '<' : '≥'} {res.reason.threshold?.toLocaleString()}</code> 
                        ➔ {res.enabled ? '✓ ENABLED' : '✗ DISABLED'}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
