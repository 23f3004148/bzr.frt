import React from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquareOff, 
  BrainCog, 
  Clock, 
  Code2, 
  Eye
} from 'lucide-react';

export const InterviewGapSection: React.FC = () => {
  const gaps = [
    {
      icon: MessageSquareOff,
      title: 'Rambling Answers',
      description: 'Starting strong but losing structure halfway through',
      color: 'from-red-500 to-orange-500',
    },
    {
      icon: BrainCog,
      title: 'Forgetting Key Points',
      description: 'Blanking on critical details when nervous',
      color: 'from-orange-500 to-amber-500',
    },
    {
      icon: Clock,
      title: 'Poor Time Management',
      description: 'Spending too long on wrong aspects of the answer',
      color: 'from-amber-500 to-yellow-500',
    },
    {
      icon: Code2,
      title: 'Weak Technical Depth',
      description: 'Unable to recall frameworks and methodologies on spot',
      color: 'from-primary to-accent',
    },
    {
      icon: Eye,
      title: 'Lost Interviewer Interest',
      description: "Missing cues when answer doesn't land well",
      color: 'from-accent to-primary',
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
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.5 } 
    },
  };

  return (
    <section className="py-24 bg-card relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-destructive/5 rounded-full blur-3xl" />
      </div>

      <div className="container-section relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto mb-16"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-destructive mb-4 inline-block">
            THE INTERVIEW GAP
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            You Know the Answer.{' '}
            <span className="text-destructive">But Can You Deliver It Perfectly?</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Under pressure, even experienced professionals struggle to articulate their expertise clearly and confidently.
          </p>
        </motion.div>

        {/* Gap Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5"
        >
          {gaps.map((gap) => (
            <motion.div
              key={gap.title}
              variants={itemVariants}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group"
            >
              <div className="h-full rounded-2xl bg-secondary/50 border border-border/50 p-6 transition-all duration-300 hover:shadow-xl hover:border-destructive/30 hover:bg-card">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gap.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                  <gap.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">{gap.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{gap.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default InterviewGapSection;
