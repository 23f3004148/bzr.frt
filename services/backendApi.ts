
import { AIProvider, SavedInterview, User, ContactSubmissionRecord, AdminSettings, Meeting, MeetingStatus, ResumeRecord, Wallet } from "../types";

export type UserProfile = {
  resumeText: string;
  keywords: string[];
  name?: string;
};

// Prefer the newer env var name if present, but keep backwards compatibility.
const envApiBase =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  (import.meta as any).env?.VITE_API_BASE;

const runtimeOrigin =
  typeof window !== 'undefined' && window.location ? window.location.origin : '';
const runtimeHostname =
  typeof window !== 'undefined' && window.location ? window.location.hostname : '';

// Known production mapping so the app does not silently call the Vercel domain
// if env vars are missing in production.
const knownProdFrontendHosts = ['bzzr.vercel.app'];
const knownProdApiBase = 'https://bzzrbackend-production.up.railway.app';

// IMPORTANT:
// - In production, accidentally falling back to localhost breaks the app and the
//   AI stream (users will see requests going to http://localhost:4000/...)
// - If no env var is provided, prefer same-origin so teams can optionally use
//   a reverse proxy (e.g. Vercel rewrites) without changing the build.
// - For local dev, you should set VITE_API_BASE_URL in .env.local.
const defaultApiBase =
  runtimeHostname && knownProdFrontendHosts.includes(runtimeHostname)
    ? knownProdApiBase
    : runtimeOrigin && runtimeHostname && !['localhost', '127.0.0.1'].includes(runtimeHostname)
      ? runtimeOrigin
      : 'http://localhost:4000';

export const API_BASE = (envApiBase || defaultApiBase).replace(/\/+$/, '');

export const resolveMediaUrl = (path?: string | null) => {
  const value = String(path || '').trim();
  if (!value) return '';
  if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) {
    return value;
  }
  const base = API_BASE;
  if (value.startsWith('/')) return `${base}${value}`;
  return `${base}/${value}`;
};

// Optional separate Socket.IO base (defaults to API_BASE)
export const SOCKET_URL =
  (import.meta as any).env?.VITE_SOCKET_URL ||
  API_BASE;

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

function getToken(): string | null {
  // Tab-only auth
  const t = sessionStorage.getItem('buuzzer_token');
  if (t) {
    if (!localStorage.getItem('buuzzer_token')) {
      localStorage.setItem('buuzzer_token', t);
    }
    return t;
  }

  const persisted = localStorage.getItem('buuzzer_token');
  if (persisted) {
    sessionStorage.setItem('buuzzer_token', persisted);
    return persisted;
  }
  return null;
}

function setToken(token: string) {
  sessionStorage.setItem('buuzzer_token', token);
  localStorage.setItem('buuzzer_token', token);
}

export function clearAuth() {
  sessionStorage.removeItem('buuzzer_token');
  localStorage.removeItem('buuzzer_token');
}

export function getStoredToken(): string | null {
  return getToken();
}

export function storeToken(token: string) {
  if (!token) return;
  setToken(token);
}

export async function listCopilotSessions(): Promise<any[]> {
  const headers = getAuthHeaders();
  if (!headers) return [];
  const resp = await fetch(`${API_BASE}/api/copilot-sessions`, { headers });
  if (!resp.ok) return [];
  return await resp.json();
}

export async function deleteCopilotSession(sessionId: string): Promise<void> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/copilot-sessions/${sessionId}`, {
    method: 'DELETE',
    headers,
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body?.error || 'Failed to delete session');
  }
}

export async function generateCopilotSummary(
  sessionId: string,
  provider?: AIProvider
): Promise<{
  summaryText: string;
  summaryData: any;
  summaryTopics: string[];
  summaryUpdatedAt?: string;
}> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/copilot-sessions/${sessionId}/summary`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ provider: provider ? mapProviderToBackend(provider) : undefined }),
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body?.error || 'Failed to generate session summary');
  }
  return resp.json();
}

