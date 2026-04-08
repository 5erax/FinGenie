import { api } from "@/lib/api";
import type { Subscription, PaymentOrder } from "@fingenie/shared-types";

export interface CreatePaymentDto {
  plan: "monthly" | "yearly";
  returnUrl?: string;
  cancelUrl?: string;
}

export interface PaymentLink {
  paymentLink: string;
  orderCode: number;
  subscription: Subscription;
  order: PaymentOrder;
}

export interface StripeCheckout {
  checkoutUrl: string;
  sessionId: string;
  subscription: Subscription;
  order: PaymentOrder;
}

export interface PaymentStatusResponse {
  subscription: Subscription | null;
  isPremium: boolean;
}

export interface VerifyPaymentResponse {
  status: "success" | "pending" | "expired";
  isPremium: boolean;
  premiumUntil: string | null;
  message: string;
}

export type PaymentMethod = "payos" | "stripe";

export const paymentService = {
  // ─── PayOS ──────────────────────────────────────────────────────────────────

  async createPaymentLink(data: CreatePaymentDto): Promise<PaymentLink> {
    const response = await api.post<PaymentLink>("/payments/create-link", data);
    return response.data;
  },

  async verifyPayment(orderCode: string): Promise<VerifyPaymentResponse> {
    const response = await api.post<VerifyPaymentResponse>(
      `/payments/verify/${orderCode}`,
    );
    return response.data;
  },

  async cancelPayment(orderCode: string): Promise<void> {
    await api.post(`/payments/${orderCode}/cancel`);
  },

  // ─── Stripe ─────────────────────────────────────────────────────────────────

  async createStripeCheckout(data: CreatePaymentDto): Promise<StripeCheckout> {
    const response = await api.post<StripeCheckout>(
      "/payments/stripe/create-checkout",
      data,
    );
    return response.data;
  },

  async verifyStripePayment(sessionId: string): Promise<VerifyPaymentResponse> {
    const response = await api.post<VerifyPaymentResponse>(
      `/payments/stripe/verify/${sessionId}`,
    );
    return response.data;
  },

  // ─── Common ─────────────────────────────────────────────────────────────────

  async getStatus(): Promise<PaymentStatusResponse> {
    const response = await api.get<PaymentStatusResponse>("/payments/status");
    return response.data;
  },

  async getHistory(): Promise<PaymentOrder[]> {
    const response = await api.get<{
      data: PaymentOrder[];
      total: number;
      page: number;
      limit: number;
    }>("/payments/history");
    return response.data.data;
  },
};
