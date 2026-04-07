"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { Navbar } from "@/components/landing/navbar";
import { HorizontalScroll } from "@/components/landing/horizontal-scroll";
import { HeroSection } from "@/components/landing/hero-section";
import { ProblemSection } from "@/components/landing/problem-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { PetSection } from "@/components/landing/pet-section";
import { AiSection } from "@/components/landing/ai-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { CtaSection } from "@/components/landing/cta-section";
import { AuthModal } from "@/components/landing/auth-modal";
import { UserPortal } from "@/components/landing/user-portal";

export function LandingPage() {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPortal, setShowPortal] = useState(false);

  return (
    <>
      <Navbar
        onLoginClick={() => setShowAuthModal(true)}
        isLoggedIn={!!user}
        onPortalClick={() => setShowPortal(true)}
      />
      <HorizontalScroll>
        <HeroSection />
        <ProblemSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <PetSection />
        <AiSection />
        <PricingSection />
        <CtaSection />
      </HorizontalScroll>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={() => {
          setShowAuthModal(false);
          setShowPortal(true);
        }}
      />

      {/* User Portal */}
      <AnimatePresence>
        {showPortal && user && (
          <UserPortal onClose={() => setShowPortal(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
