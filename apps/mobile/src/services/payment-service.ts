import { api } from "@/lib/api";
import type { Subscription, PaymentOrder } from "@fingenie/shared-types";

export interface CreatePaymentDto {
  plan: "monthly" | "yearly";
  returnUrl?: string;
  cancelUrl?: string;
}

export interface PaymentLink {
  paymentLink: string;
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

export const paymentService = {
  async createPaymentLink(data: CreatePaymentDto): Promise<PaymentLink> {
    const response = await api.post<PaymentLink>("/payments/create-link", data);
    return response.data;
  },

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
    // Backend returns paginated shape; extract the data array
    return response.data.data;
  },

  async cancelPayment(orderCode: string): Promise<void> {
    await api.post(`/payments/${orderCode}/cancel`);
  },

  /**
   * Verify a checkout session with Stripe directly.
   * If paid, activates premium on the backend.
   */
  async verifySession(stripeSessionId: string): Promise<VerifyPaymentResponse> {
    const response = await api.post<VerifyPaymentResponse>(
      `/payments/verify/${stripeSessionId}`,
    );
    return response.data;
  },
};
