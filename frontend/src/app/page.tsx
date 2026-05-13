"use client";

import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { StatsSection } from "@/components/StatsSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { AgentsGrid } from "@/components/AgentsGrid";
import { LiveNewsSection } from "@/components/LiveNewsSection";
import { MultiAgentNewsPanel } from "@/components/MultiAgentNewsPanel";
import { UltimateNewsPanel } from "@/components/UltimateNewsPanel";
import { PricingSection } from "@/components/PricingSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#030014] selection:bg-purple-500/30">
      <Navbar />

      <main className="relative z-10">
        <HeroSection />
        <StatsSection />
        <MultiAgentNewsPanel />
        <LiveNewsSection />
        <UltimateNewsPanel />
        <FeaturesSection />
        <AgentsGrid />
        <PricingSection />
        <TestimonialsSection />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
}
