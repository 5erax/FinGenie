import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PayOS } from '@payos/node';
import type {
  CreatePaymentLinkRequest,
  CreatePaymentLinkResponse,
  PaymentLink,
} from '@payos/node/lib/resources/v2/payment-requests/payment-requests';
import type { WebhookData, Webhook } from '@payos/node/lib/resources/webhooks/webhook';

@Injectable()
export class PayosService implements OnModuleInit {
  private readonly logger = new Logger(PayosService.name);
  private payos!: PayOS;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const clientId = this.config.get<string>('PAYOS_CLIENT_ID');
    const apiKey = this.config.get<string>('PAYOS_API_KEY');
    const checksumKey = this.config.get<string>('PAYOS_CHECKSUM_KEY');

    if (!clientId || !apiKey || !checksumKey) {
      this.logger.warn(
        'PAYOS_CLIENT_ID, PAYOS_API_KEY, or PAYOS_CHECKSUM_KEY not set — PayOS will be unavailable',
      );
      return;
    }

    this.payos = new PayOS({ clientId, apiKey, checksumKey });
    this.logger.log('PayOS initialized');
  }

  get isAvailable(): boolean {
    return !!this.payos;
  }

  async createPaymentLink(params: {
    orderCode: number;
    amount: number;
    description: string;
    returnUrl: string;
    cancelUrl: string;
  }): Promise<CreatePaymentLinkResponse> {
    return this.payos.paymentRequests.create(params as CreatePaymentLinkRequest);
  }

  async verifyWebhook(body: Webhook): Promise<WebhookData> {
    return this.payos.webhooks.verify(body);
  }

  async getPaymentRequest(orderCode: number): Promise<PaymentLink> {
    return this.payos.paymentRequests.get(orderCode);
  }

  async cancelPaymentRequest(orderCode: number, reason?: string): Promise<PaymentLink> {
    return this.payos.paymentRequests.cancel(orderCode, reason);
  }
}
