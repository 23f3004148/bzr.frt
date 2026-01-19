'use client';

import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import { fetchTestimonials, resolveMediaUrl } from '@/services/backendApi';
import { Testimonial } from '@/types';

const fallbackTestimonials: Testimonial[] = [
  {
    id: 'fallback-1',
    name: 'Sarah Chen',
    role: 'Software Engineer',
    company: 'Tech Startup',
    quote:
      'Interview Copilot helped me stay calm during technical interviews. The real-time transcription was incredibly accurate, and the AI suggestions were spot-on for system design questions.',
    rating: 5,
    photoUrl: 'https://img.rocket.new/generatedImages/rocket_gen_img_1c61a4c74-1763295402256.png',
  },
  {
    id: 'fallback-2',
    name: 'Michael Rodriguez',
    role: 'Product Manager',
    company: 'Fortune 500',
    quote:
      'The Stealth Console mode was a game-changer. When I had to share my screen, I seamlessly switched to my iPad and continued getting assistance. Landed my dream PM role!',
    rating: 5,
    photoUrl: 'https://img.rocket.new/generatedImages/rocket_gen_img_1c840d208-1763299111361.png',
  },
  {
    id: 'fallback-3',
    name: 'Emily Thompson',
    role: 'Data Scientist',
    company: 'AI Research Lab',
    quote:
      'As someone who gets nervous in interviews, having real-time support made all the difference. The context-aware answers based on my resume were incredibly helpful.',
    rating: 5,
    photoUrl: 'https://images.unsplash.com/photo-1714976326351-0ecf0244f0fc',
  },
];

const TestimonialsSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(fallbackTestimonials);

  useEffect(() => {
    let isMounted = true;
    const loadTestimonials = async () => {
      try {
        const data = await fetchTestimonials();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setTestimonials(data);
          setActiveIndex(0);
        }
      } catch (err) {
        console.warn('[Landing] Failed to load testimonials', err);
      }
    };
    loadTestimonials();
    return () => {
      isMounted = false;
    };
  }, []);

  const safeTestimonials = useMemo(
    () => (Array.isArray(testimonials) && testimonials.length > 0 ? testimonials : fallbackTestimonials),
    [testimonials],
  );

  useEffect(() => {
    if (safeTestimonials.length > 0 && activeIndex >= safeTestimonials.length) {
      setActiveIndex(0);
    }
  }, [safeTestimonials.length, activeIndex]);

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % safeTestimonials.length);
  };

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + safeTestimonials.length) % safeTestimonials.length);
  };

  const activeTestimonial = safeTestimonials[activeIndex] || fallbackTestimonials[0];
  const rating = Math.max(1, Math.min(5, activeTestimonial.rating || 5));
  const photo = resolveMediaUrl(activeTestimonial.photoUrl || '');

  return (
    <section className="py-20 bg-gradient-to-br from-accent/5 to-secondary/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-success/10 px-4 py-2 rounded-full mb-6">
            <Icon name="StarIcon" size={20} className="text-success" variant="solid" />
            <span className="text-sm font-medium text-success">Success Stories</span>
          </div>
          <h2 className="font-headline text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Trusted by Professionals
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Real stories from candidates who used Interview Copilot to ace their interviews
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
            <div className="grid md:grid-cols-3">
              <div className="md:col-span-1 p-8 bg-gradient-to-br from-primary/5 to-secondary/5 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-accent">
                  {photo ? (
                    <AppImage
                      src={photo}
                      alt={activeTestimonial.name || 'Customer avatar'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-lg font-semibold text-foreground/70">
                      {(activeTestimonial.name || 'U')[0]}
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-foreground text-lg mb-1">{activeTestimonial.name}</h3>
                <p className="text-sm text-muted-foreground mb-1">{activeTestimonial.role}</p>
                <p className="text-xs text-muted-foreground mb-4">{activeTestimonial.company}</p>
                <div className="flex gap-1">
                  {[...Array(rating)].map((_, i) =>
                  <Icon key={i} name="StarIcon" size={16} className="text-warning" variant="solid" />
                  )}
                </div>
              </div>

              <div className="md:col-span-2 p-8 flex flex-col justify-between">
                <div>
                  <Icon name="ChatBubbleLeftRightIcon" size={32} className="text-accent mb-4" />
                  <p className="text-lg text-foreground leading-relaxed mb-6">
                    "{(activeTestimonial as any).content || activeTestimonial.quote}"
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {safeTestimonials.map((_, index) =>
                    <button
                      key={index}
                      onClick={() => setActiveIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-250 ${
                      index === activeIndex ? 'bg-accent w-8' : 'bg-muted'}`
                      }
                      aria-label={`Go to testimonial ${index + 1}`} />

                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={prevTestimonial}
                      className="w-10 h-10 rounded-full bg-muted hover:bg-accent hover:text-accent-foreground transition-colors duration-250 flex items-center justify-center"
                      aria-label="Previous testimonial">

                      <Icon name="ChevronLeftIcon" size={20} />
                    </button>
                    <button
                      onClick={nextTestimonial}
                      className="w-10 h-10 rounded-full bg-muted hover:bg-accent hover:text-accent-foreground transition-colors duration-250 flex items-center justify-center"
                      aria-label="Next testimonial">

                      <Icon name="ChevronRightIcon" size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>);

};

export default TestimonialsSection;
