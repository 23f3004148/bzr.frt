import { useMemo, useState } from 'react';
import { AppState, User } from '../types';
import { registerUser, requestOtp } from '../services/backendApi';
import Icon from './ui/AppIcon';
import SpaLink from './common/SpaLink';

interface PageProps {
  onLogin: () => void;
  onNavigate: (state: AppState) => void;
  onUserLoginSuccess: (user: User) => void;
  onBack?: () => void;
}

export default function UserSignup({ onLogin, onNavigate, onUserLoginSuccess }: PageProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    otpCode: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [otpSending, setOtpSending] = useState(false);

  const redirectUri = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('redirect_uri');
  }, []);

  const redirectToExtensionIfNeeded = () => {
    if (!redirectUri) return false;
    const token = sessionStorage.getItem('buuzzer_token') || localStorage.getItem('buuzzer_token');
    if (!token) return false;
    const url = `${redirectUri}#token=${encodeURIComponent(token)}`;
    window.location.assign(url);
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!formData.email.trim()) {
      setError('Please enter your email.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setStep(2);
  };

  const handleSendOtp = async () => {
    setError('');
    if (!formData.email.trim()) {
      setError('Enter your email to receive the OTP.');
      return;
    }
    setOtpSending(true);
    try {
      await requestOtp(formData.email.trim(), 'signup');
      setOtpRequested(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!acceptTerms) {
      setError('Please accept the terms to continue.');
      return;
    }
    if (!formData.otpCode.trim()) {
      setError('Enter the OTP sent to your email.');
      return;
    }
    setIsLoading(true);
    try {
      const user = await registerUser({
        name: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        otpCode: formData.otpCode.trim(),
      });
      if ((user as any).role === 'admin') {
        setError('Use the admin signup/login instead.');
        setIsLoading(false);
        return;
      }
      onUserLoginSuccess(user);
      setSuccess(`Account created! Your User ID is: ${(user as any).loginId}. Please save it.`);
      if (redirectToExtensionIfNeeded()) return;
      onLogin();
      onNavigate(AppState.DASHBOARD);
    } catch (err) {
      console.error(err);
      setError((err as any)?.message || 'Signup failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="copilot-theme min-h-screen bg-gradient-to-br from-primary via-primary/95 to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-0 bg-card rounded-2xl shadow-2xl overflow-hidden">
        <div className="hidden lg:flex flex-col justify-center items-center bg-gradient-to-br from-success/10 to-accent/10 p-12 relative overflow-hidden">
          <div className="absolute top-10 right-10 w-32 h-32 bg-success/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl"></div>

          <div className="relative z-10 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-gradient-to-br from-accent to-secondary rounded-2xl flex items-center justify-center shadow-xl">
                <Icon name="RocketLaunchIcon" size={48} className="text-white" variant="solid" />
              </div>
            </div>

            <h2 className="font-headline text-4xl font-bold text-primary">Start Your Journey</h2>

            <p className="text-lg text-muted-foreground max-w-md">
              Create your BUUZZER account and access AI-powered interview coaching.
            </p>

            <div className="space-y-4 pt-8">
              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border text-left">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon name="CheckCircleIcon" size={20} className="text-accent" variant="solid" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Real-Time AI Assistance</h3>
                    <p className="text-sm text-muted-foreground">Instant suggestions during interviews</p>
                  </div>
                </div>
              </div>

              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border text-left">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon name="AcademicCapIcon" size={20} className="text-secondary" variant="solid" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Personalized Coaching</h3>
                    <p className="text-sm text-muted-foreground">Tailored to you</p>
                  </div>
                </div>
              </div>

              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border text-left">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon name="ShieldCheckIcon" size={20} className="text-success" variant="solid" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Secure & Private</h3>
                    <p className="text-sm text-muted-foreground">We respect your data</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 lg:p-12 flex flex-col justify-center">
          <div className="mb-8">
            <SpaLink href="/landing-page" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors duration-250">
              <Icon name="ArrowLeftIcon" size={20} />
              <span className="text-sm">Back to Home</span>
            </SpaLink>
          </div>

          <div className="mb-8">
            <h1 className="font-headline text-3xl font-bold text-foreground mb-2">Create your account</h1>
            <p className="text-muted-foreground">It only takes a minute.</p>
          </div>

          {error && (
            <div className="mb-6 bg-destructive/10 text-destructive rounded-lg p-4 border border-destructive/20">
              <div className="flex items-start gap-3">
                <Icon name="ExclamationTriangleIcon" size={20} className="text-destructive flex-shrink-0 mt-0.5" />
                <div className="text-sm">{error}</div>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-success/10 text-success rounded-lg p-4 border border-success/20">
              <div className="flex items-start gap-3">
                <Icon name="CheckCircleIcon" size={20} className="text-success flex-shrink-0 mt-0.5" variant="solid" />
                <div className="text-sm">{success}</div>
              </div>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleContinue} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon name="UserIcon" size={20} className="text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    placeholder="Your name"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all duration-250"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon name="EnvelopeIcon" size={20} className="text-muted-foreground" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all duration-250"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon name="LockClosedIcon" size={20} className="text-muted-foreground" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all duration-250"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon name="LockClosedIcon" size={20} className="text-muted-foreground" />
                  </div>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all duration-250"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-accent text-accent-foreground rounded-lg font-semibold shadow-cta hover:bg-accent/90 transition-all duration-250 flex items-center justify-center gap-2"
              >
                Continue
                <Icon name="ArrowRightIcon" size={20} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="text-sm text-foreground">
                  <div className="font-semibold">Review</div>
                  <div className="text-muted-foreground mt-1">Name: {formData.fullName}</div>
                  <div className="text-muted-foreground">Email: {formData.email}</div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-[1.2fr_0.8fr]">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">OTP Code</label>
                  <input
                    type="text"
                    name="otpCode"
                    value={formData.otpCode}
                    onChange={handleChange}
                    required
                    placeholder="Enter 6-digit code"
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all duration-250"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpSending}
                    className="w-full py-3 rounded-lg border border-accent text-accent font-semibold hover:bg-accent/10 transition-all disabled:opacity-50"
                  >
                    {otpSending ? 'Sending...' : otpRequested ? 'Resend OTP' : 'Send OTP'}
                  </button>
                  {otpRequested && (
                    <span className="mt-1 text-xs text-muted-foreground">OTP sent to your email.</span>
                  )}
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-accent focus:ring-accent mt-1"
                />
                <span className="text-sm text-foreground">
                  I agree to the{' '}
                  <SpaLink href="/terms-of-service" className="text-accent font-semibold hover:text-accent/80">Terms</SpaLink>
                  {' '}and{' '}
                  <SpaLink href="/privacy-policy" className="text-accent font-semibold hover:text-accent/80">Privacy Policy</SpaLink>.
                </span>
              </label>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full py-3 border border-border rounded-lg font-semibold hover:bg-muted transition-all duration-250"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-accent text-accent-foreground rounded-lg font-semibold shadow-cta hover:bg-accent/90 transition-all duration-250 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Icon name="ArrowPathIcon" size={20} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create account
                      <Icon name="ArrowRightIcon" size={20} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <SpaLink href="/login" className="text-accent font-semibold hover:text-accent/80 transition-colors duration-250">
                Sign in
              </SpaLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
