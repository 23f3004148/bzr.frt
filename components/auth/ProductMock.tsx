import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * ProductMock renders a simple two‑panel mock of the Buuzzer copilot. It
 * includes a browser window and a phone/second‑screen mock built with
 * pure HTML and CSS. A gentle floating animation adds subtle movement.
 */
const ProductMock: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  // Floating animation only if user doesn't prefer reduced motion
  const floatAnim = prefersReducedMotion ? {} : { y: [-8, 8, -8] };
  return (
    <motion.div
      animate={floatAnim}
      transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      className="mx-auto"
    >
      <div className="relative flex flex-col sm:flex-row items-center justify-center gap-8">
        {/* Browser window mock */}
        <div className="flex-1 w-full sm:w-2/3 bg-gray-800/40 border border-gray-700 rounded-xl p-4 sm:p-6 backdrop-blur-md shadow-2xl">
          {/* Window controls */}
          <div className="flex items-center gap-1 mb-3">
            <span className="w-2.5 h-2.5 bg-red-400 rounded-full"></span>
            <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full"></span>
            <span className="w-2.5 h-2.5 bg-green-400 rounded-full"></span>
          </div>
          {/* Transcript/hints mock content */}
          <div className="space-y-1.5">
            <div className="h-2.5 w-3/4 bg-gray-700 rounded"></div>
            <div className="h-2.5 w-full bg-gray-700 rounded"></div>
            <div className="h-2.5 w-5/6 bg-gray-700 rounded"></div>
            <div className="h-2.5 w-full bg-gray-700 rounded"></div>
            <div className="h-2.5 w-2/3 bg-gray-700 rounded"></div>
            <div className="h-2.5 w-4/5 bg-gray-700 rounded"></div>
          </div>
        </div>
        {/* Phone/second‑screen mock */}
        <div className="w-full sm:w-1/3 bg-gray-800/40 border border-gray-700 rounded-xl p-4 sm:p-6 backdrop-blur-md shadow-2xl">
          <div className="w-1/2 h-2.5 bg-gray-700 rounded mb-3"></div>
          <div className="space-y-1.5">
            <div className="h-2.5 w-full bg-gray-700 rounded"></div>
            <div className="h-2.5 w-10/12 bg-gray-700 rounded"></div>
            <div className="h-2.5 w-9/12 bg-gray-700 rounded"></div>
            <div className="h-2.5 w-11/12 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductMock;