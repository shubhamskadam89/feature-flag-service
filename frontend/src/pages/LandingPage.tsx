import { Navbar } from '../components/landing/Navbar';
import { Hero } from '../components/landing/Hero';
import { MarqueeTicker } from '../components/landing/MarqueeTicker';
import { SoundFamiliar } from '../components/landing/SoundFamiliar';
import { ProcessSection } from '../components/landing/ProcessSection';
import { HorizontalPlayground } from '../components/HorizontalPlayground/HorizontalPlayground';
import { ComparisonTable } from '../components/landing/ComparisonTable';
import { StatsAndTestimonials } from '../components/landing/StatsAndTestimonials';
import { PricingSection } from '../components/landing/PricingSection';
import { FAQSection } from '../components/landing/FAQSection';
import { FooterSection } from '../components/landing/FooterSection';

export function LandingPage() {
  const scrollToSimulation = () => {
    document.getElementById('simulation')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen bg-[#fffdf6] font-sans antialiased text-[#131311]">
      <Navbar />

      <Hero onExploreClick={scrollToSimulation} />

      {/* Legacy sections remain temporarily while the new narrative is ported section-by-section. */}
      <MarqueeTicker />
      <SoundFamiliar />
      <ProcessSection />
      <HorizontalPlayground />
      <ComparisonTable />
      <StatsAndTestimonials />
      <PricingSection />
      <FAQSection />
      <FooterSection />
    </div>
  );
}

export default LandingPage;