function getAuthHeaders() {
  const token = getToken();
  if (!token) return null;
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

function mapBackendUser(u: any): User {
  return {
    id: u.id ?? u._id ?? u.userId ?? u.user_id,
    loginId: u.loginId ?? u.login_id,
    email: u.email ?? null,
    name: u.name,
    role: u.role,
    active: u.active,
    createdAt: u.createdAt ?? u.created_at,
    wallet: u.wallet,
    avatarUrl: u.avatarUrl || u.avatar_url || u.avatar,
  };
}

function mapBackendInterview(i: any): SavedInterview {
  return {
    id: i.id,
    title: i.title,
    resumeText: i.resume_text || i.resumeText || '',
    jobDescription: i.job_description || i.jobDescription || '',
    responseStyle: i.response_style || i.responseStyle || 'Simple Professional English',
    maxLines:
      typeof i.max_lines === 'number'
        ? i.max_lines
        : typeof i.maxLines === 'number'
          ? i.maxLines
          : 30,
    examples: Array.isArray(i.examples) ? i.examples : [],
    status: i.status,
    scheduledAt: i.scheduled_at || i.scheduledAt,
    durationMinutes: i.duration_minutes ?? i.durationMinutes,
    expiresAt: i.expires_at || i.expiresAt,
    sessionStartedAt: i.session_started_at || i.sessionStartedAt,
    sessionEndedAt: i.session_ended_at || i.sessionEndedAt,
    yearsOfExperience:
      typeof i.experience_years === 'number'
        ? i.experience_years
        : typeof i.experienceYears === 'number'
          ? i.experienceYears
          : 0,
    createdBy: i.user_login_id,
    userId: i.user_id,
    sessionSecondsUsed: i.session_seconds_used || 0,
    meetingUrl: i.meeting_url || i.meetingUrl || '',
    keywords: Array.isArray(i.keywords) ? i.keywords : [],
    additionalInfo: i.additional_info || i.additionalInfo || '',
    summaryText: i.summary_text || i.summaryText || '',
    summaryData: i.summary_data || i.summaryData || null,
    summaryTopics: Array.isArray(i.summary_topics || i.summaryTopics)
      ? (i.summary_topics || i.summaryTopics)
      : [],
    summaryUpdatedAt: i.summary_updated_at || i.summaryUpdatedAt || null,
  };
}

function mapProviderToBackend(p: AIProvider): string {
  switch (p) {
    case 'GEMINI':
      return 'gemini';
    case 'DEEPSEEK':
      return 'deepseek';
    case 'OPENAI':
    default:
      return 'openai';
  }
}

export async function login(loginId: string, password: string): Promise<User> {
  const resp = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginId, password }),
  });
  if (!resp.ok) {
    throw new Error('Invalid credentials');
  }
  const data = await resp.json();
  if (data.token) {
    setToken(data.token);
  }
  return mapBackendUser(data.user);
}

export async function loginWithGoogle(idToken: string): Promise<User> {
  const resp = await fetch(`${API_BASE}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body?.error || 'Google sign-in failed');
  }
  const data = await resp.json();
  if (data.token) {
    setToken(data.token);
  }
  return mapBackendUser(data.user);
}

export async function registerUser(payload: {
  name: string;
  email: string;
  password: string;
  otpCode: string;
}): Promise<User> {
  const resp = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body?.error || body?.message || 'Registration failed');
  }
  const data = await resp.json();
  if (data.token) {
    setToken(data.token);
  }
  return mapBackendUser(data.user);
}

export async function getCurrentUser(): Promise<User | null> {
  const headers = getAuthHeaders();
  if (!headers) return null;
  const resp = await fetch(`${API_BASE}/api/auth/me`, { headers });
  if (!resp.ok) return null;
  const data = await resp.json();
  return mapBackendUser(data);
}

export async function getWallet(): Promise<Wallet> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/wallet`, { headers });
  if (!resp.ok) throw new Error('Failed to load wallet');
  const data = await resp.json();
  return {
    aiInterviewCredits: data?.wallet?.aiInterviewCredits ?? 0,
    mentorSessionCredits: data?.wallet?.mentorSessionCredits ?? 0,
  };
}

export async function purchaseCredits(payload: {
  creditType: 'aiInterviewCredits' | 'mentorSessionCredits';
  quantity: number;
}): Promise<Wallet> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/wallet/purchase`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      creditType:
        payload.creditType === 'aiInterviewCredits'
          ? 'AI'
          : 'MENTOR',
      quantity: payload.quantity,
    }),
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body?.error || 'Purchase failed');
  }
  const data = await resp.json();
  return {
    aiInterviewCredits: data?.wallet?.aiInterviewCredits ?? 0,
    mentorSessionCredits: data?.wallet?.mentorSessionCredits ?? 0,
  };
}

export async function getProfile(): Promise<UserProfile> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/profile`, { headers });
  if (!resp.ok) throw new Error('Failed to load profile');
  const data = await resp.json();
  return {
    resumeText: data?.resumeText || '',
    keywords: Array.isArray(data?.keywords) ? data.keywords : [],
    name: data?.name || '',
  };
}

export async function updateProfile(payload: Partial<UserProfile>): Promise<UserProfile> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/profile`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  });
  if (!resp.ok) throw new Error('Failed to update profile');
  const data = await resp.json();
  return {
    resumeText: data?.resumeText || '',
    keywords: Array.isArray(data?.keywords) ? data.keywords : [],
    name: data?.name || '',
  };
}

function mapResume(r: any): ResumeRecord {
  return {
    id: r?._id || r?.id,
    title: r?.title || 'Untitled',
    source: (r?.source || 'TEXT') as any,
    originalFileName: r?.originalFileName,
    resumeText: r?.resumeText || r?.text || '',
    aiContext: r?.aiContext,
    createdAt: r?.createdAt,
    updatedAt: r?.updatedAt,
  };
}

export async function listResumes(): Promise<ResumeRecord[]> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/profile/resumes`, { headers });
  if (!resp.ok) throw new Error('Failed to load resumes');
  const data = await resp.json();
  return (Array.isArray(data) ? data : []).map(mapResume);
}

export async function createResume(payload: {
  title: string;
  resumeText: string;
  source?: 'TEXT' | 'PDF';
  originalFileName?: string;
}): Promise<ResumeRecord> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/profile/resumes`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!resp.ok) throw new Error('Failed to create resume');
  const data = await resp.json();
  return mapResume(data);
}

export async function uploadResume(file: File, title?: string): Promise<ResumeRecord> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');

  // For multipart uploads: do NOT set content-type manually
  const auth = (headers as any).Authorization as string | undefined;
  const fd = new FormData();
  fd.append('file', file);
  if (title) fd.append('title', title);

  const resp = await fetch(`${API_BASE}/api/profile/resumes/upload`, {
    method: 'POST',
    headers: auth ? { Authorization: auth } : undefined,
    body: fd,
  });
  if (!resp.ok) throw new Error('Failed to upload resume');
  const data = await resp.json();
  return mapResume(data);
}

export async function parseJobDescriptionFile(file: File): Promise<string> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const auth = (headers as any).Authorization as string | undefined;
  const fd = new FormData();
  fd.append('file', file);
  const resp = await fetch(`${API_BASE}/api/profile/jd/parse`, {
    method: 'POST',
    headers: auth ? { Authorization: auth } : undefined,
    body: fd,
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body?.error || 'Failed to parse job description');
  }
  const data = await resp.json();
  return data?.text || '';
}

// -------------------------------------------------------------------------------------------------
// Password reset APIs
// -------------------------------------------------------------------------------------------------

/**
 * Initiate a password reset by sending a reset link to the given email. The backend
 * will silently succeed regardless of whether the email exists to prevent account enumeration.
 * @param email Registered user email
 */
export async function forgotPassword(email: string): Promise<void> {
  const resp = await fetch(`${API_BASE}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body?.error || 'Failed to send reset email');
  }
}

/**
 * Complete password reset using the token and userId. This will update the user's
 * password if the token is valid. If the token is invalid or expired, an error is thrown.
 * @param payload Contains userId, token, newPassword
 */
export async function resetPassword(payload: {
  userId: string;
  token: string;
  newPassword: string;
}): Promise<void> {
  const resp = await fetch(`${API_BASE}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body?.error || 'Failed to reset password');
  }
}

export async function requestOtp(email: string, purpose: 'signup' | 'reset'): Promise<void> {
  const resp = await fetch(`${API_BASE}/api/auth/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, purpose }),
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body?.error || 'Failed to send OTP');
  }
}

export async function resetPasswordWithOtp(payload: {
  email: string;
  otpCode: string;
  newPassword: string;
}): Promise<void> {
  const resp = await fetch(`${API_BASE}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body?.error || 'Failed to reset password');
  }
}

export async function createRazorpayOrder(payload: {
  creditType: 'AI' | 'MENTOR';
  quantity: number;
}): Promise<{ order: any; keyId: string }> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/payments/razorpay/order`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body?.error || 'Failed to create order');
  }
  const data = await resp.json();
  return { order: data.order, keyId: data.keyId };
}

export async function createRazorpayBundleOrder(payload: {
  bundleId: string;
}): Promise<{ order: any; keyId: string; credits: number }> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/payments/razorpay/bundle-order`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body?.error || 'Failed to create bundle order');
  }
  const data = await resp.json();
  return { order: data.order, keyId: data.keyId, credits: Number(data.credits || 0) };
}

export async function verifyRazorpayPayment(payload: {
  orderId: string;
  paymentId: string;
  signature: string;
}): Promise<Wallet> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/payments/razorpay/verify`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body?.error || 'Failed to verify payment');
  }
  const data = await resp.json();
  return data.wallet || { aiInterviewCredits: 0, mentorSessionCredits: 0 };
}

export async function updateResume(
  resumeId: string,
  payload: Partial<{ title: string; resumeText: string }>
): Promise<ResumeRecord> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/profile/resumes/${encodeURIComponent(resumeId)}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  });
  if (!resp.ok) throw new Error('Failed to update resume');
  const data = await resp.json();
  return mapResume(data);
}

export async function deleteResume(resumeId: string): Promise<void> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/profile/resumes/${encodeURIComponent(resumeId)}`, {
    method: 'DELETE',
    headers,
  });
  if (!resp.ok) throw new Error('Failed to delete resume');
}

export async function listUsers(): Promise<User[]> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/users`, { headers });
  if (!resp.ok) throw new Error('Failed to load users');
  const data = await resp.json();
  return data.map(mapBackendUser);
}

export async function createUser(
  loginId: string,
  name: string,
  password: string,
  role: 'user' | 'mentor' = 'user'
): Promise<User> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/auth/admin/create-user`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ loginId, name, password, role }),
  });
  if (!resp.ok) throw new Error('Failed to create user');
  const data = await resp.json();
  return mapBackendUser(data);
}

export async function changeUserPassword(userId: number, newPassword: string): Promise<void> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/users/${userId}/password`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ newPassword }),
  });
  if (!resp.ok) throw new Error('Failed to change password');
}

export async function updateUserStatus(userId: string | number, active: boolean): Promise<void> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/users/${userId}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ active }),
  });
  if (!resp.ok) throw new Error('Failed to update user status');
}

