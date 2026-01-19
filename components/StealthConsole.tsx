import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  FiArrowLeft,
  FiAperture,
  FiCamera,
  FiCode,
  FiFileText,
  FiHelpCircle,
  FiInfo,
  FiMaximize2,
  FiMessageSquare,
  FiMinimize2,
  FiMinus,
  FiPlus,
  FiRefreshCw,
  FiStopCircle,
  FiTrash2,
  FiZap,
} from 'react-icons/fi';
import { getStoredToken, storeToken, listCopilotSessions, SOCKET_URL } from '../services/backendApi';
import { spaNavigate } from './common/SpaLink';

/**
 * StealthConsole is a refined version of the existing CopilotConsole with
 * a visual layout inspired by the Ntro.io stealth console. It provides
 * instructions for connecting from a secondary device, displays session
 * status, and offers quick actions for AI assistance, explanation, code
 * drafting (auto-screenshot), hiding the sharing widget, and stopping
 * screen sharing. This component leverages the same socket.io copilot API
 * used by CopilotConsole.
 */
// Helper type definitions reused from CopilotConsole for clarity.
type TranscriptChunk = { text: string; ts?: string; source?: string };
type TopicEvent = { text: string; ts?: string };
type AiResponse = { type: string; content: string; ts?: string; streaming?: boolean };

const inlineCodeStyle: React.CSSProperties = {
  fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  background: '#0f172a12',
  padding: '2px 6px',
  borderRadius: 6,
  border: '1px solid #e2e8f0',
};

