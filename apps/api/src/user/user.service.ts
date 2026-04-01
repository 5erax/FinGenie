import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { User, UserRole } from "@prisma/client";

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { firebaseUid } });
  }

  async updateProfile(
    id: string,
    data: { displayName?: string; avatarUrl?: string },
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async setRole(id: string, role: UserRole): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { role },
    });
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    role?: UserRole;
  }): Promise<{ users: User[]; total: number }> {
    const { page = 1, limit = 20, role } = params;
    const skip = (page - 1) * limit;
    const where = role ? { role } : {};

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  /** Aggregate counts for admin dashboard */
  async getAdminStats() {
    const [
      totalUsers,
      totalTransactions,
      totalWallets,
      activeSubscriptions,
      recentUsers,
      recentTransactions,
    ] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.transaction.count(),
      this.prisma.wallet.count(),
      this.prisma.subscription.count({
        where: { status: "active", plan: { not: "free" } },
      }),
      this.prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          displayName: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
      this.prisma.transaction.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          amount: true,
          type: true,
          date: true,
          note: true,
          category: { select: { name: true } },
          user: { select: { displayName: true } },
        },
      }),
    ]);

    return {
      totalUsers,
      totalTransactions,
      totalWallets,
      activeSubscriptions,
      recentUsers,
      recentTransactions: recentTransactions.map((tx) => ({
        id: tx.id,
        amount: tx.amount.toString(),
        type: tx.type,
        categoryName: tx.category.name,
        userName: tx.user.displayName,
        date: tx.date.toISOString(),
      })),
    };
  }
}
