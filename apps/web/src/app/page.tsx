import { Navbar } from "@/components/landing/navbar";
import { HorizontalScroll } from "@/components/landing/horizontal-scroll";
import { HeroSection } from "@/components/landing/hero-section";
import { ProblemSection } from "@/components/landing/problem-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { PetSection } from "@/components/landing/pet-section";
import { AiSection } from "@/components/landing/ai-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { CtaSection } from "@/components/landing/cta-section";

export default function Home() {
  return (
    <>
      <Navbar />
      <HorizontalScroll>
        <HeroSection />
        <ProblemSection />
        <FeaturesSection />
        <PetSection />
        <AiSection />
        <PricingSection />
        <CtaSection />
      </HorizontalScroll>
    </>
  );
}
