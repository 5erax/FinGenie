import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FirebaseAdminService } from "../firebase/firebase-admin.service";
import type { User, UserRole } from "@prisma/client";
import { Prisma } from "@prisma/client";

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly firebase: FirebaseAdminService,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async findByIdFull(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        premiumUntil: true,
        firebaseUid: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { transactions: true, wallets: true } },
      },
    });
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

  async deleteUser(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    await this.prisma.user.delete({ where: { id } });
  }

  /**
   * Delete own account: removes all user data from DB and Firebase Auth.
   * Called by the user themselves (not admin).
   */
  async deleteSelf(id: string, firebaseUid: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");

    // Delete from database (cascading deletes will handle related records)
    await this.prisma.user.delete({ where: { id } });
    this.logger.log(`User ${id} deleted from database`);

    // Delete from Firebase Auth
    try {
      await this.firebase.deleteUser(firebaseUid);
      this.logger.log(`Firebase user ${firebaseUid} deleted`);
    } catch (err: unknown) {
      // Log but don't fail — DB record is already deleted
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Failed to delete Firebase user ${firebaseUid}: ${message}`,
      );
    }
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    role?: UserRole;
    search?: string;
  }) {
    const { page = 1, limit = 20, role, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          phone: true,
          displayName: true,
          avatarUrl: true,
          role: true,
          premiumUntil: true,
          firebaseUid: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { transactions: true, wallets: true } },
        },
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
    ] = await Promise.all([
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
