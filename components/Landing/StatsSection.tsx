import React from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Layers, Quote } from 'lucide-react';

export const StatsSection: React.FC = () => {
  const stats = [
    { 
      value: '1,000+', 
      label: 'Candidates Supported',
      sublabel: 'Across technical and non-technical roles',
      icon: Users 
    },
    { 
      value: '2x', 
      label: 'Performance Improvement',
      sublabel: 'Reported increased interview confidence',
      icon: TrendingUp 
    },
    { 
      value: '15+', 
      label: 'Interview Types',
      sublabel: 'From HR screening to technical deep-dives',
      icon: Layers 
    },
  ];

  const testimonial = {
    quote: "I knew my stuff but always fumbled explanations. Copilot helped me structure answers on the fly—I finally got the offer I deserved.",
    author: "Anonymous User",
    role: "Software Engineer",
  };

  return (
    <section className="py-24 relative overflow-hidden" style={{ background: 'var(--gradient-hero)' }}>
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-accent/8 rounded-full blur-3xl" />
      </div>

      <div className="container-section relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="section-label mb-4 inline-block">TRUSTED BY JOB SEEKERS</span>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-3 gap-8 mb-16"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="text-center p-8 rounded-2xl bg-card border border-border/50 shadow-lg hover:shadow-xl transition-all"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
                <stat.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <p className="text-5xl font-extrabold gradient-text mb-2">{stat.value}</p>
              <p className="text-lg font-semibold text-foreground mb-1">{stat.label}</p>
              <p className="text-sm text-muted-foreground">{stat.sublabel}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonial */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="max-w-3xl mx-auto"
        >
          <div className="rounded-3xl bg-card border border-border/50 p-10 shadow-xl text-center relative">
            <Quote className="w-12 h-12 text-primary/20 mx-auto mb-6" />
            <p className="text-xl text-foreground leading-relaxed mb-6 italic">
              "{testimonial.quote}"
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold">
                AU
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">{testimonial.author}</p>
                <p className="text-sm text-muted-foreground">{testimonial.role}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default StatsSection;
