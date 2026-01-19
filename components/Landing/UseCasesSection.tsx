import React from 'react';
import { motion } from 'framer-motion';
import { 
  GraduationCap, 
  RefreshCw, 
  Briefcase, 
  Code2, 
  Globe2
} from 'lucide-react';

export const UseCasesSection: React.FC = () => {
  const careerStages = [
    { 
      icon: GraduationCap, 
      title: 'First Job Seekers', 
      description: 'Build confidence when every interview counts and experience is limited.',
      gradient: 'from-primary to-accent',
    },
    { 
      icon: RefreshCw, 
      title: 'Career Switchers', 
      description: 'Navigate unfamiliar industry questions with intelligent support.',
      gradient: 'from-accent to-primary',
    },
    { 
      icon: Briefcase, 
      title: 'Senior Professionals', 
      description: 'Articulate complex leadership experiences with clear structure.',
      gradient: 'from-teal to-primary',
    },
    { 
      icon: Code2, 
      title: 'Technical Rounds', 
      description: 'Recall frameworks, algorithms, and system design patterns under pressure.',
      gradient: 'from-primary to-teal',
    },
    { 
      icon: Globe2, 
      title: 'Global Roles', 
      description: 'Overcome cultural differences and language barriers with real-time translation.',
      gradient: 'from-accent to-teal',
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
    <section className="py-28 overflow-hidden" style={{ background: 'var(--gradient-dark)' }}>
      <div className="container-section">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-primary-foreground/60 mb-4 inline-block">
            WHO IT'S FOR
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
            Built for Every Career Stage
          </h2>
        </motion.div>

        {/* Career Stage Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5"
        >
          {careerStages.map((stage) => (
            <motion.div
              key={stage.title}
              variants={itemVariants}
              whileHover={{ y: -10, scale: 1.03 }}
              className="group"
            >
              <div className="h-full rounded-2xl p-6 bg-primary-foreground/5 border border-primary-foreground/10 backdrop-blur-sm hover:bg-primary-foreground/10 hover:border-primary-foreground/20 transition-all duration-300">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stage.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                  <stage.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-bold text-primary-foreground mb-3">{stage.title}</h3>
                <p className="text-sm text-primary-foreground/70 leading-relaxed">{stage.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default UseCasesSection;
