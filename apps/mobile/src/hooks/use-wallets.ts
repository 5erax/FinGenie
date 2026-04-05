import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  walletService,
  type CreateWalletDto,
  type UpdateWalletDto,
} from "@/services/wallet-service";
import { useIsAuthenticated } from "./use-auth-gate";

export const walletKeys = {
  all: ["wallets"] as const,
  detail: (id: string) => ["wallets", id] as const,
};

export function useWallets() {
  const isAuth = useIsAuthenticated();
  return useQuery({
    queryKey: walletKeys.all,
    queryFn: walletService.getAll,
    enabled: isAuth,
  });
}

export function useWallet(id: string) {
  return useQuery({
    queryKey: walletKeys.detail(id),
    queryFn: () => walletService.getById(id),
    enabled: !!id,
  });
}

export function useCreateWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWalletDto) => walletService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.all });
    },
  });
}

export function useUpdateWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWalletDto }) =>
      walletService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: walletKeys.all });
      queryClient.invalidateQueries({ queryKey: walletKeys.detail(id) });
    },
  });
}

export function useDeleteWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => walletService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.all });
    },
  });
}
