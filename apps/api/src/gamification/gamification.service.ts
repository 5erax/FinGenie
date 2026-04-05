import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PetMood, PetType, TaskCategory, TaskStatus } from "@prisma/client";
import type { DailyTask, UserAchievement } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

// ─── Internal helper types ────────────────────────────────────────────────────

interface XpSnapshot {
  level: number;
  xp: number;
  xpToNext: number;
}

// ─── Task template shape ──────────────────────────────────────────────────────

interface TaskTemplate {
  title: string;
  description: string;
  category: TaskCategory;
  xpReward: number;
  coinReward: number;
  targetValue: number;
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Pet ───────────────────────────────────────────────────────────────────

  /**
   * Get the user's pet. Auto-creates one with default values if it doesn't exist yet.
   */
  async getOrCreatePet(userId: string) {
    const existing = await this.prisma.pet.findUnique({
      where: { userId },
      include: { inventory: true },
    });

    if (existing) return existing;

    const pet = await this.prisma.pet.create({
      data: {
        userId,
        name: "Genie",
        type: PetType.cat,
        level: 1,
        xp: 0,
        xpToNext: 100,
        mood: PetMood.happy,
        hunger: 100,
        happiness: 100,
      },
      include: { inventory: true },
    });

    this.logger.log(`Pet created for user: ${userId}`);
    return pet;
  }

  /**
   * Feed the pet: +20 hunger (capped at 100), +10 XP, recalculate mood, handle level-up.
   */
  async feedPet(userId: string) {
    const pet = await this.getOrCreatePet(userId);

    // Cooldown: 30 seconds between feeds
    if (pet.lastFedAt) {
      const elapsed = Date.now() - new Date(pet.lastFedAt).getTime();
      if (elapsed < 30_000) {
        throw new BadRequestException(
          `Hãy đợi ${Math.ceil((30_000 - elapsed) / 1000)} giây trước khi cho ăn tiếp`,
        );
      }
    }

    const newHunger = Math.min(100, pet.hunger + 20);
    const xpData = this.addXpToPet(pet, 10);
    const mood = this.calculateMood(newHunger, pet.happiness);

    const updated = await this.prisma.pet.update({
      where: { id: pet.id },
      data: {
        hunger: newHunger,
        lastFedAt: new Date(),
        level: xpData.level,
        xp: xpData.xp,
        xpToNext: xpData.xpToNext,
        mood,
      },
      include: { inventory: true },
    });

    this.logger.log(`Pet fed for user: ${userId}`);
    return updated;
  }

  /**
   * Play with the pet: +20 happiness (capped at 100), +10 XP, recalculate mood, handle level-up.
   */
  async playWithPet(userId: string) {
    const pet = await this.getOrCreatePet(userId);

    // Cooldown: 30 seconds between play sessions
    if (pet.lastPlayedAt) {
      const elapsed = Date.now() - new Date(pet.lastPlayedAt).getTime();
      if (elapsed < 30_000) {
        throw new BadRequestException(
          `Hãy đợi ${Math.ceil((30_000 - elapsed) / 1000)} giây trước khi chơi tiếp`,
        );
      }
    }

    const newHappiness = Math.min(100, pet.happiness + 20);
    const xpData = this.addXpToPet(pet, 10);
    const mood = this.calculateMood(pet.hunger, newHappiness);

    const updated = await this.prisma.pet.update({
      where: { id: pet.id },
      data: {
        happiness: newHappiness,
        lastPlayedAt: new Date(),
        level: xpData.level,
        xp: xpData.xp,
        xpToNext: xpData.xpToNext,
        mood,
      },
      include: { inventory: true },
    });

    this.logger.log(`Played with pet for user: ${userId}`);
    return updated;
  }

  // ─── Daily Tasks ───────────────────────────────────────────────────────────

  /**
   * Get today's daily tasks.
   * If none exist for today, auto-generates a fresh set (3 random + 1 login task).
   */
  async getDailyTasks(userId: string): Promise<DailyTask[]> {
    const today = this.getStartOfTodayUtc();
    const tomorrow = this.addDays(today, 1);

    const existing = await this.prisma.dailyTask.findMany({
      where: {
        userId,
        date: { gte: today, lt: tomorrow },
      },
      orderBy: { createdAt: "asc" },
    });

    if (existing.length > 0) return existing;

    return this.generateDailyTasks(userId);
  }

