import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AIProvider,
  AppState,
  InterviewStatus,
  ResumeRecord,
  SavedInterview,
  User,
  UserPreferences,
} from '../types';
import { Button } from './Button';
import AppShell from './layout/AppShell';
import { createInterview, deleteInterview, listInterviews, listResumes, updateInterview } from '../services/backendApi';
import { useFlash } from './FlashMessage';
import { FiEdit2, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';

const formatTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--';
  return d.toLocaleDateString([], { year: 'numeric', month: 'short', day: '2-digit' });
};

const statusMeta: Record<InterviewStatus, { label: string; cls: string }> = {
  PENDING: { label: 'Pending', cls: 'bg-slate-100 text-slate-700' },
  APPROVED: { label: 'Approved', cls: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { label: 'Rejected', cls: 'bg-red-100 text-red-700' },
  IN_PROGRESS: { label: 'In progress', cls: 'bg-violet-100 text-violet-700' },
  COMPLETED: { label: 'Completed', cls: 'bg-slate-100 text-slate-700' },
};

const Card: React.FC<{ title: string; right?: React.ReactNode; className?: string; children: React.ReactNode }> = ({
  title,
  right,
  className = '',
  children,
}) => {
  return (
    <div className={`rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-lg font-semibold tracking-tight text-slate-900">{title}</div>
        {right}
      </div>
      {children}
    </div>
  );
};

type View = 'OVERVIEW' | 'FORM';

interface DashboardProps {
  currentUser: User;
  onStartSession: (prefs: UserPreferences) => void;
  aiProvider: AIProvider | null;
  onNavigate: (state: AppState) => void;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ currentUser, onStartSession, aiProvider, onNavigate, onLogout }) => {
  const { showFlash } = useFlash();

  const [view, setView] = useState<View>('OVERVIEW');
  const [busy, setBusy] = useState(false);

  const [interviews, setInterviews] = useState<SavedInterview[]>([]);
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | InterviewStatus>('ALL');

  // Form state
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [title, setTitle] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [experienceYears, setExperienceYears] = useState(0);
  const [jobDescription, setJobDescription] = useState('');
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [resumeText, setResumeText] = useState('');

  const loadAll = useCallback(async () => {
    try {
      setBusy(true);
      const [i, r] = await Promise.all([listInterviews(), listResumes().catch(() => [])]);
      setInterviews(i);
      setResumes(r);
    } catch (e) {
      console.error(e);
      showFlash('Failed to load dashboard data.', 'error');
    } finally {
      setBusy(false);
    }
  }, [showFlash]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return interviews
      .filter((i) => (statusFilter === 'ALL' ? true : i.status === statusFilter))
      .filter((i) => (!q ? true : `${i.title} ${i.jobDescription}`.toLowerCase().includes(q)))
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }, [interviews, search, statusFilter]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return filtered.filter((i) => new Date(i.scheduledAt).getTime() >= now - 1000 * 60 * 60 * 24);
  }, [filtered]);

  const scheduleRows = useMemo(() => {
    return upcoming
      .filter((i) => i.status !== 'REJECTED')
      .slice(0, 6);
  }, [upcoming]);

  const noteCards = useMemo(() => {
    const colors = [
      'bg-[rgba(20,184,166,0.18)] ring-[rgba(20,184,166,0.18)]',
      'bg-[rgba(139,92,246,0.18)] ring-[rgba(139,92,246,0.18)]',
    ];
    return resumes.slice(0, 2).map((r, idx) => ({ resume: r, cls: colors[idx % colors.length] }));
  }, [resumes]);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setScheduledAt('');
    setDurationMinutes(60);
    setExperienceYears(0);
    setJobDescription('');
    setSelectedResumeId('');
    setResumeText('');
  };

  const openCreate = () => {
    resetForm();
    setView('FORM');
  };

  const openEdit = (i: SavedInterview) => {
    setEditingId(i.id);
    setTitle(i.title || '');
    setScheduledAt(i.scheduledAt ? i.scheduledAt.slice(0, 16) : '');
    setDurationMinutes(i.durationMinutes || 60);
    setExperienceYears(i.yearsOfExperience || 0);
    setJobDescription(i.jobDescription || '');
    setResumeText(i.resumeText || '');
    setSelectedResumeId((i as any).resumeId || '');
    setView('FORM');
  };

  const onSelectResume = (id: string) => {
    setSelectedResumeId(id);
    const found = resumes.find((r) => r.id === id);
    if (found) {
      setResumeText(found.resumeText || '');
    }
  };

  const canStart = (i: SavedInterview) => i.status === 'APPROVED' || i.status === 'IN_PROGRESS';

  const startSession = (i: SavedInterview) => {
    const prefs: UserPreferences = {
      resumeText: i.resumeText,
      jobDescription: i.jobDescription,
      responseStyle: i.responseStyle || 'Simple English',
      maxLines: i.maxLines ?? 30,
      examples: i.examples || [],
      aiProvider: aiProvider || 'GEMINI',
      yearsOfExperience: i.yearsOfExperience || 0,
      interviewId: typeof i.id === 'string' ? Number(i.id) : i.id,
      durationMinutes: i.durationMinutes || 60,
      sessionSecondsUsed: i.sessionSecondsUsed || 0,
      scheduledAt: i.scheduledAt,
    };
    onStartSession(prefs);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return showFlash('Title is required.', 'warning');
    if (!scheduledAt) return showFlash('Scheduled date/time is required.', 'warning');
    if (!resumeText.trim()) return showFlash('Resume is required.', 'warning');
    if (!jobDescription.trim()) return showFlash('Job description is required.', 'warning');

    try {
      setBusy(true);
      const scheduledISO = new Date(scheduledAt).toISOString();
      if (editingId) {
        await updateInterview(editingId, {
          title: title.trim(),
          resumeText,
          jobDescription,
          scheduledAt: scheduledISO,
          durationMinutes,
          experienceYears,
        });
        showFlash('Interview updated.', 'success');
      } else {
        await createInterview({
          title: title.trim(),
          resumeText,
          jobDescription,
          scheduledAt: scheduledISO,
          durationMinutes,
          experienceYears,
        });
        showFlash('Interview request created.', 'success');
      }

      setView('OVERVIEW');
      resetForm();
      await loadAll();
    } catch (err: any) {
      console.error(err);
      showFlash(err?.message || 'Failed to save interview.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (i: SavedInterview) => {
    if (!confirm(`Delete "${i.title}"? This cannot be undone.`)) return;
    try {
      setBusy(true);
      await deleteInterview(i.id);
      showFlash('Deleted.', 'success');
      await loadAll();
    } catch (err) {
      console.error(err);
      showFlash('Failed to delete.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const rightSlot = (
    <div className="flex w-full items-center gap-3 md:w-auto">
      <div className="relative w-full md:w-[280px]">
        <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search interviews…"
          className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-black/10"
        />
      </div>
    </div>
  );

  if (view === 'FORM') {
    return (
      <AppShell
        currentUser={currentUser}
        activeKey="dashboard"
        onNavigate={onNavigate}
        onLogout={onLogout}
        title={editingId ? 'Edit interview request' : 'Request an interview'}
        subtitle="Minimal, fast form — pick a saved resume or paste a new one."
        rightSlot={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setView('OVERVIEW')} disabled={busy}>
              Back
            </Button>
            <Button variant="primary" type="submit" form="interviewForm" disabled={busy}>
              Save
            </Button>
          </div>
        }
      >
        <form
          id="interviewForm"
          onSubmit={handleSave}
          className="grid grid-cols-1 gap-6 lg:grid-cols-2"
        >
          <Card title="Core details">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Frontend Engineer (React)"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Date & time</label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-black/10"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">Duration</label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-black/10"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                    <option value={120}>120 minutes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Years of experience</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>
            </div>
          </Card>

          <Card
            title="Resume"
            right={
              <Button
                type="button"
                variant="secondary"
                onClick={() => onNavigate(AppState.PROFILE)}
              >
                Manage resumes
              </Button>
            }
          >
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">Use saved resume</label>
                <select
                  value={selectedResumeId}
                  onChange={(e) => onSelectResume(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-black/10"
                >
                  <option value="">— Select —</option>
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-slate-500">
                  Tip: keep multiple targeted resumes (Frontend, Backend, SDE) and pick the one that matches the JD.
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Resume text</label>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste plain-text resume here, or select a saved one above."
                  className="mt-2 h-44 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>
            </div>
          </Card>

          <div className="lg:col-span-2">
            <Card title="Job description">
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description (JD) here."
                className="h-52 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-black/10"
              />
            </Card>
          </div>
        </form>
      </AppShell>
    );
  }

  return (
    <AppShell
      currentUser={currentUser}
      activeKey="dashboard"
      onNavigate={onNavigate}
      onLogout={onLogout}
      title="Dashboard"
      subtitle="Minimal, fast, premium — like the reference dashboard."
      rightSlot={rightSlot}
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Tasks */}
        <div className="xl:col-span-2">
          <Card
            title="My tasks"
            right={
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
                  {(['ALL', 'PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED'] as const).map((k) => (
                    <button
                      key={k}
                      onClick={() => setStatusFilter(k as any)}
                      className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                        statusFilter === k ? 'bg-black text-white' : 'text-slate-600 hover:bg-black/5'
                      }`}
                    >
                      {k === 'ALL' ? 'All' : statusMeta[k as InterviewStatus].label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={openCreate}
                  className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm hover:shadow-md transition"
                  aria-label="Create new"
                  title="Create new"
                >
                  <FiPlus className="h-5 w-5" />
                </button>
              </div>
            }
          >
            {busy && interviews.length === 0 ? (
              <div className="text-sm text-slate-500">Loading…</div>
            ) : upcoming.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                No tasks yet. Click <span className="font-semibold">+</span> to create your first interview request.
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.slice(0, 6).map((i) => {
                  const meta = statusMeta[i.status];
                  const progress = Math.min(
                    1,
                    (i.sessionSecondsUsed || 0) / Math.max(1, (i.durationMinutes || 60) * 60)
                  );

                  return (
                    <div
                      key={String(i.id)}
                      className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-900">{i.title}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {formatDate(i.scheduledAt)} • {formatTime(i.scheduledAt)} • {i.durationMinutes}m
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${meta.cls}`}>{meta.label}</span>
                          <button
                            onClick={() => openEdit(i)}
                            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-sm hover:shadow-md"
                            aria-label="Edit"
                          >
                            <FiEdit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(i)}
                            className="rounded-xl border border-slate-200 bg-white p-2 text-red-600 shadow-sm hover:shadow-md"
                            aria-label="Delete"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                          <Button
                            variant={canStart(i) ? 'primary' : 'secondary'}
                            className="h-10"
                            disabled={!canStart(i)}
                            onClick={() => canStart(i) && startSession(i)}
                          >
                            {canStart(i) ? 'Start' : i.status === 'REJECTED' ? 'Rejected' : 'Waiting'}
                          </Button>
                        </div>
                      </div>

                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[rgb(var(--accent-rgb))]"
                          style={{ width: `${Math.round(progress * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Notes */}
        <div>
          <Card
            title="My notes"
            right={
              <button
                onClick={() => onNavigate(AppState.PROFILE)}
                className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm hover:shadow-md transition"
                aria-label="Add"
                title="Add"
              >
                <FiPlus className="h-5 w-5" />
              </button>
            }
          >
            {noteCards.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                Save resumes in your profile. They show up here as quick notes.
              </div>
            ) : (
              <div className="grid gap-4">
                {noteCards.map(({ resume, cls }) => (
                  <div
                    key={resume.id}
                    className={`relative overflow-hidden rounded-3xl p-4 ring-1 ${cls}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">{resume.title}</div>
                        <div className="mt-2 line-clamp-4 text-xs text-slate-700">
                          {resume.aiContext?.summary || resume.resumeText || '—'}
                        </div>
                      </div>
                      <button
                        onClick={() => onNavigate(AppState.PROFILE)}
                        className="rounded-2xl border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white"
                      >
                        Open
                      </button>
                    </div>
                    <div className="mt-4 text-xs text-slate-500">
                      {resume.updatedAt ? formatDate(resume.updatedAt) : '—'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Schedule */}
        <div className="xl:col-span-3">
          <Card title="My schedule">
            {scheduleRows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                Upcoming approved interviews will appear here.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="grid grid-cols-12 gap-2 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
                  <div className="col-span-3">Time</div>
                  <div className="col-span-5">Interview</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2 text-right">Action</div>
                </div>
                {scheduleRows.map((i) => {
                  const meta = statusMeta[i.status];
                  return (
                    <div key={String(i.id)} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm">
                      <div className="col-span-3 text-slate-700">
                        <div className="font-semibold">{formatTime(i.scheduledAt)}</div>
                        <div className="text-xs text-slate-500">{formatDate(i.scheduledAt)}</div>
                      </div>
                      <div className="col-span-5 min-w-0">
                        <div className="truncate font-semibold text-slate-900">{i.title}</div>
                        <div className="truncate text-xs text-slate-500">{i.jobDescription}</div>
                      </div>
                      <div className="col-span-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${meta.cls}`}>{meta.label}</span>
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <Button
                          variant={canStart(i) ? 'primary' : 'secondary'}
                          className="h-9"
                          disabled={!canStart(i)}
                          onClick={() => canStart(i) && startSession(i)}
                        >
                          Join
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
};

export default Dashboard;
