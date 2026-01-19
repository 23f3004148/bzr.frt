'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { fetchSiteInfo, submitContactForm } from '@/services/backendApi';
import { SiteInfo } from '@/types';

const BenefitsSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSiteInfo()
      .then((info) => setSiteInfo(info))
      .catch(() => setSiteInfo(null));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    submitContactForm({
      name: formData.name.trim(),
      email: formData.email.trim(),
      subject: `Landing contact (${formData.company || 'No company'})`,
      message: formData.message.trim(),
    })
      .then(() => {
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3000);
        setFormData({ name: '', email: '', company: '', message: '' });
      })
      .catch((err: any) => setError(err?.message || 'Failed to send. Please try again.'))
      .finally(() => setLoading(false));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const contactEmail = siteInfo?.contactEmail || 'buuzzer.io@gmail.com';
  const contactPhone = siteInfo?.supportPhone || siteInfo?.whatsappNumber || '+91 98765 43210';
  const contactLocation =
    siteInfo?.contactLocation || 'East Bangalore, Mahadevapura Zone (India)';

  return (
    <section id="contact" className="py-20 bg-gradient-to-br from-secondary/5 to-primary/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
            <Icon name="EnvelopeIcon" size={20} className="text-primary" />
            <span className="text-sm font-medium text-primary">Get in Touch</span>
          </div>
          <h2 className="font-headline text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Contact Us
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Have questions or need enterprise solutions? We're here to help.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div>
              <h3 className="font-headline text-2xl font-semibold text-foreground mb-6">
                Why Choose Interview Copilot?
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon name="ShieldCheckIcon" size={20} className="text-accent" variant="solid" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Privacy-First Approach</h4>
                    <p className="text-sm text-muted-foreground">No video recording, no data storage. Your privacy is our priority.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon name="BoltIcon" size={20} className="text-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Real-Time Performance</h4>
                    <p className="text-sm text-muted-foreground">Instant transcription and AI-powered answers when you need them most.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon name="CogIcon" size={20} className="text-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Full Control</h4>
                    <p className="text-sm text-muted-foreground">Manual activation, toggle overlay, and complete user control at all times.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-card border border-border">
              <h4 className="font-semibold text-foreground mb-4">Contact Information</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Icon name="EnvelopeIcon" size={20} className="text-muted-foreground" />
                  <span className="text-foreground">{contactEmail}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Icon name="PhoneIcon" size={20} className="text-muted-foreground" />
                  <span className="text-foreground">{contactPhone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Icon name="MapPinIcon" size={20} className="text-muted-foreground" />
                  <span className="text-foreground">{contactLocation}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl p-8 shadow-xl border border-border">
            <h3 className="font-headline text-xl font-semibold text-foreground mb-6">
              Send us a message
            </h3>
            
            {/* Success Message */}
            {submitted && (
              <div className="mb-6 p-6 bg-green-50 border-2 border-green-500 rounded-xl animate-fade-in">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                      <Icon name="CheckCircleIcon" size={28} className="text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-headline text-xl font-bold text-green-900 mb-2">
                      Thank You for Reaching Out!
                    </h4>
                    <p className="font-body text-green-800 mb-1">
                      We've received your message and appreciate you contacting us.
                    </p>
                    <p className="font-body text-green-700 text-sm">
                      Our team will review your inquiry and get back to you within 24 hours.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-foreground mb-2">
                  Company (Optional)
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Your company"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                  placeholder="How can we help you?"
                />
              </div>
              <button
                type="submit"
                className="w-full px-6 py-4 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-all duration-250 flex items-center justify-center gap-2 disabled:opacity-60"
                disabled={loading}
              >
                <Icon name="PaperAirplaneIcon" size={20} />
                {loading ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
