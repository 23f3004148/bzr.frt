import React from 'react';
import { motion } from 'framer-motion';
import { 
  BrainCircuit, 
  ListOrdered, 
  UserCog, 
  ShieldCheck, 
  Lightbulb, 
  Layers
} from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  const features = [
    { 
      icon: BrainCircuit, 
      title: 'Context-Aware Intelligence', 
      description: 'Understands technical vs. behavioral vs. HR questions automatically',
      gradient: 'from-primary to-accent'
    },
    { 
      icon: ListOrdered, 
      title: 'STAR Framework Prompts', 
      description: 'Structured guidance for situation, task, action, and result responses',
      gradient: 'from-accent to-primary'
    },
    { 
      icon: UserCog, 
      title: 'Role-Specific Knowledge', 
      description: 'Tailored guidance for developers, managers, analysts, and more',
      gradient: 'from-teal to-primary'
    },
    { 
      icon: ShieldCheck, 
      title: 'Privacy-First Design', 
      description: 'Zero interview recordings stored. Your data stays yours',
      gradient: 'from-primary to-teal'
    },
    { 
      icon: Lightbulb, 
      title: 'Confidence Cues', 
      description: 'Real-time signals on what to say next and what to avoid',
      gradient: 'from-accent to-teal'
    },
    { 
      icon: Layers, 
      title: 'Works Across Interview Types', 
      description: 'Technical, behavioral, managerial, HR—all covered',
      gradient: 'from-teal to-accent'
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.5 } 
    },
  };

  return (
    <section id="features" className="py-28 bg-secondary/30 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
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
            POWERFUL FEATURES
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Everything You Need to{' '}
            <span className="gradient-text">Ace Any Interview</span>
          </h2>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group"
            >
              <div className="h-full rounded-2xl bg-card p-8 border border-border/30 shadow-lg hover:shadow-xl hover:border-primary/30 transition-all duration-300">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                  <feature.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
