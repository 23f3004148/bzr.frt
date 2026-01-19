'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/common/Header';
import Footer from '@/app/landing-page/components/Footer';
import Icon from '@/components/ui/AppIcon';
import { fetchSiteInfo } from '@/services/backendApi';
import { SiteInfo } from '@/types';

const lastUpdated = '17/01/2026';
const appName = 'Buuzzer';

const personalInformation = [
  'Name',
  'Email address',
  'Phone number',
  'Billing or payment-related details (handled securely by third-party payment providers)'
];

const paymentInformation = [
  'Payments on Buuzzer are processed by third-party gateways such as Razorpay',
  'Card details, UPI IDs, net banking credentials, or wallet information are not stored on our servers',
  'All payment transactions are encrypted and handled directly by Razorpay in compliance with applicable regulations'
];

const usageData = [
  'IP address',
  'Browser type and device information',
  'Pages visited and interaction data',
  'Date and time of access'
];

const useOfInformation = [
  'Provide and maintain the Service',
  'Process payments and subscriptions',
  'Communicate updates, confirmations, and support messages',
  'Improve functionality, security, and user experience',
  'Comply with legal and regulatory obligations'
];

const cookiePractices = [
  'Maintain user sessions',
  'Analyze usage patterns',
  'Improve performance and reliability',
  'You can control cookies through your browser settings'
];

const sharingPractices = [
  'We do not sell or rent your personal data',
  'Payment service providers (e.g., Razorpay) for transaction processing',
  'Service providers assisting in hosting, analytics, or infrastructure',
  'Legal authorities if required by law or regulatory obligations',
  'All third parties are obligated to protect your data'
];

const dataRetention = [
  'Fulfill the purposes outlined in this policy',
  'Comply with legal, accounting, or regulatory requirements'
];

const userRights = [
  'Access your personal data',
  'Request correction or deletion',
  'Withdraw consent where applicable (subject to legal limits)'
];

const sectionClass = 'max-w-5xl mx-auto px-6';

