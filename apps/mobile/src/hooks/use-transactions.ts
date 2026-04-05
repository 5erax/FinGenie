import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  transactionService,
  type CreateTransactionDto,
  type UpdateTransactionDto,
  type TransactionFilter,
} from "@/services/transaction-service";
import { walletKeys } from "./use-wallets";
import { useIsAuthenticated } from "./use-auth-gate";

export const transactionKeys = {
  all: ["transactions"] as const,
  list: (filters?: TransactionFilter) =>
    ["transactions", "list", filters] as const,
  detail: (id: string) => ["transactions", id] as const,
  summary: (filters?: Record<string, string | undefined>) =>
    ["transactions", "summary", filters] as const,
};

export function useTransactions(filters?: TransactionFilter) {
  const isAuth = useIsAuthenticated();
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: () => transactionService.getAll(filters),
    enabled: isAuth,
  });
}

export function useTransaction(id: string) {
  const isAuth = useIsAuthenticated();
  return useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: () => transactionService.getById(id),
    enabled: isAuth && !!id,
  });
}

export function useTransactionSummary(filters?: {
  walletId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const isAuth = useIsAuthenticated();
  return useQuery({
    queryKey: transactionKeys.summary(filters),
    queryFn: () => transactionService.getSummary(filters),
    enabled: isAuth,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTransactionDto) => transactionService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: walletKeys.all }); // Balance changed
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionDto }) =>
      transactionService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: transactionKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: walletKeys.all });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transactionService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: walletKeys.all });
    },
  });
}
