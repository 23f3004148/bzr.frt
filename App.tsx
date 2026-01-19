import React, { useState, useEffect, useCallback } from 'react';
import LandingPage from './components/LandingPage';
import { UserDashboard } from './components/UserDashboard';
import ProfilePage from './components/ProfilePage';
import { InterviewSession } from './components/InterviewSession';
import PrivacyPage from './components/PrivacyPage';
import TermsPage from './components/TermsPage';
import ContactPage from './components/ContactPage';
import BlogPage from './components/BlogPage';
import PricingPage from './components/PricingPage';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminResetPassword } from './components/AdminResetPassword';
import { UserLogin } from './components/UserLogin';
import UserSignup from './components/UserSignup';
import AboutUsPage from './components/AboutUsPage';
import ResponsibleAIUsePage from './components/ResponsibleAIUsePage';
import { JoinMeeting } from './components/JoinMeeting';
import { MeetingTranscriptionMentor } from './components/MeetingTranscriptionMentor';
import { MeetingTranscriptionLearner } from './components/MeetingTranscriptionLearner';
// import { CopilotConsole } from './components/CopilotConsole';
import StealthConsole from './components/StealthConsole';
import ScheduleInterviewPage from './components/ScheduleInterviewPage';
import CreateSessionPage from './components/CreateSessionPage';
import PurchaseCreditsPage from './components/PurchaseCreditsPage';
import PaymentHistoryPage from './components/PaymentHistoryPage';
import AdminPaymentHistoryPage from './components/AdminPaymentHistoryPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import ExtensionAuth from './components/ExtensionAuth';
import { UserPreferences, AppState, AIProvider, User, Meeting } from './types';
import { getCurrentUser, getDefaultProvider, clearAuth } from './services/backendApi';
import { FlashProvider } from './components/FlashMessage';

