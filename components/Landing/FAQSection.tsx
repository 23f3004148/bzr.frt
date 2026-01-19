import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { fetchFaqs } from '@/services/backendApi';
import { Faq } from '@/types';

export const FAQSection: React.FC = () => {
  const fallback: Faq[] = [
    {
      question: 'Is Interview Copilot considered cheating?',
      answer: "Copilot is a guidance tool, similar to having interview notes or coaching support. You speak in your own words—AI only provides structure and reminders. Many interview prep tools exist; this one works in real-time.",
    },
    {
      question: 'Will interviewers detect I\'m using assistance?',
      answer: "Copilot is designed to be subtle and non-intrusive. Since you're speaking naturally in your own voice with structured guidance, it is indistinguishable from a well-prepared candidate.",
    },
    {
      question: 'What types of interviews does it support?',
      answer: 'All major types: technical (coding, system design), behavioral (STAR method), managerial (leadership scenarios), and HR screening. Works across industries and experience levels.',
    },
    {
      question: 'How does privacy work? Are interviews recorded?',
      answer: 'Absolutely not. Interview Copilot does not record or store interview audio. It processes questions in real-time for guidance only. Your privacy is paramount.',
    },
    {
      question: 'Do I need special equipment?',
      answer: 'Just your regular interview setup—laptop, headphones, and stable internet. Copilot runs quietly in the background on your device.',
    },
    {
      question: 'Can I use it for practice sessions?',
      answer: 'Absolutely! Many users start with mock interviews to get comfortable with the tool before using it in real interviews.',
    },
  ];
  const [faqs, setFaqs] = useState<Faq[]>(fallback);

  useEffect(() => {
    fetchFaqs()
      .then((items) => {
        if (Array.isArray(items) && items.length) setFaqs(items as any);
      })
      .catch(() => setFaqs(fallback));
  }, []);

  return (
    <section className="py-24 bg-secondary/30 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container-section relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Frequently Asked{' '}
            <span className="gradient-text">Questions</span>
          </h2>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="rounded-2xl bg-card border border-border/50 px-6 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <AccordionTrigger className="text-left text-foreground font-semibold hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
