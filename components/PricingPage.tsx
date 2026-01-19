import Header from './common/Header';
import Footer from '../app/landing-page/components/Footer';
import PricingSection from '../app/landing-page/components/PricingSection';

export default function PricingPage(_props: any) {
  return (
    <div className="copilot-theme min-h-screen bg-background text-foreground">
      <Header onTrialClick={() => { window.history.pushState({}, '', '/login'); window.dispatchEvent(new PopStateEvent('popstate')); }} />
      <main className="pt-24">
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
}