export async function adminTopUpCredits(payload: {
  identifier: string;
  aiInterviewCreditsDelta?: number;
  mentorSessionCreditsDelta?: number;
}): Promise<Wallet> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/wallet/topup`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body?.error || 'Failed to top up wallet');
  }
  const data = await resp.json();
  return data.wallet || { aiInterviewCredits: 0, mentorSessionCredits: 0 };
}

export async function deleteUser(userId: number): Promise<void> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/users/${userId}`, {
    method: 'DELETE',
    headers,
  });
  if (!resp.ok) throw new Error('Failed to delete user');
}

export async function listInterviews(): Promise<SavedInterview[]> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/interviews`, { headers });
  if (!resp.ok) throw new Error('Failed to load interviews');
  const data = await resp.json();
  return data.map(mapBackendInterview);
}

export async function createInterview(payload: {
  title: string;
  jobDescription: string;
  resumeText: string;
  scheduledAt: string;
  durationMinutes: number;
  experienceYears: number;
  responseStyle?: string;
  maxLines?: number;
  examples?: { question: string; answer: string }[];
  meetingUrl?: string;
  keywords?: string[];
  additionalInfo?: string;
}): Promise<SavedInterview> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/interviews`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: payload.title,
      jobDescription: payload.jobDescription,
      resumeText: payload.resumeText,
      scheduledAt: payload.scheduledAt,
      durationMinutes: payload.durationMinutes,
      experienceYears: payload.experienceYears,
      responseStyle: payload.responseStyle,
      maxLines: payload.maxLines,
      examples: payload.examples,
      meetingUrl: payload.meetingUrl,
      keywords: payload.keywords,
      additionalInfo: payload.additionalInfo,
    }),
  });
  if (!resp.ok) {
    const errorBody = await resp.json().catch(() => ({}));
    throw new Error(errorBody.error || errorBody.message || 'Failed to create interview');
  }
  const data = await resp.json();
  return mapBackendInterview(data);
}

export async function updateInterview(
  id: string | number,
  payload: {
    title?: string;
    jobDescription?: string;
    resumeText?: string;
    scheduledAt?: string;
    durationMinutes?: number;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
    experienceYears?: number;
    meetingUrl?: string;
  }
): Promise<SavedInterview> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/interviews/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  });
  if (!resp.ok) throw new Error('Failed to update interview');
  const data = await resp.json();
  return mapBackendInterview(data);
}

export async function startInterviewSession(id: string | number): Promise<SavedInterview> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/interviews/${id}/start`, {
    method: 'POST',
    headers,
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body?.error || 'Failed to start interview');
  }
  const data = await resp.json();
  return mapBackendInterview(data);
}

export async function deleteInterview(id: string | number): Promise<void> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/interviews/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!resp.ok) throw new Error('Failed to delete interview');
}

export type InterviewAnswerRecord = {
  id: string;
  questionContext: string;
  answer: string;
  timestamp?: string;
};

export async function getInterviewAnswers(
  interviewId: string | number
): Promise<InterviewAnswerRecord[]> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/interviews/${interviewId}/answers`, {
    headers,
  });
  if (!resp.ok) throw new Error('Failed to load interview answers');
  const data = await resp.json();
  const raw = Array.isArray(data?.answers) ? data.answers : [];
  return raw.map((a: any) => ({
    id: a.id || a._id || '',
    questionContext: a.questionContext || a.question_context || a.question || '',
    answer: a.answer || a.answer_text || a.answerText || '',
    timestamp: a.timestamp,
  }));
}

export async function saveInterviewAnswer(payload: {
  interviewId: string | number;
  question: string;
  answerText: string;
  provider?: AIProvider;
}): Promise<void> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/interviews/${payload.interviewId}/answers`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      question: payload.question,
      answerText: payload.answerText,
      provider: payload.provider ? mapProviderToBackend(payload.provider) : undefined,
    }),
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body?.error || 'Failed to save interview answer');
  }
}

export async function generateInterviewSummary(
  interviewId: string | number,
  provider?: AIProvider
): Promise<{
  summaryText: string;
  summaryData: any;
  summaryTopics: string[];
  summaryUpdatedAt?: string;
}> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/interviews/${interviewId}/summary`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ provider: provider ? mapProviderToBackend(provider) : undefined }),
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body?.error || 'Failed to generate summary');
  }
  return resp.json();
}

