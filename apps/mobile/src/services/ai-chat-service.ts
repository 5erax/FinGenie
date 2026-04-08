import { Platform } from "react-native";
import { api } from "@/lib/api";
import { API_BASE_URL } from "@/constants/config";

export interface AIStatus {
  available: boolean;
  todayMessages: number;
  dailyLimit: number | null;
  isPremium: boolean;
  unavailableReason?: string;
}

export interface AIChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count?: { messages: number };
  messages?: { content: string; createdAt: string }[];
}

export interface AIMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

interface SendMessageResponse {
  userMessage: AIMessage;
  assistantMessage: AIMessage;
}

// SSE event types from the streaming endpoint
export type StreamEvent =
  | { type: "user_message"; userMessage: AIMessage }
  | { type: "chunk"; content: string }
  | { type: "done"; assistantMessage: AIMessage }
  | { type: "error"; message: string; statusCode: number };

// Get auth token for fetch-based requests (bypasses axios)
function getAuthToken(): string | null {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useAuthStore } = require("@/stores/auth-store");
  return useAuthStore.getState().token;
}

/**
 * Parse SSE lines from a text chunk, handling partial lines.
 * Returns the remaining buffer (unparsed partial line).
 */
function parseSSEChunk(
  text: string,
  buffer: string,
  onEvent: (event: StreamEvent) => void,
): string {
  const combined = buffer + text;
  const lines = combined.split("\n");
  // Last element may be an incomplete line — keep it as buffer
  let remaining = lines.pop() ?? "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("data: ")) {
      try {
        const parsed = JSON.parse(trimmed.slice(6)) as StreamEvent;
        onEvent(parsed);
      } catch {
        // Incomplete JSON — put line back in buffer
        remaining = trimmed + "\n" + remaining;
        break;
      }
    }
  }

  return remaining;
}

/**
 * Stream SSE via ReadableStream (web + RN 0.76+ with New Arch).
 */
async function streamViaFetch(
  url: string,
  token: string | null,
  content: string,
  signal: AbortSignal,
  onEvent: (event: StreamEvent) => void,
): Promise<void> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ content }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Stream request failed: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("ReadableStream not supported");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer = parseSSEChunk(
      decoder.decode(value, { stream: true }),
      buffer,
      onEvent,
    );
  }
}

/**
 * Stream SSE via XMLHttpRequest onprogress (React Native fallback).
 * Works on all React Native versions — XHR supports incremental responseText.
 */
function streamViaXHR(
  url: string,
  token: string | null,
  content: string,
  signal: AbortSignal,
  onEvent: (event: StreamEvent) => void,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Accept", "text/event-stream");
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    let lastIndex = 0;
    let buffer = "";

    xhr.onprogress = () => {
      const newData = xhr.responseText.substring(lastIndex);
      lastIndex = xhr.responseText.length;
      buffer = parseSSEChunk(newData, buffer, onEvent);
    };

    xhr.onload = () => {
      // Process any remaining data
      if (xhr.responseText.length > lastIndex) {
        const remaining = xhr.responseText.substring(lastIndex);
        parseSSEChunk(remaining, buffer, onEvent);
      }
      resolve();
    };

    xhr.onerror = () => {
      reject(new Error(`Stream request failed: ${xhr.status}`));
    };

    xhr.ontimeout = () => {
      reject(new Error("Stream request timed out"));
    };

    // Handle abort
    const onAbort = () => {
      xhr.abort();
      reject(new DOMException("The operation was aborted.", "AbortError"));
    };

    if (signal.aborted) {
      onAbort();
      return;
    }
    signal.addEventListener("abort", onAbort, { once: true });

    xhr.send(JSON.stringify({ content }));
  });
}

export const aiChatService = {
  async getStatus(): Promise<AIStatus> {
    const response = await api.get<AIStatus>("/ai-chat/status");
    return response.data;
  },

  async getSessions(
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<AIChatSession>> {
    const response = await api.get<PaginatedResponse<AIChatSession>>(
      "/ai-chat/sessions",
      { params: { page, limit } },
    );
    return response.data;
  },

  async createSession(title?: string): Promise<AIChatSession> {
    const response = await api.post<AIChatSession>("/ai-chat/sessions", {
      title: title ?? "Cuộc trò chuyện mới",
    });
    return response.data;
  },

  async getSession(
    sessionId: string,
  ): Promise<AIChatSession & { messages: AIMessage[] }> {
    const response = await api.get<AIChatSession & { messages: AIMessage[] }>(
      `/ai-chat/sessions/${sessionId}`,
    );
    return response.data;
  },

  async deleteSession(sessionId: string): Promise<void> {
    await api.delete(`/ai-chat/sessions/${sessionId}`);
  },

  async sendMessage(
    sessionId: string,
    content: string,
  ): Promise<SendMessageResponse> {
    const response = await api.post<SendMessageResponse>(
      `/ai-chat/sessions/${sessionId}/messages`,
      { content },
    );
    return response.data;
  },

  /**
   * Send a message and stream the AI response via SSE.
   *
   * Strategy (in priority order):
   * 1. Web / RN with ReadableStream → fetch + getReader()
   * 2. Native RN → XMLHttpRequest with onprogress (incremental text)
   * 3. Last resort → non-streaming endpoint with simulated events
   *
   * Returns an AbortController so the caller can cancel the stream.
   */
  sendMessageStream(
    sessionId: string,
    content: string,
    onEvent: (event: StreamEvent) => void,
    onError?: (error: Error) => void,
  ): AbortController {
    const controller = new AbortController();
    const token = getAuthToken();
    const url = `${API_BASE_URL}/ai-chat/sessions/${sessionId}/messages/stream`;

    const run = async () => {
      // On native platforms, prefer XHR streaming (reliable on all RN versions).
      // On web, use fetch + ReadableStream.
      if (Platform.OS === "web") {
        await streamViaFetch(url, token, content, controller.signal, onEvent);
      } else {
        // Try XHR streaming first (works on all RN versions)
        try {
          await streamViaXHR(url, token, content, controller.signal, onEvent);
        } catch (xhrErr) {
          if ((xhrErr as Error).name === "AbortError") throw xhrErr;

          // If XHR streaming failed, try fetch (RN 0.76+ with New Arch)
          try {
            await streamViaFetch(
              url,
              token,
              content,
              controller.signal,
              onEvent,
            );
          } catch (fetchErr) {
            if ((fetchErr as Error).name === "AbortError") throw fetchErr;

            // Final fallback: non-streaming endpoint
            const result = await aiChatService.sendMessage(sessionId, content);
            onEvent({ type: "user_message", userMessage: result.userMessage });
            onEvent({
              type: "chunk",
              content: result.assistantMessage.content,
            });
            onEvent({
              type: "done",
              assistantMessage: result.assistantMessage,
            });
          }
        }
      }
    };

    run().catch((err: unknown) => {
      if ((err as Error).name === "AbortError") return;
      onError?.(err instanceof Error ? err : new Error(String(err)));
    });

    return controller;
  },
};
