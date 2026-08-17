import { ButtonLink, Section, SectionHeading } from "./primitives";

export function FinalCta() {
  return (
    <Section id="cta" surface="ink">
      <div className="max-w-3xl space-y-6">
        <SectionHeading>Make your next rollout a decision, not a guess.</SectionHeading>
        <p className="text-lg leading-relaxed text-[var(--color-secondary-text)]">
          Start with feature flags. See the exposure. Understand the decision.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink to="/register" variant="lime">
            Try flags.dev
          </ButtonLink>
          <ButtonLink href="#developers" variant="outline">
            Explore the API
          </ButtonLink>
        </div>
      </div>
    </Section>
  );
}
