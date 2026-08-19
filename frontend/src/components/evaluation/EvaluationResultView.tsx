import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  Terminal 
} from 'lucide-react';
import { type EvaluationResult } from '../../types';

interface EvaluationResultViewProps {
  result: EvaluationResult;
  contextKey: string;
  environmentId: string;
}

export const EvaluationResultView: React.FC<EvaluationResultViewProps> = ({
  result,
  contextKey,
  environmentId,
}) => {
  const [showJsonRaw, setShowJsonRaw] = useState(false);
  const [showCurl, setShowCurl] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const copyText = (text: string, type: 'json' | 'curl') => {
    navigator.clipboard.writeText(text);
    if (type === 'json') {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } else {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    }
  };

  const curlSnippet = `curl -X GET "http://localhost:8080/api/v1/evaluate/environments/${environmentId}/features/${result.key}?contextKey=${encodeURIComponent(contextKey)}"\n  -H "Accept: application/json"`;

  const bucket = result.reason?.bucket;
  const threshold = result.reason?.threshold;

  // Calculate percentage placement for the visual bucket gauge (0 to 1,000,000)
  const thresholdPct = threshold !== undefined ? Math.min(100, Math.max(0, (threshold / 1000000) * 100)) : 0;
  const bucketPct = bucket !== undefined ? Math.min(99, Math.max(0, (bucket / 1000000) * 100)) : 0;

  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[#1c1c1a] p-5 space-y-4 animate-fadeIn">
      
      {/* Decision Header */}
      <div className="flex items-center gap-3 border-b border-[var(--color-line)] pb-4">
        {result.enabled ? (
          <CheckCircle2 className="h-7 w-7 text-emerald-400 shrink-0" />
        ) : (
          <XCircle className="h-7 w-7 text-rose-400 shrink-0" />
        )}
        <div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--cream)]/50 font-bold">
            Decision
          </span>
          <div className="flex items-center gap-2">
            <span className={`font-mono text-xl font-black ${result.enabled ? 'text-emerald-400' : 'text-rose-400'}`}>
              {result.enabled ? '✓ ENABLED' : '✗ DISABLED'}
            </span>
          </div>
        </div>
      </div>

      {/* Reason Breakdown */}
      <div className="space-y-3 font-mono text-xs">
        {result.reason?.type === 'STATIC' && (
          <div className="space-y-1">
            <span className="text-[var(--cream)]/60 font-semibold block">Reason</span>
            <p className="text-[var(--cream)]/90 text-xs">
              Static feature state
            </p>
          </div>
        )}

        {result.reason?.type === 'PERCENTAGE_ROLLOUT' && (
          <div className="space-y-4">
            <span className="text-[var(--cream)]/60 font-semibold block border-b border-[var(--color-line)] pb-1">
              Percentage rollout
            </span>

            {/* Metrics */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--cream)]/60">Rollout target</span>
                <span className="text-[var(--color-lime)] font-bold">{result.reason.rolloutPercentage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--cream)]/60">Context bucket</span>
                <span className="text-[var(--cream)] font-bold">{bucket?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--cream)]/60">Threshold</span>
                <span className="text-[var(--cream)] font-bold">{threshold?.toLocaleString()}</span>
              </div>
            </div>

            {/* Visual Bucket Gauge */}
            {bucket !== undefined && threshold !== undefined && (
              <div className="space-y-2 pt-2 border-t border-[var(--color-line)]">
                <div className="flex justify-between font-mono text-[10px] text-[var(--cream)]/60">
                  <span>0</span>
                  <span>1,000,000</span>
                </div>

                <div className="relative h-4 w-full rounded-full bg-white/10 overflow-hidden border border-[var(--color-line)]">
                  {/* Rollout target green zone */}
                  <div 
                    className="absolute top-0 bottom-0 left-0 bg-emerald-500/30 border-r-2 border-emerald-400"
                    style={{ width: `${thresholdPct}%` }}
                  />

                  {/* Context bucket position pin */}
                  <div
                    className="absolute top-0 bottom-0 w-2 bg-[var(--color-lime)] shadow-[0_0_10px_#c6fd50]"
                    style={{ left: `${bucketPct}%` }}
                  />
                </div>

                {/* Mathematical Rule Comparison */}
                <div className="text-center font-mono text-xs pt-1">
                  <code className="text-[var(--cream)]">
                    {bucket.toLocaleString()} {result.enabled ? '<' : '≥'} {threshold.toLocaleString()}
                  </code>
                  <div className={`mt-1 font-bold ${result.enabled ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {result.enabled 
                      ? '✓ Context receives this feature' 
                      : '✗ Context falls outside rollout percentage'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Secondary Developer Affordances */}
      <div className="pt-3 border-t border-[var(--color-line)] flex items-center justify-between text-[10px] font-mono text-[var(--cream)]/50">
        <button
          onClick={() => setShowJsonRaw(!showJsonRaw)}
          className="flex items-center gap-1 hover:text-[var(--cream)] transition cursor-pointer"
        >
          {showJsonRaw ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          <span>{showJsonRaw ? 'Hide raw response' : 'View raw response'}</span>
        </button>

        <button
          onClick={() => setShowCurl(!showCurl)}
          className="flex items-center gap-1 hover:text-[var(--cream)] transition cursor-pointer"
        >
          <Terminal className="h-3 w-3 text-[var(--color-lime)]" />
          <span>{showCurl ? 'Hide cURL' : 'cURL request'}</span>
        </button>
      </div>

      {/* Raw JSON Drawer */}
      {showJsonRaw && (
        <div className="relative rounded-lg bg-[#131311] p-3 font-mono text-[11px] text-emerald-400 border border-[var(--color-line)]">
          <button
            onClick={() => copyText(JSON.stringify(result, null, 2), 'json')}
            className="absolute top-2 right-2 flex items-center gap-1 rounded bg-[#1c1c1a] px-2 py-0.5 text-[9px] text-[var(--cream)]/70 hover:text-[var(--cream)] cursor-pointer border border-[var(--color-line)]"
          >
            {copiedJson ? <Check className="h-3 w-3 text-[var(--color-lime)]" /> : <Copy className="h-3 w-3" />}
            {copiedJson ? 'COPIED' : 'COPY'}
          </button>
          <pre className="overflow-x-auto">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      {/* cURL Drawer */}
      {showCurl && (
        <div className="relative rounded-lg bg-[#131311] p-3 font-mono text-[11px] text-[var(--color-lime)] border border-[var(--color-line)]">
          <button
            onClick={() => copyText(curlSnippet, 'curl')}
            className="absolute top-2 right-2 flex items-center gap-1 rounded bg-[#1c1c1a] px-2 py-0.5 text-[9px] text-[var(--cream)]/70 hover:text-[var(--cream)] cursor-pointer border border-[var(--color-line)]"
          >
            {copiedCurl ? <Check className="h-3 w-3 text-[var(--color-lime)]" /> : <Copy className="h-3 w-3" />}
            {copiedCurl ? 'COPIED' : 'COPY'}
          </button>
          <pre className="overflow-x-auto">{curlSnippet}</pre>
        </div>
      )}
    </div>
  );
};
