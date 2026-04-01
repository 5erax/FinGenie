import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { AlertEvent } from '@prisma/client';
import { AlertType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { QueryAlertsDto } from './dto/query-alerts.dto';

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(
    userId: string,
    query: QueryAlertsDto,
  ): Promise<{ data: AlertEvent[]; total: number; page: number; limit: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(query.type !== undefined && { type: query.type }),
      ...(query.isRead !== undefined && { isRead: query.isRead }),
    };

    const [data, total] = await Promise.all([
      this.prisma.alertEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.alertEvent.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findById(userId: string, id: string): Promise<AlertEvent> {
    const alert = await this.prisma.alertEvent.findFirst({
      where: { id, userId },
    });

    if (!alert) throw new NotFoundException('Alert not found');
    return alert;
  }

  async create(data: { userId: string; type: AlertType; message: string }): Promise<AlertEvent> {
    const alert = await this.prisma.alertEvent.create({
      data: {
        userId: data.userId,
        type: data.type,
        message: data.message,
      },
    });

    this.logger.log(`Alert created: ${alert.id} (user: ${data.userId}, type: ${data.type})`);
    return alert;
  }

  async markAsRead(userId: string, id: string): Promise<AlertEvent> {
    await this.findById(userId, id);

    const alert = await this.prisma.alertEvent.update({
      where: { id },
      data: { isRead: true },
    });

    this.logger.log(`Alert marked as read: ${id} (user: ${userId})`);
    return alert;
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.alertEvent.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    this.logger.log(`Marked ${result.count} alerts as read (user: ${userId})`);
    return { count: result.count };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.alertEvent.count({
      where: { userId, isRead: false },
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findById(userId, id);
    await this.prisma.alertEvent.delete({ where: { id } });
    this.logger.log(`Alert deleted: ${id} (user: ${userId})`);
  }
}