const App: React.FC = () => {
  const pathToState = (pathname: string): AppState => {
    const path = (pathname || '/').split('?')[0].replace(/\/+$/, '') || '/';
    const map: Record<string, AppState> = {
      '/': AppState.LANDING,
      '/landing-page': AppState.LANDING,
      '/dashboard': AppState.DASHBOARD,
      '/profile': AppState.PROFILE,
      '/session': AppState.SESSION,
      '/features': AppState.FEATURES,
      '/how-it-works': AppState.HOW_IT_WORKS,
      '/privacy': AppState.PRIVACY,
      '/privacy-policy': AppState.PRIVACY,
      '/terms': AppState.TERMS,
      '/terms-of-service': AppState.TERMS,
      '/contact': AppState.CONTACT,
      '/blog': AppState.BLOG,
      '/about-us': AppState.ABOUT_US,
      '/responsible-ai-use': AppState.RESPONSIBLE_AI,
      '/pricing': AppState.PRICING,
      '/login': AppState.USER_LOGIN,
      '/signup': AppState.USER_SIGNUP,
      '/sign-up': AppState.USER_SIGNUP,
      '/admin/login': AppState.ADMIN_LOGIN,
      '/admin/reset-password': AppState.ADMIN_RESET_PASSWORD,
      '/admin': AppState.ADMIN_DASHBOARD,
      '/meeting/join': AppState.JOIN_MEETING,
      '/meeting/transcription/mentor': AppState.MEETING_TRANSCRIPTION_MENTOR,
      '/meeting/transcription/learner': AppState.MEETING_TRANSCRIPTION_LEARNER,
      '/console': AppState.COPILOT_CONSOLE,
      // Dedicated pages for scheduling an AI interview and creating a mentor session
      '/schedule-interview': AppState.SCHEDULE_INTERVIEW,
      '/create-session': AppState.CREATE_SESSION,
      // Purchase pages
      '/buy-ai-credits': AppState.BUY_AI_CREDITS,
      '/buy-mentor-credits': AppState.BUY_MENTOR_CREDITS,
      '/payments': AppState.PAYMENT_HISTORY,
      '/admin/payments': AppState.ADMIN_PAYMENT_HISTORY,
      '/credits': AppState.BUY_AI_CREDITS,
      '/forgot-password': AppState.FORGOT_PASSWORD,
      '/password-reset': AppState.FORGOT_PASSWORD,
      '/reset-password': AppState.RESET_PASSWORD,
      '/extension/auth': AppState.EXTENSION_AUTH
    };
    return map[path] || AppState.LANDING;
  };

  const stateToPath = (state: AppState): string => {
    const map: Record<AppState, string> = {
      [AppState.LANDING]: '/',
      [AppState.DASHBOARD]: '/dashboard',
      [AppState.PROFILE]: '/profile',
      [AppState.SESSION]: '/session',
      [AppState.FEATURES]: '/features',
      [AppState.HOW_IT_WORKS]: '/how-it-works',
      [AppState.PRIVACY]: '/privacy',
      [AppState.TERMS]: '/terms',
      [AppState.CONTACT]: '/contact',
      [AppState.BLOG]: '/blog',
      [AppState.ABOUT_US]: '/about-us',
      [AppState.RESPONSIBLE_AI]: '/responsible-ai-use',
      [AppState.PRICING]: '/pricing',
      [AppState.USER_LOGIN]: '/login',
      [AppState.USER_SIGNUP]: '/signup',
      [AppState.ADMIN_LOGIN]: '/admin/login',
      [AppState.ADMIN_RESET_PASSWORD]: '/admin/reset-password',
      [AppState.ADMIN_DASHBOARD]: '/admin',
      [AppState.JOIN_MEETING]: '/meeting/join',
      [AppState.MEETING_TRANSCRIPTION_MENTOR]: '/meeting/transcription/mentor',
      [AppState.MEETING_TRANSCRIPTION_LEARNER]: '/meeting/transcription/learner',
      [AppState.COPILOT_CONSOLE]: '/console'
      ,
      // Dedicated pages for scheduling an AI interview and creating a mentor session
      [AppState.SCHEDULE_INTERVIEW]: '/schedule-interview',
      [AppState.CREATE_SESSION]: '/create-session'
      ,
      // Purchase pages
      [AppState.BUY_AI_CREDITS]: '/credits',
      [AppState.BUY_MENTOR_CREDITS]: '/credits',
      [AppState.PAYMENT_HISTORY]: '/payments',
      [AppState.ADMIN_PAYMENT_HISTORY]: '/admin/payments',
      [AppState.FORGOT_PASSWORD]: '/forgot-password',
      [AppState.RESET_PASSWORD]: '/reset-password',
      [AppState.EXTENSION_AUTH]: '/extension/auth'
    };
    return map[state] || '/';
  };

  const isProtectedState = useCallback((state: AppState): boolean => {
    return [
      AppState.DASHBOARD,
      AppState.PROFILE,
      AppState.SESSION,
      AppState.ADMIN_DASHBOARD,
      AppState.JOIN_MEETING,
      AppState.MEETING_TRANSCRIPTION_MENTOR,
      AppState.MEETING_TRANSCRIPTION_LEARNER,
      // protect dedicated pages for scheduling and creating sessions
      AppState.SCHEDULE_INTERVIEW,
      AppState.CREATE_SESSION,
      // protect purchase and payment pages
      AppState.BUY_AI_CREDITS,
      AppState.BUY_MENTOR_CREDITS,
      AppState.PAYMENT_HISTORY,
      AppState.ADMIN_PAYMENT_HISTORY
    ].includes(state);
  }, []);

  const getInitialAppState = (): AppState => {
    const mapped = pathToState(window.location.pathname);
    const token = sessionStorage.getItem('buuzzer_token') || localStorage.getItem('buuzzer_token');
    if (!token && isProtectedState(mapped)) {
      return mapped === AppState.ADMIN_DASHBOARD ? AppState.ADMIN_LOGIN : AppState.USER_LOGIN;
    }
    return mapped;
  };

  const [appState, setAppState] = useState<AppState>(() => getInitialAppState());
  const [history, setHistory] = useState<AppState[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  
  // Auth State
  const [currentUsername, setCurrentUsername] = useState<string>('');
  // Admin State
  const [adminAiProvider, setAdminAiProvider] = useState<AIProvider | null>(null);

  // User Management State
  const [users, setUsers] = useState<User[]>(() => {
    const saved = sessionStorage.getItem('buuzzer_users');
    // Migration for old data or init new
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure all users have fullName property if coming from old version
      return parsed.map((u: any) => ({ ...u, fullName: u.fullName || u.username }));
    }
    return [{ username: 'user1', fullName: 'Demo User', password: 'user123', createdAt: Date.now() }];
  });

  // Persist users to localStorage
  useEffect(() => {
    sessionStorage.setItem('buuzzer_users', JSON.stringify(users));
  }, [users]);

  const handleCreateUser = (user: User) => {
    setUsers(prev => [...prev, user]);
  };

  const handleDeleteUser = (username: string) => {
    setUsers(prev => prev.filter(u => u.username !== username));
  };

  const handleResetUserPassword = (username: string, newPass: string) => {
    setUsers(prev => prev.map(u => u.username === username ? { ...u, password: newPass } : u));
  };

  const handleNavigate = (state: AppState) => {
    const nextPath = stateToPath(state);
    try {
      window.history.pushState({ appState: state }, '', nextPath);
    } catch {
      // ignore History API failures
    }
    setHistory(prev => [...prev, appState]);
    setAppState(state);
  }

  const scrollToLandingSection = useCallback((id: string) => {
    const hash = `#${id}`;
    if (window.location.hash !== hash) {
      try {
        window.history.replaceState({ appState }, '', `${window.location.pathname}${hash}`);
      } catch {
        window.location.hash = hash;
      }
    }
    requestAnimationFrame(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }, [appState]);

  const handleBack = () => {
    if (
      appState === AppState.JOIN_MEETING ||
      appState === AppState.MEETING_TRANSCRIPTION_LEARNER ||
      appState === AppState.MEETING_TRANSCRIPTION_MENTOR
    ) {
      setActiveMeeting(null);
    }
    if (history.length === 0) {
      setAppState(AppState.LANDING);
      return;
    }
    const newHistory = [...history];
    const previousState = newHistory.pop();
    setHistory(newHistory);
    if (previousState) {
        setAppState(previousState);
    } else {
        setAppState(AppState.LANDING);
    }
  };

  const refreshProvider = useCallback(async () => {
    try {
      const provider = await getDefaultProvider();
      setAdminAiProvider(provider);
      return provider;
    } catch (err) {
      console.error('Failed to refresh provider', err);
      return null;
    }
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem('buuzzer_token');
    if (stored && !localStorage.getItem('buuzzer_token')) {
      localStorage.setItem('buuzzer_token', stored);
    }
  }, []);

  useEffect(() => {
    // Always hydrate default provider on load so non-admin UIs stay in sync.
    void refreshProvider();
  }, [refreshProvider]);

  useEffect(() => {
    const onPopState = () => {
      const next = pathToState(window.location.pathname);
      setAppState(next);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const onAuthSuccess = (event: any) => {
      const user = event?.detail?.user as User | undefined;
      if (!user) return;
      const username = user.loginId || (user as any).username || '';
      setCurrentUsername(username);
      setCurrentUser(user);
      setHistory([]);
      setAppState(user.role === 'admin' ? AppState.ADMIN_DASHBOARD : AppState.DASHBOARD);
      void refreshProvider();
    };

    window.addEventListener('buuzzer-auth-success', onAuthSuccess as EventListener);
    return () => window.removeEventListener('buuzzer-auth-success', onAuthSuccess as EventListener);
  }, [refreshProvider]);

  useEffect(() => {
    if (appState === AppState.FEATURES) {
      scrollToLandingSection('features');
      return;
    }
    if (appState === AppState.HOW_IT_WORKS) {
      scrollToLandingSection('how-it-works');
    }
  }, [appState, scrollToLandingSection]);


  const handleLogout = () => {
    setCurrentUsername('');
    setPreferences(null);
    setCurrentUser(null);
    setActiveMeeting(null);
    setHistory([]);
    setAdminAiProvider(null);

  clearAuth();

  // ✅ Force URL back to landing
  try {
    window.history.replaceState({ appState: AppState.LANDING }, '', '/');
  } catch {}

  setAppState(AppState.LANDING);
};

  const handleLogin = () => {
    handleNavigate(AppState.USER_LOGIN);
  };

  const handleUserLoginSuccess = async (user: User) => {
    const username = user.loginId || user.username || '';
    setCurrentUsername(username);
    setCurrentUser(user);
    handleNavigate(user.role === 'admin' ? AppState.ADMIN_DASHBOARD : AppState.DASHBOARD);
    void refreshProvider();
  };

  const handleStartSession = (prefs: UserPreferences) => {
    setPreferences(prefs);
    handleNavigate(AppState.SESSION);
  };

  const handleEndSession = () => {
    handleBack(); // Returning to Dashboard
  };

  const handleOpenMeeting = (meeting: Meeting) => {
    setActiveMeeting(meeting);
    const isHost = String(meeting.mentorId) === String(currentUser?.id);
    handleNavigate(isHost ? AppState.MEETING_TRANSCRIPTION_MENTOR : AppState.MEETING_TRANSCRIPTION_LEARNER);
  };

  const handleJoinMeetingForLearner = (meeting: Meeting) => {
    handleOpenMeeting(meeting);
  };

  const handleAdminLoginSuccess = () => {
    void refreshProvider();
  };

  useEffect(() => {
    let active = true;
    (async () => {
      const token = sessionStorage.getItem('buuzzer_token');
      if (!token) return;
      const current = await getCurrentUser().catch(() => null);
      await refreshProvider();
      if (!active) return;
      if (current) {
        setCurrentUser(current);
        const username = current.loginId || current.username || '';
        setCurrentUsername(username);
        // Preserve the deep-linked route on hard reload (e.g. /console). We
        // only force-redirect to a dashboard when the user is on a public page
        // like landing/login.
        const mappedFromPath = pathToState(window.location.pathname);
        const shouldRedirectToDashboard = [
          AppState.LANDING,
          AppState.USER_LOGIN,
          AppState.USER_SIGNUP,
          AppState.ADMIN_LOGIN,
          AppState.ADMIN_RESET_PASSWORD,
          AppState.FEATURES,
          AppState.HOW_IT_WORKS,
        ].includes(mappedFromPath);

        if (shouldRedirectToDashboard) {
          setAppState(current.role === 'admin' ? AppState.ADMIN_DASHBOARD : AppState.DASHBOARD);
        } else {
          setAppState(mappedFromPath);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [refreshProvider]);

  useEffect(() => {
    if (!isProtectedState(appState)) return;
    const token = sessionStorage.getItem('buuzzer_token') || localStorage.getItem('buuzzer_token');
    if (token) return;
    const redirectState =
      appState === AppState.ADMIN_DASHBOARD ? AppState.ADMIN_LOGIN : AppState.USER_LOGIN;
    const redirectPath = redirectState === AppState.ADMIN_LOGIN ? '/admin/login' : '/login';

    try {
      window.history.replaceState({ appState: redirectState }, '', redirectPath);
    } catch (err) {
      console.error('Failed to update history for auth guard', err);
    }

    setAppState(redirectState);
  }, [appState, isProtectedState]);

  return (
    <FlashProvider>
        {(appState === AppState.LANDING ||
          appState === AppState.FEATURES ||
          appState === AppState.HOW_IT_WORKS) && (
          <LandingPage onLogin={handleLogin} onNavigate={handleNavigate} />
        )}

      {appState === AppState.PRIVACY && (
        <PrivacyPage onLogin={handleLogin} onNavigate={handleNavigate} onBack={handleBack} />
      )}

      {appState === AppState.TERMS && (
        <TermsPage onLogin={handleLogin} onNavigate={handleNavigate} onBack={handleBack} />
      )}

      {appState === AppState.CONTACT && (
        <ContactPage onLogin={handleLogin} onNavigate={handleNavigate} onBack={handleBack} />
      )}

      {appState === AppState.BLOG && (
        <BlogPage onLogin={handleLogin} onNavigate={handleNavigate} onBack={handleBack} />
      )}
      {appState === AppState.ABOUT_US && (
        <AboutUsPage />
      )}

      {appState === AppState.RESPONSIBLE_AI && (
        <ResponsibleAIUsePage />
      )}

      {appState === AppState.USER_SIGNUP && (
        <UserSignup
          onLogin={handleLogin}
          onNavigate={handleNavigate}
          onUserLoginSuccess={handleUserLoginSuccess}
          onBack={handleBack}
        />
      )}


      {appState === AppState.PRICING && (
        <PricingPage onLogin={handleLogin} onNavigate={handleNavigate} onBack={handleBack} />
      )}

      {appState === AppState.USER_LOGIN && (
        <UserLogin 
          onLogin={handleLogin} 
          onNavigate={handleNavigate} 
          onUserLoginSuccess={handleUserLoginSuccess}
          onBack={handleBack}
        />
      )}

      {appState === AppState.EXTENSION_AUTH && <ExtensionAuth />}

      {appState === AppState.ADMIN_LOGIN && (
        <AdminLogin 
          onLogin={handleLogin} 
          onNavigate={handleNavigate} 
          onAdminLoginSuccess={handleAdminLoginSuccess}
          onBack={handleBack}
        />
      )}

      {appState === AppState.ADMIN_RESET_PASSWORD && (
        <AdminResetPassword 
          onNavigate={handleNavigate}
          onBack={handleBack}
        />
      )}

      {appState === AppState.ADMIN_DASHBOARD && (
        <AdminDashboard 
          onLogin={handleLogin} 
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          onProviderChange={setAdminAiProvider}
          currentProvider={adminAiProvider}
          onBack={handleBack}
        />
      )}

      {/* Single user dashboard: no mentor/learner separation */}

      {appState === AppState.JOIN_MEETING && (
        <JoinMeeting
          onJoined={handleJoinMeetingForLearner}
          onCancel={handleBack}
        />
      )}

      {appState === AppState.MEETING_TRANSCRIPTION_MENTOR && activeMeeting && (
        <MeetingTranscriptionMentor meeting={activeMeeting} onBack={handleBack} />
      )}

      {appState === AppState.MEETING_TRANSCRIPTION_LEARNER && activeMeeting && (
        <MeetingTranscriptionLearner meeting={activeMeeting} onBack={handleBack} />
      )}

      {appState === AppState.DASHBOARD && currentUser && currentUser.role !== 'admin' && (
        <UserDashboard
          currentUser={currentUser}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          aiProvider={adminAiProvider || 'OPENAI'}
          onStartSession={handleStartSession}
          onOpenMeeting={handleOpenMeeting}
        />
      )}

      {appState === AppState.PROFILE && currentUser && (
        <ProfilePage
          currentUser={currentUser}
          onNavigate={handleNavigate}
          onBack={handleBack}
          onLogout={handleLogout}
          onUserUpdated={(update) =>
            setCurrentUser((prev) => (prev ? { ...prev, ...update } : prev))
          }
        />
      )}

              {appState === AppState.COPILOT_CONSOLE && (
        /* Use the new StealthConsole in place of the legacy CopilotConsole */
        <StealthConsole />
      )}

      {appState === AppState.SCHEDULE_INTERVIEW && currentUser && currentUser.role !== 'admin' && (
        <ScheduleInterviewPage
          currentUser={currentUser}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          aiProvider={adminAiProvider || 'OPENAI'}
          onStartSession={handleStartSession}
        />
      )}

      {appState === AppState.CREATE_SESSION && currentUser && currentUser.role !== 'admin' && (
        <CreateSessionPage
          currentUser={currentUser}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          aiProvider={adminAiProvider || 'OPENAI'}
          onOpenMeeting={handleOpenMeeting}
        />
      )}

      {/* Forgot password page (public) */}
      {appState === AppState.FORGOT_PASSWORD && (
        <ForgotPasswordPage
          onNavigate={handleNavigate}
          onBack={() => handleNavigate(AppState.USER_LOGIN)}
        />
      )}

      {/* Reset password page (public) */}
      {appState === AppState.RESET_PASSWORD && (
        <ResetPasswordPage
          onNavigate={handleNavigate}
          onBack={() => handleNavigate(AppState.USER_LOGIN)}
        />
      )}

      {/* Purchase pages for users */}
      {(appState === AppState.BUY_AI_CREDITS || appState === AppState.BUY_MENTOR_CREDITS) &&
        currentUser &&
        currentUser.role !== 'admin' && (
          <PurchaseCreditsPage currentUser={currentUser} onLogout={handleLogout} onNavigate={handleNavigate} />
        )}

      {appState === AppState.PAYMENT_HISTORY && currentUser && currentUser.role !== 'admin' && (
        <PaymentHistoryPage
          currentUser={currentUser}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}

      {/* Admin payment history */}
      {appState === AppState.ADMIN_PAYMENT_HISTORY && currentUser && currentUser.role === 'admin' && (
        <AdminPaymentHistoryPage
          currentUser={currentUser}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}

{appState === AppState.SESSION && preferences && (
          <InterviewSession 
            preferences={preferences} 
            onEndSession={handleEndSession}
            defaultProvider={adminAiProvider}
          />
        )}
    </FlashProvider>
  );
};

export default App;
