import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
  RawBody,
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
import { StripeService } from "./stripe.service";
import { SubscriptionService, PLAN_PRICING } from "./subscription.service";
import { CreatePaymentDto } from "./dto";

@ApiTags("Payments")
@ApiBearerAuth()
@Controller("payments")
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly subscriptionService: SubscriptionService,
    private readonly config: ConfigService,
  ) {}

  // ─── POST /payments/create-link ──────────────────────────────────────────

  @Post("create-link")
  @ApiOperation({
    summary: "Create a Stripe Checkout Session for a subscription plan",
  })
  @ApiCreatedResponse({
    description: "Checkout session URL and subscription record created",
  })
  async createPaymentLink(
    @CurrentUser() user: User,
    @Body() dto: CreatePaymentDto,
  ) {
    if (!this.stripeService.isAvailable) {
      throw new ServiceUnavailableException(
        "Hệ thống thanh toán hiện không khả dụng. Vui lòng thử lại sau.",
      );
    }

    const amount = PLAN_PRICING[dto.plan];

    const successUrl =
      dto.returnUrl ??
      this.config.get<string>("PAYMENT_RETURN_URL") ??
      "fingenie://payment/success";

    const cancelUrl =
      dto.cancelUrl ??
      this.config.get<string>("PAYMENT_CANCEL_URL") ??
      "fingenie://payment/cancel";

    // Create Stripe Checkout Session
    const session = await this.stripeService.createCheckoutSession({
      amount, // VND is already in smallest unit (no cents)
      currency: "vnd",
      description: `FinGenie Premium - ${dto.plan}`,
      successUrl,
      cancelUrl,
      metadata: {
        userId: user.id,
        plan: dto.plan,
      },
    });

    // Create subscription + order in our DB
    const { subscription, paymentOrder } =
      await this.subscriptionService.createSubscriptionWithOrder({
        userId: user.id,
        plan: dto.plan,
        stripeSessionId: session.id,
        amount,
      });

    return {
      paymentLink: session.url,
      subscription,
      order: paymentOrder,
    };
  }

  // ─── POST /payments/webhook ───────────────────────────────────────────────
  // @Public — Stripe calls this without user auth; verify via signature.

  @Public()
  @Post("webhook")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Stripe webhook receiver (public — no auth required)",
  })
  @ApiOkResponse({ description: "Webhook acknowledged" })
  async handleWebhook(
    @RawBody() rawBody: Buffer,
    @Headers("stripe-signature") signature: string,
  ) {
    // Persist raw event first for auditability
    let sessionId = "unknown";
    try {
      const parsed = JSON.parse(rawBody.toString());
      sessionId =
        parsed?.data?.object?.id ?? parsed?.data?.object?.session ?? "unknown";
      await this.subscriptionService.recordWebhookEvent({
        stripeSessionId: sessionId,
        payload: parsed,
        signature: signature ?? "",
      });
    } catch (recordErr) {
      this.logger.error("Failed to record webhook event", recordErr);
    }

    // Verify signature
    let event;
    try {
      event = this.stripeService.constructWebhookEvent(rawBody, signature);
    } catch (verifyErr) {
      this.logger.error(
        `Webhook signature verification FAILED for session=${sessionId}`,
        verifyErr,
      );
      return { success: false, error: "Invalid webhook signature" };
    }

    // Process verified webhook
    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as { id: string };
        await this.subscriptionService.activatePremium(session.id);
      } else if (event.type === "checkout.session.expired") {
        const session = event.data.object as { id: string };
        await this.subscriptionService.handlePaymentFailed(session.id);
      }
    } catch (processErr) {
      this.logger.error(
        `Webhook processing error for event=${event.type}`,
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

  // ─── POST /payments/verify/:sessionId ───────────────────────────────────

  @Post("verify/:sessionId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Verify a Stripe checkout session status and activate premium if paid",
  })
  @ApiOkResponse({
    description:
      "Returns the payment status after checking with Stripe directly",
  })
  async verifyPaymentSession(
    @CurrentUser() user: User,
    @Param("sessionId") sessionId: string,
  ) {
    if (!this.stripeService.isAvailable) {
      throw new ServiceUnavailableException(
        "Hệ thống thanh toán hiện không khả dụng.",
      );
    }

    // Verify the order belongs to this user
    await this.subscriptionService.verifyOrderOwnership(user.id, sessionId);

    // Check Stripe session status directly
    const session = await this.stripeService.getCheckoutSession(sessionId);

    if (session.payment_status === "paid") {
      // Activate premium (idempotent — safe to call multiple times)
      await this.subscriptionService.activatePremium(sessionId);

      const { isPremium, premiumUntil } =
        await this.subscriptionService.checkPremiumStatus(user.id);

      return {
        status: "success" as const,
        isPremium,
        premiumUntil,
        message: "Thanh toán thành công! Bạn đã là Premium.",
      };
    }

    if (session.status === "expired" || session.payment_status === "unpaid") {
      return {
        status: "expired" as const,
        isPremium: false,
        premiumUntil: null,
        message: "Phiên thanh toán đã hết hạn. Vui lòng thử lại.",
      };
    }

    // Still processing or incomplete
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

  // ─── POST /payments/:sessionId/cancel ────────────────────────────────────

  @Post(":sessionId/cancel")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Cancel a pending payment by Stripe session ID" })
  @ApiOkResponse({ description: "Cancellation result" })
  async cancelPayment(
    @CurrentUser() user: User,
    @Param("sessionId") sessionId: string,
  ) {
    if (!this.stripeService.isAvailable) {
      throw new ServiceUnavailableException(
        "Hệ thống thanh toán hiện không khả dụng. Vui lòng thử lại sau.",
      );
    }
    // Verify the order belongs to this user
    await this.subscriptionService.verifyOrderOwnership(user.id, sessionId);
    // Expire the Stripe checkout session
    const session = await this.stripeService.getCheckoutSession(sessionId);
    // Mark as failed in our DB
    await this.subscriptionService.handlePaymentFailed(sessionId);
    return { status: "cancelled", sessionId: session.id };
  }
}
