import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AppState } from '@/types';
import { Menu, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  onNavigate: (state: AppState) => void;
  onLogin: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, onLogin }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Features', state: AppState.FEATURES },
    { label: 'How it Works', state: AppState.HOW_IT_WORKS },
    { label: 'Pricing', state: AppState.PRICING },
    { label: 'Blog', state: AppState.BLOG },
    { label: 'Contact', state: AppState.CONTACT },
  ];

  const handleNavClick = (state: AppState) => {
    onNavigate(state);
    setMobileMenuOpen(false);
  };

  const handleLogoClick = () => {
    onNavigate(AppState.LANDING);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-card/80 backdrop-blur-xl border-b border-border/50 shadow-sm' 
          : 'bg-transparent'
      }`}
    >
      <div className="container-section">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-2 group"
          >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <img
                  src="/buzzer-logo.svg"
                  alt="BUUZZER icon"
                  className="h-6 w-6 object-contain"
                />
              </div>
            <span className="text-xl font-bold text-foreground">
              BUUZZER<span className="text-primary">.io</span>
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavClick(item.state)}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
              </button>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-4">
            <Button variant="ghost" onClick={onLogin}>
              Log in
            </Button>
            <Button variant="hero" onClick={onLogin}>
              <Sparkles className="w-4 h-4" />
              Try Free
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl border border-border bg-card/50 backdrop-blur-sm"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-foreground" />
            ) : (
              <Menu className="w-5 h-5 text-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-card/95 backdrop-blur-xl border-b border-border"
          >
            <div className="container-section py-6 space-y-4">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item.state)}
                  className="block w-full text-left py-3 px-4 rounded-xl text-foreground hover:bg-secondary transition-colors"
                >
                  {item.label}
                </button>
              ))}
              <div className="pt-4 space-y-3 border-t border-border">
                <Button variant="outline" className="w-full" onClick={onLogin}>
                  Log in
                </Button>
                <Button variant="hero" className="w-full" onClick={onLogin}>
                  <Sparkles className="w-4 h-4" />
                  Try Free
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
