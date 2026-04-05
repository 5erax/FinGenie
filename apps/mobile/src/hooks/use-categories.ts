import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  categoryService,
  type CreateCategoryDto,
  type UpdateCategoryDto,
} from "@/services/category-service";
import { useIsAuthenticated } from "./use-auth-gate";

export const categoryKeys = {
  all: ["categories"] as const,
};

export function useCategories() {
  const isAuth = useIsAuthenticated();
  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: categoryService.getAll,
    enabled: isAuth,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryDto) => categoryService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryDto }) =>
      categoryService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}
