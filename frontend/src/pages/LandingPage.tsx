import { Navbar } from '../components/landing/Navbar';
import { MarqueeTicker } from '../components/landing/MarqueeTicker';
import { HeroSection } from '../components/landing/HeroSection';
import { SoundFamiliar } from '../components/landing/SoundFamiliar';
import { ProcessSection } from '../components/landing/ProcessSection';
import { HorizontalPlayground } from '../components/HorizontalPlayground/HorizontalPlayground';
import { ComparisonTable } from '../components/landing/ComparisonTable';
import { StatsAndTestimonials } from '../components/landing/StatsAndTestimonials';
import { PricingSection } from '../components/landing/PricingSection';
import { FAQSection } from '../components/landing/FAQSection';
import { FooterSection } from '../components/landing/FooterSection';

export function LandingPage() {
  const scrollToPlayground = () => {
    const playgroundElement = document.getElementById('playground');
    if (playgroundElement) {
      playgroundElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen text-[#131311] bg-[#fffdf6] font-sans antialiased">
      
      {/* Fixed Navbar */}
      <Navbar />

      {/* Hero Section */}
      <HeroSection onExploreClick={scrollToPlayground} />

      {/* Infinite Marquee Ticker */}
      <MarqueeTicker />

      {/* Pain Points ("Sound Familiar?") */}
      <SoundFamiliar />

      {/* 5-Step Process */}
      <ProcessSection />

      {/* Horizontal Scroll Playground with Device Screen Frames */}
      <HorizontalPlayground />

      {/* Feature Comparison Table */}
      <ComparisonTable />

      {/* Metrics & Testimonials */}
      <StatsAndTestimonials />

      {/* Transparent Pricing */}
      <PricingSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* High-Impact Footer & Waitlist Form */}
      <FooterSection />

    </div>
  );
}

export default LandingPage;
