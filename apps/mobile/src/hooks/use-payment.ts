import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  paymentService,
  type CreatePaymentDto,
} from "../services/payment-service";
import { useIsAuthenticated } from "./use-auth-gate";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const paymentKeys = {
  all: ["payments"] as const,
  status: () => ["payments", "status"] as const,
  history: () => ["payments", "history"] as const,
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function usePaymentStatus() {
  const isAuth = useIsAuthenticated();
  return useQuery({
    queryKey: paymentKeys.status(),
    queryFn: () => paymentService.getStatus(),
    staleTime: 60_000,
    enabled: isAuth,
  });
}

export function usePaymentHistory() {
  const isAuth = useIsAuthenticated();
  return useQuery({
    queryKey: paymentKeys.history(),
    queryFn: () => paymentService.getHistory(),
    enabled: isAuth,
  });
}

export function useCreatePaymentLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePaymentDto) =>
      paymentService.createPaymentLink(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
    },
  });
}

export function useCancelPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderCode: string) => paymentService.cancelPayment(orderCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
    },
  });
}

export function useVerifyPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderCode: string) => paymentService.verifyPayment(orderCode),
    onSuccess: () => {
      // Refresh payment status and history after verification
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
    },
  });
}
