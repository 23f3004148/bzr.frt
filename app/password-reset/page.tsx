'use client';

import { useState } from 'react';
import SpaLink, { spaNavigate } from '../../components/common/SpaLink';
import Icon from '@/components/ui/AppIcon';

const PasswordResetPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log('Password reset email sent to:', email);
      setIsLoading(false);
      setIsEmailSent(true);
    }, 1500);
  };

  const handleResend = () => {
    setIsEmailSent(false);
    setEmail('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/95 to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-0 bg-card rounded-2xl shadow-2xl overflow-hidden">
        {/* Left Side - Illustration & Security Info */}
        <div className="hidden lg:flex flex-col justify-center items-center bg-gradient-to-br from-secondary/10 to-accent/10 p-12 relative overflow-hidden">
          <div className="absolute top-10 left-10 w-32 h-32 bg-secondary/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-gradient-to-br from-secondary to-accent rounded-2xl flex items-center justify-center shadow-xl">
                <Icon name="LockClosedIcon" size={48} className="text-white" variant="solid" />
              </div>
            </div>
            
            <h2 className="font-headline text-4xl font-bold text-primary">
              Secure Account Recovery
            </h2>
            
            <p className="text-lg text-muted-foreground max-w-md">
              We'll send you a secure link to reset your password and get you back to your interview coaching journey.
            </p>
            
            <div className="space-y-4 pt-8">
              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border text-left">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon name="ClockIcon" size={20} className="text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Quick Process</h3>
                    <p className="text-sm text-muted-foreground">Reset link arrives within 5 minutes</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border text-left">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon name="ShieldCheckIcon" size={20} className="text-success" variant="solid" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Secure SpaLink</h3>
                    <p className="text-sm text-muted-foreground">One-time use, expires in 24 hours</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border text-left">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon name="ChatBubbleLeftRightIcon" size={20} className="text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Need Help?</h3>
                    <p className="text-sm text-muted-foreground">Live chat support available 24/7</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Reset Form */}
        <div className="p-8 lg:p-12 flex flex-col justify-center">
          <div className="mb-8">
            <SpaLink href="/login" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors duration-250">
              <Icon name="ArrowLeftIcon" size={20} />
              <span className="text-sm">Back to Sign In</span>
            </SpaLink>
          </div>

          {!isEmailSent ? (
            <>
              <div className="mb-8">
                <h1 className="font-headline text-3xl font-bold text-foreground mb-2">
                  Reset Your Password
                </h1>
                <p className="text-muted-foreground">
                  Enter your email address and we'll send you a secure link to reset your password
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Icon name="EnvelopeIcon" size={20} className="text-muted-foreground" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all duration-250"
                    />
                  </div>
                </div>

                <div className="bg-secondary/5 rounded-lg p-4 border border-secondary/20">
                  <div className="flex items-start gap-3">
                    <Icon name="InformationCircleIcon" size={20} className="text-secondary flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-foreground">
                      <strong>Security tip:</strong> The reset link will expire in 24 hours and can only be used once. Check your spam folder if you don't see the email.
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-accent text-accent-foreground rounded-lg font-semibold shadow-cta hover:bg-accent/90 transition-all duration-250 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Icon name="ArrowPathIcon" size={20} className="animate-spin" />
                      Sending Reset SpaLink...
                    </>
                  ) : (
                    <>
                      Send Reset SpaLink
                      <Icon name="PaperAirplaneIcon" size={20} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Remember your password?{' '}
                  <SpaLink href="/login" className="text-accent font-semibold hover:text-accent/80 transition-colors duration-250">
                    Sign in
                  </SpaLink>
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-success/20 rounded-full mb-6">
                  <Icon name="CheckCircleIcon" size={48} className="text-success" variant="solid" />
                </div>
                <h1 className="font-headline text-3xl font-bold text-foreground mb-2">
                  ✅ Email Sent Successfully!
                </h1>
                <p className="text-muted-foreground">
                  Check your inbox - we've sent password reset instructions to:
                </p>
                <p className="text-accent font-semibold mt-1">{email}</p>
              </div>

              <div className="space-y-4">
                <div className="bg-success/5 rounded-lg p-4 border border-success/20">
                  <div className="flex items-start gap-3">
                    <Icon name="InformationCircleIcon" size={20} className="text-success flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-foreground">
                      <p className="mb-2"><strong>Great! Here's what to do next:</strong></p>
                      <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                        <li>Open the email from Interview Copilot</li>
                        <li>Click the secure reset link (valid for 24 hours)</li>
                        <li>Create your new password</li>
                        <li>Sign in and continue your interview prep!</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-warning/5 rounded-lg p-4 border border-warning/20">
                  <div className="flex items-start gap-3">
                    <Icon name="ExclamationTriangleIcon" size={20} className="text-warning flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-foreground">
                      <strong>Didn't receive the email?</strong>
                      <p className="text-muted-foreground mt-1">Check your spam folder or wait a few minutes. Email delivery can take up to 5 minutes.</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleResend}
                  className="w-full py-3 bg-muted text-foreground rounded-lg font-semibold hover:bg-muted/80 transition-all duration-250 flex items-center justify-center gap-2"
                >
                  <Icon name="ArrowPathIcon" size={20} />
                  Send Another SpaLink
                </button>

                <SpaLink
                  href="/login"
                  className="block w-full py-3 bg-accent text-accent-foreground rounded-lg font-semibold shadow-cta hover:bg-accent/90 transition-all duration-250 text-center"
                >
                  Back to Sign In
                </SpaLink>
              </div>

              <div className="mt-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Need immediate help?{' '}
                  <SpaLink href="/contact" className="text-accent font-semibold hover:text-accent/80 transition-colors duration-250">
                    Contact Support
                  </SpaLink>
                </p>
              </div>
            </>
          )}

          <div className="mt-8 pt-8 border-t border-border">
            <div className="text-center">
              <h3 className="text-sm font-semibold text-foreground mb-3">Password Security Tips</h3>
              <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Icon name="CheckIcon" size={16} className="text-success flex-shrink-0 mt-0.5" />
                  <span>Use 12+ characters</span>
                </div>
                <div className="flex items-start gap-2">
                  <Icon name="CheckIcon" size={16} className="text-success flex-shrink-0 mt-0.5" />
                  <span>Mix letters & numbers</span>
                </div>
                <div className="flex items-start gap-2">
                  <Icon name="CheckIcon" size={16} className="text-success flex-shrink-0 mt-0.5" />
                  <span>Include symbols</span>
                </div>
                <div className="flex items-start gap-2">
                  <Icon name="CheckIcon" size={16} className="text-success flex-shrink-0 mt-0.5" />
                  <span>Avoid common words</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetPage;