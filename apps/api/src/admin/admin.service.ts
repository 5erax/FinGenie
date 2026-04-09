import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma, ReviewStatus } from "@prisma/client";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Transactions ──────────────────────────────────────────

  async findAllTransactions(params: {
    page?: number;
    limit?: number;
    type?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { page = 1, limit = 20, type, userId, startDate, endDate } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.TransactionWhereInput = {};
    if (type && (type === "income" || type === "expense")) {
      where.type = type;
    }
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          amount: true,
          type: true,
          note: true,
          date: true,
          createdAt: true,
          category: {
            select: { id: true, name: true, icon: true, color: true },
          },
          wallet: { select: { id: true, name: true, type: true } },
          user: {
            select: { id: true, displayName: true, email: true },
          },
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: transactions.map((tx) => ({
        ...tx,
        amount: Number(tx.amount),
        date: tx.date.toISOString(),
        createdAt: tx.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  // ── Wallets ───────────────────────────────────────────────

  async findAllWallets(params: {
    page?: number;
    limit?: number;
    type?: string;
    userId?: string;
  }) {
    const { page = 1, limit = 20, type, userId } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.WalletWhereInput = {};
    if (type && ["cash", "bank", "e_wallet", "other"].includes(type)) {
      where.type = type as Prisma.EnumWalletTypeFilter["equals"];
    }
    if (userId) where.userId = userId;

    const [wallets, total] = await Promise.all([
      this.prisma.wallet.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          type: true,
          balance: true,
          currency: true,
          createdAt: true,
          user: {
            select: { id: true, displayName: true, email: true },
          },
          _count: { select: { transactions: true } },
        },
      }),
      this.prisma.wallet.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: wallets.map((w) => ({
        ...w,
        balance: Number(w.balance),
        createdAt: w.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  // ── Categories ────────────────────────────────────────────

  async findAllCategories(params: {
    page?: number;
    limit?: number;
    isDefault?: string;
  }) {
    const { page = 1, limit = 50, isDefault } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.CategoryWhereInput = {};
    if (isDefault === "true") where.isDefault = true;
    else if (isDefault === "false") where.isDefault = false;

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          icon: true,
          color: true,
          isDefault: true,
          userId: true,
          _count: { select: { transactions: true } },
        },
      }),
      this.prisma.category.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: categories,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async createCategory(data: {
    name: string;
    icon: string;
    color: string;
    isDefault?: boolean;
  }) {
    return this.prisma.category.create({
      data: {
        name: data.name,
        icon: data.icon,
        color: data.color,
        isDefault: data.isDefault ?? true,
      },
      select: {
        id: true,
        name: true,
        icon: true,
        color: true,
        isDefault: true,
        userId: true,
        _count: { select: { transactions: true } },
      },
    });
  }

  async updateCategory(
    id: string,
    data: { name?: string; icon?: string; color?: string },
  ) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Category not found");

    return this.prisma.category.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        icon: true,
        color: true,
        isDefault: true,
        userId: true,
        _count: { select: { transactions: true } },
      },
    });
  }

  async deleteCategory(id: string) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { transactions: true } } },
    });
    if (!existing) throw new NotFoundException("Category not found");

    await this.prisma.category.delete({ where: { id } });
  }

  // ── Subscriptions ─────────────────────────────────────────

  async findAllSubscriptions(params: {
    page?: number;
    limit?: number;
    status?: string;
    plan?: string;
  }) {
    const { page = 1, limit = 20, status, plan } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.SubscriptionWhereInput = {};
    if (status && ["active", "cancelled", "expired"].includes(status)) {
      where.status = status as Prisma.EnumSubscriptionStatusFilter["equals"];
    }
    if (plan && ["free", "monthly", "yearly"].includes(plan)) {
      where.plan = plan as Prisma.EnumSubscriptionPlanFilter["equals"];
    }

    const [subscriptions, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          plan: true,
          status: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          user: {
            select: { id: true, displayName: true, email: true },
          },
        },
      }),
      this.prisma.subscription.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: subscriptions.map((s) => ({
        ...s,
        startDate: s.startDate.toISOString(),
        endDate: s.endDate?.toISOString() ?? null,
        createdAt: s.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  // ── Payments ──────────────────────────────────────────────

  async findAllPayments(params: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const { page = 1, limit = 20, status } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentOrderWhereInput = {};
    if (
      status &&
      ["pending", "success", "failed", "cancelled"].includes(status)
    ) {
      where.status = status as Prisma.EnumPaymentStatusFilter["equals"];
    }

    const [payments, total] = await Promise.all([
      this.prisma.paymentOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          stripeSessionId: true,
          amount: true,
          status: true,
          createdAt: true,
          user: {
            select: { id: true, displayName: true, email: true },
          },
          subscription: { select: { id: true, plan: true } },
        },
      }),
      this.prisma.paymentOrder.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
        createdAt: p.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  // ── Gamification: Pets ────────────────────────────────────

  async findAllPets(params: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const [pets, total] = await Promise.all([
      this.prisma.pet.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          type: true,
          level: true,
          xp: true,
          mood: true,
          hunger: true,
          happiness: true,
          user: {
            select: { id: true, displayName: true, email: true },
          },
        },
      }),
      this.prisma.pet.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: pets,
      total,
      page,
      limit,
      totalPages,
    };
  }

  // ── Gamification: Achievements ────────────────────────────

  async findAllAchievements() {
    return this.prisma.achievement.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
        icon: true,
        xpReward: true,
        coinReward: true,
        conditionType: true,
        conditionValue: true,
        _count: { select: { users: true } },
      },
    });
  }

  // ── AI Chat Sessions ──────────────────────────────────────

  async findAllAIChatSessions(params: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      this.prisma.aIChatSession.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          createdAt: true,
          user: {
            select: { id: true, displayName: true, email: true },
          },
          _count: { select: { messages: true } },
        },
      }),
      this.prisma.aIChatSession.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: sessions.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getAIChatStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, thisMonth] = await Promise.all([
      this.prisma.aIChatSession.count(),
      this.prisma.aIChatSession.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
    ]);

    return { total, thisMonth };
  }

  // ── Analytics ─────────────────────────────────────────────

  async getAnalytics(period: string = "30d") {
    const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [userGrowth, transactionVolume, revenueByMonth, topCategories] =
      await Promise.all([
        this.getUserGrowth(since),
        this.getTransactionVolume(since),
        this.getRevenueByMonth(),
        this.getTopCategories(since),
      ]);

    return { userGrowth, transactionVolume, revenueByMonth, topCategories };
  }

  private async getUserGrowth(since: Date) {
    const result = await this.prisma.$queryRaw<{ date: Date; count: bigint }[]>`
      SELECT DATE("createdAt") as date, COUNT(*)::bigint as count
      FROM users
      WHERE "createdAt" >= ${since}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    return result.map((r) => ({
      date: r.date.toISOString().split("T")[0],
      count: Number(r.count),
    }));
  }

  private async getTransactionVolume(since: Date) {
    const result = await this.prisma.$queryRaw<
      { date: Date; income: string; expense: string }[]
    >`
      SELECT
        "date",
        COALESCE(SUM(CASE WHEN "type" = 'income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN "type" = 'expense' THEN amount ELSE 0 END), 0) as expense
      FROM transactions
      WHERE "date" >= ${since}::date
      GROUP BY "date"
      ORDER BY "date" ASC
    `;

    return result.map((r) => ({
      date: r.date.toISOString().split("T")[0],
      income: Number(r.income),
      expense: Number(r.expense),
    }));
  }

  private async getRevenueByMonth() {
    const result = await this.prisma.$queryRaw<
      { month: string; revenue: string }[]
    >`
      SELECT
        TO_CHAR("createdAt", 'YYYY-MM') as month,
        COALESCE(SUM(amount), 0) as revenue
      FROM payment_orders
      WHERE status = 'success'
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
      ORDER BY month ASC
      LIMIT 12
    `;

    return result.map((r) => ({
      month: r.month,
      revenue: Number(r.revenue),
    }));
  }

  private async getTopCategories(since: Date) {
    const result = await this.prisma.$queryRaw<
      { name: string; count: bigint; total: string }[]
    >`
      SELECT
        c."name",
        COUNT(*)::bigint as count,
        COALESCE(SUM(t."amount"), 0) as total
      FROM transactions t
      JOIN categories c ON t."categoryId" = c."id"
      WHERE t."date" >= ${since}::date
      GROUP BY c."name"
      ORDER BY count DESC
      LIMIT 10
    `;

    return result.map((r) => ({
      name: r.name,
      count: Number(r.count),
      total: Number(r.total),
    }));
  }

  // ── Reviews ─────────────────────────────────────────────

  async findAllReviews(params: {
    page?: number;
    limit?: number;
    status?: string;
    isFeatured?: string;
  }) {
    const { page = 1, limit = 20, status, isFeatured } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ReviewWhereInput = {};
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      where.status = status as ReviewStatus;
    }
    if (isFeatured === "true") where.isFeatured = true;
    else if (isFeatured === "false") where.isFeatured = false;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          rating: true,
          content: true,
          status: true,
          isFeatured: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              displayName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: reviews.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getReviewStats() {
    const [total, pending, approved, rejected, featured, avgResult] =
      await Promise.all([
        this.prisma.review.count(),
        this.prisma.review.count({ where: { status: "pending" } }),
        this.prisma.review.count({ where: { status: "approved" } }),
        this.prisma.review.count({ where: { status: "rejected" } }),
        this.prisma.review.count({ where: { isFeatured: true } }),
        this.prisma.review.aggregate({ _avg: { rating: true } }),
      ]);

    return {
      total,
      pending,
      approved,
      rejected,
      featured,
      averageRating: avgResult._avg.rating ?? 0,
    };
  }

  async updateReviewStatus(id: string, status: ReviewStatus) {
    const existing = await this.prisma.review.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Review not found");

    return this.prisma.review.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        rating: true,
        content: true,
        status: true,
        isFeatured: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: { id: true, displayName: true, email: true, avatarUrl: true },
        },
      },
    });
  }

  async toggleReviewFeatured(id: string, isFeatured: boolean) {
    const existing = await this.prisma.review.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Review not found");

    return this.prisma.review.update({
      where: { id },
      data: { isFeatured },
      select: {
        id: true,
        rating: true,
        content: true,
        status: true,
        isFeatured: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: { id: true, displayName: true, email: true, avatarUrl: true },
        },
      },
    });
  }

  // ── User Ban / Restore ────────────────────────────────────

  async banUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");

    return this.prisma.user.update({
      where: { id },
      data: { status: "banned" },
      select: {
        id: true,
        email: true,
        displayName: true,
        status: true,
      },
    });
  }

  async restoreUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");

    return this.prisma.user.update({
      where: { id },
      data: { status: "active" },
      select: {
        id: true,
        email: true,
        displayName: true,
        status: true,
      },
    });
  }

  // ── System Info ───────────────────────────────────────────

  async getSystemInfo() {
    const mem = process.memoryUsage();
    const uptime = process.uptime();

    // Check DB connectivity
    let dbStatus = "ok";
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = "error";
    }

    // Get counts for overview
    const [userCount, transactionCount, reviewCount] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.transaction.count(),
      this.prisma.review.count(),
    ]);

    return {
      api: { status: "ok", uptime: Math.floor(uptime) },
      database: { status: dbStatus },
      memory: {
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
        rss: Math.round(mem.rss / 1024 / 1024),
      },
      node: { version: process.version },
      counts: {
        users: userCount,
        transactions: transactionCount,
        reviews: reviewCount,
      },
    };
  }
}
