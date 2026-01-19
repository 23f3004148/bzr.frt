
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiActivity,
  FiBarChart2,
  FiClock,
  FiCpu,
  FiCreditCard,
  FiFileText,
  FiGrid,
  FiHeadphones,
  FiLock,
  FiSettings,
  FiShield,
  FiTrendingUp,
  FiUnlock,
  FiUserCheck,
  FiUsers,
} from 'react-icons/fi';
import {
  AppState,
  AIProvider,
  SavedInterview,
  User,
  ContactSubmissionRecord,
  Meeting,
  BlogPost,
  Testimonial,
  Faq,
  SiteInfo,
  PricingBundle,
  PaymentHistoryRecord,
} from '../types';
import { Button } from './Button';
import AppShell from './layout/AppShell';
import { LineChart, StackedBarChart } from './admin/Charts';
import { jsPDF } from 'jspdf';
import { useFlash } from './FlashMessage';
import {
  getAdminSettings,
  saveAdminSettings,
  listInterviews,
  updateInterview,
  listUsers,
  deleteUser,
  changeUserPassword,
  listContactSubmissions,
  deleteContactSubmission,
  deleteInterview,
  listAllMeetingsForAdmin,
  deleteMeetingAsAdmin,
  updateMeetingByAdmin,
  adminTopUpCredits,
  updateUserStatus,
  adminListBlogPosts,
  adminSaveBlogPost,
  adminDeleteBlogPost,
  adminListTestimonials,
  adminSaveTestimonial,
  adminDeleteTestimonial,
  adminListFaqs,
  adminSaveFaq,
  adminDeleteFaq,
  adminGetSiteInfo,
  adminUpdateSiteInfo,
  adminUploadImage,
  adminListPricingBundles,
  adminSavePricingBundle,
  adminDeletePricingBundle,
  generateInterviewSummary,
  generateMeetingSummary,
  getInterviewAnswers,
  getMeetingTranscript,
  getAdminPaymentHistory,
  resolveMediaUrl,
} from '../services/backendApi';

const OPENAI_MODEL_OPTIONS = ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini', 'o3-mini'];
const GEMINI_MODEL_OPTIONS = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-pro'];
const DEEPSEEK_MODEL_OPTIONS = ['deepseek-chat'];

interface PageProps {
  onLogin: () => void;
  onNavigate: (state: AppState) => void;
  onLogout: () => void;
  onProviderChange: (provider: AIProvider) => void;
  currentProvider: AIProvider | null;
  onBack: () => void;
}

type InterviewRow = SavedInterview & { candidateName: string };
type OverviewInterviewRow = InterviewRow & {
  ownerName: string;
  ownerRole: User['role'] | 'user';
};
type UserActionType = 'DELETE' | 'RESET_PASSWORD' | 'TOGGLE_ACTIVE';
type UserActionDialogState = {
  type: UserActionType;
  user: User;
  nextActive: boolean;
};

const mapMeetingToOverviewRow = (meeting: Meeting): OverviewInterviewRow => {
  const scheduled = meeting.scheduledAt || '';
  return {
    id: meeting.id,
    title: meeting.technology || 'Mentor Meeting',
    resumeText: '',
    jobDescription: '',
    responseStyle: 'Simple English',
    maxLines: 0,
    examples: [],
    status: meeting.status,
    scheduledAt: scheduled,
    durationMinutes: 0,
    sessionSecondsUsed: 0,
    createdBy: meeting.studentName,
    userId: undefined,
    candidateName: meeting.studentName,
    ownerName: meeting.studentName,
    ownerRole: 'mentor',
    updatedAt: meeting.updatedAt || meeting.createdAt || scheduled,
  };
};

