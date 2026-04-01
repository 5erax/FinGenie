import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export const PLAN_PRICING: Record<'monthly' | 'yearly', number> = {
  monthly: 79_000,
  yearly: 790_000,
};

const PLAN_DAYS: Record<'monthly' | 'yearly', number> = {
  monthly: 30,
  yearly: 365,
};

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find the active subscription for a user, including the 5 most recent
   * payment orders.
   */
  async getActiveSubscription(userId: string) {
    return this.prisma.subscription.findFirst({
      where: { userId, status: 'active' },
      include: {
        paymentOrders: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });
  }

  /**
   * Create a Subscription + PaymentOrder atomically.
   * endDate is calculated from the plan: monthly = +30 days, yearly = +365 days.
   */
  async createSubscriptionWithOrder(params: {
    userId: string;
    plan: 'monthly' | 'yearly';
    payosOrderId: string;
    amount: number;
  }) {
    const { userId, plan, payosOrderId, amount } = params;
    const days = PLAN_DAYS[plan];
    const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const result = await this.prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.create({
        data: {
          userId,
          plan,
          status: 'active',
          startDate: new Date(),
          endDate,
        },
      });

      const paymentOrder = await tx.paymentOrder.create({
        data: {
          userId,
          subscriptionId: subscription.id,
          payosOrderId,
          amount: new Prisma.Decimal(amount),
          status: 'pending',
        },
      });

      return { subscription, paymentOrder };
    });

    this.logger.log(
      `Subscription created: ${result.subscription.id} (user: ${userId}, plan: ${plan})`,
    );
    return result;
  }

  /**
   * Mark a payment as successful and grant premium access to the user.
   * Idempotent — safe to call multiple times for the same order.
   */
  async activatePremium(payosOrderId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.paymentOrder.findFirst({
        where: { payosOrderId },
        include: { subscription: true },
      });

      if (!order) {
        throw new NotFoundException(
          `PaymentOrder not found for payosOrderId: ${payosOrderId}`,
        );
      }

      // Idempotency guard — already processed successfully
      if (order.status === 'success') {
        this.logger.log(
          `activatePremium called on already-succeeded order: ${order.id}`,
        );
        return order;
      }

      const updatedOrder = await tx.paymentOrder.update({
        where: { id: order.id },
        data: { status: 'success' },
        include: { subscription: true },
      });

      await tx.user.update({
        where: { id: order.userId },
        data: { premiumUntil: order.subscription.endDate },
      });

      return updatedOrder;
    });

    this.logger.log(
      `Premium activated for order: ${result.id} (user: ${result.userId})`,
    );
    return result;
  }

  /**
   * Mark a payment order as failed and cancel the associated subscription.
   */
  async handlePaymentFailed(payosOrderId: string) {
    const order = await this.prisma.paymentOrder.findFirst({
      where: { payosOrderId },
    });

    if (!order) {
      this.logger.warn(
        `handlePaymentFailed: no order found for payosOrderId ${payosOrderId}`,
      );
      return null;
    }

    const [updatedOrder] = await this.prisma.$transaction([
      this.prisma.paymentOrder.update({
        where: { id: order.id },
        data: { status: 'failed' },
      }),
      this.prisma.subscription.update({
        where: { id: order.subscriptionId },
        data: { status: 'cancelled' },
      }),
    ]);

    this.logger.log(
      `Payment failed handled: order ${order.id}, subscription ${order.subscriptionId} cancelled`,
    );
    return updatedOrder;
  }

  /**
   * Return paginated payment history for a user, newest first.
   */
  async getPaymentHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.paymentOrder.findMany({
        where: { userId },
        include: { subscription: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.paymentOrder.count({ where: { userId } }),
    ]);

    return { data, total, page, limit };
  }

  /**
   * Check whether a user currently has premium access.
   * Also expires any active subscriptions whose endDate has passed.
   */
  async checkPremiumStatus(userId: string) {
    const now = new Date();

    // Expire overdue active subscriptions
    await this.prisma.subscription.updateMany({
      where: {
        userId,
        status: 'active',
        endDate: { lt: now },
      },
      data: { status: 'expired' },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { premiumUntil: true },
    });

    const isPremium = !!user?.premiumUntil && user.premiumUntil > now;

    return {
      isPremium,
      premiumUntil: user?.premiumUntil ?? null,
    };
  }

  /**
   * Persist a raw webhook event payload for auditing / replay.
   */
  async recordWebhookEvent(params: {
    payosOrderId: string;
    payload: any;
    signature: string;
  }) {
    const event = await this.prisma.paymentWebhookEvent.create({
      data: {
        payosOrderId: params.payosOrderId,
        payload: params.payload,
        signature: params.signature,
      },
    });

    this.logger.log(`Webhook event recorded: ${event.id} (order: ${params.payosOrderId})`);
    return event;
  }
}
