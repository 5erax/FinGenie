import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateTransactionDto } from './dto/create-transaction.dto';
import type { UpdateTransactionDto } from './dto/update-transaction.dto';
import type { QueryTransactionsDto } from './dto/query-transactions.dto';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: string, query: QueryTransactionsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.TransactionWhereInput = { userId };

    if (query.walletId) {
      const wallet = await this.prisma.wallet.findFirst({
        where: { id: query.walletId, userId },
      });
      if (!wallet) throw new NotFoundException('Wallet not found');
      where.walletId = query.walletId;
    }

    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.type) where.type = query.type;

    if (query.startDate || query.endDate) {
      where.date = {
        ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
        ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
      };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        include: { wallet: true, category: true },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findById(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
      include: { wallet: true, category: true },
    });

    if (!transaction) throw new NotFoundException('Transaction not found');
    return transaction;
  }

  async create(userId: string, dto: CreateTransactionDto) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { id: dto.walletId, userId },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const category = await this.prisma.category.findFirst({
      where: {
        id: dto.categoryId,
        OR: [{ userId }, { isDefault: true }],
      },
    });
    if (!category) throw new NotFoundException('Category not found');

    const amount = new Prisma.Decimal(dto.amount);

    const transaction = await this.prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          walletId: dto.walletId,
          userId,
          amount,
          type: dto.type,
          categoryId: dto.categoryId,
          note: dto.note,
          date: new Date(dto.date),
        },
        include: { wallet: true, category: true },
      });

      const newBalance =
        dto.type === TransactionType.income
          ? wallet.balance.add(amount)
          : wallet.balance.sub(amount);

      await tx.wallet.update({
        where: { id: dto.walletId },
        data: { balance: newBalance },
      });

      return created;
    });

    this.logger.log(`Transaction created: ${transaction.id} (user: ${userId})`);
    return transaction;
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    const existing = await this.findById(userId, id);

    const needsBalanceUpdate =
      dto.amount !== undefined || dto.type !== undefined;

    const transactionData: Prisma.TransactionUpdateInput = {
      ...(dto.amount !== undefined
        ? { amount: new Prisma.Decimal(dto.amount) }
        : {}),
      ...(dto.type !== undefined ? { type: dto.type } : {}),
      ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
      ...(dto.note !== undefined ? { note: dto.note } : {}),
      ...(dto.date !== undefined ? { date: new Date(dto.date) } : {}),
    };

    if (!needsBalanceUpdate) {
      const updated = await this.prisma.transaction.update({
        where: { id },
        data: transactionData,
        include: { wallet: true, category: true },
      });
      this.logger.log(`Transaction updated: ${id} (user: ${userId})`);
      return updated;
    }

    const wallet = await this.prisma.wallet.findFirst({
      where: { id: existing.walletId },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const oldAmount = existing.amount;
    const newAmount =
      dto.amount !== undefined ? new Prisma.Decimal(dto.amount) : existing.amount;
    const newType = dto.type ?? existing.type;

    const updated = await this.prisma.$transaction(async (tx) => {
      // Reverse old balance effect
      let newBalance =
        existing.type === TransactionType.income
          ? wallet.balance.sub(oldAmount)
          : wallet.balance.add(oldAmount);

      // Apply new balance effect
      newBalance =
        newType === TransactionType.income
          ? newBalance.add(newAmount)
          : newBalance.sub(newAmount);

      await tx.wallet.update({
        where: { id: existing.walletId },
        data: { balance: newBalance },
      });

      return tx.transaction.update({
        where: { id },
        data: transactionData,
        include: { wallet: true, category: true },
      });
    });

    this.logger.log(`Transaction updated: ${id} (user: ${userId})`);
    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.findById(userId, id);

    const wallet = await this.prisma.wallet.findFirst({
      where: { id: existing.walletId },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const amount = existing.amount;

    await this.prisma.$transaction(async (tx) => {
      const newBalance =
        existing.type === TransactionType.income
          ? wallet.balance.sub(amount)
          : wallet.balance.add(amount);

      await tx.wallet.update({
        where: { id: existing.walletId },
        data: { balance: newBalance },
      });

      await tx.transaction.delete({ where: { id } });
    });

    this.logger.log(`Transaction deleted: ${id} (user: ${userId})`);
  }

  async getSummary(
    userId: string,
    query: { walletId?: string; startDate?: string; endDate?: string },
  ) {
    const where: Prisma.TransactionWhereInput = { userId };

    if (query.walletId) {
      const wallet = await this.prisma.wallet.findFirst({
        where: { id: query.walletId, userId },
      });
      if (!wallet) throw new NotFoundException('Wallet not found');
      where.walletId = query.walletId;
    }

    if (query.startDate || query.endDate) {
      where.date = {
        ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
        ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
      };
    }

    const groups = await this.prisma.transaction.groupBy({
      by: ['type'],
      where,
      _sum: { amount: true },
      _count: { _all: true },
    });

    let totalIncome = new Prisma.Decimal(0);
    let totalExpense = new Prisma.Decimal(0);
    let count = 0;

    for (const group of groups) {
      const sum = group._sum.amount ?? new Prisma.Decimal(0);
      if (group.type === TransactionType.income) {
        totalIncome = new Prisma.Decimal(sum.toString());
      } else {
        totalExpense = new Prisma.Decimal(sum.toString());
      }
      count += group._count._all;
    }

    return {
      totalIncome,
      totalExpense,
      net: totalIncome.sub(totalExpense),
      count,
    };
  }
}
