import { api } from "@/lib/api";
import type {
  Pet,
  PetType,
  PetMood,
  DailyTask,
  TaskCategory,
  TaskStatus,
  UserStreak,
  Achievement,
  AchievementWithStatus,
  CheckInResult,
} from "@fingenie/shared-types";

export type {
  Pet,
  PetType,
  PetMood,
  DailyTask,
  TaskCategory,
  TaskStatus,
  UserStreak,
  Achievement,
  AchievementWithStatus,
  CheckInResult,
};

// ─── Service ──────────────────────────────────────────────────────────────────

export const gamificationService = {
  // Pet
  async getPet(): Promise<Pet> {
    const res = await api.get<Pet>("/gamification/pet");
    return res.data;
  },

  async feedPet(): Promise<Pet> {
    const res = await api.post<Pet>("/gamification/pet/feed");
    return res.data;
  },

  async playWithPet(): Promise<Pet> {
    const res = await api.post<Pet>("/gamification/pet/play");
    return res.data;
  },

  // Daily Tasks
  async getDailyTasks(): Promise<DailyTask[]> {
    const res = await api.get<DailyTask[]>("/gamification/tasks");
    return res.data;
  },

  async completeTask(taskId: string): Promise<DailyTask> {
    const res = await api.post<DailyTask>(
      `/gamification/tasks/${taskId}/complete`,
    );
    return res.data;
  },

  // Streak
  async getStreak(): Promise<UserStreak> {
    const res = await api.get<UserStreak>("/gamification/streak");
    return res.data;
  },

  async checkIn(): Promise<CheckInResult> {
    const res = await api.post<CheckInResult>("/gamification/check-in");
    return res.data;
  },

  // Achievements
  async getAchievements(): Promise<AchievementWithStatus[]> {
    const res = await api.get<AchievementWithStatus[]>(
      "/gamification/achievements",
    );
    return res.data;
  },
};
