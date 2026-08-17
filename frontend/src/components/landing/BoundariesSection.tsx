import { Section, SectionHeading, SectionLead } from "./primitives";

const BOUNDARY_FLOW = [
  "Customer systems",
  "Customer-controlled context",
  "flags.dev",
  "Evaluation + exposure analysis",
];

const FOCUS = [
  "Who will this release affect?",
  "How much exposure will it create?",
  "What changes if I alter the rollout?",
  "Why did this context receive this variation?",
];

export function BoundariesSection() {
  return (
    <Section id="boundaries" surface="sand">
      <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-start">
        <div className="space-y-5">
          <SectionHeading>
            Feature flags that show you the consequences of using them.
          </SectionHeading>
          <SectionLead>
            flags.dev is not built to replace your analytics platform, customer database, or data
            warehouse. It focuses on the release-specific questions those systems do not answer on
            their own.
          </SectionLead>
          <div className="flex flex-wrap items-center gap-2 pt-2 font-mono text-xs">
            {BOUNDARY_FLOW.map((node, i) => (
              <span key={node} className="flex items-center gap-2">
                <span className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-2.5 py-1.5 text-[var(--color-secondary-text)]">
                  {node}
                </span>
                {i < BOUNDARY_FLOW.length - 1 && <span className="text-[var(--color-muted-text)]">→</span>}
              </span>
            ))}
          </div>
        </div>

        <ul className="divide-y divide-[var(--color-line)] border-y border-[var(--color-line)]">
          {FOCUS.map((q) => (
            <li key={q} className="flex gap-3 py-4 font-mono text-sm text-[var(--color-secondary-text)]">
              <span className="text-[var(--color-lime)]" aria-hidden>·</span>
              {q}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
