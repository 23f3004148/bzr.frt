import { useMemo, useState } from 'react';
import { AppState } from '../types';
import { resetPassword, resetPasswordWithOtp, requestOtp } from '../services/backendApi';
import Icon from './ui/AppIcon';
import SpaLink from './common/SpaLink';

interface Props {
  onNavigate: (state: AppState) => void;
}

export default function ResetPasswordPage({ onNavigate }: Props) {
  const token = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('token') || '';
  }, []);
  const userId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('userId') || '';
  }, []);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpNotice, setOtpNotice] = useState('');

  const emailParam = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('email') || '';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      if (otpCode && emailParam) {
        await resetPasswordWithOtp({ email: emailParam, otpCode, newPassword: password });
      } else {
        if (!token || !userId) {
          setError('Missing reset token. Please use the link from your email.');
          setIsLoading(false);
          return;
        }
        await resetPassword({ userId, token, newPassword: password });
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Could not reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setOtpNotice('');
    setError(null);
    if (!emailParam) {
      setError('No email found for OTP. Open the reset link from your email or include ?email=you@example.com.');
      return;
    }
    setOtpSending(true);
    try {
      await requestOtp(emailParam, 'reset');
      setOtpNotice('OTP sent to your email. Check inbox/spam.');
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP.');
    } finally {
      setOtpSending(false);
    }
  };

  return (
    <div className="copilot-theme min-h-screen bg-gradient-to-br from-primary via-primary/95 to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-card rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8 lg:p-12">
          <div className="mb-8">
            <SpaLink href="/landing-page" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors duration-250">
              <Icon name="ArrowLeftIcon" size={20} />
              <span className="text-sm">Back to Home</span>
            </SpaLink>
          </div>

          <div className="mb-8">
            <h1 className="font-headline text-3xl font-bold text-foreground mb-2">Set a new password</h1>
            <p className="text-muted-foreground">Choose a strong password you don't use elsewhere.</p>
          </div>

          {success ? (
            <div className="bg-success/10 border border-success/20 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <Icon name="CheckCircleIcon" size={22} className="text-success" variant="solid" />
                <div>
                  <h2 className="font-semibold text-foreground mb-1">Password updated</h2>
                  <p className="text-sm text-muted-foreground">You can now sign in with your new password.</p>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate(AppState.USER_LOGIN);
                    }}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground font-semibold shadow-cta hover:bg-accent/90 transition-all duration-250"
                  >
                    Go to Login
                    <Icon name="ArrowRightIcon" size={18} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-sm text-foreground">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">OTP Code (optional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon name="KeyIcon" size={20} className="text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter OTP if you have it"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all duration-250"
                  />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpSending}
                    className="inline-flex items-center gap-2 rounded-lg border border-accent px-4 py-2 text-accent font-semibold hover:bg-accent/10 transition-colors disabled:opacity-50"
                  >
                    {otpSending ? (
                      <>
                        <Icon name="ArrowPathIcon" size={16} className="animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Icon name="PaperAirplaneIcon" size={16} />
                        Send OTP
                      </>
                    )}
                  </button>
                  {otpNotice && <span className="text-xs text-muted-foreground">{otpNotice}</span>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon name="LockClosedIcon" size={20} className="text-muted-foreground" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all duration-250"
                  />
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
                    Updating...
                  </>
                ) : (
                  <>
                    Update Password
                    <Icon name="ArrowRightIcon" size={20} />
                  </>
                )}
              </button>

              <p className="text-xs text-muted-foreground">
                Having trouble? <SpaLink href="/contact" className="text-accent hover:underline">Contact support</SpaLink>.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
