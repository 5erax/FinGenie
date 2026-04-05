import { useQuery } from "@tanstack/react-query";
import { alertService } from "@/services/alert-service";
import { useIsAuthenticated } from "./use-auth-gate";

export const alertKeys = {
  all: ["alerts"] as const,
  unreadCount: ["alerts", "unread-count"] as const,
};

export function useAlerts() {
  const isAuth = useIsAuthenticated();
  return useQuery({
    queryKey: alertKeys.all,
    queryFn: () => alertService.getAll(),
    enabled: isAuth,
  });
}

export function useUnreadAlertCount() {
  const isAuth = useIsAuthenticated();
  return useQuery({
    queryKey: alertKeys.unreadCount,
    queryFn: alertService.getUnreadCount,
    enabled: isAuth,
    refetchInterval: 1000 * 120, // refresh every 2 minutes
  });
}
