import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiAlertCircle, FiCheck, FiChevronDown, FiLoader, FiMic, FiRefreshCw } from 'react-icons/fi';
import { UserPreferences, InterviewResponse, AIProvider } from '../types';
import { streamInterviewResponse } from '../services/openaiService';
import { getDeepgramKey, recordSessionUsage, startInterviewSession, saveInterviewAnswer, generateInterviewSummary } from '../services/backendApi';
import { Button } from './Button';

interface InterviewSessionProps {
  preferences: UserPreferences;
  onEndSession: () => void;
  defaultProvider?: AIProvider | null;
}

export const InterviewSession: React.FC<InterviewSessionProps> = ({
  preferences,
  onEndSession,
  defaultProvider
}) => {
  const [transcript, setTranscript] = useState<string>("");
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [responses, setResponses] = useState<InterviewResponse[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deepgramKey, setDeepgramKey] = useState<string | null>(null);
  const [currentAccumulatedSeconds, setCurrentAccumulatedSeconds] = useState<number>(
    preferences.sessionSecondsUsed || 0
  );
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('default');
  const [audioSource, setAudioSource] = useState<'mic' | 'system'>('mic');
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [isDeviceDropdownOpen, setIsDeviceDropdownOpen] = useState(false);
  const [isSwitchingDevice, setIsSwitchingDevice] = useState(false);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [listeningEnabled, setListeningEnabled] = useState(true);
  const [activeStreamResponseId, setActiveStreamResponseId] = useState<string | null>(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const sessionStartRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const sessionEndedRef = useRef(false);
  const startSentRef = useRef(false);
  const latestSecondsRef = useRef(preferences.sessionSecondsUsed || 0);
  const sessionDurationSeconds = (preferences.durationMinutes || 0) * 60;
  const preferencesRef = useRef(preferences);

  const handleDeviceChange = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices.filter(device => device.kind === 'audioinput');
    setAudioDevices(audioInputs);
  }, []);

  useEffect(() => {
    const getAudioDevices = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setErrorMsg('Audio capture is not supported on this device/browser.');
          return;
        }
        if (!window.isSecureContext) {
          setErrorMsg('Microphone access requires HTTPS or localhost.');
          return;
        }
        // Request permission to access microphone
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
        
        // Get all audio input devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        setAudioDevices(audioInputs);
      } catch (error) {
        console.error('Error accessing audio devices:', error);
      } finally {
        // Always add the listener, even on error
        if (navigator.mediaDevices?.addEventListener) {
          navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
        } else if (navigator.mediaDevices) {
          navigator.mediaDevices.ondevicechange = handleDeviceChange;
        }
      }
    };

    void getAudioDevices();

    // Cleanup
    return () => {
      if (navigator.mediaDevices?.removeEventListener) {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      } else if (navigator.mediaDevices?.ondevicechange === handleDeviceChange) {
        navigator.mediaDevices.ondevicechange = null;
      }
    };
  }, [handleDeviceChange]);

  const handleAudioDeviceChange = (deviceId: string) => {
    setDeviceError(null);
    setIsSwitchingDevice(true);
    setSelectedAudioDevice(deviceId);
    setIsDeviceDropdownOpen(false);
  };
  const handleAudioSourceChange = (source: 'mic' | 'system') => {
    if (source === audioSource) return;
    setDeviceError(null);
    setIsSwitchingDevice(true);
    setAudioSource(source);
    setIsDeviceDropdownOpen(false);
  };

  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);
  useEffect(() => {
    startSentRef.current = false;
  }, [preferences.interviewId]);
  const onEndSessionRef = useRef(onEndSession);
  useEffect(() => {
    onEndSessionRef.current = onEndSession;
  }, [onEndSession]);

  const displayProviderLabel = defaultProvider || preferences.aiProvider || 'OPENAI';

  const transcriptRef = useRef<string>(""); 
  const bottomRef = useRef<HTMLDivElement>(null);
  const openAIStreamRef = useRef<EventSource | null>(null);
  const openAIStreamResponseIdRef = useRef<string | null>(null);

  const closeOpenAIStream = useCallback(() => {
    if (openAIStreamRef.current) {
      openAIStreamRef.current.close();
      openAIStreamRef.current = null;
    }
    openAIStreamResponseIdRef.current = null;
    setActiveStreamResponseId(null);
  }, []);

  // Media Recorder and WebSocket Refs for Deepgram
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const deepgramStreamRef = useRef<MediaStream | null>(null);

  const stopDeepgram = useCallback(() => {
    try {
      if (socketRef.current) socketRef.current.close();
    } catch (e) {
      console.error('Failed to close Deepgram socket', e);
    }

    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    } catch (e) {
      console.error('Failed to stop Deepgram recorder', e);
    }

    try {
      if (deepgramStreamRef.current) {
        deepgramStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    } catch (e) {
      console.error('Failed to stop Deepgram tracks', e);
    }

    socketRef.current = null;
    mediaRecorderRef.current = null;
    deepgramStreamRef.current = null;
    setIsListening(false);
    setIsRecording(false);
  }, []);

  useEffect(() => {
    let active = true;
    const loadKey = async () => {
      try {
        const key = await getDeepgramKey();
        if (!active) return;
        setDeepgramKey(key);
      } catch (err: unknown) {
        console.error('Failed to load Deepgram key', err);
        if (active) {
          setErrorMsg("Deepgram API Key is missing. Please configure it in the Admin Dashboard.");
        }
      }
    };

    void loadKey();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!deepgramKey) return;

    // Allow the user to pause/resume listening without ending the session.
    if (!listeningEnabled) {
      stopDeepgram();
      setIsSwitchingDevice(false);
      return;
    }

    const startDeepgram = async () => {
      stopDeepgram();
      setErrorMsg(null);
      setDeviceError(null);

      try {
        if (typeof MediaRecorder === 'undefined') {
          setErrorMsg('Audio recording is not supported in this browser.');
          setIsSwitchingDevice(false);
          return;
        }
        if (!navigator.mediaDevices?.getUserMedia) {
          setErrorMsg('Audio capture is not supported on this device/browser.');
          setIsSwitchingDevice(false);
          return;
        }
        if (!window.isSecureContext) {
          setErrorMsg('Microphone access requires HTTPS or localhost.');
          setIsSwitchingDevice(false);
          return;
        }
        let recorderStream: MediaStream;
        if (audioSource === 'system') {
          if (!navigator.mediaDevices?.getDisplayMedia) {
            throw new Error('System audio capture is not supported in this browser.');
          }
          const displayStream = await navigator.mediaDevices.getDisplayMedia({
            audio: true,
            video: true,
          });
          if (!displayStream.getAudioTracks().length) {
            displayStream.getTracks().forEach((t) => t.stop());
            throw new Error(
              'No system audio captured. In the share dialog, pick a screen or tab and enable Share audio.'
            );
          }
          deepgramStreamRef.current = displayStream;
          recorderStream = new MediaStream(displayStream.getAudioTracks());
        } else {
          const constraints: MediaStreamConstraints = {
            audio:
              selectedAudioDevice && selectedAudioDevice !== 'default'
                ? {
                    deviceId: { exact: selectedAudioDevice },
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                  }
                : true,
          };
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          deepgramStreamRef.current = stream;
          recorderStream = stream;
        }

        let mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported('audio/webm')) {
          if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4';
          } else {
            setErrorMsg('Browser not supported (requires audio/webm or audio/mp4).');
            setIsSwitchingDevice(false);
            return;
          }
        }

        const mediaRecorder = new MediaRecorder(recorderStream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;

        const socket = new WebSocket(
          'wss://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&interim_results=true',
          ['token', deepgramKey]
        );
        socketRef.current = socket;

        socket.onopen = () => {
          setIsListening(true);
          setIsRecording(true);
          setIsSwitchingDevice(false);
          mediaRecorder.addEventListener('dataavailable', (event) => {
            if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
              socket.send(event.data);
            }
          });
          mediaRecorder.start(250);
        };

        socket.onmessage = (message) => {
          const received = JSON.parse(message.data);
          const transcriptPart = received.channel?.alternatives?.[0]?.transcript;

          if (transcriptPart) {
            if (received.is_final) {
              setTranscript((prev) => {
                const updated = prev + ' ' + transcriptPart;
                transcriptRef.current = updated;
                return updated;
              });
              setInterimTranscript('');
            } else {
              setInterimTranscript(transcriptPart);
            }
          }
        };

        socket.onclose = () => {
          setIsListening(false);
          setIsRecording(false);
        };

        socket.onerror = () => {
          setErrorMsg('Connection to Deepgram failed. Check API Key.');
          setDeviceError('Deepgram connection failed');
          setIsSwitchingDevice(false);
        };
      } catch (err: unknown) {
        console.error('Microphone Error:', err);
        const message = err instanceof Error ? err.message : '';
        if (audioSource === 'system') {
          setErrorMsg(`Could not access system audio. ${message}`);
          setDeviceError('System audio capture failed');
        } else {
          setErrorMsg('Could not access microphone. ' + message);
          setDeviceError('Could not access selected microphone');
        }
        setIsSwitchingDevice(false);
      }
    };

    void startDeepgram();

    return () => {
      stopDeepgram();
    };
  }, [deepgramKey, selectedAudioDevice, audioSource, listeningEnabled, stopDeepgram]);

  useEffect(() => {
    const onDocMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('.audio-device-selector')) {
        setIsDeviceDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  const AudioDeviceSelector = () => {
    const selectedDeviceLabel =
      selectedAudioDevice === 'default'
        ? 'Default Mic'
        : audioDevices.find((d) => d.deviceId === selectedAudioDevice)?.label || 'Microphone';

    return (
      <div className="relative audio-device-selector">
        <button
          type="button"
          aria-label="Select audio input device"
          onClick={() => !isSwitchingDevice && setIsDeviceDropdownOpen((v) => !v)}
          className={
            `flex items-center gap-3 rounded-xl px-3 py-2 border transition-all duration-200 shadow-sm ` +
            (isDeviceDropdownOpen
              ? 'border-blue-300 bg-blue-50 shadow-md ring-1 ring-blue-200'
              : 'border-gray-200 bg-white hover:bg-gray-50 hover:shadow-md hover:border-gray-300')
          }
        >
          <span className="relative">
            <FiMic className="h-4 w-4 text-gray-700" />
            <span
              className={
                `absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full shadow-sm ` +
                (isListening ? 'bg-green-500' : 'bg-gray-300')
              }
            />
          </span>

          <span className="flex min-w-0 flex-col items-start">
            <span className="text-xs font-semibold text-gray-800 truncate max-w-[180px]">
              {selectedDeviceLabel || 'Microphone'}
            </span>
            <span className="text-[11px] text-gray-500">
              {isSwitchingDevice ? 'Switching…' : isListening ? 'Live' : 'Idle'}
            </span>
          </span>

          <span className="ml-2 flex items-center gap-2">
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                handleDeviceChange().catch((err) => {
                  console.error('Failed to refresh devices', err);
                  setDeviceError('Failed to refresh devices');
                });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDeviceChange().catch((err) => {
                    console.error('Failed to refresh devices', err);
                    setDeviceError('Failed to refresh devices');
                  });
                }
              }}
              className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
              title="Refresh devices"
              aria-label="Refresh audio devices"
            >
              <FiRefreshCw className={isSwitchingDevice ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            </span>

            <motion.span
              animate={{ rotate: isDeviceDropdownOpen ? 180 : 0 }}
              transition={{ duration: 0.15 }}
              className="text-gray-500"
            >
              <FiChevronDown className="h-4 w-4" />
            </motion.span>
          </span>
        </button>

        <AnimatePresence>
          {isDeviceDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl ring-1 ring-black/5 z-50"
            >
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <span className="text-xs font-semibold text-gray-700">Audio input</span>
                {isSwitchingDevice && <FiLoader className="h-4 w-4 animate-spin text-gray-500" />}
              </div>

              <div className="max-h-64 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => handleAudioDeviceChange('default')}
                  className={
                    `w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors duration-150 ` +
                    (selectedAudioDevice === 'default' ? 'bg-blue-50 border-r-2 border-blue-500' : '')
                  }
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">Default mic</div>
                    <div className="text-xs text-gray-500">Use system default</div>
                  </div>
                  {selectedAudioDevice === 'default' && <FiCheck className="h-4 w-4 text-green-500" />}
                </button>

                {audioDevices.map((device) => (
                  <button
                    key={device.deviceId}
                    type="button"
                    onClick={() => handleAudioDeviceChange(device.deviceId)}
                    className={
                      `w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors duration-150 ` +
                      (device.deviceId === selectedAudioDevice ? 'bg-blue-50 border-r-2 border-blue-500' : '')
                    }
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">
                        {device.label || `Microphone ${device.deviceId.substring(0, 5)}`}
                      </div>
                      <div className="text-xs text-gray-500 truncate">Tap to switch</div>
                    </div>
                    {device.deviceId === selectedAudioDevice && <FiCheck className="h-4 w-4 text-green-500" />}
                  </button>
                ))}
              </div>

              {deviceError && (
                <div className="px-4 py-3 border-t border-red-100 bg-red-50/80 flex items-center gap-2">
                  <FiAlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <span className="text-xs text-red-700">{deviceError}</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const AudioSourceSelector = () => {
    return (
      <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-1 py-1 shadow-sm">
        <button
          type="button"
          onClick={() => handleAudioSourceChange('mic')}
          className={
            `rounded-lg px-3 py-1 text-xs font-semibold transition-all ` +
            (audioSource === 'mic'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100')
          }
        >
          Mic
        </button>
        <button
          type="button"
          onClick={() => handleAudioSourceChange('system')}
          className={
            `rounded-lg px-3 py-1 text-xs font-semibold transition-all ` +
            (audioSource === 'system'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100')
          }
        >
          System Audio
        </button>
      </div>
    );
  };

  const finalizeSession = useCallback(
    async (reason?: string) => {
      closeOpenAIStream();

      if (sessionEndedRef.current) return;
      sessionEndedRef.current = true;

      stopDeepgram();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const currentPreferences = preferencesRef.current;
      try {
        const startedAt = sessionStartRef.current
          ? new Date(sessionStartRef.current).toISOString()
          : undefined;
        await recordSessionUsage(currentPreferences.interviewId, {
          finalize: true,
          startedAt,
          endedAt: new Date().toISOString(),
        });
        window.dispatchEvent(new CustomEvent('sessionUpdated'));
        void generateInterviewSummary(currentPreferences.interviewId).catch((err) => {
          console.warn('Failed to generate interview summary', err);
        });
      } catch (err) {
        console.error('Failed to record session usage', err);
      }

      if (reason) {
        setErrorMsg(reason);
      }

      onEndSessionRef.current?.();
    },
    [closeOpenAIStream, stopDeepgram]
  );

  useEffect(() => {
    if (!deepgramKey) return;
    sessionStartRef.current = Date.now();
    sessionEndedRef.current = false;
    latestSecondsRef.current = preferences.sessionSecondsUsed || 0;
    setCurrentAccumulatedSeconds(latestSecondsRef.current);
    if (!startSentRef.current) {
      startSentRef.current = true;
      startInterviewSession(preferences.interviewId).catch((err) => {
        console.error('Failed to start interview session', err);
        setErrorMsg(err?.message || 'Failed to start interview session');
      });
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    const base = latestSecondsRef.current || 0; // keep whatever was already used before this session

    const intervalId = window.setInterval(() => {
      const start = sessionStartRef.current;
      if (!start) return;

      const delta = Math.floor((Date.now() - start) / 1000); // time since this session started
      const total = base + delta; // correct total

      setCurrentAccumulatedSeconds(total);

      if (sessionDurationSeconds > 0 && total >= sessionDurationSeconds) {
        void finalizeSession("Session duration completed");
      }
    }, 1000);
    timerRef.current = intervalId;
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [deepgramKey, finalizeSession, sessionDurationSeconds, preferences.sessionSecondsUsed]);

  useEffect(() => {
    return () => {
      closeOpenAIStream();
    };
  }, [closeOpenAIStream]);

  const isSessionExpired =
    sessionDurationSeconds > 0 && currentAccumulatedSeconds >= sessionDurationSeconds;

  // Auto scroll transcript
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript, interimTranscript]);

  const handleGenerateResponse = useCallback(async () => {
    // Combine finalized and interim transcript
    const fullTranscript = (transcriptRef.current + " " + interimTranscript).trim();
    // Emphasize the most recent lines (latest ~500 chars) to mirror the extension's "latest question" focus.
    const recentSnippet = fullTranscript.length > 500 ? fullTranscript.slice(-500) : fullTranscript;
    if (!fullTranscript || fullTranscript.length < 5) return;
    if (isSessionExpired) {
      setErrorMsg("Session duration completed.");
      return;
    }

    // CLEAR TRANSCRIPT STATE IMMEDIATELY
    // This ensures the next question starts on a clean slate
    setTranscript("");
    transcriptRef.current = "";
    setInterimTranscript("");
    
    const newId = Date.now().toString();
    const newEntry: InterviewResponse = {
      id: newId,
      // Show the actual captured text as context, truncated if too long
      questionContext: fullTranscript.length > 150 ? fullTranscript.slice(0, 150) + "..." : fullTranscript, 
      answer: "",
      timestamp: new Date(),
      isLoading: true
    };

    // Add new entry to UI immediately (as loading)
    setResponses((prev) => [newEntry, ...prev]);

    // Choose the provider based on preference
    const provider = defaultProvider || preferences.aiProvider || 'OPENAI';
    
    try {
      // If another answer stream is already running, stop it so the UI doesn't get stuck.
      const previousStreamId = activeStreamResponseId;
      closeOpenAIStream();
      if (previousStreamId) {
        setResponses((prev) =>
          prev.map((r) => {
            if (r.id !== previousStreamId) return r;
            const tag = '[Generation stopped]';
            const alreadyTagged = typeof r.answer === 'string' && r.answer.includes(tag);
            const nextAnswer = alreadyTagged
              ? r.answer
              : r.answer
                ? `${r.answer}\n\n${tag}`
                : tag;
            return { ...r, isLoading: false, answer: nextAnswer };
          })
        );
      }

      // Mark this response as the active stream (so Stop button works immediately).
      openAIStreamResponseIdRef.current = newId;
      setActiveStreamResponseId(newId);

      let answerBuffer = "";
      const appendToken = (token: string) => {
        answerBuffer += token;
        setResponses((prev) =>
          prev.map((r) =>
            r.id === newId
              ? { ...r, answer: r.answer + token }
              : r
          )
        );
      };
      const finishLoading = () => {
        if (openAIStreamResponseIdRef.current !== newId) return;

        setResponses((prev) =>
          prev.map((r) => (r.id === newId ? { ...r, isLoading: false } : r))
        );
        const answerText = answerBuffer.trim();
        if (answerText) {
          void saveInterviewAnswer({
            interviewId: preferences.interviewId,
            question: fullTranscript,
            answerText,
            provider,
          });
        }

        openAIStreamResponseIdRef.current = null;
        openAIStreamRef.current = null;
        setActiveStreamResponseId(null);
      };
      const handleStreamError = (message: string) => {
        if (openAIStreamResponseIdRef.current !== newId) return;

        setResponses((prev) =>
          prev.map((r) =>
            r.id === newId
              ? { ...r, answer: `Error: ${message}`, isLoading: false }
              : r
          )
        );

        openAIStreamResponseIdRef.current = null;
        openAIStreamRef.current = null;
        setActiveStreamResponseId(null);
      };

      const stream = streamInterviewResponse(provider, recentSnippet, preferences, responses, {
        onToken: (token) => appendToken(token),
        onComplete: () => finishLoading(),
        onError: (message) => handleStreamError(message)
      });

      if (!stream) {
        handleStreamError("Authentication missing");
        return;
      }

      // Track the active stream so we can stop it on demand.
      openAIStreamRef.current = stream;
      openAIStreamResponseIdRef.current = newId;
      setActiveStreamResponseId(newId);
    } catch (e: unknown) {
      console.error("Error generating response", e);
      const message = e instanceof Error ? e.message : "Failed to generate response";
      setResponses((prev) =>
        prev.map((r) =>
          r.id === newId
            ? { ...r, answer: `Error: ${message}`, isLoading: false }
            : r
        )
      );
      closeOpenAIStream();
      return;
    }
  }, [
    preferences,
    interimTranscript,
    responses,
    isSessionExpired,
    defaultProvider,
    closeOpenAIStream,
    activeStreamResponseId,
  ]);

  const handleStopGeneration = useCallback(() => {
    if (!activeStreamResponseId) return;

    // Stop the SSE stream immediately.
    closeOpenAIStream();

    // Mark the currently loading answer as stopped (keeps partial text visible).
    setResponses((prev) =>
      prev.map((r) => {
        if (r.id !== activeStreamResponseId) return r;
        const tag = '[Generation stopped]';
        const alreadyTagged = typeof r.answer === 'string' && r.answer.includes(tag);
        const nextAnswer = alreadyTagged
          ? r.answer
          : r.answer
            ? `${r.answer}\n\n${tag}`
            : tag;
        return { ...r, isLoading: false, answer: nextAnswer };
      })
    );
  }, [activeStreamResponseId, closeOpenAIStream]);

  const triggerGenerateResponse = useCallback(() => {
    void handleGenerateResponse();
  }, [handleGenerateResponse]);

  // Key Listener for Space/Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault(); 
          triggerGenerateResponse();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerGenerateResponse]);

  const handleClearTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
    transcriptRef.current = '';
  };

  const handleEndSession = useCallback(() => {
    if (sessionEndedRef.current) return;
    setShowEndConfirm(true);
  }, []);

  const confirmEndSession = useCallback(() => {
    setShowEndConfirm(false);
    if (sessionEndedRef.current) return;
    void finalizeSession();
  }, [finalizeSession]);

  const remainingSeconds = sessionDurationSeconds > 0 
    ? Math.max(0, sessionDurationSeconds - currentAccumulatedSeconds) 
    : Infinity;
  const formatHMS = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const parts = [];
    if (hrs > 0) parts.push(String(hrs).padStart(2, '0'));
    parts.push(String(mins).padStart(2, '0'));
    parts.push(String(secs).padStart(2, '0'));
    return parts.join(':');
  };
  const timeDisplay = remainingSeconds !== Infinity 
    ? `Time Remaining: ${formatHMS(remainingSeconds)}`
    : `Time Used: ${formatHMS(currentAccumulatedSeconds)}`;

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-slate-100 max-w-[1440px] mx-auto">
      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        
        {/* LEFT/TOP: Responses (70%) */}
        <div className="flex-1 md:flex-[7] bg-gradient-to-b from-slate-100 via-white to-slate-100 flex flex-col overflow-hidden relative">
           <div
             className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-slate-200"
             style={{ scrollbarWidth: 'thin', scrollbarColor: '#94a3b8 #e2e8f0' }}
           >
              {responses.length === 0 && (
                <div className="h-full flex items-center justify-center py-12">
                  <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/95 p-8 text-center shadow-sm">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <p className="text-lg font-semibold text-slate-800">Waiting for trigger...</p>
                    <p className="mt-2 text-sm text-slate-500">When the interviewer asks a question, press Space or use the button below.</p>
                  </div>
                </div>
              )}

              {responses.map((resp) => (
                <motion.div
                  key={resp.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
                  <div
                    className={`rounded-2xl p-6 border shadow-sm ${
                      resp.isLoading
                        ? 'border-sky-300 bg-sky-50'
                        : 'border-slate-200 bg-white'
                    } transition-all duration-200 hover:shadow-md`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <p className="text-xs text-slate-500 font-medium">
                          Question: {resp.questionContext}
                        </p>
                      </div>
                      <span className="text-xs text-slate-400 ml-2 whitespace-nowrap">
                        {resp.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="prose prose-slate max-w-none">
                      {resp.isLoading && (
                        <div className="flex space-x-2 items-center text-sky-600 mb-4">
                          <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="font-medium">Generating response...</span>
                        </div>
                      )}
                      {resp.answer && (
                        <div className="space-y-4">
                          {resp.answer.split(/\n\s*\n/).map((paragraph, idx) => (
                            <p
                              key={`${resp.id}-paragraph-${idx}`}
                              className="text-[17px] md:text-lg leading-relaxed text-slate-900"
                            >
                              {paragraph.trim()}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
           </div>
        </div>

        {/* RIGHT/BOTTOM: Transcript (30%) */}
        <div className="h-48 md:h-auto md:flex-[3] bg-gradient-to-b from-white to-slate-50 border-t md:border-t-0 md:border-l border-slate-200 flex flex-col shrink-0 relative">
           <div className="px-4 py-4 bg-white border-b border-slate-200 flex flex-col gap-3">
             <div className="flex items-center justify-between gap-3">
               <div className="flex items-center gap-2">
                 <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                   Interview Session
                 </span>
                 <span className="px-2.5 py-1 bg-gradient-to-r from-sky-500 to-blue-600 text-white text-[11px] font-semibold rounded-full shadow-sm">
                   {displayProviderLabel}
                 </span>
               </div>
              <div className="flex items-center gap-2">
                {activeStreamResponseId && (
                  <Button
                    variant="secondary"
                    onClick={handleStopGeneration}
                    className="px-4 py-2 text-sm bg-white hover:bg-slate-100 text-slate-800 border-slate-300 rounded-xl"
                  >
                    Stop
                  </Button>
                )}
                <Button
                  onClick={handleEndSession}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 px-4 py-2 rounded-xl text-sm"
                >
                  End
                </Button>
              </div>
             </div>
             <div className="flex flex-wrap items-center gap-3">
               <AudioSourceSelector />
               {audioSource === 'mic' && <AudioDeviceSelector />}
               <div className="text-xs text-slate-700 font-semibold">
                 {timeDisplay}
                 {isRecording && <span className="ml-2 text-rose-600 font-bold">• Live</span>}
               </div>
             </div>
             <div className="flex items-center justify-between gap-3">
               <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Live Transcript</span>
               <div className="flex items-center gap-3">
                 <span className={`w-2 h-2 rounded-full shadow-sm ${isListening ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <Button
                  variant="secondary"
                  className="px-3 py-1 text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border-slate-300 rounded-lg transition-colors duration-150"
                  onClick={() => {
                    setErrorMsg(null);
                    setDeviceError(null);
                    setListeningEnabled((v) => !v);
                  }}
                  disabled={isSessionExpired}
                  title={listeningEnabled ? 'Pause listening' : 'Resume listening'}
                >
                  {listeningEnabled ? 'Pause' : 'Resume'}
                </Button>
                 <Button
                   variant="secondary"
                   className="px-3 py-1 text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border-slate-300 rounded-lg transition-colors duration-150"
                   onClick={handleClearTranscript}
                   disabled={!transcript && !interimTranscript}
                 >
                   Clear
                 </Button>
               </div>
             </div>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 font-mono text-sm text-slate-800 space-y-2 relative pb-20 md:pb-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
             {errorMsg ? (
               <motion.div 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 className="text-red-700 p-3 border border-red-200 bg-red-50 rounded-xl shadow-sm"
               >
                 <div className="flex items-center gap-2">
                   <FiAlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                   <span className="text-sm">{errorMsg}</span>
                 </div>
               </motion.div>
             ) : (
               <>
                {isRecording && (
                  <span 
                    className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full shadow-lg border-2 border-red-600/50"
                    aria-label="Recording in progress"
                  />
                )}
                <div className="min-h-[2rem]">
                  {transcript || interimTranscript ? (
                    <p className="whitespace-pre-wrap break-words leading-relaxed">
                      {transcript}
                      {interimTranscript && (
                        <span className="text-sky-600 font-medium">{interimTranscript}</span>
                      )}
                      <span className="inline-block w-0.5 h-4 bg-sky-500 mx-1" style={{ animation: 'blink 1s infinite' }}>|</span>
                    </p>
                  ) : (
                    <p className="text-slate-500 italic text-center pt-8">Listening for next question...</p>
                  )}
                </div>
                <div ref={bottomRef} />
               </>
             )}
           </div>

           {/* MANUAL TRIGGER BUTTON (Floating at bottom of transcript) */}
           <motion.div 
             initial={{ y: 10, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             className="absolute bottom-4 left-0 w-full px-4 flex justify-center z-10 pointer-events-none"
           >
              <Button 
                onClick={handleGenerateResponse}
                disabled={isSessionExpired || (!transcript && !interimTranscript)}
                className="pointer-events-auto shadow-2xl shadow-emerald-500/20 flex items-center gap-2 border border-emerald-300/60 backdrop-blur-md bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700 text-white font-semibold py-3 px-6 rounded-full w-full md:w-auto justify-center transition-all duration-200 transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                <span>Generate Answer</span>
              </Button>
           </motion.div>
        </div>

      </div>

      {showEndConfirm && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                <FiAlertCircle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-slate-900">End session?</h3>
                <p className="text-sm text-slate-600">
                  Your transcript and timer will stop. You can restart later if needed.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <Button
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => setShowEndConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                onClick={confirmEndSession}
              >
                Yes, end session
              </Button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #e2e8f0;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #94a3b8;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
};
