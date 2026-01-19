'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/common/Header';
import ScrollProgress from '@/components/common/ScrollProgress';
import HeroSection from './HeroSection';
import ProblemSection from './ProblemSection';
import SolutionSection from './SolutionSection';
import InteractiveDemoSection from './InteractiveDemoSection';
import BenefitsSection from './BenefitsSection';
import TestimonialsSection from './TestimonialsSection';
import PricingSection from './PricingSection';
import FAQSection from './FAQSection';
import CTASection from './CTASection';
import Footer from './Footer';
import TrialModal from './TrialModal';

const LandingPageInteractive = () => {
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [showFloatingNav, setShowFloatingNav] = useState(false);

  const handleTrialClick = () => {
    setIsTrialModalOpen(true);
  };

  const handleDemoClick = () => {
    setIsDemoModalOpen(true);
  };

  // Landing page: hide the navbar (and top chrome) until the user scrolls a bit.
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY || 0;
      setShowFloatingNav(y > 150);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="copilot-theme min-h-screen bg-background text-foreground">
      <Header onTrialClick={handleTrialClick} showOnLoad={false} />
      {showFloatingNav && <ScrollProgress />}

      <main>
        <HeroSection onTrialClick={handleTrialClick} onDemoClick={handleDemoClick} />
        <ProblemSection />
        <SolutionSection />
        <InteractiveDemoSection />
        <BenefitsSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>

      <Footer />

      <TrialModal isOpen={isTrialModalOpen} onClose={() => setIsTrialModalOpen(false)} />

      {isDemoModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-primary/80 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-2xl max-w-4xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="font-headline text-2xl font-semibold text-foreground">AI Coaching Demo</h3>
              <button
                onClick={() => setIsDemoModalOpen(false)}
                className="w-10 h-10 rounded-full hover:bg-muted transition-colors duration-250 flex items-center justify-center"
              >
                <span className="text-2xl text-muted-foreground">&times;</span>
              </button>
            </div>
            <div className="aspect-video bg-muted">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                title="AI Interview Coaching Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-b-2xl"
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPageInteractive;
