'use client';

import Header from '@/components/common/Header';
import Footer from '@/app/landing-page/components/Footer';
import { UserDashboardGuide } from '@/components/UserDashboardGuide';

const GuidePage = () => {
  return (
    <div className="copilot-theme min-h-screen bg-background text-foreground">
      <Header />
      <section className="py-12 px-6 bg-gradient-to-br from-primary/10 via-background to-accent/5">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <h1 className="font-headline text-5xl font-bold">Product Guide</h1>
          <p className="text-lg text-muted-foreground">
            The exact quick-start steps from the dashboard—mentor sessions, AI interviews, and the stealth console—in one place.
          </p>
        </div>
      </section>
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <UserDashboardGuide onNavigate={() => {}} />
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default GuidePage;


