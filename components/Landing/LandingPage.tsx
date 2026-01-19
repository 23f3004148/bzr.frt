import React, { useEffect } from 'react';
import { AppState } from '@/types';
import { Header } from './Header';
import { Footer } from './Footer';
import { HeroSection } from './HeroSection';
import { InterviewGapSection } from './InterviewGapSection';
import { WhatItIsSection } from './WhatItIsSection';
import { HowItWorksSection } from './HowItWorksSection';
import { FeaturesSection } from './FeaturesSection';
import { UseCasesSection } from './UseCasesSection';
import { EthicsSection } from './EthicsSection';
import { StatsSection } from './StatsSection';
import { FAQSection } from './FAQSection';
import { CTASection } from './CTASection';
import { PricingSection } from './PricingSection';
import { TestimonialsSection } from './TestimonialsSection';

interface LandingPageProps {
  onLogin: () => void;
  onNavigate: (state: AppState) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onNavigate }) => {
  useEffect(() => {
    const handleHashScroll = () => {
      const hash = window.location.hash;
      if (!hash) return;
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    };
    handleHashScroll();
    window.addEventListener('hashchange', handleHashScroll);
    return () => window.removeEventListener('hashchange', handleHashScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header onNavigate={onNavigate} onLogin={onLogin} />
      
      <main>
        <HeroSection onLogin={onLogin} onNavigate={onNavigate} />
        <InterviewGapSection />
        <WhatItIsSection />
        <HowItWorksSection />
        <FeaturesSection />
        <UseCasesSection />
        <EthicsSection />
        <TestimonialsSection />
        <div id="pricing">
          <PricingSection onLogin={onLogin} />
        </div>
        <StatsSection />
        <FAQSection />
        <CTASection onLogin={onLogin} />
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default LandingPage;
