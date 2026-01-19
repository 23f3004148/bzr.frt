import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiCpu, FiUsers } from 'react-icons/fi';
import { jsPDF } from 'jspdf';
import { AIProvider, AppState, Meeting, SavedInterview, User, UserPreferences, Wallet, ExamplePair } from '../types';
import AppShell from './layout/AppShell';
import { Card } from './Card';
import { Button } from './Button';
import { UserDashboardGuide } from './UserDashboardGuide';
import { useFlash } from './FlashMessage';
import Icon from './ui/AppIcon';
import {
  createInterview,
  createMeeting,
  generateCopilotSummary,
  generateInterviewSummary,
  generateMeetingSummary,
  getProfile,
  getInterviewAnswers,
  getMeetingTranscript,
  getWallet,
  joinMeeting,
  listCopilotSessions,
  listInterviews,
  listMyMeetings,
  getCreditPricing,
  deleteCopilotSession,
  deleteInterview,
  deleteMeeting,
  purchaseCredits,
  parseJobDescriptionFile,
  createRazorpayOrder,
  verifyRazorpayPayment,
} from '../services/backendApi';

const DEFAULT_MIN_CREDIT_PURCHASE = 120;
const DASHBOARD_CACHE_KEY = 'dashboard_overview_cache_v1';
const DASHBOARD_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

type Props = {
  currentUser: User;
  aiProvider?: AIProvider | null;
  onLogout: () => void;
  onNavigate: (s: AppState) => void;
  onStartSession: (preferences: UserPreferences) => void;
  onOpenMeeting: (meeting: Meeting) => void;
};

type SummaryEntry = {
  text: string;
  topics: string[];
  data?: any;
};

