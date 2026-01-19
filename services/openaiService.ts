import { AIProvider, InterviewResponse, UserPreferences } from "../types";
import { buildSystemPrompt, buildUserPrompt } from "./aiPrompts";

// Centralised API base to avoid stale localhost fallbacks in production builds.
import { API_BASE } from "./backendApi";

const getToken = (): string | null => {
  const stored = sessionStorage.getItem("buuzzer_token");
  if (stored) return stored;
  const legacy = localStorage.getItem("buuzzer_token");
  if (legacy) {
    sessionStorage.setItem("buuzzer_token", legacy);
    localStorage.removeItem("buuzzer_token");
    return legacy;
  }
  return null;
};

const base64Encode = (value: string): string => {
  if (typeof globalThis.btoa !== "function") {
    throw new Error("Base64 encoder not available in this environment.");
  }
  const encoder = new TextEncoder();
  const bytes = encoder.encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return globalThis.btoa(binary);
};

export type OpenAIStreamHandlers = {
  onToken: (token: string) => void;
  onComplete: () => void;
  onError: (message: string) => void;
};

const mapProviderToBackend = (provider: AIProvider): "openai" | "gemini" | "deepseek" => {
  switch (provider) {
    case "GEMINI":
      return "gemini";
    case "DEEPSEEK":
      return "deepseek";
    case "OPENAI":
    default:
      return "openai";
  }
};

const estimateMaxTokens = (transcriptSnippet: string, preferences: UserPreferences): number => {
  const text = String(transcriptSnippet || "").trim();
  const lower = text.toLowerCase();
  const maxLines = typeof preferences.maxLines === "number" ? preferences.maxLines : null;

  // Base budget derived from the UI preference (acts like a user-controlled cap)
  let base = 200;
  if (maxLines !== null) {
    if (maxLines <= 17) base = 140;
    else if (maxLines >= 30) base = 320;
    else base = 200;
  }

  // Heuristics for extremely short / long intents
  const isGreetingOrBackchannel =
    /^\s*(hi|hello|hey|good\s+(morning|afternoon|evening)|thanks|thank\s+you|ok|okay|cool|great|sure)\b/.test(lower) ||
    /^\s*(can\s+you\s+hear\s+me|are\s+you\s+there|one\s+second|give\s+me\s+a\s+minute)\b/.test(lower) ||
    (text.length <= 6 && !text.includes("?"));

  if (isGreetingOrBackchannel) return 72;

  const wantsBrief = /(briefly|quickly|in\s+one\s+sentence|short\s+answer|tldr)/.test(lower);
  if (wantsBrief) return 120;

  const isSelfIntro = /(tell\s+me\s+about\s+yourself|introduce\s+yourself|walk\s+me\s+through\s+your\s+resume)/.test(lower);
  if (isSelfIntro) return Math.max(base, 240);

  const wantsDeepDive =
    /(deep\s+dive|in\s+detail|in\s+depth|elaborate|walk\s+me\s+through|architecture|system\s+design|scalable|trade-?offs)/.test(lower) ||
    /(tell\s+me\s+about\s+a\s+time|give\s+me\s+an\s+example|conflict|challenge|failure|leadership)/.test(lower);
  if (wantsDeepDive) return Math.max(base, 360);

  // Otherwise, stick to the base cap.
  return Math.min(320, base);
};

export const streamInterviewResponse = (
  provider: AIProvider,
  transcriptSnippet: string,
  preferences: UserPreferences,
  history: InterviewResponse[] = [],
  handlers: OpenAIStreamHandlers
): EventSource | null => {
  const token = getToken();
  if (!token) {
    handlers.onError("Not authenticated. Please login again.");
    return null;
  }

  const systemPrompt = buildSystemPrompt(preferences, history);
  const userPrompt = buildUserPrompt(transcriptSnippet);

  const backendProvider = mapProviderToBackend(provider);
  const maxTokens = estimateMaxTokens(transcriptSnippet, preferences);

  const payload = {
    provider: backendProvider,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]
  };

  const encodedPayload = encodeURIComponent(base64Encode(JSON.stringify(payload)));
  const streamUrl = `${API_BASE}/api/ai/stream?payload=${encodedPayload}&token=${encodeURIComponent(token)}`;

  const eventSource = new EventSource(streamUrl);

  eventSource.onmessage = (event) => {
    const raw = event.data;

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Raw non-JSON sentinel from OpenAI/DeepSeek like [DONE] or [ERROR...]
      if (raw === "[DONE]") {
        handlers.onComplete();
        eventSource.close();
        return;
      }
      if (typeof raw === "string" && raw.startsWith("[ERROR]")) {
        handlers.onError(raw.replace(/^\[ERROR\]\s*/, ""));
        eventSource.close();
        return;
      }
      handlers.onError("Malformed stream payload.");
      eventSource.close();
      return;
    }

    // Our backend may wrap tokens or errors as a JSON string
    if (typeof parsed === "string") {
      if (parsed === "[DONE]") {
        handlers.onComplete();
        eventSource.close();
        return;
      }
      if (parsed.startsWith("[ERROR]")) {
        handlers.onError(parsed.replace(/^\[ERROR\]\s*/, ""));
        eventSource.close();
        return;
      }
      handlers.onToken(parsed);
      return;
    }

    // Direct passthrough of OpenAI / DeepSeek SSE chunk
    const token = parsed?.choices?.[0]?.delta?.content;
    if (typeof token === "string" && token.length > 0) {
      handlers.onToken(token);
    }
  };

  eventSource.onerror = (event) => {
    const message = (event as Event & { message?: string }).message || "Stream connection failed.";
    handlers.onError(message);
    eventSource.close();
  };

  return eventSource;
};
