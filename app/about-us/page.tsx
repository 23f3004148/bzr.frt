'use client';

import Header from '@/components/common/Header';
import Footer from '@/app/landing-page/components/Footer';
import Icon from '@/components/ui/AppIcon';

const pillars = [
  {
    icon: 'ShieldCheckIcon',
    title: 'Privacy-First',
    body: 'No resumes or interview audio are stored. Transcription and suggestions are processed securely and then cleared.'
  },
  {
    icon: 'CpuChipIcon',
    title: 'AI That Stays Out Of The Way',
    body: 'Lightweight overlays, manual controls, and on-demand prompts keep you in control during every interview.'
  },
  {
    icon: 'LightBulbIcon',
    title: 'Practical Guidance',
    body: 'We focus on actionable hints, STAR prompts, and concise answers instead of glossy marketing or founder bios.'
  },
  {
    icon: 'AdjustmentsHorizontalIcon',
    title: 'User-Controlled',
    body: 'Toggle transcription, clear history, and manage preferences yourself—no hidden switches or approvals needed.'
  }
];

const workflow = [
  'Start the overlay only when you need it. Pause or stop anytime.',
  'Paste the role + JD + resume context and get tailored prompts on the fly.',
  'Use quick templates (STAR, clarifying questions, follow-ups) directly in the console.',
  'Download or clear your session notes immediately after you finish.'
];

const transparency = [
  'We intentionally keep this page free of headshots, investor logos, and vanity metrics.',
  'Decisions are made by a small independent team focused on shipping safer, quieter AI tools.',
  'If you need details about our data practices, the Privacy Policy and Responsible Use pages stay up to date.'
];

const AboutUsPage = () => {
  return (
    <div className="copilot-theme min-h-screen bg-background text-foreground">
      <Header />

      <section className="bg-gradient-to-br from-primary to-primary/85 text-primary-foreground py-16 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2 text-sm font-semibold">
            <Icon name="EyeSlashIcon" size={18} />
            <span>No founder spotlight. Just the product.</span>
          </div>
          <h1 className="font-headline text-5xl md:text-6xl font-bold">
            About Buuzzer (Without The Hype)
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/85">
            We build a privacy-first AI interview assistant and keep the spotlight on what matters—your preparation, not our faces.
          </p>
        </div>
      </section>

      <section className="py-14 px-6">
        <div className="max-w-6xl mx-auto grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar) => (
            <div key={pillar.title} className="bg-card border border-border rounded-xl p-6 shadow-card space-y-3">
              <Icon name={pillar.icon as any} size={28} className="text-accent" />
              <h3 className="font-headline text-xl font-semibold">{pillar.title}</h3>
              <p className="font-body text-muted-foreground">{pillar.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-14 px-6 bg-muted/50">
        <div className="max-w-5xl mx-auto">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-card space-y-4">
            <h2 className="font-headline text-3xl font-bold text-primary">How Buuzzer Works (In Practice)</h2>
            <ul className="list-decimal list-inside space-y-3 font-body text-foreground/90">
              {workflow.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ul>
            <div className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Icon name="InformationCircleIcon" size={18} />
              <span>Need a walkthrough? Open the Guide from the footer to see the full quick-start steps.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="font-headline text-3xl font-bold text-primary text-center">Why We Stay Low-Key</h2>
          <div className="bg-card border border-border rounded-2xl p-8 shadow-card space-y-3">
            {transparency.map((line, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <Icon name="NoSymbolIcon" size={20} className="text-secondary mt-1" />
                <p className="font-body text-foreground/90">{line}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-6 bg-muted/50">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h3 className="font-headline text-2xl font-bold text-primary">Want the product details?</h3>
          <p className="font-body text-muted-foreground">
            Check the Guide for step-by-step usage, or visit Privacy & Responsible Use for data handling specifics.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/guide" className="font-cta px-6 py-3 bg-accent text-accent-foreground rounded-lg shadow-cta hover:bg-accent/90 transition-colors">
              Open Guide
            </a>
            <a href="/privacy-policy" className="font-cta px-6 py-3 bg-card text-foreground border border-border rounded-lg hover:bg-muted transition-colors">
              Review Privacy Policy
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutUsPage;


