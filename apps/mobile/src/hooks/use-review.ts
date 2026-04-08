import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reviewService } from "@/services/review-service";
import { useIsAuthenticated } from "./use-auth-gate";
import type { CreateReviewDto, UpdateReviewDto } from "@fingenie/shared-types";

export const reviewKeys = {
  mine: ["reviews", "mine"] as const,
  featured: ["reviews", "featured"] as const,
};

/** Get the current user's own review */
export function useMyReview() {
  const isAuth = useIsAuthenticated();
  return useQuery({
    queryKey: reviewKeys.mine,
    queryFn: () => reviewService.getMine(),
    enabled: isAuth,
  });
}

/** Submit a new review */
export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateReviewDto) => reviewService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.mine });
    },
  });
}

/** Update existing review */
export function useUpdateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateReviewDto) => reviewService.update(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.mine });
    },
  });
}

/** Delete own review */
export function useDeleteReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => reviewService.remove(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.mine });
    },
  });
}
