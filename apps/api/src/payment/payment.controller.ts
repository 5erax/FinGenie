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
  Req,
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

  // ─── POST /payments/create-checkout ───────────────────────────────────────

  @Post("create-checkout")
  @ApiOperation({
    summary: "Create a Stripe Checkout session for a subscription plan",
  })
  @ApiCreatedResponse({
    description: "Stripe checkout URL and subscription record created",
  })
  async createCheckout(
    @CurrentUser() user: User,
    @Body() dto: CreatePaymentDto,
  ) {
    if (!this.stripeService.isAvailable) {
      throw new ServiceUnavailableException(
        "Hệ thống thanh toán hiện không khả dụng. Vui lòng thử lại sau.",
      );
    }

    const amount = PLAN_PRICING[dto.plan];

    const returnUrl =
      dto.returnUrl ??
      this.config.get<string>("PAYMENT_RETURN_URL") ??
      "fingenie://payment/success";

    const cancelUrl =
      dto.cancelUrl ??
      this.config.get<string>("PAYMENT_CANCEL_URL") ??
      "fingenie://payment/cancel";

    // Create Stripe Checkout session
    const session = await this.stripeService.createCheckoutSession({
      amount, // VND is zero-decimal currency in Stripe
      currency: "vnd",
      description: `FinGenie Premium - ${dto.plan === "monthly" ? "Tháng" : "Năm"}`,
      successUrl: returnUrl,
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
      checkoutUrl: session.url,
      sessionId: session.id,
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
    summary:
      "Stripe webhook receiver (public — no auth, verified via signature)",
  })
  @ApiOkResponse({ description: "Webhook acknowledged" })
  async handleWebhook(
    @Req() req: { rawBody: Buffer },
    @Headers("stripe-signature") signature: string,
  ) {
    if (!this.stripeService.isAvailable) {
      this.logger.warn("Stripe webhook received but Stripe is not configured");
      return { success: false, error: "Stripe not configured" };
    }

    // Verify signature and parse event
    let event;
    try {
      event = this.stripeService.constructWebhookEvent(req.rawBody, signature);
    } catch (err) {
      this.logger.error(
        `Stripe webhook signature verification FAILED: ${String(err)}`,
      );
      return { success: false, error: "Invalid webhook signature" };
    }

    // Record raw event for audit
    try {
      const sessionId = (event.data.object as { id?: string })?.id ?? event.id;
      await this.subscriptionService.recordWebhookEvent({
        stripeSessionId: sessionId,
        payload: event as unknown as Record<string, unknown>,
        signature,
      });
    } catch (recordErr) {
      this.logger.error("Failed to record Stripe webhook event", recordErr);
    }

    // Process the event
    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as {
            id: string;
            payment_status: string;
          };
          if (session.payment_status === "paid") {
            await this.subscriptionService.activatePremium(session.id);
            this.logger.log(
              `Stripe payment successful for session ${session.id}`,
            );
          }
          break;
        }

        case "checkout.session.expired": {
          const session = event.data.object as { id: string };
          await this.subscriptionService.handlePaymentFailed(session.id);
          this.logger.log(`Stripe session expired: ${session.id}`);
          break;
        }

        default:
          this.logger.log(`Unhandled Stripe event: ${event.type}`);
      }
    } catch (processErr) {
      this.logger.error(
        `Stripe webhook processing error for event ${event.id}`,
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

  // ─── POST /payments/verify/:sessionId ─────────────────────────────────────

  @Post("verify/:sessionId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Verify a Stripe payment status and activate premium if paid",
  })
  @ApiOkResponse({
    description: "Returns the payment status after checking with Stripe",
  })
  async verifyPayment(
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

    if (session.status === "expired") {
      await this.subscriptionService.handlePaymentFailed(sessionId);
      return {
        status: "expired" as const,
        isPremium: false,
        premiumUntil: null,
        message: "Phiên thanh toán đã hết hạn. Vui lòng thử lại.",
      };
    }

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

  // ─── POST /payments/:sessionId/cancel ─────────────────────────────────────

  @Post(":sessionId/cancel")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Cancel a pending payment" })
  @ApiOkResponse({ description: "Cancellation result" })
  async cancelPayment(
    @CurrentUser() user: User,
    @Param("sessionId") sessionId: string,
  ) {
    // Verify the order belongs to this user
    await this.subscriptionService.verifyOrderOwnership(user.id, sessionId);

    // Mark as failed in our DB
    await this.subscriptionService.handlePaymentFailed(sessionId);

    return { status: "cancelled", sessionId };
  }
}