function mapMeeting(data: any): Meeting {
  return {
    id: data.id || data._id || '',
    mentorId:
      typeof data.mentorId === 'string'
        ? data.mentorId
        : data.mentorId?.toString?.() || '',
    technology: data.technology,
    studentName: data.studentName || '',
    attendeeId: data.attendeeId ? String(data.attendeeId) : undefined,
    attendeeName: data.attendeeName || undefined,
    scheduledAt: data.scheduledAt ? new Date(data.scheduledAt).toISOString() : '',
    durationMinutes:
      typeof data.durationMinutes === 'number' ? data.durationMinutes : undefined,
    expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : undefined,
    meetingKey: data.meetingKey,
    status: data.status,
    meetingUrl: data.meetingUrl || data.meeting_url || '',
    totalSessionSeconds:
      typeof data.totalSessionSeconds === 'number' ? data.totalSessionSeconds : undefined,
    billedSeconds: typeof data.billedSeconds === 'number' ? data.billedSeconds : undefined,
    transcript: data.transcript,
    sessionStartedAt: data.sessionStartedAt ? new Date(data.sessionStartedAt).toISOString() : undefined,
    sessionEndedAt: data.sessionEndedAt ? new Date(data.sessionEndedAt).toISOString() : undefined,
    summaryText: data.summaryText || data.summary_text || '',
    summaryData: data.summaryData || data.summary_data || null,
    summaryTopics: Array.isArray(data.summaryTopics || data.summary_topics)
      ? (data.summaryTopics || data.summary_topics)
      : [],
    summaryUpdatedAt: data.summaryUpdatedAt || data.summary_updated_at || null,
    createdAt: data.createdAt
      ? new Date(data.createdAt).toISOString()
      : undefined,
    updatedAt: data.updatedAt
      ? new Date(data.updatedAt).toISOString()
      : undefined,
  };
}

export async function createMeeting(payload: {
  technology: string;
  studentName?: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingUrl?: string;
}): Promise<Meeting> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/meetings`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => null);
    throw new Error(body?.error || 'Failed to create meeting');
  }
  const meeting = await resp.json();
  return mapMeeting(meeting);
}

export async function listMyMeetings(): Promise<Meeting[]> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/meetings/my`, {
    headers,
  });
  if (!resp.ok) throw new Error('Failed to load meetings');
  const data = await resp.json();
  return data.map(mapMeeting);
}

export async function listAllMeetingsForAdmin(): Promise<Meeting[]> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/meetings/admin`, { headers });
  if (!resp.ok) throw new Error('Failed to load meetings');
  const data = await resp.json();
  return data.map(mapMeeting);
}

export async function deleteMeeting(id: string | number): Promise<void> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/meetings/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => null);
    throw new Error(body?.error || 'Failed to delete meeting');
  }
}

export async function deleteMeetingAsAdmin(id: string): Promise<void> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/meetings/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!resp.ok) throw new Error('Failed to delete meeting');
}

export async function listPendingMeetingsForAdmin(): Promise<Meeting[]> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/meetings/pending`, {
    headers,
  });
  if (!resp.ok) throw new Error('Failed to load pending meetings');
  const data = await resp.json();
  return data.map(mapMeeting);
}

export async function joinMeeting(meetingKey: string): Promise<Meeting> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/meetings/join`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ meetingKey: meetingKey.trim().toUpperCase() }),
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => null);
    throw new Error(body?.error || 'Failed to join meeting');
  }
  const meeting = await resp.json();
  return mapMeeting(meeting);
}

export async function updateMeetingStatus(
  id: string,
  status: MeetingStatus
): Promise<Meeting> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/meetings/${id}/status`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ status }),
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => null);
    throw new Error(body?.error || 'Failed to update meeting status');
  }
  const meeting = await resp.json();
  return mapMeeting(meeting);
}

export async function updatePendingMeeting(
  id: string,
  payload: {
    scheduledAt?: string;
    technology?: string;
    studentName?: string;
    durationMinutes?: number;
    meetingUrl?: string;
  }
): Promise<Meeting> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/meetings/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => null);
    throw new Error(body?.error || 'Failed to update meeting');
  }
  const meeting = await resp.json();
  return mapMeeting(meeting);
}

export async function updateMeetingByAdmin(
  id: string,
  payload: { status?: 'APPROVED' | 'REJECTED'; scheduledAt?: string }
): Promise<Meeting> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/meetings/${id}/admin`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => null);
    throw new Error(body?.error || 'Failed to update meeting');
  }
  const data = await resp.json();
  return mapMeeting(data);
}

export async function getMeetingTranscript(id: string): Promise<string> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/meetings/${id}/transcript`, { headers });
  if (!resp.ok) {
    throw new Error('Failed to fetch transcript');
  }
  const data = await resp.json();
  return data.transcript || '';
}

export async function generateMeetingSummary(
  meetingId: string,
  provider?: AIProvider
): Promise<{
  summaryText: string;
  summaryData: any;
  summaryTopics: string[];
  summaryUpdatedAt?: string;
}> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/meetings/${meetingId}/summary`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ provider: provider ? mapProviderToBackend(provider) : undefined }),
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body?.error || 'Failed to generate summary');
  }
  return resp.json();
}

export async function getMeetingById(id: string): Promise<Meeting> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/meetings/${id}`, { headers });
  if (!resp.ok) throw new Error('Failed to fetch meeting');
  const data = await resp.json();
  return mapMeeting(data);
}

