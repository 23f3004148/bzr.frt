'use client';

import { useState, useEffect } from 'react';
import SpaLink, { spaNavigate } from '../../../components/common/SpaLink';
import Icon from '@/components/ui/AppIcon';
import { fetchSiteInfo } from '@/services/backendApi';
import { SiteInfo } from '@/types';

const Footer = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentYear, setCurrentYear] = useState(2026);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);

  useEffect(() => {
    setIsHydrated(true);
    setCurrentYear(new Date().getFullYear());
    fetchSiteInfo()
      .then((info) => setSiteInfo(info))
      .catch(() => setSiteInfo(null));
  }, []);

  const footerLinks = {
    product: [
      { label: 'Features', targetId: 'features' },
      { label: 'Pricing', targetId: 'pricing' },
      { label: 'How It Works', targetId: 'how-it-works' },
      { label: 'FAQ', targetId: 'faq' }
    ],
    company: [
      { label: 'About Us', href: '/about-us' },
      { label: 'Guide', href: '/guide' },
      { label: 'Contact', href: '/contact' },
      { label: 'Blog', href: '/blog' }
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms of Service', href: '/terms-of-service' },
      { label: 'Responsible Use', href: '/responsible-ai-use' },
      { label: 'Security', href: '/security' }
    ]
  };

  const socialLinks = [
    { name: 'Instagram', icon: 'CameraIcon', href: siteInfo?.instagramUrl || 'https://instagram.com' },
    { name: 'LinkedIn', icon: 'BuildingOfficeIcon', href: siteInfo?.linkedinUrl || 'https://linkedin.com' },
    { name: 'YouTube', icon: 'PlayCircleIcon', href: siteInfo?.youtubeUrl || 'https://youtube.com' }
  ];

  const isOnLanding = () =>
    window.location.pathname.replace(/\/+$/, '') === '/landing-page' ||
    window.location.pathname === '/';

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const top = element.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleProductLink = (targetId: string) => {
    if (!targetId) return;
    if (!isOnLanding()) {
      spaNavigate(`/landing-page#${targetId}`);
      setTimeout(() => scrollToSection(targetId), 80);
      return;
    }
    scrollToSection(targetId);
  };

  const handleNavigateTop = (href: string) => {
    spaNavigate(href);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  };

  return (
    <footer className="text-white" style={{ background: 'var(--gradient-footer)' }}>
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-1">
              <div className="flex h-20 w-auto items-center">
                <img src="/footer_logo.svg" alt="Buuzzer" className="h-20 w-auto object-contain" />
              </div>
            </div>
            <p className="text-primary-foreground/80 mb-6 max-w-sm">
              Real-time AI assistance for live interviews. Privacy-first, user-controlled, and designed for professional preparation.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-accent transition-colors duration-250 flex items-center justify-center"
                  aria-label={social.name}
                >
                  <Icon name={social.icon as any} size={20} />
                </a>
              ))}
              {siteInfo?.whatsappNumber && (
                <a
                  href={`https://wa.me/${siteInfo.whatsappNumber.replace(/\\D/g, '')}`}
                  className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-250 flex items-center justify-center"
                  aria-label="WhatsApp"
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 32 32"
                    className="h-8 w-8 text-white fill-current"
                    aria-hidden="true"
                  >
                    <path d="M16 3C9.383 3 4 8.383 4 15c0 2.121.54 4.125 1.477 5.883L4 29l8.305-1.348A11.87 11.87 0 0 0 16 27c6.617 0 12-5.383 12-12S22.617 3 16 3Zm0 2c5.534 0 10 4.466 10 10 0 5.532-4.466 10-10 10-1.57 0-3.06-.37-4.383-1.02l-.316-.152-4.512.732.81-4.25-.183-.29A9.88 9.88 0 0 1 6 15c0-5.534 4.466-10 10-10Zm-3.73 5.002c-.234-.004-.527.005-.816.256-.46.406-1.2 1.18-1.2 2.086 0 .9.625 1.77.713 1.895.089.123 1.78 2.86 4.38 3.892 2.105.83 2.484.665 2.932.62.448-.044 1.448-.59 1.653-1.159.205-.57.205-1.057.145-1.159-.06-.102-.234-.168-.49-.293-.257-.126-1.522-.75-1.758-.836-.234-.089-.405-.126-.577.126-.173.255-.665.836-.816 1.01-.152.172-.304.193-.56.067-.257-.126-1.083-.4-2.064-1.276-.763-.68-1.276-1.52-1.427-1.776-.152-.258-.016-.397.114-.522.118-.117.257-.304.384-.456.127-.151.17-.257.257-.429.086-.172.044-.319-.022-.445-.066-.125-.577-1.388-.817-1.897-.214-.456-.434-.466-.668-.47Z" />
                  </svg>
                </a>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <button
                    type="button"
                    onClick={() => handleProductLink((link as any).targetId || '')}
                    className="text-left text-primary-foreground/80 hover:text-accent transition-colors duration-250"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <button
                    type="button"
                    onClick={() => handleNavigateTop(link.href)}
                    className="text-left text-primary-foreground/80 hover:text-accent transition-colors duration-250"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Legal & Security</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <button
                    type="button"
                    onClick={() => handleNavigateTop(link.href)}
                    className="text-left text-primary-foreground/80 hover:text-accent transition-colors duration-250"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-primary-foreground/70 text-sm">
              {isHydrated ? (
                <>© {currentYear} Buuzzer Copilot. All rights reserved.</>
              ) : (
                <>© 2026 Buuzzer Copilot. All rights reserved.</>
              )}
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Icon name="ShieldCheckIcon" size={16} variant="solid" />
                <span className="text-primary-foreground/70">Privacy-First</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="LockClosedIcon" size={16} variant="solid" />
                <span className="text-primary-foreground/70">No Data Storage</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="HandRaisedIcon" size={16} />
                <span className="text-primary-foreground/70">User Controlled</span>
              </div>
              <SpaLink
                href="/admin/login"
                aria-label="Admin"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary-foreground/10 hover:bg-primary-foreground/20 transition border border-primary-foreground/20"
              >
                <img
                  src="/Buuzzer_LOGO.svg"
                  alt="Admin"
                  className="h-6 w-6 object-contain opacity-80 hover:opacity-100"
                />
              </SpaLink>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
