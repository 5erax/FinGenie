// ─── Enums (must match Prisma schema exactly) ─────────────────────────────────

export type PetType = "cat" | "dog" | "rabbit" | "fox" | "dragon";
export type PetMood = "happy" | "neutral" | "sad" | "hungry" | "excited";
export type TaskCategory =
  | "saving"
  | "spending"
  | "tracking"
  | "learning"
  | "streak";
export type TaskStatus = "pending" | "completed" | "skipped" | "expired";

// ─── Models ───────────────────────────────────────────────────────────────────

export interface Pet {
  id: string;
  userId: string;
  name: string;
  type: PetType;
  level: number;
  xp: number;
  xpToNext: number;
  mood: PetMood;
  hunger: number;
  happiness: number;
  equippedHat: string | null;
  equippedOutfit: string | null;
  equippedBg: string | null;
  lastFedAt: string | null;
  lastPlayedAt: string | null;
  createdAt: string;
  updatedAt: string;
  inventory: PetItem[];
}

export interface PetItem {
  id: string;
  petId: string;
  itemKey: string;
  itemType: string;
  unlockedAt: string;
}

export interface DailyTask {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  status: TaskStatus;
  xpReward: number;
  coinReward: number;
  targetValue: number | null;
  progress: number;
  date: string;
  expiresAt: string;
  completedAt: string | null;
  createdAt: string;
}

export interface UserStreak {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  totalCoins: number;
  createdAt: string;
  updatedAt: string;
}

export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  coinReward: number;
  conditionType: string;
  conditionValue: number;
  createdAt: string;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: string;
}

export interface AchievementWithStatus extends Achievement {
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface CheckInResult {
  alreadyCheckedIn: boolean;
  streak: UserStreak;
  coinsAwarded: number;
}
