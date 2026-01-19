'use client';

import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { fetchFaqs } from '@/services/backendApi';
import { Faq } from '@/types';

const fallbackFaqs: Faq[] = [
  {
    id: '1',
    question: 'Is my data recorded or stored?',
    answer:
      'No. Interview Copilot uses audio-only transcription in real-time and does not record or store any video, audio, or transcription data. All processing happens live, and nothing is saved to our servers. Your privacy is our top priority.',
  },
  {
    id: '2',
    question: 'Does this record video or screen?',
    answer:
      'Absolutely not. Interview Copilot only listens to audio for transcription purposes. We do not capture, record, or store any video or screen content. The Chrome Extension overlay is visible only to you and does not interfere with screen sharing.',
  },
  {
    id: '3',
    question: 'Can I turn it off anytime?',
    answer:
      'Yes. You have complete control. You can manually activate transcription by pressing space or enter, toggle the overlay on/off at any time, or completely close the extension. The system only works when you explicitly activate it.',
  },
  {
    id: '4',
    question: 'Does it work with Zoom / Teams / Meet?',
    answer:
      'Yes. Interview Copilot works independently of your meeting platform. It captures system audio, so it is compatible with Zoom, Microsoft Teams, Google Meet, and any other video conferencing tool. No special integration required.',
  },
  {
    id: '5',
    question: 'What happens during screen sharing?',
    answer:
      'When you need to share your screen, simply close the Chrome Extension overlay and switch to Stealth Console mode on a second device. You will continue receiving live transcription and AI answers while your main screen is shared.',
  },
];

const FAQSection = () => {
  const [faqs, setFaqs] = useState<Faq[]>(fallbackFaqs);
  const [openId, setOpenId] = useState<string | null>(fallbackFaqs[0].id || null);

  useEffect(() => {
    let isMounted = true;
    const loadFaqs = async () => {
      try {
        const data = await fetchFaqs();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setFaqs(data);
          const firstId = data[0]._id || data[0].id || `${Date.now()}`;
          setOpenId(firstId);
        }
      } catch (err) {
        console.warn('[Landing] Failed to load FAQs', err);
      }
    };
    loadFaqs();
    return () => {
      isMounted = false;
    };
  }, []);

  const safeFaqs = useMemo(() => (faqs && faqs.length > 0 ? faqs : fallbackFaqs), [faqs]);

  const toggleFAQ = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="faq" className="py-20 bg-background">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
            <Icon name="QuestionMarkCircleIcon" size={20} className="text-primary" />
            <span className="text-sm font-medium text-primary">FAQ</span>
          </div>
          <h2 className="font-headline text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Addressing the Hard Questions
          </h2>
          <p className="text-xl text-muted-foreground">
            Clear, calm, factual answers to your privacy and functionality concerns
          </p>
        </div>

        <div className="space-y-4">
          {safeFaqs.map((faq) => {
            const id = String(faq._id || faq.id || faq.question);
            return (
            <div
              key={id}
              className="bg-card rounded-lg border border-border shadow-card overflow-hidden transition-all duration-250"
            >
              <button
                onClick={() => toggleFAQ(id)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-muted transition-colors duration-250"
              >
                <span className="font-semibold text-foreground pr-4">{faq.question}</span>
                <Icon
                  name="ChevronDownIcon"
                  size={24}
                  className={`text-accent flex-shrink-0 transition-transform duration-250 ${
                    openId === id ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openId === id && (
                <div className="px-6 pb-5 pt-2">
                  <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
