import { Navbar } from '../components/landing/Navbar';
import { HeroSection } from '../components/landing/HeroSection';
import { ProblemSection } from '../components/landing/ProblemSection';
import { WorkflowSection } from '../components/landing/WorkflowSection';
import { ReleaseSimulator } from '../components/landing/ReleaseSimulator';
import { BoundariesSection } from '../components/landing/BoundariesSection';
import { DeveloperSection } from '../components/landing/DeveloperSection';
import { ProofSection } from '../components/landing/ProofSection';
import { FAQSection } from '../components/landing/FAQSection';
import { FinalCta } from '../components/landing/FinalCta';
import { FooterSection } from '../components/landing/FooterSection';
import { Section } from '../components/landing/primitives';

export function LandingPage() {
  return (
    <div className="relative min-h-screen text-[var(--color-foreground)] bg-[var(--color-background)] font-sans antialiased">

      {/* Fixed Navbar */}
      <Navbar />

      {/* Hero — Impact preview above the fold */}
      <HeroSection />

      {/* Problem — A rollout % is a control, not an answer */}
      <ProblemSection />

      {/* Workflow — 5-step release workflow */}
      <WorkflowSection />

      {/* Release Simulator — Centerpiece: WHO / HOW MUCH / WHAT IF / WHY */}
      <Section id="preview" surface="ink">
        <div className="space-y-4 mb-8">
          <p className="label-mono text-[var(--color-lime)]">Simulation</p>
          <h2 className="max-w-2xl text-3xl leading-[1.05] sm:text-4xl font-black">
            See the blast radius before you toggle.
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-[var(--color-secondary-text)]">
            Interactive evaluation console. Simulate rollout target adjustments against current baseline settings to calculate exact context exposure change.
          </p>
        </div>
        <ReleaseSimulator />
      </Section>

      {/* Boundaries — What flags.dev is and isn't */}
      <BoundariesSection />

      {/* Developer — Java SDK + HTTP API */}
      <DeveloperSection />

      {/* Proof — Infrastructure + architecture */}
      <ProofSection />

      {/* FAQ */}
      <FAQSection />

      {/* Final CTA */}
      <FinalCta />

      {/* Footer */}
      <FooterSection />

    </div>
  );
}

export default LandingPage;
