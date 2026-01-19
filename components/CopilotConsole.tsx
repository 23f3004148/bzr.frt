import React, { useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getStoredToken, SOCKET_URL } from '../services/backendApi';

type TranscriptChunk = { text: string; ts?: string; source?: string };
type TopicEvent = { text: string; ts?: string };
type AiResponse = { type: string; content: string; ts?: string; streaming?: boolean };

export const CopilotConsole: React.FC = () => {
  // Read from query so we don't need a param-aware router
  const search = window.location.search || '';
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const initialSessionId = params.get('sessionId') || '';
  const initialJoinCode = params.get('joinCode') || '';
  const urlToken = params.get('token') || '';
  const storedToken = getStoredToken();
  const authToken = urlToken || storedToken || '';

  const [sessionId, setSessionId] = useState(initialSessionId);
  const [joinCode, setJoinCode] = useState(initialJoinCode);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string>('');

  const [transcript, setTranscript] = useState<TranscriptChunk[]>([]);
  const [topics, setTopics] = useState<TopicEvent[]>([]);
  const [aiMessages, setAiMessages] = useState<AiResponse[]>([]);
  const [aiInput, setAiInput] = useState<string>('');
  const [aiStatus, setAiStatus] = useState<string>('');

  const socketRef = useRef<Socket | null>(null);

  const onMany = (socket: Socket, events: string[], handler: (...args: any[]) => void) => {
    events.forEach((evt) => socket.on(evt, handler));
  };

  const offMany = (socket: Socket, events: string[], handler: (...args: any[]) => void) => {
    events.forEach((evt) => socket.off(evt, handler));
  };

  const emitCopilot = (socket: Socket, eventBase: string, payload: any) => {
    socket.emit(`copilot:${eventBase}`, payload);
    socket.emit(`copilot_${eventBase}`, payload); // legacy compatibility
  };

  const connect = () => {
    setError('');
    if (!sessionId) {
      setError('Session ID is required');
      return;
    }

    // Persist into URL (shareable to your phone)
    const next = new URL(window.location.href);
    next.searchParams.set('sessionId', sessionId);
    if (joinCode) next.searchParams.set('joinCode', joinCode);
    if (authToken) next.searchParams.set('token', authToken);
    window.history.replaceState({}, '', next.toString());

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: authToken ? { token: authToken } : undefined,
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      emitCopilot(socket, 'join', { sessionId, joinCode, deviceType: 'console' });
    });

    const handleJoined = () => setConnected(true);
    onMany(socket, ['copilot_joined', 'copilot:joined'], handleJoined);

    const handleError = (payload: any) => setError(payload?.message || 'Copilot error');
    onMany(socket, ['copilot_error', 'copilot:error'], handleError);

    const handleState = (state: any) => {
      setTranscript(Array.isArray(state?.transcript) ? state.transcript : []);
      setTopics(Array.isArray(state?.topics) ? state.topics : []);
      if (Array.isArray(state?.aiMessages)) {
        const assistant = state.aiMessages
          .filter((m: any) => m?.role === 'assistant')
          .map((m: any) => ({ type: m.type || 'HELP_ME', content: m.content, ts: m.ts }));
        setAiMessages(assistant);
      }
    };
    onMany(socket, ['copilot_state', 'copilot:state'], handleState);

    const handleTranscript = (chunk: any) => {
      setTranscript((prev) => [...prev, { text: chunk?.text || '', ts: chunk?.ts, source: chunk?.source }]);
    };
    onMany(socket, ['copilot_transcript_chunk', 'copilot:transcript_chunk'], handleTranscript);

    const handleTopic = (evt: any) => {
      setTopics((prev) => [...prev, { text: evt?.text || '', ts: evt?.ts }]);
    };
    onMany(socket, ['copilot_topic_event', 'copilot:topic_event'], handleTopic);

    const handleAiResponse = (msg: any) => {
      setAiMessages((prev) => {
        // If we're streaming, finalize the streaming message instead of appending a duplicate.
        const next = [...prev];
        const type = msg?.type || 'HELP_ME';
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
        return [...prev, { type, content, ts }];
      });
      setAiStatus('');
    };
    onMany(socket, ['copilot_ai_response', 'copilot:ai_response'], handleAiResponse);

    const handleAiToken = (evt: any) => {
      const token = typeof evt?.token === 'string' ? evt.token : '';
      if (!token) return;
      const type = evt?.type || 'HELP_ME';
      setAiMessages((prev) => {
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
    onMany(socket, ['copilot_ai_token', 'copilot:ai_token'], handleAiToken);

    const handleAiStatus = (status: any) => {
      const msg = typeof status?.status === 'string' ? status.status : '';
      setAiStatus(msg ? `${status?.type || 'HELP_ME'}: ${msg}` : '');

      // If a run starts, ensure we have a streaming placeholder.
      if (status?.status === 'running') {
        const type = status?.type || 'HELP_ME';
        setAiMessages((prev) => {
          if (prev.length && prev[prev.length - 1]?.streaming) return prev;
          return [...prev, { type, content: '', ts: new Date().toISOString(), streaming: true }];
        });
      }
    };
    onMany(socket, ['copilot_ai_status', 'copilot:ai_status'], handleAiStatus);

    socket.on('disconnect', () => {
      setConnected(false);
    });

    return () => {
      offMany(socket, ['copilot_joined', 'copilot:joined'], handleJoined);
      offMany(socket, ['copilot_error', 'copilot:error'], handleError);
      offMany(socket, ['copilot_state', 'copilot:state'], handleState);
      offMany(socket, ['copilot_transcript_chunk', 'copilot:transcript_chunk'], handleTranscript);
      offMany(socket, ['copilot_topic_event', 'copilot:topic_event'], handleTopic);
      offMany(socket, ['copilot_ai_response', 'copilot:ai_response'], handleAiResponse);
      offMany(socket, ['copilot_ai_token', 'copilot:ai_token'], handleAiToken);
      offMany(socket, ['copilot_ai_status', 'copilot:ai_status'], handleAiStatus);
    };
  };

  useEffect(() => {
    // auto-connect if sessionId is in URL
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

  const sendAiRequest = (type: string) => {
    const socket = socketRef.current;
    if (!socket || !sessionId) {
      setError('Connect first');
      return;
    }
    const tail = transcript.slice(-6).map((t) => t.text).filter(Boolean);
    const context = tail.length ? tail.join('\n') : '';
    const messages = [
      context ? { role: 'user', content: `Recent transcript:\n${context}` } : null,
      aiInput ? { role: 'user', content: aiInput } : null,
    ].filter(Boolean) as { role: string; content: string }[];
    emitCopilot(socket, 'ai_request', { sessionId, type, messages });
    setAiStatus(`${type}: running`);
  };

  const endSession = () => {
    const socket = socketRef.current;
    if (!socket || !sessionId) {
      setError('Connect first');
      return;
    }
    emitCopilot(socket, 'end', { sessionId });
  };

  return (
    <div style={{ minHeight: '100vh', padding: 16, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' }}>
      <h2 style={{ margin: 0 }}>Copilot Console</h2>
      <p style={{ marginTop: 6, opacity: 0.75 }}>
        Open this on your phone / second screen. Join with a sessionId (+ optional joinCode).
      </p>

      {!connected && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
          <input
            placeholder="sessionId"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc', minWidth: 260 }}
          />
          <input
            placeholder="joinCode (optional)"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc', minWidth: 180 }}
          />
          <button
            onClick={connect}
            style={{ padding: '10px 14px', borderRadius: 8, border: 'none', cursor: 'pointer' }}
          >
            Connect
          </button>
        </div>
      )}

      {error && (
        <div style={{ marginTop: 10, color: '#b00020' }}>
          {error}
        </div>
      )}

      {connected && (
        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
          <div style={{ padding: 12, border: '1px solid #ddd', borderRadius: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              placeholder="Ask or add context"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              style={{ flex: 1, minWidth: 220, padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
            />
            <button
              onClick={() => sendAiRequest('HELP_ME')}
              style={{ padding: '10px 14px', borderRadius: 8, border: 'none', cursor: 'pointer' }}
            >
              Help Me
            </button>
            <button
              onClick={() => sendAiRequest('EXPLAIN')}
              style={{ padding: '10px 14px', borderRadius: 8, border: 'none', cursor: 'pointer' }}
            >
              Explain
            </button>
            <button
              onClick={endSession}
              style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #e11', background: '#fff0f0', cursor: 'pointer', color: '#b00' }}
            >
              End Session
            </button>
            {aiStatus && <div style={{ fontSize: 12, opacity: 0.7 }}>{aiStatus}</div>}
          </div>

          <div style={{ padding: 12, border: '1px solid #ddd', borderRadius: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Live Transcript</div>
            <div style={{ maxHeight: 260, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
              {transcript.length === 0 ? (
                <div style={{ opacity: 0.6 }}>No transcript yet…</div>
              ) : (
                transcript.map((t, idx) => (
                  <div key={idx} style={{ marginBottom: 6 }}>
                    {t.text}
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ padding: 12, border: '1px solid #ddd', borderRadius: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Topics</div>
            <div style={{ maxHeight: 180, overflow: 'auto' }}>
              {topics.length === 0 ? (
                <div style={{ opacity: 0.6 }}>No topics yet…</div>
              ) : (
                topics.map((t, idx) => (
                  <div key={idx} style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                    {t.text}
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ padding: 12, border: '1px solid #ddd', borderRadius: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>AI Output</div>
            <div style={{ maxHeight: 260, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
              {aiMessages.length === 0 ? (
                <div style={{ opacity: 0.6 }}>No AI messages yet…</div>
              ) : (
                aiMessages.map((m, idx) => (
                  <div key={idx} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 4 }}>{m.type}</div>
                    <div>{m.content}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
