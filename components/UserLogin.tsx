import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, User } from '../types';
import { login, loginWithGoogle } from '../services/backendApi';
import Icon from './ui/AppIcon';
import SpaLink, { spaNavigate } from './common/SpaLink';

interface PageProps {
  onLogin: () => void;
  onNavigate: (state: AppState) => void;
  onUserLoginSuccess: (user: User) => void;
  onBack?: () => void;
}

export const UserLogin = ({ onLogin, onNavigate, onUserLoginSuccess }: PageProps) => {
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const autoPromptedRef = useRef(false);
  const googleClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID as string | undefined;

  const redirectUri = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('redirect_uri');
  }, []);
  const continueWith = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('continueWith') || '';
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

  const completeLogin = (user: User) => {
    onUserLoginSuccess(user);
    if (redirectToExtensionIfNeeded()) return;
    onLogin();
    onNavigate(AppState.DASHBOARD);
    spaNavigate('/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const user = await login(formData.identifier.trim(), formData.password);
      if ((user as any).role === 'admin') {
        setError('Use the admin login instead.');
        return;
      }
      // rememberMe keeps token in localStorage (backendApi already does that); if false, move to sessionStorage
      if (!rememberMe) {
        const token = localStorage.getItem('buuzzer_token');
        if (token) {
          localStorage.removeItem('buuzzer_token');
          sessionStorage.setItem('buuzzer_token', token);
        }
      }

      completeLogin(user);
    } catch (err: any) {
      setError(err?.message || 'Invalid credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleCredential = async (response: any) => {
    const idToken = response?.credential;
    if (!idToken) return;
    setError('');
    setGoogleLoading(true);
    try {
      const user = await loginWithGoogle(idToken);
      completeLogin(user);
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    if (!googleClientId) return;
    const shouldAutoPrompt = continueWith === 'google';
    const initGoogle = () => {
      const googleIdentity = (window as any).google;
      if (!googleIdentity?.accounts?.id || !googleButtonRef.current) return;
      googleIdentity.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
        auto_select: shouldAutoPrompt,
      });
      googleButtonRef.current.innerHTML = '';
      googleIdentity.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'signin_with',
        width: 320,
      });
      if (shouldAutoPrompt && !autoPromptedRef.current) {
        autoPromptedRef.current = true;
        googleIdentity.accounts.id.prompt();
      }
      setGoogleReady(true);
    };

    const existing = document.getElementById('google-identity-script');
    if (existing) {
      if ((window as any).google) {
        initGoogle();
      } else {
        existing.addEventListener('load', initGoogle);
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
  }, [googleClientId, continueWith]);

  return (
    <div className="copilot-theme min-h-screen bg-gradient-to-br from-primary via-primary/95 to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-0 bg-card rounded-2xl shadow-2xl overflow-hidden">
        {/* Left Side */}
        <div className="hidden lg:flex flex-col justify-center items-center bg-gradient-to-br from-accent/10 to-secondary/10 p-12 relative overflow-hidden">
          <div className="absolute top-10 left-10 w-32 h-32 bg-accent/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-secondary/20 rounded-full blur-3xl"></div>

          <div className="relative z-10 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-28 h-28 bg-primary rounded-2xl flex items-center justify-center shadow-xl p-3">
                <img
                  src="/Buuzzer_LOGO.svg"
                  alt="Buuzzer"
                  className="h-full w-full object-contain drop-shadow-lg"
                />
              </div>
            </div>

            <h2 className="font-headline text-4xl font-bold text-primary">Welcome Back!</h2>
            <p className="text-lg text-muted-foreground max-w-md">
              Continue your journey with AI-powered interview coaching and real-time assistance.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-8">
              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="SparklesIcon" size={20} className="text-accent" variant="solid" />
                  <span className="text-sm font-semibold text-foreground">AI Coaching</span>
                </div>
                <p className="text-xs text-muted-foreground">Personalized interview prep</p>
              </div>

              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="ShieldCheckIcon" size={20} className="text-success" variant="solid" />
                  <span className="text-sm font-semibold text-foreground">Secure</span>
                </div>
                <p className="text-xs text-muted-foreground">Your data is protected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="p-8 lg:p-12 flex flex-col justify-center">
          <div className="mb-8">
            <SpaLink
              href="/landing-page"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors duration-250"
            >
              <Icon name="ArrowLeftIcon" size={20} />
              <span className="text-sm">Back to Home</span>
            </SpaLink>
          </div>

          <div className="mb-6">
            <h1 className="font-headline text-3xl font-bold text-foreground mb-2">Sign In to Your Account</h1>
            <p className="text-muted-foreground">Access your BUUZZER dashboard</p>
          </div>

          {error && (
            <div className="mb-6 bg-destructive/10 border border-destructive/20 text-foreground rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Icon name="ExclamationTriangleIcon" size={20} className="text-destructive flex-shrink-0 mt-0.5" variant="solid" />
                <div className="text-sm">{error}</div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email or User ID</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon name="EnvelopeIcon" size={20} className="text-muted-foreground" />
                </div>
                <input
                  type="text"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleChange}
                  required
                  placeholder="you@example.com or USER123"
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
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="********"
                  className="w-full pl-10 pr-11 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all duration-250"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition"
                >
                  <Icon name={showPassword ? 'EyeSlashIcon' : 'EyeIcon'} size={20} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                />
                <span className="text-sm text-foreground">Remember me</span>
              </label>

              <SpaLink href="/password-reset" className="text-sm text-accent hover:text-accent/80 transition-colors duration-250">
                Forgot password?
              </SpaLink>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-accent text-accent-foreground rounded-lg font-semibold shadow-cta hover:bg-accent/90 transition-all duration-250 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Icon name="ArrowPathIcon" size={20} className="animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <Icon name="ArrowRightIcon" size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              <span>Or continue with</span>
              <span className="h-px flex-1 bg-border" />
            </div>
            {googleClientId ? (
              <div className="flex flex-col items-center gap-2">
                {!googleReady && (
                  <div className="text-xs text-muted-foreground">Loading Google Sign-In...</div>
                )}
                <div ref={googleButtonRef} className="flex justify-center" />
                {googleLoading && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Icon name="ArrowPathIcon" size={16} className="animate-spin" />
                    Connecting to Google...
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center">
                Add VITE_GOOGLE_CLIENT_ID to enable Google Sign-In.
              </p>
            )}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <SpaLink href="/signup" className="text-accent font-semibold hover:text-accent/80 transition-colors duration-250">
                Sign up for free
              </SpaLink>
            </p>
          </div>

          <div className="mt-6 bg-accent/5 rounded-lg p-4 border border-accent/20">
            <div className="flex items-start gap-3">
              <Icon name="InformationCircleIcon" size={20} className="text-accent flex-shrink-0 mt-0.5" />
              <div className="text-sm text-foreground">
                <strong>Tip:</strong> If you were given a User ID during signup, you can use it to sign in too.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;

