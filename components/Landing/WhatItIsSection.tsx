import React from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  ListChecks, 
  HeartHandshake, 
  BrainCircuit, 
  GraduationCap,
  BotOff,
  UserX,
  VideoOff,
  ShieldX,
  FileX2,
  Check,
  X
} from 'lucide-react';

export const WhatItIsSection: React.FC = () => {
  const whatItIs = [
    { icon: Sparkles, text: 'Live guidance assistant' },
    { icon: ListChecks, text: 'Structured response hints' },
    { icon: HeartHandshake, text: 'Confidence booster' },
    { icon: BrainCircuit, text: 'Real-time context analysis' },
    { icon: GraduationCap, text: 'Your mentor in your ear' },
  ];

  const whatItIsNot = [
    { icon: BotOff, text: 'Not auto-answering for you' },
    { icon: UserX, text: 'Not impersonating you' },
    { icon: VideoOff, text: 'Not recording your interviews' },
    { icon: ShieldX, text: 'Not a cheating tool' },
    { icon: FileX2, text: 'Not robotic scripts' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.4 } 
    },
  };

  return (
    <section className="py-24 relative overflow-hidden" style={{ background: 'var(--gradient-hero)' }}>
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal/8 rounded-full blur-3xl" />
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
          <span className="section-label mb-4 inline-block">MEET YOUR INTERVIEW COPILOT</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Real-Time Guidance.{' '}
            <span className="gradient-text">Your Own Words.</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Interview Copilot listens, understands context, and provides instant structured prompts—so you can speak naturally while staying on track.
          </p>
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* What It IS */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="rounded-3xl bg-card border border-teal/30 p-8 h-full shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal to-primary flex items-center justify-center shadow-lg">
                  <Check className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">What It IS</h3>
              </div>
              
              <motion.ul
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="space-y-4"
              >
                {whatItIs.map((item) => (
                  <motion.li
                    key={item.text}
                    variants={itemVariants}
                    className="flex items-center gap-4 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center group-hover:bg-teal/20 transition-colors">
                      <item.icon className="w-5 h-5 text-teal" />
                    </div>
                    <span className="text-foreground font-medium">{item.text}</span>
                  </motion.li>
                ))}
              </motion.ul>
            </div>
          </motion.div>

          {/* What It's NOT */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="rounded-3xl bg-card border border-muted-foreground/20 p-8 h-full shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <X className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">What It's NOT</h3>
              </div>
              
              <motion.ul
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="space-y-4"
              >
                {whatItIsNot.map((item) => (
                  <motion.li
                    key={item.text}
                    variants={itemVariants}
                    className="flex items-center gap-4 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center group-hover:bg-muted transition-colors">
                      <item.icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <span className="text-muted-foreground font-medium">{item.text}</span>
                  </motion.li>
                ))}
              </motion.ul>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default WhatItIsSection;