  /**
   * Mark a daily task as completed.
   * Awards XP to the pet and coins to the user's streak wallet.
   * Triggers async achievement check after completion.
   */
  async completeTask(userId: string, taskId: string): Promise<DailyTask> {
    const task = await this.prisma.dailyTask.findFirst({
      where: { id: taskId, userId },
    });

    if (!task) throw new NotFoundException("Task not found");

    if (task.status === TaskStatus.completed) {
      throw new BadRequestException("Task already completed");
    }

    if (task.status === TaskStatus.expired || new Date() > task.expiresAt) {
      throw new BadRequestException("Task has expired");
    }

    const updatedTask = await this.prisma.dailyTask.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.completed,
        completedAt: new Date(),
        progress: task.targetValue ?? 1,
      },
    });

    // Award XP to pet (fire-and-forget with error logging)
    this.awardPetXp(userId, task.xpReward).catch((err) =>
      this.logger.error(`Pet XP award failed: ${String(err)}`),
    );

    // Award coins to streak wallet (fire-and-forget)
    if (task.coinReward > 0) {
      this.awardCoins(userId, task.coinReward).catch((err) =>
        this.logger.error(`Coin award failed: ${String(err)}`),
      );
    }

    // Async achievement unlock check
    this.checkAndUnlockAchievements(userId).catch((err) =>
      this.logger.error(`Achievement check failed: ${String(err)}`),
    );

    return updatedTask;
  }

  // ─── Streak ────────────────────────────────────────────────────────────────

  /**
   * Get the user's streak record. Creates one with sensible defaults if it doesn't exist.
   * `lastActiveDate` is seeded to the Unix epoch so the very first check-in works correctly.
   */
  async getStreak(userId: string) {
    try {
      const streak = await this.prisma.userStreak.findUnique({
        where: { userId },
      });

      if (streak) return streak;

      // Seed to epoch so first checkIn doesn't return alreadyCheckedIn
      const epoch = new Date(0); // 1970-01-01T00:00:00.000Z

      return this.prisma.userStreak.create({
        data: {
          userId,
          currentStreak: 0,
          longestStreak: 0,
          totalCoins: 0,
          lastActiveDate: epoch,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to get/create streak for user ${userId}: ${String(error)}`,
      );
      // Return a safe default so the mobile app doesn't crash
      return {
        userId,
        currentStreak: 0,
        longestStreak: 0,
        totalCoins: 0,
        lastActiveDate: new Date(0),
      };
    }
  }

  /**
   * Daily check-in:
   * - If already checked in today → returns early with `alreadyCheckedIn: true`
   * - Consecutive day → increments streak
   * - Gap of 2+ days → resets streak to 1
   * - Awards coins = 5 + (currentStreak × 2)
   * - Auto-completes the "streak" category login task if it exists
   */
  async checkIn(userId: string) {
    const today = this.getStartOfTodayUtc();
    const yesterday = this.addDays(today, -1);

    const streak = await this.getStreak(userId);

    // Normalise lastActiveDate to UTC midnight for comparison
    const lastDate = new Date(streak.lastActiveDate);
    const lastDateUtc = new Date(
      Date.UTC(
        lastDate.getUTCFullYear(),
        lastDate.getUTCMonth(),
        lastDate.getUTCDate(),
      ),
    );

    // Already checked in today
    if (lastDateUtc.getTime() === today.getTime()) {
      return { alreadyCheckedIn: true, streak, coinsAwarded: 0 };
    }

    // Determine new streak value
    let newStreak: number;
    if (lastDateUtc.getTime() === yesterday.getTime()) {
      newStreak = streak.currentStreak + 1; // consecutive day
    } else {
      newStreak = 1; // broken streak — restart
    }

    const newLongest = Math.max(streak.longestStreak, newStreak);
    const coinsAwarded = 5 + newStreak * 2;

    const updatedStreak = await this.prisma.userStreak.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastActiveDate: today,
        totalCoins: { increment: coinsAwarded },
      },
    });

    // Auto-complete today's login/streak task if still pending
    await this.completeLoginTask(userId);

    // Async achievement check
    this.checkAndUnlockAchievements(userId).catch((err) =>
      this.logger.error(
        `Achievement check after check-in failed: ${String(err)}`,
      ),
    );

    this.logger.log(
      `Check-in for user: ${userId}, streak: ${newStreak}, coins: +${coinsAwarded}`,
    );
    return { alreadyCheckedIn: false, streak: updatedStreak, coinsAwarded };
  }

  // ─── Achievements ──────────────────────────────────────────────────────────

  /**
   * Return all achievements with an `unlocked` flag and `unlockedAt` timestamp
   * for the current user.
   */
  async getAchievements(userId: string) {
    const [achievements, userAchievements] = await Promise.all([
      this.prisma.achievement.findMany({ orderBy: { conditionValue: "asc" } }),
      this.prisma.userAchievement.findMany({ where: { userId } }),
    ]);

    const unlockedMap = new Map(
      userAchievements.map((ua) => [ua.achievementId, ua.unlockedAt]),
    );

    return achievements.map((a) => ({
      ...a,
      unlocked: unlockedMap.has(a.id),
      unlockedAt: unlockedMap.get(a.id) ?? null,
    }));
  }

  /**
   * Check all locked achievements against the user's current stats.
   * Unlocks qualifying achievements atomically and awards XP/coins.
   * Returns the array of newly-created UserAchievement records.
   */
  async checkAndUnlockAchievements(userId: string): Promise<UserAchievement[]> {
    const [
      pet,
      streak,
      totalTransactions,
      completedTasksCount,
      userAchievements,
    ] = await Promise.all([
      this.prisma.pet.findUnique({ where: { userId } }),
      this.prisma.userStreak.findUnique({ where: { userId } }),
      this.prisma.transaction.count({ where: { userId } }),
      this.prisma.dailyTask.count({
        where: { userId, status: TaskStatus.completed },
      }),
      this.prisma.userAchievement.findMany({ where: { userId } }),
    ]);

    const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));

    // Only fetch achievements the user hasn't unlocked yet
    const lockedAchievements = await this.prisma.achievement.findMany({
      where:
        unlockedIds.size > 0 ? { id: { notIn: Array.from(unlockedIds) } } : {},
    });

    if (lockedAchievements.length === 0) return [];

    // Evaluate each locked achievement
    const toUnlockIds: string[] = [];
    for (const achievement of lockedAchievements) {
      const { conditionType, conditionValue } = achievement;
      let qualifies = false;

      switch (conditionType) {
        case "streak_days":
          qualifies = (streak?.currentStreak ?? 0) >= conditionValue;
          break;
        case "longest_streak":
          qualifies = (streak?.longestStreak ?? 0) >= conditionValue;
          break;
        case "transactions_total":
          qualifies = totalTransactions >= conditionValue;
          break;
        case "pet_level":
          qualifies = (pet?.level ?? 0) >= conditionValue;
          break;
        case "tasks_completed":
          qualifies = completedTasksCount >= conditionValue;
          break;
        default:
          this.logger.warn(
            `Unknown achievement conditionType: ${conditionType}`,
          );
          break;
      }

      if (qualifies) toUnlockIds.push(achievement.id);
    }

    if (toUnlockIds.length === 0) return [];

    // Unlock atomically in a single transaction
    const newlyUnlocked = await this.prisma.$transaction(
      toUnlockIds.map((achievementId) =>
        this.prisma.userAchievement.create({
          data: { userId, achievementId },
          include: { achievement: true },
        }),
      ),
    );

    // Award XP and coins for each newly unlocked achievement
    let currentPet: XpSnapshot | null = pet
      ? { level: pet.level, xp: pet.xp, xpToNext: pet.xpToNext }
      : null;

    let totalCoinReward = 0;

    for (const ua of newlyUnlocked) {
      const { xpReward, coinReward } = ua.achievement;

      if (currentPet && xpReward > 0) {
        currentPet = this.addXpToPet(currentPet, xpReward);
      }

      if (coinReward > 0) {
        totalCoinReward += coinReward;
      }
    }

    // Flush pet XP changes in one update
    if (pet && currentPet) {
      await this.prisma.pet.update({
        where: { id: pet.id },
        data: {
          level: currentPet.level,
          xp: currentPet.xp,
          xpToNext: currentPet.xpToNext,
        },
      });
    }

    // Flush accumulated coin rewards in one update
    if (totalCoinReward > 0) {
      await this.awardCoins(userId, totalCoinReward);
    }

    this.logger.log(
      `Unlocked ${toUnlockIds.length} achievement(s) for user: ${userId}`,
    );

    return newlyUnlocked;
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  /**
   * Add XP to a pet snapshot, handling level-ups.
   * Each level-up: xp -= xpToNext, level++, xpToNext = floor(xpToNext × 1.5)
   */
  private addXpToPet(pet: XpSnapshot, xp: number): XpSnapshot {
    let { level, xpToNext } = pet;
    let currentXp = pet.xp + xp;

    while (currentXp >= xpToNext) {
      currentXp -= xpToNext;
      level++;
      xpToNext = Math.floor(xpToNext * 1.5);
    }

    return { level, xp: currentXp, xpToNext };
  }

  /**
   * Derive PetMood from the average of hunger and happiness.
   */
  private calculateMood(hunger: number, happiness: number): PetMood {
    const avg = (hunger + happiness) / 2;
    if (avg >= 80) return PetMood.excited;
    if (avg >= 60) return PetMood.happy;
    if (avg >= 40) return PetMood.neutral;
    if (avg >= 20) return PetMood.sad;
    return PetMood.hungry;
  }

  /**
   * Returns the current date at UTC midnight (00:00:00.000Z).
   * Used for `@db.Date` comparisons so behaviour is consistent regardless of server TZ.
   */
  private getStartOfTodayUtc(): Date {
    const now = new Date();
    return new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
  }

  /** Add `days` to a date (can be negative). Returns a new Date. */
  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
  }

  /**
   * Award XP to the user's pet. No-op if the user has no pet.
   */
  private async awardPetXp(userId: string, xpReward: number): Promise<void> {
    const pet = await this.prisma.pet.findUnique({ where: { userId } });
    if (!pet) return;

    const xpData = this.addXpToPet(pet, xpReward);
    await this.prisma.pet.update({
      where: { id: pet.id },
      data: { level: xpData.level, xp: xpData.xp, xpToNext: xpData.xpToNext },
    });
  }

  /**
   * Add coins to the user's streak wallet. Creates the wallet record if absent.
   */
  private async awardCoins(userId: string, coins: number): Promise<void> {
    await this.prisma.userStreak.upsert({
      where: { userId },
      create: {
        userId,
        totalCoins: coins,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: new Date(0),
      },
      update: { totalCoins: { increment: coins } },
    });
  }

  /**
   * Auto-complete the pending "streak" category daily task for today if one exists.
   * Called automatically during check-in.
   */
  private async completeLoginTask(userId: string): Promise<void> {
    const today = this.getStartOfTodayUtc();
    const tomorrow = this.addDays(today, 1);

    const loginTask = await this.prisma.dailyTask.findFirst({
      where: {
        userId,
        category: TaskCategory.streak,
        status: TaskStatus.pending,
        date: { gte: today, lt: tomorrow },
      },
    });

    if (!loginTask) return;

    await this.prisma.dailyTask.update({
      where: { id: loginTask.id },
      data: {
        status: TaskStatus.completed,
        completedAt: new Date(),
        progress: loginTask.targetValue ?? 1,
      },
    });
  }

  /**
   * Generate a fresh set of daily tasks for the user:
   * 3 randomly-selected tasks from the template pool + the mandatory login task.
   * All tasks expire at 23:59:59.999 UTC of the current day.
   */
  private async generateDailyTasks(userId: string): Promise<DailyTask[]> {
    const today = this.getStartOfTodayUtc();
    const tomorrow = this.addDays(today, 1);
    // Expire at 23:59:59.999 — one millisecond before tomorrow starts
    const expiresAt = new Date(tomorrow.getTime() - 1);

    const templates: TaskTemplate[] = [
      {
        title: "Ghi lại 1 giao dịch",
        description: "Ghi lại ít nhất 1 giao dịch trong ngày hôm nay",
        category: TaskCategory.tracking,
        xpReward: 10,
        coinReward: 5,
        targetValue: 1,
      },
      {
        title: "Ghi lại 3 giao dịch",
        description: "Ghi lại ít nhất 3 giao dịch trong ngày hôm nay",
        category: TaskCategory.tracking,
        xpReward: 25,
        coinReward: 10,
        targetValue: 3,
      },
      {
        title: "Chi tiêu dưới ngân sách",
        description: "Giữ chi tiêu trong giới hạn ngân sách ngày hôm nay",
        category: TaskCategory.spending,
        xpReward: 30,
        coinReward: 15,
        targetValue: 1,
      },
      {
        title: "Mở AI Coach hỏi 1 câu",
        description:
          "Đặt ít nhất 1 câu hỏi cho AI Coach để học thêm về tài chính",
        category: TaskCategory.learning,
        xpReward: 15,
        coinReward: 5,
        targetValue: 1,
      },
      {
        title: "Thiết lập mục tiêu tiết kiệm",
        description: "Xem lại hoặc cập nhật kế hoạch tiết kiệm của bạn",
        category: TaskCategory.saving,
        xpReward: 20,
        coinReward: 8,
        targetValue: 1,
      },
    ];

    const loginTask: TaskTemplate = {
      title: "Đăng nhập hôm nay",
      description: "Đăng nhập và kiểm tra tài chính của bạn hôm nay",
      category: TaskCategory.streak,
      xpReward: 5,
      coinReward: 2,
      targetValue: 1,
    };

    // Shuffle and pick 3 random templates
    const shuffled = [...templates].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3);
    const allTemplates = [...selected, loginTask];

    const created = await this.prisma.$transaction(
      allTemplates.map((t) =>
        this.prisma.dailyTask.create({
          data: {
            userId,
            title: t.title,
            description: t.description,
            category: t.category,
            status: TaskStatus.pending,
            xpReward: t.xpReward,
            coinReward: t.coinReward,
            targetValue: t.targetValue,
            progress: 0,
            date: today,
            expiresAt,
          },
        }),
      ),
    );

    this.logger.log(
      `Generated ${created.length} daily tasks for user: ${userId}`,
    );
    return created;
  }
}