export async function recordMeetingSessionUsage(
  meetingId: string,
  payload: { seconds?: number; finalize?: boolean; startedAt?: string; endedAt?: string }
) {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/meetings/${meetingId}/session`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload || {}),
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body?.error || 'Failed to record mentor session usage');
  }
  return resp.json();
}

// Admin settings

// Admin settings type imported from ../types


export async function getAdminSettings(): Promise<AdminSettings> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/admin/settings`, { headers });
  if (!resp.ok) throw new Error('Failed to load admin settings');
  const data = await resp.json();
  const provider = (data.default_provider || 'openai') as string;
  let mapped: AIProvider = 'OPENAI';
  if (provider === 'gemini') mapped = 'GEMINI';
  if (provider === 'deepseek') mapped = 'DEEPSEEK';
  return {
    defaultProvider: mapped,
    hasOpenaiKey: !!data.has_openai_key,
    hasGeminiKey: !!data.has_gemini_key,
    hasDeepseekKey: !!data.has_deepseek_key,
    hasDeepgramKey: !!data.has_deepgram_key,
    hasRazorpayKey: !!data.has_razorpay_key,
    supportPhone: data.support_phone || null,
    contactLocation: data.contact_location || null,
    openaiKeyMasked: data.openai_key_masked || null,
    geminiKeyMasked: data.gemini_key_masked || null,
    deepseekKeyMasked: data.deepseek_key_masked || null,
    deepgramKeyMasked: data.deepgram_key_masked || null,
    razorpayKeyMasked: data.razorpay_key_masked || null,
    openaiKeyLength: typeof data.openai_key_length === 'number' ? data.openai_key_length : null,
    geminiKeyLength: typeof data.gemini_key_length === 'number' ? data.gemini_key_length : null,
    deepseekKeyLength: typeof data.deepseek_key_length === 'number' ? data.deepseek_key_length : null,
    deepgramKeyLength: typeof data.deepgram_key_length === 'number' ? data.deepgram_key_length : null,
    openaiModel: data.openai_model || null,
    geminiModel: data.gemini_model || null,
    deepseekModel: data.deepseek_model || null,
    aiCreditPrice: typeof data.ai_credit_price === 'number' ? data.ai_credit_price : null,
    mentorCreditPrice: typeof data.mentor_credit_price === 'number' ? data.mentor_credit_price : null,
    minCreditPurchase: typeof data.min_credit_purchase === 'number' ? data.min_credit_purchase : null,
    freeTrialAiCredits:
      typeof data.free_trial_ai_credits === 'number' ? data.free_trial_ai_credits : null,
    freeTrialMentorCredits:
      typeof data.free_trial_mentor_credits === 'number' ? data.free_trial_mentor_credits : null,
    sessionGraceMinutes:
      typeof data.session_grace_minutes === 'number' ? data.session_grace_minutes : null,
    sessionHardStopEnabled:
      typeof data.session_hard_stop_enabled === 'boolean' ? data.session_hard_stop_enabled : null,
  };
}

export async function saveAdminSettings(payload: {
  defaultProvider?: AIProvider;
  openaiApiKey?: string;
  geminiApiKey?: string;
  deepseekApiKey?: string;
  deepgramApiKey?: string;
  openaiModel?: string;
  geminiModel?: string;
  deepseekModel?: string;
  supportPhone?: string;
  contactLocation?: string | null;
  aiCreditPrice?: number;
  mentorCreditPrice?: number;
  minCreditPurchase?: number;
  freeTrialAiCredits?: number | null;
  freeTrialMentorCredits?: number | null;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  sessionGraceMinutes?: number;
  sessionHardStopEnabled?: boolean;
}): Promise<AdminSettings> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');

  let backendProvider: string | undefined;
  if (payload.defaultProvider) {
    backendProvider = mapProviderToBackend(payload.defaultProvider);
  }

  const resp = await fetch(`${API_BASE}/api/admin/settings`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      defaultProvider: backendProvider,
      openaiApiKey: payload.openaiApiKey,
      geminiApiKey: payload.geminiApiKey,
      deepseekApiKey: payload.deepseekApiKey,
      deepgramApiKey: payload.deepgramApiKey,
      openaiModel: payload.openaiModel,
      geminiModel: payload.geminiModel,
      deepseekModel: payload.deepseekModel,
      supportPhone: payload.supportPhone,
      contactLocation: payload.contactLocation,
      aiCreditPrice: payload.aiCreditPrice,
      mentorCreditPrice: payload.mentorCreditPrice,
      minCreditPurchase: payload.minCreditPurchase,
      freeTrialAiCredits: payload.freeTrialAiCredits,
      freeTrialMentorCredits: payload.freeTrialMentorCredits,
      razorpayKeyId: payload.razorpayKeyId,
      razorpayKeySecret: payload.razorpayKeySecret,
      sessionGraceMinutes: payload.sessionGraceMinutes,
      sessionHardStopEnabled: payload.sessionHardStopEnabled,
    }),
  });
  if (!resp.ok) throw new Error('Failed to save admin settings');
  return getAdminSettings();
}

