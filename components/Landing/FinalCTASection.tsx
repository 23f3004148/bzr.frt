import React from 'react';
import { Button } from '../Button';
import { AppState } from '../../types';
import { motion } from 'framer-motion';

interface FinalCTASectionProps {
  onLogin: () => void;
  onNavigate: (state: AppState) => void;
}

/**
 * FinalCTASection provides a closing invitation to start using the product.
 * It repeats key benefits and offers two calls to action, one primary
 * directing users to log in and the other to learn more via the contact page.
 */
const FinalCTASection: React.FC<FinalCTASectionProps> = ({ onLogin, onNavigate }) => {
  return (
    <section id="cta" className="relative py-24 px-6 sm:px-8 lg:px-12 text-center overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto"
      >
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to become your best self?</h2>
        <p className="text-gray-400 text-base sm:text-lg mb-10 leading-relaxed">
          Start your next interview or call with the confidence and support you deserve. Let our AI copilot
          empower you to communicate clearly and effectively.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={onLogin} className="text-lg px-8 py-4 shadow-xl shadow-blue-500/20">
            Get started now
          </Button>
          <Button
            variant="secondary"
            onClick={() => onNavigate(AppState.CONTACT)}
            className="text-lg px-8 py-4 bg-white/10 text-white border border-gray-400 hover:bg-white hover:text-gray-900"
          >
            Contact us
          </Button>
        </div>
      </motion.div>
    </section>
  );
};

export default FinalCTASection;