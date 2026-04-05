import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { aiChatService } from "@/services/ai-chat-service";
import type { AIMessage, StreamEvent } from "@/services/ai-chat-service";
import { useIsAuthenticated } from "./use-auth-gate";

const keys = {
  status: ["ai-chat", "status"] as const,
  sessions: ["ai-chat", "sessions"] as const,
  session: (id: string) => ["ai-chat", "session", id] as const,
};

export function useAIStatus() {
  const isAuth = useIsAuthenticated();
  return useQuery({
    queryKey: keys.status,
    queryFn: () => aiChatService.getStatus(),
    staleTime: 60_000,
    enabled: isAuth,
  });
}

export function useAISessions() {
  const isAuth = useIsAuthenticated();
  return useQuery({
    queryKey: keys.sessions,
    queryFn: () => aiChatService.getSessions(1, 50),
    enabled: isAuth,
  });
}

export function useAISession(sessionId: string | null) {
  const isAuth = useIsAuthenticated();
  return useQuery({
    queryKey: keys.session(sessionId ?? ""),
    queryFn: () => aiChatService.getSession(sessionId!),
    enabled: isAuth && !!sessionId,
  });
}

export function useCreateAISession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (title?: string) => aiChatService.createSession(title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.sessions });
    },
  });
}

export function useDeleteAISession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => aiChatService.deleteSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.sessions });
    },
  });
}

// Legacy non-streaming hook (kept for backward compat)
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      content,
    }: {
      sessionId: string;
      content: string;
    }) => aiChatService.sendMessage(sessionId, content),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: keys.session(variables.sessionId),
      });
      queryClient.invalidateQueries({ queryKey: keys.status });
    },
  });
}

/**
 * Streaming hook for AI chat.
 * - Immediately adds the user message (optimistic)
 * - Streams AI response chunk-by-chunk
 * - Updates the query cache when done (no full refetch/spinner)
 */
export function useSendMessageStream() {
  const queryClient = useQueryClient();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const sendStream = useCallback(
    (sessionId: string, content: string) => {
      setIsStreaming(true);
      setStreamingContent("");

      // Optimistically add the user message to the cache
      const optimisticUserMsg: AIMessage = {
        id: `temp-user-${Date.now()}`,
        sessionId,
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData(
        keys.session(sessionId),
        (old: { messages: AIMessage[] } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            messages: [...old.messages, optimisticUserMsg],
          };
        },
      );

      let accumulated = "";

      const controller = aiChatService.sendMessageStream(
        sessionId,
        content,
        (event: StreamEvent) => {
          switch (event.type) {
            case "user_message":
              // Replace optimistic user message with the real one from the server
              queryClient.setQueryData(
                keys.session(sessionId),
                (old: { messages: AIMessage[] } | undefined) => {
                  if (!old) return old;
                  return {
                    ...old,
                    messages: old.messages.map((m) =>
                      m.id === optimisticUserMsg.id ? event.userMessage : m,
                    ),
                  };
                },
              );
              break;

            case "chunk":
              accumulated += event.content;
              setStreamingContent(accumulated);
              break;

            case "done":
              // Add the final assistant message to cache
              queryClient.setQueryData(
                keys.session(sessionId),
                (old: { messages: AIMessage[] } | undefined) => {
                  if (!old) return old;
                  return {
                    ...old,
                    messages: [...old.messages, event.assistantMessage],
                  };
                },
              );
              // Refresh status (message count) without full session refetch
              queryClient.invalidateQueries({ queryKey: keys.status });
              queryClient.invalidateQueries({ queryKey: keys.sessions });
              setIsStreaming(false);
              setStreamingContent("");
              break;

            case "error":
              console.error("Stream error:", event.message);
              setIsStreaming(false);
              setStreamingContent("");
              break;
          }
        },
        (error: Error) => {
          console.error("Stream connection error:", error);
          setIsStreaming(false);
          setStreamingContent("");
        },
      );

      abortRef.current = controller;
    },
    [queryClient],
  );

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setStreamingContent("");
  }, []);

  return {
    sendStream,
    cancelStream,
    isStreaming,
    streamingContent,
  };
}
