import React from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight, Check, CreditCard, RotateCcw } from 'lucide-react';

interface CTASectionProps {
  onLogin: () => void;
}

export const CTASection: React.FC<CTASectionProps> = ({ onLogin }) => {
  const trustPoints = [
    { icon: Check, text: 'No credit card required' },
    { icon: RotateCcw, text: '7-day free trial' },
    { icon: CreditCard, text: 'Cancel anytime' },
  ];

  return (
    <section className="py-28 relative overflow-hidden" style={{ background: 'var(--gradient-dark)' }}>
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl" 
        />
        <motion.div 
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.1, 0.3] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/20 rounded-full blur-3xl" 
        />
      </div>

      <div className="container-section relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-primary-foreground mb-6 leading-tight">
            Ready to Nail Your{' '}
            <span className="bg-gradient-to-r from-teal via-primary to-accent bg-clip-text text-transparent">
              Next Interview?
            </span>
          </h2>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-primary-foreground/70 mb-10 max-w-2xl mx-auto">
            Join thousands of candidates who transformed their interview performance.
          </p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mb-10"
          >
            <Button 
              variant="hero" 
              size="xl" 
              onClick={onLogin} 
              className="group text-lg px-10 py-7 shadow-hero"
            >
              Get Started Free
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>

          {/* Trust Points */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-primary-foreground/60"
          >
            {trustPoints.map((point) => (
              <div key={point.text} className="flex items-center gap-2">
                <point.icon className="w-4 h-4 text-teal" />
                <span>{point.text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
