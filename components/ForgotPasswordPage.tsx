import { useState } from 'react';
import { AppState } from '../types';
import { forgotPassword, resetPasswordWithOtp } from '../services/backendApi';
import Icon from './ui/AppIcon';
import SpaLink from './common/SpaLink';

interface Props {
  onNavigate: (state: AppState) => void;
}

export default function ForgotPasswordPage({ onNavigate }: Props) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err: any) {
      setError(err?.message || 'Unable to send reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetWithOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!otpCode.trim()) {
      setError('Enter the OTP sent to your email.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setIsLoading(true);
    try {
      await resetPasswordWithOtp({
        email: email.trim(),
        otpCode: otpCode.trim(),
        newPassword: password,
      });
      setResetSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Could not reset password with OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="copilot-theme min-h-screen bg-gradient-to-br from-primary via-primary/95 to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-card rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8 lg:p-12">
          <div className="mb-8">
            <SpaLink href="/login" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors duration-250">
              <Icon name="ArrowLeftIcon" size={20} />
              <span className="text-sm">Back to Login</span>
            </SpaLink>
          </div>

          <div className="mb-8">
            <h1 className="font-headline text-3xl font-bold text-foreground mb-2">Reset your password</h1>
            <p className="text-muted-foreground">Enter your account email and we’ll send you a reset link.</p>
          </div>

          {sent ? (
            <div className="bg-success/10 border border-success/20 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <Icon name="CheckCircleIcon" size={22} className="text-success flex-shrink-0 mt-0.5" variant="solid" />
                <div>
                  <p className="font-semibold text-foreground">Email sent</p>
                  <p className="text-sm text-muted-foreground mt-1">If an account exists for <span className="font-medium">{email}</span>, you’ll receive a reset link shortly.</p>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => onNavigate(AppState.USER_LOGIN)}
                      className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-lg font-semibold shadow-cta hover:bg-accent/90 transition-all duration-250"
                    >
                      Return to Login
                      <Icon name="ArrowRightIcon" size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
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

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-3 text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-accent text-accent-foreground rounded-lg font-semibold shadow-cta hover:bg-accent/90 transition-all duration-250 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Icon name="ArrowPathIcon" size={20} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Reset Link
                    <Icon name="ArrowRightIcon" size={20} />
                  </>
                )}
              </button>

              <p className="text-xs text-muted-foreground">
                By continuing, you agree to our <SpaLink href="/terms" className="text-accent hover:underline">Terms</SpaLink> and <SpaLink href="/privacy" className="text-accent hover:underline">Privacy Policy</SpaLink>.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
