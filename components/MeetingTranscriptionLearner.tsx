import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE, getMeetingTranscript, getStoredToken } from '../services/backendApi';
import { Meeting } from '../types';
import { Button } from './Button';
import { jsPDF } from 'jspdf';
import { useFlash } from './FlashMessage';
import { FiAlertCircle, FiArrowLeft, FiDownload, FiKey, FiMic } from 'react-icons/fi';

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

export const MeetingTranscriptionLearner: React.FC<Props> = ({ meeting, onBack }) => {
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
  const [status, setStatus] = useState<Meeting['status']>(meeting.status);
  const [finalTranscript, setFinalTranscript] = useState(meeting.transcript || '');
  const [error, setError] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState<string>('');

  const socketRef = useRef<Socket | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const lastParagraphAtRef = useRef<number | null>(null);
  const { showFlash } = useFlash();
  const meetingKey = meeting.meetingKey;
  const PARAGRAPH_BREAK_MS = 9000;

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

  useEffect(() => {
    const token = getStoredToken();
    const socket = io(API_BASE, {
      transports: ['websocket'],
      auth: token ? { token } : undefined,
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.emit('join_meeting', {
      meetingId: meeting.id,
      meetingKey: meeting.meetingKey,
      role: 'learner',
    });

    socket.on(
      'meeting_transcript_chunk',
      (payload: { text?: string; timestamp?: string; from?: string }) => {
        if (!payload?.text) return;
        setInterimTranscript('');
        appendParagraph({
          text: payload.text.trim(),
          timestamp: payload.timestamp || new Date().toISOString(),
          from: payload.from || 'mentor',
        });
      }
    );

    socket.on(
      'meeting_transcript_interim',
      (payload: { text?: string; timestamp?: string; from?: string }) => {
        if (!payload?.text) return;
        setInterimTranscript(payload.text.trim());
      }
    );

    socket.on('meeting_status', ({ status: newStatus }: { status?: string }) => {
      if (newStatus) {
        setStatus(newStatus as Meeting['status']);
        setInterimTranscript('');
        if (newStatus === 'COMPLETED') {
          getMeetingTranscript(meeting.id)
            .then((transcript) => {
              if (transcript) {
                setFinalTranscript(transcript);
                const parsed = transcript
                  .split('\n')
                  .filter(Boolean)
                  .map((text, index) => ({
                    id: `${Date.now()}-${index}`,
                    text,
                    timestamp: new Date().toISOString(),
                    from: 'mentor',
                  }));
                setParagraphs(parsed.reverse());
                lastParagraphAtRef.current = Date.now();
              }
            })
            .catch((err) => {
              console.error('Failed to refresh transcript', err);
            });
        }
      } else {
        setInterimTranscript('');
      }
    });

    socket.on('meeting_error', ({ message }: { message?: string }) => {
      if (message) setError(message);
    });
    socket.on('meeting_end', () => {
      showFlash('Host ended the session.', 'info');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [appendParagraph, meeting.id, meeting.meetingKey, showFlash]);

  const statusLabel = useMemo(() => {
    if (status === 'COMPLETED') return 'Completed';
    if (status === 'EXPIRED') return 'Expired';
    if (status === 'IN_PROGRESS') return 'In Progress';
    return 'Scheduled';
  }, [status]);

  const downloadTranscript = () => {
    const ordered = [...paragraphs].reverse();
    const text = finalTranscript || ordered.map((para) => para.text).join('\n');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    doc.setFontSize(14);
    doc.text(`Meeting Transcript - ${meeting.meetingKey}`, 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 58);
    const bodyLines = doc.splitTextToSize(text, 520);
    let cursor = 80;
    bodyLines.forEach((line) => {
      if (cursor > 760) {
        doc.addPage();
        cursor = 40;
      }
      doc.text(line, 40, cursor);
      cursor += 14;
    });
    doc.save(`meeting-${meeting.meetingKey}.pdf`);
  };

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
      <div className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-10 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2 max-w-3xl mx-auto shadow-sm animate-fade-in">
            <FiAlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="w-full min-h-[60vh] outline-none">
          <div ref={topRef} />
          {paragraphs.length === 0 && !interimTranscript ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-slate-400">
              <div className="mb-4 p-4 rounded-full bg-slate-100">
                <FiMic className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-xl font-light italic">Waiting for session to begin...</p>
              <p className="text-sm mt-2 text-slate-400">Transcript will appear here once the mentor starts.</p>
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

      <footer className="bg-white border-t border-slate-200 px-6 py-4 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] z-20 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
            <div>
              <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-0.5">Meeting With</p>
              <h3 className="text-base font-bold text-slate-800 leading-none">{meeting.studentName}</h3>
            </div>

            <div>
              <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-0.5">Meeting Key</p>
              <div className="text-sm font-semibold text-slate-700">{meetingKey}</div>
            </div>

            {status === 'IN_PROGRESS' && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-full border border-red-100 shadow-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                <span className="text-xs font-bold tracking-wide">LIVE</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto no-scrollbar justify-start md:justify-end pb-1 md:pb-0">
            <div className="hidden md:flex flex-col items-end mr-4 border-r border-slate-200 pr-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
              <span className={`text-sm font-semibold ${status === 'IN_PROGRESS' ? 'text-emerald-600' : 'text-slate-600'}`}>
                {statusLabel}
              </span>
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
              onClick={() => {
                if ('clipboard' in navigator) {
                  navigator.clipboard.writeText(meeting.meetingKey).catch(() => {});
                  showFlash('Key copied to clipboard', 'success');
                }
              }}
              className="whitespace-nowrap bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm hover:shadow active:scale-95 transition-all"
            >
              <FiKey className="mr-2 h-4 w-4" /> Copy Key
            </Button>

            <Button
              variant="ghost"
              onClick={onBack}
              className="whitespace-nowrap bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm hover:shadow active:scale-95 transition-all"
            >
              Leave Session
            </Button>
          </div>
        </div>
      </footer>

      <style>{`
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
