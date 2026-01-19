import React from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Check, Sparkles, Lock, CreditCard } from 'lucide-react';

interface PricingSectionProps {
  onLogin: () => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onLogin }) => {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for trying out BUUZZER and basic interview prep.',
      features: [
        '5 AI sessions per month',
        'Basic transcription',
        'STAR framework prompts',
        'Email support',
      ],
      featured: false,
      ctaText: 'Get Started Free',
    },
    {
      name: 'Pro',
      price: '$24.99',
      period: '/month',
      description: 'Everything you need to ace your interviews with confidence.',
      features: [
        'Unlimited AI sessions',
        'Advanced transcription',
        'All prompt frameworks',
        'Stealth console access',
        'Post-session transcripts',
        'Priority support',
      ],
      featured: true,
      ctaText: 'Start Pro Trial',
      badge: 'Most Popular',
    },
    {
      name: 'Pro + Mentor',
      price: '$49.99',
      period: '/month',
      description: 'AI practice plus live expert coaching for maximum preparation.',
      features: [
        'Everything in Pro',
        '2 mentor sessions/month',
        'Resume review',
        'Mock interviews with experts',
        'Career coaching calls',
        '24/7 priority support',
      ],
      featured: false,
      ctaText: 'Get Pro + Mentor',
    },
  ];

  return (
    <section className="py-24 bg-secondary/30 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container-section relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="section-label mb-4 inline-block">PRICING</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Simple and <span className="gradient-text">Transparent Pricing</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Choose the plan that fits your interview journey. Upgrade or downgrade anytime.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className={plan.featured ? 'pricing-card-featured' : 'pricing-card'}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-bold shadow-lg">
                    <Sparkles className="w-3.5 h-3.5" />
                    {plan.badge}
                  </div>
                </div>
              )}

              {/* Plan Name & Price */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-3">{plan.description}</p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-foreground">
                    <Check className="w-5 h-5 text-teal flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                variant={plan.featured ? 'hero' : 'outline'}
                className="w-full"
                onClick={onLogin}
              >
                {plan.ctaText}
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
        >
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-teal" />
            <span>Secure payments via Razorpay</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-teal" />
            <span>Cancel anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-teal" />
            <span>14-day money-back guarantee</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
