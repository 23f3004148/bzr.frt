import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { fetchTestimonials } from '@/services/backendApi';
import { Testimonial } from '@/types';

export const TestimonialsSection: React.FC = () => {
  const fallback = [
    {
      name: 'Sarah Chen',
      role: 'Software Engineer',
      company: 'Tech Startup',
      content: 'BUUZZER helped me stay calm during my FAANG interviews. The real-time hints reminded me of key points I would have forgotten under pressure.',
      rating: 5,
    },
    {
      name: 'Marcus Johnson',
      role: 'Product Manager',
      company: 'Fortune 500',
      content: 'The STAR framework prompts were a game-changer. I went from rambling answers to structured, impactful responses.',
      rating: 5,
    },
    {
      name: 'Priya Patel',
      role: 'Career Switcher',
      company: 'Finance → Tech',
      content: 'As someone transitioning industries, BUUZZER gave me the confidence to answer unfamiliar technical questions without freezing up.',
      rating: 5,
    },
    {
      name: 'David Kim',
      role: 'Senior Developer',
      company: 'Google',
      content: 'The stealth mode is incredible. No one knew I had AI assistance, and my answers were crisp and well-structured.',
      rating: 5,
    },
    {
      name: 'Emily Rodriguez',
      role: 'UX Designer',
      company: 'Apple',
      content: 'Perfect for design interviews! It helped me articulate my design process clearly while staying authentic.',
      rating: 5,
    },
    {
      name: 'Alex Thompson',
      role: 'Data Scientist',
      company: 'Amazon',
      content: 'The technical prompts for system design questions were spot-on. Landed my dream job thanks to BUUZZER.',
      rating: 5,
    },
  ];
  const [testimonials, setTestimonials] = useState<Testimonial[]>(fallback);

  useEffect(() => {
    fetchTestimonials()
      .then((items) => {
        if (Array.isArray(items) && items.length) {
          setTestimonials(items as any);
        }
      })
      .catch(() => setTestimonials(fallback));
  }, []);

  const stats = [
    { value: '10,000+', label: 'Sessions Completed' },
    { value: '0', label: 'Recordings Stored' },
    { value: '24/7', label: 'Support Available' },
    { value: '99.9%', label: 'Uptime' },
  ];

  const logos = [
    'Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'Netflix'
  ];

  // Double the testimonials for seamless infinite scroll
  const duplicatedTestimonials = [...testimonials, ...testimonials];

  return (
    <section className="py-24 bg-card relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-teal/5 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container-section relative z-10">
        {/* Client Logos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <p className="text-center text-sm text-muted-foreground mb-8">
            Trusted by candidates interviewing at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {logos.map((logo) => (
              <motion.div
                key={logo}
                whileHover={{ scale: 1.1 }}
                className="text-xl font-bold text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors cursor-pointer"
              >
                {logo}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
        >
          {stats.map((stat) => (
            <motion.div 
              key={stat.label} 
              whileHover={{ scale: 1.05, y: -5 }}
              className="text-center p-6 rounded-2xl bg-secondary/50 cursor-pointer transition-shadow hover:shadow-lg"
            >
              <p className="text-3xl md:text-4xl font-bold gradient-text mb-2">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-center mb-12"
        >
          <span className="section-label mb-4 inline-block">TESTIMONIALS</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Loved by Candidates <span className="gradient-text">Worldwide</span>
          </h2>
        </motion.div>

        {/* Scrolling Testimonial Cards - Right to Left */}
        <div className="relative overflow-hidden">
          {/* Gradient Masks for smooth fade effect */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-card to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-card to-transparent z-10 pointer-events-none" />
          
          <motion.div
            animate={{ x: ['0%', '-50%'] }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="flex gap-6"
          >
            {duplicatedTestimonials.map((testimonial, index) => (
              <motion.div
                key={`${testimonial.name}-${index}`}
                whileHover={{ scale: 1.02, y: -5 }}
                className="testimonial-card group hover:shadow-xl transition-all flex-shrink-0 w-[350px]"
              >
                {/* Quote Icon */}
                <Quote className="w-10 h-10 text-primary/20 mb-4" />

                {/* Content */}
                <p className="text-foreground mb-6 leading-relaxed">"{(testimonial as any).content || (testimonial as any).quote}"</p>

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(Math.max(1, Math.min(5, testimonial.rating || 5)))].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role}
                      {testimonial.company ? ` · ${testimonial.company}` : ''}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
