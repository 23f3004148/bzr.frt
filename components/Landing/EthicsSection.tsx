import React from 'react';
import { motion } from 'framer-motion';
import { 
  Mic2, 
  Users, 
  UserCheck, 
  Eye
} from 'lucide-react';

export const EthicsSection: React.FC = () => {
  const principles = [
    {
      icon: Mic2,
      title: 'You Speak, Not the AI',
      description: 'Your voice, your answers, your authentic self. AI only provides guidance on structure.',
      color: 'from-teal to-primary',
    },
    {
      icon: Users,
      title: 'Similar to Coaching Support',
      description: "Like having notes or a mentor's advice—completely acceptable preparation.",
      color: 'from-primary to-accent',
    },
    {
      icon: UserCheck,
      title: 'No Impersonation',
      description: 'Your voice, your style, your authentic self. AI only guides structure.',
      color: 'from-accent to-teal',
    },
    {
      icon: Eye,
      title: 'Interviewer-Aware Use',
      description: 'Many candidates use prep tools. Copilot simply makes yours real-time.',
      color: 'from-teal to-accent',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 } 
    },
  };

  return (
    <section className="py-24 bg-card relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-teal/5 rounded-full blur-3xl" />
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
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Ethical. Transparent.{' '}
            <span className="gradient-text">Legal.</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Interview Copilot is a guidance tool—not deception. Here's why it's different:
          </p>
        </motion.div>

        {/* Principles Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
        >
          {principles.map((principle) => (
            <motion.div
              key={principle.title}
              variants={itemVariants}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group"
            >
              <div className="h-full rounded-2xl bg-secondary/50 border border-border/50 p-6 text-center hover:bg-card hover:shadow-xl hover:border-teal/30 transition-all duration-300">
                <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${principle.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                  <principle.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-3">{principle.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{principle.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default EthicsSection;
