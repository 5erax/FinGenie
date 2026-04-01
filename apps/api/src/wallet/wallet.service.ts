import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Wallet } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateWalletDto } from './dto/create-wallet.dto';
import type { UpdateWalletDto } from './dto/update-wallet.dto';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: string) {
    return this.prisma.wallet.findMany({
      where: { userId },
      include: { _count: { select: { transactions: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(userId: string, id: string): Promise<Wallet> {
    const wallet = await this.prisma.wallet.findFirst({
      where: { id, userId },
    });

    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }

  async create(userId: string, dto: CreateWalletDto): Promise<Wallet> {
    const wallet = await this.prisma.wallet.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type,
        currency: dto.currency,
      },
    });

    this.logger.log(`Wallet created: ${wallet.id} (user: ${userId})`);
    return wallet;
  }

  async update(userId: string, id: string, dto: UpdateWalletDto): Promise<Wallet> {
    await this.findById(userId, id);

    const wallet = await this.prisma.wallet.update({
      where: { id },
      data: dto,
    });

    this.logger.log(`Wallet updated: ${id} (user: ${userId})`);
    return wallet;
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findById(userId, id);

    const transactionCount = await this.prisma.transaction.count({
      where: { walletId: id },
    });

    if (transactionCount > 0) {
      throw new BadRequestException('Cannot delete wallet with existing transactions');
    }

    await this.prisma.wallet.delete({ where: { id } });
    this.logger.log(`Wallet deleted: ${id} (user: ${userId})`);
  }

  async getBalance(userId: string, id: string) {
    const { balance, currency } = await this.findById(userId, id);
    return { balance, currency };
  }
}
