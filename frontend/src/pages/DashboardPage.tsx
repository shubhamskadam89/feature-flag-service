import React, { useState } from 'react';
import { FlagAdminPanel } from '../components/FlagAdminPanel';
import { Layout, Terminal, ShieldCheck } from 'lucide-react';

interface UserData {
  name: string;
  email: string;
}

const METRICS = [
  { label: "Evaluations / sec", value: "1,402", suffix: "", highlight: true },
  { label: "Active flags", value: "4", suffix: "configured", highlight: false },
  { label: "Edge latency", value: "0.04", suffix: "ms", highlight: true },
] as const;

export const DashboardPage: React.FC = () => {
  const [user] = useState<UserData | null>(() => {
    const savedUserStr = localStorage.getItem('user');
    if (savedUserStr) {
      try {
        return JSON.parse(savedUserStr);
      } catch {
        return { name: 'Developer User', email: 'dev@flags.dev' };
      }
    }
    return { name: 'Developer User', email: 'dev@flags.dev' };
  });
  const [flagEnabled, setFlagEnabled] = useState(true);
  const [rolloutPercent, setRolloutPercent] = useState(75);

  return (
    <div className="space-y-8 max-w-6xl w-full mx-auto">

      {/* Page header — Manus editorial pattern */}
      <div className="space-y-2">
        <p className="label-mono">Release console</p>
        <h1 className="font-display text-4xl leading-none">
          {user ? `Welcome back, ${user.name.split(' ')[0]}.` : 'Console dashboard.'}
        </h1>
        <p className="max-w-lg text-sm leading-relaxed text-[var(--color-secondary-text)]">
          Your feature flag service is live. Evaluation is deterministic — the same context and
          configuration always produce the same variation.
        </p>
      </div>

      {/* Metric cards — Manus console MetricCard pattern */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {METRICS.map((m) => (
          <div key={m.label} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
            <p className="label-mono">{m.label}</p>
            <p className={`mt-3 font-display text-4xl leading-none ${m.highlight ? 'text-[var(--color-foreground)]' : 'text-[var(--color-secondary-text)]'}`}>
              {m.value}
              {m.suffix && <span className="ml-1 font-mono text-lg text-[var(--color-muted-text)]">{m.suffix}</span>}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
        {/* Telemetry console — ink surface */}
        <div className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]">
          <div className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[var(--color-lime)]" />
              <span className="label-mono">Telemetry stream</span>
            </div>
            <span className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--color-muted-text)]">
              <span className="size-1.5 rounded-full bg-[var(--color-lime)]" />
              Live
            </span>
          </div>
          <div className="p-5 font-mono text-[10px] leading-relaxed text-[var(--color-secondary-text)] space-y-2 min-h-[180px] bg-[var(--color-surface-subtle)]">
            <p>[15:00:01] <span className="text-[var(--color-lime)]">US-WEST</span> · Fetching rule configuration snapshot... 200 OK</p>
            <p>[15:00:01] <span className="text-[var(--color-lime)]">AP-SOUTH</span> · Resolved flag "new_checkout" → TRUE (0.038ms)</p>
            <p>[15:00:02] <span className="text-[var(--color-secondary-text)]">EU-CENTRAL</span> · Resolved flag "signup_captcha" → FALSE (0.042ms)</p>
            <p className="text-[var(--color-muted-text)] animate-pulse">// Waiting for telemetry events...</p>
          </div>
        </div>

        {/* Rule configurator */}
        <div className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]">
          <div className="flex items-center gap-2 border-b border-[var(--color-line)] px-5 py-4">
            <Layout className="w-4 h-4 text-[var(--color-lime)]" />
            <span className="label-mono">Rule configurator</span>
          </div>
          <div className="p-5 space-y-4">
            <FlagAdminPanel
              flagEnabled={flagEnabled}
              rolloutPercent={rolloutPercent}
              onToggle={setFlagEnabled}
              onRolloutChange={setRolloutPercent}
              showRollout={true}
              showTargeting={true}
            />

            <div className="flex items-start gap-3 rounded-xl border border-[var(--color-lime)]/25 bg-[var(--color-lime)]/8 p-4">
              <ShieldCheck className="w-4 h-4 text-[var(--color-lime)] shrink-0 mt-0.5" />
              <p className="font-mono text-[10px] leading-relaxed text-[var(--color-secondary-text)]">
                Rule changes are synchronized globally in milliseconds via cache invalidation.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default DashboardPage;
