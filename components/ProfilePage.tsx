import React, { useEffect, useState } from 'react';
import { FiArrowLeft, FiCheckCircle, FiRefreshCw, FiSave, FiTrash2, FiUpload } from 'react-icons/fi';
import { AppState, ResumeRecord, User } from '../types';
import AppShell from './layout/AppShell';
import { Card } from './Card';
import { Button } from './Button';
import { useFlash } from './FlashMessage';
import {
  createResume,
  deleteResume,
  getProfile,
  listResumes,
  updateProfile,
  uploadResume,
} from '../services/backendApi';

type Props = {
  currentUser: User;
  onNavigate: (state: AppState) => void;
  onBack: () => void;
  onLogout: () => void;
  onUserUpdated?: (update: Partial<User>) => void;
};

const parseKeywords = (value: string) =>
  value
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);

const formatDate = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString();
};

const getInitial = (value: string) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return 'U';
  return trimmed[0].toUpperCase();
};

const ProfilePage: React.FC<Props> = ({ currentUser, onNavigate, onBack, onLogout, onUserUpdated }) => {
  const { showFlash } = useFlash();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [defaultResume, setDefaultResume] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [profileName, setProfileName] = useState(currentUser.name || currentUser.loginId || '');

  const [resumeTitle, setResumeTitle] = useState('');
  const [resumeText, setResumeText] = useState('');

  const navItems = [
    { key: 'sessions', label: 'Sessions', onClick: () => onNavigate(AppState.DASHBOARD) },
    { key: 'schedule', label: 'Schedule AI Interview', onClick: () => onNavigate(AppState.SCHEDULE_INTERVIEW) },
    { key: 'create', label: 'Create Mentor Session', onClick: () => onNavigate(AppState.CREATE_SESSION) },
    { key: 'credits', label: 'Credits', onClick: () => onNavigate(AppState.BUY_AI_CREDITS) },
    { key: 'payments', label: 'Payments', onClick: () => onNavigate(AppState.PAYMENT_HISTORY) },
    { key: 'stealth-console', label: 'Stealth Console', onClick: () => onNavigate(AppState.COPILOT_CONSOLE) },
    { key: 'profile', label: 'Profile', onClick: () => onNavigate(AppState.PROFILE) },
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      const [profile, resumeList] = await Promise.all([getProfile(), listResumes()]);
      setDefaultResume(profile.resumeText || '');
      setKeywordsInput((profile.keywords || []).join(', '));
      setResumes(resumeList || []);
      setProfileName(profile.name || currentUser.name || currentUser.loginId || '');
    } catch (err: any) {
      console.error(err);
      showFlash(err?.message || 'Failed to load profile.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const next = await updateProfile({
        resumeText: defaultResume,
        keywords: parseKeywords(keywordsInput),
        name: profileName.trim(),
      });
      setDefaultResume(next.resumeText || '');
      setKeywordsInput((next.keywords || []).join(', '));
      if (typeof next.name === 'string') {
        setProfileName(next.name);
      }
      onUserUpdated?.({ name: next.name || profileName.trim() });
      showFlash('Profile updated.', 'success');
    } catch (err: any) {
      console.error(err);
      showFlash(err?.message || 'Could not save profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateResume = async () => {
    if (!resumeTitle.trim() || !resumeText.trim()) {
      showFlash('Title and resume text are required.', 'warning');
      return;
    }
    try {
      setCreating(true);
      const created = await createResume({
        title: resumeTitle.trim(),
        resumeText: resumeText.trim(),
        source: 'TEXT',
      });
      setResumes((prev) => [created, ...prev]);
      setResumeTitle('');
      setResumeText('');
      showFlash('Resume saved.', 'success');
    } catch (err: any) {
      console.error(err);
      showFlash(err?.message || 'Failed to save resume.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleUploadResume = async (file?: File | null) => {
    if (!file) return;
    try {
      setUploading(true);
      const uploaded = await uploadResume(file, file.name.replace(/\.[^/.]+$/, ''));
      setResumes((prev) => [uploaded, ...prev]);
      showFlash('Resume uploaded.', 'success');
    } catch (err: any) {
      console.error(err);
      showFlash(err?.message || 'Upload failed.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteResume = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteResume(id);
      setResumes((prev) => prev.filter((r) => r.id !== id));
      showFlash('Resume removed.', 'success');
    } catch (err: any) {
      console.error(err);
      showFlash(err?.message || 'Delete failed.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleUseAsDefault = async (resume: ResumeRecord) => {
    try {
      setSaving(true);
      setDefaultResume(resume.resumeText || '');
      await updateProfile({ resumeText: resume.resumeText });
      showFlash('Default resume updated.', 'success');
    } catch (err: any) {
      console.error(err);
      showFlash(err?.message || 'Could not set default resume.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      currentUser={currentUser}
      title="Profile"
      subtitle="Manage your default resume and saved resumes."
      activeKey={'profile' as any}
      onNavigate={onNavigate}
      onLogout={onLogout}
      navMode="top"
      customNavItems={navItems}
      headerClassName="border-transparent bg-gradient-to-r from-sky-700 via-blue-600 to-sky-600 text-white"
      titleClassName="text-white"
      subtitleClassName="text-white/70"
      contentClassName="max-w-[1400px]"
      rightSlot={
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-green-100 px-3 py-2 text-green-900">
            <span className="font-semibold">{currentUser.wallet?.aiInterviewCredits ?? 0}</span>
            <span className="text-xs">AI Credits</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-blue-100 px-3 py-2 text-blue-900">
            <span className="font-semibold">{currentUser.wallet?.mentorSessionCredits ?? 0}</span>
            <span className="text-xs">Mentor Credits</span>
          </div>
          <Button variant="ghost" onClick={onBack} className="text-sm text-white hover:text-white">
            <FiArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase text-slate-500">Profile details</div>
              <Button variant="secondary" onClick={loadData} disabled={loading}>
                <FiRefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-2xl bg-slate-100 flex items-center justify-center">
                <span className="text-xl font-semibold text-slate-500">
                  {getInitial(profileName || currentUser.loginId || currentUser.email || 'User')}
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-slate-500">Login ID</div>
                <div className="text-sm font-semibold text-slate-900">{currentUser.loginId || '-'}</div>
                <div className="text-xs text-slate-500">{currentUser.email || '-'}</div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Display name</label>
              <input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>
          </Card>

          <Card className="col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-base font-semibold text-slate-900">Default resume</div>
              <Button onClick={handleSaveProfile} disabled={saving || loading}>
                <FiSave className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
            <textarea
              value={defaultResume}
              onChange={(e) => setDefaultResume(e.target.value)}
              placeholder="Paste your default resume text here..."
              className="min-h-[180px] w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 shadow-inner focus:outline-none focus:ring-2 focus:ring-black/10"
            />
            <div className="grid gap-3 md:grid-cols-3 md:items-center">
              <label className="text-sm font-medium text-slate-800">Keywords (comma separated)</label>
              <input
                value={keywordsInput}
                onChange={(e) => setKeywordsInput(e.target.value)}
                placeholder="AI, Full-stack, React, Node"
                className="md:col-span-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-base font-semibold text-slate-900">Saved resumes</div>
              <div className="text-xs text-slate-500">
                {loading ? 'Loading...' : `${resumes.length} total`}
              </div>
            </div>
            {resumes.length === 0 && !loading && (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No resumes saved yet. Paste one on the right or upload a file.
              </div>
            )}
            <div className="space-y-3">
              {resumes.map((resume) => (
                <div
                  key={resume.id}
                  className="rounded-xl border border-slate-200 p-3 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{resume.title}</div>
                      <div className="text-xs text-slate-500">
                        {resume.source === 'PDF' ? 'PDF' : 'Text'}
                        {resume.updatedAt ? ` Updated ${formatDate(resume.updatedAt)}` : ''}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => handleUseAsDefault(resume)}
                        disabled={saving}
                      >
                        <FiCheckCircle className="h-4 w-4" />
                        Use as default
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleDeleteResume(resume.id)}
                        disabled={deletingId === resume.id}
                      >
                        <FiTrash2 className="h-4 w-4" />
                        {deletingId === resume.id ? 'Removing...' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                  {resume.resumeText && (
                    <p className="mt-2 line-clamp-3 text-xs text-slate-600">{resume.resumeText}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="text-base font-semibold text-slate-900">Add a resume</div>
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-800">Title</label>
                <input
                  value={resumeTitle}
                  onChange={(e) => setResumeTitle(e.target.value)}
                  placeholder="e.g., Frontend Engineer"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-800">Resume text</label>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your resume content..."
                  className="min-h-[140px] w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 shadow-inner focus:outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleCreateResume} disabled={creating}>
                  <FiSave className="h-4 w-4" />
                  {creating ? 'Saving...' : 'Save text resume'}
                </Button>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm hover:border-slate-300">
                  <FiUpload className="h-4 w-4" />
                  {uploading ? 'Uploading...' : 'Upload PDF'}
                  <input
                    type="file"
                    accept=".pdf,.txt"
                    className="hidden"
                    onChange={(e) => handleUploadResume(e.target.files?.[0])}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
};

export default ProfilePage;