export async function getDefaultProvider(): Promise<AIProvider> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/config/provider`, { headers });
  if (!resp.ok) throw new Error('Failed to load provider');
  const data = await resp.json();
  const provider = (data.defaultProvider || 'openai') as string;
  if (provider === 'gemini') return 'GEMINI';
  if (provider === 'deepseek') return 'DEEPSEEK';
  return 'OPENAI';
}

// AI generation via backend

export async function generateAIResponse(
  provider: AIProvider,
  messages: ChatMessage[]
): Promise<string> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/ai/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      provider: mapProviderToBackend(provider),
      messages,
    }),
  });
  if (!resp.ok) throw new Error('AI generation failed');
  const data = await resp.json();
  return data.output;
}

export async function getDeepgramKey(): Promise<string> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/deepgram/key`, { headers });
  if (!resp.ok) throw new Error('Deepgram key not available');
  const data = await resp.json();
  return data.deepgramApiKey;
}

export async function recordSessionUsage(
  interviewId: string | number,
  payload: { seconds?: number; finalize?: boolean; startedAt?: string; endedAt?: string }
) {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/interviews/${interviewId}/session`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload || {})
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to record session usage');
  }
  return resp.json();
}

export async function getSupportContact(): Promise<string | null> {
  try {
    const resp = await fetch(`${API_BASE}/api/config/support-contact`);
    if (!resp.ok) throw new Error('Failed to load support contact');
    const data = await resp.json();
    return data.supportPhone || null;
  } catch (err) {
    console.error('Failed to retrieve support contact', err);
    return null;
  }
}

export async function getCreditPricing(): Promise<{ aiCreditPrice: number; mentorCreditPrice: number; minCreditPurchase: number }> {
  try {
    const resp = await fetch(`${API_BASE}/api/config/pricing`);
    if (!resp.ok) throw new Error('Failed to load credit pricing');
    const data = await resp.json();
    return {
      aiCreditPrice: typeof data.aiCreditPrice === 'number' ? data.aiCreditPrice : 5,
      mentorCreditPrice: typeof data.mentorCreditPrice === 'number' ? data.mentorCreditPrice : 15,
      minCreditPurchase: typeof data.minCreditPurchase === 'number' ? data.minCreditPurchase : 120,
    };
  } catch (err) {
    console.error('Failed to retrieve credit pricing', err);
    return { aiCreditPrice: 5, mentorCreditPrice: 15, minCreditPurchase: 120 };
  }
}

export async function resetAdminCredentials(payload: {
  loginId: string;
  password: string;
  name?: string;
  resetKey?: string;
}) {
  const resp = await fetch(`${API_BASE}/api/admin/reset-credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to reset admin credentials');
  }
  return resp.json();
}

export async function submitContactForm(payload: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const resp = await fetch(`${API_BASE}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to submit message');
  }
  return resp.json();
}

export async function listContactSubmissions(): Promise<ContactSubmissionRecord[]> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/admin/contact-submissions`, { headers });
  if (!resp.ok) throw new Error('Failed to load contact submissions');
  const data = await resp.json();
  return data.map((entry: any) => ({
    id: entry.id,
    name: entry.name,
    email: entry.email,
    subject: entry.subject,
    message: entry.message,
    createdAt: entry.created_at,
  }));
}

export async function deleteContactSubmission(id: string): Promise<void> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/admin/contact-submissions/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!resp.ok) throw new Error('Failed to delete contact submission');
}

// -------------------------------------------------------------------------------------------------
// Payments & History APIs
// -------------------------------------------------------------------------------------------------

// Payment history records returned from the backend. These fields mirror the
// PaymentIntent schema in the backend and optionally include user info for
// admin queries.
export interface PaymentHistoryRecord {
  _id?: string;
  userId?: string;
  orderId: string;
  amount: number;
  currency: string;
  creditType: 'AI' | 'MENTOR';
  quantity: number;
  status: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  createdAt?: string;
  updatedAt?: string;
  // Admin-only: user info for each payment
  user?: {
    id: string;
    loginId: string;
    email: string;
    name: string;
  } | null;
}

/**
 * Fetch payment history for the currently authenticated user. This calls
 * GET /api/payments/history and returns an array of PaymentHistoryRecord.
 */
export async function getPaymentHistory(): Promise<PaymentHistoryRecord[]> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/payments/history`, {
    method: 'GET',
    headers,
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body?.error || 'Failed to fetch payment history');
  }
  const data = await resp.json();
  return Array.isArray(data?.history) ? data.history : [];
}

/**
 * Fetch payment history for admin (all users). This calls
 * GET /api/payments/admin/history and returns an array of PaymentHistoryRecord
 * with attached user info for each record.
 */
export async function getAdminPaymentHistory(): Promise<PaymentHistoryRecord[]> {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/payments/admin/history`, {
    method: 'GET',
    headers,
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body?.error || 'Failed to fetch payment history');
  }
  const data = await resp.json();
  return Array.isArray(data?.history) ? data.history : [];
}

// -------------------------------------------------------------------------------------------------
// Public content (blogs, testimonials, FAQs, site info)
// -------------------------------------------------------------------------------------------------

export async function fetchBlogPosts(tag?: string) {
  const url = new URL(`${API_BASE}/api/content/blog-posts`);
  if (tag) url.searchParams.set('tag', tag);
  const resp = await fetch(url.toString());
  if (!resp.ok) return [];
  return resp.json();
}

export async function fetchTestimonials() {
  const resp = await fetch(`${API_BASE}/api/content/testimonials`);
  if (!resp.ok) return [];
  return resp.json();
}

