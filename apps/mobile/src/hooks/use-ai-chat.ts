import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { aiChatService } from "@/services/ai-chat-service";
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
