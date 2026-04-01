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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { PayosService } from './payos.service';
import { SubscriptionService, PLAN_PRICING } from './subscription.service';
import { CreatePaymentDto } from './dto';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly payosService: PayosService,
    private readonly subscriptionService: SubscriptionService,
    private readonly config: ConfigService,
  ) {}

  // ─── POST /payments/create-link ──────────────────────────────────────────

  @Post('create-link')
  @ApiOperation({ summary: 'Create a PayOS payment link for a subscription plan' })
  @ApiCreatedResponse({ description: 'Payment link and subscription record created' })
  async createPaymentLink(
    @CurrentUser() user: User,
    @Body() dto: CreatePaymentDto,
  ) {
    const orderCode = Date.now();
    const amount = PLAN_PRICING[dto.plan];

    const returnUrl =
      dto.returnUrl ??
      this.config.get<string>('PAYMENT_RETURN_URL') ??
      'fingenie://payment/success';

    const cancelUrl =
      dto.cancelUrl ??
      this.config.get<string>('PAYMENT_CANCEL_URL') ??
      'fingenie://payment/cancel';

    const { subscription, paymentOrder } =
      await this.subscriptionService.createSubscriptionWithOrder({
        userId: user.id,
        plan: dto.plan,
        payosOrderId: orderCode.toString(),
        amount,
      });

    const paymentLink = await this.payosService.createPaymentLink({
      orderCode,
      amount,
      description: `FinGenie ${dto.plan}`,
      returnUrl,
      cancelUrl,
    });

    return { paymentLink, subscription, order: paymentOrder };
  }

  // ─── POST /payments/webhook ───────────────────────────────────────────────
  // @Public — PayOS calls this without user auth; always respond 200.

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'PayOS webhook receiver (public — no auth required)' })
  @ApiOkResponse({ description: 'Webhook acknowledged' })
  async handleWebhook(@Body() body: any) {
    try {
      // Persist raw event first for auditability / replay
      await this.subscriptionService.recordWebhookEvent({
        payosOrderId: String(body?.data?.orderCode ?? ''),
        payload: body,
        signature: body?.signature ?? '',
      });

      // Verify signature and extract structured data
      const data = await this.payosService.verifyWebhook(body);

      if (data.code === '00') {
        await this.subscriptionService.activatePremium(data.orderCode.toString());
      } else {
        await this.subscriptionService.handlePaymentFailed(data.orderCode.toString());
      }
    } catch (err) {
      // Log but never throw — webhooks must always return 200 to PayOS
      this.logger.error('Webhook processing error', err);
    }

    return { success: true };
  }

  // ─── GET /payments/status ─────────────────────────────────────────────────

  @Get('status')
  @ApiOperation({ summary: 'Get current premium status for the authenticated user' })
  @ApiOkResponse({ description: 'isPremium flag, expiry date, and active subscription' })
  async getPremiumStatus(@CurrentUser() user: User) {
    const { isPremium, premiumUntil } =
      await this.subscriptionService.checkPremiumStatus(user.id);
    const subscription = await this.subscriptionService.getActiveSubscription(user.id);

    return { isPremium, premiumUntil, subscription };
  }

  // ─── GET /payments/history ────────────────────────────────────────────────

  @Get('history')
  @ApiOperation({ summary: 'Paginated payment history for the authenticated user' })
  @ApiOkResponse({ description: 'List of payment orders with subscription details' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20)' })
  async getPaymentHistory(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.subscriptionService.getPaymentHistory(
      user.id,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  // ─── POST /payments/:orderCode/cancel ────────────────────────────────────

  @Post(':orderCode/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a pending PayOS payment by orderCode' })
  @ApiOkResponse({ description: 'Cancellation result from PayOS' })
  async cancelPayment(@Param('orderCode') orderCode: string) {
    return this.payosService.cancelPaymentRequest(Number(orderCode));
  }
}
