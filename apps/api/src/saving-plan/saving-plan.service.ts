import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Prisma, SafeMoneyMode, TransactionType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateSavingPlanDto } from "./dto/create-saving-plan.dto";
import type { UpdateSavingPlanDto } from "./dto/update-saving-plan.dto";
import type { UpsertSafeMoneyDto } from "./dto/upsert-safe-money.dto";

@Injectable()
export class SavingPlanService {
  private readonly logger = new Logger(SavingPlanService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Public Methods ─────────────────────────────────────────────────────────

  async findByUser(userId: string) {
    return this.prisma.savingPlan.findFirst({
      where: { userId },
      include: { safeMoneyConfig: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.savingPlan.findMany({
      where: { userId },
      include: { safeMoneyConfig: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(userId: string, id: string) {
    const plan = await this.prisma.savingPlan.findFirst({
      where: { id, userId },
      include: { safeMoneyConfig: true },
    });

    if (!plan) throw new NotFoundException("Saving plan not found");
    return plan;
  }

  async create(userId: string, dto: CreateSavingPlanDto) {
    const { dailyBudget, safeMoney } = this.calculatePlan(
      dto.monthlyIncome,
      dto.fixedExpenses,
      dto.variableExpenses,
      dto.savingPercent,
    );

    const plan = await this.prisma.savingPlan.create({
      data: {
        userId,
        monthlyIncome: new Prisma.Decimal(dto.monthlyIncome),
        fixedExpenses: new Prisma.Decimal(dto.fixedExpenses),
        variableExpenses: new Prisma.Decimal(dto.variableExpenses),
        savingPercent: dto.savingPercent,
        dailyBudget,
        safeMoney,
      },
      include: { safeMoneyConfig: true },
    });

    this.logger.log(`SavingPlan created: ${plan.id} (user: ${userId})`);
    return plan;
  }

  async update(userId: string, id: string, dto: UpdateSavingPlanDto) {
    const plan = await this.findById(userId, id);

    const monthlyIncome = dto.monthlyIncome ?? Number(plan.monthlyIncome);
    const fixedExpenses = dto.fixedExpenses ?? Number(plan.fixedExpenses);
    const variableExpenses =
      dto.variableExpenses ?? Number(plan.variableExpenses);
    const savingPercent = dto.savingPercent ?? plan.savingPercent;

    const { dailyBudget, safeMoney } = this.calculatePlan(
      monthlyIncome,
      fixedExpenses,
      variableExpenses,
      savingPercent,
    );

    const updated = await this.prisma.savingPlan.update({
      where: { id },
      data: {
        ...(dto.monthlyIncome !== undefined && {
          monthlyIncome: new Prisma.Decimal(dto.monthlyIncome),
        }),
        ...(dto.fixedExpenses !== undefined && {
          fixedExpenses: new Prisma.Decimal(dto.fixedExpenses),
        }),
        ...(dto.variableExpenses !== undefined && {
          variableExpenses: new Prisma.Decimal(dto.variableExpenses),
        }),
        ...(dto.savingPercent !== undefined && {
          savingPercent: dto.savingPercent,
        }),
        dailyBudget,
        safeMoney,
      },
      include: { safeMoneyConfig: true },
    });

    this.logger.log(`SavingPlan updated: ${id} (user: ${userId})`);
    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findById(userId, id);

    await this.prisma.savingPlan.delete({ where: { id } });
    this.logger.log(`SavingPlan deleted: ${id} (user: ${userId})`);
  }

  async upsertSafeMoneyConfig(
    userId: string,
    planId: string,
    dto: UpsertSafeMoneyDto,
  ) {
    const plan = await this.findById(userId, planId);

    const sensitivity = dto.sensitivity ?? 50;

    let threshold: Prisma.Decimal;
    if (dto.threshold !== undefined) {
      threshold = new Prisma.Decimal(dto.threshold);
    } else {
      threshold = this.calculateThreshold(
        plan.dailyBudget,
        dto.mode,
        sensitivity,
      );
    }

    const config = await this.prisma.safeMoneyConfig.upsert({
      where: { savingPlanId: planId },
      update: {
        mode: dto.mode,
        sensitivity,
        threshold,
      },
      create: {
        savingPlanId: planId,
        mode: dto.mode,
        sensitivity,
        threshold,
      },
    });

    this.logger.log(
      `SafeMoneyConfig upserted for plan: ${planId} (user: ${userId})`,
    );
    return config;
  }

  async checkSpendingAlert(userId: string, planId: string) {
    const plan = await this.findById(userId, planId);

    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    );

    const aggregate = await this.prisma.transaction.aggregate({
      where: {
        userId,
        type: TransactionType.expense,
        date: { gte: startOfDay, lt: endOfDay },
      },
      _sum: { amount: true },
    });

    const todaySpent = aggregate._sum.amount ?? new Prisma.Decimal(0);
    const dailyBudget = plan.dailyBudget;
    const remaining = dailyBudget.sub(todaySpent);
    const safeMoney = plan.safeMoney;
    const isOverBudget = todaySpent.greaterThan(dailyBudget);

    let isNearThreshold = false;
    if (plan.safeMoneyConfig) {
      isNearThreshold = todaySpent.greaterThan(plan.safeMoneyConfig.threshold);
    }

    return {
      todaySpent,
      dailyBudget,
      remaining,
      safeMoney,
      isOverBudget,
      isNearThreshold,
    };
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  private calculatePlan(
    monthlyIncome: number,
    fixedExpenses: number,
    variableExpenses: number,
    savingPercent: number,
  ): { dailyBudget: Prisma.Decimal; safeMoney: Prisma.Decimal } {
    const now = new Date();
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();
    const daysInMonthD = new Prisma.Decimal(daysInMonth);

    const inc = new Prisma.Decimal(monthlyIncome);
    const fix = new Prisma.Decimal(fixedExpenses);
    const vari = new Prisma.Decimal(variableExpenses);
    const savPct = new Prisma.Decimal(savingPercent);
    const hundred = new Prisma.Decimal(100);
    const one = new Prisma.Decimal(1);

    // available = income - fixedExpenses - variableExpenses
    const available = inc.minus(fix).minus(vari);

    // savings = available × (savingPercent / 100)
    const savings = available.times(savPct.dividedBy(hundred));

    // dailyBudget = (available - savings) / daysInMonth
    const dailyBudget = available.minus(savings).dividedBy(daysInMonthD);

    // safeMoney = dailyBudget × daysInMonth × (1 - savingPercent/100)
    const safeMoney = dailyBudget
      .times(daysInMonthD)
      .times(one.minus(savPct.dividedBy(hundred)));

    return { dailyBudget, safeMoney };
  }

  private calculateThreshold(
    dailyBudget: Prisma.Decimal,
    mode: SafeMoneyMode,
    sensitivity: number,
  ): Prisma.Decimal {
    if (mode === SafeMoneyMode.basic) {
      // Basic mode: 3-day buffer
      return dailyBudget.times(new Prisma.Decimal(3));
    }

    // Advanced mode: dailyBudget × (sensitivity / 10)
    return dailyBudget.times(
      new Prisma.Decimal(sensitivity).dividedBy(new Prisma.Decimal(10)),
    );
  }
}
