// src/components/CopilotConsole.tsx

import React, { useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "../../services/backendApi";

// Types for incoming transcript and AI messages
interface TranscriptItem {
  text: string;
  source?: string;
  ts?: string;
}

interface AiItem {
  type: string;
  content: string;
  ts?: string;
}

/**
 * The CopilotConsole component provides a stealth console UI similar to the
 * Ntro.io experience.  A vertical toolbar on the right exposes key actions
 * (chat, code/explain, screenshot) while the main panel on the left shows
 * AI responses.  Two logical views are supported: Chat (default) and Code.
 * Chat displays normal “Help Me” style hints; Code displays solutions and
 * explanations generated from screenshots.  Screenshots can be captured
 * manually and stored in the session; multiple captures are supported.
 */
export default function CopilotConsole() {
  // Parse session details from URL parameters.  sessionId is required.
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const sessionId = params.get("sessionId") || "";
  const joinCode = params.get("joinCode") || "";
  const urlToken = params.get("token") || "";

  // Connection and state flags
  const [connected, setConnected] = useState(false);
  // Which tab is currently shown: 'chat' for normal hints, 'code' for coding
  const [tab, setTab] = useState<'chat' | 'code'>("chat");
  // Store chat messages (Help Me and generic AI responses)
  const [chatMessages, setChatMessages] = useState<AiItem[]>([]);
  // Store code/explanation messages
  const [codeMessages, setCodeMessages] = useState<AiItem[]>([]);
  // Keep track of recent transcript lines if we need to show them later
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  // Keep track of screenshots captured during the session
  const [screenshots, setScreenshots] = useState<string[]>([]);

  // Socket reference stored in ref-like state to avoid reinitialising
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Do not initialise if no sessionId
    if (!sessionId) return;

    const socketUrl = SOCKET_URL;
    const storedToken = sessionStorage.getItem("buuzzer_token") || localStorage.getItem("buuzzer_token");
    const token = urlToken || storedToken || "";

    const s: Socket = io(socketUrl, {
      transports: ["websocket"],
      withCredentials: true,
      auth: token ? { token } : undefined,
    });
    setSocket(s);

    // Handle connect/disconnect
    s.on("connect", () => {
      setConnected(true);
      s.emit("copilot_join", {
        sessionId,
        joinCode,
        deviceType: "console",
      });
    });
    s.on("disconnect", () => setConnected(false));

    // Receive initial state
    s.on("copilot_state", (state: any) => {
      if (Array.isArray(state?.transcript)) setTranscript(state.transcript);
      // AI messages: route to appropriate buckets based on type
      if (Array.isArray(state?.aiMessages)) {
        const chat: AiItem[] = [];
        const code: AiItem[] = [];
        for (const m of state.aiMessages) {
          const type = String(m?.type || "HELP_ME").toUpperCase();
          const item: AiItem = { type, content: m?.content || "", ts: m?.ts };
          if (type === "CODE" || type === "SCREEN" || type === "EXPLAIN") {
            code.push(item);
          } else {
            chat.push(item);
          }
        }
        setChatMessages(chat);
        setCodeMessages(code);
      }
    });
    // Append transcript lines as they arrive
    s.on("copilot_transcript_chunk", (msg: any) => {
      if (!msg?.text) return;
      setTranscript((prev) => [...prev, { text: msg.text, source: msg.source, ts: msg.ts }]);
    });
    // Receive new AI responses.  Place them into chat or code buckets based on type.
    s.on("copilot_ai_response", (msg: any) => {
      if (!msg?.content) return;
      const type: string = String(msg.type || "HELP_ME").toUpperCase();
      const item: AiItem = { type, content: msg.content, ts: msg.ts };
      if (type === "CODE" || type === "SCREEN" || type === "EXPLAIN") {
        setCodeMessages((prev) => [...prev, item]);
      } else {
        setChatMessages((prev) => [...prev, item]);
      }
    });
    // When a screenshot is acknowledged, we cannot retrieve the image directly, but we
    // record a placeholder so the UI reflects that a capture occurred.
    s.on("copilot_ai_status", (msg: any) => {
      if (msg?.status === "done" && msg?.type) {
        const t: string = String(msg.type).toUpperCase();
        if (t === "SCREEN") {
          // Append a placeholder entry to screenshot history
          setScreenshots((prev) => [...prev, new Date().toISOString()]);
        }
      }
    });
    return () => {
      s.disconnect();
    };
  }, [sessionId, joinCode, urlToken]);

  // Handler: capture a screenshot via the extension.  This emits an event to the
  // server, which forwards to the active extension tab.  The extension will
  // capture the current view and upload it back.  We record a pending entry
  // locally to indicate that a capture is in progress.
  const captureScreenshot = () => {
    if (socket && connected) {
      socket.emit("copilot_screen_capture", { sessionId });
      // Immediately push a placeholder entry so UI updates without waiting
      setScreenshots((prev) => [...prev, new Date().toISOString()]);
    }
  };

  // Handler: request code generation using the captured screenshots.  We send a
  // generic prompt instructing the backend to generate a solution.  The AI
  // response of type CODE will be routed to the code tab.
  const requestCode = () => {
    if (socket && connected) {
      const messages = [
        {
          role: "user",
          content:
            "Using the screenshots I have uploaded, extract any problem statements or code fragments and generate a complete solution with a brief explanation.",
        },
      ];
      socket.emit("copilot_ai_request", { sessionId, messages, type: "CODE" });
    }
  };

  // Handler: request an explanation for the most recent code answer.  The AI
  // backend will respond with an EXPLAIN type message containing a natural
  // language explanation of the last solution.
  const requestExplain = () => {
    if (socket && connected) {
      const messages = [
        {
          role: "user",
          content: "Explain the code solution just provided. Give rationale and key details.",
        },
      ];
      socket.emit("copilot_ai_request", { sessionId, messages, type: "EXPLAIN" });
    }
  };

  // Handler: send a Help Me request.  The extension (overlay) typically handles
  // Help Me, but we expose it here in the console as well for convenience.
  const requestHelp = () => {
    if (socket && connected) {
      const messages = [
        {
          role: "user",
          content: "Provide a concise, spoken answer to the most recent interviewer question.",
        },
      ];
      socket.emit("copilot_ai_request", { sessionId, messages, type: "HELP_ME" });
    }
  };

  // Render utilities
  const renderMessages = (msgs: AiItem[]) => {
    if (!msgs.length) return <div style={{ color: "#888" }}>No messages yet.</div>;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {msgs.map((m, idx) => (
          <div key={idx} style={{ padding: "12px", borderRadius: "8px", backgroundColor: "#f5f5f5", border: "1px solid #e0e0e0" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#666" }}>{m.type} {m.ts ? new Date(m.ts).toLocaleTimeString() : ""}</div>
            <div style={{ whiteSpace: "pre-wrap", marginTop: "4px" }}>{m.content}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        height: "100vh",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Main response panel */}
      <div style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
        {/* Header: show session status and controls */}
        <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700 }}>Stealth Console</div>
            <div style={{ fontSize: "0.75rem", color: connected ? "green" : "red" }}>
              {connected ? "Connected" : "Disconnected"} — Session {sessionId || "n/a"}
            </div>
          </div>
          {/* Tab switcher */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setTab("chat")}
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                border: tab === "chat" ? "2px solid #3b82f6" : "1px solid #ccc",
                backgroundColor: tab === "chat" ? "#e8f2ff" : "#fff",
                cursor: "pointer",
              }}
            >
              Chat
            </button>
            <button
              onClick={() => setTab("code")}
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                border: tab === "code" ? "2px solid #3b82f6" : "1px solid #ccc",
                backgroundColor: tab === "code" ? "#e8f2ff" : "#fff",
                cursor: "pointer",
              }}
            >
              Code
            </button>
          </div>
        </div>
        {/* Display messages based on selected tab */}
        {tab === "chat" ? renderMessages(chatMessages) : renderMessages(codeMessages)}
      </div>
      {/* Sidebar with action icons */}
      <div
        style={{
          width: "60px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: "24px",
          borderLeft: "1px solid #eee",
          backgroundColor: "#fafafa",
          gap: "12px",
        }}
      >
        <button
          title="Help"
          onClick={requestHelp}
          style={{ fontSize: "24px", border: "none", background: "transparent", cursor: "pointer" }}
        >
          💬
        </button>
        <button
          title="Capture Screenshot"
          onClick={captureScreenshot}
          style={{ fontSize: "24px", border: "none", background: "transparent", cursor: "pointer" }}
        >
          📸
        </button>
        <button
          title="Generate Code"
          onClick={requestCode}
          style={{ fontSize: "24px", border: "none", background: "transparent", cursor: "pointer" }}
        >
          💻
        </button>
        <button
          title="Explain Code"
          onClick={requestExplain}
          style={{ fontSize: "24px", border: "none", background: "transparent", cursor: "pointer" }}
        >
          📄
        </button>
      </div>
    </div>
  );
}