export const AdminDashboard: React.FC<PageProps> = ({
  onLogin,
  onNavigate,
  onLogout,
  currentProvider,
  onBack,
  onProviderChange,
}) => {
const [activeTab, setActiveTab] = useState<
    | 'OVERVIEW'
    | 'CREDITS'
    | 'USERS'
    | 'SUPPORT'
    | 'INTERVIEW_HISTORY'
    | 'MENTOR_HISTORY'
    | 'SETTINGS'
    | 'CONTENT'
    | 'PAYMENTS'
  >('OVERVIEW');

  // Provider / API key state
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(currentProvider || 'OPENAI');
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [deepSeekKey, setDeepSeekKey] = useState('');
  const [deepgramKey, setDeepgramKey] = useState('');
  const [openaiKeyDirty, setOpenaiKeyDirty] = useState(false);
  const [geminiKeyDirty, setGeminiKeyDirty] = useState(false);
  const [deepSeekKeyDirty, setDeepSeekKeyDirty] = useState(false);
  const [deepgramKeyDirty, setDeepgramKeyDirty] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [openaiModel, setOpenaiModel] = useState(OPENAI_MODEL_OPTIONS[0]);
  const [openaiModelCustom, setOpenaiModelCustom] = useState('');
  const [geminiModel, setGeminiModel] = useState(GEMINI_MODEL_OPTIONS[0]);
  const [geminiModelCustom, setGeminiModelCustom] = useState('');
  const [deepseekModel, setDeepseekModel] = useState(DEEPSEEK_MODEL_OPTIONS[0]);
  const [deepseekModelCustom, setDeepseekModelCustom] = useState('');
  const [aiCreditPrice, setAiCreditPrice] = useState<number>(5);
  const [mentorCreditPrice, setMentorCreditPrice] = useState<number>(15);
  const [minCreditPurchase, setMinCreditPurchase] = useState<number>(120);
  const [freeTrialAiCredits, setFreeTrialAiCredits] = useState<number>(0);
  const [freeTrialMentorCredits, setFreeTrialMentorCredits] = useState<number>(0);
  const [sessionGraceMinutes, setSessionGraceMinutes] = useState<number>(3);
  const [sessionHardStopEnabled, setSessionHardStopEnabled] = useState<boolean>(true);
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('');
  const [razorpayKeysDirty, setRazorpayKeysDirty] = useState(false);
  const [topupIdentifier, setTopupIdentifier] = useState('');
  const [topupAiCredits, setTopupAiCredits] = useState('');
  const [topupMentorCredits, setTopupMentorCredits] = useState('');
  const [topupMessage, setTopupMessage] = useState<string | null>(null);
  const [topupLoading, setTopupLoading] = useState(false);
  const [pricingMessage, setPricingMessage] = useState<string | null>(null);
  const [pricingSaving, setPricingSaving] = useState(false);
  const [userSuccessMessage, setUserSuccessMessage] = useState<string | null>(null);
  const [userStatusUpdatingId, setUserStatusUpdatingId] = useState<string | number | null>(null);
  const [userActionDialog, setUserActionDialog] = useState<UserActionDialogState | null>(null);
  const [userActionLoading, setUserActionLoading] = useState(false);
  const [userActionPassword, setUserActionPassword] = useState('');
  const { showFlash } = useFlash();
  const flashWarning = useCallback(
    (message: string) => showFlash(message, 'warning'),
    [showFlash]
  );
  const flashError = useCallback(
    (message: string) => showFlash(message, 'error'),
    [showFlash]
  );
  const flashInfo = useCallback(
    (message: string) => showFlash(message, 'info'),
    [showFlash]
  );
  const handleOpenaiKeyChange = (value: string) => {
    setOpenaiKey(value);
    setOpenaiKeyDirty(true);
  };

  const handleGeminiKeyChange = (value: string) => {
    setGeminiKey(value);
    setGeminiKeyDirty(true);
  };

  const handleDeepSeekKeyChange = (value: string) => {
    setDeepSeekKey(value);
    setDeepSeekKeyDirty(true);
  };

  const handleDeepgramKeyChange = (value: string) => {
    setDeepgramKey(value);
    setDeepgramKeyDirty(true);
  };

  // Data state
  const [allInterviews, setAllInterviews] = useState<SavedInterview[]>([]);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [contactSubmissions, setContactSubmissions] = useState<ContactSubmissionRecord[]>([]);
  const [contactLoading, setContactLoading] = useState(false);
  const [whatsappVisible, setWhatsappVisible] = useState(false);
  const [supportPhone, setSupportPhone] = useState<string | null>(null);
  const [supportSaving, setSupportSaving] = useState(false);
  const [supportMessage, setSupportMessage] = useState<string | null>(null);
  const [contactCsvExporting, setContactCsvExporting] = useState(false);
  const [contactDeleting, setContactDeleting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [selectedInterviewIds, setSelectedInterviewIds] = useState<string[]>([]);
  const [selectedMeetingIds, setSelectedMeetingIds] = useState<string[]>([]);
  const [interviewSummaries, setInterviewSummaries] = useState<Record<string, string>>({});
  const [meetingSummaries, setMeetingSummaries] = useState<Record<string, string>>({});
  const [interviewSummaryLoadingId, setInterviewSummaryLoadingId] = useState<string | null>(null);
  const [meetingSummaryLoadingId, setMeetingSummaryLoadingId] = useState<string | null>(null);
  const [interviewBulkSummarizing, setInterviewBulkSummarizing] = useState(false);
  const [meetingBulkSummarizing, setMeetingBulkSummarizing] = useState(false);
  const [allMeetings, setAllMeetings] = useState<Meeting[]>([]);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryRecord[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  // Content management state
  const [contentLoading, setContentLoading] = useState(false);
  const [contentMessage, setContentMessage] = useState<string | null>(null);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [editingBlog, setEditingBlog] = useState<Partial<BlogPost> | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [editingTestimonial, setEditingTestimonial] = useState<Partial<Testimonial> | null>(null);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [editingFaq, setEditingFaq] = useState<Partial<Faq> | null>(null);
  const [siteInfo, setSiteInfo] = useState<SiteInfo>({});
  const [pricingBundles, setPricingBundles] = useState<PricingBundle[]>([]);
  const [editingBundle, setEditingBundle] = useState<Partial<PricingBundle> | null>(null);
  const [pendingMentorMeetings, setPendingMentorMeetings] = useState<Meeting[]>([]);
  const [pendingMeetingsLoading, setPendingMeetingsLoading] = useState(false);
  const [interviewExportingPdf, setInterviewExportingPdf] = useState(false);
  const [meetingExportingPdf, setMeetingExportingPdf] = useState(false);
  const [interviewCsvExporting, setInterviewCsvExporting] = useState(false);
  const [meetingCsvExporting, setMeetingCsvExporting] = useState(false);
  const [processingInterviewDeletion, setProcessingInterviewDeletion] = useState(false);
  const [processingMeetingDeletion, setProcessingMeetingDeletion] = useState(false);
  const [countryCode, setCountryCode] = useState('+91');
  const [localNumber, setLocalNumber] = useState('');

  const syncModelValue = (
    value: string | null | undefined,
    options: string[],
    setOption: React.Dispatch<React.SetStateAction<string>>,
    setCustom: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (value && options.includes(value)) {
      setOption(value);
      setCustom('');
    } else if (value) {
      setOption(options[0]);
      setCustom(value);
    } else {
      setOption(options[0]);
      setCustom('');
    }
  };

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [topupSearchQuery, setTopupSearchQuery] = useState('');
  const [historyFromDate, setHistoryFromDate] = useState('');
  const [historyToDate, setHistoryToDate] = useState('');
  const [historyCompany, setHistoryCompany] = useState('');
  const [historyPosition, setHistoryPosition] = useState('');
  const [historyKeyword, setHistoryKeyword] = useState('');
  const [supportFromDate, setSupportFromDate] = useState('');
  const [supportToDate, setSupportToDate] = useState('');
  const [supportSearchQuery, setSupportSearchQuery] = useState('');
  const clearHistoryFilters = useCallback(() => {
    setHistoryFromDate('');
    setHistoryToDate('');
    setHistoryCompany('');
    setHistoryPosition('');
    setHistoryKeyword('');
  }, []);
  const clearSupportFilters = useCallback(() => {
    setSupportFromDate('');
    setSupportToDate('');
    setSupportSearchQuery('');
  }, []);
  const hasHistoryFilters =
    Boolean(historyFromDate) ||
    Boolean(historyToDate) ||
    Boolean(historyCompany) ||
    Boolean(historyPosition) ||
    Boolean(historyKeyword);
  const hasSupportFilters =
    Boolean(supportFromDate) || Boolean(supportToDate) || Boolean(supportSearchQuery);

  const historyFromMs = useMemo(() => {
    if (!historyFromDate) return null;
    const ts = new Date(historyFromDate).setHours(0, 0, 0, 0);
    return Number.isNaN(ts) ? null : ts;
  }, [historyFromDate]);

  const historyToMs = useMemo(() => {
    if (!historyToDate) return null;
    const ts = new Date(historyToDate).setHours(23, 59, 59, 999);
    return Number.isNaN(ts) ? null : ts;
  }, [historyToDate]);

  const supportFromMs = useMemo(() => {
    if (!supportFromDate) return null;
    const ts = new Date(supportFromDate).setHours(0, 0, 0, 0);
    return Number.isNaN(ts) ? null : ts;
  }, [supportFromDate]);

  const supportToMs = useMemo(() => {
    if (!supportToDate) return null;
    const ts = new Date(supportToDate).setHours(23, 59, 59, 999);
    return Number.isNaN(ts) ? null : ts;
  }, [supportToDate]);

  const matchesText = useCallback(
    (needle: string, ...values: Array<string | null | undefined>) => {
      if (!needle) return true;
      const haystack = values.filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(needle.toLowerCase());
    },
    []
  );

  const matchesKeyword = useCallback(
    (
      needle: string,
      keywords: string[] | undefined,
      ...values: Array<string | null | undefined>
    ) => {
      if (!needle) return true;
      const lowered = needle.toLowerCase();
      const keywordHit = (keywords || []).some((word) =>
        String(word).toLowerCase().includes(lowered)
      );
      return keywordHit || matchesText(needle, ...values);
    },
    [matchesText]
  );

  const matchesHistoryRange = useCallback(
    (dateValue: string | null) => {
      if (!historyFromMs && !historyToMs) return true;
      if (!dateValue) return false;
      const ts = new Date(dateValue).getTime();
      if (Number.isNaN(ts)) return false;
      if (historyFromMs && ts < historyFromMs) return false;
      if (historyToMs && ts > historyToMs) return false;
      return true;
    },
    [historyFromMs, historyToMs]
  );

  const matchesSupportRange = useCallback(
    (dateValue: string | null) => {
      if (!supportFromMs && !supportToMs) return true;
      if (!dateValue) return false;
      const ts = new Date(dateValue).getTime();
      if (Number.isNaN(ts)) return false;
      if (supportFromMs && ts < supportFromMs) return false;
      if (supportToMs && ts > supportToMs) return false;
      return true;
    },
    [supportFromMs, supportToMs]
  );

  const filteredContactSubmissions = useMemo(() => {
    const search = supportSearchQuery.trim().toLowerCase();
    return contactSubmissions.filter((entry) => {
      if (!matchesSupportRange(entry.createdAt)) return false;
      if (!search) return true;
      const haystack = `${entry.name} ${entry.email}`.toLowerCase();
      return haystack.includes(search);
    });
  }, [
    contactSubmissions,
    supportSearchQuery,
    matchesSupportRange,
  ]);

  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [viewingContact, setViewingContact] = useState<ContactSubmissionRecord | null>(null);
  const [contactActionMessage, setContactActionMessage] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      const users = await listUsers();
      setAdminUsers(
        users.map((u) => ({
          ...u,
          username: u.loginId,
          fullName: u.name,
        }))
      );
    } catch (err) {
      console.error('Failed to load users', err);
      flashError('Failed to load users');
    }
  }, [flashError]);

  const loadInterviews = useCallback(async () => {
    try {
      const interviews = await listInterviews();
      setAllInterviews(interviews);
      setSelectedInterviewIds([]);
    } catch (err) {
      console.error('Failed to load interviews', err);
    }
  }, []);

  const loadContactEntries = useCallback(async () => {
    setContactLoading(true);
    try {
      const submissions = await listContactSubmissions();
      setContactSubmissions(submissions);
      setSelectedContactIds([]);
      setViewingContact(null);
    } catch (err) {
      console.error('Failed to load contact submissions', err);
    } finally {
      setContactLoading(false);
    }
  }, []);

  const loadMeetingHistory = useCallback(async () => {
    setMeetingsLoading(true);
    try {
      const meetings = await listAllMeetingsForAdmin();
      setAllMeetings(meetings);
      setSelectedMeetingIds([]);
    } catch (err) {
      console.error('Failed to load mentor session history', err);
    } finally {
      setMeetingsLoading(false);
    }
  }, []);

  const loadPaymentHistory = useCallback(async () => {
    setPaymentsLoading(true);
    try {
      const history = await getAdminPaymentHistory();
      setPaymentHistory(Array.isArray(history) ? history : []);
    } catch (err) {
      console.error('Failed to load payment history', err);
    } finally {
      setPaymentsLoading(false);
    }
  }, []);

  const handleUpdateSupportPhone = useCallback(async () => {
    const trimmedCountry = countryCode.trim() || '+91';
    const trimmedNumber = localNumber.trim();
    if (!trimmedNumber) {
      setSupportMessage('Contact number cannot be empty.');
      return;
    }
    const combined = `${trimmedCountry} ${trimmedNumber}`.trim();
    setSupportSaving(true);
    try {
      await saveAdminSettings({ supportPhone: combined });
      setSupportPhone(combined);
      setSupportMessage('Contact number updated.');
      window.dispatchEvent(
        new CustomEvent('supportPhoneUpdated', { detail: combined })
      );
    } catch (err) {
      console.error('Failed to update contact number', err);
      setSupportMessage('Failed to update contact number');
    } finally {
      setSupportSaving(false);
      window.setTimeout(() => setSupportMessage(null), 4000);
    }
  }, [countryCode, localNumber]);

  const notifySupportMessage = useCallback((text: string) => {
    setSupportMessage(text);
    window.setTimeout(() => setSupportMessage(null), 4000);
  }, []);

  const exportContactsToPdf = useCallback(
    (entries: ContactSubmissionRecord[], label: string, filenameSuffix: string) => {
      if (entries.length === 0) {
        notifySupportMessage('No submissions to export.');
        return;
      }
      setExportingPdf(true);
      try {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text(
          label,
          14,
          20,
        );
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
        let cursor = 36;
        entries.forEach((entry, index) => {
          if (cursor > 270) {
            doc.addPage();
            cursor = 20;
          }
          doc.setFontSize(11);
          doc.text(`${index + 1}. ${entry.name} (${entry.email})`, 14, cursor);
          cursor += 6;
          doc.setFontSize(10);
          doc.text(`Subject: ${entry.subject}`, 14, cursor);
          cursor += 6;
          doc.text(`Submitted: ${new Date(entry.createdAt).toLocaleString()}`, 14, cursor);
          cursor += 6;
          const lines = doc.splitTextToSize(entry.message, 180);
          lines.forEach((line) => {
            if (cursor > 280) {
              doc.addPage();
              cursor = 20;
            }
            doc.text(line, 14, cursor);
            cursor += 5;
          });
          cursor += 8;
        });
        doc.save(`contact-submissions-${filenameSuffix}-${new Date().toISOString()}.pdf`);
        notifySupportMessage('PDF export generated.');
      } catch (err) {
        console.error('Failed to export PDF', err);
        notifySupportMessage('Failed to export PDF.');
      } finally {
        setExportingPdf(false);
      }
    },
    [notifySupportMessage],
  );

  const handleExportSubmissions = useCallback(() => {
    exportContactsToPdf(filteredContactSubmissions, 'Contact Support Submissions', 'all');
  }, [filteredContactSubmissions, exportContactsToPdf]);

  const handleDownloadSelectedContactsPdf = useCallback(() => {
    if (selectedContactIds.length === 0) {
      flashWarning('Select at least one submission.');
      return;
    }
    const entries = filteredContactSubmissions.filter((entry) =>
      selectedContactIds.includes(entry.id),
    );
    if (entries.length === 0) {
      flashWarning('No valid submissions selected.');
      return;
    }
    exportContactsToPdf(entries, 'Selected Contact Support Submissions', 'selected');
  }, [filteredContactSubmissions, exportContactsToPdf, selectedContactIds, flashWarning]);

  const downloadContactCsv = useCallback(() => {
    if (filteredContactSubmissions.length === 0) {
      flashWarning('No submissions available for export.');
      return;
    }
    setContactCsvExporting(true);
    try {
      const lines = [
        ['Name', 'Email', 'Subject', 'Message', 'Submitted At'],
        ...filteredContactSubmissions.map((entry) => [
          entry.name,
          entry.email,
          entry.subject,
          entry.message,
          new Date(entry.createdAt).toLocaleString(),
        ]),
      ];
      const csvContent = buildCsv(lines);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'contact-support-submissions.csv';
      anchor.click();
      URL.revokeObjectURL(url);
      setContactActionMessage('CSV export ready.');
      window.setTimeout(() => setContactActionMessage(null), 4000);
    } catch (err) {
      console.error('Failed to export contact CSV', err);
      flashError('Failed to export CSV');
    } finally {
      setContactCsvExporting(false);
    }
  }, [filteredContactSubmissions, flashWarning, flashError]);

  const toggleSelectAllContacts = useCallback(() => {
    if (filteredContactSubmissions.length === 0) return;
    setSelectedContactIds((prev) =>
      prev.length === filteredContactSubmissions.length
        ? []
        : filteredContactSubmissions.map((entry) => entry.id)
    );
  }, [filteredContactSubmissions]);

  const toggleContactSelection = useCallback((contactId: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  }, []);

  const handleDeleteSelectedContacts = useCallback(async () => {
    if (selectedContactIds.length === 0) {
      setContactActionMessage('Select at least one submission to delete.');
      window.setTimeout(() => setContactActionMessage(null), 3000);
      return;
    }
    if (!window.confirm('Delete selected contact submissions?')) return;
    setContactDeleting(true);
    try {
      await Promise.all(selectedContactIds.map((id) => deleteContactSubmission(id)));
      setContactActionMessage('Selected submissions deleted.');
      window.setTimeout(() => setContactActionMessage(null), 4000);
      await loadContactEntries();
    } catch (err: any) {
      console.error('Failed to delete selected submissions', err);
      flashError(err.message || 'Failed to delete selected submissions');
    } finally {
      setContactDeleting(false);
    }
  }, [selectedContactIds, loadContactEntries]);

  const handleDeleteContact = useCallback(
    async (contactId: string) => {
      if (!window.confirm('Delete this submission?')) return;
      setContactDeleting(true);
      try {
        await deleteContactSubmission(contactId);
        setContactActionMessage('Submission deleted.');
        window.setTimeout(() => setContactActionMessage(null), 4000);
        await loadContactEntries();
      } catch (err: any) {
        console.error('Failed to delete submission', err);
        flashError(err.message || 'Failed to delete submission');
      } finally {
        setContactDeleting(false);
      }
    },
    [loadContactEntries]
  );

  const handleViewContact = useCallback((entry: ContactSubmissionRecord) => {
    setViewingContact(entry);
    setContactActionMessage(null);
  }, []);

  const handleRequestContact = useCallback((entry: ContactSubmissionRecord) => {
    setViewingContact(entry);
    setContactActionMessage(`Request noted for ${entry.name}.`);
    window.setTimeout(() => setContactActionMessage(null), 4000);
  }, []);

  const loadContentData = useCallback(async () => {
    setContentLoading(true);
    setContentMessage(null);
    try {
      const [posts, t, f, info, bundles] = await Promise.all([
        adminListBlogPosts().catch(() => []),
        adminListTestimonials().catch(() => []),
        adminListFaqs().catch(() => []),
        adminGetSiteInfo().catch(() => ({})),
        adminListPricingBundles().catch(() => []),
      ]);
      setBlogPosts(Array.isArray(posts) ? posts : []);
      setTestimonials(Array.isArray(t) ? t : []);
      setFaqs(Array.isArray(f) ? f : []);
      setSiteInfo(info || {});
      setPricingBundles(Array.isArray(bundles) ? bundles : []);
    } catch (err: any) {
      console.error('Content load failed', err);
      setContentMessage(err?.message || 'Failed to load content');
    } finally {
      setContentLoading(false);
    }
  }, []);

  const upsertBlog = async () => {
    if (!editingBlog?.title) {
      setContentMessage('Title is required');
      return;
    }
    setContentLoading(true);
    try {
      await adminSaveBlogPost({
        ...editingBlog,
        bullets: (editingBlog.bullets || []).filter(Boolean),
        tags: (editingBlog.tags || []).filter(Boolean),
      });
      setContentMessage('Blog post saved.');
      setEditingBlog(null);
      await loadContentData();
    } catch (err: any) {
      console.error('Save blog failed', err);
      setContentMessage(err?.message || 'Failed to save blog');
    } finally {
      setContentLoading(false);
    }
  };

  const removeBlog = async (id: string) => {
    if (!id) return;
    if (!window.confirm('Delete this blog post?')) return;
    setContentLoading(true);
    try {
      await adminDeleteBlogPost(id);
      setContentMessage('Blog post deleted.');
      await loadContentData();
    } catch (err: any) {
      console.error('Delete blog failed', err);
      setContentMessage(err?.message || 'Failed to delete blog');
    } finally {
      setContentLoading(false);
    }
  };

  const upsertTestimonial = async () => {
    if (!editingTestimonial?.name || !editingTestimonial?.quote) {
      setContentMessage('Name and quote are required');
      return;
    }
    setContentLoading(true);
    try {
      await adminSaveTestimonial(editingTestimonial);
      setContentMessage('Testimonial saved.');
      setEditingTestimonial(null);
      await loadContentData();
    } catch (err: any) {
      console.error('Save testimonial failed', err);
      setContentMessage(err?.message || 'Failed to save testimonial');
    } finally {
      setContentLoading(false);
    }
  };

  const removeTestimonial = async (id: string) => {
    if (!id) return;
    if (!window.confirm('Delete this testimonial?')) return;
    setContentLoading(true);
    try {
      await adminDeleteTestimonial(id);
      setContentMessage('Testimonial deleted.');
      await loadContentData();
    } catch (err: any) {
      console.error('Delete testimonial failed', err);
      setContentMessage(err?.message || 'Failed to delete testimonial');
    } finally {
      setContentLoading(false);
    }
  };

  const upsertFaq = async () => {
    if (!editingFaq?.question || !editingFaq?.answer) {
      setContentMessage('FAQ question and answer are required');
      return;
    }
    setContentLoading(true);
    try {
      await adminSaveFaq(editingFaq);
      setContentMessage('FAQ saved.');
      setEditingFaq(null);
      await loadContentData();
    } catch (err: any) {
      console.error('Save FAQ failed', err);
      setContentMessage(err?.message || 'Failed to save FAQ');
    } finally {
      setContentLoading(false);
    }
  };

  const removeFaq = async (id: string) => {
    if (!id) return;
    if (!window.confirm('Delete this FAQ?')) return;
    setContentLoading(true);
    try {
      await adminDeleteFaq(id);
      setContentMessage('FAQ deleted.');
      await loadContentData();
    } catch (err: any) {
      console.error('Delete FAQ failed', err);
      setContentMessage(err?.message || 'Failed to delete FAQ');
    } finally {
      setContentLoading(false);
    }
  };

  const saveSiteInfo = async () => {
    setContentLoading(true);
    try {
      const { freeTrialAiCredits: _freeTrialAi, freeTrialMentorCredits: _freeTrialMentor, ...payload } =
        siteInfo || {};
      const updated = await adminUpdateSiteInfo(payload);
      setSiteInfo(updated || {});
      setContentMessage('Site info saved.');
    } catch (err: any) {
      console.error('Save site info failed', err);
      setContentMessage(err?.message || 'Failed to save site info');
    } finally {
      setContentLoading(false);
    }
  };

  const upsertBundle = async () => {
    if (!editingBundle?.name || !editingBundle?.priceInr || !editingBundle?.credits) {
      setContentMessage('Name, price, and credits are required for bundles');
      return;
    }
    setContentLoading(true);
    try {
      await adminSavePricingBundle({
        ...editingBundle,
        features: (editingBundle.features || []).filter(Boolean),
        priceInr: Number(editingBundle.priceInr),
        credits: Number(editingBundle.credits),
        bonusCredits: Number(editingBundle.bonusCredits || 0),
        displayOrder: Number(editingBundle.displayOrder || 0),
        showOnLanding: editingBundle.showOnLanding !== false,
        offerDiscountPercent: Number(editingBundle.offerDiscountPercent || 0),
        offerBonusCredits: Number(editingBundle.offerBonusCredits || 0),
        offerStart: editingBundle.offerStart || undefined,
        offerEnd: editingBundle.offerEnd || undefined,
        offerBadge: editingBundle.offerBadge || '',
      });
      setContentMessage('Bundle saved.');
      setEditingBundle(null);
      await loadContentData();
    } catch (err: any) {
      console.error('Save bundle failed', err);
      setContentMessage(err?.message || 'Failed to save bundle');
    } finally {
      setContentLoading(false);
    }
  };

  const removeBundle = async (id: string) => {
    if (!id) return;
    if (!window.confirm('Delete this bundle?')) return;
    setContentLoading(true);
    try {
      await adminDeletePricingBundle(id);
      setContentMessage('Bundle deleted.');
      await loadContentData();
    } catch (err: any) {
      console.error('Delete bundle failed', err);
      setContentMessage(err?.message || 'Failed to delete bundle');
    } finally {
      setContentLoading(false);
    }
  };

  const handleBlogImageUpload = async (file: File) => {
    setContentLoading(true);
    try {
      const res = await adminUploadImage(file);
      if (res?.url) {
        setEditingBlog({ ...(editingBlog || {}), heroImage: res.url });
        setContentMessage('Image uploaded.');
      }
    } catch (err: any) {
      console.error('Upload failed', err);
      setContentMessage(err?.message || 'Failed to upload image');
    } finally {
      setContentLoading(false);
    }
  };

  const handleTestimonialImageUpload = async (file: File) => {
    if (!file) return;
    setContentLoading(true);
    try {
      const res = await adminUploadImage(file);
      if (res?.url) {
        setEditingTestimonial({ ...(editingTestimonial || {}), photoUrl: res.url });
        setContentMessage('Testimonial photo uploaded.');
      }
    } catch (err: any) {
      console.error('Upload failed', err);
      setContentMessage(err?.message || 'Failed to upload testimonial photo');
    } finally {
      setContentLoading(false);
    }
  };

  // Load settings, users, and interviews on mount
  useEffect(() => {
    setSelectedProvider(currentProvider || 'OPENAI');
  }, [currentProvider]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const settings = await getAdminSettings().catch(() => null);
        if (settings) {
          setOpenaiKey(settings.openaiKeyMasked || '');
          setGeminiKey(settings.geminiKeyMasked || '');
          setDeepSeekKey(settings.deepseekKeyMasked || '');
          setDeepgramKey(settings.deepgramKeyMasked || '');
          if (typeof settings.aiCreditPrice === 'number') setAiCreditPrice(settings.aiCreditPrice);
          if (typeof settings.mentorCreditPrice === 'number') setMentorCreditPrice(settings.mentorCreditPrice);
          if (typeof settings.minCreditPurchase === 'number') setMinCreditPurchase(settings.minCreditPurchase);
          if (typeof settings.freeTrialAiCredits === 'number') {
            setFreeTrialAiCredits(settings.freeTrialAiCredits);
          }
          if (typeof settings.freeTrialMentorCredits === 'number') {
            setFreeTrialMentorCredits(settings.freeTrialMentorCredits);
          }
          if (typeof settings.sessionGraceMinutes === 'number') {
            setSessionGraceMinutes(settings.sessionGraceMinutes);
          }
          if (typeof settings.sessionHardStopEnabled === 'boolean') {
            setSessionHardStopEnabled(settings.sessionHardStopEnabled);
          }
          if (settings.razorpayKeyMasked) setRazorpayKeyId(settings.razorpayKeyMasked);
          setOpenaiKeyDirty(false);
          setGeminiKeyDirty(false);
          setDeepSeekKeyDirty(false);
          setDeepgramKeyDirty(false);
          setRazorpayKeysDirty(false);
          setSupportPhone(settings.supportPhone || null);
          syncModelValue(settings.openaiModel, OPENAI_MODEL_OPTIONS, setOpenaiModel, setOpenaiModelCustom);
          syncModelValue(settings.geminiModel, GEMINI_MODEL_OPTIONS, setGeminiModel, setGeminiModelCustom);
          syncModelValue(settings.deepseekModel, DEEPSEEK_MODEL_OPTIONS, setDeepseekModel, setDeepseekModelCustom);
        } else {
          setSupportPhone(null);
        }
        await loadUsers();
      } catch (err) {
        console.error('Failed to bootstrap admin dashboard', err);
      } finally {
        setSettingsLoaded(true);
      }
    };
    bootstrap();
  }, [loadUsers]);

  useEffect(() => {
    if (!supportPhone) {
      setCountryCode('+91');
      setLocalNumber('');
      return;
    }
    const trimmed = supportPhone.trim();
    if (trimmed.startsWith('+')) {
      const parts = trimmed.split(/\s+/);
      setCountryCode(parts[0]);
      setLocalNumber(parts.slice(1).join('').trim());
    } else {
      setCountryCode('+91');
      setLocalNumber(trimmed);
    }
  }, [supportPhone]);

  useEffect(() => {
    loadInterviews();
    loadContactEntries();
    loadMeetingHistory();
    loadPaymentHistory();
    const handleSessionUpdate = () => loadInterviews();
    window.addEventListener('sessionUpdated', handleSessionUpdate);
    return () => window.removeEventListener('sessionUpdated', handleSessionUpdate);
  }, [
    loadInterviews,
    loadContactEntries,
    loadMeetingHistory,
    loadPaymentHistory,
  ]);

  useEffect(() => {
    if (activeTab === 'CONTENT') {
      loadContentData();
    }
  }, [activeTab, loadContentData]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsMessage(null);
    try {
      const openaiPayload = openaiKeyDirty ? openaiKey || undefined : undefined;
      const geminiPayload = geminiKeyDirty ? geminiKey || undefined : undefined;
      const deepSeekPayload = deepSeekKeyDirty ? deepSeekKey || undefined : undefined;
      const deepgramPayload = deepgramKeyDirty ? deepgramKey || undefined : undefined;
      const openaiModelValue = openaiModelCustom.trim() || openaiModel;
      const geminiModelValue = geminiModelCustom.trim() || geminiModel;
      const deepseekModelValue = deepseekModelCustom.trim() || deepseekModel;
      const razorpayIdPayload = razorpayKeysDirty ? razorpayKeyId || undefined : undefined;
      const razorpaySecretPayload = razorpayKeysDirty ? razorpayKeySecret || undefined : undefined;
      const updated = await saveAdminSettings({
        defaultProvider: selectedProvider,
        openaiApiKey: openaiPayload,
        geminiApiKey: geminiPayload,
        deepseekApiKey: deepSeekPayload,
        deepgramApiKey: deepgramPayload,
        openaiModel: openaiModelValue,
        geminiModel: geminiModelValue,
        deepseekModel: deepseekModelValue,
        aiCreditPrice,
        mentorCreditPrice,
        minCreditPurchase,
        sessionGraceMinutes,
        sessionHardStopEnabled,
        razorpayKeyId: razorpayIdPayload,
        razorpayKeySecret: razorpaySecretPayload,
      });
      setSettingsMessage('Settings saved successfully');
      onProviderChange?.(selectedProvider);
      setOpenaiKey(updated.openaiKeyMasked || '');
      setGeminiKey(updated.geminiKeyMasked || '');
      setDeepSeekKey(updated.deepseekKeyMasked || '');
      setDeepgramKey(updated.deepgramKeyMasked || '');
      setRazorpayKeyId(updated.razorpayKeyMasked || '');
      setOpenaiKeyDirty(false);
      setGeminiKeyDirty(false);
      setDeepSeekKeyDirty(false);
      setDeepgramKeyDirty(false);
      setRazorpayKeysDirty(false);
      if (typeof updated.minCreditPurchase === 'number') {
        setMinCreditPurchase(updated.minCreditPurchase);
      }
      syncModelValue(updated.openaiModel, OPENAI_MODEL_OPTIONS, setOpenaiModel, setOpenaiModelCustom);
      syncModelValue(updated.geminiModel, GEMINI_MODEL_OPTIONS, setGeminiModel, setGeminiModelCustom);
      syncModelValue(updated.deepseekModel, DEEPSEEK_MODEL_OPTIONS, setDeepseekModel, setDeepseekModelCustom);
    } catch (err: any) {
      console.error('Failed to save settings', err);
      setSettingsMessage('Failed to save settings');
    } finally {
      setSettingsSaving(false);
      setTimeout(() => setSettingsMessage(null), 3000);
    }
  };

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setPricingSaving(true);
    setPricingMessage(null);
    try {
      const razorpayIdPayload = razorpayKeysDirty ? razorpayKeyId || undefined : undefined;
      const razorpaySecretPayload = razorpayKeysDirty ? razorpayKeySecret || undefined : undefined;
      const updated = await saveAdminSettings({
        aiCreditPrice,
        mentorCreditPrice,
        minCreditPurchase,
        freeTrialAiCredits,
        freeTrialMentorCredits,
        razorpayKeyId: razorpayIdPayload,
        razorpayKeySecret: razorpaySecretPayload,
      });
      setPricingMessage('Pricing updated successfully');
      if (typeof updated.aiCreditPrice === 'number') setAiCreditPrice(updated.aiCreditPrice);
      if (typeof updated.mentorCreditPrice === 'number') setMentorCreditPrice(updated.mentorCreditPrice);
      if (typeof updated.minCreditPurchase === 'number') setMinCreditPurchase(updated.minCreditPurchase);
      if (typeof updated.freeTrialAiCredits === 'number') {
        setFreeTrialAiCredits(updated.freeTrialAiCredits);
      }
      if (typeof updated.freeTrialMentorCredits === 'number') {
        setFreeTrialMentorCredits(updated.freeTrialMentorCredits);
      }
      setRazorpayKeyId(updated.razorpayKeyMasked || '');
      setRazorpayKeySecret('');
      setRazorpayKeysDirty(false);
    } catch (err: any) {
      console.error('Failed to update pricing', err);
      setPricingMessage('Failed to update pricing');
    } finally {
      setPricingSaving(false);
      setTimeout(() => setPricingMessage(null), 3000);
    }
  };

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setTopupMessage(null);
    const identifier = topupIdentifier.trim();
    const aiDelta = Number(topupAiCredits) || 0;
    const mentorDelta = Number(topupMentorCredits) || 0;
    if (!identifier) {
      flashWarning('Enter a user ID to credit.');
      return;
    }
    if (aiDelta <= 0 && mentorDelta <= 0) {
      flashWarning('Enter credits to add.');
      return;
    }
    setTopupLoading(true);
    try {
      await adminTopUpCredits({
        identifier,
        aiInterviewCreditsDelta: aiDelta > 0 ? aiDelta : undefined,
        mentorSessionCreditsDelta: mentorDelta > 0 ? mentorDelta : undefined,
      });
      setTopupMessage('Credits added successfully.');
      await loadUsers();
      setTopupIdentifier('');
      setTopupAiCredits('');
      setTopupMentorCredits('');
    } catch (err: any) {
      console.error('Failed to top up credits', err);
      flashError(err?.message || 'Failed to top up credits');
    } finally {
      setTopupLoading(false);
    }
  };

  // Stats
  const filteredAdminUsers = useMemo(() => {
    const search = userSearchQuery.trim().toLowerCase();
    if (!search) return adminUsers;
    return adminUsers.filter((user) => {
      const fields = [
        user.name,
        user.fullName,
        user.username,
        user.loginId,
        user.email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return fields.includes(search);
    });
  }, [adminUsers, userSearchQuery]);

  const filteredTopupUsers = useMemo(() => {
    const search = topupSearchQuery.trim().toLowerCase();
    if (!search) return adminUsers;
    return adminUsers.filter((user) => {
      const fields = [
        user.name,
        user.fullName,
        user.username,
        user.loginId,
        user.email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return fields.includes(search);
    });
  }, [adminUsers, topupSearchQuery]);

  const totalUsers = adminUsers.length;
  const visibleUsers = filteredAdminUsers.length;
  const aiInterviewStats = useMemo(() => {
    const scheduled = allInterviews.filter((i) => i.status === 'SCHEDULED').length;
    const inProgress = allInterviews.filter((i) => i.status === 'IN_PROGRESS').length;
    const completed = allInterviews.filter((i) => i.status === 'COMPLETED').length;
    return {
      total: allInterviews.length,
      scheduled,
      inProgress,
      completed,
    };
  }, [allInterviews]);
  const mentorSessionStats = useMemo(() => {
    const scheduled = allMeetings.filter((m) => m.status === 'SCHEDULED').length;
    const inProgress = allMeetings.filter((m) => m.status === 'IN_PROGRESS').length;
    const completed = allMeetings.filter((m) => m.status === 'COMPLETED').length;
    return {
      total: allMeetings.length,
      scheduled,
      inProgress,
      completed,
    };
  }, [allMeetings]);
  const paidPayments = useMemo(() => {
    return paymentHistory.filter((p) => String(p.status || '').toLowerCase() === 'paid');
  }, [paymentHistory]);
  const sortedPayments = useMemo(() => {
    return [...paymentHistory].sort((a, b) => {
      const ad = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bd = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bd - ad;
    });
  }, [paymentHistory]);
  const revenueStats = useMemo(() => {
    const aiRevenue = paidPayments
      .filter((p) => p.creditType === 'AI')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0) / 100;
    const mentorRevenue = paidPayments
      .filter((p) => p.creditType === 'MENTOR')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0) / 100;
    return {
      aiRevenue,
      mentorRevenue,
      total: aiRevenue + mentorRevenue,
    };
  }, [paidPayments]);
  const priceTrend = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, idx) => {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
      return monthDate.toLocaleString('en-US', { month: 'short' });
    });
    const ai = Array.from({ length: 6 }, () => 0);
    const mentor = Array.from({ length: 6 }, () => 0);
    const monthIndex = new Map<string, number>();
    Array.from({ length: 6 }, (_, idx) => {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
      monthIndex.set(`${monthDate.getFullYear()}-${monthDate.getMonth()}`, idx);
    });
    paidPayments.forEach((p) => {
      if (!p.createdAt) return;
      const created = new Date(p.createdAt);
      if (Number.isNaN(created.getTime())) return;
      const key = `${created.getFullYear()}-${created.getMonth()}`;
      const idx = monthIndex.get(key);
      if (idx === undefined) return;
      const amount = (Number(p.amount) || 0) / 100;
      if (p.creditType === 'AI') ai[idx] += amount;
      if (p.creditType === 'MENTOR') mentor[idx] += amount;
    });
    return { months, ai, mentor };
  }, [paidPayments]);

  const last14Days = useMemo(() => {
    const days = 14;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const labels: string[] = [];
    const keys: string[] = [];
    const indexByKey = new Map<string, number>();
    for (let i = 0; i < days; i += 1) {
      const d = new Date(today);
      d.setDate(today.getDate() - (days - 1 - i));
      const key = d.toISOString().slice(0, 10);
      keys.push(key);
      indexByKey.set(key, i);
      labels.push(d.toLocaleString('en-US', { month: 'short', day: 'numeric' }));
    }

    const aiMinutes = Array.from({ length: days }, () => 0);
    const mentorMinutes = Array.from({ length: days }, () => 0);
    const revenueInr = Array.from({ length: days }, () => 0);
    const signups = Array.from({ length: days }, () => 0);

    const dayKeyFrom = (value?: string | number | Date | null) => {
      if (!value) return null;
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return null;
      return d.toISOString().slice(0, 10);
    };

    allInterviews.forEach((item) => {
      const key =
        dayKeyFrom((item as any).sessionEndedAt) ||
        dayKeyFrom((item as any).sessionStartedAt) ||
        dayKeyFrom((item as any).updatedAt) ||
        dayKeyFrom((item as any).createdAt) ||
        dayKeyFrom((item as any).scheduledAt);
      if (!key) return;
      const idx = indexByKey.get(key);
      if (idx === undefined) return;
      const billedSeconds = Number((item as any).billedSeconds ?? (item as any).totalSessionSeconds ?? 0);
      if (!Number.isFinite(billedSeconds) || billedSeconds <= 0) return;
      aiMinutes[idx] += billedSeconds / 60;
    });

    allMeetings.forEach((item) => {
      const key =
        dayKeyFrom((item as any).sessionEndedAt) ||
        dayKeyFrom((item as any).sessionStartedAt) ||
        dayKeyFrom((item as any).updatedAt) ||
        dayKeyFrom((item as any).createdAt) ||
        dayKeyFrom((item as any).scheduledAt);
      if (!key) return;
      const idx = indexByKey.get(key);
      if (idx === undefined) return;
      const billedSeconds = Number((item as any).billedSeconds ?? (item as any).totalSessionSeconds ?? 0);
      if (!Number.isFinite(billedSeconds) || billedSeconds <= 0) return;
      mentorMinutes[idx] += billedSeconds / 60;
    });

    paidPayments.forEach((p) => {
      const key = dayKeyFrom(p.createdAt);
      if (!key) return;
      const idx = indexByKey.get(key);
      if (idx === undefined) return;
      const amount = (Number(p.amount) || 0) / 100;
      if (Number.isFinite(amount) && amount > 0) revenueInr[idx] += amount;
    });

    adminUsers.forEach((u) => {
      const key = dayKeyFrom(u.createdAt as any);
      if (!key) return;
      const idx = indexByKey.get(key);
      if (idx === undefined) return;
      signups[idx] += 1;
    });

    return {
      labels,
      keys,
      aiMinutes,
      mentorMinutes,
      revenueInr,
      signups,
    };
  }, [adminUsers, allInterviews, allMeetings, paidPayments]);

  const filteredInterviews = useMemo(() => {
    const search = searchQuery.toLowerCase();
    return allInterviews
      .filter((interview) => {
        const owner = adminUsers.find((u) => u.id === interview.userId);
        const ownerName = owner?.fullName || owner?.username || interview.createdBy || '';
        const dateMatches =
          !dateFilter ||
          (interview.scheduledAt &&
            new Date(interview.scheduledAt).toISOString().slice(0, 10) === dateFilter);
        const searchMatches =
          !search ||
          interview.title.toLowerCase().includes(search) ||
          ownerName.toLowerCase().includes(search) ||
          (interview.createdBy || '').toLowerCase().includes(search);
        return dateMatches && searchMatches;
      })
      .sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      );
  }, [allInterviews, adminUsers, searchQuery, dateFilter]);

  const overviewInterviewRows = useMemo<OverviewInterviewRow[]>(() => {
    return filteredInterviews.map((interview) => {
      const owner = adminUsers.find((u) => u.id === interview.userId);
      const ownerName =
        owner?.fullName || owner?.username || interview.createdBy || 'Unknown';
      const ownerRole = owner?.role || 'user';
      return {
        ...interview,
        candidateName: ownerName,
        ownerName,
        ownerRole,
      };
    });
  }, [filteredInterviews, adminUsers]);

  const allLearnerRequests = [];
  const allMentorRequests = [];
  const overviewLearnerRequests = [];
  const mentorMeetingOverviewRows = useMemo<OverviewInterviewRow[]>(() => {
    const search = searchQuery.toLowerCase();
    return [...allMeetings]
      .filter((meeting) => meeting.status !== 'PENDING')
      .map(mapMeetingToOverviewRow)
      .filter((row) => {
        const dateMatches =
          !dateFilter ||
          (row.scheduledAt && new Date(row.scheduledAt).toISOString().slice(0, 10) === dateFilter);
        const searchMatches =
          !search ||
          row.title.toLowerCase().includes(search) ||
          (row.ownerName || '').toLowerCase().includes(search) ||
          (row.createdBy || '').toLowerCase().includes(search);
        return dateMatches && searchMatches;
      })
      .sort((a, b) => {
        const aTime = new Date(a.scheduledAt).getTime();
        const bTime = new Date(b.scheduledAt).getTime();
        const safeA = Number.isNaN(aTime) ? 0 : aTime;
        const safeB = Number.isNaN(bTime) ? 0 : bTime;
        return safeB - safeA;
      });
  }, [allMeetings, searchQuery, dateFilter]);

  const filteredPendingMentorMeetings = useMemo(() => {
    const search = searchQuery.toLowerCase();
    return pendingMentorMeetings.filter((meeting) => {
      const row = mapMeetingToOverviewRow(meeting);
      const dateMatches =
        !dateFilter ||
        (row.scheduledAt && new Date(row.scheduledAt).toISOString().slice(0, 10) === dateFilter);
      const searchMatches =
        !search ||
        row.title.toLowerCase().includes(search) ||
        (row.ownerName || '').toLowerCase().includes(search) ||
        (row.createdBy || '').toLowerCase().includes(search);
      return dateMatches && searchMatches;
    });
  }, [pendingMentorMeetings, searchQuery, dateFilter]);

  const overviewMentorRequests = useMemo(() => {
    const interviews = allMentorRequests.filter((row) => row.status !== 'PENDING');
    const combined = [...interviews, ...mentorMeetingOverviewRows];
    return combined.sort((a, b) => {
      const aTime = new Date(a.scheduledAt).getTime();
      const bTime = new Date(b.scheduledAt).getTime();
      const safeA = Number.isNaN(aTime) ? 0 : aTime;
      const safeB = Number.isNaN(bTime) ? 0 : bTime;
      return safeB - safeA;
    });
  }, [allMentorRequests, mentorMeetingOverviewRows]);
  const pendingLearnerRequests = useMemo(
    () => allLearnerRequests.filter((row) => row.status === 'PENDING'),
    [allLearnerRequests]
  );
  const pendingMentorRequests = useMemo(
    () => allMentorRequests.filter((row) => row.status === 'PENDING'),
    [allMentorRequests]
  );
  const showMentorEmptyMessage = pendingMentorRequests.length === 0 && pendingMentorMeetings.length === 0;

