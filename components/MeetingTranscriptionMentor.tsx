import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  API_BASE,
  getDeepgramKey,
  updateMeetingStatus,
  getMeetingTranscript,
  getStoredToken,
  recordMeetingSessionUsage,
  generateMeetingSummary,
} from '../services/backendApi';
import { Meeting, MeetingStatus } from '../types';
import { Button } from './Button';
import { jsPDF } from 'jspdf';
import { FiAlertCircle, FiArrowLeft, FiDownload, FiMic, FiSquare, FiPlay } from 'react-icons/fi';

interface ChunkLine {
  text: string;
  timestamp: string;
  from: string;
}

interface TranscriptParagraph {
  id: string;
  text: string;
  timestamp: string;
  from: string;
}

interface Props {
  meeting: Meeting;
  onBack: () => void;
}

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

export const MeetingTranscriptionMentor: React.FC<Props> = ({ meeting, onBack }) => {
  const [status, setStatus] = useState<MeetingStatus>(meeting.status);
  const [deepgramKey, setDeepgramKey] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionSeconds, setSessionSeconds] = useState<number>(meeting.totalSessionSeconds || 0);
  const [billedMinutes, setBilledMinutes] = useState<number>(
    Math.ceil(Number(meeting.billedSeconds || 0) / 60)
  );
  
  const [paragraphs, setParagraphs] = useState<TranscriptParagraph[]>(() => {
    if (!meeting.transcript) return [];
    const parsed = meeting.transcript
      .split('\n')
      .filter(Boolean)
      .map((text, index) => ({
        id: `${Date.now()}-${index}`,
        text,
        timestamp: new Date().toISOString(),
        from: 'mentor',
      }));
    return parsed.reverse();
  });

  const [finalTranscript, setFinalTranscript] = useState(meeting.transcript || '');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [summaryText, setSummaryText] = useState<string>(meeting.summaryText || '');
  const [summaryTopics, setSummaryTopics] = useState<string[]>(meeting.summaryTopics || []);
  const [summaryData, setSummaryData] = useState<any>(meeting.summaryData || null);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);

  const meetingSocketRef = useRef<Socket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const deepgramSocketRef = useRef<WebSocket | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const usageTimerRef = useRef<number | null>(null);
  const lastUsagePingRef = useRef<number | null>(null);
  const totalSessionRef = useRef<number>(meeting.totalSessionSeconds || 0);
  const statusRef = useRef<MeetingStatus>(meeting.status);
  const flushUsageRef = useRef<(force?: boolean) => Promise<void>>(async () => undefined);
  const lastParagraphAtRef = useRef<number | null>(null);

  const meetingId = meeting.id;
  const meetingKey = meeting.meetingKey;

  const PARAGRAPH_BREAK_MS = 9000;

  // Auto-scroll effect (newest paragraphs appear at the top)
  useEffect(() => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [paragraphs.length]);

  const appendParagraph = useCallback((chunk: ChunkLine) => {
    const cleaned = chunk.text.trim();
    if (!cleaned) return;
    const now = Date.now();
    const lastAt = lastParagraphAtRef.current;
    const shouldBreak = !lastAt || now - lastAt >= PARAGRAPH_BREAK_MS;
    lastParagraphAtRef.current = now;

    setParagraphs((prev) => {
      if (shouldBreak || prev.length === 0) {
        const next: TranscriptParagraph = {
          id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
          text: cleaned,
          timestamp: chunk.timestamp || new Date().toISOString(),
          from: chunk.from || 'mentor',
        };
        return [next, ...prev];
      }
      const [current, ...rest] = prev;
      if (current.text === cleaned) return prev;
      const spacer = current.text && !current.text.endsWith(' ') ? ' ' : '';
      return [{ ...current, text: `${current.text}${spacer}${cleaned}` }, ...rest];
    });

    setFinalTranscript((prev) => {
      const base = prev || '';
      if (!base) return cleaned;
      if (base.endsWith(cleaned)) return base;
      return shouldBreak ? `${base}\n${cleaned}` : `${base} ${cleaned}`;
    });
  }, []);

  const handleServerChunk = useCallback(
    (payload: { text?: string; timestamp?: string; from?: string }) => {
      if (!payload?.text) return;
      appendParagraph({
        text: payload.text.trim(),
        timestamp: payload.timestamp || new Date().toISOString(),
        from: payload.from || 'mentor',
      });
    },
    [appendParagraph]
  );

  const stopUsageTimer = useCallback(() => {
    if (usageTimerRef.current) {
      window.clearInterval(usageTimerRef.current);
      usageTimerRef.current = null;
    }
  }, []);

  const flushUsage = useCallback(
    async (force = false) => {
      if (status === 'COMPLETED' || status === 'EXPIRED') return;
      const now = Date.now();
      const last = lastUsagePingRef.current;
      if (!force && last && now - last < 5000) return;
      if (!last) {
        lastUsagePingRef.current = now;
        if (!force) return;
      }
      const delta = last ? Math.floor((now - last) / 1000) : 0;
      if (!force && delta <= 0) return;
      lastUsagePingRef.current = now;
      try {
        const payload = force
          ? { finalize: true, endedAt: new Date().toISOString() }
          : { seconds: delta };
        const resp = await recordMeetingSessionUsage(meetingId, payload);
        const total =
          typeof resp?.total_session_seconds === 'number'
            ? resp.total_session_seconds
            : totalSessionRef.current + delta;
        totalSessionRef.current = total;
        setSessionSeconds(total);
        if (typeof resp?.billed_minutes === 'number') {
          setBilledMinutes(resp.billed_minutes);
        }
        if (resp?.status) {
          setStatus(resp.status as MeetingStatus);
        }
      } catch (err: any) {
        console.error('Failed to record mentor session usage', err);
        setError(err?.message || 'Failed to record usage');
        stopUsageTimer();
      }
    },
    [meetingId, status, stopUsageTimer]
  );

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    flushUsageRef.current = flushUsage;
  }, [flushUsage]);

  const exportCsv = useCallback(() => {
    const header = ['"timestamp"', '"speaker"', '"text"'];
    const ordered = [...paragraphs].reverse();
    const rows = ordered.map((para) => {
      const ts = para.timestamp ? new Date(para.timestamp).toISOString() : '';
      return `"${ts}","${para.from || 'mentor'}","${(para.text || '').replace(/"/g, '""')}"`;
    });
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `meeting-${meeting.meetingKey}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [paragraphs, meeting.meetingKey]);

  const generateSummary = useCallback(async () => {
    if (!finalTranscript && !paragraphs.length) return;
    setSummaryLoading(true);
    setError(null);
    try {
      const response = await generateMeetingSummary(meetingId);
      setSummaryText(response.summaryText || 'Summary unavailable.');
      setSummaryTopics(response.summaryTopics || []);
      setSummaryData(response.summaryData || null);
    } catch (err: any) {
      console.error('Failed to generate summary', err);
      setError(err?.message || 'Failed to generate summary');
    } finally {
      setSummaryLoading(false);
    }
  }, [finalTranscript, paragraphs, meetingId]);
  const fetchTranscript = useCallback(async () => {
    try {
      const transcript = await getMeetingTranscript(meetingId);
      if (transcript) {
        setFinalTranscript(transcript);
        const parsed = transcript
          .split('\n')
          .filter(Boolean)
          .map((line, index) => ({
            id: `${Date.now()}-${index}`,
            text: line,
            timestamp: new Date().toISOString(),
            from: 'mentor',
          }));
        setParagraphs(parsed.reverse());
        lastParagraphAtRef.current = Date.now();
      }
    } catch (err) {
      console.error('Could not refresh transcript', err);
    }
  }, [meetingId]);

  const handleStatus = useCallback(
    (payload: { status: MeetingStatus }) => {
      if (!payload?.status) return;
      setStatus(payload.status);
      if (payload.status === 'COMPLETED') {
        fetchTranscript();
        setIsListening(false);
      }
    },
    [fetchTranscript]
  );

  useEffect(() => {
    const token = getStoredToken();
    const socket = io(API_BASE, {
      transports: ['websocket'],
      auth: token ? { token } : undefined,
      withCredentials: true,
    });
    meetingSocketRef.current = socket;
    socket.emit('join_meeting', {
      meetingId,
      meetingKey,
      role: 'mentor',
    });
    socket.on('meeting_transcript_chunk', handleServerChunk);
    socket.on('meeting_status', handleStatus);
    socket.on('meeting_error', ({ message }: { message?: string }) => {
      if (message) setError(message);
    });

    return () => {
      socket.disconnect();
      meetingSocketRef.current = null;
    };
  }, [meetingId, meetingKey, handleServerChunk, handleStatus]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const key = await getDeepgramKey();
        if (!active) return;
        setDeepgramKey(key);
      } catch (err) {
        console.error('Failed to load Deepgram key', err);
        if (active) {
          setError('Missing Deepgram key. Configure it in the admin console.');
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const stopMedia = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current = null;
    }
    if (deepgramSocketRef.current) {
      deepgramSocketRef.current.close();
      deepgramSocketRef.current = null;
    }
    setInterimTranscript('');
  }, []);

  const startDeepgramStream = useCallback(async () => {
    if (!deepgramKey) {
      setError('Deepgram key not available');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4';
      }
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

    const socket = new WebSocket(
        'wss://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&interim_results=true',
        ['token', deepgramKey]
      );
      deepgramSocketRef.current = socket;

      socket.onopen = () => {
        setIsListening(true);
        recorder.start(250);
      };

      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0 && socket.readyState === 1) {
          socket.send(event.data);
        }
      });

      socket.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        const transcriptPart = payload.channel?.alternatives?.[0]?.transcript;

        if (!transcriptPart) return;
        const text = transcriptPart.trim();
        if (!text) return;

        if (payload.is_final) {
          setInterimTranscript('');
          // Emit to room so learners get the update
          meetingSocketRef.current?.emit('meeting_transcript_chunk', {
            meetingId,
            text,
          });
          // Also append locally immediately
          appendParagraph({
            text,
            timestamp: new Date().toISOString(),
            from: 'mentor',
          });
        } else {
          setInterimTranscript(text);
          // Broadcast interim to learners
          meetingSocketRef.current?.emit('meeting_transcript_interim', {
            meetingId,
            text,
            timestamp: new Date().toISOString(),
            from: 'mentor',
          });
        }
      };

      socket.onerror = (err) => {
        console.error('Deepgram websocket error', err);
        setError('Deepgram connection failed');
      };

      socket.onclose = () => {
        setIsListening(false);
      };
    } catch (err: any) {
      console.error('Microphone error', err);
      setError(err.message || 'Microphone access failed');
    }
  }, [deepgramKey, meetingId, appendParagraph]);

  useEffect(() => {
    if (status === 'COMPLETED' || status === 'EXPIRED') {
      stopUsageTimer();
      stopMedia();
      setIsListening(false);
    }
  }, [status, stopMedia, stopUsageTimer]);

  const handleStart = useCallback(async () => {
    if (status === 'COMPLETED' || status === 'EXPIRED' || isListening) return;
    if (status === 'PENDING') {
      setError('Meeting is pending admin approval.');
      return;
    }
    if (status === 'REJECTED') {
      setError('Meeting was rejected.');
      return;
    }
    setError(null);
    try {
      const updated = await updateMeetingStatus(meetingId, 'IN_PROGRESS');
      setStatus(updated.status);
      meetingSocketRef.current?.emit('meeting_status_update', {
        meetingId,
        status: 'IN_PROGRESS',
      });
      lastUsagePingRef.current = Date.now();
      if (!usageTimerRef.current) {
        usageTimerRef.current = window.setInterval(() => {
          void flushUsage();
        }, 30000);
      }
      await startDeepgramStream();
    } catch (err: any) {
      console.error('Failed to start meeting', err);
      setError(err.message || 'Could not start meeting');
    }
  }, [flushUsage, isListening, meetingId, startDeepgramStream, status]);

  const handleStopTranscription = useCallback(async () => {
    if (!isListening) return;
    await flushUsage(true);
    stopUsageTimer();
    stopMedia();
    setIsListening(false);
  }, [flushUsage, isListening, stopMedia, stopUsageTimer]);

  const handleComplete = useCallback(async () => {
    await flushUsage(true);
    stopUsageTimer();
    stopMedia();
    try {
      const updated = await updateMeetingStatus(meetingId, 'COMPLETED');
      setStatus(updated.status);
      if (updated.status === 'COMPLETED') {
        void generateSummary();
      }
    } catch (err: any) {
      console.error('Failed to complete meeting', err);
      setError(err?.message || 'Failed to complete session');
    }
  }, [flushUsage, meetingId, stopMedia, stopUsageTimer, generateSummary]);

  useEffect(() => {
    const durationSeconds = Math.max(0, (meeting.durationMinutes || 0) * 60);
    if (!durationSeconds) return;
    if (status === 'IN_PROGRESS' && sessionSeconds >= durationSeconds) {
      void handleComplete();
    }
  }, [handleComplete, meeting.durationMinutes, sessionSeconds, status]);

  useEffect(() => {
    if (status !== 'COMPLETED') return;
    if (summaryLoading) return;
    if (summaryText || summaryData) return;
    void generateSummary();
  }, [status, summaryLoading, summaryText, summaryData, generateSummary]);

  useEffect(() => {
    return () => {
      const shouldFinalize =
        statusRef.current === 'IN_PROGRESS' ||
        (totalSessionRef.current || 0) > 0 ||
        lastUsagePingRef.current !== null;
      if (shouldFinalize) {
        void flushUsageRef.current(true);
      }
      stopUsageTimer();
      stopMedia();
    };
  }, [stopMedia, stopUsageTimer]);

  const downloadTranscript = () => {
    const ordered = [...paragraphs].reverse();
    const text = finalTranscript || ordered.map((para) => para.text).join('\n');
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`Meeting Transcript - ${meeting.meetingKey}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    const bodyLines = doc.splitTextToSize(text, 180);
    let cursor = 40;
    bodyLines.forEach((line) => {
      if (cursor > 280) {
        doc.addPage();
        cursor = 20;
      }
      doc.text(line, 14, cursor);
      cursor += 6;
    });
    doc.save(`meeting-${meeting.meetingKey}.pdf`);
  };

  const statusLabel = useMemo(() => {
    if (status === 'COMPLETED') return 'Completed';
    if (status === 'EXPIRED') return 'Expired';
    if (status === 'IN_PROGRESS') return 'In Progress';
    return 'Scheduled';
  }, [status]);

  const timeUsedLabel = useMemo(() => {
    const mins = Math.floor(sessionSeconds / 60);
    const secs = sessionSeconds % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s used`;
  }, [sessionSeconds]);

  const billedLabel = useMemo(() => {
    if (billedMinutes <= 0) return 'No billable minutes yet';
    return `${billedMinutes} min billed`;
  }, [billedMinutes]);

  const resolvedSummaryData = useMemo(() => coerceSummaryData(summaryData), [summaryData]);
  const summaryStrengths = useMemo(
    () => normalizeSummaryList(resolvedSummaryData?.strengths),
    [resolvedSummaryData]
  );
  const summaryGaps = useMemo(
    () => normalizeSummaryList(resolvedSummaryData?.gaps),
    [resolvedSummaryData]
  );
  const summaryNextSteps = useMemo(
    () => normalizeSummaryList(resolvedSummaryData?.next_steps || resolvedSummaryData?.nextSteps),
    [resolvedSummaryData]
  );
  const summaryTopicsList = useMemo(() => {
    if (summaryTopics.length) return summaryTopics;
    return normalizeSummaryList(resolvedSummaryData?.topics);
  }, [resolvedSummaryData, summaryTopics]);
  const hasSummary = Boolean(
    summaryText ||
      summaryTopicsList.length ||
      summaryStrengths.length ||
      summaryGaps.length ||
      summaryNextSteps.length
  );

  const formatParagraphTime = useCallback((timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return timestamp;
    }
  }, []);

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      
      {/* Main Transcript Area - Full Page with Large Text */}
      <div className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-10 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
           
           {error && (
             <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2 max-w-3xl mx-auto shadow-sm animate-fade-in">
               <FiAlertCircle className="h-5 w-5 flex-shrink-0" />
               <span>{error}</span>
             </div>
           )}

           {hasSummary && (
              <div className="mb-6 w-full rounded-xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm">
                <p className="text-xs font-semibold text-amber-700 uppercase mb-2">AI Summary</p>
                {summaryTopicsList.length > 0 && (
                  <div className="text-xs text-slate-600 mb-2">
                    Topics: {summaryTopicsList.join(', ')}
                  </div>
                )}
                {summaryText && (
                  <div className="text-sm text-slate-800 whitespace-pre-line">{summaryText}</div>
                )}
                {summaryStrengths.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-slate-700 uppercase">Strengths</p>
                    <ul className="mt-1 list-disc pl-4 text-sm text-slate-700">
                      {summaryStrengths.map((item, idx) => (
                        <li key={`${item}-${idx}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {summaryGaps.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-slate-700 uppercase">Gaps</p>
                    <ul className="mt-1 list-disc pl-4 text-sm text-slate-700">
                      {summaryGaps.map((item, idx) => (
                        <li key={`${item}-${idx}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {summaryNextSteps.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-slate-700 uppercase">Next steps</p>
                    <ul className="mt-1 list-disc pl-4 text-sm text-slate-700">
                      {summaryNextSteps.map((item, idx) => (
                        <li key={`${item}-${idx}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

           <div className="w-full min-h-[60vh] outline-none">
              <div ref={topRef} />
              {paragraphs.length === 0 && !interimTranscript ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-slate-400">
                  <div className="mb-4 p-4 rounded-full bg-slate-100">
                    <FiMic className="h-8 w-8 text-slate-300" />
                  </div>
                  <p className="text-xl font-light italic">Ready to start meeting with {meeting.studentName}...</p>
                  <p className="text-sm mt-2 text-slate-400">Press "Start Meeting" below to begin transcription</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {interimTranscript && (
                    <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
                      <div className="text-[11px] font-semibold uppercase text-sky-600">Live</div>
                      <div className="mt-2 text-lg text-slate-800 leading-relaxed">{interimTranscript}</div>
                    </div>
                  )}
                  {paragraphs.map((para) => (
                    <div key={para.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between text-[11px] uppercase text-slate-400">
                        <span>{formatParagraphTime(para.timestamp)}</span>
                        <span>{para.from === 'mentor' ? 'Mentor' : para.from}</span>
                      </div>
                      <div className="mt-2 text-lg text-slate-800 leading-relaxed">{para.text}</div>
                    </div>
                  ))}
                </div>
              )}
           </div>
      </div>

      {/* Footer Controls */}
      <footer className="bg-white border-t border-slate-200 px-6 py-4 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] z-20 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
           {/* Left: Meeting Info */}
           <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
             <div>
                <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-0.5">Meeting With</p>
                <h3 className="text-base font-bold text-slate-800 leading-none">{meeting.studentName}</h3>
             </div>

             <div>
               <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-0.5">Meeting Key</p>
               <div className="text-sm font-semibold text-slate-700">{meetingKey}</div>
             </div>
             
             {isListening && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-full border border-red-100 shadow-sm">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                  <span className="text-xs font-bold tracking-wide">LIVE</span>
                </div>
             )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto no-scrollbar justify-start md:justify-end pb-1 md:pb-0">
             <div className="hidden md:flex flex-col items-end mr-4 border-r border-slate-200 pr-4">
               <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
               <span className={`text-sm font-semibold ${status === 'IN_PROGRESS' ? 'text-emerald-600' : 'text-slate-600'}`}>
                 {statusLabel}
               </span>
             </div>
             <div className="hidden md:flex flex-col items-end mr-4">
               <span className="text-[10px] font-bold text-slate-400 uppercase">Usage</span>
               <span className="text-sm font-semibold text-slate-700">{timeUsedLabel}</span>
               <span className="text-[11px] text-slate-500">{billedLabel}</span>
             </div>
             <Button
               variant="secondary"
               onClick={onBack}
               className="whitespace-nowrap bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm hover:shadow active:scale-95 transition-all"
             >
               <FiArrowLeft className="mr-2 h-4 w-4" /> Back
             </Button>

              <Button
                variant="secondary"
                onClick={downloadTranscript}
                className="whitespace-nowrap bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm hover:shadow active:scale-95 transition-all"
              >
                <FiDownload className="mr-2 h-4 w-4" /> PDF
              </Button>
              <Button
                variant="secondary"
                onClick={exportCsv}
                className="whitespace-nowrap bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm hover:shadow active:scale-95 transition-all"
              >
                CSV
              </Button>
              <Button
                variant="secondary"
                onClick={generateSummary}
                disabled={summaryLoading}
                className="whitespace-nowrap bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm hover:shadow active:scale-95 transition-all"
              >
                {summaryLoading ? 'Summarizing...' : 'AI Summary'}
              </Button>

              {status !== 'COMPLETED' && status !== 'EXPIRED' && (
                <Button
                  variant="ghost"
                  onClick={handleComplete}
                  className="whitespace-nowrap bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm hover:shadow active:scale-95 transition-all"
                >
                  Complete Session
                </Button>
              )}

              {isListening ? (
               <Button
                 onClick={handleStopTranscription}
                 className="whitespace-nowrap bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg active:scale-95 transition-all border-none"
               >
                <FiSquare className="mr-2 h-4 w-4 fill-current" /> Stop Streaming
              </Button>
            ) : (
              <Button
                onClick={handleStart}
                disabled={!deepgramKey || status === 'COMPLETED' || status === 'EXPIRED'}
                className="whitespace-nowrap bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md hover:shadow-lg active:scale-95 transition-all border-none"
              >
                <FiPlay className="mr-2 h-4 w-4 fill-current" /> {status === 'IN_PROGRESS' ? 'Resume Meeting' : 'Start Meeting'}
              </Button>
            )}
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 1s step-end infinite;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
