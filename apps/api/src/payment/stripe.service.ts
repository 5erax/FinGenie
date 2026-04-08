import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";

@Injectable()
export class StripeService implements OnModuleInit {
  private readonly logger = new Logger(StripeService.name);
  private stripe!: Stripe;
  private webhookSecret!: string;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const secretKey = this.config.get<string>("STRIPE_SECRET_KEY");
    const webhookSecret = this.config.get<string>("STRIPE_WEBHOOK_SECRET");

    const isPlaceholder = (v?: string) =>
      !v ||
      v === "placeholder" ||
      v.startsWith("your_") ||
      v.startsWith("sk_test_placeholder");

    if (isPlaceholder(secretKey)) {
      this.logger.warn(
        "STRIPE_SECRET_KEY not configured — Stripe will be unavailable",
      );
      return;
    }

    this.stripe = new Stripe(secretKey!);
    this.webhookSecret = webhookSecret ?? "";

    // Warn if using live key in non-production environment
    if (
      secretKey?.startsWith("sk_live_") &&
      process.env.NODE_ENV !== "production"
    ) {
      this.logger.warn(
        "⚠️ LIVE Stripe key detected in non-production environment! Ensure this is intentional.",
      );
    }

    this.logger.log(
      `Stripe initialized (${secretKey?.startsWith("sk_test_") ? "TEST" : "LIVE"} mode)`,
    );
  }

  get isAvailable(): boolean {
    return !!this.stripe;
  }

  /**
   * Create a Stripe Checkout Session for a subscription plan.
   * Returns the session with its URL for redirecting the user.
   */
  async createCheckoutSession(params: {
    amount: number;
    currency: string;
    description: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: params.currency,
            product_data: {
              name: params.description,
            },
            unit_amount: params.amount, // Stripe expects amount in smallest unit (VND is already integer)
          },
          quantity: 1,
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: params.metadata,
    });
  }

  /**
   * Verify a Stripe webhook signature and parse the event.
   * Throws if signature is invalid.
   */
  constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
  ): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      this.webhookSecret,
    );
  }

  /**
   * Retrieve a checkout session by ID.
   */
  async getCheckoutSession(
    sessionId: string,
  ): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.retrieve(sessionId);
  }
}
