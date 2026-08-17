import { Section, SectionHeading, SectionLead } from "./primitives";

const CONTEXT_SNIPPET = `EvaluationContext context = EvaluationContext.builder()
    .attribute("country", "IN")
    .attribute("plan", "PRO")
    .attribute("platform", "ANDROID")
    .build();

boolean enabled = flags.evaluate("new-checkout", context);`;

const API_SNIPPET = `POST /api/v1/evaluate
x-api-key: <environment key>

{
  "featureKey": "new-checkout",
  "context": { "country": "IN", "plan": "PRO" }
}`;

const FLOW = ["Application", "Evaluation Context", "flags.dev", "Deterministic variation"];

export function DeveloperSection() {
  return (
    <Section id="developers" surface="ink">
      <div className="space-y-5">
        <SectionHeading>Built for developers. Designed around the release.</SectionHeading>
        <SectionLead>
          Integrate feature evaluation into your application without coupling flags.dev to your
          application&apos;s database or business logic.
        </SectionLead>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]">
          <p className="label-mono border-b border-[var(--color-line)] px-5 py-3">Java SDK</p>
          <pre className="overflow-x-auto px-5 py-4 font-mono text-xs leading-relaxed text-[var(--color-secondary-text)]">
            <code>{CONTEXT_SNIPPET}</code>
          </pre>
          <p className="border-t border-[var(--color-line)] px-5 py-4 text-sm leading-relaxed text-[var(--color-secondary-text)]">
            Keep evaluation close to your application while flags.dev manages the release
            configuration and evaluation contract.
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]">
          <p className="label-mono border-b border-[var(--color-line)] px-5 py-3">HTTP API</p>
          <pre className="overflow-x-auto px-5 py-4 font-mono text-xs leading-relaxed text-[var(--color-secondary-text)]">
            <code>{API_SNIPPET}</code>
          </pre>
          <p className="border-t border-[var(--color-line)] px-5 py-4 text-sm leading-relaxed text-[var(--color-secondary-text)]">
            API-key authenticated, environment-scoped evaluation for services without an SDK.
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3 font-mono text-xs">
        {FLOW.map((node, i) => (
          <span key={node} className="flex items-center gap-3">
            <span className="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-[var(--color-secondary-text)]">
              {node}
            </span>
            {i < FLOW.length - 1 && <span className="text-[var(--color-muted-text)]">→</span>}
          </span>
        ))}
      </div>
    </Section>
  );
}
