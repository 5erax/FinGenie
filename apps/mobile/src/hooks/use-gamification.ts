import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gamificationService } from "@/services/gamification-service";
import type {
  Pet,
  DailyTask,
  UserStreak,
  AchievementWithStatus,
  CheckInResult,
} from "@fingenie/shared-types";
import { useIsAuthenticated } from "./use-auth-gate";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const gamificationKeys = {
  pet: ["gamification", "pet"] as const,
  tasks: ["gamification", "tasks"] as const,
  streak: ["gamification", "streak"] as const,
  achievements: ["gamification", "achievements"] as const,
};

// ─── Pet Hooks ────────────────────────────────────────────────────────────────

export function usePet() {
  const isAuth = useIsAuthenticated();
  return useQuery<Pet>({
    queryKey: gamificationKeys.pet,
    queryFn: gamificationService.getPet,
    enabled: isAuth,
  });
}

export function useFeedPet() {
  const queryClient = useQueryClient();
  return useMutation<Pet>({
    mutationFn: gamificationService.feedPet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gamificationKeys.pet });
    },
  });
}

export function usePlayWithPet() {
  const queryClient = useQueryClient();
  return useMutation<Pet>({
    mutationFn: gamificationService.playWithPet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gamificationKeys.pet });
    },
  });
}

// ─── Daily Tasks Hooks ────────────────────────────────────────────────────────

export function useDailyTasks() {
  const isAuth = useIsAuthenticated();
  return useQuery<DailyTask[]>({
    queryKey: gamificationKeys.tasks,
    queryFn: gamificationService.getDailyTasks,
    enabled: isAuth,
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  return useMutation<DailyTask, Error, string>({
    mutationFn: (taskId: string) => gamificationService.completeTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gamificationKeys.tasks });
      queryClient.invalidateQueries({ queryKey: gamificationKeys.pet });
      queryClient.invalidateQueries({ queryKey: gamificationKeys.streak });
      queryClient.invalidateQueries({
        queryKey: gamificationKeys.achievements,
      });
    },
  });
}

// ─── Streak Hooks ─────────────────────────────────────────────────────────────

export function useStreak() {
  const isAuth = useIsAuthenticated();
  return useQuery<UserStreak>({
    queryKey: gamificationKeys.streak,
    queryFn: gamificationService.getStreak,
    enabled: isAuth,
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation<CheckInResult>({
    mutationFn: gamificationService.checkIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gamificationKeys.streak });
      queryClient.invalidateQueries({ queryKey: gamificationKeys.tasks });
      queryClient.invalidateQueries({
        queryKey: gamificationKeys.achievements,
      });
    },
  });
}

// ─── Achievements Hooks ───────────────────────────────────────────────────────

export function useAchievements() {
  const isAuth = useIsAuthenticated();
  return useQuery<AchievementWithStatus[]>({
    queryKey: gamificationKeys.achievements,
    queryFn: gamificationService.getAchievements,
    enabled: isAuth,
  });
}
