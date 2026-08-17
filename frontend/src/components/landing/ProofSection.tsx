import { Section, SectionHeading, SectionLead } from "./primitives";

const PROOF = [
  {
    label: "Deterministic evaluation",
    body: "The same context and configuration produce a predictable variation.",
  },
  {
    label: "Context-aware targeting",
    body: "Target releases using structured evaluation context rather than a user-only model.",
  },
  {
    label: "Low-latency evaluation",
    body: "Evaluation is designed for application runtime paths.",
  },
  {
    label: "Cache-backed infrastructure",
    body: "Frequently accessed evaluation data is served without coupling runtime evaluation to configuration storage.",
  },
  {
    label: "Tenant isolation",
    body: "Organizations, projects, and environments are scoped and authenticated per API key.",
  },
  {
    label: "Contract tests",
    body: "Evaluation semantics are covered by tests in the source repository.",
  },
];

const ARCHITECTURE = [
  "Client SDK / HTTP",
  "API-key auth + rate limit",
  "Evaluation engine",
  "Redis rule cache",
  "PostgreSQL configuration",
];

export function ProofSection() {
  return (
    <Section id="proof" surface="cream">
      <div className="space-y-5">
        <SectionHeading>
          The release experience is backed by production-oriented infrastructure.
        </SectionHeading>
        <SectionLead>
          Fast evaluation is only useful when the underlying system is deterministic, isolated, and
          predictable under load.
        </SectionLead>
      </div>

      <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-line)] sm:grid-cols-2 lg:grid-cols-3">
        {PROOF.map((item) => (
          <div key={item.label} className="bg-[var(--color-surface)] p-5">
            <p className="font-mono text-xs">{item.label}</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-secondary-text)]">{item.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-[var(--color-line)] p-5">
        <p className="label-mono">evaluation path</p>
        <div className="mt-4 flex flex-wrap items-center gap-3 font-mono text-xs">
          {ARCHITECTURE.map((node, i) => (
            <span key={node} className="flex items-center gap-3">
              <span className="rounded-md border border-[var(--color-line)] px-2.5 py-1.5 text-[var(--color-secondary-text)]">
                {node}
              </span>
              {i < ARCHITECTURE.length - 1 && <span className="text-[var(--color-muted-text)]">→</span>}
            </span>
          ))}
        </div>
        <p className="mt-4 font-mono text-[11px] text-[var(--color-muted-text)]">
          Quantitative latency and scale figures are published only once benchmarked and
          reproducible.
        </p>
      </div>
    </Section>
  );
}