function renderInlineSegments(text: string): React.ReactNode[] {
  const tokens = text.split(/(\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+?`)/g);
  return tokens.filter(Boolean).map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={idx}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={idx} style={inlineCodeStyle}>
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

function renderMarkdownContent(markdown: string): React.ReactNode {
  const lines = (markdown || '').replace(/\r\n/g, '\n').split('\n');
  const blocks: Array<{ type: 'text' | 'code' | 'list'; content?: string; items?: string[]; lang?: string }> = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().startsWith('```')) {
      const lang = line.replace(/```/, '').trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length && lines[i].trim().startsWith('```')) i++;
      blocks.push({ type: 'code', content: codeLines.join('\n'), lang });
      continue;
    }
    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'list', items });
      continue;
    }
    if (!line.trim()) {
      i++;
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !lines[i].trim().startsWith('```')) {
      para.push(lines[i]);
      i++;
    }
    blocks.push({ type: 'text', content: para.join(' ') });
  }

  if (!blocks.length) {
    return <div>Preparing answer...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {blocks.map((block, idx) => {
        if (block.type === 'code') {
          return (
            <pre
              key={`code-${idx}`}
              style={{
                background: '#0b1224',
                color: '#e2e8f0',
                padding: 12,
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                overflowX: 'auto',
                fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
                whiteSpace: 'pre',
              }}
            >
              <code>{block.content || ''}</code>
            </pre>
          );
        }
        if (block.type === 'list') {
          return (
            <ul key={`list-${idx}`} style={{ margin: '0 0 4px 18px', padding: 0, color: '#0f172a' }}>
              {(block.items || []).map((item, li) => (
                <li key={li} style={{ marginBottom: 4 }}>
                  {renderInlineSegments(item)}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={`text-${idx}`} style={{ margin: 0, color: '#0f172a' }}>
            {renderInlineSegments(block.content || '')}
          </p>
        );
      })}
    </div>
  );
}

export const StealthConsole: React.FC = () => {
  // Read parameters from the URL so the console can be opened from a QR link.
  const search = window.location.search || '';
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const initialSessionId = params.get('sessionId') || '';
  const initialJoinCode = params.get('joinCode') || '';
  const urlToken = params.get('token') || '';
  const storedToken = getStoredToken();
  const authToken = urlToken || storedToken || '';

  useEffect(() => {
    if (urlToken) {
      storeToken(urlToken);
    }
  }, [urlToken]);

  const [sessionId, setSessionId] = useState(initialSessionId);
  const [joinCode, setJoinCode] = useState(initialJoinCode);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionStatus, setSessionStatus] = useState('');

  const [transcript, setTranscript] = useState<TranscriptChunk[]>([]);
  const [topics, setTopics] = useState<TopicEvent[]>([]);
  const [chatMessages, setChatMessages] = useState<AiResponse[]>([]);
  const [codeMessages, setCodeMessages] = useState<AiResponse[]>([]);
  const [aiStatus, setAiStatus] = useState('');
  const [activeTab, setActiveTab] = useState<'console' | 'code'>('console');
  const [autoHintEnabled, setAutoHintEnabled] = useState(false);
  const [screenshots, setScreenshots] = useState<{ id: string; dataUrl: string; ts?: string }[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState('');
  const [cameraFallback, setCameraFallback] = useState(false);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraFileInputRef = useRef<HTMLInputElement | null>(null);
  const [showTranscript, setShowTranscript] = useState(true);
  const [hideMyTranscript, setHideMyTranscript] = useState(false);
  const [requestNonce, setRequestNonce] = useState(0);
  const [autoConnectTried, setAutoConnectTried] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [collapsedMessages, setCollapsedMessages] = useState<Record<string, boolean>>({});
  const [codeFullscreen, setCodeFullscreen] = useState(false);

  const activeSession = useMemo(() => {
    if (!Array.isArray(sessionHistory)) return null;
    const active = sessionHistory.find((s: any) => String(s?.status || '').toUpperCase() === 'ACTIVE');
    return active || null;
  }, [sessionHistory]);
  const activeSessionId = String(activeSession?._id || activeSession?.id || '');
  const activeJoinCode = String(activeSession?.joinCode || activeSession?.join_code || '');

  const pendingTargetsRef = useRef<Record<string, 'console' | 'code'>>({
    HELP_ME: 'console',
    EXPLAIN: 'console',
    CODE: 'code',
    SUMMARY: 'console',
  });

  const sanitizeMessages = (list: AiResponse[]) => list.slice(-12);

  const loadSessions = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const sessions = await listCopilotSessions();
      setSessionHistory(Array.isArray(sessions) ? sessions : []);
    } catch {
      setSessionHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const resolveTarget = (type: string) => {
    const key = String(type || 'HELP_ME').toUpperCase();
    if (pendingTargetsRef.current[key]) return pendingTargetsRef.current[key];
    if (key === 'CODE' || key === 'SCREEN') return 'code';
    return 'console';
  };

  const updateAiMessages = (
    target: 'console' | 'code',
    updater: (prev: AiResponse[]) => AiResponse[]
  ) => {
    if (target === 'code') {
      setCodeMessages((prev) => sanitizeMessages(updater(prev)));
    } else {
      setChatMessages((prev) => sanitizeMessages(updater(prev)));
    }
  };

  const socketRef = useRef<Socket | null>(null);
  const seenTranscriptKeys = useRef<Set<string>>(new Set());
  const seenTopicKeys = useRef<Set<string>>(new Set());
  const seenAiKeys = useRef<Set<string>>(new Set());

  /**
   * Note: type definitions are moved above to avoid usage-before-declaration
   */

  /**
   * Connect to the copilot session using socket.io. This function persists
   * the sessionId, joinCode, and auth token into the URL to make the link
   * shareable with your secondary device. It sets up handlers for
   * receiving transcripts, AI responses, and status updates.
   */
  function connect(nextSessionId?: string, nextJoinCode?: string) {
    setError('');
    const resolvedSessionId = nextSessionId || sessionId;
    const resolvedJoinCode = typeof nextJoinCode === 'string' ? nextJoinCode : joinCode;
    if (!resolvedSessionId) {
      setError('Session ID is required');
      return;
    }
    if (resolvedSessionId !== sessionId) {
      setSessionId(resolvedSessionId);
    }
    if (resolvedJoinCode !== joinCode) {
      setJoinCode(resolvedJoinCode);
    }
    // Persist into URL (shareable to your phone)
    const next = new URL(window.location.href);
    next.searchParams.set('sessionId', resolvedSessionId);
    if (resolvedJoinCode) next.searchParams.set('joinCode', resolvedJoinCode);
    if (authToken) next.searchParams.set('token', authToken);
    window.history.replaceState({}, '', next.toString());

    // Avoid reconnecting multiple times
    if (socketRef.current) {
      try {
        socketRef.current.disconnect();
      } catch {
        /* ignore */
      }
      socketRef.current = null;
    }

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: authToken ? { token: authToken } : undefined,
      withCredentials: true,
    });
    socketRef.current = socket;

    // Join the session on connect
    socket.on('connect', () => {
      socket.emit('copilot:join', {
        sessionId: resolvedSessionId,
        joinCode: resolvedJoinCode,
        deviceType: 'console',
      });
    });

    // Successful join triggers session ready
    const handleJoined = (payload: any) => {
      setConnected(true);
      setSessionStarted(true);
      setScreenshots([]);
      seenAiKeys.current.clear();
      if (payload?.status) {
        setSessionStatus(String(payload.status));
      }
    };
    const handleError = (payload: any) => {
      setError(payload?.message || 'Copilot error');
      setConnected(false);
      setSessionStarted(false);
      setSessionStatus('');
    };
    const handleTranscript = (chunk: any) => {
      const text = String(chunk?.text || '').trim();
      if (!text) return;
      const source = String(chunk?.source || '').toLowerCase();
      const ts = chunk?.ts || new Date().toISOString();
      const key = `${text}|${source}|${ts}`;
      if (seenTranscriptKeys.current.has(key)) return;
      seenTranscriptKeys.current.add(key);
      setTranscript((prev) => {
        const last = prev[prev.length - 1];
        const lastTs = last?.ts ? Date.parse(last.ts) : NaN;
        const curTs = Date.parse(ts) || Date.now();
        const withinMerge =
          last && String(last.source || '').toLowerCase() === source && !Number.isNaN(lastTs)
            ? Math.abs(curTs - lastTs) <= 7000
            : false;

        if (withinMerge && last) {
          const merged = `${String(last.text || '').trim()} ${text}`.trim();
          const next = [...prev];
          next[next.length - 1] = { text: merged, ts, source: chunk?.source };
          return next;
        }
        return [...prev, { text, ts, source: chunk?.source }];
      });
    };
    const handleTopic = (evt: any) => {
      const text = String(evt?.text || '').trim();
      if (!text) return;
      const key = `${text}|${evt?.ts || ''}`;
      if (seenTopicKeys.current.has(key)) return;
      seenTopicKeys.current.add(key);
      setTopics((prev) => [...prev, { text, ts: evt?.ts }]);
    };
    const handleState = (state: any) => {
      if (Array.isArray(state?.transcript)) {
        const seen = new Set<string>();
        const clean = state.transcript
          .map((t: any) => ({ text: t?.text || '', ts: t?.ts || t?.timestamp, source: t?.source }))
          .filter((t: any) => {
            const key = `${t.text}|${t.source || ''}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return Boolean(String(t.text || '').trim());
          });
        seenTranscriptKeys.current = seen;
        setTranscript(clean);
      }
      if (Array.isArray(state?.topics)) {
        const seen = new Set<string>();
        const clean = state.topics
          .map((t: any) => ({ text: t?.text || '', ts: t?.ts || t?.timestamp }))
          .filter((t: any) => {
            const key = `${t.text}|${t.ts}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return Boolean(String(t.text || '').trim());
          });
        seenTopicKeys.current = seen;
        setTopics(clean);
      }
      if (Array.isArray(state?.aiMessages)) {
        const seen = new Set<string>();
        const nextChat: AiResponse[] = [];
        const nextCode: AiResponse[] = [];
        state.aiMessages.forEach((msg: any) => {
          const type = String(msg?.type || 'HELP_ME').toUpperCase();
          const content = msg?.content || '';
          const key = `${type}|${String(content || '').trim()}`;
          if (seen.has(key)) return;
          seen.add(key);
          const entry = { type, content, ts: msg?.ts || msg?.timestamp || '' };
          if (type === 'CODE' || type === 'SCREEN') {
            nextCode.push(entry);
          } else {
            nextChat.push(entry);
          }
        });
        seenAiKeys.current = seen;
        setChatMessages(sanitizeMessages(nextChat));
        setCodeMessages(sanitizeMessages(nextCode));
      }
    };
    const handleAiResponse = (msg: any) => {
      const type = String(msg?.type || 'HELP_ME').toUpperCase();
      const normalizedContent = String(msg?.content || '').trim();
      if (normalizedContent) {
        const key = `${type}|${normalizedContent}`;
        if (seenAiKeys.current.has(key)) {
          setAiStatus('');
          return;
        }
        seenAiKeys.current.add(key);
      }
      const target = resolveTarget(type);
      updateAiMessages(target, (prev) => {
        const next = [...prev];
        const content = msg?.content || '';
        const ts = msg?.ts;
        let idx = -1;
        for (let i = next.length - 1; i >= 0; i--) {
          if (next[i]?.streaming) {
            idx = i;
            break;
          }
        }
        if (idx !== -1) {
          next[idx] = { type, content, ts, streaming: false };
          return next;
        }
        return [...next, { type, content, ts }];
      });
      setAiStatus('');
    };
    const handleAiToken = (evt: any) => {
      const token = typeof evt?.token === 'string' ? evt.token : '';
      if (!token) return;
      const type = evt?.type || 'HELP_ME';
      const target = resolveTarget(type);
      updateAiMessages(target, (prev) => {
        const next = [...prev];
        let idx = -1;
        for (let i = next.length - 1; i >= 0; i--) {
          if (next[i]?.streaming) {
            idx = i;
            break;
          }
        }
        if (idx === -1) {
          next.push({ type, content: token, ts: evt?.ts, streaming: true });
          return next;
        }
        next[idx] = {
          ...next[idx],
          type,
          content: (next[idx]?.content || '') + token,
          ts: evt?.ts || next[idx]?.ts,
          streaming: true,
        };
        return next;
      });
    };
    const handleAiStatus = (status: any) => {
      const msg = typeof status?.status === 'string' ? status.status : '';
      const type = status?.type || 'HELP_ME';
      setAiStatus(msg ? `${type}: ${msg}` : '');
      if (status?.status === 'running') {
        const target = resolveTarget(type);
        updateAiMessages(target, (prev) => {
          if (prev.length && prev[prev.length - 1]?.streaming) return prev;
          return [...prev, { type, content: '', ts: new Date().toISOString(), streaming: true }];
        });
      }
    };
    const handleCaptureState = (payload: any) => {
      const images = Array.isArray(payload?.images) ? payload.images : [];
      if (!images.length) {
        setScreenshots([]);
        return;
      }
      const unique = Array.from(new Set(images.map((url: any) => String(url))));
      setScreenshots(
        unique.map((url: string, idx: number) => ({
          id: `${Date.now()}-${idx}`,
          dataUrl: String(url),
        }))
      );
    };
    const handleCaptureSaved = (payload: any) => {
      const image = payload?.image;
      if (!image) return;
      const id = payload?.id || `${Date.now()}`;
      setScreenshots((prev) => {
        if (prev.some((s) => s.id === id || s.dataUrl === image)) return prev;
        return [...prev, { id: String(id), dataUrl: String(image), ts: payload?.ts }];
      });
    };
    const handleCaptureCleared = () => {
      setScreenshots([]);
    };
    const handleDisconnect = () => {
      setConnected(false);
    };
    const handleSessionEnd = () => {
      setConnected(false);
      setSessionStarted(false);
      setSessionStatus('ENDED');
      setScreenshots([]);
      seenAiKeys.current.clear();
      loadSessions();
    };

    socket.on('copilot:joined', handleJoined);
    socket.on('copilot:error', handleError);
    socket.on('copilot:transcript_chunk', handleTranscript);
    socket.on('copilot:topic_event', handleTopic);
    socket.on('copilot:state', handleState);
    socket.on('copilot:ai_response', handleAiResponse);
    socket.on('copilot:ai_token', handleAiToken);
    socket.on('copilot:ai_status', handleAiStatus);
    socket.on('copilot:capture_state', handleCaptureState);
    socket.on('copilot:capture_saved', handleCaptureSaved);
    socket.on('copilot:capture_cleared', handleCaptureCleared);
    socket.on('disconnect', handleDisconnect);
    socket.on('copilot:end', handleSessionEnd);
  }

  useEffect(() => {
    // auto-connect if sessionId exists in URL
    if (initialSessionId && !socketRef.current) {
      connect();
    }
    return () => {
      try {
        socketRef.current?.disconnect();
      } catch {
        // ignore
      }
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (autoConnectTried || sessionId || !authToken || socketRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        setHistoryLoading(true);
        const sessions = await listCopilotSessions();
        if (cancelled || !Array.isArray(sessions)) return;
        setSessionHistory(sessions);
        const active = sessions.find((s: any) => (s?.status || '').toUpperCase() === 'ACTIVE');
        const sid = active?._id || active?.id;
        if (sid) {
          const jc = active?.joinCode || active?.join_code || '';
          setSessionId(String(sid));
          setJoinCode(String(jc || ''));
          if (!socketRef.current) {
            connect(String(sid), String(jc || ''));
          }
        }
      } catch {
        // ignore
      } finally {
        setHistoryLoading(false);
        setAutoConnectTried(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, authToken, autoConnectTried]);

  useEffect(() => {
    if (!authToken) return;
    loadSessions();
  }, [authToken, loadSessions]);

  useEffect(() => {
    if (activeTab !== 'code' && codeFullscreen) {
      setCodeFullscreen(false);
    }
  }, [activeTab, codeFullscreen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e) return;
      const tag = (document.activeElement?.tagName || '').toUpperCase();
      const inField = tag === 'INPUT' || tag === 'TEXTAREA';
      const ctrl = e.ctrlKey || e.metaKey;
      // Ctrl+. => single-shot: clear screenshots, request CODE (backend will ask for 1 fresh capture)
      if (ctrl && (e.key === '.' || e.code === 'Period')) {
        e.preventDefault();
        e.stopPropagation();
        clearScreenshots();
        sendAiRequest('CODE');
        return;
      }

      // Ctrl+Insert => capture (queue) screenshot(s)
      if (ctrl && (e.key === 'Insert' || e.code === 'Insert')) {
        e.preventDefault();
        e.stopPropagation();
        captureScreenshot();
        return;
      }

      // Ctrl+Shift+C => CODE on currently queued screenshots (or request capture if none)
      if (ctrl && e.shiftKey && (e.key.toLowerCase() === 'c' || e.code === 'KeyC')) {
        e.preventDefault();
        e.stopPropagation();
        sendAiRequest('CODE');
        return;
      }

      // Ctrl+Shift+H => Help Me
      // (Ctrl+H is reserved by Chrome for History and cannot be reliably overridden.)
      if (ctrl && e.shiftKey && (e.key.toLowerCase() === 'h' || e.code === 'KeyH')) {
        e.preventDefault();
        e.stopPropagation();
        sendAiRequest('HELP_ME');
        return;
      }

      // Ctrl+, => Explain
      if (ctrl && (e.key === ',' || e.code === 'Comma')) {
        e.preventDefault();
        e.stopPropagation();
        sendAiRequest('EXPLAIN');
        return;
      }

      // Ctrl+Shift+U => clear screenshots
      if (ctrl && e.shiftKey && (e.key.toLowerCase() === 'u' || e.code === 'KeyU')) {
        e.preventDefault();
        e.stopPropagation();
        clearScreenshots();
        return;
      }

      // Optional: Auto Hint (Space/Enter) when not focused in a text field
      if (!inField && autoHintEnabled && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault();
        sendAiRequest('HELP_ME');
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [autoHintEnabled, captureScreenshot, clearScreenshots, sendAiRequest]);

  const stopCameraStream = useCallback(() => {
    const stream = cameraStreamRef.current;
    if (stream) {
      try {
        stream.getTracks().forEach((t) => t.stop());
      } catch {
        // ignore
      }
    }
    cameraStreamRef.current = null;
    const video = cameraVideoRef.current;
    if (video) {
      try {
        (video as any).srcObject = null;
      } catch {
        // ignore
      }
    }
  }, []);

  const startCameraStream = useCallback(
    async (facing: 'environment' | 'user') => {
      setCameraError('');
      setCameraFallback(false);

      // On mobile devices, getUserMedia is blocked in non-secure contexts.
      // If the console is opened over plain HTTP, show a more helpful message
      // and fall back to <input type="file" capture>.
      if (typeof window !== 'undefined' && (window as any).isSecureContext === false) {
        setCameraFallback(true);
        setCameraError(
          'Live camera preview requires HTTPS in mobile browsers. You can still take a photo using the fallback capture button.'
        );
        return;
      }

      if (!navigator?.mediaDevices?.getUserMedia) {
        setCameraFallback(true);
        setCameraError(
          'Live camera preview is not supported in this browser. You can still take a photo using the fallback capture button.'
        );
        return;
      }

      stopCameraStream();

      const tryGet = async (constraints: MediaStreamConstraints) => {
        return await navigator.mediaDevices.getUserMedia(constraints);
      };

      const baseVideo = {
        width: { ideal: 1280 },
        height: { ideal: 720 },
      } as any;

      let stream: MediaStream | null = null;
      try {
        // Prefer the rear camera on mobile devices.
        stream = await tryGet({ video: { ...baseVideo, facingMode: { exact: facing } }, audio: false });
      } catch {
        try {
          stream = await tryGet({ video: { ...baseVideo, facingMode: { ideal: facing } }, audio: false });
        } catch {
          try {
            stream = await tryGet({ video: baseVideo, audio: false });
          } catch (err: any) {
            const msg =
              err?.name === 'NotAllowedError'
                ? 'Camera permission was blocked. Please allow camera access and try again.'
                : err?.name === 'NotFoundError'
                  ? 'No camera device found.'
                  : 'Could not open the camera. (Tip: live preview usually requires HTTPS on mobile.)';
            setCameraError(msg);
            // If the browser blocked live preview, fall back to file capture.
            if (err?.name !== 'NotFoundError') {
              setCameraFallback(true);
            }
            return;
          }
        }
      }

      cameraStreamRef.current = stream;
      setCameraFallback(false);
      const video = cameraVideoRef.current;
      if (video && stream) {
        try {
          (video as any).srcObject = stream;
          await video.play();
        } catch {
          // ignore
        }
      }
    },
    [stopCameraStream]
  );

  useEffect(() => {
    if (!cameraOpen) {
      stopCameraStream();
      return;
    }
    startCameraStream(cameraFacing);
    return () => {
      stopCameraStream();
    };
  }, [cameraOpen, cameraFacing, startCameraStream, stopCameraStream]);

  /**
   * Send an AI request to the copilot backend with a given type. This is
   * reused for various quick actions. It
   * constructs a messages array from the last few transcript lines along with
   * any input provided in the console's text box.
   */
  function sendAiRequest(type: string) {
    const socket = socketRef.current;
    if (!socket || !sessionId) {
      setError('Connect first');
      return;
    }
    const normalizedType = String(type || 'HELP_ME').toUpperCase();
    const targetTab = normalizedType === 'CODE' ? 'code' : activeTab;
    pendingTargetsRef.current[normalizedType] = targetTab;
    const interviewerTail = transcript
      .filter((t) => {
        const source = String(t?.source || '').toLowerCase();
        return source !== 'mic' && source !== 'manual';
      })
      .slice(-3)
      .map((t) => t.text)
      .filter(Boolean);
    const context = interviewerTail.length ? interviewerTail.join('\n') : '';
    const latestQuestion =
      topics.length > 0
        ? topics[topics.length - 1]?.text || ''
        : interviewerTail[interviewerTail.length - 1] || '';
    const latestCodeAnswer = [...codeMessages]
      .reverse()
      .find((m) => String(m?.type || '').toUpperCase() === 'CODE' && String(m?.content || '').trim())
      ?.content;
    const messages = [
      {
        role: 'system',
        content:
          targetTab === 'code'
            ? 'You are a coding interview assistant. Provide precise, high-signal answers. Focus on correctness and clarity.'
            : 'You are the candidate in a live interview. Answer ONLY the newest interviewer question; ignore older ones and never recycle earlier answers. ' +
                'Do not restate the question. Do not mention AI. No headings, no bullet points, no markdown. ' +
                'Default length: 3-5 spoken sentences (2 short paragraphs). If the question is clearly lightweight, 2-3 sentences is fine; if it is technical/behavioral, stay in 3-5 sentences and cap at 6-8 if absolutely needed. ' +
                'For self-intro: ~6 short lines (headline, years, domain, 2-3 projects, tech stack, impacts, why this role). ' +
                'Behavioral: use a tight STAR flow without labeling; Technical: answer directly, add a concrete example/trade-off. ' +
                'If the transcript is partial, infer the full question from recent lines and answer that; ask for clarification only if it is truly unintelligible. ' +
                'Apply: WHAT you check + WHY it matters + HOW you check + HOW you prove it. Name exact artifacts (rule, log, record, config). Keep frameworks separate (process vs data vs security vs timing). Always compare (working vs failing, before vs after) to isolate cause. State what you check first under time pressure and why. End with a clear conclusion/fix/prevention. ' +
                'Before finalizing, self-check: at least 3 concrete objects named, a comparison used, a conclusion present, and no framework mixing.',
      },
      context ? { role: 'user', content: `Recent transcript (newest first, keep it short):\n${context}` } : null,
      targetTab === 'console' && latestQuestion
        ? {
            role: 'user',
            content:
              normalizedType === 'EXPLAIN'
                ? `Explain what the interviewer is asking and suggest a strong structure for the answer:\n${latestQuestion}`
                : `Answer the latest interviewer question:\n${latestQuestion}`,
          }
        : null,
      targetTab === 'code' && normalizedType === 'EXPLAIN'
        ? {
            role: 'user',
            content: latestCodeAnswer
              ? `Explain the following solution and its key decisions:\n${latestCodeAnswer}`
              : 'Explain the solution based on the latest captured screenshots and the last code output.',
          }
        : null,
      normalizedType === 'CODE'
        ? {
            role: 'user',
            content:
              'Solve the coding task shown in the latest screenshots captured from the laptop. ' +
              'Use ONLY the captured images (problem statement + code editor) as ground truth; ignore any stale context. ' +
              'Return the full working solution (code) and a concise explanation of the approach and complexity.',
          }
        : null,
      { role: 'user', content: `Request nonce: ${Date.now()}-${requestNonce}` },
    ].filter(Boolean) as { role: string; content: string }[];
    socket.emit('copilot:ai_request', { sessionId, type: normalizedType, messages });
    setAiStatus(`${normalizedType}: running`);
    setRequestNonce((n) => n + 1);
  }

  /**
   * End the session and stop sharing. This triggers the copilot backend to
   * finalize the session and disconnects the console.
   */
  function endSession() {
    const socket = socketRef.current;
    if (!socket || !sessionId) {
      setError('Connect first');
      return;
    }
    socket.emit('copilot:end', { sessionId });
    // local cleanup
    setConnected(false);
    setSessionStarted(false);
    setSessionStatus('ENDED');
    setScreenshots([]);
    loadSessions();
  }

  function captureScreenshot() {
    const socket = socketRef.current;
    if (!socket || !sessionId) {
      setError('Connect first');
      return;
    }
    socket.emit('copilot:screen_capture', { sessionId });
    setAiStatus('SCREEN: running');
  }

  function openCameraCapture() {
    const socket = socketRef.current;
    if (!socket || !sessionId) {
      setError('Connect first');
      return;
    }
    setCameraError('');
    setCameraFallback(false);
    setCameraFacing('environment');
    setCameraOpen(true);
  }

  function saveCameraCapture(dataUrl: string) {
    if (!dataUrl) {
      setCameraError('Could not capture photo.');
      return;
    }

    const id = `camera-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const ts = new Date().toISOString();
    setScreenshots((prev) => [...prev, { id, dataUrl, ts }]);

    // Upload to the backend so it can be used for code generation like a screenshot.
    const socket = socketRef.current;
    if (socket && sessionId) {
      socket.emit('copilot:capture_upload', { sessionId, type: 'SCREEN', image: dataUrl });
    }

    setCameraOpen(false);
  }

  async function fileToJpegDataUrl(file: File) {
    const blobUrl = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error('Failed to load image'));
        el.src = blobUrl;
      });
      const w0 = (img as any).naturalWidth || img.width || 0;
      const h0 = (img as any).naturalHeight || img.height || 0;
      if (!w0 || !h0) throw new Error('Invalid image dimensions');

      // Downscale large photos so uploads stay fast/reliable.
      const maxDim = 1600;
      const scale = Math.min(1, maxDim / Math.max(w0, h0));
      const w = Math.max(1, Math.round(w0 * scale));
      const h = Math.max(1, Math.round(h0 * scale));

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not available');
      ctx.drawImage(img, 0, 0, w, h);
      return canvas.toDataURL('image/jpeg', 0.88);
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  }

  async function handleCameraFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Allow the same photo to be chosen again.
    e.target.value = '';
    if (!file) return;
    try {
      setCameraError('');
      const dataUrl = await fileToJpegDataUrl(file);
      saveCameraCapture(dataUrl);
    } catch {
      setCameraError('Could not read that photo. Please try again.');
    }
  }

  function captureCameraPhoto() {
    // Fallback mode: no live preview, use the mobile camera/file picker.
    if (cameraFallback) {
      cameraFileInputRef.current?.click();
      return;
    }
    const video = cameraVideoRef.current;
    if (!video) {
      setCameraError('Camera is not ready yet.');
      return;
    }
    const vw = (video as any).videoWidth || 0;
    const vh = (video as any).videoHeight || 0;
    if (!vw || !vh) {
      // If the stream did not initialize, offer the fallback capture.
      setCameraError('Camera is still initializing. If this keeps happening, use fallback capture.');
      return;
    }

    const maxWidth = 1280;
    const scale = Math.min(1, maxWidth / vw);
    const cw = Math.max(1, Math.round(vw * scale));
    const ch = Math.max(1, Math.round(vh * scale));

    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setCameraError('Could not capture photo (canvas not available).');
      return;
    }
    ctx.drawImage(video, 0, 0, cw, ch);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

    saveCameraCapture(dataUrl);
  }

  function clearScreenshots() {
    const socket = socketRef.current;
    setScreenshots([]);
    if (!socket || !sessionId) return;
    socket.emit('copilot:clear_screens', { sessionId });
    socket.emit('copilot_clear_screens', { sessionId });
  }

  const statusLabel = sessionStatus
    ? String(sessionStatus).toUpperCase()
    : sessionStarted
      ? 'ACTIVE'
      : '';
  const isSessionEnded = statusLabel === 'ENDED';
  const canRequest = connected && !isSessionEnded;
  const transcriptLines = transcript.slice(-400);

  const formatTime = (ts?: string) => {
    if (!ts) return '';
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString();
  };
  const messagesForActiveTab = activeTab === 'code' ? codeMessages : chatMessages;
  const buildMessageId = (msg: AiResponse, target: 'console' | 'code') =>
    `${target}-${msg.ts || 'no-ts'}-${msg.type || 'HELP_ME'}-${(msg.content || '').slice(0, 32)}`;
  const toggleMessageCollapse = (id: string) => {
    setCollapsedMessages((prev) => ({ ...prev, [id]: !prev[id] }));
  };
  const getMessagePreview = (content: string) => {
    const text = (content || '').replace(/\s+/g, ' ').trim();
    if (!text) return 'Preparing answer...';
    return text.length > 160 ? `${text.slice(0, 160)}…` : text;
  };

  const renderMessages = (
    list: AiResponse[],
    target: 'console' | 'code',
    tone: 'light' | 'dark',
    emptyCopy: string
  ) => {
    if (!list.length) {
      return (
        <div style={{ color: tone === 'dark' ? '#cbd5f5' : '#64748b', fontSize: 14 }}>
          {emptyCopy}
        </div>
      );
    }

    const ordered = [...list].reverse();
    const surface = tone === 'dark' ? 'rgba(30,41,59,0.9)' : '#f8fafc';
    const border = tone === 'dark' ? 'rgba(148,163,184,0.4)' : '#e2e8f0';
    const meta = tone === 'dark' ? '#cbd5f5' : '#64748b';
    const text = tone === 'dark' ? '#e2e8f0' : '#0f172a';
    const accent = tone === 'dark' ? '#93c5fd' : '#2563eb';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {ordered.map((m, idx) => {
          const id = buildMessageId(m, target);
          const collapsed = Object.prototype.hasOwnProperty.call(collapsedMessages, id)
            ? collapsedMessages[id]
            : idx > 0;
          const typeLabel = String(m.type || 'HELP_ME').replace('_', ' ');
          return (
            <div
              key={id}
              style={{
                borderRadius: 14,
                border: `1px solid ${border}`,
                padding: 16,
                background: surface,
                boxShadow: tone === 'dark' ? '0 10px 30px rgba(0,0,0,0.25)' : undefined,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  alignItems: 'flex-start',
                  marginBottom: collapsed ? 0 : 8,
                }}
              >
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      fontSize: 11,
                      color: meta,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    <span>{typeLabel}</span>
                    <span>{m.streaming ? 'Streaming...' : formatTime(m.ts)}</span>
                    {idx === 0 && <span style={{ color: accent, fontWeight: 700 }}>Latest</span>}
                  </div>
                  <div style={{ color: text, fontSize: 13, fontWeight: 700, lineHeight: 1.35 }}>
                    {getMessagePreview(m.content || '')}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => toggleMessageCollapse(id)}
                    title={collapsed ? 'Expand' : 'Collapse'}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      border: `1px solid ${border}`,
                      background: tone === 'dark' ? 'rgba(15,23,42,0.65)' : '#ffffff',
                      color: text,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {collapsed ? <FiPlus size={14} /> : <FiMinus size={14} />}
                  </button>
                </div>
              </div>
              {!collapsed && (
                <div
                  style={{
                    whiteSpace: 'pre-wrap',
                    color: text,
                    fontSize: 14,
                    lineHeight: 1.55,
                    fontFamily: '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
                  }}
                >
                  {renderMarkdownContent(m.content || 'Preparing answer...')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const RailButton = ({
    icon,
    onClick,
    active,
    disabled,
    title,
  }: {
    icon: React.ReactNode;
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    title: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        border: '1px solid rgba(148,163,184,0.3)',
        background: active ? 'rgba(59,130,246,0.2)' : 'rgba(15,23,42,0.4)',
        color: disabled ? 'rgba(148,163,184,0.5)' : '#e2e8f0',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {icon}
    </button>
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: '#f8fafc',
        color: '#0f172a',
        fontFamily: '"Segoe UI", system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      }}
    >
      <div style={{ flex: 1, background: '#ffffff', padding: '24px 28px', overflow: 'hidden' }}>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: 6 }}>
            {error && (
              <div
                style={{
                  marginBottom: 16,
                  padding: 12,
                  borderRadius: 12,
                  border: '1px solid #fecaca',
                  background: '#fef2f2',
                  color: '#b91c1c',
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}

            {!connected && (
              <div
                style={{
                  marginBottom: 20,
                  borderRadius: 16,
                  border: '1px dashed #cbd5f5',
                  padding: 20,
                  background: '#f8fafc',
                  color: '#475569',
                  fontSize: 14,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Active Session</div>
                {historyLoading ? (
                  <div style={{ color: '#64748b' }}>Looking for a live session...</div>
                ) : activeSessionId ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ color: '#475569' }}>A live session is available. Click open to connect.</div>
                    <button
                      onClick={() => connect(activeSessionId, activeJoinCode)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 10,
                        border: '1px solid #cbd5f5',
                        background: '#2563eb',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Open
                    </button>
                  </div>
                ) : (
                  <div style={{ color: '#64748b' }}>
                    Start your interview in the extension to sync this console. Once the session is active,
                    it will appear here automatically.
                  </div>
                )}
                {!authToken && (
                  <div style={{ marginTop: 10, color: '#94a3b8', fontSize: 12 }}>
                    Open the console from the extension to auto-sign in.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'code' && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontWeight: 700 }}>Captured Screens</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Ctrl+Shift+U to clear</div>
                </div>
                {screenshots.length === 0 ? (
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    No images yet. Use the camera icon to capture from your laptop, or the aperture icon to take a live photo.
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                    {screenshots.map((shot) => (
                      <div key={shot.id} style={{ flex: '0 0 auto' }}>
                        <img
                          src={shot.dataUrl}
                          alt="Captured"
                          style={{
                            width: 140,
                            height: 90,
                            objectFit: 'cover',
                            borderRadius: 10,
                            border: '1px solid #e2e8f0',
                          }}
                        />
                        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                          {formatTime(shot.ts)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'code' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
                <button
                  onClick={() => setCodeFullscreen((v) => !v)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: '1px solid #cbd5f5',
                    background: '#e0ecff',
                    color: '#0f172a',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {codeFullscreen ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
                  {codeFullscreen ? 'Exit full view' : 'Fullscreen code'}
                </button>
              </div>
            )}

            {renderMessages(
              messagesForActiveTab,
              activeTab,
              'light',
              activeTab === 'code'
                ? 'Capture screenshots, then press the code icon to generate a solution.'
                : 'Press the help icon to answer the latest interviewer question.'
            )}

            {aiStatus && (
              <div style={{ marginTop: 12, color: '#475569', fontSize: 12 }}>
                {aiStatus}
              </div>
            )}

            {showTranscript && (
        <div style={{ marginTop: 24, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Transcript</div>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b', marginBottom: 10 }}>
            <input
              type="checkbox"
              checked={hideMyTranscript}
              onChange={(e) => setHideMyTranscript(e.target.checked)}
              style={{ width: 14, height: 14 }}
            />
            Hide my conversation
          </label>
          <div
            style={{
              maxHeight: 240,
              overflowY: 'auto',
              border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: 12,
                    background: '#f8fafc',
                  }}
                >
                {transcriptLines.length === 0 ? (
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>No transcript yet.</div>
                ) : (
                  transcriptLines
                    .filter((t) => !hideMyTranscript || String(t?.source || '').toLowerCase() !== 'mic')
                    .map((t, idx) => {
                      const source = String(t?.source || '').toLowerCase();
                      const speaker = source === 'mic' ? 'You' : 'Interviewer';
                      return (
                        <div key={idx} style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: source === 'mic' ? '#2563eb' : '#0f172a' }}>
                            {speaker}
                          </div>
                          <div style={{ fontSize: 13, color: '#0f172a' }}>{t.text}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          width: 76,
          background: '#0f172a',
          color: '#e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          padding: '16px 10px',
        }}
      >
        <RailButton
          icon={<FiMessageSquare size={18} />}
          onClick={() => setActiveTab('console')}
          active={activeTab === 'console'}
          title="Console"
        />
        <RailButton
          icon={<FiCode size={18} />}
          onClick={() => setActiveTab('code')}
          active={activeTab === 'code'}
          title="Code"
        />
        <div style={{ width: 36, height: 1, background: 'rgba(148,163,184,0.3)' }} />
        <RailButton
          icon={<FiHelpCircle size={18} />}
          onClick={() => sendAiRequest('HELP_ME')}
          disabled={!canRequest}
          title="Help Me (Ctrl+Shift+H)"
        />
        <RailButton
          icon={<FiInfo size={18} />}
          onClick={() => sendAiRequest('EXPLAIN')}
          disabled={!canRequest}
          title="Explain (Ctrl+,)"
        />
        <RailButton
          icon={<FiCode size={18} />}
          onClick={() => sendAiRequest('CODE')}
          disabled={!canRequest}
          title="Code Solution (Ctrl+Shift+C)"
        />
        <RailButton
          icon={<FiCamera size={18} />}
          onClick={captureScreenshot}
          disabled={!canRequest}
          title="Capture Screenshot (Ctrl+Insert)"
        />
        <RailButton
          icon={<FiAperture size={18} />}
          onClick={openCameraCapture}
          disabled={!canRequest}
          title="Capture Live Photo"
        />
        <RailButton
          icon={<FiTrash2 size={18} />}
          onClick={clearScreenshots}
          disabled={!screenshots.length}
          title="Clear Screenshots (Ctrl+Shift+U)"
        />
        <RailButton
          icon={<FiZap size={18} />}
          onClick={() => setAutoHintEnabled((v) => !v)}
          active={autoHintEnabled}
          title="Auto Hint (Space/Enter)"
        />
        <RailButton
          icon={<FiArrowLeft size={18} />}
          onClick={() => spaNavigate('/dashboard')}
          title="Back to Dashboard"
        />
        <RailButton
          icon={<FiFileText size={18} />}
          onClick={() => setShowTranscript((v) => !v)}
          active={showTranscript}
          title="Toggle Transcript"
        />
        <div style={{ flex: 1 }} />
        <RailButton
          icon={<FiRefreshCw size={18} />}
          onClick={() => connect(sessionId || activeSessionId, sessionId ? joinCode : activeJoinCode)}
          disabled={!sessionId && !activeSessionId}
          title="Reconnect"
        />
        <RailButton
          icon={<FiStopCircle size={18} />}
          onClick={endSession}
          disabled={!connected}
          title="End Session"
        />
        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background:
                statusLabel === 'ACTIVE' ? '#22c55e' : statusLabel === 'ENDED' ? '#f97316' : '#94a3b8',
            }}
          />
          <span style={{ fontSize: 10, color: '#cbd5f5' }}>{statusLabel || 'IDLE'}</span>
        </div>
      </div>

      {codeFullscreen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 45,
            background: 'linear-gradient(135deg, #0b1224 0%, #0f172a 50%, #0b1224 100%)',
            color: '#e2e8f0',
            padding: '18px 22px',
            overflowY: 'auto',
          }}
        >
          <div style={{ maxWidth: 1180, margin: '0 auto' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                marginBottom: 14,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontWeight: 800, letterSpacing: '0.08em', fontSize: 13, textTransform: 'uppercase' }}>
                  Code Console
                </div>
                <div style={{ fontSize: 12, color: 'rgba(226,232,240,0.78)' }}>
                  Latest responses sit on top. Collapse older ones to keep things tidy.
                </div>
              </div>
              <button
                onClick={() => setCodeFullscreen(false)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: '1px solid rgba(148,163,184,0.4)',
                  background: 'rgba(15,23,42,0.7)',
                  color: '#e2e8f0',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                <FiMinimize2 size={16} />
                Minimize
              </button>
            </div>

            {renderMessages(
              codeMessages,
              'code',
              'dark',
              'Capture screenshots, then press the code icon to generate a solution.'
            )}
          </div>
        </div>
      )}

      {cameraOpen && (
        <div
          onClick={() => setCameraOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'rgba(15,23,42,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(520px, 100%)',
              borderRadius: 16,
              overflow: 'hidden',
              background: '#ffffff',
              border: '1px solid rgba(148,163,184,0.3)',
              boxShadow: '0 18px 50px rgba(15,23,42,0.25)',
            }}
          >
            <div
              style={{
                padding: 12,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 12,
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>Camera Capture</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                  {cameraFallback
                    ? 'Live preview is not available here. Use Capture (fallback) to pick/take a photo and save it as a screenshot.'
                    : 'Rear camera is preferred. Tap Capture to save as a screenshot.'}
                </div>
              </div>
              <button
                onClick={() => setCameraOpen(false)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  color: '#0f172a',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>

            <div
              style={{
                background: '#0b1224',
                width: '100%',
                height: 'min(60vh, 360px)',
                position: 'relative',
              }}
            >
              {cameraFallback ? (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    padding: 18,
                    color: '#e2e8f0',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: 13 }}>Camera preview not supported</div>
                  <div style={{ fontSize: 11, color: 'rgba(226,232,240,0.75)', lineHeight: 1.35 }}>
                    This usually happens on mobile when the console is opened over HTTP.
                    <br />
                    Open over HTTPS for live preview, or use the fallback capture below.
                  </div>
                  <button
                    onClick={() => cameraFileInputRef.current?.click()}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 10,
                      border: '1px solid rgba(148,163,184,0.35)',
                      background: 'rgba(15,23,42,0.6)',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    Take Photo (Fallback)
                  </button>
                </div>
              ) : (
                <video
                  ref={cameraVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              )}

              <input
                ref={cameraFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCameraFilePicked}
                style={{ display: 'none' }}
                {...({ capture: cameraFacing === 'environment' ? 'environment' : 'user' } as any)}
              />
            </div>

            {cameraError && (
              <div
                style={{
                  padding: 12,
                  borderTop: '1px solid #fecaca',
                  background: '#fef2f2',
                  color: '#b91c1c',
                  fontSize: 12,
                }}
              >
                {cameraError}
              </div>
            )}

            <div
              style={{
                padding: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                borderTop: '1px solid #e2e8f0',
              }}
            >
              <button
                onClick={() => setCameraFacing((f) => (f === 'environment' ? 'user' : 'environment'))}
                style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  color: '#0f172a',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Flip
              </button>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setCameraOpen(false)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={captureCameraPhoto}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 10,
                    border: '1px solid #1d4ed8',
                    background: '#2563eb',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Capture
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StealthConsole;
