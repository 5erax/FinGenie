import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Content } from '@google/generative-ai';
import { MessageRole } from '@prisma/client';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from './gemini.service';
import { TransactionService } from '../transaction/transaction.service';
import { SavingPlanService } from '../saving-plan/saving-plan.service';
import { WalletService } from '../wallet/wallet.service';
import type { CreateSessionDto, SendMessageDto, QuerySessionsDto } from './dto';

const FREE_DAILY_LIMIT = 5;

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
    private readonly transactionService: TransactionService,
    private readonly savingPlanService: SavingPlanService,
    private readonly walletService: WalletService,
  ) {}

  // ─── Session CRUD ────────────────────────────────────────────────────────────

  async findAllSessions(userId: string, query: QuerySessionsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.aIChatSession.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.aIChatSession.count({ where: { userId } }),
    ]);

    return { data, total, page, limit };
  }

  async findSessionById(userId: string, sessionId: string) {
    const session = await this.prisma.aIChatSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!session) throw new NotFoundException('Chat session not found');
    return session;
  }

  async createSession(userId: string, dto: CreateSessionDto) {
    const session = await this.prisma.aIChatSession.create({
      data: {
        userId,
        title: dto.title ?? 'Cuộc trò chuyện mới',
      },
    });

    this.logger.log(`Session created: ${session.id} (user: ${userId})`);
    return session;
  }

  async deleteSession(userId: string, sessionId: string) {
    const session = await this.prisma.aIChatSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) throw new NotFoundException('Chat session not found');

    await this.prisma.aIChatSession.delete({ where: { id: sessionId } });
    this.logger.log(`Session deleted: ${sessionId} (user: ${userId})`);
  }

  // ─── Send Message ────────────────────────────────────────────────────────────

  async sendMessage(user: User, sessionId: string, dto: SendMessageDto) {
    // 1. Rate limit check
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayMessageCount = await this.prisma.aIMessage.count({
      where: {
        role: MessageRole.user,
        session: { userId: user.id },
        createdAt: { gte: startOfDay },
      },
    });

    const isPremium =
      user.premiumUntil && new Date(user.premiumUntil) > new Date();

    if (!isPremium && todayMessageCount >= FREE_DAILY_LIMIT) {
      throw new ForbiddenException(
        'Bạn đã hết lượt tin nhắn miễn phí hôm nay. Nâng cấp Premium để chat không giới hạn! 🌟',
      );
    }

    // 2. Find session (ownership check) with existing messages
    const session = await this.findSessionById(user.id, sessionId);

    // 3. Save user message
    const userMessage = await this.prisma.aIMessage.create({
      data: {
        sessionId,
        role: MessageRole.user,
        content: dto.content,
      },
    });

    // 4. Build financial context
    const financialContext = await this.buildFinancialContext(user.id);

    // 5. Convert existing messages to Gemini Content[] format (skip system)
    const history: Content[] = session.messages
      .filter((m) => m.role !== MessageRole.system)
      .map((m) => ({
        role: m.role === MessageRole.assistant ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    // 6. Call Gemini
    const aiResponse = await this.geminiService.chat(
      history,
      dto.content,
      financialContext,
    );

    // 7. Save assistant message
    const assistantMessage = await this.prisma.aIMessage.create({
      data: {
        sessionId,
        role: MessageRole.assistant,
        content: aiResponse,
      },
    });

    // 8. Touch session updatedAt so list stays ordered correctly
    await this.prisma.aIChatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });

    this.logger.log(
      `Message sent in session ${sessionId} (user: ${user.id})`,
    );

    return { userMessage, assistantMessage };
  }

  // ─── Status ──────────────────────────────────────────────────────────────────

  async getStatus(user: User) {
    const isPremium = !!(
      user.premiumUntil && new Date(user.premiumUntil) > new Date()
    );
    const todayMessages = await this.getTodayMessageCount(user.id);

    return {
      available: this.geminiService.isAvailable,
      todayMessages,
      dailyLimit: isPremium ? null : FREE_DAILY_LIMIT,
      isPremium,
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  async getTodayMessageCount(userId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return this.prisma.aIMessage.count({
      where: {
        role: MessageRole.user,
        session: { userId },
        createdAt: { gte: startOfDay },
      },
    });
  }

  private async buildFinancialContext(userId: string): Promise<string> {
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [wallets, summary, savingPlan] = await Promise.all([
        this.walletService.findAllByUser(userId),
        this.transactionService.getSummary(userId, {
          startDate: firstDayOfMonth.toISOString(),
          endDate: now.toISOString(),
        }),
        this.savingPlanService.findByUser(userId),
      ]);

      const lines: string[] = [];

      // Wallets
      lines.push('## Ví của tôi:');
      if (wallets.length === 0) {
        lines.push('- Chưa có ví nào');
      } else {
        for (const w of wallets) {
          lines.push(
            `- ${w.name} (${w.type}): ${w.balance.toString()} ${w.currency}`,
          );
        }
      }

      // Transaction summary for current month
      lines.push('\n## Giao dịch tháng này:');
      lines.push(`- Thu nhập: ${summary.totalIncome.toString()} VND`);
      lines.push(`- Chi tiêu: ${summary.totalExpense.toString()} VND`);
      lines.push(`- Còn lại (net): ${summary.net.toString()} VND`);
      lines.push(`- Tổng số giao dịch: ${summary.count}`);

      // Saving plan
      if (savingPlan) {
        lines.push('\n## Kế hoạch tiết kiệm:');
        lines.push(
          `- Thu nhập hàng tháng: ${savingPlan.monthlyIncome.toString()} VND`,
        );
        lines.push(
          `- Chi cố định: ${savingPlan.fixedExpenses.toString()} VND`,
        );
        lines.push(
          `- Chi biến động: ${savingPlan.variableExpenses.toString()} VND`,
        );
        lines.push(`- Tỷ lệ tiết kiệm: ${savingPlan.savingPercent}%`);
        lines.push(
          `- Ngân sách hàng ngày: ${savingPlan.dailyBudget.toString()} VND`,
        );
        lines.push(
          `- Tiền an toàn: ${savingPlan.safeMoney.toString()} VND`,
        );
      } else {
        lines.push('\n## Kế hoạch tiết kiệm: Chưa thiết lập');
      }

      return lines.join('\n');
    } catch (error) {
      this.logger.warn(
        `Failed to build financial context for user ${userId}: ${String(error)}`,
      );
      return '';
    }
  }
}