const PrivacyPolicyPage = () => {
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);

  useEffect(() => {
    fetchSiteInfo()
      .then((info) => setSiteInfo(info))
      .catch(() => setSiteInfo(null));
  }, []);

  const contactEmail = siteInfo?.contactEmail || 'buuzzer.io@gmail.com';
  const contactPhone = siteInfo?.supportPhone || siteInfo?.whatsappNumber || '+91 98765 43210';
  const locationText =
    siteInfo?.contactLocation || 'East Bangalore, Mahadevapura Zone (approx. 20 km from MG Road), India';

  return (
    <div className="copilot-theme min-h-screen bg-background">
      <Header />

      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center mb-6">
            <Icon name="ShieldCheckIcon" size={48} className="text-accent" variant="solid" />
          </div>
          <h1 className="font-headline text-5xl md:text-6xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-lg md:text-xl text-primary-foreground/90 mb-4">
            Last updated: {lastUpdated}
          </p>
          <p className="text-lg md:text-xl text-primary-foreground/90">
            Welcome to {appName}. This Privacy Policy describes how we collect, use, disclose, and protect your information when you use our website or application (the "Service").
          </p>
          <p className="text-sm md:text-base text-primary-foreground/80 mt-4">
            By using the Service, you agree to the practices described in this Privacy Policy.
          </p>
        </div>
      </section>

      <section className={`py-12 ${sectionClass}`}>
        <div className="bg-card rounded-xl shadow-card p-6 md:p-8 space-y-3">
          <h2 className="font-headline text-3xl font-bold text-primary">1. Introduction</h2>
          <p className="font-body text-foreground leading-relaxed">
            {appName} ("we", "our", "us") is committed to protecting your privacy and handling your data responsibly. This notice explains what we collect, why we collect it, and how you can exercise your rights.
          </p>
        </div>
      </section>

      <section className={`py-12 bg-muted ${sectionClass}`}>
        <h2 className="font-headline text-3xl font-bold text-primary text-center mb-10">2. Information We Collect</h2>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="bg-card rounded-xl shadow-card p-6 space-y-3">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Icon name="UserCircleIcon" size={28} />
              <span>Personal Information</span>
            </div>
            <ul className="list-disc list-inside space-y-2 text-foreground font-body">
              {personalInformation.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="bg-card rounded-xl shadow-card p-6 space-y-3">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Icon name="CreditCardIcon" size={28} />
              <span>Payment Information</span>
            </div>
            <ul className="list-disc list-inside space-y-2 text-foreground font-body">
              {paymentInformation.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="bg-card rounded-xl shadow-card p-6 space-y-3">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Icon name="GlobeAltIcon" size={28} />
              <span>Usage & Technical Data</span>
            </div>
            <ul className="list-disc list-inside space-y-2 text-foreground font-body">
              {usageData.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className={`py-12 ${sectionClass}`}>
        <div className="bg-card rounded-xl shadow-card p-6 md:p-8 space-y-4">
          <h2 className="font-headline text-3xl font-bold text-primary">3. How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-2 text-foreground font-body">
            {useOfInformation.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className={`py-12 bg-muted ${sectionClass}`}>
        <div className="bg-card rounded-xl shadow-card p-6 md:p-8 space-y-4">
          <h2 className="font-headline text-3xl font-bold text-primary">4. Cookies & Tracking Technologies</h2>
          <ul className="list-disc list-inside space-y-2 text-foreground font-body">
            {cookiePractices.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className={`py-12 ${sectionClass}`}>
        <div className="bg-card rounded-xl shadow-card p-6 md:p-8 space-y-4">
          <h2 className="font-headline text-3xl font-bold text-primary">5. Data Sharing & Disclosure</h2>
          <ul className="list-disc list-inside space-y-2 text-foreground font-body">
            {sharingPractices.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className={`py-12 bg-muted ${sectionClass}`}>
        <div className="bg-card rounded-xl shadow-card p-6 md:p-8 space-y-3">
          <h2 className="font-headline text-3xl font-bold text-primary">6. Data Security</h2>
          <p className="font-body text-foreground leading-relaxed">
            We implement reasonable technical and organizational measures to protect your data against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is completely secure.
          </p>
        </div>
      </section>

      <section className={`py-12 ${sectionClass}`}>
        <div className="bg-card rounded-xl shadow-card p-6 md:p-8 space-y-3">
          <h2 className="font-headline text-3xl font-bold text-primary">7. Data Retention</h2>
          <p className="font-body text-foreground leading-relaxed">
            We retain personal data only for as long as necessary to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-foreground font-body">
            {dataRetention.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className={`py-12 bg-muted ${sectionClass}`}>
        <div className="bg-card rounded-xl shadow-card p-6 md:p-8 space-y-3">
          <h2 className="font-headline text-3xl font-bold text-primary">8. User Rights</h2>
          <p className="font-body text-foreground leading-relaxed">
            Depending on applicable laws, you may have the right to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-foreground font-body">
            {userRights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="font-body text-muted-foreground text-sm">
            Requests can be made via the contact details below.
          </p>
        </div>
      </section>

      <section className={`py-12 ${sectionClass}`}>
        <div className="bg-card rounded-xl shadow-card p-6 md:p-8 space-y-3">
          <h2 className="font-headline text-3xl font-bold text-primary">9. Third-Party Links</h2>
          <p className="font-body text-foreground leading-relaxed">
            Our Service may contain links to third-party websites. We are not responsible for the privacy practices or content of those websites.
          </p>
        </div>
      </section>

      <section className={`py-12 bg-muted ${sectionClass}`}>
        <div className="bg-card rounded-xl shadow-card p-6 md:p-8 space-y-3">
          <h2 className="font-headline text-3xl font-bold text-primary">10. Changes to This Privacy Policy</h2>
          <p className="font-body text-foreground leading-relaxed">
            We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Last updated" date.
          </p>
        </div>
      </section>

      <section className={`py-12 ${sectionClass}`}>
        <div className="bg-card rounded-xl shadow-card p-6 md:p-8 space-y-4">
          <h2 className="font-headline text-3xl font-bold text-primary">11. Contact Information</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <Icon name="EnvelopeIcon" size={28} className="text-accent flex-shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Email</p>
                <p className="font-body text-foreground">{contactEmail}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Icon name="PhoneIcon" size={28} className="text-accent flex-shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Phone & WhatsApp</p>
                <p className="font-body text-foreground">{contactPhone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 md:col-span-2">
              <Icon name="MapPinIcon" size={28} className="text-accent flex-shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Location</p>
                <p className="font-body text-foreground">{locationText}</p>
                <p className="font-body text-muted-foreground text-sm">Country: India</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PrivacyPolicyPage;

