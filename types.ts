export type AIProvider = 'GEMINI' | 'OPENAI' | 'DEEPSEEK';

export interface Wallet {
  aiInterviewCredits: number;
  mentorSessionCredits: number;
}

export interface User {
  // Backend-authenticated fields
  id?: string | number;
  loginId?: string;
  email?: string | null;
  name?: string;
  role?: 'admin' | 'user' | 'mentor';
  active?: boolean;
  createdAt?: string | number;
  wallet?: Wallet;
  avatarUrl?: string;

  // Legacy local-only fields (used in older admin dashboard logic)
  username?: string;
  fullName?: string;
  password?: string;
}

export interface ExamplePair {
  question: string;
  answer: string;
}

export interface UserPreferences {
  resumeText: string;
  jobDescription: string;
  responseStyle: string;
  maxLines: number;
  examples: ExamplePair[];
  aiProvider: AIProvider;
  yearsOfExperience: number;
  interviewId: string | number;
  durationMinutes: number;
  sessionSecondsUsed: number;
  scheduledAt: string;
}

export type InterviewStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'CANCELLED'
  // legacy
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';

export interface SavedInterview {
  id: number | string;
  title: string;
  resumeText: string;
  jobDescription: string;
  responseStyle: string;
  maxLines: number;
  examples: ExamplePair[];
  status: InterviewStatus;
  scheduledAt: string; // ISO Date String
  durationMinutes: number; // Duration in minutes
  expiresAt?: string;
  sessionSecondsUsed: number;
  yearsOfExperience: number;
  createdBy?: string; // loginId
  userId?: string | number;
  resumeId?: string; // NEW (optional): links back to a saved resume
  meetingUrl?: string;
  keywords?: string[];
  additionalInfo?: string;
  sessionStartedAt?: string;
  sessionEndedAt?: string;
  summaryText?: string;
  summaryData?: Record<string, any> | null;
  summaryTopics?: string[];
  summaryUpdatedAt?: string | null;
}

export type MeetingStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'EXPIRED'
  // legacy
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';

export interface Meeting {
  id: string;
  mentorId: string;
  technology: string;
  studentName: string;
  attendeeId?: string;
  attendeeName?: string;
  scheduledAt: string;
  durationMinutes?: number;
  expiresAt?: string;
  meetingKey: string;
  status: MeetingStatus;
  meetingUrl?: string;
  totalSessionSeconds?: number;
  billedSeconds?: number;
  transcript?: string;
  sessionStartedAt?: string;
  sessionEndedAt?: string;
  summaryText?: string;
  summaryData?: Record<string, any> | null;
  summaryTopics?: string[];
  summaryUpdatedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface InterviewResponse {
  id: string;
  questionContext: string;
  answer: string;
  timestamp: Date;
  isLoading?: boolean;
}

export type ResumeSource = 'TEXT' | 'PDF';

export interface ResumeAIContext {
  summary?: string;
  skills?: string[];
  extractedAt?: string;
}

export interface BlogPost {
  id?: string;
  _id?: string;
  title: string;
  heroImage?: string;
  content?: string;
  bullets?: string[];
  tags?: string[];
  status?: 'featured' | 'latest' | 'standard';
  createdAt?: string;
}

export interface Testimonial {
  id?: string;
  _id?: string;
  name: string;
  role?: string;
  company?: string;
  quote: string;
  photoUrl?: string;
  rating?: number;
}

export interface Faq {
  id?: string;
  _id?: string;
  question: string;
  answer: string;
}

export interface SiteInfo {
  supportPhone?: string;
  contactEmail?: string;
  contactLocation?: string;
  businessHours?: string[];
  whatsappNumber?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  youtubeUrl?: string;
  chromeExtensionUrl?: string;
  footerTagline?: string;
  freeTrialAiCredits?: number;
  freeTrialMentorCredits?: number;
  sessionGraceMinutes?: number;
}

export interface PricingBundle {
  id?: string;
  _id?: string;
  name: string;
  priceInr: number;
  credits: number;
  bonusCredits?: number;
  description?: string;
  features?: string[];
  popular?: boolean;
  tag?: string;
  displayOrder?: number;
  showOnLanding?: boolean;
  offerDiscountPercent?: number;
  offerBonusCredits?: number;
  offerStart?: string;
  offerEnd?: string;
  offerBadge?: string;
}

export interface ResumeRecord {
  id: string;
  title: string;
  source: ResumeSource;
  originalFileName?: string;
  resumeText: string;
  aiContext?: ResumeAIContext;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Payment history records returned from the backend. These fields mirror the
 * PaymentIntent schema in the backend and optionally include user info for
 * admin queries. This type is duplicated here (from services/backendApi) so
 * that frontend components can import it from the central types file.
 */
export interface PaymentHistoryRecord {
  _id?: string;
  userId?: string;
  orderId: string;
  amount: number;
  currency: string;
  creditType: 'AI' | 'MENTOR';
  quantity: number;
  purchaseType?: 'credits' | 'bundle';
  bundleId?: string;
  bundleName?: string;
  bundleCredits?: number;
  bundleBonusCredits?: number;
  bundleOfferDiscountPercent?: number;
  bundleOfferBonusCredits?: number;
  bundlePriceInr?: number;
  bundleFinalPriceInr?: number;
  bundleOfferBadge?: string;
  status: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  createdAt?: string;
  updatedAt?: string;
  /**
   * Admin-only: attached user info for each payment. This will only be
   * populated when fetching payment history as an admin.
   */
  user?: {
    id: string;
    loginId: string;
    email: string;
    name: string;
  } | null;
}

export enum AppState {
  LANDING = 'LANDING',
  DASHBOARD = 'DASHBOARD',
  PROFILE = 'PROFILE',
  SESSION = 'SESSION',
  FEATURES = 'FEATURES',
  HOW_IT_WORKS = 'HOW_IT_WORKS',
  PRIVACY = 'PRIVACY',
  TERMS = 'TERMS',
  CONTACT = 'CONTACT',
  BLOG = 'BLOG',
  PRICING = 'PRICING',
  ADMIN_LOGIN = 'ADMIN_LOGIN',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  JOIN_MEETING = 'JOIN_MEETING',
  MEETING_TRANSCRIPTION_MENTOR = 'MEETING_TRANSCRIPTION_MENTOR',
  MEETING_TRANSCRIPTION_LEARNER = 'MEETING_TRANSCRIPTION_LEARNER',
  USER_LOGIN = 'USER_LOGIN',
  USER_SIGNUP = 'USER_SIGNUP',
  ABOUT_US = 'ABOUT_US',
  RESPONSIBLE_AI = 'RESPONSIBLE_AI',
  ADMIN_RESET_PASSWORD = 'ADMIN_RESET_PASSWORD',
  COPILOT_CONSOLE = 'COPILOT_CONSOLE',

