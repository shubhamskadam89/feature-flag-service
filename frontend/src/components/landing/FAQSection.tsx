import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { Section, SectionHeading } from "./primitives";

const FAQ = [
  {
    q: "What is flags.dev?",
    a: "flags.dev is a feature-flag platform that helps engineering teams control releases and understand the exposure created by their targeting and rollout decisions.",
  },
  {
    q: "Is flags.dev a replacement for our analytics platform?",
    a: "No. flags.dev focuses on release-specific exposure and evaluation. Your existing analytics, warehouse, and customer-data systems remain the source of broader product and business analysis.",
  },
  {
    q: "Does flags.dev need access to our database?",
    a: "No. flags.dev is designed around an explicit evaluation-context contract rather than requiring direct access to your application database.",
  },
  {
    q: "Are exposure numbers exact?",
    a: "Evaluation decisions are deterministic. Population and exposure figures may be estimates when calculated from an incomplete or sampled context population — flags.dev makes that distinction explicit.",
  },
  {
    q: "How does percentage rollout work?",
    a: "Percentage rollout uses deterministic bucket hashing, so the same context receives the same variation for a given configuration.",
  },
  {
    q: "Does flags.dev support SDKs?",
    a: "Developer SDK support begins with Java, alongside an API-key authenticated HTTP evaluation API. Only implemented and documented SDKs are presented as available.",
  },
];

export function FAQSection() {
  const [open, setOpen] = useState<string | null>(FAQ[0]?.q ?? null);

  return (
    <Section id="faq" surface="cream">
      <SectionHeading>Questions engineers ask before adopting.</SectionHeading>

      <dl className="mt-10 border-t border-[var(--color-line)]">
        {FAQ.map((item) => {
          const isOpen = open === item.q;
          return (
            <div key={item.q} className="border-b border-[var(--color-line)]">
              <dt>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : item.q)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                >
                  <span className="font-display text-lg tracking-tight">{item.q}</span>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 shrink-0 text-[var(--color-muted-text)] transition-transform",
                      isOpen && "rotate-90",
                    )}
                    aria-hidden
                  />
                </button>
              </dt>
              {isOpen && (
                <dd className="max-w-3xl pb-5 text-sm leading-relaxed text-[var(--color-secondary-text)]">
                  {item.a}
                </dd>
              )}
            </div>
          );
        })}
      </dl>
    </Section>
  );
}
