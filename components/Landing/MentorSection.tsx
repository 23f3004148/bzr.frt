import React from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Bot, User, Coins, ArrowRight } from 'lucide-react';

interface MentorSectionProps {
  onNavigate: () => void;
}

export const MentorSection: React.FC<MentorSectionProps> = ({ onNavigate }) => {
  const sessionTypes = [
    {
      type: 'AI Interview Session',
      icon: Bot,
      description: 'Practice with our AI copilot. Get real-time hints, STAR framework prompts, and instant feedback.',
      credits: '1 AI Credit per session',
      features: ['Unlimited practice rounds', 'Context-aware prompts', 'Post-session transcript'],
      color: 'from-primary to-accent',
    },
    {
      type: 'Mentor Session',
      icon: User,
      description: 'Book live sessions with industry experts. Get personalized feedback and career guidance.',
      credits: '5 Mentor Credits per session',
      features: ['1-on-1 video call', 'Industry-specific advice', 'Resume & portfolio review'],
      color: 'from-teal to-primary',
    },
  ];

  return (
    <section className="py-24 bg-card relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
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
          <span className="section-label mb-4 inline-block">AI + HUMAN COACHING</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            More Than an <span className="gradient-text">AI Copilot</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Combine AI practice sessions with live mentor coaching for the ultimate interview preparation experience.
          </p>
        </motion.div>

        {/* Session Type Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {sessionTypes.map((session, index) => (
            <motion.div
              key={session.type}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="pricing-card group"
            >
              {/* Icon */}
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${session.color} flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                <session.icon className="w-8 h-8 text-primary-foreground" />
              </div>

              {/* Content */}
              <h3 className="text-2xl font-bold text-foreground mb-3">{session.type}</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">{session.description}</p>

              {/* Credits */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary mb-6">
                <Coins className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{session.credits}</span>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {session.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-foreground">
                    <div className="w-5 h-5 rounded-full bg-teal/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-teal" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button 
                variant={index === 0 ? 'hero' : 'outline'} 
                className="w-full group/btn"
                onClick={onNavigate}
              >
                {index === 0 ? 'Start AI Practice' : 'Browse Mentors'}
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Credits Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-4 px-6 py-4 rounded-2xl bg-secondary/50 border border-border">
            <Coins className="w-6 h-6 text-primary" />
            <div className="text-left">
              <p className="font-semibold text-foreground">Flexible Credit System</p>
              <p className="text-sm text-muted-foreground">Buy AI credits and mentor credits separately. Unused credits never expire.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MentorSection;