  /**
   * Dedicated page for scheduling an AI interview. This page renders
   * the full schedule form separate from the dashboard tabs. See
   * ScheduleInterviewPage.tsx for implementation.
   */
  SCHEDULE_INTERVIEW = 'SCHEDULE_INTERVIEW',

  /**
   * Dedicated page for creating a mentor session. This page renders
   * the full create form separate from the dashboard tabs. See
   * CreateSessionPage.tsx for implementation.
   */
  CREATE_SESSION = 'CREATE_SESSION',

  /**
   * Dedicated page for purchasing credits (AI and Mentor). Users can choose quantities
   * and complete checkout via Razorpay. See PurchaseCreditsPage.tsx.
   */
  BUY_AI_CREDITS = 'BUY_AI_CREDITS',

  /**
   * Legacy alias for the unified credits page. Routes to the same Credits view
   * as BUY_AI_CREDITS for backward compatibility.
   */
  BUY_MENTOR_CREDITS = 'BUY_MENTOR_CREDITS',

  /**
   * Dedicated page showing the authenticated user's payment history. This page
   * lists all wallet top-ups and transactions. See PaymentHistoryPage.tsx.
   */
  PAYMENT_HISTORY = 'PAYMENT_HISTORY',

  /**
   * Admin-only page showing payment history across all users. This view
   * aggregates all wallet top-ups for auditing. See AdminPaymentHistoryPage.tsx.
   */
  ADMIN_PAYMENT_HISTORY = 'ADMIN_PAYMENT_HISTORY',

  /**
   * Public page where users can request a password reset email by providing
   * their registered email address.
   */
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',

  /**
   * Public page to reset the password. Expects a token and userId in
   * the query parameters. A form is presented for entering the new
   * password.
   */
  RESET_PASSWORD = 'RESET_PASSWORD',

  /**
   * Public redirector for Chrome extension auth. This route forwards
   * to the extension redirect URL if a token is available.
   */
  EXTENSION_AUTH = 'EXTENSION_AUTH',
}

export interface ContactSubmissionRecord {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}

export interface AdminSettings {
  defaultProvider: AIProvider;
  hasOpenaiKey: boolean;
  hasGeminiKey: boolean;
  hasDeepseekKey: boolean;
  hasDeepgramKey: boolean;
  hasRazorpayKey?: boolean;
  supportPhone?: string | null;
  openaiKeyMasked?: string | null;
  geminiKeyMasked?: string | null;
  deepseekKeyMasked?: string | null;
  deepgramKeyMasked?: string | null;
  razorpayKeyMasked?: string | null;
  openaiKeyLength?: number | null;
  geminiKeyLength?: number | null;
  deepseekKeyLength?: number | null;
  deepgramKeyLength?: number | null;
  openaiModel?: string | null;
  geminiModel?: string | null;
  deepseekModel?: string | null;
  aiCreditPrice?: number | null;
  mentorCreditPrice?: number | null;
  minCreditPurchase?: number | null;
  freeTrialAiCredits?: number | null;
  freeTrialMentorCredits?: number | null;
  sessionGraceMinutes?: number | null;
  sessionHardStopEnabled?: boolean | null;
}
