'use client';

import { useEffect, useState } from 'react';
import Icon from '../ui/AppIcon';
import SpaLink, { spaNavigate } from './SpaLink';


interface HeaderProps {
  onTrialClick?: () => void;
  /**
   * When false, the header will be hidden on initial load and will appear after the user scrolls.
   * This is used on the landing page to keep the hero full-bleed.
   */
  showOnLoad?: boolean;
}

const Header = ({ onTrialClick, showOnLoad = true }: HeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [showHeader, setShowHeader] = useState(showOnLoad);

  // Minimal nav to match the Interview Copilot header.
  const navigationItems = [
    { label: 'How It Works', anchor: '#solution', description: 'AI coaching demo' },
    { label: 'Pricing', anchor: '#pricing', description: 'Trial options' },
    { label: 'Blog', href: '/blog', description: 'Interview insights and career tips' },
    { label: 'Contact', href: '/contact', description: 'Get in touch' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY || 0;
      setIsScrolled(y > 10);

      if (!showOnLoad) {
        // Show header after a couple scroll steps.
        setShowHeader(y > 150);
      } else {
        setShowHeader(true);
      }

      // Active section highlighting (anchors).
      const sections = navigationItems
        .filter((item) => (item as any).anchor)
        .map((item) => (item as any).anchor.substring(1));
      const scrollPosition = y + 100;

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (!element) continue;
        const offsetTop = element.offsetTop;
        const offsetBottom = offsetTop + element.offsetHeight;
        if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
          setActiveSection(`#${sectionId}`);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      document.body.style.overflow = '';
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen]);

  const scrollToAnchor = (anchor: string) => {
    const elementId = anchor.substring(1);
    const element = document.getElementById(elementId);
    if (!element) return;
    const offset = 80;
    const elementPosition = element.offsetTop - offset;
    window.scrollTo({ top: elementPosition, behavior: 'smooth' });
  };

  const handleNavClick = (anchor: string) => {
    const onLanding =
      window.location.pathname.replace(/\/+$/, '') === '/landing-page' ||
      window.location.pathname === '/';
    if (!onLanding) {
      spaNavigate('/landing-page');
      // Give the landing page time to render.
      setTimeout(() => scrollToAnchor(anchor), 50);
    } else {
      scrollToAnchor(anchor);
    }
    setIsMobileMenuOpen(false);
  };

  const handleTrialClick = () => {
    if (onTrialClick) {
      onTrialClick();
    } else {
      // Default: go to login.
      spaNavigate('/login');
    }
    setIsMobileMenuOpen(false);
  };

  const headerPositionClass = showOnLoad ? 'sticky' : 'fixed';
  const headerVisibilityClass =
    showOnLoad || showHeader
      ? 'opacity-100 translate-y-0 pointer-events-auto'
      : 'opacity-0 -translate-y-4 pointer-events-none';
  const headerBgClass = isScrolled
    ? 'bg-card shadow-card'
    : showOnLoad
      ? 'bg-card'
      : 'bg-transparent';

  return (
    <header
      className={`${headerPositionClass} top-0 z-[100] w-full transition-all duration-300 ease-out ${headerVisibilityClass} ${headerBgClass}`}
    >
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          type="button"
        onClick={() => spaNavigate('/landing-page')}
        className="flex items-center space-x-3 transition-opacity duration-250 ease-out hover:opacity-80"
      >
        <img src="/buzzer-logo-with-text.svg" alt="BUUZZER" className="h-14 w-auto md:h-16" />
      </button>

        <div className="hidden items-center space-x-8 md:flex">
          {navigationItems.map((item) =>
            (item as any).href ? (
              <button
                key={(item as any).href}
                type="button"
                onClick={() => spaNavigate((item as any).href)}
                className="font-body text-base font-medium transition-colors duration-250 ease-out hover:text-primary text-foreground"
                aria-label={(item as any).description}
              >
                {item.label}
              </button>
            ) : (
              <button
                key={(item as any).anchor}
                type="button"
                onClick={() => handleNavClick((item as any).anchor)}
                className={`font-body text-base font-medium transition-colors duration-250 ease-out hover:text-primary ${
                  activeSection === (item as any).anchor ? 'text-primary' : 'text-foreground'
                }`}
                aria-label={(item as any).description}
              >
                {item.label}
              </button>
            )
          )}

          <SpaLink
            href="/signup"
            className="font-cta rounded-lg bg-accent px-6 py-3 text-base font-semibold text-accent-foreground shadow-cta transition-all duration-250 ease-out hover:bg-accent/90 hover:shadow-lg"
          >
            Start Free Trial
          </SpaLink>
        </div>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex items-center justify-center md:hidden"
          aria-label="Toggle mobile menu"
          aria-expanded={isMobileMenuOpen}
        >
          <Icon
            name={isMobileMenuOpen ? 'XMarkIcon' : 'Bars3Icon'}
            size={28}
            className="text-primary"
          />
        </button>
      </nav>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[200] md:hidden">
          <button
            type="button"
            className="absolute inset-0 top-20 bg-slate-900/30 backdrop-blur-[2px]"
            aria-label="Close mobile menu"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute inset-x-4 top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-3xl border border-border/60 bg-card shadow-2xl">
            <div className="flex flex-col gap-3 p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Menu
              </div>
              {navigationItems.map((item) =>
                (item as any).href ? (
                  <button
                    key={(item as any).href}
                    type="button"
                    onClick={() => {
                      spaNavigate((item as any).href);
                      setIsMobileMenuOpen(false);
                    }}
                    className="group rounded-2xl border border-transparent px-4 py-3 text-left transition-all duration-200 hover:border-border hover:bg-muted/50"
                  >
                    <div className="font-body text-base font-semibold text-foreground">
                      {item.label}
                    </div>
                    <div className="text-xs text-muted-foreground">{(item as any).description}</div>
                  </button>
                ) : (
                  <button
                    key={(item as any).anchor}
                    type="button"
                    onClick={() => handleNavClick((item as any).anchor)}
                    className={`group rounded-2xl border px-4 py-3 text-left transition-all duration-200 ${
                      activeSection === (item as any).anchor
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-transparent hover:border-border hover:bg-muted/50'
                    }`}
                  >
                    <div
                      className={`font-body text-base font-semibold ${
                        activeSection === (item as any).anchor ? 'text-primary' : 'text-foreground'
                      }`}
                    >
                      {item.label}
                    </div>
                    <div className="text-xs text-muted-foreground">{(item as any).description}</div>
                  </button>
                )
              )}

              <div className="mt-2 grid gap-3 border-t border-border/70 pt-4">
                <SpaLink
                  href="/signup"
                  className="font-cta rounded-2xl bg-accent px-6 py-4 text-base font-semibold text-accent-foreground shadow-cta transition-all duration-250 ease-out hover:bg-accent/90 text-center"
                >
                  Start Free Trial
                </SpaLink>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
