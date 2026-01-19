import React from 'react';
import { FaWhatsapp } from 'react-icons/fa';

interface WhatsAppButtonProps {
  whatsappLink: string;
}

/**
 * WhatsAppButton renders a floating action button linking to WhatsApp.
 * It appears fixed in the bottom left of the viewport and maintains
 * existing styling from the previous landing page. Keeping this logic
 * separate allows the landing page to remain decluttered.
 */
const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({ whatsappLink }) => {
  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noreferrer"
      className="fixed left-4 bottom-4 z-40 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/40 hover:scale-105 transition-transform"
      aria-label="WhatsApp support"
    >
      <FaWhatsapp className="w-7 h-7 sm:w-8 sm:h-8 text-white" aria-hidden="true" />
    </a>
  );
};

export default WhatsAppButton;