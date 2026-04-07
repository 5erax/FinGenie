import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

// PayOS SDK — default export
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PayOSLib = require("@payos/node");

export interface PayOSPaymentLink {
  bin: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  description: string;
  orderCode: number;
  currency: string;
  paymentLinkId: string;
  status: string;
  checkoutUrl: string;
  qrCode: string;
}

export interface PayOSWebhookData {
  orderCode: number;
  amount: number;
  description: string;
  accountNumber: string;
  reference: string;
  transactionDateTime: string;
  currency: string;
  paymentLinkId: string;
  code: string;
  desc: string;
  counterAccountBankId: string;
  counterAccountBankName: string;
  counterAccountName: string;
  counterAccountNumber: string;
  virtualAccountName: string;
  virtualAccountNumber: string;
}

@Injectable()
export class PayOSService implements OnModuleInit {
  private readonly logger = new Logger(PayOSService.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private payos: any = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const clientId = this.config.get<string>("PAYOS_CLIENT_ID");
    const apiKey = this.config.get<string>("PAYOS_API_KEY");
    const checksumKey = this.config.get<string>("PAYOS_CHECKSUM_KEY");

    const isPlaceholder = (v?: string) =>
      !v || v === "placeholder" || v.startsWith("your_");

    if (isPlaceholder(clientId) || isPlaceholder(apiKey)) {
      this.logger.warn(
        "PayOS credentials not configured — payments will be unavailable",
      );
      return;
    }

    const PayOS = PayOSLib.PayOS ?? PayOSLib.default ?? PayOSLib;
    this.payos = new PayOS({
      clientId: clientId!,
      apiKey: apiKey!,
      checksumKey: checksumKey!,
    });
    this.logger.log("PayOS initialized");
  }

  get isAvailable(): boolean {
    return !!this.payos;
  }

  /**
   * Generate a unique order code for PayOS (positive integer).
   * Uses timestamp + random suffix to avoid collisions.
   */
  generateOrderCode(): number {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    // Take last 10 digits of timestamp + 3 random digits → max 13 digits
    return Number(
      String(timestamp).slice(-10) + String(random).padStart(3, "0"),
    );
  }

  /**
   * Create a PayOS payment link for a subscription plan.
   */
  async createPaymentLink(params: {
    orderCode: number;
    amount: number;
    description: string;
    returnUrl: string;
    cancelUrl: string;
  }): Promise<PayOSPaymentLink> {
    const result = await this.payos.paymentRequests.create({
      orderCode: params.orderCode,
      amount: params.amount,
      description: params.description,
      items: [
        {
          name: params.description,
          quantity: 1,
          price: params.amount,
        },
      ],
      returnUrl: params.returnUrl,
      cancelUrl: params.cancelUrl,
    });

    return result as PayOSPaymentLink;
  }

  /**
   * Verify webhook data signature from PayOS.
   * Returns the verified webhook data or throws if invalid.
   */
  verifyWebhook(body: unknown): PayOSWebhookData {
    return this.payos.webhooks.verify(body) as PayOSWebhookData;
  }

  /**
   * Get payment link information by order code.
   */
  async getPaymentInfo(orderCode: number | string): Promise<PayOSPaymentLink> {
    return this.payos.paymentRequests.get(
      String(orderCode),
    ) as Promise<PayOSPaymentLink>;
  }

  /**
   * Cancel a payment link by order code.
   */
  async cancelPaymentLink(
    orderCode: number | string,
    reason?: string,
  ): Promise<void> {
    await this.payos.paymentRequests.cancel(String(orderCode), {
      cancellationReason: reason ?? "Người dùng hủy thanh toán",
    });
  }
}
