'use client';

import { useState } from 'react';
import SpaLink, { spaNavigate } from '../../components/common/SpaLink';
import Icon from '@/components/ui/AppIcon';

const ResetPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate password reset email
    setTimeout(() => {
      console.log('Reset password for:', email);
      setIsLoading(false);
      setIsEmailSent(true);
    }, 1500);
  };

  const handleResendEmail = () => {
    setIsLoading(true);
    setTimeout(() => {
      console.log('Resend email to:', email);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/95 to-secondary flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-96 h-96 bg-accent rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Illustration */}
        <div className="hidden lg:flex flex-col justify-center space-y-6 text-primary-foreground">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-accent/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <Icon name="KeyIcon" size={20} className="text-accent" />
              <span className="text-sm font-medium">Secure Password Recovery</span>
            </div>
            <h1 className="font-headline text-5xl font-bold leading-tight">
              Reset Your Password
            </h1>
            <p className="text-xl text-primary-foreground/90">
              Don't worry! It happens. We'll send you recovery instructions to get you back on track.
            </p>
          </div>

          {/* Security Illustration */}
          <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-8 border border-primary-foreground/20">
            <div className="flex items-center justify-center mb-6">
              <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center">
                <Icon name="LockClosedIcon" size={48} className="text-accent" variant="solid" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Icon name="CheckCircleIcon" size={20} className="text-accent" variant="solid" />
                <span className="text-sm">Secure email verification</span>
              </div>
              <div className="flex items-center gap-3">
                <Icon name="CheckCircleIcon" size={20} className="text-accent" variant="solid" />
                <span className="text-sm">Encrypted password reset link</span>
              </div>
              <div className="flex items-center gap-3">
                <Icon name="CheckCircleIcon" size={20} className="text-accent" variant="solid" />
                <span className="text-sm">SpaLink expires in 1 hour</span>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-6 border border-primary-foreground/20">
            <div className="flex items-start gap-3">
              <Icon name="InformationCircleIcon" size={24} className="text-accent flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold mb-2">Need Help?</h3>
                <p className="text-sm text-primary-foreground/80">
                  If you don't receive the email within a few minutes, check your spam folder or{' '}
                  <SpaLink href="/contact" className="text-accent hover:underline">
                    contact support
                  </SpaLink>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Reset Password Form */}
        <div className="bg-card rounded-2xl shadow-2xl p-8 lg:p-10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary mb-4">
              <svg
                width="40"
                height="40"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16 4L8 8V14C8 19.55 11.84 24.74 16 26C20.16 24.74 24 19.55 24 14V8L16 4Z"
                  fill="currentColor"
                  className="text-primary-foreground"
                />
                <path
                  d="M14 18L11 15L12.41 13.59L14 15.17L19.59 9.58L21 11L14 18Z"
                  fill="currentColor"
                  className="text-accent"
                />
              </svg>
            </div>
            <h2 className="font-headline text-3xl font-bold text-foreground text-center">
              {isEmailSent ? 'Check Your Email' : 'Forgot Password?'}
            </h2>
            <p className="text-muted-foreground text-center mt-2">
              {isEmailSent
                ? 'We\'ve sent password reset instructions' :'Enter your email to receive reset instructions'}
            </p>
          </div>

          {!isEmailSent ? (
            <>
              {/* Reset Password Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-6 py-3 bg-accent text-accent-foreground rounded-lg font-semibold shadow-cta hover:bg-accent/90 transition-all duration-250 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Icon name="ArrowPathIcon" size={20} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Reset SpaLink
                      <Icon name="PaperAirplaneIcon" size={20} />
                    </>
                  )}
                </button>
              </form>

              {/* Back to Login */}
              <div className="mt-6 text-center">
                <SpaLink
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent/90 font-medium transition-colors"
                >
                  <Icon name="ArrowLeftIcon" size={16} />
                  Back to Sign In
                </SpaLink>
              </div>
            </>
          ) : (
            <>
              {/* Email Sent Success State */}
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-success/20 rounded-full mb-4">
                    <Icon name="CheckCircleIcon" size={48} className="text-success" variant="solid" />
                  </div>
                  <h2 className="font-headline text-2xl font-bold text-foreground mb-2">
                    ✨ Success! Check Your Email
                  </h2>
                </div>

                <div className="bg-success/10 rounded-lg p-6 border border-success/20">
                  <div className="flex items-start gap-3">
                    <Icon name="CheckCircleIcon" size={24} className="text-success flex-shrink-0" variant="solid" />
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-2">
                        Password Reset SpaLink Sent!
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        We've sent a secure password reset link to <strong className="text-foreground">{email}</strong>.
                        Click the link in your email to create a new password and get back to your interview prep!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-accent/5 rounded-lg p-4 border border-accent/20">
                  <div className="flex items-start gap-3">
                    <Icon name="ClockIcon" size={20} className="text-accent flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-foreground">
                      <strong>SpaLink expires in 1 hour.</strong> For security reasons, the reset link will expire after 60 minutes.
                    </div>
                  </div>
                </div>

                {/* Resend Email */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    Didn't receive the email?
                  </p>
                  <button
                    onClick={handleResendEmail}
                    disabled={isLoading}
                    className="px-6 py-2 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-all duration-250 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Sending...' : 'Resend Email'}
                  </button>
                </div>

                {/* Back to Login */}
                <div className="text-center pt-4 border-t border-border">
                  <SpaLink
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent/90 font-medium transition-colors"
                  >
                    <Icon name="ArrowLeftIcon" size={16} />
                    Back to Sign In
                  </SpaLink>
                </div>
              </div>
            </>
          )}

          {/* Security Indicators */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Icon name="ShieldCheckIcon" size={16} variant="solid" />
                <span>SSL Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="LockClosedIcon" size={16} variant="solid" />
                <span>Privacy Protected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;