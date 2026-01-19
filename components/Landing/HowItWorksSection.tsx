import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, Headphones, MessageCircle, ArrowRight, Play } from 'lucide-react';
import laptopImage from '@/assets/laptop-interface.jpg';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      number: '01',
      icon: Rocket,
      title: 'Start Before Interview',
      description: 'Launch Copilot on your device. It runs quietly in the background, ready to assist.',
      color: 'from-primary to-primary/80',
    },
    {
      number: '02',
      icon: Headphones,
      title: 'Copilot Listens & Analyzes',
      description: 'AI understands the question context, identifies key themes, and prepares structured guidance instantly.',
      color: 'from-accent to-accent/80',
    },
    {
      number: '03',
      icon: MessageCircle,
      title: 'You Speak Naturally',
      description: 'Get real-time prompts on structure, key points, and what to emphasize—while you deliver in your own voice.',
      color: 'from-teal to-teal/80',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <section id="how-it-works" className="py-28 bg-card relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
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
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 inline-block">
            SIMPLE, POWERFUL, INSTANT.
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            How Interview Copilot{' '}
            <span className="gradient-text">Works</span>
          </h2>
        </motion.div>

        {/* Laptop Image with Animated Overlay */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative max-w-4xl mx-auto mb-20"
        >
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-border/30">
            <img 
              src={laptopImage} 
              alt="BUUZZER AI Interview Coaching Platform Interface" 
              className="w-full h-auto"
            />
            {/* Animated Pulse Effect */}
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <div className="w-20 h-20 rounded-full bg-primary/30 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-primary/50 transition-colors">
                <Play className="w-8 h-8 text-primary-foreground fill-primary-foreground ml-1" />
              </div>
            </motion.div>
          </div>

          {/* Floating Feature Tags */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="absolute -left-4 md:-left-10 top-1/4"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="bg-card shadow-lg rounded-xl px-4 py-2 border border-border/50"
            >
              <p className="text-sm font-semibold text-foreground">Real-time Transcription</p>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7 }}
            className="absolute -right-4 md:-right-10 top-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="bg-card shadow-lg rounded-xl px-4 py-2 border border-primary/30"
            >
              <p className="text-sm font-semibold text-primary">AI Coaching Active</p>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.9 }}
            className="absolute -bottom-4 left-1/4"
          >
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg rounded-xl px-4 py-2"
            >
              <p className="text-sm font-bold">STAR Framework Ready</p>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Steps */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6 lg:gap-8"
        >
          {steps.map((step, index) => (
            <motion.div key={step.title} variants={itemVariants} className="relative group">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:flex absolute top-20 left-[60%] w-[calc(100%-20%)] items-center z-0">
                  <motion.div 
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.5 + index * 0.2 }}
                    className="flex-1 h-[2px] bg-gradient-to-r from-border via-primary/30 to-border origin-left" 
                  />
                  <ArrowRight className="w-5 h-5 text-primary/40 -ml-1" />
                </div>
              )}

              <div className="h-full relative z-10">
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="h-full rounded-3xl bg-card border border-border/50 p-8 shadow-lg hover:shadow-xl hover:border-primary/30 transition-all"
                >
                  {/* Step Number Badge */}
                  <motion.div 
                    className="absolute -top-4 left-8"
                    whileHover={{ scale: 1.1 }}
                  >
                    <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-bold shadow-lg">
                      Step {step.number}
                    </div>
                  </motion.div>

                  {/* Icon */}
                  <motion.div 
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                    className={`w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300`}
                  >
                    <step.icon className="w-10 h-10 text-primary-foreground" />
                  </motion.div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-foreground mb-4 text-center">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-center">{step.description}</p>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
