import React, { useState, useEffect } from 'react';
import AppShell from './layout/AppShell';
import { Card } from './Card';
import { Button } from './Button';
import { useFlash } from './FlashMessage';
import { createMeeting, getWallet } from '../services/backendApi';
import { User, Wallet, AIProvider, AppState } from '../types';
import { FiCpu, FiUsers, FiCalendar, FiClock, FiUser, FiMessageSquare, FiShare2 } from 'react-icons/fi';

interface Props {
  currentUser: User;
  aiProvider?: AIProvider | null;
  onLogout: () => void;
  onNavigate: (s: AppState) => void;
  onOpenMeeting: (meeting: any) => void;
}

/**
 * Dedicated page for creating a mentor session. This component mirrors
 * the create form from the dashboard but lives on its own route. After
 * creating a session, the user is navigated back to the dashboard.
 */
export const CreateSessionPage: React.FC<Props> = ({
  currentUser,
  aiProvider,
  onLogout,
  onNavigate,
  onOpenMeeting,
}) => {
  const { showFlash } = useFlash();
  const [wallet, setWallet] = useState<Wallet>({
    aiInterviewCredits: currentUser.wallet?.aiInterviewCredits ?? 0,
    mentorSessionCredits: currentUser.wallet?.mentorSessionCredits ?? 0,
  });
  const [loadingWallet, setLoadingWallet] = useState(false);

  // Form state
  const [mTopic, setMTopic] = useState('');
  const [mScheduledAt, setMScheduledAt] = useState('');
  const [mGuestName, setMGuestName] = useState('');
  const [mDurationMinutes, setMDurationMinutes] = useState(60);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        setLoadingWallet(true);
        const w = await getWallet();
        setWallet(w);
      } catch {
        // ignore
      } finally {
        setLoadingWallet(false);
      }
    };
    fetchWallet();
  }, []);

  // If user clicked "Reuse" on a previous mentor session, prepopulate
  // the form with the saved meeting's details. The dashboard stores
  // the meeting in localStorage under the key 'reuseMeeting'.
  useEffect(() => {
    try {
      const saved = localStorage.getItem('reuseMeeting');
      if (!saved) return;
      const meeting = JSON.parse(saved || '{}');
      setMTopic(meeting.technology || '');
      setMScheduledAt(
        meeting.scheduledAt ? new Date(meeting.scheduledAt).toISOString().slice(0, 16) : ''
      );
      setMGuestName(meeting.studentName || meeting.attendeeName || '');
      setMDurationMinutes(Number(meeting.durationMinutes) || 60);
    } catch {
      // ignore JSON parse or localStorage errors
    } finally {
      try {
        localStorage.removeItem('reuseMeeting');
      } catch {
        /* ignore */
      }
    }
  }, []);


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
      showFlash('Session created. Mentor credits will bill per minute once live.', 'success');
      setMTopic('');
      setMScheduledAt('');
      setMGuestName('');
      setMDurationMinutes(60);
      // Navigate back to the dashboard
      onNavigate(AppState.DASHBOARD);
      // Optionally copy key to clipboard
      try {
        await navigator.clipboard.writeText(meeting.meetingKey);
        showFlash('Session key copied.', 'info');
      } catch {
        /* ignore */
      }
    } catch (e: any) {
      showFlash(e?.message || 'Failed to create session', 'error');
    }
  };

  // Navigation items for the top nav bar
  const navItems = [
    { key: 'sessions', label: 'Sessions', onClick: () => onNavigate(AppState.DASHBOARD) },
    { key: 'schedule', label: 'Schedule AI Interview', onClick: () => onNavigate(AppState.SCHEDULE_INTERVIEW) },
    { key: 'create', label: 'Create Mentor Session', onClick: () => onNavigate(AppState.CREATE_SESSION) },
  ];

  return (
    <AppShell
      title="Create Mentor Session"
      subtitle={`User ID: ${currentUser.loginId || ''}${currentUser.email ? ` | ${currentUser.email}` : ''}`}
      activeKey={('create' as unknown) as any}
      onNavigate={onNavigate}
      onLogout={onLogout}
      navMode="top"
      customNavItems={navItems}
      /* Apply admin gradient styling */
      headerClassName="border-transparent bg-gradient-to-r from-sky-700 via-blue-600 to-sky-600 text-white"
      titleClassName="text-white"
      subtitleClassName="text-white/70"
      contentClassName="max-w-[1400px]"
      rightSlot={
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-green-100 px-3 py-2 text-green-900 shadow-sm">
            <FiCpu className="h-4 w-4" />
            <span className="font-semibold">{wallet.aiInterviewCredits}</span>
            <span className="text-xs">AI Credits</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-blue-100 px-3 py-2 text-blue-900 shadow-sm">
            <FiUsers className="h-4 w-4" />
            <span className="font-semibold">{wallet.mentorSessionCredits}</span>
            <span className="text-xs">Mentor Credits</span>
          </div>
        </div>
      }
    >
      <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white mb-4 shadow-lg">
            <FiUsers className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Create Mentor Session</h1>
          <p className="text-slate-500 text-sm">
            Set up a live mentoring session and share the meeting key with your participant
          </p>
          <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium">
            <FiUsers className="h-3.5 w-3.5" />
            Per-minute billing (first 3 minutes free)
          </div>
        </div>

        {/* Main Form Card */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 space-y-6">
            
            {/* Session Details Section */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <FiMessageSquare className="h-4 w-4 text-emerald-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Session Details</h2>
              </div>

              {/* Session Topic */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Session Topic <span className="text-red-500">*</span>
                </label>
                <input
                  value={mTopic}
                  onChange={(e) => setMTopic(e.target.value)}
                  placeholder="e.g., React Best Practices, System Design, Career Guidance"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                />
                <p className="text-xs text-slate-500">What technology or topic will be discussed in this session?</p>
              </div>

              {/* Schedule Date & Time */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  <FiCalendar className="inline h-4 w-4 mr-1.5 text-slate-400" />
                  Scheduled Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={mScheduledAt}
                  onChange={(e) => setMScheduledAt(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                />
                <p className="text-xs text-slate-500">Select when the mentoring session should start</p>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  <FiClock className="inline h-4 w-4 mr-1.5 text-slate-400" />
                  Duration (minutes) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={10}
                  max={120}
                  step={1}
                  value={mDurationMinutes}
                  onChange={(e) => setMDurationMinutes(Number(e.target.value))}
                  placeholder="60"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                />
                <div className="flex flex-wrap gap-2">
                  {[30, 60, 120].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setMDurationMinutes(mins)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        mDurationMinutes === mins
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-700'
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500">Range: 10 to 120 minutes.</p>
              </div>

              {/* Guest Name (Optional) */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  <FiUser className="inline h-4 w-4 mr-1.5 text-slate-400" />
                  Participant Name <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  value={mGuestName}
                  onChange={(e) => setMGuestName(e.target.value)}
                  placeholder="e.g., John Doe"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                />
                <p className="text-xs text-slate-500">Who will be joining this mentoring session?</p>
              </div>

            </div>

            {/* Info Box */}
            <div className="rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100/50 border border-slate-200/60 p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                  <FiShare2 className="h-5 w-5 text-slate-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">How it works</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    After creating the session, you'll receive a unique meeting key. Share this key with your participant so they can join the session at the scheduled time.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-100">
              <Button 
                onClick={handleCreateMeeting}
                className="w-full py-4 text-base font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl shadow-lg shadow-emerald-500/25 transition-all"
              >
                <FiUsers className="h-5 w-5 mr-2" />
                Create Session
              </Button>
              <p className="text-center text-xs text-slate-500 mt-3">
                The meeting key will be automatically copied to your clipboard
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
};

export default CreateSessionPage;
