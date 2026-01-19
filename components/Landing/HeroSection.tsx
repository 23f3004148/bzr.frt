import React from 'react';
import { Button } from '@/components/ui/button';
import { AppState } from '@/types';
import { motion } from 'framer-motion';
import { Check, ShieldCheck, Mic2, ArrowRight, Zap, Eye, EyeOff, Sparkles } from 'lucide-react';
import heroImage from '@/assets/hero-interview.jpg';

interface HeroSectionProps {
  onLogin: () => void;
  onNavigate: (state: AppState) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onLogin, onNavigate }) => {
  const heroBullets = [
    { icon: Check, text: 'You speak, not the AI', color: 'bg-teal' },
    { icon: ShieldCheck, text: 'Privacy-first design', color: 'bg-primary' },
    { icon: Mic2, text: 'Real-time guidance', color: 'bg-accent' },
  ];

  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden" style={{ background: 'var(--gradient-hero)' }}>
      {/* Premium Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-20 -left-48 w-[500px] h-[500px] bg-primary/15 rounded-full blur-3xl" 
        />
        <motion.div 
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.2, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-20 -right-48 w-[600px] h-[600px] bg-accent/15 rounded-full blur-3xl" 
        />
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-teal/8 rounded-full blur-3xl" 
        />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="container-section relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="space-y-8"
          >
            {/* Eyebrow Text */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm font-semibold text-primary uppercase tracking-wider"
            >
              Nail Every Interview
            </motion.p>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.1] text-foreground">
              Answer.{' '}
              <span className="gradient-text">In Real-Time.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed">
              Your silent interview coach. Providing instant, structured guidance 
              while you speak—<span className="text-foreground font-medium">naturally and confidently.</span>
            </p>

            {/* Trust Bullets */}
            <div className="flex flex-wrap gap-5">
              {heroBullets.map((bullet, index) => (
                <motion.div
                  key={bullet.text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center gap-2.5"
                >
                  <div className={`w-6 h-6 rounded-full ${bullet.color} flex items-center justify-center shadow-sm`}>
                    <bullet.icon className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{bullet.text}</span>
                </motion.div>
              ))}
            </div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 pt-2"
            >
              <Button variant="hero" size="xl" onClick={onLogin} className="group shadow-hero">
                <Sparkles className="w-5 h-5" />
                Try Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="heroOutline" 
                size="xl" 
                onClick={() => onNavigate(AppState.HOW_IT_WORKS)}
              >
                See How It Works
              </Button>
            </motion.div>

            {/* Trust Line */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-xs text-muted-foreground"
            >
              Not a cheating tool. You stay in control. Privacy-first design.
            </motion.p>
          </motion.div>

          {/* Right Content - Hero Image with Floating Badges */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            {/* Main Image Container */}
            <div className="relative">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="relative rounded-3xl overflow-hidden shadow-hero border border-border/30"
              >
                <img 
                  src={heroImage} 
                  alt="Professional using BUUZZER for interview preparation" 
                  className="w-full h-auto object-cover"
                />
                {/* Overlay with BUUZZER branding */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/80 to-transparent p-6">
                  <p className="text-primary-foreground text-lg font-bold">
                    BUUZZER is fantastic for interview preparation
                  </p>
                </div>
              </motion.div>

              {/* Floating Badge - Latency */}
              <motion.div
                initial={{ opacity: 0, y: 20, x: 20 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="absolute -top-4 -right-4 md:-right-8"
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="rounded-2xl bg-card shadow-xl border border-border/50 p-4 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal to-primary flex items-center justify-center shadow-md">
                      <Zap className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Latency</p>
                      <p className="text-xl font-bold text-foreground">&lt;200ms</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Floating Badge - Stealth Mode */}
              <motion.div
                initial={{ opacity: 0, y: -20, x: -20 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                transition={{ delay: 0.8 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="absolute -bottom-4 -left-4 md:-left-8"
              >
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  className="rounded-2xl bg-card shadow-xl border border-border/50 p-4 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-md">
                      <EyeOff className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Mode</p>
                      <p className="text-sm font-bold text-foreground">Stealth Active</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Floating Badge - Privacy */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 }}
                whileHover={{ scale: 1.08 }}
                className="absolute top-1/3 -right-4 md:-right-12"
              >
                <motion.div
                  animate={{ rotate: [-2, 2, -2] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                  className="rounded-2xl bg-gradient-to-br from-primary to-accent p-[1px] shadow-xl"
                >
                  <div className="rounded-2xl bg-card p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal/20 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-teal" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Privacy First</p>
                      <p className="text-[10px] text-muted-foreground">No recordings</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Floating Badge - AI Listening */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 }}
                whileHover={{ scale: 1.05 }}
                className="absolute top-8 -left-4 md:-left-10"
              >
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                  className="rounded-2xl bg-card shadow-xl border border-teal/30 p-3 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-teal/20 flex items-center justify-center">
                      <Eye className="w-4 h-4 text-teal" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground flex items-center gap-1">
                        AI Active
                        <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
