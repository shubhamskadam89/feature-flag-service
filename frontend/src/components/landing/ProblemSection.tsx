import { BASELINE_ROLLOUT, FLAG_KEY } from "../../lib/release-demo";
import { Section, SectionHeading, SectionLead } from "./primitives";

const QUESTIONS = [
  { q: "Who gets it?", a: "See the contexts that match your targeting." },
  { q: "How much?", a: "Understand the exposure created by your rollout." },
  {
    q: "What if?",
    a: "Compare the impact of changing targeting or rollout before applying it.",
  },
  { q: "Why?", a: "Trace an evaluation to understand why a context received a variation." },
];

export function ProblemSection() {
  return (
    <Section id="problem" surface="sand">
      <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-start">
        <div className="space-y-5">
          <SectionHeading>A rollout percentage is a control. It is not an answer.</SectionHeading>
          <SectionLead>
            Setting a feature to {BASELINE_ROLLOUT}% tells your system how to distribute exposure.
            It does not tell you what that exposure means for your audience.
          </SectionLead>

          <div className="mt-8 max-w-sm rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 font-mono text-sm">
            <p>{FLAG_KEY}</p>
            <p className="mt-3 text-[var(--color-secondary-text)]">India · PRO · Android</p>
            <p className="text-[var(--color-secondary-text)]">{BASELINE_ROLLOUT}% rollout</p>
            <p className="mt-4 text-[var(--color-muted-text)]">↓</p>
            <p className="mt-4">What does this actually affect?</p>
          </div>
        </div>

        <dl className="divide-y divide-[var(--color-line)] border-y border-[var(--color-line)]">
          {QUESTIONS.map((item) => (
            <div key={item.q} className="grid gap-1 py-5 sm:grid-cols-[9rem_1fr] sm:gap-6">
              <dt className="font-display text-lg tracking-tight">{item.q}</dt>
              <dd className="text-sm leading-relaxed text-[var(--color-secondary-text)]">{item.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  );
}