const fmt = (iso: string) => {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

const normalizeStatus = (s: any) => {
  if (s === 'APPROVED' || s === 'PENDING') return 'SCHEDULED';
  return s || 'SCHEDULED';
};

const getInterviewExpiryMs = (interview: SavedInterview) => {
  if (interview.expiresAt) {
    const expires = new Date(interview.expiresAt).getTime();
    if (!Number.isNaN(expires)) return expires;
  }
  if (!interview.scheduledAt) return null;
  const start = new Date(interview.scheduledAt).getTime();
  if (Number.isNaN(start)) return null;
  const durationSeconds = (interview.durationMinutes || 60) * 60;
  return start + durationSeconds * 1000;
};

const getMeetingExpiryMs = (meeting: Meeting) => {
  if (meeting.expiresAt) {
    const expires = new Date(meeting.expiresAt).getTime();
    if (!Number.isNaN(expires)) return expires;
  }
  if (!meeting.scheduledAt) return null;
  const start = new Date(meeting.scheduledAt).getTime();
  if (Number.isNaN(start)) return null;
  const durationSeconds = (meeting.durationMinutes || 60) * 60;
  return start + durationSeconds * 1000;
};

export const UserDashboard: React.FC<Props> = ({
  currentUser,
  aiProvider,
  onLogout,
  onNavigate,
  onStartSession,
  onOpenMeeting,
}) => {
  const { showFlash } = useFlash();
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<Wallet>({
    aiInterviewCredits: currentUser.wallet?.aiInterviewCredits || 0,
    mentorSessionCredits: currentUser.wallet?.mentorSessionCredits || 0,
  });
  const [minCreditPurchase, setMinCreditPurchase] = useState<number>(DEFAULT_MIN_CREDIT_PURCHASE);
  const [defaultResumeText, setDefaultResumeText] = useState<string>('');

  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [expandedHistory, setExpandedHistory] = useState<Record<string, boolean>>({});

  const [interviews, setInterviews] = useState<SavedInterview[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [copilotSessions, setCopilotSessions] = useState<any[]>([]);
  const [interviewSummaries, setInterviewSummaries] = useState<Record<string, SummaryEntry>>({});
  const [meetingSummaries, setMeetingSummaries] = useState<Record<string, SummaryEntry>>({});
  const [copilotSummaries, setCopilotSummaries] = useState<Record<string, SummaryEntry>>({});
  const [summaryLoadingId, setSummaryLoadingId] = useState<string | null>(null);
  const [meetingSummaryLoadingId, setMeetingSummaryLoadingId] = useState<string | null>(null);
  const [copilotSummaryLoadingId, setCopilotSummaryLoadingId] = useState<string | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [deletingInterviewId, setDeletingInterviewId] = useState<string | null>(null);
  const [deletingMeetingId, setDeletingMeetingId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    message: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);
  const [selectedCompletedInterviewId, setSelectedCompletedInterviewId] = useState<string>('');
  const [selectedCompletedMeetingId, setSelectedCompletedMeetingId] = useState<string>('');
  const [selectedCompletedCopilotId, setSelectedCompletedCopilotId] = useState<string>('');
  const [selectedExpiredInterviewId, setSelectedExpiredInterviewId] = useState<string>('');
  const [selectedExpiredMeetingId, setSelectedExpiredMeetingId] = useState<string>('');

  // Track which tab is currently active in the top navigation. Default
  // to "overview" to show the quick join and summary cards. Keys for
  // tabs correspond to the customNavItems defined below.
  const [activeTab, setActiveTab] = useState<string>('overview');

  /*
   * NOTE: State related to the legacy scheduling and creation forms
   * remains in place for backwards compatibility with the reuse logic
   * (see handleReuseInterview). However, these forms are no longer
   * rendered in the dashboard. Instead, dedicated pages handle
   * scheduling and session creation. Keeping these state hooks here
   * avoids TypeScript errors for unused variables that might be
   * referenced by existing callbacks. The paying/jdUploading/m* state
   * variables are similarly retained but unused in the UI.
   */
  // Legacy form state (unused in dashboard UI)
  const [iTitle, setITitle] = useState('');
  const [iScheduledAt, setIScheduledAt] = useState('');
  const [iDuration, setIDuration] = useState(30);
  const [iYears, setIYears] = useState(0);
  const [iJobDesc, setIJobDesc] = useState('');
  const [iResumeText, setIResumeText] = useState('');
  const [iResponseStyle, setIResponseStyle] = useState('Simple Professional English');
  const [iMaxLines, setIMaxLines] = useState(30);
  const [iExamples, setIExamples] = useState<ExamplePair[]>([]);
  const [jdUploading, setJdUploading] = useState(false);
  const [paying, setPaying] = useState(false);

  const [mTopic, setMTopic] = useState('');
  const [mScheduledAt, setMScheduledAt] = useState('');
  const [mGuestName, setMGuestName] = useState('');
  const [mDurationMinutes, setMDurationMinutes] = useState(60);

  // Join meeting
  const [joinKey, setJoinKey] = useState('');

  // Track online/offline status so we can hide download actions when offline.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => {
      try {
        setIsOnline(navigator.onLine);
      } catch {
        setIsOnline(true);
      }
    };
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  const toggleHistoryExpanded = (key: string) => {
    setExpandedHistory((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const applyDashboardData = (payload: {
    wallet: Wallet;
    interviews: SavedInterview[];
    meetings: Meeting[];
    resumeText: string;
    copilotSessions: any[];
    minCreditPurchase: number;
  }) => {
    setWallet(payload.wallet);
    setInterviews(payload.interviews || []);
    setMeetings(payload.meetings || []);
    setDefaultResumeText(payload.resumeText || '');
    setCopilotSessions(Array.isArray(payload.copilotSessions) ? payload.copilotSessions : []);
    setMinCreditPurchase(payload.minCreditPurchase);
  };

  const hydrateFromCache = useCallback(() => {
    try {
      const raw = sessionStorage.getItem(DASHBOARD_CACHE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed?.timestamp || Date.now() - parsed.timestamp > DASHBOARD_CACHE_TTL_MS) return;
      applyDashboardData(parsed.data);
      setLoading(false);
    } catch {
      /* ignore cache errors */
    }
  }, []);

  const updateExample = (idx: number, field: 'question' | 'answer', value: string) => {
    setIExamples((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const addExample = () => setIExamples((prev) => [...prev, { question: '', answer: '' }]);
  const removeExample = (idx: number) =>
    setIExamples((prev) => prev.filter((_, i) => i !== idx));

  const ensureRazorpayScript = useCallback(async () => {
    if ((window as any).Razorpay) return true;
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
      document.body.appendChild(script);
    });
    return true;
  }, []);

  const fillDefaultResume = () => {
    if (!defaultResumeText.trim()) {
      showFlash('No default resume saved in profile.', 'warning');
      return;
    }
    setIResumeText(defaultResumeText);
  };

  const handleUploadJobDescription = async (file: File | null) => {
    if (!file) return;
    try {
      setJdUploading(true);
      const text = await parseJobDescriptionFile(file);
      setIJobDesc(text);
      showFlash('Job description extracted.', 'success');
    } catch (e: any) {
      console.error(e);
      showFlash(e?.message || 'Failed to extract job description', 'error');
    } finally {
      setJdUploading(false);
    }
  };

  const handleReuseInterview = (interview: SavedInterview) => {
    // Persist the selected interview details so that the schedule page can prepopulate the form.
    try {
      localStorage.setItem('reuseInterview', JSON.stringify(interview));
    } catch {
      /* ignore storage errors */
    }
    // Also update local component state for backwards compatibility (unused in dashboard UI)
    setITitle(interview.title || '');
    setIScheduledAt(
      interview.scheduledAt ? new Date(interview.scheduledAt).toISOString().slice(0, 16) : ''
    );
    setIDuration(interview.durationMinutes || 30);
    setIYears(interview.yearsOfExperience || 0);
    setIJobDesc(interview.jobDescription || '');
    setIResumeText(interview.resumeText || '');
    setIResponseStyle(interview.responseStyle || 'Simple Professional English');
    setIMaxLines(interview.maxLines || 30);
    setIExamples(interview.examples || []);
    // Navigate to the dedicated scheduling page
    onNavigate(AppState.SCHEDULE_INTERVIEW);
  };

  const handleReuseMeeting = (meeting: Meeting) => {
    // Persist the selected meeting so the create-session page can prepopulate the form.
    try {
      localStorage.setItem('reuseMeeting', JSON.stringify(meeting));
    } catch {
      /* ignore storage errors */
    }
    // Keep legacy local state in sync (unused in dashboard UI)
    setMTopic(meeting.technology || '');
    setMScheduledAt(
      meeting.scheduledAt ? new Date(meeting.scheduledAt).toISOString().slice(0, 16) : ''
    );
    setMGuestName(meeting.studentName || meeting.attendeeName || '');
    setMDurationMinutes(Number(meeting.durationMinutes) || 60);
    onNavigate(AppState.CREATE_SESSION);
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const [w, ints, mets, profile, sessions, pricing] = await Promise.all([
        getWallet(),
        listInterviews(),
        listMyMeetings(),
        getProfile().catch(() => ({ resumeText: '' })),
        listCopilotSessions().catch(() => []),
        getCreditPricing().catch(() => null),
      ]);
      const minPurchase =
        pricing && typeof pricing.minCreditPurchase === 'number'
          ? pricing.minCreditPurchase
          : DEFAULT_MIN_CREDIT_PURCHASE;
      applyDashboardData({
        wallet: w,
        interviews: ints || [],
        meetings: mets || [],
        resumeText: profile?.resumeText || '',
        copilotSessions: sessions || [],
        minCreditPurchase: minPurchase,
      });
      try {
        sessionStorage.setItem(
          DASHBOARD_CACHE_KEY,
          JSON.stringify({
            timestamp: Date.now(),
            data: {
              wallet: w,
              interviews: ints || [],
              meetings: mets || [],
              resumeText: profile?.resumeText || '',
              copilotSessions: sessions || [],
              minCreditPurchase: minPurchase,
            },
          })
        );
      } catch {
        /* ignore cache write errors */
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    hydrateFromCache();
    refresh().catch((e) => {
      console.error(e);
      showFlash('Failed to load dashboard data', 'error');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dashboard semantics (requested):
  // - **Expired** = never used / never started.
  // - **Completed** = used at least once (even if ended early).
  //
  // Backend stores usage as `sessionSecondsUsed` (mapped from `totalSessionSeconds`).
  const isInterviewUsed = (i: SavedInterview) => {
    const n = Number((i as any)?.sessionSecondsUsed || 0);
    return Number.isFinite(n) && n > 0;
  };

  const upcomingInterviews = useMemo(() => {
    const now = Date.now();
    return interviews.filter((i) => {
      const status = normalizeStatus(i.status);
      const expiresAt = getInterviewExpiryMs(i);
      const isPast = expiresAt ? expiresAt < now : false;
      const isActive = status === 'IN_PROGRESS';

      // If it has *ever* been used, it belongs in Completed (not Expired/Upcoming).
      if (isInterviewUsed(i) || status === 'COMPLETED') return false;

      // "Expired" is reserved for never-used interviews only.
      if (status === 'EXPIRED' || isPast) return isActive; // allow active sessions even if time passed

      // Otherwise it is upcoming / schedulable.
      return true;
    });
  }, [interviews]);

  const completedInterviews = useMemo(() => {
    return interviews.filter((i) => {
      const status = normalizeStatus(i.status);
      const isActive = status === 'IN_PROGRESS';
      if (isActive) return false;
      return status === 'COMPLETED' || isInterviewUsed(i);
    });
  }, [interviews]);

  // Interviews that have expired (missed or unscheduled). We treat
  // anything in the past that wasn't completed as expired.
  const expiredInterviews = useMemo(() => {
    const now = Date.now();
    return interviews.filter((i) => {
      const status = normalizeStatus(i.status);
      const expiresAt = getInterviewExpiryMs(i);
      const isPast = expiresAt ? expiresAt < now : false;
      const isActive = status === 'IN_PROGRESS';

      // Expired = past the window AND never used.
      if (isActive) return false;
      if (status === 'COMPLETED') return false;
      if (isInterviewUsed(i)) return false;
      return status === 'EXPIRED' || isPast;
    });
  }, [interviews]);

  const upcomingMeetings = useMemo(() => {
    const now = Date.now();
    return meetings.filter((m) => {
      const status = m.status || 'SCHEDULED';
      const expiresAt = getMeetingExpiryMs(m);
      const isPast = expiresAt ? expiresAt < now : false;
      const isActive = status === 'IN_PROGRESS';
      return status !== 'COMPLETED' && status !== 'EXPIRED' && (!isPast || isActive);
    });
  }, [meetings]);

  const completedMeetings = useMemo(() => {
    return meetings.filter((m) => {
      const status = m.status || 'SCHEDULED';
      const isActive = status === 'IN_PROGRESS';

      // For mentor sessions, keep semantics simple:
      // - Completed = actually completed
      // - Expired = missed
      return !isActive && status === 'COMPLETED';
    });
  }, [meetings]);

  // Meetings that are explicitly expired (status === 'EXPIRED') or
  // missed (past with status not completed). These will be shown in
  // the "Expired" tab.
  const expiredMeetings = useMemo(() => {
    const now = Date.now();
    return meetings.filter((m) => {
      const status = m.status || 'SCHEDULED';
      const expiresAt = getMeetingExpiryMs(m);
      const isPast = expiresAt ? expiresAt < now : false;
      const isActive = status === 'IN_PROGRESS';
      return !isActive && status !== 'COMPLETED' && (status === 'EXPIRED' || isPast);
    });
  }, [meetings]);

  const toTimestamp = (value?: string | null) => {
    if (!value) return 0;
    const ts = new Date(value).getTime();
    return Number.isNaN(ts) ? 0 : ts;
  };

  const sortedCompletedInterviews = useMemo(
    () =>
      [...completedInterviews].sort(
        (a, b) => toTimestamp(b.scheduledAt) - toTimestamp(a.scheduledAt)
      ),
    [completedInterviews]
  );

  const sortedCompletedMeetings = useMemo(
    () =>
      [...completedMeetings].sort(
        (a, b) => toTimestamp(b.scheduledAt || b.createdAt) - toTimestamp(a.scheduledAt || a.createdAt)
      ),
    [completedMeetings]
  );

  const sortedCopilotSessions = useMemo(
    () =>
      [...copilotSessions].sort(
        (a, b) =>
          toTimestamp(b.updatedAt || b.createdAt) - toTimestamp(a.updatedAt || a.createdAt)
      ),
    [copilotSessions]
  );

  const sortedExpiredInterviews = useMemo(
    () =>
      [...expiredInterviews].sort(
        (a, b) => toTimestamp(b.scheduledAt) - toTimestamp(a.scheduledAt)
      ),
    [expiredInterviews]
  );

  const sortedExpiredMeetings = useMemo(
    () =>
      [...expiredMeetings].sort(
        (a, b) => toTimestamp(b.scheduledAt || b.createdAt) - toTimestamp(a.scheduledAt || a.createdAt)
      ),
    [expiredMeetings]
  );

  useEffect(() => {
    if (!sortedCompletedInterviews.length) {
      setSelectedCompletedInterviewId('');
      return;
    }
    if (!sortedCompletedInterviews.some((i) => String(i.id) === selectedCompletedInterviewId)) {
      setSelectedCompletedInterviewId(String(sortedCompletedInterviews[0].id));
    }
  }, [sortedCompletedInterviews, selectedCompletedInterviewId]);

  useEffect(() => {
    if (!sortedCompletedMeetings.length) {
      setSelectedCompletedMeetingId('');
      return;
    }
    if (!sortedCompletedMeetings.some((m) => String(m.id) === selectedCompletedMeetingId)) {
      setSelectedCompletedMeetingId(String(sortedCompletedMeetings[0].id));
    }
  }, [sortedCompletedMeetings, selectedCompletedMeetingId]);

  useEffect(() => {
    if (!sortedCopilotSessions.length) {
      setSelectedCompletedCopilotId('');
      return;
    }
    if (!sortedCopilotSessions.some((s: any) => String(s._id || s.id) === selectedCompletedCopilotId)) {
      setSelectedCompletedCopilotId(String(sortedCopilotSessions[0]._id || sortedCopilotSessions[0].id));
    }
  }, [sortedCopilotSessions, selectedCompletedCopilotId]);

  useEffect(() => {
    if (!sortedExpiredInterviews.length) {
      setSelectedExpiredInterviewId('');
      return;
    }
    if (!sortedExpiredInterviews.some((i) => String(i.id) === selectedExpiredInterviewId)) {
      setSelectedExpiredInterviewId(String(sortedExpiredInterviews[0].id));
    }
  }, [sortedExpiredInterviews, selectedExpiredInterviewId]);

  useEffect(() => {
    if (!sortedExpiredMeetings.length) {
      setSelectedExpiredMeetingId('');
      return;
    }
    if (!sortedExpiredMeetings.some((m) => String(m.id) === selectedExpiredMeetingId)) {
      setSelectedExpiredMeetingId(String(sortedExpiredMeetings[0].id));
    }
  }, [sortedExpiredMeetings, selectedExpiredMeetingId]);

  // Aggregate stats for quick overview. These values feed into the
  // stats cards and graphs shown in the dashboard. Keeping them in
  // a single memo prevents unnecessary recalculation.
  const stats = useMemo(() => {
    const aiUpcoming = upcomingInterviews.length;
    const mentorUpcoming = upcomingMeetings.length;
    const aiCompleted = interviews.filter(
      (i) => normalizeStatus(i.status) === 'COMPLETED' || isInterviewUsed(i)
    ).length;
    const mentorCompleted = meetings.filter((m) => (m.status || 'SCHEDULED') === 'COMPLETED').length;
    const aiExpired = expiredInterviews.length;
    const mentorExpired = expiredMeetings.length;
    const total = aiUpcoming + mentorUpcoming + aiCompleted + mentorCompleted + aiExpired + mentorExpired || 1;
    const pct = (value: number) => Math.round((value / total) * 100);
    return {
      upcoming: aiUpcoming + mentorUpcoming,
      completed: aiCompleted + mentorCompleted,
      expired: aiExpired + mentorExpired,
      ai: { upcoming: aiUpcoming, completed: aiCompleted, expired: aiExpired },
      mentor: { upcoming: mentorUpcoming, completed: mentorCompleted, expired: mentorExpired },
      pct: {
        aiUpcoming: pct(aiUpcoming),
        mentorUpcoming: pct(mentorUpcoming),
        aiCompleted: pct(aiCompleted),
        mentorCompleted: pct(mentorCompleted),
        aiExpired: pct(aiExpired),
        mentorExpired: pct(mentorExpired),
      },
    };
  }, [upcomingInterviews, upcomingMeetings, expiredInterviews, expiredMeetings, interviews, meetings]);

  // Top navigation items for the dashboard. Each item sets the
  // activeTab accordingly when clicked. These keys match the values
  // used for activeTab and are passed to AppShell for highlighting.
  const navItems = [
    { key: 'overview', label: 'Overview', onClick: () => setActiveTab('overview') },
    // Navigate to dedicated scheduling page
    { key: 'schedule', label: 'Schedule AI Interview', onClick: () => onNavigate(AppState.SCHEDULE_INTERVIEW) },
    // Navigate to dedicated creation page
    { key: 'create', label: 'Create Mentor Session', onClick: () => onNavigate(AppState.CREATE_SESSION) },
    // Navigate to unified credits page
    { key: 'credits', label: 'Credits', onClick: () => onNavigate(AppState.BUY_AI_CREDITS) },
    { key: 'payments', label: 'Payments', onClick: () => onNavigate(AppState.PAYMENT_HISTORY) },
    { key: 'stealth-console', label: 'Stealth Console', onClick: () => onNavigate(AppState.COPILOT_CONSOLE) },
    { key: 'upcoming', label: 'Upcoming', onClick: () => setActiveTab('upcoming') },
    { key: 'completed', label: 'Completed', onClick: () => setActiveTab('completed') },
    { key: 'expired', label: 'Expired', onClick: () => setActiveTab('expired') },
  ];

  const handleCreateInterview = async () => {
    try {
      if (!iTitle.trim()) {
        showFlash('Please enter an interview title', 'error');
        return;
      }
      if (!iScheduledAt) {
        showFlash('Please pick a date/time for the interview', 'error');
        return;
      }
      if (!iJobDesc.trim()) {
        showFlash('Job description is required', 'error');
        return;
      }
      if (!iResumeText.trim()) {
        showFlash('Resume text is required', 'error');
        return;
      }
      const when = new Date(iScheduledAt);
      if (Number.isNaN(when.getTime())) {
        showFlash('Please pick a valid date/time', 'error');
        return;
      }
      if (when.getTime() <= Date.now()) {
        showFlash('Schedule must be in the future', 'error');
        return;
      }
      if (Number(iDuration) < 10 || Number(iDuration) > 120) {
        showFlash('Duration must be between 10 and 120 minutes', 'error');
        return;
      }
      const created = await createInterview({
        title: iTitle.trim(),
        scheduledAt: when.toISOString(),
        durationMinutes: Number(iDuration) || 30,
        experienceYears: Number(iYears) || 0,
        jobDescription: iJobDesc,
        resumeText: iResumeText,
        responseStyle: iResponseStyle.trim() || 'Simple Professional English',
        maxLines: Number(iMaxLines) || 30,
        examples: iExamples.filter((ex) => ex.question.trim() || ex.answer.trim()),
      });
      showFlash('Interview scheduled (1 AI credit used).', 'success');
      setITitle('');
      setIJobDesc('');
      setIResumeText('');
      setIResponseStyle('Simple Professional English');
      setIMaxLines(30);
      setIExamples([]);
      await refresh();
      // If you want to start immediately:
      // handleStartInterview(created);
    } catch (e: any) {
      showFlash(e?.message || 'Failed to create interview', 'error');
    }
  };

  const handleStartInterview = (interview: SavedInterview) => {
    const prefs: UserPreferences = {
      resumeText: interview.resumeText || '',
      jobDescription: interview.jobDescription || '',
      responseStyle: interview.responseStyle || 'Simple Professional English',
      maxLines: interview.maxLines || 30,
      examples: interview.examples || [],
      aiProvider: aiProvider || 'OPENAI',
      yearsOfExperience: interview.yearsOfExperience || 0,
      // interviewId is typed as number in legacy UI; backend uses string.
      interviewId: (interview.id as any) || 0,
      durationMinutes: interview.durationMinutes || 30,
      sessionSecondsUsed: interview.sessionSecondsUsed || 0,
      scheduledAt: interview.scheduledAt,
    };
    onStartSession(prefs);
  };

  const handleDownloadInterview = async (interview: SavedInterview) => {
    try {
      const answers = await getInterviewAnswers(interview.id);
      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text(`Interview Transcript: ${interview.title}`, 10, 15);
      doc.setFontSize(11);
      let y = 25;
      const addLine = (text: string) => {
        const lines = doc.splitTextToSize(text, 180);
        for (const l of lines) {
          if (y > 280) {
            doc.addPage();
            y = 15;
          }
          doc.text(l, 10, y);
          y += 6;
        }
      };
      addLine(`Scheduled: ${fmt(interview.scheduledAt)}`);
      addLine('');
      answers.forEach((a, idx) => {
        addLine(`${idx + 1}. Q: ${a.questionContext}`);
        addLine(`   A: ${a.answer}`);
        addLine('');
      });
      doc.save(`interview_${interview.id}.pdf`);
    } catch (e: any) {
      showFlash(e?.message || 'Failed to download transcript', 'error');
    }
  };

  const handleCreateMeeting = async () => {
    try {
      if (!mTopic.trim()) {
        showFlash('Please enter a session topic', 'error');
        return;
      }
      if (!mScheduledAt) {
        showFlash('Please pick a date/time for the session', 'error');
        return;
      }
      const when = new Date(mScheduledAt);
      if (Number.isNaN(when.getTime())) {
        showFlash('Please pick a valid date/time', 'error');
        return;
      }
      if (when.getTime() <= Date.now()) {
        showFlash('Session must be scheduled in the future', 'error');
        return;
      }
      if (mDurationMinutes < 10 || mDurationMinutes > 120) {
        showFlash('Duration must be between 10 and 120 minutes', 'error');
        return;
      }
      const meeting = await createMeeting({
        technology: mTopic.trim(),
        scheduledAt: when.toISOString(),
        studentName: mGuestName.trim(),
        durationMinutes: mDurationMinutes,
      });
      showFlash('Session created (1 Mentor credit used). Share the key with another user.', 'success');
      setMTopic('');
      setMScheduledAt('');
      setMGuestName('');
      setMDurationMinutes(60);
      await refresh();
      try {
        await navigator.clipboard.writeText(meeting.meetingKey);
      } catch {
        // ignore clipboard errors
      }
    } catch (e: any) {
      showFlash(e?.message || 'Failed to create session', 'error');
    }
  };

  const handleJoinMeeting = async () => {
    try {
      if (!joinKey.trim()) {
        showFlash('Please enter a session key', 'error');
        return;
      }
      const meeting = await joinMeeting(joinKey.trim());
      setJoinKey('');
      onOpenMeeting(meeting);
    } catch (e: any) {
      showFlash(e?.message || 'Failed to join session', 'error');
    }
  };

  const handleDownloadMeeting = async (meeting: Meeting) => {
    try {
      const transcript = await getMeetingTranscript(meeting.id);
      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text(`Session Transcript: ${meeting.technology}`, 10, 15);
      doc.setFontSize(11);
      const text = transcript || '(No transcript available)';
      const lines = doc.splitTextToSize(text, 180);
      let y = 25;
      lines.forEach((line: string) => {
        if (y > 280) {
          doc.addPage();
          y = 15;
        }
        doc.text(line, 10, y);
        y += 6;
      });
      doc.save(`session_${meeting.id}.pdf`);
    } catch (e: any) {
      showFlash(e?.message || 'Failed to download transcript', 'error');
    }
  };

  const downloadCsv = (filename: string, rows: string[][]) => {
    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const normalizeSummaryList = (value: any) => {
    if (Array.isArray(value)) return value.filter(Boolean).map((item) => String(item));
    if (typeof value === 'string') {
      return value
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  };

  const coerceSummaryData = (value: any) => {
    if (!value) return null;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return { summary: value };
      }
    }
    return value;
  };

  const resolveSummary = (
    entry: SummaryEntry | undefined,
    fallbackText: string,
    fallbackData: any,
    fallbackTopics: string[]
  ) => {
    const text = entry?.text || fallbackText || '';
    const data = coerceSummaryData(entry?.data || fallbackData);
    const topics = entry?.topics?.length ? entry.topics : fallbackTopics || [];
    const normalizedTopics = topics.length ? topics : normalizeSummaryList(data?.topics);
    return {
      text,
      topics: normalizedTopics,
      nextSteps: normalizeSummaryList(data?.next_steps || data?.nextSteps),
    };
  };

  const renderSummaryBlock = (summary: ReturnType<typeof resolveSummary>) => {
    const hasSummary = Boolean(
      summary.text ||
        summary.topics.length ||
        summary.nextSteps.length
    );

    const renderList = (label: string, items: string[]) => {
      if (!items.length) return null;
      return (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-700">
            {items.map((item, idx) => (
              <li key={`${label}-${idx}`}>{item}</li>
            ))}
          </ul>
        </div>
      );
    };

    if (!hasSummary) {
      return (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-500">
          Summary not available yet.
        </div>
      );
    }

    return (
      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm">
        {summary.text && (
          <div className="mb-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Summary</div>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {summary.text}
            </p>
          </div>
        )}
        <div className="space-y-4">
          {renderList('Questions Asked', summary.topics)}
          {renderList('Next Steps', summary.nextSteps)}
        </div>
      </div>
    );
  };

  const downloadSummaryPdf = (
    title: string,
    filename: string,
    summary: ReturnType<typeof resolveSummary>
  ) => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 40;
    const maxWidth = pageWidth - marginX * 2;
    let y = 50;

    const ensureSpace = (needed = 0) => {
      if (y + needed <= pageHeight - 40) return;
      doc.addPage();
      y = 50;
    };

    const addTitle = () => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(title, marginX, y);
      y += 12;
      doc.setDrawColor(220);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 18;
    };

    const addSectionHeader = (label: string) => {
      ensureSpace(20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(label, marginX, y);
      y += 16;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
    };

    const addParagraph = (text: string) => {
      if (!text) return;
      const lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach((line: string) => {
        ensureSpace(14);
        doc.text(line, marginX, y);
        y += 14;
      });
      y += 6;
    };

    const addBullets = (items: string[]) => {
      if (!items.length) return;
      items.forEach((item) => {
        const lines = doc.splitTextToSize(item, maxWidth - 14);
        if (!lines.length) return;
        ensureSpace(14);
        doc.text('-', marginX, y);
        doc.text(lines[0], marginX + 12, y);
        y += 14;
        for (let i = 1; i < lines.length; i += 1) {
          ensureSpace(14);
          doc.text(lines[i], marginX + 12, y);
          y += 14;
        }
      });
      y += 6;
    };

    addTitle();
    if (summary.text) {
      addSectionHeader('Summary');
      addParagraph(summary.text);
    }
    if (summary.topics.length) {
      addSectionHeader('Questions Asked');
      addBullets(summary.topics);
    }
    if (summary.nextSteps.length) {
      addSectionHeader('Next Steps');
      addBullets(summary.nextSteps);
    }
    doc.save(filename);
  };

  const downloadSummaryCsv = (
    filename: string,
    summary: ReturnType<typeof resolveSummary>
  ) => {
    const rows: string[][] = [['Section', 'Item']];
    if (summary.text) rows.push(['Summary', summary.text]);
    summary.topics.forEach((item) => rows.push(['Topic', item]));
    summary.strengths.forEach((item) => rows.push(['Strength', item]));
    summary.gaps.forEach((item) => rows.push(['Gap', item]));
    summary.nextSteps.forEach((item) => rows.push(['Next step', item]));
    downloadCsv(filename, rows);
  };

  const handleDownloadInterviewCsv = async (interview: SavedInterview) => {
    try {
      const answers = await getInterviewAnswers(interview.id);
      const rows = [['Question', 'Answer', 'Timestamp']];
      answers.forEach((a) => {
        rows.push([a.questionContext || '', a.answer || '', a.timestamp || '']);
      });
      downloadCsv(`interview_${interview.id}.csv`, rows);
    } catch (e: any) {
      showFlash(e?.message || 'Failed to export CSV', 'error');
    }
  };

  const handleDownloadMeetingCsv = async (meeting: Meeting) => {
    try {
      const transcript = await getMeetingTranscript(meeting.id);
      const lines = (transcript || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      const rows = [['Line'], ...lines.map((line) => [line])];
      downloadCsv(`session_${meeting.id}.csv`, rows);
    } catch (e: any) {
      showFlash(e?.message || 'Failed to export CSV', 'error');
    }
  };

  const handleInterviewSummary = async (interview: SavedInterview) => {
    const id = String(interview.id);
    if (summaryLoadingId) return;
    setSummaryLoadingId(id);
    try {
      const provider = (aiProvider || 'OPENAI') as AIProvider;
      const response = await generateInterviewSummary(interview.id, provider);
      const topics = response.summaryTopics || response.summaryData?.topics || [];
      setInterviewSummaries((prev) => ({
        ...prev,
        [id]: {
          text: response.summaryText || 'Summary unavailable.',
          topics,
          data: response.summaryData,
        },
      }));
    } catch (e: any) {
      showFlash(e?.message || 'Failed to generate summary', 'error');
    } finally {
      setSummaryLoadingId(null);
    }
  };

  const handleMeetingSummary = async (meeting: Meeting) => {
    const id = String(meeting.id);
    if (meetingSummaryLoadingId) return;
    setMeetingSummaryLoadingId(id);
    try {
      const provider = (aiProvider || 'OPENAI') as AIProvider;
      const response = await generateMeetingSummary(meeting.id, provider);
      const topics = response.summaryTopics || response.summaryData?.topics || [];
      setMeetingSummaries((prev) => ({
        ...prev,
        [id]: {
          text: response.summaryText || 'Summary unavailable.',
          topics,
          data: response.summaryData,
        },
      }));
    } catch (e: any) {
      showFlash(e?.message || 'Failed to generate summary', 'error');
    } finally {
      setMeetingSummaryLoadingId(null);
    }
  };

  const handleCopilotSummary = async (session: any) => {
    const id = String(session?._id || session?.id || '');
    if (!id || copilotSummaryLoadingId) return;
    setCopilotSummaryLoadingId(id);
    try {
      const provider = (aiProvider || 'OPENAI') as AIProvider;
      const response = await generateCopilotSummary(id, provider);
      const topics = response.summaryTopics || response.summaryData?.topics || [];
      setCopilotSummaries((prev) => ({
        ...prev,
        [id]: {
          text: response.summaryText || 'Summary unavailable.',
          topics,
          data: response.summaryData,
        },
      }));
    } catch (e: any) {
      showFlash(e?.message || 'Failed to generate summary', 'error');
    } finally {
      setCopilotSummaryLoadingId(null);
    }
  };

  const getInterviewSummaryDetails = (interview: SavedInterview) =>
    resolveSummary(
      interviewSummaries[String(interview.id)],
      interview.summaryText || '',
      interview.summaryData,
      interview.summaryTopics || []
    );

  const getMeetingSummaryDetails = (meetingItem: Meeting) =>
    resolveSummary(
      meetingSummaries[String(meetingItem.id)],
      meetingItem.summaryText || '',
      meetingItem.summaryData,
      meetingItem.summaryTopics || []
    );

  const getCopilotSummaryDetails = (session: any) => {
    const id = String(session?._id || session?.id || '');
    const sessionTopics = Array.isArray(session?.topics)
      ? session.topics.map((t: any) => t?.text || '').filter(Boolean)
      : [];
    return resolveSummary(
      copilotSummaries[id],
      session?.summaryText || '',
      session?.summaryData,
      sessionTopics
    );
  };

  const handleDownloadInterviewSummaryPdf = (interview: SavedInterview) => {
    const summary = getInterviewSummaryDetails(interview);
    if (!summary.text && !summary.topics.length && !summary.strengths.length && !summary.gaps.length && !summary.nextSteps.length) {
      showFlash('Summary not available yet.', 'warning');
      return;
    }
    downloadSummaryPdf(
      `Interview Summary: ${interview.title || 'Session'}`,
      `interview_${interview.id}_summary.pdf`,
      summary
    );
  };

  const handleDownloadInterviewSummaryCsv = (interview: SavedInterview) => {
    const summary = getInterviewSummaryDetails(interview);
    if (!summary.text && !summary.topics.length && !summary.strengths.length && !summary.gaps.length && !summary.nextSteps.length) {
      showFlash('Summary not available yet.', 'warning');
      return;
    }
    downloadSummaryCsv(`interview_${interview.id}_summary.csv`, summary);
  };

  const handleDownloadMeetingSummaryPdf = (meetingItem: Meeting) => {
    const summary = getMeetingSummaryDetails(meetingItem);
    if (!summary.text && !summary.topics.length && !summary.strengths.length && !summary.gaps.length && !summary.nextSteps.length) {
      showFlash('Summary not available yet.', 'warning');
      return;
    }
    downloadSummaryPdf(
      `Session Summary: ${meetingItem.technology || 'Mentor Session'}`,
      `session_${meetingItem.id}_summary.pdf`,
      summary
    );
  };

  const handleDownloadMeetingSummaryCsv = (meetingItem: Meeting) => {
    const summary = getMeetingSummaryDetails(meetingItem);
    if (!summary.text && !summary.topics.length && !summary.strengths.length && !summary.gaps.length && !summary.nextSteps.length) {
      showFlash('Summary not available yet.', 'warning');
      return;
    }
    downloadSummaryCsv(`session_${meetingItem.id}_summary.csv`, summary);
  };

  const handleDownloadCopilotSummaryPdf = (session: any) => {
    const summary = getCopilotSummaryDetails(session);
    if (!summary.text && !summary.topics.length && !summary.strengths.length && !summary.gaps.length && !summary.nextSteps.length) {
      showFlash('Summary not available yet.', 'warning');
      return;
    }
    const title = session?.title || 'Copilot Session';
    const id = session?._id || session?.id || 'session';
    downloadSummaryPdf(`Copilot Summary: ${title}`, `copilot_${id}_summary.pdf`, summary);
  };

  const handleDownloadCopilotSummaryCsv = (session: any) => {
    const summary = getCopilotSummaryDetails(session);
    if (!summary.text && !summary.topics.length && !summary.strengths.length && !summary.gaps.length && !summary.nextSteps.length) {
      showFlash('Summary not available yet.', 'warning');
      return;
    }
    const id = session?._id || session?.id || 'session';
    downloadSummaryCsv(`copilot_${id}_summary.csv`, summary);
  };

  const formatCopilotStatus = (status: string) => {
    const value = String(status || '').toUpperCase();
    if (value === 'ENDED') return 'Ended';
    if (value === 'ACTIVE') return 'Active';
    if (value === 'DRAFT') return 'Draft';
    return value || 'Unknown';
  };

  const openCopilotSession = (session: any) => {
    const sid = session?._id || session?.id;
    if (!sid) return;
    const jc = session?.joinCode || session?.join_code || '';
    const url = jc
      ? `/console?sessionId=${encodeURIComponent(sid)}&joinCode=${encodeURIComponent(jc)}`
      : `/console?sessionId=${encodeURIComponent(sid)}`;
    window.location.assign(url);
  };

  const handleDeleteCopilotSession = async (session: any) => {
    const id = String(session?._id || session?.id || '');
    if (!id) return;
    setConfirmDialog({
      message: 'Delete this session and its stored transcript/summary?',
      onConfirm: async () => {
        try {
          setDeletingSessionId(id);
          await deleteCopilotSession(id);
          setCopilotSessions((prev) => prev.filter((s) => String(s?._id || s?.id) !== id));
          showFlash('Session removed.', 'success');
        } catch (e: any) {
          console.error(e);
          showFlash(e?.message || 'Failed to delete session', 'error');
        } finally {
          setDeletingSessionId(null);
        }
      }
    });
  };

  const handleDeleteInterview = async (interview: SavedInterview) => {
    const id = String(interview?.id || '');
    if (!id) return;
    setConfirmDialog({
      message: 'Delete this interview and its stored answers/summary?',
      onConfirm: async () => {
        try {
          setDeletingInterviewId(id);
          await deleteInterview(id);
          setInterviews((prev) => prev.filter((item) => String(item.id) !== id));
          setInterviewSummaries((prev) => {
            if (!prev[id]) return prev;
            const next = { ...prev };
            delete next[id];
            return next;
          });
          setExpandedHistory((prev) => {
            const key = `completed-interview-${id}`;
            const key2 = `expired-interview-${id}`;
            if (!prev[key] && !prev[key2]) return prev;
            const next = { ...prev };
            delete next[key];
            delete next[key2];
            return next;
          });
          showFlash('Interview deleted.', 'success');
        } catch (e: any) {
          console.error(e);
          showFlash(e?.message || 'Failed to delete interview', 'error');
        } finally {
          setDeletingInterviewId(null);
        }
      }
    });
  };

  const canDeleteMeeting = (meeting: Meeting) => {
    const uid = String(currentUser?.id || '');
    const isAdmin = currentUser?.role === 'admin';
    const isHost = uid && String(meeting.mentorId || '') === uid;
    return Boolean(isAdmin || isHost);
  };

  const handleDeleteMeeting = async (meeting: Meeting) => {
    const id = String(meeting?.id || '');
    if (!id) return;
    if (!canDeleteMeeting(meeting)) {
      showFlash('Only the session host can delete this mentor session.', 'warning');
      return;
    }
    setConfirmDialog({
      message: 'Delete this mentor session and its stored transcript/summary?',
      onConfirm: async () => {
        try {
          setDeletingMeetingId(id);
          await deleteMeeting(id);
          setMeetings((prev) => prev.filter((item) => String(item.id) !== id));
          setMeetingSummaries((prev) => {
            if (!prev[id]) return prev;
            const next = { ...prev };
            delete next[id];
            return next;
          });
          setExpandedHistory((prev) => {
            const key = `completed-meeting-${id}`;
            const key2 = `expired-meeting-${id}`;
            if (!prev[key] && !prev[key2]) return prev;
            const next = { ...prev };
            delete next[key];
            delete next[key2];
            return next;
          });
          showFlash('Mentor session deleted.', 'success');
        } catch (e: any) {
          console.error(e);
          showFlash(e?.message || 'Failed to delete mentor session', 'error');
        } finally {
          setDeletingMeetingId(null);
        }
      }
    });
  };

  const selectedCompletedInterview =
    sortedCompletedInterviews.find((i) => String(i.id) === selectedCompletedInterviewId) ||
    sortedCompletedInterviews[0] ||
    null;
  const selectedCompletedMeeting =
    sortedCompletedMeetings.find((m) => String(m.id) === selectedCompletedMeetingId) ||
    sortedCompletedMeetings[0] ||
    null;
  const selectedCompletedCopilot =
    sortedCopilotSessions.find((s: any) => String(s._id || s.id) === selectedCompletedCopilotId) ||
    sortedCopilotSessions[0] ||
    null;
  const selectedExpiredInterview =
    sortedExpiredInterviews.find((i) => String(i.id) === selectedExpiredInterviewId) ||
    sortedExpiredInterviews[0] ||
    null;
  const selectedExpiredMeeting =
    sortedExpiredMeetings.find((m) => String(m.id) === selectedExpiredMeetingId) ||
    sortedExpiredMeetings[0] ||
    null;

  const handlePurchase = async (creditType: 'aiInterviewCredits' | 'mentorSessionCredits', quantity: number) => {
    const normalized = creditType === 'aiInterviewCredits' ? 'AI' : 'MENTOR';
    const minPurchase = Number.isFinite(minCreditPurchase)
      ? minCreditPurchase
      : DEFAULT_MIN_CREDIT_PURCHASE;
    if (quantity < minPurchase) {
      showFlash(`Minimum purchase is ${minPurchase} ${normalized} credits.`, 'warning');
      return;
    }
    try {
      setPaying(true);
      await ensureRazorpayScript();
      const { order, keyId } = await createRazorpayOrder({ creditType: normalized, quantity });

      const rzp = new (window as any).Razorpay({
        key: keyId,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        name: 'Buuzzer',
        description: `${quantity} ${normalized === 'AI' ? 'AI' : 'Mentor'} credit(s)`,
        prefill: {
          email: currentUser.email || '',
          name: currentUser.name || '',
          contact: '',
        },
        handler: async (resp: any) => {
          try {
            const w = await verifyRazorpayPayment({
              orderId: resp.razorpay_order_id,
              paymentId: resp.razorpay_payment_id,
              signature: resp.razorpay_signature,
            });
            setWallet(w);
            showFlash('Payment successful. Credits added.', 'success');
          } catch (err: any) {
            showFlash(err?.message || 'Payment verification failed', 'error');
          }
        },
        modal: {
          ondismiss: () => {
            showFlash('Payment cancelled.', 'warning');
          },
        },
        theme: { color: '#0f172a' },
      });

      rzp.open();
    } catch (e: any) {
      console.error(e);
      // Fallback to direct purchase endpoint if Razorpay is not configured.
      if (/razorpay/i.test(String(e?.message || ''))) {
        try {
          const w = await purchaseCredits({ creditType, quantity });
          setWallet(w);
          showFlash('Credits added (fallback).', 'success');
        } catch (err: any) {
          showFlash(err?.message || 'Purchase failed', 'error');
        }
      } else {
        showFlash(e?.message || 'Payment failed', 'error');
      }
    } finally {
      setPaying(false);
    }
  };

  return (
    <>
    <AppShell
      currentUser={currentUser}
      title={`${currentUser.name || 'User'} Dashboard`}
      subtitle={`User ID: ${currentUser.loginId || ''}${currentUser.email ? ` | ${currentUser.email}` : ''}`}
      activeKey={activeTab as any}
      onNavigate={onNavigate}
      onLogout={onLogout}
      navMode="top"
      customNavItems={navItems}
      /* Apply the admin gradient styles to unify the look and feel across
         user and admin dashboards. The header uses a blue gradient
         identical to the admin interface, and text colors are adjusted
         for dark backgrounds. The content width is widened to match
         the admin layout. */
      headerClassName="border-transparent bg-gradient-to-r from-sky-700 via-blue-600 to-sky-600 text-white"
      titleClassName="text-white"
      subtitleClassName="text-white/70"
      contentClassName="max-w-[1400px]"
      rightSlot={
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-green-100 px-3 py-2 text-green-900">
            <FiCpu className="h-4 w-4" />
            <span className="font-semibold">{wallet.aiInterviewCredits}</span>
            <span className="text-xs">AI Credits</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-blue-100 px-3 py-2 text-blue-900">
            <FiUsers className="h-4 w-4" />
            <span className="font-semibold">{wallet.mentorSessionCredits}</span>
            <span className="text-xs">Mentor Credits</span>
          </div>
        </div>
      }
    >
      {loading ? (
        <div className="p-6 text-sm text-gray-600">Loading...</div>
      ) : (
        <div className="space-y-6">
          {/* Sessions overview with quick join and stats */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <div className="text-sm font-semibold">Quick Join</div>
                  <div className="mt-2 text-sm text-gray-600">Join a session using a key.</div>
                  <div className="mt-3 flex gap-2">
                    <input
                      value={joinKey}
                      onChange={(e) => setJoinKey(e.target.value)}
                      placeholder="Enter session key"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    />
                    <Button onClick={handleJoinMeeting}>Join</Button>
                  </div>
                </Card>
                <Card>
                  <div className="text-sm font-semibold">Stats</div>
                  <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                    {[
                      { label: 'Upcoming', ai: stats.ai.upcoming, mentor: stats.mentor.upcoming },
                      { label: 'Completed', ai: stats.ai.completed, mentor: stats.mentor.completed },
                      { label: 'Expired', ai: stats.ai.expired, mentor: stats.mentor.expired },
                    ].map((row) => {
                      const total = row.ai + row.mentor || 1;
                      const aiPct = Math.round((row.ai / total) * 100);
                      const mentorPct = 100 - aiPct;
                      return (
                      <div key={row.label} className="rounded-xl bg-slate-100 p-3 space-y-2">
                        <div className="text-xs text-gray-500">{row.label}</div>
                        <div className="flex items-center justify-center gap-2 text-sm text-slate-700">
                          <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-1 text-sky-700">
                            AI {row.ai}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-1 text-indigo-700">
                            Mentor {row.mentor}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full bg-sky-500"
                            style={{ width: `${aiPct}%` }}
                            aria-hidden
                          />
                          <div
                            className="h-full bg-indigo-500"
                            style={{ width: `${mentorPct}%` }}
                            aria-hidden
                          />
                        </div>
                      </div>
                    );
                    })}
                  </div>
                </Card>
                <Card>
                  <div className="text-sm font-semibold">Your User ID</div>
                  <div className="mt-2 text-sm text-gray-600">Share this ID if needed.</div>
                  <div className="mt-3 flex items-center gap-2">
                    <code className="rounded-xl bg-gray-100 px-3 py-2 text-sm">
                      {currentUser.loginId}
                    </code>
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(String(currentUser.loginId || ''));
                          showFlash('User ID copied.', 'success');
                        } catch {
                          showFlash('Could not copy User ID', 'error');
                        }
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </Card>
              </div>
              {/* Upcoming sessions list */}
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <div className="text-base font-semibold">Upcoming AI Interviews</div>
                  <div className="mt-3 space-y-2">
                    {upcomingInterviews.length === 0 ? (
                      <div className="text-sm text-gray-600">No upcoming interviews.</div>
                    ) : (
                      upcomingInterviews.map((i) => (
                        <div key={String(i.id)} className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 p-3">
                          <div>
                            <div className="font-medium">{i.title}</div>
                            <div className="text-xs text-gray-600">{fmt(i.scheduledAt)} | {i.durationMinutes} min | {normalizeStatus(i.status)}</div>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={() => handleStartInterview(i)}>Start</Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
                <Card>
                  <div className="text-base font-semibold">Upcoming Mentor Sessions</div>
                  <div className="mt-3 space-y-2">
                    {upcomingMeetings.length === 0 ? (
                      <div className="text-sm text-gray-600">No upcoming sessions.</div>
                    ) : (
                      upcomingMeetings.map((m) => (
                        <div key={String(m.id)} className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 p-3">
                          <div>
                            <div className="font-medium">{m.technology}</div>
                            <div className="text-xs text-gray-600">{fmt(m.scheduledAt)} | {m.status}</div>
                            <div className="text-xs text-gray-500">Key: <code>{m.meetingKey}</code></div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button onClick={() => onOpenMeeting(m)}>Open</Button>
                            <Button
                              variant="secondary"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(m.meetingKey);
                                  showFlash('Session key copied.', 'success');
                                } catch {
                                  showFlash('Could not copy session key', 'error');
                                }
                              }}
                            >
                              Copy Key
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>

              {/* Quick onboarding / step-by-step guide (requested) */}
              <UserDashboardGuide onNavigate={onNavigate} />
            </div>
          )}

          {/* Scheduling and creation forms are handled on dedicated pages (ScheduleInterviewPage and CreateSessionPage). */}

          {/* Upcoming tab */}
          {activeTab === 'upcoming' && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <div className="text-base font-semibold">Upcoming AI Interviews</div>
                <div className="mt-3 space-y-2">
                  {upcomingInterviews.length === 0 ? (
                    <div className="text-sm text-gray-600">No upcoming interviews.</div>
                  ) : (
                    upcomingInterviews.map((i) => (
                      <div key={String(i.id)} className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 p-3">
                        <div>
                          <div className="font-medium">{i.title}</div>
                          <div className="text-xs text-gray-600">{fmt(i.scheduledAt)} | {i.durationMinutes} min | {normalizeStatus(i.status)}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => handleStartInterview(i)}>Start</Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
              <Card>
                <div className="text-base font-semibold">Upcoming Mentor Sessions</div>
                <div className="mt-3 space-y-2">
                  {upcomingMeetings.length === 0 ? (
                    <div className="text-sm text-gray-600">No upcoming sessions.</div>
                  ) : (
                    upcomingMeetings.map((m) => (
                      <div key={String(m.id)} className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 p-3">
                        <div>
                          <div className="font-medium">{m.technology}</div>
                          <div className="text-xs text-gray-600">{fmt(m.scheduledAt)} | {m.status}</div>
                          <div className="text-xs text-gray-500">Key: <code>{m.meetingKey}</code></div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button onClick={() => onOpenMeeting(m)}>Open</Button>
                          <Button
                            variant="secondary"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(m.meetingKey);
                                showFlash('Session key copied.', 'success');
                              } catch {
                                showFlash('Could not copy session key', 'error');
                              }
                            }}
                          >
                            Copy Key
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Completed tab */}
          {activeTab === 'completed' && (
            <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
              <Card className="relative overflow-hidden p-6 shadow-lg">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-400" />
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Completed</div>
                    <div className="text-lg font-semibold text-slate-900">AI Interviews</div>
                  </div>
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                    {sortedCompletedInterviews.length}
                  </span>
                </div>
                {sortedCompletedInterviews.length === 0 ? (
                  <div className="mt-4 text-sm text-slate-500">No completed interviews.</div>
                ) : (
                  <div className="mt-4 space-y-3 max-h-[520px] overflow-auto pr-1">
                    {sortedCompletedInterviews.map((interview) => {
                      const key = `completed-interview-${String(interview.id)}`;
                      const expanded = Boolean(expandedHistory[key]);
                      const deleting = deletingInterviewId === String(interview.id);
                      return (
                        <div
                          key={String(interview.id)}
                          className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="truncate text-sm font-semibold text-slate-900">
                                  {interview.title || 'Interview Session'}
                                </div>
                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                                  {normalizeStatus(interview.status)}
                                </span>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">
                                  {fmt(interview.scheduledAt)}
                                </span>
                                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">
                                  {interview.durationMinutes} min
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                              <Button
                                className="px-3 py-2 text-xs"
                                variant="secondary"
                                onClick={() => handleReuseInterview(interview)}
                              >
                                Reuse
                              </Button>
                              {isOnline ? (
                                <Button
                                  className="px-3 py-2 text-xs"
                                  variant="secondary"
                                  onClick={() => handleDownloadInterview(interview)}
                                >
                                  Download
                                </Button>
                              ) : null}
                              <Button
                                className="px-3 py-2 text-xs"
                                variant="danger"
                                onClick={() => handleDeleteInterview(interview)}
                                disabled={deleting}
                              >
                                {deleting ? 'Deleting...' : 'Delete'}
                              </Button>
                              <Button
                                className="px-3 py-2 text-xs"
                                variant="ghost"
                                onClick={() => toggleHistoryExpanded(key)}
                              >
                                {expanded ? 'View less' : 'View more'}
                              </Button>
                            </div>
                          </div>

                          {expanded && (
                            <>
                              {renderSummaryBlock(getInterviewSummaryDetails(interview))}
                              {isOnline ? (
                                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                                  <Button
                                    className="px-3 py-2 text-xs"
                                    variant="secondary"
                                    fullWidth
                                    onClick={() => handleDownloadInterviewCsv(interview)}
                                  >
                                    CSV
                                  </Button>
                                  <Button
                                    className="px-3 py-2 text-xs"
                                    variant="secondary"
                                    fullWidth
                                    onClick={() => handleInterviewSummary(interview)}
                                    disabled={summaryLoadingId === String(interview.id)}
                                  >
                                    {summaryLoadingId === String(interview.id)
                                      ? 'Summarizing...'
                                      : 'Summary'}
                                  </Button>
                                  <Button
                                    className="px-3 py-2 text-xs"
                                    variant="secondary"
                                    fullWidth
                                    onClick={() => handleDownloadInterviewSummaryPdf(interview)}
                                  >
                                    Summary PDF
                                  </Button>
                                  <Button
                                    className="px-3 py-2 text-xs"
                                    variant="secondary"
                                    fullWidth
                                    onClick={() => handleDownloadInterviewSummaryCsv(interview)}
                                  >
                                    Summary CSV
                                  </Button>
                                </div>
                              ) : (
                                <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-500">
                                  You're offline. Connect to the internet to download transcripts or generate summaries.
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              <Card className="relative overflow-hidden p-6 shadow-lg">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-400" />
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Completed</div>
                    <div className="text-lg font-semibold text-slate-900">Mentor Sessions</div>
                  </div>
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                    {sortedCompletedMeetings.length}
                  </span>
                </div>
                {sortedCompletedMeetings.length === 0 ? (
                  <div className="mt-4 text-sm text-slate-500">No completed sessions.</div>
                ) : (
                  <div className="mt-4 space-y-3 max-h-[520px] overflow-auto pr-1">
                    {sortedCompletedMeetings.map((meeting) => {
                      const key = `completed-meeting-${String(meeting.id)}`;
                      const expanded = Boolean(expandedHistory[key]);
                      const canDelete = canDeleteMeeting(meeting);
                      const deleting = deletingMeetingId === String(meeting.id);
                      return (
                        <div
                          key={String(meeting.id)}
                          className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="truncate text-sm font-semibold text-slate-900">
                                  {meeting.technology || 'Mentor Session'}
                                </div>
                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                                  {meeting.status === 'COMPLETED' ? 'Completed' : meeting.status}
                                </span>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">
                                  {fmt(meeting.scheduledAt)}
                                </span>
                                {meeting.durationMinutes ? (
                                  <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">
                                    {meeting.durationMinutes} min
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                              <Button
                                className="px-3 py-2 text-xs"
                                variant="secondary"
                                onClick={() => handleReuseMeeting(meeting)}
                              >
                                Reuse
                              </Button>
                              {isOnline ? (
                                <Button
                                  className="px-3 py-2 text-xs"
                                  variant="secondary"
                                  onClick={() => handleDownloadMeeting(meeting)}
                                >
                                  Download
                                </Button>
                              ) : null}
                              {canDelete ? (
                                <Button
                                  className="px-3 py-2 text-xs"
                                  variant="danger"
                                  onClick={() => handleDeleteMeeting(meeting)}
                                  disabled={deleting}
                                >
                                  {deleting ? 'Deleting...' : 'Delete'}
                                </Button>
                              ) : null}
                              <Button
                                className="px-3 py-2 text-xs"
                                variant="ghost"
                                onClick={() => toggleHistoryExpanded(key)}
                              >
                                {expanded ? 'View less' : 'View more'}
                              </Button>
                            </div>
                          </div>

                          {expanded && (
                            <>
                              {meeting.meetingKey ? (
                                <div className="mt-3 text-xs text-slate-500">
                                  Key:{' '}
                                  <code className="rounded bg-slate-100 px-2 py-1 font-mono text-slate-700">
                                    {meeting.meetingKey}
                                  </code>
                                </div>
                              ) : null}
                              {renderSummaryBlock(getMeetingSummaryDetails(meeting))}
                              {isOnline ? (
                                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                                  <Button
                                    className="px-3 py-2 text-xs"
                                    variant="secondary"
                                    fullWidth
                                    onClick={() => handleDownloadMeetingCsv(meeting)}
                                  >
                                    CSV
                                  </Button>
                                  <Button
                                    className="px-3 py-2 text-xs"
                                    variant="secondary"
                                    fullWidth
                                    onClick={() => handleMeetingSummary(meeting)}
                                    disabled={meetingSummaryLoadingId === String(meeting.id)}
                                  >
                                    {meetingSummaryLoadingId === String(meeting.id)
                                      ? 'Summarizing...'
                                      : 'Summary'}
                                  </Button>
                                  <Button
                                    className="px-3 py-2 text-xs"
                                    variant="secondary"
                                    fullWidth
                                    onClick={() => handleDownloadMeetingSummaryPdf(meeting)}
                                  >
                                    Summary PDF
                                  </Button>
                                  <Button
                                    className="px-3 py-2 text-xs"
                                    variant="secondary"
                                    fullWidth
                                    onClick={() => handleDownloadMeetingSummaryCsv(meeting)}
                                  >
                                    Summary CSV
                                  </Button>
                                </div>
                              ) : (
                                <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-500">
                                  You're offline. Connect to the internet to download transcripts or generate summaries.
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              <Card className="relative overflow-hidden p-6 shadow-lg">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-rose-400" />
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Completed</div>
                    <div className="text-lg font-semibold text-slate-900">Copilot Sessions</div>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    {sortedCopilotSessions.length}
                  </span>
                </div>
                {sortedCopilotSessions.length === 0 ? (
                  <div className="mt-4 text-sm text-slate-500">No copilot sessions yet.</div>
                ) : (
                  <div className="mt-4 space-y-3 max-h-[520px] overflow-auto pr-1">
                    {sortedCopilotSessions.map((session: any) => {
                      const sid = String(session?._id || session?.id || '');
                      const key = `completed-copilot-${sid}`;
                      const expanded = Boolean(expandedHistory[key]);
                      const deleting = deletingSessionId === sid;
                      return (
                        <div
                          key={sid}
                          className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="truncate text-sm font-semibold text-slate-900">
                                  {session?.title || 'Copilot Session'}
                                </div>
                                <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700">
                                  {formatCopilotStatus(session?.status)}
                                </span>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">
                                  {fmt(session?.createdAt || session?.updatedAt || '')}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                              <Button
                                className="px-3 py-2 text-xs"
                                variant="secondary"
                                onClick={() => openCopilotSession(session)}
                              >
                                Open
                              </Button>
                              <Button
                                className="px-3 py-2 text-xs"
                                variant="danger"
                                onClick={() => handleDeleteCopilotSession(session)}
                                disabled={deleting}
                              >
                                {deleting ? 'Removing...' : 'Delete'}
                              </Button>
                              <Button
                                className="px-3 py-2 text-xs"
                                variant="ghost"
                                onClick={() => toggleHistoryExpanded(key)}
                              >
                                {expanded ? 'View less' : 'View more'}
                              </Button>
                            </div>
                          </div>

                          {expanded && (
                            <>
                              {session?.targetUrl ? (
                                <div className="mt-3 break-words text-xs text-slate-500">{session.targetUrl}</div>
                              ) : null}
                              {renderSummaryBlock(getCopilotSummaryDetails(session))}
                              {isOnline ? (
                                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                                  <Button
                                    className="px-3 py-2 text-xs"
                                    variant="secondary"
                                    fullWidth
                                    onClick={() => handleCopilotSummary(session)}
                                    disabled={copilotSummaryLoadingId === sid}
                                  >
                                    {copilotSummaryLoadingId === sid ? 'Summarizing...' : 'Summary'}
                                  </Button>
                                  <Button
                                    className="px-3 py-2 text-xs"
                                    variant="secondary"
                                    fullWidth
                                    onClick={() => handleDownloadCopilotSummaryPdf(session)}
                                  >
                                    Summary PDF
                                  </Button>
                                  <Button
                                    className="px-3 py-2 text-xs"
                                    variant="secondary"
                                    fullWidth
                                    onClick={() => handleDownloadCopilotSummaryCsv(session)}
                                  >
                                    Summary CSV
                                  </Button>
                                </div>
                              ) : (
                                <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-500">
                                  You're offline. Connect to the internet to generate summaries.
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Expired tab */}
          {activeTab === 'expired' && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="relative overflow-hidden p-6 shadow-lg">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-rose-400 to-red-500" />
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Expired</div>
                    <div className="text-lg font-semibold text-slate-900">AI Interviews</div>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    {sortedExpiredInterviews.length}
                  </span>
                </div>
                {sortedExpiredInterviews.length === 0 ? (
                  <div className="mt-4 text-sm text-slate-500">No expired interviews.</div>
                ) : (
                  <div className="mt-4 space-y-3 max-h-[520px] overflow-auto pr-1">
                    {sortedExpiredInterviews.map((interview) => {
                      const id = String(interview.id);
                      const key = `expired-interview-${id}`;
                      const expanded = Boolean(expandedHistory[key]);
                      const deleting = deletingInterviewId === id;
                      return (
                        <div
                          key={id}
                          className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="truncate text-sm font-semibold text-slate-900">
                                  {interview.title || 'Interview Session'}
                                </div>
                                <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700">
                                  Expired
                                </span>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">
                                  {fmt(interview.scheduledAt)}
                                </span>
                                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">
                                  {interview.durationMinutes} min
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                              <Button
                                className="px-3 py-2 text-xs"
                                variant="secondary"
                                onClick={() => handleReuseInterview(interview)}
                              >
                                Reuse
                              </Button>
                              {isOnline ? (
                                <Button
                                  className="px-3 py-2 text-xs"
                                  variant="secondary"
                                  onClick={() => handleDownloadInterview(interview)}
                                >
                                  Download
                                </Button>
                              ) : null}
                              <Button
                                className="px-3 py-2 text-xs"
                                variant="danger"
                                onClick={() => handleDeleteInterview(interview)}
                                disabled={deleting}
                              >
                                {deleting ? 'Deleting...' : 'Delete'}
                              </Button>
                              <Button
                                className="px-3 py-2 text-xs"
                                variant="ghost"
                                onClick={() => toggleHistoryExpanded(key)}
                              >
                                {expanded ? 'View less' : 'View more'}
                              </Button>
                            </div>
                          </div>

                          {expanded && (
                            <>
                              {isOnline ? (
                                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                                  <Button
                                    className="px-3 py-2 text-xs"
                                    variant="secondary"
                                    fullWidth
                                    onClick={() => handleDownloadInterviewCsv(interview)}
                                  >
                                    CSV
                                  </Button>
                                </div>
                              ) : (
                                <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-500">
                                  You're offline. Connect to the internet to download transcripts.
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              <Card className="relative overflow-hidden p-6 shadow-lg">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400" />
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Expired</div>
                    <div className="text-lg font-semibold text-slate-900">Mentor Sessions</div>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    {sortedExpiredMeetings.length}
                  </span>
                </div>
                {sortedExpiredMeetings.length === 0 ? (
                  <div className="mt-4 text-sm text-slate-500">No expired sessions.</div>
                ) : (
                  <div className="mt-4 space-y-3 max-h-[520px] overflow-auto pr-1">
                    {sortedExpiredMeetings.map((meeting) => {
                      const id = String(meeting.id);
                      const key = `expired-meeting-${id}`;
                      const expanded = Boolean(expandedHistory[key]);
                      const canDelete = canDeleteMeeting(meeting);
                      const deleting = deletingMeetingId === id;
                      return (
                        <div
                          key={id}
                          className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="truncate text-sm font-semibold text-slate-900">
                                  {meeting.technology || 'Mentor Session'}
                                </div>
                                <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700">
                                  Expired
                                </span>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">
                                  {fmt(meeting.scheduledAt)}
                                </span>
                                {meeting.durationMinutes ? (
                                  <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">
                                    {meeting.durationMinutes} min
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                              <Button
                                className="px-3 py-2 text-xs"
                                variant="secondary"
                                onClick={() => handleReuseMeeting(meeting)}
                              >
                                Reuse
                              </Button>
                              {isOnline ? (
                                <Button
                                  className="px-3 py-2 text-xs"
                                  variant="secondary"
                                  onClick={() => handleDownloadMeeting(meeting)}
                                >
                                  Download
                                </Button>
                              ) : null}
                              {canDelete ? (
                                <Button
                                  className="px-3 py-2 text-xs"
                                  variant="danger"
                                  onClick={() => handleDeleteMeeting(meeting)}
                                  disabled={deleting}
                                >
                                  {deleting ? 'Deleting...' : 'Delete'}
                                </Button>
                              ) : null}
                              <Button
                                className="px-3 py-2 text-xs"
                                variant="ghost"
                                onClick={() => toggleHistoryExpanded(key)}
                              >
                                {expanded ? 'View less' : 'View more'}
                              </Button>
                            </div>
                          </div>

                          {expanded && (
                            <>
                              {meeting.meetingKey ? (
                                <div className="mt-3 text-xs text-slate-500">
                                  Key:{' '}
                                  <code className="rounded bg-slate-100 px-2 py-1 font-mono text-slate-700">
                                    {meeting.meetingKey}
                                  </code>
                                </div>
                              ) : null}
                              {isOnline ? (
                                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                                  <Button
                                    className="px-3 py-2 text-xs"
                                    variant="secondary"
                                    fullWidth
                                    onClick={() => handleDownloadMeetingCsv(meeting)}
                                  >
                                    CSV
                                  </Button>
                                </div>
                              ) : (
                                <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-500">
                                  You're offline. Connect to the internet to download transcripts.
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      )}
    </AppShell>

    {confirmDialog && (
      <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Icon name="ExclamationTriangleIcon" size={18} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-slate-900">Please confirm</h3>
              <p className="text-sm text-slate-600">{confirmDialog.message}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button variant="secondary" className="w-full sm:w-auto" onClick={() => setConfirmDialog(null)}>
              Cancel
            </Button>
            <Button
              className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
              onClick={async () => {
                try {
                  await confirmDialog.onConfirm();
                } finally {
                  setConfirmDialog(null);
                }
              }}
            >
              Yes, proceed
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