const handleUpdateStatus = async (
  id: string | number,
  newStatus: 'APPROVED' | 'REJECTED'
) => {
    try {
      const updated = await updateInterview(id, { status: newStatus });
      setAllInterviews((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: updated.status } : i))
      );
    } catch (err: any) {
      console.error('Failed to update status', err);
      flashError(err.message || 'Failed to update status');
    }
};

const overviewRequestCard = useCallback(
  (row: OverviewInterviewRow) => {
    const ownerRoleLabel =
      row.ownerRole === 'mentor'
        ? 'Mentor'
        : row.ownerRole === 'admin'
        ? 'Admin'
        : 'Learner';
    return (
      <div
        key={`${row.id}-${row.updatedAt}`}
        className="glass-panel p-5 rounded-2xl border border-slate-200/70 hover:border-blue-500/40 transition-all flex flex-col justify-between gap-3"
      >
        <div className="flex justify-between items-start gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 line-clamp-2">
              {row.title}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              By <span className="font-medium text-gray-200">{row.ownerName}</span> |{' '}
              <span className="text-emerald-300">{ownerRoleLabel}</span>
            </p>
          </div>
          <span
            className={`px-2 py-0.5 text-[10px] rounded-full border ${
              row.status === 'APPROVED'
                ? 'border-emerald-500/60 text-emerald-300 bg-emerald-900/40'
                : row.status === 'REJECTED'
                ? 'border-red-500/60 text-red-300 bg-red-900/40'
                : 'border-amber-500/60 text-amber-300 bg-amber-900/40'
            }`}
          >
            {row.status}
          </span>
        </div>
        <div className="text-xs text-slate-500">
          <div>
            <span className="text-gray-500">Scheduled:</span>{' '}
            {row.scheduledAt ? new Date(row.scheduledAt).toLocaleString() : 'Not set'}
          </div>
          <div>
            <span className="text-gray-500">Duration:</span>{' '}
            {row.durationMinutes} mins
          </div>
        </div>

        {row.status === 'PENDING' && (
          <div className="flex gap-2 mt-2">
            <Button
              variant="primary"
              onClick={() => handleUpdateStatus(row.id, 'APPROVED')}
              className="flex-1 py-1.5 text-xs"
            >
              Approve
            </Button>
            <Button
              variant="secondary"
              className="flex-1 py-1.5 text-xs bg-red-900/40 border-red-500/60 text-red-200 hover:bg-red-800/60"
              onClick={() => handleUpdateStatus(row.id, 'REJECTED')}
            >
              Reject
            </Button>
          </div>
        )}
      </div>
    );
  },
  [handleUpdateStatus]
);

  const getUserTypeLabel = (role: User['role']) => {
    if (role === 'admin') return 'Admin';
    return 'User';
  };
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'IN_PROGRESS':
        return 'border-amber-200 bg-amber-50 text-amber-700';
      case 'SCHEDULED':
        return 'border-sky-200 bg-sky-50 text-sky-700';
      case 'EXPIRED':
      case 'CANCELLED':
        return 'border-slate-200 bg-slate-100 text-slate-600';
      default:
        return 'border-slate-200 bg-white text-slate-600';
    }
  };
  const getInterviewCandidateId = (row: SavedInterview) => {
    if (row.userId !== undefined && row.userId !== null) return String(row.userId);
    return row.createdBy || 'Unknown';
  };
  const getMeetingParticipant = (meeting: Meeting) =>
    meeting.studentName || meeting.attendeeName || meeting.attendeeId || 'Unknown';
  const ApiKeyField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}> = ({ label, value, onChange, placeholder }) => {
  const [show, setShow] = useState(false);

  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white border border-slate-200/70 rounded-xl px-3 py-2 text-xs font-mono focus:ring-1 focus:ring-blue-500 outline-none pr-10"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute inset-y-0 right-2 flex items-center text-[10px] text-slate-500 hover:text-gray-200"
        >
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  );
};

  const getUserLabel = (user: User) =>
    user.fullName || user.name || user.username || user.loginId || 'this user';

  const openUserActionDialog = (dialog: UserActionDialogState) => {
    setUserActionPassword('');
    setUserActionDialog(dialog);
  };

  const handleDeleteUser = (user: User) => {
    if (!user.id) return;
    openUserActionDialog({ type: 'DELETE', user });
  };

  const handleResetPassword = (user: User) => {
    if (!user.id) return;
    openUserActionDialog({ type: 'RESET_PASSWORD', user });
  };

  const handleToggleUserActive = (user: User) => {
    if (!user.id || user.role === 'admin') return;
    const isActive = user.active !== false;
    openUserActionDialog({ type: 'TOGGLE_ACTIVE', user, nextActive: !isActive });
  };

  const handleCloseUserAction = () => {
    if (userActionLoading) return;
    setUserActionDialog(null);
    setUserActionPassword('');
  };

  const handleConfirmUserAction = async () => {
    if (!userActionDialog || !userActionDialog.user.id) return;
    const { type, user, nextActive } = userActionDialog;
    if (type === 'RESET_PASSWORD' && !userActionPassword.trim()) {
      flashWarning('Enter a new password before confirming.');
      return;
    }
    setUserActionLoading(true);
    try {
      if (type === 'DELETE') {
        await deleteUser(user.id);
        setAdminUsers((prev) => prev.filter((u) => u.id !== user.id));
        setUserSuccessMessage('User deleted');
      }
      if (type === 'RESET_PASSWORD') {
        await changeUserPassword(user.id, userActionPassword.trim());
        setUserSuccessMessage('Password updated');
      }
      if (type === 'TOGGLE_ACTIVE') {
        const actionLabel = nextActive ? 'Unblock' : 'Block';
        setUserStatusUpdatingId(user.id);
        await updateUserStatus(user.id, Boolean(nextActive));
        await loadUsers();
        setUserSuccessMessage(`${actionLabel}ed successfully`);
      }
      setTimeout(() => setUserSuccessMessage(null), 3000);
      setUserActionDialog(null);
      setUserActionPassword('');
    } catch (err: any) {
      console.error('Failed to update user', err);
      flashError(err.message || 'Failed to update user');
    } finally {
      setUserStatusUpdatingId(null);
      setUserActionLoading(false);
    }
  };

  const interviewHistoryRows = useMemo(() => {
    const rows = allInterviews.map((interview) => {
      const owner = adminUsers.find((u) => u.id === interview.userId);
      const candidateName =
        owner?.fullName || owner?.username || interview.createdBy || 'Unknown';
      return {
        ...interview,
        candidateName,
      };
    });
    return rows.sort((a, b) => {
      const aTime = new Date(a.scheduledAt).getTime();
      const bTime = new Date(b.scheduledAt).getTime();
      const safeA = Number.isNaN(aTime) ? 0 : aTime;
      const safeB = Number.isNaN(bTime) ? 0 : bTime;
      return safeB - safeA;
    });
  }, [allInterviews, adminUsers]);

  const meetingHistoryRows = useMemo(() => {
    return [...allMeetings].sort((a, b) => {
      const aTime = new Date(a.scheduledAt).getTime();
      const bTime = new Date(b.scheduledAt).getTime();
      const safeA = Number.isNaN(aTime) ? 0 : aTime;
      const safeB = Number.isNaN(bTime) ? 0 : bTime;
      return safeB - safeA;
    });
  }, [allMeetings]);

  const interviewHistoryRecords = useMemo(() => {
    const now = Date.now();
    const companyNeedle = historyCompany.trim();
    const positionNeedle = historyPosition.trim();
    const keywordNeedle = historyKeyword.trim();
    return interviewHistoryRows.filter((row) => {
      const scheduledAt = row.scheduledAt ? new Date(row.scheduledAt).getTime() : NaN;
      const isPast = Number.isNaN(scheduledAt) ? false : scheduledAt <= now;
      const isHistoryEligible = row.status === 'COMPLETED' || row.status === 'IN_PROGRESS' || isPast;
      if (!isHistoryEligible) return false;
      if (!matchesHistoryRange(row.scheduledAt)) return false;
      const companyOk = matchesText(companyNeedle, row.jobDescription, row.additionalInfo);
      const positionOk = matchesText(positionNeedle, row.title);
      const keywordOk = matchesKeyword(keywordNeedle, row.keywords, row.title, row.jobDescription, row.additionalInfo);
      return companyOk && positionOk && keywordOk;
    });
  }, [
    interviewHistoryRows,
    historyCompany,
    historyPosition,
    historyKeyword,
    matchesHistoryRange,
    matchesText,
    matchesKeyword,
  ]);

  const meetingHistoryRecords = useMemo(() => {
    const now = Date.now();
    const companyNeedle = historyCompany.trim();
    const positionNeedle = historyPosition.trim();
    const keywordNeedle = historyKeyword.trim();
    return meetingHistoryRows.filter((row) => {
      const scheduledAt = row.scheduledAt ? new Date(row.scheduledAt).getTime() : NaN;
      const isPast = Number.isNaN(scheduledAt) ? false : scheduledAt <= now;
      const isHistoryEligible = row.status === 'COMPLETED' || row.status === 'IN_PROGRESS' || isPast;
      if (!isHistoryEligible) return false;
      if (!matchesHistoryRange(row.scheduledAt)) return false;
      const companyOk = matchesText(companyNeedle, row.studentName, row.attendeeName);
      const positionOk = matchesText(positionNeedle, row.technology);
      const keywordOk = matchesText(keywordNeedle, row.technology, row.studentName, row.attendeeName);
      return companyOk && positionOk && keywordOk;
    });
  }, [
    meetingHistoryRows,
    historyCompany,
    historyPosition,
    historyKeyword,
    matchesHistoryRange,
    matchesText,
  ]);

  useEffect(() => {
    setSelectedInterviewIds((prev) =>
      {
        const next = prev.filter((id) =>
          interviewHistoryRecords.some((row) => String(row.id) === id)
        );
        const unchanged =
          next.length === prev.length && next.every((id, index) => id === prev[index]);
        return unchanged ? prev : next;
      }
    );
  }, [interviewHistoryRecords]);

  useEffect(() => {
    setSelectedMeetingIds((prev) =>
      {
        const next = prev.filter((id) =>
          meetingHistoryRecords.some((row) => String(row.id) === id)
        );
        const unchanged =
          next.length === prev.length && next.every((id, index) => id === prev[index]);
        return unchanged ? prev : next;
      }
    );
  }, [meetingHistoryRecords]);

  useEffect(() => {
    setSelectedContactIds((prev) =>
      {
        const next = prev.filter((id) =>
          filteredContactSubmissions.some((entry) => entry.id === id)
        );
        const unchanged =
          next.length === prev.length && next.every((id, index) => id === prev[index]);
        return unchanged ? prev : next;
      }
    );
  }, [filteredContactSubmissions]);

  const selectedTopupUser = useMemo(() => {
    const identifier = topupIdentifier.trim().toLowerCase();
    if (!identifier) return null;
    return adminUsers.find((user) => user.loginId?.toLowerCase() === identifier) || null;
  }, [adminUsers, topupIdentifier]);

  const recentActivityRows = useMemo(() => {
    const interviewRows = interviewHistoryRows.map((row) => ({
      id: `ai-${row.id}`,
      type: 'AI Interview',
      owner: row.candidateName || row.createdBy || 'User',
      status: row.status || 'UNKNOWN',
      time: row.updatedAt || row.scheduledAt || '',
    }));
    const meetingRows = meetingHistoryRows.map((row) => ({
      id: `mentor-${row.id}`,
      type: 'Mentor Session',
      owner: row.studentName || row.attendeeName || row.mentorId || 'Mentor',
      status: row.status || 'UNKNOWN',
      time: row.updatedAt || row.scheduledAt || row.createdAt || '',
    }));
    return [...interviewRows, ...meetingRows]
      .sort((a, b) => {
        const aTime = new Date(a.time).getTime();
        const bTime = new Date(b.time).getTime();
        return bTime - aTime;
      })
      .slice(0, 6);
  }, [interviewHistoryRows, meetingHistoryRows]);

  const escapeCsvField = (value: string | number) => {
    const text = value !== undefined && value !== null ? value.toString() : '';
    if (/[,\"\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const buildCsv = (rows: string[][]) => rows.map((row) => row.map(escapeCsvField).join(',')).join('\n');

  const toggleInterviewSelection = useCallback((id: string) => {
    setSelectedInterviewIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const toggleSelectAllInterviews = useCallback(() => {
    if (selectedInterviewIds.length === interviewHistoryRecords.length) {
      setSelectedInterviewIds([]);
      return;
    }
    setSelectedInterviewIds(interviewHistoryRecords.map((row) => String(row.id)));
  }, [interviewHistoryRecords, selectedInterviewIds.length]);

  const toggleMeetingSelection = useCallback((id: string) => {
    setSelectedMeetingIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const toggleSelectAllMeetings = useCallback(() => {
    if (selectedMeetingIds.length === meetingHistoryRecords.length) {
      setSelectedMeetingIds([]);
      return;
    }
    setSelectedMeetingIds(meetingHistoryRecords.map((row) => String(row.id)));
  }, [meetingHistoryRecords, selectedMeetingIds.length]);

  const buildInterviewPdf = useCallback((rows: InterviewRow[]) => {
    if (rows.length === 0) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Interview History', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    let cursor = 36;
    rows.forEach((entry, index) => {
      if (cursor > 270) {
        doc.addPage();
        cursor = 18;
      }
      doc.setFontSize(11);
      const titleLines = doc.splitTextToSize(`${index + 1}. ${entry.title}`, 180);
      titleLines.forEach((line) => {
        if (cursor > 270) {
          doc.addPage();
          cursor = 18;
        }
        doc.text(line, 14, cursor);
        cursor += 6;
      });
      doc.setFontSize(10);
      doc.text(`Candidate: ${entry.candidateName}`, 14, cursor);
      cursor += 6;
      doc.text(`Candidate ID: ${getInterviewCandidateId(entry)}`, 14, cursor);
      cursor += 6;
      doc.text(
        `Scheduled: ${
          entry.scheduledAt ? new Date(entry.scheduledAt).toLocaleString() : 'TBD'
        }`,
        14,
        cursor
      );
      cursor += 6;
      doc.text(`Status: ${entry.status}`, 14, cursor);
      cursor += 6;
      doc.text(`Session Seconds: ${entry.sessionSecondsUsed || 0}`, 14, cursor);
      cursor += 8;
    });
    doc.save(`interviews-history-${new Date().toISOString()}.pdf`);
  }, []);

  const handleDownloadAllInterviewsPdf = useCallback(() => {
    if (interviewHistoryRecords.length === 0) {
      flashWarning('No interviews to export.');
      return;
    }
    setInterviewExportingPdf(true);
    try {
      buildInterviewPdf(interviewHistoryRecords);
    } catch (err) {
      console.error('Failed to generate interview PDF', err);
      flashError('Failed to generate interview PDF');
    } finally {
      setInterviewExportingPdf(false);
    }
  }, [buildInterviewPdf, interviewHistoryRecords, flashWarning, flashError]);

  const handleDownloadSelectedInterviewsPdf = useCallback(() => {
    if (selectedInterviewIds.length === 0) {
      flashWarning('Select at least one interview.');
      return;
    }
    const rows = interviewHistoryRecords.filter((row) =>
      selectedInterviewIds.includes(String(row.id))
    );
    if (rows.length === 0) {
      flashWarning('No valid interviews selected.');
      return;
    }
    setInterviewExportingPdf(true);
    try {
      buildInterviewPdf(rows);
    } catch (err) {
      console.error('Failed to generate interview PDF', err);
      flashError('Failed to generate interview PDF');
    } finally {
      setInterviewExportingPdf(false);
    }
  }, [buildInterviewPdf, interviewHistoryRecords, selectedInterviewIds, flashWarning, flashError]);

  const downloadInterviewCsv = useCallback(() => {
    if (selectedInterviewIds.length === 0) {
      flashWarning('Select at least one interview.');
      return;
    }
    const rows = interviewHistoryRecords.filter((row) =>
      selectedInterviewIds.includes(String(row.id))
    );
    if (rows.length === 0) {
      flashWarning('No valid interviews selected.');
      return;
    }
    setInterviewCsvExporting(true);
    try {
      const lines = [
        [
          'Title',
          'Candidate',
          'Candidate ID',
          'Scheduled',
          'Status',
          'Duration (mins)',
          'Session Seconds',
        ],
        ...rows.map((row) => [
          row.title,
          row.candidateName,
          getInterviewCandidateId(row),
          row.scheduledAt ? new Date(row.scheduledAt).toLocaleString() : 'TBD',
          row.status,
          row.durationMinutes?.toString() || '0',
          row.sessionSecondsUsed?.toString() || '0',
        ]),
      ];
      const csvContent = buildCsv(lines);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'interviews-history.csv';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export interview CSV', err);
      flashError('Failed to export CSV');
    } finally {
      setInterviewCsvExporting(false);
    }
  }, [interviewHistoryRecords, selectedInterviewIds, flashWarning, flashError]);

  const handleInterviewCsvSingle = useCallback(
    async (row: InterviewRow) => {
      try {
        const answers = await getInterviewAnswers(row.id);
        const lines = [
          ['Question', 'Answer', 'Timestamp'],
          ...answers.map((a) => [a.questionContext || '', a.answer || '', a.timestamp || '']),
        ];
        const csvContent = buildCsv(lines);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `interview-${row.id}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
      } catch (err: any) {
        console.error('Failed to export interview CSV', err);
        flashError(err?.message || 'Failed to export CSV');
      }
    },
    [buildCsv, flashError]
  );

  const handleInterviewSummary = useCallback(
    async (row: InterviewRow) => {
      const id = String(row.id);
      if (interviewSummaryLoadingId) return;
      setInterviewSummaryLoadingId(id);
      try {
        const response = await generateInterviewSummary(row.id, selectedProvider || 'OPENAI');
        setInterviewSummaries((prev) => ({
          ...prev,
          [id]: response.summaryText || 'Summary unavailable.',
        }));
      } catch (err: any) {
        console.error('Failed to generate interview summary', err);
        flashError(err?.message || 'Failed to generate summary');
      } finally {
        setInterviewSummaryLoadingId(null);
      }
    },
    [flashError, interviewSummaryLoadingId, selectedProvider]
  );

  const handleInterviewSummaryBulk = useCallback(async () => {
    if (interviewSummaryLoadingId || interviewBulkSummarizing) return;
    if (selectedInterviewIds.length === 0) {
      flashWarning('Select at least one interview.');
      return;
    }
    const rows = interviewHistoryRecords.filter((row) =>
      selectedInterviewIds.includes(String(row.id))
    );
    if (rows.length === 0) {
      flashWarning('No valid interviews selected.');
      return;
    }
    setInterviewBulkSummarizing(true);
    flashInfo(`Generating summaries for ${rows.length} interviews...`);
    let success = 0;
    let skipped = 0;
    let failed = 0;
    try {
      for (const row of rows) {
        const id = String(row.id);
        if (interviewSummaries[id]) {
          skipped += 1;
          continue;
        }
        setInterviewSummaryLoadingId(id);
        try {
          const response = await generateInterviewSummary(row.id, selectedProvider || 'OPENAI');
          setInterviewSummaries((prev) => ({
            ...prev,
            [id]: response.summaryText || 'Summary unavailable.',
          }));
          success += 1;
        } catch (err) {
          failed += 1;
        }
      }
    } finally {
      setInterviewSummaryLoadingId(null);
      setInterviewBulkSummarizing(false);
      flashInfo(`Summary run complete. Success: ${success}, skipped: ${skipped}, failed: ${failed}.`);
    }
  }, [
    flashInfo,
    flashWarning,
    interviewBulkSummarizing,
    interviewHistoryRecords,
    interviewSummaries,
    interviewSummaryLoadingId,
    selectedInterviewIds,
    selectedProvider,
  ]);

  const buildMeetingPdf = useCallback((rows: Meeting[]) => {
    if (rows.length === 0) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Mentor Session History', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    let cursor = 36;
    rows.forEach((entry, index) => {
      if (cursor > 270) {
        doc.addPage();
        cursor = 18;
      }
      doc.setFontSize(11);
      doc.text(`${index + 1}. ${entry.technology}`, 14, cursor);
      cursor += 6;
      doc.setFontSize(10);
      doc.text(`Participant: ${getMeetingParticipant(entry)}`, 14, cursor);
      cursor += 6;
      if (entry.mentorId) {
        doc.text(`Host ID: ${entry.mentorId}`, 14, cursor);
        cursor += 6;
      }
      doc.text(
        `Scheduled: ${
          entry.scheduledAt ? new Date(entry.scheduledAt).toLocaleString() : 'TBD'
        }`,
        14,
        cursor
      );
      cursor += 6;
      doc.text(`Meeting Key: ${entry.meetingKey}`, 14, cursor);
      cursor += 6;
      doc.text(`Status: ${entry.status}`, 14, cursor);
      cursor += 8;
    });
    doc.save(`mentor-sessions-history-${new Date().toISOString()}.pdf`);
  }, []);

  const handleDownloadAllMeetingsPdf = useCallback(() => {
    if (meetingHistoryRecords.length === 0) {
      flashWarning('No meetings to export.');
      return;
    }
    setMeetingExportingPdf(true);
    try {
      buildMeetingPdf(meetingHistoryRecords);
    } catch (err) {
      console.error('Failed to generate meeting PDF', err);
      flashError('Failed to generate meeting PDF');
    } finally {
      setMeetingExportingPdf(false);
    }
  }, [buildMeetingPdf, meetingHistoryRecords, flashWarning, flashError]);

  const handleDownloadSelectedMeetingsPdf = useCallback(() => {
    if (selectedMeetingIds.length === 0) {
      flashWarning('Select at least one meeting.');
      return;
    }
    const rows = meetingHistoryRecords.filter((row) =>
      selectedMeetingIds.includes(String(row.id))
    );
    if (rows.length === 0) {
      flashWarning('No valid meetings selected.');
      return;
    }
    setMeetingExportingPdf(true);
    try {
      buildMeetingPdf(rows);
    } catch (err) {
      console.error('Failed to generate meeting PDF', err);
      flashError('Failed to generate meeting PDF');
    } finally {
      setMeetingExportingPdf(false);
    }
  }, [buildMeetingPdf, meetingHistoryRecords, selectedMeetingIds, flashWarning, flashError]);

  const downloadMeetingCsv = useCallback(() => {
    if (selectedMeetingIds.length === 0) {
      flashWarning('Select at least one meeting.');
      return;
    }
    const rows = meetingHistoryRecords.filter((row) =>
      selectedMeetingIds.includes(String(row.id))
    );
    if (rows.length === 0) {
      flashWarning('No valid meetings selected.');
      return;
    }
    setMeetingCsvExporting(true);
    try {
      const lines = [
        ['Host ID', 'Participant', 'Technology', 'Scheduled', 'Status', 'Meeting Key'],
        ...rows.map((row) => [
          row.mentorId,
          getMeetingParticipant(row),
          row.technology,
          row.scheduledAt ? new Date(row.scheduledAt).toLocaleString() : 'TBD',
          row.status,
          row.meetingKey,
        ]),
      ];
      const csvContent = buildCsv(lines);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'mentor-sessions-history.csv';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export meeting CSV', err);
      flashError('Failed to export CSV');
    } finally {
      setMeetingCsvExporting(false);
    }
  }, [meetingHistoryRecords, selectedMeetingIds, flashWarning, flashError]);

  const handleMeetingCsvSingle = useCallback(
    async (row: Meeting) => {
      try {
        const transcript = await getMeetingTranscript(row.id);
        const lines = (transcript || '')
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);
        const csvContent = buildCsv([['Line'], ...lines.map((line) => [line])]);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `mentor-session-${row.id}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
      } catch (err: any) {
        console.error('Failed to export meeting CSV', err);
        flashError(err?.message || 'Failed to export CSV');
      }
    },
    [buildCsv, flashError]
  );

  const handleMeetingSummary = useCallback(
    async (row: Meeting) => {
      const id = String(row.id);
      if (meetingSummaryLoadingId) return;
      setMeetingSummaryLoadingId(id);
      try {
        const response = await generateMeetingSummary(row.id, selectedProvider || 'OPENAI');
        setMeetingSummaries((prev) => ({
          ...prev,
          [id]: response.summaryText || 'Summary unavailable.',
        }));
      } catch (err: any) {
        console.error('Failed to generate meeting summary', err);
        flashError(err?.message || 'Failed to generate summary');
      } finally {
        setMeetingSummaryLoadingId(null);
      }
    },
    [flashError, meetingSummaryLoadingId, selectedProvider]
  );

  const handleMeetingSummaryBulk = useCallback(async () => {
    if (meetingSummaryLoadingId || meetingBulkSummarizing) return;
    if (selectedMeetingIds.length === 0) {
      flashWarning('Select at least one session.');
      return;
    }
    const rows = meetingHistoryRecords.filter((row) =>
      selectedMeetingIds.includes(String(row.id))
    );
    if (rows.length === 0) {
      flashWarning('No valid sessions selected.');
      return;
    }
    setMeetingBulkSummarizing(true);
    flashInfo(`Generating summaries for ${rows.length} sessions...`);
    let success = 0;
    let skipped = 0;
    let failed = 0;
    try {
      for (const row of rows) {
        const id = String(row.id);
        if (meetingSummaries[id]) {
          skipped += 1;
          continue;
        }
        setMeetingSummaryLoadingId(id);
        try {
          const response = await generateMeetingSummary(row.id, selectedProvider || 'OPENAI');
          setMeetingSummaries((prev) => ({
            ...prev,
            [id]: response.summaryText || 'Summary unavailable.',
          }));
          success += 1;
        } catch (err) {
          failed += 1;
        }
      }
    } finally {
      setMeetingSummaryLoadingId(null);
      setMeetingBulkSummarizing(false);
      flashInfo(`Summary run complete. Success: ${success}, skipped: ${skipped}, failed: ${failed}.`);
    }
  }, [
    flashInfo,
    flashWarning,
    meetingBulkSummarizing,
    meetingHistoryRecords,
    meetingSummaries,
    meetingSummaryLoadingId,
    selectedMeetingIds,
    selectedProvider,
  ]);

  const handleDeleteInterview = useCallback(
    async (interview: SavedInterview) => {
      if (!window.confirm(`Delete interview "${interview.title}"?`)) return;
      try {
        await deleteInterview(interview.id);
        setAllInterviews((prev) => prev.filter((item) => item.id !== interview.id));
        setSelectedInterviewIds((prev) => prev.filter((id) => id !== String(interview.id)));
      } catch (err: any) {
        console.error('Failed to delete interview', err);
        flashError(err.message || 'Failed to delete interview');
      }
    },
    []
  );

  const handleViewInterview = useCallback(
    (row: InterviewRow) => {
      flashInfo(
        `Title: ${row.title}\nCandidate: ${row.candidateName}\nCandidate ID: ${getInterviewCandidateId(
          row
        )}\nScheduled: ${
          row.scheduledAt ? new Date(row.scheduledAt).toLocaleString() : 'TBD'
        }\nStatus: ${row.status}`
      );
    },
    [flashInfo]
  );

  const handleViewMeeting = useCallback(
    (meeting: Meeting) => {
      flashInfo(
        `Technology: ${meeting.technology}\nParticipant: ${getMeetingParticipant(
          meeting
        )}\nHost ID: ${meeting.mentorId}\nScheduled: ${
          meeting.scheduledAt ? new Date(meeting.scheduledAt).toLocaleString() : 'TBD'
        }\nStatus: ${meeting.status}\nKey: ${meeting.meetingKey}`
      );
    },
    [flashInfo]
  );

  const handleDeleteSelectedInterviews = useCallback(async () => {
    if (selectedInterviewIds.length === 0) return;
    if (!window.confirm('Delete selected interviews?')) return;
    setProcessingInterviewDeletion(true);
    try {
      for (const id of selectedInterviewIds) {
        await deleteInterview(id);
      }
      setAllInterviews((prev) =>
        prev.filter((item) => !selectedInterviewIds.includes(String(item.id)))
      );
    } catch (err: any) {
      console.error('Failed to delete selected interviews', err);
      flashError(err.message || 'Failed to delete selected interviews');
    } finally {
      setProcessingInterviewDeletion(false);
      setSelectedInterviewIds([]);
      loadInterviews();
    }
  }, [selectedInterviewIds, loadInterviews]);

  const handleDeleteMeeting = useCallback(async (meeting: Meeting) => {
    if (!window.confirm(`Delete meeting ${meeting.meetingKey}?`)) return;
    try {
      await deleteMeetingAsAdmin(meeting.id);
      setAllMeetings((prev) => prev.filter((item) => item.id !== meeting.id));
      setSelectedMeetingIds((prev) => prev.filter((id) => id !== meeting.id));
    } catch (err: any) {
      console.error('Failed to delete meeting', err);
      flashError(err.message || 'Failed to delete meeting');
    }
  }, []);

  const handleDeleteSelectedMeetings = useCallback(async () => {
    if (selectedMeetingIds.length === 0) return;
    if (!window.confirm('Delete selected meetings?')) return;
    setProcessingMeetingDeletion(true);
    try {
      for (const id of selectedMeetingIds) {
        await deleteMeetingAsAdmin(id);
      }
      setAllMeetings((prev) => prev.filter((item) => !selectedMeetingIds.includes(item.id)));
    } catch (err: any) {
      console.error('Failed to delete selected meetings', err);
      flashError(err.message || 'Failed to delete selected meetings');
    } finally {
      setProcessingMeetingDeletion(false);
      setSelectedMeetingIds([]);
      loadMeetingHistory();
    }
  }, [selectedMeetingIds, loadMeetingHistory]);

  // Pending mentor approvals removed in new flow



  const ProviderCard: React.FC<{
    id: AIProvider;
    name: string;
    description: string;
    active: boolean;
  }> = ({ id, name, description, active }) => (
    <label
      className={`w-full text-left cursor-pointer rounded-xl border px-4 py-4 flex gap-3 items-start
        transition-all duration-150
        ${active
          ? 'border-blue-500 bg-white shadow-md'
          : 'border-slate-200/70 bg-white hover:border-blue-400 hover:bg-white'
        }`}
    >
      {/* Radio dot - like MCQ option */}
      <span
        className={`mt-1 h-4 w-4 rounded-full border flex items-center justify-center
          ${active ? 'border-blue-500' : 'border-gray-500'}`}
      >
        <span
          className={`h-2 w-2 rounded-full
            ${active ? 'bg-blue-500' : 'bg-transparent'}`}
        />
      </span>

      <div className="flex-1">
        <input
          type="radio"
          name="aiProvider"
          className="sr-only"
          value={id}
          checked={active}
          onChange={() => setSelectedProvider(id)}
        />

        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-semibold text-slate-900">{name}</span>
        </div>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </label>
  );

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    helper?: string;
    icon: React.ReactNode;
    accent: string;
  }> = ({ title, value, helper, icon, accent }) => (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-100/50 blur-2xl transition group-hover:opacity-80" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {title}
          </div>
          <div className="mt-2 text-3xl font-semibold text-slate-900">{value}</div>
          {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${accent}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const HistoryFilters = () => (
    <div className="glass-panel rounded-2xl border border-slate-200/70 bg-white/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Filters</h3>
          <p className="text-xs text-slate-500">
            Filter by date range, company, position, or keyword.
          </p>
        </div>
        <Button
          variant="secondary"
          className="text-[11px] px-3 py-2"
          onClick={clearHistoryFilters}
          disabled={!hasHistoryFilters}
        >
          Clear Filters
        </Button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">From</label>
          <input
            type="date"
            value={historyFromDate}
            onChange={(e) => setHistoryFromDate(e.target.value)}
            className="w-full rounded-xl border border-slate-200/70 bg-white px-3 py-2 text-xs text-slate-900"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">To</label>
          <input
            type="date"
            value={historyToDate}
            onChange={(e) => setHistoryToDate(e.target.value)}
            className="w-full rounded-xl border border-slate-200/70 bg-white px-3 py-2 text-xs text-slate-900"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Company</label>
          <input
            type="text"
            value={historyCompany}
            onChange={(e) => setHistoryCompany(e.target.value)}
            placeholder="Company or org"
            className="w-full rounded-xl border border-slate-200/70 bg-white px-3 py-2 text-xs text-slate-900"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Position</label>
          <input
            type="text"
            value={historyPosition}
            onChange={(e) => setHistoryPosition(e.target.value)}
            placeholder="Role or title"
            className="w-full rounded-xl border border-slate-200/70 bg-white px-3 py-2 text-xs text-slate-900"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Keyword</label>
          <input
            type="text"
            value={historyKeyword}
            onChange={(e) => setHistoryKeyword(e.target.value)}
            placeholder="Skill or topic"
            className="w-full rounded-xl border border-slate-200/70 bg-white px-3 py-2 text-xs text-slate-900"
          />
        </div>
      </div>
    </div>
  );

  const SupportFilters = () => (
    <div className="glass-panel rounded-2xl border border-slate-200/70 bg-white/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Filters</h3>
          <p className="text-xs text-slate-500">Filter by date or contact details.</p>
        </div>
        <Button
          variant="secondary"
          className="text-[11px] px-3 py-2"
          onClick={clearSupportFilters}
          disabled={!hasSupportFilters}
        >
          Clear Filters
        </Button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">From</label>
          <input
            type="date"
            value={supportFromDate}
            onChange={(e) => setSupportFromDate(e.target.value)}
            className="w-full rounded-xl border border-slate-200/70 bg-white px-3 py-2 text-xs text-slate-900"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">To</label>
          <input
            type="date"
            value={supportToDate}
            onChange={(e) => setSupportToDate(e.target.value)}
            className="w-full rounded-xl border border-slate-200/70 bg-white px-3 py-2 text-xs text-slate-900"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Name or Email
          </label>
          <input
            type="text"
            value={supportSearchQuery}
            onChange={(e) => setSupportSearchQuery(e.target.value)}
            placeholder="Search name or Gmail"
            className="w-full rounded-xl border border-slate-200/70 bg-white px-3 py-2 text-xs text-slate-900"
          />
        </div>
      </div>
    </div>
  );

  const adminTabs = [
    { id: 'OVERVIEW', label: 'Dashboard', icon: <FiGrid className="h-4 w-4" /> },
    { id: 'CREDITS', label: 'Credit Management', icon: <FiCreditCard className="h-4 w-4" /> },
    { id: 'USERS', label: 'Users', icon: <FiUsers className="h-4 w-4" /> },
    { id: 'PAYMENTS', label: 'Payments', icon: <FiBarChart2 className="h-4 w-4" /> },
    { id: 'SUPPORT', label: 'Support', icon: <FiHeadphones className="h-4 w-4" /> },
    {
      id: 'INTERVIEW_HISTORY',
      label: 'Interview History',
      icon: <FiFileText className="h-4 w-4" />,
    },
    {
      id: 'MENTOR_HISTORY',
      label: 'Mentor History',
      icon: <FiClock className="h-4 w-4" />,
    },
    { id: 'CONTENT', label: 'Content', icon: <FiFileText className="h-4 w-4" /> },
    { id: 'SETTINGS', label: 'Settings', icon: <FiSettings className="h-4 w-4" /> },
  ] as const;

  const renderAdminTabs = (variant: 'header' | 'panel') => {
    const base =
      'inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-all';
    const activeClass =
      variant === 'header'
        ? 'bg-white text-slate-900 shadow-sm'
        : 'bg-slate-900 text-white shadow-sm';
    const inactiveClass =
      variant === 'header'
        ? 'text-white/80 hover:text-white hover:bg-white/10'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100';
    return (
      <div
        className={
          variant === 'panel'
            ? 'flex flex-wrap gap-2 rounded-2xl border border-slate-200/70 bg-white/80 p-2 shadow-sm'
            : 'flex flex-wrap gap-2'
        }
      >
        {adminTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`${base} ${isActive ? activeClass : inactiveClass}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const revenueScale = Math.max(revenueStats.aiRevenue, revenueStats.mentorRevenue, 1);
  const aiRevenueShare =
    revenueStats.total > 0 ? (revenueStats.aiRevenue / revenueStats.total) * 100 : 50;
  const userDialogName = userActionDialog ? getUserLabel(userActionDialog.user) : 'this user';
  const userDialogAction =
    userActionDialog?.type === 'TOGGLE_ACTIVE'
      ? userActionDialog.nextActive
        ? 'Unblock'
        : 'Block'
      : '';
  const userDialogTitle = userActionDialog
    ? userActionDialog.type === 'DELETE'
      ? `Delete ${userDialogName}`
      : userActionDialog.type === 'RESET_PASSWORD'
        ? `Reset password for ${userDialogName}`
        : `${userDialogAction} ${userDialogName}`
    : '';
  const userDialogDescription = userActionDialog
    ? userActionDialog.type === 'DELETE'
      ? 'This will permanently remove the account and revoke access.'
      : userActionDialog.type === 'RESET_PASSWORD'
        ? 'Share the new password securely with the user.'
        : userActionDialog.nextActive
          ? 'Access will be restored immediately.'
          : 'The user will be blocked from signing in.'
    : '';
  const userDialogConfirmLabel = userActionDialog
    ? userActionDialog.type === 'DELETE'
      ? 'Delete User'
      : userActionDialog.type === 'RESET_PASSWORD'
        ? 'Update Password'
        : userDialogAction
    : '';
  const userDialogConfirmVariant = userActionDialog?.type === 'DELETE' ? 'danger' : 'primary';

  return (
    <AppShell
      currentUser={{ role: 'admin', name: 'Admin' }}
      title=""
      subtitle={undefined}
      titleIcon={<img src="/footer_logo.svg" alt="Buuzzer" className="h-12 w-auto" />}
      titleIconContainerClassName="flex items-center justify-center"
      headerClassName="border-transparent bg-gradient-to-r from-sky-700 via-blue-600 to-sky-600 text-white"
      titleClassName="sr-only"
      subtitleClassName="hidden"
      contentClassName="max-w-[1400px]"
      activeKey="dashboard"
      onNavigate={onNavigate}
      onLogout={onLogout}
      rightSlot={<div className="flex items-center gap-3">{renderAdminTabs('header')}</div>}
    >
 
      <main className="flex flex-col gap-8 pb-16">
        <div className="md:hidden">{renderAdminTabs('panel')}</div>

        {/* OVERVIEW TAB */}
        {activeTab === 'OVERVIEW' && (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
              <StatCard
                title="Total Users"
                value={totalUsers.toLocaleString()}
                helper="All registered accounts."
                icon={<FiUsers className="h-5 w-5" />}
                accent="bg-emerald-50 text-emerald-600"
              />
              <StatCard
                title="AI Credit Price"
                value={`₹${aiCreditPrice.toFixed(2)}`}
                helper="Current AI credit price."
                icon={<FiCpu className="h-5 w-5" />}
                accent="bg-sky-50 text-sky-600"
              />
              <StatCard
                title="Mentor Credit Price"
                value={`₹${mentorCreditPrice.toFixed(2)}`}
                helper="Current mentor credit price."
                icon={<FiCreditCard className="h-5 w-5" />}
                accent="bg-emerald-50 text-emerald-600"
              />
              <StatCard
                title="AI Interviews"
                value={aiInterviewStats.total.toLocaleString()}
                helper="AI interview records."
                icon={<FiActivity className="h-5 w-5" />}
                accent="bg-slate-100 text-slate-700"
              />
              <StatCard
                title="Mentor Sessions"
                value={mentorSessionStats.total.toLocaleString()}
                helper="Mentor sessions tracked."
                icon={<FiUserCheck className="h-5 w-5" />}
                accent="bg-emerald-100 text-emerald-700"
              />
              <StatCard
                title="Total Revenue"
                value={`₹${Math.round(revenueStats.total).toLocaleString()}`}
                helper="From completed sessions."
                icon={<FiTrendingUp className="h-5 w-5" />}
                accent="bg-emerald-100 text-emerald-700"
              />
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="glass-panel rounded-2xl border border-slate-200/70 bg-white/80 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Session Overview</h3>
                    <p className="text-xs text-slate-500">
                      Scheduled, in-progress, and completed sessions.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                    <FiActivity className="h-3 w-3" />
                    Live
                  </span>
                </div>
                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl border border-slate-200/70 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-900">AI Interviews</div>
                      <div className="text-xs text-slate-500">{aiInterviewStats.total} total</div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      <div className="rounded-xl bg-slate-50 p-3 text-center">
                        <div className="text-[10px] uppercase text-slate-500">Scheduled</div>
                        <div className="text-lg font-semibold text-slate-900">
                          {aiInterviewStats.scheduled}
                        </div>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3 text-center">
                        <div className="text-[10px] uppercase text-slate-500">In Progress</div>
                        <div className="text-lg font-semibold text-slate-900">
                          {aiInterviewStats.inProgress}
                        </div>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3 text-center">
                        <div className="text-[10px] uppercase text-slate-500">Completed</div>
                        <div className="text-lg font-semibold text-slate-900">
                          {aiInterviewStats.completed}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200/70 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-900">Mentor Sessions</div>
                      <div className="text-xs text-slate-500">{mentorSessionStats.total} total</div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      <div className="rounded-xl bg-slate-50 p-3 text-center">
                        <div className="text-[10px] uppercase text-slate-500">Scheduled</div>
                        <div className="text-lg font-semibold text-slate-900">
                          {mentorSessionStats.scheduled}
                        </div>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3 text-center">
                        <div className="text-[10px] uppercase text-slate-500">In Progress</div>
                        <div className="text-lg font-semibold text-slate-900">
                          {mentorSessionStats.inProgress}
                        </div>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3 text-center">
                        <div className="text-[10px] uppercase text-slate-500">Completed</div>
                        <div className="text-lg font-semibold text-slate-900">
                          {mentorSessionStats.completed}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-panel rounded-2xl border border-slate-200/70 bg-white/80 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Revenue Statistics</h3>
                    <p className="text-xs text-slate-500">Based on paid credit purchases.</p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                    <FiBarChart2 className="h-3 w-3" />
                    {paymentsLoading ? 'Loading' : 'Updated'}
                  </span>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-xs text-slate-500">Total Revenue</div>
                    <div className="text-2xl font-semibold text-slate-900">
                      ₹{Math.round(revenueStats.total).toLocaleString()}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      AI: ₹{Math.round(revenueStats.aiRevenue).toLocaleString()} - Mentor: ₹{' '}
                      {Math.round(revenueStats.mentorRevenue).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex h-28 items-end gap-4">
                    <div className="flex flex-1 flex-col items-center gap-2">
                      <div
                        className="w-10 rounded-2xl bg-emerald-500/90"
                        style={{
                          height: `${Math.max(
                            (revenueStats.aiRevenue / revenueScale) * 100,
                            8
                          )}%`,
                        }}
                      />
                      <span className="text-[11px] text-slate-500">AI</span>
                    </div>
                    <div className="flex flex-1 flex-col items-center gap-2">
                      <div
                        className="w-10 rounded-2xl bg-sky-500/90"
                        style={{
                          height: `${Math.max(
                            (revenueStats.mentorRevenue / revenueScale) * 100,
                            8
                          )}%`,
                        }}
                      />
                      <span className="text-[11px] text-slate-500">Mentor</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="glass-panel rounded-2xl border border-slate-200/70 bg-white/80 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Billable Minutes (14 days)</h3>
                    <p className="text-xs text-slate-500">Actual billed usage from sessions that recorded billedSeconds.</p>
                  </div>
                  <div className="text-xs text-slate-500">
                    AI {Math.round(last14Days.aiMinutes.reduce((s, v) => s + v, 0)).toLocaleString()}m · Mentor{' '}
                    {Math.round(last14Days.mentorMinutes.reduce((s, v) => s + v, 0)).toLocaleString()}m
                  </div>
                </div>
                <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                  <StackedBarChart
                    labels={last14Days.labels}
                    series={[
                      { name: 'AI', color: '#10b981', values: last14Days.aiMinutes },
                      { name: 'Mentor', color: '#38bdf8', values: last14Days.mentorMinutes },
                    ]}
                    valueSuffix="m"
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> AI billed minutes
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-sky-500" /> Mentor billed minutes
                  </span>
                </div>
              </div>

              <div className="glass-panel rounded-2xl border border-slate-200/70 bg-white/80 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">New Users (14 days)</h3>
                    <p className="text-xs text-slate-500">Signups based on user createdAt timestamps.</p>
                  </div>
                  <div className="text-xs text-slate-500">Total {last14Days.signups.reduce((s, v) => s + v, 0)}</div>
                </div>
                <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                  <LineChart labels={last14Days.labels} values={last14Days.signups} stroke="#7c3aed" />
                </div>
                <div className="mt-3 text-xs text-slate-500">Hover dots for per-day counts.</div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-3">
              <div className="glass-panel rounded-2xl border border-slate-200/70 bg-white/80 p-6 lg:col-span-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Paid Revenue (6 months)</h3>
                    <p className="text-xs text-slate-500">Actual paid purchases grouped by month (₹).</p>
                  </div>
                  <div className="text-xs text-slate-500">Last 6 months</div>
                </div>
                <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                  <StackedBarChart
                    labels={priceTrend.months}
                    series={[
                      { name: 'AI', color: '#10b981', values: priceTrend.ai },
                      { name: 'Mentor', color: '#38bdf8', values: priceTrend.mentor },
                    ]}
                    valuePrefix="₹"
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    AI credits
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-sky-500" />
                    Mentor credits
                  </span>
                  <span className="text-[11px] text-slate-500">Hover bars for exact values.</span>
                </div>
              </div>

              <div className="glass-panel rounded-2xl border border-slate-200/70 bg-white/80 p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Revenue Split</h3>
                    <p className="text-xs text-slate-500">AI vs Mentor contribution.</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                    Total ₹{Math.round(revenueStats.total).toLocaleString()}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <div
                    className="h-32 w-32 rounded-full border border-slate-200/70"
                    style={{
                      background: `conic-gradient(#10b981 0% ${aiRevenueShare}%, #38bdf8 ${aiRevenueShare}% 100%)`,
                    }}
                  />
                  <div className="flex-1 space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      AI Revenue
                      <span className="ml-auto font-semibold text-slate-900">
                        ₹{Math.round(revenueStats.aiRevenue).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="h-2 w-2 rounded-full bg-sky-500" />
                      Mentor Revenue
                      <span className="ml-auto font-semibold text-slate-900">
                        ₹{Math.round(revenueStats.mentorRevenue).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Share: {Math.round(aiRevenueShare)}% AI / {Math.round(100 - aiRevenueShare)}% Mentor
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                  <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                    <span>Revenue (last 14 days)</span>
                    <span>₹{Math.round(last14Days.revenueInr.reduce((s, v) => s + v, 0)).toLocaleString()}</span>
                  </div>
                  <LineChart labels={last14Days.labels} values={last14Days.revenueInr} valuePrefix="₹" stroke="#0ea5e9" />
                </div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="glass-panel rounded-2xl border border-slate-200/70 bg-white/80 p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
                  <span className="text-xs text-slate-500">Latest 6 events</span>
                </div>
                <div className="mt-4 space-y-3">
                  {recentActivityRows.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-white px-4 py-3"
                    >
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{entry.type}</div>
                        <div className="text-xs text-slate-500">{entry.owner}</div>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span
                          className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${getStatusBadgeClass(
                            entry.status
                          )}`}
                        >
                          {entry.status.replace('_', ' ')}
                        </span>
                        <span className="text-slate-500">
                          {entry.time ? new Date(entry.time).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                  {recentActivityRows.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200/70 py-8 text-center text-xs text-slate-500">
                      No activity recorded yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="glass-panel rounded-2xl border border-slate-200/70 bg-white/80 p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Recent Sessions</h3>
                  <span className="text-xs text-slate-500">AI + Mentor</span>
                </div>
                <div className="mt-4 space-y-2">
                  {recentActivityRows.slice(0, 4).map((entry) => (
                    <div
                      key={`${entry.id}-session`}
                      className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200/70 bg-white px-4 py-3 text-xs text-slate-500 md:grid-cols-[1.4fr_1fr_140px_120px] md:items-center"
                    >
                      <div className="text-sm font-semibold text-slate-900">{entry.type}</div>
                      <div>{entry.owner}</div>
                      <div
                        className={`inline-flex items-center gap-2 ${getStatusBadgeClass(
                          entry.status
                        )} rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide justify-self-start`}
                      >
                        {entry.status.replace('_', ' ')}
                      </div>
                      <div className="md:text-right">
                        {entry.time ? new Date(entry.time).toLocaleString() : 'N/A'}
                      </div>
                    </div>
                  ))}
                  {recentActivityRows.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200/70 py-8 text-center text-xs text-slate-500">
                      No sessions yet.
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        )}

        {/* CREDIT MANAGEMENT TAB */}
        {activeTab === 'CREDITS' && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="glass-panel rounded-2xl border border-slate-200/70 bg-white/80 p-6 lg:col-span-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Credit Management</h3>
                    <p className="text-xs text-slate-500">
                      Compensate users if credits were consumed during a technical issue.
                    </p>
                  </div>
                  {topupMessage && <span className="text-xs text-emerald-600">{topupMessage}</span>}
                </div>
                <form className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4" onSubmit={handleTopUp}>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">User ID</label>
                    <input
                      type="text"
                      value={topupSearchQuery}
                      onChange={(e) => setTopupSearchQuery(e.target.value)}
                      placeholder="Search by name, email, or user ID"
                      className="mb-2 w-full rounded-xl border border-slate-200/70 bg-white px-3 py-2 text-xs text-slate-900"
                    />
                    <select
                      value={topupIdentifier}
                      onChange={(e) => setTopupIdentifier(e.target.value)}
                      className="w-full bg-white border border-slate-200/70 rounded-xl px-3 py-2 text-sm text-slate-900"
                    >
                      <option value="">Select a user ID</option>
                      {filteredTopupUsers.map((user) => (
                        <option key={user.id} value={user.loginId || ''}>
                          {user.loginId} {user.name ? `- ${user.name}` : ''}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Only user IDs are accepted for credit adjustments.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">AI Credits</label>
                    <input
                      type="number"
                      min={0}
                      value={topupAiCredits}
                      onChange={(e) => setTopupAiCredits(e.target.value)}
                      className="w-full bg-white border border-slate-200/70 rounded-xl px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Mentor Credits</label>
                    <input
                      type="number"
                      min={0}
                      value={topupMentorCredits}
                      onChange={(e) => setTopupMentorCredits(e.target.value)}
                      className="w-full bg-white border border-slate-200/70 rounded-xl px-3 py-2 text-sm text-slate-900"
                    />
                  </div>
                  <div className="md:col-span-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">
                      Compensation credits apply immediately across the platform.
                    </p>
                    <Button type="submit" variant="primary" disabled={topupLoading}>
                      {topupLoading ? 'Adding...' : 'Add Credits'}
                    </Button>
                  </div>
                </form>
              </div>

              <div className="glass-panel rounded-2xl border border-slate-200/70 bg-white/80 p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Credit Overview</h3>
                  <FiUserCheck className="h-5 w-5 text-emerald-500" />
                </div>
                <p className="text-xs text-slate-500 mt-1">Selected user wallet snapshot.</p>
                <div className="mt-4">
                  {selectedTopupUser ? (
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {selectedTopupUser.name || selectedTopupUser.loginId}
                        </div>
                        <div className="text-xs text-slate-500">{selectedTopupUser.loginId}</div>
                        {selectedTopupUser.email && (
                          <div className="text-xs text-slate-400">{selectedTopupUser.email}</div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-slate-200/70 bg-white p-3 text-center">
                          <div className="text-[10px] uppercase text-slate-500">AI Credits</div>
                          <div className="text-xl font-semibold text-slate-900">
                            {selectedTopupUser.wallet?.aiInterviewCredits || 0}
                          </div>
                        </div>
                        <div className="rounded-xl border border-slate-200/70 bg-white p-3 text-center">
                          <div className="text-[10px] uppercase text-slate-500">Mentor Credits</div>
                          <div className="text-xl font-semibold text-slate-900">
                            {selectedTopupUser.wallet?.mentorSessionCredits || 0}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                          selectedTopupUser.active === false
                            ? 'border-red-200 bg-red-50 text-red-600'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {selectedTopupUser.active === false ? 'Blocked' : 'Active'}
                      </span>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200/70 p-6 text-center text-xs text-slate-500">
                      Select a user to view current credits.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-2xl border border-slate-200/70 bg-white/80 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Adjust Pricing</h3>
                  <p className="text-xs text-slate-500">
                    Update AI and mentor credit pricing in ₹ for the entire platform.
                  </p>
                </div>
                {pricingMessage && <span className="text-xs text-emerald-600">{pricingMessage}</span>}
              </div>
              <form onSubmit={handleSavePricing} className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">
                    AI Credit Price (₹)
                  </label>
                  <input
                    type="number"
                    min={1}
                    step="0.5"
                    className="w-full bg-white border border-slate-200/70 rounded-xl px-3 py-2 text-sm text-slate-900"
                    value={aiCreditPrice}
                    onChange={(e) => setAiCreditPrice(Number(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">
                    Mentor Credit Price (₹)
                  </label>
                  <input
                    type="number"
                    min={1}
                    step="0.5"
                    className="w-full bg-white border border-slate-200/70 rounded-xl px-3 py-2 text-sm text-slate-900"
                    value={mentorCreditPrice}
                    onChange={(e) => setMentorCreditPrice(Number(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">
                    Minimum Credits Per Purchase
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="w-full bg-white border border-slate-200/70 rounded-xl px-3 py-2 text-sm text-slate-900"
                    value={minCreditPurchase}
                    onChange={(e) => setMinCreditPurchase(Number(e.target.value) || 0)}
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Applies to AI and mentor credit purchases.</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">
                    Free Trial AI Credits
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full bg-white border border-slate-200/70 rounded-xl px-3 py-2 text-sm text-slate-900"
                    value={freeTrialAiCredits}
                    onChange={(e) => setFreeTrialAiCredits(Number(e.target.value) || 0)}
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Awarded automatically to new users.</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">
                    Free Trial Mentor Credits
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full bg-white border border-slate-200/70 rounded-xl px-3 py-2 text-sm text-slate-900"
                    value={freeTrialMentorCredits}
                    onChange={(e) => setFreeTrialMentorCredits(Number(e.target.value) || 0)}
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Shown on signup and used for mentor sessions.</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Razorpay Key ID</label>
                  <input
                    type="text"
                    className="w-full bg-white border border-slate-200/70 rounded-xl px-3 py-2 text-sm text-slate-900"
                    value={razorpayKeyId}
                    onChange={(e) => {
                      setRazorpayKeyId(e.target.value);
                      setRazorpayKeysDirty(true);
                    }}
                    placeholder="rzp_test_..."
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Razorpay Key Secret</label>
                  <input
                    type="password"
                    className="w-full bg-white border border-slate-200/70 rounded-xl px-3 py-2 text-sm text-slate-900"
                    value={razorpayKeySecret}
                    onChange={(e) => {
                      setRazorpayKeySecret(e.target.value);
                      setRazorpayKeysDirty(true);
                    }}
                    placeholder="secret"
                  />
                </div>
                <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">Changes apply instantly to all new purchases.</p>
                  <Button type="submit" variant="primary" disabled={pricingSaving}>
                {pricingSaving ? 'Updating...' : 'Update Pricing'}
                  </Button>
                </div>
              </form>
            </div>
        </div>
      )}

        {/* PAYMENTS TAB */}
        {activeTab === 'PAYMENTS' && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Paid Transactions"
                value={paidPayments.length.toLocaleString()}
                helper="Completed payments across all users."
                icon={<FiBarChart2 className="h-5 w-5" />}
                accent="bg-emerald-50 text-emerald-600"
              />
              <StatCard
                title="Total Revenue (₹)"
                value={Math.round(revenueStats.total).toLocaleString()}
                helper="Aggregated AI + Mentor revenue."
                icon={<FiTrendingUp className="h-5 w-5" />}
                accent="bg-sky-50 text-sky-600"
              />
              <StatCard
                title="AI Revenue (₹)"
                value={Math.round(revenueStats.aiRevenue).toLocaleString()}
                helper="From AI credit purchases."
                icon={<FiCpu className="h-5 w-5" />}
                accent="bg-slate-100 text-slate-700"
              />
              <StatCard
                title="Mentor Revenue (₹)"
                value={Math.round(revenueStats.mentorRevenue).toLocaleString()}
                helper="From Mentor credit purchases."
                icon={<FiUserCheck className="h-5 w-5" />}
                accent="bg-indigo-50 text-indigo-700"
              />
            </div>

            <div className="glass-panel rounded-2xl border border-slate-200/70 bg-white/80 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Payment History</h3>
                  <p className="text-xs text-slate-500">
                    All user purchases with amounts, status, and credit types.
                  </p>
                </div>
                {paymentsLoading && (
                  <span className="text-xs text-slate-500">Loading payments…</span>
                )}
              </div>

              <div className="mt-4 overflow-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Order ID</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">User</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Type</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Quantity</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Amount (₹)</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Status</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedPayments.map((p) => (
                      <tr key={p._id || p.orderId}>
                        <td className="px-3 py-2 font-mono text-xs text-slate-700">
                          {p.orderId}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {p.userId || 'N/A'}
                        </td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center gap-2 rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                            {p.creditType || 'AI'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-700">{p.quantity || 0}</td>
                        <td className="px-3 py-2 text-slate-900">
                          ₹{Math.round((Number(p.amount) || 0) / 100).toLocaleString()}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                              String(p.status || '').toLowerCase() === 'paid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {p.status || 'N/A'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-500">
                          {p.createdAt ? new Date(p.createdAt).toLocaleString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                    {sortedPayments.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-3 py-6 text-center text-sm text-slate-500"
                        >
                          No payments recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SUPPORT TAB */}
        {activeTab === 'SUPPORT' && (
          <div className="space-y-6">
            <div className="glass-panel rounded-2xl border border-slate-200/70 bg-white/80 p-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-lg font-semibold mb-1 text-slate-900">Contact Support Inbox</h2>
                <p className="text-sm text-slate-500">
                  Every message submitted via the contact form is recorded here for your review.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Current support contact:{' '}
                  <span className="text-slate-900">{supportPhone || 'Not configured'}</span>
                </p>
                <div className="flex flex-wrap gap-2 items-center mt-2">
                  <input
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full sm:w-20 bg-white border border-slate-200/70 rounded-lg px-2 py-1 text-xs"
                    placeholder="+91"
                  />
                  <input
                    value={localNumber}
                    onChange={(e) => setLocalNumber(e.target.value)}
                    className="w-full sm:w-40 bg-white border border-slate-200/70 rounded-lg px-2 py-1 text-xs"
                    placeholder="Phone number"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2 items-stretch sm:flex-row sm:items-center sm:flex-wrap">
                {/* <Button
                  variant="secondary"
                  onClick={handleExportSubmissions}
                  disabled={contactSubmissions.length === 0 || exportingPdf}
                  className="text-xs uppercase tracking-wide"
                >
                  {exportingPdf | 'Preparing PDF...' : 'Export Inbox PDF'}
                </Button> */}
                <Button
                  variant="primary"
                  onClick={handleUpdateSupportPhone}
                  disabled={supportSaving}
                  className="w-full sm:w-auto text-xs uppercase tracking-wide"
                >
                  {supportSaving ? 'Saving...' : 'Update Contact Number'}
                </Button>
                <button
                  type="button"
                  onClick={() => setWhatsappVisible((prev) => !prev)}
                  className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold uppercase tracking-wide px-3 py-2 rounded-full border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors"
                >
                  <svg className="h-5 w-5 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.04 2C6.49 2 2 6.48 2 12.02c0 1.93.52 3.72 1.43 5.26L2 22l4.94-1.35A9.987 9.987 0 0 0 12.04 22c5.54 0 10.04-4.48 10.04-9.98C22.08 6.48 17.58 2 12.04 2zm4.21 12.64c-.23.64-1.33 1.22-1.84 1.31-.49.08-1.11.14-1.7-.14-.96-.44-2-1.03-3.11-2.15-1.1-1.12-1.67-2.08-2.12-3.04-.3-.67.21-1.19.66-1.25.44-.05 1.37-.05 1.97.55.6.6.87 1.08 1.08 1.45.23.4.15.8.04.95-.12.17-.43.42-.69.64-.25.21-.5.44-.27.85.23.4 1.1 1.81 2.37 3.27 1.44 1.66 2.66 2.33 3.07 2.59.4.26.64.22.94.13.3-.09 1.84-.79 2.1-1.38.26-.6.26-1.11.18-1.21-.06-.1-.2-.16-.43-.28z" />
                  </svg>
                  {whatsappVisible ? 'Hide WhatsApp' : 'Show WhatsApp'}
                </button>
              </div>
            </div>
            {supportMessage && (
              <div className="text-xs text-emerald-600">{supportMessage}</div>
            )}
            {whatsappVisible && (
              <div className="text-emerald-600 text-xs">
                WhatsApp: {supportPhone || '4567892345'}
              </div>
            )}
            <SupportFilters />
            <div className="glass-panel sticky top-4 z-10 bg-white/90 border border-slate-200/70 rounded-2xl p-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button
                  variant="secondary"
                  className="text-xs uppercase tracking-wide w-full sm:w-auto"
                  onClick={loadContactEntries}
                >
                  Refresh
                </Button>
                <Button
                  variant="success"
                  className="text-xs uppercase tracking-wide w-full sm:w-auto"
                  onClick={handleDownloadSelectedContactsPdf}
                  disabled={selectedContactIds.length === 0 || exportingPdf}
                >
                  {exportingPdf ? 'Preparing PDF...' : 'Download Selected (PDF)'}
                </Button>
                <Button
                  variant="danger"
                  className="text-xs uppercase tracking-wide w-full sm:w-auto"
                  onClick={handleDeleteSelectedContacts}
                  disabled={selectedContactIds.length === 0 || contactDeleting}
                >
                  Delete Selected
                </Button>
                <Button
                  variant="accent"
                  className="text-xs uppercase tracking-wide w-full sm:w-auto"
                  onClick={downloadContactCsv}
                  disabled={filteredContactSubmissions.length === 0 || contactCsvExporting}
                >
                  {contactCsvExporting ? 'Exporting CSV...' : 'Download as Excel'}
                </Button>
              </div>
              <div className="text-xs text-slate-500">
                Records: {filteredContactSubmissions.length} of {contactSubmissions.length}
              </div>
            </div>
            <div className="glass-panel rounded-2xl border border-slate-200/70 overflow-hidden">
              <div className="hidden md:grid grid-cols-[48px_1.6fr_1fr_2fr_140px] text-xs uppercase text-slate-500 bg-white/80 border-b border-slate-200/70 px-4 py-3 gap-3">
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredContactSubmissions.length > 0 &&
                      selectedContactIds.length === filteredContactSubmissions.length
                    }
                    onChange={toggleSelectAllContacts}
                  />
                </div>
                <div>Date</div>
                <div>Name</div>
                <div>Subject</div>
                <div className="text-right">Actions</div>
              </div>
              <div className="hidden md:block max-h-[460px] overflow-y-auto">
                {contactLoading && (
                  <div className="text-xs text-slate-500 py-10 text-center border-b border-slate-200/70">
                    Loading submissions...
                  </div>
                )}
                {!contactLoading && contactSubmissions.length === 0 && (
                  <div className="text-xs text-slate-500 py-10 text-center border-b border-slate-200/70">
                    No submissions yet. The contact form will populate here as soon as someone reaches out.
                  </div>
                )}
                {!contactLoading &&
                  contactSubmissions.length > 0 &&
                  filteredContactSubmissions.length === 0 && (
                    <div className="text-xs text-slate-500 py-10 text-center border-b border-slate-200/70">
                      No submissions match the current filters.
                    </div>
                  )}
                {!contactLoading &&
                  filteredContactSubmissions.length > 0 &&
                  filteredContactSubmissions.map((entry) => (
                    <div
                      key={entry.id}
                      className="grid grid-cols-[48px_1.6fr_1fr_2fr_140px] items-start gap-3 border-b border-slate-200/70 px-4 py-3 text-sm text-slate-900 last:border-b-0"
                    >
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={selectedContactIds.includes(entry.id)}
                          onChange={() => toggleContactSelection(entry.id)}
                        />
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(entry.createdAt).toLocaleString()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{entry.name}</div>
                        <div className="text-[11px] text-slate-400">{entry.email}</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{entry.subject}</div>
                        <p className="text-xs text-slate-500 leading-snug">{entry.message}</p>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="secondary"
                          className="text-[10px] px-2 py-1"
                          onClick={() => handleViewContact(entry)}
                        >
                          View
                        </Button>
                        <Button
                          variant="secondary"
                          className="text-[10px] px-2 py-1 bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                          onClick={() => handleDeleteContact(entry.id)}
                          disabled={contactDeleting}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="md:hidden">
                {contactLoading && (
                  <div className="text-xs text-slate-500 py-6 text-center border-b border-slate-200/70">
                    Loading submissions...
                  </div>
                )}
                {!contactLoading && filteredContactSubmissions.length === 0 && (
                  <div className="text-xs text-slate-500 py-6 text-center border-b border-slate-200/70">
                    No submissions match the current filters.
                  </div>
                )}
                {!contactLoading &&
                  filteredContactSubmissions.length > 0 &&
                  filteredContactSubmissions.map((entry) => (
                    <div
                      key={entry.id}
                      className="border-b border-slate-200/70 px-4 py-3 last:border-0 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString()}</div>
                          <div className="text-sm font-semibold text-slate-900">{entry.name}</div>
                          <div className="text-[11px] text-slate-400">{entry.email}</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedContactIds.includes(entry.id)}
                          onChange={() => toggleContactSelection(entry.id)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{entry.subject}</div>
                        <p className="text-xs text-slate-500 leading-snug">{entry.message}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          className="text-[10px] px-3 py-1"
                          onClick={() => handleViewContact(entry)}
                        >
                          View
                        </Button>
                        <Button
                          variant="danger"
                          className="text-[10px] px-3 py-1"
                          onClick={() => handleDeleteSingleContact(entry.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            {contactActionMessage && (
              <div className="text-xs text-emerald-600">{contactActionMessage}</div>
            )}
            {viewingContact && (
              <div className="glass-panel rounded-2xl border border-slate-200/70 bg-white/80 p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-emerald-600">
                      {viewingContact.subject}
                    </p>
                    <h3 className="text-lg font-semibold text-slate-900">{viewingContact.name}</h3>
                    <p className="text-[11px] text-slate-400">{viewingContact.email}</p>
                  </div>
                  <Button
                    variant="secondary"
                    className="text-[10px] px-2 py-1"
                    onClick={() => setViewingContact(null)}
                  >
                    Close
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  Submitted: {new Date(viewingContact.createdAt).toLocaleString()}
                </p>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {viewingContact.message}
                </p>
              </div>
            )}
          </div>
        )}

        {/* INTERVIEW HISTORY TAB */}
        {activeTab === 'INTERVIEW_HISTORY' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Interview History</h2>
                <p className="text-sm text-slate-500">
                  Review AI interview sessions and export selected records.
                </p>
              </div>
              <span className="text-xs text-slate-500">
                Records: {interviewHistoryRecords.length} of {interviewHistoryRows.length}
              </span>
            </div>
            <HistoryFilters />
            <div className="glass-panel rounded-2xl border border-slate-200/70 bg-white/80 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    className="text-xs px-4 py-2"
                    onClick={loadInterviews}
                  >
                    Refresh
                  </Button>
                  <Button
                    variant="success"
                    className="text-xs px-4 py-2"
                    onClick={handleDownloadSelectedInterviewsPdf}
                    disabled={interviewExportingPdf || selectedInterviewIds.length === 0}
                  >
                    {interviewExportingPdf ? 'Preparing PDF...' : 'Download Selected (PDF)'}
                  </Button>
                  <Button
                    variant="danger"
                    className="text-xs px-4 py-2"
                    onClick={handleDeleteSelectedInterviews}
                    disabled={processingInterviewDeletion || selectedInterviewIds.length === 0}
                  >
                    {processingInterviewDeletion ? 'Deleting...' : 'Delete Selected'}
                  </Button>
                  <Button
                    variant="secondary"
                    className="text-xs px-4 py-2 bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                    onClick={downloadInterviewCsv}
                    disabled={interviewCsvExporting || selectedInterviewIds.length === 0}
                  >
                    {interviewCsvExporting ? 'Exporting...' : 'Download as Excel'}
                  </Button>
                  <Button
                    variant="secondary"
                    className="text-xs px-4 py-2"
                    onClick={handleInterviewSummaryBulk}
                    disabled={interviewBulkSummarizing || selectedInterviewIds.length === 0}
                  >
                    {interviewBulkSummarizing ? 'Summarizing...' : 'Generate Summaries'}
                  </Button>
                </div>
                <div className="text-xs text-slate-500">
                  Selected: {selectedInterviewIds.length}
                </div>
              </div>
            </div>
            <div className="glass-panel rounded-2xl border border-slate-200/70 bg-white/80 overflow-hidden">
              <div className="hidden md:grid grid-cols-[48px_1.2fr_1.4fr_1.6fr_0.8fr_160px] text-xs uppercase text-slate-500 bg-white/80 border-b border-slate-200/70 px-4 py-3 gap-3">
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-emerald-600"
                    checked={
                      interviewHistoryRecords.length > 0 &&
                      selectedInterviewIds.length === interviewHistoryRecords.length
                    }
                    onChange={toggleSelectAllInterviews}
                  />
                </div>
                <div>Date</div>
                <div>Candidate</div>
                <div>Title</div>
                <div>Status</div>
                <div className="text-right">Actions</div>
              </div>
              <div className="max-h-[520px] overflow-y-auto">
                {interviewHistoryRecords.length === 0 && (
                  <div className="p-8 text-center text-sm text-slate-500">
                    No interviews recorded yet.
                  </div>
                )}
                {interviewHistoryRecords.map((row) => {
                  const candidateId = getInterviewCandidateId(row);
                  const scheduledLabel = row.scheduledAt
                    ? new Date(row.scheduledAt).toLocaleString()
                    : 'TBD';
                  const isSelected = selectedInterviewIds.includes(String(row.id));
                  return (
                    <div
                      key={row.id}
                      className="grid grid-cols-1 gap-3 border-b border-slate-200/70 px-4 py-4 text-sm text-slate-900 md:grid-cols-[48px_1.2fr_1.4fr_1.6fr_0.8fr_160px] md:items-center"
                    >
                      <div className="flex items-center justify-start md:justify-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-emerald-600"
                          checked={isSelected}
                          onChange={() => toggleInterviewSelection(String(row.id))}
                        />
                      </div>
                      <div>
                        <div className="font-semibold">{scheduledLabel}</div>
                        <div className="text-xs text-slate-500">
                          Session: {row.sessionSecondsUsed || 0}s
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold">{row.candidateName}</div>
                        <div className="text-xs text-slate-500">User ID: {candidateId}</div>
                      </div>
                      <div>
                        <div className="font-semibold">{row.title}</div>
                        <div className="text-xs text-slate-500">
                          Interview ID: {row.id}
                        </div>
                        {interviewSummaries[String(row.id)] && (
                          <div className="mt-2 text-xs text-slate-600 whitespace-pre-line">
                            {interviewSummaries[String(row.id)]}
                          </div>
                        )}
                      </div>
                      <div>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${getStatusBadgeClass(
                            row.status
                          )}`}
                        >
                          {row.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 md:justify-end">
                        <Button
                          variant="secondary"
                          className="text-[10px] px-3 py-1"
                          onClick={() => handleViewInterview(row)}
                        >
                          View
                        </Button>
                        <Button
                          variant="secondary"
                          className="text-[10px] px-3 py-1"
                          onClick={() => handleInterviewCsvSingle(row)}
                        >
                          CSV
                        </Button>
                        <Button
                          variant="secondary"
                          className="text-[10px] px-3 py-1"
                          onClick={() => handleInterviewSummary(row)}
                          disabled={
                            interviewBulkSummarizing ||
                            interviewSummaryLoadingId === String(row.id)
                          }
                        >
                          {interviewSummaryLoadingId === String(row.id) ? 'Summarizing...' : 'Summary'}
                        </Button>
                        <Button
                          variant="secondary"
                          className="text-[10px] px-3 py-1 bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                          onClick={() => handleDeleteInterview(row)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MENTOR HISTORY TAB */}
        {activeTab === 'MENTOR_HISTORY' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Mentor Session History</h2>
                <p className="text-sm text-slate-500">
                  Track mentor session records and export selected items.
                </p>
              </div>
              <span className="text-xs text-slate-500">
                Records: {meetingHistoryRecords.length} of {meetingHistoryRows.length}
              </span>
            </div>
            <HistoryFilters />
            <div className="glass-panel rounded-2xl border border-slate-200/70 bg-white/80 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    className="text-xs px-4 py-2"
                    onClick={loadMeetingHistory}
                    disabled={meetingsLoading}
                  >
                    {meetingsLoading ? 'Refreshing...' : 'Refresh'}
                  </Button>
                  <Button
                    variant="success"
                    className="text-xs px-4 py-2"
                    onClick={handleDownloadSelectedMeetingsPdf}
                    disabled={meetingExportingPdf || selectedMeetingIds.length === 0}
                  >
                    {meetingExportingPdf ? 'Preparing PDF...' : 'Download Selected (PDF)'}
                  </Button>
                  <Button
                    variant="danger"
                    className="text-xs px-4 py-2"
                    onClick={handleDeleteSelectedMeetings}
                    disabled={processingMeetingDeletion || selectedMeetingIds.length === 0}
                  >
                    {processingMeetingDeletion ? 'Deleting...' : 'Delete Selected'}
                  </Button>
                  <Button
                    variant="secondary"
                    className="text-xs px-4 py-2 bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                    onClick={downloadMeetingCsv}
                    disabled={meetingCsvExporting || selectedMeetingIds.length === 0}
                  >
                    {meetingCsvExporting ? 'Exporting...' : 'Download as Excel'}
                  </Button>
                  <Button
                    variant="secondary"
                    className="text-xs px-4 py-2"
                    onClick={handleMeetingSummaryBulk}
                    disabled={meetingBulkSummarizing || selectedMeetingIds.length === 0}
                  >
                    {meetingBulkSummarizing ? 'Summarizing...' : 'Generate Summaries'}
                  </Button>
                </div>
                <div className="text-xs text-slate-500">
                  Selected: {selectedMeetingIds.length}
                </div>
              </div>
            </div>
            <div className="glass-panel rounded-2xl border border-slate-200/70 bg-white/80 overflow-hidden">
              <div className="hidden md:grid grid-cols-[48px_1.1fr_1.6fr_1.6fr_0.8fr_160px] text-xs uppercase text-slate-500 bg-white/80 border-b border-slate-200/70 px-4 py-3 gap-3">
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-emerald-600"
                    checked={
                      meetingHistoryRecords.length > 0 &&
                      selectedMeetingIds.length === meetingHistoryRecords.length
                    }
                    onChange={toggleSelectAllMeetings}
                  />
                </div>
                <div>Date</div>
                <div>Host & Participant</div>
                <div>Technology</div>
                <div>Status</div>
                <div className="text-right">Actions</div>
              </div>
              <div className="max-h-[520px] overflow-y-auto">
                {meetingHistoryRecords.length === 0 && (
                  <div className="p-8 text-center text-sm text-slate-500">
                    No mentor sessions recorded yet.
                  </div>
                )}
                {meetingHistoryRecords.map((row) => {
                  const participantName = getMeetingParticipant(row);
                  const scheduledLabel = row.scheduledAt
                    ? new Date(row.scheduledAt).toLocaleString()
                    : 'TBD';
                  const isSelected = selectedMeetingIds.includes(String(row.id));
                  return (
                    <div
                      key={row.id}
                      className="grid grid-cols-1 gap-3 border-b border-slate-200/70 px-4 py-4 text-sm text-slate-900 md:grid-cols-[48px_1.1fr_1.6fr_1.6fr_0.8fr_160px] md:items-center"
                    >
                      <div className="flex items-center justify-start md:justify-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-emerald-600"
                          checked={isSelected}
                          onChange={() => toggleMeetingSelection(String(row.id))}
                        />
                      </div>
                      <div>
                        <div className="font-semibold">{scheduledLabel}</div>
                        <div className="text-xs text-slate-500">Session ID: {row.id}</div>
                      </div>
                      <div>
                        <div className="font-semibold">Host ID: {row.mentorId}</div>
                        <div className="text-xs text-slate-500">
                          Participant: {participantName}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold">{row.technology}</div>
                        <div className="text-xs text-slate-500">
                          Meeting Key: {row.meetingKey}
                        </div>
                        {meetingSummaries[String(row.id)] && (
                          <div className="mt-2 text-xs text-slate-600 whitespace-pre-line">
                            {meetingSummaries[String(row.id)]}
                          </div>
                        )}
                      </div>
                      <div>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${getStatusBadgeClass(
                            row.status
                          )}`}
                        >
                          {row.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 md:justify-end">
                        <Button
                          variant="secondary"
                          className="text-[10px] px-3 py-1"
                          onClick={() => handleViewMeeting(row)}
                        >
                          View
                        </Button>
                        <Button
                          variant="secondary"
                          className="text-[10px] px-3 py-1"
                          onClick={() => handleMeetingCsvSingle(row)}
                        >
                          CSV
                        </Button>
                        <Button
                          variant="secondary"
                          className="text-[10px] px-3 py-1"
                          onClick={() => handleMeetingSummary(row)}
                          disabled={
                            meetingBulkSummarizing ||
                            meetingSummaryLoadingId === String(row.id)
                          }
                        >
                          {meetingSummaryLoadingId === String(row.id) ? 'Summarizing...' : 'Summary'}
                        </Button>
                        <Button
                          variant="secondary"
                          className="text-[10px] px-3 py-1 bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                          onClick={() => handleDeleteMeeting(row)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'USERS' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Users</h2>
                <p className="text-sm text-slate-500">
                  Block, unblock, reset passwords, or remove accounts.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search name, email, or user ID"
                  className="w-56 rounded-full border border-slate-200/70 bg-white px-3 py-2 text-xs text-slate-900"
                />
                <span className="text-xs text-slate-500">
                  Showing {visibleUsers} of {totalUsers}
                </span>
              </div>
            </div>
            {userSuccessMessage && (
              <div className="text-xs text-emerald-600">{userSuccessMessage}</div>
            )}
            <div className="glass-panel rounded-2xl border border-slate-200/70 bg-white/80 overflow-hidden">
              <div className="hidden md:grid grid-cols-[1.6fr_0.8fr_1fr_0.8fr_260px] text-xs uppercase text-slate-500 bg-white/80 border-b border-slate-200/70 px-4 py-3 gap-3">
                <div>User</div>
                <div>Role</div>
                <div>Credits</div>
                <div>Status</div>
                <div className="text-right">Actions</div>
              </div>
              <div className="max-h-[520px] overflow-y-auto">
                {adminUsers.length === 0 && (
                  <div className="p-8 text-center text-sm text-slate-500">
                    No users yet.
                  </div>
                )}
                {adminUsers.length > 0 && filteredAdminUsers.length === 0 && (
                  <div className="p-8 text-center text-sm text-slate-500">
                    No users match the current search.
                  </div>
                )}
                {filteredAdminUsers.map((user) => {
                  const isActive = user.active !== false;
                  const isAdmin = user.role === 'admin';
                  return (
                    <div
                      key={user.id}
                      className="grid grid-cols-1 gap-3 border-b border-slate-200/70 px-4 py-4 text-sm text-slate-900 md:grid-cols-[1.6fr_0.8fr_1fr_0.8fr_260px] md:items-center"
                    >
                      <div>
                        <div className="font-semibold">
                          {user.name || user.fullName || user.username || user.loginId}
                        </div>
                        <div className="text-xs text-slate-500">{user.loginId}</div>
                        {user.email && (
                          <div className="text-[11px] text-slate-400">{user.email}</div>
                        )}
                      </div>
                      <div className="text-xs text-slate-600 md:text-sm">
                        {getUserTypeLabel(user.role)}
                      </div>
                      <div className="text-xs text-slate-600 md:text-sm">
                        AI {user.wallet?.aiInterviewCredits ?? 0} | Mentor{' '}
                        {user.wallet?.mentorSessionCredits ?? 0}
                      </div>
                      <div>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                            isActive
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-red-200 bg-red-50 text-red-600'
                          }`}
                        >
                          {isActive ? 'Active' : 'Blocked'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 md:justify-end">
                        <Button
                          variant={isActive ? 'danger' : 'success'}
                          className="text-[10px] px-3 py-1"
                          onClick={() => handleToggleUserActive(user)}
                          disabled={isAdmin || userStatusUpdatingId === user.id}
                        >
                          {isActive ? (
                            <>
                              <FiLock className="h-3 w-3" />
                              Block
                            </>
                          ) : (
                            <>
                              <FiUnlock className="h-3 w-3" />
                              Unblock
                            </>
                          )}
                        </Button>
                        <Button
                          variant="secondary"
                          className="text-[10px] px-3 py-1"
                          onClick={() => handleResetPassword(user)}
                          disabled={isAdmin}
                        >
                          Reset Password
                        </Button>
                        <Button
                          variant="secondary"
                          className="text-[10px] px-3 py-1 bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                          onClick={() => handleDeleteUser(user)}
                          disabled={isAdmin}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* CONTENT TAB */}
        {activeTab === 'CONTENT' && (
          <div className="space-y-8">
            {contentMessage && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {contentMessage}
              </div>
            )}

            {/* Site / Footer Info */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Site & Social</p>
                  <p className="text-xs text-slate-500">Footer links, contact email, WhatsApp number.</p>
                </div>
                <Button onClick={saveSiteInfo} disabled={contentLoading}>Save</Button>
              </div>
              <div className="grid md:grid-cols-2 gap-4 p-6">
                <label className="text-xs text-slate-600">
                  Support Phone
                  <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={siteInfo.supportPhone || ''} onChange={(e) => setSiteInfo({ ...siteInfo, supportPhone: e.target.value })} />
                </label>
                <label className="text-xs text-slate-600">
                  Contact Email
                  <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={siteInfo.contactEmail || ''} onChange={(e) => setSiteInfo({ ...siteInfo, contactEmail: e.target.value })} />
                </label>
                <label className="text-xs text-slate-600">
                  Location / Address
                  <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={siteInfo.contactLocation || ''} onChange={(e) => setSiteInfo({ ...siteInfo, contactLocation: e.target.value })} />
                </label>
                <label className="text-xs text-slate-600 md:col-span-2">
                  Business Hours (one per line)
                  <textarea
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    rows={3}
                    value={(siteInfo.businessHours || []).join('\n')}
                    onChange={(e) =>
                      setSiteInfo({
                        ...siteInfo,
                        businessHours: e.target.value
                          .split('\n')
                          .map((line) => line.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </label>
                <label className="text-xs text-slate-600">
                  WhatsApp Number
                  <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={siteInfo.whatsappNumber || ''} onChange={(e) => setSiteInfo({ ...siteInfo, whatsappNumber: e.target.value })} />
                </label>
                <label className="text-xs text-slate-600">
                  Chrome Extension URL
                  <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={siteInfo.chromeExtensionUrl || ''} onChange={(e) => setSiteInfo({ ...siteInfo, chromeExtensionUrl: e.target.value })} />
                </label>
                <label className="text-xs text-slate-600">
                  Instagram URL
                  <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={siteInfo.instagramUrl || ''} onChange={(e) => setSiteInfo({ ...siteInfo, instagramUrl: e.target.value })} />
                </label>
                <label className="text-xs text-slate-600">
                  LinkedIn URL
                  <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={siteInfo.linkedinUrl || ''} onChange={(e) => setSiteInfo({ ...siteInfo, linkedinUrl: e.target.value })} />
                </label>
                <label className="text-xs text-slate-600">
                  YouTube URL
                  <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={siteInfo.youtubeUrl || ''} onChange={(e) => setSiteInfo({ ...siteInfo, youtubeUrl: e.target.value })} />
                </label>
              </div>
            </div>

            {/* Blog */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Blog Posts</p>
                <p className="text-xs text-slate-500">Title, hero image, tags (comma), bullets (newline), status.</p>
              </div>
                <Button onClick={upsertBlog} disabled={contentLoading}>Save Post</Button>
              </div>
              <div className="grid md:grid-cols-2 gap-4 p-6">
                <label className="text-xs text-slate-600">
                  Title
                  <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={editingBlog?.title || ''} onChange={(e) => setEditingBlog({ ...(editingBlog || {}), title: e.target.value })} />
                </label>
                <label className="text-xs text-slate-600">
                  Hero Image URL
                  <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={editingBlog?.heroImage || ''} onChange={(e) => setEditingBlog({ ...(editingBlog || {}), heroImage: e.target.value })} />
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-2 block text-xs text-slate-500"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleBlogImageUpload(file);
                    }}
                  />
                </label>
                <label className="text-xs text-slate-600">
                  Status
                  <select className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={editingBlog?.status || 'featured'} onChange={(e) => setEditingBlog({ ...(editingBlog || {}), status: e.target.value as any })}>
                    <option value="featured">Featured</option>
                    <option value="latest">Latest</option>
                    <option value="standard">Standard</option>
                  </select>
                </label>
                <label className="text-xs text-slate-600">
                  Tags (comma separated)
                  <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={(editingBlog?.tags || []).join(', ')} onChange={(e) => setEditingBlog({ ...(editingBlog || {}), tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })} />
                </label>
                <label className="text-xs text-slate-600 md:col-span-2">
                  Content
                  <textarea className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" rows={3} value={editingBlog?.content || ''} onChange={(e) => setEditingBlog({ ...(editingBlog || {}), content: e.target.value })} />
                </label>
                <label className="text-xs text-slate-600 md:col-span-2">
                  Bullet points (one per line)
                  <textarea className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" rows={3} value={(editingBlog?.bullets || []).join('\n')} onChange={(e) => setEditingBlog({ ...(editingBlog || {}), bullets: e.target.value.split('\n').map((b) => b.trim()).filter(Boolean) })} />
                </label>
              </div>
              <div className="border-t border-slate-200 p-6">
                <div className="flex flex-wrap gap-3">
                  {blogPosts.map((post) => (
                    <div key={post._id || post.id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{post.title}</p>
                        <p className="text-[11px] text-slate-500 uppercase">{post.status || 'standard'}</p>
                      </div>
                      <div className="ml-auto flex gap-2">
                        <Button variant="ghost" onClick={() => setEditingBlog(post)} size="sm">Edit</Button>
                        <Button variant="secondary" onClick={() => removeBlog(String(post._id || post.id || ''))} size="sm">Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pricing Bundles */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Pricing Bundles</p>
                  <p className="text-xs text-slate-500">These drive the landing pricing cards and purchase bundles.</p>
                </div>
                <Button onClick={upsertBundle} disabled={contentLoading}>Save Bundle</Button>
              </div>
              <div className="grid md:grid-cols-2 gap-4 p-6">
                <label className="text-xs text-slate-600">
                  Name
                  <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={editingBundle?.name || ''} onChange={(e) => setEditingBundle({ ...(editingBundle || {}), name: e.target.value })} />
                </label>
                <label className="text-xs text-slate-600">
                  Price (₹)
                  <input type="number" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={editingBundle?.priceInr || ''} onChange={(e) => setEditingBundle({ ...(editingBundle || {}), priceInr: Number(e.target.value) })} />
                </label>
                <label className="text-xs text-slate-600">
                  Credits
                  <input type="number" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={editingBundle?.credits || ''} onChange={(e) => setEditingBundle({ ...(editingBundle || {}), credits: Number(e.target.value) })} />
                </label>
                <label className="text-xs text-slate-600">
                  Bonus Credits
                  <input type="number" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={editingBundle?.bonusCredits || 0} onChange={(e) => setEditingBundle({ ...(editingBundle || {}), bonusCredits: Number(e.target.value) })} />
                </label>
                <label className="text-xs text-slate-600">
                  Tag / Badge
                  <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={editingBundle?.tag || ''} onChange={(e) => setEditingBundle({ ...(editingBundle || {}), tag: e.target.value })} />
                </label>
                <label className="text-xs text-slate-600">
                  Popular
                  <input type="checkbox" className="ml-2 align-middle" checked={Boolean(editingBundle?.popular)} onChange={(e) => setEditingBundle({ ...(editingBundle || {}), popular: e.target.checked })} />
                </label>
                <label className="text-xs text-slate-600">
                  Display Order
                  <input type="number" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={editingBundle?.displayOrder || 0} onChange={(e) => setEditingBundle({ ...(editingBundle || {}), displayOrder: Number(e.target.value) })} />
                </label>
                <label className="text-xs text-slate-600 flex items-center gap-2">
                  <input type="checkbox" checked={editingBundle?.showOnLanding !== false} onChange={(e) => setEditingBundle({ ...(editingBundle || {}), showOnLanding: e.target.checked })} />
                  Show on landing cards
                </label>
                <label className="text-xs text-slate-600">
                  Offer Discount (%)
                  <input type="number" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={editingBundle?.offerDiscountPercent || 0} onChange={(e) => setEditingBundle({ ...(editingBundle || {}), offerDiscountPercent: Number(e.target.value) })} />
                </label>
                <label className="text-xs text-slate-600">
                  Offer Bonus Credits
                  <input type="number" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={editingBundle?.offerBonusCredits || 0} onChange={(e) => setEditingBundle({ ...(editingBundle || {}), offerBonusCredits: Number(e.target.value) })} />
                </label>
                <label className="text-xs text-slate-600 md:col-span-2">
                  Offer Badge Text
                  <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={editingBundle?.offerBadge || ''} onChange={(e) => setEditingBundle({ ...(editingBundle || {}), offerBadge: e.target.value })} />
                </label>
                <label className="text-xs text-slate-600">
                  Offer Start (YYYY-MM-DD)
                  <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={editingBundle?.offerStart || ''} onChange={(e) => setEditingBundle({ ...(editingBundle || {}), offerStart: e.target.value })} />
                </label>
                <label className="text-xs text-slate-600">
                  Offer End (YYYY-MM-DD)
                  <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={editingBundle?.offerEnd || ''} onChange={(e) => setEditingBundle({ ...(editingBundle || {}), offerEnd: e.target.value })} />
                </label>
                <label className="text-xs text-slate-600 md:col-span-2">
                  Description
                  <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={editingBundle?.description || ''} onChange={(e) => setEditingBundle({ ...(editingBundle || {}), description: e.target.value })} />
                </label>
                <label className="text-xs text-slate-600 md:col-span-2">
                  Features (one per line)
                  <textarea className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" rows={3} value={(editingBundle?.features || []).join('\n')} onChange={(e) => setEditingBundle({ ...(editingBundle || {}), features: e.target.value.split('\n').map((f) => f.trim()).filter(Boolean) })} />
                </label>
              </div>
              <div className="border-t border-slate-200 p-6 flex flex-wrap gap-3">
                {pricingBundles.map((bundle) => (
                  <div key={bundle._id || bundle.id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{bundle.name}</p>
                      <p className="text-[11px] text-slate-500 uppercase">₹{bundle.priceInr} | {bundle.credits} credits | order {bundle.displayOrder || 0}{bundle.showOnLanding === false ? ' | hidden' : ''}</p>
                    </div>
                    <div className="ml-auto flex gap-2">
                      <Button variant="ghost" onClick={() => setEditingBundle(bundle)} size="sm">Edit</Button>
                      <Button variant="secondary" onClick={() => removeBundle(String(bundle._id || bundle.id || ''))} size="sm">Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Testimonials */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Testimonials</p>
                  <p className="text-xs text-slate-500">Use the same card layout as landing page.</p>
                </div>
                <Button onClick={upsertTestimonial} disabled={contentLoading}>Save Testimonial</Button>
              </div>
              <div className="grid md:grid-cols-2 gap-4 p-6">
                <label className="text-xs text-slate-600">
                  Name
                  <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={editingTestimonial?.name || ''} onChange={(e) => setEditingTestimonial({ ...(editingTestimonial || {}), name: e.target.value })} />
                </label>
                <label className="text-xs text-slate-600">
                  Role
                  <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={editingTestimonial?.role || ''} onChange={(e) => setEditingTestimonial({ ...(editingTestimonial || {}), role: e.target.value })} />
                </label>
                <label className="text-xs text-slate-600">
                  Company
                  <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={editingTestimonial?.company || ''} onChange={(e) => setEditingTestimonial({ ...(editingTestimonial || {}), company: e.target.value })} />
                </label>
                <label className="text-xs text-slate-600">
                  Photo URL
                  <div className="mt-1 flex flex-col gap-2">
                    <div className="flex gap-3 items-center">
                      <input
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={editingTestimonial?.photoUrl || ''}
                        onChange={(e) =>
                          setEditingTestimonial({ ...(editingTestimonial || {}), photoUrl: e.target.value })
                        }
                        placeholder="Paste image URL or upload below"
                      />
                      <label className="text-[11px] text-slate-600 border border-slate-200 rounded-lg px-3 py-2 cursor-pointer hover:bg-slate-50">
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              void handleTestimonialImageUpload(file);
                            }
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                    {editingTestimonial?.photoUrl && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>Preview:</span>
                        <img
                          src={resolveMediaUrl(editingTestimonial.photoUrl)}
                          alt="testimonial avatar preview"
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                      </div>
                    )}
                    <p className="text-[11px] text-slate-500">Uploaded images are saved under /uploads and can be used directly.</p>
                  </div>
                </label>
                <label className="text-xs text-slate-600 md:col-span-2">
                  Quote
                  <textarea className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" rows={3} value={editingTestimonial?.quote || ''} onChange={(e) => setEditingTestimonial({ ...(editingTestimonial || {}), quote: e.target.value })} />
                </label>
                <label className="text-xs text-slate-600">
                  Rating
                  <input type="number" min={1} max={5} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={editingTestimonial?.rating || 5} onChange={(e) => setEditingTestimonial({ ...(editingTestimonial || {}), rating: Number(e.target.value) })} />
                </label>
              </div>
              <div className="border-t border-slate-200 p-6 flex flex-wrap gap-3">
                {testimonials.map((t) => (
                  <div key={t._id || t.id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                      <p className="text-[11px] text-slate-500">{t.role} @ {t.company}</p>
                    </div>
                    <div className="ml-auto flex gap-2">
                      <Button variant="ghost" onClick={() => setEditingTestimonial(t)} size="sm">Edit</Button>
                      <Button variant="secondary" onClick={() => removeTestimonial(String(t._id || t.id || ''))} size="sm">Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQs */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">FAQs</p>
                  <p className="text-xs text-slate-500">Manage landing FAQs.</p>
                </div>
                <Button onClick={upsertFaq} disabled={contentLoading}>Save FAQ</Button>
              </div>
              <div className="grid md:grid-cols-2 gap-4 p-6">
                <label className="text-xs text-slate-600 md:col-span-2">
                  Question
                  <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={editingFaq?.question || ''} onChange={(e) => setEditingFaq({ ...(editingFaq || {}), question: e.target.value })} />
                </label>
                <label className="text-xs text-slate-600 md:col-span-2">
                  Answer
                  <textarea className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" rows={3} value={editingFaq?.answer || ''} onChange={(e) => setEditingFaq({ ...(editingFaq || {}), answer: e.target.value })} />
                </label>
              </div>
              <div className="border-t border-slate-200 p-6 flex flex-wrap gap-3">
                {faqs.map((f) => (
                  <div key={f._id || f.id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 line-clamp-1">{f.question}</p>
                    </div>
                    <div className="ml-auto flex gap-2">
                      <Button variant="ghost" onClick={() => setEditingFaq(f)} size="sm">Edit</Button>
                      <Button variant="secondary" onClick={() => removeFaq(String(f._id || f.id || ''))} size="sm">Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'SETTINGS' && (
  <form onSubmit={handleSaveSettings} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
    <div className="glass-panel rounded-2xl border border-slate-200/70 bg-white/80 p-6">
      <h2 className="text-lg font-semibold mb-3 text-slate-900">AI Provider</h2>
      <p className="text-xs text-slate-500 mb-3">
        Select one provider below. The selected card becomes the system default.
      </p>

      <div className="space-y-3">
        <ProviderCard
          id="OPENAI"
          name="OpenAI"
          description="Use GPT models (recommended for rich, conversational feedback)."
          active={selectedProvider === 'OPENAI'}
        />
        <ProviderCard
          id="GEMINI"
          name="Google Gemini"
          description="Use Gemini models for multilingual and Google-aligned responses."
          active={selectedProvider === 'GEMINI'}
        />
        <ProviderCard
          id="DEEPSEEK"
          name="DeepSeek"
          description="Use DeepSeek for efficient and cost-effective interview analysis."
          active={selectedProvider === 'DEEPSEEK'}
        />
      </div>
    </div>

    <div className="glass-panel rounded-2xl border border-slate-200/70 bg-white/80 p-6">
      <h2 className="text-lg font-semibold mb-3 text-slate-900">Model Selection</h2>
      <p className="text-xs text-slate-500 mb-3">
        Choose the model to use for each provider or provide a custom identifier.
      </p>
      <div className="space-y-6">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">OpenAI Model</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              className="flex-1 bg-white border border-slate-200/70 rounded-xl px-3 py-2 text-sm text-slate-900"
              value={openaiModel}
              onChange={(e) => setOpenaiModel(e.target.value)}
            >
              {OPENAI_MODEL_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <input
              type="text"
              className="flex-1 bg-white border border-slate-200/70 rounded-xl px-3 py-2 text-sm text-slate-900"
              placeholder="Custom OpenAI model"
              value={openaiModelCustom}
              onChange={(e) => setOpenaiModelCustom(e.target.value)}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Custom entry overrides the dropdown value.
          </p>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Gemini Model</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              className="flex-1 bg-white border border-slate-200/70 rounded-xl px-3 py-2 text-sm text-slate-900"
              value={geminiModel}
              onChange={(e) => setGeminiModel(e.target.value)}
            >
              {GEMINI_MODEL_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <input
              type="text"
              className="flex-1 bg-white border border-slate-200/70 rounded-xl px-3 py-2 text-sm text-slate-900"
              placeholder="Custom Gemini model"
              value={geminiModelCustom}
              onChange={(e) => setGeminiModelCustom(e.target.value)}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Custom entry overrides the dropdown value.
          </p>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">DeepSeek Model</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              className="flex-1 bg-white border border-slate-200/70 rounded-xl px-3 py-2 text-sm text-slate-900"
              value={deepseekModel}
              onChange={(e) => setDeepseekModel(e.target.value)}
            >
              {DEEPSEEK_MODEL_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <input
              type="text"
              className="flex-1 bg-white border border-slate-200/70 rounded-xl px-3 py-2 text-sm text-slate-900"
              placeholder="Custom DeepSeek model"
              value={deepseekModelCustom}
              onChange={(e) => setDeepseekModelCustom(e.target.value)}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Custom entry overrides the dropdown value.
          </p>
        </div>
      </div>
    </div>

    <div className="glass-panel rounded-2xl border border-slate-200/70 bg-white/80 p-6">
      <h2 className="text-lg font-semibold mb-3 text-slate-900">Session Billing</h2>
      <p className="text-xs text-slate-500 mb-3">
        Control the grace period before credits start burning and whether sessions hard-stop
        at the scheduled duration.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs text-slate-600">
          Grace minutes
          <input
            type="number"
            min={0}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={Number.isFinite(sessionGraceMinutes) ? sessionGraceMinutes : 0}
            onChange={(e) => setSessionGraceMinutes(Number(e.target.value) || 0)}
          />
        </label>
        <label className="text-xs text-slate-600 flex items-center gap-2">
          <input
            type="checkbox"
            checked={sessionHardStopEnabled}
            onChange={(e) => setSessionHardStopEnabled(e.target.checked)}
          />
          Hard stop at scheduled duration
        </label>
      </div>
    </div>

    <div className="glass-panel rounded-2xl border border-slate-200/70 bg-white/80 p-6 lg:col-span-2">
      <h2 className="text-lg font-semibold mb-3 text-slate-900">API Keys</h2>
      <p className="text-xs text-slate-500 mb-3">
        These values are loaded from the backend. To change a key, clear the field, paste the new
        value and save.
      </p>

      <div className="space-y-3">
        <ApiKeyField
          label="OpenAI Key"
          value={openaiKey}
          onChange={handleOpenaiKeyChange}
          placeholder="sk-..."
        />

        <ApiKeyField
          label="Gemini Key"
          value={geminiKey}
          onChange={handleGeminiKeyChange}
          placeholder="AIza-..."
        />

        <ApiKeyField
          label="DeepSeek Key"
          value={deepSeekKey}
          onChange={handleDeepSeekKeyChange}
          placeholder="deepseek-..."
        />

        <ApiKeyField
          label="Deepgram Key (Audio)"
          value={deepgramKey}
          onChange={handleDeepgramKeyChange}
          placeholder="dg-..."
        />
      </div>
    </div>

    <div className="lg:col-span-2">
      <Button type="submit" fullWidth disabled={settingsSaving} className="py-2 text-sm">
        {settingsSaving ? 'Saving...' : 'Save Settings'}
      </Button>
      {settingsMessage && (
        <p className="text-xs text-center mt-2 text-slate-600">{settingsMessage}</p>
      )}
    </div>
  </form>
)}
      </main>
      {userActionDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200/70 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{userDialogTitle}</h3>
                <p className="text-xs text-slate-500">{userDialogDescription}</p>
              </div>
              <button
                type="button"
                onClick={handleCloseUserAction}
                className="rounded-full border border-slate-200/70 px-2 py-1 text-xs text-slate-500 hover:text-slate-700"
                disabled={userActionLoading}
              >
                Close
              </button>
            </div>
            {userActionDialog.type === 'RESET_PASSWORD' && (
              <div className="mt-4">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  New password
                </label>
                <input
                  type="password"
                  value={userActionPassword}
                  onChange={(e) => setUserActionPassword(e.target.value)}
                  placeholder="Enter a strong password"
                  className="w-full rounded-xl border border-slate-200/70 bg-white px-3 py-2 text-sm text-slate-900"
                />
              </div>
            )}
            <div className="mt-6 flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={handleCloseUserAction} disabled={userActionLoading}>
                Cancel
              </Button>
              <Button
                variant={userDialogConfirmVariant}
                onClick={handleConfirmUserAction}
                disabled={userActionLoading}
              >
                {userActionLoading ? 'Working...' : userDialogConfirmLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
};
