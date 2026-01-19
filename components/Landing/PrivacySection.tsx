import React from 'react';
import { motion } from 'framer-motion';

/**
 * PrivacySection conveys a responsible use message and reassures users
 * about data privacy. It encourages ethical behaviour without using
 * negative language like “cheat” or “undetectable”.
 */
const PrivacySection: React.FC = () => {
  return (
    <section id="privacy" className="py-20 px-6 sm:px-8 lg:px-12 text-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto"
      >
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Privacy & responsible use</h2>
        <p className="text-gray-400 mb-4 text-base sm:text-lg leading-relaxed">
          Our copilot is designed to augment your skills and empower you during interviews and meetings. We respect your
          privacy — your notes and prompts are visible only to you.
        </p>
        <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
          Use Buuzzer responsibly and ensure your use complies with the policies of your interviewer or organisation. Our aim
          is to help you become a better communicator, not to replace your preparation or honesty.
        </p>
      </motion.div>
    </section>
  );
};

export default PrivacySection;