'use client';

import { useState } from 'react';
import SpaLink, { spaNavigate } from '../../components/common/SpaLink';
import Icon from '@/components/ui/AppIcon';

const SignupPage = () => {
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    careerLevel: '',
    industry: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [step, setStep] = useState(1);
  const [isAccountCreated, setIsAccountCreated] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1 && formData.password === formData.confirmPassword) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTerms) return;
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log('Signup:', formData);
      setIsLoading(false);
      setIsAccountCreated(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/95 to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-0 bg-card rounded-2xl shadow-2xl overflow-hidden">
        {/* Left Side - Illustration & Benefits */}
        <div className="hidden lg:flex flex-col justify-center items-center bg-gradient-to-br from-success/10 to-accent/10 p-12 relative overflow-hidden">
          <div className="absolute top-10 right-10 w-32 h-32 bg-success/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-gradient-to-br from-accent to-secondary rounded-2xl flex items-center justify-center shadow-xl">
                <Icon name="RocketLaunchIcon" size={48} className="text-white" variant="solid" />
              </div>
            </div>
            
            <h2 className="font-headline text-4xl font-bold text-primary">
              Start Your Journey
            </h2>
            
            <p className="text-lg text-muted-foreground max-w-md">
              Join thousands of professionals who have transformed their interview performance with AI-powered coaching.
            </p>
            
            <div className="space-y-4 pt-8">
              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border text-left">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon name="CheckCircleIcon" size={20} className="text-accent" variant="solid" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Real-Time AI Assistance</h3>
                    <p className="text-sm text-muted-foreground">Get instant answers during live interviews</p>
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
                    <p className="text-sm text-muted-foreground">Tailored to your industry and career level</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border text-left">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon name="ShieldCheckIcon" size={20} className="text-success" variant="solid" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">100% Secure & Private</h3>
                    <p className="text-sm text-muted-foreground">No recording, audio-only processing</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="p-8 lg:p-12 flex flex-col justify-center">
          {!isAccountCreated ? (
            <>
              <div className="mb-8">
                <SpaLink href="/landing-page" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors duration-250">
                  <Icon name="ArrowLeftIcon" size={20} />
                  <span className="text-sm">Back to Home</span>
                </SpaLink>
              </div>

              <div className="mb-8">
                <h1 className="font-headline text-3xl font-bold text-foreground mb-2">
                  Create Your Account
                </h1>
                <p className="text-muted-foreground">
                  Step {step} of 2 - {step === 1 ? 'Account Details' : 'Career Information'}
                </p>
              </div>

              {step === 1 ? (
                <form onSubmit={handleContinue} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Full Name
                    </label>
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
                        placeholder="John Doe"
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all duration-250"
                      />
                    </div>
                  </div>

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
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Password
                    </label>
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
                    <p className="text-xs text-muted-foreground mt-1">At least 8 characters with numbers and symbols</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Confirm Password
                    </label>
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
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Career Level
                    </label>
                    <select
                      name="careerLevel"
                      value={formData.careerLevel}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all duration-250"
                    >
                      <option value="">Select your career level</option>
                      <option value="entry">Entry Level (0-2 years)</option>
                      <option value="mid">Mid Level (3-5 years)</option>
                      <option value="senior">Senior Level (6-10 years)</option>
                      <option value="lead">Lead/Principal (10+ years)</option>
                      <option value="executive">Executive/C-Suite</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Industry
                    </label>
                    <select
                      name="industry"
                      value={formData.industry}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all duration-250"
                    >
                      <option value="">Select your industry</option>
                      <option value="technology">Technology</option>
                      <option value="finance">Finance & Banking</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="marketing">Marketing & Advertising</option>
                      <option value="sales">Sales</option>
                      <option value="consulting">Consulting</option>
                      <option value="education">Education</option>
                      <option value="retail">Retail</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="bg-success/5 rounded-lg p-4 border border-success/20">
                    <div className="flex items-start gap-3">
                      <Icon name="CheckCircleIcon" size={20} className="text-success flex-shrink-0 mt-0.5" variant="solid" />
                      <div className="text-sm text-foreground">
                        <strong>Personalized coaching ready!</strong> We'll customize your practice sessions based on your career level and industry.
                      </div>
                    </div>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="w-4 h-4 mt-1 rounded border-border text-accent focus:ring-accent"
                    />
                    <span className="text-sm text-foreground">
                      I agree to the{' '}
                      <SpaLink href="/terms-of-service" className="text-accent hover:underline">
                        Terms of Service
                      </SpaLink>
                      {' '}and{' '}
                      <SpaLink href="/privacy-policy" className="text-accent hover:underline">
                        Privacy Policy
                      </SpaLink>
                    </span>
                  </label>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 py-3 bg-muted text-foreground rounded-lg font-semibold hover:bg-muted/80 transition-all duration-250"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || !acceptTerms}
                      className="flex-1 py-3 bg-accent text-accent-foreground rounded-lg font-semibold shadow-cta hover:bg-accent/90 transition-all duration-250 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <Icon name="ArrowPathIcon" size={20} className="animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        <>
                          Create Account
                          <Icon name="CheckIcon" size={20} />
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

              {step === 1 && (
                <div className="mt-6 bg-accent/5 rounded-lg p-4 border border-accent/20">
                  <div className="flex items-start gap-3">
                    <Icon name="InformationCircleIcon" size={20} className="text-accent flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-foreground">
                      <strong>7-day free trial</strong> with full access to all premium features. No credit card required.
                    </div>
                  </div>
                </div>
              )}
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
                    🎉 Account Created Successfully!
                  </h2>
                  <p className="text-lg text-muted-foreground mb-2">
                    Welcome to Interview Copilot, {formData.fullName}!
                  </p>
                  <p className="text-accent font-semibold">
                    {formData.email}
                  </p>
                </div>

                <div className="bg-success/5 rounded-lg p-6 border border-success/20 text-left">
                  <div className="flex items-start gap-3">
                    <Icon name="SparklesIcon" size={24} className="text-success flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-3">You're All Set! Here's What's Next:</h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <Icon name="CheckIcon" size={16} className="text-success flex-shrink-0 mt-0.5" />
                          <span><strong className="text-foreground">Sign in now</strong> to access your personalized dashboard</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Icon name="CheckIcon" size={16} className="text-success flex-shrink-0 mt-0.5" />
                          <span>Your <strong className="text-foreground">7-day free trial</strong> starts immediately</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Icon name="CheckIcon" size={16} className="text-success flex-shrink-0 mt-0.5" />
                          <span>Start practicing with <strong className="text-foreground">AI coaching</strong> tailored to {formData.industry}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <SpaLink
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-accent text-accent-foreground rounded-lg font-semibold shadow-cta hover:bg-accent/90 transition-all duration-250"
                >
                  Sign In to Get Started
                  <Icon name="ArrowRightIcon" size={20} />
                </SpaLink>

                <p className="text-sm text-muted-foreground">
                  Questions?{' '}
                  <SpaLink href="/contact" className="text-accent hover:underline font-medium">
                    We're here to help
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

export default SignupPage;