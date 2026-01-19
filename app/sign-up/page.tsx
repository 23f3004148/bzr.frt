'use client';

import { useState } from 'react';
import SpaLink, { spaNavigate } from '../../components/common/SpaLink';
import Icon from '@/components/ui/AppIcon';

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    careerLevel: '',
    termsAccepted: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isAccountCreated, setIsAccountCreated] = useState(false);

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    return strength;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate registration
    setTimeout(() => {
      console.log('Sign up:', formData);
      setIsLoading(false);
      setIsAccountCreated(true);
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const handleSocialSignUp = (provider: string) => {
    console.log(`Sign up with ${provider}`);
    // Implement social authentication
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-gray-300';
    if (passwordStrength === 1) return 'bg-error';
    if (passwordStrength === 2) return 'bg-warning';
    if (passwordStrength === 3) return 'bg-secondary';
    return 'bg-success';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength === 1) return 'Weak';
    if (passwordStrength === 2) return 'Fair';
    if (passwordStrength === 3) return 'Good';
    return 'Strong';
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
              <Icon name="RocketLaunchIcon" size={20} className="text-accent" />
              <span className="text-sm font-medium">Start Your Career Transformation</span>
            </div>
            <h1 className="font-headline text-5xl font-bold leading-tight">
              Join 50,000+ Successful Candidates
            </h1>
            <p className="text-xl text-primary-foreground/90">
              Master your interviews with personalized AI coaching tailored to your career goals.
            </p>
          </div>

          {/* Career Journey Illustration */}
          <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-8 border border-primary-foreground/20">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <Icon name="AcademicCapIcon" size={24} className="text-accent" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold mb-1">Personalized Learning</div>
                  <div className="text-xs text-primary-foreground/70">AI adapts to your career level</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <Icon name="ChartBarIcon" size={24} className="text-accent" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold mb-1">Track Progress</div>
                  <div className="text-xs text-primary-foreground/70">Monitor your improvement</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <Icon name="TrophyIcon" size={24} className="text-accent" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold mb-1">Land Your Dream Job</div>
                  <div className="text-xs text-primary-foreground/70">Join successful candidates</div>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonial */}
          <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-6 border border-primary-foreground/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-accent"></div>
              <div>
                <div className="text-sm font-semibold">Sarah Johnson</div>
                <div className="text-xs text-primary-foreground/70">Software Engineer at Google</div>
              </div>
            </div>
            <p className="text-sm text-primary-foreground/90 italic">
              "Interview Copilot helped me land my dream job. The AI coaching was incredibly accurate and boosted my confidence."
            </p>
          </div>
        </div>

        {/* Right side - Sign Up Form */}
        <div className="bg-card rounded-2xl shadow-2xl p-8 lg:p-10">
          {!isAccountCreated ? (
            <>
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
                  Create Your Account
                </h2>
                <p className="text-muted-foreground text-center mt-2">
                  Start your interview mastery journey today
                </p>
              </div>

              {/* Social Sign Up Options */}
              <div className="space-y-3 mb-6">
                <button
                  type="button"
                  onClick={() => handleSocialSignUp('Google')}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-lg hover:bg-muted transition-all duration-250"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="font-medium text-foreground">Sign up with Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialSignUp('LinkedIn')}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-lg hover:bg-muted transition-all duration-250"
                >
                  <svg className="w-5 h-5" fill="#0A66C2" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  <span className="font-medium text-foreground">Sign up with LinkedIn</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialSignUp('Microsoft')}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-lg hover:bg-muted transition-all duration-250"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#f25022" d="M0 0h11.377v11.372H0z" />
                    <path fill="#00a4ef" d="M12.623 0H24v11.372H12.623z" />
                    <path fill="#7fba00" d="M0 12.623h11.377V24H0z" />
                    <path fill="#ffb900" d="M12.623 12.623H24V24H12.623z" />
                  </svg>
                  <span className="font-medium text-foreground">Sign up with Microsoft</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-card text-muted-foreground">or sign up with email</span>
                </div>
              </div>

              {/* Sign Up Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="Create a strong password"
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Icon
                        name={showPassword ? 'EyeSlashIcon' : 'EyeIcon'}
                        size={20}
                      />
                    </button>
                  </div>
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              level <= passwordStrength ? getPasswordStrengthColor() : 'bg-gray-300'
                            }`}
                          ></div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Password strength: <span className="font-medium">{getPasswordStrengthText()}</span>
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Career Level
                  </label>
                  <select
                    name="careerLevel"
                    value={formData.careerLevel}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Select your career level</option>
                    <option value="entry">Entry Level (0-2 years)</option>
                    <option value="mid">Mid Level (3-5 years)</option>
                    <option value="senior">Senior Level (6-10 years)</option>
                    <option value="lead">Lead/Principal (10+ years)</option>
                    <option value="executive">Executive/C-Suite</option>
                  </select>
                </div>

                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    name="termsAccepted"
                    checked={formData.termsAccepted}
                    onChange={handleChange}
                    required
                    className="w-4 h-4 mt-1 rounded border-border text-accent focus:ring-accent"
                  />
                  <label className="text-sm text-foreground">
                    I agree to the{' '}
                    <SpaLink href="/terms-of-service" className="text-accent hover:underline">
                      Terms of Service
                    </SpaLink>
                    {' '}and{' '}
                    <SpaLink href="/privacy-policy" className="text-accent hover:underline">
                      Privacy Policy
                    </SpaLink>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !formData.termsAccepted}
                  className="w-full px-6 py-3 bg-accent text-accent-foreground rounded-lg font-semibold shadow-cta hover:bg-accent/90 transition-all duration-250 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Icon name="ArrowPathIcon" size={20} className="animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <Icon name="RocketLaunchIcon" size={20} />
                    </>
                  )}
                </button>
              </form>

              {/* Sign In SpaLink */}
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <SpaLink
                    href="/login"
                    className="text-accent hover:text-accent/90 font-semibold transition-colors"
                  >
                    Sign In
                  </SpaLink>
                </p>
              </div>

              {/* Security Indicators */}
              <div className="mt-6 pt-6 border-t border-border">
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
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-success/20 rounded-full mb-4">
                  <Icon name="CheckCircleIcon" size={56} className="text-success" variant="solid" />
                </div>
                
                <div>
                  <h2 className="font-headline text-3xl font-bold text-foreground mb-3">
                    Welcome Aboard! 🎉
                  </h2>
                  <p className="text-lg text-muted-foreground mb-2">
                    Your account has been created successfully!
                  </p>
                  <p className="text-accent font-semibold">
                    {formData.email}
                  </p>
                </div>

                <div className="bg-accent/5 rounded-lg p-6 border border-accent/20 text-left">
                  <div className="flex items-start gap-3">
                    <Icon name="InformationCircleIcon" size={24} className="text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-3">Next Steps:</h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <Icon name="ArrowRightIcon" size={16} className="text-accent flex-shrink-0 mt-0.5" />
                          <span>You can now <strong className="text-foreground">sign in</strong> with your email and password</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Icon name="ArrowRightIcon" size={16} className="text-accent flex-shrink-0 mt-0.5" />
                          <span>Start your <strong className="text-foreground">7-day free trial</strong> with full access to all features</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Icon name="ArrowRightIcon" size={16} className="text-accent flex-shrink-0 mt-0.5" />
                          <span>Begin practicing with <strong className="text-foreground">AI-powered interview coaching</strong></span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <SpaLink
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-accent text-accent-foreground rounded-lg font-semibold shadow-cta hover:bg-accent/90 transition-all duration-250"
                >
                  Continue to Sign In
                  <Icon name="ArrowRightIcon" size={20} />
                </SpaLink>

                <p className="text-sm text-muted-foreground">
                  Need help getting started?{' '}
                  <SpaLink href="/contact" className="text-accent hover:underline font-medium">
                    Contact Support
                  </SpaLink>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;