import React from 'react';
import { motion } from 'framer-motion';
import {
  FiMic,
  FiTarget,
  FiBell,
  FiGlobe,
  FiTablet,
  FiBookOpen,
} from 'react-icons/fi';

/**
 * FeaturesGrid showcases six core capabilities of the product. Each
 * feature card includes an icon, title and short description. The grid
 * adapts responsively to various screen sizes.
 */
const FeaturesGrid: React.FC = () => {
  const features = [
    {
      title: 'Real‑time transcription',
      description: 'Advanced speech recognition listens so you can focus on your delivery.',
      Icon: FiMic,
    },
    {
      title: 'Context awareness',
      description: 'Generates answers tailored to your resume and the job description.',
      Icon: FiTarget,
    },
    {
      title: 'Coaching prompts',
      description: 'Press space to receive high‑impact hints in the moment.',
      Icon: FiBell,
    },
    {
      title: 'Multilingual',
      description: 'Supports a range of languages to broaden your opportunities.',
      Icon: FiGlobe,
    },
    {
      title: 'Second‑screen console',
      description: 'A private panel that only you can see for real‑time suggestions.',
      Icon: FiTablet,
    },
    {
      title: 'Post‑session review',
      description: 'Reflect on your performance with notes and key takeaways.',
      Icon: FiBookOpen,
    },
  ];
  return (
    <section id="features" className="py-20 px-6 sm:px-8 lg:px-12">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto"
      >
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">Features</h2>
        <p className="text-gray-400 text-center mb-10 max-w-3xl mx-auto">
          A powerful toolkit designed to help you excel in any conversation.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map(({ title, description, Icon }) => (
            <div
              key={title}
              className="glass-panel p-6 rounded-xl border border-gray-700/50 hover:border-blue-500/30 transition-colors group"
            >
              <div className="w-12 h-12 mb-4 rounded-lg flex items-center justify-center bg-blue-500/20 group-hover:scale-105 transition-transform">
                <Icon className="w-6 h-6 text-blue-400" aria-hidden="true" />
              </div>
              <h3 className="text-white font-bold mb-2 text-lg">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default FeaturesGrid;