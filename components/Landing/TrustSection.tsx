import React from 'react';
import { motion } from 'framer-motion';

/**
 * TrustSection displays social proof with a row of placeholder logos
 * and a set of qualitative metrics that highlight the product's strengths.
 */
const TrustSection: React.FC = () => {
  const logos = ['Acme Co', 'Globex', 'Initech', 'Umbrella', 'Wayne', 'Hooli'];
  return (
    <section id="trust" className="py-20 px-6 sm:px-8 lg:px-12 text-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto"
      >
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Trusted by candidates & teams</h2>
        <p className="text-gray-400 mb-10 max-w-3xl mx-auto">
          Join the growing community of professionals who rely on our AI copilot to excel in interviews and meetings.
        </p>
        {/* Logo placeholders */}
        <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 mb-16">
          {logos.map((name) => (
            <span
              key={name}
              className="text-gray-400 px-4 py-2 border border-gray-700 rounded-full text-xs sm:text-sm uppercase tracking-wider"
            >
              {name}
            </span>
          ))}
        </div>
        {/* Metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="glass-panel p-6 rounded-xl border border-gray-700/50 hover:border-blue-500/30 transition-colors">
            <h3 className="text-white text-xl font-bold mb-2">Real‑time responses</h3>
            <p className="text-gray-400 text-sm">
              Sub‑second typical latency keeps you in sync with the conversation.
            </p>
          </div>
          <div className="glass-panel p-6 rounded-xl border border-gray-700/50 hover:border-blue-500/30 transition-colors">
            <h3 className="text-white text-xl font-bold mb-2">Multilingual support</h3>
            <p className="text-gray-400 text-sm">
              Works seamlessly across major languages to broaden your opportunities.
            </p>
          </div>
          <div className="glass-panel p-6 rounded-xl border border-gray-700/50 hover:border-blue-500/30 transition-colors">
            <h3 className="text-white text-xl font-bold mb-2">Private second‑screen</h3>
            <p className="text-gray-400 text-sm">
              Your coaching hints appear only to you on a discreet second screen.
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default TrustSection;