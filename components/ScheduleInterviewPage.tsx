import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import AppShell from './layout/AppShell';
import { Card } from './Card';
import { Button } from './Button';
import { useFlash } from './FlashMessage';
import {
  createInterview,
  getProfile,
  parseJobDescriptionFile,
  getWallet,
} from '../services/backendApi';
import { User, Wallet, AIProvider, ExamplePair, AppState } from '../types';
import { FiCpu, FiUsers, FiCalendar, FiClock, FiBriefcase, FiFileText, FiEdit3, FiPlus, FiTrash2, FiUpload } from 'react-icons/fi';

interface Props {
  currentUser: User;
  aiProvider?: AIProvider | null;
  onLogout: () => void;
  onNavigate: (s: AppState) => void;
  onStartSession: (preferences: any) => void;
}

/**
 * Dedicated page for scheduling an AI interview. This component mirrors
 * the scheduling form from the dashboard but lives on its own route.
 * When the user schedules an interview, we navigate back to the
 * dashboard sessions view.
 */
export const ScheduleInterviewPage: React.FC<Props> = ({
  currentUser,
  aiProvider,
  onLogout,
  onNavigate,
  onStartSession,
}) => {
  const { showFlash } = useFlash();
  const [wallet, setWallet] = useState<Wallet>({
    aiInterviewCredits: currentUser.wallet?.aiInterviewCredits ?? 0,
    mentorSessionCredits: currentUser.wallet?.mentorSessionCredits ?? 0,
  });

  // Form state
  const [iTitle, setITitle] = useState('');
  const [iScheduledAt, setIScheduledAt] = useState('');
  const [iDuration, setIDuration] = useState(30);
  const [iYears, setIYears] = useState(0);
  const [iJobDesc, setIJobDesc] = useState('');
  const [iResumeText, setIResumeText] = useState('');
  const [iResponseStyle, setIResponseStyle] = useState('Simple Professional English');
  const [iMaxLines, setIMaxLines] = useState(30);
  const [iExamples, setIExamples] = useState<ExamplePair[]>([]);
  const [defaultResumeText, setDefaultResumeText] = useState('');
  const [jdUploading, setJdUploading] = useState(false);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const responseStylePresets = useMemo(
    () => [
      {
        label: 'Plain, Confident English',
        value:
          'Answer in plain, clear English with short sentences. Avoid jargon, slang, and hard-to-pronounce words. Sound confident and helpful, not robotic. Keep answers structured with 2-3 crisp points when possible.',
      },
      {
        label: 'Formal Business Tone',
        value:
          'Respond in a formal, business-ready tone. Use polite, concise language suitable for executives. Avoid long words and overly technical jargon. Keep each answer focused, professional, and easy to read aloud.',
      },
      {
        label: 'Structured STAR',
        value:
          'Use the STAR framework: Situation, Task, Action, Result. Keep each part brief and easy to say. Avoid complex vocabulary and filler. End with a measurable or qualitative result stated plainly.',
      },
      {
        label: 'Concise Bullets',
        value:
          'Respond with 3-5 short bullet points. Each bullet should be a simple, declarative sentence in plain English. Avoid buzzwords and tongue-twisters. Prioritize clarity and order of importance.',
      },
      {
        label: 'Technical, Simplified',
        value:
          'Explain technical answers in simple English. Use short sentences and avoid niche acronyms unless defined. Include a brief summary line. Keep language easy to pronounce and suitable for non-native speakers.',
      },
    ],
    []
  );

  // Fetch wallet on mount to display current credits
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingWallet(true);
        const [w, profile] = await Promise.all([
          getWallet().catch(() => null),
          getProfile().catch(() => null),
        ]);
        if (w) setWallet(w);
        if (profile?.resumeText) setDefaultResumeText(profile.resumeText);
      } catch {
        // ignore errors; keep defaults
      } finally {
        setLoadingWallet(false);
      }
    };
    fetchData();
  }, []);

  // If user clicked "Reuse" on a completed or expired interview, prepopulate
  // the scheduling form with the saved interview's details. The dashboard
  // stores the interview in localStorage under the key 'reuseInterview'.
  useEffect(() => {
    try {
      const saved = localStorage.getItem('reuseInterview');
      if (saved) {
        const intr = JSON.parse(saved);
        setITitle(intr.title || '');
        setIScheduledAt(
          intr.scheduledAt ? new Date(intr.scheduledAt).toISOString().slice(0, 16) : ''
        );
        setIDuration(intr.durationMinutes || 30);
        setIYears(intr.yearsOfExperience || 0);
        setIJobDesc(intr.jobDescription || '');
        setIResumeText(intr.resumeText || '');
        setIResponseStyle(intr.responseStyle || 'Simple Professional English');
        setIMaxLines(intr.maxLines || 30);
        setIExamples(intr.examples || []);
      }
    } catch {
      // ignore JSON parse or localStorage errors
    } finally {
      try {
        localStorage.removeItem('reuseInterview');
      } catch {
        /* ignore */
      }
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
  const removeExample = (idx: number) => setIExamples((prev) => prev.filter((_, i) => i !== idx));

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

  const handleUseDefaultResume = () => {
    if (!defaultResumeText.trim()) {
      showFlash('No default resume saved in profile.', 'warning');
      return;
    }
    setIResumeText(defaultResumeText);
    showFlash('Default resume applied.', 'success');
  };

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
      if (iDuration < 10 || iDuration > 120) {
        showFlash('Duration must be between 10 and 120 minutes', 'error');
        return;
      }
      await createInterview({
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
      showFlash('Interview scheduled. Credits bill per minute once live.', 'success');
      // After scheduling, navigate back to the dashboard sessions tab
      onNavigate(AppState.DASHBOARD);
    } catch (e: any) {
      showFlash(e?.message || 'Failed to create interview', 'error');
    }
  };

  // Navigation items for the top nav bar
  const navItems = [
    { key: 'sessions', label: 'Sessions', onClick: () => onNavigate(AppState.DASHBOARD) },
    { key: 'schedule', label: 'Schedule AI Interview', onClick: () => onNavigate(AppState.SCHEDULE_INTERVIEW) },
    { key: 'create', label: 'Create Mentor Session', onClick: () => onNavigate(AppState.CREATE_SESSION) },
  ];

  const responseStyleSelection =
    responseStylePresets.find((preset) => preset.value === iResponseStyle)?.label || 'Custom';

  return (
    <AppShell
      title="Schedule AI Interview"
      subtitle={`User ID: ${currentUser.loginId || ''}${currentUser.email ? ` | ${currentUser.email}` : ''}`}
      activeKey={('schedule' as unknown) as any}
      onNavigate={onNavigate}
      onLogout={onLogout}
      navMode="top"
      customNavItems={navItems}
      /* Apply admin gradient header for visual consistency */
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
      <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white mb-4 shadow-lg">
            <FiCalendar className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Schedule AI Interview</h1>
          <p className="text-slate-500 text-sm">
            Complete the form below to schedule your AI-powered interview session
          </p>
          <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
            <FiCpu className="h-3.5 w-3.5" />
            1 Credit per minute during live interview (standard grace period may apply)
          </div>
        </div>

        {/* Main Form Card */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 space-y-6">
            
            {/* Interview Details Section */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
                  <FiBriefcase className="h-4 w-4 text-sky-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Interview Details</h2>
              </div>

              {/* Interview Title */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Interview Title <span className="text-red-500">*</span>
                </label>
                <input
                  value={iTitle}
                  onChange={(e) => setITitle(e.target.value)}
                  placeholder="e.g., Senior Frontend Developer Interview"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all outline-none"
                />
                <p className="text-xs text-slate-500">Give your interview a descriptive name</p>
              </div>

              {/* Schedule & Duration Row */}
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    <FiCalendar className="inline h-4 w-4 mr-1.5 text-slate-400" />
                    Scheduled Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={iScheduledAt}
                    onChange={(e) => setIScheduledAt(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all outline-none"
                  />
                  <p className="text-xs text-slate-500">Select when to start the interview</p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    <FiClock className="inline h-4 w-4 mr-1.5 text-slate-400" />
                    Duration (minutes) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={iDuration}
                    onChange={(e) => setIDuration(Number(e.target.value))}
                    min={10}
                    max={120}
                    step={1}
                    placeholder="30"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all outline-none"
                  />
                  <div className="flex flex-wrap gap-2">
                    {[30, 60, 120].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setIDuration(mins)}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                          iDuration === mins
                            ? 'border-sky-600 bg-sky-600 text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:text-sky-700'
                        }`}
                      >
                        {mins} min
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">Range: 10 to 120 minutes.</p>
                </div>
              </div>

              {/* Years of Experience */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Years of Experience <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={iYears}
                  onChange={(e) => setIYears(Number(e.target.value))}
                  min={0}
                  max={50}
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all outline-none"
                />
                <p className="text-xs text-slate-500">Your total years of professional experience in this field</p>
              </div>
            </div>

            {/* Job Description Section */}
            <div className="space-y-5 pt-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <FiFileText className="h-4 w-4 text-emerald-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Job Description</h2>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700">
                  Job Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={iJobDesc}
                  onChange={(e) => setIJobDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all outline-none resize-none"
                  rows={5}
                  placeholder="Paste the complete job description here including responsibilities, requirements, and qualifications..."
                />
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-100 hover:border-slate-300 transition-all">
                    <FiUpload className="h-4 w-4 text-sky-600" />
                    Upload JD (PDF/Text)
                    <input
                      type="file"
                      accept="application/pdf,.pdf,text/plain,.txt"
                      className="hidden"
                      onChange={(e) => handleUploadJobDescription(e.target.files?.[0] || null)}
                      disabled={jdUploading}
                    />
                  </label>
                  {jdUploading && (
                    <span className="text-sm text-sky-600 animate-pulse">Extracting content...</span>
                  )}
                </div>
                <p className="text-xs text-slate-500">Or upload a PDF/text file to auto-extract the job description</p>
              </div>
            </div>

            {/* Resume Section */}
            <div className="space-y-5 pt-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                  <FiEdit3 className="h-4 w-4 text-violet-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Your Resume</h2>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Resume Text <span className="text-red-500">*</span>
                  </label>
                  <Button
                    type="button"
                    variant="secondary"
                    className="text-xs"
                    onClick={handleUseDefaultResume}
                    disabled={!defaultResumeText.trim()}
                  >
                    Use default resume
                  </Button>
                </div>
                <textarea
                  value={iResumeText}
                  onChange={(e) => setIResumeText(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all outline-none resize-none"
                  rows={5}
                  placeholder="Paste your resume content here including work experience, skills, education, and achievements..."
                />
                <p className="text-xs text-slate-500">Include relevant experience, skills, and qualifications that match the job</p>
              </div>
            </div>

            {/* Response Settings Section */}
            <div className="space-y-5 pt-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <FiCpu className="h-4 w-4 text-amber-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">AI Response Settings</h2>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Response Style
                  </label>
                  <select
                    value={responseStyleSelection}
                    onChange={(e) => {
                      const selected = responseStylePresets.find((p) => p.label === e.target.value);
                      if (selected) {
                        setIResponseStyle(selected.value);
                      }
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all outline-none"
                  >
                    <option value="Custom">Custom</option>
                    {responseStylePresets.map((preset) => (
                      <option key={preset.label} value={preset.label}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={iResponseStyle}
                    onChange={(e) => setIResponseStyle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all outline-none"
                    placeholder="Simple Professional English"
                  />
                  <div className="flex flex-wrap gap-2">
                    {responseStylePresets.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setIResponseStyle(preset.value)}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                          iResponseStyle === preset.value
                            ? 'border-sky-600 bg-sky-600 text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:text-sky-700'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">Pick a preset or type a custom response style.</p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Max Response Lines
                  </label>
                  <input
                    type="number"
                    value={iMaxLines}
                    onChange={(e) => setIMaxLines(Number(e.target.value))}
                    min={1}
                    max={100}
                    placeholder="30"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all outline-none"
                  />
                  <p className="text-xs text-slate-500">Limit the length of AI-generated answers</p>
                </div>
              </div>
            </div>

            {/* Training Examples Section */}
            <div className="space-y-5 pt-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                    <FiPlus className="h-4 w-4 text-rose-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Training Examples</h2>
                    <p className="text-xs text-slate-500">Optional: Add Q&A examples to guide the AI</p>
                  </div>
                </div>
                <Button 
                  variant="secondary" 
                  onClick={addExample}
                  className="inline-flex items-center gap-2 text-sm"
                >
                  <FiPlus className="h-4 w-4" />
                  Add Example
                </Button>
              </div>

              <div className="space-y-4">
                {iExamples.map((ex, idx) => (
                  <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">Example {idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeExample(idx)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
                      >
                        <FiTrash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-slate-600">Question</label>
                      <input
                        type="text"
                        value={ex.question}
                        onChange={(e) => updateExample(idx, 'question', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all outline-none"
                        placeholder="e.g., Tell me about a challenging project you worked on"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-slate-600">Desired Answer</label>
                      <textarea
                        value={ex.answer}
                        onChange={(e) => updateExample(idx, 'answer', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all outline-none resize-none"
                        rows={3}
                        placeholder="The ideal answer structure and key points you want the AI to follow..."
                      />
                    </div>
                  </div>
                ))}
                {iExamples.length === 0 && (
                  <div className="text-center py-8 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/30">
                    <FiPlus className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No training examples added yet</p>
                    <p className="text-xs text-slate-400 mt-1">Click "Add Example" to help guide the AI responses</p>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-slate-100">
              <Button 
                onClick={handleCreateInterview}
                className="w-full py-4 text-base font-semibold bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white rounded-xl shadow-lg shadow-sky-500/25 transition-all"
              >
                <FiCalendar className="h-5 w-5 mr-2" />
                Schedule Interview
              </Button>
              <p className="text-center text-xs text-slate-500 mt-3">
                By scheduling, you agree to use 1 AI credit from your balance
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
};

export default ScheduleInterviewPage;
