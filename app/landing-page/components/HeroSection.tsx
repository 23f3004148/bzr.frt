'use client';

import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import SpaLink, { spaNavigate } from '../../../components/common/SpaLink';
import { loginWithGoogle } from '@/services/backendApi';

interface HeroSectionProps {
  onTrialClick: () => void;
  onDemoClick: () => void;
}

const HeroSection = ({ onTrialClick, onDemoClick }: HeroSectionProps) => {
  const googleClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID as string | undefined;
  const [googleReady, setGoogleReady] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const googleInitializedRef = useRef(false);

  const handleGoogleCredential = async (response: any) => {
    const idToken = response?.credential;
    if (!idToken) {
      setGoogleLoading(false);
      return;
    }
    setGoogleError('');
    setGoogleLoading(true);
    try {
      const user = await loginWithGoogle(idToken);
      window.dispatchEvent(new CustomEvent('buuzzer-auth-success', { detail: { user } }));
      spaNavigate('/dashboard');
    } catch (err: any) {
      setGoogleError(err?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    if (!googleClientId) return;

    const initGoogle = () => {
      const googleIdentity = (window as any).google?.accounts?.id;
      if (!googleIdentity || googleInitializedRef.current) return;
      googleIdentity.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
      });
      googleInitializedRef.current = true;
      setGoogleReady(true);
    };

    const existing = document.getElementById('google-identity-script');
    if (existing) {
      if ((window as any).google) {
        initGoogle();
      } else {
        existing.addEventListener('load', initGoogle);
        return () => existing.removeEventListener('load', initGoogle);
      }
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.id = 'google-identity-script';
    script.onload = initGoogle;
    document.body.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, [googleClientId]);

  const handleGoogleClick = () => {
    setGoogleError('');
    if (!googleClientId) {
      spaNavigate('/login?continueWith=google');
      return;
    }
    const googleIdentity = (window as any).google?.accounts?.id;
    if (!googleIdentity || !googleReady) {
      spaNavigate('/login?continueWith=google');
      return;
    }
    setGoogleLoading(true);
    googleIdentity.prompt((notification: any) => {
      const dismissed =
        notification?.isNotDisplayed?.() ||
        notification?.isSkippedMoment?.() ||
        notification?.isDismissedMoment?.();
      if (dismissed) {
        setGoogleLoading(false);
      }
    });
  };

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-primary via-primary/95 to-secondary overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: marketing copy */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-accent/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <Icon name="SparklesIcon" size={20} className="text-accent" variant="solid" />
              <span className="text-sm font-medium text-primary-foreground">Real-Time AI Interview Assistant</span>
            </div>

            <h1 className="font-headline text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight">
              Get Real-Time AI Help During Live Interviews
            </h1>

            <p className="text-xl text-primary-foreground/90 leading-relaxed">
              Interview Copilot listens to the interviewer, transcribes questions instantly, and gives you accurate, role-specific answers — discreetly.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <SpaLink
                href="/signup"
                className="font-cta px-8 py-4 bg-accent text-accent-foreground rounded-lg text-lg font-semibold shadow-cta hover:bg-accent/90 transition-all duration-250 flex items-center justify-center gap-2"
              >
                Start Free Trial
                <Icon name="ArrowRightIcon" size={20} />
              </SpaLink>
              <button
                onClick={onDemoClick}
                className="font-cta px-8 py-4 bg-primary-foreground/10 backdrop-blur-sm text-primary-foreground rounded-lg text-lg font-semibold hover:bg-primary-foreground/20 transition-all duration-250 flex items-center justify-center gap-2"
              >
                <Icon name="PlayIcon" size={20} variant="solid" />
                See How It Works
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4 pt-8 border-t border-primary-foreground/20">
              <div className="flex items-center gap-2">
                <Icon name="MicrophoneIcon" size={20} className="text-accent" />
                <span className="text-xs text-primary-foreground/80">Audio-only</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="ShieldCheckIcon" size={20} className="text-accent" variant="solid" />
                <span className="text-xs text-primary-foreground/80">No recording</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="HandRaisedIcon" size={20} className="text-accent" />
                <span className="text-xs text-primary-foreground/80">Manual control</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="DevicePhoneMobileIcon" size={20} className="text-accent" />
                <span className="text-xs text-primary-foreground/80">Multi-device</span>
              </div>
            </div>
          </div>

          {/* Right: auth actions (replaces the old console demo) */}
          <div className="relative">
            <div className="relative rounded-2xl bg-card/95 backdrop-blur shadow-2xl border border-border p-6 space-y-5">
              <div className="flex justify-center">
                <img src="/buzzer-logo-with-text.svg" alt="BUUZZER" className="h-16 w-auto" />
              </div>

              <div className="inline-flex items-center gap-2 rounded-full bg-primary/5 px-3 py-1">
                <Icon name="SparklesIcon" size={18} className="text-accent" variant="solid" />
                <span className="text-xs font-medium text-muted-foreground">Start in seconds</span>
              </div>

              <h2 className="text-2xl font-semibold text-foreground">Jump into your BUUZZER console</h2>
              <p className="text-sm text-muted-foreground">
                Continue with your Google account or email in just a few clicks. No credit card required.
              </p>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleGoogleClick}
                  disabled={googleLoading}
                  className="w-full inline-flex items-center justify-center gap-3 rounded-xl bg-foreground text-background py-3 px-4 font-cta text-sm sm:text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-250 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {googleLoading ? (
                    <>
                      <Icon name="ArrowPathIcon" size={18} className="animate-spin" />
                      <span>Connecting to Google...</span>
                    </>
                  ) : (
                    <>
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-background/10 text-lg font-semibold">
                        G
                      </span>
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>

                <SpaLink
                  href="/login?continueWith=email"
                  className="w-full inline-flex items-center justify-center gap-3 rounded-xl border border-border bg-background/80 py-3 px-4 font-cta text-sm sm:text-base hover:bg-muted transition-all duration-250"
                >
                  <Icon name="EnvelopeIcon" size={18} className="text-muted-foreground" />
                  <span>Continue with Email</span>
                </SpaLink>

                <p className="text-xs text-muted-foreground text-center">
                  By continuing, you agree to our{' '}
                  <SpaLink href="/terms-of-service" className="underline underline-offset-2 hover:text-foreground">
                    Terms
                  </SpaLink>{' '}
                  and{' '}
                  <SpaLink href="/privacy-policy" className="underline underline-offset-2 hover:text-foreground">
                    Privacy Policy
                  </SpaLink>
                  .
                </p>
                {googleError && (
                  <p className="text-xs text-destructive text-center">{googleError}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
