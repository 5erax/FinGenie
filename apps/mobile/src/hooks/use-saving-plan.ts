import { useQuery } from "@tanstack/react-query";
import { savingPlanService } from "@/services/saving-plan-service";
import { useIsAuthenticated } from "./use-auth-gate";

export const savingPlanKeys = {
  all: ["saving-plans"] as const,
  current: ["saving-plans", "current"] as const,
  detail: (id: string) => ["saving-plans", id] as const,
  check: (id: string) => ["saving-plans", id, "check"] as const,
};

export function useCurrentSavingPlan() {
  const isAuth = useIsAuthenticated();
  return useQuery({
    queryKey: savingPlanKeys.current,
    queryFn: savingPlanService.getCurrent,
    enabled: isAuth,
  });
}

export function useSpendingCheck(id: string) {
  const isAuth = useIsAuthenticated();
  return useQuery({
    queryKey: savingPlanKeys.check(id),
    queryFn: () => savingPlanService.checkSpending(id),
    enabled: isAuth && !!id,
    refetchInterval: 1000 * 60 * 5, // refresh every 5 minutes
  });
}