export async function fetchFaqs() {
  const resp = await fetch(`${API_BASE}/api/content/faqs`);
  if (!resp.ok) return [];
  return resp.json();
}

export async function fetchSiteInfo() {
  const resp = await fetch(`${API_BASE}/api/content/site-info`);
  if (!resp.ok) return null;
  return resp.json();
}

// -------------------------------------------------------------------------------------------------
// Admin content management
// -------------------------------------------------------------------------------------------------

export async function adminListBlogPosts() {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/admin/content/blog-posts`, { headers });
  if (!resp.ok) throw new Error('Failed to load blog posts');
  return resp.json();
}

export async function adminSaveBlogPost(post: any) {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const hasId = Boolean(post.id || post._id);
  const method = hasId ? 'PUT' : 'POST';
  const url = hasId
    ? `${API_BASE}/api/admin/content/blog-posts/${post.id || post._id}`
    : `${API_BASE}/api/admin/content/blog-posts`;
  const resp = await fetch(url, { method, headers, body: JSON.stringify(post) });
  if (!resp.ok) throw new Error('Failed to save blog post');
  return resp.json();
}

export async function adminDeleteBlogPost(id: string) {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/admin/content/blog-posts/${id}`, { method: 'DELETE', headers });
  if (!resp.ok) throw new Error('Failed to delete blog post');
  return true;
}

export async function adminListTestimonials() {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/admin/content/testimonials`, { headers });
  if (!resp.ok) throw new Error('Failed to load testimonials');
  return resp.json();
}

export async function adminSaveTestimonial(item: any) {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const hasId = Boolean(item.id || item._id);
  const method = hasId ? 'PUT' : 'POST';
  const url = hasId
    ? `${API_BASE}/api/admin/content/testimonials/${item.id || item._id}`
    : `${API_BASE}/api/admin/content/testimonials`;
  const resp = await fetch(url, { method, headers, body: JSON.stringify(item) });
  if (!resp.ok) throw new Error('Failed to save testimonial');
  return resp.json();
}

export async function adminDeleteTestimonial(id: string) {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/admin/content/testimonials/${id}`, { method: 'DELETE', headers });
  if (!resp.ok) throw new Error('Failed to delete testimonial');
  return true;
}

export async function adminListFaqs() {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/admin/content/faqs`, { headers });
  if (!resp.ok) throw new Error('Failed to load FAQs');
  return resp.json();
}

export async function adminSaveFaq(item: any) {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const hasId = Boolean(item.id || item._id);
  const method = hasId ? 'PUT' : 'POST';
  const url = hasId
    ? `${API_BASE}/api/admin/content/faqs/${item.id || item._id}`
    : `${API_BASE}/api/admin/content/faqs`;
  const resp = await fetch(url, { method, headers, body: JSON.stringify(item) });
  if (!resp.ok) throw new Error('Failed to save FAQ');
  return resp.json();
}

export async function adminDeleteFaq(id: string) {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/admin/content/faqs/${id}`, { method: 'DELETE', headers });
  if (!resp.ok) throw new Error('Failed to delete FAQ');
  return true;
}

export async function adminGetSiteInfo() {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/admin/content/site-info`, { headers });
  if (!resp.ok) throw new Error('Failed to load site info');
  return resp.json();
}

export async function adminUpdateSiteInfo(payload: any) {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/admin/content/site-info`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  });
  if (!resp.ok) throw new Error('Failed to update site info');
  return resp.json();
}

export async function adminUploadImage(file: File) {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const form = new FormData();
  form.append('file', file);
  const resp = await fetch(`${API_BASE}/api/admin/content/upload-image`, {
    method: 'POST',
    headers: { Authorization: headers.Authorization },
    body: form as any,
  });
  if (!resp.ok) throw new Error('Failed to upload image');
  return resp.json();
}

export async function fetchPricingBundles() {
  const resp = await fetch(`${API_BASE}/api/content/pricing-bundles`);
  if (!resp.ok) return [];
  return resp.json();
}

export async function adminListPricingBundles() {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/admin/content/pricing-bundles`, { headers });
  if (!resp.ok) throw new Error('Failed to load pricing bundles');
  return resp.json();
}

export async function adminSavePricingBundle(bundle: any) {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const hasId = Boolean(bundle.id || bundle._id);
  const method = hasId ? 'PUT' : 'POST';
  const url = hasId
    ? `${API_BASE}/api/admin/content/pricing-bundles/${bundle.id || bundle._id}`
    : `${API_BASE}/api/admin/content/pricing-bundles`;
  const resp = await fetch(url, { method, headers, body: JSON.stringify(bundle) });
  if (!resp.ok) throw new Error('Failed to save pricing bundle');
  return resp.json();
}

export async function adminDeletePricingBundle(id: string) {
  const headers = getAuthHeaders();
  if (!headers) throw new Error('Not authenticated');
  const resp = await fetch(`${API_BASE}/api/admin/content/pricing-bundles/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!resp.ok) throw new Error('Failed to delete pricing bundle');
  return true;
}
