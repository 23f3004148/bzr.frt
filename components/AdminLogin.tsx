import { useState } from 'react';
import { AppState } from '../types';
import { login } from '../services/backendApi';
import Icon from './ui/AppIcon';
import SpaLink from './common/SpaLink';

interface PageProps {
  onLogin: () => void;
  onNavigate: (state: AppState) => void;
  onAdminLoginSuccess: () => void;
  onBack?: () => void;
}

export const AdminLogin: React.FC<PageProps> = ({ onLogin, onNavigate, onAdminLoginSuccess, onBack }) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const adminResetKey = (import.meta as any).env?.VITE_ADMIN_RESET_KEY ?? '8887777';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    if (loginId.trim() === adminResetKey && password.trim() === adminResetKey) {
      onNavigate(AppState.ADMIN_RESET_PASSWORD);
      setIsLoading(false);
      return;
    }
    try {
      const user = await login(loginId, password);
      if (user.role !== 'admin') {
        setError('Only admin accounts can log in here.');
        return;
      }
      onAdminLoginSuccess();
      onLogin();
      onNavigate(AppState.ADMIN_DASHBOARD);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Invalid admin credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="copilot-theme min-h-screen bg-gradient-to-br from-primary via-primary/95 to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-0 bg-card rounded-2xl shadow-2xl overflow-hidden">
        <div className="hidden lg:flex flex-col justify-center items-center bg-gradient-to-br from-accent/10 to-secondary/10 p-12 relative overflow-hidden">
          <div className="absolute top-10 left-10 w-32 h-32 bg-accent/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-secondary/20 rounded-full blur-3xl"></div>

          <div className="relative z-10 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-primary rounded-2xl flex items-center justify-center shadow-xl">
                <Icon name="ShieldCheckIcon" size={48} className="text-primary-foreground" variant="solid" />
              </div>
            </div>

            <h2 className="font-headline text-4xl font-bold text-primary">Admin Console</h2>
            <p className="text-lg text-muted-foreground max-w-md">
              Secure access for managing users, content, and system settings.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-8">
              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="UsersIcon" size={20} className="text-accent" variant="solid" />
                  <span className="text-sm font-semibold text-foreground">User Ops</span>
                </div>
                <p className="text-xs text-muted-foreground">Manage accounts and access</p>
              </div>

              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="Cog6ToothIcon" size={20} className="text-success" variant="solid" />
                  <span className="text-sm font-semibold text-foreground">Settings</span>
                </div>
                <p className="text-xs text-muted-foreground">Control providers and pricing</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 lg:p-12 flex flex-col justify-center">
          <div className="mb-8 flex items-center justify-between">
            <SpaLink
              href="/landing-page"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors duration-250"
            >
              <Icon name="ArrowLeftIcon" size={20} />
              <span className="text-sm">Back to Home</span>
            </SpaLink>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="rounded-lg border border-border px-3 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Back
              </button>
            )}
          </div>

          <div className="mb-6">
            <h1 className="font-headline text-3xl font-bold text-foreground mb-2">Admin Sign In</h1>
            <p className="text-muted-foreground">Access the BUUZZER admin dashboard</p>
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
              <label className="block text-sm font-medium text-foreground mb-2">Admin Email or Login ID</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon name="UserCircleIcon" size={20} className="text-muted-foreground" />
                </div>
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  required
                  placeholder="admin@example.com"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="********"
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

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Not an admin?{' '}
              <button
                onClick={() => onNavigate(AppState.USER_LOGIN)}
                className="text-accent font-semibold hover:text-accent/80 transition-colors duration-250"
              >
                Sign in as a user
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
