import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
  ServiceUnavailableException,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import type { User } from "@prisma/client";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Public } from "../auth/decorators/public.decorator";
import { PayOSService } from "./payos.service";
import { SubscriptionService, PLAN_PRICING } from "./subscription.service";
import { CreatePaymentDto } from "./dto";

@ApiTags("Payments")
@ApiBearerAuth()
@Controller("payments")
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly payosService: PayOSService,
    private readonly subscriptionService: SubscriptionService,
    private readonly config: ConfigService,
  ) {}

  // ─── POST /payments/create-link ──────────────────────────────────────────

  @Post("create-link")
  @ApiOperation({
    summary: "Create a PayOS payment link for a subscription plan",
  })
  @ApiCreatedResponse({
    description: "Payment link URL and subscription record created",
  })
  async createPaymentLink(
    @CurrentUser() user: User,
    @Body() dto: CreatePaymentDto,
  ) {
    if (!this.payosService.isAvailable) {
      throw new ServiceUnavailableException(
        "Hệ thống thanh toán hiện không khả dụng. Vui lòng thử lại sau.",
      );
    }

    const amount = PLAN_PRICING[dto.plan];
    const orderCode = this.payosService.generateOrderCode();

    const returnUrl =
      dto.returnUrl ??
      this.config.get<string>("PAYMENT_RETURN_URL") ??
      "fingenie://payment/success";

    const cancelUrl =
      dto.cancelUrl ??
      this.config.get<string>("PAYMENT_CANCEL_URL") ??
      "fingenie://payment/cancel";

    // Create PayOS payment link
    const paymentLink = await this.payosService.createPaymentLink({
      orderCode,
      amount,
      description: `FinGenie ${dto.plan}`,
      returnUrl,
      cancelUrl,
    });

    // Create subscription + order in our DB
    // We store orderCode as string in stripeSessionId field for backward compat
    const { subscription, paymentOrder } =
      await this.subscriptionService.createSubscriptionWithOrder({
        userId: user.id,
        plan: dto.plan,
        stripeSessionId: String(orderCode),
        amount,
      });

    return {
      paymentLink: paymentLink.checkoutUrl,
      orderCode,
      subscription,
      order: paymentOrder,
    };
  }

  // ─── POST /payments/webhook ───────────────────────────────────────────────
  // @Public — PayOS calls this without user auth; verify via checksum signature.

  @Public()
  @Post("webhook")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "PayOS webhook receiver (public — no auth required)",
  })
  @ApiOkResponse({ description: "Webhook acknowledged" })
  async handleWebhook(@Body() body: unknown) {
    // Persist raw event first for auditability
    const rawBody = body as Record<string, unknown>;
    const orderCode = String(
      (rawBody?.data as Record<string, unknown>)?.orderCode ?? "unknown",
    );
    const signature = String(rawBody?.signature ?? "");

    try {
      await this.subscriptionService.recordWebhookEvent({
        stripeSessionId: orderCode,
        payload: rawBody,
        signature,
      });
    } catch (recordErr) {
      this.logger.error("Failed to record webhook event", recordErr);
    }

    // Verify signature via PayOS SDK
    let webhookData;
    try {
      webhookData = this.payosService.verifyWebhook(body);
    } catch (verifyErr) {
      this.logger.error(
        `Webhook signature verification FAILED for orderCode=${orderCode}`,
        verifyErr,
      );
      return { success: false, error: "Invalid webhook signature" };
    }

    // Process verified webhook
    try {
      if (webhookData.code === "00") {
        // Payment successful
        await this.subscriptionService.activatePremium(
          String(webhookData.orderCode),
        );
        this.logger.log(
          `Payment successful for orderCode=${webhookData.orderCode}`,
        );
      } else {
        // Payment failed
        await this.subscriptionService.handlePaymentFailed(
          String(webhookData.orderCode),
        );
        this.logger.log(
          `Payment failed for orderCode=${webhookData.orderCode}: ${webhookData.desc}`,
        );
      }
    } catch (processErr) {
      this.logger.error(
        `Webhook processing error for orderCode=${webhookData.orderCode}`,
        processErr,
      );
    }

    return { success: true };
  }

  // ─── GET /payments/status ─────────────────────────────────────────────────

  @Get("status")
  @ApiOperation({
    summary: "Get current premium status for the authenticated user",
  })
  @ApiOkResponse({
    description: "isPremium flag, expiry date, and active subscription",
  })
  async getPremiumStatus(@CurrentUser() user: User) {
    const { isPremium, premiumUntil } =
      await this.subscriptionService.checkPremiumStatus(user.id);
    const subscription = await this.subscriptionService.getActiveSubscription(
      user.id,
    );

    return { isPremium, premiumUntil, subscription };
  }

  // ─── POST /payments/verify/:orderCode ───────────────────────────────────

  @Post("verify/:orderCode")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Verify a payment status via PayOS and activate premium if paid",
  })
  @ApiOkResponse({
    description:
      "Returns the payment status after checking with PayOS directly",
  })
  async verifyPaymentSession(
    @CurrentUser() user: User,
    @Param("orderCode") orderCode: string,
  ) {
    if (!this.payosService.isAvailable) {
      throw new ServiceUnavailableException(
        "Hệ thống thanh toán hiện không khả dụng.",
      );
    }

    // Verify the order belongs to this user
    await this.subscriptionService.verifyOrderOwnership(user.id, orderCode);

    // Check PayOS payment status directly
    const paymentInfo = await this.payosService.getPaymentInfo(orderCode);

    if (paymentInfo.status === "PAID") {
      // Activate premium (idempotent — safe to call multiple times)
      await this.subscriptionService.activatePremium(orderCode);

      const { isPremium, premiumUntil } =
        await this.subscriptionService.checkPremiumStatus(user.id);

      return {
        status: "success" as const,
        isPremium,
        premiumUntil,
        message: "Thanh toán thành công! Bạn đã là Premium.",
      };
    }

    if (
      paymentInfo.status === "EXPIRED" ||
      paymentInfo.status === "CANCELLED"
    ) {
      await this.subscriptionService.handlePaymentFailed(orderCode);
      return {
        status: "expired" as const,
        isPremium: false,
        premiumUntil: null,
        message: "Phiên thanh toán đã hết hạn. Vui lòng thử lại.",
      };
    }

    // Still processing (PENDING)
    return {
      status: "pending" as const,
      isPremium: false,
      premiumUntil: null,
      message: "Đang xử lý thanh toán...",
    };
  }

  // ─── GET /payments/history ────────────────────────────────────────────────

  @Get("history")
  @ApiOperation({
    summary: "Paginated payment history for the authenticated user",
  })
  @ApiOkResponse({
    description: "List of payment orders with subscription details",
  })
  @ApiQuery({
    name: "page",
    required: false,
    description: "Page number (default: 1)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Items per page (default: 20)",
  })
  async getPaymentHistory(
    @CurrentUser() user: User,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.subscriptionService.getPaymentHistory(
      user.id,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  // ─── POST /payments/:orderCode/cancel ────────────────────────────────────

  @Post(":orderCode/cancel")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Cancel a pending payment by order code" })
  @ApiOkResponse({ description: "Cancellation result" })
  async cancelPayment(
    @CurrentUser() user: User,
    @Param("orderCode") orderCode: string,
  ) {
    if (!this.payosService.isAvailable) {
      throw new ServiceUnavailableException(
        "Hệ thống thanh toán hiện không khả dụng. Vui lòng thử lại sau.",
      );
    }

    // Verify the order belongs to this user
    await this.subscriptionService.verifyOrderOwnership(user.id, orderCode);

    // Cancel via PayOS
    try {
      await this.payosService.cancelPaymentLink(orderCode);
    } catch (err) {
      this.logger.warn(`PayOS cancel failed for orderCode=${orderCode}`, err);
    }

    // Mark as failed in our DB
    await this.subscriptionService.handlePaymentFailed(orderCode);

    return { status: "cancelled", orderCode };
  }
}
