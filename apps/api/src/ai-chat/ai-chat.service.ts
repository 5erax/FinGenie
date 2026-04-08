import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import type { Content } from "@google/generative-ai";
import { MessageRole, TaskCategory } from "@prisma/client";
import type { User } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { GeminiService } from "./gemini.service";
import { TransactionService } from "../transaction/transaction.service";
import { SavingPlanService } from "../saving-plan/saving-plan.service";
import { WalletService } from "../wallet/wallet.service";
import { GamificationService } from "../gamification/gamification.service";
import type { CreateSessionDto, SendMessageDto, QuerySessionsDto } from "./dto";

const FREE_DAILY_LIMIT = 5;
const MAX_HISTORY_MESSAGES = 20; // Limit conversation history to control token usage

// ─── Simple TTL cache ──────────────────────────────────────────────────────────

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class TtlCache<T> {
  private store = new Map<string, CacheEntry<T>>();

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }
}

// Cache TTLs
const PREMIUM_CACHE_TTL = 60_000; // 60s — short because premium changes matter
const FINANCIAL_CONTEXT_CACHE_TTL = 300_000; // 5 min — data doesn't change mid-conversation

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);
  private readonly premiumCache = new TtlCache<boolean>();
  private readonly financialContextCache = new TtlCache<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
    private readonly transactionService: TransactionService,
    private readonly savingPlanService: SavingPlanService,
    private readonly walletService: WalletService,
    private readonly gamificationService: GamificationService,
  ) {}

  // ─── Session CRUD ────────────────────────────────────────────────────────────

  async findAllSessions(userId: string, query: QuerySessionsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.aIChatSession.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
        include: {
          _count: { select: { messages: true } },
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
            select: { content: true, createdAt: true },
          },
        },
      }),
      this.prisma.aIChatSession.count({ where: { userId } }),
    ]);

    return { data, total, page, limit };
  }

  async findSessionById(userId: string, sessionId: string) {
    const session = await this.prisma.aIChatSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!session) throw new NotFoundException("Chat session not found");
    return session;
  }

  async createSession(userId: string, dto: CreateSessionDto) {
    const session = await this.prisma.aIChatSession.create({
      data: {
        userId,
        title: dto.title ?? "Cuộc trò chuyện mới",
      },
    });

    this.logger.log(`Session created: ${session.id} (user: ${userId})`);
    return session;
  }

  async deleteSession(userId: string, sessionId: string) {
    const session = await this.prisma.aIChatSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) throw new NotFoundException("Chat session not found");

    await this.prisma.aIChatSession.delete({ where: { id: sessionId } });
    this.logger.log(`Session deleted: ${sessionId} (user: ${userId})`);
  }

  // ─── Send Message ────────────────────────────────────────────────────────────

  async sendMessage(user: User, sessionId: string, dto: SendMessageDto) {
    // 1. Rate limit check — query fresh premium status from DB
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayMessageCount = await this.prisma.aIMessage.count({
      where: {
        role: MessageRole.user,
        session: { userId: user.id },
        createdAt: { gte: startOfDay },
      },
    });

    const isPremium = await this.checkFreshPremiumStatus(user.id);

    if (!isPremium && todayMessageCount >= FREE_DAILY_LIMIT) {
      throw new ForbiddenException(
        "Bạn đã hết lượt tin nhắn miễn phí hôm nay. Nâng cấp Premium để chat không giới hạn! 🌟",
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

    // 5. Convert existing messages to Gemini Content[] format (skip system, trim to limit)
    const relevantMessages = session.messages
      .filter((m) => m.role !== MessageRole.system)
      .slice(-MAX_HISTORY_MESSAGES);
    const history: Content[] = relevantMessages.map((m) => ({
      role: m.role === MessageRole.assistant ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // 6. Call Gemini (with availability check and error handling)
    if (!this.geminiService.isAvailable) {
      throw new ServiceUnavailableException(
        "AI Coach hiện không khả dụng. Vui lòng thử lại sau.",
      );
    }

    let aiResponse: string;
    try {
      aiResponse = await this.geminiService.chat(
        history,
        dto.content,
        financialContext,
      );
    } catch (error) {
      this.logger.error(
        `Gemini API error in session ${sessionId}: ${String(error)}`,
      );
      aiResponse =
        "⚠️ AI Coach tạm thời gặp sự cố. Vui lòng thử lại sau ít phút.";
    }

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

    this.logger.log(`Message sent in session ${sessionId} (user: ${user.id})`);

    // Auto-progress daily quest: "Mở AI Coach hỏi 1 câu" (learning)
    this.gamificationService
      .progressTask(user.id, TaskCategory.learning, 1)
      .catch((err) =>
        this.logger.error(`Quest progress (learning) failed: ${String(err)}`),
      );

    return { userMessage, assistantMessage };
  }

  /**
   * Stream message response via SSE.
   * Saves user message immediately, streams AI response, then saves assistant message.
   */
  async *sendMessageStream(
    user: User,
    sessionId: string,
    dto: SendMessageDto,
  ): AsyncGenerator<{
    type: string;
    content?: string;
    userMessage?: unknown;
    assistantMessage?: unknown;
  }> {
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

    const isPremium = await this.checkFreshPremiumStatus(user.id);

    if (!isPremium && todayMessageCount >= FREE_DAILY_LIMIT) {
      throw new ForbiddenException(
        "Bạn đã hết lượt tin nhắn miễn phí hôm nay. Nâng cấp Premium để chat không giới hạn! 🌟",
      );
    }

    // 2. Find session
    const session = await this.findSessionById(user.id, sessionId);

    // 3. Save user message
    const userMessage = await this.prisma.aIMessage.create({
      data: {
        sessionId,
        role: MessageRole.user,
        content: dto.content,
      },
    });

    // Emit user message event
    yield { type: "user_message", userMessage };

    // 4. Check AI availability
    if (!this.geminiService.isAvailable) {
      const fallback = "⚠️ AI Coach hiện không khả dụng. Vui lòng thử lại sau.";
      const assistantMessage = await this.prisma.aIMessage.create({
        data: { sessionId, role: MessageRole.assistant, content: fallback },
      });
      yield { type: "done", content: fallback, assistantMessage };
      return;
    }

    // 5. Build context
    const financialContext = await this.buildFinancialContext(user.id);
    const relevantMessages = session.messages
      .filter((m) => m.role !== MessageRole.system)
      .slice(-MAX_HISTORY_MESSAGES);
    const history: Content[] = relevantMessages.map((m) => ({
      role: m.role === MessageRole.assistant ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // 6. Stream from Gemini
    let fullResponse = "";
    try {
      for await (const chunk of this.geminiService.chatStream(
        history,
        dto.content,
        financialContext,
      )) {
        fullResponse += chunk;
        yield { type: "chunk", content: chunk };
      }
    } catch (error) {
      this.logger.error(
        `Gemini streaming error in session ${sessionId}: ${String(error)}`,
      );
      fullResponse =
        fullResponse ||
        "⚠️ AI Coach tạm thời gặp sự cố. Vui lòng thử lại sau ít phút.";
    }

    // 7. Save assistant message
    const assistantMessage = await this.prisma.aIMessage.create({
      data: {
        sessionId,
        role: MessageRole.assistant,
        content: fullResponse,
      },
    });

    // 8. Touch session
    await this.prisma.aIChatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });

    this.logger.log(
      `Stream completed in session ${sessionId} (user: ${user.id})`,
    );

    // Auto-progress daily quest: "Mở AI Coach hỏi 1 câu" (learning)
    this.gamificationService
      .progressTask(user.id, TaskCategory.learning, 1)
      .catch((err) =>
        this.logger.error(`Quest progress (learning) failed: ${String(err)}`),
      );

    yield { type: "done", assistantMessage };
  }

  // ─── Status ──────────────────────────────────────────────────────────────────

  async getStatus(user: User) {
    const isPremium = await this.checkFreshPremiumStatus(user.id);
    const todayMessages = await this.getTodayMessageCount(user.id);

    return {
      available: this.geminiService.isAvailable,
      todayMessages,
      dailyLimit: isPremium ? null : FREE_DAILY_LIMIT,
      isPremium,
      unavailableReason: this.geminiService.isAvailable
        ? undefined
        : "GEMINI_API_KEY chưa được cấu hình. Liên hệ admin để kích hoạt AI Coach.",
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  /**
   * Query fresh premium status directly from DB to avoid stale cached user object.
   * Cached for 60s per user to avoid repeated DB queries during a chat session.
   */
  private async checkFreshPremiumStatus(userId: string): Promise<boolean> {
    const cached = this.premiumCache.get(userId);
    if (cached !== undefined) return cached;

    const freshUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { premiumUntil: true },
    });
    const isPremium = !!(
      freshUser?.premiumUntil && new Date(freshUser.premiumUntil) > new Date()
    );

    this.premiumCache.set(userId, isPremium, PREMIUM_CACHE_TTL);
    return isPremium;
  }

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

  /**
   * Build financial context for AI. Cached for 5 min per user — data doesn't
   * change meaningfully during a conversation session.
   */
  private async buildFinancialContext(userId: string): Promise<string> {
    const cached = this.financialContextCache.get(userId);
    if (cached !== undefined) return cached;

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
      lines.push("## Ví của tôi:");
      if (wallets.length === 0) {
        lines.push("- Chưa có ví nào");
      } else {
        for (const w of wallets) {
          lines.push(
            `- ${w.name} (${w.type}): ${w.balance.toString()} ${w.currency}`,
          );
        }
      }

      // Transaction summary for current month
      lines.push("\n## Giao dịch tháng này:");
      lines.push(`- Thu nhập: ${summary.totalIncome.toString()} VND`);
      lines.push(`- Chi tiêu: ${summary.totalExpense.toString()} VND`);
      lines.push(`- Còn lại (net): ${summary.net.toString()} VND`);
      lines.push(`- Tổng số giao dịch: ${summary.count}`);

      // Saving plan
      if (savingPlan) {
        lines.push("\n## Kế hoạch tiết kiệm:");
        lines.push(
          `- Thu nhập hàng tháng: ${savingPlan.monthlyIncome.toString()} VND`,
        );
        lines.push(`- Chi cố định: ${savingPlan.fixedExpenses.toString()} VND`);
        lines.push(
          `- Chi biến động: ${savingPlan.variableExpenses.toString()} VND`,
        );
        lines.push(`- Tỷ lệ tiết kiệm: ${savingPlan.savingPercent}%`);
        lines.push(
          `- Ngân sách hàng ngày: ${savingPlan.dailyBudget.toString()} VND`,
        );
        lines.push(`- Tiền an toàn: ${savingPlan.safeMoney.toString()} VND`);
      } else {
        lines.push("\n## Kế hoạch tiết kiệm: Chưa thiết lập");
      }

      const context = lines.join("\n");
      this.financialContextCache.set(
        userId,
        context,
        FINANCIAL_CONTEXT_CACHE_TTL,
      );
      return context;
    } catch (error) {
      this.logger.warn(
        `Failed to build financial context for user ${userId}: ${String(error)}`,
      );
      return "";
    }
  }
}
