'use client';

import { useCallback, useEffect, useState } from 'react';
import Header from '@/components/common/Header';
import Footer from '@/app/landing-page/components/Footer';
import Icon from '@/components/ui/AppIcon';
import SpaLink from '@/components/common/SpaLink';
import { fetchSiteInfo } from '@/services/backendApi';
import { SiteInfo } from '@/types';

interface Section {
  id: string;
  title: string;
  icon: string;
  content: string[];
}

const TermsOfServicePage = () => {
  const [activeSection, setActiveSection] = useState<string>('acceptance');
  const [userRole, setUserRole] = useState<'individual' | 'enterprise' | 'all'>('all');
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);

  useEffect(() => {
    fetchSiteInfo()
      .then((info) => setSiteInfo(info))
      .catch(() => setSiteInfo(null));
  }, []);

  const contactEmail = siteInfo?.contactEmail || 'buuzzer.io@gmail.com';
  const contactPhone = siteInfo?.supportPhone || siteInfo?.whatsappNumber || '+91 98765 43210';
  const contactLocation =
    siteInfo?.contactLocation || 'East Bangalore, Mahadevapura Zone (approx. 20 km from MG Road), India';

  const lastUpdated = 'January 4, 2026';
  const effectiveDate = 'January 1, 2026';

  const quickNav = [
    { id: 'acceptance', label: 'Acceptance of Terms', icon: 'DocumentCheckIcon' },
    { id: 'service', label: 'Service Description', icon: 'SparklesIcon' },
    { id: 'account', label: 'Account Management', icon: 'UserCircleIcon' },
    { id: 'usage', label: 'Acceptable Use', icon: 'ShieldCheckIcon' },
    { id: 'intellectual', label: 'Intellectual Property', icon: 'LockClosedIcon' },
    { id: 'subscription', label: 'Subscription & Payment', icon: 'CreditCardIcon' },
    { id: 'liability', label: 'Liability & Warranties', icon: 'ExclamationTriangleIcon' },
    { id: 'dispute', label: 'Dispute Resolution', icon: 'ScaleIcon' }
  ];

  const sections: Section[] = [
    {
      id: 'acceptance',
      title: '1. Acceptance of Terms',
      icon: 'DocumentCheckIcon',
      content: [
        'By accessing or using Interview Copilot ("the Service"), you agree to be bound by these Terms of Service and all applicable laws and regulations.',
        'If you do not agree with any part of these terms, you may not access or use the Service.',
        'These terms constitute a legally binding agreement between you ("User" or "you") and Interview Copilot Inc. ("Company", "we", "us", or "our").',
        'We reserve the right to modify these terms at any time. Material changes will be communicated via email with 30 days\' notice. Continued use after changes constitutes acceptance.',
        'If you are using the Service on behalf of an organization, you represent that you have authority to bind that organization to these terms.'
      ]
    },
    {
      id: 'service',
      title: '2. Service Description',
      icon: 'SparklesIcon',
      content: [
        'Interview Copilot provides real-time AI-powered interview assistance through audio transcription and contextual response generation.',
        'The Service includes: (a) Chrome Extension for overlay interface, (b) Stealth Console for multi-device access, (c) Resume and job description analysis, (d) Real-time transcription via Deepgram, (e) AI response suggestions via OpenAI.',
        'The Service is designed as a supplementary preparation tool. It does NOT guarantee interview success, job offers, or specific outcomes.',
        'AI-generated responses are suggestions only. Users are responsible for evaluating and adapting all suggestions to their specific context.',
        'We reserve the right to modify, suspend, or discontinue any aspect of the Service with reasonable notice. Critical features will have 90 days\' notice before removal.',
        'Service availability is targeted at 99.5% uptime, excluding scheduled maintenance. We do not guarantee uninterrupted access during live interviews.'
      ]
    },
    {
      id: 'account',
      title: '3. Account Registration & Management',
      icon: 'UserCircleIcon',
      content: [
        'You must create an account to use the Service. Registration requires a valid email address and Google Sign-In authentication.',
        'You are responsible for maintaining the confidentiality of your account credentials. Any activity under your account is your responsibility.',
        'You must be at least 18 years old to create an account. By registering, you represent that you meet this age requirement.',
        'One account per person. Multiple accounts by the same individual are prohibited and may result in termination.',
        'You must provide accurate, current, and complete information during registration and keep your account information updated.',
        'We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or remain inactive for more than 12 months.',
        'Account termination: You may delete your account at any time from account settings. Upon deletion, all personal data will be permanently removed within 30 days, except where retention is required by law.'
      ]
    },
    {
      id: 'usage',
      title: '4. Acceptable Use Policy',
      icon: 'ShieldCheckIcon',
      content: [
        'You agree to use the Service only for lawful purposes and in accordance with these terms.',
        'PROHIBITED USES: (a) Violating any applicable laws or regulations, (b) Infringing intellectual property rights, (c) Transmitting malicious code or viruses, (d) Attempting to gain unauthorized access to systems, (e) Harassing, abusing, or harming others, (f) Impersonating any person or entity.',
        'You may NOT: (a) Reverse engineer, decompile, or disassemble the Service, (b) Use automated systems (bots, scrapers) without written permission, (c) Resell or redistribute the Service without authorization, (d) Remove or alter any proprietary notices.',
        'Interview Ethics: While the Service provides assistance, users are responsible for complying with interview guidelines set by prospective employers. Some companies may prohibit external assistance during interviews.',
        'We encourage transparent use. If an employer explicitly prohibits AI assistance, you should not use the Service during that interview.',
        'Misuse of the Service, including attempts to manipulate AI responses or bypass credit limits, may result in immediate account suspension.',
        'We reserve the right to monitor usage patterns to detect violations, but we do not actively monitor interview content.'
      ]
    },
    {
      id: 'intellectual',
      title: '5. Intellectual Property Rights',
      icon: 'LockClosedIcon',
      content: [
        'The Service, including all software, algorithms, designs, text, graphics, and trademarks, is owned by Interview Copilot Inc. and protected by copyright, trademark, and other intellectual property laws.',
        'We grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for personal or internal business purposes.',
        'You retain ownership of all content you upload (resumes, job descriptions, personal information). By uploading content, you grant us a license to process it solely to provide the Service.',
        'AI-generated responses are created using your input and our proprietary algorithms. You may use these responses, but we retain rights to the underlying AI models and technology.',
        'Feedback and suggestions you provide may be used by us without compensation or attribution.',
        'Third-party trademarks (Zoom, Google Meet, Microsoft Teams, etc.) are property of their respective owners. We do not claim ownership or endorsement.'
      ]
    },
    {
      id: 'subscription',
      title: '6. Subscription, Payment & Refunds',
      icon: 'CreditCardIcon',
      content: [
        'The Service operates on a credit-based system. Credits are consumed based on usage (transcription minutes, AI responses generated).',
        'PRICING PLANS: (a) Free Trial: Limited credits for new users, (b) Pay-As-You-Go: Purchase credits as needed, (c) Monthly Subscription: Recurring credits with discounted rates.',
        'All payments are processed through Stripe. We do not store your payment information on our servers.',
        'Subscription renewals are automatic. You will be charged at the beginning of each billing cycle unless you cancel before the renewal date.',
        'CANCELLATION: You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period. No refunds for partial months.',
        'REFUND POLICY: (a) Free Trial: No refunds (free service), (b) Pay-As-You-Go Credits: Refundable within 7 days if unused, (c) Monthly Subscriptions: Refundable within 7 days of initial purchase only, (d) No refunds for used credits or services.',
        'Price changes will be communicated 30 days in advance. Existing subscribers will be grandfathered at current rates for 90 days.',
        'Failure to pay may result in service suspension. Accounts with outstanding balances for more than 30 days may be terminated.'
      ]
    },
    {
      id: 'liability',
      title: '7. Disclaimers, Limitations of Liability & Warranties',
      icon: 'ExclamationTriangleIcon',
      content: [
        'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.',
        'We disclaim all warranties, including but not limited to: (a) Merchantability, (b) Fitness for a particular purpose, (c) Non-infringement, (d) Accuracy or reliability of AI-generated content.',
        'AI LIMITATIONS: AI-generated responses may contain errors, inaccuracies, or inappropriate suggestions. You are solely responsible for evaluating and using AI outputs.',
        'We do NOT guarantee: (a) Interview success or job offers, (b) Specific salary increases or career outcomes, (c) Uninterrupted or error-free service, (d) Compatibility with all meeting platforms.',
        'LIMITATION OF LIABILITY: To the maximum extent permitted by law, Interview Copilot Inc. shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including lost profits, data loss, or business interruption.',
        'Our total liability for any claim arising from the Service shall not exceed the amount you paid us in the 12 months preceding the claim, or $100, whichever is greater.',
        'Some jurisdictions do not allow limitation of liability for certain damages. In such cases, our liability is limited to the fullest extent permitted by law.',
        'INDEMNIFICATION: You agree to indemnify and hold harmless Interview Copilot Inc. from any claims, damages, or expenses arising from your use of the Service or violation of these terms.'
      ]
    },
    {
      id: 'dispute',
      title: '8. Dispute Resolution & Governing Law',
      icon: 'ScaleIcon',
      content: [
        'These terms are governed by the laws of the State of California, United States, without regard to conflict of law principles.',
        `DISPUTE RESOLUTION PROCESS: (a) Step 1: Contact customer support at ${contactEmail} to resolve informally, (b) Step 2: If unresolved within 30 days, proceed to mediation, (c) Step 3: If mediation fails, proceed to binding arbitration.`,
        'ARBITRATION: Any dispute not resolved through mediation shall be settled by binding arbitration under the rules of the American Arbitration Association (AAA).',
        'Arbitration will be conducted in San Francisco, California, or remotely via video conference. The arbitrator\'s decision is final and binding.',
        'CLASS ACTION WAIVER: You agree to resolve disputes individually. You waive the right to participate in class actions, class arbitrations, or representative actions.',
        'EXCEPTIONS TO ARBITRATION: Either party may seek injunctive relief in court for intellectual property infringement or unauthorized access to systems.',
        'JURISDICTION: For matters not subject to arbitration, you consent to the exclusive jurisdiction of state and federal courts in San Francisco, California.',
        'If any provision of these terms is found unenforceable, the remaining provisions remain in full effect.'
      ]
    }
  ];

  const keyHighlights = [
    { icon: 'CheckCircleIcon', text: 'AI assistance is supplementary - not a guarantee of success' },
    { icon: 'CheckCircleIcon', text: 'Credit-based pricing with 7-day refund on unused credits' },
    { icon: 'CheckCircleIcon', text: 'You own your content; we own the AI technology' },
    { icon: 'CheckCircleIcon', text: 'Disputes resolved through mediation then arbitration' }
  ];

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 100;
      const elementPosition = element.offsetTop - offset;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleDownload = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }, []);

  return (
    <div className="copilot-theme min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center mb-6">
            <Icon name="DocumentTextIcon" size={48} className="text-accent" variant="solid" />
          </div>
          <h1 className="font-headline text-5xl md:text-6xl font-bold mb-6">
            Terms of Service
          </h1>
          <p className="text-xl md:text-2xl text-primary-foreground/90 mb-4">
            Clear, fair terms that protect both your rights and ours. Read in plain language.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm text-primary-foreground/80">
            <span>Last Updated: {lastUpdated}</span>
            <span className="hidden sm:inline">•</span>
            <span>Effective Date: {effectiveDate}</span>
          </div>
        </div>
      </section>

      {/* Key Highlights */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-center mb-12 text-primary">
            Key Points at a Glance
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {keyHighlights.map((highlight, index) => (
              <div key={index} className="bg-card rounded-lg p-6 shadow-card">
                <Icon name={highlight.icon as any} size={32} className="text-success mx-auto mb-4" variant="solid" />
                <p className="font-body text-foreground text-center">{highlight.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Selector */}
      <section className="py-8 px-6 bg-muted">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <span className="font-body text-foreground">I am a:</span>
            <div className="flex gap-3">
              <button
                onClick={() => setUserRole('individual')}
                className={`font-cta px-6 py-2 rounded-lg transition-all duration-250 ${
                  userRole === 'individual' ?'bg-accent text-accent-foreground shadow-cta' :'bg-card text-foreground hover:bg-muted'
                }`}
              >
                Individual User
              </button>
              <button
                onClick={() => setUserRole('enterprise')}
                className={`font-cta px-6 py-2 rounded-lg transition-all duration-250 ${
                  userRole === 'enterprise' ?'bg-accent text-accent-foreground shadow-cta' :'bg-card text-foreground hover:bg-muted'
                }`}
              >
                Enterprise Customer
              </button>
              <button
                onClick={() => setUserRole('all')}
                className={`font-cta px-6 py-2 rounded-lg transition-all duration-250 ${
                  userRole === 'all' ?'bg-accent text-accent-foreground shadow-cta' :'bg-card text-foreground hover:bg-muted'
                }`}
              >
                View All
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="py-12 px-6 sticky top-20 bg-background z-50 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex overflow-x-auto gap-4 pb-2">
            {quickNav.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-250 ${
                  activeSection === item.id
                    ? 'bg-accent text-accent-foreground shadow-cta'
                    : 'bg-card text-foreground hover:bg-muted'
                }`}
              >
                <Icon name={item.icon as any} size={20} />
                <span className="font-cta text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Terms Content */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-12">
          {sections.map((section) => (
            <div key={section.id} id={section.id} className="scroll-mt-32">
              <div className="bg-card rounded-lg p-8 shadow-card">
                <div className="flex items-start gap-4 mb-6">
                  <Icon name={section.icon as any} size={40} className="text-accent flex-shrink-0" />
                  <h2 className="font-headline text-2xl md:text-3xl font-bold text-primary">
                    {section.title}
                  </h2>
                </div>
                <div className="space-y-4">
                  {section.content.map((paragraph, index) => (
                    <p key={index} className="font-body text-foreground leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Plain Language Summary */}
      <section className="py-16 px-6 bg-muted">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline text-3xl md:text-4xl font-bold mb-8 text-center text-primary">
            Plain Language Summary
          </h2>
          <div className="bg-card rounded-lg p-8 shadow-card">
            <div className="space-y-6">
              <div>
                <h3 className="font-headline text-xl font-semibold text-primary mb-3">What You're Agreeing To:</h3>
                <p className="font-body text-foreground leading-relaxed">
                  You're agreeing to use Interview Copilot responsibly as a preparation tool. We provide AI assistance, but you're responsible for how you use it and for your interview outcomes.
                </p>
              </div>
              <div>
                <h3 className="font-headline text-xl font-semibold text-primary mb-3">What We Promise:</h3>
                <p className="font-body text-foreground leading-relaxed">
                  We'll provide the Service as described, protect your privacy, and treat you fairly. We'll give you notice before making major changes.
                </p>
              </div>
              <div>
                <h3 className="font-headline text-xl font-semibold text-primary mb-3">What We Don't Promise:</h3>
                <p className="font-body text-foreground leading-relaxed">
                  We can't guarantee interview success, perfect AI responses, or 100% uptime. The Service is a tool to help you prepare, not a guarantee of outcomes.
                </p>
              </div>
              <div>
                <h3 className="font-headline text-xl font-semibold text-primary mb-3">If Something Goes Wrong:</h3>
                <p className="font-body text-foreground leading-relaxed">
                  Contact our support team first. If we can't resolve it, we'll try mediation. As a last resort, we'll use binding arbitration instead of going to court.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Version Comparison */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline text-3xl md:text-4xl font-bold mb-8 text-center text-primary">
            Terms Version History
          </h2>
          <div className="space-y-4">
            <div className="bg-card rounded-lg p-6 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-headline text-lg font-semibold text-primary">Version 2.0</h3>
                <span className="font-cta text-sm text-accent bg-accent/10 px-3 py-1 rounded-full">Current</span>
              </div>
              <p className="font-body text-muted-foreground mb-2">Effective: {effectiveDate}</p>
              <p className="font-body text-foreground">Added Stealth Console terms, updated refund policy to 7 days, clarified AI limitations.</p>
            </div>
            <div className="bg-card rounded-lg p-6 shadow-card opacity-60">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-headline text-lg font-semibold text-primary">Version 1.0</h3>
                <span className="font-cta text-sm text-muted-foreground">Archived</span>
              </div>
              <p className="font-body text-muted-foreground mb-2">Effective: June 1, 2025</p>
              <p className="font-body text-foreground">Initial terms of service at platform launch.</p>
            </div>
          </div>
          <div className="mt-6 text-center">
            <button className="font-cta text-accent hover:text-accent/80 font-semibold transition-colors duration-250">
              Compare Versions →
            </button>
          </div>
        </div>
      </section>

      {/* Contact & Legal Support */}
      <section className="py-16 px-6 bg-muted">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-headline text-3xl md:text-4xl font-bold mb-8 text-center text-primary">
            Questions About These Terms?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card rounded-lg p-6 shadow-card">
              <Icon name="ChatBubbleLeftRightIcon" size={32} className="text-accent mb-4" />
              <h3 className="font-headline text-xl font-semibold text-primary mb-3">
                General Inquiries
              </h3>
              <p className="font-body text-foreground mb-4">
                For questions about how these terms apply to your situation, contact our support team.
              </p>
              <p className="font-body text-foreground">
                <strong>Email:</strong> {contactEmail}<br />
                <strong>Response Time:</strong> Within 24 hours
              </p>
            </div>
            <div className="bg-card rounded-lg p-6 shadow-card">
              <Icon name="ScaleIcon" size={32} className="text-accent mb-4" />
              <h3 className="font-headline text-xl font-semibold text-primary mb-3">
                Business Contact
              </h3>
              <p className="font-body text-foreground mb-4">
                For formal inquiries or notices, reach us using the contact information below.
              </p>
              <p className="font-body text-foreground">
                <strong>Email:</strong> {contactEmail}<br />
                <strong>Mail:</strong> Buuzzer<br />{contactLocation}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Acceptance Confirmation */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-accent/10 border-2 border-accent rounded-lg p-8">
            <Icon name="DocumentCheckIcon" size={48} className="text-accent mx-auto mb-4" variant="solid" />
            <h3 className="font-headline text-2xl font-bold text-primary mb-4">
              By Using Interview Copilot, You Agree to These Terms
            </h3>
            <p className="font-body text-foreground mb-6">
              If you have questions or concerns about any section, please contact us before using the Service.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <SpaLink
                href="/contact"
                className="font-cta px-8 py-3 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 shadow-cta transition-all duration-250 text-center"
              >
                Contact Support
              </SpaLink>
              <button
                onClick={handleDownload}
                className="font-cta px-8 py-3 rounded-lg bg-card text-foreground hover:bg-muted border border-border transition-all duration-250"
              >
                Download PDF Version
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TermsOfServicePage;
