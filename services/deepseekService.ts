import { UserPreferences, InterviewResponse } from "../types";
import { buildSystemPrompt, buildUserPrompt } from "./aiPrompts";

// Centralised API base to avoid stale localhost fallbacks in production builds.
import { API_BASE } from "./backendApi";


export const generateInterviewResponse = async (
  transcriptSnippet: string,
  preferences: UserPreferences,
  history: InterviewResponse[] = []
): Promise<string> => {
 const token =
  sessionStorage.getItem('buuzzer_token') ||
  (() => {
    const old = localStorage.getItem('buuzzer_token');
    if (old) {
      sessionStorage.setItem('buuzzer_token', old);
      localStorage.removeItem('buuzzer_token');
    }
    return old;
  })();
  if (!token) {
    console.error("Missing auth token");
    return "Error: Not authenticated. Please login again.";
  }

  try {
    const systemPrompt = buildSystemPrompt(preferences, history);
    const userPrompt = buildUserPrompt(transcriptSnippet);

    const response = await fetch(`${API_BASE}/api/ai/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        provider: "deepseek",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend AI Error:", response.status, errorText);
      return `Error generating response (Status: ${response.status}).`;
    }

    const data = await response.json();
    return data.output || "Could not generate a response.";
  } catch (error: any) {
    console.error("DeepSeek Service Exception:", error);
    return `Error calling backend AI: ${error.message}`;
  }
};
